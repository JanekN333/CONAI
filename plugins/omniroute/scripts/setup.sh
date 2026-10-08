#!/usr/bin/env bash
# Instalacja i konfiguracja OmniRoute dla wtyczki Claude Code "omniroute".
#
#   curl -fsSL https://raw.githubusercontent.com/JanekN333/CONAI/claude/zealous-archimedes-5p9i1y/plugins/omniroute/scripts/setup.sh | bash
#
# Kroki: instaluje OmniRoute (npm), uruchamia go w tle, włącza MCP
# (transport streamable-http), tworzy klucz API ze scope "manage" i zapisuje
# OMNIROUTE_API_KEY w pliku startowym powłoki.
#
# Zmienne opcjonalne:
#   OMNIROUTE_URL       adres serwera (domyślnie http://localhost:20128)
#   OMNIROUTE_PASSWORD  hasło do panelu (domyślnie CHANGEME — hasło nowej instalacji)
set -euo pipefail

URL="${OMNIROUTE_URL:-http://localhost:20128}"
PASSWORD="${OMNIROUTE_PASSWORD:-CHANGEME}"
COOKIES="$(mktemp)"
trap 'rm -f "$COOKIES"' EXIT

say()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31mBłąd:\033[0m %s\n' "$*" >&2; exit 1; }

command -v curl >/dev/null || fail "brak curl."
command -v node >/dev/null || fail "brak Node.js. Zainstaluj wersję 22 lub 24 z https://nodejs.org i uruchom skrypt ponownie."
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
case "$NODE_MAJOR" in
  22|24|25|26) ;;
  *) fail "OmniRoute wymaga Node 22 lub 24–26 (masz $(node -v))." ;;
esac

# 1. Instalacja
if command -v omniroute >/dev/null; then
  say "OmniRoute już zainstalowany."
else
  say "Instaluję OmniRoute (npm i -g omniroute)…"
  npm i -g omniroute || fail "instalacja nie powiodła się. Na Linux/macOS może być potrzebne: sudo npm i -g omniroute"
fi

# 2. Start serwera
ping() { curl -fsS -m 3 "$URL/api/health/ping" >/dev/null 2>&1; }
if ping; then
  say "Serwer działa: $URL"
else
  say "Uruchamiam OmniRoute w tle…"
  omniroute serve --daemon --no-open --no-tray >/dev/null 2>&1 || true
  for _ in $(seq 1 90); do ping && break; sleep 1; done
  ping || fail "serwer nie wystartował. Uruchom ręcznie: omniroute serve --log"
  say "Serwer działa: $URL"
fi

# 3. Logowanie do panelu
login() {
  curl -fsS -m 10 -c "$COOKIES" -X POST "$URL/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "$(node -e 'console.log(JSON.stringify({password: process.argv[1]}))' "$1")" >/dev/null 2>&1
}
if ! login "$PASSWORD"; then
  [ -r /dev/tty ] || fail "logowanie nieudane. Ustaw OMNIROUTE_PASSWORD=<hasło panelu> i uruchom ponownie."
  printf 'Hasło do panelu OmniRoute: ' >/dev/tty
  read -rs PASSWORD </dev/tty; echo >/dev/tty
  login "$PASSWORD" || fail "złe hasło."
fi

# 4. Włączenie MCP
say "Włączam MCP (transport streamable-http)…"
curl -fsS -m 10 -b "$COOKIES" -X PATCH "$URL/api/settings" \
  -H 'Content-Type: application/json' \
  -d '{"mcpEnabled":true,"mcpTransport":"streamable-http"}' >/dev/null \
  || fail "nie udało się zmienić ustawień MCP."

# 5. Klucz API
say "Tworzę klucz API ze scope 'manage'…"
KEY="$(curl -fsS -m 10 -b "$COOKIES" -X POST "$URL/api/keys" \
  -H 'Content-Type: application/json' \
  -d '{"name":"claude-code-plugin","scopes":["manage"]}' \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const k=JSON.parse(s).key;if(!k)process.exit(1);console.log(k)})')" \
  || fail "nie udało się utworzyć klucza API."

# 6. Weryfikacja MCP
STATUS="$(curl -s -m 10 -o /dev/null -w '%{http_code}' -X POST "$URL/api/mcp/stream" \
  -H "Authorization: Bearer $KEY" -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"setup","version":"1"}}}')"
[ "$STATUS" = "200" ] || fail "MCP nie odpowiada poprawnie (HTTP $STATUS)."
say "MCP działa."

# 7. Zapis klucza w powłoce
case "${SHELL:-}" in
  */zsh)  RC="$HOME/.zshrc" ;;
  */bash) if [ "$(uname)" = Darwin ]; then RC="$HOME/.bash_profile"; else RC="$HOME/.bashrc"; fi ;;
  *)      RC="$HOME/.profile" ;;
esac
touch "$RC"
TMP="$(mktemp)"
grep -v '^export OMNIROUTE_API_KEY=' "$RC" > "$TMP" || true
cat "$TMP" > "$RC"; rm -f "$TMP"
echo "export OMNIROUTE_API_KEY=$KEY" >> "$RC"
if [ "$URL" != "http://localhost:20128" ] && ! grep -q '^export OMNIROUTE_URL=' "$RC"; then
  echo "export OMNIROUTE_URL=$URL" >> "$RC"
fi
say "Zapisano OMNIROUTE_API_KEY w $RC"

echo
say "Gotowe! Teraz:"
echo "   1. Otwórz nowy terminal (albo: source $RC)"
echo "   2. Uruchom 'claude' i wpisz /omniroute:status"
if [ "$PASSWORD" = "CHANGEME" ]; then
  echo
  printf '\033[1;33mUwaga:\033[0m panel ma domyślne hasło CHANGEME — zmień je w %s (Settings).\n' "$URL"
fi
