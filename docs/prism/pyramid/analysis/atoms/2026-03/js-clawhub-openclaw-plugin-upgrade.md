# JS ClawHub 升级为 OpenClaw 插件

> 来源：[../../../../journal/2026-03-08/js-clawhub-openclaw-plugin-upgrade.md](../../../../journal/2026-03-08/js-clawhub-openclaw-plugin-upgrade.md)
> 缩写：JU

## Atoms

| 编号  | 类型 | 内容                                                                                                   | 原文定位         |
| ----- | ---- | ------------------------------------------------------------------------------------------------------ | ---------------- |
| JU-01 | 事实 | JS ClawHub 是 OpenClaw 生态的策展式导航站，包含项目目录、技能市场、博客、入门指南、社区 Pulse 五大模块 | 项目背景         |
| JU-02 | 事实 | 项目原有两种运行模式：通过 npm build 部署的静态站点和通过 node cli 运行的命令行工具                    | 项目背景         |
| JU-03 | 判断 | 升级为插件可使 AI Agent 直接调用数据、统一密钥管理、集成 HTTP 路由并赋予 Skills 能力                   | 升级动机         |
| JU-04 | 经验 | 参照 js-knowledge-collector 插件的目录结构和注册模式可快速完成开发                                     | 升级动机         |
| JU-05 | 步骤 | 插件入口 index.mjs 通过相对路径 import 复用现有 cli/lib 模块，无需修改原有 \_\_dirname 逻辑            | 设计原则         |
| JU-06 | 步骤 | 新增 readBlogPost 和 readGuideArticle 函数以支持读取 Markdown 正文，不影响现有逻辑                     | 设计原则         |
| JU-07 | 步骤 | 通过 applyEnv 函数将 OpenClaw pluginConfig 注入 process.env，实现配置透传且业务代码零改动              | 设计原则         |
| JU-08 | 事实 | 插件结构包含 openclaw-plugin 目录（入口、清单、技能）以及复用的 cli 和 src 目录                        | 插件结构         |
| JU-09 | 事实 | 注册了 8 个 Agent Tools，涵盖搜索、项目/技能/博客/指南/Pulse 查询、统计及精选内容                      | 注册内容详解     |
| JU-10 | 经验 | Tool 的 execute 函数使用 async + await import() 懒加载模块，避免启动时加载全部业务代码                 | 注册内容详解     |
| JU-11 | 事实 | 注册了 11 个 CLI 子命令到 openclaw hub 命名空间，映射原有 clawhub 命令                                 | 注册内容详解     |
| JU-12 | 事实 | 注册了 10 条 HTTP 路由，前缀为 /plugins/js-clawhub，提供首页、API 数据及静态文件服务                   | 注册内容详解     |
| JU-13 | 判断 | API 路由选择动态调用 data-reader 而非服务静态 JSON 文件，以保证实时性、一致性和简化依赖                | 注册内容详解     |
| JU-14 | 事实 | clawhub-navigator Skill 定义了在用户询问生态相关问题时自动触发，并规范了先搜索后回答等行为             | 注册内容详解     |
| JU-15 | 步骤 | 在 OpenClaw UI 配置 Cloudflare/GitHub Token 等字段，通过 applyEnv 自动映射为对应环境变量               | 部署配置集成     |
| JU-16 | 判断 | 项目 package.json 声明 type: module，因此必须使用动态 import 而非 require 加载模块                     | 关键技术决策     |
| JU-17 | 判断 | 静态文件路由直接服务 src 目录而非 docs 目录，以确保数据源头唯一且修改即生效                            | 关键技术决策     |
| JU-18 | 步骤 | 通配路由 handler 需进行路径归一化并检查是否以 SRC_DIR 开头，防止通过 ../越界访问                       | 关键技术决策     |
| JU-19 | 步骤 | 在 openclaw.json 中配置插件加载路径及 enabled 状态，并填入 locale 和密钥等 config 项                   | 接入配置         |
| JU-20 | 事实 | 升级后项目支持独立模式和插件模式并存，两者在启动方式、数据访问、站点服务端口及配置来源上不同           | 两种运行模式对比 |
