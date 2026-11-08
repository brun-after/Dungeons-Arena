"""Sons dos golpes corpo a corpo (08/11/2026, D-138): um timbre por arma e por criatura.

Sintetizados só com a biblioteca padrão, em WAV mono de 32 kHz com pico de -5 dBFS, como tools/audio/necromancia.py.
Determinísticos (semente fixa): rodar de novo gera os mesmos bytes.

    python tools/audio/golpes.py

Cada golpe junta peças curtas: o zunido do ar (ruído num passa-faixa que desce), o impacto (um seno que cai de tom), o
estalo ou o esmagar (ruído filtrado em pulso) e, nas lâminas, o tinir do metal (parciais inarmônicas que decaem). As
lâminas são agudas; o machado e o montante, mais graves e pesados; a maça e o soco, só pancada; o baque surdo dos mortos
do Necromante não tem nada acima de uns 300 Hz. Gera em public/audio/ e atualiza o manifesto (fonte `golpes`, CC0).
"""

import hashlib
import json
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from necromancia import SAIDA, TAXA, PassaBaixa, gravar  # noqa: E402


class Biquad:
    """Filtro de segunda ordem (RBJ); a frequência pode mudar a cada amostra."""

    def __init__(self, tipo, freq, q):
        self.tipo, self.q = tipo, q
        self.x1 = self.x2 = self.y1 = self.y2 = 0.0
        self.definir(freq)

    def definir(self, freq):
        w = 2 * math.pi * min(freq, TAXA * 0.45) / TAXA
        alfa = math.sin(w) / (2 * self.q)
        c = math.cos(w)
        if self.tipo == 'faixa':
            b0, b1, b2 = alfa, 0.0, -alfa
        elif self.tipo == 'altas':
            b0, b1, b2 = (1 + c) / 2, -(1 + c), (1 + c) / 2
        else:
            b0, b1, b2 = (1 - c) / 2, 1 - c, (1 - c) / 2
        a0 = 1 + alfa
        self.b0, self.b1, self.b2 = b0 / a0, b1 / a0, b2 / a0
        self.a1, self.a2 = -2 * c / a0, (1 - alfa) / a0

    def __call__(self, x):
        y = self.b0 * x + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2
        self.x2, self.x1, self.y2, self.y1 = self.x1, x, self.y1, y
        return y


