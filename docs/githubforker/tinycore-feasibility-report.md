# Tiny Core Linux 部署可行性报告

## 概述

本报告对 Tiny Core Linux 操作系统进行深度调研，评估将 OpenClaw 项目部署到该系统的可行性。

**调研日期**: 2026年1月31日  
**OpenClaw 版本**: 2026.1.29  
**目标系统**: Tiny Core Linux 16.2 (最新稳定版)  
**官方网站**: http://tinycorelinux.net/

---

## 1. Tiny Core Linux 简介

### 1.1 项目背景

Tiny Core Linux 是一个高度模块化的极简 Linux 发行版，由 Robert Shingledecker 于 2008 年创建。其核心理念是提供一个"游牧式"的超小型图形桌面操作系统，能够从 CD-ROM、U盘或硬盘以 Frugal 方式启动。

### 1.2 版本变体

| 变体 | 大小 | 描述 |
|------|------|------|
| **Core** | 17 MB | 仅命令行界面，适合服务器/设备/自定义桌面 |
| **TinyCore** | 23 MB | Core + X/GUI (FLTK/FLWM 桌面环境) |
| **CorePlus** | 248 MB | 安装镜像，含多种窗口管理器、无线支持、非US键盘等 |

### 1.3 支持平台

- x86 (32位)
- x86-64 (64位纯净版)
- ARM v7 (armhf)
- Raspberry Pi (32位 / 64位 aarch64)
- dCore 变体 (基于 Debian/Ubuntu 仓库)

---

## 2. 系统需求分析

### 2.1 硬件最低要求

| 组件 | Core (CLI) | TinyCore (GUI) |
|------|------------|----------------|
| 处理器 | i486DX+ | i486DX+ |
| 内存 | 46 MB | 64 MB (推荐) |
| 存储 | 11 MB | 23 MB |
| 显示 | 无 | VGA 兼容 |

### 2.2 OpenClaw 项目需求对比

| 需求项 | OpenClaw 要求 | Tiny Core 支持情况 |
|--------|---------------|-------------------|
| Node.js | 22+ | ⚠️ 需手动编译/安装扩展 |
| 内存 | 1GB+ (最小), 2GB+ (推荐) | ⚠️ 需评估 |
| 网络 | 必需 | ✅ 支持 (有线优先) |
| 持久存储 | 必需 | ⚠️ 需配置 |
| 服务管理 | systemd/init | ❌ 仅 BusyBox init |

---

## 3. 核心特性分析

### 3.1 运行模式

Tiny Core 提供三种主要运行模式：

#### 3.1.1 默认模式 (Cloud/Internet)
```
特点：
- 系统完全加载到 RAM
- 应用仅存在于当前会话
- 重启后扩展丢失
- 启动极快
```
**评估**: ❌ 不适合 OpenClaw (无持久化)

#### 3.1.2 挂载模式 (Mount Mode) - 推荐
```
特点：
- 应用存储在 tce/ 目录
- 启动时挂载扩展
- 节省 RAM
- 支持 ext2/ext3/ext4/vfat 分区
```
**评估**: ✅ 可用于 OpenClaw

#### 3.1.3 复制模式 (Copy Mode)
```
特点：
- 扩展复制到 RAM
- 兼具 RAM 速度和持久性
- 启动时间较长
```
**评估**: ⚠️ 可选，取决于内存容量

### 3.2 包管理系统

Tiny Core 使用 `.tcz` (压缩 squashfs) 格式的扩展包：

```bash
# 搜索扩展
tce-ab                    # 图形化 AppBrowser

# 命令行安装
tce-load -wi <package>    # 下载并安装到 onboot 列表
tce-load -w <package>     # 仅下载
tce-load -i <package>     # 加载已下载的扩展

# 更新扩展
tce-update               # 批量更新
```

**重要限制**:
- 初始安装几乎总是需要互联网连接
- 扩展仓库可能不包含最新版本的软件
- 某些软件可能需要自行编译打包

