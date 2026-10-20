// check-buckets.mjs —— 归桶守卫（spec R1：每项恰有一处当前归属 + 共享项定义一次、引用而非复制）
// 6 类断言（每类一条 finding code）：
//   1) BucketNameUnknown      桶名必须在枚举内
//   2) DuplicateBucket        同一项出现在两个桶
//   3) BucketMismatch         项必须落在预期桶（预期桶 = 判据正文所在载体 + spec §4 归桶表）
//   4) MissingBucket          判据正文里出现的检查项必须都落桶（无遗漏）
//   4b) BucketMarkerUnknown   判据正文新增了检查项标记、但映射表未登记（不静默漏过）
//   5) SharedBodyDuplicated   共享项（④⑤⑥⑦⑧）的判定定义行在第二个载体各一份（应引用不复制）
//      + SharedPointerMissing  引用方载体缺「判据名 + 指向权威定义」的指针
//
// 「项 → 预期桶」映射只存一份（下表）；buckets.mjs 存「当前落桶」这一份数据。两者不一致即报红——
// 映射是判据（spec §4），buckets.mjs 是数据，一致性由本守卫兜住。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUCKETS } from './buckets.mjs';
import { readSharedDefinitions, ROOT, MARKER_CLASS } from './shared-items.mjs';

// R1 命名 5 类：4 个共享桶 + 「各类型独有」（展开为 3 个具体桶名）→ 桶名白名单 7 个
export const ALLOWED_BUCKET_NAMES = [
  'allShared', 'agentAndSkillShared', 'agentAndRuleShared', 'skillAndRuleShared',
  'rule 独有', 'skill 独有', 'agent 独有',
];

// 判据正文载体（相对仓库根）
export const CARRIER_FILES = {
  agent: 'tools/execution-matrix/criteria.md',
  rule: 'skills/rule-inspector/references/criteria.md',
  skill: 'rules/skill-authoring-convention.md',
};

// 判据正文里的检查项标记 → [归桶项名, 预期桶]
// ① - ⑧ 是 rule 判据集 §2.4 执行力度 8 项：①②③ = rule 独有；④⑤⑥⑦⑧ = skill+rule 共享
// ⚠ 本表是「标记 → 归桶项 + 预期桶」的唯一映射表：判据正文新增标记时必须在此登记，
//   否则被下方 unknownMarkers() 报 BucketMarkerUnknown 红（不静默漏过）。
export const RULE_MARKER_ITEM = {
  '①': ['执行力度①', 'rule 独有'],
  '②': ['执行力度②', 'rule 独有'],
  '③': ['执行力度③', 'rule 独有'],
  '④': ['来源覆盖④', 'skillAndRuleShared'],
  '⑤': ['冲突裁决⑤', 'skillAndRuleShared'],
  '⑥': ['例外从严⑥', 'skillAndRuleShared'],
  '⑦': ['触发机制⑦', 'skillAndRuleShared'],
  '⑧': ['验证闭环⑧', 'skillAndRuleShared'],
};
// skill-authoring-convention 的 4 条判据 ①~④（对齐该文件实际判据）
const SKILL_MARKER_ITEM = {
  '①': ['跨技能路径引用', 'skill 独有'],
  '②': ['自引用相对路径', 'skill 独有'],
  '③': ['脚本守卫路径免疫', 'skill 独有'],
  '④': ['目录语义', 'skill 独有'],
};

