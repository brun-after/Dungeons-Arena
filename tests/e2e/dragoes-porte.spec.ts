// 03/11/2026: nenhum quadro pode cortar pernas/asas; galeria com a escala real por nível.
import {readFileSync} from 'node:fs';
import {expect,test} from '@playwright/test';
import type {Balance} from '../../src/core/contexto';
import {porteDoDragao} from '../../src/world/porte-dragoes';
interface Entrada {quadroL:number;quadroA:number;ancoraX:number;ancoraY:number;pxCelula:number;colunas:number;faixa:number;estados:Record<string,{inicio:number;n:number}>}
test('atlas dos dragões não corta quadros e o porte cresce com o nível',async({page},info)=>{
 test.skip(info.project.name!=='desktop','O atlas é o mesmo no desktop e no celular.');
 const catalogo=JSON.parse(readFileSync('src/assets/personagens/catalogo.json','utf8')) as Record<string,Entrada>;
 const m=catalogo.dragao_fogo;if(!m)throw Error('atlas ausente');
 const balance=JSON.parse(readFileSync('src/data/balance.json','utf8')) as Balance;
 const imagem=readFileSync('src/assets/personagens/dragao_fogo.webp').toString('base64');
 for(const elemento of ['gelo','raio','veneno'])expect(catalogo[`dragao_${elemento}`]).toEqual(m);
 await page.setViewportSize({width:1200,height:510});
 const limites=await page.evaluate(async({m,imagem,portes})=>{
  const img=new Image();img.src='data:image/webp;base64,'+imagem;await img.decode();
  const quadro=document.createElement('canvas');quadro.width=m.quadroL;quadro.height=m.quadroA;
  const q=quadro.getContext('2d');if(!q)throw Error('sem canvas');
  const cortes:string[]=[];
  for(let d=0;d<8;d++)for(let c=0;c<m.colunas;c++){
   const sx=(c%m.faixa)*m.quadroL,sy=(Math.floor(c/m.faixa)*8+d)*m.quadroA;
   q.clearRect(0,0,m.quadroL,m.quadroA);q.drawImage(img,sx,sy,m.quadroL,m.quadroA,0,0,m.quadroL,m.quadroA);
   const pixels=q.getImageData(0,0,m.quadroL,m.quadroA).data;
   let cortou=false;
   for(let y=0;y<m.quadroA;y++)for(let x=0;x<m.quadroL;x++)if((x===0||y===0||x===m.quadroL-1||y===m.quadroA-1)&& (pixels[(y*m.quadroL+x)*4+3]??0)>100)cortou=true;
   if(cortou)cortes.push(`${d}:${c}`);
  }
  const c=document.createElement('canvas');c.width=1200;c.height=510;document.body.style.cssText='margin:0;background:#181b22';document.body.append(c);
  const g=c.getContext('2d');if(!g)throw Error('sem galeria');g.fillStyle='#181b22';g.fillRect(0,0,c.width,c.height);
  for(const [i,p] of portes.entries()){
   const cx=150+i*300,cy=320;
   for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){
    const px=cx+(x-y)*22,py=cy+(x+y)*11;
    g.fillStyle=(x+y)%2?'#44434a':'#3b3b43';g.beginPath();g.moveTo(px,py-11);g.lineTo(px+22,py);g.lineTo(px,py+11);g.lineTo(px-22,py);g.closePath();g.fill();
   }
   g.fillStyle='#10121788';g.beginPath();g.ellipse(cx,cy,24,9,0,0,Math.PI*2);g.fill();
   const escala=48/m.pxCelula*p.escala;
   g.drawImage(img,0,4*m.quadroA,m.quadroL,m.quadroA,cx-m.ancoraX*escala,cy-m.ancoraY*escala,m.quadroL*escala,m.quadroA*escala);
   g.fillStyle='#e6ddc7';g.font='18px sans-serif';g.textAlign='center';g.fillText(`Nível ${p.nivel}`,cx,440);g.fillText(`${p.altura.toFixed(2)} células de altura`,cx,467);
  }
  return {cortes,largura:img.width,altura:img.height};
 },{m,imagem,portes:[1,30,60,100].map(nivel=>({nivel,...porteDoDragao(nivel,balance)}))});
 expect(limites.cortes).toEqual([]);expect(limites.largura).toBeLessThanOrEqual(4096);expect(limites.altura).toBeLessThanOrEqual(4096);
 await page.screenshot({path:info.outputPath('dragoes-por-nivel.png')});
});
