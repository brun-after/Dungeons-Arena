-- D-071 (17/10/2026): crédito público por pseudônimo, sem nome Google nem UUID público.
-- Migração posterior à D-070: também remove os nomes que já tenham sido registrados.
create or replace function public.pseudonimizar_descoberta()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.nome := 'Explorador ' || left(md5(new.user_id::text), 8);
  return new;
end;
$$;

create trigger descobertas_pseudonimo
before insert or update on public.descobertas
for each row execute function public.pseudonimizar_descoberta();

update public.descobertas set nome = 'Explorador ' || left(md5(user_id::text), 8);

drop policy "descobertas: todos leem" on public.descobertas;
create policy "descobertas: conta lê o próprio registro" on public.descobertas
  for select to authenticated using ((select auth.uid()) = user_id);

-- A view projeta somente os campos públicos. Seu proprietário lê as linhas sob RLS.
create view public.descobertas_publicas as
  select entrada, nome, criado_em from public.descobertas;
grant select on public.descobertas_publicas to anon, authenticated;

create or replace function public.registrar_descoberta(p_entrada text)
returns table (nome text, criado_em timestamptz, minha boolean)
language plpgsql security definer set search_path = '' as $$
declare
  conta uuid := auth.uid();
begin
  if conta is null then raise exception 'sem_login'; end if;
  insert into public.descobertas (entrada, user_id, nome)
    values (p_entrada, conta, 'Explorador')
    on conflict (entrada) do nothing;
  return query select d.nome, d.criado_em, d.user_id = conta
    from public.descobertas d where d.entrada = p_entrada;
end;
$$;
revoke all on function public.registrar_descoberta(text) from public;
grant execute on function public.registrar_descoberta(text) to authenticated;
