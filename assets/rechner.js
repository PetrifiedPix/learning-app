/*
  Taschenrechner for the tools panel. Loaded by assets/app.js, which calls Rechner.mount(root, h).
  You can type (2,5·3, 2π, sin(30), √(2), 3^2, 5!) or use the keys. Decimal comma or point both work.
  The calculation is read by a small parser below (no eval), with "Punkt vor Strich",
  powers before signs (-2^2 = -4) and multiplication without a sign (2π, 3(4+1)).
*/
(function () {
  "use strict";

  const KEYS = [
    // [label, what it types (or an action), 2nd-function label, 2nd-function text, class]
    ["sin", "sin(", "sin⁻¹", "sin⁻¹(", "fn"], ["cos", "cos(", "cos⁻¹", "cos⁻¹(", "fn"], ["tan", "tan(", "tan⁻¹", "tan⁻¹(", "fn"],
    ["(", "("], [")", ")"],
    ["log", "log(", "10ˣ", "10^(", "fn"], ["ln", "ln(", "eˣ", "e^(", "fn"], ["√", "√(", "∛", "∛(", "fn"],
    ["xʸ", "^", "", "", "fn"], ["x²", "²", "x³", "³", "fn"],
    ["7", "7"], ["8", "8"], ["9", "9"], ["÷", "÷", "", "", "op"], ["AC", "@clear", "", "", "warn"],
    ["4", "4"], ["5", "5"], ["6", "6"], ["×", "×", "", "", "op"], ["⌫", "@back", "", "", "fn"],
    ["1", "1"], ["2", "2"], ["3", "3"], ["−", "−", "", "", "op"], ["π", "π", "e", "e", "fn"],
    ["0", "0"], [",", ","], ["Ans", "Ans", "n!", "!", "fn"], ["+", "+", "", "", "op"], ["=", "@equals", "", "", "eq"],
  ];

  window.Rechner = {
    mount(root, h) {
      const saved = h.store.get("rechner");
      let deg = saved.rad ? false : true;
      let second = false;
      let ans = typeof saved.ans === "number" ? saved.ans : 0;
      let history = saved.history || [];
      let justDone = false;

      root.innerHTML =
        '<div class="calc">' +
        '<div class="calc-screen">' +
        '<input class="calc-input" type="text" inputmode="none" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Rechnung" placeholder="0">' +
        '<output class="calc-result" aria-live="polite"></output></div>' +
        '<div class="calc-modes"><div class="seg calc-angle" role="group" aria-label="Winkel">' +
        '<button type="button" data-angle="deg">DEG</button><button type="button" data-angle="rad">RAD</button></div>' +
        '<button type="button" class="calc-2nd" aria-pressed="false">2nd</button></div>' +
        '<div class="calc-keys">' + KEYS.map((k, i) =>
          '<button type="button" class="ck' + (k[4] ? " ck-" + k[4] : "") + '" data-k="' + i + '">' + k[0] + "</button>").join("") + "</div>" +
        '<div class="calc-history"></div></div>';

      const input = root.querySelector(".calc-input");
      const result = root.querySelector(".calc-result");
      const histBox = root.querySelector(".calc-history");
      const secondBtn = root.querySelector(".calc-2nd");

      function save() {
        h.store.update("rechner", (v) => { v.rad = !deg; v.ans = ans; v.history = history; });
      }
      function setAngle(d) {
        deg = d;
        root.querySelectorAll("[data-angle]").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.angle === "deg") === deg)));
        save();
        preview();
      }
      function setSecond(on) {
        second = on;
        secondBtn.setAttribute("aria-pressed", String(on));
        root.querySelectorAll(".ck").forEach((b) => {
          const k = KEYS[b.dataset.k];
          b.textContent = on && k[2] ? k[2] : k[0];
        });
      }
      function showHistory() {
        histBox.innerHTML = history.length ? '<div class="calc-hist-head"><span class="foot-label">Verlauf</span>' +
          '<button type="button" class="calc-hist-clear">Löschen</button></div><ul>' +
          history.map((x, i) => '<li><button type="button" data-h="' + i + '"><span class="calc-h-expr">' + h.esc(x[0]) +
            '</span><span class="calc-h-res">= ' + h.esc(x[1]) + "</span></button></li>").join("") + "</ul>" : "";
      }

      function insert(text) {
        if (justDone) {
          // After "=": a number starts fresh, an operator goes on with the result.
          if (/^[+×÷−^²³!]/.test(text)) input.value = "Ans";
          else input.value = "";
          justDone = false;
        }
        const a = input.selectionStart == null ? input.value.length : input.selectionStart;
        const b = input.selectionEnd == null ? a : input.selectionEnd;
        input.value = input.value.slice(0, a) + text + input.value.slice(b);
        const pos = a + text.length;
        input.setSelectionRange(pos, pos);
        preview();
      }

      function calc(text) {
        return evaluate(text, { deg, ans });
      }
      function preview() {
        const t = input.value.trim();
        result.classList.remove("bad", "final");
        if (!t || /^-?[\d.,]+$/.test(t)) { result.textContent = ""; return; }
        try { result.textContent = "= " + format(calc(t)); } catch (e) { result.textContent = ""; }
      }
      function equals() {
        const t = input.value.trim();
        if (!t) return;
        try {
          const v = calc(t);
          const shown = format(v);
          ans = v;
          history = [[t, shown]].concat(history.filter((x) => x[0] !== t)).slice(0, 12);
          save();
          showHistory();
          result.textContent = t + " =";
          result.classList.add("final");
          input.value = shown;
          justDone = true;
        } catch (e) {
          result.textContent = e.message || "Fehler";
          result.classList.add("bad");
        }
        input.setSelectionRange(input.value.length, input.value.length);
      }

      root.querySelector(".calc-keys").addEventListener("click", (e) => {
        const b = e.target.closest(".ck");
        if (!b) return;
        const k = KEYS[b.dataset.k];
        const text = second && k[3] ? k[3] : k[1];
        if (second) setSecond(false);
        if (text === "@clear") { input.value = ""; justDone = false; preview(); }
        else if (text === "@back") {
          justDone = false;
          const a = input.selectionStart, z = input.selectionEnd;
          if (a !== z) input.value = input.value.slice(0, a) + input.value.slice(z);
          else if (a > 0) {
            // Remove a whole function name like "sin(" at once.
            const m = input.value.slice(0, a).match(/(sin⁻¹\(|cos⁻¹\(|tan⁻¹\(|sin\(|cos\(|tan\(|log\(|ln\(|Ans|.)$/u);
            const cut = m ? m[0].length : 1;
            input.value = input.value.slice(0, a - cut) + input.value.slice(a);
            input.setSelectionRange(a - cut, a - cut);
          }
          preview();
        } else if (text === "@equals") equals();
        else insert(text);
        if (h.fine) input.focus();
      });
      input.addEventListener("input", () => { justDone = false; preview(); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); }
        else if (justDone && e.key.length === 1) {
          e.preventDefault();
          insert({ "*": "×", "/": "÷", "-": "−" }[e.key] || e.key);
        }
      });
      root.querySelectorAll("[data-angle]").forEach((b) => b.addEventListener("click", () => setAngle(b.dataset.angle === "deg")));
      secondBtn.addEventListener("click", () => setSecond(!second));
      histBox.addEventListener("click", (e) => {
        if (e.target.closest(".calc-hist-clear")) { history = []; save(); showHistory(); return; }
        const item = e.target.closest("[data-h]");
        if (item) insert(history[item.dataset.h][1]);
      });

      setAngle(deg);
      showHistory();
      if (h.fine) input.focus();
    },
  };

  // ---------- Showing numbers: German style, 12 digits at most ----------
  function format(v) {
    if (!isFinite(v)) throw new Error("Nicht definiert");
    if (Math.abs(v) < 1e-12) v = 0;
    let s = String(parseFloat(v.toPrecision(12)));
    const m = s.match(/^(-?[\d.]+)e([+-]\d+)$/);
    if (m) s = m[1] + " · 10^" + Number(m[2]);
    return s.replace(".", ",");
  }

  // ---------- Reading a calculation ----------
  const FUNCS = {
    "sin": (x, o) => Math.sin(o.deg ? x * Math.PI / 180 : x),
    "cos": (x, o) => Math.cos(o.deg ? x * Math.PI / 180 : x),
    "tan": (x, o) => {
      if (o.deg && Math.abs((((x % 180) + 180) % 180) - 90) < 1e-9) return NaN;
      return Math.tan(o.deg ? x * Math.PI / 180 : x);
    },
    "sin⁻¹": (x, o) => Math.asin(x) * (o.deg ? 180 / Math.PI : 1),
    "cos⁻¹": (x, o) => Math.acos(x) * (o.deg ? 180 / Math.PI : 1),
    "tan⁻¹": (x, o) => Math.atan(x) * (o.deg ? 180 / Math.PI : 1),
    "log": (x) => Math.log10(x),
    "ln": (x) => Math.log(x),
    "√": (x) => Math.sqrt(x),
    "∛": (x) => Math.cbrt(x),
    "abs": (x) => Math.abs(x),
  };
  FUNCS.asin = FUNCS["sin⁻¹"]; FUNCS.acos = FUNCS["cos⁻¹"]; FUNCS.atan = FUNCS["tan⁻¹"];
  FUNCS.sqrt = FUNCS["√"]; FUNCS.lg = FUNCS.log;

  function tokenize(text) {
    const src = text.replace(/\s+/g, "").replace(/[*·⋅]/g, "×").replace(/[/:]/g, "÷").replace(/[-–]/g, "−");
    const out = [];
    let i = 0;
    while (i < src.length) {
      const rest = src.slice(i);
      let m;
      if ((m = rest.match(/^(\d+[.,]?\d*|[.,]\d+)/))) {
        out.push({ t: "num", v: parseFloat(m[0].replace(",", ".")) });
      } else if ((m = rest.match(/^(sin⁻¹|cos⁻¹|tan⁻¹|asin|acos|atan|sin|cos|tan|log|lg|ln|sqrt|abs|√|∛)/))) {
        if (!FUNCS[m[0]]) throw new Error("Unbekannt: " + m[0]);
        out.push({ t: "fn", v: m[0] });
      } else if ((m = rest.match(/^(Ans|ans|π|pi|e)/))) {
        out.push({ t: "num", v: m[0] === "e" ? Math.E : /^a/i.test(m[0]) ? null : Math.PI, ans: /^a/i.test(m[0]) });
      } else if ((m = rest.match(/^[+−×÷^()!²³%]/))) {
        out.push({ t: "op", v: m[0] });
      } else {
        throw new Error("Unbekanntes Zeichen: " + rest[0]);
      }
      i += m[0].length;
    }
    return out;
  }

  function evaluate(text, o) {
    const tk = tokenize(text);
    let p = 0;
    const peek = () => tk[p];
    const isOp = (v) => tk[p] && tk[p].t === "op" && tk[p].v === v;
    const startsValue = () => tk[p] && (tk[p].t === "num" || tk[p].t === "fn" || (tk[p].t === "op" && tk[p].v === "("));

    function expr() {
      let v = term();
      while (isOp("+") || isOp("−")) {
        const op = tk[p++].v;
        const r = term();
        v = op === "+" ? v + r : v - r;
      }
      return v;
    }
    function term() {
      let v = unary();
      for (;;) {
        if (isOp("×")) { p++; v *= unary(); }
        else if (isOp("÷")) { p++; const r = unary(); if (r === 0) throw new Error("Teilen durch 0 geht nicht"); v /= r; }
        else if (startsValue()) v *= power(); // 2π, 3(4+1), 2sin(30)
        else return v;
      }
    }
    function unary() {
      if (isOp("−")) { p++; return -unary(); }
      if (isOp("+")) { p++; return unary(); }
      return power();
    }
    function power() {
      const base = postfix();
      if (isOp("^")) { p++; return Math.pow(base, unary()); }
      return base;
    }
    function postfix() {
      let v = primary();
      for (;;) {
        if (isOp("!")) { p++; v = fact(v); }
        else if (isOp("²")) { p++; v = v * v; }
        else if (isOp("³")) { p++; v = v * v * v; }
        else if (isOp("%")) { p++; v = v / 100; }
        else return v;
      }
    }
    function primary() {
      const t = peek();
      if (!t) throw new Error("Da fehlt noch etwas");
      if (t.t === "num") { p++; return t.ans ? o.ans : t.v; }
      if (t.t === "fn") {
        p++;
        const x = isOp("(") ? primary() : postfix();
        return FUNCS[t.v](x, o);
      }
      if (isOp("(")) {
        p++;
        const v = expr();
        if (isOp(")")) p++;
        else if (p < tk.length) throw new Error("Klammer fehlt");
        return v;
      }
      throw new Error("Da fehlt noch etwas");
    }
    function fact(n) {
      if (n < 0 || n !== Math.floor(n)) throw new Error("n! nur für ganze Zahlen ab 0");
      if (n > 170) return Infinity;
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    }

    const v = expr();
    if (p < tk.length) throw new Error(isOp(")") ? "Zu viele Klammern zu" : "Das kann ich nicht rechnen");
    if (Number.isNaN(v)) throw new Error("Nicht definiert");
    return v;
  }
  window.Rechner.evaluate = evaluate;
})();
