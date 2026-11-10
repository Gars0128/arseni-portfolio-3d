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
- `src/scene/Experience.tsx`: lights + object list. The room is modelled on the owner's real room (photos). Meters; desk top y=0.76, back wall z=-2 with a window hole at x 2.25–3.05, right wall x=3.4.
- `src/scene/CameraRig.tsx`: room ↔ monitor camera, limits, parallax.
- `src/scene/objects/Monitor.tsx`: `SCREEN` constant drives both the camera target and the `<Html>` size.
- Look = ring-lamp spotlight with soft PCSS shadows, cool window light, Lightformer environment, SSAO + bloom + AgX tone mapping (`effects/Post.tsx`), procedural canvas textures (`textures.ts`). N8AO crashes on three r187, do not re-add it.
- No WebGL → `src/lite/LitePage.tsx` (fallback only, no UI link).

## Deploy
Push to `main` → `.github/workflows/deploy.yml` → GitHub Pages. Repo Settings → Pages → Source must be "GitHub Actions".

## Local-only course assets
- `public/room/` (git-ignored) holds course assets. Only `topChairModel.glb` + `bakedDay/Night.jpg` are used (`objects/AssetChair.tsx`); when they are absent (CI, public deploy) the procedural `objects/Chair.tsx` renders instead. Never commit `public/room/`.
- `public/draco/` is three's MIT Draco decoder, needed to load that chair.
- Day/night: `store.night` → `dayMix` (objects/Lights.tsx) drives every light, the window sky, sunbeam and the LED arc. LED palette: `LED_COLORS` in store.ts.

## Kero (robot desk frog assistant)
- `src/assistant/brain.ts`: offline retrieval (BM25 + intents) over projects + `site.ts`. No LLM, no API key; answers only from portfolio content, refuses prompt-injection and off-topic. Tested by `scripts/test-assistant.ts` (part of `npm run check`) — add a case when you change intents.
- `voice.ts`: Web Speech API (mic) + speechSynthesis; Firefox falls back to text.
- Name lives in `ASSISTANT_NAME` (brain.ts). `scene/objects/Robot.tsx` (3D robot frog, click → chat), `AssistantPanel.tsx` (chat UI). "Open project" uses `store.openProject` → Desktop opens it.
