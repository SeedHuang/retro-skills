// validateAgentData（§6 断言 1–15）：数据层查字段（纯数据），输出层 frontmatter 由 gate 逐字节兜底。
import { patternRegistry, resolveDomain, tierOf, toolsForSeat } from './patternRegistry.mjs';
// S4（spec §10-D12 / :225）：S1 的 36 个脚本码 + 3 个合并码归 exit 1——从 S1 码表**派生**，不抄第二份名单。
// `WeakReason` 是 manual 码、不在 `CARD_MODEL_CODES`（S1 V-5），故天然不入表（`S4-TC-F10` 正断言「未知错误码」）。
import { CARD_MODEL_CODES } from '../card-model/validateCardModel.mjs';
import { MERGE_CODES } from '../card-model/merge.mjs';

const S1_EXIT1 = [...Object.keys(CARD_MODEL_CODES), ...Object.values(MERGE_CODES)];

const EXIT = {
  0: [],
  1: ['MissingSlot', 'MissingPlaceholder', 'InvalidRuleType', 'TemplateSyntaxError',
    'TemplateHardcoded', 'ImpureRender', 'Mismatch', 'DuplicateAgentName', 'InvalidName',
    'FrontmatterFieldMissing', 'ToolsViolation', 'SharedBlockMissing', 'WhenFormatViolation',
    'DescriptionDerivation', 'TriggerMissingRoute', 'TriggerConflict', 'DuplicateWhen',
    'InvalidOutputKind', 'MissingWhen', 'DraftDrift', 'DraftNameConflict', 'TargetDrift',
    'TriggerFieldMisplaced',
    // S6 配置校验五码（spec §7）：唯一发射点 = `components/validatePolicy.mjs`；
    // 第六码 `RenderNotEquivalent` 由施工期断言发出、**不进本表**（CLI 不引入）
    'UnknownPolicyRef', 'LiteralInConfig', 'SeatNameInDefinition', 'ForbiddenGroupGranted',
    'TemplateImpure',
    // S4 承接 S1（spec §10-D12）：36 个脚本码 + 3 个合并码 → exit 1
    ...S1_EXIT1],
  2: ['UnregisteredHandwritten', 'InvalidBaseline', 'InvalidBaselinePath', 'DanglingBaselineEntry',
    'BaselineDrift', 'EnvironmentEOL', 'InvalidInputPath', 'InvalidOutputPath',
    'MissingComponentData', 'UnsupportedKind', 'StateFileInvalid', 'GoldenSnapshotUnavailable',
    'EvidenceInvalid', 'InvalidArgs', 'MigrationPhaseClosed'],
  3: ['GeneratedMissing', 'TemplateReadFailed', 'TargetReadFailed', 'WriteFailed', 'DraftNotFound', 'DraftWriteFailed'],
  4: ['NotAuthorized', 'UnapprovedChange'],
};
export function exitCodeFor(code) {
  for (const [exit, codes] of Object.entries(EXIT)) if (codes.includes(code)) return Number(exit);
  throw new Error(`未知错误码：${code}（须先落 §7 映射表）`);
}
function fail(code, fields = {}) { const e = new Error(code); e.code = code; Object.assign(e, fields); e.exitCode = exitCodeFor(code); throw e; }
const NAME_RE = /^[a-z][a-z0-9-]{0,49}$/;

