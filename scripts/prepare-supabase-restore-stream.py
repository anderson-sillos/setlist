#!/usr/bin/env python3
"""Stream a Setlist dump without replaying Supabase-managed cluster roles."""

from __future__ import annotations

import argparse
import re
import sys


ROLE_SECTION_MARKERS = {
    "-- Setlist production backup: PostgreSQL roles",  # Existing Drive backups.
    "-- Setlist production backup: application role configuration",
}
SCHEMA_SECTION_MARKER = "-- Setlist production backup: application schema"
AUTHENTICATOR_CONFIGURATION = (
    "ALTER ROLE authenticator SET "
    "pgrst.db_pre_request = 'public.reject_suspended_request';\n"
)
SUPABASE_ADMIN_OWNER_PATTERN = re.compile(
    r"\bOWNER\s+TO\s+\"?supabase_admin\"?\s*;",
    re.IGNORECASE,
)


def process_stream(*, check_only: bool) -> None:
    skipping_roles = False
    saw_role_section = False
    saw_schema_section = False

    for line in sys.stdin:
        marker = line.rstrip("\r\n")

        if marker in ROLE_SECTION_MARKERS:
            if saw_role_section:
                raise ValueError("duplicate role section")
            saw_role_section = True
            skipping_roles = True
            continue

        if skipping_roles:
            if marker == SCHEMA_SECTION_MARKER:
                skipping_roles = False
                saw_schema_section = True
                if not check_only:
                    sys.stdout.write(
                        "-- Keep the application PostgREST hook; Supabase provisions roles.\n"
                    )
                    sys.stdout.write(AUTHENTICATOR_CONFIGURATION)
                    sys.stdout.write(line)
            continue

        if marker == SCHEMA_SECTION_MARKER:
            raise ValueError("application schema appeared before the role section")

        if SUPABASE_ADMIN_OWNER_PATTERN.search(line):
            continue

        if not check_only:
            sys.stdout.write(line)

    if not saw_role_section or skipping_roles or not saw_schema_section:
        raise ValueError("role section or following application schema is missing")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check-only",
        action="store_true",
        help="validate stream markers without writing SQL to stdout",
    )
    args = parser.parse_args()

    try:
        process_stream(check_only=args.check_only)
    except (OSError, ValueError) as error:
        print(f"Estrutura do dump inválida: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
