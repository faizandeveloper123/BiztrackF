use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::Duration;

use rusqlite::{params, Connection};
use serde::Serialize;
use tauri::{AppHandle, Manager, RunEvent};

pub struct NextChild(pub Mutex<Option<Child>>);

const NEXT_PORT: u16 = 38447;

#[derive(Serialize)]
pub struct EnqueueDone {
    pub id: String,
}

fn db_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("offline.sqlite3"))
}

fn conn(app: &AppHandle) -> Result<Connection, String> {
    let p = db_path(app)?;
    let c = Connection::open(p).map_err(|e| e.to_string())?;
    init_schema(&c).map_err(|e| e.to_string())?;
    Ok(c)
}

fn init_schema(c: &Connection) -> rusqlite::Result<()> {
    c.execute_batch(
        "CREATE TABLE IF NOT EXISTS outbox (
            id TEXT PRIMARY KEY NOT NULL,
            method TEXT NOT NULL,
            url TEXT NOT NULL,
            query_json TEXT,
            body_json TEXT,
            headers_json TEXT NOT NULL,
            tenant_id TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS http_cache (
            k TEXT PRIMARY KEY NOT NULL,
            v TEXT NOT NULL,
            updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_aggregate (
            tenant_id TEXT NOT NULL,
            route_key TEXT NOT NULL,
            payload TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (tenant_id, route_key)
        );",
    )?;
    Ok(())
}

#[tauri::command]
fn offline_enqueue(
    app: AppHandle,
    method: String,
    url: String,
    query_json: Option<String>,
    body_json: Option<String>,
    headers_json: String,
    tenant_id: Option<String>,
) -> Result<EnqueueDone, String> {
    let c = conn(&app)?;
    let id = uuid::Uuid::new_v4().to_string();
    c.execute(
        "INSERT INTO outbox (id, method, url, query_json, body_json, headers_json, tenant_id, status, created_at)
         VALUES (?1,?2,?3,?4,?5,?6,?7,'pending',strftime('%s','now'))",
        params![
            &id,
            &method,
            &url,
            &query_json,
            &body_json,
            &headers_json,
            &tenant_id
        ],
    )
    .map_err(|e| e.to_string())?;
    Ok(EnqueueDone { id })
}

#[tauri::command]
fn offline_list_pending(app: AppHandle) -> Result<Vec<serde_json::Value>, String> {
    let c = conn(&app)?;
    let mut stmt = c
        .prepare("SELECT id, method, url, query_json, body_json, headers_json, tenant_id, created_at FROM outbox WHERE status='pending' ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "method": row.get::<_, String>(1)?,
                "url": row.get::<_, String>(2)?,
                "query_json": row.get::<_, Option<String>>(3)?,
                "body_json": row.get::<_, Option<String>>(4)?,
                "headers_json": row.get::<_, String>(5)?,
                "tenant_id": row.get::<_, Option<String>>(6)?,
                "created_at": row.get::<_, i64>(7)?,
            }))
        })
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[tauri::command]
fn offline_mark_done(app: AppHandle, id: String) -> Result<(), String> {
    let c = conn(&app)?;
    c.execute("UPDATE outbox SET status='done' WHERE id=?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn offline_cache_put(app: AppHandle, key: String, value: String) -> Result<(), String> {
    let c = conn(&app)?;
    c.execute(
        "INSERT INTO http_cache (k,v,updated_at) VALUES (?1,?2,strftime('%s','now'))
         ON CONFLICT(k) DO UPDATE SET v=excluded.v, updated_at=excluded.updated_at",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn offline_cache_get(app: AppHandle, key: String) -> Result<Option<String>, String> {
    let c = conn(&app)?;
    match c.query_row(
        "SELECT v FROM http_cache WHERE k=?1",
        params![key],
        |row| row.get::<_, String>(0),
    ) {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn offline_cache_clear_tenant_prefix(app: AppHandle, prefix: String) -> Result<(), String> {
    let c = conn(&app)?;
    let p = format!("{}%", prefix);
    c.execute("DELETE FROM http_cache WHERE k LIKE ?1", params![p])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn offline_aggregate_put(
    app: AppHandle,
    tenant_id: String,
    route_key: String,
    payload: String,
) -> Result<(), String> {
    let c = conn(&app)?;
    c.execute(
        "INSERT INTO sync_aggregate (tenant_id, route_key, payload, updated_at)
         VALUES (?1,?2,?3,strftime('%s','now'))
         ON CONFLICT(tenant_id, route_key) DO UPDATE SET
           payload=excluded.payload, updated_at=excluded.updated_at",
        params![tenant_id, route_key, payload],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn offline_aggregate_get(
    app: AppHandle,
    tenant_id: String,
    route_key: String,
) -> Result<Option<String>, String> {
    let c = conn(&app)?;
    match c.query_row(
        "SELECT payload FROM sync_aggregate WHERE tenant_id=?1 AND route_key=?2",
        params![tenant_id, route_key],
        |row| row.get::<_, String>(0),
    ) {
        Ok(v) => Ok(Some(v)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn offline_aggregate_clear_tenant(app: AppHandle, tenant_id: String) -> Result<(), String> {
    let c = conn(&app)?;
    c.execute(
        "DELETE FROM sync_aggregate WHERE tenant_id=?1",
        params![tenant_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn next_home(app: &AppHandle) -> Result<PathBuf, String> {
    let res = app.path().resource_dir().map_err(|e| e.to_string())?;
    let bundled = res.join("bundled").join("next");
    if bundled.join("server.js").exists() {
        return Ok(bundled);
    }
    let flat = res.join("next");
    if flat.join("server.js").exists() {
        return Ok(flat);
    }
    Err(format!(
        "Next bundle missing (expected server.js under {:?} or {:?})",
        bundled, flat
    ))
}

fn wait_for_port(port: u16) -> bool {
    for _ in 0..240 {
        if std::net::TcpStream::connect(("127.0.0.1", port)).is_ok() {
            return true;
        }
        thread::sleep(Duration::from_millis(250));
    }
    false
}

fn start_next_process(app: &AppHandle) -> Result<Child, String> {
    let home = next_home(app)?;
    let server_js = home.join("server.js");
    if !server_js.exists() {
        return Err(format!(
            "Embedded Next.js missing at {}. From repo root run: cd desktop && npm run prepare-next && npm run build",
            server_js.display()
        ));
    }
    let mut cmd = Command::new("node");
    cmd.arg(&server_js)
        .current_dir(&home)
        .env("PORT", NEXT_PORT.to_string())
        .env("HOSTNAME", "127.0.0.1")
        .env("NODE_ENV", "production")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    let mut child = cmd.spawn().map_err(|e| {
        format!("Could not start Node for embedded Next.js (install Node and add to PATH). {e}")
    })?;
    if let Some(stdout) = child.stdout.take() {
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines().flatten() {
                eprintln!("[next] {line}");
            }
        });
    }
    if let Some(stderr) = child.stderr.take() {
        thread::spawn(move || {
            for line in BufReader::new(stderr).lines().flatten() {
                eprintln!("[next:err] {line}");
            }
        });
    }
    Ok(child)
}

pub fn run() {
    tauri::Builder::default()
        .manage(NextChild(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            offline_enqueue,
            offline_list_pending,
            offline_mark_done,
            offline_cache_put,
            offline_cache_get,
            offline_cache_clear_tenant_prefix,
            offline_aggregate_put,
            offline_aggregate_get,
            offline_aggregate_clear_tenant,
        ])
        .setup(|app| {
            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                let mut child = start_next_process(&handle)?;
                if !wait_for_port(NEXT_PORT) {
                    let _ = child.kill();
                    return Err("Embedded Next.js did not open its port in time.".into());
                }
                *handle.state::<NextChild>().0.lock().unwrap() = Some(child);
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|handle, event| {
            if let RunEvent::Exit = event {
                if let Some(s) = handle.try_state::<NextChild>() {
                    let mut g = s.0.lock().unwrap();
                    if let Some(mut c) = g.take() {
                        let _ = c.kill();
                    }
                }
            }
        });
}
