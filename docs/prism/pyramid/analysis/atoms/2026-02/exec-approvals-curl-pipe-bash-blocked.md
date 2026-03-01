# 日记：curl | bash 类命令被安全机制直接拒绝且无审批弹窗

> 来源：[../../../../journal/2026-02-26/exec-approvals-curl-pipe-bash-blocked.md](../../../../journal/2026-02-26/exec-approvals-curl-pipe-bash-blocked.md)
> 缩写：EX

## Atoms

| 编号  | 类型 | 内容                                                                                                                            | 原文定位                                                                                         |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| EX-01 | 事实 | OpenClaw 的 exec 安全机制在 allowlist 模式下，将含管道符的命令解析为多个段，每段必须独立满足 allowlist、safeBins 或 skills 条件 | 根因分析 > 1. 为何不自动执行                                                                     |
| EX-02 | 事实 | 默认 safeBins 仅包含 jq、cut、uniq、head、tail、tr、wc，不包含 curl 和 bash                                                     | 根因分析 > 1. 为何不自动执行                                                                     |
| EX-03 | 事实 | bash 从 stdin 执行任意脚本的特性导致其永远不会被归类为 safeBin                                                                  | 根因分析 > 1. 为何不自动执行                                                                     |
| EX-04 | 事实 | 含 `                                                                                                                            | `、`&&`、`;` 等 shell 语法的命令在 allowlist 模式下被视为 allowlist miss，需显式审批或加入白名单 | 根因分析 > 1. 为何不自动执行 |
| EX-05 | 事实 | `ask=on-miss` 配置会在 allowlist 未命中时弹出审批，而 `ask=off` 则直接拒绝且不弹窗                                              | 根因分析 > 2. 为何直接拒绝                                                                       |
| EX-06 | 判断 | 当 exec-approvals.json 中 agents 配置为空且无显式 agent 配置时，系统可能回退到 security=deny 或 ask=off，导致直接拒绝           | 根因分析 > 2. 为何直接拒绝                                                                       |
| EX-07 | 步骤 | 在 exec-approvals.json 的 agents 中为 main 添加配置，设置 security 为 allowlist，ask 为 on-miss，askFallback 为 deny            | 解决方案 > 修改配置文件                                                                          |
| EX-08 | 事实 | exec-approvals 配置在每次处理 exec 请求时从磁盘重新读取，修改后无需重启 gateway                                                 | 解决方案 > 生效方式                                                                              |
| EX-09 | 步骤 | 首次执行被拒命令时，在审批弹窗中选择"Always allow"可自动将该命令加入 allowlist                                                  | 解决方案 > 放行三种方式                                                                          |
| EX-10 | 步骤 | 手动在 agents.main.allowlist 数组中追加 curl 和 bash 的路径模式对象可永久放行这两个命令                                         | 解决方案 > 放行三种方式                                                                          |
| EX-11 | 经验 | tools.exec.host 默认值为 sandbox，此时 exec 在 Docker 沙箱内运行且不读取 exec-approvals.json                                    | 补充 > 3.1 为何未生效                                                                            |
| EX-12 | 事实 | processGatewayAllowlist 逻辑仅在 host 设置为 gateway 或 node 时才会被调用                                                       | 补充 > 3.1 为何未生效                                                                            |
| EX-13 | 步骤 | 在 openclaw.json 中显式设置 tools.exec.host 为 gateway，以确保 exec 请求走网关审批流程                                          | 补充 > 3.2 添加 tools.exec                                                                       |
| EX-14 | 经验 | 修改 exec 相关配置后需开启新 session 才能生效，因为旧 session 状态中可能持久化了 execAsk 或 execHost 的覆盖值                   | 补充 > 3.3 开启新 session                                                                        |
| EX-15 | 经验 | exec-approvals.json 中 agents 为空配置不等于宽松策略，实际会回退到 security=deny 导致所有 host exec 被拒绝                      | 经验总结                                                                                         |
| EX-16 | 经验 | curl 管道 bash 属于高风险模式，安全机制故意不自动放行，必须依赖用户明确审批或手动配置白名单                                     | 经验总结                                                                                         |
