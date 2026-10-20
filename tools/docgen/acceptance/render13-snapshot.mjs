#!/usr/bin/env node
// render13-snapshot.mjs —— 议会席模板渲染快照（TC-031）：固定 fixture → 调指定 renderAgent 模块 → 字节写 --out。
// 自检：fixture 的 role / dimension / tools 首项 / fixedList[0] / AUDIT_RULES 展开文本必须出现在产物里，
// 且探针串在模板里 0 命中——否则脚本漏读字段会让改前/改后快照同时少同一段而恒绿。
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sharedBlocks } from '../components/sharedBlocks.mjs';
import { outputFormats } from '../components/outputFormats.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const flag = (k) => {
  const i = process.argv.indexOf(k);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const modulePath = flag('--module');
const outPath = flag('--out');
if (!modulePath || !outPath) {
  console.error('用法：node tools/docgen/acceptance/render13-snapshot.mjs --module <renderAgent 模块路径> --out <输出文件>');
  process.exit(2);
}

const template = readFileSync(join(ROOT, 'tools/docgen/templates/agent.md.tpl'), 'utf8');
const agent = {
  name: 'fixture-13',
  role: '评审员',
  dimension: '技术实现',
  tools: ['Read', 'Glob', 'Grep'],
  identity: '桩。',
  fixedList: ['SDET_FIXTURE_ROW_1', 'SDET_FIXTURE_ROW_2'],
  outputKind: 'issue-card',
  sharedBlock: 'AUDIT_RULES',
};
const trigger = { when: '当需要评审某份 spec' };

const mod = await import(pathToFileURL(resolve(modulePath)).href);
const out = mod.renderAgent({ agent, trigger, template, sharedBlocks, outputFormats });

const probes = [
  ['role', agent.role],
  ['dimension', agent.dimension],
  ['tools[0]', agent.tools[0]],
  ['fixedList[0]', agent.fixedList[0]],
  ['AUDIT_RULES', sharedBlocks.AUDIT_RULES],
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
