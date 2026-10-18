# Classes, experiência e Botas do vento

**Versão:** 1.2 · **Data:** 18/10/2026 · **Balance:** 28 · **Save:** 21

Implementação baseada no arquivo `AJUSTES-CLASSES-A-PARTIR-DA-MAIN.md` fornecido pelo usuário, mais os pedidos de reduzir o farm de criaturas inferiores e substituir o efeito redundante das botas. Os percentuais históricos do anexo não certificam este pacote de produção.

## Classes

- **Guerreiro:** afinidade de contato absoluta de 0% a 15% entre os níveis 1 e 10; multiplicador adicional de dano de 1 até 1,10 entre os níveis 10 e 30, também nos efeitos atribuídos ao próprio Guerreiro. A aura varia de 1% a 5%, alcança duas células por Chebyshev e cura 20% do dano efetivo causado. Defesa, escudo, imunidade, frações por destinatário e cura fracionária são resolvidos sem novos críticos, acertos, reflexos ou pulsos recursivos. A cura de 10% do básico continua separada.
- **Reforços do Guerreiro entre 16 e 20:** no integrador compartilhado por servidor e predição, o movimento ganha +3%, +6%, +9%, +12% e +15% nos níveis 16, 17, 18, 19 e 20. A partir do 20 mantém +15%. Impactos de projéteis e áreas remotas quadradas geram somente o pulso centrado no atingido, com 20%, 40%, 60%, 80% e 100% da potência nesses mesmos níveis; antes do 16, não geram esse pulso remoto. A escala multiplica a potência antes da defesa dos destinatários. Cones, linhas, áreas locais e periódicos mantêm a aura local e sua curva original de 1% a 5%. Cada impacto remoto gera somente um pulso, inclusive se matar o alvo; ele não gera outro junto ao Guerreiro.
- **Mago:** afinidade mágica de 35% no nível 1, interpolação até 25% no 5, manutenção até o 15 e interpolação até 35% no 20. Afinidade elemental e custos preservados.
- **Aventureiro:** Seta Arcana e Explosão causam ×0,95 de dano direto a partir do nível 20, sem alterar as definições compartilhadas ou os efeitos derivados.
- **Arqueiro:** Chuva de Flechas e Tiro em Leque causam ×1,15 nos alvos secundários. O principal é escolhido antes da resolução pela distância de Chebyshev da célula ocupada à mira, com desempate por ID; a ordem dos impactos é preservada.
- **Necromante:** HP base 32, afinidade geral de dano −75 pontos somada às demais (Trevas permanece +10%), mortos específicos em 180%. Invocações genéricas mantêm seus valores. Proteção inicial contra dois/três ou mais hostis vivos de 10%/20%, antes do arredondamento e escudo, também nos periódicos hostis; custos próprios e dano autoinfligido são excluídos.

### Encontro na campanha

Cada visita à fase constitui um encontro, iniciado na primeira aplicação ofensiva hostil envolvendo o personagem. A janela de proteção dura cinco segundos de simulação; não começa durante exploração sem agressão e não renova em troca de alvo, mortes, ondas ou respawn. Uma transição de fase inicia outra visita. O checkpoint conserva o tick inicial, portanto carregar o mesmo estado não renova a janela. A contagem de hostis vivos é refeita em cada aplicação, incluindo criaturas distantes. A proteção pertence ao dono.

## Experiência de criaturas inferiores

O antifarm vale para personagens com bolsa nos modos cuja regra permite progressão de estudo, em abates de criaturas de IA sem invocação. `XP_base` é a cota do participante após dificuldade, divisão no grupo e faixa avançada, antes das duas reduções abaixo. A antiga penalidade de mortes repetidas da mesma criatura não se acumula na campanha, pois faria o ganho cair abaixo do piso solicitado. PvP e outras fontes de recompensa conservam suas regras e não entram no contador.

Cada personagem mantém, por fase, `A_fase = xpBaseAcumulado` e `H = meiaVidaXp`. A fase atual e cada fase anterior usam somente seu próprio contador. Para fases com níveis mistos, o nível de referência é o menor configurado; se a fase não tem uma lista de inimigos (apenas spawner), usa-se o nível da criatura abatida.

