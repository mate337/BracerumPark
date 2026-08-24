/* ==========================================================
   BRACERUM/PARK — script principal · v5
   Loader, nav sobre hero, dots, masterplan zoom, mapa,
   infográfico pinado, sanfona, reveals. GSAP + ScrollTrigger.
   ========================================================== */
document.documentElement.classList.add("js");

const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hasGsap;
if (reduceMotion) document.documentElement.classList.add("no-motion");
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ==========================================================
   00 · LOADER + foco do hero
   ========================================================== */
(function loader(){
  const el = document.getElementById("loader");
  const heroImg = document.querySelector(".hero__bg img");
  const heroMark = document.getElementById("heroMark");

  function focusHero(){
    if (reduceMotion || !heroImg) return;
    gsap.fromTo(heroImg,
      { filter: "blur(14px)", scale: 1.12 },
      { filter: "blur(0px)", scale: 1.06, duration: 1.6, ease: "power2.out", clearProps: "filter" });
    if (heroMark) gsap.fromTo(heroMark,
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", delay: .2 });
  }

  if (!el){ focusHero(); return; }
  if (reduceMotion){ el.remove(); if (heroImg){ heroImg.style.filter = "none"; } return; }

  const mark = el.querySelector(".loader__mark");
  const bar = el.querySelector(".loader__bar");
  const label = el.querySelector(".loader__label");
  const curtain = el.querySelector(".loader__curtain");

  const tl = gsap.timeline({
    defaults: { ease: "power2.out" },
    onComplete(){ el.remove(); }
  });
  tl.to(mark, { opacity: 1, duration: .65 })
    .to(label, { opacity: 1, duration: .4 }, "-=.3")
    .to({}, {
      duration: 1.05, ease: "power2.inOut",
      onUpdate(){
        const p = this.progress() * 100;
        bar.style.background = `linear-gradient(90deg, #f7f3ea ${p}%, rgba(247,243,234,.14) ${p}%)`;
      }
    }, "-=.1")
    .add(focusHero, "+=.1")
    .to(curtain, { yPercent: -100, duration: .85, ease: "expo.inOut" }, "<")
    .to(el, { autoAlpha: 0, duration: .25 }, "-=.2");
})();

/* ==========================================================
   01 · NAV — só aparece depois do hero
   ========================================================== */
(function nav(){
  const nav = document.getElementById("siteNav");
  if (!nav) return;
  const hero = document.querySelector(".hero");
  if (!hero || nav.dataset.always === "true"){
    nav.classList.add("is-visible");
    return;
  }
  function update(){
    nav.classList.toggle("is-visible", window.scrollY > hero.offsetHeight - 90);
  }
  update();
  window.addEventListener("scroll", update, { passive: true });
})();

/* ==========================================================
   02 · REVEALS + máscaras de título
   ========================================================== */
(function reveals(){
  const items = document.querySelectorAll(".reveal");
  if (reduceMotion){ items.forEach(i => i.classList.add("is-in")); }
  else if (items.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting){ e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
    items.forEach(i => io.observe(i));
  }

  if (!reduceMotion){
    document.querySelectorAll(".mask__in").forEach(elm => {
      gsap.to(elm, {
        y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: elm.closest(".mask"), start: "top 88%" }
      });
    });
  }
})();

/* ==========================================================
   03 · HERO — grid de pontos sutil
   ========================================================== */
(function heroDots(){
  const canvas = document.getElementById("heroDots");
  if (!canvas) return;
  const hero = canvas.closest(".hero");
  const ctx = canvas.getContext("2d");
  let w, h, cols, rows, gap = 34, dpr = Math.min(window.devicePixelRatio || 1, 2);
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
        const inf = Math.max(0, 1 - dist / 240);
        ctx.beginPath();
        ctx.fillStyle = `rgba(247,243,234,${0.07 + inf * 0.4})`;
        ctx.arc(x, y, 1 + inf * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (running) raf = requestAnimationFrame(draw);
  }
  function start(){ if (!running){ running = true; draw(); } }
  function stop(){ running = false; cancelAnimationFrame(raf); }

  resize();
  if (reduceMotion){ draw(); return; }
  hero.addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()))
    .observe(hero);
  window.addEventListener("resize", resize);
})();

/* ==========================================================
   04 · MASTERPLAN — zoom por área (estilo oftheoak)
   Coordenadas em % sobre assets/web/vista-aerea-park.jpg
   ========================================================== */
