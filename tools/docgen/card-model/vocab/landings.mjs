// 静态落点登记表（spec §3 :64）：卡面只渲染这里的**字面值 + 变量名**，不渲染运行时值（PRD :233）。
// 与 S1 `LANDING_VARS`（`review.dir` / `round.no`，封闭清单）是两张表：本表登记「写在哪儿」，S1 那张登记「运行时变量」。
// S2 Q6-b（spec §3 #12 / D13）：键 `'progress.md'` → `'review.progress'`（旧键是文件名、又是真题 id，一词两用）；
// **值（渲染文本）一字不改**——卡面仍印「progress.md 正文」，`progress.md` 从此只是渲染文本，不再是登记 id。
export const LANDINGS = Object.freeze({
  'deliverable.body': '交付物正文',
  'deliverable.appendix': '交付物附录',
  'issue.card.suggestion': '问题卡「建议解法」栏',
  'review.progress': 'progress.md 正文',
})
