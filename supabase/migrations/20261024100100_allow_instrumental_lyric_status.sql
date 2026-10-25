alter table public.songs
  drop constraint songs_lyric_status_consistent;

alter table public.songs
  add constraint songs_lyric_status_consistent check (
    lyric_status = public.derive_lyric_status(lyrics)
    or lyric_status = 'instrumental'::public.lyric_status
  );
