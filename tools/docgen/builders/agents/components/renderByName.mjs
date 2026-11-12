// renderByName —— 单席渲染入口（P5：数据源 = `tools/agent-model/models/<seat>-model.json`）。
// 旧 `agentData` / `cardPipeline` / `triggerTable` 分支已随 P5 退场；本文件只做名字断言 + 委派模型渲染。
import { renderSeatText, isSeat, validateSeatModel } from '../../../../agent-model/source.mjs'
import { exitCodeFor } from './exitCodes.mjs'

function fail(code, fields = {}) {
  const e = new Error(fields.message ?? code)
  e.code = code
  Object.assign(e, fields)
  e.exitCode = exitCodeFor(code)
  throw e
}

export function renderByName(name) {
  if (!isSeat(name)) fail('MissingComponentData', { name, reason: '模型目录无此席（models/<seat>-model.json）' })
  const v = validateSeatModel(name)
  if (!v.ok) fail('UnverifiableOutput', { name, message: `${name}: 模型校验失败 ${v.issues[0]}` })
  return renderSeatText(name)
}
