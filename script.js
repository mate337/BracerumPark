/* ==========================================================
   BRACERUM/PARK — script principal · v6
   Loader, nav, hero (Ken Burns + dots), masterplan com zoom,
   mapa avançado (rio, POIs, rotas, indicador), steps sticky.
   ========================================================== */
document.documentElement.classList.add("js");

const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hasGsap;
if (reduceMotion) document.documentElement.classList.add("no-motion");
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ==========================================================
   00 · LOADER + entrada do hero
   ========================================================== */
(function loader(){
  const el = document.getElementById("loader");
  const heroImg = document.querySelector(".hero__bg img");
  const heroMark = document.getElementById("heroMark");

  function kenBurns(){
    if (reduceMotion || !heroImg) return;
    gsap.to(heroImg, {
      scale: 1.16, xPercent: -1.6, yPercent: 1.2,
      duration: 26, ease: "sine.inOut", repeat: -1, yoyo: true
    });
  }

  function focusHero(){
    if (reduceMotion || !heroImg) return;
    gsap.fromTo(heroImg,
      { filter: "blur(16px)" },
      { filter: "blur(0px)", duration: 1.5, ease: "power2.out", clearProps: "filter", onComplete: kenBurns });
    if (heroMark) gsap.fromTo(heroMark,
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", delay: .2 });
  }

  if (!el){ focusHero(); return; }
  if (reduceMotion){ el.remove(); return; }

  const mark = el.querySelector(".loader__mark");
  const bar = el.querySelector(".loader__bar");
  const label = el.querySelector(".loader__label");
  const curtain = el.querySelector(".loader__curtain");

  const tl = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete(){ el.remove(); } });
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
  if (!hero || nav.dataset.always === "true"){ nav.classList.add("is-visible"); return; }
  function update(){ nav.classList.toggle("is-visible", window.scrollY > hero.offsetHeight - 90); }
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
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
    items.forEach(i => io.observe(i));
  }
  if (!reduceMotion){
    document.querySelectorAll(".mask__in").forEach(elm => {
      gsap.to(elm, { y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: elm.closest(".mask"), start: "top 88%" } });
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
        const inf = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 240);
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
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop())).observe(hero);
  window.addEventListener("resize", resize);
})();

/* ==========================================================
   04 · MASTERPLAN — zoom por área
   Coordenadas em % sobre assets/web/vista-aerea-park.jpg
   ========================================================== */
