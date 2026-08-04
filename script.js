/* ==========================================================
   BRACERUM/PARK — script principal · v3
   ========================================================== */

/* ---------- Placeholder (usado se alguma imagem faltar em /assets) ---------- */
window.buildPlaceholder = function (title, ratio) {
  const div = document.createElement("div");
  div.className = "placeholder " + (ratio === "4/3" ? "placeholder--43" : "placeholder--169");
  div.innerHTML = `<span class="ph-title">${title}</span><small>adicione a imagem em /assets</small>`;
  return div;
};

/* ---------- Nav: transparente sobre o hero, sólida ao rolar ---------- */
const siteNav = document.getElementById("siteNav");
function updateNav() {
  const past = window.scrollY > window.innerHeight * 0.72;
  siteNav.classList.toggle("nav--transparent", !past);
}
updateNav();
window.addEventListener("scroll", updateNav, { passive: true });

/* ==========================================================
   02 · MASTERPLAN — Maquete virtual 3D interativa
   ========================================================== */
(function () {
  const fmtArea = (n) => n.toLocaleString("pt-BR") + " m²";
  const catLabel = {
    industrial: "Galpão Industrial", logistico: "Galpão Logístico / Doca",
    comercial: "Módulo Comercial", institucional: "Institucional",
    residencial: "Residencial", infra: "Infraestrutura",
  };

  const seq = (prefix, count, area, cat, zone, h, soldIdx = []) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${zone}-${i + 1}`,
      name: `${prefix} ${String(i + 1).padStart(2, "0")}`,
      area, cat, zone, h,
      status: soldIdx.includes(i + 1) ? "vendido" : "disponivel",
    }));

  const mpLots = [
    // Setor Industrial A — galpões de 18.000 m²
    ...seq("Galpão A", 8, 18000, "industrial", "industA", 11, [3, 4]),
    // Setor Industrial B — galpões de 9.900 m²
    ...seq("Galpão B", 16, 9900, "industrial", "industB", 10, [1, 2, 3, 4, 5, 6, 7]),
    // Setor Industrial C — galpões médios
    { id: "industC-1", name: "Galpão C 01", area: 14400, cat: "industrial", zone: "industC", h: 11, status: "disponivel" },
    { id: "industC-2", name: "Galpão C 02", area: 14400, cat: "industrial", zone: "industC", h: 11, status: "disponivel" },
    { id: "industC-3", name: "Galpão C 03", area: 14400, cat: "industrial", zone: "industC", h: 11, status: "disponivel" },
    { id: "industC-4", name: "Galpão C 04", area: 10800, cat: "industrial", zone: "industC", h: 10, status: "disponivel" },
    { id: "industC-5", name: "Galpão C 05", area: 10800, cat: "industrial", zone: "industC", h: 10, status: "disponivel" },
    { id: "industC-6", name: "Galpão C 06", area: 13500, cat: "industrial", zone: "industC", h: 10, status: "disponivel" },
    { id: "industC-7", name: "Galpão C 07", area: 5400,  cat: "industrial", zone: "industC", h: 8,  status: "disponivel" },
    ...seq("Galpão C", 5, 4950, "industrial", "industC", 8).map((l, i) => ({ ...l, id: `industC-${8 + i}`, name: `Galpão C ${String(8 + i).padStart(2, "0")}` })),
    // Setor Logístico — docas
    { id: "log-1", name: "Doca 01", area: 13050, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    { id: "log-2", name: "Doca 02", area: 13050, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    { id: "log-3", name: "Doca 03", area: 13050, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    { id: "log-4", name: "Doca 04", area: 13050, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    { id: "log-5", name: "Doca 05", area: 14298, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    { id: "log-6", name: "Doca 06", area: 16288, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    { id: "log-7", name: "Doca 07", area: 18258, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    { id: "log-8", name: "Doca 08", area: 14298, cat: "logistico", zone: "logI", h: 9, status: "disponivel" },
    // Módulos comerciais / apoio
    ...seq("Módulo Comercial", 6, 3150, "comercial", "comI", 7),
    // Institucional / cidade
    { id: "inst-hotel", name: "Hotel", area: 30000, extra: "384 studios", cat: "institucional", zone: "inst1", h: 30 },
    { id: "inst-conv", name: "Centro de Convenções", area: 13500, cat: "institucional", zone: "inst1", h: 15 },
    { id: "inst-anf", name: "Anfiteatro", area: null, extra: "1.200 lugares", cat: "institucional", zone: "inst1", h: 6 },
    { id: "inst-adm", name: "Administração / Portaria Business", area: 3800, cat: "institucional", zone: "inst1", h: 12 },
    { id: "inst-tec", name: "Praça · Centro Tecnológico", area: 10940, cat: "institucional", zone: "inst1", h: 9 },
    { id: "inst-eventos", name: "Salão de Eventos", area: 3200, cat: "institucional", zone: "inst1", h: 10 },
    { id: "inst-lojas", name: "Academia / Lojas / Lanchonetes", area: 5489, cat: "institucional", zone: "inst1", h: 7 },
    { id: "inst-refeitorio", name: "Refeitório (por piso)", area: 4458, cat: "institucional", zone: "inst1", h: 9 },
    { id: "inst-escritorios", name: "Escritórios / Coworking (por piso)", area: 13500, cat: "institucional", zone: "inst1", h: 14 },
    { id: "inst-hangar", name: "Hangar", area: 8246, cat: "institucional", zone: "inst1", h: 16 },
    { id: "inst-quadras", name: "Quadras / Campos", area: 5000, cat: "institucional", zone: "inst1", h: 2 },
    // Residencial
    { id: "resid-1", name: "Bairro Residencial · 78 lotes", area: 79200, extra: "≈ 1.015 m² por lote, em média", cat: "residencial", zone: "resid", h: 8 },
    // Infraestrutura
    { id: "infra-lago1", name: "Lago Norte", area: null, extra: "Espelho d'água paisagístico", cat: "infra", zone: "infra", h: 1, water: true },
    { id: "infra-lago2", name: "Lago Sul", area: null, extra: "Espelho d'água paisagístico", cat: "infra", zone: "infra", h: 1, water: true },
    { id: "infra-ete1", name: "E.T.E. / E.T.A. 01", area: 6160, cat: "infra", zone: "infra", h: 10 },
    { id: "infra-ete2", name: "E.T.E. / E.T.A. 02", area: 31015, cat: "infra", zone: "infra", h: 10 },
    { id: "infra-amb", name: "Ambulatório / Resgate / Brigadistas", area: 1140, cat: "infra", zone: "infra", h: 7 },
    { id: "infra-estac", name: "Estacionamentos", area: null, extra: "1.800 vagas (cidade/hotel) + 406 vagas (park)", cat: "infra", zone: "infra", h: 1 },
    // Entrada
    { id: "entry-1", name: "Portaria Principal", area: 3800, cat: "institucional", zone: "entry", h: 10 },
    // Pista
    { id: "runway-1", name: "Pista de Pouso e Decolagem + Heliponto", area: 142988, extra: "1.325 m de extensão · área de escape e manobra", cat: "infra", zone: "runway", h: 1 },
  ];

  const mpWorld = document.getElementById("mpWorld");
  const zoneOrder = ["entry", "industA", "industB", "industC", "logI", "comI", "inst1", "resid", "infra", "runway"];
  const zones = {};
  zoneOrder.forEach((z) => {
    const div = document.createElement("div");
    div.className = "mp__zone";
    div.dataset.zone = z;
    zones[z] = div;
    mpWorld.appendChild(div);
  });

  mpLots.forEach((lot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `lot lot--${lot.cat}` + (lot.water ? " is-water" : "") + (lot.status === "vendido" ? " is-sold" : "");
    btn.style.setProperty("--h", (lot.h || 8) + "px");
    btn.dataset.id = lot.id;
    btn.dataset.cat = lot.cat;
    btn.setAttribute("aria-label", `${lot.name}${lot.area ? " · " + fmtArea(lot.area) : ""}`);
    btn.innerHTML = `<span class="lot__top"></span><span class="lot__wall-s"></span><span class="lot__wall-e"></span>`;
    zones[lot.zone].appendChild(btn);
    lot.el = btn;
  });

  const tip = document.getElementById("mpTip");
  const stageWrap = document.getElementById("mpStageWrap");
  const card = document.getElementById("mpCard");
  const cardCat = document.getElementById("mpCardCat");
  const cardName = document.getElementById("mpCardName");
  const cardArea = document.getElementById("mpCardArea");
  const cardExtra = document.getElementById("mpCardExtra");
  const cardStatus = document.getElementById("mpCardStatus");
  const cardCta = document.getElementById("mpCardCta");
  const cardClose = document.getElementById("mpCardClose");

  function showTip(lot) {
    const r = lot.el.getBoundingClientRect();
    const wrapR = stageWrap.getBoundingClientRect();
    tip.style.left = (r.left - wrapR.left + stageWrap.scrollLeft + r.width / 2) + "px";
    tip.style.top = (r.top - wrapR.top + stageWrap.scrollTop - 10) + "px";
    tip.innerHTML = `${lot.name}${lot.area ? `<small>${fmtArea(lot.area)}</small>` : lot.extra ? `<small>${lot.extra}</small>` : ""}`;
    tip.hidden = false;
    requestAnimationFrame(() => tip.classList.add("is-visible"));
  }
  function hideTip() {
    tip.classList.remove("is-visible");
    tip.hidden = true;
  }

  let selectedLot = null;
  function selectLot(lot) {
    if (selectedLot) selectedLot.el.classList.remove("is-selected");
    selectedLot = lot;
    lot.el.classList.add("is-selected");

    cardCat.textContent = catLabel[lot.cat] || "";
    cardName.textContent = lot.name;
    cardArea.textContent = lot.area ? fmtArea(lot.area) : "";
    cardExtra.textContent = lot.extra || "";
    const sold = lot.status === "vendido";
    cardStatus.textContent = sold ? "● Vendido" : "● Disponível";
    cardStatus.className = "mp__card-status " + (sold ? "is-sold" : "is-free");
    const msg = encodeURIComponent(
      `Olá! Estou no site do Bracerum Park e gostaria de saber mais sobre o lote "${lot.name}"${lot.area ? ` (${fmtArea(lot.area)})` : ""}.`
    );
    cardCta.href = `https://wa.me/5511986516065?text=${msg}`;
    card.hidden = false;
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function closeCard() {
    if (selectedLot) selectedLot.el.classList.remove("is-selected");
    selectedLot = null;
    card.hidden = true;
  }
  cardClose.addEventListener("click", closeCard);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCard(); });

  mpLots.forEach((lot) => {
    lot.el.addEventListener("mouseenter", () => showTip(lot));
    lot.el.addEventListener("mouseleave", hideTip);
    lot.el.addEventListener("click", () => selectLot(lot));
  });

  document.querySelectorAll(".mp__chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".mp__chips .chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      const cat = chip.dataset.cat;
      mpLots.forEach((lot) => {
        lot.el.classList.toggle("is-dim", cat !== "all" && lot.cat !== cat);
      });
    });
  });
})();

