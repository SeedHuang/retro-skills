// check-pattern-table.mjs —— 模式表守卫（spec R6 / TC-036~040 / TC-048）
//   1) 种子行数 ≥5
//   2) 每行来源 = `文件:行号`（或 `文件:起-止`）形态；目标文件存在 + 引用行存在
//   3) 判据正文（三个载体）不含模式表行内容（好/不好场景例）——TC-040 复制而非引用
//   4) 记录数 / 零回归列是非负整数（评级取数的输入）
//   来源行内容与行结论「同主题」属语义判断（TC-048），本脚本只做机器半边：行存在 + 非空
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitRow } from './markdown-rows.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PATTERN_TABLE = join(ROOT, 'tools', 'execution-matrix', 'pattern-table.md');

// 判据正文载体（TC-040 的扫描范围）
export const CRITERIA_CARRIERS = [
  'skills/rule-inspector/references/criteria.md',
  'rules/skill-authoring-convention.md',
  'tools/execution-matrix/criteria.md',
];

const MIN_SEED_ROWS = 5;

// 表格行切分 = markdown-rows.mjs 的共享单源（反引号跨度内的竖线是字面量，本文件不保留第二份实现）

// 解析模式表数据行（跳过表头与分隔行）
export function parsePatternTable(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = splitRow(line);
    if (cells.length < 6) continue;
    if (cells[0] === '场景') continue;                       // 表头
    if (/^:?-{2,}:?$/.test(cells[0])) continue;              // 分隔行
    rows.push({
      scenario: cells[0],
      good: cells[1],
      bad: cells[2],
      source: cells[3],
      records: cells[4],
      zero: cells[5],
    });
  }
  return rows;
}

// 解析来源单元格里的 `文件:行号`（或 `文件:起-止`）
export function parseSource(cell) {
  const m = /`([^`]+)`/.exec(cell);
  if (!m) return null;
  const spec = m[1];
  const idx = spec.lastIndexOf(':');
  if (idx <= 0) return null;
  const file = spec.slice(0, idx);
  const lineSpec = spec.slice(idx + 1);
  const range = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(lineSpec);
  if (!range) return null;
  const start = Number(range[1]);
  const end = range[2] === undefined ? start : Number(range[2]);
  if (start < 1 || end < start) return null;
  return { file, start, end };
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

export function checkPatternTable(opts = {}) {
  const tablePath = opts.tablePath ?? PATTERN_TABLE;
  const findings = [];
  if (!existsSync(tablePath)) {
    return { ok: false, findings: [{ code: 'PatternTableMissing', file: tablePath }] };
  }
  const rows = parsePatternTable(readFileSync(tablePath, 'utf8'));

  // 1) 种子行数
  if (rows.length < MIN_SEED_ROWS) {
    findings.push({ code: 'PatternSeedTooFew', rows: rows.length, min: MIN_SEED_ROWS });
  }

  // 判据正文载体（模式表内容不得复制进判据正文）
  const carriers = opts.carriers ?? {};
  const carrierTexts = CRITERIA_CARRIERS.map((rel) => {
    if (Object.prototype.hasOwnProperty.call(carriers, rel)) return { rel, text: carriers[rel] };
    const p = join(ROOT, rel);
    return { rel, text: existsSync(p) ? readFileSync(p, 'utf8') : '' };
  });

  for (const row of rows) {
    // 2) 来源可复算
    const src = parseSource(row.source);
    if (!src) {
      findings.push({ code: 'PatternSourceUnparsable', scenario: row.scenario, source: row.source });
    } else {
      const abs = join(ROOT, src.file);
      if (!existsSync(abs)) {
        findings.push({ code: 'PatternSourceFileMissing', scenario: row.scenario, file: src.file });
      } else {
        const total = lineCount(readFileSync(abs, 'utf8'));
        if (src.end > total) {
          findings.push({ code: 'PatternSourceLineMissing', scenario: row.scenario, file: src.file, line: src.end, total });
        } else {
          const content = readFileSync(abs, 'utf8').split(/\r?\n/)[src.start - 1] ?? '';
          if (content.trim() === '') {
            findings.push({ code: 'PatternSourceLineEmpty', scenario: row.scenario, file: src.file, line: src.start });
          }
        }
      }
    }

    // 3) 判据正文不含模式表行内容
    for (const cell of [row.scenario, row.good, row.bad]) {
      if (cell.length < 4) continue;
      for (const carrier of carrierTexts) {
        if (carrier.text.includes(cell)) {
          findings.push({ code: 'PatternCopiedIntoCriteria', scenario: row.scenario, text: cell, file: carrier.rel });
        }
      }
    }

    // 4) 记录数 / 零回归必须是可取数的非负整数
    for (const [label, value] of [['records', row.records], ['zero', row.zero]]) {
      if (!/^\d+$/.test(value)) {
        findings.push({ code: 'PatternBadCount', scenario: row.scenario, field: label, value });
      }
    }
  }

  return { ok: findings.length === 0, findings, rows };
}
