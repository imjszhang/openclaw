# G43: 权限配置完全指南覆盖工具可见性与 exec 双轨制，子代理需同步 exec-approvals defaults 方能执行

> 工具可见性（allow/deny）与 exec 执行权限（openclaw.json + exec-approvals.json）各自独立，两文件配置不同步或 defaults 留空会导致子代理 exec 全部被拒。

## 包含的 Atoms

| 编号  | 来源                       | 内容摘要                                                                                                                           |
| ----- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| PG-01 | openclaw-permissions-guide | 权限系统分两个独立维度：工具可见性（allow/deny）与 exec 执行权限（openclaw.json + exec-approvals.json）                            |
| PG-02 | openclaw-permissions-guide | 最常见陷阱：tools.allow 缺 group:fs/group:runtime、exec-approvals defaults 留空、两文件配置不同步                                  |
| PG-03 | openclaw-permissions-guide | exec host 可选 sandbox/gateway/node，本地部署常用 gateway                                                                          |
| PG-04 | openclaw-permissions-guide | exec security 可选 deny/allowlist/full，deny 为硬编码默认                                                                          |
| PG-05 | openclaw-permissions-guide | exec ask 可选 off/on-miss/always，on-miss 为硬编码默认                                                                             |
| PG-06 | openclaw-permissions-guide | exec 权限由 openclaw.json（意图）与 exec-approvals.json（运行时）双轨决定，minSecurity 取更严格值                                  |
| PG-07 | openclaw-permissions-guide | exec-approvals defaults 留空时子代理 fallback 到 security=deny，导致子代理 exec 全部被拒                                           |
| PG-08 | openclaw-permissions-guide | 修复子代理 exec：在 exec-approvals.json defaults 中设 security:full、ask:off，或用 agents["*"] 通配                                |
| PG-09 | openclaw-permissions-guide | group:openclaw 不含 exec/read/write/edit，必须显式加 group:fs 和 group:runtime                                                     |
| PG-10 | openclaw-permissions-guide | allow 为空表示不限制；allow 为白名单模式；alsoAllow 为追加模式不替换原有 allow                                                     |
| PG-11 | openclaw-permissions-guide | 子代理有固定工具 deny 列表（gateway、agents*list、session_status、cron、memory*\*、sessions_send 等）                              |
| PG-12 | openclaw-permissions-guide | 本地最大权限：allow 含 group:openclaw/plugins/fs/runtime，exec 配 host:gateway/security:full/ask:off，exec-approvals defaults 同步 |
| PG-13 | openclaw-permissions-guide | Windows 上 PowerShell 不支持 &&，需指定 Git Bash 或提示 AI 用 PowerShell 兼容语法                                                  |
| PG-14 | openclaw-permissions-guide | safeBins 在 Windows 上始终不生效，需用 allowlist 明确列出命令路径或 security:full                                                  |
| PG-15 | openclaw-permissions-guide | 全开放配置仅适用于可信环境，生产环境应严格限制 exec 和命令权限                                                                     |

## 组内逻辑顺序

遵循"双维度总览 → exec 参数详解 → 双轨制与陷阱 → 工具可见性 → 配置示例 → 常见问题"的结构顺序。
