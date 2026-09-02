#!/bin/sh
set -e

# Ensure the SQLite data directory is writable by the appuser
# regardless of how the mounted volume was created.
mkdir -p /app/data
chown -R appuser:appuser /app/data

# Run the app as the non-root user
exec su -s /bin/sh appuser -c "exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 120 app:app"
