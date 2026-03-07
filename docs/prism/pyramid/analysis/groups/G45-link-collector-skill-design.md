# G45: link-collector 技能采用 inbox/batch 轮转与 CLI 子命令注册 cron，实现链接收集与定时入库的并发安全

> 技能文件随插件走只读共享，运行时数据留 workspace 独立；setup-collector 通过 openclaw cron 注册定时任务，用户显式控制 token 消耗。

## 包含的 Atoms

| 编号  | 来源                     | 内容摘要                                                                                                      |
| ----- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| LC-01 | link-collector-skill-dev | link-collector 技能实现：链接收集入队、cron 定时调用 knowledge_collect 入库、容错重试、并发安全               |
| LC-02 | link-collector-skill-dev | 数据格式选 JSONL：追加写入不需读全文件、单行损坏不影响其他记录                                                |
| LC-03 | link-collector-skill-dev | 并发模型采用 inbox/batch 轮转：收集侧只写 inbox，处理侧 rename 为 batch 后操作，文件层面完全隔离              |
| LC-04 | link-collector-skill-dev | Cron 每 30 分钟配合 maxConcurrentRuns:1，上一轮未完成时自动跳过                                               |
| LC-05 | link-collector-skill-dev | 选择 CLI 子命令（openclaw knowledge setup-collector）而非自动注册 cron，理由：token 消耗由用户显式决定        |
| LC-06 | link-collector-skill-dev | 插件通过 openclaw.plugin.json 的 "skills": ["./skills"] 声明技能目录，启用后自动发现加载                      |
| LC-07 | link-collector-skill-dev | 技能文件（SKILL.md、references）随插件走只读共享；运行时数据（inbox、batch、archive）留 workspace 独立        |
| LC-08 | link-collector-skill-dev | 数据路径从技能相对 data/inbox.jsonl 改为 workspace 相对 .openclaw/link-collector/inbox.jsonl                  |
| LC-09 | link-collector-skill-dev | setup-collector 通过 child_process.execFileSync 调用 openclaw cron add/rm，已验证幂等性                       |
| LC-10 | link-collector-skill-dev | 状态流转：pending → processing → done；失败且 retries<3 可重试入 inbox；knowledge_search 发现已入库则 skipped |

## 组内逻辑顺序

遵循"需求背景 → 设计决策 → 并发模型 → 插件整合 → 数据分离 → 状态流转"的结构顺序。
