# G54: JS ClawHub 升级为 OpenClaw 插件需遵循"结构复用 + 动态注入 + 双模并存"策略以实现生态导航站的 AI 化赋能

> 通过将静态导航站重构为插件，利用动态导入和配置透传技术，在保留原有 CLI 能力的同时赋予 AI Agent 直接调用生态数据的能力。

## 包含的 Atoms

| 编号  | 来源                               | 内容摘要                                                                                               |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------ |
| JU-01 | js-clawhub-openclaw-plugin-upgrade | JS ClawHub 是 OpenClaw 生态的策展式导航站，包含项目目录、技能市场、博客、入门指南、社区 Pulse 五大模块 |
| JU-02 | js-clawhub-openclaw-plugin-upgrade | 项目原有两种运行模式：通过 npm build 部署的静态站点和通过 node cli 运行的命令行工具                    |
| JU-03 | js-clawhub-openclaw-plugin-upgrade | 升级为插件可使 AI Agent 直接调用数据、统一密钥管理、集成 HTTP 路由并赋予 Skills 能力                   |
| JU-04 | js-clawhub-openclaw-plugin-upgrade | 参照 js-knowledge-collector 插件的目录结构和注册模式可快速完成开发                                     |
| JU-05 | js-clawhub-openclaw-plugin-upgrade | 插件入口 index.mjs 通过相对路径 import 复用现有 cli/lib 模块，无需修改原有 \_\_dirname 逻辑            |
| JU-06 | js-clawhub-openclaw-plugin-upgrade | 新增 readBlogPost 和 readGuideArticle 函数以支持读取 Markdown 正文，不影响现有逻辑                     |
| JU-07 | js-clawhub-openclaw-plugin-upgrade | 通过 applyEnv 函数将 OpenClaw pluginConfig 注入 process.env，实现配置透传且业务代码零改动              |
| JU-08 | js-clawhub-openclaw-plugin-upgrade | 插件结构包含 openclaw-plugin 目录（入口、清单、技能）以及复用的 cli 和 src 目录                        |
| JU-09 | js-clawhub-openclaw-plugin-upgrade | 注册了 8 个 Agent Tools，涵盖搜索、项目/技能/博客/指南/Pulse 查询、统计及精选内容                      |
| JU-10 | js-clawhub-openclaw-plugin-upgrade | Tool 的 execute 函数使用 async + await import() 懒加载模块，避免启动时加载全部业务代码                 |
| JU-11 | js-clawhub-openclaw-plugin-upgrade | 注册了 11 个 CLI 子命令到 openclaw hub 命名空间，映射原有 clawhub 命令                                 |
| JU-12 | js-clawhub-openclaw-plugin-upgrade | 注册了 10 条 HTTP 路由，前缀为 /plugins/js-clawhub，提供首页、API 数据及静态文件服务                   |
| JU-13 | js-clawhub-openclaw-plugin-upgrade | API 路由选择动态调用 data-reader 而非服务静态 JSON 文件，以保证实时性、一致性和简化依赖                |
| JU-14 | js-clawhub-openclaw-plugin-upgrade | clawhub-navigator Skill 定义了在用户询问生态相关问题时自动触发，并规范了先搜索后回答等行为             |
| JU-15 | js-clawhub-openclaw-plugin-upgrade | 在 OpenClaw UI 配置 Cloudflare/GitHub Token 等字段，通过 applyEnv 自动映射为对应环境变量               |
| JU-16 | js-clawhub-openclaw-plugin-upgrade | 项目 package.json 声明 type: module，因此必须使用动态 import 而非 require 加载模块                     |
| JU-17 | js-clawhub-openclaw-plugin-upgrade | 静态文件路由直接服务 src 目录而非 docs 目录，以确保数据源头唯一且修改即生效                            |
| JU-18 | js-clawhub-openclaw-plugin-upgrade | 通配路由 handler 需进行路径归一化并检查是否以 SRC_DIR 开头，防止通过 ../越界访问                       |
| JU-19 | js-clawhub-openclaw-plugin-upgrade | 在 openclaw.json 中配置插件加载路径及 enabled 状态，并填入 locale 和密钥等 config 项                   |
| JU-20 | js-clawhub-openclaw-plugin-upgrade | 升级后项目支持独立模式和插件模式并存，两者在启动方式、数据访问、站点服务端口及配置来源上不同           |

## 组内逻辑顺序

按照"升级背景与价值 (JU-01~03) -> 架构设计与代码复用策略 (JU-04~08) -> 核心功能实现 (Tools/CLI/Routes) (JU-09~13) -> 安全与配置细节 (JU-14~19) -> 双模运行总结 (JU-20)"的逻辑排列。
