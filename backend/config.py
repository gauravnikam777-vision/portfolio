"""
Application configuration.
Reads everything from environment variables so the same image works
across dev / test / production simply by changing .env.
"""

import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


def _bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in ('1', 'true', 'yes', 'on')


def _env(value, default=None):
    if value is None:
        return default
    cleaned = str(value).strip()
    return cleaned if cleaned else default


class Config:
    """Shared base configuration."""

    SECRET_KEY = os.getenv('SECRET_KEY', 'change-this-in-production')

    # ---- Database ----
    _default_db = 'sqlite:///' + os.path.join(BASE_DIR, 'portfolio.db')
    if os.getenv('VERCEL'):
        # On Vercel, the filesystem is read-only except for /tmp
        _default_db = 'sqlite:////tmp/portfolio.db'

    SQLALCHEMY_DATABASE_URI = _env(
        os.getenv('DATABASE_URL'),
        _default_db
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
    }

    # ---- API / Security ----
    ADMIN_API_KEY = os.getenv('ADMIN_API_KEY', 'change-this-admin-key')
    CORS_ORIGINS = [o.strip() for o in os.getenv('CORS_ORIGINS', '*').split(',') if o.strip()]
    RATELIMIT_STORAGE_URI = os.getenv('REDIS_URL', 'memory://')
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '200 per hour')

    # ---- Session / cookies ----
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'

    # ---- Email (used by /api/contact to notify the owner) ----
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = _bool(os.getenv('MAIL_USE_TLS'), True)
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', os.getenv('MAIL_USERNAME', ''))
    OWNER_EMAIL = os.getenv('OWNER_EMAIL', 'gauravnikam072@gmail.com')
    EMAIL_ENABLED = _bool(os.getenv('EMAIL_ENABLED'), False)



    # ---- Misc ----
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    SITE_URL = os.getenv('SITE_URL', 'http://localhost:5000')
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB — allows normal profile photos (phone photos are 3-5MB)


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = False


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    RATELIMIT_ENABLED = False
    EMAIL_ENABLED = False


class ProductionConfig(Config):
    DEBUG = False
    SESSION_COOKIE_SECURE = True

    def __init_subclass__(cls, **kwargs):
        pass

    @classmethod
    def validate(cls):
        """Fail fast if dangerous defaults are still in use."""
        import sys
        if cls.SECRET_KEY == 'change-this-in-production':
            sys.exit('FATAL: SECRET_KEY must be changed in production. Set it via environment variable.')
        if cls.ADMIN_API_KEY == 'change-this-admin-key':
            sys.exit('FATAL: ADMIN_API_KEY must be changed in production. Set it via environment variable.')


config_map = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}


def get_config():
    env = os.getenv('FLASK_ENV', 'development')
    return config_map.get(env, DevelopmentConfig)
