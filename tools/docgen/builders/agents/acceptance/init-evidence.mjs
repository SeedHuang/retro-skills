#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { writeEvidence } from '../evidence.mjs';
import { readState } from '../state.mjs';
import { assertAgentName } from '../cli.mjs';
import { exitCodeFor } from '../components/validateAgentData.mjs';

const name = process.argv[2];
if (!name) { console.error('InvalidArgs: 用法：node tools/docgen/acceptance/init-evidence.mjs <name>'); process.exit(2); }

function fail(code, message) { const e = new Error(message); e.code = code; throw e; }

function main() {
  // R6 ① name 合法性：先于任何 git 调用（防 ../../x 路径穿越写证据）
  assertAgentName(name);
  // R6 ② 阶段判定：此步不碰 git——已迁席在无 .git 环境下也要先看到阶段码，而不是 ENOENT
  if (readState().agents[name] === 'replaced') {
    fail('MigrationPhaseClosed', `${name} 已迁移（state=replaced），init-evidence 已关闭；正确通路 = node tools/docgen/cli.mjs diff --kind agent --name ${name} → replace --expect-change <凭证>`);
  }
  // R6 ④ 才跑 git 与写盘
  const file = `agents/${name}.md`;
  const commit = execFileSync('git', ['log', '-1', '--format=%H', '--', file], { encoding: 'utf8' }).trim();
  const blob = execFileSync('git', ['rev-parse', `${commit}:${file}`], { encoding: 'utf8' }).trim();
  const hashObject = execFileSync('git', ['hash-object', '--no-filters', file], { encoding: 'utf8' }).trim();
  const bytes = readFileSync(file);
  const sha256 = createHash('sha256').update(bytes).digest('hex').toUpperCase();
  writeEvidence(name, {
    commit, blob, sha256, hashObject,
    goldenAssertion: 'pending', compareResult: null, renderSha256: 'pending', lastWrittenHash: sha256,
  });
  console.log(`evidence 已写入：${name}（commit ${commit.slice(0, 7)} / blob ${blob.slice(0, 7)}）`);
}

try {
  main();
} catch (e) {
  if (e.code) {
    // stderr 契约（spec §3.3）：首个非空行必须以 `错误码:` 开头，恒带冒号
    process.stderr.write(`${e.code}: ${e.message && e.message !== e.code ? e.message : e.code}\n`);
    let exit = 2;
    try { exit = exitCodeFor(e.code); } catch { exit = 2; }
    process.exit(exit);
  }
  throw e; // 无 code = 程序 bug，重抛保留根因
}
