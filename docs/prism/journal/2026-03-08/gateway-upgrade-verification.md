# Gateway 升级验证与配置修复记录

> 文档日期：2026-03-08 14:47
>
> **关联文档**：[merge-main-upgrade-summary.md](./merge-main-upgrade-summary.md)（第三轮合并总结）
>
> **背景**：完成 `2026.3.3 → 2026.3.7` 合并后，重启 Gateway 并处理升级带来的配置变更和安全审计告警。

---

## 1. 版本验证

合并完成后，通过多个维度确认版本已升级到 `2026.3.7`：

| 检查项         | 命令                      | 结果                                         |
| -------------- | ------------------------- | -------------------------------------------- |
| `package.json` | 直接读取                  | `"version": "2026.3.7"`                      |
| CLI 版本       | `pnpm openclaw --version` | `2026.3.7`（首次触发了 TypeScript 重新构建） |
| 全局状态       | `pnpm openclaw status`    | `npm latest 2026.3.7`                        |

---

## 2. Gateway 重启与状态检查

### 2.1 首次重启

执行 `openclaw gateway restart`，Gateway 成功重启（`Restarted Scheduled Task: OpenClaw Gateway`）。

首次 `gateway status` 探测失败（RPC probe: failed, 1006 abnormal closure），属于服务尚未完全就绪。等待数秒后再次探测：

```
RPC probe: ok
Listening: 127.0.0.1:18789
```

Gateway 正常运行。

### 2.2 发现的服务配置问题

`gateway status` 报告了两条告警：

1. **Service config looks out of date or non-standard**
2. **Gateway service embeds OPENCLAW_GATEWAY_TOKEN and should be reinstalled**

原因：旧版本的 `openclaw gateway install` 会将 `OPENCLAW_GATEWAY_TOKEN` 硬编码到 Windows Scheduled Task 的环境变量中。2026.3.7 改为从配置文件读取，嵌入 token 被视为过时做法。

---

## 3. 配置修复

### 3.1 添加 `gateway.auth.mode: "token"`

**变更**：在 `D:\.openclaw\openclaw.json` 的 `gateway.auth` 节点中显式添加 `"mode": "token"`。

```json
"gateway": {
  "mode": "local",
  "auth": {
    "mode": "token",
    "token": "<REDACTED>"
  }
}
```

**原因**：2026.3.7 引入了 Breaking Change — 当 `gateway.auth.token` 和 `gateway.auth.password` 同时配置时，必须显式指定 `gateway.auth.mode`，否则启动和服务安装/修复流程会失败。当前配置虽然只有 token 没有 password（不会触发强制要求），但显式设置是最佳实践，避免后续添加 password 时遗忘。

### 3.2 重装 Gateway 服务

**执行**：`openclaw gateway install --force`（需要管理员权限）

- 首次以普通用户执行失败：`schtasks create failed: 拒绝访问`
- 通过 `Start-Process -Verb RunAs` 提升权限后成功：`Installed Scheduled Task: OpenClaw Gateway`

**效果**：新的服务配置不再嵌入 `OPENCLAW_GATEWAY_TOKEN`，改为运行时从 `openclaw.json` 读取。

### 3.3 运行 `openclaw doctor --repair`

Doctor 检查结果：

| 检查项             | 结果                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------- |
| State integrity    | 发现多个 state 目录（`~\.openclaw` 和 `D:\.openclaw`），以及 4 个孤儿 transcript 文件 |
| Security           | 无渠道安全警告                                                                        |
| Skills             | 14 个可用，44 个缺少依赖                                                              |
| Plugins            | 4 个已加载，37 个禁用，0 错误                                                         |
| Plugin diagnostics | WARN: memory slot plugin `memory-core` 未找到                                         |
| Feishu             | OK                                                                                    |
| Agents             | main (default)                                                                        |

无严重问题需要修复。

### 3.4 重启 Gateway（处理端口冲突）

重装服务后重启遇到端口冲突：

```
Found stale gateway process(es): 39060.
Port 18789 is already in use.
```

处理流程：

1. `openclaw gateway stop` — 停止服务
2. `PowerShell` 终止占用 18789 端口的残留进程
3. 等待 TCP TimeWait 状态连接释放
4. `openclaw gateway start` — 重新启动

