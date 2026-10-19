#!/usr/bin/env node
// docgen CLI（R1）：六子命令统一入口。本任务实现 generate + gate；draft/replace/check-agents/baseline 由 Task 5/6 扩展。
import { readFileSync, existsSync, realpathSync, mkdirSync, writeFileSync, readdirSync, rmSync, renameSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { agentData, triggerTable, AGENT_KINDS } from './components/agentData.mjs';
import { patternRegistry } from './components/patternRegistry.mjs';
import { validateAgentData, exitCodeFor } from './components/validateAgentData.mjs';
import { BASELINE_RULES, agentPaths, renderBaseline } from './components/baseline.mjs';
import * as spec from './components/specTestCaseGate.mjs';
import { compareBuffers, checkEnvironment } from './components/compare.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGENTS_DIR = join(REPO_ROOT, 'agents');
const BASELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'baseline.json');
const GENERATED_RULE = 'rules/spec-testcase-gate.md'; // 唯一生成规则（Ruling S3）

function fail(code, fields = {}) { const e = new Error(code); e.code = code; Object.assign(e, fields); e.exitCode = exitCodeFor(code); throw e; }

// registered 席 = triggerTable 无完整 when（S1 未拆槽）→ 跳过逐字节比对
function isRegistered(name) {
  const t = triggerTable[name];
  return !t || t.when === undefined;
}

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
      if (isRegistered(o.name)) {
        // R3：registered 席只做存在性检查（与 gate / check-agents 同口径），不做逐字节比对
        if (!existsSync(join(AGENTS_DIR, `${o.name}.md`))) fail('DanglingBaselineEntry', { name: o.name });
        continue;
      }
      if (!existsSync(join(AGENTS_DIR, `${o.name}.md`))) fail('DanglingBaselineEntry', { name: o.name });
      // 已拆槽席：S1 阶段存在性检查即可（逐字节比对与 W4 派生断言由 gate 承接 / S2+ 完整化）
    }
  }
  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`);
  return drift === 0 ? 0 : 1;
}

// gateChecks：校验主体（无 console.log，全部 fail() 抛错）——cmdGate 与 cmdReplace 前置共用（Ruling S18）
function gateChecks() {
  validateAgentData(agentData, triggerTable);
  // ① baseline 文件 = renderBaseline() 逐字节（R5）
  const onDisk = readFileSync(BASELINE_PATH, 'utf8');
  if (onDisk !== renderBaseline()) fail('BaselineDrift', { path: BASELINE_PATH });
  // ② rule 侧：生成规则逐字节（V1）
  const tpl = readTemplate('rule');
  const target = readFileSync(join(REPO_ROOT, GENERATED_RULE), 'utf8');
  if (compareBuffers(Buffer.from(spec.render(spec.buildData(), tpl)), Buffer.from(target))) fail('Mismatch', { path: GENERATED_RULE });
  // 非生成 rule：存在性 + 环境检查（与 cmdGenerate rule 分支同构，守卫面与 P1 gate 一致）
  for (const p of BASELINE_RULES) {
    if (p === GENERATED_RULE) continue;
    const rp = join(REPO_ROOT, p);
    if (!existsSync(rp)) fail('DanglingBaselineEntry', { name: p, path: rp });
    checkEnvironment(Buffer.from(readFileSync(rp, 'utf8')), 'target', p);
  }
  // ③ agent 侧：registered 席登记/存在检查；已拆槽席 W4 派生断言（时时机械断言）
  for (const a of agentData) {
    if (isRegistered(a.name)) {
      if (!existsSync(join(AGENTS_DIR, `${a.name}.md`))) fail('DanglingBaselineEntry', { name: a.name });
      continue;
    }
    const t = triggerTable[a.name];
    const derived = a.outputKind === 'testcase'
      ? patternRegistry.description.handwritten(a.role, t.when, t.notWhen?.text ?? '')
      : patternRegistry.description.parliament(a.role, t.when);
    if (derived.includes('时时')) fail('DescriptionDerivation', { name: a.name });
  }
  // ④ 清单外新增任一类文件 → UnregisteredHandwritten（R10 / §8.2）
  // 测试隔离：DOCGEN_RULES_DIR / DOCGEN_AGENTS_DIR 可重定向扫描目录（与 DOCGEN_DRAFTS_DIR 同模式）
  const scanRulesDir = process.env.DOCGEN_RULES_DIR || join(REPO_ROOT, 'rules');
  const scanAgentsDir = process.env.DOCGEN_AGENTS_DIR || join(REPO_ROOT, 'agents');
  const unregRules = readdirSync(scanRulesDir)
    .filter((f) => f.endsWith('.md') && !BASELINE_RULES.includes(`rules/${f}`))
    .map((f) => `rules/${f}`);
  if (unregRules.length > 0) fail('UnregisteredHandwritten', { files: unregRules });
  const unregAgents = readdirSync(scanAgentsDir)
    .filter((f) => f.endsWith('.md') && !agentPaths().includes(`agents/${f}`))
    .map((f) => `agents/${f}`);
  if (unregAgents.length > 0) fail('UnregisteredHandwritten', { files: unregAgents });
}

export function cmdGate() {
  gateChecks();
  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`);
  return 0;
}

