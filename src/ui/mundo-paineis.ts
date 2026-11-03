import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { mapaDoLugar } from './mapa-lugar';
import { atlasDoReino } from './mapa-reino';
import type { OrientacaoMundo } from './orientacao-mundo';
import { icone } from './icones';
// Os painéis do Mundo (marco 29, 30/10/2026, D-128): a faixa do lugar (nome, canal e o aviso de perigo), o diálogo
// do portal (as vilas descobertas, com o custo em ouro e o pergaminho de retorno) e o mapa do reino com névoa (só
// as regiões descobertas mostram o nome; a vila salva e o lugar atual ficam marcados). O quadro de missões, o banco
// e o mercado ficam em mundo-economia.ts; o chat, o grupo e a troca, em mundo-social.ts (marco 30).
// Texto sempre por `textContent` (nada de HTML montado à mão).

import { t, type ChaveTexto } from '../i18n';
import type { AvisoDoMundo } from '../mundo/avisos';
import { territorioDoLugar, type Reino } from '../mundo/reino';
import { dialogo, paragrafo } from './mundo-dialogos';

/** O portal: um botão por vila descoberta (pagando ouro) e o pergaminho de retorno, quando há. */
export function abrirPortal(aviso: Extract<AvisoDoMundo, { tipo: 'portais' }>, agoraMs: number, viajar: (destino: string, pagamento: 'ouro' | 'pergaminho') => void): void {
  const d = dialogo(t('mundo.portal.titulo'));
  d.corpo.append(paragrafo(t('mundo.portal.texto')));
  if (aviso.destinos.length === 0) d.corpo.append(paragrafo(t('mundo.portal.vazio')));
  const espera = Math.ceil((aviso.livreEm - agoraMs) / 1000);
  if (espera > 0) d.corpo.append(paragrafo(t('mundo.portal.recarga', { s: espera })));
  for (const destino of aviso.destinos) {
    const linha = document.createElement('div');
    linha.className = 'acoes-slot';
    const ouro = document.createElement('button');
    ouro.type = 'button';
    ouro.className = 'botao-menu';
    ouro.textContent = t('mundo.portal.ouro', { nome: destino.nome, custo: destino.custo });
    ouro.disabled = espera > 0;
    ouro.addEventListener('click', () => {
      d.fechar();
      viajar(destino.regiao, 'ouro');
    });
    linha.append(ouro);
    if (aviso.temPergaminho) {
      const perg = document.createElement('button');
      perg.type = 'button';
      perg.className = 'botao-menu';
      perg.textContent = t('mundo.portal.pergaminho');
      perg.addEventListener('click', () => {
        d.fechar();
        viajar(destino.regiao, 'pergaminho');
      });
      linha.append(perg);
    }
    d.corpo.append(linha);
  }
}

/** O texto do aviso de perigo do lugar. */
export function textoDoPerigo(aviso: Extract<AvisoDoMundo, { tipo: 'lugar' }>): string {
  return t(`mundo.perigo.${aviso.perigo}` as ChaveTexto);
}

/** O nome do lugar no topo (com o canal quando não é o 1) e a borda vermelha nas regiões com PvP. */
export function criarFaixaDoLugar(): { elemento: HTMLElement; mostrar: (aviso: Extract<AvisoDoMundo, { tipo: 'lugar' }>) => void } {
  const el = document.createElement('div');
  el.className = 'faixa-lugar';
  el.setAttribute('role', 'status');
  const nome = document.createElement('strong');
  const perigo = document.createElement('span');
  el.append(nome, perigo);
  let lugarAnterior: string | null = null;
  return {
    elemento: el,
    mostrar: (a) => {
      if (lugarAnterior === a.lugar) return;
      lugarAnterior = a.lugar;
      el.getAnimations().forEach(animacao => { animacao.cancel(); });
      el.style.opacity = '1';
      const animacao = el.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0, offset: 1 }], { duration: 5000, fill: 'forwards' });
      // Finaliza também por tempo de apresentação quando o navegador reduz os quadros.
      window.setTimeout(() => { animacao.cancel(); el.style.opacity = '0'; }, 5000);
      nome.textContent = a.canal > 1 ? t('mundo.lugarCanal', { nome: a.nome, canal: a.canal }) : t('mundo.lugar', { nome: a.nome });
      perigo.textContent = textoDoPerigo(a);
      el.dataset.pvp = a.pvp ? '1' : '0';
    },
  };
}

