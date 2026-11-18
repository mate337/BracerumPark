/*
  /api/portal — servidor do Portal do Corretor (bracerumpark.com/PortalCorretores).

  Guarda tudo num Vercel Blob **privado** (store "portal-corretores", região gru1), ligado ao projeto
  pela variável BLOB_READ_WRITE_TOKEN (criada junto com o store). Nada passa pelo CV CRM aqui —
  o portal leva o corretor ao painel do CV (bracerum.cvcrm.com.br/corretor/) para lead, reserva e
  comissão. Documentação: docs/portal-corretores.md.

  Variáveis:
    BLOB_READ_WRITE_TOKEN    store privado do portal                                  [segredo]
    ADMIN_SENHA              mesma senha do /admin — entra como "equipe" no portal    [segredo]
    CORRETORES_PLANILHA_URL  (opcional) cada conta nova também vira linha na planilha
                             "Leads Corretores", como o cadastro de /corretores       [segredo]
    PORTAL_SEGREDO           (opcional) chave da sessão; sem ela deriva das outras

  Arquivos no store:
    portal/u/<id>.json       conta do corretor (id = sha256 do e-mail, 24 hex)
    portal/p/<id>.json       pedido ao marketing
    portal/avisos.json       mural (lista)

  Sessão: cookie HttpOnly "bp_portal" (HMAC, 30 dias, SameSite=Strict). Todo pedido é POST JSON
  com { acao, ... }. Papéis: "corretor" (status pendente | aprovado | bloqueado) e "equipe".
  Corretor pendente entra e usa materiais, tabela e divulgação; abrir pedido ao marketing só aprovado.
*/
'use strict';

const crypto = require('crypto');

let blob = null;
const B = () => (blob || (blob = require('@vercel/blob')));

/* ------------------------------------------------------------------ utilitários */
const limpa = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const texto = (v, n = 2000) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, n);
const erro = (status, message) => Object.assign(new Error(message), { status });
const agora = () => new Date().toISOString();
const idEmail = (email) => crypto.createHash('sha256').update(`bp-portal|${email}`).digest('hex').slice(0, 24);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const urlOk = (u) => !u || /^https:\/\/[^\s]+$/i.test(u);

function segredo() {
  return process.env.PORTAL_SEGREDO || crypto.createHash('sha256')
    .update(`bp-portal|${process.env.ADMIN_SENHA || ''}|${process.env.BLOB_READ_WRITE_TOKEN || ''}|${process.env.CVCRM_TOKEN || ''}`)
    .digest('hex');
}

