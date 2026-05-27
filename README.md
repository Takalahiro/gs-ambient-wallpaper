# GS Ambient Wallpaper

[中文说明](./README.zh.md) · [技术文档](./docs/TECHNICAL_REPORT.md) · [Technical Report (EN)](./docs/TECHNICAL_REPORT.en.md)

Non-interactive **full-screen 3D Gaussian Splatting (3DGS) ambient wallpaper** for the web.

Extracted from [my-second-brain](https://github.com/Takalahiro/my-second-brain1) as a standalone library + demo. The parent monorepo keeps its original code unchanged; this folder is a **local copy** under `_standalone/` (gitignored in the parent repo).

## Features

- Renders `.ply` / `.sog` / `.ksplat` via [`@mkkellogg/gaussian-splats-3d`](https://github.com/mkkellogg/GaussianSplats3D)
- Fixed “environment” camera with subtle parallax (mouse, gyro, optional webcam head-track)
- Mobile UA → poster fallback (no WebGL)
- Vision Pro–style vignette + glass HUD CSS (`gs-wallpaper.css`)
- Svelte 5 component wrapper (`SplatWallpaperLayer.svelte`) or plain TS API (`createGS3Wallpaper`)

## Quick start

```bash
cd _standalone/gs-ambient-wallpaper   # when inside my-second-brain
npm install   # isolated from parent pnpm workspace (.npmrc)

# Add a splat file (example: copy from parent public/ply)
copy ..\..\public\ply\kyoto.compressed.ply public\ply\demo.compressed.ply

pnpm dev
# → http://localhost:5175
```

## API (TypeScript)

```ts
import { createGS3Wallpaper } from './src/core';

const engine = createGS3Wallpaper(hostElement, {
  url: '/ply/scene.compressed.ply',
  speed: 1,
  onStatus: (status, message) => console.log(status, message),
});

// later
await engine.dispose();
```

## Open-sourcing this folder

1. Copy `_standalone/gs-ambient-wallpaper` to a new git repository
2. `pnpm install && pnpm build`
3. Ship your own `public/ply/*` assets (or document download steps)
4. MIT license included (`LICENSE`)

See [ORIGIN.md](./ORIGIN.md) for file provenance from my-second-brain.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/TECHNICAL_REPORT.md](./docs/TECHNICAL_REPORT.md) | Full architecture (中文) |
| [docs/TECHNICAL_REPORT.en.md](./docs/TECHNICAL_REPORT.en.md) | English summary |

## Scripts (copied from parent)

| Script | Purpose |
|--------|---------|
| `scripts/convert-ply-to-sog.mjs` | PLY → SOG |
| `scripts/convert-sog-to-compressed-ply.mjs` | SOG → compressed PLY |
| `scripts/diagnose-gs3.mjs` | Playwright smoke test (needs dev server) |

## License

MIT — see [LICENSE](./LICENSE).
