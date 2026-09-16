# Animatic de 60 s — como foi feito e como refazer

`docs/ae/preview/bracerum-60s-animatic.mp4` é o **preview de tempo e ritmo** do filme: 60,0 s,
1920×1080, 30 fps, mudo. Serve para validar corte e leitura de texto **antes** de montar no After
Effects, e para o Astra-6 conferir o resultado contra o comando em `docs/ae/PROMPT-ASTRA-AE.md`.

**Não é o filme.** Os takes 3D não existem ainda: cada plano usa render estático com Ken Burns, o
clipe aéreo nos três planos previstos, e *slate* onde não há material. A etiqueta no canto superior
esquerdo mostra o ID do take e o TC, para casar com o roteiro e com o projeto do AE.

## Refazer

```bash
export BP_WORK=/tmp/bp-animatic          # pasta de trabalho
export BP_FFMPEG=ffmpeg                  # ou o caminho do seu binário
mkdir -p $BP_WORK/fonts
# Noto Serif (Google Fonts): salvar como ns1.ttf (Italic), ns2.ttf (Regular), ns3.ttf (Bold)
python3 docs/ae/animatic/cards.py        # gera cartelas e legendas
python3 docs/ae/animatic/build.py        # gera os 28 segmentos
ffmpeg -f concat -safe 0 -i $BP_WORK/anim/seg/list.txt -c copy raw.mp4
ffmpeg -i raw.mp4 -vf "fade=t=in:st=0:d=0.5,fade=t=out:st=59.2:d=0.8" \
       -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -movflags +faststart saida.mp4
```

Precisa de Python 3 com Pillow, ffmpeg, Noto Serif e Liberation Sans (ou Arial/Helvetica, ajustando
o caminho em `cards.py`).

## Decisões que valem para a montagem final

- **T14 usa `assets/park/hotel-noturno.jpg`, não `assets/web/hero-hotel-noturno.jpg`.** O render do
  hero tem iluminação cênica **vermelha** dominante, que viola a regra de marca "zero vermelho".
  O `hotel-noturno` é o mesmo conjunto só em azul. Mesmo nele há um resto de vermelho na borda
  direita: o enquadramento entra deslocado para a esquerda (`dx=-150`) para deixá-lo fora.
- Os planos do clipe aéreo estão com o time-stretch do roteiro (166,67% / 181,82% / 187,5%
  invertido). No ffmpeg isso é `setpts`, sem interpolação — **no After Effects use Pixel Motion**,
  senão o movimento tranca.
