import os, subprocess, sys
SP=os.environ.get('BP_WORK','/tmp/bp-animatic')   # pasta de trabalho: fontes, cartelas, segmentos
REPO=os.environ.get('BP_REPO', os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
FF=os.environ.get('BP_FFMPEG','ffmpeg')
OUT=f'{SP}/anim/seg'; os.makedirs(OUT,exist_ok=True)
CARD=f'{SP}/anim/cards'
CLIP=f'{REPO}/assets/video/voo-passaro-01.mp4'

def run(a):
    r=subprocess.run(a,capture_output=True,text=True)
    if r.returncode!=0:
        print(' '.join(a)[:400]); print(r.stderr[-1500:]); sys.exit(1)

def still(n, img, dur, z0, z1, card, dx=0, dy=0):
    """Ken Burns: zoom z0→z1 com deriva, 1920x1080@30"""
    f=int(round(dur*30))
    zexp=f"{z0}+({z1-z0})*on/{f-1}"
    xexp=f"iw/2-(iw/zoom/2)+({dx})*on/{f-1}"
    yexp=f"ih/2-(ih/zoom/2)+({dy})*on/{f-1}"
    vf=(f"scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,"
        f"zoompan=z='{zexp}':d=1:x='{xexp}':y='{yexp}':s=1920x1080:fps=30,setsar=1")
    run([FF,'-y','-loop','1','-framerate','30','-t',str(dur),'-i',img,'-i',f'{CARD}/{card}.png',
         '-filter_complex',f"[0:v]{vf}[bg];[bg][1:v]overlay=0:0,format=yuv420p[v]",
         '-map','[v]','-r','30','-c:v','libx264','-crf','17','-preset','veryfast',
         '-pix_fmt','yuv420p',f'{OUT}/{n}.mp4'])

def slate(n, card, dur):
    run([FF,'-y','-loop','1','-framerate','30','-t',str(dur),'-i',f'{CARD}/{card}.png',
         '-vf','setsar=1,format=yuv420p','-r','30','-c:v','libx264','-crf','17','-preset','veryfast',
         f'{OUT}/{n}.mp4'])

def clip(n, ss, src_dur, stretch, card, out_dur, rev=False):
    """trecho do voo de pássaro, retimado; stretch = fator de PTS"""
    pre='reverse,' if rev else ''
    vf=(f"{pre}setpts={stretch}*PTS,fps=30,scale=-2:1080,crop=1920:1080,setsar=1")
    run([FF,'-y','-ss',str(ss),'-t',str(src_dur),'-i',CLIP,'-i',f'{CARD}/{card}.png',
         '-filter_complex',f"[0:v]{vf}[bg];[bg][1:v]overlay=0:0,format=yuv420p[v]",
         '-map','[v]','-r','30','-t',str(out_dur),'-c:v','libx264','-crf','17','-preset','veryfast',
         '-an',f'{OUT}/{n}.mp4'])

A=lambda p: f'{REPO}/{p}'
S=[]
def add(n): S.append(n)

clip('01_t01',0,1.8,1.6667,'t01',3.0);                                              add('01_t01')
slate('02_b01','s02',2);                                                        add('02_b01')
still('03_t02',A('assets/web/vista-aerea-park-02.jpg'),4,1.60,1.02,'t02',dy=90);add('03_t02')
still('04_t03',A('assets/web/vista-aerea-park-02.jpg'),3,1.18,1.04,'t03');      add('04_t03')
slate('05_b02','s04',2);                                                        add('05_b02')
still('06_t04',A('assets/park/vias-galpao.jpg'),2,1.04,1.18,'t04',dx=-80);      add('06_t04')
still('07_t05',A('assets/park/vias-caminhoes.jpg'),2,1.06,1.16,'t05',dx=-80);   add('07_t05')
slate('08_b03','s05',2);                                                        add('08_b03')
still('09_t06',A('assets/park/fabrica-bracerum.jpg'),3,1.16,1.04,'t06');        add('09_t06')
clip('10_t07',2.6,2.2,1.8182,'t07',4.0);                                            add('10_t07')
slate('11_c1','c1',1);                                                          add('11_c1')
slate('12_t08','t08',2);                                                        add('12_t08')
slate('13_t09','t09',2);                                                        add('13_t09')
slate('14_t10','t10',2);                                                        add('14_t10')
slate('15_c2','c2',1);                                                          add('15_c2')
still('16_t11',A('assets/park/select-shopping-lago.jpg'),2,1.04,1.15,'t11');    add('16_t11')
slate('17_t12','t12',2);                                                        add('17_t12')
still('18_t13',A('assets/park/select-posto-noturno.jpg'),2,1.15,1.04,'t13');    add('18_t13')
slate('19_c3','c3',1);                                                          add('19_c3')
still('20_t14',A('assets/park/hotel-noturno.jpg'),3,1.10,1.20,'t14',dx=-150);add('20_t14')
still('21_t15',A('assets/park/hotel-auditorio.jpg'),2,1.06,1.16,'t15');         add('21_t15')
still('22_t16',A('assets/renders/pavilhao-eventos-1.jpg'),1,1.10,1.16,'t16');   add('22_t16')
slate('23_c4','c4',1);                                                          add('23_c4')
still('24_t17',A('assets/park/resort-lago-aereo.jpg'),3,1.16,1.04,'t17');       add('24_t17')
still('25_t18',A('assets/park/resort-lago-fonte.jpg'),2,1.04,1.12,'t18');       add('25_t18')
still('26_t19',A('assets/park/amen-quadras.jpg'),1,1.12,1.06,'t19');            add('26_t19')
clip('27_t20',0,1.6,1.875,'t20',3.0,rev=True);                                      add('27_t20')
slate('28_sig','sig',2);                                                        add('28_sig')

with open(f'{OUT}/list.txt','w') as f:
    for n in S: f.write(f"file '{OUT}/{n}.mp4'\n")
print('segmentos:',len(S))
