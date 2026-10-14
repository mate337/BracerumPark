#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Desenha em linhas arquitetonicas a silhueta do Centro de Convencoes + Hotel.

    python3 docs/build_silhueta.py                 # escreve em assets/linhas/
    python3 docs/build_silhueta.py --sobre FOTO.png SAIDA.html
                                                   # confere o traco sobre a foto

SAIDA (assets/linhas/)
  convencoes-hotel-{ink,cream}.svg     desenho completo: torre com pavimentos,
                                       cobertura em gridshell, fachada de vidro
  convencoes-hotel-contorno-{ink,cream}.svg
                                       so as arestas principais: silhueta da
                                       torre e da cobertura + beirais, sem
                                       malha nem pavimentos — para faixa,
                                       divisor, rodape, uso pequeno

DE ONDE SAIU A GEOMETRIA
Do render noturno do conjunto (foto do cliente, 634x460, vista da rua). Os
pontos abaixo estao em pixels dessa foto e foram lidos sobre recortes
ampliados com grade de 10 px. A torre esta em perspectiva de dois pontos:
horizonte em y=204, fuga a esquerda em (-581, 204) e a direita em (442, 204)
— medidos pelas linhas dos pavimentos, que convergem para esses pontos. Por
isso os pavimentos sao gerados, nao desenhados a mao: mudando a fuga, todos
acompanham.

A cobertura e dividida em cascas (asa esquerda, casca do hotel, casca
central, casca da direita e o lobo que desce ao chao). Cada casca e uma
faixa entre a linha de cima (silhueta) e a de baixo (beiral); as nervuras do
gridshell sao as diagonais dessa faixa, interpoladas entre as duas linhas —
e isso que faz a malha acompanhar a curvatura como na foto.

