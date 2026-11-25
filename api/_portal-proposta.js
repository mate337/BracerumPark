'use strict';
/*
  Proposta comercial em PDF do Portal do Corretor (2026-11-25).

  A maquete 3D aberta pelo portal (/3dmasterplan/?corretor=1) manda { tipo, ids, janela, pagamento, cliente,
  idioma, imagem }; o api/portal.js confere a sessão e chama:
    montarProposta(...)  → os números (pura, testada): unidades, valores por condição e, nos lotes, por janela;
    gerarPDF(modelo, ...) → o PDF (pdfkit), no estilo das tabelas de preço (faixa escura, dourado, Caladea + Carlito).
  Os valores NUNCA vêm do navegador: lotes pela Tabela v3.1 (3dmasterplan/data/precos.json, a mesma regra da
  maquete e da tabela pública: m² da categoria × faixa de quantidade × pagamento × área de contrato; sinal de
  20%) e lojas do Outlet pela tabela aprovada do CV (retrato portal/sync/tabelas.json: total, sinal e parcelas
  exatos de cada loja). Unidade reservada/vendida/bloqueada no último retrato do CV não entra (erro 409).
*/
const path = require('path');

const PAG = { '12x': 0, vista: 1, '36x': 2 };
const NP = { vista: 0, '12x': 12, '36x': 36 };
const CONDS = ['vista', '12x', '36x'];
const erro = (status, msg, extra) => Object.assign(new Error(msg), { status, ...extra });

