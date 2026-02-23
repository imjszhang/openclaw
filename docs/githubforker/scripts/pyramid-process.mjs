#!/usr/bin/env node

// Pyramid incremental processor: journal -> atoms -> groups -> synthesis
// Uses openclaw main agent with local model to extract knowledge atoms.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const { values: flags } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    "auto-write": { type: "boolean", default: false },
    stage: { type: "string", default: "3" },
    file: { type: "string" },
    thinking: { type: "string", default: "low" },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: true,
});

if (flags.help) {
  console.log(`
用法: node docs/githubforker/scripts/pyramid-process.mjs [选项]

金字塔增量处理：自动从 journal 提取 atoms，更新 groups 和 synthesis。

选项:
  --dry-run            只显示待处理列表和 prompt 预览，不调用模型
  --auto-write         阶段 2/3 自动写入文件（默认只输出建议到终端）
  --stage <1|2|3>      只执行到指定阶段（默认 3）
                         1 = 提取 atoms
                         2 = + groups 更新
                         3 = + synthesis 更新
  --file <filename>    只处理指定 journal（不含路径，如 skills-guide.md）
  --thinking <level>   传递给 openclaw 的思考级别（默认 low）
  --verbose            显示完整 prompt 和模型原始响应
  -h, --help           显示帮助
`);
  process.exit(0);
}

const DRY_RUN = flags["dry-run"];
const AUTO_WRITE = flags["auto-write"];
const MAX_STAGE = Number(flags.stage);
const ONLY_FILE = flags.file;
const THINKING = flags.thinking;
const VERBOSE = flags.verbose;

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const BASE = resolve(SCRIPT_DIR, "..");
const JOURNAL_DIR = join(BASE, "journal");
const ATOMS_DIR = join(BASE, "pyramid", "analysis", "atoms");
const ATOMS_README = join(ATOMS_DIR, "README.md");
const GROUPS_DIR = join(BASE, "pyramid", "analysis", "groups");
const GROUPS_INDEX = join(GROUPS_DIR, "INDEX.md");
const SYNTHESIS_PATH = join(BASE, "pyramid", "analysis", "synthesis.md");
const REPO_ROOT = resolve(BASE, "..", "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg) {
  console.log(`  ${msg}`);
}
function heading(msg) {
  console.log(`\n${"=".repeat(60)}\n  ${msg}\n${"=".repeat(60)}`);
}
function warn(msg) {
  console.log(`  ⚠ ${msg}`);
}

/** List YYYY-MM-DD sub-dirs under journal/ */
function listDateDirs(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && statSync(join(dir, d)).isDirectory())
    .toSorted();
}

/** List .md files in a directory (non-recursive). */
function listMdFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md" && f !== "INDEX.md");
}

/** Read file as UTF-8 string. */
function read(p) {
  return readFileSync(p, "utf-8");
}

/** Parse the abbreviation table from atoms/README.md into a Map<filename, abbrev>. */
function parseAbbrevTable(readmeContent) {
  const map = new Map();
  const usedAbbrevs = new Set();
  for (const line of readmeContent.split("\n")) {
    const m = line.match(/^\|\s*([A-Z]{2})\s*\|\s*(\S+)\s*\|/);
    if (m) {
      map.set(m[2], m[1]);
      usedAbbrevs.add(m[1]);
    }
  }
  return { fileToAbbrev: map, usedAbbrevs };
}

/** Check if an atom file is a placeholder (contains "（待提取）"). */
function isPlaceholder(atomPath) {
  if (!existsSync(atomPath)) {
    return false;
  }
  return read(atomPath).includes("（待提取）");
}

/** Extract the title (first # heading) from a markdown file. */
function extractTitle(content) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : "(无标题)";
}

// ---------------------------------------------------------------------------
// Discovery: find unprocessed journals
// ---------------------------------------------------------------------------