/* ==========================================================
   03 · LOCALIZAÇÃO — Mapa
   ========================================================== */
const PARK = { lat: -25.771694, lng: -57.732389 }; // 25°46'18.1"S 57°43'56.6"W

/* Grupo 1 — Portos fluviais */
const ports = [
  { name: "Emb. Puerto Alegre",   sub: "Fluvial · atracadouro local", via: "vicinal",          km: "4 km",  tempo: "0h 10m", lat: -25.7930, lng: -57.7565 },
  { name: "Puerto Lobato",        sub: "Fluvial · atracadouro local", via: "vicinal",          km: "6 km",  tempo: "0h 15m", lat: -25.8085, lng: -57.7660 },
  { name: "Terport Villeta",      sub: "Fluvial · contêineres",       via: "PY19",             km: "23 km", tempo: "20m",    lat: -25.5296, lng: -57.5568 },
  { name: "Puerto Seguro Fluvial",sub: "Fluvial · carga geral (Villeta)", via: "PY19",         km: "33 km", tempo: "30m",    lat: -25.4728, lng: -57.5539 },
  { name: "Terminal Villa Oliva", sub: "Fluvial · barcaças",          via: "PY19",             km: "38 km", tempo: "0h 50m", lat: -26.0060, lng: -57.8890 },
  { name: "Caacupemí Villeta",    sub: "Fluvial · contêineres",       via: "PY19",             km: "42 km", tempo: "1h 00m", lat: -25.5060, lng: -57.5450 },
  { name: "Porto de Assunção",    sub: "Fluvial · carga geral",       via: "PY19 + Acc. Sur",  km: "71 km", tempo: "1h 20m", lat: -25.2780, lng: -57.6430 },
  { name: "Porto de Alberdi",     sub: "Fluvial · local",             via: "PY19",             km: "72 km", tempo: "1h",     lat: -26.1870, lng: -58.1290 },
];

