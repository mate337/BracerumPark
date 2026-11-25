/*
  /api/portal — servidor do Portal do Corretor (bracerumpark.com/PortalCorretores).

  Guarda tudo num Vercel Blob **privado** (store "portal-corretores", região gru1), ligado ao projeto pela
  variável BLOB_READ_WRITE_TOKEN. Regras puras (fuso, vigência, elegibilidade, preço, sincronização,
  etapas das solicitações, card) ficam em api/_portal-regras.js e têm testes em tests/portal.test.js.
  Documentação de operação: docs/portal-corretores.md §7.

  Variáveis (nomes em .env.example):
    BLOB_READ_WRITE_TOKEN   store privado do portal                                         [segredo]
    PORTAL_CONVITE          chave que assina os links de primeiro acesso                    [segredo]
    PORTAL_CV_AUTO          "1" = corretor novo no CV vira conta + recebe e-mail sozinho  (padrão: desligado)
    PORTAL_CV_IGNORAR       ids de corretor do CV que nunca viram conta                    (padrão: 2, a demonstração)
    RESEND_API_KEY          chave do Resend para o e-mail de boas-vindas                    [segredo]
    PORTAL_EMAIL_DE         remetente  (padrão: Bracerum Park <portal@bracerumpark.com>)
    PORTAL_EMAIL_RESPONDER  responder-para (padrão: bracerumpark@bracerum.com)
    CRON_SECRET             a Vercel manda no cabeçalho da rotina diária (?cron=cv-corretores) [segredo]
    PORTAL_ADMINS           e-mails que podem virar o primeiro gestor (só sem conta ainda)
    PORTAL_FUSO             fuso comercial das vigências (padrão America/Asuncion)
    PORTAL_SYNC_MIN         intervalo mínimo entre consultas ao CV (padrão 5)
    PORTAL_DADOS_MAX_MIN    idade máxima do último sucesso para o dado contar como atual (padrão 60)
    PORTAL_TABELAS_MIN      intervalo entre releituras das tabelas de Casas/Aptos/Outlet no CV (padrão 30)
    PORTAL_TABELAS_MAX_H    idade máxima dessas tabelas antes do aviso "desatualizada" (padrão 24)
    CVCRM_EMAIL/CVCRM_TOKEN leitura do mapa de disponibilidade do CV (mesmas do /api/lotes-status) [segredo]
    PORTAL_SEGREDO          (opcional) chave da sessão; sem ela deriva de ADMIN_SENHA/BLOB/CVCRM

  Arquivos no store:
    portal/u/<id>.json        conta (id = sha256 do e-mail); papel "equipe" = GESTOR | "corretor";
                              status aprovado | bloqueado | excluido (exclusão lógica)
    portal/i/index.json       imobiliárias
    portal/p/<id>.json        solicitação ao marketing · portal/a/<pedido>/… anexos
    portal/m/index.json       materiais (versões, rascunho/publicado/arquivado) · portal/m/f/… arquivos
    portal/t/index.json       tutoriais do "Aprender" · portal/t/f/… arquivos
    portal/o/index.json       ofertas / campanhas
    portal/sync/comercial.json retrato da situação dos lotes vinda do CV (com última tentativa/sucesso)
    portal/sync/tabelas.json  retrato das tabelas aprovadas do CV para Casas, Aptos e Outlet (api/_portal-tabelas.js)
    portal/log/<ts>-<r>.json  auditoria (uma entrada por arquivo)

  Sessão: cookie HttpOnly "bp_portal" (HMAC, 30 dias, SameSite=Strict). POST JSON { acao, ... }.
  GET só para baixar: ?anexo= · ?material= · ?tutorial= · ?card=<oferta>. Toda chamada relê a conta:
  bloqueio, exclusão ou troca de papel derrubam a sessão já aberta.
*/
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const R = require('./_portal-regras.js');

let blob = null;
const B = () => (blob || (blob = require('@vercel/blob')));

