# OpenClaw Fork 管理与生产部署指南

> 来源：[../../../../journal/2026-01-31/fork-management-guide.md](../../../../journal/2026-01-31/fork-management-guide.md)
> 缩写：FM

## Atoms

| 编号  | 类型 | 内容                                                                                        | 原文定位                    |
| ----- | ---- | ------------------------------------------------------------------------------------------- | --------------------------- |
| FM-01 | 事实 | OpenClaw 处于 pre-1.0 阶段，官方更新频繁，需要平衡个人定制与生产环境稳定性                  | 1.1 核心矛盾                |
| FM-02 | 判断 | 采用 Fork + 分层定制架构可最大化减少与上游冲突，同时保持生产环境稳定                        | 1.2 解决思路                |
| FM-03 | 事实 | 分支架构三层设计：upstream/main（官方）、origin/main（同步）、origin/production（生产部署） | 2.1 分支架构                |
| FM-04 | 步骤 | 初始化设置：`git remote add upstream` 添加上游远程，创建 production 分支用于生产部署        | 2.3 初始化设置              |
| FM-05 | 步骤 | 标准同步流程：fetch upstream → merge upstream/main → push origin → rebase production        | 3.1 标准同步流程            |
| FM-06 | 经验 | 推荐使用选择性同步（cherry-pick）而非全量合并，可选择性应用重要提交                         | 3.2 选择性同步              |
| FM-07 | 经验 | 合并冲突处理：package.json 保留上游依赖版本合并定制依赖，核心源码保留//CUSTOM 标记代码      | 3.3 处理合并冲突            |
| FM-08 | 判断 | 生产环境推荐使用源码安装（git）而非 npm 全局安装或 Docker，便于定制                         | 4.1 安装方式选择            |
| FM-09 | 步骤 | 首次部署必需设置 gateway.mode=local 和 gateway.auth.token，否则网关无法启动                 | 4.2 首次部署流程            |
| FM-10 | 经验 | AI 模型配置是必需的，推荐使用`pnpm openclaw onboard`交互式向导配置                          | 4.2 首次部署流程            |
| FM-11 | 事实 | Windows 环境 pnpm build 失败是因为 bash 默认解析到 WSL 而非 Git Bash                        | 4.2.3 问题 1                |
| FM-12 | 步骤 | Windows 解决方案：在.npmrc 中配置`script-shell=<Git 安装目录>\bin\bash.exe`                 | 4.2.3 问题 1                |
| FM-13 | 经验 | .npmrc 的 script-shell 配置应使用 git skip-worktree 标记，避免提交到仓库                    | 4.2.3 防止.npmrc 修改被提交 |
| FM-14 | 步骤 | Windows pnpm 命令未找到时，执行`corepack enable`和`corepack prepare pnpm@latest --activate` | 4.2.3 问题 2                |
| FM-15 | 事实 | 设置环境变量 OPENCLAW_STATE_DIR 可迁移.state 目录到其他位置，无需修改源码                   | 4.2.4 原理                  |
| FM-16 | 步骤 | 迁移.state 目录：复制数据到新位置 → 设置系统环境变量 → 验证 → 删除旧目录                    | 4.2.4 操作步骤              |
| FM-17 | 事实 | OPENCLAW_STATE_DIR 影响所有相关路径：配置文件、OAuth 凭据、日志、工作区等                   | 4.2.4 受影响的路径一览      |
| FM-18 | 步骤 | 后续更新流程：拉取代码 → pnpm build → gateway restart → health 验证                         | 4.3 后续更新流程            |
| FM-19 | 步骤 | 开发模式命令别名配置：macOS/Linux 用 alias，PowerShell 用 function，CMD 用.bat 文件         | 4.4.1 开发模式命令别名      |
| FM-20 | 经验 | PowerShell 函数中使用@args 而非$args，前者是 splatting 语法能正确传递所有参数               | 4.4.1 Windows PowerShell    |
| FM-21 | 事实 | Gateway 支持系统服务运行：Linux systemd、macOS launchd、Windows schtasks                    | 4.5 系统服务管理            |
| FM-22 | 判断 | 定制应分层处理，优先级：配置级 > 工作区 > 技能 > 插件 > 源码级（谨慎）                      | 5. 定制化最佳实践           |
| FM-23 | 事实 | 工作区可定制文件：AGENTS.md（指令）、SOUL.md（人格）、TOOLS.md、IDENTITY.md、USER.md        | 5.1 第一层：配置级定制      |
| FM-24 | 事实 | 技能系统支持三级覆盖：workspace/skills > ~/.openclaw/skills > bundled skills                | 5.2 第二层：技能定制        |
| FM-25 | 经验 | 源码级定制需添加清晰注释标记（//CUSTOM: ... //END CUSTOM），集中在特定文件便于同步检查      | 5.4 第四层：源码级定制      |
| FM-26 | 步骤 | 版本标签管理：`git tag -a prod-YYYY.MM.DD -m "生产稳定版本"`，便于回滚                      | 6.1 版本标签管理            |
| FM-27 | 步骤 | 配置备份命令：`tar -czvf backup.tar.gz ~/.openclaw/openclaw.json ~/.openclaw/credentials/`  | 6.3 配置备份                |
| FM-28 | 判断 | 生产环境推荐保守策略（每月审查上游更新），安全修复立即同步，新功能等稳定后再考虑            | 7.2 推荐：保守策略          |
| FM-29 | 事实 | 升级检查清单包含 8 项：阅读 CHANGELOG、检查破坏性变更、测试环境验证、备份、打标签等         | 7.3 升级检查清单            |
| FM-30 | 经验 | 核心原则：配置优先、减少源码改动、定期同步、测试先行、版本管理                              | 9.1 核心原则                |
