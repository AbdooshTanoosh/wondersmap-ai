
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

from app.main import app
from app.database.connection import get_db


@pytest.fixture
def test_db():
    """Connect only to the isolated test database."""

    database_url = os.getenv(
        "WONDERSMAP_TEST_DATABASE_URL"
    )

    if not database_url:
        pytest.fail(
            "WONDERSMAP_TEST_DATABASE_URL is not set"
        )

    url = make_url(database_url)

    if url.database != "wondersmap_test_db":
        pytest.fail(
            "Refusing to test against a non-test database"
        )

    engine = create_engine(database_url)

    try:
        with engine.connect() as connection:
            actual_database = connection.execute(
                text("SELECT current_database()")
            ).scalar_one()

            if actual_database != "wondersmap_test_db":
                pytest.fail(
                    "Connected to the wrong database"
                )
            connection.rollback()

            # Each test uses its own transaction.
            # Changes are rolled back when the test ends.
            transaction = connection.begin()

            try:
                session = Session(
                    bind=connection,
                    join_transaction_mode="create_savepoint",
                )

                try:
                    yield session
                finally:
                    session.close()
            finally:
                transaction.rollback()
    finally:
        engine.dispose()


@pytest.fixture
def client(test_db):
    """FastAPI test client using the isolated database."""

    def override_get_db():
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
