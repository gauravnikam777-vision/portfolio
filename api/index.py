import os
import sys

# Ensure backend folder is in sys.path so its absolute imports work
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))

from backend.app import create_app

# Create the Flask WSGI app instance. Vercel's Python runtime will
# import the `app` variable and serve it as a WSGI application.
app = create_app()
