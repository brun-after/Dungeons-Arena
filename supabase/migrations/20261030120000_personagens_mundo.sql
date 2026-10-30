-- Marco 29 (30/10/2026, D-128): os personagens do modo Mundo, guardados pelo servidor. Três slots por conta,
-- separados dos saves da campanha. Num MMO, o personagem mora no servidor: o cliente só lê a própria lista e
-- nunca grava. Quem grava é o servidor do jogo, com a chave de serviço (que ignora o RLS), nos pontos combinados:
-- o save na vila, o checkpoint a cada 60 s, a troca de sala e a saída.
-- RLS: a conta lê só os seus; não há política de escrita para `authenticated` (insert, update e delete negados).

create table if not exists public.personagens_mundo (
  user_id uuid not null references auth.users (id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  -- Nome, classe, nível e a vila salva, para a tela de escolha (sem baixar a ficha inteira).
  resumo jsonb not null,
  ficha jsonb not null,
  vila_salva text not null,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, slot),
  constraint personagens_mundo_ficha_tamanho check (pg_column_size(ficha) < 524288),
  constraint personagens_mundo_resumo_tamanho check (pg_column_size(resumo) < 2048)
);

alter table public.personagens_mundo enable row level security;

create policy "personagens_mundo: a conta lê os seus" on public.personagens_mundo
  for select to authenticated using ((select auth.uid()) = user_id);
