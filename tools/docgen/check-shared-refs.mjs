// PRD V5 的验收命令：悬空 0 / 无嵌套 / 15 席 12 键全量（exit 1）。不进 npm run check 的门禁段——
// 理由见 spec §10.2.6：loader 在 import 期 fail-closed，29 条 import 已兜底。
// 加载必须走**动态 import**：`cardPipeline` 的模块图会触发 `agentData` 的 `loadSeatData()`，
// 静态 import 的话坏数据在 import 期就抛，本文件的 catch 永远接不到 → 输出只剩堆栈、丢了「码 / 键 / 席」三样。
try {
  const { loadSeatData } = await import('./components/seatLoader.mjs')
  const { CARD_KEYS, buildCards } = await import('./components/cardPipeline.mjs')
  const { agentData } = loadSeatData()   // 悬空 / 嵌套 / 席文件 8 键：loader 内已 fail-closed 抛错
  const built = buildCards()             // 12 键只在 buildOne 派生，必须在消费点判（spec §10.1 R2）
  const bad = built.filter((b) => {
    const keys = Object.keys(b.card || {})
    return keys.length !== CARD_KEYS.length || CARD_KEYS.some((k) => !keys.includes(k))
  })
  if (bad.length) { console.log(`check-shared-refs: keySet12 ${bad.length} bad => fail`); process.exit(1) }
  console.log(`check-shared-refs: seats ${agentData.length} / dangling 0 / nested 0 / keySet8 ${agentData.length} / keySet12 ${built.length} => ok`)
} catch (e) {
  // 失败行必须能点名「码 + 键 + 席」三样（TC-011 判据要求三者各命中 ≥1）：seat 只在键之后补，键缺席时退化为席名
  const where = [e.key ? `key ${e.key}` : '', e.seat ? `seat ${e.seat}` : '', !e.key && !e.seat ? (e.name ?? '') : '']
    .filter(Boolean).join(' / ')
  console.log(`check-shared-refs: ${e.code} ${where} => fail`)
  process.exit(1)
}
