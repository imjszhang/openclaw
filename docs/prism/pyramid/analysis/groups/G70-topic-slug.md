# G70: JS VI 系统必须采用"Design Tokens 单源驱动 + 五层架构 + 刚柔并济视觉哲学"以实现品牌风格的全链路自动化

> 自建纯 JS 视觉系统通过 JSON 定义设计原子，结合 Neo-Brutalism 硬约束与 Cyber-Taoist 角色曲线，解决传统设计工具在风格统一与批量生成上的痛点。

## 包含的 Atoms

| 编号  | 来源                          | 内容摘要                                                                                                           |
| ----- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| JV-01 | js-vi-system-project-creation | JS 品牌视觉系统旨在解决风格不统一、效率低及品牌弱化问题，目标实现 Neo-Brutalism + Cyberpunk 全链路自动化           |
| JV-02 | js-vi-system-project-creation | 品牌核心定位为 Cyberpunk Growth Hacker，融合东方哲学（道）与科技，主色调为黄 #FCD228、黑 #FFFFFF、白 #000000       |
| JV-03 | js-vi-system-project-creation | 自建系统是唯一能同时满足风格统一、批量自动化和开发者友好三个要求的方案，优于 Figma、Canva 或纯 CSS 框架            |
| JV-04 | js-vi-system-project-creation | Neo-Brutalism 风格硬性约束包括禁止渐变、圆角（除 Logo 外）和柔和阴影，要求硬边框（3px）和高对比度硬阴影            |
| JV-05 | js-vi-system-project-creation | 系统架构分为五层：消费层（CLI/OpenClaw）、模板层、渲染层（Puppeteer）、基础层（Design Tokens）                     |
| JV-06 | js-vi-system-project-creation | 选择纯 JavaScript (ESM) 而非 TypeScript 以保持与 js-品牌词系列项目一致，且不引入额外编译复杂度                     |
| JV-07 | js-vi-system-project-creation | 设计 Token 采用 JSON 为单一数据源，通过 build 脚本自动生成 CSS 变量文件和 Tailwind 预设                            |
| JV-08 | js-vi-system-project-creation | 修改任何 Token JSON 后，需执行 `npm run build` 命令一次即可使 CSS 变量和 Tailwind 主题全局生效                     |
| JV-09 | js-vi-system-project-creation | 模板系统由 render.js（纯函数返回 HTML）、meta.json（元数据）和可选的 styles.css 组成                               |
| JV-10 | js-vi-system-project-creation | 内置模板包含 terminal（终端风）、card（信息卡片）和 cybertaoist（角色风），支持 daylight/dark/minimal 三种配色方案 |
| JV-11 | js-vi-system-project-creation | 使用 CLI 生成海报的命令格式为 `js-vi poster -t [模板] --scheme [配色] --size [尺寸] -f [格式] -o [输出路径]`       |
| JV-12 | js-vi-system-project-creation | 品牌规范体系包含身份定义、哲学内核、设计原则、角色规格（Cyber-Taoist）及语气风格指南五类文档                       |
| JV-13 | js-vi-system-project-creation | 视觉对比哲学体现为环境（UI）采用方正锐利的 Neo-Brutalist 风格，而角色（avatar）采用有机曲线流动风格以刚柔并济      |
| JV-14 | js-vi-system-project-creation | OpenClaw 插件提供 4 个 AI 工具（列表、生成、查 Token、查品牌）、3 个 CLI 子命令及 HTTP 路由服务                    |
| JV-15 | js-vi-system-project-creation | 在 OpenClaw 配置文件中需指定 `browserPath`（Chrome 路径）、`defaultScheme` 和 `outputDir` 等参数以启用插件功能     |
| JV-16 | js-vi-system-project-creation | 推荐生成策略为：快速预览用 html，社交分享用 png，动画演示用 gif，打印文档用 pdf                                    |
| JV-17 | js-vi-system-project-creation | 系统验证通过了 Token 生成、多格式输出（HTML/PNG/JPEG/PDF/SVG/GIF）、Tailwind 集成及 OpenClaw 全功能调用            |
| JV-18 | js-vi-system-project-creation | 后续演化方向包括增加 quote/changelog 模板、实现 Watch 模式、发布 npm 包以及与 js-knowledge-prism 深度集成          |
| JV-19 | js-vi-system-project-creation | 系统版本为 1.1.0，由 JS_BESTAGENT 在 Cursor Agent 对话中实现，采用 MIT 协议开源                                    |

## 组内逻辑顺序

按"品牌定位与哲学 (JV-01~04, JV-12~13) -> 架构设计与技术选型 (JV-05~09) -> 核心机制与工作流 (JV-07~08, JV-11, JV-14~16) -> 验证与演化 (JV-17~19)"的系统构建逻辑排列。
