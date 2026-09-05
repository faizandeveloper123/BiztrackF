#!/usr/bin/env python3

import argparse
import json
import os
import sys
import uuid

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)

env_path = os.path.join(backend_dir, ".env")
load_dotenv(env_path)

DEFAULT_SUPER_ADMIN = {
    "userName": "superadmin",
    "email": "superadmin@system.com",
    "firstName": "Super",
    "lastName": "Admin",
    "password": "SuperAdmin@123",
}

PLAN_ORDER = ("agency", "commerce", "workshop", "ngo", "healthcare", "lms")


def get_engine():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    return create_engine(database_url)


def ensure_tables(engine):
    from sqlalchemy import inspect

    inspector = inspect(engine)
    if "plans" not in inspector.get_table_names():
        print("Plans table missing. Creating all tables first...")
        from src.config.database import create_tables

        create_tables()


def count_plans(engine):
    with engine.connect() as conn:
        return conn.execute(text("SELECT COUNT(*) FROM plans")).scalar()


def count_super_admins(engine):
    with engine.connect() as conn:
        return conn.execute(
            text(
                """
            SELECT COUNT(*) FROM users
            WHERE "userRole" = 'super_admin' AND "tenant_id" IS NULL
        """
            )
        ).scalar()


def seed_plans(engine, force=False):
    from src.core.plans_registry import PLANS, plan_to_dict

    existing = count_plans(engine)
    if existing > 0 and not force:
        print(f"Found {existing} existing plans. Run with --force to re-seed.")
        return existing

    with engine.begin() as conn:
        if existing > 0:
            conn.execute(text("DELETE FROM subscriptions"))
            conn.execute(text("DELETE FROM plans"))
            print(f"Cleared {existing} existing plans.")

        for plan_key in PLAN_ORDER:
            definition = PLANS[plan_key]
            payload = plan_to_dict(definition)
            plan_id = str(uuid.uuid4())
            conn.execute(
                text(
                    """
                INSERT INTO plans (
                    id, name, description, "planType", price, "billingCycle",
                    "maxProjects", "maxUsers", features, modules, "isActive",
                    "createdAt", "updatedAt"
                ) VALUES (
                    :id, :name, :description, :planType, :price, :billingCycle,
                    :maxProjects, :maxUsers, :features, :modules, :isActive,
                    NOW(), NOW()
                )
            """
                ),
                {
                    "id": plan_id,
                    "name": payload["name"],
                    "description": payload["description"],
                    "planType": payload["planType"],
                    "price": payload["price"],
                    "billingCycle": payload["billingCycle"],
                    "maxProjects": payload["maxProjects"],
                    "maxUsers": payload["maxUsers"],
                    "features": json.dumps(payload["features"]),
                    "modules": json.dumps([]),
                    "isActive": True,
                },
            )
            print(f"  + {definition.name} ({definition.planType})")

    created = len(PLAN_ORDER)
    print(f"Seeded {created} plans.")
    return created


def seed_super_admin(engine, force=False):
    from src.core.auth import get_password_hash

    existing = count_super_admins(engine)
    if existing > 0 and not force:
        print(f"Found {existing} super admin(s). Run with --force to recreate.")
        return existing

    with engine.begin() as conn:
        if existing > 0:
            conn.execute(
                text(
                    """
                DELETE FROM users
                WHERE "userRole" = 'super_admin' AND "tenant_id" IS NULL
            """
                )
            )
            print("Cleared existing super admin account.")

        admin_id = str(uuid.uuid4())
        conn.execute(
            text(
                """
            INSERT INTO users (
                id, "tenant_id", "userName", email, "firstName", "lastName",
                "hashedPassword", "userRole", "isActive",
                "createdAt", "updatedAt"
            ) VALUES (
                :id, NULL, :userName, :email, :firstName, :lastName,
                :hashedPassword, 'super_admin', true,
                NOW(), NOW()
            )
        """
            ),
            {
                "id": admin_id,
                "userName": DEFAULT_SUPER_ADMIN["userName"],
                "email": DEFAULT_SUPER_ADMIN["email"],
                "firstName": DEFAULT_SUPER_ADMIN["firstName"],
                "lastName": DEFAULT_SUPER_ADMIN["lastName"],
                "hashedPassword": get_password_hash(DEFAULT_SUPER_ADMIN["password"]),
            },
        )

    print("Super admin created:")
    print(f"  Email:    {DEFAULT_SUPER_ADMIN['email']}")
    print(f"  Password: {DEFAULT_SUPER_ADMIN['password']}")
    return 1


def main():
    parser = argparse.ArgumentParser(description="Seed BizTrack local database")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Replace existing plans and super admin",
    )
    parser.add_argument(
        "--plans-only",
        action="store_true",
        help="Only seed subscription plans",
    )
    parser.add_argument(
        "--admin-only",
        action="store_true",
        help="Only seed super admin user",
    )
    args = parser.parse_args()

    engine = get_engine()
    print("Connected to database.")
    ensure_tables(engine)

    if not args.admin_only:
        print("Seeding plans...")
        seed_plans(engine, force=args.force)

    if not args.plans_only:
        print("Seeding super admin...")
        seed_super_admin(engine, force=args.force)

    print("Done.")


if __name__ == "__main__":
    main()