/** O mapa do reino: a grade das regiões, com névoa nas que o personagem ainda não viu. */
export function abrirMapa(reino: Reino, lugar: string, descobertas: readonly string[], vilaSalva: string, terreno?: { ctx: ContextoSimulacao; estado: () => EstadoJogo | null; idLocal: string; membros?: readonly import('../mundo/avisos').MembroVisto[]; orientacao?: OrientacaoMundo }): void {
  if (document.querySelector('.mapa-expandido')) return;
  const d = dialogo(t('mundo.mapa.titulo'));
  d.el.classList.add('mapa-expandido');
  const atual = [...reino.regioes, ...reino.masmorras, ...reino.covis].find(x => lugar.endsWith(`:${x.id}`));
  d.corpo.append(paragrafo(t('mundo.mapa.lugar', { nome: atual?.nome ?? lugar })));
  d.corpo.append(paragrafo(t('mundo.mapa.instrucoes')));
  const bussola = document.createElement('div'); bussola.className = 'bussola-mapa';
  for (const [direcao, seta] of [['norte', 'seta_ne'], ['leste', 'seta_se'], ['sul', 'seta_so'], ['oeste', 'seta_no']] as const) {
    const eixo = document.createElement('span'); eixo.append(icone(seta), t(`mundo.mapa.${direcao}`)); bussola.append(eixo);
  }
  d.corpo.append(bussola);
  const statusDestino = paragrafo('', 'destino-mapa');
  statusDestino.setAttribute('role', 'status');
  const selecionar = (id: string, nome: string) => {
    terreno?.orientacao?.definir({ lugar: id, nome });
    statusDestino.textContent = t('mundo.mapa.destino', { nome });
  };
  d.corpo.append(statusDestino);
  const chave = `mapa:${reino.id}:marcas`;
  let marcasSalvas: string[] = [];
  try {
    const valor: unknown = JSON.parse(localStorage.getItem(chave) ?? '[]');
    if (Array.isArray(valor)) marcasSalvas = valor.filter((x): x is string => typeof x === 'string');
  } catch { /* Armazenamento indisponível: marcas funcionam nesta abertura. */ }
  const marcar = (b: HTMLButtonElement, id: string, nome: string) => {
    const atualizar = () => { b.setAttribute('aria-pressed', String(marcasSalvas.includes(id))); };
    atualizar();
    b.addEventListener('click', () => {
      marcasSalvas = marcasSalvas.includes(id) ? marcasSalvas.filter(x => x !== id) : [...marcasSalvas, id];
      atualizar();
      if (marcasSalvas.includes(id)) selecionar(id, nome);
      else if (terreno?.orientacao?.destino?.lugar === id) { terreno.orientacao.definir(null); statusDestino.textContent = ''; }
      try { localStorage.setItem(chave, JSON.stringify(marcasSalvas)); } catch { /* sem persistência local */ }
    });
  };
  const grade = document.createElement('div');
  grade.className = 'mapa-reino';
  const atlas = document.createElement('div');
  const botoesReinos = new Map<string,HTMLButtonElement>();
  const desenharReino = (mapa: Reino) => {
  grade.textContent='';
  atlas.replaceChildren(atlasDoReino(mapa, lugar, descobertas, selecionar));
  for(const [id,b] of botoesReinos)b.setAttribute('aria-pressed',String(id===mapa.id));
  grade.style.gridTemplateColumns = `repeat(${String(mapa.largura)}, 1fr)`;
  for (let gy = 0; gy < mapa.altura; gy++) {
    for (let gx = 0; gx < mapa.largura; gx++) {
      const r = mapa.regioes.find((x) => x.gx === gx && x.gy === gy);
      const celula = document.createElement('div');
      celula.className = 'regiao-mapa';
      if (!r) {
        grade.append(celula);
        continue;
      }
      const vista = descobertas.includes(`regiao:${r.id}`);
      celula.dataset.vista = vista ? '1' : '0';
      celula.dataset.perigo = vista ? r.perigo : 'desconhecido';
      const nome = document.createElement('span');
      nome.textContent = vista ? `${r.nome} · ${r.nivel[0]}–${r.nivel[1]}` : t('mundo.mapa.desconhecida');
      celula.append(nome);
      const marcas: string[] = [];
      for (const m of terreno?.membros ?? []) if (m.lugar === `regiao:${r.id}` || r.estruturas.some(e => m.lugar === `${e.destino.tipo}:${e.destino.id}`)) marcas.push(m.nome);
      if (lugar === `regiao:${r.id}`) marcas.push(t('mundo.mapa.aqui'));
      if (vilaSalva === r.id) marcas.push(t('mundo.mapa.vila'));
      if (vista) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'marcar-lugar';
        b.textContent = t('mundo.mapa.marcar', { nome: r.nome });
        marcar(b, `regiao:${r.id}`, r.nome);
        celula.append(b);
        // As estruturas descobertas (as escondidas só depois de achadas).
        for (const e of r.estruturas) if (!e.escondida || descobertas.includes(`${e.destino.tipo}:${e.destino.id}`)) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'marcar-lugar';
          b.textContent = t('mundo.mapa.marcar', { nome: e.nome });
          marcar(b, `${e.destino.tipo}:${e.destino.id}`, e.nome);
          celula.append(b);
        }
      }
      if (marcas.length > 0) {
        const extra = document.createElement('small');
        extra.textContent = marcas.join(' · ');
        celula.append(extra);
      }
      grade.append(celula);
    }
  }
  };
  const escolhas=document.createElement('div');escolhas.className='acoes-slot';
  for(const territorio of reino.territorios??[reino]) {
    const b=document.createElement('button');b.type='button';b.className='botao-cabecalho';
    const membros=(terreno?.membros??[]).filter(m=>[...territorio.regioes,...territorio.masmorras,...territorio.covis].some(l=>m.lugar?.endsWith(`:${l.id}`)));
    b.textContent=territorio.nome+(membros.length?` · ${membros.map(m=>m.nome).join(', ')}`:'');
    b.addEventListener('click',()=>{desenharReino(territorio);});botoesReinos.set(territorio.id,b);escolhas.append(b);
  }
  desenharReino(territorioDoLugar(reino,atual?.id??reino.inicio));
  const local = document.createElement('section');
  const geografia = document.createElement('section');
  const lista = document.createElement('section');
  local.className = 'painel-cartografia'; geografia.className = 'painel-cartografia'; lista.className = 'painel-cartografia';
  geografia.append(atlas); lista.append(grade);
  const abas = document.createElement('div'); abas.className = 'abas-cartografia';
  const opcoes = [
    ...(terreno ? [{ nome: t('mundo.mapa.terreno'), painel: local }] : []),
    { nome: t('mundo.mapa.atlas'), painel: geografia },
    { nome: t('mundo.mapa.lista'), painel: lista },
  ];
  const botoes = opcoes.map(opcao => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'botao-cabecalho'; b.textContent = opcao.nome;
    b.addEventListener('click', () => { mostrar(opcao.painel); });
    abas.append(b); return b;
  });
  const mostrar = (painel: HTMLElement) => {
    opcoes.forEach((opcao, i) => { opcao.painel.hidden = opcao.painel !== painel; botoes[i]?.setAttribute('aria-pressed', String(opcao.painel === painel)); });
    escolhas.hidden = painel === local;
  };
  if (terreno) {
    const canvas = mapaDoLugar(terreno.ctx, terreno.estado, terreno.idLocal, lugar, descobertas, terreno.orientacao);
    const janela = document.createElement('div'); janela.className = 'janela-cartografia';
    janela.append(canvas);
    const zoom = document.createElement('div'); zoom.className = 'acoes-slot zoom-cartografia';
    let escala = 1;
    for (const [rotulo, delta] of [['mundo.mapa.reduzir', -.5], ['mundo.mapa.ampliar', .5]] as const) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'botao-cabecalho'; b.textContent = t(rotulo);
      b.addEventListener('click', () => {
        escala = Math.max(1, Math.min(4, escala + delta));
        const base = Math.min(janela.clientWidth, Math.max(220, window.innerHeight - 330) * 1.515);
        canvas.style.width = escala === 1 ? '' : `${base * escala}px`;
      });
      zoom.append(b);
    }
    local.append(zoom, janela, paragrafo(t('mundo.mapa.legenda'), 'legenda-cartografia'));
  }
  d.corpo.append(abas, escolhas, local, geografia, lista);
  mostrar(terreno ? local : geografia);
}

/** O texto do aviso curto (o que não abre diálogo); null quando o aviso não é para a faixa de avisos. */
export function textoDoAviso(a: AvisoDoMundo): string | null {
  switch (a.tipo) {
    case 'salvo':
      return t('mundo.salvo');
    case 'descoberta':
      return t('mundo.descoberta', { nome: a.nome });
    case 'recompensa': {
      // Marco 30 (D-129): a recompensa da missão diz o ouro e a XP.
      const extras = [a.ouro ? t('mundo.quadro.ouro', { ouro: a.ouro }) : '', a.xp ? t('mundo.quadro.xp', { xp: a.xp }) : ''].filter((x) => x !== '');
      return extras.length > 0 ? t('mundo.recompensaCom', { nome: a.nome, extras: extras.join(' · ') }) : t('mundo.recompensa', { nome: a.nome });
    }
    case 'recusa':
      return t(`mundo.recusa.${a.motivo}` as ChaveTexto);
    default:
      return null;
  }
}
