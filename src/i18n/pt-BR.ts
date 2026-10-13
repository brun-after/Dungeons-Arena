// Dicionário pt-BR (§5.5): nenhum texto de interface fica fixo no código.
export const ptBR = {
  'app.titulo': 'Dungeons Arena',
  'app.subtitulo': 'RPG de ação em tempo real: campanha, arena e editor de fases',
  'app.status': 'Em construção: marco 1, fundação do motor',
  'nucleo.rotulo': 'Núcleo da simulação',
  'nucleo.tick': 'Tick',
  'nucleo.digest': 'Digest',
  'nucleo.entidades': 'Entidades',
  'nucleo.explicacao':
    'O mesmo núcleo que roda nos testes em Node está rodando aqui, a 60 ticks por segundo, com semente fixa.',
} as const;

export type ChaveTexto = keyof typeof ptBR;
