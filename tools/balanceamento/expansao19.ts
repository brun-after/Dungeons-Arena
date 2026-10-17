// Marco 19 (17/10/2026): amostra reproduzível de quatro builds novas; mede combate real, não promete jogo ótimo.
import { writeFileSync } from 'node:fs';
import { BotDeDuelo, contextoDoCenario, jogadorTipico, inimigo, mundo, TICKS_POR_S } from './cenarios';
import { equipar } from './simulador';
import { habilidadeDoAtor } from '../../src/combat/perfil';
import { alcanceDe, recargaRestante } from '../../src/combat/acao';
import { progressoDeCombo } from '../../src/combat/sequencias';
import { chebyshev } from '../../src/combat/geometria';
import type { EstadoJogo } from '../../src/core/estado';
import type { ContextoSimulacao } from '../../src/core/contexto';
import type { Comando } from '../../src/core/comandos';
import type { Dificuldade } from '../../src/modos/dificuldade';
import { recalcularFicha } from '../../src/progression/derivados';
import { caminhosDoRank, nivelParaRank } from '../../src/progression/habilidades-personagem';
const builds = [
    { nome: 'Duelista', classe: 'guerreiro', skills: ['postura_de_aparo', 'corte_dilacerante', 'investida', 'escudo_de_ferro'] },
    { nome: 'Pântano', classe: 'mago', skills: ['estaca_de_pedra', 'nevoa_venenosa', 'abalo_sismico', 'onda_de_repulsao'] },
    { nome: 'Arqueiro arcano', classe: 'arqueiro', skills: ['seta_arcana', 'flecha_perfurante', 'barreira', 'curar'] },
    { nome: 'Protetor radiante', classe: 'aventureiro', skills: ['lanca_radiante', 'circulo_de_amparo', 'purificacao', 'barreira'] },
];
class BotDeSequencia extends BotDeDuelo {
    override agir(estado: EstadoJogo, ctx: ContextoSimulacao): Comando[] {
        const eu = estado.entidades.find((e) => e.id === this.id);
        const alvo = estado.entidades.find((e) => e.id === 'i1' && e.hp > 0);
        if (!eu || !alvo || eu.hp <= 0 || eu.acao)
            return super.agir(estado, ctx);
        const proxima = progressoDeCombo(estado, ctx, eu)?.proxima;
        const ordem = [...new Set([...(proxima ? [proxima] : []), ...eu.habilidades])];
        for (const id of ordem) {
            const h = habilidadeDoAtor(ctx, eu, id);
            if (!h || h.passiva || recargaRestante(estado, eu.id, id) > 0 || eu.mana < h.custoRecurso)
                continue;
            if (h.formulaCura && eu.hp > eu.hpMax * .7)
                continue;
            if (id === 'purificacao' && !eu.efeitos.some((e) => ctx.balance.tatica.removiveis.includes(e.tipo)))
                continue;
            const suporte = h.politicaAlvo === 'aliado' || h.politicaAlvo === 'proprio';
            if (!suporte && chebyshev(eu, alvo) > alcanceDe(ctx, eu, h, estado.tick))
                continue;
            return [{ t: 'selecionarAlvo', alvo: alvo.id }, { t: 'usarHabilidade', id, alvo: h.politicaAlvo === 'celula' ? { x: alvo.x, y: alvo.y } : suporte ? eu.id : alvo.id }];
        }
        return super.agir(estado, ctx);
    }
}
const linhas = ['# Combate das builds da expansão', '', '**Versão:** 1.0 · **Data:** 17/10/2026', '',
    'Amostra de 160 lutas: quatro builds, níveis 5/10/20/25/30, quatro dificuldades e sementes 1000/8919. Goblin do mesmo nível; equipamento raro. O bot tenta sequências e usa o motor real. Não representa domínio humano, chefes, enxames nem equilíbrio de PvP. Livros são considerados adquiridos; ranks respeitam o orçamento de pontos e os requisitos de nível. No nível 5, Névoa e Círculo são substituídos por Dardo tóxico e Curar.', '',
    '| Build | Nível | Dificuldade | Vitórias | Tempo médio (s) | Combos confirmados |', '|---|---|---|---|---|---|'];
for (const b of builds)
    for (const nivel of [5, 10, 20, 25, 30])
        for (const dificuldade of ['facil', 'normal', 'dificil', 'pesadelo'] as Dificuldade[]) {
            let vitorias = 0, tempo = 0, combos = 0;
            for (const semente of [1000, 8919]) {
                const ctx = contextoDoCenario();
                const j = jogadorTipico(ctx, b.classe, nivel);
                const bolsa = obter(j.bolsa);
                const skills = b.skills.map((id) => nivel < nivelParaRank(ctx, id, 1) ? id === 'nevoa_venenosa' ? 'dardo_toxico' : 'curar' : id);
                bolsa.conhecidas = [...new Set(skills)].map((id) => ({ id, rank: 1, caminhos: [] as string[] }));
                bolsa.barra = [...skills];
                let pontos = (nivel - 1) * ctx.balance.habilidades.pontosPorNivel;
                for (let i = 0; i < 5; i++)
                    for (const h of bolsa.conhecidas) {
                        if (pontos <= 0 || h.rank >= ctx.balance.habilidades.rankMax || nivel < nivelParaRank(ctx, h.id, h.rank + 1))
                            continue;
                        const caminho = caminhosDoRank(ctx, h.id, h.rank + 1)[0];
                        h.rank++;
                        if (caminho)
                            h.caminhos.push(caminho);
                        pontos--;
                    }
                bolsa.pontosHabilidade = pontos;
                recalcularFicha(j, ctx);
                equipar('raro')(j, ctx);
                j.hp = j.hpMax;
                j.mana = j.manaMax;
                const alvo = inimigo(ctx, 'goblin', nivel);
                const m = mundo(ctx, semente, [j, alvo], dificuldade);
                m.bots.push(new BotDeSequencia(j.id));
                m.rodar(60 * TICKS_POR_S, () => j.hp <= 0 || alvo.hp <= 0);
                vitorias += Number(alvo.hp <= 0);
                tempo += m.estado.tick / TICKS_POR_S;
                combos += m.eventos.filter((e) => e.t === 'comboFeito' && e.id === j.id).length;
            }
            linhas.push(`| ${b.nome} | ${nivel} | ${dificuldade} | ${vitorias}/2 | ${(tempo / 2).toFixed(1)} | ${combos} |`);
        }
const relatorio = linhas.join('\n') + '\n';
if (process.argv.includes('--registrar'))
    writeFileSync('docs/BALANCEAMENTO-EXPANSAO.md', relatorio);
console.log(relatorio);

function obter<T>(valor: T | undefined | null): T {
  if (valor === undefined || valor === null) throw new Error("Dado obrigatório ausente no cenário");
  return valor;
}
