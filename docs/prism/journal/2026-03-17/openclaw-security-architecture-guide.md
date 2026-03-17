# OpenClaw 安全架构原理整理

> 文档日期：2026-03-17
>
> 覆盖范围：项目中所有与安全相关的架构原理文档的索引与核心要点提炼

---

## 目录

1. [安全架构全景](#1-安全架构全景)
2. [信任模型与威胁模型](#2-信任模型与威胁模型)
3. [五层信任边界](#3-五层信任边界)
4. [认证与授权体系](#4-认证与授权体系)
5. [工具权限与执行控制](#5-工具权限与执行控制)
6. [沙箱隔离](#6-沙箱隔离)
7. [形式化验证](#7-形式化验证)
8. [状态目录权限加固](#8-状态目录权限加固)
9. [网络暴露与加固](#9-网络暴露与加固)
10. [提示注入防御](#10-提示注入防御)
11. [供应链安全](#11-供应链安全)
12. [事件响应](#12-事件响应)
13. [Agent-First 架构与安全](#13-agent-first-架构与安全)
14. [Gateway 网关架构](#14-gateway-网关架构)
15. [文档索引](#15-文档索引)

---

## 1. 安全架构全景

OpenClaw 安全体系围绕 **个人助手信任模型（Personal Assistant Trust Model）** 构建：

- **一个可信操作者边界**对应一个 Gateway 实例
- 不是多租户安全边界——不适用于多个对抗性用户共享同一 Agent/Gateway
- 核心原则：**访问控制先于智能**（Access Control Before Intelligence）

安全设计的三层递进：

```
身份优先 → 范围限定 → 模型兜底
(Identity)  (Scope)     (Model)

1. 谁能与 Bot 对话？  ← DM 配对 / 白名单 / 显式开放
2. Bot 被允许做什么？  ← 群组白名单 + mention 门控 + 工具策略 + 沙箱 + 设备权限
3. 假设模型可被操纵    ← 设计使操纵的爆炸半径受限
```

---

## 2. 信任模型与威胁模型

### 信任边界矩阵

| 边界/控制                                 | 含义                     | 常见误读                            |
| ----------------------------------------- | ------------------------ | ----------------------------------- |
| `gateway.auth`（token/password/设备认证） | 认证调用者到 Gateway API | "需要每消息签名才安全"              |
| `sessionKey`                              | 上下文/会话选择的路由键  | "sessionKey 是用户认证边界"         |
| 提示/内容护栏                             | 降低模型滥用风险         | "提示注入 = 认证绕过"               |
| `canvas.eval` / 浏览器 evaluate           | 操作者启用时的有意能力   | "任何 JS eval 都是漏洞"             |
| 本地 TUI `!` shell                        | 操作者显式触发的本地执行 | "本地 shell 是远程注入"             |
| 节点配对和节点命令                        | 操作者级远程执行         | "远程设备控制 = 不受信任的用户访问" |

### MITRE ATLAS 威胁模型

项目采用 MITRE ATLAS 框架进行系统性威胁分析，涵盖：

- **侦察**（AML.TA0002）：端点发现、通道探测
- **初始访问**（AML.TA0004）：配对码截获、身份欺骗、Token 窃取
- **执行**（AML.TA0005）：直接/间接提示注入、工具参数注入、exec 审批绕过
- **持久化**（AML.TA0006）：恶意技能安装、技能更新投毒、配置篡改
- **防御规避**（AML.TA0007）：审核模式绕过、内容包装逃逸
- **发现**（AML.TA0008）：工具枚举、会话数据提取
- **收集与外泄**（AML.TA0009-10）：web_fetch 数据窃取、未授权消息发送、凭据收割
- **影响**（AML.TA0011）：未授权命令执行、资源耗尽（DoS）、声誉损害

### 关键攻击链

```
攻击链 1：技能→数据窃取
  恶意技能发布 → 绕过审核 → 收割凭据

攻击链 2：提示注入→RCE
  注入提示 → 绕过 exec 审批 → 执行命令

攻击链 3：间接注入→外泄
  投毒 URL → Agent 获取并执行指令 → 数据发送给攻击者
```

---

## 3. 五层信任边界

```
┌─────────────────────────────────────────┐
│           不可信区域（UNTRUSTED）          │
│   WhatsApp / Telegram / Discord / ...    │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│  信任边界 1：通道访问（Channel Access）    │
│  • 设备配对（30s 宽限期）                 │
│  • AllowFrom / AllowList 验证            │
│  • Token/Password/Tailscale 认证         │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│  信任边界 2：会话隔离（Session Isolation） │
│  • 会话键 = agent:channel:peer           │
│  • 每 Agent 工具策略                      │
│  • 转录日志                              │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│  信任边界 3：工具执行（Tool Execution）    │
│  • Docker 沙箱 或 主机（exec-approvals） │
│  • 节点远程执行                           │
│  • SSRF 防护（DNS 固定 + IP 阻断）       │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│  信任边界 4：外部内容（External Content）  │
│  • 外部内容包装（XML 标签）               │
│  • 安全通知注入                           │
└────────────┬────────────────────────────┘
             ▼
┌─────────────────────────────────────────┐
│  信任边界 5：供应链（Supply Chain）        │
│  • ClawHub 技能发布（semver、SKILL.md）  │
│  • 模式化审核标记                         │
│  • VirusTotal 扫描（规划中）              │
│  • GitHub 账户年龄验证                    │
└─────────────────────────────────────────┘
```

---

## 4. 认证与授权体系

### Gateway 认证模式

| 模式            | 说明                 | 推荐场景                       |
| --------------- | -------------------- | ------------------------------ |
| `token`         | 共享 Bearer Token    | 大多数部署（推荐）             |
| `password`      | 密码认证             | 简单场景，推荐通过环境变量设置 |
| `trusted-proxy` | 信任身份感知反向代理 | 企业代理部署                   |

Gateway 认证**默认是必需的**——未配置 token/password 时，Gateway 拒绝 WebSocket 连接（失败关闭）。

### DM 访问模型

| 策略              | 行为                                     |
| ----------------- | ---------------------------------------- |
| `pairing`（默认） | 未知发送者收到配对码，1小时过期，待批准  |
| `allowlist`       | 未知发送者直接被阻止                     |
| `open`            | 允许任何人 DM（需 allowlist 包含 `"*"`） |
| `disabled`        | 完全忽略入站 DM                          |

### DM 会话隔离

- **默认**：`session.dmScope: "main"` — 所有 DM 共享一个会话
- **安全模式**：`session.dmScope: "per-channel-peer"` — 每个通道+发送者对隔离
- 多账户场景用 `per-account-channel-peer`

### 模型认证

- 优先使用 API Key（稳定可预测）
- 支持 OAuth 流程和 setup-token
- 凭据存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 支持 SecretRef（env/file/exec provider）

---

## 5. 工具权限与执行控制

### 双层权限系统

```
用户消息 → Agent 决定调用工具
         │
         ▼
  ┌── 层 1：工具可见性 ──┐
  │  AI 能看到该工具吗？  │  ← openclaw.json tools.allow/deny
  └──────────────────────┘
         │ 是
         ▼
  ┌── 层 2：exec 执行权限 ────────────────────┐
  │  该命令被允许执行吗？                       │
  │  openclaw.json tools.exec                  │
  │  + exec-approvals.json                     │
  │  → minSecurity() 取更严格者                 │
  │  → maxAsk() 取更多审批者                    │
  └───────────────────────────────────────────┘
```

### 工具组速查

| 组名               | 包含工具                                                                                          | 说明                                    |
| ------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `group:openclaw`   | web*search, web_fetch, memory*\_, sessions\_\_, browser, canvas, message, cron, gateway, nodes 等 | **不含** read/write/edit/exec           |
| `group:fs`         | read, write, edit, apply_patch                                                                    | 文件系统工具                            |
| `group:runtime`    | exec, process                                                                                     | 运行时工具                              |
| `group:web`        | web_search, web_fetch                                                                             | 网络工具                                |
| `group:automation` | cron, gateway                                                                                     | 自动化工具（建议对不可信内容默认 deny） |

### exec 安全级别

| 级别                 | 行为                             |
| -------------------- | -------------------------------- |
| `deny`（硬编码默认） | 拒绝所有执行                     |
| `allowlist`          | 仅允许白名单 + safeBins 中的命令 |
| `full`               | 允许所有命令                     |

### 子代理权限陷阱

子代理 agentId 格式为 `agent:<id>:subagent:<uuid>`，在 `exec-approvals.json` 无对应记录时 fallback 到 `defaults`。若 `defaults` 为空 `{}`，则 `minSecurity("full", "deny") = "deny"`，子代理一律无法执行。

---

## 6. 沙箱隔离

### 沙箱模式

| 模式       | 说明             |
| ---------- | ---------------- |
| `off`      | 无沙箱           |
| `non-main` | 仅非主会话沙箱化 |
| `all`      | 所有会话沙箱化   |

### 沙箱范围

| 范围              | 说明                     |
| ----------------- | ------------------------ |
| `session`（默认） | 每会话一个容器           |
| `agent`           | 每 Agent 一个容器        |
| `shared`          | 所有沙箱会话共享一个容器 |

### 工作区访问

| 级别           | 说明                                  |
| -------------- | ------------------------------------- |
| `none`（默认） | 工具在 `~/.openclaw/sandboxes` 中操作 |
| `ro`           | 只读挂载 Agent 工作区到 `/agent`      |
| `rw`           | 读写挂载 Agent 工作区到 `/workspace`  |

### 关键安全约束

- 沙箱容器默认**无网络**（`docker.network: "none"`）
- `network: "host"` 被阻止
- `network: "container:<id>"` 默认被阻止（命名空间连接风险）
- `tools.elevated` 是显式逃逸通道——始终在主机上运行，绕过沙箱
- 自定义 bind mount 会绕过沙箱文件系统

---

## 7. 形式化验证

项目维护基于 TLA+/TLC 的**形式化安全模型**，提供机器检查的安全回归套件。

### 已验证的安全属性

| 属性                       | 声明                                                                      |
| -------------------------- | ------------------------------------------------------------------------- |
| Gateway 暴露与开放网关误配 | 绑定超出 loopback 且无认证可导致远程入侵；token/password 阻止未认证攻击者 |
| nodes.run 管道             | 需要节点命令白名单 + 声明命令 + 配置时需实时审批；审批令牌化防重放        |
| 配对存储                   | 配对请求遵守 TTL 和待处理请求上限                                         |
| 入口门控                   | 需要 mention 的群组中，未授权"控制命令"无法绕过 mention 门控              |
| 路由/会话隔离              | 不同对端的 DM 不会塌陷到同一会话（除非显式配置）                          |
| 并发安全                   | 配对存储并发下 MaxPending 和幂等性；入口追踪相关性和幂等性                |

模型仓库：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)

---

## 8. 状态目录权限加固

### 推荐权限

| 对象                      | Unix 等价 | 说明               |
| ------------------------- | --------- | ------------------ |
| `~/.openclaw`（状态目录） | `700`     | 仅当前用户读写执行 |
| `openclaw.json`           | `600`     | 仅当前用户读写     |
| `credentials/`            | `700`     | 仅当前用户读写执行 |
| `auth-profiles.json`      | `600`     | 仅当前用户读写     |
| `sessions/*.json`         | `600`     | 仅当前用户读写     |

### 快速修复

```bash
openclaw security audit --deep    # 检查所有问题
openclaw security audit --fix     # 自动修复（Unix: chmod / Windows: icacls）
```

### 敏感文件清单

| 路径                                   | 内容                                    |
| -------------------------------------- | --------------------------------------- |
| `openclaw.json`                        | 配置（含 token、provider 设置、白名单） |
| `credentials/**`                       | 通道凭据（WhatsApp、OAuth、配对白名单） |
| `agents/<id>/agent/auth-profiles.json` | API 密钥、token、OAuth 令牌             |
| `secrets.json`                         | 文件型密钥载荷                          |
| `agents/<id>/sessions/**`              | 会话转录（私密消息、工具输出）          |
| `extensions/**`                        | 已安装插件                              |
| `sandboxes/**`                         | 沙箱工作区                              |

---

## 9. 网络暴露与加固

### 绑定模式

| 模式               | 说明                        |
| ------------------ | --------------------------- |
| `loopback`（默认） | 仅本地客户端可连接          |
| `lan`              | 局域网（需 token + 防火墙） |
| `tailnet`          | Tailscale 网络              |
| `custom`           | 自定义绑定                  |

### 60 秒加固基线

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "替换为长随机 token" },
  },
  session: { dmScope: "per-channel-peer" },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

### 反向代理配置

- 配置 `gateway.trustedProxies` 用于正确的客户端 IP 检测
- 代理应**覆写**（非追加）`X-Forwarded-For`
- 默认忽略 `X-Real-IP`（除非显式启用 `allowRealIpFallback`）

### mDNS/Bonjour 发现

- `minimal`（默认推荐）：省略 `cliPath` 和 `sshPort`
- `off`：完全禁用
- `full`：暴露所有元数据（含文件路径、SSH 端口——侦察风险）

---

## 10. 提示注入防御

### 核心认知

提示注入**尚未被解决**——系统提示护栏是软指导，硬执行来自工具策略、exec 审批、沙箱和通道白名单。

### 防御策略

1. **锁定入站 DM**（配对/白名单）
2. **群组中优先 mention 门控**
3. **将链接、附件、粘贴指令视为敌对**
4. **敏感工具执行在沙箱中运行**
5. **限制高风险工具**（exec、browser、web_fetch、web_search）
6. **模型选择至关重要**：工具型 Agent 使用最强最新代模型

### 重要：提示注入不需要公开 DM

即使只有操作者能发消息，Bot 读取的任何**不可信内容**（搜索结果、网页、邮件、附件）都可能携带对抗性指令。

### 不安全外部内容绕过标志

以下标志应在生产环境保持关闭：

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload 字段 `allowUnsafeExternalContent`

---

## 11. 供应链安全

### ClawHub 现有安全控制

| 控制                | 有效性               |
| ------------------- | -------------------- |
| GitHub 账户年龄验证 | 中——提高新攻击者门槛 |
| 路径净化            | 高——防止路径遍历     |
| 文件类型验证        | 中——仅文本文件       |
| 大小限制（50MB）    | 高——防止资源耗尽     |
| 模式审核（regex）   | 低——简单正则易绕过   |
| 审核状态字段        | 中——可人工审查       |

### 计划改进

- VirusTotal Code Insight 集成（进行中）
- 社区举报
- 技能沙箱化
- 更新签名与版本固定

### 插件安全

- 插件**进程内**运行——视为可信代码
- 优先使用 `plugins.allow` 白名单
- npm 安装的插件需固定版本（`@scope/pkg@1.2.3`）
- 安装路径 `~/.openclaw/extensions/<pluginId>/`

---

## 12. 事件响应

### 遏制

1. 停止 Gateway 进程
2. 设置 `gateway.bind: "loopback"`
3. 切换 DM/群组到 `dmPolicy: "disabled"` / require mentions

### 轮换（假设密钥泄露时）

1. 轮换 Gateway auth（`gateway.auth.token`）
2. 轮换远程客户端密钥（`gateway.remote.token`）
3. 轮换 Provider/API 凭据

### 审计

1. 检查 Gateway 日志
2. 审查会话转录
3. 审查近期配置变更
4. 重新运行 `openclaw security audit --deep`

---

## 13. Agent-First 架构与安全

Agent-First 架构以 AI Agent 为第一消费者，分五层：

| 层         | 目录               | 面向         | 安全相关                               |
| ---------- | ------------------ | ------------ | -------------------------------------- |
| Agent 接口 | `openclaw-plugin/` | AI Agent     | Tool 注册与参数 Schema 约束            |
| 业务核心   | `lib/`             | 所有消费者   | 零框架依赖，纯函数导出                 |
| 人类 CLI   | `bin/`             | 人类用户     | 独立入口，不绑定 Agent 框架            |
| 开发工具链 | `cli/`             | 开发者       | 自动化构建、版本同步、发布             |
| 扩展技能   | `skills/`          | Agent + 用户 | 技能注册表（静态 JSON），发现→安装闭环 |

### 安全设计要点

- Tool 的 `parameters` 使用 JSON Schema 严格定义输入——Agent 的接口契约
- `{ optional: true }` 标记可选工具，缺少依赖不阻断加载
- Service 有完整生命周期（start/stop），资源可靠清理
- 技能注册表是静态 JSON，无运行时一致性问题
- 安装脚本支持多源降级（主站 CDN → GitHub Raw → GitHub Release）

---

## 14. Gateway 网关架构

### 核心架构

- 单个长期运行的 Gateway 拥有所有消息平台连接
- 控制平面客户端通过 WebSocket 连接（默认 `127.0.0.1:18789`）
- 节点以 `role: node` 连接，声明能力/命令
- 线路协议：WebSocket + JSON 文本帧
- 握手强制（非 JSON 或非 connect 的第一帧 → 硬关闭）

### 配对与本地信任

- 所有 WS 客户端在 `connect` 时提供设备身份
- 新设备需配对批准，Gateway 为后续连接颁发设备令牌
- **本地连接**（loopback）可自动批准
- **非本地连接**必须签名 challenge nonce 并需显式批准
- Gateway 认证（`gateway.auth.*`）适用于所有连接

### 不变量

- 每台主机恰好一个 Gateway
- 握手是强制的
- 事件不重放——客户端必须在间隙时刷新

---

## 15. 文档索引

### 核心安全文档

| 文件路径                                     | 内容                                                         |
| -------------------------------------------- | ------------------------------------------------------------ |
| `docs/gateway/security/index.md`             | 安全总指南：信任模型、加固基线、审计清单、凭据存储、事件响应 |
| `docs/cli/security.md`                       | `openclaw security` 命令参考（audit/fix）                    |
| `docs/security/README.md`                    | 安全文档入口                                                 |
| `docs/security/THREAT-MODEL-ATLAS.md`        | MITRE ATLAS 威胁模型（完整威胁分析 + 风险矩阵）              |
| `docs/security/CONTRIBUTING-THREAT-MODEL.md` | 威胁模型贡献指南                                             |
| `docs/security/formal-verification.md`       | TLA+/TLC 形式化验证模型                                      |

### 认证与授权

| 文件路径                             | 内容                                  |
| ------------------------------------ | ------------------------------------- |
| `docs/gateway/authentication.md`     | 模型认证（OAuth/API Key/setup-token） |
| `docs/gateway/trusted-proxy-auth.md` | 可信代理认证                          |
| `docs/concepts/oauth.md`             | OAuth 概念                            |
| `docs/concepts/session.md`           | DM 安全、会话隔离                     |

### 沙箱与工具策略

| 文件路径                                             | 内容                                  |
| ---------------------------------------------------- | ------------------------------------- |
| `docs/gateway/sandboxing.md`                         | 沙箱模式、范围、工作区访问、镜像      |
| `docs/gateway/sandbox-vs-tool-policy-vs-elevated.md` | 沙箱 vs 工具策略 vs elevated 决策模型 |
| `docs/cli/sandbox.md`                                | 沙箱 CLI 命令                         |
| `docs/tools/elevated.md`                             | 提升权限工具                          |

### 架构文档

| 文件路径                                  | 内容                     |
| ----------------------------------------- | ------------------------ |
| `docs/zh-CN/concepts/architecture.md`     | Gateway 网关架构（中文） |
| `docs/gateway/configuration.md`           | Gateway 配置             |
| `docs/gateway/configuration-reference.md` | 配置参考                 |

### Prism 知识库已有 journal 文档

| 文件路径                                                               | 内容                             |
| ---------------------------------------------------------------------- | -------------------------------- |
| `docs/prism/journal/2026-02-27/permission-settings-guide.md`           | 权限设置指南                     |
| `docs/prism/journal/2026-03-01/agent-first-architecture.md`            | Agent-First 架构                 |
| `docs/prism/journal/2026-03-01/agent-first-architecture-upgrade.md`    | Agent-First 架构升级             |
| `docs/prism/journal/2026-03-05/openclaw-permissions-guide.md`          | 权限配置完全指南（双层权限系统） |
| `docs/prism/journal/2026-03-06/openclaw-security-permissions-guide.md` | 状态目录权限加固指南             |
| `docs/prism/journal/2026-02-22/knowledge-base-architecture-design.md`  | 知识库架构设计                   |

### Prism 金字塔分析文档

| 文件路径                                                                   | 内容               |
| -------------------------------------------------------------------------- | ------------------ |
| `docs/prism/pyramid/analysis/groups/G07-defense-in-depth-security.md`      | 纵深防御安全       |
| `docs/prism/pyramid/analysis/groups/G11-infrastructure-secure-defaults.md` | 基础设施安全默认值 |
| `docs/prism/pyramid/analysis/groups/G28-openclaw-core-architecture.md`     | OpenClaw 核心架构  |
| `docs/prism/pyramid/analysis/groups/G39-exec-approval-mechanism.md`        | Exec 审批机制      |
| `docs/prism/pyramid/analysis/groups/G44-state-dir-permission-hardening.md` | 状态目录权限加固   |

### 其他安全相关

| 文件路径                            | 内容                       |
| ----------------------------------- | -------------------------- |
| `docs/automation/webhook.md`        | Webhook 认证与安全         |
| `docs/channels/groups.md`           | 群组策略、白名单、注入防护 |
| `docs/channels/pairing.md`          | 配对与授权                 |
| `docs/platforms/mac/permissions.md` | macOS 权限                 |

### 关键安全源码文件

| 路径                                | 用途         | 风险级别 |
| ----------------------------------- | ------------ | -------- |
| `src/infra/exec-approvals.ts`       | 命令审批逻辑 | Critical |
| `src/gateway/auth.ts`               | Gateway 认证 | Critical |
| `src/web/inbound/access-control.ts` | 通道访问控制 | Critical |
| `src/infra/net/ssrf.ts`             | SSRF 防护    | Critical |
| `src/security/external-content.ts`  | 提示注入缓解 | Critical |
| `src/agents/sandbox/tool-policy.ts` | 工具策略执行 | Critical |
| `src/routing/resolve-route.ts`      | 会话隔离     | Medium   |

---

_本文档整理自 OpenClaw 项目中所有安全与架构相关的 Markdown 文档，作为安全架构原理的统一索引与速查参考。最后更新：2026-03-17。_
