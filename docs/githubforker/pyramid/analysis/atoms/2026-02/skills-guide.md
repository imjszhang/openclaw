# OpenClaw 技能系统指南

> 来源：[../../../../journal/2026-02-01/skills-guide.md](../../../../journal/2026-02-01/skills-guide.md)
> 缩写：SG

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位               |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | ---------------------- |
| SG-01 | 事实 | 技能（Skills）是 OpenClaw 的核心扩展机制，为 AI Agent 提供专业化知识、工作流程和工具集成          | 一、技能系统概述       |
| SG-02 | 事实 | 技能结构包含必需 SKILL.md 文件和可选 resources（scripts/references/assets 目录）                  | 技能的结构             |
| SG-03 | 事实 | SKILL.md 前置元数据必需字段：name（小写连字符）、description，可选 metadata/openclaw/homepage     | SKILL.md 格式          |
| SG-04 | 事实 | metadata.openclaw 字段包含：emoji、always（总是加载）、primaryEnv、os、requires、install 安装选项 | metadata.openclaw 字段 |
| SG-05 | 事实 | requires 检查项：bins（全部必需）、anyBins（任一满足）、env（环境变量）、config（配置项）         | metadata.openclaw 字段 |
| SG-06 | 事实 | 内置技能 60+ 个，分 10 类：开发工具、笔记文档、通信消息、媒体处理、系统集成、生活服务、智能家居等 | 二、内置技能列表       |
| SG-07 | 事实 | 配置文件位置：~/.openclaw/openclaw.json 的 skills 字段，包含 allowBundled/load/install/entries    | 3.1 配置文件位置       |
| SG-08 | 步骤 | CLI 命令：skills list（所有）、list --eligible（可用）、list --verbose（详细）、info、check       | 3.2 CLI 命令           |
| SG-09 | 事实 | 技能过滤七条件：enabled 状态、allowBundled 白名单、os 检查、bins/anyBins、env、config             | 3.3 技能过滤机制       |
| SG-10 | 事实 | 技能加载优先级（低到高）：Extra 目录→Bundled→Managed→Workspace→Plugin，后加载覆盖先加载           | 3.4 技能加载优先级     |
| SG-11 | 步骤 | 使用 skill-creator 初始化：`python3 init_skill.py my-skill --path skills/ --resources scripts`    | 4.1 使用 skill-creator |
| SG-12 | 经验 | 技能编写最佳实践：保持简洁（Context 是公共资源）、假设 AI 聪明、用示例代替冗长解释                | 4.3 保持简洁           |
| SG-13 | 事实 | 技能三级加载机制：元数据（始终加载~100 词）→SKILL.md 正文（触发时<5k 词）→资源文件（按需无限制）  | 4.3 渐进式披露         |
| SG-14 | 判断 | 自由度设置：高（文本指导）、中（伪代码/带参数脚本）、低（具体脚本，一致性关键）                   | 4.3 设置合适的自由度   |
| SG-15 | 步骤 | 打包命令：`python3 package_skill.py skills/my-skill ./dist`，自动验证 frontmatter/命名/描述       | 4.5 打包和分发         |
| SG-16 | 经验 | 禁用内置技能：配置 entries.skill-name.enabled=false；只启用特定技能用 allowBundled 白名单         | 六、常见问题           |
| SG-17 | 经验 | 设置 API Key 两种方式：apiKey（使用 primaryEnv 映射）或 env 对象直接设置环境变量                  | 六、常见问题           |
| SG-18 | 经验 | 技能不生效排查四步：skills check 检查、确认依赖安装、检查 allowBundled 过滤、确认 enabled 配置    | 六、常见问题           |
| SG-19 | 事实 | 技能位置五类：Bundled(skills/)、Managed(~/.openclaw/skills/)、Workspace(<workspace>/skills/) 等   | 五、技能位置总结       |
| SG-20 | 事实 | install 配置选项：preferBrew（优先 Homebrew）、nodeManager（npm/pnpm/yarn/bun 选择）              | 3.1 配置文件位置       |
