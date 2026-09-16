from PIL import Image, ImageDraw, ImageFont
import os
SP=os.environ.get('BP_WORK','/tmp/bp-animatic')   # pasta de trabalho: fontes, cartelas, segmentos
OUT=f'{SP}/anim/cards'; os.makedirs(OUT,exist_ok=True)
W,H=1920,1080
INK=(14,13,11); PAPER=(247,243,234); SAND=(203,184,143); BROWN=(71,51,21)
SERIF=f'{SP}/fonts/ns2.ttf'; SERIF_I=f'{SP}/fonts/ns1.ttf'
SANS='/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'
SANSB='/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'
F=lambda p,s: ImageFont.truetype(p,s)
PAD=110  # coluna, equivalente ao --pad-align do site

def track(d,xy,txt,font,fill,sp=0):
    x,y=xy
    for ch in txt:
        d.text((x,y),ch,font=font,fill=fill); x+=d.textlength(ch,font=font)+sp
    return x

def veil(img, h=420, op=0.62):
    """degradê ink subindo da base — mesma lógica do .masterplan__head"""
    g=Image.new('L',(1,h))
    for i in range(h):
        g.putpixel((0,i), int(255*op*(i/h)**1.6))
    g=g.resize((W,h))
    lay=Image.new('RGBA',(W,H),(0,0,0,0))
    ink=Image.new('RGBA',(W,h),INK+(255,)); ink.putalpha(g)
    lay.paste(ink,(0,H-h),ink)
    return Image.alpha_composite(img,lay)

def slug(img, tid, tc):
    """etiqueta de trabalho do animatic"""
    d=ImageDraw.Draw(img)
    f=F(SANSB,22)
    t=f'{tid}   {tc}'
    w=d.textlength(t,font=f)
    d.rectangle([PAD-16,44,PAD+w+34,44+44],fill=INK+(190,))
    track(d,(PAD,52),t,f,SAND+(255,),sp=1.6)
    return img

def legend(tid,tc,big=None,small=None,eyebrow=None,name=None):
    img=Image.new('RGBA',(W,H),(0,0,0,0))
    img=veil(img)
    d=ImageDraw.Draw(img)
    y=H-250
    if eyebrow:
        track(d,(PAD,y),eyebrow.upper(),F(SANSB,22),SAND+(255,),sp=3.4); y+=46
    if big:
        d.text((PAD,y),big,font=F(SANSB,86),fill=PAPER+(255,)); y+=110
    if name:
        d.text((PAD,y),name,font=F(SERIF_I,72),fill=PAPER+(255,)); y+=96
    if small:
        d.text((PAD,y),small,font=F(SANS,34),fill=PAPER+(225,))
    return slug(img,tid,tc)

def card(tid,tc,title,sub=None,rule=True):
    """cartela cheia em ink"""
    img=Image.new('RGBA',(W,H),INK+(255,))
    d=ImageDraw.Draw(img)
    f=F(SERIF_I,104)
    tw=d.textlength(title,font=f)
    d.text(((W-tw)/2,H/2-96),title,font=f,fill=PAPER+(255,))
    if rule:
        d.rectangle([W/2-120,H/2+58,W/2+120,H/2+59],fill=SAND+(255,))
    if sub:
        f2=F(SANSB,24); sw=sum(d.textlength(c,font=f2)+3.2 for c in sub.upper())
        track(d,((W-sw)/2,H/2+96),sub.upper(),f2,SAND+(255,),sp=3.2)
    return slug(img,tid,tc)

def placeholder(tid,tc,kind,what,note=None):
    """slate para take que ainda não existe (banco ou 3D a produzir)"""
    img=Image.new('RGBA',(W,H),(24,22,19,255))
    d=ImageDraw.Draw(img)
    for i in range(0,W+H,64):  # hachura discreta
        d.line([(i,0),(i-H,H)],fill=(34,31,26,255),width=1)
    d.rectangle([PAD,300,W-PAD,H-300],outline=SAND+(120,),width=2)
    f=F(SANSB,24); track(d,(PAD+56,364),kind.upper(),f,SAND+(255,),sp=3.4)
    d.text((PAD+56,420),what,font=F(SERIF,64),fill=PAPER+(255,))
    if note:
        d.text((PAD+56,H-420),note,font=F(SANS,30),fill=PAPER+(170,))
    return slug(img,tid,tc)

