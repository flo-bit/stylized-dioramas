# Komorebi · 木漏れ日

A standalone, interactive Three.js Japanese-garden diorama, inspired by [`asia.png`](./asia.png).

## Run

```sh
pnpm install
pnpm dev
```

Open **http://localhost:5187**. The fixed port avoids conflicting with other experiments.

```sh
pnpm build       # Production files → dist/
pnpm preview     # Preview the build at http://localhost:43187
pnpm test        # Browser smoke test; start the dev server first
```

The browser test uses an installed Google Chrome through Playwright. To test the production preview instead:

```sh
GARDEN_URL=http://localhost:43187 pnpm test
```

## Explore

- **Drag / swipe:** orbit the miniature.
- **Scroll / pinch:** zoom in and out.
- **Tap the water / Feed the koi / F:** scatter food and watch six koi approach.
- **Daylight / Blue hour:** smoothly transition the lighting, lanterns, and fireflies.
- **Space:** pause or resume the simulation.
- **R:** smoothly return to the original camera.
- **Sound:** opt-in, synthesized water and birds; no audio downloads.
- **Camera button:** save a PNG of the garden.

Reduced-motion preferences start the scene paused. Hidden tabs stop rendering and suspend audio.

## How it is made

All of the garden is procedural geometry, not a flat reference-image backdrop or an imported model:

- Irregular, faceted soil island with a ragged turf edge and a real pond opening.
- Four-sided curved, individually tiled pavilion roof, timber joinery, floorboards, and railings.
- Arched cedar bridge with sloped deck boards, rails, capped posts, and landing stones.
- Tapered, twisting cherry-tree branches and **5,280 instanced blossoms**.
- Layered bonsai foliage, jointed bamboo, shrubs, ferns, meadow grass, and wildflowers.
- Shader-driven water and caustics, submerged pebbles, notched lily pads, and lotus flowers.
- Six modeled koi with body markings and animated fins and tails.
- Falling petals, feeding ripples, warm lanterns, and blue-hour fireflies.
- Orthographic camera, antialiasing, cached static shadows, and screen-space ambient occlusion.

Static geometry is merged by material; repeated vegetation is instanced. No CDN, API key, image generation, external model, or runtime network service is required. Fonts are bundled locally under their included SIL Open Font Licenses.

## Files

```text
asia.png             Original visual reference (unchanged)
index.html           Accessible page and controls
src/main.js          Renderer, lighting, interactions, responsive framing
src/garden.js        Procedural geometry and garden simulation
src/audio.js         Opt-in Web Audio soundscape
src/style.css        Responsive interface
public/fonts/        Local fonts and licenses
tests/smoke.mjs      Desktop/mobile interaction and rendering checks
screenshots/         Browser-test captures: daylight, blue hour, mobile
```

Everything needed for this experiment lives in this folder.
