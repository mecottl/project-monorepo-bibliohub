#!/bin/sh
# Respaldo de PostgreSQL (formato custom de pg_dump) con retención.
# Variables: PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE (estándar de libpq),
#            RESPALDO_DIR (por defecto /backups), RETENCION_DIAS (por defecto 14).
set -eu

DIR="${RESPALDO_DIR:-/backups}"
RETENCION_DIAS="${RETENCION_DIAS:-14}"
mkdir -p "$DIR"

ARCHIVO="$DIR/bibliohub-$(date +%Y%m%d-%H%M%S).dump"
pg_dump -Fc -f "$ARCHIVO.tmp"
# Un respaldo que no se puede listar no sirve: se descarta.
pg_restore --list "$ARCHIVO.tmp" > /dev/null
mv "$ARCHIVO.tmp" "$ARCHIVO"
echo "respaldo creado: $ARCHIVO ($(wc -c < "$ARCHIVO") bytes)"

find "$DIR" -name 'bibliohub-*.dump' -mtime "+$RETENCION_DIAS" -print -delete
