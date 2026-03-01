# G39: OpenClaw 的 exec 安全机制通过“分段解析 + 白名单校验 + 动态审批”三重防线，强制阻断高风险的 curl|bash 管道执行模式

> 默认配置下管道符将命令拆解为独立段进行严格校验，因 bash 和 curl 不在 safeBins 且具备高风险特性，必须显式配置 allowlist 或启用 on-miss 审批才能放行。

## 包含的 Atoms

| 编号  | 来源                                  | 内容摘要                                                                                                                        |
| ----- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| EX-01 | exec-approvals-curl-pipe-bash-blocked | OpenClaw 的 exec 安全机制在 allowlist 模式下，将含管道符的命令解析为多个段，每段必须独立满足 allowlist、safeBins 或 skills 条件 |
| EX-02 | exec-approvals-curl-pipe-bash-blocked | 默认 safeBins 仅包含 jq、cut、uniq、head、tail、tr、wc，不包含 curl 和 bash                                                     |
| EX-03 | exec-approvals-curl-pipe-bash-blocked | bash 从 stdin 执行任意脚本的特性导致其永远不会被归类为 safeBin                                                                  |
| EX-04 | exec-approvals-curl-pipe-bash-blocked | 含 `                                                                                                                            |
| EX-05 | exec-approvals-curl-pipe-bash-blocked | `ask=on-miss` 配置会在 allowlist 未命中时弹出审批，而 `ask=off` 则直接拒绝且不弹窗                                              |
| EX-06 | exec-approvals-curl-pipe-bash-blocked | 当 exec-approvals.json 中 agents 配置为空且无显式 agent 配置时，系统可能回退到 security=deny 或 ask=off，导致直接拒绝           |
| EX-07 | exec-approvals-curl-pipe-bash-blocked | 在 exec-approvals.json 的 agents 中为 main 添加配置，设置 security 为 allowlist，ask 为 on-miss，askFallback 为 deny            |
| EX-08 | exec-approvals-curl-pipe-bash-blocked | exec-approvals 配置在每次处理 exec 请求时从磁盘重新读取，修改后无需重启 gateway                                                 |
| EX-09 | exec-approvals-curl-pipe-bash-blocked | 首次执行被拒命令时，在审批弹窗中选择"Always allow"可自动将该命令加入 allowlist                                                  |
| EX-10 | exec-approvals-curl-pipe-bash-blocked | 手动在 agents.main.allowlist 数组中追加 curl 和 bash 的路径模式对象可永久放行这两个命令                                         |
| EX-11 | exec-approvals-curl-pipe-bash-blocked | tools.exec.host 默认值为 sandbox，此时 exec 在 Docker 沙箱内运行且不读取 exec-approvals.json                                    |
| EX-12 | exec-approvals-curl-pipe-bash-blocked | processGatewayAllowlist 逻辑仅在 host 设置为 gateway 或 node 时才会被调用                                                       |
| EX-13 | exec-approvals-curl-pipe-bash-blocked | 在 openclaw.json 中显式设置 tools.exec.host 为 gateway，以确保 exec 请求走网关审批流程                                          |
| EX-14 | exec-approvals-curl-pipe-bash-blocked | 修改 exec 相关配置后需开启新 session 才能生效，因为旧 session 状态中可能持久化了 execAsk 或 execHost 的覆盖值                   |
| EX-15 | exec-approvals-curl-pipe-bash-blocked | exec-approvals.json 中 agents 为空配置不等于宽松策略，实际会回退到 security=deny 导致所有 host exec 被拒绝                      |
| EX-16 | exec-approvals-curl-pipe-bash-blocked | curl 管道 bash 属于高风险模式，安全机制故意不自动放行，必须依赖用户明确审批或手动配置白名单                                     |

## 组内逻辑顺序

遵循“问题现象与原理 (EX-01~04) -> 配置策略与行为 (EX-05~07) -> 运行时机制与持久化 (EX-08~10) -> 环境依赖与陷阱 (EX-11~15) -> 安全设计哲学 (EX-16)"的结构顺序排列。
