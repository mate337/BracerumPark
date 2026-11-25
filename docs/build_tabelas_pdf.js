#!/usr/bin/env node
/*
  Gera as tabelas de preço em PDF (A4, versão pública, PT) de Residence · Casas, Residence · Aptos e
  Bracerum Outlet, no mesmo estilo da "Tabela de preços — Lotes industriais" P1 v3.1 do cliente
  (docs/lotes-p1/Bracerum_Park_P1_Tabela_de_Precos_PT_PUBLICA_2.pdf): faixa escura de abertura,
  dourado #b4904b, Caladea nos títulos e Carlito no texto, cabeçalho e rodapé corridos.

  Valores: as tabelas APROVADAS no CV CRM ("tabela de valores (nov/2026)" — à vista, 20% + 12x, 20% + 36x),
  resumidas por api/_portal-tabelas.js — as mesmas que o Portal do Corretor mostra e que a reserva usa.

  Uso:
    node docs/build_tabelas_pdf.js          usa o retrato api/_portal-tabelas-retrato.json
    node docs/build_tabelas_pdf.js --cv     relê o CV antes (CVCRM_EMAIL + CVCRM_TOKEN; ~30 s) e atualiza o retrato
  Grava portalcorretores/materiais/bracerum-<produto>-tabela-de-precos.pdf e a prévia
  portalcorretores/thumbs/tabela-<produto>.jpg (capa 960 × 720 para a biblioteca, também a dos lotes). Precisa do Playwright com Chromium e das fontes
  Caladea e Carlito instaladas (fc-list | grep -E "Caladea|Carlito").
*/
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const RAIZ = path.join(__dirname, '..');
const RETRATO = path.join(RAIZ, 'api/_portal-tabelas-retrato.json');
const MAT = path.join(RAIZ, 'portalcorretores/materiais');
const THUMBS = path.join(RAIZ, 'portalcorretores/thumbs');
const EMAIL = 'bracerumpark@bracerum.com';

