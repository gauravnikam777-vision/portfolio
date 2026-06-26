"""Copy the backend/static folder to frontend/ for standalone deployment.

Usage:
  python scripts/export_static.py
"""
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(__file__))
SRC = os.path.join(ROOT, 'backend', 'static')
DST = os.path.join(ROOT, 'frontend')

if not os.path.isdir(SRC):
    raise SystemExit(f"Source folder not found: {SRC}")

if os.path.isdir(DST):
    print(f"Removing existing {DST}")
    shutil.rmtree(DST)

print(f"Copying {SRC} -> {DST}")
shutil.copytree(SRC, DST)
print("Done.")
