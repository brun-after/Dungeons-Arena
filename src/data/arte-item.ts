import { ehIcone, ICONES } from './icones';

const DESENHOS: Readonly<Record<string, string>> = {
  pocao: '<path fill="url(#vidro)" d="M9 3h6v5l4.4 7.8q2 4.7-2.9 5.3h-9q-4.9-.6-2.9-5.3L9 8Z"/><path fill="url(#rubi)" d="M7.1 14q3-1 5.3.2t4.5-.2l1.6 3q.8 2.6-2.3 2.7H7.8q-3-.1-2.3-2.7Z"/><path fill="url(#couro)" d="M9 2h6v4H9Z"/><path fill="none" stroke="#fff1db" d="m8.4 12-1.6 3.1m.3 2.8.4.5"/>',
  espada: '<path fill="url(#aco)" d="m7.6 14.1 9.5-11 4.6-.9-1 4.7-10.4 10.3Z"/><path fill="none" stroke="#f6e6c9" d="m9.5 14.9 10-10.6"/><path fill="url(#couro)" d="m7.1 15.9 1.5 1.5-3.9 4.2-2-2Z"/><path fill="url(#ouro)" d="m5.2 13.9 6.2 5.4-1.5 1.2-6-5.2Z"/>',
  elmo: '<path fill="url(#aco)" d="M3.9 14.7 4.7 8Q7 2.7 12.3 2.5 18.4 2.6 20 9.6l.4 5.7-2 5-3.3-1.6-1.4-5.5-4.1.1-1.1 5.8-3.1 1.4Z"/><path fill="url(#ouro)" d="M4.4 12.1Q12 8.3 20 12l.1 2.1q-7.7-3.8-16 .1Z"/><path fill="none" stroke="#f6e6c9" d="M6.4 8.8q1.5-3.5 4.1-4.1m.8 7.4-.5 4.6"/>',
  peitoral: '<path fill="url(#couro)" d="M6 3.6 9 2.9l3 3 3-3 3.3.6L22 7.4l-2 3.4-1.9-.6-.9 8.9-5.2 2.1-5.2-2.1-.9-8.9-2 .6L2 7.4Z"/><path fill="url(#aco)" d="M6.8 5.2 9 4.6l3 2.7 3-2.7 2.3.6-1.5 12.5-3.8 1.9-3.8-1.9Z"/><path fill="none" stroke="#dfbd86" d="m7.7 12.2 4.3 2.7 4.3-2.7m-8 3.4 3.7 2.2 3.7-2.2"/>',
  escudo: '<path fill="url(#ouro)" d="M12 2.5 21 5.6v6.2Q21 18.4 12 22q-9-3.6-9-10.2V5.6Z"/><path fill="url(#aco)" d="m12 4.6 6.8 2.2v5.1q0 5-6.8 8-6.8-3-6.8-8v-5Z"/><path fill="url(#ouro)" d="m12 7 3.2 4.4-3.2 5-3.2-5Z"/>',
  livro: '<path fill="url(#couro)" d="M4 3.3h12l3.5 2.8v14.6H6l-2-2.2Z"/><path fill="url(#ouro)" d="M6 17.8h11.5v2H6Z"/><path fill="url(#rubi)" d="m11.5 6 3.5 4.5-3.5 4-3.4-4Z"/><path fill="none" stroke="#d9b778" d="M6 5.5v10.2m9.5-10.2h1.8v2m0 5.4v2h-1.8"/>',
  pergaminho: '<path fill="url(#ouro)" d="M5 3.4h12.7q3.7 0 3.6 3.7h-3v10.8q0 2.8-2.5 3H5q-2.7-.4-2.7-3.8H6V6.5q0-1.7-1-3.1Z"/><path fill="none" stroke="#6e432e" d="M9 8h6m-6 3h6m-6 3h3"/><circle fill="url(#rubi)" cx="14.6" cy="16.2" r="2.5"/>',
  chave: '<path fill="url(#ouro)" fill-rule="evenodd" d="M8.2 4a5 5 0 1 0 3.6 8.4l2 2-1 1.5 1.8 1.8 1.4-1.2 1.1 1-1 1.6 1.8 1.7 3.2-3-7.7-7.6a5 5 0 0 0-5.2-6.2Zm0 2.4a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2Z"/>',
  pedra: '<path fill="url(#rubi)" d="m3.1 15.8 3.1-7.4 6.7-4.6 5.1 2.6 3.5 8.3-4.3 5.1-9.2.1Z"/><path fill="#ead6bd" opacity=".43" d="m6.2 8.4 6.7-4.6 2 6.2-4.8 5Z"/><path fill="none" stroke="#f0dbbf" d="m7.3 8.8 2.9 5.8 4.6-4.7 3.7-1.2"/>',
  cajado: '<path fill="url(#couro)" d="m4.7 22-1.8-1.1L14.6 7.8l1.8 1.5Z"/><path fill="url(#ouro)" d="M12.2 10.6 11.6 6l4.4-3.3 5.2.8.5 4.8-4 3.9-3.3-.4Z"/><path fill="url(#rubi)" d="m14 6.5 2.8-2.2 3.2.4-.2 3-2.5 2.4-2.7-.8Z"/><path fill="none" stroke="#eed3b2" d="m15.6 6.5 1.4-1.1m-7.8 9.5-2.4 2.8"/>',
  arco: '<path fill="url(#couro)" d="M3.3 3.5Q10 3 14.6 8.9q4.1 4.5 6 11.8l-2.3.1q-1.7-6-5.3-10.5Q8.2 5 3.3 5.3Z"/><path fill="none" stroke="#e0c6a7" d="M3.3 4.8 19.3 20.5M5 20.8 15.1 10.2"/><path fill="url(#aco)" d="m13.2 9.5 4-1.8-1.7 4.1Z"/>',
  machado: '<path fill="url(#couro)" d="m3.5 21.1 9.2-15.5 2 1.1L5.9 22.4Z"/><path fill="url(#aco)" d="M11 5.1 14.6 2Q18.9 2.8 21 7.5l-3.8 4q-.8-3.5-4.9-3.8Z"/><path fill="none" stroke="#e8dac2" d="M15 3.6Q18.3 4.8 19.5 7.5"/>',
  capa: '<path fill="url(#rubi)" d="M8 3.1Q12 4 16 3l4.2 16.8Q16 18 12 22q-4-2.7-8.5-.4Z"/><path fill="#3e2440" d="m12.4 5-2.1 14.8 2.1 1.2 3.3-2Z"/><path fill="none" stroke="#d9ad83" d="M5.3 20 9 6m7 .4 2.5 12M10 4.6q2 1.8 4 0"/>',
  botas: '<path fill="url(#couro)" d="M8 2.8h8.5l-1.7 12 5.6 2.7 1.2 3.2H4l.8-3.5 3.4-3.9Z"/><path fill="url(#aco)" d="M8.1 3.1h8.4l-.8 3.3-7.4-.3Z"/><path fill="none" stroke="#d9b778" d="M9 8.5h5.5M9 11h4.8m-5 2.3h4.6M5.4 19.2h14"/>',
  luvas: '<path fill="url(#couro)" d="M6 21.3 5.4 13l-2-4 2-1.4 2.5 2.2V4.1L10 3v5.2l1-6h2l.3 6 1.2-5 2 .8-.4 6 2-2.7 2.2 1.4-3.9 7.2-.4 4.9Z"/><path fill="url(#aco)" d="m7.4 12.5 8.2-.4-.9 3.9-6.8.5Z"/><path fill="none" stroke="#d9b778" d="m7.5 19 6.7-.5"/>',
  calca: '<path fill="url(#couro)" d="M5.9 3.4h12.2l1.7 17.5-5.5.8-2.3-11-2.3 11-5.5-.8Z"/><path fill="url(#ouro)" d="M5.7 4.9h12.6v2H5.7Z"/><path fill="none" stroke="#bca080" d="M8.8 9 7.5 19m8-9 1.3 9"/>',
  anel: '<path fill="url(#ouro)" fill-rule="evenodd" d="M12 5.3a7.7 7.7 0 1 0 0 15.4 7.7 7.7 0 0 0 0-15.4Zm0 3a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4Z"/><path fill="url(#rubi)" d="m12 2 4 2.4-1.5 4h-5l-1.5-4Z"/><path fill="none" stroke="#f3e2c1" d="m10 4.3 2-1.2 2.4 1.4"/>',
  amuleto: '<path fill="none" stroke="#b38c5c" stroke-width="1.8" d="M3.5 3q1.5 7 8.5 8.6Q19 10 20.5 3"/><path fill="url(#ouro)" d="m12 9 5.4 5.5L12 22l-5.4-7.5Z"/><path fill="url(#rubi)" d="m12 11.5 3.1 3.3-3.1 4.5-3.1-4.5Z"/>',

};

