import type { AxiosInstance } from "axios";
import { runTenantFullSync } from "./tenantOfflineSync";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function startOfflineOutboxFlush(getClient: () => AxiosInstance) {
  if (typeof window === "undefined" || !isTauri()) {
    return () => {};
  }
  const flush = async () => {
    if (!navigator.onLine) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const pending = await invoke<
        Array<{
          id: string;
          method: string;
          url: string;
          query_json: string | null;
          body_json: string | null;
          headers_json: string;
        }>
      >("offline_list_pending");
      const client = getClient();
      let progressed = false;
      for (const row of pending) {
        try {
          const headers = row.headers_json ? JSON.parse(row.headers_json) : {};
          await client.request({
            method: row.method as never,
            url: row.url,
            params: row.query_json ? JSON.parse(row.query_json) : undefined,
            data: row.body_json ? JSON.parse(row.body_json) : undefined,
            headers,
          });
          await invoke("offline_mark_done", { id: row.id });
          progressed = true;
        } catch {
          break;
        }
      }
      if (progressed && typeof localStorage !== "undefined") {
        const tid = localStorage.getItem("currentTenantId");
        if (tid) {
          await runTenantFullSync(client, tid);
        }
      }
    } catch {}
  };
  window.addEventListener("online", flush);
  const t = window.setInterval(flush, 30_000);
  void flush();
  return () => {
    window.removeEventListener("online", flush);
    window.clearInterval(t);
  };
}
