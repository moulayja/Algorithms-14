  // ---------- teacher (asks Claude through the page's sample capability) ----------
  // Inserted into app.js by tools/build.js; shares its scope (TOPIC, esc, go, render, view, session).
  var AI = { sample: null, tts: null, ready: false, off: "" };
  var T = { turns: [], busy: false, ctl: null, ctx: null, err: "", speaking: -1, back: null };
  try { var saved = JSON.parse(localStorage.getItem("nhie-teacher") || "null"); if (saved && saved.turns) { T.turns = saved.turns.slice(-20); } } catch (e) {}
  function saveChat() { try { localStorage.setItem("nhie-teacher", JSON.stringify({ turns: T.turns.slice(-20) })); } catch (e) {} }

  function aiInit() {
    if (!window.claude || !window.claude.use) { AI.ready = true; AI.off = "nowhere"; return; }
    window.claude.use("sample").then(function (s) { AI.sample = s; AI.ready = true; if (!s) AI.off = "nowhere"; if (tab === "teacher" && !session) render(); });
    window.claude.use("tts").then(function (t) { AI.tts = t; if (t && t.onState) t.onState(function (st) { if (st.state === "idle") { T.speaking = -1; paintSpeak(); } }); });
  }

  var STOP = " about after again also because been before being below between both could does doing down each from have having here into just know like make more most much need only other over same should some such than that their them then there these they this those through under very want what when where which while will with would your yours explain please tell mean means simple simply ";
  function lessonText(L) {
    return "Lesson: " + L.t + " (" + TOPIC[L.topic].title + ", book pages " + L.p + ")\n" + L.teach.join("\n") +
      "\nKey facts:\n" + L.cards.map(function (c) { return "- " + c[0] + ": " + c[1]; }).join("\n");
  }
  function lessonFlat(L) { return (L.t + " " + L.teach.join(" ") + " " + L.cards.map(function (c) { return c[0] + " " + c[1]; }).join(" ")).toLowerCase(); }
  function related(q, skip) {
    var words = q.toLowerCase().match(/[a-z]{4,}/g) || [];
    words = words.filter(function (w) { return STOP.indexOf(" " + w + " ") < 0; });
    if (!words.length) return [];
    var scored = [];
    TOPICS.forEach(function (t) { (t.ls || []).forEach(function (L) {
      if (L === skip) return;
      var txt = lessonFlat(L), title = L.t.toLowerCase(), sc = 0;
      words.forEach(function (w) { var n = txt.split(w).length - 1; if (n) sc += Math.min(n, 4) + (title.indexOf(w) >= 0 ? 3 : 0); });
      if (sc) scored.push([sc, L]);
    }); });
    return scored.sort(function (a, b) { return b[0] - a[0]; }).slice(0, 2).map(function (x) { return x[1]; });
  }

  var RULES = [
    "You are the teacher inside NHIE School, a study app for one student preparing for the National Home Inspector Examination (NHIE). The student has failed the exam several times and studies every day from the two NHIE manuals: Volume 1 (electrical, cooling, heating, plumbing, fireplaces and chimneys, kitchen appliances) and Volume 2 (site, exterior, roof, structure, insulation and ventilation, interior, analysis and reporting, professional responsibilities).",
    "How to teach:",
    "- Use very simple everyday words and short sentences. Explain like a patient friend who is a home inspector.",
    "- One idea at a time. Start with the core idea in one or two sentences, then a concrete example from a real house.",
    "- Define every technical word or abbreviation the first time you use it.",
    "- Give a memory trick when it helps remember a number, a list or a rule.",
    "- Point out how the exam is likely to test it, and common traps.",
    "- Keep answers under about 220 words unless the student asks for more detail.",
    "- When it fits, end with one short check question for the student. Do not give its answer unless they reply.",
    "Accuracy:",
    "- Stay on home inspection and the NHIE. Base your answer on the lesson notes below when they cover the question.",
    "- If the notes do not cover it, use standard home inspection knowledge and say so. If a detail varies by local code or you are not sure of an exact number, say that plainly instead of guessing.",
    "Format (the app renders this, so follow it exactly):",
    "- Plain text paragraphs. Lines starting with '- ' become bullets. Wrap key words or numbers in **double asterisks**. No headings, tables or other Markdown.",
    "- Pictures: when a picture would help the student understand (always when they ask to see, draw or show something), include exactly one diagram as SVG code inside a fenced block that starts with ```svg and ends with ```.",
    "- SVG rules: <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 640 420\">; first draw a white background rect covering the whole viewBox; dark strokes (#1f2a33) and a few soft fills; label every important part with <text> at font-size 16 or larger in font-family Arial; keep labels inside the viewBox and not overlapping; simple shapes only; no scripts, no images, no foreignObject, no external links, no CSS animations.",
    "- Draw a simple cross-section or schematic (like a textbook line drawing) that shows the idea: parts, flow arrows, measurements. Put a one-line caption in the text right after the code block."
  ].join("\n");

  function buildInput() {
    var last = T.turns[T.turns.length - 1].content, notes = [];
    if (T.ctx) notes.push(T.ctx);
    related(last, T.ctx).forEach(function (L) { notes.push(L); });
    var ctxText = notes.length ? "\n\nLesson notes from the app (written from the NHIE manuals):\n\n" + notes.map(lessonText).join("\n\n").slice(0, 9000) : "";
    if (T.ctx) ctxText += "\n\nThe student is currently studying: " + T.ctx.t + ".";
    var turns = T.turns.slice(-12);
    while (turns.length && turns[0].role !== "user") turns.shift();
    return [{ role: "user", content: RULES + ctxText }].concat(turns.map(function (t) { return { role: t.role, content: t.content }; }));
  }

  // --- rendering answers: paragraphs, bullets, bold, and one sanitized inline SVG ---
  var SVG_OK = /^(svg|g|defs|marker|path|rect|circle|ellipse|line|polyline|polygon|text|tspan|title|desc|lineargradient|radialgradient|stop|pattern|clippath|use|symbol)$/i;
  function cleanSvg(src) {
    var doc;
    try { doc = new DOMParser().parseFromString(src, "image/svg+xml"); } catch (e) { return ""; }
    var root = doc.documentElement;
    if (!root || root.nodeName.toLowerCase() !== "svg" || doc.getElementsByTagName("parsererror").length) return "";
    (function walk(el) {
      Array.prototype.slice.call(el.children).forEach(function (c) { if (!SVG_OK.test(c.nodeName)) c.remove(); else walk(c); });
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        var n = a.name.toLowerCase(), v = a.value.trim().toLowerCase();
        if (n.indexOf("on") === 0 || n === "style" && /url\(|expression/.test(v) || (n === "href" || n === "xlink:href") && v.charAt(0) !== "#") el.removeAttribute(a.name);
      });
    })(root);
    root.removeAttribute("width"); root.removeAttribute("height");
    root.setAttribute("role", "img");
    return new XMLSerializer().serializeToString(root);
  }
  function inline(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "$1"); }
  function textHtml(s) {
    var out = "", list = false;
    s.split("\n").forEach(function (line) {
      var l = line.trim();
      if (/^[-*•] /.test(l)) { if (!list) { out += "<ul>"; list = true; } out += "<li>" + inline(l.slice(2)) + "</li>"; return; }
      if (list) { out += "</ul>"; list = false; }
      if (l) out += "<p>" + inline(l.replace(/^#+\s*/, "")) + "</p>";
    });
    return out + (list ? "</ul>" : "");
  }
  function answerHtml(s, streaming) {
    var out = "", rest = s, m;
    while ((m = rest.match(/```(?:svg|xml|html)?\s*\n?/))) {
      out += textHtml(rest.slice(0, m.index));
      var after = rest.slice(m.index + m[0].length), end = after.indexOf("```");
      if (end < 0) { out += streaming ? '<div class="pic drawing">Drawing a picture…</div>' : ""; rest = ""; break; }
      var svg = cleanSvg(after.slice(0, end).trim());
      out += svg ? '<figure class="pic">' + svg + "</figure>" : '<p class="small muted">(The picture did not come out right. Ask "draw it again".)</p>';
      rest = after.slice(end + 3);
    }
    return out + textHtml(rest);
  }
  function plainForSpeech(s) { return s.replace(/```[\s\S]*?(```|$)/g, " ").replace(/\*\*/g, "").replace(/^[-*•] /gm, "").replace(/\s+/g, " ").trim(); }

  var QUICK = [["Simpler please", "Explain that again even more simply, like I am new to houses."], ["Draw it", "Draw me a picture that shows this."], ["Real example", "Give me a real example from a house inspection."], ["Memory trick", "Give me a memory trick to remember this for the exam."], ["Quiz me", "Ask me 3 exam-style multiple choice questions on this, one at a time, and wait for my answer."]];
  var STARTERS = ["What is the difference between a GFCI and an AFCI?", "Draw how a P-trap stops sewer gas", "Explain the four elements of a contract simply", "Why does attic ventilation matter?"];

  PAGES.teacher = function () {
    var back = T.back ? '<div class="backbar"><button class="back" data-act="tBack"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Back to your questions</button></div>' : "";
    var head = back + '<header class="row"><div class="grow stack" style="gap:2px"><h1>Teacher</h1><span class="small muted">Ask anything from Volume 1 or 2. Ask for a picture if you want to see it.</span></div>' +
      (T.turns.length ? '<button class="quiet" data-act="tNew">New chat</button>' : "") + "</header>";
    if (!AI.ready) return '<div class="stack">' + head + '<section class="card muted">Connecting to the teacher…</section></div>';
    if (!AI.sample) return '<div class="stack">' + head + '<section class="card stack"><b>The teacher is not available here</b><p class="muted">The teacher uses Claude, so it only works when this page is opened in Claude (claude.ai or the Claude app) while you are signed in. Everything else in the app still works.</p></section></div>';
    if (AI.off === "denied") return '<div class="stack">' + head + '<section class="card stack"><b>The teacher is turned off</b><p class="muted">You chose not to let this page use Claude. To turn it on, open this artifact\'s Permissions menu, allow Claude, then reload the page.</p></section></div>';
    var ctx = T.ctx ? '<div class="row card" style="padding:10px 14px"><span class="small grow">Talking about: <b>' + esc(T.ctx.t) + "</b> " + chip(TOPIC[T.ctx.topic]) + '</span><button class="quiet" data-act="tCtxOff" aria-label="Stop focusing on this lesson">✕</button></div>' : "";
    var msgs = T.turns.map(function (t, i) {
      if (t.role === "user") return '<div class="msg me">' + esc(t.show || t.content) + "</div>";
      return '<div class="msg bot"><div class="lesson" id="tb' + i + '">' + answerHtml(t.content, false) + "</div>" +
        (AI.tts ? '<div class="row"><button class="quiet small" data-act="tSpeak" data-arg="' + i + '" id="ts' + i + '">' + (T.speaking === i ? "■ Stop" : "🔊 Listen") + "</button></div>" : "") + "</div>";
    }).join("");
    if (T.busy) msgs += '<div class="msg bot"><div class="lesson" id="tlive"><p class="muted">Thinking…</p></div></div>';
    var empty = !T.turns.length && !T.busy ? '<section class="card stack"><p>Hi! I am your NHIE teacher. Ask me about anything you did not understand, in your own words. I can explain it more simply, give examples and memory tricks, quiz you, and draw diagrams.</p><div class="chips">' +
      STARTERS.map(function (s) { return '<button class="chip" data-act="tAsk" data-arg="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div></section>" : "";
    var quick = T.turns.length && !T.busy ? '<div class="chips">' + QUICK.map(function (q) { return '<button class="chip" data-act="tAsk" data-arg="' + esc(q[1]) + '">' + q[0] + "</button>"; }).join("") + "</div>" : "";
    var err = T.err ? '<p class="why no small">' + esc(T.err) + "</p>" : "";
    var box = '<form class="composer" data-form="teacher"><textarea id="tin" rows="2" placeholder="Type your question…" aria-label="Your question"' + (T.busy ? " disabled" : "") + "></textarea>" +
      (T.busy ? '<button type="button" data-act="tStop">Stop</button>' : '<button class="primary" type="submit">Ask</button>') + "</form>";
    return '<div class="stack">' + head + ctx + empty + '<div class="chat">' + msgs + "</div>" + err + quick + box + "</div>";
  };

  function scrollChat() { var el = document.getElementById("tlive") || view.querySelector(".msg:last-child"); if (el) el.scrollIntoView({ block: "end", behavior: "smooth" }); }
  var ERR = { rate_limited: "The teacher needs a short break (usage limit reached). Try again in a few minutes.", session_expired: "Please sign in to Claude again, then ask again.", refused: "The teacher could not answer that one. Try asking it a different way.", empty_completion: "No answer came back. Try asking in a shorter way.", prompt_too_large: "That was too long. Start a new chat and ask again.", upstream_error: "The connection dropped. Press Ask to try again." };
  function ask(text, show) {
    text = String(text || "").trim();
    if (!text || T.busy || !AI.sample) return;
    T.turns.push({ role: "user", content: text, show: show || null });
    T.busy = true; T.err = ""; T.ctl = new AbortController();
    if (tab !== "teacher" || session) go("teacher", null, true); else render();
    scrollChat();
    AI.sample(buildInput(), { cache: false, signal: T.ctl.signal, onText: function (u) {
      var el = document.getElementById("tlive"); if (el) el.innerHTML = answerHtml(u.text, true);
    } }).then(function (r) {
      T.turns.push({ role: "assistant", content: r.text + (r.truncated ? "\n\n(The answer was cut short. Ask me to continue.)" : "") });
    }, function (e) {
      var code = e && e.code;
      if (e && e.text && code !== "refused") T.turns.push({ role: "assistant", content: e.text + "\n\n(Stopped.)" });
      if (code === "not_granted" || code === "sampling_disabled" || code === "not_declared" || code === "capability_disabled" || code === "capability_removed") AI.off = "denied";
      else if (code !== "cancelled") T.err = ERR[code] || ERR.upstream_error;
    }).then(function () {
      T.busy = false; T.ctl = null; saveChat();
      if (tab === "teacher" && !session) { render(); scrollChat(); }
    });
  }
  function paintSpeak() {
    view.querySelectorAll("[data-act=tSpeak]").forEach(function (b) { b.textContent = +b.getAttribute("data-arg") === T.speaking ? "■ Stop" : "🔊 Listen"; });
    view.querySelectorAll("[data-act=tLessonSpeak]").forEach(function (b) { b.textContent = T.speaking === "lesson" ? "■ Stop reading" : "🔊 Read it to me"; });
  }
  function speakText(s, i) {
    if (!AI.tts) return;
    if (T.speaking === i) { T.speaking = -1; AI.tts.stop(); paintSpeak(); return; }
    var parts = [], buf = "";
    (s.match(/[^.!?]+[.!?]*\s*/g) || [s]).forEach(function (x) { if ((buf + " " + x).length > 1800) { parts.push(buf); buf = x; } else buf = buf ? buf + " " + x : x; });
    if (buf) parts.push(buf);
    T.speaking = i; paintSpeak();
    AI.tts.speak(parts.map(function (p) { return { text: p, language: "en" }; })).catch(function () {}).then(function () { if (T.speaking === i) { T.speaking = -1; paintSpeak(); } });
  }
  function lessonById(a) { var x = String(a).split("|"); return TOPIC[x[0]] && TOPIC[x[0]].ls[+x[1]]; }

  var TACT = {
    tAsk: function (a) { ask(a); },
    tBack: function () { var b = T.back; T.back = null; if (!b) return; tab = b.tab; sub = b.sub; session = b.session; if (location.hash !== "#" + tab) location.hash = tab; render(); window.scrollTo(0, 0); },
    tStop: function () { if (T.ctl) T.ctl.abort(); },
    tNew: function () { if (T.ctl) T.ctl.abort(); T.turns = []; T.err = ""; T.back = null; saveChat(); render(); },
    tCtxOff: function () { T.ctx = null; render(); },
    tSpeak: function (a) { var t = T.turns[+a]; if (t) speakText(plainForSpeech(t.content), +a); },
    tLesson: function (a) {
      var x = a.split("|"), L = lessonById(x[0] + "|" + x[1]); if (!L) return;
      T.ctx = L;
      var asks = { simple: ["Teach me this lesson again in very simple words, step by step: " + L.t, "Explain this lesson more simply: " + L.t], draw: ["Draw a picture that explains the main idea of this lesson: " + L.t, "Draw a picture of: " + L.t] };
      if (asks[x[2]]) ask(asks[x[2]][0], asks[x[2]][1]); else go("teacher", null, true);
    },
    tWhy: function () {
      var s = session, q = s && s.cur; if (!q) return;
      var L = q.l != null && TOPIC[q.t].ls ? TOPIC[q.t].ls[q.l] : null;
      T.ctx = L || T.ctx;
      var mine = s.picked >= 0 ? q.a[s.opts[s.picked]] : "";
      var txt = "I got this exam question wrong.\nQuestion: " + q.q + "\nI chose: " + mine + "\nCorrect answer: " + q.a[0] + "\nOther choices: " + q.a.slice(1).filter(function (x) { return x !== mine; }).join("; ") +
        "\nBook explanation: " + q.e + "\nExplain simply why the correct answer is right and why my choice is wrong, and give me a way to remember it.";
      T.back = { tab: tab, sub: sub, session: session };
      session = null; tab = "teacher"; sub = null; ask(txt, "Why is \"" + q.a[0] + "\" the answer to: " + q.q);
    },
    tLessonSpeak: function () {
      var L = TOPIC[sub.t].ls[sub.sec];
      speakText(L.t + ". " + L.teach.map(function (x) { return x.replace(/^(# |- |! )/, function (k) { return k === "! " ? "Remember: " : ""; }); }).join(" "), "lesson");
    }
  };
  document.addEventListener("submit", function (e) {
    if (e.target.getAttribute("data-form") !== "teacher") return;
    e.preventDefault(); var t = document.getElementById("tin"); if (t) ask(t.value);
  });
  document.addEventListener("keydown", function (e) {
    if (e.target.id === "tin" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(e.target.value); }
  });
