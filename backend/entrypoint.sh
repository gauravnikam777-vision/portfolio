#!/bin/sh
set -e

echo "Running database migrations..."
flask db upgrade

echo "Seeding database..."
python seed_db.py

echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:5000 --workers ${GUNICORN_WORKERS:-3} --threads ${GUNICORN_THREADS:-2} app:app
