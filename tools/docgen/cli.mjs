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
import { renderAgent } from './components/renderAgent.mjs';
import { sharedBlocks } from './components/sharedBlocks.mjs';
import { outputFormats } from './components/outputFormats.mjs';
import { readState, writeState, setAgentState, statePath } from './state.mjs';
import { readEvidence, writeEvidence, evidencePath } from './evidence.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_DIR = join(REPO_ROOT, 'agents');
const BASELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'baseline.json');
const GENERATED_RULE = 'rules/spec-testcase-gate.md'; // 唯一生成规则（Ruling S3）

function fail(code, fields = {}) { const e = new Error(code); e.code = code; Object.assign(e, fields); e.exitCode = exitCodeFor(code); throw e; }

function sha256Hex(buf) { return createHash('sha256').update(buf).digest('hex').toUpperCase(); }

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
  const onDisk = readFileSync(BASELINE_PATH, 'utf8');
  if (onDisk !== renderBaseline()) drifts.push({ code: 'BaselineDrift', path: BASELINE_PATH });
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
  const drifts = collectGate();
  if (drifts.length === 0) return;
  const first = [...drifts].sort((a, b) => PRIORITY(a) - PRIORITY(b))[0];
  fail(first.code, first);
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
  writeFileSync(BASELINE_PATH, renderBaseline(), 'utf8');
  console.log(`baseline.json 已写入（${BASELINE_RULES.length + agentPaths().length} 条）`);
  return 0;
}

const DRAFTS_DIR = () => process.env.DOCGEN_DRAFTS_DIR || join(homedir(), '.retro-skills', 'docgen-drafts');
const ts = () => { const d = new Date(); const p = (n, w = 2) => String(n).padStart(w, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };

function assertAgentName(name) { if (!/^[a-z][a-z0-9-]{0,49}$/.test(name)) fail('InvalidName', { name }); }

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
  if (args.kind !== 'agent') fail('UnsupportedKind', { kind: args.kind });
  assertAgentName(args.name);
  if (!args.yes) fail('NotAuthorized', {});
  const name = args.name;
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });
  if (!args.draft || !existsSync(args.draft)) fail('DraftNotFound', { draft: args.draft });

  // 启动清理：上次崩溃残留的 .part 临时文件（在读取目标之前）
  for (const f of readdirSync(AGENTS_DIR).filter((x) => x.startsWith(`.tmp-${name}-`) && x.endsWith('.part'))) {
    rmSync(join(AGENTS_DIR, f), { force: true });
  }

  const draftBytes = readFileSync(args.draft);
  const rendered = Buffer.from(renderByName(name), 'utf8'); // registered 未拆槽席在此抛 MissingComponentData
  if (!draftBytes.equals(rendered)) fail('DraftDrift', { name });
  const evidence = readEvidence(name);
  if (evidence.renderSha256 !== sha256Hex(rendered)) {
    fail('EvidenceInvalid', { name, reason: 'renderSha256 与草稿不等，须重跑步 4' });
  }
  if (evidence.goldenAssertion !== 'pass') {
    fail('EvidenceInvalid', { name, reason: '黄金断言未通过（W2-② 未过不得替换）' });
  }

  const drifts = collectGate();
  const allowed = (d) => {
    if (d.path === `agents/${name}.md`) return true;
    const m = /^agents\/([a-z0-9-]+)\.md$/.exec(d.path);
    if (!m) return false;
    const other = m[1];
    const st = readState();
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
  const current = readState();
  const idempotent = current.agents[name] === 'replaced' && targetBytes.equals(rendered);
  if (idempotent) {
    evidence.lastWrittenHash = sha256Hex(rendered);
    writeEvidence(name, evidence);
    clearDrafts(name);
    console.log(`已替换（幂等恢复）：${target}`);
    return 0;
  }

  if (sha256Hex(targetBytes) !== evidence.lastWrittenHash) fail('TargetDrift', { name, path: target });
  setAgentState(name, 'replaced');
  const tmp = join(AGENTS_DIR, `.tmp-${name}-${process.pid}.part`);
  try {
    writeFileSync(tmp, draftBytes);
    renameSync(tmp, target);
  } catch {
    rmSync(tmp, { force: true });
    fail('WriteFailed', { path: target });
  }
  clearDrafts(name);
  evidence.lastWrittenHash = sha256Hex(rendered);
  writeEvidence(name, evidence);
  console.log(`已替换：${target}`);
  return 0;
}

function clearDrafts(name) {
  const dir = DRAFTS_DIR();
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).filter((x) => x.startsWith(`${name}--`))) rmSync(join(dir, f), { force: true });
}

export function renderByName(name) {
  const agent = agentData.find((a) => a.name === name);
  if (!agent) fail('MissingComponentData', { name });
  const t = triggerTable[name];
  if (!t || t.when === undefined) {
    fail('MissingComponentData', { name, reason: 'registered 未拆槽席不可渲染（S2+ 拆槽后可用）' });
  }
  const tplName = agent.outputKind === 'testcase' ? 'agent-handwritten.md.tpl' : 'agent.md.tpl';
  const template = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'templates', tplName), 'utf8');
  return renderAgent({ agent, trigger: t, template, sharedBlocks, outputFormats });
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
    if (sub === 'replace') return cmdReplace({ kind: flag('--kind', 'agent'), name: flag('--name', undefined), draft: flag('--draft', undefined), yes: has('--yes') });
    if (sub === 'check-agents') return cmdCheckAgents();
    if (sub === 'baseline' && rest[0] === '--write') return cmdBaselineWrite();
    throw fail('UnsupportedKind', { sub });
  } catch (e) {
    const code = e.code ?? 'UnknownError';
    let exit;
    try {
      exit = exitCodeFor(code);
    } catch {
      exit = 2; // I2 fix：未映射错误码（系统错误 ENOENT/TypeError 等）兜底归环境档，不崩溃
    }
    process.stderr.write(`${code}${e.message ? `: ${e.message}` : ''}${e.name ? ` (${e.name})` : ''}\n`);
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
