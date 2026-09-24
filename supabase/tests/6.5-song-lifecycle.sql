begin;

select plan(11);

do $$
declare
  owner_id uuid := '00000000-0000-0000-0000-000000000651';
  member_id uuid := '00000000-0000-0000-0000-000000000652';
  band_id uuid := '00000000-0000-0000-0000-000000000653';
  free_song_id uuid := '00000000-0000-0000-0000-000000000654';
  used_song_id uuid := '00000000-0000-0000-0000-000000000655';
  show_id uuid := '00000000-0000-0000-0000-000000000656';
  block_id uuid := '00000000-0000-0000-0000-000000000657';
begin
  insert into auth.users (id, aud, role, email)
  values
    (owner_id, 'authenticated', 'authenticated', 'task-6-5-owner@example.test'),
    (member_id, 'authenticated', 'authenticated', 'task-6-5-member@example.test');

  insert into public.bands (id, name)
  values (band_id, 'Banda de ciclo 6.5');

  insert into public.band_members (band_id, user_id, role)
  values
    (band_id, owner_id, 'owner'),
    (band_id, member_id, 'member');

  insert into public.songs (id, band_id, title)
  values
    (free_song_id, band_id, 'Música sem show'),
    (used_song_id, band_id, 'Música em show');

  insert into public.shows (id, band_id, name, starts_at, venue)
  values (show_id, band_id, 'Show preservado', '2026-12-01 21:00:00+00', 'Palco 6.5');

  insert into public.show_blocks (id, show_id, name, position)
  values (block_id, show_id, 'Principal', 0);

  insert into public.show_items (block_id, position, item_type, song_id)
  values (block_id, 0, 'song', used_song_id);
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000651',
  true
);

select ok(
  public.accept_current_band_term(
    '00000000-0000-0000-0000-000000000653',
    '2026-09'
  ) is not null,
  'Owner accepts the current term before managing songs'
);

select ok(
  public.set_song_archived(
    '00000000-0000-0000-0000-000000000653',
    '00000000-0000-0000-0000-000000000654',
    true
  ) is not null,
  'archive records a server timestamp'
);
select ok(
  (select archived_at is not null from public.songs
   where id = '00000000-0000-0000-0000-000000000654'),
  'archived songs are hidden from active selection'
);
select is(
  public.set_song_archived(
    '00000000-0000-0000-0000-000000000653',
    '00000000-0000-0000-0000-000000000654',
    false
  ),
  null::timestamptz,
  'restore clears the archive timestamp'
);
select is(
  (select archived_at from public.songs
   where id = '00000000-0000-0000-0000-000000000654'),
  null::timestamptz,
  'restored songs become active again'
);

select is(
  public.remove_song(
    '00000000-0000-0000-0000-000000000653',
    '00000000-0000-0000-0000-000000000654'
  ),
  'deleted',
  'an unreferenced song is deleted permanently'
);
select is(
  (select count(*)::integer from public.songs
   where id = '00000000-0000-0000-0000-000000000654'),
  0,
  'permanent deletion removes the unreferenced row'
);

select is(
  public.remove_song(
    '00000000-0000-0000-0000-000000000653',
    '00000000-0000-0000-0000-000000000655'
  ),
  'archived',
  'a song used by a show is archived instead of deleted'
);
select ok(
  (select archived_at is not null from public.songs
   where id = '00000000-0000-0000-0000-000000000655'),
  'archiving preserves the referenced song'
);
select is(
  (select count(*)::integer from public.show_items
   where song_id = '00000000-0000-0000-0000-000000000655'),
  1,
  'existing setlist references remain intact'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000652',
  true
);
select throws_ok(
  $$select public.remove_song(
      '00000000-0000-0000-0000-000000000653',
      '00000000-0000-0000-0000-000000000655'
    )$$,
  'P0001',
  'SONG_ROLE_REQUIRED',
  'Member cannot manage the song lifecycle'
);

select * from finish();

rollback;
