# OpenClaw 核心概念：Q&A 与场景用法

> 文档日期：2026-02-13

> 本文档整理自对 `openclaw-core-concepts-pyramid.md` 的延伸研究，涵盖具体场景用法、概念澄清、子 Agent 机制、对话可配置内容及独立 Agent 创建限制。

---

## 1. 具体场景用法

基于 **Channel → Account → Agent → Workspace + Session** 五层架构，可组合出多种实际用法。

### 1.1 按「身份/用途」拆分 Agent

| 场景             | 配置思路                                              | 典型用途                                     |
| ---------------- | ----------------------------------------------------- | -------------------------------------------- |
| **个人 vs 工作** | WhatsApp 个人号 → `home` Agent；工作号 → `work` Agent | 个人闲聊、日程提醒 vs 工作待办、会议安排     |
| **客服 vs 内部** | 同一 Telegram，不同 Bot Token → 不同 Agent            | 对外客服 Bot vs 内部协作 Bot                 |
| **多品牌**       | 同一平台多个账号 → 不同 Agent、不同 Workspace         | 品牌 A 客服、品牌 B 客服，人设和记忆互不干扰 |

### 1.2 按「平台特性」选通道

| 场景             | 配置思路                                             | 典型用途                               |
| ---------------- | ---------------------------------------------------- | -------------------------------------- |
| **日常 vs 深度** | WhatsApp → 日常聊天；Telegram → 长文、代码、深度协作 | 快速回复 vs 需要上下文和工具调用的任务 |
| **私密 vs 公开** | Signal/WhatsApp DM → 私密；Discord 群 → 公开         | 敏感信息 vs 团队讨论                   |
| **即时 vs 异步** | Slack 工作区 → 工作流；Webchat → 临时会话            | 持续协作 vs 一次性咨询                 |

### 1.3 按「联系人」路由 Agent

| 场景         | 配置思路                            | 典型用途                                    |
| ------------ | ----------------------------------- | ------------------------------------------- |
| **VIP 专属** | 指定手机号/群 ID → 专属 Agent       | 重要客户、家人、核心团队有单独人设和记忆    |
| **群组分流** | 不同群 ID → 不同 Agent              | 产品群、技术群、闲聊群用不同策略            |
| **多租户**   | 每个客户/团队一个 peer → 一个 Agent | B2B 场景下，每个客户有独立 Workspace 和记忆 |

### 1.4 Session 隔离与安全

| 场景         | 配置思路                            | 典型用途                                               |
| ------------ | ----------------------------------- | ------------------------------------------------------ |
| **单人使用** | `dmScope: main`                     | 所有 DM 共享一个会话，简单                             |
| **多人 DM**  | `dmScope: per-channel-peer`         | 每个联系人独立会话，避免 A 和 B 的对话混在一起         |
| **多账户**   | `dmScope: per-account-channel-peer` | 同一平台多个账号时，按「账户 + 通道 + 联系人」完全隔离 |

### 1.5 Workspace 的用途划分

| 场景         | 配置思路                                 | 典型用途                                     |
| ------------ | ---------------------------------------- | -------------------------------------------- |
| **人设分离** | 不同 Agent → 不同 `SOUL.md`、`AGENTS.md` | 严肃工作助手 vs 轻松聊天伙伴                 |
| **技能隔离** | 不同 Workspace 的 `skills/`              | 客服 Agent 有工单技能，技术 Agent 有代码技能 |
| **记忆隔离** | 不同 Workspace 的 `MEMORY.md`、`memory/` | 个人记忆 vs 工作记忆 vs 客户记忆互不干扰     |

### 1.6 综合编排示例

- **家庭助理**：WhatsApp 家庭群 → `family` Agent；个人 DM → `personal` Agent；同一 Gateway，不同 Workspace 和 Session，互不干扰。
- **创业团队**：Slack 工作区 → `work` Agent；Discord 社区 → `community` Agent；创始人 DM → `founder` Agent。
- **多语言客服**：按群/频道路由到不同 Agent；每个 Agent 的 `SOUL.md` 指定语言和语气；共享 `~/.openclaw/skills` 的工单技能，Workspace 各自独立。
- **个人知识库**：Telegram 作为主入口；Workspace 放 `MEMORY.md`、`memory/`、笔记；通过 memory 工具做长期记忆和检索。

