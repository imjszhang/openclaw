# 使用已部署的 js-knowledge-prism 插件：实操指南

> 来源：[../../../../journal/2026-02-25/using-knowledge-prism-plugin.md](../../../../journal/2026-02-25/using-knowledge-prism-plugin.md)
> 缩写：UP

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位                    |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | --------------------------- |
| UP-01 | 事实 | 插件加载路径配置 (`plugins.load.paths`) 属于最高优先级（优先级 1）的配置来源                      | 当前部署状态                |
| UP-02 | 事实 | 安装方式设为 `source: "path"` 表示使用 `--link` 模式，插件代码修改可即时生效                      | 当前部署状态                |
| UP-03 | 事实 | API 配置支持通过 `${VAR_NAME}` 语法引用 `.env` 文件中的环境变量值                                 | 当前部署状态                |
| UP-04 | 事实 | 插件提供 `knowledge_prism_process` 和 `knowledge_prism_status` 两个供 AI Agent 调用的工具         | 插件提供的两类能力          |
| UP-05 | 事实 | 插件提供 `init`, `process`, `status`, `new-perspective` 四个 CLI 命令                             | 插件提供的两类能力          |
| UP-06 | 步骤 | 在 AI 对话中指定 `stage: 1` 参数可仅执行 atoms 提取阶段，跳过归组和收敛                           | 使用方式一 > 分阶段执行     |
| UP-07 | 事实 | `baseDir` 参数默认值为插件配置值或 workspace 路径，且目录必须包含 `journal/` 和 `pyramid/` 子目录 | 使用方式一 > 参数说明       |
| UP-08 | 经验 | 使用 `--dry-run` 选项可预览待处理内容而不实际调用模型，适合检查文件列表                           | 使用方式二 > 执行增量处理   |
| UP-09 | 步骤 | 组合使用 `--stage 1` 和 `--auto-write` 可先提取 atoms 供人工审查，满意后再执行后续阶段            | 使用方式二 > 典型场景       |
| UP-10 | 步骤 | 运行 `openclaw prism init <dir>` 可生成包含 journal, pyramid, outputs 的标准知识库骨架            | 使用方式二 > 初始化新知识库 |
| UP-11 | 事实 | 阶段 1 (Atoms) 通过 atoms/README.md 中的缩写映射表追踪已处理 journal，具备幂等性                  | 增量处理管线详解 > 阶段 1   |
| UP-12 | 经验 | 阶段 2 (Groups) 的新归组操作可能改变现有分组的观点句措辞，建议处理后审查 INDEX.md 的变化          | 增量处理管线详解 > 阶段 2   |
| UP-13 | 判断 | 阶段 3 (Synthesis) 是最需要人工审查的阶段，因为顶层候选观点直接影响后续视角的建立                 | 增量处理管线详解 > 阶段 3   |
| UP-14 | 事实 | `pyramid/analysis/atoms/` 目录按月存放 atom 文件，`pyramid/analysis/groups/` 存放 G\*.md 分组文件 | 实际知识库结构参照          |
| UP-15 | 步骤 | 修改 `.env` 文件或 `openclaw.json` 中的 `baseUrl`, `model`, `apiKey` 可调整 API 配置              | 配置调优 > 修改 API 配置    |
| UP-16 | 事实 | `timeoutMs` 参数默认值为 1800000 毫秒（30 分钟），用于控制单次 LLM 调用超时                       | 配置调优 > 调整处理参数     |
| UP-17 | 经验 | 若 journal 文件特别长导致超时，应增大 `timeoutMs` 参数值                                          | 故障排查 > LLM 调用超时     |
| UP-18 | 判断 | 若目标目录缺少 `journal/` 或 `pyramid/` 结构，必须先使用 `init` 命令初始化骨架才能进行处理        | 故障排查 > baseDir 路径错误 |
| UP-19 | 经验 | 日常维护工作流建议在 git commit 前审查 git diff，以检查新 atoms 质量及 groups 变化                | 日常使用工作流              |
