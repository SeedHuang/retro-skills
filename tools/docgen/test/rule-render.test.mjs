// rule 渲染物：与 agent 卡同一套「数据 → 渲染 → 逐字节」机制（阶段 2 收口）
// 判据：数据是唯一真源；手改正文 1 字节 → gate Mismatch exit 1；删文件 → DanglingBaselineEntry；
//      改数据不重生成 → 红；`generate --kind rule --name <名> --apply` 重生成后绿。
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { coldRepo, runCli } from './support/card-fixtures.mjs'
import { RENDERED_RULES, renderedRuleAssets } from '../components/renderedAssets.mjs'
import { renderRule } from '../../quality/criteria-engine/rules.mjs'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const NAME = 'evidence-before-conclusion'
const REL = `rules/${NAME}.md`

test('渲染 rule 与磁盘逐字节相等，且非空白字符在 100–500 预算区', () => {
  const rendered = renderRule(NAME)
  assert.equal(rendered, readFileSync(join(REPO, REL), 'utf8'), '渲染结果必须与磁盘逐字节相等')
  const n = rendered.replace(/\s/g, '').length
  assert.ok(n >= 100 && n <= 500, `非空白字符须在 100–500，实得 ${n}`)
})

test('手改 rule 正文 1 字节 → gate Mismatch exit 1 并点名路径', () => {
  coldRepo({
    mutate: (copy) => {
      const p = join(copy, REL)
      writeFileSync(p, `${readFileSync(p, 'utf8')}手改一行\n`, 'utf8')
    },
    verify: (copy, r) => {
      assert.equal(r.code, 1)
      assert.match(r.out, new RegExp(`Mismatch: .*${NAME}\\.md`))
    },
  })
})

test('删 rendered rule → gate DanglingBaselineEntry exit 2', () => {
  coldRepo({
    mutate: (copy) => rmSync(join(copy, REL), { force: true }),
    verify: (copy, r) => {
      assert.equal(r.code, 2)
      assert.match(r.out, new RegExp(`DanglingBaselineEntry: .*${REL}`))
    },
  })
})

test('改数据不重生成 → 红；generate --apply 重生成后绿', () => {
  coldRepo({
    mutate: (copy) => {
      const dataPath = join(copy, 'tools', 'quality', 'criteria-engine', `${NAME}.json`)
      const d = JSON.parse(readFileSync(dataPath, 'utf8'))
      d.title = '改过的标题'
      writeFileSync(dataPath, JSON.stringify(d, null, 2) + '\n', 'utf8')
    },
    verify: (copy, r) => {
      assert.equal(r.code, 1, '改数据不重生成必须红')
      assert.match(r.out, /Mismatch/)
      const w = runCli(['generate', '--kind', 'rule', '--name', NAME, '--apply'], copy)
      assert.equal(w.code, 0, w.out)
      const g = runCli(['gate'], copy)
      assert.equal(g.code, 0, g.out)
    },
  })
})

test('注册表与渲染物清单一致（新增 rule 只加名字 + data）', () => {
  assert.deepEqual(renderedRuleAssets().map((a) => a.name), RENDERED_RULES)
  assert.equal(RENDERED_RULES.includes(NAME), true)
})