/* Grupo 2 — Rodovias · destinos Mercosul (tabela de conectividade) */
const roads = [
  { name: "Assunção",        sub: "Central · PY",     via: "Acceso Sur",     km: "70 km",    tempo: "1h 30m",  lat: -25.2867, lng: -57.6470 },
  { name: "Encarnación",     sub: "Itapúa · PY",      via: "Ruta 1",         km: "355 km",   tempo: "4h 40m",  lat: -27.3306, lng: -55.8667 },
  { name: "Ciudad del Este", sub: "Alto Paraná · PY", via: "Ruta 2",         km: "360 km",   tempo: "5h",      lat: -25.5097, lng: -54.6111 },
  { name: "Foz do Iguaçu",   sub: "Brasil",           via: "Ruta 2 / PY02",  km: "365 km",   tempo: "5h",      lat: -25.5163, lng: -54.5854 },
  { name: "Curitiba",        sub: "Brasil",           via: "BR-277",         km: "1.000 km", tempo: "12h 30m", lat: -25.4284, lng: -49.2733 },
  { name: "Porto Alegre",    sub: "Brasil",           via: "BR-386",         km: "1.055 km", tempo: "14h 30m", lat: -30.0346, lng: -51.2177 },
  { name: "Córdoba",         sub: "Argentina",        via: "RN 16",          km: "1.100 km", tempo: "13h 00m", lat: -31.4201, lng: -64.1888 },
  { name: "Buenos Aires",    sub: "Argentina",        via: "RN 12",          km: "1.280 km", tempo: "14h 30m", lat: -34.6037, lng: -58.3816 },
  { name: "Florianópolis",   sub: "Brasil",           via: "BR-282",         km: "1.307 km", tempo: "15h",     lat: -27.5954, lng: -48.5480 },
  { name: "Santa Cruz de la Sierra", sub: "Bolívia",  via: "Ruta 9",         km: "1.360 km", tempo: "18h 30m", lat: -17.7833, lng: -63.1821 },
  { name: "São Paulo",       sub: "Brasil",           via: "BR-116",         km: "1.395 km", tempo: "17h 30m", lat: -23.5505, lng: -46.6333 },
  { name: "Montevidéu",      sub: "Uruguai",          via: "RN 14",          km: "1.550 km", tempo: "19h",     lat: -34.9011, lng: -56.1645 },
];

