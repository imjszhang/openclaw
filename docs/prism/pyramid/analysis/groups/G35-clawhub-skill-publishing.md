# G35: ClawHub 技能发布需遵循“文本元数据驱动 + 语义搜索索引 + 安全合规扫描”的标准化分发机制

> 面向 AI Agent 的技能分发必须建立严格的文本格式规范与自动化安全审查流程，以平衡生态开放性与系统安全性。

## 包含的 Atoms

| 编号  | 来源                               | 内容摘要                                                                                                |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| CH-01 | clawhub-publish-guide              | ClawHub 是 OpenClaw 生态的公共技能注册中心，定位类似 npm 但面向 AI Agent 技能包                         |
| CH-02 | clawhub-publish-guide              | ClawHub 后端基于 Convex 构建，认证采用 GitHub OAuth，搜索使用 OpenAI embedding 向量索引                 |
| CH-03 | clawhub-publish-guide              | OpenClaw 有两套扩展机制：插件（运行时代码）和技能（文本形式的 Agent 指令包），ClawHub 管理的是技能      |
| CH-04 | clawhub-publish-guide              | 技能包最低要求仅包含一个 SKILL.md 文件，可附带任意数量的文本支持文件                                    |
| CH-05 | clawhub-publish-guide              | ClawHub 只接受文本文件（如.md, .js, .json 等），明确拒绝二进制文件（如.png, .zip, .exe）                |
| CH-06 | clawhub-publish-guide              | 技能 Slug 格式必须匹配正则 `^[a-z0-9][a-z0-9-]*$`，仅允许小写字母、数字和连字符                         |
| CH-07 | clawhub-publish-guide              | 每次发布必须使用 semver 格式版本号，标签（如 latest）是指向特定版本的指针                               |
| CH-08 | clawhub-publish-guide              | 发布账号需注册超过 7 天，单版本总大小限制为 50MB，且必须包含可解析 frontmatter 的 SKILL.md              |
| CH-09 | clawhub-publish-guide              | SKILL.md 顶部必须包含 YAML frontmatter，定义 name, description, version 及 metadata 元数据              |
| CH-10 | clawhub-publish-guide              | metadata.openclaw 字段支持声明 emoji、OS 支持、环境变量依赖、CLI 工具依赖及安装规范                     |
| CH-11 | clawhub-publish-guide              | 安全审查会比对 frontmatter 声明与实际代码行为，声明缺失或冗余会触发警告影响审核通过                     |
| CH-12 | clawhub-publish-guide              | 发布目录应仅包含插件本身文件，若从项目根目录发布会打包无关文件（如测试、扩展源码）导致包体积过大        |
| CH-13 | clawhub-publish-guide              | 创建 .clawhubignore 文件可排除构建产物、敏感文件和二进制文件，语法同 .gitignore                         |
| CH-14 | clawhub-publish-guide              | 浏览器 OAuth 登录若被防火墙或代理拦截会导致回调失败，此时应改用 --token 方式手动登录                    |
| CH-15 | clawhub-publish-guide              | 使用 `npx clawhub publish` 命令指定目录、slug、版本、标签和 changelog 即可完成技能发布                  |
| CH-16 | clawhub-publish-guide              | 使用 `clawhub inspect <slug> --versions` 可验证发布状态、版本号及标签映射关系                           |
| CH-17 | clawhub-publish-guide              | `clawhub search` 基于向量语义搜索而非关键词匹配，`clawhub sync` 可自动扫描并发布变更的技能              |
| CH-18 | clawhub-publish-guide              | `clawhub delete` 执行的是软删除，原版本号不可复用，需通过 `undelete` 恢复后使用新版本号重新发布         |
| CH-19 | clawhub-publish-guide              | 新发布技能若显示隐藏状态，通常是因为正在排队进行自动安全扫描，等待几分钟即可自动恢复可见                |
| CH-20 | clawhub-publish-guide              | 发布前需检查 SKILL.md 格式、semver 版本唯一性、依赖声明一致性及 .clawhubignore 排除规则是否生效         |
| CH-21 | clawhub-publish-guide              | 环境变量 CLAWHUB_DISABLE_TELEMETRY=1 可用于禁用 sync 命令的遥测数据上报                                 |
| AF-01 | js-eyes-agent-first-transformation | ClawHub 集成 VirusTotal 扫描后，可疑技能需加 `--force` 参数才能安装，否则显示警告拦截用户               |
| AF-02 | js-eyes-agent-first-transformation | `fetch()` 动态 URL、`new WebSocket()` 及含 `api` 的本地路径是触发 VirusTotal 静态分析误报的主要代码模式 |
| AF-03 | js-eyes-agent-first-transformation | 本地自动化代码的网络通信特征与 C2 后门相似，导致 VirusTotal 误报，且该误报无法通过声明消除，只能绕过    |
| AF-04 | js-eyes-agent-first-transformation | 创建 `SECURITY.md` 文件，向用户、审核方及申诉者说明项目无外联、无遥测及误报申诉流程                     |
| AF-05 | js-eyes-agent-first-transformation | 在 `SKILL.md` 的 Prerequisites 和 Install 之间插入"Security & VirusTotal"章节，简述安全性并引导查看详情 |
| AF-06 | js-eyes-agent-first-transformation | 安全声明仅能安抚已看到警告的用户，无法消除警告本身，因此必须提供绕过 ClawHub 的等效安装方式             |

