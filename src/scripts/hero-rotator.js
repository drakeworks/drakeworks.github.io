// The home hero's rotating diagram (HeroDiagram.astro). Builds the controls (one progress tab per
// scene, a pause button, the phone "02 / 06 APIs" label and a screen-reader status line), then:
//   - shows one scene at a time. The shown scene has .is-on; .is-run starts its animations and
//     stays on the outgoing scene until its fade ends, so it doesn't snap back to its first frame
//   - advances when the active tab's progress bar finishes (data-interval on .hd or a scene, ms)
//   - hover or focus inside the figure holds the rotation but lets the scene keep moving;
//     the pause button, a hidden tab or an off-screen figure freezes everything (.is-paused)
//   - with reduced motion it never advances on its own, and the scenes show their last frame
// Each .hd element gets el.hd = {go(i), index, paused, reduced}, used by the breakpoint checker.
const RM = matchMedia("(prefers-reduced-motion: reduce)");

document.querySelectorAll("[data-hd]").forEach((hd) => {
  const stage = hd.querySelector(".hd-stage");
  const scenes = [...stage.querySelectorAll(":scope > .hd-scene")];
  const n = scenes.length;
  const pad = (i) => String(i + 1).padStart(2, "0");

  // Controls
  const ctl = document.createElement("div");
  ctl.className = "hd-ctl";
  ctl.innerHTML =
    `<p class="hd-now" aria-hidden="true"></p>` +
    `<div class="hd-tabs" role="group" aria-label="Areas I work in">` +
    scenes.map((s, i) => `<button class="hd-tab" type="button" data-i="${i}"><span class="hd-bar"><i></i></span><span class="hd-lab">${s.dataset.cat}</span></button>`).join("") +
    `</div>` +
    `<button class="hd-play" type="button" aria-label="Pause the animation"><svg class="i-pause" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z"/></svg><svg class="i-play" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2l7 4-7 4z"/></svg></button>` +
    `<p class="sr" aria-live="polite"></p>`;
  hd.appendChild(ctl);
  const tabs = [...ctl.querySelectorAll(".hd-tab")];
  const play = ctl.querySelector(".hd-play");
  const now = ctl.querySelector(".hd-now");
  const live = ctl.querySelector("[aria-live]");

  const st = { index: -1, held: false, wait: false, away: false, reduced: RM.matches };
  hd.hd = { go, get index() { return st.index; }, get paused() { return frozen(); }, get reduced() { return st.reduced; } };
  const timers = new WeakMap();
  let offscreen = false;

  function frozen() { return st.held || st.away; }

  function sync() {
    hd.classList.toggle("is-auto", !st.reduced);
    hd.classList.toggle("is-held", st.held);
    // Holding the rotation pauses only the progress bar; freezing pauses every animation.
    hd.classList.toggle("is-wait", st.wait && !frozen());
    hd.classList.toggle("is-paused", frozen());
    play.hidden = st.reduced;
    play.setAttribute("aria-label", st.held ? "Play the animation" : "Pause the animation");
    const s = scenes[st.index];
    hd.style.setProperty("--hd-int", ((s && s.dataset.interval) || hd.dataset.interval || 6500) + "ms");
  }

  function go(i, { user = false } = {}) {
    i = ((i % n) + n) % n;
    const prev = st.index;
    if (prev === i && !user) return;
    if (prev >= 0 && prev !== i) {
      const out = scenes[prev];
      out.classList.remove("is-on");
      clearTimeout(timers.get(out));
      timers.set(out, setTimeout(() => { if (st.index !== prev) out.classList.remove("is-run"); }, 650));
    }
    const s = scenes[i];
    clearTimeout(timers.get(s));
    s.classList.remove("is-run");
    void s.offsetWidth; // restart its animations
    s.classList.add("is-on", "is-run");
    scenes.forEach((x, k) => x.setAttribute("aria-hidden", k === i ? "false" : "true"));
    tabs.forEach((t, k) => {
      t.setAttribute("aria-current", k === i ? "true" : "false");
      t.classList.toggle("is-done", k < i);
      t.setAttribute("aria-label", `${scenes[k].dataset.cat}, ${k + 1} of ${n}`);
    });
    // Restart the progress bar even when the same tab is pressed again.
    const bar = tabs[i].querySelector(".hd-bar i");
    bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
    now.innerHTML = `<em>${pad(i)} / ${pad(n - 1)}</em>${s.dataset.cat}`;
    if (user) live.textContent = `${s.dataset.cat}, ${i + 1} of ${n}`;
    st.index = i;
    sync();
  }

  // Advance when the active bar's progress animation completes.
  ctl.addEventListener("animationend", (e) => {
    if (e.animationName !== "hdprog" || st.reduced) return;
    if (e.target.closest(".hd-tab") !== tabs[st.index]) return;
    go(st.index + 1);
  });

  tabs.forEach((t, k) => t.addEventListener("click", () => go(k, { user: true })));
  ctl.querySelector(".hd-tabs").addEventListener("keydown", (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const k = (tabs.indexOf(document.activeElement) + d + n) % n;
    tabs[k].focus();
    go(k, { user: true });
  });
  play.addEventListener("click", () => { st.held = !st.held; sync(); });

  // Hold while someone is looking at it or using it.
  hd.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { st.wait = true; sync(); } });
  hd.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") { st.wait = hd.contains(document.activeElement); sync(); } });
  hd.addEventListener("focusin", () => { st.wait = true; sync(); });
  hd.addEventListener("focusout", (e) => { if (!hd.contains(e.relatedTarget)) { st.wait = hd.matches(":hover"); sync(); } });

  // Freeze when nobody can see it.
  const away = () => { st.away = document.hidden || offscreen; sync(); };
  document.addEventListener("visibilitychange", away);
  new IntersectionObserver(([en]) => { offscreen = !en.isIntersecting; away(); }, { threshold: 0.1 }).observe(stage);
  RM.addEventListener("change", () => { st.reduced = RM.matches; go(st.index, { user: true }); });

  hd.classList.add("is-ready");
  go(0);
});
