/* =====================================================================
   Bracerum Park — cadastro rápido de lead (/cadastro/)
   Nome, telefone, empresa e interesse → POST /api/lead (lp "cadastro") → lead no CV CRM.

   O cadastro nunca se perde: se a internet ou o CV falharem, ele fica na fila do aparelho
   (localStorage) e sobe sozinho quando der — ao voltar a conexão, a cada 30 s e ao abrir
   a página. O CV não duplica: mesmo telefone = mesmo lead (a função manda permitir_alteracao).
   Só o erro de preenchimento (422) não entra na fila — volta para o campo.

   Origem no CV: os utm_* da URL, se houver; sem eles, ORIGEM_PADRAO (a feira, como no /admin/).
   Documentação: docs/cadastro-lead.md.
   ===================================================================== */
(function () {
  'use strict';

  // Sem utm na URL, o lead entra como o da feira (mesma mídia do painel de reservas).
  // Para outro evento, mude aqui ou abra a página com ?utm_source=…&utm_medium=…&utm_campaign=…
  var ORIGEM_PADRAO = { utm_source: 'feira', utm_medium: 'evento', utm_campaign: 'expo-py-br' };
  var PRAZO_MS = 15000;                       // envio que demora mais que isso vai para a fila
  var K_FILA = 'bp-cadastro-fila', K_HIST = 'bp-cadastro-hist', K_DDI = 'bp-cadastro-ddi';

  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ler = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  var gravar = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  var hora = function (iso) { try { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };

  var form = $('#form'), btn = $('#enviar'), alerta = $('#alerta');
  var T0 = Date.now(), enviando = false, esvaziando = false;

  /* ---------- origem (utm) ---------------------------------------------- */
  function atribuicao() {
    var q = new URLSearchParams(location.search), o = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) {
      var v = q.get(k); if (v) o[k] = v.slice(0, 120);
    });
    if (!o.utm_source && !o.gclid && !o.fbclid) Object.keys(ORIGEM_PADRAO).forEach(function (k) { o[k] = ORIGEM_PADRAO[k]; });
    return { last: o };
  }

  /* ---------- telefone -------------------------------------------------- */
  var ddiSel = form.ddi, ddiOutro = form.ddiOutro;
  var ddiSalvo = ler(K_DDI, '55');
  if ([].some.call(ddiSel.options, function (o) { return o.value === ddiSalvo; })) ddiSel.value = ddiSalvo;
  var mostrarOutro = function () { ddiOutro.hidden = ddiSel.value !== ''; };
  ddiSel.addEventListener('change', function () { mostrarOutro(); if (ddiSel.value === '') ddiOutro.focus(); });
  mostrarOutro();
  var ddiDe = function () { return String(ddiSel.value === '' ? ddiOutro.value : ddiSel.value).replace(/\D/g, ''); };

  /* ---------- validação ------------------------------------------------- */
  function marcar(campo, msg) {
    var f = form.querySelector('[data-campo="' + campo + '"]'); if (!f) return;
    f.classList.toggle('is-err', !!msg);
    var e = f.querySelector('.field__err'); if (e) { e.textContent = msg || ''; e.hidden = !msg; }
  }
  function validar() {
    var nome = form.nome.value.replace(/\s+/g, ' ').trim();
    var tel = form.telefone.value.replace(/\D/g, '');
    var ddi = ddiDe();
    tel = tel.replace(/^0+/, '');                       // PY escreve 0985…, BR 047…: com o código do país o zero sai
    var esc1 = form.querySelector('input[name="interesse"]:checked');
    var erros = {};
    if (nome.length < 2) erros.nome = 'Escreva o nome.';
    if (!ddi) erros.telefone = 'Falta o código do país.';
    else if (tel.length < (ddi === '55' ? 10 : 7) || tel.length > 15) erros.telefone = ddi === '55' ? 'Telefone com DDD (ex.: 47 98803-0200).' : 'Confira o número.';
    if (!esc1) erros.interesse = 'Escolha o interesse.';
    ['nome', 'telefone', 'interesse'].forEach(function (c) { marcar(c, erros[c]); });
    return { erros: erros, dados: { nome: nome, tel: tel, ddi: ddi, empresa: form.empresa.value.replace(/\s+/g, ' ').trim(), escolha: esc1 } };
  }
  // corrigiu o campo: some a marca dele e, sem nenhuma marca, some o aviso do topo
  var limpar = function (c) { marcar(c, ''); if (!form.querySelector('.is-err')) alerta.hidden = true; };
  ['nome', 'telefone'].forEach(function (n) { form[n].addEventListener('input', function () { limpar(n); }); });
  ddiOutro.addEventListener('input', function () { limpar('telefone'); });
  form.querySelectorAll('input[name="interesse"]').forEach(function (i) { i.addEventListener('change', function () { limpar('interesse'); }); });

  function avisar(titulo, txt) {
    if (!titulo) { alerta.hidden = true; return; }
    alerta.innerHTML = '<b>' + esc(titulo) + '</b>' + esc(txt || '');
    alerta.hidden = false; alerta.focus();
  }

  /* ---------- envio ------------------------------------------------------- */
  // devolve { ok, idlead } · { ok:false, campo } (preenchimento) · { ok:false, rede:true } (vai para a fila)
  function enviar(corpo) {
    var ctl = 'AbortController' in window ? new AbortController() : null;
    var prazo = setTimeout(function () { if (ctl) ctl.abort(); }, PRAZO_MS);
    return fetch('/api/lead', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo), signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) {
          if (r.ok && d && d.ok) return { ok: true, idlead: d.idlead || null };
          if (r.status === 422) return { ok: false, campo: (d && d.erro) || 'dados' };
          return { ok: false, rede: true, erro: (d && d.erro) || ('HTTP ' + r.status) };
        });
      })
      .catch(function () { return { ok: false, rede: true, erro: 'sem conexão' }; })
      .then(function (x) { clearTimeout(prazo); return x; });
  }

  /* ---------- histórico e fila do aparelho ------------------------------- */
  function hist(item) {
    var h = ler(K_HIST, []).filter(function (x) { return x.id !== item.id; });
    h.unshift(item); gravar(K_HIST, h.slice(0, 30)); desenharHist();
  }
  function desenharHist() {
    var h = ler(K_HIST, []), fila = ler(K_FILA, []);
    $('#hist').hidden = !h.length;
    $('#reenviar').hidden = !fila.length;
    var rot = { ok: ['No CV', 'is-ok'], fila: ['Na fila', 'is-fila'], erro: ['Recusado', 'is-err'] };
    $('#histList').innerHTML = h.map(function (x) {
      var r = rot[x.estado] || rot.fila;
      return '<li class="row"><div class="row__info"><b>' + esc(x.nome) + '</b>' + esc(x.interesse) + ' · ' + esc(hora(x.criado)) +
        (x.idlead ? ' · lead #' + esc(x.idlead) : '') + (x.estado === 'erro' && x.erro ? ' · ' + esc(x.erro) : '') +
        '</div><span class="row__st ' + r[1] + '">' + r[0] + '</span></li>';
    }).join('');
    status();
  }
  function status(enviandoFila) {
    var n = ler(K_FILA, []).length, on = navigator.onLine !== false;
    var dot = $('#liveDot'), txt = $('#liveTxt');
    dot.classList.toggle('is-off', !on || n > 0);
    dot.classList.toggle('is-busy', !!enviandoFila);
    txt.textContent = !on ? 'Sem internet — os cadastros ficam no aparelho'
      : n ? (enviandoFila ? 'Enviando a fila para o CV…' : n + (n > 1 ? ' cadastros na fila' : ' cadastro na fila') + ' — sobem sozinhos')
      : 'Vai direto para o CV';
  }

  function esvaziarFila() {
    if (esvaziando || navigator.onLine === false) return Promise.resolve();
    var fila = ler(K_FILA, []); if (!fila.length) return Promise.resolve();
    esvaziando = true; status(true);
    var proximo = function () {
      var f = ler(K_FILA, []); if (!f.length) return Promise.resolve();
      var it = f[0];
      return enviar(it.corpo).then(function (r) {
        var resto = ler(K_FILA, []).filter(function (x) { return x.id !== it.id; });
        if (r.ok) { gravar(K_FILA, resto); hist({ id: it.id, nome: it.corpo.nome, interesse: it.corpo.interesse, criado: it.criado, estado: 'ok', idlead: r.idlead }); return proximo(); }
        if (r.campo) { gravar(K_FILA, resto); hist({ id: it.id, nome: it.corpo.nome, interesse: it.corpo.interesse, criado: it.criado, estado: 'erro', erro: 'confira o ' + r.campo }); return proximo(); }
        return null;                            // ainda sem rede/CV: para e tenta depois
      });
    };
    return proximo().then(function () { esvaziando = false; desenharHist(); }, function () { esvaziando = false; desenharHist(); });
  }

  /* ---------- formulário -------------------------------------------------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (enviando) return;
    avisar(null);
    var v = validar();
    var faltam = Object.keys(v.erros);
    if (faltam.length) {
      var nomes = { nome: 'Nome', telefone: 'Telefone', interesse: 'Interesse' };
      var lista = faltam.map(function (c) { return nomes[c]; });
      avisar('Falta preencher', (lista.length > 1 ? lista.slice(0, -1).join(', ') + ' e ' + lista[lista.length - 1] : lista[0]) + '.');
      var primeiro = form.querySelector('.is-err input'); if (primeiro) primeiro.focus();
      return;
    }
    var d = v.dados;
    gravar(K_DDI, ddiSel.value);
    var id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var corpo = {
      lp: 'cadastro', produto: d.escolha.dataset.produto, idioma: 'pt', pagina: location.pathname + location.search,
      nome: d.nome, telefone: d.tel, ddi: d.ddi, empresa: d.empresa, interesse: d.escolha.value,
      hp: form.website.value || '', t: Date.now() - T0, attrib: atribuicao()
    };
    var criado = new Date().toISOString();

    enviando = true; btn.disabled = true; btn.textContent = 'Enviando…';
    enviar(corpo).then(function (r) {
      enviando = false; btn.disabled = false; btn.innerHTML = 'Enviar para o CV <span aria-hidden="true">→</span>';
      if (r.campo) {
        var c = r.campo === 'nome' || r.campo === 'telefone' ? r.campo : null;
        if (c) marcar(c, c === 'nome' ? 'O CV recusou o nome — confira.' : 'O CV recusou o telefone — confira.');
        avisar('O CV não aceitou', 'Confira o ' + (c || 'preenchimento') + ' e envie de novo.');
        return;
      }
      if (r.ok) {
        hist({ id: id, nome: d.nome, interesse: corpo.interesse, criado: criado, estado: 'ok', idlead: r.idlead });
        concluir(true, d, corpo, r.idlead);
      } else {
        var fila = ler(K_FILA, []); fila.push({ id: id, corpo: corpo, criado: criado });
        var guardou = gravar(K_FILA, fila);
        if (!guardou) { avisar('Não deu para enviar nem guardar', 'O aparelho está sem espaço. Anote os dados e tente de novo.'); return; }
        hist({ id: id, nome: d.nome, interesse: corpo.interesse, criado: criado, estado: 'fila' });
        concluir(false, d, corpo);
      }
    });
  });

  function concluir(ok, d, corpo, idlead) {
    var box = $('#done');
    box.classList.toggle('done--fila', !ok);
    $('#doneIc').innerHTML = ok ? '✓' : '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
    $('#doneTitle').textContent = ok ? 'Lead no CV' : 'Guardado no aparelho';
    var quem = '<b>' + esc(d.nome) + '</b>' + (d.empresa ? ' · ' + esc(d.empresa) : '') + ' · ' + esc(corpo.interesse);
    $('#doneTxt').innerHTML = ok
      ? quem + (idlead ? '<br>Lead #' + esc(idlead) + ' no CV.' : '')
      : quem + '<br>Sem conexão com o CV agora. O cadastro sobe sozinho quando a internet voltar — não precisa refazer.';
    $('#formCard').hidden = true; box.hidden = false; box.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('#novo').addEventListener('click', function () {
    var ddi = ddiSel.value, outro = ddiOutro.value;
    form.reset(); ddiSel.value = ddi; ddiOutro.value = outro; mostrarOutro();
    ['nome', 'telefone', 'interesse'].forEach(function (c) { marcar(c, ''); });
    avisar(null);
    $('#done').hidden = true; $('#formCard').hidden = false;
    T0 = Date.now();
    form.nome.focus();
  });
  $('#reenviar').addEventListener('click', function () { esvaziarFila(); });

  /* ---------- fila: ao abrir, ao voltar a internet e a cada 30 s ---------- */
  window.addEventListener('online', function () { status(); esvaziarFila(); });
  window.addEventListener('offline', function () { status(); });
  setInterval(function () { if (ler(K_FILA, []).length) esvaziarFila(); }, 30000);
  desenharHist();
  esvaziarFila();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* sem SW a página funciona igual, só não abre offline */ });
  }
})();
