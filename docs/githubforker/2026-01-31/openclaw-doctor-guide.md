# OpenClaw Doctor 命令指引

## 概述

`openclaw doctor` 是 OpenClaw 的诊断与修复工具，用于检测配置问题、执行状态迁移、检查系统健康状况，并提供可操作的修复步骤。它是排查和解决 OpenClaw 问题的首选工具。

## 快速开始

```bash
# 基础用法（交互模式）
pnpm openclaw doctor

# 自动接受默认选项
pnpm openclaw doctor --yes

# 应用推荐修复（无需确认）
pnpm openclaw doctor --repair

# 强制修复（包括覆盖自定义配置）
pnpm openclaw doctor --repair --force

# 非交互模式（仅安全迁移）
pnpm openclaw doctor --non-interactive

# 深度扫描（检测额外的网关安装）
pnpm openclaw doctor --deep
```

## 命令选项

| 选项                       | 说明                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| `--yes`                    | 自动接受默认选项，无需交互确认                                       |
| `--repair`                 | 应用推荐的修复操作，无需提示确认                                     |
| `--force`                  | 与 `--repair` 一起使用，执行激进修复（如覆盖自定义 supervisor 配置） |
| `--non-interactive`        | 无提示运行，仅执行安全的配置规范化和磁盘状态迁移                     |
| `--deep`                   | 深度扫描系统服务，检测额外的网关安装（launchd/systemd/schtasks）     |
| `--generate-gateway-token` | 强制生成网关认证 token                                               |

## 功能模块详解

### 1. 可选更新检查（Git 安装）

如果是 Git checkout 安装，doctor 会在交互模式下提供更新选项（fetch/rebase/build）。

### 2. UI 协议新鲜度检查

检查 Control UI 资源是否过时：

- 如果 `src/gateway/protocol/schema.ts` 比 `dist/control-ui/index.html` 更新
- 提示是否需要重新构建 UI 资源
- 运行 `pnpm ui:build` 进行重建

### 3. 配置规范化

将旧版配置值格式转换为当前 schema：

- 自动检测 legacy 配置格式
- 提示或自动迁移到新格式
- 保留备份文件 `~/.openclaw/openclaw.json.bak`

### 4. 旧版配置键迁移

支持的迁移路径：

| 旧路径                                    | 新路径                                                          |
| ----------------------------------------- | --------------------------------------------------------------- |
| `routing.allowFrom`                       | `channels.whatsapp.allowFrom`                                   |
| `routing.groupChat.requireMention`        | `channels.whatsapp/telegram/imessage.groups."*".requireMention` |
| `routing.groupChat.historyLimit`          | `messages.groupChat.historyLimit`                               |
| `routing.groupChat.mentionPatterns`       | `messages.groupChat.mentionPatterns`                            |
| `routing.queue`                           | `messages.queue`                                                |
| `routing.bindings`                        | 顶层 `bindings`                                                 |
| `routing.agents`/`routing.defaultAgentId` | `agents.list` + `agents.list[].default`                         |
| `routing.agentToAgent`                    | `tools.agentToAgent`                                            |
| `routing.transcribeAudio`                 | `tools.media.audio.models`                                      |
| `identity`                                | `agents.list[].identity`                                        |
| `agent.*`                                 | `agents.defaults` + `tools.*`                                   |

### 5. OpenCode Zen Provider 覆盖警告

检测并警告手动设置的 `models.providers.opencode` 或 `models.providers.opencode-zen`：

- 这些覆盖会屏蔽内置的 API 路由和成本计算
- 建议移除以恢复默认行为

### 6. 旧版状态迁移（磁盘布局）

自动迁移旧的磁盘布局：

| 迁移内容      | 来源                             | 目标                                            |
| ------------- | -------------------------------- | ----------------------------------------------- |
| Sessions 存储 | `~/.openclaw/sessions/`          | `~/.openclaw/agents/<agentId>/sessions/`        |
| Agent 目录    | `~/.openclaw/agent/`             | `~/.openclaw/agents/<agentId>/agent/`           |
| WhatsApp 认证 | `~/.openclaw/credentials/*.json` | `~/.openclaw/credentials/whatsapp/<accountId>/` |

