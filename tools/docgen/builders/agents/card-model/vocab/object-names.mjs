// objects / repeats 的中文名表（spec §3 落点 #2 / §4 D6）。
// 键集 = 15 卡实际取值的并集（双向相等，`S2-TC-A08`：漏一个 = 渲染退化英文、多一个 = 名表漂移），
// 值 = 卡面渲染的中文名。取值口径与 `vocab/landings.mjs` 的落点中文名对齐（同一宾语在两处必须同叫法）。
export const OBJECT_NAMES = Object.freeze({
  'deliverable.appendix': '交付物附录',
  'deliverable.body': '交付物正文',
  'deliverable.evidence': '交付物证据',
  'issue.card.suggestion': '问题卡「建议解法」栏',
})

// 键集 = 15 卡 `trigger.repeat` 实际取值的并集（键面同 `enums.mjs` 的 `REPEATS`，值 = 中文频度）
export const REPEAT_NAMES = Object.freeze({
  'per-round': '每轮',
})
