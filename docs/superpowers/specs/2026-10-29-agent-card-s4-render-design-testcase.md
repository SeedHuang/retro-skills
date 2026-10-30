# 测试用例：agent-card S4 渲染层（一份数据 → 三投影 + 全席重生成，F-09～F-12、F-23）

> **归属 spec**：`docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md`（**v4，245 行**，内容已定稿、待议会 #2 签字）。
> **上游权威**：`docs/prd/20261026205821-agent-card-contract.md` §3.7 `:219-241`（三投影 + 卡面契约 + 单源 `:239`）/ `:223`（零散文）/ `:225`（dump stdout-only）/ `:231`（`description` 只写触发条件）/ `:234`（`never` 只判 objects + criterion）/ `:236`（本席清单）/ `:280` / `:293`（subject 枚举）/ `:310`（`registeredIds`）/ `:321` / A-4 `:55` / A-5 `:56` / C-08 `:121` / §6 F-09～F-12 `:473-476`、F-23 `:487` / §8 S4 行 `:519` / D-05 `:500`、D-07 `:502` / §9.2 P-A、P-B `:576`。探索稿：`docs/after/20261026164718-agent-card-composition-exploration.md`（§12.6 `:419-428` / §12.9 `:459-475`）。
> **编写者**：`senior-sdet`（独立子代理，**全新上下文**）。
> **独立性声明**：编写者 = 本文件唯一作者，**≠ spec 作者、≠ 施工者**；用例只在 spec §1–§12 与 PRD 上生长，**未参与任何实现**，**未修改 spec / PRD / rule / skill / agent / 业务代码**；对实现的只读观察（`tools/docgen/{cli.mjs,components/*,card-model/**,state.json}`、`tools/execution-matrix/check-agent.mjs`、`tools/observation-check/{card-exempt,registered-ids}.mjs`、`scripts/check-all.mjs`、`tools/docgen/acceptance/cold-run.mjs`、`agents/*.md`）只进「来源 = 实现观察（补充）」的用例与 §7 / §8，**不得据此放宽或删掉任何 spec 推导用例**。**发现 spec 缺口只记 §7 / §8，不改 spec**。
> **版本**：**v4**（2026-10-29 对齐 spec v4；v1 = 54 / v2 = 57 / v3 = 58 条）。**v4 = 61 条**（净增 A08 / F10 / K01；A02 由 9 键改 **12 键**；G02/G07 改指针词**同形判定**；F01~F05·F07·I02·I03·H01·H03·J01 按 v4 改判据）。｜**日期**：2026-10-29。
> **v4 增量说明（对齐 spec v4 的 15 项 + 议会 #2 第 1 轮 **20 张必修（P0 5 / P1 15）**）**：① `Card` = S1 全量 **12 键**（§4 `:89-90`）→ A02 的 `KEYS` 改 12、拒绝经 `CM.validateCardModel` 判（不再直接调 `renderCard`）。② 授权链不变（`generate` 只比不写；`writeAll` 只是 `draft`/`replace`/`generate --readme --apply` 共用实现，§3 `:71`）→ F01 按「只比不写 + 旗标存在」断言；F02 加「`generate` 无旗标 → 31 份不写」。③ §7① `:179` **单席原子** → F02 加「单席坏卡被拒、其它席照常」+「收口坏 1 席 → 31 份不变」。④ §7③ `:181` 缺 README → `DanglingBaselineEntry` → F04 加第三构造。⑤ §7④ `:182` 收口期 + 中期子集 → F05 两构造。⑥ §7⑤ `:183` 「输出中**含**该行」+ `disposeCardFindings` 注入 → F07 重写。⑦ §5.1 `:143` 指针词同形判定 + `:145` 假阳性守卫 → 指针词走正则；G07 加守卫。⑧ V-4 只认 `PROSE_PROBES`（`:204`）→ 删自写词表。⑨ V-7 `:207` `never` 只判 objects + criterion → G05 改。⑩ §10-D12 `:225` `EXIT` 表承接 S1 码 → **新增 F10**。⑪ §10-D11 `:224` A1/A2 迁「职责」→ **新增 A08**。⑫ §4 `:95` registeredIds 传本席单元素 → I03 改。⑬ §4 `:94` `<seat>.card` 形态 → G01 加断言。⑭ 16 vs 31 两口径（§1 `:20`）→ F02/F04 全用派生式。⑮ 探索稿路径（spec `:7`）→ 只作来源。**B 组 13 项必修**：A03 删段改「删第 4 段」/ A01 改 `specTableStrict`（不跨段污染）/ A05 按表头行定位 / I02 改「常量逐字相等 + `git diff --quiet HEAD`」/ H01 断 `docs/reports/` 归档副本 / H03 改 `git log -1 --numstat` / J01 加无 CR·BOM / `coldRepo` 补未跟踪文件 / G03 改「= use 引用该 id 的席数」/ §0.3 词表 8 名 / 缺口 16 移入闭合 / 自指恒真改外部集合相等 / `typeof` 前置 / PRD 同批改守卫（**新增 K01**）。
> **行号口径**：全文 `spec :行号` 按 spec **v4 实文（245 行）** 逐条 Read 核对取值（§3 导出名表 `:58-65`、写盘入口 `:71`、§4 `Card` `:89`、§5 `reason` `:119`、§5.1 主表 `:123-132`、A3–A7 `:134`、探针表 `:139-143`、探针 bullet `:145`、§5.2 试点席 `:154`、§6 现状表 `:166-171`、§7 表 `:179-184`、§8 步 1 `:190`、§9 V-4 `:204` / V-7 `:207`、§10-D1 `:214` / D5 `:218` / D6 `:219` / D7 `:220` / D11 `:224` / D12 `:225`）；PRD 锚点按 PRD 实文（619 行）实测。
> **命名与落点**：`rules/spec-testcase-gate.md` 判据 1 —— 与 spec 同目录，文件名 = spec 去 `.md` + `-testcase.md`（spec 头部第 8 行外链指向本文件）。
> **用例 ID 前缀**：`S4-TC-`（与 S1/S2/S6 区分）。
> **判据口径声明**：「判据」列一律是**可直接照抄的 `assert.*`**（含前置非空）或「命令 + 退出码 + 关键输出首行」；禁「功能正常」「符合预期」与 `assert.ok(true)` 类恒真。每条标**来源**：`spec 推导` 或 `实现观察（补充）`。「对应测试」列统一 `tools/docgen/test/card-render.test.mjs`（③ 段产出，本文件只定落点）。
> **条数**：**61 条 ≤ 70**（`TC_MAX 80`，余量 19）。
> **禁三类失败形态**：① 恒真判据 → 每条断言前先断前置非空；② 判据互斥 → 同形态双命中由 F09 / I04 的变异构造守；③ 缺第三人通道 → 见 §4。

---

## 0 判据基线（读用例前先认这 12 条事实，全部可复核）

| # | 事实 | 出处（可复核） |
|---|---|---|
| 1 | `agents/*.md` = **15 张**；`tools/docgen/card-model/` 12 个 `.mjs`（10 主 + `vocab/` 2），`index.mjs` 出口面 18 项；`card-model.test.mjs` 58/58 绿 | `(Get-ChildItem agents -Filter *.md).Count` → 15；`index.mjs:2-5` |
| 2 | `docs/agents/` **当前不存在**（`Test-Path` → `False`）；16 个生成物（15 席 README + index）全部由 ③ 段新建 | 目录清单（2026-10-29 实测） |
| 3 | `tools/docgen/test/` 27 个 `.test.mjs`，**无** `card-render.test.mjs` | 计数 27；`Test-Path` → `False` |
| 4 | `outputFormats.mjs` 现状 **3 块**（`audit:2` / `observation:73` / `evidence:85`），**无 `testcase` 块**；`audit` 含 4 段散文声明（`:2-4`/`:21`/`:25`）+ 引用 `references/doc-taxonomy.md`（`:40`）；`evidence` `:87` 引用「固定必问清单」 | `Select-String … '^\s*(audit|observation|evidence|testcase):'` |
| 5 | `patternRegistry.mjs:44` 仍是派生式 ``在${domain}中担任${role}…时调用``；引用它的常驻测试 = `e2e-final.test.mjs:17-18`、`pilot-data.test.mjs:36,40`、`validateAgentData.mjs:70-71` | spec §10-D3 `:216` 的实现侧复核 |
| 6 | `registered-ids.mjs:5` 实值 `['k01','k02','k03']`；`CHECK_ITEMS` 在该目录 **2 处命中、全为注释**（`registered-ids.mjs:2-3`），无 `export` 载体（与 spec §10-D6 `:219` 同形） | `Get-ChildItem tools\observation-check -Recurse -Filter *.mjs \| Select-String 'CHECK_ITEMS'` → 2 行 |
| 7 | `card-exempt.mjs:24` = `export const EXPIRY_LANDED = false`；`disposeCardFindings` 已导出（`landed:false` → warnings / `true` → blockers）；`check-all.mjs:418` 打印 `[豁免窗口]` 行（**非首行**） | `card-exempt.mjs:24`；`check-all.mjs:418` |
| 8 | `collectGate`（`tools/docgen/cli.mjs:104-112`）已按 `state.agents[席] === 'replaced'` 逐席比对卡面（`state.json` 15 席全 `replaced`）→ §7② 已生效；但**不校验 state 完整性**（缺一席静默跳过） | `tools/docgen/cli.mjs:104-112`；`state.json` |
| 9 | `validateAgentData.mjs:4-22` 是封闭 `EXIT` 表（0/1/2/3/4 分档），`exitCodeFor` 导出；**S1 的 36 码不在表内**（未接时 `exitCodeFor` 抛「未知错误码」）；`BASE_KEYS` 11 键不含 `card` | `validateAgentData.mjs:4-22` / `:117-129` |
| 10 | S1 `mergeActions` 的 `overrides[]` 只带 `{id, changed}`（`merge.mjs:63`）；`reason` 留在 own 条目上 → spec §5 `:119` 写死由 `cardPipeline` join | `merge.mjs:63` |
| 11 | 旧模板名仓内 **16 处**命中，其中 `agents/senior-sdet.md:9` 是卡面正文（写模板名）→ spec §7⑥ `:184` 要求 `sourceLine` 随旧模板删 | `Select-String 'agent.md.tpl\|agent-handwritten.md.tpl'`（排除 `docs/`） |
| 12 | `touchedSemanticKeys`（`tools/docgen/cli.mjs:259-277`）的段名表在 `:271-274`，现状只认「你是谁 / 身份」；`cards` 里 `name/description/tools` 由 `seatEntry` 派生（spec §4 `:90`） | `tools/docgen/cli.mjs:271-274` |

### 0.1 覆盖账（3 投影 / 8 条验收 / 5 个功能点 / 6 段门禁 / 8 个 `vocab/` 导出名）

| 项 | 数量 | 复算口径（机器可判） |
|---|---|---|
| 投影 | **3**（卡面 / README+index / dump） | §5 三行（`:112-117`）；B01 / B03 / B07 |
| 卡面段 | **7 段**（`CARD_SEGMENTS`，§3 `:62`）+ front matter（§5.1 主表 8 行 `:123-132`） | `SEGS()` 与 spec 主表首列去 front matter 后 `deepEqual`（A01 / A03） |
| `Card` 键 | **12**（§4 `:89`） | A02 的 `KEYS.length === 12` + 逐键拒绝 |
| `vocab/` 导出名 | **8**（`CARD_SEGMENTS` / `MUST_FIELDS` / `PROSE_PROBES` / `PREDICATES` / `LANDINGS` / `SHARED_MUST` / `SHARED_NEVER` / `SHARED_USE`，§3 `:58-65`） | A07 导出面 `deepEqual` |
| 零散文探针 | **3 类**（旧段名 / 声明句式 / 指针词；单源 = `PROSE_PROBES`，§3 `:62` + §5.1 `:137-145`） | G02 三类逐词对账 + G07 三类反例 + 守卫 |
| 生成物 | **两数口径**（§1 `:20`）：`docs/agents/**` = **16**；gate 比对面 = `2 × 席数 + 1` = **31** | F02 / F04 的 `TARGETS` 派生式 |
| 验收项 | **V-1～V-8**（§9 `:201-208`） | §1 末「验收对位」 |
| 功能点 | **F-09 / F-10 / F-11 / F-12 / F-23**（PRD `:473-476` / `:487`） | §1 末「F 对位」 |
| 门禁段 | **6**（§7 ①～⑥ `:179-184`） | F01～F09 |

### 0.2 测试设计固定清单（逐条必答）

| # | 项 | 结论（落点） |
|---|---|---|
| 1 | **输入空间** | 数据层 `seatEntry` × `card` **12 键**（缺/空/类型错 → A02）；词表层 4 个 `vocab/` 表（空/未登记 → A07 / E05 / F10）；生成物层 31 份（缺/多/手改 1 字节/CRLF → F02 / F03 / F04 / J01） |
| 2 | **状态与转移** | 渲染纯函数；状态只在写盘（无写盘 → `.tmp-<pid>` → rename，F02/J02）与 `state`（收口期集合 + 中期子集，F05/F06） |
| 3 | **失败面** | 只有文件 IO 与子进程：坏卡零写盘（F02）、`.part` 残留（J02）、手改生成物（F03/F04）、state 缺席（F05）、dump 误落盘（B07）、旧模板残留（F08/F09）、未知码（F10） |
| 4 | **判据来源** | 只用 spec §1–§12（v4，245 行）+ PRD；期望值从上游切：`specTableStrict` 切 §5.1 **主表**、A3/A4/A5 切 `:134`、旧段名/声明句式切 `:141-142`、**指针词切 S1 §7 `:188`**；selector 一律派生（`SEATS` / `PARL` / `CARD_FILES`） |
| 5 | **确定性** | 全部 `assert.*` 常量比较；读写盘只在**临时副本**（`coldRepo()`：`mkdtempSync` + 已跟踪 + **未跟踪未忽略**文件复制 + 用完 `rmSync`）；无时间/随机/并发 |
| 6 | **回归资产** | 新测试进全仓 `**/*.test.mjs` glob（`check-all.mjs` ② 段）→ 自动回归；固化缺陷：F02（零写盘）/ F05（state）/ F09·I04（探针面）/ B05·B08（reason）/ F10（EXIT 表）；改 `agents/*.md`、`docs/agents/**` → F03/F04；改 `vocab/**` → A07/E01/G02；改 `state.json`/`cli.mjs` → F05/F06/F10 |
| 7 | **判别力（各一样例）** | 假阳性：A06（`rationale` 散文合法）、G07 守卫（「遇意见冲突 / 可见 / 参考周围人的意见」→ 指针词 0 命中）、C03（非议会席本就 0 命中）、C06（议会席允许「主持人」）；假阴性：F05（state 已全 replaced → 只断当前值恒绿）、F09（探针面写错）、I04（只查字符串不查 `readFileSync`）、B08（不 join reason）、A07（只判「有这几个」）、G03（`>= 1` 弱判据） |
| 8 | **盲点雷达** | 脏状态（F06）、中断恢复（F02/J02）、幂等（J01）、顺序（A03 段序 / B03 index）、跨平台（J01 无 CR/BOM/绝对路径）、副本口径（G03 / E01）、`agents/*.md` 不当输入（I04）、`registeredIds` 不提前切换（I01/I02）、**中期子集（F05 ②）**、**上游同批改（K01）** |
| 9 | **覆盖账** | **61 条**：正 23 / 负 20 / 边界 18 → 负+边界 **38 ≥ 正 23**；总 61 ≤ 70（§9 有可复算命令） |

### 0.3 共用 helper（在 `tools/docgen/test/card-render.test.mjs` 模块顶层声明一次，不得抄进各 `test()` 回调）

> 判据里出现的符号本节必有实现；**不存在「只有签名 + 注释」的 helper**。席名 / 段名 / 目标文件一律从定义层派生（不写死中文与 15）。4 个 `vocab/` 表的导出名与键形由 spec v4 §3 `:58-65` **写死**（8 个名字）。

```js
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';

import * as PIPE from '../components/cardPipeline.mjs';                 // §3 :70 装配唯一入口
import { agentData, triggerTable } from '../components/agentData.mjs';   // 唯一数据源（F-23）
import { renderCard } from '../components/renderCard.mjs';               // §3 卡面投影
import * as OF from '../components/outputFormats.mjs';                   // §6 结构化合同
import * as MF from '../card-model/vocab/card-must-fields.mjs';          // §3 :62 单源（8 名之一）
import * as PRED from '../card-model/vocab/predicates.mjs';
import * as LAND from '../card-model/vocab/landings.mjs';
import * as SH from '../card-model/vocab/shared-actions.mjs';
import * as CM from '../card-model/index.mjs';                           // S1 出口面（只消费）
import { checkStruct } from '../../execution-matrix/check-agent.mjs';    // A3–A7 单源
import { touchedSemanticKeys } from '../cli.mjs';                        // §10-D11 :224
import { exitCodeFor } from '../components/validateAgentData.mjs';       // §10-D12 :225
import { EXPIRY_LANDED, disposeCardFindings } from '../../observation-check/card-exempt.mjs';  // §7⑤ :183

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..');
const AGENTS_DIR = join(REPO, 'agents');
const DOC_AGENTS_DIR = join(REPO, 'docs', 'agents');
const SPEC_PATH = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s4-render-design.md');
const S1_SPEC_PATH = join(REPO, 'docs', 'superpowers', 'specs', '2026-10-29-agent-card-s1-card-model-design.md');
const PRD_PATH = join(REPO, 'docs', 'prd', '20261026205821-agent-card-contract.md');

const NON_PARL = ['evidence-reader', 'senior-sdet'];     // spec §4 :97 点名的两个非议会席
const SEATS = agentData.map((a) => a.name);
const PARL = SEATS.filter((s) => !NON_PARL.includes(s));
const CARD_FILES = readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
assert.ok(SEATS.length > 0, 'agentData 不得为空');
assert.ok(PARL.length > 0 && NON_PARL.every((s) => SEATS.includes(s)), '议会 / 非议会两侧都必须非空（§4 :97）');
assert.ok(CARD_FILES.length > 0, 'agents/*.md 不得为空');

const TARGETS = [...CARD_FILES.map((s) => `agents/${s}.md`), 'docs/agents/README.md', ...SEATS.map((s) => `docs/agents/${s}.md`)];
assert.equal(TARGETS.length, 2 * SEATS.length + 1, '生成物 / 比对面必须 = 2×席数+1（§1 :20）');

const RS = (s) => {
  const r = PIPE.renderSeat(s);
  assert.ok(r && typeof r.card === 'string' && r.card.length > 0, `renderSeat(${s}).card 必须非空（§4 :83 单席原子）`);
  assert.ok(typeof r.readme === 'string' && r.readme.length > 0, `renderSeat(${s}).readme 必须非空（§5 :116）`);
  return r;
};
const CARD = (s) => RS(s).card;
const ALL = () => {
  const r = PIPE.renderAll();
  assert.ok(r && Array.isArray(r.cards) && r.cards.length === SEATS.length, `renderAll().cards 数必须 = 席数 ${SEATS.length}`);
  assert.ok(Array.isArray(r.readmes) && r.readmes.length === SEATS.length, 'renderAll().readmes 必须每席一份');
  assert.ok(typeof r.index === 'string' && r.index.length > 0, 'renderAll().index 必须非空');
  return r;
};
const readmeOnDisk = (s) => {
  const p = join(DOC_AGENTS_DIR, `${s}.md`);
  assert.ok(existsSync(p), `README 缺 ${p}（§5 :116 落点 = docs/agents/）`);
  return readFileSync(p, 'utf8');
};

const TERM_RE = /议长|主持人/;                          // §5.2 :152-155
const DERIVED_DESC_RE = /在[^。\n]{0,20}中担任/;        // §10-D3 :216
const probeSrc = (p) => (p instanceof RegExp ? p.source : String(p));
const PROBE_CLASSES = { oldSegments: '旧段名', declaration: '声明句式', pointers: '指针词' };   // §5.1 :139-143 的「类」列
const PROSE_PROBES = () => {
  const p = MF.PROSE_PROBES;
  assert.ok(p && typeof p === 'object' && !Array.isArray(p), 'PROSE_PROBES 必须是三类分组的对象（§3 :62）');
  for (const k of Object.keys(PROBE_CLASSES)) assert.ok(Array.isArray(p[k]) && p[k].length > 0, `PROSE_PROBES.${k} 必须是非空数组（§3 :62）`);
  return p;
};
// 指针词按 S1 同形判定（词 + 后随章节号/数字），**不是裸子串**（§5.1 :143；S1 validateCardModel.mjs:96-101 的 pointerHit）
const POINTER_FORM = () => {
  const ws = PROSE_PROBES().pointers.map(probeSrc).filter(Boolean);
  assert.ok(ws.length > 0, 'PROSE_PROBES.pointers 必须非空（§3 :62 / :143）');
  const esc = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:${ws.map(esc).join('|')})\\s*(?:§|第|\\d)`, 'g');
};
const hitClass = (text, cls) => (cls === 'pointers'
  ? [...String(text).matchAll(POINTER_FORM())].map((m) => m[0])
  : (PROSE_PROBES()[cls] ?? []).filter((p) => (p instanceof RegExp ? p.test(text) : String(text).includes(p))));

