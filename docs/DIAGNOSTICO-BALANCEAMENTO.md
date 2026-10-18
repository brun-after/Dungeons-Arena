# Como investigar o balanceamento

**Versão:** 1.0 · **Data:** 18/10/2026

O diagnóstico amplia as metas históricas com contabilidade de combate, desgaste e experimentos. Não calibra o jogo automaticamente. O resultado da execução de referência está em [BALANCEAMENTO-DIAGNOSTICO.md](BALANCEAMENTO-DIAGNOSTICO.md).

## Integração com o sistema

`npm run verificar` executa tipos, lint, testes, build e `npm run balancear:completo`. Esse último verifica as metas históricas e executa o diagnóstico completo com as cinco classes. O diagnóstico isolado também está disponível como `npm run balancear:diagnostico`.

Na CI de cada PR e push em main, o diagnóstico completo roda com oito sementes e publica o artefato `diagnostico-balanceamento` por sete dias, contendo Markdown, log e amostras JSON da execução. Os arquivos ficam fora da pasta que o Playwright limpa. Relatórios antigos do checkout não são publicados como se fossem resultados de uma execução que falhou.

A execução falha se houver grade incompleta, amostras duplicadas ou intervenções sem controle, números inválidos, inconsistência de custos/dano/cura por origem ou fonte, ou restauração artificial entre ondas. Uma morte simultânea é derrota e não conclui a onda. Diferenças entre classes são resultados investigativos; as metas históricas continuam sendo os critérios numéricos de balanceamento.

## Executar

```sh
# Metas históricas e seu código de saída de aprovação/reprovação, preservados.
npm run balancear

# Diagnóstico completo: todas as classes; níveis 1, 10 e 30; Normal/Pesadelo;
# quatro cenários, oito sementes, kit completo e intervenções aplicáveis.
npm run balancear -- --diagnostico --registrar --json /tmp/balanceamento.json

# Sondagem rápida, sem alterar o relatório salvo.
npm run balancear -- --diagnostico --classes guerreiro,mago --niveis 1,5 --dificuldades normal --cenarios atrito --sementes 4

# Ampliar uma hipótese localizada depois de olhar o relatório.
npm run balancear -- --diagnostico --classes guerreiro,mago --niveis 10 --dificuldades pesadelo --cenarios chefe --sementes 64 --json /tmp/hipotese.json
```

O modo de diagnóstico imprime Markdown no stdout e progresso no stderr. `--registrar` grava `docs/BALANCEAMENTO-DIAGNOSTICO.md`; a opção `--json CAMINHO` grava configuração, versão do balance e todas as amostras, incluindo fontes e ondas. O JSON pode ficar fora do checkout. Sem `--diagnostico`, o comando mantém o relatório e o comportamento históricos.

| Opção do diagnóstico | Padrão | Uso |
|---|---|---|
| `--classes` | Todas as classes oficiais | IDs separados por vírgula; inclui Necromante |
| `--niveis` | `1,10,30` | Níveis de 1 a 30; use `1,5,10,20,30` para maior resolução |
| `--dificuldades` | `normal,pesadelo` | `facil,normal,dificil,pesadelo` |
| `--cenarios` | `duelo,pressao,atrito,chefe` | Escolha o tipo de ameaça |
| `--sementes` | `8` | Inteiro de 1 a 256; as classes recebem as mesmas sementes |
| `--limite` | `90` | Segundos por encontro inteiro, de 1 a 300 |
| `--sem-experimentos` | Desativado | Mede somente o kit completo; o relatório marca as intervenções como não executadas |
| `--registrar` | Desativado | Substitui o Markdown gerado do diagnóstico |
| `--json CAMINHO` | Sem exportação | Amostras brutas para analisar e reproduzir |

## Perguntas que o relatório responde

- **Quem morreu menos e desde quando?** A grade separa nível, dificuldade e cenário; no atrito, cada onda mostra quem chegou, quem morreu, a vida/mana de entrada e saída e o que foi recebido, curado e gasto. Ondas posteriores têm somente sobreviventes, com denominadores explícitos.
- **Qual foi o preço dessa sobrevivência?** Dano efetivo, DPS durante o tempo vivo, mana e HP efetivamente cobrados, tempo de conjuração, cancelamentos, restrição de mana, consumíveis e vida sacrificada de invocações.
- **Por que a exposição ao dano foi diferente?** Vida inicial, defesa, absorção de escudo em golpes diretos, distância média, movimento, esquivas, tempo sob controle, dano recebido pelas invocações e tempo com vida baixa. A comparação descreve esses mecanismos sem inventar uma divisão causal entre eles.
- **De onde vieram cura e dano?** Fontes por habilidade, efeito, item e invocação. A cura das poções e a dos curadores invocados são contadas uma vez, apesar dos eventos de resumo. Dano direto separa o excesso letal; dano por efeito já é limitado ao HP restante pelo motor.
- **Quanto cada fator contribuiu?** Repete cada semente retirando um fator: cura proporcional do básico, poções iniciais, habilidades da barra ou defesa plana. Compara pares, vitórias ganhas/perdidas, HP final e DPS. A remoção da cura do básico só roda nas classes onde ela existe; não significa remover todas as curas. Passivas e invocações automáticas permanecem ao desligar a barra.

O texto destaca até oito pares com menor mortalidade, mais vitórias e pelo menos 90% do DPS da outra classe. Esse filtro orienta a investigação, não reprova uma meta. Os demais pares continuam detalhados. As tabelas de intervenção mostram se o fator é importante também quando o texto inicial sugere outra explicação.

O custo cobrado por `curar`, por exemplo, pode ser comparado à cura direta da própria habilidade. A mana total da classe não é o custo exclusivo da cura; efeitos indiretos, roubo de vida e escudos não recebem custos inventados. O relatório deixa `—` quando não existe atribuição válida de cura/mana. Saldos de HP/mana sem evento tornam visíveis regeneração e lacunas da telemetria.

## Limites da conclusão

A ficha usa a distribuição de atributos/ranks do simulador e o equipamento inicial, inclusive no nível 30. Não cobre builds aprendidas, todas as raridades, exploração, mapas, latência, decisões humanas ou confrontos PvP entre classes. A grade é extensível: `diagnostico.ts` define os encontros e intervenções; `metricas.ts` mede; `estatisticas.ts` compara; `relatorio-diagnostico.ts` explica.

O cenário de chefe termina ao eliminar o chefe, mesmo com servos hostis ainda vivos. O dano desses servos é atribuído ao lado inimigo. Não há drops, XP, subida de nível ou respawn dos alvos; a sequência preserva posição, invocações e recursos entre ondas, sem cura artificial.

Mortes, vitórias e limites de tempo têm contagens separadas. TTK usa somente vitórias e apresenta ausência de vitórias como `—`. DPS inclui todas as tentativas e usa a soma do dano dividida pela soma do tempo vivo. Os tempos de conjuração, movimento, controle, vida baixa e restrição de mana podem se sobrepor. A restrição de mana é uma oportunidade estimada de skill pronta, não indisponibilidade de todo o kit.

Os intervalos de Wilson de 95% são descritivos para as sementes escolhidas; oito sementes ainda têm incerteza grande. As intervenções preservam condições iniciais, mas as ações mudam o consumo do RNG. Seus efeitos são condicionais e interagem: não some os deltas para dizer que “a cura explica 60% e a defesa 40%”. Não há correção para comparações múltiplas nem afirmação de significância. Uma hipótese promissora deve ser repetida com mais sementes, builds e tipos de encontro antes de mudar os números do jogo.
