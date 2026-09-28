#!/usr/bin/env python3
"""Sound design sintetizado do filme — só ffmpeg lavfi, sem amostra nem música de terceiros.

    node docs/motion/render.js cues --filme=park-67s      # gera out/cues-park-67s.csv a partir da timeline
    python3 docs/motion/audio.py --filme=park-67s [--lang=es]   # out/audio-<id>.wav + out/bracerum-<id>.mp4

Lê out/cues-<id>[-lang].csv (os mesmos eventos que o filme declara) e sintetiza:
  whoosh  ruído rosa filtrado com subida exponencial até o pico do corte (vol= no cue ajusta o volume)
  tick    8–14 ms de ruído agudo (cada caractere digitado, cada dígito que assenta)
  hit     senoide grave com decaimento rápido (cortes de fundo da S9–S10 e a assinatura)
  riser   varredura 110→440 Hz + ruído filtrado da S13 até 0,3 s antes da assinatura
  pulso   bumbo suave na grade de 120 BPM (acento a cada compasso)
Normaliza para −14 LUFS em duas passadas e junta ao master mudo.
"""
import csv, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
FF = os.environ.get('BP_FFMPEG') or __import__('imageio_ffmpeg').get_ffmpeg_exe()
LANG = next((a.split('=')[1] for a in sys.argv if a.startswith('--lang=')), 'pt')
SFX = '' if LANG == 'pt' else '-' + LANG
SR, FPS = 48000, 30
FILM = next((a.split('=')[1] for a in sys.argv if a.startswith('--filme=')), 'motion-48s')
DUR = json.load(open(os.path.join(OUT, f'filme-{FILM}{SFX}.json')))['DURATION']


def params(s):
    return dict(kv.split('=') for kv in s.split()) if s else {}


def pan(p):  # -1 esquerda … +1 direita, lei de potência constante
    import math
    a = (p + 1) * math.pi / 4
    return f'pan=stereo|c0={math.cos(a):.3f}*c0|c1={math.sin(a):.3f}*c0'


def build(cues):
    chains, labels, seed = [], [], 7
    for c in cues:
        t, kind, pr = float(c['segundos']), c['tipo'], params(c['parametros'])
        seed += 1
        lab = f'e{len(labels)}'
        if kind == 'whoosh':
            L = float(pr.get('dur', 12)) / FPS * 1.3
            start = max(0.0, t - L * 0.8)
            low = 'lowpass=f=900,' if pr.get('grave') else ''
            src = (f"anoisesrc=d={L:.3f}:c=pink:r={SR}:a=0.9:seed={seed},highpass=f=160,{low}"
                   f"bandpass=f={500 if pr.get('grave') else 1100}:width_type=q:w=0.7,"
                   f"afade=t=in:st=0:d={L * 0.8:.3f}:curve=exp,afade=t=out:st={L * 0.8:.3f}:d={L * 0.2:.3f}:curve=qsin,"
                   f"volume={(4.2 if pr.get('grave') else 3.2) * float(pr.get('vol', 1)):.3f},{pan(float(pr.get('pan', 0)))}")
        elif kind == 'tick':
            forte = pr.get('forte')
            d = 0.014 if forte else 0.009
            start = t
            src = (f"anoisesrc=d={d}:c=white:r={SR}:a=1:seed={seed},highpass=f={1400 if forte else 2600},"
                   f"afade=t=out:st=0.001:d={d - 0.001:.3f}:curve=exp,volume={0.55 if forte else 0.32},{pan(0.1 if forte else 0.25)}")
        elif kind == 'hit':
            fin = pr.get('final')
            d = 1.6 if fin else 0.45
            start = t
            src = (f"aevalsrc=exprs='(0.6*sin(2*PI*{42 if fin else 48}*t)+0.17*sin(2*PI*{84 if fin else 96}*t))*exp(-t*{3 if fin else 9})'"
                   f":d={d}:s={SR},{pan(0)}")
        elif kind == 'riser':
            d = float(pr.get('dur', 100)) / FPS - 0.3            # termina 0,3 s antes da assinatura
            start = t
            k = (440 - 110) / (2 * d)
            src = (f"aevalsrc=exprs='0.19*sin(2*PI*(110*t+{k:.4f}*t*t))*pow(t/{d:.3f},1.6)':d={d:.3f}:s={SR},"
                   f"afade=t=out:st={d - 0.06:.3f}:d=0.06,{pan(0)}[r{lab}];"
                   f"anoisesrc=d={d:.3f}:c=pink:r={SR}:a=0.7:seed={seed},bandpass=f=2200:width_type=q:w=0.6,"
                   f"afade=t=in:st=0:d={d:.3f}:curve=exp,afade=t=out:st={d - 0.06:.3f}:d=0.06,volume=1.05,{pan(0)}[n{lab}];"
                   f"[r{lab}][n{lab}]amix=inputs=2:normalize=0")
        elif kind == 'pulso':
            start = t
            v = 0.34 if pr.get('tempo') == '1' else 0.22
            src = f"aevalsrc=exprs='{v}*sin(2*PI*(110*t-160*t*t))*exp(-t*20)':d=0.22:s={SR},{pan(0)}"
        else:
            continue
        ms = int(round(start * 1000))
        chains.append(f"{src},aformat=sample_rates={SR}:channel_layouts=stereo,adelay=delays={ms}:all=1[{lab}]")
        labels.append(lab)
    mix = ''.join(f'[{l}]' for l in labels)
    graph = ';\n'.join(chains) + f";\n{mix}amix=inputs={len(labels)}:normalize=0:dropout_transition=0,"
    graph += f"apad=whole_dur={DUR},atrim=0:{DUR},alimiter=limit=0.9:attack=2:release=40[out]"
    return graph, len(labels)


