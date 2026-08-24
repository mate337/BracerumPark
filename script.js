/* ==========================================================
   BRACERUM/PARK — script principal · v4
   GSAP-first: loader, hero, masterplan hotspots, mapa, galeria.
   ========================================================== */
document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
gsap.registerPlugin(ScrollTrigger);

/* ==========================================================
   00 · LOADER
   ========================================================== */
(function loader(){
  const el = document.getElementById("loader");
  if (!el) return;
  const mark = el.querySelector(".loader__mark");
  const bar = el.querySelector(".loader__bar");
  const label = el.querySelector(".loader__label");
  const curtain = el.querySelector(".loader__curtain");

  if (reduceMotion) { el.remove(); document.body.classList.remove("is-loading"); return; }

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete(){ el.remove(); document.body.classList.remove("is-loading"); }
  });
  tl.to(mark, { opacity: 1, duration: .7 })
    .to(label, { opacity: 1, duration: .4 }, "-=.35")
    .fromTo(bar, { "--p": "0%" }, {
      duration: 1.1, ease: "power2.inOut",
      onUpdate(){
        const p = this.progress() * 100;
        bar.style.background = `linear-gradient(90deg, var(--cream) ${p}%, var(--line-on-dark) ${p}%)`;
      }
    }, "-=.15")
    .to(el, { duration: .15 })
    .to(curtain, { yPercent: -100, duration: .8, ease: "expo.inOut" }, "+=.05")
    .to(el, { autoAlpha: 0, duration: .3 }, "-=.15");
})();

/* ==========================================================
   01 · NAV + MENU PANEL
   ========================================================== */
(function nav(){
  const nav = document.getElementById("siteNav");
  if (!nav) return;
  function update(){
    const past = window.scrollY > window.innerHeight * 0.7;
    nav.classList.toggle("nav--solid", past);
    nav.classList.toggle("nav--transparent", !past);
  }
  update();
  window.addEventListener("scroll", update, { passive: true });

  const panel = document.getElementById("menuPanel");
  const openBtns = document.querySelectorAll("[data-menu-open]");
  const closeBtns = document.querySelectorAll("[data-menu-close]");
  function openMenu(){
    panel.classList.add("is-open"); nav.classList.add("is-open");
    document.body.style.overflow = "hidden";
    gsap.fromTo(panel.querySelector(".menu-panel__sheet"), { xPercent: 8, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: .5, ease: "power3.out" });
    gsap.fromTo(panel.querySelectorAll(".menu-panel__links a"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, stagger: .05, delay: .15, duration: .5, ease: "power2.out" });
  }
  function closeMenu(){
    panel.classList.remove("is-open"); nav.classList.remove("is-open");
    document.body.style.overflow = "";
  }
  openBtns.forEach(b => b.addEventListener("click", openMenu));
  closeBtns.forEach(b => b.addEventListener("click", closeMenu));
  panel?.querySelector(".menu-panel__scrim")?.addEventListener("click", closeMenu);
  panel?.querySelectorAll(".menu-panel__links a").forEach(a => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });
})();

/* ==========================================================
   02 · REVEAL ON SCROLL
   ========================================================== */
(function reveal(){
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (reduceMotion){ items.forEach(i => i.classList.add("is-in")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){ entry.target.classList.add("is-in"); io.unobserve(entry.target); }
    });
  }, { threshold: .16, rootMargin: "0px 0px -8% 0px" });
  items.forEach(i => io.observe(i));
})();

/* ==========================================================
   03 · HERO — dots grid reativo (canvas leve)
   ========================================================== */
