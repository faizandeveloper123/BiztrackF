import sqlalchemy as sa
from alembic import op


def table_exists(table_name: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(table_name)


def column_exists(table_name: str, column_name: str) -> bool:
    insp = sa.inspect(op.get_bind())
    if not insp.has_table(table_name):
        return False
    return column_name in {column["name"] for column in insp.get_columns(table_name)}


def index_exists(table_name: str, index_name: str) -> bool:
    insp = sa.inspect(op.get_bind())
    if not insp.has_table(table_name):
        return False
    return any(index["name"] == index_name for index in insp.get_indexes(table_name))


def constraint_exists(table_name: str, constraint_name: str) -> bool:
    insp = sa.inspect(op.get_bind())
    if not insp.has_table(table_name):
        return False
    return any(
        constraint["name"] == constraint_name
        for constraint in insp.get_foreign_keys(table_name)
    )


def safe_drop_index(index_name: str, table_name: str) -> None:
    if index_exists(table_name, index_name):
        op.drop_index(index_name, table_name=table_name)


def safe_drop_column(table_name: str, column_name: str) -> None:
    if column_exists(table_name, column_name):
        op.drop_column(table_name, column_name)


def safe_drop_constraint(constraint_name: str, table_name: str, constraint_type: str = "foreignkey") -> None:
    if constraint_exists(table_name, constraint_name):
        op.drop_constraint(constraint_name, table_name, type_=constraint_type)


def safe_create_index(index_name: str, table_name: str, columns: list[str], unique: bool = False) -> None:
    if not index_exists(table_name, index_name):
        op.create_index(index_name, table_name, columns, unique=unique)
