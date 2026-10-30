-- Marco 30 (30/10/2026, D-129): os anúncios do mercado do Mundo. Valem para o reino todo; quem lê e grava é só o
-- servidor do jogo, com a chave de serviço (que ignora o RLS). O cliente vê o mercado pelo servidor, nunca direto:
-- o RLS fica ligado e sem nenhuma política (select, insert, update e delete negados para `anon` e `authenticated`).
-- A identidade do vendedor e do comprador é a do servidor (`conta#slot`) e não sai daqui para os clientes.

create table if not exists public.mercado_mundo (
  id uuid primary key,
  vendedor text not null,
  vendedor_nome text not null,
  -- A pilha anunciada: { invId, itemId, qtd, ref }.
  item jsonb not null,
  preco integer not null check (preco > 0),
  -- O preço menos a taxa de venda: o que o vendedor recebe.
  liquido integer not null check (liquido >= 0),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  estado text not null check (estado in ('aberto', 'vendido', 'cancelado', 'recebido')),
  comprador text,
  constraint mercado_mundo_item_tamanho check (pg_column_size(item) < 4096)
);

-- O quadro lista os abertos mais novos; o vendedor busca os seus.
create index if not exists mercado_mundo_abertos on public.mercado_mundo (estado, criado_em desc);
create index if not exists mercado_mundo_vendedor on public.mercado_mundo (vendedor, estado);

alter table public.mercado_mundo enable row level security;
