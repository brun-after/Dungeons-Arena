// A skin do personagem local (06/11/2026): a escolha das preferências para a classe dele vai pelo comando `skin` (só
// visual; na rede os outros jogadores veem pela aparência). Chamada quando o personagem entra na cena e quando as
// preferências mudam.

import type { Comando } from '../core/comandos';
import type { Entidade } from '../entities/entidade';
import { skinEscolhida } from '../entities/skins';
import type { Preferencias } from '../plataforma/preferencias';

export function sincronizarSkin(j: Entidade | undefined, p: Preferencias, emitir: (cmd: Comando) => void): void {
  const classe = j?.classeId ?? j?.bolsa?.classeId;
  if (!j || !classe) return;
  const id = skinEscolhida(p.skinsEscolhidas, classe);
  if ((j.skin ?? null) !== id) emitir({ t: 'skin', id });
}
