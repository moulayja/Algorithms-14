  // ---------- teacher (asks Claude through the page's sample capability) ----------
  // Inserted into app.js by tools/build.js; shares its scope (TOPIC, esc, go, render, view, session).
  var AI = { sample: null, tts: null, ready: false, off: "" };
  var T = { turns: [], busy: false, ctl: null, ctx: null, topic: null, err: "", speaking: -1, back: null, sheet: false };
  try { var saved = JSON.parse(localStorage.getItem("nhie-teacher") || "null"); if (saved && saved.turns) { T.turns = saved.turns.slice(-20); } } catch (e) {}
  function saveChat() { try { localStorage.setItem("nhie-teacher", JSON.stringify({ turns: T.turns.slice(-20) })); } catch (e) {} }

  function aiInit() {
    if (!window.claude || !window.claude.use) { AI.ready = true; AI.off = "nowhere"; return; }
    window.claude.use("sample").then(function (s) { AI.sample = s; AI.ready = true; if (!s) AI.off = "nowhere"; if (tab === "teacher" && !session) render(); teacherChrome(); });
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
    else if (T.topic && TOPIC[T.topic]) ctxText += "\n\nThe student is currently studying the chapter: " + TOPIC[T.topic].title + ".";
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

  function starters() {
    var name = T.ctx ? "the lesson \"" + T.ctx.t + "\"" : T.topic && TOPIC[T.topic] ? "the chapter " + TOPIC[T.topic].title : "";
    if (!name) return STARTERS.map(function (x) { return [x, x]; });
    return [["Explain this lesson simply", "Teach me " + name + " in very simple words, step by step."],
      ["Draw me a picture of it", "Draw a picture that explains the main idea of " + name + "."],
      ["Give me a memory trick", "Give me memory tricks for the numbers and rules in " + name + "."],
      ["Quiz me on this", "Ask me 3 exam-style multiple choice questions on " + name + ", one at a time, and wait for my answer."]];
  }
  PAGES.teacher = function () {
    var back = T.back ? '<div class="backbar"><button class="back" data-act="tBack"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>Back to your questions</button></div>' : "";
    var head = back + '<header class="row"><div class="grow stack" style="gap:2px"><h1>Teacher</h1><span class="small muted">Ask anything from Volume 1 or 2. Ask for a picture if you want to see it.</span></div>' +
      (T.turns.length ? '<button class="quiet" data-act="tNew">New chat</button>' : "") + "</header>";
    return '<div class="stack">' + head + chatBody() + "</div>";
  };
  function chatBody() {
    if (!AI.ready) return '<section class="card muted">Connecting to the teacher…</section>';
    if (!AI.sample) return '<section class="card stack"><b>The teacher is not available here</b><p class="muted">The teacher uses Claude, so it only works when this page is opened in Claude (claude.ai or the Claude app) while you are signed in. Everything else in the app still works.</p></section>';
    if (AI.off === "denied") return '<section class="card stack"><b>The teacher is turned off</b><p class="muted">You chose not to let this page use Claude. To turn it on, open this artifact\'s Permissions menu, allow Claude, then reload the page.</p></section>';
    var ctx = T.ctx ? '<div class="row card" style="padding:10px 14px"><span class="small grow">Talking about: <b>' + esc(T.ctx.t) + "</b> " + chip(TOPIC[T.ctx.topic]) + '</span><button class="quiet" data-act="tCtxOff" aria-label="Stop focusing on this lesson">✕</button></div>'
      : T.topic && TOPIC[T.topic] ? '<div class="row card" style="padding:10px 14px"><span class="small grow">Talking about: ' + chip(TOPIC[T.topic]) + '</span><button class="quiet" data-act="tCtxOff" aria-label="Stop focusing on this chapter">✕</button></div>' : "";
    var msgs = T.turns.map(function (t, i) {
      if (t.role === "user") return '<div class="msg me">' + esc(t.show || t.content) + "</div>";
      return '<div class="msg bot"><div class="lesson" id="tb' + i + '">' + answerHtml(t.content, false) + "</div>" +
        (AI.tts ? '<div class="row"><button class="quiet small" data-act="tSpeak" data-arg="' + i + '" id="ts' + i + '">' + (T.speaking === i ? "■ Stop" : "🔊 Listen") + "</button></div>" : "") + "</div>";
    }).join("");
    if (T.busy) msgs += '<div class="msg bot"><div class="lesson" id="tlive"><p class="muted">Thinking…</p></div></div>';
    var empty = !T.turns.length && !T.busy ? '<section class="card stack"><p>Hi! I am your NHIE teacher. Ask me about anything you did not understand, in your own words. I can explain it more simply, give examples and memory tricks, quiz you, and draw diagrams.</p><div class="chips">' +
      starters().map(function (s) { return '<button class="chip" data-act="tAsk" data-arg="' + esc(s[1]) + '">' + esc(s[0]) + "</button>"; }).join("") + "</div></section>" : "";
    var quick = T.turns.length && !T.busy ? '<div class="chips">' + QUICK.map(function (q) { return '<button class="chip" data-act="tAsk" data-arg="' + esc(q[1]) + '">' + q[0] + "</button>"; }).join("") + "</div>" : "";
    var err = T.err ? '<p class="why no small">' + esc(T.err) + "</p>" : "";
    var box = '<form class="composer" data-form="teacher"><textarea id="tin" rows="2" placeholder="Type your question…" aria-label="Your question"' + (T.busy ? " disabled" : "") + "></textarea>" +
      (T.busy ? '<button type="button" data-act="tStop">Stop</button>' : '<button class="primary" type="submit">Ask</button>') + "</form>";
    return ctx + empty + '<div class="chat">' + msgs + "</div>" + err + quick + box;
  }

  // ---- the teacher as a panel over any subject page: closing it leaves you exactly where you were ----
  var sheetEl = document.createElement("div"), fabEl = document.createElement("button");
  sheetEl.id = "tsheet"; sheetEl.hidden = true; document.body.appendChild(sheetEl);
  fabEl.id = "tfab"; fabEl.type = "button"; fabEl.hidden = true; fabEl.setAttribute("data-act", "tOpen");
  fabEl.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8.5 9.5h7M8.5 12.5h4"/></svg>Ask the teacher';
  document.body.appendChild(fabEl);
  function subjectHere() {
    if (session && session.kind === "exam") return null;
    if (session && session.kind === "quiz" && session.cur) return { t: session.cur.t, l: session.cur.l };
    if (session && session.kind === "cards" && session.queue[session.i]) return { t: session.queue[session.i].t, l: session.queue[session.i].l };
    if (session && session.lesson) return { t: session.lesson.topic, l: session.lesson.i };
    if (!session && tab === "study" && sub && sub.t) return { t: sub.t, l: sub.sec != null ? sub.sec : null };
    return null;
  }
  function teacherChrome() { fabEl.hidden = !(AI.sample && AI.off !== "denied" && !T.sheet && tab !== "teacher" && subjectHere()); }
  function renderSheet() {
    sheetEl.hidden = !T.sheet;
    if (!T.sheet) { sheetEl.innerHTML = ""; return; }
    var keep = document.getElementById("tin"), draft = keep ? keep.value : "";
    sheetEl.innerHTML = '<div class="sheet-bg" data-act="tClose"></div><section class="sheet" role="dialog" aria-modal="true" aria-label="Teacher">' +
      '<header class="sheet-head"><span class="grip" aria-hidden="true"></span><b class="grow">Teacher</b>' + (T.turns.length ? '<button class="quiet" data-act="tNew">New chat</button>' : "") +
      '<button class="sheet-x" data-act="tClose" aria-label="Close the teacher and go back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>' +
      '<div class="sheet-body stack" id="tbody">' + chatBody() + "</div></section>";
    var tin = document.getElementById("tin"); if (tin && draft) tin.value = draft;
  }
  function openSheet() {
    if (T.sheet) return renderSheet();
    var here = subjectHere();
    if (here) { T.topic = here.t; T.ctx = here.l != null && TOPIC[here.t].ls[here.l] ? TOPIC[here.t].ls[here.l] : null; }
    T.sheet = true; T.opener = document.activeElement;
    if (location.hash.slice(-1) !== "!") location.hash = location.hash.slice(1) + "!";
    document.body.style.overflow = "hidden";
    renderSheet(); teacherChrome(); scrollChat();
    var tin = document.getElementById("tin"); if (tin && !T.busy) tin.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (!T.sheet) return;
    T.sheet = false; document.body.style.overflow = "";
    renderSheet(); teacherChrome();
    if (location.hash.slice(-1) === "!") {
      var y = window.scrollY, h = "#" + location.hash.slice(1, -1);
      try { history.replaceState(history.state, "", h); } catch (e) { T.skipHash = true; location.replace(h); }
      window.scrollTo(0, y);
    }
    var o = T.opener; T.opener = null; if (o && o.focus && document.body.contains(o)) o.focus({ preventScroll: true });
  }
  function rerender() { if (T.sheet) renderSheet(); else render(); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && T.sheet) { e.preventDefault(); closeSheet(); } });

  function scrollChat() {
    var box = T.sheet && document.getElementById("tbody");
    if (box) { box.scrollTop = box.scrollHeight; return; }
    var el = document.getElementById("tlive") || view.querySelector(".msg:last-child"); if (el) el.scrollIntoView({ block: "end", behavior: "smooth" });
  }
  var ERR = { rate_limited: "The teacher needs a short break (usage limit reached). Try again in a few minutes.", session_expired: "Please sign in to Claude again, then ask again.", refused: "The teacher could not answer that one. Try asking it a different way.", empty_completion: "No answer came back. Try asking in a shorter way.", prompt_too_large: "That was too long. Start a new chat and ask again.", upstream_error: "The connection dropped. Press Ask to try again." };
  function ask(text, show) {
    text = String(text || "").trim();
    if (!text || T.busy || !AI.sample) return;
    T.turns.push({ role: "user", content: text, show: show || null });
    T.busy = true; T.err = ""; T.ctl = new AbortController();
    if (T.sheet) renderSheet(); else if (tab !== "teacher" || session) openSheet(); else render();
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
      if (T.sheet) { renderSheet(); scrollChat(); } else if (tab === "teacher" && !session) { render(); scrollChat(); }
    });
  }
  function paintSpeak() {
    document.querySelectorAll("[data-act=tSpeak]").forEach(function (b) { b.textContent = +b.getAttribute("data-arg") === T.speaking ? "■ Stop" : "🔊 Listen"; });
    document.querySelectorAll("[data-act=tLessonSpeak]").forEach(function (b) { b.textContent = T.speaking === "lesson" ? "■ Stop reading" : "🔊 Read it to me"; });
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
    tNew: function () { if (T.ctl) T.ctl.abort(); T.turns = []; T.err = ""; T.back = null; saveChat(); rerender(); },
    tCtxOff: function () { T.ctx = null; T.topic = null; rerender(); },
    tOpen: function () { openSheet(); },
    tClose: function () { closeSheet(); },
    tSpeak: function (a) { var t = T.turns[+a]; if (t) speakText(plainForSpeech(t.content), +a); },
    tLesson: function (a) {
      var x = a.split("|"), L = lessonById(x[0] + "|" + x[1]); if (!L) return;
      T.ctx = L;
      var asks = { simple: ["Teach me this lesson again in very simple words, step by step: " + L.t, "Explain this lesson more simply: " + L.t], draw: ["Draw a picture that explains the main idea of this lesson: " + L.t, "Draw a picture of: " + L.t] };
      if (asks[x[2]]) ask(asks[x[2]][0], asks[x[2]][1]); else openSheet();
    },
    tWhy: function () {
      var s = session, q = s && s.cur; if (!q) return;
      var L = q.l != null && TOPIC[q.t].ls ? TOPIC[q.t].ls[q.l] : null;
      T.ctx = L || T.ctx;
      var mine = s.picked >= 0 ? q.a[s.opts[s.picked]] : "";
      var txt = "I got this exam question wrong.\nQuestion: " + q.q + "\nI chose: " + mine + "\nCorrect answer: " + q.a[0] + "\nOther choices: " + q.a.slice(1).filter(function (x) { return x !== mine; }).join("; ") +
        "\nBook explanation: " + q.e + "\nExplain simply why the correct answer is right and why my choice is wrong, and give me a way to remember it.";
      ask(txt, "Why is \"" + q.a[0] + "\" the answer to: " + q.q);
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