/* Grupo 3 — Pontos de referência padrão */
const refs = [
  { name: "Bracerum Park",      sub: "Villeta Industrial City · 1,82 mi m²", km: "—",      tempo: "", lat: PARK.lat, lng: PARK.lng, main: true },
  { name: "Subestação da ANDE", sub: "Energia · Itaipu / Yacyretá",          via: "PY19",  km: "7,4 km", tempo: "", lat: -25.7205, lng: -57.6935 },
  { name: "Villeta",            sub: "Município-sede do parque",             via: "PY19",  km: "±20 km", tempo: "", lat: -25.5097, lng: -57.5619 },
  { name: "Aeroporto Silvio Pettirossi", sub: "Internacional · Assunção",    via: "Acceso Sur", km: "±80 km", tempo: "", lat: -25.2399, lng: -57.5191 },
];

const map = L.map("map", { scrollWheelZoom: false }).setView([-25.68, -57.72], 10);
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19,
}).addTo(map);

/* --- Zoom com scroll apenas quando o mouse está sobre o mapa --- */
const mapEl = document.getElementById("map");
mapEl.addEventListener("mouseenter", () => map.scrollWheelZoom.enable());
mapEl.addEventListener("mouseleave", () => map.scrollWheelZoom.disable());

/* Ícones */
const parkIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;transform:rotate(45deg);background:#a07c26;border:3px solid #12100a;box-shadow:0 4px 14px rgba(18,16,10,.5)"></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12],
});
const portIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50%;background:#12100a;color:#fff;display:grid;place-items:center;font-size:13px;border:2px solid #a07c26;box-shadow:0 3px 10px rgba(18,16,10,.4)">⚓</div>`,
  iconSize: [26, 26], iconAnchor: [13, 13],
});
const refIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;transform:rotate(45deg);background:#fff;border:2.5px solid #7c5f1a;box-shadow:0 2px 8px rgba(18,16,10,.35)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});
const cityIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#12100a;border:2.5px solid #fff;outline:1.5px solid #7c5f1a;box-shadow:0 2px 8px rgba(18,16,10,.4)"></div>`,
  iconSize: [16, 16], iconAnchor: [8, 8],
});

