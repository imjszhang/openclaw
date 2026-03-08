# G52: 知识收集器必须采用"inbox/batch 轮转 + 专用 scraper"架构以解决主会话阻塞与多平台适配难题

> 通过将耗时抓取与总结任务从主会话剥离至 cron 隔离处理，并结合浏览器控制与专用解析器，实现全链路自动化而不牺牲交互流畅度。

## 包含的 Atoms

| 编号  | 来源                                    | 内容摘要                                                                                           |
| ----- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| JK-01 | js-knowledge-collector-project-creation | 项目核心需求是给 AI Agent 一个 URL，自动完成抓取、总结、入库、导出的全链路                         |
| JK-02 | js-knowledge-collector-project-creation | 常见痛点包括收藏即遗忘、跨平台内容碎片化以及缺乏结构化摘要                                         |
| JK-03 | js-knowledge-collector-project-creation | 全链路自动化流程为：URL → 抓取网页内容 → AI 总结 → 保存到 SQLite → 可选推送到 Flomo                |
| JK-04 | js-knowledge-collector-project-creation | 主会话调用 LLM 总结会阻塞 session lane，解决方案是采用 inbox/batch 轮转机制隔离处理                |
| JK-05 | js-knowledge-collector-project-creation | 主会话仅负责将任务写入 inbox.jsonl 入队，由 cron 隔离会话定时批量处理队列                          |
| JK-06 | js-knowledge-collector-project-creation | 处理管线包含四个阶段：Scrape（抓取）、Summarize（AI 总结）、Store（入库）、Export（导出）          |
| JK-07 | js-knowledge-collector-project-creation | LLM 总结使用三套独立 Prompt 分别生成结构化概要、推荐理由和精华摘要                                 |
| JK-08 | js-knowledge-collector-project-creation | 技术选型包括 Node.js >= 18、SQLite、Cheerio、OpenAI SDK、WebSocket 和 dotenv                       |
| JK-09 | js-knowledge-collector-project-creation | 服务端渲染页面（如公众号）采用直接抓取模式，SPA 或需登录页面（如小红书）采用浏览器抓取模式         |
| JK-10 | js-knowledge-collector-project-creation | 浏览器抓取模式依赖 JS-Eyes 插件通过 WebSocket 控制真实浏览器实例                                   |
| JK-11 | js-knowledge-collector-project-creation | 项目架构包含 cli 工具、prompts 模板、openclaw-plugin 插件、src 前端、data 数据目录和 docs 构建产物 |
| JK-12 | js-knowledge-collector-project-creation | 插件注册了后台服务、7 个 AI 工具、HTTP 路由和 CLI 命令四类能力                                     |
| JK-13 | js-knowledge-collector-project-creation | 7 个 AI 工具涵盖收集、搜索、列表、详情、统计、删除和导出功能                                       |
| JK-14 | js-knowledge-collector-project-creation | 使用 `openclaw knowledge setup-collector` 命令配置 cron 定时任务                                   |
| JK-15 | js-knowledge-collector-project-creation | Link Collector 技能通过 inbox/batch 轮转机制解决主会话调用耗时操作导致的阻塞问题                   |
| JK-16 | js-knowledge-collector-project-creation | batch 处理采用原子操作：cron 触发时将 inbox.jsonl 重命名为 batch-{timestamp}.jsonl                 |
| JK-17 | js-knowledge-collector-project-creation | 容错设计规定单条处理失败重试小于 3 次则回队列，大于等于 3 次标记永久失败                           |
| JK-18 | js-knowledge-collector-project-creation | 支持平台包括微信公众号、知乎、小红书、即刻、X.com、Reddit、Bilibili、YouTube、GitHub 及通用网页    |
| JK-19 | js-knowledge-collector-project-creation | Bilibili 和 YouTube 平台使用专用 scraper 提取视频信息及字幕                                        |
| JK-20 | js-knowledge-collector-project-creation | X.com (Twitter) 抓取时会自动将移动端 URL 转换为桌面版                                              |
| JK-21 | js-knowledge-collector-project-creation | 2026-03-06 当天完成核心功能闭环，包括全链路实现、7 个 AI 工具、Gateway Web UI 及 cron 配置         |
| JK-22 | js-knowledge-collector-project-creation | 后续演化中明确 link-collector 技能禁止在主会话直接调用 knowledge_collect，必须优先入队             |

## 组内逻辑顺序

按照“需求痛点 -> 核心架构策略 (inbox/batch) -> 处理管线细节 -> 平台适配技术 -> 工具注册与运维”的逻辑顺序排列。
