/* ==========================================================
   BRACERUM/PARK — script principal · v6
   Loader, nav, hero, reveals, steps, galeria, parallax e a tira
   de fotos. O masterplan e o mapa vivem em home.js, que só a
   home carrega.
   ========================================================== */
document.documentElement.classList.add("js");

const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !hasGsap;
if (reduceMotion) document.documentElement.classList.add("no-motion");
if (hasGsap) gsap.registerPlugin(ScrollTrigger);

/* ==========================================================
   00 · LOADER + entrada do hero
   ========================================================== */
(function loader(){
  const el = document.getElementById("loader");
  const heroImg = document.querySelector(".hero__bg img");
  const heroMark = document.getElementById("heroMark");

  function kenBurns(){
    if (reduceMotion || !heroImg) return;
    gsap.to(heroImg, {
      scale: 1.16, xPercent: -1.6, yPercent: 1.2,
      duration: 26, ease: "sine.inOut", repeat: -1, yoyo: true
    });
  }

  function focusHero(){
    if (reduceMotion || !heroImg) return;
    gsap.fromTo(heroImg,
      { filter: "blur(16px)" },
      { filter: "blur(0px)", duration: 1.5, ease: "power2.out", clearProps: "filter", onComplete: kenBurns });
    if (heroMark) gsap.fromTo(heroMark,
      { autoAlpha: 0, y: 26 },
      { autoAlpha: 1, y: 0, duration: 1.1, ease: "power3.out", delay: .2 });
  }

  const gate = document.getElementById("langGate");

  /* Entrada de idioma: aparece antes de tudo na primeira visita. */
  function animateGateIn(){
    if (!gate) return;
    if (reduceMotion){
      gate.querySelectorAll(".gate__mark, .gate__label, .gate__opts")
        .forEach(n => { n.style.opacity = 1; });
      return;
    }
    gsap.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(gate.querySelector(".gate__mark"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .8 })
      .fromTo(gate.querySelector(".gate__label"), { opacity: 0 }, { opacity: 1, duration: .5 }, "-=.4")
      .fromTo(gate.querySelector(".gate__opts"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6 }, "-=.35");
  }
  function animateGateOut(done){
    if (!gate) { done(); return; }
    if (reduceMotion){ gate.remove(); done(); return; }
    gsap.timeline({ onComplete(){ gate.remove(); done(); } })
      .to(gate.querySelectorAll(".gate__mark, .gate__label, .gate__opts"),
          { opacity: 0, y: -14, duration: .4, stagger: .05, ease: "power2.in" })
      .to(gate, { autoAlpha: 0, duration: .35 }, "-=.1");
  }

  function runLoader(){
    if (!el){ focusHero(); return; }
    if (reduceMotion){ el.remove(); focusHero(); return; }

    const mark = el.querySelector(".loader__mark");
    const bar = el.querySelector(".loader__bar");
    const label = el.querySelector(".loader__label");
    const curtain = el.querySelector(".loader__curtain");

    const tl = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete(){ el.remove(); } });
    tl.to(mark, { opacity: 1, duration: .65 })
      .to(label, { opacity: 1, duration: .4 }, "-=.3")
      .to({}, {
        duration: 1.05, ease: "power2.inOut",
        onUpdate(){
          const p = this.progress() * 100;
          bar.style.background = `linear-gradient(90deg, #f7f3ea ${p}%, rgba(247,243,234,.14) ${p}%)`;
        }
      }, "-=.1")
      .add(focusHero, "+=.1")
      .to(curtain, { yPercent: -100, duration: .85, ease: "expo.inOut" }, "<")
      .to(el, { autoAlpha: 0, duration: .25 }, "-=.2");
  }

  let started = false;
  function begin(showedGate){
    if (started) return;
    started = true;
    if (showedGate) animateGateOut(runLoader);
    else { gate?.remove(); runLoader(); }
  }

  document.addEventListener("bp:langready", e => begin(e.detail && e.detail.gate));
  // Se a entrada aparecer, anima os elementos dela assim que o DOM estiver pronto
  document.addEventListener("DOMContentLoaded", () => {
    if (gate && !gate.hidden) animateGateIn();
  });
  // Rede de segurança: se o i18n não carregar, o site entra mesmo assim.
  // Nunca dispara enquanto a tela de entrada estiver à espera da escolha.
  setTimeout(() => { if (!gate || gate.hidden) begin(false); }, 4000);
})();

/* ==========================================================
   01 · NAV — só aparece depois do hero
   ========================================================== */