### 7. 状态完整性检查

检查关键目录和文件的状态：

#### 检查项目

- **状态目录缺失**: 警告并提示创建 `~/.openclaw/`
- **状态目录权限**: 验证可写性，提供 `chown` 修复建议
- **Sessions 目录缺失**: 检查必需的 sessions 和 store 目录
- **Transcript 不匹配**: 警告最近 session 条目缺少对应的 transcript 文件
- **主 Session 单行**: 标记只有一行的主 transcript（历史记录未累积）
- **多状态目录**: 警告存在多个 `~/.openclaw` 目录
- **远程模式提醒**: 如果 `gateway.mode=remote`，提醒在远程主机运行 doctor
- **配置文件权限**: 警告 `openclaw.json` 权限过于开放（建议 chmod 600）

### 8. 模型认证健康检查

检查 OAuth profiles 状态：

- 检测过期/即将过期的 tokens
- 提供刷新选项（交互模式）
- 报告 cooldown 或 disabled 状态的 profiles
- 针对 Anthropic Claude Code profile，建议运行 `claude setup-token`

### 9. Hooks 模型验证

如果设置了 `hooks.gmail.model`，验证：

- 模型引用是否在 catalog 中
- 是否在 allowlist 中

### 10. 沙箱镜像修复

当启用 sandboxing 时：

- 检查 Docker 是否可用
- 验证配置的镜像是否存在
- 提供构建或切换到旧版镜像名的选项

```bash
# 构建沙箱镜像
scripts/sandbox-setup.sh           # 基础镜像
scripts/sandbox-browser-setup.sh   # 浏览器镜像
```

### 11. 网关服务迁移和清理

- 检测旧版网关服务（launchd/systemd/schtasks）
- 提供移除和重新安装选项
- 扫描额外的网关类服务并提供清理建议
- Profile 命名的 OpenClaw 网关服务被视为一等公民，不会被标记为"额外"

### 12. 安全警告

检查安全配置：

- **网关网络暴露**: 检测危险的绑定配置（非 loopback 且无认证）
- **DM 策略**: 警告开放的 DM 策略（policy="open"）
- **Allowlist**: 检查是否配置了发送者白名单
- **Session 范围**: 建议为多用户场景设置 `session.dmScope="per-channel-peer"`

```bash
# 运行深度安全审计
openclaw security audit --deep
```

### 13. systemd Linger（Linux）

在 Linux 上运行 systemd 用户服务时：

- 确保启用 lingering
- 防止登出/空闲后 systemd 停止用户 session

### 14. Skills 状态汇总

打印当前工作区的 skills 状态：

- eligible（可用）
- missing（缺失）
- blocked（阻塞）

### 15. 网关认证检查

当本地网关缺少 `gateway.auth` 时：

- 发出警告
- 提供生成 token 的选项

### 16. 网关健康检查与重启

- 运行健康检查
- 当网关不健康时提供重启选项

### 17. 频道状态警告

如果网关健康，运行频道状态探测并报告：

- 连接问题
- 配置问题
- 建议的修复方案

### 18. Supervisor 配置审计与修复

检查已安装的 supervisor 配置：

- launchd（macOS）
- systemd（Linux）
- schtasks（Windows）

检测缺失或过时的默认值，如：

- systemd 网络依赖
- 重启延迟配置

### 19. 网关运行时最佳实践

警告以下情况：

- 使用 Bun 运行网关服务
- 使用版本管理器路径（nvm/fnm/volta/asdf）
- 建议迁移到系统 Node 安装（Homebrew/apt/choco）

### 20. 网关端口诊断

检查默认端口 `18789`：

- 端口冲突检测
- 报告可能的原因（如网关已运行、SSH 隧道）

### 21. 配置写入与向导元数据

- 持久化配置变更
- 记录 doctor 运行的向导元数据

### 22. 工作区提示

- 建议工作区记忆系统（如缺失）
- 提示 git 备份（如工作区未纳入版本控制）

## 使用场景

### 场景 1: 首次安装后检查

```bash
pnpm openclaw doctor
```

