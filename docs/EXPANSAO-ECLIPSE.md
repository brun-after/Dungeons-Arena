# Reino do Eclipse e revisão do Mundo

**Versão:** 1.2 · **Data:** 08/11/2026 · **Marco:** 36

O portal de qualquer vila oferece as capitais do Reino Central e do Reino do Eclipse, mesmo antes da
primeira visita. A viagem mantém os custos e a recarga do portal; as demais vilas continuam exigindo descoberta.
As fichas existentes permanecem válidas. O mapa permite alternar entre os dois reinos, com os integrantes
da party identificados em cada botão. Desde o marco 38 (D-142), a Travessia das Areias liga os dois reinos a pé.

O Eclipse tem 12 regiões de 224 a 296 células de lado, níveis de 30 a 70, quatro vilas, 36 dungeons e oito
domínios compartilhados de boss. Todas as regiões têm encontros externos garantidos: dois ou três bosses,
fora das vilas e das chegadas. As oito regiões perigosas permitem PvP, conforme as regras já existentes.
O Central conserva suas nove regiões, 28 dungeons e três covis. Dez de suas dungeons foram ampliadas.

As dungeons ampliadas e todas as do Eclipse têm mapa de pelo menos 96×80 células, com 18 a 20 salas em espiral.
Quando o chefe é um dragão, salas e corredores aumentam conforme seu nível, com passagem livre para
o corpo completo. O porte visual cresce de 1,1 célula no nível 1 a 2,2 no nível 100, sem aumento adicional
por ser boss. O atlas foi corrigido para apoiar a criatura no chão e preservar todas as poses.
Todas as lojas de dungeon e covil oferecem Pedra de Retorno, consumíveis e estoque superior ao das vilas.
O Eclipse vende Couraça do Eclipse (nível 30) e Manto do Crepúsculo (40); suas dungeons também oferecem
Couraça do Trono Vazio e Manto do Abismo (55). No Central, a Couraça de Expedição (15) aparece nas ofertas
temporárias e permanece nas lojas de dungeon.

Nas lojas externas, duas ofertas avançadas aparecem durante dez minutos a cada janela de trinta minutos,
com fase diferente por loja. A lista muda entre janelas, é compartilhada na sala e leva o rótulo
“Oferta temporária”. Expiração é conferida pelo servidor no momento da compra. O relógio é o tempo da
simulação da sala, e o sorteio não consome o RNG do combate. Dungeons mantêm seu estoque superior permanente.

Cada morte confirmada em dungeon é contada na ficha daquele personagem, por id da dungeon. A partir da
quinta, a Pedra de Retorno custa metade do preço já ajustado pelo Carisma. A partir da décima, custa zero.
A contagem sobrevive a reconexões e novas visitas, sem interferir em outras dungeons. Pedras gratuitas
mantêm a referência `resgate_dungeon`; podem ser usadas e guardadas, mas não vendidas à loja nem anunciadas
no mercado, e desaparecem ao morrer fora da dungeon em vez de virarem loot do túmulo. Pedras compradas
normalmente preservam a revenda normal. A pedra continua levando à vila salva.

O Necromante Ancestral ergue um exército ao entrar em combate, sem cadáveres: quatro lacaios no nível 1,
mais uma vaga a cada cinco níveis, até dez no nível 31. Reavalia as vagas a cada doze segundos. Os lacaios
duram até noventa segundos e desaparecem com o dono, conforme a regra existente das invocações. Há cavaleiro
profano, piromante, arcanista glacial e espectro da tempestade, com atributos do nível do boss e magias próprias.
Usam a IA normal de inimigo, não as reservas de ataques, o teto nem a colheita de cadáveres do jogador.
Mantêm a cor negra mesmo quando o dono sai do recorte de rede; não dão XP nem loot e respeitam as relações
de equipe. O necromante jogador conserva suas regras e invocações avermelhadas.

No exterior, um inimigo a até dezesseis células de um aliado que tomou dano recente ganha dez células de
atenção. O foco dura oito segundos desde a agressão mais recente; sem batalha, o raio volta ao normal.
Os refúgios das vilas, as relações de hostilidade e a ativação próxima de jogadores continuam valendo.
A população inicial das regiões fica limitada a trezentos comuns, reservando espaço no limite de NPCs para
bosses, exércitos e invocações dos jogadores.

Os números ajustáveis ficam em `balance.json → mundo`. A adequação de dificuldade do novo reino e dos
exércitos ainda deve ser avaliada jogando com pessoas; testes automáticos verificam as regras, a geração,
as compras, os portais e a persistência da assistência.
