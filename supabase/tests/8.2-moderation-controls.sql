begin;

select plan(15);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000821';
  editor_id uuid := '00000000-0000-0000-0000-000000000822';
  member_id uuid := '00000000-0000-0000-0000-000000000823';
  outsider_id uuid := '00000000-0000-0000-0000-000000000824';
  band_id uuid := '00000000-0000-0000-0000-000000000825';
  song_id uuid := '00000000-0000-0000-0000-000000000826';
  show_id uuid := '00000000-0000-0000-0000-000000000827';
  block_id uuid := '00000000-0000-0000-0000-000000000828';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-8-2-owner@example.test'),
    (editor_id, 'authenticated', 'authenticated', 'task-8-2-editor@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-8-2-member@example.test'),
    (outsider_id, 'authenticated', 'authenticated', 'task-8-2-outsider@example.test');

  insert into public.profiles (id, display_name)
  values
    (owner_id, 'Owner 8.2'),
    (editor_id, 'Editor 8.2'),
    (member_id, 'Member 8.2'),
    (outsider_id, 'Outsider 8.2')
  on conflict (id) do update
  set display_name = excluded.display_name;

  insert into public.bands (id, name)
  values (band_id, 'Banda de moderação 8.2');

  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, editor_id, 'editor'),
    (band_id, member_id, 'member');

  insert into public.legal_acceptances (band_id, user_id, term_version)
  values
    (band_id, owner_id, '2026-10'),
    (band_id, editor_id, '2026-10');

  insert into public.songs (id, band_id, title, notes)
  values (song_id, band_id, 'Música oculta 8.2', 'Observação privada');

  insert into public.shows (id, band_id, name, starts_at, venue)
  values (show_id, band_id, 'Show de moderação 8.2', '2026-12-01 21:00:00+00', 'Palco 8.2');

  insert into public.show_blocks (id, show_id, name, position)
  values (block_id, show_id, 'Principal', 0);

  insert into public.show_items (block_id, position, item_type, song_id)
  values (block_id, 0, 'song', song_id);

  insert into public.moderated_songs (song_id, reason, recorded_by)
  values (song_id, 'Teste administrativo', 'Teste pgTAP');
end;
$$;

select ok(
  public.is_song_moderated('00000000-0000-0000-0000-000000000826'),
  'the administrative record marks the song as moderated'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000821', true);

select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000826'),
  0,
  'Owner cannot read a moderated song'
);
select is(
  (select count(*)::integer from public.show_items
   where song_id = '00000000-0000-0000-0000-000000000826'),
  0,
  'Owner cannot read a show item for a moderated song'
);
select throws_ok(
  $$select public.set_song_archived(
      '00000000-0000-0000-0000-000000000825',
      '00000000-0000-0000-0000-000000000826',
      true
    )$$,
  '42501',
  'SONG_MODERATED',
  'lifecycle RPC cannot update a moderated song'
);
select throws_ok(
  $$select public.remove_song(
      '00000000-0000-0000-0000-000000000825',
      '00000000-0000-0000-0000-000000000826'
    )$$,
  '42501',
  'SONG_MODERATED',
  'lifecycle RPC cannot delete a moderated song'
);
select throws_ok(
  $$select * from public.moderated_songs$$,
  '42501',
  null,
  'authenticated clients cannot read administrative moderation records'
);
select throws_ok(
  $$insert into public.moderated_songs (song_id, reason, recorded_by)
    values (
      '00000000-0000-0000-0000-000000000826',
      'attempto do cliente',
      'authenticated'
    )$$,
  '42501',
  null,
  'authenticated clients cannot create administrative moderation records'
);
select throws_ok(
  $$select * from public.suspended_accounts$$,
  '42501',
  null,
  'authenticated clients cannot read administrative suspension records'
);
select throws_ok(
  $$insert into public.suspended_accounts (user_id, reason, recorded_by)
    values (
      '00000000-0000-0000-0000-000000000824',
      'attempto do cliente',
      'authenticated'
    )$$,
  '42501',
  null,
  'authenticated clients cannot create administrative suspension records'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000822', true);
select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000826'),
  0,
  'Editor cannot read a moderated song'
);
select is(
  (select count(*)::integer from public.show_items
   where song_id = '00000000-0000-0000-0000-000000000826'),
  0,
  'Editor cannot read a show item for a moderated song'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000823', true);
select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000826'),
  0,
  'Member cannot read a moderated song'
);
select is(
  (select count(*)::integer from public.show_items
   where song_id = '00000000-0000-0000-0000-000000000826'),
  0,
  'Member cannot read a show item for a moderated song'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000824', true);
select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000826'),
  0,
  'external authenticated user cannot read a moderated song'
);
select is(
  (select count(*)::integer from public.show_items
   where song_id = '00000000-0000-0000-0000-000000000826'),
  0,
  'external authenticated user cannot read a show item for a moderated song'
);

select * from finish();

rollback;
