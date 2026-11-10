# Cozy Room Portfolio

Interactive cozy 3D room (React Three Fiber). Clicking the main monitor flies the camera into an HTML mini-OS with the projects.

## Rules
- Stack: Vite + React + TS + R3F + drei + postprocessing + zustand + zod. Don't add new deps without asking.
- Content lives only in `src/content/projects/*.json` (validated by zod in `src/content/schema.ts`). Never hardcode project data in components. Personal info: `src/content/site.ts`.
- NDA projects (`"nda": true`): no client names, no client project names, no screenshots, no links. The schema rejects media/links on NDA projects.
- Every scene change must keep 60 fps on desktop. Budget: ≤100 draw calls, shadows only from the desk lamp (1024 map), particles as `Points`/`InstancedMesh`.
- Assets: compressed `.glb` (meshopt) and webp/ktx2 textures only. Project images ≤300 KB in `public/projects/<slug>/`.
- No third-party IP in the scene (posters, characters, brand logos). Wall art is drawn on canvases in `Room.tsx`.
- Each phase = one commit with a clear message; verify in the browser before marking done.

## Commands
- `npm run dev`: local dev server
- `npm run check`: content validation + `tsc` + `eslint` (CI runs this before deploy)
- `npm run build`: check + production build into `dist/`

## Where things are
- `src/scene/Experience.tsx`: lights + object list. Positions are in meters; desk top at y=0.76, back wall z=-2, right wall x=1.6.
- `src/scene/CameraRig.tsx`: room ↔ monitor camera, limits, parallax.
- `src/scene/objects/Monitor.tsx`: `SCREEN` constant drives both the camera target and the `<Html>` size.
- Look = soft PCSS shadows from the lamp, Lightformer environment, SSAO + bloom + ACES tone mapping (`effects/Post.tsx`), procedural canvas textures (`textures.ts`). N8AO crashes on three r187, do not re-add it.
- `?lite` or no WebGL → `src/lite/LitePage.tsx`.

## Deploy
Push to `main` → `.github/workflows/deploy.yml` → GitHub Pages. Repo Settings → Pages → Source must be "GitHub Actions".