const AREAS = [
  { x: 25, y: 26, side: "right",
    tag: { pt: "Clube do Caminhoneiro", en: "Truck Drivers' Club", es: "Club del Camionero" },
    eyebrow: { pt: "Serviços rodoviários", en: "Road services", es: "Servicios viales" },
    title: { pt: "Clube do Caminhoneiro", en: "Truck Drivers' Club", es: "Club del Camionero" },
    val: { pt: "40.065 m² · pátio, posto, restaurante e salão de jogos",
           en: "40,065 m² · yard, fuel station, restaurant and game room",
           es: "40.065 m² · patio, estación de servicio, restaurante y salón de juegos" },
    desc: { pt: "O motorista descansa dentro do Park, não na rodovia — apoio completo à logística.",
            en: "Drivers rest inside the Park, not on the highway — full logistics support.",
            es: "El conductor descansa dentro del Park, no en la ruta — apoyo logístico completo." },
    img: "assets/web/internas-02.jpg" },

  { x: 22, y: 33, side: "right",
    tag: { pt: "Portaria", en: "Main gate", es: "Portería" },
    eyebrow: { pt: "Acesso e operação", en: "Access and operations", es: "Acceso y operación" },
    title: { pt: "Portaria & Estacionamento de caminhões", en: "Main gate & Truck parking", es: "Portería y estacionamiento de camiones" },
    val: { pt: "Administração · acessos indústria · 3.510 m²",
           en: "Administration · industrial access · 3,510 m²",
           es: "Administración · accesos industria · 3.510 m²" },
    desc: { pt: "Entrada operacional do Park, com controle de acesso dedicado para caminhões e visitantes.",
            en: "The Park's operational entrance, with dedicated access control for trucks and visitors.",
            es: "Entrada operativa del Park, con control de acceso dedicado para camiones y visitantes." },
    img: "assets/web/internas-01.jpg" },

  { x: 57, y: 35, side: "right",
    tag: { pt: "Fábricas Bracerum", en: "Bracerum factories", es: "Fábricas Bracerum" },
    eyebrow: { pt: "Execução própria", en: "In-house execution", es: "Ejecución propia" },
    title: { pt: "Fábricas Bracerum", en: "Bracerum factories", es: "Fábricas Bracerum" },
    val: { pt: "Steel Frame · Concreto · Pavers", en: "Steel Frame · Concrete · Pavers", es: "Steel Frame · Hormigón · Pavers" },
    desc: { pt: "Três unidades fabris do grupo constroem o parque sem depender de terceiros — prazo, custo e risco de obra comprados.",
            en: "Three of the group's factories build the park without third parties — schedule, cost and construction risk secured.",
            es: "Tres unidades fabriles del grupo construyen el parque sin depender de terceros — plazo, costo y riesgo de obra asegurados." },
    img: "assets/renders/fabrica-bracerum-noturna.jpg" },

  { x: 46, y: 46, side: "right",
    tag: { pt: "Lotes industriais", en: "Industrial lots", es: "Lotes industriales" },
    eyebrow: { pt: "Área industrial", en: "Industrial area", es: "Área industrial" },
    title: { pt: "Lotes industriais & Built-to-Suit", en: "Industrial lots & Built-to-Suit", es: "Lotes industriales y Built-to-Suit" },
    val: { pt: "989.642 m² de lotes · módulos de 40.000 m²",
           en: "989,642 m² of lots · 40,000 m² modules",
           es: "989.642 m² de lotes · módulos de 40.000 m²" },
    desc: { pt: "Galpões sob medida, venda ou locação, erguidos com o Steel Frame do próprio grupo.",
            en: "Made-to-measure warehouses, for sale or lease, built with the group's own Steel Frame.",
            es: "Galpones a medida, venta o alquiler, levantados con el Steel Frame del propio grupo." },
    img: "assets/web/internas-07.jpg" },

  { x: 8, y: 61, side: "right",
    tag: { pt: "ETE / ETA", en: "Water plants", es: "PTAR / PTAP" },
    eyebrow: { pt: "Infraestrutura", en: "Infrastructure", es: "Infraestructura" },
    title: { pt: "E.T.E. / E.T.A. & Subestação", en: "Water & effluent plants and Substation", es: "PTAR / PTAP y Subestación" },
    val: { pt: "Tratamento próprio · 10.650 m² · subestação 11.375 m²",
           en: "On-site treatment · 10,650 m² · substation 11,375 m²",
           es: "Tratamiento propio · 10.650 m² · subestación 11.375 m²" },
    desc: { pt: "Energia de duas usinas (Itaipu e Yacyretá) e tratamento próprio de água e efluentes — operação industrial contínua.",
            en: "Power from two plants (Itaipu and Yacyretá) plus on-site water and effluent treatment — continuous industrial operation.",
            es: "Energía de dos usinas (Itaipú y Yacyretá) y tratamiento propio de agua y efluentes — operación industrial continua." },
    img: "assets/web/internas-06.jpg" },

  { x: 9, y: 73, side: "right",
    tag: { pt: "Hangares", en: "Hangars", es: "Hangares" },
    eyebrow: { pt: "Aviação executiva", en: "Business aviation", es: "Aviación ejecutiva" },
    title: { pt: "Hangares, lounge e abastecimento", en: "Hangars, lounge and refuelling", es: "Hangares, lounge y abastecimiento" },
    val: { pt: "7.686 m² · apoio à aviação executiva", en: "7,686 m² · business aviation support", es: "7.686 m² · apoyo a la aviación ejecutiva" },
    desc: { pt: "Estrutura de hangaragem e abastecimento junto à pista, para a aeronave do investidor ficar no próprio parque.",
            en: "Hangar and refuelling facilities next to the runway, so the investor's aircraft stays inside the park.",
            es: "Estructura de hangaraje y abastecimiento junto a la pista, para que la aeronave del inversor quede en el propio parque." },
    img: "assets/web/vista-aerea-park.jpg" },

  { x: 47, y: 84, side: "right",
    tag: { pt: "Pista de pouso", en: "Runway", es: "Pista de aterrizaje" },
    eyebrow: { pt: "Aeroporto corporativo", en: "Corporate airport", es: "Aeropuerto corporativo" },
    title: { pt: "Pista de pouso & Heliponto", en: "Runway & Helipad", es: "Pista de aterrizaje y Helipuerto" },
    val: { pt: "1.480 m de pista · heliponto próprio", en: "1,480 m runway · own helipad", es: "1.480 m de pista · helipuerto propio" },
    desc: { pt: "Acesso executivo direto ao Park, sem depender de Assunção.",
            en: "Direct executive access to the Park, without depending on Asunción.",
            es: "Acceso ejecutivo directo al Park, sin depender de Asunción." },
    img: "assets/web/vista-aerea-park.jpg" },

  { x: 87, y: 17, side: "left",
    tag: { pt: "Centro de convenções", en: "Convention centre", es: "Centro de convenciones" },
    eyebrow: { pt: "Eventos & negócios", en: "Events & business", es: "Eventos y negocios" },
    title: { pt: "Centro de Convenções", en: "Convention Centre", es: "Centro de Convenciones" },
    val: { pt: "13.500 m² · anfiteatro para 1.200 lugares", en: "13,500 m² · 1,200-seat amphitheatre", es: "13.500 m² · anfiteatro para 1.200 lugares" },
    desc: { pt: "Feiras, lançamentos setoriais e showrooms de marca sob a cobertura envidraçada.",
            en: "Trade fairs, sector launches and brand showrooms under the glazed roof.",
            es: "Ferias, lanzamientos sectoriales y showrooms de marca bajo la cubierta vidriada." },
    img: "assets/renders/pavilhao-eventos-1.jpg" },

  { x: 82, y: 22, side: "left",
    tag: { pt: "Hotel", en: "Hotel", es: "Hotel" },
    eyebrow: { pt: "Hospitalidade", en: "Hospitality", es: "Hospitalidad" },
    title: { pt: "Hotel & Apart-hotel", en: "Hotel & Apart-hotel", es: "Hotel y Apart-hotel" },
    val: { pt: "384 studios de 35 m² · 1.700 vagas", en: "384 studios of 35 m² · 1,700 parking spaces", es: "384 studios de 35 m² · 1.700 plazas" },
    desc: { pt: "Hospedagem executiva dentro do masterplan — a equipe da matriz dorme a minutos da fábrica.",
            en: "Executive accommodation inside the masterplan — head-office teams sleep minutes from the plant.",
            es: "Hospedaje ejecutivo dentro del masterplan — el equipo de la casa matriz duerme a minutos de la fábrica." },
    img: "assets/web/hero-hotel-noturno.jpg" },

  { x: 79, y: 30, side: "left",
    tag: { pt: "Bracerum Resort", en: "Bracerum Resort", es: "Bracerum Resort" },
    eyebrow: { pt: "Condomínio & clube", en: "Residential & club", es: "Condominio y club" },
    title: { pt: "Condomínio Bracerum Resort", en: "Bracerum Resort Residential", es: "Condominio Bracerum Resort" },
    val: { pt: "141 lotes · 142.067 m² · lago, quadras e campo society",
           en: "141 lots · 142,067 m² · lake, courts and football pitch",
           es: "141 lotes · 142.067 m² · lago, canchas y campo de fútbol" },
    desc: { pt: "Residências e lazer para a comunidade corporativa do parque.",
            en: "Homes and leisure for the park's corporate community.",
            es: "Residencias y ocio para la comunidad corporativa del parque." },
    img: "assets/renders/condominio-casa-fachada.jpg" }
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
    pin.dataset.idx = i;
    if (a.side === "left") pin.classList.add("pin--left");
    pin.innerHTML = a.side === "left"
      ? `<span class="pin__tag"></span><span class="pin__dot"></span>`
      : `<span class="pin__dot"></span><span class="pin__tag"></span>`;
    pin.addEventListener("click", () => zoomTo(i));
    pinsWrap.appendChild(pin);
  });

  function renderPins(){
    pinsWrap.querySelectorAll(".pin").forEach(p => {
      const a = AREAS[+p.dataset.idx];
      p.querySelector(".pin__tag").textContent = tr(a.tag);
      p.setAttribute("aria-label", tr(a.title));
    });
  }
  renderPins();

  function fillCard(a){
    cardImg.src = a.img; cardImg.alt = tr(a.title);
    cardEyebrow.textContent = tr(a.eyebrow);
    cardTitle.textContent = tr(a.title);
    cardVal.textContent = tr(a.val);
    cardDesc.textContent = tr(a.desc);
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
  document.addEventListener("langchange", () => {
    renderPins();
    if (active >= 0) fillCard(AREAS[active]);
  });
})();

