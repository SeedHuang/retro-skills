// S5 工具档位 `producer` 的验收用例（A/B/C/D/E 组）。
// 用例来源：docs/superpowers/specs/2026-10-25-s5-tool-tiers-design-testcase.md
// 组别落点：A（档位单源）/ B（卡面与 B3 落账）/ C（生成物一致）/ D（越权负例）/ E（计数派生与文档同步）。
// C07（`npm run check` 全绿 + 覆盖席数 = state 中 replaced 席数）按 plan §5 归 T11 终局实跑，不在此文件（套内再跑 check 会自递归）。
// 本文件禁止出现档位数量中文字面量（E04 自伤守卫）：需要时用 String.fromCharCode 拼出。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry, tierOf, toolsForSeat, DEFAULT_BOUNDARY } from '../components/patternRegistry.mjs';
import { renderBoundary } from '../components/renderBoundary.mjs';
// 判据侧一律 import 定义层、不手抄（S6 spec §3.6 / D3）：三处清单常量由定义层现算
import { pathGroups } from '../policy/definitions/paths.mjs';
import { commandGroups, forbiddenGroups } from '../policy/definitions/commands.mjs';
import { validateAgentData } from '../components/validateAgentData.mjs';
import { renderAgent } from '../components/renderAgent.mjs';
import { sharedBlocks } from '../components/sharedBlocks.mjs';
// 旧模板的散文块（逐字节基线）；S4 的结构化合同另见 `outputFormats`
import { legacyOutputFormats as outputFormats } from '../components/outputFormats.mjs';
import { BASELINE_RULES, agentPaths } from '../components/baseline.mjs';
import { readState } from '../state.mjs';
import {
  ROOT, readRepo, readCounterFiles, counterProbes, stripCommentsAndStrings, isTierCountLine,
  withRepoCopy, runCli, runEsm,
} from './support/dev-workflow-checks.mjs';

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const card = (name) => readRepo(`agents/${name}.md`);
const tpl = () => readRepo('tools/docgen/templates/agent.md.tpl');
const renderOf = (name) => renderAgent({
  agent: agentData.find((a) => a.name === name), trigger: triggerTable[name], template: tpl(), sharedBlocks, outputFormats,
});
// 每席 tools 重建为独立副本：structuredClone 会让同档两席共享同一个数组（G-4），
// 就地注入会连带另一席，负例因此可能假红/假绿（D03 专门钉这一点）
const clone = () => structuredClone(agentData).map((a) => ({ ...a, ...(a.tools ? { tools: [...a.tools] } : {}) }));
const producerSeats = () => Object.keys(patternRegistry.tierBySeat).filter((n) => patternRegistry.tierBySeat[n] === 'producer');

// ── 共用前提（P0 前置）：B02 / B03 / B05 / B13 共享，模块顶层声明一次（抄进各 test() 会漏项或 ReferenceError）──
const FORBIDDEN_PATHS = Object.values(pathGroups).flat();
// 卡面 ③ 段成员数口径（S5 testcase §1.1）：`代码、测试` 在定义层合写一条、卡面写作两项，
// 故卡面成员 = 定义层数组按 `、` 再切 + `spec / plan` = 23 项
const pathTokens = () => [...FORBIDDEN_PATHS.flatMap((x) => x.split('、')), 'spec / plan'];
const FORBIDDEN_SPEC_PLAN = /spec\s*\/\s*plan/;   // ③ 第 6 项：`spec / plan`（正则判，兼容无空格写法）

