# G46: js-knowledge-collector 插件通过 registerHttpRoute 暴露 Web UI，纯 ESM 项目需用动态 import 替代 createRequire

> 从 URL 到知识库全链路工具改造为 OpenClaw 插件，Gateway 路由中数据库按请求开关连接，pluginConfig 通过 applyEnv 注入 process.env 实现业务代码零改动。

## 包含的 Atoms

| 编号  | 来源                              | 内容摘要                                                                                                |
| ----- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| KC-01 | js-knowledge-collector-plugin-dev | js-knowledge-collector 从 URL 到知识库全链路：抓取→AI 总结→SQLite 入库→Flomo 推送，支持多平台           |
| KC-02 | js-knowledge-collector-plugin-dev | 插件结构：openclaw-plugin/ 含 openclaw.plugin.json、package.json、index.mjs，用相对路径 import 业务逻辑 |
| KC-03 | js-knowledge-collector-plugin-dev | openclaw.extensions 是 OpenClaw 识别插件入口的字段，与 JS-Eyes 相同                                     |
| KC-04 | js-knowledge-collector-plugin-dev | 插件注册：7 个 Tool、5 条 HTTP Route（Web UI + REST API）、CLI 子命令、可选 Service                     |
| KC-05 | js-knowledge-collector-plugin-dev | registerHttpHandler 已在 2026.3.2 移除，必须用 registerHttpRoute 注册 HTTP 路由                         |
| KC-06 | js-knowledge-collector-plugin-dev | 纯 ESM 项目用 createRequire 会 ERR_REQUIRE_ESM，应直接用动态 import()                                   |
| KC-07 | js-knowledge-collector-plugin-dev | 前端 API 用相对路径（无前导 /）可天然兼容 Gateway 路径前缀，无需修改前端代码                            |
| KC-08 | js-knowledge-collector-plugin-dev | 静态文件通配路由需校验 path 不越界到 src/ 目录之外，防止路径遍历                                        |
| KC-09 | js-knowledge-collector-plugin-dev | Gateway 路由中数据库改为按请求开关连接，避免长期持有 SQLite 句柄                                        |
| KC-10 | js-knowledge-collector-plugin-dev | 插件模式下通过 applyEnv() 将 pluginConfig 注入 process.env，业务代码零改动即可支持 CLI 与插件双模式     |
| KC-11 | js-knowledge-collector-plugin-dev | 路由约定：具体路径优先于通配路径；handler 内可额外检查 subPath 防漏网                                   |
| KC-12 | js-knowledge-collector-plugin-dev | URL 解析时 req.headers.host 可能为空，需 fallback 如 `http://${req.headers.host \|\| "localhost"}`      |

## 组内逻辑顺序

遵循"项目背景 → 插件结构 → 核心文件 → Gateway 暴露 Web UI → 问题与解决思路"的结构顺序。
