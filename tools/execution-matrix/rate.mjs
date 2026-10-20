// rate.mjs —— 置信度评级取数 CLI（spec R4 硬约束① 评级可复算 / TC-035 取数命令验证）
// 用法：node tools/execution-matrix/rate.mjs "<场景>"   → 输出「场景 → 档位（records=N, zero=M）」
//       node tools/execution-matrix/rate.mjs              → 列出全部场景的当前档位
// 取数源唯一：tools/execution-matrix/pattern-table.md 的「实测记录数 / 最近 N 次零回归」两列
// 评级不持久化：记录数增长 → 档位自动更新（每次现算）
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateFromRecords } from './rating.mjs';
import { parsePatternTable, PATTERN_TABLE } from './check-pattern-table.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 场景 → { records, zero }（取数源 = 模式表）
export function readScenarioRecords(text = readFileSync(PATTERN_TABLE, 'utf8')) {
  const map = new Map();
  for (const row of parsePatternTable(text)) {
    if (!/^\d+$/.test(row.records) || !/^\d+$/.test(row.zero)) continue;
    map.set(row.scenario, { records: Number(row.records), zero: Number(row.zero) });
  }
  return map;
}

// 单场景评级（现算，不持久化）
export function rateScenario(scenario, text) {
  const records = readScenarioRecords(text);
  const hit = records.get(scenario);
  if (!hit) return null;
  return { scenario, ...rateFromRecords(hit) };
}

export function main(argv) {
  const text = readFileSync(PATTERN_TABLE, 'utf8');
  const scenario = argv.filter((a) => !a.startsWith('-')).join(' ').trim();
  if (!scenario) {
    for (const [name, hit] of readScenarioRecords(text)) {
      const r = rateFromRecords(hit);
      console.log(`${name} → ${r.level}（records=${r.records}, zero=${r.zeroRegression}）`);
    }
    return 0;
  }
  const result = rateScenario(scenario, text);
  if (!result) {
    console.error(`场景未在模式表中登记：${scenario}`);
    return 2;
  }
  console.log(`${result.scenario} → ${result.level}（records=${result.records}, zero=${result.zeroRegression}）`);
  return 0;
}

// 仅直接运行时执行 CLI（realpath 归一化免疫 Junction，见 rule skill-authoring-convention 判据③）
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main(process.argv.slice(2));
}
