# Gaurav Nikam — Portfolio Setup Guide
## Complete Setup Guide

---

## What's Inside

```
portfolio/
├── backend/
│   ├── static/               ← Frontend (HTML + CSS + JS)
│   │   ├── index.html
│   │   ├── css/style.css
│   │   ├── js/main.js
│   │   ├── favicon.svg
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   ├── app.py                ← Flask application factory
│   ├── models.py             ← SQLAlchemy models
│   ├── extensions.py         ← db / migrate / limiter instances
│   ├── config.py             ← Environment-based config
│   ├── utils.py              ← General utility functions (HTML cleaner)
│   ├── email_service.py      ← SMTP email (optional)
│   ├── seed_db.py            ← Idempotent resume data seeder
│   ├── wsgi.py               ← Gunicorn entry point
│   ├── entrypoint.sh         ← Docker: wait-for-db → migrate → seed → gunicorn
│   ├── requirements.txt      ← Dependencies
│   └── tests/
│       ├── conftest.py
│       └── test_api.py       ← Smoke tests
├── docker/
│   └── nginx.conf            ← Nginx reverse proxy
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── .dockerignore
└── SETUP_GUIDE.md            ← This file
```

---

## Option A — Local Development (SQLite, no Docker)

### 1. Prerequisites
- Python 3.11+ (`python --version`)
- Git

### 2. Clone & set up
```bash
git clone <your-repo-url>
cd portfolio

python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r backend/requirements.txt
```

### 3. Configure environment
```bash
copy .env.example .env
# Open .env — you can leave everything as-is for local dev.
# SQLite is used automatically when DATABASE_URL is not set.
```

### 4. Initialise database & seed data
```bash
cd backend
flask db init        # creates migrations/ folder (first time only)
flask db migrate -m "initial"
flask db upgrade

python seed_db.py    # loads Gaurav's resume data into the DB
```

### 5. Run
```bash
flask run            # http://localhost:5000
```

Open http://localhost:5000 — you should see the full portfolio with all sections populated.

### 6. Run tests
```bash
pytest tests/ -v     # all tests should pass
```

---

## Option B — Docker Compose (PostgreSQL + Redis + Nginx)

### 1. Prerequisites
- Docker Desktop
- Docker Compose

### 2. Configure
```bash
copy .env.example .env
# Edit .env:
#   - Change SECRET_KEY to something random
#   - Change ADMIN_API_KEY to something random
#   - Optionally set email vars and EMAIL_ENABLED=true
```

### 3. Generate self-signed SSL (for local HTTPS)
```bash
mkdir -p docker/ssl
openssl req -x509 -newkey rsa:4096 -nodes \
  -out docker/ssl/cert.pem \
  -keyout docker/ssl/key.pem \
  -days 365 \
  -subj "/CN=localhost"
```

### 4. Start everything
```bash
docker-compose up --build -d

# Watch logs
docker-compose logs -f backend
```

The entrypoint script automatically:
1. Waits for Postgres to accept connections
2. Runs `flask db upgrade`
3. Runs `python seed_db.py` (idempotent — safe to re-run)
4. Starts Gunicorn

### 5. Access
- http://localhost (redirects to HTTPS)
- https://localhost (accepts the self-signed cert warning)
- http://localhost:5000 (direct backend, bypasses Nginx)

### 6. Stop
```bash
docker-compose down          # keeps DB volume
docker-compose down -v       # also removes DB volume (fresh start)
```

---

## Option C — Production on a VPS (DigitalOcean / AWS EC2 / Hetzner)

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# 3. Clone project
git clone <your-repo-url>
cd portfolio

# 4. Set production .env
copy .env.example .env
# Set: SECRET_KEY, ADMIN_API_KEY, DB_PASSWORD, EMAIL_* vars
# Set CORS_ORIGINS=https://yourdomain.com

# 5. Get a real SSL certificate (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
# Copy certs:
mkdir -p docker/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem   docker/ssl/key.pem

# 6. Update nginx.conf: change server_name _ to your domain

# 7. Start
docker-compose up --build -d

# 8. Auto-renew SSL
echo "0 3 * * * certbot renew --quiet && docker-compose exec nginx nginx -s reload" | sudo crontab -
```

---

## Enabling Optional Features

### ✅ Real email on contact form
```env
EMAIL_ENABLED=true
MAIL_USERNAME=your-gmail@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx   # Gmail App Password
OWNER_EMAIL=gauravnikam072@gmail.com
```
Get an App Password: Google Account → Security → 2-Step Verification → App Passwords.

### ✅ Resume download
Place your `resume.pdf` at:  `backend/static/resume.pdf`
It will be served at `/api/resume` with a proper filename.

---

## API Reference

All endpoints live at `/api/`.

### Public endpoints (no auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health + feature flags |
| GET | `/api/projects` | All projects |
| GET | `/api/skills` | Skills grouped by category |
| GET | `/api/education` | Education timeline |
| GET | `/api/certifications` | Certifications |
| GET | `/api/testimonials` | Approved testimonials |
| GET | `/api/resume` | Download resume PDF |
| POST | `/api/contact` | Submit contact form |
| POST | `/api/track` | Log analytics event |

### Admin endpoints (require `X-API-Key: <ADMIN_API_KEY>` header)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/contacts` | All contact submissions |
| GET | `/api/admin/analytics/summary` | 30-day event summary |

### Example API calls
```bash
# Health check
curl http://localhost:5000/api/health

# Submit contact form
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name": "Visitor", "email": "visitor@example.com", "message": "Hello!"}'

# Admin: read contacts
curl http://localhost:5000/api/admin/contacts \
  -H "X-API-Key: your-admin-key"
```

---

## Customising Your Content

All portfolio content lives in **`backend/seed_db.py`**.
Edit the `PROJECTS`, `SKILLS`, `EDUCATION`, `CERTIFICATIONS`, and `TESTIMONIALS` lists, then re-run:

```bash
python seed_db.py   # wipes and re-seeds cleanly
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `flask` command not found | Activate venv: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows) |
| `ModuleNotFoundError: psycopg2` | Using SQLite locally? Leave `DATABASE_URL` unset. Using Postgres? `pip install psycopg2-binary` |
| `flask db` fails with "No such command" | `pip install Flask-Migrate` |
| DB empty after start | Run `python seed_db.py` manually |
| Contact form returns 429 | Rate limit hit (5/hour per IP). Wait or test via `pytest` |
| Docker: `backend` restarts in a loop | `docker-compose logs backend` — usually a DB connection issue. Check `DB_PASSWORD` matches in `.env` |
| Nginx 502 | Backend not started yet. `docker-compose logs backend` |
| SSL cert not found | Run the openssl command in Option B step 3 |

---

## Running Tests

```bash
cd backend
pytest tests/ -v              # all tests
pytest tests/ -v --cov=.      # with coverage report
```

Expected output: **10 passed**.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3 (design system with CSS variables), Vanilla JS (ES6+) |
| Backend | Python 3.11, Flask 3, Flask-SQLAlchemy, Flask-Migrate, Flask-Limiter |
| Database | PostgreSQL 15 (prod) / SQLite (local dev) |
| Email | smtplib + Gmail SMTP (optional) |
| Server | Gunicorn + Nginx |
| Containers | Docker + Docker Compose |
| Tests | pytest (10 smoke tests) |

---

*Built by Gaurav Nikam — gauravnikam072@gmail.com*
