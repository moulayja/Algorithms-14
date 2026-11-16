(function () {
  "use strict";
  var N = window.NHIE;

  // Subjects, the manual volume they are filed under, and their NHIE exam domain
  // (1 = Property and Building Inspection, 2 = Analysis and Reporting, 3 = Professional Responsibilities).
  var TOPICS = [
    { id: "electrical", title: "Electrical System", vol: 1, dom: 1 },
    { id: "cooling", title: "Cooling System", vol: 1, dom: 1 },
    { id: "heating", title: "Heating System", vol: 1, dom: 1 },
    { id: "plumbing", title: "Plumbing System", vol: 1, dom: 1 },
    { id: "fireplaces", title: "Fireplaces & Chimneys", vol: 1, dom: 1 },
    { id: "kitchen", title: "Kitchen Appliances", vol: 1, dom: 1 },
    { id: "site", title: "Site Conditions", vol: 2, dom: 1 },
    { id: "exterior", title: "Exterior Components", vol: 2, dom: 1 },
    { id: "roof", title: "Roof Components", vol: 2, dom: 1 },
    { id: "structure", title: "Structural Components", vol: 2, dom: 1 },
    { id: "insulation", title: "Insulation & Ventilation", vol: 2, dom: 1 },
    { id: "interior", title: "The House Interior", vol: 2, dom: 1 },
    { id: "reporting", title: "Analysis & Reporting", vol: 2, dom: 2 },
    { id: "professional", title: "Professional Responsibilities", vol: 2, dom: 3 }
  ];
  var VOLS = { 1: "Volume 1 · Mechanical Systems", 2: "Volume 2 · Structural Systems and Business" };
  var DOM_WEIGHT = { 1: 0.63, 2: 0.25, 3: 0.12 };
  var INTERVAL = [0, 1, 3, 7, 16, 35]; // days until the next review, by box
  var SECONDS_PER_QUESTION = 72;       // the real exam allows 4 hours for 200 questions
  var TOPIC = {}, BOOK = {}, QBYID = {};
  TOPICS.forEach(function (t) {
    TOPIC[t.id] = t;
    t.qs = N.bank[t.id] || [];
    t.qs.forEach(function (q) { QBYID[q.id] = q; });
  });
  (N.books || []).forEach(function (b) { BOOK[b.id] = b; });

  // ---------- helpers ----------
  var view = document.getElementById("view");
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function today() { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  function tape(p, cls) { return '<div class="tape ' + (cls || "") + '" role="img" aria-label="' + p + ' percent"><i style="width:' + p + '%"></i></div>'; }
  function clock(s) { s = Math.max(0, s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" : "") + (h && m < 10 ? "0" : "") + m + ":" + (x < 10 ? "0" : "") + x; }

  // ---------- saved progress ----------
  // q: question id -> [box, due day, times right, times wrong]; c: card id -> [box, due day]
  var S = { meta: { exam: "", streak: [0, 0], read: {}, exams: [], done: {} }, q: {}, c: {}, u: {} };
  var PARTS = { meta: "meta", questions: "q", cards: "c" };
  var LS = "nhie-trainer-v1";
  try { var raw = JSON.parse(localStorage.getItem(LS) || "null"); if (raw && raw.meta) S = raw; } catch (e) {}
  S.u = S.u || {}; S.meta.read = S.meta.read || {}; S.meta.exams = S.meta.exams || []; S.meta.done = S.meta.done || {};

  var col = null, syncState = "checking", dirtySet = {}, flushing = false, flushTimer = 0;
  function dirty(part) {
    S.u[part] = Date.now(); dirtySet[part] = 1;
    try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {}
    clearTimeout(flushTimer); flushTimer = setTimeout(flush, 1500);
  }
  function flush() {
    if (!col || flushing) return;
    var part = Object.keys(dirtySet)[0]; if (!part) return;
    delete dirtySet[part]; flushing = true;
    col.doc(part).set({ j: JSON.stringify(S[PARTS[part]]), u: S.u[part] }).then(function () {
      setSync("account");
    }, function () { dirtySet[part] = 1; setSync("device"); }).then(function () {
      flushing = false; if (Object.keys(dirtySet).length) flushTimer = setTimeout(flush, 1500);
    });
  }
  function setSync(s) { syncState = s; var el = document.getElementById("sync"); if (el) el.textContent = syncLabel(); }
  function syncLabel() {
    return syncState === "account" ? "Progress is saved to your Claude account, so it follows you to your phone and computer."
      : syncState === "checking" ? "Checking where progress is saved…"
      : "Progress is saved in this browser only.";
  }
  function cloudInit() {
    if (!window.claude || !window.claude.use) return setSync("device");
    Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (r) {
      if (!r[0] || !r[1]) return setSync("device");
      return r[1].id().then(function (id) {
        if (!id) return setSync("device");
        col = r[0].collection("data/users/" + id);
        var names = Object.keys(PARTS);
        return Promise.all(names.map(function (n) { return col.doc(n).get(); })).then(function (snaps) {
          var changed = false;
          snaps.forEach(function (snap, i) {
            var n = names[i], d = snap.exists ? snap.data() : null, mine = S.u[n] || 0;
            if (d && d.u > mine) { try { S[PARTS[n]] = JSON.parse(d.j); S.u[n] = d.u; changed = true; } catch (e) {} }
            else if (mine && (!d || d.u < mine)) dirtySet[n] = 1;
          });
          S.meta.read = S.meta.read || {}; S.meta.exams = S.meta.exams || []; S.meta.done = S.meta.done || {}; S.meta.streak = S.meta.streak || [0, 0];
          setSync("account");
          if (changed) { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} if (!session) render(); }
          flush();
        });
      });
    }).catch(function () { setSync("device"); });
  }

  // ---------- spaced repetition ----------
  function qRec(id) { return S.q[id] || [0, 0, 0, 0]; }
  function seen(id) { var r = S.q[id]; return !!r && r[2] + r[3] > 0; }
  function touchDay() {
    var t = today(), st = S.meta.streak || [0, 0];
    if (st[0] !== t) { S.meta.streak = [t, st[0] === t - 1 ? st[1] + 1 : 1]; S.meta.done = {}; dirty("meta"); }
  }
  function markDone(k) { touchDay(); if (!S.meta.done[k]) { S.meta.done[k] = 1; dirty("meta"); } }
  function qMark(id, ok) {
    var r = qRec(id).slice();
    if (ok) { r[0] = Math.min(5, r[0] + 1); r[2]++; } else { r[0] = 0; r[3]++; }
    r[1] = today() + INTERVAL[r[0]]; S.q[id] = r; touchDay(); dirty("questions");
  }
  function cMark(id, ok) {
    var r = (S.c[id] || [0, 0]).slice();
    r[0] = ok ? Math.min(5, r[0] + 1) : 0; r[1] = today() + INTERVAL[Math.max(r[0], ok ? 1 : 0)];
    S.c[id] = r; touchDay(); dirty("cards");
  }
  function topicStats(t) {
    var s = { n: t.qs.length, seen: 0, right: 0, wrong: 0, pts: 0, due: 0, missed: 0 }, d = today();
    t.qs.forEach(function (q) {
      var r = S.q[q.id]; if (!r || r[2] + r[3] === 0) return;
      s.seen++; s.right += r[2]; s.wrong += r[3]; s.pts += Math.min(r[0], 3);
      if (r[1] <= d) s.due++; if (r[0] === 0) s.missed++;
    });
    s.mastery = pct(s.pts, s.n * 3);
    return s;
  }
  function readiness() {
    var sum = { 1: [0, 0], 2: [0, 0], 3: [0, 0] };
    TOPICS.forEach(function (t) { sum[t.dom][0] += topicStats(t).mastery; sum[t.dom][1]++; });
    var r = 0; [1, 2, 3].forEach(function (d) { r += DOM_WEIGHT[d] * sum[d][0] / sum[d][1]; });
    return Math.round(r);
  }
  function allQs() { return [].concat.apply([], TOPICS.map(function (t) { return t.qs; })); }
  function dueQs(pool) { var d = today(); return pool.filter(function (q) { return seen(q.id) && qRec(q.id)[1] <= d; }); }
  function newQs(pool) { return pool.filter(function (q) { return !seen(q.id); }); }
  function weakestFirst() {
    return TOPICS.slice().sort(function (a, b) { return topicStats(a).mastery / DOM_WEIGHT[a.dom] - topicStats(b).mastery / DOM_WEIGHT[b.dom]; });
  }
  function pickSmart(n) {
    var out = shuffle(dueQs(allQs())).sort(function (a, b) { return qRec(a.id)[0] - qRec(b.id)[0]; }).slice(0, Math.ceil(n * 0.6));
    var order = weakestFirst(), i = 0, guard = 0;
    var fresh = order.map(function (t) { return shuffle(newQs(t.qs)); });
    while (out.length < n && guard++ < 400) { var q = fresh[i % fresh.length].pop(); if (q) out.push(q); i += 1; }
    if (out.length < n) out = out.concat(shuffle(allQs().filter(function (q) { return out.indexOf(q) < 0; })).slice(0, n - out.length));
    return shuffle(out);
  }
  function pickTopic(t, n) {
    var due = shuffle(dueQs(t.qs)), fresh = shuffle(newQs(t.qs));
    var out = due.concat(fresh).slice(0, n);
    if (out.length < n) out = out.concat(shuffle(t.qs.filter(function (q) { return out.indexOf(q) < 0; })).slice(0, n - out.length));
    return shuffle(out);
  }
  function pickExam(n) {
    var by = { 1: [], 2: [], 3: [] }, out = [];
    TOPICS.forEach(function (t) { by[t.dom] = by[t.dom].concat(t.qs); });
    [2, 3].forEach(function (d) { out = out.concat(shuffle(by[d]).slice(0, Math.round(n * DOM_WEIGHT[d]))); });
    return shuffle(out.concat(shuffle(by[1]).slice(0, n - out.length)));
  }
  function cardsFor(topicId, sec) {
    var out = [];
    TOPICS.forEach(function (t) {
      var b = BOOK[t.id]; if (!b || (topicId && t.id !== topicId)) return;
      b.cards.forEach(function (c, i) { if (sec == null || c.s === sec) out.push({ id: t.id + "-" + i, t: t.id, f: c.f, b: c.b }); });
    });
    return out;
  }
  function pickCards(pool, n) {
    var d = today();
    var due = pool.filter(function (c) { return S.c[c.id] && S.c[c.id][1] <= d; });
    var fresh = pool.filter(function (c) { return !S.c[c.id]; });
    return shuffle(due).concat(shuffle(fresh)).slice(0, n);
  }

  // ---------- navigation ----------
  var TABS = [["today", "Today"], ["study", "Study"], ["practice", "Practice"], ["exam", "Exam"], ["progress", "Progress"]];
  var tab = "today", sub = null, session = null, timer = 0, confirmKey = "";
  function go(t, s) { tab = t; sub = s || null; session = null; clearInterval(timer); confirmKey = ""; if (location.hash !== "#" + t) location.hash = t; render(); window.scrollTo(0, 0); }
  window.addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if (h !== tab && TABS.some(function (x) { return x[0] === h; })) go(h);
  });
  function render() {
    document.getElementById("tabs").innerHTML = TABS.map(function (t) {
      return '<button data-act="tab" data-arg="' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : "") + ">" + t[1] + "</button>";
    }).join("");
    view.innerHTML = session ? SESSION[session.kind]() : PAGES[tab]();
  }

  // ---------- pages ----------
  var PAGES = {};
  PAGES.today = function () {
    var r = readiness(), all = allQs(), due = dueQs(all).length, total = all.length;
    var seenN = all.filter(function (q) { return seen(q.id); }).length;
    var weak = weakestFirst()[0], done = (S.meta.streak || [0])[0] === today() ? S.meta.done : {};
    var days = "";
    if (S.meta.exam) { var left = Math.ceil((new Date(S.meta.exam + "T00:00:00") - new Date()) / 864e5); days = left >= 0 ? left + (left === 1 ? " day" : " days") + " to your exam" : "Exam date has passed"; }
    var streak = (S.meta.streak || [0, 0]); var sN = streak[0] >= today() - 1 ? streak[1] : 0;
    function step(k, title, text, act, arg, label) {
      return '<div class="step' + (done[k] ? " done" : "") + '"><div><b>' + title + '</b><div class="muted small">' + text + '</div></div><button class="' + (done[k] ? "" : "primary") + '" data-act="' + act + '" data-arg="' + (arg || "") + '">' + label + "</button></div>";
    }
    return '<div class="stack">' +
      '<header class="stack" style="gap:4px"><span class="eyebrow">National Home Inspector Examination</span><h1>NHIE Trainer</h1></header>' +
      '<section class="card stack"><div class="row"><div class="grow"><div class="eyebrow">Exam readiness</div><div class="big">' + r + '%</div></div>' +
      '<div class="small muted" style="text-align:right"><div class="num">' + seenN + " of " + total + ' questions tried</div><div class="num">' + (sN ? sN + "-day study streak" : "No streak yet") + "</div>" + (days ? "<div>" + days + "</div>" : "") + "</div></div>" +
      tape(r, r >= 80 ? "good" : "") +
      '<p class="small muted">Readiness counts a question only after you answer it correctly on separate days. Aim for 80% before you book the exam.</p>' +
      '<div class="row"><label class="small muted" for="examdate">Exam date</label><input type="date" id="examdate" data-change="examdate" value="' + esc(S.meta.exam || "") + '"></div></section>' +
      '<section class="card"><h2 style="margin-bottom:12px">Today\'s plan</h2><div class="plan">' +
      step("review", "Review what is due", due ? due + " questions are due again today." : "Nothing is due yet. Start with new questions.", "smart", "20", "Start 20") +
      step("lesson", "Study your weakest subject", weak.title + " is your lowest score right now.", "topic", weak.id, "Open") +
      step("topicq", "Practice that subject", "15 questions on " + weak.title + ".", "practiceTopic", weak.id, "Start 15") +
      "</div></section>" +
      '<section class="card stack"><details><summary>How to read an NHIE question</summary><div class="lesson"><ul>' +
      "<li><b>Find the key word first.</b> FIRST, BEST, MOST likely, EXCEPT and NOT change the answer. Read the last line of the question before the choices.</li>" +
      "<li><b>Answer as a home inspector.</b> The inspector observes, describes, explains the risk and recommends a qualified person. Answers where the inspector repairs, designs a fix, gives a cost, quotes code or predicts the future are almost always wrong.</li>" +
      "<li><b>Safety wins.</b> When two answers look right, pick the one that deals with fire, shock, falling, gas or carbon monoxide.</li>" +
      "<li><b>Report what you could not inspect, and why.</b> This is the right answer to most questions about snow, locked rooms, stored items and unsafe areas.</li>" +
      "<li><b>Do not change an answer</b> unless you find a clear reason in the question. Mark it and move on; every question is worth the same.</li>" +
      "<li><b>Pace:</b> 200 questions in 4 hours is 72 seconds each. The exam simulator here uses the same pace.</li></ul></div></details></section>" +
      '<p class="small muted" id="sync">' + syncLabel() + "</p></div>";
  };

  PAGES.study = function () {
    if (sub && sub.sec != null) return lessonPage();
    if (sub) return topicPage();
    var html = '<div class="stack"><h1>Study</h1>';
    [1, 2].forEach(function (v) {
      html += '<section class="card"><div class="eyebrow">' + VOLS[v] + '</div><div class="list">';
      TOPICS.filter(function (t) { return t.vol === v; }).forEach(function (t) {
        var st = topicStats(t), b = BOOK[t.id], nread = b ? b.sections.filter(function (_, i) { return S.meta.read[t.id + "-" + i]; }).length : 0;
        html += '<button class="item" data-act="topic" data-arg="' + t.id + '"><b>' + t.title + '</b><span class="pill num">' + st.mastery + '%</span>' +
          '<span class="small muted num" style="grid-column:1/-1">' + (b ? nread + " of " + b.sections.length + " lessons read · " : "") + st.seen + " of " + st.n + " questions tried</span>" + tape(st.mastery, st.mastery >= 80 ? "good" : "") + "</button>";
      });
      html += "</div></section>";
    });
    return html + '<p class="small muted">Chapters are grouped by volume as best I can tell from your notes. The grouping and page numbers will be corrected when the two NHIE volumes are loaded.</p></div>';
  };
  function topicPage() {
    var t = TOPIC[sub.t], b = BOOK[t.id], st = topicStats(t), cards = cardsFor(t.id);
    var html = '<div class="stack"><button class="quiet" style="align-self:flex-start" data-act="tab" data-arg="study">‹ All subjects</button>' +
      '<header class="stack" style="gap:6px"><span class="eyebrow">' + VOLS[t.vol] + "</span><h1>" + t.title + "</h1></header>" +
      '<section class="card stack"><div class="row"><div class="grow"><div class="eyebrow">Mastery</div><div class="big">' + st.mastery + '%</div></div><div class="small muted num" style="text-align:right">' +
      st.seen + " of " + st.n + " questions tried<br>" + (st.right + st.wrong ? pct(st.right, st.right + st.wrong) + "% answered correctly" : "No answers yet") + "</div></div>" + tape(st.mastery, st.mastery >= 80 ? "good" : "") +
      '<div class="row"><button class="primary" data-act="practiceTopic" data-arg="' + t.id + '">Practice 15 questions</button>' +
      (cards.length ? '<button data-act="cards" data-arg="' + t.id + '">Flashcards (' + cards.length + ")</button>" : "") + "</div></section>";
    if (b) {
      html += '<section class="card"><h2 style="margin-bottom:6px">Lessons</h2><div class="list">';
      b.sections.forEach(function (s, i) {
        html += '<button class="item" data-act="lesson" data-arg="' + i + '"><span><span class="muted num">' + (i + 1) + ".</span> " + esc(s.title) + "</span>" +
          (S.meta.read[t.id + "-" + i] ? '<span class="pill good">Read</span>' : '<span class="muted">›</span>') + "</button>";
      });
      html += "</div></section>";
    } else html += '<section class="card"><p class="muted">Lesson text is not included in this copy. Practice questions for this subject work as usual.</p></section>';
    return html + "</div>";
  }
  function lessonPage() {
    var t = TOPIC[sub.t], b = BOOK[t.id], s = b.sections[sub.sec], html = "", open = -1;
    function close(to) { while (open > to) { html += "</ul>"; open--; } }
    s.blocks.forEach(function (k) {
      if (k.t === "li") { var l = k.l || 0; close(l); while (open < l) { html += "<ul>"; open++; } html += "<li>" + k.x + "</li>"; }
      else { close(-1); html += k.t === "h" ? "<h4>" + k.x + "</h4>" : "<p>" + k.x + "</p>"; }
    });
    close(-1);
    var cards = cardsFor(t.id, sub.sec), last = sub.sec >= b.sections.length - 1;
    return '<div class="stack"><button class="quiet" style="align-self:flex-start" data-act="topic" data-arg="' + t.id + '">‹ ' + t.title + "</button>" +
      '<header class="stack" style="gap:6px"><span class="eyebrow num">Lesson ' + (sub.sec + 1) + " of " + b.sections.length + (b.source === "review" ? " · from your review notes" : "") + "</span><h1>" + esc(s.title) + "</h1></header>" +
      '<article class="card lesson">' + html + "</article>" +
      '<div class="row">' + (cards.length ? '<button data-act="cardsSec" data-arg="' + sub.sec + '">Drill ' + cards.length + " key terms</button>" : "") +
      '<button class="primary" data-act="readNext" data-arg="' + sub.sec + '">' + (last ? "Mark read and practice" : "Mark read, next lesson") + "</button></div></div>";
  }

  PAGES.practice = function () {
    var all = allQs(), due = dueQs(all).length, missed = all.filter(function (q) { return seen(q.id) && qRec(q.id)[0] === 0; }).length;
    var cards = cardsFor(), cdue = cards.filter(function (c) { return S.c[c.id] && S.c[c.id][1] <= today(); }).length;
    var html = '<div class="stack"><h1>Practice</h1><section class="card"><div class="list">' +
      '<button class="item" data-act="smart" data-arg="20"><span><b>Smart session</b><br><span class="small muted">20 questions: what is due, then new ones from your weakest subjects.</span></span><span class="pill num">' + due + " due</span></button>" +
      '<button class="item" data-act="missed"' + (missed ? "" : " disabled") + '><span><b>My mistakes</b><br><span class="small muted">Only questions you last answered wrong.</span></span><span class="pill ' + (missed ? "bad" : "good") + ' num">' + missed + "</span></button>" +
      (cards.length ? '<button class="item" data-act="cards" data-arg=""><span><b>Flashcards</b><br><span class="small muted">Terms and numbers from the lessons, 20 at a time.</span></span><span class="pill num">' + cdue + " due</span></button>" : "") +
      '</div></section><section class="card"><h2 style="margin-bottom:6px">One subject</h2><div class="list">';
    TOPICS.forEach(function (t) {
      var st = topicStats(t);
      html += '<button class="item" data-act="practiceTopic" data-arg="' + t.id + '"><span>' + t.title + '</span><span class="small muted num">' + st.seen + "/" + st.n + " · " + st.mastery + "%</span></button>";
    });
    return html + "</div></section></div>";
  };

  PAGES.exam = function () {
    var rows = S.meta.exams.slice(-8).reverse().map(function (e) {
      return "<tr><td>" + esc(e.d) + '</td><td class="r">' + e.n + '</td><td class="r"><span class="pill ' + (e.p >= 80 ? "good" : e.p >= 70 ? "warn" : "bad") + '">' + e.p + '%</span></td><td class="r">' + clock(e.s) + "</td></tr>";
    }).join("");
    return '<div class="stack"><h1>Exam simulator</h1><section class="card stack"><p>Timed like the real exam: 72 seconds per question, no feedback until you finish. Questions are mixed in the exam\'s proportions: 63% building systems, 25% analysis and reporting, 12% professional responsibilities.</p>' +
      '<div class="row">' + [25, 50, 100].map(function (n) { return '<button class="' + (n === 50 ? "primary" : "") + '" data-act="exam" data-arg="' + n + '">' + n + " questions · " + clock(n * SECONDS_PER_QUESTION) + "</button>"; }).join("") + "</div>" +
      '<p class="small muted">The real NHIE has 200 questions (175 scored) in 4 hours and is graded on a 200 to 800 scale with 500 to pass. Nobody outside the exam board can convert a practice percentage into that scale, so treat 80% here as your target.</p></section>' +
      (rows ? '<section class="card"><h2 style="margin-bottom:6px">Past attempts</h2><div class="scroll"><table><tr><th>Date</th><th class="r">Questions</th><th class="r">Score</th><th class="r">Time used</th></tr>' + rows + "</table></div></section>" : "") + "</div>";
  };

  PAGES.progress = function () {
    var rows = TOPICS.map(function (t) {
      var s = topicStats(t), acc = s.right + s.wrong ? pct(s.right, s.right + s.wrong) + "%" : "–";
      return "<tr><td>" + t.title + '</td><td class="r">' + s.seen + "/" + s.n + '</td><td class="r">' + acc + '</td><td class="r"><span class="pill ' + (s.mastery >= 80 ? "good" : s.mastery >= 40 ? "warn" : s.seen ? "bad" : "") + '">' + s.mastery + "%</span></td></tr>";
    }).join("");
    var cards = cardsFor(), known = cards.filter(function (c) { return S.c[c.id] && S.c[c.id][0] >= 2; }).length;
    return '<div class="stack"><h1>Progress</h1><section class="card stack"><div class="row"><div class="grow"><div class="eyebrow">Exam readiness</div><div class="big">' + readiness() + "%</div></div>" +
      (cards.length ? '<div class="small muted num" style="text-align:right">' + known + " of " + cards.length + " flashcards known</div>" : "") + "</div>" + tape(readiness()) + "</section>" +
      '<section class="card"><div class="scroll"><table><tr><th>Subject</th><th class="r">Tried</th><th class="r">Correct</th><th class="r">Mastery</th></tr>' + rows + "</table></div></section>" +
      '<section class="card stack"><p class="small muted" id="sync">' + syncLabel() + "</p>" +
      (confirmKey === "reset" ? '<div class="row"><b>Erase all progress?</b><button class="danger" data-act="resetYes">Yes, erase</button><button data-act="resetNo">Keep it</button></div>'
        : '<button class="danger" style="align-self:flex-start" data-act="reset">Erase all progress</button>') + "</section></div>";
  };

  // ---------- sessions ----------
  var SESSION = {};
  function startQuiz(qs, title, doneKey) {
    if (!qs.length) return;
    session = { kind: "quiz", title: title, queue: qs.slice(), n: qs.length, i: 0, right: 0, wrong: [], cur: null, picked: -1, doneKey: doneKey, retried: {} };
    nextQ();
  }
  function nextQ() {
    var s = session, q = s.queue.shift();
    if (!q) { s.cur = null; if (s.doneKey) markDone(s.doneKey); } else { s.cur = q; s.opts = shuffle(q.a.map(function (_, i) { return i; })); s.picked = -1; s.i++; }
    render(); window.scrollTo(0, 0);
  }
  function optButtons(q, order, picked, reveal, sel) {
    return '<div class="opts">' + order.map(function (ai, k) {
      var cls = reveal ? (ai === 0 ? " right" : k === picked ? " wrong" : "") : (k === sel ? " sel" : "");
      return '<button class="opt' + cls + '" data-act="pick" data-arg="' + k + '"' + (reveal ? " disabled" : "") + "><span>" + "ABCD"[k] + "</span><span>" + esc(q.a[ai]) + "</span></button>";
    }).join("") + "</div>";
  }
  SESSION.quiz = function () {
    var s = session, q = s.cur;
    if (!q) {
      var p = pct(s.right, s.n), by = {};
      s.wrong.forEach(function (w) { by[w.t] = (by[w.t] || 0) + 1; });
      return '<div class="stack"><h1>Session finished</h1><section class="card stack"><div class="big">' + s.right + " / " + s.n + "</div>" + tape(p, p >= 80 ? "good" : "") +
        '<p class="muted">' + (s.wrong.length ? "The questions you missed come back tomorrow. Read the lesson for: " + Object.keys(by).map(function (k) { return TOPIC[k].title; }).join(", ") + "." : "All correct on the first try. These questions will come back after a longer gap.") + "</p>" +
        '<div class="row"><button class="primary" data-act="smart" data-arg="20">Another 20</button><button data-act="tab" data-arg="today">Done</button></div></section></div>';
    }
    var done = s.picked >= 0, ok = done && s.opts[s.picked] === 0;
    return '<div class="stack"><div class="row"><span class="eyebrow grow">' + esc(s.title) + " · " + TOPIC[q.t].title + '</span><button class="quiet" data-act="tab" data-arg="practice">End</button></div>' +
      tape(pct(s.i - 1 + (done ? 1 : 0), s.i + s.queue.length)) +
      '<section class="card stack"><p class="qtext">' + esc(q.q) + "</p>" + optButtons(q, s.opts, s.picked, done, -1) + "</section>" +
      (done ? '<div class="why ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "Correct." : "Not quite. The answer is: " + esc(q.a[0]) + ".") + "</b><p>" + esc(q.e) + '</p></div><button class="primary" data-act="next">' + (s.queue.length ? "Next question" : "See results") + "</button>" : "") + "</div>";
  };

  function startCards(pool, title) {
    var cs = pickCards(pool, 20); if (!cs.length) cs = shuffle(pool).slice(0, 20);
    if (!cs.length) return;
    session = { kind: "cards", title: title, queue: cs, n: cs.length, i: 0, known: 0, shown: false };
    render(); window.scrollTo(0, 0);
  }
  SESSION.cards = function () {
    var s = session, c = s.queue[s.i];
    if (!c) return '<div class="stack"><h1>Flashcards finished</h1><section class="card stack"><div class="big">' + s.known + " / " + s.n + '</div><p class="muted">Cards you did not know come back tomorrow.</p><div class="row"><button class="primary" data-act="tab" data-arg="practice">Done</button></div></section></div>';
    return '<div class="stack"><div class="row"><span class="eyebrow grow">' + esc(s.title) + " · " + TOPIC[c.t].title + ' · <span class="num">' + (s.i + 1) + "/" + s.n + '</span></span><button class="quiet" data-act="tab" data-arg="practice">End</button></div>' +
      '<section class="card flash"><div class="term">' + esc(c.f) + "</div>" + (s.shown ? '<div class="lesson" style="margin:0 auto;text-align:left">' + c.b + "</div>" : '<p class="muted">Say the meaning out loud, then check.</p>') + "</section>" +
      (s.shown ? '<div class="row"><button class="grow" data-act="card" data-arg="0">Did not know</button><button class="primary grow" data-act="card" data-arg="1">Knew it</button></div>' : '<button class="primary" data-act="flip">Show answer</button>') + "</div>";
  };

  function startExam(n) {
    var qs = pickExam(n);
    session = { kind: "exam", qs: qs, opts: qs.map(function (q) { return shuffle(q.a.map(function (_, i) { return i; })); }), ans: qs.map(function () { return -1; }), flag: {}, i: 0, t0: Date.now(), limit: qs.length * SECONDS_PER_QUESTION, done: false };
    clearInterval(timer);
    timer = setInterval(function () {
      if (!session || session.kind !== "exam" || session.done) return clearInterval(timer);
      var left = session.limit - Math.floor((Date.now() - session.t0) / 1000), el = document.getElementById("clock");
      if (left <= 0) return finishExam(); if (el) el.textContent = clock(left);
    }, 1000);
    render(); window.scrollTo(0, 0);
  }
  function finishExam() {
    var s = session; clearInterval(timer); s.done = true; s.secs = Math.min(s.limit, Math.floor((Date.now() - s.t0) / 1000)); s.right = 0; s.by = {};
    s.qs.forEach(function (q, i) {
      var ok = s.ans[i] >= 0 && s.opts[i][s.ans[i]] === 0; if (ok) s.right++;
      s.by[q.t] = s.by[q.t] || [0, 0]; s.by[q.t][1]++; if (ok) s.by[q.t][0]++;
      qMark(q.id, ok);
    });
    S.meta.exams.push({ d: new Date().toLocaleDateString(), n: s.qs.length, p: pct(s.right, s.qs.length), s: s.secs });
    S.meta.exams = S.meta.exams.slice(-30); dirty("meta"); confirmKey = "";
    render(); window.scrollTo(0, 0);
  }
  SESSION.exam = function () {
    var s = session;
    if (s.done) {
      var p = pct(s.right, s.qs.length);
      var rows = TOPICS.filter(function (t) { return s.by[t.id]; }).map(function (t) { var b = s.by[t.id], x = pct(b[0], b[1]); return "<tr><td>" + t.title + '</td><td class="r">' + b[0] + "/" + b[1] + '</td><td class="r"><span class="pill ' + (x >= 80 ? "good" : x >= 60 ? "warn" : "bad") + '">' + x + "%</span></td></tr>"; }).join("");
      var misses = s.qs.map(function (q, i) {
        if (s.ans[i] >= 0 && s.opts[i][s.ans[i]] === 0) return "";
        return '<div class="stack" style="gap:6px;padding:12px 0;border-top:1px solid var(--line)"><span class="eyebrow">' + TOPIC[q.t].title + "</span><b>" + esc(q.q) + '</b><span class="small"><span class="pill bad">Your answer</span> ' + (s.ans[i] < 0 ? "Not answered" : esc(q.a[s.opts[i][s.ans[i]]])) + '</span><span class="small"><span class="pill good">Correct</span> ' + esc(q.a[0]) + '</span><span class="small muted">' + esc(q.e) + "</span></div>";
      }).join("");
      return '<div class="stack"><h1>Exam result</h1><section class="card stack"><div class="row"><div class="grow"><div class="big">' + p + '%</div></div><div class="small muted num" style="text-align:right">' + s.right + " of " + s.qs.length + " correct<br>" + clock(s.secs) + " used of " + clock(s.limit) + "</div></div>" + tape(p, p >= 80 ? "good" : "") +
        '<p class="muted">' + (p >= 80 ? "At or above the 80% target. Keep the due reviews going so it stays there." : "Below the 80% target. The subjects marked red below are where the points are.") + "</p></section>" +
        '<section class="card"><div class="scroll"><table><tr><th>Subject</th><th class="r">Correct</th><th class="r">Score</th></tr>' + rows + "</table></div></section>" +
        (misses ? '<section class="card"><h2>Questions to review</h2>' + misses + "</section>" : "") +
        '<div class="row"><button class="primary" data-act="tab" data-arg="today">Done</button></div></div>';
    }
    var q = s.qs[s.i], answered = s.ans.filter(function (a) { return a >= 0; }).length;
    var grid = s.qs.map(function (_, i) { return '<button class="' + (s.ans[i] >= 0 ? "ans " : "") + (s.flag[i] ? "flag " : "") + (i === s.i ? "cur" : "") + '" data-act="jump" data-arg="' + i + '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + "</button>"; }).join("");
    return '<div class="stack"><div class="row"><span class="eyebrow grow num">Question ' + (s.i + 1) + " of " + s.qs.length + '</span><b class="num" id="clock">' + clock(s.limit - Math.floor((Date.now() - s.t0) / 1000)) + "</b></div>" +
      tape(pct(answered, s.qs.length)) +
      '<section class="card stack"><p class="qtext">' + esc(q.q) + "</p>" + optButtons(q, s.opts[s.i], -1, false, s.ans[s.i]) + "</section>" +
      '<div class="row"><button data-act="jump" data-arg="' + (s.i - 1) + '"' + (s.i ? "" : " disabled") + '>Back</button><button data-act="flagq">' + (s.flag[s.i] ? "Remove mark" : "Mark for review") + '</button><button class="primary grow" data-act="jump" data-arg="' + (s.i + 1) + '"' + (s.i < s.qs.length - 1 ? "" : " disabled") + ">Next</button></div>" +
      '<details class="card"' + (s.gridOpen ? " open" : "") + ' data-toggle="grid"><summary class="num">All questions · ' + answered + " answered</summary><div class=\"grid\" style=\"margin-top:12px\">" + grid + "</div></details>" +
      (confirmKey === "finish" ? '<div class="card row"><b class="grow">Finish and grade? ' + (s.qs.length - answered ? (s.qs.length - answered) + " not answered." : "") + '</b><button class="primary" data-act="finishYes">Grade it</button><button data-act="finishNo">Keep going</button></div>'
        : '<div class="row"><button data-act="finish">Finish exam</button><button class="quiet danger" data-act="tab" data-arg="exam">Quit without grading</button></div>') + "</div>";
  };

  // ---------- actions ----------
  var ACT = {
    tab: function (a) { go(a); },
    topic: function (a) { tab = "study"; go("study", { t: a }); markDone("lesson"); },
    lesson: function (a) { go("study", { t: sub.t, sec: +a }); },
    readNext: function (a) {
      var t = sub.t, b = BOOK[t]; S.meta.read[t + "-" + a] = 1; dirty("meta"); markDone("lesson");
      if (+a < b.sections.length - 1) go("study", { t: t, sec: +a + 1 }); else { go("study", { t: t }); }
    },
    smart: function (a) { startQuiz(pickSmart(+a || 20), "Smart session", "review"); },
    missed: function () { startQuiz(shuffle(allQs().filter(function (q) { return seen(q.id) && qRec(q.id)[0] === 0; })).slice(0, 25), "My mistakes"); },
    practiceTopic: function (a) { startQuiz(pickTopic(TOPIC[a], 15), "Subject practice", "topicq"); },
    cards: function (a) { startCards(cardsFor(a || null), "Flashcards"); },
    cardsSec: function (a) { startCards(cardsFor(sub.t, +a), "Key terms"); },
    pick: function (a) {
      var s = session;
      if (s.kind === "exam") { s.ans[s.i] = s.ans[s.i] === +a ? -1 : +a; return render(); }
      if (s.picked >= 0) return;
      s.picked = +a; var ok = s.opts[s.picked] === 0, q = s.cur;
      if (!s.retried[q.id]) { qMark(q.id, ok); if (ok) s.right++; else { s.wrong.push(q); s.retried[q.id] = 1; s.queue.splice(Math.min(4, s.queue.length), 0, q); } }
      render();
    },
    next: function () { nextQ(); },
    flip: function () { session.shown = true; render(); },
    card: function (a) { var s = session; cMark(s.queue[s.i].id, a === "1"); if (a === "1") s.known++; s.i++; s.shown = false; render(); window.scrollTo(0, 0); },
    exam: function (a) { startExam(+a); },
    jump: function (a) { var s = session, i = +a; if (i >= 0 && i < s.qs.length) { s.i = i; render(); window.scrollTo(0, 0); } },
    flagq: function () { var s = session; s.flag[s.i] = !s.flag[s.i]; render(); },
    finish: function () { confirmKey = "finish"; render(); },
    finishNo: function () { confirmKey = ""; render(); },
    finishYes: function () { finishExam(); },
    reset: function () { confirmKey = "reset"; render(); },
    resetNo: function () { confirmKey = ""; render(); },
    resetYes: function () { S.meta = { exam: S.meta.exam, streak: [0, 0], read: {}, exams: [], done: {} }; S.q = {}; S.c = {}; confirmKey = ""; dirty("meta"); dirty("questions"); dirty("cards"); render(); }
  };
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return;
    var f = ACT[el.getAttribute("data-act")]; if (f) f(el.getAttribute("data-arg") || "");
  });
  document.addEventListener("change", function (e) {
    if (e.target.getAttribute("data-change") === "examdate") { S.meta.exam = e.target.value; dirty("meta"); render(); }
  });
  document.addEventListener("toggle", function (e) {
    if (e.target.getAttribute && e.target.getAttribute("data-toggle") === "grid" && session) session.gridOpen = e.target.open;
  }, true);

  var h = location.hash.slice(1);
  if (TABS.some(function (x) { return x[0] === h; })) tab = h;
  render();
  cloudInit();
})();
