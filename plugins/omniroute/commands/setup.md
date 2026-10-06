---
description: Przeprowadź przez instalację OmniRoute i konfigurację wtyczki
argument-hint: "[local|docker|remote <url>]"
allowed-tools: Bash(curl:*), Bash(omniroute:*), Bash(npm ls:*), Bash(which:*), Bash(docker ps:*)
---

Pomóż użytkownikowi skonfigurować OmniRoute dla Claude Code. Tryb: `$ARGUMENTS` (domyślnie `local`).

1. Sprawdź, co już jest: `which omniroute`, oraz czy `${OMNIROUTE_URL:-http://localhost:20128}/api/health` odpowiada.
2. Jeśli serwera brak, zaproponuj (nie wykonuj bez zgody):
   - `local`: `npm i -g omniroute && omniroute`
   - `docker`: `docker run -d --name omniroute -p 20128:20128 diegosouzapw/omniroute`
   - `remote <url>`: tylko ustawienie `OMNIROUTE_URL=<url>`.
3. Wyjaśnij, że klucz API tworzy się w dashboardzie (`/dashboard` → API Keys) lub `omniroute keys`, i że wtyczka czyta `OMNIROUTE_URL` oraz `OMNIROUTE_API_KEY` — trzeba je wyeksportować w powłoce (np. `~/.bashrc`) i zrestartować Claude Code, żeby serwer MCP `omniroute` się połączył.
4. Na koniec zaproponuj `/omniroute:status` do weryfikacji, a jeśli użytkownik chce, żeby sam Claude Code chodził przez OmniRoute — `omniroute launch` (patrz skill `omniroute`).
