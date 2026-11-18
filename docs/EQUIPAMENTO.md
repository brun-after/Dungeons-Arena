# Equipamento por propósito, estilo, grau e elemento (marco 46)

**Versão:** 1.1 · **Data:** 17/11/2026

> **Histórico**
> - **1.1 (17/11/2026)**: a decisão passa a D-186 (a D-185 da main é a dos movimentos no V e no Espaço); as perneiras
>   leem os três botões do movimento (Shift, V e Espaço); o gerador de atlas usa `--proposito`.
> - **1.0 (16/11/2026)**: primeira versão: as quatro camadas do visual, o modelo `gatilho → condição → efeito`, a chave
>   nova do atlas e as decisões D-186.

## 1. O que muda

Antes, a aparência da armadura vinha da classe de quem a vestia (`KITS_SOMBRIOS`, `<classe>~<peça>-<grau>`) e as peças
não tinham efeito próprio além dos atributos e da defesa. Agora a peça carrega a identidade dela:

| Camada | O que define | Onde mora | Muda o atlas? |
|---|---|---|---|
| Propósito | silhueta (placas, couro, pano longo, capuz, osso) | `data/pecas.json → propositos` | sim (`<corpo>~<propósito>.<peça>-<grau>`) |
| Estilo | persona visual: simples, medieval, colorida, arcana, meme | `data/pecas.json → estilos` | não (cor e enfeite em tempo real) |
| Grau | evolução 0 a 5 (raridade ou forma), 3 níveis de silhueta | `progression/graus.ts` | sim (já era assim) |
| Elemento | veios e partículas na cor do elemento, pela sintonia | aparência pública + `render/veste-elemental.ts` | não |
| Marca do efeito | espinhos, garras, penas, filigrana, brasa, placas | a receita do efeito | não (enfeite em tempo real) |

Propósito e estilo são **fixos na peça** (não há transmog). Os efeitos são **fixos por peça e variados**: a semente do
id do item escolhe o propósito, o estilo, o elemento e as receitas. O mesmo item tem sempre o mesmo perfil, em qualquer
máquina.

## 2. Os cinco propósitos

Tirados das referências de arte (mantos, pernas e pés, peito e luvas, elmos e ombreiras). Os kits que eram das classes
viraram os primeiros propósitos, trocando só a chave.

| Propósito | Silhueta | Veio do kit | Peças de referência |
|---|---|---|---|
| Baluarte | placas, elmo de chifres ou coroa, peito gótico, grevas, manoplas | Guerreiro | elmo de chifres, grande elmo coroado, peito gótico, grevas de placa |
| Batedor | couro, escamas, malha com tiras, bota de fivela, chapéu de ferro | Aventureiro | peito de escamas, malha com correias, bota de fivelas, chapéu de ferro |
| Arcano | pano longo, bordado, faixa de luz, filigrana, cristais | Mago | poncho bordado, túnica com faixa de luz, manoplas de filigrana, bota de espirais |
| Espreita | capuz, máscara de bico, trapos, garras, penas | Arqueiro | máscara de bico, garras nos pés e nas mãos, ombreira de penas |
| Ossuário | osso, caveira, costelas, correntes, véu | Necromante | peito de caveira, túnica de costelas, perna de osso, manto de correntes |

Os espinhos das referências não viraram propósito: são a **marca** do efeito de reflexo, que qualquer propósito pode
mostrar.

## 3. Estilo (só visual)

O estilo é a mesma armadura com detalhes que cada persona valoriza. Não é o pentagrama de estilos do marco 39 (que é
mecânica de dano): os nomes ficam separados no código (`estilo` da peça × `estilos` da ficha).

| Estilo | No 3D em tempo real |
|---|---|
| simples | sem enfeite; tons apagados |
| medieval | borda de latão, tabardo com cor heráldica |
| colorida | o pano e o couro numa cor viva (a paleta sai da semente) |
| arcana | runas acesas nas bordas e na barra |
| meme | um enfeite absurdo e leve (pena de pato, flor, guizo) |

## 4. Grau e destaque

- Os 3 níveis de silhueta seguem (graus 0–1, 2–3, 4–5); o grau ímpar ornamenta o nível.
- O destaque emissivo cresce com o grau: nenhum nos graus 0–1, fraco no 2, mais forte a cada grau, máximo no 5 (antes
  só o 5 acendia).
- Conjunto completo (as 6 peças do mesmo propósito): um destaque extra.

## 5. Elemento (camada por cima)

Sem peça por elemento. A aparência pública leva o elemento dominante do vínculo (o eneágono do marco 39) e a força dele
em 4 degraus. Por cima da armadura:

- veios emissivos na cor do elemento (o 3D em tempo real tinge os materiais de destaque);
- partículas leves nos pontos de destaque (barra da capa, gorjal, juntas), mais densas com mais vínculo;
- reações ao estado do personagem: queimando solta brasa da capa, congelado cobre de geada, molhado com eletrizado
  solta faíscas.

## 6. Efeitos: `gatilho → condição → efeito`

Tudo em `data/pecas.json → receitas`, medido em ticks (60 por segundo). `aceita` diz que pares cada peça aceita; a
leitura recusa o resto. O grau libera 1, 2 ou 3 receitas (graus 0–1, 2–3, 4–5) e multiplica os números
(`escalaPorGrau`). As somas de várias peças param nos `tetos`.

| Peça | Gatilho | Condição | Efeito |
|---|---|---|---|
| Botas | pisar no chão do elemento, usar o elemento, ser atingido pelo elemento | elemento | velocidade por X ticks (renova, não soma) |
| Luvas | atacar | corpo a corpo, à distância, magia (de um elemento ou qualquer) | dano a mais |
| Peitoral | ser atingido | elemento (ou qualquer) | reflete parte do dano em quem bateu, se hostil |
| Perneiras | o movimento da classe (Shift, V e Espaço) e a chegada dele | — | recarga menor, rastro do elemento, dano ou escudo na chegada |
| Manto | passivo; ser atingido | elemento | mais poder no elemento; absorve parte do golpe e converte em poder ou sintonia |
| Elmo | passivo | elemento | resistência ao elemento |

`grauMinimo` na receita guarda os efeitos mais fortes para as peças de grau alto.

**Regras que o motor segue** (`combat/efeitos-de-peca.ts`):

- reflexo e dano da chegada só caem em quem é hostil pela `relacao()`: vale igual em PvP e contra criaturas;
- o dano da chegada vem do poder base (D-148), nunca de atributo;
- a velocidade e o poder absorvido são efeitos com duração (`acelerado`, `bonus_dano`): o HUD já mostra, a passagem
  entre regiões já leva, o clone já copia;
- a resistência do elmo entra pela ponte com os ganchos (o combate já soma as resistências).

## 7. Atlas

- Chave nova: `<corpo>~<propósito>.<peça>-<grau>`. O corpo é o modelo da classe de quem veste (o recorte depende dele).
- Migração: `<classe>~<peça>-<grau>` virou `<classe>~<propósito da classe>.<peça>-<grau>` (só o nome do arquivo e a
  entrada no catálogo).
- Os outros propósitos em cada corpo saem de `npx tsx tools/sprites/render.ts --so <classe> --proposito <propósito>` (o
  Chromium com `--gpu` acelera; sem ele, roda em software).
  Enquanto um atlas não existe, a camada cai no propósito da classe do corpo (o visual continua, sem buraco).
- No 3D em tempo real (com GPU) não há atlas: as peças são montadas na hora e o estilo, a marca, o destaque e o
  elemento entram ali.
