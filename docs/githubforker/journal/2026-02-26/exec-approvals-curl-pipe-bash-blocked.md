# 日记：curl | bash 类命令被安全机制直接拒绝且无审批弹窗

> 记录日期：2026-02-26
> 问题：OpenClaw 在执行 `curl -fsSL https://js-eyes.com/install.sh | bash` 等 curl 管道 bash 脚本时，既不自动执行，也不弹出审批，而是直接拒绝。

---

## 现象

Agent 尝试执行安装脚本：

```bash
curl -fsSL https://js-eyes.com/install.sh | bash
```

结果：命令被**直接拒绝**，无任何审批弹窗，AI 无法完成安装流程。

---

## 根因分析

### 1. 为何不自动执行？

OpenClaw 的 exec 安全采用 **allowlist 模式**。当 `security=allowlist` 时：

- 命令被解析为 **pipeline segments**（管道段）
- **每个段**必须满足其一：allowlist 匹配、safeBins、skills
- `curl ... | bash` 拆成两段：`curl -fsSL <url>` 和 `bash`
- `curl` 和 `bash` 均不在默认 safeBins（默认仅 `jq`、`cut`、`uniq`、`head`、`tail`、`tr`、`wc`）
- `bash` 从 stdin 执行任意脚本，永远不会被当作 safeBin
- 用户未将这两个命令加入 allowlist
- → `allowlistSatisfied = false`，不允许自动通过

此外，文档明确：含 `|`、`&&`、`||`、`;`、`` ` ``、`$`、`<`、`>` 等 shell 语法的命令在 allowlist 模式下一律视为 **allowlist miss**，需显式审批或加入 allowlist。

### 2. 为何直接拒绝、无审批弹窗？

关键在于 **`ask`** 配置：

- `ask=on-miss`：allowlist 未命中时**弹出审批**
- `ask=off`：allowlist 未命中时**直接拒绝**，不弹窗

当前 `~/.openclaw/exec-approvals.json` 为：

```json
{
  "version": 1,
  "socket": {...},
  "defaults": {},
  "agents": {}
}
```

`defaults` 和 `agents` 均为空时，代码使用默认值。但更重要的是：当**没有任何 agent 配置**时，解析逻辑会回退到 `security=deny`（默认拒绝所有 host exec），或 session 的 `ask` 可能被某处覆盖为 `off`，导致即使命中 allowlist 逻辑也会直接 deny，不进入审批分支。

结论：**缺少显式的 agent 配置，且 ask 未设为 on-miss**，导致「直接拒绝、无审批」的行为。

---

## 解决方案

### 修改 `~/.openclaw/exec-approvals.json`

在 `agents` 中为 `main`（或对应 agent）添加明确配置：

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "..."
  },
  "defaults": {},
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "allowlist": []
    }
  }
}
```

要点：

- `security: allowlist`：启用 allowlist 模式（替代默认 deny）
- `ask: on-miss`：allowlist 未命中时**弹出审批**，而非直接拒绝
- `askFallback: deny`：审批超时或无 UI 时拒绝
- `allowlist: []`：初始为空，用户可通过审批时的「Always allow」逐步积累

### 生效方式

exec-approvals 配置在**每次处理 exec 请求时**从磁盘重新读取，**无需重启 gateway**。

### 放行 curl | bash 的三种方式

1. **审批时选择 Always allow**：首次执行时弹窗，选「Always allow」即可加入 allowlist
2. **手动加入 allowlist**：在 `agents.main.allowlist` 中追加 `{ "pattern": "/usr/bin/curl" }` 和 `{ "pattern": "/bin/bash" }`
3. **放宽权限（不推荐）**：`security: full` + `ask: off`，跳过 allowlist 和审批

---

## 补充：修改后仍直接拒绝

完成上述 `exec-approvals.json` 修改后，问题**仍未解决**。进一步排查发现两个遗漏点。

### 3.1 为何 exec-approvals 未生效？host 默认为 sandbox

`tools.exec.host` 的默认值是 `sandbox`，不是 `gateway`：

- 当 `host=sandbox` 时，exec 在 **Docker 沙箱**内执行
- `processGatewayAllowlist` **仅当 `host=gateway` 或 `host=node` 时**才会被调用
- 因此 `exec-approvals.json` 在 `host=sandbox` 时**根本不会被读取**

### 3.2 在 openclaw.json 中添加 tools.exec

在 `openclaw.json` 中显式设置：

```json
"tools": {
  "exec": {
    "host": "gateway",
    "security": "allowlist",
    "ask": "on-miss"
  }
}
```

- `host: gateway`：让 exec 在 gateway 主机上运行，才会走 exec-approvals 流程
- 否则沙箱路径下，无论如何修改 exec-approvals.json 都不会生效

### 3.3 开启新 session 后问题解决

配置修改后，**需开启新 session** 方能生效。原因：

- `/exec` 的会话级覆盖（如 `execAsk=off`）会保存在 session state 中
- 旧 session 可能仍带有之前的 exec 覆盖，覆盖掉当前配置
- 新 session 无覆盖，会使用最新的 `tools.exec` 和 `exec-approvals.json`

**结论**：修改配置后，开启新 session，问题解决。

---

## 涉及代码/文档

| 文件                                         | 说明                                                            |
| -------------------------------------------- | --------------------------------------------------------------- |
| `src/agents/bash-tools.exec-host-gateway.ts` | 网关 exec 审批流程：`processGatewayAllowlist`                   |
| `src/infra/exec-approvals.ts`                | 解析 `exec-approvals.json`，默认 `security=deny`、`ask=on-miss` |
| `src/infra/exec-approvals-allowlist.ts`      | 段级 allowlist/safeBins 评估，`evaluateShellAllowlist`          |
| `docs/tools/exec-approvals.md`               | Exec 审批策略与 safe bins 文档                                  |
| `docs/platforms/macos.md`                    | Shell 语法视为 allowlist miss 的说明                            |

---

## 经验总结

1. **空配置 ≠ 宽松**：`exec-approvals.json` 中 `agents: {}` 时，会回退到 `security=deny`，导致 host exec 全部拒绝。
2. **ask 决定是否弹窗**：要获得审批机会，必须显式设置 `ask: on-miss`（或 `always`）。
3. **curl | bash 是高风险模式**：安全上故意不自动放行，需用户明确审批或加入 allowlist。
4. **host 决定 exec-approvals 是否生效**：`tools.exec.host` 默认为 `sandbox`，只有 `host=gateway` 或 `host=node` 时才会读取 exec-approvals.json。要让审批生效，需在 `openclaw.json` 中设置 `tools.exec.host: "gateway"`。
5. **修改后建议开新 session**：session 会持久化 `/exec` 覆盖（如 `execAsk`、`execHost`），旧 session 可能覆盖新配置。改完配置后开启新 session 可避免残留覆盖。
