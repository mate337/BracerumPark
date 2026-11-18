/*
  /api/portal — servidor do Portal do Corretor (bracerumpark.com/PortalCorretores).

  Guarda tudo num Vercel Blob **privado** (store "portal-corretores", região gru1), ligado ao projeto
  pela variável BLOB_READ_WRITE_TOKEN (criada junto com o store). Nada passa pelo CV CRM aqui —
  o portal leva o corretor ao painel do CV (bracerum.cvcrm.com.br/corretor/) para lead, reserva e
  comissão. Documentação: docs/portal-corretores.md.

  Variáveis:
    BLOB_READ_WRITE_TOKEN    store privado do portal                                  [segredo]
    PORTAL_CONVITE           chave que assina os links de primeiro acesso             [segredo]
    PORTAL_ADMINS            e-mails que podem virar o primeiro gerenciador (sem conta ainda)
    PORTAL_SEGREDO           (opcional) chave da sessão; sem ela deriva de ADMIN_SENHA/BLOB/CVCRM

  Arquivos no store:
    portal/u/<id>.json       conta (id = sha256 do e-mail, 24 hex); papel "equipe" = gerenciador | "corretor"
    portal/p/<id>.json       pedido ao marketing · portal/a/<pedido>/… anexos do pedido
    portal/m/index.json      biblioteca enviada pelo gerenciador · portal/m/f/… arquivos
    portal/avisos.json       mural (fora do menu desde 2026-11-18)

  Sessão: cookie HttpOnly "bp_portal" (HMAC, 30 dias, SameSite=Strict). Todo pedido é POST JSON
  com { acao, ... }; GET só para baixar anexo (?anexo=) e material (?material=).
  Contas: só o gerenciador cria (Gestão), com link de primeiro acesso — não há cadastro aberto nem
  senha compartilhada.
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

/* ------------------------------------------------------------------ contas: gerenciador × corretor */
/* Dois tipos de conta (2026-11-18): papel "equipe" = GERENCIADOR (gestão de contas, materiais, pedidos e
   tudo o que o corretor vê) e papel "corretor" (tabela, solicitações ao marketing, materiais, masterplan 3D,
   aprender). Não existe cadastro aberto nem senha compartilhada: o gerenciador cria a conta na Gestão e
   recebe um LINK DE PRIMEIRO ACESSO, que a pessoa abre para definir a senha:
     /PortalCorretores#/convite/<e-mail em base64url>.<HMAC(PORTAL_CONVITE, e-mail)>
   O link vale enquanto a conta não tem senha; "novo link de acesso" zera a senha e gera outro (esqueceu a senha).
   PORTAL_ADMINS (lista de e-mails) só serve para criar o PRIMEIRO gerenciador, quando ainda não há conta. */
