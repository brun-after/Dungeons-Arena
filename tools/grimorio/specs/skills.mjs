// Skills do marco 24 (24/10/2026): as 20 de classe novas, as 12 gerais ativas novas, as 14 passivas gerais novas e as que
// mudam (o Guerreiro v1.2, as conversões da v1.1). Cada entrada vira (ou substitui) um registro de src/data/skills.json.
// Os textos são os do Grimório; os números seguem o patamar das skills de hoje (2d6, 4–6 de mana, 5–10 s de recarga).
import { ef, eu, forma, habilidade } from './dsl.mjs';

const visual = (cor, impacto, extra = {}) => ({ cor, impacto, ...extra });
const ev = (tres, cinco) => ({ 3: tres, 5: cinco });
const marcos = (dois, quatro) => ({ 2: dois, 4: quatro });

/** Campos comuns de uma skill ativa. */
function ativa(id, nome, o) {
  return habilidade({
    id,
    nome,
    grau: 'A',
    nivelMinimo: 1,
    escalaCom: undefined,
    ...o,
  });
}

/** Passiva geral: não se conjura; a ficha lê o bloco `passiva`. */
function passiva(id, nome, familia, icone, tipo, campos) {
  return {
    id, nome, familiaEvolucao: familia, grau: 'A', icone, tipoAtaque: 'fisico', formulaDano: null, formulaCura: null,
    alcanceCelulas: 0, tipoArea: 'nenhuma', raioArea: 0, custoRecurso: 0, recargaMs: 0, conjuracaoMs: 500,
    politicaAlvo: 'proprio', politicaImpacto: 'proprio', interrupcao: 'interrompivel', velocidadeProjetil: 0, efeitos: [],
    passiva: { tipo, ...campos },
  };
}