// 通用标记捕获：圈号 + 罗马数字，字符类 = shared-items.mjs 的 MARKER_CLASS（唯一实现，不在此重复定义）。
// 为什么不写死枚举 `[①②③④⑤⑥⑦⑧]`：写死后判据正文新增第 9 项（`⑨`）会被正则静默跳过，
// 归桶索引没更新也不报红 = 「无遗漏」对 rule/skill 侧失效（agent 侧 `([ABC]\d+`) 一直是通用的）。
// 改为「通用捕获 + 查表」后：已知标记照常映射；未知标记由 unknownMarkers() 报红。
const RULE_MARKER_ROW_RE = new RegExp(`^\\|\\s*(${MARKER_CLASS})\\s*\\|\\s*\\*\\*`, 'gm');
const SKILL_MARKER_HEADING_RE = new RegExp(`^###\\s*判据\\s*(${MARKER_CLASS})\\s*[：:]`, 'gm');
// 剥离「判据名 + 编号」尾部的编号（如 来源覆盖④ → 来源覆盖）：用同一 MARKER_CLASS，不写死 ④⑤⑥⑦⑧——
// 写死后新增编号（如 ⑨）剥离失败，会拿带编号的全名去引用方载体里 includes，误报 SharedPointerMissing。
const MARKER_SUFFIX_RE = new RegExp(`${MARKER_CLASS}$`);

// 项 → 预期桶（判据正文里的检查项 → 归桶项 + 预期桶），供 BucketMismatch / MissingBucket 判定
export const EXPECTED_OWNERSHIP = (() => {
  const map = new Map();
  for (const [marker, [item, bucket]] of Object.entries(RULE_MARKER_ITEM)) map.set(`${marker}|rule`, { item, bucket, file: CARRIER_FILES.rule });
  for (const [marker, [item, bucket]] of Object.entries(SKILL_MARKER_ITEM)) map.set(`${marker}|skill`, { item, bucket, file: CARRIER_FILES.skill });
  return map;
})();

function readCarrier(rel, carriers) {
  if (carriers && Object.prototype.hasOwnProperty.call(carriers, rel)) return carriers[rel];
  return readFileSync(join(ROOT, rel), 'utf8');
}

