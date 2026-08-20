# Contributing

Thanks for your interest in the DSH Artifact Canvas. Contributions are welcome.

## Ways to contribute

- **Report a bug** — open an issue with the DSH version and the steps to
  reproduce it.
- **Add a renderer** — register a new `artifact.renderer` for a new artifact
  type (for example `mermaid` or `react`). See the
  [Extensibility](README.md#extensibility-child-slots) section.
- **Add a toolbar button or panel** — register into `artifact.chrome` or
  `artifact.panel`.
- **Improve the docs** — the README and this file.

## Development

1. Clone the repo.
2. Edit `packages/artifact/src/client.tsx` (browser) or
   `packages/artifact/lib/index.js` (host tool).
3. Rebuild the client bundle:

   ```sh
   cd packages/artifact
   npx esbuild src/client.tsx \
     --bundle --format=cjs --jsx=automatic \
     --external:react --external:react/jsx-runtime \
     --external:@deepseek-ai/dsh-client-ui-primitives \
     --outfile=lib/client.js \
     --banner:js='window.__ModuleLoader__.load({ id: "@dsh-artifact/artifact", factory: (require) => { var module = { exports: {} }; var exports = module.exports;' \
     --footer:js='return module.exports; } });'
   ```

4. Run `./install.sh` to reinstall, then restart DeepSeek Harness.

## Style

- Keep prose short and in active voice (Simplified Technical English).
- One topic per sentence.
- Use the existing terminology (canvas, artifact, renderer, slot).