/* ==========================================================
   05 · LOCALIZAÇÃO — mapa
   ========================================================== */
const PARK = { lat: -25.771694, lng: -57.732389 };

/* Curso aproximado do Rio Paraguai no trecho Assunção → Alberdi */
const RIO_PARAGUAI = [
  [-25.18,-57.58],[-25.28,-57.66],[-25.36,-57.63],[-25.44,-57.59],[-25.52,-57.57],
  [-25.60,-57.61],[-25.68,-57.67],[-25.75,-57.73],[-25.80,-57.77],[-25.88,-57.81],
  [-25.96,-57.86],[-26.04,-57.93],[-26.12,-58.02],[-26.19,-58.13],[-26.30,-58.19],[-26.40,-58.22]
];

const T = {
  port:   { pt: "Porto fluvial", en: "River port", es: "Puerto fluvial" },
  road:   { pt: "Destino rodoviário", en: "Road destination", es: "Destino vial" },
  air:    { pt: "Aeroporto", en: "Airport", es: "Aeropuerto" },
  ref:    { pt: "Infraestrutura", en: "Infrastructure", es: "Infraestructura" },
  cap:    { pt: "Capital · distância aérea", en: "Capital · air distance", es: "Capital · distancia aérea" }
};

const ports = [
  { name: "Terport Villeta", type: T.port, km: "23 km", tempo: "20 min", lat: -25.5296, lng: -57.5568,
    desc: { pt: "Terminal privado de contêineres em Villeta, aberto 24h durante todo o ano. O calado do Rio Paraguai neste trecho permite navegação mesmo no período de seca — sem os gargalos e as filas dos portos de Assunção.",
            en: "Private container terminal in Villeta, open 24/7 all year round. The Paraguay River's draft along this stretch allows navigation even in the dry season — without the bottlenecks and queues of Asunción's ports.",
            es: "Terminal privada de contenedores en Villeta, abierta 24 h todo el año. El calado del Río Paraguay en este tramo permite navegación incluso en época de seca — sin los cuellos de botella ni las filas de los puertos de Asunción." } },
  { name: "Puerto Seguro Fluvial", type: T.port, km: "33 km", tempo: "30 min", lat: -25.4728, lng: -57.5539,
    desc: { pt: "Terminal de carga geral e projeto, com pátio alfandegado. Rota natural para equipamentos industriais e cargas de grande volume que chegam ao parque.",
            en: "General and project cargo terminal with a bonded yard. The natural route for industrial equipment and oversized cargo arriving at the park.",
            es: "Terminal de carga general y de proyecto, con patio aduanero. Ruta natural para equipos industriales y cargas de gran volumen que llegan al parque." } },
  { name: "Caacupemí Villeta", type: T.port, km: "42 km", tempo: "1 h", lat: -25.5060, lng: -57.5450,
    desc: { pt: "Terminal de contêineres com serviço regular de barcaças para Montevidéu e Buenos Aires, conectando a produção do parque ao Atlântico.",
            en: "Container terminal with regular barge service to Montevideo and Buenos Aires, connecting the park's output to the Atlantic.",
            es: "Terminal de contenedores con servicio regular de barcazas a Montevideo y Buenos Aires, conectando la producción del parque al Atlántico." } },
  { name: "Emb. Puerto Alegre", type: T.port, km: "4 km", tempo: "10 min", lat: -25.7930, lng: -57.7565,
    desc: { pt: "Atracadouro local a poucos minutos do portão do parque, usado para cargas de apoio e movimentação regional.",
            en: "Local wharf minutes from the park gate, used for support cargo and regional movements.",
            es: "Atracadero local a pocos minutos del portón del parque, usado para cargas de apoyo y movimiento regional." } },
  { name: "Puerto Lobato", type: T.port, km: "6 km", tempo: "15 min", lat: -25.8085, lng: -57.7660,
    desc: { pt: "Atracadouro fluvial vizinho ao parque, alternativa de curta distância para operações pontuais.",
            en: "River wharf next to the park, a short-distance alternative for occasional operations.",
            es: "Atracadero fluvial vecino al parque, alternativa de corta distancia para operaciones puntuales." } },
  { name: "Terminal Villa Oliva", type: T.port, km: "38 km", tempo: "50 min", lat: -26.0060, lng: -57.8890,
    desc: { pt: "Terminal de barcaças e granéis ao sul de Villeta, com acesso direto à hidrovia.",
            en: "Barge and bulk terminal south of Villeta, with direct waterway access.",
            es: "Terminal de barcazas y graneles al sur de Villeta, con acceso directo a la hidrovía." } },
  { name: "Porto de Assunção", type: T.port, km: "71 km", tempo: "1 h 20", lat: -25.2780, lng: -57.6430,
    desc: { pt: "Porto histórico da capital, hoje voltado a carga geral. Villeta absorveu o fluxo de contêineres por ser mais próxima e menos congestionada.",
            en: "The capital's historic port, today focused on general cargo. Villeta absorbed container flows by being closer and less congested.",
            es: "Puerto histórico de la capital, hoy orientado a carga general. Villeta absorbió el flujo de contenedores por estar más cerca y menos congestionado." } },
  { name: "Porto de Alberdi", type: T.port, km: "72 km", tempo: "1 h", lat: -26.1870, lng: -58.1290,
    desc: { pt: "Terminal fluvial ao sul, próximo à fronteira com a Argentina.",
            en: "Southern river terminal, close to the Argentine border.",
            es: "Terminal fluvial al sur, cerca de la frontera con Argentina." } }
];

