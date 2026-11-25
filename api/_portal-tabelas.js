'use strict';
/*
  Tabelas de preço dos outros produtos no Portal do Corretor (2026-11-25):
  Bracerum Park Residence — Casas, Residence — Aptos e Bracerum Outlet. Os lotes industriais
  continuam na Tabela v3.1 (3dmasterplan/data/precos.json), que é a versão pública em PDF.

  Fonte: as tabelas APROVADAS no CV CRM, as mesmas que a reserva usa —
    GET https://<CVCRM_HOST>/api/v1/cadastros/empreendimentos/<id>/tabelasdepreco/detalhada?aprovado=S&tabelasemjson=true
    (cabeçalhos email + token). Empreendimento 7 = Residence (blocos "Quadra Qxx (Resort)" = casas,
    "Torre Txx" = apartamentos) · 9 = Bracerum Outlet (Premium Outlet 1ª fase, Lojas do Market, Supermercado).
  Cada tabela do CV é uma condição de pagamento ("… - Á vista", "… - x12", "… - x36") e traz, por unidade,
  valor total e séries (SINAL 1×, MENSAL n×). O CV não filtra por tabela e demora 20–30 s para o
  empreendimento 7 (1.483 unidades × 3 tabelas), por isso o portal guarda um retrato resumido e
  atualiza em segundo plano (api/portal.js). Este arquivo só lê e resume — não grava nada.
*/
const CV_HOST = () => process.env.CVCRM_HOST || 'bracerum.cvcrm.com.br';
const EMP = () => ({ residence: Number(process.env.CVCRM_EMP_RESIDENCE || 7), outlet: Number(process.env.CVCRM_EMP_OUTLET || 9) });
const CONDS = ['vista', '12x', '36x'];

