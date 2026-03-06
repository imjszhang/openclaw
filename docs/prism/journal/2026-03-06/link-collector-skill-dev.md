# link-collector 技能开发记录

> 日期：2026-03-06  
> 涉及仓库：`openclaw`、`js-knowledge-collector`、`workspace-xiaofei`

---

## 背景与需求

用户希望为 openclaw agent（小飞）创建一个技能，实现：

1. **链接收集**：将用户在对话中发送的所有链接收集/排重后存入队列文件
2. **定时入库**：通过 openclaw cron 定时任务，批量调用 `js-knowledge-collector` 插件的 `knowledge_collect` 工具将链接入库到知识库
3. **容错与异步**：单条失败不中断整体、支持重试、处理中崩溃可恢复
4. **并发安全**：新链接入队和定时处理互不冲突、串行执行、避免重复处理
5. **队列管理**：不在执行中时，支持用户查看、修改、删除队列中的链接

---

## 阶段一：在 workspace 中创建独立技能

### 设计决策

经过多轮讨论，确定以下设计方案：

| 决策点    | 结论                                     | 理由                                                              |
| --------- | ---------------------------------------- | ----------------------------------------------------------------- |
| 数据格式  | JSONL（每行一个 JSON 对象）              | 追加写入不需要读整个文件、单行损坏不影响其他记录                  |
| 并发模型  | inbox/batch 轮转机制                     | 收集侧只写 inbox，处理侧 rename 为 batch 后操作，文件层面完全隔离 |
| Cron 频率 | 每 30 分钟                               | 配合 `maxConcurrentRuns: 1`，上一轮未完成时自动跳过               |
| 入库时机  | 默认排队，支持即时入库                   | `knowledge_collect` 每条耗时 10-30 秒，排队不阻塞对话             |
| 标签策略  | 用户手动优先，未指定时 AI 推断           | 零摩擦使用 + 保留精确控制                                         |
| 排重策略  | inbox 内排重 + `knowledge_search` 查 URL | 不维护本地索引，避免同步问题                                      |
| 最大重试  | 3 次                                     | 区分暂时性失败和持久性失败                                        |

### 并发安全模型

```
收集侧（主会话）          处理侧（cron 隔离会话）
      │                         │
      ▼                         │
 inbox.jsonl ← 永远只追加      │
      │                         │
      │         ┌── cron 触发 ──┘
      │         ▼
      │    1. rename inbox.jsonl → batch-{timestamp}.jsonl
      │    2. 创建新空 inbox.jsonl
      │         │
      ▼         ▼
 新 inbox.jsonl    batch-{timestamp}.jsonl
 (新链接写这里)     (串行处理这个文件)
                    │
                    ├─ 成功 → done
                    ├─ 失败且可重试 → 写回 inbox.jsonl
                    └─ 处理完毕 → 归档 batch 文件
```

### 实施内容

在 `d:\.openclaw\workspace-xiaofei\` 下创建：

```
skills/link-collector/
├── SKILL.md                # 技能文档（6 个章节）
├── data/
│   ├── inbox.jsonl         # 收集队列
│   └── archive/            # 已处理批次归档
└── references/
    └── link-format.md      # JSONL 字段与状态说明
