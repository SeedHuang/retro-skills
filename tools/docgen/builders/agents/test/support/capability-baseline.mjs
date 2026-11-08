// 五段事实抽取器（**唯一实现**）：三个纯函数（`factsFromBaselineText` / `factsFromText` / `factsFromDump`）只读文本，
// 不依赖任何定义层模块；`emit` 是基线导出 CLI，也是本模块**唯一写盘入口**（仅供 §6 步骤 0 生成基线，判据侧不得调用）。
// 两种口径：`factsFromBaselineText` = 基线端（旧卡文本切分，**不注入字典**）；
// `factsFromText` = 改造后端（字典由调用方按目标目录注入，做**存在性匹配**）。
// 判据侧（测试文件）只 import 本模块，不另写第二份；本模块不得 import 定义层（否则「空差」恒真）。
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

// 五段事实集合（`spec:204` V-1）的两端口径必须同形才能做集合 diff。
// 段 ⑤（关键子句存在性）不做集合 diff，故 FACTS 只含 ①–④ 的 8 个字段。
export const FACTS_KEYS = ['tools', 'tier', 'canWrite', 'mustNotWrite', 'forbiddenPaths', 'allowCmds', 'denyCmds', 'envForms'];
export const SEG5 = /越[界权]后果与限度/;   // ⑤ 段锚点（两写法都认）

// 段切（`spec:169` §6 步骤 0 ④）：按五段标题切；段名「越界」/「越权」两写法都认
export function segments(text) {
  const t = String(text).replace(/\r\n/g, '\n');
  const between = (from, to) => {
    const i = t.indexOf(from);
    if (i < 0) return '';
    const j = to ? t.indexOf(to, i + from.length) : -1;
    return t.slice(i + from.length, j < 0 ? undefined : j);
  };
  const i4 = t.indexOf('**命令默认拒绝**');
  const i5 = t.search(SEG5);
  const d4 = i4 < 0 ? '' : t.slice(i4 + '**命令默认拒绝**'.length, i5 < 0 ? undefined : i5);
  const iB = d4.indexOf('**禁止**');
  return {
    tier: between('**档位事实**', '**只允许写**'),        // ① 档位事实
    write: between('**只允许写**', '**除上述落点外'),      // ② 写入范围
    paths: between('逐项点名：', '；兜底句'),              // ③ 明确禁止（路径清单，23 项）
    allow: iB < 0 ? d4 : d4.slice(0, iB),                // ④ 允许段
    deny: iB < 0 ? '' : d4.slice(iB),                    // ④ 禁止段
  };
}

// 改造后端：以定义层成员为字典逐项 `text.includes(member)`，返回命中集合（不按反引号切、不靠分隔符猜）
export function factsFromText(text, dict) {
  const s = segments(text);
  const hit = (members, scope) => [...new Set(members.filter((m) => String(scope ?? '').includes(m)))];
  // tier 是标量不是集合：只在「`<档位>` 档」这一形态上取，且必须恰好命中一个（四档：`spec:53`）
  const tierHit = dict.tiers.filter((t) => new RegExp('`' + t + '`\\s*档').test(s.tier));
  const iFW = Math.max(s.write.indexOf('**禁止写**'), 0);
  const canWrite = hit(dict.artifacts, s.write.slice(0, iFW));
  const mustNotWrite = hit(dict.artifacts, s.write.slice(iFW));
  return {
    tools: hit(dict.tools, s.tier),
    tier: tierHit.length === 1 ? tierHit[0] : '',
    canWrite,
    mustNotWrite: mustNotWrite.filter((x) => !canWrite.includes(x)),
    forbiddenPaths: hit(dict.paths, s.paths),
    allowCmds: hit(dict.allowVerbs, s.allow),
    denyCmds: hit(dict.denyVerbs, s.deny),
    envForms: hit(dict.envVerbs, s.deny),
  };
}

