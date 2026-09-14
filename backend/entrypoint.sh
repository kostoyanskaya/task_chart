#!/bin/sh
set -e

echo "Waiting for Postgres..."
python << END
import os, time, psycopg2
while True:
    try:
        psycopg2.connect(
            dbname=os.environ.get("POSTGRES_DB","app"),
            user=os.environ.get("POSTGRES_USER","app"),
            password=os.environ.get("POSTGRES_PASSWORD",""),
            host=os.environ.get("POSTGRES_HOST","db"),
            port=os.environ.get("POSTGRES_PORT","5432"),
        )
        break
    except Exception:
        time.sleep(1)
END

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"