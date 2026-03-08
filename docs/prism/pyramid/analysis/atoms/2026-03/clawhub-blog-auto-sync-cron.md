# ClawHub 博客自动同步 Cron 集成

> 来源：[../../../../journal/2026-03-08/clawhub-blog-auto-sync-cron.md](../../../../journal/2026-03-08/clawhub-blog-auto-sync-cron.md)
> 缩写：CB

## Atoms

| 编号  | 类型 | 内容                                                                                                  | 原文定位                           |
| ----- | ---- | ----------------------------------------------------------------------------------------------------- | ---------------------------------- |
| CB-01 | 事实 | ClawHub 博客管线包含去重、转换、AI 翻译、构建和推送，但原需手动执行 CLI 命令触发                      | 1. 问题背景                        |
| CB-02 | 经验 | OpenClaw 的 cron 是平台级调度，通过创建 isolated 隔离会话并将 message 发给 Agent 来触发工具           | 2. 参考模型                        |
| CB-03 | 事实 | ClawHub 使用静态 sources.json 配置源，不同于 knowledge-prism 的动态 registry.json 注册机制            | 3. 设计方案                        |
| CB-04 | 步骤 | 数据流为：Cron 触发 → Agent 会话 → 匹配 SKILL.md → 调用 clawhub_blog_auto_sync 工具 → 执行全流程      | 3. 设计方案                        |
| CB-05 | 事实 | clawhub_blog_auto_sync 工具支持 dryRun, skipTranslate, skipBuild, skipPush 四个布尔参数控制执行环节   | 5. clawhub_blog_auto_sync 工具设计 |
| CB-06 | 经验 | 空跑优化策略：仅当 totalImported > 0 时才执行翻译、构建和提交，避免不必要的 LLM 调用和空 commit       | 5. clawhub_blog_auto_sync 工具设计 |
| CB-07 | 步骤 | setup-cron 命令逻辑：先检查任务是否存在，若存在且无 --remove 则提示，若不存在则调用 openclaw cron add | 6. setup-cron CLI 命令             |
| CB-08 | 事实 | import-manifest.json 记录已导入文件 SHA256 哈希，用于判断文件是否全新、未变或已变                     | 7. 增量更新机制                    |
| CB-09 | 事实 | 翻译去重逻辑：检查 index.json 中是否有 en-US 标题且文件系统存在对应 .en-US.md 文件                    | 7. 增量更新机制                    |
| CB-10 | 判断 | 每 2 小时空跑一次的开销可忽略，因为导入仅比对哈希，翻译仅扫描 index，无新内容时构建和提交直接跳过     | 7. 增量更新机制                    |
| CB-11 | 步骤 | SKILL.md 需新增 cron 触发条件行、工具说明行及定时同步流程段落以支持自动调度                           | 8. SKILL.md 更新                   |
| CB-12 | 经验 | 修复 applyEnv() bug：需同时设置 LLM*API*_ 和 CLAWHUB*API*_ 两组环境变量以兼容不同模块读取逻辑         | 9. 环境变量桥接修复                |
| CB-13 | 步骤 | 一键配置命令为 `openclaw hub setup-cron`，默认间隔 120 分钟，可通过 --every 和 --tz 自定义            | 10. 使用方式                       |
| CB-14 | 判断 | 默认间隔设为 120 分钟而非 60 分钟，因为博客更新频率低且需减少空跑次数，用户可按需调整                 | 11. 关键技术决策                   |
| CB-15 | 判断 | 不需要动态注册表机制，因为博客源配置在 sources.json 中且改动频率极低                                  | 11. 关键技术决策                   |
| CB-16 | 判断 | Pulse pull 不纳入同一 cron，因为它是独立数据管线，混合会增加耦合度和失败半径                          | 11. 关键技术决策                   |