/* ------------------------------------------------------------------ textos */
const TXT = {
  pt: {
    loc: 'pt-BR', prop: 'Proposta comercial', lotes: 'Lotes industriais', outlet: 'Bracerum Outlet · Premium Outlet 1ª fase',
    tLote: 'Lote {id} · {a}', tLotes: '{n} lotes industriais · {a}', tLoja: 'Loja {id} · {a}', tLojas: '{n} lojas no Bracerum Outlet · {a}',
    para: 'Para: {c}', semCliente: 'Simulação de compra para o seu cliente', num: 'Proposta Nº {n} · emitida em {d} · válida por 30 dias, até {v}',
    por: 'Preparada por {c}', img: 'As unidades da proposta em destaque no Masterplan 3D do Bracerum Park (imagem ilustrativa).',
    kUn: 'lotes', kUnL: 'lojas', kArea: 'área total', kTot: 'valor · {p}', kM2: 'preço médio por m²',
    cond: 'Condição proposta', sinal: 'Sinal de 20% na assinatura', parc: '{n} parcelas mensais de', unico: 'Pagamento único na assinatura',
    faixa: 'Faixa de {de} a {ate} lotes na operação', faixaUp: 'Faixa de {de} lotes ou mais na operação',
    unidades: 'Unidades da proposta', cLote: 'Lote', cQuadra: 'Quadra', cCat: 'Categoria', cArea: 'Área', cM2: 'US$/m²', cValor: 'Valor',
    cLoja: 'Loja', cConj: 'Conjunto', total: 'Total', outras: 'O valor da operação nas outras condições',
    outrasL: 'Por janela de preço (data da assinatura) e condição de pagamento. Em destaque, a condição proposta.',
    outrasO: 'Tabela aprovada do Bracerum Outlet no CV: à vista −5% e 20% + 36x +8% sobre o 20% + 12x.',
    pCond: 'Condição', pTot: 'Valor total', pSinal: 'Sinal', pParc: 'Parcelas',
    passos: 'Como avançar',
    passosL: ['Proposta: validade de 30 dias. Vale a tabela vigente na data da assinatura; a disponibilidade do lote é confirmada pela Bracerum.',
      'Carta de Reserva: sinal de reserva de 1% do preço; o lote sai da oferta por 30 dias e o sinal de reserva é deduzido do sinal do contrato.',
      'Contrato de Reserva e Direito de Aquisição Futura: sinal de 20% (ou pagamento integral, à vista) e as parcelas da condição escolhida.',
      'Depois: Contrato de Compra e Venda (licenças obtidas e lote individualizado) e Escritura Pública na quitação.',
      'Pagamento somente por transferência bancária para a conta da Empreendedora indicada no contrato — não são aceitos pagamentos a corretores ou a terceiros. Valores em dólares (USD); IVA não incluído.'],
    passosO: ['Proposta: validade de 30 dias. Vale a tabela vigente na data da assinatura; a disponibilidade da loja é confirmada pela Bracerum.',
      'Para reservar, fale com o seu corretor: a Bracerum registra a reserva no CV CRM, na tabela aprovada do Bracerum Outlet.',
      'Valores em dólares (USD). As lojas desta proposta são da 1ª fase do Premium Outlet, de frente para a PY-19.'],
    seu: 'Seu corretor', park: 'Bracerum Park', wa: 'WhatsApp', creci: 'CRECI',
    nota: 'Simulação de referência gerada no Portal do Corretor em {d} ({fuso}). {fonte} Situação das unidades conferida no CV CRM em {s}. Esta proposta não reserva unidade: preços e condições sujeitos à tabela vigente na data da assinatura, à disponibilidade confirmada pela Bracerum e ao contrato.',
    fonteL: 'Valores pela Tabela de preços v3.1 (Política Comercial P1, versão pública).', fonteO: 'Valores pela tabela aprovada do Bracerum Outlet no CV CRM ({t}).',
    semSit: 'não confirmada', pag: 'Página {i} de {n}', arq: 'proposta-bracerum-park',
  },
  es: {
    loc: 'es-PY', prop: 'Propuesta comercial', lotes: 'Lotes industriales', outlet: 'Bracerum Outlet · Premium Outlet 1ª fase',
    tLote: 'Lote {id} · {a}', tLotes: '{n} lotes industriales · {a}', tLoja: 'Local {id} · {a}', tLojas: '{n} locales en el Bracerum Outlet · {a}',
    para: 'Para: {c}', semCliente: 'Simulación de compra para su cliente', num: 'Propuesta N.º {n} · emitida el {d} · válida por 30 días, hasta el {v}',
    por: 'Preparada por {c}', img: 'Las unidades de la propuesta destacadas en el Masterplan 3D de Bracerum Park (imagen ilustrativa).',
    kUn: 'lotes', kUnL: 'locales', kArea: 'área total', kTot: 'valor · {p}', kM2: 'precio medio por m²',
    cond: 'Condición propuesta', sinal: 'Seña del 20% a la firma', parc: '{n} cuotas mensuales de', unico: 'Pago único a la firma',
    faixa: 'Franja de {de} a {ate} lotes en la operación', faixaUp: 'Franja de {de} lotes o más en la operación',
    unidades: 'Unidades de la propuesta', cLote: 'Lote', cQuadra: 'Manzana', cCat: 'Categoría', cArea: 'Área', cM2: 'US$/m²', cValor: 'Valor',
    cLoja: 'Local', cConj: 'Conjunto', total: 'Total', outras: 'El valor de la operación en las otras condiciones',
    outrasL: 'Por ventana de precio (fecha de la firma) y condición de pago. Destacada, la condición propuesta.',
    outrasO: 'Tabla aprobada del Bracerum Outlet en el CV: contado −5% y 20% + 36 cuotas +8% sobre el 20% + 12.',
    pCond: 'Condición', pTot: 'Valor total', pSinal: 'Seña', pParc: 'Cuotas',
    passos: 'Cómo avanzar',
    passosL: ['Propuesta: validez de 30 días. Vale la tabla vigente en la fecha de la firma; la disponibilidad del lote la confirma Bracerum.',
      'Carta de Reserva: seña de reserva del 1% del precio; el lote sale de la oferta por 30 días y la seña de reserva se descuenta de la seña del contrato.',
      'Contrato de Reserva y Derecho de Adquisición Futura: seña del 20% (o pago total, al contado) y las cuotas de la condición elegida.',
      'Después: Contrato de Compraventa (licencias obtenidas y lote individualizado) y Escritura Pública al cancelar.',
      'Pago solo por transferencia bancaria a la cuenta de la Desarrolladora indicada en el contrato — no se aceptan pagos a corredores ni a terceros. Valores en dólares (USD); IVA no incluido.'],
    passosO: ['Propuesta: validez de 30 días. Vale la tabla vigente en la fecha de la firma; la disponibilidad del local la confirma Bracerum.',
      'Para reservar, hable con su corredor: Bracerum registra la reserva en el CV CRM, en la tabla aprobada del Bracerum Outlet.',
      'Valores en dólares (USD). Los locales de esta propuesta son de la 1ª fase del Premium Outlet, frente a la PY-19.'],
    seu: 'Su corredor', park: 'Bracerum Park', wa: 'WhatsApp', creci: 'Matrícula',
    nota: 'Simulación de referencia generada en el Portal del Corredor el {d} ({fuso}). {fonte} Situación de las unidades verificada en el CV CRM el {s}. Esta propuesta no reserva la unidad: precios y condiciones sujetos a la tabla vigente en la fecha de la firma, a la disponibilidad confirmada por Bracerum y al contrato.',
    fonteL: 'Valores según la Tabla de precios v3.1 (Política Comercial P1, versión pública).', fonteO: 'Valores según la tabla aprobada del Bracerum Outlet en el CV CRM ({t}).',
    semSit: 'no confirmada', pag: 'Página {i} de {n}', arq: 'propuesta-bracerum-park',
  },
  en: {
    loc: 'en-US', prop: 'Commercial proposal', lotes: 'Industrial lots', outlet: 'Bracerum Outlet · Premium Outlet phase 1',
    tLote: 'Lot {id} · {a}', tLotes: '{n} industrial lots · {a}', tLoja: 'Store {id} · {a}', tLojas: '{n} stores at Bracerum Outlet · {a}',
    para: 'For: {c}', semCliente: 'Purchase simulation for your client', num: 'Proposal No. {n} · issued {d} · valid for 30 days, until {v}',
    por: 'Prepared by {c}', img: 'The units in this proposal highlighted on the Bracerum Park 3D Masterplan (illustrative image).',
    kUn: 'lots', kUnL: 'stores', kArea: 'total area', kTot: 'price · {p}', kM2: 'average price per m²',
    cond: 'Proposed terms', sinal: '20% down payment on signing', parc: '{n} monthly instalments of', unico: 'Single payment on signing',
    faixa: '{de} to {ate} lots in the purchase', faixaUp: '{de} lots or more in the purchase',
    unidades: 'Units in this proposal', cLote: 'Lot', cQuadra: 'Block', cCat: 'Category', cArea: 'Area', cM2: 'US$/m²', cValor: 'Price',
    cLoja: 'Store', cConj: 'Complex', total: 'Total', outras: 'The purchase price under the other terms',
    outrasL: 'By price window (signing date) and payment terms. Highlighted: the proposed terms.',
    outrasO: 'Approved Bracerum Outlet table in the CV: cash −5% and 20% + 36x +8% on 20% + 12x.',
    pCond: 'Terms', pTot: 'Total price', pSinal: 'Down payment', pParc: 'Instalments',
    passos: 'Next steps',
    passosL: ['Proposal: valid for 30 days. The price list in force on the signing date applies; lot availability is confirmed by Bracerum.',
      'Reservation Letter: 1% reservation deposit; the lot is taken off the market for 30 days and the deposit is deducted from the contract down payment.',
      'Reservation and Future Acquisition Right Agreement: 20% down payment (or full payment, cash) and the instalments of the chosen terms.',
      'Then: Purchase and Sale Agreement (permits obtained and lot individualised) and Public Deed on full payment.',
      'Payment only by bank transfer to the Developer account stated in the contract — no payments to brokers or third parties. Prices in US dollars (USD); VAT not included.'],
    passosO: ['Proposal: valid for 30 days. The price list in force on the signing date applies; store availability is confirmed by Bracerum.',
      'To reserve, talk to your broker: Bracerum records the reservation in the CV CRM, under the approved Bracerum Outlet table.',
      'Prices in US dollars (USD). The stores in this proposal are in phase 1 of the Premium Outlet, facing the PY-19.'],
    seu: 'Your broker', park: 'Bracerum Park', wa: 'WhatsApp', creci: 'Licence',
    nota: 'Reference simulation generated in the Broker Portal on {d} ({fuso}). {fonte} Unit status checked in the CV CRM on {s}. This proposal does not reserve any unit: prices and terms are subject to the price list in force on the signing date, availability confirmed by Bracerum and the contract.',
    fonteL: 'Prices from Price List v3.1 (Commercial Policy P1, public version).', fonteO: 'Prices from the approved Bracerum Outlet table in the CV CRM ({t}).',
    semSit: 'not confirmed', pag: 'Page {i} of {n}', arq: 'bracerum-park-proposal',
  },
};
const sub = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''));
const tx = (o, l) => (o && typeof o === 'object' ? o[l] || o.pt || '' : o || '');