const AREAS = [
  { x: 12, y: 27, eyebrow: "Acesso e operação", title: "Portaria & Estacionamento de caminhões",
    val: "Administração · acessos indústria · 3.510 m²",
    desc: "Entrada operacional do Park, com controle de acesso dedicado para caminhões e visitantes.",
    img: "assets/web/internas-01.jpg" },
  { x: 7, y: 46, eyebrow: "Infraestrutura", title: "E.T.E. / E.T.A. & Subestação",
    val: "Tratamento de água e efluentes · 10.650 m² · subestação 11.375 m²",
    desc: "Energia de duas usinas (Itaipu e Yacyretá) e tratamento próprio — operação industrial contínua.",
    img: "assets/web/internas-06.jpg" },
  { x: 7, y: 66, eyebrow: "Serviços rodoviários", title: "Clube do Caminhoneiro",
    val: "40.065 m² · pátio, posto, restaurante e salão de jogos",
    desc: "O motorista descansa dentro do Park, não na rodovia — apoio completo à logística.",
    img: "assets/web/internas-02.jpg" },
  { x: 45, y: 46, eyebrow: "Área industrial", title: "Lotes industriais & Built-to-Suit",
    val: "989.642 m² de lotes · módulos de 40.000 m²",
    desc: "Galpões sob medida, venda ou locação, erguidos com o Steel Frame do próprio grupo.",
    img: "assets/web/internas-07.jpg" },
  { x: 48, y: 78, eyebrow: "Aeroporto corporativo", title: "Pista de pouso & Heliponto",
    val: "1.480 m de pista · hangar, lounge e abastecimento",
    desc: "Acesso executivo direto ao Park, sem depender de Assunção.",
    img: "assets/web/vista-aerea-park.jpg" },
  { x: 72, y: 13, eyebrow: "Hospitalidade & eventos", title: "Hotel & Centro de Convenções",
    val: "384 studios · 13.500 m² de convenções · 1.700 vagas",
    desc: "Hospedagem executiva, feiras e lançamentos setoriais dentro do masterplan.",
    img: "assets/web/hero-hotel-noturno.jpg" },
  { x: 84, y: 22, eyebrow: "Bracerum Resort", title: "Condomínio & Clube",
    val: "141 lotes · 142.067 m² · lago, quadras e campo society",
    desc: "Residências e lazer para a comunidade corporativa do parque.",
    img: "assets/renders/condominio-casa-fachada.jpg" },
];

(function masterplan(){
  const section = document.querySelector(".masterplan");
  const viewport = document.getElementById("mpViewport");
  const stage = document.getElementById("mpStage");
  const pinsWrap = document.getElementById("mpPins");
  const card = document.getElementById("areaCard");
  const back = document.getElementById("mpBack");
  if (!viewport || !stage) return;

  const cardImg = card.querySelector(".area-card__media img");
  const cardEyebrow = card.querySelector(".area-card__eyebrow");
  const cardTitle = card.querySelector(".area-card__title");
  const cardVal = card.querySelector(".area-card__val");
  const cardDesc = card.querySelector(".area-card__desc");
  let active = -1;

  AREAS.forEach((a, i) => {
    const pin = document.createElement("button");
    pin.className = "pin";
    pin.style.left = a.x + "%";
    pin.style.top = a.y + "%";
    pin.setAttribute("aria-label", "Explorar: " + a.title);
    pin.innerHTML = `<span class="pin__dot"></span><span class="pin__tag">${a.title.split("&")[0].trim()}</span>`;
    pin.addEventListener("click", () => zoomTo(i));
    pinsWrap.appendChild(pin);
  });

  function fillCard(a){
    cardImg.src = a.img; cardImg.alt = a.title;
    cardEyebrow.textContent = a.eyebrow;
    cardTitle.textContent = a.title;
    cardVal.textContent = a.val;
    cardDesc.textContent = a.desc;
    // cartão do lado oposto ao ponto focado
    if (a.x < 45){ card.style.left = "auto"; card.style.right = "var(--gap)"; }
    else { card.style.right = "auto"; card.style.left = "var(--gap)"; }
  }

  function setStage(s, x, y, cb){
    if (hasGsap){
      gsap.to(stage, { scale: s, x, y, duration: reduceMotion ? 0 : 1.15, ease: "power3.inOut", onComplete: cb });
    } else {
      stage.style.transition = "transform .9s cubic-bezier(.19,.8,.22,1)";
      stage.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
      if (cb) setTimeout(cb, 900);
    }
  }

  function zoomTo(i){
    active = (i + AREAS.length) % AREAS.length;
    const a = AREAS[active];
    const w = viewport.offsetWidth, h = viewport.offsetHeight;
    const s = window.innerWidth < 720 ? 2.7 : 2.2;
    const maxX = (s - 1) / 2 * w, maxY = (s - 1) / 2 * h;
    const tx = Math.max(-maxX, Math.min(maxX, (0.5 - a.x / 100) * w * s));
    const ty = Math.max(-maxY, Math.min(maxY, (0.5 - a.y / 100) * h * s));

    section.classList.add("is-zoomed");
    card.classList.remove("is-open");
    setStage(s, tx, ty, () => { fillCard(a); card.classList.add("is-open"); });
  }

  function resetZoom(){
    active = -1;
    section.classList.remove("is-zoomed");
    card.classList.remove("is-open");
    setStage(1, 0, 0);
  }

  back.addEventListener("click", resetZoom);
  card.querySelector("[data-area-prev]").addEventListener("click", () => zoomTo(active - 1));
  card.querySelector("[data-area-next]").addEventListener("click", () => zoomTo(active + 1));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && active >= 0) resetZoom(); });
  window.addEventListener("resize", () => { if (active >= 0) zoomTo(active); });
})();

