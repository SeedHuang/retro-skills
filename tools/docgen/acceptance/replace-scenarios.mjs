#!/usr/bin/env node
// 迁移段 + 变更段场景（spec 2026-10-21 §5① / §4 步 3）：每个场景在独立副本仓里跑，不碰工作区。
// S1–S6 = 迁移段回归（保留原判据）；S7–S11 = 变更段 / diff / 阶段边界新场景。
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { renderByName } from '../cli.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DATA = 'tools/docgen/components/agentData.mjs';
// 造「description 一行变化」用的数据锚点（当前 when 原文 → 删一个词）。
// 用常量集中管理：数据再改时这里会因「命中数 ≠ 1」当场红，而不是静默改成没变化的场景。
const WHEN_OLD = '当需要为 PRD/spec 设计并编写测试用例（testcase.md），或专门找出被忽视的边界与失败场景';
const WHEN_NEW = '当需要为 PRD/spec 设计并编写测试用例（testcase.md），或找出被忽视的边界与失败场景';
const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();
const stateFile = (c) => join(c, 'tools/docgen/state.json');
const evidenceFile = (c, name = 'reviewer-audit') => join(c, 'tools/docgen/fixtures', `${name}.evidence.json`);
const evidence = (c, name = 'reviewer-audit') => JSON.parse(readFileSync(evidenceFile(c, name), 'utf8'));

function copyRepo() {
  const dst = mkdtempSync(join(tmpdir(), 'dg-rep-'));
  const files = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n');
  const extra = [
    'tools/docgen/state.json',
    'tools/docgen/state.mjs',
    'tools/docgen/evidence.mjs',
    // 新增文件在提交前不在 git ls-files 里：显式带上，否则副本的 check-agent 加载即 ENOENT
    'tools/docgen/components/renderByName.mjs',
    'tools/docgen/components/outputFormats.mjs',
  ];
  for (const f of [...new Set([...files, ...extra])]) {
    if (!f || f.startsWith('.git/')) continue;
    const out = join(dst, f);
    mkdirSync(dirname(out), { recursive: true });
    cpSync(join(REPO, f), out);
  }
  mkdirSync(join(dst, '.drafts'), { recursive: true });
  return dst;
}

const envFor = (copy) => ({
  ...process.env,
  DOCGEN_DRAFTS_DIR: join(copy, '.drafts'),
  DOCGEN_STATE_PATH: stateFile(copy),
  DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures'),
});

function run(copy, args, extraEnv = {}) {
  return spawnSync(process.execPath, [join(copy, 'tools/docgen/cli.mjs'), ...args], { cwd: copy, encoding: 'utf8', env: { ...envFor(copy), ...extraEnv } });
}

function runTool(copy, tool, args) {
  return spawnSync(process.execPath, [join(copy, 'tools/docgen/acceptance', `${tool}.mjs`), ...args], { cwd: copy, encoding: 'utf8', env: envFor(copy) });
}

function seedEvidence(copy, name = 'reviewer-audit') {
  const file = `agents/${name}.md`;
  const commit = execFileSync('git', ['log', '-1', '--format=%H', '--', file], { cwd: REPO, encoding: 'utf8' }).trim();
  const blob = execFileSync('git', ['rev-parse', `${commit}:${file}`], { cwd: REPO, encoding: 'utf8' }).trim();
  const hashObject = execFileSync('git', ['hash-object', '--no-filters', file], { cwd: REPO, encoding: 'utf8' }).trim();
  const target = readFileSync(join(copy, file));
  const rendered = Buffer.from(renderByName(name), 'utf8');
  mkdirSync(dirname(evidenceFile(copy, name)), { recursive: true });
  writeFileSync(evidenceFile(copy, name), `${JSON.stringify({
    commit, blob, sha256: sha(target), hashObject,
    goldenAssertion: 'pass', compareResult: null, renderSha256: sha(rendered), lastWrittenHash: sha(target),
  }, null, 2)}\n`);
}

// 迁移段场景：state 里没有该席（副本默认 state 是「全部 replaced」，必须显式清空）
const useMigrationState = (copy) => writeFileSync(stateFile(copy), `${JSON.stringify({ version: 1, agents: {} }, null, 2)}\n`);

