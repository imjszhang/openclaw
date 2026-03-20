# JS VI System：微信公众号封面图能力

> 来源：[../../../../journal/2026-03-20/js-vi-system-wechat-official-account-cover.md](../../../../journal/2026-03-20/js-vi-system-wechat-official-account-cover.md)
> 缩写：JW

## Atoms

| 编号  | 类型 | 内容                                                                                                | 原文定位                     |
| ----- | ---- | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| JW-01 | 事实 | 微信公众号头条封面典型规格为 900×383 像素（2.35:1），略缩图为 500×500 像素（1:1）                   | 背景与动机                   |
| JW-02 | 判断 | 原有通用海报尺寸缺乏微信专用像素约束命名，导致运营需自行换算且易损害品牌一致性                      | 背景与动机                   |
| JW-03 | 步骤 | 新增 `wechat-cover` 模板目录，包含 `render.js`、`meta.json` 及 `styles.css` 文件                    | 近期变更摘要 > 新模板        |
| JW-04 | 事实 | `wechat-cover` 模板元数据支持 title、subtitle、tag、issue 等结构化字段填入                          | 近期变更摘要 > 新模板        |
| JW-05 | 判断 | 微信封面模板默认禁用动画（animation.supported: false），以静态版式适配直接导出 PNG/JPEG 的需求      | 近期变更摘要 > 新模板        |
| JW-06 | 事实 | 全局 `SIZES` 枚举新增 `wechat-cover` (900×383) 和 `wechat-thumb` (500×500) 两个尺寸键               | 近期变更摘要 > 新尺寸键      |
| JW-07 | 步骤 | 生成图片时通过 `--size wechat-cover` 或 `--size wechat-thumb` 参数切换对应规格                      | 近期变更摘要 > 新尺寸键      |
| JW-08 | 经验 | `renderToHTML` 需将模板目录 `meta._dir` 作为 `templateDir` 传入，以确保外部模板样式正确内联         | 近期变更摘要 > HTML 包装     |
| JW-09 | 事实 | `package.json` 新增 `exports["./templates/_shared/*"]` 子路径以支持依赖方引用共享静态资源           | 近期变更摘要 > npm 子路径    |
| JW-10 | 步骤 | 独立 CLI 生成命令格式：`node bin/js-vi.js poster -t [模板] --size [尺寸] --scheme [方案] -f [格式]` | 推荐使用方式 > 独立 CLI      |
| JW-11 | 事实 | OpenClaw 插件 `vi_poster_generate` 支持指定 template、size 及 format 参数生成微信封面               | 推荐使用方式 > OpenClaw      |
| JW-12 | 经验 | 在 Prism 内容定稿后直接调用同一套品牌规范生成封面，可避免文章与配图割裂                             | 推荐使用方式 > 与 Prism 关系 |
| JW-13 | 事实 | 导出 PNG/JPEG/PDF 格式依赖本机安装的 Chrome 或 Edge 浏览器（通过 puppeteer-core 调用）              | 依赖与注意点                 |
| JW-14 | 经验 | 导出 HTML 格式无浏览器依赖适合快速校对，但上传微信前通常需再导出为位图                              | 依赖与注意点                 |
| JW-15 | 判断 | 视觉系统仅负责像素与版式一致性，图片体积压缩策略需按运营规范在微信编辑器内额外处理                  | 依赖与注意点                 |