function discoverJournals() {
  const abbrevReadme = read(ATOMS_README);
  const { fileToAbbrev, usedAbbrevs } = parseAbbrevTable(abbrevReadme);

  const results = [];

  for (const dateDir of listDateDirs(JOURNAL_DIR)) {
    const month = dateDir.slice(0, 7); // YYYY-MM
    const mdFiles = listMdFiles(join(JOURNAL_DIR, dateDir));

    for (const mdFile of mdFiles) {
      const stem = mdFile.replace(/\.md$/, "");
      const journalPath = join(JOURNAL_DIR, dateDir, mdFile);
      const atomMonthDir = join(ATOMS_DIR, month);
      const atomPath = join(atomMonthDir, mdFile);

      if (ONLY_FILE && mdFile !== ONLY_FILE) {
        continue;
      }

      if (!existsSync(atomPath)) {
        results.push({
          type: "A",
          stem,
          journalPath,
          atomPath,
          atomMonthDir,
          dateDir,
          month,
          abbrev: null,
        });
      } else if (isPlaceholder(atomPath)) {
        const abbrev = fileToAbbrev.get(stem) || null;
        results.push({
          type: "B",
          stem,
          journalPath,
          atomPath,
          atomMonthDir,
          dateDir,
          month,
          abbrev,
        });
      }
      // else: already complete, skip
    }
  }

  return { results, fileToAbbrev, usedAbbrevs };
}

// ---------------------------------------------------------------------------
// Stage 1: Atom extraction
// ---------------------------------------------------------------------------

const ATOM_EXAMPLE = `# OpenClaw 个人知识库架构设计过程

> 来源：[../../../../journal/2026-02-22/knowledge-base-architecture-design.md](../../../../journal/2026-02-22/knowledge-base-architecture-design.md)
> 缩写：KA

## Atoms

| 编号  | 类型 | 内容                                                                                               | 原文定位                    |
| ----- | ---- | -------------------------------------------------------------------------------------------------- | --------------------------- |
| KA-01 | 事实 | 积累了 20 篇按日期组织的原始学习笔记，适合记录过程但不适合教学或知识复用                           | 背景                        |
| KA-02 | 判断 | 按时间组织的文档存在四个问题：无阅读顺序、主题散落在时间线、深浅混杂、缺少中心论点                 | 问题分析                    |
| KA-03 | 事实 | 自上而下方法：从结论出发，用 SCQA 构造序言验证，逐层展开并保证 MECE，适用于结论清晰时              | 金字塔原理 > 自上而下       |`;

function buildAtomPrompt(entry, usedAbbrevs) {
  const journalContent = read(entry.journalPath);
  const journalTitle = extractTitle(journalContent);
  const relPath = `../../../../journal/${entry.dateDir}/${basename(entry.journalPath)}`;

  let abbrevInstruction = "";
  if (entry.type === "A") {
    const taken = [...usedAbbrevs].toSorted((a, b) => a.localeCompare(b)).join(", ");
    abbrevInstruction = `
## 缩写分配

请为这篇 journal 分配一个 2 字母大写缩写（用于 atom 编号前缀）。
已使用的缩写（不可重复）：${taken}
请选择一个有意义且未被占用的缩写。在输出的第二行 "> 缩写：XX" 处填入。
`;
  } else {
    abbrevInstruction = `
## 缩写

该 journal 的缩写为：**${entry.abbrev}**，请使用 ${entry.abbrev}-01, ${entry.abbrev}-02, ... 作为编号。
`;
  }

  return `你是一个知识库助手。你的任务是从下方的 journal 原文中提取信息单元（atoms）。

## 输出要求

请直接输出完整的 atom markdown 文件内容（不要包裹在代码块中）。严格遵循以下格式：

1. 第一行：# [journal 的标题]
2. 空行后：> 来源：[相对路径链接](相对路径链接)
3. 紧接：> 缩写：XX
4. 空行后：## Atoms
5. 然后是 atom 表格

## Atom 提取规则

- 每个 atom 是不可再拆的最小信息单元
- 类型只能是：事实、步骤、经验、判断
  - 事实：客观存在的概念、定义、架构描述
  - 步骤：具体的操作方法、命令、配置过程
  - 经验：踩坑记录、最佳实践、非显而易见的发现
  - 判断：主观评估、可行性结论、取舍决策
- "内容"列用一句话简明描述该知识点
- "原文定位"列写出在 journal 中的章节名
- 编号从 01 开始递增
${abbrevInstruction}
## 参考范例（仅展示前几行）

${ATOM_EXAMPLE}

## 本次提取的 journal 信息

- 标题：${journalTitle}
- 来源路径：${relPath}
- 日期目录：${entry.dateDir}

## journal 原文

${journalContent}
`;
}