def run(args):
    r = subprocess.run([FF, '-hide_banner', '-y'] + args, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-3000:]); sys.exit(1)
    return r.stderr


def main():
    cues_path = os.path.join(OUT, f'cues-{FILM}{SFX}.csv')
    if not os.path.exists(cues_path):
        sys.exit(f'falta {cues_path} — rode antes: node docs/motion/render.js cues --filme={FILM}' + (f' --lang={LANG}' if SFX else ''))
    cues = list(csv.DictReader(open(cues_path)))
    graph, n = build(cues)
    gfile = os.path.join(OUT, 'audio-graph.txt')
    open(gfile, 'w').write(graph)
    raw = os.path.join(OUT, 'audio-bruto.wav')
    run(['-filter_complex_script', gfile, '-map', '[out]', '-ar', str(SR), '-c:a', 'pcm_s24le', raw])
    # loudnorm em duas passadas: mede, depois aplica linear
    err = run(['-i', raw, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
    m = json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', err, re.S).group(0))
    wav = os.path.join(OUT, f'audio-{FILM}{SFX}.wav')
    run(['-i', raw, '-af', (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
                            f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"),
         '-ar', str(SR), '-c:a', 'pcm_s24le', '-t', str(DUR), wav])
    def measure(path):
        e = run(['-i', path, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'])
        return json.loads(re.search(r'\{[^{}]*"input_i"[^{}]*\}', e, re.S).group(0))
    got = measure(wav)
    # o modo linear recua quando o pico não deixa subir: completa com ganho + limitador
    gain = -14.0 - float(got['input_i'])
    if abs(gain) > 0.2:
        tmp = wav + '.tmp.wav'
        os.replace(wav, tmp)
        run(['-i', tmp, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.84:attack=1:release=30:level=disabled',
             '-ar', str(SR), '-c:a', 'pcm_s24le', '-t', str(DUR), wav])
        os.remove(tmp)
        got = measure(wav)
    print(f"{n} eventos · loudness integrado {got['input_i']} LUFS · pico {got['input_tp']} dBTP")
    base = f'bracerum-{FILM}{SFX}'
    mudo = os.path.join(OUT, base + '_mudo.mp4')
    final = os.path.join(OUT, base + '.mp4')
    if os.path.exists(mudo):
        run(['-i', mudo, '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
             '-t', str(DUR), '-movflags', '+faststart', final])
        print('master com som →', final)
    else:
        print('master mudo ainda não existe; áudio em', wav)
    os.remove(raw); os.remove(gfile)


if __name__ == '__main__':
    main()
