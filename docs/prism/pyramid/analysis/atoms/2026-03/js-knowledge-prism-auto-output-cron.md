# js-knowledge-prism 全链路自动产出 Cron Job

> 来源：[../../../../journal/2026-03-11/js-knowledge-prism-auto-output-cron.md](../../../../journal/2026-03-11/js-knowledge-prism-auto-output-cron.md)
> 缩写：JO

## Atoms

| 编号  | 类型 | 内容                                                                                                                                                | 原文定位                      |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| JO-01 | 事实 | js-knowledge-prism 知识处理链路分为三段：journal 到 synthesis、synthesis 到 structure、structure 到 output                                          | 背景                          |
| JO-02 | 事实 | 原有链路中，后两段（structure 刷新和 output 生成）仅支持手动或 AI 对话触发，缺乏自动化                                                              | 背景                          |
| JO-03 | 判断 | 采用整合方案（2 个 cron）优于独立方案（3 个 cron），可避免时序同步问题并简化配置                                                                    | 设计决策 > 独立 vs 整合       |
| JO-04 | 经验 | structure 刷新的唯一目的是为 output 生成做准备，强行拆分会引入不必要的时序依赖问题                                                                  | 设计决策 > 独立 vs 整合       |
| JO-05 | 步骤 | 采用 mtime 双层检测策略：Phase 1 检测 synthesis/groups 变化驱动结构刷新，Phase 2 检测 structure 变化驱动产出                                        | 设计决策 > 变化检测策略       |
| JO-06 | 步骤 | 在 registry.json 的 base 条目中新增 outputBindings 数组以管理视角、模板及最后刷新/产出时间                                                          | 实现清单 > Registry 扩展      |
| JO-07 | 事实 | 新增三个 AI 工具：knowledge_prism_bind_output（绑定配置）、knowledge_prism_list_output_bindings（列出状态）、knowledge_prism_output_all（批量执行） | 实现清单 > 新增 AI Tools      |
| JO-08 | 步骤 | 执行 `prism setup-output-cron` CLI 命令可一键配置默认间隔为 120 分钟的 prism-auto-output 定时任务                                                   | 实现清单 > 新增 CLI 命令      |
| JO-09 | 步骤 | knowledge_prism_output_all 升级为两阶段执行：先按 perspective 去重刷新 structure，再检测变化生成 output                                             | 实现清单 > Structure 自动刷新 |
| JO-10 | 经验 | 同一 perspective 被多个 binding 引用时，需使用 Set 去重确保 structure 只刷新一次                                                                    | 实现清单 > 边界处理           |
| JO-11 | 经验 | 当 fill_perspective 或 expand_kl 单步失败时，应记录 error 但不中断后续步骤以保证链路健壮性                                                          | 实现清单 > 边界处理           |
| JO-12 | 判断 | force 参数默认设为 false，以防止覆盖已有的非骨架 output 文件                                                                                        | 实现清单 > 边界处理           |
| JO-13 | 事实 | 全链路自动化最终架构由两个 Cron 组成：prism-auto-process（60 分钟）处理前段，prism-auto-output（120 分钟）处理后两段                                | 架构总览                      |
| JO-14 | 步骤 | 用户只需完成注册知识库、绑定产出配置、配置两个定时任务三个动作，即可实现全流程无人值守运行                                                          | 架构总览                      |
