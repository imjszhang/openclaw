# OpenClaw 安全架构原理整理

> 来源：[../../../../journal/2026-03-17/openclaw-security-architecture-guide.md](../../../../journal/2026-03-17/openclaw-security-architecture-guide.md)
> 缩写：OS

## Atoms

| 编号  | 类型 | 内容                                                                                              | 原文定位                   |
| ----- | ---- | ------------------------------------------------------------------------------------------------- | -------------------------- |
| OS-01 | 事实 | OpenClaw 安全体系基于个人助手信任模型，核心原则是访问控制先于智能                                 | 1. 安全架构全景            |
| OS-02 | 判断 | 该架构不适用于多个对抗性用户共享同一 Agent/Gateway 的多租户场景                                   | 1. 安全架构全景            |
| OS-03 | 事实 | 安全设计遵循三层递进逻辑：身份优先（谁能对话）、范围限定（允许做什么）、模型兜底（限制爆炸半径）  | 1. 安全架构全景            |
| OS-04 | 事实 | MITRE ATLAS 威胁模型涵盖侦察、初始访问、执行、持久化、防御规避、发现、收集外泄及影响八个阶段      | 2. 信任模型与威胁模型      |
| OS-05 | 经验 | 常见误读包括将 sessionKey 视为用户认证边界，或认为任何 JS eval 都是漏洞                           | 2. 信任模型与威胁模型      |
| OS-06 | 事实 | 五层信任边界依次为：通道访问、会话隔离、工具执行、外部内容、供应链                                | 3. 五层信任边界            |
| OS-07 | 步骤 | 通道访问层通过设备配对（30s 宽限期）、AllowList 验证及 Token/Password/Tailscale 认证实现          | 3. 五层信任边界            |
| OS-08 | 事实 | 会话隔离键由 agent:channel:peer 组成，支持按通道和发送者对进行隔离                                | 3. 五层信任边界            |
| OS-09 | 事实 | 工具执行层包含 Docker 沙箱、节点远程执行及 SSRF 防护（DNS 固定 + IP 阻断）                        | 3. 五层信任边界            |
| OS-10 | 步骤 | 外部内容层通过 XML 标签包装和安控通知注入来防御提示注入                                           | 3. 五层信任边界            |
| OS-11 | 事实 | 供应链层包含 ClawHub 技能发布规范、模式化审核标记及 GitHub 账户年龄验证                           | 3. 五层信任边界            |
| OS-12 | 事实 | Gateway 认证默认必需，未配置 token/password 时将拒绝 WebSocket 连接（失败关闭）                   | 4. 认证与授权体系          |
| OS-13 | 步骤 | DM 访问策略默认为 pairing（未知发送者收配对码），可配置为 allowlist、open 或 disabled             | 4. 认证与授权体系          |
| OS-14 | 经验 | 多账户场景推荐使用 per-account-channel-peer 会话隔离模式                                          | 4. 认证与授权体系          |
| OS-15 | 事实 | 模型凭据存储在 ~/.openclaw/agents/<agentId>/agent/auth-profiles.json，支持 SecretRef              | 4. 认证与授权体系          |
| OS-16 | 事实 | 工具权限采用双层系统：层 1 控制工具可见性，层 2 控制 exec 执行权限                                | 5. 工具权限与执行控制      |
| OS-17 | 判断 | exec 安全级别取 minSecurity()（更严格者），审批者数量取 maxAsk()（更多审批者）                    | 5. 工具权限与执行控制      |
| OS-18 | 经验 | 子代理若无 exec-approvals 记录且 defaults 为空，将因 minSecurity("full", "deny")="deny"而无法执行 | 5. 工具权限与执行控制      |
| OS-19 | 事实 | 沙箱模式可选 off、non-main（仅非主会话）或 all（所有会话）                                        | 6. 沙箱隔离                |
| OS-20 | 事实 | 沙箱容器默认无网络，且阻止 network: "host" 和命名空间连接                                         | 6. 沙箱隔离                |
| OS-21 | 判断 | tools.elevated 是显式逃逸通道，始终在主机运行并绕过沙箱                                           | 6. 沙箱隔离                |
| OS-22 | 事实 | 项目维护基于 TLA+/TLC 的形式化安全模型，用于机器检查安全回归                                      | 7. 形式化验证              |
| OS-23 | 事实 | 已验证属性包括 Gateway 暴露风险、nodes.run 管道审批、配对存储 TTL 及路由会话隔离                  | 7. 形式化验证              |
| OS-24 | 步骤 | 状态目录 ~/.openclaw 推荐权限为 700，配置文件 openclaw.json 推荐权限为 600                        | 8. 状态目录权限加固        |
| OS-25 | 步骤 | 使用 openclaw security audit --deep 检查问题，--fix 自动修复权限                                  | 8. 状态目录权限加固        |
| OS-26 | 事实 | 敏感文件包括 openclaw.json、credentials/、auth-profiles.json 及会话转录文件                       | 8. 状态目录权限加固        |
| OS-27 | 步骤 | 60 秒加固基线配置包括 bind: "loopback"、dmScope: "per-channel-peer" 及 exec security: "deny"      | 9. 网络暴露与加固          |
| OS-28 | 经验 | 反向代理应覆写而非追加 X-Forwarded-For，且默认忽略 X-Real-IP                                      | 9. 网络暴露与加固          |
| OS-29 | 判断 | mDNS 发现模式设为 full 会暴露文件路径和 SSH 端口，存在侦察风险                                    | 9. 网络暴露与加固          |
| OS-30 | 判断 | 提示注入尚未被完全解决，硬执行依赖工具策略、exec 审批和沙箱而非仅靠系统提示护栏                   | 10. 提示注入防御           |
| OS-31 | 经验 | 即使只有操作者能发消息，Bot 读取的不可信内容（如搜索结果、网页）仍可能携带对抗性指令              | 10. 提示注入防御           |
| OS-32 | 判断 | 生产环境中 allowUnsafeExternalContent 相关标志应保持关闭                                          | 10. 提示注入防御           |
| OS-33 | 事实 | ClawHub 现有控制中路径净化和大小限制有效性高，而模式审核（regex）有效性低                         | 11. 供应链安全             |
| OS-34 | 事实 | 插件在进程内运行被视为可信代码，npm 安装需固定版本                                                | 11. 供应链安全             |
| OS-35 | 步骤 | 事件响应遏制措施包括停止 Gateway、绑定 loopback 及禁用 DM/群组策略                                | 12. 事件响应               |
| OS-36 | 步骤 | 密钥泄露时需轮换 Gateway auth、远程客户端密钥及 Provider/API 凭据                                 | 12. 事件响应               |
| OS-37 | 事实 | Agent-First 架构分为 Agent 接口、业务核心、人类 CLI、开发工具链和扩展技能五层                     | 13. Agent-First 架构与安全 |
| OS-38 | 事实 | Tool 参数使用 JSON Schema 严格定义，服务具备完整生命周期以确资源可靠清理                          | 13. Agent-First 架构与安全 |
| OS-39 | 事实 | Gateway 架构中每台主机恰好一个实例，握手强制且事件不重放                                          | 14. Gateway 网关架构       |
| OS-40 | 步骤 | 新设备连接需提供身份，非本地连接必须签名 challenge nonce 并需显式批准                             | 14. Gateway 网关架构       |
| OS-41 | 事实 | 关键安全源码文件包括 exec-approvals.ts、auth.ts、access-control.ts 及 ssrf.ts                     | 15. 文档索引               |