/* ------------------------------------------------------------------ utilitários */
const limpa = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const texto = (v, n = 2000) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\r\n?/g, '\n').trim().slice(0, n);
const erro = (status, message, extra) => Object.assign(new Error(message), { status }, extra || {});
const agora = () => new Date().toISOString();
const idEmail = (email) => crypto.createHash('sha256').update(`bp-portal|${email}`).digest('hex').slice(0, 24);
const novoId = () => `${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const urlOk = (u) => !u || /^https:\/\/[^\s]+$/i.test(u);
const nomeArquivoSeguro = (n) => limpa(n, 120).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.\-]+/g, '-').replace(/^-+|-+$/g, '') || 'arquivo';

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
function validarSenha(s) {
  s = String(s || '');
  if (s.length < 8) throw erro(422, 'A senha precisa de pelo menos 8 caracteres');
  if (s.length > 200) throw erro(422, 'Senha longa demais');
  return s;
}

/* ------------------------------------------------------------------ sessão (cookie assinado) */
const COOKIE = 'bp_portal';
const DIAS = 30;
const assina = (p) => crypto.createHmac('sha256', segredo()).update(p).digest('base64url');
function emitir(res, s) {
  const corpo = Buffer.from(JSON.stringify({ ...s, x: Date.now() + DIAS * 864e5 })).toString('base64url');
  res.setHeader('Set-Cookie', `${COOKIE}=${corpo}.${assina(corpo)}; Path=/api/portal; HttpOnly; Secure; SameSite=Strict; Max-Age=${DIAS * 86400}`);
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
  try { const s = JSON.parse(Buffer.from(corpo, 'base64url').toString()); return s.x > Date.now() ? s : null; } catch (err) { return null; }
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
function exigeStore() { if (!process.env.BLOB_READ_WRITE_TOKEN) throw erro(503, 'Armazenamento do portal não configurado'); }
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
  await B().put(caminho, JSON.stringify(obj), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json', cacheControlMaxAge: 60 });
  return obj;
}
// Cria o arquivo só se ainda não existe (atômico no Blob): serve de trava entre instâncias da função.
async function reservar(caminho, obj) {
  exigeStore();
  try { await B().put(caminho, JSON.stringify(obj || { em: agora() }), { access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json' }); return true; }
  catch (e) { if (await ler(caminho).catch(() => null)) return false; throw e; }   // já existia = outra instância reservou
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
async function servirArquivo(res, caminho, tipo, nome, baixar) {
  const r = await B().get(caminho, { access: 'private', useCache: false });
  if (!r || !r.stream) { res.statusCode = 404; return res.end('não encontrado'); }
  res.setHeader('Content-Type', (r.blob && r.blob.contentType) || tipo || 'application/octet-stream');
  if (r.blob && r.blob.size) res.setHeader('Content-Length', String(r.blob.size));
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
  res.setHeader('Content-Disposition', `${baixar ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(nome)}`);
  const { Readable } = require('stream');
  Readable.fromWeb(r.stream).pipe(res);
}
const nao = (res) => { res.statusCode = 404; res.setHeader('Content-Type', 'text/plain; charset=utf-8'); return res.end('não encontrado'); };

const caminhoU = (id) => `portal/u/${id}.json`;
const caminhoP = (id) => `portal/p/${id}.json`;
const CAM = { imob: 'portal/i/index.json', mat: 'portal/m/index.json', tut: 'portal/t/index.json', of: 'portal/o/index.json', sync: 'portal/sync/comercial.json', cvSync: 'portal/sync/cv-corretores.json', tabelas: 'portal/sync/tabelas.json' };

/* ------------------------------------------------------------------ auditoria */
// Quem fez o quê, em qual registro. Nunca grava senha, token ou conteúdo de arquivo.
async function auditar(s, acao, entidade, id, det) {
  try {
    const t = new Date().toISOString().replace(/[-:.TZ]/g, '');
    await gravar(`portal/log/${t}-${crypto.randomBytes(2).toString('hex')}.json`, { em: agora(), por: s ? { id: s.u, nome: s.n } : null, acao, entidade, id: id || null, det: det || null });
  } catch (e) { console.error('[portal] auditoria', e.message); }
}
async function auditoriaListar() {
  const blobs = (await listar('portal/log/')).sort((a, b) => b.pathname.localeCompare(a.pathname));
  return { eventos: await lerVarios(blobs, 150) };
}

/* ------------------------------------------------------------------ base comercial (arquivos do repositório) */
let BASE = null;
function base() {
  if (BASE) return BASE;
  const rd = (f) => {   // na Vercel a pasta atual é a raiz do projeto; fora dela, relativo a este arquivo
    const a = path.join(process.cwd(), '3dmasterplan', 'data', f);
    return JSON.parse(fs.readFileSync(fs.existsSync(a) ? a : path.join(__dirname, '..', '3dmasterplan', 'data', f), 'utf8'));
  };
  const lotes = rd('lotes.json');
  const precos = rd('precos.json');
  const unidades = new Map(lotes.lotes.map((l) => [l.id, { id: l.id, q: l.q, a: l.a, cat: l.cat, nome: l.nome }]));
  BASE = { unidades, precos, fonteLotes: lotes.fonte };
  return BASE;
}

/* ------------------------------------------------------------------ sincronização com o CV */
let lerCV = null;
async function sincronizar(forcar) {
  const anterior = await ler(CAM.sync);
  const ult = anterior && anterior.ultimaTentativa ? Date.parse(anterior.ultimaTentativa) : 0;
  if (!forcar && Date.now() - ult < R.politica().syncMin * 60e3) return anterior;
  if (!lerCV) lerCV = require('./lotes-status.js').lerCV;
  let tentativa;
  try {
    const d = await Promise.race([lerCV(), new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado ao consultar o CV')), 15000))]);
    tentativa = { ok: true, total: d.total, lotes: d.lotes, desconhecidas: d.desconhecidas, origem: 'CV CRM · mapa de disponibilidade (empreendimento ' + (process.env.CVCRM_EMPREENDIMENTO || '4') + ')' };
  } catch (e) {
    tentativa = { ok: false, erro: e.status === 503 ? 'integração com o CV não configurada neste ambiente' : e.message };
    console.error('[portal] sincronização falhou:', tentativa.erro);
  }
  return gravar(CAM.sync, R.registrarSync(anterior, tentativa));
}
function resumoSync(snap) {
  return {
    origem: (snap && snap.origem) || 'CV CRM · mapa de disponibilidade', ultimaTentativa: (snap && snap.ultimaTentativa) || null,
    ultimoSucesso: (snap && snap.ultimoSucesso) || null, resultado: (snap && snap.resultado) || 'nunca', erro: (snap && snap.erro) || null,
    estado: R.estadoSync(snap), politica: R.politica(), total: (snap && snap.total) || 0,
  };
}
async function comercial() {
  const { unidades, precos, fonteLotes } = base();
  const snap = await sincronizar(false);
  const j = R.janelaVigente(precos);
  return {
    sync: resumoSync(snap), fuso: R.fuso(),
    fonte: { unidades: fonteLotes, precos: { fonte: precos.fonte, tabela: precos.tabela, revisao: precos.revisao, moeda: 'USD', unidade: 'US$/m²' } },
    janela: { id: j.id, de: j.de || null, ate: j.ate || null },
    unidades: [...unidades.values()].map((x) => ({ ...x, situacao: R.situacaoDe(x.id, snap) })),
  };
}

/* ------------------------------------------------------------------ tabelas de Casas, Aptos e Outlet (CV) */
// O CV leva 20–30 s para devolver as tabelas do Residence, então a consulta nunca segura a tela: a aba
// Tabela recebe o último retrato e, se ele passou de PORTAL_TABELAS_MIN, a releitura roda em segundo plano.
// Em falha o retrato anterior fica como estava (sem sucesso falso) e a tela avisa a data do dado.
// Sem nada no store, vale o retrato inicial do repositório (api/_portal-tabelas-retrato.json, 25/11/2026).
const TABELAS_MIN = () => Math.max(5, Number(process.env.PORTAL_TABELAS_MIN) || 30);
const TABELAS_MAX_H = () => Math.max(1, Number(process.env.PORTAL_TABELAS_MAX_H) || 24);
let lerTabelas = null;
function tabelasSemente() { try { return require('./_portal-tabelas-retrato.json'); } catch (e) { return null; } }
async function tabelasEstado() { return (await ler(CAM.tabelas)) || tabelasSemente(); }
async function tabelasAtualizar() {
  if (!lerTabelas) lerTabelas = require('./_portal-tabelas.js').lerTabelasCV;
  const anterior = await tabelasEstado();
  let snap;
  try {
    const produtos = await Promise.race([lerTabelas(), new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado ao consultar as tabelas do CV')), 50000))]);
    snap = { origem: 'CV CRM · tabelas de preço aprovadas', ultimaTentativa: agora(), ultimoSucesso: agora(), resultado: 'ok', erro: null, produtos };
  } catch (e) {
    snap = { ...(anterior || {}), ultimaTentativa: agora(), resultado: 'erro', erro: String(e.message || 'falha').slice(0, 200) };
    console.error('[portal] tabelas do CV:', snap.erro);
  }
  delete snap.rodando;
  return gravar(CAM.tabelas, snap);
}
// Agenda a releitura se o retrato passou do intervalo. Devolve true se há releitura em andamento.
async function tabelasTalvez() {
  const e = await ler(CAM.tabelas);   // só o retrato do store conta: o do repositório sempre pede releitura
  const t = Date.now();
  if (e && e.rodando && t - Date.parse(e.rodando) < 90e3) return true;
  if (e && e.ultimaTentativa && t - Date.parse(e.ultimaTentativa) < TABELAS_MIN() * 60e3) return false;
  await gravar(CAM.tabelas, { ...(e || tabelasSemente() || {}), rodando: agora() });
  const tarefa = tabelasAtualizar().catch((err) => console.error('[portal] tabelas do CV', err.message));
  try { require('@vercel/functions').waitUntil(tarefa); } catch (err) { /* fora da Vercel: a promessa segue sozinha */ }
  return true;
}
function tabelasPublico(snap, atualizando) {
  const s = snap || {};
  const idadeH = s.ultimoSucesso ? (Date.now() - Date.parse(s.ultimoSucesso)) / 36e5 : null;
  return {
    origem: s.origem || 'CV CRM · tabelas de preço aprovadas', ultimaTentativa: s.ultimaTentativa || null, ultimoSucesso: s.ultimoSucesso || null,
    resultado: s.resultado || 'nunca', erro: s.erro || null, atualizando: !!atualizando, maxHoras: TABELAS_MAX_H(),
    estado: !s.ultimoSucesso || !s.produtos ? 'indisponivel' : idadeH <= TABELAS_MAX_H() ? 'atual' : 'desatualizado',
    produtos: s.produtos || null,
  };
}

/* ------------------------------------------------------------------ contas: gestor × corretor */
const PAPEL = (u) => (u && u.papel === 'equipe' ? 'equipe' : 'corretor');
const ativo = (u) => u && u.status !== 'bloqueado' && u.status !== 'excluido';
function publico(u) {
  return {
    id: u.id, nome: u.nome, email: u.email, ddi: u.ddi, tel: u.tel, imobiliaria: u.imobiliaria, imobiliariaId: u.imobiliariaId || null,
    creci: u.creci, pais: u.pais, idioma: u.idioma, status: u.status, criado: u.criado, slug: u.slug, papel: PAPEL(u), conta: true,
  };
}
function slugDe(nome, id) {
  const base0 = limpa(nome, 60).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').filter(Boolean);
  return `${[base0[0], base0.length > 1 ? base0[base0.length - 1] : ''].filter(Boolean).join('-') || 'corretor'}-${id.slice(0, 4)}`;
}
function validarConta(b, parcial) {
  const v = {};
  if (!parcial || b.nome !== undefined) {
    const nome = limpa(b.nome, 80);
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
  if (b.creci !== undefined) v.creci = limpa(b.creci, 30);
  if (b.pais !== undefined) v.pais = ['BR', 'PY', 'AR', 'UY', 'OUTRO'].includes(b.pais) ? b.pais : 'OUTRO';
  if (b.idioma !== undefined) v.idioma = ['pt', 'es', 'en'].includes(b.idioma) ? b.idioma : 'pt';
  return v;
}

async function login(b, res, ip) {
  const email = limpa(b.email, 120).toLowerCase();
  const chave = `${ip}|${email}`;
  if (bloqueado(chave)) throw erro(429, 'Muitas tentativas. Espere 10 minutos.');
  const u = emailOk(email) ? await ler(caminhoU(idEmail(email))) : null;
  if (!u || u.status === 'excluido' || !senhaConfere(b.senha, u.senha)) {
    falhou(chave);
    await new Promise((r) => setTimeout(r, 600));
    throw erro(401, 'E-mail ou senha incorretos');
  }
  if (u.status === 'bloqueado') throw erro(403, 'Acesso suspenso. Fale com o gestor do portal.');
  u.acessos = [agora(), ...(u.acessos || [])].slice(0, 20);
  await gravar(caminhoU(u.id), u);
  emitir(res, { p: PAPEL(u), n: u.nome, u: u.id });
  return { usuario: publico(u) };
}

// Primeiro acesso / nova senha por link assinado. PORTAL_ADMINS só vale para o PRIMEIRO gestor (sem conta).
const listaAdmins = () => String(process.env.PORTAL_ADMINS || '').toLowerCase().split(/[,;\s]+/).filter(emailOk);
function assinaConvite(email) {
  const chave = process.env.PORTAL_CONVITE;
  if (!chave) throw erro(503, 'Links de acesso não configurados (PORTAL_CONVITE)');
  return crypto.createHmac('sha256', chave).update(`convite|${email}`).digest('hex').slice(0, 32);
}
const origemDe = (req) => `https://${String(req.headers['x-forwarded-host'] || req.headers.host || 'bracerumpark.com')}`;
const linkConvite = (origem, email) => `${origem}/PortalCorretores#/convite/${Buffer.from(email).toString('base64url')}.${assinaConvite(email)}`;
function lerConvite(token) {
  const [e64, sig] = String(token || '').split('.');
  let email = '';
  try { email = Buffer.from(e64 || '', 'base64url').toString().toLowerCase(); } catch (err) { email = ''; }
  if (!emailOk(email) || !sig) throw erro(400, 'Link inválido');
  const certo = assinaConvite(email);
  if (sig.length !== certo.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(certo))) throw erro(400, 'Link inválido');
  return email;
}
async function conviteVer(b) {
  const email = lerConvite(b.token);
  const u = await ler(caminhoU(idEmail(email)));
  if (u && u.senha) throw erro(410, 'Este link já foi usado. Entre com o seu e-mail e senha.');
  if (u && !ativo(u)) throw erro(403, 'Acesso suspenso. Fale com o gestor do portal.');
  if (!u && !listaAdmins().includes(email)) throw erro(403, 'Link sem permissão');
  return { email, nome: (u && u.nome) || '', papel: u ? PAPEL(u) : 'equipe' };
}
async function conviteAceitar(b, res) {
  const { email } = await conviteVer(b);
  const nome = limpa(b.nome, 80);
  if (nome.length < 2) throw erro(422, 'Escreva o seu nome');
  const senha = validarSenha(b.senha);
  const id = idEmail(email);
  const antes = (await ler(caminhoU(id))) || {};
  const u = { ...antes, id, email, nome, papel: antes.papel || 'equipe', status: 'aprovado', slug: antes.slug || slugDe(nome, id),
    senha: hashSenha(senha), criado: antes.criado || agora(), ativado: agora(), acessos: [agora()] };
  await gravar(caminhoU(id), u);
  await auditar({ u: id, n: nome }, 'conta.ativada', 'conta', id, { papel: u.papel });
  emitir(res, { p: PAPEL(u), n: nome, u: id });
  return { usuario: publico(u) };
}

