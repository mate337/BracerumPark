/*
  /api/admin — painel de reservas da feira (página /admin/).

  Uma função só, POST JSON { acao, ... }. Tudo, menos o login, exige o cabeçalho
  Authorization: Bearer <token> devolvido pelo login.

    login      { senha, quem }            -> { token, exp, quem }
    estado     {}                         -> situação ao vivo de cada lote + valores das tabelas do CV
    reservar   { lote, tabela, nome, email, ddi, telefone, empresa, cpf, obs }
               -> lead + cliente + reserva no CV (a unidade sai da venda e a maquete a mostra reservada)
    reservas   {}                         -> reservas ativas do loteamento
    cancelar   { idreserva }              -> cancela uma reserva feita pelo corretor da feira

  Fluxo da reserva — o caso de uso "Jornada do cliente: do lead à reserva" da documentação do CV
  (desenvolvedor.cvcrm.com.br/docs/jornada-do-cliente-do-lead-à-reserva), o mesmo caminho da reserva
  que a equipe fez à mão em 10/11 (reserva 7, Q03.010):
    1. confere no mapa de disponibilidade que a unidade está livre;
    2. POST /v1/comercial/leads — lead com CPF, unidade de interesse, corretor/imobiliária da feira e uma
       anotação com empresa, lote, condição e atendente;
    3. GET /v1/cadastros/clientes?documento= — o cliente já existe? senão POST /v1/cadastros/clientes;
    4. POST /v1/comercial/reservas — com a tabela de preço escolhida e as condições (sinal + mensais)
       exatamente como estão nessa tabela do CV para essa unidade;
    5. associa a reserva ao lead (situação "Com Reserva").
  A reserva nasce em "Nova Reserva" no workflow do CV — é a negociação; dali a equipe segue no CV.

  Variáveis (Vercel → Settings → Environment Variables):
    ADMIN_SENHA               senha da equipe para entrar no /admin                        [segredo]
    CVCRM_EMAIL, CVCRM_TOKEN  as mesmas das outras funções (o perfil precisa de Leads, Clientes e Reservas)
    opcionais: CVCRM_HOST (bracerum.cvcrm.com.br) · CVCRM_EMPREENDIMENTO (4) · CVCRM_FEIRA_CORRETOR (2,
    "Feira EXPO PY BR") · CVCRM_FEIRA_IMOBILIARIA (1) · CVCRM_FEIRA_TABELA (3, "Lançamento Expo 20%+12x")
    · CVCRM_FEIRA_MIDIA (expo-py-br) · ADMIN_SEGREDO (assina a sessão; sem ele, deriva da senha)
*/
'use strict';

const crypto = require('crypto');
const { idLote, codigo } = require('./lotes-status');

const cfg = () => ({
  host: process.env.CVCRM_HOST || 'bracerum.cvcrm.com.br',
  emp: Number(process.env.CVCRM_EMPREENDIMENTO || 4),
  corretor: Number(process.env.CVCRM_FEIRA_CORRETOR || 2),
  imobiliaria: Number(process.env.CVCRM_FEIRA_IMOBILIARIA || 1),
  tabela: Number(process.env.CVCRM_FEIRA_TABELA || 3),
  midia: process.env.CVCRM_FEIRA_MIDIA || 'expo-py-br',
  motivo: process.env.CVCRM_FEIRA_MOTIVO || 'Estratégia Comercial',   // motivo de bloqueio cadastrado no CV
  dias: Math.max(1, Math.min(30, Number(process.env.CVCRM_FEIRA_DIAS || 3))),
});
const SESSAO_H = 16;

const erro = (status, msg, extra) => Object.assign(new Error(msg), { status }, extra || {});
const semAcento = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim();
const limpa = (v, n = 120) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);

