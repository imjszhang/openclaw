# link-collector 技能开发记录

> 来源：[../../../../journal/2026-03-06/link-collector-skill-dev.md](../../../../journal/2026-03-06/link-collector-skill-dev.md)
> 缩写：LC

## Atoms

| 编号  | 类型 | 内容                                                                                                          | 原文定位           |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------- | ------------------ |
| LC-01 | 事实 | link-collector 技能实现：链接收集入队、cron 定时调用 knowledge_collect 入库、容错重试、并发安全               | 背景与需求         |
| LC-02 | 判断 | 数据格式选 JSONL：追加写入不需读全文件、单行损坏不影响其他记录                                                | 设计决策           |
| LC-03 | 事实 | 并发模型采用 inbox/batch 轮转：收集侧只写 inbox，处理侧 rename 为 batch 后操作，文件层面完全隔离              | 设计决策           |
| LC-04 | 步骤 | Cron 每 30 分钟配合 maxConcurrentRuns:1，上一轮未完成时自动跳过                                               | 设计决策           |
| LC-05 | 判断 | 选择 CLI 子命令（openclaw knowledge setup-collector）而非自动注册 cron，理由：token 消耗由用户显式决定        | 阶段二：整合到插件 |
| LC-06 | 事实 | 插件通过 openclaw.plugin.json 的 "skills": ["./skills"] 声明技能目录，启用后自动发现加载                      | 阶段二：整合到插件 |
| LC-07 | 事实 | 技能文件（SKILL.md、references）随插件走只读共享；运行时数据（inbox、batch、archive）留 workspace 独立        | 阶段二：整合到插件 |
| LC-08 | 步骤 | 数据路径从技能相对 data/inbox.jsonl 改为 workspace 相对 .openclaw/link-collector/inbox.jsonl                  | 阶段二：整合到插件 |
| LC-09 | 步骤 | setup-collector 通过 child_process.execFileSync 调用 openclaw cron add/rm，已验证幂等性                       | 阶段二：整合到插件 |
| LC-10 | 事实 | 状态流转：pending → processing → done；失败且 retries<3 可重试入 inbox；knowledge_search 发现已入库则 skipped | 状态流转           |
