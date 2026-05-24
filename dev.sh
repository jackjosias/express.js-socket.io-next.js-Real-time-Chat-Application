#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/jjk-messenger/backend"
FRONTEND_DIR="$ROOT_DIR/jjk-messenger/frontend"
BACKEND_PORT="${PORT:-3002}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:${BACKEND_PORT}}"

backend_pid=""
frontend_pid=""

stop_servers() {
  echo
  echo "Stopping JJK Messenger dev servers..."

  if [[ -n "$frontend_pid" ]] && kill -0 "$frontend_pid" 2>/dev/null; then
    kill "$frontend_pid" 2>/dev/null || true
  fi

  if [[ -n "$backend_pid" ]] && kill -0 "$backend_pid" 2>/dev/null; then
    kill "$backend_pid" 2>/dev/null || true
  fi

  wait "$frontend_pid" 2>/dev/null || true
  wait "$backend_pid" 2>/dev/null || true
}

trap stop_servers EXIT INT TERM

echo "Starting JJK Messenger"
echo "Backend : http://localhost:${BACKEND_PORT}"
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo

(
  cd "$BACKEND_DIR"
  PORT="$BACKEND_PORT" npm run dev
) &
backend_pid=$!

(
  cd "$FRONTEND_DIR"
  NEXT_PUBLIC_API_URL="$API_URL" npm run dev -- -p "$FRONTEND_PORT"
) &
frontend_pid=$!

wait -n "$backend_pid" "$frontend_pid"
