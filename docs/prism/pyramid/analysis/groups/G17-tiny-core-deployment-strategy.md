# G17: Tiny Core Linux 部署需遵循“极简内核 + 预编译依赖 + 定制化 Remaster"策略以平衡资源限制与功能需求

> 在极度受限的硬件环境下，通过精选变体、预编译 Node.js 运行时及定制 ISO 流程，可实现 OpenClaw 的轻量化落地，但必须牺牲部分开发效率与监控能力。

## 包含的 Atoms

| 编号  | 来源                        | 内容摘要                                                                                                                    |
| ----- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| TC-01 | tinycore-feasibility-report | Tiny Core Linux 是高度模块化的极简发行版，2008 年由 Robert Shingledecker 创建，核心理念是"游牧式"超小型图形桌面             |
| TC-02 | tinycore-feasibility-report | 版本变体三种：Core(17MB 仅 CLI)、TinyCore(23MB 含 GUI)、CorePlus(248MB 安装镜像含多种窗口管理器)                            |
| TC-03 | tinycore-feasibility-report | 支持平台包括 x86、x86-64、ARM v7、Raspberry Pi，另有 dCore 变体基于 Debian/Ubuntu 仓库                                      |
| TC-04 | tinycore-feasibility-report | 硬件最低要求：Core 需 46MB 内存/11MB 存储，TinyCore 需 64MB 内存/23MB 存储，处理器 i486DX+                                  |
| TC-05 | tinycore-feasibility-report | OpenClaw 部署 Tiny Core 的五项对比：Node.js 22+ 需手动安装、内存需评估、网络支持、持久化需配置、无 systemd                  |
| TC-06 | tinycore-feasibility-report | 三种运行模式：默认模式 (全加载 RAM 无持久化)、挂载模式 Mount Mode(推荐)、复制模式 Copy Mode(兼顾速度与持久)                 |
| TC-07 | tinycore-feasibility-report | 默认模式不适合 OpenClaw 因无持久化，挂载模式可用于 OpenClaw，复制模式取决于内存容量                                         |
| TC-08 | tinycore-feasibility-report | 包管理命令：`tce-load -wi` 下载并安装到 onboot 列表，`tce-load -w` 仅下载，`tce-load -i` 加载已下载扩展                     |
| TC-09 | tinycore-feasibility-report | Tiny Core 不使用 systemd，采用 BusyBox init + BSD 风格启动脚本，用户自定义脚本位于 `/opt/bootlocal.sh`                      |
| TC-10 | tinycore-feasibility-report | 持久化机制通过 boot codes 配置：tce=指定扩展存储、home=持久化/home、opt=持久化/opt、restore=备份恢复位置                    |
| TC-11 | tinycore-feasibility-report | Node.js 官方扩展版本可能过时，社区存在 tiny-node 项目，编译安装需 compiletc 工具链                                          |
| TC-12 | tinycore-feasibility-report | 编译 Node.js 流程：加载 compiletc/git/curl/make/python/openssl-dev → git clone → ./configure → make → make install          |
| TC-13 | tinycore-feasibility-report | 四大挑战：Node.js 版本 (高概率高影响，建议 dCore 或源码编译)、服务管理、持久化配置、依赖管理需原生编译                      |
| TC-14 | tinycore-feasibility-report | 综合评估评分：技术可行性 3/5、开发效率 2/5、运维复杂度 4/5、稳定性 3/5、社区支持 2/5                                        |
| TC-15 | tinycore-feasibility-report | 推荐场景：嵌入式/IoT 设备、资源极度受限环境 (<256MB RAM)、只读/安全要求高 kiosk、教育学习目的                               |
| TC-16 | tinycore-feasibility-report | 不推荐场景：生产环境主力服务器、快速迭代开发环境、企业级部署、需要完整监控/日志的场景                                       |
| TC-17 | tinycore-feasibility-report | 替代方案推荐：Alpine Linux(~5MB musl libc)、Debian Minimal(~150MB)、Void Linux(~50MB runit)、Arch Linux                     |
| TC-18 | tinycore-feasibility-report | 渠道精简建议：保留 Telegram(grammy 轻量)、可选 WhatsApp Web、移除 Discord/Slack/Signal/iMessage/LINE                        |
| TC-19 | tinycore-feasibility-report | 依赖裁剪：必须保留 commander/dotenv/express/ws/zod/grammy/baileys/tslog，条件移除 sharp/playwright/sqlite-vec 等            |
| TC-20 | tinycore-feasibility-report | 模块选择：保留 cli/config/gateway/infra/telegram/auto-reply/routing/channels/utils，移除 agents/browser/canvas 等 25 个模块 |
| TC-21 | tinycore-feasibility-report | 构建策略推荐预编译打包方案：开发机裁剪依赖→build→pnpm install --production→打包 dist+node_modules                           |
| TC-22 | tinycore-feasibility-report | 单文件 Bundle 方案 (esbuild/rolldown) 体积最小但原生模块无法 bundle，源码部署在 Tiny Core 上不推荐                          |
| TC-23 | tinycore-feasibility-report | 基础镜像推荐 Core Pure 64(x86_64 现代 Node.js 兼容好) 或 dCore x86_64(可用 Debian 仓库)                                     |
| TC-24 | tinycore-feasibility-report | 必需 TCZ 扩展：ca-certificates(HTTPS 证书)、openssl(加密库)、nodejs(或预编译二进制)                                         |
| TC-25 | tinycore-feasibility-report | 目录结构规划：/opt/node(Node.js 运行时)、/opt/openclaw(应用)、/home/tc/.openclaw(用户配置数据)                              |
| TC-26 | tinycore-feasibility-report | 启动脚本/opt/bootlocal.sh 配置：设置 PATH/NODE_ENV/HOME→等待网络→启动网关→后台运行并记录日志                                |
| TC-27 | tinycore-feasibility-report | Remaster 定制 ISO 流程：安装扩展→配置 onboot.lst→部署 OpenClaw→创建 bootlocal.sh→配置 filetool.lst→ezremaster 打包          |
| TC-28 | tinycore-feasibility-report | 预期 Remaster 结果：ISO 大小 50-80MB、启动时间<30 秒、内存占用 150-200MB                                                    |
| TC-29 | tinycore-feasibility-report | 关键决策点：消息渠道选 Telegram、Node.js 来源预编译二进制、打包方式预编译 tar 包、移除本地 LLM 和 sharp                     |
| TC-30 | tinycore-feasibility-report | 预估对比：完整版 OpenClaw 约 500MB+/512MB+ 内存，Tiny Core 最小版约 80-150MB/128-256MB 内存，支持渠道 1-2 个                |

