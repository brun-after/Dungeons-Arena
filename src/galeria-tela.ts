// Galeria de efeitos (marco 26, 29/10/2026, D-124): ?galeria=efeitos[&visao=iso]. Ferramenta para revisar as
// assinaturas das 419 skills sem jogar: a lista por classe (com as ultimates), as gerais, as dos inimigos e uma gerada
// por elemento e forma; tocar numa skill solta o efeito de quem conjura (à esquerda) num boneco (à direita), na visão
// de cima ou isométrica. "Tocar todas" percorre a lista. Não há simulação: as fases da assinatura são chamadas
// direto, com as mesmas peças do jogo (partículas, pincel, marcas e deslize).

import { Graphics } from 'pixi.js';
import type { AssinaturaVisual } from './combat/assinaturas-visuais';
import { resolverHabilidade } from './combat/compilar-habilidade';
import type { Habilidade } from './combat/habilidades';
import { conteudoOficial } from './core/conteudo';
import { BALANCE_PADRAO } from './core/contexto';
import { CELULA_PX } from './render/camera-calculo';
import { ControladorImpacto } from './render/impacto';
import { SistemaParticulas } from './render/particulas';
import { centroDaCelula, criarProjecao, type Projecao } from './render/projecao';
import { criarPalco } from './render/stage';
import { visualDe } from './render/visual-habilidade';
import { ASSINATURAS } from './render/vfx/assinaturas';
import type { P } from './render/vfx/cena';
import { DiretorVfx } from './render/vfx/diretor';
import { assinaturaDe, formaVfx } from './render/vfx/resolver';

const LARGURA = 14;
const ALTURA = 10;
const CONJURADOR: P = { x: 3, y: 5 };
const BONECO_INICIAL: P = { x: 8, y: 5 };
const INTERVALO_TODAS_MS = 1700;

interface Grupo {
  titulo: string;
  ids: string[];
}

/** As skills por grupo: cada classe (exclusivas e ultimates), as gerais, as dos inimigos e as geradas. */
const FORMAS = ['Comum', 'Épica', 'Lendária', 'Última'];

function grupos(): { grupos: Grupo[]; habilidade: (id: string) => Habilidade | undefined } {
  const c = conteudoOficial();
  const ctx = { conteudo: c, balance: BALANCE_PADRAO };
  // Marco 27 (D-126): `id#n` é o básico de uma arma na forma n (Comum 0 a Última 3).
  const habilidade = (id: string) => {
    const base = id.split('#')[0] ?? id;
    return resolverHabilidade(ctx, base) ?? c.habilidades.get(base);
  };
  const usados = new Set<string>();
  const lista: Grupo[] = [];
  for (const classe of c.classes.values()) {
    const ids = [classe.ataqueBasico, ...classe.exclusivas].filter((id): id is string => !!id && !!habilidade(id));
    const ults = [...c.ultimates.values()].filter((u) => u.classe === classe.id).map((u) => u.id);
    const etapas = [...c.habilidades.keys()].filter((id) => ults.some((u) => id.startsWith(`${u}_`) && /_\d+$/.test(id)));
    lista.push({ titulo: classe.nome, ids: [...ids, ...ults, ...etapas] });
    for (const id of [...ids, ...ults, ...etapas]) usados.add(id);
  }
  const resto = [...c.habilidades.values()].filter((h) => !usados.has(h.id) && !h.passiva).map((h) => h.id);
  lista.push({ titulo: 'Gerais e inimigos', ids: resto });
  // Uma gerada por elemento e forma (as sementes que cobrem as combinações).
  const geradas = new Map<string, string>();
  for (let semente = 1; semente < 3000 && geradas.size < 48; semente++) {
    const id = `g_${semente}_1`;
    const h = habilidade(id);
    if (h?.elemento) {
      const k = `${h.elemento}:${formaVfx(h)}`;
      if (!geradas.has(k)) geradas.set(k, id);
    }
  }
  lista.push({ titulo: 'Geradas (elemento e forma)', ids: [...geradas.values()] });
  // Marco 27 (D-126): o básico de cada arma de classe nas 4 formas (o efeito cresce com a raridade).
  const basicos = [...new Set([...c.armas.armas.values()].map((a) => a.basico))];
  lista.push({ titulo: 'Armas (Comum, Épica, Lendária, Última)', ids: basicos.flatMap((b) => [0, 1, 2, 3].map((t) => `${b}#${String(t)}`)) });
  return { grupos: lista, habilidade };
}