/* ------------------------------------------------------------------ números */
// período curto da janela para o cabeçalho da tabela: "até 15/01/2027", "16/01 a 31/03/2027", "a partir de 01/04/2027"
function periodo(j, idioma) {
  const d = (iso, ano = true) => { const [a, m, dd] = iso.split('-'); return ano ? `${dd}/${m}/${a}` : `${dd}/${m}`; };
  const w = { pt: ['até {a}', '{d} a {a}', 'a partir de {d}'], es: ['hasta el {a}', 'del {d} al {a}', 'desde el {d}'], en: ['until {a}', '{d} to {a}', 'from {d}'] }[idioma] || [];
  if (j.de && j.ate) return sub(w[1], { d: d(j.de, j.de.slice(0, 4) !== j.ate.slice(0, 4)), a: d(j.ate) });
  return j.ate ? sub(w[0], { a: d(j.ate) }) : sub(w[2], { d: d(j.de) });
}
function faixaDe(precos, n) { const i = precos.faixas.findIndex((f) => n >= f.de && (f.ate == null || n <= f.ate)); return i < 0 ? precos.faixas.length - 1 : i; }
function condLotes(precos, lotes, j, faixa) {
  const out = {};
  for (const c of CONDS) {
    let total = 0;
    for (const l of lotes) total += precos.precos[j][l.cat][faixa][PAG[c]] * l.a;
    const n = NP[c], sinal = n ? Math.round(total * 0.2) : total;
    out[c] = { total, sinal, n, parcela: n ? Math.round((total - sinal) / n) : 0 };
  }
  return out;
}

/**
 * @param {object} o
 *   tipo 'lotes' | 'outlet'; ids [...]; janela; pagamento; idioma
 *   unidades  Map id → {id,q,a,cat,nome} (lotes.json) · precos (precos.json) · janelaVigente {id}
 *   situacao(id) → 'disponivel' | 'reservado' | 'vendido' | 'indisponivel' | 'desconhecida' (lotes)
 *   tabelas   retrato das tabelas do CV (produtos.outlet) · sincronizadoEm (ISO do último sucesso do CV)
 */
