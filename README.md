# DeepSeek Harness Artifact Canvas

**Render HTML, Markdown, SVG, code, and interactive options in a side panel — with syntax highlighting, select-and-ask, and an extensible plugin API.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4f46e5.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Release](https://img.shields.io/github/v/release/MexxiUK/dsh-artifacts)](https://github.com/MexxiUK/dsh-artifacts/releases)

![DeepSeek Harness Artifact Canvas rendering an artifact in the side panel](docs/hero.gif)

The Artifact Canvas adds a rendered artifact viewer to
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). When the
model builds a web page, a document, or a code file, the canvas renders it in a
dedicated side panel instead of dumping raw text into the chat.

## Contents

- [The problem](#the-problem)
- [What this plugin solves](#what-this-plugin-solves)
- [Packages](#packages)
- [How it works](#how-it-works)
- [Select and ask](#select-and-ask)
- [Extensibility](#extensibility-child-slots)
- [Installation](#installation)
- [Build](#build)
- [Known limitations](#known-limitations)

## The problem

DeepSeek Harness is a powerful coding agent, but it has no first-class way to
*show* what the model produces. A generated HTML page, a Markdown report, or a
code file appears as plain text in the conversation. You cannot render it,
inspect it, or ask a question about a specific part of it.

## What this plugin solves

This plugin adds a dedicated **Artifact canvas** to the `details` column. The
model writes artifacts through a new `artifact` tool, and the canvas renders
them live. You can:

- **Render HTML, Markdown, SVG, code, and interactive options** in a sandboxed,
  scrollable panel.
- **Brainstorm interactively** — the AI can present options as a visual showing
  the choices side by side; pick one and continue.
- **Keep the chat clean** — artifacts appear as a compact card (icon, title,
  action hint), not a wall of code or a rendered page inline.
- **Read code with syntax highlighting** (shiki) — no more raw text.
- **Select and ask** — drag a rectangle over any region and ask the model about
  it.
- **Debug with a console** — capture JS errors from HTML and options artifacts
  and view them in a console panel.
- **Fix with one click** — a magic-wand button asks the model to review and fix
  the artifact.
- **Extend it** — other plugins add renderers, toolbar buttons, and panels
  through child slots.
- **Track liveness** — a badge marks the current artifact versus older versions.
- **Switch versions** — a dropdown in the canvas header steps through every
  version of an artifact.
- **Keep sessions separate** — artifacts stay in their own conversation;
  switching chats never leaks them.
- **Go fullscreen** — expand the canvas to fill the viewport and back.
- **Work in a wide layout** — the canvas opens at ~55% and resizes to ~70% of
  the viewport.

| Without the canvas | With the canvas |
|---|---|
| HTML, Markdown, SVG, code, and options appear as raw text in the chat | Rendered in a dedicated side panel |
| No syntax highlighting | shiki syntax highlighting for every language |
| Cannot ask about a specific part | Drag-select any region and ask the model |
| One-size-fits-all output | Extensible renderers, chrome, and panels |
| No sense of what is current | A live badge marks the latest artifact |
| No version history | Step through every version of an artifact |
| Artifacts leak across sessions | Artifacts stay in their own conversation |

## Packages

| Package | Plane | Role |
|---|---|---|
| `packages/tool-artifact` | host (agent preset) | Registers the `artifact` tool and a system-prompt section. |
| `packages/client-ui-artifact` | browser | Registers the canvas, the artifact card, the renderers, the select-and-ask loop, and the liveness badge. |
| `packages/client-ui-layout` | browser | A wide-details layout, generated at install time from the installed `dsh-client-ui-layout`. |

## How it works

1. The model calls `artifact` with `action: create` and the artifact source.
2. The tool stores the artifact envelope in the tool result `meta`. The envelope
   holds `artifact_id`, `title`, `type`, `content`, `language`, and `version`.
3. The artifact card reads the `meta`. It shows a title and an action hint
   ("Click to view"). The card keeps the chat clean — the content itself is not
   rendered inline.
4. Clicking the card selects the artifact and calls `ctx.layout.openDetails()`.
   The side panel opens. It renders Markdown with `MarkdownText`, HTML and
   options in a sandboxed iframe, SVG as an image, or source code with
   `CodeBlock`.
5. A **Preview / Code** toggle switches between the rendered view and the raw
   source. The Code view shows syntax highlighting. The highlighting uses the
   artifact `language`.

```mermaid
flowchart LR
  Model[Model] -->|artifact tool| Tool[artifact tool]
  Tool -->|presentationMeta| Meta[tool result meta]
  Meta --> Card[artifact card]
  Card -->|click| Canvas[canvas]
  Canvas -->|renders| Out[HTML / Markdown / SVG / code / options]
  Canvas -->|select-and-ask| Model
```

## Select and ask

A floating action stack in the lower-right of the canvas has a **Select**
button. Click the button to enter select mode. A crosshair overlay covers the
preview. Drag to draw a rectangle. Release to show a popup. Type a question or
describe an issue. Press Enter or click **Send**.

The canvas extracts the text under the selection. For Markdown and code, it
extracts the text. For HTML, it reports the region geometry. The iframe is
opaque-origin, so the parent cannot read its text. The canvas feeds the text
and your question to the model as a queued user message.

## Extensibility (child slots)

The canvas declares four child slots. Other plugins use these slots to extend
the canvas.

| Slot | Kind | What plugins add |
|---|---|---|
| `artifact.renderer` | keyed by artifact `type` | New renderers. Built-in: `html`, `markdown`, `code`, `svg`, `options`. |
| `artifact.interaction` | list | postMessage handlers for the iframe. |
| `artifact.chrome` | list | Toolbar buttons and status indicators. |
| `artifact.panel` | list | Extra panels and tabs. |

Register into a slot like any DSH slot:

```js
ctx.slots.inject("artifact.renderer", () =>
  ctx.slots.register({ name: "artifact.renderer", key: "mermaid" }, MermaidRenderer),
);
```

## Interaction loop

HTML artifacts run in an opaque-origin iframe. The artifact can send
`postMessage({ v: 1, type: "artifact:select", value, label })` to the parent.
The canvas checks `event.origin === "null"` and that `event.source` is the
artifact's own iframe. It then feeds the selection to the model as a queued
user message.

## Console

HTML and options artifacts get a small error-capture script injected into their
source. It reports JavaScript errors, unhandled promise rejections,
`console.error` calls, and failed resource loads back to the canvas. A terminal
button in the floating action stack opens a console panel that lists them.

A magic-wand button in the same stack asks the model to fix the artifact. With
captured errors it sends the error list; with none it asks the model to review
the artifact for visual or layout issues.

## Liveness

The canvas marks the selected artifact **Live** (green, pulsing) while it is
the latest one. It marks older artifacts **Older** (muted).

## Installation

### Quick install

Run the installer:

```sh
./install.sh
```

The script copies the three packages, patches the profile, and creates the
`artifact` agent preset. For the preset base it uses the `standard` preset that
ships with your installed DeepSeek Harness (so it matches your version),
falling back to a frozen copy shipped in this repo. It is idempotent — run it
again to reinstall or to pick up changes. Then restart DeepSeek Harness:

```sh
ollama launch dsh
```

### Manual install

1. Install the packages at `$DSH_HOME/profiles/node_modules/@dsh-artifact/`.
2. Add the client plugin to `$DSH_HOME/profiles/web/cordis.patch.yml`. The
   `details` registration shadows the built-in `DetailsPanel`. It registers at
   `priority: -10`. Do not rely on load order. The loader applies entries in
   parallel. Two registrations at the same priority on one slot throw and stop
   the plugin load.
3. Create the agent preset `artifact` at `$DSH_HOME/.agent-presets/artifact/`.
   It is a copy of `standard` plus the `tool-artifact` row. Set it as the
   default.
4. Install the layout `@dsh-artifact/client-ui-layout`. Swap it in through the
   patch layer. Disable the shipped `ui-layout` row. Insert the fork as
   `ui-layout-wide`. The installer regenerates it from the installed
   `dsh-client-ui-layout` with a small patch, so it tracks the running DSH
   version.

## Build

Build the client bundle with esbuild. The bundle uses the
`window.__ModuleLoader__.load` format.

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

## Restart to apply

The server hot-reloads the patch layer. It re-reads bundle files on each
request. So patch and bundle edits need only a page refresh. The server reads
the `package.json` metadata (`dsh.client.inject`) at boot. A change there needs
a full `ollama launch dsh` restart. Until then, the stale `inject` hint is
harmless. The cordis runtime defers each plugin `apply` until its services
arrive.

## Known limitations

- One selected artifact at a time.
- HTML runs scripts in an opaque-origin sandbox. There is no CSP meta yet.
- Localization is hardcoded English.
- The built-in interaction loop handles `artifact:select` only. Other message
  types use the `artifact.interaction` slot. The canvas cannot send messages
  back to the iframe yet.
- The wide-details layout is generated at install time by patching the installed
  `dsh-client-ui-layout`. If DSH changes the patched code, the installer falls
  back to the frozen copy shipped in this repo.
- Version numbers are tracked in memory by the `artifact` tool. After a DeepSeek
  Harness restart, updating an artifact created before the restart fails with
  "unknown artifact_id" — create a fresh artifact instead.