## 组内逻辑顺序

1. **平台机制** (CH-01~CH-03)：定义 ClawHub 的定位、架构及与插件的区别。
2. **发布规范** (CH-04~CH-13)：详述文件格式、命名规则、元数据声明及忽略策略。
3. **操作流程** (CH-14~CH-21)：涵盖登录、发布、验证、搜索、删除及遥测控制。
4. **安全挑战与应对** (AF-01~AF-06)：记录 VirusTotal 误报现象、原因分析及官方文档层面的应对策略（作为发布者的必要补充动作）。

=== GROUP: G36-agent-first-distribution.md ===

# G36: Agent-First 项目必须构建“自主安装脚本 + 多源回退链 + 地域化资源映射”的独立分发体系以解耦市场依赖

> 真正的 Agent-First 意味着掌握从脚本托管到安装流程的全链路控制权，通过技术手段规避第三方市场的安全误报与网络限制。

## 包含的 Atoms

| 编号  | 来源                               | 内容摘要                                                                                                           |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| AF-07 | js-eyes-agent-first-transformation | 在五种安装方案中，curl 脚本因具备“一行命令、跨平台”优势且无需经过市场扫描，被选为最优解                            |
| AF-08 | js-eyes-agent-first-transformation | 编写 `install.sh` 和 `install.ps1` 脚本，流程包含检测环境、获取 Release Tag、下载 Archive、提取 Bundle 及注册配置  |
| AF-09 | js-eyes-agent-first-transformation | 安装脚本支持 `JS_EYES_DIR` 环境变量自定义目录，`JS_EYES_FORCE=1` 跳过确认，管道模式下通过 `/dev/tty` 读取输入      |
| AF-10 | js-eyes-agent-first-transformation | 修改 `SKILL.md` 安装章节为双选项结构：Option A 推荐 curl 一键安装，Option B 保留 ClawHub 并附带警告说明            |
| AF-11 | js-eyes-agent-first-transformation | 落地页 Hero 区域命令框改为 Tab 切换结构，利用 `navigator.platform` 自动检测 Windows 用户并显示对应 PowerShell 命令 |
| AF-12 | js-eyes-agent-first-transformation | 修改 `cli/lib/builder.js` 的 `buildSite` 函数为 async，新增复制安装脚本到 docs 及打包 skill bundle zip 的功能      |
| AF-13 | js-eyes-agent-first-transformation | 安装脚本实现多源回退逻辑：优先下载 Cloudflare CDN 托管的 zip，失败则回退至 GitHub Archive，最后尝试 jsDelivr       |
| AF-14 | js-eyes-agent-first-transformation | 多源回退策略中每个下载源设置 10-15 秒超时，以确保快速切换至可用源                                                  |
| AF-15 | js-eyes-agent-first-transformation | 落地页 i18n 配置中，中文用户显示 `js-eyes.com` 域名的安装命令，英文用户显示 `raw.githubusercontent.com` 命令       |
| AF-16 | js-eyes-agent-first-transformation | 单一分发渠道的安全策略不应成为项目推广瓶颈，提供自主安装脚本是解耦市场依赖的正确做法                               |
| AF-17 | js-eyes-agent-first-transformation | curl/PowerShell 脚本配合 GitHub Pages 和 Cloudflare 是覆盖主流 OS 且成本最低的安装基础设施方案                     |
| AF-18 | js-eyes-agent-first-transformation | 针对国内网络场景，构建“自有域名→GitHub→jsDelivr"的多源回退链并设置短超时，是成本最低的可靠方案                     |
| AF-19 | js-eyes-agent-first-transformation | 真正的本地化（i18n）不仅是文字翻译，还包括根据用户地域提供可访问的资源 URL                                         |
| AF-20 | js-eyes-agent-first-transformation | Agent-First 的核心含义是项目自主掌控从脚本托管、下载源到安装流程的全链路，不依赖第三方市场审核策略                 |

