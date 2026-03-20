# 分组索引

归组的内容注册表，随日常内容写入而更新。架构说明见 [README.md](README.md)。

## 分组总览

| 编号 | 观点句                                                                                                                | atom 数量 | 来源月份跨度 |
| ---- | --------------------------------------------------------------------------------------------------------------------- | --------- | ------------ |
| G01  | 按时间线组织的学习笔记天然不适合教学和知识复用，必须结构化重组                                                        | 2         | 2026-02      |
| G02  | 金字塔原理的自上而下和自下而上方法互补协作，先归纳发现再验证表达                                                      | 3         | 2026-02      |
| G03  | 知识库应分为输入（journal）、处理（pyramid）、输出（outputs）三层，各层职责单一                                       | 3         | 2026-02      |
| G04  | 素材分析（analysis）跨视角共享，表达组织（structure）按视角独立，两者终点与起点不等价                                 | 3         | 2026-02      |
| G05  | 产物是否随素材规模增长决定组织方式——增长型用目录分维度，固定型用单文件保内聚                                          | 4         | 2026-02      |
| G06  | 知识库拆解是持续增量过程，需要文档化流程、变更日志和模板化入口保障可持续运作                                          | 3         | 2026-02      |
| G07  | 安全加固遵循纵深防御原则——路径、认证、执行、审计各层独立防护，关键路径 fail-closed                                    | 7         | 2026-02~03   |
| G08  | 大规模上游合并的核心策略是采纳上游架构方向，文档化丢失功能为后续重建铺路                                              | 6         | 2026-02~03   |
| G09  | 代码库规模化演进的重构模式：共享 helper 去重 + 类型提取到独立模块                                                     | 5         | 2026-02~03   |
| G10  | 测试基础设施规模化的两个支柱：lightweight clears 解决状态隔离，性能模式解决执行速度                                   | 2         | 2026-02      |
| G11  | 基础设施的安全默认值：镜像固定摘要 + 非 root 运行 + 自动化迁移工具                                                    | 2         | 2026-02      |
| G12  | 消息渠道部署需遵循"先决条件确认 - 差异化配置 - 状态验证"的标准化流程                                                  | 26        | 2026-02      |
| G13  | Fork 管理必须采用"三层分支隔离 + 选择性同步"策略以平衡定制需求与上游演进                                              | 31        | 2026-02~03   |
| G14  | AI 模型与 Agent 配置需严格区分"提供商认证机制"与"多 Agent 路由逻辑"以实现灵活调度                                     | 25        | 2026-02      |
| G15  | 项目架构与运行机理揭示了"本地优先网关"作为核心枢纽连接多渠道与多工具的设计哲学                                        | 32        | 2026-02      |
| G16  | Doctor 诊断工具是保障系统健康与配置规范化的核心防线，具备自动修复与深度审计能力                                       | 24        | 2026-02      |
| G17  | Tiny Core Linux 部署需遵循"极简内核 + 预编译依赖 + 定制化 Remaster"策略以平衡资源限制与功能需求                       | 30        | 2026-02      |
| G18  | AI Agent 自我进化必须构建"OADA 闭环 + 预算约束 + 人机协作"的三层防御体系以确保持续优化而不失控                        | 30        | 2026-02      |
| G19  | Token 使用监控需构建"命令行实时查询 + Web UI 历史分析 + OpenTelemetry 指标导出"的全栈可观测体系                       | 10        | 2026-02      |
| G20  | Browser Relay 架构通过"本地中继服务器 + 扩展徽章状态机"实现安全可控的浏览器标签页共享控制                             | 20        | 2026-02      |
| G21  | Cron 调度器与 Heartbeat 心跳机制需根据"时间精度需求"与"会话隔离要求"进行差异化选型与组合使用                          | 26        | 2026-02      |
| G22  | Windows 下 Cursor 终端必须切换为 Git Bash 以消除 AI Agent 生成 Unix 命令的执行障碍                                    | 15        | 2026-02      |
| G23  | OpenClaw 渠道插件架构通过"元数据声明 + 适配器实现 + 配置驱动"模式实现消息平台的标准化扩展                             | 30        | 2026-02      |
| G24  | OpenClaw 扩展系统基于"统一注册 API+ 分层发现机制 + 生命周期钩子"构建全类型插件生态                                    | 30        | 2026-02      |
| G25  | OpenClaw 外部集成需根据"自动化场景需求"在 CLI、HTTP API 与 WebSocket RPC 间进行差异化选型                             | 22        | 2026-02      |
| G26  | 独立 Agent 创建需严格区分"CLI 交互式引导"与"RPC 自动化构建"两种模式以适配不同管理场景                                 | 20        | 2026-02      |
| G27  | 知识棱镜通过"Journal-Pyramid-Outputs"三层架构与双向轨道，将时间线笔记蒸馏为可复用的结构化知识体系                     | 18        | 2026-02      |
| G28  | OpenClaw 核心架构通过"Channel-Agent-Workspace-Session"五层抽象与严格隔离机制，实现消息路由安全与上下文精准管理        | 20        | 2026-02      |
| G29  | Agent 使用需严格区分"主 Agent 配置"与"子 Agent 衍生"，禁止跨 Agent 复用配置目录以确保人设与记忆的独立性               | 15        | 2026-02      |
| G30  | OpenClaw 技能系统通过"元数据声明 + 三级加载 + 优先级覆盖"机制，实现 AI Agent 能力的灵活扩展与按需激活                 | 20        | 2026-02      |
| G31  | WeCom 插件部署需解决"公网 IP 可信校验"与"5 秒回调响应"两大核心挑战，采用先 ACK 后异步处理策略保障消息可靠送达         | 15        | 2026-02      |
| G32  | OpenClaw 插件创建需遵循"SDK 隔离 + 清单驱动 + 安全加载"的全生命周期规范                                               | 36        | 2026-02      |
| G33  | 知识棱镜的自动化落地需通过"OpenClaw 插件化"将繁琐的手动流程转化为 AI 可调用的标准工具                                 | 39        | 2026-02      |
| G34  | JS-Eyes 通过 WebSocket 复用用户浏览器环境，填补了内置沙箱浏览器在"带登录态交互"场景的能力空白                         | 28        | 2026-02      |
| G35  | ClawHub 技能发布需遵循"文本元数据驱动 + 语义搜索索引 + 安全合规扫描"的标准化分发机制                                  | 26        | 2026-02      |
| G36  | Agent-First 项目必须构建"自主安装脚本 + 多源回退链 + 地域化资源映射"的独立分发体系以解耦市场依赖                      | 14        | 2026-02      |
| G37  | 技能发现系统应从"手动注册"演进为"GitHub Pages 静态注册表 + AI 工具链"的自动化架构以实现 Agent 友好                    | 14        | 2026-02      |
| G38  | OpenClaw 路径解析存在 State 目录与 Workspace 目录的分离机制，需通过环境变量或配置文件显式对齐以避免 ENOENT 错误       | 8         | 2026-02      |
| G39  | OpenClaw 的 exec 安全机制通过"分段解析 + 白名单校验 + 动态审批"三重防线，强制阻断高风险的 curl\|bash 管道执行模式     | 16        | 2026-02      |
| G40  | JS-Eyes 子技能安装必须强制执行权限收紧，以规避 OpenClaw 安全机制对 world-writable 文件的拦截                          | 10        | 2026-03      |
| G41  | 长期记忆体系必须剥离 Heartbeat 的写入职责，构建"独立 Digest 任务 + 周治理复盘"的闭环以确保记忆质量                    | 23        | 2026-03      |
| G42  | OpenClaw 的全开放配置必须通过 JSON5 精细化控制与网关重启生效，且仅限可信环境使用                                      | 17        | 2026-03      |
| G43  | 权限配置完全指南覆盖工具可见性与 exec 双轨制，子代理需同步 exec-approvals defaults 方能执行                           | 15        | 2026-03      |
| G44  | 状态目录权限加固需通过 security audit 检测与自动修复，保障配置与凭据不被其他用户篡改或读取                            | 6         | 2026-03      |
| G45  | link-collector 技能采用 inbox/batch 轮转与 CLI 子命令注册 cron，实现链接收集与定时入库的并发安全                      | 10        | 2026-03      |
| G46  | js-knowledge-collector 插件通过 registerHttpRoute 暴露 Web UI，纯 ESM 项目需用动态 import 替代 createRequire          | 12        | 2026-03      |
| G47  | Gateway 升级验证需遵循"版本确认 - 服务重装 - 配置加固"的标准流程以规避权限与安全风险                                  | 12        | 2026-03      |
| G48  | Knowledge Prism 是一种将日常笔记转化为结构化知识的高效工作方法。                                                      | 15        | 2026-03      |
| G49  | Agent-First 架构模式强调以 AI Agent 为中心，优化工具和项目能力的结构化调用。                                          | 45        | 2026-03      |
| G50  | 多知识库注册与自动化管理是 Agent-First 插件生态在运维层面的自然延伸。                                                 | 12        | 2026-03      |
| G51  | JS ClawHub 通过"纯静态架构 + 人工策展定位"打造轻量级 OpenClaw 生态导航站                                              | 20        | 2026-03      |
| G52  | 知识收集器必须采用"inbox/batch 轮转 + 专用 scraper"架构以解决主会话阻塞与多平台适配难题                               | 22        | 2026-03      |
| G53  | ClawHub 博客自动同步需采用"Cron 触发隔离会话 + 哈希去重空跑优化”策略以实现低耦合高可靠                                | 16        | 2026-03      |
| G54  | JS ClawHub 升级为 OpenClaw 插件需遵循"结构复用 + 动态注入 + 双模并存"策略以实现生态导航站的 AI 化赋能                 | 20        | 2026-03      |
| G55  | 知识棱镜工具创建需遵循“三层架构 + 双入口设计 + 零依赖核心”策略以实现低门槛与高扩展性                                  | 22        | 2026-03      |
| G56  | OpenClaw 记忆桥接需采用"Markdown 摘要导出 + 增量时间戳同步"策略以低成本接入向量检索                                   | 13        | 2026-03      |
| G57  | Prism 记忆桥接需通过“层次筛选 + 增量同步 + 双源互补”策略实现高价值结构化知识的低成本接入                              | 32        | 2026-03      |
| G58  | 3D 知识图谱升级需通过"Three.js 生态整合 + 力导向分层布局 + 交互细节优化"实现高性能可视化                              | 24        | 2026-03      |
| G59  | 知识棱镜全链路自动化需采用"双 Cron 分段驱动 + mtime 双层检测"架构以消除手动干预并保障时序一致性                       | 14        | 2026-03      |
| G60  | Output Cron 可靠性优化需采用"inbox/batch 轮转 + 逐步 Checkpoint + 失败隔离”架构以消除单点故障                         | 15        | 2026-03      |
| G61  | 模板创建技能需采用“决策引导 + 确定性 Scaffold+ 渐进式披露”策略以降低多层知识门槛                                      | 12        | 2026-03      |
| G62  | Draft 机制的时区修复与今日产出处理必须强制采用本地日期计算并引入草稿状态流转                                          | 10        | 2026-03      |
| G63  | 知识棱镜的改写功能必须采用"生成与风格正交分离"架构，通过独立定义文件与链式执行实现非破坏性多风格产出                  | 12        | 2026-03      |
| G64  | JS Eyes 项目必须采用“浏览器主动连接 + 逆向架构”模式以填补 Agent 框架在实时复用用户浏览器环境上的能力空白              | 15        | 2026-03      |
| G65  | Knowledge Prism 的 Structure 刷新必须从“二元开关”演进为“策略化驱动”模式，以兼容论点型与时间序列型视角的差异化组织逻辑 | 16        | 2026-03      |
| G66  | 大规模上游合并需遵循"全量同步 - 冲突主分支优先 - 安装器直连"策略以保障版本演进与功能完整性                            | 37        | 2026-03      |
| G67  | OpenClaw 安全体系基于“个人助手信任模型”，通过五层边界与形式化验证构建纵深防御                                         | 41        | 2026-03      |
| G68  | Cursor Agent 集成必须采用“零依赖核心层 + 长驻进程池 + 多入口适配”架构以解决短命令模型与有状态会话的冲突               | 20        | 2026-03      |
| G69  | 飞书知识库变现需构建"支付闭环 + 自动化维护 + 技能固化"的实战路径以实现低门槛盈利                                      | 13        | 2026-03      |
| G70  | JS VI 系统必须采用"Design Tokens 单源驱动 + 五层架构 + 刚柔并济视觉哲学"以实现品牌风格的全链路自动化                  | 19        | 2026-03      |
| G71  | JS VI 系统必须通过“微信专用尺寸枚举 + 静态模板约束 + 双模导出流程”实现公众号封面图的自动化与品牌一致性                | 15        | 2026-03      |
| G72  | 上游 PR 贡献必须采用「独立分支隔离 + Cherry-pick 回合并」策略以规避定制线冲突                                         | 10        | 2026-03      |
| G73  | 插件注册表架构必须严格分离「类型契约声明」与「运行时装配逻辑」并实施细粒度权限控制                                    | 16        | 2026-03      |