const roads = [
  { name: "Assunção", type: T.road, km: "65 km", tempo: "1 h 10", lat: -25.2867, lng: -57.6470,
    desc: { pt: "Capital do Paraguai e sede dos órgãos federais (CNIME, aduana) — ida e volta no mesmo expediente pelo Acceso Sur.",
            en: "Paraguay's capital and seat of the federal bodies (CNIME, customs) — a round trip within the same working day via the Acceso Sur.",
            es: "Capital del Paraguay y sede de los órganos federales (CNIME, aduana) — ida y vuelta en la misma jornada por el Acceso Sur." } },
  { name: "Ciudad del Este", type: T.road, km: "360 km", tempo: "5 h", lat: -25.5097, lng: -54.6111,
    desc: { pt: "Segundo maior polo comercial do país, na tríplice fronteira com Brasil e Argentina.",
            en: "The country's second-largest commercial hub, on the triple border with Brazil and Argentina.",
            es: "Segundo mayor polo comercial del país, en la triple frontera con Brasil y Argentina." } },
  { name: "Foz do Iguaçu", type: T.road, km: "365 km", tempo: "5 h", lat: -25.5163, lng: -54.5854,
    desc: { pt: "Porta de entrada terrestre no Brasil: a carga sai do galpão e cruza a fronteira sem transbordo marítimo.",
            en: "Land gateway into Brazil: cargo leaves the warehouse and crosses the border with no sea transhipment.",
            es: "Puerta de entrada terrestre a Brasil: la carga sale del galpón y cruza la frontera sin transbordo marítimo." } },
  { name: "Curitiba", type: T.road, km: "1.000 km", tempo: "12 h 30", lat: -25.4284, lng: -49.2733,
    desc: { pt: "Um dia de caminhão até o centro industrial do Paraná — menos estoque em trânsito que a rota asiática.",
            en: "One truck day to Paraná's industrial centre — less inventory in transit than the Asian route.",
            es: "Un día de camión hasta el centro industrial de Paraná — menos stock en tránsito que la ruta asiática." } },
  { name: "Porto Alegre", type: T.road, km: "1.055 km", tempo: "14 h 30", lat: -30.0346, lng: -51.2177,
    desc: { pt: "Acesso rodoviário direto ao Rio Grande do Sul pela BR-386.",
            en: "Direct road access to Rio Grande do Sul via the BR-386.",
            es: "Acceso vial directo a Rio Grande do Sul por la BR-386." } },
  { name: "Encarnación", type: T.road, km: "355 km", tempo: "4 h 40", lat: -27.3306, lng: -55.8667,
    desc: { pt: "Fronteira com Posadas (Argentina) pela Ruta 1.",
            en: "Border with Posadas (Argentina) via Ruta 1.",
            es: "Frontera con Posadas (Argentina) por la Ruta 1." } },
  { name: "Buenos Aires", type: T.road, km: "1.280 km", tempo: "14 h 30", lat: -34.6037, lng: -58.3816,
    desc: { pt: "Maior mercado consumidor da Argentina, com tarifa zero pelo Certificado de Origem Mercosul.",
            en: "Argentina's largest consumer market, at zero tariff under the Mercosur Certificate of Origin.",
            es: "Mayor mercado consumidor de Argentina, con arancel cero por el Certificado de Origen Mercosur." } },
  { name: "Córdoba", type: T.road, km: "1.100 km", tempo: "13 h", lat: -31.4201, lng: -64.1888,
    desc: { pt: "Polo automotivo e agroindustrial argentino, acessível pela RN 16.",
            en: "Argentina's automotive and agro-industrial hub, reached via RN 16.",
            es: "Polo automotriz y agroindustrial argentino, accesible por la RN 16." } }
];