const equipePublico = (u) => ({ papel: 'equipe', nome: u.nome, id: u.id, email: u.email, conta: true });
const listaAdmins = () => String(process.env.PORTAL_ADMINS || '').toLowerCase().split(/[,;\s]+/).filter(emailOk);
function assinaConvite(email) {
  const chave = process.env.PORTAL_CONVITE;
  if (!chave) throw erro(503, 'Convites não configurados (PORTAL_CONVITE)');
  return crypto.createHmac('sha256', chave).update(`convite|${email}`).digest('hex').slice(0, 32);
}
const origemDe = (req) => `https://${String(req.headers['x-forwarded-host'] || req.headers.host || 'bracerumpark.com')}`;
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
  if (u && u.senha) throw erro(410, 'Este link já foi usado. Entre com o seu e-mail e senha.');
  if (u && u.status === 'bloqueado') throw erro(403, 'Acesso suspenso. Fale com o gerenciador.');
  if (!u && !listaAdmins().includes(email)) throw erro(403, 'Link sem permissão');
  return { email, nome: (u && u.nome) || '', papel: (u && u.papel) || 'equipe' };
}
async function conviteAceitar(b, res) {
  const { email } = await conviteVer(b);
  const nome = limpa(b.nome, 80);
  if (nome.length < 2) throw erro(422, 'Escreva o seu nome');
  const senha = validarSenha(b.senha);
  const id = idEmail(email);
  const antes = (await ler(caminhoU(id))) || {};
  const papel = antes.papel || 'equipe';
  const u = {
    ...antes, id, email, nome, papel, status: antes.status === 'pendente' ? 'aprovado' : (antes.status || 'aprovado'),
    slug: antes.slug || slugDe(nome, id), senha: hashSenha(senha),
    criado: antes.criado || agora(), ativado: agora(), acessos: [agora()],
  };
  await gravar(caminhoU(id), u);
  console.log('[portal] conta ativada', papel, id);
  if (papel === 'equipe') { emitir(res, { p: 'equipe', n: nome, u: id }); return { usuario: equipePublico(u) }; }
  emitir(res, { p: 'corretor', u: id });
  return { usuario: publico(u) };
}
function contaResumo(u) {
  return {
    id: u.id, nome: u.nome, email: u.email, papel: u.papel === 'equipe' ? 'equipe' : 'corretor',
    status: u.status || 'aprovado', ativo: !!u.senha, ddi: u.ddi || '', tel: u.tel || '', imobiliaria: u.imobiliaria || '',
    creci: u.creci || '', pais: u.pais || '', slug: u.slug || '', criado: u.criado, criadoPor: u.criadoPor || null,
    ultimoAcesso: (u.acessos || [])[0] || null,
  };
}
async function contasListar() {
  const lst = await lerVarios(await listar('portal/u/'), 2000);
  return { contas: lst.map(contaResumo).sort((a, b) => String(b.criado).localeCompare(String(a.criado))) };
}
async function contaCriar(b, s, req) {
  const papel = b.papel === 'equipe' ? 'equipe' : 'corretor';
  const email = limpa(b.email, 120).toLowerCase();
  if (!emailOk(email)) throw erro(422, 'E-mail inválido');
  const id = idEmail(email);
  if (await ler(caminhoU(id))) throw erro(409, 'Já existe uma conta com esse e-mail');
  let dados;
  if (papel === 'corretor') dados = validarConta({ ...b, pais: b.pais || 'BR', idioma: b.idioma || 'pt' });
  else {
    const nome = limpa(b.nome, 80);
    if (nome.length < 2) throw erro(422, 'Escreva o nome');
    dados = { nome };
    if (b.tel) Object.assign(dados, validarConta({ ddi: b.ddi, tel: b.tel }, true));
  }
  const u = { id, email, ...dados, papel, status: 'aprovado', slug: slugDe(dados.nome, id), criado: agora(), criadoPor: s.n };
  await gravar(caminhoU(id), u);
  console.log('[portal] conta criada', papel, id, 'por', s.n);
  return { conta: contaResumo(u), link: linkConvite(origemDe(req), email) };
}
async function contaAlvo(b, s) {
  const u = await ler(caminhoU(limpa(b.id, 40)));
  if (!u) throw erro(404, 'Conta não encontrada');
  if (u.id === s.u) throw erro(409, 'Isso não vale para a sua própria conta');
  return u;
}
async function contaAtualizar(b, s, req) {
  const u = await contaAlvo(b, s);
  let link = null;
  if (b.status !== undefined) {
    if (!['aprovado', 'bloqueado'].includes(b.status)) throw erro(422, 'Situação inválida');
    u.status = b.status;
  }
  if (b.papel !== undefined) u.papel = b.papel === 'equipe' ? 'equipe' : 'corretor';
  if (b.novoLink) { delete u.senha; link = linkConvite(origemDe(req), u.email); }   // esqueceu a senha: zera e gera link
  if (!u.slug) u.slug = slugDe(u.nome, u.id);
  await gravar(caminhoU(u.id), u);
  return { conta: contaResumo(u), link };
}
async function contaLink(b, s, req) {
  const u = await ler(caminhoU(limpa(b.id, 40)));
  if (!u) throw erro(404, 'Conta não encontrada');
  if (u.senha) throw erro(409, 'Essa pessoa já criou a senha. Use "Novo link de acesso" para zerar.');
  return { link: linkConvite(origemDe(req), u.email) };
}
async function contaRemover(b, s) {
  const u = await contaAlvo(b, s);
  exigeStore();
  await B().del(caminhoU(u.id));
  console.log('[portal] conta removida', u.id, 'por', s.n);
  return { removida: u.id };
}

