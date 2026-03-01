# G29: Agent 使用需严格区分“主 Agent 配置”与“子 Agent 衍生”，禁止跨 Agent 复用配置目录以确保人设与记忆的独立性

> 子 Agent 仅是主 Agent 的临时衍生实例而非独立实体，错误地共享 agentDir 或试图创建独立 Agent 将导致配置冲突与功能失效。

## 包含的 Atoms

| 编号  | 来源                                | 内容摘要                                                                                                         |
| ----- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| CQ-01 | openclaw-core-concepts-qa-and-usage | 基于五层架构可组合多种场景：按身份拆分 Agent、按平台选通道、按联系人路由、按 Session 隔离、按 Workspace 划分人设 |
| CQ-02 | openclaw-core-concepts-qa-and-usage | 设计决策顺序：Channel → Account → Agent → Bindings → Session → Workspace，层层递进                               |
| CQ-03 | openclaw-core-concepts-qa-and-usage | 长期记忆位于 **Workspace 层**（MEMORY.md/memory/），属于 Agent 持久化存储，与 Session 短期上下文分离             |
| CQ-04 | openclaw-core-concepts-qa-and-usage | agentDir 是 Agent 私有配置目录（默认 `~/.openclaw/agents/<id>/agent/`），存 auth/模型，与 Workspace 分离         |
| CQ-05 | openclaw-core-concepts-qa-and-usage | 切勿在多个 Agent 间复用同一个 agentDir，共享凭证应手动复制 `auth-profiles.json` 而非共享目录                     |
| CQ-06 | openclaw-core-concepts-qa-and-usage | 子 Agent 是主 Agent 动态派生的后台任务（`sessions_spawn` 触发），在独立 Session 运行，完成后 announce 回传       |
| CQ-07 | openclaw-core-concepts-qa-and-usage | 子 Agent 与主 Agent 区别：Session 隔离、系统提示精简（仅 AGENTS+TOOLS）、Lane 为 subagent、自动归档              |
| CQ-08 | openclaw-core-concepts-qa-and-usage | 子 Agent 非新 Agent 定义，而是同一 Agent 衍生实例：共用 Workspace/agentDir/auth，受 maxConcurrent 限制           |
| CQ-09 | openclaw-core-concepts-qa-and-usage | 创建子 Agent 调用 `sessions_spawn` 工具，必填 `task`，可选 label/model/thinking/timeout/cleanup                  |
| CQ-10 | openclaw-core-concepts-qa-and-usage | 管理子 Agent 使用 `/subagents` 命令：list（查看）、stop（停止）、log（日志）、info（元信息）、send（发消息）     |
| CQ-11 | openclaw-core-concepts-qa-and-usage | Agent 可通过对话修改 Workspace 文件：AGENTS.md/SOUL.md/USER.md/IDENTITY.md/TOOLS.md/HEARTBEAT.md                 |
| CQ-12 | openclaw-core-concepts-qa-and-usage | Agent 可通过对话读写记忆：MEMORY.md（长期）和 memory/YYYY-MM-DD.md（按日），compaction 时触发 flush              |
| CQ-13 | openclaw-core-concepts-qa-and-usage | 全局配置（config.apply/patch）需用户明确请求，Agent 不可主动执行；沙箱模式下 write/edit 被移除                   |
| CQ-14 | openclaw-core-concepts-qa-and-usage | Agent **不能**创建独立 Agent：`sessions_spawn` 仅创建子 Agent（衍生实例），无 `agents.create` 工具权限           |
| CQ-15 | openclaw-core-concepts-qa-and-usage | `config.patch` 修改 `agents.list` 不会创建 Workspace 目录和 bootstrap 文件，导致新 Agent 无法正常使用            |

## 组内逻辑顺序

逻辑顺序为场景组合与决策流（CQ-01~02）→ 存储与配置隔离（CQ-03~05）→ 子 Agent 机制详解（CQ-06~10）→ 文件操作权限与限制（CQ-11~15）。
