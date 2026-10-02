// Klient connectora Google Gemini (bez Zapiera).
// Wymaga adresu wdrożonego proxy: window.GEMINI_CONNECTOR_URL (patrz gemini-connector/README.md).
(function () {
    function endpoint() {
        const url = window.GEMINI_CONNECTOR_URL;
        if (!url || url.includes('YOUR_')) {
            throw new Error('Ustaw window.GEMINI_CONNECTOR_URL na adres wdrożonego Workera.');
        }
        return url;
    }

    async function chat(messages) {
        const response = await fetch(endpoint(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `Błąd connectora (${response.status})`);
        }
        return data.reply;
    }

    function ask(prompt) {
        return chat([{ role: 'user', content: prompt }]);
    }

    window.GeminiConnector = { chat, ask };
})();
