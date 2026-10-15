#!/usr/bin/env bash
set -euo pipefail

operation="${1:?Informe restore ou save}"
cache_file="${2:?Informe o caminho do arquivo de imagens}"

case "$operation" in
  restore)
    /usr/bin/time -v docker image load --input "$cache_file"
    ;;
  save)
    images=()
    while IFS= read -r image_ref; do
      [[ -n "$image_ref" ]] && images+=("$image_ref")
    done < <(docker image ls --filter 'reference=public.ecr.aws/supabase/*' --format '{{.Repository}}:{{.Tag}}' | LC_ALL=C sort -u)
    if [[ ${#images[@]} -eq 0 ]]; then
      echo "Nenhuma imagem do Supabase foi encontrada para o cache." >&2
      exit 1
    fi
    # Store immutable service images only. Never cache containers or DB volumes:
    # each execution must apply all migrations and the seed to a fresh database.
    /usr/bin/time -v docker image save --output "$cache_file" "${images[@]}"
    ;;
  *)
    echo "Operação desconhecida: $operation" >&2
    exit 1
    ;;
esac