function montarProposta(o) {
  const idioma = TXT[o.idioma] ? o.idioma : 'pt';
  const ids = [...new Set((Array.isArray(o.ids) ? o.ids : []).map((x) => String(x).trim()).filter(Boolean))];
  if (!ids.length) throw erro(422, 'Escolha ao menos uma unidade');
  if (ids.length > 200) throw erro(422, 'Proposta com mais de 200 unidades — divida em partes');
  const pagamento = CONDS.includes(o.pagamento) ? o.pagamento : '12x';

  if (o.tipo === 'outlet') {
    const P = o.tabelas && o.tabelas.produtos && o.tabelas.produtos.outlet;
    if (!P) throw erro(503, 'Tabela do Outlet indisponível agora — tente em alguns minutos');
    const por = new Map(P.unidades.map((u) => [u.id, u]));
    const fora = ids.filter((id) => !por.has(id));
    if (fora.length) throw erro(422, `Loja não encontrada na tabela do CV: ${fora.join(', ')}`);
    const us = ids.map((id) => por.get(id));
    const ocup = us.filter((u) => !/dispon/i.test(u.sit || ''));
    if (ocup.length) throw erro(409, `Fora de venda no CV: ${ocup.map((u) => `${u.id} (${String(u.sit).toLowerCase()})`).join(', ')}`);
    const cond = {};
    for (const c of CONDS) {
      const s = { total: 0, sinal: 0, n: 0, parcela: 0 };
      for (const u of us) { const v = u.c[c]; s.total += v.total; s.sinal += v.sinal; s.n = v.n; s.parcela += v.parcela; }
      cond[c] = s;
    }
    const tab = ((P.tabelas || [])[0] || { nome: 'tabela de valores' }).nome.replace(/\s*-\s*(x\d+|[ÁA] vista)\s*$/i, '');
    return {
      tipo: 'outlet', idioma, pagamento, n: us.length, area: us.reduce((s, u) => s + u.area, 0), cond,
      ajuste: { vista: P.cond.vista && P.cond.vista.ajuste, '36x': P.cond['36x'] && P.cond['36x'].ajuste },
      unidades: us.map((u) => ({ id: u.id, grupo: u.bloco, area: u.area, m2: u.c[pagamento].total / u.area, total: u.c[pagamento].total })),
      tabela: tab, sincronizadoEm: o.tabelas.ultimoSucesso || null,
    };
  }

  const { precos } = o;
  const fora = ids.filter((id) => !o.unidades.has(id));
  if (fora.length) throw erro(422, `Lote não encontrado: ${fora.slice(0, 5).join(', ')}`);
  const lotes = ids.map((id) => o.unidades.get(id));
  const ocup = lotes.map((l) => [l.id, o.situacao(l.id)]).filter(([, s]) => s !== 'disponivel' && s !== 'desconhecida');
  if (ocup.length) throw erro(409, `Fora de venda no CV: ${ocup.slice(0, 8).map(([id, s]) => `${id} (${s})`).join(', ')}${ocup.length > 8 ? '…' : ''}`);
  const semSituacao = lotes.some((l) => o.situacao(l.id) === 'desconhecida');
  // janela: a escolhida, se ainda vale (vigente ou futura); senão a vigente
  const iv = precos.janelas.findIndex((j) => j.id === o.janelaVigente.id);
  const ij = precos.janelas.findIndex((j) => j.id === o.janela);
  const janela = precos.janelas[ij >= iv ? ij : iv];
  const faixa = faixaDe(precos, lotes.length);
  const matriz = precos.janelas.slice(iv).map((j) => ({ id: j.id, nome: tx(j.curto, idioma), quando: periodo(j, idioma), cond: condLotes(precos, lotes, j.id, faixa) }));
  const cond = matriz.find((m) => m.id === janela.id).cond;
  return {
    tipo: 'lotes', idioma, pagamento, n: lotes.length, area: lotes.reduce((s, l) => s + l.a, 0), cond, matriz, faixa: precos.faixas[faixa],
    janela: { id: janela.id, nome: tx(janela.nome, idioma), quando: tx(janela.quando, idioma) },
    unidades: lotes.map((l) => {
      const m2 = precos.precos[janela.id][l.cat][faixa][PAG[pagamento]];
      return { id: l.id, nome: l.nome, grupo: l.q, cat: tx(precos.categorias[l.cat].nome, idioma), area: l.a, m2, total: m2 * l.a };
    }),
    tabela: precos.tabela, semSituacao, sincronizadoEm: o.sincronizadoEm || null,
  };
}

/* ------------------------------------------------------------------ PDF */
const FONTES = path.join(__dirname, '_fontes');
const C = { ouro: '#b4904b', escuro: '#1a1a1e', texto: '#1a1a1e', cinza: '#6f6a62', claro: '#f1efea', linha: '#e3ddd2', papel: '#f9f5ef', mudo: '#a9a49c' };
const PAGES = { w: 595.28, h: 841.89 };
const M = { x: 48, top: 58, bottom: 60 };
const LARG = PAGES.w - 2 * M.x;

