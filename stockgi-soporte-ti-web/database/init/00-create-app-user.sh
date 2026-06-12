#!/bin/sh
set -eu
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'stockgi_app') THEN
    CREATE ROLE stockgi_app LOGIN PASSWORD '${POSTGRES_APP_PASSWORD}';
  ELSE
    ALTER ROLE stockgi_app WITH PASSWORD '${POSTGRES_APP_PASSWORD}';
  END IF;
END
$$;
GRANT CONNECT ON DATABASE stockgi_soporte_ti TO stockgi_app;
SQL
