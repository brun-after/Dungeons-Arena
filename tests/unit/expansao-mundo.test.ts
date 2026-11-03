// 02/11/2026: progressão entre reinos, exército independente, atenção e assistência de dungeon.
import { describe,expect,it } from 'vitest';
import { CONTEUDO,contexto,faseDeTexto } from '../apoio/fases';
import { BALANCE_PADRAO } from '../../src/core/contexto';
import { criarEstado } from '../../src/core/estado';
import { criarInimigo,criarJogador } from '../../src/entities/fabrica';
import { limiteDoExercito,processarExercitoNecromante,raioDeAtencao } from '../../src/entities/ia-mundo';
import { processarIa } from '../../src/entities/ia';
import { reinoDoConteudo,territorioDoLugar,capitalDoAtlas } from '../../src/mundo/reino';
import { montarLugar } from '../../src/mundo/lugares';
import { fichaNova,lerFichaDoMundo } from '../../src/mundo/ficha-mundo';
import { precoDoItem } from '../../src/progression/itens-progressao';
import { comprar,estoqueDaLoja,vender } from '../../src/progression/loja';
import { criarTumulo } from '../../src/mundo/objetos-mundo';
import { novoObjeto } from '../../src/world/objeto-novo';
import { ofertasDoMundo } from '../../src/mundo/lojas-mundo';
import { ticksDe } from '../../src/core/tempo';
import { tintaDaInvocacao } from '../../src/render/cores-necromancia';
import { gerarExterior } from '../../src/world/gerador-exterior';
import { validarFase } from '../../src/world/validacao-fase';
import { carregarFase } from '../../src/world/fase';
import { caminho } from '../../src/world/navegacao';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
const obter=<T>(x:T|undefined|null):T=>{if(x==null)throw Error('ausente');return x;};
const aberto=()=>contexto(faseDeTexto(['#'.repeat(40),...Array.from({length:38},()=>`#${'.'.repeat(38)}#`),'#'.repeat(40)]));

describe('Reino do Eclipse',()=>{
 it('gera as doze regiões válidas, com entradas alcançáveis e capacidade para os exércitos',()=>{
  const atlas=reinoDoConteudo(CONTEUDO),eclipse=obter(CONTEUDO.reinos.get('reino_eclipse'));
  for(const r of atlas.regioes.filter(r=>eclipse.regioes.some(e=>e.id===r.id))) {
   const ex=gerarExterior(atlas,r),validacao=validarFase(ex.fase,new Set(CONTEUDO.presets.keys()),CONTEUDO.itens);
   expect(validacao.ok,r.id).toBe(true);
   expect(ex.fase.inimigos?.length??0).toBeLessThan(340);
   const fase=carregarFase(ex.fase),origem=obter(fase.spawns[0]);
   for(const p of ex.pontos)if(p.tipo==='estrutura')expect(caminho(fase,origem,p.frente,fase.largura*fase.altura).status,r.id).toBe('alcancado');
  }
 },30000);
 it('é maior, tem progressão própria e mais dungeons e domínios que o Central',()=>{
  const c=obter(CONTEUDO.reinos.get('reino_central')),a=obter(CONTEUDO.reinos.get('reino_eclipse')),atlas=reinoDoConteudo(CONTEUDO);
  expect(a.regioes.length).toBeGreaterThan(c.regioes.length);
  expect(a.masmorras.length).toBeGreaterThan(c.masmorras.length);
  expect(a.covis.length).toBeGreaterThan(c.covis.length);
  const area=(r:typeof a)=>r.regioes.reduce((n,x)=>n+(x.tamanho??r.tamanhoRegiao)**2,0);
  expect(area(a)).toBeGreaterThan(area(c));
  expect(a.regioes.every(r=>r.nivel[0]>=30&&r.bosses?.chancePct===100)).toBe(true);
  expect(territorioDoLugar(atlas,a.inicio).id).toBe(a.id);
  expect(capitalDoAtlas(atlas,a.inicio)).toBe(true);
  expect(atlas.regioes).toHaveLength(a.regioes.length+c.regioes.length);
  expect(new Set(atlas.regioes.map(r=>`${r.gx},${r.gy}`)).size).toBe(atlas.regioes.length);
 });
 it('dungeons ampliadas e todas as lojas de dungeon têm retorno e estoque superior',()=>{
  const atlas=reinoDoConteudo(CONTEUDO),ctx=aberto();
  for(const m of [...atlas.masmorras,...atlas.covis]) {
   const lugar=montarLugar(CONTEUDO,atlas,atlas.masmorras.includes(m as typeof atlas.masmorras[number])?{tipo:'masmorra',masmorra:m as typeof atlas.masmorras[number]}:{tipo:'covil',covil:m as typeof atlas.covis[number]},ctx.modo);
   const lojas=lugar.estado.objetos.filter(o=>o.tipo==='loja');
   expect(lojas.length,m.id).toBeGreaterThan(0);
   for(const loja of lojas)expect(estoqueDaLoja(lugar.estado,lugar.ctx,loja),m.id).toContain('pergaminho_retorno');
   const reino=territorioDoLugar(atlas,m.id);
   for(const id of Object.values(reino.lojas).flat())expect(lojas[0]?.itens,m.id).toContain(id);
   if(m.salas>=18){expect(lugar.ctx.fase.largura).toBe(96);expect(lugar.ctx.fase.altura).toBe(80);}
  }
 },30000);
});