```text
d = nível do jogador − nível dos inimigos da fase

se d ≤ 0:
    XP_final = XP_base
    A_fase permanece como está

se d > 0:
    fator_nível = 0,5^(d / 10)
    fator_fadiga = 0,5^(A_fase / H)
    XP_final = max(1; XP_base × fator_nível × fator_fadiga)
    depois do ganho: A_fase += XP_base
```

**H** é o XP necessário para subir do nível dos inimigos da fase ao seguinte, fixado no primeiro ganho com `d > 0` e guardado no contador. Não acompanha o nível futuro do jogador nem reajustes posteriores da tabela. `A_fase` acumula o valor antes da redução, inclusive quando o piso de 1 XP já foi atingido. O piso é absoluto por recompensa de inimigo com diferença positiva; não há mais mínimo percentual. Recompensa base zero continua zero. Valores fracionários acima de 1 XP continuam entrando no saldo de progressão.

Ganhar XP em fases posteriores, morrer, perder níveis, transitar, salvar, carregar ou retornar do cooperativo/arena não diminui A nem altera H. **A penalidade de morte do jogador continua intacta:** até 50 XP acumulados e de 10% a 50% do ouro na campanha e no cooperativo; o piso do ganho não protege o saldo contra essa perda. Retornos de retratos antigos usam o maior acumulado por fase e preservam o H já fixado no save. Se uma perda de nível tornar `d ≤ 0`, recebe-se XP integral, mas o acumulado continua guardado e volta a valer quando `d > 0`.

| Jogador | Fase | A_fase | Percentual de XP_base |
|---|---|---|---|
| 20 | 10 | 0 | 50% |
| 20 | 10 | H | 25% |
| 20 | 10 | 2H | 12,5% |
| 21 | 10 | 0 | aproximadamente 46,65% |
| 21 | 9 | 0 | aproximadamente 43,53% |
| 21 | 21 | qualquer | 100%, sem aumentar A |
| 60 | 10 | 0 | 3,125%, respeitando o mínimo absoluto de 1 XP |

Avançar da fase 10 à fase 20 com jogador 20 concede 100% na nova fase e mantém o contador da fase 10. Ao voltar, sua fadiga continua exatamente de onde parou, com a diferença real de nível atual.

### Compatibilidade de saves

Save 21 normaliza os contadores no estado atual e nas fases visitadas. Valores do rascunho anterior (`xp`, que registrava XP efetivamente recebido) são preservados como acumulado inicial; não há dados para reconstruir com exatidão seu XP base e a condição de nível de cada abate passado. Nesses registros legados, H é fixado na primeira revisita com ganho penalizado. Saves sem histórico começam sem contador. A migração anterior continua corrigindo HP base 42 do Necromante para o catálogo atual, recalculando sua ficha.

## Botas

**Somente Botas do vento (forma lendária):** cruzar a célula ocupada por um hostil vivo concede +30% de velocidade por três segundos.

Botas comuns, Botas ligeiras e Passo do vendaval conservam exatamente seus dados anteriores. A forma Última continua concedendo Fantasma por quatro segundos e cura de 5% ao abater; não recebe bônus de velocidade.

O gancho da forma lendária dispara na mudança de célula ocupada, inclusive no meio do passo e se o inimigo entrar na célula do portador parado. Permanecer sobreposto não renova o efeito. Aliados e mortos não ativam o bônus. Novos cruzamentos renovam a duração; a velocidade não acumula por quantidade de inimigos e continua sujeita a lentidão, bloqueios e mobilidade de conjuração.

## Validação

- Testes específicos cobrem curvas e transições, aura e frações, defesa/escudo/imunidade, custo próprio, dano periódico, impacto letal remoto, cura do básico, proteção inicial, movimento, seleção de secundários, fórmula de XP, piso, permanência dos contadores, H fixo, clone, transição, ficha cooperativa, migração e gatilhos das botas.
- Metas legadas, oito sementes: **73/77**. As quatro falhas são duração abaixo de quatro segundos contra comuns: Guerreiro nível 5 (3,8 s), Mago níveis 1 (3,7 s), 5 (3,4 s) e 10 (3,8 s). Os novos buffs tornam essas lutas mais rápidas; as metas foram preservadas.
- O diagnóstico ampliado usa todos os ajustes de produção juntos. Seus resultados são exploratórios e não substituem a grade histórica do anexo, cujos scripts de sugestões e 24 cenários não estão neste checkout.

### Histórico: diagnóstico do balance 26 — oito sementes por célula