/* ------------------------------------------------------------------ sessão */
function segredo() {
  if (process.env.ADMIN_SEGREDO) return process.env.ADMIN_SEGREDO;
  return crypto.createHash('sha256').update(`bp-admin|${process.env.ADMIN_SENHA || ''}|${process.env.CVCRM_TOKEN || ''}`).digest('hex');
}
const assina = (p) => crypto.createHmac('sha256', segredo()).update(p).digest('base64url');
function emitir(quem) {
  const exp = Date.now() + SESSAO_H * 3600e3;
  const p = Buffer.from(JSON.stringify({ exp, quem })).toString('base64url');
  return { token: `${p}.${assina(p)}`, exp };
}
function conferir(tok) {
  const [p, s] = String(tok || '').split('.');
  if (!p || !s) return null;
  const e = assina(p);
  if (s.length !== e.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(e))) return null;
  try {
    const d = JSON.parse(Buffer.from(p, 'base64url').toString());
    return d.exp > Date.now() ? d : null;
  } catch (x) { return null; }
}
function senhaOk(s) {
  const certa = process.env.ADMIN_SENHA;
  if (!certa) return false;
  const a = crypto.createHash('sha256').update(String(s || '')).digest();
  const b = crypto.createHash('sha256').update(certa).digest();
  return crypto.timingSafeEqual(a, b);
}
const tentativas = new Map();                 // ip -> [instantes das falhas] (por instância; basta para a feira)
function bloqueado(ip) {
  const agora = Date.now(), lst = (tentativas.get(ip) || []).filter((t) => agora - t < 10 * 60e3);
  tentativas.set(ip, lst);
  return lst.length >= 8;
}

