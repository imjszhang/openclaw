# OpenClaw Agent Workspace Bootstrap 文件体系学习

> 日期：2026-03-23
> 项目：openclaw
> 类型：调研分析
> 来源：Cursor Agent 对话

---

## 目录

1. [背景与动机](#1-背景与动机)
2. [分析过程](#2-分析过程)
3. [核心发现](#3-核心发现)
4. [文件详解](#4-文件详解)
5. [安全性总结](#5-安全性总结)
6. [后续演化](#6-后续演化)

---

## 1. 背景与动机

希望深入理解 OpenClaw agent workspace 中各 Markdown 文件的用途、加载机制、彼此分工，以及在大量技能（300+）场景下如何优化。同时需要了解自定义 Markdown（如「宪法」类文件）能否作为扩展注入 agent 上下文，以及各文件从安全角度的注意事项。

## 2. 分析过程

### 调研范围

- 官方文档 `docs/concepts/agent-workspace.md`
- 工作区实现 `src/agents/workspace.ts`、`src/agents/bootstrap-files.ts`
- Skills 加载与预算 `src/agents/skills/workspace.ts`
- Bootstrap 截断与预算 `src/agents/pi-embedded-helpers/bootstrap.ts`、`src/agents/bootstrap-budget.ts`
- `bootstrap-extra-files` 钩子 `src/hooks/bundled/bootstrap-extra-files/handler.ts`
- 心跳配置 `docs/gateway/heartbeat.md`、`docs/automation/cron-vs-heartbeat.md`
- 官方模板 `docs/reference/templates/` 下的 `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`HEARTBEAT.md`

### 关键约束

- Bootstrap 文件有**单文件字符上限**（默认 20,000）和**总上限**（默认 150,000），超出会截断。
- Skills 目录进 prompt 有独立预算：默认最多 150 个技能、约 30,000 字符；超预算先降格为紧凑格式（去描述），再截断条目。
- `bootstrap-extra-files` 钩子只接受**白名单文件名**（`AGENTS.md`、`SOUL.md` 等标准名），无法注入任意文件名。
- 子代理/cron 会话只保留精简 bootstrap（`AGENTS`、`SOUL`、`TOOLS`、`IDENTITY`、`USER`），裁掉 `HEARTBEAT`、`BOOTSTRAP`、`MEMORY` 等。
- `lightweight` 上下文下，heartbeat 类运行通常只保留 `HEARTBEAT.md`。

## 3. 核心发现

### 3.1 Bootstrap 文件加载机制

这些文件**并非每个 tool call 都重新全量加载**，而是在**每次 agent 运行启动**（或 compact 重组上下文）时，由 `resolveBootstrapContextForRun` 从磁盘读入并注入。同一轮多步对话靠对话历史延续。

### 3.2 文件加载列表（固定参与 bootstrap）

| 文件                      | 加载场景                                       |
| ------------------------- | ---------------------------------------------- |
| `AGENTS.md`               | 所有会话类型                                   |
| `SOUL.md`                 | 所有会话类型                                   |
| `TOOLS.md`                | 所有会话类型                                   |
| `IDENTITY.md`             | 所有会话类型                                   |
| `USER.md`                 | 所有会话类型                                   |
| `HEARTBEAT.md`            | 常规 + heartbeat（子代理/cron 会被裁掉）       |
| `BOOTSTRAP.md`            | 常规会话（子代理/cron 会被裁掉）               |
| `MEMORY.md` / `memory.md` | 常规会话（子代理/cron 会被裁掉；二者只取一个） |

`memory/YYYY-MM-DD.md` 日更日志**不在**自动 bootstrap 列表中，需靠记忆检索工具或显式读文件。

### 3.3 核心四件套分工

| 文件          | 定位       | 管什么                               |
| ------------- | ---------- | ------------------------------------ |
| `AGENTS.md`   | 规则与流程 | 优先级、工作方式、工具纪律、红线条款 |
| `SOUL.md`     | 人格与边界 | 语气、价值观、伦理边界、群聊分寸     |
| `USER.md`     | 用户画像   | 称呼、背景、偏好、语言、详细程度     |
| `IDENTITY.md` | 助手名片   | 名字、emoji、头像路径、对外形象      |

### 3.4 SOUL.md vs IDENTITY.md 的区别

- **SOUL** = 内在人格与原则（深度、稳定）：怎么想、怎么守界、工作风格、拒绝策略。
- **IDENTITY** = 对外名片与元数据（浅层、可展示）：名字、物种设定、签名 emoji、头像路径。
- 二者应语义一致，但分工是**深度 vs 标签**。

### 3.5 HEARTBEAT.md 用法

- `HEARTBEAT.md` 是给**定时心跳**用的**超短检查清单**；默认心跳 prompt 会强制读它并按它执行。
- 无事回复 `HEARTBEAT_OK`，有事只发正文（不带 `HEARTBEAT_OK`）。
- 文件为空/仅注释 → 跳过本次心跳模型调用（省 API）。
- 文件不存在 → 心跳仍跑，模型自行判断。
- `lightContext: true` 时 bootstrap 往往**只剩这一份**文件。
- 模型可以被要求更新该文件。

### 3.6 Heartbeat vs Cron

| 维度 | Heartbeat（读 `HEARTBEAT.md`）   | Cron                           |
| ---- | -------------------------------- | ------------------------------ |
| 调度 | 间隔型（如每 30 分钟），会略漂移 | cron 表达式，可精确到秒        |
| 会话 | 默认主会话（带历史），可配隔离   | 常用隔离会话（`cron:<jobId>`） |
| 适合 | 多项检查合并、周期性巡检         | 定点任务、一次性提醒、独立模型 |
| 成本 | 一次心跳可合并多项               | 每个 job 独立开销              |

### 3.7 自定义 Markdown 扩展注入

- `bootstrap-extra-files` 钩子可注入额外文件，但**只接受白名单文件名**（如 `AGENTS.md`、`TOOLS.md`），不能注入 `CONSTITUTION.md` 等自定义名。
- 「宪法」类内容最务实的做法：**写进 `AGENTS.md` 靠前位置**（自动每会话生效）。
- 或放在独立文件里，在 `AGENTS.md` 中规定「重要决策前必须读该文件」（按需读取，不自动注入）。

### 3.8 300+ 技能场景的优化

- 系统默认每个来源最多加载约 200 个技能，进 prompt 目录最多约 150 个，整段约 30,000 字符。
- 超预算先降格为紧凑格式（只有名字和路径、省略描述），再截断条目。
- 优化思路：
  - `AGENTS.md` 写短的「场景 → 技能名」速查表 + 「按需 Read」流程。
  - 各 `SKILL.md` 前置描述尽量短。
  - 用 `agents.list[].skills` 白名单按 agent 缩减暴露面。
  - 不需要模型自动选中的技能用 `disable-model-invocation` 从目录里摘除。

## 4. 文件详解

### `AGENTS.md`

```
适合写：
- 任务分类与处理顺序
- 记忆读写纪律
- 与 Skills 的配合方式（何时读 SKILL.md）
- 宪法级最高优先级规则

不适合写：
- 大段用户履历（给 USER.md）
- 长篇人设散文（给 SOUL.md / IDENTITY.md）
- 具体 shell/路径百科（给 TOOLS.md）
```

### `SOUL.md`

```
适合写：
- 语气（简洁/教学/伙伴式）
- 伦理与安全边界
- 对敏感话题的默认态度

不适合写：
- 逐步操作手册（给 AGENTS.md）
- 用户事实档案（给 USER.md）
```

### `USER.md`

```
适合写：
- 称呼、代词、语言偏好
- 角色背景（开发者/运营）、常用技术栈、时区
- 希望的解释深度

不适合写：
- 助手人设（给 SOUL / IDENTITY）
- 密钥、token、真实手机号
```

### `IDENTITY.md`

```
适合写：
- 助手名称、简短自我介绍句式
- 签名风格、emoji 使用规则
- 头像路径（工作区相对路径或可控 URL）

不适合写：
- 大段世界观小说（精华放 SOUL）
- 用户资料（给 USER.md）
```

### `HEARTBEAT.md`

```
适合写：
- 极短检查项（邮件/日历/通知/项目状态）
- 昼夜策略（夜间只处理紧急）

不适合写：
- 密钥、token（会反复进 prompt）
- 长篇教程（具体步骤放 TOOLS.md 或技能里）
```

### 其它文件

| 文件                   | 简述                                            |
| ---------------------- | ----------------------------------------------- |
| `TOOLS.md`             | 本机命令/路径习惯，仅文字指导，不控制工具可用性 |
| `BOOTSTRAP.md`         | 首次引导仪式用，完成后应删除                    |
| `MEMORY.md`            | 精选长期记忆，仅主会话/私密上下文加载           |
| `memory/YYYY-MM-DD.md` | 按天日志，不自动进 bootstrap，靠检索/读文件     |
| `skills/`              | 工作区技能，同名覆盖托管/内置技能               |

## 5. 安全性总结

| 文件           | 主要安全风险                                  |
| -------------- | --------------------------------------------- |
| `AGENTS.md`    | 被篡改 → 行为被劫持；规则不严 → 外发/执行失当 |
| `SOUL.md`      | 边界写太软 → 危险请求也配合                   |
| `USER.md`      | PII 集中，备份/模型管线泄露                   |
| `IDENTITY.md`  | 头像路径/URL 泄露环境信息                     |
| `TOOLS.md`     | 内网路径与运维指纹泄露                        |
| `HEARTBEAT.md` | 周期性进上下文 + 可能驱动外发；禁密钥         |
| `BOOTSTRAP.md` | 长期残留的无用/过时指令                       |
| `MEMORY.md` 等 | 高敏感记忆；会话边界错误时群聊泄露            |
| `skills/`      | 恶意或意外覆盖 → 行为与数据面风险             |

### 通用安全原则

- **禁止在工作区放密钥**：API Key、OAuth token、密码等应放密码管理器/环境变量/`~/.openclaw/`。
- **工作区 = 私有记忆**：权限与备份策略要收紧；Git 备份必须用 private repo。
- **默认不是硬沙箱**：工作区是默认 cwd，不等于主机隔离；需要隔离时配置 gateway sandbox。
- **内容被篡改 = 持久化提示注入**：会改变 agent 长期行为。

## 6. 后续演化

- 进一步研究 `agents.defaults.sandbox` 和沙箱模式对工作区文件的影响。
- 探索通过 hook 系统实现更灵活的自定义文件注入（当前受白名单限制）。
- 在 300+ 技能场景下，实际测试 `agents.list[].skills` 白名单对 prompt 质量和 token 用量的影响。
- 研究 `memory_search` 语义检索在「宪法类长文档按需召回」场景下的效果。

---

**参考文档**：

- [Agent Workspace](https://docs.openclaw.ai/concepts/agent-workspace)
- [Memory](https://docs.openclaw.ai/concepts/memory)
- [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat)
- [Cron vs Heartbeat](https://docs.openclaw.ai/automation/cron-vs-heartbeat)
- [Hooks - bootstrap-extra-files](https://docs.openclaw.ai/automation/hooks#bootstrap-extra-files)
