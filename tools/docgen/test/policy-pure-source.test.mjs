// S6 规则单一来源化：定义层（A 组）+ 配置校验（B 组）+ 模板纯度（C 组）验收用例。
// 用例来源：docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md
// 落点：T2 = A02 / A04 / A05 / A07；T3 = A03 / B12；T4-1 = A06 / C06 / C08；
//       T4-2 = A08 / B01–B11 / B13–B15 / C03–C05 / C07 / C09（C01 / C02 归 T7：要 CLAUSES / assertNeedClauses）；A01 归 T5。
// 后续任务往本文件**追加**自己的 helper（符号名与 testcase 逐字一致），不另写第二份。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { withRepoCopy, runCli, runEsm } from './support/dev-workflow-checks.mjs';
// 唯一抽取实现（两种口径同文件）：`factsFromBaselineText` = 基线端旧卡切分 / `factsFromText` = 改造后字典匹配；
// `factsFromDump` 与抽取器同一实现（不另写第二份）、`FACTS_KEYS` = ①–④ 段 8 字段 —— 本文件只 import
import { factsFromText, factsFromBaselineText, factsFromDump, diffFacts, FACTS_KEYS, SEG5 } from './support/capability-baseline.mjs';
import { agentData } from '../components/agentData.mjs';
import { exitCodeFor } from '../components/validateAgentData.mjs';
import { BASELINE_RULES, agentPaths } from '../components/baseline.mjs';
import { patternRegistry, DEFAULT_BOUNDARY, toolsForSeat } from '../components/patternRegistry.mjs';
import * as CAP from '../policy/definitions/capabilities.mjs';
import * as CMD from '../policy/definitions/commands.mjs';
import * as PTH from '../policy/definitions/paths.mjs';
import * as ART from '../policy/definitions/artifacts.mjs';
import * as SEATS from '../policy/definitions/seats.mjs';
import { SEAT_POLICY } from '../policy/seat-policy.mjs';   // 配置层（spec §3.3）：对象键 = 席 slug，三键只持登记 ID
import { TIERS, tierOfCapabilities } from '../policy/definitions/tiers.mjs';
import { renderBoundary } from '../components/renderBoundary.mjs';

const ROOT = process.cwd();            // `node --test` 以仓库根为 cwd；不得写成测试文件相对路径
const ID = /^[a-z][a-z0-9.:-]*$/;      // = spec §3.4 归码谓词（与实现同一口径，不另造）
const sha = (s) => createHash('sha256').update(s, 'utf8').digest('hex');
// 只剥注释：配置层若用注释藏路径/命令，仍需判红 → 调用方自行决定用剥前还是剥后文本
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

function editInDir(dir, rel, fn) {
  const p = join(dir, rel);
  writeFileSync(p, fn(readFileSync(p, 'utf8')), 'utf8');
}
// withRepoCopy 的真实签名是 withRepoCopy(fn)（dev-workflow-checks.mjs:217-227，内部 finally 删副本）
// → 所有「拿副本路径」的写法一律走 withCopy((d) => { … })；不得写 `const d = withRepoCopy()`
const withCopy = (fn) => withRepoCopy(fn);
// 12 槽 / 五码的取数一律走 **CLI**（spec:161 的发射点）：覆盖 `validatePolicy` + 参数白名单 + 退出码三段，
// 并避免测试侧与生产模块同名（T4-2 裁决 1）
function dumpPolicy(dir = ROOT) {
  const r = runCli(dir, ['policy', '--dump']);
  assert.equal(r.status, 0, r.stderr);
  return { r, json: JSON.parse(r.stdout) };
}
const renderBoundaryIn = (dir, seat) => {
  const r = runEsm(dir, `import {renderBoundary} from './tools/docgen/components/renderBoundary.mjs';console.log(renderBoundary(${JSON.stringify(seat)}))`);
  assert.equal(r.status, 0, `渲染失败：${seat}\n${r.stderr}`);
  return r.stdout.replace(/\n$/, '');
};
// 递归取目录下全部文件的 sha256（path → hash）；用于「不写盘 / 只改一个文件」类断言
function dirHashes(dir) {
  const out = {};
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) Object.assign(out, dirHashes(p));
    else out[p.replace(/\\/g, '/')] = sha(readFileSync(p, 'utf8'));
  }
  return out;
}

// ---- 副本内构造：改配置某席三键 / 在定义层登记席级组（只动副本，真仓库一律不改）----
function setSeatPolicy(dir, seat, { capabilities, allowGroups, artifacts }) {
  editInDir(dir, 'tools/docgen/policy/seat-policy.mjs', (src) => {
    const key = `'${seat}'`;
    const i = src.indexOf(key);
    assert.ok(i >= 0, `配置层未见席 ${seat}`);
    const open = src.indexOf('{', i + key.length);
    let depth = 0;
    let end = -1;
    for (let p = open; p < src.length; p++) {
      if (src[p] === '{') depth++;
      else if (src[p] === '}' && --depth === 0) { end = p; break; }
    }
    assert.ok(end > open, `席 ${seat} 的配置块不闭合`);
    const body = ` capabilities: ${JSON.stringify(capabilities)}, allowGroups: ${JSON.stringify(allowGroups)}, artifacts: ${JSON.stringify(artifacts)} `;
    return `${src.slice(0, open)}{${body}}${src.slice(end + 1)}`;
  });
}
function insertInObject(dir, rel, decl, entry) {
  editInDir(dir, rel, (src) => {
    const i = src.indexOf(decl);
    assert.ok(i >= 0, `定义层未见 ${decl}（spec §3.2 布局未落？）`);
    const open = src.indexOf('{', i);
    return `${src.slice(0, open + 1)}\n  ${entry}${src.slice(open + 1)}`;
  });
}
const grantGroup = (dir, seat, group) => {
  const cur = SEAT_POLICY[seat] ?? SEAT_POLICY.__default__;
  setSeatPolicy(dir, seat, { ...cur, allowGroups: [...new Set([...cur.allowGroups, group])] });
};

// ---- 判据侧派生（禁止手抄）：路径清单全部从定义层取（testcase §0.3）----
// pathItems() = **22**（21 个数组元素 + 1 个 pattern 源串）=「定义层有几个值」，**不是** ③ 段成员数（见 §0.1）
const pathItems = () => [...Object.values(PTH.pathGroups).flat(), PTH.FORBIDDEN_SPEC_PLAN.pattern.source];
// pathTokens() = **23**（③ 段成员数）：`代码、测试` 在卡面写作两项，故按「、」再切一次；`spec / plan` 恒在末位
const pathTokens = () => [...Object.values(PTH.pathGroups).flat().flatMap((x) => x.split('、')), 'spec / plan'];
// 读配置侧唯一口径（testcase §0.3 / spec:131）：`Object.hasOwn`，否则 `constructor` / `__proto__` 会取到原型链上的值
const policyOf = (n) => (Object.hasOwn(SEAT_POLICY, n) ? SEAT_POLICY[n] : SEAT_POLICY.__default__);
// 卡文本（A06 ① 切的是**卡面**，不是渲染结果——两席的卡在 T5 才重出）
const card = (name) => readFileSync(join('agents', `${name}.md`), 'utf8');
// 文本计数（testcase §0.3）：字符串取出现次数、正则取匹配数
const countIn = (text, needle) => (needle instanceof RegExp
  ? (text.match(new RegExp(needle.source, needle.flags.includes('g') ? needle.flags : `${needle.flags}g`)) ?? []).length
  : text.split(needle).length - 1);

// ---- closed-world 允许集（spec §3.5 不变量 2 / §3.7 / §8 V-3）：配置层出现的**每个**字符串字面量都必须是登记 ID ----
// 组成 = capability ID ∪ 命令组 ID（允许 3 + 禁止 5）∪ 席级组 ID ∪ 产物文件 ID ∪ 席 slug ∪ 保留键 `__default__`
// 说明：席 slug 是 SEAT_POLICY 的**对象键**（spec:128 键不计入字面量），但原始扫串会把键一起抓出来，故仍须列入允许集
const ALLOWED_LITERALS = () => new Set([...Object.keys(CAP.capabilities),
  ...Object.keys(CMD.commandGroups), ...Object.keys(CMD.forbiddenGroups), ...Object.keys(CMD.seatGroups ?? {}),
  ...Object.keys(ART.artifacts), ...SEATS.SEAT_NAMES, '__default__']);
