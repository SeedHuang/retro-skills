# Docgen P1：一条 rule 的整文件生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development`（推荐）或 `executing-plans` 逐任务执行。步骤用 `- [ ]` 勾选跟踪。
>
> **本计划不执行任何 git 写操作**：每个任务收尾把改动留在工作区，最终由用户决定提交方式。

**Goal:** 用 `tools/docgen-spike/` 把 `rules/spec-testcase-gate.md` 从组件数据 + 模板整文件生成出来，并用 V1–V11 证明它逐字节相等、可重跑、可被 `npm run check` 守住。

**Architecture:** 三个纯模块（`specTestCaseGate.mjs` 数据/渲染/校验、`compare.mjs` 字节比对、`template.md` 结构模板）加一个编排层 `run.mjs`（CLI、13 个用例、gate、baseline、清理）。测试分三层：纯函数单测、e2e 用例、故障注入；`testcase` 文件是验收判据的唯一来源。

**Tech Stack:** Node ≥22 内置模块（`node:fs` / `node:path` / `node:crypto` / `node:assert` / `node:test` / `node:child_process` 仅编排层）；零第三方依赖；PowerShell + Git。

**Spec:** `docs/superpowers/specs/2026-10-18-docgen-rule-whole-file-design.md`

**Testcase:** `docs/superpowers/specs/2026-10-18-docgen-rule-whole-file-design-testcase.md`

## Global Constraints

- Node ≥22；零第三方依赖；纯模块不得 import `node:fs` / `node:child_process`。
- 所有落盘文件 LF、UTF-8、无 BOM、末尾恰一个 `\n`。
- target / template / baseline 默认只读；故障注入只写 `.tmp-test/**`。
- 嵌套进程一律 `--no-clean`；只有顶层 owner 清 `.tmp-test/` 与做哨兵自愈。
- 错误码与退出码严格按 spec §7.1；断言模式下「该码正是本例期望 → `PASS V<n>` + exit 0」。
- 临时规则文件唯一名：V4 `rules/tmp-new-rule-V4.md`、V10 `rules/tmp-new-rule-V10.md`。
- 每个任务结束：改动留在工作区；不执行 `git add` / `git commit`。

---

## File Structure

| 文件 | 职责 | 任务 |
|---|---|---|
| `tools/docgen-spike/template.md` | 9 个 H2 + 12 个占位符的结构模板，不含业务正文 | 1 |
| `tools/docgen-spike/specTestCaseGate.mjs` | `buildData` / `renderBlocks` / `validateData` / `render` / `assertTemplateClean` / 常量 | 1–2 |
| `tools/docgen-spike/compare.mjs` | `compareBuffers`：逐字节比对、首个差异的 line/byte | 3 |
| `tools/docgen-spike/run.mjs` | CLI、环境/路径/baseline、13 个用例、gate、write-baseline、compare | 4–6 |
| `tools/docgen-spike/baseline.json` | `renderBaseline(BASELINE_RULES)` 的生成视图 | 2 |
| `tools/docgen-spike/test/core.test.mjs` | 纯函数单测（TC-001–TC-021） | 1–3 |
| `tools/docgen-spike/test/e2e.test.mjs` | V1–V9 e2e（TC-022–TC-050） | 5 |
| `tools/docgen-spike/test/fault.test.mjs` | V10/V10b/V11、清理、坏输入（TC-051–TC-071） | 6 |
| `.gitattributes` | 强制 LF | 1 |
| `.gitignore` | 追加 `.tmp-test/` | 1 |
| `scripts/check-all.mjs` | 接 `run.mjs --gate`，设置 `DOCGEN_CHECK_ACTIVE=1` | 7 |

---

## Task 1：脚手架 + 结构模板 + 纯函数骨架

**Files:**
- Create: `tools/docgen-spike/template.md`
- Create: `tools/docgen-spike/specTestCaseGate.mjs`
- Create: `tools/docgen-spike/test/core.test.mjs`
- Create: `.gitattributes`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `TEMPLATE_PATH`、`TEMPLATE_H2S`、`assertTemplateClean(template)`、`render(data, template)`、`validateData(data)`。

- [ ] **Step 1：写失败测试**

