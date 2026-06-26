"""
Flask extension instances, kept in their own module to avoid circular
imports between app.py, models.py, and the service modules.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
migrate = Migrate()
limiter = Limiter(key_func=get_remote_address)
