# Two Hands ARP

Two Hands ARP is a public static web app project for a two-hand intervallic lines trainer.

The current version follows the Two-Hand Intervallic Lines Trainer PRD:

- Built-in presets for the 1+1 arpeggio, intervallic transposition connector, two-by-three cluster, and F Dorian min9 walk.
- Degree-based left/right hand shape editor.
- Active event strip and keyboard display.
- Playback, loop, fragment loop, tempo, ramp, step mode, and hand isolation.
- Core transforms for all keys, connected interval copies, and diatonic shape-walking.
- Local browser storage for saved shapes.

Playback uses Tone.js with the Salamander piano samples, matching the existing music apps.

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