// ---------------------------------------------------------------------------
// Agent caller
// ---------------------------------------------------------------------------

const MAX_DIRECT_ARG_LEN = 28_000;
const TMP_PROMPT = join(SCRIPT_DIR, ".tmp-prompt.md");

// Each call gets a fresh session via unique --to value, preventing context accumulation.
let callCounter = 0;

function callAgent(prompt) {
  callCounter++;
  const sessionTo = `+1${String(Date.now()).slice(-9)}${String(callCounter).padStart(1, "0")}`;

  if (VERBOSE) {
    log(
      `调用 openclaw agent (prompt ${prompt.length} chars, session=${sessionTo}, method: ${prompt.length < MAX_DIRECT_ARG_LEN ? "direct" : "tmpfile"})`,
    );
  }

  const baseFlags = [
    "agent",
    "--agent",
    "main",
    "--local",
    "--thinking",
    THINKING,
    "--json",
    "--timeout",
    "1200",
    "--to",
    sessionTo,
  ];

  // Short prompts: pass directly as argument (no shell needed).
  // Long prompts: write to temp file + bash variable to bypass Windows arg length limit.
  const useTmpFile = prompt.length >= MAX_DIRECT_ARG_LEN;
  let proc;

  if (useTmpFile) {
    writeFileSync(TMP_PROMPT, prompt, "utf-8");
    const tmpPath = TMP_PROMPT.replace(/\\/g, "/");
    const repoPath = REPO_ROOT.replace(/\\/g, "/");
    const flagsStr = baseFlags.map((f) => `'${f}'`).join(" ");
    const bashScript = `msg=$(<'${tmpPath}') && exec node '${repoPath}/scripts/run-node.mjs' ${flagsStr} --message "$msg"`;
    proc = spawnSync("bash", ["-c", bashScript], {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 1200_000,
    });
  } else {
    const args = [join(REPO_ROOT, "scripts", "run-node.mjs"), ...baseFlags, "--message", prompt];
    proc = spawnSync("node", args, {
      cwd: REPO_ROOT,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
      timeout: 1200_000,
    });
  }

  if (useTmpFile) {
    try {
      unlinkSync(TMP_PROMPT);
    } catch {}
  }

  const output = (proc.stdout || "") + (proc.stderr || "");

  if (proc.error) {
    throw new Error(`spawn error: ${proc.error.message}`);
  }

  if (VERBOSE && proc.status !== 0) {
    warn(`命令退出码: ${proc.status}`);
  }

  return parseAgentResponse(output);
}

/**
 * Parse the JSON response from `openclaw agent --json`.
 * The response may contain non-JSON preamble (pnpm banner etc.), so we find
 * the first { or [ and parse from there.
 */
function parseAgentResponse(raw) {
  if (VERBOSE) {
    log("--- 原始响应 ---");
    console.log(raw.slice(0, 2000));
    log("--- 响应结束 ---");
  }

  // Try to find JSON in the output
  const jsonStart = raw.indexOf("{");
  if (jsonStart >= 0) {
    try {
      const json = JSON.parse(raw.slice(jsonStart));
      // The agent response shape varies; try common paths
      // openclaw agent --json returns { payloads: [{ text }], meta }
      const text =
        json.payloads?.[0]?.text ||
        json.reply?.text ||
        json.reply?.content ||
        json.content ||
        json.text ||
        json.message?.content ||
        json.message?.text ||
        json.result?.text ||
        json.result?.content;
      if (text) {
        return text;
      }
      // Fallback: stringify for debugging
      return JSON.stringify(json, null, 2);
    } catch {
      // Not valid JSON from that point
    }
  }

  // Fallback: strip pnpm banner lines (starting with >) and return the rest
  const lines = raw.split("\n");
  const contentLines = lines.filter(
    (l) => !l.startsWith("> ") && !l.startsWith("openclaw@") && l.trim() !== "",
  );
  return contentLines.join("\n").trim();
}