// 取「所有引号字面量」：先把反引号统一成单引号（配置层若用模板串同样要查），再抽 '…'
const stringLiterals = (s) => [...stripComments(s).replace(/`/g, "'").matchAll(/'([^'\n]*)'/g)].map((m) => m[1]);

// 卡面边界节 = `## 边界` 之后到卡尾（两张 producer 卡的该节都是最后一节，已核 `agents/` 全 15 张）
const cardBoundary = (text) => {
  const i = text.indexOf('## 边界');
  return i < 0 ? '' : text.slice(i + '## 边界'.length).replace(/^\r?\n+/, '').trim();
};
const golden = () => JSON.parse(readFileSync('tools/docgen/fixtures/boundary-golden.json', 'utf8'));
const goldenOf = (seat) => golden()[seat];
// 黄金换代后的「**当前比对键**」（`spec:198`）：同席中 `<席>@<轮次>` 轮次**最大者**；无换代键则取基线键。
const goldenKeyFor = (seat, g = golden()) => {
  const rounds = Object.keys(g)
    .map((k) => [k, k.match(new RegExp(`^${seat}@(\\d+)$`))])
    .filter(([, m]) => m)
    .sort((a, b) => Number(b[1][1]) - Number(a[1][1]));
  return rounds.length > 0 ? rounds[0][0] : seat;
};
const goldenCurOf = (seat, g = golden()) => g[goldenKeyFor(seat, g)];
// 施工期黄金断言（`RenderNotEquivalent` 的**测试侧**发射点：不是 CLI 码，§7）
function assertGolden(seat, text) {
  if (sha(text) === goldenOf(seat)) return;
  const cardLines = cardBoundary(card(seat)).split('\n');
  const firstDiff = String(text).split('\n').find((l, i) => l !== cardLines[i]) ?? '<行数不同>';
  throw new Error(`RenderNotEquivalent: ${seat}:${firstDiff}`);
}
// 读改造前的卡（只读 git 对象，不碰工作区）：基线复算 / 黄金来源
const gitShow = (rev, p) => {
  const r = spawnSync('git', ['show', `${rev}:${p}`], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.equal(r.status, 0, `git show ${rev}:${p} 失败\n${r.stderr}`);
  return r.stdout;
};
const baseJson = () => JSON.parse(readFileSync('tools/docgen/fixtures/capability-baseline.json', 'utf8'));
// V-2 降级后的唯一判定函数：**只吃一个对象、且结构里没有哈希位**（red 不等于 fail、green 不等于 pass）
const verdict = ({ minus, plus }) => (minus.length === 0 && plus.length === 0 ? 'pass' : 'fail');
// §3.4 归码优先级：形态不合 ID → LiteralInConfig；形态合法但未登记 → UnknownPolicyRef
const expectedRefCode = (v) => (ID.test(v) ? 'UnknownPolicyRef' : 'LiteralInConfig');

// ---- ② 字典（从**目标目录**现算）：副本改了定义层，字典必须跟着变，否则「多一项」测不出 ----
// `denyVerbs` **只剔除 `env.assign`**（该组由 `{{ENV_FORMS}}` 单独注入、`{{DENY_GROUPS}}` 渲染时剔除）→
// 禁止命令集与环境变量形态两段各自可核，不重复计数；其余 4 个禁止组的 verbs 全部计入（含 `network` 的 3 项）
function probeDict(dir = ROOT) {
  const r = runEsm(dir, `import * as CAP from './tools/docgen/policy/definitions/capabilities.mjs';
import { TIERS } from './tools/docgen/policy/definitions/tiers.mjs';
import * as CMD from './tools/docgen/policy/definitions/commands.mjs';
import * as PTH from './tools/docgen/policy/definitions/paths.mjs';
import * as ART from './tools/docgen/policy/definitions/artifacts.mjs';
const groups = Object.values(PTH.pathGroups).flat();
console.log(JSON.stringify({
  tools: Object.values(CAP.capabilities).flat(),
  tiers: Object.keys(TIERS),
  artifacts: Object.keys(ART.artifacts),
  paths: [...groups.flatMap((x) => x.split('、')), 'spec / plan'],
  allowVerbs: Object.values(CMD.commandGroups).flatMap((g) => g.verbs),
  denyVerbs: Object.entries(CMD.forbiddenGroups).filter(([g]) => g !== 'env.assign').flatMap(([, g]) => g.verbs),
  envVerbs: [...CMD.forbiddenGroups['env.assign'].verbs],
}));`);
  assert.equal(r.status, 0, `字典取数失败（${dir}）\n${r.stderr}`);
  return JSON.parse(r.stdout);
}

test('S6-TC-A02 命令 8 组（允许 3 / 禁止 5）+ seatGroups 空集 + 每组 purpose 与 verbs 非空', () => {
  const G = CMD.commandGroups;                       // 允许组
  const D = CMD.forbiddenGroups;                     // 禁止组
  assert.deepEqual(Object.keys(G), ['check.local','git.read','docgen.read'], '允许组顺序 = 卡面顺序');
  assert.deepEqual(Object.keys(D), ['docgen.write','git.write','fs.write','env.assign','network']);
  for (const g of [...Object.values(G), ...Object.values(D)]) {
    assert.ok(typeof g.purpose === 'string' && g.purpose.trim().length > 0);
    assert.ok(Array.isArray(g.verbs) && g.verbs.length > 0);
  }
  for (const v of G['git.read'].verbs) assert.match(v, /^git --no-optional-locks /);
  // network：verbs 恰三项（spec:54），`下载类命令` 只归 purpose、不得塞回 verbs
  assert.equal(D.network.verbs.length, 3, 'network.verbs 必须恰三项');
  assert.deepEqual([...D.network.verbs].sort(), ['node -e','安装','网络写'].sort());
  assert.equal(D.network.verbs.some((v) => /下载/.test(v)), false, '`下载类命令` 不是 verb（形态描述归 purpose）');
  assert.ok(D.network.purpose.includes('下载类命令'), 'network.purpose 必须含 `下载类命令` 形态描述');
  assert.deepEqual(Object.keys(CMD.seatGroups ?? {}), [], '本轮 seatGroups 必须是空集（只允许副本内构造）');
});

test('S6-TC-A04 路径 6 组：21 数组元素 / 22 定义层点名 / 23 卡面成员', () => {
  const P = PTH.pathGroups;
  assert.deepEqual(Object.keys(P), ['code','governance','docs.input','build','ledger','workspace']);
  assert.deepEqual(P.code, ['代码、测试']);
  assert.deepEqual(P.governance, ['rules/','skills/','agents/']);
  assert.deepEqual(P['docs.input'], ['docs/prd/']);
  assert.deepEqual(P.build, ['tools/','scripts/','配置与依赖清单']);
  // **成员名逐项断言**（只比长度 → `docs/reports/` 换成 `docs/misc/` 也绿，等于没判）
  assert.deepEqual(P.ledger, ['docs/after/','docs/handoffs/','docs/reports/','docs/superpowers/retro/'],
    'ledger 组必须逐项相等（换名不换数 → 必红）');
  assert.deepEqual(P.workspace, ['.superpowers/','lessons/','*.local.md','**/ledger.md','.trae/',
    'skills-lock.json','node_modules/','tools/docgen-spike/.tmp-test/','其他评审目录'],
    'workspace 恰 9 项且按定义层顺序逐项相等（换名不换数 / 调序 → 必红）');
  assert.equal(Object.values(P).flat().length, 21);        // 21 数组元素（`代码、测试` 合写盖 2 项）
  assert.equal(pathItems().length, 22);                    // **定义层**：21 元素 + 1 pattern 源串（不是 ③ 段成员数）
  assert.equal(pathTokens().length, 23);                   // **卡面**：③ 段成员 23（21 元素按 `、` 再切 = 22，+ `spec / plan`）
  assert.ok(pathTokens().includes('spec / plan'), '第 23 项 `spec / plan` 必须进成员集合（否则 ③ 段只有 22 项）');
  assert.ok(PTH.FORBIDDEN_SPEC_PLAN.pattern instanceof RegExp);
  assert.match('spec / plan', PTH.FORBIDDEN_SPEC_PLAN.pattern);
  assert.match('spec/plan', PTH.FORBIDDEN_SPEC_PLAN.pattern);
  assert.deepEqual(PTH.DETECTION_BLIND_SPOTS, ['.session/','.superpowers/','lessons/']);
  for (const g of Object.values(P)) assert.equal(g.includes('.session/'), false, '检测盲区不得混进禁写清单');
});

test('S6-TC-A05 artifacts 4 项在位、progress.md 标 host', () => {
  const A = ART.artifacts;
  assert.deepEqual(Object.keys(A).sort(), ['delivery-audit.md','detective.md','progress.md','round-check.md']);
  assert.equal(A['progress.md'].host, true);
  for (const k of ['round-check.md','delivery-audit.md','detective.md']) assert.notEqual(A[k].host, true, k);
  for (const [f, v] of Object.entries(A)) {
    assert.deepEqual(Object.keys(v).filter((x) => !['owner','host','note'].includes(x)), [], f);
    assert.ok(/\.md$/.test(f), '产物名必须是文件名，不是路径');
  }
});

test('S6-TC-A07 组 ID 唯一且符合 v4 谓词（含冒号）、不含 / 反引号 空格 --', () => {
  const ID = /^[a-z][a-z0-9.:-]*$/;        // = spec §3.4 归码谓词（与实现同一口径，不另造）
  const ids = [...Object.keys(CAP.capabilities), ...Object.keys(CMD.commandGroups),
    ...Object.keys(CMD.forbiddenGroups), ...Object.keys(PTH.pathGroups), ...Object.keys(ART.artifacts)];
  for (const id of ids) {
    assert.match(id, ID, id);
    assert.equal(/[\/`\s]|--/.test(id), false, `组 ID 含非法字符：${id}`);   // 命名纪律，严于归码谓词
  }
  assert.equal(new Set(ids).size, ids.length, '组 ID 跨层重名');
});

test('S6-TC-A03 5 个禁止组在位且不可被授予', () => {
  const forbidden = new Set(Object.keys(CMD.forbiddenGroups));
  for (const [seat, p] of Object.entries(SEAT_POLICY)) {
    const hit = (p.allowGroups ?? []).filter((g) => forbidden.has(g));
    assert.deepEqual(hit, [], `${seat} 授予了禁止组`);
  }
});

test('S6-TC-B12 未登记席与原型链键名回落 __default__', () => {
  for (const n of ['ghost-seat','Reviewer-Audit','constructor','toString','hasOwnProperty','__proto__']) {
    assert.deepEqual(policyOf(n), SEAT_POLICY.__default__, n);
    assert.equal(Object.hasOwn(SEAT_POLICY, n), false, `${n} 不可能是自有键`);
  }
  assert.deepEqual(policyOf('__default__'), SEAT_POLICY.__default__);
  assert.equal(Object.hasOwn(SEAT_POLICY, '__default__'), true);
});

test('S6-TC-A06 卡面切片顺序 == 定义层组内顺序（路径 + 命令两处）', () => {
  // 与 testcase:816 的唯一偏差：切片**去掉锚点本身**——`indexOf('逐项点名：')` 是包含式起点，
  // 直接用会把首项切成「逐项点名：代码」（23 项恒少一项、集合恒不等，判据永远红）。语义不变，只去锚点。
  const sec = (t) => t.slice(t.indexOf('逐项点名：') + '逐项点名：'.length, t.indexOf('；兜底句'));
  const strip = (s) => s.trim().replace(/^`|`$/g, '');
  for (const seat of ['reviewer-audit', 'detective-observer']) {
    // ① 卡面路径段：成员数 = 23（含 `spec / plan`）+ 去掉 pattern 项后的顺序
    const items = sec(card(seat)).split('、').map(strip).filter(Boolean);
    assert.equal(items.length, 23, `${seat}: ③ 段成员数应为 23（不是 22）`);
    assert.deepEqual([...items].sort(), [...pathTokens()].sort(), `${seat}: 路径项集合 ≠ 23 项`);
    const noPattern = (a) => a.filter((x) => x !== 'spec / plan');
    assert.deepEqual(noPattern(items), noPattern(pathTokens()), `${seat}: 组内顺序 ≠ 卡面顺序`);
    // ② 命令段：14 条允许命令逐项出现且位置单调（= 顺序 = 定义层顺序）
    const out = renderBoundary(seat);
    const allowSeg = out.slice(out.indexOf('只跑下列白名单'), out.indexOf('**禁止**'));
    const verbs = Object.values(CMD.commandGroups).flatMap((g) => g.verbs);
    const pos = verbs.map((v) => allowSeg.indexOf(v));
    assert.ok(pos.every((i) => i >= 0), `${seat}: 允许命令缺项`);
    assert.deepEqual([...pos].sort((a, b) => a - b), pos, `${seat}: 允许命令顺序 ≠ 定义层顺序`);
  }
});

test('S6-TC-C06 12 槽齐（可观测值）+ 无残留 / 未定义 / 悬空标点 + 槽 6 两形态 + 可选槽缺省', () => {
  const SLOTS = ['SEAT', 'TIER', 'CAPABILITIES', 'ARTIFACTS', 'SEAT_CLAUSE', 'ESCALATION_WRITER',
    'ALLOW_GROUPS', 'DENY_GROUPS', 'ENV_FORMS', 'FORBIDDEN_PATHS', 'DETECTION_PATHS', 'DETECTION_CMD'];
  const tpl = readFileSync('tools/docgen/templates/boundary.md.tpl', 'utf8');
  const slots = new Set([...tpl.matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1]));
  assert.deepEqual([...slots].sort(), [...SLOTS].sort(), '槽集 ≠ §3.4 表的 12 个');
  for (const s of SLOTS) assert.ok(countIn(tpl, `{{${s}}}`) >= 1, `槽 ${s} 未被引用`);
  for (const seat of ['reviewer-audit', 'detective-observer', 'senior-sdet']) {
    const out = renderBoundary(seat);
    assert.equal(out.includes('{{'), false, `${seat}: 残留槽位`);
    assert.equal(/undefined|null|NaN/.test(out), false, `${seat}: 渲染出未定义值`);
    assert.equal(/[、，；：]{2,}|[、，；：]\s*[。；]/.test(out), false, `${seat}: 连续 / 悬空标点`);
  }
  // 空 artifacts 席（senior-sdet）不得因空数组留下悬空标点
  assert.equal(/只允许写[：:]\s*[、。；]/.test(renderBoundary('senior-sdet')), false, '空 artifacts 留下悬空标点');
  // ⑤ 槽 6（{{ESCALATION_WRITER}}）两形态（spec:85）：本席自写 / 他席写
  assert.match(renderBoundary('reviewer-audit'), /审计\s*写\s*`round-check\.md`/, '审计席：应渲染「本席自写」形态');
  assert.match(renderBoundary('detective-observer'), /交\s*审计\s*在\s*`round-check\.md`\s*独立复算/, '侦探席：应渲染「他席写」形态');
  // ⑥ 可选槽缺省（spec:57）：三席 display 全写死；`senior-sdet` 的 clause / escalationWriter **缺省未声明** → 空串、12 项不变
  for (const s of ['reviewer-audit', 'detective-observer', 'senior-sdet']) {
    assert.ok(String(SEATS.SEATS[s].display).trim().length > 0, `${s}: display 必须写死非空`);
  }
  const sd = renderBoundary('senior-sdet');
  assert.ok(sd.length > 0, 'senior-sdet 必须能渲染成功（可选槽缺省不是渲染失败）');
  assert.equal(/undefined|null|NaN/.test(sd), false, '缺省槽渲染出未定义值');
  assert.equal(/[、，；：]{2,}|[、，；：]\s*[。；]/.test(sd), false, '缺省槽留下悬空标点');
  assert.equal(dumpPolicy(ROOT).json.seats['senior-sdet'].expanded.length, 12, '缺省槽不得让 expanded 变短');
});

test('S6-TC-C08 槽级分隔符：组间 `、`/`；`、组内 ` / `；DENY_GROUPS 剔除 `env.assign`', () => {
  const e = dumpPolicy(ROOT).json.seats['reviewer-audit'].expanded;
  // 槽序 = §3.4 表行序（`spec:76` / `spec:162`）：槽 7 ALLOW→index 6 / 槽 8 DENY→index 7
  // / 槽 9 ENV_FORMS→index 8 / 槽 10 FORBIDDEN_PATHS→index 9（卡面首次出现顺序不参与判据）
  const [allowSlot, denySlot, pathSlot, envSlot] = [e[6], e[7], e[9], e[8]];
  assert.ok(allowSlot.includes('；'), '允许组：组间分隔符应为 ；');
  assert.ok(allowSlot.includes(' / '), '允许组：组内分隔符应为 ` / `');
  assert.ok(pathSlot.includes('、') && !pathSlot.includes('；'), '路径清单：统一用 、');
  // ③ 段成员数 = **23**（`spec:89` 槽 10 = `pathGroups` 六组展开 ∪ `spec / plan`）：不是 22
  assert.equal(pathSlot.split('、').filter(Boolean).length, 23, '路径槽成员数应为 23（含 `spec / plan`）');
  assert.ok(pathSlot.includes('spec / plan'), '路径槽必须含 `spec / plan`（第 23 项）');
  for (const v of CMD.forbiddenGroups['env.assign'].verbs) {
    assert.equal(denySlot.includes(v), false, `env.assign verb 混进 DENY_GROUPS：${v}`);
    assert.ok(envSlot.includes(v), `env.assign verb 未进入 ENV_FORMS：${v}`);
  }
  const out = renderBoundary('reviewer-audit');
  assert.match(out, /任何形式的环境变量赋值/, '环境变量段整段缺失');
  assert.ok(out.includes(CMD.forbiddenGroups['env.assign'].verbs[0]), '环境变量形态未渲染');
  const pathSeg = out.slice(out.indexOf('逐项点名：'), out.indexOf('；兜底句'));
  assert.equal(pathSeg.includes(', '), false, '路径段不得用 ", " 连接');
});

// ===================== T4-2：配置校验五码 / 策略数据 / 模板纯度 =====================

test("S6-TC-A08 定义层值含 {{SLOT}} / $& / $' / $$ 时不得被二次展开（单趟替换）", () => {
  const PROBE = "$&|$'|$$|{{DENY_GROUPS}}";
  withCopy((d) => {
    // 与 testcase:872 的唯一偏差：替换值必须用**函数**形态——`String.replace` 会把替换串里的
    // `$&` / `$'` / `$$` 当替换模式解释，直接传 JSON.stringify(PROBE) 会先破坏注入值（判据本身失效）
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'配置与依赖清单'", () => JSON.stringify(PROBE)));
    const out = renderBoundaryIn(d, 'reviewer-audit');
    assert.ok(out.includes(PROBE), `注入值被二次解释 / 二次展开：${PROBE}`);
  });
  // ④ 单趟替换（spec:93）：槽值里出现**另一个槽名**时不得被后一个槽扫掉；expanded 的 SEAT 项仍是该字符串
  const SEAT_PROBE = '审计{{DETECTION_CMD}}席';
  withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/seats.mjs',
      (s) => s.replace("display: '审计'", `display: ${JSON.stringify(SEAT_PROBE)}`));
    const out = renderBoundaryIn(d, 'reviewer-audit');
    assert.ok(out.includes(SEAT_PROBE), `display 里的槽名被二次展开（不是单趟替换）：期望原样 ${SEAT_PROBE}`);
    assert.equal(dumpPolicy(d).json.seats['reviewer-audit'].expanded[0], SEAT_PROBE,
      'expanded[0]（槽 1 SEAT）必须仍是 display 原串');
  });
});

test('S6-TC-B01 三席 + __default__ 策略数据等价；黄金 4 键齐（哈希只记事实）', () => {
  assert.deepEqual(Object.keys(SEAT_POLICY), ['reviewer-audit','detective-observer','senior-sdet','__default__']);
  assert.deepEqual(SEAT_POLICY['reviewer-audit'], { capabilities: ['read','write','exec'],
    allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['round-check.md','delivery-audit.md'] });
  assert.deepEqual(SEAT_POLICY['detective-observer'], { capabilities: ['read','write','exec'],
    allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['detective.md'] });
  assert.deepEqual(SEAT_POLICY['senior-sdet'], { capabilities: ['read','write'], allowGroups: [], artifacts: [] });
  assert.deepEqual(SEAT_POLICY.__default__, { capabilities: ['read'], allowGroups: [], artifacts: [] });
  // ④ 黄金：4 个**基线键**必须在（换代只许追加 `<席>@<轮次>`、旧键不删），且值取自**改造前**文本
  const gk = Object.keys(golden());
  for (const k of ['default-boundary','detective-observer','evidence-reader-boundary','reviewer-audit']) {
    assert.ok(gk.includes(k), `黄金缺基线键 ${k}（换代不得删旧键）`);
  }
  for (const k of gk.filter((x) => x.includes('@'))) assert.match(k, /@\d+$/, `换代键形态应为 <席>@<轮次>：${k}`);
  // ④' 当前比对键（spec:198）：同席 `<席>@<轮次>` 轮次**最大者**；无换代键 → 回落基线键
  for (const s of ['reviewer-audit','detective-observer']) {
    const k = goldenKeyFor(s);
    assert.match(k, new RegExp(`^${s}(@\\d+)?$`), `${s}: 当前比对键形态不对：${k}`);
    const rounds = gk.filter((x) => x.startsWith(`${s}@`)).map((x) => Number(x.split('@')[1]));
    if (rounds.length > 0) assert.equal(k, `${s}@${Math.max(...rounds)}`, `${s}: 当前比对键必须取轮次最大者`);
    else assert.equal(k, s, `${s}: 无换代键时必须回落基线键`);
  }
  assert.equal(goldenOf('default-boundary'), sha(DEFAULT_BOUNDARY), 'default-boundary 必须取自改造前常量');
  const baseRev = baseJson().sourceCommit;
  for (const s of ['reviewer-audit','detective-observer']) {
    assert.equal(goldenOf(s), sha(cardBoundary(gitShow(baseRev, `agents/${s}.md`)).trim()),
      `${s}: 黄金必须取自改造前旧卡（不得用改造后渲染自哈希，spec:172）`);
  }
  // ③ 只取事实，不据此下结论；比对键 = 当前比对键（换代后取最大轮次，否则基线键）
  const hashEqual = sha(renderBoundary('reviewer-audit')) === goldenCurOf('reviewer-audit');
  assert.equal(typeof hashEqual, 'boolean');
  // ⑤ 档位表**四档**（spec:53；`TIERS` 本身是档位对象，值是工具名）
  assert.deepEqual(Object.keys(TIERS), ['readOnly','sdet','command','producer']);
  const TOOLS = new Set(Object.values(CAP.capabilities).flat());
  for (const [tier, tools] of Object.entries(TIERS)) {
    for (const t of tools) assert.ok(TOOLS.has(t), `${tier}: ${t} 不是工具名（档位值不得写成 capability ID）`);
  }
  // 与 testcase:967 的唯一偏差：`patternRegistry.tools === TIERS`（同引用）的严格断言落在 A01（本文件 T5 追加）
  // 此处保留逐档值相等，作为「值不等即红」的第二道
  for (const tier of Object.keys(TIERS)) {
    assert.deepEqual(patternRegistry.tools[tier], TIERS[tier], `patternRegistry.tools.${tier} 值 ≠ TIERS.${tier}`);
  }
  // 不变量 9：capabilities 展开 ≡ TIERS[档] ≡ toolsForSeat(席) ≡ 渲染出的档位名
  for (const s of ['reviewer-audit','detective-observer','senior-sdet']) {
    const expanded = SEAT_POLICY[s].capabilities.flatMap((c) => CAP.capabilities[c]);
    assert.deepEqual([...expanded].sort(), [...toolsForSeat(s)].sort(), `${s}: capabilities 展开 ≠ toolsForSeat`);
    const tier = tierOfCapabilities(SEAT_POLICY[s].capabilities);
    assert.deepEqual([...expanded].sort(), [...TIERS[tier]].sort(), `${s}: caps 展开 ≠ TIERS[${tier}]`);
    assert.equal(tier, factsFromText(renderBoundary(s), probeDict()).tier, s);
  }
  // ⑧ 可选槽缺省（spec:57）：display 三席全写死；clause 缺省 = ''；escalationWriter 缺省 = 未声明（≠ 显式 undefined）
  for (const s of SEATS.SEAT_NAMES) assert.ok(String(SEATS.SEATS[s].display).trim().length > 0, `${s}: display 必须写死非空`);
  assert.equal(SEATS.SEATS['senior-sdet'].display, '测试开发');
  assert.equal(Object.hasOwn(SEATS.SEATS['senior-sdet'], 'escalationWriter'), false, 'senior-sdet 应**缺省** escalationWriter（未声明）');
  assert.equal(SEATS.SEATS['senior-sdet'].clause ?? '', '', "senior-sdet 的 clause 缺省值必须是 ''");
  assert.equal(SEATS.SEATS.__default__.clause, '', "__default__.clause 必须为 ''");
  // 判定函数结构里没有哈希位
  assert.equal(verdict.length, 1);
  assert.equal(verdict({ minus: [], plus: [] }), 'pass');
  // ⑦ 不变量 9 负例：配置展开的档位 ≠ patternRegistry.tierBySeat 的档位 → UnknownPolicyRef
  // 偏离已签 B01⑦ 的构造值（tierBySeat 已按 spec §3.6 派生），判据语义不变：非规范 caps 必须被判红
  const tierMismatch = withCopy((d) => {
    setSeatPolicy(d, 'senior-sdet', { ...SEAT_POLICY['senior-sdet'], capabilities: ['write'] });
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(tierMismatch.status, 1);
  assert.match(tierMismatch.stderr.split('\n')[0], /^UnknownPolicyRef: senior-sdet:tier=.+$/);
  // ⑨ 负例（换代取键，spec:198）：golden 副本追加 `reviewer-audit@1` / `@2`（值 = 换代后文本哈希）→ 必须取 @2
  const cur = renderBoundary('reviewer-audit');
  const newText = `${cur}\n<!-- V-13 换代后追加的措辞 -->`;
  const gen = { ...golden(), 'reviewer-audit@1': sha(`${cur}\n<!-- round 1 -->`), 'reviewer-audit@2': sha(newText) };
  assert.equal(goldenKeyFor('reviewer-audit', gen), 'reviewer-audit@2', '换代后必须取轮次最大的键（spec:198）');
  assert.equal(gen[goldenKeyFor('reviewer-audit', gen)], sha(newText), '当前比对键必须命中换代后的文本');
  // 反例：换代后仍取旧基线键 → 换代后的文本与基线不等 → hashEqual 恒 false（定位线索失效）→ 必须红
  assert.notEqual(sha(newText), gen['reviewer-audit'], '换代后仍取旧基线键 → 定位线索失效 → 必红');
  // ⑩ tierBySeat **派生**（spec:120）：键集恰三席、不含 `__default__`、派生值 == 映射值（手写第二份留给 T5 改派生）
  assert.deepEqual(Object.keys(patternRegistry.tierBySeat).sort(),
    ['detective-observer','reviewer-audit','senior-sdet'],
    'tierBySeat 键集必须恰为三席（不得含 `__default__`）');
  assert.deepEqual(Object.keys(patternRegistry.tierBySeat).sort(), [...SEATS.SEAT_NAMES].sort(),
    'tierBySeat 键集 ≡ SEAT_NAMES（= Object.keys(SEATS) 去 `__default__`，spec:57 / :120）');
  assert.equal(Object.hasOwn(patternRegistry.tierBySeat, '__default__'), false,
    '派生结果不得含 `__default__`（spec:120：把保留键一起派生进去 → 本断言必红）');
  for (const s of SEATS.SEAT_NAMES) {
    assert.equal(patternRegistry.tierBySeat[s], tierOfCapabilities(SEAT_POLICY[s].capabilities),
      `${s}: 派生值必须 == 映射值（tierBySeat[s] === tierOfCapabilities(SEAT_POLICY[s].capabilities)），不得手改成别的档`);
  }
  assert.deepEqual(
    Object.fromEntries(SEATS.SEAT_NAMES.map((s) => [s, patternRegistry.tierBySeat[s]])),
    { 'reviewer-audit': 'producer', 'detective-observer': 'producer', 'senior-sdet': 'sdet' },
    '三席档位值 = 由 SEAT_POLICY 现算的结果（reviewer-audit / detective-observer = producer，senior-sdet = sdet）');
});

test('S6-TC-B02 真实 seat-policy.mjs closed-world：三键外零字符串、三键内逐条登记', () => {
  const src = readFileSync('tools/docgen/policy/seat-policy.mjs', 'utf8');
  const strays = stringLiterals(src).filter((s) => !ALLOWED_LITERALS().has(s));
  assert.deepEqual(strays, [], '配置层出现非登记字符串字面量（closed-world 破坏）');
  for (const [seat, p] of Object.entries(SEAT_POLICY)) {
    assert.deepEqual(Object.keys(p).sort(), ['allowGroups','artifacts','capabilities'], seat);
    for (const c of p.capabilities) assert.ok(Object.hasOwn(CAP.capabilities, c), `${seat}:capability=${c}`);
    for (const g of p.allowGroups) assert.ok(
      Object.hasOwn(CMD.commandGroups, g) || Object.hasOwn(CMD.seatGroups ?? {}, g),
      `${seat}:group=${g}（禁止组不在此放行，见 B09/B10）`);
    for (const a of p.artifacts) assert.ok(Object.hasOwn(ART.artifacts, a), `${seat}:artifact=${a}`);
  }
  // ③ 对象键 ∈ SEAT_NAMES；__default__ 是保留键（**不在** SEAT_NAMES 里，spec:57）且 display 非空
  for (const seat of Object.keys(SEAT_POLICY)) {
    if (seat === '__default__') continue;
    assert.ok(SEATS.SEAT_NAMES.includes(seat), `未登记的对象键：${seat}`);
  }
  assert.ok(Object.hasOwn(SEATS.SEATS, '__default__'), 'SEATS 必须含保留键 __default__');
  assert.equal(SEATS.SEAT_NAMES.includes('__default__'), false, '__default__ 是保留键，不得授予、不得进 SEAT_NAMES');
  assert.ok(String(SEATS.SEATS.__default__.display).trim().length > 0, '__default__.display 不得为空');
  // ④ seatGroups 键进入 closed-world 候选集
  for (const g of Object.keys(CMD.seatGroups ?? {})) assert.ok(ALLOWED_LITERALS().has(g), `席级组 ${g} 未进白名单`);
  // ⑤ 快速失败（不是主判据）：三条弱探针仍 0 命中
  assert.equal(stripComments(src).includes('/'), false);
  assert.equal(stripComments(src).includes('`'), false);
});

test('S6-TC-B03 配置层塞路径 → LiteralInConfig', () => {
  // 五码的发射点 = cli 的 gate / policy --dump（spec:161）；故探针跑 policy --dump，不直接 import 配置模块
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'docs/after/');       // 追加到 allowGroups
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
});

test('S6-TC-B04 配置层塞反引号命令 → LiteralInConfig', () => {
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', '`npm run check`');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
});

test('S6-TC-B05 配置层塞 --flag → LiteralInConfig', () => {
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', '--write');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
});

test('S6-TC-B06 引用不存在的 capability → UnknownPolicyRef', () => {
  const r = withCopy((d) => {
    setSeatPolicy(d, 'senior-sdet', { ...SEAT_POLICY['senior-sdet'], capabilities: ['read', 'admin'] });
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'UnknownPolicyRef: senior-sdet:capability=admin');
});

test('S6-TC-B07 引用不存在的组 → UnknownPolicyRef', () => {
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'git.write2');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'UnknownPolicyRef: reviewer-audit:group=git.write2');
});

test('S6-TC-B08 引用不存在的 artifact 文件 → UnknownPolicyRef', () => {
  const r = withCopy((d) => {
    setSeatPolicy(d, 'detective-observer', { ...SEAT_POLICY['detective-observer'], artifacts: ['detective.md', 'snapshot.md'] });
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'UnknownPolicyRef: detective-observer:artifact=snapshot.md');
});

test('S6-TC-B09 授予禁止组 docgen.write → ForbiddenGroupGranted', () => {
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'docgen.write');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'ForbiddenGroupGranted: reviewer-audit:docgen.write:forbidden');
});

