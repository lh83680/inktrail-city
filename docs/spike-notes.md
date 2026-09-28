# Spike 记录（M0）— 2026-09-27/28 实战更新

## 环境

- Node v24.19.0 / npm / Python 3.11.9（fontTools+brotli 已装）/ Git Bash / Playwright（chromium 已装）
- git 身份：刘辉 <lh83680@163.com>（每命令 `-c` 注入，未改全局配置）；GitHub 账号已在用户 Chrome 登录
- **控制台操作通道（重要）**：本机无 chrome-devtools MCP，用 `tools/cdp-eval.mjs` / `tools/cdp-click.mjs`（Node 24 内置 WebSocket 直连 CDP）驱动用户 Edge。启动方式：`powershell Start-Process msedge --ArgumentList '--remote-debugging-port=9222','--user-data-dir=C:\Users\lh836\edge-debug-inktrail',<url>`。用户 Edge 主实例运行中时新实例白名单参数会被忽略，专用 profile 是正解。**该窗口仍开着，用后可关。**

## Task 2 字体子集（通过）

- LXGW WenKai v1.522 Regular.ttf（OFL，25.5MB）→ GB2312 一级字 3755 + 演示字 + 符号 = 3777 字符
- 子集 TTF 产物：`public/assets/fonts/ink-glyphs.ttf`，**1.74MB**（发布目录，运行期 fetch；opentype.js **不支持 woff2 解析**，勿再产 woff2）
- 字符集来源：`tools/gen-charset.py` 程序化生成 GB2312 一级字区（16-55区）
- `loadGlyphFont` node 侧用动态 `import('node:fs')`（顶层 import 会炸浏览器端）

## Task 3 AK / JSAPI GL（通过，真相与初判完全相反）

- **AK 一直有效**：旧 AK `Vsxg850RGTgjyaD6jZaVijBis2uq6nGr` verify 端点 `{"error":0}`；控制台确认：应用类型=浏览器端、JSAPI 服务全开、Referer=`*`。新备用 AK `FBjOk1UE3osaVDmuNn1cuf78-`（一笔画城-参赛，09-27 创建，后端尚未同步，暂不可用）
- **真正的坑 1：加载 URL**。官方正确：`https://api.map.baidu.com/api?v=1.0&type=webgl&ak=KEY&callback=cb`。`type=gl` 是错误参数（加载 2013 经典库，BMap 命名空间，无 GL 类）
- **真正的坑 2：GL 路线事件名**。GL 版路线规划回调是 `onSearchComplete`（不是经典版的 `onResultsUpdated`）；结果读取 `results.getPlan(0).getRoute(0).getPath()`；需传 `renderOptions:{map, autoViewport:false}`；`getStatus()!==0` 为失败
- **真正的坑 3：误诊 code=5000**。`blank.gif?...&code=5000` 是 GL 库 `_addStat(STAT_JS_EXECUTE=5000)` 统计像素，**不是错误码**；error.html 是被 ORB 拦截的预载资源。曾据此误判 AK 配置，绕行 3 小时
- **本机网络**：api.map.baidu.com 的 IPv4（180.76.11.x）全部 SSL error 35；IPv6 可达。E2E 用 `--host-resolver-rules=MAP api.map.baidu.com [<v6>]` 强制（playwright.config.ts 动态解析）；用户 Edge 主实例走 IPv4 会挂起，无头 Chromium 强制 IPv6 后一切正常

## Task 4 Sites Functions Spike（通过）

- 结论：`/api/semantic` function 可部署、可出网、Secrets 可用（详见 plan Task 4）。语义层保持 P3，核心不依赖

## 联调实测数据（2026-09-28 凌晨）

- 电影模式（福@北京，真实 GL）：**保真度 93%，20.16km，步行 280 分钟**，快照兜底正常
- 用户编译（福@北京）：**保真度 99%，11.32km，步行 157 分钟**，无 fallback 无报错
- 调参结论：每笔锚点封顶 8（6 会跌破保真度 0.78 红线：0.73）；DP 容差 dense=25m、字库 anchorGap=100m；并发池 5、冷却 80ms；单作 ~70 段、编译 ~12s；电影点亮 20 批共 6s
- 单条步行路线请求实测 237ms / 713 点（天安门→王府井风格）

## 踩坑流水账（按时间）

1. vitest globals 要显式开（v5 默认无）
2. 测试文件相对路径深度连环错（tests/lib/compile 是三级、tests/map 是两级）
3. GL 库的 mask 浮层 z-index 会盖住 React 覆盖层 → .film 需 z-index:1200
4. 百度地图 DOM 插进 React 容器会挤掉 React 子节点 → FilmMode 必须是地图容器的**兄弟**节点
5. `type=module` 页面里 GL 库对 api.map.baidu.com 的 fetch 瞬时失败= CORS，非网络故障
6. 2 点笔画渲染 mids[1] 越界（drawTaperedStroke）
