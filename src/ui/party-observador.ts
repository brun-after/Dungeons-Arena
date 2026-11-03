// 02/11/2026: câmera somente de leitura em outra região/dungeon, sem rede ou comandos próprios.
import type { VisaoExternaParty } from '../mundo/avisos';
import { conteudoOficial, modoPorId } from '../core/conteudo';
import { reinoDoConteudo } from '../mundo/reino';
import { lerLugar, montarLugar } from '../mundo/lugares';
import { montarCena, type Cena } from './cena';
export function iniciarObservador(raiz: HTMLElement): void {
    const c = conteudoOficial(), reino = reinoDoConteudo(c);
    let recebido = 0;
    const posicoes = new Map<string, {
        x: number;
        y: number;
    }>();
    const anteriores = new Map<string, {
        x: number;
        y: number;
    }>();
    let atual: VisaoExternaParty | null = null, cena: Cena | null = null, montando = false;
    const estilo = document.createElement('style');
    estilo.textContent = '.camada-ui{display:none!important}';
    document.head.append(estilo);
    const rotulo = document.createElement('div');
    rotulo.className = 'rotulo-party-remoto';
    Object.assign(rotulo.style,{position:'fixed',left:'0',top:'0',padding:'4px 8px',background:'#10151ccc',color:'#ffffff',font:'14px sans-serif',pointerEvents:'none',zIndex:'100'});
    document.body.append(rotulo);
    addEventListener('message', (ev: MessageEvent<VisaoExternaParty & {
        tipo?: string;
    }>) => {
        if (ev.origin !== location.origin || ev.source !== parent || ev.data.tipo !== 'camera-party')
            return;
        anteriores.clear();
        for (const [id, p] of posicoes)
            anteriores.set(id, p);
        posicoes.clear();
        recebido = performance.now();
        atual = ev.data;
        rotulo.textContent = atual.estado.entidades.find(e=>e.id===atual?.idLocal)?.nome ?? '';
    });
    const quadro = async (agora: number) => {
        if (atual && !cena && !montando) {
            montando = true;
            const lugar = lerLugar(reino, atual.lugar);
            if (lugar)
                cena = await montarCena({ raiz, ctx: montarLugar(c, reino, lugar, modoPorId(c, 'mundo')).ctx, idLocal: atual.idLocal, estado: () => { if (!atual)
                        throw new Error('visão ausente'); return atual.estado; }, emitir: () => { }, pausaOJogo: false, nuvemDescobertas: false, partyMundo: true, partyVisaoForcada: true });
        }
        if (cena && atual)
            cena.quadro({ agoraMs: agora, alpha: 0, posicao: e => { const a = anteriores.get(e.id), f = Math.min(1, (agora - recebido) / 200); const p = a ? { x: a.x + (e.px - a.x) * f, y: a.y + (e.py - a.y) * f } : { x: e.px, y: e.py }; posicoes.set(e.id, p); return p; } });
        requestAnimationFrame(t => { void quadro(t); });
    };
    document.body.dataset.partyObservador = 'pronto';
    requestAnimationFrame(t => { void quadro(t); });
}
