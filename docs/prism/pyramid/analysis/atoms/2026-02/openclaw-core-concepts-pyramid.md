# OpenClaw 核心概念：Channel、Account、Agent、Workspace、Session

> 来源：[../../../../journal/2026-02-13/openclaw-core-concepts-pyramid.md](../../../../journal/2026-02-13/openclaw-core-concepts-pyramid.md)
> 缩写：CP

## Atoms

| 编号  | 类型 | 内容                                                                                                                | 原文定位                  |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| CP-01 | 事实 | OpenClaw 五层抽象架构：Channel（平台）→ Account（实例）→ Agent（大脑）→ Workspace（文件家）+ Session（上下文）      | 1. 概念层级总览           |
| CP-02 | 事实 | 消息流转路径：通道账户接收 → bindings 路由到 Agent → 加载 Workspace 执行 → 维护 Session 上下文 → 原路返回           | 核心结论                  |
| CP-03 | 事实 | Channel 是消息平台（WhatsApp/Telegram 等），Account 是同一 Channel 下的登录实例（手机号/Bot Token）                 | 2.1-2.2                   |
| CP-04 | 事实 | Agent 由三部分组成：Workspace（文件目录）、AgentDir（auth/模型配置）、Sessions（会话存储）                          | 2.3 Agent                 |
| CP-05 | 事实 | Workspace 是 Agent 唯一工作目录和默认 cwd，包含 AGENTS.md、SOUL.md、MEMORY.md、skills/等人设记忆文件                | 2.4 Workspace             |
| CP-06 | 经验 | Workspace 与 ~/.openclaw/区分：前者存人设记忆技能（用户可编辑），后者存配置凭证会话存储（系统状态）                 | 2.4 与 ~/.openclaw/的区分 |
| CP-07 | 事实 | Session 是对话上下文桶，SessionKey 格式如 `agent:<id>:<channel>:dm:<peer>`，dmScope 控制分桶策略                    | 2.5 Session               |
| CP-08 | 事实 | Bindings 匹配顺序：peer → guildId/teamId → accountId → 默认 agent，精确匹配优先                                     | 3.1 Bindings 匹配顺序     |
| CP-09 | 经验 | 多用户 DM 安全建议：设置 `session.dmScope: "per-channel-peer"` 避免不同联系人上下文泄露                             | 6.1 多用户 DM 安全        |
| CP-10 | 经验 | 多 Agent 注意事项：切勿复用 agentDir（防冲突），共享凭证需手动复制 auth-profiles.json，workspace skills 优先        | 6.4 多 Agent 注意事项     |
| CP-11 | 事实 | 隔离机制四层：Agent（目录独立）、Session（key+ 锁+ 串行）、Channel（独立 monitor）、Account（凭证 + 路由）          | 4.1 隔离机制概览          |
| CP-12 | 事实 | 并发控制：全局 CommandLane、按 SessionKey 串行、文件锁保护 JSONL 写入、Session Store 锁保护 sessions.json           | 4.3 并发控制              |
| CP-13 | 事实 | Gateway 是单一控制平面（端口 18789），Node 是配对设备提供 canvas/camera 等能力                                      | 7.1 运行环境层            |
| CP-14 | 事实 | Peer 是对话对方（direct/group/channel），DeliveryContext 是出站路由上下文决定回复原路返回                           | 7.2 消息与路由层          |
| CP-15 | 事实 | Broadcast 广播组允许同一 peer 消息触发多个 agent 并行/串行处理，每个 agent 有独立 session                           | 7.2 消息与路由层          |
| CP-16 | 事实 | Context 是单次运行全部内容（系统提示 + 历史 + 工具结果），Memory 是持久化记忆（MEMORY.md），Compaction 是上下文压缩 | 7.3 上下文与记忆层        |
| CP-17 | 事实 | Skills 来源优先级：workspace/skills/ > ~/.openclaw/skills > bundled                                                 | 7.4 能力与队列层          |
| CP-18 | 事实 | Queue Mode 策略：collect（合并）、steer（注入当前）、followup（排队下一轮）                                         | 7.4 能力与队列层          |
| CP-19 | 事实 | Lane 命令队列通道：main（主对话）、cron、subagent、session:<key>，同一 session 内串行                               | 7.4 能力与队列层          |
| CP-20 | 事实 | Pairing 是显式审批机制（DM 和 Node），Sandbox 是可选隔离容器限制文件访问和工具权限                                  | 7.5 安全与配对层          |
