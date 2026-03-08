# G53: ClawHub 博客自动同步需采用"Cron 触发隔离会话 + 哈希去重空跑优化”策略以实现低耦合高可靠

> 博客同步管线应通过平台级 Cron 调度隔离会话，利用哈希比对与条件执行机制，在低频更新场景下实现零人工干预的自动化闭环。

## 包含的 Atoms

| 编号  | 来源                        | 内容摘要                                                                                              |
| ----- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| CB-01 | clawhub-blog-auto-sync-cron | ClawHub 博客管线包含去重、转换、AI 翻译、构建和推送，但原需手动执行 CLI 命令触发                      |
| CB-02 | clawhub-blog-auto-sync-cron | OpenClaw 的 cron 是平台级调度，通过创建 isolated 隔离会话并将 message 发给 Agent 来触发工具           |
| CB-03 | clawhub-blog-auto-sync-cron | ClawHub 使用静态 sources.json 配置源，不同于 knowledge-prism 的动态 registry.json 注册机制            |
| CB-04 | clawhub-blog-auto-sync-cron | 数据流为：Cron 触发 → Agent 会话 → 匹配 SKILL.md → 调用 clawhub_blog_auto_sync 工具 → 执行全流程      |
| CB-05 | clawhub-blog-auto-sync-cron | clawhub_blog_auto_sync 工具支持 dryRun, skipTranslate, skipBuild, skipPush 四个布尔参数控制执行环节   |
| CB-06 | clawhub-blog-auto-sync-cron | 空跑优化策略：仅当 totalImported > 0 时才执行翻译、构建和提交，避免不必要的 LLM 调用和空 commit       |
| CB-07 | clawhub-blog-auto-sync-cron | setup-cron 命令逻辑：先检查任务是否存在，若存在且无 --remove 则提示，若不存在则调用 openclaw cron add |
| CB-08 | clawhub-blog-auto-sync-cron | import-manifest.json 记录已导入文件 SHA256 哈希，用于判断文件是否全新、未变或已变                     |
| CB-09 | clawhub-blog-auto-sync-cron | 翻译去重逻辑：检查 index.json 中是否有 en-US 标题且文件系统存在对应 .en-US.md 文件                    |
| CB-10 | clawhub-blog-auto-sync-cron | 每 2 小时空跑一次的开销可忽略，因为导入仅比对哈希，翻译仅扫描 index，无新内容时构建和提交直接跳过     |
| CB-11 | clawhub-blog-auto-sync-cron | SKILL.md 需新增 cron 触发条件行、工具说明行及定时同步流程段落以支持自动调度                           |
| CB-12 | clawhub-blog-auto-sync-cron | 修复 applyEnv() bug：需同时设置 LLM*API*_ 和 CLAWHUB*API*_ 两组环境变量以兼容不同模块读取逻辑         |
| CB-13 | clawhub-blog-auto-sync-cron | 一键配置命令为 `openclaw hub setup-cron`，默认间隔 120 分钟，可通过 --every 和 --tz 自定义            |
| CB-14 | clawhub-blog-auto-sync-cron | 默认间隔设为 120 分钟而非 60 分钟，因为博客更新频率低且需减少空跑次数，用户可按需调整                 |
| CB-15 | clawhub-blog-auto-sync-cron | 不需要动态注册表机制，因为博客源配置在 sources.json 中且改动频率极低                                  |
| CB-16 | clawhub-blog-auto-sync-cron | Pulse pull 不纳入同一 cron，因为它是独立数据管线，混合会增加耦合度和失败半径                          |

## 组内逻辑顺序

按“架构设计 (CB-01~04) → 执行优化与参数控制 (CB-05~06, CB-08~10) → 配置部署与环境修复 (CB-07, CB-12~14) → 边界与扩展性说明 (CB-11, CB-15~16)"的逻辑排列。