function gerarPDF(mod, { corretor = {}, cliente = '', imagem = null, numero, emitido = new Date(), tz = 'America/Asuncion', nomeFuso = '' } = {}) {
  const PDFDocument = require('pdfkit');
  const T = TXT[mod.idioma] || TXT.pt;
  const nf = (v, d = 0) => new Intl.NumberFormat(T.loc, { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  const usd = (v) => 'US$ ' + nf(v, Math.round(v * 100) % 100 && Math.abs(v) < 1e6 ? 2 : 0);
  const m2 = (v) => `${nf(v, v % 1 ? 2 : 0)} m²`;
  const data = (d) => new Intl.DateTimeFormat(T.loc, { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const dataHora = (d) => new Intl.DateTimeFormat(T.loc, { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
  const validade = new Date(emitido.getTime() + 30 * 864e5);
  const lotes = mod.tipo === 'lotes';
  const nomePag = (c) => ({ vista: { pt: 'À vista', es: 'Al contado', en: 'Cash' }, '12x': { pt: '20% + 12x', es: '20% + 12 cuotas', en: '20% + 12x' }, '36x': { pt: '20% + 36x', es: '20% + 36 cuotas', en: '20% + 36x' } }[c][mod.idioma] || c);

  const doc = new PDFDocument({ size: 'A4', margins: { top: M.top, bottom: M.bottom, left: M.x, right: M.x }, bufferPages: true,
    info: { Title: `${T.prop} ${numero} — Bracerum Park`, Author: corretor.nome || 'Bracerum Park', Subject: lotes ? T.lotes : T.outlet, Creator: 'Portal do Corretor · Bracerum Park' } });
  doc.registerFont('titulo', path.join(FONTES, 'Caladea-Bold.ttf'));
  doc.registerFont('txt', path.join(FONTES, 'Carlito-Regular.ttf'));
  doc.registerFont('neg', path.join(FONTES, 'Carlito-Bold.ttf'));
  doc.registerFont('ita', path.join(FONTES, 'Carlito-Italic.ttf'));
  const partes = [];
  doc.on('data', (b) => partes.push(b));
  const pronto = new Promise((ok, falha) => { doc.on('end', () => ok(Buffer.concat(partes))); doc.on('error', falha); });

  let y = M.top;
  const fimUtil = () => PAGES.h - M.bottom;
  const novaPagina = () => { doc.addPage(); y = M.top; };
  const cabe = (h) => { if (y + h > fimUtil()) novaPagina(); };
  const caps = (s, x, yy, o = {}) => doc.font(o.font || 'neg').fontSize(o.size || 6.8).fillColor(o.cor || C.ouro)
    .text(String(s).toUpperCase(), x, yy, { characterSpacing: o.sp ?? 1.8, width: o.width, align: o.align || 'left', lineBreak: !!o.width });
  const h2 = (s) => { cabe(60); doc.font('titulo').fontSize(13.5).fillColor(C.texto).text(s, M.x, y, { width: LARG }); y = doc.y + 6; };

  /* ---------- abertura */
  const titulo = lotes
    ? (mod.n === 1 ? sub(T.tLote, { id: 'LTIND.' + mod.unidades[0].id, a: m2(mod.area) }) : sub(T.tLotes, { n: nf(mod.n), a: m2(mod.area) }))
    : (mod.n === 1 ? sub(T.tLoja, { id: mod.unidades[0].id, a: m2(mod.area) }) : sub(T.tLojas, { n: nf(mod.n), a: m2(mod.area) }));
  const linhaPara = cliente ? sub(T.para, { c: cliente }) : T.semCliente;
  const quem = [corretor.nome, corretor.imobiliaria].filter(Boolean).join(' · ');
  const metas = [sub(T.num, { n: numero, d: data(emitido), v: data(validade) }), quem ? sub(T.por, { c: quem }) : ''].filter(Boolean);
  const pad = 22, wIn = LARG - 2 * pad;
  doc.font('titulo').fontSize(20); const hT = doc.heightOfString(titulo, { width: wIn });
  doc.font('txt').fontSize(11); const hP = doc.heightOfString(linhaPara, { width: wIn });
  doc.font('txt').fontSize(8.4); const hM = metas.reduce((s, m) => s + doc.heightOfString(m, { width: wIn }) + 3, 0);
  const hBox = pad + 12 + hT + 6 + hP + 10 + hM + pad - 4;
  doc.rect(M.x, y, LARG, hBox).fill(C.escuro);
  let yy = y + pad;
  caps(`${T.prop} · ${lotes ? T.lotes : T.outlet}`, M.x + pad, yy, { size: 6.8, sp: 2.2 });
  yy += 14;
  doc.font('titulo').fontSize(20).fillColor('#ffffff').text(titulo, M.x + pad, yy, { width: wIn }); yy += hT + 6;
  doc.font('txt').fontSize(11).fillColor('#d8d3cb').text(linhaPara, M.x + pad, yy, { width: wIn }); yy += hP + 10;
  for (const m of metas) { doc.font('txt').fontSize(8.4).fillColor(C.mudo).text(m, M.x + pad, yy, { width: wIn }); yy = doc.y + 3; }
  y += hBox + 16;

  /* ---------- retrato da maquete */
  if (imagem) {
    try {
      const img = doc.openImage(imagem);
      const k = Math.min(LARG / img.width, 250 / img.height);
      const w = img.width * k, h = img.height * k;
      doc.rect(M.x, y, LARG, h).fill(C.claro);
      doc.image(img, M.x + (LARG - w) / 2, y, { width: w, height: h });
      y += h + 5;
      doc.font('ita').fontSize(7.6).fillColor(C.cinza).text(T.img, M.x, y, { width: LARG }); y = doc.y + 12;
    } catch (e) { /* imagem inválida: segue sem ela */ }
  }

  /* ---------- números */
  const cc = mod.cond[mod.pagamento];
  const kpis = [[nf(mod.n), lotes ? T.kUn : T.kUnL], [m2(mod.area), T.kArea], [usd(cc.total), sub(T.kTot, { p: nomePag(mod.pagamento) })], [`US$ ${nf(cc.total / mod.area, 2)}`, T.kM2]];
  cabe(64);
  const wk = (LARG - 3 * 8) / 4;
  kpis.forEach(([v, r], i) => {
    const x = M.x + i * (wk + 8);
    doc.rect(x, y, wk, 58).fill(C.claro);
    doc.font('titulo').fontSize(v.length > 14 ? 11.5 : 14.5).fillColor(C.ouro).text(v, x + 10, y + 10, { width: wk - 20, lineBreak: false });
    caps(r, x + 10, y + 36, { size: 5.8, cor: C.cinza, sp: 1.2, width: wk - 20 });
  });
  y += 58 + 16;

  /* ---------- condição proposta */
  const linhasCond = [[cc.n ? T.sinal : T.unico, usd(cc.n ? cc.sinal : cc.total)], ...(cc.n ? [[sub(T.parc, { n: cc.n }), usd(cc.parcela)]] : [])];
  const subCond = lotes ? `${mod.janela.nome} (${mod.janela.quando}) · ${nomePag(mod.pagamento)}` : nomePag(mod.pagamento);
  const extraCond = lotes ? (mod.faixa.ate == null ? sub(T.faixaUp, { de: mod.faixa.de }) : sub(T.faixa, { de: mod.faixa.de, ate: mod.faixa.ate })) : '';
  const hCond = 118 + (extraCond ? 12 : 0);
  cabe(hCond);
  doc.rect(M.x, y, LARG, hCond).fill(C.escuro);
  caps(T.cond, M.x + 20, y + 16, { size: 6.6 });
  doc.font('txt').fontSize(9).fillColor('#d8d3cb').text(subCond, M.x + 20, y + 30, { width: LARG - 40 });
  doc.font('titulo').fontSize(24).fillColor('#ffffff').text(usd(cc.total), M.x + 20, y + 46, { width: 250 });
  let yr = y + 50;
  for (const [k, v] of linhasCond) {
    doc.font('txt').fontSize(9.5).fillColor('#d8d3cb').text(k, M.x + 270, yr, { width: 130 });
    doc.font('neg').fontSize(11).fillColor('#ffffff').text(v, M.x + 400, yr - 1, { width: LARG - 420, align: 'right' });
    yr += 22;
  }
  if (extraCond) doc.font('txt').fontSize(8.4).fillColor(C.mudo).text(extraCond, M.x + 20, y + hCond - 26, { width: LARG - 40 });
  y += hCond + 20;

  /* ---------- tabela das unidades */
  const cols = lotes
    ? [[T.cLote, 0.30, 'l'], [T.cQuadra, 0.10, 'l'], [T.cCat, 0.14, 'l'], [T.cArea, 0.14, 'r'], [T.cM2, 0.12, 'r'], [T.cValor, 0.20, 'r']]
    : [[T.cLoja, 0.16, 'l'], [T.cConj, 0.34, 'l'], [T.cArea, 0.14, 'r'], [T.cM2, 0.14, 'r'], [T.cValor, 0.22, 'r']];
  const xs = []; let acc = M.x; for (const c of cols) { xs.push(acc); acc += c[1] * LARG; }
  const cab = () => {
    doc.rect(M.x, y, LARG, 22).fill(C.ouro);
    cols.forEach(([n, w, a], i) => caps(n, xs[i] + 8, y + 8, { size: 6.2, cor: '#ffffff', sp: 1.3, width: w * LARG - 16, align: a === 'r' ? 'right' : 'left' }));
    y += 22;
  };
  cabe(120);                                   // título + cabeçalho + duas linhas juntos
  h2(T.unidades);
  cab();
  mod.unidades.forEach((u, iu) => {
    const celulas = lotes
      ? [['LTIND.' + u.id, 'neg', u.nome], [u.grupo], [u.cat], [m2(u.area)], [nf(u.m2, u.m2 % 1 ? 2 : 0)], [usd(u.total), 'neg']]
      : [[u.id, 'neg'], [u.grupo], [m2(u.area)], [nf(u.m2, 2)], [usd(u.total), 'neg']];
    const h = lotes ? 28 : 20, ultima = iu === mod.unidades.length - 1;
    if (y + h + (ultima ? 24 : 0) > fimUtil()) { novaPagina(); cab(); }   // a última linha não se separa do total
    celulas.forEach(([v, f, pequeno], i) => {
      const [, w, a] = cols[i];
      doc.font(f || 'txt').fontSize(9).fillColor(C.texto).text(v, xs[i] + 8, y + 6, { width: w * LARG - 16, align: a === 'r' ? 'right' : 'left', lineBreak: false });
      if (pequeno) doc.font('txt').fontSize(6.4).fillColor(C.cinza).text(pequeno, xs[i] + 8, y + 17, { width: w * LARG - 16, lineBreak: false });
    });
    y += h;
    doc.moveTo(M.x, y).lineTo(M.x + LARG, y).lineWidth(0.6).strokeColor(C.linha).stroke();
  });
  doc.rect(M.x, y, LARG, 22).fill(C.claro);
  doc.font('neg').fontSize(9.5).fillColor(C.texto).text(`${T.total} · ${nf(mod.n)} ${lotes ? T.kUn : T.kUnL}`, M.x + 8, y + 6, { width: 260 });
  doc.text(m2(mod.area), xs[lotes ? 3 : 2] + 8, y + 6, { width: cols[lotes ? 3 : 2][1] * LARG - 16, align: 'right' });
  doc.text(usd(cc.total), xs[cols.length - 1] + 8, y + 6, { width: cols[cols.length - 1][1] * LARG - 16, align: 'right' });
  y += 22 + 20;

  /* ---------- outras condições */
  h2(T.outras);
  doc.font('txt').fontSize(8.4).fillColor(C.cinza).text(lotes ? T.outrasL : T.outrasO, M.x, y, { width: LARG }); y = doc.y + 8;
  const celCond = (v, x, w, destaque) => {
    doc.font(destaque ? 'neg' : 'txt').fontSize(destaque ? 10.5 : 10).fillColor(destaque ? C.ouro : C.texto).text(usd(v.total), x, y + 7, { width: w, align: 'right', lineBreak: false });
    doc.font('txt').fontSize(6.6).fillColor(C.cinza).text(v.n ? `${T.pSinal.toLowerCase()} ${usd(v.sinal)} · ${v.n} × ${usd(v.parcela)}` : '—', x, y + 21, { width: w, align: 'right', lineBreak: false });
  };
  if (lotes) {
    const nj = mod.matriz.length, w0 = 0.22 * LARG, wj = (LARG - w0) / nj;
    cabe(40 + 3 * 36);
    doc.rect(M.x, y, LARG, 30).fill(C.ouro);
    caps(T.pCond, M.x + 8, y + 12, { size: 6.2, cor: '#ffffff', sp: 1.3 });
    mod.matriz.forEach((m, i) => {
      caps(m.nome, M.x + w0 + i * wj + 4, y + 6, { size: 6.2, cor: '#ffffff', sp: 1.3, width: wj - 12, align: 'right' });
      doc.font('txt').fontSize(6).fillColor('#fbf3e3').text(m.quando, M.x + w0 + i * wj + 4, y + 17, { width: wj - 12, align: 'right', lineBreak: false });
    });
    y += 30;
    for (const c of CONDS) {
      doc.font('neg').fontSize(9).fillColor(C.texto).text(nomePag(c), M.x + 8, y + 12, { width: w0 - 16 });
      mod.matriz.forEach((m, i) => celCond(m.cond[c], M.x + w0 + i * wj + 4, wj - 12, m.id === mod.janela.id && c === mod.pagamento));
      y += 34;
      doc.moveTo(M.x, y).lineTo(M.x + LARG, y).lineWidth(0.6).strokeColor(C.linha).stroke();
    }
  } else {
    cabe(26 + 3 * 34);
    const w0 = 0.34 * LARG, wc = (LARG - w0) / 3;
    doc.rect(M.x, y, LARG, 22).fill(C.ouro);
    [T.pCond, T.pTot, T.pSinal, T.pParc].forEach((n, i) => caps(n, i ? M.x + w0 + (i - 1) * wc + 4 : M.x + 8, y + 8, { size: 6.2, cor: '#ffffff', sp: 1.3, width: i ? wc - 12 : w0 - 16, align: i ? 'right' : 'left' }));
    y += 22;
    for (const c of CONDS) {
      const v = mod.cond[c], d = c === mod.pagamento, aj = c === 'vista' ? mod.ajuste.vista : c === '36x' ? mod.ajuste['36x'] : null;
      doc.font('neg').fontSize(9).fillColor(C.texto).text(nomePag(c) + (aj != null ? `  (${aj > 0 ? '+' : '−'}${nf(Math.abs(aj))}%)` : ''), M.x + 8, y + 9, { width: w0 - 16 });
      doc.font(d ? 'neg' : 'txt').fontSize(10).fillColor(d ? C.ouro : C.texto).text(usd(v.total), M.x + w0 + 4, y + 9, { width: wc - 12, align: 'right' });
      doc.font('txt').fontSize(9.5).fillColor(C.texto).text(v.n ? usd(v.sinal) : '—', M.x + w0 + wc + 4, y + 9, { width: wc - 12, align: 'right' });
      doc.text(v.n ? `${v.n} × ${usd(v.parcela)}` : '—', M.x + w0 + 2 * wc + 4, y + 9, { width: wc - 12, align: 'right' });
      y += 30;
      doc.moveTo(M.x, y).lineTo(M.x + LARG, y).lineWidth(0.6).strokeColor(C.linha).stroke();
    }
  }
  y += 20;

  /* ---------- como avançar */
  h2(T.passos);
  for (const p of lotes ? T.passosL : T.passosO) {
    doc.font('txt').fontSize(9.2); const h = doc.heightOfString(p, { width: LARG - 16 });
    cabe(h + 4);
    doc.circle(M.x + 3, y + 5.5, 2.4).fill(C.ouro);
    doc.font('txt').fontSize(9.2).fillColor(C.texto).text(p, M.x + 14, y, { width: LARG - 16, lineGap: 1 });
    y = doc.y + 5;
  }
  y += 12;

  /* ---------- contatos */
  const tel = corretor.tel ? `+${corretor.ddi || ''} ${corretor.tel}`.replace(/^\+ /, '') : '';
  const linhasC = [corretor.imobiliaria, tel && `${T.wa} ${tel}`, corretor.email, corretor.creci && `${T.creci} ${corretor.creci}`].filter(Boolean);
  const hC = 40 + 16 + linhasC.length * 13 + 6;
  cabe(hC + 70);
  doc.rect(M.x, y, LARG, hC).fill(C.escuro);
  caps(T.seu, M.x + 20, y + 16, { size: 6.6 });
  doc.font('titulo').fontSize(14).fillColor('#ffffff').text(corretor.nome || '—', M.x + 20, y + 30, { width: LARG / 2 - 30 });
  let yc = y + 52;
  for (const l of linhasC) { doc.font('txt').fontSize(9).fillColor('#d8d3cb').text(l, M.x + 20, yc, { width: LARG / 2 - 30, lineBreak: false }); yc += 13; }
  caps(T.park, M.x + LARG / 2 + 10, y + 16, { size: 6.6 });
  doc.font('txt').fontSize(9).fillColor('#d8d3cb').text('bracerumpark@bracerum.com', M.x + LARG / 2 + 10, y + 32, { width: LARG / 2 - 30 })
    .text(`${T.wa} +55 47 99136-8987`, M.x + LARG / 2 + 10, y + 45, { width: LARG / 2 - 30 })
    .text('bracerumpark.com · Villeta, Paraguay', M.x + LARG / 2 + 10, y + 58, { width: LARG / 2 - 30 });
  y += hC + 12;

  const fonte = lotes ? T.fonteL : sub(T.fonteO, { t: mod.tabela });
  const nota = sub(T.nota, { d: dataHora(emitido), fuso: nomeFuso || tz, fonte, s: mod.sincronizadoEm && !mod.semSituacao ? dataHora(new Date(mod.sincronizadoEm)) : T.semSit });
  doc.font('ita').fontSize(7.4).fillColor(C.cinza).text(nota, M.x, y, { width: LARG, lineGap: 1 });

  /* ---------- cabeçalho e rodapé corridos */
  const total = doc.bufferedPageRange().count;
  for (let i = 0; i < total; i++) {
    doc.switchToPage(i);
    const mb = doc.page.margins.bottom; doc.page.margins.bottom = 0;
    caps('Bracerum Park', M.x, 26, { size: 6.6, sp: 2.4 });
    doc.font('txt').fontSize(6.6).fillColor(C.cinza).text(`${T.prop} ${numero}${cliente ? ' · ' + cliente : ''}`, M.x + 110, 26, { width: LARG - 110, lineBreak: false });
    caps('Bracerum Park', M.x, PAGES.h - 34, { size: 6, cor: C.cinza, sp: 2.4 });
    doc.font('txt').fontSize(6.6).fillColor(C.cinza).text(lotes ? T.lotes : T.outlet, M.x, PAGES.h - 34, { width: LARG, align: 'center', lineBreak: false })
      .text(sub(T.pag, { i: i + 1, n: total }), M.x, PAGES.h - 34, { width: LARG, align: 'right', lineBreak: false });
    doc.page.margins.bottom = mb;
  }
  doc.end();
  return pronto.then((buf) => ({ pdf: buf, nome: `${T.arq}-${numero}.pdf` }));
}

// "data:image/jpeg;base64,..." → Buffer (só JPEG/PNG, até 3 MB); qualquer outra coisa → null
function imagemDe(s) {
  const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''));
  if (!m || m[2].length > 4.2e6) return null;
  const b = Buffer.from(m[2], 'base64');
  const jpeg = b[0] === 0xff && b[1] === 0xd8, png = b[0] === 0x89 && b[1] === 0x50;
  return jpeg || png ? b : null;
}

module.exports = { montarProposta, gerarPDF, imagemDe, TXT };