/* ------------------------------------------------------------------ formatação pt-BR */
const nf = (n, d = 0) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const usd = (n) => 'US$ ' + nf(n, Math.round(n * 100) % 100 ? 2 : 0);
const m2 = (n) => `${nf(n, n % 1 ? 2 : 0)} m²`;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dataBR = (iso) => { const d = new Date(iso); return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`; };
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesAno = (iso) => { const d = new Date(iso); const m = MESES[d.getUTCMonth()]; return `${m[0].toUpperCase()}${m.slice(1)} de ${d.getUTCFullYear()}`; };
const pct = (a) => (a == null ? '' : `${a > 0 ? '+' : '−'}${nf(Math.abs(a), Number.isInteger(a) ? 0 : 1)}%`);
const nomeTabela = (P) => ((P.tabelas || [])[0] || { nome: 'tabela de valores' }).nome.replace(/\s*-\s*(x\d+|[ÁA] vista)\s*$/i, '');

// Uma condição do CV { total, sinal, n, parcela } em "valor grande + linha pequena", como a tabela P1.
const cel = (v, destaque) => (v ? `<b class="${destaque ? 'big' : 'mid'}">${usd(v.total)}</b><small>${v.n ? `sinal ${usd(v.sinal)} · ${v.n} × ${usd(v.parcela)}` : 'pagamento único'}</small>` : '—');
const linhaEx = (rot, v) => `<p><em>${rot}:</em> ${v.n ? `total ${usd(v.total)} &nbsp;·&nbsp; sinal ${usd(v.sinal)} &nbsp;·&nbsp; ${v.n} × ${usd(v.parcela)}` : `pagamento único de ${usd(v.total)}`}</p>`;
const exemplo = (titulo, sub, c) => `<div class="ex"><h4>${titulo}</h4>${sub ? `<p class="exsub">${sub}</p>` : ''}
  ${linhaEx('À vista', c.vista)}${linhaEx('20% + 12x (preço de tabela)', c['12x'])}${linhaEx('20% + 36x', c['36x'])}</div>`;

function condicoesHTML(P, porM2) {
  const lin = (id, nome, como) => {
    const r = P.cond[id] || {};
    return `<tr><td><b>${nome}</b></td><td>${como}</td><td class="r"><b>${porM2 ? `US$ ${nf(r.m2, r.m2 % 1 ? 2 : 0)}/m²` : `a partir de ${usd(r.min)}`}</b></td><td>${id === '12x' ? 'preço de tabela' : `${pct(r.ajuste)} sobre o 20% + 12x`}</td></tr>`;
  };
  return `<h3>Condições de pagamento — as três tabelas aprovadas</h3>
  <table class="t"><thead><tr><th>Condição</th><th>Como se paga</th><th class="r">${porM2 ? 'Preço por m²' : 'Valor'}</th><th>Sobre a tabela</th></tr></thead><tbody>
    ${lin('vista', 'À vista', 'pagamento integral na assinatura')}
    ${lin('12x', '20% + 12x', 'sinal na assinatura + 12 parcelas mensais')}
    ${lin('36x', '20% + 36x', 'sinal na assinatura + 36 parcelas mensais')}
  </tbody></table>`;
}

function documento({ sigla, titulo, subtitulo, versao, destaque, intro, kpis, corpo, fecho, P, em }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>
  @page { size: A4; margin: 21mm 17mm 18mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font: 10.4pt/1.5 Carlito, 'Liberation Sans', sans-serif; color: #1a1a1e; }
  h1, h2, h3, .serif { font-family: Caladea, 'Liberation Serif', serif; font-weight: 700; }
  .hero { background: #1a1a1e; color: #f9f5ef; padding: 26px 30px 22px; margin-bottom: 20px; }
  .eyebrow { font-size: 7.4pt; font-weight: 700; letter-spacing: .32em; color: #b4904b; text-transform: uppercase; margin: 0 0 14px; }
  .hero h1 { font-size: 23pt; line-height: 1.15; margin: 0 0 8px; }
  .hero .sub { font-size: 11.5pt; color: #d8d3cb; margin: 0 0 16px; }
  .hero .meta { font-size: 8.4pt; color: #a9a49c; margin: 0 0 8px; }
  .hero .meta b { color: #b4904b; letter-spacing: .22em; text-transform: uppercase; font-size: 7.4pt; margin-right: 6px; }
  .hero .meta .hl { color: #f9f5ef; }
  .hero .mail { font-size: 8.6pt; color: #d8d3cb; margin: 12px 0 0; }
  p.intro { font-size: 10.8pt; margin: 0 0 16px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 0 0 22px; }
  .kpi { background: #f1efea; padding: 12px 14px 12px; }
  .kpi b { display: block; font-family: Caladea, serif; color: #b4904b; font-size: 17pt; line-height: 1.1; }
  .kpi span { display: block; font-size: 6.8pt; letter-spacing: .24em; text-transform: uppercase; color: #8a857c; margin-top: 6px; line-height: 1.5; }
  h2 { font-size: 15pt; margin: 18px 0 6px; break-after: avoid; }
  h2 small { font-family: Carlito, sans-serif; font-weight: 400; font-size: 9pt; color: #8a857c; margin-left: 6px; }
  h3 { font-family: Carlito, sans-serif; font-size: 11.5pt; margin: 18px 0 8px; break-after: avoid; }
  table.t { width: 100%; border-collapse: collapse; font-size: 9.2pt; margin: 0 0 6px; }
  table.t thead { display: table-header-group; }
  table.t th { background: #b4904b; color: #fff; text-align: left; font-size: 7.2pt; letter-spacing: .16em; text-transform: uppercase; padding: 8px 10px; vertical-align: bottom; }
  table.t td { padding: 4px 10px; line-height: 1.35; border-bottom: 1px solid #ebe7df; vertical-align: middle; }
  table.t tr { break-inside: avoid; }
  table.t .r { text-align: right; }
  table.t td b.big { font-size: 11pt; display: block; }
  table.t td b.mid { font-size: 10pt; display: block; font-weight: 600; }
  table.t td small { display: block; font-size: 7.6pt; color: #8a857c; white-space: nowrap; }
  table.t tr.grp td { background: #f1efea; font-weight: 700; padding: 8px 10px; }
  table.t tr.grp td span { font-weight: 400; color: #8a857c; }
  table.t td.lote { font-weight: 700; white-space: nowrap; }
  table.t td.muted { color: #6f6a62; }
  ol, ul { margin: 0 0 10px; padding-left: 18px; }
  li { margin: 0 0 2px; }
  ul.dot { list-style: none; padding-left: 0; }
  ul.dot li { position: relative; padding-left: 16px; }
  ul.dot li::before { content: ''; position: absolute; left: 2px; top: .55em; width: 6px; height: 6px; border-radius: 50%; background: #b4904b; }
  .ex { background: #f1efea; padding: 10px 14px; margin: 0 0 8px; break-inside: avoid; }
  .ex h4 { margin: 0 0 4px; font-size: 10pt; }
  .ex p { margin: 2px 0; font-size: 9pt; }
  .ex p.exsub { color: #8a857c; margin-bottom: 4px; }
  .ex em { font-style: normal; font-weight: 700; color: #b4904b; }
  .nota { font-style: italic; font-size: 7.8pt; color: #6f6a62; margin: 10px 0 12px; }
  table.t tr.grp { break-after: avoid; }
  .fecho { background: #1a1a1e; color: #f9f5ef; padding: 16px 22px; break-inside: avoid; }
  .fecho h2 { color: #f9f5ef; margin: 0 0 10px; font-size: 14pt; }
  .fecho p { margin: 0; font-size: 9.4pt; color: #d8d3cb; }
  .fecho .loc { font-size: 7.2pt; letter-spacing: .26em; color: #8a857c; margin-top: 4px; }
  .quebra { break-before: page; }
  </style></head><body>
  <section class="hero">
    <p class="eyebrow">${sigla}</p>
    <h1>${titulo}</h1>
    <p class="sub">${subtitulo}</p>
    <p class="meta"><b>Versão pública</b>${versao}</p>
    <p class="meta"><b>Condição-base</b><span class="hl">${destaque}</span></p>
    <p class="mail">${EMAIL}</p>
  </section>
  <p class="intro">${intro}</p>
  <div class="kpis">${kpis.map(([v, r]) => `<div class="kpi"><b>${v}</b><span>${r}</span></div>`).join('')}</div>
  ${condicoesHTML(P, !!P.cond['12x'] && Math.abs(P.cond['12x'].m2max - P.cond['12x'].m2min) < 1)}
  ${corpo}
  <p class="nota">Esta tabela é material de apoio comercial. Valores das tabelas aprovadas no CV CRM em ${dataBR(em)}; preços e condições sujeitos à tabela vigente na data da assinatura, à disponibilidade da unidade e ao contrato. A disponibilidade de cada unidade é confirmada pela Bracerum no momento da proposta.</p>
  <section class="fecho"><p class="eyebrow">Fale com a Bracerum</p><h2>${fecho}</h2><p>${EMAIL}</p><p class="loc">BRACERUM PARK · VILLETA, PARAGUAY</p></section>
  </body></html>`;
}

