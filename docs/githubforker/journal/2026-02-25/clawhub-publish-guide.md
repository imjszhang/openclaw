# ClawHub 技能发布指南

> 编写日期：2026-02-25
> 以 JS-Eyes 插件发布为实例，从认识 ClawHub 到完成首次发布的完整流程

---

## 目录

1. [ClawHub 是什么](#1-clawhub-是什么)
2. [核心概念](#2-核心概念)
3. [SKILL.md 文件格式](#3-skillmd-文件格式)
4. [实战：发布 JS-Eyes 到 ClawHub](#4-实战发布-js-eyes-到-clawhub)
5. [CLI 命令速查](#5-cli-命令速查)
6. [版本管理与更新](#6-版本管理与更新)
7. [注意事项与排查](#7-注意事项与排查)
8. [相关链接](#8-相关链接)

---

## 1. ClawHub 是什么

[ClawHub](https://clawhub.ai) 是 OpenClaw 生态的 **公共技能注册中心**（Skill Registry），定位类似于 npm 之于 Node.js、PyPI 之于 Python——但面向的是 AI Agent 的技能包。

```
┌─────────────────────────────────────────────────────────────────┐
│                          ClawHub                                │
│                     clawhub.ai                                  │
├─────────────┬───────────────┬───────────────┬───────────────────┤
│   发布       │    搜索       │    安装        │    版本管理       │
│  publish     │  vector search│  install       │  semver + tags   │
│  SKILL.md +  │  OpenAI       │  zip download  │  latest / v1.x   │
│  supporting  │  embeddings   │  + extract     │  changelog       │
│  text files  │               │                │                  │
├─────────────┴───────────────┴───────────────┴───────────────────┤
│  Backend: Convex (DB + file storage + HTTP)                     │
│  Auth: GitHub OAuth                                             │
│  Search: text-embedding-3-small + vector index                  │
└─────────────────────────────────────────────────────────────────┘
```

### 它能做什么

| 能力         | 说明                                                     |
| ------------ | -------------------------------------------------------- |
| **发布技能** | 上传 `SKILL.md` + 支持文件，创建版本和标签               |
| **搜索技能** | 基于 OpenAI embedding 的语义向量搜索，而非简单关键词匹配 |
| **安装技能** | `clawhub install <slug>` 下载并解压到本地 skills 目录    |
| **版本管理** | 语义化版本（semver） + 标签系统（`latest` 等）           |
| **社区互动** | 收藏（star）、评论（comment）、徽章（badge）、管理审核   |

### 与 OpenClaw 插件的关系

OpenClaw 有两套扩展机制：

- **插件（Plugin）**——运行时代码，通过 `openclaw.plugin.json` + JS/TS 入口文件注册工具、服务、CLI 等
- **技能（Skill）**——文本形式的 Agent 指令包，以 `SKILL.md` 为核心

ClawHub 管理的是**技能**。一个 OpenClaw 插件可以在 ClawHub 上发布为一个技能，SKILL.md 作为文档和元数据入口，附带插件源码作为支持文件。用户通过 ClawHub 发现和了解插件，再按照 SKILL.md 中的说明完成安装配置。

---

## 2. 核心概念

### 2.1 技能包（Skill Bundle）

一个技能包就是一个文件夹，最低要求只有一个文件：

```
my-skill/
└── SKILL.md          ← 唯一必须的文件
```

可以包含任意数量的文本支持文件：

```
my-skill/
├── SKILL.md          ← 技能描述 + 元数据
├── index.mjs         ← 插件源码
├── package.json      ← 包信息
├── config.json       ← 配置示例
└── utils/
    └── helper.js     ← 辅助代码
```

### 2.2 文件类型限制

ClawHub **只接受文本文件**。允许的扩展名包括：

| 类别                    | 扩展名                                       |
| ----------------------- | -------------------------------------------- |
| Markdown                | `.md`                                        |
| JavaScript / TypeScript | `.js`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.jsx` |
| 数据格式                | `.json`, `.yaml`, `.yml`, `.toml`            |
| 样式                    | `.css`, `.svg`                               |
| 配置                    | `.txt`, `.cfg`, `.ini`, `.env.example`       |

**不接受**：`.png`, `.jpg`, `.zip`, `.exe`, `.wasm` 等二进制文件。

### 2.3 Slug

每个技能有一个唯一的 slug（URL 标识符）：

- 格式要求：`^[a-z0-9][a-z0-9-]*$`
- 只允许小写字母、数字、连字符
- 示例：`js-eyes`、`todoist-cli`、`my-awesome-skill`

### 2.4 版本与标签

- 每次发布创建一个**版本**（必须是 semver 格式：`1.0.0`, `1.4.0`）
- **标签**是指向特定版本的指针（如 `latest` → `1.4.0`）
- `latest` 标签默认指向最新版本

### 2.5 发布要求

| 要求        | 说明                          |
| ----------- | ----------------------------- |
| GitHub 账号 | 通过 GitHub OAuth 登录        |
| 账号年龄    | 注册超过 7 天                 |
| 文件大小    | 单版本总大小 ≤ 50MB           |
| SKILL.md    | 必须存在且 frontmatter 可解析 |

---

## 3. SKILL.md 文件格式

`SKILL.md` 是一个 Markdown 文件，顶部有 YAML frontmatter 声明元数据。

### 3.1 基础模板

```markdown
---
name: my-skill
description: Short summary of what this skill does.
version: 1.0.0
---

# My Skill

Detailed description and usage instructions here.
```

### 3.2 完整的 frontmatter 字段

```yaml
---
name: my-skill # 技能名称
description: One-line summary. # 简短描述（用于搜索和列表展示）
version: 1.0.0 # 语义化版本号
metadata:
  openclaw: # OpenClaw 运行时元数据（别名：clawdbot、clawdis）
    emoji: "🔧" # 展示用 emoji
    homepage: https://github.com/user/repo # 项目主页
    os: # 支持的操作系统
      - windows
      - macos
      - linux
    requires: # 运行时依赖声明
      env: # 需要的环境变量
        - MY_API_KEY
      bins: # 需要的 CLI 工具
        - node
        - curl
      anyBins: # 至少需要其中一个
        - bun
        - npm
      config: # 需要的配置文件路径
        - ~/.config/my-skill.json
    primaryEnv: MY_API_KEY # 主要的凭证环境变量
    always: false # true 则始终激活，无需显式安装
    install: # 依赖安装规范
      - kind: node # 支持：brew、node、go、uv
        package: ws
        bins: []
---
```

### 3.3 安全审查

ClawHub 会对发布的技能进行安全分析，检查 frontmatter 声明是否与实际代码行为一致。例如：

- 代码中引用了 `TODOIST_API_KEY`，但 frontmatter 没有在 `requires.env` 中声明 → 触发 metadata mismatch 警告
- 声明依赖但实际未使用 → 低优先级提示

保持声明准确有助于通过审核，也让用户清楚自己在安装什么。

---

## 4. 实战：发布 JS-Eyes 到 ClawHub

以下是 [JS-Eyes](https://github.com/imjszhang/js-eyes) 浏览器自动化插件发布到 ClawHub 的完整过程记录。

### 4.1 项目背景

JS-Eyes 是一个浏览器扩展项目，通过 WebSocket 为 AI Agent 提供浏览器自动化能力。项目已有完整的 OpenClaw 插件实现（`openclaw-plugin/` 目录），但缺少 ClawHub 发布所需的 `SKILL.md`。

项目结构（简化）：

```
js-eyes/
├── openclaw-plugin/          # OpenClaw 插件
│   ├── openclaw.plugin.json
│   ├── package.json
│   └── index.mjs             # 注册 7 个 AI 工具 + 服务 + CLI
├── server/                   # WebSocket 服务器
│   ├── index.js
│   └── ws-handler.js
├── clients/                  # 客户端 SDK
│   └── js-eyes-client.js
├── chrome-extension/         # 浏览器扩展（Chrome/Edge）
├── firefox-extension/        # 浏览器扩展（Firefox）
├── README.md
└── package.json
```

### 4.2 第一步：创建 SKILL.md

在项目**根目录**创建 `SKILL.md`。之所以放在根目录而非 `openclaw-plugin/` 目录，是因为插件代码 `index.mjs` 通过相对路径引用了上层的 `clients/` 和 `server/`，放在根目录可以保留完整的目录结构。

```yaml
---
name: js-eyes
description: Browser automation for AI agents — control tabs, extract content, execute scripts and manage cookies via WebSocket.
version: 1.4.0
metadata:
  openclaw:
    emoji: "\U0001F441"
    homepage: https://github.com/imjszhang/js-eyes
    os:
      - windows
      - macos
      - linux
    requires:
      bins:
        - node
    install:
      - kind: node
        package: ws
        bins: []
---

# JS Eyes

Browser extension + WebSocket server that gives AI agents full browser automation capabilities.

## Provided AI Tools

| Tool | Description |
|------|-------------|
| `js_eyes_get_tabs` | List all open browser tabs with ID, URL, title |
| `js_eyes_list_clients` | List connected browser extension clients |
| `js_eyes_open_url` | Open a URL in new or existing tab |
| `js_eyes_close_tab` | Close a tab by ID |
| `js_eyes_get_html` | Get full HTML content of a tab |
| `js_eyes_execute_script` | Run JavaScript in a tab and return result |
| `js_eyes_get_cookies` | Get all cookies for a tab's domain |

## Setup

1. Install browser extension from GitHub Releases
2. Add plugin path to OpenClaw config
3. Connect browser extension to server
...
```

正文部分应当包含完整的安装指南、工具说明、配置参考和链接。

### 4.3 第二步：创建 .clawhubignore

在项目根目录创建 `.clawhubignore`，排除不需要发布的文件。该文件语法与 `.gitignore` 相同，ClawHub 同时也尊重 `.gitignore` 的规则。

```gitignore
# 构建产物与依赖
dist/
build/
node_modules/
work_dir/
signed-firefox-extensions/

# 浏览器扩展图标（二进制图片）
chrome-extension/icons/
firefox-extension/icons/

# 网站与文档静态文件
src/
docs/

# 测试
test/

# CI / IDE
.github/
.git/
.vscode/
.cursor/

# 敏感文件
.env
.env.*
config.json

# 二进制与归档
*.zip
*.xpi
*.crx
*.png
*.ico
*.log

# 其他
package-lock.json
CHANGELOG.md
```

### 4.4 第三步：安装 CLI 并登录

```bash
# CLI 可以通过 npx 直接使用（自动下载），也可以全局安装
npm install -g clawhub

# 登录方式一：浏览器 OAuth（会打开浏览器）
npx clawhub login

# 登录方式二：手动 token（推荐用于回调失败的场景）
# 先在 clawhub.ai 网站生成 token，然后：
npx clawhub login --token clh_你的token

# 验证登录
npx clawhub whoami
# ✓ OK. Logged in as @imjszhang.
```

> **提示**：浏览器 OAuth 登录依赖本地回环端口回调（`127.0.0.1:随机端口`）。如果防火墙、代理或浏览器安全扩展拦截了回调，页面会卡住无法跳回。此时建议使用 `--token` 方式登录。

### 4.5 第四步：发布

```bash
npx clawhub publish . \
  --slug js-eyes \
  --name "JS Eyes" \
  --version 1.4.0 \
  --tags latest \
  --changelog "Initial release — browser automation plugin for AI agents via WebSocket" \
  --no-input
```

参数说明：

| 参数          | 说明                                   |
| ------------- | -------------------------------------- |
| `.`           | 发布目录（包含 SKILL.md 的文件夹路径） |
| `--slug`      | 唯一标识符，小写 + 连字符              |
| `--name`      | 展示名称                               |
| `--version`   | semver 版本号                          |
| `--tags`      | 标签（通常为 `latest`）                |
| `--changelog` | 本次发布的变更说明                     |
| `--no-input`  | 跳过交互式确认                         |

发布成功后输出：

```
- Preparing js-eyes@1.4.0
✓ Published js-eyes@1.4.0
```

### 4.6 第五步：验证

```bash
# 查看已发布的技能信息
npx clawhub inspect js-eyes --versions

# 输出：
# js-eyes  JS Eyes
# Summary: Browser automation for AI agents — control tabs, extract content, ...
# Owner: imjszhang
# Latest: 1.4.0
# Tags: latest=1.4.0
# Versions:
# 1.4.0  2026-02-25  Initial release — browser automation plugin for AI agents via WebSocket
```

此时已可通过以下方式访问：

- 网页浏览：`https://clawhub.ai/skills/js-eyes`
- 搜索：`clawhub search browser automation`
- 安装：`clawhub install js-eyes`

---

## 5. CLI 命令速查

### 认证

| 命令                            | 说明              |
| ------------------------------- | ----------------- |
| `clawhub login`                 | 浏览器 OAuth 登录 |
| `clawhub login --token <token>` | Token 登录        |
| `clawhub logout`                | 退出登录          |
| `clawhub whoami`                | 查看当前登录用户  |

### 发现

| 命令                                | 说明         |
| ----------------------------------- | ------------ |
| `clawhub search <query>`            | 向量语义搜索 |
| `clawhub explore`                   | 浏览最新技能 |
| `clawhub explore --sort trending`   | 按热度排序   |
| `clawhub inspect <slug>`            | 查看技能详情 |
| `clawhub inspect <slug> --versions` | 查看版本历史 |
| `clawhub inspect <slug> --files`    | 查看文件列表 |

### 安装与管理

| 命令                                     | 说明                   |
| ---------------------------------------- | ---------------------- |
| `clawhub install <slug>`                 | 安装到本地 skills 目录 |
| `clawhub install <slug> --workdir <dir>` | 安装到指定目录         |
| `clawhub uninstall <slug>`               | 卸载本地安装           |
| `clawhub list`                           | 列出已安装技能         |
| `clawhub update --all`                   | 更新所有已安装技能     |

### 发布

| 命令                      | 说明                 |
| ------------------------- | -------------------- |
| `clawhub publish <path>`  | 发布技能             |
| `clawhub sync`            | 扫描并发布变更的技能 |
| `clawhub sync --dry-run`  | 预览将要发布的内容   |
| `clawhub delete <slug>`   | 软删除技能           |
| `clawhub undelete <slug>` | 恢复已删除技能       |

### 社区

| 命令                    | 说明     |
| ----------------------- | -------- |
| `clawhub star <slug>`   | 收藏技能 |
| `clawhub unstar <slug>` | 取消收藏 |

---

## 6. 版本管理与更新

### 发布新版本

```bash
# 更新 SKILL.md 中的 version 字段后
npx clawhub publish . \
  --slug js-eyes \
  --version 1.5.0 \
  --tags latest \
  --changelog "Add js_eyes_screenshot tool, fix tab sync on Firefox"
```

### 使用 sync 自动发布

`sync` 命令会扫描本地技能目录，自动检测变更并发布：

```bash
# 预览
npx clawhub sync --dry-run --no-input

# 执行（自动 patch 版本号）
npx clawhub sync --all --bump patch --changelog "Bug fixes and improvements"
```

### 标签管理

- 每次 `publish` 可以通过 `--tags` 指定标签
- `latest` 始终指向最新发布版本（除非手动重新指向）
- 可以打多个标签：`--tags latest,stable,v1`

---

## 7. 注意事项与排查

### 常见问题

| 问题                     | 原因                          | 解决                           |
| ------------------------ | ----------------------------- | ------------------------------ |
| `Not logged in`          | 未登录或 token 过期           | 执行 `clawhub login`           |
| `Version already exists` | 该版本号已被使用              | 增加版本号重新发布             |
| `SKILL.md not found`     | 发布目录缺少 SKILL.md         | 确认路径正确，文件名区分大小写 |
| 浏览器登录后无法跳回     | 防火墙拦截本地回调端口        | 使用 `--token` 方式登录        |
| 文件上传失败             | 包含二进制文件或总大小超 50MB | 检查 `.clawhubignore` 排除规则 |
| `GitHub account too new` | GitHub 账号注册不满 7 天      | 等待后重试                     |

### 发布前检查清单

- [ ] `SKILL.md` 存在且 frontmatter 格式正确
- [ ] `version` 字段是合法的 semver 且未被使用过
- [ ] `description` 简洁明了（用于搜索结果展示）
- [ ] `.clawhubignore` 排除了二进制文件和敏感信息（`.env` 等）
- [ ] `metadata.openclaw.requires` 中声明的依赖与代码实际使用一致
- [ ] 总文件大小未超过 50MB

### 环境变量

| 变量                          | 说明                                      |
| ----------------------------- | ----------------------------------------- |
| `CLAWHUB_SITE`                | 覆盖网站 URL（默认 `https://clawhub.ai`） |
| `CLAWHUB_REGISTRY`            | 覆盖 API URL                              |
| `CLAWHUB_WORKDIR`             | 覆盖工作目录                              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | 禁用 sync 遥测                            |

---

## 8. 相关链接

- ClawHub 网站：<https://clawhub.ai>
- ClawHub 源码：<https://github.com/openclaw/clawhub>
- JS-Eyes 项目：<https://github.com/imjszhang/js-eyes>
- JS-Eyes 在 ClawHub：<https://clawhub.ai/skills/js-eyes>
- OpenClaw 项目：<https://github.com/nicepkg/openclaw>
- [JS-Eyes OpenClaw 插件使用指南](./js-eyes-openclaw-plugin-guide.md)
- [OpenClaw 插件创建完全指引](./plugin-creation-guide.md)
