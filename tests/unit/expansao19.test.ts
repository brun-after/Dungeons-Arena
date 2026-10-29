import { resolverHabilidade } from '../../src/combat/compilar-habilidade';
import { invocar } from '../../src/combat/efeitos-fluxo';
// Marco 19 (17/10/2026): sequências completas com efeitos reais, obstáculos, falhas e persistência.
import { describe, expect, it } from 'vitest';
import { CONTEUDO, contexto, faseDeTexto, SALA_ABERTA } from '../apoio/fases';
import { criarJogador, criarInimigo } from '../../src/entities/fabrica';
import { criarEstado, clonarEstado } from '../../src/core/estado';
import type { EventoSimulacao } from '../../src/core/eventos-simulacao';
import { prepararSequencia, processarPantanos } from '../../src/combat/sequencias';
import { aplicarImpacto } from '../../src/combat/golpe';
import { aplicarEfeito, REGISTRO_EFEITOS } from '../../src/combat/efeitos';
import { construirEfeito, ehTipoEfeito } from '../../src/combat/registro-efeitos';
import { defenderGolpe, muralhaEm, processarCampos } from '../../src/combat/tatica';
import { celulaLivre } from '../../src/world/movimento';
import { avancar, reposicionar } from '../../src/combat/efeitos-instantaneos';
import { VISUAIS_COMBO } from '../../src/render/combos-taticos';
import { GeradorDePatches, aplicarPatch } from '../../src/arena/patches';
import { digest } from '../../src/core/digest';
import { iniciarAcao, processarAcoes } from '../../src/combat/acao';
import { moverProjeteis } from '../../src/combat/projeteis';
import type { Entidade } from '../../src/entities/entidade';
function cena() {
    const ctx = contexto(faseDeTexto(SALA_ABERTA));
    const estado = criarEstado({ faseId: 'teste', semente: 9 });
    const classe = obter(CONTEUDO.classes.get('aventureiro'));
    const j = criarJogador(classe, 'j', 3, 5, ctx.balance);
    const a = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'a', 5, 5, ctx.balance);
    a.hp = a.hpMax = 10000;
    a.ia = null;
    j.hp = j.hpMax = 1000;
    j.mana = j.manaMax = 1000;
    j.autoAtaque = false;
    j.habilidades = [...CONTEUDO.habilidades.keys()];
    estado.entidades.push(j, a);
    const eventos: EventoSimulacao[] = [];
    let acao = 100;
    function usar(id: string, alvo: Entidade = a, mira = { x: alvo.x, y: alvo.y }) {
        const base = obter(CONTEUDO.habilidades.get(id));
        const h = prepararSequencia(estado, ctx, j, base, acao++, alvo, mira);
        const proprio = h.politicaImpacto === 'proprio';
        // Marco 26 (D-125): o avanço de quem conjura sai no lançamento, como em acao.ts.
        for (const ef of h.efeitos) if (ef.em === 'conjurador' && REGISTRO_EFEITOS[ef.tipo].deslocaConjurador) aplicarEfeito(estado, ctx, j, ef, { id: j.id, x: j.x, y: j.y, acaoId: acao - 1 }, mira, eventos);
        aplicarImpacto(estado, ctx, proprio ? j : alvo, { acaoId: acao - 1, hab: h, fonte: { id: j.id, equipe: j.equipe, bonusAtributo: 0, carisma: 10, multRolagem: 1, potencia: 1, multDano: 1, multCura: 1, d20Minimo: 20 }, indice: 0, mira }, eventos);
        estado.tick++;
        return h;
    }
    return { ctx, estado, j, a, eventos, usar };
}
const ids = [...CONTEUDO.combos.keys()];
describe('35 combos de resultados confirmados', () => {
    it.each(ids)('%s pode ser concluído com a sequência e preparação reais', (id) => {
        const c = cena();
        const combo = obter(CONTEUDO.combos.get(id));
        if (id === 'tributo_da_legiao') {
            c.j.hp -= 30;
            invocar(c.estado, c.ctx, c.j, construirEfeito('invocar', { ref: 'servo_ossuario', valor: 1, duracaoMs: 25000 }), c.eventos);
        }
        // Marco 24 (24/10/2026): as condições de estado no alvo (`alvo:<estado>` e as antigas atordoado, envenenado…) são
        // preparadas antes do último passo, como faria a luta de verdade.
        const ESTADO_DA_CONDICAO: Record<string, string> = { atordoado: 'atordoar', envenenado: 'envenenado', sangrando: 'sangrando', consagrado: 'consagrado', enraizado: 'enraizado', definhando: 'definhando' };
        const ultimo = combo.sequencia.at(-1);
        // O passo `@ultimate` usa uma ultimate do par da skill anterior.
        const comUltimate = combo.sequencia.map((s, i) => s !== '@ultimate' ? s : obter([...CONTEUDO.ultimates.values()].find((u) => u.par.includes(combo.sequencia[i - 1] ?? ''))).id);
        for (const skill of comUltimate) {
            if (skill === comUltimate.at(-1) && ultimo) {
                for (const cond of combo.condicoes) {
                    const tipo = cond.startsWith('alvo:') ? cond.slice(5) : ESTADO_DA_CONDICAO[cond];
                    if (tipo && ehTipoEfeito(tipo)) aplicarEfeito(c.estado, c.ctx, c.a, construirEfeito(tipo, { duracaoMs: 5000 }), c.j, null, c.eventos);
                }
            }
            if (skill === 'curar' || skill === 'purificacao')
                c.j.hp = Math.min(c.j.hp, c.j.hpMax - 30);
            if (skill === 'purificacao')
                aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('envenenado'), c.a, null, c.eventos);
            const aliado = ['barreira', 'curar', 'purificacao', 'brado', 'postura_de_aparo', 'veu_da_noite'].includes(skill);
            const mira = skill === 'muralha_de_pedra' ? { x: 6, y: 5 } : skill === 'circulo_de_amparo' ? { x: 4, y: 5 } : skill === 'passo_sombrio' ? { x: 3, y: 4 } : { x: c.a.x, y: c.a.y };
            let alvo = aliado ? c.j : c.a;
            if (id === 'resgate_sombras' && skill === 'curar') {
                alvo = criarJogador(obter(CONTEUDO.classes.get('aventureiro')), 'aliado', 3, 6, c.ctx.balance);
                alvo.hp = 1;
                c.estado.entidades.push(alvo);
            }
            c.usar(skill, alvo, mira);
            if (skill === 'postura_de_aparo')
                defenderGolpe(c.estado, c.ctx, c.j, c.a, true);
            if (skill === 'veu_da_noite') {
                let sucesso = false;
                for (let i = 0; i < 100 && !sucesso; i++)
                    sucesso = defenderGolpe(c.estado, c.ctx, c.j, c.a, true).esquivou;
                expect(sucesso).toBe(true);
            }
        }
        expect(c.eventos.filter((e) => e.t === 'comboFeito' && e.combo === id), JSON.stringify(c.j.tatica)).toHaveLength(1);
    });
    it('não premia falha, alvo diferente, ordem invertida, interrupção nem janela expirada', () => {
        for (const caso of ['falha', 'alvo', 'ordem', 'interrompe', 'tempo']) {
            const c = cena();
            if (caso === 'ordem') {
                c.usar('flecha_perfurante');
                c.usar('seta_arcana');
            }
            else {
                if (caso === 'falha')
                    aplicarEfeito(c.estado, c.ctx, c.a, construirEfeito('imune_dano'), c.a, null, c.eventos);
                c.usar('seta_arcana');
                if (caso === 'falha')
                    c.a.efeitos = [];
                if (caso === 'interrompe')
                    c.usar('curar', c.j);
                if (caso === 'tempo')
                    c.estado.tick += 1000;
                if (caso === 'alvo') {
                    const b = criarInimigo(obter(CONTEUDO.presets.get('boneco')), 'b', 5, 6, c.ctx.balance);
                    c.estado.entidades.push(b);
                    c.usar('flecha_perfurante', b);
                }
                else
                    c.usar('flecha_perfurante');
            }
            expect(c.eventos.some((e) => e.t === 'comboFeito' && e.combo === 'disparo_encantado')).toBe(false);
        }
    });
});
describe('skills táticas', () => {
    it('muralha bloqueia andar, avanço e projétil, expira e não fecha corredor', () => {
        const c = cena();
        c.usar('muralha_de_pedra', c.a, { x: 6, y: 5 });
        expect(muralhaEm(c.estado, 6, 5)).toBeDefined();
        expect(celulaLivre(c.j, 6, 5, c.estado, c.ctx)).toBe(false);
        reposicionar(c.j, 5, 5);
        reposicionar(c.a, 8, 5);
        expect(avancar(c.estado, c.ctx, c.j, { x: 8, y: 5 }, 3)).toBe(false);
        c.j.habilidades = ['seta_arcana'];
        expect(iniciarAcao(c.estado, c.ctx, c.j, 'seta_arcana', c.a.id, c.eventos)).toBe(true);
        c.estado.tick += 50;
        processarAcoes(c.estado, c.ctx, c.eventos);
        moverProjeteis(c.estado, c.ctx, c.eventos, 1000);
        expect(c.a.hp).toBe(10000);
        c.estado.tick += 1000;
        processarCampos(c.estado, c.ctx, c.eventos);
        expect(muralhaEm(c.estado, 6, 5)).toBeUndefined();
        const estreito = contexto(faseDeTexto(['########', '#......#', '########']));
        reposicionar(c.j, 1, 1);
        reposicionar(c.a, 6, 1);
        c.estado.camposTaticos = [];
        aplicarEfeito(c.estado, estreito, c.j, construirEfeito('muralha_pedra'), c.j, { x: 3, y: 1 }, c.eventos);
        expect(c.estado.camposTaticos).toHaveLength(0);
    });
    it('purificação precisa remover um efeito; não remove imunidade nem controles não removíveis', () => {
        const c = cena();
        c.usar('circulo_de_amparo', c.j, { x: 3, y: 5 });
        aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('imune_dano'), c.j, null, c.eventos);
        c.usar('purificacao', c.j);
        expect(c.eventos.some((e) => e.t === 'comboFeito')).toBe(false);
        expect(c.j.efeitos.some((e) => e.tipo === 'imune_dano')).toBe(true);
    });
    it('a névoa mantém o pântano após outras ações; sair dela encerra a renovação', () => {
        const c = cena();
        c.usar('estaca_de_pedra');
        c.usar('nevoa_venenosa');
        c.usar('curar', c.j);
        c.usar('curar', c.j);
        processarPantanos(c.estado, c.ctx, c.eventos);
        expect(c.a.efeitos.some((e) => e.tipo === 'atolado')).toBe(true);
        const ate = obter(c.a.efeitos.find((e) => e.tipo === 'atolado')).ateTick;
        reposicionar(c.a, 9, 9);
        c.estado.tick += 100;
        processarPantanos(c.estado, c.ctx, c.eventos);
        expect(obter(c.a.efeitos.find((e) => e.tipo === 'atolado')).ateTick).toBe(ate);
    });
    it('clone e patches preservam campos e memória sem compartilhar as listas', () => {
        const c = cena();
        c.usar('muralha_de_pedra', c.a, { x: 6, y: 5 });
        const clone = clonarEstado(c.estado);
        expect(digest(clone)).toBe(digest(c.estado));
        obter(obter(clone.camposTaticos)[0]).ateTick++;
        expect(digest(clone)).not.toBe(digest(c.estado));
        const g = new GeradorDePatches();
        g.gerar(c.estado);
        const antes = clonarEstado(c.estado);
        c.estado.tick++;
        c.estado.camposTaticos = [];
        expect(aplicarPatch(antes, g.gerar(c.estado)).camposTaticos).toEqual([]);
    });
    it('os 35 visuais diferem em geometria e movimento, mesmo ignorando as cores', () => {
        expect(VISUAIS_COMBO.size).toBe(CONTEUDO.combos.size);
        const assinaturas = [...VISUAIS_COMBO.values()].map((v) => JSON.stringify([v.formas, v.movimento]));
        expect(new Set(assinaturas).size).toBe(CONTEUDO.combos.size);
    });
});
describe('passivas e limites da expansão', () => {
    it('Tenacidade reduz controle mas respeita o teto e a imunidade não é concedida', () => {
        const c = cena();
        obter(c.j.bolsa).conhecidas.push({ id: 'tenacidade', rank: 5, caminhos: [] });
        obter(c.j.bolsa).passivasAtivas = ['tenacidade'];
        aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('atordoar', { duracaoMs: 1000 }), c.a, c.j, c.eventos);
        const f = obter(c.j.efeitos.find((e) => e.tipo === 'atordoar'));
        expect(f.ateTick).toBeLessThan(60);
        expect(f.ateTick).toBeGreaterThanOrEqual(36);
    });
    it('Fluxo restaurador não premia sobrecura, tem intervalo e limita o escudo', () => {
        const c = cena();
        obter(c.j.bolsa).conhecidas.push({ id: 'fluxo_restaurador', rank: 1, caminhos: [] });
        obter(c.j.bolsa).passivasAtivas = ['fluxo_restaurador'];
        // Marco 24 (D-095): sem gerais de tecla (a sintonia do suporte do Aventureiro reforçaria o escudo).
        obter(c.j.bolsa).barra.fill(null, 2);
        aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('cura', { valor: 100 }), c.j, c.j, c.eventos);
        expect(c.j.efeitos.some((e) => e.tipo === 'escudo')).toBe(false);
        c.j.hp -= 100;
        aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('cura', { valor: 100 }), c.j, c.j, c.eventos);
        expect(c.j.efeitos.find((e) => e.tipo === 'escudo')?.valor).toBe(8);
        c.j.efeitos = [];
        c.j.hp -= 100;
        aplicarEfeito(c.estado, c.ctx, c.j, construirEfeito('cura', { valor: 100 }), c.j, c.j, c.eventos);
        expect(c.j.efeitos.some((e) => e.tipo === 'escudo')).toBe(false);
    });
    it('aparar não evita magia nem dano periódico; resposta é consumida uma vez', () => {
        const c = cena();
        c.usar('postura_de_aparo', c.j);
        expect(defenderGolpe(c.estado, c.ctx, c.j, c.a, false).fator).toBe(1);
        expect(defenderGolpe(c.estado, c.ctx, c.j, c.a, true).fator).toBeLessThan(1);
        expect(c.j.efeitos.some((e) => e.tipo === 'resposta_aparo')).toBe(true);
        c.usar('corte_dilacerante');
        expect(c.j.efeitos.some((e) => e.tipo === 'resposta_aparo')).toBe(false);
        expect(c.j.tatica?.respostaConsumida).toBe(true);
    });
    it('falhar a purificação e o aparo não libera os combos condicionais', () => {
        for (const seq of [['postura_de_aparo', 'corte_dilacerante'], ['veu_da_noite', 'corte_dilacerante']]) {
            const c = cena();
            for (const id of seq)
                c.usar(id);
            expect(c.eventos.some((e) => e.t === 'comboFeito')).toBe(false);
        }
    });
});

