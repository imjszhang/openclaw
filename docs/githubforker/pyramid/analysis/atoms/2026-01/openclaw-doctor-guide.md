# OpenClaw Doctor 命令指引

> 来源：[../../../../journal/2026-01-31/openclaw-doctor-guide.md](../../../../journal/2026-01-31/openclaw-doctor-guide.md)
> 缩写：OD

## Atoms

| 编号  | 类型 | 内容                                                                                                          | 原文定位                 |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------- | ------------------------ |
| OD-01 | 事实 | `openclaw doctor` 是 OpenClaw 的诊断与修复工具，用于检测配置问题、执行状态迁移、检查系统健康状况              | 概述                     |
| OD-02 | 步骤 | 基础用法：`pnpm openclaw doctor`（交互模式），`--yes` 自动接受默认，`--repair` 应用推荐修复                   | 快速开始                 |
| OD-03 | 步骤 | 强制修复命令：`pnpm openclaw doctor --repair --force` 可覆盖自定义配置                                        | 快速开始                 |
| OD-04 | 事实 | `--deep` 选项用于深度扫描系统服务，检测额外的网关安装（launchd/systemd/schtasks）                             | 命令选项                 |
| OD-05 | 经验 | Git 安装时 doctor 会在交互模式下提供更新选项（fetch/rebase/build）                                            | 1. 可选更新检查          |
| OD-06 | 事实 | UI 协议新鲜度检查：若 schema.ts 比 index.html 更新，提示运行 `pnpm ui:build` 重建                             | 2. UI 协议新鲜度检查     |
| OD-07 | 事实 | 配置规范化会自动检测 legacy 格式并迁移，备份文件为 `~/.openclaw/openclaw.json.bak`                            | 3. 配置规范化            |
| OD-08 | 事实 | 旧版配置键迁移：`routing.allowFrom` → `channels.whatsapp.allowFrom` 等 10+ 项迁移路径                         | 4. 旧版配置键迁移        |
| OD-09 | 经验 | OpenCode Zen Provider 手动覆盖会屏蔽内置 API 路由和成本计算，建议移除                                         | 5. OpenCode Zen 覆盖警告 |
| OD-10 | 事实 | 旧版状态迁移：Sessions 从 `~/.openclaw/sessions/` 移至 `~/.openclaw/agents/<agentId>/sessions/`               | 6. 旧版状态迁移          |
| OD-11 | 事实 | 状态完整性检查包含 7 项：目录缺失、权限、sessions 目录、transcript 匹配、多状态目录等                         | 7. 状态完整性检查        |
| OD-12 | 经验 | 配置文件权限建议：`openclaw.json` 设为 600，状态目录设为 700                                                  | 7. 状态完整性检查        |
| OD-13 | 事实 | 模型认证健康检查检测 OAuth tokens 过期状态，Anthropic profile 过期建议运行 `claude setup-token`               | 8. 模型认证健康检查      |
| OD-14 | 步骤 | 沙箱镜像修复：运行 `scripts/sandbox-setup.sh` 构建基础镜像，`scripts/sandbox-browser-setup.sh` 构建浏览器镜像 | 10. 沙箱镜像修复         |
| OD-15 | 事实 | 网关服务迁移检测旧版 launchd/systemd/schtasks 服务，提供移除和重新安装选项                                    | 11. 网关服务迁移和清理   |
| OD-16 | 事实 | 安全警告检查四项：网关网络暴露、DM 策略开放、allowlist 缺失、session 范围未设置                               | 12. 安全警告             |
| OD-17 | 步骤 | 深度安全审计命令：`openclaw security audit --deep`                                                            | 12. 安全警告             |
| OD-18 | 经验 | Linux systemd 用户服务需启用 lingering，防止登出后服务停止                                                    | 13. systemd Linger       |
| OD-19 | 事实 | Skills 状态汇总打印 eligible（可用）、missing（缺失）、blocked（阻塞）三类状态                                | 14. Skills 状态汇总      |
| OD-20 | 事实 | 网关运行时最佳实践警告：避免使用 Bun、版本管理器路径（nvm/fnm/volta），建议用系统 Node                        | 19. 网关运行时最佳实践   |
| OD-21 | 经验 | 定期运行 doctor 建议在升级后或遇到问题时执行，修复前可先查看配置                                              | 最佳实践                 |
| OD-22 | 步骤 | 权限修复命令：`chmod 700 ~/.openclaw` 和 `chmod 600 ~/.openclaw/openclaw.json`                                | 故障排除                 |
| OD-23 | 事实 | doctor 源码主要实现文件位于 `src/commands/` 目录，包含 12 个模块文件                                          | 源码位置                 |
| OD-24 | 经验 | 远程网关模式（gateway.mode=remote）需在远程主机运行 doctor                                                    | 最佳实践                 |