// ---------------- Guerreiro (v1.2) ----------------
const guerreiro = [
  ativa('redemoinho', 'Redemoinho', {
    familiaEvolucao: 'tecnica', grau: 'A', icone: 'redemoinho', tipoAtaque: 'fisico', formulaDano: '2d6', ...forma.aoRedor(1),
    custoRecurso: 0, custoVida: 4, recargaMs: 6000, conjuracaoMs: 500,
    efeitos: [eu(ef.escudoAc(2, 10, 5))],
    visual: visual('#c0392b', 'vento', { camera: 'leve', som: 'golpe', animacao: 'giro' }),
    marcos: marcos({ texto: 'Puxa 1 célula para o centro', efeitos: [ef.puxa(1)] }, { texto: 'Os atingidos ficam atolados (−10%) por 1 s', efeitos: [ef.atola(10, 1)] }),
    evolucoes: ev(['amplo', 'brutal'], ['sanguessuga', 'eficiente']),
    variantes: { frenesi: { texto: '+1 de raio, e puxa 1 célula para dentro', raio: 1, alcance: 1, efeitos: [ef.puxa(1)] } },
  }),
  ativa('investida_de_escudo', 'Investida de escudo', {
    familiaEvolucao: 'tecnica', grau: 'B', icone: 'escudo', tipoAtaque: 'fisico', formulaDano: '1d8', ...forma.linha(2),
    custoRecurso: 3, recargaMs: 8000, conjuracaoMs: 250, mobilidade: 'livre',
    efeitos: [ef.avanca(2), ef.empurra(1), eu(ef.escudoAc(4, 16, 6)), eu(ef.intercepta(3, 0.6))],
    visual: visual('#95a5a6', 'faiscas', { conjuracao: 'cristais', camera: 'leve', som: 'golpe' }),
    tags: ['movimento'],
    marcos: marcos({ texto: 'O escudo dura 20% mais', duracaoPct: 20 }, { texto: 'Também cura 4', efeitos: [eu(ef.cura(4))] }),
    evolucoes: ev(['controle', 'eficiente'], ['fortificado', 'brutal']),
    variantes: { frenesi: { texto: 'Avança 4 células, e quem é atingido fica atordoado por 0,5 s', alcance: 2, trocar: [ef.avanca(4)], efeitos: [ef.atordoa(0.5)] } },
  }),
  ativa('brado', 'Brado', {
    familiaEvolucao: 'suporte', grau: 'A', icone: 'grito', tipoAtaque: 'fisico', ...forma.aliados(2),
    custoRecurso: 4, recargaMs: 15000, conjuracaoMs: 300,
    efeitos: [ef.bonus(20, 8), ef.fase(0, 'brado_onda')],
    visual: visual('#f39c12', 'estrelas', { conjuracao: 'anel', som: 'nivel' }),
    marcos: marcos({ texto: 'O bônus dura 25% mais', duracaoPct: 25 }, { texto: 'Os hostis atingidos ficam sem golpes físicos por 1 s', efeitos: [ef.semAtaque(1)] }),
    evolucoes: ev(['controle', 'eficiente'], ['fortificado', 'amplo']),
    variantes: { frenesi: { texto: 'A onda empurra 2 células e tira lentidão e medo dos aliados', efeitos: [ef.libertar()], trocar: [ef.fase(0, 'brado_onda_frenesi')] } },
  }),
  ativa('brado_onda', 'Brado (onda)', {
    familiaEvolucao: 'suporte', icone: 'grito', tipoAtaque: 'fisico', formulaDano: '1d4', ...forma.aoRedor(2), interna: true,
    efeitos: [ef.empurra(1)], visual: visual('#f39c12', 'anel', { som: 'golpe' }),
  }),
  ativa('brado_onda_frenesi', 'Brado (onda no Frenesi)', {
    familiaEvolucao: 'suporte', icone: 'grito', tipoAtaque: 'fisico', formulaDano: '1d4', ...forma.aoRedor(2), interna: true,
    efeitos: [ef.empurra(2)], visual: visual('#ff6a00', 'anel', { som: 'golpe' }),
  }),
  ativa('corrente', 'Corrente', {
    familiaEvolucao: 'tecnica', grau: 'A', icone: 'corrente', tipoAtaque: 'fisico', formulaDano: '1d6', ...forma.toque(4),
    custoRecurso: 3, recargaMs: 8000, conjuracaoMs: 400,
    efeitos: [ef.puxa(3), eu(ef.critico(3))],
    visual: visual('#7f8c8d', 'corte', { som: 'golpe' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Quem é puxado fica atordoado 0,5 s', efeitos: [ef.atordoa(0.5)] }),
    evolucoes: ev(['brutal', 'controle'], ['cadeia', 'eco']),
    variantes: { frenesi: { texto: 'Puxa também os hostis a até 1 célula do alvo', mods: ['encadear'] } },
  }),
  ativa('lamina_em_brasa', 'Lâmina em brasa', {
    familiaEvolucao: 'fogo', grau: 'A', icone: 'fogo', tipoAtaque: 'fisico', formulaDano: '1d10', ...forma.cone(3, 3),
    custoRecurso: 3, recargaMs: 6000, conjuracaoMs: 500, elemento: 'fogo',
    visual: visual('#ff7b39', 'chamas', { conjuracao: 'brasas', camera: 'leve', som: 'golpe' }),
    marcos: marcos({ texto: 'A queimadura dura 30% mais', duracaoPct: 30 }, { texto: 'O fogo abre a guarda: expõe (+15%) por 3 s', efeitos: [ef.expoe(15, 3)] }),
    evolucoes: ev(['brutal', 'elemental_raio'], ['eficiente', 'eco']),
    variantes: {
      furia_alta: { texto: 'Arco maior, e o chão fica em brasa por 2 s', raio: 1, alcance: 1, efeitos: [eu(ef.rastroFogo(3, 2))] },
      frenesi: { texto: 'Sai sem tempo de carga', conjuracaoPct: -100 },
    },
  }),
  ativa('desafio', 'Desafio', {
    familiaEvolucao: 'psiquico', grau: 'A', icone: 'grito', tipoAtaque: 'fisico', ...forma.aoRedor(3),
    custoRecurso: 3, recargaMs: 12000, conjuracaoMs: 200,
    efeitos: [ef.desafia(15, 3), eu(ef.furia(6))],
    visual: visual('#e74c3c', 'anel', { conjuracao: 'sangue', som: 'nivel' }),
    marcos: marcos({ texto: 'O desafio dura 1 s a mais', duracaoPct: 30 }, { texto: 'Os desafiados ficam expostos (+10%)', efeitos: [ef.expoe(10, 3)] }),
    evolucoes: ev(['controle', 'amplo'], ['eficiente', 'fortificado']),
    variantes: { frenesi: { texto: 'Alcance de 5 células, e o bônus sobe para +25%', raio: 2, alcance: 2, trocar: [ef.desafia(25, 3)] } },
  }),
  ativa('salto_esmagador', 'Salto esmagador', {
    familiaEvolucao: 'terra', grau: 'S', icone: 'investida', tipoAtaque: 'fisico', formulaDano: '2d6', ...forma.area(4, 1),
    custoRecurso: 4, recargaMs: 10000, conjuracaoMs: 400, mobilidade: 'livre',
    efeitos: [ef.atordoa(0.5)],
    visual: visual('#a1887f', 'pedra', { camera: 'forte', som: 'explosao' }),
    tags: ['movimento'],
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: '+1 de raio', raio: 1 }),
    evolucoes: ev(['brutal', 'amplo'], ['controle', 'elemental_terra']),
    variantes: { frenesi: { texto: 'Atordoa por 1 s', trocar: [ef.atordoa(1)] } },
  }),
  ativa('contragolpe', 'Contragolpe', {
    familiaEvolucao: 'tecnica', grau: 'A', icone: 'escudo', tipoAtaque: 'fisico', ...forma.proprio(),
    custoRecurso: 2, recargaMs: 7000, conjuracaoMs: 100, mobilidade: 'lenta',
    efeitos: [ef.contragolpe('contragolpe_arco', 1.5)],
    visual: visual('#f0f3f4', 'anel', { som: 'golpe' }),
    marcos: marcos({ texto: 'A postura dura 30% mais', duracaoPct: 30 }, { texto: 'A resposta deixa o atacante exposto (+15%)', efeitos: [] }),
    evolucoes: ev(['eficiente', 'controle'], ['fortificado', 'brutal']),
    variantes: { frenesi: { texto: 'O arco vira 360°', trocar: [ef.contragolpe('contragolpe_giro', 1.5)] } },
  }),
  ativa('contragolpe_arco', 'Contragolpe (arco)', {
    familiaEvolucao: 'tecnica', icone: 'espada', tipoAtaque: 'fisico', formulaDano: '2d6', ...forma.cone(2, 2), interna: true,
    visual: visual('#e74c3c', 'corte', { som: 'golpe' }),
  }),
  ativa('contragolpe_giro', 'Contragolpe (giro)', {
    familiaEvolucao: 'tecnica', icone: 'redemoinho', tipoAtaque: 'fisico', formulaDano: '2d6', ...forma.aoRedor(2), interna: true,
    visual: visual('#e74c3c', 'vento', { som: 'golpe' }),
  }),
];

