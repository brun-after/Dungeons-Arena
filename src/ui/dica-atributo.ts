// Dica rápida dos atributos na aba Ficha (marco 18, 17/10/2026, D-068). Um "?" em cada linha abre um cartão com o
// que o atributo faz e os números do personagem agora (já com o equipamento): o multiplicador da rolagem, a potência
// dos efeitos, o estudo, a recarga do básico, as armadilhas, o d20, o desconto. Abre com clique, toque ou teclado e
// fecha com Esc, com outro toque fora ou ao trocar de aba. Mesmo padrão do cartão dos chips de efeito.

import { chanceDeVinte } from '../combat/critico';
import type { ContextoSimulacao } from '../core/contexto';
import type { Atributos, Entidade } from '../entities/entidade';
import { t, type ChaveTexto } from '../i18n';
import {
  bonusDeEspecializacao,
  chanceDeDesarmarPct,
  chanceDeRevelarPct,
  descontoNaLojaPct,
  multiplicadorDeRolagem,
  perfilDestreza,
  potenciaDeEfeito,
  raioDeRevelar,
  reducaoEstudoPct,
  reducaoRecargaBasicoPct,
  vidaPorCelula,
} from '../progression/efeitos-atributo';
import type { NomeAtributo } from '../progression/itens';
import { fatorDeDominio, fatorDeSkillDeClasse, marcoDe, marcosDaClasse } from '../progression/dominio';
import { velocidade } from '../world/movimento';

const fmt = (v: number, casas = 1) => v.toFixed(casas).replace('.', ',');

/** As linhas do cartão de um atributo, com os números do personagem. */
export function linhasDaDica(nome: NomeAtributo, a: Atributos, ctx: ContextoSimulacao, j: Entidade, hpMax: number, manaMax: number): string[] {
  const b = ctx.balance;
  const rolagem = fmt(multiplicadorDeRolagem(a, b), 2);
  switch (nome) {
    case 'forca':
      return [t('dica.forca.1', { rolagem }), t('dica.forca.2', { bonus: a.forca + bonusDeEspecializacao(a, 'forca', b) }), t('dica.especializacao', { inicio: b.atributos.efeitos.especializacaoInicio, ponto: b.atributos.efeitos.especializacaoPorPonto, max: b.atributos.efeitos.especializacaoMax })];
    case 'destreza': {
      const perfil = perfilDestreza(ctx, j);
      return [
        t('dica.destreza.1', { vel: fmt(velocidade(a.destreza, b.movimento.velocidadeBaseMs, false, b.movimento.velocidadeMaxMult)) }),
        t('dica.destreza.2', { pct: fmt(reducaoRecargaBasicoPct(a, b, perfil), 0), teto: perfil?.recargaBasicoMaxPct ?? b.atributos.efeitos.recargaBasicoMaxPct }),
        t('dica.destreza.3'),
      ];
    }
    case 'constituicao':
      return [t('dica.constituicao.1', { hp: hpMax }), t('dica.constituicao.2', { vida: vidaPorCelula(a, b) })];
    case 'inteligencia':
      return [
        t('dica.inteligencia.1', { rolagem, bonus: a.inteligencia + bonusDeEspecializacao(a, 'inteligencia', b) }),
        t('dica.especializacao', { inicio: b.atributos.efeitos.especializacaoInicio, ponto: b.atributos.efeitos.especializacaoPorPonto, max: b.atributos.efeitos.especializacaoMax }),
        t('dica.inteligencia.2', { potencia: fmt(potenciaDeEfeito(a, b), 2) }),
        t('dica.inteligencia.3', { pct: fmt(reducaoEstudoPct(a, b), 0) }),
      ];
    case 'sabedoria': {
      const regen = b.recursos.regenManaPorSegundo * (1 + (Math.max(0, a.sabedoria - 10) * b.atributos.efeitos.regenManaPorSabedoriaPct) / 100);
      return [
        t('dica.sabedoria.1', { mana: manaMax, regen: fmt(regen) }),
        t('dica.sabedoria.2', { raio: raioDeRevelar(a, b), revelar: fmt(chanceDeRevelarPct(a, b), 0), desarmar: fmt(chanceDeDesarmarPct(a, b), 0) }),
      ];
    }
    case 'dominio':
      return linhasDoDominio(ctx, j);
    case 'carisma':
      return [
        t('dica.carisma.1', { d20: fmt(chanceDeVinte(a.carisma, b.combate.carismaNeutro) * 100) }),
        t('dica.carisma.2'),
        t('dica.carisma.3', { desconto: descontoNaLojaPct(a, b) }),
      ];
  }
}