### 1.7 设计时的决策顺序

1. **Channel**：消息从哪来、回哪去
2. **Account**：同一平台是否要多个账号、多身份
3. **Agent**：需要几种「大脑」、各自职责
4. **Bindings**：谁（通道/账户/联系人）对应哪个 Agent
5. **Session**：DM 要不要按人/按群隔离
6. **Workspace**：每个 Agent 的人设、技能、记忆放在哪

---

## 2. 长期记忆在哪一层

**长期记忆在 Workspace 层**，不是独立层级，而是 Workspace 的一部分。

### 2.1 所在层级

```
Agent（大脑）
├── Workspace（工作区）  ← 长期记忆在这里
│   ├── MEMORY.md        # 长期记忆
│   └── memory/          # 按日记忆 YYYY-MM-DD.md
├── AgentDir
└── Sessions
```

### 2.2 层级关系

| 概念          | 说明                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| **Workspace** | Agent 的工作目录，包含人设、技能、**长期记忆**                                 |
| **Session**   | 单次对话的上下文（历史、token 等），是短期上下文                               |
| **Context**   | 模型单次推理时看到的内容（系统提示 + 历史 + 工具结果），受 context window 限制 |

**结论**：长期记忆在 Workspace 层，属于 Agent 的持久化存储，与 Session 的短期对话上下文分开。

---

## 3. agentDir 是什么

**agentDir** 是 Agent 的**私有配置目录**，存放认证、模型等运行配置，与用户可编辑的人设、记忆、技能分离。

### 3.1 路径与内容

| 项目         | 说明                                       |
| ------------ | ------------------------------------------ |
| **默认路径** | `~/.openclaw/agents/<agentId>/agent/`      |
| **主要内容** | auth-profiles、模型配置                    |
| **配置项**   | `agents.list[].agentDir`（可覆盖默认路径） |

### 3.2 与 Workspace 的区别

| 目录          | 位置                                  | 内容                                                      |
| ------------- | ------------------------------------- | --------------------------------------------------------- |
| **agentDir**  | `~/.openclaw/agents/<agentId>/agent/` | auth-profiles、模型配置等运行配置                         |
| **Workspace** | 用户指定路径                          | AGENTS.md、SOUL.md、MEMORY.md、skills/ 等人设、记忆、技能 |

### 3.3 使用注意

- **切勿**在多个 Agent 之间复用同一个 agentDir，否则会导致 auth/session 冲突。
- 如需共享凭证，应手动复制 `auth-profiles.json`，而不是共享 agentDir。

---

## 4. 子 Agent 是什么

**子 Agent（Sub-agent）** 是由主 Agent 在运行中**动态派生的后台任务**，在独立 Session 中执行，完成后通过 **announce** 把结果发回主会话。

### 4.1 核心特性

| 特性             | 说明                                                        |
| ---------------- | ----------------------------------------------------------- |
| **触发方式**     | 主 Agent 调用 `sessions_spawn` 工具                         |
| **Session 形式** | `agent:<agentId>:subagent:<uuid>`，与主会话隔离             |
| **执行模式**     | 后台、非阻塞，主 Agent 立即得到 `accepted` 并继续运行       |
| **结果回传**     | 子 Agent 完成后执行 announce 步骤，把结果发回主会话所在通道 |

### 4.2 设计目的

1. **并行处理**：研究、长任务、慢工具等不阻塞主 Agent
2. **隔离**：独立 Session，可选沙箱，降低风险
3. **工具限制**：默认不提供 session 类工具（`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`）
4. **避免嵌套**：子 Agent 不能再 spawn 子 Agent

### 4.3 与主 Agent 的区别

| 项目      | 主 Agent                          | 子 Agent                           |
| --------- | --------------------------------- | ---------------------------------- |
| Session   | `agent:home:whatsapp:dm:+1...` 等 | `agent:home:subagent:<uuid>`       |
| 系统提示  | 完整（SOUL、IDENTITY、USER 等）   | 精简（仅 AGENTS.md + TOOLS.md）    |
| 队列 Lane | `main`                            | `subagent`                         |
| 生命周期  | 用户对话驱动                      | 任务完成后自动归档（默认 60 分钟） |

