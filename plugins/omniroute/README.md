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

## Szybki start (jedna komenda)

Wymaga Node.js 22 lub 24 (https://nodejs.org). W terminalu (macOS / Linux / WSL / Git Bash):

```bash
curl -fsSL https://raw.githubusercontent.com/JanekN333/CONAI/claude/zealous-archimedes-5p9i1y/plugins/omniroute/scripts/setup.sh | bash
```

Skrypt instaluje OmniRoute, uruchamia go w tle, włącza MCP, tworzy klucz API
ze scope `manage` i zapisuje `OMNIROUTE_API_KEY` w `~/.zshrc` / `~/.bashrc`.
Potem otwórz nowy terminal, uruchom `claude` i wpisz `/omniroute:status`.

## Konfiguracja ręczna

1. Uruchom OmniRoute: `npm i -g omniroute && omniroute` (albo Docker:
   `docker run -d -p 20128:20128 diegosouzapw/omniroute`).
2. W dashboardzie OmniRoute (`http://localhost:20128`, domyślne hasło `CHANGEME` — zmień je):
   - włącz MCP i ustaw transport **streamable-http** (Endpoints / Settings),
   - utwórz klucz API ze scope **`manage`**.
3. Ustaw zmienne przed startem Claude Code:

   ```bash
   export OMNIROUTE_URL=http://localhost:20128   # domyślnie, można pominąć
   export OMNIROUTE_API_KEY=oma_live_...          # klucz z dashboardu OmniRoute
   ```

4. Zrestartuj Claude Code i uruchom `/omniroute:status`.