/* ==========================================================
   05 · LOCALIZAÇÃO — mapa escuro com labels de distância
   ========================================================== */
const PARK = { lat: -25.771694, lng: -57.732389 };
const ports = [
  { name: "Emb. Puerto Alegre", sub: "Fluvial · atracadouro local", km: "4 km", tempo: "10 min", lat: -25.7930, lng: -57.7565 },
  { name: "Puerto Lobato", sub: "Fluvial · atracadouro local", km: "6 km", tempo: "15 min", lat: -25.8085, lng: -57.7660 },
  { name: "Terport Villeta", sub: "Fluvial · contêineres", km: "23 km", tempo: "20 min", lat: -25.5296, lng: -57.5568 },
  { name: "Puerto Seguro Fluvial", sub: "Fluvial · carga geral", km: "33 km", tempo: "30 min", lat: -25.4728, lng: -57.5539 },
  { name: "Terminal Villa Oliva", sub: "Fluvial · barcaças", km: "38 km", tempo: "50 min", lat: -26.0060, lng: -57.8890 },
  { name: "Caacupemí Villeta", sub: "Fluvial · contêineres", km: "42 km", tempo: "1 h", lat: -25.5060, lng: -57.5450 },
  { name: "Porto de Assunção", sub: "Fluvial · carga geral", km: "71 km", tempo: "1 h 20", lat: -25.2780, lng: -57.6430 },
  { name: "Porto de Alberdi", sub: "Fluvial · local", km: "72 km", tempo: "1 h", lat: -26.1870, lng: -58.1290 },
];
const roads = [
  { name: "Assunção", sub: "Central · PY", km: "65 km", tempo: "1 h 10", lat: -25.2867, lng: -57.6470 },
  { name: "Encarnación", sub: "Itapúa · PY", km: "355 km", tempo: "4 h 40", lat: -27.3306, lng: -55.8667 },
  { name: "Ciudad del Este", sub: "Alto Paraná · PY", km: "360 km", tempo: "5 h", lat: -25.5097, lng: -54.6111 },
  { name: "Foz do Iguaçu", sub: "Brasil", km: "365 km", tempo: "5 h", lat: -25.5163, lng: -54.5854 },
  { name: "Curitiba", sub: "Brasil", km: "1.000 km", tempo: "12 h 30", lat: -25.4284, lng: -49.2733 },
  { name: "Porto Alegre", sub: "Brasil", km: "1.055 km", tempo: "14 h 30", lat: -30.0346, lng: -51.2177 },
  { name: "Córdoba", sub: "Argentina", km: "1.100 km", tempo: "13 h", lat: -31.4201, lng: -64.1888 },
  { name: "Buenos Aires", sub: "Argentina", km: "1.280 km", tempo: "14 h 30", lat: -34.6037, lng: -58.3816 },
];
const refs = [
  { name: "Aeroporto de Assunção (ASU)", sub: "Voos diários a São Paulo", km: "70 km", tempo: "1 h 15", lat: -25.2400, lng: -57.5200 },
  { name: "Subestação da ANDE", sub: "Energia — média/alta tensão", km: "7,4 km", tempo: "10 min", lat: -25.7550, lng: -57.7600 },
];

