# S6 / F-24 规则单一来源化 实施计划（v2）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **版本**：v2.5（2026-10-25 勘误：**只改判据命令**——旧的 `npm run doc:sweep`（带 `-- --check`）在本机 PowerShell + npm 10.9 下会丢掉 `--` 之后参数、跑默认分支恒 exit 0（假绿），改为 `node scripts/scope-sweep.mjs --check`；判据口径与任务的判据一字未动）｜v2.4（T5 Step 4a 改为显式 `--rejudge B3`）｜v2.2 签字 + v2.4 复签见 `gate-record.md` 的 `②→③@S6` 行

**Goal:** 把两份 `producer` 席边界句从「散文常量」改为「定义层数据 + 模板渲染」，判据从定义层派生，做到改一条规则只动一处数据。

**Architecture:** 五层单向依赖：`policy/definitions/*`（唯一字符串）→ `policy/seat-policy.mjs`（只持组 ID）→ `components/renderBoundary.mjs`（单趟替换）→ `agentData` / `patternRegistry`（保留导出名与映射形态）→ 测试（import 定义层，不手抄）。配置校验集中在 `components/validatePolicy.mjs`，由 `gate` 与 `policy --dump` 两处调用。

**Tech Stack:** Node ≥22、`node:test`、既有 docgen 管线、既有 `npm run check`。

**Spec:** `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md`（313 行，② 段已签）
**Testcase（验收清单）：** `docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md`（78 条）

## Global Constraints

- **不 commit**：每个任务停在「测试绿 + 未提交」，由用户 commit。
- **不改权限语义**：谁挂哪档、能跑哪些命令、能写哪些文件一条不变（V-1 集合 diff 空差）。
- **不以字节相等为验收**：通过判据 = **V-1～V-12**（`V-13` 自用户 2026-10-29 裁定起**不在本期**，见 `docs/after/20261029100942-s6-v13-ab-eval-rebuild-open-decisions.md`）；字节只作定位线索。
- **spec / testcase 不再改**：实现中若发现 spec 缺定义 → 停手回流 spec（R4 禁止 plan 新增设计）。
- **导出名以已签 testcase 为准**（v1 的 P0 错误）：`CAP.capabilities`（**小写**，`import * as CAP`）、`CMD.commandGroups` / `CMD.forbiddenGroups` / `CMD.seatGroups`（testcase 写 `CMD.*`）、`PTH.pathGroups` / `PTH.FORBIDDEN_SPEC_PLAN` / `PTH.DETECTION_BLIND_SPOTS`、`ART.artifacts`、`SEATS.SEATS` / `SEATS.SEAT_NAMES`、`TIERS`。`pathItems()` / `pathTokens()` 是**测试侧派生**（testcase §0.3），不是 `PTH` 导出。
- **`CLAUSES` 是数组、元素是 5 字段对象** `{k, why, scope, seat?, re}`（testcase 原文）：`scope:'seg5'` 判 ⑤ 段切片、`scope:'card'` 判整卡；`assertNeedClauses()` **成功时返回 `seg`（失败即抛）**，要取「缺哪几条」用 `missingClauses()`。
- **改 S5 testcase 不算改 S6 testcase**：S5 三条判据与本 plan 的 S6 testcase 是两份文件；S5 三条**已在本批改判完成**（T8 只复核）。
- **硬门**：`gate` → `baseline 37/37`；`npm run check` → `# fail 0`；`node scripts/scope-sweep.mjs --check` → exit 0。
- **卡面重出必须走 CLI**（不得手改卡）：`draft` → `diff` 取凭证（新 sha）→ `replace --expect-change <新 sha> --rejudge B3 --yes`；B3 = 「职责边界一致」，其判定对象就是边界段（`tools/execution-matrix/criteria.md:134-141`），故边界段改动必须报 B3。见 Task 5 Step 4a。
- **B3 前置**：`replace` 在变更段要求「被报进 `--rejudge` 的每个键」注解为 `pass`/`fail`，且 `DOCGEN_JUDGED_BY` 非空（判者 ≠ 施工者）；两席 `B3` 现注解 = `pass`（`rules/.inspector-annotations.json:9` / `:139`）。**开工前须由独立实例对「新渲染的职责段 ↔ 边界段」复核一次 B3 仍成立**；注解缺失或复核不过 → 停手报用户（属 B3 重判，不在本 plan 范围）。

## 文件结构

| 文件 | 职责 |
|---|---|
| `tools/docgen/policy/definitions/capabilities.mjs` | `capabilities`（小写：read/write/exec → 工具名） |
| `tools/docgen/policy/definitions/tiers.mjs` | `TIERS`（四档 → 工具名）+ `tierOfCapabilities()` |
| `tools/docgen/policy/definitions/commands.mjs` | `commandGroups`（允许 3）/ `forbiddenGroups`（禁止 5）/ `seatGroups`（本轮空） |
| `tools/docgen/policy/definitions/paths.mjs` | `pathGroups`（6 组 21 元素）/ `FORBIDDEN_SPEC_PLAN` / `DETECTION_BLIND_SPOTS` |
| `tools/docgen/policy/definitions/artifacts.mjs` | `artifacts`（4 份产物归属） |
| `tools/docgen/policy/definitions/seats.mjs` | `SEATS` / `SEAT_NAMES`（display / clause / escalationWriter） |
| `tools/docgen/policy/seat-policy.mjs` | `SEAT_POLICY`（3 席 + `__default__`，零字符串） |
| `tools/docgen/templates/boundary.md.tpl` | 五段模板（12 槽） |
| `tools/docgen/components/renderBoundary.mjs` | 渲染 + 纯度守卫 + 槽值守卫 |
| `tools/docgen/components/validatePolicy.mjs` | 五码唯一发射点 |
| `tools/docgen/components/patternRegistry.mjs`（改） | 删三常量；`tools: TIERS`；`boundaryBySeat` 值改渲染；`tierBySeat` 派生 |
| `tools/docgen/components/validateAgentData.mjs`（改） | `EXIT[1]` 增五码 |
| `tools/docgen/cli.mjs`（改） | `policy --dump` + flag 白名单；`gateChecks` 首行调 `validatePolicy` |
| `tools/docgen/test/support/capability-baseline.mjs`（新） | 两入口：基线端旧卡切分 / 改造后端字典匹配；不 import `policy/` |
| `tools/docgen/fixtures/boundary-golden.json`（新） | 4 键 sha256 |
| `tools/docgen/fixtures/capability-baseline.json`（新） | 基线 + `sourceCommit` |
| `tools/docgen/test/policy-pure-source.test.mjs`（新） | 78 条用例落点 |

## 判据侧 helper 落点（v1 的 PG-04）

**不自造 helper**：新测试文件顶层按 testcase §0.3 / §0.4 **原样**落下列符号，plan 只列「本 plan 片段用到的」，其余照抄：