/* ------------------------------------------------------------------ CV */
async function cv(metodo, caminho, corpo) {
  const { CVCRM_EMAIL: email, CVCRM_TOKEN: token } = process.env;
  if (!email || !token) throw erro(503, 'CV não configurado (CVCRM_EMAIL/CVCRM_TOKEN)');
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(`https://${cfg().host}/api${caminho}`, {
      method: metodo, signal: ctl.signal,
      headers: { email, token, accept: 'application/json', ...(corpo ? { 'content-type': 'application/json' } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const txt = await r.text();
    let d;
    try { d = JSON.parse(txt); } catch (e) { d = { bruto: txt.slice(0, 300) }; }
    return { status: r.status, ok: r.ok && d.sucesso !== false && !(d.codigo && Number(d.codigo) >= 400), d };
  } catch (e) {
    throw erro(504, e.name === 'AbortError' ? 'CV demorou demais para responder' : `CV inacessível: ${e.message}`);
  } finally { clearTimeout(t); }
}
const msgCv = (d) => limpa(d.error || d.mensagem || d.message || (d.erros && JSON.stringify(d.erros)) || d.bruto || JSON.stringify(d), 300);

function num(v) {                              // "200.000,00" · "40400.00" · 183750
  if (typeof v === 'number') return v;
  const s = String(v || '').trim();
  return Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s) || 0;
}

let cacheMapa = { t: 0, v: null };
const MAPA = (emp, pag, bloco) => `/v1/comercial/mapadisponibilidade/${emp}?limitePagina=300&pag=${pag}${bloco ? `&idbloco=${bloco}` : ''}`;
function lerMapa(d, out) {
  for (const u of d.dados || []) {
    const id = idLote(u);
    if (!id) continue;
    const s = codigo(u.situacao);
    const doc = String(u.documento_bloqueio || '').replace(/\D/g, '');
    // bloqueio "reservado para o doc" (ajuda.cvcrm.com.br, artigo 157000357227) = lote segurado em negociação
    const st = s === undefined ? 'b' : s;
    out.set(id, { u: u.idunidade, s: st === 'b' && doc ? 'n' : st, sit: u.situacao, bloco: u.idbloco,
      doc, motivo: u.motivo_bloqueio || null, desde: u.data_bloqueio || null });
  }
}
async function mapa() {                        // todas as unidades: a 1ª página diz quantas faltam, o resto vem junto
  const { emp } = cfg();
  const out = new Map();
  const p1 = await cv('GET', MAPA(emp, 1));
  if (!p1.ok) throw erro(502, `mapa de disponibilidade: ${p1.status} ${msgCv(p1.d)}`);
  lerMapa(p1.d, out);
  const total = Math.min(10, Number((p1.d.paginacao || {}).total_de_paginas || 1));
  const resto = await Promise.all(Array.from({ length: total - 1 }, (_, i) => cv('GET', MAPA(emp, i + 2))));
  for (const r of resto) {
    if (!r.ok) throw erro(502, `mapa de disponibilidade: ${r.status} ${msgCv(r.d)}`);
    lerMapa(r.d, out);
  }
  cacheMapa = { t: Date.now(), v: out };
  return out;
}
async function unidadeAgora(lote) {            // situação de um lote agora: só a quadra dele, se já se sabe qual é
  const { emp } = cfg();
  const conhecida = cacheMapa.v && cacheMapa.v.get(lote);
  if (conhecida && conhecida.bloco) {
    const r = await cv('GET', MAPA(emp, 1, conhecida.bloco));
    if (r.ok) {
      const out = new Map();
      lerMapa(r.d, out);
      if (out.has(lote)) return out.get(lote);
    }
  }
  return (await mapa()).get(lote);
}

let cacheTab = { t: 0, v: null };
async function tabelas() {
  if (cacheTab.v && Date.now() - cacheTab.t < 10 * 60e3) return cacheTab.v;
  const { emp } = cfg();
  const { ok, status, d } = await cv('GET', `/v1/cadastros/empreendimentos/${emp}/tabelasdepreco/detalhada?aprovado=S&tabelasemjson=true&resetar=S`);
  if (!ok || !Array.isArray(d.tabelas)) throw erro(502, `tabelas de preço: ${status} ${msgCv(d)}`);
  const lista = [], porLote = new Map();
  for (const tb of d.tabelas) {
    lista.push({ id: tb.idtabela, nome: limpa(tb.tabela, 80) });
    for (const x of tb.dados || []) {
      const id = idLote(x);
      if (!id) continue;
      const p = porLote.get(id) || {};
      p[tb.idtabela] = [num(x.valor_total), (x.series || []).map((s) => [semAcento(s.nome), Number(s.qtd_parcelas) || 1, num(s.valor), String(s.data_vencimento || '')])];
      porLote.set(id, p);
    }
  }
  cacheTab = { t: Date.now(), v: { lista, porLote } };
  return cacheTab.v;
}

let cacheSeries = null;
async function idSerie(nome) {
  if (!cacheSeries) {
    const { ok, d } = await cv('GET', '/v1/comercial/seriestabeladepreco?registros_por_pagina=100');
    cacheSeries = ok ? (d.dados || []) : [];
  }
  const n = semAcento(nome);
  const s = cacheSeries.find((x) => semAcento(x.nome) === n || semAcento(x.sigla) === n);
  if (s) return s.idserie;
  return { SINAL: 7, MENSAL: 1 }[n] || null;     // ids do CV da Bracerum (conferidos em 2026-11-11)
}

/* ------------------------------------------------------------------ validação */
function cpfValido(c) {
  c = String(c || '').replace(/\D/g, '');
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  for (const n of [9, 10]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(c[i]) * (n + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(c[n])) return false;
  }
  return true;
}
function validar(b) {
  const v = {
    lote: limpa(b.lote, 12).toUpperCase(),
    tabela: Number(b.tabela) || cfg().tabela,
    nome: limpa(b.nome, 120),
    email: limpa(b.email, 120).toLowerCase(),
    ddi: String(b.ddi || '55').replace(/\D/g, '').slice(0, 4) || '55',
    tel: String(b.telefone || '').replace(/\D/g, '').replace(/^0+/, ''),
    empresa: limpa(b.empresa, 120),
    cpf: String(b.cpf || '').replace(/\D/g, ''),
    obs: limpa(b.obs, 600),
  };
  const campos = [];
  if (!/^Q\d{2}\.L\d{3}$/.test(v.lote)) campos.push('lote');
  if (v.nome.split(' ').filter((p) => p.length > 0).length < 2) campos.push('nome');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) campos.push('email');
  if (v.tel.length < 8 || v.tel.length > 13) campos.push('telefone');
  if (v.empresa.length < 2) campos.push('empresa');
  if (!cpfValido(v.cpf)) campos.push('cpf');
  if (campos.length) throw erro(422, 'Campos inválidos', { campos });
  return v;
}

/* ------------------------------------------------------------------ ações */
async function estado() {
  const [m, t] = await Promise.all([mapa(), tabelas()]);
  const lotes = {};
  for (const [id, x] of m) lotes[id] = { u: x.u, s: x.s, p: t.porLote.get(id) || null };
  return { atualizado: new Date().toISOString(), tabelas: t.lista, padrao: cfg().tabela, lotes };
}

async function acharCliente(cpf) {
  const { ok, d } = await cv('GET', `/v1/cadastros/clientes?documento=${cpf}`);
  const p = ok && Array.isArray(d.pessoas) ? d.pessoas.find((x) => String(x.documento || '').replace(/\D/g, '') === cpf) || d.pessoas[0] : null;
  return p ? p.idpessoa || p.idpessoa_cv : null;
}

async function acharReserva(cpf, idunidade) {
  const { emp } = cfg();
  const { ok, d } = await cv('GET', `/v1/comercial/reservas?documento=${cpf}&idempreendimento=${emp}&situacao=todas&registros_por_pagina=50`);
  if (!ok || !d || typeof d !== 'object') return null;
  const lst = Object.entries(d).filter(([, r]) => r && r.unidade && Number(r.unidade.idunidade_cv) === Number(idunidade));
  lst.sort((a, b) => Number(b[0]) - Number(a[0]));
  return lst.length ? Number(lst[0][1].idproposta_cv || lst[0][0]) : null;
}

const dataBR = (d) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
// Segura o lote em negociação para o CPF: bloqueio temporário com "reservar a unidade para (doc)" e liberação
// automática em N dias (POST /v1/cadastros/empreendimentos/unidades/bloquear). Só aquela pessoa pode ser
// reservada nele no CV; para todo o resto (painel, maquete, LPs) o lote fica indisponível.
async function segurar(un, v, idlead, sessao) {
  const c = cfg();
  const ate = new Date(Date.now() + c.dias * 86400e3);
  const corpo = {
    idunidade: String(un.u), situacao: 'Bloqueada', motivo_bloqueio: c.motivo,
    descricao_motivo_bloqueio: limpa(`Em negociação na feira — ${v.nome} (${v.empresa}) — lead #${idlead || '-'}${sessao.quem ? ` — atendente ${sessao.quem}` : ''}`, 250),
    documento_bloqueio: v.cpf, data_desbloqueio: dataBR(ate), hora_desbloqueio: '23:59:00',
  };
  const r = await cv('POST', '/v1/cadastros/empreendimentos/unidades/bloquear', corpo);
  if (!r.ok) throw erro(502, `Não segurou o lote: ${msgCv(r.d)}`);
  return dataBR(ate);
}

async function reservar(b, sessao) {
  const c = cfg();
  const v = validar(b);
  const passos = [];
  const telefone = `+${v.ddi}${v.tel}`;

  // 1. a unidade está livre agora? (e de onde vêm as condições)
  const [un, t] = await Promise.all([unidadeAgora(v.lote), tabelas()]);
  if (!un) throw erro(404, `Lote ${v.lote} não encontrado no CV`);
  if (un.s) throw erro(409, `O lote ${v.lote} não está disponível no CV (${un.sit})`, { situacao: un.s });
  const preco = (t.porLote.get(v.lote) || {})[v.tabela];
  const tab = t.lista.find((x) => x.id === v.tabela);
  if (!preco || !tab) throw erro(422, 'Tabela de preço sem valor para esse lote', { campos: ['tabela'] });
  const [total, series] = preco;
  const condicoes = [];
  for (const [nome, q, valor, venc] of series) {
    const ids = await idSerie(nome);
    if (!ids) throw erro(502, `Série "${nome}" sem correspondência no CV`);
    condicoes.push({ idserie_cv: ids, quantidade_parcelas: q, valor_parcela: valor, primeiro_vencimento: venc, retirar_comissao: 'N' });
  }
  const resumoCond = series.map(([n, q, val, venc]) => `${q}× ${n.toLowerCase()} de US$ ${val.toLocaleString('pt-BR')} (1º venc. ${venc})`).join(' + ');
  const anotacao = [
    `Reserva feita no stand da feira pelo painel /admin${sessao.quem ? ` — atendente: ${sessao.quem}` : ''}.`,
    `Lote: LTIND.${v.lote} · Tabela: ${tab.nome} · Total US$ ${total.toLocaleString('pt-BR')}`,
    `Condição: ${resumoCond}`,
    `Empresa: ${v.empresa}`,
    v.obs && `Observações: ${v.obs}`,
  ].filter(Boolean).join('\n');

  if (b.teste === true) {
    return { teste: true, lote: v.lote, unidade: un.u, condicoes, anotacao, total, tabela: tab };
  }

  // 2. lead
  const lead = {
    nome: v.nome, email: v.email, telefone: v.tel, telefone_ddi: `+${v.ddi}`,
    documento_tipo: 'cpf', documento: v.cpf,
    idempreendimento: c.emp, idunidade: un.u, idimobiliaria: c.imobiliaria, idcorretor: c.corretor,
    origem: 'OP', midia: c.midia, conversao: limpa(`Reserva na feira — LTIND.${v.lote}`, 100), modulo: 'Admin feira',
    tags: ['feira', 'reserva-feira', v.lote], interacoes: [{ tipo: 'A', descricao: anotacao }],
  };
  let r = await cv('POST', '/v1/comercial/leads', lead);
  if (!r.ok && r.status === 400 && /alterar|elterar|existe|duplic/i.test(JSON.stringify(r.d))) r = await cv('POST', '/v1/comercial/leads', { ...lead, permitir_alteracao: true });
  if (!r.ok) throw erro(502, `Lead não cadastrado: ${msgCv(r.d)}`, { etapa: 'lead', passos });
  const idlead = r.d.idlead || r.d.id || (r.d.dados && r.d.dados.idlead) || null;
  passos.push({ etapa: 'lead', id: idlead });

  // 3. cliente
  let idpessoa = null, novo = false, idreserva = null;
  try {
    idpessoa = await acharCliente(v.cpf);
    if (!idpessoa) {
      r = await cv('POST', '/v1/cadastros/clientes', {
        idpessoa_int: `BPFEIRA-${v.cpf}`, nome: v.nome, documento_tipo: 'cpf', documento: v.cpf, email: v.email,
        telefone: v.tel, ddi_telefone: `+${v.ddi}`, celular: v.tel, ddi_celular: `+${v.ddi}`,
        trabalho_nome_empresa: v.empresa, observacoes: limpa(`Cadastrado na feira (lead ${idlead || '-'}), empresa ${v.empresa}`, 300),
      });
      if (!r.ok) throw erro(502, `Cliente não cadastrado: ${msgCv(r.d)}`, { etapa: 'cliente', passos, idlead });
      idpessoa = r.d.idpessoa_cv || r.d.idpessoa || await acharCliente(v.cpf);
      novo = true;
    }
    if (!idpessoa) throw erro(502, 'Cliente cadastrado, mas o CV não devolveu o id', { etapa: 'cliente', passos, idlead });
    passos.push({ etapa: 'cliente', id: idpessoa, novo });

    // 4. reserva
    r = await cv('POST', '/v1/comercial/reservas', {
      idpessoa_cv: idpessoa, idempreendimento_cv: c.emp, idunidade_cv: un.u, idcorretor_cv: c.corretor,
      idtabela: v.tabela, condicoes,
    });
    if (!r.ok) throw erro(r.status === 400 && /indispon/i.test(msgCv(r.d)) ? 409 : 502, `Reserva não criada: ${msgCv(r.d)}`, { etapa: 'reserva', passos, idlead, idpessoa });
    idreserva = r.d.idreserva || r.d.idreserva_cv || r.d.idproposta_cv || await acharReserva(v.cpf, un.u);
    passos.push({ etapa: 'reserva', id: idreserva });

  } catch (e) {
    // Cliente ou reserva recusados (ex.: permissão do perfil no CV). O lead já existe: em vez de deixar o lote
    // livre, segura-o em negociação para o CPF e devolve o motivo — a reserva é feita depois, no CV.
    if (e.status === 409) throw e;
    let ate;
    try { ate = await segurar(un, v, idlead, sessao); } catch (x) { e.message += ` · ${x.message}`; throw e; }
    passos.push({ etapa: 'negociacao', ate });
    console.log('[admin] negociação', JSON.stringify({ lote: v.lote, idlead, idpessoa, ate, motivo: e.message, quem: sessao.quem || null }));
    return { modo: 'negociacao', lote: v.lote, unidade: un.u, idlead, idpessoa, ate, aviso: e.message, total, tabela: tab, condicao: resumoCond, passos };
  }

  // 5. lead associado à reserva (situação "Com Reserva")
  let associado = false;
  if (idlead && idreserva) {
    const a = await cv('POST', '/v1/comercial/leads', { idlead, nome: v.nome, email: v.email, telefone: v.tel, permitir_alteracao: true, idreserva, idsituacao: 5 });
    associado = a.ok;
    if (!a.ok) console.error('[admin] associar lead à reserva:', a.status, msgCv(a.d));
  }
  console.log('[admin] reserva', JSON.stringify({ lote: v.lote, idlead, idpessoa, idreserva, quem: sessao.quem || null }));
  return { modo: 'reserva', lote: v.lote, unidade: un.u, idlead, idpessoa, cliente_novo: novo, idreserva, associado, total, tabela: tab, condicao: resumoCond };
}

async function reservas() {
  const { emp } = cfg();
  const { ok, status, d } = await cv('GET', `/v1/comercial/reservas?idempreendimento=${emp}&situacao=todas&registros_por_pagina=200`);
  if (!ok) throw erro(502, `reservas: ${status} ${msgCv(d)}`);
  const out = [];
  for (const [k, r] of Object.entries(d || {})) {
    if (!r || !r.unidade) continue;
    const id = idLote({ bloco: r.unidade.bloco, unidade: r.unidade.unidade });
    out.push({
      idreserva: Number(r.idproposta_cv || k), lote: id || `${r.unidade.bloco} ${r.unidade.unidade}`,
      situacao: (r.situacao || {}).situacao || '', idsituacao: (r.situacao || {}).idsituacao || null,
      cliente: (r.titular || {}).nome || '', email: (r.titular || {}).email || '', telefone: (r.titular || {}).telefone || '',
      corretor: (r.corretor || {}).corretor || '', idcorretor: (r.corretor || {}).idcorretor_cv || null,
      feira: Number((r.corretor || {}).idcorretor_cv) === cfg().corretor,
      total: num((r.condicoes || {}).valor_contrato), data: r.data || '',
    });
  }
  out.sort((a, b) => b.idreserva - a.idreserva);
  return { reservas: out };
}

async function negociacoes() {
  const m = await mapa();
  const out = [];
  for (const [lote, x] of m) {
    if (x.s !== 'n') continue;
    out.push({ lote, motivo: x.motivo, desde: x.desde, doc: x.doc.replace(/^(\d{3})\d{5}(\d{3})$/, '$1.***.**$2') });
  }
  return out.sort((a, b) => String(b.desde).localeCompare(String(a.desde)));
}

async function liberar(b) {
  const lote = limpa(b.lote, 12).toUpperCase();
  const un = (await mapa()).get(lote);
  if (!un) throw erro(404, `Lote ${lote} não encontrado`);
  if (un.s !== 'n') throw erro(409, `O lote ${lote} não está segurado em negociação (situação: ${un.sit})`);
  const r = await cv('POST', '/v1/cadastros/empreendimentos/unidades/bloquear', { idunidade: String(un.u), situacao: 'Disponivel' });
  if (!r.ok) throw erro(502, `Não liberou: ${msgCv(r.d)}`);
  console.log('[admin] liberou', lote);
  return { lote };
}

async function cancelar(b) {
  const id = Number(b.idreserva);
  if (!id) throw erro(422, 'idreserva');
  const lst = (await reservas()).reservas;
  const r = lst.find((x) => x.idreserva === id);
  if (!r) throw erro(404, 'Reserva não encontrada no loteamento');
  if (Number(r.idcorretor) !== cfg().corretor) throw erro(403, 'Só dá para cancelar aqui as reservas feitas na feira');
  if (/cancel|vendid|distrato/i.test(r.situacao)) throw erro(409, `A reserva já está "${r.situacao}"`);
  const x = await cv('POST', '/v1/comercial/reservas/cancelar-reserva', { idreserva_cv: String(id) });
  if (!x.ok) throw erro(502, `Não cancelou: ${msgCv(x.d)}`);
  console.log('[admin] cancelou', id, r.lote);
  return { idreserva: id, lote: r.lote };
}

/* ------------------------------------------------------------------ handler */
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  const fim = (status, obj) => { res.statusCode = status; res.end(JSON.stringify(obj)); };
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return fim(405, { ok: false, erro: 'método' }); }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return fim(400, { ok: false, erro: 'corpo' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip';
  try {
    if (b.acao === 'login') {
      if (!process.env.ADMIN_SENHA) return fim(503, { ok: false, erro: 'ADMIN_SENHA não configurada' });
      if (bloqueado(ip)) return fim(429, { ok: false, erro: 'Muitas tentativas. Espere 10 minutos.' });
      if (!senhaOk(b.senha)) {
        tentativas.get(ip).push(Date.now());
        await new Promise((r) => setTimeout(r, 700));
        return fim(401, { ok: false, erro: 'Senha incorreta' });
      }
      const quem = limpa(b.quem, 40);
      return fim(200, { ok: true, quem, ...emitir(quem) });
    }
    const sessao = conferir(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
    if (!sessao) return fim(401, { ok: false, erro: 'sessão', sair: true });

    if (b.acao === 'estado') return fim(200, { ok: true, ...(await estado()) });
    if (b.acao === 'reservar') return fim(200, { ok: true, ...(await reservar(b, sessao)) });
    if (b.acao === 'reservas') {
      const [r, n] = await Promise.allSettled([reservas(), negociacoes()]);   // uma lista não derruba a outra
      if (r.status === 'rejected' && n.status === 'rejected') throw r.reason;
      return fim(200, { ok: true, reservas: r.status === 'fulfilled' ? r.value.reservas : null, negociacoes: n.status === 'fulfilled' ? n.value : null,
        avisos: [r, n].filter((x) => x.status === 'rejected').map((x) => x.reason.message) });
    }
    if (b.acao === 'liberar') return fim(200, { ok: true, ...(await liberar(b)) });
    if (b.acao === 'cancelar') return fim(200, { ok: true, ...(await cancelar(b)) });
    return fim(400, { ok: false, erro: 'ação' });
  } catch (e) {
    console.error('[admin]', b.acao, e.status || 500, e.message);
    const { status = 500, message, campos, etapa, passos, idlead, idpessoa, situacao } = e;
    return fim(status, { ok: false, erro: message, campos, etapa, passos, idlead, idpessoa, situacao });
  }
};

module.exports.cpfValido = cpfValido;
module.exports.validar = validar;