function contaResumo(u) {
  return {
    id: u.id, nome: u.nome, email: u.email, papel: PAPEL(u), status: u.status || 'aprovado', ativo: !!u.senha,
    ddi: u.ddi || '', tel: u.tel || '', imobiliaria: u.imobiliaria || '', imobiliariaId: u.imobiliariaId || null,
    creci: u.creci || '', pais: u.pais || '', slug: u.slug || '', criado: u.criado, criadoPor: u.criadoPor || null,
    ultimoAcesso: (u.acessos || [])[0] || null, excluido: u.excluido || null,
    origem: u.origem || null, cvId: u.cvId || null,
    convite: u.convite ? { em: u.convite.em, ok: !!u.convite.ok, erro: u.convite.erro || null, tentativas: u.convite.tentativas || 0 } : null,
  };
}
async function todasContas() { return lerVarios(await listar('portal/u/'), 5000); }
async function contasListar() {
  return { contas: (await todasContas()).map(contaResumo).sort((a, b) => String(b.criado).localeCompare(String(a.criado))) };
}
// Nunca deixar o portal sem um gestor ativo (aprovado e com senha criada).
async function garantirGestor(alvoId) {
  const restam = (await todasContas()).filter((x) => x.id !== alvoId && PAPEL(x) === 'equipe' && x.status === 'aprovado' && x.senha);
  if (!restam.length) throw erro(409, 'O portal precisa de pelo menos um gestor ativo.');
}
async function imobiliariaDe(id) {
  if (!id) return null;
  const imob = (await imobiliarias()).itens.find((x) => x.id === id);
  if (!imob) throw erro(422, 'Imobiliária não encontrada');
  if (imob.status !== 'ativa') throw erro(422, 'Imobiliária arquivada');
  return imob;
}
async function contaCriar(b, s, req) {
  const papel = b.papel === 'equipe' ? 'equipe' : 'corretor';
  const email = limpa(b.email, 120).toLowerCase();
  if (!emailOk(email)) throw erro(422, 'E-mail inválido');
  const id = idEmail(email);
  const ja = await ler(caminhoU(id));
  if (ja) throw erro(409, ja.status === 'excluido' ? 'Esse e-mail é de uma conta excluída — reative-a na lista (filtro "Excluídas").' : 'Já existe uma conta com esse e-mail');
  let dados;
  if (papel === 'corretor') {
    dados = validarConta({ ...b, pais: b.pais || 'BR', idioma: b.idioma || 'pt' });
    const imob = await imobiliariaDe(limpa(b.imobiliariaId, 40));
    if (imob) Object.assign(dados, { imobiliariaId: imob.id, imobiliaria: imob.nome });
    else {
      const nomeImob = limpa(b.imobiliaria, 80);
      if (nomeImob.length < 2) throw erro(422, 'Escolha a imobiliária ou escreva "Autônomo"');
      dados.imobiliaria = nomeImob;
    }
  } else {
    const nome = limpa(b.nome, 80);
    if (nome.length < 2) throw erro(422, 'Escreva o nome');
    dados = { nome };
    if (b.tel) Object.assign(dados, validarConta({ ddi: b.ddi, tel: b.tel }, true));
  }
  // papel e situação vêm do servidor, nunca do corpo
  const u = { id, email, ...dados, papel, status: 'aprovado', slug: slugDe(dados.nome, id), criado: agora(), criadoPor: s.n };
  await gravar(caminhoU(id), u);
  await auditar(s, 'conta.criada', 'conta', id, { papel, email });
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
  const mud = {};
  let link = null;
  const perdeGestor = PAPEL(u) === 'equipe' && ((b.status && b.status !== 'aprovado') || b.papel === 'corretor');
  if (perdeGestor) await garantirGestor(u.id);
  if (b.status !== undefined) {
    if (!['aprovado', 'bloqueado', 'excluido'].includes(b.status)) throw erro(422, 'Situação inválida');
    if (b.status !== u.status) mud.status = [u.status || 'aprovado', b.status];
    if (b.status === 'excluido') { u.excluido = { em: agora(), por: s.n }; delete u.senha; }   // exclusão lógica: preserva histórico
    if (b.status === 'aprovado' && u.status === 'excluido') delete u.excluido;
    u.status = b.status;
  }
  if (b.papel !== undefined) {
    const p = b.papel === 'equipe' ? 'equipe' : 'corretor';
    if (p !== PAPEL(u)) mud.papel = [PAPEL(u), p];
    u.papel = p;
  }
  if (b.imobiliariaId !== undefined) {
    const imob = await imobiliariaDe(limpa(b.imobiliariaId, 40));
    mud.imobiliaria = [u.imobiliaria || null, imob ? imob.nome : limpa(b.imobiliaria, 80) || null];
    u.imobiliariaId = imob ? imob.id : null;
    u.imobiliaria = imob ? imob.nome : (limpa(b.imobiliaria, 80) || u.imobiliaria);
  }
  if (b.novoLink) {
    if (u.status === 'excluido') throw erro(409, 'Reative a conta antes de gerar um link');
    delete u.senha; link = linkConvite(origemDe(req), u.email); mud.senha = 'zerada';
  }
  if (!u.slug) u.slug = slugDe(u.nome, u.id);
  await gravar(caminhoU(u.id), u);
  await auditar(s, 'conta.alterada', 'conta', u.id, mud);
  return { conta: contaResumo(u), link };
}
async function contaLink(b, s, req) {
  const u = await ler(caminhoU(limpa(b.id, 40)));
  if (!u) throw erro(404, 'Conta não encontrada');
  if (!ativo(u)) throw erro(409, 'Conta suspensa ou excluída');
  if (u.senha) throw erro(409, 'Essa pessoa já criou a senha. Use "Novo link de acesso" para zerar.');
  return { link: linkConvite(origemDe(req), u.email) };
}