/** As células da área (sem paredes: a galeria é um chão liso). */
function celulasDe(h: Habilidade, origem: P, mira: P): P[] {
  const r = Math.max(1, h.raioArea);
  const saida: P[] = [];
  const dx = mira.x - origem.x;
  const dy = mira.y - origem.y;
  const dist = Math.max(1, Math.hypot(dx, dy));
  for (let x = 0; x < LARGURA; x++) {
    for (let y = 0; y < ALTURA; y++) {
      const ox = x - origem.x;
      const oy = y - origem.y;
      const t = (ox * dx + oy * dy) / (dist * dist);
      const ang = Math.abs(Math.atan2(oy, ox) - Math.atan2(dy, dx));
      const dentro =
        h.tipoArea === 'ao_redor'
          ? Math.max(Math.abs(ox), Math.abs(oy)) <= r && (ox !== 0 || oy !== 0)
          : h.tipoArea === 'linha'
            ? t > 0 && t * dist <= Math.max(r, h.alcanceCelulas, 5) && Math.abs(ox * dy - oy * dx) / dist < 0.6
            : h.tipoArea === 'cone'
              ? Math.hypot(ox, oy) <= Math.max(r, 3) && Math.hypot(ox, oy) > 0 && Math.min(ang, Math.PI * 2 - ang) <= 0.6
              : Math.max(Math.abs(x - mira.x), Math.abs(y - mira.y)) <= r;
      if (dentro) saida.push({ x, y });
    }
  }
  return saida;
}