### 3.3 服务/进程管理

Tiny Core **不使用 systemd**，而是采用 BusyBox init + BSD 风格的启动脚本：

```bash
# 启动脚本位置
/opt/bootlocal.sh        # 用户自定义启动脚本
/opt/shutdown.sh         # 关机脚本

# 系统初始化脚本
/etc/init.d/tc-config    # 核心配置脚本
```

**服务管理方法**:
```bash
# 在 /opt/bootlocal.sh 中添加
/path/to/your/service &

# 或使用 cron 扩展实现定时任务
```

### 3.4 持久化机制

```bash
# 备份/恢复配置
/opt/.filetool.lst       # 列出需备份的文件/目录
/opt/xfiletool.lst       # 排除文件列表
mydata.tgz               # 备份压缩包

# Boot codes 设置持久化
tce=sda1                 # 扩展存储位置
home=sda1                # 持久化 /home
opt=sda1                 # 持久化 /opt
restore=sda1             # 备份恢复位置
```

---

## 4. 软件生态评估

### 4.1 Node.js 支持情况

| 状态 | 说明 |
|------|------|
| 官方扩展 | ⚠️ 版本可能过时 |
| 社区项目 | 存在 tiny-node 等项目 |
| 编译安装 | 需要 compiletc 工具链 |

**安装 Node.js 的典型流程**:
```bash
# 加载编译工具
tce-load -wi compiletc git curl make python openssl-dev

# 从源码编译 (耗时较长)
git clone https://github.com/nodejs/node.git
cd node
./configure
make -j$(nproc)
sudo make install
```

### 4.2 Python 支持

```bash
# 安装 Python
tce-load -wi python3.11
tce-load -wi python3.11-setuptools

# pip 可能需要额外配置
```

### 4.3 其他开发工具

| 工具 | 可用性 | 备注 |
|------|--------|------|
| Git | ✅ | `git.tcz` |
| curl/wget | ✅ | 内置或扩展 |
| OpenSSL | ✅ | `openssl.tcz` |
| GCC/Make | ✅ | `compiletc.tcz` |
| Docker | ⚠️ | 需要额外配置 |

---

## 5. 部署 OpenClaw 的技术挑战

### 5.1 主要挑战

#### 挑战 1: Node.js 版本
```
问题: OpenClaw 需要 Node.js 22+，Tiny Core 官方仓库版本可能落后
解决方案:
  1. 使用 dCore (基于 Debian/Ubuntu 仓库)
  2. 从源码编译 Node.js
  3. 使用 nvm 管理 Node 版本
```

#### 挑战 2: 服务管理
```
问题: 无 systemd，缺少 systemctl/journalctl
解决方案:
  1. 使用 /opt/bootlocal.sh 启动服务
  2. 编写自定义 init 脚本
  3. 使用 supervisord 扩展 (如可用)
```

#### 挑战 3: 持久化配置
```
问题: 默认模式下重启丢失所有更改
解决方案:
  1. 配置 tce= 和 home= boot codes
  2. 将 ~/.openclaw 加入备份列表
  3. 使用持久化存储分区
```

#### 挑战 4: 依赖管理
```
问题: npm 依赖可能需要原生编译
解决方案:
  1. 预装 compiletc 工具链
  2. 确保 openssl-dev, python 等构建依赖可用
  3. 考虑使用预编译的 pnpm 缓存
```

### 5.2 风险评估矩阵

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Node.js 版本不兼容 | 高 | 高 | 使用 dCore 或源码编译 |
| 内存不足 | 中 | 高 | 使用 Mount 模式节省 RAM |
| 网络驱动缺失 | 中 | 高 | 使用 CorePlus + firmware |
| 扩展依赖冲突 | 低 | 中 | 仔细测试依赖链 |
| 持久化配置丢失 | 中 | 高 | 自动备份 + 验证 |