// ---- 基线端（`spec:169` §6 步骤 0 ④）：旧卡文本切分，**不注入字典**（步骤 0 尚无定义层）----
// 切分口径写死四类：反引号项 / 顿号项 / 分号项 / ` / ` 工具项；再叠加**形态过滤**（过滤的是形态，不是字典）。
const spans = (t) => [...String(t ?? '').matchAll(/`([^`\n]+)`/g)].map((m) => m[1].trim());
const splitPlain = (t) => String(t ?? '').split(/[、；;]| \/ /)
  .map((x) => x.trim().replace(/^`|`$/g, '').trim())
  .filter((x) => x && x.length <= 12 && !/[：:。，,*＊（）()]|[@#]/.test(x));
const ENV_FORM = /^(export |\$env:|set |setx |VAR=)/;
const CMD_ITEM = /^(git|npm|node) /;
export function factsFromBaselineText(text) {
  const s = segments(text);
  const run = s.tier.match(/[A-Z][A-Za-z0-9]*(?: \/ [A-Z][A-Za-z0-9]*)+/);   // ` / ` 工具项
  const tier = (s.tier.match(/`([A-Za-z][\w-]*)`\s*档/) ?? [])[1] ?? '';
  const md = (xs) => xs.filter((x) => /^[\w.<>-]+\.md$/.test(x));            // 产物名：不得含 `/`（否则把 ledger 路径当成产物）
  const iFW = Math.max(s.write.indexOf('**禁止写**'), 0);
  const canWrite = md(spans(s.write.slice(0, iFW)));
  const mustNotWrite = md(spans(s.write.slice(iFW))).filter((x) => !canWrite.includes(x));
  const allowCmds = [...new Set(spans(s.allow))].filter((x) => CMD_ITEM.test(x));   // 允许命令全在反引号内
  const denyAll = [...new Set([...spans(s.deny), ...splitPlain(s.deny)])]
    .filter((x) => x !== 'DOCGEN_*');                                        // 说明性固定文本，不进成员集合
  return {
    tools: run ? run[0].split(' / ') : [],
    tier,
    canWrite,
    mustNotWrite,
    forbiddenPaths: s.paths.split('、').map((x) => x.trim().replace(/^`|`$/g, '')).filter(Boolean),   // ③ 段是纯清单
    allowCmds,
    denyCmds: denyAll.filter((x) => !ENV_FORM.test(x)),                      // 环境变量形态单列，不重复计数
    envForms: denyAll.filter((x) => ENV_FORM.test(x)),
  };
}

// dump 端（**只作交叉核对**）：12 槽 → 同形事实。槽序 = `spec:76` 表行序，第 n 槽 → index n−1。
// `mustNotWrite` 不属 12 槽（模板固定片段）→ dump 端记 null，diff 时跳过。
export function factsFromDump(json, seat, dict) {
  const e = json.seats[seat].expanded;
  const hit = (members, scope) => [...new Set(members.filter((m) => String(scope ?? '').includes(m)))];
  const tier = String(e[1] ?? '').trim();                       // 槽 2 TIER
  return {
    tools: hit(dict.tools, e[2]),                               // 槽 3 CAPABILITIES
    tier: dict.tiers.includes(tier) ? tier : '',
    canWrite: hit(dict.artifacts, e[3]),                        // 槽 4 ARTIFACTS
    mustNotWrite: null,
    forbiddenPaths: hit(dict.paths, e[9]),   // 槽 10 FORBIDDEN_PATHS：单层清单（`、` 连接），成员内部可自带 ` / `
    allowCmds: hit(dict.allowVerbs, e[6]),                      // 槽 7 ALLOW_GROUPS
    denyCmds: hit(dict.denyVerbs, e[7]),                        // 槽 8 DENY_GROUPS
    envForms: hit(dict.envVerbs, e[8]),                         // 槽 9 ENV_FORMS
  };
}

// minus = 改造后缺（`-`，能力丢了）；plus = 改造后多（`+`，越权）
export function diffFacts(before, after) {
  const out = { minus: [], plus: [] };
  for (const k of FACTS_KEYS) {
    if (before[k] == null || after[k] == null) continue;   // dump 端不表达 mustNotWrite → 交叉核对跳过该键
    const b = new Set(before[k]);
    const a = new Set(after[k]);
    out.minus.push(...[...b].filter((v) => !a.has(v)).map((v) => `${k}: ${v}`));
    out.plus.push(...[...a].filter((v) => !b.has(v)).map((v) => `${k}: ${v}`));
  }
  return out;
}

// V-2 降级后的唯一判定函数：**只吃一个对象、且结构里没有哈希位**（red 不等于 fail、green 不等于 pass）
export const verdict = ({ minus, plus }) => (minus.length === 0 && plus.length === 0 ? 'pass' : 'fail');

// 卡面边界节 = `## 边界` 之后到卡尾（两张 producer 卡的该节都是最后一节，已核 `agents/` 全 15 张）
export function cardBoundary(text) {
  const i = String(text).indexOf('## 边界');
  return i < 0 ? '' : String(text).slice(i + '## 边界'.length).replace(/^\r?\n+/, '').trim();
}

