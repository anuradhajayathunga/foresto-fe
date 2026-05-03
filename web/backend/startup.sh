#!/bin/bash

echo "======================================"
echo "Starting Foresto Django Backend"
echo "======================================"

echo "Python version:"
python --version

# Auto-scale workers: 1 per CPU core, min 2, max 8
CPU_COUNT=$(python -c "import os; print(min(8, max(2, os.cpu_count() or 2)))" 2>/dev/null || echo "2")

# Attempt database migrations (non-blocking - timeout after 10 seconds)
echo "Running database migrations..."
timeout 10 python manage.py migrate --no-input 2>&1 || echo "⚠️  Migrations skipped/failed (will retry on first request)"

echo "Starting Gunicorn with $CPU_COUNT workers..."
exec gunicorn \
    config.wsgi:application \
    --bind=0.0.0.0:8000 \
    --workers="$CPU_COUNT" \
    --worker-class=gthread \
    --threads=4 \
    --timeout=600 \
    --access-logfile - \
    --error-logfile -