// 在副本里精确替换一处文本（命中数必须恰 1，防「改到别处」被当成用例通过）
function patch(copy, from, to) {
  const p = join(copy, DATA);
  const s = readFileSync(p, 'utf8');
  assert.equal(s.split(from).length - 1, 1, `注入命中数须恰 1：${from}`);
  writeFileSync(p, s.split(from).join(to));
}

function draft(copy, name = 'reviewer-audit') {
  const r = run(copy, ['draft', '--kind', 'agent', '--name', name]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const f = readdirSync(join(copy, '.drafts')).find((x) => x.startsWith(`${name}--`));
  assert.ok(f, `草稿未生成：${name}`);
  return join(copy, '.drafts', f);
}

const anchorOf = (c, name = 'reviewer-audit') => {
  const e = evidence(c, name);
  return JSON.stringify(['commit', 'blob', 'sha256', 'hashObject', 'goldenAssertion', 'compareResult'].map((k) => e[k]));
};

const scenarios = [];
function scenario(name, fn) {
  scenarios.push([name, fn]);
}

scenario('S1 首次替换成功（迁移段）', (c) => {
  seedEvidence(c);
  useMigrationState(c);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(JSON.parse(readFileSync(stateFile(c), 'utf8')).agents['reviewer-audit'], 'replaced');
  assert.ok(readFileSync(join(c, 'agents/reviewer-audit.md')).equals(Buffer.from(renderByName('reviewer-audit'))));
  assert.equal(readdirSync(join(c, '.drafts')).length, 0);
  assert.equal(evidence(c).lastWrittenHash, sha(readFileSync(join(c, 'agents/reviewer-audit.md'))));
  assert.equal(evidence(c).changes, undefined, '迁移段成功不得追加 changes');
});

scenario('S2 TargetDrift（迁移段）', (c) => {
  seedEvidence(c);
  useMigrationState(c);
  const p = join(c, 'agents/reviewer-audit.md');
  writeFileSync(p, `${readFileSync(p, 'utf8')}x`);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout + r.stderr, /TargetDrift/);
});

scenario('S3 幂等恢复（rename 后崩溃）', (c) => {
  seedEvidence(c);
  const e = evidence(c);
  e.lastWrittenHash = '0'.repeat(64);
  writeFileSync(evidenceFile(c), `${JSON.stringify(e, null, 2)}\n`);
  writeFileSync(stateFile(c), `${JSON.stringify({ version: 1, agents: { 'reviewer-audit': 'replaced' } }, null, 2)}\n`);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /幂等恢复/);
  assert.equal(evidence(c).lastWrittenHash, sha(readFileSync(join(c, 'agents/reviewer-audit.md'))));
  assert.equal(readdirSync(join(c, '.drafts')).length, 0);
});

scenario('S4 rename 前崩溃后重跑收敛', (c) => {
  seedEvidence(c);
  writeFileSync(stateFile(c), `${JSON.stringify({ version: 1, agents: { 'reviewer-audit': 'replaced' } }, null, 2)}\n`);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(readFileSync(join(c, 'agents/reviewer-audit.md')).equals(Buffer.from(renderByName('reviewer-audit'))));
});

scenario('S5 非目标漂移：无草稿拒 / 有草稿放行', (c) => {
  seedEvidence(c);
  const rule = join(c, 'rules/spec-testcase-gate.md');
  writeFileSync(rule, `${readFileSync(rule, 'utf8')}x`);
  const d = draft(c);
  const r1 = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.notEqual(r1.status, 0, '非目标漂移无草稿应拒');
  assert.match(r1.stdout + r1.stderr, /Mismatch/);

  const c2 = copyRepo();
  try {
    seedEvidence(c2);
    writeFileSync(stateFile(c2), `${JSON.stringify({ version: 1, agents: { 'reviewer-product': 'replaced' } }, null, 2)}\n`);
    const d2 = draft(c2, 'reviewer-product');
    const p2 = join(c2, 'agents/reviewer-product.md');
    writeFileSync(p2, `${readFileSync(p2, 'utf8')}x`);
    const d1 = draft(c2);
    const r2 = run(c2, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d1, '--yes']);
    assert.equal(r2.status, 0, r2.stdout + r2.stderr);
    assert.ok(readFileSync(d2));
  } finally {
    rmSync(c2, { recursive: true, force: true });
  }
});

