/*
  Testes das regras críticas do Portal do Corretor (critérios de aceite do briefing, §10).
  Rodam o handler real (api/portal.js) com o Vercel Blob e o CV CRM SIMULADOS em memória —
  nenhum dado comercial real é lido ou gravado. Rodar:  npm test   (ou  node --test tests/)
*/
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const crypto = require('crypto');
const { Writable } = require('stream');

const RAIZ = path.join(__dirname, '..');
process.chdir(RAIZ);
Object.assign(process.env, {
  BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_teste1234_naoreal', PORTAL_CONVITE: 'chave-de-teste', PORTAL_ADMINS: 'gestor@teste.dev',
  PORTAL_SEGREDO: 'sessao-de-teste', PORTAL_FUSO: 'America/Asuncion', PORTAL_SYNC_MIN: '5', PORTAL_DADOS_MAX_MIN: '60',
  PORTAL_PEDIDOS_CORRETOR: '1',   // os testes antigos do fluxo usam o corretor; o bloqueio padrão tem teste próprio
});

/* ---------- Blob em memória */
const store = new Map();
const blobPath = require.resolve('@vercel/blob', { paths: [RAIZ] });
require.cache[blobPath] = { id: blobPath, filename: blobPath, loaded: true, exports: {
  async put(p, body) { store.set(p, Buffer.isBuffer(body) ? body : Buffer.from(String(body))); return { pathname: p }; },
  async get(p) { if (!store.has(p)) return null; return { stream: new Blob([store.get(p)]).stream(), blob: { contentType: 'application/octet-stream', size: store.get(p).length } }; },
  async list({ prefix }) { return { blobs: [...store.keys()].filter((k) => k.startsWith(prefix)).map((k) => ({ pathname: k })), hasMore: false }; },
  async del(p) { store.delete(p); },
} };
/* ---------- CV simulado (situação dos lotes) */
const CV = { falhar: false, lotes: { 'Q07.L014': 'r', 'Q24.L001': 'b' } };
const lsPath = require.resolve(path.join(RAIZ, 'api/lotes-status.js'));
require.cache[lsPath] = { id: lsPath, filename: lsPath, loaded: true, exports: {
  async lerCV() { if (CV.falhar) throw new Error('CV indisponível (simulado)'); return { total: 614, lotes: { ...CV.lotes }, desconhecidas: [] }; },
} };

const handler = require(path.join(RAIZ, 'api/portal.js'));
const R = require(path.join(RAIZ, 'api/_portal-regras.js'));

/* ---------- cliente de teste */
function resFalso() {
  const partes = [];
  const r = new Writable({ write(c, _e, cb) { partes.push(Buffer.from(c)); cb(); } });
  r.headers = {}; r.statusCode = 200;
  r.setHeader = (k, v) => { r.headers[k.toLowerCase()] = v; };
  const fimOrig = r.end.bind(r);
  r.pronto = new Promise((ok) => r.on('finish', ok));
  r.end = (c) => { if (c) partes.push(Buffer.from(c)); return fimOrig(); };
  r.corpo = () => Buffer.concat(partes).toString();
  return r;
}
async function post(acao, dados = {}, cookie = '') {
  const req = { method: 'POST', url: '/api/portal', headers: { 'content-type': 'application/json', cookie, 'x-forwarded-for': '10.0.0.' + Math.floor(Math.random() * 250), host: 'teste.local' }, body: { acao, ...dados } };
  const res = resFalso();
  await handler(req, res); await res.pronto;
  const sc = res.headers['set-cookie'];
  return { status: res.statusCode, json: JSON.parse(res.corpo() || '{}'), cookie: sc && /bp_portal=([^;]*)/.test(sc) ? `bp_portal=${sc.match(/bp_portal=([^;]*)/)[1]}` : null };
}
async function get(query, cookie = '') {
  const req = { method: 'GET', url: '/api/portal?' + query, headers: { cookie, host: 'teste.local' } };
  const res = resFalso();
  await handler(req, res); await res.pronto;
  return { status: res.statusCode, corpo: res.corpo(), headers: res.headers };
}
const token = (email) => `${Buffer.from(email).toString('base64url')}.${crypto.createHmac('sha256', 'chave-de-teste').update(`convite|${email}`).digest('hex').slice(0, 32)}`;
const tokenDoLink = (link) => link.split('#/convite/')[1];
async function ativar(link, nome, senha = 'senha-forte-1') {
  const r = await post('convite', { token: tokenDoLink(link), nome, senha });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  return r.cookie;
}
const local = (ms) => R.utcParaLocal(new Date(ms).toISOString());

