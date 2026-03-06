# OpenClaw 状态目录权限加固指南

> 文档日期：2026-03-06
>
> 覆盖范围：`~/.openclaw`（或 `$OPENCLAW_STATE_DIR`）权限设置、安全审计、Windows / Unix 双平台修复命令

---

## 目录

1. [背景与风险](#1-背景与风险)
2. [推荐权限一览](#2-推荐权限一览)
3. [一键自动修复](#3-一键自动修复)
4. [Unix / Linux / macOS 手动修复](#4-unix--linux--macos-手动修复)
5. [Windows 手动修复](#5-windows-手动修复)
6. [日常实践](#6-日常实践)
7. [参考](#7-参考)

---

## 1. 背景与风险

OpenClaw 状态目录（默认 `~/.openclaw` 或 `$OPENCLAW_STATE_DIR`，如 `D:\.openclaw`）存放：

- **配置**：`openclaw.json`（含 API 密钥、通道 token、工具策略）
- **凭据**：`credentials/`（OAuth、WhatsApp 等）
- **会话**：`agents/<id>/sessions/`（对话元数据、路由信息）
- **认证**：`agents/<id>/agent/auth-profiles.json`

若目录或文件对「其他用户」可写或可读，则：

- 其他用户可篡改配置、注入凭据
- 其他用户可读取会话与隐私数据

OpenClaw 安全审计（`openclaw security audit --deep`）会检测这些权限问题并给出修复建议。

---

## 2. 推荐权限一览

| 对象                               | Unix 等价 | 说明               |
| ---------------------------------- | --------- | ------------------ |
| `~/.openclaw`（状态目录）          | `700`     | 仅当前用户读写执行 |
| `openclaw.json`                    | `600`     | 仅当前用户读写     |
| `credentials/`                     | `700`     | 仅当前用户读写执行 |
| `auth-profiles.json`               | `600`     | 仅当前用户读写     |
| `sessions/*.json`、`sessions.json` | `600`     | 仅当前用户读写     |
| 配置 include 文件                  | `600`     | 仅当前用户读写     |

---

## 3. 一键自动修复

推荐优先使用 OpenClaw 自带的安全修复：

```bash
openclaw security audit --deep    # 检查所有问题
openclaw security audit --fix     # 自动修复文件系统权限
```

`--fix` 会针对当前平台执行：

- **Unix**：`chmod` 到推荐模式
- **Windows**：`icacls` 收紧 ACL，仅保留当前用户和 SYSTEM

非交互环境可加 `--yes` 跳过确认提示。

---

## 4. Unix / Linux / macOS 手动修复

```bash
# 状态目录
chmod 700 ~/.openclaw

# 主配置
chmod 600 ~/.openclaw/openclaw.json

# 凭据目录
chmod 700 ~/.openclaw/credentials

# 各 Agent 认证配置
chmod 600 ~/.openclaw/agents/*/agent/auth-profiles.json

# 会话存储
chmod 600 ~/.openclaw/agents/*/sessions/sessions.json
```

若使用自定义状态目录，将 `~/.openclaw` 替换为 `$OPENCLAW_STATE_DIR`。

---

## 5. Windows 手动修复

使用 **管理员 PowerShell** 执行。将 `D:\.openclaw` 和 `PC-20250807UZGW\Administrator` 替换为你的实际路径和用户名。

```powershell
# 状态目录（含子目录继承）
icacls "D:\.openclaw" /inheritance:r /grant:r "PC-20250807UZGW\Administrator:(OI)(CI)F" /grant:r "*S-1-5-18:(OI)(CI)F"

# 主配置
icacls "D:\.openclaw\openclaw.json" /inheritance:r /grant:r "PC-20250807UZGW\Administrator:F" /grant:r "*S-1-5-18:F"

# 凭据目录
icacls "D:\.openclaw\credentials" /inheritance:r /grant:r "PC-20250807UZGW\Administrator:(OI)(CI)F" /grant:r "*S-1-5-18:(OI)(CI)F"

# 会话存储（按 Agent 逐个执行）
icacls "D:\.openclaw\agents\main\sessions\sessions.json" /inheritance:r /grant:r "PC-20250807UZGW\Administrator:F" /grant:r "*S-1-5-18:F"
icacls "D:\.openclaw\agents\xiaofei\sessions\sessions.json" /inheritance:r /grant:r "PC-20250807UZGW\Administrator:F" /grant:r "*S-1-5-18:F"
```

说明：

- `(OI)(CI)`：对象与容器继承，用于目录
- `F`：完全控制
- `*S-1-5-18`：SYSTEM 账户，保障服务能访问

用户名获取：`whoami`（如 `PC-20250807UZGW\Administrator`）。

---

## 6. 日常实践

1. **新环境部署后**：执行 `openclaw security audit --deep` 和 `--fix`
2. **迁移状态目录后**：检查目标目录权限，必要时重新执行 `--fix`
3. **定期检查**：配置或通道变更后，可再次运行 `openclaw security audit`
4. **多用户场景**：按 [SECURITY.md](https://docs.openclaw.ai/gateway/security) 建议，每个用户使用独立状态目录和 Gateway

---

## 7. 参考

- 安全审计说明：<https://docs.openclaw.ai/gateway/security>
- 信任模型：`SECURITY.md`（Operator Trust Model、One-User Trust Model）
- 源码：`src/security/audit.ts`、`src/security/audit-fs.ts`、`src/security/fix.ts`、`src/security/windows-acl.ts`