(function nav(){
  const nav = document.getElementById("siteNav");
  if (!nav) return;
  const hero = document.querySelector(".hero");
  if (!hero || nav.dataset.always === "true"){ nav.classList.add("is-visible"); return; }
  function update(){ nav.classList.toggle("is-visible", window.scrollY > hero.offsetHeight - 90); }
  update();
  window.addEventListener("scroll", update, { passive: true });
})();

/* ==========================================================
   02 · REVEALS + máscaras de título
   ========================================================== */
(function reveals(){
  const items = document.querySelectorAll(".reveal");
  if (reduceMotion){ items.forEach(i => i.classList.add("is-in")); }
  else if (items.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { threshold: .15, rootMargin: "0px 0px -8% 0px" });
    items.forEach(i => io.observe(i));
  }
  if (!reduceMotion){
    document.querySelectorAll(".mask__in").forEach(elm => {
      gsap.to(elm, { y: 0, duration: 1.1, ease: "power3.out",
        scrollTrigger: { trigger: elm.closest(".mask"), start: "top 88%" } });
    });
  }
})();

/* ==========================================================
   03 · HERO — grid de pontos sutil
   ========================================================== */
(function heroDots(){
  const canvas = document.getElementById("heroDots");
  if (!canvas) return;
  const hero = canvas.closest(".hero");
  const ctx = canvas.getContext("2d");
  let w, h, cols, rows, gap = 34, dpr = Math.min(window.devicePixelRatio || 1, 2);
  let mouse = { x: -9999, y: -9999 };
  let running = false, raf;

  function resize(){
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / gap) + 1; rows = Math.ceil(h / gap) + 1;
  }
  function draw(){
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < cols; i++){
      for (let j = 0; j < rows; j++){
        const x = i * gap, y = j * gap;
        const dx = x - mouse.x, dy = y - mouse.y;
        const inf = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 240);
        ctx.beginPath();
        ctx.fillStyle = `rgba(247,243,234,${0.07 + inf * 0.4})`;
        ctx.arc(x, y, 1 + inf * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (running) raf = requestAnimationFrame(draw);
  }
  function start(){ if (!running){ running = true; draw(); } }
  function stop(){ running = false; cancelAnimationFrame(raf); }

  resize();
  if (reduceMotion){ draw(); return; }
  hero.addEventListener("pointermove", e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = -9999; mouse.y = -9999; });
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop())).observe(hero);
  window.addEventListener("resize", resize);
})();

/* ==========================================================
   06 · COMO FUNCIONA — sticky + IntersectionObserver
   ========================================================== */