// ---------------------------------------------------------------------------
// Atom writer
// ---------------------------------------------------------------------------

/**
 * Extract the abbreviation from model output ("> 缩写：XX" line).
 * Returns null if not found.
 */
function extractAbbrevFromOutput(output) {
  const m = output.match(/>\s*缩写[：:]\s*([A-Z]{2})/);
  return m ? m[1] : null;
}

/**
 * Validate that the output looks like a valid atom file:
 * has a title, source line, atoms table header.
 */
function validateAtomOutput(output) {
  const issues = [];
  if (!output.match(/^#\s+/m)) {
    issues.push("缺少标题行（# ...）");
  }
  if (!output.includes("> 来源：")) {
    issues.push("缺少来源行（> 来源：...）");
  }
  if (!output.includes("## Atoms")) {
    issues.push("缺少 ## Atoms 标题");
  }
  if (!output.includes("| 编号")) {
    issues.push("缺少 atom 表格");
  }
  // Check there's at least one data row (XX-01 pattern)
  if (!output.match(/\|\s*[A-Z]{2}-\d{2}\s*\|/)) {
    issues.push("未找到任何 atom 行（如 XX-01）");
  }
  return issues;
}

/** Strip markdown code fences if model wrapped output in them. */
function stripCodeFences(text) {
  const fenceMatch = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/m);
  if (fenceMatch) {
    return fenceMatch[1];
  }
  // Also try if the entire output is wrapped
  const fullMatch = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*)\n```\s*$/);
  if (fullMatch) {
    return fullMatch[1];
  }
  return text;
}

function registerAbbrev(stem, abbrev, month) {
  const readme = read(ATOMS_README);
  const newRow = `| ${abbrev}   | ${stem.padEnd(37)} | ${month} |`;
  const lastPipeLineIdx = readme.lastIndexOf("| ");
  if (lastPipeLineIdx < 0) {
    warn("无法定位缩写映射表末尾，请手动添加缩写");
    return;
  }
  const insertPos = readme.indexOf("\n", lastPipeLineIdx);
  const updated = readme.slice(0, insertPos) + "\n" + newRow + readme.slice(insertPos);
  writeFileSync(ATOMS_README, updated, "utf-8");
  log(`已在 atoms/README.md 注册缩写 ${abbrev} → ${stem}`);
}

async function processAtom(entry, usedAbbrevs) {
  const prompt = buildAtomPrompt(entry, usedAbbrevs);

  if (VERBOSE) {
    log(`--- Prompt 预览 (${prompt.length} 字符) ---`);
    console.log(prompt.slice(0, 500));
    log("...");
  }

  if (DRY_RUN) {
    log(`[dry-run] 将调用 openclaw agent 处理 ${entry.stem}`);
    log(`[dry-run] Prompt 长度: ${prompt.length} 字符`);
    return null;
  }

  log("调用 openclaw agent...");
  let output;
  try {
    output = callAgent(prompt);
  } catch (err) {
    warn(`调用失败: ${err.message?.slice(0, 200)}`);
    return null;
  }

  output = stripCodeFences(output.trim());

  const issues = validateAtomOutput(output);
  if (issues.length > 0) {
    warn(`输出格式校验失败:\n    ${issues.join("\n    ")}`);
    warn("跳过写入，原始输出:");
    console.log(output.slice(0, 1000));
    return null;
  }

  // For type A, extract & validate abbreviation
  let abbrev = entry.abbrev;
  if (entry.type === "A") {
    abbrev = extractAbbrevFromOutput(output);
    if (!abbrev) {
      warn("模型输出中未找到缩写，跳过");
      return null;
    }
    if (usedAbbrevs.has(abbrev)) {
      warn(`模型生成的缩写 ${abbrev} 已被占用，跳过`);
      return null;
    }
  }

  // Ensure month directory exists
  if (!existsSync(entry.atomMonthDir)) {
    mkdirSync(entry.atomMonthDir, { recursive: true });
  }

  writeFileSync(entry.atomPath, output + "\n", "utf-8");
  log(`✓ 已写入 ${relative(BASE, entry.atomPath)}`);

  // Register abbreviation for type A
  if (entry.type === "A") {
    registerAbbrev(entry.stem, abbrev, entry.month);
    usedAbbrevs.add(abbrev);
  }

  return { abbrev, atomPath: entry.atomPath };
}

// ---------------------------------------------------------------------------
// Stage 2: Groups update
// ---------------------------------------------------------------------------

/** Find the highest existing group number (e.g. G11 -> 11). */
function findMaxGroupNum() {
  const groupFiles = listMdFiles(GROUPS_DIR).filter((f) => /^G\d+/.test(f));
  let max = 0;
  for (const f of groupFiles) {
    const m = f.match(/^G(\d+)/);
    if (m) {
      max = Math.max(max, Number(m[1]));
    }
  }
  return max;
}

function buildGroupsPrompt(newAtomPaths, autoWrite) {
  const newAtomsContent = newAtomPaths
    .map((p) => {
      const content = read(p);
      return `### ${basename(p)}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  const groupsIndex = read(GROUPS_INDEX);

  const groupFiles = listMdFiles(GROUPS_DIR)
    .filter((f) => f.startsWith("G"))
    .toSorted((a, b) => a.localeCompare(b));
  const groupContents = groupFiles
    .map((f) => {
      const content = read(join(GROUPS_DIR, f));
      return `#### ${f}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  const maxG = findMaxGroupNum();
  const today = new Date().toISOString().slice(0, 10);

  if (!autoWrite) {
    return `你是一个知识库助手。以下是刚提取的新 atoms 文件，以及现有的分组（groups）结构。

## 任务

请分析新 atoms，给出分组建议：
1. 哪些新 atoms 应归入哪些现有 group？（列出 atom 编号 → group 编号）
2. 是否需要新建 group？如果需要，给出编号（接着 G${String(maxG).padStart(2, "0")} 继续）、观点句和包含的 atoms。
3. 是否有现有 group 需要拆分或合并？

请用中文回答，用表格或列表清晰列出建议。

## 现有分组

${groupsIndex}

### 各 group 现有内容

${groupContents}

## 新提取的 Atoms

${newAtomsContent}
`;
  }

  // auto-write mode: structured output
  return `你是一个知识库助手。以下是刚提取的新 atoms，以及现有的全部分组（groups）文件内容。

## 任务

分析新 atoms，执行分组更新。输出必须使用下面的分隔符格式，脚本将自动解析并写入文件。

### 操作类型

1. **新建 group**：如果新 atoms 形成了与现有 group 都不匹配的新主题，创建新 group。编号从 G${String(maxG + 1).padStart(2, "0")} 开始。
2. **更新现有 group**：如果新 atoms 应归入现有 group，输出该 group 的完整更新后内容（包含旧 atoms + 新 atoms）。
3. **不归组的 atoms**：如果某些 atoms 暂时无法归组，在 CHANGELOG 中注明。

### 输出格式（严格遵守，不要添加任何额外文字）

对每个新建或更新的 group，输出一个块：

\`\`\`
=== GROUP: G12-topic-slug.md ===
（完整的 group 文件内容，遵循下方模板）
=== END ===
\`\`\`

所有 group 块输出完毕后，输出 INDEX 更新块：

\`\`\`
=== INDEX_ROWS ===
（只输出新增或修改的行，每行格式与 INDEX.md 表格一致）
| G12 | 观点句 | atom数量 | 来源月份跨度 |
=== END ===
\`\`\`

最后输出 CHANGELOG 块：

\`\`\`
=== CHANGELOG ===
| ${today} | 操作描述 | 原因说明 |
=== END ===
\`\`\`

### Group 文件模板

\`\`\`markdown
# GXX: [一句有态度的观点句]

> 一句有态度的判断句，概括这组信息单元说明了什么。

## 包含的 Atoms

| 编号  | 来源                     | 内容摘要 |
| ----- | ------------------------ | -------- |
| XX-01 | source-file-stem         | ...      |

## 组内逻辑顺序

说明 atoms 的排列逻辑（时间顺序 / 结构顺序 / 程度顺序）。
\`\`\`

### 规则

- 每个 group 的观点句必须是一句有态度的判断句
- "来源"列填 journal 文件名（不含 .md）
- 更新现有 group 时，保留原有的所有 atoms，在表格末尾追加新 atoms
- atom 数量统计必须准确
- 来源月份跨度包括所有 atom 的来源月份

## 现有分组 INDEX

${groupsIndex}

## 现有 Group 文件完整内容

${groupContents}

## 新提取的 Atoms

${newAtomsContent}
`;
}

// ---------------------------------------------------------------------------
// Stage 2: parse & write helpers
// ---------------------------------------------------------------------------

/** Parse structured group output with === delimiters. */
function parseGroupsOutput(raw) {
  const result = { groups: [], indexRows: [], changelog: [] };

  // Parse GROUP blocks
  const groupRegex = /=== GROUP: (\S+\.md) ===([\s\S]*?)(?:=== END ===)/g;
  let m;
  while ((m = groupRegex.exec(raw)) !== null) {
    result.groups.push({ filename: m[1].trim(), content: m[2].trim() });
  }

  // Parse INDEX_ROWS block
  const indexMatch = raw.match(/=== INDEX_ROWS ===([\s\S]*?)(?:=== END ===)/);
  if (indexMatch) {
    result.indexRows = indexMatch[1]
      .trim()
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.includes("---"));
  }

  // Parse CHANGELOG block
  const changelogMatch = raw.match(/=== CHANGELOG ===([\s\S]*?)(?:=== END ===)/);
  if (changelogMatch) {
    result.changelog = changelogMatch[1]
      .trim()
      .split("\n")
      .filter((l) => l.startsWith("|") && !l.includes("---"));
  }

  return result;
}

