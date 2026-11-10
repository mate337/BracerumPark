/*
  /api/lead — recebe o formulário das landing pages e cadastra o lead no CV CRM.

  Função da Vercel (Node), irmã de /api/lotes-status. O token do CV fica só aqui, nas variáveis
  de ambiente do projeto — o navegador nunca o vê. Mesmas variáveis da outra função:
    CVCRM_TOKEN   token do usuário da API                                     [segredo]
    CVCRM_EMAIL   e-mail desse usuário (o perfil precisa de "Leads > Cadastrar/Alterar Lead")
    CVCRM_HOST    opcional, padrão bracerum.cvcrm.com.br
  Opcionais, só se a equipe quiser mudar sem publicar o site de novo:
    CVCRM_EMP_<PRODUTO>   id do empreendimento por produto (ex.: CVCRM_EMP_RESORT=7)
    CVCRM_FILA            idfila_distribuicao_leads (fila de distribuição dos corretores)

  Destino: POST https://{host}/api/v1/comercial/leads  (desenvolvedor.cvcrm.com.br,
  "Cadastra Leads"; cabeçalhos email + token, corpo JSON).

  Empreendimentos no CV (GET /api/v1/cadastros/empreendimentos, 2026-11-10):
    3 Bracerum Hotel · 4 Bracerum Park — Lotes industriais · 7 Bracerum Residence — Condomínios
    (aptos e as casas do Resort, que no CV são "Quadra Q0x (Resort)") · 9 Bracerum Outlet
    (Outlet Premium, Supermercado e lojas).

  Entrada (JSON):
    { lp, produto, idioma, nome, email, telefone, ddi, empresa, pais, perfil, interesse, prazo,
      mensagem, consentimento, pagina, attrib:{first,last}, hp, t }
    hp = campo-isca (robô preenche, gente não vê) · t = ms entre abrir a página e enviar.
  Saída: { ok:true, idlead } · { ok:false, erro } — a página mostra o WhatsApp como saída
  quando o CV falha, com os dados já escritos na mensagem, para o lead não se perder.

  ?dry=1 (ou "dry":true) devolve o corpo que seria enviado ao CV, sem enviar — para conferir.
*/
'use strict';

const EMP = { park: 4, lotes: 4, mapa: 4, residence: 7, resort: 7, outlet: 9, business: 9, hotel: 3 };

// utm -> código de origem do CV (lista "origem" da API; desconhecido vira SI = WebSite)
function origem(a) {
  const s = `${a.utm_source || ''} ${a.utm_medium || ''}`.toLowerCase();
  const ref = String(a.referrer || '').toLowerCase();
  if (a.fbclid || /facebook|\bfb\b|meta/.test(s)) return /instagram|\big\b/.test(s) ? 'IG' : 'FB';
  if (/instagram|\big\b/.test(s) || ref.includes('instagram')) return 'IG';
  if (a.gclid || /google|adwords|\bcpc\b/.test(s)) return 'GO';
  if (/linkedin/.test(s) || ref.includes('linkedin')) return 'LK';
  if (/whats/.test(s)) return 'WA';
  if (/tiktok/.test(s)) return 'TT';
  if (/email|e-mail|newsletter/.test(s)) return 'EM';
  if (/folder|offline|qr|impresso|evento|expo/.test(s)) return 'OP';   // material impresso (QR Code)
  if (/google\.|bing\.|duckduckgo|yahoo/.test(ref)) return 'BO';
  return 'SI';
}

