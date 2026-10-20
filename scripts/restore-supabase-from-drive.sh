#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

: "${SUPABASE_RECOVERY_DB_URL:?Configure o secret SUPABASE_RECOVERY_DB_URL com a URI do projeto descartável}"
: "${RCLONE_CONFIG:?RCLONE_CONFIG deve apontar para a configuração temporária do rclone}"
: "${RESTORE_CONFIRMATION:?A confirmação explícita é obrigatória}"

RESTORE_CONFIRMATION_REQUIRED='RESTAURAR-ISOLADO'
RESTORE_RCLONE_REMOTE="${RESTORE_RCLONE_REMOTE:-setlist-backup}"
RESTORE_PATH="${RESTORE_PATH:-setlist-prod/daily}"
SOURCE_PRODUCTION_PROJECT_REF="${SOURCE_PRODUCTION_PROJECT_REF:-tqijocmmiwistinrjpwl}"
RESTORE_TARGET_PROJECT_REF="${RESTORE_TARGET_PROJECT_REF:-}"
BACKUP_DATE="${1:-}"

fail() {
  printf 'Restauração interrompida: %s\n' "$1" >&2
  exit 1
}

[[ "$RESTORE_CONFIRMATION" == "$RESTORE_CONFIRMATION_REQUIRED" ]] \
  || fail 'confirmação não corresponde a RESTAURAR-ISOLADO'
