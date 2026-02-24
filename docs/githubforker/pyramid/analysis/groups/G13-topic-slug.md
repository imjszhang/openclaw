# G13: Fork 管理必须采用“三层分支隔离 + 选择性同步”策略以平衡定制需求与上游演进

> 生产环境的稳定性依赖于将官方代码、同步代码和定制代码物理隔离，并通过保守的合并策略最小化冲突成本。

## 包含的 Atoms

| 编号  | 来源                  | 内容摘要                                                                                    |
| ----- | --------------------- | ------------------------------------------------------------------------------------------- |
| FM-01 | fork-management-guide | OpenClaw 处于 pre-1.0 阶段，官方更新频繁，需要平衡个人定制与生产环境稳定性                  |
| FM-02 | fork-management-guide | 采用 Fork + 分层定制架构可最大化减少与上游冲突，同时保持生产环境稳定                        |
| FM-03 | fork-management-guide | 分支架构三层设计：upstream/main（官方）、origin/main（同步）、origin/production（生产部署） |
| FM-04 | fork-management-guide | 初始化设置：`git remote add upstream` 添加上游远程，创建 production 分支用于生产部署        |
| FM-05 | fork-management-guide | 标准同步流程：fetch upstream → merge upstream/main → push origin → rebase production        |
| FM-06 | fork-management-guide | 推荐使用选择性同步（cherry-pick）而非全量合并，可选择性应用重要提交                         |
| FM-07 | fork-management-guide | 合并冲突处理：package.json 保留上游依赖版本合并定制依赖，核心源码保留//CUSTOM 标记代码      |
| FM-08 | fork-management-guide | 生产环境推荐使用源码安装（git）而非 npm 全局安装或 Docker，便于定制                         |
| FM-09 | fork-management-guide | 首次部署必需设置 gateway.mode=local 和 gateway.auth.token，否则网关无法启动                 |
| FM-10 | fork-management-guide | AI 模型配置是必需的，推荐使用`pnpm openclaw onboard`交互式向导配置                          |
| FM-11 | fork-management-guide | Windows 环境 pnpm build 失败是因为 bash 默认解析到 WSL 而非 Git Bash                        |
| FM-12 | fork-management-guide | Windows 解决方案：在.npmrc 中配置`script-shell=<Git 安装目录>\bin\bash.exe`                 |
| FM-13 | fork-management-guide | .npmrc 的 script-shell 配置应使用 git skip-worktree 标记，避免提交到仓库                    |
| FM-14 | fork-management-guide | Windows pnpm 命令未找到时，执行`corepack enable`和`corepack prepare pnpm@latest --activate` |
| FM-15 | fork-management-guide | 设置环境变量 OPENCLAW_STATE_DIR 可迁移.state 目录到其他位置，无需修改源码                   |
| FM-16 | fork-management-guide | 迁移.state 目录：复制数据到新位置 → 设置系统环境变量 → 验证 → 删除旧目录                    |
| FM-17 | fork-management-guide | OPENCLAW_STATE_DIR 影响所有相关路径：配置文件、OAuth 凭据、日志、工作区等                   |
| FM-18 | fork-management-guide | 后续更新流程：拉取代码 → pnpm build → gateway restart → health 验证                         |
| FM-19 | fork-management-guide | 开发模式命令别名配置：macOS/Linux 用 alias，PowerShell 用 function，CMD 用.bat 文件         |
| FM-20 | fork-management-guide | PowerShell 函数中使用@args 而非$args，前者是 splatting 语法能正确传递所有参数               |
| FM-21 | fork-management-guide | Gateway 支持系统服务运行：Linux systemd、macOS launchd、Windows schtasks                    |
| FM-22 | fork-management-guide | 定制应分层处理，优先级：配置级 > 工作区 > 技能 > 插件 > 源码级（谨慎）                      |
| FM-23 | fork-management-guide | 工作区可定制文件：AGENTS.md（指令）、SOUL.md（人格）、TOOLS.md、IDENTITY.md、USER.md        |
| FM-24 | fork-management-guide | 技能系统支持三级覆盖：workspace/skills > ~/.openclaw/skills > bundled skills                |
| FM-25 | fork-management-guide | 源码级定制需添加清晰注释标记（//CUSTOM: ... //END CUSTOM），集中在特定文件便于同步检查      |
| FM-26 | fork-management-guide | 版本标签管理：`git tag -a prod-YYYY.MM.DD -m "生产稳定版本"`，便于回滚                      |
| FM-27 | fork-management-guide | 配置备份命令：`tar -czvf backup.tar.gz ~/.openclaw/openclaw.json ~/.openclaw/credentials/`  |
| FM-28 | fork-management-guide | 生产环境推荐保守策略（每月审查上游更新），安全修复立即同步，新功能等稳定后再考虑            |
| FM-29 | fork-management-guide | 升级检查清单包含 8 项：阅读 CHANGELOG、检查破坏性变更、测试环境验证、备份、打标签等         |
| FM-30 | fork-management-guide | 核心原则：配置优先、减少源码改动、定期同步、测试先行、版本管理                              |

## 组内逻辑顺序

按照“架构设计原则 → 分支管理与同步流程 → 环境适配与故障修复（Windows/路径）→ 定制化分层策略 → 运维与升级规范”的结构顺序排列。