test('S6-TC-B10 非本席引用 seat:senior-sdet.extra → ForbiddenGroupGranted', () => {
  const r = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');          // 本席合法（B11 正例）
    grantGroup(d, 'reviewer-audit', 'seat:senior-sdet.extra');       // 越席使用
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.equal(r.stderr.split('\n')[0], 'ForbiddenGroupGranted: reviewer-audit:seat:senior-sdet.extra:other-seat');
});

test('S6-TC-B11 本席 seat:<名>.extra 合法且只改本席；verb 越界 → :not-allowed / 撞禁止 → :verb', () => {
  const before = dumpPolicy(ROOT).json.seats;              // 真仓库：seatGroups 为空
  const after = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return dumpPolicy(d).json.seats;
  });
  const changed = Object.keys(after).filter((s) => JSON.stringify(after[s]) !== JSON.stringify(before[s]));
  assert.deepEqual(changed, ['senior-sdet'], '席级组只许影响本席');
  // ③ 不变量 8 负例：席级组 verbs 与禁止组 verbs 有交集 → :verb
  const bad = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check', 'git commit'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(bad.status, 1);
  assert.equal(bad.stderr.split('\n')[0], 'ForbiddenGroupGranted: senior-sdet:seat:senior-sdet.extra:verb');
  // ④ 不变量 8 方向①（spec:112）：越出**允许组 verbs 并集** → :not-allowed（不是 :verb）
  const outOfAllow = withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
      "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['curl https://x'] },");
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(outOfAllow.status, 1);
  assert.equal(outOfAllow.stderr.split('\n')[0], 'ForbiddenGroupGranted: senior-sdet:seat:senior-sdet.extra:not-allowed');
});

test('S6-TC-B13 配置里的产物文件名是登记 ID，不得误红', () => {
  const src = readFileSync('tools/docgen/policy/seat-policy.mjs', 'utf8');
  assert.match(src, /'round-check\.md'/);
  assert.match(src, /'detective\.md'/);
  assert.ok(ALLOWED_LITERALS().has('round-check.md'));
  assert.deepEqual(stringLiterals(src).filter((s) => !ALLOWED_LITERALS().has(s)), []);
});

test('S6-TC-B14 配置层塞非 ID 裸命令（git status）→ LiteralInConfig', () => {
  const r = withCopy((d) => {
    grantGroup(d, 'reviewer-audit', 'git status');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
});

test('S6-TC-B15 配置层 artifacts 塞路径形态非 ID → LiteralInConfig', () => {
  const r = withCopy((d) => {
    setSeatPolicy(d, 'reviewer-audit', {
      ...SEAT_POLICY['reviewer-audit'], artifacts: ['round-check.md', 'delivery-audit.md', 'definitions/x.mjs'],
    });
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/);
});

test('S6-TC-C03 模板塞路径 → TemplateImpure', () => {
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 另：\`docs/prd/\` 也不许写。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/);
});

test('S6-TC-C04 模板塞反引号命令 → TemplateImpure', () => {
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 例：\`npm run check\`。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/);
});

test('S6-TC-C05 模板塞清单类成员 → TemplateImpure；单点类 --write 合法', () => {
  assert.ok(CMD.forbiddenGroups['fs.write'].verbs.includes('--write'), '--write 必须是 fs.write 的登记 verb');
  // ① 清单类成员（多词 verb）→ 规则 1 判红
  const bad = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 附注：npm run check 是常用命令。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr.split('\n')[0], /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/);
  // ② 单点类成员（单 token flag）→ 规则 2 允许（存在性校验通过）
  const ok = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 另注：--write 属写盘形态。\n`);
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(ok.status, 0, `单点类 --write 被误判为不纯：${ok.stderr}`);
});

test('S6-TC-C07 未声明槽位不得静默保留', () => {
  const out = withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('{{SEAT}}', '{{SEAT_LABEL}}'));
    return runCli(d, ['policy', '--dump']);      // 槽集校验在 validatePolicy 内（不变量 7）
  });
  assert.ok(out.status !== 0 || !out.stdout.includes('{{'), '未声明槽位被静默保留');
});

test('S6-TC-C09 显式 undefined 的槽值 → TemplateImpure（「缺省未声明」≠「显式 undefined」）', () => {
  // ④ 缺省未声明（真仓库）是合法路径：senior-sdet 不声明 clause 时不得报错
  assert.equal(runCli(ROOT, ['policy', '--dump']).status, 0, '缺省未声明被误判为不纯');
  // ①②③ 显式 undefined ≠ 缺省：必须 TemplateImpure，且片段 = 槽名
  const bad = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/seats.mjs',
      (s) => s.replace(/'senior-sdet':\s*\{/, "'senior-sdet': { clause: undefined,"));
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(bad.status, 1, '显式 undefined 必须判红');
  assert.match(bad.stderr.split('\n')[0], /^TemplateImpure: .*boundary\.md\.tpl:.*SEAT_CLAUSE$/);
});

// ===================== T5：档位表 = 定义层同一对象引用（A01） =====================

test('S6-TC-A01 capabilities 三组逐字 + 值落在六工具白名单内 + 档位表键集齐', () => {
  const CAPS = CAP.capabilities;
  assert.deepEqual(CAPS.read, ['Read','Glob','Grep']);
  assert.deepEqual(CAPS.write, ['Write','Edit']);
  assert.deepEqual(CAPS.exec, ['RunCommand']);
  const all = Object.values(CAPS).flat();
  assert.deepEqual([...new Set(all)].sort(), ['Edit','Glob','Grep','Read','RunCommand','Write'].sort());
  // ④ 档位表**四档**（spec:53）：`TIERS` 本身就是档位对象，**值是工具名**（不是 capability ID）；
  // `command` 是 S2 精算师保留档、本轮无挂席，但键必须存在（S5 既有断言依赖它）
  assert.deepEqual(Object.keys(TIERS), ['readOnly','sdet','command','producer']);
  const TOOLS = new Set(Object.values(CAPS).flat());
  for (const [tier, tools] of Object.entries(TIERS)) {
    assert.ok(Array.isArray(tools) && tools.length > 0, `${tier}: 档位值必须是工具名数组`);
    for (const t of tools) assert.ok(TOOLS.has(t), `${tier}: ${t} 不是 capabilities 里的工具名（档位值不得写成 capability ID）`);
  }
  assert.deepEqual(TIERS.readOnly, ['Read','Glob','Grep']);
  assert.deepEqual(TIERS.sdet, ['Read','Glob','Grep','Write','Edit']);
  assert.deepEqual(TIERS.command, ['Read','Glob','Grep','RunCommand']);
  assert.deepEqual(TIERS.producer, ['Read','Glob','Grep','Write','Edit','RunCommand']);
  // 同一对象引用：**严格相等**（`assert.equal`，不是 `deepEqual`）——re-export 不得深拷贝、不得改名
  assert.equal(patternRegistry.tools, TIERS, '档位表必须 re-export tiers.mjs 的同一对象（不得另存一份 / 不得深拷贝）');
  // ⑤ `tierOfCapabilities` = 「caps 展开后的工具集 == TIERS[档]」的唯一样（spec:53）
  for (const [caps, tier] of [[['read'],'readOnly'], [['read','write'],'sdet'],
    [['read','exec'],'command'], [['read','write','exec'],'producer']]) {
    assert.equal(tierOfCapabilities(caps), tier, `${caps.join('+')} 应判 ${tier}`);
    assert.deepEqual([...caps.flatMap((c) => CAPS[c])].sort(), [...TIERS[tier]].sort(),
      `${caps.join('+')} 展开 ≠ TIERS[${tier}]`);
  }
});

// ===================== T5-2：五码 / 九不变量 / 单源收敛 / 卡面可追（D + E + G 组） =====================
// helper 照 testcase §0.3 / §0.4 原样追加（不重复定义本文件已有的 editInDir / withCopy / runCli / dirHashes …）

// E02 用：「改动文件集」，键 = `tools/docgen` 下的相对路径（副本目录名不同，不能直接比绝对路径）
const toolHashes = (dir) => Object.fromEntries(Object.entries(dirHashes(join(dir, 'tools/docgen')))
  .map(([p, h]) => [p.replace(/\\/g, '/').split('/tools/docgen/')[1], h]));
const changedFiles = (a, b) => {
  const x = toolHashes(a); const y = toolHashes(b);
  return Object.keys({ ...x, ...y }).filter((k) => x[k] !== y[k]).sort();
};
// 「一份路径清单副本」= 单文件命中 ≥ 20 项（E03 / E04 / E05 共用；阈值与 testcase §0.3 一致）
// S4 Task 7：`git ls-files --cached` 仍会列出已删但未提交的旧模板（工作区已不存在）→ 跳过缺失文件
const listCopies = (root, files, items = pathTokens(), threshold = 20) =>
  files.filter((f) => existsSync(join(root, f)) && items.filter((it) => readFileSync(join(root, f), 'utf8').includes(it)).length >= threshold);