/* ------------------------------------------------------------------ senha (scrypt) */
function hashSenha(senha, sal = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(String(senha), sal, 32, { N: 16384, r: 8, p: 1 }).toString('hex');
  return { sal, h };
}
function senhaConfere(senha, reg) {
  if (!reg || !reg.sal || !reg.h) return false;
  const a = Buffer.from(hashSenha(senha, reg.sal).h, 'hex');
  const b = Buffer.from(reg.h, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function senhaEquipeOk(s) {
  const certa = process.env.ADMIN_SENHA;
  if (!certa) return false;
  const a = crypto.createHash('sha256').update(String(s || '')).digest();
  const b = crypto.createHash('sha256').update(certa).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ sessão (cookie assinado) */
const COOKIE = 'bp_portal';
const DIAS = 30;
const assina = (p) => crypto.createHmac('sha256', segredo()).update(p).digest('base64url');
function emitir(res, s) {
  const corpo = Buffer.from(JSON.stringify({ ...s, x: Date.now() + DIAS * 864e5 })).toString('base64url');
  const v = `${corpo}.${assina(corpo)}`;
  res.setHeader('Set-Cookie', `${COOKIE}=${v}; Path=/api/portal; HttpOnly; Secure; SameSite=Strict; Max-Age=${DIAS * 86400}`);
}
function apagarCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/api/portal; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
function lerSessao(req) {
  const m = String(req.headers.cookie || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return null;
  const [corpo, sig] = m[1].split('.');
  if (!corpo || !sig) return null;
  const e = assina(corpo);
  if (sig.length !== e.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(e))) return null;
  try {
    const s = JSON.parse(Buffer.from(corpo, 'base64url').toString());
    return s.x > Date.now() ? s : null;
  } catch (err) { return null; }
}

/* ------------------------------------------------------------------ limite de tentativas (por instância) */
const tentativas = new Map();
function bloqueado(chave) {
  const t = (tentativas.get(chave) || []).filter((x) => Date.now() - x < 10 * 60e3);
  tentativas.set(chave, t);
  return t.length >= 8;
}
const falhou = (chave) => tentativas.set(chave, [...(tentativas.get(chave) || []), Date.now()]);

/* ------------------------------------------------------------------ armazenamento */
function exigeStore() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw erro(503, 'Armazenamento do portal não configurado');
}
async function ler(caminho) {
  exigeStore();
  const r = await B().get(caminho, { access: 'private', useCache: false }).catch((e) => {
    if (/not.?found|404/i.test(String(e && (e.name + e.message)))) return null;
    throw e;
  });
  if (!r || !r.stream) return null;
  const txt = await new Response(r.stream).text();
  try { return JSON.parse(txt); } catch (e) { return null; }
}
async function gravar(caminho, obj) {
  exigeStore();
  await B().put(caminho, JSON.stringify(obj), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true,
    contentType: 'application/json', cacheControlMaxAge: 60,
  });
  return obj;
}
async function listar(prefixo) {
  exigeStore();
  const out = [];
  let cursor;
  do {
    const r = await B().list({ prefix: prefixo, cursor, limit: 1000 });
    out.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}
async function lerVarios(blobs, limite = 300) {
  const alvo = blobs.slice(0, limite);
  const res = [];
  for (let i = 0; i < alvo.length; i += 12) {
    const lote = await Promise.all(alvo.slice(i, i + 12).map((b) => ler(b.pathname).catch(() => null)));
    res.push(...lote.filter(Boolean));
  }
  return res;
}

const caminhoU = (id) => `portal/u/${id}.json`;
const caminhoP = (id) => `portal/p/${id}.json`;
const CAMINHO_AVISOS = 'portal/avisos.json';

/* ------------------------------------------------------------------ contas */
function publico(u) {
  if (!u) return null;
  return {
    id: u.id, nome: u.nome, email: u.email, ddi: u.ddi, tel: u.tel, imobiliaria: u.imobiliaria,
    creci: u.creci, pais: u.pais, idioma: u.idioma, status: u.status, criado: u.criado,
    aprovado: u.aprovado || null, slug: u.slug, papel: 'corretor',
  };
}
function slugDe(nome, id) {
  const base = limpa(nome, 60).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').filter(Boolean);
  const curto = [base[0], base.length > 1 ? base[base.length - 1] : ''].filter(Boolean).join('-') || 'corretor';
  return `${curto}-${id.slice(0, 4)}`;
}
function validarConta(b, parcial) {
  const v = {};
  const nome = limpa(b.nome, 80);
  if (!parcial || b.nome !== undefined) {
    if (nome.split(' ').filter((x) => x.length > 1).length < 2) throw erro(422, 'Escreva nome e sobrenome');
    v.nome = nome;
  }
  if (!parcial || b.tel !== undefined) {
    const ddi = String(b.ddi || '').replace(/\D/g, '').slice(0, 4) || '55';
    let tel = String(b.tel || '').replace(/\D/g, '');
    if (tel.length > 11 && tel.startsWith(ddi)) tel = tel.slice(ddi.length);
    tel = tel.replace(/^0+/, '');
    if (tel.length < (ddi === '55' ? 10 : 6) || tel.length > 15) throw erro(422, 'WhatsApp inválido');
    v.ddi = ddi; v.tel = tel;
  }
  if (!parcial || b.imobiliaria !== undefined) {
    const imob = limpa(b.imobiliaria, 80);
    if (imob.length < 2) throw erro(422, 'Informe a imobiliária (ou "Autônomo")');
    v.imobiliaria = imob;
  }
  if (b.creci !== undefined) v.creci = limpa(b.creci, 30);
  if (b.pais !== undefined) v.pais = ['BR', 'PY', 'AR', 'UY', 'OUTRO'].includes(b.pais) ? b.pais : 'OUTRO';
  if (b.idioma !== undefined) v.idioma = ['pt', 'es', 'en'].includes(b.idioma) ? b.idioma : 'pt';
  return v;
}
function validarSenha(s) {
  s = String(s || '');
  if (s.length < 8) throw erro(422, 'A senha precisa de pelo menos 8 caracteres');
  if (s.length > 200) throw erro(422, 'Senha longa demais');
  return s;
}

async function avisarPlanilha(u) {
  const url = process.env.CORRETORES_PLANILHA_URL;
  if (!url) return;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const tel = u.ddi === '55' && u.tel.length >= 10
      ? `+55 ${u.tel.slice(0, 2)} ${u.tel.slice(2, -4)}-${u.tel.slice(-4)}` : `+${u.ddi} ${u.tel}`;
    await fetch(url, {
      method: 'POST', redirect: 'follow', signal: ctrl.signal,
      headers: { 'content-type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        data: agora(), nome: u.nome, whatsapp: tel, imobiliaria: u.imobiliaria,
        conversa: `https://wa.me/${u.ddi}${u.tel}`, idioma: u.idioma || 'pt',
        origem: 'portal do corretor', pagina: `/PortalCorretores · ${u.email}`,
      }),
    });
  } catch (e) {
    console.error('[portal] planilha', e.message);
  } finally { clearTimeout(t); }
}

