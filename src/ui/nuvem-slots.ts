// A nuvem na tela de slots (marco 17, 15/10/2026, D-063): entrar com Google, e em cada slot "Enviar para a nuvem" e
// "Baixar da nuvem", com o nível e a data dos dois lados. Só aparece com a nuvem configurada no build. A lista vem de
// uma leitura por aba (plataforma/nuvem.ts); nada aqui segura a tela se a rede falhar.

import { t } from '../i18n';
import { certificarSlot } from '../plataforma/certificacao';
import { nuvemDoBuild } from '../plataforma/nuvem';
import { carregarSlot, gravarRegistro } from '../plataforma/saves';
import { enderecoDoServidor } from '../plataforma/servidor';

export interface OpcoesNuvemSlots {
  /** O bloco da conta entra logo depois deste elemento (o título). */
  depoisDe: HTMLElement;
  cartoes: ReadonlyMap<number, HTMLElement>;
  /** Slots com save local (só eles podem ser enviados; baixar por cima pede confirmação). */
  locais: ReadonlySet<number>;
  status: HTMLElement;
  recarregar: () => void;
}

const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function botao(texto: string, aoClicar: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'botao-cabecalho';
  b.textContent = texto;
  b.addEventListener('click', aoClicar);
  return b;
}

function paragrafo(classe: string, texto: string): HTMLParagraphElement {
  const p = document.createElement('p');
  p.className = classe;
  p.textContent = texto;
  return p;
}

export async function ligarNuvemNosSlots(o: OpcoesNuvemSlots): Promise<void> {
  const nuvem = nuvemDoBuild();
  if (!nuvem) return;
  const bloco = document.createElement('section');
  bloco.className = 'bloco-nuvem';
  bloco.setAttribute('aria-label', t('nuvem.rotulo'));
  o.depoisDe.after(bloco);
  const usuario = await nuvem.usuario().catch(() => null);
  if (!usuario) {
    bloco.append(
      paragrafo('detalhe-slot', t('nuvem.convite')),
      botao(t('nuvem.entrar'), () => {
        void nuvem.entrar().catch(() => {
          o.status.textContent = t('nuvem.falhaEntrar');
        });
      }),
    );
    return;
  }
  bloco.append(
    paragrafo('detalhe-slot', t('nuvem.conectado', { nome: usuario.nome })),
    botao(t('nuvem.sair'), () => {
      void nuvem.sair().finally(o.recarregar);
    }),
  );
  const lista = await nuvem.listar().catch(() => null);
  if (!lista) {
    o.status.textContent = t('nuvem.falhaLer');
    return;
  }
  for (const [slot, cartao] of o.cartoes) {
    const daNuvem = lista.find((s) => s.slot === slot);
    const linha = document.createElement('div');
    linha.className = 'nuvem-slot';
    linha.append(
      paragrafo(
        'detalhe-slot',
        daNuvem ? t('nuvem.noSlot', { nivel: daNuvem.nivel, fase: daNuvem.nomeFase, data: dataHora.format(daNuvem.atualizadoEm) }) : t('nuvem.vazio'),
      ),
    );
    if (o.locais.has(slot)) {
      const enviar = botao(t('nuvem.enviar'), () => {
        enviar.disabled = true;
        void (async () => {
          // O certificado vai junto quando dá (sem servidor ou sem rede, vai o que estiver no slot).
          const servidor = enderecoDoServidor();
          if (servidor) await certificarSlot(servidor, slot).catch(() => null);
          const r = await carregarSlot(slot);
          if (!r || r === 'invalido') throw new Error('slot');
          await nuvem.enviar(r);
          o.recarregar();
        })().catch(() => {
          o.status.textContent = t('nuvem.falhaEnviar');
          enviar.disabled = false;
        });
      });
      linha.append(enviar);
    }
    if (daNuvem) {
      // Baixar por cima de um save local pede um segundo toque (o local é substituído).
      let confirmando = !o.locais.has(slot);
      const baixar = botao(t('nuvem.baixar'), () => {
        if (!confirmando) {
          confirmando = true;
          baixar.textContent = t('nuvem.confirmarBaixar');
          baixar.classList.add('perigo');
          return;
        }
        baixar.disabled = true;
        void (async () => {
          const r = await nuvem.baixar(slot);
          if (!r) throw new Error('vazio');
          await gravarRegistro({ ...r, slot });
          o.recarregar();
        })().catch(() => {
          o.status.textContent = t('nuvem.falhaBaixar');
          baixar.disabled = false;
        });
      });
      linha.append(baixar);
    }
    cartao.append(linha);
  }
}
