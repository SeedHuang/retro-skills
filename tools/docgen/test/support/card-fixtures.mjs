// 卡面相关测试的**共享夹具**（plan Task 6 / 计划门 P2-2：一处实现、多文件 import，不得复制第二份）。
// 消费方：`tools/docgen/test/card-render.test.mjs`、`tools/docgen/test/s2-card-rewrite.test.mjs`。
// 五个 helper 的口径（testcase §0 常量 4）：`walkFiles` / `runNode` / `runCli` / `coldRepo`（mkdtemp 副本）/ `mutCard`（内存改卡并还原）。
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, cpSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { agentData } from '../../components/agentData.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO = join(HERE, '..', '..', '..', '..')
export const AGENTS_DIR = join(REPO, 'agents')
export const DOC_AGENTS_DIR = join(REPO, 'docs', 'agents')

// 扫仓内文本文件（口径 = card-render.test.mjs 原有实现：跳 node_modules / .git，只收 mjs / md / json / tpl）
export const walkFiles = (dir, out = []) => {
  if (!existsSync(dir)) return out
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walkFiles(p, out) }
    else if (/\.(mjs|md|json|tpl)$/.test(e.name)) out.push(p)
  }
  return out
}

// 子进程跑 node（副本内重渲染一律走这里：模板在 `cardTemplate.mjs` 加载即固化，同进程改副本后重渲恒绿）
export const runNode = (args, cwd = REPO, env = null) => {
  const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: env ? { ...process.env, ...env } : process.env })
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}
export const runCli = (args, cwd = REPO, env = null) => runNode(['tools/docgen/cli.mjs', ...args], cwd, env)
// 公共 CLI（`scs`）：`check observable` / `check criteria-engine` 的实现已迁出本仓，测试改走全局命令。
export const runScs = (args, cwd = REPO, env = null) => {
  const r = spawnSync('scs', args, {
    cwd,
    encoding: 'utf8',
    shell: true,
    env: env ? { ...process.env, ...env } : process.env,
  })
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}

// 临时副本（同 `tools/docgen/acceptance/cold-run.mjs` 的做法）：已跟踪 + 未跟踪未忽略文件一起复制。
// 为什么补 `--others`：`docs/agents/**` 是新增未提交文件，只复制 `ls-files` 会让副本缺生成物 → 恒红 / 恒绿。
export const coldRepo = ({ mutate = null, args = ['gate'], verify = null, env = null } = {}) => {
  const copy = mkdtempSync(join(tmpdir(), 's2-tc-'))
  const list = (argv) => execFileSync('git', ['-c', 'core.quotePath=false', ...argv], { cwd: REPO, encoding: 'utf8' })
    .trim().split(/\r?\n/).filter((f) => f && !f.startsWith('.git/'))
  const files = [...new Set([...list(['ls-files']), ...list(['ls-files', '--others', '--exclude-standard'])])]
  for (const f of files) {
    const src = join(REPO, f)
    if (!existsSync(src)) continue
    const dst = join(copy, f)
    mkdirSync(dirname(dst), { recursive: true })
    cpSync(src, dst)
  }
  if (existsSync(DOC_AGENTS_DIR)) cpSync(DOC_AGENTS_DIR, join(copy, 'docs', 'agents'), { recursive: true })
  if (mutate) mutate(copy)
  mkdirSync(join(copy, '.drafts'), { recursive: true })
  const r = runCli(args, copy, {
    DOCGEN_DRAFTS_DIR: join(copy, '.drafts'),
    DOCGEN_STATE_PATH: join(copy, 'tools/docgen/state.json'),
    DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures'),
    ...(env ?? {}),
  })
  try { if (verify) verify(copy, r) } finally { rmSync(copy, { recursive: true, force: true }) }
  return r
}

// 内存改卡数据（不改源文件；返回还原函数，调用方必须在 finally 里调它——「构造不落盘 + 必还原」）
export const mutCard = (seat, fn) => {
  const a = agentData.find((x) => x.name === seat)
  if (!a || !a.card || typeof a.card !== 'object') throw new Error(`${seat} 必须已有 card 数据`)
  const keep = structuredClone(a.card)
  fn(a.card, keep)
  return () => { a.card = keep }
}

// 副本内「追加 1 字节」构造（手改即红 / 零写盘类的通用探针）
export const appendOneByte = (rel) => (copy) => {
  const p = join(copy, rel)
  if (!existsSync(p)) throw new Error(`副本内缺 ${rel}`)
  writeFileSync(p, `${readFileSync(p, 'utf8')}x`, 'utf8')
}
