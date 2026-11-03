import { lerImagemToken } from '../plataforma/token';
import { conteudoOficial } from '../core/conteudo';
import { retrato3d } from '../render/retrato';
import type { Entidade } from '../entities/entidade';
import classes from '../data/classes.json';
import { t, type ChaveTexto } from '../i18n';

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
    const retrato = retrato3d(modelo, personagem?.aparencia ?? null);
    if (!retrato || !await retrato.pronto) throw new Error('retrato indisponível');
    retrato.canvas.className = 'retrato-classe retrato-3d';
    retrato.canvas.setAttribute('role', 'img');
    retrato.canvas.setAttribute('aria-label', `Aparência de ${classeId}`);
    host.replaceChildren(retrato.canvas);
    host.dataset.pronto = '1';
  })().catch(() => { host.textContent = 'Prévia indisponível'; });
  return host;
}

export function resumoPersonagem(classeId: string, personagem?: Pick<Entidade, 'nivel' | 'hpMax' | 'defesa' | 'habilidades'>): HTMLElement {
  const bloco = document.createElement('div');
  bloco.className = 'resumo-personagem';
  const c = conteudoOficial().classes.get(classeId);
  const titulo = document.createElement('h3');
  titulo.textContent = `${c?.nome ?? classeId} · nível ${personagem?.nivel ?? 1}`;
  const ficha = document.createElement('p');
  ficha.textContent = `Vida ${personagem?.hpMax ?? c?.hpBase ?? '—'} · Defesa ${personagem?.defesa ?? c?.defesa ?? '—'}`;
  const descricao = document.createElement('p');
  descricao.textContent = c ? t(c.descricao as ChaveTexto) : '';
  const skills = document.createElement('p');
  skills.textContent = `Habilidades: ${(personagem?.habilidades ?? c?.habilidades ?? []).map(id => conteudoOficial().habilidades.get(id)?.nome ?? id.replaceAll('_', ' ')).join(' · ')}`;
  bloco.append(titulo, ficha, descricao, skills);
  return bloco;
}
