// F-24 存量 15 张角色卡豁免窗口登记件（纯函数，无 IO）。
// 到期 = S4 首次重生成落地时把 EXPIRY_LANDED 置 true（spec §11.8）；本文件不校验 agents/*.md 内容（R7）。
export const EXEMPT_CARDS = [
  'agents/detective-observer.md',
  'agents/evidence-reader.md',
  'agents/reviewer-actuary.md',
  'agents/reviewer-ai.md',
  'agents/reviewer-audit.md',
  'agents/reviewer-backend.md',
  'agents/reviewer-frontend.md',
  'agents/reviewer-interaction.md',
  'agents/reviewer-ops.md',
  'agents/reviewer-product.md',
  'agents/reviewer-qa.md',
  'agents/reviewer-reader.md',
  'agents/reviewer-security.md',
  'agents/reviewer-ui.md',
  'agents/senior-sdet.md',
];

export const EXPIRY_EVENT = 's4-first-regeneration';

// S4 首次重生成已在 2026-10-31 落地（15 席全迁新卡 + 旧模板退场）→ 唯一开关置 true
export const EXPIRY_LANDED = true;

// 名单内且窗口未到期 → 只告警；名单外、或窗口已到期 → 阻断。
// landed 只供测试注入（生产不传，Q9 spec:208）。
export function disposeCardFindings(findings, { landed = EXPIRY_LANDED } = {}) {
  const warnings = [];
  const blockers = [];
  for (const f of findings ?? []) {
    if (EXEMPT_CARDS.includes(f.file) && !landed) warnings.push(f);
    else blockers.push(f);
  }
  return { warnings, blockers };
}
