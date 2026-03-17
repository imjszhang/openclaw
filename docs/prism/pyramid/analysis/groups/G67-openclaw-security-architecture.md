# G67: OpenClaw 安全体系基于“个人助手信任模型”，通过五层边界与形式化验证构建纵深防御

> 该架构专为单用户可信环境设计，通过身份优先、范围限定及模型兜底的三层逻辑，结合形式化模型验证，实现从通道访问到供应链的全链路安全控制。

## 包含的 Atoms

| 编号  | 来源                                 | 内容摘要                                                                                     |
| ----- | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| OS-01 | openclaw-security-architecture-guide | 安全体系基于个人助手信任模型，核心原则是访问控制先于智能                                     |
| OS-02 | openclaw-security-architecture-guide | 该架构不适用于多个对抗性用户共享同一 Agent/Gateway 的多租户场景                              |
| OS-03 | openclaw-security-architecture-guide | 安全设计遵循三层递进逻辑：身份优先、范围限定、模型兜底                                       |
| OS-04 | openclaw-security-architecture-guide | MITRE ATLAS 威胁模型涵盖侦察、初始访问、执行等八个阶段                                       |
| OS-05 | openclaw-security-architecture-guide | 常见误读包括将 sessionKey 视为用户认证边界，或认为任何 JS eval 都是漏洞                      |
| OS-06 | openclaw-security-architecture-guide | 五层信任边界依次为：通道访问、会话隔离、工具执行、外部内容、供应链                           |
| OS-07 | openclaw-security-architecture-guide | 通道访问层通过设备配对、AllowList 验证及 Token/Password/Tailscale 认证实现                   |
| OS-08 | openclaw-security-architecture-guide | 会话隔离键由 agent:channel:peer 组成，支持按通道和发送者对进行隔离                           |
| OS-09 | openclaw-security-architecture-guide | 工具执行层包含 Docker 沙箱、节点远程执行及 SSRF 防护                                         |
| OS-10 | openclaw-security-architecture-guide | 外部内容层通过 XML 标签包装和安控通知注入来防御提示注入                                      |
| OS-11 | openclaw-security-architecture-guide | 供应链层包含 ClawHub 技能发布规范、模式化审核标记及 GitHub 账户年龄验证                      |
| OS-12 | openclaw-security-architecture-guide | Gateway 认证默认必需，未配置 token/password 时将拒绝 WebSocket 连接（失败关闭）              |
| OS-13 | openclaw-security-architecture-guide | DM 访问策略默认为 pairing，可配置为 allowlist、open 或 disabled                              |
| OS-14 | openclaw-security-architecture-guide | 多账户场景推荐使用 per-account-channel-peer 会话隔离模式                                     |
| OS-15 | openclaw-security-architecture-guide | 模型凭据存储在 agent/auth-profiles.json，支持 SecretRef                                      |
| OS-16 | openclaw-security-architecture-guide | 工具权限采用双层系统：层 1 控制工具可见性，层 2 控制 exec 执行权限                           |
| OS-17 | openclaw-security-architecture-guide | exec 安全级别取 minSecurity()，审批者数量取 maxAsk()                                         |
| OS-18 | openclaw-security-architecture-guide | 子代理若无 exec-approvals 记录且 defaults 为空，将无法执行                                   |
| OS-19 | openclaw-security-architecture-guide | 沙箱模式可选 off、non-main 或 all                                                            |
| OS-20 | openclaw-security-architecture-guide | 沙箱容器默认无网络，且阻止 network: "host" 和命名空间连接                                    |
| OS-21 | openclaw-security-architecture-guide | tools.elevated 是显式逃逸通道，始终在主机运行并绕过沙箱                                      |
| OS-22 | openclaw-security-architecture-guide | 项目维护基于 TLA+/TLC 的形式化安全模型，用于机器检查安全回归                                 |
| OS-23 | openclaw-security-architecture-guide | 已验证属性包括 Gateway 暴露风险、nodes.run 管道审批、配对存储 TTL 及路由会话隔离             |
| OS-24 | openclaw-security-architecture-guide | 状态目录推荐权限为 700，配置文件推荐权限为 600                                               |
| OS-25 | openclaw-security-architecture-guide | 使用 openclaw security audit --deep 检查问题，--fix 自动修复权限                             |
| OS-26 | openclaw-security-architecture-guide | 敏感文件包括 openclaw.json、credentials/、auth-profiles.json 及会话转录文件                  |
| OS-27 | openclaw-security-architecture-guide | 60 秒加固基线配置包括 bind: "loopback"、dmScope: "per-channel-peer" 及 exec security: "deny" |
| OS-28 | openclaw-security-architecture-guide | 反向代理应覆写而非追加 X-Forwarded-For，且默认忽略 X-Real-IP                                 |
| OS-29 | openclaw-security-architecture-guide | mDNS 发现模式设为 full 会暴露文件路径和 SSH 端口，存在侦察风险                               |
| OS-30 | openclaw-security-architecture-guide | 提示注入尚未被完全解决，硬执行依赖工具策略、exec 审批和沙箱                                  |
| OS-31 | openclaw-security-architecture-guide | 即使只有操作者能发消息，Bot 读取的不可信内容仍可能携带对抗性指令                             |
| OS-32 | openclaw-security-architecture-guide | 生产环境中 allowUnsafeExternalContent 相关标志应保持关闭                                     |
| OS-33 | openclaw-security-architecture-guide | ClawHub 现有控制中路径净化和大小限制有效性高，而模式审核有效性低                             |
| OS-34 | openclaw-security-architecture-guide | 插件在进程内运行被视为可信代码，npm 安装需固定版本                                           |
| OS-35 | openclaw-security-architecture-guide | 事件响应遏制措施包括停止 Gateway、绑定 loopback 及禁用 DM/群组策略                           |
| OS-36 | openclaw-security-architecture-guide | 密钥泄露时需轮换 Gateway auth、远程客户端密钥及 Provider/API 凭据                            |
| OS-37 | openclaw-security-architecture-guide | Agent-First 架构分为 Agent 接口、业务核心、人类 CLI、开发工具链和扩展技能五层                |
| OS-38 | openclaw-security-architecture-guide | Tool 参数使用 JSON Schema 严格定义，服务具备完整生命周期                                     |
| OS-39 | openclaw-security-architecture-guide | Gateway 架构中每台主机恰好一个实例，握手强制且事件不重放                                     |
| OS-40 | openclaw-security-architecture-guide | 新设备连接需提供身份，非本地连接必须签名 challenge nonce 并需显式批准                        |
| OS-41 | openclaw-security-architecture-guide | 关键安全源码文件包括 exec-approvals.ts、auth.ts、access-control.ts 及 ssrf.ts                |

## 组内逻辑顺序

按“安全模型与原则 (OS-01~05) -> 五层信任边界详解 (OS-06~11) -> 认证与访问控制机制 (OS-12~15) -> 工具执行与沙箱策略 (OS-16~21) -> 形式化验证与审计 (OS-22~26) -> 加固基线与配置规范 (OS-27~34) -> 应急响应与架构细节 (OS-35~41)"的结构顺序排列。
