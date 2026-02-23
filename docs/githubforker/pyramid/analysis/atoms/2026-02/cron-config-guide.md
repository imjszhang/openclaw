# OpenClaw Cron 任务配置指南

> 来源：[../../../../journal/2026-02-05/cron-config-guide.md](../../../../journal/2026-02-05/cron-config-guide.md)
> 缩写：CR

## Atoms

| 编号  | 类型 | 内容                                                                                                             | 原文定位                   |
| ----- | ---- | ---------------------------------------------------------------------------------------------------------------- | -------------------------- |
| CR-01 | 事实 | OpenClaw Cron 是 Gateway 内置的定时任务调度器，与系统 crontab 独立，可定时执行任务或设置一次性提醒               | 1. 什么是 Cron             |
| CR-02 | 事实 | Cron 任务五要素：sessionTarget(main/isolated)、payload.kind(systemEvent/agentTurn)、wakeMode、schedule、delivery | 2. 核心概念一览            |
| CR-03 | 事实 | sessionTarget="main"在主会话运行共享上下文，必须搭配 payload.kind="systemEvent"                                  | 3.1 main                   |
| CR-04 | 事实 | sessionTarget="isolated"在独立临时会话运行不继承历史，必须搭配 payload.kind="agentTurn"                          | 3.2 isolated               |
| CR-05 | 判断 | 场景推荐：简单提醒用 main，执行 shell 命令/定时报告/后台自动化用 isolated                                        | 3.3 选择哪个               |
| CR-06 | 事实 | systemEvent 向 Agent 发送系统消息，Agent 可能只文本回复，不可靠执行 shell                                        | 4.1 systemEvent            |
| CR-07 | 事实 | agentTurn 让 Agent 执行完整回合可使用工具/执行命令，适合自动化任务和脚本执行                                     | 4.2 agentTurn              |
| CR-08 | 事实 | wakeMode 分 now(立即运行) 和 next-heartbeat(等待下次心跳，默认值，省资源)                                        | 5. Wake Mode               |
| CR-09 | 事实 | schedule 三种类型：at(一次性)、every(固定间隔)、cron(Cron 表达式：分时日月周)                                    | 6. Schedule                |
| CR-10 | 经验 | Cron 表达式强烈建议指定--tz 时区，否则使用 Gateway 主机本地时区                                                  | 6.3 cron                   |
| CR-11 | 事实 | delivery 仅 isolated 任务支持，announce 投递到渠道，none 不投递只存日志                                          | 7. Delivery                |
| CR-12 | 事实 | --to 目标格式因渠道而异：WhatsApp 用手机号、Telegram 用用户 ID、Discord 用 channel:user 前缀                     | 7.3 --to 目标格式          |
| CR-13 | 步骤 | 简单提醒命令：`--at "20m" --session main --system-event "内容" --wake now --delete-after-run`                    | 8.1 简单提醒               |
| CR-14 | 步骤 | 定时脚本命令：`--cron "*/5 * * * *" --session isolated --message "命令" --no-deliver`                            | 8.2 定时执行脚本           |
| CR-15 | 经验 | 任务显示 ok 但没执行是因为 systemEvent+main 只看到消息，需改为 agentTurn+isolated                                | 9.1 任务显示 ok 但没有执行 |
| CR-16 | 经验 | Cron 运行环境 PATH 有限，脚本中需显式设置 PATH 或使用命令完整路径                                                | 9.4 PATH 问题              |
| CR-17 | 步骤 | CLI 速查：cron list/status/runs(查看)、add(创建)、edit(修改)、enable/disable/run/rm(管理)                        | 10. CLI 命令速查           |
| CR-18 | 事实 | 心跳是定时唤醒 AI 的周期性调度系统，默认每 30 分钟触发(OAuth 模式 1 小时)，让 Agent 主动感知                     | 11.1 什么是心跳            |
| CR-19 | 事实 | 心跳流程：定时触发→前置检查(活跃时间/队列空闲/HEARTBEAT.md 非空)→调用 LLM→处理响应                               | 11.2 心跳工作原理          |
| CR-20 | 经验 | 心跳响应 HEARTBEAT_OK 静默丢弃，有重要事项才投递消息，24 小时内相同内容自动去重                                  | 11.4/11.6                  |
| CR-21 | 事实 | HEARTBEAT.md 作为检查清单，应保持简短避免 prompt 膨胀增加成本                                                    | 11.4 HEARTBEAT.md          |
| CR-22 | 事实 | 心跳配置：every(间隔)、target(投递目标 last/none/渠道)、activeHours(活跃时间窗口)、ackMaxChars                   | 11.3 心跳配置示例          |
| CR-23 | 事实 | Cron 与 Heartbeat 核心区别：时间精度(精确 vs 大约)、会话(可隔离 vs 主会话)、成本(单独 vs 批量)                   | 12.1 核心区别              |
| CR-24 | 判断 | 决策流程：需要精确时间/隔离会话/不同模型→用 Cron；可合并检查/周期性感知→用 Heartbeat                             | 12.2 决策流程图            |
| CR-25 | 判断 | 场景推荐：收件箱/日历监控用 Heartbeat，精确日报/周报/执行脚本用 Cron(isolated)                                   | 12.3 推荐场景对照表        |
| CR-26 | 经验 | 最佳实践：Heartbeat 处理日常监控批量执行，Cron 处理精确调度和一次性提醒，两者结合最高效                          | 12.4 最佳实践              |
