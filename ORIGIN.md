# Provenance · 文件来源

Snapshot copied from **my-second-brain** on 2026-05-26.

| Standalone path | Source in my-second-brain |
|-----------------|---------------------------|
| `src/core/gs3-wallpaper.ts` | `src/features/wallpaper/render/gs3/gs3-wallpaper.ts` |
| `src/core/spatial-camera.ts` | `src/features/wallpaper/render/gs3/spatial-camera.ts` (import → `./is-mobile`) |
| `src/core/webcam-tilt-tracker.ts` | `src/features/wallpaper/render/gs3/webcam-tilt-tracker.ts` |
| `src/core/is-mobile.ts` | `src/features/wallpaper/device/is-mobile.ts` |
| `src/components/SplatWallpaperLayer.svelte` | `src/components/widgets/BackgroundPlyLayer.svelte` (paths adapted) |
| `src/styles/gs-wallpaper.css` | `src/styles/gs-wallpaper.css` (+ `.gs-glass-panel` for demo) |
| `scripts/*.mjs` | `scripts/convert-*.mjs`, `scripts/diagnose-gs3.mjs` |

**Not included** (still only in my-second-brain):

- `BackgroundLayer.svelte` (video/poster/ply mode switcher)
- `WidgetHost` / Control Center UI
- Legacy `am15` / `GSWallpaper.svelte` renderer
- Binary assets under `public/ply/` (copy manually)

When syncing updates from the parent project, re-copy the files above and diff.

## Documentation (standalone only)

| Path | Description |
|------|-------------|
| `docs/TECHNICAL_REPORT.md` | Full technical report (中文) |
| `docs/TECHNICAL_REPORT.en.md` | English summary |