def signature():
    img=Image.new('RGBA',(W,H),INK+(255,))
    d=ImageDraw.Draw(img)
    f=F(SERIF,120); t='BRACERUM'
    tw=sum(d.textlength(c,font=f)+8 for c in t)
    track(d,((W-tw)/2,H/2-150),t,f,PAPER+(255,),sp=8)
    f2=F(SANSB,44); t2='PARK'
    tw2=sum(d.textlength(c,font=f2)+18 for c in t2)
    track(d,((W-tw2)/2,H/2+10),t2,f2,SAND+(255,),sp=18)
    d.rectangle([W/2-200,H/2+110,W/2+200,H/2+111],fill=SAND+(140,))
    f3=F(SANS,30); t3='bracerumpark.com   ·   Villeta   ·   Paraguai'
    d.text(((W-d.textlength(t3,font=f3))/2,H/2+150),t3,font=f3,fill=PAPER+(200,))
    d.rectangle([0,H-10,W,H],fill=(28,77,157,255))   # faixa institucional Bracerum
    return img

C={}
C['t01']=legend('T01','0:00')
C['s02']=placeholder('BANCO','0:03','take de banco','Mão de engenheiro sobre a planta','engineer blueprint hands golden hour close')
C['t02']=legend('T02','0:05',eyebrow='65 km de Assunção',big='MERCOSUL',small='Hidrovia Paraná–Paraguai  ·  Ruta PY19 · Acceso Sur')
C['t03']=legend('T03','0:09',big='1.819.856 m²',name='planejados')
C['s04']=placeholder('BANCO','0:12','take de banco','Barcaças no rio','barge convoy cargo deck aerial close')
C['t04']=legend('T04','0:14',big='989.642 m²',small='de lotes  ·  módulos de 40.000 m²')
C['t05']=legend('T05','0:16',small='Pátio de manobra  ·  doca')
C['s05']=placeholder('BANCO','0:18','take de banco','Interior de galpão, empilhadeira','warehouse interior forklift high bay')
C['t06']=legend('T06','0:20',eyebrow='Built-to-Suit',small='Steel Frame próprio')
C['t07']=legend('T07','0:23',big='1.480 m',small='de pista  ·  hangares 7.686 m²  ·  heliponto junto aos hangares')
C['c1']=card('CARTELA','0:27','Apoio e bem-estar','Bracerum Park')
C['t08']=placeholder('T08','0:28','take 3D a produzir','Enfermaria','Sem projeto no R04 — definir volumetria')
C['t09']=placeholder('T09','0:30','take 3D a produzir','Creche','Pendente de confirmação do cliente')
C['t10']=placeholder('T10','0:32','take 3D a produzir','Bombeiros civis','Viatura sem vermelho dominante')
C['c2']=card('CARTELA','0:34','Bracerum Select','comércio e serviços')
C['t11']=legend('T11','0:35',big='Shopping',small='lojas, praça de alimentação e galeria junto ao lago')
C['t12']=placeholder('T12','0:37','take 3D a produzir','Academia','Interior em contraluz, 2s')
C['t13']=legend('T13','0:39',small='Posto  ·  market  ·  banco  ·  praça de alimentação')
C['c3']=card('CARTELA','0:41','Bracerum Hotel','hospitalidade e convenções')
C['t14']=legend('T14','0:42',big='384 studios',small='de 35 m²  ·  1.700 vagas')
C['t15']=legend('T15','0:45',big='1.200 lugares',small='auditório')
C['t16']=legend('T16','0:47',small='Centro de convenções  ·  13.500 m²')
C['c4']=card('CARTELA','0:48','Bracerum Resort','condomínio fechado')
C['t17']=legend('T17','0:49',big='141 lotes',small='142.067 m²  ·  lago, clubhouse e quadras')
C['t18']=legend('T18','0:52')
C['t19']=legend('T19','0:54',small='Lago  ·  quadras  ·  clubhouse')
C['t20']=legend('T20','0:55',eyebrow='PARK · SELECT · HOTEL · RESORT')
C['sig']=signature()
for k,v in C.items(): v.save(f'{OUT}/{k}.png')
print('cartelas:',len(C))
