// 产物归属（spec §3.2）：只描述「谁拥有」，不描述「谁能写」；`owner` 与配置层的可写清单语义不同、不互校。
// `progress.md` 的归属是主持人（`host`），必须同时带 `host: true`（哨兵，spec §3.5 不变量 3 例外①）。
export const artifacts = {
  'round-check.md': { owner: 'reviewer-audit' },
  'delivery-audit.md': { owner: 'reviewer-audit' },
  'detective.md': { owner: 'detective-observer' },
  'progress.md': { owner: 'host', host: true },
};