/* ------------------------------------------------------------------ biblioteca: materiais enviados pelo gerenciador */
/* Índice em portal/m/index.json = { itens: [...], ocultos: [chaves dos materiais fixos do conteudo.js] }.
   Arquivos em portal/m/f/<aleatório>-<nome>, enviados DIRETO do navegador ao Blob com um token de 30 min
   (generateClientTokenFromReadWriteToken) — assim vídeo e PDF grande não passam pelo limite de 4,5 MB da função.
   Download por GET /api/portal?material=<caminho> (qualquer conta logada; o arquivo não é público). */
const CAMINHO_MAT = 'portal/m/index.json';
const MAT_TIPOS = ['tabela', 'folder', 'foto', 'video', 'logo', 'pagina', 'apresentacao', 'documento'];
const MAT_CONTEUDO = ['image/*', 'video/*', 'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'image/svg+xml'];
async function biblioteca() {
  const d = await ler(CAMINHO_MAT);
  return { itens: (d && Array.isArray(d.itens)) ? d.itens : [], ocultos: (d && Array.isArray(d.ocultos)) ? d.ocultos : [] };
}
async function materialToken(b) {
  const nome = limpa(b.nome, 120).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '-').replace(/^-+|-+$/g, '') || 'arquivo';
  const caminho = `portal/m/f/${crypto.randomBytes(5).toString('hex')}-${nome}`;
  const { generateClientTokenFromReadWriteToken } = require('@vercel/blob/client');
  exigeStore();
  const token = await generateClientTokenFromReadWriteToken({
    token: process.env.BLOB_READ_WRITE_TOKEN, pathname: caminho, maximumSizeInBytes: 500 * 1024 * 1024,
    allowedContentTypes: MAT_CONTEUDO, validUntil: Date.now() + 30 * 60e3, addRandomSuffix: false, allowOverwrite: false,
  });
  return { token, caminho };
}
async function materialSalvar(b, s) {
  const bib = await biblioteca();
  const titulo = limpa(b.titulo, 120);
  if (titulo.length < 2) throw erro(422, 'Dê um título ao material');
  const tipo = MAT_TIPOS.includes(b.tipo) ? b.tipo : 'documento';
  const produto = PRODUTOS.includes(b.produto) ? b.produto : 'geral';
  let item = b.id ? bib.itens.find((x) => x.id === b.id) : null;
  if (b.id && !item) throw erro(404, 'Material não encontrado');
  if (!item) {
    const caminho = String(b.caminho || '');
    const link = limpa(b.link, 500);
    if (caminho && !/^portal\/m\/f\/[a-f0-9]{10}-[\w.\-]+$/.test(caminho)) throw erro(422, 'Arquivo inválido');
    if (!caminho && !/^https:\/\/\S+$/.test(link)) throw erro(422, 'Envie um arquivo ou informe um link https://');
    item = { id: crypto.randomBytes(5).toString('hex'), caminho: caminho || null, link: caminho ? null : link,
      conteudo: limpa(b.conteudo, 120) || null, kb: Math.max(0, Math.round(Number(b.kb) || 0)), nomeArquivo: limpa(b.nomeArquivo, 120) || null,
      criado: agora(), por: s.n };
    bib.itens.unshift(item);
  }
  Object.assign(item, { titulo, tipo, produto, desc: texto(b.desc, 400) || null, destaque: !!b.destaque, atualizado: agora() });
  await gravar(CAMINHO_MAT, bib);
  return bib;
}
async function materialRemover(b) {
  const bib = await biblioteca();
  const item = bib.itens.find((x) => x.id === b.id);
  if (!item) throw erro(404, 'Material não encontrado');
  bib.itens = bib.itens.filter((x) => x.id !== b.id);
  if (item.caminho) await B().del(item.caminho).catch((e) => console.error('[portal] del material', e.message));
  await gravar(CAMINHO_MAT, bib);
  return bib;
}
async function materialOcultar(b) {
  const bib = await biblioteca();
  const chave = limpa(b.chave, 300);
  if (!chave) throw erro(422, 'Material inválido');
  bib.ocultos = b.ocultar ? [...new Set([...bib.ocultos, chave])] : bib.ocultos.filter((x) => x !== chave);
  await gravar(CAMINHO_MAT, bib);
  return bib;
}
async function materialBaixar(req, res) {
  const s = lerSessao(req);
  const q = new URL(req.url, 'http://x').searchParams;
  const caminho = String(q.get('material') || '');
  if (!s || !s.u || !/^portal\/m\/f\/[a-f0-9]{10}-[\w.\-]+$/.test(caminho)) { res.statusCode = 404; return res.end('não encontrado'); }
  const u = await ler(caminhoU(s.u));
  if (!u || u.status === 'bloqueado') { res.statusCode = 404; return res.end('não encontrado'); }
  const item = (await biblioteca()).itens.find((x) => x.caminho === caminho);
  if (!item) { res.statusCode = 404; return res.end('não encontrado'); }
  const r = await B().get(caminho, { access: 'private', useCache: false });
  if (!r || !r.stream) { res.statusCode = 404; return res.end('não encontrado'); }
  const tipo = (r.blob && r.blob.contentType) || item.conteudo || 'application/octet-stream';
  res.setHeader('Content-Type', tipo);
  if (r.blob && r.blob.size) res.setHeader('Content-Length', String(r.blob.size));
  res.setHeader('Cache-Control', 'private, max-age=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const nome = item.nomeArquivo || caminho.split('/').pop().replace(/^[a-f0-9]{10}-/, '');
  res.setHeader('Content-Disposition', `${q.get('baixar') ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nome)}`);
  const { Readable } = require('stream');
  Readable.fromWeb(r.stream).pipe(res);
}

/* ------------------------------------------------------------------ pedidos ao marketing */
const TIPOS = ['peca', 'impresso', 'evento', 'video', 'traducao', 'visita', 'material', 'outro'];
const PRODUTOS = ['park', 'residence', 'resort', 'hotel', 'outlet', 'geral'];
const STATUS = ['recebido', 'producao', 'aprovacao', 'entregue', 'cancelado'];

// Material pedido (formulário de 2026-11-18): o que é, se é digital ou impresso, quantas, medida, os dados que
// vão na peça e exemplos anexados. "tipo" continua existindo para os pedidos antigos e para o ícone.
const MATERIAIS_PEDIDO = {
  post: 'peca', story: 'peca', banner: 'peca', folder: 'impresso', cartao: 'impresso', apresentacao: 'material',
  video: 'video', placa: 'impresso', evento: 'evento', visita: 'visita', traducao: 'traducao', outro: 'outro',
};
const FORMATOS = ['digital', 'impresso', 'ambos'];

async function pedidoCriar(b, u) {
  if (u.status !== 'aprovado') throw erro(403, 'Pedidos ao marketing são liberados depois da aprovação do seu cadastro.');
  const material = Object.prototype.hasOwnProperty.call(MATERIAIS_PEDIDO, b.material) ? b.material : null;
  const tipo = material ? MATERIAIS_PEDIDO[material] : (TIPOS.includes(b.tipo) ? b.tipo : 'outro');
  const formato = FORMATOS.includes(b.formato) ? b.formato : null;
  const produto = PRODUTOS.includes(b.produto) ? b.produto : 'geral';
  const quantidade = Math.max(1, Math.min(100000, Math.round(Number(b.quantidade) || 1)));
  const medida = limpa(b.medida, 80) || null;
  const dados = texto(b.dados, 1500) || null;
  const descricao = texto(b.descricao, 2000);
  const titulo = limpa(b.titulo, 100) || limpa(b.tituloAuto, 100);
  if (!material && titulo.length < 4) throw erro(422, 'Escolha o material');
  if (!formato && material) throw erro(422, 'Escolha digital ou impresso');
  if ((dados || '').length + descricao.length < 10) throw erro(422, 'Conte o que vai na peça ou descreva o que você precisa');
  const prazo = /^\d{4}-\d{2}-\d{2}$/.test(b.prazo || '') ? b.prazo : null;
  const ref = limpa(b.referencia, 400);
  if (!urlOk(ref)) throw erro(422, 'O link de referência precisa começar com https://');
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
  const numero = (await listar('portal/p/')).length + 1;
  const p = {
    id, numero, tipo, material, formato, quantidade, medida, dados, anexos: [],
    produto, titulo: titulo || 'Pedido', descricao, prazo, referencia: ref || null,
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

/* ------------------------------------------------------------------ anexos dos pedidos */
// Exemplos/referências que o corretor anexa. Vão um por chamada, em base64 (corpo da função ≤ 4,5 MB),
// para portal/a/<pedido>/<n>-<nome>. O navegador comprime foto grande antes de mandar.
const ANEXO_TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const ANEXO_MAX = 3 * 1024 * 1024;
const ANEXOS_POR_PEDIDO = 6;
async function anexoEnviar(b, s, u) {
  const p = await ler(caminhoP(limpa(b.pedido, 40)));
  if (!p) throw erro(404, 'Pedido não encontrado');
  if (s.p !== 'equipe' && (!u || p.corretor.id !== u.id)) throw erro(404, 'Pedido não encontrado');
  if ((p.anexos || []).length >= ANEXOS_POR_PEDIDO) throw erro(422, `Até ${ANEXOS_POR_PEDIDO} arquivos por pedido`);
  const tipo = String(b.tipo || '');
  if (!ANEXO_TIPOS.includes(tipo)) throw erro(415, 'Envie imagem (JPG, PNG, WEBP) ou PDF');
  const buf = Buffer.from(String(b.dados || ''), 'base64');
  if (!buf.length) throw erro(422, 'Arquivo vazio');
  if (buf.length > ANEXO_MAX) throw erro(413, 'Arquivo maior que 3 MB');
  const nome = limpa(b.nome, 80).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '-').replace(/^-+|-+$/g, '') || 'anexo';
  const n = (p.anexos || []).length + 1;
  const caminho = `portal/a/${p.id}/${n}-${nome}`;
  exigeStore();
  await B().put(caminho, buf, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: tipo });
  p.anexos = [...(p.anexos || []), { nome: limpa(b.nome, 80) || nome, caminho, tipo, kb: Math.ceil(buf.length / 1024), por: s.n || (u && u.nome) || '', em: agora() }];
  p.atualizado = agora();
  await gravar(caminhoP(p.id), p);
  return { pedido: p };
}
async function anexoBaixar(req, res) {
  const s = lerSessao(req);
  const caminho = String(new URL(req.url, 'http://x').searchParams.get('anexo') || '');
  const m = caminho.match(/^portal\/a\/([a-z0-9-]{6,40})\/[\w.\-]+$/i);
  if (!s || !m) { res.statusCode = 404; return res.end('não encontrado'); }
  const p = await ler(caminhoP(m[1]));
  let dono = false;
  if (p && s.p === 'corretor') dono = p.corretor && p.corretor.id === s.u;
  const anexo = p && (p.anexos || []).find((a) => a.caminho === caminho);
  if (!anexo || !(s.p === 'equipe' || dono)) { res.statusCode = 404; return res.end('não encontrado'); }
  const r = await B().get(caminho, { access: 'private', useCache: false });
  if (!r || !r.stream) { res.statusCode = 404; return res.end('não encontrado'); }
  res.setHeader('Content-Type', anexo.tipo);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `${anexo.tipo === 'application/pdf' || anexo.tipo.startsWith('image/') ? 'inline' : 'attachment'}; filename="${encodeURIComponent(anexo.nome)}"`);
  const { Readable } = require('stream');
  Readable.fromWeb(r.stream).pipe(res);
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

/* ------------------------------------------------------------------ handler */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const fim = (status, obj) => { res.statusCode = status; res.end(JSON.stringify(obj)); };
  if (req.method === 'GET' && /[?&]material=/.test(req.url || '')) {
    try { return await materialBaixar(req, res); } catch (e) { console.error('[portal] material', e.message); res.statusCode = 500; return res.end('erro'); }
  }
  if (req.method === 'GET' && /[?&]anexo=/.test(req.url || '')) {
    try { return await anexoBaixar(req, res); } catch (e) { console.error('[portal] anexo', e.message); res.statusCode = 500; return res.end('erro'); }
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fim(405, { ok: false, erro: 'método' }); }
  if (!/application\/json/i.test(String(req.headers['content-type'] || ''))) return fim(415, { ok: false, erro: 'tipo' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return fim(400, { ok: false, erro: 'corpo' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip';
  try {
    // Sem cadastro aberto e sem senha compartilhada: as contas nascem na Gestão (gerenciador).
    if (b.acao === 'cadastro' || b.acao === 'equipe') return fim(403, { ok: false, erro: 'As contas são criadas pelo gerenciador do portal.' });
    if (b.acao === 'entrar') return fim(200, { ok: true, ...(await login(b, res, ip)) });
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
    if (!s.u) { apagarCookie(res); return fim(401, { ok: false, erro: 'sessão', sair: true }); }   // sessões antigas da senha compartilhada
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
      case 'contas': soEquipe(); return fim(200, { ok: true, ...(await contasListar()) });
      case 'contaCriar': soEquipe(); return fim(200, { ok: true, ...(await contaCriar(b, s, req)) });
      case 'contaAtualizar': soEquipe(); return fim(200, { ok: true, ...(await contaAtualizar(b, s, req)) });
      case 'contaLink': soEquipe(); return fim(200, { ok: true, ...(await contaLink(b, s, req)) });
      case 'contaRemover': soEquipe(); return fim(200, { ok: true, ...(await contaRemover(b, s)) });
      case 'materiais': return fim(200, { ok: true, ...(await biblioteca()) });
      case 'materialToken': soEquipe(); return fim(200, { ok: true, ...(await materialToken(b)) });
      case 'materialSalvar': soEquipe(); return fim(200, { ok: true, ...(await materialSalvar(b, s)) });
      case 'materialRemover': soEquipe(); return fim(200, { ok: true, ...(await materialRemover(b)) });
      case 'materialOcultar': soEquipe(); return fim(200, { ok: true, ...(await materialOcultar(b)) });
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
      case 'anexo': return fim(200, { ok: true, ...(await anexoEnviar(b, s, u)) });
      case 'pedidoCancelar': if (eq) throw erro(400, 'Use o status do pedido'); return fim(200, { ok: true, ...(await pedidoCancelarProprio(b, u)) });
      case 'pedidoAtualizar': soEquipe(); return fim(200, { ok: true, ...(await pedidoAtualizar(b, s)) });
      case 'aviso': soEquipe(); return fim(200, { ok: true, ...(await avisoSalvar(b, s)) });
      default: return fim(400, { ok: false, erro: 'ação' });
    }
  } catch (e) {
    if (!e.status) console.error('[portal]', b.acao, e.message);
    return fim(e.status || 500, { ok: false, erro: e.status ? e.message : 'Erro no servidor. Tente de novo.' });
  }
};

module.exports._interno = { hashSenha, senhaConfere, slugDe, validarConta, idEmail };
