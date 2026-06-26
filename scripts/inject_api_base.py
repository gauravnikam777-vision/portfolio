"""Inject API_BASE_URL environment variable into frontend/index.html.

Usage:
  API_BASE_URL=https://api.example.com python scripts/inject_api_base.py
If `API_BASE_URL` is not set, the placeholder will be replaced with `/api`.
"""
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONT = ROOT / 'frontend' / 'index.html'

if not FRONT.exists():
    print('frontend/index.html not found — run `python scripts/export_static.py` first')
    raise SystemExit(1)

val = os.environ.get('API_BASE_URL', '/api')
content = FRONT.read_text(encoding='utf-8')
new = content.replace('%%API_BASE_URL%%', val)
FRONT.write_text(new, encoding='utf-8')
print(f'Wrote API_BASE_URL={val} into {FRONT}')
