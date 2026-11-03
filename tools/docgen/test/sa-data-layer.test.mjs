// S-A 数据层用例落点（TC-001…TC-030）。本文件由 plan 逐任务追加，不要一次写满。
// 编写者：主 agent（施工者本人）；本文件是常驻测试、不是 testcase 文件，不受独立编写义务约束。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'

const DATA = 'tools/docgen/data'
const SEATS = `${DATA}/seats`

test('TC-001 数据源按席拆成 data/seats/<seat>.json（一席一文件）+ data/shared.json（1 份）', () => {
  const dirs = readdirSync(DATA, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
  assert.deepEqual(dirs, ['seats'], 'data/ 下一级只能有 seats 一个目录')
  // 一席一文件：先取全部条目，非 `.json` 的（含子目录）一律算违规——只按 `.json` 过滤会让散文件静默通过
  const entries = readdirSync(SEATS, { withFileTypes: true })
  const strays = entries.map((d) => d.name).filter((n) => !n.endsWith('.json'))
  assert.deepEqual(strays, [], `seats/ 只许 <seat>.json，实有多余条目：${strays.join('、')}`)
  const files = entries.filter((d) => d.isFile() && d.name.endsWith('.json'))
    .map((d) => d.name.replace(/\.json$/, '')).sort()
  const shared = JSON.parse(readFileSync(`${DATA}/shared.json`, 'utf8'))
  assert.deepEqual(Object.keys(shared).sort(),
    ['cardRationaleHead', 'cardRationaleTail', 'dutyConstraintDefault'], 'shared.json 恰 3 键')
  // 席名与 agentData 逐字相等（旧入口仍在，故可就地比对）；席数一律派生，不写席位数字面量
  // （`dev-workflow-counts.test.mjs` 的 `counterProbes` 会扫 `tools/docgen/test/*.test.mjs` 的 assert 行）
  return import('../components/agentData.mjs').then(({ agentData }) => {
    const names = agentData.map((a) => a.name).sort()
    assert.equal(files.length, names.length, `席文件数与 agentData 席数不等：${files.length} vs ${names.length}`)
    assert.deepEqual(files, names, '席文件名必须与 agentData 席名集逐字相等')
  })
})
