/**
 * Bracerum Park — cadastro de corretores → planilha "Leads Corretores" (Google Drive).
 *
 * Colar em: planilha → Extensões → Apps Script (substituindo o que estiver lá) e publicar como
 * "App da Web" (Executar como: Eu · Quem pode acessar: Qualquer pessoa). A URL /exec vai na
 * variável CORRETORES_PLANILHA_URL da Vercel. Passo a passo em docs/corretores.md.
 *
 * Quem chama é só a função /api/corretor do site (a URL fica guardada na Vercel); a página
 * nunca vê este endereço. Cada cadastro vira uma linha na PRIMEIRA aba da planilha; na primeira
 * vez o script escreve o cabeçalho.
 */
var CABECALHO = ['Data', 'Nome', 'WhatsApp', 'Imobiliária', 'Abrir conversa', 'Idioma', 'Origem', 'Página'];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);   // dois cadastros ao mesmo tempo não disputam a mesma linha
    var d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!d.nome || !d.whatsapp) return saida({ ok: false, erro: 'dados incompletos' });

    var aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (aba.getLastRow() === 0) {
      aba.appendRow(CABECALHO);
      aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
      aba.setFrozenRows(1);
    }
    var quando = d.data ? new Date(d.data) : new Date();
    aba.appendRow([quando, texto(d.nome), texto(d.whatsapp), texto(d.imobiliaria), texto(d.conversa),
                   texto(d.idioma), texto(d.origem), texto(d.pagina)]);
    var n = aba.getLastRow();
    aba.getRange(n, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    return saida({ ok: true, linha: n });
  } catch (err) {
    return saida({ ok: false, erro: String((err && err.message) || err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Abrir a URL /exec no navegador mostra {"ok":true,...}: confirma que a publicação está no ar.
function doGet() {
  return saida({ ok: true, planilha: SpreadsheetApp.getActiveSpreadsheet().getName() });
}

// Sempre texto: o que começa com = + - @ viraria fórmula (e o WhatsApp começa com "+").
function texto(v) {
  v = String(v == null ? '' : v).slice(0, 300);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function saida(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
