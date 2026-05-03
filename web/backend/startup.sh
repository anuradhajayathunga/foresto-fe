#!/bin/bash

echo "======================================"
echo "Starting Foresto Django Backend"
echo "======================================"

echo "Current directory:"
pwd

echo "Python version:"
python --version

echo "Starting Gunicorn..."
gunicorn config.wsgi:application --bind=0.0.0.0:8000 --workers=2 --timeout=600