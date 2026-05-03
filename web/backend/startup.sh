#!/bin/bash
set -e

echo "======================================"
echo "Starting Foresto Django Backend"
echo "======================================"

cd /home/site/wwwroot

echo "Current directory:"
pwd

echo "Files in wwwroot:"
ls -la

echo "Python version:"
python --version

echo "Checking Django project..."
python manage.py check

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
  --bind=0.0.0.0:${PORT:-8000} \
  --workers=2 \
  --threads=2 \
  --worker-class=gthread \
  --timeout=600 \
  --access-logfile '-' \
  --error-logfile '-'