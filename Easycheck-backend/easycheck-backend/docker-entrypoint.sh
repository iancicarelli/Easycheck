#!/bin/sh
# Entrypoint del backend EasyCheck:
#   1. Espera a que Postgres acepte conexiones (además del healthcheck de
#      compose, por robustez ante reinicios del contenedor).
#   2. Corre el seed demo (idempotente: no duplica si la base ya tiene datos).
#   3. Arranca la API. `exec` reemplaza el shell para que node reciba señales.
set -e

DB_PORT="${DB_PORT:-5432}"

echo "⏳ Esperando a Postgres en ${DB_HOST}:${DB_PORT}..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "✅ Postgres disponible"

echo "🌱 Ejecutando seed demo..."
node dist/seed/demo-seed.js

echo "🚀 Iniciando EasyCheck backend"
exec node dist/main.js
