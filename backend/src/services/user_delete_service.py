import logging
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models.platform import User as UserORM

logger = logging.getLogger(__name__)

SKIP_TABLES = {"users", "tenant_users"}


def _quote_ident(name: str) -> str:
    return f'"{name}"'


def _table_has_tenant_id(db: Session, table_name: str) -> bool:
    return db.execute(
        text(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :table
            AND column_name = 'tenant_id'
            """
        ),
        {"table": table_name},
    ).first() is not None


def _get_user_foreign_keys(db: Session):
    return db.execute(
        text(
            """
            SELECT tc.table_name, kcu.column_name, c.is_nullable
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            JOIN information_schema.columns c
                ON c.table_schema = tc.table_schema
                AND c.table_name = tc.table_name
                AND c.column_name = kcu.column_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_schema = 'public'
                AND ccu.table_name = 'users'
                AND ccu.column_name = 'id'
            ORDER BY tc.table_name
            """
        )
    ).fetchall()


def _cleanup_user_references(
    db: Session,
    user_id: UUID,
    tenant_id: UUID | None,
    scope: str,
) -> int:
    cleaned = 0
    for table_name, column_name, is_nullable in _get_user_foreign_keys(db):
        if table_name in SKIP_TABLES:
            continue

        has_tenant = _table_has_tenant_id(db, table_name)
        if scope == "tenant":
            if not has_tenant or not tenant_id:
                continue
        elif scope == "global":
            if has_tenant:
                continue

        table = _quote_ident(table_name)
        column = _quote_ident(column_name)
        params = {"user_id": user_id}
        where = f"{column} = :user_id"
        if scope == "tenant":
            where += " AND tenant_id = :tenant_id"
            params["tenant_id"] = tenant_id

        try:
            if is_nullable == "YES":
                result = db.execute(
                    text(f"UPDATE {table} SET {column} = NULL WHERE {where}"),
                    params,
                )
            else:
                result = db.execute(text(f"DELETE FROM {table} WHERE {where}"), params)
            cleaned += result.rowcount or 0
        except Exception:
            logger.exception("Failed to clean %s.%s for user %s", table_name, column_name, user_id)

    return cleaned


def _detach_from_tenant_projects(db: Session, user_id: UUID, tenant_id: UUID) -> None:
    db.execute(
        text(
            """
            DELETE FROM project_team_members
            WHERE user_id = :user_id
            AND project_id IN (SELECT id FROM projects WHERE tenant_id = :tenant_id)
            """
        ),
        {"user_id": user_id, "tenant_id": tenant_id},
    )


def _reassign_managed_projects(
    db: Session,
    user_id: UUID,
    tenant_id: UUID,
    reassign_to: UUID,
) -> None:
    db.execute(
        text(
            """
            UPDATE projects
            SET "projectManagerId" = :reassign_to
            WHERE "projectManagerId" = :user_id AND tenant_id = :tenant_id
            """
        ),
        {"reassign_to": reassign_to, "user_id": user_id, "tenant_id": tenant_id},
    )


def _remove_tenant_membership(db: Session, user_id: UUID, tenant_id: UUID) -> None:
    db.execute(
        text('DELETE FROM tenant_users WHERE "userId" = :user_id AND tenant_id = :tenant_id'),
        {"user_id": user_id, "tenant_id": tenant_id},
    )


def _remaining_tenant_memberships(db: Session, user_id: UUID) -> int:
    return db.execute(
        text('SELECT COUNT(*) FROM tenant_users WHERE "userId" = :user_id'),
        {"user_id": user_id},
    ).scalar() or 0


def force_delete_user(
    db: Session,
    user_id: UUID,
    tenant_id: UUID,
    current_user_id: UUID,
) -> dict:
    if str(user_id) == str(current_user_id):
        raise ValueError("You cannot delete your own account")

    user = db.query(UserORM).filter(UserORM.id == user_id).first()
    if not user:
        raise ValueError("User not found")

    _reassign_managed_projects(db, user_id, tenant_id, current_user_id)
    _detach_from_tenant_projects(db, user_id, tenant_id)
    _remove_tenant_membership(db, user_id, tenant_id)

    for _ in range(15):
        tenant_cleaned = _cleanup_user_references(db, user_id, tenant_id, "tenant")
        full_delete = _remaining_tenant_memberships(db, user_id) == 0
        global_cleaned = 0
        if full_delete:
            global_cleaned = _cleanup_user_references(db, user_id, None, "global")
        if tenant_cleaned == 0 and global_cleaned == 0:
            break

    full_delete = _remaining_tenant_memberships(db, user_id) == 0
    if full_delete:
        for _ in range(5):
            global_cleaned = _cleanup_user_references(db, user_id, None, "global")
            if global_cleaned == 0:
                break
        db.execute(text("DELETE FROM project_team_members WHERE user_id = :user_id"), {"user_id": user_id})
        db.query(UserORM).filter(UserORM.id == user_id).delete()

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        logger.exception("Force delete failed for user %s", user_id)
        raise ValueError(
            "Force delete failed: some records could not be removed. Please contact support."
        ) from exc

    if full_delete:
        return {"message": "User and all associated records deleted successfully"}
    return {"message": "User removed from tenant and associated records cleared successfully"}
