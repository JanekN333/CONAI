# Google Gemini connector (bez Zapiera)

Strona wysyła wiadomości do własnego proxy (Cloudflare Worker), a ten woła
bezpośrednio Google Gemini API. Klucz API nigdy nie trafia do przeglądarki.

```
przeglądarka (gemini-connector.js) ──POST /──> Worker (worker.js) ──> generativelanguage.googleapis.com
```

## Wdrożenie (ok. 5 minut)

1. Wygeneruj klucz: https://aistudio.google.com/apikey
2. Zainstaluj Wranglera i zaloguj się do Cloudflare (darmowy plan wystarczy):
   ```bash
   npm install -g wrangler
   wrangler login
   ```
3. W `wrangler.toml` ustaw `ALLOWED_ORIGINS` na domenę strony, np.
   `"https://twojadomena.pl,http://localhost:8000"`.
4. Dodaj klucz jako sekret i wdróż:
   ```bash
   cd gemini-connector
   wrangler secret put GEMINI_API_KEY
   wrangler deploy
   ```
   Wrangler wypisze adres, np. `https://connectai-gemini.<konto>.workers.dev`.
5. Wpisz ten adres w `GEMINI_CONNECTOR_URL` w `gemini.html` (albo przed
   załadowaniem `gemini-connector.js` na dowolnej podstronie).

## Użycie na stronie

```html
<script>window.GEMINI_CONNECTOR_URL = 'https://connectai-gemini.<konto>.workers.dev';</script>
<script src="gemini-connector.js"></script>
<script>
  GeminiConnector.ask('Czym jest inteligentna infolinia?').then(console.log);
</script>
```

`GeminiConnector.chat(messages)` przyjmuje całą historię
(`[{ role: 'user' | 'assistant', content: '...' }]`) i zwraca tekst odpowiedzi.

## API proxy

`POST /` z `{"messages": [{"role": "user", "content": "Cześć"}]}` →
`{"reply": "...", "model": "gemini-2.5-flash"}`.

Opcjonalne zmienne: `GEMINI_MODEL` (model Gemini), `SYSTEM_PROMPT`
(instrukcja systemowa asystenta).

## Test lokalny

```bash
cd gemini-connector
echo 'GEMINI_API_KEY=twoj_klucz' > .dev.vars
wrangler dev            # proxy na http://localhost:8787
# w drugim terminalu, z katalogu głównego repo:
python3 -m http.server 8000   # http://localhost:8000/gemini.html
```
