# OpenClaw 独立 Agent 创建指引

> 来源：[../../../../journal/2026-02-13/independent-agent-creation-guide.md](../../../../journal/2026-02-13/independent-agent-creation-guide.md)
> 缩写：IA

## Atoms

| 编号  | 类型 | 内容                                                                                                     | 原文定位                           |
| ----- | ---- | -------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| IA-01 | 事实 | 独立 Agent 是 agents.list 中的完整条目，拥有独立的 Workspace、agentDir 和 sessions 目录                  | 概述                               |
| IA-02 | 事实 | 独立 Agent 与子 Agent（sessions_spawn 创建）不同，是配置层面的新实体，需通过 CLI 或 RPC 创建             | 概述                               |
| IA-03 | 事实 | 独立 Agent 的 Workspace 包含 AGENTS.md、SOUL.md、TOOLS.md、IDENTITY.md 等文件                            | 概述                               |
| IA-04 | 事实 | 独立 Agent 的 agentDir 默认位于 ~/.openclaw/agents/<agentId>/agent                                       | 概述                               |
| IA-05 | 事实 | 独立 Agent 的 sessions 目录位于 ~/.openclaw/agents/<agentId>/sessions                                    | 概述                               |
| IA-06 | 事实 | 创建独立 Agent 有两种入口：CLI（openclaw agents add）和 RPC（agents.create）                             | 两种创建入口                       |
| IA-07 | 事实 | agentId 由 name 规范化得到（如 "Work Agent" → work-agent），main 为保留 ID 不能创建                      | 两种创建入口                       |
| IA-08 | 步骤 | CLI 交互式创建：运行 openclaw agents add [name]，向导会询问名称、Workspace、auth、模型、渠道绑定         | CLI 方式 > 交互式                  |
| IA-09 | 步骤 | CLI 非交互式创建：必须提供 --workspace，可选 --model、--agent-dir、--bind，需加 --non-interactive        | CLI 方式 > 非交互式                |
| IA-10 | 经验 | CLI 非交互式模式不会创建 auth，需之后单独配置或复制 auth-profiles.json                                   | CLI 方式 > 非交互式                |
| IA-11 | 事实 | CLI 选项 --workspace 支持 ~ 路径，--bind 可重复使用                                                      | CLI 方式 > CLI 选项                |
| IA-12 | 事实 | RPC 方法 agents.create 适用于 Web UI、自动化脚本、远程调用 Gateway                                       | RPC 方式                           |
| IA-13 | 事实 | RPC 参数 name 和 workspace 必填，emoji 和 avatar 可选                                                    | RPC 方式 > 参数                    |
| IA-14 | 判断 | RPC 不处理 auth、model、bindings，无交互式向导，适合 Web UI 或自动化脚本调用                             | RPC 方式 > 与 CLI 的差异           |
| IA-15 | 步骤 | 创建后 auth 配置三种方式：再次运行向导、从主 Agent 复制 auth-profiles.json、手动配置                     | 创建后需完成的事项 > 配置认证      |
| IA-16 | 步骤 | 配置 bindings 需在 openclaw.json 的 bindings 数组中添加条目，指定 agentId 和 match 条件                  | 创建后需完成的事项 > 配置 bindings |
| IA-17 | 经验 | 推荐操作流程：准备 Workspace 路径 → 执行创建 → 配置认证 → 配置 bindings → 用 agents list --bindings 验证 | 推荐操作流程                       |
| IA-18 | 判断 | main 是保留 ID，不能创建名为 main 的 Agent                                                               | 注意事项                           |
| IA-19 | 经验 | 每个 Agent 应有独立的 agentDir，避免 auth/session 冲突                                                   | 注意事项                           |
| IA-20 | 经验 | 若配置了 agents.defaults.skipBootstrap，Workspace 不会自动生成 bootstrap 文件，需自行准备                | 注意事项                           |
