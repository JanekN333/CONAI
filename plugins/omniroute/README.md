# Wtyczka OmniRoute dla Claude Code

Podłącza Claude Code do bramki AI [OmniRoute](https://github.com/diegosouzapw/OmniRoute).

## Co zawiera

| Element                | Opis |
| ---------------------- | ---- |
| Serwer MCP `omniroute` | Narzędzia OmniRoute (routing, providerzy, combos, cache, kompresja, zużycie, budżety) przez `/api/mcp/stream` |
| `/omniroute:status`    | Sprawdza serwer, listę modeli i połączenie MCP |
| `/omniroute:setup`     | Prowadzi przez instalację OmniRoute i konfigurację |
| Skill `omniroute`      | Instrukcje dla Claude: jak obsługiwać OmniRoute i jak puścić Claude Code przez bramkę |

## Instalacja

W Claude Code:

```
/plugin marketplace add janekn333/conai
/plugin install omniroute@conai
```

Lokalnie z klonu repo: `/plugin marketplace add /ścieżka/do/CONAI`.

## Konfiguracja

1. Uruchom OmniRoute: `npm i -g omniroute && omniroute` (albo Docker:
   `docker run -d -p 20128:20128 diegosouzapw/omniroute`).
2. Ustaw zmienne przed startem Claude Code:

   ```bash
   export OMNIROUTE_URL=http://localhost:20128   # domyślnie, można pominąć
   export OMNIROUTE_API_KEY=oma_live_...          # klucz z dashboardu OmniRoute
   ```

3. Zrestartuj Claude Code i uruchom `/omniroute:status`.