[[ "$BACKUP_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] \
  || fail 'a data deve estar no formato AAAA-MM-DD'
normalized_date="$(date -u -d "$BACKUP_DATE" +%F 2>/dev/null)" \
  || fail 'a data informada não existe'
[[ "$normalized_date" == "$BACKUP_DATE" ]] \
  || fail 'a data informada não existe'

backup_file="setlist-prod-${BACKUP_DATE}.sql.gz"
backup_root="${RESTORE_RCLONE_REMOTE}:${RESTORE_PATH}"
backup_object="${backup_root}/${backup_file}"
pgpass_dir="$(mktemp -d "${RUNNER_TEMP:-/tmp}/setlist-restore-pgpass.XXXXXX")"
pgpass_file="${pgpass_dir}/pgpass"

cleanup() {
  if [[ -n "${pgpass_file:-}" ]]; then
    rm -f "$pgpass_file"
  fi
  if [[ -n "${pgpass_dir:-}" ]]; then
    rmdir "$pgpass_dir" 2>/dev/null || true
  fi
}
trap cleanup EXIT

python3 - "$RCLONE_CONFIG" "$RESTORE_RCLONE_REMOTE" <<'PY' \
  || fail 'o remote do Drive não usa rclone crypt'
import configparser
import sys

config_path, crypt_name = sys.argv[1:]
config = configparser.ConfigParser(interpolation=None)
try:
    with open(config_path, encoding="utf-8") as config_file:
        config.read_file(config_file)
    if config.get(crypt_name, "type", fallback="") != "crypt":
        raise ValueError
    drive_remote = config.get(crypt_name, "remote", fallback="")
    drive_name, separator, _ = drive_remote.partition(":")
    if not separator or config.get(drive_name, "type", fallback="") != "drive":
        raise ValueError
except (OSError, configparser.Error, ValueError):
    sys.exit(1)
PY

connection_details="$(python3 - "$SOURCE_PRODUCTION_PROJECT_REF" "$pgpass_file" <<'PY'
import re
import sys
import os
from urllib.parse import unquote, urlsplit

production_ref, pgpass_path = sys.argv[1:]
connection_url = os.environ.get("SUPABASE_RECOVERY_DB_URL", "")
expected_target_ref = os.environ.get("RESTORE_TARGET_PROJECT_REF", "")
try:
    parsed = urlsplit(connection_url)
    host = (parsed.hostname or "").lower()
    username = unquote(parsed.username or "")
    password = unquote(parsed.password or "")
    port = parsed.port or 5432
    database = unquote(parsed.path.lstrip("/"))
except ValueError:
    sys.exit(1)

if parsed.scheme not in {"postgres", "postgresql"}:
    sys.exit(1)

match = re.fullmatch(r"db\.([a-z0-9]{20})\.supabase\.(?:co|com)", host)
target_ref = match.group(1) if match else None

is_pooler = re.fullmatch(r"[a-z0-9.-]+\.pooler\.supabase\.(?:co|com)", host) is not None
if target_ref is None and is_pooler:
    match = re.fullmatch(r"postgres\.([a-z0-9]{20})", username)
    target_ref = match.group(1) if match else None

if (
    target_ref is None
    or target_ref == production_ref
    or not expected_target_ref
    or target_ref != expected_target_ref
    or (is_pooler and port != 5432)
):
    sys.exit(1)

if not username or not password or not database:
    sys.exit(1)

escaped = lambda value: value.replace("\\", "\\\\").replace(":", "\\:")
flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
descriptor = os.open(pgpass_path, flags, 0o600)
with os.fdopen(descriptor, "w", encoding="utf-8") as pgpass_file:
    pgpass_file.write(":".join(map(escaped, [host, str(port), database, username, password])) + "\n")

print("\n".join([target_ref, host, str(port), database, username]))
PY
)" || fail 'a URI deve apontar para um projeto Supabase identificável, diferente da produção, e com credenciais válidas'
mapfile -t connection_parts <<< "$connection_details"
target_ref="${connection_parts[0]:-}"
export PGHOST="${connection_parts[1]:-}"
export PGPORT="${connection_parts[2]:-}"
export PGDATABASE="${connection_parts[3]:-}"
export PGUSER="${connection_parts[4]:-}"
export PGPASSFILE="$pgpass_file"
export PGSSLMODE=require
export PGCONNECT_TIMEOUT=30
[[ -n "$target_ref" && -n "$PGHOST" && -n "$PGDATABASE" && -n "$PGUSER" ]] \
  || fail 'não foi possível validar a conexão ao projeto de recuperação'
printf 'Destino validado como projeto isolado (ref %s); não é produção.\n' "$target_ref"

backup_listing="$(rclone --log-level ERROR lsf "$backup_root" --files-only --format p)" \
  || fail 'não foi possível listar as cópias disponíveis no Drive'
[[ $'\n'"$backup_listing"$'\n' == *$'\n'"$backup_file"$'\n'* ]] \
  || fail "a cópia ${BACKUP_DATE} não foi encontrada no Drive"

rclone --log-level ERROR cat "$backup_object" | gzip -t \
  || fail 'a cópia não passou pela descriptografia e validação gzip'

rclone --log-level ERROR cat "$backup_object" \
  | gzip -dc \
  | python3 scripts/prepare-supabase-restore-stream.py --check-only \
  || fail 'a cópia não contém a estrutura de dump reconhecida para restauração'

empty_target_check="$(psql --no-psqlrc --set=ON_ERROR_STOP=1 --tuples-only --no-align <<'SQL'
DO $$
DECLARE
  table_name text;
  has_rows boolean;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'public.profiles',
    'public.bands',
    'public.band_members',
    'public.legal_acceptances',
    'public.invitations',
    'public.songs',
    'public.shows',
    'public.show_blocks',
    'public.show_items',
    'public.repertoire_collections',
    'public.repertoire_collection_songs',
    'public.moderated_songs',
    'public.suspended_accounts',
    'public.report_rate_limits',
    'private.invitation_retention_holds',
    'auth.users',
    'storage.objects'
  ] LOOP
    IF to_regclass(table_name) IS NOT NULL THEN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM %s LIMIT 1)', to_regclass(table_name))
        INTO has_rows;
      IF has_rows THEN
        RAISE EXCEPTION 'O projeto de destino contém dados e não está vazio.';
      END IF;
    END IF;
  END LOOP;
END
$$;
SELECT 'empty';
SQL
)" || fail 'não foi possível confirmar que o destino descartável está vazio'
[[ "$empty_target_check" == *empty* ]] \
  || fail 'a confirmação de destino vazio retornou um resultado inesperado'

printf 'Validando cópia %s e destino isolado; o dump será transmitido sem arquivo intermediário.\n' \
  "$BACKUP_DATE"

rclone --log-level ERROR cat "$backup_object" \
  | gzip -dc \
  | python3 scripts/prepare-supabase-restore-stream.py \
  | psql --no-psqlrc --set=ON_ERROR_STOP=1 --single-transaction \
      --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$PGDATABASE" \
  || fail 'a restauração em transação única falhou; não repita sobre um destino parcial'

printf 'Restauração do backup %s concluída no projeto isolado %s.\n' \
  "$BACKUP_DATE" "$target_ref"