/* ---------- cenário compartilhado */
const C = {};
test.before(async () => {
  const r = await post('convite', { token: token('gestor@teste.dev'), nome: 'Gestora Um', senha: 'senha-forte-1' });
  assert.equal(r.status, 200);
  C.gestor = r.cookie;
  const imob = await post('imobiliariaSalvar', { nome: 'Imobiliária Central' }, C.gestor);
  C.imobId = imob.json.itens[0].id;
  const a = await post('contaCriar', { papel: 'corretor', nome: 'Ana Corretora', email: 'ana@teste.dev', ddi: '55', tel: '41999990000', imobiliariaId: C.imobId }, C.gestor);
  const b = await post('contaCriar', { papel: 'corretor', nome: 'Bruno Corretor', email: 'bruno@teste.dev', ddi: '55', tel: '41999990001', imobiliaria: 'Autônomo' }, C.gestor);
  C.anaId = a.json.conta.id; C.brunoId = b.json.conta.id;
  C.ana = await ativar(a.json.link, 'Ana Corretora');
  C.bruno = await ativar(b.json.link, 'Bruno Corretor');
});

/* ================================================================ contas e permissões */
test('não existe cadastro público nem senha compartilhada', async () => {
  assert.equal((await post('cadastro', { email: 'x@y.dev', senha: '12345678' })).status, 403);
  assert.equal((await post('equipe', { nome: 'x', senha: 'qualquer' })).status, 403);
  assert.equal((await post('contaCriar', { email: 'x@y.dev', nome: 'X Y' })).status, 401, 'anônimo não cria conta');
  assert.equal((await post('conviteVer', { token: token('estranho@teste.dev') })).status, 403, 'link para e-mail sem conta e fora de PORTAL_ADMINS');
});

test('só o gestor cria contas e altera perfis, inclusive por chamada direta', async () => {
  assert.equal((await post('contaCriar', { papel: 'equipe', nome: 'Hacker X', email: 'h@teste.dev' }, C.ana)).status, 403);
  assert.equal((await post('contaAtualizar', { id: C.anaId, papel: 'equipe' }, C.ana)).status, 403);
  assert.equal((await post('contaAtualizar', { id: C.brunoId, status: 'bloqueado' }, C.ana)).status, 403);
  const eu = await post('eu', {}, C.ana);
  assert.equal(eu.json.usuario.papel, 'corretor');
  // o gestor não mexe na própria conta
  const g = await post('eu', {}, C.gestor);
  assert.equal((await post('contaAtualizar', { id: g.json.usuario.id, status: 'excluido' }, C.gestor)).status, 409);
});

test('bloquear derruba a sessão já aberta; reativar exige novo login', async () => {
  const c = await post('contaCriar', { papel: 'corretor', nome: 'Carla Teste', email: 'carla@teste.dev', ddi: '55', tel: '41999990002', imobiliaria: 'Autônomo' }, C.gestor);
  const sess = await ativar(c.json.link, 'Carla Teste');
  assert.equal((await post('eu', {}, sess)).status, 200);
  await post('contaAtualizar', { id: c.json.conta.id, status: 'bloqueado' }, C.gestor);
  assert.equal((await post('eu', {}, sess)).status, 401, 'sessão antiga recusada');
  assert.equal((await post('entrar', { email: 'carla@teste.dev', senha: 'senha-forte-1' })).status, 403);
});

test('trocar o papel derruba a sessão emitida com o papel antigo', async () => {
  const c = await post('contaCriar', { papel: 'corretor', nome: 'Davi Teste', email: 'davi@teste.dev', ddi: '55', tel: '41999990003', imobiliaria: 'Autônomo' }, C.gestor);
  const sess = await ativar(c.json.link, 'Davi Teste');
  await post('contaAtualizar', { id: c.json.conta.id, papel: 'equipe' }, C.gestor);
  assert.equal((await post('eu', {}, sess)).status, 401);
  const novo = await post('entrar', { email: 'davi@teste.dev', senha: 'senha-forte-1' });
  assert.equal(novo.json.usuario.papel, 'equipe');
});

