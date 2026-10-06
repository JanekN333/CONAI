---
name: omniroute
description: Praca z bramką AI OmniRoute (https://github.com/diegosouzapw/OmniRoute) — instalacja i uruchomienie serwera, podłączenie Claude Code przez OmniRoute, zarządzanie providerami, modelami, combos (routing/fallback), kompresją, cache i zużyciem przez narzędzia MCP `omniroute` lub CLI `omniroute`. Używaj, gdy użytkownik wspomina OmniRoute, bramkę/router LLM, darmowe modele przez jeden endpoint albo chce przełączyć Claude Code na innego providera.
---

# OmniRoute

OmniRoute to lokalna (lub samohostowana) bramka AI: jeden endpoint zgodny z OpenAI
i Anthropic (`http://localhost:20128/v1`) przed setkami providerów, z routingiem,
automatycznym fallbackiem, kompresją tokenów (RTK + Caveman) i cache.

## Konfiguracja wtyczki

Serwer MCP `omniroute` z tej wtyczki łączy się z
`${OMNIROUTE_URL:-http://localhost:20128}/api/mcp/stream`, a klucz bierze z
`OMNIROUTE_API_KEY`. Zmienne trzeba ustawić **przed** uruchomieniem Claude Code.

Wymagania po stronie OmniRoute (domyślnie wyłączone!):

- MCP włączone i transport `streamable-http` — w dashboardzie (Endpoints / Settings → MCP)
  albo: `PATCH /api/settings` z `{"mcpEnabled": true, "mcpTransport": "streamable-http"}`.
- Klucz API ze scope `manage` (zwykły klucz do inference dostaje `Invalid management token`).

## Instalacja i start serwera

```bash
npm i -g omniroute
omniroute              # dashboard + API na http://localhost:20128
omniroute doctor       # diagnostyka instalacji
omniroute health       # stan serwera, circuit breakery, providerzy
```

Docker: `docker run -d -p 20128:20128 diegosouzapw/omniroute`.

Dashboard (providerzy, klucze, combos): `http://localhost:20128`.

## Jak działać

1. Najpierw sprawdź, czy serwer żyje: `curl -s "${OMNIROUTE_URL:-http://localhost:20128}/api/health/ping"`.
   Jeśli nie odpowiada — zaproponuj `omniroute` (lub Docker) zamiast zgadywać.
2. Do odczytu i zmian konfiguracji (providerzy, modele, combos, cache, kompresja,
   zużycie, budżety) preferuj narzędzia MCP `mcp__plugin_omniroute_omniroute__*`.
   Jeśli serwer MCP jest niedostępny, użyj CLI `omniroute …` albo REST z
   `Authorization: Bearer $OMNIROUTE_API_KEY`.
3. Operacje zmieniające stan (usuwanie providerów/kluczy, zmiana routingu,
   restart, restore backupu) potwierdź z użytkownikiem przed wykonaniem.
4. Nigdy nie wypisuj pełnych kluczy API w odpowiedziach.

## Przydatne endpointy REST

| Endpoint                     | Do czego                                   |
| ---------------------------- | ------------------------------------------ |
| `GET /api/health/ping`       | Czy serwer żyje (bez autoryzacji)          |
| `GET /api/monitoring/health` | Szczegółowy stan serwera                   |
| `GET /v1/models`             | Lista modeli i combos dostępnych przez bramkę |
| `POST /v1/chat/completions`  | Inference zgodny z OpenAI (model `auto` działa bez kluczy) |
| `POST /v1/messages`          | Inference zgodny z Anthropic (używa go Claude Code) |
| `/api/mcp/stream`            | Serwer MCP (HTTP)                          |

## Claude Code przez OmniRoute

Żeby sam Claude Code korzystał z modeli przez OmniRoute:

```bash
omniroute launch                         # ustawia zmienne i uruchamia `claude`
omniroute setup-claude                   # profile per-model w ~/.claude/profiles/
omniroute launch --profile <nazwa>
```

Ręcznie (zmienne czytane tylko przy starcie):

```bash
export ANTHROPIC_BASE_URL=http://localhost:20128   # bez /v1
export ANTHROPIC_AUTH_TOKEN=<klucz OmniRoute>
export ANTHROPIC_MODEL=<model lub combo>           # opcjonalnie
```

Pełna dokumentacja: https://github.com/diegosouzapw/OmniRoute/tree/main/docs
(m.in. `docs/guides/CLAUDE-CODE-CONFIGURATION.md`, `docs/frameworks/MCP-SERVER.md`)
oraz gotowe skille: https://github.com/diegosouzapw/OmniRoute/tree/main/skills
