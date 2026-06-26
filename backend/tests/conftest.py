import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ['FLASK_ENV'] = 'testing'

from app import create_app
from extensions import db


@pytest.fixture()
def app():
    app = create_app()
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()
