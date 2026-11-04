// As peças de armadura em 3D (marco 32, 31/10/2026, D-131): o capuz, o elmo, o peitoral, as ombreiras e a capa,
// feitos de geometria simples e presos nos ossos do traje (seguem a animação). Cada grau de raridade troca a peça
// por uma mais imponente, com a cor da raridade nos detalhes: o capuz tingido (comum), o capuz com tiara (incomum), o
// elmo de aço (raro), com crista (épico), com chifres, ouro e gema (lendário) e o elmo negro de espinhos acesos
// (última); o mesmo para o peito e a capa. Medidas em células, no corpo já na escala do jogo e na pose de repouso.

import * as THREE from 'three';

const OURO = 0xd4ac0d;

interface Ossos {
  get(nome: string): THREE.Bone | undefined;
}

const pos = (o: THREE.Object3D) => o.getWorldPosition(new THREE.Vector3());

function mat(cor: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: cor, roughness: 0.5, ...o });
}

/** O metal pelo grau: aço, aço polido (épico), aço claro com ouro (lendário) e aço negro (última). */
function metal(n: number): THREE.Material {
  if (n >= 5) return mat(0x2e2a36, { metalness: 0.5, roughness: 0.3 });
  if (n >= 4) return mat(0xe0e6ec, { metalness: 0.45, roughness: 0.25 });
  return mat(n >= 3 ? 0xc8d0d8 : 0x9aa4b0, { metalness: 0.4, roughness: 0.35 });
}
const enfeite = (n: number) => mat(n >= 4 ? OURO : 0xc8d0d8, { metalness: 0.5, roughness: 0.3 });
const aceso = (cor: number, forca = 1) => mat(cor, { emissive: cor, emissiveIntensity: forca, roughness: 0.2 });

/** Prende no osso o que foi montado no espaço do mundo (a pose de repouso). */
function prender(osso: THREE.Bone | undefined, o: THREE.Object3D): THREE.Object3D | null {
  if (!osso) return null;
  o.updateMatrixWorld(true);
  osso.attach(o);
  return o;
}

function cone(r: number, a: number, m: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.ConeGeometry(r, a, 6), m);
}

export function protegerMembros(ossos: Ossos, peca: 'maos' | 'pernas' | 'pes', grau: number): THREE.Object3D[] {
  const saida: THREE.Object3D[] = [];
  const material = grau === 0 ? mat(0x684731, { roughness: 0.94 })
    : grau === 2 ? mat(0x555b61, { metalness: 0.3, roughness: 0.68 })
    : mat(0x34313c, { metalness: 0.38, roughness: 0.62 });
  const borda = grau === 4 ? mat(0xa78a51, { roughness: 0.67 }) : material;
  for (const lado of ['l', 'r']) {
    const coxa = ossos.get(`thigh_${lado}`);
    const canela = ossos.get(`calf_${lado}`);
    const pe = ossos.get(`foot_${lado}`);
    const braco = ossos.get(`lowerarm_${lado}`);
    const mao = ossos.get(`hand_${lado}`);
    if (!coxa || !canela || !pe || !braco || !mao) continue;
    const osso = peca === 'maos' ? braco : peca === 'pernas' ? coxa : canela;
    const ponta = peca === 'maos' ? mao : peca === 'pernas' ? canela : pe;
    const de = pos(osso);
    const vetor = pos(ponta).sub(de);
    const tamanho = vetor.length();
    const largura = tamanho * (peca === 'maos' ? 0.29 : peca === 'pernas' ? 0.25 : 0.21);
    const grupo = new THREE.Group();
    grupo.position.copy(de).addScaledVector(vetor, peca === 'pernas' ? 0.52 : 0.72);
    grupo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vetor.normalize());
    const comprimento = tamanho * (peca === 'pernas' ? 0.66 : 0.5);
    const manga = new THREE.Mesh(new THREE.CylinderGeometry(largura * 0.88, largura, comprimento, grau === 0 ? 8 : 6), material);
    grupo.add(manga);
    if (grau >= 2) {
      const reforco = new THREE.Mesh(new THREE.CylinderGeometry(largura * 0.93, largura * 0.94, comprimento * 0.16, 6), borda);
      reforco.position.y = comprimento * 0.41;
      grupo.add(reforco);
    }
    const montado = prender(osso, grupo);
    if (montado) saida.push(montado);
  }
  return saida;
}