---

## 6. 推荐部署方案

### 6.1 方案 A: 使用 dCore (推荐)

dCore 是 Tiny Core 的变体，可以访问 Debian/Ubuntu 软件仓库：

```bash
# 优势
- 可使用 apt 安装现代版本的 Node.js
- 更丰富的软件生态
- 保持 Tiny Core 的轻量特性

# 下载
http://tinycorelinux.net/dCore/x86_64/
```

### 6.2 方案 B: Core + 自定义扩展

```bash
# 步骤概览
1. 安装 Core (17MB) 到 USB/硬盘
2. 配置持久化存储
3. 编译安装 Node.js 22
4. 创建自定义 openclaw.tcz 扩展
5. 配置 bootlocal.sh 自动启动

# bootlocal.sh 示例
#!/bin/sh
export PATH=/opt/node/bin:$PATH
cd /home/tc/openclaw
/opt/node/bin/node dist/openclaw.js gateway run &
```

### 6.3 方案 C: Docker 容器化

在主机上运行 Tiny Core，OpenClaw 在 Docker 容器中运行：

```bash
# 优势
- 隔离运行环境
- 可使用标准 Node.js 镜像
- 更新/回滚更简单

# 挑战
- Docker 在 Tiny Core 上配置复杂
- 增加系统复杂度
```

---

## 7. 可行性结论

### 7.1 综合评估

| 评估维度 | 评分 (1-5) | 说明 |
|----------|------------|------|
| 技术可行性 | 3/5 | 可行但需大量自定义工作 |
| 开发效率 | 2/5 | 工具链不完善，调试困难 |
| 运维复杂度 | 4/5 | 系统简单但缺少现代管理工具 |
| 稳定性 | 3/5 | 依赖自定义配置的可靠性 |
| 社区支持 | 2/5 | 社区较小，文档有限 |

### 7.2 最终建议

#### ✅ 推荐场景
- 嵌入式/IoT 设备部署
- 资源极度受限的环境 (< 256MB RAM)
- 只读/安全要求高的 kiosk 场景
- 教育/学习目的

#### ❌ 不推荐场景
- 生产环境主力服务器
- 需要快速迭代的开发环境
- 企业级部署
- 需要完整监控/日志的场景

### 7.3 替代方案推荐

如果 Tiny Core 不能满足需求，建议考虑：

| 发行版 | 特点 | 适用场景 |
|--------|------|----------|
| **Alpine Linux** | ~5MB，musl libc，apk 包管理 | 容器/服务器 |
| **Debian Minimal** | ~150MB，完整 apt 生态 | 服务器 |
| **Void Linux** | ~50MB，runit init，现代软件 | 桌面/服务器 |
| **Arch Linux** | 滚动更新，最新软件 | 开发环境 |

---

## 8. 部署清单 (如决定采用)

### 8.1 前置准备
- [ ] 下载 dCore x86_64 或 Core Pure 64
- [ ] 准备持久化存储介质 (USB/SSD)
- [ ] 确认目标硬件网络兼容性

### 8.2 基础配置
- [ ] 配置 boot codes (tce=, home=, opt=)
- [ ] 安装 compiletc 工具链
- [ ] 配置网络 (DHCP 或静态 IP)

### 8.3 Node.js 环境
- [ ] 编译安装 Node.js 22
- [ ] 配置 PATH 环境变量
- [ ] 安装 pnpm

### 8.4 OpenClaw 部署
- [ ] 克隆/复制 OpenClaw 代码
- [ ] 运行 pnpm install
- [ ] 配置 ~/.openclaw
- [ ] 添加到 /opt/.filetool.lst
- [ ] 配置 bootlocal.sh 自动启动

### 8.5 验证测试
- [ ] 重启后验证服务自动启动
- [ ] 测试网关功能
- [ ] 验证持久化配置

---

## 9. OpenClaw 最小版集成方案

