/* ==========================================================
   BRACERUM/PARK — script principal (tema claro)
   ========================================================== */

/* ---------- Placeholder (usado se alguma imagem faltar em /assets) ---------- */
window.buildPlaceholder = function (title, ratio) {
  const div = document.createElement("div");
  div.className = "placeholder " + (ratio === "4/3" ? "placeholder--43" : "placeholder--169");
  div.innerHTML = `<span class="ph-title">${title}</span><small>adicione a imagem em /assets</small>`;
  return div;
};

/* ==========================================================
   02 · MASTERPLAN
   ========================================================== */
const masterAreas = [
  { name: "Área geral do lote",        val: "1.819.856 m²", cat: "infra" },
  { name: "Galpões industriais",       val: "488.730 m²",   cat: "industrial" },
  { name: "Data Center",               val: "277.588 m²",   cat: "industrial" },
  { name: "Fábrica Bracerum",          val: "180.245 m²",   cat: "industrial" },
  { name: "Pátio industrial",          val: "115.920 m²",   cat: "industrial" },
  { name: "Casas (78 lotes)",          val: "79.200 m²",    cat: "cidade" },
  { name: "Galpões logísticos",        val: "67.500 m²",    cat: "industrial" },
  { name: "Hotel (384 studios)",       val: "30.000 m²",    cat: "cidade" },
  { name: "Manobra de ônibus",         val: "20.421 m²",    cat: "infra" },
  { name: "Isolamento data center",    val: "15.450 m²",    cat: "infra" },
  { name: "Lagos",                     val: "15.000 m²",    cat: "infra" },
  { name: "Docas (80 docas)",          val: "14.400 m²",    cat: "industrial" },
  { name: "Centro de convenções",      val: "13.500 m²",    cat: "cidade" },
  { name: "Escritórios / coworking",   val: "13.500 m²/piso", cat: "cidade" },
  { name: "Apoio motorista + posto",   val: "11.670 m²",    cat: "infra" },
  { name: "Praça centro tecnológico",  val: "10.940 m²",    cat: "cidade" },
  { name: "Pista de pouso + heliponto",val: "1.325 m de pista", cat: "infra" },
  { name: "Hangar",                    val: "8.246 m²",     cat: "infra" },
  { name: "Academia, lojas e lanchonetes", val: "5.489 m²", cat: "cidade" },
  { name: "Quadras e campos",          val: "5.000 m²",     cat: "cidade" },
  { name: "Refeitório (por piso)",     val: "4.458 m²",     cat: "cidade" },
  { name: "Salão de eventos",          val: "3.200 m²",     cat: "cidade" },
  { name: "Anfiteatro",                val: "1.200 lugares",cat: "cidade" },
  { name: "Estacionamentos",           val: "2.150 vagas",  cat: "infra" },
];
const catLabel = { industrial: "Industrial", cidade: "Cidade & Serviços", infra: "Infraestrutura" };
const masterGrid = document.getElementById("masterGrid");
masterAreas.forEach((a) => {
  const li = document.createElement("li");
  li.dataset.cat = a.cat;
  li.innerHTML = `<span class="mi-name">${a.name}</span>
                  <span class="mi-val">${a.val}</span>
                  <span class="mi-cat">${catLabel[a.cat]}</span>`;
  masterGrid.appendChild(li);
});
document.querySelectorAll(".master__legend .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".master__legend .chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    const area = chip.dataset.area;
    masterGrid.querySelectorAll("li").forEach((li) => {
      li.classList.toggle("dim", area !== "all" && li.dataset.cat !== area);
    });
  });
});

/* ==========================================================
   03 · LOCALIZAÇÃO — Mapa claro com portos, rótulos e rotas
   ========================================================== */
const PARK = { lat: -25.771694, lng: -57.732389 }; // 25°46'18.1"S 57°43'56.6"W

/* Portos fluviais (dados da tabela oficial) */
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

/* Referências rodoviárias / energia */
const roadRefs = [
  { name: "Bracerum Park", sub: "Villeta Industrial City · 1,82 mi m²", km: "—", tempo: "", lat: PARK.lat, lng: PARK.lng, main: true },
  { name: "Subestação da ANDE", sub: "Energia · Itaipu / Yacyretá", via: "PY19", km: "7,4 km", tempo: "", lat: -25.7205, lng: -57.6935 },
  { name: "Assunção", sub: "Capital + aeroporto internacional", via: "Acceso Sur", km: "70 km", tempo: "1h 30m", lat: -25.2867, lng: -57.6470 },
];

