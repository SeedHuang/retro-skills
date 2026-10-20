// check-buckets.test.mjs —— 归桶守卫的 5 类断言（正例 + 4 类非法桶数据负例）
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUCKETS, checkBuckets, itemsFromCriteria, unknownMarkers, CARRIER_FILES, RULE_MARKER_ITEM } from './check-buckets.mjs';
import { readSharedDefinitions, SHARED_MARKERS } from './shared-items.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function cloneBuckets() {
  return BUCKETS.map((b) => ({ name: b.name, items: [...b.items] }));
}
function bucketOf(list, name) {
  return list.find((b) => b.name === name);
}

test('五桶枚举齐全：allShared / 两两 shared ×3 / 独有', () => {
  const names = new Set(BUCKETS.map((b) => b.name));
  assert.ok(names.has('allShared'));
  assert.ok(names.has('agentAndSkillShared'));
  assert.ok(names.has('agentAndRuleShared'));
  assert.ok(names.has('skillAndRuleShared'));
  assert.ok(names.has('rule 独有'));
  assert.ok(names.has('skill 独有'));
  assert.ok(names.has('agent 独有'));
});

test('每检查项机械上恰有一处「当前归属」：零重复 + 归属正确 + 无遗漏', () => {
  const { ok, findings } = checkBuckets();
  assert.equal(findings.filter((f) => f.code === 'DuplicateBucket').length, 0);
  assert.equal(findings.filter((f) => f.code === 'BucketMismatch').length, 0);
  assert.equal(findings.filter((f) => f.code === 'MissingBucket').length, 0);
  assert.equal(findings.filter((f) => f.code === 'BucketNameUnknown').length, 0);
  assert.equal(findings.filter((f) => f.code === 'SharedBodyDuplicated').length, 0);
  assert.equal(findings.filter((f) => f.code === 'SharedPointerMissing').length, 0);
  assert.equal(ok, true, JSON.stringify(findings));
});

test('两两桶当前判定无交集：内容为空', () => {
  const empty = BUCKETS.filter((b) => b.name === 'agentAndSkillShared' || b.name === 'agentAndRuleShared');
  assert.ok(empty.every((b) => b.items.length === 0));
});

test('判据正文里的检查项全部落桶（无遗漏，判据正文侧反查）', () => {
  const items = itemsFromCriteria();
  const all = BUCKETS.flatMap((b) => b.items);
  for (const item of items.keys()) {
    assert.ok(all.includes(item), `判据正文里的检查项未落桶：${item}`);
  }
});

// —— 负例：4 类非法桶数据（对应 TC-004 / TC-005 / TC-006 / TC-008）——

test('TC-004 负例：两两 shared 错并入 allShared → BucketMismatch', () => {
  const buckets = cloneBuckets();
  const shared = bucketOf(buckets, 'skillAndRuleShared');
  const all = bucketOf(buckets, 'allShared');
  all.items.push(shared.items[0]);          // 来源覆盖④ 被塞进 allShared
  shared.items = shared.items.filter((i) => i !== all.items[all.items.length - 1]);
  const { findings } = checkBuckets(buckets);
  const hit = findings.find((f) => f.code === 'BucketMismatch' && f.item === '来源覆盖④');
  assert.ok(hit, '两两 shared 并入 allShared 必须报 BucketMismatch');
  assert.equal(hit.expected, 'skillAndRuleShared');
});

test('TC-005 负例：共享项判定定义行被复制进第二个载体 → SharedBodyDuplicated', () => {
  const defs = readSharedDefinitions();
  const def = defs.get('来源覆盖④');
  assert.ok(def, '权威载体里应能读到 来源覆盖④ 的判定定义行');
  const carriers = {
    [CARRIER_FILES.skill]: [
      '## 适用范围',
      '',
      '（复制粘贴的判定定义行）',
      def,
    ].join('\n'),
  };
  const { findings } = checkBuckets(cloneBuckets(), { carriers });
  const hit = findings.find((f) => f.code === 'SharedBodyDuplicated' && f.item === '来源覆盖④');
  assert.ok(hit, '共享项定义行复制到第二载体必须报 SharedBodyDuplicated');
  assert.ok(hit.sites.includes(CARRIER_FILES.skill));
});

test('TC-006 负例：某类 checklist 缺项 → MissingBucket', () => {
  const buckets = cloneBuckets();
  const agent = bucketOf(buckets, 'agent 独有');
  agent.items = agent.items.filter((i) => i !== 'A6');   // A6 边界声明 从清单里漏掉
  const { findings } = checkBuckets(buckets);
  const hit = findings.find((f) => f.code === 'MissingBucket' && f.item === 'A6');
  assert.ok(hit, '判据正文里有、桶里没有的检查项必须报 MissingBucket');
  assert.equal(hit.expected, 'agent 独有');
});

