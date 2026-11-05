// 判据引擎校验器自测（阶段 2 V-16）：每条 impl=script 判据都要能「注入冲突样例 → exit 1 并点名」
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CLI = join(REPO, 'scripts', 'check-criteria-engine.mjs')

function copyRoot() {
  const root = mkdtempSync(join(tmpdir(), 'ce-root-'))
  mkdirSync(join(root, 'rules'), { recursive: true })
  cpSync(join(REPO, 'rules'), join(root, 'rules'), { recursive: true })
  cpSync(join(REPO, 'tools', 'quality'), join(root, 'tools', 'quality'), { recursive: true })
  return root
}

test('V-16：逐条判据注入冲突样例 → 校验器 exit 1 并点名该判据', () => {
  const ruleFiles = readdirSync(join(REPO, 'tools', 'quality', 'criteria-engine'))
    .filter((n) => n.endsWith('.json') && !n.endsWith('.testcase.json'))
  assert.ok(ruleFiles.length >= 4, '引擎里至少 4 条判据（3 条试点 + 触发声明判痕）')
  for (const f of ruleFiles) {
    const root = copyRoot()
    try {
      const id = JSON.parse(readFileSync(join(root, 'tools', 'quality', 'criteria-engine', f), 'utf8')).id
      const tcPath = join(root, 'tools', 'quality', 'criteria-engine', `${id}.testcase.json`)
      const tc = JSON.parse(readFileSync(tcPath, 'utf8'))
      // 注入冲突：把第一条正例的期望翻成反例（判据判 pass → 期望 fail）
      tc.cases[0].expect = tc.cases[0].expect === 'pass' ? 'fail' : 'pass'
      writeFileSync(tcPath, JSON.stringify(tc, null, 2) + '\n', 'utf8')
      const r = spawnSync(process.execPath, [CLI, '--root', root], { encoding: 'utf8' })
      assert.equal(r.status, 1, `${id}：注入冲突后必须 exit 1，实得 ${r.status}（${r.stdout}${r.stderr}）`)
      assert.match(`${r.stdout}${r.stderr}`, new RegExp(`${id}\\.testcase\\.json`), `${id}：必须点名冲突测试文件`)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test('载体正文（carriers/）：引用不存在的判据 → 红；手改正文 → CarrierProjectionDrift', () => {
  const root = copyRoot()
  try {
    const cPath = join(root, 'tools', 'quality', 'criteria-engine', 'carriers', 'evidence-before-conclusion.json')
    const c = JSON.parse(readFileSync(cPath, 'utf8'))
    c.criteria = [...c.criteria, 'ghost-criterion']
    writeFileSync(cPath, JSON.stringify(c, null, 2) + '\n', 'utf8')
    const badRef = spawnSync(process.execPath, [CLI, '--root', root], { encoding: 'utf8' })
    assert.equal(badRef.status, 1)
    assert.match(`${badRef.stdout}${badRef.stderr}`, /ghost-criterion/, '必须点名不存在的判据 id')

    const c2 = JSON.parse(readFileSync(cPath, 'utf8'))
    c2.criteria = c2.criteria.filter((x) => x !== 'ghost-criterion')
    writeFileSync(cPath, JSON.stringify(c2, null, 2) + '\n', 'utf8')
    const rulePath = join(root, 'rules', 'evidence-before-conclusion.md')
    writeFileSync(rulePath, `${readFileSync(rulePath, 'utf8')}手改\n`, 'utf8')
    const drift = spawnSync(process.execPath, [CLI, '--root', root], { encoding: 'utf8' })
    assert.equal(drift.status, 1)
    assert.match(`${drift.stdout}${drift.stderr}`, /CarrierProjectionDrift/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('渲染物逐字节（stage-2 §1.6）：手改投影 1 字节 → exit 1 点名文件；删投影 → ProjectionMissing', () => {
  const root = copyRoot()
  try {
    const proj = join(root, 'tools', 'quality', 'criteria-engine', 'anchor-present.md')
    writeFileSync(proj, readFileSync(proj, 'utf8') + '\n手改一行\n', 'utf8')
    const drift = spawnSync(process.execPath, [CLI, '--root', root], { encoding: 'utf8' })
    assert.equal(drift.status, 1, `手改渲染物后必须 exit 1（${drift.stdout}${drift.stderr}）`)
    assert.match(`${drift.stdout}${drift.stderr}`, /ProjectionDrift/, '必须报 ProjectionDrift')
    assert.match(`${drift.stdout}${drift.stderr}`, /anchor-present\.md/, '必须点名被改的投影文件')

    rmSync(proj, { force: true })
    const missing = spawnSync(process.execPath, [CLI, '--root', root], { encoding: 'utf8' })
    assert.equal(missing.status, 1)
    assert.match(`${missing.stdout}${missing.stderr}`, /ProjectionMissing/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
