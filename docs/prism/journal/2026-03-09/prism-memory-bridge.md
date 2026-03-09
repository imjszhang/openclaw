# Knowledge Prism 桥接 OpenClaw 记忆系统：设计与实现

> 文档日期：2026-03-09
>
> 项目：[js-knowledge-prism](d:\github\my\js-knowledge-prism)
>
> 覆盖范围：Prism 知识库桥接 OpenClaw 记忆系统的分析、设计、实现与配置
>
> 前序：[knowledge-memory-bridge.md](knowledge-memory-bridge.md)（js-knowledge-collector 桥接）

---

## 一、背景与动机

在前序工作中，我们已将 `js-knowledge-collector`（SQLite 知识库）桥接到 OpenClaw 的 `memory_search`。
现在用类似策略优化 `js-knowledge-prism`——一个基于金字塔原理的知识蒸馏工具。

### 与 collector 的关键差异

| 维度     | knowledge-collector   | knowledge-prism                   |
| -------- | --------------------- | --------------------------------- |
| 数据源   | 单个 SQLite DB        | 多个注册的 Markdown 知识库        |
| 同步方式 | 读 DB + 生成 Markdown | 读文件 mtime + 复制源 Markdown    |
| 内容筛选 | 导出摘要层            | 筛选 groups + synthesis + CONTEXT |
| 命名策略 | `article-{id}.md`     | `{kb-slug}-{filename}.md`         |
| 多源处理 | 单源                  | 遍历 registry.json                |

### 核心挑战

1. **多知识库**：通过 `registry.json` 管理多个注册的知识库，每个有独立的 `baseDir`
2. **层次筛选**：不是所有层都适合向量检索，需要选择高价值层
3. **无需格式转换**：源文件本身就是 Markdown，可直接复制

---

## 二、高价值内容筛选策略

Prism 的金字塔结构有多个层次，但并非所有层都适合送入向量检索：

| 层次       | 路径                             | 是否汇聚 | 理由                              |
| ---------- | -------------------------------- | -------- | --------------------------------- |
| groups     | `pyramid/analysis/groups/G*.md`  | **是**   | 观点句 + atoms 列表，信息密度最高 |
| synthesis  | `pyramid/analysis/synthesis.md`  | **是**   | 顶层观点全景，全局概览            |
| CONTEXT.md | `pyramid/structure/*/CONTEXT.md` | **是**   | SCQA 摘要 + Key Lines，结构化洞察 |
| SKILL.md   | 根目录 `SKILL.md`                | **是**   | 知识地图总览                      |
| journal    | `journal/**`                     | 否       | 原始笔记，噪声大                  |
| atoms      | `pyramid/analysis/atoms/**`      | 否       | 表格格式，chunk 后结构被破坏      |
| outputs    | `outputs/**`                     | 否       | 长文产出，信息密度低于 groups     |
| INDEX.md   | `groups/INDEX.md`                | 否       | 纯目录索引                        |

**筛选原则**：只要"信息密度高 + chunk 友好"的层次。Groups 是最有价值的——每个 group 文件包含一个凝练的观点句和支撑它的 atoms 列表，平均 1-5KB，正好在 embedding chunk 最佳范围。

---

## 三、数据流设计

```
registry.json (多个知识库)
    ↓ 遍历 enabled=true 的知识库
每个知识库 baseDir
    ↓ 收集 groups/*.md + synthesis.md + */CONTEXT.md + SKILL.md
    ↓ mtime 增量检测 (vs .sync-state.json)
    ↓ 复制到统一导出目录 (前缀命名: {kb-slug}-{filename}.md)
统一导出目录
    ↓ memorySearch.extraPaths 配置指向此目录
OpenClaw memory_search 可跨库语义检索
```

文件命名示例（知识库名 "OpenClaw 个人实践知识库" → slug "openclaw-个人实践知识库"）：

- `openclaw-个人实践知识库-G01-time-vs-logic-organization.md`
- `openclaw-个人实践知识库-synthesis.md`
- `openclaw-个人实践知识库-P01-knowledge-org-methodology-context.md`
- `openclaw-个人实践知识库-SKILL.md`

---

## 四、改动范围与实现

全部在 `d:\github\my\js-knowledge-prism` 内，不改 OpenClaw 核心。

### 4.1 新增：`lib/memory-sync.mjs`

核心同步模块，纯同步函数（无需 async，全是文件操作）：

```javascript
export function syncPrismToMemory({ registryPath, outputDir, force = false })
// => { synced, skipped, deleted, total }
```

职责：

- **读取注册表**：解析 `registry.json` 获取所有 `enabled` 的知识库
- **遍历各知识库**：对每个 baseDir 收集 4 类高价值文件
- **增量检测**：基于源文件 `mtime` 对比（`.sync-state.json` 结构：`{ files: { "destName": { mtime, srcPath } } }`）
- **前缀命名**：`{kb-slug}-{原文件名}.md`，CONTEXT.md 用 `{kb-slug}-{perspective-slug}-context.md`
- **清理**：导出目录中属于已注销知识库的文件自动删除

`slugify()` 函数保留中文字符（`\u4e00-\u9fff`），确保中文知识库名生成可读的前缀。