test('exclusão é lógica: acesso some, conta e histórico ficam', async () => {
  const c = await post('contaCriar', { papel: 'corretor', nome: 'Edu Teste', email: 'edu@teste.dev', ddi: '55', tel: '41999990004', imobiliaria: 'Autônomo' }, C.gestor);
  const sess = await ativar(c.json.link, 'Edu Teste');
  const p = await post('pedido', { material: 'post', formato: 'digital', descricao: 'Post com meus dados de contato' }, sess);
  assert.equal(p.status, 200);
  assert.equal((await post('contaRemover', { id: c.json.conta.id }, C.gestor)).status, 200);
  assert.equal((await post('eu', {}, sess)).status, 401);
  assert.equal((await post('entrar', { email: 'edu@teste.dev', senha: 'senha-forte-1' })).status, 401);
  const contas = (await post('contas', {}, C.gestor)).json.contas;
  assert.equal(contas.find((x) => x.email === 'edu@teste.dev').status, 'excluido');
  const peds = (await post('pedidos', {}, C.gestor)).json.pedidos;
  assert.ok(peds.some((x) => x.id === p.json.pedido.id && x.corretor.nome === 'Edu Teste'), 'solicitação preservada');
  assert.equal((await post('contaCriar', { papel: 'corretor', nome: 'Edu Teste', email: 'edu@teste.dev', ddi: '55', tel: '41999990004', imobiliaria: 'Autônomo' }, C.gestor)).status, 409);
});

test('nunca fica sem gestor ativo', async () => {
  // o único caminho para tirar o último gestor seria ele mesmo — e isso é recusado
  const g = await post('eu', {}, C.gestor);
  assert.equal((await post('contaAtualizar', { id: g.json.usuario.id, papel: 'corretor' }, C.gestor)).status, 409);
  assert.equal((await post('contaRemover', { id: g.json.usuario.id }, C.gestor)).status, 409);
});

test('imobiliária com corretor vinculado não é excluída; pode ser arquivada', async () => {
  assert.equal((await post('imobiliariaExcluir', { id: C.imobId }, C.gestor)).status, 409);
  const arq = await post('imobiliariaArquivar', { id: C.imobId, arquivar: true }, C.gestor);
  assert.equal(arq.json.itens.find((x) => x.id === C.imobId).status, 'arquivada');
  const contas = (await post('contas', {}, C.gestor)).json.contas;
  assert.equal(contas.find((x) => x.id === C.anaId).imobiliariaId, C.imobId, 'vínculo preservado');
  await post('imobiliariaArquivar', { id: C.imobId, arquivar: false }, C.gestor);
  const solta = await post('imobiliariaSalvar', { nome: 'Sem Vínculo Ltda' }, C.gestor);
  const id = solta.json.itens.find((x) => x.nome === 'Sem Vínculo Ltda').id;
  assert.equal((await post('imobiliariaExcluir', { id }, C.gestor)).status, 200);
  assert.equal((await post('imobiliarias', {}, C.ana)).status, 403);
});

/* ================================================================ solicitações e anexos */
test('corretor não vê nem mexe em solicitação/anexo de outro (troca de id)', async () => {
  const png = Buffer.from('89504e470d0a1a0a', 'hex').toString('base64');
  const p = await post('pedido', { material: 'folder', formato: 'impresso', descricao: 'Folder A5 para a feira', status: 'concluida', responsavel: { id: 'x' }, corretor: { id: C.brunoId } }, C.ana);
  assert.equal(p.json.pedido.status, 'enviada', 'campos extras do cliente ignorados');
  assert.equal(p.json.pedido.responsavel, null);
  assert.equal(p.json.pedido.corretor.id, C.anaId);
  const id = p.json.pedido.id;
  const an = await post('anexo', { pedido: id, nome: 'ex.png', tipo: 'image/png', dados: png }, C.ana);
  const cam = an.json.pedido.anexos[0].caminho;
  assert.equal((await post('pedidoMensagem', { id, texto: 'oi' }, C.bruno)).status, 404);
  assert.equal((await post('anexo', { pedido: id, nome: 'x.png', tipo: 'image/png', dados: png }, C.bruno)).status, 404);
  assert.equal((await post('pedidoCancelar', { id }, C.bruno)).status, 404);
  assert.equal((await get('anexo=' + encodeURIComponent(cam), C.bruno)).status, 404);
  assert.equal((await get('anexo=' + encodeURIComponent(cam))).status, 404, 'sem sessão');
  assert.equal((await get('anexo=' + encodeURIComponent(cam), C.ana)).status, 200);
  assert.equal((await get('anexo=' + encodeURIComponent(cam), C.gestor)).status, 200);
  assert.ok(!(await post('pedidos', {}, C.bruno)).json.pedidos.some((x) => x.id === id));
  assert.equal((await post('pedidoAtualizar', { id, status: 'concluida' }, C.ana)).status, 403);
});

