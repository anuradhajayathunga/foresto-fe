#!/bin/bash

echo "======================================"
echo "Starting Foresto Django Backend"
echo "======================================"

echo "Current directory:"
pwd

echo "Listing backend files:"
ls -la

echo "Python version:"
python --version

echo "Installing dependencies..."
python -m pip install --upgrade pip
pip install -r requirements.txt

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn server..."
gunicorn config.wsgi:application --bind=0.0.0.0:8000 --workers=2 --timeout=600