/* ------------------------------------------------------------------ os três produtos */
function casas(P, em) {
  const us = P.unidades;
  const area = us.reduce((s, u) => s + u.area, 0);
  const amin = Math.min(...us.map((u) => u.area));
  const r12 = P.cond['12x'];
  const linhas = us.map((u) => `<tr><td class="lote">${esc(u.quadra)} · Lote ${esc(u.un)}</td><td class="r">${m2(u.area)}</td><td class="r">${cel(u.c.vista)}</td><td class="r">${cel(u.c['12x'], true)}</td><td class="r">${cel(u.c['36x'])}</td></tr>`).join('');
  const padrao = us.find((u) => u.area === amin) || us[0];
  const maior = us.reduce((a, b) => (b.area > a.area ? b : a));
  return documento({
    P, em, sigla: 'Residence · Casas · Tabela de preços · Três condições',
    titulo: 'Tabela de preços — Residence · Casas',
    subtitulo: 'Lotes para casas no condomínio do Resort: preço por lote, em dólares (USD), por condição de pagamento',
    versao: `${esc(nomeTabela(P))} · aprovada no CV CRM · conferida em ${dataBR(em)} · válida até a publicação de nova tabela`,
    destaque: `20% + 12x a US$ ${nf(r12.m2)}/m² · à vista ${pct(P.cond.vista.ajuste)} · 20% + 36x ${pct(P.cond['36x'].ajuste)}`,
    intro: `Unidade de venda: o lote residencial do condomínio fechado de casas do Bracerum Park (Resort), nas quadras ${[...new Set(us.map((u) => u.quadra))].join(', ')}. Valor do lote = preço por m² × área do lote, na condição de pagamento escolhida. A tabela mostra cada lote com o valor nas três condições aprovadas: à vista, 20% + 12 parcelas mensais (preço de tabela) e 20% + 36 parcelas mensais.`,
    kpis: [[nf(P.total), 'lotes para casas à venda'], [m2(area), 'área total dos lotes'], [`a partir de ${m2(amin)}`, 'área do lote'], [`US$ ${nf(r12.m2)}/m²`, 'preço de tabela · 20% + 12x']],
    corpo: `<h2>Tabela · Lotes para casas <small>· valor por lote · ${esc(nomeTabela(P))}</small></h2>
      <table class="t"><thead><tr><th>Lote</th><th class="r">Área</th><th class="r">À vista</th><th class="r">20% + 12x</th><th class="r">20% + 36x</th></tr></thead><tbody>${linhas}</tbody></table>
      <h3>Como usar a tabela</h3>
      <ol><li>Escolha o lote pela quadra e pelo número (o mesmo nome do CV: quadra Q01 a Q04, lote 01 em diante).</li>
      <li>Escolha a condição: à vista (pagamento integral na assinatura), 20% + 12x ou 20% + 36x. O valor em destaque é o 20% + 12x, preço de tabela.</li>
      <li>O sinal é pago na assinatura; as parcelas são mensais. Os valores de sinal e parcela são os registrados no CV para cada lote.</li></ol>
      <h2>Exemplos de proposta</h2>
      ${exemplo(`${esc(padrao.quadra)} · Lote ${esc(padrao.un)} · ${m2(padrao.area)}`, 'lote de área padrão do condomínio', padrao.c)}
      ${exemplo(`${esc(maior.quadra)} · Lote ${esc(maior.un)} · ${m2(maior.area)}`, 'o maior lote da tabela', maior.c)}`,
    fecho: 'Conheça as casas do Bracerum Park Residence',
  });
}