(function steps(){
  const pin = document.getElementById("stepsPin");
  const list = document.getElementById("stepsList");
  if (!pin || !list) return;
  const items = [...list.querySelectorAll(".step")];
  const shots = [...document.querySelectorAll(".steps__visual img")];
  const fill = document.getElementById("stepsFill");
  const counter = document.getElementById("stepsCounter");
  const n = items.length;
  let active = -1;

  function setActive(i){
    i = Math.max(0, Math.min(n - 1, i));
    if (i === active) return;
    active = i;
    items.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
    shots.forEach((im, idx) => im.classList.toggle("is-active", idx === i));
    if (counter) counter.textContent = String(i + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");
    if (fill) fill.style.transform = `scaleX(${(i + 1) / n})`;
  }

  if (reduceMotion || window.innerWidth < 900){
    items.forEach(s => s.classList.add("is-active"));
    shots[0]?.classList.add("is-active");
    if (fill) fill.style.transform = "scaleX(1)";
    if (counter) counter.textContent = "01 / " + String(n).padStart(2, "0");
    return;
  }

  setActive(0);
  /* A seção tem exatamente uma tela de altura: ela encaixa centralizada
     no viewport e só depois disso o scroll avança etapa por etapa. */
  ScrollTrigger.create({
    trigger: pin,
    start: "top top",
    end: "+=" + (n * 420),
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate(self){
      setActive(Math.floor(self.progress * n * 0.999));
    }
  });
})();

/* ==========================================================
   07 · GALERIA — sanfona
   ========================================================== */
(function galleryAccordion(){
  const wrap = document.getElementById("galleryAccordion");
  if (!wrap) return;
  const panels = wrap.querySelectorAll(".gallery-panel");
  function activate(panel){ panels.forEach(p => p.classList.toggle("is-active", p === panel)); }
  panels.forEach(p => {
    p.addEventListener("mouseenter", () => { if (window.matchMedia("(hover:hover)").matches) activate(p); });
    p.addEventListener("click", () => activate(p));
  });
})();

/* ==========================================================
   08 · Parallax — hero e bandas de imagem
   ========================================================== */
if (!reduceMotion){
  const heroBgImg = document.querySelector(".hero__bg img");
  if (heroBgImg){
    gsap.to(heroBgImg, { yPercent: 9, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }
  document.querySelectorAll(".img-band").forEach(band => {
    const img = band.querySelector("img");
    if (!img) return;
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none",
      scrollTrigger: { trigger: band, start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/* ==========================================================
   09 · v5 — motion dos blocos de projeto e das páginas novas
   Parallax lento na imagem cheia e entrada escalonada dos
   cartões. Tudo desligado quando o usuário pede menos motion.
   ========================================================== */
if (!reduceMotion){
  /* imagem dos blocos de projeto e do hero das páginas internas */
  document.querySelectorAll(".proj__media img, .pagehero img").forEach(img => {
    const alvo = img.closest(".proj__media, .pagehero");
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: alvo, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* cartões e células entram em cascata */
  document.querySelectorAll(".cards, .futuro__grid, .specbar").forEach(grid => {
    gsap.from(grid.children, {
      y: 26, opacity: 0, duration: .7, ease: "power2.out", stagger: .07,
      scrollTrigger: { trigger: grid, start: "top 86%", once: true }
    });
  });
}

/* ==========================================================
   10 · v5 — tira horizontal de fotos
   A barra de rolagem nativa embaixo das fotos ficou feia e difícil
   de usar. A tira agora esconde a barra e ganha três formas de
   andar: roda do mouse, arrastar e as setas. Uma régua fina mostra
   onde o usuário está — é a barra de rolagem, redesenhada.
   Os controles são montados aqui para não repetir markup nas
   quatro páginas de projeto.
   ========================================================== */
document.querySelectorAll(".strip").forEach(strip => {

  /* --- estrutura: .striprail > .strip + .strip__ui --- */
  const rail = document.createElement("div");
  rail.className = "striprail";
  strip.parentNode.insertBefore(rail, strip);
  rail.appendChild(strip);

  const ui = document.createElement("div");
  ui.className = "strip__ui";
  ui.innerHTML =
    '<div class="strip__track"><span class="strip__thumb"></span></div>' +
    '<div class="strip__nav">' +
      '<button class="strip__btn" data-dir="-1" type="button">' +
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 4 7 12l8 8"/></svg>' +
      '</button>' +
      '<button class="strip__btn" data-dir="1" type="button">' +
        '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 4l8 8-8 8"/></svg>' +
      '</button>' +
    '</div>';
  rail.after(ui);

  const track = ui.querySelector(".strip__track");
  const thumb = ui.querySelector(".strip__thumb");
  const btns  = [...ui.querySelectorAll(".strip__btn")];

  /* rótulos das setas — texto dinâmico, re-traduzido no langchange */
  const ROTULOS = {
    "-1": { pt: "Fotos anteriores", en: "Previous photos",  es: "Fotos anteriores" },
    "1":  { pt: "Próximas fotos",   en: "Next photos",      es: "Siguientes fotos" }
  };
  const rotular = () => btns.forEach(b => {
    b.setAttribute("aria-label", tr(ROTULOS[b.dataset.dir]));
    b.title = tr(ROTULOS[b.dataset.dir]);
  });
  rotular();
  document.addEventListener("langchange", rotular);

  strip.setAttribute("role", "region");
  strip.tabIndex = 0;

  const passo = () => {
    const fig = strip.querySelector("figure");
    return fig ? fig.getBoundingClientRect().width + 1 : strip.clientWidth * .8;
  };
  const maxScroll = () => Math.max(0, strip.scrollWidth - strip.clientWidth);

  /* --- régua de posição + estado das setas --- */
  function sincronizar(){
    const max = maxScroll();
    const visivel = max > 4;
    ui.style.display = visivel ? "" : "none";
    rail.classList.toggle("has-next", visivel && strip.scrollLeft < max - 4);
    if (!visivel) return;
    const fracao = strip.clientWidth / strip.scrollWidth;
    const avanco  = strip.scrollLeft / max;
    thumb.style.width = (fracao * 100) + "%";
    thumb.style.transform = "translateX(" + (avanco * (100 / fracao - 100)) + "%)";
    btns[0].disabled = strip.scrollLeft < 4;
    btns[1].disabled = strip.scrollLeft > max - 4;
  }
  strip.addEventListener("scroll", sincronizar, { passive: true });
  window.addEventListener("resize", sincronizar);
  sincronizar();
  /* as fotos são lazy: quando a última carrega, a largura muda */
  strip.querySelectorAll("img").forEach(img => {
    if (!img.complete) img.addEventListener("load", sincronizar, { once: true });
  });

  /* --- setas --- */
  btns.forEach(b => b.addEventListener("click", () => {
    strip.scrollBy({ left: passo() * Number(b.dataset.dir), behavior: reduceMotion ? "auto" : "smooth" });
  }));

  /* --- clicar na régua para saltar --- */
  track.addEventListener("click", e => {
    const r = track.getBoundingClientRect();
    strip.scrollTo({ left: ((e.clientX - r.left) / r.width) * maxScroll(),
                     behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* --- roda do mouse: rolagem vertical anda para o lado --- */
  strip.addEventListener("wheel", e => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const max = maxScroll();
    if (max < 4) return;
    const antes = strip.scrollLeft;
    strip.scrollLeft = Math.max(0, Math.min(max, antes + e.deltaY));
    if (strip.scrollLeft !== antes) e.preventDefault();
  }, { passive: false });

  /* --- arrastar com o mouse (mesma lógica do masterplan: só vira
         arrasto depois de 4 px, senão roubaria o clique) --- */
  let pid = null, x0 = 0, s0 = 0, armado = false, arrastando = false;
  strip.addEventListener("pointerdown", e => {
    if (e.pointerType === "touch" || e.button !== 0) return;   // o toque já rola sozinho
    armado = true; arrastando = false; pid = e.pointerId;
    x0 = e.clientX; s0 = strip.scrollLeft;
  });
  strip.addEventListener("pointermove", e => {
    if (!armado || e.pointerId !== pid) return;
    const d = e.clientX - x0;
    if (!arrastando){
      if (Math.abs(d) < 4) return;
      arrastando = true;
      strip.classList.add("is-dragging");
      strip.setPointerCapture(pid);
    }
    strip.scrollLeft = s0 - d;
    e.preventDefault();
  });
  const soltar = e => {
    if (!armado || (e.pointerId != null && e.pointerId !== pid)) return;
    armado = false;
    if (arrastando){
      arrastando = false;
      strip.classList.remove("is-dragging");
      try { strip.releasePointerCapture(pid); } catch (err) {}
      /* engole o clique que fecharia o arrasto virando navegação */
      strip.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); },
                             { capture: true, once: true });
    }
  };
  strip.addEventListener("pointerup", soltar);
  strip.addEventListener("pointercancel", soltar);
});

/* ==========================================================
   11 · v6 — VILLETA: as quatro razões, uma aberta por vez
   Sanfona de verdade (botão, aria-expanded, teclado). A altura
   é animada por grid-template-rows no CSS — nada de medir
   scrollHeight em JS.
   ========================================================== */
(function fatos(){
  const caixa = document.getElementById("fatos");
  if (!caixa) return;
  const itens = [...caixa.querySelectorAll(".fato")];

  itens.forEach(item => {
    const botao = item.querySelector(".fato__head");
    botao.addEventListener("click", () => {
      const abrindo = !item.classList.contains("is-open");
      itens.forEach(o => {
        const aberto = o === item && abrindo;
        o.classList.toggle("is-open", aberto);
        o.querySelector(".fato__head").setAttribute("aria-expanded", String(aberto));
      });
    });
  });

  if (!reduceMotion){
    gsap.from(itens, {
      y: 24, opacity: 0, duration: .7, ease: "power2.out", stagger: .08,
      scrollTrigger: { trigger: caixa, start: "top 84%", once: true }
    });
  }
})();

/* ==========================================================
   12 · v6 — TRIBUTAÇÃO: os números contam ao entrar na tela
   O <b> traz data-count (valor final) e, quando é o caso,
   data-suffix ou data-unit — assim o texto do HTML continua
   sendo a fonte da verdade se o JS não rodar.
   ========================================================== */
(function cifras(){
  const caixa = document.getElementById("cifras");
  if (!caixa) return;
  const alvos = [...caixa.querySelectorAll("b[data-count]")];

  const escrever = (el, n) => {
    const unidade = el.dataset.unit ? " " + el.dataset.unit : "";
    el.textContent = n + (el.dataset.suffix || "") + unidade;
  };

  if (reduceMotion){
    alvos.forEach(el => escrever(el, Number(el.dataset.count)));
    return;
  }

  alvos.forEach(el => escrever(el, 0));
  const contar = () => alvos.forEach((el, i) => {
    const estado = { n: 0 };
    gsap.to(estado, {
      n: Number(el.dataset.count), duration: 1.1, delay: i * .1, ease: "power2.out",
      onUpdate: () => escrever(el, Math.round(estado.n))
    });
  });
  ScrollTrigger.create({ trigger: caixa, start: "top 82%", once: true, onEnter: contar });

  /* "anos"/"years"/"años" é atributo traduzido: reescreve o valor final
     na troca de idioma, senão o número fica com a unidade antiga. */
  document.addEventListener("langchange", () => {
    alvos.forEach(el => escrever(el, Number(el.dataset.count)));
  });
})();
