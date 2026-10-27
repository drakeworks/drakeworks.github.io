/* =========================================================================
   CONTENT — what the scripts need: contact details, the case index the chat
   cites and the written interview answers. DRAFT for review: the interview
   room is off (CHAT_OPTIONS.enabled in chat-options.ts) until its answers are
   written in round 2.
   ========================================================================= */
import { CHAT_OPTIONS } from "./chat-options";
import { CASE_OPTIONS } from "./case-options";
import { PHASES as PHASE_BOXES, PRODUCTS } from "./platform-phases";

const PX = {
  name: "Drake", first: "Drake", initials: "DK",
  email: "",        // no published address: contact goes through the form (DEC-13)
  resumeUrl: "",    // résumé button off for now
  linkedinUrl: "https://www.linkedin.com/in/drakekutz"
};

const GROUPS = ["Strategy", "Execution", "Leadership", "Fit"];

// The question each case study's "Ask about this case" block leads with.
const ASK_FOR = { 1: "zero", 2: "eng", 3: "measure" };

// Small talk the chat answers when no written answer matches (round 2).
const INTENTS = [];

// Case studies the chat cites as sources (headline result in "m").
const CASES = [
  { id: 1, type: "Build and scale", title: "From a one-line brief to a payments platform", m: "Payment costs −68%, clients 2 → ~20, volume millions → $1B+" },
  { id: 2, type: "Platform design", title: "One API for every payment provider", m: "Providers 3 → 40+, integrations per team 1" },
  ...(CASE_OPTIONS.walletCase ? [{ id: 3, type: "Customer-led", title: "A turnkey wallet, built on our own gateway", m: "Clients 1 → 3, identity checks 24–48 h → instant" }] : [])
];

// The written answers come in round 2. Each: { id, g, q, kw, ev, next, a }.
const QA = [];

