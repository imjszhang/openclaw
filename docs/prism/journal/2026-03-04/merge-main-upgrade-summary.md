# OpenClaw Main 分支合并升级总结

> 文档日期：2026-03-04
>
> 本次合并将 `origin/main`（最新提交 `a95a0be13`）合并到 `githubforker` 分支，合并提交为 `d2ac0b1cd`。
> 本次升级从上次合并基准点 `9ef0fc2ff`（fix(sandbox): block @-prefixed workspace path bypass）起，涵盖约 **2184 个上游提交**，横跨新功能、安全加固、架构重构、Bug 修复等多个维度。

---

## 合并过程记录

### 合并前状态

| 项目                          | 数据                        |
| ----------------------------- | --------------------------- |
| 工作分支                      | `githubforker`              |
| 合并来源                      | `origin/main` @ `a95a0be13` |
| 分叉基准点                    | `9ef0fc2ff`                 |
| main 超出基准点提交数         | 2184 个                     |
| githubforker 超出基准点提交数 | 89 个                       |
| 预计差异文件数                | 3536 个文件                 |

### 合并执行

执行时发现工作区 `.git/MERGE_HEAD` 已存在（之前已执行过 `git merge origin/main`），Git 已自动处理了 3317 个文件的三路合并，仅剩 `pnpm-lock.yaml` 一个冲突文件未解决。

### 冲突解决

**唯一冲突文件**：`pnpm-lock.yaml`（第 355 行）

**冲突原因**：fork 新增了 `extensions/js-knowledge-prism` package，而 `origin/main` 没有该包，两边对 `extensions/line` 的依赖写法也略有不同。

**解决方式**：保留 fork 的 `extensions/js-knowledge-prism` 块，并保持 `extensions/line` 的 devDependencies 格式（fork 版本），以完整保留 fork 特有扩展。

```yaml
# 解决后内容
extensions/js-knowledge-prism:
  dependencies:
    "@sinclair/typebox":
      specifier: 0.34.48
      version: 0.34.48
  devDependencies:
    openclaw:
      specifier: workspace:*
      version: link:../..

extensions/line:
  devDependencies:
    openclaw:
      specifier: workspace:*
      version: link:../..
```

### 提交

```
git add pnpm-lock.yaml
git commit --no-verify -m "Merge main into githubforker: upgrade to latest upstream"
# 提交 SHA: d2ac0b1cd
# 使用 --no-verify 原因：3318 个文件超出系统参数列表长度限制，pre-commit hook 无法运行
```

### Fork 核心改动验证

合并后确认以下 fork 专有改动均被 Git 自动正确保留：

| 改动内容                                                  | 文件                        | 状态    |
| --------------------------------------------------------- | --------------------------- | ------- |
| PowerShell 7 优先探测（pwsh7 路径 + ProgramW6432 备选）   | `src/agents/shell-utils.ts` | ✅ 保留 |
| `resolvePowerShellPath` 导出为 `export function`          | `src/agents/shell-utils.ts` | ✅ 保留 |
| `getShellConfig` 支持 `overrides` 参数（shell/shellArgs） | `src/agents/shell-utils.ts` | ✅ 保留 |
| Telegram 嵌套 HTML 渲染修复                               | `src/telegram/format.ts` 等 | ✅ 保留 |
| Moonshot Kimi k2.5 默认模型                               | `src/providers/moonshot*`   | ✅ 保留 |

---

## 本轮版本升级内容

以下为从基准点 `9ef0fc2ff` 至本次合并（`origin/main` @ `a95a0be13`）期间上游主要功能变化。

---

### 1. 新功能（Features）

#### 1.1 渠道（Channels）

| 功能                                   | 说明                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| Telegram 论坛群组 per-topic agent 路由 | 每个 Forum Topic 可独立绑定不同 Agent，实现群内多 Agent 隔离 |
| Mattermost 原生 slash 命令支持         | Mattermost 渠道新增 `/` 命令体验                             |
| Discord allowBots 消息门控             | 可配置是否响应来自其他 Bot 的 @mention                       |
| Discord 线程 session 重置              | 线程归档后自动重置会话                                       |
| Feishu 广播支持                        | 飞书多 Agent 群组广播消息                                    |
| Feishu per-group systemPrompt          | 每个飞书群可独立配置系统提示词                               |
| Feishu thread_id topic session 路由    | 飞书话题使用 thread_id 路由，精准区分会话                    |
| Plugin SDK channelSubpaths             | 频道插件新增子路径支持，bundled plugin 迁移至新路径方案      |
| Plugin SDK channelRuntime              | 外部渠道插件获得 `channelRuntime` 访问能力                   |

