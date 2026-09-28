#!/usr/bin/env python3
"""QA automático de um filme (duração e cenas lidas de out/filme-<id>.json, gravado pelo render.js).

    python3 docs/motion/check.py docs/motion/out/preview-park-52s.mp4 --filme=park-52s [--det]
    python3 docs/motion/check.py docs/motion/out/preview.mp4 --sheet docs/motion/out/contato.jpg

Reprova (código de saída 1) se:
  - o vídeo não tiver os quadros e a duração do filme, 1920×1080, 30 fps e yuv420p;
  - algum quadro (1 a cada 3) tiver mais de 0,05 % de pixels vermelhos
    (matiz < 12° ou > 340°, saturação > 0,55, valor > 0,35);
  - o primeiro ou o último quadro for preto;
  - houver 15 quadros seguidos sem movimento (nenhum bloco de 30×30 px mudando mais de 2,5 níveis).
--det renderiza três quadros em duas sessões separadas do Chromium e compara o MD5.
Precisa de numpy e do ffmpeg do pacote imageio-ffmpeg (ou BP_FFMPEG).
"""
import hashlib, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FF = os.environ.get('BP_FFMPEG') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
W, H = 320, 180                       # resolução de análise
import json
_lang = next((a.split('=')[1] for a in sys.argv if a.startswith('--lang=')), 'pt')
_film = next((a.split('=')[1] for a in sys.argv if a.startswith('--filme=')), 'motion-48s')
FILME = json.load(open(os.path.join(HERE, 'out', f"filme-{_film}{'' if _lang == 'pt' else '-' + _lang}.json")))
SC = {}
for sc in FILME['SCENES']: SC.setdefault(sc['a'], sc['id'])
FRAMES, DURATION = FILME['FRAMES'], FILME['DURATION']


def scene_of(f):
    return SC[max(k for k in SC if k <= f)]


