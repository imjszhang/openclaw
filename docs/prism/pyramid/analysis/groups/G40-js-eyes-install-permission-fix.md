# G40: JS-Eyes 子技能安装必须强制执行权限收紧，以规避 OpenClaw 安全机制对 world-writable 文件的拦截

> 安装脚本若未在解压后立即修复文件权限，将导致插件因安全检查失败而无法注册，必须将 chmod 操作固化为标准流程。

## 包含的 Atoms

| 编号  | 来源                       | 内容摘要                                                                                               |
| ----- | -------------------------- | ------------------------------------------------------------------------------------------------------ |
| JS-01 | js-eyes-install-script-fix | OpenClaw 的安全检查机制会拒绝加载任何路径或文件具有 world-writable (mode & 0o002) 属性的插件           |
| JS-02 | js-eyes-install-script-fix | zip 包内文件若权限为 0666，使用 unzip 或 python3 zipfile.extractall() 解压后会保留该不安全权限         |
| JS-03 | js-eyes-install-script-fix | 配置校验报错"plugin not found"的根本原因是插件因权限不安全被拦截，导致未注册到 knownIds 列表中         |
| JS-04 | js-eyes-install-script-fix | js-eyes 主技能通常通过 ClawHub 安装且权限正常，而子技能因 install.sh 解压 zip 包易触发权限问题         |
| JS-05 | js-eyes-install-script-fix | 必须在 install.sh 每次解压完成后立即执行 find 命令，将文件权限设为 644，目录权限设为 755               |
| JS-06 | js-eyes-install-script-fix | 权限收紧命令需添加 `2>/dev/null` 以屏蔽无关报错                                                        |
| JS-07 | js-eyes-install-script-fix | 权限收紧操作建议放在解压完成之后、npm install 之前，避免后续步骤再次修改文件权限                       |
| JS-08 | js-eyes-install-script-fix | 当前 install.sh 使用相对路径 `./skills` 作为默认安装目录，依赖执行时的 CWD，易导致安装位置错误         |
| JS-09 | js-eyes-install-script-fix | 手动配置 openclaw.json 易出错，建议在脚本中增加自动检测并合并写入 plugins.load.paths 和 entries 的逻辑 |
| JS-10 | js-eyes-install-script-fix | 已安装环境若遇插件加载失败，可手动对插件目录执行 chmod 644/755 修复权限后重启 daemon                   |

## 组内逻辑顺序

按“问题现象 -> 根本原因 -> 解决方案 -> 实施细节 -> 应急修复”的逻辑排列。首先描述安全拦截现象 (JS-01, JS-03) 和来源 (JS-02, JS-04)，接着提出核心修复命令 (JS-05) 及其执行时机 (JS-07) 和细节 (JS-06)，随后补充安装路径和配置自动化的优化建议 (JS-08, JS-09)，最后提供手动修复方案 (JS-10)。

=== GROUP: G41-memory-core-architecture-and-governance.md ===

# G41: 长期记忆体系必须剥离 Heartbeat 的写入职责，构建“独立 Digest 任务 + 周治理复盘”的闭环以确保记忆质量

> 记忆系统的稳定性依赖于读写分离架构，唯有通过独立的写入任务和严格的周期治理，才能避免噪声堆积并维持高价值索引。

## 包含的 Atoms

