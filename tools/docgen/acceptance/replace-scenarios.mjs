#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { renderByName } from '../cli.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const sha = (b) => createHash('sha256').update(b).digest('hex').toUpperCase();
const stateFile = (c) => join(c, 'tools/docgen/state.json');
const evidenceFile = (c) => join(c, 'tools/docgen/fixtures/reviewer-audit.evidence.json');
const evidence = (c) => JSON.parse(readFileSync(evidenceFile(c), 'utf8'));

function copyRepo() {
  const dst = mkdtempSync(join(tmpdir(), 'dg-rep-'));
  const files = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n');
  const extra = [
    'tools/docgen/state.json',
    'tools/docgen/state.mjs',
    'tools/docgen/evidence.mjs',
    'tools/docgen/components/sharedBlocks.mjs',
    'tools/docgen/components/outputFormats.mjs',
    'tools/docgen/components/renderAgent.mjs',
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

function run(copy, args) {
  return spawnSync(process.execPath, [join(copy, 'tools/docgen/cli.mjs'), ...args], {
    cwd: copy,
    encoding: 'utf8',
    env: {
      ...process.env,
      DOCGEN_DRAFTS_DIR: join(copy, '.drafts'),
      DOCGEN_STATE_PATH: stateFile(copy),
      DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures'),
    },
  });
}

function seedEvidence(copy) {
  const file = 'agents/reviewer-audit.md';
  const commit = execFileSync('git', ['log', '-1', '--format=%H', '--', file], { cwd: REPO, encoding: 'utf8' }).trim();
  const blob = execFileSync('git', ['rev-parse', `${commit}:${file}`], { cwd: REPO, encoding: 'utf8' }).trim();
  const hashObject = execFileSync('git', ['hash-object', '--no-filters', file], { cwd: REPO, encoding: 'utf8' }).trim();
  const target = readFileSync(join(copy, file));
  const rendered = Buffer.from(renderByName('reviewer-audit'), 'utf8');
  mkdirSync(dirname(evidenceFile(copy)), { recursive: true });
  writeFileSync(evidenceFile(copy), `${JSON.stringify({
    commit, blob, sha256: sha(target), hashObject,
    goldenAssertion: 'pass', compareResult: null, renderSha256: sha(rendered), lastWrittenHash: sha(target),
  }, null, 2)}\n`);
}

function draft(copy, name = 'reviewer-audit') {
  const r = run(copy, ['draft', '--kind', 'agent', '--name', name]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const f = readdirSync(join(copy, '.drafts')).find((x) => x.startsWith(`${name}--`));
  assert.ok(f, `草稿未生成：${name}`);
  return join(copy, '.drafts', f);
}

function scenario(name, fn) {
  const copy = copyRepo();
  try {
    fn(copy);
    console.log(`PASS ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}: ${e.message}`);
    process.exitCode = 1;
  } finally {
    rmSync(copy, { recursive: true, force: true });
  }
}

scenario('S1 首次替换成功', (c) => {
  seedEvidence(c);
  const d = draft(c);
  const r = run(c, ['replace', '--kind', 'agent', '--name', 'reviewer-audit', '--draft', d, '--yes']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(JSON.parse(readFileSync(stateFile(c), 'utf8')).agents['reviewer-audit'], 'replaced');
  assert.ok(readFileSync(join(c, 'agents/reviewer-audit.md')).equals(Buffer.from(renderByName('reviewer-audit'))));
  assert.equal(readdirSync(join(c, '.drafts')).length, 0);
  assert.equal(evidence(c).lastWrittenHash, sha(readFileSync(join(c, 'agents/reviewer-audit.md'))));
});

scenario('S2 TargetDrift', (c) => {
  seedEvidence(c);
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

console.log(process.exitCode ? 'FAIL' : 'PASS 6/6');