def frames(path):
    p = subprocess.Popen([FF, '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}:flags=area',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    p.wait()


def red_ratio(img):
    x = img.astype(np.float32) / 255
    mx, mn = x.max(2), x.min(2)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    hue = np.zeros_like(mx)
    m = (mx == r) & (d > 0)
    hue[m] = (60 * ((g - b)[m] / d[m])) % 360
    m2 = (mx == g) & (d > 0)
    hue[m2] = 60 * ((b - r)[m2] / d[m2]) + 120
    m3 = (mx == b) & (d > 0)
    hue[m3] = 60 * ((r - g)[m3] / d[m3]) + 240
    red = ((hue < 12) | (hue > 340)) & (s > 0.55) & (mx > 0.35)
    return red.mean()


# meio de cada cena + os dois quadros de cada corte + o último quadro
SHEET = sorted({(sc['a'] + sc['b']) // 2 for sc in FILME['SCENES']} |
               {f for sc in FILME['SCENES'] if sc['a'] > 0 for f in (sc['a'] - 1, sc['a'])} | {FRAMES - 1})


def sheet(path, out, cols=6, w=480):
    from PIL import Image, ImageDraw
    want = set(SHEET)
    tiles = []
    for i, img in enumerate(frames_full(path, w)):
        if i in want: tiles.append((i, Image.fromarray(img)))
    hh = w * 9 // 16
    rows = (len(tiles) + cols - 1) // cols
    sh = Image.new('RGB', (cols * w, rows * hh), (40, 40, 40))
    d = ImageDraw.Draw(sh)
    for k, (i, im) in enumerate(tiles):
        x, y = (k % cols) * w, (k // cols) * hh
        sh.paste(im, (x, y))
        d.rectangle([x, y, x + 86, y + 18], fill=(0, 0, 0))
        d.text((x + 4, y + 3), f'q{i} {scene_of(i)}', fill=(255, 230, 120))
    sh.save(out, quality=90)
    print('folha de contato →', out)


def frames_full(path, w):
    hh = w * 9 // 16
    p = subprocess.Popen([FF, '-v', 'error', '-i', path, '-vf', f'scale={w}:{hh}:flags=lanczos',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    n = w * hh * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(hh, w, 3)
    p.wait()


def main():
    if '--sheet' in sys.argv:
        sheet(sys.argv[1], sys.argv[sys.argv.index('--sheet') + 1])
        return
    path = sys.argv[1]
    fails = []
    info = subprocess.run([FF, '-i', path], capture_output=True, text=True).stderr
    dur = re.search(r'Duration: (\d+):(\d+):([\d.]+)', info)
    secs = int(dur[1]) * 3600 + int(dur[2]) * 60 + float(dur[3])
    vid = re.search(r'Video: .*?, (\w+)\(.*?(\d{3,4})x(\d{3,4}).*?, ([\d.]+) fps', info)
    print(f'duração {secs:.3f} s · {vid[2]}×{vid[3]} · {vid[4]} fps · {vid[1]}')
    if abs(secs - DURATION) > 0.02: fails.append(f'duração {secs} (esperado {DURATION})')
    if (vid[2], vid[3]) != ('1920', '1080'): fails.append('resolução')
    if float(vid[4]) != 30: fails.append('fps')
    if vid[1] != 'yuv420p': fails.append('pix_fmt ' + vid[1])

    prev, still, worst_red, reds, n = None, 0, 0.0, [], 0
    runs, diffs = [], []
    first = last = None
    for i, img in enumerate(frames(path)):
        n += 1
        if first is None: first = img
        last = img
        if i % 3 == 0:
            rr = red_ratio(img)
            worst_red = max(worst_red, rr)
            if rr > 0.0005: reds.append((i, scene_of(i), rr))
        # movimento medido a 64×36: a média de 5×5 blocos anula o grão, que muda a cada quadro
        small = img.astype(np.float32).reshape(36, 5, 64, 5, 3).mean((1, 3))
        if prev is not None:
            # parado = nenhum bloco mudou mais de 2,5 níveis (o grão residual fica abaixo de 1,5)
            diff = np.abs(small - prev).max()
            diffs.append(diff)
            still = still + 1 if diff < 2.5 else 0
            if still == 15: runs.append((i - 15, scene_of(i)))
        prev = small
    print(f'quadros {n} · maior mudança de bloco entre quadros: mediana {np.median(diffs):.1f}, mínimo {min(diffs):.1f} (parado abaixo de 2,5)')
    if n != FRAMES: fails.append(f'{n} quadros (esperado {FRAMES})')
    print(f'vermelho: pior quadro {worst_red * 100:.3f} % dos pixels')
    for f, sc, rr in reds: fails.append(f'vermelho no quadro {f} ({sc}): {rr * 100:.2f} %')
    for a, b in ((first, 'primeiro'), (last, 'último')):
        if a.max() < 60: fails.append(f'{b} quadro preto')
    for f, sc in runs:
        if f < FRAMES - 45: fails.append(f'15 quadros parados a partir de {f} ({sc})')
        else: print(f'pausa final a partir do quadro {f} (assinatura) — permitida')

    if '--det' in sys.argv:
        hashes = []
        for tag in ('det1', 'det2'):
            fr = ','.join(str(int(FRAMES * k)) for k in (0.1, 0.5, 0.9))
            subprocess.run(['node', os.path.join(HERE, 'render.js'), 'stills', f'--filme={_film}', f'--tag={tag}', f'--frames={fr}'], check=True, capture_output=True)
            d = os.path.join(HERE, 'out', 'stills', tag)
            hashes.append([hashlib.md5(open(os.path.join(d, f), 'rb').read()).hexdigest() for f in sorted(os.listdir(d))])
        same = hashes[0] == hashes[1]
        print('determinismo:', 'idêntico nas duas sessões' if same else f'DIFERENTE {hashes}')
        if not same: fails.append('render não determinístico')

    if fails:
        print('\nREPROVADO:'); [print(' -', f) for f in fails]; sys.exit(1)
    print('\nAPROVADO')


if __name__ == '__main__':
    main()
