# Alquimia: fusões, runas e materiais

**Versão:** 1.3 · **Data:** 21/11/2026

> **Histórico**
> - **1.3 (21/11/2026)**: D-198, adendo. Reaprender de graça e na hora, e a chance que sobe a cada tentativa.
> - **1.2 (21/11/2026)**: marco 52 (D-198). Os níveis de raridade da fusão e a fórmula refeita.
> - **1.1 (21/11/2026)**: marco 51 (D-197). A forja: engastes, receitas como loot e a mesa da forja.
> - **1.0 (21/11/2026)**: marco 50 (D-196). Fusões abertas, compreensão, runas elementais, material na magia e a aba
>   Alquimia.

Este guia explica a alquimia como ela está no código. O desenho completo, com exemplos animados, está no Grimório da
Alquimia (artefato). As decisões ficam em [DECISOES.md](DECISOES.md) (D-192 a D-198).

## Como o jogador funde

1. **Usar a skill.** Cada acerto num inimigo de nível igual ou maior que o seu − 10 dá compreensão: +2% numa skill
   comum e +1% numa fusão, contando só o primeiro alvo do golpe. A essência da família acelera em 25%, uma vez por
   skill. A carta da skill mostra o sigilo da compreensão.
2. **Montar a mistura.** Na aba Alquimia da mochila, arraste ou toque os orbes até os vértices do círculo, na ordem
   núcleo, forma e eco. Ponha as runas e o material nos encaixes. A prévia mostra a magia nova contra as partes.
3. **Transmutar.** As partes, as runas e o material são consumidos e a fusão começa a ser estudada. Ela nasce no rank
   da média das partes, arredondada para baixo. Não há como desfazer.

Ficam de fora das fórmulas as skills de classe, as ultimates, o ataque básico, as passivas e as internas.

## O id é a receita

```
f__<núcleo>__<forma>[__<eco>][__rr_<el>_<el>][__mm_<material>]
```

- `combat/fusao/receita.ts` lê e escreve o id. As runas vão em ordem alfabética, para a mesma mistura dar o mesmo id.
- A fusão de fusão é achatada: `f__a__b` + `c` vira `f__a__b__c`. Passou de 3 partes, a mistura não fecha. As runas e o
  material de uma fusão que entra de novo continuam nela.
- `definicaoDe` resolve os ids `f__` por `definicaoDaFusao` (`combat/fusao/fundir.ts`), com memória por catálogo. A
  ficha só guarda o id.

## O que cada posição dá

| Posição | Dá |
|---|---|
| 1ª, núcleo | O papel, a fórmula de dano ou cura, o elemento principal, o ícone e o visual. |
| 2ª, forma | O desenho do golpe (projétil ou área, alcance, raio) e a entrega dela. Sem entrega própria, vale a forma natural do núcleo dela (`alquimia.json → formas`). |
| 3ª, eco | Os estados, a marca no chão e a permanência no alvo. |

As combinações que o motor de entrega não aceita se acertam pela ordem:
- o feixe anda em reta e não tem corpo nem giro;
- o céu e o círculo sob o alvo não andam de lado;
- o golpe que volta sai da mão.

## O orçamento

Os números estão em `balance.json → alquimia`.

| Mistura | Orçamento | Custo | Recarga | Runas |
|---|---|---|---|---|
| Par | 112% em 2 funções | 1,1× o maior | 1× a maior | 1 |
| Par harmônico | 127% (+15% de ressonância) | 1,1× | 1× | 1 |
| Trio | 130% em 3 funções, grau S | 1,35× | 1,25× | 2 |

- A ressonância só vale quando todos os pares de elementos da mistura são harmônicos (`alquimia.json → pares`).
- Cada par instável soma custo (+20% no par, +10% por par no trio) e +15% de recarga.
- O dano soma a fatia de cada parte que fere: dois golpes num par dão 112%, e um golpe e um controle dão 56% de dano
  mais o controle.
- Os estados de cada parte saem na fatia dela, nunca abaixo de meio segundo.
- Os elementos além do principal entram como a camada do estado deles, na fatia.

Resultado: um par harmônico bem montado compete com um trio. O trio cobre mais situações, mas cada função sai mais fraca
e mais cara. A skill pura continua a mais eficiente por mana e a única que evolui por caminhos.

## Assinaturas

São 15 misturas com nome e efeito próprios (`alquimia.json → assinaturas`), definidas pelos núcleos das partes em
qualquer ordem. Cada uma soma poder (`danoPct`), saltos ou uma forma. Quando alguém acerta uma assinatura, o diário a
anota, e o caderno de fórmulas mostra as achadas e deixa as outras em branco.

## Runas

- **Runas elementais (item).** São nove, `runa_<elemento>`, e caem das criaturas do elemento:
  `dropRuna.chancePct` (4%) nas comuns e `chefePct` (60%) nos chefes.
  - A runa de um elemento já presente amplifica o estado dele em 25%.
  - A de um elemento novo acrescenta a camada dele a 50%. É o único jeito de uma magia ter 4 elementos.
- **Runa curinga.** É a antiga runa de fusão: vale o elemento do núcleo.
- **Runas de classe.** Ficam nas skills de classe e na ultimate, que levam a pedra que o vínculo libera. Arraste a pedra
  acesa até o encaixe da carta, ou toque nela. Não se gastam (D-151).

## Materiais na magia

A magia leva um material. O efeito dele está em `alquimia.json → materiais` e pode mexer em:
- dano, custo, recarga, duração, custo de vida, perfurar ou saltar;
- estados extras (o mesmo estado reforça o que a magia já tem);
- a forma (por exemplo, o fragmento de portal faz a magia sair de dois círculos atrás de quem lança).

