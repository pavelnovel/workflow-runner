#!/usr/bin/env bash
set -euo pipefail

echo "[smoke] Building and starting docker compose stack"
docker compose up -d --build

cleanup() {
  echo "[smoke] Shutting down docker compose stack"
  docker compose down --volumes >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[smoke] Running pytest inside api container"
docker compose exec -T api pytest

echo "[smoke] Completed successfully"

