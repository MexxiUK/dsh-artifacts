# DSH Artifact Canvas

A Claude/Gemini-parity Artifact viewer for DeepSeek Harness: a side-panel canvas
in the `details` column that renders **HTML** (sandboxed iframe), **Markdown**,
and **source code** (shiki syntax highlighting) artifacts, driven by a new
`artifact` tool. The canvas is **extensible** (other plugins register
renderers/chrome/panels into its child slots), **interactive** (HTML artifacts
can `postMessage` a selection back to the model, and the user can drag-select a
region to ask about it), and **live** (a badge marks the current artifact vs.
older ones). Opening the canvas left-aligns the chat Gemini-style via a forked
layout.

## Packages

| Package | Plane | Role |
|---|---|---|
| `packages/tool-artifact` | host (agent preset) | Registers the `artifact` tool (`create`/`update`, `title`, `type: html\|markdown\|code`, `content`, `language`) + a system-prompt section. |
| `packages/client-ui-artifact` | browser | Registers the `details` side-panel canvas, a keyed `tool.call.toolview` inline card, the sandboxed renderers, the select-and-ask loop, the interaction loop, and the liveness badge. |
| `packages/client-ui-layout` | browser | Fork of `dsh-client-ui-layout` with **wide-details**: `openDetails()` opens at ~55% of the viewport, and the drag handle resizes up to ~70% (the center column's minimum was relaxed from 640px to 320px so the canvas can take most of the screen, Gemini-style). |

## How it works

1. The model calls `artifact` with `action: create` and the artifact source.
2. The tool's `output.presentationMeta` persists the artifact envelope
   (`artifact_id`, `title`, `type`, `content`, `language`, `version`) as the
   durable `tool/result` `meta`.
3. The inline card (`tool.call.toolview` key `artifact`) reads that `meta` and
   renders a preview + an "Open in canvas" button.
4. "Open in canvas" selects the artifact and calls `ctx.layout.openDetails()`,
   opening the side panel, which renders Markdown via `MarkdownText`, HTML via
   a sandboxed `<iframe sandbox="allow-scripts" srcDoc=…>` (opaque origin, no
   `allow-same-origin`), or source code via the primitives `CodeBlock` (shiki
   syntax highlighting keyed by `language`).
5. A **Preview / Code** segmented toggle flips between the rendered view and the
   raw source; the Code view is syntax-highlighted (shiki) keyed by the
   artifact's `language` (markdown, html, or the code language).

## Extensibility (child slots)

The canvas declares four child slots in its `details` registration, so other
plugins extend it without touching its core:

| Slot | Kind | What plugins add |
|---|---|---|
| `artifact.renderer` | keyed by artifact `type` | New renderers (`mermaid`, `react`, `svg`, …). Built-in: `html`, `markdown`, `code`. |
| `artifact.interaction` | list | postMessage handlers for the iframe. Each entry mounts a listener (via `useEffect`) and renders nothing — a hook surface, not a visual region. |
| `artifact.chrome` | list | Toolbar buttons / status indicators in the canvas header. |
| `artifact.panel` | list | Extra panels/tabs inside the canvas. |

Register into them exactly like any DSH slot, e.g.
`ctx.slots.inject("artifact.renderer", () => ctx.slots.register({ name: "artifact.renderer", key: "mermaid" }, MermaidRenderer))`.

## Interaction loop

HTML artifacts run in an opaque-origin iframe. The artifact may
`postMessage({ v: 1, type: "artifact:select", value, label })` to the parent; the
canvas validates `event.origin === "null"` and feeds the selection back to the
model as a queued user message (`session.prompt(…, "queue")`).

## Select and ask

The canvas header has a **Select** button. Clicking it enters select mode: a
crosshair overlay covers the preview, and dragging draws a highlighted rectangle.
On release a small popup appears — type a question or describe an issue and
press Enter (or **Send**). The canvas extracts the text under the selection (for
Markdown/code; for HTML it reports the region geometry, since the iframe is
opaque-origin) and feeds it to the model as a queued user message alongside your
question.

## Liveness

The canvas badges the selected artifact **Live** (green, pulsing) while it is the
most recently produced one, and **Older** (muted) otherwise.

## Build

The client bundle is built with esbuild into the `window.__ModuleLoader__.load`
format the module loader expects:

```sh
cd packages/client-ui-artifact
npx esbuild src/client.tsx \
  --bundle --format=cjs --jsx=automatic \
  --external:react --external:react/jsx-runtime \
  --external:@deepseek-ai/dsh-client-ui-primitives \
  --outfile=lib/client.js \
  --banner:js='window.__ModuleLoader__.load({ id: "@dsh-artifact/client-ui-artifact", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' \
  --footer:js='return module.exports; } });'
```

## Composition (already applied)

- **Packages** installed at `$DSH_HOME/profiles/node_modules/@dsh-artifact/`.
- **Client plugin** added to `$DSH_HOME/profiles/web/cordis.patch.yml`. The
  `details` registration shadows the built-in `DetailsPanel` by registering at
  `priority: -10` (the codebase's shadowing convention, cf.
  `dsh-client-ui-subagent`). **Do not rely on load order**: the loader applies
  entries in parallel (`Promise.allSettled`), so a small local plugin can apply
  before a large bundled one regardless of list position — two registrations at
  the same priority on a single slot throw and take down the whole plugin load.
- **Agent preset** `artifact` created at `$DSH_HOME/.agent-presets/artifact/`
  (a copy of `standard` + the `tool-artifact` row), and set as the default via
  the `agent-presets` config override.
- **Layout fork** `@dsh-artifact/client-ui-layout` installed and swapped in via
  the patch layer: the shipped `ui-layout` row is `disabled: true` and the fork
  is inserted as `ui-layout-wide` (a patch cannot rename a row, so it is a
  disable + insert).

## Restart to apply

The running server hot-reloads the **patch layer** in-process (`watchUserPatches`
re-composes `cordis.patch.yml` on change) and re-reads **bundle files** on each
request (the `?rev=` hash updates), so patch and bundle edits need only a page
refresh. **package.json metadata** (`dsh.client.inject`) is read at boot, so a
change there needs a full `ollama launch dsh` restart — until then the stale
`inject` ordering hint is harmless (the cordis runtime defers each plugin's
`apply` until its declared services arrive).

## Known limitations

- One selected artifact at a time (no per-session keying yet).
- Version history is recorded in the log but not yet surfaced in a switcher.
- HTML runs scripts in an opaque-origin sandbox; no CSP meta is injected yet.
- Localization is hardcoded English.
- The built-in interaction loop handles `artifact:select` only; additional
  message types are registered through the `artifact.interaction` slot (each
  entry mounts its own `postMessage` listener). Sending messages *back* to the
  iframe (a `send` handle) is a follow-up.
- The layout fork is a byte-copy of `dsh-client-ui-layout` with the wide-details
  change; it must be re-synced if the upstream layout changes.
