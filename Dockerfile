# -------------------------------------------------------
# AI Portfolio — Dockerfile
# Multi-stage: build copies entrypoint, runtime is slim.
# Runs as non-root user for security.
# -------------------------------------------------------

FROM python:3.11-slim AS base

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies FIRST (layer-cached)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Create non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser

# Make entrypoint executable
RUN chmod +x entrypoint.sh

# Health check hits the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
