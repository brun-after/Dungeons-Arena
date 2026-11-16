// Os chefes em tempo real (04/11/2026, marco 37): cada chefe usa o rig do monstro de origem (o GLB exportado da
// receita) com uma veste fixa no estilo sombrio e a arma dele, para que a luta contra o chefe tenha a mesma presença
// dos jogadores. Os monstros comuns continuam no atlas pré-renderizado; só o arquétipo boss usa a chave `chefe:<preset>`.
// - necromante_ancestral: o kit do necromante no grau 5 com a coroa de osso e a gadanha.
// Marco 45 (16/11/2026, D-182): os governantes das dimensões de Filo (filo/humanos-*.ts) e os chefes de geometria.

import * as THREE from 'three';
import { aceso, Corpo, liso, type Ossos, type PecaSombria } from './sombrio-base';
import { coroa } from './pecas-sombrias';
import { KITS_DAS_CLASSES } from './kits-classes';
import { PECAS_DE_ARMADURA } from '../equipamento-3d';
import { vesteDoServo } from './servo-vivo';
import { CLIPE_DO_JEITO, HUMANOS_FILO, type Traje } from './filo';

export interface Chefe {
  /** O GLB do rig (src/assets/modelos/<glb>.glb) e a altura em células (antes do aumento de chefe do jogo). */
  glb: string;
  altura: number;
  largura?: number;
  /** O clipe parado e o do golpe (o resto é o do humano). */
  parado: string;
  golpe: string;
  arma: { modelo: string; grau: number } | null;
  veste: (ossos: Ossos) => PecaSombria;
  /** A cor nova dos materiais do rig cujo nome contém a chave (a pele carbonizada, o pano do lodo). */
  tingir?: Readonly<Record<string, number>>;
}

/** Junta várias peças numa só (as extras somadas; o primeiro tecido e os escondidos de todas). */
function juntar(pecas: PecaSombria[]): PecaSombria {
  const esconder = pecas.map((p) => p.esconder).filter(Boolean).join('|');
  return { extras: pecas.flatMap((p) => p.extras), tecido: pecas.find((p) => p.tecido)?.tecido, esconder: esconder || undefined };
}

function necromanteAncestral(ossos: Ossos): PecaSombria {
  const kit = KITS_DAS_CLASSES.necromante;
  if (!kit) return { extras: [] };
  const pecas = PECAS_DE_ARMADURA.map((p) => kit(ossos, p, 5));
  const c = new Corpo(ossos);
  const extras: THREE.Object3D[] = [];
  coroa(c, liso(0xcfc6b0, 0.7), 9, 0.07, extras, 0.2, 0.128, aceso(0x9fd8ff, 2.4));
  return juntar([...pecas, { extras }]);
}

/** Marco 45 (16/11/2026, D-182): o rig de cada traje (os GLB exportados das classes, src/assets/modelos). */
const RIG: Readonly<Record<Traje, string>> = { ranger_m: 'necromante', ranger_f: 'arqueiro', campones_m: 'mago', campones_f: 'arqueiro', nu_m: 'demonio' };

/** Um chefe de Filo humanoide pelo modelo (filo/humanos.ts): o rig do traje, a veste, as cores e o jeito de golpear. */
function deFilo(modelo: string): Chefe {
  const h = HUMANOS_FILO[modelo];
  if (!h) throw new Error(`chefe sem modelo: ${modelo}`);
  const j = CLIPE_DO_JEITO[h.jeito];
  return {
    glb: RIG[h.traje], altura: h.altura, ...(h.largura ? { largura: h.largura } : {}), parado: j.parado, golpe: j.golpe, arma: null, veste: h.veste,
    tingir: { Ranger: h.roupa, Peasant: h.roupa, Superhero: h.pele, Regular: h.pele },
  };
}

/** Os chefes humanoides com modelo em tempo real, pelo preset (inimigos.json). Marco 45 (D-182): os governantes das
 * dimensões de Filo vestem as peças próprias (filo/humanos-*.ts); a arma vai na veste. */
export const CHEFES: Readonly<Record<string, Chefe>> = {
  // 08/11/2026 (D-137): o Servo do ossuário (a passiva do Necromante), o vulto encapuzado; sem arma, golpeia com as mãos.
  servo_ossuario: { glb: 'necromante', altura: 1.05, parado: 'Idle_Loop', golpe: 'Punch_Cross', arma: null, veste: vesteDoServo },
  necromante_ancestral: { glb: 'necromante', altura: 1.2, parado: 'Idle_Loop', golpe: 'Spell_Simple_Shoot', arma: { modelo: 'gadanha', grau: 5 }, veste: necromanteAncestral },
  rei_goblin: deFilo('rei_das_fagulhas'),
  bruxa_do_pantano: deFilo('bruxa_dos_sonhos'),
  boss: deFilo('arauto_caido'),
  imperatriz_das_estatuas: deFilo('imperatriz_das_estatuas'),
  maquinista_voltaico: deFilo('maquinista_voltaico'),
  o_apagador: deFilo('o_apagador'),
  rei_das_mascaras: deFilo('rei_das_mascaras'),
  monarca_de_geodo: deFilo('monarca_de_geodo'),
  hierofante: deFilo('hierofante'),
  almirante_dos_ventos: deFilo('almirante_dos_ventos'),
  harpia_soberana: deFilo('harpia_soberana'),
};

/** Marco 45 (D-182): os chefes de geometria (os dragões e a Mãe-Colmeia), pelo preset: o modelo em filo/index.ts. */
export const CHEFES_DE_GEOMETRIA: Readonly<Record<string, string>> = {
  dragao_fogo: 'dragao_da_fornalha', dragao_gelo: 'dragao_do_silencio', dragao_raio: 'dragao_engrenado',
  dragao_veneno: 'dragao_fermentado', dragao_das_ruinas: 'dragao_das_ruinas', mae_colmeia: 'mae_colmeia',
};

/** As vestes pelo modelo, para o atlas (tools/sprites/pagina.ts): as de Filo e a do Necromante Ancestral. */
export const VESTES_DO_ATLAS: Readonly<Record<string, (ossos: Ossos) => PecaSombria>> = {
  ...Object.fromEntries(Object.entries(HUMANOS_FILO).map(([k, h]) => [k, h.veste])),
  necromante_ancestral: necromanteAncestral,
};
