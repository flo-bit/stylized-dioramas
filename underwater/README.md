# Thalassa — The sunken garden

A standalone, interactive Three.js diorama inspired by `underwater.png`. Everything lives in this folder; there are no sibling-project dependencies.

## Run

```sh
pnpm install
pnpm dev
```

Open **http://127.0.0.1:5193**.

```sh
pnpm build       # production files in dist/
pnpm preview     # http://127.0.0.1:4193
```

## Explore

- **Drag** to orbit; **scroll / pinch** to zoom.
- Click the **treasure chest** to open or close its hinged lid.
- The **+ markers** and **Field guide** reveal three short stories about the world.
- **Pause**, **Orbit**, **Reset view**, and **Discover** control animation, camera movement, and markers.
- **Escape** closes the field guide.
- Reduced-motion preferences are respected. The scene also stops rendering when the tab is hidden.

## The little world

Procedurally modeled, flat-shaded geometry: an irregular turquoise cutaway seabed, chipped arch, fluted columns, broken steps, fallen masonry, faceted rocks, branching coral, hollow tube sponges, kelp, seaweed, amphorae, shells, starfish, and a wooden treasure chest filled with gold.

Fourteen individually modeled fish swim in small schools. Vertex-shader kelp sway, slowly shifting procedural caustics, instanced bubbles, and suspended flecks bring the garden to life. Static and movable geometry is batched into approximately **76 draw calls**, including shadows.

All runtime assets—including fonts—are served locally. No models, textures, external APIs, or CDN calls are needed. The reference image is not used as a background or as a substitute for the 3D scene.

## Files

| File | Purpose |
| --- | --- |
| `src/main.js` | Renderer, lighting, camera, interaction, and animation loop |
| `src/world.js` | Seabed, ruins, flora, treasure, and scenery |
| `src/wildlife.js` | Fish, bubbles, and suspended particles |
| `src/geometry.js` | Seeded randomness, geometry helpers, and batching |
| `src/materials.js` | Materials, caustics texture, and custom shaders |
| `src/style.css` | Responsive interface and locally hosted fonts |
| `underwater.png` | Original visual reference |
| `screenshots/` | Desktop, mobile, and open-chest captures |

## Verify

```sh
pnpm exec playwright install chromium
pnpm test
```

The browser tests cover loading without runtime errors or external requests, animation controls, the chest and field guide, drag/zoom/orbit/reset, mobile layout, and reduced motion.

Requires a modern browser with WebGL2 and Node.js 20.19+ or 22.12+ for Vite. Fonts are DM Sans and Playfair Display, distributed by Fontsource under the SIL Open Font License.