/** Write group files and update INDEX.md. */
function writeGroupsOutput(parsed) {
  let written = 0;
  let updated = 0;

  for (const g of parsed.groups) {
    const gPath = join(GROUPS_DIR, g.filename);
    const isNew = !existsSync(gPath);
    writeFileSync(gPath, g.content + "\n", "utf-8");
    if (isNew) {
      written++;
      log(`✓ 新建 ${g.filename}`);
    } else {
      updated++;
      log(`✓ 更新 ${g.filename}`);
    }
  }

  // Update INDEX.md: add new rows to the table and append changelog entries
  if (parsed.indexRows.length > 0 || parsed.changelog.length > 0) {
    let index = read(GROUPS_INDEX);

    // Insert new/updated INDEX rows before the changelog section
    if (parsed.indexRows.length > 0) {
      // Find the blank line before "## 变更日志"
      const changelogHeadingIdx = index.indexOf("## 变更日志");
      if (changelogHeadingIdx >= 0) {
        // Find the last table row before the heading (look for last "|" line in the table section)
        const tableSection = index.slice(0, changelogHeadingIdx);
        const lastPipeIdx = tableSection.lastIndexOf("|");
        if (lastPipeIdx >= 0) {
          const insertAfterNewline = tableSection.indexOf("\n", lastPipeIdx);
          const insertPos = insertAfterNewline >= 0 ? insertAfterNewline : tableSection.length;

          // Check which rows are truly new (not already in the index)
          const newRows = parsed.indexRows.filter((row) => {
            const gNumMatch = row.match(/\|\s*(G\d+)\s*\|/);
            if (!gNumMatch) {
              return false;
            }
            return !index.includes(gNumMatch[1] + " ");
          });

          // For updated existing group rows, replace in-place
          const updatedRows = parsed.indexRows.filter((row) => {
            const gNumMatch = row.match(/\|\s*(G\d+)\s*\|/);
            if (!gNumMatch) {
              return false;
            }
            return index.includes(gNumMatch[1] + " ");
          });

          for (const uRow of updatedRows) {
            const gNumMatch = uRow.match(/\|\s*(G\d+)\s*\|/);
            if (gNumMatch) {
              const oldRowRegex = new RegExp(`^\\|\\s*${gNumMatch[1]}\\s*\\|.*$`, "m");
              index = index.replace(oldRowRegex, uRow.trim());
            }
          }

          if (newRows.length > 0) {
            index = index.slice(0, insertPos) + "\n" + newRows.join("\n") + index.slice(insertPos);
          }
        }
      }
    }

    if (parsed.changelog.length > 0) {
      // Append changelog entries at the end
      const trimmed = index.trimEnd();
      index = trimmed + "\n" + parsed.changelog.join("\n") + "\n";
    }

    writeFileSync(GROUPS_INDEX, index, "utf-8");
    log(`✓ 已更新 INDEX.md (${parsed.indexRows.length} 行索引, ${parsed.changelog.length} 行日志)`);
  }

  return { written, updated };
}

