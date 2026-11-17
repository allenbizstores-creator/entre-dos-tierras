const data = window.PRESENTATION;
const root = document.querySelector("#presentation");
const overlayRoot = document.querySelector("#overlay-root");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let current = 0;
let direction = "forward";
let locked = false;
let overlay = null;

const svgIcon = (name) => ({
  prev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`,
  next: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v13H9l-4 3V4Z"/><path d="M9 8h6M9 11h4"/></svg>`,
  fullscreen: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></svg>`,
  sources: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h10"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`
})[name];

function chapterForBeat(index) {
  return data.chapters[data.beats[index].chapter];
}

function planeShape() {
  return `<g class="plane-shape"><path d="M-19 2 19-8c5-1 7 2 3 5L8 5l7 12-6 1L-1 8l-11 5-1 6-5 1-2-9-8-5 5-3 8 2Z"/></g>`;
}

function mapSvg(mode = "still") {
  return `<svg class="route-map route-${mode}" viewBox="0 0 1000 620" role="img" aria-label="Ruta aérea entre República Dominicana y Nueva York">
    <defs>
      <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b6f87"/><stop offset="1" stop-color="#0d3549"/></linearGradient>
      <path id="outbound-path" d="M678 476 C650 354 526 170 322 125"/>
      <path id="return-path" d="M322 125 C526 170 650 354 678 476"/>
      <filter id="plane-shadow"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-opacity=".32"/></filter>
    </defs>
    <rect width="1000" height="620" fill="url(#ocean)"/>
    <g class="map-grid"><path d="M0 155h1000M0 310h1000M0 465h1000M250 0v620M500 0v620M750 0v620"/></g>
    <path class="north-america" d="M88 0h912v138l-40 14-31 38-68 15-27 39-55 12-36 48-67 22-51-33-36-70-91-42-47-61-76-21-49-66-101-16Z"/>
    <path class="florida" d="m612 300 55 36 14 96-24 48-17-66-47-55Z"/>
    <path class="hispaniola" d="m636 479 31-14 66-3 49 14-18 22-73 6-46-8Z"/>
    <path class="cuba" d="m474 490 54-9 45 8-35 17-67-5Z"/>
    <g class="location location-ny"><circle cx="322" cy="125" r="8"/><circle cx="322" cy="125" r="22"/><text x="286" y="88">NUEVA YORK</text></g>
    <g class="location location-dr"><circle cx="678" cy="476" r="8"/><circle cx="678" cy="476" r="22"/><text x="716" y="521">REPÚBLICA DOMINICANA</text></g>
    <use href="#${mode === "return" ? "return-path" : "outbound-path"}" class="route-dots"/>
    <use href="#${mode === "return" ? "return-path" : "outbound-path"}" class="route-line"/>
    <g class="map-plane" filter="url(#plane-shadow)">${planeShape()}</g>
    <text x="94" y="548" class="ocean-label">MAR CARIBE</text>
  </svg>`;
}

function picture(src, alt, className = "") {
  return `<img class="documentary-photo ${className}" src="${src}" alt="${alt}" draggable="false">`;
}

function creditLine(text) {
  return text ? `<span class="photo-credit">${text}</span>` : "";
}

function headerMarkup() {
  const chapter = chapterForBeat(current);
  return `<header class="presentation-header">
    <div class="chapter-id"><span>${chapter.number}</span><b>${chapter.title}</b></div>
    <div class="header-title">Entre dos tierras</div>
    <div class="header-actions">
      <button data-overlay="notes" aria-label="Abrir notas del presentador">${svgIcon("notes")}<span>Notas</span></button>
      <button data-overlay="sources" aria-label="Abrir fuentes y créditos">${svgIcon("sources")}<span>Fuentes</span></button>
      <button data-action="fullscreen" aria-label="Alternar pantalla completa">${svgIcon("fullscreen")}</button>
    </div>
  </header>`;
}

function footerMarkup() {
  const percentage = ((current + 1) / data.beats.length) * 100;
  return `<footer class="presentation-footer">
    <button class="step-button" data-action="prev" ${current === 0 ? "disabled" : ""} aria-label="Beat anterior">${svgIcon("prev")}</button>
    <div class="progress-wrap">
      <div class="progress-label"><span>${String(current + 1).padStart(2, "0")}</span><i>de</i><span>${data.beats.length}</span></div>
      <div class="progress-track" aria-label="Progreso: ${current + 1} de ${data.beats.length}"><span style="width:${percentage}%"></span></div>
      <div class="chapter-marks">${data.chapters.map((c, i) => `<span class="${i === data.beats[current].chapter ? "active" : ""}" style="flex:${c.beats.length}"></span>`).join("")}</div>
    </div>
    <button class="step-button" data-action="next" ${current === data.beats.length - 1 ? "disabled" : ""} aria-label="Siguiente beat">${svgIcon("next")}</button>
  </footer>`;
}