// "69.000,00" | "972182.50" | 13800 → número
function num(v) {
  if (typeof v === 'number') return v;
  const s = String(v == null ? '' : v).trim();
  if (!s) return 0;
  return Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s) || 0;
}
function condDe(nome) {
  const s = String(nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (/vista/.test(s)) return 'vista';
  if (/36/.test(s)) return '36x';
  if (/12/.test(s)) return '12x';
  return null;
}
const dataISO = (s) => { const m = String(s || '').match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? `${m[3]}-${m[2]}-${m[1]}` : null; };

async function lerEmp(id, fetchFn) {
  const email = process.env.CVCRM_EMAIL, token = process.env.CVCRM_TOKEN;
  if (!email || !token) throw new Error('integração com o CV não configurada neste ambiente');
  const r = await fetchFn(`https://${CV_HOST()}/api/v1/cadastros/empreendimentos/${id}/tabelasdepreco/detalhada?aprovado=S&tabelasemjson=true`,
    { headers: { email, token, accept: 'application/json' } });
  if (!r.ok) throw new Error(`CV respondeu ${r.status} às tabelas do empreendimento ${id}`);
  const d = await r.json();
  if (!d || !Array.isArray(d.tabelas)) throw new Error(`CV sem tabelas aprovadas no empreendimento ${id}`);
  return d.tabelas;
}

/* Junta as tabelas (uma por condição) numa lista de unidades: { bloco, un, area, sit, etapa, c: { vista|12x|36x: {...} } } */
function unidadesDe(tabelas) {
  const fontes = [], porId = new Map();
  for (const tb of tabelas) {
    const cond = condDe(tb.tabela);
    if (!cond) continue;
    fontes.push({ id: tb.idtabela, nome: String(tb.tabela || '').trim(), cond });
    for (const x of tb.dados || []) {
      const k = x.idunidade || `${x.bloco}|${x.unidade}`;
      const u = porId.get(k) || { bloco: String(x.bloco || '').trim(), un: String(x.unidade || '').trim(), area: num(x.area_privativa), sit: String(x.situacao || '').trim(), etapa: String(x.etapa || '').trim(), c: {} };
      const series = x.series || [];
      const sinal = series.find((s) => /sinal|entrada|ato/i.test(s.nome)) || series[0] || {};
      const mensal = series.find((s) => /mensa/i.test(s.nome));
      u.c[cond] = {
        total: num(x.valor_total),
        sinal: num(sinal.valor) * (Number(sinal.qtd_parcelas) || 1),
        n: mensal ? Number(mensal.qtd_parcelas) || 0 : 0,
        parcela: mensal ? num(mensal.valor) : 0,
        venc: dataISO(sinal.data_vencimento),
      };
      porId.set(k, u);
    }
  }
  return { fontes, unidades: [...porId.values()] };
}

const r2 = (v) => Math.round(v * 100) / 100;
// US$/m² e ajuste de cada condição sobre o 20% + 12x, pela mediana (o CV arredonda centavos por unidade).
function resumoCond(lista) {
  const out = {};
  for (const c of CONDS) {
    const m2 = lista.filter((u) => u.c[c] && u.area).map((u) => u.c[c].total / u.area).sort((a, b) => a - b);
    const aj = lista.filter((u) => u.c[c] && u.c['12x'] && u.c['12x'].total).map((u) => u.c[c].total / u.c['12x'].total).sort((a, b) => a - b);
    if (!m2.length) continue;
    out[c] = { m2: r2(m2[Math.floor(m2.length / 2)]), m2min: r2(m2[0]), m2max: r2(m2[m2.length - 1]),
      ajuste: aj.length ? Math.round((aj[Math.floor(aj.length / 2)] - 1) * 1000) / 10 : null,
      min: Math.min(...lista.filter((u) => u.c[c]).map((u) => u.c[c].total)) };
  }
  return out;
}
const livre = (u) => /dispon/i.test(u.sit);
const valores = (u) => Object.fromEntries(CONDS.filter((c) => u.c[c]).map((c) => [c, u.c[c]]));

/* ---- casas: um lote do Resort por linha */
function casas(lista) {
  const us = lista.filter((u) => /resort/i.test(u.bloco))
    .map((u) => ({ id: `${(u.bloco.match(/Q\d+/) || [u.bloco])[0]}.L${u.un.padStart(2, '0')}`, quadra: (u.bloco.match(/Q\d+/) || [u.bloco])[0], un: u.un, area: u.area, sit: u.sit, etapa: u.etapa, c: valores(u) }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return { unidades: us, total: us.length, livres: us.filter(livre).length, cond: resumoCond(us) };
}

/* ---- apartamentos: agrupados por tipologia (área privativa + valor); torres listadas.
   Mesma área com preço maior = cobertura (no CV a cobertura duplex de 194,80 m² entra com os 97,40 m² do andar de baixo). */
function tipoApto(area) {
  if (area < 60) return '1q';
  if (area < 85) return '2q';
  return '3q';
}
function aptos(lista) {
  const ts = lista.filter((u) => /^torre/i.test(u.bloco));
  const grupos = new Map();
  for (const u of ts) {
    const v = (u.c['12x'] || u.c.vista || u.c['36x'] || {}).total || 0;
    const k = `${u.area}|${v}`;
    const g = grupos.get(k) || { area: u.area, ref: v, unidades: [], torres: new Set() };
    g.unidades.push(u); g.torres.add((u.bloco.match(/T\d+/) || [u.bloco])[0]);
    grupos.set(k, g);
  }
  const lst = [...grupos.values()].sort((a, b) => a.area - b.area || a.ref - b.ref);
  const tipos = lst.map((g) => {
    const mesmos = lst.filter((x) => x.area === g.area);
    const cob = mesmos.length > 1 && g.ref === Math.max(...mesmos.map((x) => x.ref));
    const u0 = g.unidades[0];
    return {
      tipo: cob ? 'cob' : tipoApto(g.area), area: g.area, qtd: g.unidades.length, livres: g.unidades.filter(livre).length,
      torres: [...g.torres].sort((a, b) => a.localeCompare(b, 'pt', { numeric: true })), etapa: u0.etapa, c: valores(u0),
      exemplos: g.unidades.slice(0, 3).map((u) => `${(u.bloco.match(/T\d+/) || [u.bloco])[0]}/${u.un}`),
    };
  });
  return { tipos, total: ts.length, livres: ts.filter(livre).length, cond: resumoCond(ts) };
}

/* ---- outlet: uma loja por linha, separada por bloco (1ª fase do Premium Outlet, Lojas do Market, Supermercado) */
function outlet(lista) {
  const ordem = (b) => (/premium|outlet/i.test(b) ? 0 : /loja/i.test(b) ? 1 : /super/i.test(b) ? 2 : 3);
  const us = lista.map((u) => ({ id: u.un, bloco: u.bloco, area: u.area, sit: u.sit, etapa: u.etapa, c: valores(u) }))
    .sort((a, b) => ordem(a.bloco) - ordem(b.bloco) || a.bloco.localeCompare(b.bloco) || a.id.localeCompare(b.id, 'pt', { numeric: true }));
  const blocos = [...new Set(us.map((u) => u.bloco))].map((b) => {
    const x = us.filter((u) => u.bloco === b);
    return { nome: b, total: x.length, livres: x.filter(livre).length, area: x.reduce((s, u) => s + u.area, 0) };
  });
  return { unidades: us, blocos, total: us.length, livres: us.filter(livre).length, cond: resumoCond(us) };
}

// Resumo de um empreendimento já lido (separado para os testes e para gerar o retrato inicial).
function resumir({ residence, outlet: tOutlet }) {
  const r = unidadesDe(residence), o = unidadesDe(tOutlet);
  const nome = (t) => (t[0] && String(t[0].empreendimento || '').trim()) || '';
  return {
    casas: { emp: EMP().residence, empreendimento: nome(residence), tabelas: r.fontes, ...casas(r.unidades) },
    aptos: { emp: EMP().residence, empreendimento: nome(residence), tabelas: r.fontes, ...aptos(r.unidades) },
    outlet: { emp: EMP().outlet, empreendimento: nome(tOutlet), tabelas: o.fontes, ...outlet(o.unidades) },
  };
}

async function lerTabelasCV(fetchFn = fetch) {
  const e = EMP();
  const [residence, tOutlet] = await Promise.all([lerEmp(e.residence, fetchFn), lerEmp(e.outlet, fetchFn)]);
  const p = resumir({ residence, outlet: tOutlet });
  for (const k of Object.keys(p)) if (!p[k].total) throw new Error(`CV sem unidades na tabela de ${k}`);
  return p;
}

module.exports = { lerTabelasCV, resumir, condDe, num };