### 4.4 在架构中的位置

子 Agent 不是新的 Agent 定义，而是**同一 Agent 的衍生运行实例**：

- 共用同一个 Agent 的 Workspace 和 agentDir
- 共享同一套 auth 配置（主 Agent 的 auth 会合并进来）
- 在独立 Session 中运行，与主会话隔离
- 通过 `CommandLane.Subagent` 排队，受 `maxConcurrent` 限制

---

## 5. 怎么在 Agent 里创建子 Agent

主 Agent 通过调用 **`sessions_spawn`** 工具来创建子 Agent，无需额外「创建」步骤。

### 5.1 基本用法

主 Agent 在对话中调用 `sessions_spawn`，传入任务描述和可选参数：

| 参数                | 必填 | 说明                                       |
| ------------------- | ---- | ------------------------------------------ |
| `task`              | ✅   | 子 Agent 要完成的任务描述                  |
| `label`             | ❌   | 任务标签，便于区分                         |
| `agentId`           | ❌   | 指定用哪个 Agent 执行（需在 allowlist 中） |
| `model`             | ❌   | 子 Agent 使用的模型                        |
| `thinking`          | ❌   | 思考模式                                   |
| `runTimeoutSeconds` | ❌   | 超时秒数，0 表示不限制                     |
| `cleanup`           | ❌   | `keep`（默认）或 `delete`                  |

### 5.2 流程概览

1. 主 Agent 收到用户请求，判断适合交给子 Agent 处理
2. 主 Agent 调用 `sessions_spawn`，传入 `task` 等参数
3. 系统立即返回 `{ status: "accepted", runId, childSessionKey }`，主 Agent 不等待
4. 子 Agent 在后台执行任务
5. 子 Agent 完成后执行 announce，把结果发回主会话所在通道
6. 主 Agent 和用户在主会话中看到子 Agent 的完成结果

### 5.3 配置要求

1. **允许 spawn 的 Agent**：`agents.list[].subagents.allowAgents`（默认只允许当前 Agent）
2. **工具策略**：`sessions_spawn` 默认在主 Agent 中可用，子 Agent 默认不提供 session 类工具
3. **并发**：`agents.defaults.subagents.maxConcurrent`（默认 8）

### 5.4 管理子 Agent

在主会话中使用 `/subagents` 命令：

- `/subagents list`：查看当前会话派出的子 Agent
- `/subagents stop <id|#|all>`：停止指定或全部子 Agent
- `/subagents log <id|#>`：查看子 Agent 日志
- `/subagents info <id|#>`：查看子 Agent 元信息
- `/subagents send <id|#> <message>`：向子 Agent 发送消息

---

## 6. 一个 Agent 可以通过对话来设置它哪些内容？

Agent 具备 `read`、`write`、`edit` 工具，默认 cwd 为 Workspace，因此可通过对话修改以下内容。

### 6.1 Workspace 人设与规则（可读写）

| 文件             | 作用                                | 对话示例                                         |
| ---------------- | ----------------------------------- | ------------------------------------------------ |
| **AGENTS.md**    | 操作指令、规则、优先级              | 「以后回答要更简洁」「把这条规则加进 AGENTS.md」 |
| **SOUL.md**      | 人设、语气、边界                    | 「你说话风格再轻松一点」「改成专业客服口吻」     |
| **USER.md**      | 用户信息、称呼方式                  | 「我叫小明，叫我小明就行」「记一下我的偏好」     |
| **IDENTITY.md**  | Agent 名称、风格、emoji             | 「把你的名字改成小助手」「换一个 emoji」         |
| **TOOLS.md**     | 工具使用说明（用户给 Agent 的指引） | 「在 TOOLS.md 里写一下怎么用 exec」              |
| **HEARTBEAT.md** | 心跳检查清单                        | 「每天提醒我喝水」                               |
| **BOOTSTRAP.md** | 首次运行仪式                        | 首次对话时由 Agent 引导完成，之后可删除          |

