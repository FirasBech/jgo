#!/usr/bin/env sh
# Start the J.GO bridge and open it in the browser (macOS / Linux).
# Configuration is read from a .env file - see .env.example.
cd "$(dirname "$0")" || exit 1

command -v node >/dev/null 2>&1 || { echo "Node.js not found - install it from https://nodejs.org"; exit 1; }

# Open the browser shortly after the server starts (best effort).
( sleep 2
  if command -v open >/dev/null 2>&1; then open http://localhost:8787
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:8787
  fi ) &

node server.mjs
