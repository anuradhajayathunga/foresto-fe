#!/usr/bin/env sh
set -e

echo "Starting application..."

# -----------------------------------------------------------------------------
# 1. Force IPv4 resolution (fixes Neon/Supabase IPv6 issue)
# -----------------------------------------------------------------------------
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  echo "Original DB host: $DB_HOST"

  IPV4=$(getent ahostsv4 "$DB_HOST" | awk '{print $1; exit}')

  if [ -n "$IPV4" ]; then
    echo "Forcing IPv4: $IPV4"
    DATABASE_URL=$(echo "$DATABASE_URL" | sed "s/$DB_HOST/$IPV4/")
    export DATABASE_URL
  else
    echo "WARNING: Could not resolve IPv4. Continuing..."
  fi
fi

# -----------------------------------------------------------------------------
# 2. Wait for database port to be reachable
# -----------------------------------------------------------------------------
echo "Waiting for database..."

DB_PORT=5432
if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+).*|\1|')
fi

until nc -z "$DB_HOST" "$DB_PORT"; do
  echo "Database unavailable - sleeping"
  sleep 2
done

echo "Database is reachable"

# -----------------------------------------------------------------------------
# 3. Run migrations with retries
# -----------------------------------------------------------------------------
MIGRATION_MAX_ATTEMPTS=${MIGRATION_MAX_ATTEMPTS:-8}
MIGRATION_RETRY_SECONDS=${MIGRATION_RETRY_SECONDS:-5}
attempt=1

while [ "$attempt" -le "$MIGRATION_MAX_ATTEMPTS" ]; do
  if python manage.py migrate --noinput; then
    break
  fi

  if [ "$attempt" -eq "$MIGRATION_MAX_ATTEMPTS" ]; then
    echo "Migration failed after ${MIGRATION_MAX_ATTEMPTS} attempts."
    exit 1
  fi

  echo "Migration attempt ${attempt} failed. Retrying in ${MIGRATION_RETRY_SECONDS}s..."
  attempt=$((attempt + 1))
  sleep "$MIGRATION_RETRY_SECONDS"
done

# -----------------------------------------------------------------------------
# 4. Collect static
# -----------------------------------------------------------------------------
python manage.py collectstatic --noinput

# -----------------------------------------------------------------------------
# 5. Start Gunicorn
# -----------------------------------------------------------------------------
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --workers ${WEB_CONCURRENCY:-2} \
  --timeout ${GUNICORN_TIMEOUT:-120}