import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import DisconnectionError, OperationalError
from fastapi import HTTPException
from dotenv import load_dotenv
import logging
import psycopg2

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

logger = logging.getLogger(__name__)

connect_args = {
    "connect_timeout": 30,
    "keepalives": 1,
    "keepalives_idle": 30,
    "keepalives_interval": 10,
    "keepalives_count": 5
}

if "amazonaws.com" in DATABASE_URL or "rds.amazonaws.com" in DATABASE_URL:
    connect_args["sslmode"] = "require"

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_reset_on_return='rollback',
    connect_args=connect_args,
    echo=False
)

def _apply_session_timeouts(dbapi_conn) -> None:
    with dbapi_conn.cursor() as cursor:
        cursor.execute("SET statement_timeout = 30000")
        cursor.execute("SET lock_timeout = 10000")
        cursor.execute("SET idle_in_transaction_session_timeout = 15000")

@event.listens_for(engine, "connect")
def set_connection_timeouts(dbapi_conn, connection_record):
    try:
        _apply_session_timeouts(dbapi_conn)
    except Exception as e:
        logger.warning(f"Failed to set connection timeouts: {e}")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    try:
        if dbapi_conn.closed:
            raise DisconnectionError("Connection is closed")
        cursor = dbapi_conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        _apply_session_timeouts(dbapi_conn)
    except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
        error_str = str(e)
        if "SSL connection has been closed" in error_str or "server closed the connection" in error_str:
            logger.warning(f"SSL/connection error during checkout: {e}")
            connection_record.invalidate()
            raise DisconnectionError(f"Connection lost during checkout: {e}")
        raise
    except Exception as e:
        logger.warning(f"Connection check failed: {e}")
        raise DisconnectionError(f"Connection lost during checkout: {e}")

@event.listens_for(engine, "invalidate")
def receive_invalidate(dbapi_conn, connection_record, exception):
    if exception:
        error_str = str(exception)
        if "SSL connection has been closed" in error_str:
            logger.warning(f"Invalidating connection due to SSL error: {error_str}")
        else:
            logger.warning(f"Invalidating connection: {error_str}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def create_tables():
    """Create all database tables"""
    from ..models.registry import register_all_models

    register_all_models()
    Base.metadata.create_all(bind=engine)

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    except HTTPException:
        raise
    except (OperationalError, DisconnectionError) as e:
        error_str = str(e)
        if "SSL connection has been closed" in error_str:
            logger.warning(f"SSL connection error, disposing pool: {error_str}")
            engine.dispose()
        else:
            logger.error(f"Database operational error: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        raise
    except Exception as e:
        logger.error(f"Database error: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            db.close()
        except Exception as e:
            logger.warning(f"Error closing database connection: {e}")