function assertBoundaryClean(text, label = '') {
  const marks = [...text.matchAll(/^## 边界$/gm)];
  assert.equal(marks.length, 1, `${label} 边界节必须恰 1 处`);
  const sec = text.slice(marks[0].index);
  assert.equal(/你是只读评审角色：不得创建、修改、删除任何文件/.test(sec), false, `${label} 完整旧结论句残留`);
  assert.equal(sec.includes('不创建、修改、删除任何文件'), false, `${label} 边界节仍含无条件裸短语`);
  return sec;
}

function writeScopeHalves(sec, label = '') {
  const start = sec.indexOf('只允许写');
  assert.ok(start >= 0, `${label} 边界句缺「只允许写」起点`);
  const cut = sec.indexOf('**禁止写**', start) >= 0 ? sec.indexOf('**禁止写**', start) : sec.indexOf('禁止写', start);
  assert.ok(cut > start, `${label}「只允许写」段后必须紧跟「禁止写」段`);
  return { allowed: sec.slice(start, cut), forbidden: sec.slice(cut) };
}

// 递归取 skills/ 下的 markdown（E08 用；不跟随 symlink，防扫到仓外）
function mdFilesUnder(rel) {
  const out = [];
  const walk = (dir, prefix) => {
    for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (e.isSymbolicLink()) continue;
      const r = `${prefix}/${e.name}`;
      if (e.isDirectory()) walk(`${dir}/${e.name}`, r);
      else if (e.name.endsWith('.md')) out.push([r, readFileSync(join(ROOT, dir, e.name), 'utf8')]);
    }
  };
  walk(rel, rel);
  return out;
}

// 仓副本内改文件：构造前提必须真的改到目标片段，否则负例静默退化成「什么都没改也绿」
function patchFile(dst, rel, from, to) {
  const p = join(dst, rel);
  const t = readFileSync(p, 'utf8');
  assert.ok(t.includes(from), `构造前提：${rel} 未找到待替换片段`);
  writeFileSync(p, t.replace(from, to));
}

// ───────────────────────────── A 组：档位单源 ─────────────────────────────

test('S5-TC-A01 tools.producer 逐字六元组 + 必需档位全部在位', () => {
  assert.deepEqual(patternRegistry.tools.producer, ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand']);
  for (const t of ['readOnly', 'sdet', 'command', 'producer']) {
    assert.ok(Object.hasOwn(patternRegistry.tools, t), t);
    assert.ok(Array.isArray(patternRegistry.tools[t]) && patternRegistry.tools[t].length > 0, t);
  }
});

test('S5-TC-A02 tierBySeat 必需映射 + 每值合法 + 键须为真实席 + defaultTier', () => {
  assert.equal(patternRegistry.tierBySeat['senior-sdet'], 'sdet');
  assert.equal(patternRegistry.tierBySeat['reviewer-audit'], 'producer');
  assert.equal(patternRegistry.tierBySeat['detective-observer'], 'producer');
  assert.equal(patternRegistry.defaultTier, 'readOnly');
  for (const v of Object.values(patternRegistry.tierBySeat)) assert.ok(Object.hasOwn(patternRegistry.tools, v), v);
  const names = new Set(agentData.map((a) => a.name));
  for (const n of Object.keys(patternRegistry.tierBySeat)) assert.ok(names.has(n), n);
});

test('S5-TC-A03 boundaryBySeat 两席 + 值非空 + 键真实 + 白名单由它派生', () => {
  for (const n of ['reviewer-audit', 'detective-observer']) {
    assert.equal(Object.hasOwn(patternRegistry.boundaryBySeat, n), true, n);
    const v = patternRegistry.boundaryBySeat[n];
    assert.equal(typeof v === 'string' && v.trim().length > 0, true, n);
  }
  const names = new Set(agentData.map((a) => a.name));
  for (const n of Object.keys(patternRegistry.boundaryBySeat)) assert.ok(names.has(n), `boundaryBySeat 含不存在的席：${n}`);
  const vSrc = readRepo('tools/docgen/components/validateAgentData.mjs');
  assert.match(vSrc, /Object\.keys\(patternRegistry\.boundaryBySeat\)/);
  assert.equal(/new Set\(\['evidence-reader', 'reviewer-audit', 'detective-observer'\]\)/.test(vSrc), false);
});

test('S5-TC-A04 三席字面档位 + 每席 tools 落在已知档位 + 未挂载档位仅 defaultTier / command', () => {
  const FROZEN = {
    'senior-sdet': ['Read', 'Glob', 'Grep', 'Write', 'Edit'],
    'reviewer-audit': ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'],
    'detective-observer': ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'],
  };
  for (const [seat, want] of Object.entries(FROZEN)) assert.deepEqual(toolsForSeat(seat), want, seat);

  const tierArrays = Object.values(patternRegistry.tools);
  const KNOWN_TOOLS = new Set(tierArrays.flat());
  for (const a of agentData) {
    const got = toolsForSeat(a.name);
    assert.ok(Array.isArray(got), `${a.name} 无可解析档位（tierBySeat 写了不存在的档位名？）`);
    for (const t of got) assert.ok(KNOWN_TOOLS.has(t), `${a.name}: 未知工具 ${t}`);
    assert.ok(
      tierArrays.some((tl) => tl.length === got.length && tl.every((t, i) => t === got[i])),
      `${a.name} 的 tools 不等于任何已知档位数组`,
    );
  }

  assert.equal(new Set(agentData.map((a) => a.name)).size, agentData.length);
  assert.equal(Object.hasOwn(patternRegistry.tools, 'command'), true, 'command 是保留档，必须是 tools 真键');
  const mounted = new Set(Object.values(patternRegistry.tierBySeat));
  const unmounted = Object.keys(patternRegistry.tools).filter((t) => !mounted.has(t));
  assert.deepEqual(
    unmounted.filter((t) => ![patternRegistry.defaultTier, 'command'].includes(t)),
    [],
    '除 defaultTier 与保留档 command 外，不得存在无人挂载的档位',
  );
});

test('S5-TC-A05 代码探针：两文件只调 toolsForSeat，不直接读档位表', () => {
  const agentSrc = readRepo('tools/docgen/components/agentData.mjs');
  const valSrc = readRepo('tools/docgen/components/validateAgentData.mjs');
  assert.ok(agentSrc.includes('toolsForSeat('));
  assert.ok(valSrc.includes('toolsForSeat('));
  assert.equal(/s\.name === 'senior-sdet'\s*\?/.test(agentSrc), false);
  assert.equal(/a\.name === 'reviewer-audit'/.test(valSrc), false);
  const code = (s) => s.split('\n').filter((l) => !/^\s*import\b/.test(l) && !/^\s*\/\//.test(l)).join('\n');
  assert.equal(/patternRegistry\.tools\b/.test(code(valSrc)), false);
  assert.equal(/patternRegistry\.tools\b/.test(code(agentSrc)), false);
});

test('S5-TC-A06 命名守卫对空串 / 大小写错 / 不存在档位三种坏值必须抛错', () => {
  function assertTierValuesExist(tierBySeat, tools) {
    for (const [seat, tier] of Object.entries(tierBySeat)) {
      assert.ok(Object.hasOwn(tools, tier), `${seat} → 未知档位 ${JSON.stringify(tier)}`);
    }
  }
  for (const bad of ['', 'Producer', 'ghostTier']) {
    const saved = patternRegistry.tierBySeat['reviewer-audit'];
    try {
      patternRegistry.tierBySeat['reviewer-audit'] = bad;
      // 先证明改写生效且运行时不做静默兜底（bad 时两边都 undefined）
      assert.equal(toolsForSeat('reviewer-audit'), patternRegistry.tools[bad]);
      assert.throws(() => assertTierValuesExist(patternRegistry.tierBySeat, patternRegistry.tools), /未知档位/);
    } finally { patternRegistry.tierBySeat['reviewer-audit'] = saved; }
  }
  assert.doesNotThrow(() => assertTierValuesExist(patternRegistry.tierBySeat, patternRegistry.tools));
  assert.deepEqual(toolsForSeat('reviewer-audit'), ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand']);
});

test('S5-TC-A07 工具名白名单（拼错 / 大小写 / 残留联网工具即红）', () => {
  const KNOWN = ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'];
  for (const [tier, list] of Object.entries(patternRegistry.tools)) {
    for (const t of list) assert.ok(KNOWN.includes(t), `${tier}:${t}`);
  }
  assert.equal(['Read', 'Glob', 'Grep', 'Websearch'].every((t) => KNOWN.includes(t)), false);
  assert.equal(['Read', 'Glob', 'Grep', 'WebFetch'].every((t) => KNOWN.includes(t)), false);
});

test('S5-TC-A08 席名大小写敏感：大写首字母回落 readOnly', () => {
  assert.deepEqual(toolsForSeat('Reviewer-Audit'), patternRegistry.tools.readOnly);
  assert.notDeepEqual(toolsForSeat('Reviewer-Audit'), patternRegistry.tools.producer);
});

test('S5-TC-A09 原型链键名 constructor / toString / hasOwnProperty 回落 readOnly', () => {
  for (const n of ['constructor', 'toString', 'hasOwnProperty']) {
    assert.deepEqual(toolsForSeat(n), patternRegistry.tools.readOnly, n);
  }
  assert.ok(/^[a-z][a-z0-9-]{0,49}$/.test('constructor'));
});

test('S5-TC-A10 defaultTier 判据有判别力（构造值即红 + 改默认值真的扩大权限）', () => {
  const assertReadOnlyDefault = (reg) => assert.equal(reg.defaultTier, 'readOnly');
  assertReadOnlyDefault(patternRegistry);
  assert.throws(() => assertReadOnlyDefault({ ...patternRegistry, defaultTier: 'producer' }));

  const saved = patternRegistry.defaultTier;
  try {
    patternRegistry.defaultTier = 'producer';
    assert.deepEqual(toolsForSeat('ghost'), ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand']);
  } finally {
    patternRegistry.defaultTier = saved;
  }
  assert.deepEqual(toolsForSeat('ghost'), ['Read', 'Glob', 'Grep']);
});

// ───────────────────────── B 组：卡面、边界句与 B3 落账 ─────────────────────────

test('S5-TC-B01 两卡 frontmatter tools 行逐字六元组', () => {
  for (const n of ['reviewer-audit', 'detective-observer']) {
    assert.equal(/^tools: .+$/m.exec(card(n))[0], 'tools: Read, Glob, Grep, Write, Edit, RunCommand', n);
  }
});

test('S5-TC-B02 审计边界节五段齐 + 允许写切片干净 + 禁止段两条「不得写」', () => {
  const sec = assertBoundaryClean(card('reviewer-audit'), 'reviewer-audit');
  const MARKS = ['整档授予', '平台无参数级授权', '不假装白名单', '不裁决他人分歧', '无中断评审',
    '.session/reviews/', 'docs/superpowers/reviews/', 'round-check', 'delivery-audit',
    '封闭清单', '任何写文件或重定向',
    // 卡面 ③ 段 = **23 项**（`代码、测试` 在卡面写作两项）：S6 §3.4 渲染把该合写元素按 `、` 拆开，
    // 故此处取 `pathTokens()`（= 卡面派生）而非定义层数组 `FORBIDDEN_PATHS`（含合写的 `代码、测试`）
    ...pathTokens(), '.gitignore',
    '越权清单', 'sha256', '用户执行', '本轮结论作废', '检测限度'];
  for (const w of MARKS) assert.ok(sec.includes(w), w);
  assert.match(sec, FORBIDDEN_SPEC_PLAN, '缺 spec / plan（③ 第 6 项）');

  const { allowed, forbidden } = writeScopeHalves(sec, 'reviewer-audit');
  assert.ok(allowed.includes('round-check'), '允许写切片缺 round-check');
  assert.equal(allowed.includes('progress.md'), false, 'progress.md 只由主持人写，不得进允许写切片');
  assert.equal(allowed.includes('新建快照'), false, '不得把「新建快照文件」写进允许写切片');
  assert.match(forbidden, /不得写\s*`?progress\.md`?/, '§3.3②：两席均不得写 progress.md');
  assert.match(forbidden, /不得写\s*`?(?:skills\/dev-workflow\/references\/)?gate-record\.md`?/, '§3.3②：两席均不得写 gate-record.md');
});

test('S5-TC-B03 侦探边界节五段齐 + 允许写切片只含 detective.md + 禁止段两条「不得写」', () => {
  const sec = assertBoundaryClean(card('detective-observer'), 'detective-observer');
  const MARKS = ['整档授予', '平台无参数级授权', '不假装白名单', '不裁决他人分歧', '无中断评审',
    '.session/reviews/', 'detective.md', '轮初', '轮末', '封闭清单', '任何写文件或重定向',
    ...pathTokens(), '.gitignore',   // 同上：卡面 ③ 段 = 23 项（`代码、测试` 在卡面拆成两项）
    '越权清单', 'sha256', '用户执行', '本轮结论作废', '检测限度'];
  for (const w of MARKS) assert.ok(sec.includes(w), w);
  assert.match(sec, FORBIDDEN_SPEC_PLAN, '缺 spec / plan（③ 第 6 项）');

  const { allowed, forbidden } = writeScopeHalves(sec, 'detective-observer');
  assert.ok(allowed.includes('detective.md'), '允许写切片缺 detective.md');
  assert.equal(allowed.includes('progress.md'), false, 'progress.md 只由主持人写');
  assert.equal(allowed.includes('新建快照'), false, '不得把「新建快照文件」写进允许写切片');
  assert.match(forbidden, /不得写\s*`?progress\.md`?/);
  assert.match(forbidden, /不得写\s*`?(?:skills\/dev-workflow\/references\/)?gate-record\.md`?/);
});

test('S5-TC-B04 审计卡输出格式含「已授 producer 档」、不含旧句且单源', () => {
  const text = card('reviewer-audit');
  // 审计输出格式自带 `## 核对项` / `## 结论` / `## A 节` 等小节，故切片下界取模板里的下一个固定节「## 通用纪律」，
  // 不取「下一个 ## 」——否则会截在 `## 结论` 之前，把「已授 producer 档」那句切出去（假红）
  const start = text.indexOf('## 输出格式');
  const end = text.indexOf('## 通用纪律', start + 3);
  const sec = text.slice(start, end < 0 ? undefined : end);
  assert.ok(sec.includes('已授 producer 档'));
  assert.equal(sec.includes('已授 command 档'), false);
  const src = readRepo('tools/docgen/components/outputFormats.mjs');
  assert.equal((src.match(/已授 producer 档/g) ?? []).length, 1);
  assert.equal((src.match(/已授 command 档/g) ?? []).length, 0);
});

test('S5-TC-B05 以「**禁止**」为界：允许段白名单 + 禁止段点名 + 允许段无裸 draft', () => {
  // 允许 / 禁止命令清单 = 定义层 verbs 现算（S6 spec §3.6：不手抄第二份）
  const ALLOWED = Object.values(commandGroups).flatMap((g) => g.verbs);
  const FORBIDDEN = Object.values(forbiddenGroups).flatMap((g) => g.verbs);

  for (const seat of ['reviewer-audit', 'detective-observer']) {
    const sec = assertBoundaryClean(card(seat), seat);
    // 锚固定（spec §3.3② 末句）：命令允许段只取 ④ 段内「**禁止**」之前的部分（不收窄会把 ②③ 段包进 allowed）
    const sec4Start = sec.indexOf('命令默认拒绝');
    assert.ok(sec4Start >= 0, `${seat} 边界句缺 ④「命令默认拒绝」段`);
    const sec4 = sec.slice(sec4Start);
    const cut = sec4.indexOf('**禁止**');
    assert.ok(cut > 0, `${seat} ④ 段缺少「**禁止**」切分点`);
    const allowed = sec4.slice(0, cut);
    const forbidden = sec4.slice(cut);

    for (const w of ALLOWED) assert.ok(allowed.includes(w), `${seat} 允许段缺：${w}`);
    for (const w of FORBIDDEN) assert.ok(forbidden.includes(w), `${seat} 禁止段缺：${w}`);
    // 环境变量默认拒绝的四种形态（spec §3.3④）
    assert.match(forbidden, /任何形式的环境变量赋值/, `${seat} 缺总句`);
    assert.match(forbidden, /\bset\s+[A-Za-z_]\w*=/i, `${seat} 缺 set VAR=… 形态`);
    assert.match(forbidden, /\b[A-Z_][A-Z0-9_]*=\S+\s+node\b/, `${seat} 缺 VAR=… node … 形态`);
    assert.match(forbidden, /\bsetx\b/i, `${seat} 缺 setx 形态`);

    const subs = [...allowed.matchAll(/cli\.mjs\s+(draft\s+[a-z-]+|[a-z-]+)/g)].map((m) => m[1]);
    for (const s of subs) assert.ok(['gate', 'check-agents', 'diff', 'draft ls'].includes(s), `${seat} 未知子命令 ${s}`);
    assert.equal(/draft(?!\s?ls)/.test(allowed), false, `${seat} 允许段只许 draft ls`);

    const cmdsOf = (text) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim())
      .filter((s) => /^(npm run|git --no-optional-locks|node )/.test(s))
      .filter((s) => !/cli\.mjs\s/.test(s));
    const assertWithinWhitelist = (cmds, label) => {
      for (const c of cmds) assert.ok(ALLOWED.some((w) => c === w || c.startsWith(`${w} `)), `${label}出现白名单外命令：${c}`);
    };
    const allowedCmds = cmdsOf(allowed);
    assert.ok(allowedCmds.length >= Math.ceil(ALLOWED.length / 2), `${seat} 允许段命令未被反引号包住？`);
    assertWithinWhitelist(allowedCmds, `${seat} 允许段`);

    // 正向样例（防守卫恒红 / 收到 0 条）+ 应拒反例（防守卫恒绿）
    const SYNTH_ALLOWED = ['`npm run check`', '`git --no-optional-locks status --porcelain`',
      '`git --no-optional-locks diff`', '`git --no-optional-locks show`', '`git --no-optional-locks log`',
      '`node scripts/check-all.mjs`', '`node scripts/skill-dir.mjs`',
      '`node tools/docgen/cli.mjs gate`', '`node tools/docgen/cli.mjs draft ls`'];
    const synthCmds = cmdsOf(SYNTH_ALLOWED.join('\n'));
    assert.ok(synthCmds.length >= 6, '正向样例未收到命令，样例失效');
    assert.doesNotThrow(() => assertWithinWhitelist(synthCmds, '正向样例'));
    const BAD_ALLOWED = [...SYNTH_ALLOWED, '`node scripts/session-snapshot.mjs`'];
    assert.throws(() => assertWithinWhitelist(cmdsOf(BAD_ALLOWED.join('\n')), '应拒样例'), /session-snapshot/);
  }
});

test('S5-TC-B06 侦探固定清单第 4 项含 --no-optional-locks status（数据侧 + 卡面 + spec 三处同源）', () => {
  const d = agentData.find((a) => a.name === 'detective-observer');
  assert.match(d.fixedList[3], /git --no-optional-locks status --porcelain/);
  assert.equal(/本轮 `git status --porcelain`/.test(d.fixedList[3]), false);
  assert.match(card('detective-observer'), /^\| 4 \| .*git --no-optional-locks status --porcelain.*\| 待答 \|$/m);

  const SPEC_PATH = 'docs/superpowers/specs/2026-10-25-s5-tool-tiers-design.md';
  const specText = readRepo(SPEC_PATH);

  // ④ 检测证据表（下界取「同源硬约束」句，不取「为什么审计只签转录」——后者自身以裸 git status 举反例）
  const tblStart = specText.indexOf('| 证据 | 谁产出 | 落在哪 | 防什么 |');
  const tblEnd = specText.indexOf('**同源硬约束**');
  assert.ok(tblStart >= 0 && tblEnd > tblStart, `锚点缺失：${SPEC_PATH} 未找到证据表表头或「同源硬约束」句`);
  const specSec = specText.slice(tblStart, tblEnd);
  const gitCmds = [...specSec.matchAll(/git\s+[^`|]*?(?:status|log|reflog|diff)[^`|]*/g)].map((m) => m[0].trim());
  assert.ok(gitCmds.length >= 3, `证据表命令未被反引号包住？（${SPEC_PATH} §3.3）`);
  for (const c of gitCmds) assert.ok(c.includes('--no-optional-locks'), `证据表命令缺 --no-optional-locks：${c}`);

  // ④-b §4「判者」表 + V-8 行：两段的 git diff 都必须带 --no-optional-locks，且各命中 ≥1（防一条都没扫到）
  const v8 = specText.indexOf('| V-8 |');
  const segs = {
    '§4「判者」表': [specText.indexOf('B3 的落账要求（本 spec 不造机器门）'), specText.indexOf('为什么 `senior-sdet` 不升 `producer`')],
    // V-9 在文首另有一处提及，故下界必须从 V-8 之后开始找（否则 e < s 直接误报锚点缺失）
    'V-8 行': [v8, specText.indexOf('| V-9 |', v8)],
  };
  for (const [name, [s, e]] of Object.entries(segs)) {
    assert.ok(s >= 0 && e > s, `锚点缺失：${SPEC_PATH} 的${name}切片（锚文案被改？）`);
    const hits = [...specText.slice(s, e).matchAll(/git\b[^`|]*?\bdiff\b[^`|]*/g)].map((m) => m[0].trim());
    assert.ok(hits.length >= 1, `${SPEC_PATH} 的${name}未见 git diff（锚切错或命令被删？）`);
    for (const c of hits) assert.ok(c.includes('--no-optional-locks'), `${name}的 git diff 缺 --no-optional-locks：${c}`);
  }
});

test('S5-TC-B07 changes[] 中 to === renderSha256 的最新条 B3 落账四字段', () => {
  for (const [seat, p] of Object.entries({
    'reviewer-audit': 'tools/docgen/fixtures/reviewer-audit.evidence.json',
    'detective-observer': 'tools/docgen/fixtures/detective-observer.evidence.json',
  })) {
    const ev = JSON.parse(readRepo(p));
    const hits = ev.changes.filter((c) => c.to === ev.renderSha256);
    assert.ok(hits.length >= 1, `${seat}: 缺 to === renderSha256 的变更记录`);
    const c = hits.slice().sort((a, b) => String(a.at).localeCompare(String(b.at))).at(-1);
    assert.ok(c.rejudged.includes('B3'), seat);
    assert.equal(c.judgeMode, 'subagent', seat);
    assert.equal(typeof c.judgedBy === 'string' && c.judgedBy.trim().length > 0, true, seat);
    assert.equal(c.judged.find((j) => j.key === 'B3').verdict, 'pass', seat);
  }
});

test('S5-TC-B08 真实 agentData 的 producer 席 boundary 等于渲染结果', () => {
  const producers = producerSeats();
  assert.ok(producers.length >= 2);
  for (const n of producers) {
    const a = agentData.find((x) => x.name === n);
    assert.equal(a.boundary, patternRegistry.boundaryBySeat[n], n);
    // 判据由 S6 改判（S6 spec §3.6 ②）：边界句的唯一来源是 renderBoundary
    assert.equal(a.boundary, renderBoundary(n), n);
    assert.equal(/你是只读评审角色：不得创建、修改、删除任何文件/.test(a.boundary ?? ''), false, n);
  }
});

test('S5-TC-B09 B3 pending → 拒写盘；写回 pass 后落盘；rejudge-<席>-B3.md 四字段', () => {
  withRepoCopy((dst) => {
    // 只改审计席的渲染（outputFormats 审计句），保证 target 盘上 ≠ 渲染、旁席不受影响
    patchFile(dst, 'tools/docgen/components/outputFormats.mjs', '（已授 producer 档）', '（已授 producer 档·B09）');
    assert.equal(runCli(dst, ['draft', '--kind', 'agent', '--name', 'reviewer-audit']).status, 0);
    const draftsDir = join(dst, '.drafts');
    const draftName = readdirSync(draftsDir).find((f) => f.startsWith('reviewer-audit--'));
    assert.ok(draftName, '草稿未落盘');
    const draftPath = join(draftsDir, draftName);
    const newSha = sha256(readFileSync(draftPath));

    patchFile(dst, 'rules/.inspector-annotations.json', '"reviewer-audit:B3": "pass"', '"reviewer-audit:B3": "pending"');
    const mdRel = '.session/reviews/s5-b09/rejudge-reviewer-audit-B3.md';
    mkdirSync(join(dst, '.session/reviews/s5-b09'), { recursive: true });
    const md = (v) => `判前值：pending\n判后值：${v}\n判者标识：s5-sdet-rejudge\n判据锚：tools/execution-matrix/criteria.md:134-141\n转录人：主 agent\n`;
    writeFileSync(join(dst, mdRel), md('pending'));

    const cardPath = join(dst, 'agents/reviewer-audit.md');
    const evPath = join(dst, 'tools/docgen/fixtures/reviewer-audit.evidence.json');
    const len0 = JSON.parse(readFileSync(evPath, 'utf8')).changes.length;
    const hash0 = sha256(readFileSync(cardPath));
    const args = ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', draftPath,
      '--expect-change', newSha.toUpperCase(), '--rejudge', 'B3', '--yes'];

    const r1 = runCli(dst, args, { DOCGEN_JUDGED_BY: 's5-sdet-rejudge' });
    assert.equal(r1.status, 4, r1.stdout + r1.stderr);
    assert.match(r1.stdout + r1.stderr, /reviewer-audit:B3/);
    assert.match(r1.stdout + r1.stderr, /非 pass\/fail/);
    assert.equal(JSON.parse(readFileSync(evPath, 'utf8')).changes.length, len0);
    assert.equal(sha256(readFileSync(cardPath)), hash0);

    patchFile(dst, 'rules/.inspector-annotations.json', '"reviewer-audit:B3": "pending"', '"reviewer-audit:B3": "pass"');
    writeFileSync(join(dst, mdRel), md('pass'));
    const r2 = runCli(dst, args, { DOCGEN_JUDGED_BY: 's5-sdet-rejudge' });
    assert.equal(r2.status, 0, r2.stdout + r2.stderr);
    assert.equal(sha256(readFileSync(cardPath)), newSha);
    const ev2 = JSON.parse(readFileSync(evPath, 'utf8'));
    assert.equal(ev2.changes.length, len0 + 1);
    const last = ev2.changes.filter((c) => c.to === ev2.renderSha256).at(-1);
    assert.deepEqual(last.rejudged, ['B3']);
    assert.equal(last.judgedBy, 's5-sdet-rejudge');

    const mdText = readFileSync(join(dst, mdRel), 'utf8');
    assert.match(mdText, /判前值[:：]\s*`?pending`?/);
    assert.match(mdText, /判后值[:：]\s*`?pass`?/);
    assert.match(mdText, /判者标识[:：]\s*`?s5-sdet-rejudge`?/);
    assert.match(mdText, /判据锚[:：].*criteria\.md:134-141/);
    assert.match(mdText, /转录人[:：]\s*\S+/);
  });
});

test('S5-TC-B10 缺 DOCGEN_JUDGED_BY → UnapprovedChange exit 4 且不写盘', () => {
  withRepoCopy((dst) => {
    patchFile(dst, 'tools/docgen/components/outputFormats.mjs', '（已授 producer 档）', '（已授 producer 档·B10）');
    assert.equal(runCli(dst, ['draft', '--kind', 'agent', '--name', 'reviewer-audit']).status, 0);
    const draftsDir = join(dst, '.drafts');
    const draftPath = join(draftsDir, readdirSync(draftsDir).find((f) => f.startsWith('reviewer-audit--')));
    const newSha = sha256(readFileSync(draftPath));
    const cardPath = join(dst, 'agents/reviewer-audit.md');
    const evPath = join(dst, 'tools/docgen/fixtures/reviewer-audit.evidence.json');
    const len0 = JSON.parse(readFileSync(evPath, 'utf8')).changes.length;
    const hash0 = sha256(readFileSync(cardPath));

    const r = runCli(dst, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', draftPath,
      '--expect-change', newSha.toUpperCase(), '--rejudge', 'B3', '--yes'], { DOCGEN_JUDGED_BY: '' });
    assert.equal(r.status, 4, r.stdout + r.stderr);
    assert.match(r.stdout + r.stderr, /缺少判者标识/);
    assert.equal(sha256(readFileSync(cardPath)), hash0);
    assert.equal(JSON.parse(readFileSync(evPath, 'utf8')).changes.length, len0);
  });
});

test('S5-TC-B11 盘上已变但 lastWrittenHash 未更新 → TargetDrift exit 1', () => {
  withRepoCopy((dst) => {
    const cardPath = join(dst, 'agents/reviewer-audit.md');
    writeFileSync(cardPath, `${readFileSync(cardPath, 'utf8')} `);
    const hash0 = sha256(readFileSync(cardPath));
    assert.equal(runCli(dst, ['draft', '--kind', 'agent', '--name', 'reviewer-audit']).status, 0);
    const draftsDir = join(dst, '.drafts');
    const draftPath = join(draftsDir, readdirSync(draftsDir).find((f) => f.startsWith('reviewer-audit--')));
    const newSha = sha256(readFileSync(draftPath));

    const r = runCli(dst, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', draftPath,
      '--expect-change', newSha.toUpperCase(), '--yes']);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /^TargetDrift:/m);
    assert.equal(sha256(readFileSync(cardPath)), hash0);
  });
});