O efeito dos materiais na arma e no equipamento vem no marco 51 (a forja).

## As fusões fixas antigas

As 4 fusões fixas viraram a fusão aberta das mesmas partes (`alquimia.json → legado`). A troca vale no save (migração
31 › 32) e nas fichas que chegam ao servidor.

| Antiga | Nova |
|---|---|
| Flecha arcana | `f__projetil_raio__flecha_perfurante` |
| Lança tempestuosa | `f__lanca_de_gelo__raio_em_cadeia` |
| Ciclone flamejante | `f__redemoinho__lamina_em_brasa` |
| Cadeia sombria | `f__corrente__recuo_psiquico` |

As definições antigas ficam no catálogo, sem o campo `fusao`, porque inimigos e visuais ainda as usam.

## Níveis de raridade

Cada transmutação sai num nível, contado de trás para frente:

| Nível | Chance (Inteligência até 10) | Por ponto acima de 10 | Teto | Dano, cura e estados |
|---|---|---|---|---|
| 3º (comum) | 76% | o resto | — | como sempre |
| 2º | 20% | +0,5% | 42% | +10% |
| 1º | 4% | +0,3% | 22% | +22% |

- O nível fecha o id: `f__explosao_fisico__explosao_raio__g1`. Sem ele, é o 3º.
- O visual é a mesma magia com mais camadas: o 2º lapida o brilho, e o 1º soma a filigrana dourada, a estrela, o glifo
  e as colunas de luz (`render/vfx/manifestacao-raridade.ts`).
- **Tentar de novo.**
  - As partes consumidas voltam na hora, sem ponto e sem estudo, no rank 1, com a compreensão adiantada em 20% por
    vez que já foram consumidas. Da 5ª vez em diante, nascem compreendidas.
  - Cada tentativa anterior da mesma fórmula soma +3% ao 1º nível e +5% ao 2º, até 50% e 60%.
  - Fica sempre o melhor nível: um resultado inferior nunca toma o lugar do superior. Se não melhorar, a fusão de
    antes fica, e o que entrou se gasta.
  - No 1º nível, a fórmula está no teto.
- Números em `balance.json → alquimia.raridade`.

## A forja: engastes e receitas

Os mesmos materiais também vão para armas e equipamento, engastados no ferreiro.

**Engastes.** A peça leva de 1 a 3 materiais:

| Raridade | Engastes | | Nível da peça | Teto |
|---|---|---|---|---|
| Comum, incomum | 1 | | até 19 | 1 |
| Rara, épica | 2 | | 20 a 49 | 2 |
| Lendária, última | 3 | | 50 ou mais | 3 |

Vale o menor dos dois. O id guarda os materiais: `en_escama_ignea.po_de_sonho__fu_fogo_1__espada_curta`. A fusão
elemental fica por dentro, os engastes por fora.

**O material na arma e na peça.** Cada material tem uma leitura para a arma e outra para o equipamento
(`alquimia.json → materiais.<id>.arma` e `.peca`), em ganchos. A escama ígnea, por exemplo: na arma, 20% de chance de
queimar; na peça, resistência de 15% a fogo.

**Conjuntos dentro da peça.**
- **Mesmo elemento**: com 2, os efeitos sobem 25%; com 3, 40%.
- **Mesma dimensão de Filo**: com 2, sobem 15%; com 3, sobem 30% e vem o eco da fenda (às vezes, o estado da dimensão
  em volta de quem é golpeado).
- **Par instável**: a reação do par entra na peça, e os efeitos caem 15%.

**Receitas.** As 15 receitas do Grimório são itens `receita_<id>` que caem das criaturas que as guardam (e dos chefes,
as de grau V). Toda receita parte de uma peça pronta:
- a Lâmina de cinzas pede uma lâmina e uma escama ígnea, e a lâmina sai de fogo com a escama engastada;
- o Arco da tempestade pede um arco épico, um segundo arco, o núcleo trovejante e a runa do raio.

Os moldes ficam em `forja.json → moldes`.

**No ferreiro, sem receita**, também se engasta e se extrai. As duas operações custam ouro pelo nível da peça, e o
material extraído volta 35% das vezes.

## Onde mexer

| O quê | Onde |
|---|---|
| Pares, formas naturais, assinaturas, nomes, materiais, legado | `src/data/alquimia.json` (lido por `combat/fusao/catalogo.ts`) |
| Orçamento, compreensão, runas, drop | `src/data/balance.json → alquimia` |
| A definição da fusão | `src/combat/fusao/fundir.ts` |
| O comando e as regras de quem pode fundir | `src/progression/alquimia.ts` |
| A compreensão | `src/progression/compreensao.ts` |
| Os níveis de raridade (chance, sorteio, troca da antiga) | `src/progression/fusao-raridade.ts`, `balance.json → alquimia.raridade` |
| O visual dos níveis | `src/render/vfx/manifestacao-raridade.ts` |
| A aba | `src/ui/alquimia/` (bancada, círculo, prévia, caderno, arrastar) |
| Engastes, conjuntos e o id `en_` | `src/progression/engaste.ts`, `balance.json → engaste` |
| As receitas da forja, os comandos e o drop | `src/progression/moldes.ts`, `src/data/forja.json → moldes` |
| A mesa e a cena da forja | `src/ui/forja/` (mesa, cena) |
| Os textos | `src/i18n/pt-BR-alquimia.ts` |
