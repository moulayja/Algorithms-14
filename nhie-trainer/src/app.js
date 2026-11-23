(function () {
  "use strict";
  var N = window.NHIE;

  // Subjects, the manual volume they are filed under, and their NHIE exam domain
  // (1 = Property and Building Inspection, 2 = Analysis and Reporting, 3 = Professional Responsibilities).
  var TOPICS = [
    { id: "electrical", color: "#B45309", title: "Electrical System", vol: 1, dom: 1 },
    { id: "cooling", color: "#0369A1", title: "Cooling System", vol: 1, dom: 1 },
    { id: "heating", color: "#B91C1C", title: "Heating System", vol: 1, dom: 1 },
    { id: "plumbing", color: "#1D4ED8", title: "Plumbing System", vol: 1, dom: 1 },
    { id: "fireplaces", color: "#9A3412", title: "Fireplaces & Chimneys", vol: 1, dom: 1 },
    { id: "kitchen", color: "#7C3AED", title: "Kitchen Appliances", vol: 1, dom: 1 },
    { id: "site", color: "#4D7C0F", title: "Site Conditions", vol: 2, dom: 1 },
    { id: "exterior", color: "#0F766E", title: "Exterior Components", vol: 2, dom: 1 },
    { id: "roof", color: "#78350F", title: "Roof Components", vol: 2, dom: 1 },
    { id: "structure", color: "#475569", title: "Structural Components", vol: 2, dom: 1 },
    { id: "insulation", color: "#A21CAF", title: "Insulation & Ventilation", vol: 2, dom: 1 },
    { id: "interior", color: "#BE185D", title: "The House Interior", vol: 2, dom: 1 },
    { id: "reporting", color: "#0F3A31", title: "Analysis & Reporting", vol: 2, dom: 2 },
    { id: "professional", color: "#8A5F1C", title: "Professional Responsibilities", vol: 2, dom: 3 }
  ];
  var VOLCOLOR = { 1: "#8A5F1C", 2: "#0F3A31" }, volSel = 0;
  var VOLS = { 1: "Volume 1 · Mechanical Systems", 2: "Volume 2 · Structural Systems and Business" };
  var DOM_WEIGHT = { 1: 0.63, 2: 0.25, 3: 0.12 };
  var INTERVAL = [0, 1, 3, 7, 16, 35]; // days until the next review, by box
  var SECONDS_PER_QUESTION = 72;       // the real exam allows 4 hours for 200 questions
  var TOPIC = {}, QBYID = {};
  TOPICS.forEach(function (t) {
    TOPIC[t.id] = t;
    t.qs = N.bank[t.id] || [];
    t.qs.forEach(function (q) { QBYID[q.id] = q; });
  });
  TOPICS.forEach(function (t) { t.ls = N.lessonBank[t.id] || []; });
  var ALL_LESSONS = [].concat.apply([], TOPICS.map(function (t) { return t.ls; }));
  // ---------- focus on weak topics, from the student's NHIE score reports ----------
  var TASKS = [["Site conditions","site"],["Exterior","exterior"],["Roof","roof"],["Structure","structure"],["Electrical","electrical"],["Cooling","cooling"],["Heating","heating"],
    ["Insulation, moisture, ventilation","insulation"],["Mechanical exhaust","insulation"],["Plumbing and fuel","plumbing"],["Interior","interior"],["Fireplaces and vents","fireplaces"],["Life safety","electrical"],
    ["Inform the client","reporting"],["Describe limitations","reporting"],["Describe systems","reporting"],["Needs evaluation or action","reporting"],["Pre-inspection agreement","professional"],["Integrity and process","professional"]];
  var SCORES = window.NHIE_SCORES || [];
  var FOCUS = (function () {
    if (!SCORES.length) return null;
    var w = SCORES.map(function (_, i) { return i + 1; }), wsum = w.reduce(function (a, b) { return a + b; }, 0), last = SCORES[SCORES.length - 1].s;
    var task = TASKS.map(function (t, i) {
      var avg = SCORES.reduce(function (a, r, k) { return a + r.s[i] * w[k]; }, 0) / wsum;
      return { name: t[0], topic: t[1], avg: Math.round(avg), last: last[i], hist: SCORES.map(function (r) { return r.s[i]; }) };
    });
    var by = {};
    task.forEach(function (x) { (by[x.topic] = by[x.topic] || []).push(x); });
    by.kitchen = by.interior;
    var tier = {};
    TOPICS.forEach(function (t) {
      // Top priority: any of its exam areas under 60% on the last exam or on the weighted average; next: under 70%.
      var xs = by[t.id] || [], worst = Math.min.apply(null, xs.map(function (x) { return Math.min(x.avg, x.last); }));
      tier[t.id] = worst < 60 ? 1 : worst < 70 ? 2 : 3;
      if (t.id === "kitchen") tier[t.id] = Math.max(tier[t.id], 2);   // a small slice of the interior area
    });
    return { task: task, tier: tier };
  })();
  function focusOn() { return !!FOCUS && S.meta.focus !== false; }
  function tierOf(t) { return focusOn() ? FOCUS.tier[t.id || t] : 2; }
  function focusWeight(t) { return { 1: 4, 2: 2, 3: 0.5 }[tierOf(t)]; }
  function passed(L) { return !!S.meta.read[L.topic + "-" + L.i]; }
  function nextLesson() {
    var list = focusOn() ? ALL_LESSONS.slice().sort(function (a, b) { return tierOf(a.topic) - tierOf(b.topic) || ALL_LESSONS.indexOf(a) - ALL_LESSONS.indexOf(b); }) : ALL_LESSONS;
    for (var i = 0; i < list.length; i++) if (!passed(list[i])) return list[i];
    return null;
  }

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
    if (focusOn()) { var bag = []; order.forEach(function (t) { for (var k = 0; k < Math.max(1, Math.round(focusWeight(t) * 2)); k++) bag.push(t); }); order = shuffle(bag); }
    var pools = {}; order.forEach(function (t) { if (!pools[t.id]) pools[t.id] = shuffle(newQs(t.qs)); });
    var fresh = order.map(function (t) { return pools[t.id]; });
    while (out.length < n && guard++ < 600) { var q = fresh[i % fresh.length].pop(); if (q) out.push(q); i += 1; }
    if (out.length < n) out = out.concat(shuffle(allQs().filter(function (q) { return out.indexOf(q) < 0; })).slice(0, n - out.length));
    return shuffle(out);
  }
  function pickFocus(n) {
    // About 70% of the questions from top-priority chapters, the rest from the "next" chapters, spread evenly.
    var t1 = shuffle(TOPICS.filter(function (t) { return tierOf(t) === 1; })), t2 = shuffle(TOPICS.filter(function (t) { return tierOf(t) === 2; }));
    var n1 = t2.length ? Math.round(n * 0.7) : n, out = [];
    function spread(ts, k) { if (!ts.length) return; ts.forEach(function (t, i) { var c = Math.floor(k / ts.length) + (i < k % ts.length ? 1 : 0); if (c) out = out.concat(pickTopic(t, c)); }); }
    spread(t1, n1); spread(t2, n - n1);
    return shuffle(out);
  }
  // ---------- full subject check: every book question in a subject, until each is answered right ----------
  function bookQs(t) { return t.qs.filter(function (q) { return q.l != null; }); }
  function fullDone() { return S.meta.full || (S.meta.full = {}); }
  function fullStats(t) { var qs = bookQs(t), d = fullDone(); var done = qs.filter(function (q) { return d[q.id]; }).length; return { done: done, n: qs.length, pct: pct(done, qs.length) }; }
  function startFull(id, restart) {
    var t = TOPIC[id], d = fullDone();
    if (restart) { bookQs(t).forEach(function (q) { delete d[q.id]; }); dirty("meta"); }
    var left = shuffle(bookQs(t).filter(function (q) { return !d[q.id]; }));
    if (!left.length) return;
    startQuiz(left.slice(0, 25), "Full check · " + t.title);
    session.full = id;
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
  // Cards of one lesson, one chapter, or (with no arguments) every lesson already passed.
  function cardsFor(topicId, li) {
    var out = [];
    ALL_LESSONS.forEach(function (L) {
      if (topicId ? (L.topic === topicId && (li == null || L.i === li)) : passed(L)) out = out.concat(L.cards);
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
  var ICON = {
    today: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    study: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/>',
    practice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12l2 2 4-4"/>',
    exam: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    teacher: '<path d="M4 5h16v11H9l-5 4z"/>'
  };
  // The ring motif: a thick white arc showing p percent around a small four-part pie.
  // Chapter color helpers: each chapter has its own color so sections are easy to tell apart.
  function chip(t) { return '<span class="ctag" style="--c:' + t.color + '">' + t.title + "</span>"; }
  function ring(p, faint) {
    var c = 2 * Math.PI * 74, a = Math.max(0, Math.min(100, p)) / 100 * c;
    return '<svg class="ring' + (faint ? " faint" : "") + '" viewBox="0 0 200 200" aria-hidden="true">' +
      '<circle cx="100" cy="100" r="74" fill="none" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="40"/>' +
      '<circle cx="100" cy="100" r="74" fill="none" stroke="#FFFFFF" stroke-width="40" stroke-dasharray="' + a.toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 100 100)"/>' +
      (faint ? "" : '<path d="M100 100 L100 46 A54 54 0 0 1 154 100 Z" fill="#2E6B5A"/><path d="M100 100 L154 100 A54 54 0 0 1 100 154 Z" fill="#4A8473"/><path d="M100 100 L100 154 A54 54 0 0 1 46 100 Z" fill="#1E5A4B"/><path d="M100 100 L46 100 A54 54 0 0 1 100 46 Z" fill="#B7812B"/>') + "</svg>";
  }
  var TABS = [["today", "Today"], ["study", "Study"], ["practice", "Practice"], ["exam", "Exam"], ["progress", "Progress"], ["teacher", "Teacher"]];
  var tab = "today", sub = null, session = null, timer = 0, confirmKey = "";
  // The address bar mirrors where you are (#study/plumbing/3), so the phone or browser Back button steps back one page.
  // A running quiz or flashcard set adds "~", so Back closes it and returns to the page it was started from.
  function route(t, s) { return t + (s && s.t ? "/" + s.t + (s.sec != null ? "/" + s.sec : "") : ""); }
  function parseRoute(h) {
    var p = h.replace(/[~!]+$/, "").split("/"), t = p[0];
    if (!TABS.some(function (x) { return x[0] === t; })) return null;
    var s = null;
    if (t === "study" && TOPIC[p[1]]) { s = { t: p[1] }; if (p[2] != null && TOPIC[p[1]].ls[+p[2]]) s.sec = +p[2]; }
    return { t: t, s: s };
  }
  function go(t, s) { T.back = null; tab = t; sub = s || null; session = null; clearInterval(timer); confirmKey = ""; var r = route(t, sub); if (location.hash !== "#" + r) location.hash = r; render(); window.scrollTo(0, 0); }
  function sessionOpened() { var r = route(tab, sub) + "~"; if (location.hash !== "#" + r) location.hash = r; }
  function closeSession() { session = null; clearInterval(timer); confirmKey = ""; var r = route(tab, sub); if (location.hash !== "#" + r) location.replace("#" + r); render(); window.scrollTo(0, 0); }
  window.addEventListener("hashchange", function () {
    var h = location.hash.slice(1);
    if (h.slice(-1) === "!") return;          // the teacher panel just opened over this page
    if (T.sheet) { closeSheet(); return; }    // Back while the teacher is open: close it, stay on this page
    if (T.skipHash) { T.skipHash = false; return; }   // the teacher panel just closed; nothing else changes
    var closed = false;
    if (session && h.slice(-1) !== "~") {
      if (session.kind === "exam") { location.hash = route(tab, sub) + "~"; confirmKey = "finish"; render(); return; }
      session = null; clearInterval(timer); closed = true;
    }
    var r = parseRoute(h); if (!r) return;
    if (route(r.t, r.s) !== route(tab, sub)) { var keep = session; go(r.t, r.s); if (keep && h.slice(-1) === "~") { session = keep; render(); } }
    else if (closed) { render(); window.scrollTo(0, 0); }
  });
  // Top bar on inner pages: one big Back button plus a breadcrumb you can tap.
  function backbar(crumbs, extra) {
    var prev = crumbs[crumbs.length - 2];
    return '<div class="backbar"><button class="back" data-act="' + prev[1] + '" data-arg="' + (prev[2] || "") + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>' + esc(prev[0]) + "</button>" +
      '<nav class="crumbs" aria-label="You are here">' + crumbs.map(function (c, i) { return i === crumbs.length - 1 ? '<span aria-current="page">' + esc(c[0]) + "</span>" : '<button class="crumb" data-act="' + c[1] + '" data-arg="' + (c[2] || "") + '">' + esc(c[0]) + "</button><span aria-hidden=\"true\">›</span>"; }).join("") + "</nav>" + (extra || "") + "</div>";
  }
  function render() {
    document.getElementById("tabs").innerHTML = TABS.map(function (t) {
      return '<button data-act="tab" data-arg="' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : "") + '><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[t[0]] + "</svg>" + t[1] + "</button>";
    }).join("");
    view.innerHTML = session ? SESSION[session.kind]() : PAGES[tab]();
    teacherChrome();
  }

  // ---------- pages ----------
  var PAGES = {};
  function focusCard() {
    if (!FOCUS) return "";
    if (!focusOn()) return '<section class="card row"><span class="grow small muted">Focus mode is off: lessons follow the book order.</span><button data-act="focusToggle">Turn focus on</button></section>';
    var t1 = TOPICS.filter(function (t) { return tierOf(t) === 1; }), t2 = TOPICS.filter(function (t) { return tierOf(t) === 2; });
    return '<section class="card stack focuscard"><div class="row"><h2 class="grow">Your focus</h2><button class="quiet small" data-act="focusToggle">Turn off</button></div>' +
      '<p class="small muted">From your 5 score reports. Lessons and practice come from these chapters first; strong chapters still come back for light review.</p>' +
      '<div class="stack" style="gap:6px"><b class="small">Top priority</b><div class="chips">' + t1.map(function (t) { return '<button class="ctag big" style="--c:' + t.color + '" data-act="topic" data-arg="' + t.id + '">' + t.title + "</button>"; }).join("") + "</div>" +
      (t2.length ? '<b class="small" style="margin-top:6px">Next</b><div class="chips">' + t2.map(function (t) { return '<button class="ctag big" style="--c:' + t.color + '" data-act="topic" data-arg="' + t.id + '">' + t.title + "</button>"; }).join("") + "</div>" : "") + "</div>" +
      '<button class="primary" data-act="focusq">Focus practice: 20 questions</button></section>';
  }
  PAGES.today = function () {
    var r = readiness(), all = allQs(), due = dueQs(all).length, total = all.length;
    var seenN = all.filter(function (q) { return seen(q.id); }).length;
    var nl = nextLesson(), cdue = cardsFor().filter(function (c) { return S.c[c.id] && S.c[c.id][1] <= today(); }).length, done = (S.meta.streak || [0])[0] === today() ? S.meta.done : {};
    var days = "";
    if (S.meta.exam) { var left = Math.ceil((new Date(S.meta.exam + "T00:00:00") - new Date()) / 864e5); days = left >= 0 ? left + (left === 1 ? " day" : " days") + " to your exam" : "Exam date has passed"; }
    var streak = (S.meta.streak || [0, 0]); var sN = streak[0] >= today() - 1 ? streak[1] : 0;
    function step(k, title, text, act, arg, label) {
      return '<div class="step' + (done[k] ? " done" : "") + '"><div><b>' + title + '</b><div class="muted small">' + text + '</div></div><button class="' + (done[k] ? "" : "primary") + '" data-act="' + act + '" data-arg="' + (arg || "") + '">' + label + "</button></div>";
    }
    return '<div class="stack">' +
      '<header class="row" style="justify-content:space-between"><span class="row" style="gap:8px"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 1-9 9h4.5A4.5 4.5 0 1 0 12 7.5z" fill="var(--gold)"/></svg><b style="font:800 .95rem var(--display);letter-spacing:.1em">NHIE SCHOOL</b></span><span class="small muted">' + new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) + "</span></header>" +
      '<section class="hero stack" style="min-height:300px;justify-content:space-between">' + ring(r) +
      '<div class="eyebrow" style="position:relative">Exam readiness</div>' +
      '<div class="stack" style="gap:4px;position:relative"><span class="bignum num">' + r + '%</span><span class="cap num">' + seenN + " of " + total + " questions tried</span>" +
      '<p class="small" style="color:#E4EEE9;max-width:30ch;margin-top:6px">A question counts once you answer it right on separate days. Aim for 80% before you book.</p></div></section>' +
      '<div class="tiles"><div class="tile dark"><b class="num">' + (S.meta.exam ? Math.max(0, Math.ceil((new Date(S.meta.exam + "T00:00:00") - new Date()) / 864e5)) : "–") + '</b><span>Days to exam</span>' +
      '<input type="date" id="examdate" data-change="examdate" aria-label="Exam date" value="' + esc(S.meta.exam || "") + '" style="margin-top:8px;min-height:36px;padding:4px 8px;font-size:.8rem;background:transparent;color:#FFFFFF;border-color:rgba(255,255,255,.3);color-scheme:dark"></div>' +
      '<div class="tile"><b class="num">' + sN + "</b><span>Day streak</span></div></div>" +
      focusCard() +
      '<section class="card"><h2 style="margin-bottom:12px">Today\'s class</h2><div class="plan">' +
      step("review", "Warm-up: questions from earlier lessons", due ? due + " questions are due again today." : "Nothing is due yet.", "review", "", due ? "Start" : "None due") +
      step("cards", "Flashcards from earlier lessons", cdue ? cdue + " cards are due again today." : "Nothing is due yet.", "cardsDue", "", cdue ? "Start" : "None due") +
      (nl ? step("lesson", "Today's lesson: " + esc(nl.t), chip(TOPIC[nl.topic]) + " lesson " + (nl.i + 1) + " of " + TOPIC[nl.topic].ls.length + " · book pages " + nl.p, "lesson", nl.topic + "|" + nl.i, "Begin")
          : step("lesson", "No new lesson waiting", "You have passed every lesson built so far. Practice the chapters while the next ones are written.", "tab", "practice", "Practice")) +
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
    var html = '<div class="stack"><h1>Study</h1><div class="tiles"><div class="tile" style="background:linear-gradient(150deg,#0F3A31,#1E5A4B)"><b class="num" style="color:#FFFFFF">' + TOPICS.length + '</b><span style="color:#E4EEE9">Chapters</span></div><div class="tile dark"><b class="num">' + ALL_LESSONS.length + '</b><span>Lessons</span></div></div>' +
      '<p class="small muted">Both books are below. Jump to a volume:</p><div class="seg">' +
      [1, 2].map(function (v) { var n = TOPICS.filter(function (t) { return t.vol === v; }); return '<button style="--v:' + VOLCOLOR[v] + '" data-act="vol" data-arg="' + v + '"' + (volSel === v ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>Volume ' + v + ' · <span class="num">' + n.length + " chapters</span></button>"; }).join("") + "</div>";
    [1, 2].forEach(function (v) {
      html += '<section class="card volcard' + (volSel === v ? " on" : "") + '" style="--v:' + VOLCOLOR[v] + '" id="vol' + v + '"><div class="volband">' + VOLS[v] + " · " + TOPICS.filter(function (t) { return t.vol === v; }).length + ' chapters</div><div class="list">';
      TOPICS.filter(function (t) { return t.vol === v; }).forEach(function (t) {
        var st = topicStats(t), nread = t.ls.filter(passed).length;
        html += '<button class="item chap" style="--c:' + t.color + '" data-act="topic" data-arg="' + t.id + '"><span class="cnum num">' + (TOPICS.indexOf(t) + 1) + "</span><b>" + t.title + (focusOn() && tierOf(t) === 1 ? ' <span class="pill warn">Focus</span>' : "") + '</b><span class="pill num">' + st.mastery + '%</span>' +
          '<span class="small muted num" style="grid-column:2/-1">' + (t.ls.length ? nread + " of " + t.ls.length + " lessons passed · " : "Lessons not built yet · ") + st.seen + " of " + st.n + " questions tried</span>" + tape(st.mastery) + "</button>";
      });
      html += "</div></section>";
    });
    return html + '<p class="small muted">Lessons follow the two NHIE volumes page by page.</p></div>';
  };
  function topicPage() {
    var t = TOPIC[sub.t], st = topicStats(t), cards = cardsFor(t.id);
    var html = '<div class="stack" style="--c:' + t.color + '">' + backbar([["All chapters", "tab", "study"], [t.title]]) +
      '<header class="hero stack" style="gap:8px;--c:' + t.color + '">' + ring(st.mastery, true) + '<span class="eyebrow" style="position:relative">' + VOLS[t.vol] + "</span><h1>" + t.title + "</h1></header>" +
      '<section class="card stack"><div class="row"><div class="grow"><div class="eyebrow">Mastery</div><div class="big">' + st.mastery + '%</div></div><div class="small muted num" style="text-align:right">' +
      st.seen + " of " + st.n + " questions tried<br>" + (st.right + st.wrong ? pct(st.right, st.right + st.wrong) + "% answered correctly" : "No answers yet") + "</div></div>" + tape(st.mastery, st.mastery >= 80 ? "good" : "") +
      '<div class="row"><button data-act="practiceTopic" data-arg="' + t.id + '">Practice 15 random</button>' +
      (cards.length ? '<button data-act="cards" data-arg="' + t.id + '">Flashcards (' + cards.length + ")</button>" : "") + "</div></section>";
    var fs1 = fullStats(t);
    html += '<section class="card stack fullcard"><div class="row"><h2 class="grow">Full subject check</h2><span class="pill num">' + fs1.done + " / " + fs1.n + "</span></div>" +
      '<p class="small muted">Every question from this chapter of the books, 25 at a time, in shuffled order. Missed questions come back until you get each one right. At 100% you have been tested on the whole chapter.</p>' + tape(fs1.pct, fs1.pct === 100 ? "good" : "") +
      '<div class="row">' + (fs1.done < fs1.n ? '<button class="primary" data-act="full" data-arg="' + t.id + '">' + (fs1.done ? "Continue" : "Start") + " full check</button>" : "") + (fs1.done ? '<button class="quiet" data-act="fullRestart" data-arg="' + t.id + '">Start over</button>' : "") + "</div></section>";
    if (t.ls.length) {
      html += '<section class="card"><h2 style="margin-bottom:6px">Lessons</h2><div class="list">';
      t.ls.forEach(function (L) {
        html += '<button class="item" data-act="lesson" data-arg="' + t.id + "|" + L.i + '"><span><span class="muted num">' + (L.i + 1) + ".</span> " + esc(L.t) + '<br><span class="small muted num">Book pages ' + L.p + "</span></span>" +
          (passed(L) ? '<span class="pill good">Passed</span>' : '<span class="muted">›</span>') + "</button>";
      });
      html += "</div></section>";
    } else html += '<section class="card"><p class="muted">Lessons for this chapter are not built yet. The practice questions work now.</p></section>';
    return html + "</div>";
  }
  function lessonPage() {
    var t = TOPIC[sub.t], L = t.ls[sub.sec], html = "", open = false, sec = 0, inSec = false;
    L.teach.forEach(function (x) {
      var k = x.slice(0, 2), body = esc(x.slice(2));
      if (k === "- ") { if (!open) { html += "<ul>"; open = true; } html += "<li>" + body.replace(/^([^:]{2,60}):/, "<b>$1:</b>") + "</li>"; return; }
      if (open) { html += "</ul>"; open = false; }
      if (k === "# ") { if (inSec) html += "</section>"; sec++; inSec = true; html += '<section class="lsec"><h4><span class="snum num">' + sec + "</span>" + body + "</h4>"; return; }
      if (k === "! ") { if (inSec) { html += "</section>"; inSec = false; } html += '<p class="why"><b>Remember</b> ' + body + "</p>"; return; }
      html += "<p>" + esc(x) + "</p>";
    });
    if (open) html += "</ul>";
    if (inSec) html += "</section>";
    return '<div class="stack" style="--c:' + t.color + '">' + backbar([["Study", "tab", "study"], [t.title, "topic", t.id], ["Lesson " + (L.i + 1)]]) +
      '<header class="hero stack" style="gap:14px">' + ring(Math.round((L.i + 1) / t.ls.length * 100), true) + '<span class="eyebrow num" style="position:relative">' + VOLS[t.vol].split(" · ")[0] + " · lesson " + (L.i + 1) + " of " + t.ls.length + "</span><h1>" + esc(L.t) + "</h1>" +
      '<div class="row" style="position:relative"><span class="pill num">Book pages ' + L.p + '</span><span class="pill">' + t.title + "</span></div></header>" +
      '<p class="muted"><b style="color:var(--ink)">Goal:</b> ' + esc(L.goal) + ' Read the book pages before or after; this lesson is the same material in plain words.</p>' +
      '<article class="card lesson">' + html + "</article>" +
      (AI.sample || AI.tts ? '<div class="card stack"><b>Did not get it?</b><div class="chips">' +
        (AI.sample ? '<button class="chip" data-act="tLesson" data-arg="' + t.id + "|" + L.i + '|simple">Explain it simpler</button><button class="chip" data-act="tLesson" data-arg="' + t.id + "|" + L.i + '|draw">Draw me a picture</button><button class="chip" data-act="tLesson" data-arg="' + t.id + "|" + L.i + '|ask">Ask the teacher</button>' : "") +
        (AI.tts ? '<button class="chip" data-act="tLessonSpeak">' + (T.speaking === "lesson" ? "■ Stop reading" : "🔊 Read it to me") + "</button>" : "") + "</div></div>" : "") +
      '<div class="card stack"><b>Next: prove you remember it</b><span class="small muted num">' + L.cards.length + " recall cards, then " + L.qs.length + " check questions. Score 80% to pass the lesson.</span>" +
      '<button class="primary" data-act="lessonGo">I have read it. Test me</button></div></div>';
  }

  PAGES.practice = function () {
    var all = allQs(), due = dueQs(all).length, missed = all.filter(function (q) { return seen(q.id) && qRec(q.id)[0] === 0; }).length;
    var cards = cardsFor(), cdue = cards.filter(function (c) { return S.c[c.id] && S.c[c.id][1] <= today(); }).length;
    var html = '<div class="stack"><h1>Practice</h1><section class="card"><div class="list">' +
      (focusOn() ? '<button class="item" data-act="focusq"><span><b>Focus session</b><br><span class="small muted">20 questions only from your weak chapters.</span></span><span class="pill warn">Focus</span></button>' : "") +
      '<button class="item" data-act="smart" data-arg="20"><span><b>Smart session</b><br><span class="small muted">20 questions: what is due, then new ones from your weakest subjects.</span></span><span class="pill num">' + due + " due</span></button>" +
      '<button class="item" data-act="missed"' + (missed ? "" : " disabled") + '><span><b>My mistakes</b><br><span class="small muted">Only questions you last answered wrong.</span></span><span class="pill ' + (missed ? "bad" : "good") + ' num">' + missed + "</span></button>" +
      (cards.length ? '<button class="item" data-act="cards" data-arg=""><span><b>Flashcards</b><br><span class="small muted">Cards from the lessons you have passed, 20 at a time.</span></span><span class="pill num">' + cdue + " due</span></button>" : "") +
      '</div></section><section class="card"><h2 style="margin-bottom:6px">Full subject check, by chapter</h2><div class="list">';
    TOPICS.forEach(function (t) {
      var st = topicStats(t);
      var fsx = fullStats(t);
      html += '<button class="item" data-act="topic" data-arg="' + t.id + '"><span>' + t.title + '<br><span class="small muted num">Full check ' + fsx.done + " of " + fsx.n + '</span></span><span class="pill num' + (fsx.pct === 100 ? " good" : "") + '">' + fsx.pct + "%</span></button>";
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

  function scoreHistory() {
    if (!FOCUS) return "";
    var head = SCORES.map(function (r) { var d = new Date(r.date + "T00:00:00"); return '<th class="r">' + d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }) + "</th>"; }).join("");
    var rows = FOCUS.task.map(function (x) {
      return '<tr><td><span class="cdot" style="--c:' + TOPIC[x.topic].color + '"></span>' + x.name + "</td>" + x.hist.map(function (v) { return '<td class="r"><span class="sc ' + (v < 60 ? "lo" : v < 75 ? "mid" : "hi") + '">' + v + "</span></td>"; }).join("") + "</tr>";
    }).join("");
    return '<section class="card stack"><h2>Your NHIE score reports</h2><p class="small muted">Percent correct by exam area. Red is below 60, gold 60 to 74. The board notes these area scores rest on few questions each, so they guide focus but do not predict the next exam.</p>' +
      '<div class="scroll"><table class="scores"><tr><th>Area</th>' + head + "</tr>" + rows + '<tr><td><b>Scaled score</b> (500 passes)</td>' + SCORES.map(function (r) { return '<td class="r"><b>' + r.scaled + "</b></td>"; }).join("") + "</tr></table></div></section>";
  }
  PAGES.progress = function () {
    var rows = TOPICS.map(function (t) {
      var s = topicStats(t), acc = s.right + s.wrong ? pct(s.right, s.right + s.wrong) + "%" : "–";
      return '<tr><td><span class="cdot" style="--c:' + t.color + '"></span>' + t.title + '</td><td class="r">' + s.seen + "/" + s.n + '</td><td class="r">' + acc + '</td><td class="r"><span class="pill ' + (s.mastery >= 80 ? "good" : s.mastery >= 40 ? "warn" : s.seen ? "bad" : "") + '">' + s.mastery + "%</span></td></tr>";
    }).join("");
    var cards = cardsFor(), known = cards.filter(function (c) { return S.c[c.id] && S.c[c.id][0] >= 2; }).length;
    return '<div class="stack"><h1>Progress</h1><section class="card stack"><div class="row"><div class="grow"><div class="eyebrow">Exam readiness</div><div class="big">' + readiness() + "%</div></div>" +
      '<div class="small muted num" style="text-align:right">' + ALL_LESSONS.filter(passed).length + " of " + ALL_LESSONS.length + " lessons passed<br>" + known + " of " + cards.length + " flashcards known</div>" + "</div>" + tape(readiness()) + "</section>" +
      scoreHistory() +
      '<section class="card"><div class="scroll"><table><tr><th>Subject</th><th class="r">Tried</th><th class="r">Correct</th><th class="r">Mastery</th></tr>' + rows + "</table></div></section>" +
      '<section class="card stack"><p class="small muted" id="sync">' + syncLabel() + "</p>" +
      (confirmKey === "reset" ? '<div class="row"><b>Erase all progress?</b><button class="danger" data-act="resetYes">Yes, erase</button><button data-act="resetNo">Keep it</button></div>'
        : '<button class="danger" style="align-self:flex-start" data-act="reset">Erase all progress</button>') + "</section></div>";
  };

  // ---------- sessions ----------
  var SESSION = {};
  function startQuiz(qs, title, doneKey) {
    if (!qs.length) return;
    sessionOpened();
    session = { kind: "quiz", title: title, queue: qs.slice(), n: qs.length, i: 0, right: 0, wrong: [], cur: null, picked: -1, doneKey: doneKey, retried: {} };
    nextQ();
  }
  function nextQ() {
    var s = session, q = s.queue.shift();
    if (!q) { s.cur = null; if (s.doneKey) markDone(s.doneKey); if (s.lesson && s.right / s.n >= 0.8) { S.meta.read[s.lesson.topic + "-" + s.lesson.i] = 1; dirty("meta"); markDone("lesson"); } } else { s.cur = q; s.opts = shuffle(q.a.map(function (_, i) { return i; })); s.picked = -1; s.i++; }
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
      if (s.lesson) {
        var L = s.lesson, ok = p >= 80, nx = nextLesson();
        return '<div class="stack"><h1>' + (ok ? "Lesson passed" : "Not passed yet") + '</h1><section class="card stack"><div class="big">' + s.right + " / " + s.n + "</div>" + tape(p, ok ? "good" : "") +
          '<p class="muted">' + (ok ? "Its cards and questions now come back in your daily warm-up: tomorrow, then after 3 days, a week, and longer." : "You need 80%. Read the lesson once more, slowly, then try again. The questions you missed will also come back tomorrow.") + "</p>" +
          '<div class="row">' + (ok ? (nx ? '<button data-act="lesson" data-arg="' + nx.topic + "|" + nx.i + '">Next lesson</button>' : "") + '<button class="primary" data-act="tab" data-arg="today">Done for today</button>'
            : '<button class="primary" data-act="lesson" data-arg="' + L.topic + "|" + L.i + '">Read it again</button><button data-act="tab" data-arg="today">Later</button>') + "</div></section></div>";
      }
      if (s.full) {
        var fs2 = fullStats(TOPIC[s.full]);
        return '<div class="stack"><h1>' + (fs2.done === fs2.n ? "Subject complete!" : "Batch finished") + '</h1><section class="card stack"><div class="big num">' + fs2.done + " / " + fs2.n + '</div><span class="eyebrow">' + TOPIC[s.full].title + " questions answered right</span>" + tape(fs2.pct, fs2.pct === 100 ? "good" : "") +
          '<p class="muted">' + (fs2.done === fs2.n ? "You answered every question in this subject correctly. Do it again in a few days to make it stick." : "Questions you missed stay in the list and come back in the next batch until you get them right.") + "</p>" +
          '<div class="row">' + (fs2.done < fs2.n ? '<button class="primary" data-act="full" data-arg="' + s.full + '">Next ' + Math.min(25, fs2.n - fs2.done) + " questions</button>" : '<button class="primary" data-act="fullRestart" data-arg="' + s.full + '">Start over</button>') + '<button data-act="close">Done</button></div></section></div>';
      }
      return '<div class="stack"><h1>Session finished</h1><section class="card stack"><div class="big">' + s.right + " / " + s.n + "</div>" + tape(p, p >= 80 ? "good" : "") +
        '<p class="muted">' + (s.wrong.length ? "The questions you missed come back tomorrow. Read the lesson for: " + Object.keys(by).map(function (k) { return TOPIC[k].title; }).join(", ") + "." : "All correct on the first try. These questions will come back after a longer gap.") + "</p>" +
        '<div class="row"><button class="primary" data-act="smart" data-arg="20">Another 20</button><button data-act="tab" data-arg="today">Done</button></div></section></div>';
    }
    var done = s.picked >= 0, ok = done && s.opts[s.picked] === 0;
    return '<div class="stack">' + sessionBar(s, chip(TOPIC[q.t])) +
      tape(pct(s.i - 1 + (done ? 1 : 0), s.i + s.queue.length)) +
      '<section class="card stack"><p class="qtext">' + esc(q.q) + "</p>" + optButtons(q, s.opts, s.picked, done, -1) + "</section>" +
      (done ? '<div class="why ' + (ok ? "ok" : "no") + '"><b>' + (ok ? "Correct." : "Not quite. The answer is: " + esc(q.a[0]) + ".") + "</b><p>" + esc(q.e) + '</p></div><div class="row"><button class="primary" data-act="next">' + (s.queue.length ? "Next question" : "See results") + "</button>" + (!ok && AI.sample ? '<button data-act="tWhy">Ask the teacher why</button>' : "") + "</div>" : "") + "</div>";
  };

  function backLabel() {
    if (sub && sub.sec != null) return "Lesson " + (sub.sec + 1);
    if (sub && sub.t) return TOPIC[sub.t].title;
    return TABS.filter(function (x) { return x[0] === tab; })[0][1];
  }
  function sessionBar(s, extra) {
    return '<div class="backbar"><button class="back" data-act="close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>' + esc(backLabel()) + '</button><span class="row grow" style="justify-content:flex-end;gap:8px"><span class="eyebrow">' + esc(s.title) + "</span>" + (extra || "") + "</span></div>";
  }
  function startCards(pool, title, lesson, doneKey) {
    var cs = lesson ? shuffle(pool) : pickCards(pool, 20); if (!cs.length) cs = shuffle(pool).slice(0, 20);
    if (!cs.length) return;
    session = { kind: "cards", title: title, queue: cs, n: cs.length, i: 0, known: 0, shown: false, lesson: lesson || null, doneKey: doneKey };
    sessionOpened(); render(); window.scrollTo(0, 0);
  }
  SESSION.cards = function () {
    var s = session, c = s.queue[s.i];
    if (!c && s.lesson) return '<div class="stack"><h1>Recall done</h1><section class="card stack"><div class="big">' + s.known + " / " + s.n + '</div><p class="muted">Now the check questions. You need 80% to pass the lesson.</p><div class="row"><button class="primary" data-act="lessonQuiz">Start the check</button></div></section></div>';
    if (!c) return '<div class="stack"><h1>Flashcards finished</h1><section class="card stack"><div class="big">' + s.known + " / " + s.n + '</div><p class="muted">Cards you did not know come back tomorrow.</p><div class="row"><button class="primary" data-act="close">Done</button></div></section></div>';
    return '<div class="stack">' + sessionBar(s, chip(TOPIC[c.t]) + ' <span class="small muted num">' + (s.i + 1) + "/" + s.n + "</span>") +
      '<section class="card flash"><div class="term">' + esc(c.f) + "</div>" + (s.shown ? '<div class="lesson" style="margin:0 auto">' + esc(c.b) + "</div>" : '<p class="muted">Say the meaning out loud, then check.</p>') + "</section>" +
      (s.shown ? '<div class="row"><button class="grow" data-act="card" data-arg="0">Did not know</button><button class="primary grow" data-act="card" data-arg="1">Knew it</button></div>' : '<button class="primary" data-act="flip">Show answer</button>') + "</div>";
  };

  function startExam(n) {
    var qs = pickExam(n);
    sessionOpened();
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
        return '<div class="stack" style="gap:6px;padding:12px 0;border-top:1px solid var(--line)">' + chip(TOPIC[q.t]) + "<b>" + esc(q.q) + '</b><span class="small"><span class="pill bad">Your answer</span> ' + (s.ans[i] < 0 ? "Not answered" : esc(q.a[s.opts[i][s.ans[i]]])) + '</span><span class="small"><span class="pill good">Correct</span> ' + esc(q.a[0]) + '</span><span class="small muted">' + esc(q.e) + "</span></div>";
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
        : '<div class="row"><button data-act="finish">Finish exam</button><button class="quiet danger" data-act="close">Quit without grading</button></div>') + "</div>";
  };

  // ---------- actions ----------
  var ACT = {
    tab: function (a) { go(a); },
    close: function () { closeSession(); },
    vol: function (a) { volSel = +a; render(); var el = document.getElementById("vol" + a); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); },
    topic: function (a) { go("study", { t: a }); },
    lesson: function (a) { var x = a.split("|"); go("study", { t: x[0], sec: +x[1] }); },
    lessonGo: function () { var L = TOPIC[sub.t].ls[sub.sec]; startCards(L.cards, "Lesson recall", L); },
    lessonQuiz: function () { var L = session.lesson; startQuiz(shuffle(L.qs).slice(0, 8), "Lesson check"); session.lesson = L; },
    full: function (a) { startFull(a, false); },
    fullRestart: function (a) { startFull(a, true); },
    review: function () { var d = shuffle(dueQs(allQs())).slice(0, 20); if (d.length) startQuiz(d, "Warm-up", "review"); },
    cardsDue: function () { var d = cardsFor().filter(function (c) { return S.c[c.id] && S.c[c.id][1] <= today(); }); if (d.length) startCards(d, "Warm-up cards", null, "cards"); },
    focusq: function () { startQuiz(pickFocus(20), "Focus session", "review"); },
    focusToggle: function () { S.meta.focus = !focusOn(); dirty("meta"); render(); },
    smart: function (a) { startQuiz(pickSmart(+a || 20), "Smart session", "review"); },
    missed: function () { startQuiz(shuffle(allQs().filter(function (q) { return seen(q.id) && qRec(q.id)[0] === 0; })).slice(0, 25), "My mistakes"); },
    practiceTopic: function (a) { startQuiz(pickTopic(TOPIC[a], 15), "Subject practice", "topicq"); },
    cards: function (a) { startCards(cardsFor(a || null), "Flashcards"); },
    pick: function (a) {
      var s = session;
      if (s.kind === "exam") { s.ans[s.i] = s.ans[s.i] === +a ? -1 : +a; return render(); }
      if (s.picked >= 0) return;
      s.picked = +a; var ok = s.opts[s.picked] === 0, q = s.cur;
      if (!s.retried[q.id]) { qMark(q.id, ok); if (ok) { s.right++; if (s.full) { fullDone()[q.id] = 1; dirty("meta"); } } else { s.wrong.push(q); s.retried[q.id] = 1; s.queue.splice(Math.min(4, s.queue.length), 0, q); } }
      render();
    },
    next: function () { nextQ(); },
    flip: function () { session.shown = true; render(); },
    card: function (a) { var s = session; cMark(s.queue[s.i].id, a === "1"); if (a === "1") s.known++; s.i++; s.shown = false; if (s.i >= s.n && s.doneKey) markDone(s.doneKey); render(); window.scrollTo(0, 0); },
    exam: function (a) { startExam(+a); },
    jump: function (a) { var s = session, i = +a; if (i >= 0 && i < s.qs.length) { s.i = i; render(); window.scrollTo(0, 0); } },
    flagq: function () { var s = session; s.flag[s.i] = !s.flag[s.i]; render(); },
    finish: function () { confirmKey = "finish"; render(); },
    finishNo: function () { confirmKey = ""; render(); },
    finishYes: function () { finishExam(); },
    reset: function () { confirmKey = "reset"; render(); },
    resetNo: function () { confirmKey = ""; render(); },
    resetYes: function () { S.meta = { exam: S.meta.exam, streak: [0, 0], read: {}, exams: [], done: {}, full: {} }; S.q = {}; S.c = {}; confirmKey = ""; dirty("meta"); dirty("questions"); dirty("cards"); render(); }
  };
  for (var k in TACT) ACT[k] = TACT[k];
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

  var start = parseRoute(location.hash.slice(1));
  if (start) { tab = start.t; sub = start.s; if (/[~!]$/.test(location.hash)) location.replace("#" + route(tab, sub)); }
  render();
  cloudInit();
  aiInit();
})();
