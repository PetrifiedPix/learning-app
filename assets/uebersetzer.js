/*
  Übersetzer: shown in the small tools panel that the "…" menu opens.
  Loaded by assets/app.js only when needed, which calls Uebersetzer.mount(lang, root, h).

  - Spanisch: Google Übersetzer (the free endpoint its own website uses), plus
    other meanings of single words. Falls back to a link to translate.google.com.
  - Latein: works like the Stowasser. It looks the word up in the German
    Wiktionary: which form it is, the basic form with its forms, and possible
    meanings. No sentence translation on purpose. Rare forms are first looked
    up in the English Wiktionary to find the basic form.
*/
(function () {
  "use strict";

  let h; // helpers from app.js: esc, svg, store, fine (true with a mouse: then inputs get focus)

  window.Uebersetzer = {
    mount(lang, root, helpers) {
      h = helpers;
      if (lang === "latein") showLatin(root);
      else showSpanish(root);
    },
  };

  function getJSON(url) {
    return fetch(url).then((r) => {
      if (!r.ok && r.status !== 404) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function extLink(url, text) {
    return '<a class="tr-ext" href="' + h.esc(url) + '" target="_blank" rel="noopener">' + h.esc(text) + " " + h.svg("external") + "</a>";
  }

  // ---------- Spanisch ----------
  const POS = {
    noun: "Substantiv", verb: "Verb", adjective: "Adjektiv", adverb: "Adverb", preposition: "Präposition",
    conjunction: "Konjunktion", pronoun: "Pronomen", interjection: "Ausruf", article: "Artikel",
    abbreviation: "Abkürzung", phrase: "Wendung", prefix: "Vorsilbe", suffix: "Nachsilbe", particle: "Partikel",
  };

  function showSpanish(root) {
    const saved = h.store.get("uebersetzer");
    let dir = saved.dir === "de" ? "de" : "es"; // source language
    root.innerHTML = (
      '<form class="tr-form" novalidate>' +
      '<div class="seg" role="group" aria-label="Richtung">' +
      '<button type="button" data-dir="es">Spanisch → Deutsch</button>' +
      '<button type="button" data-dir="de">Deutsch → Spanisch</button></div>' +
      '<label class="field"><span class="field-label tr-label"></span>' +
      '<textarea name="q" rows="3" autocapitalize="off" spellcheck="false"></textarea></label>' +
      '<div class="tr-buttons"><button type="submit" class="btn btn-primary">Übersetzen</button></div></form>' +
      '<div class="tr-result" aria-live="polite"></div>');

    const form = root.querySelector(".tr-form");
    const box = form.elements.namedItem("q");
    const out = root.querySelector(".tr-result");

    function setDir(d) {
      dir = d;
      form.querySelectorAll("[data-dir]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dir === d)));
      form.querySelector(".tr-label").textContent = d === "es" ? "Spanisch" : "Deutsch";
      box.placeholder = d === "es" ? "Zum Beispiel: ¿Dónde está la biblioteca?" : "Zum Beispiel: Ich habe heute keine Zeit.";
      h.store.update("uebersetzer", (v) => { v.dir = d; });
    }
    setDir(dir);
    form.querySelectorAll("[data-dir]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.dir === dir) return;
      setDir(b.dataset.dir);
      out.innerHTML = "";
      if (box.value.trim()) translate();
    }));
    form.addEventListener("submit", (e) => { e.preventDefault(); translate(); });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); translate(); }
    });
    if (h.fine) box.focus();

    let ask = 0;
    function translate() {
      const q = box.value.trim();
      if (!q) { box.focus(); return; }
      const from = dir, to = dir === "es" ? "de" : "es";
      const gUrl = "https://translate.google.com/?sl=" + from + "&tl=" + to + "&text=" + encodeURIComponent(q) + "&op=translate";
      const mine = ++ask;
      out.innerHTML = '<p class="loading">Übersetze …</p>';
      getJSON("https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&dt=bd&sl=" + from + "&tl=" + to + "&q=" + encodeURIComponent(q))
        .then((d) => {
          if (mine !== ask || !root.isConnected) return;
          const text = (d[0] || []).map((seg) => seg[0] || "").join("").trim();
          if (!text) throw new Error("empty");
          const groups = (d[1] || []).map((g) => {
            const words = (g[2] || []).map((e) => (e[4] ? e[4] + " " : "") + e[0]);
            return words.length ? '<div class="tr-dict-row"><span class="tr-pos">' + h.esc(POS[g[0]] || g[0]) + "</span>" +
              '<span class="tr-words">' + h.esc(words.slice(0, 8).join(", ")) + "</span></div>" : "";
          }).join("");
          out.innerHTML = '<div class="tr-card">' +
            '<span class="face-label">' + (to === "de" ? "Deutsch" : "Spanisch") + "</span>" +
            '<p class="tr-text" lang="' + to + '">' + h.esc(text) + "</p>" +
            (canSpeak() ? '<button type="button" class="tr-speak" data-say="' + h.esc(to === "es" ? text : q) + '">Spanisch anhören</button>' : "") +
            (groups ? '<div class="tr-dict"><h2 class="section-label">Weitere Bedeutungen</h2>' + groups + "</div>" : "") +
            "</div>" + extLink(gUrl, "In Google Übersetzer öffnen");
          const say = out.querySelector(".tr-speak");
          if (say) say.addEventListener("click", () => speak(say.dataset.say));
        })
        .catch(() => {
          if (mine !== ask || !root.isConnected) return;
          out.innerHTML = '<div class="notice"><strong>Das hat gerade nicht geklappt.</strong>' +
            "Prüfe deine Internetverbindung, oder öffne den Text direkt bei Google.</div>" + extLink(gUrl, "In Google Übersetzer öffnen");
        });
    }
  }

  function canSpeak() { return "speechSynthesis" in window; }
  function speak(text) {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "es-ES";
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ---------- Latein ----------
  const DE_API = "https://de.wiktionary.org/w/api.php?format=json&formatversion=2&origin=*&";
  const ENCLITICS = { que: "-que = „und“ (angehängt)", ne: "-ne = Fragepartikel (angehängt)", ve: "-ve = „oder“ (angehängt)" };

  function showLatin(root) {
    root.innerHTML = (
      '<p class="tr-hint">Wie im Stowasser: Gib ein Wort ein, auch eine Form wie <i>amat</i>. ' +
      "Du siehst, welche Form es ist, die Grundform und mögliche Bedeutungen. Übersetzen musst du selbst.</p>" +
      '<form class="tr-form lex-form" novalidate>' +
      '<label class="field"><span class="field-label">Lateinisches Wort</span>' +
      '<input name="q" type="search" placeholder="z. B. basia, fecerimus, miser" autocapitalize="off" autocorrect="off" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>' +
      '<div class="tr-buttons"><button type="submit" class="btn btn-primary">Nachschlagen</button></div>' +
      '<div class="lex-recent"></div></form>' +
      '<div class="tr-result" aria-live="polite"></div>');

    const form = root.querySelector(".lex-form");
    const input = form.elements.namedItem("q");
    const out = root.querySelector(".tr-result");
    const recentBox = form.querySelector(".lex-recent");

    function showRecent() {
      const list = h.store.get("woerterbuch").recent || [];
      recentBox.innerHTML = list.length ? '<span class="foot-label">Zuletzt</span>' +
        list.map((w) => '<button type="button" class="chip lex-chip">' + h.esc(w) + "</button>").join("") : "";
    }
    showRecent();
    recentBox.addEventListener("click", (e) => {
      const chip = e.target.closest(".lex-chip");
      if (!chip) return;
      input.value = chip.textContent;
      lookupAll();
    });
    form.addEventListener("submit", (e) => { e.preventDefault(); lookupAll(); });
    out.addEventListener("click", onResultClick);
    if (h.fine) input.focus();

    let ask = 0;
    function lookupAll() {
      const words = input.value.replace(/[.,;:!?„“"'()«»]/g, " ").split(/\s+/).filter(Boolean).slice(0, 6);
      if (!words.length) { input.focus(); return; }
      input.blur();
      h.store.update("woerterbuch", (v) => {
        const q = words.join(" ");
        v.recent = [q].concat((v.recent || []).filter((x) => x !== q)).slice(0, 8);
      });
      showRecent();
      const mine = ++ask;
      out.innerHTML = words.map((w) => '<section class="lex-word"><h2 class="lex-q">' + h.esc(w) + '</h2><p class="loading">Suche …</p></section>').join("");
      const slots = out.querySelectorAll(".lex-word");
      words.forEach((w, i) => {
        lookup(w).then((res) => {
          if (mine === ask && root.isConnected) slots[i].innerHTML = renderWord(w, res);
        }).catch(() => {
          if (mine === ask && root.isConnected) {
            slots[i].innerHTML = '<h2 class="lex-q">' + h.esc(w) + "</h2>" +
              '<div class="notice"><strong>Keine Verbindung zum Wörterbuch.</strong>Prüfe dein Internet und versuch es nochmal.</div>' + moreLinks(w);
          }
        });
      });
    }
  }

  function plain(word) {
    return word.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  function cap(w) { return w.charAt(0).toUpperCase() + w.slice(1); }

  // Look up one word: which form it is, and the dictionary entries of its basic form(s).
  async function lookup(raw) {
    const word = plain(raw);
    let res = await resolve(word);
    if (!res.entries.length && !res.forms.length && !res.english.length) {
      const m = word.match(/^(.{3,})(que|ne|ve)$/);
      if (m) {
        const base = await resolve(m[1]);
        if (base.entries.length || base.forms.length) { base.note = ENCLITICS[m[2]]; res = base; }
      }
    }
    return res;
  }

  async function resolve(word) {
    const res = { forms: [], entries: [], english: [], note: "" };
    let found = await fetchDe([word, cap(word)]);
    res.forms = found.forms;
    res.entries = found.entries;

    // Not in the German Wiktionary: ask the English one which form it is.
    if (!res.forms.length && !res.entries.length) {
      const en = await fetchEn(word);
      res.forms = en.forms;
      res.english = en.meanings;
    }

    // Get the basic forms (two steps at most, e.g. fecerimus → facio → facere).
    for (let step = 0; step < 2; step++) {
      const have = new Set(res.entries.map((e) => plain(e.title)));
      const need = [...new Set(res.forms.map((f) => f.lemma).filter((l) => l && !have.has(plain(l))))];
      if (!need.length) break;
      found = await fetchDe(need);
      res.entries = res.entries.concat(found.entries);
      found.forms.forEach((f) => {
        res.forms.forEach((g) => { if (plain(g.lemma) === plain(f.page)) g.lemma = f.lemma; });
      });
      if (!found.forms.length) break;
    }

    // The English Wiktionary names verbs by the 1st person (moneō); the German one by the
    // infinitive (monēre). Try the likely infinitives.
    const missing = [...new Set(res.forms.map((f) => plain(f.lemma)))]
      .filter((l) => /o$/.test(l) && !res.entries.some((e) => plain(e.title) === l));
    if (missing.length) {
      const guess = {};
      missing.forEach((l) => {
        const b = l.slice(0, -1);
        const list = /eo$/.test(l) ? [b + "re"] : /io$/.test(l) ? [b.slice(0, -1) + "ire", b.slice(0, -1) + "ere"] : [b + "are", b + "ere"];
        list.forEach((g) => { guess[g] = l; });
      });
      found = await fetchDe(Object.keys(guess));
      found.entries.filter((e) => e.verb || /Verb/.test(e.kind)).forEach((e) => {
        const from = guess[plain(e.title)];
        if (!from) return;
        res.entries.push(e);
        res.forms.forEach((f) => { if (plain(f.lemma) === from) f.lemma = e.title; });
      });
    }

    // Basic form only in the English Wiktionary: show its English meanings.
    if (!res.entries.length && res.forms.length && !res.english.length) {
      const en = await fetchEn(plain(res.forms[0].lemma));
      res.english = en.meanings;
    }
    return res;
  }

  async function fetchDe(titles) {
    const d = await getJSON(DE_API + "action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&titles=" +
      encodeURIComponent(titles.join("|")));
    const out = { forms: [], entries: [] };
    ((d.query && d.query.pages) || []).forEach((p) => {
      if (p.missing || !p.revisions) return;
      const parsed = parseDe(p.title, p.revisions[0].slots.main.content);
      out.forms = out.forms.concat(parsed.forms);
      out.entries = out.entries.concat(parsed.entries);
    });
    return out;
  }

  // Wiki markup → plain text.
  function clean(s) {
    return s
      .replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\{\{(Pl|Sg)\.\}\}/g, "$1.")
      .replace(/\{\{[^{}]*\}\}/g, "")
      .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
      .replace(/'{2,}/g, "")
      .replace(/·/g, "")
      .replace(/\s+/g, " ")
      .replace(/^[\s,;:]+|[\s,;]+$/g, "")
      .trim();
  }

  // Lines after a {{Heading}} like {{Bedeutungen}}, until the next heading.
  function block(text, name) {
    const i = text.indexOf("{{" + name + "}}");
    if (i < 0) return [];
    const rest = text.slice(i + name.length + 4).split("\n");
    const lines = [];
    for (const line of rest) {
      if (/^\{\{[^}]+\}\}\s*$/.test(line) || /^=/.test(line)) { if (lines.length || line.trim()) break; }
      if (line.trim()) lines.push(line);
    }
    return lines;
  }

  function template(text, start) {
    const i = text.indexOf(start);
    if (i < 0) return "";
    let depth = 0;
    for (let j = i; j < text.length - 1; j++) {
      if (text[j] === "{" && text[j + 1] === "{") { depth++; j++; }
      else if (text[j] === "}" && text[j + 1] === "}") { depth--; j++; if (!depth) return text.slice(i, j + 1); }
    }
    return "";
  }

  // Template parameters: {{Name|a|b|x=y}} → { name, pos: [a, b], named: { x: y } }.
  function params(tpl) {
    const parts = tpl.slice(2, -2).split("|").map((x) => x.trim());
    const out = { name: parts.shift(), pos: [], named: {} };
    parts.forEach((x) => {
      const i = x.indexOf("=");
      if (i > 0) out.named[x.slice(0, i).trim()] = x.slice(i + 1).trim();
      else out.pos.push(x);
    });
    return out;
  }

  // Dictionary heading like in school: "amō, amāre, amāvī, amātum" or "puella, puellae f."
  function heading(flex) {
    if (!flex) return "";
    const p = params(flex);
    if (p.name === "Latein Verb Übersicht") {
      const [stem, inf, perf, sup] = p.pos;
      if (!stem || !inf) return "";
      const end = plain(inf);
      const first = end === "are" ? "ō" : end === "ire" || p.named.i === "1" ? "iō" : /^ē/.test(inf) ? "eō" : "ō";
      return [stem + first, stem + inf, perf ? perf + "ī" : "", sup ? sup + "um" : ""].filter(Boolean).join(", ");
    }
    if (p.name === "Latein Substantiv Übersicht") {
      const [nom, stem, gen] = p.pos;
      return nom && stem && gen ? nom + ", " + stem + gen : "";
    }
    return "";
  }

  function parseDe(title, text) {
    const out = { forms: [], entries: [] };
    const re = /^== *.+? *\(\{\{Sprache\|Latein\}\}\) *==\s*$/m;
    const m = re.exec(text);
    if (!m) return out;
    let section = text.slice(m.index + m[0].length);
    const next = section.search(/^== [^=]/m);
    if (next >= 0) section = section.slice(0, next);

    section.split(/^(?==== )/m).forEach((part) => {
      const head = part.match(/^=== *(.+?) *===/);
      if (!head) return;
      const kinds = [...head[1].matchAll(/\{\{Wortart\|([^|}]+)/g)].map((x) => x[1]);
      let genus = (head[1].match(/\{\{([mfn])\}\}/g) || []).map((g) => g[2]).join("/");

      block(part, "Grammatische Merkmale").forEach((line) => {
        if (!/^\*/.test(line)) return;
        const lemma = (line.match(/\[\[([^\]|#]+)/) || [])[1];
        out.forms.push({ page: title, text: clean(line.replace(/^\*+/, "")), lemma: lemma || "" });
      });

      const meanings = block(part, "Bedeutungen")
        .filter((l) => /^:\s*\[/.test(l))
        .map((l) => clean(l.replace(/^:\s*\[[^\]]*\]/, "").replace(/\{\{K\|[^{}]*\}\}/g, "")))
        .filter(Boolean);
      if (!meanings.length) return;
      const flex = template(part, "{{Latein ");
      const head1 = heading(flex) || block(part, "Worttrennung").map(clean).filter(Boolean)[0] || title;
      if (!genus && flex) genus = ["m", "f", "n"].filter((g) => params(flex).named[g] === "1").join("/");
      out.entries.push({
        title, head: head1, kind: kinds.filter((k) => !/Form$/.test(k)).join(", ") || kinds[0] || "",
        genus: { m: "m.", f: "f.", n: "n." }[genus] || (genus ? genus.split("/").map((g) => g + ".").join("/") : ""),
        meanings, flex, verb: /Verb/.test(flex),
      });
    });
    return out;
  }

  // English Wiktionary: only used to find which form a word is (and as a last resort, English meanings).
  const EN_WORDS = [
    [/first-person/g, "1. Person"], [/second-person/g, "2. Person"], [/third-person/g, "3. Person"],
    [/future perfect/g, "Futur II"], [/pluperfect/g, "Plusquamperfekt"], [/imperfect/g, "Imperfekt"],
    [/perfect/g, "Perfekt"], [/present/g, "Präsens"], [/future/g, "Futur I"],
    [/active/g, "Aktiv"], [/passive/g, "Passiv"], [/indicative/g, "Indikativ"], [/subjunctive/g, "Konjunktiv"],
    [/imperative/g, "Imperativ"], [/infinitive/g, "Infinitiv"], [/participle/g, "Partizip"],
    [/gerundive/g, "Gerundivum"], [/gerund/g, "Gerundium"], [/supine/g, "Supinum"],
    [/nominative/g, "Nominativ"], [/genitive/g, "Genitiv"], [/dative/g, "Dativ"], [/accusative/g, "Akkusativ"],
    [/ablative/g, "Ablativ"], [/vocative/g, "Vokativ"], [/locative/g, "Lokativ"],
    [/masculine/g, "Maskulinum"], [/feminine/g, "Femininum"], [/neuter/g, "Neutrum"],
    [/singular/g, "Singular"], [/plural/g, "Plural"], [/comparative/g, "Komparativ"], [/superlative/g, "Superlativ"],
    [/degree/g, ""], [/\band\b/g, "und"], [/inflection/g, "Form"], [/alternative form/g, "Nebenform"],
    [/contraction/g, "Kurzform"], [/syncopic form/g, "Kurzform"],
  ];
  function toGerman(s) {
    EN_WORDS.forEach(([a, b]) => { s = s.replace(a, b); });
    return s.replace(/\s+/g, " ").trim();
  }

  async function fetchEn(word) {
    const out = { forms: [], meanings: [] };
    let d;
    try {
      d = await getJSON("https://en.wiktionary.org/api/rest_v1/page/definition/" + encodeURIComponent(word));
    } catch (e) { return out; }
    (d.la || []).forEach((pos) => (pos.definitions || []).forEach((def) => {
      const doc = new DOMParser().parseFromString(def.definition || "", "text/html");
      const link = doc.querySelector(".form-of-definition-link a");
      const text = doc.body.textContent.replace(/\s+/g, " ").trim();
      if (link) {
        const lemma = (link.getAttribute("title") || link.textContent).replace(/#.*/, "");
        const what = text.split(/ of /)[0];
        out.forms.push({ page: word, text: toGerman(what) + " von " + link.textContent, lemma });
      } else if (text) {
        out.meanings.push({ kind: pos.partOfSpeech, text });
      }
    }));
    return out;
  }

  function moreLinks(w) {
    const q = plain(w);
    return '<p class="lex-more">Mehr dazu: ' +
      extLink("https://www.navigium.de/latein-woerterbuch/" + encodeURIComponent(q) + "?wb=gross", "Navigium") + " " +
      extLink("https://www.frag-caesar.de/lateinwoerterbuch/" + encodeURIComponent(q) + "-uebersetzung.html", "Frag Caesar") + "</p>";
  }

  function renderWord(w, res) {
    const e = h.esc;
    let html = '<h2 class="lex-q">' + e(w) + "</h2>";
    if (res.note) html += '<p class="lex-note">' + e(res.note) + "</p>";

    const seen = new Set();
    const forms = res.forms.filter((f) => !seen.has(f.text) && seen.add(f.text));
    if (forms.length) {
      html += '<ul class="lex-forms">' + forms.map((f) => "<li>" + e(f.text.replace(/ des (Verbs|Substantivs|Adjektivs|Pronomens) /, " von ")) + "</li>").join("") + "</ul>";
    }

    const shown = new Set();
    res.entries.forEach((en) => {
      const key = en.title + "|" + en.head + "|" + en.kind;
      if (shown.has(key)) return;
      shown.add(key);
      html += '<article class="lex-entry">' +
        '<div class="lex-head"><span class="lex-lemma">' + e(en.head) + "</span>" +
        '<span class="lex-kind">' + e([en.kind, en.genus].filter(Boolean).join(", ")) + "</span></div>" +
        '<ol class="lex-meanings">' + en.meanings.slice(0, 10).map((m) => "<li>" + e(m) + "</li>").join("") + "</ol>" +
        (en.flex ? '<div class="lex-actions"><button type="button" class="btn btn-secondary lex-btn" data-flex="' + e(en.flex) + '" data-title="' + e(en.title) + '"' +
          (en.verb ? ' data-verb="1"' : "") + ">Formen anzeigen</button></div><div class=\"lex-table\"></div>" : "") +
        "</article>";
    });

    if (!res.entries.length && res.english.length) {
      html += '<article class="lex-entry"><div class="lex-head"><span class="lex-lemma">' + e(forms.length ? res.forms[0].lemma : w) + "</span>" +
        '<span class="lex-kind">nur auf Englisch gefunden</span></div><ol class="lex-meanings">' +
        res.english.slice(0, 8).map((m) => "<li>" + e(m.text) + "</li>").join("") + "</ol></article>";
    }

    if (!res.entries.length && !res.english.length) {
      html += '<div class="notice"><strong>' + (forms.length ? "Grundform nicht gefunden." : "Nicht gefunden.") + "</strong>" +
        "Prüfe die Schreibweise. Eigennamen und seltene Formen fehlen manchmal.</div>";
    }
    return html + moreLinks(w) + '<p class="lex-src">Quelle: Wiktionary</p>';
  }

  // "Formen anzeigen": the table from Wiktionary; for verbs then "Alle Formen".
  function onResultClick(e) {
    const btn = e.target.closest(".lex-btn");
    if (!btn) return;
    const box = btn.parentElement.nextElementSibling;
    const all = btn.dataset.all === "1";
    btn.disabled = true;
    btn.textContent = "Lädt …";
    const url = all
      ? DE_API + "action=parse&prop=text&disablelimitreport=1&page=" + encodeURIComponent("Flexion:" + btn.dataset.title)
      : DE_API + "action=parse&prop=text&disablelimitreport=1&contentmodel=wikitext&title=" + encodeURIComponent(btn.dataset.title) +
        "&text=" + encodeURIComponent(btn.dataset.flex);
    getJSON(url).then((d) => {
      const tables = d.parse ? cleanTables(d.parse.text, all) : "";
      if (!tables) throw new Error("no table");
      box.innerHTML = tables;
      if (btn.dataset.verb && !all) {
        btn.dataset.all = "1";
        btn.disabled = false;
        btn.textContent = "Alle Formen anzeigen";
      } else {
        btn.parentElement.remove();
      }
    }).catch(() => {
      btn.disabled = false;
      btn.textContent = all ? "Alle Formen anzeigen" : "Formen anzeigen";
      box.innerHTML = '<p class="lex-note">Die Formen konnten nicht geladen werden.</p>';
    });
  }

  // Keep only the tables from Wiktionary's HTML, as plain text cells.
  // A "Flexion:" page can hold several languages (amare is also Italian): then only the Latin part.
  function cleanTables(html, onlyLatin) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("style, script, sup, .mw-editsection, img").forEach((n) => n.remove());
    const keep = { TABLE: 1, TBODY: 1, THEAD: 1, TR: 1, TH: 1, TD: 1, CAPTION: 1 };
    function copy(node) {
      if (node.nodeType === 3) return h.esc(node.textContent);
      if (node.nodeType !== 1) return "";
      const inner = [...node.childNodes].map(copy).join("");
      if (node.tagName === "BR") return "<br>";
      if (!keep[node.tagName]) return inner;
      let attrs = "";
      ["colspan", "rowspan"].forEach((a) => { if (node.getAttribute(a)) attrs += " " + a + '="' + h.esc(node.getAttribute(a)) + '"'; });
      return "<" + node.tagName.toLowerCase() + attrs + ">" + inner + "</" + node.tagName.toLowerCase() + ">";
    }
    let tables = [...doc.querySelectorAll("table")].filter((t) => !t.parentElement.closest("table"));
    const heads = [...doc.querySelectorAll("h2")];
    if (onlyLatin && heads.length) {
      const start = heads.find((x) => /\(Latein\)/.test(x.textContent));
      if (!start) return "";
      const end = heads[heads.indexOf(start) + 1];
      const after = (a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
      tables = tables.filter((t) => after(start, t) && (!end || after(t, end)));
    }
    return tables.map((t) => '<div class="lex-scroll">' + copy(t) + "</div>").join("");
  }
})();