const SPEC_LINES = readFileSync(SPEC_PATH, 'utf8').split(/\r?\n/);
const specLine = (n) => {
  const l = SPEC_LINES[n - 1];
  assert.ok(typeof l === 'string' && l.length > 0, `spec :${n} 不得为空（spec 行号已漂移）`);
  return l;
};
const cellsOf = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
// **严格版**：遇第一处非表格行即停（§5.1 主表后紧跟「零散文探针」表，宽松版会混采 → A01 恒红）
const specTableStrict = (headRe) => {
  const start = SPEC_LINES.findIndex((l) => headRe.test(l));
  assert.ok(start >= 0, `spec 缺节 ${headRe}`);
  const out = [];
  for (let i = start + 1; i < SPEC_LINES.length; i++) {
    const l = SPEC_LINES[i];
    if (!l.trim().startsWith('|')) { if (out.length > 0) break; continue; }
    const c = cellsOf(l);
    if (c.length < 2 || c.every((x) => /^:?-{3,}/.test(x))) continue;
    out.push(c);
  }
  assert.ok(out.length > 0, `${headRe} 下必须有一张表`);
  return out;
};
const SPEC_SEGMENTS = specTableStrict(/^### 5\.1/).map((c) => c[0]).filter((s) => s && s !== '段').map((s) => s.replace(/`/g, '').trim());
const SPEC_7 = SPEC_SEGMENTS.filter((s) => s !== 'front matter');       // §3 :62 的 CARD_SEGMENTS = 7 段
const SEGS = () => {
  const v = MF.CARD_SEGMENTS;
  assert.ok(Array.isArray(v) && v.length === SPEC_7.length, `CARD_SEGMENTS 必须是 ${SPEC_7.length} 个段名（§3 :62），实得 ${Array.isArray(v) ? v.length : typeof v}`);
  return v.map((s) => String(s).replace(/`/g, '').trim());
};
const MUST_FIELDS = () => {
  const v = MF.MUST_FIELDS;
  assert.ok(Array.isArray(v) && v.length > 0, 'MUST_FIELDS 必须是非空数组（§3 :62）');
  return v.map(String);
};
const VOCAB_EXPORTS = {
  'card-must-fields.mjs': ['CARD_SEGMENTS', 'MUST_FIELDS', 'PROSE_PROBES'],
  'predicates.mjs': ['PREDICATES'],
  'landings.mjs': ['LANDINGS'],
  'shared-actions.mjs': ['SHARED_MUST', 'SHARED_NEVER', 'SHARED_USE'],
};
const VOCAB_NS = { 'card-must-fields.mjs': MF, 'predicates.mjs': PRED, 'landings.mjs': LAND, 'shared-actions.mjs': SH };
const WRITE_ALL = () => {
  assert.equal(typeof PIPE.writeAll, 'function', 'cardPipeline.writeAll 必须是函数（§3 :71 共用落盘实现）');
  return PIPE.writeAll;
};

const walkFiles = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walkFiles(p, out); }
    else if (/\.(mjs|md|json|tpl)$/.test(e.name)) out.push(p);
  }
  return out;
};
const runNode = (args, cwd = REPO, env = null) => {
  const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: env ? { ...process.env, ...env } : process.env });
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
};
const runCli = (args, cwd = REPO, env = null) => runNode(['tools/docgen/cli.mjs', ...args], cwd, env);

// 临时副本（同 tools/docgen/acceptance/cold-run.mjs 的做法）：已跟踪 + 未跟踪未忽略文件一起复制
// 为什么补 --others：`docs/agents/**` 是新增未提交文件，只复制 ls-files 会让副本缺生成物 → 恒红/恒绿
const coldRepo = ({ mutate = null, args = ['gate'], verify = null } = {}) => {
  const copy = mkdtempSync(join(tmpdir(), 's4-tc-'));
  const list = (argv) => execFileSync('git', ['-c', 'core.quotePath=false', ...argv], { cwd: REPO, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter((f) => f && !f.startsWith('.git/'));
  const files = [...new Set([...list(['ls-files']), ...list(['ls-files', '--others', '--exclude-standard'])])];
  for (const f of files) {
    const src = join(REPO, f);
    if (!existsSync(src)) continue;
    const dst = join(copy, f);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst);
  }
  if (existsSync(DOC_AGENTS_DIR)) cpSync(DOC_AGENTS_DIR, join(copy, 'docs', 'agents'), { recursive: true });
  if (mutate) mutate(copy);
  mkdirSync(join(copy, '.drafts'), { recursive: true });
  const r = runCli(args, copy, {
    DOCGEN_DRAFTS_DIR: join(copy, '.drafts'),
    DOCGEN_STATE_PATH: join(copy, 'tools/docgen/state.json'),
    DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures'),
  });
  try { if (verify) verify(copy, r); } finally { rmSync(copy, { recursive: true, force: true }); }
  return r;
};
```

### 0.4 构造向量（三类坏输入，一次写死、多例复用）

```js
// kind:'mem' —— 改本席 card 数据（不改源文件；用完还原）
const mutCard = (seat, fn) => {
  const a = agentData.find((x) => x.name === seat);
  assert.ok(a && a.card && typeof a.card === 'object', `${seat} 必须已有 card 数据（§4 :80）`);
  const keep = structuredClone(a.card);
  fn(a.card, keep);
  return () => { a.card = keep; };
};
// kind:'cold' —— 副本内往 agentData.mjs 追加一条「坏卡」注入语句（仓库零改动）
const INJECT_BAD = (predicate = 'no.such.predicate') => (copy) => {
  const p = join(copy, 'tools/docgen/components/agentData.mjs');
  const src = readFileSync(p, 'utf8');
  assert.ok(src.length > 0, 'agentData.mjs 必须非空');
  writeFileSync(p, `${src}\n;(agentData[0].card.must[0].criterion = '${predicate}');\n`, 'utf8');
};
const APPEND_ONE_BYTE = (rel) => (copy) => {
  const p = join(copy, rel);
  assert.ok(existsSync(p), `副本内缺 ${rel}`);
  writeFileSync(p, `${readFileSync(p, 'utf8')}x`, 'utf8');
};
```

---

## 1 覆盖总表

| 用例 ID | 覆盖的 spec 条目（§ / V / F） | 一句话场景 | 类型 | 层级 | 判据类型 | 执行方式 | 优先级 |
|---|---|---|---|---|---|---|---|
| S4-TC-A01 | V-1 / §5.1 `:123-132` / §3 `:62` / F-09 | 15 卡 7 段齐 + 每段必渲染字段在位（段名从 spec **主表**严格切，不跨段污染） | 正 | 单元 | 机器 | `node --test tools/docgen/test/card-render.test.mjs` | P0 |
| S4-TC-A02 | V-1 / §4 `:89`（`Card` 12 键）/ §4 `:98`（拒绝语义） | `Card` **12 键**逐键删除 → 12 次均经 S1 入口被拒（不静默兜底） | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-A03 | V-1 / §5.1 `:123-132` / §3 `:62` | 卡面二级节名/顺序逐项等于 `CARD_SEGMENTS`：多段 / **删第 4 段** / 换序各必红 | 边界 | 单元 | 机器 | 同上 | P0 |
| S4-TC-A04 | V-1 / §5.1 `:134` / §2-4 `:30` | 7 段模板同时满足 A3–A7：`checkStruct(卡面)` → `findings: []` | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-A05 | §5.1 `:134`（A3 表头 / A4 / A5 三处原文） | A3–A7 判别力（**按表头行定位**）：四变异各只红一码 | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-A06 | §5.1 `:135` / PRD `:223` | `rationale` 只在 README、不进卡面 | 边界 | 单元 | 机器 | 同上 | P0 |
| S4-TC-A07 | §3 `:58-65`（导出名与键形写死）/ V-1 | 4 个 `vocab/` 表导出面**恰为 8 个**名字：多一 / 少一 / 改名即红 | 边界 | 单元 + 静态 | 机器 | 同上 | P0 |
| S4-TC-A08 | §10-D11 `:224` / §2-4 `:30` | `touchedSemanticKeys` 认「职责」段：三形态都触发 A1、description 触发 A2、源码含「职责」 | 正 | 单元 + 静态 | 机器 | 同上 | P0 |
| S4-TC-B01 | V-2 / §5 `:112-117` / F-10 | 三投影同源：`dump.name` = 卡 front matter `name`（12 键后成立）、`rationale` 只进 README | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-B02 | V-2 / §5 / F-10 | 改数据 1 处 → README / dump 跟随、卡面因 `rationale` 不入卡面而不变 | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-B03 | V-2 / §3 `:53-55` / F-10 | 落盘后 15 份 README + index 15 行且链接目标全在 | 正 | 集成 | 机器 | 同上 | P0 |
| S4-TC-B04 | §3 `:54`（index 五列）/ F-10 | index 表头列齐（席名 / 职责一句 / 维度 / 输出类型 / 链接） | 边界 | 集成 | 机器 | 同上 | P1 |
| S4-TC-B05 | V-3 / §5 `:116-119` / §12-R4 `:243` | `buildCards()` 的 `overrides[]` 每条带非空 `reason`（S1 只给 `{id,changed}`） | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-B06 | V-3 / §5 `:116` | README 覆盖表行数 = `overrides` 条数（0 条时表头仍在） | 边界 | 集成 | 机器 | 同上 | P0 |
| S4-TC-B07 | §5 `:117` / PRD `:225` | dump = stdout-only：可 `JSON.parse`；`cmdDump` 分支无写盘、**不调 `writeAll`** | 边界 | 集成 + 静态 | 机器 | 同上 | P0 |
| S4-TC-B08 | §5 `:119`（reason 来自 own；三列缺一拒渲染）/ V-3 | 覆盖 reason 取自 own（不 join 即红）；无 reason → `OverrideWithoutReason` 且拒绝渲染 | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-C01 | §5.2 `:151` / §10-D3 `:216` / F-12 | `description` = `trigger.when` 直出（不含旧派生式） | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-C02 | §5.2 `:151` / F-12 | `notWhen.text` 两形态（有则附「不用于」，无则无） | 边界 | 单元 | 机器 | 同上 | P1 |
| S4-TC-C03 | §5.2 `:153` / PRD `:280` / F-12 | 非议会席卡面 0 命中「议长 / 主持人」 | 正 | 单元 + 静态 | 机器 | 同上 | P0 |
| S4-TC-C04 | §5.2 `:155` | 非议会席数据塞「主持人」→ 卡面命中即红 | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-C05 | §5.2 `:152` / §5.2 `:154` / A-5 `:56` | 议会席混用两词必红、单用绿（原样搬必红） | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-C06 | §5.2 `:154` / A-5 `:56` / F-12 | 试点席迁移后「议长」= 0 且「主持人」在位 | 正 | 集成 + 静态 | 机器 | 同上 | P0 |
| S4-TC-D01 | §6 `:161-164` / §6 表 `:166-171` | 5 个 `outputKind` 每份结构化 `{fields[], checks[]}`（无散文、无指针） | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-D02 | §6 `:171` | `testcase` 块在位且写可执行命令 | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-D03 | §6 `:169` / PRD `:223` | 输出格式段残留 `doc-taxonomy` 指针 → 卡面指针词红 | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-D04 | §6 `:168` | 散文声明残留 → `declaration` 类探针红 | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-D05 | §6 `:173`（禁 15 份副本） | `outputFormats` 不复制进席数据；同 kind 席输出格式段逐字相等 | 边界 | 单元 | 机器 | 同上 | P0 |
| S4-TC-E01 | §4 `:91` / V-3 / §12-R4 `:243` | 共享层单源：判据 id 在 `shared-actions.mjs` 源码里恰好出现 1 次 | 正 | 单元 + 静态 | 机器 | 同上 | P0 |
| S4-TC-E02 | V-3 / §4 `:91` / F-10 | 带 reason 的覆盖合法且被记账 | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-E03 | §4 `:91` / S1 `merge.mjs` | 无 reason → `OverrideWithoutReason`；零差异 → `PointlessOverride` | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-E04 | §12-R4 `:243` / V-3 | 绕共享层写全量 → `DuplicateStatement` | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-E05 | §4 `:91`（`use` 白名单）/ §3 `:65` | 声明才合并、未声明不合并 | 边界 | 单元 | 机器 | 同上 | P0 |
| S4-TC-F01 | §7① `:179` / §3 `:71`（`generate` 只比不写）/ §5 `:115` | `generate` exit 0 且 15 卡逐字节 = 渲染产物；`writeAll` 与 `--readme`/`--apply` 旗标在位 | 正 | 集成 | 机器 | 同上 | P0 |
| S4-TC-F02 | §7① `:179`（单席原子 + 收口零写盘）/ §3 `:71` / §4 `:98` | 单席坏卡被拒且其它席照常；收口坏 1 席 → 31 份不变；`generate`（无旗标）→ 31 份也不写 | 负 | 集成 | 机器 | 同上 | P0 |
| S4-TC-F03 | §7② `:180`（现状已生效，防回退）/ V-5 / F-23 | 改卡面 1 字节 → `gate` exit 1 且点名 | 负 | 集成 | 机器 | 同上 | P0 |
| S4-TC-F04 | §7③ `:181`（本段新增；比对面 31）/ V-5 / F-23 | 改 README/index 1 字节 → 红；**删一份 README → `DanglingBaselineEntry`**；比对面 = 2×席数+1 | 负 | 集成 | 机器 | 同上 | P0 |
| S4-TC-F05 | §7④ `:182`（收口期 + 中期子集）/ V-5 / C-08 `:121` | 删 state 一席 → 红；**中期「未迁移席却有 README」→ 红**；对照必绿 | 负 | 集成 | 机器 | 同上 | P0 |
| S4-TC-F06 | §7④ `:182` / C-08 `:121` | `state.agents` 键集 = 席集双向相等、值域合法、全部 `replaced` | 边界 | 集成 | 机器 | 同上 | P0 |
| S4-TC-F07 | §7⑤ `:183`（输出中含该行 + 注入有行为差异）/ §10-D7 `:220` | `EXPIRY_LANDED === true`、豁免行非首行且插值、`disposeCardFindings(landed:true)` → blockers ≥ 1 | 正 | 单元 + 静态 | 机器 | 同上 | P0 |
| S4-TC-F08 | §7⑥ `:184`（扫描面收窄为两处）/ §10-D8 `:221` / D-05 `:500` | 两 `.tpl` 不存在 + 代码面 0 命中 + 新卡无 `sourceLine` + 卡面无 `*.tpl` | 正 | 静态 | 机器 | 同上 | P0 |
| S4-TC-F09 | §7⑥ `:184` / D-05 `:500` | 旧模板探针判别力：往 `.mjs` 代码面注入即命中，扫描集合不含 `agents/` | 负 | 静态 | 机器 | 同上 | P0 |
| S4-TC-F10 | §4 `:98` / §10-D12 `:225`（`EXIT` 表承接 S1 码） | 36 个 S1 码 + 3 合并码 → exit **1**；`WeakReason` 抛「未知错误码」；既有 `DanglingBaselineEntry` 仍 2 | 负 | 单元 + 静态 | 机器 | 同上 | P0 |
| S4-TC-G01 | V-4 / §5.1 `:135` / §2-1 `:27` | 15 卡过 S1 校验零 errors；码表仍 36；**15 席 subject 全为 `<seat>.card`** | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-G02 | V-4 / §9 V-4 `:204`（只认 `PROSE_PROBES`）/ §5.1 `:139-143` / §3 `:62` | 15 卡三类探针 0 命中；旧段名/声明句式切 spec 表、指针词切 S1 §7 `:188` | 正 | 集成 + 静态 | 机器 | 同上 | P0 |
| S4-TC-G03 | V-2 / §1 收益行（P-A）/ PRD `:576` | 改共享层 1 处 → 含新串的席数 **= use 引用该 id 的席数** | 边界 | 集成 | 机器 | 同上 | P0 |
| S4-TC-G04 | V-4 / §5.1 `:135` / §12-R3 `:242` | 散文进 `rationale` 合法（卡面 0 命中、README 命中）；进 `duty` 必红 | 边界 | 单元 | 机器 | 同上 | P0 |
| S4-TC-G05 | V-7 / §9 V-7 `:207` / §5.1 `:127-128` | `must` 行判 criterion + landing；**`never` 行只判 objects + criterion** | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-G06 | V-7 / §9 V-7 `:207` | P-B 负例：删 must 的 landing / 置空 criterion 必红 | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-G07 | §5.1 `:145`（三类各 ≥1 反例 + 假阳性守卫）/ §9 V-4 `:204` | 三类反例各只命中本类；「遇意见冲突/可见/参考周围人的意见」→ 指针词类 0 命中 | 负 | 单元 | 机器 | 同上 | P0 |
| S4-TC-H01 | §8 步 1 `:190`（**归档副本**落 `docs/reports/`）/ A-4 `:55` | `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md` 在位、7 段逐段对照 + 差异清单 | 边界 | 静态 | 机器 | 同上 | P1 |
| S4-TC-H02 | §8 步 3 `:192` / PRD `:416` | 全集口径 = 落地时点 `agents/*.md` 全集（派生 = 席集，不写死 15） | 正 | 静态 | 机器 | 同上 | P0 |
| S4-TC-H03 | §8 步 2 `:191` / D-07 `:502` | `git log -1 --numstat -- agents/ tools/docgen/` 可跑且单席改动行数 > 0 | 边界 | 静态 | 机器 | 同上 | P1 |
| S4-TC-I01 | §10-D6 `:219` / §11-2 `:232` / §3 `:69` | D6 三条证据逐条可核：域不同 / `CHECK_ITEMS` 无导出载体 / 反向 import 禁令 | 正 | 静态 | 机器 | 同上 | P0 |
| S4-TC-I02 | §10-D6 `:219` / §11-1 `:231` / §2-2 `:28` | `REGISTERED_IDS` 实值逐字不变 + `git diff --quiet HEAD` 无差异 + `render.mjs` 仍在 | 负 | 静态 | 机器 | 同上 | P0 |
| S4-TC-I03 | §4 `:95`（`registeredIdsOf([本席 card])`）/ S1 §6 `:154` | 派生集 = 本席 `checkItems` 并集；产物侧 id 从 `REGISTERED_IDS` 派生且两域不混 | 正 | 单元 | 机器 | 同上 | P0 |
| S4-TC-I04 | V-6 / §3 数据源单向 `:73` | `renderCard` / `cardPipeline` 无 `readFileSync`/`AGENTS_DIR`；变异必红 | 负 | 静态 | 机器 | 同上 | P0 |
| S4-TC-J01 | §3 `:70` / §7① `:179`（写盘侧不做换行转换） | 两次渲染逐字相等；无时间戳/绝对路径/反斜杠；**产物无 CR、无 BOM** | 边界 | 单元 | 机器 | 同上 | P0 |
| S4-TC-J02 | §7① `:179`（逐文件 `.tmp-<pid>` → rename）/ §3 `:71` | 写盘后无 `.part` / `tmp` 残留；`writeAll` 含 `.tmp-` 形态 | 边界 | 集成 | 机器 | 同上 | P1 |
| S4-TC-J03 | §10-D2 `:215` / `tools/docgen/cli.mjs:120-124` | `docs/agents/**` 不触发 `UnregisteredHandwritten`；目录恰 = 席数 + index | 正 | 集成 | 机器 | 同上 | P0 |
| S4-TC-J04 | §10-D2 `:215` / §12-R6 `:245` | `docs-convention` 补 `docs/agents/` 一行；`scope-sweep --check` exit 0 | 边界 | 静态 | 机器 | 同上 | P0 |
| S4-TC-K01 | §10-D1 `:214`（段表 6→7 插行）/ §10-D5 `:218`（`:293` 省略号收敛） | PRD §3.7 段表 = 表头 + 7 段（含「输出格式」），`:293` 无 `…` | 边界 | 静态 | 机器 | 同上 | P0 |

**验收对位（V-1～V-8）**

- **V-1**（7 段齐 + 必渲染字段）→ A01 / A02（**12 键**）/ A03 / A04 / A05 / A07。
- **V-2**（三投影同源）→ B01 / B02 / B03 / G03。
- **V-3**（覆盖记录）→ B05 / B06 / B08 / E02 / E03 / E04 / E05。
- **V-4**（零散文）→ G01 / G02（`PROSE_PROBES` 三类）/ G07（三类反例 + 守卫）/ G04。
- **V-5**（手改即红）→ F02 / F03 / F04 / F05 / F06 / **F10（拒绝码 → exit 1）**。
- **V-6**（数据源单向）→ I04 / B07。
- **V-7**（P-B）→ G05（**must 判 criterion+landing；never 只判 objects+criterion**）/ G06。
- **V-8**（F 对位）→ 见下。

**F 对位（F-09 / F-10 / F-11 / F-12 / F-23 各有 ≥1 正向）**

- **F-09 卡面零散文 + 自足** → A01 / A04 / A07 / D01 / D02 / G02 / G05；负向 A05 / D03 / D04 / G06 / G07。
- **F-10 一份数据三投影** → B01 / B02 / B03 / G03；边界 B04 / B06 / B07 / D05；负向 B08。
- **F-11 全席重生成** → H02 / F01 / F08；边界 H01 / H03。
- **F-12 称谓口径** → C01 / C03 / C06；边界 C02；负向 C04 / C05。
- **F-23 数据源落点 + 手改告警** → I04 / F03 / F04 / I01；边界 B07 / I02；**上游同批 K01**。

---

## 2 用例明细


### S4-TC-A01 15 卡 7 段齐 + 每段必渲染字段在位（单源 = `card-must-fields.mjs`）

- **覆盖**：V-1 / spec §5.1 **主表** `:123-132` / §3 `:62`（`CARD_SEGMENTS` = 7 段数组 + `MUST_FIELDS` = 字段名数组）/ §5 `:115` / F-09
- **来源**：spec 推导（期望集从 spec §5.1 主表**严格切**，不跨段污染）
- **前置**：`MF.CARD_SEGMENTS` / `MF.MUST_FIELDS` 已落（③ 段产物）；`agentData` 每席已有 `card`。
- **步骤**：① `SEGS()` 与主表首列去 front matter 比对；② 15 卡逐段断 `## <段名>` + front matter 的 `name:` 行；③ `MUST_FIELDS()` 五项登记在位且逐席断正文含每项；④ 断两个**外部集合**等长（`SEATS` vs `CARD_FILES`）。
- **预期**：7 段逐项相等；15/15 段齐；五项必渲染在位。
- **判据**：
  ```js
  const segs = SEGS();
  assert.deepEqual(segs, SPEC_7, 'CARD_SEGMENTS 必须逐项等于 spec §5.1 主表首列去 front matter（§3 :62 的 7 段）');
  assert.equal(SPEC_SEGMENTS.length, 8, 'spec §5.1 主表必须切出 8 行（严格切法；混入「零散文探针」表即 11 行 → 本断言先红）');
  assert.equal(segs.length, 7, 'CARD_SEGMENTS 必须是 7 段（§3 :62）');
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等，不是循环内自比）');
  const fields = MUST_FIELDS();
  for (const f of ['trigger', 'objects', 'criterion', 'landing', 'requires']) {
    assert.ok(fields.includes(f), `spec §5.1 :127 的必渲染项 ${f} 必须登记在 MUST_FIELDS（数组）`);
  }
  for (const s of SEATS) {
    const t = CARD(s);
    assert.ok(typeof t === 'string' && t.length > 200, `${s} 卡面不得为空或过短（否则存在性断言空转）`);
    assert.match(t, /^---[\s\S]*?name:\s*\S+/m, `${s} 卡面缺 front matter / name（§5.1 :125）`);
    for (const seg of segs) assert.ok(t.includes(`## ${seg}`), `${s} 卡面缺「## ${seg}」节（§5.1 :126-132）`);
    const body = t.split(/^## 一定会/m)[1].split(/^## /m)[0];
    assert.ok(body && body.length > 0, `${s} 的「一定会」段不得为空`);
    for (const f of fields) assert.ok(body.includes(f), `${s} 的「一定会」段缺必渲染项 ${f}`);
  }
  ```
- **对应测试**：`tools/docgen/test/card-render.test.mjs`
- **不覆盖**：必渲染字段的**取值形态**（由 G05 / S1 码守）；只判存在性。

### S4-TC-A02 `Card` 12 键逐键删除 → 12 次均被拒绝（不当空值兜底）

- **覆盖**：V-1 / spec §4 `:89`（`Card` = S1 全量 **12 键**，缺任一 → 拒绝渲染）/ §4 `:98`（拒绝语义）/ S1 §4 `:58-67`
- **来源**：spec 推导（v4 把 Card 由 9 键改回 12 键：`name`/`description`/`tools` 由 `seatEntry` 派生，§4 `:90`）
- **前置**：`CM.validateCardModel` 为函数；`PIPE.buildEnv(seat, cards)` 已导出（§4 `:82`）。
- **步骤**：① 断两入口是函数；② 取首条 `buildCards()` 的 card 深拷贝并断 12 键齐；③ 逐键 `delete` → `validateCardModel(c, buildEnv(seat, [c]))` 断 `errors.length > 0`（**经 S1 入口判拒绝，不直调 `renderCard`**，§3 `:70`）。
- **预期**：12/12 被拒；不得静默兜底。
- **判据**：
  ```js
  const KEYS = ['seat', 'name', 'description', 'tools', 'duty', 'scenes', 'signals', 'must', 'never', 'categories', 'checkItems', 'rationale'];
  assert.equal(typeof CM.validateCardModel, 'function', 'validateCardModel 必须是函数（S1 出口面）');
  assert.equal(typeof PIPE.buildEnv, 'function', 'buildEnv(seat, cards) 必须导出（§4 :82）');
  assert.equal(KEYS.length, 12, 'spec §4 :89 写死 Card = 12 键（前置非空）');
  const b0 = PIPE.buildCards()[0];
  assert.ok(b0 && b0.card && typeof b0.card === 'object', 'buildCards()[0].card 必须存在（§4 :81）');
  const base = structuredClone(b0.card);
  for (const k of KEYS) assert.ok(k in base, `基线卡必须 12 键齐：缺 ${k}（前置失败 → 本用例无从构造）`);
  let refused = 0;
  for (const k of KEYS) {
    const c = structuredClone(base);
    delete c[k];
    const r = CM.validateCardModel(c, PIPE.buildEnv(b0.seat, [c]));
    assert.ok(Array.isArray(r.errors) && r.errors.length > 0, `删 ${k} 后必须报 errors（§4 :89 / :98），实得静默通过`);
    refused += 1;
  }
  assert.equal(refused, 12, '十二键逐键都必须被拒（§4 :89）');
  ```
- **对应测试**：同上
- **不覆盖**：具体码（S1 已定 36 码，本段不新增，§4 `:98`）。

### S4-TC-A03 卡面二级节名 / 顺序逐项等于 `CARD_SEGMENTS`（多段 · 删第 4 段 · 换序）

- **覆盖**：V-1 / spec §5.1 `:123-132`（7 段是**封闭清单**）/ §3 `:62`
- **来源**：spec 推导
- **前置**：A01 已过（`SPEC_SEGMENTS` = 8 行、`SEGS()` = 7 段）。
- **步骤**：① 取每席 `^## ` 节名；② 与 `SEGS()` 逐项 `deepEqual`（顺序敏感）；③ 三变异：追加 `## 附注`、**按下一段锚删第 4 段**、对调第 5/6 段 → 三者都必须与期望不等。
- **预期**：15/15 逐项相等；三变异各红。
- **判据**：
  ```js
  const WANT = SEGS();
  assert.equal(WANT.length, 7, `7 段必须成立（实得 ${WANT.length}）`);
  const heads = (t) => t.split(/\r?\n/).filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim());
  for (const s of SEATS) {
    const got = heads(CARD(s));
    assert.equal(got.length, WANT.length, `${s} 的二级节数必须 = 7（多段 / 少段均红，实得 ${got.length}）`);
    assert.deepEqual(got, WANT, `${s} 的二级节名 / 顺序必须逐项等于 CARD_SEGMENTS`);
  }
  const t = CARD(SEATS[0]);
  const skip = WANT[3], next = WANT[4];
  const minus = t.replace(new RegExp(`^## ${skip}\n[\\s\\S]*?(?=^## ${next})`, 'm'), '');
  const plus = `${t}\n## 附注\n`;
  const swapped = t.replace(`## ${WANT[4]}`, '@@A@@').replace(`## ${WANT[5]}`, `## ${WANT[4]}`).replace('@@A@@', `## ${WANT[5]}`);
  assert.equal(heads(minus).length, 6, `删第 4 段必须真的少一段（实得 ${heads(minus).length}；若为 7 说明正则未命中）`);
  assert.notDeepEqual(heads(minus), WANT, '少一段必须被判红');
  assert.notDeepEqual(heads(plus), WANT, '多一段必须被判红');
  assert.notDeepEqual(heads(swapped), WANT, '换序必须被判红');
  ```
- **对应测试**：同上
- **不覆盖**：三级标题（`###`）不在契约内。

### S4-TC-A04 7 段模板同时满足执行力度矩阵 A3–A7

- **覆盖**：V-1 / spec §5.1 `:134`（A3–A7 判定面已在表内满足）/ §2-4 `:30`（不改 A3–A7）/ F-09
- **来源**：spec 推导（判据来自已签 `tools/execution-matrix/check-agent.mjs` 的 `checkStruct`（覆盖 89–123 行）；A3–A7 的判据正文见 `tools/execution-matrix/criteria.md`）
- **前置**：`checkStruct` 可 import（已存在）；卡面是字符串。
- **步骤**：① 逐席 `checkStruct(CARD(s))`；② 断 `findings` 为空；③ 断 `notes` 含 A4 / A5（被真判过，不是短路）。
- **预期**：15/15 `findings: []`。
- **判据**：
  ```js
  for (const s of SEATS) {
    const t = CARD(s);
    assert.ok(typeof t === 'string' && t.length > 0);
    const r = checkStruct(t);
    assert.deepEqual(r.findings, [], `${s} 卡面必须 A3–A7 全绿，实得 ${JSON.stringify(r.findings)}`);
    assert.ok(r.notes.some((n) => n.startsWith('A4')), `${s} 的 A4 必须被真判过（notes 缺 A4）`);
    assert.ok(r.notes.some((n) => n.startsWith('A5')), `${s} 的 A5 必须被真判过（notes 缺 A5）`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：A1/A2 语义项与 B/C 组 10 键（走 annotations）。

### S4-TC-A05 A3–A7 判别力：四处变异各红一处（按表头行定位）

- **覆盖**：spec §5.1 `:134`（A3 表头逐字 / A4 字样 / A5 字样三处原文）
- **来源**：spec 推导（三串从 spec `:134` 原文切）
- **前置**：A04 已过。
- **步骤**：① 从 `specLine(134)` 切三串并断基线卡含之；② 按**表头行**替换「必问（must）」→ 只红 A3；③ 删含 A4 字样的行 → 只红 A4；④ 删「边界」/「输出格式」节 → 各只红 A6 / A7。
- **预期**：每个变异 `findings` 恰一个码。
- **判据**：
  ```js
  const L134 = specLine(134);
  const mustHeader = /「一定会」表头 `(\|[^`]+)`/.exec(L134);
  const a4 = /A4（`([^`]+)`）/.exec(L134);
  const a5 = /A5（`([^`]+)`）/.exec(L134);
  assert.ok(mustHeader && a4 && a5, 'spec :134 必须写死「一定会」表头 + A4/A5 字样三处（切不到 = 行号漂移或 spec 改词）');
  const t0 = CARD(SEATS[0]);
  for (const x of [mustHeader[1].trim(), a4[1], a5[1]]) assert.ok(t0.includes(x), `卡面必须含 spec :134 写死的串「${x}」`);
  const headerLine = t0.split(/\r?\n/).find((l) => l.startsWith('| # | 必问（must）'));
  assert.ok(headerLine, '卡面必须含 spec :134 写死的「一定会」表头行（按行定位，不做全局首个替换）');
  const c3 = checkStruct(t0.replace(headerLine, headerLine.split('必问（must）').join('检查项')));
  assert.deepEqual(c3.findings.map((f) => f.code), ['A3'], '表头行不再含「必问」→ 只应红 A3');
  const c4 = checkStruct(t0.split(/\r?\n/).filter((l) => !l.includes(a4[1])).join('\n'));
  assert.deepEqual(c4.findings.map((f) => f.code), ['A4'], '删 A4 字样 → 只应红 A4');
  const c6 = checkStruct(t0.split(/\r?\n/).filter((l) => !/^## 边界/.test(l)).join('\n'));
  assert.deepEqual(c6.findings.map((f) => f.code), ['A6'], '删「边界」节 → 只应红 A6');
  const c7 = checkStruct(t0.split(/\r?\n/).filter((l) => !/^## 输出格式/.test(l)).join('\n'));
  assert.deepEqual(c7.findings.map((f) => f.code), ['A7'], '删「输出格式」节 → 只应红 A7');
  ```
- **对应测试**：同上
- **不覆盖**：`checkStruct` 自身正确性（execution-matrix 既有测试覆盖）。

### S4-TC-A06 `rationale` 只在 README、不进卡面

- **覆盖**：spec §5.1 `:135`（散文只允许落 `card.rationale`）/ PRD `:223` / F-09
- **来源**：spec 推导
- **前置**：至少一席 `card.rationale` 去空白后 ≥ 12 字（否则「不出现在卡面」恒真）。
- **步骤**：① 取该席 rationale 的特征片段（12 字）；② 断卡面不含；③ 断 README 投影与落盘 README 都含（搬落点，非删内容，§12-R3 `:242`）。
- **预期**：卡面 0 命中、README 两侧命中。
- **判据**：
  ```js
  const s = SEATS.find((x) => {
    const c = PIPE.buildCards().find((b) => b.seat === x).card;
    return typeof c.rationale === 'string' && c.rationale.replace(/\s+/g, '').length >= 12;
  });
  assert.ok(s, '至少一席必须有 ≥12 字的 rationale（否则本用例无从构造，§5 :116）');
  const frag = PIPE.buildCards().find((b) => b.seat === s).card.rationale.replace(/\s+/g, '').slice(0, 12);
  assert.equal(frag.length, 12);
  assert.equal(CARD(s).replace(/\s+/g, '').includes(frag), false, `${s} 卡面不得渲染 rationale（§5.1 :135）`);
  assert.ok(RS(s).readme.replace(/\s+/g, '').includes(frag), `${s} 的 README 投影必须含 rationale（§12-R3 :242 搬落点）`);
  assert.ok(readmeOnDisk(s).replace(/\s+/g, '').includes(frag), `${s} 落盘 README 必须含 rationale`);
  ```
- **对应测试**：同上
- **不覆盖**：README 排版（人读视图形式）。

### S4-TC-A07 4 个 `vocab/` 表的导出面恰为 spec 写死的 8 个名字

- **覆盖**：V-1 / spec §3 `:58-65`（4 个表的导出名与键形写死）/ §0.1 的「8 个导出名」
- **来源**：spec 推导（期望集 = spec §3 导出名表「导出」列，逐字切）
- **前置**：4 个 `vocab/` 文件已落；`VOCAB_NS`（§0.3）可 import。
- **步骤**：① 从 spec §3 导出名表切 4 行（共 8 个名字）并与 `VOCAB_EXPORTS` 双向相等；② 逐文件断**运行时** `Object.keys(ns)` 与期望双向相等；③ 逐文件断**静态** `^export const <名>` 与运行时一致。
- **预期**：4/4 文件、8/8 名字双向相等；多 / 少 / 改名均红。
- **判据**：
  ```js
  // §3 有两张连续表（导出名表 + 约束表），按「首列含 .mjs」筛出导出名表 4 行
  const rows = specTableStrict(/\*\*4 个 `vocab\/` 表的导出名与形状/).filter((c) => String(c[0]).includes('.mjs'));
  assert.equal(rows.length, 4, `spec §3 导出名表必须 4 行（实得 ${rows.length}）`);
  const specExports = {};
  for (const c of rows) {
    const file = String(c[0]).replace(/`/g, '').trim();
    const names = String(c[1]).replace(/`/g, '').split('/').map((x) => x.trim()).filter(Boolean);
    assert.ok(file && names.length > 0, `spec 行缺文件名或导出名：${c.join(' | ')}`);
    specExports[file] = names;
  }
  assert.deepEqual(specExports, VOCAB_EXPORTS, '本文 VOCAB_EXPORTS 必须与 spec §3 导出名表双向相等（spec 改名 → 本断言先红）');
  let total = 0;
  for (const [file, names] of Object.entries(VOCAB_EXPORTS)) {
    const ns = VOCAB_NS[file];
    assert.ok(ns && typeof ns === 'object', `${file} 必须可 import（否则导出面无从断言）`);
    assert.deepEqual(Object.keys(ns).sort(), [...names].sort(), `${file} 运行时导出面必须恰为 ${names.join('/')}（多一 / 少一 / 改名即红）`);
    const src = readFileSync(join(REPO, 'tools/docgen/card-model/vocab', file), 'utf8');
    const statics = [...src.matchAll(/^export const (\w+)/gm)].map((m) => m[1]).sort();
    assert.deepEqual(statics, [...names].sort(), `${file} 静态 export 面必须与运行时一致（实得 ${statics.join('/')}）`);
    total += names.length;
  }
  assert.equal(total, 8, '四文件导出名合计必须 8 个（spec §3 :62：card-must-fields 4 + predicates 1 + landings 1 + shared-actions 3）');
  ```
- **对应测试**：同上
- **不覆盖**：各导出的**值形状**（由 E01 / G01 守）。

### S4-TC-A08 `touchedSemanticKeys` 认「职责」段（A1/A2 锚点迁移，§10-D11）

- **覆盖**：spec §10-D11 `:224`（A1/A2 判定对象从「你是谁」迁到「职责」；映射同批改）/ §2-4 `:30` / PRD `:230-237`
- **来源**：spec 推导 + 实现观察（补充）：`touchedSemanticKeys` 在 `tools/docgen/cli.mjs`，段名表在 `:271-274`（现状只认「你是谁 / 身份」）
- **前置**：`touchedSemanticKeys` 可 import（断 `typeof === 'function'`）。
- **步骤**：① 三形态各造一段差异文本（`职责` / `你是谁` / `身份`）→ 断含 **A1**；② `description:` 差异 → 断含 **A2**；③ 静态断 `cli.mjs` 段名表含「职责」。
- **预期**：三形态都触发 A1；description 触发 A2；源码含「职责」。
- **判据**：
  ```js
  assert.equal(typeof touchedSemanticKeys, 'function', 'touchedSemanticKeys 必须可 import（§10-D11 :224）');
  const mk = (head, body) => `## ${head}\n${body}\n## 边界\n`;
  for (const head of ['职责', '你是谁', '身份']) {
    const keys = touchedSemanticKeys(mk(head, '旧内容'), mk(head, '新内容'));
    assert.ok(Array.isArray(keys) && keys.includes('A1'), `改「${head}」段必须触发 A1（§10-D11 :224 的段名映射须认这三形态），实得 ${(keys ?? []).join(',')}`);
  }
  const k2 = touchedSemanticKeys('description: 旧\n## 职责\n同\n', 'description: 新\n## 职责\n同\n');
  assert.ok(k2.includes('A2'), `description 行改动必须触发 A2，实得 ${k2.join(',')}`);
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8');
  assert.ok(CLI.includes('职责'), 'cli.mjs 的段名映射必须同批补「职责」（§10-D11 :224；否则铺满后改职责永不触发 A1 重判）');
  ```
- **对应测试**：同上
- **不覆盖**：`criteria.md` 的 A1/A2 文案（R8 回扫由 J04 的 `scope-sweep` 兜）。

### S4-TC-B01 三投影同源：同一 `renderSeat()` 的 card / readme 与 dump 对同一字段逐字一致

- **覆盖**：V-2 / spec §5 `:112-117` / §4 `:84`（`renderAll()` 收口全内存）/ F-10
- **来源**：spec 推导
- **前置**：`renderSeat` 返回 `{card, readme}`（§4 `:83`）；dump 走 CLI（`B07`）。
- **步骤**：① 取首条席的 `RS(s)`；② dump 经 CLI 取 JSON，断 `dump.seat === s`；③ 断卡面 front matter `name` = `dump.name`（v4 12 键后成立）；④ 断 `dump.rationale` 进 readme、**不进** card。
- **预期**：三处一致；无「另存一份数据」。
- **判据**：
  ```js
  const s = SEATS[0];
  const r = RS(s);
  const cli = runCli(['dump', '--name', s]);
  assert.equal(cli.code, 0, `dump 必须 exit 0（实得 ${cli.code}）：${cli.out.slice(0, 300)}`);
  const d = JSON.parse(cli.out.trim());
  assert.ok(d && typeof d === 'object', 'dump 必须是可解析 JSON 对象（§5 :117）');
  assert.equal(d.seat, s, 'dump.seat 必须 = 席名');
  const fmName = /^name:\s*(.+)$/m.exec(r.card);
  assert.ok(fmName && fmName[1].trim(), '卡面 front matter 必须有 name（§5.1 :125）');
  assert.equal(fmName[1].trim(), d.name, '卡面 name 必须 = dump.name（§4 :90 派生：name = seatEntry.name）');
  assert.ok(typeof d.rationale === 'string' && d.rationale.trim().length > 0, 'dump.rationale 必须非空（§5 :116）');
  assert.ok(r.readme.includes(d.rationale), 'README 投影必须含 dump.rationale');
  assert.equal(r.card.includes(d.rationale), false, '卡面不得含 dump.rationale（§5.1 :135 零散文）');
  ```
- **对应测试**：同上
- **不覆盖**：dump 字段全集（只看 3 个关键字段）。

### S4-TC-B02 改数据 1 处 → 三处跟随（README / dump 变、卡面按设计不变）

- **覆盖**：V-2 / spec §1「三投影同源」/ §5 `:112-117` / F-10
- **来源**：spec 推导
- **前置**：`mutCard()` 可用。
- **步骤**：① 往该席 `rationale` 末尾追加探针串；② 断 dump 与 readme 都含探针、card 不含；③ 还原后断 dump 不再含。
- **预期**：readme / dump 变；card 不变。
- **判据**：
  ```js
  const s = SEATS[0];
  const probe = '（S4-TC-B02 探针）';
  const before = runCli(['dump', '--name', s]);
  assert.equal(before.code, 0, '前置 dump 必须可跑');
  const restore = mutCard(s, (a) => { a.rationale = `${a.rationale}${probe}`; });
  try {
    const after = runCli(['dump', '--name', s]);
    assert.equal(after.code, 0, '改数据后 dump 仍必须可跑');
    assert.ok(after.out.includes(probe), `改 rationale 后 dump 必须含探针（实得未跟随）`);
    assert.ok(RS(s).readme.includes(probe), 'README 投影必须跟随 rationale 变化');
    assert.equal(CARD(s).includes(probe), false, 'rationale 不进卡面 → 卡面不得因它变化（§5.1 :135）');
  } finally { restore(); }
  const back = runCli(['dump', '--name', s]);
  assert.equal(back.out.includes(probe), false, '还原后 dump 不得再含探针（守 mutCard 有效性）');
  ```
- **对应测试**：同上
- **不覆盖**：并发改两席（无并发面）。

### S4-TC-B03 落盘后每席一份 README + index 15 行且链接目标全在

- **覆盖**：V-2 / spec §3 `:53-55`（`docs/agents/` 落点）/ §5 `:116` / F-10
- **来源**：spec 推导
- **前置**：③ 段已跑过 `generate --readme --apply`（目录非空）。
- **步骤**：① 断目录内 `.md` = 席数 + 1；② 逐席断文件非空；③ index 数据行 = 席数；④ 逐行取链接目标并断文件存在。
- **预期**：15 + 1 个文件；index 15 行；链接全在。
- **判据**：
  ```js
  assert.ok(existsSync(DOC_AGENTS_DIR), `README 落点目录必须存在：${DOC_AGENTS_DIR}（§3 :53-56）`);
  const docs = readdirSync(DOC_AGENTS_DIR).filter((f) => f.endsWith('.md'));
  assert.equal(docs.length, SEATS.length + 1, `docs/agents 必须 = 席数 + index（16 份；实得 ${docs.length}）`);
  for (const s of SEATS) {
    assert.ok(docs.includes(`${s}.md`), `缺 ${s}.md`);
    assert.ok(readFileSync(join(DOC_AGENTS_DIR, `${s}.md`), 'utf8').trim().length > 0, `${s}.md 不得为空`);
  }
  const idx = readFileSync(join(DOC_AGENTS_DIR, 'README.md'), 'utf8');
  const rows = idx.split(/\r?\n/).filter((l) => l.trim().startsWith('|') && !/^\|\s*:?-{3}/.test(l.trim()));
  assert.ok(rows.length > 1, 'index 必须至少有表头 + 1 行');
  assert.equal(rows.slice(1).length, SEATS.length, `index 数据行必须 = 席数（实得 ${rows.slice(1).length}）`);
  for (const line of rows.slice(1)) {
    const target = (line.match(/`docs\/agents\/([a-z0-9-]+)\.md`/) ?? line.match(/\]\(([^)]+)\)/) ?? [])[1];
    assert.ok(target, `index 行必须有链接目标：${line}`);
    const rel = target.startsWith('docs/') ? target : (target.startsWith('./') ? `docs/agents/${target.slice(2)}` : `docs/agents/${target}`);
    assert.ok(existsSync(join(REPO, rel)), `index 链接目标不存在：${rel}`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：index 列语义（B04）/ 排版。

### S4-TC-B04 index 表头五列齐

- **覆盖**：spec §3 `:54`（index 五列）/ F-10
- **来源**：spec 推导
- **前置**：`docs/agents/README.md` 存在（B03 已过）。
- **步骤**：① 取 index 表头行；② 五列逐项 `includes`；③ 断列数 ≥ 5。
- **预期**：五列齐。
- **判据**：
  ```js
  const idx = readFileSync(join(DOC_AGENTS_DIR, 'README.md'), 'utf8');
  const header = idx.split(/\r?\n/).find((l) => l.trim().startsWith('|'));
  assert.ok(header, 'index 必须有表格表头');
  const cells = header.split('|').map((c) => c.trim()).filter(Boolean);
  assert.ok(cells.length >= 5, `index 表头必须至少 5 列（实得 ${cells.length}）`);
  for (const need of ['席名', '职责', '维度', '输出类型', '链接']) assert.ok(cells.some((c) => c.includes(need)), `index 表头缺「${need}」列（§3 :54）`);
  ```
- **对应测试**：同上
- **不覆盖**：列顺序（spec 只写五列名）。

### S4-TC-B05 `overrides[]` 每条必须带非空 `reason`

- **覆盖**：V-3 / spec §5 `:116`（覆盖表三列）/ §5 `:119`（reason 由 pipeline 从 own join）/ §12-R4 `:243`
- **来源**：spec 推导 + 实现观察（补充）：S1 `merge.mjs` 只回 `{id, changed}`（事实 10）
- **前置**：`buildCards()` 可调；至少一席有覆盖（无覆盖时用构造分支）。
- **步骤**：① 遍历 `overrides` 断 `{id, changed, reason}` 齐且 reason 非空、changed 非空数组；② 若全仓 0 条覆盖 → 造一条带 reason 的覆盖并断 `mergeActions` 接受。
- **预期**：每条都可追 reason。
- **判据**：
  ```js
  const built = PIPE.buildCards();
  assert.ok(Array.isArray(built) && built.length === SEATS.length, 'buildCards 必须每席一条（§4 :81）');
  let n = 0;
  for (const b of built) {
    const oc = b.overrides ?? [];
    assert.ok(Array.isArray(oc), `${b.seat} 的 overrides 必须是数组`);
    for (const o of oc) {
      assert.ok(typeof o.id === 'string' && o.id.trim() !== '', `${b.seat} 的覆盖缺 base id`);
      assert.ok(Array.isArray(o.changed) && o.changed.length > 0, `${b.seat}/${o.id} 的 changed 必须非空（零差异应报 PointlessOverride）`);
      assert.ok(typeof o.reason === 'string' && o.reason.trim() !== '', `${b.seat}/${o.id} 的覆盖缺 reason（§5 :119；S1 merge.mjs:63 不带它，须 pipeline join）`);
      n += 1;
    }
  }
  if (n === 0) {
    const pred = Object.keys(PRED.PREDICATES ?? {});
    const land = Object.keys(LAND.LANDINGS ?? {});
    assert.ok(pred.length > 0 && land.length >= 2, '谓词表非空 + 落点表 ≥2 项（构造前提）');
    const shared = [{ id: 'probe', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] }];
    const own = [{ ...shared[0], landing: land[1], reason: '本席按自己的落点' }];
    const m = CM.mergeActions(shared, own);
    assert.equal(m.errors.length, 0, `带 reason 的覆盖必须被接受（实得 ${m.errors.map((e) => e.code).join('|')}）`);
    assert.equal(m.overrides.length, 1, '合并层必须产出 1 条 overrides');
  }
  ```
- **对应测试**：同上
- **不覆盖**：reason 文案质量（§5 manual）。

### S4-TC-B06 README 覆盖记录表在位：行数 = `overrides` 条数（0 条时空表合法）

- **覆盖**：V-3 / spec §5 `:116` / §12-R4 `:243`
- **来源**：spec 推导
- **前置**：`docs/agents/<seat>.md` 存在（B03 已过）。
- **步骤**：① 逐席取 README 的「覆盖记录」节；② 数数据行并与 `overrides.length` 比对；③ 逐行断 reason 列非空。
- **预期**：行数相等；有行时 reason 非空。
- **判据**：
  ```js
  for (const b of PIPE.buildCards()) {
    const t = readmeOnDisk(b.seat);
    const m = /^##\s*覆盖记录[^\n]*\n(?:[\s\S]*?)(?=^## |\Z)/m.exec(t);
    assert.ok(m, `${b.seat} README 必须有「## 覆盖记录」节（§5 :116）`);
    const rows = m[0].split(/\r?\n/).filter((l) => l.trim().startsWith('|') && !/^\|\s*:?-{3}/.test(l.trim()));
    assert.ok(rows.length >= 1, `${b.seat} 覆盖表必须有表头（0 条覆盖也要留表头）`);
    assert.equal(rows.slice(1).length, (b.overrides ?? []).length, `${b.seat} 覆盖表数据行必须 = overrides 条数（表 ${rows.slice(1).length} vs 数据 ${(b.overrides ?? []).length}）`);
    for (const line of rows.slice(1)) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      assert.ok(cells.length >= 3, `${b.seat} 覆盖行必须三列（id / changed / reason）：${line}`);
      assert.ok(cells[2] && cells[2].length > 0, `${b.seat} 覆盖行 reason 列不得为空：${line}`);
    }
  }
  ```
- **对应测试**：同上
- **不覆盖**：`changed` 列文字格式（§7 缺口 14）。

### S4-TC-B07 `dump` = stdout-only（不落盘、可 `JSON.parse`、不调 `writeAll`）

- **覆盖**：spec §5 `:117`（dump stdout-only）/ §3 `:71`④（`dump` 只 `console.log`）/ PRD `:225` / R5 `:244`
- **来源**：spec 推导 + 实现观察（补充）：`cli.mjs` 现无 `cmdDump`（§1 `:20` 明写新增）
- **前置**：`cli.mjs` 已含 `dump` 分支。
- **步骤**：① 跑 `dump --name <首席>` 断 exit 0；② 断整串可 `JSON.parse` 且 `seat` 匹配；③ 静态切 `cmdDump` 函数体，断无写盘调用、**不调 `writeAll`**；④ 断门禁段不调 dump。
- **预期**：三条全过。
- **判据**：
  ```js
  const s = SEATS[0];
  const r = runCli(['dump', '--name', s]);
  assert.equal(r.code, 0, `dump 必须 exit 0（实得 ${r.code}）：${r.out.slice(0, 300)}`);
  const d = JSON.parse(r.out.trim());
  assert.ok(d && typeof d === 'object', 'dump 输出必须是 JSON 对象');
  assert.equal(d.seat, s, 'dump.seat 必须 = 请求的席名');
  const SRC = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8');
  const i = SRC.indexOf('cmdDump');
  assert.ok(i >= 0, 'cli.mjs 必须有 cmdDump（§5 :117）');
  const j = SRC.indexOf('\nexport function', i + 1);
  const body = SRC.slice(i, j > 0 ? j : SRC.length);
  assert.ok(body.length > 0, 'cmdDump 函数体不得为空（否则本断言空转）');
  for (const w of ['writeFileSync', 'mkdirSync', 'renameSync', 'cpSync', 'appendFileSync', 'writeAll']) {
    assert.equal(body.includes(w), false, `cmdDump 分支不得含 ${w}（PRD :225 stdout-only / §3 :71④）`);
  }
  const CA = readFileSync(join(REPO, 'scripts/check-all.mjs'), 'utf8');
  assert.equal(/['"]dump['"]\s*,\s*['"]--name/.test(CA), false, '门禁段不得调用 dump（不进门禁）');
  ```
- **对应测试**：同上
- **不覆盖**：跑完后「工作区零变化」（工区可能脏）。

### S4-TC-B08 覆盖的 `reason` 取自本席 `own`（pipeline 不 join 即红）

- **覆盖**：spec §5 `:119`（reason 由 `cardPipeline` 从 own join；三列缺一 → 拒绝渲染）/ V-3 / §5 `:116`
- **来源**：spec 推导 + 实现观察（补充）：S1 `merge.mjs` 只回 `{id, changed}`（事实 10）
- **前置**：`SHARED_USE` 至少一席非空；该 id 已登记；`mutCard()` 可用。
- **步骤**：① 构造一条**带 reason** 的覆盖（改 landing）→ 断 `overrides[]` 带该 reason、README 覆盖表渲染出它；② 构造**无 reason** 的覆盖 → 断 `mergeActions` 报 `OverrideWithoutReason`、该席拒绝渲染。
- **预期**：带 reason → 三列齐；无 reason → 拒绝（既有码）。
- **判据**：
  ```js
  const USE = SH.SHARED_USE;
  assert.ok(USE && typeof USE === 'object' && Object.keys(USE).length > 0, 'SHARED_USE 必须非空对象（§3 :65）');
  const s = Object.keys(USE).find((k) => Array.isArray(USE[k]) && USE[k].length > 0);
  assert.ok(s, '至少一席的 use 列表非空（否则本用例无从构造覆盖）');
  const id = USE[s][0];
  const base = [...SH.SHARED_MUST, ...SH.SHARED_NEVER].find((a) => a.id === id);
  assert.ok(base, `共享层必须登记 ${id}（§4 :91）`);
  const other = Object.keys(LAND.LANDINGS).find((l) => l !== base.landing);
  assert.ok(other, '落点表至少 2 项（否则「改 landing」构造不出来）');
  const mk = (reason) => ({ ...structuredClone(base), landing: other, ...(reason === null ? {} : { reason }) });
  const restore = mutCard(s, (a) => { a.must = [...(a.must ?? []), mk('本席落 progress.md，不写交付物正文')]; });
  try {
    const b = PIPE.buildCards().find((x) => x.seat === s);
    assert.ok(b, `${s} 的 buildCards 结果必须存在`);
    const o = (b.overrides ?? []).find((x) => x.id === id);
    assert.ok(o, `构造的覆盖必须出现在 overrides[]（实得 ${(b.overrides ?? []).map((x) => x.id).join(',')}）`);
    assert.ok(typeof o.reason === 'string' && o.reason.trim() !== '', 'overrides 条目的 reason 必须从 own join 进来（pipeline 不 join 即红，§5 :119）');
    assert.ok(RS(s).readme.includes(o.reason), 'README 覆盖表的 reason 列必须渲染出 own 的 reason（§5 :116 / :119）');
  } finally { restore(); }
  const restore2 = mutCard(s, (a) => { a.must = [...(a.must ?? []), mk(null)]; });
  try {
    const m = CM.mergeActions([base], [mk(null)]);
    assert.deepEqual(m.errors.map((e) => e.code), ['OverrideWithoutReason'], '无 reason 的覆盖必须报 OverrideWithoutReason（S1 merge.mjs）');
    const threw = (() => { try { PIPE.renderSeat(s); return false; } catch { return true; } })();
    const builtErr = (() => { try { PIPE.buildCards(); return null; } catch (e) { return e.message; } })();
    assert.ok(threw || builtErr !== null, `${s} 在 reason 缺失时必须拒绝渲染（不产出字节，§5 :119），实得两条通道都放过`);
  } finally { restore2(); }
  ```
- **对应测试**：同上
- **不覆盖**：reason 文案质量（§5 manual）。

### S4-TC-C01 `description` = `trigger.when` 直出（不派生「在…中担任」）

- **覆盖**：spec §5.2 `:151` / §10-D3 `:216` / PRD `:231` / F-12
- **来源**：spec 推导
- **前置**：`triggerTable` 可达（§0.3 import）。
- **步骤**：① 逐席取卡面 `description:` 行；② 断不含 `DERIVED_DESC_RE`；③ 断含该席 `trigger.when` 原文。
- **预期**：15/15 不含派生式；每席含 `when`。
- **判据**：
  ```js
  const D = (s) => {
    const m = /^description:\s*(.+)$/m.exec(CARD(s));
    assert.ok(m && m[1].trim().length > 0, `${s} 卡面必须有非空 description（§5.1 :125）`);
    return m[1].trim();
  };
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）');
  for (const s of SEATS) {
    const d = D(s);
    assert.equal(DERIVED_DESC_RE.test(d), false, `${s} 的 description 不得含「在…中担任…」（§10-D3 :216）：${d}`);
    const t = triggerTable[s];
    assert.ok(t && typeof t.when === 'string' && t.when.trim() !== '', `${s} 必须有 trigger.when（否则本断言无从构造）`);
    assert.ok(d.includes(t.when.trim()), `${s} 的 description 必须含触发条件「${t.when.trim()}」（§5.2 :151）`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：文案质量（§5 manual）。

### S4-TC-C02 `notWhen.text` 两形态：有则附「不用于」、无则无该尾巴

- **覆盖**：spec §5.2 `:151`（「+ `notWhen.text` 时附『不用于：…』」）/ F-12
- **来源**：spec 推导
- **前置**：触发表里**同时**存在两类席（否则前置不成立即红）。
- **步骤**：① 取两类席（有/无 `notWhen.text`）；② 有的一侧断含「不用于」；③ 无的一侧断**不含**。
- **预期**：两形态各一例通过。
- **判据**：
  ```js
  const T = triggerTable;
  assert.ok(T && typeof T === 'object', 'triggerTable 必须可读（§4 :81 的输入含它）');
  assert.ok(Object.keys(T).length > 0, 'triggerTable 不得为空（否则两类筛选全空）');
  const withNot = Object.keys(T).filter((k) => T[k] && typeof T[k].notWhen?.text === 'string' && T[k].notWhen.text.trim());
  const without = Object.keys(T).filter((k) => T[k] && T[k].when && !(typeof T[k].notWhen?.text === 'string' && T[k].notWhen.text.trim()));
  assert.ok(withNot.length > 0 && without.length > 0, `两类席都必须存在（有 notWhen=${withNot.length} / 无=${without.length}），否则本用例空转`);
  for (const s of withNot) assert.ok(CARD(s).includes('不用于'), `${s} 有 notWhen.text → description 必须附「不用于：…」（§5.2 :151）`);
  for (const s of without) assert.equal(CARD(s).includes('不用于'), false, `${s} 无 notWhen.text → description 不得凭空加「不用于」（§5.2 :151）`);
  ```
- **对应测试**：同上
- **不覆盖**：`notWhen.text` 内容（S6 已签）。

### S4-TC-C03 非议会席卡面 0 命中「议长 / 主持人」

- **覆盖**：spec §5.2 `:153` / PRD `:280` / A-5 `:56` / F-12
- **来源**：spec 推导 + 实现观察（补充）：两席当前 0 命中（回归守）
- **前置**：`NON_PARL` 两席都在 `SEATS`。
- **步骤**：① 逐非议会席取卡面；② 断 `TERM_RE` 不命中；③ 断卡面非空且含「边界」（防空转）。
- **预期**：2/2 席 0 命中。
- **判据**：
  ```js
  for (const s of NON_PARL) {
    const t = CARD(s);
    assert.ok(t.length > 200, `${s} 卡面不得为空或过短（否则 0 命中是假绿）`);
    assert.ok(t.includes('## 边界'), `${s} 卡面必须含「边界」段（证明渲染成功）`);
    assert.equal(TERM_RE.test(t), false, `${s} 是非议会席 → 卡面不得出现「议长 / 主持人」（§5.2 :153）：${(t.match(TERM_RE) ?? [])[0]}`);
  }
  assert.equal(NON_PARL.length, 2, '非议会席必须是 spec §4 :97 点名的两个');
  ```
- **对应测试**：同上
- **不覆盖**：程序动作词（S1 `ProceduralWordOutsideParliament`，G01 判零 errors）。

### S4-TC-C04 非议会席数据里塞「主持人」→ 卡面命中即红

- **覆盖**：spec §5.2 `:155`（机械判：只允许命中议会席）/ F-12
- **来源**：spec 推导
- **前置**：`mutCard()` 可用；基线 0 命中（C03 已过）。
- **步骤**：① 往 `evidence-reader` 的 `duty.constraint` 塞「主持人通知后记录」；② 断卡面命中；③ 还原后断 0。
- **预期**：塞入必红、还原必绿。
- **判据**：
  ```js
  const s = NON_PARL[0];
  assert.equal(TERM_RE.test(CARD(s)), false, `${s} 基线必须 0 命中（否则本用例判别力无从建立）`);
  const restore = mutCard(s, (a) => { a.duty = { ...a.duty, constraint: `${a.duty.constraint}；主持人通知后记录` }; });
  try {
    assert.ok(TERM_RE.test(CARD(s)), `${s} 数据里塞「主持人」后卡面必须命中（§5.2 :155 的机械判面）`);
  } finally { restore(); }
  assert.equal(TERM_RE.test(CARD(s)), false, `还原后 ${s} 必须回到 0 命中（守 mutCard 有效性）`);
  ```
- **对应测试**：同上
- **不覆盖**：数据层「主持人」但不渲染的字段（如 `rationale`，A06 的合法散文区）。

### S4-TC-C05 议会席混用「议长」+「主持人」→ 红；只用其一 → 绿

- **覆盖**：spec §5.2 `:152`（可并用不得混用，S1 `MixedTermInCard`）/ §5.2 `:154`（试点席不得原样搬）/ A-5 `:56` / F-12
- **来源**：spec 推导 + 实现观察（补充）：实测 `agents/detective-observer.md` 议长 ×1 + 主持人 ×7（真实混用样例）
- **前置**：`PARL` 非空；选一席议会席。
- **步骤**：① 断基线不混用；② 构造：`duty.constraint` 同时含两词 → 断 S1 校验报 `MixedTermInCard`；③ 还原后断不混用。
- **预期**：混用必红。
- **判据**：
  ```js
  const s = PARL[0];
  const t0 = CARD(s);
  const both = ['议长', '主持人'].filter((w) => t0.includes(w));
  assert.ok(both.length <= 1, `${s} 基线不得已经混用（实得 ${both.join('+')}）`);
  const mixed = mutCard(s, (a) => { a.duty = { ...a.duty, constraint: `${a.duty.constraint}；议长派发、主持人转录` }; });
  try {
    const t = CARD(s);
    assert.ok(t.includes('议长') && t.includes('主持人'), '构造必须真的让两词同时出现在卡面（否则断言空转）');
    const card = PIPE.buildCards().find((b) => b.seat === s).card;
    assert.ok(card && typeof card === 'object', '合并后 card 必须可取（§4 :81）');
    const e = PIPE.buildEnv(s, [card]);
    assert.ok(e && typeof e === 'object', 'buildEnv(seat, cards) 必须可调（§4 :82）');
    const r = CM.validateCardModel(card, e);
    assert.ok(Array.isArray(r.errors) && r.errors.length > 0, '混用称谓必须产生 errors（空数组 = 校验器没判这一面）');
    assert.ok(r.errors.some((x) => x.code === 'MixedTermInCard'), `议会席同卡混用两词必须报 MixedTermInCard（§5.2 :152），实得 ${r.errors.map((x) => x.code).join('|')}`);
  } finally { mixed(); }
  assert.ok(['议长', '主持人'].filter((w) => CARD(s).includes(w)).length <= 1, '还原后不得仍混用（守 mutCard 有效性）');
  ```
- **对应测试**：同上
- **不覆盖**：`env` 构造细节（§7 缺口 12）。

### S4-TC-C06 试点席迁移后「议长」= 0 且「主持人」在位

- **覆盖**：spec §5.2 `:154`（试点席现状 议长×1 + 主持人×7，迁移必须统一为「主持人」）/ A-5 `:56` / F-12
- **来源**：spec 推导 + 实现观察（补充）：实测同事实 11
- **前置**：`detective-observer` ∈ `PARL`；卡文件存在。
- **步骤**：① 断该席是议会席；② 断磁盘卡面「议长」= 0；③ 断「主持人」≥1（不得两词全删）；④ 断渲染投影同样 0 个「议长」。
- **预期**：议长 0、主持人 ≥1。
- **判据**：
  ```js
  const s = 'detective-observer';
  assert.ok(SEATS.includes(s), `${s} 必须真实存在`);
  assert.ok(PARL.includes(s), `${s} 必须是议会席（§4 :97；非议会席口径由 C03 守）`);
  const disk = readFileSync(join(AGENTS_DIR, `${s}.md`), 'utf8');
  assert.ok(disk.length > 200, `${s} 卡面不得为空或过短（否则 0 命中是假绿）`);
  assert.equal((disk.match(/议长/g) ?? []).length, 0, `迁移后 ${s} 卡面不得再出现「议长」（§5.2 :154 要求统一为「主持人」）`);
  assert.ok((disk.match(/主持人/g) ?? []).length >= 1, `${s} 卡面必须保留「主持人」（过渡期议会席允许，不得两词全删）`);
  assert.equal((CARD(s).match(/议长/g) ?? []).length, 0, `渲染投影同样不得含「议长」（§5.2 :154）`);
  ```
- **对应测试**：同上
- **不覆盖**：`S3` 之后彻底移除「主持人」的口径（不在本期）。

### S4-TC-D01 5 个 `outputKind` 每份结构化 `{fields[], checks[]}`（无散文、无指针）

- **覆盖**：spec §6 `:161-164`（结构化合同五份）/ §6 表 `:166-171` / F-09
- **来源**：spec 推导（现状 3 块散文，事实 4）
- **前置**：`outputFormats.mjs` 已改写（③ 段产物）。
- **步骤**：① 断 keys = 5 个 `outputKind`；② 逐块断对象、`fields`/`checks` 非空数组且无空项；③ 断 JSON 串化后 `hitClass(text,'pointers')` = 0 且无 `doc-taxonomy`。
- **预期**：5/5 结构化；零指针。
- **判据**：
  ```js
  const KIND = ['audit', 'issue-card', 'observation', 'evidence', 'testcase'];
  assert.ok(OF.outputFormats && typeof OF.outputFormats === 'object', 'outputFormats 必须导出对象（§6 :161-164）');
  const got = Object.keys(OF.outputFormats);
  assert.ok(got.length > 0, 'outputFormats 不得为空');
  assert.deepEqual([...got].sort(), [...KIND].sort(), `必须恰好这 5 个 outputKind（实得 ${got.join(',')}）`);
  for (const k of KIND) {
    const f = OF.outputFormats[k];
    assert.ok(f && typeof f === 'object' && !Array.isArray(f), `${k} 必须是结构化对象（现状是散文串，事实 4）`);
    assert.ok(Array.isArray(f.fields) && f.fields.length > 0, `${k}.fields 必须非空数组`);
    assert.ok(Array.isArray(f.checks) && f.checks.length > 0, `${k}.checks 必须非空数组`);
    const text = JSON.stringify(f);
    for (const x of [...f.fields, ...f.checks]) assert.ok(String(x).trim().length > 0, `${k} 的 fields/checks 不得含空项`);
    assert.equal(hitClass(text, 'pointers').length, 0, `${k} 内不得含指针词（§5.1 :143 / PRD :223）：${hitClass(text, 'pointers')[0]}`);
    assert.equal(/doc-taxonomy|references\//.test(text), false, `${k} 内不得带文档路径：${text.slice(0, 120)}`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：`checks[]` 元素字段名（§7 缺口 13）。

### S4-TC-D02 `testcase` 块存在且写「跑哪条命令 + 什么算失败」

- **覆盖**：spec §6 `:171`（`testcase` 块新增）/ F-09
- **来源**：spec 推导（现状无该块，事实 4）
- **前置**：D01 已过（块结构成立）。
- **步骤**：① 取 `OF.outputFormats.testcase`；② 断 `fields` ≥5（五要素）；③ 断含可执行命令；④ 断不写路径指针。
- **预期**：块在位、命令可执行、无指针。
- **判据**：
  ```js
  const t = OF.outputFormats.testcase;
  assert.ok(t && typeof t === 'object', '§6 :171：testcase 块必须新增');
  const text = JSON.stringify(t);
  assert.ok(Array.isArray(t.fields) && t.fields.length >= 5, `testcase 必含节至少 5 项（五要素），实得 ${t.fields?.length}`);
  assert.match(text, /(node\s+--test|npm\s+run\s+check|check-plan\.mjs)/, 'testcase 块必须写「跑哪条命令」（§6 :171）');
  assert.match(text, /spec-testcase-gate|check-plan/, '必须指口径单源（规则名 / check-plan 子命令）');
  assert.equal(/docs\/superpowers\/|\.md`?$/.test(text), false, `不得写成文件路径指针：${text.slice(0, 160)}`);
  ```
- **对应测试**：同上
- **不覆盖**：卡面排版（§5 manual）。

### S4-TC-D03 输出格式块残留 `doc-taxonomy` 指针 → 卡面指针词红

- **覆盖**：spec §6 `:169`（`audit` 块引用 `references/doc-taxonomy.md` 的处置）/ PRD `:223` / F-09
- **来源**：spec 推导 + 实现观察（补充）：现状 `outputFormats.mjs` 确有该引用（事实 4）
- **前置**：存在 `outputKind = 'audit'` 的席。
- **步骤**：① 取 audit 席「输出格式」段；② 断段内无 `doc-taxonomy` 与 `references/`；③ 构造：往 `checks` 塞「按 references/doc-taxonomy.md 核对」→ 段内位移（判据面覆盖该段）。
- **预期**：正常态 0；构造态可见。
- **判据**：
  ```js
  const audit = agentData.find((a) => a.outputKind === 'audit');
  assert.ok(audit, '必须存在 outputKind=audit 的席（否则本用例无从构造）');
  const seg = () => CARD(audit.name).split(/^## 输出格式/m)[1].split(/^## /m)[0];
  const cur = seg();
  assert.ok(cur && cur.trim().length > 0, `${audit.name} 的「输出格式」段不得为空`);
  assert.equal(/doc-taxonomy|references\//.test(cur), false, `${audit.name} 卡面输出格式段不得带文档路径（§6 :169）：${(cur.match(/doc-taxonomy|references\//) ?? [])[0]}`);
  const block = OF.outputFormats.audit;
  assert.ok(Array.isArray(block.checks) && block.checks.length > 0, 'audit 块 checks 必须非空');
  block.checks.push('按 references/doc-taxonomy.md 逐交付物核对');
  try {
    assert.ok(seg().includes('doc-taxonomy'), '把路径塞进 checks 后卡面必须可见（守「判定面覆盖输出格式段」的误实现）');
  } finally { block.checks.pop(); }
  assert.equal(/doc-taxonomy/.test(seg()), false, '弹出后必须复原（守构造不污染基线）');
  ```
- **对应测试**：同上
- **不覆盖**：`PointerToElsewhere` 词表（S1 已定）。

### S4-TC-D04 散文声明残留在输出格式块 → `declaration` 类探针红

- **覆盖**：spec §6 `:168`（4 段散文声明处置）/ F-09
- **来源**：spec 推导 + 实现观察（补充）：现状 4 段散文（`:2-4`/`:21`/`:25`，事实 4）
- **前置**：D01 已过。
- **步骤**：① 断正常态段内 `hitClass(seg,'declaration')` = 0；② 构造：往 `fields` 塞「声明：本核对单必由审计专员本人实例完成」→ 命中；③ 复原。
- **预期**：正常 0；构造命中。
- **判据**：
  ```js
  const audit = agentData.find((a) => a.outputKind === 'audit');
  assert.ok(audit, '必须存在 audit 席');
  const seg = () => CARD(audit.name).split(/^## 输出格式/m)[1].split(/^## /m)[0];
  assert.equal(hitClass(seg(), 'declaration').length, 0, `卡面输出格式段不得含声明句式（§6 :168）`);
  const block = OF.outputFormats.audit;
  assert.ok(Array.isArray(block.fields) && block.fields.length > 0, 'audit.fields 必须非空');
  block.fields.push('声明：本核对单必由审计专员本人实例完成；代填即违规');
  try {
    assert.ok(hitClass(seg(), 'declaration').length >= 1, '塞入声明后卡面必须命中（守「探针只扫卡面别处」的误实现）');
  } finally { block.fields.pop(); }
  assert.equal(hitClass(seg(), 'declaration').length, 0, '弹出后必须复原');
  ```
- **对应测试**：同上
- **不覆盖**：散文语义是否真的搬到位（G04 + A06 + B06 三面兜；§5 manual）。

### S4-TC-D05 `outputFormats` 不复制进每席数据（禁 15 份副本）

- **覆盖**：spec §6 `:173`（按 `outputKind` 共享，禁 15 份副本）/ F-09
- **来源**：spec 推导
- **前置**：至少 1 个 kind 下有 ≥2 席（否则逐字相等只有一个样本）。
- **步骤**：① 断席条目无 `outputFormats`；② 按 kind 分组断组内「输出格式」段逐字相等；③ 断组数 ≥2 且有一组 ≥2 席。
- **预期**：席数据零 `outputFormats`；同 kind 段相等。
- **判据**：
  ```js
  for (const a of agentData) assert.equal('outputFormats' in a, false, `${a.name} 不得把 outputFormats 复制进席数据（§6 :173）`);
  const byKind = {};
  for (const a of agentData) (byKind[a.outputKind] ??= []).push(a.name);
  assert.ok(Object.keys(byKind).length >= 2, '至少 2 个 outputKind（否则分组断言退化）');
  assert.ok(Object.values(byKind).some((v) => v.length >= 2), '至少 1 组有 ≥2 席（否则逐字相等只有一个样本）');
  const segOf = (s) => {
    const body = (CARD(s).split(/^## 输出格式/m)[1] ?? '').split(/^## /m)[0];
    assert.ok(body.trim().length > 0, `${s} 的「输出格式」段不得为空`);
    return body;
  };
  for (const [k, names] of Object.entries(byKind)) {
    for (const n of names.slice(1)) assert.equal(segOf(n), segOf(names[0]), `${k} 内 ${n} 与 ${names[0]} 的输出格式段必须逐字相等（按 kind 共享）`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：`fields` 里的变量名渲染（不在本判面）。

### S4-TC-E01 共享层单源：判据 id 在 `shared-actions.mjs` 里恰好出现 1 次

- **覆盖**：spec §4 `:91`（共享层）/ V-3 / §12-R4 `:243` / §1 收益行（P-A）
- **来源**：spec 推导
- **前置**：`SH.SHARED_MUST` / `SHARED_NEVER` 非空数组（导出名见 §3 `:65`）。
- **步骤**：① 断两数组非空、每条有非空 `id`/`criterion`；② 断每条 criterion 在源码里恰好 1 次；③ 断每条至少被一席卡面渲染。
- **预期**：全部通过、源码零重复。
- **判据**：
  ```js
  const SM = SH.SHARED_MUST, SN = SH.SHARED_NEVER;
  assert.ok(Array.isArray(SM) && SM.length > 0, '§4 :91 共享层 must 必须非空数组');
  assert.ok(Array.isArray(SN) && SN.length > 0, '§4 :91 共享层 never 必须非空数组');
  const SRC = readFileSync(join(REPO, 'tools/docgen/card-model/vocab/shared-actions.mjs'), 'utf8');
  assert.ok(SRC.length > 0);
  const all = [...SM, ...SN];
  assert.ok(all.length > 0, '共享动作总数不得为 0（否则循环空转）');
  for (const a of all) {
    assert.ok(typeof a.id === 'string' && a.id.trim() !== '', '共享动作 id 必须非空');
    assert.ok(typeof a.criterion === 'string' && a.criterion.trim() !== '', `${a.id} 的 criterion 必须非空（否则下面的计数恒 0）`);
    assert.equal(SRC.split(a.criterion).length - 1, 1, `共享句 ${a.id} 的判据 id 在源码里必须恰好 1 次（>1 = 第二份副本）`);
    assert.ok(SEATS.some((s) => CARD(s).includes(a.criterion)), `共享句 ${a.id} 至少被一席卡面渲染（否则是死数据）`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：共享句覆盖旧「共享特质」每一条语义（探索稿 §12.6 `:419-428` 的逐句映射 → §5 manual）。

### S4-TC-E02 覆盖走 `overrides[]`（带 reason 且字段确有差异）→ 合并绿 + README 有该行

- **覆盖**：V-3 / spec §4 `:91` / §5 `:116` / F-10
- **来源**：spec 推导
- **前置**：`CM.mergeActions` 可调（S1 出口）。
- **步骤**：① 构造一条共享动作 + 一条本席覆盖（改 landing、带 reason）；② 断 `ok:true`、`overrides` 恰 1 条且 `changed` 含 landing。
- **预期**：合并绿、覆盖被记账。
- **判据**：
  ```js
  const pred = Object.keys(PRED.PREDICATES ?? {});
  const land = Object.keys(LAND.LANDINGS ?? {});
  assert.ok(pred.length > 0 && land.length >= 2, '谓词表非空 + 落点表至少 2 项（否则「改 landing」无从构造）');
  const shared = [{ id: 'cov', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] }];
  const own = [{ ...shared[0], landing: land[1], reason: '本席写进 progress.md，不写交付物正文' }];
  const m = CM.mergeActions(shared, own);
  assert.equal(m.ok, true, `带 reason 的覆盖必须合并成功（实得 ${m.errors.map((e) => e.code).join('|')}）`);
  assert.equal(m.overrides.length, 1, '必须恰记 1 条覆盖（V-3）');
  assert.equal(m.overrides[0].id, 'cov');
  assert.ok(m.overrides[0].changed.includes('landing'), `changed 必须含被改字段 landing（实得 ${m.overrides[0].changed.join(',')}）`);
  ```
- **对应测试**：同上
- **不覆盖**：reason 文案质量。

### S4-TC-E03 覆盖不带 reason → `OverrideWithoutReason`；带 reason 但零差异 → `PointlessOverride`

- **覆盖**：spec §4 `:91`（覆盖必带 reason）/ S1 `merge.mjs` / V-3
- **来源**：spec 推导
- **前置**：E02 已过（合法覆盖的对照面）。
- **步骤**：① 有差异但 reason 缺 → 只报 `OverrideWithoutReason`；② 零差异但带 reason → 只报 `PointlessOverride`。
- **预期**：两码各一例且只报该码。
- **判据**：
  ```js
  const pred = Object.keys(PRED.PREDICATES ?? {});
  const land = Object.keys(LAND.LANDINGS ?? {});
  assert.ok(pred.length > 0 && land.length >= 2);
  const base = { id: 'cov', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] };
  const noReason = CM.mergeActions([base], [{ ...base, landing: land[1] }]);
  assert.deepEqual(noReason.errors.map((e) => e.code), ['OverrideWithoutReason'], '覆盖无 reason → 只报 OverrideWithoutReason');
  const pointless = CM.mergeActions([base], [{ ...base, reason: '理由写了但字段没改' }]);
  assert.deepEqual(pointless.errors.map((e) => e.code), ['PointlessOverride'], '零差异覆盖 → 只报 PointlessOverride');
  assert.equal(noReason.ok, false);
  assert.equal(pointless.ok, false);
  ```
- **对应测试**：同上
- **不覆盖**：reason 空白形态细节（S1 已定，`merge.mjs`）。

### S4-TC-E04 绕过共享层（本席直接写全量同文）→ `DuplicateStatement`

- **覆盖**：§12-R4 `:243` / V-3 / spec §4 `:91`
- **来源**：spec 推导
- **前置**：E02 已过。
- **步骤**：① 共享层已有 id；② own 里再写同 id 同字段、无 reason → 只报 `DuplicateStatement`；③ `overrides` 为空。
- **预期**：绕共享层必红。
- **判据**：
  ```js
  const pred = Object.keys(PRED.PREDICATES ?? {});
  const land = Object.keys(LAND.LANDINGS ?? {});
  assert.ok(pred.length > 0 && land.length > 0);
  const base = { id: 'dup', kind: 'must', objects: ['deliverable.body'], criterion: pred[0], landing: land[0], requires: [] };
  const m = CM.mergeActions([base], [{ ...base }]);
  assert.deepEqual(m.errors.map((e) => e.code), ['DuplicateStatement'], '本席重写同 id 同内容且无 reason → 只报 DuplicateStatement（R4 :243）');
  assert.deepEqual(m.overrides, [], '报错时不得产覆盖记录（否则 README 会出现无源行）');
  ```
- **对应测试**：同上
- **不覆盖**：「不同 id 但文案一致」的重复（无码可判；零散文只由 G02/G07 的探针词兜）。

### S4-TC-E05 `use` 白名单：只能取本席声明过的共享 id

- **覆盖**：spec §4 `:91`（先取 `use` 列出的 id）/ §3 `:65`（`SHARED_USE` 形状）/ V-3
- **来源**：spec 推导
- **前置**：`SH.SHARED_USE` 非空对象。
- **步骤**：① `use` 键必须是真实席名；② 值非空数组且 id 都已登记；③ 声明即合并（卡面含该 criterion）；④ 未声明不出现在卡面。
- **预期**：引用合法、声明即合并、未声明不合并。
- **判据**：
  ```js
  const USE = SH.SHARED_USE;
  assert.ok(USE && typeof USE === 'object' && Object.keys(USE).length > 0, 'SHARED_USE 必须非空对象（§3 :65）');
  const known = new Map([...SH.SHARED_MUST, ...SH.SHARED_NEVER].map((a) => [a.id, a.criterion]));
  assert.ok(known.size > 0, '共享登记表不得为空（否则「都已登记」恒真）');
  for (const [s, ids] of Object.entries(USE)) {
    assert.ok(SEATS.includes(s), `use 表的席位 ${s} 必须是真实席名`);
    assert.ok(Array.isArray(ids) && ids.length > 0, `${s} 的 use 必须是非空数组`);
    for (const id of ids) assert.ok(known.has(id), `${s} 的 use 引用了未登记的共享 id ${id}`);
    const t = CARD(s);
    for (const id of ids) assert.ok(t.includes(known.get(id)), `${s} 声明了 ${id} 却未渲染进卡面（use 与合并脱节）`);
    for (const [id, crit] of known) if (!ids.includes(id)) assert.equal(t.includes(crit), false, `${s} 未在 use 声明 ${id}，卡面不得出现它的判据`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：`use` 缺省语义（§7 缺口 15）。

### S4-TC-F01 正常路径：`generate` 只比不写、15 卡逐字节 = 渲染产物

- **覆盖**：spec §7① `:179` / §3 `:71`（授权链不变：`generate` 只比不写；`writeAll` 只是三处共用实现）/ §5 `:115` / F-23
- **来源**：spec 推导 + 实现观察（补充）：`cmdGenerate` 现为只读漂移比对（`tools/docgen/cli.mjs`）
- **前置**：③ 段已换渲染器（`renderByName` → `renderCard`）；`writeAll` 已落。
- **步骤**：① 断 `writeAll` 是函数；② 静态断 `cli.mjs` 含 `writeAll` 与 `--readme`/`--apply`；③ 跑 `generate` 断 exit 0 + `baseline N/N`；④ 逐席断磁盘 = `renderSeat().card`。
- **预期**：exit 0；15/15 逐字节相等。
- **判据**：
  ```js
  WRITE_ALL();                                     // 前置：落盘实现存在（§3 :71）
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8');
  assert.ok(CLI.includes('writeAll'), 'cli.mjs 必须出现 writeAll（draft / replace / generate --readme --apply 三处共用，§3 :71②）');
  assert.ok(CLI.includes('--readme') && CLI.includes('--apply'), 'cli.mjs 必须有 --readme / --apply 显式旗标（§3 :71③）');
  const r = runCli(['generate']);
  assert.equal(r.code, 0, `generate 必须 exit 0（实得 ${r.code}）：${r.out.slice(0, 300)}`);
  assert.match(r.out, /baseline\s+\d+\/\d+/, '必须打印 baseline N/N（check-all.mjs依赖）');
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）');
  for (const s of CARD_FILES) {
    const disk = readFileSync(join(AGENTS_DIR, `${s}.md`), 'utf8');
    assert.ok(disk.length > 0, `agents/${s}.md 不得为空`);
    assert.equal(disk, CARD(s), `agents/${s}.md 必须与 renderSeat().card 逐字节相等（§7① :179）`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：写盘失败 / 并发合同（§3 `:72`）；原子性由 J02 判。

### S4-TC-F02 单席原子 + 零写盘：坏卡 → 该席被拒 / 31 份不变 / `generate` 只比不写

- **覆盖**：spec §7① `:179`（单席原子；收口坏 1 席 → 31 份全不变）/ §3 `:71`（`generate` 只比不写）/ §4 `:98` / V-5
- **来源**：spec 推导 + 实现观察（补充）：`renderSeat` 单席产物 = `{card, readme}`（§4 `:83`）
- **前置**：`coldRepo()` / `mutCard()` / `TARGETS`（31 份）。
- **步骤**：① 单席坏卡 → 该席渲染被拒、其它席照常；② 副本内 `generate --readme --apply` 坏卡 → exit 1 且 31 份不变；③ 副本内 `generate`（无旗标）→ exit 0 且 31 份不变（只比不写）。
- **预期**：三条各过。
- **判据**：
  ```js
  const s = SEATS[0];
  const other = SEATS.find((x) => x !== s);
  assert.ok(other, '至少需要 2 席（否则「其它席照常」无从断言）');
  const restore = mutCard(s, (a) => { a.must[0].criterion = 'no.such.predicate'; });
  try {
    const refused = (() => { try { PIPE.renderSeat(s); return false; } catch { return true; } })();
    assert.equal(refused, true, `${s} 坏卡必须在单席渲染时被拒（§7① :179 单席原子）`);
    assert.ok(RS(other).card.length > 200, '其它席不得受坏卡影响（单席原子）');
  } finally { restore(); }
  const snap = new Map(TARGETS.map((p) => [p, existsSync(join(REPO, p)) ? readFileSync(join(REPO, p), 'utf8') : null]));
  assert.equal(snap.size, 2 * SEATS.length + 1, '快照必须覆盖 31 份生成物（15 卡 + 15 README + index）');
  const bad = coldRepo({ mutate: INJECT_BAD('no.such.predicate'), args: ['generate', '--readme', '--apply'], verify: (copy) => {
    for (const [p, before] of snap) {
      const now = existsSync(join(copy, p)) ? readFileSync(join(copy, p), 'utf8') : null;
      assert.equal(now, before, `坏卡时不得写 ${p}（§7① :179 零写盘）`);
    }
  } });
  assert.equal(bad.code, 1, `坏卡必须 exit 1（实得 ${bad.code}）：${bad.out.slice(0, 300)}`);
  assert.match(bad.out, /UnboundLanding|MissingCriterionImpl/, `坏卡必须打印 S1 的既有码（§4 :98 不新增码）：${bad.out.slice(0, 300)}`);
  const only = coldRepo({ args: ['generate'], verify: (copy) => {
    for (const [p, before] of snap) {
      const now = existsSync(join(copy, p)) ? readFileSync(join(copy, p), 'utf8') : null;
      assert.equal(now, before, `generate（无 --readme --apply）不得写 ${p}（§3 :71① 只比不写）`);
    }
  } });
  assert.equal(only.code, 0, `只读 generate 必须 exit 0（实得 ${only.code}）：${only.out.slice(0, 300)}`);
  ```
- **对应测试**：同上
- **不覆盖**：`writeAll` 入参 `artifacts` 形状（§7 缺口 12）。

### S4-TC-F03 卡面手改即红（现状已生效，防回退）

- **覆盖**：spec §7② `:180`（**现状已生效**：`collectGate` 已按 state 逐席比对，`tools/docgen/cli.mjs`）/ V-5 / F-23
- **来源**：spec 推导 + 实现观察（补充）：v4 明写「本段不新建这条」→ 本用例是验收登记 + 防回退
- **前置**：副本内 `agents/<seat>.md` 存在；`collectGate` 逐席比对代码仍在。
- **步骤**：① 副本内追加 1 字节；② 跑 `gate`；③ 断 exit 1 + `Mismatch` + 点名。
- **预期**：exit 1 且点名。
- **判据**：
  ```js
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8');
  assert.ok(CLI.includes("state.agents[a.name] === 'replaced'"), 'collectGate 的逐席比对代码必须仍在（§7② :180 现状已生效，防回退）');
  const rel = `agents/${SEATS[0]}.md`;
  const r = coldRepo({ mutate: APPEND_ONE_BYTE(rel), args: ['gate'],
    verify: (copy) => assert.equal(readFileSync(join(copy, rel), 'utf8').endsWith('x'), true, '副本内手改必须真的生效（否则空转）') });
  assert.equal(r.code, 1, `手改卡面必须 gate exit 1（实得 ${r.code}）：${r.out.slice(0, 300)}`);
  assert.match(r.out, /Mismatch/, '必须报 Mismatch（§7② :180）');
  assert.ok(r.out.includes(rel) || r.out.includes(SEATS[0]), `必须点名被改的文件（实得：${r.out.slice(0, 300)}）`);
  ```
- **对应测试**：同上
- **不覆盖**：规则生成物的逐字节比对（既有 gate 面）。

### S4-TC-F04 README 手改 / 缺文件即红（比对面 = 31 份）

- **覆盖**：spec §7③ `:181`（**本段新增**：比对面 = 15 卡 + 16 份 `docs/agents/**` = 31；缺文件 → `DanglingBaselineEntry`，沿用 `collectGate:106`）/ V-5 / F-23
- **来源**：spec 推导（生成物 **16** vs 比对面 **31**，§1 `:20` 两数口径）
- **前置**：`docs/agents/` 已生成（J03 / B03 已过）。
- **步骤**：① 改 `docs/agents/<席>.md` 1 字节 → exit 1 + `Mismatch` + 点名；② 改 index 1 字节 → 同上；③ **删**一份 README → exit 1 + `DanglingBaselineEntry`；④ 断比对面派生式。
- **预期**：三例均红且点名；比对面 31。
- **判据**：
  ```js
  for (const rel of [`docs/agents/${SEATS[0]}.md`, 'docs/agents/README.md']) {
    const r = coldRepo({ mutate: APPEND_ONE_BYTE(rel), args: ['gate'] });
    assert.equal(r.code, 1, `手改 ${rel} 必须 gate exit 1（实得 ${r.code}）：${r.out.slice(0, 300)}`);
    assert.match(r.out, /Mismatch/, `手改 ${rel} 必须报 Mismatch（§7③ :181）`);
    assert.ok(r.out.includes(rel) || r.out.includes(rel.replace('docs/agents/', '')), `必须点名 ${rel}（实得：${r.out.slice(0, 300)}）`);
  }
  const goneRel = `docs/agents/${SEATS[1]}.md`;
  const gone = coldRepo({ mutate: (copy) => { rmSync(join(copy, goneRel), { force: true }); }, args: ['gate'],
    verify: (copy) => assert.equal(existsSync(join(copy, goneRel)), false, '副本内 README 必须真的被删（否则空转）') });
  assert.equal(gone.code, 1, `缺一份 README 必须 gate exit 1（实得 ${gone.code}）：${gone.out.slice(0, 300)}`);
  assert.match(gone.out, /DanglingBaselineEntry/, '缺文件必须报 DanglingBaselineEntry（§7③ :181）');
  assert.ok(gone.out.includes(goneRel) || gone.out.includes(SEATS[1]), `必须点名缺的 ${goneRel}`);
  assert.equal(TARGETS.length, 2 * SEATS.length + 1, `比对面必须 = 2×席数+1（实得 ${TARGETS.length}）`);
  assert.equal(TARGETS.filter((p) => p.startsWith('docs/agents/')).length, SEATS.length + 1, 'docs/agents 侧 = 席数 + index（15 + 1 = 16）');
  ```
- **对应测试**：同上
- **不覆盖**：`docs/agents/` 之外的人读文档。

### S4-TC-F05 接管完整性：删一席 / 中期「未迁移席却有 README」→ 必红

- **覆盖**：spec §7④ `:182`（**收口期断言** + **中期子集判据**：已迁移席必 `replaced`、未迁移席不得出现在 `docs/agents/`）/ V-5 / C-08 `:121`
- **来源**：spec 推导 + 实现观察（补充）：`collectGate` 只比对 `replaced` 席（`tools/docgen/cli.mjs`），缺一席即静默跳过 → 必须构造
- **前置**：`coldRepo()` 的 `DOCGEN_STATE_PATH` 指向副本 state。
- **步骤**：① 副本删首席 → exit 1 + 点名；② 副本把某席置 `'registered'` 且保留其 README → exit 1 + 点名；③ 对照：同一副本不改 → exit 0。
- **预期**：两构造必红、对照必绿。
- **判据**：
  ```js
  const drop = SEATS[0];
  const r1 = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/state.json');
    const st = JSON.parse(readFileSync(p, 'utf8'));
    assert.ok(st && st.agents && typeof st.agents === 'object', 'state.json 必须有 agents 对象');
    assert.ok(Object.prototype.hasOwnProperty.call(st.agents, drop), `${drop} 必须先在 state 里`);
    delete st.agents[drop];
    writeFileSync(p, `${JSON.stringify(st, null, 2)}\n`, 'utf8');
  }, args: ['gate'], verify: (copy) => {
    const st = JSON.parse(readFileSync(join(copy, 'tools/docgen/state.json'), 'utf8'));
    assert.equal(Object.keys(st.agents).length, SEATS.length - 1, '副本 state 必须真的少一席（否则空转）');
  } });
  assert.equal(r1.code, 1, `state 缺一席必须 gate exit 1（实得 ${r1.code}）：${r1.out.slice(0, 300)}`);
  assert.ok(r1.out.includes(drop), `必须点名缺的那一席 ${drop}`);
  const mid = SEATS[1];
  const r2 = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/state.json');
    const st = JSON.parse(readFileSync(p, 'utf8'));
    st.agents[mid] = 'registered';                       // 中期：该席未迁移
    writeFileSync(p, `${JSON.stringify(st, null, 2)}\n`, 'utf8');
    assert.equal(existsSync(join(copy, `docs/agents/${mid}.md`)), true, '中期构造要求该席 README 先存在（否则无从成立）');
  }, args: ['gate'] });
  assert.equal(r2.code, 1, `中期「未迁移席却有 README」必须 gate exit 1（实得 ${r2.code}；§7④ :182 子集判据）：${r2.out.slice(0, 300)}`);
  assert.ok(r2.out.includes(mid), `必须点名中期未迁移的席 ${mid}`);
  const clean = coldRepo({ args: ['gate'] });
  assert.equal(clean.code, 0, `未删未造时同一副本必须 exit 0（防「state 一脏就红」）：${clean.out.slice(0, 300)}`);
  ```
- **对应测试**：同上
- **不覆盖**：`suspended` 值域（F06 判）。

### S4-TC-F06 `state.agents` 键集 = 席集双向相等、值域合法、全部 `replaced`

- **覆盖**：spec §7④ `:182` / C-08 `:121` / §8 步 4 `:193`
- **来源**：spec 推导
- **前置**：`tools/docgen/state.json` 存在。
- **步骤**：① 读 state；② 断键集与 `SEATS` 双向相等；③ 断值 ∈ {`replaced`,`suspended`}；④ 断全部 `replaced`。
- **预期**：双向相等 + 全 replaced。
- **判据**：
  ```js
  const st = JSON.parse(readFileSync(join(REPO, 'tools/docgen/state.json'), 'utf8'));
  assert.ok(st && st.agents && typeof st.agents === 'object', 'state.json 必须有 agents 对象');
  const keys = Object.keys(st.agents);
  assert.ok(keys.length > 0, 'state.agents 不得为空（否则双向相等空转）');
  assert.deepEqual([...keys].sort(), [...SEATS].sort(), `state 键集必须与席集双向相等（多=${keys.filter((k) => !SEATS.includes(k)).join(',') || '无'} / 少=${SEATS.filter((s) => !keys.includes(s)).join(',') || '无'}）`);
  for (const [k, v] of Object.entries(st.agents)) assert.ok(['replaced', 'suspended'].includes(v), `state.agents[${k}] 值非法：${v}`);
  const notReplaced = Object.entries(st.agents).filter(([, v]) => v !== 'replaced').map(([k]) => k);
  assert.deepEqual(notReplaced, [], `15 席必须逐席 replaced（§7④ :182），未接管：${notReplaced.join(',')}`);
  ```
- **对应测试**：同上
- **不覆盖**：`state.version`。

### S4-TC-F07 `EXPIRY_LANDED === true` + 豁免行在输出中 + 注入有行为差异

- **覆盖**：spec §7⑤ `:183`（判据 = `npm run check` **输出中含**该行，不是首行；+ `disposeCardFindings([{file:'agents/x.md'}], {landed:true})` → `blockers.length ≥ 1`）/ §10-D7 `:220` / C-08 `:121`
- **来源**：spec 推导 + 实现观察（补充）：现状 `card-exempt.mjs` = `false`；`check-all.mjs` 打印该行（非首行）
- **前置**：`card-exempt.mjs` 已改（D7）；`disposeCardFindings` 可 import。
- **步骤**：① 断常量 `=== true`；② 静态读 `check-all.mjs`：该行存在、非首行、插值常量；③ 注入断 blockers ≥1。
- **预期**：四条全过。
- **判据**：
  ```js
  assert.equal(EXPIRY_LANDED, true, `§7⑤ :183 / D7 :220：EXPIRY_LANDED 必须置 true（实得 ${EXPIRY_LANDED}）`);
  const CA = readFileSync(join(REPO, 'scripts/check-all.mjs'), 'utf8');
  const caLines = CA.split(/\r?\n/);
  const idx = caLines.findIndex((l) => l.includes('[豁免窗口]'));
  assert.ok(idx >= 0, 'check-all 必须有 [豁免窗口] 行（§7⑤ :183 的可核面）');
  assert.ok(idx > 0, '该行不得是首行（§7⑤ :183 明写「输出中含该行」）');
  assert.ok(caLines[idx].includes('EXPIRY_LANDED=${EXPIRY_LANDED}'), '该行必须插值常量（不是写死 true）');
  assert.equal(typeof disposeCardFindings, 'function', 'disposeCardFindings 必须是函数（§7⑤ 的注入面）');
  const injected = disposeCardFindings([{ file: 'agents/x.md' }], { landed: true });
  assert.ok(Array.isArray(injected.blockers) && injected.blockers.length >= 1, `置 landed=true 后必须产生 ≥1 blocker（实得 ${(injected.blockers ?? []).length}）：证置 true 有行为差异`);
  ```
- **对应测试**：同上
- **不覆盖**：实跑 `npm run check` 看该行（§5 只手动验证）。

### S4-TC-F08 旧模板退场：`templates/` 两文件不存在 + 代码面 0 命中 + 新卡无 `sourceLine`

- **覆盖**：spec §7⑥ `:184`（判据面收窄为两处）/ §10-D8 `:221` / §11-3 `:233` / PRD D-05 `:500`
- **来源**：spec 推导 + 实现观察（补充）：旧模板名仓内 16 处命中，其中 `agents/senior-sdet.md:9` 是卡面正文（事实 11）
- **前置**：③ 段已删旧模板、改 `renderByName`、删 `sourceLine`。
- **步骤**：① 断两 `.tpl` 不存在；② 扫 `tools/docgen/**/*.mjs` 断 0 命中；③ 断席条目与 card 无 `sourceLine`；④ 断 15 卡面无 `*.tpl`。
- **预期**：全 0 / 不存在。
- **判据**：
  ```js
  const TPL = ['agent.md.tpl', 'agent-handwritten.md.tpl'];
  for (const t of TPL) assert.equal(existsSync(join(REPO, 'tools/docgen/templates', t)), false, `判据①：旧模板 ${t} 必须已删除（§7⑥ :184）`);
  const mjs = walkFiles(join(REPO, 'tools', 'docgen')).filter((p) => p.endsWith('.mjs'));
  assert.ok(mjs.length > 0, 'tools/docgen/**/*.mjs 不得为空（否则 0 命中是假绿）');
  const hits = mjs.filter((p) => TPL.some((t) => readFileSync(p, 'utf8').includes(t)));
  assert.deepEqual(hits, [], `判据②：代码面必须 0 命中旧模板名（实得 ${hits.length}：${hits.slice(0, 3).join(' | ')}）`);
  for (const a of agentData) {
    assert.equal('sourceLine' in a, false, `${a.name} 的席条目不得再有 sourceLine 键（§7⑥ :184）`);
    assert.equal('sourceLine' in (a.card ?? {}), false, `${a.name} 的 card 不得有 sourceLine 键`);
  }
  let tplInCard = 0;
  for (const s of SEATS) if (/[a-z0-9-]+\.md\.tpl/.test(CARD(s))) tplInCard += 1;
  assert.equal(tplInCard, 0, `15 张卡面不得出现 *.tpl 字样（实得 ${tplInCard} 张）`);
  ```
- **对应测试**：同上
- **不覆盖**：`docs/` / `.session/` / `.superpowers/` 的历史文档（v4 §7⑥ 明写不算）。

### S4-TC-F09 旧模板探针判别力：往 `.mjs` 代码面注入 → 命中 ≥ 1

- **覆盖**：spec §7⑥ `:184`（判据②只扫代码面）/ D-05 `:500` / §0.2-7（假阴性守卫）
- **来源**：spec 推导
- **前置**：F08 已过（正常态代码面 0 命中）。
- **步骤**：① 副本内往 `renderCard.mjs` 追加一行含旧模板名的注释；② 对副本跑同形扫描；③ 断命中 ≥1 且点名；④ 断扫描集合全 `.mjs` 且不含 `agents/`。
- **预期**：代码面注入必命中；扫描集合不含卡面。
- **判据**：
  ```js
  const rel = 'tools/docgen/components/renderCard.mjs';
  const r = coldRepo({ mutate: (copy) => {
    const p = join(copy, rel);
    assert.ok(existsSync(p), `副本内缺 ${rel}`);
    writeFileSync(p, `${readFileSync(p, 'utf8')}\n// 旧模板 agent.md.tpl 的遗留分支\n`, 'utf8');
  }, args: ['gate'], verify: (copy) => {
    const mjs = walkFiles(join(copy, 'tools', 'docgen')).filter((p) => p.endsWith('.mjs'));
    assert.ok(mjs.length > 0, '副本代码面不得为空');
    const found = mjs.filter((p) => readFileSync(p, 'utf8').includes('agent.md.tpl'));
    assert.ok(found.length >= 1, '代码面注入旧模板名后扫描必须命中 ≥1（否则判据②写错面 → F08 是假绿）');
    assert.ok(found.some((p) => p.endsWith(rel)), `命中必须点名 ${rel}，实得 ${found.slice(0, 3).join(' | ')}`);
  } });
  assert.ok(r.code === 0 || r.code === 1, '副本 gate 只要跑完即可（本用例判扫描命中）');
  const scanSet = walkFiles(join(REPO, 'tools', 'docgen')).filter((p) => p.endsWith('.mjs'));
  assert.ok(scanSet.length > 0, '判据②的扫描集合不得为空');
  assert.equal(scanSet.every((p) => p.endsWith('.mjs')), true, '判据②的扫描集合必须全是 .mjs（不得把 .md 卡面混进来）');
  assert.equal(scanSet.some((p) => p.split(/[\\/]/).includes('agents')), false, '扫描集合不得包含 agents/（§7⑥ :184 已收窄）');
  ```
- **对应测试**：同上
- **不覆盖**：`renderAgent.mjs` 若保留导出但不再被调用——属合法残留（只看旧模板**文件名**）。

### S4-TC-F10 拒绝码 → **exit 1**（`EXIT` 表承接 S1 码；`WeakReason` 不入表）

- **覆盖**：spec §4 `:98`（拒绝语义 → exit 1）/ §10-D12 `:225`（`EXIT` 表新增 S1 码分组 = exit 1；`WeakReason` manual 不入表）/ S1 §6 `:159`
- **来源**：spec 推导 + 实现观察（补充）：`validateAgentData.mjs:4-22` 是封闭 `EXIT` 表；`exitCodeFor` 已导出；S1 码未接时抛「未知错误码」（事实 9）
- **前置**：`exitCodeFor` 为函数；`CM.CARD_MODEL_CODES` 为对象且 36 键。
- **步骤**：① 断入口 + 36 码；② 逐 S1 脚本码 → `1`；③ 3 合并码 → `1`；④ `WeakReason` → 抛；⑤ `DanglingBaselineEntry` 仍 `2`。
- **预期**：S1 码全 1、合并码全 1、`WeakReason` 不在表、既有分档不变。
- **判据**：
  ```js
  assert.equal(typeof exitCodeFor, 'function', 'exitCodeFor 必须可 import（§10-D12 :225）');
  const codes = Object.keys(CM.CARD_MODEL_CODES ?? {});
  assert.equal(codes.length, 36, `S1 脚本码必须 36 个（前置；实得 ${codes.length}）`);
  for (const c of codes) assert.equal(exitCodeFor(c), 1, `${c} 必须归 exit 1（§10-D12 :225；不得落 2）`);
  for (const c of ['DuplicateStatement', 'OverrideWithoutReason', 'PointlessOverride']) assert.equal(exitCodeFor(c), 1, `合并码 ${c} 必须归 exit 1（§10-D12）`);
  assert.throws(() => exitCodeFor('WeakReason'), /未知错误码/, 'WeakReason 是 manual，不得入 EXIT 表（§10-D12 :225）');
  assert.equal(exitCodeFor('DanglingBaselineEntry'), 2, '既有码 DanglingBaselineEntry 仍为 2（§7③ :181 沿用；既有映射不动）');
  ```
- **对应测试**：同上
- **不覆盖**：CLI 端逐码打印格式（F02 的产物面）。


### S4-TC-G01 15 卡过 S1 校验零 errors + 码表仍 36 + 15 席 subject 形态 `<seat>.card`

- **覆盖**：V-4 / spec §5.1 `:135`（零散文机械口径）/ §4 `:94`（`SUBJECTS` 席命名形态 = `<seat>.card`）/ §2-1 `:27`（不改 S1 判据）/ §4 `:98`
- **来源**：spec 推导
- **前置**：`PIPE.buildEnv(seat, cards)` 可调；`CM.validateCardModel` / `CM.SUBJECTS` 可 import。
- **步骤**：① 逐席取 card + env 断 11 键；② `validateCardModel` 断 `ok:true` 且 `errors: []`；③ 断 `CARD_MODEL_CODES` 仍 36 键；④ 断每席 `<seat>.card` 匹配形态且登记在 `SUBJECTS`。
- **预期**：15/15 零 errors；码表 36；15/15 subject 登记在位。
- **判据**：
  ```js
  assert.equal(typeof PIPE.buildEnv, 'function', 'buildEnv(seat, cards) 必须导出（§4 :82）');
  assert.equal(typeof CM.validateCardModel, 'function', 'validateCardModel 必须是函数');
  for (const b of PIPE.buildCards()) {
    const e = PIPE.buildEnv(b.seat, [b.card]);
    assert.ok(e && typeof e === 'object', `${b.seat} 的 env 必须可取（§4 :82）`);
    assert.equal(Object.keys(e).length, 11, `${b.seat} 的 env 必须是 S1 §6 的 11 键（实得 ${Object.keys(e).length}）`);
    const r = CM.validateCardModel(b.card, e);
    assert.equal(r.ok, true, `${b.seat} 必须过 S1 校验（实得 ${(r.errors ?? []).map((x) => x.code).join('|')}）`);
    assert.deepEqual(r.errors, [], `${b.seat} 必须零 errors`);
  }
  assert.equal(typeof CM.CARD_MODEL_CODES, 'object', 'CARD_MODEL_CODES 必须是对象（S1 出口面）');
  assert.equal(Object.keys(CM.CARD_MODEL_CODES).length, 36, 'CARD_MODEL_CODES 必须仍 36 键（§2-1 :27 / §4 :98 不新增码）');
  assert.equal(typeof CM.SUBJECTS, 'object', 'SUBJECTS 必须是对象（S1 出口面）');
  const subjKeys = Object.keys(CM.SUBJECTS ?? {});
  assert.ok(subjKeys.length > 0, 'SUBJECTS 不得为空（否则下面的存在性断言空转）');
  for (const s of SEATS) {
    const want = `${s}.card`;
    assert.match(want, /^[a-z][a-z0-9-]*\.card$/, `席命名形态必须 = <seat>.card（§4 :94），实得 ${want}`);
    assert.ok(subjKeys.includes(want), `${want} 必须登记在 SUBJECTS（§4 :94 / §10-D5 :218）`);
  }
  ```
- **对应测试**：同上
- **不覆盖**：S1 各码语义（S1 testcase 58 条已覆盖）。

### S4-TC-G02 零散文：15 张卡面过 `PROSE_PROBES` 三类探针 0 命中（词表不另写）

- **覆盖**：V-4 / spec §9 V-4 `:204`（判据全集**只认** `PROSE_PROBES`）/ §5.1 探针表 `:139-143` / §3 `:62`（三类固定键名）/ F-09
- **来源**：spec 推导 + 第三方通道：旧段名/声明句式切 spec §5.1 表；指针词切 **S1 §7 `:188` 的 `POINTER_WORDS`**（v4 `:143` 明写「同形判定」，词表本身来自 S1）
- **前置**：`MF.PROSE_PROBES` 已落；`PROBE_CLASSES` / `hitClass()` 在位。
- **步骤**：① 断 `PROSE_PROBES` 三类非空对象、元素 string 或 RegExp；② 旧段名 / 声明句式与 spec 表逐词相等；③ 指针词 = S1 `:188` 五词；④ 逐卡三类 0 命中；⑤ 段名表不命中旧段名类。
- **预期**：三类齐、两源对得上；15 卡 0 命中。
- **判据**：
  ```js
  const PROBES = PROSE_PROBES();
  for (const k of Object.keys(PROBE_CLASSES)) {
    for (const p of PROBES[k]) assert.ok(typeof p === 'string' || p instanceof RegExp, `PROSE_PROBES.${k} 元素必须 string 或 RegExp（实得 ${typeof p}）`);
  }
  const rows = specTableStrict(/\*\*零散文探针/).filter((c) => /^(旧段名|声明句式|指针词)/.test(String(c[0]).replace(/`/g, '').trim()));
  assert.equal(rows.length, 3, `spec §5.1 探针表必须 3 类（实得 ${rows.length}）`);
  const cutWords = (cell) => String(cell).replace(/`/g, '').split('/').map((x) => x.trim()).filter(Boolean);
  for (const cls of ['oldSegments', 'declaration']) {
    const label = PROBE_CLASSES[cls];
    const row = rows.find((c) => String(c[0]).replace(/`/g, '').trim().startsWith(label));
    assert.ok(row, `spec §5.1 探针表缺「${label}」行`);
    const want = cutWords(row[1]);
    assert.ok(want.length > 0, `spec「${label}」行切出空集（否则逐词断言空转）`);
    assert.deepEqual(PROBES[cls].map(probeSrc).sort(), want.slice().sort(), `PROSE_PROBES.${cls} 必须与 spec「${label}」行逐词相等（不得另写一份）`);
  }
  const s1l = readFileSync(S1_SPEC_PATH, 'utf8').split(/\r?\n/)[187];
  assert.ok(typeof s1l === 'string' && s1l.length > 0, 'S1 spec :188 必须非空（指针词的上游单源）');
  const flat = (x) => String(x).replace(/\s/g, '');
  assert.equal(PROBES.pointers.length, 5, '指针词 = S1 POINTER_WORDS 五词（S1 §7 :188）');
  for (const w of PROBES.pointers.map(probeSrc)) assert.ok(flat(s1l).includes(flat(w)), `指针词「${w}」必须来自 S1 §7 :188 的 POINTER_WORDS`);
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）');
  for (const s of CARD_FILES) {
    const t = readFileSync(join(AGENTS_DIR, `${s}.md`), 'utf8');
    assert.ok(t.length > 0, `agents/${s}.md 不得为空`);
    for (const k of Object.keys(PROBE_CLASSES)) {
      const hits = hitClass(t, k);
      assert.equal(hits.length, 0, `agents/${s}.md 卡面不得命中「${PROBE_CLASSES[k]}」类探针（§9 V-4 :204）：${hits[0]}`);
    }
  }
  for (const seg of MF.CARD_SEGMENTS) assert.equal(hitClass(String(seg), 'oldSegments').length, 0, `段名表不得含旧段名：${seg}`);
  ```
- **对应测试**：同上
- **不覆盖**：**同义散文**（spec `:145` 的已知边界：由 G04 / A06 / B06 + D10 兜）。

### S4-TC-G03 副本口径：改共享层 1 处 → 含新串的席数 = use 引用该 id 的席数

- **覆盖**：V-2 / spec §1 收益行（P-A 副本归零）/ PRD `:576` / §1 联动四问（治本）
- **来源**：spec 推导
- **前置**：`SH.SHARED_MUST` 首条 criterion 非空；`coldRepo()` 可用。
- **步骤**：① 记该 criterion 与引用它的席数 `refs`；② 副本内把该 criterion 替换成新串并跑 `generate`；③ 断含新串的席数 **= refs**、旧串 0 残留。
- **预期**：`withNew === refs`。
- **判据**：
  ```js
  const crit = SH.SHARED_MUST[0].criterion;
  assert.ok(typeof crit === 'string' && crit.trim() !== '', '首条共享 must 的 criterion 必须非空（构造前提）');
  const refs = Object.entries(SH.SHARED_USE).filter(([, ids]) => Array.isArray(ids) && ids.includes(SH.SHARED_MUST[0].id)).length;
  assert.ok(refs > 0, '该共享 id 必须被 ≥1 席 use 引用（否则本断言空转）');
  const NEW = `${crit}.probe`;
  const seen = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/card-model/vocab/shared-actions.mjs');
    const src = readFileSync(p, 'utf8');
    assert.equal(src.includes(crit), true, '副本内必须能找到该 criterion（否则替换无效）');
    writeFileSync(p, src.split(crit).join(NEW), 'utf8');
  }, args: ['generate'], verify: (copy) => {
    const cards = CARD_FILES.map((s) => readFileSync(join(copy, 'agents', `${s}.md`), 'utf8'));
    assert.equal(cards.length, CARD_FILES.length, '副本内卡文件数必须 = 席数');
    assert.equal(cards.filter((t) => t.includes(NEW)).length, refs, `含新串的席数必须 = use 引用该 id 的席数（应 ${refs}）`);
    assert.equal(cards.filter((t) => t.includes(crit) && !t.includes(NEW)).length, 0, '不得有卡面残留旧串');
  } });
  assert.ok(seen.code === 0 || seen.code === 1, '副本 generate 只要跑完即可（本用例判同步）');
  ```
- **对应测试**：同上
- **不覆盖**：交付材料的副本计数记账面（§7 缺口 11）。

### S4-TC-G04 散文落点两形态：进 `rationale` 合法、进 `duty` 必红

- **覆盖**：V-4 / spec §5.1 `:135`（散文只允许落 `card.rationale`）/ §12-R3 `:242`（不得做成「删内容」）
- **来源**：spec 推导
- **前置**：`mutCard()` 可用。
- **步骤**：① 散文塞 `rationale` → 卡面 0 命中、README 命中；② 同一散文（带指针形）塞 `duty` → S1 校验报 `PointerToElsewhere`；③ 还原后 0。
- **预期**：两形态方向相反且都成立。
- **判据**：
  ```js
  const s = SEATS[0];
  const prose = '（这段是解释性散文：心算必错，实测数错 3 次被拦）';
  const r1 = mutCard(s, (a) => { a.rationale = `${a.rationale}${prose}`; });
  try {
    assert.equal(CARD(s).includes('心算必错'), false, 'rationale 里的散文不得进卡面（§5.1 :135）');
    assert.ok(RS(s).readme.includes('心算必错'), 'README 必须承载该散文（§12-R3 :242 搬落点）');
  } finally { r1(); }
  const r2 = mutCard(s, (a) => { a.duty = { ...a.duty, action: `${a.duty.action}（详见 §5 的实现）` }; });
  try {
    assert.ok(CARD(s).includes('详见'), '构造必须真的让指针词进卡面（否则断言空转）');
    const card = PIPE.buildCards().find((b) => b.seat === s).card;
    const e = PIPE.buildEnv(s, [card]);
    const r = CM.validateCardModel(card, e);
    assert.ok(r.errors.some((x) => x.code === 'PointerToElsewhere'), `duty 里的指针必须报 PointerToElsewhere（实得 ${r.errors.map((x) => x.code).join('|') || '(空)'}）`);
  } finally { r2(); }
  assert.equal(CARD(s).includes('详见'), false, '还原后卡面不得仍含指针');
  ```
- **对应测试**：同上
- **不覆盖**：散文「语义是否搬到共享 must」——§5 manual。

### S4-TC-G05 P-B 扫描：`must` 行判 criterion + landing；`never` 行只判 objects + criterion

- **覆盖**：V-7 / spec §9 V-7 `:207`（`never` 只判 objects + criterion，与 PRD `:234` 一致）/ §5.1 `:127-128` / PRD `:576`
- **来源**：spec 推导（v4 明确 `never` 不判 landing）
- **前置**：`buildCards()` 非空；至少一席有 must。
- **步骤**：① 逐席取「一定会」段与「禁止」段；② must 行断 criterion + landing；③ never 行只断 objects + criterion（不查 landing）；④ 断两外部集合等长。
- **预期**：must 两要素齐；never 两要素齐且不因缺 landing 判红。
- **判据**：
  ```js
  assert.equal(SEATS.length, CARD_FILES.length, '席集与卡文件集必须等长（外部集合相等）');
  let musts = 0, nevers = 0;
  for (const b of PIPE.buildCards()) {
    assert.ok(b && b.card && typeof b.card === 'object', `${b.seat} 的 buildCards 结果必须带 card`);
    const t = CARD(b.seat);
    const mustBody = t.split(/^## 一定会/m)[1].split(/^## /m)[0];
    const neverBody = t.split(/^## 禁止/m)[1].split(/^## /m)[0];
    assert.ok(mustBody && mustBody.length > 0, `${b.seat} 的「一定会」段不得为空`);
    assert.ok(neverBody && neverBody.length > 0, `${b.seat} 的「禁止」段不得为空`);
    for (const a of b.card.must ?? []) {
      assert.ok(typeof a.criterion === 'string' && a.criterion.trim() !== '', `${b.seat}/${a.id} 的 criterion 必须非空（V-7 :207）`);
      assert.ok(typeof a.landing === 'string' && a.landing.trim() !== '', `${b.seat}/${a.id} 的 landing 必须非空（V-7 :207 落点面）`);
      assert.ok(mustBody.includes(a.criterion), `${b.seat}/${a.id} 的 must 行必须含判据 id ${a.criterion}`);
      assert.ok(mustBody.includes(a.landing), `${b.seat}/${a.id} 的 must 行必须含落点字面值 ${a.landing}`);
      musts += 1;
    }
    for (const a of b.card.never ?? []) {
      const objs = Array.isArray(a.objects) ? a.objects.filter((x) => String(x).trim()) : [];
      assert.ok(objs.length > 0, `${b.seat}/${a.id} 的 never 必须至少 1 个 objects（V-7 :207 / PRD :234）`);
      assert.ok(typeof a.criterion === 'string' && a.criterion.trim() !== '', `${b.seat}/${a.id} 的 never criterion 必须非空`);
      for (const o of objs) assert.ok(neverBody.includes(String(o)), `${b.seat}/${a.id} 的 never 行必须含宾语 ${o}`);
      assert.ok(neverBody.includes(a.criterion), `${b.seat}/${a.id} 的 never 行必须含判据 id ${a.criterion}`);
      nevers += 1;
    }
  }
  assert.ok(musts > 0 && nevers > 0, `全仓必须同时检查到 must 与 never 行（实得 must ${musts} / never ${nevers}）`);
  ```
- **对应测试**：同上
- **不覆盖**：`landing` 运行时取值（§4 `:93` 只渲染字面值 + 变量名）。

### S4-TC-G06 P-B 负例：删 must 的 landing 字面值（或置空 criterion）→ 必红

- **覆盖**：V-7 / §9 V-7 `:207` / §0.2-7（假阴性守卫）
- **来源**：spec 推导
- **前置**：G05 已过。
- **步骤**：① 构造：把首条 must 的 landing 改成不会被渲染的值 → P-B 必点名；② 置空 criterion → P-B 点名且 S1 报 `MissingCriterionImpl`；③ 各还原。
- **预期**：两变异各红。
- **判据**：
  ```js
  const s = SEATS[0];
  const pb = (seat) => {
    const b = PIPE.buildCards().find((x) => x.seat === seat);
    const acts = b.card.must ?? [];
    assert.ok(acts.length > 0, `${seat} 必须有 must 动作`);
    const body = CARD(seat).split(/^## 一定会/m)[1].split(/^## /m)[0];
    return acts.filter((a) => !(body.includes(String(a.criterion ?? '')) && body.includes(String(a.landing ?? '')))).map((a) => a.id);
  };
  assert.deepEqual(pb(s), [], `${s} 基线必须 0 缺项（否则判别力先失效）`);
  const r1 = mutCard(s, (a) => { a.must[0].landing = 'landing.not.registered.probe'; });
  try { assert.deepEqual(pb(s), [PIPE.buildCards().find((x) => x.seat === s).card.must[0].id], '落点字面值不进卡面 → P-B 必须点名该行'); } finally { r1(); }
  const r2 = mutCard(s, (a) => { a.must[0].criterion = ''; });
  try {
    assert.ok(pb(s).length >= 1, 'criterion 为空 → P-B 必须点名该行（与 S1 的 MissingCriterionImpl 同向，不互替）');
    const card = PIPE.buildCards().find((x) => x.seat === s).card;
    const v = CM.validateCardModel(card, PIPE.buildEnv(s, [card]));
    assert.ok(v.errors.some((x) => x.code === 'MissingCriterionImpl'), `空 criterion 必须同时被 S1 判（实得 ${v.errors.map((x) => x.code).join('|') || '(空)'}）`);
  } finally { r2(); }
  ```
- **对应测试**：同上
- **不覆盖**：`landing` 填未登记值时的 S1 码（`UnboundLanding`；G01 判零 errors）。

### S4-TC-G07 探针三类各 1 条反例（只命中本类）+ 指针词假阳性守卫

- **覆盖**：spec §5.1 `:145`（三类各 ≥1 反例 + **假阳性守卫**）/ §5.1 `:143`（同形判定）/ §9 V-4 `:204` / F-09
- **来源**：spec 推导 + 第三方通道（反例串取每类首个探针；守卫串取 S1 `card-model.test.mjs` 同口径合法词）
- **前置**：G02 已过（三类齐、两源对得上）。
- **步骤**：① 三类基线 0 命中；② 三类各构造（塞首个探针进 `duty.action`）→ 断本类 ≥1、另两类 0；③ 守卫：塞「遇意见冲突，可见，参考周围人的意见」→ 指针词类 **0**；④ 各还原。
- **预期**：3 反例 + 1 守卫，各只影响本类。
- **判据**：
  ```js
  const s = SEATS[0];
  for (const k of Object.keys(PROBE_CLASSES)) assert.equal(hitClass(CARD(s), k).length, 0, `${s} 基线必须 0 命中「${PROBE_CLASSES[k]}」类`);
  for (const [cls, label] of Object.entries(PROBE_CLASSES)) {
    const first = PROSE_PROBES()[cls][0];
    assert.ok(first !== undefined, `「${label}」类必须有首个探针（否则本类反例无从构造）`);
    const src = probeSrc(first);
    assert.ok(src.length > 0, `「${label}」类首个探针不得为空`);
    const probe = cls === 'pointers' ? `（${src} 3）` : `（${src}）`;
    const restore = mutCard(s, (a) => { a.duty = { ...a.duty, action: `${a.duty.action}${probe}` }; });
    try {
      const t = CARD(s);
      assert.ok(t.includes(src), `构造必须真的把「${label}」类的词塞进卡面（实得未命中：${src}）`);
      for (const k of Object.keys(PROBE_CLASSES)) {
        const hits = hitClass(t, k);
        if (k === cls) assert.ok(hits.length >= 1, `卡面含「${label}」类探针时必须命中本类（实得 0）`);
        else assert.equal(hits.length, 0, `「${label}」类反例不得串到「${PROBE_CLASSES[k]}」类（实得 ${hits.join('|')}）`);
      }
    } finally { restore(); }
    for (const k of Object.keys(PROBE_CLASSES)) assert.equal(hitClass(CARD(s), k).length, 0, `还原后 ${s} 的「${PROBE_CLASSES[k]}」类必须回到 0 命中`);
  }
  const guard = '（遇意见冲突，可见，参考周围人的意见）';
  const restore2 = mutCard(s, (a) => { a.duty = { ...a.duty, action: `${a.duty.action}${guard}` }; });
  try {
    const t = CARD(s);
    assert.ok(t.includes('遇意见冲突') && t.includes('可见'), '守卫构造必须真的把合法词塞进卡面（否则守卫断言空转）');
    assert.equal(hitClass(t, 'pointers').length, 0, `合法词「遇意见冲突 / 可见 / 参考周围人的意见」不得命中指针词类（实得 ${hitClass(t, 'pointers').join('|')}）`);
  } finally { restore2(); }
  ```
- **对应测试**：同上
- **不覆盖**：同义散文（§5.1 `:145` 已知边界）。

### S4-TC-H01 试点先行：**归档副本**（`docs/reports/`）在位且 7 段逐段对照

- **覆盖**：spec §8 步 1 `:190`（对照稿落 `.session/reviews/<次>/`，**归档副本**落 `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md`）/ PRD A-4 `:55` / F-11
- **来源**：spec 推导 + 实现观察（补充）：`.session/` 不进 git → 常驻测试只能断归档副本
- **前置**：归档文件已生成。
- **步骤**：① 断归档副本存在且非空；② 7 段名逐段出现；③ 含差异清单标记；④ 点名试点席。
- **预期**：归档副本在位、段齐。
- **判据**：
  ```js
  const p = join(REPO, 'docs', 'reports', '2026-10-30-agent-card-s4-pilot-contrast.md');
  assert.equal(existsSync(p), true, '试点对照稿的**归档副本**必须存在（§8 步 1 :190；.session/ 那份不进 git，只作手动项）');
  const t = readFileSync(p, 'utf8');
  assert.ok(t.length > 0, '归档副本不得为空');
  for (const seg of SPEC_7) assert.ok(t.includes(seg), `对照稿必须逐段对照：缺「${seg}」`);
  assert.match(t, /差异|一致|相同/, '对照稿必须含差异清单（不是复制旧卡）');
  assert.ok(t.includes('detective-observer') || t.includes('侦探'), '试点席必须是侦探席（PRD A-4 :55）');
  ```
- **对应测试**：同上
- **不覆盖**：`.session/` 工作副本（§5 手动项）；试点先于其余席的时序（H03）。

### S4-TC-H02 全集口径 = 落地时点 `agents/*.md` 全集（派生 = 席集，不写死 15）

- **覆盖**：spec §8 步 3 `:192`（逐席滚动铺满；全集 = 落地时点卡集）/ PRD `:416` / F-11
- **来源**：spec 推导
- **前置**：`agents/*.md` 与 `agentData` 可读。
- **步骤**：① 断磁盘卡文件集与席集双向相等；② 断数量 > 0；③ 断三个渲染模块未写死席名数组。
- **预期**：双向相等；名单从 `agentData` 派生。
- **判据**：
  ```js
  assert.deepEqual([...CARD_FILES].sort(), [...SEATS].sort(), `卡面文件集必须 = 席集（多=${CARD_FILES.filter((s) => !SEATS.includes(s)).join(',') || '无'} / 少=${SEATS.filter((s) => !CARD_FILES.includes(s)).join(',') || '无'}）`);
  assert.ok(CARD_FILES.length > 0, '卡文件集不得为空');
  const SRC = ['cardPipeline.mjs', 'renderCard.mjs', 'renderReadme.mjs']
    .map((f) => readFileSync(join(REPO, 'tools/docgen/components', f), 'utf8')).join('\n');
  assert.ok(SRC.length > 0, '三个渲染模块必须已落（否则本断言空转）');
  assert.equal(/const\s+SEATS\s*=\s*\[/.test(SRC), false, '渲染模块不得写死席名数组（必须从 agentData 派生，F-11）');
  ```
- **对应测试**：同上
- **不覆盖**：新增第 16 席的实跑（越段）。

### S4-TC-H03 出数门槛：`git log -1 --numstat` 可跑且单席改动行数 > 0

- **覆盖**：spec §8 步 2 `:191`（量单席改动行数；×14 + 20% 缓冲）/ PRD D-07 `:502` / F-11
- **来源**：spec 推导 + 实现观察（补充）：`git diff` 依赖「最后提交恰为试点」不可靠 → 改 `git log -1 --numstat -- <路径>`
- **前置**：`git` 可用；至少一次提交触及 `agents/` 或 `tools/docgen/`。
- **步骤**：① 跑 `git log -1 --numstat --format= -- agents/ tools/docgen/`；② 断输出非空、可解析；③ 断行数和 > 0。
- **预期**：命令可跑、行数 > 0。
- **判据**：
  ```js
  const out = execFileSync('git', ['log', '-1', '--numstat', '--format=', '--', 'agents/', 'tools/docgen/'], { cwd: REPO, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter(Boolean);
  assert.ok(out.length > 0, '必须取到「最近一次触及 agents/ 或 tools/docgen/ 的提交」的 numstat（§8 步 2 :191）');
  const nums = out.map((l) => Number(l.split('\t')[0])).filter((n) => Number.isFinite(n));
  assert.ok(nums.length > 0, 'numstat 行必须可解析出新增行数');
  assert.ok(nums.reduce((a, b) => a + b, 0) > 0, '单席改动行数必须 > 0（否则工期公式无输入）');
  ```
- **对应测试**：同上
- **不覆盖**：×14 + 20% 的算术（数字由实测产生）。

### S4-TC-I01 D6 三条证据逐条可核（`registeredIds` 不提前切换）

- **覆盖**：spec §10-D6 `:219` / §11-2 `:232` / §3 `:69`（反向零 import）/ PRD `:310`
- **来源**：spec 推导 + 实现观察（补充）：证据② 实测 2 处命中且皆为注释（事实 6，与 D6 同形）
- **前置**：`tools/observation-check/` 非空；15 卡有 `checkItems`。
- **步骤**：① 域不同（`REGISTERED_IDS` 与 15 卡 id 并集交集空）；② `CHECK_ITEMS` 无导出载体（命中行全注释、无 `export`）；③ observation-check 不 import card-model。
- **预期**：三条成立 → D6「不做假切换」有事实基础。
- **判据**：
  ```js
  const OC_DIR = join(REPO, 'tools/observation-check');
  const ocFiles = walkFiles(OC_DIR);
  assert.ok(ocFiles.length > 0, 'observation-check 目录不得为空');
  const ridSrc = readFileSync(join(OC_DIR, 'registered-ids.mjs'), 'utf8');
  const m = /REGISTERED_IDS\s*=\s*\[([^\]]*)\]/.exec(ridSrc);
  assert.ok(m, 'registered-ids.mjs 必须有 REGISTERED_IDS 常量');
  const regIds = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  assert.ok(regIds.length > 0, 'REGISTERED_IDS 不得为空（否则域比较恒真）');
  const cardIds = PIPE.buildCards().flatMap((b) => (b.card.checkItems ?? []).map((i) => i.id));
  assert.ok(cardIds.length > 0, '15 卡的 checkItems 并集不得为空');
  assert.equal(cardIds.some((id) => regIds.includes(id)), false, `两集合必须不同域（交集须为空，§10-D6 :219 ①）：${cardIds.filter((id) => regIds.includes(id)).join(',')}`);
  const ocSrc = ocFiles.map((p) => readFileSync(p, 'utf8')).join('\n');
  const codeLines = ocSrc.split(/\r?\n/).filter((l) => l.includes('CHECK_ITEMS') && !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  assert.deepEqual(codeLines, [], `CHECK_ITEMS 只允许出现在注释里（无导出载体，§10-D6 ②）：${codeLines.slice(0, 3).join(' | ')}`);
  assert.equal(/export\s+(?:const|function)\s+CHECK_ITEMS/.test(ocSrc), false, '不得存在 CHECK_ITEMS 导出');
  assert.equal(/from\s+['"][^'"]*card-model/.test(ocSrc), false, 'observation-check 不得 import card-model（§3 :69 反向零 import）');
  ```
- **对应测试**：同上
- **不覆盖**：D6 的处置（转 `docs/after/` 登记）——文档面，见 I02。

### S4-TC-I02 `registered-ids.mjs` 与本段零接触（常量值 + HEAD 无 diff）

- **覆盖**：spec §10-D6 `:219` / §11-1 `:231` / §2-2 `:28`
- **来源**：spec 推导 + 实现观察（补充）：**直接判据 = 常量实值不变**（提交后 `git status` 必空，不能当零接触判据）
- **前置**：`git` 可用。
- **步骤**：① 断 `REGISTERED_IDS` 逐字等于 `['k01','k02','k03']`；② 断 `git diff --quiet HEAD -- tools/observation-check/` 退出 0；③ 断 `render.mjs` 仍在。
- **预期**：值不变 + 无 diff + 文件在。
- **判据**：
  ```js
  const ridSrc = readFileSync(join(REPO, 'tools/observation-check/registered-ids.mjs'), 'utf8');
  const m = /REGISTERED_IDS\s*=\s*\[([^\]]*)\]/.exec(ridSrc);
  assert.ok(m, 'registered-ids.mjs 必须有 REGISTERED_IDS 常量');
  const ids = [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
  assert.deepEqual(ids, ['k01', 'k02', 'k03'], `常量值必须逐字不变（零接触的直接判据；实得 ${ids.join(',')}）`);
  let clean = true;
  try { execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'tools/observation-check/'], { cwd: REPO }); } catch { clean = false; }
  assert.equal(clean, true, '本段不得对 tools/observation-check/ 产生任何 HEAD 差异（§10-D6 :219）');
  assert.equal(existsSync(join(REPO, 'tools/observation-check/render.mjs')), true, 'S2 的 render.mjs 本段不得删除（§11-1 :231）');
  ```
- **对应测试**：同上
- **不覆盖**：历史差异（只看 HEAD 相对工作区）。

### S4-TC-I03 `registeredIdsOf([本席 card])` = 本席 `checkItems[].id` 并集（产物侧 id 从常量派生）

- **覆盖**：spec §4 `:95`（`registeredIdsOf(cards)`，传**本席刚合并的 card 单元素数组**；与 S1 §6 `:154` 同义）/ S1 §6 `:154`
- **来源**：spec 推导
- **前置**：`CM.registeredIdsOf` 为函数；至少一席有 `checkItems`。
- **步骤**：① 断入口是函数；② `registeredIdsOf([card])` 与 `checkItems[].id` 去重集逐项相等；③ 产物侧 id 从 `REGISTERED_IDS` 派生（不写死），断两域无交集。
- **预期**：逐项相等、两域不混。
- **判据**：
  ```js
  assert.equal(typeof CM.registeredIdsOf, 'function', 'registeredIdsOf 必须是函数（S1 出口面）');
  const b = PIPE.buildCards().find((x) => (x.card.checkItems ?? []).length > 0);
  assert.ok(b && b.card, '至少一席必须有 checkItems（否则本用例空转）');
  const derived = [...CM.registeredIdsOf([b.card])].sort();
  const expect = [...new Set(b.card.checkItems.map((i) => i.id))].sort();
  assert.ok(expect.length > 0, '期望集不得为空');
  assert.deepEqual(derived, expect, `${b.seat} 的 registeredIds 必须 = 本席 checkItems 并集（§4 :95）`);
  const regSrc = readFileSync(join(REPO, 'tools/observation-check/registered-ids.mjs'), 'utf8');
  const pid = [...((/REGISTERED_IDS\s*=\s*\[([^\]]*)\]/.exec(regSrc)?.[1] ?? '')).matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
  assert.ok(pid.length > 0, '产物侧 id 必须能从 REGISTERED_IDS 派生出非空集（不写死）');
  assert.equal(derived.some((id) => pid.includes(id)), false, `派生集不得混入产物侧 id（实得 ${derived.filter((id) => pid.includes(id)).join(',')}）`);
  ```
- **对应测试**：同上
- **不覆盖**：该值**不喂** observation-check（I01 ③ + I02）。

### S4-TC-I04 数据源单向：`renderCard` / `cardPipeline` 无 `readFileSync` / `AGENTS_DIR`

- **覆盖**：V-6 / spec §3 `:73`（数据源单向）/ F-23
- **来源**：spec 推导
- **前置**：三个渲染模块已落。
- **步骤**：① 读两个模块源码断不含 `readFileSync`/`readdirSync`/`AGENTS_DIR`；② 副本内给 `renderCard.mjs` 注入 `readFileSync` → 同形扫描命中；③ 断 gate 侧（`cli.mjs`）**允许**读 `agents/`（对照面）。
- **预期**：渲染侧 0、变异命中、gate 允许。
- **判据**：
  ```js
  const RC = readFileSync(join(REPO, 'tools/docgen/components/renderCard.mjs'), 'utf8');
  const PL = readFileSync(join(REPO, 'tools/docgen/components/cardPipeline.mjs'), 'utf8');
  assert.ok(RC.length > 0 && PL.length > 0, '两个渲染模块必须已落（否则本用例空转）');
  const scan = (src) => ['readFileSync', 'readdirSync', 'AGENTS_DIR'].filter((w) => src.includes(w));
  assert.deepEqual(scan(RC), [], `renderCard 不得读 agents/（V-6 / §3 :73），实得 ${scan(RC).join(',')}`);
  assert.deepEqual(scan(PL), [], `cardPipeline 不得读 agents/（V-6），实得 ${scan(PL).join(',')}`);
  const CLI = readFileSync(join(REPO, 'tools/docgen/cli.mjs'), 'utf8');
  assert.ok(CLI.includes('AGENTS_DIR') && CLI.includes('readFileSync'), 'gate 侧（cli.mjs）必须仍读 agents/ 作比对（对照面）');
  const hits = coldRepo({ mutate: (copy) => {
    const p = join(copy, 'tools/docgen/components/renderCard.mjs');
    writeFileSync(p, `${readFileSync(p, 'utf8')}\nimport { readFileSync as __rf } from 'node:fs';\n`, 'utf8');
  }, args: ['gate'], verify: (copy) => {
    const src = readFileSync(join(copy, 'tools/docgen/components/renderCard.mjs'), 'utf8');
    assert.ok(scan(src).length > 0, '注入 readFileSync 后扫描必须命中（否则探针面写错 → I04 是假绿）');
  } });
  assert.ok(hits.code === 0 || hits.code === 1, '副本 gate 只要跑完即可（本用例判扫描命中）');
  ```
- **对应测试**：同上
- **不覆盖**：动态 `import()` 拼串 / `createRequire` 绕过（残余风险）。

### S4-TC-J01 渲染确定性：两次结果相等、无时间戳/绝对路径、无 CRLF/BOM

- **覆盖**：spec §3 `:70`（装配唯一入口）/ §7① `:179`（写盘侧不做换行转换）/ §0.2-5
- **来源**：spec 推导
- **前置**：`RS()` 可用。
- **步骤**：① 两次 `renderSeat` 三串 `deepEqual`；② 断无 ISO 时间戳、无绝对路径、无反斜杠；③ 断无 CR、无 BOM；④ 两次 `renderAll` cards 数相等。
- **预期**：四条全过。
- **判据**：
  ```js
  const s = SEATS[0];
  const a = RS(s), b = RS(s);
  assert.deepEqual(a, b, '两次 renderSeat 必须逐字相等（幂等 / 无随机 / 无时间戳）');
  assert.equal(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(a.card + a.readme), false, '卡面 / README 不得含 ISO 时间戳');
  assert.equal(a.card.includes(REPO) || a.readme.includes(REPO), false, `卡面 / README 不得含本机绝对路径 ${REPO}`);
  assert.equal(a.card.includes('\\'), false, '卡面不得含 Windows 反斜杠路径（跨平台不可比）');
  for (const x of [a.card, a.readme]) {
    assert.equal(x.includes('\r'), false, '渲染产物换行必须是 \\n（无 CR；写盘侧不做换行转换，§7① :179）');
    assert.equal(x.startsWith('\uFEFF'), false, '渲染产物不得带 BOM（首字符 U+FEFF）');
  }
  const r1 = ALL(), r2 = ALL();
  assert.equal(r1.cards.length, r2.cards.length, '两次 renderAll 的 cards 数必须相等');
  ```
- **对应测试**：同上
- **不覆盖**：磁盘既有文件被 CRLF 化（由 F01 逐字节断言先红）。

### S4-TC-J02 写盘后无 `.part` / `tmp` 残留

- **覆盖**：spec §7① `:179` + §3 `:71`（逐文件 `.tmp-<pid>` → 全部成功再 rename；失败清 tmp）/ §0.2-8
- **来源**：spec 推导
- **前置**：③ 段已做过一次 `generate --readme --apply`。
- **步骤**：① 跑 `git status --porcelain --untracked-files=all`；② 只筛 `.part` / `.tmp*`；③ 断为空；④ 静态断 `writeAll` 含 `.tmp-`。
- **预期**：0 残留。
- **判据**：
  ```js
  const st = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: REPO, encoding: 'utf8' });
  const stray = st.split(/\r?\n/).filter(Boolean).filter((l) => /\.part(\.|$)|\btmp\b|\btmp-/.test(l));
  assert.deepEqual(stray, [], `写盘后不得残留 tmp / .part（§7① :179）：${stray.slice(0, 5).join(' | ')}`);
  const WA = readFileSync(join(REPO, 'tools/docgen/components/cardPipeline.mjs'), 'utf8');
  assert.ok(WA.length > 0, 'cardPipeline.mjs 必须已落（§3 :71）');
  assert.ok(WA.includes('.tmp-'), 'writeAll 的临时文件命名必须含 `.tmp-<pid>` 形态（§3 :71②）');
  ```
- **对应测试**：同上
- **不覆盖**：正常新增文件（`docs/agents/**` 未提交时是 untracked，但不匹配本筛选）。

### S4-TC-J03 `docs/agents/**` 不触发 `UnregisteredHandwritten`，且恰 = 席数 + index

- **覆盖**：spec §10-D2 `:215`（README 落 `docs/agents/` 的理由）/ `tools/docgen/cli.mjs`（只扫 `agents/`）/ F-10
- **来源**：spec 推导 + 实现观察（补充）：`UnregisteredHandwritten` 只扫 `AGENTS_DIR`
- **前置**：`docs/agents/` 已生成。
- **步骤**：① 断目录内 `.md` = 席数 + 1；② 跑 `gate` 断 exit 0 + `baseline N/N`；③ 断 `agents/` 无野文件。
- **预期**：目录数对、gate 绿。
- **判据**：
  ```js
  const docs = readdirSync(DOC_AGENTS_DIR).filter((f) => f.endsWith('.md'));
  assert.equal(docs.length, SEATS.length + 1, `docs/agents 必须恰 = 席数 + index（实得 ${docs.length}）`);
  const r = runCli(['gate']);
  assert.equal(r.code, 0, `docs/agents 是生成物落点，不得触发 UnregisteredHandwritten（gate 实得 ${r.code}）：${r.out.slice(0, 300)}`);
  assert.match(r.out, /baseline\s+\d+\/\d+/, 'gate 必须打印 baseline N/N（check-all.mjs依赖）');
  assert.deepEqual(CARD_FILES.filter((s) => !SEATS.includes(s)), [], `agents/ 下不得有未登记的 .md：${CARD_FILES.filter((s) => !SEATS.includes(s)).join(',')}`);
  ```
- **对应测试**：同上
- **不覆盖**：`docs/agents/` 的目录约定（J04）。

### S4-TC-J04 `docs-convention` 同批补一行 + `scope-sweep --check` exit 0

- **覆盖**：spec §10-D2 `:215`（同批改 `rules/docs-convention.md`）/ §12-R6 `:245`（R8 改判回扫）/ PRD `:280` 称谓口径
- **来源**：spec 推导
- **前置**：`rules/docs-convention.md` 与 `scripts/scope-sweep.mjs` 存在（实测均在）。
- **步骤**：① 断规则含 `docs/agents`；② 跑 `node scripts/scope-sweep.mjs --check` 断 exit 0 + 末行 `sweep ok`。
- **预期**：规则补一行；回扫绿。
- **判据**：
  ```js
  const conv = readFileSync(join(REPO, 'rules/docs-convention.md'), 'utf8');
  assert.ok(conv.includes('docs/agents'), 'D2 :215：docs-convention 目录表必须同批补 docs/agents/ 一行（否则规则与目录两处说法）');
  const sw = runNode(['scripts/scope-sweep.mjs', '--check']);
  assert.equal(sw.code, 0, `R8 改判回扫必须 exit 0（实得 ${sw.code}）：${sw.out.slice(0, 300)}`);
  assert.match(sw.out, /sweep ok/, '末行必须是 sweep ok（判据只认退出码与末行）');
  ```
- **对应测试**：同上
- **不覆盖**：`npm run doc:sweep -- --check` 的假绿机理（规则已登记勘误）。

### S4-TC-K01 D1 / D5 的上游同批改在位（PRD §3.7 段表 7 段 + `:293` 省略号 0）

- **覆盖**：spec §10-D1 `:214`（段表 6→7：**表内插行**，判据 = 段表行数 6→7）/ §10-D5 `:218`（收敛 PRD `:293` 的 `'…'`）
- **来源**：spec 推导（判据两端 = PRD 原文 vs spec 的同批改承诺）
- **前置**：PRD 可读。
- **步骤**：① 定位 PRD §3.7 标题，向下数段表行（去分隔行）；② 断行数 = **8**（表头 + 7 段）且含「输出格式」；③ 断 `:293` 行不含 `…`。
- **预期**：段表 7 段、含「输出格式」、省略号 0。
- **判据**：
  ```js
  const prd = readFileSync(PRD_PATH, 'utf8');
  assert.ok(prd.length > 0, `PRD 必须可读：${PRD_PATH}`);
  const L = prd.split(/\r?\n/);
  const h = L.findIndex((l) => /^###\s*3\.7/.test(l));
  assert.ok(h >= 0, 'PRD 必须含 §3.7 标题（D1 :214 的落点节）');
  let rows = 0, hasOut = false;
  for (let i = h + 1; i < L.length && !/^#{1,3}\s/.test(L[i]); i++) {
    const l = L[i];
    if (!l.trim().startsWith('|')) continue;
    const cells = l.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length > 0 && cells.every((c) => /^:?-{3,}/.test(c))) continue;
    rows += 1;
    if (cells.some((c) => c.includes('输出格式'))) hasOut = true;
  }
  assert.ok(rows > 0, 'PRD §3.7 段表必须存在（否则本用例空转）');
  assert.equal(rows, 8, `PRD §3.7 段表必须 = 表头 + 7 段 = 8 行（D1 :214 承诺 6→7 段），实得 ${rows}`);
  assert.equal(hasOut, true, '段表必须含「输出格式」行（D1 的「表内插行」落地，不是表外追加）');
  const l293 = L[292] ?? '';
  assert.ok(typeof l293 === 'string' && l293.length > 0, 'PRD :293 必须非空（spec D5 :218 的落点行）');
  assert.equal(l293.includes('…'), false, `PRD :293 不得再含 '…' 省略号（D5 :218），实得：${l293}`);
  ```
- **对应测试**：同上
- **不覆盖**：PRD 其它节（`:239` 的单源说明由 A07 / G05 的 spec 侧单源守）。

---

## 3 负例与边界汇总（按组）

| 组 | 用例数 | 正 | 负 | 边界 | 备注 |
|---|---|---|---|---|---|
| A（卡面七段 / Card 12 键 / 导出面） | 8 | 3 | 2 | 3 | A07 导出面恰 8 名；A08 钉 A1/A2 锚点迁「职责」；A05 按表头行定位 |
| B（三投影 / 覆盖记录） | 8 | 3 | 2 | 3 | B08 钉 reason 来源 = own；B07 stdout-only 且不调 `writeAll` |
| C（描述与称谓 / F-12） | 6 | 3 | 2 | 1 | C06 钉试点席统一为「主持人」 |
| D（输出格式段 / §6） | 5 | 2 | 2 | 1 | D03/D04 的探针命中面改为 `hitClass` |
| E（共享层 / V-3） | 5 | 2 | 2 | 1 | E01 用「判据 id 出现 1 次」 |
| F（写盘 / 门禁 / 到期 / 码表） | 10 | 3 | 6 | 1 | F02 三构造；F04 加缺文件；F05 加中期子集；**F10 = EXIT 表** |
| G（零散文 / 副本 / P-B / 契约） | 7 | 3 | 2 | 2 | G02 两源对账；G05 must/never 分判；**G07 三类反例 + 守卫**；G01 加 subject 形态 |
| H（逐席滚动 / F-11） | 3 | 1 | 0 | 2 | H01 归档副本；H03 `git log -1` |
| I（D6 / 数据源单向） | 4 | 2 | 2 | 0 | I02 常量逐字相等 + HEAD 无 diff；I03 产物侧 id 派生 |
| J（确定性 / 落点） | 4 | 1 | 0 | 3 | J01 加无 CR/BOM；J03/J04 是 D2 两面 |
| K（上游同批守卫 / D1·D5） | 1 | 0 | 0 | 1 | **K01**：PRD 段表 7 段 + `:293` 无省略号 |
| **合计** | **61** | **23** | **20** | **18** | 负+边界 **38 ≥ 正 23**；总 61 ≤ 70 |

---

## 4 第三方通道点名（硬约束 9）

| 用例 | 第三方视角的实现方式 | 为什么算「非作者构造」 |
|---|---|---|
| **A01 / A03** | 期望段名一侧从 spec §5.1 **主表**严格切，另一侧读 `MF.CARD_SEGMENTS` 与卡面 | 两端分别是上游 spec 实文与被测定义层；spec 改段名而不改数据 → 断言先红 |
| **A05** | 表头 / A4 / A5 三串从 `specLine(134)` 正则切 | 判据由 spec 原文裁决，模板常量无从单方变绿 |
| **A07** | 期望导出名从 spec §3 `:58-65` 的「导出」列切，另一端读运行时 + 静态 export 面 | 两处漂移立刻可见 |
| **A08** | 一端是 `cli.mjs` 的 `touchedSemanticKeys`（既有实现），一端是 §10-D11 的段名承诺 | 判据两端都不属本文件 |
| **A04** | 结构项判据来自已签 `tools/execution-matrix/check-agent.mjs`（`checkStruct` 覆盖 89–123 行） | 判定方是既有已签实现 |
| **E01** | 「判据 id 在共享层源码出现次数 = 1」+「至少被一席渲染」 | 一端源码文本、一端 15 份产物 |
| **G02** | 旧段名/声明句式切 spec §5.1 表；**指针词切 S1 §7 `:188`**；另一端读 `PROSE_PROBES` | 词表两端都来自上游签字件，改词必须同批改上游 |
| **G07** | 反例串取每类首个探针；守卫串取 S1 `card-model.test.mjs:1085` 同口径合法词 | 素材由被测常量与已签测试提供 |
| **I01** | 一端读 `tools/observation-check/**`（S2 已签产物），一端读 15 卡并集 | 两端互不隶属 |
| **F07** | 常量端 `card-exempt.mjs`（S3 已签），另一端 `check-all.mjs` 的插值形态 | 两文件都不属本段新写 |
| **F10** | 码集端 `CM.CARD_MODEL_CODES`（S1），另一端 `validateAgentData.mjs` 的 `EXIT` 表 | 判据 = S1 码集 × 既有映射表 |
| **C06** | 判别力样例取自仓内真实旧卡（实测 议长1 / 主持人7） | 样例由既有产物提供 |
| **J04** | 回扫判据只认 `scripts/scope-sweep.mjs` 的退出码 + 末行 | 判据是既有脚本的机械输出 |
| **K01** | 一端读 PRD §3.7 原文（行数 / 省略号），另一端读 spec §10-D1/D5 的承诺 | 判据 = 上游签字件 × 本 spec 的同批改承诺 |

---

## 5 只手动验证（不进 `node --test`）

| # | 项 | 为什么不能机器判 | 谁来兜 + 落点 |
|---|---|---|---|
| 1 | 卡面 / README 文案可读性 | 语义判断 | 议会测试评委 + 人读走查（PRD §3.7） |
| 2 | 覆盖记录 `reason` 是否站得住 | 语义蕴含 | 审计席抽查（README 覆盖表 + `open` 一条） |
| 3 | 「散文搬落点」是否句句到位（R3 的语义面） | 无语义等价判据 | 议会 + 试点对照稿（§8 步 1）逐段对照 |
| 4 | 实跑 `npm run check` 看 `[豁免窗口] … EXPIRY_LANDED=true` 行 | 全仓 1000+ 测试，进单元测试会变慢测 | 交付前人工跑一次，把该行贴进 `gate-record.md` 的「核了什么」列（F07 只做静态 + 常量 + 注入） |
| 5 | `.session/reviews/<次>/pilot-contrast.md` 这份**工作副本** | `.session/` 不进 git，常驻测试只能断归档副本 | 试点当场人工核；归档副本由 H01 机器判 |
| 6 | `state.json` 里「本段之前就已 replaced」的历史成因 | 与 S4 无关（事实 8） | 审计在交接材料里写明「该值非本段首置」 |

---

## 6 不测（带理由与去向）

| 不测项 | 理由与去向 |
|---|---|
| `tools/docgen/card-model/**` 的 36 码语义 | spec §2-1 `:27` 零改动；S1 testcase 58 条已覆盖（G01 只判「15 张新卡零 errors + 码表仍 36」） |
| `tools/observation-check/**` 的校验链 | spec §2-2 `:28`；I01/I02 只判「零接触 + 三条证据」 |
| `tools/docgen/policy/**`（S6 已签） | spec §2-3 `:29`；`tools` 仍由 `patternRegistry.toolsForSeat()` 派生 |
| A 组语义项 A1/A2 + B/C 组 10 键 | 走 `rules/.inspector-annotations.json` 三态接收；A08 只判**触达映射**（A1/A2 判据语义不变） |
| 议会 / 门禁新流程（F-17～F-19 / F-22 / F-24） | S3 已落地；本段只做 C-08 到期事件（F07） |
| A/B 盲评（V-13） | spec §2-6 `:32` 明写不在本期 |
| 并发写盘跨文件一致性 | §3 `:72`：只保证单文件原子，跨文件由 gate 事后比对兜住 |
| `.session/` 过程账格式 | 归 `review-log`；H01 只判归档副本 |
| 渲染性能 | 15 席量级，无性能判据（spec 不以「省工时」立论） |

---

## 7 缺口与判别力水位（只列**仍开**的；已闭合项见本节末清单）

> **编号口径**：沿用 v1 编号（不重排），避免内部与送审材料的跨引用失效。**已闭合的缺口 1 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 16 与 10 条建议已移出本表**，统一列在末段「已闭合」清单——**不得再把它们当待办**。

| # | 缺口 | 漏检哪类反例（至少 1 个样例） | 语义由谁兜 / 落点 | 优先级 |
|---|---|---|---|---|
| **缺口 10** | §8 步 1 `:190` 的**工作副本**落 `.session/reviews/<次>/`，而 `.session/` 不进 git → 该副本不可跨机复核；「试点先于其余 14 席」的**时序**仍无判据 | 试点没做直接铺 15 席（A-4 违规）→ 常驻测试只断归档副本（H01），查不出时序 | H01 断归档副本；H03 断出数命令；建议 spec 在交接材料里点名试点提交哈希；**验收 = H01 + H03** | **P2** |
| **缺口 11** | PRD §9.2 P-A 要求「S4 用**一条命令**统一副本计数」，但「交付材料」的扫描面与命令形态仍未定义 | 交付材料里手写「零散文 100%」这类新数字 → 无判据可核 | G03（席数对账）+ E01（定义次数 = 1）；建议 spec 增一条双判据命令；**验收 = E01 + G03** | **P2** |
| **缺口 12** | `renderSeat` / `renderAll` 的**入参形态**与 `writeAll(artifacts)` 的 **`artifacts` 结构**未写死；`buildEnv(seat, cards)` 的 `cards` 是否可省未写死 | C05 / G01 / G04 / G06 都要 env 调 S1 校验器；F02 无法构造「缺 reason 列的 artifacts」 | 本文件一律显式传 `buildEnv(seat, [card])` 并断 `typeof`；B08 用「own 无 reason」构造（不依赖 artifacts 形状）；建议 spec §4 补 `writeAll` 的 artifacts 形状；**验收 = G01 的 11 键断言** | **P2** |
| **缺口 13** | `outputFormats` 的 `checks[]` 元素**形状未写死**（字符串？`{id, command, expect}`？） | 施工写 `{id, cmd}` → D01 只断非空数组 + 无指针，追不到「哪条 check 对应哪条必含节」 | D01/D02 只判字符串化后的语义；建议 spec §6 `:162` 补形状；**验收 = D02 的命令正则** | **P2** |
| **缺口 14** | README 覆盖表 `changed` 列**取值形态未写死**（字段名 `landing` 还是中文「落点」） | B06 只断三列非空，无法判「changed 是否为合法字段名」 | B06 判三列非空；建议 spec §5 `:116` 补「`changed ⊆ OVERRIDABLE_FIELDS`」；**验收 = B06 加集合包含断言**（本版等口径） | **P2** |
| **缺口 15** | `SHARED_USE` 的**缺省语义**未写死：未出现在 `use` 表里的席——继承全量？还是零共享句？ | E05 按「白名单」读法断言；若施工按「默认全量 + 显式排除」，E05 会与实现冲突 | E05 按白名单写；建议 spec §4 `:91` / §3 `:65` 补「`use` 是白名单，缺省 = 无共享句」；**验收 = E05 末条** | **P2** |

**已闭合（spec v2 / v3 / v4 已写死，本文件不再当缺口；留编号只为可追溯）**

| 原缺口 | 闭合来源 | 本文件哪条用例守 |
|---|---|---|
| 缺口 1（4 个 `vocab/` 表导出名 / 形状） | v2 §3 `:58-65`；**v3 起 8 个名字（含 `PROSE_PROBES`）** | **A07** + A01 / E01 / E05 / G05 |
| 缺口 2（`overrides[]` 不带 `reason`） | v2 §5 `:119`（pipeline 从 own join） | **B05 + B08** |
| 缺口 3（写盘入口未点名） | v2 §3 `:71`（`writeAll` 只是三处共用实现；`generate` 只比不写 / `dump` 不调 / `gate` 只读） | **F01 / F02 / J02 / B07** |
| 缺口 6（零散文探针词表未写死） | v3 §3 `:62`（`PROSE_PROBES`）+ §5.1 `:137-145` | **G02 + G07** |
| 缺口 16（`PROSE_PROBES` 分组键名 / 元素类型） | v3 §3 `:62`（`{ oldSegments: string[], declaration: (string\|RegExp)[], pointers: string[] }`） | **G02 ① + G07** |
| 缺口 7（称谓判定面只写卡面） | v4 §5.2 `:154`（试点席「原样搬即红」） | **C04 / C05 / C06** |
| 缺口 8（D6 证据②「= 0」与实测不符） | v4 §10-D6 `:219`（2 处注释、无 `export` 载体） | **I01** ② |
| 缺口 9（旧模板扫描面未定义） | v4 §7⑥ `:184`（两处判据 + `sourceLine` 随删） | **F08 + F09** |
| 缺口 4（16 vs 31 计数口径） | v4 §1 `:20`（两数口径明写） | **F02 / F04**（派生式） |
| 缺口 5（「首行」与实现不符） | v4 §7⑤ `:183`（「输出中含该行」+ 注入用例） | **F07** |

---

## 8 给开发的建议（只写建议，不动手；已采纳项标「已采纳」，不计待办）

| # | 位置（文件 / spec 节） | 风险或盲点 | 为什么会被忽略 | 具体改法 | 优先级 |
|---|---|---|---|---|---|
| 1 | spec §3 `:58-65` | 4 个 `vocab/` 表导出名 / 形状 | 「数据放哪个文件」写了，「怎么导出」没人写 | **【v2 已采纳；v3 加 `PROSE_PROBES` 共 8 名】** 守方 = A07 + A01 / E01 / E05 | — |
| 2 | spec §5 `:119` | `overrides[]` 不带 `reason` | 容易以为 reason 自然带出 | **【v2 已采纳】** 写死「从 own 条目 join；三列缺一拒渲染」；守方 = B05 + B08 | — |
| 3 | spec §3 `:71` | 写盘入口与授权链 | 「行为写了、入口没写」→ 施工会顺手让 `generate` 写盘 | **【v2 已采纳；v4 明确授权链不变】** `writeAll` 只是 `draft`/`replace`/`generate --readme --apply` 共用；守方 = F01 / F02 / J02 / B07 | — |
| 4 | spec §5.1 `:137-145` | 零散文探针词表 | 「零散文」听起来已被 S1 码覆盖，实际码表不扫同义散文 | **【v3 已采纳】** `PROSE_PROBES` 单源 + 三类表 + `:145` 守卫；守方 = G02 / G07；**余项（同义散文）**仍靠 G04 / A06 / B06 | **P2（余项）** |
| 5 | spec §5.2 `:155` | 机械判只写卡面 | 「`Select-String agents*.md`」看起来够机械 | **【v4 §5.2 :154 已采纳试点席面】** 守方 = C04 / C05 / C06。**余项**：`:155` 仍只写卡面，建议补「判定面 = 卡面 ∪ 渲染输入」 | **P2（余项）** |
| 6 | 试点席选择（§8 步 1 `:190`）+ `agents/detective-observer.md` | 试点席是仓内唯一混用称谓的卡 | 「试点 = 侦探席」是 PRD A-4 定的，没人查它当前是否合规 | **【v4 §5.2 :154 已采纳】** 守方 = C06 + C05 | — |
| 7 | `agents/senior-sdet.md:9` | 卡面正文写着旧模板名 | 藏在「来源」行，逐段迁移最易整段照搬 | **【v4 §7⑥ :184 已采纳】** 要求 `sourceLine` 随旧模板删；守方 = F08 ③④ | — |
| 8 | `scripts/check-all.mjs:418` | 「首行」与实现不符 | spec 与实现各写一次 | **【v4 §7⑤ :183 已采纳】** 改「输出中含该行」+ 注入用例；守方 = F07 | — |
| 9 | spec §1 `:20` / §7① `:179` / §7③ `:181` | 生成物 16 vs 比对面 31 | 两个数字都在 spec 里，读者容易只看一处 | **【v4 §1 :20 已采纳】** 明写两数口径；守方 = F02 / F04 派生式 | — |
| 10 | spec §10-D6 `:219` | 「= 0」与实测 2 处注释不符 | 结论对（无导出载体），证据写法没人复核 | **【v4 已采纳】** 改成「2 处命中、均为注释、无 `export` 载体」；守方 = I01 ② | — |
| 11 | spec §7⑥ `:184` | 「全仓扫描 = 0」扫描面未定义 | 「历史文档除外」被当成「其余全扫」 | **【v4 已采纳】** 收窄为「`templates/` 存在性 + `tools/docgen/**/*.mjs` 代码引用」；守方 = F08 / F09 | — |
| 12 | spec §8 步 1 `:190` | 工作副本落 `.session/` 不可跨机复核 | `.session/` 规则在 `docs-convention` 里，写 spec 时没回看 | **【v4 已采纳归档副本】** 同时落 `docs/reports/2026-10-30-agent-card-s4-pilot-contrast.md`；守方 = H01；**余项**：试点时序（缺口 10） | **P2（余项）** |
| 13 | spec §4 `:82` / `:95` | `buildEnv` 入参 `cards` / `writeAll` 的 `artifacts` 形状未写死（缺口 12） | 「装配唯一入口」写了 `renderAll/renderSeat`，但测试侧要 env 才能调 S1 校验器 | 补「`buildEnv(seat, cards)` 的 `cards` 必传（单元素数组 = 本席）」+ `writeAll` 的 artifacts 形状；**验收** = G01 的 11 键断言 | **P2** |
| 14 | spec §6 `:162` | `checks[]` 元素形状未写死（缺口 13） | 结构化合同外层写死了、内层没有 | 补 `checks[] = { id, command, failsWhen }`；**验收** = D02 命令正则 | **P2** |
| 15 | spec §5 `:116` | 覆盖表 `changed` 取值形态未写死（缺口 14） | 「changed 字段」读起来像已经定了 | 补「`changed ⊆ OVERRIDABLE_FIELDS` 的字段名」；**验收** = B06 加集合包含断言 | **P2** |
| 16 | spec §3 `:65` / §4 `:91` | `SHARED_USE` 缺省语义未写死（缺口 15） | 「先取 `use` 列出的 id」读起来就是白名单，但没人写「缺席 = 0」 | 补「`use` 是白名单；未出现的席不合并任何共享句」；**验收** = E05 末条 | **P2** |
| 17 | `tools/docgen/cli.mjs:104-112` + `state.json` | `collectGate` 只比对 `replaced` 席、不校验完整性 → 新增断言易写成「只断当前值」 | 「已全 replaced」掩盖断言缺失 | **【v2/v4 已采纳】** §7④ `:182` 收口期 + 中期子集；守方 = F05（构造红）+ F06 | — |
| 18 | spec §10-D11 `:224` | A1/A2 锚点在旧段名上 → 新卡无「你是谁」段 | 改判后不补映射，改「职责」永不触发 A1 重判（annotations 恒绿） | **【v4 已采纳】** `touchedSemanticKeys` 段名表加「职责」；守方 = A08；**回扫** = J04 的 `scope-sweep` | — |
| 19 | spec §10-D12 `:225` | S1 码未接 `EXIT` 表 → 接 CLI 即落 exit 2（或抛未知码） | S1 交付时未接 CLI，映射表「不动」被读成「不用补」 | **【v4 已采纳】** 36 脚本码 + 3 合并码归 1、`WeakReason` 不入表；守方 = F10 | — |

---

## 9 计数声明（可复算）

**A. 计数命令（仓库根执行，PowerShell；**必须按节切片**——§1 覆盖总表与附录 A 的首列都是用例 ID，不切片会算成两倍）**

```powershell
$f  = 'docs/superpowers/specs/2026-10-29-agent-card-s4-render-design-testcase.md'
$c  = Get-Content $f
$h1 = ($c | Select-String '^## 1 覆盖总表').LineNumber
$h2 = ($c | Select-String '^## 2 用例明细').LineNumber
$hA = ($c | Select-String '^## 附录 A').LineNumber
$cov = $c[($h1-1)..($h2-2)]
$app = $c[($hA-1)..($c.Count-1)]
# ① 用例条数（标题计数）
($c | Select-String '^### S4-TC-').Count
# ② 类型分布（§1 表第 4 列）+ 行数 + 去重
$ids  = $cov | Select-String '^\| (S4-TC-[A-Z][0-9]+) \|' | ForEach-Object { $_.Matches[0].Groups[1].Value }
$pos  = ($cov | Select-String '^\| S4-TC-[A-Z][0-9]+ \| .*\| 正 \|').Count
$neg  = ($cov | Select-String '^\| S4-TC-[A-Z][0-9]+ \| .*\| 负 \|').Count
$edge = ($cov | Select-String '^\| S4-TC-[A-Z][0-9]+ \| .*\| 边界 \|').Count
"rows $($ids.Count) pos $pos neg $neg edge $edge dupe $($ids.Count-($ids|Select-Object -Unique).Count)"
# ③ 「前置」行数（五要素第 3 项）
($c | Select-String '^- \*\*前置\*\*').Count
# ④ 附录 A 行数 + 与 §1 的 ID 集双向差集
$apids = $app | Select-String '^\| (S4-TC-[A-Z][0-9]+) \|' | ForEach-Object { $_.Matches[0].Groups[1].Value }
"appendix $($apids.Count) onlyCov $(($ids | Where-Object { $apids -notcontains $_ }).Count) onlyApp $(($apids | Where-Object { $ids -notcontains $_ }).Count)"
# ⑤ 上游门禁（条数单源）：tc ≤ 80
node scripts/check-plan.mjs size --spec docs/superpowers/specs/2026-10-29-agent-card-s4-render-design.md --testcase $f --rounds 3
```

**B. 实测输出（2026-10-29，本文件 **v4** 定稿时跑；命令即上方 ①～⑤ 原样）**

```text
titles 61
rows 61 pos 23 neg 20 edge 18 dupe 0
premises 61
appendix 61 onlyCov 0 onlyApp 0
size: spec 245/350 tc 61/80 rounds 3/3 => ok
```

> 说明：`rows` 只扫 §1 表（首列 = 用例 ID、第 4 列 = 类型），`titles` 扫 `### S4-TC-` 标题，`premises` 扫 `- **前置**` 行，三者必须相等；`dupe 0` 表示 §1 内无重复 ID，`onlyCov 0 / onlyApp 0` 表示 §1 与附录 A 双向相等。**本文件刻意避免「首列 = `F-09`」这类非用例 ID 的行**——`scripts/check-plan.mjs:229` 的载体正则会把 `| F-09 |` 当成用例 ID；F 对位 / 验收对位因此写成段首加粗列表。**计数变化（四版）**：54 → 57（v2：A07/B08/C06）→ 58（v3：G07）→ **61**（v4：A08/F10/K01），其余用例只改断言与锚点、类型列仅在 A02 之外无变动（A02 仍为负）。

**C. 结论**

| 项 | 值 | 是否满足硬约束 |
|---|---|---|
| 用例总数 | **61** | ≤ 70 ✔（`TC_MAX 80` 留 19 条余量） |
| 正例 | **23** | — |
| 负例 | **20** | — |
| 边界 | **18** | — |
| 负 + 边界 ≥ 正 | **38 ≥ 23** | ✔ |
| 覆盖总表行数 | **61**（与条数相等，逐行有 ID） | ✔ |
| 五要素齐（覆盖 / 前置 / 步骤 / 预期 / 判据） | **61 / 61** | ✔（`premises 61` = `titles 61`） |
| 附录 A 映射行数 | **61** | ✔（一行一个用例 ID，无「F 对位」类额外行） |
| V-1～V-8 逐项有承载用例 | 8 / 8 | ✔（§1 末「验收对位」） |
| F-09 / F-10 / F-11 / F-12 / F-23 各有正向用例 | 5 / 5 | ✔（§1 末「F 对位」） |
| v2/v3/v4 变化逐条有落点 | 7 + 2 + 15 | ✔（文件头 v4 增量说明逐条列承载用例） |

**D. 自检（`rules/spec-testcase-gate.md` 五条判据）**

| # | 判据 | 结论 | 证据 |
|---|---|---|---|
| 1 | 文件存在（同目录、命名 = spec 文件名 + `-testcase.md`） | 过 | 本文件路径 |
| 2 | 编写者独立（`senior-sdet` 全新上下文，≠ spec 作者 ≠ 施工者）+ 文件头声明 | 过 | 文件头第 5–6 行 |
| 3 | 五要素齐；负+边界 ≥ 正；覆盖总表每行指回 spec 编号 | 过 | §2 每条 6 字段；§1 每行带 § / V / F 编号（行号按 spec **v4 实文 245 行**）；计数见 C |
| 4 | spec 外链在位，spec 不内联用例 | 过 | spec 头部第 8 行写「测试用例文件：…」；spec 全文无用例表 |
| 5 | 与 spec 一起送审 | 待送审时执行 | 议会开评时核 |

**E. spec 是否仍需回流修订**：**仍有 6 条开项，全部 P2、P0 = 0、P1 = 0**（缺口 10 / 11 / 12 / 13 / 14 / 15，均为「写了行为、没写落点」的文本级补写）。**已闭合 10 条**（缺口 1/2/3/6/16 于 v2/v3；缺口 7/8/9 于 v2-v4；缺口 4/5 于 v4）→ 已移入 §7 末「已闭合」清单，§8 对应行标「已采纳」，**不再当待办**。

---

## 附录 A 用例 ↔ spec 节号 / F 编号 映射

| 用例 ID | spec 节号 | F 编号 | 类型 | 一句话场景 |
|---|---|---|---|---|
| S4-TC-A01 | §5.1 `:123-132` / §3 `:62` / V-1 | F-09 | 正 | 15 卡 7 段齐（段名从 spec 主表严格切） |
| S4-TC-A02 | §4 `:89` / §4 `:98` / V-1 | F-09 | 负 | `Card` 12 键逐键删除 → 12 次经 S1 入口被拒 |
| S4-TC-A03 | §5.1 `:123-132` / §3 `:62` / V-1 | F-09 | 边界 | 段名/段序相等；多段 / 删第 4 段 / 换序各红 |
| S4-TC-A04 | §5.1 `:134` / §2-4 `:30` / V-1 | F-09 | 正 | A3–A7 结构项全绿 |
| S4-TC-A05 | §5.1 `:134` / V-1 | F-09 | 负 | 四变异各只红一码（按表头行定位） |
| S4-TC-A06 | §5.1 `:135` / PRD `:223` | F-09 | 边界 | `rationale` 只在 README、不进卡面 |
| S4-TC-A07 | §3 `:58-65` / V-1 | F-09 | 边界 | `vocab/` 导出面恰 8 名（含 `PROSE_PROBES`） |
| S4-TC-A08 | §10-D11 `:224` / §2-4 `:30` | F-09 | 正 | `touchedSemanticKeys` 认「职责」段 |
| S4-TC-B01 | §5 `:112-117` / V-2 | F-10 | 正 | 三投影对同一字段逐字一致（`name` = dump.name） |
| S4-TC-B02 | §5 `:112-117` / V-2 | F-10 | 正 | 改数据 1 处 → README / dump 跟随 |
| S4-TC-B03 | §3 `:53-55` / §5 `:116` / V-2 | F-10 | 正 | 15 份 README + index 15 行 |
| S4-TC-B04 | §3 `:54` | F-10 | 边界 | index 表头五列齐 |
| S4-TC-B05 | §5 `:116` / §5 `:119` / V-3 | F-10 | 负 | `overrides[]` 每条带 reason |
| S4-TC-B06 | §5 `:116` / V-3 | F-10 | 边界 | 覆盖表行数 = overrides 条数 |
| S4-TC-B07 | §5 `:117` / §3 `:71` / PRD `:225` | F-10 / F-23 | 边界 | dump stdout-only、不调 `writeAll` |
| S4-TC-B08 | §5 `:119` / V-3 | F-10 | 负 | reason 取自 own；无 reason 拒绝渲染 |
| S4-TC-C01 | §5.2 `:151` / §10-D3 `:216` | F-12 | 正 | description = trigger.when 直出 |
| S4-TC-C02 | §5.2 `:151` | F-12 | 边界 | `notWhen.text` 两形态 |
| S4-TC-C03 | §5.2 `:153` / PRD `:280` | F-12 | 正 | 非议会席 0 命中「议长/主持人」 |
| S4-TC-C04 | §5.2 `:155` | F-12 | 负 | 非议会席数据塞「主持人」→ 红 |
| S4-TC-C05 | §5.2 `:152` / §5.2 `:154` | F-12 | 负 | 议会席混用两词必红 |
| S4-TC-C06 | §5.2 `:154` / A-5 `:56` | F-12 | 正 | 试点席「议长」= 0 且「主持人」在位 |
| S4-TC-D01 | §6 `:161-164` / §6 表 `:166-171` | F-09 | 正 | 5 个 outputKind 结构化（无散文无指针） |
| S4-TC-D02 | §6 `:171` | F-09 | 正 | `testcase` 块在位且写可执行命令 |
| S4-TC-D03 | §6 `:169` / PRD `:223` | F-09 | 负 | 输出格式段残留 doc-taxonomy 路径 → 红 |
| S4-TC-D04 | §6 `:168` | F-09 | 负 | 声明句式残留 → `declaration` 类红 |
| S4-TC-D05 | §6 `:173` | F-09 | 边界 | 不复制进席数据（同 kind 逐字相等） |
| S4-TC-E01 | §4 `:91` / V-3 / §12-R4 `:243` | F-10 | 正 | 共享句判据 id 在源码里出现 1 次 |
| S4-TC-E02 | §4 `:91` / §5 `:116` / V-3 | F-10 | 正 | 带 reason 的覆盖合法 |
| S4-TC-E03 | §4 `:91` / V-3 | F-10 | 负 | 无 reason / 零差异两码 |
| S4-TC-E04 | §12-R4 `:243` / V-3 | F-10 | 负 | 绕共享层 → `DuplicateStatement` |
| S4-TC-E05 | §4 `:91` / §3 `:65` | F-10 | 边界 | `use` 白名单 |
| S4-TC-F01 | §7① `:179` / §3 `:71` / §5 `:115` | F-23 | 正 | `generate` 只比不写；15 卡逐字节相等 |
| S4-TC-F02 | §7① `:179` / §3 `:71` / §4 `:98` | F-23 | 负 | 单席原子 + 收口零写盘 + `generate` 不写 |
| S4-TC-F03 | §7② `:180` / V-5 | F-23 | 负 | 卡面手改 1 字节 → 红（现状已生效，防回退） |
| S4-TC-F04 | §7③ `:181` / V-5 | F-23 | 负 | README 手改 / 缺文件 → 红；比对面 31 |
| S4-TC-F05 | §7④ `:182` / C-08 `:121` | F-23 | 负 | 删一席 / 中期「未迁移席却有 README」→ 红 |
| S4-TC-F06 | §7④ `:182` / C-08 `:121` | F-23 | 边界 | state 键集双向相等 + 全 replaced |
| S4-TC-F07 | §7⑤ `:183` / §10-D7 `:220` | F-23 | 正 | 豁免行在输出中（非首行）+ 注入 blockers ≥ 1 |
| S4-TC-F08 | §7⑥ `:184` / §10-D8 `:221` | F-23 / F-11 | 正 | 旧模板删除 + 代码面 0 命中 + 无 `sourceLine` |
| S4-TC-F09 | §7⑥ `:184` / D-05 `:500` | F-23 | 负 | 旧模板探针判别力（代码面注入即命中） |
| S4-TC-F10 | §4 `:98` / §10-D12 `:225` | F-23 | 负 | S1 码全 exit 1；`WeakReason` 不入表 |
| S4-TC-G01 | §5.1 `:135` / §4 `:94` / §2-1 `:27` / V-4 | F-09 | 正 | 15 卡零 errors + 码表 36 + subject `<seat>.card` |
| S4-TC-G02 | §9 V-4 `:204` / §5.1 `:139-143` / §3 `:62` | F-09 | 正 | 三类探针 0 命中（两源对账） |
| S4-TC-G03 | §1 收益行 / PRD `:576` / V-2 | F-10 | 边界 | 改共享层 1 处 → 席数 = use 引用数 |
| S4-TC-G04 | §5.1 `:135` / §12-R3 `:242` / V-4 | F-09 | 边界 | rationale 合法、duty 指针必红 |
| S4-TC-G05 | §9 V-7 `:207` / §5.1 `:127-128` / V-7 | F-09 | 正 | must 判 criterion+landing；never 只判 objects+criterion |
| S4-TC-G06 | §9 V-7 `:207` / V-7 | F-09 | 负 | P-B 负例：删 landing / 置空 criterion |
| S4-TC-G07 | §5.1 `:145` / §9 V-4 `:204` | F-09 | 负 | 三类反例各只命中本类 + 指针词守卫 |
| S4-TC-H01 | §8 步 1 `:190` / A-4 `:55` | F-11 | 边界 | 归档副本在位（`docs/reports/`），7 段对照 |
| S4-TC-H02 | §8 步 3 `:192` / PRD `:416` | F-11 | 正 | 全集口径 = 席集（派生不写死 15） |
| S4-TC-H03 | §8 步 2 `:191` / D-07 `:502` | F-11 | 边界 | `git log -1 --numstat` 可跑且行数 > 0 |
| S4-TC-I01 | §10-D6 `:219` / §11-2 `:232` / §3 `:69` | F-23 | 正 | D6 三条证据逐条可核 |
| S4-TC-I02 | §10-D6 `:219` / §11-1 `:231` / §2-2 `:28` | F-23 | 负 | 常量值不变 + HEAD 无 diff |
| S4-TC-I03 | §4 `:95` / S1 §6 `:154` | F-23 | 正 | `registeredIdsOf([本席 card])` = checkItems 并集 |
| S4-TC-I04 | §3 `:73` / V-6 | F-23 | 负 | 渲染模块不读 `agents/`；变异即命中 |
| S4-TC-J01 | §3 `:70` / §7① `:179` | F-10 | 边界 | 幂等 + 无时间戳/绝对路径 + 无 CR/BOM |
| S4-TC-J02 | §7① `:179` / §3 `:71` | F-23 | 边界 | 无 `.part`/tmp 残留；`writeAll` 含 `.tmp-` |
| S4-TC-J03 | §10-D2 `:215` | F-10 | 正 | `docs/agents/**` 不触发 `UnregisteredHandwritten` |
| S4-TC-J04 | §10-D2 `:215` / §12-R6 `:245` | F-12 | 边界 | docs-convention 补一行 + `scope-sweep` exit 0 |
| S4-TC-K01 | §10-D1 `:214` / §10-D5 `:218` | F-09 | 边界 | PRD 段表 7 段 + `:293` 无省略号 |