// 判据正文里出现的检查项 → 项名 + 预期桶（无遗漏判定的依据）
export function itemsFromCriteria(carriers = {}) {
  const found = new Map();
  const add = (item, bucket, from) => {
    if (!found.has(item)) found.set(item, { item, bucket, from });
  };
  const agent = readCarrier(CARRIER_FILES.agent, carriers);
  for (const m of agent.matchAll(/^###\s+([ABC]\d+)\s/gm)) add(m[1], 'agent 独有', CARRIER_FILES.agent);
  const rule = readCarrier(CARRIER_FILES.rule, carriers);
  for (const m of rule.matchAll(RULE_MARKER_ROW_RE)) {
    const hit = RULE_MARKER_ITEM[m[1]];
    if (hit) add(hit[0], hit[1], CARRIER_FILES.rule);   // 未知标记交给 unknownMarkers() 报红，不静默吞
  }
  for (const m of rule.matchAll(/^\|\s*(X[123])\s*\|/gm)) add(m[1], 'rule 独有', CARRIER_FILES.rule);
  if (/通用\s*17/.test(rule)) add('通用17', 'rule 独有', CARRIER_FILES.rule);
  const skill = readCarrier(CARRIER_FILES.skill, carriers);
  for (const m of skill.matchAll(SKILL_MARKER_HEADING_RE)) {
    const hit = SKILL_MARKER_ITEM[m[1]];
    if (hit) add(hit[0], hit[1], CARRIER_FILES.skill);
  }
  return found;
}

// 判据正文里出现、但映射表未登记的标记 → BucketMarkerUnknown
// 为什么必须报红：判据正文新增了检查项却忘了更新 RULE/SKILL_MARKER_ITEM，
// 若静默忽略则该检查项既不落桶、也不报错 = 「无遗漏」判据被绕过（本轮实测过的漏法）。
export function unknownMarkers(carriers = {}) {
  const out = [];
  const rule = readCarrier(CARRIER_FILES.rule, carriers);
  for (const m of rule.matchAll(RULE_MARKER_ROW_RE)) {
    if (!RULE_MARKER_ITEM[m[1]]) out.push({ code: 'BucketMarkerUnknown', marker: m[1], from: CARRIER_FILES.rule, reason: 'rule 判据正文新增了检查项，但 RULE_MARKER_ITEM 归桶索引未更新' });
  }
  const skill = readCarrier(CARRIER_FILES.skill, carriers);
  for (const m of skill.matchAll(SKILL_MARKER_HEADING_RE)) {
    if (!SKILL_MARKER_ITEM[m[1]]) out.push({ code: 'BucketMarkerUnknown', marker: m[1], from: CARRIER_FILES.skill, reason: 'skill 判据正文新增了检查项，但 SKILL_MARKER_ITEM 归桶索引未更新' });
  }
  return out;
}

// 共享项定义处计数：权威定义行原文只允许出现在权威载体；引用方载体须「判据名 + 指向权威定义」
export function checkSharedBodies(carriers = {}) {
  const findings = [];
  const defs = readSharedDefinitions();
  const carrierFiles = [CARRIER_FILES.rule, CARRIER_FILES.skill, CARRIER_FILES.agent];
  const texts = carrierFiles.map((rel) => [rel, readCarrier(rel, carriers)]);
  const skillText = texts.find(([rel]) => rel === CARRIER_FILES.skill)[1];
  for (const [item, def] of defs) {
    const sites = texts.filter(([, text]) => text.includes(def)).map(([rel]) => rel);
    if (sites.length > 1) {
      findings.push({ code: 'SharedBodyDuplicated', item, definition: def, sites });
    }
    // 引用方载体必须「判据名 + 指向权威定义」——只引用不复制
    const name = item.replace(MARKER_SUFFIX_RE, '');
    if (!skillText.includes(name)) {
      findings.push({ code: 'SharedPointerMissing', item, need: `判据名「${name}」`, file: CARRIER_FILES.skill });
    } else if (!/rule-inspector/.test(skillText) || !/§2\.4/.test(skillText)) {
      findings.push({ code: 'SharedPointerMissing', item, need: '指向权威定义的指针（rule-inspector 技能判据集 §2.4）', file: CARRIER_FILES.skill });
    }
  }
  return findings;
}

export function checkBuckets(buckets = BUCKETS, opts = {}) {
  const carriers = opts.carriers ?? {};
  const findings = [];

  // 1) 桶名枚举
  for (const bucket of buckets) {
    if (!ALLOWED_BUCKET_NAMES.includes(bucket.name)) {
      findings.push({ code: 'BucketNameUnknown', bucket: bucket.name, allowed: ALLOWED_BUCKET_NAMES });
    }
  }

  // 2) 跨桶重复
  const seen = new Map();
  for (const bucket of buckets) {
    for (const item of bucket.items) {
      if (seen.has(item)) {
        findings.push({ code: 'DuplicateBucket', item, bucket: bucket.name, also: seen.get(item) });
      } else {
        seen.set(item, bucket.name);
      }
    }
  }

  // 3) 桶归属 + 4) 无遗漏（判据正文里的检查项必须都落桶，且落在预期桶）
  // 4b) 判据正文新增了标记但映射表没登记 → BucketMarkerUnknown（不静默漏过）
  findings.push(...unknownMarkers(carriers));
  const criteriaItems = itemsFromCriteria(carriers);
  for (const [item, { bucket, from }] of criteriaItems) {
    const actual = seen.get(item);
    if (actual === undefined) {
      findings.push({ code: 'MissingBucket', item, expected: bucket, from });
    } else if (actual !== bucket) {
      findings.push({ code: 'BucketMismatch', item, bucket: actual, expected: bucket, from });
    }
  }
  for (const [item, bucket] of seen) {
    if (!criteriaItems.has(item)) {
      findings.push({ code: 'BucketMismatch', item, bucket, expected: null, reason: '判据正文里没有这个检查项' });
    }
  }

  // 5) 共享项：定义只许一处 + 引用方须有指针
  findings.push(...checkSharedBodies(carriers));

  return { ok: findings.length === 0, findings };
}

// 测试从 ./check-buckets.mjs import BUCKETS（与 plan Step 1 测试代码一致），故在此 re-export
export { BUCKETS };
