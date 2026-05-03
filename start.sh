#!/usr/bin/env bash
set -e

echo "Starting Foresto backend via start.sh"

# Delegate to the backend startup script. Dependencies should be installed at build time.
cd "web/backend"
exec ./startup.sh