/** Peças de cabeça com silhueta própria, presas ao mesmo osso do traje. */
export function pecaDeCabeca(ossos: Ossos, classe: string, n: number, acento: number): THREE.Object3D[] {
  const cabeca = ossos.get('Head');
  const pescoco = ossos.get('neck_01');
  if (!cabeca || !pescoco) return [];
  const p = pos(cabeca);
  const altura = p.distanceTo(pos(pescoco));
  const r = altura * 1.85;
  const grupo = new THREE.Group();
  grupo.position.copy(p).add(new THREE.Vector3(0, altura * 0.86, 0));
  if (classe === 'arqueiro') {
    const tecido = mat(n >= 1 ? 0x5b6040 : 0x464d32, { roughness: 1, side: THREE.DoubleSide });
    const concha = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12, Math.PI * 0.73, Math.PI * 1.54, 0, Math.PI * 0.84), tecido);
    concha.scale.set(1.04, 1.2, 1.02);
    grupo.add(concha);
    const topo = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 8, 0, Math.PI * 2, 0, Math.PI * 0.36), tecido);
    topo.scale.copy(concha.scale);
    grupo.add(topo);
    const gola = new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, r * 0.2, 7, 18), tecido);
    gola.rotation.x = Math.PI / 2;
    gola.position.y = -r * 0.88;
    grupo.add(gola);
    if (n >= 1) {
      const fecho = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.14, 0), enfeite(n));
      fecho.position.set(r * 0.42, -r * 0.84, r * 0.75);
      grupo.add(fecho);
    }
  } else if (classe === 'aventureiro') {
    const ferro = mat(n >= 5 ? 0x38343c : 0x676767, { metalness: 0.44, roughness: 0.57 });
    const casca = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.53), ferro);
    casca.scale.set(0.9, 1.02, 0.94);
    casca.position.y = r * 0.16;
    grupo.add(casca);
    const aba = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.09, r * 0.15, 22), ferro);
    aba.position.y = r * 0.04;
    aba.scale.set(0.95, 1, 0.92);
    grupo.add(aba);
    const couro = mat(0x523727, { roughness: 0.96 });
    for (const lado of [-1, 1]) {
      const tira = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.73, r * 0.11), couro);
      tira.position.set(lado * r * 0.72, -r * 0.48, r * 0.39);
      tira.rotation.z = -lado * 0.26;
      grupo.add(tira);
    }
  } else if (classe === 'necromante') {
    const ferro = mat(0x342c3c, { metalness: 0.39, roughness: 0.59 });
    const osso = mat(n >= 4 ? 0xa39990 : 0x827780, { roughness: 0.8 });
    const concha = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.65), ferro);
    concha.scale.set(0.91, 1.04, 0.93);
    grupo.add(concha);
    for (const lado of [-1, 1]) {
      const chifre = cone(r * 0.16, r * 0.58, ferro);
      chifre.position.set(lado * r * 0.69, r * 0.71, r * 0.34);
      chifre.rotation.z = -lado * 0.45;
      grupo.add(chifre);
      const face = new THREE.Mesh(new THREE.BoxGeometry(r * 0.44, r * 0.16, r * 0.16), osso);
      face.position.set(lado * r * 0.28, r * 0.12, r * 0.97);
      face.rotation.z = lado * 0.32;
      grupo.add(face);
      for (const passo of [1, 2, 3]) {
        const dente = new THREE.Mesh(new THREE.BoxGeometry(r * 0.085, r * (0.27 - passo * 0.035), r * 0.15), osso);
        dente.position.set(lado * r * passo * 0.105, -r * 0.43, r * 0.96);
        grupo.add(dente);
      }
    }
  } else {
    grupo.scale.set(0.91, 0.94, 0.92);
    const liga = mat(n >= 5 ? 0x2d2939 : 0x444c65, { metalness: 0.42, roughness: 0.52, side: THREE.DoubleSide });
    const perfis = [new THREE.Vector2(r * 0.64, -r * 0.83), new THREE.Vector2(r * 0.89, -r * 0.25), new THREE.Vector2(r * 0.89, r * 0.53), new THREE.Vector2(r * 0.62, r * 0.84), new THREE.Vector2(0, r * 0.91)];
    grupo.add(new THREE.Mesh(new THREE.LatheGeometry(perfis, 7), liga));
    const fenda = new THREE.Mesh(new THREE.BoxGeometry(r * 1.15, r * 0.19, r * 0.19), mat(0x100e16));
    fenda.position.set(0, r * 0.07, r * 0.79);
    grupo.add(fenda);
    for (const lado of [-1, 1]) {
      const peca = cone(r * 0.19, r * 0.59, liga);
      peca.position.set(lado * r * 0.55, r * 0.78, r * 0.49);
      peca.rotation.z = -lado * 0.43;
      grupo.add(peca);
    }
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.21), aceso(n >= 4 ? acento : 0x765ea2, 0.5));
    gema.position.set(0, r * 0.5, r * 0.85);
    grupo.add(gema);
  }
  const peca = prender(cabeca, grupo);
  return peca ? [peca] : [];
}

