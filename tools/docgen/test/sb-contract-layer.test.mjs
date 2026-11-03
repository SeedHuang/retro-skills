// S-B 契约层用例落点（SB-TC-04 起）。本文件由 plan 逐任务追加，不要一次写满。
// 编写者：主 agent（施工者本人）；本文件是常驻测试、不是 testcase 文件，不受独立编写义务约束。
import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT } from './support/dev-workflow-checks.mjs'
import { REGISTERED_IDS } from '../../observation-check/registered-ids.mjs'

const REVIEWS = join(ROOT, 'docs', 'superpowers', 'reviews')

// 语料目录按名派生：目录名里的时刻是建件时刻，写死成字面量即第二份真相
const corpusDirs = () => readdirSync(REVIEWS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^2026-11-03-\d{4}-s-b-contract-baseline$/.test(d.name))
  .map((d) => d.name)

test('SB-TC-04 归档语料 observation-r1 成对入索引，且覆盖三段对账与结构校验全过', () => {
  const dirs = corpusDirs()
  assert.equal(dirs.length, 1, `归档目录必须恰 1 个（实得 ${dirs.join('、') || '(无)'}）`)
  const jsonRel = `docs/superpowers/reviews/${dirs[0]}/observation-r1.json`
  const mdRel = jsonRel.replace(/\.json$/, '.md')

  // ① 成对：json 与同名 md 都在（md 只能由渲染器产出）
  const present = [jsonRel, mdRel].filter((p) => existsSync(join(ROOT, p)))
  assert.deepEqual(present, [jsonRel, mdRel], '语料必须成对存在（json + 同名 md）')

  // ② 带 evidence 的项 ≥ 2：hit 必须回指原文，不能是演练式空记录
  const doc = JSON.parse(readFileSync(join(ROOT, jsonRel), 'utf8'))
  const withEvidence = doc.items.filter((it) => it.evidence && typeof it.evidence.path === 'string')
  assert.ok(withEvidence.length >= 2, `带 evidence 的项 ${withEvidence.length} / ${doc.items.length}`)

  // ③ 覆盖三段对账
  const c = doc.coverage
  assert.equal(c.read, doc.items.length, 'coverage.read 必须 = items 条数')
  assert.equal(c.total, REGISTERED_IDS.length, 'coverage.total 必须 = REGISTERED_IDS 长度')
  assert.equal(c.read + c.skipped.length, c.total, 'read + skipped 必须 = total')

  // ④ 结构 + 证据七道 + 渲染一致：一次判完（本仓唯一的单件校验入口）
  const r = spawnSync(process.execPath, ['tools/observation-check/cli.mjs', jsonRel], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stdout + r.stderr)

  // ⑤ 两件都已入索引（归档后不可再改）
  const ls = spawnSync('git', ['ls-files', '--', jsonRel, mdRel], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(ls.status, 0, ls.stdout + ls.stderr)
  const tracked = ls.stdout.split(/\r?\n/).filter((l) => l.trim())
  assert.equal(tracked.length, present.length, `入索引 ${tracked.length} 行 / 应有 ${present.length} 行`)

  console.log(`corpus: pair ${present.length}/${present.length} evidence ${withEvidence.length}/${doc.items.length} => ok`)
})
