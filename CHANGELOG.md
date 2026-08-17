# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.1]: https://github.com/MexxiUK/dsh-artifacts/releases/tag/v0.1.1
[0.1.0]: https://github.com/MexxiUK/dsh-artifacts/releases/tag/v0.1.0
