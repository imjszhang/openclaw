# OpenClaw AI 模型与 Agent 配置指南

> 编写日期：2026-01-31  
> 本文档详细介绍 OpenClaw 的 AI 模型提供商、认证方式和 Agent 配置

---

## 目录

1. [核心概念](#1-核心概念)
2. [支持的 AI 提供商](#2-支持的-ai-提供商)
3. [认证方式](#3-认证方式)
4. [常用配置示例](#4-常用配置示例)
5. [Agent 配置](#5-agent-配置)
6. [多 Agent 高级配置](#6-多-agent-高级配置)

---

## 1. 核心概念

OpenClaw 中有三个关键概念需要区分：

| 概念 | 说明 | 示例 |
|------|------|------|
| **Provider** | AI 模型的来源/提供商 | `anthropic`, `openai`, `openai-codex` |
| **Model** | 具体的 AI 模型 | `claude-opus-4-5`, `gpt-5.2` |
| **Agent** | OpenClaw 的 AI 助手实例 | 包含工作空间、会话、认证的完整实体 |

**重要区分**：
- **Claude Code CLI** 不是一个 agent 类型，而是一种**认证方式**（通过 `setup-token` 使用 Claude 订阅）
- **OpenAI Codex** (`openai-codex`) 是一个 provider，使用 ChatGPT Plus/Pro 订阅的 OAuth 认证
- OpenClaw 本身运行一个基于 p-mono 的嵌入式 agent 运行时

---

## 2. 支持的 AI 提供商

### 2.1 内置提供商（无需额外配置）

这些提供商开箱即用，只需设置 API 密钥：

| 提供商 | Provider ID | 认证环境变量 | 示例模型 |
|--------|-------------|--------------|----------|
| **Anthropic** | `anthropic` | `ANTHROPIC_API_KEY` | `anthropic/claude-opus-4-5` |
| **OpenAI** | `openai` | `OPENAI_API_KEY` | `openai/gpt-5.2` |
| **OpenAI Code** | `openai-codex` | OAuth | `openai-codex/gpt-5.2` |
| **OpenCode Zen** | `opencode` | `OPENCODE_API_KEY` | `opencode/claude-opus-4-5` |
| **Google Gemini** | `google` | `GEMINI_API_KEY` | `google/gemini-3-pro-preview` |
| **Z.AI (GLM)** | `zai` | `ZAI_API_KEY` | `zai/glm-4.7` |
| **OpenRouter** | `openrouter` | `OPENROUTER_API_KEY` | `openrouter/anthropic/claude-sonnet-4-5` |
| **Vercel AI Gateway** | `vercel-ai-gateway` | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway/anthropic/claude-opus-4.5` |
| **xAI** | `xai` | `XAI_API_KEY` | - |
| **Groq** | `groq` | `GROQ_API_KEY` | - |
| **Cerebras** | `cerebras` | `CEREBRAS_API_KEY` | - |
| **Mistral** | `mistral` | `MISTRAL_API_KEY` | - |
| **GitHub Copilot** | `github-copilot` | `GH_TOKEN` | - |

### 2.2 自定义配置提供商

以下提供商需要在配置中添加 `models.providers`：

| 提供商 | Provider ID | 认证环境变量 | 示例模型 |
|--------|-------------|--------------|----------|
| **Moonshot (Kimi)** | `moonshot` | `MOONSHOT_API_KEY` | `moonshot/kimi-k2.5` |
| **Kimi Code** | `kimi-code` | `KIMICODE_API_KEY` | `kimi-code/kimi-for-coding` |
| **Qwen Portal** | `qwen-portal` | OAuth 插件 | `qwen-portal/coder-model` |
| **Synthetic** | `synthetic` | `SYNTHETIC_API_KEY` | `synthetic/hf:MiniMaxAI/MiniMax-M2.1` |
| **MiniMax** | `minimax` | `MINIMAX_API_KEY` | - |
| **Venice AI** | `venice` | - | `venice/llama-3.3-70b` |
| **Ollama** | `ollama` | 无需（本地） | `ollama/llama3.3` |

### 2.3 场景推荐

| 使用场景 | 推荐配置 | 说明 |
|----------|----------|------|
| 最强能力 | `anthropic/claude-opus-4-5` | Anthropic 旗舰模型 |
| 性价比 | `anthropic/claude-sonnet-4-5` | 能力与成本平衡 |
| 免费试用 | OpenRouter free tier | 多种免费模型可选 |
| 本地运行 | `ollama/llama3.3` | 无需网络，隐私保护 |
| 中国访问 | `moonshot/kimi-k2.5` 或 `zai/glm-4.7` | 国内直连 |

---

## 3. 认证方式

### 3.1 认证类型对比

OpenClaw 支持两种主要认证方式：

| 认证类型 | 说明 | 优点 | 缺点 |
|----------|------|------|------|
| **API Key** | 直接使用提供商的 API 密钥 | 简单稳定，无需刷新 | 按量付费 |
| **订阅认证** | 使用订阅账号的 OAuth/Token | 免 API 费用（使用订阅额度） | Token 可能过期，需要刷新 |

### 3.2 支持的订阅认证

| Provider | 订阅类型 | 认证方式 | 配置命令 |
|----------|----------|----------|----------|
| `anthropic` | Claude Pro/Max 订阅 | setup-token | `claude setup-token` + `models auth setup-token` |
| `openai-codex` | ChatGPT Plus/Pro 订阅 | OAuth | `models auth login --provider openai-codex` |
| `google-antigravity` | Google AI 订阅 | OAuth 插件 | `plugins enable` + `models auth login` |
| `google-gemini-cli` | Gemini CLI 订阅 | OAuth 插件 | `plugins enable` + `models auth login` |
| `qwen-portal` | Qwen 免费额度 | OAuth 插件 | `plugins enable` + `models auth login` |

### 3.3 订阅认证配置示例

```bash
# ========== Anthropic Claude 订阅 ==========
# 需要先安装 Claude Code CLI (https://docs.anthropic.com/en/docs/claude-code)
claude setup-token
pnpm openclaw models auth setup-token --provider anthropic
pnpm openclaw config set agents.defaults.model.primary "anthropic/claude-opus-4-5"

# ========== OpenAI ChatGPT 订阅 ==========
# 使用 ChatGPT Plus/Pro 订阅
pnpm openclaw models auth login --provider openai-codex
pnpm openclaw config set agents.defaults.model.primary "openai-codex/gpt-5.2"

# ========== Google Antigravity ==========
# 使用 Google AI 订阅
pnpm openclaw plugins enable google-antigravity-auth
pnpm openclaw gateway restart  # 重启以加载插件
pnpm openclaw models auth login --provider google-antigravity --set-default

# ========== Google Gemini CLI ==========
# 使用 Gemini CLI 订阅
pnpm openclaw plugins enable google-gemini-cli-auth
pnpm openclaw gateway restart
pnpm openclaw models auth login --provider google-gemini-cli --set-default

# ========== Qwen Portal（免费额度）==========
# 每天 2000 次请求免费
pnpm openclaw plugins enable qwen-portal-auth
pnpm openclaw gateway restart
pnpm openclaw models auth login --provider qwen-portal --set-default
# 模型：qwen-portal/coder-model, qwen-portal/vision-model
```

### 3.4 Token 刷新

- OAuth tokens 会自动刷新
- 如果遇到认证失败，重新运行 login 命令即可
- Anthropic setup-token 过期后需要重新运行 `claude setup-token`

---

## 4. 常用配置示例

### 4.1 Anthropic（推荐，最强能力）

```bash
# 方式 A：使用 API 密钥
pnpm openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"

# 方式 B：使用 Claude 订阅的 setup-token（需要先安装 Claude CLI）
claude setup-token
pnpm openclaw models auth setup-token --provider anthropic

# 设置默认模型
pnpm openclaw config set agents.defaults.model.primary "anthropic/claude-sonnet-4-5"
```

### 4.2 OpenAI

```bash
pnpm openclaw config set env.OPENAI_API_KEY "sk-..."
pnpm openclaw config set agents.defaults.model.primary "openai/gpt-4o"
```

### 4.3 OpenRouter（访问多种模型，有免费额度）

```bash
pnpm openclaw config set env.OPENROUTER_API_KEY "sk-or-..."
pnpm openclaw config set agents.defaults.model.primary "openrouter/anthropic/claude-sonnet-4"
```

### 4.4 Moonshot Kimi（中国可用）

```bash
pnpm openclaw config set env.MOONSHOT_API_KEY "sk-..."
pnpm openclaw config set agents.defaults.model.primary "moonshot/kimi-k2.5"
```

### 4.5 Ollama（本地运行，无需 API 密钥）

```bash
# 先安装 Ollama 并拉取模型
ollama pull llama3.3

# 配置 OpenClaw 使用 Ollama
pnpm openclaw config set agents.defaults.model.primary "ollama/llama3.3"
```

### 4.6 验证配置

```bash
# 查看可用模型
pnpm openclaw models list --all

# 检查当前模型状态
pnpm openclaw models status

# 测试发送消息
pnpm openclaw send "Hello, can you hear me?"
```

---

## 5. Agent 配置

### 5.1 什么是 Agent

Agent 是 OpenClaw 中的一个完整 AI 助手实例，包含：
- **Workspace**：工作空间目录（AGENTS.md, SOUL.md 等文件）
- **Sessions**：会话历史
- **Auth Profiles**：认证信息（API 密钥、OAuth tokens）

### 5.2 单 Agent 配置（默认）

默认情况下，OpenClaw 运行单个 agent（id 为 `main`）：

```bash
# 查看当前 agent
pnpm openclaw agents list

# Agent 数据位置
~/.openclaw/workspace/           # 工作空间（AGENTS.md, SOUL.md 等）
~/.openclaw/agents/main/         # Agent 状态目录
~/.openclaw/agents/main/sessions/  # 会话历史
```

---

## 6. 多 Agent 高级配置

### 6.1 多 Agent 的用途

多 Agent 允许：
- 不同渠道使用不同的 AI 模型
- 不同联系人路由到不同的 Agent
- 隔离的工作空间和会话历史

### 6.2 示例：WhatsApp 用 Sonnet，Telegram 用 Opus

```json5
// ~/.openclaw/openclaw.json
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: { primary: "anthropic/claude-sonnet-4-5" }
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: { primary: "anthropic/claude-opus-4-5" }
      }
    ]
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } }
  ]
}
```

### 6.3 添加新 Agent

```bash
# 使用向导添加
pnpm openclaw agents add work --workspace ~/.openclaw/workspace-work

# 查看 agent 列表和路由
pnpm openclaw agents list --bindings
```

### 6.4 Agent 与 Provider 的关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        OpenClaw Gateway                          │
├─────────────────────────────────────────────────────────────────┤
│  Agent: main                    Agent: work                      │
│  ├─ workspace: ~/.../workspace  ├─ workspace: ~/.../workspace-work│
│  ├─ model: anthropic/sonnet     ├─ model: anthropic/opus         │
│  └─ auth: setup-token           └─ auth: API key                 │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│                      AI Providers                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  anthropic   │  │    openai    │  │  openrouter  │  ...     │
│  │  (Claude)    │  │   (GPT)      │  │  (多模型)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

---

## 参考链接

- AI 提供商配置：https://docs.openclaw.ai/concepts/model-providers
- 多 Agent 配置：https://docs.openclaw.ai/concepts/multi-agent
- OAuth 认证详解：https://docs.openclaw.ai/concepts/oauth
- 模型故障转移：https://docs.openclaw.ai/concepts/model-failover

---

*文档编写：2026-01-31*