### 6.2 记忆（可读写）

| 文件/目录                | 作用     | 对话示例                                              |
| ------------------------ | -------- | ----------------------------------------------------- |
| **MEMORY.md**            | 长期记忆 | 「记住我喜欢喝美式」「把这件事记到长期记忆里」        |
| **memory/YYYY-MM-DD.md** | 按日记忆 | 「今天做了什么记一下」「把今天的会议要点写进 memory」 |

文档说明：_"If you want something to stick, ask the bot to write it into memory."_  
接近 compaction 时，系统会触发 memory flush，提醒 Agent 把重要内容写入记忆。

### 6.3 其他 Workspace 内容

- **skills/**：Workspace 专属技能
- **canvas/**：Canvas UI 资源
- 任意 Workspace 下的文件（Agent 的 cwd 内）

### 6.4 全局配置（需用户明确请求）

通过 `gateway` 工具的 `config.apply` / `config.patch` 可修改 `~/.openclaw/openclaw.json`（模型、通道、Agent 列表等）。  
系统提示要求：**只有在用户明确要求更新或改配置时才执行**，否则先询问。

### 6.5 限制条件

| 情况                                | 影响                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| **沙箱模式**                        | `write`、`edit` 被移除，无法修改 Workspace 文件                                      |
| **workspaceAccess: "ro" 或 "none"** | 无法写入，memory flush 会跳过                                                        |
| **子 Agent**                        | 只注入 AGENTS.md + TOOLS.md，不注入 SOUL、IDENTITY、USER 等，且默认没有 session 工具 |
| **config.apply / update.run**       | 需用户明确请求，Agent 不能主动执行                                                   |

---

## 7. 在一个 Agent 里能创建另一个独立的 Agent 吗？

**不能**。Agent 无法创建另一个**完全独立**的 Agent。

### 7.1 子 Agent ≠ 独立 Agent

通过 `sessions_spawn` 创建的是**子 Agent**，不是新 Agent：

| 项目      | 子 Agent                  | 独立 Agent                                |
| --------- | ------------------------- | ----------------------------------------- |
| 定义      | 同一 Agent 的衍生运行实例 | 新的 Agent 配置（agents.list 中的新条目） |
| Workspace | 共用主 Agent 的 Workspace | 自己的 Workspace                          |
| agentDir  | 共用主 Agent 的 agentDir  | 自己的 agentDir                           |
| 配置      | 不新增配置                | 需要写入 `agents.list`                    |

子 Agent 只是「后台任务实例」，不是新的 Agent 定义。

### 7.2 Agent 的工具能力

Agent 的 `gateway` 工具仅支持：`config.get`、`config.schema`、`config.apply`、`config.patch`、`update.run`、`restart`。  
**没有**暴露 `agents.create` 或 `agents.update` 等 RPC。

### 7.3 用 config.patch 能「创建」吗？

理论上可以：`config.get` 获取配置 → `config.patch` 往 `agents.list` 里加一条新 Agent。  
但 `config.patch` 只改 JSON，**不会**创建 Workspace 目录、生成 bootstrap 文件、创建 `~/.openclaw/agents/<agentId>/` 等。结果是配置里有新 Agent，但缺文件、缺目录，无法正常使用。

### 7.4 正确创建独立 Agent 的方式

需要调用 `agents.create` RPC 或使用 CLI，例如：

```bash
openclaw agents register --name "新Agent名" --workspace /path/to/workspace
```

这些能力**没有**暴露给 Agent 的工具。

### 7.5 总结

| 问题                      | 答案                                                        |
| ------------------------- | ----------------------------------------------------------- |
| 能创建子 Agent 吗？       | ✅ 能，用 `sessions_spawn`，但它是同一 Agent 的衍生实例     |
| 能创建新的独立 Agent 吗？ | ❌ 不能，Agent 没有对应工具，只能由用户通过 CLI 或 RPC 创建 |

---

## 附录：相关文档

- `openclaw-core-concepts-pyramid.md`：五层架构与概念详解
- `docs/tools/subagents.md`：子 Agent 完整文档（英文）
