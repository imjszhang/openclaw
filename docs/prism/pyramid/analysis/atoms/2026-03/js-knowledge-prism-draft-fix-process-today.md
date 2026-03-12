# js-knowledge-prism: Draft 机制时区修复 + 今日产出处理

> 来源：[../../../../journal/2026-03-12/js-knowledge-prism-draft-fix-process-today.md](../../../../journal/2026-03-12/js-knowledge-prism-draft-fix-process-today.md)
> 缩写：JD

## Atoms

| 编号  | 类型 | 内容                                                                                             | 原文定位                     |
| ----- | ---- | ------------------------------------------------------------------------------------------------ | ---------------------------- |
| JD-01 | 事实 | Draft 机制在 date-driven 策略下将当天 output 标记为 `draft: true`，待 journal 增量更新时重新生成 | 背景                         |
| JD-02 | 步骤 | CLI 执行前需 source 或 export 加载 `.env` 文件以读取 `KNOWLEDGE_PRISM` 相关环境变量配置          | 1. 配置与 CLI 调用           |
| JD-03 | 经验 | 若 atoms 缩写已被占用，process 阶段应跳过该 journal 的 atom 提取                                 | 2. Process 执行              |
| JD-04 | 事实 | `new Date().toISOString().slice(0, 10)` 返回的是 UTC 日期字符串，而非本地日期                    | 4. 时区 Bug 发现与修复       |
| JD-05 | 经验 | UTC+8 时区下，UTC 时间晚间对应本地次日凌晨，直接用 UTC 日期判断“今天”会导致逻辑错误              | 4. 时区 Bug 发现与修复       |
| JD-06 | 步骤 | 获取本地日期字符串应使用 `getFullYear()`、`getMonth()+1` 和 `getDate()` 组合并补零格式化         | 4. 时区 Bug 发现与修复       |
| JD-07 | 步骤 | 修复时需同时修改 `lib/output.mjs` 的 autoWrite 块和 `lib/date-driven-kl.mjs` 的 `detectStaleKls` | 4. 时区 Bug 发现与修复       |
| JD-08 | 经验 | Output 命令需加 `--force` 参数才能强制重新生成已存在的文件                                       | 3. Output 执行 / 5. 重新生成 |
| JD-09 | 事实 | 当天生成的 output 文件必须包含 `draft: true` frontmatter，次日自动定稿                           | 关键结论                     |
| JD-10 | 判断 | 涉及“今天”判断的业务逻辑必须强制使用本地日期计算，不可依赖 ISO 字符串截取                        | 关键结论                     |