`tools/docgen-spike/test/core.test.mjs`：

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TEMPLATE_PATH, TEMPLATE_H2S, assertTemplateClean, render,
} from '../specTestCaseGate.mjs';

test('模板恰有 9 个 H2、12 个占位符、LF、单尾换行', () => {
  const tpl = readFileSync(TEMPLATE_PATH, 'utf8');
  assert.deepEqual(tpl.match(/^## .*$/gm), TEMPLATE_H2S);
  assert.equal((tpl.match(/\{\{[a-zA-Z]+\}\}/g) ?? []).length, 12);
  assert.equal(tpl.includes('\r'), false);
  assert.equal(tpl.endsWith('\n'), true);
  assert.equal(tpl.endsWith('\n\n'), false);
  assertTemplateClean(tpl);
});

test('render 替换标量键与块键，未知键抛 MissingPlaceholder', () => {
  const tpl = '## A\n\n{{title}}\n\n{{criteriaTable}}\n';
  assert.equal(
    render({ title: 'T', criteriaTable: '| x |' }, tpl),
    '## A\n\nT\n\n| x |\n',
  );
  assert.throws(
    () => render({ title: 'T' }, tpl),
    (e) => e.code === 'MissingPlaceholder' && e.key === 'criteriaTable',
  );
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen-spike/test/core.test.mjs`
Expected: FAIL，`Cannot find module '../specTestCaseGate.mjs'`。

- [ ] **Step 3：写模板**

`tools/docgen-spike/template.md`：

```markdown
# {{title}}

> {{sourceLine}}

## 四要素声明

{{fourElements}}

## 核心判据

{{criteriaIntro}}

{{criteriaTable}}

## 正例 / 反例

{{examples}}

## 为什么

{{why}}

## 适用范围（不因来源豁免）

{{scope}}

## 冲突裁决

{{conflict}}

## 例外

{{exceptions}}

## 触发时机

{{trigger}}

## 验证

{{verification}}
```

- [ ] **Step 4：写纯函数骨架**

`tools/docgen-spike/specTestCaseGate.mjs`：

```js
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'template.md');

export const TEMPLATE_H2S = [
  '## 四要素声明',
  '## 核心判据',
  '## 正例 / 反例',
  '## 为什么',
  '## 适用范围（不因来源豁免）',
  '## 冲突裁决',
  '## 例外',
  '## 触发时机',
  '## 验证',
];

const SCALAR_KEYS = new Set([
  'title', 'sourceLine', 'criteriaIntro', 'why', 'scope', 'conflict', 'exceptions',
]);

const BLOCK_KEYS = new Set([
  'fourElements', 'criteriaTable', 'examples', 'trigger', 'verification',
]);

export function assertTemplateClean(template) {
  const lines = template.split('\n');
  const allowed = (line) =>
    line === '' ||
    line.startsWith('# ') ||
    line.startsWith('## ') ||
    line.startsWith('> {{') ||
    /^\{\{[a-zA-Z]+\}\}$/.test(line) ||
    line.startsWith('|');
  const bad = lines.find((line) => !allowed(line));
  if (bad !== undefined) {
    const err = new Error(`模板含硬编码正文：${bad.slice(0, 80)}`);
    err.code = 'TemplateHardcoded';
    throw err;
  }
}

export function render(data, template) {
  return template.replace(/\{\{([a-zA-Z]+)\}\}/g, (_, key) => {
    if (!SCALAR_KEYS.has(key) && !BLOCK_KEYS.has(key)) {
      const err = new Error(`未知占位符：${key}`);
      err.code = 'MissingPlaceholder';
      err.key = key;
      throw err;
    }
    const value = data[key];
    if (typeof value !== 'string' || value.trim() === '') {
      const err = new Error(`占位符值为空：${key}`);
      err.code = 'MissingPlaceholder';
      err.key = key;
      throw err;
    }
    return value;
  });
}

export function validateData(data) {
  // Task 2 补全：槽位、规则类型、criteria 唯一 id、非空/非 TODO。
  return data;
}
```

- [ ] **Step 5：加 `.gitattributes` 与 `.gitignore`**

`.gitattributes`：

```gitattributes
* text=auto eol=lf
```

`.gitignore` 追加：

```gitignore
tools/docgen-spike/.tmp-test/
```

- [ ] **Step 6：跑测试确认通过**

Run: `node --test tools/docgen-spike/test/core.test.mjs`
Expected: PASS（2 tests）。

---

## Task 2：`buildData` + `renderBlocks` + target 常量 + baseline

**Files:**
- Modify: `tools/docgen-spike/specTestCaseGate.mjs`
- Create: `tools/docgen-spike/baseline.json`（由 `renderBaseline` 生成）
- Modify: `tools/docgen-spike/test/core.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `render` / `assertTemplateClean`。
- Produces: `buildData()`、`renderBlocks(data)`、`TARGET_GIT_HASH`、`TARGET_SHA256`、`TARGET_SIGNATURES`、`BASELINE_RULES`、`renderBaseline()`、`SENTINEL_V4`、`SENTINEL_V10`。

- [ ] **Step 1：写失败测试**

在 `core.test.mjs` 追加：

```js
import { buildData, renderBlocks, renderBaseline, BASELINE_RULES } from '../specTestCaseGate.mjs';
import { execFileSync } from 'node:child_process';

const TARGET = 'rules/spec-testcase-gate.md';

test('V1：buildData + 模板渲染 === target 逐字节', () => {
  const tpl = readFileSync(TEMPLATE_PATH, 'utf8');
  const actual = render(buildData(), tpl);
  const expected = readFileSync(TARGET, 'utf8');
  assert.equal(Buffer.compare(Buffer.from(actual), Buffer.from(expected)), 0);
});

test('buildData：5 条判据、9 节、块键齐全', () => {
  const data = buildData();
  assert.equal(data.criteria.length, 5);
  assert.deepEqual(data.criteria.map((c) => c.id), ['文件存在', '编写者独立', '用例合格', 'spec 外链', '一起送审']);
  const blocks = renderBlocks(data);
  assert.deepEqual(Object.keys(blocks).sort(), ['criteriaTable', 'examples', 'fourElements', 'trigger', 'verification']);
  assert.match(blocks.criteriaTable, /^\| # \| 判据 \| 怎么算合格 \|/m);
});

test('baseline：21 条且渲染视图可复算', () => {
  assert.equal(BASELINE_RULES.length, 21);
  const baseline = renderBaseline();
  assert.equal(typeof baseline, 'string');
  assert.equal(JSON.parse(baseline).length, 21);
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen-spike/test/core.test.mjs`
Expected: FAIL，`buildData is not a function`。

- [ ] **Step 3：填 `buildData` 与 `renderBlocks`**

按 `rules/spec-testcase-gate.md` 逐字转录 9 节内容到 `buildData()`：

- `title` / `sourceLine` / `fourElements` / `criteriaIntro` / `criteria`（5 条：文件存在、编写者独立、用例合格、spec 外链、一起送审）/ `examples`（1 正 3 反，按 target 原样）/ `why` / `scope` / `conflict` / `exceptions` / `trigger`（4 条）/ `verification`（2 段）。
- `criteria[].id` 取判据名；`pass` 取表格第三列原文。
- `renderBlocks(data)` 产出 5 个块字符串：
  - `fourElements`：四行列表，形如 `- **范围（在哪）**：...`；
  - `criteriaTable`：表头 `| # | 判据 | 怎么算合格 |` + 分隔行 + 每行 `| ${no} | **${name}** | ${pass} |`；
  - `examples`：正例/反例列表；
  - `trigger`：触发时机列表；
  - `verification`：验证段。
- `TARGET_SIGNATURES`：从 target 取 3 段 ≥20 字原文（施工时复制）。
- `TARGET_GIT_HASH`：`git hash-object rules/spec-testcase-gate.md` 的输出。
- `TARGET_SHA256`：`Get-FileHash rules/spec-testcase-gate.md -Algorithm SHA256` 的小写值。
- `BASELINE_RULES`：当前 `rules/*.md` 的 21 个相对路径（施工时用目录列表生成一次常量；运行时不得读目录）。
- `SENTINEL_V4` / `SENTINEL_V10`：两段固定串，导出给 `run.mjs` 与测试。
- `renderBaseline()`：返回 `JSON.stringify(BASELINE_RULES, null, 2) + '\n'`（spec §4.2 / TC-032 的字符串口径）。

- [ ] **Step 4：生成 `baseline.json`**

Run: `node -e "import('./tools/docgen-spike/specTestCaseGate.mjs').then(m=>require('fs').writeFileSync('tools/docgen-spike/baseline.json', m.renderBaseline()))"`
Expected: 生成 21 条 baseline。

- [ ] **Step 5：跑测试确认通过**

Run: `node --test tools/docgen-spike/test/core.test.mjs`
Expected: PASS；V1 逐字节相等。

---

## Task 3：`compare.mjs` 字节比对

**Files:**
- Create: `tools/docgen-spike/compare.mjs`
- Modify: `tools/docgen-spike/test/core.test.mjs`

**Interfaces:**
- Produces: `compareBuffers(actual, expected)` → `null` 或 `{ code: 'Mismatch', line, byte }`。

- [ ] **Step 1：写失败测试**

```js
import { compareBuffers } from '../compare.mjs';

test('compareBuffers：相同返回 null，单字节差异给出 line/byte', () => {
  assert.equal(compareBuffers(Buffer.from('abc\n'), Buffer.from('abc\n')), null);
  const r = compareBuffers(Buffer.from('abc\nX\n'), Buffer.from('abc\nY\n'));
  assert.equal(r.code, 'Mismatch');
  assert.equal(r.byte, 4);
  assert.equal(r.line, 2);
});
```

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen-spike/test/core.test.mjs`
Expected: FAIL，`Cannot find module '../compare.mjs'`。

- [ ] **Step 3：实现**

```js
export function compareBuffers(actual, expected) {
  const a = Buffer.isBuffer(actual) ? actual : Buffer.from(actual, 'utf8');
  const b = Buffer.isBuffer(expected) ? expected : Buffer.from(expected, 'utf8');
  if (a.equals(b)) return null;
  const n = Math.min(a.length, b.length);
  let i = 0;
  while (i < n && a[i] === b[i]) i += 1;
  const line = a.subarray(0, i).toString('utf8').split('\n').length;
  return { code: 'Mismatch', line, byte: i };
}
```

- [ ] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen-spike/test/core.test.mjs`
Expected: PASS。

---

## Task 4：`run.mjs` 参数、环境、路径、baseline

**Files:**
- Create: `tools/docgen-spike/run.mjs`
- Create: `tools/docgen-spike/test/env.test.mjs`

**Interfaces:**
- Produces: `parseArgs`、`checkEnvironment`、`assertInside`、`checkBaseline`、`fail(code, fields)`、退出码映射。

- [ ] **Step 1：写失败测试**

覆盖 testcase 的 TC-026/TC-031/TC-042/TC-046/TC-052/TC-053/TC-054/TC-055/TC-056/TC-057/TC-058/TC-059/TC-060/TC-061/TC-063/TC-064/TC-065/TC-068/TC-071。每条按 testcase 的五要素逐条落成 `test(...)`，断言 `error.code` 与 `process.exitCode`。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen-spike/test/env.test.mjs`
Expected: FAIL，`run.mjs` 不存在。

- [ ] **Step 3：实现参数与错误模型**

```js
const EXIT = {
  MissingSlot: 1, MissingPlaceholder: 1, InvalidRuleType: 1, TemplateSyntaxError: 1,
  TemplateHardcoded: 1, ImpureRender: 1, Mismatch: 1,
  UnregisteredHandwritten: 2, InvalidBaseline: 2, InvalidBaselinePath: 2,
  DanglingBaselineEntry: 2, BaselineDrift: 2, EnvironmentEOL: 2,
  InvalidInputPath: 2, InvalidOutputPath: 2,
  GeneratedMissing: 3, TemplateReadFailed: 3, TargetReadFailed: 3, WriteFailed: 3,
};
function fail(code, fields = {}) {
  const err = new Error(code);
  err.code = code;
  Object.assign(err, fields);
  throw err;
}
```

`parseArgs(argv)` 必须拒绝：`--gate`/`--case`/`--write-baseline`/`--compare` 同给、`--case` 非 `V1..V11|V2b|V10b`、`--write-baseline` + `--baseline`、覆盖路径越出 `.tmp-test/**`。

- [ ] **Step 4：实现环境、路径、baseline**

- `checkEnvironment(buffer, role)`：输入角色（target/template/baseline）检查 UTF-8、无 BOM、无 CR、末尾单 `\n`；generated 副本不预检。
- `assertInside(root, input, kind)`：`path.relative` + 最近已存在祖先 `realpathSync` 复判；越界 → `InvalidInputPath` / `InvalidOutputPath`。
- `checkBaseline(baseline)` 五步：结构 → 路径白名单 → 悬空条目 → 漂移 → 基线外新增；分别抛 `InvalidBaseline` / `InvalidBaselinePath` / `DanglingBaselineEntry` / `BaselineDrift` / `UnregisteredHandwritten`。
- 启动：只清 `.tmp-test/`（除非 `--no-clean`），随后 `mkdirSync(ROOT, { recursive: true })`；哨兵自愈只对 V4/V10 唯一临时文件。

- [ ] **Step 5：跑测试确认通过**

Run: `node --test tools/docgen-spike/test/env.test.mjs`
Expected: PASS。

---

## Task 5：用例 V1–V9 与输出契约

**Files:**
- Modify: `tools/docgen-spike/run.mjs`
- Create: `tools/docgen-spike/test/e2e.test.mjs`

**Interfaces:**
- Produces: `runCase(n)`；每例输出 `PASS V<n>` / `FAIL V<n>`；末行 `<n>/13 PASS`。

- [ ] **Step 1：写失败测试**

覆盖 testcase 的 TC-022–TC-050（V1/V2/V2b/V3/V4/V5/V6/V7/V8/V9）。每条用例按 testcase 的步骤与判据落成 `test(...)`；关键断言：
- V1 渲染 === target；
- V2 改副本 1 字节 → `Mismatch` + 精确 `line/byte`；
- V2b CRLF 副本 → `Mismatch`，且不含 `EnvironmentEOL`；
- V4 新增 `rules/tmp-new-rule-V4.md` → `UnregisteredHandwritten`，finally 删除；
- V7 baseline 四种坏输入 → 对应码；
- V8 target CRLF/BOM/非法 UTF-8 → `EnvironmentEOL`；
- V9 连跑两遍 → 两遍输出逐字一致、无残留、`git check-ignore` 0。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen-spike/test/e2e.test.mjs`
Expected: FAIL，用例未实现。

- [ ] **Step 3：实现 V1–V9**

按 spec §7.3 逐例实现；所有副本由 `run.mjs` 在启动清理后自建；V4 用唯一临时名；案例命中期望 → `PASS` + exit 0。

- [ ] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen-spike/test/e2e.test.mjs`
Expected: PASS（V1–V9 全绿）。

---

## Task 6：V10/V10b/V11、gate、write-baseline、compare

**Files:**
- Modify: `tools/docgen-spike/run.mjs`
- Create: `tools/docgen-spike/test/fault.test.mjs`

**Interfaces:**
- Produces: `runGate()`、`runWriteBaseline()`、`runCompare(path)`；V10/V10b/V11。

- [ ] **Step 1：写失败测试**

覆盖 testcase 的 TC-051–TC-071：
- TC-051/TC-052/TC-069：gate/副本路径，`--no-clean` + spawn 前断言存在；
- TC-053/TC-054/TC-055/TC-056：坏模板/坏 target/坏 baseline；
- TC-057：哨兵三支（精确/近失/非哨兵）；
- TC-058：两遍日志内存比对、`.tmp-test/` 不存在、`git check-ignore` 0；
- TC-060/TC-061：fs 探针与静态约束；
- TC-062：全量 13/13；
- TC-063/TC-071：互斥参数；
- TC-064/TC-065：输出路径/junction；
- TC-066：双哈希不变；
- TC-067：`*.test.mjs` 不调 check、`DOCGEN_CHECK_ACTIVE` 在位；
- TC-068：`TargetReadFailed` + exit 3；
- TC-069：`TemplateHardcoded` + exit 1；
- TC-070：write-baseline 正例。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen-spike/test/fault.test.mjs`
Expected: FAIL，用例未实现。

- [ ] **Step 3：实现 gate 与故障用例**

- gate 七步 + ③.5 `assertTemplateClean`；
- `--write-baseline` 只写默认 `baseline.json`；与 `--baseline` 同给 → exit 2；
- `--compare <path>` 只接受 `.tmp-test/**`；缺文件 → `GeneratedMissing`；
- V10/V10b 只由 `run.mjs` 编排；嵌套 check 带 `--no-clean`；
- `check-all.mjs` 设置 `DOCGEN_CHECK_ACTIVE=1`；测试内 spawn 一律 `--no-clean`。

- [ ] **Step 4：跑测试确认通过**

Run: `node --test tools/docgen-spike/test/fault.test.mjs`
Expected: PASS。

---

## Task 7：接入 `npm run check`

**Files:**
- Modify: `scripts/check-all.mjs`
- Create/modify: `tools/docgen-spike/test/check-all.test.mjs`（如需）

- [ ] **Step 1：写失败测试**

断言 `scripts/check-all.mjs` 包含 `node tools/docgen-spike/run.mjs --gate`，且 `--gate` 失败会让 `npm run check` 非 0。

- [ ] **Step 2：跑测试确认失败**

Run: `node --test tools/docgen-spike/test/check-all.test.mjs`
Expected: FAIL。

- [ ] **Step 3：接线**

在 `scripts/check-all.mjs` 的检查序列末尾增加：

```js
run('node tools/docgen-spike/run.mjs --gate', { env: { ...process.env, DOCGEN_CHECK_ACTIVE: '1' } });
```

- [ ] **Step 4：跑全仓检查**

Run: `npm run check`
Expected: 275+ tests pass / 0 findings / 188+ 文件 / 585+ 表 / exit 0。

---

## Task 8：全量验收与结论落点

**Files:**
- Modify: `docs/prd/20261018214426-docgen-rule-whole-file.md` §8（三模型表）
- Modify: `docs/prd/docgen-index.md`（P1 状态）

- [ ] **Step 1：跑全量 13 例**

Run: `node tools/docgen-spike/run.mjs`
Expected: `13/13 PASS`，exit 0。

- [ ] **Step 2：跑 gate 与全仓检查**

Run: `node tools/docgen-spike/run.mjs --gate`
Run: `npm run check`
Expected: 均 exit 0。

- [ ] **Step 3：填 PRD §8 三模型表**

按 spec §7.5：节点 1 V1/V2b/V6；节点 2 V4/V7/V10/V10b；节点 3 V5/V8/V11；全量收口 V9。每格填「通过/不通过 + 证据用例」。

- [ ] **Step 4：写回索引 P1 状态**

`docs/prd/docgen-index.md` 的 P1 行改为「验证通过（V1–V11 全绿，2026-10-18）」，并附证据用例范围。

- [ ] **Step 5：最终检查**

Run: `npm run check`
Expected: 0 findings；若红，按 findings 修到 0，不进入下一阶段。

---

## Self-Review

- **Spec coverage:** R1–R15 分别落在 Task 1–6；V1–V11 落在 Task 2/5/6；gate/write-baseline/compare 落在 Task 6；`.gitignore`/`.gitattributes` 落在 Task 1；check 接线落在 Task 7；结论落点落在 Task 8。
- **Placeholder scan:** 技术步骤均给命令或代码；71 条验收判据以 testcase 文件为唯一来源，计划按 TC 区间逐条落测，不另写第二份断言。
- **Type consistency:** `render(data, template)`、`renderBlocks(data)`、`compareBuffers(actual, expected)`、`buildData()`、`renderBaseline()`、`assertTemplateClean(template)` 在 Task 1–6 保持一致；错误码与 spec §7.1 一致。

## Execution Handoff

推荐 **Subagent-Driven**：每个 Task 派一个新子代理，完成后由主代理跑 `node --test` 与 `npm run check` 复核，再进入下一 Task。也可 **Inline Execution**：在本 session 按 Task 顺序执行，每 Task 后设检查点。

本计划不执行 git 写操作；每个 Task 结束把改动留在工作区。
