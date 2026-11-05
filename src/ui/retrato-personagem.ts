import { lerImagemToken } from '../plataforma/token';
import { conteudoOficial } from '../core/conteudo';
import { retratoIlustrado } from './retrato-ilustrado';
import type { Entidade } from '../entities/entidade';
import classes from '../data/classes.json';
import { NOMES_ATRIBUTOS } from '../progression/itens';
import { nomeDoAtributo } from './dica-atributo';

export function retratoPersonagem(classeId: string, personagem?: Pick<Entidade, 'aparencia'>): HTMLElement {
  const host = document.createElement('figure');
  host.className = 'retrato-personagem';
  host.setAttribute('aria-label', 'Aparência do personagem');
  host.textContent = 'Preparando personagem…';
  const modelo = classes.classes.find(c => c.id === classeId)?.modelo ?? 'aventureiro';
  void (async () => {
    const token = await lerImagemToken();
    if (token) {
      const imagem = new Image();
      imagem.alt = 'Aparência personalizada';
      const url = URL.createObjectURL(token);
      try { imagem.src = url; await imagem.decode(); host.replaceChildren(imagem); host.dataset.pronto = '1'; }
      finally { URL.revokeObjectURL(url); }
      return;
    }
    // 05/11/2026: a ilustração marca o retrato pronto; o 3D troca o canvas depois e marca data-vivo.
    await retratoIlustrado(modelo, personagem?.aparencia ?? null, (canvas, vivo) => {
      canvas.className = 'retrato-classe retrato-ilustrado';
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Aparência de ${classeId}`);
      host.replaceChildren(canvas);
      host.dataset.pronto = '1';
      if (vivo) host.dataset.vivo = '1';
    });
  })().catch(() => { host.textContent = 'Prévia indisponível'; });
  return host;
}

export type DadosResumoPersonagem = Pick<Entidade, 'nivel' | 'hpMax' | 'defesa' | 'habilidades'> &
  Partial<Pick<Entidade, 'atributos' | 'manaMax' | 'xp'>>;

export function resumoPersonagem(classeId: string, personagem?: DadosResumoPersonagem): HTMLElement {
  const bloco = document.createElement('div');
  bloco.className = 'resumo-personagem';
  const conteudo = conteudoOficial();
  const classe = conteudo.classes.get(classeId);
  const titulo = document.createElement('h3');
  titulo.textContent = `${classe?.nome ?? classeId} · nível ${personagem?.nivel ?? 1}`;
  bloco.append(titulo);
  function metricas(titulo: string, valores: [string, number][]): void {
    const h = document.createElement('h4');
    h.textContent = titulo;
    const lista = document.createElement('dl');
    lista.className = 'metricas-personagem';
    for (const [nome, valor] of valores) {
      const celula = document.createElement('div');
      const termo = document.createElement('dt');
      termo.textContent = nome;
      const dado = document.createElement('dd');
      dado.textContent = valor.toLocaleString('pt-BR');
      celula.append(termo, dado);
      lista.append(celula);
    }
    bloco.append(h, lista);
  }
  const stats: [string, number][] = [['Vida máxima', personagem?.hpMax ?? classe?.hpBase ?? 0], ['Defesa', personagem?.defesa ?? classe?.defesa ?? 0]];
  if (personagem?.manaMax !== undefined) stats.push(['Recurso máximo', personagem.manaMax]);
  if (personagem?.xp !== undefined) stats.push(['XP', personagem.xp]);
  metricas('Estatísticas', stats);
  const atributos = personagem?.atributos ?? (!personagem ? classe?.atributos : undefined);
  if (atributos) metricas('Atributos', NOMES_ATRIBUTOS.map(id => [nomeDoAtributo(id, classeId), atributos[id]]));
  const h = document.createElement('h4');
  h.textContent = 'Habilidades habilitadas';
  const lista = document.createElement('ul');
  lista.className = 'skills-personagem';
  for (const id of personagem?.habilidades ?? classe?.habilidades ?? []) {
    const item = document.createElement('li');
    item.textContent = conteudo.habilidades.get(id)?.nome ?? id.replaceAll('_', ' ');
    lista.append(item);
  }
  if (!lista.childElementCount) {
    const item = document.createElement('li');
    item.textContent = 'Nenhuma habilidade habilitada';
    lista.append(item);
  }
  bloco.append(h, lista);
  return bloco;
}

export function painelPersonagem(classeId: string, personagem?: DadosResumoPersonagem & Pick<Entidade, 'aparencia'>): HTMLElement {
  const painel = document.createElement('div');
  painel.className = 'painel-personagem';
  painel.append(retratoPersonagem(classeId, personagem), resumoPersonagem(classeId, personagem));
  return painel;
}
