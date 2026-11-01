#!/usr/bin/env node
// 「不得先改后记」的可跑判据（S2 spec §6-D9 / testcase `S2-TC-H06` 的载体）。
// 原文口径：产出里出现「已代为…」「已代删…」这类**先动手再记账**的表述 → 红。
// 为什么要有这条脚本而不是写进卡面散文：散文不可判；本脚本给字面串 + 退出码，任何调用方拿退出码即可判。
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORDS = ['已代为', '已代删'];

export function scanBeforeAfter(texts) {
  const hits = [];
  for (const { path, text } of texts) {
    const lines = String(text).split(/\r?\n/);
    lines.forEach((line, i) => {
      const hit = WORDS.find((w) => line.includes(w));
      if (hit) hits.push({ path, line: i + 1, word: hit });
    });
  }
  return hits;
}

export function collectTargets(extra = []) {
  const out = extra.map((p) => ({ path: p, text: existsSync(p) ? readFileSync(p, 'utf8') : '' }));
  const dir = join(ROOT, 'agents');
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
      out.push({ path: `agents/${f}`, text: readFileSync(join(dir, f), 'utf8') });
    }
  }
  return out;
}

export function main(argv = process.argv.slice(2)) {
  const hits = scanBeforeAfter(collectTargets(argv));
  if (hits.length === 0) {
    console.log('before-after ok（0 处「先改后记」字样）');
    return 0;
  }
  for (const h of hits) console.log(`${h.path}:${h.line} 命中「${h.word}」（不得先改后记）`);
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
