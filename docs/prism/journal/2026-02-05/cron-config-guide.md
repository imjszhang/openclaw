# OpenClaw Cron 任务配置指南

> 编写日期：2026-02-05  
> 本文档详细解释 OpenClaw 的 cron 定时任务系统的各种配置选项

---

## 目录

1. [什么是 Cron](#1-什么是-cron)
2. [核心概念一览](#2-核心概念一览)
3. [Session Target（会话目标）](#3-session-target会话目标)
4. [Payload Kind（负载类型）](#4-payload-kind负载类型)
5. [Wake Mode（唤醒模式）](#5-wake-mode唤醒模式)
6. [Schedule（调度计划）](#6-schedule调度计划)
7. [Delivery（消息投递）](#7-delivery消息投递)
8. [常见配置组合](#8-常见配置组合)
9. [故障排查](#9-故障排查)
10. [CLI 命令速查](#10-cli-命令速查)
11. [心跳机制（Heartbeat）](#11-心跳机制heartbeat)
12. [Cron vs Heartbeat 如何选择](#12-cron-vs-heartbeat-如何选择)

---

## 1. 什么是 Cron

OpenClaw 的 Cron 是 Gateway 内置的定时任务调度器。它可以：

- 定时执行任务（每 5 分钟、每天早上 8 点等）
- 设置一次性提醒（20 分钟后提醒我）
- 让 Agent 执行特定命令并将结果发送到聊天渠道

**重要**：OpenClaw 的 cron 运行在 Gateway 进程内部，与系统的 `crontab` 是完全独立的。

---

## 2. 核心概念一览

一个 cron 任务由以下几个关键配置决定其行为：

| 配置项            | 可选值                      | 作用                             |
| ----------------- | --------------------------- | -------------------------------- |
| **sessionTarget** | `main` / `isolated`         | 任务在哪个会话中运行             |
| **payload.kind**  | `systemEvent` / `agentTurn` | 任务做什么（发消息 vs 执行命令） |
| **wakeMode**      | `now` / `next-heartbeat`    | 何时触发任务                     |
| **schedule**      | `at` / `every` / `cron`     | 何时运行                         |
| **delivery**      | `announce` / `none`         | 是否投递结果到聊天               |

---

## 3. Session Target（会话目标）

**Session Target** 决定任务在哪个"会话空间"中运行。

### 3.1 `main`（主会话）

```
sessionTarget: "main"
```

- 任务在 Agent 的**主会话**中运行
- 与你日常对话的会话共享上下文
- 适合需要访问对话历史的任务
- **必须**搭配 `payload.kind: "systemEvent"`

**典型用途**：

- 提醒你做某事（Agent 会在主会话中看到提醒）
- 需要基于之前对话内容的任务

### 3.2 `isolated`（隔离会话）

```
sessionTarget: "isolated"
```

- 任务在**独立的临时会话**中运行，会话 ID 为 `cron:<jobId>`
- 每次运行都是全新会话，不继承历史
- 不会污染主会话的对话记录
- **必须**搭配 `payload.kind: "agentTurn"`
- 可以配置 `delivery` 将结果发送到指定渠道

**典型用途**：

- 后台任务（检查邮件、发帖、同步数据）
- 定时报告（每日总结、状态汇报）
- 需要实际执行命令的自动化任务

### 3.3 选择哪个？

| 场景                 | 推荐 Session Target |
| -------------------- | ------------------- |
| 简单提醒/备忘        | `main`              |
| 需要执行 shell 命令  | `isolated`          |
| 定时发送报告         | `isolated`          |
| 需要读取主会话上下文 | `main`              |
| 后台自动化任务       | `isolated`          |

---

## 4. Payload Kind（负载类型）

**Payload Kind** 决定任务具体做什么。

### 4.1 `systemEvent`（系统事件）

```json
{
  "payload": {
    "kind": "systemEvent",
    "text": "提醒：检查今天的日程"
  }
}
```

- 向 Agent 发送一条**系统消息**
- Agent 会在下次心跳时**看到**这条消息
- Agent 可能只是文本回复，**不一定执行实际操作**
- **必须**搭配 `sessionTarget: "main"`

**CLI 示例**：

```bash
openclaw cron add \
  --name "日程提醒" \
  --at "20m" \
  --session main \
  --system-event "提醒：检查今天的日程" \
  --wake now
```

### 4.2 `agentTurn`（Agent 回合）

```json
{
  "payload": {
    "kind": "agentTurn",
    "message": "执行命令：cd /path/to/project && python script.py"
  }
}
```

- 让 Agent 执行一个**完整的回合**（可以使用工具、执行命令）
- Agent 会在独立会话中运行，可以调用 shell、读写文件等
- **必须**搭配 `sessionTarget: "isolated"`
- 可以指定模型、思考级别、超时时间等

**CLI 示例**：

```bash
openclaw cron add \
  --name "执行脚本" \
  --cron "*/10 * * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "执行命令：cd /path/to/project && python script.py" \
  --announce \
  --channel feishu \
  --to "user_id_here"
```

### 4.3 核心区别对比

| 特性               | systemEvent              | agentTurn                |
| ------------------ | ------------------------ | ------------------------ |
| 执行环境           | 主会话                   | 隔离会话                 |
| Agent 行为         | 看到消息，可能只文本回复 | 完整执行回合，可使用工具 |
| 适合场景           | 提醒、通知               | 自动化任务、脚本执行     |
| 可否执行 shell     | ❌ 不可靠                | ✅ 可以                  |
| 配套 sessionTarget | `main`                   | `isolated`               |

---

## 5. Wake Mode（唤醒模式）

**Wake Mode** 决定任务触发后何时实际运行。

### 5.1 `now`（立即唤醒）

```
wakeMode: "now"
```

- 任务到期后**立即**运行
- 对于 `systemEvent`：立即触发心跳
- 对于 `agentTurn`：立即启动 Agent 回合

### 5.2 `next-heartbeat`（下次心跳）

```
wakeMode: "next-heartbeat"
```

- 任务到期后**等待下次心跳**时运行
- 省资源，但响应不那么及时
- 默认值

### 5.3 选择哪个？

| 场景             | 推荐 Wake Mode   |
| ---------------- | ---------------- |
| 紧急提醒         | `now`            |
| 后台任务         | `next-heartbeat` |
| 需要及时执行     | `now`            |
| 批量任务、省资源 | `next-heartbeat` |

---

## 6. Schedule（调度计划）

**Schedule** 决定任务何时运行。

### 6.1 `at`（一次性）

```bash
# 20 分钟后
--at "20m"

# 指定时间（UTC）
--at "2026-02-05T16:00:00Z"

# 指定时间（带时区）
--at "2026-02-05T16:00:00+08:00"
```

- 只运行一次
- 运行后默认自动删除（可用 `--keep-after-run` 保留）

### 6.2 `every`（固定间隔）

```bash
# 每 10 分钟
--every "10m"

# 每 2 小时
--every "2h"
```

- 按固定间隔重复运行

### 6.3 `cron`（Cron 表达式）

```bash
# 每 5 分钟
--cron "*/5 * * * *"

# 每天早上 8 点（上海时区）
--cron "0 8 * * *" --tz "Asia/Shanghai"

# 每周一早上 9 点
--cron "0 9 * * 1" --tz "Asia/Shanghai"
```

**Cron 表达式格式**：`分 时 日 月 周`

| 字段 | 范围 | 示例                     |
| ---- | ---- | ------------------------ |
| 分钟 | 0-59 | `*/5` = 每 5 分钟        |
| 小时 | 0-23 | `8` = 早上 8 点          |
| 日期 | 1-31 | `1` = 每月 1 号          |
| 月份 | 1-12 | `*` = 每月               |
| 星期 | 0-7  | `1` = 周一，`0,7` = 周日 |

**时区**：强烈建议指定 `--tz`，否则使用 Gateway 主机的本地时区。

---

## 7. Delivery（消息投递）

**Delivery** 决定是否将任务结果发送到聊天渠道（仅 `isolated` 任务支持）。

### 7.1 `announce`（投递）

```bash
--announce --channel feishu --to "user_id"
```

- 将 Agent 的回复发送到指定渠道
- 支持的渠道：`whatsapp`, `telegram`, `discord`, `slack`, `feishu`, `signal`, `imessage` 等
- `--to` 格式因渠道而异

### 7.2 `none`（不投递）

```bash
--no-deliver
```

- Agent 的回复只保存在 cron 运行日志中
- 不发送到任何聊天渠道

### 7.3 `--to` 目标格式

| 渠道     | 格式示例                                  |
| -------- | ----------------------------------------- |
| WhatsApp | `+8613812345678`                          |
| Telegram | `123456789` 或 `-1001234567890:topic:123` |
| Discord  | `channel:123456789` 或 `user:123456789`   |
| Slack    | `channel:C1234567890`                     |
| Feishu   | `user_id`                                 |

---

## 8. 常见配置组合

### 8.1 简单提醒（主会话）

```bash
openclaw cron add \
  --name "日程提醒" \
  --at "20m" \
  --session main \
  --system-event "提醒：检查今天的日程" \
  --wake now \
  --delete-after-run
```

**效果**：20 分钟后，Agent 在主会话中看到提醒消息。

### 8.2 定时执行脚本（隔离会话）

```bash
openclaw cron add \
  --name "执行发帖任务" \
  --cron "*/5 * * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "执行命令：cd /path/to/project && source .venv/bin/activate && python workflow.py heartbeat" \
  --wake now \
  --no-deliver
```

**效果**：每 5 分钟，Agent 在隔离会话中执行 Python 脚本。

### 8.3 定时报告到飞书

```bash
openclaw cron add \
  --name "每日报告" \
  --cron "30 23 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "生成今日工作报告摘要" \
  --announce \
  --channel feishu \
  --to "user_id_here"
```

**效果**：每天 23:30，Agent 生成报告并发送到飞书。

### 8.4 带模型覆盖的深度分析任务

```bash
openclaw cron add \
  --name "周报分析" \
  --cron "0 9 * * 1" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "分析本周项目进度，生成周报" \
  --model "opus" \
  --thinking high \
  --announce \
  --channel telegram \
  --to "123456789"
```

**效果**：每周一早上 9 点，用 Opus 模型 + 高思考级别生成周报。

---

## 9. 故障排查

### 9.1 任务显示 "ok" 但没有实际执行

**原因**：可能配置了 `systemEvent` + `main`，Agent 只是"看到"了消息，但没有执行实际操作。

**解决**：改为 `agentTurn` + `isolated`：

```bash
openclaw cron edit <job-id> \
  --session isolated \
  --message "执行命令：..."
```

### 9.2 任务没有发送通知

**可能原因**：

1. 配置了 `--no-deliver`
2. 脚本内部的通知逻辑有问题
3. `--to` 目标格式错误

**排查步骤**：

```bash
# 查看任务配置
openclaw cron list

# 查看运行历史
openclaw cron runs --id <job-id>
```

### 9.3 任务完全不运行

**检查项**：

1. Gateway 是否在运行？
2. Cron 是否启用？（`cron.enabled: true`）
3. 时区是否正确？（`--tz`）

```bash
# 检查 cron 状态
openclaw cron status

# 手动触发测试
openclaw cron run <job-id> --force
```

### 9.4 PATH 问题（脚本找不到命令）

Cron 运行环境的 `PATH` 可能很有限，导致找不到 `node`、`pnpm` 等命令。

**解决**：在脚本中显式设置 PATH，或使用完整路径。

---

## 10. CLI 命令速查

### 查看任务

```bash
# 列出所有任务
openclaw cron list

# 查看 cron 调度器状态
openclaw cron status

# 查看任务运行历史
openclaw cron runs --id <job-id> --limit 20
```

### 创建任务

```bash
# 一次性提醒
openclaw cron add --name "提醒" --at "20m" --session main --system-event "内容" --wake now

# 定时任务
openclaw cron add --name "任务" --cron "*/5 * * * *" --tz "Asia/Shanghai" --session isolated --message "命令"
```

### 修改任务

```bash
# 修改会话类型和消息
openclaw cron edit <job-id> --session isolated --message "新命令"

# 修改投递设置
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"

# 禁用投递
openclaw cron edit <job-id> --no-deliver

# 修改调度
openclaw cron edit <job-id> --cron "0 8 * * *" --tz "Asia/Shanghai"
```

### 启用/禁用任务

```bash
openclaw cron enable <job-id>
openclaw cron disable <job-id>
```

### 手动运行/删除

```bash
# 手动运行（调试）
openclaw cron run <job-id> --force

# 删除任务
openclaw cron rm <job-id>
```

---

## 11. 心跳机制（Heartbeat）

心跳是 OpenClaw 的另一种定时调度机制，与 Cron 互补。理解心跳机制有助于选择正确的自动化方案。

### 11.1 什么是心跳

心跳是一种**定时唤醒 AI Agent 的周期性调度系统**，让 Agent 在没有用户主动发消息的情况下，自主检查是否有需要处理的事项并主动通知用户。

**核心思想**：让 Agent 具备"主动感知"能力，像一个真正的助理一样，在合适的时机主动汇报重要事项。

### 11.2 心跳工作原理

```
┌─────────────────────────────────────────────────────────────────┐
│                      心跳执行流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │ 定时触发 │───▶│ 前置检查 │───▶│ 调用 LLM │───▶│ 处理响应 │ │
│   │ (30分钟) │    │          │    │          │    │          │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│                         │               │               │       │
│                         ▼               ▼               ▼       │
│                   · 活跃时间？    · 读取清单      · HEARTBEAT_OK │
│                   · 队列空闲？     HEARTBEAT.md    → 静默丢弃   │
│                   · 文件非空？   · 发送提示词     · 有内容       │
│                                                    → 投递消息   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**详细流程**：

1. **定时调度器**
   - 默认每 **30 分钟**触发一次（Anthropic OAuth 模式为 1 小时）
   - 使用 `setTimeout` 实现定时器，到点后触发心跳检查
   - 支持配置"活跃时间窗口"（`activeHours`），比如只在 8:00-22:00 运行，避免深夜打扰

2. **前置检查**
   - 判断当前是否在活跃时间窗口内
   - 检查主队列是否空闲（有请求在处理时跳过）
   - 检查 `HEARTBEAT.md` 是否为空（空文件则跳过，节省 API 调用）

3. **调用 LLM**
   - 向 AI 模型发送心跳提示词
   - 读取工作区的 `HEARTBEAT.md` 作为检查清单
   - 模型决定是否有需要关注的事项

4. **处理响应**
   - 如果没有需要处理的事项，Agent 回复 `HEARTBEAT_OK`，消息被**静默丢弃**
   - 如果有重要事项，Agent 返回具体内容，系统将消息**投递到指定渠道**

### 11.3 心跳配置示例

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 间隔（默认 30 分钟）
        target: "last", // 投递目标：last | none | 具体渠道
        activeHours: {
          // 活跃时间窗口（可选）
          start: "08:00",
          end: "22:00",
          timezone: "Asia/Shanghai",
        },
        prompt: "Read HEARTBEAT.md if it exists...", // 自定义提示词
        ackMaxChars: 300, // HEARTBEAT_OK 后允许的最大字符数
      },
    },
  },
}
```

### 11.4 HEARTBEAT.md 清单文件

在 Agent 工作区创建 `HEARTBEAT.md`，作为心跳检查的"待办清单"：

```md
# 心跳检查清单

- 快速扫描：收件箱有紧急消息吗？
- 检查日历：2 小时内有会议吗？
- 如果白天空闲超过 8 小时，发一条简短问候
- 如果有任务被阻塞，记录缺少什么并下次询问
```

**注意**：保持清单简短，避免 prompt 膨胀增加成本。

### 11.5 投递目标路由

| 目标值     | 行为                         |
| ---------- | ---------------------------- |
| `last`     | 发送到用户最近使用的消息渠道 |
| `none`     | 只运行心跳但不发送任何消息   |
| `whatsapp` | 发送到 WhatsApp              |
| `telegram` | 发送到 Telegram              |
| `discord`  | 发送到 Discord               |
| `feishu`   | 发送到飞书                   |
| 其他渠道   | 支持所有已配置的消息渠道     |

### 11.6 智能去重机制

系统会记录上次发送的心跳内容和时间。如果 **24 小时内**模型返回了相同的内容，会自动跳过，避免重复"唠叨"。

### 11.7 会话状态保护

心跳运行后会**恢复会话的 `updatedAt` 时间戳**，确保纯心跳交互不会影响会话的空闲超时判断。换句话说，心跳不会让会话"保持活跃"。

---

## 12. Cron vs Heartbeat 如何选择

### 12.1 核心区别

| 维度         | Heartbeat（心跳）         | Cron（定时任务）         |
| ------------ | ------------------------- | ------------------------ |
| **时间精度** | 大约（会随队列负载漂移）  | 精确（cron 表达式）      |
| **会话**     | 主会话，共享上下文        | 可隔离会话，独立运行     |
| **用途**     | 批量周期性检查            | 特定时间点的独立任务     |
| **成本**     | 一次调用覆盖多项检查      | 每个任务单独调用         |
| **响应契约** | `HEARTBEAT_OK` = 无事发生 | 总是有输出               |
| **投递行为** | 有内容才投递，OK 静默     | 总是投递（或配置不投递） |

### 12.2 决策流程图

```
需要在精确时间运行？
  ├── 是 → 使用 Cron
  └── 否 → 继续...

需要隔离会话（不影响主对话）？
  ├── 是 → 使用 Cron (isolated)
  └── 否 → 继续...

可以和其他周期性检查合并？
  ├── 是 → 使用 Heartbeat（添加到 HEARTBEAT.md）
  └── 否 → 使用 Cron

是一次性提醒？
  ├── 是 → 使用 Cron --at
  └── 否 → 继续...

需要不同的模型或思考级别？
  ├── 是 → 使用 Cron (isolated) --model/--thinking
  └── 否 → 使用 Heartbeat
```

### 12.3 推荐场景对照表

| 场景                         | 推荐方案        | 原因                   |
| ---------------------------- | --------------- | ---------------------- |
| 每 30 分钟检查收件箱         | Heartbeat       | 可与其他检查批量执行   |
| 每天早上 9 点发送日报        | Cron (isolated) | 需要精确时间           |
| 监控日历并提醒即将到来的会议 | Heartbeat       | 周期性感知任务         |
| 每周深度分析项目状态         | Cron (isolated) | 独立任务，可用更强模型 |
| 20 分钟后提醒我              | Cron --at       | 一次性精确提醒         |
| 后台项目健康检查             | Heartbeat       | 搭便车，节省调用       |
| 定时执行 Python 脚本         | Cron (isolated) | 需要实际执行命令       |

### 12.4 最佳实践：两者结合

最高效的设置是**同时使用**心跳和 Cron：

1. **Heartbeat** 处理日常监控（收件箱、日历、通知），一次心跳覆盖多项检查
2. **Cron** 处理精确调度（每日报告、周度复盘）和一次性提醒

**示例配置**：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
        activeHours: { start: "08:00", end: "22:00" },
      },
    },
  },
}
```

```bash
# Cron：每天早上 7 点生成简报
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "生成今日简报：天气、日程、重要邮件" \
  --announce \
  --channel telegram \
  --to "123456789"

# Cron：每周一早上 9 点生成周报
openclaw cron add \
  --name "Weekly review" \
  --cron "0 9 * * 1" \
  --tz "Asia/Shanghai" \
  --session isolated \
  --message "分析本周项目进度，生成周报" \
  --model opus \
  --thinking high \
  --announce
```

**HEARTBEAT.md**（每 30 分钟检查）：

```md
# 心跳检查清单

- 扫描收件箱，标记紧急邮件
- 检查日历，2 小时内有会议则提醒
- 如果有待处理任务超过 24 小时未更新，提醒我
- 白天空闲 8+ 小时，发简短问候
```

---

## 参考链接

- Cron 任务详细文档：https://docs.openclaw.ai/automation/cron-jobs
- CLI 参考：https://docs.openclaw.ai/cli/cron
- Cron vs Heartbeat：https://docs.openclaw.ai/automation/cron-vs-heartbeat
- Heartbeat 配置详解：https://docs.openclaw.ai/gateway/heartbeat

---

_文档编写：2026-02-05_