function cover(b) {
  return `<section class="beat beat-cover">
    <figure class="cover-image">${picture(b.image, b.imageAlt)}<div class="film-grain"></div>${creditLine(b.credit)}</figure>
    <div class="cover-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p class="cover-subtitle">${b.subtitle}</p><div class="start-cue">Presiona <kbd>→</kbd> para comenzar</div></div>
  </section>`;
}

function originMap(b) {
  return `<section class="beat beat-origin-map">
    <figure class="origin-photo">${picture(b.image, b.imageAlt)}<div class="photo-shade"></div>${creditLine(b.credit)}</figure>
    <div class="origin-map-panel">${mapSvg("still")}</div>
    <div class="editorial-copy light"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p></div>
  </section>`;
}

function outboundMap(b) {
  return `<section class="beat beat-flight">
    <div class="map-full">${mapSvg("outbound")}</div>
    <div class="flight-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><div class="journey-words">${b.words.map((w, i) => `<span style="--delay:${i * 130}ms">${w}</span>`).join("")}</div><p>${b.body}</p></div>
  </section>`;
}

function photoStatement(b) {
  return `<section class="beat beat-photo-statement">
    <figure>${picture(b.image, b.imageAlt)}<div class="cinema-shade"></div>${creditLine(b.credit)}</figure>
    <div class="statement-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p></div>
  </section>`;
}

function montage(b, culture = false) {
  return `<section class="beat beat-montage ${culture ? "culture" : "new-york"}">
    <div class="montage-grid count-${b.photos.length}">${b.photos.map((p, i) => `<figure style="--delay:${i * 100}ms">${picture(p.src, p.alt)}<figcaption><strong>${p.label}</strong><small>${p.credit}</small></figcaption></figure>`).join("")}</div>
    <div class="montage-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p></div>
  </section>`;
}

function statistic(b) {
  return `<section class="beat beat-statistic">
    <div class="stat-rule"></div><p class="kicker">${b.kicker}</p><div class="stat-number">${b.stat}</div>
    <div class="stat-copy"><h1>${b.title}</h1><p>${b.body}</p><a href="${b.sourceUrl}" target="_blank" rel="noreferrer">${b.sourceLabel}</a></div>
    <div class="stat-note">El porcentaje describe ese período; no es una estimación de 2026.</div>
  </section>`;
}

function language(b) {
  return `<section class="beat beat-language">
    <figure>${picture(b.image, b.imageAlt)}<div class="language-shade"></div>${creditLine(b.credit)}</figure>
    <div class="word-field" aria-hidden="true">${b.fragments.map((f, i) => `<span style="--i:${i}">${f}</span>`).join("")}</div>
    <div class="language-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p></div>
  </section>`;
}

function personal(b, cool = false) {
  return `<section class="beat beat-personal ${cool ? "cool" : "warm"}">
    <figure>${picture(b.image, b.imageAlt)}<div class="personal-shade"></div>${creditLine(b.credit)}</figure>
    <div class="personal-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><blockquote>${b.quote}</blockquote><p class="qualification">${b.caption}</p></div>
  </section>`;
}

function splitReflection(b) {
  return `<section class="beat beat-split">
    <div class="split-photos"><figure>${picture(b.images[0], b.imageAlts[0])}<small>${b.credits[0]}</small></figure><figure>${picture(b.images[1], b.imageAlts[1])}<small>${b.credits[1]}</small></figure></div>
    <div class="split-shade"></div><div class="split-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><blockquote>${b.quote}</blockquote></div>
  </section>`;
}

function identity(b) {
  return `<section class="beat beat-identity">
    <figure>${picture(b.image, b.imageAlt)}<div class="identity-shade"></div>${creditLine(b.credit)}</figure>
    <div class="identity-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p><blockquote>${b.statement}</blockquote></div>
  </section>`;
}

function tradition(b) {
  return `<section class="beat beat-tradition">
    <figure>${picture(b.image, b.imageAlt)}<div class="tradition-shade"></div>${creditLine(b.credit)}</figure>
    <div class="tradition-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p><div class="placeholder-note"><span>Nota de producción</span>${b.caveat}</div></div>
  </section>`;
}

function returnMap(b) {
  return `<section class="beat beat-flight return-flight">
    <div class="map-full">${mapSvg("return")}</div>
    <div class="flight-copy return-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p><div class="return-words">${b.words.map((w, i) => `<span><b>0${i + 1}</b>${w}</span>`).join("")}</div></div>
  </section>`;
}

function finale(b) {
  return `<section class="beat beat-finale">
    <figure>${picture(b.image, b.imageAlt)}<div class="final-shade"></div>${creditLine(b.credit)}</figure>
    <div class="final-copy"><p class="kicker">${b.kicker}</p><h1>${b.title}</h1><p>${b.body}</p><blockquote>${b.question}</blockquote><button data-overlay="sources" class="final-sources">Ver fuentes y créditos</button></div>
  </section>`;
}

