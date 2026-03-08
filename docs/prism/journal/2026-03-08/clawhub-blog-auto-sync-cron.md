# ClawHub 博客自动同步 Cron 集成

> 文档日期：2026-03-08
>
> 项目：[js-clawhub](https://github.com/imjszhang/js-clawhub)
>
> 覆盖范围：为 ClawHub OpenClaw 插件接入 cron 定时任务，实现博客从外部源自动导入、AI 翻译、构建和推送的全自动流水线

---

## 目录

1. [问题背景](#1-问题背景)
2. [参考模型](#2-参考模型)
3. [设计方案](#3-设计方案)
4. [改动清单](#4-改动清单)
5. [clawhub_blog_auto_sync 工具设计](#5-clawhub_blog_auto_sync-工具设计)
6. [setup-cron CLI 命令](#6-setup-cron-cli-命令)
7. [增量更新机制](#7-增量更新机制)
8. [SKILL.md 更新](#8-skillmd-更新)
9. [环境变量桥接修复](#9-环境变量桥接修复)
10. [使用方式](#10-使用方式)
11. [关键技术决策](#11-关键技术决策)

---

## 1. 问题背景

ClawHub 的博客内容管线支持从外部项目导入 Markdown 文件（通过 `sources.json` 配置源），再调用 LLM API 翻译成英文。但这条管线需要手动执行 CLI 命令触发：

```bash
clawhub blog-import practice-diary --translate
```

管道本身已经很完善——去重追踪、内容转换、AI 翻译、构建、提交推送都有了——但缺少定时自动触发机制。每次有新文章都需要人记得跑一次命令。

期望：配置一次后，cron 定时检查所有源，有新文章就自动导入 → 翻译 → 构建 → 推送。

## 2. 参考模型

参考 js-knowledge-prism 的 cron 实现模式，OpenClaw 的 cron 不是插件内部的 `setInterval`，而是平台级调度，工作原理如下：

```
openclaw cron add --name "xxx" --cron "*/60 * * * *" --message "做某事"
       ↓
OpenClaw 平台按 cron 表达式定时触发
       ↓
创建 isolated 隔离会话，把 --message 当作用户消息发给 Agent
       ↓
Agent 读取 SKILL.md 匹配意图，决定调用哪个工具
       ↓
工具执行实际逻辑
```

js-knowledge-prism 中的实现：

- `openclaw.plugin.json` 定义 `cron.defaultInterval` 和 `cron.timezone` 配置 schema
- `index.mjs` 注册 `setup-cron` CLI 子命令，内部调用 `openclaw cron add`
- `index.mjs` 注册 `knowledge_prism_process_all` 工具，串联所有处理逻辑
- `prism-processor/SKILL.md` 告诉 Agent 收到 cron 消息时调用什么工具

## 3. 设计方案

ClawHub 的场景与 knowledge-prism 的差异：

| 维度     | knowledge-prism             | clawhub                               |
| -------- | --------------------------- | ------------------------------------- |
| 处理对象 | 多个知识库（注册表）        | 多个博客源（sources.json）            |
| 处理管线 | atoms → groups → synthesis  | import → translate → build → git push |
| 注册机制 | registry.json 动态注册/注销 | sources.json 静态配置                 |
| LLM 依赖 | 核心处理依赖 LLM            | 仅翻译步骤依赖 LLM                    |
| 产出     | 知识库文件更新              | 站点构建 + git 推送                   |

因为 ClawHub 的源是静态配置在 `sources.json` 中的，不需要 knowledge-prism 那样的注册/注销机制，设计更简洁。

数据流：

```
OpenClaw Cron 每 N 分钟触发
  │
  ▼
isolated Agent 会话
  │  收到: "执行 ClawHub 博客自动同步..."
  ▼
clawhub-navigator SKILL.md 匹配到意图
  │
  ▼
调用 clawhub_blog_auto_sync 工具
  │
  ├── blogImport(sourceId)       ← 遍历 sources.json 每个源
  │     └── 去重(manifest) → 转换 → 写入 posts/ → 更新 index.json
  │
  ├── blogTranslateUntranslated()  ← 找出所有没英文版的
  │     └── meta 翻译 + body 翻译 → 写入 *.en-US.md → 更新 index.json
  │
  ├── build()                    ← src/ → docs/
  │
  └── gitAddAll + gitCommit + gitPush  ← 自动发布
```

## 4. 改动清单

共涉及 3 个文件：

| 文件                                                | 改动                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `openclaw-plugin/openclaw.plugin.json`              | 新增 `cron` 配置 schema + uiHints                                                                |
| `openclaw-plugin/index.mjs`                         | 修复 `applyEnv()` 环境变量桥接；新增 `clawhub_blog_auto_sync` 工具；新增 `setup-cron` CLI 子命令 |
| `openclaw-plugin/skills/clawhub-navigator/SKILL.md` | 新增 cron 触发条件、工具说明、定时同步流程段落                                                   |

## 5. clawhub_blog_auto_sync 工具设计

注册为 OpenClaw AI 工具，供 cron 隔离会话中的 Agent 调用，也可由用户在主会话中手动触发。

### 参数

| 参数            | 类型    | 默认  | 说明                      |
| --------------- | ------- | ----- | ------------------------- |
| `dryRun`        | boolean | false | 预览模式，不实际写入/提交 |
| `skipTranslate` | boolean | false | 跳过翻译步骤              |
| `skipBuild`     | boolean | false | 跳过构建步骤              |
| `skipPush`      | boolean | false | 跳过推送步骤              |

### 执行流程

```
1. 调用 blogSources() 获取所有源及其状态
2. 遍历每个源：
   - 路径不可用 → 跳过
   - pendingFiles === 0 → 跳过
   - 否则 → blogImport(sourceId, { dryRun })
3. totalImported > 0 且 !skipTranslate → blogTranslateUntranslated()
4. totalImported > 0 且 !skipBuild → build({ clean: true })
5. totalImported > 0 → gitAddAll + gitDiffStat + gitCommit + gitPush
6. 返回文本摘要
```

所有函数都复用 `cli/lib/` 下的已有实现：

- `blogImport`, `blogSources`, `blogTranslateUntranslated` from `blog-importer.js`
- `build` from `builder.js`
- `gitStatus`, `gitAddAll`, `gitDiffStat`, `gitCommit`, `gitPush`, `generateCommitMessage` from `git.js`

### 空跑优化

当没有新文章时，翻译、构建、提交步骤全部跳过。判断条件统一为 `totalImported > 0`，避免不必要的 LLM 调用和空 commit。

## 6. setup-cron CLI 命令

```bash
openclaw hub setup-cron [--every <minutes>] [--tz <timezone>] [--remove]
```

| 选项       | 默认值                        | 说明             |
| ---------- | ----------------------------- | ---------------- |
| `--every`  | 120（或插件配置值）           | 执行间隔（分钟） |
| `--tz`     | Asia/Shanghai（或插件配置值） | IANA 时区        |
| `--remove` | —                             | 移除已有定时任务 |

实现逻辑：

1. 用 `execFileSync` 调用 `openclaw cron list --json` 检查是否已存在名为 `clawhub-blog-sync` 的任务
2. 已存在 + `--remove` → 调用 `openclaw cron rm <id>` 移除
3. 已存在但没 `--remove` → 提示已存在，建议先 `--remove`
4. 不存在 → 调用 `openclaw cron add`：
   - `--name "clawhub-blog-sync"`
   - `--cron "*/N * * * *"`
   - `--session isolated`
   - `--message "执行 ClawHub 博客自动同步：导入所有源的新文章，翻译未翻译文章，构建并推送站点。"`
   - `--thinking minimal`

## 7. 增量更新机制

cron 定时触发的核心关切是避免重复工作。ClawHub 的增量机制已内建在底层函数中：

### 博客导入去重

`import-manifest.json` 记录每个已导入文件的 SHA256 哈希。导入时先比对：

- 内容没变 → `already_imported`，跳过
- 内容变了但没加 `--force` → `already_imported_changed`，跳过并提示
- 全新文件 → 执行导入

### 翻译去重

`blogTranslateUntranslated()` 检查两个条件：

- `index.json` 中是否有非空的 `title['en-US']`
- 文件系统中是否存在 `{slug}.en-US.md`

两者都满足 → 跳过，不调用 LLM。

### 构建和提交

工具内部以 `totalImported > 0` 作为门控条件。即使进入提交环节，`gitDiffStat()` 返回空数组时也会跳过 commit。

### 空跑代价

| 环节 | 空跑开销                       |
| ---- | ------------------------------ |
| 导入 | 读文件列表 + 比对哈希，极轻    |
| 翻译 | 扫描 index.json，不调 LLM      |
| 构建 | `totalImported === 0` 直接跳过 |
| 提交 | 不进入该分支                   |

每 2 小时空跑一次的开销可忽略不计。

## 8. SKILL.md 更新

在 `clawhub-navigator/SKILL.md` 中新增：

- 触发条件表格新增行：`cron 隔离会话触发` → `调用 clawhub_blog_auto_sync`
- 可用工具表格新增行：`clawhub_blog_auto_sync` 的说明
- 新增"定时同步流程"段落，包含：
  - cron 定时任务配置方式
  - 定时处理流程说明（仅需调用一个工具）
  - 前提条件（源路径可达、LLM API 可用、git push 权限）

## 9. 环境变量桥接修复

发现了一个已有的 bug：`applyEnv()` 设置的是 `LLM_API_*` 系列变量，但 `ai-caller.js` 的 `loadApiConfig()` 读取的是 `CLAWHUB_API_*` 系列变量。二者不匹配，导致通过 OpenClaw 插件配置的 LLM 参数无法被翻译功能获取。

修复方式：在 `applyEnv()` 中同时设置两组变量：

```javascript
if (pluginCfg.llmApiBaseUrl) {
  process.env.LLM_API_BASE_URL = pluginCfg.llmApiBaseUrl;
  process.env.CLAWHUB_API_BASE_URL = pluginCfg.llmApiBaseUrl;
}
```

这个修复不仅影响 cron 场景，也修复了通过 `openclaw hub` CLI 调用翻译时的配置传递问题。

## 10. 使用方式

### 一键配置

```bash
openclaw hub setup-cron
```

默认每 120 分钟执行一次。自定义：

```bash
openclaw hub setup-cron --every 60 --tz Asia/Shanghai
```

### 手动触发

在 OpenClaw 对话中直接说"同步博客"或"导入并翻译博客"，Agent 会调用 `clawhub_blog_auto_sync` 工具。

### 移除定时任务

```bash
openclaw hub setup-cron --remove
```

### 前提条件

1. `sources.json` 中的源路径在运行环境中可访问
2. LLM API 在插件设置或 `.env` 中正确配置
3. 运行环境有 `git push` 到 origin 的权限

## 11. 关键技术决策

### 为什么不需要注册表机制？

js-knowledge-prism 需要 `registry.json` 是因为知识库是动态注册/注销的（用户随时添加或移除），而 ClawHub 的博客源是静态配置在 `sources.json` 中的，改动频率极低，不需要运行时注册。

### 为什么翻译以 totalImported > 0 为门控？

`blogTranslateUntranslated()` 内部虽有去重，但它需要扫描整个 index 并逐条检查文件系统。当确定没有新导入时，完全跳过这一步更高效。

### 为什么默认间隔是 120 分钟而不是 60？

博客内容更新频率远低于知识库 journal。120 分钟足够覆盖绝大多数场景，同时减少空跑次数。用户可通过 `--every` 自定义。

### 为什么不把 Pulse pull 也纳入？

Pulse 数据来自 js-moltbook，依赖另一个项目的 publisher 输出目录。博客导入和 Pulse 拉取是两条独立的数据管线，混在同一个 cron 中会增加耦合和失败半径。如有需要可以单独为 Pulse 配置 cron。