(function heroDots(){
  const canvas = document.getElementById("heroDots");
  if (!canvas) return;
  const hero = canvas.closest(".hero-cine");
  const ctx = canvas.getContext("2d");
  let w, h, cols, rows, gap = 30, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mouse = { x: -9999, y: -9999 };
  let running = false, raf;

  function resize(){
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / gap) + 1; rows = Math.ceil(h / gap) + 1;
  }

  function draw(){
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < cols; i++){
      for (let j = 0; j < rows; j++){
        const x = i * gap, y = j * gap;
        const dx = x - mouse.x, dy = y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - dist / 260);
        const r = 1 + influence * 2.4;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,248,239,${0.10 + influence * 0.55})`;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (running) raf = requestAnimationFrame(draw);
  }

  function start(){ if (running) return; running = true; draw(); }
  function stop(){ running = false; cancelAnimationFrame(raf); }

  resize();
  if (reduceMotion){
    draw(); // desenha grid estática, sem loop nem reatividade ao mouse
  } else {
    hero.addEventListener("pointermove", e => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => e.isIntersecting ? start() : stop());
    }, { threshold: 0 });
    io.observe(hero);
    window.addEventListener("resize", resize);
  }
})();

/* ==========================================================
   04 · MASTERPLAN — hotspots interativos
   ========================================================== */
const masterplanAreas = [
  {
    id: "portaria",
    x: 11, y: 20,
    eyebrow: "Acesso principal",
    title: "Portaria & Clube do Caminhoneiro",
    val: "Estacionamento de caminhões · posto de combustível · restaurante",
    img: "assets/renders/rodovia-acesso.jpg"
  },
  {
    id: "industrial",
    x: 40, y: 46,
    eyebrow: "Área industrial",
    title: "Loteamentos & galpões Built-to-Suit",
    val: "989.642 m² de lotes industriais",
    img: "assets/Fabrica.jpg"
  },
  {
    id: "fabrica",
    x: 30, y: 58,
    eyebrow: "Fábrica própria",
    title: "Fábrica Bracerum",
    val: "180.245 m² · execução própria do parque",
    img: "assets/renders/fabrica-bracerum-noturna.jpg"
  },
  {
    id: "infra",
    x: 14, y: 60,
    eyebrow: "Infraestrutura",
    title: "Subestação & E.T.E. / E.T.A.",
    val: "Subestação a 7 km · tratamento de água e efluentes",
    img: "assets/renders/rodovia-acesso.jpg"
  },
  {
    id: "aeroporto",
    x: 36, y: 90,
    eyebrow: "Aeroporto corporativo",
    title: "Pista de pouso & heliponto",
    val: "1.280 m de pista (1.460 m com escape) · hangar",
    img: "assets/renders/rodovia-acesso.jpg"
  },
  {
    id: "condominio",
    x: 78, y: 30,
    eyebrow: "Bracerum Resort",
    title: "Condomínio de casas",
    val: "141 lotes · 142.067 m² · clube, lago e quadras",
    img: "assets/renders/condominio-casa-fachada.jpg"
  },
  {
    id: "hotel",
    x: 90, y: 20,
    eyebrow: "Hospitalidade & eventos",
    title: "Hotel & Centro de Convenções",
    val: "384 studios · 13.500 m² de centro de convenções",
    img: "assets/renders/hotel-convencoes-noturna.jpg"
  }
];

(function masterplanHotspots(){
  const stage = document.getElementById("masterplanStage");
  if (!stage) return;
  const layer = stage.querySelector(".masterplan__hotspots");
  const card = document.getElementById("hotspotCard");
  const cardMedia = card.querySelector(".hotspot-card__media img");
  const cardEyebrow = card.querySelector(".hotspot-card__eyebrow");
  const cardTitle = card.querySelector(".hotspot-card__title");
  const cardVal = card.querySelector(".hotspot-card__val");
  const dotsWrap = card.querySelector(".hotspot-card__dots");
  const prevBtn = card.querySelector('[data-hotspot-prev]');
  const nextBtn = card.querySelector('[data-hotspot-next]');
  let active = -1;

  masterplanAreas.forEach((area, i) => {
    const btn = document.createElement("button");
    btn.className = "hotspot";
    btn.style.left = area.x + "%";
    btn.style.top = area.y + "%";
    btn.setAttribute("aria-label", area.title);
    btn.textContent = "+";
    btn.addEventListener("click", () => openHotspot(i));
    layer.appendChild(btn);

    const dot = document.createElement("span");
    dotsWrap.appendChild(dot);
  });
  const hotspotEls = layer.querySelectorAll(".hotspot");
  const dotEls = dotsWrap.querySelectorAll("span");

  function openHotspot(i){
    active = (i + masterplanAreas.length) % masterplanAreas.length;
    const area = masterplanAreas[active];
    hotspotEls.forEach((h, idx) => h.classList.toggle("is-active", idx === active));
    dotEls.forEach((d, idx) => d.classList.toggle("is-active", idx === active));
    cardEyebrow.textContent = area.eyebrow;
    cardTitle.textContent = area.title;
    cardVal.textContent = area.val;
    cardMedia.src = area.img;
    cardMedia.alt = area.title;
    card.classList.add("is-open");
  }
  function closeHotspot(){
    card.classList.remove("is-open");
    hotspotEls.forEach(h => h.classList.remove("is-active"));
    active = -1;
  }
  card.querySelector(".hotspot-card__close").addEventListener("click", closeHotspot);
  prevBtn.addEventListener("click", () => openHotspot(active - 1));
  nextBtn.addEventListener("click", () => openHotspot(active + 1));
})();

/* ==========================================================
   05 · LOCALIZAÇÃO — mapa escuro (Leaflet)
   ========================================================== */
const PARK = { lat: -25.771694, lng: -57.732389 };
const ports = [
  { name: "Emb. Puerto Alegre", sub: "Fluvial · atracadouro local", km: "4 km", tempo: "0h 10m", lat: -25.7930, lng: -57.7565 },
  { name: "Puerto Lobato", sub: "Fluvial · atracadouro local", km: "6 km", tempo: "0h 15m", lat: -25.8085, lng: -57.7660 },
  { name: "Terport Villeta", sub: "Fluvial · contêineres", km: "23 km", tempo: "20m", lat: -25.5296, lng: -57.5568 },
  { name: "Puerto Seguro Fluvial", sub: "Fluvial · carga geral", km: "33 km", tempo: "30m", lat: -25.4728, lng: -57.5539 },
  { name: "Terminal Villa Oliva", sub: "Fluvial · barcaças", km: "38 km", tempo: "0h 50m", lat: -26.0060, lng: -57.8890 },
  { name: "Caacupemí Villeta", sub: "Fluvial · contêineres", km: "42 km", tempo: "1h 00m", lat: -25.5060, lng: -57.5450 },
  { name: "Porto de Assunção", sub: "Fluvial · carga geral", km: "71 km", tempo: "1h 20m", lat: -25.2780, lng: -57.6430 },
  { name: "Porto de Alberdi", sub: "Fluvial · local", km: "72 km", tempo: "1h", lat: -26.1870, lng: -58.1290 },
];
const roads = [
  { name: "Assunção", sub: "Central · PY", km: "65 km", tempo: "1h 10m", lat: -25.2867, lng: -57.6470 },
  { name: "Encarnación", sub: "Itapúa · PY", km: "355 km", tempo: "4h 40m", lat: -27.3306, lng: -55.8667 },
  { name: "Ciudad del Este", sub: "Alto Paraná · PY", km: "360 km", tempo: "5h", lat: -25.5097, lng: -54.6111 },
  { name: "Foz do Iguaçu", sub: "Brasil", km: "365 km", tempo: "5h", lat: -25.5163, lng: -54.5854 },
  { name: "Curitiba", sub: "Brasil", km: "1.000 km", tempo: "12h 30m", lat: -25.4284, lng: -49.2733 },
  { name: "Porto Alegre", sub: "Brasil", km: "1.055 km", tempo: "14h 30m", lat: -30.0346, lng: -51.2177 },
  { name: "Córdoba", sub: "Argentina", km: "1.100 km", tempo: "13h 00m", lat: -31.4201, lng: -64.1888 },
  { name: "Buenos Aires", sub: "Argentina", km: "1.280 km", tempo: "14h 30m", lat: -34.6037, lng: -58.3816 },
];
const refs = [
  { name: "Aeroporto de Assunção (ASU)", sub: "Voos diários a São Paulo", km: "70 km", tempo: "1h 15m", lat: -25.2400, lng: -57.5200 },
  { name: "Subestação da ANDE", sub: "Energia — média/alta tensão", km: "7,4 km", tempo: "10m", lat: -25.7550, lng: -57.7600 },
];

(function locationMap(){
  const el = document.getElementById("locMap");
  if (!el || typeof L === "undefined") return;
  const map = L.map(el, { zoomControl: false, scrollWheelZoom: true }).setView([PARK.lat, PARK.lng], 10);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
  }).addTo(map);

  const parkIcon = L.divIcon({
    className: "", html: '<div style="width:16px;height:16px;border-radius:50%;background:#9c2b2b;border:3px solid #fff8ef;box-shadow:0 0 0 6px rgba(156,43,43,.25)"></div>',
    iconSize: [16, 16], iconAnchor: [8, 8]
  });
  L.marker([PARK.lat, PARK.lng], { icon: parkIcon }).addTo(map).bindPopup("Bracerum Park");

  const poiIcon = (color) => L.divIcon({
    className: "", html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid rgba(255,248,239,.85)"></div>`,
    iconSize: [10, 10], iconAnchor: [5, 5]
  });
  const markers = {};
  function addGroup(list, color, key){
    list.forEach(p => {
      const m = L.marker([p.lat, p.lng], { icon: poiIcon(color) }).addTo(map).bindPopup(`<strong>${p.name}</strong><br>${p.sub}<br>${p.km} · ${p.tempo}`);
      markers[key + p.name] = m;
    });
  }
  addGroup(ports, "#3f7ad1", "port-");
  addGroup(roads, "#e0a95c", "road-");
  addGroup(refs, "#8ac48a", "ref-");

  function renderList(ulId, list, key){
    const ul = document.getElementById(ulId);
    if (!ul) return;
    list.forEach(p => {
      const li = document.createElement("li");
      li.className = "dist-item";
      li.innerHTML = `<span>${p.name}</span><b>${p.km}</b>`;
      li.addEventListener("click", () => {
        map.flyTo([p.lat, p.lng], 12, { duration: .8 });
        markers[key + p.name]?.openPopup();
      });
      ul.appendChild(li);
    });
  }
  renderList("portList", ports, "port-");
  renderList("roadList", roads, "road-");
  renderList("refList", refs, "ref-");

  document.querySelectorAll(".loc-acc__head").forEach(head => {
    head.addEventListener("click", () => {
      const acc = head.closest(".loc-acc");
      const isOpen = acc.getAttribute("data-open") === "true";
      document.querySelectorAll(".loc-acc").forEach(a => a.setAttribute("data-open", "false"));
      acc.setAttribute("data-open", String(!isOpen));
    });
  });

  document.getElementById("recenterBtn")?.addEventListener("click", () => {
    map.flyTo([PARK.lat, PARK.lng], 10, { duration: .8 });
  });
})();

/* ==========================================================
   06 · GALERIA — sanfona
   ========================================================== */
(function galleryAccordion(){
  const wrap = document.getElementById("galleryAccordion");
  if (!wrap) return;
  const panels = wrap.querySelectorAll(".gallery-panel");
  function activate(panel){
    panels.forEach(p => p.classList.toggle("is-active", p === panel));
  }
  panels.forEach(p => {
    p.addEventListener("mouseenter", () => { if (window.matchMedia("(hover:hover)").matches) activate(p); });
    p.addEventListener("click", () => activate(p));
  });
  if (panels[0]) activate(panels[0]);
})();

/* ==========================================================
   07 · GSAP ScrollTrigger — parallax leve no hero
   ========================================================== */
if (!reduceMotion){
  const heroBgImg = document.querySelector(".hero-cine__bg img");
  if (heroBgImg){
    gsap.to(heroBgImg, {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".hero-cine", start: "top top", end: "bottom top", scrub: true }
    });
  }
}
