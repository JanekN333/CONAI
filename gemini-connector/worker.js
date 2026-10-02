// ConnectAI <-> Google Gemini connector (bez Zapiera).
// Cloudflare Worker: trzyma klucz API po stronie serwera i przekazuje
// rozmowę bezpośrednio do Google Generative Language API.
//
// Sekrety / zmienne (wrangler secret put / wrangler.toml [vars]):
//   GEMINI_API_KEY   – klucz z https://aistudio.google.com/apikey (sekret, wymagany)
//   GEMINI_MODEL     – np. "gemini-2.5-flash" (opcjonalnie)
//   ALLOWED_ORIGINS  – lista domen po przecinku, np. "https://connectai.pl,http://localhost:8000"
//   SYSTEM_PROMPT    – instrukcja systemowa asystenta (opcjonalnie)

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_SYSTEM_PROMPT =
    'Jesteś asystentem firmy ConnectAI, która wdraża chatboty AI, inteligentne infolinie ' +
    'i automatyzacje procesów. Odpowiadaj po polsku, krótko i konkretnie. ' +
    'Jeśli klient chce porozmawiać o wdrożeniu, zaproponuj bezpłatną konsultację: ' +
    'https://calendly.com/jan-connectai/30min';
const MAX_MESSAGES = 30;
const MAX_CHARS = 4000;

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const cors = corsHeaders(origin, env);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: cors });
        }
        if (request.method !== 'POST') {
            return json({ error: 'Method not allowed' }, 405, cors);
        }
        if (!cors['Access-Control-Allow-Origin']) {
            return json({ error: 'Origin not allowed' }, 403, cors);
        }
        if (!env.GEMINI_API_KEY) {
            return json({ error: 'GEMINI_API_KEY is not configured' }, 500, cors);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return json({ error: 'Invalid JSON' }, 400, cors);
        }

        const contents = toGeminiContents(body && body.messages);
        if (!contents) {
            return json({ error: 'Expected { messages: [{ role: "user"|"assistant", content: string }] }' }, 400, cors);
        }

        const model = env.GEMINI_MODEL || DEFAULT_MODEL;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

        const upstream = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT }] },
                contents,
                generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
            }),
        });

        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            const message = (data.error && data.error.message) || `Gemini API error ${upstream.status}`;
            return json({ error: message }, 502, cors);
        }

        const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        const reply = parts.map((p) => p.text || '').join('').trim();
        return json({ reply, model }, 200, cors);
    },
};

// [{role: 'user'|'assistant', content}] -> Gemini "contents"; null if invalid.
function toGeminiContents(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return null;
    const recent = messages.slice(-MAX_MESSAGES);
    const contents = [];
    for (const m of recent) {
        if (!m || typeof m.content !== 'string' || !m.content.trim()) return null;
        if (m.role !== 'user' && m.role !== 'assistant') return null;
        contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content.slice(0, MAX_CHARS) }],
        });
    }
    if (contents[contents.length - 1].role !== 'user') return null;
    return contents;
}

function corsHeaders(origin, env) {
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
    };
    if (allowed.includes('*') || allowed.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin || '*';
    }
    return headers;
}

function json(payload, status, headers) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
    });
}