/** Bacinete com viseira articulada e abertura horizontal para os olhos. */
export function bacinete(ossos: Ossos, n: number, acento: number): THREE.Object3D[] {
  const cabeca = ossos.get('Head');
  const pescoco = ossos.get('neck_01');
  if (!cabeca || !pescoco) return [];
  const p = pos(cabeca);
  const altura = p.distanceTo(pos(pescoco));
  const r = altura * 1.76;
  const grupo = new THREE.Group();
  grupo.position.copy(p).add(new THREE.Vector3(0, altura * 0.9, 0));
  const chapa = mat(n >= 5 ? 0x2b2731 : 0x51545c, { metalness: 0.42, roughness: 0.52 });
  const perfil = [[0.66, -0.77], [0.9, -0.48], [0.98, 0.16], [0.8, 0.68], [0.44, 0.99], [0, 1.15]]
    .map(([x = 0, y = 0]) => new THREE.Vector2(x * r, y * r));
  grupo.add(new THREE.Mesh(new THREE.LatheGeometry(perfil, 18), chapa));

  // Viseira em cunha. As duas placas deixam uma fenda real, com sombra atrás.
  const placa = (pontos: readonly (readonly [number, number, number])[], material: THREE.Material) => {
    const [a, b, c, d] = pontos;
    if (!a || !b || !c || !d) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d].map(v => v * r), 3));
    geo.computeVertexNormals();
    grupo.add(new THREE.Mesh(geo, material));
  };
  const sombra = mat(0x131018, { side: THREE.DoubleSide, roughness: 1 });
  const viseira = mat(n >= 5 ? 0x38323c : 0x686b72, { side: THREE.DoubleSide, metalness: 0.42, roughness: 0.48 });
  placa([[-0.71, 0.25, 0.91], [0.71, 0.25, 0.91], [0.67, -0.09, 0.92], [-0.67, -0.09, 0.92]], sombra);
  for (const s of [-1, 1]) {
    placa([[0, 0.17, 1.13], [s * 0.79, 0.24, 0.73], [s * 0.71, 0.49, 0.68], [0, 0.53, 0.99]], viseira);
    placa([[0, -0.065, 1.24], [s * 0.78, 0.018, 0.75], [s * 0.58, -0.59, 0.76], [0, -0.73, 1.01]], viseira);
    const pino = new THREE.Mesh(new THREE.SphereGeometry(r * 0.105, 8, 5), enfeite(n));
    pino.position.set(s * r * 0.83, 0.18 * r, 0.56 * r);
    grupo.add(pino);
  }
  if (n >= 4) {
    const crista = cone(r * 0.1, r * 0.56, n >= 5 ? aceso(acento, 0.45) : enfeite(n));
    crista.position.set(0, r * 0.97, r * 0.27);
    grupo.add(crista);
  }
  const o = prender(cabeca, grupo);
  return o ? [o] : [];
}

