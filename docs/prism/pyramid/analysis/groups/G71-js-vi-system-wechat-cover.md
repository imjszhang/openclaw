# G71: JS VI 系统必须通过“微信专用尺寸枚举 + 静态模板约束 + 双模导出流程”实现公众号封面图的自动化与品牌一致性

> 微信公众号封面图生成需严格遵循平台像素规范，通过系统内建尺寸约束与静态渲染模式，解决运营手动换算痛点并确保品牌视觉统一。

## 包含的 Atoms

| 编号  | 来源                                       | 内容摘要                                                                                            |
| ----- | ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| JW-01 | js-vi-system-wechat-official-account-cover | 微信公众号头条封面典型规格为 900×383 像素（2.35:1），略缩图为 500×500 像素（1:1）                   |
| JW-02 | js-vi-system-wechat-official-account-cover | 原有通用海报尺寸缺乏微信专用像素约束命名，导致运营需自行换算且易损害品牌一致性                      |
| JW-03 | js-vi-system-wechat-official-account-cover | 新增 `wechat-cover` 模板目录，包含 `render.js`、`meta.json` 及 `styles.css` 文件                    |
| JW-04 | js-vi-system-wechat-official-account-cover | `wechat-cover` 模板元数据支持 title、subtitle、tag、issue 等结构化字段填入                          |
| JW-05 | js-vi-system-wechat-official-account-cover | 微信封面模板默认禁用动画（animation.supported: false），以静态版式适配直接导出 PNG/JPEG 的需求      |
| JW-06 | js-vi-system-wechat-official-account-cover | 全局 `SIZES` 枚举新增 `wechat-cover` (900×383) 和 `wechat-thumb` (500×500) 两个尺寸键               |
| JW-07 | js-vi-system-wechat-official-account-cover | 生成图片时通过 `--size wechat-cover` 或 `--size wechat-thumb` 参数切换对应规格                      |
| JW-08 | js-vi-system-wechat-official-account-cover | `renderToHTML` 需将模板目录 `meta._dir` 作为 `templateDir` 传入，以确保外部模板样式正确内联         |
| JW-09 | js-vi-system-wechat-official-account-cover | `package.json` 新增 `exports["./templates/_shared/*"]` 子路径以支持依赖方引用共享静态资源           |
| JW-10 | js-vi-system-wechat-official-account-cover | 独立 CLI 生成命令格式：`node bin/js-vi.js poster -t [模板] --size [尺寸] --scheme [方案] -f [格式]` |
| JW-11 | js-vi-system-wechat-official-account-cover | OpenClaw 插件 `vi_poster_generate` 支持指定 template、size 及 format 参数生成微信封面               |
| JW-12 | js-vi-system-wechat-official-account-cover | 在 Prism 内容定稿后直接调用同一套品牌规范生成封面，可避免文章与配图割裂                             |
| JW-13 | js-vi-system-wechat-official-account-cover | 导出 PNG/JPEG/PDF 格式依赖本机安装的 Chrome 或 Edge 浏览器（通过 puppeteer-core 调用）              |
| JW-14 | js-vi-system-wechat-official-account-cover | 导出 HTML 格式无浏览器依赖适合快速校对，但上传微信前通常需再导出为位图                              |
| JW-15 | js-vi-system-wechat-official-account-cover | 视觉系统仅负责像素与版式一致性，图片体积压缩策略需按运营规范在微信编辑器内额外处理                  |

## 组内逻辑顺序

逻辑顺序遵循“需求痛点 -> 规范定义 -> 模板实现 -> 调用集成 -> 导出交付”的结构：

1. **痛点与规范** (JW-01, JW-02)：明确微信平台的特殊像素要求及现有系统的不足。
2. **系统实现** (JW-03 ~ JW-09)：定义新的尺寸枚举、模板目录结构、元数据字段及渲染逻辑调整。
3. **调用方式** (JW-10, JW-11)：提供 CLI 命令行与 OpenClaw 插件两种调用入口。
4. **工作流整合** (JW-12)：阐述与知识棱镜（Prism）的协同价值。
5. **交付细节** (JW-13 ~ JW-15)：说明不同格式的导出依赖、校对流程及后续压缩处理边界。
