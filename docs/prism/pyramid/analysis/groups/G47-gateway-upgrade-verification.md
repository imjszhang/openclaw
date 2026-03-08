# G47: Gateway 升级验证需遵循"版本确认 - 服务重装 - 配置加固"的标准流程以规避权限与安全风险

> 升级过程不仅是版本迭代，更是通过强制权限检查、端口冲突清理及最小化安全配置来消除潜在攻击面的关键窗口。

## 包含的 Atoms

| 编号  | 来源                         | 内容摘要                                                                                                |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| GV-01 | gateway-upgrade-verification | 通过 `pnpm openclaw --version` 和 `pnpm openclaw status` 命令验证 CLI 及全局状态是否升级至目标版本      |
| GV-02 | gateway-upgrade-verification | 首次重启 Gateway 后 RPC 探测可能因服务未完全就绪而失败，需等待数秒后再次探测                            |
| GV-03 | gateway-upgrade-verification | 2026.3.7 版本将 `OPENCLAW_GATEWAY_TOKEN` 读取方式从环境变量硬编码改为从配置文件读取                     |
| GV-04 | gateway-upgrade-verification | 即使当前仅配置 token，显式设置 `gateway.auth.mode: "token"` 也是避免后续添加 password 时出错的最佳实践  |
| GV-05 | gateway-upgrade-verification | 执行 `openclaw gateway install --force` 重装服务时需使用管理员权限，否则创建计划任务会拒绝访问          |
| GV-06 | gateway-upgrade-verification | 重装服务后重启若遇端口冲突，需先停止服务、手动终止残留进程并等待 TCP TimeWait 释放后再启动              |
| GV-07 | gateway-upgrade-verification | `tools.elevated.allowFrom: { "*": ["*"] }` 配置允许所有渠道用户触发提权工具，存在 Prompt Injection 风险 |
| GV-08 | gateway-upgrade-verification | `groupPolicy: "open"` 配合提权工具或文件系统工具开启，允许开放群聊中的任意用户执行危险操作或读写文件    |
| GV-09 | gateway-upgrade-verification | 在仅限个人单聊（DM）且无群聊的使用场景下，所有关于群聊攻击面的 CRITICAL 安全告警均不构成实际风险        |
| GV-10 | gateway-upgrade-verification | `gateway.trustedProxies` 未配置的告警在 Gateway 仅绑定本地 loopback 且不经过反向代理时无实际影响        |
| GV-11 | gateway-upgrade-verification | 飞书文档创建工具在开放群中可能导致请求者自动获得文档权限，但在个人单聊场景下此风险不存在                |
| GV-12 | gateway-upgrade-verification | 为防止 bot 被意外拉入群聊产生非预期响应，建议将 `groupPolicy` 从 `"open"` 改为 `"allowlist"`（空列表）  |

## 组内逻辑顺序

按操作执行流排列：先验证版本与状态 (GV-01, GV-02)，再处理服务重装与权限问题 (GV-03, GV-04, GV-05, GV-06)，最后进行安全配置审计与场景化风险评估 (GV-07 至 GV-12)。
