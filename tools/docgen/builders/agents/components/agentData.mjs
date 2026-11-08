// 薄壳（S-A 数据层）：数据源已迁 tools/docgen/data/**，装配在 components/seatLoader.mjs。
// 保留本文件是为了 29 条既有 import 的导出面不变；**必须先 import 再 export**（本地绑定的写法是
// card-render 的 INJECT_BAD 所需，纯再导出会让追加语句 ReferenceError，spec §10.2.5 第 7 步）。
import { loadSeatData } from './seatLoader.mjs'

const { agentData, triggerTable } = loadSeatData()

export const AGENT_KINDS = { rule: 'rule', agent: 'agent' }
export { agentData, triggerTable }