const airports = [
  { name: "Aeroporto Silvio Pettirossi (ASU)", type: T.air, km: "70 km", tempo: "1 h 15", lat: -25.2400, lng: -57.5200,
    desc: { pt: "Aeroporto internacional de Assunção, com voos diários diretos para São Paulo (~2 h). Do portão de embarque ao portão do parque em cerca de uma hora.",
            en: "Asunción's international airport, with daily direct flights to São Paulo (~2 h). From boarding gate to park gate in about an hour.",
            es: "Aeropuerto internacional de Asunción, con vuelos diarios directos a São Paulo (~2 h). De la puerta de embarque al portón del parque en cerca de una hora." } },
  { name: "Pista do Bracerum Park", type: T.air, km: "0 km", tempo: "—", lat: -25.7790, lng: -57.7290,
    desc: { pt: "Pista de 1.480 m e heliponto dentro do masterplan, com hangar, lounge e abastecimento — acesso executivo sem depender de Assunção.",
            en: "A 1,480 m runway and helipad inside the masterplan, with hangar, lounge and refuelling — executive access without depending on Asunción.",
            es: "Pista de 1.480 m y helipuerto dentro del masterplan, con hangar, lounge y abastecimiento — acceso ejecutivo sin depender de Asunción." } },
  { name: "Aeroporto Guaraní (AGT)", type: T.air, km: "350 km", tempo: "4 h 50", lat: -25.4547, lng: -54.8428,
    desc: { pt: "Segundo aeroporto internacional do país, em Ciudad del Este, junto à fronteira brasileira.",
            en: "The country's second international airport, in Ciudad del Este, next to the Brazilian border.",
            es: "Segundo aeropuerto internacional del país, en Ciudad del Este, junto a la frontera brasileña." } }
];

