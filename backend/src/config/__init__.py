# Config package initialization
# This package contains all database models and CRUD functions split into logical modules

from .database_config import engine, SessionLocal, Base, create_tables, get_db

# All models and functions from database are now available through this package

__all__ = [
    'engine', 'SessionLocal', 'Base', 'create_tables', 'get_db',
    # All models and functions from database are also available
]
