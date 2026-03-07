# OpenClaw 权限配置完全指南

> 来源：[../../../../journal/2026-03-05/openclaw-permissions-guide.md](../../../../journal/2026-03-05/openclaw-permissions-guide.md)
> 缩写：PG

## Atoms

| 编号  | 类型 | 内容                                                                                                                               | 原文定位                        |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| PG-01 | 事实 | 权限系统分两个独立维度：工具可见性（allow/deny）与 exec 执行权限（openclaw.json + exec-approvals.json）                            | 1. 为什么权限系统这么复杂       |
| PG-02 | 经验 | 最常见陷阱：tools.allow 缺 group:fs/group:runtime、exec-approvals defaults 留空、两文件配置不同步                                  | 1. 为什么权限系统这么复杂       |
| PG-03 | 事实 | exec host 可选 sandbox/gateway/node，本地部署常用 gateway                                                                          | 3. Exec 执行权限详解            |
| PG-04 | 事实 | exec security 可选 deny/allowlist/full，deny 为硬编码默认                                                                          | 3. Exec 执行权限详解            |
| PG-05 | 事实 | exec ask 可选 off/on-miss/always，on-miss 为硬编码默认                                                                             | 3. Exec 执行权限详解            |
| PG-06 | 事实 | exec 权限由 openclaw.json（意图）与 exec-approvals.json（运行时）双轨决定，minSecurity 取更严格值                                  | 配置文件双轨制                  |
| PG-07 | 经验 | exec-approvals defaults 留空时子代理 fallback 到 security=deny，导致子代理 exec 全部被拒                                           | 子代理的 exec 权限问题          |
| PG-08 | 步骤 | 修复子代理 exec：在 exec-approvals.json defaults 中设 security:full、ask:off，或用 agents["*"] 通配                                | 子代理的 exec 权限问题          |
| PG-09 | 事实 | group:openclaw 不含 exec/read/write/edit，必须显式加 group:fs 和 group:runtime                                                     | 4. 工具可见性详解               |
| PG-10 | 事实 | allow 为空表示不限制；allow 为白名单模式；alsoAllow 为追加模式不替换原有 allow                                                     | allow / alsoAllow / deny 优先级 |
| PG-11 | 事实 | 子代理有固定工具 deny 列表（gateway、agents*list、session_status、cron、memory*\*、sessions_send 等）                              | 子代理工具限制                  |
| PG-12 | 步骤 | 本地最大权限：allow 含 group:openclaw/plugins/fs/runtime，exec 配 host:gateway/security:full/ask:off，exec-approvals defaults 同步 | 5. 配置示例：本地最大权限       |
| PG-13 | 经验 | Windows 上 PowerShell 不支持 &&，需指定 Git Bash 或提示 AI 用 PowerShell 兼容语法                                                  | 7. 常见问题排查                 |
| PG-14 | 事实 | safeBins 在 Windows 上始终不生效，需用 allowlist 明确列出命令路径或 security:full                                                  | 7. 常见问题排查                 |
| PG-15 | 判断 | 全开放配置仅适用于可信环境，生产环境应严格限制 exec 和命令权限                                                                     | 6. 配置示例：生产安全模式       |
