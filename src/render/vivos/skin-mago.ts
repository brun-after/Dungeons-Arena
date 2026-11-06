// A skin Sombra Rubra do mago (06/11/2026): o mago da arte de referência em 3D, no lugar de qualquer equipamento. Um
// vulto sem capuz, de rosto em sombra sob o cabelo, o cabelo comprido ao vento com as pontas rubras, o manto negro e rasgado
// com a barra do roxo ao vermelho-sangue, a faixa vermelha na diagonal do peito, e o corpo todo em armadura escura
// com runas vermelhas que brilham (braçadeiras, cinto, coxas, grevas). A arma é o cajado retorcido de skin-cajado.ts.
// O pano (manto, forro, xale, cabelo, abas do cinto) voa para trás do rumo pelo vento de skin-pano.ts. Como o corpo
// do rig fica escondido, as pernas e os braços também são feitos aqui.

import * as THREE from 'three';
import type { Ossos, PecaSombria } from './sombrio-base';
import { aoLongo, Corpo, esfera, grupoEm, sorteio, V } from './sombrio-base';
import { dentes, eixosDoCorpo, mao, mix, perfilDe, pesosDoManto, suave, type Eixos } from './skin-ceifador';
import { fita, rasgos, superficie, ventoso, type Anel } from './skin-pano';

type Obj = THREE.Object3D;
const DUPLO = THREE.DoubleSide;