async function cadastro(b, res) {
  const email = limpa(b.email, 120).toLowerCase();
  if (!emailOk(email)) throw erro(422, 'E-mail inválido');
  const senha = validarSenha(b.senha);
  const v = validarConta({ ...b, pais: b.pais || 'BR', idioma: b.idioma || 'pt' });
  if (!b.termo) throw erro(422, 'É preciso aceitar os termos de uso do portal');
  const id = idEmail(email);
  if (await ler(caminhoU(id))) throw erro(409, 'Já existe uma conta com esse e-mail. Entre com a sua senha.');
  const u = {
    id, email, ...v, slug: slugDe(v.nome, id), senha: hashSenha(senha), status: 'pendente',
    criado: agora(), termo: { versao: '2026-11', aceito: agora() }, acessos: [agora()],
  };
  await gravar(caminhoU(id), u);
  await avisarPlanilha(u);
  emitir(res, { p: 'corretor', u: id });
  return { usuario: publico(u) };
}

async function login(b, res, ip) {
  const email = limpa(b.email, 120).toLowerCase();
  const chave = `${ip}|${email}`;
  if (bloqueado(chave)) throw erro(429, 'Muitas tentativas. Espere 10 minutos.');
  const u = emailOk(email) ? await ler(caminhoU(idEmail(email))) : null;
  if (!u || !senhaConfere(b.senha, u.senha)) {
    falhou(chave);
    await new Promise((r) => setTimeout(r, 600));
    throw erro(401, 'E-mail ou senha incorretos');
  }
  if (u.status === 'bloqueado') throw erro(403, 'Acesso suspenso. Fale com a equipe Bracerum.');
  u.acessos = [agora(), ...(u.acessos || [])].slice(0, 20);
  await gravar(caminhoU(u.id), u);
  if (u.papel === 'equipe') {
    emitir(res, { p: 'equipe', n: u.nome, u: u.id });
    return { usuario: equipePublico(u) };
  }
  emitir(res, { p: 'corretor', u: u.id });
  return { usuario: publico(u) };
}

/* ------------------------------------------------------------------ contas da equipe (convite) */
/* Administrador com e-mail próprio. O primeiro acesso é por um link de convite:
   /PortalCorretores#/convite/<e-mail em base64url>.<assinatura>, assinatura = HMAC(PORTAL_CONVITE, e-mail).
   O link só vale enquanto a conta não tem senha — depois de usado, morre.
   Quem pode receber convite: e-mails em PORTAL_ADMINS (lista separada por vírgula) ou contas que a
   equipe convidou pelo portal (registro com papel "equipe" ainda sem senha). */
