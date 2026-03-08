# OpenClaw Main 分支合并升级总结（第三轮）

> 文档日期：2026-03-08
>
> **版本跨度：`2026.3.3` → `2026.3.7`**（跨越 2026.3.7-beta.1、2026.3.7 两个里程碑）
>
> 本次合并将 `origin/main`（最新提交 `389647157`）合并到 `githubforker` 分支，合并提交为 `502f3c2a4`。
> 本次升级从上次合并基准点 `88ee57124e`（Delete changelog/fragments directory）起，涵盖约 **714 个上游提交**，横跨新功能、安全加固、架构重构、Bug 修复等多个维度。

---

## 与上次合并的对比

| 维度            | 第二轮 (2026-03-04)    | 第三轮 (2026-03-08)   | 趋势     |
| --------------- | ---------------------- | --------------------- | -------- |
| 提交数          | ~2184                  | ~714                  | ↓ 67%    |
| 差异文件数      | ~3536                  | ~2200                 | ↓ 38%    |
| 版本跨度        | `2026.2.24 → 2026.3.3` | `2026.3.3 → 2026.3.7` | 更窄     |
| 冲突文件数      | 1（pnpm-lock.yaml）    | **0**                 | ↓ 消除   |
| 合并间隔        | ~10 天                 | ~4 天                 | 更高频   |
| fork 独有提交数 | 89                     | 19                    | 更少增量 |

**验证判断**：上轮 MU-13 判断"无新增 Breaking Change"在本轮不再成立——2026.3.7 引入了 `gateway.auth.mode` 强制要求。高频合并策略的收益已通过零冲突实证验证。

---

## 合并过程记录

### 合并前状态

| 项目                          | 数据                        |
| ----------------------------- | --------------------------- |
| 工作分支                      | `githubforker`              |
| 合并来源                      | `origin/main` @ `389647157` |
| 分叉基准点                    | `88ee57124e`                |
| main 超出基准点提交数         | 714 个                      |
| githubforker 超出基准点提交数 | 19 个                       |
| 预计差异文件数                | ~2200 个文件                |

### 提交类型分布

| 类型     | 数量 | 占比  |
| -------- | ---- | ----- |
| fix      | 296  | 41.5% |
| refactor | 154  | 21.6% |
| test     | 21   | 2.9%  |
| build    | 22   | 3.1%  |
| feat     | 12   | 1.7%  |
| 其他     | 209  | 29.3% |

### 合并执行

```bash
git fetch origin main
git merge main
# 自动合并成功，零冲突
# 合并提交 SHA: 502f3c2a4
```

Git 自动处理了以下 5 个文件的三路合并（fork 和 main 双方都有改动）：

- `pnpm-lock.yaml`
- `src/agents/transcript-policy.ts`
- `src/cli/nodes-cli/register.invoke.ts`
- `src/config/io.ts`
- `src/config/types.tools.ts`

### 冲突解决

**无冲突**。上次合并的唯一冲突源（`pnpm-lock.yaml` 中 fork 独有的 `extensions/js-knowledge-prism`）本次被 Git 自动正确合并。

### Fork 核心改动验证

合并后确认以下 fork 专有改动均被 Git 自动正确保留：

