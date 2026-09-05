# The Forgotten Gate

A standalone, interactive Three.js diorama inspired by `ruins.png`. Everything lives in this folder; no sibling projects, remote models, image textures, or runtime CDN dependencies are used. Fonts are bundled locally.

## Run

```sh
pnpm install
pnpm dev
```

Open **http://127.0.0.1:4186**. A modern browser with WebGL2 and hardware acceleration is recommended.

```sh
pnpm build      # Production files in dist/
pnpm preview    # Preview the production build on port 4187
pnpm test       # Three Playwright integration tests
```

For a fresh Playwright installation, run `pnpm exec playwright install chromium` first.

## Explore

- **Drag / swipe** to orbit; **scroll / pinch** to zoom.
- **Orbit** starts or stops a slow turntable.
- **Daylight** switches to dusk, with fireflies and a soft glow inside the gate.
- **Reset** returns to the original composition.
- **Camera** downloads a PNG postcard without the interface.
- **Field notes** opens the scene's short story.
- With the canvas focused: **← / →** rotate, **+ / −** zoom, **Home** resets.
- Reduced-motion preferences disable ambient motion. Automatic orbit remains opt-in.

## Construction

All 3D assets are generated deterministically from geometry:

- Individually bevelled masonry, radial arch stones, a carved labyrinth keystone, six uneven steps, and a flagstone courtyard.
- A twisted, branching tree with raised bark grain, spreading roots, and layered oak leaves.
- Fern fronds, heart-shaped ivy, moss, grasses, wildflowers, mushrooms, and butterflies.
- An irregular earth cutaway with embedded stones and a continuous ground surface.
- Orthographic framing, cached variance shadows, desktop ambient occlusion, antialiasing, and warm/cool lighting transitions.

Approximately **21,700 instances and 398,000 triangles**, with static geometry merged and foliage instanced. Desktop rendering was measured at approximately 60 fps on the local M1 Pro using Metal. The test configuration enables Metal on macOS rather than Chromium's much slower software renderer.

## Files

| File | Purpose |
| --- | --- |
| `src/main.js` | Rendering, lighting, camera, animation, UI controls |
| `src/world/geometry.js` | Seeded randomness, batching, stone and branch geometry |
| `src/world/landscape.js` | Cutaway base, courtyard, path, rocks |
| `src/world/architecture.js` | Ruined walls, steps, arch, keystone |
| `src/world/tree.js` | Tree, roots, canopy, climbing roots |
| `src/world/foliage.js` | Instanced plants, flowers, ivy, wind |
| `src/style.css` | Responsive interface and local fonts |
| `tests/diorama.spec.js` | Rendering, orbit/zoom/reset, lighting, export, mobile tests |
| `artifacts/` | Desktop, dusk, and mobile screenshots |
| `ruins.png` | Original reference, unchanged |
