# JS Knowledge Prism：知识棱镜工具的创建

> 来源：[../../../../journal/2026-02-24/js-knowledge-prism-project-creation.md](../../../../journal/2026-02-24/js-knowledge-prism-project-creation.md)
> 缩写：JP

## Atoms

| 编号  | 类型 | 内容                                                                                           | 原文定位                    |
| ----- | ---- | ---------------------------------------------------------------------------------------------- | --------------------------- |
| JP-01 | 判断 | 按时间线组织的笔记存在检索困难和拼凑步骤的问题，不适合教学或知识复用                           | 1. 项目动机                 |
| JP-02 | 经验 | 知识棱镜隐喻将散乱笔记比作白光，通过结构化拆解折射为面向读者的清晰文章（光谱）                 | 2. 核心概念：知识棱镜       |
| JP-03 | 事实 | 系统采用三层架构：Journal（原始素材）、Pyramid（结构化拆解）、Outputs（读者产出）              | 3. 三层架构设计             |
| JP-04 | 事实 | Journal 层的核心原则是“只增不改”，忠实记录探索过程而不进行结构化                               | 3.1 Journal（原始素材层）   |
| JP-05 | 事实 | Pyramid 层包含分析轨（Atoms/Groups/Synthesis）和结构轨（Perspective/SCQA/Key Line/Validation） | 3.2 Pyramid（结构化拆解层） |
| JP-06 | 事实 | Atoms 是从 journal 中提取的最小知识单元，按月分目录存储                                        | 3.2 Pyramid（结构化拆解层） |
| JP-07 | 事实 | Groups 负责跨文档边界归组 atoms，并为每组提炼一个观点句                                        | 3.2 Pyramid（结构化拆解层） |
| JP-08 | 事实 | Synthesis 负责从观点句中收敛出顶层候选观点                                                     | 3.2 Pyramid（结构化拆解层） |
| JP-09 | 步骤 | 增量处理管线分为三阶段：Atoms 提取、Groups 归组、Synthesis 收敛，均由 LLM 驱动                 | 4. 增量处理管线             |
| JP-10 | 经验 | 增量处理管线设计遵循只处理新增 journal、幂等性以及完全由 LLM 驱动而非规则匹配的原则            | 4. 增量处理管线             |
| JP-11 | 事实 | 技术选型要求 Node.js >= 18 以支持 ES Module 并与 OpenClaw 生态一致                             | 5. 技术选型                 |
| JP-12 | 判断 | 核心库和独立 CLI 刻意选择零外部依赖以降低安装门槛，仅 CLI 工具链使用 archiver 进行打包         | 5. 技术选型                 |
| JP-13 | 事实 | 项目架构采用双入口设计：独立 CLI（npx 调用）和 OpenClaw 插件，共享同一套 lib 核心模块          | 6. 项目架构                 |
| JP-14 | 事实 | 独立 CLI 通过.env 文件配置 API，而 OpenClaw 插件通过 openclaw.json 配置，但处理逻辑一致        | 6. 项目架构                 |
| JP-15 | 步骤 | 独立 CLI 支持 init、process、status、new-perspective 四个基础命令                              | 7. CLI 工具                 |
| JP-16 | 步骤 | OpenClaw 插件 CLI 额外支持 output、agent-index、register/unregister、setup-cron 等管理命令     | 7. CLI 工具                 |
| JP-17 | 事实 | 插件注册了 14 个 AI 工具，覆盖核心处理、视角管理、产出生成、多库管理及技能扩展                 | 8. OpenClaw 插件能力        |
| JP-18 | 事实 | 插件默认配置 LLM 温度为 0.3，单次最大 token 数为 8192，请求超时设置为 30 分钟                  | 8. OpenClaw 插件能力        |
| JP-19 | 步骤 | 支持注册多个知识库并通过 cron 定时任务调用 knowledge_prism_process_all 进行批量自动处理        | 8. OpenClaw 插件能力        |
| JP-20 | 事实 | 扩展技能系统通过 skills.json 注册表配合 discover 和 install 工具实现技能的发现与安装           | 9. 扩展技能系统             |
| JP-21 | 事实 | 项目演化路径依次为：核心管线、插件化、视角工具链、产出生成、多库管理、自动化调度               | 11. 版本演化                |
| JP-22 | 事实 | v1.0.0 版本于 2026-03-01 正式发布，包含 5 个 AI 工具、CLI、技能系统及安装脚本                  | 11. 版本演化                |