基于上述可行性分析，本节提供将 OpenClaw 精简集成到 Tiny Core 的具体思路。

### 9.1 第一阶段：功能裁剪

#### 9.1.1 渠道精简

当前项目支持 13+ 消息渠道（内置 8 个 + 扩展 5+ 个），需要选择 1-2 个核心渠道：

| 渠道 | 建议 | 理由 |
|------|------|------|
| **Telegram** | ✅ 推荐保留 | grammy 库较轻量，依赖少 |
| **WhatsApp Web** | ⚠️ 可选 | Baileys 功能完整但依赖较多 |
| Discord | ❌ 移除 | Carbon 框架较重 |
| Slack | ❌ 移除 | 企业级功能，依赖复杂 |
| Signal | ❌ 移除 | 需要额外的 signal-cli |
| iMessage | ❌ 移除 | 仅 macOS 可用 |
| LINE | ❌ 移除 | 非核心渠道 |

#### 9.1.2 依赖裁剪

**当前依赖分析** (package.json 约 50+ 依赖):

```
必须保留:
├── commander          # CLI 框架
├── dotenv             # 环境变量
├── express/hono       # HTTP 服务器
├── ws                 # WebSocket
├── zod                # 数据校验
├── grammy             # Telegram (如保留)
├── @whiskeysockets/baileys  # WhatsApp (如保留)
└── tslog              # 日志

条件移除 (根据功能需求):
├── @napi-rs/canvas    # 图像处理 (可选)
├── node-llama-cpp     # 本地 LLM (重依赖)
├── playwright-core    # 浏览器自动化
├── sharp              # 图片处理 (原生模块)
├── pdfjs-dist         # PDF 解析
├── sqlite-vec         # 向量数据库
├── @slack/bolt        # Slack 专用
└── @buape/carbon      # Discord 专用
```

#### 9.1.3 模块选择矩阵

```
最小保留 (~15 个模块):
├── src/cli/           # CLI 入口 (精简核心命令)
├── src/config/        # 配置管理
├── src/gateway/       # 网关核心
├── src/infra/         # 基础设施 (HTTP/日志/存储)
├── src/telegram/      # 单一渠道 (或 src/web/ for WhatsApp)
├── src/auto-reply/    # 自动回复核心
├── src/routing/       # 消息路由
├── src/channels/      # 渠道抽象层
└── src/utils/         # 工具函数

可移除 (~25 个模块):
├── src/agents/        # 完整 Agent 系统 (436 文件，最重)
├── src/browser/       # 浏览器控制
├── src/canvas-host/   # 画布/A2UI 功能
├── src/discord/       # Discord 渠道
├── src/slack/         # Slack 渠道
├── src/signal/        # Signal 渠道
├── src/imessage/      # iMessage 渠道
├── src/line/          # LINE 渠道
├── src/media-understanding/  # 媒体理解 (依赖重)
├── src/memory/        # 向量记忆系统
├── src/tui/           # 终端 UI
├── src/hooks/         # 钩子系统
├── src/plugins/       # 插件系统
└── extensions/        # 所有扩展插件
```

### 9.2 第二阶段：构建策略

#### 方案 A: 预编译打包 (推荐)

```
工作流:
┌─────────────────────────────────────────────────────────┐
│  开发机 (完整环境)                                        │
│  ├── 1. 裁剪 package.json 依赖                           │
│  ├── 2. 修改 tsconfig 排除不需要的模块                    │
│  ├── 3. pnpm build (TypeScript → JavaScript)            │
│  ├── 4. pnpm install --production                       │
│  └── 5. 打包 dist/ + node_modules/ → openclaw-mini.tar  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Tiny Core                                              │
│  ├── 解压 openclaw-mini.tar 到 /opt/openclaw            │
│  └── 仅需 Node.js 运行时                                 │
└─────────────────────────────────────────────────────────┘

优势:
- 无需在 Tiny Core 上编译
- 可控的依赖版本
- 部署简单快速

挑战:
- 原生模块需匹配目标架构 (x86_64)
- 需要 glibc 兼容 (Tiny Core 使用 glibc)
```

