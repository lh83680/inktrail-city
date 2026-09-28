# 一笔画城 · 用脚步写一座城

> 百度地图开发者创作大赛参赛作品 —— 把手写的汉字，编译成沿城市真实道路的步行 / 骑行路线。

**写图是涂鸦，写字是编译。** 一笔画城把“画一个形状”推进为“写一个汉字”：在可读性约束下，将手写或字库调用的汉字笔画，编译为沿百度地图真实路网执行的路线，实时度量保真度，并可导航、可探索、可分享。

线上 Demo：https://inktrail-city-ntvxzygae05.qoder.website

## 它解决什么问题

既有 GPS 轨迹艺术工具（RouteDraw / WalkDraw / Strava Art 等）解决的是“把图案画进轨迹”：随便画、没法认、无法预期。一笔画城把问题重新定义为**带可读性约束的路线编译问题**：

- 字必须可认 → 需要字形锚点化、笔画保序、失真度量与兜底策略
- 路必须可走 → 需要贴路吸附、分段算路、并发调度与失败降级
- 结果必须可用 → 需要距离 / 时长估算、POI 故事、导航闭环、分享海报

## 系统架构

```
┌──────────────────────────────────────────────────────────┐
│ L1 表达层：墨韵手写 canvas（PointerEvent 压感/速度）        │
│            字形字库（LXGW WenKai 子集 → opentype.js        │
│            轮廓提取 → 任意汉字保序锚点化，零 AI 依赖）       │
│ L2 编译层：DP 简化 → 曲率自适应重采样 → 保序贴路            │
│            （逆地理编码）→ 分段算路（并发池+模式降级）       │
│            → 节段融合 → Hausdorff 保真度度量               │
│ L3 行走层：路线总览 / 步行骑行双模式 / 百度地图导航深链      │
│            / 沿线 POI 故事（复用贴路数据，零额外请求）        │
│ L4 传播层：首屏电影模式 / 金线视觉 / 分享海报（QR 增长闭环） │
└──────────────────────────────────────────────────────────┘
编译内核为纯函数 + 可注入 MapAdapter：测试零网络，覆盖率 ≥90%
```

## 核心技术点

| 模块 | 问题 | 方案 |
|---|---|---|
| `glyph/` | 任意汉字 → 锚点 | pyftsubset 裁剪 GB2312 一级字 3755 字（OFL 字体）→ opentype.js 取轮廓 → 贝塞尔 8 等分采样 → 按 path 顺序保笔画 |
| `compile/simplify` | 笔画点冗余 | Douglas-Peucker（容差按路网密度 15/25/40m 自适应） |
| `compile/resample` | 锚点密度 | 曲率自适应等距重采样（50-200m），急折点强制保留，每笔封顶 8 点 |
| `compile/snap` | 锚点在路上 | 逆地理编码吸附（并发 4），顺序保护，>40m 回退 |
| `compile/routeEngine` | 请求风暴 | 并发池 5 + 指数退避 + walk→ride→drive 模式降级 + 节段融合去重（<30m 合并） |
| `compile/hausdorff` | 字不像字 | 双向 Hausdorff + 60m 缓冲占比 = 保真度（<0.78 引导重描或切官方字形） |
| `map/mapStage` | 视觉语言 | BMapGL 个性化地图（宣纸墨色 styleJson）+ 金线双 polyline（光晕+实线）+ 段序点亮 |
| `map/baiduAdapter` | GL 版 API 差异 | JSAPI GL：`api?v=1.0&type=webgl` 加载、`onSearchComplete` 事件、`getPlan(0).getRoute(0).getPath()` 结果链、renderOptions.map 置空抑制自带覆盖物 |

## 百度地图 API/SDK 使用清单

JSAPI GL 地图渲染 · 个性化地图 setMapStyleV2 · 步行路线规划 · 骑行路线规划 · 驾车路线规划 · 逆地理编码 · POI 检索（故事卡数据源）· 输入提示 · 行政区域边界 · 全景图 · 静态图 · URI API 导航深链

## 本地开发

```bash
npm install
echo "VITE_BAIDU_AK=your_ak" > .env.local
npm run dev        # http://localhost:5173
npm run test:unit  # 63 项单测（编译内核 TDD）
npm run test:e2e   # Playwright 端到端
npm run build      # dist/
```

本机 IPv4 到 api.map.baidu.com 异常时，E2E 用 `--host-resolver-rules` 强制 IPv6（见 playwright.config.ts）。

## 目录

```
src/lib/compile/   编译内核（纯函数 + 适配器注入，TDD）
src/lib/glyph/     字形字库（字体子集 + 轮廓锚点化）
src/lib/ink/       墨韵手写（采集 + 渲染）
src/lib/share/     海报 / 分享链接 / GPX / 导航深链
src/map/           BMapGL 适配器 + 地图舞台
src/ui/            电影模式 / 面板 / 故事卡
src/data/          预编译演示快照（断网兜底）
```

## 字体授权

LXGW WenKai（SIL OFL 1.1），仅使用其子集渲染字形锚点；随附 `public/assets/fonts/OFL-LICENSE.txt`。