/** O elmo (raro em diante). A cabeça olha para +z. */
export function elmo(ossos: Ossos, n: number, acento: number): THREE.Object3D[] {
  const cabeca = ossos.get('Head');
  const pescoco = ossos.get('neck_01');
  if (!cabeca || !pescoco) return [];
  const p = pos(cabeca);
  const altura = p.distanceTo(pos(pescoco));
  const r = altura * 1.95;
  const c = p.clone().add(new THREE.Vector3(0, altura * 0.95, 0.0));
  const g = new THREE.Group();
  g.position.copy(c);
  const m = metal(n);
  const calota = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), m);
  g.add(calota);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, r * 0.09, 6, 20), n >= 4 ? enfeite(n) : m);
  aro.rotation.x = Math.PI / 2;
  aro.position.y = r * 0.2;
  g.add(aro);
  const nasal = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 0.7, r * 0.12), m);
  nasal.position.set(0, -r * 0.1, r * 0.95);
  g.add(nasal);
  // Sobrancelha reforçada e rebites dão leitura à face metálica mesmo no quadro pequeno.
  for (const lado of [-1, 1]) {
    const borda = new THREE.Mesh(new THREE.BoxGeometry(r * 0.57, r * 0.11, r * 0.12), enfeite(n));
    borda.position.set(lado * r * 0.31, r * 0.19, r * 0.9);
    borda.rotation.z = lado * 0.19;
    g.add(borda);
    const rebite = new THREE.Mesh(new THREE.SphereGeometry(r * 0.066, 8, 5), enfeite(n));
    rebite.position.set(lado * r * 0.63, r * 0.11, r * 0.78);
    g.add(rebite);
  }

  if (n >= 3) {
    const crista = new THREE.Mesh(new THREE.BoxGeometry(r * 0.14, r * 0.45, r * 1.7), n >= 4 ? enfeite(n) : aceso(acento, 0.4));
    crista.position.y = r * 0.95;
    g.add(crista);
    for (const s of [-1, 1]) {
      const face = new THREE.Mesh(new THREE.BoxGeometry(r * 0.12, r * 0.75, r * 0.6), m);
      face.position.set(s * r * 0.88, -r * 0.2, r * 0.35);
      g.add(face);
    }
  }
  if (n >= 4) {
    for (const s of [-1, 1]) {
      const chifre = cone(r * 0.22, r * (n >= 5 ? 1.5 : 1.1), n >= 5 ? mat(0x1a1620) : mat(0xe8e2cf, { roughness: 0.7 }));
      chifre.position.set(s * r * 0.95, r * 0.6, 0);
      chifre.rotation.z = -s * 0.9;
      g.add(chifre);
    }
    const gema = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.2), aceso(acento, 1.1));
    gema.position.set(0, r * 0.35, r * 1.0);
    g.add(gema);
  }
  if (n >= 5) {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.75 + (i / 6) * Math.PI * 1.5;
      const ponta = cone(r * 0.1, r * 0.55, aceso(acento, 1.3));
      ponta.position.set(Math.sin(a) * r * 0.8, r * 0.75, Math.cos(a) * r * 0.8);
      ponta.rotation.set(Math.cos(a) * 0.4, 0, -Math.sin(a) * 0.4);
      g.add(ponta);
    }
    const fenda = new THREE.Mesh(new THREE.BoxGeometry(r * 1.1, r * 0.08, r * 0.1), aceso(acento, 1.6));
    fenda.position.set(0, r * 0.02, r * 0.97);
    g.add(fenda);
  }
  const o = prender(cabeca, g);
  return o ? [o] : [];
}

/** A tiara do incomum: um aro fino de metal com a pedrinha da raridade, sobre o capuz. */
export function tiara(ossos: Ossos, acento: number): THREE.Object3D[] {
  const cabeca = ossos.get('Head');
  const pescoco = ossos.get('neck_01');
  if (!cabeca || !pescoco) return [];
  const p = pos(cabeca);
  const altura = p.distanceTo(pos(pescoco));
  const r = altura * 1.62;
  const g = new THREE.Group();
  g.position.copy(p.clone().add(new THREE.Vector3(0, altura * 1.05, 0.01)));
  const aro = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.07, 6, 20), enfeite(2));
  aro.rotation.x = Math.PI / 2 - 0.15;
  g.add(aro);
  const pedra = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.16), aceso(acento, 0.8));
  pedra.position.set(0, r * 0.1, r);
  g.add(pedra);
  const o = prender(cabeca, g);
  return o ? [o] : [];
}

