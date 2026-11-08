#!/usr/bin/env node
// render13-snapshot.mjs —— 角色卡渲染快照（TC-031）：固定 fixture → 调 `renderCard` → 字节写 --out。
// S4 Task 7：旧 agent 模板与 `renderAgent` 已退场，本脚本改用新卡渲染器。
// 自检：fixture 的 role / tools 首项 / duty.action / checkItems[0].label 必须出现在产物里，
// 且探针串在模板里 0 命中——否则脚本漏读字段会让快照恒绿。
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCard } from '../components/renderCard.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const flag = (k) => {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const outPath = flag('--out');
// 严格参数白名单（2026-10-31 代码审查 I4）：未知旗标一律 exit 2，不得静默忽略（曾按旧 `--module` 用法调用会静默改行为）
const KNOWN = new Set(['--out']);
for (const tok of process.argv.slice(2)) {
  if (tok.startsWith('--') && !KNOWN.has(tok)) {
    console.error(`InvalidArgs: 未知旗标 ${tok}（只接受 --out <输出文件>）`);
    process.exit(2);
  }
}
if (!outPath) {
  console.error('用法：node tools/docgen/acceptance/render13-snapshot.mjs --out <输出文件>');
  process.exit(2);
}

const template = readFileSync(join(ROOT, 'tools/docgen/templates/agent-card.md.tpl'), 'utf8');
const card = {
  seat: 'fixture-13',
  name: 'fixture-13',
  description: '当需要评审某份 spec',
  tools: ['Read', 'Glob', 'Grep'],
  duty: { trigger: '当需要评审某份 spec', categories: ['甲'], action: 'SDET_FIXTURE_DUTY', constraint: '按职责与边界执行' },
  scenes: [],
  signals: [],
  must: [{ id: 'fixture.free-explore', kind: 'must', trigger: { scene: 'deliverable', moment: 'end', repeat: 'per-round' }, objects: ['deliverable.appendix'], criterion: 'no-fake-problem', landing: 'deliverable.appendix', requires: [] }],
  never: [],
  categories: [{ key: 'a', label: '甲核对' }],
  checkItems: [{ id: 'fixture-13.1', subject: 'reviewer-audit.card', label: 'SDET_FIXTURE_ROW', criterion: '核对甲并写出原文引句', check: 'manual', declarer: '评审员' }],
  rationale: '桩。',
};

const out = renderCard(card, { seat: 'fixture-13' });

const probes = [
  ['role', card.duty.action],
  ['tools[0]', card.tools[0]],
  ['checkItems[0].label', card.checkItems[0].label],
];
const missing = probes.filter(([, v]) => !out.includes(v)).map(([k]) => k);
const leaked = probes.filter(([, v]) => template.includes(v)).map(([k]) => k);
if (missing.length || leaked.length) {
  console.error(`自检失败：missing=${JSON.stringify(missing)} template-leak=${JSON.stringify(leaked)}`);
  process.exit(1);
}

const buf = Buffer.from(out, 'utf8');
writeFileSync(outPath, buf);
console.log(`out=${outPath} bytes=${buf.length} sha256=${createHash('sha256').update(buf).digest('hex').toUpperCase()}`);
