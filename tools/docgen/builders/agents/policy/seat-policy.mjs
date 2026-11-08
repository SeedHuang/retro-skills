// 配置层（spec §3.3）：**零字符串**——只出现 capability 名、允许组 ID、artifacts 文件名 ID。
// 对象键 = 席 slug；未登记的席一律走 `__default__`（等价 defaultTier = readOnly，spec:71）。
// 读配置侧一律 `Object.hasOwn`（`__proto__` / `constructor` 键回落 `__default__`，spec:131）。
export const SEAT_POLICY = {
  'reviewer-audit':     { capabilities: ['read','write','exec'], allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['round-check.md','delivery-audit.md'] },
  'detective-observer': { capabilities: ['read','write','exec'], allowGroups: ['check.local','git.read','docgen.read'], artifacts: ['detective.md'] },
  'senior-sdet':        { capabilities: ['read','write'],        allowGroups: [],                                  artifacts: [] },
  __default__:          { capabilities: ['read'],                allowGroups: [],                                  artifacts: [] },
};
