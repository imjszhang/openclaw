# js-knowledge-collector 开发为 OpenClaw 插件全记录

> 文档日期：2026-03-06
>
> 项目：[js-knowledge-collector](https://github.com/imjszhang/js-knowledge-collector)
>
> 覆盖范围：从零构建 OpenClaw 插件、通过 Gateway 暴露 Web UI、碰到的问题与解决思路

---

## 目录

1. [项目背景](#1-项目背景)
2. [插件结构设计](#2-插件结构设计)
3. [三个核心文件详解](#3-三个核心文件详解)
4. [通过 Gateway 暴露 Web UI](#4-通过-gateway-暴露-web-ui)
5. [碰到的问题与解决思路](#5-碰到的问题与解决思路)
6. [最终文件结构](#6-最终文件结构)
7. [接入配置](#7-接入配置)

---

## 1. 项目背景

**js-knowledge-collector** 是一个从 URL 到知识库的全链路工具：

```
URL → 抓取 → AI 总结（概要/摘要/推荐）→ SQLite 入库 → Flomo 推送（可选）
```

支持微信公众号、知乎、小红书、即刻、X.com、Reddit、Bilibili、YouTube、GitHub 及通用网页。

原本这个项目只有 CLI 和独立 HTTP 服务器，目标是将它改造为 OpenClaw 插件，让 AI Agent 能直接调用其所有能力，同时通过 OpenClaw Gateway 暴露已有的 Web UI 页面。

参考项目：**JS-Eyes**（`D:\github\my\JS-Eyes`）—— 另一个已完成的 OpenClaw 插件，提供浏览器自动化能力。以它为模板来开发本插件。

---

## 2. 插件结构设计

参照 JS-Eyes 的目录约定，在项目根目录下新建 `openclaw-plugin/` 子目录，包含三个文件：

```
js-knowledge-collector/
├── openclaw-plugin/
│   ├── openclaw.plugin.json   # 插件清单（ID、名称、配置 Schema）
│   ├── package.json           # ESM 包描述 + openclaw.extensions 字段
│   └── index.mjs              # 插件入口，export default register(api)
├── cli/
│   └── lib/
│       ├── collector.js       # 核心收集流程（被插件 import）
│       ├── data-reader.js     # 数据查询封装
│       ├── database.js        # SQLite 访问层
│       ├── exporter.js        # 导出逻辑
│       └── server.js          # 独立 HTTP 服务器（可选）
└── src/
    └── index.html             # Web UI 前端页面
```

**关键约定**：`openclaw-plugin/index.mjs` 用相对路径 `../cli/lib/xxx.js` 导入项目已有的业务逻辑，无需重写。

---

## 3. 三个核心文件详解

### 3.1 `openclaw.plugin.json` — 插件清单

定义插件元数据和用户可配置项（`configSchema`），以及 UI 提示（`uiHints`）。

```json
{
  "id": "js-knowledge-collector",
  "name": "JS Knowledge Collector",
  "description": "知识收集器 — 为 AI Agent 提供网页抓取、AI 总结、知识库管理能力。",
  "version": "1.0.0",
  "configSchema": {
    "type": "object",
    "properties": {
      "dbPath": { "type": "string", "default": "" },
      "llmApiBaseUrl": { "type": "string", "default": "" },
      "llmApiKey": { "type": "string", "default": "" },
      "llmApiModel": { "type": "string", "default": "gpt-4.1-mini" },
      "flomoWebhookUrl": { "type": "string", "default": "" },
      "serverPort": { "type": "number", "default": 3000 },
      "autoStartServer": { "type": "boolean", "default": false }
    }
  }
}
```

### 3.2 `package.json` — 包描述

```json
{
  "name": "js-knowledge-collector",
  "version": "1.0.0",
  "type": "module",
  "main": "index.mjs",
  "openclaw": {
    "extensions": ["./index.mjs"]
  }
}
```

`openclaw.extensions` 是 OpenClaw 识别插件入口的字段，与 JS-Eyes 完全相同。

### 3.3 `index.mjs` — 插件入口

导出 `register(api)` 默认函数，注册以下内容：

| 类型       | 名称                                                | 说明                                |
| ---------- | --------------------------------------------------- | ----------------------------------- |
| Service    | `knowledge-collector-server`                        | 可选的独立 HTTP 服务器              |
| HTTP Route | `/plugins/knowledge/`                               | Web UI 主页（index.html）           |
| HTTP Route | `/plugins/knowledge/api/v1/*`                       | REST API（文章列表/详情/统计/删除） |
| HTTP Route | `/plugins/knowledge/{filePath}`                     | 其他静态文件                        |
| Tool       | `knowledge_collect`                                 | 抓取 + AI 总结 + 入库               |
| Tool       | `knowledge_search`                                  | 关键词搜索                          |
| Tool       | `knowledge_list`                                    | 文章列表                            |
| Tool       | `knowledge_get`                                     | 文章详情                            |
| Tool       | `knowledge_stats`                                   | 统计信息                            |
| Tool       | `knowledge_delete`                                  | 删除文章                            |
| Tool       | `knowledge_export`                                  | 导出（prism/json/md）               |
| CLI        | `openclaw knowledge {stats\|list\|search\|collect}` | CLI 子命令                          |

---

## 4. 通过 Gateway 暴露 Web UI

### 背景

原项目有一个独立的 HTTP 服务器（`cli/lib/server.js`），需要单独运行在 `localhost:3000`。目标是通过 OpenClaw Gateway 的路由能力，让 Web UI 直接挂载在 Gateway 的同一端口（默认 18789），无需独立启动服务器。

### 文档调研

查阅 `D:\github\fork\openclaw\docs\gateway\` 和 `docs/tools/plugin.md` 发现：

- OpenClaw Gateway 在**同一端口**复用 WebSocket 和 HTTP 流量
- 插件注册 HTTP 路由的唯一方式是 `api.registerHttpRoute({ path, handler })`
- **注意**：`api.registerHttpHandler()` 已在 `2026.3.2` 中移除，必须用 `registerHttpRoute`

参考 `diffs` 插件的实现（`docs/tools/diffs.md`），约定俗成的路径前缀是 `/plugins/<plugin-name>/`。

### 路由规划

所有路由挂在 `/plugins/knowledge/` 前缀下：

```
GET  /plugins/knowledge          → 301 重定向到 /plugins/knowledge/
GET  /plugins/knowledge/         → src/index.html
GET  /plugins/knowledge/api/v1/articles.json      → 文章列表 API
GET  /plugins/knowledge/api/v1/stats.json         → 统计 API
GET  /plugins/knowledge/api/v1/articles/{id}.json → 文章详情/删除
GET  /plugins/knowledge/{filePath}                → src/ 下的静态文件
```

### 前端兼容的关键点

原前端 `src/index.html` 中的 API 调用写的是**相对路径**（无前导 `/`）：

```javascript
// 原代码 — 无前导斜杠
const response = await fetch(`api/v1/articles.json?${params}`);
```

这让前端天然兼容路径前缀：当页面通过 `http://localhost:18789/plugins/knowledge/` 访问时，浏览器将相对路径解析为 `http://localhost:18789/plugins/knowledge/api/v1/articles.json`，正好命中插件注册的 API 路由。

**无需修改前端代码。**

### 静态文件安全路径校验

静态文件通配路由需要校验请求路径不能越界到 `src/` 目录之外：

```javascript
const filePath = nodePath.normalize(nodePath.join(SRC_DIR, subPath));
if (!filePath.startsWith(SRC_DIR)) {
  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("Forbidden");
  return;
}
```

### 数据库按请求连接

原 `server.js` 是长连接模式（服务器启动时连接一次数据库），在 Gateway 路由中改为**按请求开关连接**，避免长期持有 SQLite 文件句柄：

```javascript
async function getDb() {
  const Database = (await import("../cli/lib/database.js")).default;
  const db = new Database(resolveDbPath());
  await db.connect();
  return db;
}

// 使用时：
const db = await getDb();
try {
  // ... 查询
} finally {
  await db.close();
}
```

---

## 5. 碰到的问题与解决思路

### 问题 1：去掉 `createRequire` 的 CJS 兼容包装

**现象**：最初照搬 JS-Eyes 的写法，用 `createRequire(import.meta.url)` 来 `require()` 项目内部模块：

```javascript
const require = createRequire(import.meta.url);
const { collect } = require("../cli/lib/collector.js");
```

**问题**：项目本身已是 `"type": "module"`（纯 ESM），所有 `.js` 文件都是 ESM 模块，`require()` 无法加载 ESM 文件，会报 `ERR_REQUIRE_ESM`。

**解决思路**：JS-Eyes 用 `createRequire` 是因为它的服务端代码（`clients/js-eyes-client.js`、`server/index.js`）是 CJS 格式。而本项目的所有内部模块都是 ESM，应该直接用动态 `import()`：

```javascript
// 正确方式 — 动态 import
const { collect } = await import("../cli/lib/collector.js");
```

**附带收益**：动态 import 是懒加载的，只有工具被实际调用时才加载对应模块，减少插件启动开销。

---

### 问题 2：`registerHttpRoute` 路径参数的匹配机制

**现象**：注册文章详情路由时，不确定 `path` 字段是否支持通配符 / 参数，以及 OpenClaw 是否会将匹配到的路径参数传入 handler。

**调研**：查阅 `diffs` 插件的实现：

```javascript
// diffs 插件注册了带 {id} 和 {token} 的路径
// 路由：/plugins/diffs/view/{artifactId}/{token}
```

说明 OpenClaw 支持 `{paramName}` 风格的路径参数，但实际 handler 中 OpenClaw 传进来的是标准 Node.js `IncomingMessage`，需要自行从 `req.url` 里解析 ID。

**解决方案**：注册时用 `{id}` 占位符，在 handler 中用正则从 URL 里提取：

```javascript
api.registerHttpRoute({
  path: `${ROUTE_PREFIX}/api/v1/articles/{id}`,
  async handler(req, res) {
    const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const match = parsed.pathname.match(/\/articles\/([^/]+)\.json$/);
    const id = match[1];
    // ...
  },
});
```

---

### 问题 3：通配路由的优先级冲突

**现象**：注册了多条路由，担心 `/plugins/knowledge/{filePath}` 这条通配路由会拦截 `/plugins/knowledge/api/v1/...` 的请求。

**解决思路**：

1. **具体路由优先**：OpenClaw 遵循路由系统的通用原则，具体路径（`/api/v1/articles.json`）优先于通配路径（`{filePath}`）
2. **双重保险**：在通配路由 handler 内额外检查，如果 subPath 以 `api/` 开头则直接返回 404，防止意外漏网：

```javascript
if (subPath.startsWith("api/")) {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
  return;
}
```

---

### 问题 4：`req.headers.host` 在 Gateway 环境下可能为空

**现象**：用 `new URL(req.url, ...)` 解析 URL 时，需要一个 base URL。`req.url` 在 Node.js HTTP 环境下只包含 path，不含 host。

**担忧**：Gateway 内部转发请求时，`req.headers.host` 是否一定存在？

**解决方案**：加上 fallback，确保不会因 host 缺失而抛出 URL 解析错误：

```javascript
const parsed = new URL(req.url, `http://${req.headers.host || "localhost"}`);
```

---

### 问题 5：`api.registerHttpHandler` 已移除

**现象**：在旧版文档或示例中看到 `api.registerHttpHandler()`，不确定是否可用。

**发现**：`docs/prism/journal/2026-03-04/merge-main-upgrade-summary.md` 明确记录：

> **BREAKING**：Plugin SDK 移除 `api.registerHttpHandler(...)`，必须使用 `api.registerHttpRoute(...)` 注册 HTTP 路由。

直接使用 `api.registerHttpRoute`，无问题。

---

### 问题 6：LLM 配置的传递方式

**背景**：项目原本通过 `.env` 文件读取 `LLM_API_BASE_URL`、`LLM_API_KEY` 等环境变量。插件模式下不一定有 `.env` 文件，配置应该从 `pluginConfig` 获取。

**解决思路**：在插件 `register(api)` 入口调用 `applyEnv()`，将 `pluginConfig` 中的值注入到 `process.env`，让已有的业务代码（`llm.js`、`database.js` 等）无需改动即可读到：

```javascript
function applyEnv(pluginCfg) {
  if (pluginCfg.dbPath) process.env.DB_PATH = pluginCfg.dbPath;
  if (pluginCfg.llmApiBaseUrl) process.env.LLM_API_BASE_URL = pluginCfg.llmApiBaseUrl;
  if (pluginCfg.llmApiKey) process.env.LLM_API_KEY = pluginCfg.llmApiKey;
  if (pluginCfg.llmApiModel) process.env.LLM_API_MODEL = pluginCfg.llmApiModel;
  if (pluginCfg.flomoWebhookUrl) process.env.FLOMO_WEBHOOK_URL = pluginCfg.flomoWebhookUrl;
}
```

这样**业务代码零改动**，同时支持两种使用方式：CLI 模式用 `.env`，插件模式用 `pluginConfig`。

---

## 6. 最终文件结构

```
openclaw-plugin/
├── openclaw.plugin.json   （插件清单）
├── package.json           （ESM 包描述）
└── index.mjs              （插件入口）
```

`index.mjs` 的整体结构：

```
顶层：
  - 路径常量（PROJECT_ROOT、SRC_DIR、ROUTE_PREFIX）
  - MIME_TYPES 表
  - 工具函数（applyEnv、resolveDbPath、textResult、jsonResult、sendJson、serveStaticFile、getDb）

register(api) 函数：
  ├── applyEnv(pluginCfg)         将配置注入 process.env
  ├── registerService(...)        独立服务器（可选）
  ├── registerHttpRoute × 5       Gateway Web UI + REST API
  ├── registerTool × 7            AI 工具
  └── registerCli(...)            CLI 子命令
```

---

## 7. 接入配置

在 `~/.openclaw/openclaw.json` 中添加：

```json
{
  "plugins": {
    "load": {
      "paths": ["D:/github/my/js-knowledge-collector/openclaw-plugin"]
    },
    "entries": {
      "js-knowledge-collector": {
        "enabled": true,
        "config": {
          "dbPath": "D:/github/my/js-knowledge-collector/data/data.db",
          "llmApiBaseUrl": "https://your-api.com/v1",
          "llmApiKey": "sk-xxx",
          "llmApiModel": "gpt-4.1-mini"
        }
      }
    }
  }
}
```

重启 OpenClaw Gateway 后，访问：

```
http://localhost:18789/plugins/knowledge/
```

即可在浏览器中打开知识库 Web UI，页面与 API 均通过 Gateway 同一端口提供服务，无需单独启动 HTTP 服务器。

---

_文档生成于 2026-03-06，基于 OpenClaw `2026.3.3`。_