| 符号 | 来源 | 本 plan 用在哪 |
|---|---|---|
| `withCopy(fn)`、`runCli(dir, argv)`、`runEsm` | §0.3 | T3–T9 |
| `renderBoundaryIn(dir, seat)`、`dirHashes(dir)`、`editInDir` | §0.3 | T4/T5/T9 |
| `grantGroup` / `setSeatPolicy` / `insertInObject` | §0.3 | T5/T6/T7 |
| `policyOf(n)`、`probeSeatOf(cap)`、`probesRun` / `noteProbe` | §0.3 | T3/T7 |
| `pathItems()` / `pathTokens()`、`listCopies(items)` | §0.3 | T2/T9 |
| `countIn(text,needle)`、`seg5(text)`、`cardBoundary(text)` | §0.3 | T7/T9 |
| `golden()` / `goldenOf(seat)` / `goldenCurOf(seat)` / `assertGolden` | §0.3 | T4/T5 |
| `expectedRefCode(v)` | §0.3 | T7 |
| `factsFromBaselineText(text)` / `factsFromText(text, dict)` / `factsFromDump(json, seat, dict)` / `diffFacts` / `verdict` | §0.4 + T1 模块 | T1/T9 |
| `probeDict()`（= `dict`） | §0.4 | T9 |
| `CLAUSES`（**数组**，元素 = 5 字段对象 `{k, why, scope, seat?, re}`）、`assertNeedClauses`（成功返回 seg、失败即抛）、`missingClauses`（返回缺失 k 列表） | §0.4 | T7/T9 |
| `evalDir()` / `rowsOf` / `abRecords` / `zeroRecords` / `DIMS` / `readAbScore` | §0.4 | T10 |
| `gitLogCountAfter` / `freezeTime` / `hasRerunStamp` | §0.4 | T10 |
| 模块导入：`CAP` / `CMD` / `PTH` / `ART` / `SEATS` / `TIERS` / `SEAT_POLICY` | §0.3 | 全任务 |

## 测试用例 → 任务映射（78 条，带落点 Step）

| 任务 | 覆盖用例 | 条数 | 落点 Step |
|---|---|---|---|
| T1 基线 | （不单独计条）支撑 T9 的 `H01`/`H07` | 0 | Step 5（只产基线三件） |
| T2 定义层 | `A02`–`A05` `A07` `A08` | 6 | Step 1 / 4 |
| T3 配置层 | `B01` `B02` `B11` `B12` `B13` | 5 | Step 1 / 4 |
| T4 模板+渲染+校验 | `A06` `B03`–`B10` `B14` `B15` `C01`–`C08` | 19 | Step 1 / 5 |
| T5 接入+删常量 | `A01` `D01`–`D06` `E01`–`E07` `G01`–`G05` | 19 | Step 1 / 6 |
| T6 dump+缺省槽 | `C09` `F01`–`F06` | 7 | Step 1 / 4 |
| T7 下探+子句 | `I01`–`I03` `J01`–`J03` | 6 | Step 1 / 4 |
| T9 全量+反向 | `A09` `H01`–`H07` | 8 | Step 1–4 |
| T10 盲评+账单 | `K01`–`K08` | 8 | Step 1–5 |
| **合计** | — | **78** | — |

---

### Task 1: 导出改造前基线（步骤 0）

**Files:**
- Create: `tools/docgen/test/support/capability-baseline.mjs`
- Create: `tools/docgen/test/support/capability-baseline.test.mjs`
- Create: `tools/docgen/fixtures/capability-baseline.json`、`tools/docgen/fixtures/capability-baseline.golden.json`

**Interfaces:**
- Produces: `factsFromBaselineText(text)`、`factsFromText(text, dict)`、`factsFromDump(json, seat, dict)`、`diffFacts(before, after)`、`verdict({minus,plus})`、`baseJson()`、`cardBoundary(text)`（卡内边界节，供黄金键用）、`emit(args)`（CLI 出口）

- [x] **Step 1: 写失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { factsFromBaselineText, diffFacts, verdict } from './capability-baseline.mjs';

const CARD = readFileSync('agents/reviewer-audit.md', 'utf8');

test('基线端：旧卡切分 8 字段，工具 6、路径 23（含 spec / plan）', () => {
  const f = factsFromBaselineText(CARD);
  assert.equal(f.tools.length, 6);
  assert.equal(f.tier, 'producer');
  assert.equal(f.forbiddenPaths.length, 23);
  assert.ok(f.forbiddenPaths.includes('spec / plan'));
});
test('恒真守卫：同输入判 pass，少一项判 fail', () => {
  const a = factsFromBaselineText(CARD);
  const b = structuredClone(a); b.forbiddenPaths.pop();
  assert.equal(verdict(diffFacts(a, b)), 'fail');
});
```

- [x] **Step 2: 跑失败**

Run: `node --test tools/docgen/test/support/capability-baseline.test.mjs`
Expected: FAIL（模块不存在）

- [x] **Step 3: 实现两入口（不得 import `policy/`）**

算法不在此重写：**逐字搬 testcase §0.4 的 `factsFromBaselineText` / `factsFromText` / `factsFromDump` / `diffFacts` 实现**（8 字段切分正则、成员存在性匹配、集合 diff），再补一个 `cardBoundary(text)`（取卡内边界节，供黄金键用；testcase §0.3 同名 helper 可直接从本模块 import）。

- [x] **Step 4: 跑通过**

Run: `node --test tools/docgen/test/support/capability-baseline.test.mjs`
Expected: PASS（2 tests）

- [x] **Step 5: 生成基线三件（可执行命令，替换 v1 的伪代码）**

```powershell
# 1) 取改造前 commit（PowerShell 5 用 Set-Content，避免 UTF-16 写出）
Set-Content -Encoding ascii .session/tmp/s6-source-commit.txt (git rev-parse HEAD)
git cat-file -e HEAD:tools/docgen/policy   # 期望：非 0 退出（改造前不存在 policy/）

# 2) 基线 JSON（含 sourceCommit）
node --input-type=module -e "import {readFileSync,writeFileSync} from 'node:fs';import {factsFromBaselineText} from './tools/docgen/test/support/capability-baseline.mjs';const rev=readFileSync('.session/tmp/s6-source-commit.txt','utf8').trim();const seats=['reviewer-audit','detective-observer'];const out={sourceCommit:rev,seats:{}};for(const s of seats)out.seats[s]=factsFromBaselineText(readFileSync(process.env.TMP_CARD||'agents/'+s+'.md','utf8'));writeFileSync('tools/docgen/fixtures/capability-baseline.json',JSON.stringify(out,null,2)+'\n');console.log('baseline seats',Object.keys(out.seats).join(','))"

# 3) 黄金样本（审计席 8 字段）
node --input-type=module -e "import {readFileSync,writeFileSync} from 'node:fs';import {factsFromBaselineText} from './tools/docgen/test/support/capability-baseline.mjs';const f=factsFromBaselineText(readFileSync('agents/reviewer-audit.md','utf8'));writeFileSync('tools/docgen/fixtures/capability-baseline.golden.json',JSON.stringify(f,null,2)+'\n');console.log('golden keys',Object.keys(f).length)"
```
Expected: 两个 fixture 生成；第二个打印 `golden keys 8`。

- [x] **Step 6: 记回滚锚（写进 T10 的 checklist「交付说明」节）**

5 条复原命令（本任务只记录，T10 回填）：`git show <rev>:tools/docgen/components/patternRegistry.mjs` / `agents/reviewer-audit.md` / `agents/detective-observer.md` / `tools/docgen/state.json` / `tools/docgen/fixtures/<席>.evidence.json`。

> 说明：`H01` / `H07` 的完整断言依赖 T5/T10 产物（重出的卡、`capability-diff.md`、`checklist.md`、HEAD 已有 `policy/`），**不在 T1 收口**，统一在 T9 Step 3 复核（v1 的 PG-07）。

---

### Task 2: 定义层数据（步骤 1）

**Files:**
- Create: `definitions/{capabilities,tiers,commands,paths,artifacts,seats}.mjs`
- Test: `policy-pure-source.test.mjs`（A 组 6 条）

**Interfaces:**
- Produces: `capabilities`（小写）、`TIERS` + `tierOfCapabilities(caps)`、`commandGroups` / `forbiddenGroups` / `seatGroups`、`pathGroups` / `FORBIDDEN_SPEC_PLAN` / `DETECTION_BLIND_SPOTS`、`artifacts`、`SEATS` / `SEAT_NAMES`

- [x] **Step 1: 写失败测试**（A02–A05、A07、A08；`A01` 因要断言 `patternRegistry.tools === TIERS` 移到 T5）

```js
import * as CAP from '../policy/definitions/capabilities.mjs';
import { TIERS, tierOfCapabilities } from '../policy/definitions/tiers.mjs';
import * as CMD from '../policy/definitions/commands.mjs';
import * as PTH from '../policy/definitions/paths.mjs';

