#!/usr/bin/env bash
# Local preview server for Aurea Plast (static site).
# Usage: ./scripts/serve.sh   or   bash scripts/serve.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4173}"
cd "$ROOT"
echo "Local site:  http://127.0.0.1:${PORT}/"
echo "Press Ctrl+C to stop."
exec python3 -m http.server "$PORT" --bind 127.0.0.1
