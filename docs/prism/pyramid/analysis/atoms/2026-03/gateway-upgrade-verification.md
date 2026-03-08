# Gateway 升级验证与配置修复记录

> 来源：[../../../../journal/2026-03-08/gateway-upgrade-verification.md](../../../../journal/2026-03-08/gateway-upgrade-verification.md)
> 缩写：GV

## Atoms

| 编号  | 类型 | 内容                                                                                                    | 原文定位                    |
| ----- | ---- | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| GV-01 | 步骤 | 通过 `pnpm openclaw --version` 和 `pnpm openclaw status` 命令验证 CLI 及全局状态是否升级至目标版本      | 1. 版本验证                 |
| GV-02 | 经验 | 首次重启 Gateway 后 RPC 探测可能因服务未完全就绪而失败，需等待数秒后再次探测                            | 2.1 首次重启                |
| GV-03 | 事实 | 2026.3.7 版本将 `OPENCLAW_GATEWAY_TOKEN` 读取方式从环境变量硬编码改为从配置文件读取                     | 2.2 发现的服务配置问题      |
| GV-04 | 判断 | 即使当前仅配置 token，显式设置 `gateway.auth.mode: "token"` 也是避免后续添加 password 时出错的最佳实践  | 3.1 添加 gateway.auth.mode  |
| GV-05 | 步骤 | 执行 `openclaw gateway install --force` 重装服务时需使用管理员权限，否则创建计划任务会拒绝访问          | 3.2 重装 Gateway 服务       |
| GV-06 | 经验 | 重装服务后重启若遇端口冲突，需先停止服务、手动终止残留进程并等待 TCP TimeWait 释放后再启动              | 3.4 重启 Gateway            |
| GV-07 | 事实 | `tools.elevated.allowFrom: { "*": ["*"] }` 配置允许所有渠道用户触发提权工具，存在 Prompt Injection 风险 | 4.1 CRITICAL: Elevated exec |
| GV-08 | 事实 | `groupPolicy: "open"` 配合提权工具或文件系统工具开启，允许开放群聊中的任意用户执行危险操作或读写文件    | 4.2 & 4.3 CRITICAL          |
| GV-09 | 判断 | 在仅限个人单聊（DM）且无群聊的使用场景下，所有关于群聊攻击面的 CRITICAL 安全告警均不构成实际风险        | 4.7 综合评估                |
| GV-10 | 判断 | `gateway.trustedProxies` 未配置的告警在 Gateway 仅绑定本地 loopback 且不经过反向代理时无实际影响        | 4.4 WARN: Reverse proxy     |
| GV-11 | 经验 | 飞书文档创建工具在开放群中可能导致请求者自动获得文档权限，但在个人单聊场景下此风险不存在                | 4.5 WARN: Feishu doc        |
| GV-12 | 步骤 | 为防止 bot 被意外拉入群聊产生非预期响应，建议将 `groupPolicy` 从 `"open"` 改为 `"allowlist"`（空列表）  | 4.7 综合评估                |
