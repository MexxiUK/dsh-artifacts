#!/usr/bin/env bash
# Install the DSH Artifact Canvas into a DeepSeek Harness profile.
#
# The script is idempotent: run it again to reinstall or to pick up changes.
# It copies the three packages, patches the profile's cordis.patch.yml, and
# creates the `artifact` agent preset.
set -euo pipefail

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DEST="$DSH_HOME/profiles/node_modules/@dsh-artifact"
PATCH_FILE="$DSH_HOME/profiles/web/cordis.patch.yml"
PRESET_DIR="$DSH_HOME/.agent-presets/artifact"

echo "DSH Artifact Canvas installer"
echo "  DSH_HOME: $DSH_HOME"
echo

# ── Layout fork patch ────────────────────────────────────────────────────────
# The wide-details fork is generated at install time from the installed DSH's
# layout, so it stays in sync with whatever version is running. Each entry is a
# literal "old|new" string replacement; if any target is missing (upstream
# changed), generation fails and the frozen copy shipped in this repo is used.
LAYOUT_PATCH=(
  'clampWidth(details, 300, 520)|clampWidth(details, 300, Math.max(520, Math.round(viewport * 0.7)))'
  '640|320'
  'clampWidth(px, 300, 520)|clampWidth(px, 300, Math.max(520, Math.round(window.innerWidth * 0.7)))'
  'd.details = 360|d.details = Math.max(300, Math.round(window.innerWidth * 0.55))'
  '@deepseek-ai/dsh-client-ui-layout|@dsh-artifact/client-ui-layout'
)

# Locate the installed upstream layout bundle (mirrors find_standard_preset).
find_upstream_layout() {
  local candidate dsh_real pkg_root

  if command -v dsh >/dev/null 2>&1; then
    dsh_real="$(readlink -f "$(command -v dsh)" 2>/dev/null || command -v dsh)"
    pkg_root="$(dirname "$(dirname "$dsh_real")")"
    candidate="$pkg_root/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js"
    [ -f "$candidate" ] && { printf '%s\n' "$candidate"; return 0; }
  fi

  if command -v npm >/dev/null 2>&1; then
    candidate="$(npm root -g 2>/dev/null)/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-client-ui-layout/lib/client.js"
    [ -f "$candidate" ] && { printf '%s\n' "$candidate"; return 0; }
  fi

  return 1
}

# Apply the wide-details patch to an upstream bundle, writing the fork to dest.
# Returns 0 on success, 1 if any patch target is missing.
generate_layout_fork() {
  local upstream="$1" dest="$2" tmp pair old new
  tmp="$(mktemp)"
  cp "$upstream" "$tmp"
  for pair in "${LAYOUT_PATCH[@]}"; do
    old="${pair%%|*}"
    new="${pair#*|}"
    if ! grep -qF "$old" "$tmp"; then
      echo "  ! layout patch target missing: $old" >&2
      rm -f "$tmp"
      return 1
    fi
    node -e '
      const fs = require("fs");
      const [file, old, rep] = process.argv.slice(1);
      const s = fs.readFileSync(file, "utf8");
      fs.writeFileSync(file, s.split(old).join(rep));
    ' "$tmp" "$old" "$new"
  done
  mv "$tmp" "$dest"
  return 0
}

# ── 1. Install the packages ──────────────────────────────────────────────────
mkdir -p "$PKG_DEST"
for pkg in tool-artifact client-ui-artifact client-ui-layout; do
  if [ ! -d "$REPO_DIR/packages/$pkg" ]; then
    echo "  ! missing package: packages/$pkg" >&2
    exit 1
  fi
  rm -rf "$PKG_DEST/$pkg"
  cp -r "$REPO_DIR/packages/$pkg" "$PKG_DEST/$pkg"
  if [ "$pkg" = "client-ui-layout" ]; then
    UPSTREAM_LAYOUT="$(find_upstream_layout || true)"
    if [ -n "$UPSTREAM_LAYOUT" ] && generate_layout_fork "$UPSTREAM_LAYOUT" "$PKG_DEST/$pkg/lib/client.js"; then
      echo "  ✓ regenerated layout fork from installed DSH"
    else
      echo "  · using frozen layout fork (could not regenerate)"
    fi
  fi
  echo "  ✓ installed @dsh-artifact/$pkg"