## 组内逻辑顺序

按照“系统特性评估 → 部署挑战分析 → 架构裁剪策略 → 具体实施流程 → 场景适用性结论”的逻辑排列。

=== GROUP: G18-agent-self-evolution-mechanism.md ===

# G18: AI Agent 自我进化必须构建"OADA 闭环 + 预算约束 + 人机协作”的三层防御体系以确保持续优化而不失控

> 通过观察 - 分析 - 决策 - 执行 - 验证的全自动闭环，配合严格的资源预算与安全回滚机制，Agent 能从被动响应转向主动目标导向的持续迭代。

## 包含的 Atoms

| 编号  | 来源                  | 内容摘要                                                                                                       |
| ----- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| AE-01 | agent-evolution-guide | 自我进化是 AI Agent 自主分析差距、设计方案、执行验证、反思迭代的闭环持续改进过程                               |
| AE-02 | agent-evolution-guide | 传统 Agent 是被动响应式，自我进化机制赋予其目标导向、自我优化、知识积累、资源意识的主动性                      |
| AE-03 | agent-evolution-guide | 终极目标设定四原则：具体可衡量、有挑战性、可分解、有意义，作为进化的北极星                                     |
| AE-04 | agent-evolution-guide | 基础版三阶段循环模型：规划 (Planner)→执行 (Executor)→跟踪 (Tracker)，输出计划/日志/反思报告                    |
| AE-05 | agent-evolution-guide | 规划阶段五任务：环境分析、差距识别、机会发现、方案设计、预算评估，输出结构化进化计划                           |
| AE-06 | agent-evolution-guide | 执行阶段五任务：步骤获取、条件检查、操作执行、结果记录、资源统计，高频运行每次只执行一个步骤                   |
| AE-07 | agent-evolution-guide | 跟踪阶段五任务：进度检查、预算审计、效果评估、决策制定 (继续/完成/放弃)、经验总结                              |
| AE-08 | agent-evolution-guide | OADA 闭环五阶段：Observe(观察)→Analyze(分析)→Decide(决策)→Act(执行)→Verify(验证)，实现全自动进化               |
| AE-09 | agent-evolution-guide | OADA 与三阶段模型区别：自动化程度 (全自动 vs 人工)、响应速度 (定时 vs 触发)、自我修改能力、数据驱动、风险控制  |
| AE-10 | agent-evolution-guide | 自我分析器负责 Observe+Analyze：收集平台 API/日志/内容数据，生成洞察，按优先级输出可执行建议                   |
| AE-11 | agent-evolution-guide | 自我修改器负责 Act：修改发布计划/添加模板/更新策略，所有修改前自动备份带时间戳，支持一键回滚                   |
| AE-12 | agent-evolution-guide | 自动进化引擎协调 OADA 全流程：调用分析器→智能决策→调用修改器→验证效果→生成报告→准备下一周期                    |
| AE-13 | agent-evolution-guide | 任务状态流转：pending→in_progress→pending_review→completed 或 abandoned                                        |
| AE-14 | agent-evolution-guide | 步骤状态流转：pending→in_progress→completed 或 skipped                                                         |
| AE-15 | agent-evolution-guide | 并发控制四原则：单任务原则 (同一时间仅一个活跃任务)、原子操作、锁机制、幂等设计                                |
| AE-16 | agent-evolution-guide | 预算维度：时间预算 (建议 48-72 小时) 防拖延，Token 预算 (建议 5-10 万) 控成本，超限需预警/降级/记录原因        |
| AE-17 | agent-evolution-guide | 调度策略：规划每日清晨 (06:00) 深思熟虑，执行每 2-4 小时推进进度，跟踪每日晚间 (22:00) 评估总结                |
| AE-18 | agent-evolution-guide | 推荐使用 Cron 表达式实现定时调度，因其表达能力强、广泛支持、易于维护                                           |
| AE-19 | agent-evolution-guide | 数据持久化结构：state.json(核心状态)、plans/(计划存档)、logs/(执行日志)、reflections/(反思报告)                |
| AE-20 | agent-evolution-guide | 设计五原则：单一职责 (组件专一)、低耦合 (状态文件解耦)、可观测 (全行为追踪)、优雅降级、可扩展                  |
| AE-21 | agent-evolution-guide | 人机关系：Agent 处理日常维护/数据分析/内容微调/问题修复，人类负责策略决策/紧急情况/方向性变更                  |
| AE-22 | agent-evolution-guide | 保留人类干预权：随时中止、手动触发、回滚修改、调整参数、审核日志，系统需透明可解释                             |
| AE-23 | agent-evolution-guide | 渐进式信任模式：初期全审批→稳定期低风险自动→成熟期大部分自动，信任通过持续良好表现赢得                         |
| AE-24 | agent-evolution-guide | 安全机制五层：备份策略 (修改前自动备份)、回滚能力 (一键/选择性/分类)、试运行模式 (dry-run)、限流保护、监控告警 |
| AE-25 | agent-evolution-guide | 实施四阶段：基本三阶段循环→预算和并发控制→日志和反思机制→调度策略和智能决策，渐进式完善                        |
| AE-26 | agent-evolution-guide | 短期优化 (1-2 周)：增加情感/竞争/时间分析维度，丰富修改能力，改进通知机制                                      |
| AE-27 | agent-evolution-guide | 中期优化 (1 个月)：A/B 测试框架、目标追踪仪表板、智能内容生成                                                  |
| AE-28 | agent-evolution-guide | 长期优化 (3 个月)：深度学习优化预测效果、跨平台/多 Agent 生态扩展、自我演进改进进化逻辑                        |
| AE-29 | agent-evolution-guide | 两种模式适用场景：三阶段循环适合初期探索/复杂决策需人工配合，OADA 闭环适合成熟场景/常规优化全自动              |
| AE-30 | agent-evolution-guide | 核心七要点：明确终极目标、闭环机制、预算管理、定时调度、数据持久化、安全机制 (三重保护)、人机协作              |

