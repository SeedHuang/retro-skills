import test from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { modelWithShared } from '../source.mjs'
import { renderBoundary } from '../../../builders/agents/components/renderBoundary.mjs'
import { SIGNOFF_LEDGER } from '../../../builders/agents/policy/definitions/paths.mjs'
import { ignoredArtifacts, matchesPattern } from '../../../builders/agents/components/ignoredPaths.mjs'

// 边界写禁则可测化（2026-11-13）：
// ① 签字账禁写来自策略定义层，不再藏在模板字面量里；
// ② 允许写路径不得命中签字账模板；
// ③ .gitignore 兜底的例外句只在允许产物真被忽略时出现（数据驱动，不是手写散文）。
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..')
const MODELS = join(ROOT, 'tools', 'docgen', 'models', 'agents', 'jsons')
const TPL = readFileSync(join(ROOT, 'tools/docgen/builders/agents/templates/boundary.md.tpl'), 'utf8')
const seats = readdirSync(MODELS, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
  .map((e) => e.name)
  .filter((seat) => modelWithShared(seat).boundary?.kind === 'policy')

const globRe = (p) => new RegExp('^' + p
  .replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*/g, '.*')
  .replace(/\*/g, '[^/]*') + '$')
const artifactPaths = (m) => {
  const ids = m.permissions?.write?.allow ?? []
  const forms = m.forms ?? {}
  return ids.map((id) => forms[id]?.path).filter((p) => typeof p === 'string' && p !== '')
}

test('签字账规则登记在策略层且字段完整', () => {
  assert.equal(SIGNOFF_LEDGER.id, 'signoffLedger')
  assert.match(SIGNOFF_LEDGER.template, /gate-record\.md$/)
  assert.ok(SIGNOFF_LEDGER.label.trim() !== '' && SIGNOFF_LEDGER.reason.trim() !== '')
})

test('模板不再持有签字账字面量（由 WRITE_FORBID 槽渲染）', () => {
  assert.ok(!TPL.includes('docs/devworkflows'), '模板仍硬编码签字账路径')
  assert.ok(TPL.includes('{{WRITE_FORBID}}'), '模板缺 WRITE_FORBID 槽')
  assert.ok(TPL.includes('{{WRITE_FALLBACK}}'), '模板缺 WRITE_FALLBACK 槽')
})

test('允许写路径不得命中签字账模板（逐席）', () => {
  const forbidden = globRe(SIGNOFF_LEDGER.template)
  for (const seat of seats) {
    for (const p of artifactPaths(modelWithShared(seat))) {
      assert.ok(!forbidden.test(p), `${seat}：允许产物 ${p} 命中禁写模板 ${SIGNOFF_LEDGER.template}`)
    }
  }
})

test('.gitignore 兜底：例外句只在允许产物真被忽略时出现（数据驱动）', () => {
  let hit = 0
  for (const seat of seats) {
    const m = modelWithShared(seat)
    const ignored = ignoredArtifacts(m)
    const text = renderBoundary(seat, m)
    const hasException = text.includes('（「权限」段允许的产物除外）')
    assert.equal(hasException, ignored.length > 0, `${seat}：例外句与 gitignore 命中不一致`)
    if (ignored.length > 0) {
      hit += 1
      // 被忽略的路径必须确实是本席允许产物（例外只覆盖允许项）
      const allowed = artifactPaths(m).map((p) => p.replace(/\{[^}]+\}/g, 'x'))
      for (const p of ignored) assert.ok(allowed.includes(p), `${seat}：例外覆盖了非允许产物 ${p}`)
    }
  }
  assert.ok(hit > 0, '没有任何席位命中 gitignore，测试失去判别力')
})

test('签字账禁写与 .gitignore 兜底均渲染到卡面', () => {
  for (const seat of seats) {
    const text = renderBoundary(seat, modelWithShared(seat))
    assert.ok(text.includes(`不得写 \`${SIGNOFF_LEDGER.template}\`（${SIGNOFF_LEDGER.reason}）。`), seat)
    assert.ok(text.includes('兜底：凡 `.gitignore` 覆盖的路径一律视为禁止写入'), seat)
    assert.ok(!text.includes('你只核转录'), `${seat}：转录职责仍重复写在边界段`)
  }
})

test('.gitignore 匹配器：目录项 / 任意层级 / 文件名模式', () => {
  assert.equal(matchesPattern('.session/reviews/x/round-check.md', '.session/'), true)
  assert.equal(matchesPattern('docs/x/ledger.md', '**/ledger.md'), true)
  assert.equal(matchesPattern('a/b.local.md', '*.local.md'), true)
  assert.equal(matchesPattern('docs/devworkflows/t/gate-record.md', '.session/'), false)
})
