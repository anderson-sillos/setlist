#!/usr/bin/env bash
set -euo pipefail

db_url="$(supabase status -o env | awk -F= '$1 == "DB_URL" { gsub(/"/, "", $2); print $2 }')"
if [[ -z "$db_url" ]]; then
  echo "Não foi possível obter a URL do banco Supabase local." >&2
  exit 1
fi

editor_id="00000000-0000-0000-0000-000000009701"
band_id="00000000-0000-0000-0000-000000009711"
initial_song_id="00000000-0000-0000-0000-000000009721"
slow_song_id="00000000-0000-0000-0000-000000009722"
fast_song_id="00000000-0000-0000-0000-000000009723"
collection_id="00000000-0000-0000-0000-000000009731"
slow_output="$(mktemp)"
slow_pid=""

cleanup() {
  if [[ -n "$slow_pid" ]]; then
    kill "$slow_pid" 2>/dev/null || true
    wait "$slow_pid" 2>/dev/null || true
  fi
  psql "$db_url" -X -v ON_ERROR_STOP=1 -c \
    "delete from public.bands where id = '$band_id'; delete from auth.users where id = '$editor_id';" \
    >/dev/null 2>&1 || true
  rm -f "$slow_output"
}
trap cleanup EXIT

psql "$db_url" -X -v ON_ERROR_STOP=1 <<SQL
insert into auth.users (id, aud, role, email)
values ('$editor_id', 'authenticated', 'authenticated', 'task-9-5-editor@example.test');

insert into public.profiles (id, display_name)
values ('$editor_id', 'Editor concorrente')
on conflict (id) do update
set display_name = excluded.display_name;

insert into public.bands (id, name)
values ('$band_id', 'Banda concorrente');

insert into public.band_members (band_id, user_id, role)
values ('$band_id', '$editor_id', 'editor');

insert into public.songs (id, band_id, title)
values
  ('$initial_song_id', '$band_id', 'Música inicial'),
  ('$slow_song_id', '$band_id', 'Inclusão lenta'),
  ('$fast_song_id', '$band_id', 'Inclusão concorrente');

insert into public.repertoire_collections (id, band_id, name)
values ('$collection_id', '$band_id', 'Concorrência');

insert into public.repertoire_collection_songs (
  band_id, collection_id, song_id, position
)
values ('$band_id', '$collection_id', '$initial_song_id', 0);
SQL

psql "$db_url" -X -v ON_ERROR_STOP=1 >"$slow_output" 2>&1 <<SQL &
begin;
select set_config('request.jwt.claim.sub', '$editor_id', true);
select collections.id
from public.repertoire_collections as collections
where collections.id = '$collection_id'
for update;
select pg_sleep(1.5);
select public.append_repertoire_collection_songs(
  '$band_id', '$collection_id', array['$slow_song_id'::uuid]
);
commit;
SQL
slow_pid=$!

sleep 0.25
psql "$db_url" -X -v ON_ERROR_STOP=1 -c \
  "select set_config('request.jwt.claim.sub', '$editor_id', false); select public.append_repertoire_collection_songs('$band_id', '$collection_id', array['$fast_song_id'::uuid]);" \
  >/dev/null

if ! wait "$slow_pid"; then
  cat "$slow_output" >&2
  exit 1
fi
slow_pid=""

actual_order="$(psql "$db_url" -X -At -v ON_ERROR_STOP=1 -c \
  "select string_agg(song_id::text, ',' order by position) from public.repertoire_collection_songs where collection_id = '$collection_id';")"
expected_order="$initial_song_id,$slow_song_id,$fast_song_id"

if [[ "$actual_order" != "$expected_order" ]]; then
  echo "Ordem inesperada após inclusões concorrentes: $actual_order" >&2
  echo "Ordem esperada: $expected_order" >&2
  exit 1
fi

echo "Inclusões concorrentes preservaram as duas músicas e a ordem da coleção."