/* Distâncias aéreas a partir de Assunção (ASU) — aproximadas */
const capitals = [
  { name: "São Paulo (GRU)", type: T.cap, km: "1.130 km", tempo: "~2 h", lat: -23.4356, lng: -46.4731,
    desc: { pt: "Voos diários diretos. Ida e volta no mesmo dia é rotina para quem opera no parque.",
            en: "Daily direct flights. A same-day round trip is routine for those operating at the park.",
            es: "Vuelos diarios directos. Ida y vuelta en el mismo día es rutina para quien opera en el parque." } },
  { name: "Curitiba (CWB)", type: T.cap, km: "840 km", tempo: "~1 h 40", lat: -25.5285, lng: -49.1758,
    desc: { pt: "A capital brasileira mais próxima de Villeta em linha reta.",
            en: "The closest Brazilian capital to Villeta as the crow flies.",
            es: "La capital brasileña más cercana a Villeta en línea recta." } },
  { name: "Porto Alegre (POA)", type: T.cap, km: "820 km", tempo: "~1 h 40", lat: -29.9939, lng: -51.1711,
    desc: { pt: "Distância aérea menor que São Paulo–Recife.",
            en: "A shorter air distance than São Paulo–Recife.",
            es: "Distancia aérea menor que São Paulo–Recife." } },
  { name: "Florianópolis (FLN)", type: T.cap, km: "930 km", tempo: "~1 h 50", lat: -27.6705, lng: -48.5477,
    desc: { pt: "Capital catarinense, região de origem de boa parte do capital industrial que migra para a maquila.",
            en: "Capital of Santa Catarina, home region of much of the industrial capital moving into the maquila regime.",
            es: "Capital de Santa Catarina, región de origen de buena parte del capital industrial que migra a la maquila." } },
  { name: "Brasília (BSB)", type: T.cap, km: "1.450 km", tempo: "~2 h 20", lat: -15.8711, lng: -47.9186,
    desc: { pt: "Capital federal brasileira, com conexões diárias via São Paulo.",
            en: "Brazil's federal capital, with daily connections via São Paulo.",
            es: "Capital federal brasileña, con conexiones diarias vía São Paulo." } },
  { name: "Rio de Janeiro (GIG)", type: T.cap, km: "1.470 km", tempo: "~2 h 30", lat: -22.8100, lng: -43.2506,
    desc: { pt: "Mesma faixa de tempo de voo que um trecho doméstico brasileiro de média distância.",
            en: "The same flight-time range as a medium-haul domestic Brazilian leg.",
            es: "El mismo rango de tiempo de vuelo que un tramo doméstico brasileño de media distancia." } },
  { name: "Belo Horizonte (CNF)", type: T.cap, km: "1.520 km", tempo: "~2 h 30", lat: -19.6244, lng: -43.9719,
    desc: { pt: "Polo siderúrgico e automotivo de Minas Gerais.",
            en: "Minas Gerais' steel and automotive hub.",
            es: "Polo siderúrgico y automotriz de Minas Gerais." } }
];

const refs = [
  { name: "Subestação da ANDE", type: T.ref, km: "7,4 km", tempo: "10 min", lat: -25.7550, lng: -57.7600, img: "assets/renders/rodovia-acesso.jpg",
    desc: { pt: "Subestação de média e alta tensão a 7 km do terreno, alimentada por Itaipu e Yacyretá — redundância energética para operação industrial contínua, com tarifa cerca de 60% menor que a média brasileira.",
            en: "Medium and high-voltage substation 7 km from the site, fed by Itaipu and Yacyretá — power redundancy for continuous industrial operation, at a tariff roughly 60% below the Brazilian average.",
            es: "Subestación de media y alta tensión a 7 km del terreno, alimentada por Itaipú y Yacyretá — redundancia energética para operación industrial continua, con tarifa cerca de 60% menor que la media brasileña." } }
];