## 组内逻辑顺序

按照“概念定义与目标 → 核心模型对比 (三阶段 vs OADA) → 组件职责与流程 → 控制机制 (并发/预算/调度) → 安全与人机协作 → 实施路线图”的逻辑排列。

=== GROUP: G19-token-usage-observability-stack.md ===

# G19: Token 使用监控需构建“命令行实时查询 + Web UI 历史分析 + OpenTelemetry 指标导出”的全栈可观测体系

> 通过整合会话存储日志与 OTLP 指标导出，实现从单次会话成本预估到长期趋势分析的全面覆盖，保障 AI 应用的经济性与透明度。

## 包含的 Atoms

| 编号  | 来源                                  | 内容摘要                                                                                                                      |
| ----- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| TM-01 | agent-token-usage-monitoring-analysis | `/status` 命令显示当前会话模型、上下文用量、最近 input/output tokens 及预估成本（API key 模式）                               |
| TM-02 | agent-token-usage-monitoring-analysis | `/usage off` 命令用于关闭用量监控显示                                                                                         |
| TM-03 | agent-token-usage-monitoring-analysis | `/usage cost` 命令基于会话日志进行本地成本汇总分析                                                                            |
| TM-04 | agent-token-usage-monitoring-analysis | `openclaw status --usage` 查看模型提供商（Claude/OpenAI 等）的用量配额快照                                                    |
| TM-05 | agent-token-usage-monitoring-analysis | Web UI 仪表板 (`ui/src/ui/views/usage.ts`) 支持按日/会话、累计/每轮、类型拆分的 token 与成本时间序列                          |
| TM-06 | agent-token-usage-monitoring-analysis | OpenTelemetry 扩展导出四类指标：`openclaw.tokens`、`openclaw.cost.usd`、`openclaw.run.duration_ms`、`openclaw.context.tokens` |
| TM-07 | agent-token-usage-monitoring-analysis | 启用 OTLP 导出需在配置中开启 `diagnostics.enabled` 和 `diagnostics.otel.enabled` 并配置 endpoint                              |
| TM-08 | agent-token-usage-monitoring-analysis | 数据来源为 Session Store (`sessions.json`) 的 token 字段和 Session Transcripts (JSONL) 的 `usage` 字段                        |
| TM-09 | agent-token-usage-monitoring-analysis | `model.usage` 诊断事件包含 input/output/cache/cost/duration/context 等完整指标，由 diagnostics-otel 消费                      |
| TM-10 | agent-token-usage-monitoring-analysis | 项目已具备完整监控能力：实时查看 (`/status`)、历史分析 (Web UI)、CLI 诊断、可观测性 (OTLP) 四大维度                           |