const PLANTAS = {   // do folder do Residence (o mesmo texto da LP /folderresidence/)
  '1q': ['1 quarto', '1 vaga coberta · 1 banheiro · sacada'],
  '2q': ['2 quartos · suíte', '2 vagas (1 coberta) · 2 banheiros · sacada com churrasqueira'],
  '3q': ['3 quartos · suíte', '2 vagas (1 coberta) · 2 banheiros · sacada com churrasqueira'],
  cob: ['Cobertura duplex', '3 quartos · área gourmet com churrasqueira, pergolado e solarium · 2 vagas (1 coberta)'],
};
function faixasTorres(ts) {
  const n = ts.map((x) => Number(String(x).replace(/\D/g, ''))).sort((a, b) => a - b);
  const f = (v) => 'T' + String(v).padStart(2, '0');
  const out = [];
  for (let i = 0; i < n.length; i++) { let j = i; while (j + 1 < n.length && n[j + 1] === n[j] + 1) j++; out.push(i === j ? f(n[i]) : `${f(n[i])}–${f(n[j])}`); i = j; }
  return out.join(', ');
}
function aptos(P, em) {
  const torres = new Set(P.tipos.flatMap((g) => g.torres)).size;
  const areaTxt = (g) => (g.tipo === 'cob' ? `${m2(g.area)} + terraço<small>${m2(g.area * 2)} no total</small>` : m2(g.area));
  const linhas = P.tipos.map((g) => `<tr><td class="lote">${PLANTAS[g.tipo][0]}<small style="font-weight:400">${nf(g.qtd)} unid. · ${faixasTorres(g.torres)}</small></td><td class="r">${areaTxt(g)}</td><td class="r">${cel(g.c.vista)}</td><td class="r">${cel(g.c['12x'], true)}</td><td class="r">${cel(g.c['36x'])}</td></tr>`).join('');
  const plantas = ['1q', '2q', '3q', 'cob'].filter((k) => P.tipos.some((g) => g.tipo === k)).map((k) => {
    const gs = P.tipos.filter((g) => g.tipo === k);
    return `<tr><td><b>${PLANTAS[k][0]}</b></td><td>${gs.map((g) => (k === 'cob' ? `${m2(g.area * 2)} (${m2(g.area)} + terraço)` : m2(g.area))).join(' ou ')}</td><td class="muted">${PLANTAS[k][1]}</td><td class="r">${nf(gs.reduce((s, g) => s + g.qtd, 0))}</td><td style="white-space:nowrap">${faixasTorres([...new Set(gs.flatMap((g) => g.torres))])}</td></tr>`;
  }).join('');
  const g1 = P.tipos[0], g3 = P.tipos.find((g) => g.tipo === '3q') || P.tipos[P.tipos.length - 1];
  return documento({
    P, em, sigla: 'Residence · Apartamentos · Tabela de preços · Três condições',
    titulo: 'Tabela de preços — Residence · Apartamentos',
    subtitulo: 'Apartamentos de 1, 2 e 3 quartos e coberturas: preço por unidade, em dólares (USD), por tipologia e condição de pagamento',
    versao: `${esc(nomeTabela(P))} · aprovada no CV CRM · conferida em ${dataBR(em)} · válida até a publicação de nova tabela`,
    destaque: `20% + 12x a partir de ${usd(P.cond['12x'].min)} · à vista ${pct(P.cond.vista.ajuste)} · 20% + 36x ${pct(P.cond['36x'].ajuste)}`,
    intro: `Unidade de venda: o apartamento do Bracerum Park Residence, identificado no CV pela torre e pelo número (ex.: T01/302). As unidades de uma mesma tipologia têm o mesmo valor; a tabela agrupa as ${nf(P.total)} unidades por tipologia, com as torres onde estão e o valor nas três condições aprovadas: à vista, 20% + 12 parcelas mensais (preço de tabela) e 20% + 36 parcelas mensais.`,
    kpis: [[nf(P.total), 'apartamentos à venda'], [nf(torres), 'torres'], [`${nf(Object.keys(PLANTAS).filter((k) => P.tipos.some((g) => g.tipo === k)).length)} plantas`, '1, 2 e 3 quartos e cobertura'], [`${usd(P.cond['12x'].min)}`, 'a partir de · 20% + 12x']],
    corpo: `<h3>Plantas</h3>
      <table class="t"><thead><tr><th>Tipologia</th><th>Área privativa</th><th>O que tem</th><th class="r">Unidades</th><th>Torres</th></tr></thead><tbody>${plantas}</tbody></table>
      <h2>Tabela · Apartamentos <small>· valor por unidade · ${esc(nomeTabela(P))}</small></h2>
      <table class="t"><thead><tr><th>Tipologia</th><th class="r">Área privativa</th><th class="r">À vista</th><th class="r">20% + 12x</th><th class="r">20% + 36x</th></tr></thead><tbody>${linhas}</tbody></table>
      <h3>Como usar a tabela</h3>
      <ol><li>Escolha a tipologia (1, 2 ou 3 quartos ou cobertura). Na cobertura duplex, a área privativa do CV é a do andar de baixo; o terraço dobra a área total.</li>
      <li>Escolha a condição: à vista, 20% + 12x (preço de tabela, em destaque) ou 20% + 36x.</li>
      <li>A unidade exata (torre e número) é escolhida na proposta, conforme a disponibilidade no CV.</li></ol>
      <h2>Exemplos de proposta</h2>
      ${exemplo(`${PLANTAS[g1.tipo][0]} · ${m2(g1.area)}`, `ex.: unidade ${esc(g1.exemplos[0])}`, g1.c)}
      ${exemplo(`${PLANTAS[g3.tipo][0]} · ${m2(g3.area)}`, `ex.: unidade ${esc(g3.exemplos[0])}`, g3.c)}`,
    fecho: 'Conheça os apartamentos do Bracerum Park Residence',
  });
}