(function locationMap(){
  const el = document.getElementById("locMap");
  if (!el || typeof L === "undefined" || !L.map) return;

  const map = L.map(el, { zoomControl: false, scrollWheelZoom: true }).setView([PARK.lat, PARK.lng], 10);
  L.control.zoom({ position: "bottomright" }).addTo(map);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19
  }).addTo(map);

  /* --- Rio Paraguai em azul-claro --- */
  L.polyline(RIO_PARAGUAI, { color: "#3f7fa8", weight: 16, opacity: .28, lineJoin: "round" }).addTo(map);
  L.polyline(RIO_PARAGUAI, { color: "#7cc3e8", weight: 5, opacity: .75, lineJoin: "round" }).addTo(map)
    .bindTooltip("Rio Paraguai · Hidrovia Paraná–Paraguai", { sticky: true, className: "map-label" });

  /* --- Park --- */
  const parkIcon = L.divIcon({
    className: "",
    html: '<div style="width:15px;height:15px;background:#f7f3ea;border:2.5px solid #0e0d0b;transform:rotate(45deg);box-shadow:0 0 0 6px rgba(247,243,234,.18)"></div>',
    iconSize: [15, 15], iconAnchor: [8, 8]
  });
  L.marker([PARK.lat, PARK.lng], { icon: parkIcon, zIndexOffset: 1000 }).addTo(map)
    .bindTooltip("Bracerum Park", { permanent: true, direction: "top", offset: [0, -12], className: "map-label map-label--park" });

  const icons = {
    port: '<div style="width:9px;height:9px;background:#7cc3e8;border:1.5px solid #0e0d0b"></div>',
    road: '<div style="width:9px;height:9px;background:#cbb88f;border:1.5px solid #0e0d0b"></div>',
    air:  '<div style="width:11px;height:11px;background:#f7f3ea;border:1.5px solid #0e0d0b;transform:rotate(45deg)"></div>',
    ref:  '<div style="width:9px;height:9px;background:#9c9484;border:1.5px solid #0e0d0b"></div>'
  };
  const mkIcon = kind => L.divIcon({ className: "", html: icons[kind], iconSize: [10, 10], iconAnchor: [5, 5] });

  /* --- Card de POI --- */
  const card = document.getElementById("poiCard");
  const cEl = {
    media: card.querySelector(".poi-card__media"),
    type: card.querySelector(".poi-card__type"),
    title: card.querySelector(".poi-card__title"),
    km: card.querySelector("[data-poi-km]"),
    time: card.querySelector("[data-poi-time]"),
    desc: card.querySelector(".poi-card__desc"),
    route: card.querySelector(".poi-card__route")
  };
  let currentPoi = null;

  function openCard(p){
    currentPoi = p;
    cEl.type.textContent = tr(p.type);
    cEl.title.textContent = p.name;
    cEl.km.textContent = p.km;
    cEl.time.textContent = p.tempo;
    cEl.desc.textContent = tr(p.desc);
    cEl.media.innerHTML = p.img
      ? `<img src="${p.img}" alt="${p.name}" />`
      : `<span class="poi-card__ph" data-i18n="loc.photoSlot">Foto do local</span>`;
    card.classList.add("is-open");
  }
  function closeCard(){ card.classList.remove("is-open"); currentPoi = null; }
  card.querySelector(".poi-card__close").addEventListener("click", closeCard);
  cEl.route.addEventListener("click", () => { if (currentPoi) drawRoute(currentPoi); });

  /* --- Rota indicativa a partir do Park --- */
  let routeLayer = null;
  function arcPoints(a, b, bend = .18, n = 64){
    const pts = [];
    const midLat = (a[0] + b[0]) / 2, midLng = (a[1] + b[1]) / 2;
    const dLat = b[0] - a[0], dLng = b[1] - a[1];
    const cLat = midLat - dLng * bend, cLng = midLng + dLat * bend;
    for (let i = 0; i <= n; i++){
      const t = i / n, mt = 1 - t;
      pts.push([
        mt * mt * a[0] + 2 * mt * t * cLat + t * t * b[0],
        mt * mt * a[1] + 2 * mt * t * cLng + t * t * b[1]
      ]);
    }
    return pts;
  }
  function drawRoute(p){
    if (routeLayer) map.removeLayer(routeLayer);
    const pts = arcPoints([PARK.lat, PARK.lng], [p.lat, p.lng]);
    routeLayer = L.layerGroup([
      L.polyline(pts, { color: "#cbb88f", weight: 2.5, opacity: .9, dashArray: "6 7" }),
      L.polyline(pts, { color: "#cbb88f", weight: 10, opacity: .12 })
    ]).addTo(map);
    map.fitBounds(L.latLngBounds([[PARK.lat, PARK.lng], [p.lat, p.lng]]), {
      padding: [90, 90], maxZoom: 12, animate: !reduceMotion, duration: .9
    });
  }

  /* --- Marcadores --- */
  const groups = [
    { list: ports, kind: "port", ulId: "portList" },
    { list: roads, kind: "road", ulId: "roadList" },
    { list: airports, kind: "air", ulId: "airportList" },
    { list: capitals, kind: "air", ulId: "capitalList" },
    { list: refs, kind: "ref", ulId: "refList" }
  ];

  function haversine(a, b){
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  groups.forEach(g => {
    g.list.forEach((p, i) => {
      const dir = i % 2 === 0 ? "right" : "left";
      const m = L.marker([p.lat, p.lng], { icon: mkIcon(g.kind) }).addTo(map);
      m.bindTooltip(`${p.name} · <b>${p.km}</b> · ${p.tempo}`, {
        permanent: true, direction: dir, offset: [dir === "right" ? 9 : -9, 0], className: "map-label"
      });
      m.on("click", () => openCard(p));
      p._marker = m;
      // pontos muito próximos do Park só ganham rótulo quando há zoom suficiente
      p._minZoom = haversine(PARK, p) < 12 ? 11 : 0;
    });
  });

  function declutter(){
    const z = map.getZoom();
    groups.forEach(g => g.list.forEach(p => {
      const tip = p._marker.getTooltip();
      if (tip) tip.setOpacity(z >= p._minZoom ? 1 : 0);
    }));
  }
  map.on("zoomend", declutter);
  declutter();

  function renderLists(){
    groups.forEach(g => {
      const ul = document.getElementById(g.ulId);
      if (!ul) return;
      ul.innerHTML = "";
      g.list.forEach(p => {
        const li = document.createElement("li");
        li.className = "dist-item";
        li.innerHTML = `<span>${p.name}</span><b>${p.km}</b><span class="t">${p.tempo}</span>`;
        li.addEventListener("click", () => {
          document.querySelectorAll(".dist-item").forEach(d => d.classList.remove("is-active"));
          li.classList.add("is-active");
          drawRoute(p);
          openCard(p);
        });
        ul.appendChild(li);
      });
      g.list.forEach(p => p._marker.setTooltipContent(`${p.name} · <b>${p.km}</b> · ${p.tempo}`));
    });
  }
  renderLists();

  /* --- Sanfonas do painel --- */
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
    if (routeLayer){ map.removeLayer(routeLayer); routeLayer = null; }
    document.querySelectorAll(".dist-item").forEach(d => d.classList.remove("is-active"));
    closeCard();
    map.flyTo([PARK.lat, PARK.lng], 10, { duration: reduceMotion ? 0 : .8 });
  });

  /* --- Indicador: onde está o Park quando ele sai da tela --- */
  const indicator = document.getElementById("parkIndicator");
  const indArrow = indicator?.querySelector(".park-indicator__arrow");
  const indDist = indicator?.querySelector("[data-park-dist]");

  function updateIndicator(){
    if (!indicator) return;
    const parkLL = L.latLng(PARK.lat, PARK.lng);
    if (map.getBounds().contains(parkLL)){ indicator.classList.remove("is-on"); return; }

    const size = map.getSize();
    const pt = map.latLngToContainerPoint(parkLL);
    const cx = size.x / 2, cy = size.y / 2;
    const dx = pt.x - cx, dy = pt.y - cy;
    const angle = Math.atan2(dy, dx);

    const pad = 74;
    const halfW = Math.max(20, cx - pad), halfH = Math.max(20, cy - pad);
    const scale = Math.min(halfW / Math.abs(dx || 1e-6), halfH / Math.abs(dy || 1e-6));
    const x = cx + dx * scale, y = cy + dy * scale;

    indicator.style.left = x + "px";
    indicator.style.top = y + "px";
    indicator.style.transform = "translate(-50%,-50%)";
    indArrow.style.transform = `rotate(${angle + Math.PI / 2}rad)`;

    const center = map.getCenter();
    const km = haversine({ lat: center.lat, lng: center.lng }, PARK);
    indDist.textContent = (km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString("pt-BR")) + " km";
    indicator.classList.add("is-on");
  }
  map.on("move zoom resize", updateIndicator);
  setTimeout(updateIndicator, 400);

  document.addEventListener("langchange", () => {
    renderLists();
    if (currentPoi) openCard(currentPoi);
  });
})();

