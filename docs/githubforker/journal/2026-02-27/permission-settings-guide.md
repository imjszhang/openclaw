# OpenClaw 权限设置指南

> 编写日期：2026-02-27  
> 适用场景：exec 执行、命令、渠道访问、工具可见性等权限与安全策略配置

---

## 目录

1. [配置位置与结构](#1-配置位置与结构)
2. [工具执行 (tools.exec)](#2-工具执行-toolsexec)
3. [Elevated 特权执行 (tools.elevated)](#3-elevated-特权执行-toolselevated)
4. [跨 Agent 调用 (tools.agentToAgent)](#4-跨-agent-调用-toolsagenttoagent)
5. [会话可见性 (tools.sessions)](#5-会话可见性-toolssessions)
6. [文件系统守卫 (tools.fs)](#6-文件系统守卫-toolsfs)
7. [命令权限 (commands)](#7-命令权限-commands)
8. [渠道访问策略 (channels)](#8-渠道访问策略-channels)
9. [「全部开放」快速配置](#9-全部开放快速配置)
10. [CLI 操作与验证](#10-cli-操作与验证)
11. [相关文档](#11-相关文档)

---

## 1. 配置位置与结构

主配置文件：`~/.openclaw/openclaw.json`（JSON5 格式，支持注释和尾逗号）。

```bash
# 查看当前配置
pnpm openclaw config get tools
pnpm openclaw config get commands
```

---

## 2. 工具执行 (tools.exec)

控制 shell 命令的执行主机、安全策略与审批行为。

| 配置项                | 可选值                           | 默认                   | 说明                                           |
| --------------------- | -------------------------------- | ---------------------- | ---------------------------------------------- |
| `tools.exec.host`     | `sandbox` \| `gateway` \| `node` | `sandbox`              | 执行主机；`gateway` 在宿主机，`sandbox` 在沙箱 |
| `tools.exec.security` | `deny` \| `allowlist` \| `full`  | `deny`（gateway/node） | 执行策略：`full` 允许全部                      |
| `tools.exec.ask`      | `off` \| `on-miss` \| `always`   | `on-miss`              | 审批：`off` 不弹窗，`on-miss` 白名单外弹窗     |

```bash
# 允许全部执行（无白名单、无弹窗）
pnpm openclaw config set tools.exec.security full
pnpm openclaw config set tools.exec.ask off
```

**安全层级：**

- `deny`：禁止所有 host exec
- `allowlist`：仅允许白名单内的命令；需配合 `~/.openclaw/exec-approvals.json` 中的 allowlist
- `full`：允许任意执行，等同于完全开放

---

## 3. Elevated 特权执行 (tools.elevated)

控制 `/elevated`、`!`、`/bash` 等特权命令的启用与发送者白名单。

| 配置项                     | 类型                         | 说明                                |
| -------------------------- | ---------------------------- | ----------------------------------- |
| `tools.elevated.enabled`   | `boolean`                    | 是否启用 elevated 路径，默认 `true` |
| `tools.elevated.allowFrom` | `Record<provider, string[]>` | 按渠道的发送者 ID 白名单            |

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        feishu: ["*"],
        discord: ["user:123456789012345678"],
        "*": ["*"],
      },
    },
  },
}
```

`allowFrom` 的 key 为渠道 ID（如 `feishu`、`discord`）；`"*"` 可作为通配渠道。`["*"]` 表示该渠道下所有发送者均允许。

---

## 4. 跨 Agent 调用 (tools.agentToAgent)

控制一个 Agent 是否可调用其他 Agent。

| 配置项                       | 类型       | 说明                                           |
| ---------------------------- | ---------- | ---------------------------------------------- |
| `tools.agentToAgent.enabled` | `boolean`  | 是否启用 agent-to-agent 工具，默认 `false`     |
| `tools.agentToAgent.allow`   | `string[]` | 可被调用的目标 Agent ID 列表；`["*"]` 表示全部 |

```json5
{
  tools: {
    agentToAgent: {
      enabled: true,
      allow: ["*"],
    },
  },
}
```

---

## 5. 会话可见性 (tools.sessions)

控制 `sessions_list`、`sessions_history`、`sessions_send` 等工具可访问的会话范围。

| 配置项                      | 可选值                               | 默认   | 说明     |
| --------------------------- | ------------------------------------ | ------ | -------- |
| `tools.sessions.visibility` | `self` \| `tree` \| `agent` \| `all` | `tree` | 可见范围 |

- `self`：仅当前会话
- `tree`：当前会话 + 由其创建的子会话
- `agent`：当前 Agent 下的所有会话
- `all`：所有会话（跨 Agent）

```bash
pnpm openclaw config set tools.sessions.visibility all
```

---

## 6. 文件系统守卫 (tools.fs)

控制 read/write/edit/apply_patch 等文件系统工具是否限于工作区。

| 配置项                   | 类型      | 默认    | 说明                                  |
| ------------------------ | --------- | ------- | ------------------------------------- |
| `tools.fs.workspaceOnly` | `boolean` | `false` | 若为 `true`，仅允许访问工作区内的路径 |

```json5
{
  tools: {
    fs: {
      workspaceOnly: false,
    },
  },
}
```

`apply_patch` 另有独立配置 `tools.exec.applyPatch.workspaceOnly`（默认 `true`）。

---

## 7. 命令权限 (commands)

控制斜杠命令、bash 命令、配置写回等的启用与访问策略。

| 配置项                     | 类型      | 默认    | 说明                                          |
| -------------------------- | --------- | ------- | --------------------------------------------- |
| `commands.bash`            | `boolean` | `false` | 是否允许 `! <cmd>` / `/bash` 在主机执行 shell |
| `commands.config`          | `boolean` | `false` | 是否允许 `/config` 读写磁盘配置               |
| `commands.debug`           | `boolean` | `false` | 是否允许 `/debug` 做运行时覆盖                |
| `commands.restart`         | `boolean` | `true`  | 是否允许 `/restart` 与 gateway restart 工具   |
| `commands.useAccessGroups` | `boolean` | `true`  | 是否强制执行访问组/白名单；`false` 可绕过     |

```bash
# 启用所有命令能力（开发/调试用）
pnpm openclaw config set commands.bash true
pnpm openclaw config set commands.config true
pnpm openclaw config set commands.debug true
pnpm openclaw config set commands.useAccessGroups false
```

---

## 8. 渠道访问策略 (channels)

各渠道均有 `dmPolicy`、`groupPolicy`、`allowFrom` 等，控制私聊和群聊访问。

### 8.1 DM 策略 (dmPolicy)

| 值          | 说明                                   |
| ----------- | -------------------------------------- |
| `pairing`   | 未知发送者需配对码，由 owner 审批      |
| `allowlist` | 仅 `allowFrom` 中的发送者              |
| `open`      | 允许任意 DM，**需** `allowFrom: ["*"]` |
| `disabled`  | 忽略所有 DM                            |

### 8.2 群聊策略 (groupPolicy)

| 值          | 说明                          |
| ----------- | ----------------------------- |
| `allowlist` | 仅配置的群组/频道             |
| `open`      | 不限制群组，仅受 mention 规则 |
| `disabled`  | 拒绝所有群消息                |

### 8.3 飞书示例

```bash
pnpm openclaw config set channels.feishu.dmPolicy open
pnpm openclaw config set channels.feishu.allowFrom '["*"]'
pnpm openclaw config set channels.feishu.groupPolicy open
```

**注意：** `dmPolicy: "open"` 时必须包含 `allowFrom: ["*"]`，否则校验会失败。

---

## 9. 「全部开放」快速配置

适用于可信环境、开发调试，将权限全部放宽的参考配置：

```json5
{
  tools: {
    exec: {
      host: "gateway",
      security: "full",
      ask: "off",
    },
    elevated: {
      enabled: true,
      allowFrom: { "*": ["*"] },
    },
    agentToAgent: {
      enabled: true,
      allow: ["*"],
    },
    sessions: {
      visibility: "all",
    },
    fs: {
      workspaceOnly: false,
    },
  },
  commands: {
    bash: true,
    config: true,
    debug: true,
    restart: true,
    useAccessGroups: false,
  },
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
    },
  },
}
```

可通过 Node 脚本批量写入：

```bash
node -e "
const fs = require('fs');
const path = require('path');
const cfgPath = path.join(process.env.HOME, '.openclaw', 'openclaw.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

cfg.tools = cfg.tools || {};
cfg.tools.exec = { host: 'gateway', security: 'full', ask: 'off' };
cfg.tools.elevated = { enabled: true, allowFrom: { '*': ['*'] } };
cfg.tools.agentToAgent = { enabled: true, allow: ['*'] };
cfg.tools.sessions = { visibility: 'all' };
cfg.tools.fs = { workspaceOnly: false };

cfg.commands = cfg.commands || {};
cfg.commands.bash = true;
cfg.commands.config = true;
cfg.commands.debug = true;
cfg.commands.useAccessGroups = false;

if (cfg.channels?.feishu) {
  cfg.channels.feishu.dmPolicy = 'open';
  cfg.channels.feishu.allowFrom = ['*'];
  cfg.channels.feishu.groupPolicy = 'open';
}

fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), 'utf8');
console.log('Config updated.');
"
```

---

## 10. CLI 操作与验证

```bash
# 查看 tools 相关配置
pnpm openclaw config get tools

# 查看 commands 相关配置
pnpm openclaw config get commands

# 修改后需重启 gateway 才能生效
pnpm openclaw gateway restart

# 验证配置与运行状态
pnpm openclaw doctor --non-interactive
pnpm openclaw health
```

---

## 11. 相关文档

- [Exec 工具与审批](https://docs.openclaw.ai/tools/exec)（`/tools/exec`）
- [Exec 审批与白名单](https://docs.openclaw.ai/tools/exec-approvals)（`/tools/exec-approvals`）
- [斜杠命令](https://docs.openclaw.ai/tools/slash-commands)（`/tools/slash-commands`）
- [Gateway 配置参考](https://docs.openclaw.ai/gateway/configuration-reference)（`/gateway/configuration-reference`）
- [日记：exec approvals curl pipe bash blocked](../2026-02-26/exec-approvals-curl-pipe-bash-blocked.md)