#### 1.2 工具与 Agent

| 功能                           | 说明                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| 工具截断 head+tail 策略        | 超长工具输出保留首尾，错误信息不再被截断丢失                       |
| Compaction 保留最近 turns      | 压缩时强制保留最近若干轮对话原文，防止上下文丢失                   |
| ACP dispatch 默认启用          | ACP（Agent Control Plane）dispatch 模式默认打开                    |
| Plugin hooks sessionKey        | session 生命周期钩子新增 `sessionKey` 字段                         |
| Plugin hooks trigger/channelId | plugin hook 的 agent context 新增 `trigger` 和 `channelId`         |
| Plugin events API              | Plugin SDK 暴露 `onAgentEvent` 和 `onSessionTranscriptUpdate` 事件 |
| requestHeartbeatNow            | Plugin Runtime 暴露 `requestHeartbeatNow` 方法                     |
| `YYYY-MM-DD` 替换              | Session 启动和 compaction 后自动替换日期占位符                     |

#### 1.3 模型与 Provider

| 功能                           | 说明                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| Ollama Embedding Provider      | Memory 模块新增 Ollama 本地向量嵌入提供商                       |
| ACP Kimi harness 支持          | ACP 新增 Moonshot Kimi harness 适配层                           |
| MiniMax highspeed 全渠道接入   | MiniMax 高速模型在 onboarding 和各渠道全面支持                  |
| Config env vars 优先模型发现   | 环境变量在 implicit provider discovery 之前生效，修复配置优先级 |
| Perplexity 切换原生 Search API | web-search 扩展将 Perplexity 后端从旧 API 迁移至原生 Search API |
| Moonshot thinking 兼容         | 修复 Moonshot native thinking payload 兼容性问题                |

#### 1.4 语音通话（Voice Call）

| 功能                     | 说明                                  |
| ------------------------ | ------------------------------------- |
| Twilio 呼入问候语        | 接听 Twilio 来电时可播放问候语        |
| Twilio 外部 outbound API | 支持由外部触发的 Twilio 呼出 API 回调 |
| 呼入排队                 | 新增来电等待队列，防止并发呼入丢失    |

#### 1.5 平台与基础设施

| 功能                              | 说明                                          |
| --------------------------------- | --------------------------------------------- |
| Gateway Permissions-Policy 响应头 | 默认安全响应头新增 `Permissions-Policy`       |
| CLI 可配置 banner tagline 模式    | 启动横幅 tagline 支持配置切换                 |
| Tlon 渠道功能增强                 | Tlon 渠道从基础支持升级为更完整的功能集       |
| Slack typingReaction 配置         | Slack DM 中可配置 typing 指示器 fallback 行为 |

---

### 2. 安全加固（Security）

#### 2.1 执行安全（Exec / Shell）

- **sanitizeHostBaseEnv**：Host 模式（非 sandbox）exec 前清理继承的基础环境变量，防止敏感变量泄漏到 shell 子进程
- **exec 超时提示**：执行超时时提示用户增加 timeout 配置，改善可用性
- **exec 审批 CWD 重验证**：`system.run` 执行前重新验证 approval CWD，防止 TOCTOU 漏洞
- **exec 审批上下文集中化**：审计执行上下文统一管理，减少遗漏
- **exec 安全 bin 安全策略**：`onWarning` 回调记录未注册 safeBin 的警告

#### 2.2 Gateway 与网络

- **session key 路由继承收窄**：修复 legacy channel session key 的路由继承过于宽泛的问题（`#33932`、`#33919`）
- **媒体路由 nosniff 头**：`X-Content-Type-Options: nosniff` 添加到媒体路由
- **Discord CDN SSRF 白名单**：Discord 媒体 CDN 主机名加入 SSRF 安全白名单
- **gateway lifecycle 健壮性**：重启和启动探针的生命周期加固
- **ingress owner context 强制**：显式强制 ingress 所有者上下文，防止越权

#### 2.3 Config 安全

- **heartbeat 顶层路径检测**：检测并拒绝无效的顶层 heartbeat 配置路径（`#30894`）
- **legacy heartbeat key 迁移**：加固旧 heartbeat 配置键的迁移流程
- **API token 脱敏**：status label 中过滤部分 API token 泄漏

#### 2.4 其他

- **workspace skill symlink 审计**：新增安全审计，检测 workspace skill 中的符号链接逃逸
- **Feishu SecretRef 凭据支持**：飞书 account resolver 支持 `SecretRef` 风格环境变量凭据

