-- Marco 17 (15/10/2026, D-063): saves da campanha na nuvem, um por slot (1–3) e por conta.
-- Econômica: o jogo lê a lista (só `slot` e `resumo`) uma vez por aba e o `registro` inteiro só ao baixar; escreve só
-- nos pontos combinados (salvar pelo menu, sair do grupo, sair da arena). Sem realtime.
-- RLS: cada conta só lê e grava o que é dela. O conteúdo é dado do jogo: o cliente confere ao baixar (lerRegistro) e
-- a arena só confia no certificado assinado pelo servidor, nunca no que está aqui.

create table if not exists public.saves (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  resumo jsonb not null,
  registro jsonb not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, slot),
  -- Um save fica bem abaixo disto; o teto protege o plano grátis de um registro inflado.
  constraint saves_registro_tamanho check (pg_column_size(registro) < 524288),
  constraint saves_resumo_tamanho check (pg_column_size(resumo) < 2048)
);

alter table public.saves enable row level security;

create policy "saves: a conta lê os seus" on public.saves
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "saves: a conta cria os seus" on public.saves
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "saves: a conta atualiza os seus" on public.saves
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "saves: a conta apaga os seus" on public.saves
  for delete to authenticated using ((select auth.uid()) = user_id);
