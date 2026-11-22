// O palco 3D dos personagens compartilhado entre as cenas (22/11/2026, D-202).

import { PalcoVivo } from './palco-vivo';

/**
 * 22/11/2026 (D-202): o palco 3D compartilhado entre as cenas. Criar um a cada cena (o contexto WebGL, o ambiente, a
 * leitura dos GLB e a compilação dos shaders) parava a troca de região por ~1,4 s no primeiro quadro. A cena reserva o
 * palco e o solta ao sair; sem uso, ele fica guardado para a próxima cena com a mesma resolução. Os atores ficam (o
 * personagem não recompila os materiais); quem não é pedido sai em 30 quadros, e outro modelo no mesmo id troca o ator.
 */
let compartilhado: { palco: PalcoVivo; chave: string; usos: number } | null = null;

export function reservarPalcoVivo(resolucao: number, intervaloMs: number): { palco: PalcoVivo; soltar: () => void } {
  const chave = `${String(resolucao)}|${String(intervaloMs)}`;
  const c = compartilhado;
  if (c && c.palco.ativo && c.chave === chave) {
    c.usos++;
    let solto = false;
    return { palco: c.palco, soltar: () => { if (!solto) { solto = true; c.usos--; } } };
  }
  const palco = new PalcoVivo(resolucao, undefined, intervaloMs);
  // Outro em uso (outra resolução numa cena ainda na tela): este fica só para a cena que pediu.
  if (c && c.usos > 0 && c.palco.ativo) return { palco, soltar: () => { palco.destruir(); } };
  c?.palco.destruir();
  const novo = { palco, chave, usos: 1 };
  compartilhado = novo;
  let solto = false;
  return { palco, soltar: () => { if (!solto) { solto = true; novo.usos--; } } };
}
