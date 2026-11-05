# philia093

A source-code recreation of the public `philia093.com` experience, built with Vanilla JavaScript and Vite.

The application runtime is organized as readable modules. It does not import or execute the original production JavaScript bundle.

## Run locally

Requirements: Node.js 20.19+ and Bun (preferred).

```bash
bun install
bun run dev
```

Build and preview:

```bash
bun run build
bun run preview
```

Run unit tests:

```bash
bun run test
```

## Source layout

- `src/main.js`: application bootstrap and browser lifecycle.
- `src/runtime/`: visitor persistence, abortable delays, and the deterministic timeline clock.
- `src/terminal/`: safe DOM terminal renderer and data-driven sequence player.
- `src/content/`: terminal copy and timing data.
- `src/scene/`: scene timeline, orchestration, responsive canvas surface, and visual renderers.
- `src/audio/`: Web Audio loading, synchronization, and lifecycle.
- `src/styles.css`: visual styles plus source-runtime transitions.
- `public/audio/`: soundtrack files used by the experience.
- `public/assets/`: favicon, touch icon, and signature asset.

## Visitor flow

The visitor marker is stored under `aha.was-here`. Clear it in DevTools to replay the first-visit terminal:

```js
localStorage.removeItem("aha.was-here");
location.reload();
```

The first visit plays the terminal sequence and waits for confirmation before starting the scene. Returning visitors see a continue prompt first.

For local development, `window.resetPhiliaVisit()` clears the marker and reloads the page. The development-only `window.philia093` object exposes timeline seek, pause, resume, and read-only state.

## Migration status

The source runtime currently owns the visitor flow, terminal sequence, timeline clock, story event dispatcher, canvas renderers, and audio playback. Visual parity is still being checked against the live reference, so the previous compressed runtime asset is temporarily retained as a comparison artifact only. It is not imported or loaded by `src/main.js`.

The bundle can be removed after the source renderers and timing have been validated against the reference at each scene transition.

This is an independent recreation and is not affiliated with or endorsed by HoYoverse. Use soundtrack and other copyrighted assets only where you have permission.