done

# ── 2. Patch the profile ─────────────────────────────────────────────────────
mkdir -p "$(dirname "$PATCH_FILE")"
touch "$PATCH_FILE"

append_if_missing() {
  local marker="$1"
  local block="$2"
  if ! grep -qF "$marker" "$PATCH_FILE"; then
    printf '%s\n' "$block" >> "$PATCH_FILE"
    echo "  ✓ patched: $marker"
  else
    echo "  · already patched: $marker"
  fi
}

append_if_missing "ui-artifact" "
# Artifact canvas: the browser plugin that renders HTML/Markdown/code in the
# details side-panel.
- insert:
    - id: ui-artifact
      name: '@dsh-artifact/client-ui-artifact'
"

append_if_missing "ui-layout-wide" "
# Swap the layout for the wide-details fork (canvas opens at ~55%, resizes to
# ~70%). A patch cannot rename a row, so disable the shipped layout and insert
# the fork.
- id: ui-layout
  disabled: true

- insert:
    - id: ui-layout-wide
      name: '@dsh-artifact/client-ui-layout'
"

append_if_missing "default: artifact" "
# Mount the artifact preset (standard + the artifact tool) by default.
- id: agent-presets
  config:
    default: artifact
"

# ── 3. Create the agent preset ───────────────────────────────────────────────
mkdir -p "$PRESET_DIR"

# Locate a `standard` preset to use as the base. Prefer the one that ships with
# the installed DeepSeek Harness (so it matches the running version), then fall
# back to the frozen copy shipped in this repo.
find_standard_preset() {
  local candidate dsh_real pkg_root

  # 1. Resolve the `dsh` binary and derive its package root.
  if command -v dsh >/dev/null 2>&1; then
    dsh_real="$(readlink -f "$(command -v dsh)" 2>/dev/null || command -v dsh)"
    pkg_root="$(dirname "$(dirname "$dsh_real")")"
    candidate="$pkg_root/config/agent-presets/standard/agent.cordis.yml"
    [ -f "$candidate" ] && { printf '%s\n' "$candidate"; return 0; }
  fi

  # 2. npm global root.
  if command -v npm >/dev/null 2>&1; then
    candidate="$(npm root -g 2>/dev/null)/@deepseek-ai/dsh/config/agent-presets/standard/agent.cordis.yml"
    [ -f "$candidate" ] && { printf '%s\n' "$candidate"; return 0; }
  fi

  # 3. Frozen copy shipped in this repo.
  candidate="$REPO_DIR/presets/standard/agent.cordis.yml"
  [ -f "$candidate" ] && { printf '%s\n' "$candidate"; return 0; }

  return 1
}

STANDARD_PRESET="$(find_standard_preset || true)"
if [ -n "$STANDARD_PRESET" ]; then
  cp "$STANDARD_PRESET" "$PRESET_DIR/agent.cordis.yml"
  echo "  ✓ copied standard preset ($STANDARD_PRESET)"
else
  echo "  ! could not find a standard preset" >&2
  echo "    create $PRESET_DIR/agent.cordis.yml manually, then add:" >&2
  echo "      - id: tool-artifact" >&2
  echo "        name: '@dsh-artifact/tool-artifact'" >&2
fi

if [ -f "$PRESET_DIR/agent.cordis.yml" ] && ! grep -qF "tool-artifact" "$PRESET_DIR/agent.cordis.yml"; then
  cat >> "$PRESET_DIR/agent.cordis.yml" <<'EOF'

# ── artifact canvas ─────────────────────────────────────────────────────────
# The model-facing `artifact` tool: create/update HTML, Markdown, and code
# artifacts surfaced in the canvas viewer.
- id: tool-artifact
  name: '@dsh-artifact/tool-artifact'
EOF
  echo "  ✓ added tool-artifact to preset"
fi

cat > "$PRESET_DIR/preset.yml" <<'EOF'
name: Artifact Canvas
description: Standard coding agent plus the artifact tool for the HTML, Markdown, and code canvas.
EOF
echo "  ✓ wrote preset.yml"

echo
echo "Done. Restart DeepSeek Harness to apply:"
echo "  ollama launch dsh"
