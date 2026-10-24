-- Marco 23 (24/10/2026, D-092): dez slots de personagem por conta (eram três). Só alarga o check do slot; as
-- políticas e os tetos de tamanho continuam os mesmos.

alter table public.saves drop constraint if exists saves_slot_check;
alter table public.saves add constraint saves_slot_check check (slot between 1 and 10);