test('solicitação: etapas, responsável, mensagens e histórico consistentes', async () => {
  const p = await post('pedido', { material: 'story', formato: 'digital', descricao: 'Story com os lotes da Q38' }, C.ana);
  const id = p.json.pedido.id;
  const ges = (await post('gestores', {}, C.gestor)).json.gestores;
  let r = await post('pedidoAtualizar', { id, status: 'analise', responsavelId: ges[0].id }, C.gestor);
  assert.equal(r.json.pedido.status, 'analise');
  assert.equal(r.json.pedido.responsavel.id, ges[0].id);
  assert.equal((await post('pedidoAtualizar', { id, responsavelId: C.anaId }, C.gestor)).status, 422, 'corretor não pode ser responsável');
  await post('pedidoMensagem', { id, texto: 'Pode usar a foto do galpão?' }, C.ana);
  r = await post('pedidoMensagem', { id, texto: 'Pode sim.' }, C.gestor);
  assert.deepEqual(r.json.pedido.mensagens.map((m) => m.autor.papel), ['corretor', 'equipe']);
  r = await post('pedidoAtualizar', { id, status: 'producao' }, C.gestor);
  r = await post('pedidoAtualizar', { id, status: 'concluida', entrega: 'https://drive.google.com/x' }, C.gestor);
  assert.equal(r.json.pedido.status, 'concluida');
  assert.deepEqual(r.json.pedido.historico.filter((h) => h.campo === 'status').map((h) => h.para), ['analise', 'producao', 'concluida']);
  assert.equal((await post('pedidoAtualizar', { id, status: 'producao' }, C.gestor)).status, 409, 'concluída não reabre');
  assert.equal((await post('pedidoMensagem', { id, texto: 'mais uma' }, C.ana)).status, 409);
  assert.equal((await post('pedidoCancelar', { id }, C.ana)).status, 409);
});

test('padrão: corretor não vê nem cria solicitação; o gestor continua vendo tudo', async () => {
  const antes = await post('pedido', { material: 'post', formato: 'digital', descricao: 'Criada enquanto liberado' }, C.ana);
  assert.equal(antes.status, 200);
  const id = antes.json.pedido.id;
  delete process.env.PORTAL_PEDIDOS_CORRETOR;
  try {
    assert.equal((await post('pedidos', {}, C.ana)).status, 403, 'listar');
    assert.equal((await post('pedido', { material: 'post', formato: 'digital', descricao: 'Tentativa bloqueada' }, C.ana)).status, 403, 'criar');
    assert.equal((await post('pedidoMensagem', { id, texto: 'oi' }, C.ana)).status, 403, 'mensagem');
    assert.equal((await post('pedidoCancelar', { id }, C.ana)).status, 403, 'cancelar');
    assert.equal((await post('anexo', { pedido: id, nome: 'a.png', tipo: 'image/png', dados: 'AAAA' }, C.ana)).status, 403, 'anexo');
    const g = await post('pedidos', {}, C.gestor);
    assert.equal(g.status, 200);
    assert.ok(g.json.pedidos.some((p) => p.id === id), 'gestor vê a solicitação');
    assert.equal((await post('pedidoMensagem', { id, texto: 'Seguimos por aqui' }, C.gestor)).status, 200, 'gestor responde');
  } finally { process.env.PORTAL_PEDIDOS_CORRETOR = '1'; }
});

