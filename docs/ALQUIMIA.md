# Alquimia: fusões, runas e materiais

**Versão:** 1.0 · **Data:** 21/11/2026

> **Histórico**
> - **1.0 (21/11/2026)**: marco 50 (D-196). Fusões abertas, compreensão, runas elementais, material na magia e a aba
>   Alquimia.

Este guia explica a alquimia como ela está no código. O desenho completo, com exemplos animados, está no Grimório da
Alquimia (artefato). As decisões ficam em [DECISOES.md](DECISOES.md) (D-192 a D-196).

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

## Onde mexer

| O quê | Onde |
|---|---|
| Pares, formas naturais, assinaturas, nomes, materiais, legado | `src/data/alquimia.json` (lido por `combat/fusao/catalogo.ts`) |
| Orçamento, compreensão, runas, drop | `src/data/balance.json → alquimia` |
| A definição da fusão | `src/combat/fusao/fundir.ts` |
| O comando e as regras de quem pode fundir | `src/progression/alquimia.ts` |
| A compreensão | `src/progression/compreensao.ts` |
| A aba | `src/ui/alquimia/` (bancada, círculo, prévia, caderno, arrastar) |
| Os textos | `src/i18n/pt-BR-alquimia.ts` |