(function locationMap(){
  const el = document.getElementById("locMap");
  if (!el || typeof L === "undefined") return;
  const map = L.map(el, { zoomControl: false, scrollWheelZoom: true }).setView([PARK.lat, PARK.lng], 10);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19
  }).addTo(map);

  const parkIcon = L.divIcon({
    className: "",
    html: '<div style="width:15px;height:15px;background:#f7f3ea;border:2.5px solid #0e0d0b;transform:rotate(45deg);box-shadow:0 0 0 6px rgba(247,243,234,.18)"></div>',
    iconSize: [15, 15], iconAnchor: [8, 8]
  });
  L.marker([PARK.lat, PARK.lng], { icon: parkIcon }).addTo(map)
    .bindTooltip("Bracerum Park", { permanent: true, direction: "top", offset: [0, -12], className: "map-label map-label--park" });

  const poiIcon = L.divIcon({
    className: "",
    html: '<div style="width:8px;height:8px;background:#cbb88f;border:1.5px solid #0e0d0b"></div>',
    iconSize: [8, 8], iconAnchor: [4, 4]
  });

  const markers = {};
  function addGroup(list, key){
    list.forEach((p, i) => {
      const dir = i % 2 === 0 ? "right" : "left";
      const m = L.marker([p.lat, p.lng], { icon: poiIcon }).addTo(map)
        .bindTooltip(`${p.name} · <b>${p.km}</b> · ${p.tempo}`, {
          permanent: true, direction: dir, offset: [dir === "right" ? 8 : -8, 0], className: "map-label"
        });
      markers[key + p.name] = m;
    });
  }
  addGroup(ports, "port-");
  addGroup(roads, "road-");
  addGroup(refs, "ref-");

  function renderList(ulId, list, key){
    const ul = document.getElementById(ulId);
    if (!ul) return;
    list.forEach(p => {
      const li = document.createElement("li");
      li.className = "dist-item";
      li.innerHTML = `<span>${p.name}</span><b>${p.km}</b><span class="t">${p.tempo}</span>`;
      li.addEventListener("click", () => {
        map.flyTo([p.lat, p.lng], 12, { duration: reduceMotion ? 0 : .8 });
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
      document.querySelectorAll(".loc-acc").forEach(a => {
        a.setAttribute("data-open", "false");
        a.querySelector(".loc-acc__head").setAttribute("aria-expanded", "false");
      });
      acc.setAttribute("data-open", String(!isOpen));
      head.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.getElementById("recenterBtn")?.addEventListener("click", () => {
    map.flyTo([PARK.lat, PARK.lng], 10, { duration: reduceMotion ? 0 : .8 });
  });
})();

/* ==========================================================
   06 · COMO FUNCIONA — infográfico pinado (estilo freehand)
   ========================================================== */
(function stepsPinned(){
  const pin = document.getElementById("stepsPin");
  const list = document.getElementById("stepsList");
  if (!pin || !list) return;
  const steps = list.querySelectorAll(".step");
  const fill = document.getElementById("stepsFill");
  const counter = document.getElementById("stepsCounter");
  const n = steps.length;

  function setActive(i){
    steps.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    if (counter) counter.textContent = String(i + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
  }

  if (reduceMotion || window.innerWidth < 900){
    steps.forEach(s => s.classList.add("is-active"));
    if (fill) fill.style.transform = "scaleX(1)";
    return;
  }

  ScrollTrigger.create({
    trigger: pin,
    start: "top top",
    end: "+=" + (n * 420),
    pin: true,
    scrub: true,
    onUpdate(self){
      const p = self.progress;
      if (fill) fill.style.transform = `scaleX(${p})`;
      setActive(Math.min(n - 1, Math.floor(p * n)));
    }
  });
})();

/* ==========================================================
   07 · GALERIA — sanfona
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
})();

/* ==========================================================
   08 · Parallax sutil no hero
   ========================================================== */
if (!reduceMotion){
  const heroBgImg = document.querySelector(".hero__bg img");
  if (heroBgImg){
    gsap.to(heroBgImg, {
      yPercent: 9, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
  }
}
