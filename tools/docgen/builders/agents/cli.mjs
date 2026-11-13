#!/usr/bin/env node
// docgen CLI：generate / gate / dump / policy / check-agents / baseline / diff 统一入口。
// agent 卡唯一写盘路径 = `generate --kind agent`（无 --preview）；diff 只读比对渲染与现卡。
import { readFileSync, existsSync, realpathSync, mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listSeats, isSeat, renderSeatText, modelWithShared, collectModelFindings } from '../../models/agents/source.mjs';
import { BASELINE_RULES, agentPaths, renderBaseline } from './components/baseline.mjs';
import { compareBuffers, checkEnvironment } from './components/compare.mjs';
import { renderByName } from './components/renderByName.mjs';
import { RENDERED_RULES, renderedRuleAssets, writeRenderedRule, renderRenderedRule } from './components/renderedAssets.mjs';
import { validatePolicy } from './components/validatePolicy.mjs';
import { exitCodeFor } from './components/exitCodes.mjs';
import { dumpPolicy } from './components/dumpPolicy.mjs';
import { writeFileAtomic } from './atomicWrite.mjs';

// 对外仍从 cli 导出（既有测试/调用方按 cli.mjs 取渲染器）；实现已移入 components/renderByName.mjs
export { renderByName };

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const AGENTS_DIR = join(REPO_ROOT, 'agents');
const PREVIEW_DIR = join(REPO_ROOT, 'tmp', 'preview');
// 正式写盘前的安全门：除模型与卡之外有未提交改动 → 拒绝（--force 越过；非 git 环境放行）
function assertCleanForFormalWrite(force) {
  if (force) return;
  let out;
  try { out = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain'], { cwd: REPO_ROOT, encoding: 'utf8' }); }
  catch { return; }
  const allowed = ['agents/', 'tools/docgen/models/agents/jsons/', 'tmp/'];
  const bad = out.split(/\r?\n/).filter(Boolean).filter((line) => {
    const p = line.slice(3).replace(/^"|"$/g, '');
    return !allowed.some((a) => p.startsWith(a));
  });
  if (bad.length > 0) fail('DirtyWorkTree', { message: `DirtyWorkTree: 工作树有与生成无关的改动（${bad.slice(0, 3).join(' | ')}）；先提交/清理，或用 --force` });
}
// baseline 清单路径可用 DOCGEN_BASELINE_PATH 重定向（测试隔离位）：
// 测试写的是临时文件，不再与非同进程的 gate 抢同一个共享文件（并发 truncate 窗口会让 gate 误报 BaselineDrift）
const baselinePath = () => process.env.DOCGEN_BASELINE_PATH || join(dirname(fileURLToPath(import.meta.url)), 'baseline.json');
// 阶段 1（2026-11-05）：唯一生成规则（已退役，留档 `docs/bak/rules/spec-testcase-gate.md`）已下沉，生成/比对分支同步裁停
// （PRD `docs/prd/20261105182104-rule-refactor/prd/stage-1-rules-exit.md` §1 步骤 0）

// fields.message：可选人读信息（stderr 契约要写出哈希 / 下一步命令，spec §3.3）
function fail(code, fields = {}) { const e = new Error(fields.message ?? code); e.code = code; Object.assign(e, fields); e.exitCode = exitCodeFor(code); throw e; }

export function sha256Hex(buf) { return createHash('sha256').update(buf).digest('hex').toUpperCase(); }

// S4 Task 7：旧 agent 模板已退场，只留规则模板分支

export function cmdGenerate(args) {
  // S3（spec §3.2）：所有会渲染或写盘的子命令先跑 validatePolicy，避免静默过滤后写盘
  validatePolicy();
  const kind = args.kind ?? 'all';
  const name = args.name;
  const preview = args.preview === true;
  const check = args.check === true;
  const force = args.force === true;
  // `--apply` 仍只授权 rendered rule 落盘；agent 卡正式写盘走 generate（无 --preview）
  const ruleWrite = args.apply && kind === 'rule' && typeof args.name === 'string';
  if (args.apply && !ruleWrite) {
    fail('InvalidArgs', { message: 'InvalidArgs: --apply 只授权 --kind rule --name（rendered rule）落盘' });
  }
  if (args.apply && (preview || check)) fail('InvalidArgs', { message: 'InvalidArgs: --apply 不能与 --preview / --check 同用' });
  if (name !== undefined && !/^[a-z][a-z0-9-]{0,49}$/.test(name)) fail('InvalidName', { name });
  // 非 registered 的 rule --check：基准是 builders/rules/<id>.md，不走 rules/<id>.md 存在性检查
  if (check && kind === 'rule' && typeof name === 'string' && !RENDERED_RULES.includes(name)) {
    const rel = `builders/rules/${name}.md`
    // rel 是对外展示的相对路径（tools/docgen 下）；实际文件在 tools/docgen/ 内
    const p = join(REPO_ROOT, 'tools', 'docgen', rel)
    if (!existsSync(p)) fail('DanglingBaselineEntry', { message: rel, path: rel })
    let rendered
    try { rendered = renderRenderedRule(name) } catch (e) { fail('MissingComponentData', { message: `${name}: ${e.message}` }) }
    if (compareBuffers(Buffer.from(rendered, 'utf8'), readFileSync(p))) fail('Mismatch', { message: rel, path: rel })
    console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`)
    return 0
  }
  const objs = name
    ? [{ kind: kind === 'all' ? 'agent' : kind, name, path: `${kind === 'rule' ? 'rules' : 'agents'}/${name}.md` }]
    : kind === 'all'
      ? [...BASELINE_RULES.map((p) => ({ kind: 'rule', path: p, name: p.slice(7, -3) })), ...agentPaths().map((p) => ({ kind: 'agent', path: p, name: p.slice(7, -3) }))]
      : kind === 'rule'
        ? BASELINE_RULES.map((p) => ({ kind: 'rule', path: p, name: p.slice(7, -3) }))
        : agentPaths().map((p) => ({ kind: 'agent', path: p, name: p.slice(7, -3) }));

  const renderText = (o) => {
    if (o.kind === 'rule') {
      if (!RENDERED_RULES.includes(o.name)) fail('MissingComponentData', { name: o.name });
      return renderRenderedRule(o.name);
    }
    if (!isSeat(o.name)) fail('MissingComponentData', { name: o.name });
    return renderSeatText(o.name);
  };

  // 预览：只写 tmp/preview/<agents|rules>/，不碰正式目录
  if (preview) {
    for (const o of objs) {
      const sub = o.kind === 'agent' ? 'agents' : 'rules';
      const dir = join(PREVIEW_DIR, sub);
      const file = join(dir, `${o.name}.md`);
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, renderText(o));
      console.log(`preview: ${o.path} -> ${file}`);
    }
    return 0;
  }

  let drift = 0;
  const agentWrites = [];
  for (const o of objs) {
    if (o.kind === 'rule') {
      const p = join(REPO_ROOT, o.path);
      if (!existsSync(p)) fail('DanglingBaselineEntry', { message: o.path, path: o.path });
      const target = readFileSync(p, 'utf8');
      checkEnvironment(Buffer.from(target), 'target', o.path);
      if (ruleWrite) { writeRenderedRule(o.name); console.log(`rendered rule 已写入：${o.path}`); }
      else if (RENDERED_RULES.includes(o.name)) {
        if (compareBuffers(Buffer.from(renderRenderedRule(o.name), 'utf8'), Buffer.from(target, 'utf8'))) {
          drift += 1;
          process.stderr.write(`Mismatch: ${o.path}\n`);
        }
      }
    } else if (check) {
      const rendered = Buffer.from(renderText(o), 'utf8');
      const p = join(AGENTS_DIR, `${o.name}.md`);
      if (!existsSync(p)) fail('DanglingBaselineEntry', { name: o.name });
      if (compareBuffers(rendered, readFileSync(p))) drift += 1;
    } else {
      agentWrites.push({ name: o.name, text: renderText(o) });
    }
  }

  if (agentWrites.length > 0) {
    assertCleanForFormalWrite(force);
    for (const w of agentWrites) writeFileAtomic(join(AGENTS_DIR, `${w.name}.md`), w.text);
    // 正式写盘后清掉对应预览
    const dir = join(PREVIEW_DIR, 'agents');
    for (const w of agentWrites) rmSync(join(dir, `${w.name}.md`), { force: true });
    try { if (readdirSync(dir).length === 0) rmSync(dir, { recursive: true, force: true }); } catch { /* 目录不存在即已清 */ }
    console.log(`agents 已写入：${agentWrites.length} 席（预览已清）`);
  }

  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`);
  return drift === 0 ? 0 : 1;
}

// collectGate：收集漂移清单（不抛）——gateChecks 与 check-agents 共用
export function collectGate() {
  const drifts = [];
  const onDisk = readFileSync(baselinePath(), 'utf8');
  if (onDisk !== renderBaseline()) drifts.push({ code: 'BaselineDrift', path: baselinePath() });
  const renderedPaths = new Set(renderedRuleAssets().map((a) => a.path));
  for (const p of BASELINE_RULES) {
    if (renderedPaths.has(p)) continue; // 渲染 rule 走下方逐字节比对（与 agent 卡同一机制）
    const rp = join(REPO_ROOT, p);
    if (!existsSync(rp)) { drifts.push({ code: 'DanglingBaselineEntry', path: p }); continue; }
    try { checkEnvironment(Buffer.from(readFileSync(rp, 'utf8')), 'target', p); }
    catch (e) { drifts.push({ code: e.code ?? 'EnvironmentEOL', path: p }); }
  }
  // 渲染 rule（与 agent 卡同一机制）：数据 → 渲染 → 逐字节；手改即红、缺件即红
  for (const a of renderedRuleAssets()) {
    const rp = join(REPO_ROOT, a.path);
    if (!existsSync(rp)) { drifts.push({ code: 'DanglingBaselineEntry', path: a.path }); continue; }
    if (compareBuffers(Buffer.from(a.bytes, 'utf8'), readFileSync(rp))) {
      drifts.push({ code: 'Mismatch', path: a.path });
    }
  }
  for (const seat of listSeats()) {
    const p = join(AGENTS_DIR, `${seat}.md`);
    if (!existsSync(p)) { drifts.push({ code: 'DanglingBaselineEntry', path: `agents/${seat}.md` }); continue; }
    let rendered;
    try { rendered = Buffer.from(renderSeatText(seat), 'utf8'); }
    catch (e) { drifts.push({ code: 'Mismatch', path: `agents/${seat}.md`, message: `渲染失败 ${e.code ?? e.name}` }); continue; }
    if (compareBuffers(rendered, readFileSync(p))) drifts.push({ code: 'Mismatch', path: `agents/${seat}.md` });
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

const BASELINE_CLASS = new Set(['BaselineDrift', 'UnregisteredHandwritten', 'DanglingBaselineEntry', 'EnvironmentEOL', 'InvalidBaseline', 'InvalidBaselinePath']);
const PRIORITY = (d) => (BASELINE_CLASS.has(d.code) ? 0 : 1);

export function gateChecks() {
  // 模型语义校验（P5 新基线）：18 席逐一过 verify（与 `verify-models.mjs` 同一判据），失败即停；
  // 不再读旧 `PREDICATES` / `validatePredicates`（随 card-model 退场）。
  const findings = collectModelFindings();
  if (findings.length > 0) {
    fail('Mismatch', { path: findings[0].file, message: `${findings[0].file}：${findings[0].message}` });
  }
  // 运行时唯一防线（spec:196）：配置 / 模板非法时 gate 必须 exit 1 并给五个码之一，
  // 不得落成 `Mismatch`、不得被静默放行；排在既有逐席比对之前（`Mismatch` 管产物漂移，两件事不互相替代）
  validatePolicy();
  const drifts = collectGate();
  if (drifts.length === 0) return;
  const first = [...drifts].sort((a, b) => PRIORITY(a) - PRIORITY(b))[0];
  // spec §7②/③ 要求「exit 1 且点名该路径」：drift 无自有 message 时补上 path（消息内不得重复码，stderr 契约只许出现一次码）。
  // 路径一律转仓内相对路径——`BaselineDrift` 的 path 是绝对路径，直接拼接会把本机路径写进用户可见 stderr。
  const rel = isAbsolute(first.path) ? relative(REPO_ROOT, first.path).replace(/\\/g, '/') : first.path;
  const shown = rel.startsWith('..') ? first.path : rel; // 仓外路径没有有意义的相对形式 → 保留原值
  fail(first.code, first.message ? first : { ...first, message: `产物漂移 ${shown}` });
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
  console.log(`agents ${listSeats().length}/${listSeats().length}`);
  console.log(`baseline ${BASELINE_RULES.length + agentPaths().length}/${BASELINE_RULES.length + agentPaths().length}`);
  return 0;
}

// `dump`（spec §5 `:117`）：合并后全量 JSON，**只 stdout**——不落盘、不进门禁、不调 writeAll（S4-TC-B07）
export function cmdDump(args) {
  assertAgentName(args.name);
  if (!isSeat(args.name)) fail('MissingComponentData', { name: args.name, reason: '模型目录无此席' });
  console.log(JSON.stringify(modelWithShared(args.name), null, 2));
  return 0;
}

export function cmdCheckAgents() {
  for (const seat of listSeats()) {
    const p = join(AGENTS_DIR, `${seat}.md`);
    if (!existsSync(p)) fail('DanglingBaselineEntry', { name: seat, path: p });
    const rendered = Buffer.from(renderByName(seat), 'utf8');
    if (compareBuffers(rendered, readFileSync(p))) fail('Mismatch', { name: seat, path: p });
  }
  console.log(`OK：${listSeats().length} 个 agent 已检查（全部由模型渲染）`);
  return 0;
}

export function cmdBaselineWrite() {
  // 原子写：`writeFileSync` 先截断后写入，并发读方（另一个进程的 gate）会在窗口里看到空文件 → 误报 BaselineDrift。
  // 实现单源 = atomicWrite.mjs。
  writeFileAtomic(baselinePath(), renderBaseline());
  console.log(`baseline.json 已写入（${BASELINE_RULES.length + agentPaths().length} 条）`);
  return 0;
}

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
    out.push('差异 - 0 / + 0（盘上 == 渲染，无需写盘）');
    return out;
  }
  out.push(`差异 - ${d.minus.length} / + ${d.plus.length}（首处第 ${d.k} 行）`);
  for (const line of d.minus) out.push(`- ${line}`);
  for (const line of d.plus) out.push(`+ ${line}`);
  return out;
}

export function cmdDiff(args) {
  if (args.kind !== 'agent') {
    fail('UnsupportedKind', { kind: args.kind, sub: 'diff', message: `UnsupportedKind: sub=diff kind=${args.kind}（diff 只支持 --kind agent）` });
  }
  assertAgentName(args.name);
  const name = args.name;
  if (!isSeat(name)) fail('MissingComponentData', { name });
  const rendered = renderByName(name); // 模型目录无此席在此抛 MissingComponentData
  const target = join(AGENTS_DIR, `${name}.md`);
  // 条目缺失（agentData 无此名）与卡缺失（盘上没文件）是两个失败面：后者若先渲染，会造出一份凭空旧卡
  if (!existsSync(target)) fail('DanglingBaselineEntry', { name, path: `agents/${name}.md` });
  for (const line of formatDiff(name, readFileSync(target, 'utf8'), rendered)) console.log(line);
  return 0;
}

// ── 参数白名单（spec §3.3 末条）：指定 sub 下只接受本文列出的旗标 ──
// 宽松的 flag()/has() 会静默丢弃未知旗标，拼错一个字母也会变成静默放行。
// 故所有带旗标的子命令走严格解析：白名单外的 `--xxx` 一律 InvalidArgs。
const VALUE = 'value';
const BOOL = 'bool';
const DIFF_FLAGS = { '--kind': VALUE, '--name': VALUE };
// generate：--preview 只写 tmp/preview；--check 只读比对；缺省正式写 agents/（写后清对应预览）
const GENERATE_FLAGS = { '--kind': VALUE, '--name': VALUE, '--apply': BOOL, '--preview': BOOL, '--check': BOOL, '--force': BOOL };
// dump：只读子命令，只接受 `--name`（未知旗标 → InvalidArgs exit 2）
const DUMP_FLAGS = { '--name': VALUE };
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
    // `--kind --name` 这类「下一个 token 还是旗标」视为缺值，不许把旗标当值
    if (value === undefined || value.startsWith('--')) {
      fail('InvalidArgs', { sub, message: `InvalidArgs: sub=${sub} ${tok} 缺值` });
    }
    out[tok] = value;
    i += 1;
  }
  return out;
}

export function main(argv) {
  try {
    const sub = argv[0];
    const rest = argv.slice(1);
    if (sub === 'generate') {
      const a = parseArgs(rest, GENERATE_FLAGS, 'generate');
      return cmdGenerate({ kind: a['--kind'], name: a['--name'], apply: a['--apply'] === true, preview: a['--preview'] === true, check: a['--check'] === true, force: a['--force'] === true });
    }
    if (sub === 'gate') return cmdGate();
    if (sub === 'dump') {
      const a = parseArgs(rest, DUMP_FLAGS, 'dump');
      return cmdDump({ name: a['--name'] });
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