test('S6-TC-D01 六个错误码各 1 个负例：exit 1 + 报文首行格式', () => {
  // 统一探针：副本内构造一次违规 → 跑 policy --dump（五码的唯一 CLI 发射点，spec:161）
  const probe = (edit) => withCopy((d) => { edit(d); return runCli(d, ['policy', '--dump']); });
  const CLI_CASES = [
    ['UnknownPolicyRef',
      (d) => setSeatPolicy(d, 'senior-sdet', { ...SEAT_POLICY['senior-sdet'], capabilities: ['read','admin'] }),
      /^UnknownPolicyRef: senior-sdet:capability=admin$/],
    ['LiteralInConfig',
      (d) => grantGroup(d, 'reviewer-audit', 'docs/after/'),
      /^LiteralInConfig: tools\/docgen\/policy\/seat-policy\.mjs:\d+$/],
    ['SeatNameInDefinition',
      (d) => editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
        (s) => s.replace("'其他评审目录'", "'其他评审目录-reviewer-audit'")),
      /^SeatNameInDefinition: tools\/docgen\/policy\/definitions\/paths\.mjs$/],
    ['ForbiddenGroupGranted:forbidden',
      (d) => grantGroup(d, 'reviewer-audit', 'docgen.write'),
      /^ForbiddenGroupGranted: reviewer-audit:docgen\.write:forbidden$/],
    ['ForbiddenGroupGranted:other-seat',
      (d) => {
        insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
          "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check'] },");
        grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
        grantGroup(d, 'reviewer-audit', 'seat:senior-sdet.extra');
      },
      /^ForbiddenGroupGranted: reviewer-audit:seat:senior-sdet\.extra:other-seat$/],
    ['ForbiddenGroupGranted:verb',
      (d) => {
        insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
          "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['npm run check','git commit'] },");
        grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
      },
      /^ForbiddenGroupGranted: senior-sdet:seat:senior-sdet\.extra:verb$/],
    ['ForbiddenGroupGranted:not-allowed',
      (d) => {
        insertInObject(d, 'tools/docgen/policy/definitions/commands.mjs', 'export const seatGroups',
          "'seat:senior-sdet.extra': { purpose: '测试构造', verbs: ['curl https://x'] },");
        grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
      },
      /^ForbiddenGroupGranted: senior-sdet:seat:senior-sdet\.extra:not-allowed$/],
    ['TemplateImpure',
      (d) => editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => `${s}\n\n- 另：\`docs/prd/\` 也不许写。\n`),
      /^TemplateImpure: tools\/docgen\/templates\/boundary\.md\.tpl:.+$/],
  ];
  // §7 报文路径口径（spec:197）：一律仓内 POSIX 相对路径；禁绝对路径 / 盘符 / 用户目录 / file://
  const ABS = /[A-Za-z]:[\\/]|\/Users\/|\/home\/|file:\/\/|\\\\[A-Za-z0-9._-]+\\/;
  const PATH_CODES = new Set(['LiteralInConfig', 'SeatNameInDefinition', 'TemplateImpure']);
  const assertReportPath = (line, code) => {
    assert.equal(line.includes('\\'), false, `${code}: 首行不得含反斜杠（spec:197 要 POSIX 相对路径）→ ${line}`);
    assert.equal(ABS.test(line), false, `${code}: 首行不得含绝对路径 / 盘符 / 用户目录 / file://（spec:197）→ ${line}`);
    if (PATH_CODES.has(code)) {
      assert.ok(line.startsWith(`${code}: tools/docgen/`),
        `${code}: 报文路径必须以仓内 POSIX 相对路径 tools/docgen/ 开头（spec:197），实得 ${line}`);
    }
  };
  for (const [name, edit, re] of CLI_CASES) {
    const r = probe(edit);
    assert.equal(r.status, 1, `${name}: 五个 CLI 码一律 exit 1（未映射会落 2）`);
    const head = r.stderr.split('\n')[0];
    assert.match(head, re, name);
    assertReportPath(head, name.split(':')[0]);
  }
  // 负例：同一片段写成绝对路径 / 盘符 / 用户目录 / file:// → 上述路径断言必红
  for (const [code, badHead] of [
    ['TemplateImpure', 'TemplateImpure: D:\\Seed\\retro-skills\\tools\\docgen\\templates\\boundary.md.tpl:{{SEAT}}'],
    ['SeatNameInDefinition', 'SeatNameInDefinition: /home/ci/repo/tools/docgen/policy/definitions/paths.mjs'],
    ['LiteralInConfig', 'LiteralInConfig: file:///d:/Seed/retro-skills/tools/docgen/policy/seat-policy.json:12'],
    ['UnknownPolicyRef', 'UnknownPolicyRef: senior-sdet:capability=C:\\Users\\ci\\admin'],
  ]) {
    assert.throws(() => assertReportPath(badHead, code), (e) => e.code === 'ERR_ASSERTION',
      `绝对路径形态必须被判红（spec:197）：${badHead}`);
  }
  // 第六码：施工期断言发射，**不是 CLI 码**
  assert.throws(() => assertGolden('reviewer-audit', `${renderBoundary('reviewer-audit')}多一字`),
    (e) => /^RenderNotEquivalent: reviewer-audit:.+/.test(String(e.message).split('\n')[0]));
  // 与 testcase:1696 的唯一偏差：第三参用断言说明（node 把字符串第二参当「期望消息」比对，
  // 而这里抛的是「未知错误码：…」，会把判据本身判红）；判据仍是「调用即抛」
  assert.throws(() => exitCodeFor('RenderNotEquivalent'), undefined, 'CLI 不引入该码');
});

test('S6-TC-D02 渲染与基准卡面不等 → Mismatch（gate 口径）', () => {
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录'", "'其他评审目录X'"));
    return runCli(d, ['gate']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^Mismatch:/m);
  assert.equal(/RenderNotEquivalent/.test(r.stderr + r.stdout), false);
});