test('S5-TC-B12 盘上 == 渲染 → 幂等短路 exit 0、changes 不追加', () => {
  withRepoCopy((dst) => {
    const cardPath = join(dst, 'agents/reviewer-audit.md');
    const evPath = join(dst, 'tools/docgen/fixtures/reviewer-audit.evidence.json');
    const len0 = JSON.parse(readFileSync(evPath, 'utf8')).changes.length;
    const hash0 = sha256(readFileSync(cardPath));
    assert.equal(runCli(dst, ['draft', '--kind', 'agent', '--name', 'reviewer-audit']).status, 0);
    const draftsDir = join(dst, '.drafts');
    const draftPath = join(draftsDir, readdirSync(draftsDir).find((f) => f.startsWith('reviewer-audit--')));

    const r = runCli(dst, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', draftPath, '--yes']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /已替换（幂等恢复）/);
    assert.equal(JSON.parse(readFileSync(evPath, 'utf8')).changes.length, len0);
    assert.equal(sha256(readFileSync(cardPath)), hash0);
  });
});

test('S5-TC-B13 正文提及旧短语不误红；两个 helper 与 B02/B03 共用且双向样例', () => {
  assert.ok(assertBoundaryClean(card('reviewer-audit'), 'card').length > 0);
  assert.doesNotThrow(() => assertBoundaryClean('## 通用纪律\n禁止创建、修改、删除任何文件\n\n## 边界\n只允许写本人产出。'));
  assert.throws(() => assertBoundaryClean('## 边界\n除落点外，不创建、修改、删除任何文件。'), /裸短语/);
  assert.throws(() => assertBoundaryClean('## 边界\n你是只读评审角色：不得创建、修改、删除任何文件'), /旧结论句/);
  assert.throws(() => assertBoundaryClean('## 边界\nA\n## 边界\nB'), /恰 1 处/);

  const SAMPLE = '## 边界\n只允许写 `round-check-<轮次>.md`。**禁止写**：不得写 `progress.md`，也不得写 `skills/dev-workflow/references/gate-record.md`。';
  const { allowed, forbidden } = writeScopeHalves(SAMPLE);
  assert.equal(allowed.includes('progress.md'), false);
  assert.ok(allowed.includes('round-check'));
  assert.match(forbidden, /不得写\s*`?progress\.md`?/);
  assert.match(forbidden, /不得写\s*`?(?:skills\/dev-workflow\/references\/)?gate-record\.md`?/);
});

test('S5-TC-B14 半改态（六元组 tools + 只读边界）的渲染矛盾必须被探针抓到', () => {
  // 半改态的真实形态是「给了写权但没写 boundary」→ 回落默认只读句（DEFAULT_BOUNDARY 不含完整旧句）
  const half = {
    ...agentData.find((a) => a.name === 'reviewer-audit'),
    tools: [...patternRegistry.tools.producer],
    boundary: DEFAULT_BOUNDARY,
  };
  const rendered = renderAgent({
    agent: half, trigger: triggerTable['reviewer-audit'], template: tpl(), sharedBlocks, outputFormats,
  });
  assert.match(rendered, /^tools: Read, Glob, Grep, Write, Edit, RunCommand$/m);
  const sec = rendered.slice(rendered.lastIndexOf('## 边界'));
  const hasWrite = /^tools: .*\bWrite\b/m.test(rendered);
  const hasOldClause = sec.includes('你是只读评审角色：不得创建、修改、删除任何文件');
  assert.ok(hasOldClause, '半改态应保留默认只读句');
  assert.equal(hasWrite && hasOldClause, true);
});

// ───────────────────────── C 组：生成物一致（C07 归 T11 实跑）─────────────────────────

test('S5-TC-C01 gate exit 0 且输出 baseline N/N（N 派生）', () => {
  const r = runCli(ROOT, ['gate']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const N = BASELINE_RULES.length + agentPaths().length;
  assert.match(r.stdout, new RegExp(`^baseline ${N}/${N}$`, 'm'));
});

test('S5-TC-C02 逐席 tools = toolsForSeat；tierOf ∈ tools 键；producer 席卡面逐字', () => {
  const producers = producerSeats();
  assert.ok(producers.length >= 2);
  const tierArrays = Object.values(patternRegistry.tools);
  for (const a of agentData) {
    assert.deepEqual(a.tools, toolsForSeat(a.name), a.name);
    assert.ok(Object.hasOwn(patternRegistry.tools, tierOf(a.name)), `${a.name} → 未知档位 ${tierOf(a.name)}`);
    const got = a.tools;
    assert.ok(tierArrays.some((tl) => tl.length === got.length && tl.every((t, i) => t === got[i])), `${a.name} 的 tools 不等于任何已知档位数组`);
  }
  for (const n of producers) {
    const a = agentData.find((x) => x.name === n);
    assert.match(card(n), new RegExp(`^tools: ${a.tools.join(', ')}$`, 'm'), n);
  }
});

test('S5-TC-C03 往卡注入一字节 → gate exit 1、Mismatch', () => {
  withRepoCopy((dst) => {
    const p = join(dst, 'agents/reviewer-audit.md');
    writeFileSync(p, `${readFileSync(p, 'utf8')} `);
    const r = runCli(dst, ['gate']);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /^Mismatch:/m);
    const detail = runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))");
    assert.ok(detail.stdout.includes('Mismatch:agents/reviewer-audit.md'), detail.stdout);
  });
});

