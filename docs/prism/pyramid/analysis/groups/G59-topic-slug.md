# G59: 知识棱镜全链路自动化需采用"双 Cron 分段驱动 + mtime 双层检测"架构以消除手动干预并保障时序一致性

> 通过将后两段链路合并为单一 Cron 任务并实施 mtime 变化检测，解决了多任务时序同步难题，实现了从 Journal 到 Output 的无人值守闭环。

## 包含的 Atoms

| 编号  | 来源                                | 内容摘要                                                                                                                                            |
| ----- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| JO-01 | js-knowledge-prism-auto-output-cron | 知识处理链路分为三段：journal 到 synthesis、synthesis 到 structure、structure 到 output                                                             |
| JO-02 | js-knowledge-prism-auto-output-cron | 原有链路中，后两段（structure 刷新和 output 生成）仅支持手动或 AI 对话触发，缺乏自动化                                                              |
| JO-03 | js-knowledge-prism-auto-output-cron | 采用整合方案（2 个 cron）优于独立方案（3 个 cron），可避免时序同步问题并简化配置                                                                    |
| JO-04 | js-knowledge-prism-auto-output-cron | structure 刷新的唯一目的是为 output 生成做准备，强行拆分会引入不必要的时序依赖问题                                                                  |
| JO-05 | js-knowledge-prism-auto-output-cron | 采用 mtime 双层检测策略：Phase 1 检测 synthesis/groups 变化驱动结构刷新，Phase 2 检测 structure 变化驱动产出                                        |
| JO-06 | js-knowledge-prism-auto-output-cron | 在 registry.json 的 base 条目中新增 outputBindings 数组以管理视角、模板及最后刷新/产出时间                                                          |
| JO-07 | js-knowledge-prism-auto-output-cron | 新增三个 AI 工具：knowledge_prism_bind_output（绑定配置）、knowledge_prism_list_output_bindings（列出状态）、knowledge_prism_output_all（批量执行） |
| JO-08 | js-knowledge-prism-auto-output-cron | 执行 `prism setup-output-cron` CLI 命令可一键配置默认间隔为 120 分钟的 prism-auto-output 定时任务                                                   |
| JO-09 | js-knowledge-prism-auto-output-cron | knowledge_prism_output_all 升级为两阶段执行：先按 perspective 去重刷新 structure，再检测变化生成 output                                             |
| JO-10 | js-knowledge-prism-auto-output-cron | 同一 perspective 被多个 binding 引用时，需使用 Set 去重确保 structure 只刷新一次                                                                    |
| JO-11 | js-knowledge-prism-auto-output-cron | 当 fill_perspective 或 expand_kl 单步失败时，应记录 error 但不中断后续步骤以保证链路健壮性                                                          |
| JO-12 | js-knowledge-prism-auto-output-cron | force 参数默认设为 false，以防止覆盖已有的非骨架 output 文件                                                                                        |
| JO-13 | js-knowledge-prism-auto-output-cron | 全链路自动化最终架构由两个 Cron 组成：prism-auto-process（60 分钟）处理前段，prism-auto-output（120 分钟）处理后两段                                |
| JO-14 | js-knowledge-prism-auto-output-cron | 用户只需完成注册知识库、绑定产出配置、配置两个定时任务三个动作，即可实现全流程无人值守运行                                                          |

## 组内逻辑顺序

按"问题背景与链路拆解 -> 架构决策与优化策略 -> 核心实现机制 (检测/去重/容错) -> 工具链与配置 -> 最终运行形态"的逻辑顺序排列。
