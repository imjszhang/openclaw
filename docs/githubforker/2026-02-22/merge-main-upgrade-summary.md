# OpenClaw Main 分支合并升级总结

> 文档日期：2026-02-22
>
> 本次合并将 `origin/main` 合并到 `githubforker` 分支，涵盖约 **3600+ 个提交**，横跨安全加固、功能新增、架构重构、测试优化和性能改进五大方面。以下为核心升级内容。

---

## 1. 安全加固（Security Hardening）

本轮合并中安全相关改动最为密集，覆盖了多个攻击面的防御加固：

### 1.1 路径遍历与符号链接防护

| 场景                | 改动                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| Archive 提取        | 阻止 zip 符号链接逃逸、强制提取资源限制（大小/数量）、拒绝含路径遍历条目的归档包 |
| Avatar 上传         | 阻止头像路径符号链接逃逸，增加大小上限校验                                       |
| Control UI 静态资源 | 加固静态文件路径解析，缺失资源返回 404 而非 SPA fallback                         |
| Sandbox 临时媒体    | 仅允许绝对 tmp 路径，校验符号链接逃逸                                            |

### 1.2 身份认证与授权

| 场景         | 改动                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| Gateway 认证 | 未认证路由发现请求 fail closed；Control UI 即使设置 `allowInsecureAuth` 仍强制安全上下文检查 |
| Hook 认证    | 规范化 rate-limit client IP key（IPv4/IPv4-mapped IPv6 统一），防止双地址格式绕过限速        |
| OAuth        | 验证 OAuth state 参数防止 CSRF 攻击                                                          |
| Pairing      | 强制严格 allowlist 校验，修复 `operator.admin` 权限满足 `operator.write` 的逻辑              |
| Tailscale    | 限制 tokenless forwarded-header 认证仅用于 Control UI websocket，HTTP 路由仍需 token         |
| BlueBubbles  | webhook 请求强制 token 认证，移除免密 fallback                                               |
| iOS          | 非 loopback 手动网关强制 `https://`                                                          |

### 1.3 Shell/Exec 安全

- **shell env fallback**：校验 login-shell 路径合法性（`/etc/shells` + 可信前缀），阻止不可信 shell 路径注入
- **macOS allowlist**：强制 path-only 匹配（移除 basename 匹配），shell-chain 逐段评估，对 shell/process substitution 解析异常 fail closed
- **Exec 审批**：`allow-always` 操作时持久化的是内部可执行文件路径而非 wrapper shell，防止意外的宽泛 shell 白名单
- **Heredoc 安全**：阻止未引用 heredoc body 中的展开 token，拒绝未终止 heredoc

### 1.4 其他安全审计

- 新增 `openclaw security audit` 检测：开放 group 策略暴露 runtime/fs 工具、危险 `gateway.nodes.allowCommands` 配置
- **SSRF**：扩展 IPv4 fetch guard 至全部 RFC 特殊用途/非全局地址段
- **Config 安全**：阻止 `__proto__`/`constructor`/`prototype` 原型污染
- **SHA 迁移**：合成 ID 从 SHA1 迁移到 SHA256
- **ACP**：转义资源链接元数据中的控制字符防止 prompt 注入
- **TTS**：model-driven provider 切换默认 opt-in，降低 prompt 注入驱动的 provider 跳转风险

---

## 2. 新功能（Features）

### 2.1 模型与 Provider

| 功能                 | 说明                                                         |
| -------------------- | ------------------------------------------------------------ |
| Gemini 3.1           | 新增 Google Gemini 3.1 支持                                  |
| Anthropic Sonnet 4.6 | 新增 Anthropic sonnet 4.6 模型支持                           |
| Anthropic 1M Context | 支持 Anthropic 1M 上下文 beta header                         |
| Volcengine/Byteplus  | 集成火山引擎（Volcengine）与 Byteplus 大模型 Provider        |
| API Key 轮换         | 通用 provider API key rotation 支持                          |
| 模型 Fallback 可见性 | 模型 fallback 生命周期在 status、verbose log 和 WebUI 中可见 |

