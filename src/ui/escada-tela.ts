// Marco 56 (27/11/2026, D-209): a descida (ou a subida) na tela ao entrar numa masmorra, trocar de andar ou sair. A
// cena de antes fica na tela enquanto a nova monta escondida (D-169); por cima dela, os degraus passam escurecendo,
// com o nome de para onde se vai. A nova aparece saindo do escuro (`chegada-escada`, no CSS).

import { t } from '../i18n';
import { lerLugar, type Lugar } from '../mundo/lugares';
import { estruturaDoDestino, type Reino } from '../mundo/reino';
import type { SentidoDaEscada } from '../render/escadas';

export interface DescidaNaTela {
  sentido: SentidoDaEscada;
  texto: string;
}

const interior = (l: Lugar | null): l is Extract<Lugar, { tipo: 'masmorra' | 'covil' }> => l?.tipo === 'masmorra' || l?.tipo === 'covil';
const dados = (l: Extract<Lugar, { tipo: 'masmorra' | 'covil' }>) => (l.tipo === 'masmorra' ? l.masmorra : l.covil);
const andarDe = (l: Extract<Lugar, { tipo: 'masmorra' | 'covil' }>) => (l.tipo === 'masmorra' ? (l.andar ?? 1) : 1);

/** O que a troca de `de` para `para` mostra: entrar, trocar de andar ou sair de um interior (null fora disso). */
export function descidaDaTroca(reino: Reino, de: string, para: string): DescidaNaTela | null {
  const a = lerLugar(reino, de);
  const b = lerLugar(reino, para);
  const alvo = interior(b) ? b : interior(a) ? a : null;
  if (!alvo) return null;
  const torre = estruturaDoDestino(reino, dados(alvo).id)?.estrutura.tipo === 'torre';
  const entrando: SentidoDaEscada = torre ? 'subir' : 'descer';
  const saindo: SentidoDaEscada = torre ? 'descer' : 'subir';
  const nome = dados(alvo).nome;
  if (interior(b) && !interior(a)) return { sentido: entrando, texto: t(entrando === 'descer' ? 'mundo.escada.descer' : 'mundo.escada.subir', { nome }) };
  if (interior(a) && !interior(b)) return { sentido: saindo, texto: t('mundo.escada.sair', { nome }) };
  if (!interior(a) || !interior(b)) return null;
  const numero = andarDe(b);
  const sentido = numero > andarDe(a) ? entrando : saindo;
  return { sentido, texto: t(sentido === 'descer' ? 'mundo.escada.descerAndar' : 'mundo.escada.subirAndar', { numero, nome }) };
}

/** Os degraus escurecendo por cima da cena que sai (somem com ela). */
export function mostrarDescida(camada: HTMLElement, d: DescidaNaTela): void {
  const el = document.createElement('div');
  el.className = 'descida-escada';
  el.dataset.sentido = d.sentido;
  el.setAttribute('role', 'status');
  const texto = document.createElement('span');
  texto.textContent = d.texto;
  el.append(texto);
  (camada.querySelector('.camada-ui') ?? camada).append(el);
}
