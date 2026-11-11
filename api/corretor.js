/*
  /api/corretor — recebe o cadastro da LP de corretores (/corretores) e grava uma linha na
  planilha "Leads Corretores" do Google Drive. **Não passa pelo CV CRM** (pedido de 2026-11-11).

  Função da Vercel (Node), irmã de /api/lead. A planilha recebe pelo Apps Script publicado nela
  como "App da Web" (código em docs/corretores-planilha.gs, instalação em docs/corretores.md):
    CORRETORES_PLANILHA_URL   URL /exec do Apps Script                              [segredo]
  Sem a variável, ou se a planilha não responder, a função devolve ok:false e grava o cadastro
  no log (Vercel → Logs, "[corretor]") — e a pessoa chega ao Sydney pelo WhatsApp do mesmo jeito,
  porque a página abre a conversa com nome e imobiliária já escritos.

  Entrada (JSON): { lp, idioma, pagina, nome, telefone, ddi, imobiliaria, attrib:{first,last}, hp, t }
    hp = campo-isca (robô preenche, gente não vê) · t = ms entre abrir a página e enviar.
  Saída: { ok:true, linha } · { ok:false, erro }.
  ?dry=1 (ou "dry":true) devolve a linha que iria para a planilha, sem gravar — para conferir.
*/
'use strict';

const limpa = (v, n = 100) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

function validar(b) {
  const nome = limpa(b.nome);
  const imobiliaria = limpa(b.imobiliaria);
  const ddi = String(b.ddi || '').replace(/\D/g, '').slice(0, 4);
  let tel = String(b.telefone || '').replace(/\D/g, '');
  // Quem digita o número já com o código do país (5547…, 595985…) ganha o código duas vezes.
  if (ddi && tel.length > 11 && tel.startsWith(ddi)) tel = tel.slice(ddi.length);
  if (ddi) tel = tel.replace(/^0+/, '');   // PY escreve 0985…; com o DDI o zero sai
  if (nome.length < 2) return { erro: 'nome' };
  if (imobiliaria.length < 2) return { erro: 'imobiliaria' };
  if (tel.length < (ddi === '55' ? 10 : 6) || tel.length > 15) return { erro: 'telefone' };
  return { nome, imobiliaria, ddi, tel };
}

// +55 47 98803-0200 no Brasil; nos outros países, +595 985516065.
function formataTel(ddi, tel) {
  if (ddi === '55' && (tel.length === 10 || tel.length === 11)) {
    const ddd = tel.slice(0, 2), n = tel.slice(2);
    return `+55 ${ddd} ${n.slice(0, -4)}-${n.slice(-4)}`;
  }
  return ddi ? `+${ddi} ${tel}` : tel;
}

function linha(b, v) {
  const at = (b.attrib && typeof b.attrib === 'object') ? b.attrib : {};
  const last = at.last || {}, first = at.first || {};
  const utm = ['utm_source', 'utm_medium', 'utm_campaign'].map((k) => last[k] || first[k]).filter(Boolean);
  const ref = last.referrer || first.referrer;
  let origem = utm.length ? utm.join(' / ') : 'direto';
  if (!utm.length && ref) { try { origem = new URL(ref).hostname; } catch (e) { origem = limpa(ref, 80); } }
  return {
    data: new Date().toISOString(),
    nome: v.nome,
    whatsapp: formataTel(v.ddi, v.tel),
    imobiliaria: v.imobiliaria,
    conversa: `https://wa.me/${v.ddi}${v.tel}`,
    idioma: limpa(b.idioma, 5) || 'pt',
    origem: limpa(origem, 120),
    pagina: limpa(b.pagina, 200),
  };
}

async function gravar(row) {
  const url = process.env.CORRETORES_PLANILHA_URL;
  if (!url) throw Object.assign(new Error('CORRETORES_PLANILHA_URL não configurada'), { status: 503 });
  const ctrl = new AbortController();
  const tempo = setTimeout(() => ctrl.abort(), 15000);   // o Apps Script frio leva alguns segundos
  try {
    // O /exec responde com um 302 para script.googleusercontent.com; o fetch segue (como GET) e
    // devolve o JSON do doPost. text/plain evita qualquer conversão do corpo no Google.
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'text/plain;charset=utf-8', accept: 'application/json' },
      body: JSON.stringify(row),
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const txt = await r.text();
    let d = {};
    try { d = JSON.parse(txt); } catch (e) { d = { bruto: txt.replace(/\s+/g, ' ').slice(0, 160) }; }
    if (!r.ok || d.ok !== true) {
      throw Object.assign(new Error(`planilha respondeu ${r.status}: ${d.erro || d.bruto || 'erro'}`), { status: 502 });
    }
    return d.linha || null;
  } finally {
    clearTimeout(tempo);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const fim = (status, obj) => { res.statusCode = status; res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fim(405, { ok: false, erro: 'método' }); }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return fim(400, { ok: false, erro: 'corpo' });

  // Robô: preencheu o campo-isca ou enviou rápido demais. Responde "ok" para não ensinar o robô.
  if (b.hp || (Number(b.t) > 0 && Number(b.t) < 2500)) return fim(200, { ok: true, linha: null });

  const v = validar(b);
  if (v.erro) return fim(422, { ok: false, erro: v.erro });
  const row = linha(b, v);

  if (b.dry === true || /[?&]dry=1/.test(req.url || '')) return fim(200, { ok: true, dry: true, linha: row });

  try {
    return fim(200, { ok: true, linha: await gravar(row) });
  } catch (err) {
    // O cadastro não pode sumir: fica no log da função (Vercel → Logs) para a equipe recuperar.
    console.error('[corretor] falhou', err.message, JSON.stringify(row));
    return fim(err.status || 502, { ok: false, erro: err.status === 503 ? 'não configurado' : 'planilha indisponível' });
  }
};

module.exports.validar = validar;
module.exports.linha = linha;
module.exports.formataTel = formataTel;