export function cmdCheckAgents() {
  // S1（Ruling S17）：14 席 agents/*.md 均未由 docgen 管线替换 → 全部未巩固、容忍红；只做存在性 + 计数。
  // S2+ 拆槽后：已巩固席加入逐字节比对（漂移 → exit 1 并输出文件名），此处分支届时激活。
  let unconsolidated = 0;
  for (const a of agentData) {
    const p = join(AGENTS_DIR, `${a.name}.md`);
    if (!existsSync(p)) fail('DanglingBaselineEntry', { name: a.name, path: p });
    unconsolidated += 1;
  }
  console.log(`OK：${agentData.length} 个 agent 已检查（未巩固 ${unconsolidated}）`);
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
  const content = renderAgent(name); // registered 席在此抛 MissingComponentData，此时尚未建箱目录（J4 fix）
  mkdirSync(dir, { recursive: true });
  try { writeFileSync(join(dir, file), content); }
  catch { fail('DraftWriteFailed', { path: join(dir, file) }); }
  console.log(`草稿已落：${join(dir, file)}`);
  return 0;
}

export function cmdReplace(args) {
  if (args.kind !== 'agent') fail('UnsupportedKind', { kind: args.kind });
  assertAgentName(args.name);
  if (!args.yes) fail('NotAuthorized', {});
  const agent = agentData.find((a) => a.name === args.name);
  if (!agent) fail('MissingComponentData', { name: args.name });
  if (!args.draft || !existsSync(args.draft)) fail('DraftNotFound', { draft: args.draft });
  const draftBytes = readFileSync(args.draft);
  const rendered = Buffer.from(renderAgent(args.name), 'utf8');
  if (!draftBytes.equals(rendered)) fail('DraftDrift', { name: args.name });
  // gate 前置（§5.3）：S1 阶段 gate 恒绿（无已巩固席）→ 判别子休眠；S2+ 拆槽后激活（Ruling S18）
  gateChecks();
  // 原子替换：临时文件与目标同目录（同卷 rename）；失败清理 tmp 防残留（I7 fix）
  const target = join(AGENTS_DIR, `${args.name}.md`);
  const tmp = join(AGENTS_DIR, `.tmp-${args.name}-${process.pid}.md`);
  try {
    writeFileSync(tmp, draftBytes);
    renameSync(tmp, target);
  } catch {
    rmSync(tmp, { force: true });
    fail('WriteFailed', { path: target });
  }
  // 清该名下草稿（DRAFTS_DIR 未建时容忍，I7 fix）
  const dir = DRAFTS_DIR();
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.startsWith(`${args.name}--`))) rmSync(join(dir, f), { force: true });
  }
  console.log(`已替换：${target}`);
  return 0;
}

function renderAgent(name) {
  const agent = agentData.find((a) => a.name === name);
  const t = triggerTable[name];
  // I1 fix：registered 未拆槽席（triggerTable 无 when）不可渲染 → MissingComponentData（exit 2），不崩溃
  if (!t || t.when === undefined) fail('MissingComponentData', { name, reason: 'registered 未拆槽席不可 draft/replace（S2+ 拆槽后可用）' });
  const tpl = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'templates', agent.outputKind === 'testcase' ? 'agent-handwritten.md.tpl' : 'agent.md.tpl'), 'utf8');
  const description = agent.outputKind === 'testcase'
    ? patternRegistry.description.handwritten(agent.role, t.when, t.notWhen?.text ?? '')
    : patternRegistry.description.parliament(agent.role, t.when);
  return tpl
    .replaceAll('{{NAME}}', agent.name)
    .replaceAll('{{DESCRIPTION}}', description)
    .replaceAll('{{ZH_NAME}}', agent.role)
    .replaceAll('{{DIMENSION}}', agent.dimension ?? '')
    .replaceAll('{{IDENTITY}}', agent.identity ?? '')
    .replaceAll('{{FIXED_LIST}}', '| # | 必问 | 回答 |\n|---|---|---|')
    .replaceAll('{{OUTPUT_FORMAT}}', '')
    .replaceAll('{{SHARED_BLOCK}}', '');
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
      return cmdDraft({ sub: parts[1] ?? 'draft', kind: flag('--kind', 'agent'), name: flag('--name', undefined) }, parts);
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
