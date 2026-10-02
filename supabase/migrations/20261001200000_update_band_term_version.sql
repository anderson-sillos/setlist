-- Mudança material no termo de responsabilidade: requer novo aceite para editar.
create or replace function public.current_legal_term_version()
returns text
language sql
stable
set search_path = pg_catalog
as $$
  select '2026-10'::text;
$$;
