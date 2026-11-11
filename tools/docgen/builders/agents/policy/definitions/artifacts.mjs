// 产物归属（spec §3.2）：只描述「谁拥有」，不描述「谁能写」；`owner` 与配置层的可写清单语义不同、不互校。
// `progress.md` 的归属是议长（`host`），必须同时带 `host: true`（哨兵，spec §3.5 不变量 3 例外①）。
export const artifacts = {
  'round-check.md': { owner: 'reviewer-audit' },
  'delivery-audit.md': { owner: 'reviewer-audit' },
  'detective.md': { owner: 'detective-observer' },
  'evidence.md': { owner: 'evidence-reader' },
  // 同 outputKind 多席共写一份，按 `outputs.items[].section` 分节；`owner` 只记主归属（第二席不落本文件）
  'defense.md': { owner: 'respondent-architect', note: '同档另一席同写，按 section 分节' },
  'issue-card.md': { owner: 'reviewer-actuary', note: '同档另一席同写，按 section 分节' },
  'progress.md': { owner: 'host', host: true },
};