test('S5-TC-C04 两卡 diff 报零差异', () => {
  for (const n of ['reviewer-audit', 'detective-observer']) {
    const r = runCli(ROOT, ['diff', '--kind', 'agent', '--name', n]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(r.stdout.includes('差异 - 0 / + 0（盘上 == 渲染，幂等，无需凭证）'), n);
  }
});

test('S5-TC-C05 只改 producer 数组顺序（集合不变）→ 校验绿、gate 红', () => {
  withRepoCopy((dst) => {
    // S6 起档位表下沉到定义层（spec §3.2）：构造前提的落点随之下移，判据语义不变
    patchFile(dst, 'tools/docgen/policy/definitions/tiers.mjs',
      "producer: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand']",
      "producer: ['Glob', 'Read', 'Grep', 'Edit', 'Write', 'RunCommand']");
    const v = runEsm(dst, "import {validateAgentData} from './tools/docgen/components/validateAgentData.mjs'; import {agentData, triggerTable} from './tools/docgen/components/agentData.mjs'; try { validateAgentData(agentData, triggerTable); console.log('OK'); } catch (e) { console.log('THREW ' + e.code); }");
    assert.match(v.stdout, /OK/, v.stdout + v.stderr);
    const g = runCli(dst, ['gate']);
    assert.equal(g.status, 1, g.stdout + g.stderr);
  });
});

test('S5-TC-C06 连跑两次 gate 输出一致、卡与 evidence 哈希不变', () => {
  const files = ['agents/reviewer-audit.md', 'agents/detective-observer.md',
    'tools/docgen/fixtures/reviewer-audit.evidence.json', 'tools/docgen/fixtures/detective-observer.evidence.json'];
  const before = files.map((f) => sha256(readRepo(f)));
  const g1 = runCli(ROOT, ['gate']);
  const g2 = runCli(ROOT, ['gate']);
  assert.equal(g1.status, 0, g1.stdout + g1.stderr);
  assert.equal(g2.status, 0, g2.stdout + g2.stderr);
  assert.equal(g1.stdout, g2.stdout);
  assert.deepEqual(files.map((f) => sha256(readRepo(f))), before);
});

test('S5-TC-C08 只生成一席草稿 → 旁席 Mismatch 挡住 replace', () => {
  withRepoCopy((dst) => {
    // 前提：target 盘上必须 ≠ 渲染（否则先撞幂等短路 exit 0，见 cli.mjs:425-432）
    patchFile(dst, 'tools/docgen/components/agentData.mjs', "'卡片合规：八字段齐", "'卡片合规（B）：八字段齐");
    patchFile(dst, 'tools/docgen/components/agentData.mjs', '工具越权：本轮', '工具越权（B）：本轮');
    assert.equal(runCli(dst, ['draft', '--kind', 'agent', '--name', 'reviewer-audit']).status, 0);
    const draftsDir = join(dst, '.drafts');
    const draftPath = join(draftsDir, readdirSync(draftsDir).find((f) => f.startsWith('reviewer-audit--')));
    const r = runCli(dst, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', draftPath,
      '--expect-change', sha256(readFileSync(draftPath)).toUpperCase(), '--yes']);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /^Mismatch:/m);
    const detail = runEsm(dst, "import {collectGate} from './tools/docgen/cli.mjs'; console.log(collectGate().map(d=>d.code+':'+d.path).join('|'))");
    assert.ok(detail.stdout.includes('Mismatch:agents/detective-observer.md'), detail.stdout);
  });
});

