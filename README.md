# Stylized dioramas

Six interactive Three.js worlds, one private repository, one public GitHub Pages site.

**Gallery:** https://flo-bit.dev/stylized-dioramas/  
**Repository:** https://github.com/flo-bit/stylized-dioramas

| Project | World | Live page |
| --- | --- | --- |
| `italy-town/` | Porto piccolo — Italian harbor | [Explore](https://flo-bit.dev/stylized-dioramas/italy-town/) |
| `asia/` | Komorebi — Japanese garden | [Explore](https://flo-bit.dev/stylized-dioramas/asia/) |
| `island/` | Offshore — Tropical island | [Explore](https://flo-bit.dev/stylized-dioramas/island/) |
| `night-street/` | Ame Yokochō — Tokyo after dark | [Explore](https://flo-bit.dev/stylized-dioramas/night-street/) |
| `ruins/` | The Forgotten Gate — Forest ruins | [Explore](https://flo-bit.dev/stylized-dioramas/ruins/) |
| `underwater/` | Thalassa — The sunken garden | [Explore](https://flo-bit.dev/stylized-dioramas/underwater/) |

Click the name/logo in the top-left of any diorama to return to the gallery.

## Local development

Use Node.js 24 (minimum 22.12) and pnpm 10.30.1.

```sh
pnpm install --frozen-lockfile
pnpm --dir italy-town dev  # Or asia, island, night-street, ruins, underwater
```

Each project retains its own source, Vite configuration, dependency versions, and tests. See its README for controls and its development-server port. The root pnpm workspace installs everything using a single lockfile.

## Build and preview the entire site

```sh
pnpm build
pnpm preview
# http://127.0.0.1:4173/
```

`site/` is the lightweight, static gallery. Its previews are compressed screenshots of the actual scenes; no WebGL scenes load until a visitor opens one.

`scripts/build.mjs` builds the gallery into `dist/`, then each diorama into `dist/<project>/` using its own Vite version and the correct URL prefix. No SPA routing or rewrite service is required.

To reproduce the GitHub Pages subpath locally:

```sh
pnpm build --base /stylized-dioramas/
SITE_BASE=/stylized-dioramas/ pnpm preview
# http://127.0.0.1:4173/stylized-dioramas/
```

## Tests

The root browser smoke suite checks the gallery on desktop/mobile, all six direct scene URLs, WebGL readiness, local asset requests, and navigation back to the gallery.

```sh
pnpm exec playwright install chromium
pnpm build --base /stylized-dioramas/
SITE_BASE=/stylized-dioramas/ pnpm test  # Starts the production preview automatically
```

To use an installed Google Chrome instead: `PLAYWRIGHT_CHANNEL=chrome SITE_BASE=/stylized-dioramas/ pnpm test`.
To test a deployed site: `TEST_URL=https://flo-bit.dev/stylized-dioramas/ pnpm test`.
Individual projects also retain their more detailed interaction tests.

## Deployment

`.github/workflows/deploy.yml` installs the workspace with the frozen lockfile, builds all seven pages with the base path supplied by GitHub Pages, runs the browser smoke tests, and deploys the combined `dist/` artifact. Pushes to `main` deploy automatically; pull requests build and test without deploying. Manual deployments are available from GitHub Actions.

Pages uses **GitHub Actions** as its source. The repository is private, but the website and the browser assets it serves are public, just like the previous Italy-only deployment. Private-repository Pages requires a supporting GitHub plan.

The former `flo-bit/stylized-diorama` repository and `/stylized-diorama/` URL are replaced by this collection.
