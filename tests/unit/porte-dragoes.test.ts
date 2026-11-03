// 03/11/2026: proporções, folga de salas/corredores e passagem dos dragões grandes.
import { expect,it } from 'vitest';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { criarInimigo } from '../../src/entities/fabrica';
import { CONTEUDO,contexto,faseDeTexto } from '../apoio/fases';
import { porteDoDragao } from '../../src/world/porte-dragoes';
import { corpoCabe } from '../../src/world/corpo';
import { caminho } from '../../src/world/navegacao';
import { catalogoDeGeracao,gerarFase } from '../../src/world/gerador';
import { carregarFase } from '../../src/world/fase';
import { planejarCaminho } from '../../src/world/movimento';
import { validarFase } from '../../src/world/validacao-fase';
const obter=<T>(x:T|null|undefined):T=>{if(x==null)throw Error('ausente');return x;};
it('cresce com o nível com limites e reserva passagem maior que as asas',()=>{
 let anterior=0;
 for(const n of [1,6,25,50,75,100]){
  const p=porteDoDragao(n,BALANCE_PADRAO);expect(p.altura).toBeGreaterThan(anterior);anterior=p.altura;
  expect(p.corredor).toBeGreaterThan(p.largura);expect(p.corredor%2).toBe(1);expect(p.sala).toBeGreaterThan(p.corredor*2);
 }
 expect(porteDoDragao(1000,BALANCE_PADRAO)).toEqual(porteDoDragao(100,BALANCE_PADRAO));
 expect(porteDoDragao(0,BALANCE_PADRAO)).toEqual(porteDoDragao(1,BALANCE_PADRAO));
});
for(const formato of ['salas','espiral'] as const)for(const nivel of [1,30,100])it(`${formato}, nível ${nivel}: dragão cabe no covil e consegue atravessar os corredores`,()=>{
 const catalogo={...catalogoDeGeracao(CONTEUDO,['pergaminho_retorno']),boss:'dragao_fogo'};
 for(let semente=1;semente<=5;semente++){
  const json=gerarFase({id:'teste',nome:'teste',semente,salas:8,nivelInimigos:nivel,matizGraus:0,formato,tema:'ruinas'},catalogo);
  const validacao=validarFase(json,new Set(CONTEUDO.presets.keys()),CONTEUDO.itens);expect(validacao.ok).toBe(true);
  const f=carregarFase(json),boss=obter(f.inimigos[0]),destino=obter(f.spawns[0]),raio=porteDoDragao(nivel,BALANCE_PADRAO).raio;
  expect(corpoCabe(f,boss.x,boss.y,raio)).toBe(true);
  const caminhoDoBoss=caminho(f,boss,destino,f.largura*f.altura,(x,y)=>corpoCabe(f,x,y,raio));
  expect(caminhoDoBoss.status,`semente ${semente}`).toBe('alcancado');
 }
},30000);
it('a busca de caminho recusa gargalo estreito e aceita corredor com folga para o dragão',()=>{
 const preset=obter(CONTEUDO.presets.get('dragao_fogo'));
 for(const largo of [false,true]){
  const mapa=Array.from({length:21},(_,y)=>Array.from({length:23},(_,x)=>x===0||x===22||y===0||y===20||x===11&&Math.abs(y-10)>(largo?3:0)?'#':'.').join(''));
  const ctx=contexto(faseDeTexto(mapa)),e=criarInimigo(preset,'d',5,10,BALANCE_PADRAO,{nivel:100});
  const estado=criarEstado({semente:1,faseId:'teste'});estado.entidades.push(e);
  expect(planejarCaminho(e,{x:17,y:10},ctx,0,[],500)).toBe(largo);
 }
});
