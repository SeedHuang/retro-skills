// markdown-rows.mjs —— markdown 表格单元格切分的**唯一实现**（单源）
// 口径：按 markdown 代码跨度规则切分——反引号跨度内的竖线与反斜杠都是字面量；跨度外的 `\|` 才是转义竖线。
//
// 为什么不能简化成 `s.split('|')`：一行里有 `` 用 `a|b` 判 `` 时，朴素切分把该格劈成两半，
// 后面所有列整体错位（下游表现为「来源不可解析」「计数非法」「场景被静默丢掉」）——
// 实测全仓 6653 条表格行里有 43 条会被朴素切分切错。
//
// `ticks > 0` 分支是关键：不特判会让 `` `scripts\` `` 吃掉收尾反引号、代码跨度永不闭合，
// 后面所有竖线都不算分隔符（本仓曾因此 15 条 findings 里 14 条是它的误报）。
//
// 与 scripts/check-all.mjs 原实现的关系（2026-10-20 逐行比对 + 全仓行为 differential）：
// 两者逻辑完全一致——归一化后 19 行逐行比对仅差注释/分号/空格，全仓 6653 条表格行实跑输出 0 条不一致，
// 故 check-all.mjs 已改为 import 本文件，不再保留第二份实现。
// 若日后两处口径需要分叉：**不要合并成两份实现**，在本文件登记差异与理由，并各自补测试。
export function splitRow(line) {
  let s = line.trim();
  if (s[0] === '|') s = s.slice(1);
  const cells = [];
  let cur = '';
  let i = 0;
  let ticks = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ticks > 0) {                       // 代码跨度内：反斜杠与竖线都是字面量
      if (ch === '`') { let n = 0; while (s[i + n] === '`') n++; if (n === ticks) ticks = 0; cur += '`'.repeat(n); i += n; continue; }
      cur += ch; i++; continue;
    }
    if (ch === '\\' && i + 1 < s.length) { cur += s[i + 1]; i += 2; continue; }   // 跨度外才转义
    if (ch === '`') { let n = 0; while (s[i + n] === '`') n++; ticks = n; cur += '`'.repeat(n); i += n; continue; }
    if (ch === '|') { cells.push(cur.trim()); cur = ''; i++; continue; }
    cur += ch; i++;
  }
  cells.push(cur.trim());
  if (cells.length > 1 && cells[cells.length - 1] === '' && s.endsWith('|')) cells.pop();
  return cells;
}

// 围栏识别：`^\s*` 未收紧到 CommonMark 的 `^ {0,3}`——4 空格缩进的 ``` 仍按围栏处理。
// 闭合判定不要求 info string 为空（CommonMark 规定闭合围栏不得带 info string，本仓不采纳）：
// 本仓文档有意用同字符嵌套围栏展示内嵌示例，强制 info 为空会把合规文档判成「围栏未闭合」。
export const FENCE_RE = /^\s*(`{3,}|~{3,})/;

// 围栏掩码（**唯一实现**，scripts/check-all.mjs 与 tools/execution-matrix/check-agent.mjs 共用）：
//   mask[i] = true 表示第 i 行在围栏内部（围栏分隔行本身不算内部）
//   未闭合的围栏会把文件剩余部分全吞进代码块，故未闭合时其后的行同样标为内部；unclosedLine 给 1-based 行号（0 = 无）
// 按「字符 + 长度」记闭合：字符相同且长度 ≥ 开启长度才算闭合，否则 4 反引号里的 3 反引号会把外层提前关掉
// （本仓 12 处嵌套围栏，漏这条会把块里的表格骨架当真表格 → 假阳）。
// 为什么要单源：卡/文档解析有多个消费方（markdown 机械检查、A 组结构检查），各写一份必然漂移——
// 「围栏内内容算不算」的两套口径会让同一份卡在两个检查里得出相反结论。
export function fenceMask(lines) {
  const mask = new Array(lines.length).fill(false);
  let open = -1;
  let openChar = '';
  let openLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = FENCE_RE.exec(lines[i]);
    if (!m) {
      if (open >= 0) mask[i] = true;
      continue;
    }
    const fence = m[1];
    if (open < 0) {
      open = i; openChar = fence[0]; openLen = fence.length;
    } else if (fence[0] === openChar && fence.length >= openLen) {
      open = -1; openChar = ''; openLen = 0;
    } else {
      mask[i] = true;                      // 关不掉的开围栏行 = 代码块内部的普通内容
    }
  }
  return { mask, unclosedLine: open >= 0 ? open + 1 : 0 };
}
