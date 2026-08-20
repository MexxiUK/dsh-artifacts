# Architecture

Internal reference for the maintainers. It explains the package layout, why the
plugin is split across two planes, and the one fragile piece (the layout fork).
Read this before changing the package structure.

## Package layout

```
packages/
├── artifact/                 # the plugin — one package, two entry points
│   ├── lib/index.js          # host entry (agent plane): the `artifact` tool
│   ├── lib/client.js         # browser entry: canvas, card, renderers (built)
│   └── src/client.tsx        # browser source (rebuilt into lib/client.js)
└── client-ui-layout/         # the wide-details layout fork (see below)
```

`packages/artifact/package.json` carries both halves:

- `main` → `lib/index.js` (the host tool).
- `dsh.client.inject` → the browser bundle `lib/client.js`.

The old `@dsh-artifact/tool-artifact` and `@dsh-artifact/client-ui-artifact`
packages are gone. Everything lives in `@dsh-artifact/artifact`.

## Why two entry points (host vs. browser)

DeepSeek Harness runs two planes:

- **Agent plane** (Node.js) — where the model runs. Tools register here, and the
  system prompt is assembled here.
- **Browser plane** — where the UI runs. Slots, renderers, and React components
  live here.

The `artifact` tool needs `tools` and `systemPrompt`, which only exist in the
agent plane. The canvas needs `slots`, `layout`, and `sessions`, which only
exist in the browser. They cannot share one `apply`, so they are two entry
points in one package.

The host entry (`lib/index.js`) is loaded in **both** the agent preset and the
web profile. In the web profile its `inject: ["tools", "systemPrompt"]` never
resolves, so the plugin stays dormant there — harmless. The browser half is
loaded separately through `dsh.client.inject`.

## The layout fork (the fragile piece)

DSH's `ctx.layout` only exposes `toggleSidebar`, `openDetails`, and
`closeDetails`. There is no way to set the details width. To open the canvas
wide (~55% of the viewport, resizing to ~70%), we fork `dsh-client-ui-layout`
and patch its `clampWidth` calls.

The fork is **generated at install time** by `install.sh`, from the installed
DSH's own layout bundle, so it tracks the running version. If any patch target
is missing (upstream changed), generation fails and the frozen copy shipped in
this repo is used instead.

This is the part most likely to break:

- If upstream changes the patched code, the patch silently falls back to the
  frozen copy, which may be stale.
- The right fix is an upstream feature request for a details-width API
  (e.g. `setDetailsWidth` / `resizeDetails`). Until then, keep the fork.

## Rebuild and reinstall

```sh
# rebuild the browser bundle (after editing src/client.tsx)
cd packages/artifact
npx esbuild src/client.tsx \
  --bundle --format=cjs --jsx=automatic \
  --external:react --external:react/jsx-runtime \
  --external:@deepseek-ai/dsh-client-ui-primitives \
  --outfile=lib/client.js \
  --banner:js='window.__ModuleLoader__.load({ id: "@dsh-artifact/artifact", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' \
  --footer:js='return module.exports; } });'

# reinstall (idempotent)
cd ../..
./install.sh

# restart DeepSeek Harness
ollama launch dsh
```

## Key invariants (easy to break)

- The module id in the bundle banner **must** be `@dsh-artifact/artifact`. It
  must match the package name and the `dsh.client.inject` wiring.
- `dsh.client.inject` is read **at boot**. A change there needs a full
  `ollama launch dsh` restart, not just a page refresh.
- The preset row (`- id: artifact`, `name: '@dsh-artifact/artifact'`) must match
  the package name, or the tool never registers.
- The postMessage loop validates `event.origin === "null"` **and**
  `event.source` against a tracked set of iframe windows. Do not relax this.
- The version counter lives at `$DSH_HOME/artifact-versions.json`. It is
  best-effort; a failed write only resets the counter on restart.
