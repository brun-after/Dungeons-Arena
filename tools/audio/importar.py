"""Importa gravações licenciadas. Uso: python tools/audio/importar.py FONTES FFMPEG.
FONTES contém os pacotes originais extraídos, identificados no manifesto/CREDITOS.
Não gera áudio sintético: converte, ajusta volume e preserva a origem de cada gravação.
"""
from pathlib import Path
import sys, subprocess, re, json, hashlib
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parents[2]
RAW, FFMPEG = Path(sys.argv[1]).resolve(), str(Path(sys.argv[2]).resolve())
OUT = ROOT / 'public/audio'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'conjuracao-1.mp3').unlink(missing_ok=True)  # Gravação elétrica antiga, retirada do pacote.
SOURCES = {
 'kenney-rpg': ['Kenney', 'RPG Audio', 'https://kenney.nl/assets/rpg-audio', 'CC0-1.0'],
 'kenney-impact': ['Kenney', 'Impact Sounds', 'https://kenney.nl/assets/impact-sounds', 'CC0-1.0'],
 'rubberduck-rpg': ['rubberduck', '80 CC0 RPG SFX', 'https://opengameart.org/content/80-cc0-rpg-sfx', 'CC0-1.0'],
 'rubberduck-loops': ['rubberduck', '30 CC0 SFX loops', 'https://opengameart.org/content/30-cc0-sfx-loops', 'CC0-1.0'],
 'ice': ['bart', 'Ice spells', 'https://opengameart.org/content/ice-spells', 'CC0-1.0'],
 'electric': ['faxcorp', 'Electricity Game Sound Pack', 'https://opengameart.org/content/electricity-game-sound-pack', 'CC0-1.0'],
 'dark': ['qubodup', '3 dark magic spells', 'https://opengameart.org/content/3-dark-magic-spells', 'CC0-1.0'],
 'earth': ['qubodup', 'Earth Element Magic Spell', 'https://opengameart.org/content/earth-element-magic-spell', 'CC0-1.0'],
 'heal': ['DoKashiteru', '3 Heal Spells', 'https://opengameart.org/content/3-heal-spells', 'CC-BY-3.0'],
 'bow': ['dorkster; gravações-base de qubodup', 'Bow & Arrow Shot', 'https://opengameart.org/content/bow-arrow-shot', 'CC-BY-SA-3.0'],
 'fireloop': ['qubodup', 'Fire Loop', 'https://opengameart.org/content/fire-loop', 'CC-BY-3.0'],
 'waterdrips': ['Blender Foundation', 'Ambient water drips', 'https://opengameart.org/content/ambient-water-drips', 'CC-BY-3.0'],
 'wind': ['Lanea Zimmerman', 'Breeze', 'https://opengameart.org/content/breeze', 'CC-BY-4.0'],
 'choir': ['César da Rocha (cesisco)', 'Fantasy Choir-3 orchestral pieces', 'https://opengameart.org/content/fantasy-choir-3-orchestral-pieces', 'CC0-1.0'],
 'hope': ['MintoDog', 'Hope (Orchestral battle music)', 'https://opengameart.org/content/hopeorchestral-battle-music', 'CC0-1.0'],
 'cave': ['Brandon75689 (publicado por HaelDB)', 'Cave Theme', 'https://opengameart.org/content/cave-theme', 'CC0-1.0'],
 'unexplored': ['TAD e Bo Jingles', 'Unexplored Expansion', 'https://opengameart.org/content/unexplored-expansion', 'CC0-1.0'],
}
LIC = {'CC0-1.0':'https://creativecommons.org/publicdomain/zero/1.0/', 'CC-BY-3.0':'https://creativecommons.org/licenses/by/3.0/', 'CC-BY-SA-3.0':'https://creativecommons.org/licenses/by-sa/3.0/', 'CC-BY-4.0':'https://creativecommons.org/licenses/by/4.0/'}
items = []
effects = {}
def add(key, source, path, original=None, kind='efeito'):
 items.append(dict(id=key, fonte=source, caminho=path, original=original or Path(path).name, tipo=kind))
 return key

def series(som, source, paths):
 effects[som] = [add(f'{som}-{i+1}', source, p) for i,p in enumerate(paths)]

