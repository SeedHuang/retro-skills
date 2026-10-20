// rate.test.mjs —— 评级取数链路（TC-035：命令在载体中显式写出，取数与评级依据一致）
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rateFromRecords } from './rating.mjs';
import { readScenarioRecords, rateScenario } from './rate.mjs';
import { splitRow } from './markdown-rows.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TABLE = join(ROOT, 'tools', 'execution-matrix', 'pattern-table.md');

test('模式表每行的「实测记录数 / 最近 N 次零回归」都能取出并算出档位', () => {
  const records = readScenarioRecords();
  assert.ok(records.size >= 5, `可取数场景数 ${records.size} < 5`);
  for (const [scenario, hit] of records) {
    const r = rateScenario(scenario);
    assert.ok(r, `场景未取到评级：${scenario}`);
    assert.equal(r.records, hit.records);
    assert.equal(r.zeroRegression, hit.zero);
    assert.equal(r.level, rateFromRecords(hit).level);
  }
});

test('取数结果与模式表原文一致（记录数可复算）', () => {
  const text = readFileSync(TABLE, 'utf8');
  const records = readScenarioRecords(text);
  const lines = text.split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|\s*场景/.test(l) && !/^\s*\|---/.test(l));
  for (const line of lines) {
    const cells = splitRow(line);
    const hit = records.get(cells[0]);
    assert.ok(hit, `模式表场景未进取数：${cells[0]}`);
    assert.equal(String(hit.records), cells[4]);
    assert.equal(String(hit.zero), cells[5]);
  }
});

test('未知场景 → rateScenario 返回 null（不臆造档位）', () => {
  assert.equal(rateScenario('不存在的场景'), null);
});

test('评级现算不持久化：记录数增长 → 档位自动更新', () => {
  assert.equal(rateFromRecords({ records: 2, zero: 2 }).level, 'mid');
  assert.equal(rateFromRecords({ records: 3, zero: 3 }).level, 'high');
});