## 组内逻辑顺序

按照“实时查询工具 → 历史分析界面 → 底层指标导出配置 → 数据来源与结构 → 综合能力总结”的逻辑排列。

=== GROUP: G20-browser-relay-security-architecture.md ===

# G20: Browser Relay 架构通过“本地中继服务器 + 扩展徽章状态机”实现安全可控的浏览器标签页共享控制

> 利用 Chrome 扩展作为安全网关，配合严格的中继认证与状态可视化，解决了 AI 控制已登录浏览器会话的安全隔离难题。

## 包含的 Atoms

| 编号  | 来源                | 内容摘要                                                                                         |
| ----- | ------------------- | ------------------------------------------------------------------------------------------------ |
| BR-01 | browser-relay-guide | Browser Relay 是 Chrome MV3 扩展，让 AI 通过 CDP 控制现有标签页而非启动独立浏览器实例            |
| BR-02 | browser-relay-guide | 托管浏览器适合安全敏感任务（隔离），扩展中继适合利用已登录状态的任务（共享浏览数据）             |
| BR-03 | browser-relay-guide | 架构数据流：智能体→Gateway 控制服务 (18791)→本地中继服务器 (18792)→Chrome 扩展→标签页            |
| BR-04 | browser-relay-guide | 安装步骤：`openclaw browser extension install` → Chrome 开发者模式加载 → 固定图标到工具栏        |
| BR-05 | browser-relay-guide | 徽章红色 `ON` 表示连接成功，红色 `!` 表示中继服务未运行（需检查 Gateway）                        |
| BR-06 | browser-relay-guide | 三种附加方式：单个标签页点击图标、右键"Attach all tabs"一键附加当前窗口、新建标签页自动附加      |
| BR-07 | browser-relay-guide | 自动附加前提：窗口内已有至少一个已附加标签页，否则新标签页不会自动附加                           |
| BR-08 | browser-relay-guide | 智能体只能控制徽章显示 `ON` 的已附加标签页，无法自动控制用户正在看的标签页                       |
| BR-09 | browser-relay-guide | 智能体调用时必须使用 `profile="chrome"` 参数，支持 snapshot/open/click/type 等操作               |
| BR-10 | browser-relay-guide | CLI 命令：`openclaw browser --browser-profile chrome <tabs/snapshot/navigate/click/type>`        |
| BR-11 | browser-relay-guide | 默认端口：Gateway 18789、浏览器控制服务 18791、中继服务器 18792，随 gateway.port 自动偏移        |
| BR-12 | browser-relay-guide | 远程 Gateway 场景需在 Chrome 所在机器运行 `openclaw node start`，Gateway 代理操作到节点          |
| BR-13 | browser-relay-guide | 沙箱模式下需配置 `agents.defaults.sandbox.browser.allowHostControl: true` 才能访问宿主机浏览器   |
| BR-14 | browser-relay-guide | 徽章状态含义：`ON`(已附加)、`…`(连接中)、`!`(中继不可达)、无徽章 (未附加)                        |
| BR-15 | browser-relay-guide | 故障排查：徽章 `!` 时检查 Gateway 运行状态、端口配置、手动 `curl` 测试中继 18792 端口            |
| BR-16 | browser-relay-guide | 无法附加的页面类型：`chrome://`、`chrome-extension://`、`edge://` 等内部页面                     |
| BR-17 | browser-relay-guide | 安全建议：使用专用 Chrome 配置文件、最小化附加范围、中继仅监听 loopback、通过 Tailscale 连接远程 |
| BR-18 | browser-relay-guide | 智能体附加后可执行：点击/输入/导航、读取页面内容、访问 cookies/session、执行 JavaScript          |
| BR-19 | browser-relay-guide | 中继服务器安全机制：仅接受 `chrome-extension://` 来源、需要内部认证 token、仅绑定 loopback       |
| BR-20 | browser-relay-guide | 取消附加：点击图标取消单个、右键"Detach all tabs"取消全部，操作完成后应及时取消附加              |

