# js-knowledge-collector 开发为 OpenClaw 插件全记录

> 来源：[../../../../journal/2026-03-06/js-knowledge-collector-plugin-dev.md](../../../../journal/2026-03-06/js-knowledge-collector-plugin-dev.md)
> 缩写：KC

## Atoms

| 编号  | 类型 | 内容                                                                                                    | 原文定位                    |
| ----- | ---- | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| KC-01 | 事实 | js-knowledge-collector 从 URL 到知识库全链路：抓取→AI 总结→SQLite 入库→Flomo 推送，支持多平台           | 1. 项目背景                 |
| KC-02 | 事实 | 插件结构：openclaw-plugin/ 含 openclaw.plugin.json、package.json、index.mjs，用相对路径 import 业务逻辑 | 2. 插件结构设计             |
| KC-03 | 事实 | openclaw.extensions 是 OpenClaw 识别插件入口的字段，与 JS-Eyes 相同                                     | 3. 三个核心文件详解         |
| KC-04 | 事实 | 插件注册：7 个 Tool、5 条 HTTP Route（Web UI + REST API）、CLI 子命令、可选 Service                     | 3. 三个核心文件详解         |
| KC-05 | 经验 | registerHttpHandler 已在 2026.3.2 移除，必须用 registerHttpRoute 注册 HTTP 路由                         | 5. 碰到的问题与解决思路     |
| KC-06 | 经验 | 纯 ESM 项目用 createRequire 会 ERR_REQUIRE_ESM，应直接用动态 import()                                   | 5. 碰到的问题与解决思路     |
| KC-07 | 经验 | 前端 API 用相对路径（无前导 /）可天然兼容 Gateway 路径前缀，无需修改前端代码                            | 4. 通过 Gateway 暴露 Web UI |
| KC-08 | 步骤 | 静态文件通配路由需校验 path 不越界到 src/ 目录之外，防止路径遍历                                        | 4. 通过 Gateway 暴露 Web UI |
| KC-09 | 经验 | Gateway 路由中数据库改为按请求开关连接，避免长期持有 SQLite 句柄                                        | 4. 通过 Gateway 暴露 Web UI |
| KC-10 | 经验 | 插件模式下通过 applyEnv() 将 pluginConfig 注入 process.env，业务代码零改动即可支持 CLI 与插件双模式     | 5. 碰到的问题与解决思路     |
| KC-11 | 事实 | 路由约定：具体路径优先于通配路径；handler 内可额外检查 subPath 防漏网                                   | 5. 碰到的问题与解决思路     |
| KC-12 | 经验 | URL 解析时 req.headers.host 可能为空，需 fallback 如 `http://${req.headers.host \|\| "localhost"}`      | 5. 碰到的问题与解决思路     |