### 2.2 渠道（Channels）

| 功能                  | 说明                                    |
| --------------------- | --------------------------------------- |
| Synology Chat         | 新增群晖 Synology Chat 原生渠道支持     |
| Discord 线程子代理    | Discord 中支持 thread-bound subagents   |
| Discord slash 命令    | 可配置 ephemeral 选项                   |
| Discord forum 标签    | 支持通过 `channel-edit` 编辑 forum 标签 |
| Telegram forum 主题   | 支持创建 forum topic                    |
| Telegram 反应         | 接收并展示用户消息 reactions            |
| Telegram channel_post | 支持 bot-to-bot 通信                    |

### 2.3 Agent 与工具

| 功能                 | 说明                                                                              |
| -------------------- | --------------------------------------------------------------------------------- |
| Tool Loop Detection  | 可配置的工具调用循环检测机制                                                      |
| /export-session 命令 | 导出会话数据                                                                      |
| 压缩后审计           | post-compaction read audit (Layer 3)                                              |
| 工作区规则注入       | 将 workspace critical rules 附加到压缩摘要                                        |
| Skills 路由增强      | 新增 "Use when / Don't use when" 路由块；技能路径使用 `~` 压缩以减少 prompt token |

### 2.4 Memory / 搜索

| 功能             | 说明                                               |
| ---------------- | -------------------------------------------------- |
| 韩语搜索         | 韩语停用词过滤和粒子感知关键词提取（支持韩英混合） |
| MMR Re-ranking   | 搜索结果多样性的 MMR 重排序                        |
| Temporal Decay   | 混合搜索中的时间衰减因子（opt-in）                 |
| QMD via mcporter | QMD 搜索可通过 mcporter keep-alive 路由减少冷启动  |

### 2.5 平台

| 功能                | 说明                                                  |
| ------------------- | ----------------------------------------------------- |
| iOS Share Extension | 支持从其他 app 分享内容到 OpenClaw                    |
| iOS 自动签名        | 自动选择本地签名团队                                  |
| iOS Watch 支持      | watchOS app、审批/拒绝操作、快速回复                  |
| macOS 更新提示      | Control Dashboard 增加更新警告横幅                    |
| Sandbox Common      | 新增 `Dockerfile.sandbox-common` 用于共享沙箱基础镜像 |

### 2.6 其他功能

- Codex CLI auth provider（扩展）
- 飞书 Bitable 创建应用和字段工具
- Cron 默认 stagger 控制
- Timeline 双手柄范围选择
- 缓存 token 计数在 `/status` 中展示
- Anthropic onboarding 默认切换为 sonnet

---

## 3. 架构重构（Refactoring）

本轮重构力度极大，涉及 **100+ 个 refactor 提交**，核心方向：

### 3.1 代码去重与模块化

- **Agent 工具**：提取共享 tool-policy base helpers、volc model catalog helpers
- **CLI**：抽取 fish completion builder、allowlist 命令布线、skills 命令报表加载、npm install 元数据 helper 等大量共享逻辑
- **Channel**：去重消息路由和 Telegram helpers、Discord voice 命令检查
- **Config**：去重遗留 stream-mode 迁移路径、嵌套 redaction 断言、traversal include 断言
- **Gateway**：去重 runtime/config 测试、canvas ws connect 断言、openai context 断言
- **Security**：集中化 path guard helpers、统一 hook rate-limit 和模块加载
- **Logging**：非 agent 内部 console 调用迁移到子系统 logger

### 3.2 类型提取

冲突文件反映的核心变化——main 分支将内联的类型定义和 schema 提取到独立模块：

- `ExecToolDefaults`/`ExecToolDetails` → `bash-tools.exec-types.ts`
- `AgentToolExecSchema`/`ToolExecSchema` → 独立变量，新增 `ToolFsSchema`/`ToolLoopDetectionSchema`
- `pi-tools.ts` 中的配置解析支持 agent 级覆盖（`agentExec ?? globalExec` 模式），新增 `fs` 和 `loopDetection` 配置分支