const equipePublico = (u) => ({ papel: 'equipe', nome: u.nome, id: u.id, email: u.email, conta: true });
const listaAdmins = () => String(process.env.PORTAL_ADMINS || '').toLowerCase().split(/[,;\s]+/).filter(emailOk);
function assinaConvite(email) {
  const chave = process.env.PORTAL_CONVITE;
  if (!chave) throw erro(503, 'Convites não configurados (PORTAL_CONVITE)');
  return crypto.createHmac('sha256', chave).update(`convite|${email}`).digest('hex').slice(0, 32);
}
const linkConvite = (origem, email) => `${origem}/PortalCorretores#/convite/${Buffer.from(email).toString('base64url')}.${assinaConvite(email)}`;
function lerConvite(token) {
  const [e64, sig] = String(token || '').split('.');
  let email = '';
  try { email = Buffer.from(e64 || '', 'base64url').toString().toLowerCase(); } catch (err) { email = ''; }
  if (!emailOk(email) || !sig) throw erro(400, 'Convite inválido');
  const certo = assinaConvite(email);
  if (sig.length !== certo.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(certo))) throw erro(400, 'Convite inválido');
  return email;
}
async function conviteVer(b) {
  const email = lerConvite(b.token);
  const u = await ler(caminhoU(idEmail(email)));
  if (u && u.senha) throw erro(410, 'Este convite já foi usado. Entre com o seu e-mail e senha.');
  if (!(u && u.papel === 'equipe') && !listaAdmins().includes(email)) throw erro(403, 'Convite sem permissão');
  return { email, nome: (u && u.nome) || '' };
}
async function conviteAceitar(b, res) {
  const { email } = await conviteVer(b);
  const nome = limpa(b.nome, 60);
  if (nome.length < 2) throw erro(422, 'Escreva o seu nome');
  const senha = validarSenha(b.senha);
  const id = idEmail(email);
  const antes = (await ler(caminhoU(id))) || {};
  const u = {
    ...antes, id, email, nome, papel: 'equipe', status: 'aprovado', senha: hashSenha(senha),
    criado: antes.criado || agora(), ativado: agora(), acessos: [agora()],
  };
  await gravar(caminhoU(id), u);
  console.log('[portal] conta da equipe ativada', id);
  emitir(res, { p: 'equipe', n: nome, u: id });
  return { usuario: equipePublico(u) };
}
async function convidarEquipe(b, s, req) {
  const email = limpa(b.email, 120).toLowerCase();
  if (!emailOk(email)) throw erro(422, 'E-mail inválido');
  const id = idEmail(email);
  const u = await ler(caminhoU(id));
  if (u && u.papel !== 'equipe') throw erro(409, 'Esse e-mail já tem conta de corretor');
  if (u && u.senha) throw erro(409, 'Essa pessoa já ativou o acesso');
  if (!u) await gravar(caminhoU(id), { id, email, nome: limpa(b.nome, 60), papel: 'equipe', status: 'aprovado', criado: agora(), convidadoPor: s.n });
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'bracerumpark.com');
  return { link: linkConvite(`https://${host}`, email) };
}
async function equipeListar() {
  const lst = await lerVarios(await listar('portal/u/'), 1000);
  return lst.filter((u) => u.papel === 'equipe').map((u) => ({ nome: u.nome, email: u.email, ativo: !!u.senha, ultimoAcesso: (u.acessos || [])[0] || null }));
}

function loginEquipe(b, res, ip) {
  if (!process.env.ADMIN_SENHA) throw erro(503, 'Senha da equipe não configurada');
  if (bloqueado(`eq|${ip}`)) throw erro(429, 'Muitas tentativas. Espere 10 minutos.');
  if (!senhaEquipeOk(b.senha)) { falhou(`eq|${ip}`); throw erro(401, 'Senha incorreta'); }
  const nome = limpa(b.nome, 40);
  if (nome.length < 2) throw erro(422, 'Escreva o seu nome');
  emitir(res, { p: 'equipe', n: nome });
  return { usuario: { papel: 'equipe', nome, id: 'equipe' } };
}