const markers = {};
/* Rótulos permanentes só no corredor local (evita poluição no zoom-out) */
const labelDir = {
  "Bracerum Park": "right",
  "Emb. Puerto Alegre": "left",
  "Puerto Lobato": "left",
  "Terport Villeta": "right",
  "Puerto Seguro Fluvial": "right",
  "Terminal Villa Oliva": "left",
  "Caacupemí Villeta": "left",
  "Porto de Assunção": "left",
  "Porto de Alberdi": "left",
  "Subestação da ANDE": "left",
  "Villeta": "right",
  "Aeroporto Silvio Pettirossi": "right",
  "Assunção": "right",
};

function addMarker(p, icon, opts = {}) {
  const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
  const dir = labelDir[p.name] || "right";
  m.bindTooltip(
    `${p.name}<small>${p.sub}${p.km && p.km !== "—" ? " · " + p.km : ""}</small>`,
    {
      permanent: !opts.hoverOnly,
      direction: dir,
      offset: dir === "right" ? [16, 0] : [-16, 0],
      className: "map-label " + (opts.labelClass || ""),
    }
  );
  m.bindPopup(
    `<b>${p.name}</b><br>${p.sub}` +
    (p.via ? `<br>Via: ${p.via}` : "") +
    (p.km && p.km !== "—" ? `<br>Distância: ${p.km}${p.tempo ? " · " + p.tempo : ""}` : "")
  );
  markers[p.name] = m;
}

ports.forEach((p) => addMarker(p, portIcon));
refs.forEach((p) => addMarker(p, p.main ? parkIcon : refIcon, { labelClass: p.main ? "map-label--park" : "" }));
/* Cidades do Mercosul: marcador pequeno + rótulo apenas no hover (exceto Assunção, do corredor) */
roads.forEach((p) => addMarker(p, cityIcon, { hoverOnly: p.name !== "Assunção" }));

/* Rótulo da rodovia PY19 */
L.marker([-25.62, -57.63], { opacity: 0 })
  .addTo(map)
  .bindTooltip("Rodovia PY19<small>Mesmo eixo: Bracerum Park → Terport → Puerto Seguro</small>", {
    permanent: true, direction: "right", className: "map-label map-label--hwy", offset: [0, 0],
  });

/* ---------- Rotas seguindo as rodovias (OSRM com fallback) ---------- */
const ROUTES = [
  { color: "#a07c26", weight: 4, opacity: 0.9,
    stops: [
      [PARK.lat, PARK.lng], [-25.7205, -57.6935], [-25.5296, -57.5568],
      [-25.5060, -57.5450], [-25.4728, -57.5539], [-25.2780, -57.6430],
    ],
    fallback: [
      [PARK.lat, PARK.lng], [-25.7205, -57.6935], [-25.66, -57.645], [-25.60, -57.60],
      [-25.5296, -57.5568], [-25.5060, -57.5450], [-25.4728, -57.5539],
      [-25.40, -57.575], [-25.33, -57.61], [-25.2780, -57.6430],
    ] },
  { color: "#12100a", weight: 3, opacity: 0.6,
    stops: [[PARK.lat, PARK.lng], [-26.0060, -57.8890], [-26.1870, -58.1290]],
    fallback: [
      [PARK.lat, PARK.lng], [-25.85, -57.77], [-25.93, -57.83],
      [-26.0060, -57.8890], [-26.10, -58.00], [-26.1870, -58.1290],
    ] },
  { color: "#7c5f1a", weight: 3, opacity: 0.75, dash: "5 7",
    stops: [[PARK.lat, PARK.lng], [-25.7930, -57.7565], [-25.8085, -57.7660]],
    fallback: [[PARK.lat, PARK.lng], [-25.7930, -57.7565], [-25.8085, -57.7660]] },
];
async function drawRoute(r) {
  try {
    const coords = r.stops.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("osrm off");
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error("no route");
    const line = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    L.polyline(line, { color: r.color, weight: r.weight, opacity: r.opacity, dashArray: r.dash || null }).addTo(map);
  } catch (e) {
    L.polyline(r.fallback, { color: r.color, weight: r.weight, opacity: r.opacity, dashArray: r.dash || null }).addTo(map);
  }
}
ROUTES.forEach(drawRoute);

