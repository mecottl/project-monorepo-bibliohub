#!/bin/sh
# Prueba de restauración: restaura el respaldo más reciente en una base temporal y comprueba que
# el esquema y los datos clave estén. Sale con error si algo falla. No toca la base real.
# Variables: las mismas que respaldo.sh (PGDATABASE se usa solo para conectarse al servidor).
set -eu

DIR="${RESPALDO_DIR:-/backups}"
TEMP="restauracion_prueba"
ULTIMO="$(ls -1t "$DIR"/bibliohub-*.dump 2>/dev/null | head -n 1 || true)"
[ -n "$ULTIMO" ] || { echo "No hay respaldos en $DIR"; exit 1; }

psql -d postgres -q -c "DROP DATABASE IF EXISTS $TEMP" -c "CREATE DATABASE $TEMP"
trap 'psql -d postgres -q -c "DROP DATABASE IF EXISTS '"$TEMP"'" >/dev/null 2>&1 || true' EXIT

pg_restore --no-owner --exit-on-error -d "$TEMP" "$ULTIMO"

TABLAS="$(psql -d "$TEMP" -tA -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")"
FUNCIONES="$(psql -d "$TEMP" -tA -c "SELECT count(*) FROM pg_proc WHERE proname IN ('confirmar_venta_pos','confirmar_pedido_linea','cancelar_venta','calcular_totales_pedido')")"
psql -d "$TEMP" -tA -c "SELECT count(*) FROM libro" > /dev/null
psql -d "$TEMP" -tA -c "SELECT count(*) FROM configuracion" > /dev/null

[ "$TABLAS" -gt 10 ] || { echo "Restauración incompleta: solo $TABLAS tablas"; exit 1; }
[ "$FUNCIONES" -eq 4 ] || { echo "Faltan funciones SQL críticas ($FUNCIONES/4)"; exit 1; }
echo "restauración OK: $ULTIMO ($TABLAS tablas, $FUNCIONES/4 funciones críticas)"
