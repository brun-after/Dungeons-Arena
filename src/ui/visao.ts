// Visão da cena (§2.16, §4.5). Marco 13 (14/10/2026), D-058: de cima ou isométrica, trocada na hora (tecla V
// ou Configurações), sem recarregar; os modelos de criatura do atlas e a imagem do personagem.
// A simulação nunca sabe a visão: só a câmera, as camadas e a entrada mudam.

import type { TextureSource } from 'pixi.js';
import type { VisaoJogo } from '../plataforma/preferencias';
import { aoMudarImagemToken, lerImagemToken } from '../plataforma/token';
import type { Camera } from '../render/camera';
import { criarDecoracaoIso, type DecoracaoIso } from '../render/decoracao-iso';
import { criarParedesIso, type ParedesIso } from '../render/paredes-iso';
import { criarProjecao, type Projecao } from '../render/projecao';
import type { Palco } from '../render/stage';
import { carregarBiblioteca, destruirFonte, fontesDoToken, type BibliotecaCriaturas, type FonteToken } from '../render/texturas-criaturas';
import { prepararToken } from '../render/token-imagem';
import type { Terreno } from '../render/terreno';
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
  destruir: () => void;
}

export async function montarVisao(o: OpcoesVisao): Promise<ControleVisao> {
  const { palco, camera, fase } = o;
  let paredes: ParedesIso | null = null;
  let enfeites: DecoracaoIso | null = null;
  const aplicar = () => {
    const p = camera.projecaoAtual;
    const iso = p.visao === 'iso';
    palco.definirMatrizPlano(p.matriz);
    paredes?.destruir();
    enfeites?.destruir();
    paredes = iso ? criarParedesIso(palco.entidades, fase, p, o.corParede ?? null) : null;
    enfeites = iso ? criarDecoracaoIso(palco.entidades, fase, o.tema ?? null, p, o.quebraveis) : null;
    o.terreno?.definirVisao(iso);
    document.body.dataset.visao = p.visao;
  };
  aplicar();

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
    destruir: () => {
      desligarToken();
      paredes?.destruir();
      enfeites?.destruir();
    },
  };
}
