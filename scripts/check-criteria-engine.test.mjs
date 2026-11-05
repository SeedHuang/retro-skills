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
