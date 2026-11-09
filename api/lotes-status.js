/*
  /api/lotes-status — situação dos lotes do loteamento, lida do CV CRM.

  Função da Vercel (Node). A maquete 3D (3dmasterplan/) chama este endereço e pinta cada lote
  como reservado, vendido ou indisponível. O token do CV fica só aqui, nas variáveis de
  ambiente do projeto na Vercel — nunca vai para o navegador.

  Variáveis (Vercel → Settings → Environment Variables):
    CVCRM_TOKEN           token do usuário da API (Painel do Gestor → usuários → Token)   [segredo]
    CVCRM_EMAIL           e-mail desse usuário
    CVCRM_HOST            opcional, padrão bracerum.cvcrm.com.br
    CVCRM_EMPREENDIMENTO  opcional, padrão 3 (Bracerum Park — Lotes industriais)

  Fonte: GET /api/v1/comercial/mapadisponibilidade/{id} (docs: desenvolvedor.cvcrm.com.br).
  Resposta pública, só o mínimo: { ok, atualizado, lotes: { "Q07.L014": "v", ... } }
    r = reservado (inclui "em processo de reserva") · v = vendido · b = bloqueado/indisponível
    lote ausente = disponível.
  Nada de comprador, corretor ou documento sai daqui (o CV manda isso junto).

  Cache: a CDN da Vercel guarda a resposta por 60 s (e serve a anterior por até 10 min enquanto
  atualiza), então o CV recebe no máximo ~1 consulta por minuto, longe do limite de 200/min.
*/
'use strict';

const POR_PAGINA = 300;
const MAX_PAGINAS = 20;

const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// situação do CV -> código curto; null = disponível (não entra na resposta)
function codigo(sit) {
  if (sit == null || sit === '') return undefined;
  if (typeof sit === 'number' || /^\d+$/.test(String(sit))) {
    return { 1: null, 2: 'r', 3: 'v', 4: 'b', 5: 'r' }[Number(sit)];
  }
  const s = semAcento(sit);
  if (s.startsWith('disponi')) return null;
  if (s.includes('vendid')) return 'v';
  if (s.includes('reserv')) return 'r';          // "Reservada", "Em processo de reserva"
  if (s.includes('bloque')) return 'b';
  return undefined;
}

// "LTIND.Q07.L014", "Q07.L014", "LTIND.Q07.L014.A01250.ESQNAO.RT.L" -> "Q07.L014"
function idLote(nome) {
  const m = /Q(\d{2})\.L(\d{3})/i.exec(String(nome || ''));
  return m ? `Q${m[1]}.L${m[2]}` : null;
}

async function pagina(base, headers, pag) {
  const r = await fetch(`${base}?limitePagina=${POR_PAGINA}&pag=${pag}`, { headers });
  const txt = await r.text();
  let d;
  try { d = JSON.parse(txt); } catch (e) { throw new Error(`CV respondeu ${r.status} sem JSON`); }
  if (!r.ok) throw new Error(`CV respondeu ${r.status}: ${d.error || d.mensagem || d.message || 'erro'}`);
  return d;
}

async function lerCV() {
  const host = process.env.CVCRM_HOST || 'bracerum.cvcrm.com.br';
  const emp = process.env.CVCRM_EMPREENDIMENTO || '3';
  const { CVCRM_EMAIL: email, CVCRM_TOKEN: token } = process.env;
  if (!email || !token) throw Object.assign(new Error('CVCRM_EMAIL/CVCRM_TOKEN não configurados'), { status: 503 });
  const base = `https://${host}/api/v1/comercial/mapadisponibilidade/${encodeURIComponent(emp)}`;
  const headers = { email, token, accept: 'application/json' };

  const lotes = {};
  const desconhecidas = new Set();
  let total = 0, pag = 1, paginas = 1;
  do {
    const d = await pagina(base, headers, pag);
    const dados = Array.isArray(d.dados) ? d.dados : [];
    for (const u of dados) {
      const id = idLote(u.unidade || u.nome);
      if (!id) continue;
      total++;
      const sit = u.situacao_mapa_disponibilidade ?? u.situacao;
      const c = codigo(typeof sit === 'object' && sit ? (sit.situacao_mapa_disponibilidade ?? sit.nome) : sit);
      if (c === undefined) { desconhecidas.add(String(sit)); continue; }
      if (c) lotes[id] = c;
    }
    const pg = d.paginacao || d.Pagination || {};
    paginas = Number(pg.total_de_paginas || pg.total_paginas || 1);
    if (!dados.length) break;
    pag++;
  } while (pag <= paginas && pag <= MAX_PAGINAS);

  return { total, lotes, desconhecidas: [...desconhecidas] };
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  try {
    const { total, lotes, desconhecidas } = await lerCV();
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=60, stale-while-revalidate=600');
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, fonte: 'CV CRM', atualizado: new Date().toISOString(), total, lotes,
      ...(desconhecidas.length ? { desconhecidas } : {}) }));
  } catch (err) {
    console.error('[lotes-status]', err.message);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'public, s-maxage=15');
    res.statusCode = err.status || 502;
    res.end(JSON.stringify({ ok: false, erro: err.status === 503 ? 'não configurado' : 'CV indisponível' }));
  }
};

module.exports.codigo = codigo;
module.exports.idLote = idLote;
