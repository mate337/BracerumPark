/* ==========================================================
   BRACERUM/PARK — script principal
   ========================================================== */

/* ---------- Placeholder helper (usado quando a imagem real ainda não existe) ---------- */
window.buildPlaceholder = function (title, ratio) {
  const div = document.createElement("div");
  div.className = "placeholder " + (ratio === "4/3" ? "placeholder--43" : "placeholder--169");
  div.innerHTML = `<span class="ph-title">${title}</span><small>adicione a imagem em /assets</small>`;
  return div;
};

/* ==========================================================
   02 · MASTERPLAN — índices/áreas do projeto
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
   03 · LOCALIZAÇÃO — Mapa interativo (Leaflet)
   ========================================================== */
const PARK = { lat: -25.771694, lng: -57.732389 }; // 25°46'18.1"S 57°43'56.6"W

const places = [
  {
    name: "Bracerum Park", tag: "Villeta Industrial City", km: "—",
    lat: PARK.lat, lng: PARK.lng, main: true,
    desc: "1.819.856 m² na rodovia dos portos.",
  },
  {
    name: "Subestação da ANDE", tag: "Energia · Itaipu / Yacyretá", km: "7,4 km",
    lat: -25.7205, lng: -57.6935,
    desc: "Média e alta tensão margeando a rodovia de acesso.",
  },
  {
    name: "Terport Villeta", tag: "Terminal portuário", km: "20 km",
    lat: -25.5296, lng: -57.5568,
    desc: "Porto sobre o Rio Paraguai — Hidrovia Paraná-Paraguai.",
  },
  {
    name: "Puerto Seguro", tag: "Terminal portuário", km: "30 km",
    lat: -25.4728, lng: -57.5539,
    desc: "Rodas ao Atlântico e ao Pacífico pela hidrovia.",
  },
  {
    name: "Assunção", tag: "Capital + aeroporto internacional", km: "65 km",
    lat: -25.2867, lng: -57.647,
    desc: "Vários voos diários. Acesso pela Acceso Sur.",
  },
];

const map = L.map("map", { scrollWheelZoom: false }).setView([-25.55, -57.62], 10);
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
  maxZoom: 19,
}).addTo(map);

const goldIcon = (main) =>
  L.divIcon({
    className: "",
    html: `<div style="
      width:${main ? 22 : 14}px;height:${main ? 22 : 14}px;transform:rotate(45deg);
      background:${main ? "#d9b36c" : "#0a0908"};
      border:2px solid #d9b36c;box-shadow:0 0 ${main ? 18 : 8}px rgba(217,179,108,.65);
    "></div>`,
    iconSize: [main ? 22 : 14, main ? 22 : 14],
    iconAnchor: [main ? 11 : 7, main ? 11 : 7],
  });

const markers = {};
places.forEach((p) => {
  const m = L.marker([p.lat, p.lng], { icon: goldIcon(p.main) }).addTo(map);
  m.bindPopup(`<b>${p.name}</b><br>${p.tag}${p.km !== "—" ? " · " + p.km : ""}<br><span style="opacity:.8">${p.desc}</span>`);
  markers[p.name] = m;
});

// Rota (corredor rodoviário aproximado Park → portos → Assunção)
L.polyline(
  [
    [PARK.lat, PARK.lng],
    [-25.7205, -57.6935],
    [-25.62, -57.62],
    [-25.5296, -57.5568],
    [-25.4728, -57.5539],
    [-25.38, -57.58],
    [-25.2867, -57.647],
  ],
  { color: "#d9b36c", weight: 2, opacity: 0.7, dashArray: "6 8" }
).addTo(map);

// Lista lateral de distâncias
const distList = document.getElementById("distList");
places.forEach((p) => {
  const li = document.createElement("li");
  li.innerHTML = `<button data-name="${p.name}">
      <span>${p.name}<span class="d-tag">${p.tag}</span></span>
      <span class="d-km">${p.km}</span>
    </button>`;
  distList.appendChild(li);
});
distList.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  distList.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  const p = places.find((x) => x.name === btn.dataset.name);
  map.flyTo([p.lat, p.lng], 13, { duration: 1.1 });
  markers[p.name].openPopup();
});

/* Conectividade rodoviária (do deck) */
const connections = [
  { city: "Assunção · PY", via: "Acceso Sur", km: "65 km" },
  { city: "Encarnación · PY", via: "Ruta 1", km: "355 km" },
  { city: "Ciudad del Este · PY", via: "Ruta 2", km: "360 km" },
  { city: "Foz do Iguaçu · BR", via: "Ruta 2 / PY02", km: "365 km" },
  { city: "Curitiba · BR", via: "BR-277", km: "1.000 km" },
  { city: "Porto Alegre · BR", via: "BR-386", km: "1.055 km" },
  { city: "Córdoba · AR", via: "RN 16", km: "1.100 km" },
  { city: "Buenos Aires · AR", via: "RN 12", km: "1.280 km" },
  { city: "Florianópolis · BR", via: "BR-282", km: "1.307 km" },
  { city: "Santa Cruz de la Sierra · BO", via: "Ruta 9", km: "1.360 km" },
  { city: "São Paulo · BR", via: "BR-116", km: "1.395 km" },
  { city: "Montevidéu · UY", via: "RN 14", km: "1.550 km" },
];
const connGrid = document.getElementById("connGrid");
connections.forEach((c) => {
  const d = document.createElement("div");
  d.className = "conn__item";
  d.innerHTML = `<strong>${c.city}</strong><span>${c.km}</span><small>${c.via}</small>`;
  connGrid.appendChild(d);
});