// ───────────────────────── D 组：越权负例 ─────────────────────────

test('S5-TC-D01 readOnly 席加 Write → ToolsViolation', () => {
  const d = clone();
  d.find((a) => a.name === 'evidence-reader').tools.push('Write');
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
});

test('S5-TC-D02 未映射席带 WebSearch → ToolsViolation', () => {
  const d = clone();
  d.find((a) => a.name === 'reviewer-qa').tools.push('WebSearch');
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
});

test('S5-TC-D03 producer 席注入 WebSearch → ToolsViolation，且不连带同档另一席', () => {
  const d = clone();
  const [p1, p2] = producerSeats();
  d.find((a) => a.name === p1).tools.push('WebSearch');
  assert.deepEqual(d.find((a) => a.name === p2).tools, toolsForSeat(p2));
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
});

test('S5-TC-D04 producer 六元组整档挂给 readOnly 席 → ToolsViolation', () => {
  const d = clone();
  d.find((a) => a.name === 'reviewer-qa').tools = [...toolsForSeat('reviewer-audit')];
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
});

test('S5-TC-D05 producer 席 tools 顺序打乱 → 判绿（集合恰等，不是顺序相等）', () => {
  const d = clone();
  const p1 = producerSeats()[0];
  d.find((a) => a.name === p1).tools = [...toolsForSeat(p1)].reverse();
  assert.doesNotThrow(() => validateAgentData(d, triggerTable));
});

