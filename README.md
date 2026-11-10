# Cozy Room Portfolio

A cozy 3D room built with React Three Fiber. Walk around the desk, click the monitor, and the camera flies into a small "OS" that holds my projects.

**▶ Live:** https://gars0128.github.io/safeplace/

Things to try: hover the monitor, click the lamp, the PC, the cat; hover the pegboard; type `help` in the terminal.

## How it works
- The scene is built in code from primitives, instanced leaves and canvas textures: no model files and no font downloads.
- Lighting: desk-lamp spotlight with soft shadows, warm LED strip and monitor glow, image-based fill, SSAO, bloom and ACES tone mapping. The monitor cycles through projects; hover it and click to open the mini-OS.
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
