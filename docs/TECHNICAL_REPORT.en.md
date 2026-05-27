# GS Ambient Wallpaper — Technical Report

> **Type:** Architecture & design  
> **Project:** `gs-ambient-wallpaper` (standalone 3DGS ambient wallpaper library + demo)  
> **Version:** 0.1.0 · **Updated:** 2026-05-26  
> **User docs:** [README.md](../README.md) · [中文版](./TECHNICAL_REPORT.md)

English summary of the full Chinese report. For section-by-section detail (camera constants, Viewer flags, lifecycle), see **[TECHNICAL_REPORT.md](./TECHNICAL_REPORT.md)**.

---

## Summary

Renders a **non-interactive full-screen 3D Gaussian Splatting background** in the browser using `@mkkellogg/gaussian-splats-3d`. Fixed composition, subtle parallax (gyro / mouse / optional webcam), Vision Pro–style CSS post-processing.

**Not** an orbit-style splat explorer: controls disabled, `pointer-events: none`, `progressiveLoad: false`.

---

## Architecture

```
Host App → SplatWallpaperLayer.svelte (optional)
         → createGS3Wallpaper()
         → spatial-camera + webcam-tilt-tracker
         → GaussianSplats3D.Viewer + Three.js
         → gs-wallpaper.css
         → public/ply/*
```

---

## Key modules

| Path | Role |
|------|------|
| `src/core/gs3-wallpaper.ts` | Viewer, load, rAF loop, dispose |
| `src/core/spatial-camera.ts` | Parallax → camera |
| `src/core/webcam-tilt-tracker.ts` | Optional head track |
| `src/components/SplatWallpaperLayer.svelte` | Svelte 5 wrapper, poster fallback |
| `src/styles/gs-wallpaper.css` | Vignette, fade-in, glass HUD |

---

## Integration (minimal)

```ts
import { createGS3Wallpaper } from './src/core';
import './src/styles/gs-wallpaper.css';

const engine = createGS3Wallpaper(hostEl, {
  url: '/ply/scene.compressed.ply',
  speed: 1,
  onStatus: (s) => {
    document.body.classList.toggle('ply-wallpaper-active', s === 'ready');
  },
});
await engine.dispose();
```

---

## Assets

- Prefer `*.compressed.ply` for runtime (~smaller than raw ~63 MiB PLY)
- Conversion scripts in `scripts/`
- Demo default: `public/ply/demo.compressed.ply`, override with `VITE_DEMO_PLY_URL`

---

## Build & deploy

```bash
npm install
npm run dev    # :5175
npm run build  # dist/ ~700KB+ JS (three + gs3)
```

Use `.npmrc` (`ignore-workspace=true`) when nested inside a pnpm monorepo.

---

## Provenance

Copied from [my-second-brain](https://github.com/Takalahiro/my-second-brain1). See [ORIGIN.md](../ORIGIN.md).

---

## License

MIT — see [LICENSE](../LICENSE).
