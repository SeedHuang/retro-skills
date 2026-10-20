// review-ledger-numbers.mjs —— 机械核对评审账本里的数字（防「副本漂移」）
// 用法：node skills/review-log/scripts/review-ledger-numbers.mjs <review 目录>
//   <review 目录> 下需有 progress.md（缺 = 用法错误，exit 2）；problems.md / cards.md 可缺
//   （缺 cards.md 时跳过依赖它的 C2，并在 stderr 给 WARN）。
//
// 为什么要有它（2026-10-20 实测）：
//   S3 议会评审第 7/8/9 三轮，审计抓到 13 处数字错误，全部是「同一个数字在多个文件各抄一份，
//   改一处漏三处」。共花了三轮子代理往返才清干净——而这类错本该由脚本一次跑完。
//   同类问题在 review-ledger-gate.mjs 的注释里已写过：靠模板 / 查账表这类 AI 层规则拦不住。
//
// 判据（4 条，全部机器可判；不做语义判断）：
//   C1 算术自检   「N 个/张/条/处（P0 a / P1 b / P2 c）」必须 a+b+c === N。
//   C2 实数校准   声明为「卡级」且单位为「张」的分布，必须等于 cards.md 里数出来的真实计数。
//                 **真实值可从 cards.md 完整识别（每张卡都有【P0/P1/P2】）时才启用**；
//                 识别不全就 WARN + 跳过，宁可少查一条，也不假红。
//   C3 族号计数   「**P<0|1|2> 族 N 个**」后面那段里不同 F 编号数必须 === N。
//                 只数「本标题之后、下一个标题之前」的片段；`候选 F26` 剔除，不计入该级。
//   C4 副本禁令   progress.md 每个「## 第 N 轮」小节内不得再出现「共 N 张 / N 个问题 / N 处」
//                 或「N 张（P0 …）」或「归并：P0 …」——该轮总量只允许写在顶部轮次账。
//                 （这条把「少抄一份」从劝告变成机器可判：副本存在即红。）
//
// 明确不覆盖（写出来，防将来误以为它万能）：
//   - **语义合并类**：如「28 处引用去重后是 13 族还是 14 条」——这是判断，机器不替你决定。
//     处置方式不是「检查」，而是让该数字只存在一处（C4 保证不产生第二副本）。
//   - **状态类**：如查账表里「待第 2 轮补」没兑现——需要人判断「该不该结案」。
//   - **跨轮一致性**：不同轮次之间的数字关系属业务语义，不检。
//
// 退出码：0 = 无 FAIL；1 = 有 FAIL；2 = 用法/读取错误（含缺 progress.md）。
// 为什么不挂 npm run check：.session/ 在 .gitignore，check-all 跳过它（同 review-ledger-gate.mjs）。

