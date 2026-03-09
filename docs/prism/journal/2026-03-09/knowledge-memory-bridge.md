# 知识库桥接 OpenClaw 记忆系统：分析、设计与实现

> 文档日期：2026-03-09
>
> 项目：[js-knowledge-collector](https://github.com/imjszhang/js-knowledge-collector)
>
> 覆盖范围：OpenClaw 上下文引擎与记忆系统分析、知识库整合优化思路、P0 桥接方案设计与实现

---

## 一、起点：理解 OpenClaw 的上下文引擎与记忆系统

### 1.1 上下文引擎（Context Engine）

上下文引擎是 OpenClaw 的**可插拔上下文管理框架**，控制"模型每次推理时看到什么内容"。

核心接口（`src/context-engine/types.ts`）提供完整的生命周期：

| 方法                                       | 作用                                                      |
| ------------------------------------------ | --------------------------------------------------------- |
| `bootstrap`                                | 会话初始化时导入历史上下文                                |
| `ingest` / `ingestBatch`                   | 将新消息摄入引擎存储                                      |
| `assemble`                                 | 在 token 预算内组装发给模型的消息列表，可注入额外系统提示 |
| `afterTurn`                                | 每轮对话后执行后处理（持久化、触发后台压缩）              |
| `compact`                                  | 压缩上下文（生成摘要、裁剪旧轮次）                        |
| `prepareSubagentSpawn` / `onSubagentEnded` | 子 Agent 上下文生命周期                                   |

通过 `plugins.slots.contextEngine` 配置切换引擎（默认 `"legacy"`），自定义引擎用 `api.registerContextEngine(id, factory)` 注册。

### 1.2 记忆系统（Memory）

记忆系统管理**持久化在磁盘上的 Markdown 文件 + 向量索引**，跨会话存活：

- **存储**：`MEMORY.md`（长期记忆）+ `memory/YYYY-MM-DD.md`（每日记忆）
- **检索**：`memory_search`（语义向量 + BM25 混合搜索）、`memory_get`（定向读取）
- **索引**：SQLite + embedding 向量，支持 OpenAI / Gemini / Voyage / 本地模型
- **增强**：MMR 去重、时间衰减、embedding 缓存

### 1.3 两者的关系

```
上下文引擎 = "短期工作记忆的调度器"
记忆系统   = "长期知识的仓库"
```

协作机制：

1. **Bootstrap 注入**：`MEMORY.md` 作为 Project Context 直接注入系统提示
2. **工具调用**：`memory_search` 按需拉取记忆片段进入上下文
3. **压缩前刷新**：上下文接近压缩阈值时，自动触发 memory flush 将重要信息持久化到记忆文件

---

## 二、整合优化思路：五个层次

### 层次一（P0）：导出 Markdown + extraPaths 桥接

将知识库文章摘要导出为 Markdown 文件，配置 `memorySearch.extraPaths` 指向导出目录。

- **工作量**：小
- **价值**：立竿见影，零改动 OpenClaw 核心

### 层次二（P1）：Hook 系统自动化

- `message_received` 钩子自动检测 URL 入队
- `before_prompt_build` 钩子注入相关知识
- `before_compaction` 钩子自动沉淀知识

### 层次三（P2）：统一 Memory 插件

创建增强版 Memory 插件，统一 `memory_search` 同时检索记忆文件和知识库。

### 层次四（P3）：自定义 Context Engine

在 `assemble` 阶段主动语义检索，通过 `systemPromptAddition` 注入相关知识（RAG 效果）。

### 层次五（P4）：完整知识生命周期

串联所有能力，实现从 URL 收集 → 自动入库 → 语义检索 → 上下文注入 → 压缩前沉淀的完整闭环。

**决策**：先做 P0，最低成本最高回报。

---

## 三、P0 方案设计

### 3.1 核心思路

```
SQLite 知识库 → 增量导出 Markdown → memorySearch.extraPaths → memory_search 可检索
```

### 3.2 改动范围

全部在 `js-knowledge-collector` 插件内，不改 OpenClaw 核心。

**新增文件**：`cli/lib/memory-sync.js`

- `syncToMemory({ dbPath, outputDir, force })` 函数
- 增量检测（`.sync-state.json` 跟踪每篇文章的 `updated` 时间戳）
- 每篇文章导出为 `article-{id}.md`（仅摘要层：标题 + 推荐理由 + 摘要 + 详细摘要 + 来源链接）
- 自动清理已删除文章的 .md 文件

**修改文件**：`openclaw-plugin/openclaw.plugin.json`

- 新增 3 个配置项：`memorySyncEnabled`、`memorySyncDir`、`memorySyncIntervalMinutes`

**修改文件**：`openclaw-plugin/index.mjs`

- 注册 `knowledge-memory-sync` 后台服务（启动全量同步 + interval 增量）
- `knowledge_collect` / `knowledge_delete` 成功后触发增量同步
- 新增 `openclaw knowledge sync` CLI 命令

### 3.3 数据流

```
用户: "收集这篇文章 https://..."
  → knowledge_collect(url) → 抓取+摘要+入库
  → 触发增量同步 → 写入 article-{id}.md

用户: "之前收集过关于 RAG 的文章吗？"
  → memory_search("RAG") → 向量检索导出目录的 .md 文件
  → 返回匹配的知识摘要
```

---

## 四、实现细节

### 4.1 memory-sync.js 核心逻辑

```javascript
export async function syncToMemory({ dbPath, outputDir, force = false }) {
  // 1. 读取数据库所有文章（id, title, summary, digest, recommend, source_url, created, updated）
  // 2. 加载 .sync-state.json（记录每篇文章的 updated 时间戳）
  // 3. 对比：只写入 state 中不存在或 updated 不同的文章
  // 4. 清理：数据库中不存在的 ID → 删除对应 .md 文件
  // 5. 保存更新后的 state
  return { synced, deleted, total };
}
```

增量检测策略：用 `{ articles: { [id]: { updated } } }` 结构，而非简单的 ID 列表，这样文章更新后也能被重新导出。

### 4.2 导出的 Markdown 格式

```markdown
# {title}

> 来源: [{source_url}]({source_url})
> 收集时间: {created}
> ID: {id}

## 推荐理由

{recommend}

## 摘要

{summary}

## 详细摘要

{digest}
```

选择仅导出摘要层而非全文：

- 摘要层信息密度更高，更利于向量检索命中
- 全文可能很长，chunk 后噪声多
- 需要全文时可通过 `knowledge_get(id)` 按需获取

### 4.3 后台服务注册

复用 OpenClaw 插件 API 的 `api.registerService()` 模式：

- **start**：立即全量同步 → 启动 `setInterval`（默认 10 分钟）
- **stop**：`clearInterval` 清理

工具钩子：`knowledge_collect` 和 `knowledge_delete` 的 `execute` 成功后 fire-and-forget 调用 `runMemorySync()`，不阻塞工具返回。

### 4.4 OpenClaw 配置

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["d:\\github\\my\\js-knowledge-collector\\work_dir\\memory-export"],
      },
    },
  },
  plugins: {
    load: {
      paths: [
        // ... 其他插件,
        "d:\\github\\my\\js-knowledge-collector\\openclaw-plugin",
      ],
    },
  },
}
```

---

## 五、执行结果

首次全量同步成功：

```
{
  "synced": 1280,
  "deleted": 0,
  "total": 1280
}
```

1280 篇文章全部导出为独立的 Markdown 文件，覆盖微信公众号（900）、GitHub（189）、知乎（155）、X.com（10）、即刻（7）、Reddit（4）、YouTube（2）、Bilibili（1）等平台来源。

---

## 六、后续方向

| 优先级 | 方向                         | 说明                                   |
| ------ | ---------------------------- | -------------------------------------- |
| 已完成 | P0 extraPaths 桥接           | 1280 篇文章已可通过 memory_search 检索 |
| P1     | message_received 自动入队    | 去掉手动收集的摩擦                     |
| P2     | 统一 memory_search           | 合并记忆+知识库检索结果                |
| P3     | before_prompt_build 知识注入 | 被动检索→主动推送                      |
| P4     | 自定义 Context Engine        | 最强大但复杂度高                       |

---

## 七、关键认知

1. **OpenClaw 的 extraPaths 是最低成本的集成点**：只需输出 Markdown 文件到一个目录，配置一行 extraPaths，就能让任意外部知识源接入 memory_search 的向量检索能力。

2. **增量同步比全量导出重要**：1280 篇文章全量同步仅需约 1 秒，但随着知识库增长，增量检测（基于 updated 时间戳对比）可以避免不必要的文件 I/O 和 embedding 重建。

3. **摘要层优于全文**：对于 memory_search 的 chunk 粒度（~400 tokens），一篇文章的摘要（标题+推荐理由+摘要+详细摘要）通常正好是 1-3 个 chunk，信息密度远高于全文。

4. **fire-and-forget 是正确的钩子策略**：`knowledge_collect` 成功后触发同步但不 await，避免阻塞工具返回。同步失败不影响收集功能本身。
