/*
  Regras puras do Portal do Corretor — sem armazenamento, sem rede. Usadas por api/portal.js e pelos
  testes (tests/portal.test.js). O "_" no nome impede a Vercel de publicar este arquivo como função.

  Fonte comercial (decisão documentada em docs/portal-corretores.md §7):
    · Unidade (id "Q07.L014", quadra, área de contrato, categoria) → 3dmasterplan/data/lotes.json
      (gerado do PDF do Masterplan V14 rev. 02/11/2026). É a MESMA identidade usada pela maquete e pelo CV.
    · Situação (disponível/reservado/vendido/indisponível) → CV CRM, mapa de disponibilidade do
      empreendimento 4, via lerCV() de api/lotes-status.js. Fica num retrato (snapshot) com última
      tentativa, último sucesso e resultado.
    · Preço → 3dmasterplan/data/precos.json (Política Comercial P1, Tabela v3.1, versão pública), em USD por m².
  Nenhuma dessas três fontes é editável pelo portal.
*/
'use strict';

/* ------------------------------------------------------------------ fuso e datas */
const FUSO_PADRAO = 'America/Asuncion';
function fuso() {
  const f = process.env.PORTAL_FUSO || FUSO_PADRAO;
  try { new Intl.DateTimeFormat('en-US', { timeZone: f }); return f; } catch (e) { return FUSO_PADRAO; }
}
// deslocamento (ms) do fuso no instante t: hora local − UTC
function deslocamento(t, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(new Date(t)).filter((x) => x.type !== 'literal').map((x) => [x.type, Number(x.value)]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - t;
}
// "2026-12-31T23:59" no fuso comercial → ISO em UTC. Devolve null se inválido.
function localParaUTC(local, tz = fuso()) {
  const s0 = String(local || '').trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(s0)) {   // já traz o fuso: não há o que converter
    const t0 = Date.parse(s0);
    return Number.isNaN(t0) ? null : new Date(t0).toISOString();
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(String(local || '').trim());
  if (!m) return null;
  const ingenuo = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  if (Number.isNaN(ingenuo)) return null;
  let t = ingenuo - deslocamento(ingenuo, tz);
  t = ingenuo - deslocamento(t, tz);              // segunda passada acerta a virada de horário de verão
  return new Date(t).toISOString();
}
// ISO em UTC → "2026-12-31T23:59" no fuso comercial (para preencher <input type=datetime-local>)
function utcParaLocal(iso, tz = fuso()) {
  if (!iso) return '';
  const t = Date.parse(iso);
  const d = new Date(t + deslocamento(t, tz));
  return d.toISOString().slice(0, 16);
}
function formataLocal(iso, tz = fuso(), lang = 'pt-BR') {
  return new Intl.DateTimeFormat(lang, { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}
const NOME_FUSO = { 'America/Asuncion': 'horário de Assunção', 'America/Sao_Paulo': 'horário de Brasília' };
const nomeFuso = (tz = fuso()) => NOME_FUSO[tz] || tz;

/* ------------------------------------------------------------------ dados comerciais */
const SIT = { r: 'reservado', v: 'vendido', b: 'indisponivel' };
const minutos = (nome, padrao) => { const v = Number(process.env[nome]); return v > 0 ? v : padrao; };
// Política de atualização (configurável — NÃO é requisito comercial):
//   PORTAL_SYNC_MIN        intervalo mínimo entre consultas ao CV disparadas pelo portal (padrão 5 min)
//   PORTAL_DADOS_MAX_MIN   idade máxima do último sucesso para o dado contar como "atual" (padrão 60 min)
const politica = () => ({ syncMin: minutos('PORTAL_SYNC_MIN', 5), maxIdadeMin: minutos('PORTAL_DADOS_MAX_MIN', 60) });

function estadoSync(snap, agora = Date.now()) {
  if (!snap || !snap.ultimoSucesso) return 'indisponivel';
  const idade = (agora - Date.parse(snap.ultimoSucesso)) / 60000;
  return idade <= politica().maxIdadeMin ? 'atual' : 'desatualizado';
}
// Junta a tentativa nova ao retrato anterior SEM marcar sucesso falso: em falha, situações e
// ultimoSucesso ficam como estavam; só ultimaTentativa/resultado/erro mudam.
function registrarSync(anterior, tentativa) {
  const base = anterior || { origem: 'CV CRM · mapa de disponibilidade', lotes: {}, total: 0, ultimoSucesso: null };
  const agora = new Date(tentativa.em || Date.now()).toISOString();
  if (tentativa.ok) {
    return { ...base, origem: tentativa.origem || base.origem, ultimaTentativa: agora, ultimoSucesso: agora, resultado: 'ok', erro: null,
      total: tentativa.total, lotes: { ...tentativa.lotes }, desconhecidas: tentativa.desconhecidas || [] };
  }
  return { ...base, ultimaTentativa: agora, resultado: 'erro', erro: String(tentativa.erro || 'falha').slice(0, 200) };
}
function situacaoDe(id, snap) {
  if (!snap || !snap.ultimoSucesso) return 'desconhecida';
  return SIT[(snap.lotes || {})[id]] || 'disponivel';
}

/* ------------------------------------------------------------------ preço (Tabela v3.1) */
function janelaVigente(precos, agora = Date.now(), tz = fuso()) {
  const hoje = utcParaLocal(new Date(agora).toISOString(), tz).slice(0, 10);
  return precos.janelas.find((j) => (!j.de || j.de <= hoje) && (!j.ate || hoje <= j.ate)) || precos.janelas[precos.janelas.length - 1];
}
const PAG = { '12x': 0, vista: 1, '36x': 2 };
// US$/m² × área de contrato. Inteiro como na fonte; moeda explícita.
function precoLote(lote, precos, { janela, pagamento = '12x', faixa = 0 } = {}) {
  const j = janela || janelaVigente(precos).id;
  const linha = ((precos.precos[j] || {})[lote.cat] || [])[faixa];
  if (!linha) return null;
  const m2 = linha[PAG[pagamento]];
  return { moeda: 'USD', m2, total: m2 * lote.a, janela: j, pagamento, faixa, tabela: precos.tabela };
}

/* ------------------------------------------------------------------ ofertas */
// Elegível = publicada + dentro da vigência [início, fim) + retrato comercial atual + todas as
// unidades existem e estão disponíveis. Vale para a lista E para o download do card.
function elegibilidade(oferta, { snap, unidades, agora = Date.now() }) {
  if (!oferta) return { ok: false, motivo: 'inexistente' };
  if (oferta.status !== 'publicada') return { ok: false, motivo: oferta.status === 'encerrada' ? 'encerrada' : 'nao_publicada' };
  const ini = Date.parse(oferta.inicio), fim = Date.parse(oferta.fim);
  if (!(ini < fim)) return { ok: false, motivo: 'vigencia_invalida' };
  if (agora < ini) return { ok: false, motivo: 'ainda_nao_comecou' };
  if (agora >= fim) return { ok: false, motivo: 'expirada' };
  const ids = oferta.unidades || [];
  if (ids.length) {
    if (estadoSync(snap, agora) !== 'atual') return { ok: false, motivo: 'dados_comerciais_desatualizados' };
    for (const id of ids) {
      if (!unidades.has(id)) return { ok: false, motivo: 'unidade_inexistente', unidade: id };
      const s = situacaoDe(id, snap);
      if (s !== 'disponivel') return { ok: false, motivo: 'unidade_' + s, unidade: id };
    }
  }
  return { ok: true };
}
const MOTIVOS = {
  inexistente: 'Oferta não encontrada', nao_publicada: 'Rascunho (não publicada)', encerrada: 'Encerrada',
  vigencia_invalida: 'Vigência inválida', ainda_nao_comecou: 'Ainda não começou', expirada: 'Expirada',
  dados_comerciais_desatualizados: 'Dados comerciais desatualizados — aguarde a sincronização com o CV',
  unidade_inexistente: 'Unidade não existe na base', unidade_reservado: 'Unidade reservada',
  unidade_vendido: 'Unidade vendida', unidade_indisponivel: 'Unidade indisponível', unidade_desconhecida: 'Situação da unidade desconhecida',
};
const motivoTexto = (e) => (e.ok ? 'Elegível' : `${MOTIVOS[e.motivo] || e.motivo}${e.unidade ? ` (${e.unidade})` : ''}`);

// valor decimal em texto, até 2 casas ("150000", "1250.50"); null se vazio
function valorDecimal(v) {
  const s = String(v == null ? '' : v).trim().replace(',', '.');
  if (!s) return null;
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(s)) return undefined;
  return s;
}
const fmtUSD = (s) => {
  const [i, d] = String(s).split('.');
  return `US$ ${i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${d ? ',' + d.padEnd(2, '0') : ''}`;
};

/* ------------------------------------------------------------------ card de WhatsApp (SVG gerado no servidor) */
const xml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
function quebra(texto, max, linhas) {
  const out = []; let atual = '';
  for (const p of String(texto || '').replace(/\s+/g, ' ').trim().split(' ')) {
    if ((atual + ' ' + p).trim().length > max) { if (atual) out.push(atual); atual = p; } else atual = (atual + ' ' + p).trim();
    if (out.length >= linhas) break;
  }
  if (atual && out.length < linhas) out.push(atual);
  if (out.length === linhas && String(texto).length > out.join(' ').length) out[linhas - 1] = out[linhas - 1].replace(/.{0,2}$/, '…');
  return out;
}
function cardSVG(oferta, { unidades, precos, tz = fuso(), agora = Date.now() }) {
  const W = 1080, H = 1350;
  const t = (y, txt, size, peso = 400, cor = '#0b0b0b', extra = '') => `<text x="80" y="${y}" font-size="${size}" font-weight="${peso}" fill="${cor}" ${extra}>${xml(txt)}</text>`;
  const linhasTit = quebra(oferta.titulo, 22, 3);
  let y = 300;
  const partes = [];
  linhasTit.forEach((l) => { partes.push(t(y, l, 76, 400, '#ffffff', 'letter-spacing="-2"')); y += 88; });
  y += 30;
  quebra(oferta.condicoes || oferta.descricao, 44, 5).forEach((l) => { partes.push(t(y, l, 34, 400, '#e8e8e6')); y += 48; });
  const lots = (oferta.unidades || []).map((id) => unidades.get(id)).filter(Boolean);
  let bloco = '';
  let by = 860;
  if (oferta.valor) {
    bloco += t(by, fmtUSD(oferta.valor), 72, 500, '#0b0b0b'); by += 56;
    bloco += t(by, oferta.valorRotulo || 'valor da oferta', 26, 400, '#555'); by += 50;
  }
  lots.slice(0, 4).forEach((l) => {
    const p = precos ? precoLote(l, precos) : null;
    bloco += t(by, `Lote ${l.id} · ${l.a.toLocaleString('pt-BR')} m²${!oferta.valor && p ? ` · ${fmtUSD(String(p.total))}` : ''}`, 30, 500, '#0b0b0b'); by += 44;
  });
  if (lots.length > 4) { bloco += t(by, `+ ${lots.length - 4} lotes`, 26, 400, '#555'); by += 40; }
  if (!oferta.valor && lots.length && precos) { bloco += t(by, `Tabela ${precos.tabela} · 20% + 12x · valores em US$`, 22, 400, '#777'); }
  const validade = `Válida até ${formataLocal(oferta.fim, tz)} (${nomeFuso(tz)})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" fill="#0b0b0b"/>
  <text x="80" y="120" font-size="30" font-weight="700" fill="#ffffff" letter-spacing="6">BRACERUM PARK</text>
  <text x="80" y="165" font-size="26" fill="#9b9b97">${xml(oferta.campanha || 'Oferta')}</text>
  ${partes.join('\n  ')}
  <rect x="40" y="790" width="${W - 80}" height="${H - 790 - 40}" rx="28" fill="#ffffff"/>
  ${bloco}
  <text x="80" y="${H - 150}" font-size="28" font-weight="700" fill="#0b0b0b">${xml(validade)}</text>
  <text x="80" y="${H - 105}" font-size="22" fill="#555">Sujeito à disponibilidade no momento da reserva. Villeta · Paraguay · bracerumpark.com</text>
  <text x="80" y="${H - 72}" font-size="18" fill="#999">Gerado em ${xml(formataLocal(new Date(agora).toISOString(), tz))} · ref. ${xml(oferta.id)}</text>
</svg>`;
}

/* ------------------------------------------------------------------ solicitações ao marketing */
// Enviada → Em análise → Em produção → Concluída; Cancelada como término alternativo.
const ETAPAS_PEDIDO = ['enviada', 'analise', 'producao', 'concluida', 'cancelada'];
const LEGADO_PEDIDO = { recebido: 'enviada', aprovacao: 'producao', entregue: 'concluida', cancelado: 'cancelada' };
const statusPedido = (s) => LEGADO_PEDIDO[s] || (ETAPAS_PEDIDO.includes(s) ? s : 'enviada');
const TERMINAIS = ['concluida', 'cancelada'];
function transicaoValida(de, para) {
  de = statusPedido(de);
  if (!ETAPAS_PEDIDO.includes(para) || de === para) return false;
  if (TERMINAIS.includes(de)) return false;                    // reabertura não faz parte desta entrega
  return true;
}

module.exports = {
  FUSO_PADRAO, fuso, localParaUTC, utcParaLocal, formataLocal, nomeFuso, politica, estadoSync, registrarSync,
  situacaoDe, janelaVigente, precoLote, elegibilidade, motivoTexto, MOTIVOS, valorDecimal, fmtUSD, cardSVG,
  ETAPAS_PEDIDO, statusPedido, transicaoValida, TERMINAIS,
};