test('S5-TC-D06 tools 含重复元素 → 当前仍通过（缺口 G-2 显式记账）', () => {
  const d = clone();
  const p1 = producerSeats()[0];
  d.find((a) => a.name === p1).tools = ['Read', 'Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'];
  let threw = false;
  try { validateAgentData(d, triggerTable); } catch { threw = true; }
  assert.equal(threw, false);
});

test('S5-TC-D07 senior-sdet 加 RunCommand → ToolsViolation（sdet ≠ producer）', () => {
  const d = clone();
  d.find((a) => a.name === 'senior-sdet').tools.push('RunCommand');
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
});

test('S5-TC-D08 producer 席 boundary 删键 / 空串 / 全空格 → DescriptionDerivation', () => {
  const producers = producerSeats();
  assert.ok(producers.length >= 2);
  assert.notEqual(
    agentData.find((a) => a.name === producers[0]).boundary,
    agentData.find((a) => a.name === producers[1]).boundary,
  );
  for (const n of producers) {
    for (const mutate of [(x) => { delete x.boundary; }, (x) => { x.boundary = ''; }, (x) => { x.boundary = '   '; }]) {
      const data = clone();
      mutate(data.find((a) => a.name === n));
      assert.throws(() => validateAgentData(data, triggerTable), (e) => e.code === 'DescriptionDerivation', n);
    }
  }
  assert.doesNotThrow(() => validateAgentData(clone(), triggerTable));
});

