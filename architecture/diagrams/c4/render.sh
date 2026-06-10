#!/usr/bin/env bash
# Regenerate C4 PNG exports from Mermaid source.
# Uses mermaid-cli when available, otherwise falls back to mermaid.ink.

set -euo pipefail
cd "$(dirname "$0")"

render_with_cli() {
  local input="$1"
  local output="$2"
  local width="${3:-1600}"
  npx @mermaid-js/mermaid-cli -i "$input" -o "$output" -b white -w "$width"
}

render_with_ink() {
  local input="$1"
  local output="$2"
  local encoded
  encoded=$(base64 < "$input" | tr -d '\n')
  curl -fsSL "https://mermaid.ink/img/${encoded}?type=png&bgColor=white" -o "$output"
}

render() {
  local input="$1"
  local output="$2"
  local width="${3:-1600}"
  echo "Rendering ${input} -> ${output}"
  if command -v npx >/dev/null 2>&1; then
    render_with_cli "$input" "$output" "$width"
  else
    render_with_ink "$input" "$output"
  fi
}

render c4-context.mmd c4-context.png 1600
render c4-container.mmd c4-container.png 2200

echo "Done."
