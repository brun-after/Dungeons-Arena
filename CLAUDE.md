# Dungeons Arena: guia para quem trabalha no código

**Versão:** 0.3 · **Data:** 15/10/2026

A especificação normativa é [`docs/PROMPT-PROJETO-v4.0.md`](docs/PROMPT-PROJETO-v4.0.md). Leia a Parte 1
antes de decisões técnicas. Divergências vão para [`docs/DECISOES.md`](docs/DECISOES.md), com justificativa.
O roteiro e o estado de cada marco ficam no [`README.md`](README.md).

## Comandos

- `npm run dev`: cliente em `http://localhost:5173` (menu; `?jogo=campanha` slots, `&slot=N` joga no slot, `?arena=online`, `?arena=loopback`,
  `?jogo=grupo&slot=N&criar=1|&codigo=X` campanha em grupo, `?bench=carga|padrao|trocas` benchmarks)
- `npm run dev:server`: servidor da arena (Colyseus) em `ws://localhost:2567`; `npm run carga`: teste de carga
- `npm run carga -- --perfil suportado|degradado --fase arena-02`: carga com rede simulada (proxy em `tools/rede`);
  `--modo grupo` mede a campanha cooperativa (até 6 bots); `--ficha certificada` entra com fichas certificadas (marco 17)
- Nuvem: `?nuvem=falsa` usa a nuvem em memória (testes); a de verdade (Supabase) vem de `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY` no build. O certificado do personagem é assinado só pelo servidor (`CHAVE_CERTIFICADO`)
- `npm run balancear`: simulador de balanceamento contra `balance.metas` (`-- --registrar` grava docs/BALANCEAMENTO.md)
- `npm run bench`: benchmarks do cliente no Chromium sem tela (`-- --registrar` grava docs/BENCHMARKS.md)
- `npm run relatorios -- arquivo.jsonl`: resumo dos relatórios do teste com pessoas (`?pesquisa=1`, docs/TESTES-HUMANOS.md)
- `npm run build:server`: servidor empacotado em `dist-server/main.mjs` (o Dockerfile usa este)
- `npm run verificar`: typecheck + lint + testes + build (rode antes de abrir PR)
- `npm test`: unidade e simulação (Vitest); `npm run test:e2e`: smoke (Playwright)

## Regras que não se negociam

- **Núcleo puro**: `src/core` (e, depois, `world`, `entities`, `combat`) não usa DOM, Node nem rede.
  O `tsconfig.nucleo.json` garante isso; não adicione `lib` ou `types` a ele.
- **Comandos**: `simular()` só muda estado a partir de comandos; a interface emite intenções.
- **Tempo de gameplay em ticks**, nunca em relógio de parede.
- **Hostilidade só por `relacao()`**, nunca olhando o `tipo` da entidade (§2.5, aceite 7).
- **Regras de modo em dados**, consultadas por funções pequenas; nada de `if (modo === 'x')` (§2.13).
- **Números em `src/data/balance.json`**, não chutados no código.
- **Clone explícito** do estado (sem ida e volta por JSON); estado só com dados.
- TypeScript estrito, sem `any`, até 800 linhas por arquivo, sem globais, HTML sempre escapado.
- Textos de interface no dicionário `src/i18n/`.

## Convenções (§6.3)

- Código, commits e documentação em pt-BR.
- Documentos levam versão e data; cada alteração registra a versão.
- Alterações significativas no código levam comentário com a data.
- Um marco por branch (`marco-N-nome`) e por Pull Request; o CI precisa passar antes do merge.
