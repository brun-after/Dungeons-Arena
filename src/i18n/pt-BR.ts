// Dicionário pt-BR (§5.5): nenhum texto de interface fica fixo no código.
export const ptBR = {
  'app.titulo': 'Dungeons Arena',
  'app.carregando': 'Carregando…',
  'erro.graficos': 'Não foi possível iniciar os gráficos (WebGL). Tente atualizar o navegador ou usar outro.',
  'controles.faixa': 'Controles de toque',
  'controles.joystick': 'Joystick de movimento',
  'controles.dpad': 'Direcional de movimento',
  'controles.ataque': 'Ataque básico',
  'controles.interagir': 'Interagir',
  'cabecalho.trocarControle': 'Trocar entre joystick e direcional',
  'cabecalho.trocarCamera': 'Trocar o modo da câmera',
  'cabecalho.controleJoystick': 'Joystick',
  'cabecalho.controleDpad': 'Direcional',
  'cabecalho.cameraJanela': 'Câmera: janela',
  'cabecalho.cameraCentralizada': 'Câmera: centro',
  'aviso.girar': 'Dica: o jogo fica melhor com o aparelho deitado.',
  'diag.rotulo': 'Diagnóstico',
} as const;

export type ChaveTexto = keyof typeof ptBR;
