/* Bracerum Park — service worker do painel de reservas (/admin/).
   Guarda a "casca" do painel (página, CSS, JS, mapa dos lotes, logos) para ele ABRIR sem internet.
   Os dados (situação dos lotes, preços, fila de cadastros) ficam no localStorage, pelo admin.js — aqui não.
   A API (/api/…) nunca passa pelo cache: sem rede, o admin.js guarda o cadastro na fila e envia depois.
   Ao trocar ?v= no index.html, trocar VERSAO aqui também. Documentação: docs/admin-reservas.md. */
const VERSAO = 'bp-admin-v6';
const CASCA = ['./', './admin.css?v=6', './admin.js?v=6', './manifest.webmanifest', '../3dmasterplan/data/lotes.json',
  '../assets/logo/logo-horizontal-cream.svg', '../assets/logo/logo-compact-cream.svg', '../assets/favicon.svg', '../assets/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.all(CASCA.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bp-admin-') && k !== VERSAO).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// rede com prazo: internet ruim não pode travar a abertura do painel
const comPrazo = (p, ms) => Promise.race([p, new Promise((_, n) => setTimeout(() => n(new Error('prazo')), ms))]);

self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin === self.location.origin && url.pathname.startsWith('/api/')) return;
  const daCasa = url.origin === self.location.origin;
  const fontes = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!daCasa && !fontes) return;

  if (req.mode === 'navigate') {                 // a página: rede (até 4 s) e, sem ela, a cópia guardada
    e.respondWith((async () => {
      const c = await caches.open(VERSAO);
      try {
        const r = await comPrazo(fetch(req), 4000);
        if (r.ok) c.put('./', r.clone());
        return r;
      } catch (err) {
        return (await c.match('./')) || (await c.match(req, { ignoreSearch: true })) || Response.error();
      }
    })());
    return;
  }
  // o resto: a cópia na hora, e atualiza por trás (stale-while-revalidate)
  e.respondWith((async () => {
    const c = await caches.open(VERSAO);
    const guardada = await c.match(req) || (daCasa ? await c.match(req, { ignoreSearch: true }) : null);
    const nova = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => null);
    if (guardada) { e.waitUntil(nova); return guardada; }
    return (await nova) || Response.error();
  })());
});
