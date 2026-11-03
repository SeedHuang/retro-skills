// PRD V5 的验收命令：悬空 0 / 无嵌套 / 15 席 12 键全量（exit 1）。不进 npm run check 的门禁段——
// 理由见 spec §10.2.6：loader 在 import 期 fail-closed，29 条 import 已兜底。
import { loadSeatData } from './components/seatLoader.mjs'
import { CARD_KEYS, buildCards } from './components/cardPipeline.mjs'

try {
  const { agentData } = loadSeatData()   // 悬空 / 嵌套 / 席文件 8 键：loader 内已 fail-closed 抛错
  const built = buildCards()             // 12 键只在 buildOne 派生，必须在消费点判（spec §10.1 R2）
  const bad = built.filter((b) => {
    const keys = Object.keys(b.card || {})
    return keys.length !== CARD_KEYS.length || CARD_KEYS.some((k) => !keys.includes(k))
  })
  if (bad.length) { console.log(`check-shared-refs: keySet12 ${bad.length} bad => fail`); process.exit(1) }
  console.log(`check-shared-refs: seats ${agentData.length} / dangling 0 / nested 0 / keySet8 ${agentData.length} / keySet12 ${built.length} => ok`)
} catch (e) {
  console.log(`check-shared-refs: ${e.code} ${e.key ?? e.name ?? ''} => fail`)
  process.exit(1)
}
