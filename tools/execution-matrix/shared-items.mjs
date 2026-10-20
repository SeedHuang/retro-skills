// shared-items.mjs —— 共享项（④来源覆盖 / ⑤冲突裁决 / ⑥例外从严 / ⑦触发机制 / ⑧验证闭环）判定定义行解析
// 权威载体 = rule-inspector 判据集 §2.4（rule 判据单源）；本文件只做「读原文 → 结构化」，不判语义。
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 权威载体：共享项的判定定义行只允许出现在这里（判据正文单源）
export const AUTHORITY_FILE = join(ROOT, 'skills', 'rule-inspector', 'references', 'criteria.md');
// 引用方载体：必须以「判据名 + 指向权威定义」的引用方式出现，不复制判定定义行原文
export const SKILL_FILE = join(ROOT, 'rules', 'skill-authoring-convention.md');
// agent 判据正文单源：同样不得复制共享项判定定义行原文
export const AGENT_CRITERIA_FILE = join(ROOT, 'tools', 'execution-matrix', 'criteria.md');

// 判据编号字符类（**唯一实现**，check-buckets.mjs 引用）：圈号 U+2460-U+24FF + 罗马数字 U+2160-U+217F。
// 为什么不写死 ④⑤⑥⑦⑧：写死后判据正文新增第 9 项会被正则静默跳过——既不进归桶、也不报错。
export const MARKER_CLASS = '[\\u2460-\\u24FF\\u2160-\\u217F]';
const ROW_RE = new RegExp(`^\\|\\s*(${MARKER_CLASS})\\s*\\|\\s*\\*\\*([^*]+)\\*\\*\\s*\\|\\s*(.+?)\\s*\\|\\s*有\\s*1\\s*\\/\\s*无\\s*0\\s*\\|\\s*$`);

// 「哪些编号的检查项属共享项」的唯一真相源（本文件定义，check-buckets.mjs 引用）
// 新增共享项时只改这里一处：RULE_MARKER_ITEM 的共享项桶归属由它派生，台账守卫也按它取集合。
export const SHARED_MARKERS = ['④', '⑤', '⑥', '⑦', '⑧'];

/**
 * 从权威载体解析共享项的判定定义行原文。
 * @returns {Map<string,string>} 键 = 共享项 ID（名称+编号，如 '来源覆盖④'），值 = 判定定义行原文
 */
export function readSharedDefinitions(file = AUTHORITY_FILE) {
  const defs = new Map();
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = ROW_RE.exec(line);
    if (m && SHARED_MARKERS.includes(m[1])) defs.set(`${m[2]}${m[1]}`, m[3]);
  }
  return defs;
}
