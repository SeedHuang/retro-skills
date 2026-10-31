// 15 席共用动作（spec §4 :91）：旧卡的「共享特质」+「通用纪律」逐句上移到这里，卡面里变成**派生物**。
// 一条判据意图只写一次；15 席通过 `SHARED_USE` 白名单取用，本席要改某条 → 走 S1 `mergeActions` 的覆盖（必带 reason）。
// 判据 id（`criterion`）在本文件**每条只出现 1 次**（`S4-TC-E01` 按源码计数）。
// 触发三键一律用 S1 的**封闭枚举 id**（`enums.mjs`：scene / moment / repeat）；label 只在渲染时查表翻译。
const TRIGGER = Object.freeze({ scene: 'deliverable', moment: 'end', repeat: 'per-round' })

export const SHARED_MUST = Object.freeze([
  Object.freeze({
    id: 'shared.impartial-long-term',
    kind: 'must',
    trigger: TRIGGER,
    objects: Object.freeze(['deliverable.body']),
    criterion: 'impartial-long-term',
    landing: 'deliverable.body',
    requires: Object.freeze([]),
  }),
  Object.freeze({
    id: 'shared.evidence',
    kind: 'must',
    trigger: TRIGGER,
    objects: Object.freeze(['deliverable.evidence']),
    criterion: 'evidence-recomputable',
    landing: 'deliverable.body',
    requires: Object.freeze([]),
  }),
  Object.freeze({
    id: 'shared.plain-expression',
    kind: 'must',
    trigger: TRIGGER,
    objects: Object.freeze(['deliverable.body']),
    criterion: 'plain-expression',
    landing: 'deliverable.body',
    requires: Object.freeze([]),
  }),
  Object.freeze({
    id: 'shared.no-fake-problem',
    kind: 'must',
    trigger: TRIGGER,
    objects: Object.freeze(['deliverable.body']),
    criterion: 'no-fake-problem',
    landing: 'deliverable.body',
    requires: Object.freeze([]),
  }),
])

export const SHARED_NEVER = Object.freeze([
  Object.freeze({
    id: 'shared.no-issue-without-fix',
    kind: 'never',
    trigger: TRIGGER,
    objects: Object.freeze(['issue.card.suggestion']),
    criterion: 'issue-without-solution',
    landing: 'issue.card.suggestion',
    requires: Object.freeze([]),
  }),
  Object.freeze({
    id: 'shared.no-self-disposal',
    kind: 'never',
    trigger: TRIGGER,
    objects: Object.freeze(['deliverable.body']),
    criterion: 'out-of-scope-self-disposal',
    landing: 'deliverable.body',
    requires: Object.freeze([]),
  }),
  Object.freeze({
    id: 'shared.no-blank-evidence',
    kind: 'never',
    trigger: TRIGGER,
    objects: Object.freeze(['deliverable.evidence']),
    criterion: 'blank-evidence',
    landing: 'deliverable.body',
    requires: Object.freeze([]),
  }),
  Object.freeze({
    id: 'shared.no-proxy-fill',
    kind: 'never',
    trigger: TRIGGER,
    objects: Object.freeze(['deliverable.body']),
    criterion: 'proxy-fill',
    landing: 'deliverable.body',
    requires: Object.freeze([]),
  }),
])

// 白名单：只有出现在这里的席才合并这些共享句；未出现的席 = 零共享句（不是「默认全量」）。
const ALL_SHARED = Object.freeze(SHARED_MUST.concat(SHARED_NEVER).map((a) => a.id))

export const SHARED_USE = Object.freeze({
  'reviewer-audit': ALL_SHARED,
  'reviewer-product': ALL_SHARED,
  'reviewer-interaction': ALL_SHARED,
  'reviewer-ui': ALL_SHARED,
  'reviewer-frontend': ALL_SHARED,
  'reviewer-backend': ALL_SHARED,
  'reviewer-ops': ALL_SHARED,
  'reviewer-qa': ALL_SHARED,
  'reviewer-ai': ALL_SHARED,
  'reviewer-security': ALL_SHARED,
  'reviewer-actuary': ALL_SHARED,
  'reviewer-reader': ALL_SHARED,
  'detective-observer': ALL_SHARED,
  'evidence-reader': ALL_SHARED,
  'senior-sdet': ALL_SHARED,
})
