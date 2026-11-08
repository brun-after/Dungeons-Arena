"""Sons das skills do Necromante (07/11/2026, D-136): graves e levemente macabros, sem voz nem grito.

Sintetizados aqui, só com a biblioteca padrão (sem FFmpeg nem numpy), em WAV mono de 32 kHz com pico de -5 dBFS, como
as adaptações de tools/audio/adaptar.mjs. Determinísticos (semente fixa): rodar de novo gera os mesmos bytes.

    python tools/audio/necromancia.py

Gera em public/audio/ e atualiza o manifesto (fonte `necromancia`, CC0, com `adaptacao` para o importar.py preservar):
- necro_conjura-1/2: o zumbido grave que cresce (dois tons desafinados batendo devagar, com sopro filtrado);
- necro_sombra-1/2: o "vum" abafado das trevas (ruído grave descendo, com o sub de 45 Hz e eco curto);
- necro_ossos-1/2: a pancada grave com estalos secos de osso.
"""

import hashlib
import json
import math
import random
import struct
import wave
from pathlib import Path

TAXA = 32000
RAIZ = Path(__file__).resolve().parents[2]
SAIDA = RAIZ / 'public' / 'audio'


def envelope(t, ataque, duracao, saida):
    """Sobe em `ataque` s e desce nos últimos `saida` s."""
    if t < ataque:
        return t / ataque
    if t > duracao - saida:
        return max(0.0, (duracao - t) / saida)
    return 1.0


class PassaBaixa:
    """Filtro de um polo (o grave abafado)."""

    def __init__(self, corte):
        self.y = 0.0
        self.definir(corte)

    def definir(self, corte):
        self.a = 1 - math.exp(-2 * math.pi * corte / TAXA)

    def __call__(self, x):
        self.y += self.a * (x - self.y)
        return self.y


def eco(amostras, atraso_s, ganho, vezes):
    saida = list(amostras) + [0.0] * int(atraso_s * TAXA * vezes)
    passo = int(atraso_s * TAXA)
    for k in range(1, vezes + 1):
        g = ganho ** k
        for i, x in enumerate(amostras):
            saida[i + passo * k] += x * g
    return saida


def conjura(semente, base):
    rng = random.Random(semente)
    dur = 1.1
    sopro = PassaBaixa(380)
    s = []
    for i in range(int(dur * TAXA)):
        t = i / TAXA
        cresce = min(1.0, t / 0.7) ** 1.6
        tom = math.sin(2 * math.pi * base * t) + 0.8 * math.sin(2 * math.pi * (base * 1.012) * t + 0.4)
        tom += 0.35 * math.sin(2 * math.pi * base * 2 * t)
        ar = sopro(rng.uniform(-1, 1)) * 2.2
        s.append((tom * 0.55 + ar * 0.45) * cresce * envelope(t, 0.02, dur, 0.35))
    return s


def sombra(semente, sub):
    rng = random.Random(semente)
    dur = 0.9
    filtro = PassaBaixa(900)
    s = []
    for i in range(int(dur * TAXA)):
        t = i / TAXA
        filtro.definir(900 * math.exp(-t * 4) + 120)
        ruido = filtro(rng.uniform(-1, 1)) * 2.5
        grave = math.sin(2 * math.pi * (sub + 25 * math.exp(-t * 6)) * t)
        s.append((ruido * 0.5 + grave * 0.7) * envelope(t, 0.015, dur, 0.5))
    return eco(s, 0.11, 0.35, 3)


def ossos(semente, base):
    rng = random.Random(semente)
    dur = 0.75
    s = [0.0] * int(dur * TAXA)
    # A pancada: um seno que cai de tom.
    fase = 0.0
    for i in range(len(s)):
        t = i / TAXA
        f = base * (0.5 + 0.5 * math.exp(-t * 18))
        fase += 2 * math.pi * f / TAXA
        s[i] += math.sin(fase) * math.exp(-t * 7) * 0.9
    # Os estalos secos: ruído em pulsos curtos, mais agudos, um atrás do outro.
    for k in range(rng.randint(5, 7)):
        inicio = int((0.01 + k * rng.uniform(0.035, 0.06)) * TAXA)
        clique = PassaBaixa(rng.uniform(1800, 2600))
        for j in range(int(0.018 * TAXA)):
            if inicio + j >= len(s):
                break
            s[inicio + j] += clique(rng.uniform(-1, 1)) * math.exp(-j / (0.004 * TAXA)) * 1.6 * (1 - k * 0.1)
    return eco(s, 0.07, 0.25, 2)


def gravar(nome, amostras):
    pico = max(1e-9, max(abs(x) for x in amostras))
    alvo = 10 ** (-5 / 20)
    dados = b''.join(struct.pack('<h', int(max(-1, min(1, x / pico * alvo)) * 32767)) for x in amostras)
    caminho = SAIDA / f'{nome}.wav'
    with wave.open(str(caminho), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(TAXA)
        w.writeframes(dados)
    return caminho, len(amostras) / TAXA


def main():
    sons = {
        'necro_conjura-1': conjura(101, 55),
        'necro_conjura-2': conjura(102, 49),
        'necro_sombra-1': sombra(201, 45),
        'necro_sombra-2': sombra(202, 40),
        'necro_ossos-1': ossos(301, 95),
        'necro_ossos-2': ossos(302, 82),
    }
    manifesto_caminho = SAIDA / 'manifesto.json'
    manifesto = json.loads(manifesto_caminho.read_text(encoding='utf-8'))
    manifesto['fontes']['necromancia'] = {
        'autor': 'Dungeons Arena',
        'titulo': 'Sons do Necromante (sintetizados por tools/audio/necromancia.py)',
        'pagina': 'https://github.com/brun-after/Dungeons-Arena/blob/main/tools/audio/necromancia.py',
        'licenca': 'CC0-1.0',
        'licencaUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
    }
    script = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    for nome, amostras in sons.items():
        caminho, duracao = gravar(nome, amostras)
        manifesto['arquivos'][nome] = {
            'arquivo': caminho.name,
            'fonte': 'necromancia',
            'original': 'necromancia.py',
            'tipo': 'efeito',
            'duracao': round(duracao, 3),
            'sha256': hashlib.sha256(caminho.read_bytes()).hexdigest(),
            'originalSha256': script,
            'adaptacao': 'sintetizado: WAV mono de 32 kHz, pico de -5 dBFS',
        }
    for som in ('necro_conjura', 'necro_sombra', 'necro_ossos'):
        manifesto['efeitos'][som] = [f'{som}-1', f'{som}-2']
    manifesto_caminho.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