describe('exército do necromante inimigo',()=>{
 for(const [nivel,quantidade] of ([[1,4],[16,7],[31,10],[80,10]] as const))it(`nível ${nivel}: ${quantidade} lacaios sem cadáveres e sem limite do jogador`,()=>{
  const ctx=aberto(),estado=criarEstado({semente:2,faseId:ctx.fase.id});
  const boss=criarInimigo(obter(CONTEUDO.presets.get('necromante_ancestral')),'boss',15,15,BALANCE_PADRAO,{nivel});
  const j=criarJogador(obter(CONTEUDO.classes.get('guerreiro')),'j',19,15,BALANCE_PADRAO);
  estado.entidades.push(boss,j);processarIa(estado,ctx,[]);
  expect(limiteDoExercito(ctx,nivel)).toBe(quantidade);
  processarExercitoNecromante(estado,ctx,boss,[]);
  const lacaios=estado.entidades.filter(e=>e.invocacao?.exercitoBoss);
  expect(lacaios).toHaveLength(quantidade);
  expect(new Set(lacaios.map(e=>e.preset)).size).toBe(4);
  expect(lacaios.every(e=>e.nivel===nivel&&e.xpBase===0&&!e.invocacao?.necromancia)).toBe(true);
  expect(lacaios.some(e=>e.habilidades.length>0)).toBe(true);
  const piromante=obter(lacaios.find(e=>e.preset==='piromante_profano'));
  processarIa(estado,ctx,[]);
  const ia=obter(piromante.ia);
  Object.assign(ia,{modo:'perseguindo',alvoId:j.id,ataquesFeitos:1,proximoAtaqueTick:0});
  piromante.x=14;piromante.y=15;piromante.px=14;piromante.py=15;
  const eventos:EventoSimulacao[]=[];processarIa(estado,ctx,eventos);
  expect(eventos.some(e=>e.t==='acaoIniciada'&&e.atorId===piromante.id&&e.habilidadeId==='bola_de_fogo')).toBe(true);
  expect(tintaDaInvocacao(obter(lacaios[0]),{...estado,entidades:lacaios})).toBe(0x37333d);
  processarExercitoNecromante(estado,ctx,boss,[]);expect(estado.entidades).toHaveLength(quantidade+2);
  obter(lacaios[0]).morto=true;estado.tick+=ticksDe(ctx.balance.mundo.exercitoNecromante.recargaMs);
  processarExercitoNecromante(estado,ctx,boss,[]);expect(estado.entidades.filter(e=>e.invocacao?.exercitoBoss&&!e.morto)).toHaveLength(quantidade);
 });
});