test('etapas antigas são lidas no fluxo novo', () => {
  assert.equal(R.statusPedido('recebido'), 'enviada');
  assert.equal(R.statusPedido('entregue'), 'concluida');
  assert.equal(R.statusPedido('cancelado'), 'cancelada');
  assert.equal(R.transicaoValida('recebido', 'analise'), true);
  assert.equal(R.transicaoValida('cancelado', 'enviada'), false);
});

/* ================================================================ dados comerciais e sincronização */
test('falha de sincronização não atualiza o último sucesso e fica sinalizada', () => {
  const t0 = Date.parse('2026-11-18T12:00:00Z');
  const ok = R.registrarSync(null, { ok: true, total: 614, lotes: { 'Q01.L001': 'v' }, em: t0 });
  const falha = R.registrarSync(ok, { ok: false, erro: 'timeout', em: t0 + 30 * 60e3 });
  assert.equal(falha.ultimoSucesso, ok.ultimoSucesso);
  assert.equal(falha.resultado, 'erro');
  assert.equal(falha.lotes['Q01.L001'], 'v', 'situações anteriores preservadas, não misturadas');
  assert.equal(R.estadoSync(falha, t0 + 30 * 60e3), 'atual');
  assert.equal(R.estadoSync(falha, t0 + 61 * 60e3), 'desatualizado');
  assert.equal(R.estadoSync(null), 'indisponivel');
  assert.equal(R.situacaoDe('Q01.L001', null), 'desconhecida');
});

test('mapa e tabela usam a mesma unidade e a mesma referência comercial', async () => {
  const c = (await post('comercial', {}, C.ana)).json;
  const u = c.unidades.find((x) => x.id === 'Q07.L014');
  assert.ok(u && u.a > 0 && u.cat, 'unidade com área e categoria');
  assert.equal(u.situacao, 'reservado', 'situação do CV pelo mesmo id da maquete');
  assert.equal(c.fonte.precos.moeda, 'USD');
  assert.equal(c.sync.resultado, 'ok');
  const p = R.precoLote(u, require(path.join(RAIZ, '3dmasterplan/data/precos.json')), { janela: 'pos' });
  assert.equal(p.total, p.m2 * u.a);
});

/* ================================================================ ofertas e cards */
test('vigência: início inclusivo, fim exclusivo, no fuso comercial', () => {
  const inicio = R.localParaUTC('2026-12-01T00:00'), fim = R.localParaUTC('2026-12-31T23:59');
  assert.equal(inicio, '2026-12-01T03:00:00.000Z', 'Assunção = UTC−3');
  assert.equal(R.localParaUTC('2026-12-01T00:00:00Z'), '2026-12-01T00:00:00.000Z', 'ISO com fuso explícito não é reconvertido');
  assert.equal(R.localParaUTC('2026-12-01T00:00-03:00'), '2026-12-01T03:00:00.000Z');
  assert.equal(R.localParaUTC('ontem'), null);
  const unidades = new Map([['Q01.L001', { id: 'Q01.L001', a: 1250, cat: 'P' }]]);
  const snap = R.registrarSync(null, { ok: true, total: 1, lotes: {}, em: Date.parse(fim) - 10 * 60e3 });
  const o = { status: 'publicada', inicio, fim, unidades: ['Q01.L001'] };
  assert.equal(R.elegibilidade(o, { snap, unidades, agora: Date.parse(inicio) - 1 }).motivo, 'ainda_nao_comecou');
  assert.equal(R.elegibilidade(o, { snap, unidades, agora: Date.parse(fim) - 1 }).ok, true);
  assert.equal(R.elegibilidade(o, { snap, unidades, agora: Date.parse(fim) }).motivo, 'expirada', 'expira no instante exato do fim');
  assert.equal(R.elegibilidade({ ...o, status: 'rascunho' }, { snap, unidades, agora: Date.parse(fim) - 1 }).ok, false);
  assert.equal(R.elegibilidade({ ...o, status: 'encerrada' }, { snap, unidades, agora: Date.parse(fim) - 1 }).motivo, 'encerrada');
  const reservado = R.registrarSync(null, { ok: true, total: 1, lotes: { 'Q01.L001': 'r' }, em: Date.parse(fim) - 10 * 60e3 });
  assert.equal(R.elegibilidade(o, { snap: reservado, unidades, agora: Date.parse(fim) - 1 }).motivo, 'unidade_reservado');
  const velho = R.registrarSync(null, { ok: true, total: 1, lotes: {}, em: Date.parse(fim) - 5 * 3600e3 });
  assert.equal(R.elegibilidade(o, { snap: velho, unidades, agora: Date.parse(fim) - 1 }).motivo, 'dados_comerciais_desatualizados');
});