const map = L.map("map", { scrollWheelZoom: false }).setView([-25.68, -57.72], 10);
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19,
}).addTo(map);

/* Ícones */
const parkIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;transform:rotate(45deg);background:#a8842f;border:3px solid #161209;box-shadow:0 4px 14px rgba(22,18,9,.45)"></div>`,
  iconSize: [24, 24], iconAnchor: [12, 12],
});
const portIcon = L.divIcon({
  className: "",
  html: `<div style="width:26px;height:26px;border-radius:50%;background:#161209;color:#fff;display:grid;place-items:center;font-size:13px;border:2px solid #a8842f;box-shadow:0 3px 10px rgba(22,18,9,.35)">⚓</div>`,
  iconSize: [26, 26], iconAnchor: [13, 13],
});
const refIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;transform:rotate(45deg);background:#fff;border:2.5px solid #a8842f;box-shadow:0 2px 8px rgba(22,18,9,.3)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
});

const markers = {};
function addMarker(p, icon, labelDir, labelClass) {
  const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
  m.bindTooltip(
    `${p.name}<small>${p.sub}${p.km && p.km !== "—" ? " · " + p.km : ""}</small>`,
    { permanent: true, direction: labelDir, offset: labelDir === "right" ? [16, 0] : [-16, 0], className: "map-label " + (labelClass || "") }
  );
  m.bindPopup(
    `<b>${p.name}</b><br>${p.sub}` +
    (p.via ? `<br>Via: ${p.via}` : "") +
    (p.km && p.km !== "—" ? `<br>Distância: ${p.km}${p.tempo ? " · " + p.tempo : ""}` : "")
  );
  markers[p.name] = m;
  return m;
}

/* Direções dos rótulos ajustadas p/ evitar sobreposição no cluster de Villeta */
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
  "Assunção": "right",
};

ports.forEach((p) => addMarker(p, portIcon, labelDir[p.name] || "right"));
roadRefs.forEach((p) =>
  addMarker(p, p.main ? parkIcon : refIcon, labelDir[p.name] || "right", p.main ? "map-label--park" : "")
);

/* Rótulo da rodovia PY19 no meio do corredor */
L.marker([-25.62, -57.63], { opacity: 0 })
  .addTo(map)
  .bindTooltip("Rodovia PY19<small>Mesmo eixo: Bracerum Park → Terport → Puerto Seguro</small>", {
    permanent: true, direction: "right", className: "map-label map-label--hwy", offset: [0, 0],
  });

/* ---------- Rotas seguindo as rodovias ----------
   1º: tenta o roteador OSRM (traçado real da via).
   2º: se indisponível, usa polilinhas manuais aproximadas do eixo PY19. */
const ROUTES = [
  { // Corredor norte: Park → ANDE → Terport → Caacupemí → Puerto Seguro → Porto de Assunção (PY19 + Acceso Sur)
    color: "#a8842f", weight: 4, opacity: 0.85,
    stops: [
      [PARK.lat, PARK.lng], [-25.7205, -57.6935], [-25.5296, -57.5568],
      [-25.5060, -57.5450], [-25.4728, -57.5539], [-25.2780, -57.6430],
    ],
    fallback: [
      [PARK.lat, PARK.lng], [-25.7205, -57.6935], [-25.66, -57.645], [-25.60, -57.60],
      [-25.5296, -57.5568], [-25.5060, -57.5450], [-25.4728, -57.5539],
      [-25.40, -57.575], [-25.33, -57.61], [-25.2780, -57.6430],
    ],
  },
  { // Corredor sul: Park → Villa Oliva → Alberdi (PY19 sul)
    color: "#161209", weight: 3, opacity: 0.6,
    stops: [[PARK.lat, PARK.lng], [-26.0060, -57.8890], [-26.1870, -58.1290]],
    fallback: [
      [PARK.lat, PARK.lng], [-25.85, -57.77], [-25.93, -57.83],
      [-26.0060, -57.8890], [-26.10, -58.00], [-26.1870, -58.1290],
    ],
  },
  { // Vicinais: Park → Emb. Puerto Alegre → Puerto Lobato
    color: "#8a6b22", weight: 3, opacity: 0.7, dash: "5 7",
    stops: [[PARK.lat, PARK.lng], [-25.7930, -57.7565], [-25.8085, -57.7660]],
    fallback: [[PARK.lat, PARK.lng], [-25.7930, -57.7565], [-25.8085, -57.7660]],
  },
];