class Golpe:
    """Uma tela de áudio onde as peças se somam a partir de um instante."""

    def __init__(self, semente, duracao, tom=1.0):
        self.rng = random.Random(semente)
        self.s = [0.0] * int(duracao * TAXA)
        self.tom = tom

    def somar(self, inicio, pecas):
        i0 = int(inicio * TAXA)
        for j, x in enumerate(pecas):
            if i0 + j < len(self.s):
                self.s[i0 + j] += x

    def zunido(self, inicio, dur, f0, f1, ganho, q=1.6):
        """O ar cortado: ruído num passa-faixa que vai de f0 a f1, crescendo e sumindo (pico a 60%)."""
        filtro = Biquad('faixa', f0 * self.tom, q)
        pecas = []
        n = int(dur * TAXA)
        for i in range(n):
            f = i / n
            filtro.definir((f0 + (f1 - f0) * f) * self.tom)
            env = (f / 0.6) ** 1.5 if f < 0.6 else ((1 - f) / 0.4) ** 2
            pecas.append(filtro(self.rng.uniform(-1, 1)) * env * ganho * 3)
        self.somar(inicio, pecas)

    def pancada(self, inicio, f0, f1, decai, ganho):
        """O corpo do impacto: um seno que cai de f0 a f1 e decai em `decai` s."""
        pecas, fase = [], 0.0
        for i in range(int(decai * 5 * TAXA)):
            t = i / TAXA
            f = (f1 + (f0 - f1) * math.exp(-t * 30)) * self.tom
            fase += 2 * math.pi * f / TAXA
            ataque = min(1.0, t / 0.002)
            pecas.append(math.sin(fase) * math.exp(-t / decai) * ataque * ganho)
        self.somar(inicio, pecas)

    def ruido(self, inicio, dur, corte, ganho, tipo='baixas', q=0.8):
        """O estalo, o esmagar ou o rasgo: ruído filtrado num pulso que decai rápido."""
        filtro = Biquad(tipo, corte * self.tom, q)
        pecas = []
        for i in range(int(dur * TAXA)):
            t = i / TAXA
            pecas.append(filtro(self.rng.uniform(-1, 1)) * math.exp(-t / (dur / 4)) * min(1.0, t / 0.001) * ganho)
        self.somar(inicio, pecas)

    def tinir(self, inicio, freqs, decai, ganho):
        """O metal: parciais inarmônicas, as agudas sumindo antes."""
        pecas = []
        fases = [self.rng.uniform(0, 6.28) for _ in freqs]
        for i in range(int(decai * 5 * TAXA)):
            t = i / TAXA
            x = 0.0
            for k, f in enumerate(freqs):
                x += math.sin(2 * math.pi * f * self.tom * t + fases[k]) * math.exp(-t * (1 + k * 0.6) / decai) / (1 + k * 0.5)
            pecas.append(x * min(1.0, t / 0.001) * ganho)
        self.somar(inicio, pecas)

    def rosnado(self, inicio, dur, ganho):
        """O grave áspero (o lobo, a aranha): ruído grave com um tremor de 28 Hz."""
        filtro = PassaBaixa(320 * self.tom)
        pecas = []
        n = int(dur * TAXA)
        for i in range(n):
            t = i / TAXA
            tremor = 0.55 + 0.45 * math.sin(2 * math.pi * 28 * t)
            pecas.append(filtro(self.rng.uniform(-1, 1)) * 5 * tremor * math.sin(math.pi * i / n) * ganho)
        self.somar(inicio, pecas)

    def gosma(self, inicio, dur, ganho):
        """O esguicho viscoso: ruído num passa-faixa estreito que sobe e volta, com bolhas."""
        filtro = Biquad('faixa', 300, 5)
        pecas = []
        n = int(dur * TAXA)
        for i in range(n):
            f = i / n
            filtro.definir((280 + 900 * math.sin(math.pi * f) ** 2) * self.tom)
            pecas.append(filtro(self.rng.uniform(-1, 1)) * 4 * math.sin(math.pi * f) * ganho)
        self.somar(inicio, pecas)
        for k in range(3):
            self.pancada(inicio + 0.03 + k * dur / 4 + self.rng.uniform(0, 0.02), 220, 520, 0.02, ganho * 0.5)

    def amostras(self):
        # Um passa-altas suave de 40 Hz tira o deslocamento contínuo das pancadas.
        filtro = Biquad('altas', 40, 0.7)
        return [filtro(x) for x in self.s]


def espada(semente, tom):
    g = Golpe(semente, 0.42, tom)
    g.zunido(0, 0.15, 2600, 950, 0.8)
    g.ruido(0.11, 0.05, 2200, 0.7)
    g.pancada(0.11, 170, 85, 0.05, 0.6)
    g.tinir(0.11, [2650, 3970, 5310, 6620], 0.07, 0.22)
    return g.amostras()


def sabre(semente, tom):
    g = Golpe(semente, 0.36, tom)
    g.zunido(0, 0.11, 3300, 1300, 0.8, q=2)
    g.ruido(0.085, 0.035, 2800, 0.6)
    g.pancada(0.085, 190, 100, 0.04, 0.45)
    g.tinir(0.085, [3100, 4650, 6200], 0.05, 0.18)
    return g.amostras()


def faca(semente, tom):
    g = Golpe(semente, 0.26, tom)
    g.zunido(0, 0.08, 3600, 1900, 0.65, q=2.2)
    g.ruido(0.065, 0.03, 3000, 0.55)
    g.pancada(0.065, 210, 120, 0.03, 0.35)
    return g.amostras()


def machado(semente, tom):
    g = Golpe(semente, 0.5, tom)
    g.zunido(0, 0.19, 1500, 520, 0.85, q=1.3)
    g.pancada(0.15, 120, 55, 0.09, 1.0)
    g.ruido(0.15, 0.08, 1000, 0.9)
    g.tinir(0.15, [1750, 2600], 0.05, 0.12)
    return g.amostras()


def montante(semente, tom):
    g = Golpe(semente, 0.6, tom)
    g.zunido(0, 0.25, 1900, 600, 1.0, q=1.2)
    g.pancada(0.2, 105, 50, 0.1, 1.0)
    g.ruido(0.2, 0.07, 1500, 0.75)
    g.tinir(0.2, [1950, 2930, 4100, 5200], 0.1, 0.2)
    return g.amostras()