test('oferta só aparece e só gera card quando publicada, vigente e elegível', async () => {
  const agoraMs = Date.now();
  const base = { titulo: 'Lote de esquina na Q01', condicoes: '20% de sinal e 12 parcelas. Sujeito à disponibilidade.', unidades: 'Q01.L001', valor: '150000', campanha: 'Pós-Expo' };
  let r = await post('ofertaSalvar', { ...base, inicio: local(agoraMs - 3600e3), fim: local(agoraMs + 3600e3) }, C.gestor);
  assert.equal(r.status, 200, JSON.stringify(r.json));
  const of = r.json.ofertas[0];
  assert.equal(of.status, 'rascunho');
  assert.equal(of.moeda, 'USD');
  assert.ok(!(await post('ofertas', {}, C.ana)).json.ofertas.some((x) => x.id === of.id), 'rascunho escondido do corretor');
  assert.equal((await get('card=' + of.id, C.ana)).status, 410, 'download direto de rascunho recusado');
  await post('ofertaStatus', { id: of.id, status: 'publicada' }, C.gestor);
  assert.ok((await post('ofertas', {}, C.ana)).json.ofertas.some((x) => x.id === of.id));
  const card = await get('card=' + of.id, C.ana);
  assert.equal(card.status, 200);
  assert.match(card.corpo, /Válida até/);
  assert.match(card.corpo, /US\$ 150\.000/);
  assert.match(card.corpo, /horário de Assunção/);
  // retirada: some e o download direto é recusado
  await post('ofertaStatus', { id: of.id, status: 'encerrada' }, C.gestor);
  assert.equal((await get('card=' + of.id, C.ana)).status, 410);
  // expirada
  r = await post('ofertaSalvar', { ...base, titulo: 'Oferta vencida', inicio: local(agoraMs - 7200e3), fim: local(agoraMs - 120e3) }, C.gestor);
  const venc = r.json.ofertas.find((x) => x.titulo === 'Oferta vencida');
  assert.equal((await post('ofertaStatus', { id: venc.id, status: 'publicada' }, C.gestor)).status, 422);
  // unidade reservada no CV
  r = await post('ofertaSalvar', { ...base, titulo: 'Lote reservado', unidades: 'Q07.L014', inicio: local(agoraMs - 3600e3), fim: local(agoraMs + 3600e3) }, C.gestor);
  const res = r.json.ofertas.find((x) => x.titulo === 'Lote reservado');
  await post('ofertaStatus', { id: res.id, status: 'publicada' }, C.gestor);
  assert.equal((await get('card=' + res.id, C.ana)).status, 410);
  assert.equal((await post('ofertas', {}, C.gestor)).json.ofertas.find((x) => x.id === res.id).elegibilidade.motivo, 'unidade_reservado');
  // unidade inexistente e valor inválido
  assert.equal((await post('ofertaSalvar', { ...base, unidades: 'Q99.L999', inicio: local(agoraMs), fim: local(agoraMs + 3600e3) }, C.gestor)).status, 422);
  assert.equal((await post('ofertaSalvar', { ...base, valor: '12,345', inicio: local(agoraMs), fim: local(agoraMs + 3600e3) }, C.gestor)).status, 422);
  assert.equal((await post('ofertaSalvar', base, C.ana)).status, 403);
});

