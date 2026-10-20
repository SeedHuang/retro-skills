import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { validateAgentData, exitCodeFor } from '../components/validateAgentData.mjs';
import { collectGate } from '../cli.mjs';

const CLI = 'tools/docgen/cli.mjs';
const stateFile = () => join(mkdtempSync(join(tmpdir(), 'dg-state-')), 'state.json');
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], {
  encoding: 'utf8',
  env: { ...process.env, DOCGEN_STATE_PATH: stateFile(), ...env },
});

test('新增错误码档位：TargetDrift=1，其余四码=2', () => {
  assert.equal(exitCodeFor('TargetDrift'), 1);
  for (const code of ['StateFileInvalid', 'GoldenSnapshotUnavailable', 'EvidenceInvalid', 'InvalidArgs']) {
    assert.equal(exitCodeFor(code), 2, code);
  }
});

test('agentData 条目含独立 description → DescriptionDerivation', () => {
  const data = agentData.map((a) => (a.name === 'reviewer-audit' ? { ...a, description: '硬编码' } : a));
  assert.throws(() => validateAgentData(data, triggerTable), /DescriptionDerivation/);
});

test('when 以「时」结尾 → WhenFormatViolation', () => {
  const table = { ...triggerTable, 'reviewer-audit': { when: '当X时', route: 'reviewer-audit' } };
  assert.throws(() => validateAgentData(agentData, table), /WhenFormatViolation/);
});

test('state 缺失 = 全量 registered；check-agents 输出 0 已接管 / 14 未迁移', () => {
  const r = run(['check-agents']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /已接管 0，未迁移 14/);
});

test('state version≠1 → StateFileInvalid（exit 2）', () => {
  const p = stateFile();
  writeFileSync(p, '{"version":2,"agents":{}}\n');
  const r = run(['check-agents'], { DOCGEN_STATE_PATH: p });
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /StateFileInvalid/);
});

test('state 键不在 agentData → StateFileInvalid（exit 2）', () => {
  const p = stateFile();
  writeFileSync(p, '{"version":1,"agents":{"ghost":"replaced"}}\n');
  const r = run(['check-agents'], { DOCGEN_STATE_PATH: p });
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /StateFileInvalid/);
});

test('collectGate 收集漂移而不抛：人为制造清单外 agent 文件', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dg-agents-'));
  writeFileSync(join(dir, 'ghost.md'), '# ghost\n');
  const prev = process.env.DOCGEN_AGENTS_DIR;
  process.env.DOCGEN_AGENTS_DIR = dir;
  try {
    const d = collectGate();
    assert.ok(d.some((x) => x.code === 'UnregisteredHandwritten' && x.path.includes('ghost.md')));
  } finally {
    if (prev === undefined) delete process.env.DOCGEN_AGENTS_DIR; else process.env.DOCGEN_AGENTS_DIR = prev;
    rmSync(dir, { recursive: true, force: true });
  }
});

test('golden-assert 在缺 evidence 时 exit 2（EvidenceInvalid）', () => {
  const r = spawnSync(process.execPath, ['tools/docgen/acceptance/golden-assert.mjs', 'ghost'], {
    encoding: 'utf8', env: { ...process.env, DOCGEN_EVIDENCE_DIR: mkdtempSync(join(tmpdir(), 'dg-ev-')) },
  });
  assert.equal(r.status, 2);
  assert.match(r.stdout + r.stderr, /EvidenceInvalid/);
});
