# JS Knowledge Collector：知识收集器项目的创建

> 编写日期：2026-03-06
> 记录 JS Knowledge Collector 项目的创建——一个从 URL 到知识库的全链路工具，为 AI Agent 提供网页抓取、AI 总结和知识管理能力。

---

## 目录

1. [项目动机](#1-项目动机)
2. [核心设计理念](#2-核心设计理念)
3. [处理管线](#3-处理管线)
4. [技术选型](#4-技术选型)
5. [项目架构](#5-项目架构)
6. [OpenClaw 插件能力](#6-openclaw-插件能力)
7. [Link Collector 技能](#7-link-collector-技能)
8. [支持的平台](#8-支持的平台)
9. [当日进展](#9-当日进展)
10. [后续演化](#10-后续演化)

---

## 1. 项目动机

日常浏览中会遇到大量有价值的文章和内容，但"收藏"和"消化"之间存在巨大的鸿沟。常见的痛点：

- **收藏即遗忘**——浏览器书签、微信收藏夹越存越多，从不回顾
- **跨平台碎片化**——微信公众号、知乎、小红书、X.com、Reddit 上的内容散落各处
- **缺乏结构化**——原文太长不想看，但又没有简洁的摘要和推荐理由

核心需求是：**给 AI Agent 一个 URL，它自动完成抓取、总结、入库、导出的全链路**。用户只需要在对话中发链接，知识库自动增长。

## 2. 核心设计理念

### 2.1 全链路自动化

从 URL 到知识库只需一步：

```
URL → 抓取网页内容 → AI 总结（概要/摘要/推荐理由） → 保存到 SQLite → 可选推送到 Flomo
```

用户不需要手动复制粘贴、不需要整理格式，Agent 处理一切。

### 2.2 主会话不阻塞

`knowledge_collect` 调用 LLM 进行总结，单次可能耗时数十秒。如果在主会话中调用，会阻塞整个 session lane，导致机器人长时间无响应。

解决方案是 **inbox/batch 轮转**：

- 主会话只做入队（写 `inbox.jsonl`），毫秒级完成
- cron 隔离会话定时批量处理队列，互不干扰

### 2.3 平台自适应

不同平台的网页结构差异极大。项目为每个主流平台实现了专用的 scraper，自动识别 URL 来源并选择最优抓取策略。

## 3. 处理管线

完整的知识收集管线包含四个阶段：

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Scrape  │ ──→ │  Summarize   │ ──→ │    Store     │ ──→ │   Export     │
│  抓取内容 │     │  AI 总结     │     │  入库 SQLite │     │  导出/推送   │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

| 阶段          | 模块                        | 职责                                    |
| ------------- | --------------------------- | --------------------------------------- |
| **Scrape**    | `scraper.js` + 平台 scraper | 识别 URL 来源，调用对应平台的抓取逻辑   |
| **Summarize** | `summarizer.js` + `llm.js`  | 调用 LLM 生成概要、摘要和推荐理由       |
| **Store**     | `database.js`               | 写入 SQLite 数据库                      |
| **Export**    | `exporter.js`               | 导出为 JSON、Markdown 或 Prism 日记格式 |

LLM 总结使用三套独立的 prompt（`prompts/` 目录）：

| Prompt               | 输出                           |
| -------------------- | ------------------------------ |
| `summary.txt`        | 结构化概要——核心观点、关键要点 |
| `recommendation.txt` | 推荐理由——为什么这篇值得读     |
| `digest.txt`         | 精华摘要——浓缩版内容           |

## 4. 技术选型

| 技术                   | 选择理由                                        |
| ---------------------- | ----------------------------------------------- |
| **Node.js >= 18**      | ES Module 原生支持，与 OpenClaw 插件生态一致    |
| **SQLite** (`sqlite3`) | 零配置的本地数据库，适合个人知识库规模          |
| **Cheerio**            | 轻量级 HTML 解析，不需要浏览器环境              |
| **OpenAI SDK**         | 兼容任何 OpenAI 接口的 LLM 服务                 |
| **WebSocket** (`ws`)   | 与 JS-Eyes 浏览器扩展通信，实现需要浏览器的抓取 |
| **dotenv**             | 环境变量管理                                    |

### 两种抓取模式

项目支持两种抓取策略，根据目标平台自动选择：

| 模式           | 适用场景                        | 实现                              |
| -------------- | ------------------------------- | --------------------------------- |
| **直接抓取**   | 公众号、GitHub 等服务端渲染页面 | `web-scraper.js` + Cheerio        |
| **浏览器抓取** | 小红书、X.com 等 SPA/需登录页面 | `browser-automation.js` + JS-Eyes |

浏览器抓取模式依赖 JS-Eyes 插件提供的浏览器自动化能力，通过 WebSocket 控制真实浏览器实例。

## 5. 项目架构

```
js-knowledge-collector/
├── cli/                          # CLI 工具
│   ├── cli.js                    # 入口（serve/build 等命令）
│   └── lib/                      # 核心模块
│       ├── collector.js          # 收集器主流程（抓取 + 总结 + 入库）
│       ├── scraper.js            # URL 来源识别 + 分发
│       ├── scraper-bilibili.js   # Bilibili 视频抓取
│       ├── scraper-youtube.js    # YouTube 视频抓取
│       ├── web-scraper.js        # 通用网页抓取（Cheerio）
│       ├── browser-automation.js # 浏览器抓取（JS-Eyes）
│       ├── summarizer.js         # AI 总结（调用 LLM）
│       ├── llm.js                # LLM API 封装
│       ├── database.js           # SQLite 数据层
│       ├── data-reader.js        # 数据查询（搜索/列表/统计）
│       ├── exporter.js           # 导出（JSON/MD/Prism）
│       ├── flomo.js              # Flomo Webhook 推送
│       ├── server.js             # 内置 HTTP 服务器
│       ├── js-eyes-client.js     # JS-Eyes WebSocket 客户端
│       ├── formatters.js         # 输出格式化
│       └── git.js                # Git 操作
├── prompts/                      # LLM Prompt 模板
│   ├── summary.txt               # 概要提示词
│   ├── recommendation.txt        # 推荐理由提示词
│   └── digest.txt                # 精华摘要提示词
├── openclaw-plugin/              # OpenClaw 插件
│   ├── openclaw.plugin.json      # 插件清单
│   ├── index.mjs                 # 注册 AI 工具 + 服务 + HTTP 路由 + CLI
│   ├── package.json
│   └── skills/
│       └── link-collector/       # 链接收集器技能
│           ├── SKILL.md
│           └── references/
├── src/                          # Web UI 源码
│   └── index.html                # 知识库浏览界面
├── data/                         # 数据目录
│   └── data.db                   # SQLite 数据库
└── docs/                         # 构建产物
```

## 6. OpenClaw 插件能力

插件注册了四类能力：

### 6.1 后台服务

可选的内置 HTTP 服务器，提供知识库浏览的 Web UI。

### 6.2 AI 工具（7 个）

| 工具                | 功能                               |
| ------------------- | ---------------------------------- |
| `knowledge_collect` | 从 URL 收集——抓取 + AI 总结 + 入库 |
| `knowledge_search`  | 按关键词搜索知识库                 |
| `knowledge_list`    | 列出文章（分页、筛选、排序）       |
| `knowledge_get`     | 获取单篇文章详情                   |
| `knowledge_stats`   | 知识库统计（总数、平台分布）       |
| `knowledge_delete`  | 删除文章                           |
| `knowledge_export`  | 导出文章（JSON/MD/Prism 格式）     |

### 6.3 HTTP 路由（Gateway Web UI）

通过 OpenClaw Gateway 暴露 Web UI 和 REST API：

| 路由                                                     | 功能           |
| -------------------------------------------------------- | -------------- |
| `GET /plugins/js-knowledge/`                             | 知识库浏览界面 |
| `GET /plugins/js-knowledge/api/v1/articles.json`         | 文章列表 API   |
| `GET /plugins/js-knowledge/api/v1/stats.json`            | 统计 API       |
| `GET /plugins/js-knowledge/api/v1/articles/{id}.json`    | 文章详情 API   |
| `DELETE /plugins/js-knowledge/api/v1/articles/{id}.json` | 删除文章 API   |

### 6.4 CLI 命令

```bash
openclaw knowledge stats                 # 知识库统计
openclaw knowledge list                  # 列出文章
openclaw knowledge search <keyword>      # 搜索文章
openclaw knowledge collect <url>         # 收集文章
openclaw knowledge setup-collector       # 配置 cron 定时任务
```

### 插件配置

| 选项              | 默认值           | 说明                                  |
| ----------------- | ---------------- | ------------------------------------- |
| `dbPath`          | `""`             | SQLite 数据库路径（空则使用项目默认） |
| `llmApiBaseUrl`   | `""`             | LLM API 地址（OpenAI 兼容）           |
| `llmApiKey`       | `""`             | LLM API Key                           |
| `llmApiModel`     | `"gpt-4.1-mini"` | LLM 模型                              |
| `flomoWebhookUrl` | `""`             | Flomo Webhook URL                     |
| `serverPort`      | `3000`           | 内置服务器端口                        |
| `autoStartServer` | `false`          | 是否自动启动服务器                    |

## 7. Link Collector 技能

项目内置了一个 OpenClaw 技能——**链接收集器（link-collector）**，解决"主会话阻塞"问题。

### 核心约束

`knowledge_collect` 会调用 LLM，耗时可能达分钟级。在主会话中调用会阻塞整个 session lane。因此：

- 主会话只做入队（写 `inbox.jsonl`）
- `knowledge_collect` 只在 cron 隔离会话中调用

### inbox/batch 轮转机制

```
用户发链接 → 入队到 inbox.jsonl（主会话，毫秒级）
                    ↓
cron 触发 → rename inbox → batch-{timestamp}.jsonl（原子操作）
                    ↓
逐条处理 → knowledge_collect（隔离会话，不阻塞主会话）
                    ↓
处理完成 → 归档到 archive/
```

读写隔离保证并发安全：收集侧只写 inbox，处理侧只读写 batch，互不干扰。

### 容错设计

| 场景             | 处理方式                                  |
| ---------------- | ----------------------------------------- |
| 单条处理失败     | retries < 3 回队列重试，>= 3 标记永久失败 |
| Agent 崩溃       | batch 文件保留，下次 cron 自动恢复        |
| JSONL 行损坏     | 跳过该行，继续处理其余条目                |
| 知识库服务不可用 | 全部失败回队列，下次 cron 自动重试        |

## 8. 支持的平台

| 平台            | 抓取模式     | 特殊处理                     |
| --------------- | ------------ | ---------------------------- |
| 微信公众号      | 直接抓取     | 解析 `mp.weixin.qq.com` 格式 |
| 知乎            | 直接抓取     | 提取文章/回答内容            |
| 小红书          | 浏览器抓取   | 需要 JS-Eyes 协助            |
| 即刻            | 直接抓取     | —                            |
| X.com (Twitter) | 浏览器抓取   | 移动端 URL 自动转桌面版      |
| Reddit          | 直接抓取     | —                            |
| Bilibili        | 专用 scraper | 视频信息 + 字幕提取          |
| YouTube         | 专用 scraper | 视频信息 + 字幕提取          |
| GitHub          | 直接抓取     | README / Issue / Discussion  |
| 通用网页        | 直接抓取     | Cheerio 通用解析             |

## 9. 当日进展

2026-03-06 是项目创建日，当天密集提交了 11 次，完成了核心功能闭环：

| 时间  | 进展                                             |
| ----- | ------------------------------------------------ |
| 14:19 | Initial commit——抓取、总结、入库、导出全链路实现 |
| 17:05 | CLI `serve` 命令，内置 HTTP 开发服务器           |
| 17:49 | 重构 CLI serve，改进服务器启动流程               |
| 18:14 | OpenClaw 插件支持 `.env` 环境变量加载            |
| 18:38 | Gateway HTTP 路由添加认证                        |
| 18:41 | 认证方式从 `gateway` 调整为 `plugin`             |
| 19:16 | 重构 URL 处理规则，优化浏览器抓取策略            |
| 20:04 | 新增 Bilibili 和 YouTube 视频抓取能力            |
| 20:50 | 添加 `setup-collector` 命令配置 cron 定时任务    |
| 21:01 | 重构 prompt——总结、推荐、摘要三套提示词优化      |
| 21:20 | `cleanContent` 函数优化内容预处理                |

从首次提交到当天结束，完成了：收集器全链路、7 个 AI 工具、Gateway Web UI、CLI 命令、Bilibili/YouTube 支持、cron 定时任务配置、prompt 优化。

## 10. 后续演化

创建后两天内继续快速迭代，截至 2026-03-08 共 **14 次提交**：

| 日期  | 主要变更                                                          |
| ----- | ----------------------------------------------------------------- |
| 03-07 | 浏览器抓取增强——移动端 URL 自动转桌面版                           |
| 03-07 | SKILL.md 完善——config.json 参数说明、链接处理流程                 |
| 03-07 | link-collector 技能——优先入队标记、禁止主会话调 knowledge_collect |

项目在线资源：

- GitHub：<https://github.com/imjszhang/js-knowledge-collector>

---

## 相关文档

| 文档                                   | 日期       | 内容                      |
| -------------------------------------- | ---------- | ------------------------- |
| `js-knowledge-collector-plugin-dev.md` | 2026-03-06 | 知识收集器插件开发记录    |
| `link-collector-skill-dev.md`          | 2026-03-06 | 链接收集器技能开发记录    |
| `plugin-creation-guide.md`             | 2026-02-25 | OpenClaw 插件创建完全指引 |