| 编号  | 来源                                        | 内容摘要                                                                                              |
| ----- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| MC-01 | memory-core-research-and-implementation-log | OpenClaw 记忆体系包含两类插件：`memory-core`（内置工具接入层）和 `memory-lancedb`（完整长期记忆系统） |
| MC-02 | memory-core-research-and-implementation-log | `memory-core` 提供 `memory_search`、`memory_get` 工具及 `memory` CLI 命令                             |
| MC-03 | memory-core-research-and-implementation-log | `memory-lancedb` 具备向量存储、召回、自动捕获及自动注入等完整长期记忆能力                             |
| MC-04 | memory-core-research-and-implementation-log | `memory-core` 与 `memory-lancedb` 可并存但不共享数据语义，同时启用可能导致策略分散                    |
| MC-05 | memory-core-research-and-implementation-log | `memory-core` 的“保存”行为本质是索引同步与更新，而非语义化的记忆条目写入                              |
| MC-06 | memory-core-research-and-implementation-log | `memory-core` 的触发机制包括会话预热、搜索触发、文件变更监听、手动索引及可选定时同步                  |
| MC-07 | memory-core-research-and-implementation-log | 现有 cron 与 heartbeat 任务未显式调用 `memory_search` 或 `memory_get` 命令                            |
| MC-08 | memory-core-research-and-implementation-log | heartbeat 流程仅更新状态与执行日志，不负责向 `memory/*.md` 写入长期记忆文档                           |
| MC-09 | memory-core-research-and-implementation-log | 记忆体系改造的核心原则是 heartbeat 保持只读，记忆写入由独立任务统一处理                               |
| MC-10 | memory-core-research-and-implementation-log | 建立记忆写入闭环需新增独立的 memory digest 任务，而非依赖现有 heartbeat                               |
| MC-11 | memory-core-research-and-implementation-log | 检索策略收敛需执行“先搜后答”规则并固化高频 query 模板                                                 |
| MC-12 | memory-core-research-and-implementation-log | 周期治理需执行周清理动作并复盘命中率、噪声率、可行动率三项指标                                        |
| MC-13 | memory-core-research-and-implementation-log | 在 `~/.openclaw` 运行侧新增每日记忆模板文件 `memory/_TEMPLATE.md`                                     |
| MC-14 | memory-core-research-and-implementation-log | 创建 `memory/RETRIEVAL.md` 文档以定义先搜后答场景、固化检索模板并统一输出行为                         |
| MC-15 | memory-core-research-and-implementation-log | 创建 `memory/WEEKLY_REVIEW.md` 文档以明确每周固定动作及三项治理指标                                   |
| MC-16 | memory-core-research-and-implementation-log | 新增 `scripts/memory_digest.py` 脚本，从执行日志抽取高价值事件并写入按日命名的记忆文件                |
| MC-17 | memory-core-research-and-implementation-log | 新增 `scripts/memory_weekly_review.py` 脚本，用于按周生成治理复盘文档                                 |
| MC-18 | memory-core-research-and-implementation-log | 在 cron 配置中新增 `Moltbook Memory Digest`（日级）和 `Moltbook Memory Weekly Review`（周级）任务     |
| MC-19 | memory-core-research-and-implementation-log | 在 `HEARTBEAT.md` 中补充规范：历史问题先搜后答，实时问题优先实时检查                                  |
| MC-20 | memory-core-research-and-implementation-log | 日志抽取过量会导致记忆噪声上升，需通过周复盘驱动优化写入质量                                          |
| MC-21 | memory-core-research-and-implementation-log | 业务文案与实际 cron 配置不一致可能导致 heartbeat 误报，需定期对齐预期任务清单与真实配置               |
| MC-22 | memory-core-research-and-implementation-log | `memory-core` 的核心价值在于“高质量索引 + 高质量输入源”，而非自动记录所有内容                         |
| MC-23 | memory-core-research-and-implementation-log | 固定写入门槛、写入入口、检索策略和周治理四件事是 `memory-core` 稳定支撑长期记忆场景的前提             |

## 组内逻辑顺序

按“架构现状与问题 -> 改造原则与策略 -> 具体实施步骤 -> 治理与规范”的逻辑排列。首先介绍双插件架构及现状问题 (MC-01~MC-08)，确立读写分离原则 (MC-09, MC-10)，接着详述检索策略 (MC-11)、治理指标 (MC-12) 及所需的文件/脚本/任务创建 (MC-13~MC-18)，最后补充文档规范 (MC-19)、噪声控制 (MC-20)、配置对齐 (MC-21) 及核心价值总结 (MC-22, MC-23)。

=== GROUP: G42-openclaw-permission-config-guide.md ===

# G42: OpenClaw 的全开放配置必须通过 JSON5 精细化控制与网关重启生效，且仅限可信环境使用

> 权限配置涉及执行、会话、文件等多维度，需严格遵循“配置修改 - 重启生效 - 状态验证”流程，严禁在生产环境无差别开放。