test('TC-008 负例（独有项误入共享桶 / 共享项降为独有）→ BucketMismatch', () => {
  const buckets = cloneBuckets();
  bucketOf(buckets, 'skillAndRuleShared').items.push('A7');   // 独有项误入共享桶
  const shared = bucketOf(buckets, 'skillAndRuleShared');
  const rule = bucketOf(buckets, 'rule 独有');
  rule.items.push(shared.items.find((i) => i === '来源覆盖④'));   // 共享项降为 rule 独有
  shared.items = shared.items.filter((i) => i !== '来源覆盖④');
  const { findings } = checkBuckets(buckets);
  const wrong = findings.filter((f) => f.code === 'BucketMismatch');
  assert.ok(wrong.some((f) => f.item === 'A7' && f.expected === 'agent 独有'));
  assert.ok(wrong.some((f) => f.item === '来源覆盖④' && f.expected === 'skillAndRuleShared'));
});

test('桶名不在枚举内 → BucketNameUnknown', () => {
  const buckets = cloneBuckets();
  buckets[0].name = '未定义桶';
  const { findings } = checkBuckets(buckets);
  assert.ok(findings.some((f) => f.code === 'BucketNameUnknown' && f.bucket === '未定义桶'));
});

test('引用方载体缺「判据名 + 指向权威定义」指针 → SharedPointerMissing', () => {
  const real = readFileSync(join(ROOT, CARRIER_FILES.skill), 'utf8');
  const stripped = real.replace(/来源覆盖④[^\n]*/g, '');   // 抹掉判据名
  const { findings } = checkBuckets(cloneBuckets(), { carriers: { [CARRIER_FILES.skill]: stripped } });
  assert.ok(findings.some((f) => f.code === 'SharedPointerMissing' && f.item === '来源覆盖④'));
});

// —— G3：判据正文新增标记但归桶索引未登记 → BucketMarkerUnknown（不静默漏过）——

test('G3：rule 判据正文新增 ⑨（映射表未登记）→ BucketMarkerUnknown 报红', () => {
  const real = readFileSync(join(ROOT, CARRIER_FILES.rule), 'utf8');
  const injected = `${real}\n| ⑨ | **新判据⑨** | 判据正文新增的检查项 | 有 1 / 无 0 |\n`;
  const { ok, findings } = checkBuckets(cloneBuckets(), { carriers: { [CARRIER_FILES.rule]: injected } });
  const hit = findings.find((f) => f.code === 'BucketMarkerUnknown' && f.marker === '⑨');
  assert.ok(hit, 'rule 判据集新增 ⑨ 而未更新 RULE_MARKER_ITEM 必须报红，不得静默漏过');
  assert.equal(hit.from, CARRIER_FILES.rule);
  assert.equal(ok, false);
});

test('G3：skill 判据正文新增 ⑤（映射表未登记）→ BucketMarkerUnknown 报红', () => {
  const real = readFileSync(join(ROOT, CARRIER_FILES.skill), 'utf8');
  const injected = `${real}\n### 判据 ⑤：新判据⑤\n\n正文。\n`;
  const { ok, findings } = checkBuckets(cloneBuckets(), { carriers: { [CARRIER_FILES.skill]: injected } });
  const hit = findings.find((f) => f.code === 'BucketMarkerUnknown' && f.marker === '⑤');
  assert.ok(hit, 'skill 规则新增判据 ⑤ 而未更新 SKILL_MARKER_ITEM 必须报红');
  assert.equal(ok, false);
});

test('G3：未知标记不计入判据项（不产生伪 MissingBucket），已知标记仍照常落桶', () => {
  const real = readFileSync(join(ROOT, CARRIER_FILES.rule), 'utf8');
  const injected = `${real}\n| ⑨ | **新判据⑨** | x | 有 1 / 无 0 |\n`;
  const baseline = itemsFromCriteria();
  const after = itemsFromCriteria({ [CARRIER_FILES.rule]: injected });
  assert.equal(after.size, baseline.size, '未知标记不应被当成一个检查项');
  assert.ok(baseline.has('来源覆盖④') && after.has('来源覆盖④'), '已知标记照常映射到归桶项');
  const { findings } = checkBuckets(cloneBuckets(), { carriers: { [CARRIER_FILES.rule]: injected } });
  assert.equal(findings.filter((f) => f.code === 'MissingBucket').length, 0);
});

test('G3：真文件（无注入）未知标记为 0 条', () => {
  assert.deepEqual(unknownMarkers(), []);
});

// —— 单源一致性：共享项编号集合只有 SHARED_MARKERS 一处定义 ——

test('RULE_MARKER_ITEM 里归入 skillAndRuleShared 的编号 = SHARED_MARKERS（不得两处各写一份）', () => {
  const shared = Object.entries(RULE_MARKER_ITEM).filter(([, [, bucket]]) => bucket === 'skillAndRuleShared').map(([m]) => m);
  assert.deepEqual(shared.sort(), [...SHARED_MARKERS].sort());
});

test('readSharedDefinitions 只返回共享项（①②③ 是 rule 独有，不得混入）', () => {
  const items = [...readSharedDefinitions().keys()];
  assert.equal(items.length, SHARED_MARKERS.length);
  for (const item of items) {
    assert.ok(SHARED_MARKERS.some((m) => item.endsWith(m)), `非共享项混入：${item}`);
  }
});
