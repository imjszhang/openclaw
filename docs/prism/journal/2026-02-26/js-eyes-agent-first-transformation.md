# 日记：把 JS-Eyes 改造成 Agent-First 项目的全过程

> 记录日期：2026-02-26
> 背景：ClawHub 集成 VirusTotal 扫描后，js-eyes 被标记为可疑，需要 --force 才能安装，严重影响推广。本次从问题分析到方案落地，完整记录了将项目从「依赖市场分发」转变为「自主安装基础设施」的过程。

---

## 目录

1. [问题：VirusTotal 误报导致 ClawHub 安装受阻](#1-问题virustotal-误报导致-clawhub-安装受阻)
2. [根因分析：哪些代码模式触发了检测](#2-根因分析哪些代码模式触发了检测)
3. [阶段一：安全声明——先让用户安心](#3-阶段一安全声明先让用户安心)
4. [阶段二：提供绕过 ClawHub 的等效安装方式](#4-阶段二提供绕过-clawhub-的等效安装方式)
5. [阶段三：落地页改造——去 ClawHub 化](#5-阶段三落地页改造去-clawhub-化)
6. [阶段四：国内网络加速——多源回退 + Cloudflare CDN](#6-阶段四国内网络加速多源回退--cloudflare-cdn)
7. [最终架构](#7-最终架构)
8. [改动文件清单](#8-改动文件清单)
9. [经验总结](#9-经验总结)

---

## 1. 问题：VirusTotal 误报导致 ClawHub 安装受阻

OpenClaw 的技能市场 ClawHub 在 2026 年 2 月集成了 VirusTotal 扫描。每个技能的 SHA-256 哈希会与 VirusTotal 数据库交叉检查，可疑技能会显示警告，用户必须加 `--force` 才能安装。

js-eyes 就中招了。虽然不是恶意软件，但 VirusTotal 的静态分析把它标成了「可疑」。对于一个想推广的插件来说，这基本等于安装流程多了一个「你确定要安装这个可疑软件吗？」的拦截——大部分用户会直接放弃。

---

## 2. 根因分析：哪些代码模式触发了检测

通过 grep 全项目分析，找到了被 VirusTotal 启发式规则命中的模式：

| 触发模式             | 出现位置                    | 实际用途                                                   |
| -------------------- | --------------------------- | ---------------------------------------------------------- |
| `fetch()` + 动态 URL | `openclaw-plugin/index.mjs` | 仅请求用户配置的本机 HTTP 端点（`/api/browser/status` 等） |
| `new WebSocket(...)` | `clients/js-eyes-client.js` | 连接用户配置的 WS 地址做本地浏览器自动化                   |
| 含 `api` 的 URL 路径 | `server/index.js`           | 本地 HTTP API，无任何外部域名                              |

这些是本地自动化的标准写法，和 C2 后门的网络通信模式在静态特征上很相似。

好消息是 `.clawhubignore` 已经排除了浏览器扩展（`chrome-extension/`、`firefox-extension/`）、CLI（`cli/`）、测试等目录。真正连外网的代码（GitHub API、Cloudflare API、addons.mozilla.org）都不在 ClawHub 包里。所以这完全是误报——但 VirusTotal 不接受「我是好人」的声明，只有具体厂商能撤回检测。

---

## 3. 阶段一：安全声明——先让用户安心

### 3.1 新增 SECURITY.md

创建根目录下的 `SECURITY.md`，面向三类读者：

- **用户**：说明本技能只连用户配置的本地端点，无外联、无遥测
- **审核方/ClawHub 维护者**：说明为什么被标记、依赖列表（仅 `ws` 包）
- **想申诉的人**：提供 VirusTotal 误报流程链接和步骤

### 3.2 SKILL.md 增加 Security 章节

在技能入口文件 `SKILL.md` 的 Prerequisites 和 Install 之间插入「Security & VirusTotal」章节，一段话说清楚：只连本地、可以放心 `--force`、详情看 SECURITY.md。

**关键决策**：安全声明解决的是「让已经看到警告的用户放心」，但不解决「用户根本不想看到警告」的问题。所以需要第二步。

---

## 4. 阶段二：提供绕过 ClawHub 的等效安装方式

### 4.1 方案选型

讨论了五种方案：

| 方案                      | 优点                 | 缺点              |
| ------------------------- | -------------------- | ----------------- |
| CLI `install` 命令        | 复用现有框架         | 需要先 clone 仓库 |
| npx 一键包                | 体验最好             | 需额外发布 npm 包 |
| GitHub Release zip + 脚本 | 不依赖包管理器       | 多一个下载步骤    |
| git clone + 符号链接      | 适合开发者           | 不适合推广        |
| **curl 脚本**             | **一行命令、跨平台** | **需托管脚本**    |

最终选择 **curl 脚本方案**——用户体验最接近 `clawhub install`，且不经过任何市场扫描。

### 4.2 实现两个安装脚本

**install.sh**（Linux/macOS）：

```bash
curl -fsSL https://js-eyes.com/install.sh | bash
```

**install.ps1**（Windows PowerShell）：

```powershell
irm https://js-eyes.com/install.ps1 | iex
```

脚本流程：

1. 检测 `node` 和 `npm`
2. 调用 GitHub API 获取最新 release tag
3. 下载 archive（后面会改为多源回退）
4. 从 archive 中提取 skill bundle 文件
5. `npm install --production`
6. 打印注册到 `openclaw.json` 的配置指引

设计考量：

- 通过 `JS_EYES_DIR` 环境变量自定义安装目录（默认 `./skills`）
- `JS_EYES_FORCE=1` 跳过覆盖确认（CI 场景）
- 管道模式（`curl | bash`）下通过 `/dev/tty` 读取用户输入

### 4.3 更新 SKILL.md

安装章节改为双选项结构：

- **Option A**：curl/irm 一键安装（推荐）
- **Option B**：ClawHub（附 VirusTotal 说明和 --force 提示）

---

## 5. 阶段三：落地页改造——去 ClawHub 化

GitHub Pages 落地页（`js-eyes.com`）上原来的 Hero 区域有一个命令框显示 `clawhub install js-eyes`。既然提供了等效安装方式，就不需要保留 ClawHub 入口了。

### 5.1 命令框改造

- 用两个 Tab 按钮（Linux/macOS | Windows）替换原来的单条命令
- 默认显示 curl 命令，通过 `navigator.platform` 检测 Windows 用户自动切换到 PowerShell 命令
- Copy 按钮复制当前显示的命令

### 5.2 i18n 适配

- `en-US`：`deployHint` 改为 `'Run in your terminal'`
- `zh-CN`：`deployHint` 改为 `'在终端中运行'`
- 清理所有 `src/` 和 `docs/` 中对 `clawhub` 的引用

---

## 6. 阶段四：国内网络加速——多源回退 + Cloudflare CDN

安装脚本的入口 URL 指向 `raw.githubusercontent.com`，这在国内经常不可达。项目已有 `js-eyes.com` 域名通过 Cloudflare 指向 GitHub Pages，可以利用起来。

### 6.1 构建流程扩展

修改 `cli/lib/builder.js` 的 `buildSite` 函数（改为 async），新增两步：

1. **复制安装脚本**：将 `install.sh`、`install.ps1` 复制到 `docs/`
2. **打包 skill bundle zip**：把技能包文件（SKILL.md、package.json、openclaw-plugin/、server/、clients/ 等）用 archiver 打包成 `docs/js-eyes-skill.zip`

构建后这些资源通过 GitHub Pages + Cloudflare 部署到 `js-eyes.com`。

### 6.2 安装脚本多源回退

重写下载逻辑，引入 `try_download` 函数：

```
下载回退链：
1. js-eyes.com/js-eyes-skill.zip   ← Cloudflare CDN，国内可达
2. github.com/.../archive/v{tag}.tar.gz  ← GitHub 直连
3. cdn.jsdelivr.net/gh/...         ← jsDelivr 备选
```

- 优先下载预打包的 skill zip（直接解压，无需从完整仓库 archive 中筛选）
- skill zip 下载失败才回退到 GitHub archive（原有逻辑）
- 每个源 10-15 秒超时，快速切换

### 6.3 落地页 i18n 按语言显示不同 URL

新增 i18n key `hero.deployCmdUnix` 和 `hero.deployCmdWin`：

| 语言  | Unix 命令                                                   | Windows 命令                                               |
| ----- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| en-US | `curl ... raw.githubusercontent.com/.../install.sh \| bash` | `irm ... raw.githubusercontent.com/.../install.ps1 \| iex` |
| zh-CN | `curl ... js-eyes.com/install.sh \| bash`                   | `irm ... js-eyes.com/install.ps1 \| iex`                   |

页面 JS 从 i18n 数据动态读取命令文本，切换语言时自动更新。

### 6.4 SKILL.md 主推 js-eyes.com

安装说明中 `js-eyes.com` 作为主 URL，GitHub raw 作为备注中的备选。

---

## 7. 最终架构

```
用户入口                    安装脚本                   下载源（回退链）
┌─────────────────┐       ┌──────────────┐          ┌──────────────────────────────┐
│ 落地页 js-eyes.com │──────►│ install.sh   │──────────►│ 1. js-eyes.com (Cloudflare)  │
│   中文→js-eyes.com│       │ install.ps1  │    │      │ 2. GitHub archive            │
│   英文→GitHub raw │       └──────────────┘    │      │ 3. jsDelivr CDN              │
├─────────────────┤                             │      └──────────────────────────────┘
│ SKILL.md         │────────────────────────────┘
│   主推 js-eyes.com│                                   托管资源（docs/ → GitHub Pages）
└─────────────────┘                                   ┌──────────────────────────────┐
                                                      │ install.sh / install.ps1     │
                                                      │ js-eyes-skill.zip            │
                                                      └──────────────────────────────┘
```

---

## 8. 改动文件清单

| 文件                         | 变更内容                                                                  |
| ---------------------------- | ------------------------------------------------------------------------- |
| `SECURITY.md`                | **新增** — 安全声明和 VirusTotal 误报说明                                 |
| `install.sh`                 | **新增** — Linux/macOS 安装脚本，含多源回退                               |
| `install.ps1`                | **新增** — Windows PowerShell 安装脚本，含多源回退                        |
| `SKILL.md`                   | 安装章节重写：主推 js-eyes.com URL，双选项结构                            |
| `cli/lib/builder.js`         | buildSite 改 async，新增打包 skill zip + 复制安装脚本到 docs/             |
| `cli/cli.js`                 | 所有 buildSite 调用加 await                                               |
| `src/index.html`             | Hero 部署命令区改为 OS 切换 Tab + i18n 动态命令                           |
| `src/i18n/locales/en-US.js`  | 新增 deployCmdUnix/Win，deployHint 改为 "Run in your terminal"            |
| `src/i18n/locales/zh-CN.js`  | 新增 deployCmdUnix/Win（js-eyes.com URL），deployHint 改为 "在终端中运行" |
| `docs/index.html`            | 同步 src/ 的所有改动                                                      |
| `docs/i18n/locales/en-US.js` | 同步 src/                                                                 |
| `docs/i18n/locales/zh-CN.js` | 同步 src/                                                                 |

---

## 9. 经验总结

### 9.1 市场分发 ≠ 唯一分发

ClawHub 的 VirusTotal 集成本身是好事（安全第一），但对于使用 fetch/WebSocket 做本地自动化的合法项目来说，误报是不可避免的。**不应该让单一分发渠道的安全策略成为项目推广的瓶颈**。提供自主安装脚本是解耦的正确做法。

### 9.2 curl 脚本是最轻量的安装基础设施

相比发 npm 包、建 Gitee 镜像、搞安装程序，一个 shell/PowerShell 脚本就能覆盖所有主流 OS。配合 GitHub Pages + Cloudflare，连 CDN 都不用额外花钱。

### 9.3 多源回退是国内场景的标配

不要假设用户能访问 GitHub。`js-eyes.com` → GitHub → jsDelivr 的回退链，10 秒超时快速切换，是成本最低的可靠方案。

### 9.4 i18n 不只是翻译文字

对于中国用户，i18n 的含义包括「换一个能访问的 URL」。落地页按语言显示不同的安装命令，让中文用户看到 `js-eyes.com`、英文用户看到 `github.com`，这才是真正的本地化。

### 9.5 Agent-First 意味着自主可控

整个改造的核心思路是：**项目自己掌控安装链路**。从脚本托管、下载源、到安装流程，都在项目控制范围内，不依赖任何第三方市场的审核策略。这就是 Agent-First 的含义——让 Agent 生态中的工具能独立、可靠地到达用户手中。