## 组内逻辑顺序

1. **策略选型** (AF-07, AF-16, AF-20)：确立自主安装脚本为最优解及其核心哲学。
2. **脚本实现** (AF-08, AF-09, AF-12)：具体脚本的功能逻辑、环境变量支持及构建集成。
3. **用户体验优化** (AF-10, AF-11)：文档结构调整与落地页的自动化 OS 检测展示。
4. **高可用架构** (AF-13, AF-14, AF-17, AF-18)：多源回退机制、超时设置及低成本基础设施组合。
5. **地域化适配** (AF-15, AF-19)：基于地域的资源 URL 映射与真正的 i18n 定义。

=== GROUP: G37-skill-discovery-automation.md ===

# G37: 技能发现系统应从“手动注册”演进为"GitHub Pages 静态注册表 + AI 工具链”的自动化架构以实现 Agent 友好

> 利用静态 JSON 注册表作为唯一真相来源，结合自动化构建与 AI 工具，可消除人工配置错误并赋予 Agent 自主发现能力。

## 包含的 Atoms

| 编号  | 来源                                             | 内容摘要                                                                                         |
| ----- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| SD-01 | skill-discovery-system-design-and-implementation | js-eyes 扩展技能安装原流程需用户手动复制路径、编辑 openclaw.json 并重启，易出错且 Agent 无法感知 |
| SD-02 | skill-discovery-system-design-and-implementation | 主插件代注册方案违背 OpenClaw「一插件一注册」原则，且导致子技能配置透传困难                      |
| SD-03 | skill-discovery-system-design-and-implementation | 安装脚本自动注册方案虽零侵入但仅为一次性操作，新增子技能需重新安装或手动更新                     |
| SD-04 | skill-discovery-system-design-and-implementation | 最终架构选择 GitHub Pages 静态注册表方案，核心考量是不依赖上游改动、Agent 友好且利用现有基础设施 |
| SD-05 | skill-discovery-system-design-and-implementation | 技能发现体系分为四层：skills.json 静态注册表、独立 zip 包、安装脚本、OpenClaw AI 工具            |
| SD-06 | skill-discovery-system-design-and-implementation | 构建流程需新增 YAML Frontmatter 解析器、子技能发现函数、子技能打包函数及注册表生成函数           |
| SD-07 | skill-discovery-system-design-and-implementation | install.sh 支持通过参数指定子技能 ID，从 skills.json 解析下载 URL 并自动解压安装                 |
| SD-08 | skill-discovery-system-design-and-implementation | install.ps1 因管道执行限制，需新增函数或通过环境变量 JS_EYES_SKILL 触发子技能安装                |
| SD-09 | skill-discovery-system-design-and-implementation | js_eyes_discover_skills 工具通过 HTTP 获取注册表并检查本地目录判断安装状态                       |
| SD-10 | skill-discovery-system-design-and-implementation | js_eyes_install_skill 工具执行流程包含下载 zip、跨平台解压、npm install 及自动写入 openclaw.json |
| SD-11 | skill-discovery-system-design-and-implementation | 自定义 YAML 解析器中，栈弹出条件应为 indent < stack.top.indent，使用<=会导致同级节点被错误弹出   |
| SD-12 | skill-discovery-system-design-and-implementation | skills.json 注册表由 skills/\*/SKILL.md 的 YAML frontmatter 自动生成，作为系统唯一真相来源       |
| SD-13 | skill-discovery-system-design-and-implementation | 自动化流程必须保留清晰的手动执行路径作为信任基础，而非仅作为兜底方案                             |
| SD-14 | skill-discovery-system-design-and-implementation | 从网站入手优于内部方案，因为静态 JSON 文件可同时服务于 Agent、人类用户和网页访问者               |

