# js-knowledge-prism: Draft 机制时区修复 + 今日产出处理

> 日期：2026-03-12
> 项目：js-knowledge-prism
> 类型：Bug 修复 + 执行记录
> 来源：Cursor Agent 对话

---

## 背景

用户要求处理 `d:\github\fork\openclaw\docs\prism` 知识库今天的产出。此前已实现 Draft 草稿机制（date-driven 策略下，当天 output 标记 `draft: true`，journal 增量更新时 re-expand + 重新生成）。

## 执行过程

### 1. 配置与 CLI 调用

- 用户提示 `.openclaw` 下有配置，技能需从该处读取
- 确认 API 配置在 `d:\.openclaw\.env`：`KNOWLEDGE_PRISM_API_BASE_URL`、`KNOWLEDGE_PRISM_API_MODEL`、`KNOWLEDGE_PRISM_API_KEY`
- `config.mjs` 已支持从环境变量读取 API，CLI 需 `source` 或 `export` 加载 `.env` 后执行

### 2. Process 执行

```bash
cd d:/github/fork/openclaw/docs/prism
node d:/github/my/js-knowledge-prism/bin/cli.mjs process
```

- 发现 2 个待处理 journal：2026-01-19、2026-03-11（atoms 缩写被占用，跳过 atom 提取）
- 阶段 3 synthesis 检查完成

### 3. Output 执行

```bash
node d:/github/my/js-knowledge-prism/bin/cli.mjs output \
  --perspective P23-practice-diary --template practice-diary --kl KL26 --force
```

- 首次生成：`2026-03-12.md` 未带 `draft: true` frontmatter

### 4. 时区 Bug 发现与修复

**原因**：`new Date().toISOString().slice(0, 10)` 返回 UTC 日期。UTC 2026-03-11 19:37 对应本地 2026-03-12 03:37，导致 `today` 与 `kl_date` 不匹配。

**修改**：

- `lib/output.mjs`（autoWrite 写入块）：使用 `getFullYear()` + `getMonth()` + `getDate()` 计算本地日期
- `lib/date-driven-kl.mjs`（`detectStaleKls`）：同样改为本地日期

```javascript
// 修复前
const today = new Date().toISOString().slice(0, 10);

// 修复后
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
```

### 5. 重新生成 Output

```bash
node ... output --perspective P23-practice-diary --template practice-diary --kl KL26 --force
```

- 生成结果正确带 `draft: true` frontmatter：

```yaml
---
draft: true
date: 2026-03-12
---
```

## 关键结论

1. **Draft 机制**：当天 output 带 `draft: true`，journal 增量更新时 cron 会 re-expand + 重新生成；次日不再加 draft，自动定稿
2. **时区**：涉及「今天」判断的逻辑必须使用本地日期，否则 UTC+8 时区下会出错
3. **CLI 与 OpenClaw**：CLI 可直接用 `.openclaw/.env` 加载 API 配置，执行 `process` 和 `output` 命令