## 组内逻辑顺序

按照“架构定位与数据流 → 安装与状态识别 → 附加控制机制 → 安全边界与限制 → 故障排查与最佳实践”的逻辑排列。

=== GROUP: G21-cron-scheduler-vs-heartbeat.md ===

# G21: Cron 调度器与 Heartbeat 心跳机制需根据“时间精度需求”与“会话隔离要求”进行差异化选型与组合使用

> Cron 提供精确时刻与隔离会话执行能力，Heartbeat 提供低成本周期性感知，两者互补构成完整的自动化任务调度体系。

## 包含的 Atoms

| 编号  | 来源              | 内容摘要                                                                                                         |
| ----- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| CR-01 | cron-config-guide | OpenClaw Cron 是 Gateway 内置的定时任务调度器，与系统 crontab 独立，可定时执行任务或设置一次性提醒               |
| CR-02 | cron-config-guide | Cron 任务五要素：sessionTarget(main/isolated)、payload.kind(systemEvent/agentTurn)、wakeMode、schedule、delivery |
| CR-03 | cron-config-guide | sessionTarget="main"在主会话运行共享上下文，必须搭配 payload.kind="systemEvent"                                  |
| CR-04 | cron-config-guide | sessionTarget="isolated"在独立临时会话运行不继承历史，必须搭配 payload.kind="agentTurn"                          |
| CR-05 | cron-config-guide | 场景推荐：简单提醒用 main，执行 shell 命令/定时报告/后台自动化用 isolated                                        |
| CR-06 | cron-config-guide | systemEvent 向 Agent 发送系统消息，Agent 可能只文本回复，不可靠执行 shell                                        |
| CR-07 | cron-config-guide | agentTurn 让 Agent 执行完整回合可使用工具/执行命令，适合自动化任务和脚本执行                                     |
| CR-08 | cron-config-guide | wakeMode 分 now(立即运行) 和 next-heartbeat(等待下次心跳，默认值，省资源)                                        |
| CR-09 | cron-config-guide | schedule 三种类型：at(一次性)、every(固定间隔)、cron(Cron 表达式：分时日月周)                                    |
| CR-10 | cron-config-guide | Cron 表达式强烈建议指定--tz 时区，否则使用 Gateway 主机本地时区                                                  |
| CR-11 | cron-config-guide | delivery 仅 isolated 任务支持，announce 投递到渠道，none 不投递只存日志                                          |
| CR-12 | cron-config-guide | --to 目标格式因渠道而异：WhatsApp 用手机号、Telegram 用用户 ID、Discord 用 channel:user 前缀                     |
| CR-13 | cron-config-guide | 简单提醒命令：`--at "20m" --session main --system-event "内容" --wake now --delete-after-run`                    |
| CR-14 | cron-config-guide | 定时脚本命令：`--cron "*/5 * * * *" --session isolated --message "命令" --no-deliver`                            |
| CR-15 | cron-config-guide | 任务显示 ok 但没执行是因为 systemEvent+main 只看到消息，需改为 agentTurn+isolated                                |
| CR-16 | cron-config-guide | Cron 运行环境 PATH 有限，脚本中需显式设置 PATH 或使用命令完整路径                                                |
| CR-17 | cron-config-guide | CLI 速查：cron list/status/runs(查看)、add(创建)、edit(修改)、enable/disable/run/rm(管理)                        |
| CR-18 | cron-config-guide | 心跳是定时唤醒 AI 的周期性调度系统，默认每 30 分钟触发 (OAuth 模式 1 小时)，让 Agent 主动感知                    |
| CR-19 | cron-config-guide | 心跳流程：定时触发→前置检查 (活跃时间/队列空闲/HEARTBEAT.md 非空)→调用 LLM→处理响应                              |
| CR-20 | cron-config-guide | 心跳响应 HEARTBEAT_OK 静默丢弃，有重要事项才投递消息，24 小时内相同内容自动去重                                  |
| CR-21 | cron-config-guide | HEARTBEAT.md 作为检查清单，应保持简短避免 prompt 膨胀增加成本                                                    |
| CR-22 | cron-config-guide | 心跳配置：every(间隔)、target(投递目标 last/none/渠道)、activeHours(活跃时间窗口)、ackMaxChars                   |
| CR-23 | cron-config-guide | Cron 与 Heartbeat 核心区别：时间精度 (精确 vs 大约)、会话 (可隔离 vs 主会话)、成本 (单独 vs 批量)                |
| CR-24 | cron-config-guide | 决策流程：需要精确时间/隔离会话/不同模型→用 Cron；可合并检查/周期性感知→用 Heartbeat                             |
| CR-25 | cron-config-guide | 场景推荐：收件箱/日历监控用 Heartbeat，精确日报/周报/执行脚本用 Cron(isolated)                                   |
| CR-26 | cron-config-guide | 最佳实践：Heartbeat 处理日常监控批量执行，Cron 处理精确调度和一次性提醒，两者结合最高效                          |

## 组内逻辑顺序

按照"Cron 基础配置要素 → 执行模式详解 (Session/Payload) → 调度类型与命令示例 → Heartbeat 机制解析 → 两者对比与选型决策”的逻辑排列。

=== INDEX_ROWS ===
| G17 | Tiny Core Linux 部署需遵循“极简内核 + 预编译依赖 + 定制化 Remaster"策略以平衡资源限制与功能需求 | 30 | 2026-02 |
| G18 | AI Agent 自我进化必须构建"OADA 闭环 + 预算约束 + 人机协作”的三层防御体系以确保持续优化而不失控 | 30 | 2026-02 |
| G19 | Token 使用监控需构建“命令行实时查询 + Web UI 历史分析 + OpenTelemetry 指标导出”的全栈可观测体系 | 10 | 2026-02 |
| G20 | Browser Relay 架构通过“本地中继服务器 + 扩展徽章状态机”实现安全可控的浏览器标签页共享控制 | 20 | 2026-02 |
| G21 | Cron 调度器与 Heartbeat 心跳机制需根据“时间精度需求”与“会话隔离要求”进行差异化选型与组合使用 | 26 | 2026-02 |
