// A01–A03 按 Ruling #1（零提交）降级为 Task 2 时点验收证据，本文件不含；
// 清单见 .superpowers/sdd/2026-10-27-s2-observation-check/progress.md §迁入清单
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from './evidence.mjs';

const ROOT = repoRoot();
const DIR = join(ROOT, 'tools/observation-check');
const EXPLORATION = join(ROOT, 'docs/after/20261026164718-agent-card-composition-exploration.md');
const SELF = basename(fileURLToPath(import.meta.url));

function testFiles() {
  return readdirSync(DIR).filter((f) => f.endsWith('.test.mjs')).map((f) => ({ name: f, text: readFileSync(join(DIR, f), 'utf8') }));
}

test('A05 测试对角色卡目录引用 = 0（静态面含 path 字面量扩展）', () => {
  const hits = testFiles()
    .filter(({ name }) => name !== SELF)             // 免扫仅限本审计脚本自身（非证据夹具）
    .flatMap(({ name, text }) => {
      const out = [];
      // 判据是「不许引用角色卡目录」：本行与标题都不得出现该目录的字面路径，否则验收命令永远数出非零
      if (/agents[/\\]/.test(text)) out.push(`${name}: 角色卡目录`);
      if (/path:\s*['"`](agents|docs|tools)\//.test(text)) out.push(`${name}: path 字面量`);
      return out;
    });
  assert.deepEqual(hits, []);
});

test('F01 旧 coverage 基具 0 残留', () => {
  const hits = testFiles().filter(({ name }) => name !== SELF).filter(({ text }) => text.includes('read: 4, total: 4')).map(({ name }) => name);
  assert.deepEqual(hits, []);
});

test('F02 旧文案 0 残留、新文案 ≥2 处', () => {
  const files = testFiles().filter(({ name }) => name !== SELF);
  assert.deepEqual(files.filter(({ text }) => /读 \d+ 部分/.test(text)).map(({ name }) => name), []);
  const hits = files.filter(({ text }) => text.includes('已判')).length;
  assert.ok(hits >= 2, `「已判」命中 ${hits} 处`);
  // F016 代理判据：「≥2 处」可由别的文件凑绿，故另钉 render-check 的 replace 负例目标仍在
  // （该负例整条被删后，仅靠计数是看不出来的）
  const rc = readFileSync(join(DIR, 'render-check.test.mjs'), 'utf8');
  assert.ok(rc.includes("replace('已判 2 条'"), 'render-check.test.mjs 的 replace 负例目标已不存在（负例可能被整条删掉）');
});

test('F04 探索稿 :686 旧 schema 片段 0 残留 + PRD 指针在位', () => {
  const text = readFileSync(EXPLORATION, 'utf8');
  assert.equal((text.match(/coverage: \{ read, total, skipped: \[\] \}/g) ?? []).length, 0);
  assert.ok(text.includes('docs/prd/20261026205821-agent-card-contract.md'), '缺 PRD §4.1 指针');
});
