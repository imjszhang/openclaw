# G16: Doctor 诊断工具是保障系统健康与配置规范化的核心防线，具备自动修复与深度审计能力

> 面对频繁的版本迭代和复杂的環境差异，必须依赖 Doctor 命令进行配置迁移、权限校正和服务状态的一致性检查。

## 包含的 Atoms

| 编号  | 来源                  | 内容摘要                                                                                                      |
| ----- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| OD-01 | openclaw-doctor-guide | `openclaw doctor` 是 OpenClaw 的诊断与修复工具，用于检测配置问题、执行状态迁移、检查系统健康状况              |
| OD-02 | openclaw-doctor-guide | 基础用法：`pnpm openclaw doctor`（交互模式），`--yes` 自动接受默认，`--repair` 应用推荐修复                   |
| OD-03 | openclaw-doctor-guide | 强制修复命令：`pnpm openclaw doctor --repair --force` 可覆盖自定义配置                                        |
| OD-04 | openclaw-doctor-guide | `--deep` 选项用于深度扫描系统服务，检测额外的网关安装（launchd/systemd/schtasks）                             |
| OD-05 | openclaw-doctor-guide | Git 安装时 doctor 会在交互模式下提供更新选项（fetch/rebase/build）                                            |
| OD-06 | openclaw-doctor-guide | UI 协议新鲜度检查：若 schema.ts 比 index.html 更新，提示运行 `pnpm ui:build` 重建                             |
| OD-07 | openclaw-doctor-guide | 配置规范化会自动检测 legacy 格式并迁移，备份文件为 `~/.openclaw/openclaw.json.bak`                            |
| OD-08 | openclaw-doctor-guide | 旧版配置键迁移：`routing.allowFrom` → `channels.whatsapp.allowFrom` 等 10+ 项迁移路径                         |
| OD-09 | openclaw-doctor-guide | OpenCode Zen Provider 手动覆盖会屏蔽内置 API 路由和成本计算，建议移除                                         |
| OD-10 | openclaw-doctor-guide | 旧版状态迁移：Sessions 从 `~/.openclaw/sessions/` 移至 `~/.openclaw/agents/<agentId>/sessions/`               |
| OD-11 | openclaw-doctor-guide | 状态完整性检查包含 7 项：目录缺失、权限、sessions 目录、transcript 匹配、多状态目录等                         |
| OD-12 | openclaw-doctor-guide | 配置文件权限建议：`openclaw.json` 设为 600，状态目录设为 700                                                  |
| OD-13 | openclaw-doctor-guide | 模型认证健康检查检测 OAuth tokens 过期状态，Anthropic profile 过期建议运行 `claude setup-token`               |
| OD-14 | openclaw-doctor-guide | 沙箱镜像修复：运行 `scripts/sandbox-setup.sh` 构建基础镜像，`scripts/sandbox-browser-setup.sh` 构建浏览器镜像 |
| OD-15 | openclaw-doctor-guide | 网关服务迁移检测旧版 launchd/systemd/schtasks 服务，提供移除和重新安装选项                                    |
| OD-16 | openclaw-doctor-guide | 安全警告检查四项：网关网络暴露、DM 策略开放、allowlist 缺失、session 范围未设置                               |
| OD-17 | openclaw-doctor-guide | 深度安全审计命令：`openclaw security audit --deep`                                                            |
| OD-18 | openclaw-doctor-guide | Linux systemd 用户服务需启用 lingering，防止登出后服务停止                                                    |
| OD-19 | openclaw-doctor-guide | Skills 状态汇总打印 eligible（可用）、missing（缺失）、blocked（阻塞）三类状态                                |
| OD-20 | openclaw-doctor-guide | 网关运行时最佳实践警告：避免使用 Bun、版本管理器路径（nvm/fnm/volta），建议用系统 Node                        |
| OD-21 | openclaw-doctor-guide | 定期运行 doctor 建议在升级后或遇到问题时执行，修复前可先查看配置                                              |
| OD-22 | openclaw-doctor-guide | 权限修复命令：`chmod 700 ~/.openclaw` 和 `chmod 600 ~/.openclaw/openclaw.json`                                |
| OD-23 | openclaw-doctor-guide | doctor 源码主要实现文件位于 `src/commands/` 目录，包含 12 个模块文件                                          |
| OD-24 | openclaw-doctor-guide | 远程网关模式（gateway.mode=remote）需在远程主机运行 doctor                                                    |

## 组内逻辑顺序

按照“工具定位与基础用法 → 配置迁移与规范化 → 状态与权限检查 → 安全审计与服务管理 → 运行时建议与源码结构”的逻辑顺序排列。