### 4.2 修改：`openclaw-plugin/openclaw.plugin.json`

新增 3 个配置项：

| 配置项                      | 类型    | 默认值                           | 说明                         |
| --------------------------- | ------- | -------------------------------- | ---------------------------- |
| `memorySyncEnabled`         | boolean | `true`                           | 是否启用记忆同步             |
| `memorySyncDir`             | string  | 空 (→ `work_dir/memory-export/`) | 导出目录路径                 |
| `memorySyncIntervalMinutes` | number  | `15`                             | 定时同步间隔（0=仅事件触发） |

配套 `uiHints` 提供 label、help、placeholder、advanced 标记。

### 4.3 修改：`openclaw-plugin/index.mjs`

三部分改动：

#### (a) 后台服务 `prism-memory-sync`

```javascript
api.registerService({
  id: "prism-memory-sync",
  start(ctx) {
    /* 全量同步 → setInterval 增量 */
  },
  stop(ctx) {
    /* clearInterval */
  },
});
```

共享 `runPrismMemorySync({ force, logger })` 辅助函数，供服务、工具钩子、CLI 复用。

#### (b) 工具钩子

在以下工具的 `execute` 成功后触发增量同步（fire-and-forget）：

| 工具                          | 触发理由                              |
| ----------------------------- | ------------------------------------- |
| `knowledge_prism_process`     | 生成新的 groups/synthesis             |
| `knowledge_prism_register`    | 知识库列表变化（注册 + 更新两个分支） |
| `knowledge_prism_unregister`  | 知识库列表变化                        |
| `knowledge_prism_agent_index` | CONTEXT.md / SKILL.md 更新            |
| `knowledge_prism_process_all` | 批量处理完成后                        |

#### (c) CLI 命令 `openclaw prism sync`

```bash
openclaw prism sync          # 增量同步
openclaw prism sync --force  # 全量重新导出
openclaw prism sync --dir /custom/path  # 自定义导出目录
```

### 4.4 配置：`~/.openclaw/openclaw.json`

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "extraPaths": [
          "d:\\github\\my\\js-knowledge-collector\\work_dir\\memory-export",
          "d:\\github\\my\\js-knowledge-prism\\work_dir\\memory-export"
        ]
      }
    }
  },
  "plugins": {
    "load": {
      "paths": [
        "...",
        "d:\\github\\my\\js-knowledge-collector\\openclaw-plugin",
        "d:\\github\\my\\js-knowledge-prism\\openclaw-plugin"
      ]
    }
  }
}
```

两个知识插件共享同一个 `extraPaths` 数组，OpenClaw 的 `memory_search` 会同时检索两个导出目录。

---

## 五、执行结果

首次全量同步（`force: true`）：

```json
{
  "synced": 73,
  "skipped": 0,
  "deleted": 0,
  "total": 73
}
```

73 个文件来自 "OpenClaw 个人实践知识库"：

- **40+ group 文件**：G01 ~ G40+，涵盖知识组织方法论、安全加固、部署策略、插件生命周期等主题
- **1 个 synthesis.md**：全局观点全景
- **25+ CONTEXT.md**：每个视角（P01 ~ P25）的 SCQA 结构化摘要
- **1 个 SKILL.md**：知识地图总览

---

## 六、与 collector 桥接的协同效果

配置完成后，`memory_search` 现在可以同时检索：

| 来源                   | 文件数 | 内容类型                               |
| ---------------------- | ------ | -------------------------------------- |
| js-knowledge-collector | 1280   | 公众号/GitHub/知乎等文章摘要           |
| js-knowledge-prism     | 73     | 结构化知识（groups/synthesis/CONTEXT） |
| OpenClaw 原生记忆      | —      | MEMORY.md + 每日记忆                   |

三个来源的内容互补：

- **collector** 提供广度——1280 篇外部文章的核心要点
- **prism** 提供深度——从笔记中蒸馏出的结构化洞察
- **原生记忆** 提供个人化——会话中的关键决策和偏好

---

## 七、关键认知

1. **Prism 比 Collector 更适合 memory_search**：源文件本身就是 Markdown，无需格式转换，只需复制。且 groups 文件的信息密度极高——每个文件 1-5KB，完美匹配 embedding chunk 大小。

2. **多知识库 = 多源检索**：通过 registry.json 遍历所有知识库，用 `{kb-slug}-` 前缀避免跨库文件名冲突，导出到单一目录即可让 OpenClaw 统一检索。

3. **mtime 增量优于 content hash**：对于纯文件复制场景，文件系统 mtime 比计算 content hash 更高效。73 个文件的全量同步仅需约 0.6 秒，增量（无变更时）几乎瞬时。

4. **层次筛选是价值放大器**：如果把 Prism 的全部文件（journal、atoms、outputs 等）都导出，会有数百个低信息密度文件稀释检索质量。只导出 groups + synthesis + CONTEXT + SKILL 四类，文件数降低 80%+，但覆盖了知识体系的核心框架。

5. **两个插件的 extraPaths 共存**：`extraPaths` 是数组，多个目录互不干扰。OpenClaw 的向量索引会分别处理每个目录中的 Markdown 文件。
