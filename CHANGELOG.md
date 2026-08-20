# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-08-18

### Added

- SVG artifacts: render a vector graphic in the canvas.
- Interactive options: the model presents choices as a visual showing them
  side by side; pick one and continue.
- Console: capture JavaScript errors, unhandled rejections, `console.error`
  calls, and failed resource loads from HTML and options artifacts.
- Magic-wand "fix" button: ask the model to review and fix the artifact.
- Floating action stack in the lower-right of the canvas (select, fix, copy,
  download, console, fullscreen).
- Type badge on the artifact card.

### Changed

- The artifact card is now a single button (icon, title, type badge, action
  hint) instead of an inline preview.
- The Preview / Code toggle now sits next to the Live badge.
- The layout fork is generated at install time from the installed
  `dsh-client-ui-layout`, so it tracks the running DSH version.

### Fixed

- Download now uses the correct extension and MIME type for SVG, and options
  download as the visual HTML rather than the JSON wrapper.
- The interaction loop now validates `event.source`, so only the artifact's own
  iframes can feed selections or errors back.
- The tool description now lists every artifact type.

## [0.2.0] - 2026-08-18

### Added

- Version switcher in the canvas header: step through every version of an
  artifact.
- Fullscreen mode: expand the canvas to fill the viewport and back.

### Fixed

- Various CSS bugs.
- Artifacts are now scoped per session, so they no longer leak across
  sessions.

## [0.1.1] - 2026-08-17

### Changed

- Replaced the canvas toolbar text labels (Preview, Code, Select, Copy,
  Download, Close) with language-agnostic icons.
- Replaced the static README hero image with an autoplaying video.

## [0.1.0] - 2026-08-17

### Added

- Artifact canvas in the `details` side panel.
- Render HTML (sandboxed iframe), Markdown, and source code.
- Syntax highlighting for code (shiki).
- Select-and-ask: drag-select a region and ask the model about it.
- Preview / Code toggle.
- Extensible child slots (`artifact.renderer`, `artifact.interaction`,
  `artifact.chrome`, `artifact.panel`).
- Liveness badge.
- Wide-details layout fork.
- Idempotent install script.

[0.3.0]: https://github.com/MexxiUK/dsh-artifacts/releases/tag/v0.3.0
[0.2.0]: https://github.com/MexxiUK/dsh-artifacts/releases/tag/v0.2.0
[0.1.1]: https://github.com/MexxiUK/dsh-artifacts/releases/tag/v0.1.1
[0.1.0]: https://github.com/MexxiUK/dsh-artifacts/releases/tag/v0.1.0