scenario('S6 错误路径：缺 --yes=4 / 草稿被改=1 / 草稿缺失=3 / 非法 name=1 / ghost=2', (c) => {
  seedEvidence(c);
  const d = draft(c);
  const a = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d]);
  assert.equal(a.status, 4); assert.match(a.stdout + a.stderr, /NotAuthorized/);
  writeFileSync(d, '# 手改\n');
  const b = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(b.status, 1); assert.match(b.stdout + b.stderr, /DraftDrift/);
  const e = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', join(c, 'ghost.md'), '--yes']);
  assert.equal(e.status, 3); assert.match(e.stdout + e.stderr, /DraftNotFound/);
  const f = run(c, ['replace', '--kind', 'agent', '--name', 'Bad/Name', '--draft', d, '--yes']);
  assert.equal(f.status, 1); assert.match(f.stdout + f.stderr, /InvalidName/);
  const g = run(c, ['replace', '--kind', 'agent', '--name', 'ghost', '--draft', d, '--yes']);
  assert.equal(g.status, 2); assert.match(g.stdout + g.stderr, /MissingComponentData/);
});

// ── 变更段（state = replaced 走副本默认值） ──

scenario('S7 变更段：正确凭证写盘成功 + 留痕 + 锚点冻结', (c) => {
  seedEvidence(c, 'senior-sdet');
  const before = anchorOf(c, 'senior-sdet');
  patch(c, '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。', '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（S7）。');
  const oldSha = sha(readFileSync(join(c, 'agents/senior-sdet.md')));
  const d = draft(c, 'senior-sdet');
  const draftBytes = readFileSync(d); // replace 成功后会清草稿箱，先留字节
  const newSha = sha(draftBytes);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', d, '--expect-change', newSha, '--rejudge', 'none', '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(readFileSync(join(c, 'agents/senior-sdet.md')).equals(draftBytes));
  const e = evidence(c, 'senior-sdet');
  assert.equal(e.changes.length, 1);
  assert.equal(e.changes[0].from, oldSha);
  assert.equal(e.changes[0].to, newSha);
  assert.deepEqual(e.changes[0].rejudged, []);
  assert.equal(e.changes[0].judgeMode, 'none');
  assert.deepEqual(e.changes[0].judged, []);
  assert.deepEqual(Object.keys(e.changes[0].machineChecks).sort(), ['A3', 'A4', 'A5', 'A6', 'A7']);
  assert.equal(e.renderSha256, newSha);
  assert.equal(e.lastWrittenHash, newSha);
  assert.equal(anchorOf(c, 'senior-sdet'), before, '迁移锚点六字段必须冻结');
});

scenario('S8 变更段：缺凭证 → UnapprovedChange（exit 4），卡不变', (c) => {
  seedEvidence(c, 'senior-sdet');
  patch(c, '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换。', '改动 = 改组件数据 → 生成 → 草稿 → 确认 → 替换（S8）。');
  const card = join(c, 'agents/senior-sdet.md');
  const before = sha(readFileSync(card));
  const d = draft(c, 'senior-sdet');
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', d, '--yes']);
  assert.equal(r.status, 4, r.stdout + r.stderr);
  assert.match((r.stderr || '').trim().split('\n')[0], /^UnapprovedChange: /);
  assert.match(r.stderr, /--expect-change/);
  assert.equal(sha(readFileSync(card)), before);
});

