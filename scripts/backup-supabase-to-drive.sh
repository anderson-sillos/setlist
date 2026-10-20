#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL must be configured in the production-backup environment}"
: "${RCLONE_CONFIG:?RCLONE_CONFIG must point to the temporary rclone configuration}"

SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.121.0}"
BACKUP_RCLONE_REMOTE="${BACKUP_RCLONE_REMOTE:-setlist-backup}"
BACKUP_PATH="${BACKUP_PATH:-setlist-prod/daily}"
BACKUP_RETENTION_COUNT="${BACKUP_RETENTION_COUNT:-84}"
BACKUP_SKIP_IF_EXISTS="${BACKUP_SKIP_IF_EXISTS:-false}"

export SUPABASE_TELEMETRY_DISABLED=true

fail() {
  printf 'Backup failed: %s\n' "$1" >&2
  exit 1
}

supabase_dump() {
  npx --yes "supabase@${SUPABASE_CLI_VERSION}" db dump "$@" \
    --db-url "$SUPABASE_DB_URL" \
    --log-level error \
    || fail "Supabase CLI could not export the requested database section"
}

python3 - "$RCLONE_CONFIG" "$BACKUP_RCLONE_REMOTE" <<'PY' \
  || fail "the configured backup remote must use rclone crypt over Google Drive"
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

storage_object_count="$(PGCONNECT_TIMEOUT=30 psql "$SUPABASE_DB_URL" \
  --no-psqlrc --set ON_ERROR_STOP=1 --tuples-only --no-align \
  --command 'select count(*) from storage.objects')" \
  || fail "could not verify whether Supabase Storage contains binary objects"
storage_object_count="${storage_object_count//[[:space:]]/}"
[[ "$storage_object_count" =~ ^[0-9]+$ ]] \
  || fail "the Supabase Storage preflight returned an unexpected result"
[[ "$storage_object_count" == "0" ]] \
  || fail "Supabase Storage contains files; this job only backs up database data"

backup_date="$(date -u +%F)"
run_id="${GITHUB_RUN_ID:-manual}-$(date -u +%s)"
backup_root="${BACKUP_RCLONE_REMOTE}:${BACKUP_PATH}"
staging_path="${backup_root}/.setlist-prod-${backup_date}-${run_id}.staging.sql.gz"
final_path="${backup_root}/setlist-prod-${backup_date}.sql.gz"

cleanup() {
  if [[ -n "${staging_path:-}" ]]; then
    rclone --log-level ERROR deletefile "$staging_path" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

rclone --log-level ERROR mkdir "$backup_root"

if [[ "${BACKUP_SKIP_IF_EXISTS,,}" == "true" ]]; then
  existing_backups="$(rclone --log-level ERROR lsf "$backup_root" --files-only --format p)" \
    || fail "could not inspect the existing daily copy before the scheduled run"
  existing_filename="$(basename "$final_path")"
  if grep -Fqx "$existing_filename" <<< "$existing_backups"; then
    if rclone --log-level ERROR cat "$final_path" 2>/dev/null | gzip -t 2>/dev/null; then
      printf 'A verified backup already exists for %s; skipping the duplicate scheduled upload.\n' \
        "$backup_date"
      exit 0
    fi
    printf 'The existing backup for %s did not pass integrity validation; creating a replacement.\n' \
      "$backup_date" >&2
  fi
fi

printf 'Starting encrypted Supabase backup for %s.\n' "$backup_date"

if ! {
  printf '\n-- Setlist production backup: application role configuration\n'
  printf "ALTER ROLE authenticator SET pgrst.db_pre_request = 'public.reject_suspended_request';\n"

  printf '\n-- Setlist production backup: application schema\n'
  supabase_dump --schema public,private
  supabase_dump --schema supabase_migrations

  printf '\n-- Disable triggers while restoring copied data\n'
  printf 'SET session_replication_role = replica;\n'

  printf '\n-- Setlist production backup: Supabase Auth records\n'
  supabase_dump --data-only --use-copy --schema auth \
    --exclude auth.audit_log_entries \
    --exclude auth.sessions \
    --exclude auth.refresh_tokens \
    --exclude auth.flow_state \
    --exclude auth.one_time_tokens \
    --exclude auth.mfa_challenges

  printf '\n-- Setlist production backup: application data\n'
  supabase_dump --data-only --use-copy --schema public,private
  supabase_dump --data-only --use-copy --schema supabase_migrations

  printf '\n-- Re-enable triggers after restoring copied data\n'
  printf 'SET session_replication_role = origin;\n'
} | gzip -1 | rclone --log-level ERROR rcat "$staging_path"; then
  fail "the dump, compression, encryption, or Drive upload failed"
fi

rclone --log-level ERROR cat "$staging_path" | gzip -t \
  || fail "the uploaded staging copy failed decryption or gzip integrity validation"

existing_backups="$(rclone --log-level ERROR lsf "$backup_root" --files-only --format p)" \
  || fail "could not inspect the existing daily copy"
previous_path=""
if [[ $'\n'"$existing_backups"$'\n' == *$'\n'"setlist-prod-${backup_date}.sql.gz"$'\n'* ]]; then
  previous_path="${backup_root}/.previous-setlist-prod-${backup_date}-${run_id}.sql.gz"
  rclone --log-level ERROR moveto "$final_path" "$previous_path"
fi

if ! rclone --log-level ERROR moveto "$staging_path" "$final_path"; then
  if [[ -n "$previous_path" ]]; then
    rclone --log-level ERROR moveto "$previous_path" "$final_path" \
      || fail "new upload failed and the previous daily copy could not be restored"
  fi
  fail "could not publish the verified staging copy"
fi
staging_path=""
if ! rclone --log-level ERROR cat "$final_path" | gzip -t; then
  rclone --log-level ERROR deletefile "$final_path" || true
  if [[ -n "$previous_path" ]]; then
    rclone --log-level ERROR moveto "$previous_path" "$final_path" \
      || fail "the final copy failed validation and the previous copy could not be restored"
  fi
  fail "the final encrypted copy failed integrity validation"
fi
if [[ -n "$previous_path" ]]; then
  rclone --log-level ERROR deletefile "$previous_path"
fi

backup_listing="$(rclone --log-level ERROR lsf "$backup_root" --files-only --format p)" \
  || fail "could not list backups for retention"
mapfile -t backups < <(
  printf '%s\n' "$backup_listing" \
    | grep -E '^setlist-prod-[0-9]{4}-[0-9]{2}-[0-9]{2}\.sql\.gz$' \
    | sort -r
)

if (( ${#backups[@]} > BACKUP_RETENTION_COUNT )); then
  for old_backup in "${backups[@]:BACKUP_RETENTION_COUNT}"; do
    rclone --log-level ERROR deletefile "${backup_root}/${old_backup}"
  done
fi

retained_count="${#backups[@]}"
if (( retained_count > BACKUP_RETENTION_COUNT )); then
  retained_count="$BACKUP_RETENTION_COUNT"
fi
printf 'Backup completed and verified for %s; retained %s daily copies.\n' \
  "$backup_date" "$retained_count"
