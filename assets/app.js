/*
  Lern-App. Plain JavaScript with no build step.
  Screens: Home (#/) → Subject (#/spanisch) → Topic (#/spanisch/a1-u1)
  → Session (#/spanisch/a1-u1/karten | quiz | fehler).
  Content comes from subjects/index.js and one file per topic.
*/
(function () {
  "use strict";

  const SUBJECTS = window.SUBJECTS || [];
  const app = document.getElementById("app");
  const ROUND = 20; // flashcards per round when a topic is big

  // ---------- Topic files ----------
  // Each topic file calls addTopic({...}). The loader tags the <script> with
  // its key, so the file doesn't need to know its own name.
  const topicData = {};
  const loading = {};

  window.addTopic = function (data) {
    const el = document.currentScript;
    if (el && el.dataset.key) topicData[el.dataset.key] = data;
  };

  function loadTopic(subject, topic) {
    const key = subject.id + "/" + topic.id;
    if (topicData[key]) return Promise.resolve(topicData[key]);
    if (!loading[key]) {
      loading[key] = new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = topic.file;
        el.dataset.key = key;
        el.onload = () => (topicData[key] ? resolve(topicData[key]) : reject(new Error("no addTopic")));
        el.onerror = () => { el.remove(); reject(new Error("missing")); };
        document.head.appendChild(el);
      }).catch((err) => { delete loading[key]; throw err; });
    }
    return loading[key];
  }

  // ---------- Saved progress (this device only) ----------
  const store = {
    get(key) {
      try { return JSON.parse(localStorage.getItem("lernen:" + key)) || {}; } catch (e) { return {}; }
    },
    update(key, fn) {
      const v = this.get(key);
      fn(v);
      try { localStorage.setItem("lernen:" + key, JSON.stringify(v)); } catch (e) { /* private mode */ }
    },
  };

  // ---------- Helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Cards can be written as ["front", "back", "note"] or {front, back, note}.
  function normCards(cards) {
    return (cards || []).map((c) =>
      Array.isArray(c) ? { front: c[0], back: c[1], note: c[2] } : c);
  }

  function count(n, one, many) { return n + " " + (n === 1 ? one : many); }

  // What a topic's cards are called; a topic file can set unit: [one, many, dative plural].
  function unit(data) { return (data && data.unit) || ["Wort", "Wörter", "Wörtern"]; }

  const ICONS = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    cards: '<rect x="3" y="7" width="13" height="14" rx="2.5"/><path d="M8 3h10.5A2.5 2.5 0 0 1 21 5.5V16"/>',
    quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.5"/><path d="M12 17h.01"/>',
    redo: '<path d="M4 12a8 8 0 1 0 2.3-5.6L4 8.7"/><path d="M4 4v4.7h4.7"/>',
    page: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19"/>',
    course: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11.2V16c0 1.2 2.2 3 5 3s5-1.8 5-3v-4.8"/>',
  };
  function svg(name, cls) {
    return '<svg class="' + (cls || "ic") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
  }

  // Coloured tile with two letters; a topic can show its own `short` (e.g. a unit number).
  function mono(subject, topic) {
    const text = (topic && topic.short) || subject.short || subject.name.slice(0, 2);
    return '<span class="mono" style="--tint:' + esc(subject.color || "") + '" aria-hidden="true">' +
      esc(text) + "</span>";
  }

  function topBar(o) {
    return '<header class="bar' + (o.solid ? " scrolled" : "") + '"><div class="bar-inner">' +
      '<div class="bar-start">' + (o.up
        ? '<a class="bar-back" href="' + o.up + '" data-up="' + o.up + '">' + svg("back") + "<span>" + esc(o.upLabel) + "</span></a>"
        : "") + "</div>" +
      '<div class="bar-title">' + esc(o.title) + "</div>" +
      '<div class="bar-end">' + (o.end || "") + "</div></div></header>";
  }

  function row(href, lead, title, sub, end) {
    return '<li><a class="row" href="' + href + '">' + lead +
      '<span class="row-text"><span class="row-title">' + esc(title) + "</span>" +
      (sub ? '<span class="row-sub">' + esc(sub) + "</span>" : "") + "</span>" +
      '<span class="row-end">' + (end || "") + svg("chev", "chev") + "</span></a></li>";
  }

  function notice(title, body) {
    return '<div class="notice"><strong>' + title + "</strong>" + body + "</div>";
  }

  // ---------- Navigation ----------
  // `visited` mirrors this tab's history so the on-screen back button can use
  // the real browser back when possible, and go "up" when the link was opened directly.
  const visited = [currentHash()];
  let replacing = false;
  let goingBack = false;
  let routeToken = 0;
  let keyHandler = null;
  let leaveGuard = null;
  let titleObserver = null;

  function currentHash() {
    const h = location.hash;
    return h && h !== "#" ? h : "#/";
  }

  window.addEventListener("hashchange", () => {
    const h = currentHash();
    // Count each screen as a page view (see the GoatCounter lines in index.html).
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count();
    if (replacing) {
      visited[visited.length - 1] = h;
      replacing = false;
    } else if (visited.length > 1 && visited[visited.length - 2] === h) {
      visited.pop();
      goingBack = true;
    } else {
      visited.push(h);
    }
    route();
  });

  function goUp(parent) {
    goingBack = true;
    if (visited.length > 1 && visited[visited.length - 2] === parent) {
      history.back();
    } else {
      replace(parent);
    }
  }

  function replace(hash) {
    if (hash === currentHash()) { route(); return; }
    replacing = true;
    location.replace(hash);
  }

  app.addEventListener("click", (e) => {
    const up = e.target.closest("[data-up]");
    if (!up || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    if (leaveGuard && !leaveGuard()) return;
    goUp(up.dataset.up);
  });

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      const close = app.querySelector(".session [data-up]");
      if (close) { close.click(); return; }
    }
    if (keyHandler) keyHandler(e);
  });

  function render(html, title) {
    app.innerHTML = '<div class="screen' + (goingBack ? " is-back" : "") + '">' + html + "</div>";
    goingBack = false;
    document.title = title ? title + " · 6a Lernübungen" : "6a Lernübungen";
    window.scrollTo(0, 0);

    // Show the small title in the top bar once the large title scrolls away.
    if (titleObserver) titleObserver.disconnect();
    const bar = app.querySelector(".bar");
    const big = app.querySelector(".large-title");
    if (bar && big && "IntersectionObserver" in window) {
      titleObserver = new IntersectionObserver(([entry]) => {
        bar.classList.toggle("scrolled", !entry.isIntersecting);
      }, { rootMargin: "-52px 0px 0px 0px" });
      titleObserver.observe(big);
    }
  }

  function route() {
    keyHandler = null;
    leaveGuard = null;
    const token = ++routeToken;
    const parts = currentHash().replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    const [sid, tid, mode] = parts;

    if (!sid) return showHome();
    if (sid === "ideen") return showIdeas();
    const subject = SUBJECTS.find((s) => s.id === sid);
    if (!subject) return showNotFound();
    if (!tid) return showSubject(subject);
    const topic = (subject.topics || []).find((t) => t.id === tid);
    if (!topic) return showNotFound(subject);
    if (topic.page) return showPage(subject, topic);

    // Only show "Lädt …" if the file takes a moment (slow connections).
    const slow = setTimeout(() => {
      if (token === routeToken) {
        render(topBar({ up: "#/" + subject.id, upLabel: subject.name, title: topic.name }) +
          '<main class="page"><p class="loading">Lädt …</p></main>', topic.name);
      }
    }, 200);

    loadTopic(subject, topic).then((data) => {
      clearTimeout(slow);
      if (token !== routeToken) return;
      if (mode === "karten") showCards(subject, topic, data, false);
      else if (mode === "fehler") showCards(subject, topic, data, true);
      else if (mode === "quiz") showQuiz(subject, topic, data);
      else showTopic(subject, topic, data);
    }).catch(() => {
      clearTimeout(slow);
      if (token !== routeToken) return;
      render(topBar({ up: "#/" + subject.id, upLabel: subject.name, title: topic.name, solid: true }) +
        '<main class="page"><h1 class="large-title">' + esc(topic.name) + "</h1>" +
        notice("Dieses Thema konnte nicht geladen werden.",
          "Prüfe, ob <code>" + esc(topic.file) + "</code> existiert und genauso in <code>subjects/index.js</code> steht. " +
          "Wenn du offline bist, versuch es mit Internet nochmal.") + "</main>", topic.name);
    });
  }

  // ---------- Screen 1: Home ----------
  // Start screen: a calm "Heute" overview with real progress numbers.
  // Same word for everyone all day. It comes from the funny list in
  // subjects/wort-des-tages.js (not from the vocabulary); without it, from a card topic.
  function wordOfTheDay() {
    const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
    const fun = window.FUN_WORDS || [];
    if (fun.length) {
      const [lang, front, back] = fun[(day * 7919) % fun.length];
      return Promise.resolve({ card: { front, back }, labels: [lang, "Deutsch"], src: "Nicht im Unterricht" });
    }
    const pool = [];
    SUBJECTS.forEach((s) => (s.topics || []).forEach((t) => { if (t.file) pool.push([s, t]); }));
    if (!pool.length) return Promise.reject(new Error("no topics"));
    const [s, t] = pool[day % pool.length];
    return loadTopic(s, t).then((data) => {
      const cards = normCards(data.cards);
      if (!cards.length) throw new Error("no cards");
      const c = cards[(day * 7919) % cards.length];
      return { card: c, labels: data.labels || ["Vorderseite", "Rückseite"], src: s.name + " · " + t.name };
    });
  }

  // Numbers rise from 0 when the start screen opens (skipped with reduced motion).
  function countUp(root) {
    const still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.querySelectorAll("[data-count]").forEach((el) => {
      const to = Number(el.dataset.count);
      if (still || !to) { el.textContent = to; return; }
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / 800);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function showHome() {
    const last = store.get("last");
    let total = 0, studied = 0, open = 0, best = null;
    SUBJECTS.forEach((s) => (s.topics || []).forEach((t) => {
      const st = store.get(s.id + "/" + t.id);
      total++;
      if (st.studied) studied++;
      open += (st.missed || []).length;
      if (st.quizBest && (!best || st.quizBest.score / st.quizBest.total > best.score / best.total)) best = st.quizBest;
    }));
    const date = new Date().toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" });

    const stats =
      '<dl class="stats reveal" style="--i:2">' +
      '<div><dt>Themen geübt</dt><dd><span data-count="' + studied + '">0</span><small> / ' + total + "</small></dd></div>" +
      '<div><dt>Offene Fehler</dt><dd><span data-count="' + open + '">0</span><small> ' + (open === 1 ? "Karte" : "Karten") + "</small></dd></div>" +
      "<div><dt>Bestes Quiz</dt><dd>" + (best ? best.score + "<small> / " + best.total + "</small>" : "–") + "</dd></div></dl>";

    const cont = last.href
      ? '<a class="continue reveal" style="--i:3" href="' + esc(last.href) + '">' +
        '<span class="mode-ic">' + svg("redo") + "</span>" +
        '<span class="row-text"><span class="kicker">Weiterlernen</span>' +
        '<span class="row-title">' + esc(last.name) + '</span><span class="row-sub">' + esc(last.subject) + "</span></span>" +
        '<span class="go">Öffnen</span></a>'
      : "";

    const subjects = SUBJECTS.map((s) => {
      const topics = s.topics || [];
      const done = topics.filter((t) => store.get(s.id + "/" + t.id).studied).length;
      const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;
      return '<li><a class="row subject-row" href="#/' + esc(s.id) + '" style="--tint:' + esc(s.color || "") + '">' +
        mono(s) + '<span class="row-text"><span class="row-title">' + esc(s.name) + "</span>" +
        (s.blurb ? '<span class="row-sub">' + esc(s.blurb) + "</span>" : "") +
        '<span class="meter" aria-hidden="true"><span style="width:' + pct + '%"></span></span></span>' +
        '<span class="row-end">' + done + "/" + topics.length + svg("chev", "chev") + "</span></a></li>";
    }).join("");

    // The ideas box is always the last row, after every subject.
    const ideas = '<li><a class="row subject-row idea-row" href="#/ideen">' +
      '<span class="mono idea-mono" aria-hidden="true">' + svg("plus", "plus") + "</span>" +
      '<span class="row-text"><span class="row-title">Ideen</span>' +
      '<span class="row-sub">Vorschläge und Wünsche für diese Seite</span></span>' +
      '<span class="row-end">' + svg("chev", "chev") + "</span></a></li>";

    const owner = window.SITE_OWNER || {};
    const quick = window.QUICKLINKS || [];
    const footer = '<footer class="home-foot reveal" style="--i:6">' +
      (owner.name ? '<div class="foot-owner"><span class="foot-name">' + esc(owner.name) + "</span>" +
        (owner.mail ? '<a href="mailto:' + esc(owner.mail) + '">' + esc(owner.mail) + "</a>" : "") + "</div>" : "") +
      (quick.length ? '<nav class="foot-links" aria-label="Quicklinks"><span class="foot-label">Quicklinks</span><ul>' +
        quick.map((q) => '<li><a href="' + esc(q.url) + '" target="_blank" rel="noopener">' + esc(q.name) + "</a></li>").join("") +
        "</ul></nav>" : "") + "</footer>";

    render('<div class="home">' +
      '<header class="home-top reveal" style="--i:0"><span class="brand"><span class="brand-mark" aria-hidden="true">6a</span>Lernübungen</span>' +
      '<span class="home-date">' + esc(date) + "</span></header>" +
      '<h1 class="home-title reveal" style="--i:1">Heute</h1>' +
      '<p class="lede reveal" style="--i:1">Vokabeln, Grammatik und Geschichte für die nächste Prüfung.</p>' +
      stats +
      '<div class="home-grid"><section class="home-col">' + cont +
      '<h2 class="section-label reveal" style="--i:4">Fächer</h2>' +
      '<ul class="rows reveal" style="--i:5">' + subjects + ideas + "</ul>" +
      "</section>" +
      '<aside class="wotd-card reveal" style="--i:4"><div class="wotd-head"><h2 class="section-label">Wort des Tages</h2>' +
      '<span class="wotd-src"></span></div>' +
      '<button type="button" class="flashcard wotd" aria-label="Wort des Tages, antippen zum Umdrehen">' +
      '<div class="flashcard-inner"><div class="face face-front"><span class="face-label">Spanisch</span>' +
      '<span class="face-text">¡Hola!</span><span class="face-hint">Antippen zum Umdrehen</span></div>' +
      '<div class="face face-back" aria-hidden="true"><span class="face-label">Deutsch</span>' +
      '<span class="face-text">Hallo!</span></div></div></button></aside>' +
      "</div>" + footer + "</div>");

    countUp(app);

    const btn = app.querySelector(".wotd");
    btn.addEventListener("click", () => {
      const on = btn.classList.toggle("flipped");
      btn.querySelector(".face-front").setAttribute("aria-hidden", String(on));
      btn.querySelector(".face-back").setAttribute("aria-hidden", String(!on));
    });

    const token = routeToken;
    wordOfTheDay().then((w) => {
      if (token !== routeToken) return;
      const [front, back] = btn.querySelectorAll(".face-text");
      const [fl, bl] = btn.querySelectorAll(".face-label");
      front.textContent = w.card.front;
      back.textContent = w.card.back;
      fl.textContent = w.labels[0];
      bl.textContent = w.labels[1];
      front.classList.toggle("long", w.card.front.length > 22);
      back.classList.toggle("long", w.card.back.length > 22);
      app.querySelector(".wotd-src").textContent = w.src;
    }).catch(() => { /* keep the ¡Hola! card */ });
  }

  // Remember the last topic for "Weiter lernen" on the start screen.
  function rememberLast(subject, topic) {
    store.update("last", (v) => {
      v.href = "#/" + subject.id + "/" + topic.id;
      v.name = topic.name;
      v.subject = subject.name;
    });
  }

  // ---------- Screen 2: Subject ----------
  function topicSummary(key, data) {
    const st = store.get(key);
    if (st.quizBest) return '<span class="chip">' + st.quizBest.score + "/" + st.quizBest.total + "</span>";
    const n = normCards(data.cards).length;
    const q = (data.questions || []).length;
    return n ? count(n, unit(data)[0], unit(data)[1]) : count(q, "Frage", "Fragen");
  }

  function showSubject(subject) {
    const topics = subject.topics || [];

    // Topics with the same `group` are listed together under that heading.
    const groups = [];
    topics.forEach((t) => {
      const name = t.group || "";
      let g = groups.find((x) => x.name === name);
      if (!g) groups.push((g = { name, topics: [] }));
      g.topics.push(t);
    });

    const list = groups.map((g) =>
      (g.name ? '<h2 class="section-label">' + esc(g.name) + "</h2>" : "") +
      '<ul class="rows">' + g.topics.map((t) =>
        row("#/" + subject.id + "/" + t.id,
          t.page ? '<span class="mode-ic">' + svg("page") + "</span>" : mono(subject, t),
          t.name, t.blurb,
          '<span data-meta="' + esc(t.id) + '"></span>')).join("") + "</ul>").join("");

    // Direct links to this subject's Moodle course and school books (open in a new tab).
    const links = (subject.links || []).length
      ? '<h2 class="section-label">Links</h2><ul class="rows">' + subject.links.map((l) =>
        '<li><a class="row" href="' + esc(l.url) + '" target="_blank" rel="noopener">' +
        '<span class="mode-ic">' + svg(l.kind === "buch" ? "book" : "course") + "</span>" +
        '<span class="row-text"><span class="row-title">' + esc(l.name) + "</span>" +
        (l.sub ? '<span class="row-sub">' + esc(l.sub) + "</span>" : "") + "</span>" +
        '<span class="row-end">' + svg("external", "chev") + "</span></a></li>").join("") + "</ul>"
      : "";

    render(topBar({ up: "#/", upLabel: "Übersicht", title: subject.name }) +
      '<main class="page"><h1 class="large-title">' + esc(subject.name) + "</h1>" +
      (subject.blurb ? '<p class="lede">' + esc(subject.blurb) + "</p>" : "") + links +
      (topics.length
        ? list
        : notice("Hier gibt es noch keine Themen.", "Füge eines zur <code>topics</code>-Liste in <code>subjects/index.js</code> hinzu.")) +
      "</main>", subject.name);

    // Fill in word counts and best scores as the topic files arrive.
    const token = routeToken;
    topics.filter((t) => !t.page).forEach((t) => {
      loadTopic(subject, t).then((data) => {
        if (token !== routeToken) return;
        const el = app.querySelector('[data-meta="' + t.id + '"]');
        if (el) el.innerHTML = topicSummary(subject.id + "/" + t.id, data);
      }).catch(() => {
        const el = app.querySelector('[data-meta="' + t.id + '"]');
        if (el) el.textContent = "Fehler";
      });
    });
  }

  // ---------- Screen 3: Topic ----------
  function showTopic(subject, topic, data) {
    const key = subject.id + "/" + topic.id;
    const base = "#/" + subject.id + "/" + topic.id;
    const st = store.get(key);
    const cards = normCards(data.cards);
    const questions = data.questions || [];
    const labels = data.labels || ["Vorderseite", "Rückseite"];
    const missed = (st.missed || []).filter((f) => cards.some((c) => c.front === f));
    rememberLast(subject, topic);

    let modes = "";
    if (cards.length) {
      const round = cards.length > ROUND + 5 ? ROUND : cards.length;
      modes += row(base + "/karten", '<span class="mode-ic">' + svg("cards") + "</span>", "Karteikarten",
        (round < cards.length ? round + " zufällige von " + cards.length + " " + unit(data)[2] : count(cards.length, "Karte", "Karten")) +
        ". Umdrehen und sagen, ob du es wusstest.",
        st.cardsBest ? '<span class="chip">' + st.cardsBest.known + "/" + st.cardsBest.total + "</span>" : "");
    }
    if (questions.length || cards.length >= 4) {
      const sub = questions.length
        ? count(questions.length, "Frage", "Fragen") + " mit Erklärung."
        : Math.min(10, cards.length) + " Multiple-Choice-Fragen.";
      modes += row(base + "/quiz", '<span class="mode-ic">' + svg("quiz") + "</span>", "Quiz", sub,
        st.quizBest ? '<span class="chip">' + st.quizBest.score + "/" + st.quizBest.total + "</span>" : "");
    }
    if (missed.length) {
      modes += row(base + "/fehler", '<span class="mode-ic">' + svg("redo") + "</span>", "Fehler üben",
        count(missed.length, unit(data)[0], unit(data)[1]) + ", die du noch nicht wusstest.", "");
    }

    const reverse = !!st.reverse;
    const seg = cards.length
      ? '<h2 class="section-label" id="dir-label">Zuerst zeigen</h2>' +
        '<div class="seg" role="group" aria-labelledby="dir-label">' +
        '<button type="button" data-dir="0" aria-pressed="' + !reverse + '">' + esc(labels[0]) + " → " + esc(labels[1]) + "</button>" +
        '<button type="button" data-dir="1" aria-pressed="' + reverse + '">' + esc(labels[1]) + " → " + esc(labels[0]) + "</button></div>"
      : "";

    render(topBar({ up: "#/" + subject.id, upLabel: subject.name, title: topic.name }) +
      '<main class="page" style="--tint:' + esc(subject.color || "") + '">' +
      '<h1 class="large-title">' + esc(topic.name) + "</h1>" +
      (topic.blurb ? '<p class="lede">' + esc(topic.blurb) + "</p>" : "") +
      (modes ? '<ul class="rows">' + modes + "</ul>" : notice("Hier gibt es noch nichts zu lernen.", "Diese Datei hat keine <code>cards</code> oder <code>questions</code>.")) +
      seg + "</main>", topic.name);

    app.querySelectorAll("[data-dir]").forEach((b) => {
      b.addEventListener("click", () => {
        const rev = b.dataset.dir === "1";
        store.update(key, (v) => { v.reverse = rev; });
        app.querySelectorAll("[data-dir]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      });
    });
  }

  // ---------- Screen 4: Study session ----------
  function sessionShell(subject, up, title) {
    render('<div class="session" style="--tint:' + esc(subject.color || "") + '">' +
      '<header class="session-bar"><div class="session-bar-inner">' +
      '<a class="icon-btn" href="' + up + '" data-up="' + up + '" aria-label="Beenden">' + svg("close") + "</a>" +
      '<div class="track" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<div class="track-fill"></div></div><span class="count" aria-hidden="true"></span></div></header>' +
      '<main class="session-main"></main>' +
      '<footer class="actions"><div class="actions-inner"></div></footer>' +
      '<p class="sr-only" aria-live="polite"></p></div>', title);
    return {
      stage: app.querySelector(".session-main"),
      actions: app.querySelector(".actions-inner"),
      live: app.querySelector("[aria-live]"),
      progress(done, total) {
        const pct = total ? Math.round((done / total) * 100) : 0;
        app.querySelector(".track-fill").style.width = pct + "%";
        app.querySelector(".track").setAttribute("aria-valuenow", pct);
        app.querySelector(".count").textContent = done + " / " + total;
      },
    };
  }

  function isTyping(e) {
    return (e.key === " " || e.key === "Enter") && e.target.closest("button, a, input, textarea, select");
  }

  function confirmLeave(answered, finished) {
    return () => finished() || answered() < 3 ||
      window.confirm("Aufhören? Diese Runde wird nicht gespeichert.");
  }

  function scoreMessage(pct) {
    if (pct === 100) return "Perfekt!";
    if (pct >= 80) return "Sehr gut.";
    if (pct >= 50) return "Wird schon. Übe die Fehler nochmal.";
    return "Nochmal probieren, am besten zuerst die Fehler.";
  }

  function resultsView(kicker, score, total, msg, reviewRows) {
    return '<div class="results"><p class="kicker">' + kicker + "</p>" +
      '<p class="score">' + score + "<small> / " + total + "</small></p>" +
      '<p class="score-msg">' + esc(msg) + "</p>" +
      (reviewRows.length
        ? '<h2 class="section-label">Zum Wiederholen</h2><ul class="review">' + reviewRows.join("") + "</ul>"
        : "") + "</div>";
  }

  function reviewRow(a, b) {
    return "<li><span>" + esc(a) + '</span><span class="ans">' + esc(b) + "</span></li>";
  }

  // Flashcards: flip, then "Noch nicht" (comes back later in the round) or "Gewusst".
  function showCards(subject, topic, data, onlyMissed) {
    const key = subject.id + "/" + topic.id;
    const up = "#/" + subject.id + "/" + topic.id;
    const st = store.get(key);
    const labels = data.labels || ["Vorderseite", "Rückseite"];
    let deck = normCards(data.cards);
    if (onlyMissed) {
      const m = new Set(st.missed || []);
      deck = deck.filter((c) => m.has(c.front));
    } else if (deck.length > ROUND + 5) {
      deck = shuffle(deck).slice(0, ROUND);
    }
    if (!deck.length) { replace(up); return; }

    const ui = sessionShell(subject, up, topic.name);
    const total = deck.length;
    const queue = shuffle(deck);
    const missed = new Set();
    let known = 0;
    let answered = 0;
    let flipped = false;
    let finished = false;

    leaveGuard = confirmLeave(() => answered, () => finished);

    function draw() {
      if (!queue.length) return finish();
      const c = queue[0];
      const [q, a, ql, al] = st.reverse
        ? [c.back, c.front, labels[1], labels[0]]
        : [c.front, c.back, labels[0], labels[1]];
      flipped = false;
      ui.progress(known, total);
      ui.stage.innerHTML =
        '<button type="button" class="flashcard" aria-label="' + esc(ql + ": " + q + ". Tippen zum Umdrehen") + '">' +
        '<div class="flashcard-inner">' +
        '<div class="face face-front"><span class="face-label">' + esc(ql) + "</span>" +
        '<span class="face-text' + (q.length > 28 ? " long" : "") + '">' + esc(q) + "</span>" +
        '<span class="face-hint">Tippen zum Umdrehen</span></div>' +
        '<div class="face face-back" aria-hidden="true"><span class="face-label">' + esc(al) + "</span>" +
        '<span class="face-text' + (a.length > 28 ? " long" : "") + '">' + esc(a) + "</span>" +
        (c.note ? '<span class="face-note">' + esc(c.note) + "</span>" : "") + "</div></div></button>" +
        (queue.length > 1 ? '<p class="card-left">noch ' + count(queue.length - 1, "Karte", "Karten") + "</p>" : "");
      ui.stage.querySelector(".flashcard").addEventListener("click", flip);
      ui.actions.innerHTML =
        '<button type="button" class="btn btn-primary" data-show>Umdrehen <span class="key">Leertaste</span></button>';
      ui.actions.querySelector("[data-show]").addEventListener("click", flip);
    }

    function flip() {
      flipped = !flipped;
      const card = ui.stage.querySelector(".flashcard");
      card.classList.toggle("flipped", flipped);
      card.querySelector(".face-front").setAttribute("aria-hidden", String(flipped));
      card.querySelector(".face-back").setAttribute("aria-hidden", String(!flipped));
      if (flipped) {
        const c = queue[0];
        ui.live.textContent = st.reverse ? c.front : c.back;
        if (!ui.actions.querySelector("[data-grade]")) {
          ui.actions.innerHTML =
            '<button type="button" class="btn btn-again" data-grade="0">Noch nicht <span class="key">1</span></button>' +
            '<button type="button" class="btn btn-primary" data-grade="1">Gewusst <span class="key">2</span></button>';
          ui.actions.querySelectorAll("[data-grade]").forEach((b) =>
            b.addEventListener("click", () => grade(b.dataset.grade === "1")));
        }
      }
    }

    function grade(good) {
      answered++;
      const c = queue.shift();
      if (good) known++;
      else { missed.add(c.front); queue.push(c); }
      draw();
    }

    function finish() {
      finished = true;
      const firstTry = total - missed.size;
      ui.progress(total, total);
      store.update(key, (v) => {
        v.studied = true;
        // The "Fehler" list keeps old mistakes until you know them on the first try.
        const all = new Set(v.missed || []);
        deck.forEach((c) => (missed.has(c.front) ? all.add(c.front) : all.delete(c.front)));
        v.missed = Array.from(all);
        if (!onlyMissed && (!v.cardsBest || firstTry / total > v.cardsBest.known / v.cardsBest.total)) {
          v.cardsBest = { known: firstTry, total };
        }
      });
      const left = store.get(key).missed.length;
      const rows = deck.filter((c) => missed.has(c.front)).map((c) => reviewRow(c.front, c.back));
      ui.stage.innerHTML = resultsView(onlyMissed ? "Fehler geübt" : "Runde geschafft",
        firstTry, total, "auf Anhieb gewusst. " + scoreMessage(Math.round((firstTry / total) * 100)), rows);
      ui.actions.innerHTML =
        (left ? '<button type="button" class="btn btn-secondary" data-again>Fehler üben</button>'
              : '<button type="button" class="btn btn-secondary" data-next>Neue Runde</button>') +
        '<button type="button" class="btn btn-primary" data-done>Fertig</button>';
      const again = ui.actions.querySelector("[data-again]");
      if (again) again.addEventListener("click", () => replace(up + "/fehler"));
      const next = ui.actions.querySelector("[data-next]");
      if (next) next.addEventListener("click", () => replace(up + "/karten"));
      ui.actions.querySelector("[data-done]").addEventListener("click", () => goUp(up));
      ui.actions.querySelector("[data-done]").focus();
    }

    keyHandler = (e) => {
      if (finished || isTyping(e)) return;
      if (e.key === " " || (e.key === "Enter" && !flipped)) { e.preventDefault(); flip(); }
      else if (flipped && e.key === "1") grade(false);
      else if (flipped && e.key === "2") grade(true);
    };

    draw();
  }

  // Quiz: written questions if the topic has them, otherwise built from the cards.
  function buildQuiz(data, reverse) {
    const questions = data.questions || [];
    if (questions.length) {
      return shuffle(questions).map((q) => {
        const opts = q.options.includes(q.answer) ? q.options : [q.answer].concat(q.options);
        return { prompt: q.q, answer: q.answer, options: shuffle(opts), explain: q.explain };
      });
    }
    const labels = data.labels || ["Vorderseite", "Rückseite"];
    const cards = normCards(data.cards);
    const side = (c, back) => (back !== reverse ? c.back : c.front);
    const pool = Array.from(new Set(cards.map((c) => side(c, true))));
    return shuffle(cards).slice(0, 10).map((c) => {
      const answer = side(c, true);
      const wrong = shuffle(pool.filter((x) => x !== answer)).slice(0, 3);
      return {
        ask: "Auf " + (reverse ? labels[0] : labels[1]) + "?",
        prompt: side(c, false), answer, options: shuffle([answer].concat(wrong)), explain: c.note,
      };
    });
  }

  function showQuiz(subject, topic, data) {
    const key = subject.id + "/" + topic.id;
    const up = "#/" + subject.id + "/" + topic.id;
    const st = store.get(key);
    const items = buildQuiz(data, !!st.reverse);
    if (!items.length) { replace(up); return; }

    const ui = sessionShell(subject, up, topic.name);
    const total = items.length;
    const wrong = [];
    let i = 0;
    let score = 0;
    let locked = false;
    let finished = false;

    leaveGuard = confirmLeave(() => i + (locked ? 1 : 0), () => finished);

    function draw() {
      if (i >= total) return finish();
      const it = items[i];
      locked = false;
      ui.progress(i, total);
      ui.stage.innerHTML =
        '<p class="kicker">Frage ' + (i + 1) + " von " + total + (it.ask ? " · " + esc(it.ask) : "") + "</p>" +
        '<h2 class="q-prompt">' + esc(it.prompt) + "</h2>" +
        '<div class="options" role="group" aria-label="Antworten">' +
        it.options.map((o, n) =>
          '<button type="button" class="option" style="--i:' + n + '" data-i="' + n + '"><span class="num">' + (n + 1) + "</span>" +
          "<span>" + esc(o) + "</span></button>").join("") +
        '</div><div class="feedback-slot"></div>';
      ui.stage.querySelectorAll(".option").forEach((b) =>
        b.addEventListener("click", () => choose(Number(b.dataset.i))));
      ui.actions.innerHTML = "";
    }

    function choose(n) {
      if (locked) return;
      locked = true;
      const it = items[i];
      const picked = it.options[n];
      const right = picked === it.answer;
      if (right) score++;
      else wrong.push(it);
      ui.stage.querySelectorAll(".option").forEach((b, k) => {
        b.disabled = true;
        const o = it.options[k];
        if (o === it.answer) b.classList.add("correct");
        else if (k === n) b.classList.add("wrong");
        else b.classList.add("dim");
      });
      ui.stage.querySelector(".feedback-slot").innerHTML =
        '<div class="feedback ' + (right ? "ok" : "bad") + '"><strong>' +
        (right ? "Richtig!" : "Leider falsch. Richtig: „" + esc(it.answer) + "“") + "</strong>" +
        (it.explain ? esc(it.explain) : "") + "</div>";
      ui.live.textContent = right ? "Richtig." : "Leider falsch. Richtig ist " + it.answer + ".";
      ui.progress(i + 1, total);
      ui.actions.innerHTML =
        '<button type="button" class="btn btn-primary" data-next>' +
        (i + 1 < total ? "Weiter" : "Zum Ergebnis") + ' <span class="key">Enter</span></button>';
      const next = ui.actions.querySelector("[data-next]");
      next.addEventListener("click", () => { i++; draw(); });
      next.focus({ preventScroll: true });
    }

    function finish() {
      finished = true;
      ui.progress(total, total);
      store.update(key, (v) => {
        v.studied = true;
        if (!v.quizBest || score / total > v.quizBest.score / v.quizBest.total) v.quizBest = { score, total };
      });
      ui.stage.innerHTML = resultsView("Quiz geschafft", score, total,
        scoreMessage(Math.round((score / total) * 100)), wrong.map((it) => reviewRow(it.prompt, it.answer)));
      ui.actions.innerHTML =
        '<button type="button" class="btn btn-secondary" data-retry>Nochmal</button>' +
        '<button type="button" class="btn btn-primary" data-done>Fertig</button>';
      ui.actions.querySelector("[data-retry]").addEventListener("click", () => route());
      ui.actions.querySelector("[data-done]").addEventListener("click", () => goUp(up));
      ui.actions.querySelector("[data-done]").focus();
    }

    keyHandler = (e) => {
      if (finished || isTyping(e)) return;
      const n = Number(e.key);
      if (!locked && n >= 1 && n <= items[i].options.length) choose(n - 1);
      else if (locked && e.key === "Enter") { i++; draw(); }
    };

    draw();
  }

  // A saved study page (for example a Claude artifact saved as .html).
  function showPage(subject, topic) {
    store.update(subject.id + "/" + topic.id, (v) => { v.studied = true; });
    rememberLast(subject, topic);
    render('<div class="page-screen">' +
      topBar({
        up: "#/" + subject.id, upLabel: subject.name, title: topic.name, solid: true,
        end: '<a class="bar-link" href="' + esc(topic.page) + '" target="_blank" rel="noopener">Vollbild ' + svg("external") + "</a>",
      }) +
      '<iframe class="frame" src="' + esc(topic.page) + '" title="' + esc(topic.name) + '"></iframe></div>', topic.name);
  }

  // Ideas box: the message is e-mailed through FormSubmit, so no server is needed.
  // The first message ever sends an activation e-mail that has to be confirmed once.
  function showIdeas() {
    render(topBar({ up: "#/", upLabel: "Übersicht", title: "Ideen" }) +
      '<main class="page"><h1 class="large-title">Ideen</h1>' +
      '<p class="lede">Hier kannst du deine Vorschläge oder Sachen, die verändert werden sollen, hineinschreiben.</p>' +
      '<form class="idea-form" novalidate>' +
      '<label class="field"><span class="field-label">Deine Idee</span>' +
      '<textarea name="idea" rows="6" placeholder="Zum Beispiel: Bitte auch Englisch-Vokabeln, oder: Im Quiz ist eine Antwort falsch …"></textarea></label>' +
      '<label class="field"><span class="field-label">Dein Name</span>' +
      '<input name="sender" type="text" autocomplete="name"></label>' +
      '<input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<p class="idea-status" role="status"></p>' +
      '<button type="submit" class="btn btn-primary">Absenden</button></form></main>', "Ideen");

    const form = app.querySelector(".idea-form");
    const status = form.querySelector(".idea-status");
    const field = (n) => form.elements.namedItem(n);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const idea = field("idea").value.trim();
      const name = field("sender").value.trim();
      if (field("_honey").value) return;
      if (!idea || !name) {
        status.textContent = !idea ? "Schreib zuerst deine Idee in das Feld." : "Schreib bitte noch deinen Namen dazu.";
        status.className = "idea-status bad";
        field(!idea ? "idea" : "sender").focus();
        return;
      }
      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.textContent = "Wird gesendet …";
      status.textContent = "";
      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(window.IDEAS_MAIL || ""), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Neue Idee für 6a Lernübungen", _template: "table", _captcha: "false",
          Name: name, Idee: idea,
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (String(d.success) !== "true") throw new Error(d.message || "not sent");
          form.innerHTML = '<div class="notice"><strong>Danke!</strong>Deine Idee wurde verschickt.</div>' +
            '<button type="button" class="btn btn-secondary" data-again>Noch eine Idee</button>';
          form.querySelector("[data-again]").addEventListener("click", showIdeas);
        })
        .catch(() => {
          btn.disabled = false;
          btn.textContent = "Absenden";
          status.textContent = "Das hat nicht geklappt. Prüfe deine Internetverbindung und versuch es nochmal.";
          status.className = "idea-status bad";
        });
    });
  }

  function showNotFound(subject) {
    const up = subject ? "#/" + subject.id : "#/";
    render(topBar({ up, upLabel: subject ? subject.name : "Übersicht", title: "Nicht gefunden", solid: true }) +
      '<main class="page"><h1 class="large-title">Nicht gefunden</h1>' +
      notice("Diese Seite gibt es nicht.", "Vielleicht wurde sie umbenannt. Geh zurück und wähle nochmal.") + "</main>");
  }

  route();
})();
