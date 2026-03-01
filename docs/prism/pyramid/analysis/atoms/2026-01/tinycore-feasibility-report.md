# Tiny Core Linux 部署可行性报告

> 来源：[../../../../journal/2026-01-31/tinycore-feasibility-report.md](../../../../journal/2026-01-31/tinycore-feasibility-report.md)
> 缩写：TC

## Atoms

| 编号  | 类型 | 内容                                                                                                                        | 原文定位                  |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| TC-01 | 事实 | Tiny Core Linux 是高度模块化的极简发行版，2008 年由 Robert Shingledecker 创建，核心理念是"游牧式"超小型图形桌面             | 1.1 项目背景              |
| TC-02 | 事实 | 版本变体三种：Core(17MB 仅 CLI)、TinyCore(23MB 含 GUI)、CorePlus(248MB 安装镜像含多种窗口管理器)                            | 1.2 版本变体              |
| TC-03 | 事实 | 支持平台包括 x86、x86-64、ARM v7、Raspberry Pi，另有 dCore 变体基于 Debian/Ubuntu 仓库                                      | 1.3 支持平台              |
| TC-04 | 事实 | 硬件最低要求：Core 需 46MB 内存/11MB 存储，TinyCore 需 64MB 内存/23MB 存储，处理器 i486DX+                                  | 2.1 硬件最低要求          |
| TC-05 | 判断 | OpenClaw 部署 Tiny Core 的五项对比：Node.js 22+ 需手动安装、内存需评估、网络支持、持久化需配置、无 systemd                  | 2.2 OpenClaw 项目需求对比 |
| TC-06 | 事实 | 三种运行模式：默认模式(全加载 RAM 无持久化)、挂载模式 Mount Mode(推荐)、复制模式 Copy Mode(兼顾速度与持久)                  | 3.1 运行模式              |
| TC-07 | 经验 | 默认模式不适合 OpenClaw 因无持久化，挂载模式可用于 OpenClaw，复制模式取决于内存容量                                         | 3.1 运行模式评估          |
| TC-08 | 步骤 | 包管理命令：`tce-load -wi` 下载并安装到 onboot 列表，`tce-load -w` 仅下载，`tce-load -i` 加载已下载扩展                     | 3.2 包管理系统            |
| TC-09 | 事实 | Tiny Core 不使用 systemd，采用 BusyBox init + BSD 风格启动脚本，用户自定义脚本位于 `/opt/bootlocal.sh`                      | 3.3 服务/进程管理         |
| TC-10 | 事实 | 持久化机制通过 boot codes 配置：tce=指定扩展存储、home=持久化/home、opt=持久化/opt、restore=备份恢复位置                    | 3.4 持久化机制            |
| TC-11 | 经验 | Node.js 官方扩展版本可能过时，社区存在 tiny-node 项目，编译安装需 compiletc 工具链                                          | 4.1 Node.js 支持情况      |
| TC-12 | 步骤 | 编译 Node.js 流程：加载 compiletc/git/curl/make/python/openssl-dev → git clone → ./configure → make → make install          | 4.1 Node.js 支持情况      |
| TC-13 | 判断 | 四大挑战：Node.js 版本(高概率高影响，建议 dCore 或源码编译)、服务管理、持久化配置、依赖管理需原生编译                       | 5.1 主要挑战              |
| TC-14 | 判断 | 综合评估评分：技术可行性 3/5、开发效率 2/5、运维复杂度 4/5、稳定性 3/5、社区支持 2/5                                        | 7.1 综合评估              |
| TC-15 | 判断 | 推荐场景：嵌入式/IoT 设备、资源极度受限环境(<256MB RAM)、只读/安全要求高 kiosk、教育学习目的                                | 7.2 推荐场景              |
| TC-16 | 判断 | 不推荐场景：生产环境主力服务器、快速迭代开发环境、企业级部署、需要完整监控/日志的场景                                       | 7.2 不推荐场景            |
| TC-17 | 判断 | 替代方案推荐：Alpine Linux(~5MB musl libc)、Debian Minimal(~150MB)、Void Linux(~50MB runit)、Arch Linux                     | 7.3 替代方案推荐          |
| TC-18 | 判断 | 渠道精简建议：保留 Telegram(grammy 轻量)、可选 WhatsApp Web、移除 Discord/Slack/Signal/iMessage/LINE                        | 9.1.1 渠道精简            |
| TC-19 | 判断 | 依赖裁剪：必须保留 commander/dotenv/express/ws/zod/grammy/baileys/tslog，条件移除 sharp/playwright/sqlite-vec 等            | 9.1.2 依赖裁剪            |
| TC-20 | 判断 | 模块选择：保留 cli/config/gateway/infra/telegram/auto-reply/routing/channels/utils，移除 agents/browser/canvas 等 25 个模块 | 9.1.3 模块选择矩阵        |
| TC-21 | 经验 | 构建策略推荐预编译打包方案：开发机裁剪依赖→build→pnpm install --production→打包 dist+node_modules                           | 9.2 方案 A 预编译打包     |
| TC-22 | 判断 | 单文件 Bundle 方案(esbuild/rolldown)体积最小但原生模块无法 bundle，源码部署在 Tiny Core 上不推荐                            | 9.2 方案 B/C              |
| TC-23 | 判断 | 基础镜像推荐 Core Pure 64(x86_64 现代 Node.js 兼容好)或 dCore x86_64(可用 Debian 仓库)                                      | 9.3.1 基础镜像选择        |
| TC-24 | 步骤 | 必需 TCZ 扩展：ca-certificates(HTTPS 证书)、openssl(加密库)、nodejs(或预编译二进制)                                         | 9.3.2 必需的 TCZ 扩展     |
| TC-25 | 事实 | 目录结构规划：/opt/node(Node.js 运行时)、/opt/openclaw(应用)、/home/tc/.openclaw(用户配置数据)                              | 9.3.3 目录结构规划        |
| TC-26 | 步骤 | 启动脚本/opt/bootlocal.sh 配置：设置 PATH/NODE_ENV/HOME→等待网络→启动网关→后台运行并记录日志                                | 9.3.5 启动脚本            |
| TC-27 | 经验 | Remaster 定制 ISO 流程：安装扩展→配置 onboot.lst→部署 OpenClaw→创建 bootlocal.sh→配置 filetool.lst→ezremaster 打包          | 9.4 Remaster 流程         |
| TC-28 | 事实 | 预期 Remaster 结果：ISO 大小 50-80MB、启动时间<30 秒、内存占用 150-200MB                                                    | 9.4 Remaster 流程         |
| TC-29 | 判断 | 关键决策点：消息渠道选 Telegram、Node.js 来源预编译二进制、打包方式预编译 tar 包、移除本地 LLM 和 sharp                     | 9.7 关键决策点总结        |
| TC-30 | 事实 | 预估对比：完整版 OpenClaw 约 500MB+/512MB+ 内存，Tiny Core 最小版约 80-150MB/128-256MB 内存，支持渠道 1-2 个                | 9.6 预估对比              |
