#!/bin/sh
set -e

# parse host & port from DATABASE_URL if DB_HOST/DB_PORT not supplied
if [ -z "$DB_HOST" ]; then
  DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:/]+).*/\1/')
fi
if [ -z "$DB_PORT" ]; then
  DB_PORT=$(echo "$DATABASE_URL" | sed -E 's/.*:([0-9]+)\\/.*$/\1/')
fi
DB_PORT=${DB_PORT:-5432}

echo "Waiting for database ${DB_HOST}:${DB_PORT} ..."
while ! nc -z "${DB_HOST}" "${DB_PORT}"; do
  sleep 1
done
echo "Database is reachable."

# generate prisma client (safe to run)
npx prisma generate --schema prisma/schema.prisma || true

# run migrations in non-interactive mode (use migrate deploy for production)
npx prisma migrate deploy --schema prisma/schema.prisma || true

echo "Starting server..."
exec "$@"