## 变更日志

记录每次分组调整，保持归组演化的可追溯性。

| 日期       | 操作                                              | 原因                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-22 | 创建 G01–G06，归入 KA-01 至 KA-18 共 18 个 atoms  | 首次归组，基于 knowledge-base-architecture-design 拆解                                                                                                                                                                                                                            |
| 2026-02-23 | 创建 G07–G11，归入 MU-01 至 MU-16 共 16 个 atoms  | 增量归组，基于 merge-main-upgrade-summary 拆解；MU-06~MU-09（功能清单）暂未归组，待后续跨文档关联                                                                                                                                                                                 |
| 2026-02-23 | 创建 G12–G16，归入 CD-01 至 OD-24 共 137 个 atoms | 增量归组，基于 channel-deployment-guide, fork-management-guide, model-agent-config-guide, openclaw-analysis-report, openclaw-doctor-guide 五份文档拆解；所有 atoms 均成功归组，无遗留                                                                                             |
| 2026-02-23 | 创建 G17-G21                                      | 增量归组，基于 tinycore-feasibility-report, agent-evolution-guide, agent-token-usage-monitoring-analysis, browser-relay-guide, cron-config-guide 五份文档拆解；所有 atoms 均成功归组，无遗留                                                                                      |
| 2026-02-23 | 创建 G22-G26，归入 CT-01 至 IA-20 共 117 个 atoms | 增量归组，基于 cursor-terminal-config-guide, custom-channel-guide, extension-development-guide, external-scripting-guide, independent-agent-creation-guide 五份文档拆解；所有 atoms 均成功归组，无遗留                                                                            |
| 2026-02-23 | 创建 G27-G31，归入 KP-01 至 WP-15 共 88 个 atoms  | 增量归组，基于 knowledge-prism-introduction, openclaw-core-concepts-pyramid, openclaw-core-concepts-qa-and-usage, skills-guide, wecom-plugin-deployment-guide 五份文档拆解；所有 atoms 均成功归组，无遗留                                                                         |
| 2026-02-24 | 新建 G32                                          | 归入 plugin-creation-guide 拆解的 36 个 atoms (PC-01 至 PC-36)，形成完整的插件开发指引组                                                                                                                                                                                          |
| 2026-02-24 | 新建 G33                                          | 归入 from-notes-to-plugin (FN-01~FN-20) 和 using-knowledge-prism-plugin (UP-01~UP-19) 共 39 个 atoms，形成完整的知识棱镜自动化与实操指南组                                                                                                                                        |
| 2026-02-24 | 新建 G34                                          | 归入 js-eyes-openclaw-plugin-guide 拆解的 28 个 atoms (JE-01 至 JE-28)，形成完整的 JS-Eyes 浏览器扩展集成指南组                                                                                                                                                                   |
| 2026-02-26 | 新建 G35-G38                                      | 归入 clawhub-publish-guide (CH-01~21), js-eyes-agent-first-transformation (AF-01~20), skill-discovery-system-design-and-implementation (SD-01~14), workspace-path-openclaw-state-dir-mismatch (OP-01~08) 共 62 个 atoms；形成技能发布、独立分发、自动化发现及路径配置四个新主题组 |
| 2026-02-26 | 新建 G39                                          | 归入 exec-approvals-curl-pipe-bash-blocked 拆解的 16 个 atoms (EX-01~EX-16)，形成完整的执行审批与安全机制主题组                                                                                                                                                                   |
| 2026-03-04 | 新建 G40, G41, G42                                | 归入 permission-settings-guide (PS-01~17), js-eyes-install-script-fix (JS-01~10), memory-core-research-and-implementation-log (MC-01~23) 共 50 个 atoms；形成权限配置、插件安装修复、记忆架构重构三个新主题组                                                                     |
| 2026-03-04 | 新建 G40, G41, G42                                | 归入 js-eyes-install-script-fix (JS-01~10), memory-core-research-and-implementation-log (MC-01~23), permission-settings-guide (PS-01~17) 共 50 个 atoms；形成安装权限修复、记忆架构治理、权限配置指南三个新主题组                                                                 |
| 2026-03-07 | 新建 G43, G44, G45, G46                           | 归入 openclaw-permissions-guide (PG-01~15), openclaw-security-permissions-guide (SP-01~06), link-collector-skill-dev (LC-01~10), js-knowledge-collector-plugin-dev (KC-01~12) 共 43 个 atoms；形成权限完全指南、状态目录加固、link-collector 技能设计、知识收集插件四个新主题组   |
| 2026-03-08 | 更新 G07, G08, G09, G13                           | 归入 merge-main-upgrade-summary-v2 (MV-01~MV-20) 中的 9 个 atoms 到现有 4 个 group；MV-02 验证高频合并策略，MV-03 记录 fork 差异收窄趋势，MV-09~MV-11 补充安全纵深，MV-12~MV-13+MV-18 补充重构模式                                                                                |
| 2026-03-08 | 新建 G47                                          | 归入 gateway-upgrade-verification (GV-01~GV-12) 共 12 个 atoms，形成完整的网关升级验证与安全配置指南组                                                                                                                                                                            |
| 2026-03-08 | 新建 G48, G49, G50                                | 从 js-knowledge-prism 仓库合并：G48 (Knowledge Prism 介绍, 15 atoms)、G49 (Agent-First 架构, 45 atoms)、G50 (多知识库自动化, 12 atoms)                                                                                                                                            |
| 2026-03-08 | 新建 G51, G52                                     | 归入 js-clawhub-project-creation (JC-01~JC-20) 和 js-knowledge-collector-project-creation (JK-01~JK-22) 共 42 个 atoms；形成生态导航站策展与全链路知识收集自动化两个新主题组                                                                                                      |
| 2026-03-08 | 新建 G53                                          | 归入 clawhub-blog-auto-sync-cron (CB-01~CB-16) 共 16 个 atoms，形成博客自动同步与 Cron 集成主题组                                                                                                                                                                                 |
| 2026-03-08 | 新建 G54                                          | 归入 js-clawhub-openclaw-plugin-upgrade (JU-01~JU-20) 共 20 个 atoms，形成 JS ClawHub 插件化升级完整指南组                                                                                                                                                                        |
| 2026-03-08 | 新建 G55                                          | 归入 js-knowledge-prism-project-creation (JP-01~JP-22) 共 22 个 atoms，形成完整的知识棱镜工具创建与架构设计指南组                                                                                                                                                                 |
| 2026-03-08 | 新建 G55                                          | 归入 js-knowledge-prism-project-creation (JP-01~JP-22) 共 22 个 atoms，形成完整的知识棱镜工具创建与架构设计指南组                                                                                                                                                                 |
| 2026-03-09 | 新建 G56                                          | 归入 knowledge-memory-bridge (KB-01~KB-13) 共 13 个 atoms，形成 OpenClaw 记忆系统桥接与增量同步完整指南组                                                                                                                                                                         |
| 2026-03-09 | 新建 G57                                          | 归入 prism-memory-bridge (PB-01~PB-19) 和 memory-core-embedding-hardware-qa (MH-01~MH-13) 共 32 个 atoms，形成完整的记忆系统桥接设计、增量同步实现及硬件/Provider 选型指南组                                                                                                      |
| 2026-03-09 | 更新 G57                                          | 归入 prism-memory-bridge (PB-01~PB-19) 和 memory-core-embedding-hardware-qa (MH-01~MH-13) 共 32 个 atoms，完善记忆系统桥接设计、增量同步实现及硬件/Provider 选型指南                                                                                                              |
| 2026-03-09 | 更新 G57                                          | 归入 prism-memory-bridge (PB-01~PB-19) 和 memory-core-embedding-hardware-qa (MH-01~MH-13) 共 32 个 atoms，完善记忆系统桥接设计、增量同步实现及硬件/Provider 选型指南                                                                                                              |
| 2026-03-09 | 更新 G57                                          | 归入 prism-memory-bridge (PB-01~PB-19) 和 memory-core-embedding-hardware-qa (MH-01~MH-13) 共 32 个 atoms，完善记忆系统桥接设计、增量同步实现及硬件/Provider 选型指南                                                                                                              |
| 2026-03-09 | 更新 G57                                          | 归入 prism-memory-bridge (PB-01~PB-19) 和 memory-core-embedding-hardware-qa (MH-01~MH-13) 共 32 个 atoms，完善记忆系统桥接设计、增量同步实现及硬件/Provider 选型指南                                                                                                              |
| 2026-03-09 | 更新 G57                                          | 归入 prism-memory-bridge (PB-01~PB-19) 和 memory-core-embedding-hardware-qa (MH-01~MH-13) 共 32 个 atoms，完善记忆系统桥接设计、增量同步实现及硬件/Provider 选型指南                                                                                                              |
| 2026-03-10 | 新建 G58                                          | 归入 js-knowledge-prism-3d-graph-upgrade (JG-01~JG-24) 共 24 个 atoms，形成完整的 3D 知识图谱升级与优化指南组                                                                                                                                                                     |
| 2026-03-10 | 新建 G59                                          | 归入 js-knowledge-prism-auto-output-cron (JO-01~JO-14) 共 14 个 atoms，形成知识棱镜全链路自动化产出与 Cron 调度完整指南组                                                                                                                                                         |
| 2026-03-10 | 新建 G60                                          | 归入 js-knowledge-prism-output-cron-reliability (OC-01~OC-15) 共 15 个 atoms，形成 Output Cron 可靠性优化完整指南组                                                                                                                                                               |
| 2026-03-11 | 新建 G61                                          | 归入 js-knowledge-prism-prism-template-author-skill (PT-01~PT-12) 共 12 个 atoms，形成完整的模板创建专用技能开发指南组                                                                                                                                                            |
| 2026-03-12 | 新建 G62                                          | 归入 js-knowledge-prism-draft-fix-process-today (JD-01~JD-10) 共 10 个 atoms，形成 Draft 机制时区修复与今日产出处理完整指南组                                                                                                                                                     |
| 2026-03-12 | 新建 G63                                          | 归入 js-knowledge-prism-rewrite-feature-design-and-implementation (RW-01~RW-12) 共 12 个 atoms，形成完整的知识棱镜改写功能架构设计与实现指南组                                                                                                                                    |
| 2026-03-13 | 新建 G64, G65                                     | 归入 js-eyes-project-creation (EP-01~15) 和 js-knowledge-prism-klstrategy-refactor (JR-01~16) 共 31 个 atoms；形成 JS Eyes 浏览器自动化插件创建指南与 Knowledge Prism 策略化 Structure 刷新重构指南两个新主题组                                                                   |
| 2026-03-16 | 新建 G66                                          | 归入 merge-main-resolve-by-main (OM-01~OM-37) 共 37 个 atoms，形成 2026.3.14 版本大规模上游合并与架构升级完整指南组                                                                                                                                                               |
| 2026-03-17 | 新建 G67                                          | 归入 openclaw-security-architecture-guide (OS-01~OS-41) 共 41 个 atoms，形成完整的 OpenClaw 安全架构原理与纵深防御指南组                                                                                                                                                          |
| 2026-03-18 | 新建 G68                                          | 归入 js-cursor-agent-project-creation (JA-01~JA-20) 共 20 个 atoms，形成完整的 Cursor Agent 长驻进程集成与架构设计指南组                                                                                                                                                          |
| 2026-03-18 | 新建 G69, G70                                     | 归入 feishu-knowledge-base-monetization (FK-01~13) 和 js-vi-system-project-creation (JV-01~19) 共 32 个 atoms；形成飞书知识库变现实战路径与 JS 品牌视觉系统自动化构建两个新主题组                                                                                                 |
| 2026-03-20 | 新建 G71                                          | 归入 js-vi-system-wechat-official-account-cover (JW-01~JW-15) 共 15 个 atoms，形成微信公众号封面图自动化生成与品牌一致性保障指南组                                                                                                                                                |
| 2026-03-20 | 新建 G72, G73                                     | 归入 openclaw-acp-plugin-api-pr-and-merge (OA-01~OA-13) 和 openclaw-plugin-types-and-registry (OT-01~OT-16) 共 26 个 atoms；形成上游 PR 协作策略与插件注册表内部架构两个新主题组                                                                                                  |
