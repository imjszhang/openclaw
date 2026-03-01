# G30: OpenClaw 技能系统通过“元数据声明 + 三级加载 + 优先级覆盖”机制，实现 AI Agent 能力的灵活扩展与按需激活

> 技能不仅是代码库，更是通过元数据过滤、环境检查与分层加载策略动态注入的上下文增强包，需遵循简洁性与依赖明确性原则。

## 包含的 Atoms

| 编号  | 来源         | 内容摘要                                                                                          |
| ----- | ------------ | ------------------------------------------------------------------------------------------------- |
| SG-01 | skills-guide | 技能（Skills）是 OpenClaw 的核心扩展机制，为 AI Agent 提供专业化知识、工作流程和工具集成          |
| SG-02 | skills-guide | 技能结构包含必需 SKILL.md 文件和可选 resources（scripts/references/assets 目录）                  |
| SG-03 | skills-guide | SKILL.md 前置元数据必需字段：name（小写连字符）、description，可选 metadata/openclaw/homepage     |
| SG-04 | skills-guide | metadata.openclaw 字段包含：emoji、always（总是加载）、primaryEnv、os、requires、install 安装选项 |
| SG-05 | skills-guide | requires 检查项：bins（全部必需）、anyBins（任一满足）、env（环境变量）、config（配置项）         |
| SG-06 | skills-guide | 内置技能 60+ 个，分 10 类：开发工具、笔记文档、通信消息、媒体处理、系统集成、生活服务、智能家居等 |
| SG-07 | skills-guide | 配置文件位置：~/.openclaw/openclaw.json 的 skills 字段，包含 allowBundled/load/install/entries    |
| SG-08 | skills-guide | CLI 命令：skills list（所有）、list --eligible（可用）、list --verbose（详细）、info、check       |
| SG-09 | skills-guide | 技能过滤七条件：enabled 状态、allowBundled 白名单、os 检查、bins/anyBins、env、config             |
| SG-10 | skills-guide | 技能加载优先级（低到高）：Extra 目录→Bundled→Managed→Workspace→Plugin，后加载覆盖先加载           |
| SG-11 | skills-guide | 使用 skill-creator 初始化：`python3 init_skill.py my-skill --path skills/ --resources scripts`    |
| SG-12 | skills-guide | 技能编写最佳实践：保持简洁（Context 是公共资源）、假设 AI 聪明、用示例代替冗长解释                |
| SG-13 | skills-guide | 技能三级加载机制：元数据（始终加载~100 词）→SKILL.md 正文（触发时<5k 词）→资源文件（按需无限制）  |
| SG-14 | skills-guide | 自由度设置：高（文本指导）、中（伪代码/带参数脚本）、低（具体脚本，一致性关键）                   |
| SG-15 | skills-guide | 打包命令：`python3 package_skill.py skills/my-skill ./dist`，自动验证 frontmatter/命名/描述       |
| SG-16 | skills-guide | 禁用内置技能：配置 entries.skill-name.enabled=false；只启用特定技能用 allowBundled 白名单         |
| SG-17 | skills-guide | 设置 API Key 两种方式：apiKey（使用 primaryEnv 映射）或 env 对象直接设置环境变量                  |
| SG-18 | skills-guide | 技能不生效排查四步：skills check 检查、确认依赖安装、检查 allowBundled 过滤、确认 enabled 配置    |
| SG-19 | skills-guide | 技能位置五类：Bundled(skills/)、Managed(~/.openclaw/skills/)、Workspace(<workspace>/skills/) 等   |
| SG-20 | skills-guide | install 配置选项：preferBrew（优先 Homebrew）、nodeManager（npm/pnpm/yarn/bun 选择）              |

## 组内逻辑顺序

逻辑顺序为概念与结构（SG-01~05）→ 分类与配置（SG-06~10）→ 开发与打包（SG-11~15）→ 配置管理与排查（SG-16~20）。