/** O peitoral (raro em diante) e as ombreiras (incomum em diante). */
export function peito(ossos: Ossos, n: number, acento: number): THREE.Object3D[] {
  const tronco = ossos.get('spine_03');
  const ce = ossos.get('upperarm_l');
  const cd = ossos.get('upperarm_r');
  const pescoco = ossos.get('neck_01');
  if (!tronco || !ce || !cd || !pescoco) return [];
  // A largura dos ombros (as juntas dos braços): o peitoral e as ombreiras ficam por fora do pano.
  const largura = pos(ce).distanceTo(pos(cd)) * 0.5;
  const saida: THREE.Object3D[] = [];
  const m = metal(n);
  if (n >= 2) {
    const r = largura * 1.08;
    const alto = (pos(pescoco).y - pos(tronco).y) * 1.2 + largura * 0.6;
    const g = new THREE.Group();
    const centro = pos(tronco);
    g.position.set(centro.x, pos(pescoco).y - alto / 2 - largura * 0.08, centro.z);
    const placa = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.88, alto, 16, 1, true, -Math.PI * 0.42, Math.PI * 0.84), m);
    placa.material = m;
    (placa.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
    g.add(placa);
    // Nervura central, lâminas sobrepostas e rebites, em relevo no mesmo rig.
    const nervura = new THREE.Mesh(new THREE.BoxGeometry(largura * 0.09, alto * 0.78, largura * 0.055), enfeite(n));
    nervura.position.set(0, alto * 0.045, r * 0.995);
    g.add(nervura);
    for (const y of [-0.22, -0.39]) {
      const faixa = new THREE.Mesh(new THREE.TorusGeometry(r * (0.95 + y * 0.09), largura * 0.027, 5, 18, Math.PI * 0.82), enfeite(n));
      faixa.rotation.set(Math.PI / 2, 0, -Math.PI * 0.09);
      faixa.position.y = y * alto;
      g.add(faixa);
    }

    if (n >= 3) {
      const faixa = new THREE.Mesh(new THREE.TorusGeometry(r * 0.9, largura * 0.035, 4, 16, Math.PI * 0.84), enfeite(n));
      faixa.rotation.set(Math.PI / 2, 0, Math.PI * 0.08);
      faixa.position.y = -alto * 0.48;
      g.add(faixa);
    }
    if (n >= 4) {
      const gema = new THREE.Mesh(new THREE.OctahedronGeometry(largura * 0.09), aceso(acento, 1.1));
      gema.position.set(0, alto * 0.1, r * 0.98);
      g.add(gema);
    }
    if (n >= 5) {
      for (let i = 0; i < 4; i++) {
        const runa = new THREE.Mesh(new THREE.BoxGeometry(largura * 0.05, alto * 0.22, largura * 0.02), aceso(acento, 1.4));
        const a = -0.6 + i * 0.4;
        runa.position.set(Math.sin(a) * r * 1.01, -alto * 0.15, Math.cos(a) * r * 1.01);
        runa.rotation.y = a;
        g.add(runa);
      }
    }
    const o = prender(tronco, g);
    if (o) saida.push(o);
  }
  if (n >= 1) {
    for (const lado of ['l', 'r'] as const) {
      const braco = ossos.get(`upperarm_${lado}`);
      if (!braco) continue;
      const s = lado === 'l' ? 1 : -1;
      const rr = largura * (0.3 + 0.035 * n);
      const g = new THREE.Group();
      g.position.copy(pos(braco).add(new THREE.Vector3(0, rr * 0.35, 0)));
      const concha = new THREE.Mesh(new THREE.SphereGeometry(rr, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), n >= 2 ? m : mat(0x6e4b2a, { roughness: 0.8 }));
      concha.rotation.z = s * 0.35;
      g.add(concha);
      if (n >= 3) {
        const borda = new THREE.Mesh(new THREE.TorusGeometry(rr * 0.98, rr * 0.1, 4, 14), enfeite(n));
        borda.rotation.x = Math.PI / 2;
        borda.rotation.y = s * 0.35;
        g.add(borda);
      }
      if (n >= 4) {
        for (let i = 0; i < (n >= 5 ? 3 : 2); i++) {
          const e = cone(rr * 0.18, rr * (n >= 5 ? 1.2 : 0.8), n >= 5 ? aceso(acento, 1.0) : enfeite(n));
          e.position.set(s * rr * 0.4, rr * 0.75, (i - (n >= 5 ? 1 : 0.5)) * rr * 0.5);
          e.rotation.z = -s * 0.5;
          g.add(e);
        }
      }
      const o = prender(braco, g);
      if (o) saida.push(o);
    }
  }
  return saida;
}

