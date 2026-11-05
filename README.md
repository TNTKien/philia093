# philia093

A Vanilla JavaScript recreation of the public `philia093.com` experience.

The original production client bundle supplied for this project is kept as a gzip-compressed asset at `public/assets/site-runtime.js.gzbin`. It contains the site's own terminal, story engine, Canvas renderers, and audio synchronization. `src/main.js` decompresses that bundle in the browser and loads it as an ES module. `src/styles.css` contains the corresponding site styles, with the palette token encoding corrected to match the runtime.

Vite is used only for local development and production builds. There is no React, Vue, or UI framework.

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

## Assets

The client runtime expects these paths:

- `public/audio/TruE.aac`
- `public/audio/WithYouOnceMore.aac`
- `public/assets/aha-signature-Y7J0VfU6.svg`
- `public/assets/favicon.ico`
- `public/assets/apple-touch-icon.png`

The audio tracks are fetched and decoded by the runtime before the story begins. Keep their filenames and paths unchanged unless you also update the runtime.

## Visitor state

The original client uses the localStorage key `aha.was-here` and stores an ISO timestamp after the first-visit terminal confirmation.

To test the first-visit flow again, open DevTools Console and run:

```js
localStorage.removeItem("aha.was-here");
location.reload();
```

To test the returning-visitor flow, leave the key in place and reload. Press a non-modifier key or click/tap the page to continue.

## Project structure

- `index.html`: the original page's DOM entry points.
- `src/main.js`: loads the compressed original client runtime.
- `src/styles.css`: site styles and palette variables.
- `public/assets/site-runtime.js.gzbin`: gzip-compressed client bundle.
- `public/audio/`: the two soundtrack files.
- `public/assets/`: favicon, touch icon, and signature.

The runtime is the minified production client bundle, not the original unminified authoring source. This preserves the original rendering and timing more faithfully than a separately reimplemented approximation, but it is less convenient to modify. If deeper customization is needed, the relevant parts can be reverse-engineered into readable modules later.

This is an independent recreation and is not affiliated with or endorsed by HoYoverse.
