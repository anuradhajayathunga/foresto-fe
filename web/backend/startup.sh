#!/bin/bash
set -e

mkdir -p /home/LogFiles
exec > >(tee -a /home/LogFiles/startup.log) 2>&1

echo "======================================"
echo "Starting Foresto Django Backend"
echo "======================================"
date

cd /home/site/wwwroot

echo "Current directory:"
pwd

echo "Files:"
ls -la

echo "Python version:"
python --version

echo "Pip version:"
python -m pip --version

echo "Installed important packages:"
python -m pip show Django gunicorn psycopg django-environ whitenoise djangorestframework || true

echo "Checking environment variables:"
echo "DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE"
echo "WEBSITE_HOSTNAME=$WEBSITE_HOSTNAME"
echo "PORT=$PORT"
echo "DEBUG=$DEBUG"

echo "Checking Django project..."
python manage.py check --verbosity 2

echo "Starting Gunicorn..."
exec gunicorn config.wsgi:application \
  --bind=0.0.0.0:${PORT:-8000} \
  --workers=2 \
  --threads=2 \
  --worker-class=gthread \
  --timeout=600 \
  --access-logfile '-' \
  --error-logfile '-'