const FAMILIAS: Readonly<Record<string, string>> = { tomo: 'livro', manto: 'capa', grevas: 'calca', manopla: 'luvas', adaga: 'espada' };

export function svgDoItem(id: string, tamanho = 64): string {
  const simbolo = ehIcone(id) ? ICONES[id] : ICONES.circulo;
  const familia = Object.hasOwn(FAMILIAS, id) ? FAMILIAS[id] ?? id : id;
  const desenho = Object.hasOwn(DESENHOS, familia) ? DESENHOS[familia] : undefined;
  const item = desenho ?? `<g fill="none" stroke="#151017" stroke-width="3.3">${simbolo}</g>
    <g fill="none" stroke="url(#ouro)" stroke-width="1.85">${simbolo.replace(/class="F"/g, 'fill="url(#rubi)"')}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" stroke="#19131a" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">
    <defs>
      <linearGradient id="aco" x2="1" y2=".9"><stop stop-color="#f3e8cd"/><stop offset=".42" stop-color="#a4adb3"/><stop offset=".51" stop-color="#626978"/><stop offset="1" stop-color="#33303d"/></linearGradient>
      <linearGradient id="ouro" x2="1" y2="1"><stop stop-color="#f6ddb2"/><stop offset=".43" stop-color="#bb905c"/><stop offset="1" stop-color="#71503a"/></linearGradient>
      <linearGradient id="couro" x2="1" y2=".7"><stop stop-color="#b08162"/><stop offset=".4" stop-color="#745144"/><stop offset="1" stop-color="#3a2730"/></linearGradient>
      <linearGradient id="rubi" x2="1" y2="1"><stop stop-color="#f4bd98"/><stop offset=".42" stop-color="#bd4e54"/><stop offset="1" stop-color="#641b45"/></linearGradient>
      <linearGradient id="vidro" x2="1" y2="1"><stop stop-color="#e3eed6"/><stop offset=".52" stop-color="#8badac"/><stop offset="1" stop-color="#47525f"/></linearGradient>
    </defs>${item}</svg>`;
}