/* ==========================================================
   06 · COMO FUNCIONA — sticky + IntersectionObserver
   ========================================================== */
(function steps(){
  const list = document.getElementById("stepsList");
  if (!list) return;
  const items = [...list.querySelectorAll(".step")];
  const shots = [...document.querySelectorAll(".steps__visual img")];
  const fill = document.getElementById("stepsFill");
  const counter = document.getElementById("stepsCounter");
  const n = items.length;
  let active = -1;

  function setActive(i){
    if (i === active) return;
    active = i;
    items.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    shots.forEach((im, idx) => im.classList.toggle("is-active", idx === i));
    if (counter) counter.textContent = String(i + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    if (fill) fill.style.transform = `scaleX(${(i + 1) / n})`;
  }

  if (reduceMotion || window.innerWidth < 900){
    items.forEach(s => s.classList.add("is-active"));
    shots[0]?.classList.add("is-active");
    if (fill) fill.style.transform = "scaleX(1)";
    if (counter) counter.textContent = "01 / " + String(n).padStart(2, "0");
    return;
  }

  setActive(0);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setActive(items.indexOf(e.target)); });
  }, { rootMargin: "-46% 0px -46% 0px", threshold: 0 });
  items.forEach(s => io.observe(s));
})();

/* ==========================================================
   07 · GALERIA — sanfona
   ========================================================== */
(function galleryAccordion(){
  const wrap = document.getElementById("galleryAccordion");
  if (!wrap) return;
  const panels = wrap.querySelectorAll(".gallery-panel");
  function activate(panel){ panels.forEach(p => p.classList.toggle("is-active", p === panel)); }
  panels.forEach(p => {
    p.addEventListener("mouseenter", () => { if (window.matchMedia("(hover:hover)").matches) activate(p); });
    p.addEventListener("click", () => activate(p));
  });
})();

/* ==========================================================
   08 · Parallax — hero e bandas de imagem
   ========================================================== */
if (!reduceMotion){
  const heroBgImg = document.querySelector(".hero__bg img");
  if (heroBgImg){
    gsap.to(heroBgImg, { yPercent: 9, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }
  document.querySelectorAll(".img-band").forEach(band => {
    const img = band.querySelector("img");
    if (!img) return;
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none",
      scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
  });
}
