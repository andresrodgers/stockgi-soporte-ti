#!/bin/sh
set -eu
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="/backups/stockgi_soporte_ti_${STAMP}.dump"
PGPASSWORD="${POSTGRES_MIGRATOR_PASSWORD}" pg_dump -h postgres -U stockgi_migrator -d stockgi_soporte_ti -Fc -f "$FILE"
find /backups -name "stockgi_soporte_ti_*.dump" -type f -mtime +30 -delete
ls -lh "$FILE"