#### 方案 B: 单文件 Bundle (esbuild/rolldown)

```
工作流:
┌─────────────────────────────────────────────────────────┐
│  使用 rolldown (项目已有) 或 esbuild                      │
│  ├── 入口: src/cli/index.ts                             │
│  ├── Tree-shaking 移除未使用代码                         │
│  ├── 内联所有 JS 依赖                                    │
│  └── 输出: openclaw-bundle.mjs (~2-5MB)                 │
└─────────────────────────────────────────────────────────┘

优势:
- 极小体积，无 node_modules
- 启动更快
- 部署最简单

挑战:
- 原生模块 (sharp, better-sqlite3) 无法 bundle
- 需要外部处理原生依赖
- 动态 require/import 可能失效
```

#### 方案 C: 源码部署 (不推荐)

```
在 Tiny Core 上:
├── 安装 compiletc, git, python, openssl-dev
├── 编译 Node.js 22 (耗时 30+ 分钟)
├── git clone 项目
├── pnpm install (可能失败于原生模块)
└── pnpm build

问题:
- 编译环境占用大量存储 (500MB+)
- 编译耗时长
- 原生模块编译可能失败
- 不符合 Tiny Core 精简理念
```

### 9.3 第三阶段：Tiny Core 定制

#### 9.3.1 基础镜像选择

| 选项 | 推荐度 | 说明 |
|------|--------|------|
| **Core Pure 64** | ⭐⭐⭐ | x86_64，现代 Node.js 兼容性好 |
| dCore x86_64 | ⭐⭐⭐ | 可用 Debian 仓库，Node.js 安装最简单 |
| Core (x86) | ⭐ | 32位，Node.js 22 可能不支持 |

#### 9.3.2 必需的 TCZ 扩展

```bash
# 核心运行时
tce-load -wi ca-certificates    # HTTPS 证书
tce-load -wi openssl            # 加密库

# Node.js (选择其一)
# 方式1: 使用社区编译的扩展 (如有)
tce-load -wi nodejs

# 方式2: 预编译 Node.js 二进制
# 从 nodejs.org 下载 linux-x64 版本，解压到 /opt/node

# 如果保留 sharp (图片处理)
tce-load -wi vips               # libvips (如有)
# 或移除 sharp 依赖，使用纯 JS 方案
```

#### 9.3.3 目录结构规划

```
/opt/
├── node/                    # Node.js 运行时
│   └── bin/node
├── openclaw/                # 应用目录
│   ├── dist/                # 编译后的 JS
│   ├── node_modules/        # 生产依赖
│   └── openclaw.mjs         # 入口
└── bootlocal.sh             # 启动脚本

/home/tc/
└── .openclaw/               # 用户配置/数据
    ├── config.yaml
    ├── sessions/
    └── credentials/
```

#### 9.3.4 持久化配置

```bash
# /opt/.filetool.lst - 备份列表
opt/openclaw
home/tc/.openclaw

# Boot codes (grub/syslinux 配置)
tce=sda1 home=sda1 opt=sda1 waitusb=5
```

#### 9.3.5 启动脚本

```bash
# /opt/bootlocal.sh
#!/bin/sh

# 设置环境
export PATH=/opt/node/bin:$PATH
export NODE_ENV=production
export HOME=/home/tc

# 等待网络就绪
sleep 3

# 启动 OpenClaw 网关
cd /opt/openclaw
/opt/node/bin/node openclaw.mjs gateway run \
  --bind 0.0.0.0 \
  --port 18789 \
  >> /var/log/openclaw.log 2>&1 &

echo "OpenClaw gateway started (PID: $!)"
```

### 9.4 第四阶段：Remaster 定制 ISO

#### 9.4.1 目标

