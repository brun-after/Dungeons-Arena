// 05/11/2026 (marco 37): o 3D em tempo real só onde a GPU desenha. Com WebGL em software (SwiftShader, llvmpipe:
// navegadores sem GPU, máquinas virtuais, o Chromium sem tela do CI) cada quadro do palco trava a página por
// segundos; ali ficam o atlas pré-renderizado no jogo e a ilustração nos menus. Sem three.js aqui, para o menu
// decidir sem baixar o palco.

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;

let resposta: boolean | undefined;

/** Se há WebGL 2 desenhado pela GPU (a resposta fica guardada; o contexto de teste é descartado). */
export function webglAcelerado(): boolean {
  if (resposta !== undefined) return resposta;
  resposta = false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const placa = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
      resposta = !SOFTWARE.test(placa);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    resposta = false;
  }
  return resposta;
}
