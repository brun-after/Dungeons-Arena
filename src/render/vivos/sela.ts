// 20/11/2026 (D-188, adendo): o Aventureiro montado no lobo e no urso. A biblioteca de animações não tem clipe de
// montaria; o `Driving_Loop` (sentado dirigindo) deixava as pernas juntas à frente, e o cavaleiro parecia sentado no ar
// por cima do bicho, com as duas pernas à vista de qualquer ângulo. Por cima do clipe, no espaço do mundo:
// - as coxas abrem para os lados e descem, abraçando o flanco (a sela), e as canelas pendem quase retas;
// - visto de lado, a perna do lado de lá fica escondida atrás do bicho (o osso da coxa encolhe a zero, e a canela e o
//   pé vão junto); de frente ou de costas, as duas aparecem, uma de cada lado do peito ou da garupa.
// Fora da montaria, as pernas voltam ao tamanho de sempre. Só desenho.

import * as THREE from 'three';

const LADOS = [['l', 1], ['r', -1]] as const;
/** De quanto de lado a câmera vê o corpo para a perna de lá sumir (o produto do eixo lateral com a vista). */
const DE_LADO = 0.3;
/** A coxa: para baixo, para fora (o flanco) e um pouco à frente; a canela, quase reta para baixo, um pouco atrás. */
const COXA = { baixo: 0.3, fora: 0.6, frente: 0.65 };
const CANELA = { baixo: 0.9, fora: 0.25, frente: -0.15 };

const v = () => new THREE.Vector3();
const q = new THREE.Quaternion();
const qMundo = new THREE.Quaternion();
const qPai = new THREE.Quaternion();

/** Gira o osso para que a direção dele (até `filho`) aponte para `alvo`, no espaço do mundo. */
function apontar(osso: THREE.Object3D, filho: THREE.Object3D, alvo: THREE.Vector3): void {
  const de = osso.getWorldPosition(v());
  const atual = filho.getWorldPosition(v()).sub(de).normalize();
  if (atual.lengthSq() < 1e-8) return;
  q.setFromUnitVectors(atual, alvo);
  osso.getWorldQuaternion(qMundo);
  qMundo.premultiply(q);
  (osso.parent ?? osso).getWorldQuaternion(qPai);
  osso.quaternion.copy(qPai.invert().multiply(qMundo));
  osso.updateMatrixWorld(true);
}

/** Posa as pernas na sela (ou as devolve ao normal, `montado` falso). `raiz`, o modelo já virado para onde vai. */
export function posarNaSela(raiz: THREE.Object3D, montado: boolean, camera: THREE.Camera): void {
  const coxas = LADOS.map(([l]) => raiz.getObjectByName(`thigh_${l}`));
  if (!montado) {
    for (const c of coxas) if (c && c.scale.x !== 1) c.scale.setScalar(1);
    return;
  }
  raiz.updateMatrixWorld(true);
  const cima = new THREE.Vector3(0, 1, 0);
  const frente = new THREE.Vector3(0, 0, 1).applyQuaternion(raiz.getWorldQuaternion(new THREE.Quaternion())).setY(0).normalize();
  const lado = v().crossVectors(cima, frente).normalize();
  const vista = camera.getWorldDirection(v());
  // O lado que fica longe da câmera: o eixo lateral do corpo contra a direção da vista.
  const deLado = lado.dot(vista);
  LADOS.forEach(([l, sinal], i) => {
    const coxa = coxas[i];
    const canela = raiz.getObjectByName(`calf_${l}`);
    const pe = raiz.getObjectByName(`foot_${l}`);
    if (!coxa || !canela || !pe) return;
    coxa.scale.setScalar(1);
    // O lado de cada perna pela posição dela (sem confiar no nome do osso).
    const daqui = Math.sign(coxa.getWorldPosition(v()).sub(raiz.getWorldPosition(v())).dot(lado)) || sinal;
    const fora = lado.clone().multiplyScalar(daqui);
    apontar(coxa, canela, v().addScaledVector(cima, -COXA.baixo).addScaledVector(fora, COXA.fora).addScaledVector(frente, COXA.frente).normalize());
    apontar(canela, pe, v().addScaledVector(cima, -CANELA.baixo).addScaledVector(fora, CANELA.fora).addScaledVector(frente, CANELA.frente).normalize());
    // A perna está longe quando a vista vai na mesma direção do lado dela.
    const longe = daqui * deLado > DE_LADO;
    if (longe) coxa.scale.setScalar(0.001);
  });
  raiz.updateMatrixWorld(true);
}