Paleta do site: ink #0e0d0b e creme #fff8ef. Zero vermelho — a iluminacao
vermelha/azul do render nao entra no desenho.
"""

import math, os, sys

INK, CREAM = '#0e0d0b', '#fff8ef'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'assets', 'linhas')

# ---------------------------------------------------------------- geometria
CHAO = 310                      # linha do chao (base do podio)
HORIZ = 204                     # horizonte da perspectiva
FUGA_E = (-581.0, HORIZ)        # fuga da fachada esquerda da torre
FUGA_D = (442.0, HORIZ)         # fuga da ala direita

# Torre ---------------------------------------------------------------------
TORRE_TOPO_LATERAL = [(94, 113), (110, 110)]        # empena lateral (cega)
TORRE_TOPO_FRENTE = [(110, 110), (181, 100.5)]      # bloco da esquerda
NUCLEO = dict(x0=181, x1=219, topo=[(181, 99.5), (200, 97), (219, 100.5)])
ALA_D = dict(x0=219, x1=350, topo_y0=109)            # ala que foge p/ a direita
PAV_ESQ = [125, 140, 155, 171, 187.5, 202.5, 217.5]  # pavimentos em x=110
PAV_DIR = [126, 143, 159.5, 176, 192.5, 209]         # pavimentos em x=219
PE = 262          # as arestas descem ate aqui; a mascara esconde o que fica
                  # atras da cobertura

# Cobertura -----------------------------------------------------------------
# silhueta superior, da ponta esquerda a ponta direita
TOPO = {
    'asa':     [(8, 279), (20, 269), (40, 255), (60, 242), (75, 235.5),
                (90, 234), (102, 236), (113, 240)],
    'hotel':   [(113, 240), (125, 228), (140, 217), (150, 212.5), (160, 210),
                (170, 209.5), (180, 210.5), (190, 213), (200, 217),
                (212, 222), (226, 227)],
    'central': [(226, 227), (240, 221), (250, 215.5), (260, 211),
                (270, 207.5), (280, 205.5), (290, 204), (300, 203.5),
                (310, 204), (320, 205), (330, 207), (340, 209), (350, 211.5),
                (360, 214), (370, 217), (380, 219), (390, 221), (400, 222),
                (415, 224), (428, 225)],
    'direita': [(428, 225), (445, 220.5), (460, 225), (472, 233),
                (482, 241), (492, 245.5), (500, 242), (510, 237), (520, 232),
                (530, 229), (540, 227.5), (550, 228), (560, 230), (570, 232),
                (580, 235), (590, 238), (600, 241), (611, 245)],
}
# beirais (borda de baixo de cada casca)
BEIRAL = {
    'asa':     [(8, 279), (30, 281), (50, 280), (65, 276.5), (80, 269.5),
                (92, 264), (102, 261), (113, 255)],
    'hotel':   [(102, 261), (113, 253), (120, 248), (130, 243), (140, 238),
                (150, 234.5), (160, 232.5), (170, 231.5), (180, 231),
                (200, 231), (215, 231.5), (226, 228)],
    'central': [(226, 228), (240, 238), (250, 245), (260, 250.5),
                (270, 256), (284, 261.5), (300, 260), (330, 256.5),
                (350, 254.5), (370, 253.5), (390, 253.5), (410, 255),
                (428, 258)],
}
# lobo da direita: a casca da direita dobra no beiral (LOBO_D_TOPO) e desce
# ate tocar o chao (LOBO_D_BASE); LOBO_D_PONTA e a borda de baixo da ponta
LOBO_D_TOPO = [(428, 258), (450, 256), (470, 260), (490, 263), (510, 266),
               (530, 268.5), (550, 270), (566, 270.5)]
LOBO_D_PONTA = [(611, 245), (606, 248.5), (595, 252.5), (580, 260),
                (566, 270.5)]
LOBO_D_BASE = [(428, 258), (440, 270), (452, 279), (465, 288), (480, 297),
               (495, 304), (510, 307), (522, 307), (532, 304), (540, 296),
               (548, 287), (556, 279), (566, 270.5)]
BEIRAL['direita'] = LOBO_D_TOPO + LOBO_D_PONTA[::-1][1:]
# lobo da esquerda: a asa desce ate o chao como um funil
LOBO_E_FORA = [(8, 279), (12, 286), (20, 294), (30, 302), (42, 309)]
LOBO_E_DENTRO = [(65, 276.5), (68, 285), (72, 295), (77, 304), (79, 310)]

# fachada de vidro sob as cascas: montantes e o topo do podio
VIDRO_X = [104, 120, 137, 154, 172, 190, 207, 224, 242, 259, 278, 296,
           313, 331, 349, 367, 385, 403, 421]
PODIO_Y = 282     # topo do podio = pe da fachada de vidro; vai de lobo a lobo


# ------------------------------------------------------------------ desenho
def r(v):
    return ('%.1f' % v).rstrip('0').rstrip('.')


def suave(pts, fechar=False):
    """Catmull-Rom -> cubicas. Mantem os pontos de passagem."""
    if len(pts) < 3:
        return 'M' + ' L'.join(r(x) + ' ' + r(y) for x, y in pts)
    p = [pts[0]] + list(pts) + [pts[-1]]
    d = ['M%s %s' % (r(p[1][0]), r(p[1][1]))]
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d.append('C%s %s %s %s %s %s' % (r(c1[0]), r(c1[1]), r(c2[0]),
                                         r(c2[1]), r(p2[0]), r(p2[1])))
    return ' '.join(d) + (' Z' if fechar else '')


def reta(a, b):
    return 'M%s %s L%s %s' % (r(a[0]), r(a[1]), r(b[0]), r(b[1]))


def comprimento(pts):
    acc = [0.0]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        acc.append(acc[-1] + math.hypot(x1 - x0, y1 - y0))
    return acc


def ponto(pts, u):
    """Ponto na polilinha (suavizada por Catmull-Rom) ao parametro u em [0,1]."""
    acc = comprimento(pts)
    alvo = max(0.0, min(1.0, u)) * acc[-1]
    for i in range(len(pts) - 1):
        if acc[i + 1] >= alvo or i == len(pts) - 2:
            seg = acc[i + 1] - acc[i] or 1
            t = (alvo - acc[i]) / seg
            p0 = pts[max(i - 1, 0)]
            p1, p2 = pts[i], pts[i + 1]
            p3 = pts[min(i + 2, len(pts) - 1)]
            t2, t3 = t * t, t * t * t
            return tuple(0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t +
                                (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
                                (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
                         for k in (0, 1))


def alisa(pts, sigma=4.0, passo=1.0, saida=5.0):
    """Tira o tremido do traco feito a mao, sem mexer nas pontas.

    Reamostra a curva a cada `passo` px, passa um filtro gaussiano de
    `sigma` px e devolve um ponto a cada `saida` px. As pontas ficam
    exatamente onde estavam — e elas que fazem os vincos entre as cascas."""
    total = comprimento(pts)[-1]
    n = max(2, int(total / passo))
    dens = [ponto(pts, i / n) for i in range(n + 1)]
    raio = int(3 * sigma / passo)
    pesos = [math.exp(-0.5 * (k * passo / sigma) ** 2)
             for k in range(-raio, raio + 1)]
    lis = []
    for i in range(n + 1):
        sx = sy = sw = 0.0
        for k, w in zip(range(-raio, raio + 1), pesos):
            j = i + k
            # reflexao impar nas pontas: mantem a direcao da curva
            if j < 0:
                px = 2 * dens[0][0] - dens[-j][0]
                py = 2 * dens[0][1] - dens[-j][1]
            elif j > n:
                px = 2 * dens[n][0] - dens[2 * n - j][0]
                py = 2 * dens[n][1] - dens[2 * n - j][1]
            else:
                px, py = dens[j]
            sx += w * px; sy += w * py; sw += w
        lis.append((sx / sw, sy / sw))
    lis[0], lis[-1] = dens[0], dens[-1]
    salto = max(1, int(saida / passo))
    out = lis[::salto]
    if out[-1] != lis[-1]:
        out.append(lis[-1])
    return out


def malha(cima, baixo, passo, inclin, amostras=14, minimo=1.8):
    """Nervuras diagonais do gridshell numa faixa entre duas linhas.

    passo: distancia (em u) entre nervuras; inclin: quanto u anda de cima a
    baixo. As duas familias (+inclin e -inclin) formam os losangos. Onde a
    faixa fica mais fina que `minimo` px (nas pontas das cascas) a nervura e
    interrompida — senao as linhas se amontoam num borrao."""
    linhas = []
    n = int((1 + 2 * abs(inclin)) / passo) + 2
    for sinal in (1, -1):
        for k in range(-n, n + 1):
            u0 = k * passo + (passo / 2 if sinal < 0 else 0)
            trecho = []
            for j in range(amostras + 1):
                v = j / amostras
                u = u0 + sinal * inclin * v
                ok = 0 <= u <= 1
                if ok:
                    a, b = ponto(cima, u), ponto(baixo, u)
                    ok = math.hypot(b[0] - a[0], b[1] - a[1]) >= minimo
                if ok:
                    trecho.append((a[0] + (b[0] - a[0]) * v,
                                   a[1] + (b[1] - a[1]) * v))
                else:
                    if len(trecho) >= 3:
                        linhas.append(suave(trecho))
                    trecho = []
            if len(trecho) >= 3:
                linhas.append(suave(trecho))
    return linhas


def em_fuga(fuga, x0, y0, x1):
    """Segmento de x0 a x1 sobre a reta que passa por (x0,y0) e pelo ponto de fuga."""
    fx, fy = fuga
    t = (x1 - x0) / (fx - x0)
    return (x0, y0), (x1, y0 + (fy - y0) * t)


def torre():
    """Contorno, pavimentos e modulacao da torre. Devolve (contorno, finas)."""
    cont, finas = [], []
    # empena lateral cega + bloco esquerdo
    (ax, ay), (bx, by) = TORRE_TOPO_LATERAL
    cont.append(reta((ax, PE), (ax, ay)))
    cont.append(reta((ax, ay), (bx, by)))
    cont.append(reta((bx, by), TORRE_TOPO_FRENTE[1]))
    cont.append(reta((bx, by), (bx, PE)))
    for y in PAV_ESQ:
        a, b = em_fuga(FUGA_E, 110, y, NUCLEO['x0'])
        finas.append(reta(a, b))
    # modulos verticais do bloco esquerdo (em perspectiva leve: so retas)
    for x in (128, 146, 164):
        finas.append(reta((x, em_fuga(FUGA_E, 110, 110, x)[1][1]), (x, PE)))
    # nucleo de circulacao (volume branco)
    n = NUCLEO
    cont.append(reta((n['x0'], n['topo'][0][1]), (n['x0'], PE)))
    cont.append(suave(n['topo']))
    cont.append(reta((n['x1'], n['topo'][-1][1]), (n['x1'], PE)))
    # ala direita, fugindo para FUGA_D
    a, b = em_fuga(FUGA_D, ALA_D['x0'], ALA_D['topo_y0'], ALA_D['x1'])
    cont.append(reta(a, b))
    cont.append(reta(b, (ALA_D['x1'], PE)))
    for y in PAV_DIR:
        a, b = em_fuga(FUGA_D, ALA_D['x0'], y, ALA_D['x1'])
        finas.append(reta(a, b))
    # modulos da ala direita: espacamento que encolhe rumo a fuga
    # (divisao em perspectiva de um vao de 7 modulos iguais no plano)
    fx = FUGA_D[0]
    x0, x1 = ALA_D['x0'], ALA_D['x1']
    # profundidade 1/(fx - x) e linear no plano da fachada
    i0, i1 = 1 / (fx - x0), 1 / (fx - x1)
    for k in range(1, 7):
        x = fx - 1 / (i0 + (i1 - i0) * k / 7)
        top = em_fuga(FUGA_D, x0, ALA_D['topo_y0'], x)[1][1]
        finas.append(reta((x, top), (x, PE)))
    return cont, finas


def cobertura():
    """Silhueta, beirais e nervuras do gridshell."""
    sil, beir, nerv = [], [], []
    # silhueta: chao -> lobo esquerdo -> ponta -> cristas -> ponta direita ->
    # lobo direito -> chao. Cada casca e um trecho proprio, para o vinco entre
    # elas continuar vinco (uma curva so arredondaria tudo).
    sil.append(suave(LOBO_E_FORA[::-1]))
    for k in ('asa', 'hotel', 'central', 'direita'):
        sil.append(suave(TOPO[k]))
    sil.append(suave(LOBO_D_PONTA))
    sil.append(suave(LOBO_D_BASE))
    # beirais (a asa so ate encontrar o beiral do hotel, sem linha dupla)
    emenda = BEIRAL['hotel'][0]
    beir.append(suave([p for p in BEIRAL['asa'] if p[0] < emenda[0] - 1] +
                      [emenda]))
    for k in ('hotel', 'central'):
        beir.append(suave(BEIRAL[k]))
    beir.append(suave(LOBO_D_TOPO))
    beir.append(suave(LOBO_E_DENTRO))
    # nervuras: (cima, baixo, passo, inclinacao)
    cascas = [
        (TOPO['asa'], BEIRAL['asa'], 0.085, 0.30),
        (TOPO['hotel'], BEIRAL['hotel'], 0.065, 0.22),
        (TOPO['central'], BEIRAL['central'], 0.042, 0.16),
        (TOPO['direita'], BEIRAL['direita'], 0.05, 0.16),
        (LOBO_D_TOPO, LOBO_D_BASE, 0.075, 0.25),
        (LOBO_E_FORA, LOBO_E_DENTRO, 0.22, 0.5),
    ]
    for cima, baixo, passo, inc in cascas:
        nerv += malha(cima, baixo, passo, inc)
    return sil, beir, nerv


def fachada():
    linhas = []
    for x in VIDRO_X:
        # do beiral (aprox.) ate o podio
        y0 = beiral_y(x)
        if y0 is not None and y0 < PODIO_Y - 4:
            linhas.append(reta((x, y0), (x, PODIO_Y)))
    linhas.append(reta((x_em(LOBO_E_DENTRO, PODIO_Y), PODIO_Y),
                       (x_em(LOBO_D_BASE, PODIO_Y), PODIO_Y)))
    return linhas


def x_em(pts, y):
    """Primeiro x em que a polilinha cruza a altura y."""
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if min(y0, y1) <= y <= max(y0, y1) and y0 != y1:
            return x0 + (x1 - x0) * (y - y0) / (y1 - y0)
    raise ValueError('a curva nao passa por y=%s' % y)


def beiral_y(x):
    pts = BEIRAL['hotel'] + BEIRAL['central'][1:]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1:
            return y0 + (y1 - y0) * (x - x0) / ((x1 - x0) or 1)
    return None


def mascara_cobertura():
    """Area da cobertura e do podio: o que esta atras (a torre) nao aparece."""
    contorno = list(LOBO_E_FORA[::-1])
    for k in ('asa', 'hotel', 'central', 'direita'):
        contorno += TOPO[k][1:]
    contorno += LOBO_D_PONTA[1:] + LOBO_D_BASE[::-1][1:] + [(0, CHAO + 20)]
    return 'M' + ' L'.join(r(x) + ' ' + r(y) for x, y in contorno) + ' Z'


def prepara():
    """Alisa todas as curvas da cobertura (ver alisa) antes de desenhar."""
    global LOBO_D_TOPO, LOBO_D_PONTA, LOBO_D_BASE, LOBO_E_FORA, LOBO_E_DENTRO
    for k in TOPO:
        TOPO[k] = alisa(TOPO[k])
    for k in ('asa', 'hotel', 'central'):
        BEIRAL[k] = alisa(BEIRAL[k])
    LOBO_D_TOPO = alisa(LOBO_D_TOPO)
    LOBO_D_PONTA = alisa(LOBO_D_PONTA, sigma=3)
    LOBO_D_BASE = alisa(LOBO_D_BASE)
    LOBO_E_FORA = alisa(LOBO_E_FORA, sigma=3)
    LOBO_E_DENTRO = alisa(LOBO_E_DENTRO, sigma=3)
    # o beiral da casca da direita e a dobra do lobo + a borda da ponta
    BEIRAL['direita'] = LOBO_D_TOPO + LOBO_D_PONTA[::-1][1:]


# ------------------------------------------------------------------- montar
VIEW = (0, 92, 620, 222)  # x, y, largura, altura (recorte do desenho)


def svg(cor, completo=True, titulo='Centro de Convenções e Hotel — Bracerum Park'):
    t_cont, t_finas = torre()
    sil, beir, nerv = cobertura()
    x, y, w, h = VIEW
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s %s %s %s" '
           'fill="none" stroke="%s" stroke-linecap="round" '
           'stroke-linejoin="round" role="img">' % (x, y, w, h, cor),
           '<title>%s</title>' % titulo,
           '<defs><mask id="atras" maskUnits="userSpaceOnUse" x="%s" y="%s" '
           'width="%s" height="%s"><rect x="%s" y="%s" width="%s" height="%s" '
           'fill="#fff"/><path d="%s" fill="#000"/></mask></defs>'
           % (x, y, w, h, x, y, w, h, mascara_cobertura())]
    # torre (atras da cobertura)
    out.append('<g mask="url(#atras)">')
    out.append('<path stroke-width="1.3" d="%s"/>' % ' '.join(t_cont))
    if completo:
        out.append('<path stroke-width="0.55" d="%s"/>' % ' '.join(t_finas))
    out.append('</g>')
    # cobertura
    if completo:
        out.append('<path stroke-width="0.4" opacity="0.9" d="%s"/>'
                   % ' '.join(nerv))
        out.append('<path stroke-width="0.5" d="%s"/>' % ' '.join(fachada()))
    out.append('<path stroke-width="%s" d="%s"/>'
               % ('0.9' if completo else '1', ' '.join(beir)))
    out.append('<path stroke-width="1.6" d="%s"/>' % ' '.join(sil))
    # chao
    out.append('<path stroke-width="%s" d="M%s %s H%s"/>'
               % ('1' if completo else '1.2', x + 4, CHAO, x + w - 4))
    out.append('</svg>')
    return '\n'.join(out) + '\n'


def main():
    prepara()
    if len(sys.argv) >= 4 and sys.argv[1] == '--sobre':
        foto, saida = sys.argv[2], sys.argv[3]
        corpo = svg('#00ff88').split('\n', 1)[1]
        html = ('<html><body style="margin:0;background:#000">'
                '<div style="position:relative;width:1268px;height:920px">'
                '<img src="%s" style="position:absolute;width:1268px;'
                'height:920px;opacity:.55">'
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 634 460" '
                'style="position:absolute;width:1268px;height:920px" '
                'fill="none" stroke="#00ff88" stroke-linecap="round">%s'
                '</div></body></html>' % (os.path.abspath(foto), corpo))
        open(saida, 'w').write(html)
        return
    os.makedirs(SAIDA, exist_ok=True)
    for nome, cor in (('ink', INK), ('cream', CREAM)):
        for sufixo, completo in (('', True), ('-contorno', False)):
            caminho = os.path.join(SAIDA, 'convencoes-hotel%s-%s.svg'
                                   % (sufixo, nome))
            open(caminho, 'w').write(svg(cor, completo))
            print(caminho)


if __name__ == '__main__':
    main()