/* Enquadramento inicial: corredor local */
const HOME_BOUNDS = L.latLngBounds(
  [...ports, ...refs].map((p) => [p.lat, p.lng])
).pad(0.12);
map.fitBounds(HOME_BOUNDS);

/* ---------- Botão Recentralizar (aparece a partir de 5 km do Park) ---------- */
const recenterBtn = document.getElementById("recenterBtn");
function checkRecenter() {
  const distKm = map.distance(map.getCenter(), L.latLng(PARK.lat, PARK.lng)) / 1000;
  recenterBtn.classList.toggle("is-visible", distKm > 5);
}
map.on("moveend zoomend", checkRecenter);
recenterBtn.addEventListener("click", () => {
  map.flyToBounds(HOME_BOUNDS, { duration: 1.2 });
});

/* ---------- "Buscador" direcional do Park (estilo jogos) ----------
   Quando o Park sai da tela, uma seta na borda do mapa aponta para ele. */
const parkFinder = document.getElementById("parkFinder");
const parkFinderArrow = document.getElementById("parkFinderArrow");
const mapHolder = document.querySelector(".map-holder");

function updateParkFinder() {
  const size = map.getSize();
  // Se o mapa ainda não tem dimensão real (fora da tela/não medido), esconde.
  if (!size.x || !size.y) { parkFinder.classList.remove("is-visible"); return; }

  const parkLatLng = L.latLng(PARK.lat, PARK.lng);
  const inView = map.getBounds().contains(parkLatLng);
  if (inView) {
    parkFinder.classList.remove("is-visible");
    return;
  }

  const center = { x: size.x / 2, y: size.y / 2 };
  const pt = map.latLngToContainerPoint(parkLatLng);
  const dx = pt.x - center.x;
  const dy = pt.y - center.y;

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  parkFinderArrow.style.transform = `rotate(${angle}deg)`;

  const PAD = 56;
  const halfW = size.x / 2 - PAD;
  const halfH = size.y / 2 - PAD;
  const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH);
  const x = center.x + dx * scale;
  const y = center.y + dy * scale;
  // Posiciona ANTES de tornar visível — evita o "quadrado voando".
  parkFinder.style.left = x + "px";
  parkFinder.style.top = y + "px";
  parkFinder.classList.add("is-visible");
}
map.on("move zoom moveend zoomend resize", updateParkFinder);
map.whenReady(updateParkFinder);

parkFinder.addEventListener("click", () => {
  map.flyTo([PARK.lat, PARK.lng], 13, { duration: 1.2 });
});

/* ---------- Mobile: guard de toque ----------
   Em telas touch, o mapa começa "travado" para não capturar a rolagem
   da página; um toque libera a navegação com um dedo. */
const isTouch = window.matchMedia("(pointer: coarse)").matches;
if (isTouch) {
  map.dragging.disable();
  const guard = document.createElement("button");
  guard.type = "button";
  guard.className = "map-touch-guard";
  guard.setAttribute("aria-label", "Ativar navegação no mapa");
  guard.innerHTML = "<span>🗺️ Toque para explorar o mapa</span>";
  mapHolder.appendChild(guard);
  guard.addEventListener("click", () => {
    map.dragging.enable();
    map.touchZoom.enable();
    guard.classList.add("is-hidden");
  });
}

/* ---------- Painel lateral: acordeão + listas ---------- */
function fillList(el, items) {
  items.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `<button data-name="${p.name}">
        <span>${p.name}<span class="d-tag">${p.sub}</span></span>
        <span class="d-km">${p.km}${p.tempo ? `<span class="d-tag" style="text-align:right">${p.tempo}</span>` : ""}</span>
      </button>`;
    el.appendChild(li);
  });
}
fillList(document.getElementById("portList"), ports);
fillList(document.getElementById("roadList"), roads);
fillList(document.getElementById("refList"), refs);