import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ── 判据用的正则（集中在顶部，便于核对）────────────────────────────────────
// C1：数字 + 单位 + 括号里的三级分布。允许 `**加粗**`、`（卡级 …）` 这类书写变体。
const RE_ARITH = /(\d+)\s*\*{0,2}\s*(?:个问题|张|条|处)\*{0,2}\s*[（(]\s*(?:\*{0,2}卡级\*{0,2}\s*)?P0\s*(\d+)\s*\/\s*P1\s*(\d+)\s*\/\s*P2\s*(\d+)/g
// 卡片标题：`#### BE-1-01 【P0】…`；序号允许 1–3 位（不锁死两位，避免「BE-1-1」被漏数）
const RE_CARD = /^####\s+[A-Z]{2}-\d-\d{1,3}\b/
const RE_CARD_LEVEL = /^####\s+[A-Z]{2}-\d-\d{1,3}\s*【(P0|P1|P2)】/
// C3：族汇总行 `- **P1 族 15 个**：F3 …；F17 …`（允许 `个` 后接 `+ 候选 N 个` 再收 **）
const RE_FAMILY = /\*\*P([012])\s*族\s*(\d+)\s*个[^*]*\*\*/g
const RE_F_TOKEN = /\bF\d+\b/g
// 候选段（不计入该级族数）：粗体写法与裸写法都要剔除
const RE_CANDIDATE = /\*\*候选[^*]*\*\*/g
const RE_CANDIDATE_PLAIN = /候选\s*F\d+/g
// C4：副本禁令
const RE_COPY = [
  {
    re: /共\s*\*{0,2}\d+\s*(?:张|个问题|处)/,
    hint: '本行疑似该轮总量副本（该轮总量只允许写在顶部轮次账）；若只是普通叙述，请改写措辞避免「共 N 张/个问题/处」',
  },
  { re: /\d+\s*张（(?:卡级\s*)?P0/, hint: '这一行的分布是轮次账的副本，删掉' },
  { re: /归并\*\*：P0\s*\d+/, hint: '「归并」行的分布数字是轮次账的副本，删掉' },
]
// progress.md 的轮次小节标题
const RE_ROUND_HEAD = /^##\s*第\s*(\d+)\s*轮/

/**
 * 核对一个评审目录下的三件套。
 * @param {string} dir 评审目录（必须含 progress.md；problems.md / cards.md 可选）
 * @returns {{fails: {file: string, line: number, msg: string}[], warns: string[], stats: object}}
 */
export function check(dir) {
  const fails = []
  const warns = []
  const files = {}

  for (const name of ['progress.md', 'problems.md', 'cards.md']) {
    const p = join(dir, name)
    if (existsSync(p)) files[name] = readFileSync(p, 'utf8')
    else warns.push(`缺 ${name}（依赖它的检查已跳过）`)
  }

  // progress.md 是唯一必需件：缺它 = 没有任何可核对的轮次账，按 FAIL 报（不是静默通过）
  if (!files['progress.md']) {
    fails.push({
      file: 'progress.md',
      line: 0,
      msg: '缺 progress.md：没有轮次账就没有可核对的对象（CLI 会以 exit 2 拒绝，避免「没检查 = 通过」）',
    })
    return { fails, warns, stats: { skipped: true, rounds: 0 } }
  }

  const lines = {}
  for (const [name, text] of Object.entries(files)) lines[name] = text.split(/\r?\n/)

  // ── C2 的真实值：数 cards.md 里的卡片标题，不信任任何手写声明 ─────────────
  let actual = null
  if (files['cards.md']) {
    const real = { total: 0, P0: 0, P1: 0, P2: 0 }
    let unleveled = 0
    for (const l of lines['cards.md']) {
      if (!RE_CARD.test(l)) continue
      real.total++
      const m = l.match(RE_CARD_LEVEL)
      if (m) real[m[1]]++
      else unleveled++
    }
    if (real.total === 0) {
      warns.push('cards.md 里没有可识别的卡片标题（`#### XX-1-01 【P0】`）→ C2 已跳过')
    } else if (unleveled > 0) {
      // 级别识别不全时若仍比对，会把「合法账本」判红——宁可跳过，也不假红
      warns.push(`cards.md 有 ${unleveled}/${real.total} 张卡标题缺【P0/P1/P2】标记 → C2 已跳过（否则会假红）`)
    } else {
      actual = real
    }
  }

  // ── C1 算术自检（全文件）────────────────────────────────────────────────
  for (const name of Object.keys(files)) {
    lines[name].forEach((l, i) => {
      for (const m of l.matchAll(RE_ARITH)) {
        const [all, total, p0, p1, p2] = m
        const sum = Number(p0) + Number(p1) + Number(p2)
        if (sum !== Number(total)) {
          fails.push({
            file: name,
            line: i + 1,
            msg: `C1 算术不自洽：「${all}」→ ${p0}+${p1}+${p2}=${sum}，但写的是 ${total}`,
          })
        }
      }
    })
  }

  // ── C2 实数校准（只认「卡级」+ 单位「张」的声明；不再用总数碰撞去猜）──────
  if (actual) {
    for (const name of Object.keys(files)) {
      lines[name].forEach((l, i) => {
        for (const m of l.matchAll(RE_ARITH)) {
          const [all, total, p0, p1, p2] = m
          if (!/卡级/.test(all) || !/张/.test(all)) continue
          const bad = []
          if (Number(p0) !== actual.P0) bad.push(`P0 写 ${p0}，实为 ${actual.P0}`)
          if (Number(p1) !== actual.P1) bad.push(`P1 写 ${p1}，实为 ${actual.P1}`)
          if (Number(p2) !== actual.P2) bad.push(`P2 写 ${p2}，实为 ${actual.P2}`)
          if (Number(total) !== actual.total) bad.push(`总数写 ${total}，实为 ${actual.total}`)
          if (bad.length) {
            fails.push({
              file: name,
              line: i + 1,
              msg: `C2 与 cards.md 实际计数不符：「${all}」→ ${bad.join('；')}`,
            })
          }
        }
      })
    }
  }

  // ── C3 族号计数（只数「本标题之后、下一个标题之前」的片段）────────────────
  for (const name of Object.keys(files)) {
    lines[name].forEach((l, i) => {
      const fams = [...l.matchAll(RE_FAMILY)]
      for (let k = 0; k < fams.length; k++) {
        const m = fams[k]
        const segStart = m.index + m[0].length
        const segEnd = k + 1 < fams.length ? fams[k + 1].index : l.length
        // 剔除候选段（粗体与裸写法）与括号内的旁注（如「（同 F1、F2 见上）」），
        // 避免把候选族 / 他级族号的交叉引用算进该级
        const seg = l.slice(segStart, segEnd)
          .replace(RE_CANDIDATE, '')
          .replace(RE_CANDIDATE_PLAIN, '')
          .replace(/[（(][^）)]*[）)]/g, '')
        const declared = Number(m[2])
        const ids = new Set(seg.match(RE_F_TOKEN) || [])
        if (ids.size !== declared) {
          fails.push({
            file: name,
            line: i + 1,
            msg: `C3 族号数不符：「**P${m[1]} 族 ${declared} 个**」但该标题之后列出了 ${ids.size} 个不同 F 编号（候选段已剔除）`,
          })
        }
      }
    })
  }

  // ── C4 副本禁令（progress.md 的每个「## 第 N 轮」小节内）──────────────────
  const heads = []
  lines['progress.md'].forEach((l, i) => {
    const m = l.match(RE_ROUND_HEAD)
    if (m) heads.push({ round: m[1], line: i })
  })
  for (let k = 0; k < heads.length; k++) {
    // 小节范围 = 本标题行到下一个 `## ` 标题（`###` 子节不终止，因为 `^##\s` 不匹配 `###`）
    let end = lines['progress.md'].length
    for (let j = heads[k].line + 1; j < lines['progress.md'].length; j++) {
      if (/^##\s+/.test(lines['progress.md'][j])) { end = j; break }
    }
    for (let j = heads[k].line + 1; j < end; j++) {
      const l = lines['progress.md'][j]
      for (const { re, hint } of RE_COPY) {
        if (re.test(l)) {
          fails.push({
            file: 'progress.md',
            line: j + 1,
            msg: `C4 副本禁令（第 ${heads[k].round} 轮小节）：${hint}`,
          })
          break // 同一行只报一次
        }
      }
    }
  }

  return {
    fails,
    warns,
    stats: { actual, rounds: heads.length, files: Object.keys(files) },
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────
function main(argv) {
  const dir = argv[2]
  if (!dir) {
    console.error('用法：node skills/review-log/scripts/review-ledger-numbers.mjs <review 目录>')
    return 2
  }
  if (!existsSync(dir)) {
    console.error(`目录不存在：${dir}`)
    return 2
  }
  if (!existsSync(join(dir, 'progress.md'))) {
    // 用法错误，不是「检查通过」——缺了唯一必需件就该拒绝，而不是打印 0 处不一致
    console.error(`不是评审账本目录（缺 progress.md）：${dir}`)
    return 2
  }

  const { fails, warns, stats } = check(dir)
  for (const w of warns) console.log(`[WARN] ${w}`)
  for (const f of fails) console.log(`[FAIL] ${f.file}:${f.line} ${f.msg}`)
  if (fails.length === 0) {
    const a = stats.actual
    const tail = a ? `；cards.md 实际 ${a.total} 张（P0 ${a.P0} / P1 ${a.P1} / P2 ${a.P2}）` : ''
    const rounds = stats.rounds ?? 0
    console.log(`账本数字：0 处不一致（${rounds} 个轮次小节${tail}）`)
  }
  return fails.length > 0 ? 1 : 0
}

// 直接运行判定：Junction/symlink 下路径字符串会不等，故用 realpath 比较（见仓库规则）
const selfReal = (() => {
  try { return realpathSync(fileURLToPath(import.meta.url)) } catch { return '' }
})()
const argvReal = (() => {
  try { return process.argv[1] ? realpathSync(process.argv[1]) : '' } catch { return '' }
})()
if (selfReal && argvReal && selfReal === argvReal) {
  process.exitCode = main(process.argv)
}
