// Placeholder for full interactive JS. Needs original strml.net logic or rebuild.
(function () {
  // Elements
  let styleTag, styleTextEl, workEl, pgpEl, headerEl, skipBtn, pauseBtn;
  let paused = false, skipped = false;

  // Typing speed
  const SPEED = 12;          // base ms per char
  const CHUNK = 1;           // chars per tick
  const PUNCT_PAUSE = {      // slow down on punctuation
    comma: 28,
    block: 44,
    sentence: 60
  };

  // Punctuation detectors
  const endOfSentence = /[\.\?\!]\s$/;
  const comma = /\D[\,]\s$/;
  const endOfBlock = /[^\/]\n\n$/;

  // Files to load (same shape as strml order)
  const styleFiles = ['styles0.css', 'styles1.css', 'styles2.css', 'styles3.css'];

  // Small helpers
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const fetchText = (url) => fetch(url, { cache: 'no-store' }).then(r => r.text());

  // Linkify for work/pgp panes
  function linkify(text) {
    return text.replace(/https?:\/\/[^\s)]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
  }

  // Typewriter that can mirror to <style> so CSS applies live
  async function typeTo(el, text, { mirrorToStyle = false } = {}) {
    let i = 0;
    while (i < text.length) {
      if (skipped) {
        // Dump full content instantly
        el.innerHTML += mirrorToStyle ? escapeHTML(text.slice(i)) : text.slice(i);
        if (mirrorToStyle) styleTag.textContent += text.slice(i);
        break;
      }
      if (paused) { await sleep(60); continue; }

      const slice = text.slice(i, i + CHUNK);
      i += CHUNK;

      // write
      if (mirrorToStyle) {
        // show pretty in the code pane, apply raw into <style>
        el.textContent += slice;
        styleTag.textContent += slice;
      } else {
        // preserve newlines but allow links later
        // use textContent while typing for speed, linkify after block if you want
        el.textContent += slice;
      }

      // auto scroll to bottom
      el.scrollTop = el.scrollHeight;

      // punctuation slowdowns
      const lookbehind = text.slice(Math.max(0, i - 2), i + 1);
      let delay = SPEED;
      if (comma.test(lookbehind)) delay = SPEED * PUNCT_PAUSE.comma;
      if (endOfBlock.test(lookbehind)) delay = SPEED * PUNCT_PAUSE.block;
      if (endOfSentence.test(lookbehind)) delay = SPEED * PUNCT_PAUSE.sentence;

      await sleep(delay);
    }
  }

  // Escape helper for code pane safety
  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, (m) => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  async function main() {
    // Grab DOM
    styleTag   = document.getElementById('style-tag');
    styleTextEl= document.getElementById('style-text');
    workEl     = document.getElementById('work-text');
    pgpEl      = document.getElementById('pgp-text');
    headerEl   = document.getElementById('header');
    skipBtn    = document.getElementById('skip-animation');
    pauseBtn   = document.getElementById('pause-resume');

    // Buttons
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => { e.preventDefault(); skipped = true; });
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume >>' : 'Pause ||';
      });
    }

    // Pre-styles first so it doesn’t flash ugly
    try {
      const pre = await fetchText('prestyles.css');
      const preEl = document.createElement('style');
      preEl.textContent = pre;
      document.head.insertBefore(preEl, styleTag);
    } catch (e) { /* non-fatal */ }

    // Header (footer in STRML)
    try {
      headerEl.innerHTML = await fetchText('header.html');
    } catch (e) { /* non-fatal */ }

    // === Animation sequence (mirrors STRML-ish order) ===
    // 1) styles0 typed into code pane and mirrored into <style>
    const s0 = await fetchText(styleFiles[0]);
    await typeTo(styleTextEl, s0, { mirrorToStyle: true });

    // 2) work.txt typed into the work pane (no mirror)
    const work = await fetchText('work.txt');
    await typeTo(workEl, work, { mirrorToStyle: false });
    // linkify after typed
    workEl.innerHTML = `<div class="text">${linkify(work)}</div>`;

    // 3) styles1
    const s1 = await fetchText(styleFiles[1]);
    await typeTo(styleTextEl, s1, { mirrorToStyle: true });

    // 4) tiny dramatic pause
    await sleep(500);

    // 5) styles2
    const s2 = await fetchText(styleFiles[2]);
    await typeTo(styleTextEl, s2, { mirrorToStyle: true });

    // 6) pgp.txt
    const pgp = await fetchText('pgp.txt');
    await typeTo(pgpEl, pgp, { mirrorToStyle: false });
    pgpEl.innerHTML = linkify(pgp);

    // 7) styles3 (finale)
    const s3 = await fetchText(styleFiles[3]);
    await typeTo(styleTextEl, s3, { mirrorToStyle: true });
  }

  // Kick off
  document.addEventListener('DOMContentLoaded', main);
})();