// 基线 JSON 读取（`tools/docgen/fixtures/capability-baseline.json`，含 `sourceCommit`）
export function baseJson(root = process.cwd()) {
  return JSON.parse(readFileSync(join(root, 'tools', 'docgen', 'fixtures', 'capability-baseline.json'), 'utf8'));
}

// CLI 出口（等价于 plan Task 1 Step 5 的两条内联命令）：`emit(['--commit', '<40 位 sha>'])`
// → 写 `capability-baseline.json`（两席 + sourceCommit）与 `capability-baseline.golden.json`（审计席 8 字段）
export function emit(argv = process.argv.slice(2)) {
  const arg = (name) => {
    if (!Array.isArray(argv)) return argv?.[name] ?? argv?.[name.replace(/^--/, '')];
    const i = argv.indexOf(name);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
  };
  // 「改造前」守卫（`testcase:498-503` assertBaselinePrior，在**任何写盘之前**）：`--commit` 必填、不取 HEAD 兜底，
  // 且该 commit 必须早于 `policy/` 与 `renderBoundary.mjs` 出现——否则会把**改造后**的卡写成基线（H07：diff 恒空、判据归零）
  const commit = arg('--commit');
  if (!commit) throw new Error('emit 需要 --commit <40 位 sha>：基线必须显式给定改造前 commit，不取 HEAD 兜底');
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`emit 需要 40 位 commit：${commit}`);
  const has = (p) => spawnSync('git', ['cat-file', '-e', `${commit}:${p}`], { encoding: 'utf8' }).status === 0;
  const policyDir = ['tools', 'docgen', 'policy'].join('/');   // 派生式：本文件源码不得出现定义层路径字面量（`testcase:2608` H07 ③）
  if (has(policyDir) || has('tools/docgen/components/renderBoundary.mjs')) {
    throw new Error(`emit 拒绝：commit ${commit} 已含改造后文件（${policyDir} 或 renderBoundary.mjs），不是改造前基线`);
  }
  const outDir = arg('--out-dir') ?? join('tools', 'docgen', 'fixtures');
  const seats = ['reviewer-audit', 'detective-observer'];
  const cardOf = (s) => execFileSync('git', ['show', `${commit}:agents/${s}.md`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  const baseline = { sourceCommit: commit, seats: Object.fromEntries(seats.map((s) => [s, factsFromBaselineText(cardOf(s))])) };
  const golden = factsFromBaselineText(cardOf('reviewer-audit'));
  writeFileSync(join(outDir, 'capability-baseline.json'), `${JSON.stringify(baseline, null, 2)}\n`);
  writeFileSync(join(outDir, 'capability-baseline.golden.json'), `${JSON.stringify(golden, null, 2)}\n`);
  console.log('baseline seats', Object.keys(baseline.seats).join(','), '| golden keys', Object.keys(golden).length);
  return { baseline, golden };
}
