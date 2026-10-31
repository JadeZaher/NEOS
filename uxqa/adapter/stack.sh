#!/usr/bin/env bash
# Isolated local NEOS stack for the UX study: api | web | status. Run api/web as tracked background jobs. See uxqa/adapter/AGENTS.md.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
export DATABASE_URL="postgresql+asyncpg://postgres:526152@127.0.0.1:5433/neos_uxqa"
# Self sign-up lands newcomers in OmniOne (the seed gives every ecosystem one created_at).
export SIGNUP_DEFAULT_ECOSYSTEM_SLUG=omnione
export PYTHONIOENCODING=utf-8

case "${1:-}" in
  api)
    # Production-like: single process, no debug tracebacks in responses. Restart to pick up backend fixes.
    cd "$REPO/neos-operating-system/agent" && exec py -m neos_agent.main --port 8000 --single-process
    ;;
  stop-api)
    # Git Bash cannot exec a native exe in place, so stopping the `api` job leaves python.exe on :8000.
    # Kill only the :8000 listener whose command line is this stack's API, never whatever else holds the port.
    powershell.exe -NoProfile -Command '
      $listener = Get-NetTCPConnection -State Listen -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1
      if (-not $listener) { "api already stopped"; exit 0 }
      $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
      if ($process.CommandLine -notmatch "neos_agent\.main --port 8000") { "REFUSED :8000 is held by another process"; exit 2 }
      Stop-Process -Id $process.ProcessId -Force; "api stopped (pid $($process.ProcessId))"'
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
    echo "usage: stack.sh api | stop-api | web | status"; exit 1 ;;
esac