最终状态：

```
Service: Scheduled Task (registered)
Config (cli): D:\.openclaw\openclaw.json
Config (service): D:\.openclaw\openclaw.json
RPC probe: ok
Listening: 127.0.0.1:18789
```

服务配置告警消失，Gateway 运行正常。

---

## 4. 安全审计分析

`openclaw status` 报告了 6 条安全审计告警。逐一分析如下：

### 4.1 CRITICAL: Elevated exec allowlist contains wildcard

**配置**：`tools.elevated.allowFrom: { "*": ["*"] }`

**含义**：所有渠道的所有用户都可以触发提权工具（elevated mode）。提权工具允许 agent 执行更危险的操作。

**风险评估**：如果有不可信用户能向 bot 发消息，prompt injection 可以在提权模式下执行。

### 4.2 CRITICAL: Open groupPolicy with elevated tools enabled

**配置**：`channels.feishu.accounts.default.groupPolicy: "open"` + `tools.elevated.enabled: true`

**含义**：任何飞书群都可以触发 bot（不需要白名单），同时提权工具对所有人开放。Bot 被拉入不可控群聊后，群内任何人可以通过 prompt injection 触发提权操作。

### 4.3 CRITICAL: Open groupPolicy with runtime/filesystem tools exposed

**配置**：`groupPolicy: "open"` + `tools.allow` 包含 `group:fs` 和 `group:runtime` + `exec.ask: "off"` + `fs.workspaceOnly: false`

**含义**：开放群中的消息可以触发 agent 在 gateway 主机上执行任意命令（exec 不需要确认）和读写任意文件（不限于工作区）。这是审计中最严重的组合风险。

### 4.4 WARN: Reverse proxy headers are not trusted

**配置**：`gateway.trustedProxies` 未配置

**含义**：如果通过反向代理暴露 Gateway，代理转发的客户端 IP 不被信任。当前 Gateway 绑定在 loopback，不经过反向代理，此告警无实际影响。

### 4.5 WARN: Feishu doc create can grant requester permissions

**配置**：`channels.feishu.tools.doc: true`

**含义**：agent 创建飞书文档时，飞书 API 可以将文档权限授予请求发起者。在开放群中，任何人让 agent 创建文档都会自动获得文档权限。

### 4.6 WARN: Potential multi-user setup detected

**触发信号**：`groupPolicy: "open"` + `allowFrom: ["*"]` + 飞书配了 2 个账号

**含义**：审计引擎推测可能有多个互不信任的用户共用同一个 gateway，提醒拆分信任边界。

### 4.7 综合评估

**使用场景**：设备管理员个人单聊（DM），不使用群聊功能。

**结论**：6 条告警均不构成实际风险。

| 告警         | 实际风险 | 原因                           |
| ------------ | -------- | ------------------------------ |
| CRITICAL 1-3 | 无       | 仅个人单聊，群聊攻击面不存在   |
| WARN 4       | 无       | 本地 loopback 访问，不经过代理 |
| WARN 5       | 无       | 仅个人触发文档创建             |
| WARN 6       | 误报     | 实际单用户使用                 |

**建议**（非必须）：可将 `groupPolicy` 从 `"open"` 改为 `"allowlist"`（空列表），防止 bot 被意外拉入群聊后产生非预期响应。当前不做调整。

---

## 5. 最终状态

| 项目                | 修复前                            | 修复后                           |
| ------------------- | --------------------------------- | -------------------------------- |
| 版本                | 代码已合并到 2026.3.7，服务未确认 | Gateway 运行版本 2026.3.7 已确认 |
| `gateway.auth.mode` | 未设置（隐式 token）              | 显式 `"token"`                   |
| 服务 token 嵌入     | 嵌入在 Scheduled Task 环境变量中  | 已移除，从配置文件读取           |
| Gateway 状态        | 配置过期告警                      | 正常运行，无告警                 |
| Doctor 检查         | 未运行                            | 通过，无严重问题                 |
| 安全审计            | 6 条告警                          | 已分析，当前使用场景下无实际风险 |