test('A02 命令 8 组：允许 3 / 禁止 5 / 每组 purpose+verbs 非空', () => {
  assert.deepEqual(Object.keys(CMD.commandGroups), ['check.local','git.read','docgen.read']);
  assert.deepEqual(Object.keys(CMD.forbiddenGroups), ['docgen.write','git.write','fs.write','env.assign','network']);
  assert.equal(CMD.forbiddenGroups.network.verbs.length, 3);
  assert.ok(CMD.forbiddenGroups.network.purpose.includes('下载类命令'));
});
test('A04 路径：21 个数组元素 + 1 pattern = 22 点名；卡面 23', () => {
  assert.equal(Object.values(PTH.pathGroups).flat().length, 21);
  assert.equal(pathTokens().length, 23);          // pathTokens 来自 testcase §0.3
});
```

- [x] **Step 2: 跑失败** — `node --test tools/docgen/test/policy-pure-source.test.mjs` → FAIL

- [x] **Step 3: 落定义层（值逐字取自现卡 / testcase §0.2）**

```js
// capabilities.mjs —— 导出名小写（与 testcase 的 `import * as CAP` 一致）
export const capabilities = { read: ['Read','Glob','Grep'], write: ['Write','Edit'], exec: ['RunCommand'] };
// tiers.mjs —— 值 = 工具名（不是 capability ID）；展开后按数组相等判档
export const TIERS = {
  readOnly: ['Read','Glob','Grep'],
  sdet: ['Read','Glob','Grep','Write','Edit'],
  command: ['Read','Glob','Grep','RunCommand'],
  producer: ['Read','Glob','Grep','Write','Edit','RunCommand'],
};
export function tierOfCapabilities(caps) {
  const tools = caps.flatMap((c) => capabilities[c]);
  return Object.keys(TIERS).find((t) => TIERS[t].join(',') === tools.join(','));
}
```

- [x] **Step 4: 跑通过** — 同命令 → PASS（6 tests）

---

### Task 3: 配置层（步骤 2）

**Files:** Create `tools/docgen/policy/seat-policy.mjs`；Test `B01` `B02` `B11` `B12` `B13`

- [x] **Step 1: 写失败测试**

```js
test('B01 三席 + __default__；capabilities 展开 ≡ TIERS[tier]', () => {
  assert.deepEqual(Object.keys(SEAT_POLICY), ['reviewer-audit','detective-observer','senior-sdet','__default__']);
  for (const s of SEATS.SEAT_NAMES)
    assert.deepEqual(SEAT_POLICY[s].capabilities.flatMap((c) => CAP.capabilities[c]),
      TIERS[tierOfCapabilities(SEAT_POLICY[s].capabilities)]);
});
test('B12 未登记席 / 原型链键回落 __default__', () => {
  for (const n of ['ghost-seat','constructor','__proto__']) assert.deepEqual(policyOf(n), SEAT_POLICY.__default__);
});
```

- [x] **Step 2: 跑失败 → Step 3: 落配置**

```js
export const SEAT_POLICY = {
  'reviewer-audit':     { capabilities:['read','write','exec'], allowGroups:['check.local','git.read','docgen.read'], artifacts:['round-check.md','delivery-audit.md'] },
  'detective-observer': { capabilities:['read','write','exec'], allowGroups:['check.local','git.read','docgen.read'], artifacts:['detective.md'] },
  'senior-sdet':        { capabilities:['read','write'],        allowGroups:[],                                   artifacts:[] },
  __default__:          { capabilities:['read'],                allowGroups:[],                                   artifacts:[] },
};
```

- [x] **Step 4: 跑通过**（5 tests；每一步红/绿分别跑，不合并）

---

### Task 4: 模板 + 渲染器 + 配置校验（步骤 3，含 checkpoint）

**Files:** 模板 / `renderBoundary.mjs` / `validatePolicy.mjs` / `boundary-golden.json`；Test `A06` `B03`–`B10` `B14` `B15` `C01`–`C08`（19 条）

**Interfaces:** `renderBoundary(seat) → string`；`validatePolicy() → void`；`SLOTS`（12 个，顺序 = spec §3.4 表行序）

- [x] **Step 1: 写失败测试**

```js
test('A06 卡面切片顺序 = 定义层组内顺序（按出现位置单调，不切片重排）', () => {
  const t = renderBoundary('reviewer-audit');
  const pos = (n) => t.indexOf(n);
  const paths = pathItems();                       // testcase §0.3 的测试侧派生
  for (let i = 1; i < paths.length; i += 1)
    assert.ok(pos(paths[i - 1]) < pos(paths[i]), `${paths[i - 1]} 应在 ${paths[i]} 前`);
  const cmds = commandTokens();
  for (let i = 1; i < cmds.length; i += 1)
    assert.ok(pos(cmds[i - 1]) < pos(cmds[i]), `${cmds[i - 1]} 应在 ${cmds[i]} 前`);
});
test('C06 12 槽落齐（用可观测值核，不依赖 dump）+ 无 {{ / undefined / 悬空标点', () => {
  for (const s of SEATS.SEAT_NAMES) {
    const t = renderBoundary(s);
    assert.equal(/\{\{/.test(t), false);
    assert.equal(/undefined|null|NaN/.test(t), false);
    assert.ok(t.includes(SEATS.SEATS[s].display), `${s}:display`);
    assert.ok(t.includes(TIERS[tierOfCapabilities(SEAT_POLICY[s].capabilities)][0]), `${s}:tier-tools`);
    if (s === 'reviewer-audit') {
      assert.equal(pathTokens().filter((x) => t.includes(x)).length, 23, '槽 10 = 23 项');
      assert.equal(commandTokens().filter((x) => t.includes(x)).length, 14, '槽 7 允许命令 14 条');
      assert.ok(t.includes('sha256') && t.includes('gitignore'), '槽 11 检测限度');
    }
    if (SEAT_POLICY[s].artifacts.length === 0)
      assert.equal(/写入范围：只允许写\s*[。；]/.test(t), false, `${s}:悬空标点`);
  }
});
test('C03/C04/C05 纯度：清单类成员进模板 → TemplateImpure', () => {
  const cases = ['代码、测试', 'npm run check', 'rules/'];   // 路径成员 / 多词 verb / 路径组
  for (const lit of cases) {
    const r = withCopy((d) => { appendToTemplate(d, lit); return runCli(d, ['policy','--dump']); });
    assert.match(r.stderr.split('\n')[0], /^TemplateImpure:/, lit);
  }
});
test('C07 未声明槽不得静默保留', () => {
  const r = withCopy((d) => { appendToTemplate(d, '{{SEAT_LABEL}}'); return runCli(d, ['policy','--dump']); });
  assert.ok(r.status !== 0 || !r.stdout.includes('{{'));
});
test('C08 分隔符：组间 、/；、组内 ` / `；DENY 剔除 env.assign', () => {
  const t = renderBoundary('reviewer-audit');
  assert.ok(!sliceBetween(t, '禁止', '环境变量').includes('export VAR'));
  assert.ok(t.includes('export VAR'), '环境变量形态只经 ENV_FORMS 注入一次');
});
```

- [x] **Step 2: 跑失败 → 写模板（五段；⑨⑩ 两句职责经 `{{SEAT_CLAUSE}}` 承接；⑤ 段含 `round-check.md` 实例）**

```
① 档位事实：你是{{SEAT}}席，档位 {{TIER}}，可使用 {{CAPABILITIES}}。
② 写入范围：只允许写 {{ARTIFACTS}}{{SEAT_CLAUSE}}。
③ 明确禁止：{{FORBIDDEN_PATHS}}。
④ 命令默认拒绝：允许 {{ALLOW_GROUPS}}；禁止 {{DENY_GROUPS}}（含 {{ENV_FORMS}}）。{{ESCALATION_WRITER}}
⑤ 越界后果与限度：越权清单（文件 / 改前改后 sha256 / 是否可复原 / 命令原文）；用户执行复原；本轮结论作废；
   检测限度：{{DETECTION_PATHS}} 被 gitignore；检测命令 {{DETECTION_CMD}}。
```
`seats.mjs` 的 `clause` 必须显式承接：审计「、审计表；你在 `round-check.md` 核转录逐字一致」/ 侦探「（轮初 / 轮末快照原文、观察记录、比对结论），且本席不核签」。

- [x] **Step 3: 实现渲染器（单趟替换）**

```js
export function renderBoundary(seat) {
  const values = slotValues(seat);                  // 12 槽；undefined/null 即抛 TemplateImpure
  return TPL.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => {
    if (!Object.hasOwn(values, k)) throw fail('TemplateImpure', `模板:${k}`);
    return values[k];
  });
}
```

- [x] **Step 4: 实现 validatePolicy（五码唯一发射点，归码优先级：形态 → 存在性 → 禁止）**

```js
export function validatePolicy() {
  // 不变量 1/2/3/4/5/8/9；不变量 9 = capabilities 展开 ≡ toolsForSeat
  // 形态错 → LiteralInConfig；形态对未登记 → UnknownPolicyRef；已登记属禁止 → ForbiddenGroupGranted
}
```

- [x] **Step 5: 跑通过 + 写黄金 4 键（用**改造前**文本）**

```powershell
node --input-type=module -e "import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import {writeFileSync,readFileSync} from 'node:fs';import {cardBoundary} from './tools/docgen/test/support/capability-baseline.mjs';const rev=readFileSync('.session/tmp/s6-source-commit.txt','utf8').trim();const sha=s=>createHash('sha256').update(s).digest('hex');const card=s=>execFileSync('git',['show',rev+':agents/'+s+'.md'],{encoding:'utf8'});const {DEFAULT_BOUNDARY}=await import('./tools/docgen/components/patternRegistry.mjs');const {agentData}=await import('./tools/docgen/components/agentData.mjs');const er=agentData.find(a=>a.name==='evidence-reader');const g={'reviewer-audit':sha(cardBoundary(card('reviewer-audit')).trim()),'detective-observer':sha(cardBoundary(card('detective-observer')).trim()),'default-boundary':sha(DEFAULT_BOUNDARY.trim()),'evidence-reader-boundary':sha(String(er.boundary).trim())};writeFileSync('tools/docgen/fixtures/boundary-golden.json',JSON.stringify(g,null,2)+'\n');console.log('golden keys',Object.keys(g).length)"
```
Expected: `golden keys 4`。**口径**：两席取 `cardBoundary(git show <rev>:…).trim()` 的 sha（testcase §0.3 同名 helper），不是整卡哈希；`default-boundary` / `evidence-reader-boundary` 同样 `.trim()`。

- [x] **Step 6: checkpoint（不绿不得往下）**

Run: `node tools/docgen/cli.mjs gate` → `baseline 37/37`；`npm run check` → `# fail 0`
Expected: 双绿（此时尚未接卡，卡面未变）。

---

### Task 5: 接入现有卡 + 删除死常量 + 重出两卡（步骤 4 / 4b）

**Files:**
- Modify: `patternRegistry.mjs`（删三常量；`tools: TIERS`；`boundaryBySeat` 值改渲染；`tierBySeat` 派生）
- Modify: `agentData.mjs`（取值方式不变）
- Modify: `validateAgentData.mjs`（`EXIT[1]` 增五码）
- Modify: `tool-tiers.test.mjs`（`BOUNDARY_COMMAND` import + 三处手抄数组）
- Modify: `agents/reviewer-audit.md` / `agents/detective-observer.md`（**只能经 CLI 重出**）
- Test: `A01` `D01`–`D06` `E01`–`E07` `G01`–`G05`（19 条）

**Interfaces:** Consumes `renderBoundary`、`TIERS`、`SEAT_POLICY`；Produces `patternRegistry.boundaryBySeat`（渲染结果）、`tierBySeat`（派生）、无 `BOUNDARY_COMMAND`

- [x] **Step 1: 写失败测试**

```js
test('A01 不变量 9：patternRegistry.tools === TIERS（同引用，不深拷贝）', () => {
  assert.equal(patternRegistry.tools, TIERS);
  assert.deepEqual(Object.keys(TIERS), ['readOnly','sdet','command','producer']);
});
test('D05 五码进 EXIT[1]，RenderNotEquivalent 不进表', () => {
  for (const c of ['UnknownPolicyRef','LiteralInConfig','SeatNameInDefinition','ForbiddenGroupGranted','TemplateImpure'])
    assert.equal(exitCodeFor(c), 1);
  assert.throws(() => exitCodeFor('RenderNotEquivalent'));
});
test('D06 gate 侧接线：配置非法 → exit 1 且不是 Mismatch', () => {
  const r = withCopy((d) => { grantGroup(d, 'reviewer-audit', 'docgen.write'); return runCli(d, ['gate']); });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^ForbiddenGroupGranted: reviewer-audit:docgen\.write/);
});
```

- [x] **Step 2: 改 `patternRegistry`（含 `tools: TIERS` 同引用）**

```js
import { TIERS, tierOfCapabilities } from '../policy/definitions/tiers.mjs';
import { renderBoundary } from './renderBoundary.mjs';
import { SEAT_NAMES } from '../policy/definitions/seats.mjs';
import { SEAT_POLICY } from '../policy/seat-policy.mjs';

export const boundaryBySeat = {
  'reviewer-audit': renderBoundary('reviewer-audit'),
  'detective-observer': renderBoundary('detective-observer'),
};
export const tierBySeat = Object.fromEntries(
  SEAT_NAMES.map((s) => [s, tierOfCapabilities(SEAT_POLICY[s].capabilities)]));
```
`patternRegistry.tools` 指向 `TIERS`（同一对象；删三常量与 `BOUNDARY_COMMAND` 导出）。

- [x] **Step 3: 同批改 `tool-tiers.test.mjs`（三处手抄 → 定义层派生）**

```js
import { pathGroups } from '../policy/definitions/paths.mjs';
const FORBIDDEN_PATHS = Object.values(pathGroups).flat();
```

- [x] **Step 4: 跑测试 + 看 gate 红在哪（预期 Mismatch，因卡面未重出）**

Run: `node --test tools/docgen/test/tool-tiers.test.mjs`；`node tools/docgen/cli.mjs gate`
Expected: 前者绿；`gate` → `Mismatch: agents/reviewer-audit.md`（**这是预期的**，下一步重出）。

- [x] **Step 4a: 重出两卡（v1 漏掉的 P0 步骤，必须走 CLI）**

```powershell
# 1) 生成草稿（打印草稿路径）
node tools/docgen/cli.mjs draft --kind agent --name reviewer-audit
node tools/docgen/cli.mjs draft --kind agent --name detective-observer

# 2) 取「即将写盘字节」的凭证（diff 首行给旧/新 sha256 与差异行）
node tools/docgen/cli.mjs diff --kind agent --name reviewer-audit
node tools/docgen/cli.mjs diff --kind agent --name detective-observer

# 3) 替换：--expect-change = 上一步的「新 渲染」sha256
#    --rejudge 键名：边界段 = B3「职责边界一致」的判定对象（criteria.md:134-141）→ 显式报 B3。
#    注意：diff 只输出 sha / 差异行 / 凭证，**不报触达键**；触达键只会在 replace 失败时以
#    `UnapprovedChange: … --rejudge 漏报触达键 <键>` 出现（tools/docgen/cli.mjs:451-457）。若报出（如渲染顺带改了
#    description → A2、「你是谁」节 → A1），把报出的键一并加进 --rejudge，且其注解须为 pass/fail。
$env:DOCGEN_JUDGED_BY='reviewer-audit-2026-10-25-b3'
node tools/docgen/cli.mjs replace --kind agent --name reviewer-audit --draft "<draft 路径>" --expect-change <新sha> --rejudge B3 --yes
node tools/docgen/cli.mjs replace --kind agent --name detective-observer --draft "<draft 路径>" --expect-change <新sha> --rejudge B3 --yes
Remove-Item Env:DOCGEN_JUDGED_BY
```
Expected: 两席 `已替换`；副作用：`tools/docgen/state.json` 与 `tools/docgen/fixtures/<席>.evidence.json` 被改写（`tools/docgen/cli.mjs:473` 置 state、`:477-484` 写 evidence / 追加 changes）。
**前置**：两席 `B3` 注解为 `pass`（`rules/.inspector-annotations.json:9` / `:139`），且施工前由独立实例对新渲染复核过 B3；否则 `replace` 报 `UnapprovedChange` → 停手报用户（B3 重判不属本 plan）。
**验收**：读两席 `fixtures/<席>.evidence.json` 末条 `changes`：`rejudged = ["B3"]`、`judgeMode = "subagent"`、`judgedBy` 非空且 ≠ 施工者标识。

- [x] **Step 5: gate 复跑**

Run: `node tools/docgen/cli.mjs gate`
Expected: `baseline 37/37`。

- [x] **Step 6: 跑 D/E/G 组测试**

Run: `node --test tools/docgen/test/policy-pure-source.test.mjs`
Expected: D 6 / E 7 / G 5 绿（G01 只要求「差异可追」，不是零差异）。

---

### Task 6: `policy --dump` + 缺省槽（步骤 5）

**Files:** Modify `cli.mjs`；Test `C09` `F01`–`F06`（7 条）

**Interfaces:** stdout `{capabilities,tiers,commands,seatGroups,paths:{groups,patterns},detectionBlindSpots,artifacts,seats:{席:{display,expanded[12]}}}`

- [x] **Step 1: 写失败测试**

```js
test('F01 顶层键齐；expanded 恰 12 项；commands = 允许 3 ∪ 禁止 5 ∪ seatGroups', () => {
  const j = JSON.parse(runCli(ROOT, ['policy','--dump']).stdout);
  assert.deepEqual(Object.keys(j).sort(), ['artifacts','capabilities','commands','detectionBlindSpots','paths','seatGroups','seats','tiers']);
  assert.equal(j.seats['reviewer-audit'].expanded.length, 12);
  assert.deepEqual(Object.keys(j.commands).sort(), [...Object.keys(j.commands)].sort());
});
test('F03 dump 不写仓内文件（跑前跑后哈希不变）', () => {
  const h0 = dirHashes('tools/docgen'); runCli(ROOT, ['policy','--dump']);
  assert.deepEqual(dirHashes('tools/docgen'), h0);
});
test('F04 写盘类 flag → InvalidArgs exit 2', () => {
  assert.equal(runCli(ROOT, ['policy','--dump','--write']).status, 2);
});
test('C09 缺省槽渲染空串；显式 undefined → TemplateImpure（经 dump 构造）', () => {
  const ok = withCopy((d) => runCli(d, ['policy','--dump']));
  assert.equal(ok.status, 0);
  const bad = withCopy((d) => { editInDir(d,'tools/docgen/policy/definitions/seats.mjs',(s)=>s.replace("clause: ''","clause: undefined")); return runCli(d,['policy','--dump']); });
  assert.match(bad.stderr.split('\n')[0], /^TemplateImpure:/);
});
test('F02 槽级复算：expanded 第 n 项 == §3.4 表第 n 行的槽值（含槽 10 路径 23 项、槽 12 status verb）', () => {
  const j = JSON.parse(runCli(ROOT, ['policy','--dump']).stdout);
  const e = j.seats['reviewer-audit'].expanded;
  assert.equal(e.length, 12);
  assert.equal(e[9].split('、').length, 23, '槽 10 = FORBIDDEN_PATHS（index 9）');
  assert.match(e[11], /git --no-optional-locks status --porcelain/, '槽 12 = DETECTION_CMD（index 11）');
  assert.equal(e[8], Object.values(CMD.forbiddenGroups.env.assign.verbs).join(' / '));
});
test('F06 dump 与 renderBoundary 同源：改定义一处两者同变', () => {
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/seats.mjs', (s) => s.replace("clause: '、审计表'", "clause: '、审计表（改）'"));
    const j = JSON.parse(runCli(d, ['policy','--dump']).stdout);
    const t = renderBoundaryIn(d, 'reviewer-audit');
    return { slot: j.seats['reviewer-audit'].expanded[4], has: t.includes('（改）') };
  });
  assert.ok(r.has && r.slot.includes('（改）'));
});
```

- [x] **Step 2: 跑失败 → Step 3: 实现子命令 + `gateChecks` 首行调用**

```js
// cli.mjs：在 gateChecks() 首行插入一行（其余原实现不动）
export function gateChecks() {
  validatePolicy();                 // ← 新增的前置校验（配置非法先红，再比漂移）
  // 以下保持原实现：collectGate / 漂移判定 / 报码
}
// 新子命令
if (sub === 'policy') {
  const a = parseArgs(rest, DUMP_FLAGS, 'policy');
  validatePolicy();
  if (a['--dump']) { process.stdout.write(JSON.stringify(dumpPolicy(), null, 2) + '\n'); return 0; }
  return fail('InvalidArgs', { message: 'InvalidArgs: policy 需要 --dump' });
}
```

- [x] **Step 4: 跑通过**（7 tests）

---

### Task 7: 双向下探 + 散文子句（步骤 6 延伸）

**Files:** Modify 新测试文件；Test `I01`–`I03` `J01`–`J03`（6 条）

- [x] **Step 1: 写失败测试**

```js
test('I01 允许集逐项「用不被拦」（14 命令 / 可写产物 / 6 工具，按 capability 选席）', () => {
  for (const p of allowProbes()) {
    noteProbe(p);
    withCopy((d) => {
      applyLegalGrant(d, p);
      const r = runCli(d, ['policy','--dump']);
      assert.equal(r.status, 0, `${p.kind}:${p.id}@${p.seat}\n${r.stderr}`);
      assert.ok(renderBoundaryIn(d, p.seat).includes(p.id), `卡面不可指涉：${p.kind}:${p.id}@${p.seat}`);
    });
  }
});
test('I02 禁止集逐项必红（verb / 23 路径 / 5 禁止组），期望码由形态现算', () => {
  for (const p of denyProbes()) {
    noteProbe(p);
    const r = withCopy((d) => { grantGroup(d, p.seat, p.id); return runCli(d, ['policy','--dump']); });
    assert.equal(r.status, 1, `${p.kind}:${p.id}@${p.seat}`);
    const first = r.stderr.split('\n')[0];
    if (p.kind === 'deny-group') assert.equal(first, `ForbiddenGroupGranted: ${p.seat}:${p.id}:forbidden`);
    else assert.ok(first.startsWith(`${expectedRefCode(p.id)}: `), `${p.id} 期望码 ${expectedRefCode(p.id)}，实得 ${first}`);
  }
});
test('I03 探针完备：键集 = 允许侧 ∪ 禁止侧，每项恰 1 次，禁抽样', () => {
  assert.deepEqual([...probesRun.keys()].sort(), [...expectedProbeKeys()].sort());
  for (const [k, n] of probesRun) assert.equal(n, 1, k);
});
test('J01 ⑤ 段 8 条子句 + 卡级 2 条职责句', () => {
  for (const s of ['reviewer-audit','detective-observer']) {
    const t = renderBoundary(s);
    assert.doesNotThrow(() => assertNeedClauses(t, s), '缺要素即抛，不抛 = 全齐');
    assert.deepEqual(missingClauses(t, s), []);
  }
});
```

- [x] **Step 2–4: 跑失败 → 补实现缺口（探针按 capability 选席）→ 跑通过（6 tests）**

---

### Task 8: S5 指针与 PRD 口径（步骤 7 / 7b）—— **本批已完成**

- [x] **Step 1: 复核（不重复改）**

Run: `Select-String -Path docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md -Pattern '已迁移（S6|判据已由 S6 接管'`
Expected: 2 处（L119 / L239 附近）。

- [x] **Step 2: 复核 S5 testcase 三条已改判（已在本批完成，不重改）**

Run: `Select-String -Path docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md -Pattern 'renderBoundary|DEFAULT_BOUNDARY' | Measure-Object`
Expected: 命中 ≥ 3（`E05` / `B08` / `B14` 三处均含新判据）；`grep 'assert.*BOUNDARY_COMMAND'` = 0。

---

### Task 9: 全量 + 反向 + 基线恒真复核（步骤 8）

**Files:** Modify 新测试文件；Test `A09` `H01`–`H07`（8 条）

- [x] **Step 1: A09（CRLF/BOM）两副本 + H03–H05（少项必红 / 多项必红）**

```js
test('A09 卡面 CRLF / BOM → gate 报 Mismatch（不静默归一化）', () => {
  for (const mutate of [toCRLF, addBOM]) {
    const r = withCopy((d) => { mutate(join(d,'agents/reviewer-audit.md')); return runCli(d,['gate']); });
    assert.equal(r.status, 1); assert.match(r.stderr.split('\n')[0], /^Mismatch:/);
  }
});
test('H03 少一项路径 → minus 出现 forbiddenPaths', () => {
  const { minus } = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs', (s) => s.replace("'其他评审目录',", ''));
    return diffFacts(baseJson().seats['reviewer-audit'], factsFromText(renderBoundaryIn(d, 'reviewer-audit'), probeDict(d)));
  });
  assert.ok(minus.some((x) => x.startsWith('forbiddenPaths')));
});
test('H04 少一条允许命令 → minus 出现 allowCmds', () => {
  const { minus } = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/commands.mjs', (s) => s.replace("'node scripts/skill-dir.mjs',", ''));
    return diffFacts(baseJson().seats['reviewer-audit'], factsFromText(renderBoundaryIn(d, 'reviewer-audit'), probeDict(d)));
  });
  assert.ok(minus.some((x) => x.startsWith('allowCmds')));
});
test('H05 多一项：路径 / 允许命令 / 已登记允许组 → plus 各一个独立断言点', () => {
  const cases = [
    [(d) => editInDir(d, 'tools/docgen/policy/definitions/paths.mjs', (s) => s.replace("'其他评审目录',", "'其他评审目录', 'vendor/',")), 'forbiddenPaths'],
    [(d) => editInDir(d, 'tools/docgen/policy/definitions/commands.mjs', (s) => s.replace("'node scripts/skill-dir.mjs',", "'node scripts/skill-dir.mjs', 'node scripts/extra.mjs',")), 'allowCmds'],
    [(d) => { editInDir(d, 'tools/docgen/policy/definitions/commands.mjs', (s) => s.replace('export const commandGroups = {', "export const commandGroups = {\n  'check.extra': { purpose: 't', verbs: ['node scripts/extra.mjs'] },"));
               setSeatPolicy(d, 'reviewer-audit', { allowGroups: ['check.local', 'git.read', 'docgen.read', 'check.extra'] }); }, 'allowCmds'],
  ];
  for (const [mutate, key] of cases) {
    const { plus } = withCopy((d) => { mutate(d); return diffFacts(baseJson().seats['reviewer-audit'], factsFromText(renderBoundaryIn(d, 'reviewer-audit'), probeDict(d))); });
    assert.ok(plus.some((x) => x.startsWith(key)), key);
  }
});
test('H06 V-2 降级判定表：结论只由 diff 决定（哈希不参与）', () => {
  assert.equal(verdict({ minus: [], plus: [], hashEqual: true }), 'pass');
  assert.equal(verdict({ minus: [], plus: [], hashEqual: false }), 'pass', '哈希红 ≠ 不通过');
  assert.equal(verdict({ minus: ['forbiddenPaths: x'], plus: [], hashEqual: true }), 'fail', '哈希绿救不了能力丢');
  assert.equal(verdict({ minus: [], plus: ['allowCmds: y'], hashEqual: false }), 'fail');
  assert.equal(verdict.length, 1, '只接受一个入参对象，不接受第二参数');
});
```

- [x] **Step 2: H02 空差（改造后取渲染文本）**

```js
test('H02 两席 ①–④ 段集合 diff 空差（改造后 = 渲染文本）', () => {
  for (const s of ['reviewer-audit','detective-observer'])
    assert.deepEqual(diffFacts(baseJson().seats[s], factsFromText(renderBoundary(s), probeDict())), { minus: [], plus: [] });
});
```

- [x] **Step 3: H01 / H07 完整复核（v1 的 PG-07 处置：放这里，不放 T1）**

```js
test('H01 基线可复算：sourceCommit 上无 policy/、抽取器不 import policy、可重现', () => {
  const base = baseJson();
  assert.match(base.sourceCommit, /^[0-9a-f]{40}$/);
  const r = spawnSync('git', ['cat-file','-e',`${base.sourceCommit}:tools/docgen/policy`]);
  assert.notEqual(r.status, 0, '改造前 commit 上不得存在 policy/');
  const src = readFileSync('tools/docgen/test/support/capability-baseline.mjs','utf8');
  assert.equal(/policy\//.test(src), false, '抽取器不得 import policy/');
});
test('H07 恒真守卫：两条作弊路径都能被 H01 的断言抓到', () => {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  // 作弊一：基线取 HEAD。改造后 HEAD 已有 policy/ → H01 的「改造前 commit 无 policy/」必红
  assert.equal(spawnSync('git', ['cat-file', '-e', `${head}:tools/docgen/policy`]).status, 0);
  // 作弊二：抽取器 import policy/ → H01 的 /policy\// 断言必红（先证明该正则会命中）
  const fake = "import '../policy/definitions/paths.mjs';\n" + readFileSync('tools/docgen/test/support/capability-baseline.mjs', 'utf8');
  assert.equal(/policy\//.test(fake), true);
});
```

- [x] **Step 4: 全量**

Run: `node tools/docgen/cli.mjs gate`；`npm run check`；`node scripts/scope-sweep.mjs --check`
Expected: `baseline 37/37`、`# fail 0`、`sweep ok`。

---

### Task 10: A/B 盲评 + 四本账单（步骤 9 / 10）—— **`V-13` 不在本期（用户 2026-10-29 裁定）**

> **状态注（2026-10-29）**：本 Task 的 **K 组 8 条与 V-13 已不在本期**，转独立课题 `docs/after/20261029100942-s6-v13-ab-eval-rebuild-open-decisions.md`。四本账单已按 ④ 段审计清单做过格式返工并保留为历史快照，**不再作验收依据**。本 Task 的步骤保留原文，供下期课题参考。

**Files:** Create `.session/reviews/<YYYY-MM-DD-HHMM>-s6-eval/{rubric,capability-diff,ab-score,checklist}.md` + `mapping.sealed.md`；Test `K01`–`K08`

- [x] **Step 1: 建四本账单（列名照 spec §9.2 逐字；rubric 8 维等权、不设权重列）**

```markdown
| 维度 | A 分 | B 分 | 差 | A 证据行 | B 证据行 |
|---|---|---|---|---|---|
| P1 | | | | | |
```

- [x] **Step 2: 取 A/B 两组卡（A = `git show <sourceCommit>:agents/<席>.md`；B = 改造后渲染）**，并写 `mapping.sealed.md`（`.session/...`，不进 git）。

- [x] **Step 3: 派 4 个盲评实例（2 席 × 2 实例；输入只有两张卡，禁读 `mapping.sealed.md`）**，回收 16 行 → 折叠 4 条记录。

- [x] **Step 4: 判据（逐维 B ≥ A 且至少一维 B > A；pending 存在即不通过；总分不作判据）＋置信度现算**

```js
// H06 ⑤：账单不得把哈希当通过判据
const cd = readFileSync(join(evalDir(), 'capability-diff.md'), 'utf8');
assert.equal(/哈希\s*(相等|一致)\s*(→|=|：)\s*(通过|pass)/.test(cd), false, '账单把哈希当通过判据');
// 置信度：读账单 → 记录级零回归 → 交给 rating.mjs 的口径
import { rateFromRecords } from '../../tools/execution-matrix/rating.mjs';
const records = abRecords();                 // 16 行折叠 4 条（testcase §0.4）
const zero = zeroRecords(records);           // 任一维非数字 → 该记录不算零回归
console.log(rateFromRecords({ records: records.length, zero }).level);  // 4 零回归 → high
```

- [x] **Step 5: 账单归档**：评估期留 `.session/`；收口后整目录迁 `docs/superpowers/reviews/<同名>/`（进 git）。

---

## 返工记录（v1 → v2，逐卡）

| 卡 | v1 问题 | v2 处置 |
|---|---|---|
| PG-01 | 无重出卡的步骤/命令 | 新增 **T5 Step 4a**：`draft` → `diff` 取新 sha → `replace --expect-change … --rejudge B3 --yes`；写明 `state.json` / `evidence.json` 副作用与 B3 前置（**历史**：v2 的 `--rejudge 边界`、v2.3 的「省略」均已作废，现行口径见文末「v2.3 → v2.4」） |
| PG-02 | 导出名与已签 testcase 冲突；漏 `tools === TIERS` | Global Constraints 写死导出名；T5 Step 2 加 `tools: TIERS` 同引用；A01 落点移 T5 |
| PG-03 | 11 条用例无落点 | 映射表增「落点 Step」列；T6 补 F02/F03/F04/C09 步骤；T7 补 I01/I03；T9 补 A09/H01–H07/H05；T5 补 G04（Step 3 三处手抄 + Step 4a 重出） |
| PG-04 | 12 个符号未定义 | 新增「判据侧 helper 落点」节：全部照 testcase §0.3/§0.4 原样落；`CLAUSES` 标注为**对象**；删自造 `expand`/`SLOT_VALUE`/`renderWith` |
| PG-05 | 伪命令 / golden 单键 / 置信度读不到 | T1 Step 5、T4 Step 5 换成可执行 `node --input-type=module -e` 命令（含 4 键）；T10 用 `rateFromRecords` 读账单 |
| PG-06 | 自造注入缝；模板缺 ⑨⑩ 与 ⑤ 实例 | 删 `renderWith`，C09 走 `policy --dump`（移 T6）；`seats.mjs` 的 `clause` 显式承接两句职责；⑤ 段补 `round-check.md` 实例 |
| PG-07 | H01/H07 放 T1 收不了口 | T1 只产基线三件；H01/H07 完整断言移 T9 Step 3 |
| PG-08 | 无回滚锚 / 副作用漏列 | T1 Step 6 记 5 条复原命令；T5 Step 4a 列 `state.json` 与 `evidence.json` 改写 |

## 返工记录（v2 → v2.1，逐项）

| 复评项 | v2 问题 | v2.1 处置 |
|---|---|---|
| ① | `--rejudge` 缺 `DOCGEN_JUDGED_BY`，`replace` 必被 `UnapprovedChange` 拒 | T5 Step 4a 两条命令前加 `DOCGEN_JUDGED_BY=…`，并注明 `tools/docgen/cli.mjs:278-287`；副作用行号改 `:473` |
| ② | 10 个自造 helper 在 testcase 中 0 命中 | 删自造名，改为「测试侧局部 helper」节逐个给实现；探针全集按 testcase 六段并集 |
| ③ | `CLAUSES` 标注为对象 | 改为「数组 + 5 字段对象 `{k,why,scope,seat?,re}`」；`assertNeedClauses` 改为「成功返回 seg、失败即抛」，取缺失用 `missingClauses` |
| ④ | 导出名大小写混用 | 统一 `CAP.capabilities`（小写导出），三处改名 |
| ⑤ | S5 三条改判无任务、与「testcase 不再改」冲突 | Global Constraints 澄清「S5 testcase ≠ S6 testcase」；T8 增 Step 2 复核 S5 三条已改判 |
| ⑥ | H04 / H06 / F02 无步骤 | T9 增 H04 / H06 断言；T6 增 F02 槽级复算；H05 改为三条独立断言 |
| ⑦ | golden 只 3 键，第 4 键靠散文 | T4 Step 5 命令补 `evidence-reader-boundary`，期望 `golden keys 4` |
| P2 | `DIM` 拼写、`rateFromRecords` 无行号 | 改 `DIMS`；补 `rating.mjs:3` |
| P2 | `gateChecks` 片段有省略号 | `collectGate()` 后以注释说明「原实现不动，仅前置一行 `validatePolicy()`」 |

## v2.2 → v2.3（施工前口径修正，待复签）

| 项 | v2.2 | v2.3 |
|---|---|---|
| T5 Step 4a `replace` 的 `--rejudge` | 写 `--rejudge 边界`（会被 `InvalidArgs` 拒：`--rejudge` 只收 `A1`–`C4`） | 先看 `diff` 的触达键；边界段通常无触达键 → **省略 `--rejudge`**；有触达键则按键名传 |
| 依据 | — | `tools/execution-matrix/check-agent.mjs` 的 `SEMANTIC_KEYS = ['A1'…'C4']`；`cli.mjs` 的 `touchedSemanticKeys()` 只把 `description` 行判 `A2`、「你是谁/身份」节判 `A1` |

**复签要求**：这是 v2.2 签字后的口径修正，②→③ 行需审计复签一次（只核本条）；复签前 T5 Step 4a 视为待核。**（已被下节 v2.4 取代，本表按历史保留。）**

## v2.3 → v2.4（审计复签打回后的口径修正，待复签）

| 项 | v2.3 | v2.4 | 依据 |
|---|---|---|---|
| 触达键获取方式 | 「先看 `diff` 报出的触达键」 | `diff` **不报**触达键（`tools/docgen/cli.mjs:208-225` 只输出旧/新 sha、差异行、凭证；`cmdDiff` 在 `:314` 逐行打印）→ 键名只在 `replace` 失败时以 `UnapprovedChange: … --rejudge 漏报触达键 <键>` 出现（`tools/docgen/cli.mjs:451-457`） | 审计核对表命题 4 |
| `--rejudge` 取值 | 省略（理由：边界段通常无触达键） | 显式 `--rejudge B3`：边界段即 B3「职责边界一致」的判定对象（`tools/execution-matrix/criteria.md:134-141`）；B 组语义键「一旦判断触及，必须一并报进 `--rejudge`」（`docs/superpowers/specs/2026-10-21-docgen-replace-intent-change-design.md:181`） | 审计打回项 2 |
| 留痕 | `judgeMode:'none'`（= 本次变更无需重判，与「B3 判定对象被改过」的事实相反） | `rejudged=['B3']`、`judgeMode:'subagent'`、`judgedBy` 非空（`tools/docgen/cli.mjs:477-482`） | 同上 |
| 同族回扫（R8） | Global Constraints 两处、Step 4a 前置、PG-01 仍是旧口径 | 四处已同步；`grep -n 'rejudge' <本 plan>` 复核 | 审计打回项 3 |

**复签要求**：v2.4 是 v2.2 签字后的第二次口径修正，`②→③@S6` 行需审计重新复签（只核本条改动）。复签前 T5 Step 4a 视为待核。

## 任务依赖图（DAG）

| 任务 | 依赖 | 产出被谁消费 |
|---|---|---|
| T1 基线 | — | T9（H01/H07/H02） |
| T2 定义层 | — | T3 / T4 / T5 |
| T3 配置层 | T2 | T4 / T5 |
| T4 模板+渲染+校验 | T2 / T3 | T5 / T7 / T9 |
| T5 接入+删常量+重出卡 | T4 | T6 / T9 |
| T6 dump | T4 / T5 | T7 / T10 |
| T7 下探+子句 | T4 / T6 | T9 |
| T8 S5/PRD（已完成） | — | — |
| T9 全量+反向+基线复核 | T1 / T5 / T7 | T10 |
| T10 盲评+账单 | T5 / T9 | 交付 |

**拓扑序**：T1 → T2 → T3 → T4 → T5 → T6 → T7 → T9 → T10（T8 独立）。回边 0。

## 验收命令目标符号核对

| 符号 | 出处 | 备注 |
|---|---|---|
| `gate` | `tools/docgen/cli.mjs` 的 `cmdGate` / `gateChecks` | 既有 |
| `npm run check` | `package.json:5` | 既有 |
| `node scripts/scope-sweep.mjs --check` | `package.json:9` | 已落 |
| `exitCodeFor` | `validateAgentData.mjs:19`（export） | 既有 |
| `draft` / `replace` | `tools/docgen/cli.mjs:318` / `:353`，`REPLACE_FLAGS` 在 `:500` | 既有；`--expect-change` / `--rejudge` / `--yes` 为必填/条件必填 |
| `rateFromRecords` | `tools/execution-matrix/rating.mjs:3` | 既有 |
| `renderBoundary` / `validatePolicy` / `dumpPolicy` | 本 plan T4 / T6 | 施工后核 |
| `factsFrom*` / `diffFacts` / `verdict` | 本 plan T1 | 施工后核 |
| `pathTokens` / `probeDict` / `CLAUSES` / `assertNeedClauses` / `applyLegalGrant` / `useAsGroupLiteral` / `expectedRefCode` / `abRecords` / `zeroRecords` | testcase §0.3 / §0.4 | 施工后核（随测试文件） |

## 测试侧局部 helper（本 plan 定义，落在新测试文件内；不改生产设计）

> 这些是**测试代码**的局部函数，不新增 spec 设计（R4 不触发）。与 testcase §0.3/§0.4 的 helper 并存，命名不冲突。

```js
const PROBE_SEAT = 'senior-sdet';                 // 命令探针席（无 exec、无组）
// 允许侧：14 命令 @PROBE_SEAT + 各席可写产物（按归属席）+ 6 工具（read/write → sdet；exec → 审计）
const allowProbes = () => [
  ...Object.entries(CMD.commandGroups).flatMap(([group, g]) =>
    g.verbs.map((v) => ({ kind: 'cmd', id: v, group, seat: PROBE_SEAT }))),
  ...Object.entries(SEAT_POLICY).filter(([s]) => s !== '__default__')
    .flatMap(([s, p]) => p.artifacts.map((a) => ({ kind: 'artifact', id: a, seat: s }))),
  ...Object.entries(CAP.capabilities).flatMap(([cap, list]) =>
    list.map((t) => ({ kind: 'tool', id: t, cap, seat: probeSeatOf(cap) }))),
];
// 禁止侧：全部字面 verb @PROBE_SEAT + 23 路径 @PROBE_SEAT + 5 禁止组 @reviewer-audit
const denyProbes = () => [
  ...Object.values(CMD.forbiddenGroups).flatMap((g) => g.verbs.map((v) => ({ kind: 'deny-verb', id: v, seat: PROBE_SEAT }))),
  ...pathTokens().map((p) => ({ kind: 'path', id: p, seat: PROBE_SEAT })),
  ...Object.keys(CMD.forbiddenGroups).map((g) => ({ kind: 'deny-group', id: g, seat: 'reviewer-audit' })),
];
const expectedProbeKeys = () => [...allowProbes(), ...denyProbes()].map((p) => `${p.kind}:${p.id}@${p.seat}`);
// 允许命令 token（组内 verbs 拍平，供 A06 / C06 用）
const commandTokens = () => Object.values(CMD.commandGroups).flatMap((g) => g.verbs);
// 往模板末尾追加一行（副本内）
const appendToTemplate = (dir, line) => editInDir(dir, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n${line}\n`);
// CRLF / BOM 两种编码变异
const toCRLF = (p) => writeFileSync(p, readFileSync(p, 'utf8').replace(/\n/g, '\r\n'));
const addBOM = (p) => writeFileSync(p, `\uFEFF${readFileSync(p, 'utf8')}`);
```

## Self-Review

**1. Spec 覆盖**：§3.1–§3.7 → T2–T5；§5 布局 → T2–T6；§6 步骤 0–10 → T1–T10；§7 六码 → T4/T5/T6；§8 V-1～V-13 → T1（基线）/T4（C）/T5（D/E/G）/T6（F/C09）/T7（I/J）/T9（H/A09）/T10（K）；§9 评估 → T10。无遗漏。

**2. 占位符扫描**：无 TBD；5 处伪命令已换成可执行 `node --input-type=module -e`；`renderWith` / `SLOT_VALUE` / `expand` 等自造符号已删，改用 testcase §0.3/§0.4 的现成 helper。

**3. 类型一致性**：`renderBoundary(seat) → string`（T4 产、T5/T7/T9 用）；`tierOfCapabilities(caps)`（T2 产、T3/T5 用）；`factsFromBaselineText/factsFromText(text, dict)`（T1 产、T9 用）；`SEAT_POLICY` 三键（T3 产、T4/T5 用）；导出名与 testcase 逐字一致（`commandGroups` / `forbiddenGroups` / `pathGroups` / `SEAT_NAMES` / `TIERS`）。

## 计划门（②→③）对照

| 判据 | 本计划对应 |
|---|---|
| 功能点全覆盖 | F-24 全部落 T1–T10；T8 为已完成项复核 |
| 依赖无环 | 见 DAG 表，回边 0 |
| 功能块 ↔ testcase 一一映射 | 映射表 78/78，每行带落点 Step |