检查配置完整性，确保所有必需目录存在。

### 场景 2: 升级后修复

```bash
pnpm openclaw doctor --repair
```

自动应用配置迁移和修复。

### 场景 3: CI/CD 环境

```bash
pnpm openclaw doctor --non-interactive
```

仅执行安全迁移，不进行交互提示。

### 场景 4: 深度诊断

```bash
pnpm openclaw doctor --deep
```

扫描系统服务，检测额外的网关安装。

### 场景 5: 强制重新配置

```bash
pnpm openclaw doctor --repair --force
```

覆盖自定义配置，强制应用默认设置。

## 输出解读

### Doctor changes

显示已应用的变更：

```
╭─ Doctor changes ─────────────────────────────────────────────╮
│ - routing.allowFrom → channels.whatsapp.allowFrom            │
│ - Created ~/.openclaw/agents/default/sessions/               │
╰──────────────────────────────────────────────────────────────╯
```

### Doctor warnings

显示需要关注的警告：

```
╭─ Doctor warnings ────────────────────────────────────────────╮
│ - Legacy folder left behind: ~/.openclaw/sessions.bak        │
│ - Config file is group/world readable                        │
╰──────────────────────────────────────────────────────────────╯
```

### Security

显示安全相关的警告：

```
╭─ Security ───────────────────────────────────────────────────╮
│ - WARNING: Gateway bound to "lan" (192.168.1.100)            │
│ - WhatsApp DMs: OPEN (policy="open"). Anyone can DM it.      │
╰──────────────────────────────────────────────────────────────╯
```

## 相关命令

| 命令                                | 说明               |
| ----------------------------------- | ------------------ |
| `openclaw configure`                | 交互式配置向导     |
| `openclaw config set <key> <value>` | 直接设置配置值     |
| `openclaw gateway install`          | 安装网关服务       |
| `openclaw gateway install --force`  | 强制重写服务文件   |
| `openclaw channels status --probe`  | 检查频道状态       |
| `openclaw security audit --deep`    | 深度安全审计       |
| `openclaw models auth setup-token`  | 设置模型认证 token |

## 最佳实践

1. **定期运行**: 建议在升级后或遇到问题时运行 `openclaw doctor`
2. **查看配置**: 修复前可先查看当前配置 `cat ~/.openclaw/openclaw.json`
3. **备份意识**: doctor 会创建 `.bak` 备份文件
4. **权限管理**: 确保状态目录权限为 700，配置文件权限为 600
5. **远程模式**: 如使用远程网关，需在远程主机运行 doctor

## 故障排除

### 问题: doctor 报告旧版配置

```bash
# 应用迁移
pnpm openclaw doctor --fix
```

### 问题: 网关服务未运行

```bash
# 检查服务状态
launchctl print gui/$UID | grep openclaw  # macOS
systemctl --user status openclaw-gateway   # Linux

# 重新安装服务
pnpm openclaw gateway install
```

### 问题: 权限错误

```bash
# 修复状态目录权限
chmod 700 ~/.openclaw
chmod 600 ~/.openclaw/openclaw.json
```

### 问题: 多个状态目录

检查 `OPENCLAW_STATE_DIR` 环境变量设置，确保只有一个活动的状态目录。

## 源码位置

主要实现文件位于 `src/commands/` 目录：

| 文件                         | 功能              |
| ---------------------------- | ----------------- |
| `doctor.ts`                  | 主入口和流程编排  |
| `doctor-prompter.ts`         | 交互提示器        |
| `doctor-config-flow.ts`      | 配置迁移流程      |
| `doctor-state-integrity.ts`  | 状态完整性检查    |
| `doctor-state-migrations.ts` | 磁盘布局迁移      |
| `doctor-security.ts`         | 安全警告检查      |
| `doctor-sandbox.ts`          | 沙箱镜像修复      |
| `doctor-gateway-health.ts`   | 网关健康检查      |
| `doctor-gateway-services.ts` | 网关服务管理      |
| `doctor-auth.ts`             | 认证 profile 管理 |
| `doctor-ui.ts`               | UI 协议检查       |
| `doctor-update.ts`           | Git 安装更新      |