/* ================================================================ materiais e tutoriais */
test('corretor recebe só material publicado e só a versão vigente', async () => {
  store.set('portal/m/f/aaaaaaaaaa-v1.pdf', Buffer.from('%PDF v1'));
  store.set('portal/m/f/bbbbbbbbbb-v2.pdf', Buffer.from('%PDF v2'));
  let r = await post('materialSalvar', { titulo: 'Apresentação 2026', tipo: 'apresentacao', caminho: 'portal/m/f/aaaaaaaaaa-v1.pdf', conteudo: 'application/pdf', kb: 1 }, C.gestor);
  const id = r.json.itens[0].id;
  assert.equal(r.json.itens[0].status, 'rascunho');
  assert.ok(!(await post('materiais', {}, C.ana)).json.itens.some((x) => x.id === id), 'rascunho escondido');
  assert.equal((await get('material=' + encodeURIComponent('portal/m/f/aaaaaaaaaa-v1.pdf'), C.ana)).status, 404);
  await post('materialStatus', { id, status: 'publicado' }, C.gestor);
  assert.equal((await get('material=' + encodeURIComponent('portal/m/f/aaaaaaaaaa-v1.pdf'), C.ana)).status, 200);
  await post('materialVersao', { id, caminho: 'portal/m/f/bbbbbbbbbb-v2.pdf', conteudo: 'application/pdf', kb: 1 }, C.gestor);
  const visto = (await post('materiais', {}, C.ana)).json.itens.find((x) => x.id === id);
  assert.equal(visto.versoes.length, 1);
  assert.equal(visto.versoes[0].caminho, 'portal/m/f/bbbbbbbbbb-v2.pdf');
  assert.equal((await get('material=' + encodeURIComponent('portal/m/f/aaaaaaaaaa-v1.pdf'), C.ana)).status, 404, 'versão antiga não sai para o corretor');
  assert.equal((await get('material=' + encodeURIComponent('portal/m/f/aaaaaaaaaa-v1.pdf'), C.gestor)).status, 200, 'histórico preservado para o gestor');
  await post('materialStatus', { id, status: 'arquivado' }, C.gestor);
  assert.equal((await get('material=' + encodeURIComponent('portal/m/f/bbbbbbbbbb-v2.pdf'), C.ana)).status, 404);
  assert.equal((await post('materialSalvar', { titulo: 'x', link: 'https://a.b' }, C.ana)).status, 403);
  assert.equal((await post('arquivoToken', { nome: 'a.pdf' }, C.ana)).status, 403);
  assert.equal((await post('arquivoToken', { nome: 'a.html', tipo: 'text/html' }, C.gestor)).status, 415, 'conteúdo ativo recusado');
});

test('tutoriais respeitam publicação e são administrados pelo gestor', async () => {
  let r = await post('tutorialSalvar', { titulo: 'Como reservar no CV', tipo: 'texto', corpo: 'Passo a passo da reserva no painel do corretor.' }, C.gestor);
  const id = r.json.itens.find((x) => x.titulo === 'Como reservar no CV').id;
  assert.ok(!(await post('tutoriais', {}, C.ana)).json.itens.some((x) => x.id === id));
  await post('tutorialStatus', { id, status: 'publicado' }, C.gestor);
  assert.ok((await post('tutoriais', {}, C.ana)).json.itens.some((x) => x.id === id));
  assert.equal((await post('tutorialSalvar', { titulo: 'x y z', tipo: 'texto', corpo: '0123456789ab' }, C.ana)).status, 403);
  await post('tutorialOcultar', { chave: 'parque', ocultar: true }, C.gestor);
  assert.ok((await post('tutoriais', {}, C.ana)).json.ocultos.includes('parque'));
});

test('auditoria registra quem fez o quê, sem segredos', async () => {
  const ev = (await post('auditoria', {}, C.gestor)).json.eventos;
  assert.ok(ev.some((e) => e.acao === 'conta.criada'));
  assert.ok(ev.some((e) => e.acao === 'oferta.card_baixado'));
  assert.ok(!JSON.stringify(ev).match(/senha-forte|"h":|"sal":/));
  assert.equal((await post('auditoria', {}, C.ana)).status, 403);
});

test('CV fora do ar: tentativa registrada como erro, último sucesso intacto', async () => {
  const antes = (await post('comercial', {}, C.gestor)).json.sync;
  CV.falhar = true;
  const depois = (await post('sincronizar', {}, C.gestor)).json.sync;
  CV.falhar = false;
  assert.equal(depois.resultado, 'erro');
  assert.equal(depois.ultimoSucesso, antes.ultimoSucesso);
  assert.match(depois.erro, /simulado/);
});