it('o combate recente amplia atenção no exterior e expira; interior mantém raio normal',()=>{
 let ctx=aberto(); const estado=criarEstado({semente:1,faseId:'teste'});
 const e=criarInimigo(obter(CONTEUDO.presets.get('orc')),'e',10,10,ctx.balance),a=criarInimigo(obter(CONTEUDO.presets.get('orc')),'a',12,10,ctx.balance),j=criarJogador(obter(CONTEUDO.classes.get('guerreiro')),'j',15,10,ctx.balance);
 estado.entidades.push(e,a,j);a.participacao.push({id:j.id,tick:0});
 expect(raioDeAtencao(estado,ctx,e,3)).toBe(3);
 ctx={...ctx,fase:{...ctx.fase,exterior:true}};expect(raioDeAtencao(estado,ctx,e,3)).toBe(13);
 estado.tick=ticksDe(ctx.balance.mundo.atencaoBatalha.memoriaMs)+1;expect(raioDeAtencao(estado,ctx,e,3)).toBe(3);
});

it('retorno pela metade em 5 mortes, grátis em 10; compra sem ouro, ficha persiste por dungeon',()=>{
 let ctx=aberto();ctx={...ctx,fase:{...ctx.fase,id:'mundo_masmorra_teste'}};
 const j=criarJogador(obter(CONTEUDO.classes.get('guerreiro')),'j',3,3,ctx.balance),b=obter(j.bolsa),item=obter(CONTEUDO.itens.get('pergaminho_retorno'));
 const base=precoDoItem(item,j,ctx);b.mortesNaDungeon=5;expect(precoDoItem(item,j,ctx)).toBe(Math.max(1,Math.round(base/2)));
 b.mortesNaDungeon=10;expect(precoDoItem(item,j,ctx)).toBe(0);
 const estado=criarEstado({semente:1,faseId:ctx.fase.id});estado.entidades.push(j);estado.objetos.push(novoObjeto('loja','loja',3,3,{itens:[item.id]}));j.interacao={tipo:'loja',objetoId:'loja',ateTick:100};b.ouro=0;comprar(estado,ctx,j,item.id,[]);expect(b.mochila.some(i=>i.itemId===item.id)).toBe(true);
 const gratuita=obter(b.mochila.find(i=>i.itemId===item.id));
 expect(gratuita.ref).toBe('resgate_dungeon');vender(estado,ctx,j,gratuita.invId,[]);expect(b.ouro).toBe(0);
 ctx={...ctx,fase:{...ctx.fase,id:'regiao'}};expect(precoDoItem(item,j,ctx)).toBe(base);
 criarTumulo(estado,ctx,j,[]);expect(estado.objetos.filter(o=>o.tipo==='tumulo').flatMap(o=>o.itens)).not.toContain(item.id);
 const reino=reinoDoConteudo(CONTEUDO),f=obter(fichaNova(ctx,reino,'guerreiro','Teste','id'));f.mortesDungeon={toca_dos_goblins:10};expect(lerFichaDoMundo(f,reino)?.mortesDungeon).toEqual(f.mortesDungeon);
});

it('ofertas expiram e mudam sem consumir RNG; estoque da dungeon permanece',()=>{
 const base=aberto(), ctx={...base,fase:{...base.fase,exterior:true}};
 const estado=criarEstado({semente:1,faseId:'exterior_teste'}),loja=novoObjeto('loja','loja',3,3,{itens:[]}),rng={...estado.rng};
 const periodo=ticksDe(ctx.balance.mundo.ofertas.periodoS*1000);
 let t=0;while(!ofertasDoMundo(estado,ctx,loja).length&&t++<periodo)estado.tick++;
 expect(ofertasDoMundo(estado,ctx,loja)).toHaveLength(2);expect(estado.rng).toEqual(rng);
 estado.tick+=ticksDe(ctx.balance.mundo.ofertas.duracaoS*1000);expect(ofertasDoMundo(estado,ctx,loja)).toEqual([]);
});
