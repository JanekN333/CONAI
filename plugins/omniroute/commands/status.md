---
description: Sprawdź stan serwera OmniRoute, dostępne modele i połączenie MCP
allowed-tools: Bash(curl:*), Bash(omniroute:*)
---

Sprawdź stan bramki OmniRoute pod adresem `${OMNIROUTE_URL:-http://localhost:20128}`:

1. `curl -s -m 5 "${OMNIROUTE_URL:-http://localhost:20128}/api/health"` — czy serwer odpowiada.
2. `curl -s -m 10 "${OMNIROUTE_URL:-http://localhost:20128}/v1/models" -H "Authorization: Bearer $OMNIROUTE_API_KEY"` — ile modeli/combos jest dostępnych (podaj liczbę i kilka przykładów, nie całą listę).
3. Jeśli dostępne są narzędzia MCP `omniroute`, użyj jednego tylko-do-odczytu (np. stan zdrowia lub providerów), żeby potwierdzić, że MCP działa.

Podsumuj krótko: serwer OK/nie, liczba modeli, MCP OK/nie. Jeśli serwer nie odpowiada, podaj jak go uruchomić (`npm i -g omniroute && omniroute`) i przypomnij o zmiennych `OMNIROUTE_URL` / `OMNIROUTE_API_KEY`. Nie wypisuj kluczy API.