/* ------------------------------------------------------------------ imobiliárias */
// Cadastro vinculado aos corretores (não tem login próprio). Excluir só sem nenhum corretor vinculado
// (inclusive excluídos, para não quebrar histórico); com vínculo, arquivar.
async function imobiliarias() {
  const d = await ler(CAM.imob);
  return { itens: (d && Array.isArray(d.itens)) ? d.itens : [] };
}
async function imobiliariasComContagem() {
  const [d, contas] = await Promise.all([imobiliarias(), todasContas()]);
  return { itens: d.itens.map((x) => ({ ...x, corretores: contas.filter((u) => u.imobiliariaId === x.id && u.status !== 'excluido').length })) };
}
async function imobiliariaSalvar(b, s) {
  const d = await imobiliarias();
  const nome = limpa(b.nome, 100);
  if (nome.length < 2) throw erro(422, 'Escreva o nome da imobiliária');
  const email = limpa(b.email, 120).toLowerCase();
  if (email && !emailOk(email)) throw erro(422, 'E-mail inválido');
  if (d.itens.some((x) => x.id !== b.id && x.nome.toLowerCase() === nome.toLowerCase())) throw erro(409, 'Já existe uma imobiliária com esse nome');
  let it = b.id ? d.itens.find((x) => x.id === b.id) : null;
  if (b.id && !it) throw erro(404, 'Imobiliária não encontrada');
  const novo = !it;
  if (!it) { it = { id: novoId(), status: 'ativa', criado: agora(), criadoPor: s.n }; d.itens.push(it); }
  Object.assign(it, { nome, contato: limpa(b.contato, 80) || null, telefone: limpa(b.telefone, 30) || null, email: email || null,
    documento: limpa(b.documento, 30) || null, cidade: limpa(b.cidade, 60) || null, atualizado: agora() });
  await gravar(CAM.imob, d);
  // o nome exibido nos corretores acompanha a imobiliária
  if (!novo) for (const u of await todasContas()) if (u.imobiliariaId === it.id && u.imobiliaria !== it.nome) { u.imobiliaria = it.nome; await gravar(caminhoU(u.id), u); }
  await auditar(s, novo ? 'imobiliaria.criada' : 'imobiliaria.alterada', 'imobiliaria', it.id, { nome });
  return imobiliariasComContagem();
}
async function imobiliariaArquivar(b, s) {
  const d = await imobiliarias();
  const it = d.itens.find((x) => x.id === b.id);
  if (!it) throw erro(404, 'Imobiliária não encontrada');
  it.status = b.arquivar ? 'arquivada' : 'ativa'; it.atualizado = agora();
  await gravar(CAM.imob, d);
  await auditar(s, b.arquivar ? 'imobiliaria.arquivada' : 'imobiliaria.reativada', 'imobiliaria', it.id);
  return imobiliariasComContagem();
}
async function imobiliariaExcluir(b, s) {
  const d = await imobiliarias();
  const it = d.itens.find((x) => x.id === b.id);
  if (!it) throw erro(404, 'Imobiliária não encontrada');
  const vinc = (await todasContas()).filter((u) => u.imobiliariaId === it.id).length;
  if (vinc) throw erro(409, `Há ${vinc} corretor(es) vinculado(s). Desvincule ou arquive a imobiliária.`);
  d.itens = d.itens.filter((x) => x.id !== it.id);
  await gravar(CAM.imob, d);
  await auditar(s, 'imobiliaria.excluida', 'imobiliaria', it.id, { nome: it.nome });
  return imobiliariasComContagem();
}