/* Acordeão: um aberto por vez */
const accs = document.querySelectorAll(".acc");
accs.forEach((acc) => {
  acc.querySelector(".acc__head").addEventListener("click", () => {
    const isOpen = acc.dataset.open === "true";
    accs.forEach((a) => {
      a.dataset.open = "false";
      a.querySelector(".acc__head").setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      acc.dataset.open = "true";
      acc.querySelector(".acc__head").setAttribute("aria-expanded", "true");
    }
  });
});

/* Clique nos itens → navega no mapa */
document.getElementById("mapPanel").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-name]");
  if (!btn) return;
  document.querySelectorAll("#mapPanel button[data-name]").forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  const all = [...ports, ...roads, ...refs];
  const p = all.find((x) => x.name === btn.dataset.name);
  const isFar = roads.includes(p) && p.name !== "Assunção";
  map.flyTo([p.lat, p.lng], isFar ? 7 : 13, { duration: 1.15 });
  markers[p.name].openPopup();
});

/* ==========================================================
   04 · CARROSSEL — quase fullscreen, fundo preto
   ========================================================== */
const slides = [
  { src: "assets/Fabrica.jpg",     cap: "Fábrica Bracerum" },
  { src: "assets/Hotel.jpg",       cap: "Hotel e Centro de Convenções" },
  { src: "assets/casas.jpg",       cap: "Condomínio de Casas" },
  { src: "assets/convencoes.jpg",  cap: "Centro de Convenções" },
  { src: "assets/convenco2.jpg",   cap: "Centro de Convenções · Interior" },
  { src: "assets/escritorios.jpg", cap: "Escritórios e Salas Corporativas" },
  { src: "assets/Clube.jpg",       cap: "Clube Bracerum" },
  { src: "assets/Eventos.jpg",     cap: "Eventos e Gastronomia" },
];

const carTrack = document.getElementById("carTrack");
const carCaption = document.getElementById("carCaption");
const carCounter = document.getElementById("carCounter");
const carDots = document.getElementById("carDots");
let carIndex = 0;

slides.forEach((s, i) => {
  const slide = document.createElement("div");
  slide.className = "carousel__slide";
  const img = document.createElement("img");
  img.src = s.src; img.alt = s.cap;
  img.loading = i === 0 ? "eager" : "lazy";
  img.onerror = function () { this.replaceWith(window.buildPlaceholder(s.cap, "16/9")); };
  slide.appendChild(img);
  carTrack.appendChild(slide);

  const dot = document.createElement("button");
  dot.className = "carousel__dot";
  dot.setAttribute("aria-label", "Ir para: " + s.cap);
  dot.addEventListener("click", () => goTo(i));
  carDots.appendChild(dot);
});

