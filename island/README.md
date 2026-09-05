# Offshore — A little paradise

A standalone, interactive Three.js diorama inspired by `island.png`. Everything lives in this folder; the reference is unchanged.

## Run

```sh
pnpm install
pnpm dev
```

Open **http://127.0.0.1:5188/**. The port is strict so this experiment cannot silently open another project's server.

```sh
pnpm build       # Self-contained production site in dist/
pnpm preview     # Preview the production build
pnpm test        # Desktop/mobile browser smoke tests
```

Browser tests use Playwright Chromium. If needed, install it with `pnpm exec playwright install chromium`. Tests start their own server on port 43871.

## Explore

- **Drag** to orbit; **scroll / pinch** to zoom.
- **Orbit / R** — slowly circle the island.
- **Tides / Space** — pause or resume the water, palms, and boat.
- **Daylight / L** — transition into golden hour.
- **Reset / 0** — return to the original composition.
- **Camera / P** — download a PNG postcard of your current view.
- Hover over the palms and beach furniture for little notes.

The layout supports phones and respects reduced-motion preferences. A paused island stops rendering when the camera and lighting are settled. No external network requests are needed at runtime, including for fonts.

## Inside the scene

- Triangulated sand, sloping shallows, and an irregular layered island base.
- Animated procedural water with caustics, shoreline foam, and a translucent cutaway edge.
- Three curved, segmented palms with folded individual leaflets and coconuts.
- A nailed wooden dock, rope-wrapped pilings, a hollow planked rowboat, oars, and a life ring.
- A striped canvas deckchair, ribbed and scalloped umbrella, wooden crate, and coconut drink.
- Faceted boulders, ferns, grasses, flowers, shells, and raised starfish.
- Soft variance shadows, ground-truth ambient occlusion, and multisampled rendering.

All scene assets and textures are generated in JavaScript. Static geometry is batched by material, while animated elements remain independent. The included fonts are licensed under the SIL Open Font License; license files are in `public/fonts/`.

Source: `src/main.js`, `src/style.css`, and `src/scene/`. Tests: `tests/island.spec.js`. Browser checks save screenshots and a sample postcard to `artifacts/`.
