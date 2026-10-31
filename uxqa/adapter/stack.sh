#!/usr/bin/env bash
# Isolated local NEOS stack for the UX study: api | web | status. Run api/web as tracked background jobs. See uxqa/adapter/AGENTS.md.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
export DATABASE_URL="postgresql+asyncpg://postgres:526152@127.0.0.1:5433/neos_uxqa"
export PYTHONIOENCODING=utf-8

case "${1:-}" in
  api)
    # Production-like: single process, no debug tracebacks in responses. Restart to pick up backend fixes.
    cd "$REPO/neos-operating-system/agent" && exec py -m neos_agent.main --port 8000 --single-process
    ;;
  web)
    cd "$REPO/charting-the-course" && exec npx vite --port 5173 --strictPort
    ;;
  status)
    printf 'api %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:8000/api/v1/health)"
    printf 'web %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:5173/)"
    printf 'proxied-api %s\n' "$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://localhost:5173/api/v1/health)"
    ;;
  *)
    echo "usage: stack.sh api | web | status"; exit 1 ;;
esac