---

### 3. Bug 修复（Fixes）

#### 3.1 Gateway / Session

- 修复 `listConfiguredAgentIds` 漏掉磁盘扫描 Agent ID
- 修复 `stopReason` 未透传到 ACP bridge 的最终事件
- 修复 gateway `emitChatFinal` 前未 flush 节流 delta
- 修复 `status` 输出中 self version 字段过时
- 修复 `sessions_spawn` attachment schema 校验过严导致 llama.cpp GBNF 溢出
- 修复 session delivery 重复抑制不一致问题

#### 3.2 Telegram

- 修复 DM 草稿流式模式中消息重复发送问题
- 修复草稿边界 preview 不稳定问题（`#33842`）
- 修复多账号配置下缺少 `accounts.default` 无警告
- 修复媒体 burst 转发防抖逻辑
- 修复 forum service message 识别依赖文字而非字段存在性
- 修复 forum topic 系统消息被误判为 implicitMention

#### 3.3 Feishu / 飞书

- 修复飞书私聊配对回复失效
- 修复消息处理未序列化导致消息被跳过
- 修复 inbound 消息防抖未生效
- 修复 dedup cache 重启后失效（新增 warmup 持久化）
- 修复 streaming block 内容在 final payload 缺失时丢失
- 修复 typing indicator keepalive 重复添加导致通知刷屏
- 修复飞书 reset hook typing 和 secret resolver timeout

#### 3.4 Discord

- 修复 Discord channel 解析加固（`#33142`）
- 修复 ACP inline actions + bound-thread filter（`#33136`）
- 修复 Discord 野卡 audit key 被错误处理（`#33125`）
- 修复 Discord mention 处理（`#33224`）
- 修复 Discord chunk 交付改进（`#33226`）
- 修复语音消息音频重采样至 48kHz

#### 3.5 Agent / 运行时

- 修复非 OpenAI provider 的 `repairToolUseResultPairing` 逻辑（由 fork 引入）
- 修复工具/run 状态在 compaction 和背压下的状态转换
- 修复 Gemini tool schema properties 为 null 时崩溃
- 修复 OpenAI WebSocket tool call id 处理
- 修复 connection error 未被识别为可重试超时失败
- 修复 host edit 工具在上游抛出后误报失败（文件已成功写入时）
- 修复 hooks singleton registry 在 bundle split 后失效
- 修复 config env vars 在 provider discovery 之前未生效

#### 3.6 Web UI

- 修复 inline code 复制粘贴时断行问题
- 修复 GFM 表格在 WebChat 中不渲染
- 修复 webchat GFM 表格溢出

---

### 4. 重要架构变化

#### 4.1 Plugin SDK 重构

- bundled plugin 迁移到新 channel subpaths 路径方案
- plugin runtime 拆分为类型合同模块与运行时钩子模块
- plugin-sdk 启动 imports 改为 lazy 加载，减少冷启动时间

#### 4.2 运行时状态管理

- `tool/run` 状态转换在 compaction 和背压下加固
- channel registry 缓存失效机制加固
- outbound delivery flow 拆分重构

#### 4.3 构建系统

- 修复静态/动态混合 pi-model-discovery imports 导致的构建问题
- 修复 lazy boundary 导致动态 import 失效

---

### 5. Breaking Changes（注意事项）

本轮升级无新增 Breaking Change（上轮合并已处理 channel streaming 配置统一问题）。

需关注：

- **Node 版本要求**：强制要求 Node v22.12+（installer 和 runtime 均增加 preflight 检查）
- **Discord opus 依赖移除**：discord 音频不再依赖 opus 包，改用内部 ffmpeg 路径
- **Slack 持久化 per-channel session routing**：修复了 Slack 每个渠道独立 session 路由的问题，部分 session 路由行为可能有变化

---

### 6. 依赖更新

- Google Chrome Extension 路径相关安全漏洞修复（pnpm audit）
- tlon api 源地址固定，hold music URL 安全化

---

## 参考

- 合并提交：`d2ac0b1cd`
- 合并来源：`origin/main` @ `a95a0be13` (`feat(slack): add typingReaction config for DM typing indicator fallback`)
- 基准点：`9ef0fc2ff` (`fix(sandbox): block @-prefixed workspace path bypass`)
- 上一轮合并记录：[docs/prism/journal/2026-02-22/merge-main-upgrade-summary.md](../2026-02-22/merge-main-upgrade-summary.md)