Antes das correções desta versão, foram concluídos **9.600 encontros** no balance 26, com integridade e contabilidade validadas, nas cinco classes, quatro dificuldades, quatro cenários (`duelo`, `pressao`, `atrito`, `chefe`) e quinze níveis. Os ajustes daquela versão estavam habilitados simultaneamente; nenhuma intervenção de laboratório foi aplicada. Cada taxa abaixo agrega 128 encontros por classe e nível. As sementes são as da ferramenta existente, portanto não constituem confirmação com sementes novas.

| Nível | aventureiro | guerreiro | mago | arqueiro | necromante |
|---|---:|---:|---:|---:|---:|
| 1 | 67,19% | 63,28% | 63,28% | 64,84% | 67,19% |
| 2 | 59,38% | 72,66% | 64,84% | 59,38% | 71,09% |
| 3 | 67,97% | 78,91% | 71,88% | 62,50% | 75,78% |
| 4 | 69,53% | 82,81% | 80,47% | 67,97% | 79,69% |
| 5 | 69,53% | 88,28% | 82,03% | 76,56% | 79,69% |
| 10 | 82,03% | 83,59% | 88,28% | 72,66% | 75,00% |
| 15 | 78,91% | 78,12% | 84,38% | 75,00% | 70,31% |
| 16 | 78,12% | 76,56% | 81,25% | 73,44% | 72,66% |
| 17 | 81,25% | 77,34% | 83,59% | 74,22% | 71,09% |
| 18 | 80,47% | 71,09% | 84,38% | 78,91% | 72,66% |
| 19 | 77,34% | 71,88% | 84,38% | 78,91% | 70,31% |
| 20 | 82,03% | 66,41% | 80,47% | 83,59% | 69,53% |
| 21 | 86,72% | 64,84% | 78,12% | 78,91% | 60,16% |
| 25 | 86,72% | 62,50% | 70,31% | 74,22% | 60,16% |
| 30 | 83,59% | 56,25% | 59,38% | 70,31% | 60,94% |

A amostra mede estas builds e cenários, não certifica igualdade entre classes nem a meta de diferença de até cinco pontos percentuais do anexo. A grade histórica tinha 24 cenários e outra composição; os percentuais não são comparáveis diretamente.

A rodada histórica do balance 26 teve 767 testes aprovados. A validação do balance 27 é registrada abaixo como histórico.

### Histórico: validação do balance 27

**789 testes aprovados**, typecheck, lint, build do cliente e build do servidor aprovados. O diagnóstico focado concluiu **896 encontros** do Guerreiro: oito sementes, quatro dificuldades, quatro cenários e níveis 15 a 21. Integridade e contabilidade validadas. Cada linha agrega 128 encontros com uma build típica; não é uma certificação de equilíbrio nem uma comparação pareada contra a versão anterior.

| Nível | Movimento adicional | Potência da aura remota | Vitórias no diagnóstico |
|---|---:|---:|---:|
| 15 | 0% | 0% | 100/128 |
| 16 | 3% | 20% | 99/128 |
| 17 | 6% | 40% | 97/128 |
| 18 | 9% | 60% | 93/128 |
| 19 | 12% | 80% | 92/128 |
| 20 | 15% | 100% | 87/128 |
| 21 | 15% | 100% | 83/128 |

Casos de regressão validam os exemplos de XP fornecidos, H congelado, incremento de A após o ganho, piso percentual daquela versão, independência entre fases, retorno sem restauração, morte, migração de saves, clone, retornos do cooperativo/arena com histórico antigo e preservação das demais botas.


### Validação final da PR — balance 28

- 794 testes aprovados, incluindo o piso absoluto de 1 XP para recompensas base de 0,1, 10, 100 e 10.000 XP após desgaste extremo; a penalidade de 50 XP acumulados na morte permanece ativa.
- Typecheck, lint e builds do cliente e servidor aprovados.
- Metas legadas novamente em **73/77**, com as mesmas quatro durações abaixo do mínimo: Guerreiro 5 (3,8 s), Mago 1 (3,7 s), Mago 5 (3,4 s), Mago 10 (3,8 s). Metas não foram alteradas; a PR permanece em rascunho com essa limitação explícita.
- Smoke E2E não reexecutado: Chromium do Playwright indisponível neste ambiente. As 896 simulações focadas e a grade histórica acima pertencem às versões de balance identificadas, não foram reexecutadas para a troca isolada do piso de XP.
