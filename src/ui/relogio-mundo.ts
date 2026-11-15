// O relógio do Mundo (marco 42, 15/11/2026, D-176): a fase do dia e quanto falta para a próxima, e um aviso quando a
// noite cai ou o dia nasce. A hora sai de mundo/ciclo.ts (a mesma conta do servidor).

import { horaDoMundo, type FaseDoDia, type RegrasDoCiclo } from '../mundo/ciclo';
import { t } from '../i18n';
import { agoraDoMundo } from './hora-do-mundo';

// Sem emoji (o teste sem-emoji): o ícone da fase é um ponto de cor no CSS (`data-fase`).

export function criarRelogioDoMundo(ciclo: RegrasDoCiclo, avisar: (texto: string) => void): { elemento: HTMLElement; destruir: () => void } {
  const el = document.createElement('div');
  el.className = 'relogio-mundo';
  el.setAttribute('role', 'timer');
  let anterior: FaseDoDia | null = null;
  const atualizar = () => {
    const agora = agoraDoMundo();
    const hora = horaDoMundo(agora, ciclo);
    const min = Math.max(1, Math.ceil((hora.fim - agora) / 60_000));
    el.textContent = `${t(`mundo.hora.${hora.fase}`)} · ${t('mundo.hora.falta', { min })}`;
    el.dataset.fase = hora.fase;
    if (anterior !== null && anterior !== hora.fase && (hora.fase === 'noite' || hora.fase === 'dia')) avisar(t(`mundo.hora.aviso.${hora.fase}`));
    anterior = hora.fase;
  };
  atualizar();
  const timer = setInterval(atualizar, 5000);
  return { elemento: el, destruir: () => { clearInterval(timer); } };
}