// ---------------- Mago ----------------
const ENC = ['fogo', 'gelo', 'raio', 'terra', 'veneno', 'trevas', 'sagrado'];
const porElemento = (texto) => Object.fromEntries(ENC.map((x) => [`enc_${x}`, { texto: texto(x), elemento: x }]));
const mago = [
  ativa('afinidade_elemental', 'Afinidade elemental', {
    familiaEvolucao: 'suporte', grau: 'S', icone: 'estrela', tipoAtaque: 'magico', ...forma.proprio(),
    custoRecurso: 4, recargaMs: 16000, conjuracaoMs: 300,
    efeitos: [ef.bonus(20, 8)],
    tags: ['elemental'],
    visual: visual('#c39bd3', 'estrelas', { conjuracao: 'runas', som: 'magia' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Também devolve 4 de mana', efeitos: [ef.mana(4)] }),
    evolucoes: ev(['eficiente', 'controle'], ['fortificado', 'eco']),
  }),
  ativa('sobrecarga_arcana', 'Sobrecarga arcana', {
    familiaEvolucao: 'arcana', grau: 'A', icone: 'raio', tipoAtaque: 'magico', ...forma.proprio(),
    custoRecurso: 0, custoVida: 6, recargaMs: 10000, conjuracaoMs: 150,
    efeitos: [ef.sobrecarga(40, 10)],
    visual: visual('#a569bd', 'runas', { conjuracao: 'relampago', som: 'magia' }),
    marcos: marcos({ texto: 'Recarga 15% menor', recargaPct: -15 }, { texto: 'A magia sobrecarregada também é crítica', efeitos: [ef.critico(10)] }),
    evolucoes: ev(['eficiente', 'brutal'], ['controle', 'eco']),
  }),
  ativa('piscar', 'Piscar', {
    familiaEvolucao: 'arcana', grau: 'A', icone: 'teleporte', tipoAtaque: 'magico', ...forma.celula(4),
    custoRecurso: 3, recargaMs: 8000, conjuracaoMs: 100,
    efeitos: [ef.passo(4), eu(ef.fase(0, 'piscar_eco'))],
    tags: ['movimento'],
    visual: visual('#9b8cff', 'runas', { conjuracao: 'brilho', som: 'magia' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Recarga 20% menor', recargaPct: -20 }),
    evolucoes: ev(['eficiente', 'longo_alcance'], ['controle', 'eco']),
  }),
  ativa('piscar_eco', 'Eco do Piscar', {
    familiaEvolucao: 'arcana', icone: 'explosao', tipoAtaque: 'magico', formulaDano: '1d6', ...forma.area(30, 1), interna: true,
    visual: visual('#9b8cff', 'explosao', { som: 'explosao' }),
    variantes: porElemento((x) => `O eco é de ${x}`),
  }),
  ativa('orbe_instavel', 'Orbe instável', {
    familiaEvolucao: 'arcana', grau: 'S', icone: 'cometa', tipoAtaque: 'magico', formulaDano: '2d8', ...forma.area(6, 1),
    custoRecurso: 5, recargaMs: 9000, conjuracaoMs: 1100,
    visual: visual('#b38cff', 'explosao', { conjuracao: 'runas', viagem: 'brilho', camera: 'leve', som: 'explosao' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: '+1 de raio', raio: 1 }),
    evolucoes: ev(['amplo', 'brutal'], ['eficiente', 'eco']),
    variantes: porElemento((x) => `Carrega o elemento ${x}`),
  }),
];

// ---------------- Arqueiro ----------------
const arqueiro = [
  ativa('olho_de_aguia', 'Olho de águia', {
    familiaEvolucao: 'suporte', grau: 'S', icone: 'asa', tipoAtaque: 'fisico', ...forma.proprio(),
    custoRecurso: 3, recargaMs: 18000, conjuracaoMs: 200,
    efeitos: [ef.pressa(30, 6), ef.critico(6)],
    visual: visual('#d4ac0d', 'estrelas', { conjuracao: 'brilho', som: 'nivel' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Recarga 15% menor', recargaPct: -15 }),
    evolucoes: ev(['eficiente', 'controle'], ['fortificado', 'eco']),
  }),
  ativa('flecha_explosiva', 'Flecha explosiva', {
    familiaEvolucao: 'fogo', grau: 'A', icone: 'explosao', tipoAtaque: 'fisico', formulaDano: '2d6', ...forma.area(7, 1),
    custoRecurso: 4, recargaMs: 7000, conjuracaoMs: 600, escalaCom: 'destreza',
    efeitos: [ef.empurra(1)], tags: ['flechas'],
    visual: visual('#e67e22', 'explosao', { viagem: 'esteira', camera: 'leve', som: 'explosao' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Queima os atingidos', efeitos: [ef.queima(2, 3)] }),
    evolucoes: ev(['amplo', 'brutal'], ['elemental_fogo', 'eco']),
  }),
  ativa('rolamento', 'Rolamento', {
    familiaEvolucao: 'sombra', grau: 'B', icone: 'botas', tipoAtaque: 'fisico', ...forma.celula(3),
    custoRecurso: 2, recargaMs: 7000, conjuracaoMs: 0, mobilidade: 'livre',
    efeitos: [ef.passo(3), eu(ef.critico(3))], tags: ['movimento'],
    visual: visual('#c9b37c', 'vento', { som: 'golpe' }),
    marcos: marcos({ texto: 'Recarga 15% menor', recargaPct: -15 }, { texto: 'Esquiva 30% por 1 s', efeitos: [eu(ef.esquiva(30, 1))] }),
    evolucoes: ev(['eficiente', 'longo_alcance'], ['controle', 'fortificado']),
  }),
  ativa('marca_do_cacador', 'Marca do caçador', {
    familiaEvolucao: 'tecnica', grau: 'A', icone: 'alvo', tipoAtaque: 'fisico', ...forma.toque(9),
    custoRecurso: 2, recargaMs: 9000, conjuracaoMs: 200,
    efeitos: [ef.marcaCacador(20, 8)],
    visual: visual('#d4ac0d', 'brilho', { som: 'projetil' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Também expõe (+10%)', efeitos: [ef.expoe(10, 4)] }),
    evolucoes: ev(['controle', 'eficiente'], ['longo_alcance', 'eco']),
  }),
  ativa('armadilha_de_caca', 'Armadilha de caça', {
    familiaEvolucao: 'tecnica', grau: 'A', icone: 'aviso', tipoAtaque: 'fisico', ...forma.area(4, 0),
    custoRecurso: 3, recargaMs: 9000, conjuracaoMs: 400,
    efeitos: [ef.armadilha(6, { enraizado: 1500 }, 30)],
    visual: visual('#b9770e', 'farpas', { som: 'golpe' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Recarga 15% menor', recargaPct: -15 }),
    evolucoes: ev(['controle', 'eficiente'], ['brutal', 'eco']),
  }),
];

// ---------------- Necromante ----------------
const necromante = [
  ativa('comando_sepulcral', 'Comando sepulcral', {
    familiaEvolucao: 'sombra', grau: 'B', icone: 'coroa', tipoAtaque: 'magico', ...forma.proprio(),
    custoRecurso: 4, recargaMs: 12000, conjuracaoMs: 400, mobilidade: 'lenta', tags: ['necromancia'],
    efeitos: [ef.comandar(30, 4)],
    visual: visual('#8b68d9', 'sombra', { conjuracao: 'sombra', som: 'magia' }),
    marcos: marcos({ texto: 'Custa 15% menos mana', custoPct: -15 }, { texto: 'Dura 25% mais', duracaoPct: 25 }),
    evolucoes: ev(['eficiente', 'controle'], ['fortificado', 'amplo']),
  }),
  ativa('explosao_cadaverica', 'Explosão cadavérica', {
    familiaEvolucao: 'sombra', grau: 'A', icone: 'caveira', tipoAtaque: 'magico', ...forma.toque(6),
    custoRecurso: 4, recargaMs: 9000, conjuracaoMs: 400, tags: ['necromancia'], elemento: 'trevas',
    efeitos: [ef.detona(2, 60)],
    visual: visual('#7d3c98', 'explosao', { conjuracao: 'sombra', camera: 'leve', som: 'explosao' }),
    marcos: marcos({ texto: 'A explosão definha', efeitos: [ef.definha(15, 3)] }, { texto: 'Recarga 20% menor', recargaPct: -20 }),
    evolucoes: ev(['brutal', 'amplo'], ['eficiente', 'eco']),
  }),
  ativa('levante_profano', 'Levante profano', {
    familiaEvolucao: 'sombra', grau: 'S', icone: 'invocar', tipoAtaque: 'magico', ...forma.proprio(),
    custoRecurso: 6, recargaMs: 20000, conjuracaoMs: 700, tags: ['necromancia'],
    efeitos: [ef.invocaTemp('esqueleto_profano', 2, 12)],
    visual: visual('#8b68d9', 'sombra', { conjuracao: 'runas', som: 'magia' }),
    marcos: marcos({ texto: 'Os esqueletos duram 25% mais', duracaoPct: 25 }, { texto: 'Recarga 15% menor', recargaPct: -15 }),
    evolucoes: ev(['eficiente', 'controle'], ['fortificado', 'eco']),
  }),
];

// ---------------- Aventureiro (o falcão) ----------------
const falcao = (o) => ({ familiaEvolucao: 'tecnica', tipoAtaque: 'fisico', escalaCom: 'destreza', tags: ['falcao'], ...o });
const aventureiro = [
  ativa('mergulho', 'Mergulho', falcao({
    grau: 'B', icone: 'asa', formulaDano: '2d6+4', ...forma.toque(8), custoRecurso: 3, recargaMs: 4000, conjuracaoMs: 300,
    efeitos: [ef.atordoa(0.3)],
    visual: visual('#7fbde8', 'farpas', { viagem: 'vento', som: 'golpe' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Expõe o alvo (+10%)', efeitos: [ef.expoe(10, 3)] }),
    evolucoes: ev(['brutal', 'eficiente'], ['eco', 'longo_alcance']),
  })),
  ativa('grito_do_falcao', 'Grito do falcão', falcao({
    grau: 'B', icone: 'grito', ...forma.toque(8), custoRecurso: 2, recargaMs: 9000, conjuracaoMs: 200,
    efeitos: [ef.expoe(15, 5)],
    visual: visual('#aed6f1', 'anel', { som: 'nivel' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Também deixa lento (−20%)', efeitos: [ef.resfria(20, 2)] }),
    evolucoes: ev(['controle', 'eficiente'], ['amplo', 'eco']),
  })),
  ativa('garras_cegantes', 'Garras cegantes', falcao({
    grau: 'A', icone: 'mao', formulaDano: '1d6', ...forma.toque(8), custoRecurso: 3, recargaMs: 9000, conjuracaoMs: 300,
    efeitos: [ef.cega(50, 3)],
    visual: visual('#5b5b6e', 'corte', { som: 'golpe' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Faz sangrar', efeitos: [ef.sangra(2, 3)] }),
    evolucoes: ev(['controle', 'brutal'], ['eficiente', 'eco']),
  })),
  ativa('vigia', 'Vigia', falcao({
    familiaEvolucao: 'suporte', grau: 'A', icone: 'escudo', ...forma.proprio(), custoRecurso: 3, recargaMs: 14000, conjuracaoMs: 200,
    efeitos: [ef.intercepta(5, 5)],
    visual: visual('#7fbde8', 'vento', { conjuracao: 'anel', som: 'cura' }),
    marcos: marcos({ texto: 'Dura 20% mais', duracaoPct: 20 }, { texto: 'Também dá 6 de escudo', efeitos: [ef.escudo(6, 5)] }),
    evolucoes: ev(['eficiente', 'controle'], ['fortificado', 'eco']),
  })),
  ativa('rasante', 'Rasante', falcao({
    grau: 'A', icone: 'investida', formulaDano: '2d6', ...forma.linha(6), custoRecurso: 4, recargaMs: 7000, conjuracaoMs: 400,
    visual: visual('#7fbde8', 'vento', { camera: 'leve', som: 'golpe' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Faz sangrar', efeitos: [ef.sangra(2, 3)] }),
    evolucoes: ev(['brutal', 'eficiente'], ['longo_alcance', 'eco']),
  })),
  ativa('tempestade_de_penas', 'Tempestade de penas', falcao({
    grau: 'S', icone: 'redemoinho', formulaDano: '1d6', ...forma.area(8, 1, 'hostil'), custoRecurso: 5, recargaMs: 10000, conjuracaoMs: 500,
    efeitos: [ef.resfria(30, 2), ef.sangra(1, 3)],
    visual: visual('#d6eaf8', 'vento', { conjuracao: 'leque', camera: 'leve', som: 'golpe' }),
    marcos: marcos({ texto: '+1 de raio', raio: 1 }, { texto: 'Dura 25% mais', duracaoPct: 25 }),
    evolucoes: ev(['amplo', 'controle'], ['eficiente', 'eco']),
  })),
  ativa('retorno_ao_punho', 'Retorno ao punho', falcao({
    familiaEvolucao: 'suporte', grau: 'A', icone: 'cura', ...forma.aliado(6), formulaCura: '2d6', custoRecurso: 3, recargaMs: 12000, conjuracaoMs: 200,
    efeitos: [eu(ef.zera('mergulho'))],
    visual: visual('#a9dfbf', 'sagrado', { som: 'cura' }),
    marcos: marcos({ texto: 'Cura 20% mais', danoPct: 20 }, { texto: 'Também dá 4 de escudo', efeitos: [ef.escudo(4, 4)] }),
    evolucoes: ev(['eficiente', 'fortificado'], ['controle', 'eco']),
  })),
  ativa('presa_dupla', 'Presa dupla', falcao({
    grau: 'A', icone: 'espada', formulaDano: '2d6', ...forma.toque(2), custoRecurso: 4, recargaMs: 8000, conjuracaoMs: 300,
    efeitos: [ef.fase(0.2, 'presa_dupla_falcao')],
    visual: visual('#7fbde8', 'corte', { som: 'golpe' }),
    marcos: marcos({ texto: 'Recarga 15% menor', recargaPct: -15 }, { texto: 'Faz sangrar', efeitos: [ef.sangra(2, 3)] }),
    evolucoes: ev(['brutal', 'eficiente'], ['sanguessuga', 'eco']),
  })),
  ativa('presa_dupla_falcao', 'Presa dupla (falcão)', falcao({
    icone: 'asa', formulaDano: '1d8', ...forma.toque(30), interna: true,
    visual: visual('#7fbde8', 'farpas', { som: 'golpe' }),
  })),
];

// ---------------- Gerais ativas novas ----------------
const gerais = [
  ativa('dissipar', 'Dissipar', { familiaEvolucao: 'arcana', icone: 'runa', tipoAtaque: 'magico', ...forma.area(6, 1, 'hostil'), custoRecurso: 4, recargaMs: 10000, conjuracaoMs: 500,
    efeitos: [ef.dissipa(2)], visual: visual('#aed6f1', 'runas', { som: 'magia' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Tira 1 efeito a mais', efeitos: [ef.dissipa(1)] }), evolucoes: ev(['amplo', 'eficiente'], ['longo_alcance', 'eco']) }),
  ativa('runa_amplificadora', 'Runa amplificadora', { familiaEvolucao: 'arcana', grau: 'S', icone: 'runa', tipoAtaque: 'magico', ...forma.aliados(2), custoRecurso: 5, recargaMs: 16000, conjuracaoMs: 500,
    efeitos: [ef.bonus(20, 6), ef.pressa(20, 6)], tags: ['magico'], visual: visual('#9b8cff', 'runas', { conjuracao: 'runas', som: 'magia' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Também devolve 2 de mana', efeitos: [ef.mana(2)] }), evolucoes: ev(['amplo', 'eficiente'], ['fortificado', 'controle']) }),
  ativa('impulso', 'Impulso', { familiaEvolucao: 'suporte', grau: 'B', icone: 'botas', tipoAtaque: 'magico', ...forma.aliados(3), custoRecurso: 3, recargaMs: 12000, conjuracaoMs: 200,
    efeitos: [ef.acelera(30, 3), ef.libertar()], visual: visual('#76d7c4', 'vento', { som: 'cura' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: '+1 de raio', raio: 1 }), evolucoes: ev(['amplo', 'eficiente'], ['controle', 'fortificado']) }),
  ativa('rastro_igneo', 'Rastro ígneo', { familiaEvolucao: 'fogo', grau: 'A', icone: 'fogo', tipoAtaque: 'magico', ...forma.celula(4), custoRecurso: 4, recargaMs: 9000, conjuracaoMs: 150, elemento: 'fogo',
    efeitos: [ef.rastroFogo(3, 3), ef.passo(4)], tags: ['movimento'], visual: visual('#ff7b39', 'chamas', { som: 'magia' }),
    marcos: marcos({ texto: 'O rastro dura 30% mais', duracaoPct: 30 }, { texto: 'Recarga 15% menor', recargaPct: -15 }), evolucoes: ev(['eficiente', 'longo_alcance'], ['controle', 'eco']) }),
  ativa('anel_de_chamas', 'Anel de chamas', { familiaEvolucao: 'fogo', grau: 'S', icone: 'nova', tipoAtaque: 'magico', formulaDano: '1d6', ...forma.aoRedor(2), custoRecurso: 5, recargaMs: 12000, conjuracaoMs: 400, elemento: 'fogo',
    efeitos: [ef.empurra(1), eu(ef.fase(1, 'anel_de_chamas_pulso')), eu(ef.fase(2, 'anel_de_chamas_pulso')), eu(ef.fase(3, 'anel_de_chamas_pulso'))], visual: visual('#ff5722', 'chamas', { conjuracao: 'brasas', camera: 'leve', som: 'explosao' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: '+1 de raio', raio: 1 }), evolucoes: ev(['amplo', 'controle'], ['brutal', 'eficiente']) }),
  ativa('anel_de_chamas_pulso', 'Anel de chamas (pulso)', { familiaEvolucao: 'fogo', icone: 'nova', tipoAtaque: 'magico', formulaDano: '1d4', ...forma.aoRedor(2), elemento: 'fogo', interna: true,
    efeitos: [ef.empurra(1)], visual: visual('#ff5722', 'chamas', { som: 'magia' }) }),
  ativa('incinerar', 'Incinerar', { familiaEvolucao: 'fogo', grau: 'A', icone: 'fogo', tipoAtaque: 'magico', formulaDano: '1d6', ...forma.toque(6), custoRecurso: 4, recargaMs: 8000, conjuracaoMs: 500, elemento: 'fogo',
    efeitos: [ef.consome('queimando', 50), ef.queima(2, 2)], visual: visual('#ff3d00', 'explosao', { conjuracao: 'chamas', som: 'explosao' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Consome com mais força', danoPct: 20 }), evolucoes: ev(['brutal', 'eficiente'], ['longo_alcance', 'eco']) }),
  ativa('seiva_corrosiva', 'Seiva corrosiva', { familiaEvolucao: 'veneno', grau: 'A', icone: 'veneno', tipoAtaque: 'magico', ...forma.proprio(), custoRecurso: 3, recargaMs: 12000, conjuracaoMs: 200,
    efeitos: [ef.reflexo({ envenenado: { valor: 2, pct: 50, duracaoMs: 4000 } }, 5)], visual: visual('#58d68d', 'bolhas', { som: 'magia' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Também dá 6 de escudo', efeitos: [ef.escudo(6, 5)] }), evolucoes: ev(['eficiente', 'fortificado'], ['controle', 'eco']) }),
  ativa('pedregulho', 'Pedregulho', { familiaEvolucao: 'terra', grau: 'A', icone: 'pedra', tipoAtaque: 'fisico', formulaDano: '2d6', ...forma.linha(5), custoRecurso: 4, recargaMs: 7000, conjuracaoMs: 600, elemento: 'terra',
    efeitos: [ef.empurra(1)], visual: visual('#a1887f', 'pedra', { camera: 'leve', som: 'golpe' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Atola os atingidos', efeitos: [ef.atola(20, 2)] }), evolucoes: ev(['brutal', 'eficiente'], ['longo_alcance', 'eco']) }),
  ativa('asas_da_aurora', 'Asas da aurora', { familiaEvolucao: 'sagrado', grau: 'A', icone: 'asa', tipoAtaque: 'magico', ...forma.aliado(5), custoRecurso: 4, recargaMs: 12000, conjuracaoMs: 200, elemento: 'sagrado',
    efeitos: [ef.regenera(3, 4), ef.avanca(5)], tags: ['movimento'], visual: visual('#f7e9a0', 'sagrado', { som: 'cura' }),
    marcos: marcos({ texto: 'Cura 25% mais', duracaoPct: 25 }, { texto: 'Também dá 6 de escudo', efeitos: [ef.escudo(6, 4)] }), evolucoes: ev(['eficiente', 'longo_alcance'], ['fortificado', 'eco']) }),
  ativa('agulha_mental', 'Agulha mental', { familiaEvolucao: 'psiquico', grau: 'B', icone: 'olho', tipoAtaque: 'magico', ...forma.tiro(7, 18), custoRecurso: 2, recargaMs: 3000, conjuracaoMs: 300, elemento: 'psiquico',
    efeitos: [ef.dano(6)], visual: visual('#d980fa', 'estrelas', { viagem: 'brilho', som: 'magia' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Recarga 15% menor', recargaPct: -15 }), evolucoes: ev(['brutal', 'eficiente'], ['cadeia', 'eco']) }),
  ativa('telecinese', 'Telecinese', { familiaEvolucao: 'psiquico', grau: 'S', icone: 'puxar', tipoAtaque: 'magico', ...forma.toque(6), custoRecurso: 4, recargaMs: 10000, conjuracaoMs: 300, elemento: 'psiquico',
    efeitos: [ef.arremessa(3, 0.5)], visual: visual('#d980fa', 'runas', { som: 'magia' }),
    marcos: marcos({ texto: '+1 de alcance', alcance: 1 }, { texto: 'Atordoa mais', duracaoPct: 30 }), evolucoes: ev(['controle', 'eficiente'], ['longo_alcance', 'eco']) }),
  ativa('pressagio', 'Presságio', { familiaEvolucao: 'psiquico', grau: 'A', icone: 'olho', tipoAtaque: 'magico', ...forma.proprio(), custoRecurso: 3, recargaMs: 12000, conjuracaoMs: 150,
    efeitos: [ef.presagio(4)], visual: visual('#bb8fce', 'estrelas', { som: 'magia' }),
    marcos: marcos({ texto: 'Dura 25% mais', duracaoPct: 25 }, { texto: 'Recarga 15% menor', recargaPct: -15 }), evolucoes: ev(['eficiente', 'controle'], ['fortificado', 'eco']) }),
];

// ---------------- Passivas gerais novas ----------------
const CONTROLES = ['atordoar', 'congelado', 'enraizado', 'sem_movimento', 'silenciar', 'aterrorizado', 'confuso', 'sem_ataque'];
const passivas = [
  passiva('couraca_treinada', 'Couraça treinada', 'tecnica', 'peitoral', 'defensiva', { reducaoFisicoPct: 10 }),
  passiva('manto_runico', 'Manto rúnico', 'arcana', 'manto', 'defensiva', { reducaoMagicoPct: 15 }),
  passiva('foco_arcano', 'Foco arcano', 'arcana', 'runa', 'ofensiva', { tag: 'magico', danoPct: 10, recargaPct: -5 }),
  passiva('sangue_quente', 'Sangue quente', 'fogo', 'fogo', 'defensiva', { resistencias: { fogo: 25 }, duracaoRecebidaPct: { resfriado: -20, atolado: -20 } }),
  passiva('brasa_interior', 'Brasa interior', 'fogo', 'fogo', 'ofensiva', { aoAcertar: { chancePct: 10, efeito: { tipo: 'queimando', valor: 2, duracaoMs: 3000 } } }),
  passiva('imunidade_adquirida', 'Imunidade adquirida', 'veneno', 'veneno', 'defensiva', { resistencias: { veneno: 50 }, duracaoRecebidaPct: { definhando: -20, envenenado: -20 } }),
  passiva('toxinas_potentes', 'Toxinas potentes', 'veneno', 'veneno', 'ofensiva', { reforcoEstado: { tipo: 'envenenado', valorPct: 20, duracaoMs: 1000 } }),
  passiva('peso_da_rocha', 'Peso da rocha', 'terra', 'pedra', 'ofensiva', { danoContraEstados: { estados: ['enraizado', 'atordoar', 'sem_movimento'], pct: 15 } }),
  passiva('silhueta_esquiva', 'Silhueta esquiva', 'sombra', 'fantasma', 'defensiva', { esquivaPct: 8, esquivaInvisivelPct: 15 }),
  passiva('golpe_traicoeiro', 'Golpe traiçoeiro', 'sombra', 'adaga', 'ofensiva', { costasPct: 20 }),
  passiva('graca', 'Graça', 'sagrado', 'estrela', 'defensiva', { resistencias: { trevas: 25 }, curaRecebidaPct: 10 }),
  passiva('zelo', 'Zelo', 'sagrado', 'estrela', 'ofensiva', { tag: 'sagrado', danoPct: 15, resistenciaIgnoradaPct: 10 }),
  passiva('mente_blindada', 'Mente blindada', 'psiquico', 'olho', 'defensiva', { imunes: ['aterrorizado', 'confuso'], duracaoRecebidaPct: { silenciar: -30 } }),
  passiva('pressao_mental', 'Pressão mental', 'psiquico', 'olho', 'ofensiva', { danoContraEstados: { estados: CONTROLES, pct: 15 } }),
];

/** Passivas gerais que já existiam: ganham o tipo (defensiva/ofensiva) e a família da v1.1. */
export const PASSIVAS_ANTIGAS = {
  pele_de_pedra: { familia: 'terra', tipo: 'defensiva' },
  tenacidade: { familia: 'suporte', tipo: 'defensiva' },
  disciplina_marcial: { familia: 'tecnica', tipo: 'ofensiva' },
  fluxo_restaurador: { familia: 'suporte', tipo: 'ofensiva' },
};

/** Ajustes nas skills que já existem (v1.1): o que muda em cima do registro de hoje. */
export const AJUSTES = {
  troca_sombria: { familiaEvolucao: 'sombra' },
  flecha_venenosa: { alcanceCelulas: 8, efeitos: [{ tipo: 'envenenado', valor: 1, pct: 30, duracaoMs: 6000 }] },
  dardo_toxico: { alcanceCelulas: 4, efeitos: [{ tipo: 'envenenado', valor: 3, pct: 50, duracaoMs: 3000 }] },
};

/** Ids antigos do Guerreiro e os novos (a migração 24 renomeia nos saves; o jogo não tem mais os antigos). */
export const RENOMEADAS = { escudo_de_ferro: 'investida_de_escudo', grito_de_guerra: 'brado', golpe_flamejante: 'lamina_em_brasa' };

export const SKILLS = [...guerreiro, ...mago, ...arqueiro, ...necromante, ...aventureiro, ...gerais, ...passivas];
