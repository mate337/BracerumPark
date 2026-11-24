'use strict';
/*
  Corretores do CV CRM → contas do Portal do Corretor + e-mail de boas-vindas (2026-11-24).

  - Lista:  GET https://<CVCRM_HOST>/api/v1/cadastros/corretores  (cabeçalhos email + token; vem com
            limit/offset, até 500 por página). Conferido no CV real em 2026-11-24.
  - Envio:  Resend (POST https://api.resend.com/emails, Authorization: Bearer RESEND_API_KEY).
  Este arquivo não grava nada: o api/portal.js decide quando criar conta e quando mandar e-mail.
*/
const CV_HOST = () => process.env.CVCRM_HOST || 'bracerum.cvcrm.com.br';
const POR_PAGINA = 500;
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ''));

async function lerCorretoresCV(fetchFn = fetch) {
  const email = process.env.CVCRM_EMAIL, token = process.env.CVCRM_TOKEN;
  if (!email || !token) throw new Error('integração com o CV não configurada neste ambiente');
  const todos = [];
  for (let offset = 0, voltas = 0; voltas < 20; voltas++, offset += POR_PAGINA) {
    const r = await fetchFn(`https://${CV_HOST()}/api/v1/cadastros/corretores?limit=${POR_PAGINA}&offset=${offset}`,
      { headers: { email, token, accept: 'application/json' } });
    if (!r.ok) throw new Error(`CV respondeu ${r.status} ao listar corretores`);
    const d = await r.json();
    const lote = Array.isArray(d.corretores) ? d.corretores : [];
    todos.push(...lote);
    if (lote.length < POR_PAGINA) break;
  }
  return todos.map(normalizar);
}

// Só o que o portal usa. Telefone vem como "+5547999990000" no CV.
function normalizar(c) {
  const tel = String(c.celular || c.telefone || '').replace(/\D/g, '');
  const ddi = ['595', '598', '55', '54'].find((x) => tel.startsWith(x)) || '';
  const imob = c.imobiliaria && typeof c.imobiliaria === 'object' ? c.imobiliaria : {};
  return {
    cvId: Number(c.idcorretor),
    nome: String(c.nome || '').replace(/\s+/g, ' ').trim(),
    email: String(c.email || '').trim().toLowerCase(),
    ddi, tel: ddi ? tel.slice(ddi.length) : tel,
    imobiliaria: String(imob.nome_fantasia || imob.nome || '').trim(),
    ativo: String(c.ativo_login || '').toUpperCase() === 'S',
    cadastro: c.data_cad || null,
  };
}

// Quem pode virar conta: login ativo no CV, e-mail válido, fora da lista de ignorados (o corretor de
// demonstração "Feira EXPO PY BR", id 2, por padrão) e fora de domínios de demonstração.
const ignorados = () => String(process.env.PORTAL_CV_IGNORAR ?? '2').split(/[,;\s]+/).filter(Boolean).map(Number);
function motivoFora(c) {
  if (!c.ativo) return 'login desativado no CV';
  if (!emailOk(c.email)) return 'sem e-mail válido no CV';
  if (ignorados().includes(c.cvId)) return 'ignorado (PORTAL_CV_IGNORAR)';
  if (/@(demonstracao|exemplo|example)\./.test(c.email)) return 'e-mail de demonstração';
  return null;
}

/* ------------------------------------------------------------------ e-mail */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || '';

function emailBoasVindas({ nome, link, origem = 'https://bracerumpark.com', teste = false }) {
  const pn = primeiroNome(nome);
  const ola = pn ? `Olá, ${pn}!` : 'Olá!';
  const assunto = `${teste ? '[TESTE] ' : ''}Seu acesso ao Portal do Corretor · Bracerum Park`;
  const img = (f) => `${origem}/portalcorretores/email/${f}`;
  const itens = ['Materiais de divulgação e folders digitais', 'Vídeos do parque', 'Cards de ofertas para WhatsApp',
    'Tabela de preços e masterplan 3D com a disponibilidade dos lotes', 'Novidades do Bracerum Park'];
  const texto = [
    ola, '',
    'Seja bem-vindo ao Bracerum Park! Aqui está o seu acesso ao Portal do Corretor, onde adicionaremos materiais de divulgação, vídeos, cards para WhatsApp, novidades e muito mais.',
    '', 'Para entrar, crie a sua senha neste link:', link, '',
    'Depois é só acessar bracerumpark.com/PortalCorretores com este e-mail e a senha que você criou.',
    '', 'Bracerum Park · Villeta, Paraguai',
  ].join('\n');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(assunto)}</title></head>
