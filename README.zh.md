# GS Ambient Wallpaper · 3DGS 环境壁纸

Web 全屏 **3D Gaussian Splatting 环境壁纸**（不可交互、仅作背景）。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/TECHNICAL_REPORT.md](./docs/TECHNICAL_REPORT.md) | 完整技术文档（架构、API、资产、集成） |
| [docs/TECHNICAL_REPORT.en.md](./docs/TECHNICAL_REPORT.en.md) | English summary |
| [ORIGIN.md](./ORIGIN.md) | 与主项目文件对照 |

## 能力

- 基于 `@mkkellogg/gaussian-splats-3d` 加载 `.ply` / `.sog` / `.ksplat`
- 固定环境机位 + 鼠标/陀螺仪/可选摄像头视差
- 移动端 UA 自动降级为 poster 图（不跑 WebGL）
- `gs-wallpaper.css`：径向羽化、缓入、液态玻璃 HUD
- Svelte 组件 `SplatWallpaperLayer.svelte` 或 TS API `createGS3Wallpaper`

## 目录结构

```
gs-ambient-wallpaper/
├── src/core/              # 引擎（自 my-second-brain 复制）
├── src/components/        # SplatWallpaperLayer.svelte
├── src/styles/            # gs-wallpaper.css
├── demo/                  # Vite + Svelte 演示
├── scripts/               # PLY/SOG 转换与诊断
└── public/ply/            # 放置点云资产（需自行复制）
```

## 本地运行

```powershell
cd _standalone\gs-ambient-wallpaper
npm install
Copy-Item ..\..\public\ply\kyoto.compressed.ply public\ply\demo.compressed.ply
npm run dev
```

浏览器打开 http://localhost:5175

## 单独开源步骤

1. 将整个 `gs-ambient-wallpaper` 文件夹复制到新 Git 仓库
2. 删除或保留 `ORIGIN.md` 均可
3. 提交 `LICENSE`、`README`、源码；大体积 `*.ply` 建议 Git LFS 或部署期上传
4. `pnpm install && pnpm build`

## 与主项目的对应关系

详见 [ORIGIN.md](./ORIGIN.md) 与 [docs/TECHNICAL_REPORT.md §16](./docs/TECHNICAL_REPORT.md#16-与-my-second-brain-的关系)。

## 协议

MIT — 见 [LICENSE](./LICENSE)。
