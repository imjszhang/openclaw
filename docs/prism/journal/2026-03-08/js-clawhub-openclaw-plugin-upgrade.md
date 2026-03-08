# JS ClawHub 升级为 OpenClaw 插件

> 文档日期：2026-03-08
>
> 项目：[js-clawhub](https://github.com/imjszhang/js-clawhub)
>
> 覆盖范围：将现有静态导航站升级为 OpenClaw 插件，注册 Agent Tools、CLI 子命令、HTTP 路由和 Skills，同时保留独立运行能力

---

## 目录

1. [项目背景](#1-项目背景)
2. [升级动机](#2-升级动机)
3. [设计原则](#3-设计原则)
4. [插件结构](#4-插件结构)
5. [注册内容详解](#5-注册内容详解)
6. [部署配置集成](#6-部署配置集成)
7. [关键技术决策](#7-关键技术决策)
8. [接入配置](#8-接入配置)
9. [两种运行模式对比](#9-两种运行模式对比)
10. [相关文档](#10-相关文档)

---

## 1. 项目背景

**JS ClawHub** 是 OpenClaw 生态的策展式导航站（v1.0.0 发布于 2026-02-12），提供项目目录、技能市场、博客、入门指南、社区 Pulse 五大内容模块，以及中英双语支持。

项目原本以两种形式运行：

1. **静态站点**：通过 `npm run build` 将 `src/` 编译为 `docs/`，部署到 GitHub Pages + Cloudflare
2. **CLI 工具**：通过 `node cli/cli.js <command>` 进行数据查询、构建、部署

截至本次升级前，项目已有 379 次提交，两个发布版本（v1.0.0、v1.1.0），包含 200 条 Pulse 动态、29 个项目、6 个技能、23 篇博客、14 篇指南。

---

## 2. 升级动机

ClawHub 拥有丰富的结构化数据（项目、技能、博客、指南、Pulse），但这些数据只能通过网页浏览或 CLI JSON 输出获取。升级为 OpenClaw 插件后：

- **Agent 可直接调用**：AI 助手可以通过 Tools 搜索项目、查阅指南、获取社区动态
- **统一配置管理**：Cloudflare Token、GitHub Token 等部署密钥可在 OpenClaw UI 中配置，不再需要手动编辑 `.env`
- **HTTP 路由集成**：站点通过 Gateway 同端口提供服务，无需单独 `npx serve`
- **Skills 能力**：定义 `clawhub-navigator` 技能，让 Agent 在用户询问 OpenClaw 相关问题时自动利用 ClawHub 数据

参照项目：**js-knowledge-collector**——另一个已完成的 OpenClaw 插件（2026-03-06 完成）。以它为模板，沿用相同的目录结构和注册模式。

---

## 3. 设计原则

### 加一层壳，不改内核

插件入口 `openclaw-plugin/index.mjs` 通过 `import ../cli/lib/*` 直接复用现有模块。现有模块中 `__dirname` 的路径解析无需修改——因为 `index.mjs` 位于项目根目录的子目录中，`../cli/lib/` 的相对路径关系与 `cli/cli.js` 中 `./lib/` 完全等价。

唯一对现有代码的改动是在 `cli/lib/data-reader.js` 中新增了两个导出函数（`readBlogPost` 和 `readGuideArticle`），用于读取 Markdown 正文。这是纯新增函数，不影响任何现有逻辑。

### 配置透传

现有业务代码通过 `process.env` 读取配置（LLM API、Cloudflare Token 等）。插件入口的 `applyEnv(pluginCfg)` 函数将 OpenClaw 的 `pluginConfig` 值注入 `process.env`，让业务代码零改动即可在两种模式下运行。

---

## 4. 插件结构

```
js-clawhub/
├── openclaw-plugin/                    # 新增：OpenClaw 插件
│   ├── index.mjs                       # 插件入口（register 函数）
│   ├── openclaw.plugin.json            # 插件清单（configSchema + uiHints）
│   ├── package.json                    # ESM 入口 + openclaw.extensions
│   └── skills/
│       └── clawhub-navigator/          # 导航助手技能
│           └── SKILL.md
├── cli/                                # 现有：CLI 工具（独立运行）
│   ├── cli.js                          # 入口（clawhub <command>）
│   └── lib/                            # 功能模块（被插件复用）
│       ├── data-reader.js              # 数据查询（新增 readBlogPost/readGuideArticle）
│       ├── search.js                   # 全源搜索
│       ├── featured.js                 # 精选管理
│       ├── builder.js                  # 构建逻辑
│       ├── puller.js                   # Moltbook 数据拉取
│       ├── setup.js                    # Cloudflare / GitHub Pages 配置
│       └── git.js                      # Git 操作
└── src/                                # 现有：静态站点源码
```

---

## 5. 注册内容详解

### 5.1 Agent Tools（8 个）

| Tool               | 复用模块                                                | 功能                                             |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------ |
| `clawhub_search`   | `search.js` → `search()`                                | 跨 pulse/project/skill/blog/guide 全文搜索       |
| `clawhub_projects` | `data-reader.js` → `readProjects()`                     | 项目列表，支持 category/tag 筛选                 |
| `clawhub_skills`   | `data-reader.js` → `readSkills()`                       | 技能列表，支持 category 筛选                     |
| `clawhub_blog`     | `data-reader.js` → `readBlog()` / `readBlogPost()`      | 博客列表或获取某篇正文                           |
| `clawhub_guide`    | `data-reader.js` → `readGuide()` / `readGuideArticle()` | 指南列表或获取某篇正文                           |
| `clawhub_pulse`    | `data-reader.js` → `readPulse()`                        | Pulse 动态，支持 days/minScore/author/limit 筛选 |
| `clawhub_stats`    | `data-reader.js` → `getStats()`                         | 站点汇总统计                                     |
| `clawhub_featured` | `featured.js` → `listFeatured()`                        | 首页精选内容                                     |

所有 Tool 的 `execute` 函数使用 `async` + `await import()` 懒加载模块，避免插件启动时加载全部业务代码。

### 5.2 CLI 子命令

注册到 `openclaw hub` 命名空间，共 11 个子命令：

| 子命令                            | 对应 CLI                     | 用途                |
| --------------------------------- | ---------------------------- | ------------------- |
| `openclaw hub search <keyword>`   | `clawhub search`             | 搜索                |
| `openclaw hub stats`              | `clawhub stats`              | 统计                |
| `openclaw hub projects`           | `clawhub projects`           | 项目列表            |
| `openclaw hub skills`             | `clawhub skills`             | 技能列表            |
| `openclaw hub blog`               | `clawhub blog`               | 博客列表            |
| `openclaw hub pulse`              | `clawhub pulse`              | Pulse 列表          |
| `openclaw hub build`              | `clawhub build`              | 构建站点            |
| `openclaw hub pull`               | `clawhub pull`               | 拉取 Moltbook 数据  |
| `openclaw hub sync`               | `clawhub sync`               | 构建 + 提交 + 推送  |
| `openclaw hub setup-cloudflare`   | `clawhub setup-cloudflare`   | 配置 Cloudflare DNS |
| `openclaw hub setup-github-pages` | `clawhub setup-github-pages` | 配置 GitHub Pages   |

### 5.3 HTTP 路由（10 条）

路由前缀 `/plugins/js-clawhub`：

| 路由                                               | 功能                                |
| -------------------------------------------------- | ----------------------------------- |
| `GET /plugins/js-clawhub`                          | 301 重定向到 `/plugins/js-clawhub/` |
| `GET /plugins/js-clawhub/`                         | 首页 `src/index.html`               |
| `GET /plugins/js-clawhub/api/v1/projects.json`     | 动态返回项目数据                    |
| `GET /plugins/js-clawhub/api/v1/stats.json`        | 动态返回统计                        |
| `GET /plugins/js-clawhub/api/v1/featured.json`     | 动态返回精选内容                    |
| `GET /plugins/js-clawhub/api/v1/skills.json`       | 动态返回技能列表                    |
| `GET /plugins/js-clawhub/api/v1/blog/index.json`   | 动态返回博客列表                    |
| `GET /plugins/js-clawhub/api/v1/guide/index.json`  | 动态返回指南列表                    |
| `GET /plugins/js-clawhub/api/v1/pulse/latest.json` | 动态返回 Pulse（支持 limit 参数）   |
| `GET /plugins/js-clawhub/{filePath}`               | 静态文件（CSS/JS/图片等）           |

与 knowledge-collector 插件的关键区别：ClawHub 的数据层是**纯 JSON 文件**（无数据库），API 通过直接调用 `data-reader.js` 的函数实时读取 `src/` 下的 JSON，无需像 knowledge-collector 那样管理数据库连接。

### 5.4 clawhub-navigator Skill

定义在 `openclaw-plugin/skills/clawhub-navigator/SKILL.md`，包含：

- **触发条件**：用户询问 OpenClaw 生态、寻找项目/技能/教程/动态时自动触发
- **可用工具**：8 个 Tool 的使用场景说明
- **行为规范**：先搜索再回答、引用出处、双语支持、简洁优先、组合使用、推荐引导

---

## 6. 部署配置集成

升级前，Cloudflare DNS 和 GitHub Pages 的配置需要手动编辑 `.env` 文件填入 Token，然后运行独立脚本。升级后，这些密钥可以在 OpenClaw 的插件设置 UI 中配置：

| 插件配置字段         | 对应环境变量           | 用途                           |
| -------------------- | ---------------------- | ------------------------------ |
| `cloudflareApiToken` | `CLOUDFLARE_API_TOKEN` | Cloudflare DNS 操作            |
| `cloudflareEmail`    | `CLOUDFLARE_EMAIL`     | 可选，配合 Global API Key      |
| `githubToken`        | `GITHUB_TOKEN`         | GitHub Pages 域名 + HTTPS 配置 |
| `gaId`               | `GA_ID`                | Google Analytics 注入          |

`applyEnv()` 函数在插件加载时将这些配置注入 `process.env`。`setup.js` 的 `loadEnv()` 函数优先读取 `process.env`，因此**无需改动任何现有业务代码**。

配置后，直接运行：

```bash
openclaw hub setup-cloudflare
openclaw hub setup-github-pages
```

---

## 7. 关键技术决策

### 决策 1：ESM 动态 import 而非 require

与 knowledge-collector 一致，所有 Tool 和 CLI 的模块加载使用 `await import()` 而非 `require()`。原因：

1. 项目 `package.json` 声明 `"type": "module"`，所有 `.js` 文件都是 ESM
2. `require()` 无法加载 ESM 模块（会报 `ERR_REQUIRE_ESM`）
3. 动态 import 天然懒加载，只有工具被调用时才加载对应模块

### 决策 2：API 路由使用动态数据而非静态文件

可以选择让 HTTP 路由直接服务 `docs/api/v1/` 下的静态 JSON（构建产物），也可以像 knowledge-collector 那样动态调用 data-reader。选择了后者：

- **实时性**：修改 `src/` 下的数据后立即生效，无需重新 build
- **一致性**：API 和 Tools 使用相同的数据读取函数，结果一定一致
- **简单**：不依赖构建产物的存在，减少一个前置条件

### 决策 3：静态文件从 src/ 而非 docs/ 提供

HTTP 路由的静态文件通配路由服务的是 `src/` 目录（源码），而非 `docs/` 目录（构建产物）。因为：

- `src/` 是数据的源头（single source of truth），修改即生效
- `docs/` 是为 GitHub Pages 准备的，内容可能不是最新的
- 与 knowledge-collector 的做法一致（它也是从 `src/` 提供 Web UI）

### 决策 4：静态文件路径安全校验

与 knowledge-collector 一样，通配路由 handler 内做了路径归一化和越界检查：

```javascript
const filePath = nodePath.normalize(nodePath.join(SRC_DIR, subPath));
if (!filePath.startsWith(SRC_DIR)) {
  res.writeHead(403);
  res.end("Forbidden");
  return;
}
```

防止通过 `../` 访问项目根目录之外的文件。

---

## 8. 接入配置

在 `~/.openclaw/openclaw.json` 中添加：

```json
{
  "plugins": {
    "load": {
      "paths": ["D:/github/my/js-clawhub/openclaw-plugin"]
    },
    "entries": {
      "js-clawhub": {
        "enabled": true,
        "config": {
          "locale": "zh-CN",
          "cloudflareApiToken": "your-token",
          "githubToken": "ghp_xxx"
        }
      }
    }
  }
}
```

重启 OpenClaw Gateway 后：

- **Web UI**：`http://localhost:18789/plugins/js-clawhub/`
- **CLI**：`openclaw hub stats`、`openclaw hub search "memory"` 等
- **Agent**：自动获得 8 个 clawhub\_\* 工具

---

## 9. 两种运行模式对比

升级后项目同时支持两种运行模式，互不干扰：

|            | 独立模式                    | OpenClaw 插件模式                        |
| ---------- | --------------------------- | ---------------------------------------- |
| 启动方式   | `node cli/cli.js <cmd>`     | OpenClaw 加载插件                        |
| 数据访问   | CLI 输出 JSON 到 stdout     | Agent Tools + CLI + HTTP API             |
| 站点服务   | `npx serve src`（独立端口） | `/plugins/js-clawhub/`（Gateway 同端口） |
| 配置来源   | `.env` 文件                 | OpenClaw pluginConfig（UI 可配）         |
| 部署操作   | `node cli/cli.js sync`      | `openclaw hub sync`                      |
| Agent 能力 | 无                          | 8 个 Tools + clawhub-navigator Skill     |

---

## 10. 相关文档

| 文档                                   | 日期       | 内容                                             |
| -------------------------------------- | ---------- | ------------------------------------------------ |
| `js-clawhub-project-creation.md`       | 2026-02-12 | ClawHub 项目从构思到首版发布                     |
| `js-knowledge-collector-plugin-dev.md` | 2026-03-06 | Knowledge Collector 插件开发记录（本次参照模板） |
| `link-collector-skill-dev.md`          | 2026-03-06 | 链接收集器技能开发记录                           |
| `plugin-creation-guide.md`             | 2026-02-25 | OpenClaw 插件创建完全指引                        |

---

_文档生成于 2026-03-08，JS ClawHub v1.2.0，基于 OpenClaw `2026.3.3`。_