### 3.3 其他架构改进

- Channel preview streaming 配置统一处理（共享 resolver + canonical migration）
- 分离 minimax-cn provider
- 统一 exec shell parser 与 gateway websocket test helpers
- 提取 sandbox-path 测试和 tmp media resolver helper

---

## 4. 测试优化（Testing）

测试改动量在本次合并中占比最高（**2000+ 测试相关提交**），主要方向：

### 4.1 Lightweight Clears

大规模引入 "lightweight clears" 模式替换传统的重量级 mock reset，覆盖：
gateway、agents、telegram、discord、browser、plugins、auto-reply、core、infra、daemon 等几乎所有模块。

### 4.2 测试去重

- 集中化共享 mock setup（sessions tool gateway mock、subagent command test reset、native command session-meta mock 等）
- 共享 temp workspace/dir helpers 减少 e2e 测试中的重复文件系统操作
- 共享 fixture helpers（compact skill path、identity avatar、file repair 等）

### 4.3 性能优化

- 批量 fake-timer advance 代替逐次推进
- 收紧 timer windows 减少等待时间
- `expect.poll` 替代固定延时
- 并行化 unit-isolated 测试
- Vitest worker split 调优

---

## 5. 性能改进（Performance）

| 场景                | 改动                                        |
| ------------------- | ------------------------------------------- |
| Gateway 启动        | 最小化 vitest 中的 gateway 启动开销         |
| Session 列表        | 缓存 session list transcript 字段           |
| Memory 嵌入         | 缩小嵌入 batch fixtures 体积                |
| Plugin SDK          | 避免 plugin-sdk barrel imports 降低加载时间 |
| Browser/Config 测试 | 加速 browser 和 config 测试套件             |

---

## 6. 冲突解决说明

本次合并共有 **5 个文件**产生冲突，均以 main 分支版本为准解决：

| 文件                          | 冲突原因                                                                         | 解决方式  |
| ----------------------------- | -------------------------------------------------------------------------------- | --------- |
| `bash-tools.exec-runtime.ts`  | githubforker 添加了 shell/shellArgs spawn 逻辑；main 重构为更简洁的架构          | 采用 main |
| `bash-tools.exec.ts`          | githubforker 内联类型定义；main 提取到独立模块 + `assertSandboxPath`             | 采用 main |
| `pi-tools.ts`                 | githubforker 仅用 globalExec 访问；main 支持 agent 级配置覆盖 + fs/loopDetection | 采用 main |
| `shell-utils.e2e.test.ts`     | githubforker 有详细 Windows/Unix 集成测试；main 精简版本                         | 采用 main |
| `zod-schema.agent-runtime.ts` | githubforker 内联 exec schema；main 提取为独立变量 + fs/loopDetection            | 采用 main |

> **注意**：githubforker 分支之前添加的 `shell`/`shellArgs` 自定义 shell 配置功能在此次合并中被 main 的版本覆盖。如需在后续版本中恢复该功能，需要基于 main 当前的架构重新实现。

---

## 7. Breaking Changes

- **Channel Preview Streaming 配置统一**：`channels.<channel>.streaming` 使用枚举值 `off | partial | block | progress`，Slack 原生流式切换移至 `channels.slack.nativeStreaming`。旧配置键（`streamMode`、Slack boolean `streaming`）仍可通过 `openclaw doctor --fix` 迁移。
- **移除 moltbot 遗留状态/配置支持**。

---

## 8. 依赖与基础设施

- Docker 基础镜像固定到 SHA256 摘要防止可变 tag 漂移
- Docker 构建步骤以 node 用户运行 + `COPY --chown` 减小镜像体积
- Pi SDK 内嵌包升级至 `0.54.0`
- E2E/install-sh 测试镜像以非 root 用户运行
- Playwright Chromium 安装到 `/home/node/.cache/ms-playwright` 并设置正确所有权