test('S5-TC-D09 tools 冻结后 validate / render 不抛，档位数组长度不变', () => {
  const frozen = clone().map((a) => {
    if (a.tools) Object.freeze(a.tools);
    return a;
  });
  assert.doesNotThrow(() => validateAgentData(frozen, triggerTable));
  const before = patternRegistry.tools.producer.length;
  for (let i = 0; i < 3; i += 1) {
    assert.doesNotThrow(() => renderAgent({
      agent: frozen[0], trigger: triggerTable[frozen[0].name], template: tpl(), sharedBlocks, outputFormats,
    }));
  }
  assert.equal(patternRegistry.tools.producer.length, before);
});

test('S5-TC-D10 条目自带 tools 的展开顺序后门：...s 在 tools 之后 + 外来 tools 被拒', () => {
  const src = readRepo('tools/docgen/components/agentData.mjs');
  const hits = [...src.matchAll(/tools:\s*toolsForSeat\(\s*s\.name\s*\)/g)];
  assert.equal(hits.length, 1, '`tools: toolsForSeat(s.name)` 必须恰 1 处（空白归一后）');
  const i = hits[0].index;
  const j = src.indexOf('...s', i);
  assert.ok(j > i, '`...s` 必须在 tools 之后（否则条目自带 tools 静默覆盖档位）');
  assert.ok(j - i < 400, '`...s` 距 `tools` 过远，可能不是同一次对象展开');

  const d = clone();
  d.find((a) => a.name === 'reviewer-audit').tools = ['Read', 'Glob', 'Grep'];
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
});

