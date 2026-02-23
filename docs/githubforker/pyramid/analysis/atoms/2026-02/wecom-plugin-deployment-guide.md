# OpenClaw WeCom 插件部署指南

> 来源：[../../../../journal/2026-02-08/wecom-plugin-deployment-guide.md](../../../../journal/2026-02-08/wecom-plugin-deployment-guide.md)
> 缩写：WP

## Atoms

| 编号  | 类型 | 内容                                                                                                            | 原文定位                  |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------- | ------------------------- |
| WP-01 | 事实 | OpenClaw-Wechat (`@openclaw/wecom`) 是企业微信渠道插件，支持 AES-256-CBC 加密、多账号、内置命令及长消息自动分片 | 插件概述                  |
| WP-02 | 事实 | 插件加载优先级：配置路径 > Workspace 扩展 > 全局扩展 > 内置扩展                                                 | 部署方式                  |
| WP-03 | 步骤 | 方式 1（开发）：配置 `plugins.load.paths` 指向本地项目目录，无需安装                                            | 方式 1：本地路径加载      |
| WP-04 | 步骤 | 方式 2（贡献）：复制插件到 `<repo>/extensions/wecom` 并运行 `pnpm install`                                      | 方式 2：集成到 extensions |
| WP-05 | 步骤 | 方式 3（生产）：维护者 `npm publish`，用户 `openclaw plugins install @openclaw/wecom`                           | 方式 3：npm 包安装        |
| WP-06 | 步骤 | 企业微信配置六步：创建应用、获取 CorpID、配置回调 URL、**配置企业可信 IP**、配置域名、设置可见范围              | 企业微信配置              |
| WP-07 | 经验 | 错误 60020 因服务器公网出口 IP 不在可信列表；收消息不受限，但**发消息调用 API 需校验来源 IP**                   | 4. 配置企业可信 IP        |
| WP-08 | 事实 | 回调协议分两阶段：GET 验证（解密 echostr 原样返回）和 POST 消息（**5 秒内返回 200**，先 ACK 后异步处理）        | 回调 API 协议详解         |
| WP-09 | 事实 | 加解密算法：AES-256-CBC，Key 为 Base64(AESKey)，IV 取前 16 字节，签名 SHA1(sort([token,ts,nonce,encrypt]))      | 加解密方案                |
| WP-10 | 判断 | 公网方案选择：开发用内网穿透 (ngrok)，生产用反向代理 (Nginx/Caddy) 或 Cloudflare Tunnel 自动部署                | 方案选择建议              |
| WP-11 | 步骤 | Cloudflare Tunnel 自动化：需安装 cloudflared，创建含 `Tunnel:Edit` 和 `DNS:Edit` 权限的 API Token               | 方案 D 前置条件           |
| WP-12 | 经验 | Tunnel 安全特性：Ingress 仅暴露 `/wecom/callback` (其他 403)，cloudflared 崩溃自动指数退避重启                  | 方案 D 安全特性           |
| WP-13 | 事实 | 配置优先级：`channels.wecom` 主配置 > `accounts` 多账号 > `env.vars` > `process.env`                            | 配置优先级                |
| WP-14 | 经验 | 消息重复推送因 5 秒内未返回 200；插件采用"先 ACK 再处理"策略，若仍重复需检查网络延迟或代理超时                  | 常见问题：重复推送        |
| WP-15 | 步骤 | 验证部署四步：查日志确认 config loaded、curl 测试 GET echostr、企微发消息测收发、测试 `/help` 等命令            | 验证部署                  |