/* ------------------------------------------------------------------ pedidos ao marketing */
const TIPOS = ['peca', 'impresso', 'evento', 'video', 'traducao', 'visita', 'material', 'outro'];
const PRODUTOS = ['park', 'residence', 'resort', 'hotel', 'outlet', 'geral'];
const STATUS = ['recebido', 'producao', 'aprovacao', 'entregue', 'cancelado'];

async function pedidoCriar(b, u) {
  if (u.status !== 'aprovado') throw erro(403, 'Pedidos ao marketing são liberados depois da aprovação do seu cadastro.');
  const tipo = TIPOS.includes(b.tipo) ? b.tipo : 'outro';
  const produto = PRODUTOS.includes(b.produto) ? b.produto : 'geral';
  const titulo = limpa(b.titulo, 100);
  const descricao = texto(b.descricao, 2000);
  if (titulo.length < 4) throw erro(422, 'Dê um título ao pedido');
  if (descricao.length < 10) throw erro(422, 'Descreva o que você precisa');
  const prazo = /^\d{4}-\d{2}-\d{2}$/.test(b.prazo || '') ? b.prazo : null;
  const ref = limpa(b.referencia, 400);
  if (!urlOk(ref)) throw erro(422, 'O link de referência precisa começar com https://');
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  const numero = (await listar('portal/p/')).length + 1;
  const p = {
    id, numero, tipo, produto, titulo, descricao, prazo, referencia: ref || null,
    idioma: ['pt', 'es', 'en'].includes(b.idioma) ? b.idioma : 'pt',
    status: 'recebido', criado: agora(), atualizado: agora(),
    corretor: { id: u.id, nome: u.nome, email: u.email, imobiliaria: u.imobiliaria, ddi: u.ddi, tel: u.tel },
    historico: [{ em: agora(), status: 'recebido', por: u.nome }],
    entrega: null, resposta: null,
  };
  await gravar(caminhoP(id), p);
  console.log('[portal] pedido novo', numero, tipo, produto, u.email);
  return { pedido: p };
}

async function pedidosListar(s, u) {
  const blobs = (await listar('portal/p/')).sort((a, b) => b.pathname.localeCompare(a.pathname));
  let lst = await lerVarios(blobs);
  if (s.p !== 'equipe') lst = lst.filter((p) => p.corretor && p.corretor.id === u.id);
  return { pedidos: lst.sort((a, b) => String(b.criado).localeCompare(String(a.criado))) };
}

async function pedidoAtualizar(b, s) {
  const id = limpa(b.id, 40);
  const p = await ler(caminhoP(id));
  if (!p) throw erro(404, 'Pedido não encontrado');
  if (b.status !== undefined) {
    if (!STATUS.includes(b.status)) throw erro(422, 'Status inválido');
    if (b.status !== p.status) p.historico = [...(p.historico || []), { em: agora(), status: b.status, por: s.n }];
    p.status = b.status;
  }
  if (b.resposta !== undefined) p.resposta = texto(b.resposta, 2000) || null;
  if (b.entrega !== undefined) {
    const e = limpa(b.entrega, 400);
    if (!urlOk(e)) throw erro(422, 'O link de entrega precisa começar com https://');
    p.entrega = e || null;
  }
  if (b.responsavel !== undefined) p.responsavel = limpa(b.responsavel, 40) || null;
  p.atualizado = agora();
  await gravar(caminhoP(id), p);
  return { pedido: p };
}

