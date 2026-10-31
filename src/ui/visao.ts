// Visão da cena (§2.16, §4.5). Marco 13 (14/10/2026), D-058: de cima ou isométrica, trocada na hora (tecla V
// ou Configurações), sem recarregar; os modelos de criatura do atlas e a imagem do personagem.
// A simulação nunca sabe a visão: só a câmera, as camadas e a entrada mudam.

import { Texture, type TextureSource } from 'pixi.js';
import type { Balance } from '../core/contexto';
import type { VisaoJogo } from '../plataforma/preferencias';
import { aoMudarImagemToken, lerImagemToken } from '../plataforma/token';
import type { Camera } from '../render/camera';
import { criarDecoracaoIso, type DecoracaoIso } from '../render/decoracao-iso';
import { criarParedesIso, type ParedesIso } from '../render/paredes-iso';
import { criarEstruturasIso, type EstruturasIso } from '../render/estruturas-iso';
import { criarProjecao, type Projecao } from '../render/projecao';
import type { Palco } from '../render/stage';
import { carregarBiblioteca, destruirFonte, fontesDoToken, type BibliotecaCriaturas, type FonteToken } from '../render/texturas-criaturas';
import { prepararToken } from '../render/token-imagem';
import { paletaDe, type Terreno } from '../render/terreno';
import type { Fase } from '../world/fase';
import type { Tema } from '../world/temas';

export interface OpcoesVisao {
  palco: Palco;
  camera: Camera;
  fase: Fase;
  /** Marco 11A: a cor da parede do tileset do jogador (os prismas do isométrico); null usa a paleta da fase. */
  corParede?: number | null;
  /** Marco 26 (D-109): o terreno e o tema, para os enfeites e pilares em pé no isométrico. */
  terreno?: Terreno;
  tema?: Tema | null;
  /** Depois de trocar a visão ou o token: as camadas refazem o que depende disso. */
  aoTrocar: () => void;
  /** Marco 26 (D-113): os tipos de enfeite que vêm do estado (os quebráveis); o terreno e o isométrico os pulam. */
  quebraveis?: ReadonlySet<string>;
  /** Marco 31 (D-130): a altura e o esmaecimento das paredes, e a pedra das faces (chega depois; refaz as paredes). */
  paredeIso: Balance['visual']['paredeIso'];
  pedraParede?: Promise<ImageBitmap | null>;
}

export interface TokenProprio {
  emPe: FonteToken;
  cima: FonteToken;
}

export interface ControleVisao {
  projecao: () => Projecao;
  isometrico: () => boolean;
  biblioteca: () => BibliotecaCriaturas | null;
  tokenProprio: () => TokenProprio | null;
  definir: (v: VisaoJogo) => void;
  /** Marco 31 (D-130): a parede da frente esmaece perto do jogador (posição em células). */
  esmaecer: (jogador: { x: number; y: number } | null, dtMs: number) => void;
  destruir: () => void;
}

export async function montarVisao(o: OpcoesVisao): Promise<ControleVisao> {
  const { palco, camera, fase } = o;
  let paredes: ParedesIso | null = null;
  let estruturas: EstruturasIso | null = null;
  let enfeites: DecoracaoIso | null = null;
  let pedra: Texture | null = null;
  const corParede = o.corParede ?? paletaDe(fase.matizGraus).paredeTopo;
  const criarParedes = (p: Projecao) =>
    criarParedesIso(palco.entidades, fase, p, { cor: corParede, textura: pedra, altura: o.paredeIso.altura, raioFade: o.paredeIso.raioFade, alphaFade: o.paredeIso.alphaFade });
  const aplicar = () => {
    const p = camera.projecaoAtual;
    const iso = p.visao === 'iso';
    palco.definirMatrizPlano(p.matriz);
    paredes?.destruir();
    enfeites?.destruir();
    estruturas?.destruir();
    paredes = iso ? criarParedes(p) : null;
    // Marco 29 (D-128): as fachadas altas das estruturas do Mundo.
    estruturas = iso ? criarEstruturasIso(palco.entidades, fase, p) : null;
    enfeites = iso ? criarDecoracaoIso(palco.entidades, fase, o.tema ?? null, p, o.quebraveis) : null;
    o.terreno?.definirVisao(iso);
    document.body.dataset.visao = p.visao;
  };
  aplicar();
  let destruida = false;
  void o.pedraParede?.then((img) => {
    if (!img || destruida) return;
    pedra = Texture.from(img);
    pedra.source.addressMode = 'repeat';
    if (camera.projecaoAtual.visao !== 'iso') return;
    paredes?.destruir();
    paredes = criarParedes(camera.projecaoAtual);
  });

  const biblioteca = await carregarBiblioteca();
  let token: (TokenProprio & { source: TextureSource }) | null = null;
  const carregarToken = async () => {
    const arquivo = await lerImagemToken();
    const r = arquivo ? await prepararToken(arquivo) : null;
    const anterior = token;
    token = r?.ok ? fontesDoToken(r.imagem) : null;
    document.body.dataset.token = token ? 'imagem' : 'modelo';
    o.aoTrocar();
    if (anterior) {
      destruirFonte(anterior.emPe);
      destruirFonte(anterior.cima);
      anterior.source.destroy();
    }
  };
  await carregarToken();
  const desligarToken = aoMudarImagemToken(() => {
    void carregarToken();
  });

  return {
    projecao: () => camera.projecaoAtual,
    isometrico: () => camera.projecaoAtual.visao === 'iso',
    biblioteca: () => biblioteca,
    tokenProprio: () => token,
    definir: (v) => {
      if (v === camera.projecaoAtual.visao) return;
      camera.definirProjecao(criarProjecao(v, fase.largura, fase.altura));
      aplicar();
      o.aoTrocar();
    },
    esmaecer: (jogador, dtMs) => paredes?.esmaecer(jogador, dtMs),
    destruir: () => {
      destruida = true;
      desligarToken();
      paredes?.destruir();
      enfeites?.destruir();
      estruturas?.destruir();
      pedra?.destroy(true);
    },
  };
}