// ───────────────────────── E 组：计数派生与文档同步 ─────────────────────────

test('S5-TC-E04 全仓测试零硬编码档位数量 + 旧计数注释守卫 + 样例行不自伤', () => {
  for (const [f, s] of Object.entries(readCounterFiles())) {
    assert.deepEqual(s.split(/\r?\n/).filter(isTierCountLine), [], f);
  }
  assert.equal(/readOnly 12|sdet 1|command 2/.test(readRepo('tools/docgen/components/validateAgentData.mjs')), false);
  assert.equal((readRepo('tools/docgen/test/tool-tiers.test.mjs').match(/[四五六]档/g) ?? []).length, 0, '样例行必须运行时拼接，否则本文件自伤');
  // 夹具先落到常量：直接内联在 assert 行里会被 counterProbes 的「assert 行含 14/15」探针误判（自伤）
  const FIXTURE = 'const a = 15; // 注释里的 15 不算';
  assert.deepEqual(counterProbes({ 'fixture.test.mjs': FIXTURE }).baseline, []);
});

test('S5-TC-E05 tools.command 四元组仍在、渲染边界句非空且等于映射值', () => {
  assert.deepEqual(patternRegistry.tools.command, ['Read', 'Glob', 'Grep', 'RunCommand']);
  // 判据由 S6 改判（S6 spec §3.6 ①）：旧的死常量已删，改为「渲染结果非空且 === boundaryBySeat 的值」
  const rendered = renderBoundary('reviewer-audit');
  assert.equal(typeof rendered === 'string' && rendered.length > 0, true);
  assert.equal(rendered, patternRegistry.boundaryBySeat['reviewer-audit']);
});

test('S5-TC-E06 review-fixes I5 样本必须是运行时 readOnly 席（不是 data[0]）', () => {
  const d = clone();
  const sample = d.find((a) => a.name === 'reviewer-qa');
  assert.equal(tierOf(sample.name), 'readOnly');
  sample.tools = [...toolsForSeat(sample.name), 'Write'];
  assert.throws(() => validateAgentData(d, triggerTable), (e) => e.code === 'ToolsViolation');
  const src = readRepo('tools/docgen/test/review-fixes.test.mjs');
  assert.equal(/data\[0\]\.tools = \[\.\.\.patternRegistry\.tools\.readOnly, 'Write'\]/.test(src), false);
});

test('S5-TC-E07 gate 的 N/N 由基线清单派生，测试里不出现字面 baseline 数字', () => {
  const N = BASELINE_RULES.length + agentPaths().length;
  assert.ok(N > 0);
  assert.equal(agentPaths().length, agentData.length);
  const g = runCli(ROOT, ['gate']);
  assert.match(g.stdout, new RegExp(`^baseline ${N}/${N}$`, 'm'));
  for (const [f, s] of Object.entries(readCounterFiles())) {
    if (f === 'tool-tiers.test.mjs') continue;
    // 负例夹具把「违规写法」当字符串写在用例里（剥串后不计），与 counterProbes 同一口径
    assert.equal(/baseline \d+\/\d+/.test(stripCommentsAndStrings(s)), false, f);
  }
});

test('S5-TC-E08 skills/ 全树无旧档位句 + 三处流程文档含「已授 producer 档」', () => {
  const OLD = /已授\s*`command`\s*档/;
  const NEW = /已授\s*`producer`\s*档/;
  const files = mdFilesUnder('skills');
  assert.ok(files.length > 0, 'skills/ 下必须扫到 markdown 文件（防恒真）');
  for (const [f, s] of files) assert.equal(OLD.test(s), false, f);

  const DOCS = ['skills/parliament/references/debate-protocol.md',
    'skills/parliament/assets/round-check.md',
    'skills/dev-workflow/references/stage-4-quality.md'];
  for (const p of DOCS) assert.match(readRepo(p), NEW, p);
});

test('S5-TC-E09 open-items.md 无 B-5 行、B-1 换成三条接班条目、仍标未决', () => {
  const src = readRepo('docs/after/20261024174253-dev-workflow-mainline-open-items.md');
  assert.equal(src.includes('| B-5 |'), false);
  assert.equal(src.includes('| B-1 |'), false);
  const rows = src.split(/\r?\n/).filter((l) => l.startsWith('|'));
  assert.ok(rows.some((l) => /research/.test(l) && /S5-R/.test(l) && /S2/.test(l)), '缺 research → S5-R 接班条目');
  assert.ok(rows.some((l) => /精算师|reviewer-actuary/.test(l) && /取数|command/.test(l) && /S2/.test(l)), '缺精算师取数权 → S2 接班条目');
  assert.ok(rows.some((l) => /S5-B/.test(l) && /检测|B3|模板/.test(l)), '缺 S5-B 接班条目');
  assert.match(src, /状态：\*\*未决\*\*/);
});