function goTo(i) {
  carIndex = (i + slides.length) % slides.length;
  carTrack.style.transform = `translateX(-${carIndex * 100}%)`;
  carCaption.textContent = slides[carIndex].cap;
  carCounter.textContent = `${String(carIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  carDots.querySelectorAll(".carousel__dot").forEach((d, di) => d.classList.toggle("is-active", di === carIndex));
}
goTo(0);

document.getElementById("carPrev").addEventListener("click", () => goTo(carIndex - 1));
document.getElementById("carNext").addEventListener("click", () => goTo(carIndex + 1));

/* Teclado (com o carrossel focado) */
document.getElementById("carousel").addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") goTo(carIndex - 1);
  if (e.key === "ArrowRight") goTo(carIndex + 1);
});

/* Swipe no mobile */
let touchX = null;
const viewport = document.getElementById("carViewport");
viewport.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
viewport.addEventListener("touchend", (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 46) goTo(carIndex + (dx < 0 ? 1 : -1));
  touchX = null;
}, { passive: true });

/* ==========================================================
   06 · TABELA INTERATIVA — empresas
   ========================================================== */
const companies = [
  { name: "Be8", flag: "🇧🇷", country: "Brasil", sector: "Biocombustíveis",
    logo: "assets/be8.svg",
    value: 999999999, valueLabel: "n/d",
    note: "Líder brasileira em biodiesel. Desenvolve em Villeta a biorrefinaria Omega Green, de combustíveis renováveis avançados.",
    where: "villeta", badge: "Em Villeta" },
  { name: "Ball Corporation", flag: "🇺🇸", country: "EUA", sector: "Embalagens de alumínio",
    logo: "assets/Ball_Corporation_logo_2024.svg",
    value: 80000000, valueLabel: "US$ 80 mi",
    note: "Maior fabricante mundial de latas de alumínio. Planta na região pela proximidade aos portos.",
    where: "villeta", badge: "Em Villeta" },
  { name: "Cremer", flag: "🇩🇪", country: "Alemanha", sector: "Óleos e químicos",
    logo: "assets/cremer.svg",
    value: 999999999, valueLabel: "n/d",
    note: "Grupo alemão com planta de biodiesel e refino de glicerina em Villeta.",
    where: "villeta", badge: "Em Villeta" },
  { name: "Lupo", flag: "🇧🇷", country: "Brasil", sector: "Têxtil",
    logo: "assets/Lupo_logo (1).svg",
    value: 6000000, valueLabel: "R$ 30 mi",
    note: "Têxtil centenária brasileira. Fábrica no Paraguai sob regime de Maquila, com custo de produção ~28% menor que no Brasil.",
    where: "paraguai", badge: "No Paraguai" },
  { name: "Kingspan", flag: "🇮🇪", country: "Irlanda", sector: "Construção industrializada",
    logo: "assets/Kingspan_Group_logo.svg",
    value: 999999999, valueLabel: "n/d",
    note: "Líder global em painéis isotérmicos, com operação no Brasil (Kingspan Isoeste) e expansão na América do Sul.",
    where: "paraguai", badge: "No Paraguai" },
];

const tbody = document.querySelector("#companiesTable tbody");
let sortKey = null, sortDir = 1, activeFilter = "all", searchTerm = "";

function renderTable() {
  let rows = companies.filter((c) => {
    const matchFilter = activeFilter === "all" || c.where === activeFilter;
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || [c.name, c.country, c.sector, c.note].join(" ").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });
  if (sortKey) {
    rows = [...rows].sort((a, b) => {
      const va = sortKey === "value" ? a.value : String(a[sortKey]).toLowerCase();
      const vb = sortKey === "value" ? b.value : String(b[sortKey]).toLowerCase();
      return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir;
    });
  }
  tbody.innerHTML = "";
  if (!rows.length) {
    tbody.innerHTML = `<tr class="table-empty"><td colspan="5">Nenhuma empresa encontrada para "${searchTerm}".</td></tr>`;
    return;
  }
  rows.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td data-label="Empresa"><span class="c-name"><span class="c-flag">${c.flag}</span>${c.name}</span><br>
          <span class="badge ${c.where === "villeta" ? "" : "badge--soft"}">${c.badge}</span></td>
      <td data-label="Origem">${c.country}</td>
      <td data-label="Setor">${c.sector}</td>
      <td data-label="Investimento"><span class="c-val">${c.valueLabel}</span></td>
      <td data-label="Destaque" class="c-note">${c.note}</td>`;
    tbody.appendChild(tr);
  });
}
renderTable();

document.querySelectorAll("#companiesTable th.sortable").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
    document.querySelectorAll("#companiesTable th").forEach((t) => t.classList.remove("asc", "desc"));
    th.classList.add(sortDir === 1 ? "asc" : "desc");
    renderTable();
  });
});
document.getElementById("tableSearch").addEventListener("input", (e) => {
  searchTerm = e.target.value.trim(); renderTable();
});
document.getElementById("tableFilters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll("#tableFilters .chip").forEach((c) => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  activeFilter = chip.dataset.filter; renderTable();
});

/* ---------- Mobile: faixa de logotipos monocromáticos ---------- */
const logosStrip = document.getElementById("logosStrip");
if (logosStrip) {
  logosStrip.innerHTML = `
    <div class="logos-strip__wrap">
      <p class="logos-strip__label">Empresas que já estão em Villeta e no Paraguai</p>
      <div class="logos-track">
        ${companies.map((c) => `
          <div class="logo-card">
            <div class="logo-card__mark">
              <img src="${encodeURI(c.logo)}" alt="${c.name}" loading="lazy"
                   onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'logo-card__fallback',textContent:${JSON.stringify(c.name)}}))" />
            </div>
            <span class="logo-card__name">${c.country}</span>
            <span class="logo-card__meta">${c.sector} · ${c.valueLabel}</span>
            <span class="logo-card__badge ${c.where === "villeta" ? "" : "logo-card__badge--soft"}">${c.badge}</span>
          </div>`).join("")}
      </div>
    </div>`;
}

/* ==========================================================
   Geral — reveal + menu mobile
   ========================================================== */
const observer = new IntersectionObserver(
  (entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-visible"); observer.unobserve(en.target); }
  }),
  { threshold: 0.1 }
);
document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");
burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
  document.body.classList.toggle("menu-open", open);
  document.body.style.overflow = open ? "hidden" : "";
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    document.body.style.overflow = "";
  })
);
