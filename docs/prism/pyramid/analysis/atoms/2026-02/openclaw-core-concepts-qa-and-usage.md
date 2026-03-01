# OpenClaw 核心概念：Q&A 与场景用法

> 来源：[../../../../journal/2026-02-13/openclaw-core-concepts-qa-and-usage.md](../../../../journal/2026-02-13/openclaw-core-concepts-qa-and-usage.md)
> 缩写：CQ

## Atoms

| 编号  | 类型 | 内容                                                                                                             | 原文定位                                      |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| CQ-01 | 事实 | 基于五层架构可组合多种场景：按身份拆分 Agent、按平台选通道、按联系人路由、按 Session 隔离、按 Workspace 划分人设 | 1. 具体场景用法                               |
| CQ-02 | 经验 | 设计决策顺序：Channel → Account → Agent → Bindings → Session → Workspace，层层递进                               | 1.7 设计时的决策顺序                          |
| CQ-03 | 事实 | 长期记忆位于 **Workspace 层**（MEMORY.md/memory/），属于 Agent 持久化存储，与 Session 短期上下文分离             | 2. 长期记忆在哪一层                           |
| CQ-04 | 事实 | agentDir 是 Agent 私有配置目录（默认 `~/.openclaw/agents/<id>/agent/`），存 auth/模型，与 Workspace 分离         | 3. agentDir 是什么                            |
| CQ-05 | 经验 | 切勿在多个 Agent 间复用同一个 agentDir，共享凭证应手动复制 `auth-profiles.json` 而非共享目录                     | 3.3 使用注意                                  |
| CQ-06 | 事实 | 子 Agent 是主 Agent 动态派生的后台任务（`sessions_spawn` 触发），在独立 Session 运行，完成后 announce 回传       | 4. 子 Agent 是什么                            |
| CQ-07 | 事实 | 子 Agent 与主 Agent 区别：Session 隔离、系统提示精简（仅 AGENTS+TOOLS）、Lane 为 subagent、自动归档              | 4.3 与主 Agent 的区别                         |
| CQ-08 | 事实 | 子 Agent 非新 Agent 定义，而是同一 Agent 衍生实例：共用 Workspace/agentDir/auth，受 maxConcurrent 限制           | 4.4 在架构中的位置                            |
| CQ-09 | 步骤 | 创建子 Agent 调用 `sessions_spawn` 工具，必填 `task`，可选 label/model/thinking/timeout/cleanup                  | 5.1 基本用法                                  |
| CQ-10 | 步骤 | 管理子 Agent 使用 `/subagents` 命令：list（查看）、stop（停止）、log（日志）、info（元信息）、send（发消息）     | 5.4 管理子 Agent                              |
| CQ-11 | 事实 | Agent 可通过对话修改 Workspace 文件：AGENTS.md/SOUL.md/USER.md/IDENTITY.md/TOOLS.md/HEARTBEAT.md                 | 6.1 Workspace 人设与规则                      |
| CQ-12 | 事实 | Agent 可通过对话读写记忆：MEMORY.md（长期）和 memory/YYYY-MM-DD.md（按日），compaction 时触发 flush              | 6.2 记忆                                      |
| CQ-13 | 经验 | 全局配置（config.apply/patch）需用户明确请求，Agent 不可主动执行；沙箱模式下 write/edit 被移除                   | 6.4-6.5 限制条件                              |
| CQ-14 | 判断 | Agent **不能**创建独立 Agent：`sessions_spawn` 仅创建子 Agent（衍生实例），无 `agents.create` 工具权限           | 7. 在一个 Agent 里能创建另一个独立的 Agent 吗 |
| CQ-15 | 经验 | `config.patch` 修改 `agents.list` 不会创建 Workspace 目录和 bootstrap 文件，导致新 Agent 无法正常使用            | 7.3 用 config.patch 能「创建」吗              |