(function () {
  "use strict";
  const doc = document, root = doc.documentElement;
  const $ = (s, c = doc) => c.querySelector(s);
  const $$ = (s, c = doc) => Array.from(c.querySelectorAll(s));
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("on");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("on"), 3200);
  }

  /* =========================================================================
     VIEWS AND ROUTING — home, the four case studies and about are views in
     one document. Each has a real hash (#case-1, #about, #work, #a1-context),
     so Back, Forward, reloads and shared links land in the right place.
     ========================================================================= */
  const views = $$("[data-view]");
  const navHooks = [], popHooks = [];   // the interview room closes itself around page navigation
  let current = null, started = false;
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  // A hash as an element id. A malformed escape (say, a truncated shared link) is used as typed.
  function hashId(hash) {
    const raw = String(hash || "").replace(/^#/, "");
    try { return decodeURIComponent(raw); } catch (_) { return raw; }
  }

  // A hash names a view (#case-1), an anchor inside a view (#work) or nothing (home).
  function resolve(hash) {
    const id = hashId(hash);
    if (!id) return { view: "home", anchor: null };
    if ($(`[data-view="${CSS.escape(id)}"]`)) return { view: id, anchor: null };
    const el = doc.getElementById(id), view = el && el.closest("[data-view]");
    return view ? { view: view.dataset.view, anchor: id } : { view: "home", anchor: null };
  }

  function markNav(view) {
    const isCase = view.startsWith("case");
    $$("[data-nav] [data-go]").forEach((a) => {
      const g = a.dataset.go;
      const on = (g === view && !a.hasAttribute("data-anchor")) || (isCase && a.hasAttribute("data-work"));
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  }

  function closeMenu() {
    root.classList.remove("nav-open");
    $$("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  function focusHeading(view) {
    const h = view.querySelector("h1, h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }

  function show(view, opts = {}) {
    const target = $(`[data-view="${CSS.escape(view)}"]`) || $('[data-view="home"]');
    views.forEach((v) => { v.hidden = v !== target; });
    current = target.dataset.view;
    root.dataset.current = current.startsWith("case") ? "case" : current;
    root.dataset.viewId = current;
    markNav(current);
    closeMenu();
    if (opts.anchor) {
      const el = doc.getElementById(opts.anchor);
      if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 0);
    } else {
      window.scrollTo(0, opts.y || 0);
      if (started) focusHeading(target);
    }
    doc.dispatchEvent(new CustomEvent("viewchange", { detail: current }));
  }

  function navigate(view, anchor) {
    const chatEntry = !!(history.state && history.state.ij);   // the full-screen chat's own entry
    navHooks.forEach((f) => f());
    const hash = "#" + (anchor || view);
    // Same view, or leaving the chat: reuse the current entry (the entry under the
    // chat already holds the scroll position). Otherwise add one, noting where we were.
    if (view === current || chatEntry) history.replaceState({ y: null }, "", hash);
    else {
      history.replaceState({ y: window.scrollY }, "");   // so Back returns to the same place
      history.pushState({ y: null }, "", hash);
    }
    show(view, { anchor });
  }

  // Plain in-page links (contents rail, skip link): scroll within the view.
  function jump(id) {
    const el = doc.getElementById(id);
    if (!el) return;
    const view = el.closest("[data-view]");
    if (view && view.dataset.view !== current) { navigate(view.dataset.view, id); return; }
    el.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    closeMenu();
    if (view) history.replaceState({ y: null }, "", "#" + id);
  }

  doc.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const t = e.target;
    if (!t.closest) return;
    const g = t.closest("[data-go]");
    if (g) { e.preventDefault(); navigate(g.dataset.go, g.dataset.anchor || null); return; }
    const m = t.closest("[data-menu]");
    if (m) {
      const open = !root.classList.contains("nav-open");
      root.classList.toggle("nav-open", open);
      m.setAttribute("aria-expanded", String(open));
      return;
    }
    const a = t.closest('a[href^="#"]');
    if (a && a.getAttribute("href").length > 1) { e.preventDefault(); jump(hashId(a.getAttribute("href"))); }
  });
  doc.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  addEventListener("popstate", (e) => {
    if (popHooks.some((f) => f(e.state))) return;
    const r = resolve(location.hash), y = e.state && typeof e.state.y === "number" ? e.state.y : null;
    show(r.view, { anchor: y === null ? r.anchor : null, y });
  });

  /* ---------- Résumé and LinkedIn: real links once set in PX, a prototype message until then ---------- */
  const LINKS = { resume: PX.resumeUrl, linkedin: PX.linkedinUrl };
  $$("a[data-link]").forEach((a) => {
    const url = LINKS[a.dataset.link];
    if (url) { a.href = url; a.target = "_blank"; a.rel = "noopener"; }
  });
  doc.addEventListener("click", (e) => {
    const c = e.target.closest && e.target.closest("[data-cta]");
    if (!c) return;
    const url = LINKS[c.dataset.link];
    if (url) {
      if (c.getAttribute("href") !== url) { e.preventDefault(); window.open(url, "_blank", "noopener"); }
      return;
    }
    e.preventDefault();
    toast(c.dataset.cta);
  });

  /* ---------- Copy to clipboard ---------- */
  doc.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("[data-copy]");
    if (!b) return;
    e.preventDefault();
    const text = b.dataset.copy;
    const fallback = () => {
      try {
        const i = doc.createElement("textarea");
        i.value = text; i.setAttribute("readonly", ""); i.style.position = "fixed"; i.style.opacity = "0";
        doc.body.appendChild(i); i.select();
        const ok = doc.execCommand("copy");
        i.remove();
        return ok;
      } catch (_) { return false; }
    };
    const done = (ok) => {
      toast(ok ? b.dataset.copyToast || "Copied " + text : b.dataset.copyFail || "Copy this address: " + text);
      const l = $(".cl", b);
      if (l && ok) {
        if (!l.dataset.label) l.dataset.label = l.textContent;   // the label to return to, even after quick repeat clicks
        l.textContent = "Copied";
        clearTimeout(l._t);
        l._t = setTimeout(() => { l.textContent = l.dataset.label; }, 1600);
      }
    };
    try { navigator.clipboard.writeText(text).then(() => done(true), () => done(fallback())); } catch (_) { done(fallback()); }
  });

  /* =========================================================================
     COMMAND MENU (⌘K) — searches pages, case studies and actions.
     ========================================================================= */
  (function commandMenu() {
    const ck = $("#cmdk");
    if (!ck) return;
    const input = $("#cmdkIn"), list = $("#cmdkList"), empty = $("#cmdkEmpty");
    const items = $$('[role="option"]', list), heads = $$(".ck-g", list);
    let idx = 0, last = null;
    const visible = () => items.filter((i) => !i.hidden);
    function mark() {
      const v = visible(), c = v[idx];
      items.forEach((it) => it.setAttribute("aria-selected", "false"));
      if (c) { c.setAttribute("aria-selected", "true"); input.setAttribute("aria-activedescendant", c.id); c.scrollIntoView({ block: "nearest" }); }
      else input.removeAttribute("aria-activedescendant");
      empty.hidden = v.length > 0;
      heads.forEach((g) => { g.hidden = !items.some((i) => !i.hidden && i.dataset.g === g.dataset.grp); });
    }
    function open() {
      last = doc.activeElement;
      ck.hidden = false; input.value = "";
      items.forEach((i) => { i.hidden = false; });
      idx = 0; mark();
      setTimeout(() => input.focus(), 10);
    }
    function restore() {
      if (last && last.focus && doc.contains(last)) try { last.focus({ preventScroll: true }); } catch (_) { /* ignore */ }
    }
    function dismiss() { if (ck.hidden) return; ck.hidden = true; restore(); }
    // After an item runs, keep focus where its action put it (a new page's heading); otherwise go back.
    function afterRun() { const a = doc.activeElement; if (!a || a === doc.body || ck.contains(a)) restore(); }
    doc.addEventListener("keydown", (e) => {
      if (doc.querySelector("dialog[open]")) return;   // a modal dialog (the contact form) makes the menu inert, so leave its keys alone
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); if (ck.hidden) open(); else dismiss(); return; }
      if (ck.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); dismiss(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(visible().length - 1, idx + 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); mark(); }
      else if (e.key === "Enter") { e.preventDefault(); const c = visible()[idx]; if (c) { ck.hidden = true; c.click(); afterRun(); } }
      else if (e.key === "Tab") { e.preventDefault(); input.focus(); }
    });
    input.addEventListener("input", () => {
      const q = input.value.toLowerCase().trim();
      items.forEach((i) => { i.hidden = !!q && !i.textContent.toLowerCase().includes(q); });
      idx = 0; mark();
    });
    doc.addEventListener("click", (e) => {
      if (!e.target.closest) return;
      if (e.target.closest("[data-cmdk-open]")) { e.preventDefault(); open(); return; }
      if (e.target === ck) { dismiss(); return; }
      if (e.target.closest("#cmdkList [role=option]")) { ck.hidden = true; afterRun(); }
    });
    list.addEventListener("mousemove", (e) => {
      const o = e.target.closest('[role="option"]');
      if (!o) return;
      const k = visible().indexOf(o);
      if (k > -1 && k !== idx) { idx = k; mark(); }
    });
  })();

  /* ---------- Cursor-following borders on cards ---------- */
  doc.addEventListener("pointermove", (e) => {
    const s = e.target.closest && e.target.closest("[data-spot]");
    if (!s) return;
    const r = s.getBoundingClientRect();
    s.style.setProperty("--mx", e.clientX - r.left + "px");
    s.style.setProperty("--my", e.clientY - r.top + "px");
  }, { passive: true });

  /* ---------- Numbers band: rises in and counts up every time it comes into view ----------
     The figures rise in one after another, and each [data-to] counts up from data-from (or 0). The band resets
     only once it's fully out of view, so the reset is never seen; a hidden view counts as out of view, so
     coming back to the homepage replays it too. The markup holds the final numbers, which is what shows without
     IntersectionObserver or with reduced motion. */
  (function numbers() {
    const band = $(".nums");
    if (!band || !("IntersectionObserver" in window) || reduceMotion.matches) return;
    const nums = $$("[data-to]", band);
    let raf = 0, played = false;
    const set = (k) => nums.forEach((el) => {
      const from = +(el.dataset.from || 0), to = +el.dataset.to;
      el.textContent = Math.round(from + (to - from) * k);
    });
    const reset = () => { cancelAnimationFrame(raf); band.classList.remove("is-play"); set(0); };
    const play = () => {
      reset();
      void band.offsetWidth;   // restart the rise animations
      band.classList.add("is-play");
      let t0 = 0;
      const step = (t) => {
        if (!t0) t0 = t;
        const p = Math.min(1, (t - t0) / 1200);
        set(1 - Math.pow(1 - p, 3));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    band.classList.add("is-armed");
    reset();
    new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) { if (played) { played = false; reset(); } return; }
      if (!played && e.intersectionRatio >= 0.4) { played = true; play(); }
    }), { threshold: [0, 0.4, 1] }).observe(band);
  })();

  /* ---------- Case pages: the contents rail follows the section in view ---------- */
  (function contentsRail() {
    let io;
    function setup() {
      if (io) io.disconnect();
      const v = $("[data-view]:not([hidden])");
      if (!v || !("IntersectionObserver" in window)) return;
      const links = $$(".toc a", v);
      if (!links.length) return;
      io = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => {
          const on = l.getAttribute("href") === "#" + e.target.id;
          l.classList.toggle("on", on);
          if (on) l.setAttribute("aria-current", "location"); else l.removeAttribute("aria-current");
        });
      }), { rootMargin: "-10% 0px -75% 0px" });
      $$("[data-sec]", v).forEach((s) => io.observe(s));
    }
    doc.addEventListener("viewchange", () => setTimeout(setup, 30));
  })();

  /* =========================================================================
     INTERVIEW ROOM — the chat widget. Every answer is written in advance
     (QA above); a typed question is matched to the closest one and the reply
     says which. Modes: closed (launcher) → compact (panel in the corner, page
     still usable) → expanded (full-screen chat app). Phones and short screens
     use "sheet", a full-screen panel. Expanded and sheet block the page.
     ========================================================================= */
  (function interviewRoom() {
    const ij = $("#ij");
    if (!ij || !CHAT_OPTIONS.enabled) return;   // feature flag: off until the answers are written, and its markup isn't rendered
    /* ---------- Matching a typed question to a written answer ----------
       Deterministic and explainable: keywords count only at the start of a word
       (so "skills" doesn't match "kill"), longer keywords score higher, and words
       shared with the question break ties. Nothing is generated. */
    const STOP = new Set(("about also been could does doing from have into just like make made many more most much over should some tell than that them then there they this those were what when where which while will with would your yours you").split(" "));
    const norm = (s) => " " + String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/['’‘`]/g, "").replace(/[^a-z0-9]+/g, " ").trim() + " ";
    const words = (s) => norm(s).trim();
    const keyWords = (s) => words(s).split(" ").filter((w) => w.length > 3 && !STOP.has(w));
    // Normalised once: each answer's keywords and question words, and the small-talk phrases.
    const ANSWERS = QA.map((q) => ({ id: q.id, kw: q.kw.map(words), qw: keyWords(q.q) }));
    const TALK = INTENTS.map((i) => ({ intent: i, words: i.words.map(words), exact: (i.exact || []).map(words) }));

    function score(m, t) {
      let s = 0;
      m.kw.forEach((k) => { if (t.includes(" " + k)) s += k.length; });   // keyword at the start of a word
      m.qw.forEach((w) => { if (t.includes(" " + w + " ")) s += 1; });   // a whole word from the question
      return s;
    }

    // Returns { kind: "answer", id } | { kind: "maybe", ids } | { kind: "intent", intent } | { kind: "fallback" }
    function match(text) {
      const t = norm(text);
      const [a, b] = ANSWERS.map((m) => ({ id: m.id, s: score(m, t) })).sort((x, y) => y.s - x.s);
      if (a.s >= 3) return b.s >= 3 && a.s - b.s <= 1 ? { kind: "maybe", ids: [a.id, b.id] } : { kind: "answer", id: a.id };
      const talk = TALK.find((p) => p.words.some((w) => t.includes(" " + w + " ")) || p.exact.includes(t.trim()));
      return talk ? { kind: "intent", intent: talk.intent } : { kind: "fallback" };
    }

    const panel = $("#ijPanel"), launch = $("#ijLaunch"), log = $("#ijLog"), all = $("#ijAll"),
      scroller = $("#ijScroll"), sugg = $("#ijSugg"), form = $("#ijForm"), input = $("#ijInput"),
      sendBtn = $("#ijSend"), title = $("#ijTitle"), expandBtn = $("#ijExpand"),
      nudge = $("#ijNudge"), announcer = $("#ijAnnounce");
    const backdrop = [$(".skip"), $(".nav"), $("main"), $(".foot")].filter(Boolean);
    const sheetMQ = matchMedia("(max-width: 640px), (max-height: 560px)");
    const phoneMQ = matchMedia("(max-width: 640px)");
    const coarse = matchMedia("(pointer: coarse)");
    const byId = Object.fromEntries(QA.map((q) => [q.id, q]));
    const asked = new Set();
    let mode = "closed", context = null, typing = null, lockY = 0;
    let lastInput = "pointer", expectPop = false;
    let nudgeDone = false, nudgeWait = 0, nudgeTimer = 0, nudgeIO = null;

    /* ---------- Building blocks ---------- */
    const fill = (html) => html.split("{email}").join(PX.email);
    const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const chip = (id) => `<button class="ij-chip${asked.has(id) ? " is-used" : ""}" type="button" data-ask="${id}">${byId[id].q}</button>`;
    const source = (n, i) => {
      const c = CASES[n - 1];
      return `<a class="ij-src" href="#case-${c.id}" data-go="case-${c.id}"><i>${i + 1}</i><span>${c.type}</span><b>${c.title}</b><em>${c.m}</em></a>`;
    };
    const sources = (ev) => (ev.length ? `<div class="ij-srcs"><p>Sources</p>${ev.map(source).join("")}</div>` : "");
    const copyEmail = () => `<p class="ij-acts"><button class="btn sm" type="button" data-copy="${PX.email}"><span class="cl">Copy ${PX.email}</span></button></p>`;
    const COPY_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5v-2a1 1 0 00-1-1h-6a1 1 0 00-1 1v6a1 1 0 001 1h2"/></svg>';

    // Plain text of an answer, for Copy and for screen readers.
    function plain(text) {
      return Array.from(text.children).map((n) => {
        const c = n.cloneNode(true);
        $$("cite", c).forEach((x) => x.prepend(" — "));
        $$("button, .btn", c).forEach((x) => x.remove());
        return c.textContent.trim();
      }).filter(Boolean).join("\n\n");
    }

    function announce(msg) {
      announcer.textContent = "";
      setTimeout(() => { announcer.textContent = msg; }, 60);
    }

    /* ---------- Empty state and suggestions ---------- */
    // One starter per topic; on a case page that case's question comes first.
    function starters() {
      const s = ["tradeoff", "zero", "buyin", "next"];
      if (context) {
        const id = ASK_FOR[context];
        s.splice(s.findIndex((x) => byId[x].g === byId[id].g), 1);
        s.unshift(id);
      }
      return s;
    }

    function renderWelcome() {
      const s = starters();
      log.classList.add("is-empty");
      log.innerHTML = `<div class="ij-hello"><span class="ij-av lg" aria-hidden="true">${PX.initials}</span>
        <h3>What would you like to know?</h3>
        <p>Ten questions hiring panels usually ask, answered in advance by ${PX.first}, with the evidence attached.</p>
        <div class="ij-cards">${s.map((id) => `<button class="ij-card" type="button" data-ask="${id}" data-spot><span>${byId[id].g}</span><b>${byId[id].q}</b></button>`).join("")}</div></div>
        <div class="ij-msg ij-jh ij-intro"><span class="ij-av" aria-hidden="true">${PX.initials}</span><div class="ij-body">
          <p class="ij-by">${PX.first}</p>
          <div class="ij-text"><p>Hi, I’m ${PX.first}. Hiring panels tend to ask the same few questions, so I’ve answered them here in my own words, with the evidence attached.</p><p>Pick one, or type your own and I’ll find my closest written answer.</p></div>
          <div class="ij-starters">${s.map(chip).join("")}<button class="ij-more" type="button" data-ij="seeall">See all ten questions</button></div>
          <div class="ij-groups">${GROUPS.map((g) => `<div><p>${g}</p>${QA.filter((q) => q.g === g).map((q) => chip(q.id)).join("")}</div>`).join("")}</div>
        </div></div>`;
      syncSugg();
    }

    // The first question clears the starters but keeps the greeting as the first message.
    function startConversation() {
      if (!log.classList.contains("is-empty")) return;
      $$(".ij-hello, .ij-starters, .ij-groups", log).forEach((n) => n.remove());
      log.classList.remove("is-empty");
    }

    function syncSugg() {
      sugg.hidden = log.classList.contains("is-empty") || ij.classList.contains("is-reading");
      if (sugg.hidden) return;
      const ids = starters().concat(QA.map((q) => q.id)).filter((id, i, a) => a.indexOf(id) === i && !asked.has(id));
      sugg.innerHTML = ids.map(chip).join("");
      sugg.hidden = !ids.length;
    }

    function syncAsked() {
      $$("[data-ask]", ij).forEach((b) => b.classList.toggle("is-used", asked.has(b.dataset.ask)));
      syncSugg();
    }

    /* ---------- Messages ---------- */
    function addUser(text) {
      const el = doc.createElement("div");
      el.className = "ij-msg ij-me";
      el.innerHTML = `<p>${esc(text)}</p>`;
      log.appendChild(el);
      return el;
    }

    function addReply({ id = "", by, html, ev = [], next = [], nextLabel = "Ask next", extra = "", copy = true }) {
      const el = doc.createElement("div");
      el.className = "ij-msg ij-jh";
      if (id) el.dataset.qid = id;
      el.innerHTML = `<span class="ij-av" aria-hidden="true">${PX.initials}</span><div class="ij-body">
        <p class="ij-by">${by}</p>
        <div class="ij-text">${html}</div>
        <div class="ij-after">${sources(ev)}${extra}${copy ? `<div class="ij-row"><button class="ij-mini" type="button" data-copy-answer data-copy-toast="Answer copied" data-copy-fail="Couldn’t copy. Select the text to copy it instead.">${COPY_ICON}<span class="cl">Copy answer</span></button></div>` : ""}${next.length ? `<div class="ij-next"><p>${nextLabel}</p>${next.map(chip).join("")}</div>` : ""}</div>
      </div>`;
      log.appendChild(el);
      const copyBtn = $("[data-copy-answer]", el);
      if (copyBtn) copyBtn.dataset.copy = plain($(".ij-text", el));
      return el;
    }

    // Types the written answer out word by word, finishing in under a second.
    function typeOut(el, onFrame, done) {
      const text = $(".ij-text", el), after = $(".ij-after", el);
      const end = () => { after.hidden = false; el.inert = false; done(); };
      if (reduceMotion.matches || doc.hidden) { end(); return; }
      const blocks = Array.from(text.children), nodes = [];
      const walk = doc.createTreeWalker(text, NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) nodes.push(walk.currentNode);
      const units = nodes.map((n) => ({ n, parts: n.nodeValue.match(/\S+\s*|\s+/g) || [], shown: 0, block: blocks.find((b) => b.contains(n)) }));
      const total = units.reduce((s, u) => s + u.parts.length, 0);
      const dur = Math.min(900, Math.max(300, total * 12));
      const caret = doc.createElement("span");
      caret.className = "ij-caret";
      caret.setAttribute("aria-hidden", "true");
      units.forEach((u) => { u.n.nodeValue = ""; });
      blocks.forEach((b) => { b.hidden = true; });
      after.hidden = true;
      el.inert = true;   // nothing in it can be clicked or focused until it's finished
      let t0 = 0, raf = 0, safety = 0, finished = false;
      function draw(count) {
        let left = count;
        for (const u of units) {
          const take = Math.min(left, u.parts.length);
          if (take !== u.shown) {
            u.n.nodeValue = u.parts.slice(0, take).join("");
            u.shown = take;
            if (take && u.block) u.block.hidden = false;
          }
          left -= take;
          if (take < u.parts.length) { if (take) u.n.after(caret); return; }
        }
      }
      function finish() {
        if (finished) return;
        finished = true;
        cancelAnimationFrame(raf);
        clearTimeout(safety);
        units.forEach((u) => { u.n.nodeValue = u.parts.join(""); });
        blocks.forEach((b) => { b.hidden = false; });
        caret.remove();
        typing = null;
        end();
      }
      function frame(t) {
        if (!t0) t0 = t;
        const p = Math.min(1, (t - t0) / dur);
        draw(Math.ceil(total * p));
        onFrame();
        if (p < 1) raf = requestAnimationFrame(frame); else finish();
      }
      typing = { finish };
      safety = setTimeout(finish, dur + 500);   // animation frames pause in background tabs
      raf = requestAnimationFrame(frame);
    }

    // The view follows the answer as it types until the question reaches the top, then stays put.
    function reply(question, opts) {
      const el = addReply(opts);
      syncAsked();
      const top = scroller.scrollTop + question.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 16;
      const follow = () => { scroller.scrollTop = top; };
      follow();
      typeOut(el, follow, () => {
        follow();
        announce(`${$(".ij-by", el).textContent}. ${plain($(".ij-text", el))}`);
      });
    }

    /* ---------- Asking ---------- */
    function ask(id, typed) {
      const q = byId[id];
      if (!q) return;
      if (typing) typing.finish();
      if (mode === "closed") open({ focus: false });
      readAll(false);
      startConversation();
      asked.add(id);
      const question = addUser(typed || q.q);
      const closest = typed && norm(typed) !== norm(q.q);
      reply(question, { id, by: closest ? `${PX.first}’s closest written answer: <q>${q.q}</q>` : `${PX.first}’s written answer`, html: fill(q.a), ev: q.ev, next: q.next });
    }

    function sendText(raw) {
      const text = raw.replace(/\s+/g, " ").trim();
      if (!text) return;
      const m = match(text);
      if (m.kind === "answer") { ask(m.id, text); return; }
      if (m.kind === "intent" && m.intent.use) { ask(m.intent.use, text); return; }
      if (typing) typing.finish();
      readAll(false);
      startConversation();
      const question = addUser(text);
      if (m.kind === "maybe") {
        reply(question, { by: "Closest written answers", html: "<p>Two of my written answers might fit. Which did you mean?</p>", next: m.ids, nextLabel: "Choose one", copy: false });
      } else if (m.kind === "intent") {
        reply(question, { by: `${PX.first}’s written answer`, html: m.intent.a, next: m.intent.next || [], extra: m.intent.email ? copyEmail() : "", copy: false });
      } else {
        reply(question, { by: "No written answer yet", html: "<p>I haven’t written an answer to that one yet. These are the closest, or email me and I’ll reply directly.</p>",
          next: ["who", "tradeoff", "next"], nextLabel: "Closest answers", extra: copyEmail(), copy: false });
      }
    }

    // After asking from a chip that has since been removed, keep focus in the chat.
    function keepFocus() {
      const a = doc.activeElement;
      if (!a || a === doc.body || !ij.contains(a)) focusIn();
    }

    function reset() {
      if (typing) typing.finish();
      asked.clear();
      if (ij.classList.contains("is-reading")) readAll(false);
      renderWelcome();
      syncAsked();
      scrollToEnd();   // an empty chat scrolls to the top
      input.value = "";
      autosize();
    }

    /* ---------- Read all answers ---------- */
    function readAll(on) {
      if (on && !all.firstChild) {
        all.innerHTML = `<div class="ij-all-head"><h3>All ten answers</h3><button class="ij-sbtn" type="button" data-ij="chat">Back to the chat</button></div>
          <p class="ij-all-note">Written by ${PX.first} in advance, grouped by topic.</p>
          ${GROUPS.map((g) => `<section class="ij-all-g"><h4>${g}</h4>${QA.filter((q) => q.g === g).map((q) => `<article class="ij-qa"><h5>${q.q}</h5><div class="ij-text">${fill(q.a)}</div>${sources(q.ev)}</article>`).join("")}</section>`).join("")}`;
      }
      if (on && typing) typing.finish();
      all.hidden = !on;
      log.hidden = on;
      ij.classList.toggle("is-reading", on);
      $$('[data-ij="all"]', ij).forEach((b) => b.setAttribute("aria-pressed", String(on)));
      syncSugg();
      if (on) scroller.scrollTop = 0; else scrollToEnd();
    }

    /* ---------- Scrolling: the start of a new chat, otherwise the latest message ---------- */
    function scrollToEnd() {
      if (ij.classList.contains("is-reading")) return;   // keep the reader's place in "Read all answers"
      scroller.scrollTop = log.classList.contains("is-empty") ? 0 : scroller.scrollHeight;
    }

    // Notes which message (or answer, in Read all) is at the top of the view, and
    // returns a function that puts it back there after the panel changes size.
    function readingPlace() {
      const items = ij.classList.contains("is-reading") ? $$(".ij-qa", all) : $$(".ij-msg", log);
      const top = () => scroller.getBoundingClientRect().top;
      const anchor = items.find((m) => m.getBoundingClientRect().bottom > top() + 1);
      if (!anchor) return null;
      const offset = anchor.getBoundingClientRect().top - top();
      return () => { scroller.scrollTop += anchor.getBoundingClientRect().top - top() - offset; };
    }

    /* ---------- Modes ---------- */
    const modal = (m) => m === "expanded" || m === "sheet";

    function launchLabel() {
      launch.setAttribute("aria-label", mode === "compact" ? "Minimise the interview room" : `Ask ${PX.first}`);
    }

    // how: "ui" (a control in the chat), "pop" (Back), "nav" (going to a page),
    // "view" (the page already changed) or "blur" (keyboard focus left the panel).
    function setMode(next, how = "ui") {
      const prev = mode;
      if (next === prev) return;
      const place = prev !== "closed" && next !== "closed" ? readingPlace() : null;   // compact ↔ expanded ↔ sheet
      mode = next;
      ij.dataset.mode = next;
      panel.hidden = next === "closed";
      root.classList.toggle("ij-open", next !== "closed");
      launch.setAttribute("aria-expanded", String(next !== "closed"));
      const big = next === "expanded";
      expandBtn.classList.toggle("is-on", big);
      expandBtn.setAttribute("aria-label", big ? "Collapse to a panel" : "Expand to full screen");
      expandBtn.title = big ? "Collapse" : "Expand";
      if (modal(next) !== modal(prev)) setModal(modal(next), how);
      if (next !== "closed") {
        if (!nudgeDone) endNudge();         // they found the chat, so no nudge this visit
        ij.classList.add("is-settled");   // the launcher's entrance animation only plays on first load
        hideNudge();
        fitSheet();
        autosize();
        if (place) place(); else scrollToEnd();
        if (prev === "closed" || modal(next) !== modal(prev)) {
          panel.classList.remove("ij-anim");
          void panel.offsetWidth;
          panel.classList.add("ij-anim");
        }
      }
      launchLabel();
    }

    // Expanded and sheet cover the page: it goes inert and stops scrolling, and a
    // history entry is added so Back closes the chat instead of leaving the page.
    function setModal(on, how) {
      backdrop.forEach((el) => { el.inert = on; });
      if (on) {
        lockY = window.scrollY;
        doc.body.style.top = `-${lockY}px`;
        doc.body.classList.add("ij-lock");
        history.replaceState({ ...history.state, y: lockY }, "");   // Back from a page opened in the chat returns here
        history.pushState({ ij: 1 }, "");
        return;
      }
      doc.body.classList.remove("ij-lock");
      doc.body.style.top = "";
      if (how !== "view") window.scrollTo(0, lockY);
      if (how === "ui" && history.state && history.state.ij) { expectPop = true; history.back(); }
    }

    function focusIn() {
      (mode === "sheet" && coarse.matches ? title : input).focus({ preventScroll: true });
    }

    function open({ expanded = false, focus = true } = {}) {
      setMode(sheetMQ.matches ? "sheet" : expanded || mode === "expanded" ? "expanded" : "compact");
      if (focus) focusIn();
    }

    function close(how = "ui") {
      if (mode === "closed") return;
      if (typing) typing.finish();
      setMode("closed", how);
      if (how === "ui" || how === "pop") launch.focus({ preventScroll: true });
    }

    function collapse() {
      if (mode !== "expanded") return;
      setMode("compact");
      expandBtn.focus({ preventScroll: true });
    }

    /* ---------- Nudge (off unless CHAT_OPTIONS.nudge): once per visit on desktop,
       after the hero or about 10 seconds ---------- */
    function hideNudge() { nudge.hidden = true; clearTimeout(nudgeTimer); }
    // Ends the nudge for this visit: it has shown, or the visitor opened the chat first.
    function endNudge() {
      nudgeDone = true;
      clearTimeout(nudgeWait);
      if (nudgeIO) nudgeIO.disconnect();
      try { sessionStorage.setItem("ij-nudged", "1"); } catch (_) { /* storage blocked: once per page load */ }
    }
    (function scheduleNudge() {
      if (!CHAT_OPTIONS.nudge) { nudgeDone = true; return; }
      try { if (sessionStorage.getItem("ij-nudged")) { nudgeDone = true; return; } } catch (_) { /* storage blocked */ }
      function fire() {
        if (nudgeDone) return;
        if (!$("#cmdk").hidden || doc.hidden) { nudgeWait = setTimeout(fire, 4000); return; }
        endNudge();
        if (phoneMQ.matches) return;   // phones: no nudge, so nothing covers the page
        nudge.hidden = false;
        nudgeTimer = setTimeout(hideNudge, 12000);
      }
      nudgeWait = setTimeout(fire, 10000);
      const hero = $(".hero");
      if (hero && "IntersectionObserver" in window) {
        nudgeIO = new IntersectionObserver((es) => {
          const r = es[0].boundingClientRect;
          if (!es[0].isIntersecting && r.height > 0 && r.bottom <= 0) { clearTimeout(nudgeWait); fire(); }
        });
        nudgeIO.observe(hero);
      }
    })();

    /* ---------- Controls ---------- */
    const actions = {
      launch: () => { if (mode === "closed") open(); else close(); },
      new: () => { reset(); focusIn(); },
      expand: () => { if (mode === "expanded") collapse(); else { setMode("expanded"); expandBtn.focus({ preventScroll: true }); } },
      collapse,
      close: () => close(),
      all: () => readAll(!ij.classList.contains("is-reading")),
      chat: () => { readAll(false); focusIn(); },
      seeall: () => { if (!sheetMQ.matches) setMode("expanded"); expandBtn.focus({ preventScroll: true }); },
      how: (b) => { const p = $("#ijHow"), on = p.hidden; p.hidden = !on; b.setAttribute("aria-expanded", String(on)); },
      nudge: () => open(),
      dismiss: () => { hideNudge(); launch.focus({ preventScroll: true }); }
    };

    ij.addEventListener("click", (e) => {
      const t = e.target;
      if (!t.closest) return;
      const act = t.closest("[data-ij]");
      if (act) { e.preventDefault(); actions[act.dataset.ij](act); return; }
      const a = t.closest("[data-ask]");
      if (a) { e.preventDefault(); ask(a.dataset.ask); keepFocus(); return; }
      // Sources and case links: close first, then the page changes. Modified clicks
      // open a new tab instead, so the chat stays as it is.
      if (t.closest("[data-go]") && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) close("nav");
    });

    // "Ask about this case" questions on the case pages.
    doc.addEventListener("click", (e) => {
      const a = !e.defaultPrevented && e.target.closest && e.target.closest("[data-ask]");
      if (!a || ij.contains(a)) return;
      e.preventDefault();
      ask(a.dataset.ask);
      focusIn();
    });

    ij.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || e.defaultPrevented || e.isComposing) return;
      e.preventDefault();
      if (nudge.contains(e.target)) actions.dismiss();
      else if (mode === "expanded") collapse();
      else close();
    });

    // The compact panel doesn't block the page; if keyboard focus moves into the
    // page, minimise it so it never hides the focused element.
    doc.addEventListener("keydown", () => { lastInput = "keyboard"; }, true);
    doc.addEventListener("pointerdown", () => { lastInput = "pointer"; }, true);
    doc.addEventListener("focusin", (e) => {
      if (mode !== "compact" || lastInput !== "keyboard" || ij.contains(e.target) || e.target.closest("#cmdk")) return;
      close("blur");
    });

    /* ---------- Composer ---------- */
    function autosize() {
      sendBtn.disabled = !input.value.trim();
      if (panel.hidden) return;   // nothing to measure until the panel is showing
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 132) + "px";
    }
    function submit() {
      const v = input.value;
      if (!v.trim()) return;
      input.value = "";
      autosize();
      sendText(v);
    }
    input.addEventListener("input", autosize);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); submit(); }
    });
    form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });

    /* ---------- Sheet: follow the visible viewport so the keyboard never covers the input ---------- */
    const vv = window.visualViewport;
    function fitSheet() {
      if (mode === "sheet" && vv) {
        panel.style.setProperty("--vvh", `${vv.height}px`);
        panel.style.setProperty("--vvt", `${vv.offsetTop}px`);
      } else {
        panel.style.removeProperty("--vvh");
        panel.style.removeProperty("--vvt");
      }
    }
    if (vv) { vv.addEventListener("resize", fitSheet); vv.addEventListener("scroll", fitSheet); }
    sheetMQ.addEventListener("change", () => {
      if (mode === "closed") return;
      if (sheetMQ.matches) setMode("sheet");
      else if (mode === "sheet") setMode("compact");
    });
    doc.addEventListener("visibilitychange", () => { if (doc.hidden && typing) typing.finish(); });

    /* ---------- Page navigation ---------- */
    navHooks.push(() => { if (modal(mode)) close("nav"); });
    popHooks.push((state) => {
      if (expectPop) { expectPop = false; return true; }    // our own history.back()
      // Entries we made carry a state; one typed in the address bar doesn't.
      const samePage = !!state && resolve(location.hash).view === current;
      if (state && state.ij) return samePage;               // an old chat entry for this page: nothing to do
      if (!modal(mode)) return false;
      if (!samePage) { close("view"); return false; }       // went to another page: the router shows it
      if (mode === "expanded") { setMode("compact", "pop"); expandBtn.focus({ preventScroll: true }); }
      else close("pop");                                    // Back from the chat's own entry
      return true;
    });
    doc.addEventListener("viewchange", (e) => {
      const v = e.detail;
      context = v.startsWith("case-") ? Number(v.slice(5)) : null;
      if (log.classList.contains("is-empty")) renderWelcome(); else syncSugg();
    });

    /* ---------- Start ---------- */
    $("#ijQs").innerHTML = GROUPS.map((g) => `<div><p>${g}</p>${QA.filter((q) => q.g === g).map((q) => `<button class="ij-q" type="button" data-ask="${q.id}">${q.q}</button>`).join("")}</div>`).join("");
    $("#ijCases").innerHTML = CASES.map((c) => `<li><a href="#case-${c.id}" data-go="case-${c.id}"><span>${c.type}</span><b>${c.title}</b></a></li>`).join("");
    autosize();   // the welcome screen is rendered by the first viewchange
    launchLabel();
  })();

  /* ---------- Hero headline: each line stays on one line. CSS scales it to the column (cqi);
     this only shrinks it further if a fallback font runs wider than Inter. ---------- */
  (function fitHeadline() {
    const h = $(".hr h1");
    if (!h) return;
    const lines = $$(".ln", h);
    let queued = false;
    function fit() {
      queued = false;
      h.style.fontSize = "";
      const over = Math.max(...lines.map((l) => l.scrollWidth / (l.clientWidth || 1)));
      if (over > 1.001) h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) / over) * 0.98 + "px";
    }
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(fit); } };
    fit();
    addEventListener("resize", queue);
    doc.addEventListener("viewchange", queue);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fit);
  })();

  /* ---------- Flagship case: the platform diagram stays pinned while the three chapters scroll past (wide,
     tall screens only; elsewhere each chapter shows a still copy). Each chapter rebuilds it: boxes that stay
     slide over, boxes that go fade out, new boxes fade in and connect. Lights show payments, weighted per
     phase and busier each phase. ---------- */
  (function platformStory() {
    const sec = $(".fl-story"), pin = sec && $(".st-pin", sec), arch = pin && $(".mk-arch", pin);
    if (!arch || !("IntersectionObserver" in window)) return;
    const EASE = "cubic-bezier(.2,.7,.2,1)";
    // The boxes and labels per phase come from platform-phases.ts. Here: how many lights start at each
    // product (gateway busiest, then wallet, then treasury; the console rarely) and end at each network
    // (busiest 4 : second 2 : normal 1), and the average ms between payments.
    const LIGHTS = [
      { every: 1000, from: { gw: 20, con: 1 }, to: { tron: 4, eth: 2 } },
      { every: 480, from: { gw: 20, wal: 10, con: 1 }, to: { tron: 4, eth: 2, bsc: 1, sol: 1, btc: 1 } },
      { every: 200, from: { gw: 20, wal: 10, tre: 5, con: 1 }, to: { tron: 4, eth: 2, bsc: 1, sol: 1, btc: 1 } }
    ];
    const PHASES = PHASE_BOXES.map((p, i) => ({ ...p, ...LIGHTS[i] }));
    const fx = $(".st-fx", arch), stat = $(".mk-stat", arch), title = $(".st-title", pin), steps = $$(".st-step", sec);
    const nodes = new Map($$("[data-n]", arch).map((n) => [n.dataset.n, n]));
    let phase = 0, anims = [], readyAt = 0;

    function run(el, frames, opts, drop) {
      const a = el.animate(frames, opts);
      anims.push(a);
      if (drop) a.onfinish = () => el.remove();
    }
    // Where each shown box sits, relative to the effects layer.
    function measure() {
      const b = fx.getBoundingClientRect(), m = new Map();
      nodes.forEach((n, k) => {
        if (n.hidden) return;
        const r = n.getBoundingClientRect();
        m.set(k, { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height });
      });
      return m;
    }
    // A leaving box is copied onto the effects layer, so it can animate out after the real one is hidden.
    function ghost(k, f) {
      const g = nodes.get(k).cloneNode(true);
      g.hidden = false;
      g.removeAttribute("data-n");
      g.classList.add("st-ghost");
      g.style.cssText = `left:${f.x}px;top:${f.y}px;width:${f.w}px;height:${f.h}px`;
      fx.append(g);
      return g;
    }
    // An arriving box fades in, its connector draws in (down to the core, or down from it to a
    // destination), and its border glows for a moment. A browser that can't animate a pseudo-element
    // would apply the clip to the whole box, so there the connector just appears.
    const LINES = typeof KeyframeEffect === "function" && "pseudoElement" in KeyframeEffect.prototype;
    function arrive(n, delay) {
      run(n, [{ opacity: 0, transform: "translateY(8px) scale(.86)" }, { opacity: 1, transform: "none" }], { duration: 480, delay, easing: EASE, fill: "backwards" });
      if (LINES) run(n, [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }], { pseudoElement: n.classList.contains("up") ? "::after" : "::before", duration: 360, delay: delay + 300, easing: "ease-out", fill: "backwards" });
      const lit = { borderColor: "rgba(140,155,255,.95)", boxShadow: "0 0 0 3px rgba(140,155,255,.18)" };
      run(n, [lit, { ...lit, offset: 0.4 }, { borderColor: "rgba(255,255,255,.14)", boxShadow: "0 0 0 0 rgba(140,155,255,0)" }], { duration: 2200, delay: delay + 250, easing: "ease-out" });
    }
    // FLIP from the old layout (first) to the new one (last).
    function move(first, last) {
      let p = 0, q = 0;
      last.forEach((l, k) => {
        const f = first.get(k);
        if (f && (Math.abs(f.x - l.x) > 0.5 || Math.abs(f.y - l.y) > 0.5)) run(nodes.get(k), [{ transform: `translate(${f.x - l.x}px,${f.y - l.y}px)` }, { transform: "none" }], { duration: 700, easing: EASE });
      });
      first.forEach((f, k) => {
        if (!last.has(k)) run(ghost(k, f), [{ opacity: 1 }, { opacity: 0, transform: "scale(.85)" }], { duration: 300, easing: "ease-in", fill: "forwards" }, true);
      });
      last.forEach((l, k) => {
        if (!first.has(k)) { const n = nodes.get(k); arrive(n, n.classList.contains("up") ? 220 + p++ * 150 : 440 + q++ * 150); }
      });
    }
    function setPhase(i) {
      if (i === phase) return;
      const P = PHASES[i], animate = !reduceMotion.matches, first = animate && measure();
      anims.forEach((a) => a.cancel());
      anims = [];
      fx.replaceChildren();   // copies and lights from the last phase go too
      nodes.forEach((n, k) => { n.hidden = !P.on.includes(k); });
      phase = i;
      arch.dataset.phase = String(i + 1);
      arch.setAttribute("aria-label", `Platform diagram, phase ${i + 1}: ${P.say}`);
      title.textContent = `platform — ${P.count} products, one core`;
      stat.innerHTML = `<span><b>${P.on.filter((k) => PRODUCTS.includes(k)).length}</b> products</span><span><b>1</b> shared core</span>`;
      steps.forEach((s, j) => s.classList.toggle("on", j === i));
      if (!animate) return;
      readyAt = performance.now() + 1400;   // lights wait until the new boxes have landed and connected
      run(title, [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
      run($("b", stat), [{ transform: "translateY(70%)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 420, delay: 200, easing: EASE, fill: "backwards" });
      move(first, measure());
    }

    /* Lights: each payment leaves a product for the core, and 420ms later another leaves the core for a
       destination. Both ends are dealt from shuffled decks built from the phase's weights, so the mix
       holds over every few seconds, not just on average. */
    const decks = {};
    function deal(side) {
      const key = side + phase;
      if (!decks[key] || !decks[key].length) {
        const w = PHASES[phase][side], d = [];
        Object.keys(w).forEach((k) => { for (let c = 0; c < w[k]; c++) d.push(k); });
        for (let j = d.length - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [d[j], d[r]] = [d[r], d[j]]; }
        decks[key] = d;
      }
      return nodes.get(decks[key].pop());
    }
    function light(n, fromProduct) {
      const len = parseFloat(getComputedStyle(arch).getPropertyValue("--gap")) || 26;   // the connector's length
      const b = fx.getBoundingClientRect(), r = n.getBoundingClientRect(), d = doc.createElement("i");
      d.className = "st-dot";
      d.style.cssText = `left:${r.left + r.width / 2 - b.left}px;top:${(fromProduct ? r.bottom : r.top - len) - b.top}px`;
      fx.append(d);
      d.animate([{ transform: "translate(-50%,-50%)", opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { transform: `translate(-50%,calc(-50% + ${len}px))`, opacity: 0 }], { duration: 560 }).onfinish = () => d.remove();
    }
    let seen = false, timer = 0;
    function tick() {
      clearTimeout(timer);
      if (!seen || doc.hidden || reduceMotion.matches) return;
      const wait = readyAt - performance.now();
      if (wait > 0) { timer = setTimeout(tick, wait); return; }
      const at = phase;
      light(deal("from"), true);
      setTimeout(() => { if (seen && !doc.hidden && phase === at && performance.now() >= readyAt) light(deal("to"), false); }, 420);
      timer = setTimeout(tick, PHASES[at].every * (0.6 + Math.random() * 0.8));
    }
    new IntersectionObserver((es) => { seen = es[es.length - 1].isIntersecting; tick(); }).observe($(".mk", pin));
    doc.addEventListener("visibilitychange", tick);
    reduceMotion.addEventListener("change", tick);

    // The chapter whose top has passed the trigger line sets the phase. The line sits just below the
    // middle of the screen, so a chapter's opening is readable as it switches. Checked once per frame
    // while scrolling, so a jump of any size lands on the right phase. While the case is hidden, or the
    // pin isn't shown (narrow or short screens, where each chapter has its own still), nothing changes.
    let line = 0, queued = false;
    function measureLine() { line = Math.min(innerHeight * 0.6, innerHeight - 200); }
    function pick() {
      queued = false;
      if (!pin.getClientRects().length) return;
      let i = 0;
      steps.forEach((s, j) => { if (s.getBoundingClientRect().top <= line) i = j; });
      setPhase(i);
    }
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(pick); } };
    const relayout = () => { measureLine(); queue(); };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", relayout);
    doc.addEventListener("viewchange", () => setTimeout(relayout, 30));
    sec.classList.add("is-live");   // CSS shows the pin (wide, tall screens) only once this script runs
    relayout();
  })();

  /* ---------- Years that count themselves: data-since="2009" shows this year minus 2009 ---------- */
  $$("[data-since]").forEach((el) => {
    const n = new Date().getFullYear() - Number(el.dataset.since);
    el.dataset.to = String(n);
    el.textContent = n;
  });

  /* ---------- Contact form dialog (Formspree). Without JavaScript the form posts normally. ---------- */
  (function contactForm() {
    const dlg = $("#contactDialog"), form = $("#contactForm"), status = $("#contactStatus");
    if (!dlg || !form) return;
    let last = null, downOnBackdrop = false, upOnBackdrop = false;
    const open = () => {
      last = doc.activeElement;
      status.textContent = "";
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
      setTimeout(() => $("#cfName").focus(), 10);
    };
    const shut = () => { if (dlg.open) dlg.close(); };
    dlg.addEventListener("close", () => { if (last && doc.contains(last)) try { last.focus({ preventScroll: true }); } catch (_) { /* ignore */ } });
    // A backdrop click closes it only when the press and the release are both on the backdrop, so a
    // drag between a field and the backdrop (a text selection, say) doesn't: its click lands on the dialog too.
    dlg.addEventListener("pointerdown", (e) => { downOnBackdrop = e.target === dlg; });
    dlg.addEventListener("pointerup", (e) => { upOnBackdrop = e.target === dlg; });
    doc.addEventListener("click", (e) => {
      if (!e.target.closest) return;
      if (e.target.closest("[data-contact-open]")) { e.preventDefault(); open(); return; }
      if (e.target.closest("[data-contact-close]") || (e.target === dlg && downOnBackdrop && upOnBackdrop)) shut();
    });
    // The form posts normally (no fetch): Formspree's reCAPTCHA rejects AJAX submissions, so the
    // browser goes to Formspree's spam check, then its thank-you page.
    const btn = form.querySelector('[type="submit"]');
    form.addEventListener("submit", () => {
      btn.disabled = true;   // no double posts while the page changes
      status.textContent = "Opening a quick spam check…";
    });
    window.addEventListener("pageshow", () => { btn.disabled = false; status.textContent = ""; });   // Back restores the page from cache
  })();

  /* ---------- Start: show the view the address asks for ---------- */
  const start = resolve(location.hash);
  history.replaceState({ y: null }, "");
  show(start.view, { anchor: start.anchor });
  started = true;
})();