export async function iniciarGaleria(raiz: HTMLElement, params: URLSearchParams): Promise<void> {
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, classe: string, texto = ''): HTMLElementTagNameMap[K] => {
    const e = document.createElement(tag);
    e.className = classe;
    e.textContent = texto;
    return e;
  };
  const tela = el('div', 'galeria-efeitos');
  const host = el('div', 'galeria-palco');
  const lateral = el('aside', 'galeria-lista');
  const topo = el('header', '');
  const rotulo = el('label', '');
  const iso = el('input', 'galeria-iso');
  iso.type = 'checkbox';
  iso.checked = params.get('visao') === 'iso';
  rotulo.append(iso, ' isométrico');
  const botaoTodas = el('button', 'galeria-todas', 'Tocar todas');
  botaoTodas.type = 'button';
  const atual = el('output', 'galeria-atual');
  topo.append(el('strong', '', 'Galeria de efeitos'), rotulo, botaoTodas, atual);
  const listaEl = el('div', 'galeria-grupos');
  lateral.append(topo, listaEl);
  tela.append(host, lateral);
  raiz.replaceChildren(tela);
  const palco = await criarPalco(host);
  let projecao: Projecao = criarProjecao(iso.checked ? 'iso' : 'cima', LARGURA, ALTURA);
  const particulas = new SistemaParticulas(palco.efeitos, palco.app.renderer, () => projecao);
  particulas.limite = 600;
  const impacto = new ControladorImpacto(() => true);
  const diretor = new DiretorVfx({ efeitos: palco.efeitos, chao: palco.chao, particulas, impacto, reduzido: () => false });
  const chao = new Graphics();
  const corpos = new Graphics();
  palco.terreno.addChild(chao);
  palco.entidades.addChild(corpos);
  let boneco: P = { ...BONECO_INICIAL };
  const posicoes = (id: string): P | null => (id === 'conjurador' ? diretor.ponto('conjurador', CONJURADOR) : id === 'boneco' ? diretor.ponto('boneco', boneco) : null);
  diretor.definirPosicoes(posicoes);

  const enquadrar = () => {
    const l = palco.largura();
    const a = palco.altura();
    const escala = Math.min(l / projecao.largura, a / projecao.altura) * 0.95;
    palco.mundo.scale.set(escala);
    palco.mundo.position.set((l - projecao.largura * escala) / 2, (a - projecao.altura * escala) / 2);
    chao.clear();
    for (let x = 0; x < LARGURA; x++) {
      for (let y = 0; y < ALTURA; y++) {
        const c = [projecao.projetar(x * CELULA_PX, y * CELULA_PX), projecao.projetar((x + 1) * CELULA_PX, y * CELULA_PX), projecao.projetar((x + 1) * CELULA_PX, (y + 1) * CELULA_PX), projecao.projetar(x * CELULA_PX, (y + 1) * CELULA_PX)];
        chao.poly(c.flatMap((p) => [p.x, p.y])).fill((x + y) % 2 === 0 ? 0x2b2f3a : 0x262a34);
      }
    }
  };
  enquadrar();
  palco.aoRedimensionar(enquadrar);
  iso.addEventListener('change', () => {
    projecao = criarProjecao(iso.checked ? 'iso' : 'cima', LARGURA, ALTURA);
    diretor.limpar();
    particulas.limpar();
    enquadrar();
  });

  // O relógio da galeria: anda com o real (dividido por `lento`), para na pausa e avança à mão (`avancar`), para
  // revisar quadro a quadro.
  const lento = Math.max(1, Math.min(20, Number(params.get('lento') ?? 1) || 1));
  let relogio = 0;
  let pausado = false;
  // As tarefas no tempo (a conjuração, o voo do projétil e o acerto), pelo relógio da galeria.
  const agenda: { em: number; fazer: (agora: number) => boolean | undefined }[] = [];
  const depois = (ms: number, fazer: (agora: number) => boolean | undefined) => agenda.push({ em: relogio + ms, fazer });

  const { grupos: gs, habilidade } = grupos();
  const tocar = (id: string) => {
    const h = habilidade(id);
    if (!h) return;
    const nome: AssinaturaVisual = assinaturaDe(h);
    const def = ASSINATURAS[nome];
    const cor = visualDe(h).cor;
    const tier = Number(id.split('#')[1] ?? 0) || 0;
    atual.value = `${h.nome} › ${nome}${h.visual?.variante ? ` + ${h.visual.variante}` : ''}${id.includes('#') ? ` · ${FORMAS[tier] ?? ''}` : ''}`;
    boneco = { ...BONECO_INICIAL };
    const ultimate = /^ult_|^dom_/.test(h.id);
    const conjuraMs = ultimate ? 700 : 360;
    if (ultimate) diretor.circuloDaUltimate('conjurador', 'mago', cor, conjuraMs);
    for (let t = 0; t < conjuraMs; t += 120) depois(t, () => (diretor.conjurar(nome, CONJURADOR, cor), undefined));
    const forma = formaVfx(h);
    const acerto = () => {
      diretor.acertar(nome, { chave: h.id, fonteId: 'conjurador', alvoId: 'boneco', de: CONJURADOR, ate: boneco, cor, escala: ultimate ? 1.25 : 1, critico: false, indice: 0, tier }, h.visual?.variante, true);
      if (def.camera) impacto.pedir(def.camera, relogio);
      // O puxão e o empurrão deslizam o boneco (a corrente espera o gancho chegar).
      const tipos = h.efeitos.map((e) => e.tipo);
      if (tipos.includes('puxao')) {
        const para = { x: CONJURADOR.x + 1, y: CONJURADOR.y };
        diretor.deslocado('boneco', boneco, para, 'puxao', nome);
        boneco = para;
      } else if (tipos.includes('empurrao') || tipos.includes('arremessar')) {
        const para = { x: Math.min(LARGURA - 1, boneco.x + 2), y: boneco.y };
        diretor.deslocado('boneco', boneco, para, tipos.includes('arremessar') ? 'arremesso' : 'empurrao', nome);
        boneco = para;
      }
    };
    if (forma === 'projetil') {
      const voo = 420;
      depois(conjuraMs, (agora) => {
        const inicio = agora;
        let ultimoRastro = 0;
        agenda.push({ em: agora, fazer: (t) => {
          const f = Math.min(1, (t - inicio) / voo);
          const x = CONJURADOR.x + (boneco.x - CONJURADOR.x) * f;
          const y = CONJURADOR.y + (boneco.y - CONJURADOR.y) * f;
          const dir = { x: Math.sign(boneco.x - CONJURADOR.x), y: 0 };
          if (def.corpo) particulas.emitirLista(def.corpo, x, y, cor, undefined, dir);
          if (t - ultimoRastro > 30) {
            ultimoRastro = t;
            diretor.rastro(nome, x, y, cor, dir);
          }
          if (f >= 1) {
            acerto();
            return true;
          }
          return false;
        } });
        return undefined;
      });
    } else if (forma === 'contato') depois(conjuraMs, () => (acerto(), undefined));
    else if (forma === 'proprio') depois(conjuraMs, () => (diretor.emSi(nome, { chave: h.id, id: 'conjurador', pos: CONJURADOR, cor, escala: 1 }, h.visual?.variante), undefined));
    else {
      depois(conjuraMs, () => {
        const mira = h.tipoArea === 'ao_redor' ? CONJURADOR : boneco;
        const celulas = celulasDe(h, CONJURADOR, mira);
        const centro = celulas.length ? { x: celulas.reduce((s, c) => s + c.x, 0) / celulas.length, y: celulas.reduce((s, c) => s + c.y, 0) / celulas.length } : mira;
        const area = { chave: h.id, atorId: 'conjurador', origem: CONJURADOR, mira, centro, celulas, cor, escala: ultimate ? 1.25 : 1, tipoArea: h.tipoArea, raio: h.raioArea };
        if (!diretor.area(nome, area, h.visual?.variante)) diretor.rajada(nome, area);
        depois(260, () => (acerto(), undefined));
        return undefined;
      });
    }
  };

  for (const g of gs) {
    const secao = el('section', '');
    secao.append(el('h3', '', `${g.titulo} (${g.ids.length})`));
    for (const id of g.ids) {
      const h = habilidade(id);
      if (!h) continue;
      const b = el('button', '', id.includes('#') ? `${h.nome} · ${FORMAS[Number(id.split('#')[1])] ?? ''}` : h.nome);
      b.type = 'button';
      b.dataset.id = id;
      b.title = assinaturaDe(h);
      secao.append(b);
    }
    listaEl.append(secao);
  }
  listaEl.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-id]');
    if (b?.dataset.id) tocar(b.dataset.id);
  });
  const todos = gs.flatMap((g) => g.ids);
  let fila: ReturnType<typeof setInterval> | undefined;
  botaoTodas.addEventListener('click', () => {
    if (fila) {
      clearInterval(fila);
      fila = undefined;
      return;
    }
    let i = 0;
    fila = setInterval(() => {
      const id = todos[i++];
      if (!id) {
        clearInterval(fila);
        fila = undefined;
        return;
      }
      tocar(id);
    }, INTERVALO_TODAS_MS);
  });

  const passo = (dt: number) => {
    relogio += dt;
    const agora = relogio;
    for (let i = agenda.length - 1; i >= 0; i--) {
      const t = agenda[i];
      if (t && agora >= t.em && t.fazer(agora) !== false) agenda.splice(i, 1);
    }
    diretor.quadro(agora);
    particulas.atualizar(dt);
    desenhar(agora);
  };
  const desenhar = (agora: number) => {
    corpos.clear();
    for (const [p, c] of [[diretor.ponto('conjurador', CONJURADOR), 0x5dade2], [diretor.ponto('boneco', boneco), 0xc0392b]] as const) {
      const q = centroDaCelula(p.x, p.y);
      const t = projecao.projetar(q.x, q.y);
      corpos.ellipse(t.x, t.y, 14, 7).fill({ color: 0x000000, alpha: 0.35 });
      corpos.circle(t.x, t.y - (projecao.visao === 'iso' ? 18 : 0), 13).fill(c).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    }
    const q = impacto.quadro(agora);
    palco.mundo.pivot.set(-q.dx, -q.dy);
    palco.renderizar();
    document.body.dataset.galeria = 'pronta';
    document.body.dataset.particulas = String(particulas.quantidade);
  };
  let antes = performance.now();
  const quadro = (real: number) => {
    if (!pausado) passo(Math.min(100, real - antes) / lento);
    antes = real;
    requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
  // Para o e2e e para revisar: tocar, pausar e avançar o relógio em passos de 16 ms.
  (window as unknown as { __galeria?: unknown }).__galeria = {
    tocar,
    ids: todos,
    pausar: (sim: boolean) => {
      pausado = sim;
    },
    avancar: (ms: number) => {
      for (let t = 0; t < ms; t += 16) passo(Math.min(16, ms - t));
    },
    /** Onde o boneco aparece agora (em células, com o deslize). */
    boneco: () => diretor.ponto('boneco', boneco),
    animacoes: () => diretor.animacoes,
  };
}
