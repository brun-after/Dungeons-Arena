// Equipamento no token (ajuste de 16/10/2026, D-067). A `aparencia` pública da entidade (a base das armas e a
// raridade de elmo, armadura e capa) vira duas texturas do tamanho do quadro do modelo, uma atrás e outra na
// frente, geradas do SVG de modelos/adornos.ts uma vez por combinação. O rig as põe no corpo, então acompanham a
// pose, o passo e o giro. Enquanto a imagem decodifica, o token aparece sem os adornos.

import { Texture } from 'pixi.js';
import type { AparenciaEquipada } from '../entities/entidade';
import { adornosDoBipede } from './modelos/adornos';
import { LADO_PX } from './modelos/atlas';
import { ARMA_DE_CLASSE, OPCOES_JOGAVEIS } from './modelos';
import { LADO_QUADRO, type Vista } from './modelos/svg';
import { COR_RARIDADE } from './objetos';
import type { Raridade } from '../modos/modo';

export interface TexturasAdorno {
  atras: Texture | null;
  frente: Texture | null;
}

/** Combinações guardadas (modelo, vista e equipamento); passando disso, sai a mais antiga. */
const MAXIMO = 96;
const cache = new Map<string, TexturasAdorno | 'carregando'>();
const VAZIO: TexturasAdorno = { atras: null, frente: null };

const corDe = (r: string | null) => (r && Object.hasOwn(COR_RARIDADE, r) ? COR_RARIDADE[r as Raridade] : null);

function textura(conteudo: string): Promise<Texture | null> {
  if (!conteudo) return Promise.resolve(null);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${LADO_PX}" height="${LADO_PX}" viewBox="0 0 ${LADO_QUADRO} ${LADO_QUADRO}">${conteudo}</svg>`;
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  return img.decode().then(
    () => Texture.from(img),
    () => null,
  );
}

/** As texturas do equipamento para o modelo e a vista (null: o modelo não é de classe ou nada a mostrar ainda). */
export function texturasDoAdorno(modelo: string, vista: Vista, aparencia: AparenciaEquipada | null): TexturasAdorno | null {
  if (!Object.hasOwn(OPCOES_JOGAVEIS, modelo)) return null;
  const classe = modelo as keyof typeof OPCOES_JOGAVEIS;
  const vazio = { arma: null, secundaria: null, cabeca: null, corpo: null, capa: null };
  const eq = aparencia ?? vazio;
  // Mãos vazias: a arma da classe (e o escudo dela, se a mão secundária também estiver livre).
  const padrao = ARMA_DE_CLASSE[classe];
  const ap = eq.arma ? eq : { ...eq, arma: padrao.arma, secundaria: eq.secundaria ?? padrao.secundaria };
  const chave = `${modelo}|${vista}|${ap.arma}|${ap.secundaria}|${ap.cabeca}|${ap.corpo}|${ap.capa}`;
  const pronto = cache.get(chave);
  if (pronto === 'carregando') return VAZIO;
  if (pronto) return pronto;
  if (cache.size >= MAXIMO) {
    const velho = cache.keys().next().value;
    if (velho !== undefined) cache.delete(velho);
  }
  cache.set(chave, 'carregando');
  const opcoes = OPCOES_JOGAVEIS[classe];
  const camadas = adornosDoBipede(opcoes, vista, {
    arma: ap.arma,
    secundaria: ap.secundaria,
    cabeca: corDe(ap.cabeca),
    corpo: corDe(ap.corpo),
    capa: corDe(ap.capa),
  });
  void Promise.all([textura(camadas.atras), textura(camadas.frente)]).then(([atras, frente]) => {
    cache.set(chave, { atras, frente });
  });
  return VAZIO;
}
