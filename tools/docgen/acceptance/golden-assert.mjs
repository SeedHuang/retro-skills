#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readEvidence, writeEvidence } from '../evidence.mjs';
import { renderByName } from '../cli.mjs';
import { agentData, triggerTable } from '../components/agentData.mjs';
import { patternRegistry } from '../components/patternRegistry.mjs';

const name = process.argv[2];
if (!name) { console.error('用法：node tools/docgen/acceptance/golden-assert.mjs <name>'); process.exit(2); }

function main() {
  const evidence = readEvidence(name);
  const snapshot = execFileSync('git', ['show', `${evidence.commit}:agents/${name}.md`], { encoding: 'utf8' });
  const snapshotDescription = /^---\n[^\n]*\n?description: ([^\n]*)\n[^\n]*\n?---\n/.exec(snapshot)?.[1];
  const agent = agentData.find((a) => a.name === name);
  const t = triggerTable[name];
  const derived = patternRegistry.description.parliament(agent.role, t.when);
  const goldenOk = snapshotDescription === derived;

  const rendered = renderByName(name);
  const renderedBytes = Buffer.from(rendered, 'utf8');
  const snapshotBytes = Buffer.from(snapshot, 'utf8');
  const cmp = renderedBytes.equals(snapshotBytes) ? null : { code: 'Mismatch', byte: 0, line: 1 };

  evidence.goldenAssertion = goldenOk ? 'pass' : 'fail';
  evidence.compareResult = cmp;
  evidence.renderSha256 = createHash('sha256').update(renderedBytes).digest('hex').toUpperCase();
  writeEvidence(name, evidence);
  if (!goldenOk) {
    console.error(`黄金断言失败：快照 description=${snapshotDescription}`);
    console.error(`                  派生 description=${derived}`);
    process.exit(1);
  }
  if (cmp) {
    console.error('整文件比对失败：渲染与快照不一致');
    process.exit(1);
  }
  console.log('黄金断言通过：description 逐字相等 + 整文件逐字节相等');
}

try {
  main();
} catch (e) {
  // EvidenceInvalid 等错误档位按 exit 2（与 cli.mjs 错误码档位一致）
  if (e.code) {
    process.stderr.write(`${e.code}${e.message && e.message !== e.code ? `: ${e.message}` : ''}\n`);
    process.exit(2);
  }
  // 无 code = 程序 bug（如 TypeError），重抛保留根因与默认 exit 1，避免掩盖
  throw e;
}
