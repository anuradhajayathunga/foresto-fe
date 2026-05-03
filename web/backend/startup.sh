#!/usr/bin/env sh
set -e

# Retry migrations a few times to handle transient DB/network startup delays.
MIGRATION_MAX_ATTEMPTS=${MIGRATION_MAX_ATTEMPTS:-8}
MIGRATION_RETRY_SECONDS=${MIGRATION_RETRY_SECONDS:-5}
attempt=1

while [ "$attempt" -le "$MIGRATION_MAX_ATTEMPTS" ]; do
	if python manage.py migrate --noinput; then
		break
	fi

	if [ "$attempt" -eq "$MIGRATION_MAX_ATTEMPTS" ]; then
		echo "Migration failed after ${MIGRATION_MAX_ATTEMPTS} attempts. Exiting."
		exit 1
	fi

	echo "Migration attempt ${attempt} failed. Retrying in ${MIGRATION_RETRY_SECONDS}s..."
	attempt=$((attempt + 1))
	sleep "$MIGRATION_RETRY_SECONDS"
done

python manage.py collectstatic --noinput
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${WEB_CONCURRENCY:-2} --timeout ${GUNICORN_TIMEOUT:-120}