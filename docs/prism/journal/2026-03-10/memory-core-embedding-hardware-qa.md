# Memory-Core、Embedding 与硬件：问答与结论

> 文档日期：2026-03-10
>
> 来源：基于 OpenClaw 代码与文档的分析
>
> 相关：[knowledge-memory-bridge.md](../2026-03-09/knowledge-memory-bridge.md)（知识库桥接设计）

---

## 一、不开启向量检索时能否关联插件记忆？

**结论：不能可靠实现。**

### 1.1 两种「不开启」的情形

| 情形                         | 配置                               | extraPaths 桥接                                      |
| ---------------------------- | ---------------------------------- | ---------------------------------------------------- |
| **整体关闭**                 | `memorySearch.enabled = false`     | ❌ 不能。`memory_search`/`memory_get` 工具不会被创建 |
| **无 embedding（FTS-only）** | `enabled = true` 但无可用 provider | ❌ 不可靠。新内容不会被索引                          |

### 1.2 机制说明

- `memorySearch.enabled = false` 时，`resolveMemorySearchConfig()` 返回 `null`，工具不注册。
- 无 embedding provider 时，`syncMemoryFiles()` 和 `indexFile()` 会直接返回，**不做任何索引**（包括 FTS）。
- `memory_search` 虽可调用，但只能检索「之前有 provider 时已建立的索引」，新加入的 `extraPaths` 不会被索引。

### 1.3 实现桥接的前提

要实现 `memorySearch.extraPaths` 桥接（如 js-knowledge-collector 导出 Markdown 纳入检索）：

- `memorySearch.enabled = true`
- 至少一个可用的 embedding provider（OpenAI、Gemini、Voyage、Ollama、local 等）

---

## 二、本地 Embedding 模型推荐

### 2.1 方案对比

| 方式               | 推荐模型            | 部署           | 适用场景                         |
| ------------------ | ------------------- | -------------- | -------------------------------- |
| **Ollama**         | `nomic-embed-text`  | 需 Ollama 常驻 | 已有 Ollama，统一管理            |
| **node-llama-cpp** | EmbeddingGemma 300M | 首次自动下载   | 不想跑 Ollama、完全本地          |
| **QMD**            | 与 QMD 绑定         | 需单独安装 QMD | 要 BM25+向量+rerank 的完整本地栈 |

### 2.2 Ollama 配置（首选）

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama",
        model: "nomic-embed-text",
      },
    },
  },
}
```

前置：`ollama pull nomic-embed-text`，`export OLLAMA_API_KEY="ollama-local"`。

### 2.3 node-llama-cpp 配置（无 Ollama）

默认模型：`hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB），首次使用时自动从 HuggingFace 下载。

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        local: {
          modelPath: "hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

需运行 `pnpm approve-builds` 勾选 `node-llama-cpp`，并 `pnpm rebuild node-llama-cpp`。

### 2.4 文档入口

- [Memory 概念](https://docs.openclaw.ai/concepts/memory)
- [Ollama Provider](https://docs.openclaw.ai/providers/ollama)
- [Local Models](https://docs.openclaw.ai/gateway/local-models)

---

## 三、硬件最低标准

### 3.1 分层要求

| 场景                               | 最低                                   | 推荐                         |
| ---------------------------------- | -------------------------------------- | ---------------------------- |
| **仅 Gateway（用远程 API）**       | 1 vCPU，1GB RAM，约 500MB 磁盘         | 2 vCPU，2GB+ RAM             |
| **Gateway + 本地 Embedding**       | 1 vCPU，2GB RAM                        | 2 vCPU，2–4GB RAM            |
| **Gateway + Embedding + 本地 LLM** | 视模型而定，通常需 4GB+ RAM、8GB+ 显存 | Mac Studio 或 24GB+ 显存 GPU |

### 3.2 Gateway 基准

- **绝对最低**：1 vCPU，1GB RAM，约 500MB 磁盘
- **推荐**：1–2 vCPU，2GB+ RAM（多通道、日志、媒体、浏览器自动化）
- **树莓派**：Pi 4 1GB 可跑；Pi 5 / Pi 4 4GB 更佳；Pi Zero 2 W 不推荐

### 3.3 本地 Embedding

- **Ollama + nomic-embed-text**：与 Gateway 同量级，1–2GB RAM 足够
- **node-llama-cpp + EmbeddingGemma 300M**：约 0.6GB 模型，2GB RAM 较稳妥；需能编译 native 模块

### 3.4 本地对话 LLM

文档建议：≥2 台满配 Mac Studio 或同级 GPU（约 $30k+）。单张 24GB 显存 GPU 可跑，但负载和延迟需权衡。

### 3.5 参考文档

- VPS/虚拟机：[FAQ - VPS 最低要求](https://docs.openclaw.ai/help/faq)
- 树莓派：[Raspberry Pi](https://docs.openclaw.ai/platforms/raspberry-pi)
- 本地 LLM：[Local Models](https://docs.openclaw.ai/gateway/local-models)
