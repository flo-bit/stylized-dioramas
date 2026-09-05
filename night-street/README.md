# 雨 — Ame Yokochō

**After the rain.** An interactive, stylized Three.js diorama inspired by `night-street.png`.

An independent experiment built entirely in this directory. All scene geometry, material textures, Japanese signs, posters, and weather effects are created in code. No downloaded 3D models, generated images, or assets from neighboring experiments.

## Run

```sh
pnpm install
pnpm dev
```

Open **http://127.0.0.1:43127**. The dedicated, strict port prevents accidentally opening another experiment.

```sh
pnpm build       # Production files → dist/
pnpm preview     # Serve the build on port 43128
pnpm test        # Browser smoke tests and screenshots
```

The tests start their own temporary server and use installed Google Chrome through Playwright. To use another Playwright browser, change the launch options in `scripts/check.mjs`.

## Explore

- **Drag** to orbit; **scroll / pinch** to zoom.
- **R** — rain and pavement ripples.
- **L** — neon on/off; doorway lamps stay on.
- **O** — slow automatic orbit.
- **0** — return to the original composition.
- **S** — download a PNG postcard, without the interface.
- **F** — fullscreen, where supported.

The corresponding buttons work on touchscreens. Reduced-motion preferences disable ambient animation and start with rain off; rain can still be explicitly enabled.

## The miniature

- Beveled, weathered masonry assembled into an L-shaped cutaway alley.
- Japanese hotel and ramen neon, a noodle-bowl sign, warm windows and caged wall lamps.
- Standing-seam awning, paneled hotel door, rolling shutter, electrical cabinets, and a network of pipes and suspended cables.
- Air conditioners with slowly moving fans; open-grate fire escape, stairs and rooftop ladder.
- Wheeled dumpster, tied rubbish bags, open bottle crates, a cardboard box, plants, graffiti, drain, manhole and scattered litter.
- Masked planar puddle reflections, broken painted light trails, animated rain and expanding ripple rings.
- Orthographic camera, soft contact shadow, screen-space ambient occlusion, restrained HDR bloom and ACES tone mapping.

## Files

| File | Purpose |
| --- | --- |
| `src/main.js` | Rendering, lighting, camera, post-processing and controls |
| `src/diorama.js` | Geometry, materials, assembly, props and puddles |
| `src/textures.js` | Seeded procedural canvas textures and lettering |
| `src/weather.js` | Rain and instanced ripple animation |
| `src/style.css` | Responsive interface |
| `scripts/check.mjs` | Desktop/mobile, controls, export and reduced-motion checks |

Browser checks save screenshots and a postcard in `artifacts/`. WebGL 2 is required. The optional Google Fonts stylesheet has local system-font fallbacks; the 3D scene itself requires no external assets.