// ---------------------------------------------------------------------------
// Stage 3: Synthesis update
// ---------------------------------------------------------------------------

function buildSynthesisPrompt(newAtomPaths, autoWrite) {
  const synthesisContent = read(SYNTHESIS_PATH);

  // Also read the latest groups INDEX for context
  const groupsIndex = read(GROUPS_INDEX);

  const newAtomsContent = newAtomPaths
    .map((p) => {
      const content = read(p);
      return `### ${basename(p)}\n\n${content}`;
    })
    .join("\n\n---\n\n");

  const today = new Date().toISOString().slice(0, 10);

  if (!autoWrite) {
    return `你是一个知识库助手。以下是当前的 synthesis（顶层观点候选列表）和新提取的 atoms。

## 任务

请评估：
1. 现有顶层观点候选是否仍然准确？
2. 新 atoms 是否支持现有候选，还是暗示需要新增/修改候选？
3. 候选间的关系描述是否需要更新？

请用中文回答，给出具体建议。如果无需修改，简要说明即可。

## 当前 Synthesis

${synthesisContent}

## 当前分组 INDEX（含最新 groups）

${groupsIndex}

## 新提取的 Atoms

${newAtomsContent}
`;
  }

  // auto-write mode: output complete updated file
  return `你是一个知识库助手。请基于新 atoms 和当前 groups 更新 synthesis.md 文件。

## 任务

1. 评估现有顶层观点候选是否仍然准确
2. 判断新 atoms 是否支持现有候选，或需要新增/修改/升级候选
3. 更新候选间的关系描述
4. 在修订记录表中追加今天（${today}）的变更条目

## 输出要求

直接输出完整的、更新后的 synthesis.md 文件内容（不要用代码块包裹）。

保持文件的现有结构不变：
- # 收敛（Synthesis）标题和说明
- ## 顶层观点候选 表格
- ### 待成熟候选 表格（如适用）
- ## 候选间的关系
- 视角索引链接
- ## 修订记录 表格

### 规则

- 只在有充分证据时才新增/升级/修改候选
- 保持 S1, S2, ... 编号连续
- 待成熟候选用 S*（如 S7*）标记
- 当待成熟候选获得第二个 group 支撑时，升级为正式候选
- 如果没有需要修改的地方，输出原文即可（仍需追加修订记录说明"无变更"）
- 修订记录的日期格式为 YYYY-MM-DD

## 当前 synthesis.md 完整内容

${synthesisContent}

## 当前分组 INDEX（含最新 groups）

${groupsIndex}

## 新提取的 Atoms

${newAtomsContent}
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  heading("金字塔增量处理");
  log(
    `配置: stage=${MAX_STAGE}, thinking=${THINKING}, dry-run=${DRY_RUN}, auto-write=${AUTO_WRITE}`,
  );

  // ── Stage 1: Discover & extract atoms ──
  heading("阶段 1: 发现未处理的 journal");

  const { results, usedAbbrevs } = discoverJournals();

  if (results.length === 0) {
    log("所有 journal 已处理完毕，无待处理条目。");
    if (MAX_STAGE < 2) {
      return;
    }
  }

  // Show summary table
  log(`发现 ${results.length} 个待处理条目:\n`);
  console.log("  类型  | 日期       | 文件名");
  console.log("  ----- | ---------- | ------");
  for (const r of results) {
    console.log(`  ${r.type === "A" ? "新建" : "填充"}  | ${r.dateDir} | ${r.stem}.md`);
  }
  console.log();

  const newAtomPaths = [];

  if (MAX_STAGE >= 1 && results.length > 0) {
    heading("阶段 1: 提取 Atoms");

    for (let i = 0; i < results.length; i++) {
      const entry = results[i];
      log(
        `\n[${i + 1}/${results.length}] ${entry.type === "A" ? "新建" : "填充"}: ${entry.stem}.md`,
      );
      const result = await processAtom(entry, usedAbbrevs);
      if (result) {
        newAtomPaths.push(result.atomPath);
      }
    }

    log(`\n阶段 1 完成: ${newAtomPaths.length}/${results.length} 个 atom 文件已处理`);
  }

  // ── Stage 2: Groups update ──
  if (MAX_STAGE >= 2 && newAtomPaths.length > 0) {
    heading(AUTO_WRITE ? "阶段 2: Groups 分组自动更新" : "阶段 2: Groups 分组建议");

    const prompt = buildGroupsPrompt(newAtomPaths, AUTO_WRITE);

    if (VERBOSE) {
      log(`--- Groups prompt 预览 (${prompt.length} 字符) ---`);
      console.log(prompt.slice(0, 500));
    }

    if (DRY_RUN) {
      log(`[dry-run] 将调用 openclaw agent ${AUTO_WRITE ? "自动更新" : "生成建议"}`);
      log(`[dry-run] Prompt 长度: ${prompt.length} 字符`);
    } else {
      log("调用 openclaw agent...");
      try {
        const output = callAgent(prompt);

        if (AUTO_WRITE) {
          const cleaned = stripCodeFences(output.trim());
          const parsed = parseGroupsOutput(cleaned);

          if (parsed.groups.length === 0 && parsed.indexRows.length === 0) {
            warn("模型未输出任何 group 块，打印原始输出供参考：");
            console.log(cleaned.slice(0, 2000));
          } else {
            const { written, updated } = writeGroupsOutput(parsed);
            log(`\n阶段 2 完成: ${written} 个新 group, ${updated} 个更新`);
          }
        } else {
          log("\n--- 分组建议 ---\n");
          console.log(output);
          log("\n--- 建议结束（请人工审核后手动更新 groups 文件）---");
        }
      } catch (err) {
        warn(`调用失败: ${err.message?.slice(0, 200)}`);
      }
    }
  } else if (MAX_STAGE >= 2 && newAtomPaths.length === 0) {
    log("\n无新 atoms，跳过阶段 2");
  }

  // ── Stage 3: Synthesis update ──
  if (MAX_STAGE >= 3 && newAtomPaths.length > 0) {
    heading(AUTO_WRITE ? "阶段 3: Synthesis 自动更新" : "阶段 3: Synthesis 检查建议");

    const prompt = buildSynthesisPrompt(newAtomPaths, AUTO_WRITE);

    if (DRY_RUN) {
      log(`[dry-run] 将调用 openclaw agent ${AUTO_WRITE ? "自动更新" : "检查"} synthesis`);
      log(`[dry-run] Prompt 长度: ${prompt.length} 字符`);
    } else {
      log("调用 openclaw agent...");
      try {
        const output = callAgent(prompt);

        if (AUTO_WRITE) {
          const cleaned = stripCodeFences(output.trim());

          // Validate: should start with "# 收敛" and contain key sections
          if (!cleaned.includes("# 收敛") || !cleaned.includes("## 顶层观点候选")) {
            warn("模型输出不像有效的 synthesis.md，打印原始输出供参考：");
            console.log(cleaned.slice(0, 2000));
          } else {
            writeFileSync(SYNTHESIS_PATH, cleaned + "\n", "utf-8");
            log(`✓ 已更新 ${relative(BASE, SYNTHESIS_PATH)}`);
          }
        } else {
          log("\n--- Synthesis 检查建议 ---\n");
          console.log(output);
          log("\n--- 建议结束（请人工审核后手动更新 synthesis.md）---");
        }
      } catch (err) {
        warn(`调用失败: ${err.message?.slice(0, 200)}`);
      }
    }
  } else if (MAX_STAGE >= 3 && newAtomPaths.length === 0) {
    log("\n无新 atoms，跳过阶段 3");
  }

  heading("处理完毕");
}

main().catch((err) => {
  console.error("致命错误:", err);
  process.exit(1);
});
