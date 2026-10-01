-- Regras preventivas iniciais (v1). Revisar por migration para manter histórico.
-- O filtro roda no banco para abranger também gravações diretas pela API.
create or replace function public.filter_song_content()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  content_text text;
begin
  content_text := translate(
    lower(
      coalesce(new.title, '') || ' ' ||
      coalesce(new.original_artist, '') || ' ' ||
      coalesce(new.notes, '') || ' ' ||
      coalesce(new.youtube_reference, '') || ' ' ||
      coalesce(new.lyrics::text, '')
    ),
    'áàâãéêíóôõúüç',
    'aaaaeeiooouuc'
  );

  -- Links para serviços de pornografia não pertencem ao repertório.
  if content_text ~
    '(^|[^[:alnum:]._-])(pornhub[.]com|xvideos[.]com|xhamster[.]com)([^[:alnum:]._-]|$)'
    -- Oferta explícita de material de exploração infantil.
    or content_text ~
    '\m(vendo|compro|troco)\M.{0,80}\m(pornografia infantil|material de abuso sexual infantil)\M'
  then
    raise exception 'CONTENT_REJECTED'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.filter_song_content() from public;

create trigger songs_filter_content
before insert or update on public.songs
for each row execute function public.filter_song_content();
