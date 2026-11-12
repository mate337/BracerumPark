/* Bracerum Park — service worker do cadastro rápido de lead (/cadastro/).
   Guarda a "casca" da página (HTML, CSS, JS, logos) para ela ABRIR sem internet — na feira o sinal cai.
   Os cadastros sem internet ficam no localStorage, pelo cadastro.js — aqui não.
   A API (/api/…) nunca passa pelo cache. Ao trocar ?v= no index.html, trocar VERSAO aqui também.
   Mesmo desenho do admin/sw.js. Documentação: docs/cadastro-lead.md. */
const VERSAO = 'bp-cadastro-v2';
const CASCA = ['./', './cadastro.css?v=2', './cadastro.js?v=2', './manifest.webmanifest',
  '../assets/logo/logo-compact-cream.svg', '../assets/favicon.svg', '../assets/apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => Promise.all(CASCA.map((u) => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('bp-cadastro-') && k !== VERSAO).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// rede com prazo: internet ruim não pode travar a abertura da página
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
