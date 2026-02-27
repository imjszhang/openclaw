# KL15: 构建以“本地优先网关”为核心的五层抽象架构，作为连接多渠道与多工具的安全路由基石

> 所属视角：P09-agent-evolution
> 上层论点：AI Agent 自我进化必须构建"OADA 闭环 + 预算约束 + 人机协作”的三层防御体系，以确保持续优化而不失控。

## 支撑论点

### 15.1: 确立"Channel-Account-Agent-Workspace-Session"五层抽象模型，实现从消息接入到上下文管理的彻底解耦

- 逻辑顺序：结构
- 引用 atoms: CP-01, CP-02, CP-03, CP-04
- 引用 groups: G28

该架构将平台接入（Channel）、身份实例（Account）、大脑逻辑（Agent）、文件家（Workspace）与会话上下文（Session）严格分层，确保消息流转路径清晰且各层职责单一，为系统的可扩展性奠定基础。

### 15.2: 依托本地优先网关（Local-First Gateway）作为单一控制平面，统一处理多通道协议适配与智能路由分发

- 逻辑顺序：结构
- 引用 atoms: AR-10, AR-11, AR-12, CP-13
- 引用 groups: G15, G28

网关通过 WebSocket 服务承载 13+ 种通信渠道，负责协议验证、请求路由及事件广播，利用 Bindings 匹配机制（peer→guild→account→default）将外部消息精准分发至对应 Agent 实例。

### 15.3: 实施基于 SessionKey 的多维隔离与串行并发控制机制，保障多用户场景下的数据隐私与执行安全

- 逻辑顺序：程度
- 引用 atoms: CP-07, CP-09, CP-11, CP-12, AR-13
- 引用 groups: G28

通过定义细粒度的会话键（如 per-channel-peer）和四层隔离机制（Agent 目录、Session 锁、Channel 监控、Account 凭证），配合全局 CommandLane 与文件锁，防止上下文泄露并确保同一会话内的操作串行执行。

### 15.4: 构建分层技能加载与沙箱化工具执行体系，在赋予 Agent 强大操作能力的同时施加严格的资源与权限约束

- 逻辑顺序：结构
- 引用 atoms: AR-15, AR-20, AR-21, AR-30, CP-17
- 引用 groups: G15

技能加载遵循"Workspace 优先”原则，结合 requires 门控条件动态启用；同时通过沙箱模式（非主模式、允许/拒绝列表）限制 bash、文件读写及浏览器访问，防止 Agent 越权操作。

## 论点间关系

子论点遵循“静态架构定义 → 动态路由核心 → 并发安全机制 → 执行能力约束”的结构逻辑，层层递进地构建了从消息接入到安全执行的完整闭环，确保 Agent 在复杂环境中有序进化。

---