function outlet(P, em) {
  const nomeBloco = (b) => (/premium|outlet/i.test(b) ? 'Premium Outlet — 1ª fase' : /^lojas$/i.test(b) ? 'Lojas do Bracerum Market' : /super/i.test(b) ? 'Supermercado · Bracerum Market' : b);
  const pre = P.blocos.find((b) => /premium|outlet/i.test(b.nome)) || P.blocos[0];
  const resumo = P.blocos.map((b) => {
    const us = P.unidades.filter((u) => u.bloco === b.nome);
    const a = us.map((u) => u.area);
    return `<tr><td><b>${esc(nomeBloco(b.nome))}</b></td><td class="r">${nf(b.total)}</td><td class="r">${m2(b.area)}</td><td class="r">${Math.min(...a) === Math.max(...a) ? m2(a[0]) : `${m2(Math.min(...a))} a ${m2(Math.max(...a))}`}</td><td class="r"><b>${usd(Math.min(...us.map((u) => u.c['12x'].total)))}</b></td></tr>`;
  }).join('');
  const linhas = P.blocos.map((b) => `<tr class="grp"><td colspan="5">${esc(nomeBloco(b.nome))} <span>· ${nf(b.total)} ${b.total > 1 ? 'unidades' : 'unidade'} · ${m2(b.area)}</span></td></tr>`
    + P.unidades.filter((u) => u.bloco === b.nome).map((u) => `<tr><td class="lote">${esc(u.id)}</td><td class="r">${m2(u.area)}</td><td class="r">${cel(u.c.vista)}</td><td class="r">${cel(u.c['12x'], true)}</td><td class="r">${cel(u.c['36x'])}</td></tr>`).join('')).join('');
  const lojas = P.unidades.filter((u) => u.bloco === pre.nome);
  const menor = lojas.reduce((a, b) => (b.area < a.area ? b : a)), maior = lojas.reduce((a, b) => (b.area > a.area ? b : a));
  return documento({
    P, em, sigla: 'Bracerum Outlet · Tabela de preços · Três condições',
    titulo: 'Tabela de preços — Bracerum Outlet',
    subtitulo: 'Lojas do Premium Outlet (1ª fase), lojas e supermercado do Bracerum Market: preço por unidade, em dólares (USD), por condição de pagamento',
    versao: `${esc(nomeTabela(P))} · aprovada no CV CRM · conferida em ${dataBR(em)} · válida até a publicação de nova tabela`,
    destaque: `20% + 12x a US$ ${nf(P.cond['12x'].m2)}/m² · à vista ${pct(P.cond.vista.ajuste)} · 20% + 36x ${pct(P.cond['36x'].ajuste)}`,
    intro: `Unidade de venda: a loja ou o espaço comercial do Bracerum Outlet, de frente para a PY-19, identificado no CV pelo código da unidade. Valor = preço por m² × área da unidade, na condição de pagamento escolhida. Esta tabela traz as ${nf(pre.total)} lojas da 1ª fase do Premium Outlet (as duas pontas do Outlet ficam para a 2ª fase, de liberação futura), as lojas e o supermercado do Bracerum Market.`,
    kpis: [[nf(pre.total), 'lojas na 1ª fase do Premium Outlet'], [m2(pre.area), 'área vendável da 1ª fase'], [`US$ ${nf(P.cond['12x'].m2)}/m²`, 'preço de tabela · 20% + 12x'], [usd(P.cond['12x'].min), 'a partir de · 20% + 12x']],
    corpo: `<h3>Resumo por conjunto</h3>
      <table class="t"><thead><tr><th>Conjunto</th><th class="r">Unidades</th><th class="r">Área total</th><th class="r">Área da unidade</th><th class="r">A partir de · 20% + 12x</th></tr></thead><tbody>${resumo}</tbody></table>
      <h2 class="quebra">Tabela · Unidades <small>· valor por unidade · ${esc(nomeTabela(P))}</small></h2>
      <table class="t"><thead><tr><th>Unidade</th><th class="r">Área</th><th class="r">À vista</th><th class="r">20% + 12x</th><th class="r">20% + 36x</th></tr></thead><tbody>${linhas}</tbody></table>
      <h3>Como usar a tabela</h3>
      <ol><li>Escolha a unidade pelo código do CV (lojas do Premium Outlet "out/01" a "out/${String(pre.total).padStart(2, '0')}", lojas do Market "LJ1" em diante).</li>
      <li>Escolha a condição: à vista, 20% + 12x (preço de tabela, em destaque) ou 20% + 36x.</li>
      <li>O sinal é pago na assinatura; as parcelas são mensais. Os valores de sinal e parcela são os registrados no CV para cada unidade.</li></ol>
      <h2>Exemplos de proposta</h2>
      ${exemplo(`Loja ${esc(menor.id)} · ${m2(menor.area)} · a menor loja da 1ª fase do Premium Outlet`, '', menor.c)}
      ${exemplo(`Loja ${esc(maior.id)} · ${m2(maior.area)} · a maior loja da 1ª fase do Premium Outlet`, '', maior.c)}`,
    fecho: 'Garanta a sua loja no Bracerum Outlet — de frente para a PY-19',
  });
}