series('lamina','rubberduck-rpg',[f'rubberduck/blade_0{i}.ogg' for i in [1,2,3]])
series('golpe','kenney-rpg',['rpg/Audio/knifeSlice.ogg','rpg/Audio/knifeSlice2.ogg'])
series('acerto','kenney-impact',[f'impact/Audio/impactPunch_medium_00{i}.ogg' for i in range(3)])
series('contundente','kenney-impact',[f'impact/Audio/impactPunch_heavy_00{i}.ogg' for i in range(3)])
series('critico','kenney-impact',['impact/Audio/impactMetal_heavy_000.ogg','impact/Audio/impactMetal_heavy_001.ogg'])
series('falha','kenney-rpg',['rpg/Audio/cloth1.ogg','rpg/Audio/cloth2.ogg'])
series('magia','rubberduck-rpg',['rubberduck/spell_01.ogg','rubberduck/spell_02.ogg'])
effects['conjuracao'] = effects['magia']  # Sem o antigo charge.wav elétrico de quatro segundos.
series('arco','bow',['bow.ogg']); effects['projetil']=effects['arco']
series('acerto_projetil','kenney-impact',['impact/Audio/impactWood_light_000.ogg','impact/Audio/impactWood_light_001.ogg'])
series('lancamento_magico','rubberduck-rpg',['rubberduck/spell_02.ogg'])
series('fogo','rubberduck-rpg',['rubberduck/spell_fire_03.ogg','rubberduck/spell_fire_05.ogg','rubberduck/spell_fire_07.ogg'])
series('gelo','ice',['ice/ice.wav','ice/coldsnap.wav'])
series('raio','electric',['electric-hit.wav'])
series('veneno','rubberduck-rpg',['rubberduck/creature_slime_01.ogg','rubberduck/creature_slime_02.ogg'])
series('psiquico','dark',['dark/dark_magic/fout-02.flac'])
series('trevas','dark',['dark/dark_magic/fout-01.flac','dark/dark_magic/fout-03.flac'])
series('terra','earth',['earth.ogg'])
series('explosao','rubberduck-rpg',['rubberduck/spell_fire_01.ogg','rubberduck/spell_fire_06.ogg'])
series('cura','heal',['heal/healspell1.aif','heal/healspell2.aif'])
series('sagrado','heal',['heal/healspell3.aif'])
series('moeda','rubberduck-rpg',['rubberduck/item_coins_01.ogg','rubberduck/item_coins_02.ogg'])
series('coleta','rubberduck-rpg',['rubberduck/item_gem_01.ogg','rubberduck/item_gem_02.ogg'])
series('passo','kenney-impact',[f'impact/Audio/footstep_concrete_00{i}.ogg' for i in range(4)])
series('porta','kenney-rpg',['rpg/Audio/doorOpen_1.ogg','rpg/Audio/doorOpen_2.ogg'])
series('armadilha','rubberduck-rpg',['rubberduck/metal_01.ogg','rubberduck/metal_02.ogg'])
series('teleporte','electric',['electric-teleport.wav'])
series('morte','rubberduck-rpg',['rubberduck/creature_die_01.ogg'])
series('quebra','rubberduck-rpg',['rubberduck/wood_01.ogg','rubberduck/wood_02.ogg','rubberduck/stones_01.ogg'])
series('nivel','heal',['heal/healspell3.aif'])
series('clique','kenney-rpg',['rpg/Audio/metalClick.ogg'])
series('recusa','rubberduck-rpg',['rubberduck/lock_02.ogg'])
for key,src,path,original in [
 ('musica-caverna','cave','cave.ogg','cave themeb4.ogg'),
 ('musica-jornada','unexplored','unexplored.mp3','tad_-_unexplored_-_expanded_1_by_bo_jingles_0.mp3'),
 ('musica-esperanca','hope','hope.ogg','hope_orchestral_battle_music_bpm165_0.ogg'),
 ('musica-coro-1','choir','fantasy/Fantasy Choir 1.wav',None),
 ('musica-coro-2','choir','fantasy/Fantasy Choir 2.wav',None),
 ('musica-coro-3','choir','fantasy/Fantasy Choir 3.wav',None),
]: add(key,src,path,original,'musica')
for key,src,path in [('ambiente-fogo','fireloop','fireloop.ogg'),('ambiente-agua','rubberduck-loops','ambience/water_flowing.ogg'),('ambiente-vento','wind','wind.ogg'),('ambiente-goteira','waterdrips','waterdrips.flac')]:add(key,src,path,kind='ambiente')

ORIGINAIS = {'bow.ogg':'shoot.ogg', 'electric-hit.wav':'hit.wav', 'electric-charge.wav':'charge.wav', 'electric-teleport.wav':'teleport_1.wav', 'earth.ogg':'Earth Element Magic Spell_3.ogg', 'fireloop.ogg':'qubodupFireLoop.ogg', 'waterdrips.flac':'amb_waterdrip_1.flac', 'wind.ogg':'wind_0.ogg'}
for item in items:
 item['original'] = ORIGINAIS.get(item['caminho'], item['original'])

