# JS VI System：龙虾品牌视觉身份系统的创建

> 日期：2026-03-19
> 项目：js-vi-system
> 类型：架构设计 + 功能实现
> 来源：Cursor Agent 对话
> 位置：`d:\github\my\js-vi-system`

---

## 目录

1. [背景与动机](#1-背景与动机)
2. [分析过程](#2-分析过程)
3. [方案设计](#3-方案设计)
4. [实现要点](#4-实现要点)
5. [模板系统详解](#5-模板系统详解)
6. [品牌规范体系](#6-品牌规范体系)
7. [OpenClaw 集成](#7-openclaw-集成)
8. [验证与测试](#8-验证与测试)
9. [后续演化](#9-后续演化)

---

## 1. 背景与动机

龙虾（JS 品牌）在日常内容产出中需要大量配图——文章封面、社交媒体卡片、终端截图风格海报等。问题是：

- **风格不统一**：每次手动设计或用不同工具生成，配色、字体、边框等细节各不相同
- **效率低**：重复调整同类设计参数，没有可复用的设计资产
- **品牌弱化**：缺少系统化的视觉规范，受众难以形成品牌视觉记忆

核心目标：构建一套**风格统一的配图系统**，让龙虾的所有视觉产出都遵循同一套设计语言——Neo-Brutalism + Cyberpunk，从设计 Token 到成品海报全链路自动化。

---

## 2. 分析过程

### 2.1 风格定位

经过对品牌人格的梳理，确定了视觉身份的核心定位：

| 维度     | 定位                                          |
| -------- | --------------------------------------------- |
| 品牌人格 | Cyberpunk Growth Hacker                       |
| 哲学内核 | 东方哲学（道、顺势而为、无为而治）+ 科技      |
| 视觉风格 | Neo-Brutalism + Cyberpunk                     |
| 品牌色   | 黄 `#FCD228` + 黑 `#000000` + 白 `#FFFFFF`    |
| 字体     | Space Grotesk（正文）+ JetBrains Mono（代码） |

### 2.2 现有方案评估

| 方案                 | 优势               | 劣势                             |
| -------------------- | ------------------ | -------------------------------- |
| Figma 模板           | 视觉精确           | 手动操作、无法批量、开发者不友好 |
| Canva 等在线工具     | 易上手             | 风格受限、品牌一致性差           |
| CSS 框架（Tailwind） | 开发者友好         | 缺少品牌层抽象、无海报生成能力   |
| 自建系统             | 完全可控、可自动化 | 开发成本高                       |

结论：自建系统是唯一能同时满足「风格统一 + 批量自动化 + 开发者友好」三个要求的方案。

### 2.3 设计约束提炼

从 Neo-Brutalism 风格出发，明确了硬性约束：

- **禁止**：渐变、圆角（Logo 等少数例外）、柔和阴影、Pastel 配色、纯装饰性元素
- **要求**：硬边框（3px）、硬阴影（如 `4px 4px 0`）、高对比度、功能优先
- **对比哲学**：环境（UI）= 方正锐利 ↔ 角色（avatar）= 有机曲线流动

---

## 3. 方案设计

### 3.1 整体架构

系统分为五层，独立 CLI 和 OpenClaw 插件共享同一套核心逻辑：

```
┌──────────────────┐   ┌──────────────────────────────┐
│  CLI (Commander)  │   │   OpenClaw Plugin             │   消费层
│  js-vi poster ... │   │   4 AI 工具 + 3 CLI + HTTP    │
└────────┬─────────┘   └──────────────┬────────────────┘
         │                            │
         └────────────┬───────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│                Template Engine                         │   模板层
│       可插拔模板 (render.js + meta.json)               │
│       terminal / card / cybertaoist / ...              │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│              Renderer Factory                          │   渲染层
│       HTML → PNG/JPEG/PDF/SVG/GIF (Puppeteer)         │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│                Design Tokens                           │   基础层
│       JSON → CSS Variables + Tailwind Preset           │
│       colors / typography / shadows / borders / ...    │
└──────────────────────────────────────────────────────┘
```

### 3.2 关键决策

| 决策       | 选择                         | 理由                                             |
| ---------- | ---------------------------- | ------------------------------------------------ |
| Token 格式 | JSON 源 → 自动生成 CSS/TW    | 单一数据源，修改 Token 后 build 一次即可全局生效 |
| 语言       | 纯 JavaScript (ESM)          | 与 js- 品牌词系列项目一致，不引入 TypeScript     |
| 模板渲染   | 纯函数 HTML 片段             | 浏览器与 Node 共用，模板不依赖 Node API          |
| 截图引擎   | puppeteer-core               | 成熟稳定，支持 PNG/JPEG/PDF/SVG 多格式输出       |
| GIF 编码   | gifenc                       | 轻量无原生依赖，Puppeteer 逐帧截图 + gifenc 编码 |
| CLI 框架   | Commander.js                 | 社区标准，声明式命令定义                         |
| CSS 集成   | 独立 CSS + Tailwind 预设双轨 | 不强制 Tailwind，纯 CSS 引入也能用               |

---

## 4. 实现要点

### 4.1 项目结构

```
js-vi-system/
├── bin/js-vi.js                    # 独立 CLI 入口
├── build/generate.js               # Token → CSS/Tailwind 生成脚本
├── cli/
│   ├── index.js                    # Commander 主程序
│   ├── commands/
│   │   ├── poster.js               # 海报生成命令
│   │   ├── templates.js            # 模板列表命令
│   │   └── build.js                # 构建命令
│   └── utils/browser.js            # Puppeteer 封装
├── core/
│   ├── template-engine.js          # 模板加载与渲染
│   ├── config.js                   # 配置与校验
│   ├── renderer-factory.js         # 输出格式分发
│   └── html-wrapper.js             # HTML 文档包装
├── css/
│   ├── tokens.css                  # 设计 Token（自动生成）
│   ├── brutal.css                  # Neo-Brutalism 组件样式
│   └── tailwind-preset.js          # Tailwind 预设（自动生成）
├── tokens/                         # 设计 Token 源（JSON）
│   ├── colors.json / typography.json / shadows.json
│   ├── borders.json / spacing.json / animation.json
│   ├── grid.json
│   └── index.js
├── templates/                      # 海报模板
│   ├── _shared/                    # 共享资源（logo, utils, sizes, schemes）
│   ├── terminal/                   # 终端风格模板
│   ├── card/                       # 卡片模板
│   └── cybertaoist/                # Cyber-Taoist 模板
├── renderers/                      # 输出渲染器
│   ├── html.js / image.js / pdf.js / svg.js / gif.js
├── preview/
│   ├── index.html                  # 交互式品牌手册
│   └── posters.html                # 海报预览（自动生成）
├── brand/                          # 品牌文档
│   ├── identity.md / philosophy.md / principles.md
├── character/spec.md               # Cyber-Taoist 角色规格
├── voice/tone-and-style.md         # 语气与风格指南
├── assets/                         # 字体说明 + Logo 资产
└── openclaw-plugin/                # OpenClaw 插件
    ├── package.json                # ESM 模块声明
    ├── openclaw.plugin.json        # 插件清单 + configSchema + uiHints
    ├── index.mjs                   # 插件入口：4 AI 工具 + 3 CLI + HTTP 路由
    └── skills/
        └── poster-generator/
            └── SKILL.md            # 海报生成 Skill 文档
```

### 4.2 关键模块

| 模块                    | 职责                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| `tokens/*.json`         | 设计 Token 的唯一来源：颜色、字体、阴影、边框、间距、动画、网格       |
| `build/generate.js`     | 读取 Token JSON → 生成 `tokens.css`（CSS 变量）+ `tailwind-preset.js` |
| `core/template-engine`  | 扫描模板目录、加载 `render.js` + `meta.json`、执行渲染                |
| `core/renderer-factory` | 按输出格式（html/png/jpeg/pdf/svg/gif）分发到对应渲染器               |
| `renderers/image.js`    | Puppeteer 启动 → 加载 HTML → viewport 设置 → 截图                     |
| `renderers/gif.js`      | Puppeteer 逐帧截图 → gifenc 编码为动画 GIF                            |
| `css/brutal.css`        | 预置 Neo-Brutalism 组件样式：卡片、按钮、输入框、终端块、标签等       |

### 4.3 Token 驱动流程

```
tokens/*.json  ──build──▶  css/tokens.css          (CSS 变量)
                         ▶  css/tailwind-preset.js  (Tailwind 主题)
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              brutal.css      模板 HTML       用户项目
             (组件样式)     (海报生成)    (Tailwind 接入)
```

修改任何 Token JSON 后，执行 `npm run build` 一次即可全局生效。

---

## 5. 模板系统详解

### 5.1 模板结构

每个模板是一个目录，包含：

| 文件         | 必需 | 说明                                                   |
| ------------ | ---- | ------------------------------------------------------ |
| `render.js`  | 是   | 导出 `render(content, options)` 纯函数，返回 HTML 片段 |
| `meta.json`  | 是   | 模板元数据：名称、描述、支持的尺寸/配色                |
| `styles.css` | 否   | 模板专属样式                                           |

### 5.2 内置模板

| 模板          | 风格                | 适用场景               |
| ------------- | ------------------- | ---------------------- |
| `terminal`    | 终端/命令行         | 技术文章封面、代码分享 |
| `card`        | 信息卡片            | 社交媒体配图、知识卡片 |
| `cybertaoist` | Cyber-Taoist 角色风 | 品牌宣传、个人 IP 展示 |

### 5.3 配色方案与尺寸

| 配色       | 说明                 |
| ---------- | -------------------- |
| `daylight` | 黄底黑字，品牌主色调 |
| `dark`     | 黑底黄字，暗色场景   |
| `minimal`  | 白底黑字，极简风格   |

| 尺寸     | 比例      | 适用场景                 |
| -------- | --------- | ------------------------ |
| `A4`     | 210×297mm | 打印、PDF 文档           |
| `square` | 1:1       | Instagram、微信朋友圈    |
| `banner` | 16:9      | 文章封面、YouTube 缩略图 |
| `story`  | 9:16      | Instagram Story、抖音    |

### 5.4 CLI 用法

```bash
# 生成单张海报
js-vi poster -t terminal -f png -o output.png

# 指定配色和尺寸
js-vi poster -t card --scheme dark --size square -f png

# 批量生成
js-vi poster --config batch-config.json

# 查看可用模板
js-vi templates

# 重新构建 Token
js-vi build
```

---

## 6. 品牌规范体系

系统不仅是工具，还沉淀了完整的品牌文档：

| 文档                      | 内容                                                   |
| ------------------------- | ------------------------------------------------------ |
| `brand/identity.md`       | 品牌身份定义：Cyberpunk Growth Hacker 定位、核心价值观 |
| `brand/philosophy.md`     | 品牌哲学：东方道家 + 科技增长黑客的融合                |
| `brand/principles.md`     | 设计原则：功能优先、高对比、硬边界、拒绝装饰           |
| `character/spec.md`       | Cyber-Taoist 角色规格：外观、配色、情绪状态、尺寸标注  |
| `voice/tone-and-style.md` | 文字语气风格：直接、技术、略带戏谑、中英混用           |

### 视觉对比哲学

系统中有一个有趣的硬/软对比设计：

| 元素          | 风格          | 表现                     |
| ------------- | ------------- | ------------------------ |
| 环境 (UI)     | Neo-Brutalist | 方正、锐利、直角、粗线条 |
| 角色 (avatar) | 有机曲线      | 流动、圆润、柔和         |
| 头发          | 尖锐          | 竖立、棱角分明           |
| 能量核心      | 脉动          | 发光、呼吸动画           |

这种对比体现了「Cyber-Taoist」的核心：刚柔并济，科技与自然的融合。

---

## 7. OpenClaw 集成

项目已实现完整的 OpenClaw 插件，通过 `openclaw-plugin/` 目录提供三类能力：AI 工具、CLI 子命令、HTTP 路由。插件层是纯适配器，所有逻辑由 `core/` 层承载。

### 7.1 插件架构

```
openclaw-plugin/index.mjs (register 入口)
    │
    ├── api.registerTool()     → 4 个 AI 工具
    ├── api.registerCli()      → 3 个 CLI 子命令
    └── api.registerHttpRoute() → 品牌手册 + 静态资源
    │
    └── 共享核心 ← ../core/  ../tokens/  ../brand/  ../voice/
```

插件零 OpenClaw 依赖——通过 `plugins.load.paths` 指向 `openclaw-plugin/` 目录加载，运行时由 OpenClaw 注入 `api` 对象。

### 7.2 AI 工具（4 个）

| 工具                 | 功能                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `vi_templates_list`  | 列出所有海报模板，返回名称、标签、支持的尺寸/配色、字段定义、动画信息 |
| `vi_poster_generate` | 生成海报，支持 template/format/scheme/size/title 等参数               |
| `vi_tokens_get`      | 查询设计 Token，按类别（colors/typography/shadows 等）或全量返回      |
| `vi_brand_info`      | 获取品牌文档（identity/philosophy/principles/tone）                   |

Agent 调用场景示例：

- 用户说「帮我做一张技术分享的海报」→ Agent 调用 `vi_poster_generate` template=terminal
- 用户问「品牌主色是什么」→ Agent 调用 `vi_tokens_get` category=colors
- 用户说「我想了解品牌设计原则」→ Agent 调用 `vi_brand_info` topic=principles

### 7.3 CLI 子命令（3 个）

通过 `openclaw vi` 命名空间注册：

```bash
# 列出可用模板
openclaw vi templates

# 生成海报（支持全部参数 + 批量配置）
openclaw vi poster -t terminal --scheme dark --size banner -f png -o cover.png
openclaw vi poster --config batch.json

# 从 Token 重新构建 CSS/Tailwind
openclaw vi build
```

CLI 子命令与独立 CLI（`js-vi`）功能一致，区别在于配置来源——插件模式从 `api.pluginConfig` 读取默认值。

### 7.4 HTTP 路由

| 路径                        | 内容                                              |
| --------------------------- | ------------------------------------------------- |
| `/plugins/js-vi/`           | 品牌手册首页（`preview/index.html`，含 Three.js） |
| `/plugins/js-vi/posters`    | 海报画廊（`preview/posters.html`，实时预览）      |
| `/plugins/js-vi/{filePath}` | 静态资源（preview/assets/css 目录下的文件）       |

通过 Gateway Web UI 访问，路由设置了 `auth: "plugin"` 鉴权。静态文件服务做了路径安全校验，仅允许 `preview`、`assets`、`css` 三个目录。

### 7.5 插件配置

通过 `openclaw.plugin.json` 声明的 `configSchema`，在 `~/.openclaw/openclaw.json` 中配置：

```json
{
  "plugins": {
    "load": { "paths": ["/path/to/js-vi-system/openclaw-plugin"] },
    "entries": {
      "js-vi-system": {
        "config": {
          "browserPath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "defaultScheme": "dark",
          "defaultSize": "a4",
          "outputDir": "",
          "extraTemplatesDirs": ""
        }
      }
    }
  }
}
```

| 配置项               | 说明                                                 |
| -------------------- | ---------------------------------------------------- |
| `browserPath`        | Chrome/Edge 路径，PNG/PDF/GIF 渲染需要，留空自动检测 |
| `defaultScheme`      | 默认配色（daylight/dark/minimal），默认 `dark`       |
| `defaultSize`        | 默认尺寸（a4/square/banner/story），默认 `a4`        |
| `outputDir`          | 输出目录，留空则使用项目根 `poster/`                 |
| `extraTemplatesDirs` | 额外模板目录，多路径用逗号分隔                       |

### 7.6 Skill：poster-generator

`openclaw-plugin/skills/poster-generator/SKILL.md` 定义了海报生成技能，包含：

- 触发条件：用户需要生成海报/查询品牌规范/查看模板时触发
- 模板、配色、尺寸、格式的完整参考表
- 推荐策略：快速预览 → html，社交分享 → png，动画 → gif，打印 → pdf
- 典型交互流程（单张生成、品牌规范查询）

---

## 8. 验证与测试

| 验证项                | 状态 | 说明                                                           |
| --------------------- | ---- | -------------------------------------------------------------- |
| Token 生成            | 通过 | `npm run build` → `tokens.css` + `tailwind-preset.js` 正常生成 |
| 独立 CLI 命令         | 通过 | `js-vi poster/templates/build` 命令正常运行                    |
| 多格式输出            | 通过 | HTML/PNG/JPEG/PDF/SVG/GIF 均能生成                             |
| 品牌手册预览          | 通过 | `preview/index.html` 含 Three.js 交互展示                      |
| 海报预览              | 通过 | `preview/posters.html` 实时编辑预览                            |
| Tailwind 预设集成     | 通过 | `presets: [jsViSystem]` 接入后主题生效                         |
| 外部模板目录          | 通过 | `--templates-dir` 加载外部模板正常                             |
| OpenClaw 插件加载     | 通过 | `register(api)` 入口正常，4 工具 + 3 CLI + HTTP 路由注册成功   |
| OpenClaw AI 工具      | 通过 | `vi_poster_generate` / `vi_templates_list` 等工具正常调用      |
| OpenClaw CLI 子命令   | 通过 | `openclaw vi templates` / `poster` / `build` 正常执行          |
| OpenClaw HTTP 路由    | 通过 | `/plugins/js-vi/` 品牌手册和静态资源正常服务                   |
| 插件配置 configSchema | 通过 | `browserPath` / `defaultScheme` 等配置项正常读取               |

---

## 9. 后续演化

### 近期可改进

1. **更多内置模板**：quote（金句卡片）、changelog（更新日志海报）、data（数据可视化卡片）
2. **动态内容注入**：从 Markdown/JSON 文件批量读取内容生成系列海报
3. **Watch 模式**：Token 或模板变更后自动重新生成预览
4. **npm 发布**：作为 `@imjszhang/js-vi-system` 发布，其他项目可 `presets: [require('js-vi-system')]` 接入
5. **Cron 自动生成**：配合 OpenClaw cron 定时生成系列配图（如每日金句海报）

### 长期方向

1. **与 js-knowledge-prism 集成**：知识输出时自动调用 VI 系统生成配图
2. **A2UI 风格扩展**：将 VI Token 注入 OpenClaw 的 Canvas Host，实现聊天内品牌化渲染
3. **角色动画系统**：基于 `character/spec.md` 生成 Cyber-Taoist 角色的多状态动画资产

### 已完成（原计划为长期方向）

- ~~与 OpenClaw 集成~~：已实现完整插件（4 AI 工具 + 3 CLI 子命令 + HTTP 路由 + Skill），详见[第 7 节](#7-openclaw-集成)

---

## 总结

js-vi-system 解决了龙虾品牌「配图风格不统一」的核心问题。通过 **Token 驱动 + 可插拔模板 + 多格式渲染** 的架构，它将品牌视觉规范从文档层面落地到了工具链层面——修改一个 Token 值，从 CSS 变量到海报输出全链路自动更新。

通过 OpenClaw 插件集成，系统进一步从「独立工具」升级为「Agent 可调用的品牌服务」：Agent 可以通过 `vi_poster_generate` 直接生成配图，通过 `vi_brand_info` 查询品牌规范确保内容风格一致，通过 Gateway HTTP 路由让品牌手册可在 Web UI 中直接访问。独立 CLI 和 OpenClaw 插件共享同一套 `core/` 层逻辑，两种入口平行可用、互不绑定。

系统由 JS_BESTAGENT 在 Cursor Agent 对话中完整实现，版本 1.1.0，MIT 协议开源。
