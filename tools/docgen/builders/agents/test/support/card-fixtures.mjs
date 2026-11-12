// 卡面相关测试的**共享夹具**（plan Task 6 / 计划门 P2-2：一处实现、多文件 import，不得复制第二份）。
// P5 后消费方：`rule-render.test.mjs`（coldRepo / runCli）。
// helper 口径：`runNode` / `runCli` / `coldRepo`（mkdtemp 副本）。
import { existsSync, mkdirSync, cpSync, mkdtempSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO = join(HERE, '..', '..', '..', '..', '..', '..')

// 子进程跑 node（副本内重渲染一律走这里：模板加载即固化，同进程改副本后重渲恒绿）
export const runNode = (args, cwd = REPO, env = null) => {
  const r = spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: env ? { ...process.env, ...env } : process.env })
  return { code: r.status ?? -1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` }
}
export const runCli = (args, cwd = REPO, env = null) => runNode(['tools/docgen/builders/agents/cli.mjs', ...args], cwd, env)

// 临时副本（同 `tools/docgen/builders/agents/acceptance/cold-run.mjs` 的做法）：已跟踪 + 未跟踪未忽略文件一起复制。
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
    // 清单快照 → 逐文件复制之间，并发用例可能删/重建文件；快照语义 = 「复制时刻仍存在的文件」。
    try { cpSync(src, dst) } catch (e) { if (e && e.code === 'ENOENT') continue; throw e }
  }
  if (mutate) mutate(copy)
  const r = runCli(args, copy, env ?? null)
  try { if (verify) verify(copy, r) } finally { rmSync(copy, { recursive: true, force: true }) }
  return r
}