def lanca(semente, tom):
    g = Golpe(semente, 0.32, tom)
    g.zunido(0, 0.08, 1400, 2600, 0.6, q=2)
    g.ruido(0.07, 0.03, 2600, 0.8, tipo='faixa', q=1.2)
    g.pancada(0.07, 180, 95, 0.05, 0.7)
    return g.amostras()


def rapieira(semente, tom):
    g = Golpe(semente, 0.26, tom)
    g.zunido(0, 0.06, 3000, 4600, 0.5, q=2.5)
    g.ruido(0.055, 0.02, 4000, 0.5, tipo='faixa', q=1.5)
    g.tinir(0.055, [4300, 6150], 0.035, 0.16)
    g.pancada(0.055, 220, 130, 0.025, 0.3)
    return g.amostras()


def maca(semente, tom):
    g = Golpe(semente, 0.55, tom)
    g.zunido(0, 0.12, 900, 380, 0.5, q=1.2)
    g.pancada(0.09, 95, 42, 0.13, 1.0)
    g.ruido(0.09, 0.1, 650, 1.0)
    g.tinir(0.09, [720, 1180], 0.05, 0.1)
    return g.amostras()


def mangual(semente, tom):
    g = Golpe(semente, 0.6, tom)
    # A corrente chacoalhando antes da bola chegar.
    for k in range(5):
        g.ruido(0.012 + k * 0.024 + g.rng.uniform(0, 0.008), 0.012, 4200 + g.rng.uniform(-600, 600), 0.35, tipo='faixa', q=6)
    g.zunido(0, 0.14, 1000, 420, 0.45, q=1.2)
    g.pancada(0.13, 100, 45, 0.12, 1.0)
    g.ruido(0.13, 0.09, 700, 0.9)
    return g.amostras()


def cajado(semente, tom):
    g = Golpe(semente, 0.36, tom)
    g.zunido(0, 0.1, 1300, 600, 0.45, q=1.4)
    # A madeira: dois ressonadores estreitos tocados por um estalo.
    g.ruido(0.08, 0.04, 640, 1.2, tipo='faixa', q=9)
    g.ruido(0.08, 0.03, 1020, 0.8, tipo='faixa', q=9)
    g.pancada(0.08, 160, 105, 0.05, 0.55)
    return g.amostras()


def foice(semente, tom):
    g = Golpe(semente, 0.5, tom)
    g.zunido(0, 0.22, 2900, 700, 0.85, q=1.5)
    g.ruido(0.18, 0.05, 2100, 0.65)
    g.pancada(0.18, 150, 75, 0.05, 0.5)
    g.tinir(0.18, [3050, 4420, 5900], 0.08, 0.18)
    return g.amostras()


def livro(semente, tom):
    g = Golpe(semente, 0.3, tom)
    g.zunido(0, 0.07, 900, 500, 0.3)
    g.ruido(0.05, 0.02, 1600, 1.0, tipo='faixa', q=0.9)
    g.ruido(0.05, 0.06, 4200, 0.25, tipo='altas', q=0.7)
    g.pancada(0.05, 130, 80, 0.05, 0.7)
    return g.amostras()


def soco(semente, tom):
    g = Golpe(semente, 0.32, tom)
    g.zunido(0, 0.07, 1000, 480, 0.35)
    g.pancada(0.055, 135, 70, 0.07, 1.0)
    g.ruido(0.055, 0.035, 850, 0.7)
    return g.amostras()


def baque(semente, tom):
    """O baque surdo dos mortos do Necromante: abafado, sem metal nem estalo."""
    g = Golpe(semente, 0.55, tom)
    g.pancada(0.0, 78, 36, 0.14, 1.0)
    g.ruido(0.0, 0.14, 260, 1.3, q=0.6)
    g.pancada(0.012, 55, 30, 0.1, 0.5)
    return g.amostras()


def flecha(semente, tom):
    """A flecha cravando: o baque surdo dos mortos, um pouco mais agudo e curto, com o toque seco da ponta."""
    g = Golpe(semente, 0.4, tom)
    g.pancada(0.0, 125, 58, 0.09, 1.0)
    g.ruido(0.0, 0.1, 480, 1.1, q=0.6)
    g.ruido(0.0, 0.012, 1700, 0.35, tipo='faixa', q=2)
    return g.amostras()