创建开箱即用的 Tiny Core + OpenClaw 镜像，用户无需任何配置。

#### 9.4.2 Remaster 流程

```
步骤:
1. 启动基础 Core Pure 64 (Live CD/USB)
2. 安装所有必需扩展到 tce/optional/
3. 配置 onboot.lst 列出启动时加载的扩展
4. 部署预编译的 OpenClaw 到 /opt/openclaw
5. 创建 /opt/bootlocal.sh 启动脚本
6. 配置 /opt/.filetool.lst 持久化列表
7. 使用 ezremaster.tcz 工具打包新 ISO
8. 测试新 ISO 启动和功能

预期结果:
- ISO 大小: ~50-80MB
- 启动时间: < 30 秒
- 内存占用: ~150-200MB
```

#### 9.4.3 ezremaster 使用要点

```bash
# 安装 remaster 工具
tce-load -wi ezremaster

# 准备工作目录
mkdir -p /tmp/remaster/{extract,newiso}

# 提取原始 ISO
# ... (按 ezremaster GUI 指引操作)

# 添加自定义文件
cp -r /opt/openclaw /tmp/remaster/extract/opt/
cp /opt/bootlocal.sh /tmp/remaster/extract/opt/

# 生成新 ISO
# ... (ezremaster GUI 完成)
```

### 9.5 第五阶段：验证清单

#### 9.5.1 功能验证

| 测试项 | 预期结果 | 状态 |
|--------|----------|------|
| 系统启动时间 | < 30 秒 | [ ] |
| 内存占用 | < 256MB | [ ] |
| 网关启动 | 自动启动，无错误 | [ ] |
| Telegram 连接 | Bot 正常响应 | [ ] |
| 自动回复 | 收到消息后自动回复 | [ ] |
| 配置持久化 | 重启后配置保留 | [ ] |
| 日志输出 | /var/log/openclaw.log 可读 | [ ] |

#### 9.5.2 边界测试

| 测试项 | 方法 | 预期 |
|--------|------|------|
| 网络断开重连 | 拔网线 → 插回 | 自动重连 |
| 长时间运行 | 运行 24h+ | 无内存泄漏 |
| 磁盘空间不足 | 填满 /tmp | 优雅降级/告警 |
| 配置错误 | 损坏 config.yaml | 启动失败提示清晰 |

### 9.6 预估对比

| 指标 | 完整版 OpenClaw | Tiny Core 最小版 |
|------|-----------------|------------------|
| 安装体积 | ~500MB+ | ~80-150MB |
| 运行内存 | 512MB+ | 128-256MB |
| npm 依赖数 | 50+ | 15-20 |
| 支持渠道 | 13+ | 1-2 |
| Agent 功能 | 完整 | 无/基础 |
| 媒体处理 | 完整 | 文本为主 |
| 启动时间 | 数秒 | 数秒 |
| 目标场景 | 通用 | 嵌入式/IoT/边缘 |

### 9.7 关键决策点总结

| 决策项 | 推荐选择 | 替代方案 |
|--------|----------|----------|
| 消息渠道 | Telegram | WhatsApp Web |
| Node.js 来源 | 预编译二进制 | dCore apt 安装 |
| 打包方式 | 预编译 tar 包 | 单文件 bundle |
| LLM 支持 | 移除本地 LLM | 仅保留 API 调用 |
| 图片处理 | 移除 sharp | 保留但增加体积 |
| 持久化 | Mount Mode | Copy Mode (高内存) |

---

## 参考资源

- 官方网站: http://tinycorelinux.net/
- 官方 Wiki: http://wiki.tinycorelinux.net/
- 论坛: http://forum.tinycorelinux.net/
- GitHub: http://git.tinycorelinux.net
- 官方文档 (Book): http://tinycorelinux.net/book.html
- IRC: #tinycorelinux @ Freenode

---

*报告编写: 2026年1月31日*