scenario('S9 变更段：description 差异 + --rejudge none → 拒；--rejudge A2 → 过', (c) => {
  seedEvidence(c, 'senior-sdet');
  patch(c, WHEN_OLD, WHEN_NEW);
  const card = join(c, 'agents/senior-sdet.md');
  const d = draft(c, 'senior-sdet');
  const newSha = sha(readFileSync(d));
  const before = sha(readFileSync(card));
  const bad = run(c, ['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', d, '--expect-change', newSha, '--rejudge', 'none', '--yes']);
  assert.equal(bad.status, 4, bad.stdout + bad.stderr);
  assert.match(bad.stderr, /漏报触达键 A2/);
  assert.equal(sha(readFileSync(card)), before);
  // 报对了键但没给判者标识 → 拒（不许用占位名冒充判者）
  const noJudge = run(c, ['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', d, '--expect-change', newSha, '--rejudge', 'A2', '--yes']);
  assert.equal(noJudge.status, 4, noJudge.stdout + noJudge.stderr);
  assert.match(noJudge.stderr, /缺少判者标识/);
  assert.equal(sha(readFileSync(card)), before);
  const ok = run(c, ['replace', '--kind', 'agent', '--name', 'senior-sdet', '--draft', d, '--expect-change', newSha, '--rejudge', 'A2', '--yes'], { DOCGEN_JUDGED_BY: 'reviewer-ai-scenario-s9' });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  const e = evidence(c, 'senior-sdet');
  assert.deepEqual(e.changes[0].rejudged, ['A2']);
  assert.equal(e.changes[0].judgeMode, 'subagent');
  assert.equal(e.changes[0].judged.length, 1);
  assert.equal(e.changes[0].judged[0].key, 'A2');
  assert.ok(e.changes[0].judged[0].basis.length > 0);
  assert.equal(e.changes[0].judgedBy, 'reviewer-ai-scenario-s9');
});

scenario('S10 diff：有差异契约 + 无差异幂等提示 + 只读', (c) => {
  patch(c, WHEN_OLD, WHEN_NEW);
  const card = join(c, 'agents/senior-sdet.md');
  const ev = evidenceFile(c, 'senior-sdet');
  const before = [sha(readFileSync(card)), sha(readFileSync(ev))];
  const r = run(c, ['diff', '--kind', 'agent', '--name', 'senior-sdet']);
  assert.equal(r.status, 0, r.stderr);
  const lines = r.stdout.trimEnd().split('\n');
  assert.match(lines[0], /^旧 agents\/senior-sdet\.md  sha256=[0-9A-F]{64}（\d+ 行）$/);
  assert.match(lines[1], /^新 渲染 {12}sha256=[0-9A-F]{64}（\d+ 行）$/);
  assert.match(lines[2], /^差异 - 1 \/ \+ 1（首处第 \d+ 行）$/);
  assert.ok(lines[3].startsWith('- description: '), lines[3]);
  assert.ok(lines[4].startsWith('+ description: '), lines[4]);
  assert.match(lines[lines.length - 1], /^凭证 --expect-change [0-9A-F]{64}$/);
  assert.deepEqual([sha(readFileSync(card)), sha(readFileSync(ev))], before, 'diff 不得写任何文件');

  const same = run(c, ['diff', '--kind', 'agent', '--name', 'reviewer-audit']);
  assert.equal(same.status, 0, same.stderr);
  const l2 = same.stdout.trimEnd().split('\n');
  assert.equal(l2.length, 3);
  assert.match(l2[2], /^差异 - 0 \/ \+ 0（盘上 == 渲染，幂等，无需凭证）$/);
});

scenario('S11 阶段边界：已迁席拒跑 init-evidence / golden-assert，evidence 不变', (c) => {
  const ev = evidenceFile(c, 'senior-sdet');
  const before = sha(readFileSync(ev));
  for (const tool of ['init-evidence', 'golden-assert']) {
    const r = runTool(c, tool, ['senior-sdet']); // 副本无 .git：阶段检查必须先于 git
    assert.equal(r.status, 2, `${tool}: ${r.stdout}${r.stderr}`);
    assert.match((r.stderr || '').trim().split('\n')[0], /^MigrationPhaseClosed: /);
    assert.match(r.stderr, /diff/);
  }
  assert.equal(sha(readFileSync(ev)), before, 'evidence 不得被改写');
});

let failed = 0;
for (const [name, fn] of scenarios) {
  const copy = copyRepo();
  try {
    fn(copy);
    console.log(`PASS ${name}`);
  } catch (e) {
    failed += 1;
    console.error(`FAIL ${name}: ${e.message}`);
    process.exitCode = 1;
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

console.log(failed ? `FAIL ${failed}/${scenarios.length}` : `PASS ${scenarios.length}/${scenarios.length}`);