| 改动内容                                                  | 文件                            | 状态    | 备注                          |
| --------------------------------------------------------- | ------------------------------- | ------- | ----------------------------- |
| PowerShell 7 优先探测（pwsh7 路径 + ProgramW6432 备选）   | `src/agents/shell-utils.ts`     | ✅ 保留 | 109 行差异                    |
| `resolvePowerShellPath` 导出为 `export function`          | `src/agents/shell-utils.ts`     | ✅ 保留 |                               |
| `getShellConfig` 支持 `overrides` 参数（shell/shellArgs） | `src/agents/shell-utils.ts`     | ✅ 保留 | 含 `detectShellArgs` 新增函数 |
| Telegram 嵌套 HTML 渲染修复                               | `src/telegram/format.ts` 等     | ✅ 合并 | 已被上游吸收，fork 无差异     |
| Moonshot Kimi k2.5 默认模型                               | `ui/src/ui/data/moonshot-*`     | ✅ 合并 | 上游已同步 kimi-k2.5 模型定义 |
| js-knowledge-prism 扩展                                   | `extensions/js-knowledge-prism` | ✅ 保留 | fork 独有                     |
| docs/prism 知识库                                         | `docs/prism/`                   | ✅ 保留 | fork 独有                     |
| Chrome 扩展 background.js                                 | `assets/chrome-extension/`      | ✅ 保留 | fork 独有                     |
| PowerShell 脚本（monitor/trace）                          | `scripts/*.ps1`                 | ✅ 保留 | fork 独有                     |
| config schema hints                                       | `src/config/schema.hints.ts`    | ✅ 保留 | fork 独有 670 行              |

**重要发现**：Telegram HTML 修复和 Moonshot Kimi k2.5 两项 fork 定制已被上游吸收，后续无需维护。fork 与 main 的实际代码差异已收窄为 15 个文件、949 行（排除 docs/prism 和 extensions）。

---

## 本轮版本升级内容

以下为从基准点 `88ee57124e` 至本次合并（`origin/main` @ `389647157`）期间上游主要功能变化。

---

### 1. 新功能（Features）

#### 1.1 核心架构

| 功能                        | 说明                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| Context Engine 插件接口     | 新增 `ContextEngine` 插件槽位，完整生命周期钩子，支持第三方上下文管理策略替代内置 compaction |
| ACP 持久化渠道绑定          | Discord/Telegram 绑定持久存储，重启后路由保持，CLI 管理支持                                  |
| Compaction 后注入段落可配置 | `postCompactionSections` 允许选择 compaction 后哪些 AGENTS.md 段落被重新注入                 |
| Compaction 保护参数暴露     | `recentTurnsPreserve` 和质量保护重试参数暴露到配置表面                                       |
| Docker 多阶段构建           | Dockerfile 重构为多阶段构建，支持 `slim` 变体，最小化运行时镜像                              |

#### 1.2 渠道

| 功能                           | 说明                                                                  |
| ------------------------------ | --------------------------------------------------------------------- |
| Telegram topic agent 路由      | 每个 Forum Topic 可独立绑定不同 Agent，实现群内多 Agent 隔离          |
| Telegram ACP topic 绑定        | ACP spawn 支持 Telegram topic 线程绑定，审批按钮支持 approval-id 前缀 |
| Telegram 投票功能              | 新增 Telegram poll action 支持                                        |
| Discord allowBots mention 门控 | `allowBots: "mentions"` 仅接受 @mention 的 bot 消息                   |
| Slack DM typing 反馈           | reaction 模式展示 DM 处理状态（native typing 不可用时的 fallback）    |
| Mattermost 交互按钮            | 支持交互按钮发送/回调，HMAC 验证                                      |
| Mattermost model picker        | Telegram 风格的交互式 provider/model 浏览                             |
| Web UI 西班牙语支持            | Control UI 新增 `es` locale                                           |

#### 1.3 模型与 Provider

| 功能                         | 说明                                                     |
| ---------------------------- | -------------------------------------------------------- |
| Google Gemini 3.1 Flash-Lite | 全链路支持 `google/gemini-3.1-flash-lite-preview`        |
| OpenAI GPT-5.4               | 新增 gpt-5.4 支持，含 API 和 Codex OAuth                 |
| TTS/OpenAI 兼容端点 baseUrl  | `messages.tts.openai.baseUrl` 配置支持                   |
| 默认别名刷新                 | `gpt` 指向 `openai/gpt-5.4`，Gemini 默认指向 3.1 preview |

#### 1.4 工具与 Agent

