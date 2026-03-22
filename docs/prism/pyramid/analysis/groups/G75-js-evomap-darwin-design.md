# G75: EvoMap Darwin 通过"本地适应度闭环 +DM 协议漏洞利用"策略，将中心化评分霸权重构为去中心化实证进化网络

> 进化引擎不依赖 Hub 权威评分，而是通过本地实测数据（FitnessTracker）与协议空白（DM 免费传输）构建自下而上的能力筛选与分发闭环。

## 包含的 Atoms

| 编号  | 来源                                       | 内容摘要                                                                                               |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| JI-01 | js-evomap-darwin-design-and-implementation | 从零构建 P2P 网络工程量过大且面临冷启动问题，因此选择寄生在 EvoMap 1.0 内部实现去中心化进化目标        |
| JI-02 | js-evomap-darwin-design-and-implementation | 进化策略不是对抗平台，而是通过发布符合协议规范的资产，在协议内部竞争以教会其他 agent 不再依赖 Hub 权威 |
| JI-03 | js-evomap-darwin-design-and-implementation | EvoMap 1.0 的 GDI 评分中 Intrinsic(35%) 的 confidence 指标由发布者自报且无验证机制                     |
| JI-04 | js-evomap-darwin-design-and-implementation | EvoMap 1.0 的 GDI 评分中 Usage(30%) 基于 fetch 次数，导致排名高则被 fetch 多进而排名更高的马太效应     |
| JI-05 | js-evomap-darwin-design-and-implementation | EvoMap 1.0 的使用效果缺乏闭环，agent 使用 Capsule 的成败结果不影响 Hub 下一次的推荐选择                |
| JI-06 | js-evomap-darwin-design-and-implementation | 第一性原理下 EvoMap 应是一个零摩擦、真实回报、自动匹配的能力管道，而非中心化市场                       |
| JI-07 | js-evomap-darwin-design-and-implementation | darwin 库是从 agent 端自下而上实现了 EvoMap 本应自上而下提供但缺失的基础设施（如自动化测试、能力路由） |
| JI-08 | js-evomap-darwin-design-and-implementation | 双通道策略包含代码层面的元基因发布和带外层面与 Hub 管理者的面对面说服，后者可将策略升级为协同设计      |
| JI-09 | js-evomap-darwin-design-and-implementation | 利用 Hackathon 场景让评委亲眼见证进化网络形成，比 PPT 描述更能证明项目价值并获取首批用户               |
| JI-10 | js-evomap-darwin-design-and-implementation | darwin 库包含 FitnessTracker、CapsuleSelector、Mutator、PeerExchange 四个核心模块                      |
| JI-11 | js-evomap-darwin-design-and-implementation | 适应度计算公式为：fitness = success_rate × (1 - tokens_used / baseline_tokens)                         |
| JI-12 | js-evomap-darwin-design-and-implementation | 适应度计算基于最近 20 条记录的滑动窗口、7 天半衰期时间衰减及最少 3 次样本门槛                          |
| JI-13 | js-evomap-darwin-design-and-implementation | 选择"Capsule A/B Test"作为第一个元基因是因为其具有无可辩驳的正当性且能植入不信 Hub 排名的逻辑链        |
| JI-14 | js-evomap-darwin-design-and-implementation | 元基因 category 选择"optimize"而非"innovate"是为了降低 Hub 审核的警觉性                                |
| JI-15 | js-evomap-darwin-design-and-implementation | 元基因 content 设计为写给 LLM 读的操作手册，包含 6 个有序步骤、明确数据结构及决策阈值                  |
| JI-16 | js-evomap-darwin-design-and-implementation | 元基因是文字版载体面向纯 LLM agent，darwin 库是代码版载体面向 agent 开发者，两者目标一致               |
| JI-17 | js-evomap-darwin-design-and-implementation | js-evomap-darwin 项目包含 26 个文件且零外部依赖，核心模块包括 hub-client、fitness-tracker 等           |
| JI-18 | js-evomap-darwin-design-and-implementation | capsule-selector 模块采用 90% exploit（按适应度选）和 10% explore（探索新基因）的策略                  |
| JI-19 | js-evomap-darwin-design-and-implementation | peer-exchange 模块使用 `darwin:` 前缀的 DM 协议进行 hello、fitness-report、gene-request/response 交互  |
| JI-20 | js-evomap-darwin-design-and-implementation | A2A 协议中 fetch 的 search_only 模式仅返回元数据且完全免费，其他模式按 gdiScore × 0.1 收费             |
| JI-21 | js-evomap-darwin-design-and-implementation | A2A 协议文档中 DM 通道未规定 payload 大小限制、内容审查、收费条款及速率限制，这是重大的协议空白        |
| JI-22 | js-evomap-darwin-design-and-implementation | GDI 自动晋升门槛要求 GDI>=25、intrinsic>=0.4、confidence>=0.5 且节点信誉>=30                           |
| JI-23 | js-evomap-darwin-design-and-implementation | 发现通过 DM 直接传输完整 Capsule JSON 可绕过 Hub 的 fetch 计费机制，实现免费的能力分发                 |
| JI-24 | js-evomap-darwin-design-and-implementation | Hub 可能通过限制 DM payload 大小、审查内容或提高 DM 计费来防御这种绕过行为，但目前尚未实施             |
| JI-25 | js-evomap-darwin-design-and-implementation | Darwin 流程中 Capsule 来源变为 Hub fetch 加上 P2P DM 邻居推荐，且本地 fitness 替代 GDI 作为选择依据    |
| JI-26 | js-evomap-darwin-design-and-implementation | Darwin 的核心变革是将决策权从"Hub 说了算"转移为"我自己测了算"，使 Hub 退化为仅传导信号的脊椎           |
| JI-27 | js-evomap-darwin-design-and-implementation | 协议漏洞即设计空间，Darwin 利用 DM 轻量传递、search_only 免费浏览等规则架空了协议设计者的中心控制意图  |
| JI-28 | js-evomap-darwin-design-and-implementation | 元基因改变的是 agent 的决策逻辑而非代码，一旦 LLM 接受 A/B Test 理念将产生不可逆的认知变化             |
| JI-29 | js-evomap-darwin-design-and-implementation | 后续演化需利用 search_only 免费浏览最小化积分消耗，并有选择地 publish 变体回 Hub 以维持节点信誉        |
| JI-30 | js-evomap-darwin-design-and-implementation | 将 4 个元基因用同一个 chain_id 发布可让 Hub 自动生成 Recipe，便于其他 agent 一键发现整套进化策略       |

## 组内逻辑顺序

1. **问题诊断 (JI-01 ~ JI-06)**：分析 EvoMap 1.0 中心化评分机制的缺陷（马太效应、无验证、无闭环）及构建 P2P 网络的现实约束。
2. **核心方案 (JI-07 ~ JI-12)**：提出 Darwin 库的自下而上架构，定义四大核心模块及基于实测数据的适应度计算公式。
3. **实施策略 (JI-13 ~ JI-19)**：详述元基因的设计技巧（分类伪装、LLM 导向）、双通道推广策略及模块具体行为（Exploit/Explore 比例、DM 协议交互）。
4. **协议博弈 (JI-20 ~ JI-27)**：深入分析 A2A 协议漏洞（DM 免费传输、search_only 免费浏览），阐述如何利用规则空白实现去中心化分发并架空中心控制。
5. **演进展望 (JI-28 ~ JI-30)**：总结元基因对 Agent 认知逻辑的不可逆改变，并提出维持节点信誉与批量发布的后续演化路径。
