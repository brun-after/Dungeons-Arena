import type { ContextoSimulacao } from '../core/contexto';
import type { EstadoJogo } from '../core/estado';
import { mapaDoLugar } from './mapa-lugar';
// Os painéis do Mundo (marco 29, 30/10/2026, D-128): a faixa do lugar (nome, canal e o aviso de perigo), o diálogo
// do portal (as vilas descobertas, com o custo em ouro e o pergaminho de retorno) e o mapa do reino com névoa (só
// as regiões descobertas mostram o nome; a vila salva e o lugar atual ficam marcados). O quadro de missões, o banco
// e o mercado ficam em mundo-economia.ts; o chat, o grupo e a troca, em mundo-social.ts (marco 30).
// Texto sempre por `textContent` (nada de HTML montado à mão).

import { t, type ChaveTexto } from '../i18n';
import type { AvisoDoMundo } from '../mundo/avisos';
import type { Reino } from '../mundo/reino';
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
export function abrirMapa(reino: Reino, lugar: string, descobertas: readonly string[], vilaSalva: string, terreno?: { ctx: ContextoSimulacao; estado: () => EstadoJogo | null; idLocal: string; membros?: readonly import('../mundo/avisos').MembroVisto[] }): void {
  if (document.querySelector('.mapa-expandido')) return;
  const d = dialogo(t('mundo.mapa.titulo'));
  d.el.classList.add('mapa-expandido');
  const atual = [...reino.regioes, ...reino.masmorras, ...reino.covis].find(x => lugar.endsWith(`:${x.id}`));
  d.corpo.append(paragrafo(t('mundo.mapa.lugar', { nome: atual?.nome ?? lugar })));
  d.corpo.append(paragrafo(t('mundo.mapa.instrucoes')));
  const chave = `mapa:${reino.id}:marcas`;
  let marcasSalvas: string[] = [];
  try {
    const valor: unknown = JSON.parse(localStorage.getItem(chave) ?? '[]');
    if (Array.isArray(valor)) marcasSalvas = valor.filter((x): x is string => typeof x === 'string');
  } catch { /* Armazenamento indisponível: marcas funcionam nesta abertura. */ }
  const marcar = (b: HTMLButtonElement, id: string) => {
    const atualizar = () => { b.setAttribute('aria-pressed', String(marcasSalvas.includes(id))); };
    atualizar();
    b.addEventListener('click', () => {
      marcasSalvas = marcasSalvas.includes(id) ? marcasSalvas.filter(x => x !== id) : [...marcasSalvas, id];
      atualizar();
      try { localStorage.setItem(chave, JSON.stringify(marcasSalvas)); } catch { /* sem persistência local */ }
    });
  };
  const grade = document.createElement('div');
  grade.className = 'mapa-reino';
  grade.style.gridTemplateColumns = `repeat(${String(reino.largura)}, 1fr)`;
  for (let gy = 0; gy < reino.altura; gy++) {
    for (let gx = 0; gx < reino.largura; gx++) {
      const r = reino.regioes.find((x) => x.gx === gx && x.gy === gy);
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
      nome.textContent = vista ? r.nome : t('mundo.mapa.desconhecida');
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
        marcar(b, `regiao:${r.id}`);
        celula.append(b);
        // As estruturas descobertas (as escondidas só depois de achadas).
        for (const e of r.estruturas) if (!e.escondida || descobertas.includes(`${e.destino.tipo}:${e.destino.id}`)) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'marcar-lugar';
          b.textContent = t('mundo.mapa.marcar', { nome: e.nome });
          marcar(b, `${e.destino.tipo}:${e.destino.id}`);
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
  if (terreno) d.corpo.append(mapaDoLugar(terreno.ctx, terreno.estado, terreno.idLocal, lugar, descobertas));
  d.corpo.append(grade);
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