```

SKILL.md 包含完整的 Agent 行为指令：

- 收集流程（提取 URL → 排重 → 入队）
- 即时入库通道
- 队列管理（查看/修改/删除/调序/清空/查状态）
- 定时入库流程（轮转 → 串行处理 → 归档）
- 容错与边界处理
- 并发安全说明

同时更新了 `TOOLS.md` 添加技能说明，并通过 CLI 创建了 cron 定时任务。

---

## 阶段二：整合到 js-knowledge-collector 插件

### 动机

将技能从 workspace 迁移到插件中，使其随 `js-knowledge-collector` 插件安装时自动部署，无需手动复制到每个 workspace。

### 关键机制

openclaw 插件通过 `openclaw.plugin.json` 中的 `"skills": ["./skills"]` 字段声明技能目录。插件启用后，其 `skills/` 下的技能会被自动发现和加载。

### 核心问题：技能文件 vs 运行时数据

- **技能文件**（SKILL.md + references/）：随插件走，只读，所有 workspace 共享
- **运行时数据**（inbox.jsonl、batch、archive）：留在 workspace，各 workspace 独立

数据路径从技能目录相对路径 `data/inbox.jsonl` 改为 workspace 相对路径 `.openclaw/link-collector/inbox.jsonl`。

### Cron 任务注册

选择 CLI 子命令方式（`openclaw knowledge setup-collector`）而非自动注册，理由：

- cron 每次触发消耗 API token，应由用户显式决定
- CLI 成本极低（一条命令），但给了用户完整控制权
- 支持自定义频率和移除

### 实施内容

#### 插件侧变更（`js-knowledge-collector/openclaw-plugin/`）

1. **`openclaw.plugin.json`**：添加 `"skills": ["./skills"]`

2. **新增 `skills/link-collector/SKILL.md`**：从 workspace 迁入，所有数据路径改为 `.openclaw/link-collector/`（workspace 相对路径），新增 cron 配置说明章节

3. **新增 `skills/link-collector/references/link-format.md`**：同步适配路径

4. **`index.mjs`**：在 `knowledge` CLI 命令组下添加 `setup-collector` 子命令
   - `openclaw knowledge setup-collector` — 创建 cron 任务（默认每 30 分钟）
   - `openclaw knowledge setup-collector --every 15` — 自定义频率
   - `openclaw knowledge setup-collector --remove` — 移除 cron 任务
   - 实现方式：通过 `child_process.execFileSync` 调用 `openclaw cron add/rm`
   - 已验证幂等性：重复执行不会创建重复任务

#### Workspace 侧变更（`workspace-xiaofei/`）

1. 删除 `skills/link-collector/` 目录（避免 workspace 版本覆盖插件版本）
2. 创建 `.openclaw/link-collector/` 数据目录（含 `inbox.jsonl` 和 `archive/`）
3. 精简 `TOOLS.md`，移除手动添加的 link-collector 章节
4. 删除旧 cron 任务，通过新 CLI 子命令重新创建

---

## 最终文件结构

### 插件侧

```
js-knowledge-collector/openclaw-plugin/
├── index.mjs                    # 添加了 setup-collector CLI 子命令
├── package.json                 # 未变
├── openclaw.plugin.json         # 添加了 "skills": ["./skills"]
└── skills/
    └── link-collector/
        ├── SKILL.md             # 技能行为指令（6 章节 + cron 说明）
        └── references/
            └── link-format.md   # JSONL 数据格式参考
```

### Workspace 侧

```
workspace-xiaofei/
├── .openclaw/
│   ├── workspace-state.json
│   └── link-collector/          # 运行时数据（由插件技能使用）
│       ├── inbox.jsonl
│       ├── batch-*.jsonl        # 处理中（临时）
│       └── archive/             # 已处理批次归档
├── skills/
│   └── comfyui-client/          # 其他技能不受影响
└── ...
```

---

## 状态流转

```
              ┌──────────────────────────────────┐
              │                                  │
              ▼                                  │
[用户发链接] → pending ──→ processing ──→ done   │
              │              │                   │
              │              │ 失败且 retries<3  │
              │              ├──────────→ failed ─┘
              │              │
              │              │ 失败且 retries>=3
              │              └──────────→ permanently_failed
              │
              │ knowledge_search 发现已入库
              └──────────────────────→ skipped
```

---

## CLI 命令速查

```bash
# 配置定时任务
openclaw knowledge setup-collector              # 默认每 30 分钟
openclaw knowledge setup-collector --every 15   # 每 15 分钟
openclaw knowledge setup-collector --tz UTC     # 自定义时区
openclaw knowledge setup-collector --remove     # 移除定时任务

# 手动管理 cron（备用）
openclaw cron list                              # 查看所有定时任务
openclaw cron run <job-id> --force              # 手动触发一次
openclaw cron status                            # 调度器状态
```
