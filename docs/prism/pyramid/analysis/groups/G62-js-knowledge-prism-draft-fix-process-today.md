# G62: Draft 机制的时区修复与今日产出处理必须强制采用本地日期计算并引入草稿状态流转

> 解决 UTC 时间截取导致的“今天”判断错误，通过 `draft: true` 标记实现当日产出的延迟定稿，确保知识棱镜在跨时区环境下的数据一致性。

## 包含的 Atoms

| 编号  | 来源                                       | 内容摘要                                                                                         |
| ----- | ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| JD-01 | js-knowledge-prism-draft-fix-process-today | Draft 机制在 date-driven 策略下将当天 output 标记为 `draft: true`，待 journal 增量更新时重新生成 |
| JD-02 | js-knowledge-prism-draft-fix-process-today | CLI 执行前需 source 或 export 加载 `.env` 文件以读取 `KNOWLEDGE_PRISM` 相关环境变量配置          |
| JD-03 | js-knowledge-prism-draft-fix-process-today | 若 atoms 缩写已被占用，process 阶段应跳过该 journal 的 atom 提取                                 |
| JD-04 | js-knowledge-prism-draft-fix-process-today | `new Date().toISOString().slice(0, 10)` 返回的是 UTC 日期字符串，而非本地日期                    |
| JD-05 | js-knowledge-prism-draft-fix-process-today | UTC+8 时区下，UTC 时间晚间对应本地次日凌晨，直接用 UTC 日期判断“今天”会导致逻辑错误              |
| JD-06 | js-knowledge-prism-draft-fix-process-today | 获取本地日期字符串应使用 `getFullYear()`、`getMonth()+1` 和 `getDate()` 组合并补零格式化         |
| JD-07 | js-knowledge-prism-draft-fix-process-today | 修复时需同时修改 `lib/output.mjs` 的 autoWrite 块和 `lib/date-driven-kl.mjs` 的 `detectStaleKls` |
| JD-08 | js-knowledge-prism-draft-fix-process-today | Output 命令需加 `--force` 参数才能强制重新生成已存在的文件                                       |
| JD-09 | js-knowledge-prism-draft-fix-process-today | 当天生成的 output 文件必须包含 `draft: true` frontmatter，次日自动定稿                           |
| JD-10 | js-knowledge-prism-draft-fix-process-today | 涉及“今天”判断的业务逻辑必须强制使用本地日期计算，不可依赖 ISO 字符串截取                        |

## 组内逻辑顺序

1. **问题诊断** (JD-04, JD-05)：指出 UTC 日期截取在特定时区下的逻辑谬误。
2. **解决方案核心** (JD-06, JD-10)：确立本地日期计算的标准方法。
3. **业务逻辑重构** (JD-01, JD-09)：引入 Draft 状态流转机制，处理当日产出的不确定性。
4. **代码落地细节** (JD-07, JD-08)：明确需修改的具体文件模块及强制刷新参数。
5. **前置与环境依赖** (JD-02, JD-03)：补充 CLI 环境变量加载及原子缩写冲突的处理规则。
