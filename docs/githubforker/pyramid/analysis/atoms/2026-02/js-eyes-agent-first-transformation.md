# 日记：把 JS-Eyes 改造成 Agent-First 项目的全过程

> 来源：[../../../../journal/2026-02-26/js-eyes-agent-first-transformation.md](../../../../journal/2026-02-26/js-eyes-agent-first-transformation.md)
> 缩写：AF

## Atoms

| 编号  | 类型 | 内容                                                                                                               | 原文定位                                        |
| ----- | ---- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| AF-01 | 事实 | ClawHub 集成 VirusTotal 扫描后，可疑技能需加 `--force` 参数才能安装，否则显示警告拦截用户                          | 问题：VirusTotal 误报导致 ClawHub 安装受阻      |
| AF-02 | 事实 | `fetch()` 动态 URL、`new WebSocket()` 及含 `api` 的本地路径是触发 VirusTotal 静态分析误报的主要代码模式            | 根因分析：哪些代码模式触发了检测                |
| AF-03 | 判断 | 本地自动化代码的网络通信特征与 C2 后门相似，导致 VirusTotal 误报，且该误报无法通过声明消除，只能绕过               | 根因分析：哪些代码模式触发了检测                |
| AF-04 | 步骤 | 创建 `SECURITY.md` 文件，向用户、审核方及申诉者说明项目无外联、无遥测及误报申诉流程                                | 阶段一：安全声明——先让用户安心                  |
| AF-05 | 步骤 | 在 `SKILL.md` 的 Prerequisites 和 Install 之间插入"Security & VirusTotal"章节，简述安全性并引导查看详情            | 阶段一：安全声明——先让用户安心                  |
| AF-06 | 判断 | 安全声明仅能安抚已看到警告的用户，无法消除警告本身，因此必须提供绕过 ClawHub 的等效安装方式                        | 阶段一：安全声明——先让用户安心                  |
| AF-07 | 判断 | 在五种安装方案中，curl 脚本因具备“一行命令、跨平台”优势且无需经过市场扫描，被选为最优解                            | 阶段二：提供绕过 ClawHub 的等效安装方式         |
| AF-08 | 步骤 | 编写 `install.sh` 和 `install.ps1` 脚本，流程包含检测环境、获取 Release Tag、下载 Archive、提取 Bundle 及注册配置  | 阶段二：提供绕过 ClawHub 的等效安装方式         |
| AF-09 | 事实 | 安装脚本支持 `JS_EYES_DIR` 环境变量自定义目录，`JS_EYES_FORCE=1` 跳过确认，管道模式下通过 `/dev/tty` 读取输入      | 阶段二：提供绕过 ClawHub 的等效安装方式         |
| AF-10 | 步骤 | 修改 `SKILL.md` 安装章节为双选项结构：Option A 推荐 curl 一键安装，Option B 保留 ClawHub 并附带警告说明            | 阶段二：提供绕过 ClawHub 的等效安装方式         |
| AF-11 | 步骤 | 落地页 Hero 区域命令框改为 Tab 切换结构，利用 `navigator.platform` 自动检测 Windows 用户并显示对应 PowerShell 命令 | 阶段三：落地页改造——去 ClawHub 化               |
| AF-12 | 步骤 | 修改 `cli/lib/builder.js` 的 `buildSite` 函数为 async，新增复制安装脚本到 docs 及打包 skill bundle zip 的功能      | 阶段四：国内网络加速——多源回退 + Cloudflare CDN |
| AF-13 | 步骤 | 安装脚本实现多源回退逻辑：优先下载 Cloudflare CDN 托管的 zip，失败则回退至 GitHub Archive，最后尝试 jsDelivr       | 阶段四：国内网络加速——多源回退 + Cloudflare CDN |
| AF-14 | 事实 | 多源回退策略中每个下载源设置 10-15 秒超时，以确保快速切换至可用源                                                  | 阶段四：国内网络加速——多源回退 + Cloudflare CDN |
| AF-15 | 步骤 | 落地页 i18n 配置中，中文用户显示 `js-eyes.com` 域名的安装命令，英文用户显示 `raw.githubusercontent.com` 命令       | 阶段四：国内网络加速——多源回退 + Cloudflare CDN |
| AF-16 | 经验 | 单一分发渠道的安全策略不应成为项目推广瓶颈，提供自主安装脚本是解耦市场依赖的正确做法                               | 经验总结 > 市场分发 ≠ 唯一分发                  |
| AF-17 | 经验 | curl/PowerShell 脚本配合 GitHub Pages 和 Cloudflare 是覆盖主流 OS 且成本最低的安装基础设施方案                     | 经验总结 > curl 脚本是最轻量的安装基础设施      |
| AF-18 | 经验 | 针对国内网络场景，构建“自有域名→GitHub→jsDelivr"的多源回退链并设置短超时，是成本最低的可靠方案                     | 经验总结 > 多源回退是国内场景的标配             |
| AF-19 | 经验 | 真正的本地化（i18n）不仅是文字翻译，还包括根据用户地域提供可访问的资源 URL                                         | 经验总结 > i18n 不只是翻译文字                  |
| AF-20 | 判断 | Agent-First 的核心含义是项目自主掌控从脚本托管、下载源到安装流程的全链路，不依赖第三方市场审核策略                 | 经验总结 > Agent-First 意味着自主可控           |