async function pedidoCancelarProprio(b, u) {
  const p = await ler(caminhoP(limpa(b.id, 40)));
  if (!p || !p.corretor || p.corretor.id !== u.id) throw erro(404, 'Pedido não encontrado');
  if (p.status !== 'recebido') throw erro(409, 'O marketing já começou este pedido — fale com a equipe para cancelar.');
  p.status = 'cancelado';
  p.historico = [...(p.historico || []), { em: agora(), status: 'cancelado', por: u.nome }];
  p.atualizado = agora();
  await gravar(caminhoP(p.id), p);
  return { pedido: p };
}

/* ------------------------------------------------------------------ mural */
async function avisos() {
  const a = await ler(CAMINHO_AVISOS);
  return { avisos: Array.isArray(a) ? a : [] };
}
async function avisoSalvar(b, s) {
  const lst = (await avisos()).avisos;
  if (b.remover) {
    const out = lst.filter((x) => x.id !== b.remover);
    await gravar(CAMINHO_AVISOS, out);
    return { avisos: out };
  }
  const titulo = limpa(b.titulo, 100);
  const corpo = texto(b.texto, 600);
  if (titulo.length < 3) throw erro(422, 'Dê um título ao aviso');
  const link = limpa(b.link, 400);
  if (!urlOk(link) && !/^#\//.test(link)) throw erro(422, 'Link inválido');
  const novo = { id: crypto.randomBytes(4).toString('hex'), titulo, texto: corpo, link: link || null, fixo: !!b.fixo, por: s.n, em: agora() };
  const out = [novo, ...lst].slice(0, 40);
  await gravar(CAMINHO_AVISOS, out);
  return { avisos: out };
}

/* ------------------------------------------------------------------ equipe: corretores */
async function corretoresListar() {
  const lst = (await lerVarios(await listar('portal/u/'), 1000)).filter((u) => u.papel !== 'equipe');
  return {
    equipe: await equipeListar(),
    corretores: lst.map((u) => ({ ...publico(u), ultimoAcesso: (u.acessos || [])[0] || null }))
      .sort((a, b) => String(b.criado).localeCompare(String(a.criado))),
  };
}
async function corretorAtualizar(b, s) {
  const u = await ler(caminhoU(limpa(b.id, 40)));
  if (!u || u.papel === 'equipe') throw erro(404, 'Corretor não encontrado');
  if (b.status !== undefined) {
    if (!['pendente', 'aprovado', 'bloqueado'].includes(b.status)) throw erro(422, 'Status inválido');
    if (b.status === 'aprovado' && u.status !== 'aprovado') u.aprovado = { em: agora(), por: s.n };
    u.status = b.status;
  }
  let senhaNova = null;
  if (b.novaSenha) {
    senhaNova = crypto.randomBytes(6).toString('base64url').replace(/[-_]/g, 'x');
    u.senha = hashSenha(senhaNova);
  }
  await gravar(caminhoU(u.id), u);
  return { corretor: publico(u), senhaNova };
}

/* ------------------------------------------------------------------ handler */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const fim = (status, obj) => { res.statusCode = status; res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fim(405, { ok: false, erro: 'método' }); }
  if (!/application\/json/i.test(String(req.headers['content-type'] || ''))) return fim(415, { ok: false, erro: 'tipo' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return fim(400, { ok: false, erro: 'corpo' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip';
  try {
    if (b.acao === 'cadastro') {
      if (b.hp) return fim(200, { ok: true });                       // campo-isca: robô
      if (bloqueado(`cad|${ip}`)) throw erro(429, 'Muitos cadastros deste endereço. Tente mais tarde.');
      falhou(`cad|${ip}`);
      return fim(200, { ok: true, ...(await cadastro(b, res)) });
    }
    if (b.acao === 'entrar') return fim(200, { ok: true, ...(await login(b, res, ip)) });
    if (b.acao === 'equipe') return fim(200, { ok: true, ...loginEquipe(b, res, ip) });
    if (b.acao === 'sair') { apagarCookie(res); return fim(200, { ok: true }); }
    if (b.acao === 'conviteVer') return fim(200, { ok: true, ...(await conviteVer(b)) });
    if (b.acao === 'convite') {
      if (bloqueado(`conv|${ip}`)) throw erro(429, 'Muitas tentativas. Espere 10 minutos.');
      falhou(`conv|${ip}`);
      return fim(200, { ok: true, ...(await conviteAceitar(b, res)) });
    }

    const s = lerSessao(req);
    if (!s) return fim(401, { ok: false, erro: 'sessão', sair: true });
    let u = null;
    if (s.u) {
      // corretor, ou alguém da equipe com conta própria (a senha compartilhada não tem s.u)
      u = await ler(caminhoU(s.u));
      if (!u || u.status === 'bloqueado' || (s.p === 'equipe' && u.papel !== 'equipe')) {
        apagarCookie(res); return fim(401, { ok: false, erro: 'sessão', sair: true });
      }
    }
    const eq = s.p === 'equipe';
    const soEquipe = () => { if (!eq) throw erro(403, 'Só a equipe'); };

    switch (b.acao) {
      case 'eu': {
        const extra = await avisos();
        return fim(200, { ok: true, usuario: eq ? (u ? equipePublico(u) : { papel: 'equipe', nome: s.n, id: 'equipe' }) : publico(u), ...extra });
      }
      case 'convidar': soEquipe(); return fim(200, { ok: true, ...(await convidarEquipe(b, s, req)) });
      case 'senhaEquipe': {
        // troca de senha de quem da equipe tem conta própria
        if (!eq || !u) throw erro(400, 'Só para contas da equipe com e-mail');
        if (!senhaConfere(b.senhaAtual, u.senha)) throw erro(401, 'A senha atual não confere');
        u.senha = hashSenha(validarSenha(b.senhaNova));
        await gravar(caminhoU(u.id), u);
        return fim(200, { ok: true });
      }
      case 'perfil': {
        if (eq) throw erro(400, 'A equipe não tem perfil');
        Object.assign(u, validarConta(b, true));
        if (b.senhaNova) {
          if (!senhaConfere(b.senhaAtual, u.senha)) throw erro(401, 'A senha atual não confere');
          u.senha = hashSenha(validarSenha(b.senhaNova));
        }
        await gravar(caminhoU(u.id), u);
        return fim(200, { ok: true, usuario: publico(u) });
      }
      case 'excluirConta': {
        // LGPD: o corretor apaga a própria conta (os pedidos já feitos ficam, com o nome, para o marketing)
        if (eq) throw erro(400, 'A equipe não tem conta para excluir');
        if (!senhaConfere(b.senha, u.senha)) throw erro(401, 'A senha não confere');
        exigeStore();
        await B().del(caminhoU(u.id));
        apagarCookie(res);
        console.log('[portal] conta excluída pelo corretor', u.id);
        return fim(200, { ok: true });
      }
      case 'pedidos': return fim(200, { ok: true, ...(await pedidosListar(s, u)) });
      case 'pedido': {
        if (eq) throw erro(400, 'Abra o pedido com uma conta de corretor');
        return fim(200, { ok: true, ...(await pedidoCriar(b, u)) });
      }
      case 'pedidoCancelar': if (eq) throw erro(400, 'Use o status do pedido'); return fim(200, { ok: true, ...(await pedidoCancelarProprio(b, u)) });
      case 'pedidoAtualizar': soEquipe(); return fim(200, { ok: true, ...(await pedidoAtualizar(b, s)) });
      case 'corretores': soEquipe(); return fim(200, { ok: true, ...(await corretoresListar()) });
      case 'corretor': soEquipe(); return fim(200, { ok: true, ...(await corretorAtualizar(b, s)) });
      case 'aviso': soEquipe(); return fim(200, { ok: true, ...(await avisoSalvar(b, s)) });
      default: return fim(400, { ok: false, erro: 'ação' });
    }
  } catch (e) {
    if (!e.status) console.error('[portal]', b.acao, e.message);
    return fim(e.status || 500, { ok: false, erro: e.status ? e.message : 'Erro no servidor. Tente de novo.' });
  }
};

module.exports._interno = { hashSenha, senhaConfere, slugDe, validarConta, idEmail };
