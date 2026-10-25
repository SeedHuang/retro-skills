#!/usr/bin/env node
// docgen CLI（R1）：六子命令统一入口。本任务实现 generate + gate；draft/replace/check-agents/baseline 由 Task 5/6 扩展。
import { readFileSync, existsSync, realpathSync, mkdirSync, writeFileSync, readdirSync, rmSync, renameSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { agentData, triggerTable, AGENT_KINDS } from './components/agentData.mjs';
import { patternRegistry } from './components/patternRegistry.mjs';
import { validateAgentData, exitCodeFor } from './components/validateAgentData.mjs';
import { BASELINE_RULES, agentPaths, renderBaseline } from './components/baseline.mjs';
import * as spec from './components/specTestCaseGate.mjs';
import { compareBuffers, checkEnvironment } from './components/compare.mjs';
import { renderByName } from './components/renderByName.mjs';
import { validatePolicy } from './components/validatePolicy.mjs';
import { dumpPolicy } from './components/dumpPolicy.mjs';
import { readState, writeState, setAgentState, statePath } from './state.mjs';
import { readEvidence, writeEvidence, evidencePath } from './evidence.mjs';
// 结构层与语义键来自 check-agent；渲染器已抽到 renderByName.mjs，故 check-agent 不再 import 本文件（无环）
import { checkStruct, readAnnotations, SEMANTIC_KEYS } from '../execution-matrix/check-agent.mjs';
import { fenceMask } from '../execution-matrix/markdown-rows.mjs';

// 对外仍从 cli 导出（既有测试/调用方按 cli.mjs 取渲染器）；实现已移入 components/renderByName.mjs
export { renderByName };

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_DIR = join(REPO_ROOT, 'agents');
// baseline 清单路径可用 DOCGEN_BASELINE_PATH 重定向（与 state / evidence / drafts 同款测试隔离位）：
// 测试写的是临时文件，不再与非同进程的 gate 抢同一个共享文件（并发 truncate 窗口会让 gate 误报 BaselineDrift）
const baselinePath = () => process.env.DOCGEN_BASELINE_PATH || join(dirname(fileURLToPath(import.meta.url)), 'baseline.json');
const GENERATED_RULE = 'rules/spec-testcase-gate.md'; // 唯一生成规则（Ruling S3）

// fields.message：可选人读信息（stderr 契约要写出哈希 / 下一步命令，spec §3.3）
function fail(code, fields = {}) { const e = new Error(fields.message ?? code); e.code = code; Object.assign(e, fields); e.exitCode = exitCodeFor(code); throw e; }

export function sha256Hex(buf) { return createHash('sha256').update(buf).digest('hex').toUpperCase(); }

function readTemplate(kind) {
  if (kind === 'rule') return readFileSync(spec.TEMPLATE_PATH, 'utf8');
  const p = join(dirname(fileURLToPath(import.meta.url)), 'templates', kind === 'agent' ? 'agent.md.tpl' : 'agent-handwritten.md.tpl');
  if (!existsSync(p)) fail('TemplateReadFailed', { path: p });
  return readFileSync(p, 'utf8');
}

export function cmdGenerate(args) {
  const kind = args.kind ?? 'all';
  const name = args.name;
  if (name !== undefined && !/^[a-z][a-z0-9-]{0,49}$/.test(name)) fail('InvalidName', { name });
  const objs = name
    ? [{ kind: kind === 'all' ? 'agent' : kind, name, path: `${kind === 'rule' ? 'rules' : 'agents'}/${name}.md` }]
    : kind === 'all'
      ? [...BASELINE_RULES.map((p) => ({ kind: 'rule', path: p })), ...agentPaths().map((p) => ({ kind: 'agent', path: p, name: p.slice(7, -3) }))]
      : kind === 'rule'
        ? BASELINE_RULES.map((p) => ({ kind: 'rule', path: p }))
        : agentPaths().map((p) => ({ kind: 'agent', path: p, name: p.slice(7, -3) }));
  let drift = 0;
  for (const o of objs) {
    if (o.kind === 'rule') {
      // Ruling S3：只对生成规则逐字节比对；其余 baseline rule 存在性 + 环境检查
      const p = join(REPO_ROOT, o.path);
      if (!existsSync(p)) fail('DanglingBaselineEntry', { name: o.path, path: p });
      const target = readFileSync(p, 'utf8');
      checkEnvironment(Buffer.from(target), 'target', o.path);
      if (o.path === GENERATED_RULE) {
        const rendered = spec.render(spec.buildData(), readTemplate('rule'));
        if (compareBuffers(Buffer.from(rendered), Buffer.from(target))) drift += 1;
      }
    } else {
      const agent = agentData.find((a) => a.name === o.name);
      if (!agent) fail('MissingComponentData', { name: o.name });
      const p = join(AGENTS_DIR, `${o.name}.md`);
      if (!existsSync(p)) fail('DanglingBaselineEntry', { name: o.name });
      const t = triggerTable[o.name];
      if (!t || t.when === undefined) continue; // registered 未拆槽席：存在性检查
      const rendered = Buffer.from(renderByName(o.name), 'utf8');
      if (compareBuffers(rendered, readFileSync(p))) drift += 1;
    }
  }
  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`);
  return drift === 0 ? 0 : 1;
}

// collectGate：收集漂移清单（不抛）——cmdReplace 判别子与 gateChecks 共用（Task 7）
export function collectGate() {
  const drifts = [];
  validateAgentData(agentData, triggerTable);
  const onDisk = readFileSync(baselinePath(), 'utf8');
  if (onDisk !== renderBaseline()) drifts.push({ code: 'BaselineDrift', path: baselinePath() });
  const tpl = readTemplate('rule');
  const target = readFileSync(join(REPO_ROOT, GENERATED_RULE), 'utf8');
  if (compareBuffers(Buffer.from(spec.render(spec.buildData(), tpl)), Buffer.from(target))) {
    drifts.push({ code: 'Mismatch', path: GENERATED_RULE });
  }
  for (const p of BASELINE_RULES) {
    if (p === GENERATED_RULE) continue;
    const rp = join(REPO_ROOT, p);
    if (!existsSync(rp)) { drifts.push({ code: 'DanglingBaselineEntry', path: p }); continue; }
    try { checkEnvironment(Buffer.from(readFileSync(rp, 'utf8')), 'target', p); }
    catch (e) { drifts.push({ code: e.code ?? 'EnvironmentEOL', path: p }); }
  }
  let state;
  try { state = readState(); }
  catch (e) { drifts.push({ code: e.code ?? 'StateFileInvalid', path: statePath() }); state = { agents: {} }; }
  for (const a of agentData) {
    const p = join(AGENTS_DIR, `${a.name}.md`);
    if (!existsSync(p)) { drifts.push({ code: 'DanglingBaselineEntry', path: `agents/${a.name}.md` }); continue; }
    if (state.agents[a.name] === 'replaced') {
      if (compareBuffers(Buffer.from(renderByName(a.name), 'utf8'), readFileSync(p))) {
        drifts.push({ code: 'Mismatch', path: `agents/${a.name}.md` });
      }
    }
  }
  const scanRulesDir = process.env.DOCGEN_RULES_DIR || join(REPO_ROOT, 'rules');
  const scanAgentsDir = process.env.DOCGEN_AGENTS_DIR || join(REPO_ROOT, 'agents');
  for (const f of readdirSync(scanRulesDir)) {
    if (f.endsWith('.md') && !BASELINE_RULES.includes(`rules/${f}`)) {
      drifts.push({ code: 'UnregisteredHandwritten', path: `rules/${f}` });
    }
  }
  for (const f of readdirSync(scanAgentsDir)) {
    if (f.endsWith('.md') && !agentPaths().includes(`agents/${f}`)) {
      drifts.push({ code: 'UnregisteredHandwritten', path: `agents/${f}` });
    }
  }
  return drifts;
}

const BASELINE_CLASS = new Set(['BaselineDrift', 'UnregisteredHandwritten', 'DanglingBaselineEntry', 'StateFileInvalid', 'EnvironmentEOL', 'InvalidBaseline', 'InvalidBaselinePath']);
const PRIORITY = (d) => (BASELINE_CLASS.has(d.code) ? 0 : 1);

export function gateChecks() {
  // 运行时唯一防线（spec:196）：配置 / 模板非法时 gate 必须 exit 1 并给五个码之一，
  // 不得落成 `Mismatch`、不得被静默放行；排在既有逐席比对之前（`Mismatch` 管产物漂移，两件事不互相替代）
  validatePolicy();
  const drifts = collectGate();
  if (drifts.length === 0) return;
  const first = [...drifts].sort((a, b) => PRIORITY(a) - PRIORITY(b))[0];
  fail(first.code, first);
}

// 只读子命令（spec §5）：先跑 validatePolicy（五码唯一发射点），再输出 dumpPolicy 的 JSON，**不写盘**。
// 接受的旗标只有 `--dump`；`--write` / `--out` / `--apply` 与任何未知旗标一律 InvalidArgs（exit 2）。
export function cmdPolicy() {
  validatePolicy();
  console.log(JSON.stringify(dumpPolicy(process.cwd()).json, null, 2));
  return 0;
}

export function cmdGate() {
  gateChecks();
  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`);
  return 0;
}

