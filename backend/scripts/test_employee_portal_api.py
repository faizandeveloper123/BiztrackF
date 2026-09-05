#!/usr/bin/env python3
import json
import os
import sys
import uuid
from datetime import date, timedelta

backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)

from dotenv import load_dotenv

load_dotenv(os.path.join(backend_dir, ".env"))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from src.main import app
from src.core.auth import get_password_hash

TEST_EMAIL = os.getenv("TEST_LOGIN_EMAIL", "portal.test@example.com")
TEST_PASSWORD = os.getenv("TEST_LOGIN_PASSWORD", "PortalTest@123")

client = TestClient(app)
session = {"token": None, "tenant_id": None, "failures": [], "passed": 0, "five_hundreds": []}


def bootstrap_user():
    engine = create_engine(os.environ["DATABASE_URL"])
    pwd_hash = get_password_hash(TEST_PASSWORD)
    with engine.begin() as conn:
        tenant = conn.execute(text("SELECT id FROM tenants LIMIT 1")).fetchone()
        if not tenant:
            raise RuntimeError("No tenant in database")
        tenant_id = str(tenant[0])
        user = conn.execute(
            text('SELECT id FROM users WHERE email = :email'),
            {"email": TEST_EMAIL},
        ).fetchone()
        if user:
            user_id = str(user[0])
            conn.execute(
                text('UPDATE users SET "hashedPassword" = :hp, "isActive" = true WHERE id = :id'),
                {"hp": pwd_hash, "id": user_id},
            )
        else:
            user_id = str(uuid.uuid4())
            conn.execute(
                text(
                    """
                    INSERT INTO users (id, tenant_id, "userName", email, "firstName", "lastName", "hashedPassword", "userRole", "isActive")
                    VALUES (:id, :tid, :uname, :email, 'Portal', 'Tester', :hp, 'team_member', true)
                    """
                ),
                {
                    "id": user_id,
                    "tid": tenant_id,
                    "uname": "portal_tester",
                    "email": TEST_EMAIL,
                    "hp": pwd_hash,
                },
            )
        tu = conn.execute(
            text('SELECT id FROM tenant_users WHERE "userId" = :uid AND tenant_id = :tid'),
            {"uid": user_id, "tid": tenant_id},
        ).fetchone()
        if not tu:
            role = conn.execute(
                text("SELECT id FROM roles WHERE tenant_id = :tid AND name = 'owner' LIMIT 1"),
                {"tid": tenant_id},
            ).fetchone()
            role_id = str(role[0]) if role else None
            conn.execute(
                text(
                    """
                    INSERT INTO tenant_users (id, tenant_id, "userId", role_id, role, "isActive", "joinedAt")
                    VALUES (:id, :tid, :uid, :rid, 'owner', true, NOW())
                    """
                ),
                {"id": str(uuid.uuid4()), "tid": tenant_id, "uid": user_id, "rid": role_id},
            )
        session["tenant_id"] = tenant_id
    print(f"Test user ready: {TEST_EMAIL} / tenant {session['tenant_id']}")


def headers():
    h = {"Authorization": f"Bearer {session['token']}"}
    if session["tenant_id"]:
        h["X-Tenant-ID"] = session["tenant_id"]
    return h


def call(name, method, path, *, json_body=None, expect=(200, 201), allow=()):
    allowed = set(expect) | set(allow)
    try:
        if method == "GET":
            r = client.get(path, headers=headers())
        elif method == "POST":
            r = client.post(path, headers=headers(), json=json_body if json_body is not None else {})
        elif method == "PUT":
            r = client.put(path, headers=headers(), json=json_body if json_body is not None else {})
        else:
            raise ValueError(method)
    except Exception as e:
        session["failures"].append((name, "EXCEPTION", str(e)))
        return None
    if r.status_code >= 500:
        session["five_hundreds"].append((name, r.status_code, r.text[:800]))
    if r.status_code not in allowed:
        session["failures"].append((name, r.status_code, r.text[:800]))
        return None
    session["passed"] += 1
    try:
        return r.json()
    except Exception:
        return {}