/** Marco 28 (D-127): o nome do atributo para quem vê (o de classe leva o nome da classe). */
export function nomeDoAtributo(nome: NomeAtributo, classeId: string | undefined, curto = false): string {
  if (nome === 'dominio' && classeId) return t(`${curto ? 'atributoClasseCurto' : 'atributoClasse'}.${classeId}` as ChaveTexto);
  return t(`${curto ? 'atributoCurto' : 'atributo'}.${nome}` as ChaveTexto);
}

/** Marco 28 (D-127): o que o atributo de classe dá agora e os marcos (os alcançados marcados). */
function linhasDoDominio(ctx: ContextoSimulacao, j: Entidade): string[] {
  const classe = j.bolsa?.classeId ?? '';
  const regras = ctx.balance.dominio.classes[classe];
  if (!regras) return [];
  const fmt2 = (v: number) => v.toFixed(2).replace('.', ',');
  const skills = Math.round((fatorDeSkillDeClasse(ctx, j, ctx.conteudo.classes.get(classe)?.exclusivas[0] ?? '') - 1) * 100);
  const linhas = [t('dica.dominio.skills', { pct: skills })];
  for (const chave of Object.keys(regras.porPonto)) linhas.push(t('dica.dominio.porPonto', { efeito: t(`dominio.porPonto.${chave}` as ChaveTexto), fator: fmt2(fatorDeDominio(ctx, j, chave)) }));
  linhas.push(t('dica.dominio.semArma', { pct: ctx.balance.dominio.semFamiliaridadePct }), t('dica.dominio.marcos'));
  for (const m of marcosDaClasse(ctx, classe)) {
    const texto = t(`marco.${m.chave}` as ChaveTexto, { valor: m.valor, s: m.valor / 1000 });
    linhas.push(t('dica.dominio.marco', { em: m.em, texto, ativo: j.atributos.dominio >= m.em && marcoDe(ctx, j, m.chave) >= m.valor ? t('dica.dominio.ativo') : '' }));
  }
  return linhas;
}

export interface DicaAtributo {
  /** O botão "?" da linha (abre e fecha o cartão). */
  botao: (nome: NomeAtributo, linhas: () => string[], rotulo?: string) => HTMLButtonElement;
  fechar: () => void;
  destruir: () => void;
}

let proximoId = 1;

/** O cartão (um só por aba), preso logo abaixo do botão que o abriu. */
export function criarDicaAtributo(raiz: HTMLElement): DicaAtributo {
  const cartao = document.createElement('div');
  cartao.className = 'cartao-efeito dica-atributo';
  cartao.id = `dica-atributo-${proximoId++}`;
  cartao.setAttribute('role', 'tooltip');
  cartao.hidden = true;
  raiz.append(cartao);
  let aberto: HTMLButtonElement | null = null;

  const fechar = () => {
    cartao.hidden = true;
    aberto?.setAttribute('aria-expanded', 'false');
    aberto = null;
  };
  const aoTecla = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && aberto) {
      ev.stopPropagation();
      const b = aberto;
      fechar();
      b.focus();
    }
  };
  const aoTocarFora = (ev: PointerEvent) => {
    if (aberto && ev.target instanceof Node && !cartao.contains(ev.target) && !aberto.contains(ev.target)) fechar();
  };
  document.addEventListener('keydown', aoTecla, true);
  document.addEventListener('pointerdown', aoTocarFora, true);

  const abrir = (b: HTMLButtonElement, rotulo: string, linhas: string[]) => {
    cartao.textContent = '';
    const titulo = document.createElement('strong');
    titulo.textContent = rotulo;
    cartao.append(titulo);
    const ul = document.createElement('ul');
    for (const l of linhas) {
      const li = document.createElement('li');
      li.textContent = l;
      ul.append(li);
    }
    cartao.append(ul);
    cartao.hidden = false;
    const r = b.getBoundingClientRect();
    const base = raiz.getBoundingClientRect();
    cartao.style.left = `${Math.max(4, Math.min(r.left - base.left, base.width - cartao.offsetWidth - 4))}px`;
    cartao.style.top = `${r.bottom - base.top + 4 + raiz.scrollTop}px`;
    aberto?.setAttribute('aria-expanded', 'false');
    aberto = b;
    b.setAttribute('aria-expanded', 'true');
  };

  return {
    botao: (nome, linhas, rotulo = t(`atributo.${nome}` as ChaveTexto)) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'botao-dica';
      b.textContent = '?';
      b.dataset.chave = `dica-${nome}`;
      b.setAttribute('aria-label', t('dica.abrir', { atributo: rotulo }));
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-describedby', cartao.id);
      b.addEventListener('click', () => {
        if (aberto === b) fechar();
        else abrir(b, rotulo, linhas());
      });
      return b;
    },
    fechar,
    destruir: () => {
      document.removeEventListener('keydown', aoTecla, true);
      document.removeEventListener('pointerdown', aoTocarFora, true);
      cartao.remove();
    },
  };
}
