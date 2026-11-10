# Cozy Room Portfolio

A pixel-art 3D room built with React Three Fiber. Walk around the desk, click the monitor, and the camera flies into a small "OS" that holds my projects.

**▶ Live:** https://gars0128.github.io/safeplace/ · **2D version:** https://gars0128.github.io/safeplace/?lite

Things to try: click the lamp, the PC, the cat; hover the pegboard; type `help` in the terminal.

## How it works
- The scene is built in code from primitives, instanced leaves and canvas textures: no model files and no font downloads.
- Pixel look: the canvas renders at about 1/3 resolution and the browser upscales it with nearest-neighbour; `ColorDepth` limits the palette. The monitor's HTML is a DOM layer, so its text stays sharp.
- Plants sway in a vertex shader (`src/scene/shaders/sway.ts`).
- Content is JSON validated by zod. A broken file fails the build, not production.

## Add a project
1. Copy any file in `src/content/projects/` to `<slug>.json` and fill it in.
2. Optional images go in `public/projects/<slug>/` (webp, ≤300 KB) and are listed in `media`.
3. `npm run dev` to check, then push. GitHub Actions deploys it.

## Develop
```
npm i
npm run dev
npm run build   # validate content + typecheck + lint + build
```
