// 模式登记册（P2-8）：每个槽位一条模式定义。P2 内只登记不强制翻译闭环。
// 边界句 / 档位表不再在本文件存第二份（spec §3.6）：边界句由 `renderBoundary` 渲染、档位表 re-export `TIERS`。
// 依赖方向：本文件 → 定义层 / 配置层 / 渲染层；`renderBoundary` 不反向 import 本文件（无初始化环）。
import { TIERS, tierOfCapabilities } from '../policy/definitions/tiers.mjs';
import { SEAT_NAMES } from '../policy/definitions/seats.mjs';
import { SEAT_POLICY } from '../policy/seat-policy.mjs';
import { renderBoundary } from './renderBoundary.mjs';

export const DOMAIN = '议会评审';

// 三个默认常量只在这里存一份（spec §7.1 C3）：渲染器与模板一律引用，禁止复制文本。
// 默认值 = 改造前模板现句，故 14 席不带新字段时渲染逐字节不变（spec §7.6，由 gate 兜）。
export const DEFAULT_BOUNDARY = '你是只读评审角色：不得创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。';
export const DEFAULT_EXPLORE = '固定清单之外，针对这份文档和这个项目的具体情况，现场生成 3-5 个你认为最值得问的问题（先写出来，再逐条回答）。只答固定清单 = 不合格。';
export const DEFAULT_EXPLORE_NONE = '本节不适用：本角色只交原文与行号，不出观点、不提问题。';

// ASCII 开头（首字符码 <128）的 role（UI 评委 / AI 评委）在派生式里前置一个空格，与迁移前现卡逐字一致（spec §3 派生式注）
// 谓词与 testcase【DESC】判据同一口径 = 任意 ASCII，不限字母（原先 [A-Za-z] 会让数字开头 role 与判据分歧）
const roleSep = (role) => (typeof role === 'string' && role.charCodeAt(0) < 128 ? ' ' : '');

// domain 归一化的唯一实现（spec §7.3）：`??` 拦不住空串与全空格，非字符串会被隐式转换。
// 回落值引用 DOMAIN 常量、不内联字面量（否则改 DOMAIN 时卡面不变，TC-D06 会抓出冲突）。
export function resolveDomain(agent) {
  const d = typeof agent?.domain === 'string' ? agent.domain.trim() : '';
  return d || DOMAIN;
}

// 席名 → 边界句（只登记显式声明槽位的席；其余席走 DEFAULT_BOUNDARY）。
// 值 = `renderBoundary(席)` 的渲染结果（spec §3.6：本文件不再持散文副本）；
// 单独导出是为了让 agentData 的 map 直接按席取句（spec §5），registry 内引用同一对象（不是第二份表）
export const boundaryBySeat = {
  'reviewer-audit': renderBoundary('reviewer-audit'),
  'detective-observer': renderBoundary('detective-observer'),
};

// 席名 → 档位名（唯一来源 = `SEAT_POLICY` 的 capabilities，spec §3.6）：由 `SEAT_NAMES` 逐席派生，
// **不含 `__default__`**（未登记的席仍走 defaultTier）。不再手写第二份映射。
export const tierBySeat = Object.fromEntries(
  SEAT_NAMES.map((s) => [s, tierOfCapabilities(SEAT_POLICY[s].capabilities)]),
);

export const patternRegistry = {
  description: {
    parliament: (role, when, domain = DOMAIN) => `在${domain}中担任${roleSep(role)}${role}。${when}时调用`,
    handwritten: (identity, when, notWhen) => `${identity}。${when}时调用。Do not use for ${notWhen}。`,
  },
  identityMaster: '资深{role}，对{dim1}与{dim2}有经验直觉',
  // 档位表 = `tiers.mjs` 的**同一对象引用**（spec §3.2：re-export，不深拷贝、不改名）
  tools: TIERS,
  // 席名 → 档位名（派生，spec §3.6）
  tierBySeat,
  defaultTier: 'readOnly',
  boundaryBySeat,
  outputKind: new Set(['issue-card', 'observation', 'audit', 'testcase', 'evidence']),
  sharedBlock: new Set(['SIX_METHODS', 'DETECTIVE_RULES', 'AUDIT_RULES']),
};

// 按席取档位名：必须用 Object.hasOwn 判自有键——`constructor` 能过 NAME_RE，
// 直接取值会命中原型链，令 toolsForSeat 返回 undefined（spec §3.2）
export function tierOf(name) {
  return Object.hasOwn(patternRegistry.tierBySeat, name)
    ? patternRegistry.tierBySeat[name]
    : patternRegistry.defaultTier;
}

// 按席取工具数组：返回档位数组本身（共享引用，调用方不得就地 push / sort）。
// 档位值写错时不给运行时静默兜底——由测试「tierBySeat 每个值 ∈ tools 键」在 CI 拦（spec §3.2）
export function toolsForSeat(name) {
  return patternRegistry.tools[tierOf(name)];
}
