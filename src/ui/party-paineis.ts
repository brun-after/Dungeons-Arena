// 02/11/2026: um renderer local; câmeras de outras salas isoladas em observadores sem comandos.
import type { Palco } from '../render/stage';
import type { Camera } from '../render/camera';
import type { VisaoExternaParty } from '../mundo/avisos';
export function criarPaineisParty(host: HTMLElement, palco: Palco, camera: Camera) {
    const paineis: HTMLCanvasElement[] = [], remotos = new Map<string, HTMLIFrameElement>();
    const ultimas = new Map<string, VisaoExternaParty>();
    let colunas = 1, largura = 1, altura = 1, total = 0;
    const ajustar = (quantos: number, locais = quantos) => {
        document.body.dataset.partyVisao = '1';
        total = quantos;
        palco.canvas.classList.add('camera-party');
        colunas = quantos === 1 ? 1 : quantos <= 4 ? 2 : 3;
        largura = Math.floor(host.clientWidth / colunas);
        altura = Math.floor(host.clientHeight / Math.ceil(quantos / colunas));
        if (palco.largura() !== largura || palco.altura() !== altura)
            palco.app.renderer.resize(largura, altura);
        palco.canvas.style.width = `${largura}px`;
        palco.canvas.style.height = `${altura}px`;
        camera.definirVista({ largura, altura });
        document.body.style.setProperty('--party-pane-largura', `${largura}px`);
        document.body.style.setProperty('--party-pane-altura', `${altura}px`);
        // A câmera local usa o canvas WebGL diretamente, sem leitura GPU -> canvas 2D a cada quadro.
        while (locais > 1 && paineis.length < locais) {
            const c = document.createElement('canvas');
            host.append(c);
            paineis.push(c);
            c.className = 'camera-party';
        }
        paineis.forEach((c, i) => { c.style.display = i > 0 && i < locais ? 'block' : 'none'; if (i === 0 || i >= locais)
            return; if(c.width !== palco.canvas.width)c.width = palco.canvas.width; if(c.height !== palco.canvas.height)c.height = palco.canvas.height; posicionar(c, i); });
    };
    const posicionar = (e: HTMLElement, i: number) => { Object.assign(e.style, { position: 'absolute', pointerEvents: 'none', left: `${i % colunas * largura}px`, top: `${Math.floor(i / colunas) * altura}px`, width: `${largura}px`, height: `${altura}px`, border: '1px solid #65616b' }); };
    const externas = (visoes: readonly VisaoExternaParty[], inicio: number) => {
        const usadas = new Set<string>();
        visoes.forEach((v, i) => {
            const chave = `${v.lugar}:${v.idLocal}`;
            usadas.add(chave);
            let frame = remotos.get(chave);
            if (!frame) {
                frame = document.createElement('iframe');
                frame.addEventListener('load', () => { const atual = ultimas.get(chave); if (atual) frame?.contentWindow?.postMessage({ ...atual, tipo: 'camera-party' }, location.origin); });
                frame.src = './?party-observador=1';
                frame.tabIndex = -1;
                frame.allow = "autoplay 'none'";
                frame.title = v.lugar;
                host.append(frame);
                remotos.set(chave, frame);
            }
            posicionar(frame, inicio + i);
            if (ultimas.get(chave) !== v) frame.contentWindow?.postMessage({ ...v, tipo: 'camera-party' }, location.origin);
            ultimas.set(chave, v);
        });
        for (const [id, frame] of remotos)
            if (!usadas.has(id)) {
                frame.remove();
                remotos.delete(id); ultimas.delete(id);
            }
    };
    const copiar = (i: number, nomes: string) => { if (i === 0) { palco.canvas.setAttribute('aria-label', nomes); return; } if (total === 1)
        return; const c = paineis[i], g = c?.getContext('2d'); if (!c || !g)
        return; g.drawImage(palco.canvas, 0, 0); const dpr = c.width / largura; g.fillStyle = '#10151ccc'; g.fillRect(0, 0, c.width, 24*dpr); g.fillStyle = '#ffffff'; g.font = `${14*dpr}px sans-serif`; g.fillText(nomes, 8*dpr, 17*dpr); c.setAttribute('aria-label', nomes); };
    const limpar = () => { palco.canvas.classList.remove('camera-party'); delete document.body.dataset.partyVisao; paineis.forEach(c => { c.style.display = 'none'; }); externas([], 0); };
    return { ajustar, externas, copiar, limpar };
}