<body style="margin:0;padding:0;background:#f2f2f0;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Crie a sua senha e acesse materiais, vídeos e cards do Bracerum Park.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f0;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;color:#0b0b0b;">
  ${teste ? '<tr><td style="background:#fff4c2;padding:10px 32px;font-size:12px;color:#5a4a00;">E-mail de teste — o link abaixo é o da sua própria conta.</td></tr>' : ''}
  <tr><td style="background:#0b0b0b;padding:26px 32px;"><img src="${img('logo-branco.png')}" width="180" height="29" alt="Bracerum Park" style="display:block;border:0;width:180px;height:auto;"></td></tr>
  <tr><td style="padding:0;"><img src="${img('capa.jpg')}" width="600" alt="" style="display:block;border:0;width:100%;height:auto;"></td></tr>
  <tr><td style="padding:40px 32px 8px;">
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6e6e6b;">Portal do Corretor</p>
    <h1 style="margin:0 0 20px;font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-.02em;">${esc(ola)}</h1>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2b2b2b;">Seja bem-vindo ao <b>Bracerum Park</b>! Aqui está o seu acesso ao Portal do Corretor, onde adicionaremos materiais de divulgação, vídeos, cards para WhatsApp, novidades e muito mais.</p>
    <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#2b2b2b;">Para entrar, é só criar a sua senha:</p>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#0b0b0b;border-radius:999px;">
      <a href="${esc(link)}" style="display:inline-block;padding:16px 30px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Criar minha senha &rarr;</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:32px 32px 8px;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#0b0b0b;">No portal você encontra</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${itens.map((t) => `<tr><td style="padding:10px 0;border-top:1px solid #e6e6e3;font-size:15px;color:#2b2b2b;">${esc(t)}</td></tr>`).join('')}
    </table>
  </td></tr>
  <tr><td style="padding:24px 32px 36px;font-size:13px;line-height:1.6;color:#6e6e6b;">
    Depois de criar a senha, acesse <a href="${esc(origem)}/PortalCorretores" style="color:#0b0b0b;">bracerumpark.com/PortalCorretores</a> com este e-mail.<br>
    Se o botão não abrir, copie este link no navegador:<br><span style="word-break:break-all;color:#0b0b0b;">${esc(link)}</span>
  </td></tr>
  <tr><td style="background:#0b0b0b;padding:22px 32px;font-size:12px;line-height:1.6;color:#a8a8a4;">
    Bracerum Park · Villeta, Paraguai · <a href="${esc(origem)}" style="color:#ffffff;">bracerumpark.com</a><br>
    Você recebeu este e-mail porque foi cadastrado como corretor parceiro do Bracerum Park.
  </td></tr>
</table></td></tr></table></body></html>`;
  return { assunto, html, texto };
}

/* ------------------------------------------------------------------ envio (Resend) */
const remetente = () => process.env.PORTAL_EMAIL_DE || 'Bracerum Park <portal@bracerumpark.com>';
const responderPara = () => process.env.PORTAL_EMAIL_RESPONDER || 'bracerumpark@bracerum.com';
const emailConfigurado = () => !!process.env.RESEND_API_KEY;

async function enviarEmail({ para, assunto, html, texto }, fetchFn = fetch) {
  if (!emailConfigurado()) throw new Error('envio de e-mail não configurado (RESEND_API_KEY)');
  const r = await fetchFn('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: remetente(), to: [para], reply_to: responderPara(), subject: assunto, html, text: texto }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.id) throw new Error(`Resend ${r.status}: ${String(d.message || d.error || 'falha no envio').slice(0, 200)}`);
  return { id: d.id };
}

module.exports = { lerCorretoresCV, normalizar, motivoFora, emailBoasVindas, enviarEmail, emailConfigurado, remetente, emailOk };