/** A capa: um pano curvo preso no alto das costas, mais longo, com a barra e o fecho conforme o grau. */
export function capa(ossos: Ossos, n: number, acento: number): THREE.Object3D[] {
  const pescoco = ossos.get('neck_01');
  const tronco = ossos.get('spine_03');
  if (!pescoco || !tronco) return [];
  const altura = 0.46 + 0.07 * n;
  const larg = 0.36 + 0.025 * n;
  const geo = new THREE.PlaneGeometry(larg, altura, 6, 12);
  const p = geo.attributes.position;
  if (!p) return [];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const t = (altura / 2 - p.getY(i)) / altura;
    const u = x / (larg / 2);
    p.setX(i, x * (0.8 + 0.45 * t));
    p.setZ(i, -(1 - u * u) * 0.06 - t * (0.04 + 0.01 * n));
    // A última: a barra em pontas, rasgada.
    if (n >= 5 && t > 0.92) p.setY(i, p.getY(i) + (Math.abs(Math.sin(u * 9)) - 0.5) * 0.06);
  }
  geo.translate(0, -altura / 2, 0);
  geo.computeVertexNormals();
  const cor = n >= 5 ? 0x231a26 : new THREE.Color(0xd8d0c8).lerp(new THREE.Color(acento), 0.55).getHex();
  const pano = new THREE.Mesh(geo, mat(cor, { roughness: 0.9, side: THREE.DoubleSide }));
  const g = new THREE.Group();
  g.add(pano);
  if (n >= 2) {
    const barra = new THREE.Mesh(new THREE.BoxGeometry(larg * 1.25, 0.022, 0.012), n >= 4 ? aceso(acento, 0.9) : enfeite(n));
    barra.position.set(0, -altura + 0.015, -0.04 - 0.01 * n - 0.006);
    g.add(barra);
  }
  if (n >= 3) {
    for (const s of [-1, 1]) {
      const fecho = new THREE.Mesh(new THREE.IcosahedronGeometry(0.022, 0), n >= 4 ? aceso(acento, 1) : enfeite(n));
      fecho.position.set((s * larg) / 2.2, -0.01, 0.01);
      g.add(fecho);
    }
  }
  const topo = pos(pescoco);
  const costas = pos(tronco);
  g.position.set(topo.x, topo.y - 0.03, costas.z - 0.1);
  g.rotation.x = 0.16;
  const o = prender(tronco, g);
  return o ? [o] : [];
}

/** As asas da fada: dois pares de folhas translúcidas presas nas costas, abertas em V. */
export function asas(ossos: Ossos, cor: number): THREE.Object3D[] {
  const tronco = ossos.get('spine_03');
  if (!tronco) return [];
  const g = new THREE.Group();
  const m = mat(cor, { transparent: true, opacity: 0.7, emissive: cor, emissiveIntensity: 0.5, side: THREE.DoubleSide, roughness: 0.2 });
  for (const lado of [-1, 1]) {
    for (const [alto, giro, k] of [
      [0.08, 0.5, 1],
      [-0.06, 1.1, 0.7],
    ] as const) {
      const folha = new THREE.Mesh(new THREE.CircleGeometry(0.2 * k, 16), m);
      folha.scale.set(0.55, 1, 1);
      folha.position.set(lado * 0.14 * k, alto + 0.08 * k, 0);
      folha.rotation.set(0, lado * 0.5, -lado * giro);
      g.add(folha);
    }
  }
  const c = pos(tronco);
  g.position.set(c.x, c.y + 0.02, c.z - 0.09);
  const o = prender(tronco, g);
  return o ? [o] : [];
}
