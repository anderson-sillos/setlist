create view public.show_summaries
with (security_invoker = true)
as
select
  s.id,
  s.band_id,
  s.name,
  s.starts_at,
  s.venue,
  s.status,
  sum(
    (
      case
        when i.item_type = 'song' then song.estimated_duration_ms
        when i.item_type = 'planning' then i.estimated_duration_ms
        else null
      end
    )::numeric
  ) as estimated_duration_ms
from public.shows as s
left join public.show_blocks as b on b.show_id = s.id
left join public.show_items as i on i.block_id = b.id
left join public.songs as song on song.id = i.song_id
group by s.id;

comment on view public.show_summaries is
  'Lista enxuta de shows autorizados com duração derivada dos itens salvos da setlist.';

grant select on public.show_summaries to authenticated;
