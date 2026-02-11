#!/bin/bash
set -e

echo "Waiting for database to be ready..."
# 데이터베이스가 준비될 때까지 대기
# 최대 30초 동안 대기 (15번 시도)
max_attempts=15
attempt=0
until pg_isready -h db -U user -d insighthub || [ $attempt -ge $max_attempts ]; do
  attempt=$((attempt+1))
  echo "Database is unavailable - sleeping (attempt $attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -ge $max_attempts ]; then
  echo "Warning: Database may not be ready, but proceeding..."
fi

echo "Database is ready!"

echo "Running database migrations to head (current version: 008)..."
alembic upgrade head

echo "Starting application..."
exec "$@"
