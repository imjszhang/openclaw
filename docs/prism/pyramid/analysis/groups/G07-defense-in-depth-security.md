# G07: 安全加固遵循纵深防御原则——路径、认证、执行、审计各层独立防护，关键路径 fail-closed

> 安全不依赖单一屏障，而是在每个攻击面（文件路径、身份认证、Shell 执行、运行时审计）各自建立独立防护层，且关键路径默认拒绝而非默认放行。

## 包含的 Atoms

| 编号  | 来源                          | 内容摘要                                                                    |
| ----- | ----------------------------- | --------------------------------------------------------------------------- |
| MU-02 | merge-main-upgrade-summary    | 路径遍历/符号链接防护覆盖 archive、avatar、control UI、sandbox 四个攻击面   |
| MU-03 | merge-main-upgrade-summary    | 身份认证 fail-closed：未认证路由默认拒绝、IP 标准化、OAuth state 防 CSRF    |
| MU-04 | merge-main-upgrade-summary    | Shell/Exec 四层防御：路径校验、path-only 匹配、内部路径持久化、heredoc 阻止 |
| MU-05 | merge-main-upgrade-summary    | security audit 命令、SSRF 全 RFC 地址段、原型污染防护、SHA1→SHA256          |
| MV-09 | merge-main-upgrade-summary-v2 | Config loadConfig 改为 fail-closed，配置错误不再静默回退到宽松默认值        |
| MV-10 | merge-main-upgrade-summary-v2 | system.run 审批链加固：wrapper 边界、EncodedCommand 识别、注释尾部不持久化  |
| MV-11 | merge-main-upgrade-summary-v2 | outbound 投递两阶段 ACK 标记（.json → .delivered → unlink）防崩溃窗口重放   |

## 组内逻辑顺序

结构顺序：从外到内的攻击面分层——文件路径（最外层 I/O 边界）→ 身份认证（请求入口）→ Shell 执行（运行时核心）→ 审计/加密（基础设施底层）→ 配置加载 fail-closed（MV-09）→ 执行审批链纵深加固（MV-10）→ 投递重放防护（MV-11）。每层独立防护，互不依赖。
