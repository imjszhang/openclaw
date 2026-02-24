# G31: WeCom 插件部署需解决“公网 IP 可信校验”与"5 秒回调响应”两大核心挑战，采用先 ACK 后异步处理策略保障消息可靠送达

> 企业微信的严格安全策略要求部署者必须配置可信 IP 并优化回调链路，任何网络延迟或配置缺失都会导致消息重复或发送失败。

## 包含的 Atoms

| 编号  | 来源                          | 内容摘要                                                                                                        |
| ----- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| WP-01 | wecom-plugin-deployment-guide | OpenClaw-Wechat (`@openclaw/wecom`) 是企业微信渠道插件，支持 AES-256-CBC 加密、多账号、内置命令及长消息自动分片 |
| WP-02 | wecom-plugin-deployment-guide | 插件加载优先级：配置路径 > Workspace 扩展 > 全局扩展 > 内置扩展                                                 |
| WP-03 | wecom-plugin-deployment-guide | 方式 1（开发）：配置 `plugins.load.paths` 指向本地项目目录，无需安装                                            |
| WP-04 | wecom-plugin-deployment-guide | 方式 2（贡献）：复制插件到 `<repo>/extensions/wecom` 并运行 `pnpm install`                                      |
| WP-05 | wecom-plugin-deployment-guide | 方式 3（生产）：维护者 `npm publish`，用户 `openclaw plugins install @openclaw/wecom`                           |
| WP-06 | wecom-plugin-deployment-guide | 企业微信配置六步：创建应用、获取 CorpID、配置回调 URL、**配置企业可信 IP**、配置域名、设置可见范围              |
| WP-07 | wecom-plugin-deployment-guide | 错误 60020 因服务器公网出口 IP 不在可信列表；收消息不受限，但**发消息调用 API 需校验来源 IP**                   |
| WP-08 | wecom-plugin-deployment-guide | 回调协议分两阶段：GET 验证（解密 echostr 原样返回）和 POST 消息（**5 秒内返回 200**，先 ACK 后异步处理）        |
| WP-09 | wecom-plugin-deployment-guide | 加解密算法：AES-256-CBC，Key 为 Base64(AESKey)，IV 取前 16 字节，签名 SHA1(sort([token,ts,nonce,encrypt]))      |
| WP-10 | wecom-plugin-deployment-guide | 公网方案选择：开发用内网穿透 (ngrok)，生产用反向代理 (Nginx/Caddy) 或 Cloudflare Tunnel 自动部署                |
| WP-11 | wecom-plugin-deployment-guide | Cloudflare Tunnel 自动化：需安装 cloudflared，创建含 `Tunnel:Edit` 和 `DNS:Edit` 权限的 API Token               |
| WP-12 | wecom-plugin-deployment-guide | Tunnel 安全特性：Ingress 仅暴露 `/wecom/callback` (其他 403)，cloudflared 崩溃自动指数退避重启                  |
| WP-13 | wecom-plugin-deployment-guide | 配置优先级：`channels.wecom` 主配置 > `accounts` 多账号 > `env.vars` > `process.env`                            |
| WP-14 | wecom-plugin-deployment-guide | 消息重复推送因 5 秒内未返回 200；插件采用"先 ACK 再处理"策略，若仍重复需检查网络延迟或代理超时                  |
| WP-15 | wecom-plugin-deployment-guide | 验证部署四步：查日志确认 config loaded、curl 测试 GET echostr、企微发消息测收发、测试 `/help` 等命令            |

## 组内逻辑顺序

逻辑顺序为插件概述与加载（WP-01~05）→ 企业微信配置与加密（WP-06~09）→ 公网部署方案（WP-10~12）→ 配置优先级与故障排查（WP-13~15）。
