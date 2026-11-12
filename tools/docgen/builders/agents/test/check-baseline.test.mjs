import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { BASELINE_RULES, agentPaths } from '../components/baseline.mjs';

const CLI = 'tools/docgen/builders/agents/cli.mjs';
// 两清单条数一律派生（gate 打印值与 baseline.json 长度同源）：本文件不写死任何条数
const N = BASELINE_RULES.length + agentPaths().length;
const REPO_BASELINE = 'tools/docgen/builders/agents/baseline.json';
const box = () => mkdtempSync(join(tmpdir(), 'dg-cb-'));
// DOCGEN_BASELINE_PATH：baseline 的读写目标重定向到临时目录——本文件绝不写真实仓（并行套件共享态）
const run = (args, env = {}) => spawnSync(process.execPath, [CLI, ...args], {
  encoding: 'utf8',
  env: { ...process.env, ...env },
});

test('check-agents：遍历全部 agent；逐席由模型渲染（exit 0）', () => {
  const r = run(['check-agents']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^OK：\d+ 个 agent 已检查（全部由模型渲染）$/m);
});

test('baseline --write：渲染当前常量写 baseline.json（条数 = 两清单之和）', () => {
  const b = box();
  const target = join(b, 'baseline.json');
  const r = run(['baseline', '--write'], { DOCGEN_BASELINE_PATH: target });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const json = JSON.parse(readFileSync(target, 'utf8'));
  assert.equal(json.length, BASELINE_RULES.length + agentPaths().length);
});

test('baseline --write 不触碰真实仓（DOCGEN_BASELINE_PATH 重定向）：并行套件不得互踩共享 baseline', () => {
  const before = statSync(REPO_BASELINE).mtimeMs;
  const b = box();
  const target = join(b, 'baseline.json');
  const r = run(['baseline', '--write'], { DOCGEN_BASELINE_PATH: target });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(existsSync(target), true, '重定向目标应被写入');
  assert.equal(statSync(REPO_BASELINE).mtimeMs, before, '本测试写了真实仓的 baseline.json（会让并发 gate 误报 BaselineDrift）');
});

test('gate 读 baseline.json：与 renderBaseline() 逐字节一致', () => {
  const b = box();
  const target = join(b, 'baseline.json');
  assert.equal(run(['baseline', '--write'], { DOCGEN_BASELINE_PATH: target }).status, 0);
  const r = run(['gate'], { DOCGEN_BASELINE_PATH: target });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, new RegExp(`baseline ${N}\\/${N}`));
});