function drawFallback(r) {
  L.polyline(r.fallback, {
    color: r.color, weight: r.weight, opacity: r.opacity, dashArray: r.dash || null,
  }).addTo(map);
}

async function drawRoute(r) {
  try {
    const coords = r.stops.map(([lat, lng]) => `${lng},${lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("osrm off");
    const data = await res.json();
    if (!data.routes || !data.routes.length) throw new Error("no route");
    const line = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    L.polyline(line, {
      color: r.color, weight: r.weight, opacity: r.opacity, dashArray: r.dash || null,
    }).addTo(map);
  } catch (e) {
    drawFallback(r);
  }
}
ROUTES.forEach(drawRoute);

/* Enquadra tudo */
const allPts = [...ports, ...roadRefs].map((p) => [p.lat, p.lng]);
map.fitBounds(L.latLngBounds(allPts).pad(0.12));

/* Listas laterais clicáveis */
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
fillList(document.getElementById("roadList"), roadRefs);

document.querySelector(".map-panel").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-name]");
  if (!btn) return;
  document.querySelectorAll(".map-panel button").forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  const p = [...ports, ...roadRefs].find((x) => x.name === btn.dataset.name);
  map.flyTo([p.lat, p.lng], 13, { duration: 1.1 });
  markers[p.name].openPopup();
});

/* ---------- Tabelas de distância ---------- */
const portsBody = document.querySelector("#portsTable tbody");
ports.forEach((p) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `<td><span class="d-name">${p.name}</span><span class="d-sub">${p.sub}</span></td>
    <td class="d-via">${p.via}</td>
    <td class="t-num">${p.km}</td><td class="t-num">${p.tempo}</td>`;
  portsBody.appendChild(tr);
});

const roadRows = [
  { group: "Paraguai" },
  { city: "Assunção", sub: "Central", via: "Acceso Sur", km: "70 km", tempo: "1h 30m" },
  { city: "Encarnación", sub: "Itapúa", via: "Ruta 1", km: "355 km", tempo: "4h 40m" },
  { city: "Ciudad del Este", sub: "Alto Paraná", via: "Ruta 2", km: "360 km", tempo: "5h" },
  { group: "Mercosul e vizinhos" },
  { city: "Foz do Iguaçu", sub: "BR", via: "Ruta 2 / PY02", km: "365 km", tempo: "5h" },
  { city: "Curitiba", sub: "BR", via: "BR-277", km: "1.000 km", tempo: "12h 30m" },
  { city: "Porto Alegre", sub: "BR", via: "BR-386", km: "1.055 km", tempo: "14h 30m" },
  { city: "Córdoba", sub: "AR", via: "RN 16", km: "1.100 km", tempo: "13h 00m" },
  { city: "Buenos Aires", sub: "AR", via: "RN 12", km: "1.280 km", tempo: "14h 30m" },
  { city: "Florianópolis", sub: "BR", via: "BR-282", km: "1.307 km", tempo: "15h" },
  { city: "Santa Cruz de la Sierra", sub: "BO", via: "Ruta 9", km: "1.360 km", tempo: "18h 30m" },
  { city: "São Paulo", sub: "BR", via: "BR-116", km: "1.395 km", tempo: "17h 30m" },
  { city: "Montevidéu", sub: "UY", via: "RN 14", km: "1.550 km", tempo: "19h" },
];
const roadsBody = document.querySelector("#roadsTable tbody");
roadRows.forEach((r) => {
  const tr = document.createElement("tr");
  if (r.group) {
    tr.className = "group-row";
    tr.innerHTML = `<td colspan="4">${r.group}</td>`;
  } else {
    tr.innerHTML = `<td><span class="d-name">${r.city}</span><span class="d-sub">${r.sub}</span></td>
      <td class="d-via">${r.via}</td>
      <td class="t-num">${r.km}</td><td class="t-num">${r.tempo}</td>`;
  }
  roadsBody.appendChild(tr);
});

/* ==========================================================
   04 · GALERIA — nomes idênticos aos arquivos do repositório
   ========================================================== */
const galleryItems = [
  { src: "assets/Fabrica.jpg",     cap: "Fábrica Bracerum", wide: true },
  { src: "assets/Hotel.jpg",       cap: "Hotel e Centro de Convenções" },
  { src: "assets/casas.jpg",       cap: "Condomínio de Casas" },
  { src: "assets/convencoes.jpg",  cap: "Centro de Convenções" },
  { src: "assets/convenco2.jpg",   cap: "Centro de Convenções · Interior" },
  { src: "assets/escritorios.jpg", cap: "Escritórios e Salas Corporativas" },
  { src: "assets/Clube.jpg",       cap: "Clube Bracerum", wide: true },
  { src: "assets/Eventos.jpg",     cap: "Eventos e Gastronomia" },
];

const gallery = document.getElementById("gallery");
galleryItems.forEach((g) => {
  const fig = document.createElement("button");
  fig.className = "gallery__item" + (g.wide ? " wide" : "");
  fig.setAttribute("aria-label", "Ampliar: " + g.cap);
  const img = document.createElement("img");
  img.src = g.src; img.alt = g.cap; img.loading = "lazy";
  img.onerror = function () { this.replaceWith(window.buildPlaceholder(g.cap, "4/3")); };
  fig.appendChild(img);
  const cap = document.createElement("span");
  cap.className = "gallery__cap"; cap.textContent = g.cap;
  fig.appendChild(cap);
  fig.addEventListener("click", () => openLightbox(g));
  gallery.appendChild(fig);
});

const lightbox = document.getElementById("lightbox");
const lbMedia = document.getElementById("lbMedia");
const lbCaption = document.getElementById("lbCaption");
function openLightbox(g) {
  lbMedia.innerHTML = "";
  const img = document.createElement("img");
  img.src = g.src; img.alt = g.cap;
  img.onerror = function () { this.replaceWith(window.buildPlaceholder(g.cap, "16/9")); };
  lbMedia.appendChild(img);
  lbCaption.textContent = g.cap;
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
document.getElementById("lbClose").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

/* ==========================================================
   06 · TABELA INTERATIVA — empresas
   ========================================================== */
const companies = [
  { name: "Be8", flag: "🇧🇷", country: "Brasil", sector: "Biocombustíveis",
    value: 999999999, valueLabel: "n/d",
    note: "Líder brasileira em biodiesel. Desenvolve em Villeta a biorrefinaria Omega Green, de combustíveis renováveis avançados.",
    where: "villeta", badge: "Em Villeta" },
  { name: "Ball Corporation", flag: "🇺🇸", country: "EUA", sector: "Embalagens de alumínio",
    value: 80000000, valueLabel: "US$ 80 mi",
    note: "Maior fabricante mundial de latas de alumínio. Planta na região pela proximidade aos portos.",
    where: "villeta", badge: "Em Villeta" },
  { name: "Cremer", flag: "🇩🇪", country: "Alemanha", sector: "Óleos e químicos",
    value: 999999999, valueLabel: "n/d",
    note: "Grupo alemão com planta de biodiesel e refino de glicerina em Villeta.",
    where: "villeta", badge: "Em Villeta" },
  { name: "Lupo", flag: "🇧🇷", country: "Brasil", sector: "Têxtil",
    value: 6000000, valueLabel: "R$ 30 mi",
    note: "Têxtil centenária brasileira. Fábrica no Paraguai sob regime de Maquila, com custo de produção ~28% menor que no Brasil.",
    where: "paraguai", badge: "No Paraguai" },
  { name: "Kingspan", flag: "🇮🇪", country: "Irlanda", sector: "Construção industrializada",
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
      <td><span class="c-name"><span class="c-flag">${c.flag}</span>${c.name}</span><br>
          <span class="badge ${c.where === "villeta" ? "" : "badge--soft"}">${c.badge}</span></td>
      <td>${c.country}</td>
      <td>${c.sector}</td>
      <td><span class="c-val">${c.valueLabel}</span></td>
      <td class="c-note">${c.note}</td>`;
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
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => { navLinks.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false"); })
);
