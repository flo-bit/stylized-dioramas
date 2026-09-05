# Porto piccolo

A little Italian harbor, built from scratch in Three.js using `italy.png` as the visual reference. No borrowed scene code, downloaded 3D models, or generated bitmap scenery.

## Run

```sh
pnpm install
pnpm dev
```

Open **http://localhost:4310**. Requires Node.js 20.19+ and a WebGL2-capable browser.

```sh
pnpm build     # Static production build in dist/
pnpm preview   # Preview at http://localhost:4311
```

## Deployment

- Private repository: https://github.com/flo-bit/stylized-dioramas
- Public website: https://flo-bit.dev/stylized-dioramas/italy-town/
- Collection: https://flo-bit.dev/stylized-dioramas/

This project deploys together with the other five dioramas via the workflow at `../.github/workflows/deploy.yml`. See the [root README](../README.md) for workspace setup, the combined build, and deployment. Click the brand name to return to the collection.

To check this project's Pages build locally (from this folder):

```sh
pnpm build --base /stylized-dioramas/italy-town/
pnpm preview --base /stylized-dioramas/italy-town/
# In another terminal:
TEST_URL=http://127.0.0.1:4311/stylized-dioramas/italy-town/ pnpm test:visual
```

## Explore

- Drag / swipe to orbit; scroll / pinch to zoom.
- Switch between daylight, golden hour, and night. Night adds cool moonlight, glowing windows and lanterns, warm reflections on the harbor, and a matching dark interface.
- Use the circular arrow for a slow automatic orbit; the house resets the view.
- The speaker enables locally synthesized harbor ambience. Audio is off initially.
- Keyboard, with the canvas focused: left/right arrows to orbit, `+` / `-` to zoom, `R` / `Home` to reset.
- Reduced-motion preferences disable ambient boat, water, and bird animation and make lighting changes immediate. Rotation remains available when explicitly requested.

## The little details

Pastel plaster houses, hollow curved terracotta tiles, louvered shutters, flower-filled balconies, laundry and clothespins, irregular Voronoi paving, a stepped alley, café furniture and espresso cups, a scalloped linen umbrella, fishing nets, wooden crates, mooring ropes, lanterns, and a gently bobbing fishing boat.

The scene uses procedural geometry and canvas-drawn signs, animated water caustics, contact-hardening sunlight, ambient occlusion, multisampling, and SMAA. Static geometry is merged by material; shadow updates are throttled. Pixel density is capped at 2. Fonts and the reference image are served locally, so the production site makes no external requests.

## Source map

- `src/modeling.js` — geometry helpers, seeded randomness, materials, mesh batching
- `src/village.js` — architecture, roof tiles, plants, café, laundry
- `src/harbor.js` — stone base, paving, water, fishing boat, waterfront props
- `src/soft-shadows.js` — contact-hardening shadow shader
- `src/main.js` — lighting, rendering, animation, controls, audio
- `src/style.css` — responsive interface

## Browser smoke test

With the dev server running and Google Chrome installed:

```sh
pnpm test:visual
# Or test the production preview:
TEST_URL=http://127.0.0.1:4311 pnpm test:visual
```

Tests rendering, all three lighting modes and return-to-day restoration, camera interactions, reset, audio, the about dialog, the reference asset, responsive resizing, and reduced-motion retina mobile interactions. Screenshots are saved to `screenshots/`.

DM Sans and Italiana are distributed under the SIL Open Font License; their licenses are included in `public/fonts/`.
