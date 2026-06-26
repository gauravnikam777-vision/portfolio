# AI Portfolio

Minimal README with local development and Vercel deployment instructions.

**Quick Local Development**
- **Prerequisites:** Python 3.11+, Git
- If you already have the project folder locally, skip the `git clone` step and start from that folder.
- If you want to store the project remotely later, create a GitHub/Bitbucket/GitLab repo and push your local repo there.

```bash
# If you do not already have a remote repo, use the local folder directly:
cd path\to\ai-portfolio
cd C:\Users\gaura\Downloads\ai-portfolio\ai-portfolio
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
```

- Install dependencies and run from the repository root:

```bash
cd C:\Users\gaura\Downloads\ai-portfolio\ai-portfolio
python -m venv venv
venv\Scripts\activate
pip install -r backend/requirements.txt
copy .env.example .env
# For local development, leave DATABASE_URL empty in backend\.env
# so the app uses local SQLite instead of PostgreSQL.
cd backend
flask db upgrade
python seed_db.py
flask run
# App reachable at http://localhost:5000
```

If you already start inside `backend`, use:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy ..\.env.example .env
flask db upgrade
python seed_db.py
flask run
```

**Run Tests**

```bash
cd backend
pytest tests/ -v
```

**Environment variables**
- Copy `.env.example` to `.env` and set values. Key variables used by the app:
  - `SECRET_KEY` — random string
  - `DATABASE_URL` — Postgres connection URL (for production). Leave empty for local SQLite.
  - `ADMIN_API_KEY` — admin API key for `X-API-Key` header
  - `REDIS_URL` — rate-limit storage; use `memory://` for local development if Redis is not installed
  - `EMAIL_ENABLED`, `MAIL_*` — optional email settings

**Deploying to Vercel**

Two recommended options depending on how you want to host the backend:

1) Frontend on Vercel (recommended) + Backend on a separate host
- Deploy the static frontend in `backend/static/` to Vercel (fast and free).
- Host the Flask backend on a platform built for long-running processes (Railway, Render, Fly, or Render). Configure `CORS_ORIGINS` to allow your Vercel domain.

2) Full app (Serverless Python on Vercel) — advanced / experimental
- Vercel supports Python serverless functions via `@vercel/python`. This requires moving HTTP handlers into a serverless entry (for example `api/index.py`) and ensuring the app works under the serverless constraints (cold starts, limited execution time).
- Example `vercel.json` (project root):

```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.py", "use": "@vercel/python" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/api/index.py" }
  ]
}
```

- Example `api/index.py` (very small adapter):

```python
from backend.app import create_app

app = create_app()  # create_app must return a Flask app

# Vercel's Python builder will pick up this file as a serverless function
```

- Caveats: serverless functions have short time limits and are not ideal for heavy ML workloads. If you use this route, set required environment variables in the Vercel Project Settings (Environment Variables).

**Setting environment variables on Vercel**
- In Vercel dashboard → Project → Settings → Environment Variables, add values matching `.env.example` (use `SECRET_KEY`, `DATABASE_URL`, `ADMIN_API_KEY`, etc.). Use `Preview`/`Production` scopes as appropriate.

**Exact environment variable keys to add on Vercel**
- `FLASK_ENV` = `production`
- `SECRET_KEY` = (your random secret)
- `DATABASE_URL` = (postgres URL, e.g. `postgresql://user:pass@host:5432/db`)
- `REDIS_URL` = optional
- `ADMIN_API_KEY` = admin key used for `X-API-Key` header
- `CORS_ORIGINS` = comma-separated allowed origins (set to your Vercel domain)
- `EMAIL_ENABLED` = `true` or `false`
- `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `OWNER_EMAIL`


Set these in Vercel → Project → Settings → Environment Variables. For local testing, copy `.env.example` to `.env`.

**Testing the Vercel adapter locally**
- A small test runner is included: run from the project root:

```bash
python run_local.py
```

This starts the Flask app used by the `api/index.py` adapter on `http://localhost:5000` so you can exercise `/api/*` endpoints locally.

**Splitting and deploying the static frontend to Vercel**
- A helper script `scripts/export_static.py` copies `backend/static/` into `frontend/` for a standalone static deploy.

```bash
python scripts/export_static.py
# then push to your repo and import into Vercel
# In Vercel project settings, set `Root Directory` to `frontend`.
```

Vercel will serve the static assets directly; point the frontend's API calls to your backend host (set `API_BASE_URL` in the frontend if needed) or configure a rewrite/proxy in Vercel.

**Automatic API base injection (recommended)**
1. Set the `API_BASE_URL` environment variable in Vercel (your backend URL, e.g. `https://api.example.com`).
2. Set the Vercel **Build Command** to:

```bash
python scripts/inject_api_base.py
```

3. Set **Output Directory** (Vercel) to: `frontend`

This will replace the `%%API_BASE_URL%%` placeholder in `frontend/index.html` with the actual backend URL at build time. Alternatively, use `frontend/vercel.json` to rewrite `/api/*` to a fixed backend host (edit the file to set your backend domain).

**Notes / Troubleshooting**
- If you only need to host the static site, deploying `backend/static/` to Vercel is simplest.
- For database-backed features, prefer a host that supports managed Postgres; set `DATABASE_URL` accordingly.


**Next steps I can do for you**
- Add a `vercel.json` and minimal `api/index.py` adapter to make the app serverless-compatible.
- Split the static frontend into a standalone deployable for Vercel.

---
Built from the original project files in `backend/`.
