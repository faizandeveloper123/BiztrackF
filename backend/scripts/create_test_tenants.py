#!/usr/bin/env python3
"""Create test tenants for every module in testing mode (no Stripe needed).

Each tenant gets a dedicated owner user with fixed credentials so you can log
in on the login page and test that module. All tenants are created with
stripe_required=False so NO payment/Stripe is required to access them.
"""
import os
import sys
import uuid
from datetime import datetime, timedelta

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)

env_path = os.path.join(backend_dir, ".env")
load_dotenv(env_path)

# Common password for all test owners
TEST_PASSWORD = "Test@123"

TENANTS = [
    {"name": "Agency Test", "plan_type": "agency", "email": "agency@test.com"},
    {"name": "Commerce Test", "plan_type": "commerce", "email": "commerce@test.com"},
    {"name": "Workshop Test", "plan_type": "workshop", "email": "workshop@test.com"},
    {"name": "NGO Test", "plan_type": "ngo", "email": "ngo@test.com"},
    {"name": "Healthcare Test", "plan_type": "healthcare", "email": "healthcare@test.com"},
    {"name": "LMS Test", "plan_type": "lms", "email": "lms@test.com"},
]

USERNAME_SUFFIX = {"agency": "agency", "commerce": "commerce", "workshop": "workshop",
                   "ngo": "ngo", "healthcare": "healthcare", "lms": "lms"}


def get_engine():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    return create_engine(database_url)


def main():
    from src.models.registry import register_all_models
    register_all_models()

    from src.config.database import (
        create_tables, create_tenant, create_subscription, create_user,
        get_plan_by_id, get_tenant_by_domain,
    )
    from src.services.rbac_service import RBACService
    from src.api.v1.rbac.tenant_users.logic import create_tenant_user
    from src.services.ledger_seeding import create_default_chart_of_accounts
    from src.core.auth import get_password_hash
    from src.models.common import SubscriptionStatus

    engine = get_engine()
    print("Connected to database.")

    # Ensure tables exist
    inspector = __import__("sqlalchemy").inspect(engine)
    if "tenants" not in inspector.get_table_names():
        create_tables()

    from src.config.database import SessionLocal
    db = SessionLocal()

    created = []
    try:
        for item in TENANTS:
            name = item["name"]
            plan_type = item["plan_type"]
            email = item["email"]

            # Skip if tenant already exists
            existing = get_tenant_by_domain(name.lower().replace(" ", "-") + "-test", db)
            if existing:
                print(f"  ~ Tenant '{name}' already exists, skipping.")
                created.append({"tenant": name, "email": email, "password": TEST_PASSWORD, "status": "exists"})
                continue

            # Find the plan for this module
            from src.models.platform import Plan
            plan = db.query(Plan).filter(Plan.planType == plan_type).first()
            if not plan:
                print(f"  ! No plan found for '{plan_type}', skipping '{name}'.")
                continue

            # Create user (owner) with fixed credentials
            user = None
            user_data = {
                "userName": f"test{USERNAME_SUFFIX[plan_type]}",
                "email": email,
                "firstName": "Test",
                "lastName": plan_type.capitalize(),
                "hashedPassword": get_password_hash(TEST_PASSWORD),
                "userRole": "team_member",
                "isActive": True,
            }
            try:
                user = create_user(user_data, db)
            except ValueError as e:
                from src.config.database import get_user_by_email
                user = get_user_by_email(email, db)
                print(f"  ! {e}; reusing existing user.")

            # Create tenant (testing mode: no Stripe required)
            tenant_data = {
                "name": name,
                "domain": name.lower().replace(" ", "-") + "-test",
                "description": f"{name} workspace (testing mode)",
                "stripe_required": False,
                "settings": {
                    "plan_type": plan.planType,
                    "features": plan.features or [],
                    "max_projects": plan.maxProjects,
                    "max_users": plan.maxUsers
                }
            }
            tenant = create_tenant(tenant_data, db)

            # Active subscription (far-future expiry)
            subscription_data = {
                "tenant_id": tenant.id,
                "planId": plan.id,
                "status": SubscriptionStatus.ACTIVE.value,
                "startDate": datetime.utcnow(),
                "endDate": datetime.utcnow() + timedelta(days=730),
                "autoRenew": False,
                "payment_provider": "testing"
            }
            create_subscription(subscription_data, db)

            # Default roles + owner role
            default_roles = RBACService.create_default_roles(db, str(tenant.id))
            owner_role = next((r for r in default_roles if r.name == "owner"), None)
            if not owner_role:
                print(f"  ! Failed to create owner role for '{name}', skipping tenant_user link.")
                continue

            tenant_user_data = {
                "tenant_id": tenant.id,
                "userId": user.id,
                "role_id": str(owner_role.id),
                "role": owner_role.name,
                "custom_permissions": [],
                "isActive": True,
            }
            create_tenant_user(tenant_user_data, db)

            # Seed ledger (optional, best-effort)
            try:
                create_default_chart_of_accounts(tenant_id=str(tenant.id), created_by=str(user.id), db=db)
            except Exception as e:
                print(f"  ! Ledger seeding skipped for '{name}': {e}")

            print(f"  + '{name}' created (plan={plan_type}, testing mode).")
            created.append({"tenant": name, "email": email, "password": TEST_PASSWORD, "status": "created"})

    finally:
        db.close()

    print("\n===== CREDENTIALS =====\n")
    print(f"Common password for all owners: {TEST_PASSWORD}")
    print("-" * 40)
    for c in created:
        print(f"  Tenant : {c['tenant']}")
        print(f"  Email  : {c['email']}")
        print(f"  Password: {c['password']}")
        print("-" * 40)
    print("\nAll these tenants are in TESTING MODE (no Stripe/payment required).")
    print("You can also log in as superadmin and select any of these tenants.")


if __name__ == "__main__":
    main()
