-- Amplia os slots sem alterar fichas existentes nem as políticas de acesso.
alter table public.personagens_mundo
  drop constraint personagens_mundo_slot_check;
alter table public.personagens_mundo
  add constraint personagens_mundo_slot_check check (slot between 1 and 5);
