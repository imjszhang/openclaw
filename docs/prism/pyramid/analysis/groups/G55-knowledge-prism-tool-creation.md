# G55: 知识棱镜工具创建需遵循“三层架构 + 双入口设计 + 零依赖核心”策略以实现低门槛与高扩展性

> 知识棱镜工具的构建必须通过严格的分层架构解耦素材与产出，利用双入口模式适配不同场景，并坚持零依赖核心以确保生态兼容性与安装便捷性。

## 包含的 Atoms

| 编号  | 来源                                | 内容摘要                                                                                       |
| ----- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| JP-01 | js-knowledge-prism-project-creation | 按时间线组织的笔记存在检索困难和拼凑步骤的问题，不适合教学或知识复用                           |
| JP-02 | js-knowledge-prism-project-creation | 知识棱镜隐喻将散乱笔记比作白光，通过结构化拆解折射为面向读者的清晰文章（光谱）                 |
| JP-03 | js-knowledge-prism-project-creation | 系统采用三层架构：Journal（原始素材）、Pyramid（结构化拆解）、Outputs（读者产出）              |
| JP-04 | js-knowledge-prism-project-creation | Journal 层的核心原则是“只增不改”，忠实记录探索过程而不进行结构化                               |
| JP-05 | js-knowledge-prism-project-creation | Pyramid 层包含分析轨（Atoms/Groups/Synthesis）和结构轨（Perspective/SCQA/Key Line/Validation） |
| JP-06 | js-knowledge-prism-project-creation | Atoms 是从 journal 中提取的最小知识单元，按月分目录存储                                        |
| JP-07 | js-knowledge-prism-project-creation | Groups 负责跨文档边界归组 atoms，并为每组提炼一个观点句                                        |
| JP-08 | js-knowledge-prism-project-creation | Synthesis 负责从观点句中收敛出顶层候选观点                                                     |
| JP-09 | js-knowledge-prism-project-creation | 增量处理管线分为三阶段：Atoms 提取、Groups 归组、Synthesis 收敛，均由 LLM 驱动                 |
| JP-10 | js-knowledge-prism-project-creation | 增量处理管线设计遵循只处理新增 journal、幂等性以及完全由 LLM 驱动而非规则匹配的原则            |
| JP-11 | js-knowledge-prism-project-creation | 技术选型要求 Node.js >= 18 以支持 ES Module 并与 OpenClaw 生态一致                             |
| JP-12 | js-knowledge-prism-project-creation | 核心库和独立 CLI 刻意选择零外部依赖以降低安装门槛，仅 CLI 工具链使用 archiver 进行打包         |
| JP-13 | js-knowledge-prism-project-creation | 项目架构采用双入口设计：独立 CLI（npx 调用）和 OpenClaw 插件，共享同一套 lib 核心模块          |
| JP-14 | js-knowledge-prism-project-creation | 独立 CLI 通过.env 文件配置 API，而 OpenClaw 插件通过 openclaw.json 配置，但处理逻辑一致        |
| JP-15 | js-knowledge-prism-project-creation | 独立 CLI 支持 init、process、status、new-perspective 四个基础命令                              |
| JP-16 | js-knowledge-prism-project-creation | OpenClaw 插件 CLI 额外支持 output、agent-index、register/unregister、setup-cron 等管理命令     |
| JP-17 | js-knowledge-prism-project-creation | 插件注册了 14 个 AI 工具，覆盖核心处理、视角管理、产出生成、多库管理及技能扩展                 |
| JP-18 | js-knowledge-prism-project-creation | 插件默认配置 LLM 温度为 0.3，单次最大 token 数为 8192，请求超时设置为 30 分钟                  |
| JP-19 | js-knowledge-prism-project-creation | 支持注册多个知识库并通过 cron 定时任务调用 knowledge_prism_process_all 进行批量自动处理        |
| JP-20 | js-knowledge-prism-project-creation | 扩展技能系统通过 skills.json 注册表配合 discover 和 install 工具实现技能的发现与安装           |
| JP-21 | js-knowledge-prism-project-creation | 项目演化路径依次为：核心管线、插件化、视角工具链、产出生成、多库管理、自动化调度               |
| JP-22 | js-knowledge-prism-project-creation | v1.0.0 版本于 2026-03-01 正式发布，包含 5 个 AI 工具、CLI、技能系统及安装脚本                  |

## 组内逻辑顺序

遵循“问题定义与隐喻 (JP-01~02) -> 核心架构设计 (JP-03~08) -> 处理管线逻辑 (JP-09~10) -> 技术选型与依赖策略 (JP-11~12) -> 双入口实现细节 (JP-13~16) -> 功能扩展与配置 (JP-17~20) -> 演化路径与发布 (JP-21~22)"的结构顺序。
