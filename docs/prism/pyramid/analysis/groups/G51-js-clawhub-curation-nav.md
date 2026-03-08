# G51: JS ClawHub 通过"纯静态架构 + 人工策展定位"打造轻量级 OpenClaw 生态导航站

> 区别于官方 ClawHub 的发布安装功能，JS ClawHub 专注于解决“有什么值得关注”的 curated discovery 需求，以零后端依赖实现高效聚合。

## 包含的 Atoms

| 编号  | 来源                        | 内容摘要                                                                                                 |
| ----- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| JC-01 | js-clawhub-project-creation | JS ClawHub 是为 OpenClaw 生态打造的策展式导航站，旨在聚合项目、技能、教程和社区动态                      |
| JC-02 | js-clawhub-project-creation | JS ClawHub 与官方 ClawHub 是互补关系：前者解决“有什么值得关注”，后者解决“技能怎么发布和安装”             |
| JC-03 | js-clawhub-project-creation | JS ClawHub 的核心定位是人工精选的策展（Curation），区别于自动抓取或无筛选的一般目录站                    |
| JC-04 | js-clawhub-project-creation | 项目名中的"JS"既代表作者 ID（imjszhang），也代表技术栈特征（纯前端 JavaScript 实现，零后端依赖）         |
| JC-05 | js-clawhub-project-creation | 技术栈包含纯静态 HTML、Neo-Brutalism 设计风格、Tailwind CSS、Three.js、marked.js 和 highlight.js         |
| JC-06 | js-clawhub-project-creation | 对于内容导航站，原生 HTML 加模块化 JS 比 React/Vue 等框架更合适，可减少构建复杂度和加载体积              |
| JC-07 | js-clawhub-project-creation | 自研 I18nManager 采用轻量级客户端国际化方案，通过 `data-i18n` 属性驱动语言切换                           |
| JC-08 | js-clawhub-project-creation | 首版 v1.0.0 包含六大模块：项目导航、技能市场、博客系统、入门指南、Pulse 动态和中英双语支持               |
| JC-09 | js-clawhub-project-creation | Pulse 动态模块利用 AI 从 X/Twitter 筛选 OpenClaw 社区热点，每日自动更新以过滤社交媒体噪音                |
| JC-10 | js-clawhub-project-creation | 双语实现覆盖 UI 翻译（data-i18n）、双语 JSON 数据对象以及默认中文加 `.en-US.md` 后缀的 Markdown 文件     |
| JC-11 | js-clawhub-project-creation | 语言偏好通过 localStorage 持久化，导航栏提供一键切换功能                                                 |
| JC-12 | js-clawhub-project-creation | 项目架构严格分离 src/（源码）和 docs/（部署产物），构建管线负责转换                                      |
| JC-13 | js-clawhub-project-creation | shared/ 目录集中管理导航栏、页脚、i18n 和搜索等公共复用模块                                              |
| JC-14 | js-clawhub-project-creation | 数据与展示分离，项目、技能和博客数据通过 JSON 文件管理，由 HTML 模板负责渲染                             |
| JC-15 | js-clawhub-project-creation | CLI 工具入口为 `cli/cli.js`，遵循 stdout 输出 JSON 数据、stderr 输出日志的标准                           |
| JC-16 | js-clawhub-project-creation | 执行 `node cli/cli.js sync` 命令可一键完成站点构建、Git 提交和推送到远程仓库的全流程                     |
| JC-17 | js-clawhub-project-creation | 构建管线包含复制文件、注入 Google Analytics、校验 i18n 完整性、清理 Pulse 数据和生成 API 层等 7 个步骤   |
| JC-18 | js-clawhub-project-creation | 部署策略采用 GitHub Pages 托管 docs/ 目录，配合 Cloudflare 免费 CDN 和 CNAME 自定义域名配置              |
| JC-19 | js-clawhub-project-creation | 创建日当天完成了首页设计、风格系统、3D 背景动画及核心框架，实现了首版可运行状态                          |
| JC-20 | js-clawhub-project-creation | 项目截至 2026-03-08 已积累 379 次提交，发布了 v1.0.0（首版）和 v1.1.0（动态 sitemap 及 GA 更新）两个版本 |

## 组内逻辑顺序

按照“定位与价值 -> 技术选型与架构 -> 核心功能模块 -> 构建部署与演化”的结构顺序排列。