// ---------- texturas ----------
function tela(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  if (!g) throw new Error('sem canvas 2d');
  return [c, g];
}
const comoTextura = (c: HTMLCanvasElement, cor = true): THREE.CanvasTexture => {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (cor) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/** As runas angulares em vermelho sobre a armadura escura: a cor (`map`) e o brilho (`emissiveMap`, só as linhas). */
function runas(base: string, linha: string, semente: number, glifos = 4): { map: THREE.CanvasTexture; brilho: THREE.CanvasTexture } {
  const r = sorteio(semente);
  const [cb, gb] = tela();
  const [ce, ge] = tela();
  gb.fillStyle = base;
  gb.fillRect(0, 0, 512, 512);
  ge.fillStyle = '#000';
  ge.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = r() * 512, y = r() * 512, raio = 10 + r() * 50;
    const grd = gb.createRadialGradient(x, y, 0, x, y, raio);
    grd.addColorStop(0, r() < 0.65 ? 'rgba(0,0,0,0.3)' : 'rgba(120,110,150,0.06)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    gb.fillStyle = grd;
    gb.fillRect(x - raio, y - raio, raio * 2, raio * 2);
  }
  const passo = 512 / glifos;
  for (const [g, cor, grosso] of [[gb, linha + '88', 3.5], [ge, linha, 3.5]] as const) {
    g.strokeStyle = cor;
    g.lineWidth = grosso;
    g.lineCap = 'square';
    const rr = sorteio(semente + 1);
    for (let gx = 0; gx < glifos; gx++)
      for (let gy = 0; gy < glifos; gy++) {
        const x = (gx + 0.5) * passo, y = (gy + 0.5) * passo, s = passo * 0.3;
        g.beginPath();
        g.moveTo(x, y - s);
        g.lineTo(x, y + s);
        const ramos = 1 + Math.floor(rr() * 3);
        for (let k = 0; k < ramos; k++) {
          const yy = y - s + (k + 0.8) * s * 0.55;
          g.moveTo(x, yy); g.lineTo(x - s * 0.6, yy - s * 0.45);
          g.moveTo(x, yy); g.lineTo(x + s * 0.6, yy - s * 0.45);
        }
        if (rr() < 0.5) { g.moveTo(x, y - s * 0.35); g.lineTo(x + s * 0.4, y); g.lineTo(x, y + s * 0.35); g.lineTo(x - s * 0.4, y); g.closePath(); }
        g.stroke();
      }
    g.strokeRect(10, 10, 492, 492);
    g.strokeRect(22, 22, 468, 468);
  }
  return { map: comoTextura(cb), brilho: comoTextura(ce) };
}

/** O degradê do manto: negro-azulado no alto, roxo na altura da barra e o vermelho-sangue em manchas na ponta. */
function degrade(cima: string, meio: string, roxo: string, sangue: string, semente: number): THREE.CanvasTexture {
  const r = sorteio(semente);
  const [c, g] = tela();
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, cima);
  grd.addColorStop(0.55, meio);
  grd.addColorStop(0.82, roxo);
  grd.addColorStop(1, roxo);
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 3) { g.fillStyle = `rgba(0,0,0,${r() * 0.09})`; g.fillRect(x, 0, 1, 512); }
  for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.05})`; g.fillRect(0, y, 512, 1); }
  // o sangue: manchas grandes e irregulares no fim (mais densas para baixo) e respingos acima
  for (let i = 0; i < 70; i++) {
    const y = 512 - Math.pow(r(), 1.8) * 190;
    const x = r() * 512, rx = 10 + r() * 46, ry = 6 + r() * 22;
    g.fillStyle = r() < 0.75 ? sangue : '#7a1230';
    g.globalAlpha = 0.55 + r() * 0.45;
    g.beginPath(); g.ellipse(x, y, rx, ry, r() * 3, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 26; i++) { g.fillStyle = sangue; g.fillRect(r() * 512, 260 + r() * 160, 2 + r() * 4, 2 + r() * 4); }
  return comoTextura(c);
}

function gradeDoCabelo(): THREE.CanvasTexture {
  const [c, g] = tela();
  const grd = g.createLinearGradient(0, 0, 0, 512);
  grd.addColorStop(0, '#1f1722');
  grd.addColorStop(0.5, '#3c2034');
  grd.addColorStop(0.8, '#8a2038');
  grd.addColorStop(1, '#e02a46');
  g.fillStyle = grd;
  g.fillRect(0, 0, 512, 512);
  return comoTextura(c);
}

function materiais() {
  const r1 = runas('#17141c', '#c01830', 501, 4);
  const r2 = runas('#14121a', '#c01830', 521, 3);
  const r3 = runas('#110f16', '#b01428', 541, 2);
  const armadura = (t: ReturnType<typeof runas>, forca = 0.6, metal = 0.55) =>
    new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.brilho, emissive: 0xffffff, emissiveIntensity: forca, metalness: metal, roughness: 0.5, side: DUPLO });
  const pano = (t: THREE.Texture, rasgo?: number, semente = 1) =>
    new THREE.MeshStandardMaterial({ map: t, roughness: 0.88, side: DUPLO, ...(rasgo !== undefined ? { alphaMap: rasgos(semente, rasgo, 6), alphaTest: 0.5 } : {}) });
  return {
    capa: ventoso(pano(degrade('#13101b', '#1b1726', '#3a2658', '#b8102e', 601), 0.78, 611)),
    forro: ventoso(pano(degrade('#3a1030', '#5a1230', '#7a1432', '#b8102e', 621), 0.8, 631)),
    xale: ventoso(pano(degrade('#171321', '#201a2d', '#3a2658', '#c81c3a', 641), 0.86, 651)),
    cabelo: ventoso(new THREE.MeshStandardMaterial({ map: gradeDoCabelo(), roughness: 0.55, side: DUPLO })),
    abas: ventoso(pano(degrade('#14111a', '#1a1622', '#2c1c40', '#a01832', 661), 0.75, 671)),
    tunica: pano(degrade('#14111b', '#17131e', '#17131e', '#17131e', 681)),
    calca: pano(degrade('#100e16', '#13111a', '#13111a', '#13111a', 691)),
    placa: armadura(r1),
    placaCalca: armadura(r2, 0.75, 0.4),
    cinto: armadura(r3, 0.8, 0.6),
    faixa: new THREE.MeshStandardMaterial({ color: 0x8c1228, emissive: 0x9a1028, emissiveIntensity: 0.22, roughness: 0.7, side: DUPLO }),
    luva: new THREE.MeshStandardMaterial({ color: 0x1b1a22, roughness: 0.75 }),
    couro: new THREE.MeshStandardMaterial({ color: 0x15121a, roughness: 0.6, metalness: 0.2 }),
    vazio: new THREE.MeshBasicMaterial({ color: 0x020203 }),
    cabeloEscuro: ventoso(new THREE.MeshStandardMaterial({ color: 0x1b1420, roughness: 0.92, side: DUPLO })),
    brasa: new THREE.MeshStandardMaterial({ color: 0xff2a3c, emissive: 0xff2a3c, emissiveIntensity: 1.6, roughness: 0.3 }),
  };
}
type M = ReturnType<typeof materiais>;

// ---------- o corpo por baixo: tronco, pernas e braços ----------
interface Perfil { rx: (y: number) => number; rz: (y: number) => number }
function perfilDoTronco(c: Corpo, e: Eixos): Perfil {
  const u = c.u;
  const s3 = c.p('spine_03').y, s2 = c.p('spine_02').y;
  return {
    rx: perfilDe([[e.topo, 0.125 * u], [(e.topo + s3) / 2, 0.205 * u], [s3, 0.2 * u], [s2, 0.165 * u], [e.bacia, 0.185 * u], [e.bacia - 0.2 * u, 0.2 * u]]),
    rz: perfilDe([[e.topo, 0.11 * u], [(e.topo + s3) / 2, 0.135 * u], [s3, 0.14 * u], [s2, 0.12 * u], [e.bacia, 0.14 * u], [e.bacia - 0.2 * u, 0.15 * u]]),
  };
}

function tunica(c: Corpo, e: Eixos, p: Perfil, m: M, extras: Obj[]): void {
  const u = c.u;
  const fim = e.bacia - 0.1 * u;
  const N = 12;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const y = mix(e.topo, fim, i / (N - 1));
    aneis.push({ c: V(0, y, e.zDe(y)), rx: p.rx(y), rz: p.rz(y) });
  }
  extras.push(superficie({ aneis, colunas: 28, repete: [2, 1], pesos: pesosDoManto(c, e) }, m.tunica));
}

/** Um tubo de tecido ou placa por uma lista de pontos, com um osso por ponto de controle (mistura entre eles). */
function tubo(pontos: THREE.Vector3[], raios: number[], ossos: string[], m: THREE.Material, extras: Obj[], colunas = 20, repete: [number, number] = [1, 1]): void {
  const curva = new THREE.CatmullRomCurve3(pontos);
  const N = 12;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const f = (i / (N - 1)) * (raios.length - 1);
    const k = Math.min(raios.length - 2, Math.floor(f));
    const rr = mix(raios[k] as number, raios[k + 1] as number, f - k);
    aneis.push({ c: curva.getPointAt(i / (N - 1)), rx: rr, rz: rr * 0.95 });
  }
  extras.push(superficie({
    aneis, colunas, repete,
    pesos: (i) => {
      const f = (i / (N - 1)) * (ossos.length - 1);
      const k = Math.min(ossos.length - 2, Math.floor(f));
      return [ossos[k] as string, ossos[k + 1] as string, 1 - suave(0.25, 0.75, f - k)];
    },
  }, m));
}

function pernas(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  for (const lado of ['l', 'r'] as const) {
    const coxa = c.p(`thigh_${lado}`), joelho = c.p(`calf_${lado}`), tornozelo = c.p(`foot_${lado}`), bola = c.p(`ball_${lado}`);
    const meio1 = coxa.clone().lerp(joelho, 0.5), meio2 = joelho.clone().lerp(tornozelo, 0.5);
    tubo([coxa.clone().add(V(0, 0.04 * u, 0)), meio1, joelho, meio2, tornozelo], [0.105 * u, 0.095 * u, 0.082 * u, 0.07 * u, 0.062 * u],
      [`thigh_${lado}`, `thigh_${lado}`, `calf_${lado}`, `calf_${lado}`, `foot_${lado}`], m.calca, extras);
    // a coxote com a runa e a joelheira
    tubo([coxa.clone().lerp(joelho, 0.12), meio1, coxa.clone().lerp(joelho, 0.88)], [0.1 * u, 0.098 * u, 0.088 * u], [`thigh_${lado}`, `thigh_${lado}`, `thigh_${lado}`], m.placaCalca, extras, 20, [1, 1]);
    const joelheira = new THREE.Mesh(esfera(0.05, 14, 10), m.cinto);
    joelheira.scale.set(1.05, 1.0, 0.5);
    joelheira.position.copy(joelho).add(V(0, 0.01 * u, 0.065 * u));
    c.prender(`thigh_${lado}`, joelheira, extras);
    // a greva: placa do joelho ao tornozelo com as runas, e o cano da bota
    tubo([joelho.clone().lerp(tornozelo, 0.1), meio2, tornozelo.clone().lerp(joelho, 0.08)], [0.088 * u, 0.082 * u, 0.072 * u], [`calf_${lado}`, `calf_${lado}`, `calf_${lado}`], m.placa, extras);
    // o pé: o bloco da bota de placas, com a ponta e a sola
    const ponta = bola.clone().add(bola.clone().sub(tornozelo).multiplyScalar(0.5));
    const bota = new THREE.Mesh(new THREE.BoxGeometry(0.092 * u, 1, 0.075 * u), m.placa);
    bota.scale.y = tornozelo.distanceTo(ponta);
    aoLongo(bota, tornozelo, ponta, 0.5, V(0, 1, 0));
    c.prender(`foot_${lado}`, bota, extras);
    const bico = new THREE.Mesh(esfera(0.045, 10, 8), m.placa);
    bico.scale.set(1.0, 0.8, 1.2);
    bico.position.copy(ponta);
    c.prender(`foot_${lado}`, bico, extras);
  }
}

function bracos(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  for (const lado of ['l', 'r'] as const) {
    const ombro = c.p(`upperarm_${lado}`), cot = c.p(`lowerarm_${lado}`), pulso = c.p(`hand_${lado}`);
    const o1 = ombro.clone().lerp(cot, 0.5), o2 = cot.clone().lerp(pulso, 0.5);
    tubo([ombro.clone().add(V(0, 0.03 * u, 0)), o1, cot, o2, pulso], [0.075 * u, 0.07 * u, 0.066 * u, 0.06 * u, 0.052 * u],
      [`upperarm_${lado}`, `upperarm_${lado}`, `lowerarm_${lado}`, `lowerarm_${lado}`, `hand_${lado}`], m.tunica, extras);
    // a braçadeira com a runa
    tubo([cot.clone().lerp(pulso, 0.18), o2, cot.clone().lerp(pulso, 0.96)], [0.07 * u, 0.066 * u, 0.058 * u], [`lowerarm_${lado}`, `lowerarm_${lado}`, `lowerarm_${lado}`], m.placa, extras, 20, [1, 1]);
    mao(c, lado, { osso: m.luva }, extras, 1.5);
  }
}

// ---------- cinto, faixa, xale, capuz, cabelo ----------
function cinto(c: Corpo, e: Eixos, p: Perfil, m: M, extras: Obj[]): void {
  const u = c.u;
  const y = e.bacia + 0.025 * u;
  const tira = new THREE.Mesh(new THREE.TorusGeometry(1, 0.017 * u, 6, 36), m.couro);
  tira.rotation.x = Math.PI / 2;
  tira.scale.set(p.rx(y) + 0.012 * u, p.rz(y) + 0.012 * u, 1);
  tira.position.set(0, y, e.zDe(y));
  c.prender('pelvis', tira, extras);
  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.12 * u, 0.15 * u, 0.02 * u), m.cinto);
  placa.position.set(0, y - 0.05 * u, e.zDe(y) + p.rz(y) + 0.02 * u);
  c.prender('pelvis', placa, extras);
  // as abas de pano do cinto, curtas e soltas
  for (const sx of [-1, 1]) {
    const x = sx * 0.07 * u;
    const z = e.zDe(y) + p.rz(y) * 0.95;
    const pontos = Array.from({ length: 6 }, (_, i) => V(x + sx * i * 0.006 * u, y - 0.03 * u - i * 0.05 * u, z + i * 0.012 * u));
    extras.push(fita(pontos, pontos.map((_, i) => (0.085 - i * 0.008) * u), 'pelvis', m.abas, 0.7));
  }
}

function faixa(c: Corpo, e: Eixos, p: Perfil, m: M, extras: Obj[]): void {
  const u = c.u;
  const de = V(-0.15 * u, c.p('spine_03').y + 0.035 * u, 0), ate = V(0.17 * u, e.bacia - 0.02 * u, 0);
  const pontos: THREE.Vector3[] = [];
  const N = 9;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = mix(de.x, ate.x, t), y = mix(de.y, ate.y, t);
    const razao = Math.min(0.97, Math.abs(x) / p.rx(y));
    pontos.push(V(x, y, e.zDe(y) + p.rz(y) * Math.sqrt(1 - razao * razao) + 0.016 * u));
  }
  extras.push(fita(pontos, pontos.map((_, i) => (0.075 - Math.abs(i / (N - 1) - 0.5) * 0.02) * u), 'spine_02', m.faixa, 0));
}

/**
 * A cabeça: sem capuz (como na arte). O rosto é só sombra, escondido pela massa de cabelo escuro que cai sobre ele
 * (o calote, as laterais e a franja); as mechas compridas ao vento saem de `cabelo`.
 */
function capuz(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  const g = grupoEm(c, c.p('Head'));
  const vazio = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 12), m.vazio);
  vazio.scale.set(0.98, 1.15, 1.0);
  vazio.position.set(0, 0.07, 0.012);
  g.add(vazio);
  // o calote de cabelo: cobre o alto, o fundo e as laterais da cabeça, deixando só a faixa da frente para a franja
  const calote = new THREE.Mesh(new THREE.SphereGeometry(0.13, 26, 16, 0, Math.PI * 2, 0, Math.PI * 0.72), m.cabeloEscuro);
  calote.scale.set(1.02, 1.12, 1.1);
  calote.position.set(0, 0.075, -0.012);
  g.add(calote);
  // o cabelo caído nos lados do rosto e na nuca
  for (const sx of [-1, 1]) {
    const lado = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), m.cabeloEscuro);
    lado.scale.set(0.55, 1.25, 0.9);
    lado.position.set(sx * 0.098, 0.03, 0.0);
    g.add(lado);
  }
  c.prender('Head', g, extras);
  // a franja: mechas que descem da testa sobre o rosto, balançando de leve
  const r = sorteio(313);
  const cab = c.p('Head');
  for (let i = 0; i < 11; i++) {
    const x = (i / 10 - 0.5) * 0.17 * u;
    const topo = V(x, cab.y + 0.15 * u - Math.abs(x) * 0.25, cab.z + (0.105 - Math.abs(x) * 0.5 / u) * u);
    const comp = (0.12 + r() * 0.07) * u;
    const pontos = Array.from({ length: 5 }, (_, k) => {
      const t = k / 4;
      return topo.clone().add(V(Math.sin(t * 3 + i) * 0.012 * u + x * 0.15 * t, -t * comp, t * 0.025 * u));
    });
    extras.push(fita(pontos, pontos.map((_, k) => (0.04 - k * 0.006) * u), 'Head', m.cabeloEscuro, 0.5));
  }
}

function xale(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  const pesc = c.p('neck_01');
  const N = 9;
  const aneis: Anel[] = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    aneis.push({ c: V(0, pesc.y + (0.07 - 0.2 * t) * u, pesc.z - 0.006 * u), rx: (0.14 + t * 0.17) * u, rz: (0.125 + t * 0.12) * u });
  }
  const cortes = dentes(44, 77, 0.07 * u);
  extras.push(superficie({
    aneis, colunas: 44, repete: [2, 1],
    ruga: (i, _j, a) => 1 + Math.sin(a * 7) * 0.07 * suave(0, 0.7, i / (N - 1)),
    descer: (i, j) => (i >= N - 2 ? cortes[j] ?? 0 : 0),
    solto: (i) => suave(0.5, 1, i / (N - 1)) * 0.35,
    pesos: () => ['spine_03', 'neck_01', 0.8],
  }, m.xale));
}

function cabelo(c: Corpo, m: M, extras: Obj[]): void {
  const u = c.u;
  const r = sorteio(909);
  const cab = c.p('Head');
  // o volume do cabelo no alto e nos lados da cabeça: mechas curtas sobre o calote, escorrendo para trás e para baixo
  for (let i = 0; i < 34; i++) {
    const az = r() * Math.PI * 2, el = 0.15 + r() * 1.0;
    const raiz = V(Math.sin(az) * Math.cos(el) * 0.125 * u, cab.y + (0.075 + Math.sin(el) * 0.13) * u, cab.z + (Math.cos(az) * Math.cos(el) * 0.125 - 0.012) * u);
    if (Math.cos(az) > 0.55 && el < 0.7) continue; // a franja cuida da frente do rosto
    const pontos = Array.from({ length: 5 }, (_, k) => {
      const t = k / 4;
      return raiz.clone().add(V(Math.sin(az) * 0.03 * u * t, -t * (0.07 + r() * 0.05) * u, -t * (0.07 + r() * 0.05) * u));
    });
    extras.push(fita(pontos, pontos.map((_, k) => (0.055 - k * 0.008) * u), 'Head', m.cabeloEscuro, 0.55));
  }
  for (let i = 0; i < 20; i++) {
    const a = Math.PI * (0.62 + r() * 0.76) * (r() < 0.5 ? 1 : -1) + (r() < 0.5 ? 0 : 0);
    const raio = 0.11 * u;
    const raiz = V(Math.sin(a) * raio * 0.9, cab.y + (0.1 + r() * 0.1) * u, cab.z - Math.abs(Math.cos(a)) * raio - 0.03 * u);
    const compr = (0.5 + r() * 0.45) * u;
    const pontos: THREE.Vector3[] = [];
    const largos: number[] = [];
    const N = 8;
    const fase = r() * 6;
    for (let k = 0; k < N; k++) {
      const t = k / (N - 1);
      pontos.push(raiz.clone().add(V(Math.sin(a) * 0.24 * u * t + Math.sin(t * 6 + fase) * 0.06 * u * t, -t * 0.5 * u * (0.35 + r() * 0.45) + Math.sin(t * 4 + fase) * 0.05 * u, -t * compr)));
      largos.push((0.042 - t * 0.032 + r() * 0.008) * u);
    }
    extras.push(fita(pontos, largos, 'Head', m.cabelo, 2.1));
  }
}

function capa(c: Corpo, e: Eixos, m: M, extras: Obj[]): void {
  const u = c.u;
  const N = 26, COL = 52;
  const cortes = dentes(COL, 311, 0.3 * u);
  const raioX = perfilDe([[e.topo, 0.14 * u], [(e.topo + c.p('spine_03').y) / 2, 0.235 * u], [c.p('spine_03').y, 0.25 * u], [e.bacia, 0.36 * u], [e.barra + 0.4 * u, 0.62 * u], [e.barra, 1.05 * u]]);
  const raioZ = perfilDe([[e.topo, 0.125 * u], [(e.topo + c.p('spine_03').y) / 2, 0.165 * u], [c.p('spine_03').y, 0.19 * u], [e.bacia, 0.28 * u], [e.barra + 0.4 * u, 0.48 * u], [e.barra, 0.8 * u]]);
  for (const [escala, semente, solto, descer] of [[0.955, 2, 1.0, 0.82], [1, 1, 1.25, 1]] as const) {
    const aneis: Anel[] = [];
    for (let i = 0; i < N; i++) {
      const y = mix(e.topo - 0.01 * u, e.barra + (descer < 1 ? 0.1 * u : 0), i / (N - 1));
      aneis.push({ c: V(0, y, e.zDe(y) - 0.02 * u), rx: raioX(y) * escala, rz: raioZ(y) * escala });
    }
    extras.push(superficie({
      aneis, colunas: COL, arco: [-Math.PI / 2 - 2.55, 5.1], repete: [2, 1],
      ruga: (i, _j, a) => 1 + Math.sin(a * 6 + semente) * 0.06 * suave(0.15, 1, i / (N - 1)) + Math.sin(a * 13) * 0.02 * suave(0.5, 1, i / (N - 1)),
      descer: (i, j) => (i >= N - 3 ? (cortes[j] ?? 0) * (semente === 1 ? 1 : 0.7) : 0),
      solto: (i) => Math.pow(suave(0.08, 1, i / (N - 1)), 1.05) * solto,
      pesos: pesosDoManto(c, e),
    }, semente === 1 ? m.capa : m.forro));
  }
}

/** A veste inteira da skin; o palco esconde o corpo do rig (`esconder`) e põe o cajado na mão direita. */
export function vesteDaSombraRubra(ossos: Ossos): PecaSombria {
  const c = new Corpo(ossos);
  const m = materiais();
  const e = eixosDoCorpo(c);
  const p = perfilDoTronco(c, e);
  const extras: Obj[] = [];
  tunica(c, e, p, m, extras);
  pernas(c, m, extras);
  bracos(c, m, extras);
  cinto(c, e, p, m, extras);
  faixa(c, e, p, m, extras);
  xale(c, m, extras);
  capa(c, e, m, extras);
  capuz(c, m, extras);
  cabelo(c, m, extras);
  return { extras, esconder: '.' };
}
