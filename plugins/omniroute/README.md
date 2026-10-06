# Wtyczka czatu OmniRoute

Pływający widżet czatu dla stron ConnectAI, który korzysta z bramki AI
[OmniRoute](https://github.com/diegosouzapw/OmniRoute). OmniRoute wystawia jeden
endpoint zgodny z OpenAI (`/v1/chat/completions`) i sam wybiera dostawcę modelu
(z automatycznym fallbackiem, także na darmowe modele).

Wtyczka to jeden plik JS bez zależności. Style są izolowane w Shadow DOM, więc
nie kolidują z CSS strony.

## 1. Uruchom OmniRoute

```bash
npm i -g omniroute
omniroute            # dashboard + API na http://localhost:20128
```

lub przez Dockera:

```bash
docker run -d -p 20128:20128 \
  -e CORS_ALLOWED_ORIGINS=https://twoja-domena.pl \
  diegosouzapw/omniroute
```

Widżet działa w przeglądarce, więc domena strony musi być dozwolona w CORS
OmniRoute: `CORS_ALLOWED_ORIGINS=https://twoja-domena.pl` (lista po przecinkach).

## 2. Osadź wtyczkę na stronie

Przed `</body>`:

```html
<script
  src="plugins/omniroute/omniroute-widget.js"
  data-endpoint="https://ai.twoja-domena.pl/v1"
  data-model="auto"
  data-title="Katarzyna z ConnectAI"
  data-color="#3b82f6"
></script>
```

Podgląd: `plugins/omniroute/demo.html`.

## Atrybuty

| Atrybut              | Domyślnie                     | Opis |
| -------------------- | ----------------------------- | ---- |
| `data-endpoint`      | `http://localhost:20128/v1`   | Bazowy URL API OmniRoute |
| `data-model`         | `auto`                        | Model lub combo OmniRoute (np. `auto`, `gpt-4o`, nazwa combo) |
| `data-api-key`       | —                             | Klucz API OmniRoute (patrz *Bezpieczeństwo*) |
| `data-title`         | `Asystent ConnectAI`          | Nagłówek okna czatu |
| `data-subtitle`      | `Odpowiadamy 24/7`            | Podtytuł |
| `data-greeting`      | powitanie po polsku           | Pierwsza wiadomość bota |
| `data-placeholder`   | `Napisz wiadomość…`           | Tekst w polu wpisywania |
| `data-system-prompt` | prompt ConnectAI              | Instrukcja systemowa dla modelu |
| `data-color`         | `#3b82f6`                     | Kolor przewodni |
| `data-position`      | `right`                       | `right` lub `left` |
| `data-stream`        | `true`                        | Strumieniowanie odpowiedzi (SSE) |
| `data-temperature`   | `0.7`                         | Temperatura modelu |
| `data-max-history`   | `20`                          | Ile ostatnich wiadomości wysyłać jako kontekst |
| `data-open`          | `false`                       | Otwórz czat od razu po załadowaniu |

## API JavaScript

```js
OmniRouteWidget.open();
OmniRouteWidget.close();
OmniRouteWidget.send("Ile kosztuje wdrożenie chatbota?");
OmniRouteWidget.reset();   // czyści rozmowę
```

Historia rozmowy jest trzymana w `sessionStorage` (znika po zamknięciu karty).

## Bezpieczeństwo

Wszystko w `data-*` jest widoczne w źródle strony. **Nie wpisuj klucza API
z dostępem do płatnych dostawców na publicznej stronie.** Zalecane opcje:

- utwórz w OmniRoute osobny klucz ograniczony do darmowego combo / limitów, albo
- postaw OmniRoute za reverse proxy, które samo dokleja nagłówek
  `Authorization` i ogranicza liczbę zapytań — wtedy `data-api-key` zostaw puste.

## Uwaga: Retell AI

`chatbot.html` ma już widżet Retell AI w prawym dolnym rogu. Jeśli chcesz mieć
oba widżety na jednej stronie, ustaw `data-position="left"` dla OmniRoute.
