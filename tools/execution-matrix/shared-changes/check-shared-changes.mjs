// check-shared-changes.mjs —— R7 硬闸门机械判定（共享项变更必须「改前 vs 改后 + 用户确认」留齐）
//   ① SharedChangeIncomplete   每条变更记录缺「改前版 / 改后版 / 用户确认」任一件 → 报红
//   ② SharedChangeBadDate      日期不是 YYYY-MM-DD → 报红（日期是「取最新」的排序依据，不可信即失效）
//   ③ SharedDefinitionMismatch 每个共享项按**日期最新**的「改后版」≠ 权威载体当前定义 → 报红（改了却没登记 / 登记了但没落地）
// ⚠ 「最新」按 date 列取，不按文件出现顺序——否则把一条旧记录补记到文件末尾，就会让旧版本盖住新版本
//   （实测可把「未落地的变更」判成通过 = 假绿，R7 硬闸门被绕过）。
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSharedDefinitions } from '../shared-items.mjs';
import { splitRow } from '../markdown-rows.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const LEDGER = join(ROOT, 'tools', 'execution-matrix', 'shared-changes', 'changes.md');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 表格行切分 = markdown-rows.mjs 的共享单源（反引号跨度内的竖线是字面量，本文件不保留第二份实现）

// 解析变更记录表（表头：日期 | 共享项 | 改前版 | 改后版 | 用户确认 | 受影响引用方）
export function parseLedger(text) {
  const records = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = splitRow(line);
    if (cells.length < 6) continue;
    if (cells[0] === '日期') continue;                        // 表头
    if (/^:?-{2,}:?$/.test(cells[0])) continue;              // 分隔行
    records.push({
      date: cells[0],
      item: cells[1],
      before: cells[2],
      after: cells[3],
      confirmed: cells[4],
      affected: cells[5],
    });
  }
  return records;
}

export function checkSharedChanges(opts = {}) {
  const ledgerPath = opts.ledgerPath ?? LEDGER;
  const findings = [];
  let text = opts.ledgerText;
  if (text === undefined) {
    if (!existsSync(ledgerPath)) {
      return { ok: false, findings: [{ code: 'SharedLedgerMissing', file: ledgerPath }] };
    }
    text = readFileSync(ledgerPath, 'utf8');
  }
  const records = parseLedger(text);
  const defs = readSharedDefinitions();

  // ① 三件套齐全 + 日期格式
  for (const rec of records) {
    for (const field of ['before', 'after', 'confirmed']) {
      if (!rec[field]) {
        findings.push({ code: 'SharedChangeIncomplete', item: rec.item, date: rec.date, missing: field });
      }
    }
    if (!DATE_RE.test(rec.date)) {
      findings.push({ code: 'SharedChangeBadDate', item: rec.item, date: rec.date, expect: 'YYYY-MM-DD' });
    }
  }

  // ② 日期最新那条的「改后版」= 权威载体当前定义（不按文件顺序——见文件头 ⚠）
  //    同日多条时后出现的优先（返回 -1/1 之外用 0 → 保留后出现者，与旧行为一致）。
  const latest = new Map();
  for (const rec of records) {
    if (!rec.item) continue;
    const prev = latest.get(rec.item);
    if (!prev || rec.date >= prev.date) latest.set(rec.item, rec);
  }
  for (const [item, def] of defs) {
    const rec = latest.get(item);
    if (!rec) {
      findings.push({ code: 'SharedDefinitionMismatch', item, reason: '台账无该共享项的登记记录', current: def });
    } else if (rec.after !== def) {
      findings.push({ code: 'SharedDefinitionMismatch', item, reason: '台账改后版与权威载体当前定义不一致', registered: rec.after, current: def });
    }
  }
  for (const item of latest.keys()) {
    if (!defs.has(item)) {
      findings.push({ code: 'SharedDefinitionMismatch', item, reason: '台账登记了非共享项' });
    }
  }

  return { ok: findings.length === 0, findings, records };
}
