// 配置层（spec §3.3）：**零字符串**——只出现 capability 名、允许组 ID、artifacts 文件名 ID。
// 对象键 = 席 slug；未登记的席一律走 `__default__`（等价 defaultTier = readOnly，spec:71）。
// 读配置侧一律 `Object.hasOwn`（`__proto__` / `constructor` 键回落 `__default__`，spec:131）。
export const SEAT_POLICY = {
  'reviewer-audit':     { capabilities: ['read','write','exec'], allowGroups: ['git.read','tool.time','audit.lookup'], artifacts: ['round-check.md','delivery-audit.md'] },
  'detective-observer': { capabilities: ['read','write','exec'], allowGroups: ['git.read','tool.time'],           artifacts: ['detective.md'] },
  'senior-sdet':        { capabilities: ['read','write'],        allowGroups: [],                                artifacts: [] },
  'speaker':            { capabilities: ['read','write','exec'], allowGroups: ['tool.time'],                       artifacts: ['progress.md'] },
  'respondent-dev':     { capabilities: ['read','write','exec'], allowGroups: ['git.read','tool.time'],           artifacts: ['defense.md'] },
  'respondent-architect': { capabilities: ['read','write'],       allowGroups: [],                                  artifacts: ['defense.md'] },
  'evidence-reader':    { capabilities: ['read','write'],        allowGroups: [],                                  artifacts: ['evidence.md'] },
  'reviewer-actuary':   { capabilities: ['read','write'],        allowGroups: [],                                  artifacts: ['issue-card.md'] },
  'reviewer-ai':        { capabilities: ['read','write'],        allowGroups: [],                                  artifacts: ['issue-card.md'] },
  __default__:          { capabilities: ['read'],                allowGroups: [],                                  artifacts: [] },
};