const limpa = (v, n = 100) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const slug = (v) => limpa(v, 45).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function validar(b) {
  const nome = limpa(b.nome);
  const email = limpa(b.email).toLowerCase();
  const ddi = '+' + String(b.ddi || '').replace(/\D/g, '').slice(0, 4);
  let tel = String(b.telefone || '').replace(/\D/g, '');
  if (ddi.length > 1) tel = tel.replace(/^0+/, '');   // PY escreve 0985…; com o DDI o zero sai
  if (nome.length < 2) return { erro: 'nome' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { erro: 'email' };
  if (tel.length < 6 || tel.length > 15) return { erro: 'telefone' };
  return { nome, email, tel, ddi: ddi.length > 1 ? ddi : '' };
}

function montar(b, v) {
  const produto = slug(b.produto) || 'park';
  const lp = slug(b.lp) || produto;
  const at = (b.attrib && typeof b.attrib === 'object') ? b.attrib : {};
  const last = at.last || {}, first = at.first || {};
  const envEmp = process.env[`CVCRM_EMP_${produto.toUpperCase()}`];
  const idemp = Number(envEmp || EMP[produto]) || null;

  const campanha = last.utm_campaign || first.utm_campaign || '';
  const linhas = [
    `Landing page: ${lp} (${limpa(b.pagina, 200) || '-'})`,
    `Idioma: ${limpa(b.idioma, 5) || 'pt'}`,
    b.perfil && `Perfil: ${limpa(b.perfil)}`,
    b.interesse && `Interesse: ${limpa(b.interesse, 200)}`,
    b.prazo && `Prazo: ${limpa(b.prazo)}`,
    b.empresa && `Empresa: ${limpa(b.empresa)}`,
    b.pais && `País: ${limpa(b.pais)}`,
    b.mensagem && `Mensagem: ${limpa(b.mensagem, 1500)}`,
    `Origem (última): ${['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map((k) => last[k] || '-').join(' / ')}`,
    first.landing && `Primeira visita: ${limpa(first.at, 30)} em ${limpa(first.landing, 120)}${first.utm_source ? ` (${first.utm_source}/${first.utm_medium || '-'}/${first.utm_campaign || '-'})` : ''}`,
    (last.referrer || first.referrer) && `Referência: ${limpa(last.referrer || first.referrer, 200)}`,
    (last.gclid || last.fbclid) && `Clique de anúncio: ${last.gclid ? 'gclid ' + limpa(last.gclid, 120) : 'fbclid ' + limpa(last.fbclid, 120)}`,
    `Consentimento LGPD: ${b.consentimento ? 'sim' : 'não'}`,
  ].filter(Boolean);

  const corpo = {
    nome: v.nome,
    email: v.email,
    telefone: v.tel,
    ...(v.ddi ? { telefone_ddi: v.ddi } : {}),
    origem: origem({ ...first, ...last }),
    midia: slug(campanha || last.utm_source || `site-${lp}`) || `site-${lp}`,
    conversao: limpa(`LP ${lp}${b.interesse ? ' — ' + b.interesse : ''}`, 100),
    modulo: 'Landing page',
    tags: ['landing-page', lp, produto, limpa(b.idioma, 5) || 'pt'].filter(Boolean),
    interacoes: [{ tipo: 'A', descricao: linhas.join('\n') }],
  };
  if (idemp) corpo.idempreendimento = idemp;
  if (process.env.CVCRM_FILA) corpo.idfila_distribuicao_leads = Number(process.env.CVCRM_FILA);
  return corpo;
}

async function enviar(corpo) {
  const host = process.env.CVCRM_HOST || 'bracerum.cvcrm.com.br';
  const { CVCRM_EMAIL: email, CVCRM_TOKEN: token } = process.env;
  if (!email || !token) throw Object.assign(new Error('CVCRM_EMAIL/CVCRM_TOKEN não configurados'), { status: 503 });
  const url = `https://${host}/api/v1/comercial/leads`;
  const post = async (c) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: { email, token, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(c),
    });
    const txt = await r.text();
    let d = {};
    try { d = JSON.parse(txt); } catch (e) { d = { bruto: txt.slice(0, 300) }; }
    return { r, d };
  };
  let { r, d } = await post(corpo);
  // Lead já existe (mesmo e-mail/telefone): o CV pede permitir_alteracao para registrar a conversão nova.
  const msg = JSON.stringify(d).toLowerCase();
  if (!r.ok && r.status === 400 && /alterar|elterar|existe|duplic/.test(msg)) ({ r, d } = await post({ ...corpo, permitir_alteracao: true }));
  if (!r.ok || d.sucesso === false) {
    throw Object.assign(new Error(`CV respondeu ${r.status}: ${d.error || d.mensagem || d.message || d.bruto || 'erro'}`), { status: 502 });
  }
  return d.idlead || d.id || (d.dados && d.dados.idlead) || null;
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
  if (b.hp || (Number(b.t) > 0 && Number(b.t) < 2500)) return fim(200, { ok: true, idlead: null });

  const v = validar(b);
  if (v.erro) return fim(422, { ok: false, erro: v.erro });
  const corpo = montar(b, v);

  const dry = b.dry === true || /[?&]dry=1/.test(req.url || '');
  if (dry) return fim(200, { ok: true, dry: true, corpo });

  try {
    const idlead = await enviar(corpo);
    return fim(200, { ok: true, idlead });
  } catch (err) {
    // O lead não pode sumir: fica no log da função (Vercel → Logs) para a equipe recuperar.
    console.error('[lead] falhou', err.message, JSON.stringify({ nome: corpo.nome, email: corpo.email,
      telefone: (corpo.telefone_ddi || '') + corpo.telefone, conversao: corpo.conversao, midia: corpo.midia }));
    return fim(err.status || 502, { ok: false, erro: err.status === 503 ? 'não configurado' : 'CV indisponível' });
  }
};

module.exports.origem = origem;
module.exports.montar = montar;
module.exports.validar = validar;