/* ------------------------------------------------------------------ envio direto ao Blob (token de 30 min) */
const ARQ_CONTEUDO = ['image/*', 'video/*', 'application/pdf', 'application/zip', 'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
const RX_ARQ = { m: /^portal\/m\/f\/[a-f0-9]{10}-[\w.\-]+$/, t: /^portal\/t\/f\/[a-f0-9]{10}-[\w.\-]+$/ };
async function tokenEnvio(b) {
  const pasta = b.destino === 'tutorial' ? 't' : 'm';
  if (b.tipo && !ARQ_CONTEUDO.some((p) => (p.endsWith('/*') ? String(b.tipo).startsWith(p.slice(0, -1)) : p === b.tipo))) throw erro(415, 'Tipo de arquivo não aceito');
  if (Number(b.tamanho) > 500 * 1024 * 1024) throw erro(413, 'Arquivo maior que 500 MB');
  const caminho = `portal/${pasta}/f/${crypto.randomBytes(5).toString('hex')}-${nomeArquivoSeguro(b.nome)}`;
  const { generateClientTokenFromReadWriteToken } = require('@vercel/blob/client');
  exigeStore();
  const token = await generateClientTokenFromReadWriteToken({ token: process.env.BLOB_READ_WRITE_TOKEN, pathname: caminho, maximumSizeInBytes: 500 * 1024 * 1024,
    allowedContentTypes: ARQ_CONTEUDO, validUntil: Date.now() + 30 * 60e3, addRandomSuffix: false, allowOverwrite: false });
  return { token, caminho };
}
function versaoDe(b, pasta) {
  const caminho = String(b.caminho || '');
  const link = limpa(b.link, 500);
  if (caminho && !RX_ARQ[pasta].test(caminho)) throw erro(422, 'Arquivo inválido');
  if (!caminho && !/^https:\/\/\S+$/.test(link)) throw erro(422, 'Envie um arquivo ou informe um link https://');
  return { caminho: caminho || null, link: caminho ? null : link, conteudo: limpa(b.conteudo, 120) || null,
    kb: Math.max(0, Math.round(Number(b.kb) || 0)), nomeArquivo: limpa(b.nomeArquivo, 120) || null };
}

/* ------------------------------------------------------------------ materiais (rascunho / publicado / arquivado, com versões) */
const MAT_TIPOS = ['tabela', 'folder', 'foto', 'video', 'logo', 'pagina', 'apresentacao', 'documento'];
const PRODUTOS = ['park', 'residence', 'resort', 'hotel', 'outlet', 'geral'];
const ST_CONTEUDO = ['rascunho', 'publicado', 'arquivado'];
function normalizaMaterial(x) {     // itens enviados antes do versionamento viram versão 1, publicados
  if (Array.isArray(x.versoes)) return x;
  const v = { n: 1, caminho: x.caminho || null, link: x.link || null, conteudo: x.conteudo || null, kb: x.kb || 0, nomeArquivo: x.nomeArquivo || null, em: x.criado, por: x.por };
  const { caminho, link, conteudo, kb, nomeArquivo, ...resto } = x;
  return { ...resto, status: x.status || 'publicado', versoes: [v], atual: 1 };
}
const versaoAtual = (x) => x.versoes.find((v) => v.n === x.atual) || x.versoes[x.versoes.length - 1];
async function biblioteca() {
  const d = await ler(CAM.mat);
  return { itens: ((d && d.itens) || []).map(normalizaMaterial), ocultos: (d && Array.isArray(d.ocultos)) ? d.ocultos : [] };
}
function bibliotecaPara(bib, eq) {
  if (eq) return bib;
  // corretor: só publicado, só a versão vigente (sem caminhos de versões antigas)
  return { ocultos: bib.ocultos, itens: bib.itens.filter((x) => x.status === 'publicado').map((x) => {
    const v = versaoAtual(x);
    return { id: x.id, titulo: x.titulo, tipo: x.tipo, produto: x.produto, desc: x.desc, destaque: x.destaque, status: x.status, atual: x.atual,
      atualizado: x.atualizado, versoes: [{ n: v.n, caminho: v.caminho, link: v.link, conteudo: v.conteudo, kb: v.kb, nomeArquivo: v.nomeArquivo, em: v.em }] };
  }) };
}
async function materialSalvar(b, s) {
  const bib = await biblioteca();
  const titulo = limpa(b.titulo, 120);
  if (titulo.length < 2) throw erro(422, 'Dê um título ao material');
  let it = b.id ? bib.itens.find((x) => x.id === b.id) : null;
  if (b.id && !it) throw erro(404, 'Material não encontrado');
  const novo = !it;
  if (novo) {
    const v = { n: 1, ...versaoDe(b, 'm'), em: agora(), por: s.n };
    it = { id: crypto.randomBytes(5).toString('hex'), status: b.publicar ? 'publicado' : 'rascunho', versoes: [v], atual: 1, criado: agora(), por: s.n };
    bib.itens.unshift(it);
  }
  Object.assign(it, { titulo, tipo: MAT_TIPOS.includes(b.tipo) ? b.tipo : 'documento', produto: PRODUTOS.includes(b.produto) ? b.produto : 'geral',
    desc: texto(b.desc, 400) || null, destaque: !!b.destaque, atualizado: agora() });
  await gravar(CAM.mat, bib);
  await auditar(s, novo ? 'material.criado' : 'material.editado', 'material', it.id, { titulo, status: it.status });
  return bib;
}
async function materialVersao(b, s) {
  const bib = await biblioteca();
  const it = bib.itens.find((x) => x.id === b.id);
  if (!it) throw erro(404, 'Material não encontrado');
  const n = Math.max(...it.versoes.map((v) => v.n)) + 1;
  it.versoes.push({ n, ...versaoDe(b, 'm'), em: agora(), por: s.n, nota: limpa(b.nota, 200) || null });
  it.atual = n; it.atualizado = agora();
  await gravar(CAM.mat, bib);
  await auditar(s, 'material.nova_versao', 'material', it.id, { versao: n });
  return bib;
}
async function materialStatus(b, s) {
  const bib = await biblioteca();
  const it = bib.itens.find((x) => x.id === b.id);
  if (!it) throw erro(404, 'Material não encontrado');
  if (!ST_CONTEUDO.includes(b.status)) throw erro(422, 'Situação inválida');
  const de = it.status; it.status = b.status; it.atualizado = agora();
  await gravar(CAM.mat, bib);
  await auditar(s, 'material.situacao', 'material', it.id, { de, para: b.status });
  return bib;
}
async function materialOcultar(b, s) {
  const bib = await biblioteca();
  const chave = limpa(b.chave, 300);
  if (!chave) throw erro(422, 'Material inválido');
  bib.ocultos = b.ocultar ? [...new Set([...bib.ocultos, chave])] : bib.ocultos.filter((x) => x !== chave);
  await gravar(CAM.mat, { itens: bib.itens, ocultos: bib.ocultos });
  await auditar(s, b.ocultar ? 'material.fixo_oculto' : 'material.fixo_visivel', 'material', chave);
  return bib;
}

/* ------------------------------------------------------------------ tutoriais (Aprender) */
async function tutoriais() {
  const d = await ler(CAM.tut);
  return { itens: ((d && d.itens) || []).slice().sort((a, b) => (a.ordem || 0) - (b.ordem || 0)), ocultos: (d && Array.isArray(d.ocultos)) ? d.ocultos : [] };
}
const tutoriaisPara = (d, eq) => (eq ? d : { ocultos: d.ocultos, itens: d.itens.filter((x) => x.status === 'publicado') });
async function tutorialSalvar(b, s) {
  const d = await tutoriais();
  const titulo = limpa(b.titulo, 120);
  if (titulo.length < 3) throw erro(422, 'Dê um título ao tutorial');
  const tipo = ['texto', 'link', 'arquivo'].includes(b.tipo) ? b.tipo : 'texto';
  let it = b.id ? d.itens.find((x) => x.id === b.id) : null;
  if (b.id && !it) throw erro(404, 'Tutorial não encontrado');
  const novo = !it;
  if (novo) { it = { id: crypto.randomBytes(5).toString('hex'), status: 'rascunho', ordem: d.itens.length + 1, criado: agora(), por: s.n }; d.itens.push(it); }
  const conteudo = { tipo, corpo: tipo === 'texto' ? texto(b.corpo, 20000) : null };
  if (tipo === 'texto' && (conteudo.corpo || '').length < 10) throw erro(422, 'Escreva o conteúdo do tutorial');
  if (tipo !== 'texto' && (novo || b.caminho || b.link)) Object.assign(conteudo, versaoDe(b, 't'));
  if (tipo !== 'texto' && !novo && !b.caminho && !b.link && !(it.caminho || it.link)) throw erro(422, 'Envie um arquivo ou informe um link');
  Object.assign(it, conteudo, { titulo, resumo: limpa(b.resumo, 240) || null, categoria: limpa(b.categoria, 60) || null, atualizado: agora() });
  if (tipo === 'texto') { it.caminho = null; it.link = null; }
  await gravar(CAM.tut, d);
  await auditar(s, novo ? 'tutorial.criado' : 'tutorial.editado', 'tutorial', it.id, { titulo });
  return d;
}
async function tutorialStatus(b, s) {
  const d = await tutoriais();
  const it = d.itens.find((x) => x.id === b.id);
  if (!it) throw erro(404, 'Tutorial não encontrado');
  if (!ST_CONTEUDO.includes(b.status)) throw erro(422, 'Situação inválida');
  const de = it.status; it.status = b.status; it.atualizado = agora();
  await gravar(CAM.tut, d);
  await auditar(s, 'tutorial.situacao', 'tutorial', it.id, { de, para: b.status });
  return d;
}
async function tutorialMover(b, s) {
  const d = await tutoriais();
  const i = d.itens.findIndex((x) => x.id === b.id);
  if (i < 0) throw erro(404, 'Tutorial não encontrado');
  const j = i + (b.dir < 0 ? -1 : 1);
  if (j >= 0 && j < d.itens.length) [d.itens[i], d.itens[j]] = [d.itens[j], d.itens[i]];
  d.itens.forEach((x, k) => { x.ordem = k + 1; });
  await gravar(CAM.tut, d);
  return d;
}
async function tutorialOcultar(b, s) {
  const d = await tutoriais();
  const chave = limpa(b.chave, 80);
  d.ocultos = b.ocultar ? [...new Set([...d.ocultos, chave])] : d.ocultos.filter((x) => x !== chave);
  await gravar(CAM.tut, d);
  await auditar(s, b.ocultar ? 'tutorial.fixo_retirado' : 'tutorial.fixo_publicado', 'tutorial', chave);
  return d;
}

/* ------------------------------------------------------------------ ofertas / campanhas / cards */
async function ofertasTodas() { const d = await ler(CAM.of); return (d && d.ofertas) || []; }
async function ofertasListar(eq) {
  const [lst, snap] = await Promise.all([ofertasTodas(), sincronizar(false)]);
  const { unidades } = base();
  const com = lst.map((o) => ({ ...o, elegibilidade: R.elegibilidade(o, { snap, unidades }) }))
    .map((o) => ({ ...o, motivo: R.motivoTexto(o.elegibilidade) }));
  return { sync: resumoSync(snap), fuso: R.fuso(), nomeFuso: R.nomeFuso(), ofertas: eq ? com : com.filter((o) => o.elegibilidade.ok) };
}
async function ofertaSalvar(b, s) {
  const lst = await ofertasTodas();
  const { unidades } = base();
  const titulo = limpa(b.titulo, 90);
  if (titulo.length < 3) throw erro(422, 'Dê um título à oferta');
  const condicoes = texto(b.condicoes, 600);
  if (condicoes.length < 5) throw erro(422, 'Escreva as condições essenciais (aparecem no card)');
  const inicio = R.localParaUTC(b.inicio), fim = R.localParaUTC(b.fim);
  if (!inicio || !fim) throw erro(422, 'Informe início e fim da vigência');
  if (Date.parse(inicio) >= Date.parse(fim)) throw erro(422, 'O fim precisa ser depois do início');
  const ids = [...new Set((Array.isArray(b.unidades) ? b.unidades : String(b.unidades || '').split(/[\s,;]+/)).map((x) => limpa(x, 20).toUpperCase()).filter(Boolean))];
  const errados = ids.filter((x) => !unidades.has(x));
  if (errados.length) throw erro(422, `Unidade(s) inexistente(s): ${errados.join(', ')}`);
  const valor = R.valorDecimal(b.valor);
  if (valor === undefined) throw erro(422, 'Valor inválido: use números com até 2 casas (ex.: 150000 ou 1250.50)');
  let o = b.id ? lst.find((x) => x.id === b.id) : null;
  if (b.id && !o) throw erro(404, 'Oferta não encontrada');
  const novo = !o;
  if (novo) { o = { id: novoId(), status: 'rascunho', criado: agora(), criadoPor: s.n, historico: [] }; lst.unshift(o); }
  Object.assign(o, { titulo, descricao: texto(b.descricao, 1200) || null, condicoes, campanha: limpa(b.campanha, 60) || null, unidades: ids,
    valor, moeda: 'USD', valorRotulo: limpa(b.valorRotulo, 60) || null, inicio, fim, responsavel: s.n, atualizado: agora() });
  o.historico.push({ em: agora(), por: s.n, acao: novo ? 'criada' : 'editada' });
  await gravar(CAM.of, { ofertas: lst });
  await auditar(s, novo ? 'oferta.criada' : 'oferta.editada', 'oferta', o.id, { titulo, inicio, fim, unidades: ids });
  return ofertasListar(true);
}
async function ofertaStatus(b, s) {
  const lst = await ofertasTodas();
  const o = lst.find((x) => x.id === b.id);
  if (!o) throw erro(404, 'Oferta não encontrada');
  if (!['rascunho', 'publicada', 'encerrada'].includes(b.status)) throw erro(422, 'Situação inválida');
  if (b.status === 'publicada' && Date.parse(o.fim) <= Date.now()) throw erro(422, 'A vigência já terminou — ajuste o fim antes de publicar');
  const de = o.status; o.status = b.status; o.atualizado = agora();
  o.historico.push({ em: agora(), por: s.n, acao: `situação: ${de} → ${b.status}` });
  await gravar(CAM.of, { ofertas: lst });
  await auditar(s, 'oferta.situacao', 'oferta', o.id, { de, para: b.status });
  return ofertasListar(true);
}
async function cardBaixar(req, res, s) {
  const id = limpa(new URL(req.url, 'http://x').searchParams.get('card'), 40);
  const o = (await ofertasTodas()).find((x) => x.id === id);
  const snap = await sincronizar(false);
  const { unidades, precos } = base();
  const el = R.elegibilidade(o, { snap, unidades });
  if (!el.ok) {     // validação também no download direto, não só na lista
    res.statusCode = o ? 410 : 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ ok: false, erro: R.motivoTexto(el), motivo: el.motivo }));
  }
  const svg = R.cardSVG(o, { unidades, precos });
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `attachment; filename="bracerum-oferta-${o.id}.svg"`);
  await auditar(s, 'oferta.card_baixado', 'oferta', o.id);
  res.end(svg);
}

/* ------------------------------------------------------------------ solicitações ao marketing */
const TIPOS = ['peca', 'impresso', 'evento', 'video', 'traducao', 'visita', 'material', 'outro'];
const MATERIAIS_PEDIDO = { post: 'peca', story: 'peca', banner: 'peca', folder: 'impresso', cartao: 'impresso', apresentacao: 'material',
  video: 'video', placa: 'impresso', evento: 'evento', visita: 'visita', traducao: 'traducao', outro: 'outro' };
