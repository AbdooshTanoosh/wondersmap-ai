
from sqlalchemy import text


def test_uses_test_database(test_db):
    database_name = test_db.execute(
        text("SELECT current_database()")
    ).scalar_one()

    assert database_name == "wondersmap_test_db"
