# philia093

A Vanilla JavaScript recreation of the public `philia093.com` experience. Built with HTML, CSS, ES modules, Canvas 2D, the Web Audio API, and Vite (development/build tooling only).

## Requirements

- Node.js 20.19+ (or a compatible current Node.js release)
- Bun (preferred) or npm

## Run locally

```bash
bun install
bun run dev
```

Build and preview:

```bash
bun run build
bun run preview
```

## Visitor flow

- First visit: the terminal sequence runs. When the visitor accepts `DEPLOY hello_world?`, the app writes `aha.was-here` to localStorage using an ISO timestamp, then starts the animation.
- Returning visit: the app shows `Press any key to continue_` (or a touch prompt on touch-first devices). Any non-modifier key or pointer press starts the animation.
- For local testing, append `?reset` to clear the visitor marker and `?fast` to shorten the terminal sequence. Example: `http://localhost:5173/?reset&fast`.

## Optional audio

Put these files in `public/audio/`:

- `TruE.aac`
- `WithYouOnceMore.aac`

The animation does not depend on audio files being present. Missing or unsupported audio is reported in the browser console and the visual timeline continues.

Audio files are not committed by default. Only add media that you have permission to redistribute.

## Implementation notes

- `src/terminal.js` contains the first-visit boot sequence and continue prompt.
- `src/story.js` defines the timed evening/daybreak story sequence.
- `src/canvas/mobius.js` draws the animated Möbius-inspired glyph field.
- `src/canvas/heartbeat.js` draws the signal rails.
- `src/audio.js` loads and schedules the two optional audio tracks.
- `src/storage.js` owns the `aha.was-here` visitor marker.

The terminal flow and story timing are reconstructed from the user-provided public site files and screenshots. Canvas visuals are a fresh implementation inspired by the observed output, not a byte-for-byte copy of the original renderer.