const FORMATOS = ['digital', 'impresso', 'ambos'];
function normalizaPedido(p) {
  return { ...p, status: R.statusPedido(p.status), mensagens: p.mensagens || [],
    historico: (p.historico || []).map((h) => (h.status ? { ...h, status: R.statusPedido(h.status) } : h)) };
}
const corretorPede = () => process.env.PORTAL_PEDIDOS_CORRETOR === '1';
async function pedidoCriar(b, u) {
  if (u.status !== 'aprovado') throw erro(403, 'Conta sem permissão para abrir solicitações.');
  // Só os campos abaixo vêm do corretor; autor, situação, responsável e datas são do servidor.
  const material = Object.prototype.hasOwnProperty.call(MATERIAIS_PEDIDO, b.material) ? b.material : null;
  const tipo = material ? MATERIAIS_PEDIDO[material] : (TIPOS.includes(b.tipo) ? b.tipo : 'outro');
  const formato = FORMATOS.includes(b.formato) ? b.formato : null;
  const dados = texto(b.dados, 1500) || null;
  const descricao = texto(b.descricao, 2000);
  const titulo = limpa(b.titulo, 100) || limpa(b.tituloAuto, 100);
  if (!material && titulo.length < 4) throw erro(422, 'Escolha o material');
  if (!formato && material) throw erro(422, 'Escolha digital ou impresso');
  if ((dados || '').length + descricao.length < 10) throw erro(422, 'Conte o que vai na peça ou descreva o que você precisa');
  const ref = limpa(b.referencia, 400);
  if (!urlOk(ref)) throw erro(422, 'O link de referência precisa começar com https://');
  const id = novoId();
  const p = {
    id, numero: (await listar('portal/p/')).length + 1, tipo, material, formato,
    quantidade: Math.max(1, Math.min(100000, Math.round(Number(b.quantidade) || 1))), medida: limpa(b.medida, 80) || null, dados, anexos: [],
    produto: PRODUTOS.includes(b.produto) ? b.produto : 'geral', titulo: titulo || 'Solicitação', descricao,
    prazo: /^\d{4}-\d{2}-\d{2}$/.test(b.prazo || '') ? b.prazo : null, referencia: ref || null,
    idioma: ['pt', 'es', 'en'].includes(b.idioma) ? b.idioma : 'pt',
    status: 'enviada', criado: agora(), atualizado: agora(), responsavel: null, mensagens: [],
    corretor: { id: u.id, nome: u.nome, email: u.email, imobiliaria: u.imobiliaria, ddi: u.ddi, tel: u.tel },
    historico: [{ em: agora(), status: 'enviada', por: u.nome }], entrega: null,
  };
  await gravar(caminhoP(id), p);
  await auditar({ u: u.id, n: u.nome }, 'solicitacao.criada', 'solicitacao', id, { material, tipo });
  return { pedido: p };
}
async function pedidosListar(s, u) {
  const blobs = (await listar('portal/p/')).sort((a, b) => b.pathname.localeCompare(a.pathname));
  let lst = (await lerVarios(blobs, 1000)).map(normalizaPedido);
  if (s.p !== 'equipe') lst = lst.filter((p) => p.corretor && p.corretor.id === u.id);
  return { pedidos: lst.sort((a, b) => String(b.criado).localeCompare(String(a.criado))) };
}
async function pedidoDoUsuario(id, s, u) {
  const p = await ler(caminhoP(limpa(id, 40)));
  if (!p) throw erro(404, 'Solicitação não encontrada');
  if (s.p !== 'equipe' && (!p.corretor || p.corretor.id !== u.id)) throw erro(404, 'Solicitação não encontrada');   // não revela que existe
  return normalizaPedido(p);
}
async function pedidoAtualizar(b, s) {
  const p = await pedidoDoUsuario(b.id, s, null);
  const reg = (campo, de, para) => p.historico.push({ em: agora(), por: s.n, campo, de, para, ...(campo === 'status' ? { status: para } : {}) });
  if (b.status !== undefined && b.status !== p.status) {
    if (!R.transicaoValida(p.status, b.status)) throw erro(409, `Transição inválida: ${p.status} → ${b.status}`);
    reg('status', p.status, b.status); p.status = b.status;
  }
  if (b.responsavelId !== undefined) {
    let resp = null;
    if (b.responsavelId) {
      const g = await ler(caminhoU(limpa(b.responsavelId, 40)));
      if (!g || PAPEL(g) !== 'equipe' || !ativo(g)) throw erro(422, 'Responsável precisa ser um gestor ativo');
      resp = { id: g.id, nome: g.nome };
    }
    if ((p.responsavel && p.responsavel.id) !== (resp && resp.id)) { reg('responsavel', p.responsavel && p.responsavel.nome, resp && resp.nome); p.responsavel = resp; }
  }
  if (b.entrega !== undefined) {
    const e = limpa(b.entrega, 400);
    if (!urlOk(e)) throw erro(422, 'O link de entrega precisa começar com https://');
    if ((p.entrega || '') !== e) { reg('entrega', p.entrega, e || null); p.entrega = e || null; }
  }
  p.atualizado = agora();
  await gravar(caminhoP(p.id), p);
  await auditar(s, 'solicitacao.alterada', 'solicitacao', p.id, { status: p.status, responsavel: p.responsavel && p.responsavel.nome });
  return { pedido: p };
}
async function pedidoMensagem(b, s, u) {
  const p = await pedidoDoUsuario(b.id, s, u);
  const t = texto(b.texto, 2000);
  if (t.length < 1) throw erro(422, 'Escreva a mensagem');
  if (s.p !== 'equipe' && R.TERMINAIS.includes(p.status)) throw erro(409, 'Solicitação encerrada');
  p.mensagens.push({ id: crypto.randomBytes(4).toString('hex'), em: agora(), texto: t, autor: { id: s.u, nome: s.n, papel: s.p } });
  p.atualizado = agora();
  await gravar(caminhoP(p.id), p);
  return { pedido: p };
}
async function pedidoCancelarProprio(b, s, u) {
  const p = await pedidoDoUsuario(b.id, s, u);
  if (p.status !== 'enviada') throw erro(409, 'O marketing já começou esta solicitação — escreva uma mensagem para pedir o cancelamento.');
  p.historico.push({ em: agora(), status: 'cancelada', campo: 'status', de: 'enviada', para: 'cancelada', por: u.nome });
  p.status = 'cancelada'; p.atualizado = agora();
  await gravar(caminhoP(p.id), p);
  await auditar(s, 'solicitacao.cancelada', 'solicitacao', p.id);
  return { pedido: p };
}
async function gestoresListar() {
  return { gestores: (await todasContas()).filter((u) => PAPEL(u) === 'equipe' && ativo(u)).map((u) => ({ id: u.id, nome: u.nome })) };
}

/* ------------------------------------------------------------------ anexos das solicitações (≤ 3 MB, pela função) */
const ANEXO_TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const ANEXO_MAX = 3 * 1024 * 1024;
const ANEXOS_POR_PEDIDO = 10;
async function anexoEnviar(b, s, u) {
  const p = await pedidoDoUsuario(b.pedido, s, u);
  if (p.anexos.length >= ANEXOS_POR_PEDIDO) throw erro(422, `Até ${ANEXOS_POR_PEDIDO} arquivos por solicitação`);
  const tipo = String(b.tipo || '');
  if (!ANEXO_TIPOS.includes(tipo)) throw erro(415, 'Envie imagem (JPG, PNG, WEBP) ou PDF');
  const buf = Buffer.from(String(b.dados || ''), 'base64');
  if (!buf.length) throw erro(422, 'Arquivo vazio');
  if (buf.length > ANEXO_MAX) throw erro(413, 'Arquivo maior que 3 MB');
  const caminho = `portal/a/${p.id}/${p.anexos.length + 1}-${nomeArquivoSeguro(b.nome)}`;
  exigeStore();
  await B().put(caminho, buf, { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: tipo });
  p.anexos.push({ nome: limpa(b.nome, 80) || 'anexo', caminho, tipo, kb: Math.ceil(buf.length / 1024), por: s.n, em: agora() });
  p.atualizado = agora();
  await gravar(caminhoP(p.id), p);
  return { pedido: p };
}

/* ------------------------------------------------------------------ downloads (GET) */
async function contaDaSessao(req) {
  const s = lerSessao(req);
  if (!s || !s.u) return null;
  const u = await ler(caminhoU(s.u));
  if (!u || !ativo(u) || PAPEL(u) !== s.p) return null;
  return { s, u };
}
async function baixar(req, res) {
  const q = new URL(req.url, 'http://x').searchParams;
  const c = await contaDaSessao(req);
  if (!c) return nao(res);
  const eq = c.s.p === 'equipe';
  if (q.get('card')) return cardBaixar(req, res, c.s);
  if (q.get('anexo')) {
    const caminho = String(q.get('anexo'));
    const m = caminho.match(/^portal\/a\/([a-z0-9-]{6,40})\/[\w.\-]+$/i);
    if (!m) return nao(res);
    const p = await ler(caminhoP(m[1]));
    const a = p && (p.anexos || []).find((x) => x.caminho === caminho);
    if (!a || !(eq || (corretorPede() && p.corretor && p.corretor.id === c.u.id))) return nao(res);
    return servirArquivo(res, caminho, a.tipo, a.nome, false);
  }
  if (q.get('material')) {
    const caminho = String(q.get('material'));
    if (!RX_ARQ.m.test(caminho)) return nao(res);
    const it = (await biblioteca()).itens.find((x) => x.versoes.some((v) => v.caminho === caminho));
    if (!it) return nao(res);
    const v = it.versoes.find((x) => x.caminho === caminho);
    // corretor: só material publicado e só a versão vigente
    if (!eq && (it.status !== 'publicado' || versaoAtual(it).caminho !== caminho)) return nao(res);
    return servirArquivo(res, caminho, v.conteudo, v.nomeArquivo || caminho.split('/').pop().replace(/^[a-f0-9]{10}-/, ''), !!q.get('baixar'));
  }
  if (q.get('tutorial')) {
    const caminho = String(q.get('tutorial'));
    if (!RX_ARQ.t.test(caminho)) return nao(res);
    const it = (await tutoriais()).itens.find((x) => x.caminho === caminho);
    if (!it || (!eq && it.status !== 'publicado')) return nao(res);
    return servirArquivo(res, caminho, it.conteudo, it.nomeArquivo || 'tutorial', !!q.get('baixar'));
  }
  return nao(res);
}

