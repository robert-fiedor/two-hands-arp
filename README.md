# Two Hands ARP

Two Hands ARP is a public static web app project for a two-hand arpeggio tool.

The current version is a PRD-ready preview. The product requirements document will define the next implementation pass.

## Local Preview

Serve the repo root with any static server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Publishing

This project is intended to be published from the `main` branch root with GitHub Pages.

The repository uses a tracked pre-commit hook in `.githooks/pre-commit`. Enable it after cloning:

```bash
git config core.hooksPath .githooks
```