const renderBeat = (b) => ({
  cover: cover, originMap: originMap, outboundMap: outboundMap, photoStatement: photoStatement,
  nyMontage: (x) => montage(x, false), statistic: statistic, cultureMontage: (x) => montage(x, true),
  language: language, personalWarm: (x) => personal(x, false), personalCool: (x) => personal(x, true),
  splitReflection: splitReflection, identity: identity, tradition: tradition, returnMap: returnMap, finale: finale
})[b.type](b);

function render() {
  const beat = data.beats[current];
  root.innerHTML = `${headerMarkup()}<main class="stage stage-${direction}" aria-live="polite">${renderBeat(beat)}</main>${footerMarkup()}`;
  bindControls();
  requestAnimationFrame(() => root.querySelector(".stage")?.classList.add("is-visible"));
  preloadNearby();
}

function bindControls() {
  root.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => handleAction(button.dataset.action)));
  root.querySelectorAll("[data-overlay]").forEach((button) => button.addEventListener("click", () => openOverlay(button.dataset.overlay)));
}

function navigate(delta) {
  if (locked || overlay) return;
  const next = Math.max(0, Math.min(data.beats.length - 1, current + delta));
  if (next === current) return;
  locked = true;
  direction = delta > 0 ? "forward" : "backward";
  const stage = root.querySelector(".stage");
  stage?.classList.add("is-leaving");
  const exitDelay = reducedMotion.matches ? 0 : 180;
  window.setTimeout(() => {
    current = next;
    render();
    window.setTimeout(() => { locked = false; }, reducedMotion.matches ? 0 : 360);
  }, exitDelay);
}

function handleAction(action) {
  if (action === "prev") navigate(-1);
  if (action === "next") navigate(1);
  if (action === "fullscreen") toggleFullscreen();
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (_) { /* Fullscreen can be unavailable in embedded previews. */ }
}

function openOverlay(type) {
  overlay = type;
  const beat = data.beats[current];
  if (type === "notes") {
    overlayRoot.innerHTML = `<div class="overlay" role="presentation"><aside class="notes-drawer" role="dialog" aria-modal="true" aria-labelledby="notes-title"><button class="overlay-close" aria-label="Cerrar notas">${svgIcon("close")}</button><p class="overlay-kicker">Notas del presentador · ${current + 1}/${data.beats.length}</p><h2 id="notes-title">${beat.title || beat.stat}</h2><p>${beat.notes}</p><div class="notes-time">Ritmo sugerido: 20–30 segundos</div></aside></div>`;
  } else {
    overlayRoot.innerHTML = `<div class="overlay" role="presentation"><section class="sources-panel" role="dialog" aria-modal="true" aria-labelledby="sources-title"><button class="overlay-close" aria-label="Cerrar fuentes">${svgIcon("close")}</button><p class="overlay-kicker">Investigación y fotografía</p><h2 id="sources-title">Fuentes y créditos</h2><div class="sources-columns"><div><h3>Referencias académicas</h3><ol>${data.sources.map(s => `<li><a href="${s.url}" target="_blank" rel="noreferrer">${s.title}</a><span>${s.publisher} · ${s.date}</span></li>`).join("")}</ol></div><div><h3>Imágenes</h3><ol class="image-credit-list">${data.imageCredits.map(c => `<li><a href="${c.source}" target="_blank" rel="noreferrer">${c.description}</a><span>${c.creator} · ${c.license}</span></li>`).join("")}</ol></div></div></section></div>`;
  }
  overlayRoot.querySelector(".overlay-close")?.addEventListener("click", closeOverlay);
  overlayRoot.querySelector(".overlay")?.addEventListener("click", (event) => { if (event.target.classList.contains("overlay")) closeOverlay(); });
  overlayRoot.querySelector(".overlay-close")?.focus();
}

function closeOverlay() {
  overlay = null;
  overlayRoot.innerHTML = "";
}

function preloadNearby() {
  [current - 1, current + 1].filter(i => i >= 0 && i < data.beats.length).forEach(i => {
    const b = data.beats[i];
    const paths = [b.image, ...(b.images || []), ...(b.photos || []).map(p => p.src)].filter(Boolean);
    paths.forEach(src => { const img = new Image(); img.src = src; });
  });
}

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
  if (typing) return;
  if (event.key === "Escape") {
    if (overlay) closeOverlay();
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    return;
  }
  if (overlay) return;
  if (event.key === "ArrowRight" || event.key === " " || event.key === "Enter") {
    event.preventDefault(); navigate(1);
  }
  if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
  if (event.key.toLowerCase() === "f") { event.preventDefault(); toggleFullscreen(); }
  if (event.key.toLowerCase() === "n") { event.preventDefault(); openOverlay("notes"); }
});

render();