## 组内逻辑顺序

1. **问题与方案演进** (SD-01~SD-04)：分析手动注册痛点，对比不同方案，确立静态注册表架构。
2. **体系设计** (SD-05, SD-06, SD-12, SD-14)：定义四层体系、构建流程组件及注册表生成逻辑。
3. **工具实现** (SD-07~SD-10)：安装脚本的参数化支持及 AI 工具（discover/install）的具体执行流。
4. **技术细节与原则** (SD-11, SD-13)：YAML 解析的边界条件修正及自动化与手动路径并存的原则。

=== GROUP: G38-openclaw-path-resolution.md ===

# G38: OpenClaw 路径解析存在 State 目录与 Workspace 目录的分离机制，需通过环境变量或配置文件显式对齐以避免 ENOENT 错误

> 默认 Workspace 解析逻辑独立于 State 目录环境变量，这种分离设计要求用户必须显式配置以保障跨盘符部署的一致性。

## 包含的 Atoms

| 编号  | 来源                                       | 内容摘要                                                                                                   |
| ----- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| OP-01 | workspace-path-openclaw-state-dir-mismatch | OpenClaw 中 State 目录由 `OPENCLAW_STATE_DIR` 控制，默认 Workspace 目录由 `OPENCLAW_HOME` 或系统家目录控制 |
| OP-02 | workspace-path-openclaw-state-dir-mismatch | `resolveDefaultAgentWorkspaceDir` 函数解析逻辑完全不依赖 `OPENCLAW_STATE_DIR` 环境变量                     |
| OP-03 | workspace-path-openclaw-state-dir-mismatch | 默认 Workspace 解析优先级顺序为：`OPENCLAW_HOME` > `HOME` > `USERPROFILE` > `os.homedir()`                 |
| OP-04 | workspace-path-openclaw-state-dir-mismatch | 仅设置 `OPENCLAW_STATE_DIR` 会导致 read/memory 等工具仍访问 C 盘默认路径从而报 ENOENT 错误                 |
| OP-05 | workspace-path-openclaw-state-dir-mismatch | 在 `openclaw.json` 的 `agents.defaults.workspace` 字段显式指定路径可覆盖默认解析逻辑                       |
| OP-06 | workspace-path-openclaw-state-dir-mismatch | Agent Workspace 解析优先级为：Agent 配置 > 默认 Agent 配置 > `resolveDefaultAgentWorkspaceDir()`           |
| OP-07 | workspace-path-openclaw-state-dir-mismatch | 设置 `OPENCLAW_HOME` 环境变量可一次性将所有基于 home 的路径（含 workspace）迁移到指定磁盘                  |
| OP-08 | workspace-path-openclaw-state-dir-mismatch | 代码层面让默认 workspace 跟随 state 目录是可行优化方向，但本次修复选择通过配置文件解决                     |

## 组内逻辑顺序

1. **机制揭示** (OP-01~OP-03)：阐明 State 与 Workspace 目录控制变量的分离现状及解析优先级。
2. **故障现象** (OP-04)：描述因分离导致的 ENOENT 错误场景。
3. **解决方案** (OP-05~OP-07)：提供配置文件覆盖、环境变量全局迁移两种修复手段及优先级说明。
4. **后续优化** (OP-08)：记录代码层改进的可行性与当前决策。

=== INDEX_ROWS ===
| G35 | ClawHub 技能发布需遵循“文本元数据驱动 + 语义搜索索引 + 安全合规扫描”的标准化分发机制 | 26 | 2026-02 |
| G36 | Agent-First 项目必须构建“自主安装脚本 + 多源回退链 + 地域化资源映射”的独立分发体系以解耦市场依赖 | 14 | 2026-02 |
| G37 | 技能发现系统应从“手动注册”演进为"GitHub Pages 静态注册表 + AI 工具链”的自动化架构以实现 Agent 友好 | 14 | 2026-02 |
| G38 | OpenClaw 路径解析存在 State 目录与 Workspace 目录的分离机制，需通过环境变量或配置文件显式对齐以避免 ENOENT 错误 | 8 | 2026-02 |