| 功能                           | 说明                                                   |
| ------------------------------ | ------------------------------------------------------ |
| 工具截断 head+tail 策略        | 保留尾部诊断信息，可配置截断选项                       |
| Web search Perplexity 原生 API | 结构化结果 + 语言/地区/时间过滤器                      |
| Diffs guidance 迁移            | 从全局 prompt-hook 迁移到 plugin companion skill 路径  |
| Agent config schema lookup     | `config.schema.lookup` 单路径查询，无需加载完整 schema |

#### 1.5 插件系统

| 功能                               | 说明                                                          |
| ---------------------------------- | ------------------------------------------------------------- |
| before_prompt_build system-context | `prependSystemContext` / `appendSystemContext` 静态上下文注入 |
| Plugin hook policy                 | `allowPromptInjection` 控制，运行时验证未知 hook 类型         |
| Compaction 生命周期钩子            | `session:compact:before` / `session:compact:after` 事件       |
| Docker 扩展预烘焙                  | `OPENCLAW_EXTENSIONS` 容器构建时预安装扩展依赖                |

#### 1.6 平台与基础设施

| 功能                         | 说明                                       |
| ---------------------------- | ------------------------------------------ |
| Gateway SecretRef auth token | auth token 支持 SecretRef + auth-mode 门控 |
| Onboarding web search        | 引导流程新增 web search provider 选择      |
| Cron job snapshot 持久化     | `jobs.json.bak` 保留预编辑快照用于恢复     |
| CLI banner taglines          | `taglineMode` 控制启动横幅行为             |

---

### 2. Breaking Changes

| 变更                     | 影响                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `gateway.auth.mode` 强制 | 当 token 和 password 同时配置时，必须显式指定 `gateway.auth.mode` |

这是本轮唯一的 Breaking Change。上轮合并后判断"无新增 Breaking"在本轮需修正。

---

### 3. 安全加固（Security）

#### 3.1 配置安全

- **Config loadConfig fail-closed**：配置验证/读取错误时 fail-closed，不再静默回退到宽松默认值
- **Config 验证日志脱敏**：清理验证路径中的控制字符和 ANSI 转义序列
- **Config env 替换降级模式**：缺失 `${VAR}` 从硬失败改为警告降级，但阻止未解析占位符作为网关凭据

#### 3.2 执行安全

- **system.run approval CWD 重验证**：使用显式 argv 变异信号
- **system.run 审批持久化安全**：shell 注释语义下 `#` 尾部负载不再持久化为可信命令
- **system.run dispatch-wrapper 边界**：`env` 包装栈无法绕过 `/bin/sh -c` 审批门控
- **system.run PowerShell 包装解析**：`pwsh`/`powershell` `-EncodedCommand` 识别为包装负载

#### 3.3 Gateway 与网络

- **Gateway browser auth 重连加固**：缺失 token/password 不再计入速率限制失败
- **Gateway service token 漂移修复**：停止将共享 auth token 持久化到 systemd 服务单元
- **Gateway SecretRef fail-closed**：config-first secretrefs 无法解析时直接失败
- **outbound 投递重放安全**：两阶段 ACK 标记（.json → .delivered → unlink）

#### 3.4 其他

- **Archive ZIP 加固**：原子重命名 + 硬链接别名竞态拒绝
- **Skills workspace 边界加固**：realpath 逃逸检测
- **Nostr 回环防护**：fail-closed 非回环转发头 + cross-site 拒绝
- **Cron 文件权限加固**：owner-only（0600）cron 存储文件
- **依赖安全**：Hono 4.12.5 + tar 7.5.10 漏洞修复

---

### 4. Bug 修复（重点摘录）

#### 4.1 Telegram（大量修复）

- DM draft streaming 全链路重构：preview 边界稳定性、最终投递可靠性、重复消息抑制
- named-account DM 回退路由恢复
- native commands `allowFrom` 优先级修复
- forum topic 命令路由修复
- 多账号默认路由告警改进
- polling 偏移安全 + 冲突恢复
- webhook 模式健康监控修复
- 媒体上传上限提升至 100MB

