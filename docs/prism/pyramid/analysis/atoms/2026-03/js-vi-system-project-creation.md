# JS VI System：龙虾品牌视觉身份系统的创建

> 来源：[../../../../journal/2026-03-19/js-vi-system-project-creation.md](../../../../journal/2026-03-19/js-vi-system-project-creation.md)
> 缩写：JV

## Atoms

| 编号  | 类型 | 内容                                                                                                               | 原文定位                    |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| JV-01 | 事实 | JS 品牌视觉系统旨在解决风格不统一、效率低及品牌弱化问题，目标实现 Neo-Brutalism + Cyberpunk 全链路自动化           | 背景与动机                  |
| JV-02 | 事实 | 品牌核心定位为 Cyberpunk Growth Hacker，融合东方哲学（道）与科技，主色调为黄 #FCD228、黑 #FFFFFF、白 #000000       | 分析过程 > 风格定位         |
| JV-03 | 经验 | 自建系统是唯一能同时满足风格统一、批量自动化和开发者友好三个要求的方案，优于 Figma、Canva 或纯 CSS 框架            | 分析过程 > 现有方案评估     |
| JV-04 | 判断 | Neo-Brutalism 风格硬性约束包括禁止渐变、圆角（除 Logo 外）和柔和阴影，要求硬边框（3px）和高对比度硬阴影            | 分析过程 > 设计约束提炼     |
| JV-05 | 事实 | 系统架构分为五层：消费层（CLI/OpenClaw）、模板层、渲染层（Puppeteer）、基础层（Design Tokens）                     | 方案设计 > 整体架构         |
| JV-06 | 判断 | 选择纯 JavaScript (ESM) 而非 TypeScript 以保持与 js-品牌词系列项目一致，且不引入额外编译复杂度                     | 方案设计 > 关键决策         |
| JV-07 | 事实 | 设计 Token 采用 JSON 为单一数据源，通过 build 脚本自动生成 CSS 变量文件和 Tailwind 预设                            | 方案设计 > 关键决策         |
| JV-08 | 步骤 | 修改任何 Token JSON 后，需执行 `npm run build` 命令一次即可使 CSS 变量和 Tailwind 主题全局生效                     | 实现要点 > Token 驱动流程   |
| JV-09 | 事实 | 模板系统由 render.js（纯函数返回 HTML）、meta.json（元数据）和可选的 styles.css 组成                               | 模板系统详解 > 模板结构     |
| JV-10 | 事实 | 内置模板包含 terminal（终端风）、card（信息卡片）和 cybertaoist（角色风），支持 daylight/dark/minimal 三种配色方案 | 模板系统详解 > 内置模板     |
| JV-11 | 步骤 | 使用 CLI 生成海报的命令格式为 `js-vi poster -t [模板] --scheme [配色] --size [尺寸] -f [格式] -o [输出路径]`       | 模板系统详解 > CLI 用法     |
| JV-12 | 事实 | 品牌规范体系包含身份定义、哲学内核、设计原则、角色规格（Cyber-Taoist）及语气风格指南五类文档                       | 品牌规范体系                |
| JV-13 | 经验 | 视觉对比哲学体现为环境（UI）采用方正锐利的 Neo-Brutalist 风格，而角色（avatar）采用有机曲线流动风格以刚柔并济      | 品牌规范体系 > 视觉对比哲学 |
| JV-14 | 事实 | OpenClaw 插件提供 4 个 AI 工具（列表、生成、查 Token、查品牌）、3 个 CLI 子命令及 HTTP 路由服务                    | OpenClaw 集成 > 插件架构    |
| JV-15 | 步骤 | 在 OpenClaw 配置文件中需指定 `browserPath`（Chrome 路径）、`defaultScheme` 和 `outputDir` 等参数以启用插件功能     | OpenClaw 集成 > 插件配置    |
| JV-16 | 经验 | 推荐生成策略为：快速预览用 html，社交分享用 png，动画演示用 gif，打印文档用 pdf                                    | OpenClaw 集成 > Skill       |
| JV-17 | 事实 | 系统验证通过了 Token 生成、多格式输出（HTML/PNG/JPEG/PDF/SVG/GIF）、Tailwind 集成及 OpenClaw 全功能调用            | 验证与测试                  |
| JV-18 | 判断 | 后续演化方向包括增加 quote/changelog 模板、实现 Watch 模式、发布 npm 包以及与 js-knowledge-prism 深度集成          | 后续演化                    |
| JV-19 | 事实 | 系统版本为 1.1.0，由 JS_BESTAGENT 在 Cursor Agent 对话中实现，采用 MIT 协议开源                                    | 总结                        |