test('S6-TC-D03 定义层出现席 slug → SeatNameInDefinition；显示名只在 seats.mjs', () => {
  // ① 静态面：权限类定义文件（capabilities / commands / paths / tiers）不得出现任何席 slug
  const slugs = agentData.map((a) => a.name);
  for (const f of ['capabilities', 'commands', 'paths', 'tiers']) {
    const src = readFileSync(`tools/docgen/policy/definitions/${f}.mjs`, 'utf8');
    assert.deepEqual(slugs.filter((s) => src.includes(s)), [], `${f}.mjs 出现席 slug`);
  }
  // ② 归属面：artifacts.owner 必须是已登记 slug；仅 progress.md 的宿主哨兵 `host`（须同时 host:true）例外
  for (const [f, v] of Object.entries(ART.artifacts)) {
    if (!v.owner) continue;
    if (v.owner === 'host') assert.equal(v.host, true, `${f}: owner=host 必须 host:true`);
    else assert.ok(slugs.includes(v.owner), `${f}: owner=${v.owner}`);
  }
  // ③ 显示名只许在 seats.mjs，且 SEATS 是**对象形态**（spec:57）
  const seatsSrc = readFileSync('tools/docgen/policy/definitions/seats.mjs', 'utf8');
  assert.match(seatsSrc, /'reviewer-audit'\s*:\s*\{\s*display\s*:\s*'审计'/);
  assert.match(seatsSrc, /'detective-observer'\s*:\s*\{\s*display\s*:\s*'侦探'/);
  for (const f of ['capabilities', 'commands', 'paths', 'artifacts', 'tiers']) {
    assert.equal(/审计|侦探/.test(readFileSync(`tools/docgen/policy/definitions/${f}.mjs`, 'utf8')), false, f);
  }
  assert.equal(/审计|侦探/.test(readFileSync('tools/docgen/templates/boundary.md.tpl', 'utf8')), false, '模板不得内联显示名');
  for (const [slug, v] of Object.entries(SEATS.SEATS)) {
    assert.ok(String(v.display ?? '').trim().length > 0, `${slug}: display 必填非空`);
    if (v.escalationWriter) {
      assert.ok(v.escalationWriter.slug && v.escalationWriter.artifact, `${slug}: escalationWriter 必须是对象 {slug, artifact}`);
      assert.ok(SEATS.SEAT_NAMES.includes(v.escalationWriter.slug), `${slug}: escalationWriter.slug 未登记`);
    }
  }
  // ④ 副本注入后的报文
  const r = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录'", "'其他评审目录-reviewer-audit'"));
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(r.status, 1);
  assert.match(r.stderr.split('\n')[0], /^SeatNameInDefinition: tools\/docgen\/policy\/definitions\/paths\.mjs$/);
});

test('S6-TC-D04 九条不变量各有 ≥1 个负例（机器可数）', () => {
  const doc = readFileSync('docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design-testcase.md', 'utf8');
  const section = (id) => {
    const i = doc.indexOf(`### ${id} `);
    assert.ok(i >= 0, `缺用例段 ${id}`);
    const j = doc.indexOf('### ', i + 4);
    return doc.slice(i, j < 0 ? undefined : j);
  };
  const INV = {
    1: ['S6-TC-B02','S6-TC-B06','S6-TC-B07'],
    2: ['S6-TC-B02','S6-TC-B14','S6-TC-B15'],
    3: ['S6-TC-D03'],
    4: ['S6-TC-B09'],
    5: ['S6-TC-B10'],
    6: ['S6-TC-C03'],
    7: ['S6-TC-C06','S6-TC-C07'],
    8: ['S6-TC-B11','S6-TC-I02'],
    9: ['S6-TC-B01'],
  };
  assert.equal(Object.keys(INV).length, 9, 'spec §3.5 现为九条不变量（v8）');
  for (const [n, ids] of Object.entries(INV)) {
    assert.ok(ids.length >= 1, `不变量 ${n} 无用例`);
    for (const id of ids) assert.match(section(id), new RegExp(`不变量\\s*${n}(?!\\d)`), `${id} 的覆盖段未声明不变量 ${n}`);
  }
  const rowOf = (id) => doc.split('\n').find((l) => l.startsWith(`| ${id} |`)) ?? '';
  for (const n of ['1','2','3','4','5','6','7','8']) {
    // 「负例」或「边界」（= 负面探针）任一即可，但不得只有正例
    assert.ok(INV[n].some((id) => /\|\s*(负|边界)\s*\|/.test(rowOf(id))), `不变量 ${n} 缺负例 / 边界例`);
  }
  assert.match(section('S6-TC-B01'), /不变量 9 负例/, '不变量 9 的负例必须在 B01 里显式声明');
});

test('S6-TC-D05 五个 CLI 码必须进 EXIT 映射；RenderNotEquivalent 不进 CLI 表', () => {
  for (const c of ['UnknownPolicyRef','LiteralInConfig','SeatNameInDefinition','ForbiddenGroupGranted','TemplateImpure']) {
    assert.equal(exitCodeFor(c), 1, c);
  }
  assert.throws(() => exitCodeFor('RenderNotEquivalent'), undefined, 'spec §7：CLI 不引入该码（由施工期断言发出）');
  assert.throws(() => exitCodeFor('FooCode'));
});

test('S6-TC-D06 gate 侧接线：配置非法 → exit 1 + 五码之一，不得落成 Mismatch', () => {
  const gateProbe = (edit) => withCopy((d) => { edit(d); return runCli(d, ['gate']); });
  // ① 配置层追加路径字面量：形态不合 ID 谓词（spec:99 第 1 档）
  const r1 = gateProbe((d) => grantGroup(d, 'reviewer-audit', 'docs/after/'));
  assert.equal(r1.status, 1, 'gate 侧必须 exit 1（不得静默放行）');
  assert.match(r1.stderr.split('\n')[0], /^LiteralInConfig: /, 'gate 首行必须是 validatePolicy 的码');
  assert.equal(/^Mismatch:/m.test(`${r1.stdout}\n${r1.stderr}`), false, '不得落成 Mismatch（那是产物比对报的）');
  // ② 授予禁止组：已登记但属禁止（spec:99 第 3 档）
  const r2 = gateProbe((d) => grantGroup(d, 'reviewer-audit', 'docgen.write'));
  assert.equal(r2.status, 1);
  assert.match(r2.stderr.split('\n')[0], /^ForbiddenGroupGranted: reviewer-audit:docgen\.write/);
  assert.equal(/^Mismatch:/m.test(`${r2.stdout}\n${r2.stderr}`), false);
});

test('S6-TC-E01 新增一条禁止路径 → 只改定义层 + 重生成两张卡 → gate 绿', () => {
  withCopy((d) => {
    const snap = () => dirHashes(join(d, 'tools/docgen'));
    const before = snap();
    editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录',", "'其他评审目录',\n    'vendor/',"));
    const red = runCli(d, ['gate']);
    assert.equal(red.status, 1, '新增一条禁止路径必须让卡面失配');
    // 与 testcase:1875 的唯一偏差：`fail(code, drift)` 的 message 缺省为码本身（cli.mjs:34）→
    // 首行是 `Mismatch: Mismatch`，不含路径；判据保留「首行是 Mismatch」（与 D02 同形态）
    assert.match(red.stderr, /^Mismatch:/m, red.stderr.split('\n')[0]);
    for (const seat of ['reviewer-audit','detective-observer']) {
      assert.ok(renderBoundaryIn(d, seat).includes('vendor/'), `${seat} 未接上定义层（渲染缺新增路径）`);
    }
    // 重生成两张卡 = 把渲染结果写回卡尾的边界节（与 replace 同效）；卡文本必须读**副本内**的卡
    for (const seat of ['reviewer-audit','detective-observer']) {
      const text = readFileSync(join(d, 'agents', `${seat}.md`), 'utf8');
      const head = text.slice(0, text.indexOf('## 边界') + '## 边界'.length);
      writeFileSync(join(d, `agents/${seat}.md`), `${head}\n${renderBoundaryIn(d, seat)}\n`, 'utf8');
    }
    const green = runCli(d, ['gate']);
    assert.equal(green.status, 0, green.stderr);
    assert.match(green.stdout, /baseline \d+\/\d+/);
    const after = snap();
    const changed = Object.keys(after).filter((k) => before[k] !== after[k]);
    assert.deepEqual(changed, [join(d, 'tools/docgen/policy/definitions/paths.mjs').replace(/\\/g, '/')],
      '改一条路径只许动一个源文件');
  });
});

test('S6-TC-E02 V-8 两形态：已登记席加组 = 1 处数据；新增席 = 2 处数据、零代码', () => {
  const hashesOf = (d) => JSON.parse(runEsm(d, `import {createHash} from 'node:crypto';
    import {renderBoundary} from './tools/docgen/components/renderBoundary.mjs';
    console.log(JSON.stringify(Object.fromEntries(['reviewer-audit','detective-observer','senior-sdet']
      .map((s) => [s, createHash('sha256').update(renderBoundary(s)).digest('hex')]))))`).stdout);
  const before = hashesOf(ROOT);
  // ① 已登记席加组 → 只改 seat-policy.mjs 一处（数据），只该席渲染变，gate 仍绿
  withCopy((d) => {
    grantGroup(d, 'senior-sdet', 'check.local');
    assert.deepEqual(changedFiles(ROOT, d), ['policy/seat-policy.mjs'], 'V-8①：已登记席加组只应改配置层一处');
    const after = hashesOf(d);
    assert.deepEqual(Object.keys(after).filter((n) => after[n] !== before[n]), ['senior-sdet']);
    assert.equal(runCli(d, ['gate']).status, 0, '卡面必须零变化（12 席不接渲染层）');
    const sd = renderBoundaryIn(d, 'senior-sdet');
    assert.equal(/undefined|null|NaN/.test(sd), false, '缺省槽渲染出未定义值');
    assert.equal(/[、，；：]{2,}|[、，；：]\s*[。；]/.test(sd), false, '缺省槽留下悬空标点');
  });
  // ② 新增席 → 两处数据、零代码；其余席渲染零变化（度量层 = 渲染层）
  withCopy((d) => {
    insertInObject(d, 'tools/docgen/policy/definitions/seats.mjs', 'export const SEATS', "'probe-seat': { display: '探针席' },");
    insertInObject(d, 'tools/docgen/policy/seat-policy.mjs', 'export const SEAT_POLICY',
      "'probe-seat': { capabilities: ['read'], allowGroups: ['check.local'], artifacts: [] },");
    assert.deepEqual(changedFiles(ROOT, d),
      ['policy/definitions/seats.mjs', 'policy/seat-policy.mjs'], 'V-8②：新增席 = 两处数据、零代码');
    const after = hashesOf(d);
    for (const s of ['reviewer-audit','detective-observer','senior-sdet']) assert.equal(after[s], before[s], `${s}: 其余席渲染不得变`);
  });
});

test('S6-TC-E03 23 项清单副本收敛到「定义层 1 处 + 2 张卡」', () => {
  const S5_TC = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md';
  const S6_SPEC = 'docs/superpowers/specs/2026-10-25-docgen-policy-single-source-design.md';
  // 与 testcase:1949 的唯一偏差：本批硬约束是「不 commit」，S6 新增文件仍在工作区**未跟踪**；
  // `git ls-files` 只看索引会把它们全漏掉（定义层 paths.mjs 缺席 → 副本集合永远凑不齐）。
  // 故加 `--others --exclude-standard`（未跟踪但未被 gitignore 的文件），扫描面语义不变。
  const ls = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' });
  assert.equal(ls.status, 0, ls.stderr);
  const files = ls.stdout.trim().split('\n')
    .filter((f) => /\.(mjs|md|tpl|json)$/.test(f))
    .filter((f) => !f.startsWith('docs/') || f === S5_TC)   // S5 spec 不在扫描面（spec:210：历史记录，只判指针）
    .filter((f) => !f.startsWith('tools/docgen/test/'))
    // 与 testcase:1952 的唯一偏差：`tools/docgen/fixtures/` 的基线与黄金快照与 `git show <改造前>:agents/<席>.md`
    // 同类（都是**改造前**的取证物，spec:169 步骤 0），不是「活跃策略副本」；不排除会让副本集合恒多 2 项
    .filter((f) => !f.startsWith('tools/docgen/fixtures/'));
  assert.deepEqual(listCopies(ROOT, files).sort(), [
    'agents/detective-observer.md', 'agents/reviewer-audit.md', 'tools/docgen/policy/definitions/paths.mjs']);
  // spec:210 的「spec 0 条手抄」：本 spec 自身不得内联整份清单（定向单文件，不把 docs/ 并入扫描面）
  assert.deepEqual(listCopies(ROOT, [S6_SPEC]), [], 'S6 spec 自身内联了整份路径清单（应只引用定义层）');
});

test('S6-TC-E04 测试零手抄：路径清单从定义层 import', () => {
  const src = readFileSync('tools/docgen/test/tool-tiers.test.mjs', 'utf8');
  assert.match(src, /import\s*\{[^}]*\}\s*from\s*'\.\.\/policy\/definitions\/paths\.mjs'/);
  assert.equal(/const FORBIDDEN_PATHS\s*=\s*\[/.test(src), false);
  assert.deepEqual(listCopies(ROOT, ['tools/docgen/test/tool-tiers.test.mjs']), []);
});

test('S6-TC-E05 S5 文档侧：spec 只加指针 + testcase 三条改判 → 0 手抄', () => {
  const S5_SPEC = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md';
  const S5_TC = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md';
  const s5 = readFileSync(S5_SPEC, 'utf8');
  const sec = (head, next) => { const i = s5.indexOf(head); const j = i < 0 ? -1 : s5.indexOf(next, i + head.length); return i < 0 ? '' : s5.slice(i, j < 0 ? undefined : j); };
  // ① 两节各自带指针（spec:122 / spec:210）
  for (const [name, body] of [['§3.3', sec('### 3.3', '### 3.4')], ['§8', sec('## 8 验收', '## 9 测试')]]) {
    assert.ok(body.length > 0, `S5 spec 缺 ${name}`);
    assert.match(body, /tools\/docgen\/policy\//, `${name} 缺「以 policy/ 为准」指针`);
    assert.match(body, /policy --dump/, `${name} 缺「policy --dump 为准」指针`);
  }
  // ② 历史记录保留：§3.3 的清单原句与 V-3 结论句仍在（只加指针、不改原句）
  assert.match(sec('### 3.3', '### 3.4'), /逐项点名/, '§3.3 的路径清单原句必须保留（历史记录，spec:210）');
  assert.match(s5, /V-3/, 'V-3 结论句必须保留（只加指针、不改原句）');
  // ③ S5 testcase 三条改判（逐条按 spec:122 写死的断言）
  const tc = readFileSync(S5_TC, 'utf8');
  const seg = (id) => { const i = tc.indexOf(`### ${id}`); return i < 0 ? '' : tc.slice(i, tc.indexOf('### ', i + 4)); };
  const WANT = {
    'S5-TC-E05': [/renderBoundary\((['"]reviewer-audit['"]|席|seat)\)/, /boundaryBySeat\[(['"]reviewer-audit['"]|席|seat)\]/],
    'S5-TC-B08': [/boundary\s*===\s*renderBoundary/],
    'S5-TC-B14': [/DEFAULT_BOUNDARY/, /!==\s*DEFAULT_BOUNDARY/],
  };
  const DEAD = `BOUNDARY${'_COMMAND'}`;   // 已删死常量名（拆写：本文件进 git 后不得被 G04② 的 grep 命中）
  for (const id of ['S5-TC-B08','S5-TC-E05','S5-TC-B14']) {
    assert.ok(seg(id).length > 0, `缺段 ${id}`);
    assert.equal(seg(id).includes(DEAD), false, `${id} 仍以已删常量为判据`);
    for (const re of WANT[id]) assert.match(seg(id), re, `${id} 未按 spec:122 改判（缺 ${re}）`);
  }
  // ④ S5 testcase 0 手抄（字面数组 + 整份清单命中数双判）+ 路径清单改派生
  assert.equal(/const\s+(FORBIDDEN_PATHS|PATH_23)\s*=\s*\[/.test(tc), false, 'S5 testcase 仍有手抄数组');
  assert.deepEqual(listCopies(ROOT, [S5_TC]), [], 'S5 testcase 仍是整份清单副本（应改为派生）');
  // 与 testcase:2020 的唯一偏差：`pathTokens` 是**判据侧派生**（S6 testcase §0.3），定义层不导出它，
  // 故 S5 testcase 的合法形态 = 「import 定义层 + 本地派生 pathTokens」；`import { pathTokens }` 不可能成立
  assert.match(tc, /import\s*\{[^}]*\bpathGroups\b[^}]*\}\s*from\s*'\.\.\/policy\/definitions\/paths\.mjs'/,
    'S5 testcase 未改为「从定义层 import」派生（spec:122 写死）');
  assert.match(tc, /const\s+pathTokens\s*=/, 'S5 testcase 未派生 pathTokens（spec:122 写死）');
  assert.equal(/22\s*项数组/.test(tc), false, 'S5 testcase 仍在称「22 项数组」（应为 21 数组元素 + 1 pattern，用 pathTokens 派生）');
});

test('S6-TC-E06 允许 / 禁止两组命令白名单同样来自定义层', () => {
  const src = readFileSync('tools/docgen/test/tool-tiers.test.mjs', 'utf8');
  assert.equal(/const ALLOWED = \[/.test(src), false);
  assert.equal(/const FORBIDDEN = \[/.test(src), false);
});

test('S6-TC-E07 定义层单源：policy/ 下无第二份边界/清单常量文件', () => {
  // 同 E03：不 commit 期间新文件未跟踪，故一并算入扫描面
  const ls = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'tools/docgen/policy'], { encoding: 'utf8' });
  assert.equal(ls.status, 0, ls.stderr);
  const files = ls.stdout.trim().split('\n').map((f) => f.replace('tools/docgen/policy/', ''));
  assert.deepEqual(files.sort(), ['definitions/artifacts.mjs','definitions/capabilities.mjs',
    'definitions/commands.mjs','definitions/paths.mjs','definitions/seats.mjs','definitions/tiers.mjs',
    'seat-policy.mjs']);
  const marks = ['只允许写','逐项点名','命令默认拒绝'];
  for (const f of files) {
    const t = readFileSync(`tools/docgen/policy/${f}`, 'utf8');
    assert.ok(marks.filter((m) => t.includes(m)).length < 2, `${f} 疑似含一份边界句`);
  }
  // ④ `tiers.mjs` 必须是真档位表（键集齐、`command` 键在、**值是工具名**），且 patternRegistry 只是 re-export
  assert.deepEqual(Object.keys(TIERS), ['readOnly','sdet','command','producer']);
  const TOOLS = new Set(Object.values(CAP.capabilities).flat());
  for (const [tier, tools] of Object.entries(TIERS)) {
    assert.ok(Array.isArray(tools) && tools.length > 0, `${tier}: 档位值必须是工具名数组`);
    for (const t of tools) assert.ok(TOOLS.has(t), `${tier}: ${t} 不是工具名（档位值不得写成 capability ID）`);
  }
  assert.equal(tierOfCapabilities(['read','exec']), 'command', 'command 档必须由 read+exec 唯一命中');
  assert.deepEqual([...CAP.capabilities.read, ...CAP.capabilities.exec], TIERS.command,
    'command 档的值必须 = read+exec 展开的工具名');
  assert.equal(patternRegistry.tools, TIERS, 'patternRegistry 必须 re-export tiers.mjs 的同一对象（严格相等）');
});

test('S6-TC-G01 agents/ 差异必须可追（字节零变化是最好情况）', () => {
  const gitOut = (args) => spawnSync('git', ['--no-optional-locks', ...args], { cwd: ROOT, encoding: 'utf8' }).stdout;
  const diffStat = gitOut(['diff', '--stat', '--', 'agents/']);
  const status = gitOut(['status', '--porcelain', '--', 'agents/']);
  const touched = [...new Set(`${diffStat}\n${status}`.split('\n')
    .map((l) => l.match(/agents\/[\w.-]+\.md/)?.[0]).filter(Boolean))];
  if (touched.length > 0) {
    // 与 testcase:2275 的唯一偏差：账单目录按 plan T10 Step 5 的**两个生命期**都认——
    // 评估期在 `.session/reviews/<…>-s6-eval/`，收口后才整目录迁 `docs/superpowers/reviews/<同名>/`；
    // 只认后者会让「评估期」这一段恒红（那时账单尚未归档）
    const evalDirs = ['docs/superpowers/reviews', join('.session', 'reviews')]
      .filter((base) => existsSync(base))
      .flatMap((base) => readdirSync(base).filter((x) => /-s6-eval$/.test(x)).map((x) => join(base, x)));
    assert.ok(evalDirs.length > 0, '有卡面差异但评估账单目录不存在 → 差异无处记账');
    const notes = evalDirs.map((d) => join(d, 'capability-diff.md')).filter((p) => existsSync(p))
      .map((p) => readFileSync(p, 'utf8')).join('\n');
    for (const f of touched) assert.ok(notes.includes(f), `${f} 有差异但 capability-diff.md 无说明行`);
  }
});

test('S6-TC-G02 gate → baseline N/N，N 派生不写死', () => {
  const N = BASELINE_RULES.length + agentPaths().length;
  const r = runCli(ROOT, ['gate']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout.trim(), new RegExp(`^baseline ${N}/${N}$`));
  // 判据自己不得写死条数（testcase:2299）：用**派生值**拼 needle，故本文件不含任何 `N/N` 字面量
  assert.equal(readFileSync('tools/docgen/test/policy-pure-source.test.mjs', 'utf8').includes(`${N}/${N}`), false);
});

test('S6-TC-G03 默认边界句的 11 席、evidence-reader 与 senior-sdet 专用边界句不变', () => {
  const own = new Set([...Object.keys(patternRegistry.boundaryBySeat), 'evidence-reader']);
  // 2026-10-31 迁移改判（S6-TC-G03 加注，原文不删）：senior-sdet 职责要写 testcase.md，与评审席模板「只允许写本次
  // 评审账本 / 禁写『代码、测试』」结构不同构 → 该席自带专用边界常量（非 renderBoundary）。
  // 计数口径：`own` 3 → 4（senior-sdet 从「既非 own 也非 default 的手写模板席」并入 own）；
  // `defSeats` 仍为 11（15 − 4 自带 − 0；原来的 `a.name !== 'senior-sdet'` 手工排除随之冗余）。
  const defSeats = agentData.filter((a) => !own.has(a.name));
  assert.equal(own.size, 4, '自带边界 = 2 producer + evidence-reader + senior-sdet');
  assert.equal(defSeats.length, 11, '卡面渲 DEFAULT_BOUNDARY 的应为 11 席（15 − 4 自带）');
  for (const a of defSeats) assert.equal(a.boundary ?? DEFAULT_BOUNDARY, DEFAULT_BOUNDARY, a.name);
  // ③ 条目自带 boundary 只许 ∈ DECLARED_SLOT_SEATS（S5 既有断言口径，spec:121；不新增守卫）
  assert.equal(agentData.filter((a) => Object.hasOwn(a, 'boundary') && !own.has(a.name)).length, 0,
    '条目自带 boundary 越出 DECLARED_SLOT_SEATS');
  const sd = agentData.find((a) => a.name === 'senior-sdet');
  assert.equal(typeof sd.boundary, 'string', 'senior-sdet 迁移后必须注入专用 boundary（B3 裁定 2026-10-31）');
  assert.equal(sd.boundary, patternRegistry.boundaryBySeat['senior-sdet']);
  assert.ok(sd.boundary.includes('只写'), '专用边界必须写「只写」清单（S4 §5.1 :132）');
  assert.equal(sha(DEFAULT_BOUNDARY), goldenOf('default-boundary'));
  assert.equal(sha(agentData.find((a) => a.name === 'evidence-reader').boundary), goldenOf('evidence-reader-boundary'));
  assert.equal(sha(sd.boundary), goldenOf('senior-sdet-boundary'), 'senior-sdet 专用边界句黄金必须对位');
});

test('S6-TC-G04 死常量已删；tool-tiers 的 import / B08 / E05 / B14 四处同批改判', () => {
  const DEAD = `BOUNDARY${'_COMMAND'}`;   // 拆写：本文件进 git 后不得被下面这条 grep 自己命中
  assert.equal(Object.hasOwn(patternRegistry, DEAD), false);
  // 无命中时 git 退出码是 1，**不得**因非 0 就抛错（议会 #3 F19 / AU-5）
  const grep = spawnSync('git', ['grep', '-l', DEAD, '--', 'tools/', 'agents/', 'skills/'],
    { cwd: ROOT, encoding: 'utf8' });
  assert.ok([0, 1].includes(grep.status), `git grep 异常退出：${grep.status}\n${grep.stderr}`);
  assert.equal(grep.stdout.trim(), '', '全仓仍有已删常量');
  const tt = readFileSync('tools/docgen/test/tool-tiers.test.mjs', 'utf8');
  assert.match(tt, /boundary,\s*renderBoundary\(/);
  assert.equal(new RegExp(`${DEAD}\\s*===\\s*'string'`).test(tt), false);
  // ⑤ 文档侧：只判三个用例条目段，历史叙述段不计
  const s5tc = readFileSync('docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md', 'utf8');
  const seg = (id) => { const i = s5tc.indexOf('### ' + id); return i < 0 ? '' : s5tc.slice(i, s5tc.indexOf('### ', i + 4)); };
  for (const id of ['S5-TC-B08','S5-TC-E05','S5-TC-B14']) {
    assert.equal(seg(id).includes(DEAD), false, id);
  }
});

test('S6-TC-G05 改定义层一条 → gate 红 → 改回绿', () => {
  withCopy((d) => {
    const edit = (from, to) => editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace(from, to));
    edit("'其他评审目录'", "'其他评审目录X'");
    assert.equal(runCli(d, ['gate']).status, 1, '改数据后 gate 必须红（渲染没接上？）');
    edit("'其他评审目录X'", "'其他评审目录'");
    const ok = runCli(d, ['gate']);
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /baseline \d+\/\d+/);
  });
});

// ===================== T6：`policy --dump` 的 F 组（F01–F06） =====================
// 与 plan Task 6 Step 1 的片段有两处**已知偏差**（按 testcase 与现文件字面量取，理由见各条注释）：
// ① F01 不照抄片段里那行恒真断言（`[...Object.keys(j.commands)].sort()` 等于什么都没验）；
// ② F06 的替换目标串按 `seats.mjs` 现文件字面量取（片段里的 `clause: '、审计表'` 已被 T4-1 改掉）。

// 标题不写「N 档」：S5-TC-E04 的计数守卫（dev-workflow-checks.mjs:192 `isTierCountLine`）
// 会把**任何非注释行**里的档位计数当硬编码判红，标题是字符串、剥不掉
test('S6-TC-F01 dump 顶层八键齐 / tiers 档位表齐（值 = 工具名）/ commands 8 组 / 每席 expanded 12 项', () => {
  const { json } = dumpPolicy(ROOT);
  assert.deepEqual(Object.keys(json).sort(),
    ['artifacts','capabilities','commands','detectionBlindSpots','paths','seatGroups','seats','tiers']);
  // tiers 顶层值 = 档位表全集（含 S2 保留档 `command` 这个无挂席键），且**值是工具名**（不是 capability ID，spec:53）
  assert.deepEqual(Object.keys(json.tiers).sort(), ['command','producer','readOnly','sdet']);
  assert.deepEqual(json.tiers, TIERS, 'dump 的 tiers 必须与 tiers.mjs 同值（值 = 工具名，不是 capability ID）');
  const TOOLS = new Set(Object.values(CAP.capabilities).flat());
  for (const [tier, tools] of Object.entries(json.tiers)) {
    for (const t of tools) assert.ok(TOOLS.has(t), `${tier}: ${t} 不是工具名（档位值不得写成 capability ID）`);
  }
  // commands = 允许 3 ∪ 禁止 5 ∪ seatGroups（spec:162；本轮 seatGroups 为空集 → 恰 8 组）
  assert.deepEqual(Object.keys(json.commands).sort(),
    [...Object.keys(CMD.commandGroups), ...Object.keys(CMD.forbiddenGroups), ...Object.keys(CMD.seatGroups ?? {})].sort(),
    'dump 的 commands 组集 ≠ 允许 3 ∪ 禁止 5 ∪ seatGroups');
  assert.equal(Object.keys(json.commands).length, 8, '本轮 seatGroups 为空集 → 恰 8 组');
  for (const [g, v] of Object.entries(json.commands)) {
    assert.ok(typeof v.purpose === 'string' && v.purpose.trim().length > 0, `${g}: purpose 缺失 / 为空`);
    assert.ok(Array.isArray(v.verbs) && v.verbs.length > 0, `${g}: verbs 缺失 / 为空`);
  }
  for (const [g, items] of Object.entries(json.paths.groups)) {
    assert.ok(Array.isArray(items) && items.length > 0, `${g}: paths 每组必须是非空数组`);
  }
  assert.equal(typeof json.paths.patterns.specPlan, 'string', 'dump 必须用正则源串表达 spec / plan（RegExp 序列化不了）');
  assert.match('spec / plan', new RegExp(json.paths.patterns.specPlan), '源串必须能命中卡面形态 spec / plan');
  assert.deepEqual(json.detectionBlindSpots, ['.session/','.superpowers/','lessons/'], '检测盲区必须恰 3 项');
  assert.equal(typeof json.seatGroups, 'object');
  // seats 键 = 配置层登记席（3 席 + `__default__`），每席 {display, expanded[12]}
  assert.deepEqual(Object.keys(json.seats).sort(), Object.keys(SEAT_POLICY).sort(), 'dump 的 seats 键 ≠ 配置层登记席');
  for (const [s, v] of Object.entries(json.seats)) {
    assert.ok(String(v.display).trim().length > 0, `${s}: display 缺失`);
    assert.ok(Array.isArray(v.expanded), s);
    assert.equal(v.expanded.length, 12, `${s}: expanded 必须是 12 个槽值（不是整段边界文本）`);
  }
});

test('S6-TC-F02 dump 槽级展开可复算 renderBoundary；两 producer 席 == 卡面边界节', () => {
  const { json } = dumpPolicy(ROOT);
  const seats = Object.keys(SEAT_POLICY).filter((x) => x !== '__default__');
  assert.deepEqual(seats, ['reviewer-audit','detective-observer','senior-sdet']);
  for (const s of seats) {
    const out = renderBoundary(s);
    const e = json.seats[s].expanded;
    assert.equal(e.length, 12, s);
    // ① 槽值确实是渲染原料（不是另拼一份）
    for (const v of e) assert.ok(out.includes(v), `${s} 槽值不在渲染文本里：${v}`);
    // ② 可派生的定位槽：槽 1 / 2 / 3 / 10 / 12（§3.4 表行序，第 n 行 → index n−1）
    assert.equal(e[0], SEATS.SEATS[s].display, `${s}: 槽 1 = SEAT`);
    assert.equal(e[1], tierOfCapabilities(SEAT_POLICY[s].capabilities), `${s}: 槽 2 = tierOfCapabilities`);
    // 槽 2 与档位表同义（spec:53）：该席 caps 展开后的工具集 == `TIERS[槽 2]`
    assert.deepEqual([...SEAT_POLICY[s].capabilities.flatMap((c) => CAP.capabilities[c])].sort(),
      [...TIERS[e[1]]].sort(), `${s}: caps 展开 ≠ TIERS[槽 2]`);
    assert.equal(e[2], SEAT_POLICY[s].capabilities.flatMap((c) => CAP.capabilities[c]).join(' / '),
      `${s}: 槽 3 = CAPABILITIES`);
    // 槽 12 = DETECTION_CMD：值必须是 `commands['git.read'].verbs` 的 status 项本身（只读引用，不复制）
    assert.equal(e[11], CMD.commandGroups['git.read'].verbs.find((v) => /status/.test(v)),
      `${s}: 槽 12 = DETECTION_CMD`);
    // 槽 10 = FORBIDDEN_PATHS：成员 23 项（pathGroups 六组展开 ∪ `spec / plan`；不是 22）
    assert.equal(e[9].split('、').filter(Boolean).length, 23, `${s}: 槽 10 成员数应为 23（不是 22）`);
    assert.ok(e[9].includes('spec / plan'), `${s}: 槽 10 必须含 spec / plan（第 23 项）`);
  }
  // ③ 两 producer 席：dump ↔ render ↔ 卡面边界节三处一致
  for (const s of ['reviewer-audit','detective-observer']) {
    assert.equal(cardBoundary(card(s)).trim(), renderBoundary(s).trim(), s);
  }
  // ④ senior-sdet：只有 read/write 档与空组；槽 5 / 槽 6 缺省 = 空串，expanded 仍 12 项
  const sd = json.seats['senior-sdet'];
  assert.equal(sd.expanded.join('').includes('docgen.read'), false, 'senior-sdet 不得含 producer 的允许组');
  assert.equal(sd.expanded.length, 12, '缺省槽不得让 expanded 变短');
  assert.equal(sd.expanded[4], '', '槽 5 = SEAT_CLAUSE：缺省未声明 → 空串');
  assert.equal(sd.expanded[5], '', '槽 6 = ESCALATION_WRITER：缺省未声明 → 空串');
  assert.equal(/undefined|null|NaN/.test(renderBoundary('senior-sdet')), false, '缺省槽渲染出未定义值');
});

test('S6-TC-F03 dump 不写仓内文件：哈希不变 + status 逐字不变 + 静态面零写盘能力', () => {
  // ① 副本内只比哈希（副本无 `.git`，不得在副本里跑 git）
  withCopy((d) => {
    const h0 = dirHashes(join(d, 'tools/docgen'));
    dumpPolicy(d);
    assert.deepEqual(dirHashes(join(d, 'tools/docgen')), h0, 'dump 写了仓内文件');
    assert.equal(existsSync(join(d, 'tools/docgen/policy.dump.json')), false, 'dump 落了 policy.dump.json');
  });
  // ② 真仓库根：dump 前后 `git status` 逐字不变
  const st = () => spawnSync('git', ['--no-optional-locks', 'status', '--porcelain', '--', 'tools/docgen'],
    { cwd: ROOT, encoding: 'utf8' }).stdout;
  const s0 = st();
  dumpPolicy(ROOT);
  assert.equal(st(), s0, 'dump 改了真仓库工作区');
  // ③ 静态守卫：定义层与三个组件不得引入写盘 / 子进程能力（「只读子命令」结构上可证，不靠一次运行观测）
  // 与 testcase:2182 的唯一偏差：额外纳入**实现 dump 本体的** `components/dumpPolicy.mjs`——
  // 少了它，「dump 不写盘」这条的发射点恰恰不在扫描面上
  for (const f of ['components/renderBoundary.mjs', 'components/dumpPolicy.mjs', 'components/validatePolicy.mjs',
    'policy/seat-policy.mjs', 'policy/definitions/capabilities.mjs', 'policy/definitions/tiers.mjs',
    'policy/definitions/commands.mjs', 'policy/definitions/paths.mjs',
    'policy/definitions/artifacts.mjs', 'policy/definitions/seats.mjs']) {
    const src = stripComments(readFileSync(join('tools/docgen', f), 'utf8'));
    assert.equal(/writeFileSync|appendFileSync|createWriteStream|node:child_process/.test(src), false,
      `${f}: 引入写盘 / 子进程能力（只读承诺无法静态成立）`);
  }
});

test('S6-TC-F04 写盘类 flag → InvalidArgs exit 2，且不落任何文件', () => {
  for (const args of [['policy','--dump','--write'], ['policy','--dump','--out','x.json'],
    ['policy','--dump','--apply']]) {
    const r = runCli(ROOT, args);                 // 只读子命令：flag 校验在写盘之前，真仓库跑无副作用
    assert.equal(r.status, 2, args.join(' '));
    assert.match(r.stderr.split('\n')[0], /^InvalidArgs: /, args.join(' '));
    assert.equal(r.stdout, '', `${args.join(' ')}: 被拒时不得往 stdout 吐 dump`);
  }
  assert.equal(existsSync(join(ROOT, 'x.json')), false, '`--out x.json` 不得建文件');
  assert.equal(existsSync(join(ROOT, 'policy.dump.json')), false);
});

test('S6-TC-F05 dump 幂等：连跑两次 stdout 逐字相等、无时间戳', () => {
  const a = runCli(ROOT, ['policy','--dump']);
  const b = runCli(ROOT, ['policy','--dump']);
  assert.equal(a.status, 0, a.stderr);
  assert.equal(b.status, 0, b.stderr);
  assert.equal(a.stdout, b.stdout, '两次 dump 的 stdout 不等（键序 / 时间戳 / 路径前缀不稳定）');
  assert.equal(/20\d\d-\d\d-\d\dT/.test(a.stdout), false, 'dump 含时间戳 → 不可复算');
});

test('S6-TC-F06 dump 与 renderBoundary 同源：定义改一处两者同变', () => {
  // ① 命令组：`check.local.verbs` 追加一条无害 verb → dump 的组长度 +1、render 出现该 verb
  const dumpBefore = JSON.stringify(dumpPolicy(ROOT).json);
  const renderBefore = renderBoundary('reviewer-audit');
  const after = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/commands.mjs',
      (s) => s.replace("'node scripts/skill-dir.mjs',",
        "'node scripts/skill-dir.mjs','node scripts/extra-check.mjs',"));
    return { dump: dumpPolicy(d).json, render: renderBoundaryIn(d, 'reviewer-audit') };
  });
  assert.notEqual(sha(JSON.stringify(after.dump)), sha(dumpBefore), 'dump 未跟随定义层变更');
  assert.notEqual(sha(after.render), sha(renderBefore), 'render 未跟随定义层变更');
  assert.equal(after.dump.commands['check.local'].verbs.length,
    JSON.parse(dumpBefore).commands['check.local'].verbs.length + 1);
  assert.ok(after.render.includes('node scripts/extra-check.mjs'), 'render 未反映定义层变更');

  // ② 槽值：改 `SEAT_CLAUSE` 的定义 → `expanded[4]` 与 render 同变。
  // **plan 片段的目标串已过时**（它写 `clause: '、审计表'`）；T4-1 已按 plan Step 2 把该行改成
  // 承接 ⑨⑩ 的长句，故按现文件字面量取（tools/docgen/policy/definitions/seats.mjs:8）。
  const CLAUSE = '、审计表；你在 `round-check.md` 核转录逐字一致';
  assert.ok(readFileSync('tools/docgen/policy/definitions/seats.mjs', 'utf8').includes(CLAUSE),
    'seats.mjs 里找不到该字面量（定义层又换了措辞？按现文件重取，勿回退到 plan 片段）');
  const clauseAfter = withCopy((d) => {
    editInDir(d, 'tools/docgen/policy/definitions/seats.mjs', (s) => s.replace(CLAUSE, `${CLAUSE}（改）`));
    return { slot: dumpPolicy(d).json.seats['reviewer-audit'].expanded[4],
      render: renderBoundaryIn(d, 'reviewer-audit') };
  });
  assert.ok(clauseAfter.slot.includes('（改）'), '槽 5（SEAT_CLAUSE）未跟随定义层变更');
  assert.ok(clauseAfter.render.includes('（改）'), 'render 未反映槽 5 变更');
});

// ===================== T7：双向下探（I 组）+ 散文子句（J 组）+ 两席等价（C01 / C02） =====================
// helper 照 testcase §0.3 / §0.4 原样追加（不重复定义本文件已有的 editInDir / withCopy / runCli / setSeatPolicy / probeDict …）

// ---- 逐项探针（I 组共用）----
const PROBE_SEAT = 'senior-sdet';          // 命令探针席（read+write、无组、无产物）
// 探针席必须按 capability 选：`senior-sdet` 是 sdet 档（read+write、**无 exec**），
// 把 `RunCommand`（exec）挂在它下面会撞不变量 9（spec:113）→ 必红（后端复核第 2 轮 BE-6）
const probeSeatOf = (cap) => (cap === 'exec' ? 'reviewer-audit' : PROBE_SEAT);
// I01 的「合法使用该项」最小改动：命令 → 挂该组；产物 → 加进 artifacts；工具 → 加该 capability
function applyLegalGrant(dir, p) {
  const cur = SEAT_POLICY[p.seat] ?? SEAT_POLICY.__default__;
  setSeatPolicy(dir, p.seat, {
    capabilities: [...new Set([...cur.capabilities, ...(p.cap ? [p.cap] : [])])],
    allowGroups: [...new Set([...cur.allowGroups, ...(p.group ? [p.group] : [])])],
    artifacts: [...new Set([...cur.artifacts, ...(p.kind === 'artifact' ? [p.id] : [])])],
  });
}
// 允许侧：允许组 verbs（逐条）+ 各席可写产物（逐项）+ 6 个工具（逐个，按 capability 选席）；条数由定义层现算
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
// 期望集**独立拼**（不调用 allowProbes / denyProbes）：六个来源各自从定义层直接铺开。
// 为什么不能复用探针构造器：同源时期望集跟着构造器一起变短（`slice(0,1)` 后两边仍相等 → 本条恒绿、I03 失去判别力）。
const expectedProbeKeys = () => [
  ...Object.entries(CMD.commandGroups).flatMap(([, g]) => g.verbs.map((v) => `cmd:${v}@${PROBE_SEAT}`)),
  ...Object.entries(SEAT_POLICY).filter(([s]) => s !== '__default__')
    .flatMap(([s, p]) => p.artifacts.map((a) => `artifact:${a}@${s}`)),
  ...Object.entries(CAP.capabilities).flatMap(([cap, list]) => list.map((t) => `tool:${t}@${probeSeatOf(cap)}`)),
  ...Object.values(CMD.forbiddenGroups).flatMap((g) => g.verbs.map((v) => `deny-verb:${v}@${PROBE_SEAT}`)),
  ...pathTokens().map((p) => `path:${p}@${PROBE_SEAT}`),
  ...Object.keys(CMD.forbiddenGroups).map((g) => `deny-group:${g}@reviewer-audit`),
];
// 允许命令 token（组内 verbs 拍平）：I01 用它现算「命令探针条数」，不写死条数
const commandTokens = () => Object.values(CMD.commandGroups).flatMap((g) => g.verbs);

// ---- 逐项探针的记账（I 组共用；I03 断言键集与执行次数）----
// 键带席名（`kind:id@seat`）：同一 id 挂不同席是**两项**（`exec` 探针挂 `reviewer-audit`、其余挂 `senior-sdet`）——
// 不带席名会让两项互相覆盖，`每项恰 1 次` 就判不出来。
const probesRun = new Map();
const noteProbe = (p) => { const k = `${p.kind}:${p.id}@${p.seat}`; probesRun.set(k, (probesRun.get(k) ?? 0) + 1); };

// ---- J 组：10 个断言点 = 8 条 ⑤ 段通用子句（`scope:'seg5'`）+ 2 条席职责（`scope:'card'` = **卡级子句**）----
// ⑨⑩ 是**席职责句**、不是 ⑤ 段的越界后果要素 → V-12 的「⑤ 段存在性」只约束 ①–⑧；⑨⑩ 只在整张卡上判「职责句在位」。
const CLAUSES = [
  { k: '①', why: '越权清单指名文件', scope: 'seg5', re: /越权[\s\S]{0,200}`[\w./-]+\.(md|mjs|json)`/ },
  { k: '②', why: '改前 / 改后 sha256', scope: 'seg5', re: /sha256/i },
  { k: '③', why: '是否可复原', scope: 'seg5', re: /可复原|能否复原|可恢复/ },
  { k: '④', why: '越权清单含「命令原文」（或给出反引号命令实例）', scope: 'seg5', re: /越权[\s\S]{0,240}(命令原文|`(git|node|npm) )/ },
  { k: '⑤', why: '用户执行复原', scope: 'seg5', re: /用户[^。]{0,6}执行|由用户[^。]{0,8}(复原|恢复)/ },
  { k: '⑥', why: '本轮结论作废', scope: 'seg5', re: /本轮[^。]{0,20}(作废|失效)|(作废|失效)[^。]{0,10}本轮/ },
  { k: '⑦', why: '检测限度点名 .session/ 盲区', scope: 'seg5', re: /\.session\// },
  { k: '⑧', why: '检测命令带 --no-optional-locks', scope: 'seg5', re: /git --no-optional-locks status/ },
  { k: '⑨', why: '审计职责：核转录（**卡级**，不属 ⑤ 段存在性）', scope: 'card', seat: 'reviewer-audit', re: /核转录/ },
  { k: '⑩', why: '侦探职责：本席不核签（**卡级**，不属 ⑤ 段存在性）', scope: 'card', seat: 'detective-observer', re: /本席不核签/ },
];
// ⑤ 段 = 从「越[界权]后果与限度」到渲染结束（先切段再断言，防 ②/④ 段的同名措辞串味 —— 议会 #3 F24）
// 锚点 `SEG5` 由抽取器导出（**只有一份**，不在本文件重复声明）
const seg5 = (text) => { const m = String(text).match(SEG5); return m ? text.slice(m.index) : ''; };
function assertNeedClauses(text, seat = 'reviewer-audit') {
  const seg = seg5(text);
  assert.ok(seg.length > 0, '缺 ⑤ 段（越界后果与限度）');
  for (const c of CLAUSES) {
    if (c.seat && c.seat !== seat) continue;
    // scope:'seg5' → 只在 ⑤ 段切片上判；scope:'card' → 整张卡上判（⑨⑩ 现文在 ② 段 / 槽 5，属正常）
    assert.match(c.scope === 'seg5' ? seg : text, c.re,
      `缺${c.scope === 'seg5' ? ' ⑤ 段' : '卡面（卡级）'}要素 ${c.k}：${c.why}`);
  }
  return seg;
}
// 逐子句「缺哪几条」：J02 用它做精确红点断言（assertNeedClauses 只报**第一条**缺，无法证明「删 ⑧ 却报 ⑦」这类错位）
const missingClauses = (text, seat = 'reviewer-audit') => CLAUSES
  .filter((c) => !c.seat || c.seat === seat)
  .filter((c) => !c.re.test(c.scope === 'seg5' ? seg5(text) : text))
  .map((c) => c.k);

test('S6-TC-I01 允许集逐项「用不被拦」（命令 / 可写产物 / 6 工具，按 capability 选席）', () => {
  const allow = allowProbes();
  // 恒真式（三部分相加 = 总数）不提供判别力 → 改结构断言：每项 kind/id/seat 齐，且键（含席名）不重名
  for (const p of allow) {
    assert.ok(['cmd', 'artifact', 'tool'].includes(p.kind), `探针缺 kind：${JSON.stringify(p)}`);
    assert.ok(String(p.id ?? '').length > 0, `探针缺 id：${JSON.stringify(p)}`);
    assert.ok(String(p.seat ?? '').length > 0, `探针缺 seat：${p.kind}:${p.id}`);
  }
  assert.equal(new Set(allow.map((p) => `${p.kind}:${p.id}@${p.seat}`)).size, allow.length,
    '允许侧探针键重名（会互相覆盖计数）');
  // 命令探针条数 = 定义层允许命令总数（现算，不写死）
  assert.equal(allow.filter((p) => p.kind === 'cmd').length, commandTokens().length,
    '命令探针条数 ≠ 定义层允许命令总数');
  for (const p of allow) {
    noteProbe(p);
    withCopy((d) => {
      applyLegalGrant(d, p);
      const r = runCli(d, ['policy', '--dump']);
      assert.equal(r.status, 0, `允许项被判红：${p.kind}:${p.id}@${p.seat}\n${r.stderr}`);
      assert.ok(renderBoundaryIn(d, p.seat).includes(p.id), `允许项在卡面不可指涉：${p.kind}:${p.id}@${p.seat}`);
    });
  }
});

test('S6-TC-I02 禁止集逐项必红（verb / 23 路径 / 5 禁止组），期望码由形态现算', () => {
  for (const p of denyProbes()) {
    noteProbe(p);
    const r = withCopy((d) => { grantGroup(d, p.seat, p.id); return runCli(d, ['policy', '--dump']); });
    assert.equal(r.status, 1, `${p.kind}:${p.id}@${p.seat}`);
    const first = r.stderr.split('\n')[0];
    if (p.kind === 'deny-group') assert.equal(first, `ForbiddenGroupGranted: ${p.seat}:${p.id}:forbidden`);
    else assert.ok(first.startsWith(`${expectedRefCode(p.id)}: `), `${p.id} 期望码 ${expectedRefCode(p.id)}，实得 ${first}`);
  }
});

test('S6-TC-I03 探针完备：键集 = 允许侧 ∪ 禁止侧，每项恰 1 次，禁抽样', () => {
  const expected = new Set(expectedProbeKeys());
  assert.deepEqual([...probesRun.keys()].sort(), [...expected].sort(), '探针表与应有集合不一致（漏项 / 多项）');
  for (const [k, n] of probesRun) assert.equal(n, 1, `探针未执行或重复：${k}`);
  // kind:id@seat 唯一：同 id 不同 kind / 不同席不得互相覆盖
  assert.equal(new Set([...probesRun.keys()]).size, probesRun.size);
  // 负例：从应有集合删一项 → 键集必不等
  const dropped = new Set([...expected].slice(1));
  assert.notDeepEqual([...dropped].sort(), [...probesRun.keys()].sort(), '删项后键集仍相等 → 判据恒真');
  // 独立性守卫：期望集不得由探针构造器派生（否则构造器被截断时期望集同步变短 → 本条恒绿）
  assert.equal(/allowProbes|denyProbes/.test(String(expectedProbeKeys)), false,
    'expectedProbeKeys 不得调用探针构造器（期望集与构造器同源 = I03 失去判别力）');
  // 反抽样静态守卫：判**构造器本体源码**而非变量名字面量 → 改名也绕不过（改名后本条与 I01 / I02 同时失配）
  for (const [name, fn] of [['allowProbes', allowProbes], ['denyProbes', denyProbes]]) {
    assert.equal(/\.slice\(/.test(String(fn)), false, `禁止抽样：${name} 不得截断（.slice）`);
  }
});

test('S6-TC-J01 ⑤ 段 8 条子句 + 卡级 2 条职责句', () => {
  for (const seat of ['reviewer-audit', 'detective-observer']) {
    const out = renderBoundary(seat);
    const seg = assertNeedClauses(out, seat);      // 内部先 seg5() 再逐条断言；不抛 = 全齐
    assert.match(seg, /^越[界权]后果与限度/,
      `${seat}: ⑤ 段切点不对（现文与 spec §3.4 均写「越界后果与限度」；两写法都认）`);
  }
  // ⑨⑩ = **卡级**子句（scope:'card'）：现文在 ② 段 / 槽 5，故 V-12 的「⑤ 段」口径只覆盖 ①–⑧
  assert.equal(CLAUSES.filter((c) => c.scope === 'seg5').length, 8, '⑤ 段通用子句应为 8 条（V-12 的 ⑤ 段口径只覆盖这 8 条）');
  assert.equal(CLAUSES.filter((c) => c.scope === 'card').length, 2, '⑨⑩ = 卡级席职责 2 条（不属 ⑤ 段，不得按 seg5 判）');
  assert.equal(CLAUSES.filter((c) => c.seat && c.scope !== 'card').length, 0, '凡带 seat 的子句必须是卡级');
});

test('S6-TC-J02 负例：8 类子句各删一处 → 各红一次', () => {
  const AUD = 'reviewer-audit';
  const DET = 'detective-observer';
  const TPL = 'tools/docgen/templates/boundary.md.tpl';
  const SEATS_REL = 'tools/docgen/policy/definitions/seats.mjs';
  const cutText = (re) => (d) => editInDir(d, TPL, (s) => s.replace(re, ''));
  const cutSentence = (re) => (d) => editInDir(d, TPL, (s) => s.split(/(?<=。)/).filter((sen) => !re.test(sen)).join(''));
  // 偏离已签 J02 的删除靶点（plan Task 4 Step 2 把 ⑨⑩ 落到 seats.mjs 的 clause），判据语义不变：
  // 删掉该职责句后 missingClauses 必须含该条
  const cutClause = (re) => (d) => editInDir(d, SEATS_REL, (s) => s.replace(re, ''));
  // ⑨ 的措辞在模板 ② 段另有一处（「你只核转录是否逐字一致」）：只删 clause 时卡面仍命中 → 红点永远打不中（判据恒真），
  // 故两处同删（「删掉该职责句」= 删掉卡面上的该职责表述，不只是它的某一份载体）
  const cutClauseAndTpl = (clauseRe, tplRe) => (d) => {
    cutClause(clauseRe)(d);
    editInDir(d, TPL, (s) => s.replace(tplRe, ''));
  };
  const DEL = [
    { k: '②', seat: AUD, pool: /sha256/i, cut: cutText(/sha256/gi), exact: true },
    { k: '③', seat: AUD, pool: /可复原/, cut: cutText(/可复原|能否复原|可恢复/g), exact: true },
    { k: '⑤', seat: AUD, pool: /用户[^。]{0,6}执行/, cut: cutText(/用户执行/g), exact: true },
    { k: '⑥', seat: AUD, pool: /本轮[^。]{0,20}(作废|失效)/, cut: cutText(/本轮[^。]{0,20}(作废|失效)/g), exact: true },
    { k: '⑦', seat: AUD, pool: /\.session\//, cut: cutSentence(/检测限度/), exact: false },
    { k: '⑧', seat: AUD, pool: /git --no-optional-locks status/, cut: cutSentence(/检测限度/), exact: false },
    // ⑨⑩ = 卡级子句：按整卡判「职责句缺了」，不按 seg5 切片判
    { k: '⑨', seat: AUD, pool: /核转录/, cut: cutClauseAndTpl(/核转录/g, /核转录/g), exact: true },
    { k: '⑩', seat: DET, pool: /本席不核签/, cut: cutClause(/本席不核签/g), exact: true },
  ];
  for (const c of DEL) {
    const whole = renderBoundary(c.seat);
    assert.ok(countIn(seg5(whole), c.pool) >= 1 || countIn(whole, c.pool) >= 1,
      `删除前要素 ${c.k} 至少出现 1 次（否则删句定位不准）`);
    const hit = withCopy((d) => { c.cut(d); return renderBoundaryIn(d, c.seat); });
    const miss = missingClauses(hit, c.seat);
    if (c.exact) assert.deepEqual(miss, [c.k], `删 ${c.k} 后缺项应为 [${c.k}]，实得 [${miss.join(',')}]（红点未对位）`);
    else assert.ok(miss.includes(c.k), `删 ${c.k} 后缺项 = [${miss.join(',')}]（未命中目标）`);
  }
});

test('S6-TC-J03 边界：措辞重排但要素齐 → 仍绿（哈希不等也允许）', () => {
  withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('立即停手', '立即停止操作'));
    const out = renderBoundaryIn(d, 'reviewer-audit');
    assert.doesNotThrow(() => assertNeedClauses(out, 'reviewer-audit'), '② 要素齐即绿');
    assert.notEqual(sha(out), goldenOf('reviewer-audit'), '③ 合法改写必须让哈希不等（v5 口径下会被误判）');
    assert.equal(verdict(diffFacts(baseJson().seats['reviewer-audit'],
      factsFromText(out, probeDict(d)))), 'pass', '④ 能力没丢（字典按副本现算）');
  });
});

test('S6-TC-C01 审计席：哈希只作定位，判据 = 能力 diff 空 + J01 子句齐', () => {
  const seat = 'reviewer-audit';
  const hashEqual = sha(renderBoundary(seat)) === goldenCurOf(seat);   // ① 只取事实（当前比对键，spec:198）
  assert.equal(typeof hashEqual, 'boolean');
  assert.deepEqual(diffFacts(baseJson().seats[seat], factsFromText(renderBoundary(seat), probeDict())),
    { minus: [], plus: [] }, `${seat}: 能力 diff 非空`);              // ② 唯一通过判据
  assert.doesNotThrow(() => assertNeedClauses(renderBoundary(seat), seat));  // ③
  assert.match(renderBoundary(seat), /审计\s*写\s*`round-check\.md`/, '④ 槽 6：审计席应渲染「本席自写」形态');
  // ⑤ 黄金**基线键**的来源 = 改造前（旧卡边界节），不是改造后渲染自哈希
  const before = cardBoundary(gitShow(baseJson().sourceCommit, `agents/${seat}.md`)).trim();
  assert.equal(goldenOf(seat), sha(before), `${seat}: 黄金基线键必须取自改造前文本（spec:172）`);
  // ⑤' 当前比对键（spec:198）：有 `<席>@<轮次>` 取轮次最大者，无则基线键
  const rounds = Object.keys(golden()).filter((k) => k.startsWith(`${seat}@`)).map((k) => Number(k.split('@')[1]));
  assert.equal(goldenKeyFor(seat), rounds.length > 0 ? `${seat}@${Math.max(...rounds)}` : seat,
    `${seat}: 当前比对键必须取轮次最大者，无换代键则回落基线键`);
  // ⑥ 负例：若黄金取「改造后渲染自哈希」→ 模板改一字仍判相等（hashEqual 恒真）→ 必红
  withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('**档位事实**', '**档位 事实**'));
    const out = renderBoundaryIn(d, seat);
    assert.notEqual(out, renderBoundary(seat), '构造未生效：模板未被改动');
    assert.notEqual(sha(out), goldenCurOf(seat), '黄金取自改造后 → 文本变了仍判相等（hashEqual 恒真）→ 必红');
  });
  // ⑦ 负例：换代后仍取旧基线键 → 换代文本 ≠ 基线键 → hashEqual 恒 false（定位线索失效）→ 必红
  const cur = renderBoundary(seat);
  const newText = `${cur}\n<!-- V-13 换代后追加的措辞 -->`;
  const gen = { ...golden(), [`${seat}@1`]: sha(`${cur}\n<!-- round 1 -->`), [`${seat}@2`]: sha(newText) };
  assert.equal(goldenKeyFor(seat, gen), `${seat}@2`, '换代后必须取轮次最大的键（spec:198）');
  assert.equal(gen[goldenKeyFor(seat, gen)], sha(newText), '当前比对键必须命中换代后的文本');
  assert.notEqual(sha(newText), gen[seat], '换代后仍取旧基线键 → 定位线索失效 → 必红');
});

test('S6-TC-C02 侦探席：同口径（哈希只作定位）', () => {
  const seat = 'detective-observer';
  const hashEqual = sha(renderBoundary(seat)) === goldenCurOf(seat);   // 当前比对键（spec:198）
  assert.equal(typeof hashEqual, 'boolean');
  assert.deepEqual(diffFacts(baseJson().seats[seat], factsFromText(renderBoundary(seat), probeDict())),
    { minus: [], plus: [] }, `${seat}: 能力 diff 非空`);
  assert.doesNotThrow(() => assertNeedClauses(renderBoundary(seat), seat));
  // 与 testcase:1391 的唯一偏差：⑩ 是**卡级**子句（CLAUSES 标 `scope:'card'`，J01 已裁定它不在 ⑤ 段；
  // 现文落在槽 5「只允许写」段）→ 按整卡判，不按 seg5 切片判（照切片写会恒红，且与 J01 口径冲突）
  assert.match(renderBoundary(seat), /本席不核签/, '侦探职责子句缺失（卡级）');
  assert.match(renderBoundary(seat), /交\s*审计\s*在\s*`round-check\.md`\s*独立复算/, '④ 槽 6：侦探席应渲染「他席写」形态');
  // ⑤ 黄金**基线键**来源 = 改造前（旧卡边界节）
  const before = cardBoundary(gitShow(baseJson().sourceCommit, `agents/${seat}.md`)).trim();
  assert.equal(goldenOf(seat), sha(before), `${seat}: 黄金基线键必须取自改造前文本（spec:172）`);
  // ⑤' 当前比对键（spec:198）
  const rounds = Object.keys(golden()).filter((k) => k.startsWith(`${seat}@`)).map((k) => Number(k.split('@')[1]));
  assert.equal(goldenKeyFor(seat), rounds.length > 0 ? `${seat}@${Math.max(...rounds)}` : seat,
    `${seat}: 当前比对键必须取轮次最大者，无换代键则回落基线键`);
  // ⑥ 负例：自哈希口径 → 文本变了仍「相等」→ 必红
  withCopy((d) => {
    editInDir(d, 'tools/docgen/templates/boundary.md.tpl', (s) => s.replace('**档位事实**', '**档位 事实**'));
    const out = renderBoundaryIn(d, seat);
    assert.notEqual(out, renderBoundary(seat), '构造未生效：模板未被改动');
    assert.notEqual(sha(out), goldenCurOf(seat), '黄金取自改造后 → 文本变了仍判相等（hashEqual 恒真）→ 必红');
  });
  // ⑦ 负例：换代后仍取旧基线键 → 定位线索失效 → 必红
  const cur = renderBoundary(seat);
  const newText = `${cur}\n<!-- V-13 换代后追加的措辞 -->`;
  const gen = { ...golden(), [`${seat}@1`]: sha(`${cur}\n<!-- round 1 -->`), [`${seat}@2`]: sha(newText) };
  assert.equal(goldenKeyFor(seat, gen), `${seat}@2`, '换代后必须取轮次最大的键（spec:198）');
  assert.equal(gen[goldenKeyFor(seat, gen)], sha(newText), '当前比对键必须命中换代后的文本');
  assert.notEqual(sha(newText), gen[seat], '换代后仍取旧基线键 → 定位线索失效 → 必红');
});

// ===================== T9：全量 + 反向 + 基线恒真复核（A09 / H01–H07） =====================
// helper 照 testcase §0.4 原样追加（不重复定义本文件已有的 baseJson / gitShow / probeDict / verdict / diffFacts / setSeatPolicy / grantGroup）

// 抽取器必须**被执行**（不是只 grep 源码）：runEsm 真跑一遍，文本经 base64 传入（换行 / 反引号都不会被 shell 吃掉）。
// 只用**基线端切分口径**（`spec:169` §6 步骤 0 ④：步骤 0 尚无定义层 → 不注入字典）；
// 改造后端的字典匹配由本文件直接 `import { factsFromText }` 后调用（H02/H03/H04/H05）。
const runBaselineExtractor = (dir, text) => {
  const b64 = Buffer.from(text, 'utf8').toString('base64');
  const r = runEsm(dir, `import { factsFromBaselineText } from './tools/docgen/test/support/capability-baseline.mjs';
const text = Buffer.from(${JSON.stringify(b64)}, 'base64').toString('utf8');
console.log(JSON.stringify(factsFromBaselineText(text)));`);
  assert.equal(r.status, 0, `基线端抽取器执行失败（${dir}）\n${r.stderr}`);
  return JSON.parse(r.stdout);
};
// 「改造前」守卫（`spec:169` 步骤 0）：基线 commit 必须早于 `policy/` 与 `renderBoundary.mjs` 出现
function assertBaselinePrior(base) {
  assert.match(base.sourceCommit, /^[0-9a-f]{40}$/, '基线缺 sourceCommit（40 位十六进制）');
  const has = (rev, p) => spawnSync('git', ['cat-file', '-e', `${rev}:${p}`], { cwd: ROOT, encoding: 'utf8' }).status === 0;
  assert.equal(has(base.sourceCommit, 'tools/docgen/policy'), false, '基线 commit 必须早于 policy/ 出现');
  assert.equal(has(base.sourceCommit, 'tools/docgen/components/renderBoundary.mjs'), false, '基线 commit 必须早于 renderBoundary 出现');
}
// 账单目录：评估期在 `.session/reviews/<…>-s6-eval/`，收口后才整目录迁 `docs/superpowers/reviews/<同名>/`
// （与 G01 同一处置：只认后者会让「评估期」这一段恒红）
const evalDir = () => {
  const found = ['docs/superpowers/reviews', join('.session', 'reviews')]
    .filter((base) => existsSync(base))
    .flatMap((base) => readdirSync(base).filter((d) => /-s6-eval$/.test(d)).map((d) => join(base, d)));
  assert.equal(found.length, 1, `应恰有 1 个 *-s6-eval 账单目录（实得 ${found.length}）`);
  return found[0];
};
// 「改造后 HEAD」的客观标志：未提交时 HEAD 里没有 `policy/` → H07a ①② 无法成立（不是实现错）。
// 该常量同时是 H07a 的跳过条件（见该测试的 skip 文案）；H07b ③④ 不依赖它，无条件执行。
const HEAD_HAS_POLICY = spawnSync('git', ['cat-file', '-e', 'HEAD:tools/docgen/policy'], { cwd: ROOT, stdio: 'ignore' }).status === 0;

test('S6-TC-A09 卡面 CRLF / BOM → gate 必报 Mismatch（禁归一化后判绿）', () => {
  const CASES = [
    { name: 'CRLF', fn: (d) => editInDir(d, 'agents/reviewer-audit.md', (s) => s.replace(/\r?\n/g, '\r\n')) },
    { name: 'BOM', fn: (d) => editInDir(d, 'agents/reviewer-audit.md', (s) => `\uFEFF${s}`) },
  ];
  for (const c of CASES) {
    withCopy((d) => {
      c.fn(d);
      const r = runCli(d, ['gate']);
      assert.equal(r.status, 1, `${c.name}: 卡面 CRLF/BOM 必须判红（spec:124 不静默归一化）`);
      assert.match(r.stderr, /^Mismatch:/m, `${c.name}: 期望 Mismatch，实得 ${r.stderr.split('\n')[0]}`);
    });
  }
  // 渲染侧必须只产 `\n`、且不带 BOM（与盘上无关）
  for (const s of ['reviewer-audit', 'detective-observer']) {
    const out = renderBoundary(s);
    assert.equal(out.includes('\r'), false, `${s}: 渲染含 CR`);
    assert.equal(out.startsWith('\uFEFF'), false, `${s}: 渲染带 BOM`);
  }
});

test('S6-TC-H01 基线同源可复算（sourceCommit 早于 policy/ + 抽取器真执行 + 黄金 8 字段）', () => {
  const base = baseJson();
  const git = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  // ① 基线必带 sourceCommit（40 位十六进制）与两席键
  assert.match(base.sourceCommit, /^[0-9a-f]{40}$/, '基线缺 sourceCommit（40 位十六进制）');
  assert.deepEqual(Object.keys(base.seats).sort(), ['detective-observer', 'reviewer-audit']);
  assert.equal(git(['cat-file', '-e', `${base.sourceCommit}^{commit}`]).status, 0, 'sourceCommit 不是仓内对象');
  // ② 基线 commit 必须早于改造（= H07 ① 的「改造前」那一半；「HEAD 上两者都在」那半条归 H07，未提交时跳过）
  assert.notEqual(git(['cat-file', '-e', `${base.sourceCommit}:tools/docgen/policy`]).status, 0,
    '基线 commit 上出现 tools/docgen/policy → 基线取自改造后（diff 恒空、判据归零）');
  assert.notEqual(git(['cat-file', '-e', `${base.sourceCommit}:tools/docgen/components/renderBoundary.mjs`]).status, 0,
    '基线 commit 上出现 renderBoundary.mjs → 基线取自改造后');
  // ③ 抽取器**真执行**复算（不是只 grep 源码）：基线端 = 旧卡切分口径、不传字典
  for (const s of Object.keys(base.seats)) {
    assert.deepEqual(runBaselineExtractor(ROOT, gitShow(base.sourceCommit, `agents/${s}.md`)), base.seats[s],
      `${s}: 基线不可由抽取器复算（基线手抄 或 抽取规则漂移）`);
  }
  // ⑤ 静态面（= H07 ③）：抽取器不得 import / 引用定义层，否则基线随改造后数据抖动
  const ex = stripComments(readFileSync('tools/docgen/test/support/capability-baseline.mjs', 'utf8'));
  assert.equal(/policy\//.test(ex), false, '基线抽取器不得依赖定义层');
  // ④ 差异可追 + 越界可抓：只许两张 producer 卡相对基线有差异（其余 12 席不接渲染层，spec:117）
  const changedCards = git(['diff', '--name-only', `${base.sourceCommit}..HEAD`, '--', 'agents/'])
    .stdout.split('\n').map((l) => l.trim()).filter(Boolean).map((p) => p.replace(/\\/g, '/'));
  // S4 起 15 席逐席重生成（spec §8）：允许面改为「已登记席卡」（未登记卡的越界由 TC-D02 与 gate 的
  // UnregisteredHandwritten 兜）；S6 的记账义务只落在本段自己的两张 producer 卡上
  const SEAT_CARDS = agentData.map((a) => `agents/${a.name}.md`);
  for (const f of changedCards) {
    assert.ok(SEAT_CARDS.includes(f),
      `${f} 越界：只允许已登记席卡相对基线有差异（未登记卡由 TC-D02 / gate UnregisteredHandwritten 兜）`);
  }
  const S6_CARDS = ['agents/reviewer-audit.md', 'agents/detective-observer.md'];
  const needNotes = changedCards.filter((f) => S6_CARDS.includes(f));
  if (needNotes.length > 0) {
    const diffNotes = readFileSync(join(evalDir(), 'capability-diff.md'), 'utf8');
    for (const f of needNotes) {
      assert.ok(diffNotes.includes(basename(f)), `${f} 有差异但 capability-diff.md 无说明行（按 basename 匹配）`);
    }
  }
  // ⑥ 两条取数命令原文必须出现在 checklist.md 的「交付说明」节
  const notes = readFileSync(join(evalDir(), 'checklist.md'), 'utf8');
  assert.ok(notes.includes(`git show ${base.sourceCommit}:agents/reviewer-audit.md`), '缺 A 组取数命令原文');
  assert.match(notes, /capability-baseline/, '缺基线导出命令原文');
  // ⑦ 抽取规则 + 黄金样本：同一抽取器真执行、独立复算（不由被测代码生成）
  const gold = JSON.parse(readFileSync('tools/docgen/fixtures/capability-baseline.golden.json', 'utf8'));
  assert.deepEqual(Object.keys(gold).sort(), [...FACTS_KEYS].sort(), '黄金样本必须 8 字段');
  assert.deepEqual(gold, runBaselineExtractor(ROOT, gitShow(base.sourceCommit, 'agents/reviewer-audit.md')),
    '黄金样本 ≠ 抽取器（基线端切分口径）对基线审计席的输出（抽取规则漂移）');
});

test('S6-TC-H02 五段事实集合逐席 diff 空差', () => {
  const base = baseJson();
  const dict = probeDict();
  const { json } = dumpPolicy(ROOT);
  // `tier` 是字符串 → 先装箱成数组（后端复核第 2 轮 BE-5）
  const norm = (v) => (Array.isArray(v) ? v : v == null ? [] : [v])
    .flatMap((x) => String(x).split('、')).map((x) => x.trim().replace(/^`|`$/g, '')).filter(Boolean);
  const POOL = { tools: dict.tools, tier: dict.tiers, canWrite: dict.artifacts, mustNotWrite: dict.artifacts,
    forbiddenPaths: dict.paths, allowCmds: dict.allowVerbs, denyCmds: dict.denyVerbs, envForms: dict.envVerbs };
  for (const s of ['reviewer-audit', 'detective-observer']) {
    const before = base.seats[s];
    const after = factsFromText(renderBoundary(s), dict);       // 判据端 = 渲染文本 + 定义层字典（不是 dump）
    assert.deepEqual(Object.keys(before).sort(), [...FACTS_KEYS].sort(), `${s}: 基线五段键集不全`);
    assert.deepEqual(Object.keys(after).sort(), [...FACTS_KEYS].sort(), `${s}: 改造后五段键集不全`);
    assert.deepEqual(diffFacts(before, after), { minus: [], plus: [] }, s);
    // ⑤' ③ 段成员数 = 23（不是 22）：`spec / plan` 必须能被取到
    assert.equal(after.forbiddenPaths.length, 23, `${s}: ③ 段成员数应为 23（含 spec / plan）`);
    assert.ok(after.forbiddenPaths.includes('spec / plan'), `${s}: factsFromText 必须取到 spec / plan`);
    // ⑤' 两端可比前提（spec:169 ④）：基线成员 ⊆ 定义层字典（否则字典同步缩水 → 差集恒空）
    for (const k of FACTS_KEYS) {
      for (const m of norm(before[k])) {
        assert.ok(POOL[k].includes(m),
          `${s}: 基线成员 ${k}:${m} 不在定义层字典里（基线切分口径错 或 定义层丢项 → 判据将恒真）`);
      }
    }
    // ⑥ 交叉核对：dump 端同形事实 + 同一字典，逐项相等（`denyCmds` 已剔除 env.assign → 与 dump 槽同口径）
    const viaDump = factsFromDump(json, s, dict);
    for (const k of FACTS_KEYS.filter((x) => x !== 'mustNotWrite')) {
      assert.deepEqual([...new Set(norm(viaDump[k]))].sort(), [...new Set(norm(after[k]))].sort(), `${s}: ${k} 渲染端 ≠ dump 端`);
    }
  }
});

test('S6-TC-H03 负例：少一项路径 → minus 出现 forbiddenPaths → 必红', () => {
  const d = withCopy((dir) => {
    editInDir(dir, 'tools/docgen/policy/definitions/paths.mjs', (s) => s.replace("'其他评审目录',", ''));
    // 字典必须按**副本**现算，否则删掉的那项不在字典里、`minus` 恒空
    return diffFacts(baseJson().seats['reviewer-audit'],
      factsFromText(renderBoundaryIn(dir, 'reviewer-audit'), probeDict(dir)));
  });
  assert.deepEqual(d.plus, []);
  assert.equal(d.minus.length, 1);
  assert.match(d.minus[0], /^forbiddenPaths: /);
  assert.equal(verdict(d), 'fail');
});

test('S6-TC-H04 负例：删一条允许命令 → minus 出现 allowCmds → 必红', () => {
  const before = baseJson().seats['reviewer-audit'].allowCmds.length;
  const after = withCopy((dir) => {
    editInDir(dir, 'tools/docgen/policy/definitions/commands.mjs',
      (s) => s.replace(/\s*'node scripts\/skill-dir\.mjs',/, ''));
    return factsFromText(renderBoundaryIn(dir, 'reviewer-audit'), probeDict(dir));
  });
  const d = diffFacts(baseJson().seats['reviewer-audit'], after);
  assert.equal(after.allowCmds.length, before - 1, '改造后允许命令数应 = 基线 − 1');
  assert.deepEqual(d.minus.map((x) => x.replace(/^allowCmds: /, '')), ['node scripts/skill-dir.mjs']);
  assert.deepEqual(d.plus, []);
  assert.equal(verdict(d), 'fail');
});

test('S6-TC-H05 越权负例：多一项（路径 / 命令 / 已登记组，各按自己那一席取基线）→ plus 必红', () => {
  // 每项按**自己那一席**取基线（两 producer 席有基线 JSON；`senior-sdet` 用真仓库未改动的渲染现算）
  const beforeOf = (seat) => (baseJson().seats[seat] ?? factsFromText(renderBoundary(seat), probeDict()));
  const CASES = [
    ['paths', 'reviewer-audit', (d) => editInDir(d, 'tools/docgen/policy/definitions/paths.mjs',
      (s) => s.replace("'其他评审目录',", "'其他评审目录','vendor/',")), 1],
    ['cmds', 'reviewer-audit', (d) => editInDir(d, 'tools/docgen/policy/definitions/commands.mjs',
      (s) => s.replace("'node scripts/skill-dir.mjs',", "'node scripts/skill-dir.mjs','node scripts/extra.mjs',")), 1],
    // 度量席必须是 `senior-sdet` 自己：`reviewer-audit` 本就持有 `docgen.read` → plus 恒 0、判据失效
    ['group', 'senior-sdet', (d) => grantGroup(d, 'senior-sdet', 'docgen.read'),
      CMD.commandGroups['docgen.read'].verbs.length],
  ];
  for (const [name, seat, edit, expectPlus] of CASES) {
    const diff = withCopy((d) => {
      edit(d);
      dumpPolicy(d);                       // 先断 dump 成功（议会 #3 F19 / QA-15）
      return diffFacts(beforeOf(seat), factsFromText(renderBoundaryIn(d, seat), probeDict(d)));
    });
    assert.deepEqual(diff.minus, [], name);
    assert.equal(diff.plus.length, expectPlus, `${name}: 越权新增未被捕获`);
    assert.equal(verdict(diff), 'fail');
  }
  // 负例：只挂载不登记席级组 → dump 直接红（UnknownPolicyRef），不允许静默放行
  const unmounted = withCopy((d) => {
    grantGroup(d, 'senior-sdet', 'seat:senior-sdet.extra');
    return runCli(d, ['policy', '--dump']);
  });
  assert.equal(unmounted.status, 1);
  assert.equal(unmounted.stderr.split('\n')[0], 'UnknownPolicyRef: senior-sdet:group=seat:senior-sdet.extra');
});

test('S6-TC-H06 V-2 降级判定表：结论只由 diff 决定（哈希不参与）', () => {
  // verdict 的形参里根本没有哈希位 → 结构上保证它不参与判定
  assert.equal(verdict({ minus: [], plus: [], hashEqual: true }), 'pass');
  assert.equal(verdict({ minus: [], plus: [], hashEqual: false }), 'pass', '哈希红 ≠ 不通过');
  assert.equal(verdict({ minus: ['forbiddenPaths: x'], plus: [], hashEqual: true }), 'fail', '哈希绿救不了能力丢');
  assert.equal(verdict({ minus: [], plus: ['allowCmds: y'], hashEqual: false }), 'fail');
  assert.equal(verdict.length, 1, '只接受一个入参对象，不接受第二参数');
  const cd = readFileSync(join(evalDir(), 'capability-diff.md'), 'utf8');
  assert.equal(/哈希\s*(相等|一致)\s*(→|=|：)\s*(通过|pass)/.test(cd), false, '账单把哈希当通过判据');
});

// H07 拆两个入口：①② 依赖「改造已提交」→ 条件跳过（H07a）；③④ 与 HEAD 无关 → 无条件必绿（H07b）。
test('S6-TC-H07a 恒真守卫①②：基线不得取自改造后（HEAD 上两者都在 + sourceCommit 改 HEAD 必抛）', {
  skip: HEAD_HAS_POLICY ? false : 'HEAD 尚无 tools/docgen/policy（改造未提交）：①② 需在用户 commit 后运行；commit 后运行 node --test tools/docgen/test/policy-pure-source.test.mjs',
}, () => {
  const base = baseJson();
  const has = (rev, p) => spawnSync('git', ['cat-file', '-e', `${rev}:${p}`], { cwd: ROOT, stdio: 'ignore' }).status === 0;
  // ① 基线 commit 上不存在改造后标志，而 HEAD 上两者都存在
  assert.equal(has(base.sourceCommit, 'tools/docgen/policy'), false, '基线 commit 必须早于 policy/ 出现');
  assert.equal(has(base.sourceCommit, 'tools/docgen/components/renderBoundary.mjs'), false);
  assert.equal(has('HEAD', 'tools/docgen/policy'), true, 'HEAD 上必须已有 policy/（改造后标志）');
  // ② 副本内把 sourceCommit 改成 HEAD → 同源检查必须抛
  const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
  const patched = withCopy((d) => {
    const rel = 'tools/docgen/fixtures/capability-baseline.json';
    const before = readFileSync(join(d, rel), 'utf8');
    editInDir(d, rel, (s) => s.replace(/"sourceCommit"\s*:\s*"[0-9a-f]{40}"/, `"sourceCommit": "${head}"`));
    const after = readFileSync(join(d, rel), 'utf8');
    // 替换命中自检：没命中时基线仍早于改造 → 下面 assert.throws 会以「没抛」失败，红点指错方向
    assert.notEqual(after, before, '② 的构造未命中：sourceCommit 替换前后文本相同（红点会指错）');
    return after;
  });
  assert.throws(() => assertBaselinePrior(JSON.parse(patched)), '基线改成 HEAD 仍通过 → 判据恒真');
});

test('S6-TC-H07b 抽取器与基线解耦：静态不读定义层 + 真执行 8 字段 / 23 路径（无条件绿）', () => {
  // ③ = 原 H01 ④ 的 `sourceCommit !== HEAD` 的活体承接（提交后由 H07a 再看一次）：
  // 抽取器一读定义层，「基线」就跟着改造后的数据漂 → diff 恒空、判据归零；故静态判它不读。
  assert.equal(/tools\/docgen\/policy/.test(stripComments(readFileSync('tools/docgen/test/support/capability-baseline.mjs', 'utf8'))), false);
  // ④ 动态断言：抽取器**确实被执行过**（静态 grep 通过 ≠ 抽取规则被验证）；不传字典
  const live = runBaselineExtractor(ROOT, gitShow(baseJson().sourceCommit, 'agents/reviewer-audit.md'));
  assert.deepEqual(Object.keys(live).sort(), [...FACTS_KEYS].sort(), '抽取器未被执行或返回形状不全');
  assert.equal(live.forbiddenPaths.length, 23, '抽取器执行了但没抽出 23 项路径（抽取规则错）');
});