export function validateAgentData(data, table) {
  // 断言 1：name 合法 + 唯一
  const seen = new Set();
  for (const a of data) {
    if (!NAME_RE.test(a.name)) fail('InvalidName', { name: a.name });
    if (seen.has(a.name)) fail('DuplicateAgentName', { name: a.name });
    seen.add(a.name);
  }
  // 断言 1b：数据层不得含独立 description（S2 §3 / S1 R13）
  for (const a of data) if ('description' in a) fail('DescriptionDerivation', { name: a.name });
  // 断言 3：name / tools 必填（when 存在性归断言 14）
  for (const a of data) {
    if (!a.name || (Array.isArray(a.tools) && a.tools.length === 0) || !a.tools) fail('FrontmatterFieldMissing', { name: a.name });
  }
  // 断言 4：tools 按席分档（档位由 toolsForSeat 单源给出，席位数与档位数一律派生、不写死）
  // 须为数组且允许集 ⊆ 实际 且 实际 ⊆ 允许集（恰等，I5/J1 fix）
  for (const a of data) {
    const allowed = toolsForSeat(a.name);
    if (!Array.isArray(a.tools) || !allowed.every((t) => a.tools.includes(t)) || !a.tools.every((t) => allowed.includes(t))) fail('ToolsViolation', { name: a.name });
  }
  // 断言 5：sharedBlock 引用枚举 + 同引用枚举同值（无 sharedBlock 席不渲染由渲染层处理）
  const byEnum = new Map();
  for (const a of data) {
    if (a.sharedBlock === undefined) continue;
    if (!patternRegistry.sharedBlock.has(a.sharedBlock)) fail('SharedBlockMissing', { name: a.name, value: a.sharedBlock });
    const key = `${a.sharedBlock}`;
    if (!byEnum.has(key)) byEnum.set(key, a.sharedBlock);
  }
  // 断言 7：when 格式（对已拆槽席）
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.when === undefined) continue; // registered 未拆槽豁免
    if (/在[^。]*中担任|时调用/.test(t.when) || t.when.endsWith('时')) fail('WhenFormatViolation', { name, when: t.when });
  }
  // 断言 8：description 派生 + 时时（对已拆槽**且未迁移**的席）
  // domain 一致性（C5 ②）：声明了 domain 就必须是非空字符串，且派生出的 description 真的包含它。
  // 不用 includes('') 这类恒真写法——空串 / 全空格 / 非字符串一律判 DescriptionDerivation。
  // S4（spec §10-D3）：已迁移席的新卡 `description` = `trigger.when` 直出（不再派生「在…中担任…」），
  // 该形态由 `S4-TC-C01` 断，本断言只管未迁移席（过渡期新旧共存，spec §8 逐席滚动）。
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.when === undefined) continue;
    const a = data.find((x) => x.name === name);
    if (a && a.card) continue;
    const derived = a && a.outputKind === 'testcase'
      ? patternRegistry.description.handwritten(a.role, t.when, t.notWhen?.text ?? '')
      : patternRegistry.description.parliament(a.role, t.when, resolveDomain(a));
    if (derived.includes('时时')) fail('DescriptionDerivation', { name, derived });
    if (a && 'domain' in a) {
      if (typeof a.domain !== 'string' || a.domain.trim() === '') {
        fail('DescriptionDerivation', { name, domain: a.domain });
      }
      if (!derived.includes(a.domain.trim())) fail('DescriptionDerivation', { name, domain: a.domain, derived });
    }
  }
  // 断言 9：route 唯一且存在
  const routes = new Set();
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.route === undefined) continue;
    if (!seen.has(t.route)) fail('TriggerMissingRoute', { name, route: t.route });
    if (routes.has(t.route)) fail('TriggerConflict', { name, route: t.route });
    routes.add(t.route);
  }
  // 断言 10：when 集合两两唯一
  const whens = new Set();
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.when === undefined) continue;
    if (whens.has(t.when)) fail('DuplicateWhen', { name, when: t.when });
    whens.add(t.when);
  }
  // 断言 11：outputKind 枚举
  for (const a of data) if (!patternRegistry.outputKind.has(a.outputKind)) fail('InvalidOutputKind', { name: a.name, value: a.outputKind });
  // 断言 12：notWhen.refs ⊆ 键集
  for (const [name, t] of Object.entries(table)) {
    if (t && t.notWhen && Array.isArray(t.notWhen.refs)) {
      for (const r of t.notWhen.refs) if (!seen.has(r)) fail('TriggerConflict', { name, ref: r });
    }
  }
  // 断言 13：fallback vacuous（未声明合法；声明须 true 且 route ∈ 键集）
  for (const [name, t] of Object.entries(table)) {
    if (!t || t.fallback === undefined) continue;
    if (t.fallback !== true || !seen.has(t.route)) fail('TriggerMissingRoute', { name });
  }
  // 断言 14：每 agent ≥1 when（已拆槽席）
  for (const a of data) {
    const t = table[a.name];
    if (t === undefined) continue; // registered 未拆槽豁免
    if (!t.when) fail('MissingWhen', { name: a.name });
  }
  // 断言 15：条目不得含四键（when / notWhen / route / fallback 只住 triggerTable），且键集不超白名单
  // 普通席 8 键 + 三个可选槽位键（domain / boundary / explorePolicy，C5 ①）；
  // S4：新卡数据落 `card` 键（spec §4 `:80`），迁移期与旧键共存，旧键在 Task 7 收口时删。
  // testcase 席（手写卡模板）另容 heading / sourceLine。identity / fixedList 不要求必填（施工中段骨架合法）
  const BASE_KEYS = ['name', 'role', 'dimension', 'tools', 'identity', 'fixedList', 'sharedBlock', 'outputKind',
    'domain', 'boundary', 'explorePolicy', 'card'];
  const HANDWRITTEN_KEYS = ['heading', 'sourceLine'];
  // 两个槽位字段只允许出现在显式声明它们的席（C5 ④）：其他席一旦带上，渲染会静默换句而不报错。
  // 白名单由 boundaryBySeat 派生（+ evidence-reader 自带的边界句），新增 producer 席时自动跟随。
  const DECLARED_SLOT_SEATS = new Set(['evidence-reader', ...Object.keys(patternRegistry.boundaryBySeat)]);
  for (const a of data) {
    for (const k of ['when', 'notWhen', 'route', 'fallback']) {
      if (k in a) fail('TriggerFieldMisplaced', { name: a.name, key: k });
    }
    const allowed = a.outputKind === 'testcase' ? [...BASE_KEYS, ...HANDWRITTEN_KEYS] : BASE_KEYS;
    const extra = Object.keys(a).filter((k) => !allowed.includes(k));
    if (extra.length) fail('TriggerFieldMisplaced', { name: a.name, extra });
    if (('boundary' in a || 'explorePolicy' in a) && !DECLARED_SLOT_SEATS.has(a.name)) {
      fail('DescriptionDerivation', { name: a.name, reason: '未声明槽位的席不得带 boundary / explorePolicy' });
    }
    // 两个槽位字段的值域（与 domain 的处理对齐）：写错会静默改卡面，而机器检查只判节名存在
    if ('boundary' in a && (typeof a.boundary !== 'string' || a.boundary.trim() === '')) {
      fail('DescriptionDerivation', { name: a.name, key: 'boundary', value: a.boundary });
    }
    // producer 席缺 boundary（删键）/ 空串 / 全空格一律判错，不得静默退回 DEFAULT_BOUNDARY（spec §5 / D3）
    if (tierOf(a.name) === 'producer' && (typeof a.boundary !== 'string' || a.boundary.trim() === '')) {
      fail('DescriptionDerivation', { name: a.name, key: 'boundary', reason: 'producer 席必须声明非空 boundary' });
    }
    if ('explorePolicy' in a && !['none', 'full'].includes(a.explorePolicy)) {
      fail('DescriptionDerivation', { name: a.name, key: 'explorePolicy', value: a.explorePolicy });
    }
  }
  return { ok: true };
}