#### 4.2 Discord（大量修复）

- DM session-key 规范化
- native slash 命令 auth 修复
- inbound 非阻塞 dispatch
- agentComponents config schema 对齐
- exec approvals gateway auth 修复
- voice decoder 移除 native opus 依赖
- 自动 presence 健康信号

#### 4.3 Agent / 运行时

- transcript-policy `preserveSignatures` 限定 Anthropic-only
- tool-call dispatch 名称规范化（provider 前缀剥离）
- parallel tool-call 兼容性（仅 openai-\* API）
- compaction 阈值使用有效 context window
- OpenAI WS reconnect 重试计数修复
- codex-cli sandbox 默认改为 workspace-write
- session bootstrap 缓存失效排序修复

#### 4.4 Memory / QMD

- QMD search 结果 file URI 解码
- QMD collection-name 冲突恢复
- QMD duplicate-document 恢复
- SQLite busy_timeout 重新应用
- 默认 memory flush 禁止时间戳变体文件名

#### 4.5 Gateway / Routing

- session delivery 重复抑制对齐
- legacy session route 继承保护
- webchat 路由安全（阻止跨渠道泄漏）
- chat delta 排序（工具 start 前 flush 文本）
- health-monitor restart reason 标签准确化

#### 4.6 Feishu / LINE / Others

- Feishu streaming card 投递合成 + 重复抑制
- Feishu group mention 检测使用实时 bot 身份
- LINE auth/media/routing 大规模合成修复
- Mattermost plugin SDK scoped-import 迁移
- Venice 默认模型刷新 + onboarding 加固
- Ollama compaction/summarization 注册

---

### 5. 重要架构变化

#### 5.1 Context Engine 插件化

最重大的架构变化。新增 `ContextEngine` 插件槽位，完整生命周期钩子覆盖 bootstrap → ingest → assemble → compact → afterTurn → subagent spawn/end。`LegacyContextEngine` 包装器保持向后兼容。这意味着第三方可以完全替换 compaction 策略。

#### 5.2 Gateway 服务适配器注册重构

`refactor: register gateway service adapters` 将 gateway 服务注册改为集中式适配器模式。

#### 5.3 Telegram 大规模重构

- `bot-message-context` 拆分为多个子模块（.body、.session、.types、.acp-bindings）
- `conversation-route.ts`、`lane-delivery-state.ts`、`thread-bindings.ts` 等新文件
- 文本解析 helper 集中化

#### 5.4 Plugin SDK scoped imports 完成

bundled plugin 全面迁移到 scoped subpaths（`openclaw/plugin-sdk/core`、`openclaw/plugin-sdk/telegram` 等），monolithic import 仅为社区插件保留兼容。

#### 5.5 Docker 多阶段构建

Dockerfile 重构为多阶段构建，支持 `OPENCLAW_VARIANT=slim` 最小化运行时镜像。

---

### 6. 依赖更新

- Hono 固定到 4.12.5（修复传递漏洞）
- tar 升级到 7.5.10（高危硬链接路径遍历）
- Discord 移除 native opus，改用 opusscript

---

## 参考

- 合并提交：`502f3c2a4`
- 合并来源：`origin/main` @ `389647157` (`build: update stable appcast release URL`)
- 基准点：`88ee57124e` (`Delete changelog/fragments directory`)
- 上一轮合并记录：[docs/prism/journal/2026-03-04/merge-main-upgrade-summary.md](../2026-03-04/merge-main-upgrade-summary.md)

---

## 官方 CHANGELOG（`2026.3.7` 完整内容摘要）

> 本轮 CHANGELOG 仅包含 `2026.3.7` 一个版本段落（line 5–356），篇幅约 350 行。
> 2026.3.4~2026.3.6 版本号未单独发布，内容合并在 2026.3.7 中。
>
> 完整内容请参考仓库 `CHANGELOG.md` 文件。
