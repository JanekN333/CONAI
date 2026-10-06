/*!
 * ConnectAI — wtyczka czatu OmniRoute
 * Pływający widżet czatu, który rozmawia z bramką OmniRoute
 * (https://github.com/diegosouzapw/OmniRoute) przez jej API zgodne z OpenAI
 * (POST {endpoint}/chat/completions, odpowiedź strumieniowana SSE).
 *
 * Użycie:
 *   <script src="plugins/omniroute/omniroute-widget.js"
 *           data-endpoint="https://twoj-serwer:20128/v1"
 *           data-model="auto"></script>
 *
 * Wszystkie atrybuty opisane są w plugins/omniroute/README.md.
 */
(function () {
  "use strict";

  if (window.OmniRouteWidget) return;

  var script = document.currentScript;
  var ds = (script && script.dataset) || {};

  var config = {
    endpoint: (ds.endpoint || "http://localhost:20128/v1").replace(/\/+$/, ""),
    apiKey: ds.apiKey || "",
    model: ds.model || "auto",
    title: ds.title || "Asystent ConnectAI",
    subtitle: ds.subtitle || "Odpowiadamy 24/7",
    greeting:
      ds.greeting ||
      "Cześć! 👋 Jestem asystentem ConnectAI. W czym mogę pomóc?",
    placeholder: ds.placeholder || "Napisz wiadomość…",
    systemPrompt:
      ds.systemPrompt ||
      "Jesteś uprzejmym asystentem firmy ConnectAI, która wdraża chatboty AI, " +
        "wirtualne infolinie i automatyzację procesów. Odpowiadaj zwięźle, po polsku, " +
        "chyba że użytkownik pisze w innym języku.",
    color: ds.color || "#3b82f6",
    position: ds.position === "left" ? "left" : "right",
    stream: ds.stream !== "false",
    temperature: ds.temperature ? parseFloat(ds.temperature) : 0.7,
    maxHistory: ds.maxHistory ? parseInt(ds.maxHistory, 10) : 20,
    open: ds.open === "true",
  };

  var STORAGE_KEY = "omniroute-widget-history";
  var history = loadHistory();
  var busy = false;

  function loadHistory() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      /* brak dostępu do storage — historia tylko w pamięci */
    }
  }

  var css =
    ":host{all:initial}" +
    "*{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif}" +
    ".launcher{position:fixed;bottom:20px;" + config.position + ":20px;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;" +
    "background:var(--c);color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;z-index:2147483000;transition:transform .2s}" +
    ".launcher:hover{transform:scale(1.07)}" +
    ".launcher svg{width:28px;height:28px}" +
    ".panel{position:fixed;bottom:92px;" + config.position + ":20px;width:370px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 120px);" +
    "background:#fff;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;z-index:2147483000}" +
    ".panel.open{display:flex}" +
    ".head{background:var(--c);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:10px}" +
    ".head .t{flex:1;min-width:0}" +
    ".head b{display:block;font-size:15px}" +
    ".head small{opacity:.85;font-size:12px}" +
    ".icon-btn{background:transparent;border:none;color:#fff;cursor:pointer;padding:6px;border-radius:8px;display:flex}" +
    ".icon-btn:hover{background:rgba(255,255,255,.18)}" +
    ".icon-btn svg{width:18px;height:18px}" +
    ".msgs{flex:1;overflow-y:auto;padding:16px;background:#f8fafc;display:flex;flex-direction:column;gap:10px}" +
    ".m{max-width:85%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;color:#1e293b}" +
    ".m.bot{background:#fff;border:1px solid #e2e8f0;align-self:flex-start;border-bottom-left-radius:4px}" +
    ".m.user{background:var(--c);color:#fff;align-self:flex-end;border-bottom-right-radius:4px}" +
    ".m.err{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;align-self:flex-start}" +
    ".typing{display:inline-flex;gap:4px}" +
    ".typing i{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:b 1.2s infinite}" +
    ".typing i:nth-child(2){animation-delay:.15s}.typing i:nth-child(3){animation-delay:.3s}" +
    "@keyframes b{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}" +
    "form{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;background:#fff}" +
    "textarea{flex:1;resize:none;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:14px;max-height:110px;outline:none;color:#1e293b;background:#fff}" +
    "textarea:focus{border-color:var(--c)}" +
    ".send{background:var(--c);color:#fff;border:none;border-radius:10px;padding:0 14px;cursor:pointer;display:flex;align-items:center}" +
    ".send:disabled{opacity:.5;cursor:default}" +
    ".send svg{width:18px;height:18px}" +
    ".foot{text-align:center;font-size:11px;color:#94a3b8;padding:0 0 8px;background:#fff}" +
    "@media (max-width:480px){.panel{" + config.position + ":8px;bottom:84px;width:calc(100vw - 16px);height:calc(100vh - 100px)}}";

  var ICON_CHAT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var ICON_RESET =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>';
  var ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>';

  var host = document.createElement("div");
  host.id = "omniroute-widget";
  var root = host.attachShadow({ mode: "open" });
  root.innerHTML =
    "<style>" + css + "</style>" +
    '<button class="launcher" aria-label="Otwórz czat">' + ICON_CHAT + "</button>" +
    '<div class="panel" role="dialog" aria-label="' + escapeAttr(config.title) + '">' +
    '<div class="head"><div class="t"><b></b><small></small></div>' +
    '<button class="icon-btn reset" title="Nowa rozmowa" aria-label="Nowa rozmowa">' + ICON_RESET + "</button>" +
    '<button class="icon-btn close" title="Zamknij" aria-label="Zamknij">' + ICON_CLOSE + "</button></div>" +
    '<div class="msgs" aria-live="polite"></div>' +
    '<form><textarea rows="1"></textarea><button class="send" type="submit" aria-label="Wyślij">' + ICON_SEND + "</button></form>" +
    '<div class="foot">Działa dzięki OmniRoute</div></div>';
  host.style.setProperty("--c", config.color);

  var $ = function (sel) { return root.querySelector(sel); };
  var launcher = $(".launcher");
  var panel = $(".panel");
  var msgs = $(".msgs");
  var form = $("form");
  var input = $("textarea");
  var sendBtn = $(".send");

  $(".head b").textContent = config.title;
  $(".head small").textContent = config.subtitle;
  input.placeholder = config.placeholder;

  function escapeAttr(s) {
    return String(s).replace(/[&"<>]/g, function (c) {
      return { "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  function addBubble(kind, text) {
    var el = document.createElement("div");
    el.className = "m " + kind;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function renderAll() {
    msgs.innerHTML = "";
    addBubble("bot", config.greeting);
    history.forEach(function (m) {
      addBubble(m.role === "user" ? "user" : "bot", m.content);
    });
  }

  function toggle(force) {
    var open = typeof force === "boolean" ? force : !panel.classList.contains("open");
    panel.classList.toggle("open", open);
    launcher.innerHTML = open ? ICON_CLOSE : ICON_CHAT;
    launcher.setAttribute("aria-label", open ? "Zamknij czat" : "Otwórz czat");
    if (open) setTimeout(function () { input.focus(); }, 50);
  }

  function setBusy(b) {
    busy = b;
    sendBtn.disabled = b;
  }

  function buildMessages() {
    var recent = history.slice(-config.maxHistory);
    var out = [];
    if (config.systemPrompt) out.push({ role: "system", content: config.systemPrompt });
    return out.concat(recent);
  }

  function headers() {
    var h = { "Content-Type": "application/json" };
    if (config.apiKey) h.Authorization = "Bearer " + config.apiKey;
    return h;
  }

  function describeError(err, status) {
    if (status === 401 || status === 403) return "Brak autoryzacji w OmniRoute — sprawdź klucz API (data-api-key).";
    if (status === 429) return "Przekroczono limit zapytań. Spróbuj ponownie za chwilę.";
    if (status) return "Serwer OmniRoute zwrócił błąd " + status + ".";
    return "Nie udało się połączyć z OmniRoute (" + config.endpoint + "). " +
      "Sprawdź, czy serwer działa i czy ta domena jest w CORS_ALLOWED_ORIGINS.";
  }

  function readStream(res, onDelta) {
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer = "";
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) return;
        buffer += decoder.decode(r.value, { stream: true });
        var lines = buffer.split("\n");
        buffer = lines.pop();
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (line.indexOf("data:") !== 0) continue;
          var data = line.slice(5).trim();
          if (data === "[DONE]") return;
          try {
            var json = JSON.parse(data);
            var delta = json.choices && json.choices[0] && json.choices[0].delta;
            if (delta && delta.content) onDelta(delta.content);
          } catch (e) {
            /* pomijamy niepełne / nie-JSON-owe linie */
          }
        }
        return pump();
      });
    }
    return pump();
  }

  function send(text) {
    if (busy || !text) return;
    setBusy(true);
    history.push({ role: "user", content: text });
    saveHistory();
    addBubble("user", text);

    var bubble = addBubble("bot", "");
    bubble.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    var answer = "";

    fetch(config.endpoint + "/chat/completions", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: config.model,
        messages: buildMessages(),
        temperature: config.temperature,
        stream: config.stream,
      }),
    })
      .then(function (res) {
        if (!res.ok) {
          var e = new Error("HTTP " + res.status);
          e.status = res.status;
          throw e;
        }
        var ct = res.headers.get("content-type") || "";
        if (config.stream && res.body && ct.indexOf("text/event-stream") !== -1) {
          return readStream(res, function (chunk) {
            answer += chunk;
            bubble.textContent = answer;
            msgs.scrollTop = msgs.scrollHeight;
          });
        }
        return res.json().then(function (json) {
          answer = (json.choices && json.choices[0] && json.choices[0].message &&
            json.choices[0].message.content) || "";
        });
      })
      .then(function () {
        answer = answer.trim() || "(brak odpowiedzi)";
        bubble.textContent = answer;
        history.push({ role: "assistant", content: answer });
        saveHistory();
      })
      .catch(function (err) {
        bubble.className = "m err";
        bubble.textContent = describeError(err, err && err.status);
        history.pop(); // nie zapisujemy pytania, na które nie było odpowiedzi
        saveHistory();
      })
      .then(function () {
        setBusy(false);
        msgs.scrollTop = msgs.scrollHeight;
      });
  }

  launcher.addEventListener("click", function () { toggle(); });
  $(".close").addEventListener("click", function () { toggle(false); });
  $(".reset").addEventListener("click", function () {
    if (busy) return;
    history = [];
    saveHistory();
    renderAll();
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    input.value = "";
    input.style.height = "";
    send(text);
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit"));
    }
  });
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 110) + "px";
  });

  function mount() {
    document.body.appendChild(host);
    renderAll();
    if (config.open) toggle(true);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  window.OmniRouteWidget = {
    open: function () { toggle(true); },
    close: function () { toggle(false); },
    send: function (text) { toggle(true); send(String(text || "").trim()); },
    reset: function () { history = []; saveHistory(); renderAll(); },
    config: config,
  };
})();