/* ==========================================================
   04 · GALERIA — troque os arquivos em /assets pelas imagens reais
   ========================================================== */
const galleryItems = [
  { src: "assets/fabrica.jpg",      cap: "Fábrica Bracerum",             wide: true },
  { src: "assets/hotel.jpg",        cap: "Hotel e Centro de Convenções" },
  { src: "assets/casas.jpg",        cap: "Condomínio de Casas" },
  { src: "assets/convencoes.jpg",   cap: "Centro de Convenções" },
  { src: "assets/tecnologico.jpg",  cap: "Centro Tecnológico" },
  { src: "assets/escritorios.jpg",  cap: "Escritórios e Salas Corporativas" },
  { src: "assets/comercial.jpg",    cap: "Centro Comercial e Serviços" },
  { src: "assets/clube.jpg",        cap: "Clube Bracerum",               wide: true },
  { src: "assets/eventos.jpg",      cap: "Eventos e Gastronomia" },
];

const gallery = document.getElementById("gallery");
galleryItems.forEach((g) => {
  const fig = document.createElement("button");
  fig.className = "gallery__item" + (g.wide ? " wide" : "");
  fig.setAttribute("aria-label", "Ampliar: " + g.cap);
  const img = document.createElement("img");
  img.src = g.src;
  img.alt = g.cap;
  img.loading = "lazy";
  img.onerror = function () {
    this.replaceWith(window.buildPlaceholder(g.cap, "4/3"));
  };
  fig.appendChild(img);
  const cap = document.createElement("span");
  cap.className = "gallery__cap";
  cap.textContent = g.cap;
  fig.appendChild(cap);
  fig.addEventListener("click", () => openLightbox(g));
  gallery.appendChild(fig);
});

/* Lightbox */
const lightbox = document.getElementById("lightbox");
const lbMedia = document.getElementById("lbMedia");
const lbCaption = document.getElementById("lbCaption");
function openLightbox(g) {
  lbMedia.innerHTML = "";
  const img = document.createElement("img");
  img.src = g.src;
  img.alt = g.cap;
  img.onerror = function () {
    this.replaceWith(window.buildPlaceholder(g.cap, "16/9"));
  };
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
   06 · TABELA INTERATIVA — empresas no Paraguai / Villeta
   ========================================================== */
const companies = [
  {
    name: "Be8", flag: "🇧🇷", country: "Brasil", sector: "Biocombustíveis",
    value: 999999999, valueLabel: "n/d",
    note: "Líder brasileira em biodiesel. Desenvolve em Villeta a biorrefinaria Omega Green, de combustíveis renováveis avançados.",
    where: "villeta", badge: "Em Villeta",
  },
  {
    name: "Ball Corporation", flag: "🇺🇸", country: "EUA", sector: "Embalagens de alumínio",
    value: 80000000, valueLabel: "US$ 80 mi",
    note: "Maior fabricante mundial de latas de alumínio. Planta na região pela proximidade aos portos.",
    where: "villeta", badge: "Em Villeta",
  },
  {
    name: "Cremer", flag: "🇩🇪", country: "Alemanha", sector: "Óleos e químicos",
    value: 999999999, valueLabel: "n/d",
    note: "Grupo alemão com planta de biodiesel e refino de glicerina em Villeta.",
    where: "villeta", badge: "Em Villeta",
  },
  {
    name: "Lupo", flag: "🇧🇷", country: "Brasil", sector: "Têxtil",
    value: 6000000, valueLabel: "R$ 30 mi",
    note: "Têxtil centenária brasileira. Fábrica no Paraguai sob regime de Maquila, com custo de produção ~28% menor que no Brasil.",
    where: "paraguai", badge: "No Paraguai",
  },
  {
    name: "Kingspan", flag: "🇮🇪", country: "Irlanda", sector: "Construção industrializada",
    value: 999999999, valueLabel: "n/d",
    note: "Líder global em painéis isotérmicos, com operação no Brasil (Kingspan Isoeste) e expansão na América do Sul.",
    where: "paraguai", badge: "No Paraguai",
  },
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
    tbody.innerHTML = `<tr class="table-empty"><td colspan="5">Nenhuma empresa encontrada para “${searchTerm}”.</td></tr>`;
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
    if (sortKey === key) sortDir *= -1;
    else { sortKey = key; sortDir = 1; }
    document.querySelectorAll("#companiesTable th").forEach((t) => t.classList.remove("asc", "desc"));
    th.classList.add(sortDir === 1 ? "asc" : "desc");
    renderTable();
  });
});

document.getElementById("tableSearch").addEventListener("input", (e) => {
  searchTerm = e.target.value.trim();
  renderTable();
});

document.getElementById("tableFilters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll("#tableFilters .chip").forEach((c) => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  activeFilter = chip.dataset.filter;
  renderTable();
});

/* ==========================================================
   Geral — reveal on scroll + menu mobile
   ========================================================== */
const observer = new IntersectionObserver(
  (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-visible"); observer.unobserve(en.target); } }),
  { threshold: 0.12 }
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
