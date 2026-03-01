# G28: OpenClaw 核心架构通过"Channel-Agent-Workspace-Session"五层抽象与严格隔离机制，实现消息路由安全与上下文精准管理

> 消息系统的复杂性要求将平台接入、身份实例、大脑逻辑、工作空间与会话上下文彻底解耦，并通过多层锁与串行机制保障并发安全。

## 包含的 Atoms

| 编号  | 来源                           | 内容摘要                                                                                                            |
| ----- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| CP-01 | openclaw-core-concepts-pyramid | OpenClaw 五层抽象架构：Channel（平台）→ Account（实例）→ Agent（大脑）→ Workspace（文件家）+ Session（上下文）      |
| CP-02 | openclaw-core-concepts-pyramid | 消息流转路径：通道账户接收 → bindings 路由到 Agent → 加载 Workspace 执行 → 维护 Session 上下文 → 原路返回           |
| CP-03 | openclaw-core-concepts-pyramid | Channel 是消息平台（WhatsApp/Telegram 等），Account 是同一 Channel 下的登录实例（手机号/Bot Token）                 |
| CP-04 | openclaw-core-concepts-pyramid | Agent 由三部分组成：Workspace（文件目录）、AgentDir（auth/模型配置）、Sessions（会话存储）                          |
| CP-05 | openclaw-core-concepts-pyramid | Workspace 是 Agent 唯一工作目录和默认 cwd，包含 AGENTS.md、SOUL.md、MEMORY.md、skills/等人设记忆文件                |
| CP-06 | openclaw-core-concepts-pyramid | Workspace 与 ~/.openclaw/区分：前者存人设记忆技能（用户可编辑），后者存配置凭证会话存储（系统状态）                 |
| CP-07 | openclaw-core-concepts-pyramid | Session 是对话上下文桶，SessionKey 格式如 `agent:<id>:<channel>:dm:<peer>`，dmScope 控制分桶策略                    |
| CP-08 | openclaw-core-concepts-pyramid | Bindings 匹配顺序：peer → guildId/teamId → accountId → 默认 agent，精确匹配优先                                     |
| CP-09 | openclaw-core-concepts-pyramid | 多用户 DM 安全建议：设置 `session.dmScope: "per-channel-peer"` 避免不同联系人上下文泄露                             |
| CP-10 | openclaw-core-concepts-pyramid | 多 Agent 注意事项：切勿复用 agentDir（防冲突），共享凭证需手动复制 auth-profiles.json，workspace skills 优先        |
| CP-11 | openclaw-core-concepts-pyramid | 隔离机制四层：Agent（目录独立）、Session（key+ 锁 + 串行）、Channel（独立 monitor）、Account（凭证 + 路由）         |
| CP-12 | openclaw-core-concepts-pyramid | 并发控制：全局 CommandLane、按 SessionKey 串行、文件锁保护 JSONL 写入、Session Store 锁保护 sessions.json           |
| CP-13 | openclaw-core-concepts-pyramid | Gateway 是单一控制平面（端口 18789），Node 是配对设备提供 canvas/camera 等能力                                      |
| CP-14 | openclaw-core-concepts-pyramid | Peer 是对话对方（direct/group/channel），DeliveryContext 是出站路由上下文决定回复原路返回                           |
| CP-15 | openclaw-core-concepts-pyramid | Broadcast 广播组允许同一 peer 消息触发多个 agent 并行/串行处理，每个 agent 有独立 session                           |
| CP-16 | openclaw-core-concepts-pyramid | Context 是单次运行全部内容（系统提示 + 历史 + 工具结果），Memory 是持久化记忆（MEMORY.md），Compaction 是上下文压缩 |
| CP-17 | openclaw-core-concepts-pyramid | Skills 来源优先级：workspace/skills/ > ~/.openclaw/skills > bundled                                                 |
| CP-18 | openclaw-core-concepts-pyramid | Queue Mode 策略：collect（合并）、steer（注入当前）、followup（排队下一轮）                                         |
| CP-19 | openclaw-core-concepts-pyramid | Lane 命令队列通道：main（主对话）、cron、subagent、session:<key>，同一 session 内串行                               |
| CP-20 | openclaw-core-concepts-pyramid | Pairing 是显式审批机制（DM 和 Node），Sandbox 是可选隔离容器限制文件访问和工具权限                                  |

## 组内逻辑顺序

逻辑顺序为架构总览（CP-01~04）→ 核心组件详解（CP-05~07）→ 路由与匹配逻辑（CP-08~09）→ 安全与隔离机制（CP-10~12）→ 高级特性与并发控制（CP-13~20）。
