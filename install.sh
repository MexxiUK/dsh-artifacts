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

# ── 1. Install the packages ──────────────────────────────────────────────────
mkdir -p "$PKG_DEST"
for pkg in tool-artifact client-ui-artifact client-ui-layout; do
  if [ ! -d "$REPO_DIR/packages/$pkg" ]; then
    echo "  ! missing package: packages/$pkg" >&2
    exit 1
  fi
  rm -rf "$PKG_DEST/$pkg"
  cp -r "$REPO_DIR/packages/$pkg" "$PKG_DEST/$pkg"
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

STANDARD_PRESET="$DSH_HOME/.agent-presets/standard/agent.cordis.yml"
if [ -f "$STANDARD_PRESET" ]; then
  cp "$STANDARD_PRESET" "$PRESET_DIR/agent.cordis.yml"
  echo "  ✓ copied standard preset"
else
  echo "  ! standard preset not found at $STANDARD_PRESET" >&2
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
