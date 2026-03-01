# OpenClaw WeCom 插件部署指南

> 更新时间：2026-02-08

本文档介绍如何将 OpenClaw-Wechat（企业微信渠道插件）部署到 OpenClaw，涵盖三种部署方式及完整的配置说明。

## 目录

- [插件概述](#插件概述)
- [前置条件](#前置条件)
- [部署方式](#部署方式)
  - [方式 1：本地路径加载（开发推荐）](#方式-1本地路径加载开发推荐)
  - [方式 2：集成到 extensions 目录（贡献上游）](#方式-2集成到-extensions-目录贡献上游)
  - [方式 3：npm 包安装（生产推荐）](#方式-3npm-包安装生产推荐)
- [企业微信配置](#企业微信配置)
- [回调 API 协议详解](#回调-api-协议详解)
  - [工作原理](#工作原理)
  - [阶段 1：URL 验证（GET）](#阶段-1url-验证get)
  - [阶段 2：消息接收（POST）](#阶段-2消息接收post)
  - [加解密方案](#加解密方案)
- [回调 URL 公网部署方案](#回调-url-公网部署方案)
  - [方案 D：Cloudflare Tunnel 自动部署（推荐）](#方案-dcloudflare-tunnel-自动部署推荐)
- [OpenClaw 配置详解](#openclaw-配置详解)
- [验证部署](#验证部署)
- [常见问题](#常见问题)

---

## 插件概述

OpenClaw-Wechat（包名 `@openclaw/wecom`）是一个标准的 OpenClaw 渠道插件，用于将企业微信自建应用接入 OpenClaw AI 对话系统。主要功能包括：

- 通过企业微信自建应用收发消息（支持个人微信通过企业微信插件互通）
- 支持文本、图片、语音、视频、文件等多种消息类型
- AES-256-CBC 加解密和 SHA1 签名校验
- access_token 自动缓存与刷新
- 内置命令系统（`/help`、`/status`、`/clear`）
- Markdown 到企业微信纯文本的自动转换
- 长消息自动分片（2048 字节限制）
- API 调用频率限制
- 多账号支持

### 插件文件结构

```
OpenClaw-Wechat/
├── index.ts                  # 插件入口
├── openclaw.plugin.json      # 插件清单
├── package.json              # 包配置（含 openclaw 元数据）
├── README.md
├── CHANGELOG.md
├── .env.example
└── src/
    ├── accounts.ts           # 配置解析与多账号管理
    ├── channel.ts            # ChannelPlugin 接口实现
    ├── commands.ts           # 内置命令（/help, /status, /clear）
    ├── config-schema.ts      # Zod 配置校验
    ├── crypto.ts             # 加解密与签名验证
    ├── media.ts              # 媒体上传下载 & access_token 管理
    ├── monitor.ts            # Webhook 回调路由注册与处理
    ├── process.ts            # 入站消息处理与 AI 分发
    ├── rate-limiter.ts       # API 频率限制器
    ├── runtime.ts            # 运行时实例管理
    ├── send.ts               # 出站消息发送
    ├── text.ts               # 文本工具（Markdown 转换、分片）
    ├── types.ts              # TypeScript 类型定义
    └── tunnel/               # Cloudflare Tunnel 自动化
        ├── index.ts          # Tunnel Service 编排（start/stop 生命周期）
        ├── cloudflare-api.ts # Cloudflare REST API 封装
        ├── process.ts        # cloudflared 子进程管理
        ├── state.ts          # 隧道状态持久化
        └── detect.ts         # cloudflared 安装检测
```

---

## 前置条件

1. **OpenClaw** 已安装并可正常运行（`openclaw doctor` 通过）
2. **企业微信管理后台**已创建自建应用，并获取以下凭证：
   - 企业 ID（Corp ID）
   - 应用 AgentId
   - 应用 Secret
   - 回调 Token
   - 回调 EncodingAESKey
3. **公网回调地址**可达（企业微信回调需要公网 URL）

---

## 部署方式

OpenClaw 的插件加载按以下优先级发现：

1. **配置路径** — `plugins.load.paths`（方式 1）
2. **Workspace 扩展** — `<workspace>/.openclaw/extensions/`
3. **全局扩展** — `~/.openclaw/extensions/`（方式 3 安装后的位置）
4. **内置扩展** — `<openclaw>/extensions/*`（方式 2）

### 方式 1：本地路径加载（开发推荐）

直接从项目目录加载插件，无需复制或安装。适合开发调试。

#### 步骤

**1. 确认插件项目位置**

本例中插件位于：

```
~/.openclaw/workspace/projects/OpenClaw-Wechat
```

**2. 编辑 OpenClaw 配置文件**

打开 `~/.openclaw/openclaw.json`，添加以下配置：

```json
{
  "plugins": {
    "enabled": true,
    "load": {
      "paths": ["c:\\Users\\<用户名>\\.openclaw\\workspace\\projects\\OpenClaw-Wechat"]
    },
    "entries": {
      "wecom": {
        "enabled": true,
        "config": {}
      }
    }
  },
  "channels": {
    "wecom": {
      "corpId": "${WECOM_CORP_ID}",
      "corpSecret": "${WECOM_CORP_SECRET}",
      "agentId": "${WECOM_AGENT_ID}",
      "callbackToken": "${WECOM_CALLBACK_TOKEN}",
      "callbackAesKey": "${WECOM_CALLBACK_AES_KEY}",
      "webhookPath": "/wecom/callback"
    }
  }
}
```

> **说明**：`channels.wecom` 中的值使用 `${ENV_VAR}` 语法引用环境变量，也可以直接填写明文值。

**3. 配置环境变量**

在 `~/.openclaw/.env` 中添加企业微信凭证：

```env
WECOM_CORP_ID=你的企业ID
WECOM_AGENT_ID=你的应用AgentId
WECOM_CORP_SECRET=你的应用Secret
WECOM_CALLBACK_TOKEN=你的回调Token
WECOM_CALLBACK_AES_KEY=你的回调AESKey
```

**4. 重启 Gateway**

```bash
openclaw gateway restart
```

---

### 方式 2：集成到 extensions 目录（贡献上游）

将插件作为内置扩展放入 openclaw 仓库，适合提交 PR 到上游。

#### 步骤

**1. 复制插件到 extensions 目录**

```bash
cp -r ~/.openclaw/workspace/projects/OpenClaw-Wechat <openclaw-repo>/extensions/wecom
```

**2. 安装依赖**

由于 `pnpm-workspace.yaml` 已包含 `extensions/*`，只需运行：

```bash
cd <openclaw-repo>
pnpm install
```

pnpm 会自动识别新的 workspace 成员并解析依赖。

**3. 版本号对齐**（可选，提 PR 时建议）

将 `extensions/wecom/package.json` 中的 `version` 改为与主仓库一致：

```json
"version": "2026.2.6-3"
```

**4. 重启 Gateway**

```bash
openclaw gateway restart
```

> **注意**：内置扩展默认可能被禁用，需确保配置中未在 `plugins.deny` 列表里排除 `wecom`。

---

### 方式 3：npm 包安装（生产推荐）

将插件发布为 npm 包后，用户通过 CLI 一键安装。

#### 发布（维护者操作）

```bash
cd OpenClaw-Wechat
npm publish --access public
```

#### 安装（用户操作）

```bash
openclaw plugins install @openclaw/wecom
```

插件会被安装到 `~/.openclaw/extensions/` 目录下并自动被发现。

#### 配置

安装后仍需在 `~/.openclaw/openclaw.json` 中添加 `channels.wecom` 配置（参见方式 1 的步骤 2-3）。

---

## 企业微信配置

### 1. 创建自建应用

1. 登录[企业微信管理后台](https://work.weixin.qq.com/)
2. 进入 **应用管理** → **自建** → **创建应用**
3. 记录 **AgentId** 和 **Secret**

### 2. 获取企业 ID

在 **我的企业** → **企业信息** 页面底部找到 **企业ID**。

### 3. 配置回调 URL

1. 进入应用设置 → **功能** → **接收消息** → **设置API接收**
2. 填写：
   - **URL**: `https://你的域名:端口/wecom/callback`
   - **Token**: 自定义或自动生成
   - **EncodingAESKey**: 自定义或自动生成
3. 点击保存（企业微信会向 URL 发送验证请求）

### 4. 配置企业可信 IP

企业微信要求调用 API（如发送消息）的服务器 IP 必须在应用的可信 IP 列表中，否则会返回错误码 `60020`（`not allow to access from your ip`）。

> **注意**：这里需要填写的是**运行 OpenClaw 的服务器的公网出口 IP**，不是你个人设备的 IP。收消息走的是 Cloudflare Tunnel / Webhook 推送（不受此限制），但发消息时服务器需要主动调用企业微信 API，企业微信会校验来源 IP。

**获取服务器公网 IP：**

```bash
curl -s https://ifconfig.me
# 或
curl -s https://api.ipify.org
```

**设置步骤：**

1. 进入应用设置页面
2. 找到 **企业可信IP** 配置项
3. 将服务器的公网出口 IP 添加进去
4. 保存

如果你的服务器是通过 NAT 或代理上网，需要填写实际出口 IP（即上述 `curl` 命令返回的 IP），而非内网 IP。

### 5. 配置可信域名（可选）

如需使用网页授权等功能，需在应用设置中配置可信域名。

### 6. 设置可见范围

在应用的 **可见范围** 中设置哪些部门/成员可以看到该应用。

---

## 回调 API 协议详解

> 参考：[企业微信开发者文档 - 接收消息](https://developer.work.weixin.qq.com/document/10514) | [回调配置](https://developer.work.weixin.qq.com/document/path/90930) | [加解密方案说明](https://developer.work.weixin.qq.com/document/path/90968)

### 工作原理

企业微信采用 **Webhook 推送模式**：用户在企业微信中发消息时，企业微信服务器主动将加密后的消息 POST 到你预先注册的回调 URL。

```
用户在企业微信中发送消息
          │
          ▼
企业微信服务器 ──(加密的 XML POST)──▶ 你的回调 URL (/wecom/callback)
          │                                     │
          │                                解密 + 异步处理
          │                                     │
          ◀───────── HTTP 200 "success" ────────┘
                    (必须 5 秒内返回)
```

整个协议分为两个阶段：**URL 验证**（一次性）和**消息接收**（持续）。

### 阶段 1：URL 验证（GET）

在企业微信管理后台保存回调配置时，企业微信会发送一个 **GET** 请求来验证你的服务器是否就绪：

```
GET /wecom/callback?msg_signature=XXXX&timestamp=1403610513&nonce=nonce&echostr=加密的随机字符串
```

**参数说明：**

| 参数            | 说明                                   |
| --------------- | -------------------------------------- |
| `msg_signature` | 企业微信计算的签名，用于校验请求真实性 |
| `timestamp`     | 时间戳                                 |
| `nonce`         | 随机数                                 |
| `echostr`       | 加密的随机字符串，需要解密后原样返回   |

**服务器处理流程：**

1. **验签** — 将 `token`、`timestamp`、`nonce`、`echostr` 四个值按字典序排序后拼接，做 SHA1 哈希，与 `msg_signature` 比对
2. **解密** — 使用 `EncodingAESKey` 对 `echostr` 做 AES-256-CBC 解密
3. **返回** — 将解密后的明文**原样返回**（HTTP 200 + 明文内容），企业微信校验一致后保存配置

**插件实现**（`src/monitor.ts`）：

```typescript
// URL verification (GET with echostr)
if (req.method === "GET") {
  // 1. 验签：SHA1(sort([token, timestamp, nonce, echostr]))
  const expected = computeMsgSignature({ token, timestamp, nonce, encrypt: echostr });
  if (!msg_signature || expected !== msg_signature) {
    res.statusCode = 401;
    res.end("Invalid signature");
    return;
  }
  // 2. 解密 echostr
  const { msg: plainEchostr } = decryptWecom({ aesKey, cipherTextBase64: echostr });
  // 3. 返回明文
  res.statusCode = 200;
  res.end(plainEchostr);
}
```

### 阶段 2：消息接收（POST）

URL 验证通过后，用户每次在企业微信中向应用发消息，企业微信都会向回调 URL 发送 **POST** 请求：

```
POST /wecom/callback?msg_signature=XXXX&timestamp=1403610513&nonce=nonce
Content-Type: text/xml

<xml>
   <ToUserName><![CDATA[企业CorpID]]></ToUserName>
   <AgentID><![CDATA[应用AgentId]]></AgentID>
   <Encrypt><![CDATA[加密的消息体]]></Encrypt>
</xml>
```

**服务器处理流程：**

1. **读取 XML 请求体** — 解析外层 XML，提取 `Encrypt` 字段
2. **验签** — 与 GET 相同，使用 `token`、`timestamp`、`nonce`、`Encrypt` 计算签名并比对
3. **快速应答** — **必须在 5 秒内**返回 HTTP 200（否则企业微信会重试，共 3 次）
4. **解密** — 用 `EncodingAESKey` 解密 `Encrypt` 得到明文 XML
5. **异步处理** — 解析明文中的消息内容，交给 AI Agent 处理

**插件实现**（`src/monitor.ts`）：

```typescript
// POST: 接收消息
const rawXml = await readRequestBody(req);
const incoming = parseIncomingXml(rawXml);
const encrypt = incoming?.Encrypt;

// 验签
const expected = computeMsgSignature({ token, timestamp, nonce, encrypt });
if (!msg_signature || expected !== msg_signature) {
  res.statusCode = 401;
  res.end("Invalid signature");
  return;
}

// 先 ACK（企业微信要求 5 秒内响应，否则重试）
res.statusCode = 200;
res.end("success");

// 解密消息并异步处理（不阻塞 HTTP 响应）
const { msg: decryptedXml } = decryptWecom({ aesKey, cipherTextBase64: encrypt });
const msgObj = parseIncomingXml(decryptedXml);
// → 交给 processInboundMessage() 分发给 AI Agent
```

**解密后的明文 XML 示例（文本消息）：**

```xml
<xml>
   <ToUserName><![CDATA[企业CorpID]]></ToUserName>
   <FromUserName><![CDATA[发送者UserID]]></FromUserName>
   <CreateTime>1403610513</CreateTime>
   <MsgType><![CDATA[text]]></MsgType>
   <Content><![CDATA[你好]]></Content>
   <MsgId>4730509754795038728</MsgId>
   <AgentID>1000002</AgentID>
</xml>
```

**插件支持的消息类型：**

| MsgType | 说明     | 关键字段                                 |
| ------- | -------- | ---------------------------------------- |
| `text`  | 文本消息 | `Content`                                |
| `image` | 图片消息 | `MediaId`、`PicUrl`                      |
| `voice` | 语音消息 | `MediaId`、`Recognition`（语音识别结果） |
| `video` | 视频消息 | `MediaId`、`ThumbMediaId`                |
| `file`  | 文件消息 | `MediaId`、`FileName`、`FileSize`        |
| `link`  | 链接消息 | `Title`、`Description`、`Url`、`PicUrl`  |

### 加解密方案

企业微信使用 AES-256-CBC 加密消息，插件在 `src/crypto.ts` 中完整实现了该方案。

**参数规格：**

| 项目     | 值                                                        |
| -------- | --------------------------------------------------------- |
| 加密算法 | AES-256-CBC                                               |
| AES Key  | `Base64Decode(EncodingAESKey + "=")` → 32 字节            |
| IV 向量  | AES Key 的前 16 字节                                      |
| 填充方式 | PKCS#7，填充到 32 字节的倍数                              |
| 签名算法 | `SHA1(sort([token, timestamp, nonce, encrypt]).join(""))` |

**解密后的数据结构：**

```
┌──────────────────────────────────────────────────────┐
│ 16 字节随机数 │ 4 字节消息长度(网络字节序) │ 消息明文 │ CorpID │
└──────────────────────────────────────────────────────┘
```

**插件实现**（`src/crypto.ts`）：

```typescript
export function decryptWecom(params: {
  aesKey: string;
  cipherTextBase64: string;
}): DecryptedMessage {
  // 1. Base64 解码 EncodingAESKey（补 "=" 后解码为 32 字节）
  const key = decodeAesKey(params.aesKey);
  // 2. IV = Key 的前 16 字节
  const iv = key.subarray(0, 16);
  // 3. AES-256-CBC 解密
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  decipher.setAutoPadding(false);
  const plain = Buffer.concat([
    decipher.update(Buffer.from(params.cipherTextBase64, "base64")),
    decipher.final(),
  ]);
  // 4. PKCS#7 去填充
  const unpadded = pkcs7Unpad(plain);
  // 5. 从偏移 16 处读取 4 字节消息长度，从偏移 20 处提取消息明文
  const msgLen = unpadded.readUInt32BE(16);
  const msg = unpadded.subarray(20, 20 + msgLen).toString("utf8");
  const corpId = unpadded.subarray(20 + msgLen).toString("utf8");
  return { msg, corpId };
}

export function computeMsgSignature(params: {
  token: string;
  timestamp: string;
  nonce: string;
  encrypt: string;
}): string {
  // 四个值按字典序排序拼接后做 SHA1
  const arr = [params.token, params.timestamp, params.nonce, params.encrypt].sort();
  return sha1(arr.join(""));
}
```

> **注意**：建议直接使用本插件的实现，而非自行编写加解密逻辑。企业微信也提供了[官方多语言加解密库](https://developer.work.weixin.qq.com/document/path/90968)可供参考。

---

## 回调 URL 公网部署方案

企业微信要求回调 URL **公网可达**（支持 HTTP 和 HTTPS）。以下是三种常见方案：

### 方案 A：直接公网服务器

适用于有公网 IP 的云服务器（阿里云、腾讯云等）。

1. OpenClaw Gateway 监听某端口（如 3000）
2. 确保防火墙/安全组放行该端口
3. 企业微信后台填写：`http://你的公网IP:3000/wecom/callback`

> 生产环境建议使用 HTTPS（方案 B）。

### 方案 B：反向代理（推荐生产环境）

使用 Nginx 或 Caddy 做 HTTPS 反向代理，OpenClaw Gateway 只监听 localhost。

**Nginx 配置示例：**

```nginx
server {
    listen 443 ssl;
    server_name wecom.yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /wecom/callback {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 企业微信要求 5 秒内响应，设置合理超时
        proxy_connect_timeout 5s;
        proxy_read_timeout 10s;
    }
}
```

**Caddy 配置示例（自动 HTTPS）：**

```
wecom.yourdomain.com {
    reverse_proxy /wecom/callback localhost:3000
}
```

企业微信后台填写：`https://wecom.yourdomain.com/wecom/callback`

### 方案 C：内网穿透（开发调试）

适用于本地开发环境，无需公网服务器。

**ngrok：**

```bash
ngrok http 3000
# 得到类似 https://xxxx.ngrok-free.app 的临时地址
```

**Cloudflare Tunnel：**

```bash
cloudflared tunnel --url http://localhost:3000
# 得到类似 https://xxxx.trycloudflare.com 的临时地址
```

**frp（自建穿透服务）：**

```ini
# frpc.toml (客户端配置)
[wecom]
type = https
localPort = 3000
customDomains = ["wecom.yourdomain.com"]
```

企业微信后台填写穿透服务分配的公网地址，如：`https://xxxx.ngrok-free.app/wecom/callback`

> **注意**：内网穿透地址通常是临时的，每次重启后会变化。适合开发测试，不建议用于生产环境。

### 方案选择建议

| 场景            | 推荐方案                             | 理由                             |
| --------------- | ------------------------------------ | -------------------------------- |
| 本地开发调试    | 方案 C（ngrok / cloudflared）        | 零成本、即开即用                 |
| 个人/小团队生产 | 方案 D（Cloudflare Tunnel 自动部署） | 一次配置、自动管理、路径过滤安全 |
| 企业生产环境    | 方案 B（Nginx + HTTPS）              | 安全可靠、便于管理               |

### 方案 D：Cloudflare Tunnel 自动部署（推荐）

插件内置了 Cloudflare Tunnel 自动化集成，只需在配置中填写 Cloudflare 凭证，插件启动时会自动完成以下操作：

1. 通过 Cloudflare API 创建/复用隧道
2. 配置 ingress 规则（仅暴露 `/wecom/callback` 路径，其他路径返回 403）
3. 创建/更新 DNS CNAME 记录
4. 启动 `cloudflared` 子进程
5. 健康检查确认隧道就绪

#### 前置条件

1. **安装 cloudflared** — Cloudflare 的隧道客户端
   - Windows: `winget install Cloudflare.cloudflared`
   - macOS: `brew install cloudflared`
   - Linux: `apt install cloudflared` 或从 [官方下载页](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) 获取

2. **创建 Cloudflare API Token**

   **步骤：**
   1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   2. 点击右上角头像 → **My Profile**
   3. 左侧栏选择 **API Tokens**
   4. 点击 **Create Token**
   5. 选择 **Create Custom Token**（自定义令牌，**不要**使用预设模板）

   **配置 Permissions（权限）** — 需要添加两条：

   | #   | 范围（左侧下拉） | 资源（中间下拉）  | 权限（右侧下拉） |
   | --- | ---------------- | ----------------- | ---------------- |
   | 1   | Account          | Cloudflare Tunnel | Edit             |
   | 2   | Zone             | DNS               | Edit             |

   操作方式：
   - 第一行：左侧下拉选 `Account`，中间下拉选 `Cloudflare Tunnel`，右侧下拉选 `Edit`
   - 点击 **+ Add more** 添加第二行：左侧选 `Zone`，中间选 `DNS`，右侧选 `Edit`

   **配置 Account Resources（账户范围）：**
   - 选择 **Include → Specific account → 你的账户名**
   - 如果你只有一个账户，也可以选 **All accounts**

   **配置 Zone Resources（域名范围）：**
   - 选择 **Include → Specific zone → 你的域名**（如 `example.com`）
   - 这样 Token 只能操作这一个域名的 DNS，更安全

   **可选安全设置：**
   - **Client IP Address Filtering** — 可限制只允许特定 IP 使用此 Token
   - **TTL** — 可设置 Token 过期时间

   **确认并创建：**

   点击 **Continue to summary** → 确认权限无误 → **Create Token**

   > ⚠️ 页面会显示一次 Token 值（类似 `aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890`），**请立即复制保存**，关闭页面后无法再次查看。

   **验证 Token 有效性（可选）：**

   ```bash
   curl -H "Authorization: Bearer 你的Token" \
     "https://api.cloudflare.com/client/v4/user/tokens/verify"
   ```

   返回 `"status": "active"` 表示 Token 有效。

3. **获取 Account ID 和 Zone ID**

   **Account ID：**
   - 登录 Cloudflare Dashboard 后，URL 中即可看到：`https://dash.cloudflare.com/<Account_ID>`
   - 或者：选择任意域名 → 右侧栏 **API** 区域 → **Account ID**

   **Zone ID：**
   - 选择你的域名 → 概述（Overview）页 → 右下方 **API** 区域 → **Zone ID**

4. **准备域名** — 一个已在 Cloudflare 管理的域名（如 `example.com`），为隧道分配子域名（如 `wecom.example.com`）

#### 配置方法

**1. 添加环境变量**

在 `~/.openclaw/.env` 中添加：

```env
# Cloudflare Tunnel
CF_API_TOKEN=你的Cloudflare_API_Token
CF_ACCOUNT_ID=你的Cloudflare_Account_ID
CF_ZONE_ID=你的域名Zone_ID
```

**2. 修改 OpenClaw 配置**

在 `~/.openclaw/openclaw.json` 的 `channels.wecom` 中添加 `tunnel` 配置：

```json
{
  "channels": {
    "wecom": {
      "corpId": "${WECOM_CORP_ID}",
      "corpSecret": "${WECOM_CORP_SECRET}",
      "agentId": "${WECOM_AGENT_ID}",
      "callbackToken": "${WECOM_CALLBACK_TOKEN}",
      "callbackAesKey": "${WECOM_CALLBACK_AES_KEY}",
      "webhookPath": "/wecom/callback",
      "tunnel": {
        "enabled": true,
        "cloudflare": {
          "apiToken": "${CF_API_TOKEN}",
          "accountId": "${CF_ACCOUNT_ID}",
          "zoneId": "${CF_ZONE_ID}",
          "hostname": "wecom.example.com"
        }
      }
    }
  }
}
```

**3. 重启 Gateway**

```bash
openclaw gateway restart
```

启动后日志中应显示：

```
wecom: tunnel service registered
wecom-tunnel: cloudflared found (version=2024.x.x, path=cloudflared)
wecom-tunnel: tunnel created (id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
wecom-tunnel: configuring ingress (hostname=wecom.example.com, path=^/wecom/callback$, port=18789)
wecom-tunnel: DNS record ready (recordId=...)
wecom-tunnel: cloudflared started (pid=12345)
wecom-tunnel: tunnel ready → https://wecom.example.com/wecom/callback
```

**4. 在企业微信后台填写回调 URL**

```
https://wecom.example.com/wecom/callback
```

#### 安全特性

- **路径过滤** — Ingress 规则仅转发 `/wecom/callback`，其他路径返回 HTTP 403，不会暴露整个 Gateway
- **API Token 保护** — Token 通过环境变量引用，不明文存储
- **Tunnel Token 加密存储** — 持久化状态文件权限为 600
- **自动恢复** — `cloudflared` 进程崩溃后自动重启（指数退避：2s → 4s → 8s → ... → 60s）
- **资源复用** — 停止时不删除 Cloudflare 上的隧道和 DNS 记录，下次启动自动复用

#### 检查隧道状态

在企业微信中发送 `/status` 命令，可查看 Cloudflare Tunnel 的运行状态，包括公网地址和隧道 ID。

#### 故障排查

| 问题                    | 排查方法                                                              |
| ----------------------- | --------------------------------------------------------------------- |
| `cloudflared not found` | 确认已安装 cloudflared 并在 PATH 中，或在配置中指定 `cloudflaredPath` |
| `Cloudflare API error`  | 检查 API Token 权限是否包含 Tunnel:Edit 和 DNS:Edit                   |
| 隧道无连接              | 查看 cloudflared 日志输出（`cloudflared:` 前缀），检查网络连接        |
| DNS 未生效              | Cloudflare DNS 通常秒级生效，如使用自定义 DNS 可能需要等待 TTL        |

### 防火墙 IP 白名单（可选）

如需限制只允许企业微信服务器访问回调 URL，可通过接口获取企业微信的回调 IP 段：

```bash
curl "https://qyapi.weixin.qq.com/cgi-bin/getcallbackip?access_token=ACCESS_TOKEN"
```

将返回的 IP 段加入防火墙白名单即可。

---

## OpenClaw 配置详解

### 最小配置

```json
{
  "plugins": {
    "enabled": true,
    "load": {
      "paths": ["<插件路径>"]
    },
    "entries": {
      "wecom": { "enabled": true }
    }
  },
  "channels": {
    "wecom": {
      "corpId": "ww1234567890",
      "corpSecret": "your-secret",
      "agentId": "1000002",
      "callbackToken": "your-token",
      "callbackAesKey": "your-aes-key"
    }
  }
}
```

### 完整配置（含多账号）

```json
{
  "plugins": {
    "enabled": true,
    "load": {
      "paths": ["<插件路径>"]
    },
    "entries": {
      "wecom": {
        "enabled": true,
        "config": {}
      }
    }
  },
  "channels": {
    "wecom": {
      "corpId": "ww1234567890",
      "corpSecret": "your-secret",
      "agentId": "1000002",
      "callbackToken": "your-token",
      "callbackAesKey": "your-aes-key",
      "webhookPath": "/wecom/callback",
      "enabled": true,
      "allowFrom": ["UserID1", "UserID2"],
      "accounts": {
        "second-app": {
          "corpId": "ww0987654321",
          "corpSecret": "another-secret",
          "agentId": "1000003",
          "callbackToken": "another-token",
          "callbackAesKey": "another-aes-key"
        }
      }
    }
  }
}
```

### 配置优先级

插件解析配置的优先级（从高到低）：

1. `channels.wecom`（主配置）
2. `channels.wecom.accounts[accountId]`（多账号配置）
3. `env.vars`（OpenClaw 配置中的环境变量）
4. `process.env`（系统环境变量 / `.env` 文件）

---

## 验证部署

### 1. 检查插件加载

启动 Gateway 后查看日志，应看到类似输出：

```
wecom: config loaded (corpId=ww123456...)
```

如果看到以下警告，说明配置未正确加载：

```
wecom: no configuration found (check channels.wecom in config)
```

### 2. 测试 URL 验证

手动向回调 URL 发送 GET 请求，应返回 echostr：

```bash
curl "http://localhost:3000/wecom/callback?msg_signature=xxx&timestamp=xxx&nonce=xxx&echostr=xxx"
```

### 3. 测试消息收发

在企业微信中向应用发送一条消息，Gateway 日志应显示消息处理记录。

### 4. 测试内置命令

在企业微信中发送：

- `/help` — 显示帮助信息
- `/status` — 显示系统状态
- `/clear` — 清除当前会话

---

## 常见问题

### Q: 插件加载失败，提示找不到模块？

**A**: 确保插件项目的 `devDependencies` 中有 `"openclaw": "workspace:*"`。如果是方式 1（本地路径加载），需要确保 openclaw 主项目已正确安装依赖（`pnpm install`）。

### Q: 回调 URL 验证不通过？

**A**: 检查以下几点：

- 公网地址是否可达（可用 `curl` 从外部测试）
- `webhookPath` 配置是否与企业微信后台一致（默认 `/wecom/callback`）
- `callbackToken` 和 `callbackAesKey` 是否与企业微信后台**完全一致**（不能有多余空格）
- Gateway 是否已启动并监听正确端口
- 如果使用反向代理，确认代理路径转发正确
- 验证超时：企业微信要求 1 秒内返回，检查网络延迟

### Q: 企业微信重复推送同一条消息？

**A**: 企业微信在 5 秒内收不到 HTTP 200 响应会重试（最多 3 次）。插件已采用"先 ACK 再处理"策略（收到消息后立即返回 `200 "success"`，然后异步处理），正常情况下不会触发重试。如果仍然重复，检查：

- 网络延迟是否过高
- 反向代理超时设置是否合理（建议 `proxy_read_timeout 10s`）

### Q: 收到消息但回复失败，报错 errcode 60020？

**A**: 错误 `60020`（`not allow to access from your ip`）表示服务器的公网出口 IP 不在应用的**企业可信 IP** 列表中。

收消息走的是 Webhook 推送（企业微信 → Cloudflare Tunnel → 服务器），不受 IP 限制；但发送回复时，服务器需要主动调用企业微信 API，企业微信会校验来源 IP。

解决方法：

1. 在服务器上执行 `curl -s https://ifconfig.me` 获取公网出口 IP
2. 在企业微信管理后台 → 应用设置 → **企业可信IP** 中添加该 IP
3. 无需重启 Gateway，再次发消息即可生效

### Q: access_token 获取失败？

**A**: 检查 `corpId` 和 `corpSecret` 是否正确。插件会自动缓存 token 并在过期前 1 分钟刷新，首次获取失败通常是凭证错误。

### Q: 消息发送超过 2048 字节被截断？

**A**: 这是企业微信的限制。插件已内置自动分片功能，会在段落、换行符、句号等自然断点处分割长消息。

### Q: 如何查看插件详细日志？

**A**: 启动 Gateway 时使用 verbose 模式：

```bash
openclaw gateway --verbose
```

### Q: 配置了环境变量但插件读不到？

**A**: 确认环境变量写在 `~/.openclaw/.env` 文件中（而非系统环境变量或其他 `.env` 文件），且变量名与 `${...}` 引用一致。

---

## 相关文档

**OpenClaw 内部文档：**

- [扩展开发指南](./extension-development-guide.md) — 完整的 OpenClaw 扩展开发参考
- [渠道部署指南](./channel-deployment-guide.md) — 通用渠道配置说明
- [WeCom 渠道文档](../../extensions/wecom/docs/channels/wecom.md) — 插件自带的详细文档（如已集成到 extensions 目录）

**企业微信官方文档：**

- [接收消息与事件 - 概述](https://developer.work.weixin.qq.com/document/10514) — 接收消息 API 入口
- [回调配置（企业内部开发）](https://developer.work.weixin.qq.com/document/path/90930) — 自建应用回调配置指南
- [加解密方案说明](https://developer.work.weixin.qq.com/document/path/90968) — AES 加解密与签名校验技术文档
- [消息格式](https://developer.work.weixin.qq.com/document/path/90239) — 各类消息的 XML 格式定义
- [发送应用消息](https://developer.work.weixin.qq.com/document/path/90236) — 主动推送消息 API
- [上传临时素材](https://developer.work.weixin.qq.com/document/path/90253) — 媒体文件上传 API
- [获取企业微信回调 IP 段](https://developer.work.weixin.qq.com/document/path/92521) — 用于防火墙白名单配置