/* ------------------------------------------------------------------ corretores do CV → contas + e-mail (2026-11-24) */
// Cada corretor ativo no CV vira uma conta de corretor no portal com o MESMO e-mail, e recebe um e-mail de
// boas-vindas com o link de primeiro acesso (ele só cria a senha). Automático só com PORTAL_CV_AUTO=1
// (rotina diária da Vercel + gestor abrindo a Gestão); sem isso, o gestor importa e envia pela aba "Corretores do CV".
// Conta que já existe com o mesmo e-mail não é recriada nem rebaixada (um gestor continua gestor).
const CVP = require('./_portal-cv.js');
const cvAuto = () => process.env.PORTAL_CV_AUTO === '1';
// No automático, só corretores com id do CV a partir deste número (os que já existiam ficam no botão manual).
const cvDesdeId = () => Number(process.env.PORTAL_CV_AUTO_DESDE_ID || 0) || 0;
const ORIGEM_SITE = 'https://bracerumpark.com';
const CV_TENTATIVAS = 3;
async function cvEstado() { return (await ler(CAM.cvSync)) || {}; }
async function cvConvidar(u, origem, s, teste) {
  const link = linkConvite(origem, u.email);
  const m = CVP.emailBoasVindas({ nome: u.nome, link, origem, teste });
  const reg = { em: agora(), por: s ? s.n : 'automação', para: u.email, teste: !!teste };
  try { Object.assign(reg, { ok: true, id: (await CVP.enviarEmail({ para: u.email, ...m })).id }); }
  catch (e) { Object.assign(reg, { ok: false, erro: String(e.message).slice(0, 200) }); }
  if (!teste) {
    u.convite = { ...reg, tentativas: ((u.convite && u.convite.tentativas) || 0) + 1 };
    await gravar(caminhoU(u.id), u);
  }
  await auditar(s, teste ? 'email.teste' : 'conta.convite', 'conta', u.id, { para: u.email, ok: reg.ok, erro: reg.erro || null });
  return reg;
}
function contaDoCV(c, s) {
  const id = idEmail(c.email);
  const nome = c.nome.length >= 2 ? c.nome : c.email.split('@')[0];
  return { id, email: c.email, nome, ddi: c.ddi || '', tel: c.tel || '', imobiliaria: c.imobiliaria || '', papel: 'corretor', status: 'aprovado',
    slug: slugDe(nome, id), criado: agora(), criadoPor: s ? s.n : 'CV CRM', origem: 'cv', cvId: c.cvId, pais: c.ddi === '595' ? 'PY' : c.ddi === '55' ? 'BR' : 'OUTRO', idioma: 'pt' };
}
async function cvCorretores() {
  const [lista, contas, estado] = await Promise.all([CVP.lerCorretoresCV(), todasContas(), cvEstado()]);
  const porEmail = new Map(contas.map((x) => [String(x.email).toLowerCase(), x]));
  return {
    auto: cvAuto(), desdeId: cvDesdeId(), email: CVP.emailConfigurado(), remetente: CVP.remetente(), estado,
    corretores: lista.map((c) => {
      const u = porEmail.get(c.email);
      return { ...c, fora: CVP.motivoFora(c),
        conta: u ? { id: u.id, papel: PAPEL(u), status: u.status || 'aprovado', ativo: !!u.senha, convite: u.convite || null } : null };
    }),
  };
}
async function cvSincronizar(s, origem, { enviar, cvIds, desdeId, unico } = {}) {
  const estado = await cvEstado();
  const res0 = { em: agora(), por: s ? s.n : 'automação', criadas: 0, convites: 0, falhas: 0, ignorados: 0 };
  try {
    const lista = await CVP.lerCorretoresCV();
    for (const c of lista) {
      if (cvIds && !cvIds.includes(c.cvId)) continue;
      if (desdeId && c.cvId < desdeId) continue;
      if (CVP.motivoFora(c)) { res0.ignorados++; continue; }
      let u = await ler(caminhoU(idEmail(c.email)));
      // no automático, cada tentativa de cada corretor é reservada uma única vez (dois acessos ao mesmo tempo não duplicam)
      const tentativa = ((u && u.convite && u.convite.tentativas) || 0) + 1;
      const precisa = !u || (PAPEL(u) === 'corretor' && ativo(u) && !u.senha && !(u.convite && u.convite.ok) && tentativa <= CV_TENTATIVAS);
      if (unico && precisa && !(await reservar(`portal/cv/auto-${c.cvId}-${tentativa}.json`, { em: agora(), email: c.email }))) continue;
      if (u) {
        if (!u.cvId) { u.cvId = c.cvId; await gravar(caminhoU(u.id), u); }
        const pendente = PAPEL(u) === 'corretor' && ativo(u) && !u.senha && !(u.convite && u.convite.ok) && ((u.convite && u.convite.tentativas) || 0) < CV_TENTATIVAS;
        if (!(enviar && pendente)) continue;
      } else {
        u = contaDoCV(c, s);
        await gravar(caminhoU(u.id), u);
        await auditar(s, 'conta.criada', 'conta', u.id, { papel: 'corretor', email: u.email, origem: 'cv', cvId: c.cvId });
        res0.criadas++;
        if (!enviar) continue;
      }
      const r1 = await cvConvidar(u, origem, s, false);
      if (r1.ok) res0.convites++; else res0.falhas++;
    }
    Object.assign(estado, { ultimaTentativa: res0.em, ultimoSucesso: res0.em, resultado: 'ok', erro: null, ultimo: res0 });
  } catch (e) {
    Object.assign(estado, { ultimaTentativa: res0.em, resultado: 'erro', erro: String(e.message).slice(0, 200) });
    await gravar(CAM.cvSync, estado);
    throw erro(502, `Não deu para ler os corretores do CV: ${e.message}`);
  }
  await gravar(CAM.cvSync, estado);
  if (res0.criadas || res0.convites || res0.falhas) await auditar(s, 'cv.sincronizado', 'cv', null, res0);
  return { resultado: res0 };
}
// Automático (PORTAL_CV_AUTO=1): o CV não avisa cadastro de corretor (não há webhook para isso) e o plano da
// Vercel só tem rotina diária — então toda chamada ao portal e ao /api/lotes-status (a maquete do site consulta
// o tempo todo) confere o CV em segundo plano, no máximo a cada 5 min. A trava "rodando" evita convite em dobro.
const CV_INTERVALO = 5 * 60e3;
async function cvTalvezAuto() {
  if (!cvAuto()) return null;
  const e = await cvEstado();
  const agoraMs = Date.now();
  if (e.ultimaTentativa && agoraMs - Date.parse(e.ultimaTentativa) < CV_INTERVALO) return null;
  if (e.rodando && agoraMs - Date.parse(e.rodando) < 2 * 60e3) return null;
  await gravar(CAM.cvSync, { ...e, rodando: agora() });
  try { return await cvSincronizar(null, ORIGEM_SITE, { enviar: true, desdeId: cvDesdeId(), unico: true }); }
  catch (err) { console.error('[portal] cv auto', err.message); return null; }
  finally { const f = await cvEstado(); delete f.rodando; await gravar(CAM.cvSync, f); }
}
function agendarCV() {
  if (!cvAuto()) return;
  const tarefa = cvTalvezAuto().catch((err) => console.error('[portal] cv auto', err.message));
  try { require('@vercel/functions').waitUntil(tarefa); } catch (err) { /* fora da Vercel: a promessa segue sozinha */ }
}
async function cronCV(req, res) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || String(req.headers.authorization || '') !== `Bearer ${segredo}`) { res.statusCode = 401; return res.end(JSON.stringify({ ok: false })); }
  const tab = tabelasAtualizar().then((x) => x.resultado).catch((e) => `erro: ${e.message}`);   // tabelas de Casas/Aptos/Outlet também
  if (!cvAuto()) return res.end(JSON.stringify({ ok: true, auto: false, tabelas: await tab }));
  try {
    const [d, t] = await Promise.all([cvSincronizar(null, ORIGEM_SITE, { enviar: true, desdeId: cvDesdeId(), unico: true }), tab]);
    return res.end(JSON.stringify({ ok: true, ...d, tabelas: t }));
  } catch (e) { await tab; res.statusCode = 502; return res.end(JSON.stringify({ ok: false, erro: e.message })); }
}

