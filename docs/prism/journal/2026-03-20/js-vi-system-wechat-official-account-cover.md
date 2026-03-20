# JS VI System：微信公众号封面图能力

> 日期：2026-03-20  
> 项目：js-vi-system  
> 类型：功能迭代 + 使用场景落地  
> 来源：Cursor Agent 对话 / 仓库提交记录  
> 位置：`d:\github\my\js-vi-system`  
> 目的：**用同一套品牌视觉系统，直接产出符合微信公众号规范的封面与略缩图**

---

## 1. 背景与动机

公众号发文需要两类常见素材：

| 素材         | 典型规格                 | 说明                         |
| ------------ | ------------------------ | ---------------------------- |
| **头条封面** | 约 **900×383**（2.35:1） | 信息流与文章顶部的横版封面   |
| **略缩图**   | **500×500**（1:1）       | 转发卡片、部分列表场景的方图 |

此前 js-vi-system 已有通用海报尺寸（`a4`、`square`、`banner`、`story`），但**没有按微信侧常用像素约束命名的专用模板**，运营或 Agent 需要自行换算比例，品牌一致性也容易打折。

**本次更新的目标**：在视觉系统内提供**微信专用模板 + 专用尺寸枚举**，使 OpenClaw Agent（`vi_poster_generate`）或独立 CLI（`js-vi poster`）可以**一句话生成「可上传微信后台」的封面图**，仍沿用 Neo-Brutalism + Cyberpunk 品牌 Token 与配色方案（`daylight` / `dark` / `minimal`）。

---

## 2. 近期变更摘要（与微信封面直接相关）

### 2.1 新模板：`wechat-cover`

- 目录：`templates/wechat-cover/`（`render.js`、`meta.json`、`styles.css`）
- 元数据：`meta.json` 中声明尺寸 `wechat-cover`、`wechat-thumb`，字段含 `title`、`subtitle`、`tag`、`issue` 等，便于文章标题、栏目、期数等结构化填入
- 动画：`animation.supported: false`，以静态版式为主，适合直接导出 PNG/JPEG 上传后台（若需动效可再扩展）

### 2.2 新尺寸键（全局 `SIZES`）

在 `templates/_shared/sizes.js` 中增加：

| 键名           | 像素          | 用途                 |
| -------------- | ------------- | -------------------- |
| `wechat-cover` | **900 × 383** | 微信公众号头条封面   |
| `wechat-thumb` | **500 × 500** | 微信公众号方形略缩图 |

生成时通过 `--size wechat-cover` 或 `--size wechat-thumb`（OpenClaw：`openclaw vi poster` 同等参数）切换。

### 2.3 HTML 包装与扩展模板目录（工程向）

- `renderToHTML` 将模板目录 `meta._dir` 作为 **`templateDir`** 传入 `wrapHTML`，从**该模板目录**读取 `styles.css` 并内联进最终 HTML。
- **意义**：使用 `extraTemplatesDirs` 或外部模板目录时，样式也能正确打进 HTML，避免「只有内建模板有样式」的隐性 bug；对后续自定义「微信专用变体模板」同样适用。

### 2.4 npm 子路径导出

- `package.json` 增加 `exports["./templates/_shared/*"]`，便于依赖方按包路径引用共享静态资源（与海报管线、文档一致）。

### 2.5 文档与版本

- 根目录 `README.md` / `README.zh-CN.md`、`SKILL.md`、`CHANGELOG.md` 已同步模板与尺寸说明；包版本迭代见 `CHANGELOG.md`（与 `package.json` 的 `version` 对齐记录）。

---

## 3. 推荐使用方式

### 3.1 独立 CLI（仓库内）

```bash
npm install
node bin/js-vi.js templates
node bin/js-vi.js poster -t wechat-cover --size wechat-cover --scheme dark -f png -o wechat-cover.png
node bin/js-vi.js poster -t wechat-cover --size wechat-thumb --scheme dark -f png -o wechat-thumb.png
```

### 3.2 OpenClaw 插件模式

- 工具：`vi_poster_generate`，指定 `template: wechat-cover`，`size: wechat-cover` 或 `wechat-thumb`，`format` 按需 `png` / `jpeg` / `html` 等。
- 子命令：`openclaw vi poster -t wechat-cover --size wechat-cover ...`（与独立 CLI 参数对齐）。

### 3.3 与 Prism / 内容工作流的关系

- 知识或文章在 **Prism** 侧定稿后，可由 Agent **同一套品牌规范**生成封面，减少「文章在 Prism、配图在别处」的割裂。
- 后续若在 cron 或发布流水线中插入一步「生成封面」，可直接调用上述模板与尺寸，无需再手动开设计工具。

---

## 4. 依赖与注意点

- **PNG/JPEG/PDF**：需本机 **Chrome 或 Edge**（`puppeteer-core`）；插件可在 `openclaw.json` 中配置 `browserPath`。
- **HTML**：无浏览器依赖，适合快速校对版式；上传微信前通常再导出位图。
- 微信后台对图片体积、格式可能有额外要求，导出后若超限可在微信编辑器内替换或压缩（视觉系统负责**像素与版式**一致，压缩策略可按运营规范叠加）。

---

## 5. 小结

通过 **`wechat-cover` 模板 + `wechat-cover` / `wechat-thumb` 尺寸 + 模板目录级 CSS 内联**，js-vi-system 把「微信公众号封面 / 略缩图」纳入**同一品牌视觉管线**。OpenClaw 侧继续用 `vi_poster_generate` 即可在对话中完成配图，与 2026-03-19 journal《JS VI System：龙虾品牌视觉身份系统的创建》中描述的架构一致，属于在同一 `core/` 与模板体系上的**场景化延伸**。

相关长篇设计说明仍见：[`2026-03-19/js-vi-system-project-creation.md`](../2026-03-19/js-vi-system-project-creation.md)。
