#!/usr/bin/env node
// P2 四维评估「评分链路」复现：双钉基线。
//   baseline = d678028（2026-11-11，P2 记录基线）
//   archive  = fa67454（11-12 样本归档；card-B7 在此补齐「输出格式」节）
// 从 archive 取 84 轮原始 JSON 与实际参与评分的 cards-fix，重跑评分脚本，重建
// aggregate-v2.csv，并与仓内留档逐字节比对。
//
// 边界：本脚本不重跑 LLM 作答（理解/执行 subagent 的答案不可确定性复现）；
// 它验证的是「固定原始样本 → score-understanding/execution/token → aggregate」这条链路。
//
// 用法：
//   node reproduce-p2-eval.mjs [--repo <仓根>] [--keep]
//   退出码：0 = 与留档一致；1 = 不一致 / 缺少历史样本。
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, cpSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { join, dirname, resolve, basename } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url)) // docs/reports/.../p2-eval/raw
const REPORT = resolve(HERE, '..')
const args = process.argv.slice(2)
const repoAt = args.indexOf('--repo')
const REPO = resolve(repoAt >= 0 ? args[repoAt + 1] : resolve(HERE, '..', '..', '..', '..'))
const KEEP = args.includes('--keep')
const BASELINE = 'd678028' // 2026-11-11
const ARCHIVE = 'fa67454' // 11-12 样本归档
const norm = (s) => String(s).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trimEnd()

function run(cmd, cmdArgs, opts = {}) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', ...opts })
  if (r.error) throw new Error(`${cmd} 启动失败：${r.error.message}`)
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(' ')} 失败（exit ${r.status}）：${(r.stderr || '').trim().slice(0, 300)}`)
  return r.stdout || ''
}

function main() {
  const tmp = mkdtempSync(join(tmpdir(), 'p2-eval-repro-'))
  try {
    // 0) 双钉：基线 commit 必须存在；样本从 archive 取
    run('git', ['cat-file', '-e', `${BASELINE}^{commit}`], { cwd: REPO })
    run('git', ['cat-file', '-e', `${ARCHIVE}^{commit}`], { cwd: REPO })
    const baselineDiff = run('git', ['diff', '--name-only', BASELINE, ARCHIVE, '--', 'tmp/agent-criteria-demo/eval/raw/cards-fix'], { cwd: REPO })
      .split(/\r?\n/).filter(Boolean).map((p) => basename(p))
    console.log(`baseline=${BASELINE}（2026-11-11） archive=${ARCHIVE}；baseline→archive cards 差异 ${baselineDiff.length} 份${baselineDiff.length ? `（${baselineDiff.join(', ')}）` : ''}`)

    // 1) 历史原始样本（理解 42 + 执行 42 + perf 样本）来自 archive；
    //    token 的卡面字数取 baseline（11-11）的 cards-fix（B7 在 11-12 才补齐，档案 aggregate 用的是 11-11 字数）
    const tar = join(tmp, 'raw.tar')
    run('git', ['archive', '--format=tar', `--output=${tar}`, ARCHIVE, 'tmp/agent-criteria-demo/eval/raw'], { cwd: REPO })
    // 用相对文件名 + cwd 解包：Git Bash 的 GNU tar 会把 `C:\...` 当远程主机（Cannot connect to C:）
    run('tar', ['-xf', 'raw.tar', '-C', '.'], { cwd: tmp })
    const SRC = join(tmp, 'tmp', 'agent-criteria-demo', 'eval', 'raw')
    for (const d of ['understanding-v2', 'execution-v2']) {
      if (!existsSync(join(SRC, d))) throw new Error(`历史样本缺 ${d}（${ARCHIVE}）`)
    }
    const tmpBase = join(tmp, 'baseline')
    mkdirSync(tmpBase, { recursive: true })
    const tarBase = join(tmpBase, 'cards.tar')
    run('git', ['archive', '--format=tar', `--output=${tarBase}`, BASELINE, 'tmp/agent-criteria-demo/eval/raw/cards-fix'], { cwd: REPO })
    run('tar', ['-xf', 'cards.tar', '-C', '.'], { cwd: tmpBase })
    const BASE_CARDS = join(tmpBase, 'tmp', 'agent-criteria-demo', 'eval', 'raw', 'cards-fix')
    if (!existsSync(BASE_CARDS)) throw new Error(`基线卡面缺 cards-fix（${BASELINE}）`)

    // 2) 临时工作区：仓内留档的脚本 / 评分键 / fixtures + 历史样本
    const work = join(tmp, 'eval')
    const workRaw = join(work, 'raw')
    mkdirSync(workRaw, { recursive: true })
    for (const f of readdirSync(HERE)) cpSync(join(HERE, f), join(workRaw, f), { recursive: true })
    for (const d of ['understanding-v2', 'execution-v2']) {
      cpSync(join(SRC, d), join(workRaw, d), { recursive: true })
    }
    cpSync(BASE_CARDS, join(workRaw, 'cards-baseline'), { recursive: true })
    copyFileSync(join(SRC, 'perf-v2-bench.txt'), join(workRaw, 'perf-v2-bench.txt'))
    copyFileSync(join(REPORT, 'blind-map.json'), join(work, 'blind-map.json'))

    // 3) 重跑评分；保留汇总行（留档 aggregate 含汇总行），仅去掉 `---` 分隔
    const score = (script, dir) => {
      const out = run(process.execPath, [script, dir], { cwd: workRaw })
      return out.split(/\r?\n/).filter((line) => line && line !== '---').join('\n') + '\n'
    }
    writeFileSync(join(workRaw, 'understanding-v2-score.txt'), score('score-understanding.mjs', 'understanding-v2'))
    writeFileSync(join(workRaw, 'execution-v2-score.txt'), score('score-execution.mjs', 'execution-v2'))
    const token = run(process.execPath, ['token/token-summary.mjs', 'execution-v2', 'cards-baseline'], { cwd: workRaw })
    writeFileSync(join(workRaw, 'token-v2-summary.txt'), token.split(/\r?\n/).filter(Boolean).join('\n') + '\n')

    // 4) 重建聚合表并比对
    run(process.execPath, ['build-aggregate-v2.mjs'], { cwd: workRaw })
    const expected = norm(readFileSync(join(HERE, 'aggregate-v2.csv'), 'utf8'))
    const actual = norm(readFileSync(join(workRaw, 'aggregate-v2.csv'), 'utf8'))
    if (actual !== expected) {
      const a = expected.split('\n')
      const b = actual.split('\n')
      const i = a.findIndex((line, idx) => line !== b[idx])
      console.error(`[reproduce] aggregate-v2.csv 不一致：首个差异在第 ${i + 1} 行`)
      console.error(`  留档：${a[i] ?? '(缺)'}`)
      console.error(`  复现：${b[i] ?? '(缺)'}`)
      process.exitCode = 1
      return
    }
    console.log(`p2 eval reproduce ok：baseline ${BASELINE} / archive ${ARCHIVE}；84 轮原始样本 → ${basename(HERE)}/aggregate-v2.csv 一致`)
  } finally {
    if (!KEEP) rmSync(tmp, { recursive: true, force: true })
    else console.log(`work kept：${tmp}`)
  }
}

main()
