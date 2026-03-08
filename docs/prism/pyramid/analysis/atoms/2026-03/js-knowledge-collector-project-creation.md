# JS Knowledge Collector：知识收集器项目的创建

> 来源：[../../../../journal/2026-03-06/js-knowledge-collector-project-creation.md](../../../../journal/2026-03-06/js-knowledge-collector-project-creation.md)
> 缩写：JK

## Atoms

| 编号  | 类型 | 内容                                                                                               | 原文定位               |
| ----- | ---- | -------------------------------------------------------------------------------------------------- | ---------------------- |
| JK-01 | 事实 | 项目核心需求是给 AI Agent 一个 URL，自动完成抓取、总结、入库、导出的全链路                         | 1. 项目动机            |
| JK-02 | 判断 | 常见痛点包括收藏即遗忘、跨平台内容碎片化以及缺乏结构化摘要                                         | 1. 项目动机            |
| JK-03 | 事实 | 全链路自动化流程为：URL → 抓取网页内容 → AI 总结 → 保存到 SQLite → 可选推送到 Flomo                | 2. 核心设计理念        |
| JK-04 | 经验 | 主会话调用 LLM 总结会阻塞 session lane，解决方案是采用 inbox/batch 轮转机制隔离处理                | 2. 核心设计理念        |
| JK-05 | 步骤 | 主会话仅负责将任务写入 inbox.jsonl 入队，由 cron 隔离会话定时批量处理队列                          | 2. 核心设计理念        |
| JK-06 | 事实 | 处理管线包含四个阶段：Scrape（抓取）、Summarize（AI 总结）、Store（入库）、Export（导出）          | 3. 处理管线            |
| JK-07 | 事实 | LLM 总结使用三套独立 Prompt 分别生成结构化概要、推荐理由和精华摘要                                 | 3. 处理管线            |
| JK-08 | 事实 | 技术选型包括 Node.js >= 18、SQLite、Cheerio、OpenAI SDK、WebSocket 和 dotenv                       | 4. 技术选型            |
| JK-09 | 判断 | 服务端渲染页面（如公众号）采用直接抓取模式，SPA 或需登录页面（如小红书）采用浏览器抓取模式         | 4. 技术选型            |
| JK-10 | 事实 | 浏览器抓取模式依赖 JS-Eyes 插件通过 WebSocket 控制真实浏览器实例                                   | 4. 技术选型            |
| JK-11 | 事实 | 项目架构包含 cli 工具、prompts 模板、openclaw-plugin 插件、src 前端、data 数据目录和 docs 构建产物 | 5. 项目架构            |
| JK-12 | 事实 | 插件注册了后台服务、7 个 AI 工具、HTTP 路由和 CLI 命令四类能力                                     | 6. OpenClaw 插件能力   |
| JK-13 | 事实 | 7 个 AI 工具涵盖收集、搜索、列表、详情、统计、删除和导出功能                                       | 6. OpenClaw 插件能力   |
| JK-14 | 步骤 | 使用 `openclaw knowledge setup-collector` 命令配置 cron 定时任务                                   | 6. OpenClaw 插件能力   |
| JK-15 | 经验 | Link Collector 技能通过 inbox/batch 轮转机制解决主会话调用耗时操作导致的阻塞问题                   | 7. Link Collector 技能 |
| JK-16 | 步骤 | batch 处理采用原子操作：cron 触发时将 inbox.jsonl 重命名为 batch-{timestamp}.jsonl                 | 7. Link Collector 技能 |
| JK-17 | 经验 | 容错设计规定单条处理失败重试小于 3 次则回队列，大于等于 3 次标记永久失败                           | 7. Link Collector 技能 |
| JK-18 | 事实 | 支持平台包括微信公众号、知乎、小红书、即刻、X.com、Reddit、Bilibili、YouTube、GitHub 及通用网页    | 8. 支持的平台          |
| JK-19 | 事实 | Bilibili 和 YouTube 平台使用专用 scraper 提取视频信息及字幕                                        | 8. 支持的平台          |
| JK-20 | 事实 | X.com (Twitter) 抓取时会自动将移动端 URL 转换为桌面版                                              | 8. 支持的平台          |
| JK-21 | 事实 | 2026-03-06 当天完成核心功能闭环，包括全链路实现、7 个 AI 工具、Gateway Web UI 及 cron 配置         | 9. 当日进展            |
| JK-22 | 经验 | 后续演化中明确 link-collector 技能禁止在主会话直接调用 knowledge_collect，必须优先入队             | 10. 后续演化           |
