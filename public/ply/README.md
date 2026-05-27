# PLY / SOG assets

Place Gaussian splat files here for the demo:

- `demo.compressed.ply` — default path used by the Vite demo
- Or any `*.ply` / `*.sog` / `*.ksplat` supported by `@mkkellogg/gaussian-splats-3d`

## Copy from my-second-brain (optional)

From the parent repo root:

```powershell
Copy-Item ..\public\ply\kyoto.compressed.ply .\demo.compressed.ply
```

Large raw `*.ply` (~63 MiB) are usually **not** committed; use `*.compressed.ply` or `.sog` instead.

Convert scripts live in `../scripts/`.
