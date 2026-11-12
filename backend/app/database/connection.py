
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


# Load backend/.env
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(ENV_PATH)


# Read credentials from environment variables
db_password = os.getenv("DB_PASSWORD")

if not db_password:
    raise RuntimeError(
        "DB_PASSWORD is missing from backend/.env"
    )


# URL.create handles special characters in passwords.
database_url = URL.create(
    drivername="postgresql+psycopg",
    username=os.getenv("DB_USER", "wondersmap"),
    password=db_password,
    host=os.getenv("DB_HOST", "127.0.0.1"),
    port=int(os.getenv("DB_PORT", "5433")),
    database=os.getenv("DB_NAME", "wondersmap_db"),
)


# Configure SQLAlchemy engine
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    connect_args={"connect_timeout": 5},
)


# Database sessions
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


# Base class for future database models
class Base(DeclarativeBase):
    pass


# FastAPI database dependency
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
