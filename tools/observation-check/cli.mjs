#!/usr/bin/env node
// 最小 CLI：单件校验（exit 0 全过 / 1 有错 / 2 用法错）+ rewrite（只重渲染 md，json 一字节不动）
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';
import { validateArtifact, resolveWriteTarget, roundMismatch } from './artifact.mjs';
import { validateObservation, renderObservation } from './checks.mjs';
import { REGISTERED_IDS } from './registered-ids.mjs';

const USAGE = [
  '用法：',
  '  node tools/observation-check/cli.mjs <json> [<json>…]   校验（exit 0 全过 / 1 有错）',
  '  node tools/observation-check/cli.mjs rewrite <json>     只重渲染 md（不写 json）',
].join('\n');

const usage = () => { console.error(USAGE); process.exit(2); };
const report = (errors) => { for (const e of errors) process.stdout.write(`${e.code}: ${e.message}\n`); };

const argv = process.argv.slice(2);
if (argv.length === 0) usage();

if (argv[0] === 'rewrite') {
  if (argv.length !== 2) usage();
  const jsonPath = argv[1];
  if (jsonPath.startsWith('-')) usage();
  if (!existsSync(jsonPath)) {
    report([{ code: 'JsonNotFound', message: `json 不存在：${jsonPath}` }]);
    process.exit(1);
  }
  let doc;
  try { doc = JSON.parse(readFileSync(jsonPath, 'utf8')); } catch (e) {
    report([{ code: 'InvalidJson', message: `JSON 解析失败：${e.message}` }]);
    process.exit(1);
  }
  // 裁决：rewrite 必须先过结构与证据校验（坏件不得被「修」成看似合规的 md）
  const errors = validateObservation(doc, { registeredIds: REGISTERED_IDS, resolveEvidence: true }).errors;
  if (errors.length > 0) { report(errors); process.exit(1); }

  // 轮次对账：调用方传入的路径含 observation-r<N> 时，N 必须 === doc.round（PRD :364-366）
  const rm = roundMismatch(jsonPath, doc);
  if (rm) { report([rm]); process.exit(1); }

  const target = resolveWriteTarget({ jsonDir: dirname(jsonPath), name: basename(jsonPath, '.json') });
  if (target.error) { report([target.error]); process.exit(1); }

  const tmp = `${target.mdPath}.tmp-${process.pid}`;
  try {
    writeFileSync(tmp, renderObservation(doc), 'utf8');
    renameSync(tmp, target.mdPath);
  } catch (e) {
    try { rmSync(tmp, { force: true }); } catch { /* 清理失败不得冒泡 */ }
    report([{ code: 'WriteFailed', message: `md 重渲染失败：${e.message}` }]);
    process.exit(1);
  }
  process.exit(0);
}

// argv 只接受位置参数：任一参数以 '-' 开头即用法错 exit 2（含 a.json -x 这种尾随选项）
if (argv.some((a) => a.startsWith('-'))) usage();
const errors = [];
for (const p of argv) errors.push(...validateArtifact(p, { registeredIds: REGISTERED_IDS }).errors);
if (errors.length === 0) process.exit(0);
report(errors);
process.exit(1);
