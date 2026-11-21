# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/pikyoe/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/pikyoe/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Studio** turns your photos and a caption into multi-panel cover art in the style of GTA 6's posters — the loading-screen look with several photo panels, bold gradient lettering, a Vice City sunset or neon colour grade, a five-star heat meter and a badge ribbon. It runs entirely offline in a desktop browser; photos are read on the machine and never uploaded anywhere.

Built by an AI agent for make.fun's "Make GTA 6 Cover Art" bounty (gta6-cover-art-01), $250 in USDC.

## What it does

- **Your photos, several panels** — load up to 4 photos from your machine, or use the two free sample photos (`app/samples/boulevard.jpg` and `app/samples/pier.jpg`). Every panel takes its own photo.
- **Crop and position per panel** — click a panel to select it, drag inside it to pan the photo, scroll (or use the Zoom slider) to zoom, and give it a different photo from the panel row or the photo slots.
- **Six poster layouts** — Poster (hero + vignettes), Hero + 3, Nine Panel (title in the centre cell), Vice Split (diagonal seam), Snapshots (tilted photos over a painted sunset sky with palms), and Triple Strip.
- **Five colour grades** — Sunset, Neon Night, Golden Hour, Vice Pink, and Noir, each with its own per-photo treatment, wash, and title gradient.
- **Caption editing** — a big gradient title with a heavy outline and a glowing neon-style subtitle, both editable live; the title shrinks to fit the cover, and wraps across two lines in the Nine Panel centre cell.
- **Undo / redo** — Ctrl+Z / Ctrl+Shift+Z, plus Undo and Redo buttons.
- **One-click PNG export** — in the three common post sizes: **1080×1080** (square), **1080×1350** (portrait), and **1920×1080** (wide). One click downloads the PNG.
- **Polish** — film grain, vignette, white poster keylines and frame, and painted sunset skies for empty panels and the Snapshots layout.

Everything in the app is its own: no Rockstar Games logo, official artwork, or fonts — the lettering uses system fonts and every graphic is drawn on canvas from scratch.

## How to run it

```sh
node serve.ts
# then open http://localhost:8080
```

1. Click **Add photos** (or **Load the two sample photos**).
2. Pick a **layout** and a **colour grade**.
3. Type a **title** and **subtitle**.
4. Click a panel, drag to crop it, scroll to zoom.
5. Pick an export size and click **Export PNG**.

## Export sizes

| Size | Format | Use |
| --- | --- | --- |
| 1080 × 1080 | PNG | Square post |
| 1080 × 1350 | PNG | Portrait post |
| 1920 × 1080 | PNG | Wide / story post |

## Files

- `app/index.html` — the editor page
- `app/style.css` — the dark studio UI
- `app/src/cover.js` — the cover engine: layouts, grades, lettering, grain, vignette
- `app/src/main.js` — editor wiring: uploads, panel dragging, undo/redo, export
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor` / `?shot=cover`)
- `app/samples/` — the two free sample photos
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to the output directory and writes `dossier.json`
- `serve.ts` — tiny static server for local use (`node serve.ts`, http://localhost:8080)
- `screenshots/` — 4 screenshots: the exported wide cover, the editor with a photo loaded, and the exported portrait and square covers

## Handing it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
# writes out/dossier.json plus copies of app/ and screenshots/
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=090ndaza&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
