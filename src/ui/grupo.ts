// Painel do grupo na campanha cooperativa (marco 15, 15/10/2026, D-061): o código para chamar mais gente, quem está
// jogando (o anfitrião marcado), a vida de cada aliado em barras pequenas e quantos vivos já estão na saída.
// "Jogador" aqui é quem é controlado por uma pessoa (`jogadorId`); não decide hostilidade (§2.5).

import type { EstadoJogo } from '../core/estado';
import type { Entidade } from '../entities/entidade';
import { t } from '../i18n';

const INTERVALO_MS = 250;

export interface PainelGrupo {
  elemento: HTMLElement;
  atualizar: (estado: EstadoJogo, idLocal: string, anfitriao: string | null, naSaida: (e: Entidade) => boolean, agoraMs: number) => void;
}

export function criarPainelGrupo(codigo: string): PainelGrupo {
  const painel = document.createElement('section');
  painel.className = 'painel-grupo';
  painel.setAttribute('aria-label', t('grupo.painelRotulo'));
  const titulo = document.createElement('h2');
  titulo.textContent = t('grupo.painel', { codigo });
  const lista = document.createElement('ul');
  const saida = document.createElement('p');
  saida.className = 'grupo-saida';
  saida.hidden = true;
  painel.append(titulo, lista, saida);
  let ultimo = -Infinity;
  let assinatura = '';

  return {
    elemento: painel,
    atualizar: (estado, idLocal, anfitriao, naSaida, agoraMs) => {
      if (agoraMs - ultimo < INTERVALO_MS) return;
      ultimo = agoraMs;
      const jogadores = estado.entidades.filter((e) => e.jogadorId !== '' && e.controlador !== 'ia').sort((a, b) => (a.id < b.id ? -1 : 1));
      const vivos = jogadores.filter((e) => !e.morto);
      const naPorta = vivos.filter(naSaida).length;
      saida.hidden = naPorta === 0;
      saida.textContent = t('grupo.naSaida', { n: naPorta, total: vivos.length });
      const nova = jogadores.map((e) => `${e.id}:${e.nome}:${e.hp}/${e.hpMax}:${String(e.morto)}:${String(e.id === anfitriao)}`).join('|');
      if (nova === assinatura) return;
      assinatura = nova;
      lista.textContent = '';
      for (const e of jogadores) {
        const item = document.createElement('li');
        item.className = 'membro-grupo';
        item.dataset.entidade = e.id;
        if (e.id === idLocal) item.classList.add('voce');
        const nome = document.createElement('span');
        nome.className = 'nome-membro';
        nome.textContent = e.id === anfitriao ? `${e.nome} (${t('grupo.anfitriao')})` : e.nome;
        const barra = document.createElement('span');
        barra.className = 'vida-membro';
        barra.setAttribute('role', 'meter');
        barra.setAttribute('aria-valuemin', '0');
        barra.setAttribute('aria-valuemax', String(e.hpMax));
        barra.setAttribute('aria-valuenow', String(Math.max(0, e.hp)));
        barra.setAttribute('aria-label', `${e.nome}: ${String(Math.max(0, e.hp))}/${String(e.hpMax)}`);
        const cheio = document.createElement('span');
        cheio.style.width = `${String(Math.round((100 * Math.max(0, e.hp)) / Math.max(1, e.hpMax)))}%`;
        barra.append(cheio);
        item.append(nome, barra);
        if (e.morto) item.append(` ${t('grupo.caido')}`);
        lista.append(item);
      }
    },
  };
}
