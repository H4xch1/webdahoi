# Documentation refresh installation

This package is documentation-only. It does not change app TSX/CSS, authentication, API routing, database schema, environment files, or dependencies.

## Apply

1. Commit/back up your working repository, including any existing docs files you have customized.
2. Extract this ZIP into the Webdahoi repository root, merging folders.
3. Run:

```powershell
node tools/install-readme-refresh.mjs --dry-run
node tools/install-readme-refresh.mjs
```

The installer backs up and replaces the root README only. The new docs/assets/helper files are additive files delivered in the archive.
If you already maintain files with the same docs names, compare them before extraction.
No npm install, app build, Prisma command, or deployment is needed to use this documentation.

## Manual alternative

Back up the root README.md, then copy readme-refresh/README.md over it.
Keep the accompanying docs directory and this installation guide so relative links remain valid.

## Preview

Open docs/index.html directly in your browser for the optional interactive Rinascita guide.
Its CSS, SVG assets, and JavaScript are local. No network/API service is needed to read it.
Some browsers limit clipboard access from local files; the Copy button falls back to selecting text for Ctrl+C/Cmd+C.

GitHub itself renders README.md with normal links and expandable details sections, not arbitrary JavaScript/custom page CSS.
Viewing docs/index.html on the GitHub repository page shows source unless you separately host it; this package does not publish GitHub Pages.
The SVG banner/palette provide the Rinascita colors within the GitHub README.

## Publish

Review the diff and commit only the intended README/docs/helpers. Do not commit .readme-refresh-backups or other private source backups.
No GitHub push or remote write is performed by this installer or by this documentation generation session.

## Restore

Run from repository root, using the printed directory:

```powershell
node tools/restore-readme-refresh.mjs ".readme-refresh-backups/<timestamp>"
```

The helper refuses to overwrite later README edits. It does not remove additive docs automatically.

## Baseline

The maintainer stated the project is complete and ready. The new README reflects that state and removes the old draft-style incomplete labels.
It does not pretend that this documentation refresh ran production builds, live login checks, or a security audit.
