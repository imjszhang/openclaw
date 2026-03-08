# JS ClawHub：OpenClaw 生态导航站的创建

> 来源：[../../../../journal/2026-02-12/js-clawhub-project-creation.md](../../../../journal/2026-02-12/js-clawhub-project-creation.md)
> 缩写：JC

## Atoms

| 编号  | 类型 | 内容                                                                                                     | 原文定位     |
| ----- | ---- | -------------------------------------------------------------------------------------------------------- | ------------ |
| JC-01 | 事实 | JS ClawHub 是为 OpenClaw 生态打造的策展式导航站，旨在聚合项目、技能、教程和社区动态                      | 项目动机     |
| JC-02 | 判断 | JS ClawHub 与官方 ClawHub 是互补关系：前者解决“有什么值得关注”，后者解决“技能怎么发布和安装”             | 项目动机     |
| JC-03 | 事实 | JS ClawHub 的核心定位是人工精选的策展（Curation），区别于自动抓取或无筛选的一般目录站                    | 定位与差异化 |
| JC-04 | 经验 | 项目名中的"JS"既代表作者 ID（imjszhang），也代表技术栈特征（纯前端 JavaScript 实现，零后端依赖）         | 定位与差异化 |
| JC-05 | 事实 | 技术栈包含纯静态 HTML、Neo-Brutalism 设计风格、Tailwind CSS、Three.js、marked.js 和 highlight.js         | 技术选型     |
| JC-06 | 判断 | 对于内容导航站，原生 HTML 加模块化 JS 比 React/Vue 等框架更合适，可减少构建复杂度和加载体积              | 技术选型     |
| JC-07 | 事实 | 自研 I18nManager 采用轻量级客户端国际化方案，通过 `data-i18n` 属性驱动语言切换                           | 技术选型     |
| JC-08 | 事实 | 首版 v1.0.0 包含六大模块：项目导航、技能市场、博客系统、入门指南、Pulse 动态和中英双语支持               | 首版功能设计 |
| JC-09 | 事实 | Pulse 动态模块利用 AI 从 X/Twitter 筛选 OpenClaw 社区热点，每日自动更新以过滤社交媒体噪音                | 首版功能设计 |
| JC-10 | 事实 | 双语实现覆盖 UI 翻译（data-i18n）、双语 JSON 数据对象以及默认中文加 `.en-US.md` 后缀的 Markdown 文件     | 首版功能设计 |
| JC-11 | 事实 | 语言偏好通过 localStorage 持久化，导航栏提供一键切换功能                                                 | 首版功能设计 |
| JC-12 | 事实 | 项目架构严格分离 src/（源码）和 docs/（部署产物），构建管线负责转换                                      | 项目架构     |
| JC-13 | 事实 | shared/ 目录集中管理导航栏、页脚、i18n 和搜索等公共复用模块                                              | 项目架构     |
| JC-14 | 事实 | 数据与展示分离，项目、技能和博客数据通过 JSON 文件管理，由 HTML 模板负责渲染                             | 项目架构     |
| JC-15 | 事实 | CLI 工具入口为 `cli/cli.js`，遵循 stdout 输出 JSON 数据、stderr 输出日志的标准                           | CLI 工具     |
| JC-16 | 步骤 | 执行 `node cli/cli.js sync` 命令可一键完成站点构建、Git 提交和推送到远程仓库的全流程                     | CLI 工具     |
| JC-17 | 事实 | 构建管线包含复制文件、注入 Google Analytics、校验 i18n 完整性、清理 Pulse 数据和生成 API 层等 7 个步骤   | CLI 工具     |
| JC-18 | 事实 | 部署策略采用 GitHub Pages 托管 docs/ 目录，配合 Cloudflare 免费 CDN 和 CNAME 自定义域名配置              | 部署策略     |
| JC-19 | 经验 | 创建日当天完成了首页设计、风格系统、3D 背景动画及核心框架，实现了首版可运行状态                          | 当日进展     |
| JC-20 | 事实 | 项目截至 2026-03-08 已积累 379 次提交，发布了 v1.0.0（首版）和 v1.1.0（动态 sitemap 及 GA 更新）两个版本 | 后续演化     |
