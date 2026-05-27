# GS Ambient Wallpaper — 技术文档

> **文档类型：** 架构与设计说明  
> **项目：** `gs-ambient-wallpaper`（独立 3DGS 环境壁纸库 + Demo）  
> **版本：** 0.1.0  
> **最后更新：** 2026-05-26  
> **用户文档：** [README.zh.md](../README.zh.md) · [README.md](../README.md)

---

## 目录

1. [摘要](#1-摘要)
2. [设计目标与边界](#2-设计目标与边界)
3. [系统架构](#3-系统架构)
4. [目录与模块索引](#4-目录与模块索引)
5. [渲染引擎（gs3-wallpaper）](#5-渲染引擎gs3-wallpaper)
6. [空间相机与视差](#6-空间相机与视差)
7. [Svelte 组件层](#7-svelte-组件层)
8. [样式与后期（gs-wallpaper.css）](#8-样式与后期gs-wallpapercss)
9. [资产管道](#9-资产管道)
10. [Demo 应用](#10-demo-应用)
11. [生命周期与并发安全](#11-生命周期与并发安全)
12. [集成指南](#12-集成指南)
13. [构建、部署与体积](#13-构建部署与体积)
14. [诊断与脚本](#14-诊断与脚本)
15. [性能与已知限制](#15-性能与已知限制)
16. [与 my-second-brain 的关系](#16-与-my-second-brain-的关系)
17. [API 参考](#17-api-参考)

---

## 1. 摘要

**GS Ambient Wallpaper** 在 Web 页面中渲染 **不可交互的全屏 3D Gaussian Splatting（3DGS）背景**，模仿 Apple Vision Pro 式「环境壁纸」：固定构图、轻微视差、电影感后期，前景 UI 仍可正常操作。

与常见 3DGS **漫游查看器**的区别：

| 维度 | 本库 | 典型 3DGS Viewer |
|------|------|------------------|
| 交互 | 禁用 OrbitControls，canvas `pointer-events: none` | 拖拽旋转、缩放 |
| 构图 | 常量机位 + 每帧 lock | 用户自由探索 |
| 加载 | 一次性全量加载（`progressiveLoad: false`） | 常开 progressive |
| 移动端 | UA/窄屏 → poster 静态图，不启 WebGL | 常强制跑 WebGL |
| 集成 | 单层 DOM + TS API / Svelte 组件 | 独立全屏 App |

底层渲染依赖 [`@mkkellogg/gaussian-splats-3d`](https://github.com/mkkellogg/GaussianSplats3D)（Three.js）。

---

## 2. 设计目标与边界

### 2.1 目标

| 目标 | 实现手段 |
|------|----------|
| 不抢交互 | Viewer `useBuiltInControls: false`；canvas 不可点 |
| 画面稳定 | 关闭 progressive load，避免加载过程中构图漂移 |
| 沉浸感 | 径向羽化 vignette、柔焦 filter、1.5s 缓入 |
| 深度感 | 陀螺仪（移动）/ 鼠标或摄像头（桌面）微幅视差 |
| 前景可读 | `body.ply-wallpaper-active` 时加强玻璃面板 blur/saturate |
| 可嵌入 | 无框架强绑定：核心为纯 TS，Svelte 仅为可选封装 |

### 2.2 非目标（当前版本不做）

- 点云编辑、拾取、测量
- 多场景无缝 crossfade（需在上层 App 自行切换 URL + dispose）
- 服务端流式传输 / LOD 分块（依赖 gs3 库能力与资产预处理）
- WebXR 沉浸模式（`webXRMode: None`）

---

## 3. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│  Demo / 宿主 App（任意框架）                                  │
│  demo/DemoApp.svelte · 或自研容器 div                         │
├─────────────────────────────────────────────────────────────┤
│  组件层（可选）                                               │
│  src/components/SplatWallpaperLayer.svelte                  │
│  · poster 降级 · loadGen · disposeChain · AbortController     │
├─────────────────────────────────────────────────────────────┤
│  核心 TS API                                                  │
│  createGS3Wallpaper(host, opts) → { dispose }                │
├─────────────────────────────────────────────────────────────┤
│  空间运动                                                     │
│  spatial-camera · webcam-tilt-tracker · is-mobile             │
├─────────────────────────────────────────────────────────────┤
│  第三方渲染                                                   │
│  @mkkellogg/gaussian-splats-3d · three                        │
├─────────────────────────────────────────────────────────────┤
│  样式后期                                                     │
│  src/styles/gs-wallpaper.css                                  │
├─────────────────────────────────────────────────────────────┤
│  静态资产                                                     │
│  public/ply/*.compressed.ply · *.sog · poster 图              │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 运行时数据流

```
plyUrl 变更 / 组件 mount
    → SplatWallpaperLayer 创建 AbortController
    → disposeChain 等待旧 engine.dispose()
    → createGS3Wallpaper(host, { url, speed, signal, onStatus })
        → new GaussianSplats3D.Viewer({ rootElement: host, ... })
        → createSpatialMotionController({ base 机位, speed })
        → viewer.addSplatScene(url, { format, rotation, ... })
        → onStatus('ready') → 启动 rAF：applyCamera → update → render
    → CSS .is-webgl-ready / body.ply-wallpaper-active
```

---

## 4. 目录与模块索引

```
gs-ambient-wallpaper/
├── src/
│   ├── core/
│   │   ├── gs3-wallpaper.ts      # Viewer 封装、加载、渲染循环
│   │   ├── spatial-camera.ts     # 视差 / 陀螺仪 / 鼠标 / 摄像头
│   │   ├── webcam-tilt-tracker.ts
│   │   ├── is-mobile.ts          # UA + 768px 窄屏判定
│   │   └── index.ts              # 统一导出
│   ├── components/
│   │   └── SplatWallpaperLayer.svelte
│   └── styles/
│       └── gs-wallpaper.css
├── demo/                         # Vite 根目录（见 vite.config.ts）
├── public/ply/                   # 点云与 poster 静态文件
├── scripts/                      # 资产转换与 Playwright 诊断
└── docs/
    └── TECHNICAL_REPORT.md       # 本文档
```

| 模块 | 职责 |
|------|------|
| `gs3-wallpaper.ts` | 创建 Viewer、加载场景、rAF、dispose |
| `spatial-camera.ts` | 将 tilt 应用到 `THREE.PerspectiveCamera` |
| `webcam-tilt-tracker.ts` | 桌面可选：FaceDetector 或光流估计头部位置 |
| `is-mobile.ts` | 移动降级 gate |
| `SplatWallpaperLayer.svelte` | 生命周期、poster、状态回调 |
| `gs-wallpaper.css` | 羽化、缓入、玻璃 HUD |

---

## 5. 渲染引擎（gs3-wallpaper）

**文件：** `src/core/gs3-wallpaper.ts`

### 5.1 Viewer 关键配置

```typescript
new GaussianSplats3D.Viewer({
  rootElement: host,
  selfDrivenMode: false,           // 由本库 rAF 驱动 render
  useBuiltInControls: false,       // 禁用轨道控制
  sharedMemoryForWorkers: false,
  gpuAcceleratedSort: false,
  integerBasedSort: false,
  enableSIMDInSort: true,
  sceneRevealMode: SceneRevealMode.Instant,
  renderMode: RenderMode.OnChange,
  antialiased: false,
  sphericalHarmonicsDegree: 0,
  halfPrecisionCovariancesOnGPU: true,
  optimizeSplatData: true,
  webXRMode: WebXRMode.None,
  // 初始机位（与 spatial-camera base 一致）
  initialCameraPosition: [0, CAMERA_HEIGHT, CAMERA_DISTANCE],
  initialCameraLookAt: [0, lookAtY, 0],
});
```

### 5.2 机位常量

| 常量 | 值 | 说明 |
|------|-----|------|
| `CAMERA_DISTANCE` | `0.275 / 1.5` | 相机离原点距离 |
| `CAMERA_HEIGHT` | `0.05` | 相机高度 |
| `CAMERA_PITCH_UP_DEG` | `5°` | 轻微仰角 |
| `LOAD_TIMEOUT_MS` | `120_000` | 加载超时 |

### 5.3 ML-Sharp 朝向修正

部分 ML-Sharp 导出模型上下颠倒，加载时施加 **X 轴 π 旋转**：

```typescript
const ML_SHARP_ROTATION = quaternionFromAxisAngle(X, Math.PI);
// 传入 addSplatScene({ rotation: ML_SHARP_ROTATION })
```

若自有资产方向正确，可在 fork 中改为单位四元数或暴露为 `opts.rotation`。

### 5.4 支持的文件格式

由 URL 扩展名推断（`sceneFormatFromUrl`）：

| 扩展名 | SceneFormat |
|--------|-------------|
| `.ksplat` | KSplat |
| `.splat` | Splat |
| 其他（含 `.ply`） | Ply |

`splatAssetUrl(url)` 会拼接 Vite `BASE_URL`，支持相对路径与绝对 URL。

### 5.5 状态回调

```typescript
type GS3WallpaperStatus = 'loading' | 'ready' | 'failed';
```

- `loading` — 开始 `addSplatScene`
- `ready` — 场景加载完成，渲染循环启动
- `failed` — 异常或 120s 超时

---

## 6. 空间相机与视差

**文件：** `src/core/spatial-camera.ts`

### 6.1 输入优先级

```
prefers-reduced-motion → 固定机位，无视差
移动端 + DeviceOrientation 可用 → 陀螺仪 tilt
桌面 + webcam 跟踪成功 → 摄像头 tilt
桌面 + pointer fallback → 鼠标位置映射微幅 tilt
否则 → 零 tilt
```

### 6.2 增益常量（摘录）

| 场景 | 位置增益 | 注视增益 |
|------|----------|----------|
| 陀螺仪 / 摄像头 | `GYRO_POS` roll 0.85, pitch 0.55 | `GYRO_LOOK` |
| 桌面鼠标（全幅） | 同上 | 同上 |
| 移动弱鼠标回退 | `POINTER_FALLBACK_*`（更小） | 更小 |

`speed` 选项（来自 `createGS3Wallpaper`）传入 controller，影响呼吸动画（本壁纸默认 `enableBreath: false`）。

### 6.3 iOS 陀螺仪权限

`DeviceOrientationEvent.requestPermission()` 在用户首次 click / touch 后调用；拒绝则保持零 tilt。

### 6.4 Webcam 跟踪

**文件：** `src/core/webcam-tilt-tracker.ts`

- 优先 `FaceDetector` API（Chrome 等）
- 回退：帧间亮度差分质心（轻量光流）
- 隐藏 1×1 video + canvas，不展示预览
- 需用户授权摄像头；拒绝后回退鼠标视差

---

## 7. Svelte 组件层

**文件：** `src/components/SplatWallpaperLayer.svelte`

### 7.1 Props

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `plyUrl` | `string` | — | PLY/SOG/ksplat URL |
| `poster` | `string \| null` | `null` | 加载前 / 失败 / 移动端展示 |
| `speed` | `number` | `1` | 视差速度倍率 |
| `onStatus` | `(status, msg?) => void` | — | `loading \| ready \| failed` |

### 7.2 移动降级

`isMobileUa()` 为 true 时：

- 不创建 `createGS3Wallpaper`
- 若有 `poster` 则直接显示静态图
- 立即 `onStatus('ready')`

窄屏判定见 `isMobileWallpaperDevice()`（≤768px），组件层当前仅用 UA；宿主可在 mount 前自行决定 `posterOnly`。

### 7.3 CSS 状态类

| 类名 | 含义 |
|------|------|
| `.ply-layer.is-visible` | 层 opacity 1 |
| `.is-webgl-ready` | WebGL 首帧就绪，显示 canvas |
| `.is-ready` | 配合 `gs-wallpaper.css` 后期（Demo 与组件均会设置） |
| `.is-failed` | 加载失败，显示 `.ply-error` |

---

## 8. 样式与后期（gs-wallpaper.css）

**文件：** `src/styles/gs-wallpaper.css`

| 特性 | 选择器 / 机制 |
|------|----------------|
| 径向羽化 | `.ply-layer.gs-wallpaper.is-ready::after` 椭圆渐变遮罩 |
| 缓入 + 柔焦 | `@keyframes gs-fade-in`，canvas/poster filter |
| 玻璃 HUD | `body.ply-wallpaper-active .gs-glass-panel`（Demo） |
| 主项目兼容 | 同文件内 `.glass-container` / `.pixel-card` / `.mac-menu-bar` 规则保留 |
| 减少动效 | `@media (prefers-reduced-motion: reduce)` 关闭 animation |

**集成时：** ready 后在 `document.body` 加上 `ply-wallpaper-active`，卸载时移除。

---

## 9. 资产管道

### 9.1 推荐文件类型

| 文件 | 典型大小 | Git | 用途 |
|------|----------|-----|------|
| `{name}.compressed.ply` | 视压缩率 | 可入库 | **运行时加载（推荐）** |
| `{name}.sog` | ~10 MiB 级 | 可入库 | manifest / 转换中间格式 |
| `{name}.ply` 原始 | ~63 MiB | 建议 ignore | 本地预处理，部署前转 compressed |

本仓库 `.gitignore` 默认忽略 `public/ply/*.ply` 与 `*.sog`，保留 `README.md`；开源时可改为 Git LFS。

### 9.2 转换脚本

| 脚本 | 命令示例 |
|------|----------|
| `scripts/convert-ply-to-sog.mjs` | `node scripts/convert-ply-to-sog.mjs input.ply output.sog` |
| `scripts/convert-sog-to-compressed-ply.mjs` | SOG → compressed PLY |

脚本自 my-second-brain 复制，依赖与用法见脚本头部注释。

### 9.3 Demo 默认路径

- 静态文件：`public/ply/demo.compressed.ply`
- 环境变量：`VITE_DEMO_PLY_URL`（见 `.env.example`）
- Demo UI 可实时修改 PLY URL 文本框调试

---

## 10. Demo 应用

| 项 | 说明 |
|----|------|
| 入口 | `demo/index.html` → `demo/main.ts` → `DemoApp.svelte` |
| 开发 | `npm run dev` → http://localhost:5175 |
| 构建 | `npm run build` → `dist/` |
| Vite 根 | `root: 'demo'`，`publicDir: ../public` |

Demo 在左上角 HUD 中暴露 URL / poster / speed，便于验收视差与加载状态。

---

## 11. 生命周期与并发安全

### 11.1 disposeChain

切换 `plyUrl` 或 unmount 时：

1. `AbortController.abort()` 中止进行中的加载
2. `await` 上一实例 `dispose()`（Viewer + DOM 清空）
3. 再创建新 `createGS3Wallpaper`

避免双 Viewer 争抢同一 `host` 或 WebGL context 泄漏。

### 11.2 页面可见性

`document.visibilitychange` → 隐藏 tab 时跳过 rAF 内 `update/render`，节省 GPU。

### 11.3 加载 abort

`opts.signal`（AbortSignal）触发时执行完整 `teardown()`：取消 rAF、移除监听、`viewer.dispose()`、`host.replaceChildren()`。

---

## 12. 集成指南

### 12.1 纯 TypeScript（任意框架）

```html
<div id="wallpaper-host" style="position:fixed;inset:0;z-index:-1;"></div>
```

```typescript
import { createGS3Wallpaper } from './src/core';

const host = document.getElementById('wallpaper-host')!;
const engine = createGS3Wallpaper(host, {
  url: '/ply/scene.compressed.ply',
  speed: 1,
  onStatus: (s, msg) => {
    if (s === 'ready') document.body.classList.add('ply-wallpaper-active');
    if (s === 'failed') console.error(msg);
  },
});

// SPA 路由离开 / 组件 destroy：
await engine.dispose();
document.body.classList.remove('ply-wallpaper-active');
```

记得在 HTML 中引入 `src/styles/gs-wallpaper.css`，host 内层结构需带 `ply-layer gs-wallpaper` 类（或自行套用同等 CSS）。

### 12.2 Svelte 5

```svelte
<script>
  import SplatWallpaperLayer from './src/components/SplatWallpaperLayer.svelte';
  import './src/styles/gs-wallpaper.css';

  let plyUrl = '/ply/demo.compressed.ply';
  let status = 'idle';

  $effect(() => {
    document.body.classList.toggle('ply-wallpaper-active', status === 'ready');
    return () => document.body.classList.remove('ply-wallpaper-active');
  });
</script>

<div class="page">
  <SplatWallpaperLayer {plyUrl} poster="/poster.jpg" speed={1}
    onStatus={(s) => { status = s; }} />
  <!-- 前景 UI -->
</div>

<style>
  .page { position: relative; min-height: 100dvh; }
</style>
```

### 12.3 React / Vue

- 使用 `useRef` / `onMounted` 挂载 div，调用 `createGS3Wallpaper`
- `useEffect` cleanup / `onUnmounted` 中 `await dispose()`
- 或将 `SplatWallpaperLayer` 包一层 Svelte 自定义元素（本库未内置，需自行适配）

---

## 13. 构建、部署与体积

### 13.1 构建产物

`npm run build` 产出约 **700KB+** JS（gzip ~200KB），主要来自 `three` + `gaussian-splats-3d`。生产环境建议：

- 路由级 code-split，仅壁纸页 lazy load
- CDN 托管 `public/ply/*` 大文件，配置长缓存

### 13.2 静态托管

任意静态服务器托管 `dist/` + `public/ply/`：

- 确保 `.ply` / `.sog` 的 MIME 与 CORS 正确
- Cloudflare Pages / Netlify / GitHub Pages 均可

### 13.3 依赖隔离

项目根目录 `.npmrc` 含 `ignore-workspace=true`，避免被父 monorepo 的 pnpm workspace 吞掉安装。在本目录执行 `npm install` 或 `pnpm install`。

---

## 14. 诊断与脚本

### 14.1 Playwright 诊断

```bash
npm run dev
# 另开终端
BASE_URL=http://localhost:5175 node scripts/diagnose-gs3.mjs
```

> **注意：** `diagnose-gs3.mjs` 自 my-second-brain 复制，默认 `BASE_URL` 仍为 `4326`，且会写 `second-brain:widgets` localStorage。在独立 Demo 中应设置 `BASE_URL=http://localhost:5175`，或改造脚本为直接等待 `.ply-layer.is-ready`。

### 14.2 常见问题

| 现象 | 可能原因 |
|------|----------|
| 长时间 loading | compressed PLY 体积大，首次 parse 15–40s |
| 画面上下颠倒 | 去掉或调整 `ML_SHARP_ROTATION` |
| 移动端无 WebGL | 预期行为；提供 `poster` |
| WebGL context lost | 同页多个 Viewer；检查 disposeChain |
| 摄像头不生效 | 非 HTTPS / 用户拒绝 / 无 FaceDetector |

---

## 15. 性能与已知限制

| 项 | 说明 |
|----|------|
| 首屏 | 点云 parse + GPU 排序，与点数成正比 |
| 内存 | 百万级 Gaussian 占用数百 MB，低内存设备慎用 |
| Worker | `sharedMemoryForWorkers: false` 兼容性更好，略损 sort 性能 |
| SH  degree | 固定 0，不支持高阶 SH 资产的全部表达 |
| Safari | WebGL2 + 大 buffer 行为因版本而异，需实测 |
| 多 tab | 每 tab 独立 Viewer，内存叠加 |

---

## 16. 与 my-second-brain 的关系

本目录为 **只读复制**，不反向影响主项目。文件对照见 [ORIGIN.md](../ORIGIN.md)。

主项目中额外能力（**不在本库**）：

- `BackgroundLayer.svelte` — video / poster / ply 三模切换
- `WidgetHost` + 控制中心 UI
- `media-manifest.json` 多场景管理
- Legacy `am15` 渲染器

同步主项目更新时，按 ORIGIN 表 re-copy 并 diff。

---

## 17. API 参考

### `createGS3Wallpaper(host, opts)`

```typescript
function createGS3Wallpaper(
  host: HTMLElement,
  opts: {
    url: string;
    speed?: number;              // default 1
    signal?: AbortSignal;
    onStatus?: (status: 'loading' | 'ready' | 'failed', message?: string) => void;
  },
): { dispose: () => Promise<void> };
```

### `splatAssetUrl(url: string): string`

解析相对路径与 `import.meta.env.BASE_URL`。

### `createSpatialMotionController(opts)`

高级用法：自行驱动相机时可直接使用（一般通过 `createGS3Wallpaper` 内部调用）。

### `isMobileUa()` / `isMobileWallpaperDevice()`

宿主 App 决定是否跳过 WebGL。

---

*本文档随 `gs-ambient-wallpaper` 独立演进。快速上手见 [README.zh.md](../README.zh.md)。*