function obter<T>(valor: T | undefined | null): T {
  if (valor === undefined || valor === null) throw new Error("Dado obrigatório ausente no cenário");
  return valor;
}

describe('presença de campos nos patches', () => {
    it('distingue campo ausente, lista vazia, criação e remoção', () => {
        const c = cena(); const g = new GeradorDePatches();
        let cliente = clonarEstado(c.estado); g.gerar(c.estado);
        c.estado.camposTaticos = []; c.estado.tick++;
        cliente = aplicarPatch(cliente, g.gerar(c.estado));
        expect(digest(cliente)).toBe(digest(c.estado));
        c.usar('muralha_de_pedra', c.a, { x: 6, y: 5 });
        cliente = aplicarPatch(cliente, g.gerar(c.estado));
        expect(digest(cliente)).toBe(digest(c.estado));
        c.estado.camposTaticos = []; c.estado.tick++;
        cliente = aplicarPatch(cliente, g.gerar(c.estado));
        expect(digest(cliente)).toBe(digest(c.estado));
        delete c.estado.camposTaticos; c.estado.tick++;
        cliente = aplicarPatch(cliente, g.gerar(c.estado));
        expect(digest(cliente)).toBe(digest(c.estado));
    });
});


describe('evoluções úteis das skills novas', () => {
    it('ranks aumentam a cura e o veneno dos campos, e o passo usa o alcance compilado', () => {
        const c = cena();
        const base = obter(resolverHabilidade(c.ctx, 'circulo_de_amparo'));
        const forte = obter(resolverHabilidade(c.ctx, 'circulo_de_amparo@5/eficiente,longo_alcance'));
        expect(obter(forte.efeitos.find((e) => e.tipo === 'campo_cura')).valor).toBeGreaterThan(obter(base.efeitos.find((e) => e.tipo === 'campo_cura')).valor);
        const passo = obter(resolverHabilidade(c.ctx, 'passo_sombrio@5/eficiente,passo_longo'));
        expect(passo.alcanceCelulas).toBe(7);
        expect(passo.efeitos.some((e) => e.tipo === 'passo_sombrio' && e.valor === 7)).toBe(true);
    });
});


describe('avisos de zonas persistentes', () => {
    it('renova a lentidão sem repetir avisos em todo tick', () => {
        const c = cena(); c.usar('estaca_de_pedra'); c.usar('nevoa_venenosa');
        processarPantanos(c.estado, c.ctx, c.eventos);
        const antes = c.eventos.filter((e) => e.t === 'efeitoAplicado' && e.tipo === 'atolado').length;
        const ate = obter(c.a.efeitos.find((e) => e.tipo === 'atolado')).ateTick;
        for (let i = 0; i < 10; i++) { c.estado.tick++; processarPantanos(c.estado, c.ctx, c.eventos); }
        expect(c.eventos.filter((e) => e.t === 'efeitoAplicado' && e.tipo === 'atolado')).toHaveLength(antes);
        expect(obter(c.a.efeitos.find((e) => e.tipo === 'atolado')).ateTick).toBeGreaterThan(ate);
    });
});