def mordida(semente, tom):
    g = Golpe(semente, 0.36, tom)
    g.rosnado(0, 0.16, 0.6)
    # Os dentes batendo: dois estalos secos.
    g.ruido(0.07, 0.012, 2600, 1.0, tipo='faixa', q=3)
    g.ruido(0.105, 0.012, 2300, 0.8, tipo='faixa', q=3)
    g.pancada(0.07, 170, 110, 0.04, 0.45)
    return g.amostras()


def garra(semente, tom):
    g = Golpe(semente, 0.3, tom)
    for k in range(3):
        g.zunido(k * 0.045, 0.05, 5200, 2400, 0.45, q=1.4)
        g.ruido(k * 0.045 + 0.03, 0.03, 3200, 0.35, tipo='altas', q=0.8)
    g.pancada(0.12, 180, 110, 0.03, 0.3)
    return g.amostras()


def garra_pesada(semente, tom):
    g = Golpe(semente, 0.7, tom)
    g.zunido(0, 0.26, 950, 300, 1.0, q=1.1)
    g.rosnado(0.04, 0.22, 0.4)
    for k in range(3):
        g.ruido(0.2 + k * 0.018, 0.04, 1700, 0.5, tipo='faixa', q=1.2)
    g.pancada(0.2, 80, 34, 0.16, 1.0)
    g.ruido(0.2, 0.12, 500, 0.8)
    return g.amostras()


def gosma(semente, tom):
    g = Golpe(semente, 0.4, tom)
    g.gosma(0.0, 0.2, 0.9)
    g.pancada(0.02, 110, 70, 0.06, 0.5)
    return g.amostras()


def sombra(semente, tom):
    """As sombras e os espectros: um sopro duplo desafinado e uma pancada abafada."""
    g = Golpe(semente, 0.5, tom)
    g.zunido(0, 0.2, 1800, 450, 0.6, q=2.5)
    g.zunido(0.008, 0.2, 1900, 480, 0.5, q=2.5)
    g.pancada(0.16, 85, 45, 0.1, 0.7)
    g.ruido(0.16, 0.09, 420, 0.6)
    return g.amostras()


GOLPES = {
    'golpe_espada': espada,
    'golpe_sabre': sabre,
    'golpe_faca': faca,
    'golpe_machado': machado,
    'golpe_montante': montante,
    'golpe_lanca': lanca,
    'golpe_rapieira': rapieira,
    'golpe_maca': maca,
    'golpe_mangual': mangual,
    'golpe_cajado': cajado,
    'golpe_foice': foice,
    'golpe_livro': livro,
    'golpe_soco': soco,
    'golpe_baque': baque,
    'golpe_flecha': flecha,
    'golpe_mordida': mordida,
    'golpe_garra': garra,
    'golpe_garra_pesada': garra_pesada,
    'golpe_gosma': gosma,
    'golpe_sombra': sombra,
}


def main():
    manifesto_caminho = SAIDA / 'manifesto.json'
    manifesto = json.loads(manifesto_caminho.read_text(encoding='utf-8'))
    manifesto['fontes']['golpes'] = {
        'autor': 'Dungeons Arena',
        'titulo': 'Golpes corpo a corpo (sintetizados por tools/audio/golpes.py)',
        'pagina': 'https://github.com/brun-after/Dungeons-Arena/blob/main/tools/audio/golpes.py',
        'licenca': 'CC0-1.0',
        'licencaUrl': 'https://creativecommons.org/publicdomain/zero/1.0/',
    }
    script = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    for k, (som, gerar) in enumerate(GOLPES.items()):
        nomes = []
        # Duas variações: outra semente e o tom um pouco diferente.
        for v, tom in ((1, 1.0), (2, 0.93)):
            nome = f'{som}-{v}'
            caminho, duracao = gravar(nome, gerar(1000 + k * 10 + v, tom))
            manifesto['arquivos'][nome] = {
                'arquivo': caminho.name,
                'fonte': 'golpes',
                'original': 'golpes.py',
                'tipo': 'efeito',
                'duracao': round(duracao, 3),
                'sha256': hashlib.sha256(caminho.read_bytes()).hexdigest(),
                'originalSha256': script,
                'adaptacao': 'sintetizado: WAV mono de 32 kHz, pico de -5 dBFS',
            }
            nomes.append(nome)
        manifesto['efeitos'][som] = nomes
    manifesto_caminho.write_text(json.dumps(manifesto, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