def login():
    bootstrap_user()
    r = client.post("/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    if r.status_code != 200:
        print(f"LOGIN FAILED {r.status_code}: {r.text[:300]}")
        sys.exit(1)
    session["token"] = r.json()["token"]
    print(f"Logged in as {TEST_EMAIL}")


def main():
    login()
    today = date.today().isoformat()
    end = (date.today() + timedelta(days=2)).isoformat()

    call("GET /employee-portal/dashboard", "GET", "/employee-portal/dashboard")
    call("GET /employee-portal/me", "GET", "/employee-portal/me")
    call(
        "PUT /employee-portal/me",
        "PUT",
        "/employee-portal/me",
        json_body={"phone": "+4400000000", "emergencyContact": "Test Contact"},
    )
    call("GET /employee-portal/leave-requests", "GET", "/employee-portal/leave-requests")
    leave = call(
        "POST /employee-portal/leave-requests",
        "POST",
        "/employee-portal/leave-requests",
        json_body={
            "leaveType": "annual",
            "startDate": today,
            "endDate": end,
            "totalDays": 2,
            "reason": "API test leave",
        },
        expect=(200, 201),
    )
    call("GET /employee-portal/time-entries", "GET", f"/employee-portal/time-entries?start_date={today}&end_date={today}")
    call("GET /employee-portal/time-tracking/current-session", "GET", "/employee-portal/time-tracking/current-session")
    started = call(
        "POST /employee-portal/time-tracking/start",
        "POST",
        "/employee-portal/time-tracking/start",
        json_body={},
        expect=(200, 201),
        allow=(400,),
    )
    sess = started.get("session") if isinstance(started, dict) else None
    if sess and sess.get("id"):
        call(
            "POST /employee-portal/time-tracking/stop",
            "POST",
            f"/employee-portal/time-tracking/stop/{sess['id']}",
            json_body={"notes": "test stop"},
            expect=(200, 201),
        )
    call("GET /employee-portal/tasks", "GET", "/employee-portal/tasks")
    task = call(
        "POST /employee-portal/tasks",
        "POST",
        "/employee-portal/tasks",
        json_body={
            "title": "Portal API test task",
            "description": "automated test",
            "priority": "medium",
        },
        expect=(200, 201),
        allow=(400,),
    )
    task_id = task.get("id") if isinstance(task, dict) else None
    if not task_id:
        tasks = call("GET /employee-portal/tasks (retry)", "GET", "/employee-portal/tasks")
        if isinstance(tasks, dict) and tasks.get("tasks"):
            task_id = tasks["tasks"][0].get("id")
    if task_id:
        call(
            "POST /employee-portal/tasks/{id}/log",
            "POST",
            f"/employee-portal/tasks/{task_id}/log",
            json_body={"hours": 0.5, "notes": "test log", "status": "in_progress"},
            expect=(200, 201),
        )
        call(
            "PUT /employee-portal/tasks/{id}/complete",
            "PUT",
            f"/employee-portal/tasks/{task_id}/complete",
            json_body={},
            expect=(200, 201),
        )
    call("GET /employee-portal/devices", "GET", "/employee-portal/devices")
    dash = call("GET /employee-portal/dashboard (employee id)", "GET", "/employee-portal/dashboard")
    employee_id = dash.get("employee", {}).get("id") if isinstance(dash, dict) else None
    if employee_id:
        device = call(
            "POST /employee-portal/devices",
            "POST",
            "/employee-portal/devices",
            json_body={
                "employeeId": employee_id,
                "name": "Test Laptop",
                "deviceType": "laptop",
                "serialNumber": "TEST-SN-001",
                "model": "MacBook Test",
            },
            expect=(200, 201),
        )
        dev_id = device.get("id") if isinstance(device, dict) else None
        if dev_id:
            call(
                "PUT /employee-portal/devices/{id}",
                "PUT",
                f"/employee-portal/devices/{dev_id}",
                json_body={"status": "returned", "returnedAt": f"{today}T12:00:00"},
                expect=(200, 201),
            )
    call("GET /employee-portal/devices?all_devices=true", "GET", "/employee-portal/devices?all_devices=true")
    if isinstance(leave, dict) and leave.get("id"):
        call(
            "POST /employee-portal/leave-requests/{id}/review",
            "POST",
            f"/employee-portal/leave-requests/{leave['id']}/review",
            json_body={"action": "approve"},
            expect=(200, 201),
        )

    print(f"\nPassed: {session['passed']}")
    if session["five_hundreds"]:
        print(f"500 ERRORS: {len(session['five_hundreds'])}")
        for name, code, body in session["five_hundreds"]:
            print(f"\n!!! {name} -> {code} !!!\n{body}")
    if session["failures"]:
        print(f"Other failures: {len(session['failures'])}")
        for name, code, body in session["failures"]:
            print(f"\n--- {name} -> {code} ---\n{body}")
        sys.exit(1)
    if session["five_hundreds"]:
        sys.exit(1)
    print("All employee-portal API checks passed — no 500 errors.")


if __name__ == "__main__":
    main()