## 包含的 Atoms

| 编号  | 来源                      | 内容摘要                                                                                          |
| ----- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| PS-01 | permission-settings-guide | 主配置文件位于 `~/.openclaw/openclaw.json`，采用支持注释和尾逗号的 JSON5 格式                     |
| PS-02 | permission-settings-guide | 使用 `pnpm openclaw config get <section>` 命令查看特定配置段（如 tools, commands）的当前值        |
| PS-03 | permission-settings-guide | `tools.exec.host` 默认值为 `sandbox`，设为 `gateway` 或 `node` 时将在宿主机执行命令               |
| PS-04 | permission-settings-guide | `tools.exec.security` 设为 `full` 时允许任意执行，设为 `allowlist` 时需配合 `exec-approvals.json` |
| PS-05 | permission-settings-guide | 执行 `pnpm openclaw config set tools.exec.security full` 和 `ask off` 可开启无限制执行模式        |
| PS-06 | permission-settings-guide | `tools.elevated.allowFrom` 支持按渠道 ID 配置白名单，`"*"` 作为键表示通配所有渠道                 |
| PS-07 | permission-settings-guide | `tools.agentToAgent.enabled` 默认关闭，设为 `true` 且 `allow` 为 `["*"]` 时允许调用任意 Agent     |
| PS-08 | permission-settings-guide | `tools.sessions.visibility` 默认 `tree`（当前会话及子会话），设为 `all` 可访问跨 Agent 所有会话   |
| PS-09 | permission-settings-guide | `tools.fs.workspaceOnly` 默认 `false`，但 `apply_patch` 工具独立配置且默认限制为工作区            |
| PS-10 | permission-settings-guide | `commands.bash`、`commands.config`、`commands.debug` 默认均为 `false`，需手动开启                 |
| PS-11 | permission-settings-guide | `commands.useAccessGroups` 默认 `true`，设为 `false` 可绕过访问组和白名单强制检查                 |
| PS-12 | permission-settings-guide | 渠道 `dmPolicy` 设为 `open` 时，必须同时配置 `allowFrom: ["*"]`，否则校验会失败                   |
| PS-13 | permission-settings-guide | `groupPolicy` 设为 `open` 时不限制群组，但仍受 mention 规则约束                                   |
| PS-14 | permission-settings-guide | 可通过 Node 脚本读取并修改 `openclaw.json` 文件，实现批量写入“全部开放”的安全配置                 |
| PS-15 | permission-settings-guide | 修改配置后必须执行 `pnpm openclaw gateway restart` 重启网关才能使新策略生效                       |
| PS-16 | permission-settings-guide | 使用 `pnpm openclaw doctor --non-interactive` 和 `pnpm openclaw health` 验证配置与运行状态        |
| PS-17 | permission-settings-guide | “全部开放”配置仅适用于可信环境或开发调试场景，生产环境应严格限制 exec 和命令权限                  |

## 组内逻辑顺序

按“配置基础 -> 核心权限项详解 -> 策略组合与校验 -> 自动化与生效流程 -> 安全警示”的逻辑排列。首先介绍配置文件格式与查询命令 (PS-01, PS-02)，接着逐项解析执行、提权、Agent 互调、会话、文件及命令权限 (PS-03~PS-11)，随后说明渠道与群组策略的联动校验 (PS-12, PS-13) 及脚本化修改 (PS-14)，强调重启生效与验证步骤 (PS-15, PS-16)，最后给出安全警告 (PS-17)。

=== INDEX_ROWS ===
| G40 | JS-Eyes 子技能安装必须强制执行权限收紧，以规避 OpenClaw 安全机制对 world-writable 文件的拦截 | 10 | 2026-03 |
| G41 | 长期记忆体系必须剥离 Heartbeat 的写入职责，构建“独立 Digest 任务 + 周治理复盘”的闭环以确保记忆质量 | 23 | 2026-03 |
| G42 | OpenClaw 的全开放配置必须通过 JSON5 精细化控制与网关重启生效，且仅限可信环境使用 | 17 | 2026-03 |
