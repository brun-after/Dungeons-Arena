// Assinaturas visuais das skills (marco 26, 29/10/2026, D-124). Só os nomes: a lista fechada que o campo
// `visual.assinatura` aceita (o parser confere) e os toques de `visual.variante`. O desenho de cada uma fica no render
// (render/vfx/assinaturas.ts), que precisa cobrir todos os nomes daqui.

export const ASSINATURAS_VISUAIS = [
  // Fogo.
  'bola_de_fogo', 'bola_de_fogo_projetil', 'explosao_de_fogo', 'lamina_em_brasa', 'ciclone_de_fogo', 'anel_de_chamas',
  'pilar_de_fogo', 'rastro_de_fogo', 'meteoro', 'chuva_de_brasas', 'lanca_chamas', 'risco_de_fogo', 'mao_em_chamas',
  'chamas_sombrias',
  // Corrente.
  'corrente', 'corrente_sombria', 'grilhoes', 'turbilhao_de_correntes', 'ariete', 'laco',
  // Raio.
  'relampago', 'raio_em_cadeia', 'feixe_eletrico', 'esfera_de_plasma', 'tempestade_de_raios', 'toque_eletrico',
  'cone_eletrico', 'mergulho_do_trovao',
  // Gelo.
  'lanca_de_gelo', 'nova_glacial', 'chao_congelado', 'cometa_de_gelo', 'estilhaco_de_gelo', 'cone_de_gelo',
  'toque_de_gelo', 'tempestade_de_gelo',
  // Terra.
  'pedregulho', 'estaca_de_pedra', 'abalo_sismico', 'muralha_de_pedra', 'salto_esmagador', 'pele_de_pedra',
  'queda_de_aco', 'golpe_pesado',
  // Veneno.
  'dardo_toxico', 'nevoa_venenosa', 'seiva_corrosiva', 'golpe_viscoso', 'cone_toxico', 'poca_toxica',
  // Trevas e necromancia.
  'cranio', 'garras_do_ossuario', 'ceifa_de_almas', 'mortalha', 'explosao_cadaverica', 'levante_profano', 'fios_de_vida',
  'comando_sepulcral', 'golpe_sombrio', 'raio_vampirico', 'passo_sombrio', 'veu_da_noite', 'troca_sombria', 'invocacao',
  'campo_de_ossos', 'hoste_espectral', 'marca_sombria', 'peste',
  // Arcano e psíquico.
  'dardo_arcano', 'seta_arcana', 'flecha_arcana', 'orbe_instavel', 'piscar', 'mente_partida', 'agulha_mental',
  'telecinese', 'onda_de_repulsao', 'sobrecarga_arcana', 'runa_amplificadora', 'dissipar', 'afinidade_elemental',
  'singularidade', 'supernova', 'pressagio', 'impulso', 'eco_arcano', 'prisma',
  // Luz e suporte.
  'cura', 'barreira', 'purificacao', 'circulo_de_amparo', 'lanca_radiante', 'asas_da_aurora', 'chuva_de_estrelas',
  'bencao', 'retorno',
  // Físico e guerreiro.
  'golpe', 'golpe_atordoante', 'investida', 'investida_de_escudo', 'redemoinho', 'brado', 'onda_de_brado', 'desafio',
  'contragolpe', 'contragolpe_arco', 'corte_dilacerante', 'postura_de_aparo', 'muralha_de_aco', 'chuva_de_laminas',
  // Arqueiro.
  'flecha', 'flecha_perfurante', 'chuva_de_flechas', 'leque_de_flechas', 'armadilha_de_caca', 'marca_do_cacador',
  'rolamento', 'olho_de_aguia', 'teia', 'armar_teia', 'campo_minado', 'rede_de_caca', 'flecha_explosiva',
  // Falcão e vento.
  'mergulho', 'rasante', 'tempestade_de_penas', 'grito_do_falcao', 'garras_cegantes', 'vigia', 'presa_dupla',
  'furacao', 'revoada',
  // Marco 27 (29/10/2026, D-126): o básico de cada arma de classe (render/vfx/familias/armas.ts).
  'arma_machado', 'arma_lanca', 'arma_montante', 'arma_espada', 'arma_maca', 'arma_sabre', 'arma_mangual', 'arma_rapieira',
  'arma_besta', 'arma_composto', 'arma_arcocurto', 'arma_arco', 'arma_elfico', 'arma_chifre', 'arma_arcoguerra', 'arma_arcocaca',
  'arma_tomo', 'arma_codice', 'arma_mares', 'arma_estelar', 'arma_prisma', 'arma_espelhos', 'arma_orbital', 'arma_vazio',
  'arma_cajado', 'arma_praga', 'arma_foice', 'arma_cova', 'arma_lamento', 'arma_sanguineo', 'arma_espectro', 'arma_colheita',
  'arma_chakram', 'arma_adaga', 'arma_machadinha', 'arma_shuriken', 'arma_duplo', 'arma_arpeu', 'arma_falcoeiro', 'arma_serrilhado',
  'arma_solo_amaldicoado', 'arma_bumerangue',
] as const;
export type AssinaturaVisual = (typeof ASSINATURAS_VISUAIS)[number];

/**
 * O toque que a variante acrescenta à assinatura (D-124): a matéria que se soma no acerto e na área. Duas ultimates da
 * mesma classe com a mesma assinatura se distinguem pelo toque (e pela cor).
 */
export const VARIANTES_VISUAIS = ['brasas', 'faiscas', 'penas', 'ossos', 'gelo', 'sangue', 'estrelas', 'runas', 'pedras', 'almas', 'laminas', 'folhas', 'bolhas', 'som'] as const;
export type VarianteVisual = (typeof VARIANTES_VISUAIS)[number];