/* Prévia da biblioteca (960 × 720, o 4:3 do cartão): capa no estilo da tabela — fundo escuro, dourado,
   título grande em Caladea. O canto de cima à esquerda fica livre para a etiqueta "Tabelas e mapas". */
const preco = (P, id) => (id === 'aptos' ? `a partir de ${usd(P.cond['12x'].min)}` : `US$ ${nf(P.cond['12x'].m2)}/m²`);
async function capa(b, arq, titulo, linha, valor) {
  const pg = await b.newPage({ viewport: { width: 480, height: 360 }, deviceScaleFactor: 2 });
  await pg.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:480px;height:360px;background:#1a1a1e;color:#f9f5ef;font-family:Carlito,sans-serif}
    .c{position:absolute;left:34px;right:30px;bottom:30px}
    .e{font-size:10px;font-weight:700;letter-spacing:.32em;color:#b4904b;text-transform:uppercase;margin:0 0 12px}
    h1{font-family:Caladea,serif;font-weight:700;font-size:40px;line-height:1.05;margin:0 0 14px}
    .l{font-size:13px;color:#a9a49c;margin:0 0 14px}
    .v{display:inline-block;font-family:Caladea,serif;font-weight:700;font-size:24px;color:#b4904b;border-top:1px solid #3a3a3e;padding-top:12px}
  </style></head><body><div class="c"><p class="e">Bracerum Park · Tabela de preços</p><h1>${titulo}</h1><p class="l">${esc(linha)}</p><span class="v">${valor}</span></div></body></html>`);
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: path.join(THUMBS, `tabela-${arq}.jpg`), type: 'jpeg', quality: 85 });
  await pg.close();
}

const PRODUTOS = [
  { id: 'casas', arq: 'residence-casas', rot: 'RESIDENCE · CASAS', fn: casas, capa: () => 'Residence<br>Casas' },
  { id: 'aptos', arq: 'residence-aptos', rot: 'RESIDENCE · APARTAMENTOS', fn: aptos, capa: () => 'Residence<br>Apartamentos' },
  { id: 'outlet', arq: 'outlet-premium', rot: 'BRACERUM OUTLET', fn: outlet, capa: () => 'Bracerum<br>Outlet' },
];

(async () => {
  let snap = JSON.parse(fs.readFileSync(RETRATO, 'utf8'));
  if (process.argv.includes('--cv')) {
    const { lerTabelasCV } = require(path.join(RAIZ, 'api/_portal-tabelas.js'));
    const produtos = await lerTabelasCV();
    const em = new Date().toISOString();
    snap = { origem: 'CV CRM · tabelas de preço aprovadas (retrato inicial do repositório)', ultimaTentativa: em, ultimoSucesso: em, resultado: 'ok', erro: null, produtos };
    fs.writeFileSync(RETRATO, JSON.stringify(snap) + '\n');
    console.log('retrato atualizado do CV em', em);
  }
  const em = snap.ultimoSucesso;
  const b = await chromium.launch();
  for (const pr of PRODUTOS) {
    const P = snap.produtos[pr.id];
    const html = pr.fn(P, em);
    const pg = await b.newPage();
    await pg.setContent(html, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const topo = `<div style="width:100%;margin:0 17mm;padding-top:7mm;font:6.6pt Carlito,sans-serif;color:#8a857c;display:flex;gap:14px;-webkit-print-color-adjust:exact">
      <b style="color:#b4904b;letter-spacing:.32em">BRACERUM PARK</b><span>${mesAno(em)} · ${esc(nomeTabela(P))} · aprovada no CV CRM · à vista · 20% + 12x · 20% + 36x</span></div>`;
    const pe = `<div style="width:100%;margin:0 17mm;padding-bottom:6mm;font:6.6pt Carlito,sans-serif;color:#8a857c;display:flex;justify-content:space-between">
      <span style="letter-spacing:.32em">BRACERUM PARK</span><span>${pr.rot} · Versão pública</span><span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`;
    const saida = path.join(MAT, `bracerum-${pr.arq}-tabela-de-precos.pdf`);
    await pg.pdf({ path: saida, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: topo, footerTemplate: pe, preferCSSPageSize: true });
    await capa(b, pr.arq, pr.capa(P), `${nomeTabela(P)} · aprovada no CV`, preco(P, pr.id));
    await pg.close();
    console.log(pr.id, '→', path.relative(RAIZ, saida), Math.round(fs.statSync(saida).size / 1024), 'KB');
  }
  // a tabela dos lotes é o PDF do cliente; só a capa da biblioteca sai daqui (números da versão pública P1 v3.1)
  await capa(b, 'park-loteamentos-industriais', 'Loteamentos<br>industriais', 'P1 v3.1 · lançamento até 15/01/2027', 'US$ 160/m² · Padrão');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
