#!/usr/bin/env python3

import argparse
import os
import sys

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

backend_dir = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, backend_dir)

env_path = os.path.join(backend_dir, ".env")
load_dotenv(env_path)


def get_engine():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")
    return create_engine(database_url)


def count_tables(engine):
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE';
        """
            )
        )
        return result.scalar()


def wipe_schema(engine):
    with engine.begin() as conn:
        conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))


def recreate_tables(engine, force=False):
    existing_count = count_tables(engine)
    if existing_count > 0 and not force:
        print(f"Found {existing_count} existing tables. Run with --force to wipe and recreate.")
        return False

    if existing_count > 0 and force:
        print(f"Wiping {existing_count} existing tables...")
        wipe_schema(engine)

    from src.config.database import create_tables

    print("Creating all tables...")
    create_tables()

    final_count = count_tables(engine)
    print(f"Created {final_count} tables.")
    return True


def main():
    parser = argparse.ArgumentParser(description="Recreate BizTrack database schema")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Drop all existing tables and recreate from scratch",
    )
    args = parser.parse_args()

    engine = get_engine()
    print("Connected to database.")
    if not recreate_tables(engine, force=args.force):
        sys.exit(1)


if __name__ == "__main__":
    main()