export function cmdCheckAgents() {
  const state = readState();
  let replaced = 0;
  let unconsolidated = 0;
  for (const a of agentData) {
    const p = join(AGENTS_DIR, `${a.name}.md`);
    if (!existsSync(p)) fail('DanglingBaselineEntry', { name: a.name, path: p });
    const s = state.agents[a.name];
    if (s === 'replaced') {
      replaced += 1;
      const rendered = Buffer.from(renderByName(a.name), 'utf8');
      if (compareBuffers(rendered, readFileSync(p))) fail('Mismatch', { name: a.name, path: p });
    } else {
      unconsolidated += 1;
    }
  }
  console.log(`OK：${agentData.length} 个 agent 已检查（已接管 ${replaced}，未迁移 ${unconsolidated}）`);
  return 0;
}

export function cmdBaselineWrite() {
  // 原子写（与 state.mjs writeState / evidence.mjs writeEvidence 同构）：`writeFileSync` 先截断后写入，
  // 并发读方（另一个进程的 gate）会在窗口里看到空文件 → 误报 BaselineDrift。rename 原子替换消掉该窗口。
  const p = baselinePath();
  mkdirSync(dirname(p), { recursive: true });
  const tmp = `${p}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, renderBaseline(), 'utf8');
    renameSync(tmp, p);
  } catch (e) {
    rmSync(tmp, { force: true });
    throw e;
  }
  console.log(`baseline.json 已写入（${BASELINE_RULES.length + agentPaths().length} 条）`);
  return 0;
}

const DRAFTS_DIR = () => process.env.DOCGEN_DRAFTS_DIR || join(homedir(), '.retro-skills', 'docgen-drafts');
const ts = () => { const d = new Date(); const p = (n, w = 2) => String(n).padStart(w, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

export function assertAgentName(name) { if (!/^[a-z][a-z0-9-]{0,49}$/.test(name)) fail('InvalidName', { name }); }

// ── diff 单点（spec §3.2 / §4 步 1）：给人看的差异与写盘判的字节必须同一套算法 ──
// 行数口径（唯一）：按 `\n` 切分后的元素个数（以换行结尾的文件，末尾空串计入）。
// 差异算法：最长公共前缀 P + 最长公共后缀 S，中间段逐行打印；两处以上小改动合并成一块（已知取舍）。
export function diffLines(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const mn = Math.min(oldLines.length, newLines.length);
  let P = 0;
  while (P < mn && oldLines[P] === newLines[P]) P += 1;
  let S = 0;
  while (S < mn - P && oldLines[oldLines.length - 1 - S] === newLines[newLines.length - 1 - S]) S += 1;
  return {
    P,
    S,
    k: P + 1,
    rowsOld: oldLines.length,
    rowsNew: newLines.length,
    minus: oldLines.slice(P, oldLines.length - S),
    plus: newLines.slice(P, newLines.length - S),
  };
}

// 中段行格式（唯一）：符号 + 一个空格 + 该侧原文；原文为空行时该行以「符号 + 空格」结尾。
// 用模板拼切片，**禁止 trim**（否则「删了一个空行」与「删了一行文字」在输出上不可区分）。
export function formatDiff(name, oldText, newText) {
  const d = diffLines(oldText, newText);
  const oldSha = sha256Hex(Buffer.from(oldText, 'utf8'));
  const newSha = sha256Hex(Buffer.from(newText, 'utf8'));
  const out = [
    `旧 agents/${name}.md  sha256=${oldSha}（${d.rowsOld} 行）`,
    `新 渲染            sha256=${newSha}（${d.rowsNew} 行）`,
  ];
  if (oldSha === newSha) {
    out.push('差异 - 0 / + 0（盘上 == 渲染，幂等，无需凭证）');
    return out;
  }
  out.push(`差异 - ${d.minus.length} / + ${d.plus.length}（首处第 ${d.k} 行）`);
  for (const line of d.minus) out.push(`- ${line}`);
  for (const line of d.plus) out.push(`+ ${line}`);
  out.push(`凭证 --expect-change ${newSha}`);
  return out;
}

// 逐行所属节（跳过代码围栏内的伪标题，与 check-agent 的 splitSections 同口径）
function sectionOf(text) {
  const lines = text.split('\n');
  const { mask } = fenceMask(lines);
  const out = new Array(lines.length).fill('');
  let cur = '';
  for (let i = 0; i < lines.length; i += 1) {
    if (!mask[i]) {
      const m = /^#{1,6}\s+(.*)$/.exec(lines[i]);
      if (m) cur = m[1].trim();
    }
    out[i] = cur;
  }
  return out;
}

// 重判触达映射（spec §3.6 表 A，下限）：两侧差异行号取并集后再按位置求键集。
// 只按新侧定位会漏「整节删除」——那时新侧没有行可查，`--rejudge none` 会被放行。
// 表 B（A3–A7）不进 `--rejudge`：它们没有注解位，改由 machineChecks 承接。
export function touchedSemanticKeys(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const oldSec = sectionOf(oldText);
  const newSec = sectionOf(newText);
  const keys = new Set();
  const n = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < n; i += 1) {
    if (oldLines[i] === newLines[i]) continue;
    for (const [lines, secs] of [[oldLines, oldSec], [newLines, newSec]]) {
      const line = lines[i];
      if (line === undefined) continue;
      if (/^description: /.test(line)) { keys.add('A2'); continue; }
      const heading = secs[i] ?? '';
      if (heading.includes('你是谁') || heading.includes('身份')) keys.add('A1');
    }
  }
  return [...keys].sort();
}

// 机器结构项复检（spec §3.4：每次变更必填五键，由 checkStruct 对渲染产物重跑）
export function machineChecksOf(renderedText) {
  const failed = new Set(checkStruct(renderedText).findings.map((f) => f.code));
  const out = {};
  for (const key of ['A3', 'A4', 'A5', 'A6', 'A7']) out[key] = failed.has(key) ? 'fail' : 'pass';
  return out;
}

// 重判落账（spec §3.4 / §6-6）：`--rejudge` 只给键名，verdict 只能取自重判者写回的 annotations。
// 报过但 annotations 不是 pass/fail = 重判没做完 → 不许写盘（把「报」升级成「判」）。
// 判者身份必须显式给出：缺省编一个占位名（如 'annotations-writer'）会让「谁判的」变成假值，
// 并把 evidence 校验与独立性断言一并空转（2026-10-21 代码审查问题 3）。故无默认值，缺则拒写盘。
function judgeId(name) {
  const id = (process.env.DOCGEN_JUDGED_BY || '').trim();
  if (!id) {
    fail('UnapprovedChange', {
      message: `缺少判者标识：--rejudge ${name} 非空时必须用 DOCGEN_JUDGED_BY 给出重判子代理实例（例：DOCGEN_JUDGED_BY=reviewer-ai-2026-10-21-a2-rejudge node tools/docgen/cli.mjs replace …），否则 changes[].judgedBy 无法落账；本次未写盘`,
    });
  }
  return id;
}
function buildJudged(name, keys) {
  const ann = readAnnotations();
  return keys.map((key) => {
    const raw = ann[`${name}:${key}`];
    const v = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
    const verdict = v === 'pass' ? 'pass' : v.startsWith('fail') ? 'fail' : null;
    if (!verdict) {
      fail('UnapprovedChange', {
        message: `${name}:${key} 报为重判键，但 rules/.inspector-annotations.json 的值是 ${raw === undefined ? '缺失' : JSON.stringify(raw)}（非 pass/fail）——重判未完成，先让独立子代理判完并写回，再运行 node tools/docgen/cli.mjs diff --kind agent --name ${name}`,
      });
    }
    return { key, verdict, basis: `tools/execution-matrix/criteria.md ${key} + 渲染产物；重判写回 rules/.inspector-annotations.json ${name}:${key} = ${raw}（replace 机械转录）` };
  });
}

// 只读 diff：打印旧/新哈希与差异块，并给出可直接复制的凭证；不写任何文件（含 evidence）
export function cmdDiff(args) {
  if (args.kind !== 'agent') {
    fail('UnsupportedKind', { kind: args.kind, sub: 'diff', message: `UnsupportedKind: sub=diff kind=${args.kind}（diff 只支持 --kind agent）` });
  }
  assertAgentName(args.name);
  const name = args.name;
  if (!agentData.find((a) => a.name === name)) fail('MissingComponentData', { name });
  const rendered = renderByName(name); // registered 未拆槽席在此抛 MissingComponentData
  const target = join(AGENTS_DIR, `${name}.md`);
  // 条目缺失（agentData 无此名）与卡缺失（盘上没文件）是两个失败面：后者若先渲染，会造出一份凭空旧卡
  if (!existsSync(target)) fail('DanglingBaselineEntry', { name, path: `agents/${name}.md` });
  for (const line of formatDiff(name, readFileSync(target, 'utf8'), rendered)) console.log(line);
  return 0;
}

export function cmdDraft(args, argv) {
  const sub = args.sub;
  const dir = DRAFTS_DIR();
  if (sub === 'ensure') { mkdirSync(dir, { recursive: true }); return 0; }
  if (sub === 'ls') {
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => !args.name || f.startsWith(`${args.name}--`)) : [];
    for (const f of files.sort().reverse()) console.log(f);
    return 0;
  }
  if (sub === 'rm') {
    if (!args.name && !argv.includes('--yes')) fail('NotAuthorized', {});
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => !args.name || f.startsWith(`${args.name}--`)) : [];
    for (const f of files) rmSync(join(dir, f), { force: true });
    return 0;
  }
  // sub === 'draft'（生成）
  const name = args.name;
  assertAgentName(name);
  if (args.kind !== 'agent') fail('UnsupportedKind', { kind: args.kind });
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });
  const existing = existsSync(dir) ? readdirSync(dir).filter((f) => f.startsWith(`${name}--`)) : [];
  if (existing.length > 0) fail('DraftNameConflict', { name, existing: existing.join(', ') });
  const file = `${name}--${ts()}.md`;
  const content = renderByName(name); // registered 席在此抛 MissingComponentData，此时尚未建箱目录（J4 fix）
  mkdirSync(dir, { recursive: true });
  try { writeFileSync(join(dir, file), content, { flag: 'wx' }); }
  catch (e) {
    if (e.code === 'EEXIST') fail('DraftNameConflict', { name, existing: file });
    fail('DraftWriteFailed', { path: join(dir, file) });
  }
  console.log(`草稿已落：${join(dir, file)}`);
  return 0;
}

export function cmdReplace(args) {
  if (args.kind !== 'agent') {
    fail('UnsupportedKind', { kind: args.kind, sub: 'replace', message: `UnsupportedKind: sub=replace kind=${args.kind}（replace 只支持 --kind agent）` });
  }
  assertAgentName(args.name);
  if (!args.yes) fail('NotAuthorized', {});
  const name = args.name;
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });

  // R1 分派：以 state 为唯一键。`suspended` 与「无此席」一律落迁移段（§8 不提供 suspended 变更通路）
  const st = readState();
  const phase = st.agents[name] === 'replaced' ? 'change' : 'migration';
  if (phase === 'migration' && (args.expectChange !== undefined || args.rejudge !== undefined)) {
    fail('InvalidArgs', {
      message: `InvalidArgs: ${name} 尚在迁移段（state=${st.agents[name] ?? '未登记'}），不接受 --expect-change / --rejudge；迁移完成后改内容才走变更段`,
    });
  }
  if (!args.draft || !existsSync(args.draft)) fail('DraftNotFound', { draft: args.draft });

  // 启动清理：上次崩溃残留的 .part 临时文件（在读取目标之前）
  for (const f of readdirSync(AGENTS_DIR).filter((x) => x.startsWith(`.tmp-${name}-`) && x.endsWith('.part'))) {
    rmSync(join(AGENTS_DIR, f), { force: true });
  }

  const draftBytes = readFileSync(args.draft);
  const rendered = Buffer.from(renderByName(name), 'utf8'); // registered 未拆槽席在此抛 MissingComponentData
  if (!draftBytes.equals(rendered)) fail('DraftDrift', { name });
  const evidence = readEvidence(name);
  // 迁移段四道证明（§3.1 左列）：变更段不读这三项，改读凭证
  if (phase === 'migration') {
    if (evidence.renderSha256 !== sha256Hex(rendered)) {
      fail('EvidenceInvalid', { name, reason: 'renderSha256 与草稿不等，须重跑步 4' });
    }
    if (evidence.goldenAssertion !== 'pass') {
      fail('EvidenceInvalid', { name, reason: '黄金断言未通过（W2-② 未过不得替换）' });
    }
    // 双闸门之二：diffSet 差异集须为空（golden-assert 通过但仍有残余差异 = 步 4 未真正过）
    if (evidence.compareResult !== null) {
      fail('EvidenceInvalid', { name, reason: 'compareResult 非 null（差异集未清空，步 4 未过不得替换）' });
    }
  }

  const drifts = collectGate();
  const allowed = (d) => {
    if (d.path === `agents/${name}.md`) return true;
    const m = /^agents\/([a-z0-9-]+)\.md$/.exec(d.path);
    if (!m) return false;
    const other = m[1];
    if (st.agents[other] !== 'replaced') return false;
    const box = DRAFTS_DIR();
    if (!existsSync(box)) return false;
    const f = readdirSync(box).find((x) => x.startsWith(`${other}--`));
    if (!f) return false;
    return readFileSync(join(box, f)).equals(Buffer.from(renderByName(other), 'utf8'));
  };
  const blocked = drifts.filter((d) => !allowed(d));
  if (blocked.length > 0) {
    const first = [...blocked].sort((a, b) => PRIORITY(a) - PRIORITY(b))[0];
    fail(first.code, first);
  }

  const target = join(AGENTS_DIR, `${name}.md`);
  // #6：target 缺失须在 collectGate 判别子放行（allowed 对 target 无条件 return true）后、硬读之前捕获，
  // 否则 readFileSync 抛 ENOENT 被兜底成 exit 2，掩盖 DanglingBaselineEntry 的可读语义
  if (!existsSync(target)) fail('DanglingBaselineEntry', { name, path: `agents/${name}.md` });
  const targetBytes = readFileSync(target);
  const oldSha = sha256Hex(targetBytes);
  const newSha = sha256Hex(rendered);

  // 幂等判定排在 TargetDrift 之前：崩溃窗口（文件已 rename、evidence 未写）重跑时盘上哈希已不等于
  // lastWrittenHash，先判 TargetDrift 就永远收敛不了。幂等分支不写盘、不追加留痕、不校验凭证（§3.1 末行）。
  if (phase === 'change' && targetBytes.equals(rendered)) {
    evidence.renderSha256 = newSha;
    evidence.lastWrittenHash = newSha;
    writeEvidence(name, evidence);
    clearDrafts(name);
    console.log(`已替换（幂等恢复）：${target}`);
    return 0;
  }

  if (oldSha !== evidence.lastWrittenHash) fail('TargetDrift', { name, path: target });

  // 变更段：凭证 + 重判触达（必须排在 TargetDrift 之后，否则 S2 的 exit 1 会变成 exit 4）
  let rejudged = [];
  let judged = [];
  let judgedBy = null;
  let machineChecks = null;
  if (phase === 'change') {
    const nextStep = `下一步运行 node tools/docgen/cli.mjs diff --kind agent --name ${name}`;
    if (args.expectChange === undefined) {
      fail('UnapprovedChange', { message: `盘上=${oldSha} 渲染=${newSha} 缺 --expect-change；${nextStep}` });
    }
    if (args.expectChange.toUpperCase() !== newSha) {
      fail('UnapprovedChange', {
        message: `盘上=${oldSha} 渲染=${newSha} --expect-change=${args.expectChange.toUpperCase()} ≠ 渲染哈希（凭证须是即将写盘字节的 sha256，旧凭证一律失效）；${nextStep}`,
      });
    }
    const need = touchedSemanticKeys(targetBytes.toString('utf8'), rendered.toString('utf8'));
    rejudged = parseRejudgeKeys(args.rejudge);
    const missing = need.filter((k) => !rejudged.includes(k));
    if (missing.length > 0) {
      fail('UnapprovedChange', {
        message: `盘上=${oldSha} 渲染=${newSha} --rejudge 漏报触达键 ${missing.join(',')}（差异落在这些键的判定对象上，改过的判定对象不能沿用旧判定）；${nextStep}`,
      });
    }
    judged = buildJudged(name, rejudged); // 重判未完成（annotations 非 pass/fail）→ 此处即拒，绝不写盘
    if (rejudged.length) judgedBy = judgeId(name); // 判者标识同样在写盘前取：缺则拒，避免写完才发现无法落账
    machineChecks = machineChecksOf(rendered.toString('utf8'));
  }

  // state 置位次序（§3.5）：rename 成功后才置 replaced；写失败时 state 保持写盘前原样
  const tmp = join(AGENTS_DIR, `.tmp-${name}-${process.pid}.part`);
  try {
    writeFileSync(tmp, draftBytes);
    renameSync(tmp, target);
  } catch {
    rmSync(tmp, { force: true });
    fail('WriteFailed', { path: target });
  }
  setAgentState(name, 'replaced');
  clearDrafts(name);
  evidence.renderSha256 = newSha;
  evidence.lastWrittenHash = newSha;
  if (phase === 'change') {
    const entry = { from: oldSha, to: newSha, at: new Date().toISOString(), rejudged, judgeMode: rejudged.length ? 'subagent' : 'none' };
    if (rejudged.length) entry.judgedBy = judgedBy;
    entry.judged = judged;
    entry.machineChecks = machineChecks;
    evidence.changes = [...(Array.isArray(evidence.changes) ? evidence.changes : []), entry];
  }
  writeEvidence(name, evidence);
  console.log(`已替换：${target}`);
  return 0;
}

function clearDrafts(name) {
  const dir = DRAFTS_DIR();
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).filter((x) => x.startsWith(`${name}--`))) rmSync(join(dir, f), { force: true });
}

// ── 参数白名单（spec §3.3 末条）：指定 sub 下只接受本文列出的旗标 ──
// 宽松的 flag()/has() 会静默丢弃未知旗标，让「迁移段出现 --expect-change → InvalidArgs」根本落不了地，
// 拼错一个字母也会变成静默放行。故 replace / diff 走严格解析：白名单外的 `--xxx` 一律 InvalidArgs。
const VALUE = 'value';
const BOOL = 'bool';
const REPLACE_FLAGS = { '--kind': VALUE, '--name': VALUE, '--draft': VALUE, '--expect-change': VALUE, '--rejudge': VALUE, '--yes': BOOL };
const DIFF_FLAGS = { '--kind': VALUE, '--name': VALUE };
// 只读子命令：只接受 `--dump`（`--write` / `--out` / `--apply` 落到「未知旗标」→ InvalidArgs exit 2）
const POLICY_FLAGS = { '--dump': BOOL };

function parseArgs(rest, spec, sub) {
  const out = {};
  for (let i = 0; i < rest.length; i += 1) {
    const tok = rest[i];
    if (!tok.startsWith('--')) fail('InvalidArgs', { sub, message: `InvalidArgs: sub=${sub} 不接受位置参数 ${tok}` });
    const kind = spec[tok];
    if (!kind) fail('InvalidArgs', { sub, message: `InvalidArgs: sub=${sub} 未知旗标 ${tok}（允许：${Object.keys(spec).join(' ')}）` });
    if (kind === BOOL) { out[tok] = true; continue; }
    const value = rest[i + 1];
    // `--expect-change --yes` 这类「下一个 token 还是旗标」视为缺值，不许把 --yes 当哈希
    if (value === undefined || value.startsWith('--')) {
      fail('InvalidArgs', { sub, message: `InvalidArgs: sub=${sub} ${tok} 缺值` });
    }
    out[tok] = value;
    i += 1;
  }
  return out;
}

// `--rejudge none` → []（禁记 ["none"]）；值里出现 10 个语义键之外的键 → InvalidArgs 并列出合法键
function parseRejudgeKeys(raw) {
  if (raw === undefined) return [];
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) fail('InvalidArgs', { message: 'InvalidArgs: --rejudge 为空值' });
  if (parts.includes('none')) {
    if (parts.length > 1) fail('InvalidArgs', { message: `InvalidArgs: --rejudge none 不能与其它键混用（收到 ${raw}）` });
    return [];
  }
  return [...new Set(parts)];
}

function validateReplaceArgs(a) {
  const ec = a['--expect-change'];
  if (ec !== undefined && !/^[0-9a-fA-F]{64}$/.test(ec)) {
    fail('InvalidArgs', { message: `InvalidArgs: --expect-change 须为 64 位十六进制 sha256（收到 ${JSON.stringify(ec)}）` });
  }
  const raw = a['--rejudge'];
  if (raw === undefined) return;
  const keys = parseRejudgeKeys(raw);
  const bad = keys.filter((k) => !SEMANTIC_KEYS.includes(k));
  if (bad.length > 0) {
    fail('InvalidArgs', {
      message: `InvalidArgs: --rejudge 含非法键 ${bad.join(',')}（收到 ${raw}）；A3–A7 是机器结构项、不进 --rejudge（由 machineChecks 承接）；合法键：${SEMANTIC_KEYS.join(' ')}`,
    });
  }
}

export function main(argv) {
  try {
    const sub = argv[0];
    const rest = argv.slice(1);
    const flag = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] ?? d : d; };
    const has = (k) => rest.includes(k);
    if (sub === 'generate') return cmdGenerate({ kind: flag('--kind', undefined), name: flag('--name', undefined) });
    if (sub === 'gate') return cmdGate();
    if (sub === 'draft' || sub === 'draft ls' || sub === 'draft rm' || sub === 'draft ensure') {
      const parts = argv[0] === 'draft' && ['ls', 'rm', 'ensure'].includes(argv[1]) ? ['draft', argv[1], ...argv.slice(2)] : argv;
      // 健康 sub 归一再传：仅 ls/rm/ensure 是真正的子命令，其余（如 --name）都应视为生成 draft，避免 `draft --name x` 时 sub 携带错误值
      const healthySub = ['ls', 'rm', 'ensure'].includes(parts[1]) ? parts[1] : 'draft';
      return cmdDraft({ sub: healthySub, kind: flag('--kind', 'agent'), name: flag('--name', undefined) }, parts);
    }
    if (sub === 'replace') {
      const a = parseArgs(rest, REPLACE_FLAGS, 'replace');
      validateReplaceArgs(a);
      return cmdReplace({
        kind: a['--kind'] ?? 'agent',
        name: a['--name'],
        draft: a['--draft'],
        yes: a['--yes'] === true,
        expectChange: a['--expect-change'],
        rejudge: a['--rejudge'],
      });
    }
    if (sub === 'diff') {
      const a = parseArgs(rest, DIFF_FLAGS, 'diff');
      return cmdDiff({ kind: a['--kind'] ?? 'agent', name: a['--name'] });
    }
    if (sub === 'policy') {
      const a = parseArgs(rest, POLICY_FLAGS, 'policy');
      if (a['--dump'] !== true) fail('InvalidArgs', { sub, message: 'InvalidArgs: sub=policy 只接受 --dump（本子命令只读、不写盘）' });
      return cmdPolicy();
    }
    if (sub === 'check-agents') return cmdCheckAgents();
    if (sub === 'baseline' && rest[0] === '--write') return cmdBaselineWrite();
    throw fail('UnsupportedKind', { sub, message: `UnsupportedKind: 未知子命令 ${sub}` });
  } catch (e) {
    const code = e.code ?? 'UnknownError';
    let exit;
    try {
      exit = exitCodeFor(code);
    } catch {
      exit = 2; // I2 fix：未映射错误码（系统错误 ENOENT/TypeError 等）兜底归环境档，不崩溃
    }
    // stderr 契约（spec §3.3）：首个非空行必须以 `错误码:` 开头且只出现一次码（消息自带码前缀时剥掉）
    let msg = e.message && e.message !== code ? e.message : code;
    if (msg.startsWith(`${code}: `)) msg = msg.slice(code.length + 2);
    process.stderr.write(`${code}: ${msg}\n`);
    process.exitCode = exit;
    return exit;
  }
}

// Ruling S13：入口守卫禁路径字符串比较——realpathSync 双归一（win32 大小写不敏感）
function isMain() {
  try {
    const a = realpathSync(process.argv[1]);
    const b = realpathSync(fileURLToPath(import.meta.url));
    return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
  } catch { return false; }
}
if (isMain()) process.exitCode = main(process.argv.slice(2));
