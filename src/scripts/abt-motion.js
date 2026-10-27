// Motion for the About bento (the abt-* markup in index.astro). Each piece plays every time it comes into view
// (about a third visible):
//   - the ownership strip (Sketch → Pitch → Hire → Live) draws itself in, step by step
//   - compliance: a sweep crawls along the manual bar, which thins, and the vendor bar snaps in with a check
//   - sales and priorities: the dots light up and the number counts up, one at a time or in bursts (data-steps)
// A piece resets only once it's fully out of view, so the reset is never seen. The About view is hidden until the
// router shows it; IntersectionObserver reports a hidden view as out of view, so leaving About and coming back
// replays everything with no extra hook. The final state of every graphic is the markup's default: nothing is
// hidden (.is-armed) unless IntersectionObserver exists and motion is allowed.
const RM = matchMedia("(prefers-reduced-motion: reduce)");

const enough = (e) => e.isIntersecting && (e.intersectionRatio >= 0.35 || (e.rootBounds && e.intersectionRect.height >= e.rootBounds.height * 0.6));

if (typeof window.IntersectionObserver === "function" && !RM.matches) {
  // Each piece: reset() puts it back to its start, play() runs it. Restarting a CSS animation needs a reflow
  // between dropping .is-play and adding it again.
  const replay = (el) => { el.classList.remove("is-play"); void el.offsetWidth; el.classList.add("is-play"); };

  const cssPiece = (el) => ({
    reset() { el.classList.remove("is-play"); },
    play() { replay(el); }
  });

  // Counters: start from the first data-from dots, then light the rest and count the number up.
  const counter = (tile) => {
    const box = tile.querySelector(".abt-dots"), ct = tile.querySelector(".abt-ct"), dots = [...box.children];
    const from = +box.dataset.from;
    const steps = box.dataset.steps ? box.dataset.steps.split(",").map(Number) : Array.from({ length: dots.length - from }, (_, i) => from + i + 1);
    const gap = Math.min(230, 1600 / steps.length);
    dots.forEach((d) => { d.dataset.c = d.className; });
    let timers = [];
    return {
      reset() {
        timers.forEach(clearTimeout); timers = [];
        dots.forEach((d, i) => { d.className = i < from ? d.dataset.c : ""; d.style.animationDelay = ""; });
        ct.textContent = from;
      },
      play() {
        this.reset();
        let lit = from;
        timers = steps.map((v, k) => setTimeout(() => {
          const start = lit;
          for (; lit < v; lit++) { const d = dots[lit]; d.className = d.dataset.c + " is-pop"; d.style.animationDelay = (lit - start) * 25 + "ms"; }
          ct.textContent = v;
        }, 150 + k * gap));
      }
    };
  };

  const watch = (target, piece) => {
    let played = false;
    piece.reset();
    new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) { if (played) { played = false; piece.reset(); } return; }
      if (!played && enough(e)) { played = true; piece.play(); }
    }), { threshold: [0, 0.35, 0.6, 1] }).observe(target);
  };

  document.querySelectorAll(".abt-strip").forEach((strip) => {
    strip.classList.add("is-armed");
    watch(strip.closest(".abt-own") || strip.parentElement, cssPiece(strip));
  });
  document.querySelectorAll(".abt-comp").forEach((tile) => {
    tile.classList.add("is-armed");
    watch(tile, cssPiece(tile));
  });
  document.querySelectorAll(".abt-sales, .abt-pri").forEach((tile) => {
    if (tile.querySelector(".abt-dots[data-from]")) watch(tile, counter(tile));
  });
}
