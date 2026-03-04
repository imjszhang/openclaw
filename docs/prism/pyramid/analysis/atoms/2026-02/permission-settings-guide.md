# OpenClaw 权限设置指南

> 来源：[../../../../journal/2026-02-27/permission-settings-guide.md](../../../../journal/2026-02-27/permission-settings-guide.md)
> 缩写：PS

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位                 |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | ------------------------ |
| PS-01 | 事实 | 主配置文件位于 `~/.openclaw/openclaw.json`，采用支持注释和尾逗号的 JSON5 格式                     | 1. 配置位置与结构        |
| PS-02 | 步骤 | 使用 `pnpm openclaw config get <section>` 命令查看特定配置段（如 tools, commands）的当前值        | 1. 配置位置与结构        |
| PS-03 | 事实 | `tools.exec.host` 默认值为 `sandbox`，设为 `gateway` 或 `node` 时将在宿主机执行命令               | 2. 工具执行 (tools.exec) |
| PS-04 | 事实 | `tools.exec.security` 设为 `full` 时允许任意执行，设为 `allowlist` 时需配合 `exec-approvals.json` | 2. 工具执行 (tools.exec) |
| PS-05 | 步骤 | 执行 `pnpm openclaw config set tools.exec.security full` 和 `ask off` 可开启无限制执行模式        | 2. 工具执行 (tools.exec) |
| PS-06 | 事实 | `tools.elevated.allowFrom` 支持按渠道 ID 配置白名单，`"*"` 作为键表示通配所有渠道                 | 3. Elevated 特权执行     |
| PS-07 | 事实 | `tools.agentToAgent.enabled` 默认关闭，设为 `true` 且 `allow` 为 `["*"]` 时允许调用任意 Agent     | 4. 跨 Agent 调用         |
| PS-08 | 事实 | `tools.sessions.visibility` 默认 `tree`（当前会话及子会话），设为 `all` 可访问跨 Agent 所有会话   | 5. 会话可见性            |
| PS-09 | 事实 | `tools.fs.workspaceOnly` 默认 `false`，但 `apply_patch` 工具独立配置且默认限制为工作区            | 6. 文件系统守卫          |
| PS-10 | 事实 | `commands.bash`、`commands.config`、`commands.debug` 默认均为 `false`，需手动开启                 | 7. 命令权限              |
| PS-11 | 事实 | `commands.useAccessGroups` 默认 `true`，设为 `false` 可绕过访问组和白名单强制检查                 | 7. 命令权限              |
| PS-12 | 经验 | 渠道 `dmPolicy` 设为 `open` 时，必须同时配置 `allowFrom: ["*"]`，否则校验会失败                   | 8. 渠道访问策略          |
| PS-13 | 事实 | `groupPolicy` 设为 `open` 时不限制群组，但仍受 mention 规则约束                                   | 8. 渠道访问策略          |
| PS-14 | 步骤 | 可通过 Node 脚本读取并修改 `openclaw.json` 文件，实现批量写入“全部开放”的安全配置                 | 9. 「全部开放」快速配置  |
| PS-15 | 经验 | 修改配置后必须执行 `pnpm openclaw gateway restart` 重启网关才能使新策略生效                       | 10. CLI 操作与验证       |
| PS-16 | 步骤 | 使用 `pnpm openclaw doctor --non-interactive` 和 `pnpm openclaw health` 验证配置与运行状态        | 10. CLI 操作与验证       |
| PS-17 | 判断 | “全部开放”配置仅适用于可信环境或开发调试场景，生产环境应严格限制 exec 和命令权限                  | 9. 「全部开放」快速配置  |
