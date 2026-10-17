-- Marco 18 (17/10/2026, D-070): a primeira descoberta do servidor (diário de descobertas).
-- Uma linha por entrada do diário ("reacao:eletrocutar", "combo:moedor"…): quem chegou primeiro fica com ela. Registro
-- comunitário, não autoritativo — o jogo não dá nada por isso, só mostra. Só o primeiro nome da conta é guardado.
-- Econômica: o cliente só escreve quando descobre algo novo no próprio diário (raro) e lê a linha daquela entrada.

create table if not exists public.descobertas (
  entrada text primary key check (char_length(entrada) between 3 and 80),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 1 and 40),
  criado_em timestamptz not null default now()
);

alter table public.descobertas enable row level security;

create policy "descobertas: todos leem" on public.descobertas
  for select to anon, authenticated using (true);

-- Só inserção (a primeira ganha; o conflito da chave primária barra as outras) e sempre em nome de quem está logado.
create policy "descobertas: a conta registra em seu nome" on public.descobertas
  for insert to authenticated with check ((select auth.uid()) = user_id);