def convert(item):
 src=RAW/item['caminho']; out=OUT/(item['id']+'.mp3')
 # Normalização de pico nos efeitos; loudness musical -21 LUFS evita encobrir o combate.
 check=subprocess.run([FFMPEG,'-hide_banner','-i',str(src),'-af','volumedetect','-f','null','-'],capture_output=True,text=True,check=True)
 peak=float(re.search(r'max_volume: ([-\d.]+) dB',check.stderr)[1])
 kind=item['tipo']; filtro='loudnorm=I=-21:TP=-3:LRA=9' if kind=='musica' else f'volume={-5-peak:.2f}dB'
 # Os temas não compostos como loops recebem uma pequena entrada/saída. Sem alterar pitch/andamento.
 if kind=='musica': filtro+=',afade=t=in:d=0.3,areverse,afade=t=in:d=0.8,areverse'
 subprocess.run([FFMPEG,'-hide_banner','-loglevel','error','-y','-i',str(src),'-af',filtro,'-ar','32000','-ac','2' if kind=='musica' else '1','-c:a','libmp3lame','-b:a','128k' if kind=='musica' else '80k',str(out)],check=True)
 probe=subprocess.run([FFMPEG,'-hide_banner','-i',str(out),'-f','null','-'],capture_output=True,text=True,check=True)
 h,m,sec=map(float,re.search(r'Duration: (\d+):(\d+):([\d.]+)',probe.stderr).groups())
 return item['id'],dict(arquivo=out.name,fonte=item['fonte'],original=item['original'],tipo=kind,duracao=round(h*3600+m*60+sec,3),sha256=hashlib.sha256(out.read_bytes()).hexdigest(),originalSha256=hashlib.sha256(src.read_bytes()).hexdigest())
files=dict(ThreadPoolExecutor(4).map(convert,items))
# 06/11/2026: o zunido e a invocação vêm de tools/audio/adaptar.mjs (WAV feito no navegador); ficam como estão.
antigo=json.loads((OUT/'manifesto.json').read_text(encoding='utf-8')) if (OUT/'manifesto.json').exists() else {}
adaptados={k:v for k,v in antigo.get('arquivos',{}).items() if 'adaptacao' in v}
files.update(adaptados)
for som in ['zunido','invocacao']:
 if som in antigo.get('efeitos',{}): effects[som]=antigo['efeitos'][som]
manifest=dict(versao=2,fontes={**{k:dict(autor=a,titulo=t,pagina=p,licenca=l,licencaUrl=LIC[l]) for k,(a,t,p,l) in SOURCES.items()},**{k:v for k,v in antigo.get('fontes',{}).items() if k in {a['fonte'] for a in adaptados.values()}}},arquivos=files,efeitos=effects,ambientes={k:'ambiente-'+k for k in ['fogo','agua','vento','goteira']},musicas=dict(exploracao=['musica-jornada','musica-coro-1','musica-caverna'],combate=['musica-esperanca','musica-coro-3'],chefe=['musica-coro-2','musica-coro-3']))
(OUT/'manifesto.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
credits=['# Créditos de áudio — Dungeons Arena','', 'Gravações de terceiros distribuídas com o jogo. As licenças abaixo aplicam-se aos arquivos de áudio indicados, independentemente da licença do código.','', 'Adaptações: conversão para MP3, ajuste de volume e fades curtos nas músicas. O áudio de arco adaptado mantém CC-BY-SA 3.0. Não há mudança de autoria.','']
for key,(a,t,p,l) in SOURCES.items():
 used=[v for v in files.values() if v['fonte']==key]
 credits.extend([f'## {t}',f'Autor: {a}. Fonte: {p}',f'Licença: {l} — {LIC[l]}','Arquivos: '+', '.join(v['arquivo']+' (original: '+v['original']+')' for v in used),''])
credits.extend(['O arco de dorkster usa gravações-base de qubodup: https://opengameart.org/content/swish-bamboo-stick-weapon-swhoshes e https://opengameart.org/content/arrow-hit-twang. A adaptação distribuída permanece CC-BY-SA 3.0.', '', 'O manifesto JSON preserva a origem, duração e SHA-256 de cada original e arquivo convertido. Os pacotes completos não são necessários para executar o jogo.',''])
(OUT/'CREDITOS.md').write_text('\n'.join(credits),encoding='utf-8')
print(f'{len(files)} gravações; {sum(p.stat().st_size for p in OUT.glob("*.mp3"))/1024/1024:.2f} MiB')