/* ------------------------------------------------------------------ handler */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const fim = (status, obj) => { res.statusCode = status; res.end(JSON.stringify(obj)); };
  if (req.method === 'GET' && /[?&]cron=cv-corretores\b/.test(req.url || '')) return cronCV(req, res);
  agendarCV();
  if (req.method === 'GET' && /[?&](anexo|material|tutorial|card)=/.test(req.url || '')) {
    try { return await baixar(req, res); } catch (e) { console.error('[portal] download', e.message); res.statusCode = 500; return res.end('erro'); }
  }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fim(405, { ok: false, erro: 'método' }); }
  if (!/application\/json/i.test(String(req.headers['content-type'] || ''))) return fim(415, { ok: false, erro: 'tipo' });
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return fim(400, { ok: false, erro: 'corpo' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip';
  try {
    // Não existe cadastro público nem senha compartilhada: contas nascem na Gestão.
    if (b.acao === 'cadastro' || b.acao === 'equipe') return fim(403, { ok: false, erro: 'As contas são criadas pelo gestor do portal.' });
    if (b.acao === 'entrar') return fim(200, { ok: true, ...(await login(b, res, ip)) });
    if (b.acao === 'sair') { apagarCookie(res); return fim(200, { ok: true }); }
    if (b.acao === 'conviteVer') return fim(200, { ok: true, ...(await conviteVer(b)) });
    if (b.acao === 'convite') {
      if (bloqueado(`conv|${ip}`)) throw erro(429, 'Muitas tentativas. Espere 10 minutos.');
      falhou(`conv|${ip}`);
      return fim(200, { ok: true, ...(await conviteAceitar(b, res)) });
    }

    // Toda chamada autenticada relê a conta: bloqueio, exclusão ou troca de papel derrubam a sessão.
    const c = await contaDaSessao(req);
    if (!c) { apagarCookie(res); return fim(401, { ok: false, erro: 'sessão', sair: true }); }
    const { s, u } = c;
    const eq = s.p === 'equipe';
    const soGestor = () => { if (!eq) throw erro(403, 'Só o gestor'); };
    // Solicitações ao marketing: só o gestor desde 2026-11-24 (PORTAL_PEDIDOS_CORRETOR=1 devolve ao corretor).
    const pedidosLiberados = () => { if (!eq && !corretorPede()) throw erro(403, 'As solicitações ao marketing são feitas pela equipe Bracerum'); };
    const ok = (obj) => fim(200, { ok: true, ...obj });

    switch (b.acao) {
      case 'eu': return ok({ usuario: publico(u) });
      case 'perfil': {
        Object.assign(u, validarConta(b, true));
        if (b.senhaNova) {
          if (!senhaConfere(b.senhaAtual, u.senha)) throw erro(401, 'A senha atual não confere');
          u.senha = hashSenha(validarSenha(b.senhaNova));
        }
        await gravar(caminhoU(u.id), u);
        return ok({ usuario: publico(u) });
      }
      case 'senhaEquipe': {
        if (!senhaConfere(b.senhaAtual, u.senha)) throw erro(401, 'A senha atual não confere');
        u.senha = hashSenha(validarSenha(b.senhaNova));
        await gravar(caminhoU(u.id), u);
        return ok({});
      }
      // dados comerciais
      case 'comercial': return ok(await comercial());
      case 'tabelasProdutos': { const rodando = await tabelasTalvez(); return ok({ tabelas: tabelasPublico(await tabelasEstado(), rodando) }); }
      case 'tabelasSincronizar': soGestor(); { const snap = await tabelasAtualizar(); await auditar(s, 'tabelas.sincronizar', 'sync', null, { resultado: snap.resultado }); return ok({ tabelas: tabelasPublico(snap, false) }); }
      case 'sincronizar': soGestor(); { const snap = await sincronizar(true); await auditar(s, 'comercial.sincronizar', 'sync', null, { resultado: snap.resultado }); return ok({ sync: resumoSync(snap) }); }
      // contas e imobiliárias
      case 'contas': soGestor(); return ok(await contasListar());
      case 'contaCriar': soGestor(); return ok(await contaCriar(b, s, req));
      case 'contaAtualizar': soGestor(); return ok(await contaAtualizar(b, s, req));
      case 'contaRemover': soGestor(); return ok(await contaAtualizar({ id: b.id, status: 'excluido' }, s, req));   // exclusão lógica
      case 'contaLink': soGestor(); return ok(await contaLink(b, s, req));
      case 'gestores': soGestor(); return ok(await gestoresListar());
      case 'imobiliarias': soGestor(); return ok(await imobiliariasComContagem());
      case 'imobiliariaSalvar': soGestor(); return ok(await imobiliariaSalvar(b, s));
      case 'imobiliariaArquivar': soGestor(); return ok(await imobiliariaArquivar(b, s));
      case 'imobiliariaExcluir': soGestor(); return ok(await imobiliariaExcluir(b, s));
      case 'auditoria': soGestor(); return ok(await auditoriaListar());
      // envio de arquivos
      case 'materialToken': case 'arquivoToken': soGestor(); return ok(await tokenEnvio(b));
      // materiais
      case 'materiais': return ok(bibliotecaPara(await biblioteca(), eq));
      case 'materialSalvar': soGestor(); return ok(await materialSalvar(b, s));
      case 'materialVersao': soGestor(); return ok(await materialVersao(b, s));
      case 'materialStatus': soGestor(); return ok(await materialStatus(b, s));
      case 'materialOcultar': soGestor(); return ok(await materialOcultar(b, s));
      // tutoriais
      case 'tutoriais': return ok(tutoriaisPara(await tutoriais(), eq));
      case 'tutorialSalvar': soGestor(); return ok(await tutorialSalvar(b, s));
      case 'tutorialStatus': soGestor(); return ok(await tutorialStatus(b, s));
      case 'tutorialMover': soGestor(); return ok(await tutorialMover(b, s));
      case 'tutorialOcultar': soGestor(); return ok(await tutorialOcultar(b, s));
      // ofertas
      case 'ofertas': return ok(await ofertasListar(eq));
      case 'ofertaSalvar': soGestor(); return ok(await ofertaSalvar(b, s));
      case 'ofertaStatus': soGestor(); return ok(await ofertaStatus(b, s));
      // solicitações
      // corretores do CV
      case 'cvCorretores': soGestor(); await cvTalvezAuto(); return ok(await cvCorretores());
      case 'cvSincronizar': soGestor(); return ok(await cvSincronizar(s, origemDe(req), { enviar: !!b.enviar, cvIds: Array.isArray(b.cvIds) ? b.cvIds.map(Number) : undefined }));
      case 'cvConvite': {
        soGestor();
        const alvo = await ler(caminhoU(limpa(b.id, 40)));
        if (!alvo) throw erro(404, 'Conta não encontrada');
        if (!ativo(alvo)) throw erro(409, 'Conta suspensa ou excluída');
        if (alvo.senha) throw erro(409, 'Essa pessoa já criou a senha');
        const reg = await cvConvidar(alvo, origemDe(req), s, false);
        if (!reg.ok) throw erro(502, `O e-mail não saiu: ${reg.erro}`);
        return ok({ envio: reg });
      }
      case 'cvTeste': {
        soGestor();
        const reg = await cvConvidar(u, origemDe(req), s, true);
        if (!reg.ok) throw erro(502, `O e-mail de teste não saiu: ${reg.erro}`);
        return ok({ envio: reg });
      }
      case 'pedidos': pedidosLiberados(); return ok(await pedidosListar(s, u));
      case 'pedido': pedidosLiberados(); if (eq) throw erro(400, 'Abra a solicitação com uma conta de corretor'); return ok(await pedidoCriar(b, u));
      case 'pedidoMensagem': pedidosLiberados(); return ok(await pedidoMensagem(b, s, u));
      case 'anexo': pedidosLiberados(); return ok(await anexoEnviar(b, s, u));
      case 'pedidoCancelar': pedidosLiberados(); if (eq) throw erro(400, 'Use a situação da solicitação'); return ok(await pedidoCancelarProprio(b, s, u));
      case 'pedidoAtualizar': soGestor(); return ok(await pedidoAtualizar(b, s));
      default: return fim(400, { ok: false, erro: 'ação' });
    }
  } catch (e) {
    if (!e.status) console.error('[portal]', b.acao, e.message);
    return fim(e.status || 500, { ok: false, erro: e.status ? e.message : 'Erro no servidor. Tente de novo.' });
  }
};

module.exports._interno = { hashSenha, senhaConfere, slugDe, validarConta, idEmail, normalizaMaterial, normalizaPedido, bibliotecaPara, _zerarBase: () => { BASE = null; } };
module.exports.agendarCV = agendarCV;
