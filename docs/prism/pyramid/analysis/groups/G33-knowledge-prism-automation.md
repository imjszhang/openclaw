# G33: 知识棱镜的自动化落地需通过"OpenClaw 插件化”将繁琐的手动流程转化为 AI 可调用的标准工具

> 手动执行知识棱镜流程在新增 journal 时过于繁琐，必须将其封装为 OpenClaw 插件，利用 AI Agent 直接调用以消除上下文切换成本并缩短反馈循环。

## 包含的 Atoms

| 编号  | 来源                         | 内容摘要                                                                                                           |
| ----- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| FN-01 | from-notes-to-plugin         | 按时间线组织的笔记适合记录过程，但不适合教学或知识复用，会导致查询困难和步骤拼凑繁琐                               |
| FN-02 | from-notes-to-plugin         | 知识棱镜架构包含三层：journal（原始素材层）、pyramid（结构化拆解层）、outputs（读者产出层）                        |
| FN-03 | from-notes-to-plugin         | 架构设计决策标准：若产物随素材规模增长则用目录拆分，若固定则用单文件保持内聚                                       |
| FN-04 | from-notes-to-plugin         | 知识棱镜隐喻：散乱笔记如白光，经结构化拆解（棱镜）后产出面向读者的清晰文章（光谱）                                 |
| FN-05 | from-notes-to-plugin         | 知识棱镜处理流程：提取 atoms → 跨文档归组为 groups → 收敛顶层候选观点 → 建立视角并验证 → 产出成品                  |
| FN-06 | from-notes-to-plugin         | 手动执行知识棱镜流程在新增 journal 时过于繁琐，涉及大量重复性文本处理，需自动化                                    |
| FN-07 | from-notes-to-plugin         | js-knowledge-prism 工具设计目标：零外部依赖、提供编程 API 与 CLI 双入口、LLM 驱动三阶段处理管线                    |
| FN-08 | from-notes-to-plugin         | js-knowledge-prism 核心模块包括 process（处理管线）、status（状态统计）、config（配置）、init（初始化）等          |
| FN-09 | from-notes-to-plugin         | 使用 js-knowledge-prism CLI 命令：init 初始化骨架、process 执行增量处理、status 查看状态、new-perspective 创建视角 |
| FN-10 | from-notes-to-plugin         | 将工具转为 OpenClaw 插件可让 AI Agent 直接调用，消除切换终端的上下文成本，缩短反馈循环                             |
| FN-11 | from-notes-to-plugin         | OpenClaw 插件系统由 loader、discovery、registry、config-state 四个模块协作完成加载与注册                           |
| FN-12 | from-notes-to-plugin         | OpenClaw 插件发现来源按优先级排序：config 指定路径 > workspace 目录 > global 目录 > bundled 目录                   |
| FN-13 | from-notes-to-plugin         | OpenClaw 插件最低结构要求：必需 openclaw.plugin.json（含 id 和 configSchema）和 index.ts（导出 register）          |
| FN-14 | from-notes-to-plugin         | OpenClaw 插件可注册十种能力，包括工具、通道、Provider、Hook、命令、HTTP 路由等                                     |
| FN-15 | from-notes-to-plugin         | 安装本地 OpenClaw 插件应使用 `--link` 模式链接路径，避免复制导致相对路径断裂                                       |
| FN-16 | from-notes-to-plugin         | 知识棱镜插件注册了 `knowledge_prism_process` 和 `knowledge_prism_status`两个 AI 工具供 Agent 调用                  |
| FN-17 | from-notes-to-plugin         | 知识棱镜插件支持动态指定 baseDir，因此同一个插件实例可管理多个符合三层结构的知识库目录                             |
| FN-18 | from-notes-to-plugin         | 需求演化链验证了“增量演化优于一步到位”的方法论，每一步均由前一步实践暴露的痛点自然推动                             |
| FN-19 | from-notes-to-plugin         | 工具和方法论应分离：架构是方法论可用任何工具执行，工具可服务于任何符合结构的知识库                                 |
| FN-20 | from-notes-to-plugin         | 研究插件机制的过程本身即符合知识棱镜 journal 层的运作方式，按时间忠实记录后再由 pyramid 层拆解                     |
| UP-01 | using-knowledge-prism-plugin | 插件加载路径配置 (`plugins.load.paths`) 属于最高优先级（优先级 1）的配置来源                                       |
| UP-02 | using-knowledge-prism-plugin | 安装方式设为 `source: "path"` 表示使用 `--link` 模式，插件代码修改可即时生效                                       |
| UP-03 | using-knowledge-prism-plugin | API 配置支持通过 `${VAR_NAME}` 语法引用 `.env` 文件中的环境变量值                                                  |
| UP-04 | using-knowledge-prism-plugin | 插件提供 `knowledge_prism_process` 和 `knowledge_prism_status` 两个供 AI Agent 调用的工具                          |
| UP-05 | using-knowledge-prism-plugin | 插件提供 `init`, `process`, `status`, `new-perspective` 四个 CLI 命令                                              |
| UP-06 | using-knowledge-prism-plugin | 在 AI 对话中指定 `stage: 1` 参数可仅执行 atoms 提取阶段，跳过归组和收敛                                            |
| UP-07 | using-knowledge-prism-plugin | `baseDir` 参数默认值为插件配置值或 workspace 路径，且目录必须包含 `journal/` 和 `pyramid/` 子目录                  |
| UP-08 | using-knowledge-prism-plugin | 使用 `--dry-run` 选项可预览待处理内容而不实际调用模型，适合检查文件列表                                            |
| UP-09 | using-knowledge-prism-plugin | 组合使用 `--stage 1` 和 `--auto-write` 可先提取 atoms 供人工审查，满意后再执行后续阶段                             |
| UP-10 | using-knowledge-prism-plugin | 运行 `openclaw prism init <dir>` 可生成包含 journal, pyramid, outputs 的标准知识库骨架                             |
| UP-11 | using-knowledge-prism-plugin | 阶段 1 (Atoms) 通过 atoms/README.md 中的缩写映射表追踪已处理 journal，具备幂等性                                   |
| UP-12 | using-knowledge-prism-plugin | 阶段 2 (Groups) 的新归组操作可能改变现有分组的观点句措辞，建议处理后审查 INDEX.md 的变化                           |
| UP-13 | using-knowledge-prism-plugin | 阶段 3 (Synthesis) 是最需要人工审查的阶段，因为顶层候选观点直接影响后续视角的建立                                  |
| UP-14 | using-knowledge-prism-plugin | `pyramid/analysis/atoms/` 目录按月存放 atom 文件，`pyramid/analysis/groups/` 存放 G\*.md 分组文件                  |
| UP-15 | using-knowledge-prism-plugin | 修改 `.env` 文件或 `openclaw.json` 中的 `baseUrl`, `model`, `apiKey` 可调整 API 配置                               |
| UP-16 | using-knowledge-prism-plugin | `timeoutMs` 参数默认值为 1800000 毫秒（30 分钟），用于控制单次 LLM 调用超时                                        |
| UP-17 | using-knowledge-prism-plugin | 若 journal 文件特别长导致超时，应增大 `timeoutMs` 参数值                                                           |
| UP-18 | using-knowledge-prism-plugin | 若目标目录缺少 `journal/` 或 `pyramid/` 结构，必须先使用 `init` 命令初始化骨架才能进行处理                         |
| UP-19 | using-knowledge-prism-plugin | 日常维护工作流建议在 git commit 前审查 git diff，以检查新 atoms 质量及 groups 变化                                 |

## 组内逻辑顺序

本组 atoms 遵循“问题背景 → 解决方案设计 → 插件机制原理 → 实操配置指南 → 运行参数详解 → 维护工作流”的逻辑顺序。

1. **FN-01 至 FN-06**：阐述手动流程的痛点与知识棱镜的核心方法论。
2. **FN-07 至 FN-10**：提出自动化工具的设计目标及插件化的必要性。
3. **FN-11 至 FN-17**：详解 OpenClaw 插件的加载机制、结构要求及知识棱镜插件的具体实现。
4. **FN-18 至 FN-20**：总结方法论与工具分离的哲学及演化过程。
5. **UP-01 至 UP-05**：介绍插件的安装、配置优先级及可用命令/工具。
6. **UP-06 至 UP-18**：详细说明运行参数（stage, baseDir, timeout 等）及异常处理策略。
7. **UP-19**：定义日常维护的最佳实践工作流。
