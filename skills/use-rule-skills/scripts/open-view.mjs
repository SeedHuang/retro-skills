import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, execFileSync } from 'node:child_process'

// open-view.mjs —— 用 trae-cn 在 Trae 里打开草稿 / diff 对比窗口
// 用法：
//   node open-view.mjs preview <草稿路径>           打开单文件（trae-cn -r）
//   node open-view.mjs diff <源路径> <草稿路径>       打开对比窗口（trae-cn -d -r）
// 设计动机：链接协议（computer:// 等）实测不可用；命令只有 trae-cn 一条路，封装成脚本，
// 模板只引用脚本，不现场拼命令/猜协议。
// 安全：直接 spawn 真实 exe（shell:false），不经过 cmd.exe/shell——路径含空格不拆、含元字符不注入。
// 环境变量 ELECTRON_RUN_AS_NODE=1：trae-cn.cmd 里就是这么跑的（cli.js 是 Node 入口）。

const ELECTRON_RUN_AS_NODE = '1'
const LAUNCH_TIMEOUT_MS = 1500  // 兜底：trae-cn 常驻不退（不等待窗口关闭）时视为命令已发出

// 解析 trae-cn 真实可执行文件：where → .cmd → 从 .cmd 内容推出 exe + cli.js（不依赖 shell 执行）
export function resolveTrae() {
  const cmdPath = findOnPath('trae-cn')
  const cmdContent = readFileSync(cmdPath, 'utf8')
  const exeRel = /"\s*([^"]*?\.exe)\s*"/.exec(cmdContent)?.[1]   // 形如 "%~dp0..\Trae CN.exe"
  const cliRel = /"\s*([^"]*?cli\.js)\s*"/.exec(cmdContent)?.[1]
  if (!exeRel || !cliRel) throw new Error(`无法解析 trae-cn 配置（.cmd 内容：${cmdContent.slice(0, 80)}…）`)
  const binDir = dirname(cmdPath)
  const exe = resolve(binDir, exeRel.replace(/%~dp0/, ''))
  const cli = resolve(binDir, cliRel.replace(/%~dp0/, ''))
  if (!existsSync(exe)) throw new Error(`trae-cn 可执行文件不存在：${exe}`)
  if (!existsSync(cli)) throw new Error(`trae-cn cli.js 不存在：${cli}`)
  return { exe, cli }
}

function findOnPath(name) {
  const out = execFileSync('where.exe', [name], { encoding: 'utf8' }).trim().split(/\r?\n/)
  if (!out.length) throw new Error(`找不到命令：${name}`)
  // Windows 下优先取 .cmd 包装（trae-cn 是 .cmd shim，里面才有 exe/cli.js 相对路径）；
  // 取不到 .cmd 时（如 mac/linux 直接是二进制）fallback 到第一个匹配项。
  return out.find(p => /\.cmd$/i.test(p)) ?? out[0]
}

export function openPreview(target) {
  if (!existsSync(target)) throw new Error(`文件不存在：${target}`)
  return launch(['-r', realpathSync(target)])
}

export function openDiff(left, right) {
  if (!existsSync(left)) throw new Error(`文件不存在：${left}`)
  if (!existsSync(right)) throw new Error(`文件不存在：${right}`)
  return launch(['-d', '-r', realpathSync(left), realpathSync(right)])
}

function launch(args) {
  const { exe, cli } = resolveTrae()
  return new Promise((resolvePromise, reject) => {
    let settled = false
    const done = (r) => { if (!settled) { settled = true; resolvePromise(r) } }
    const child = spawn(exe, [cli, ...args], {
      shell: false, stdio: 'ignore', windowsHide: true,
      env: { ...process.env, ELECTRON_RUN_AS_NODE },
    })
    const timer = setTimeout(() => done({ ok: true, args }), LAUNCH_TIMEOUT_MS)  // 兜底：常驻不退视为命令已发出
    child.on('error', (err) => { clearTimeout(timer); reject(err) })
    child.on('exit', (code) => { clearTimeout(timer); done(code === 0 ? { ok: true, args } : { ok: false, code, args }) })
  })
}

// CLI（仅直接运行时执行；被 import 时（如测试）不触发）
// 归一化比较：Junction/symlink 下 process.argv[1] 与 import.meta.url 的路径字符串不同，
// 须解析到真实路径（realpath）再比；Windows 文件系统大小写不敏感，比较前归一大小写。
if (process.argv[1]) {
  let self, arg
  try {
    self = realpathSync(fileURLToPath(import.meta.url))
    arg = realpathSync(process.argv[1])
  } catch {
    process.exit(0)  // argv[1] 无法解析（harness 异常/坏 junction）→ 不触发 CLI
  }
  const same = process.platform === 'win32' ? self.toLowerCase() === arg.toLowerCase() : self === arg
  if (same) {
    const [, , cmd, ...rest] = process.argv
    const usage = '用法：open-view preview <草稿路径> | diff <源路径> <草稿路径>'
    try {
      if (cmd === 'preview' && rest[0]) {
        openPreview(rest[0]).then(r => {
          if (r.ok) console.log(`已打开草稿：${realpathSync(rest[0])}`)
          else { console.error(`trae-cn 退出码 ${r.code}`); process.exit(1) }
        }).catch(e => { console.error(e.message); process.exit(1) })
      } else if (cmd === 'diff' && rest[0] && rest[1]) {
        openDiff(rest[0], rest[1]).then(r => {
          if (r.ok) console.log(`已打开 diff：${realpathSync(rest[0])} vs ${realpathSync(rest[1])}`)
          else { console.error(`trae-cn 退出码 ${r.code}`); process.exit(1) }
        }).catch(e => { console.error(e.message); process.exit(1) })
      } else {
        console.error(usage); process.exit(2)
      }
    } catch (e) {
      console.error(e.message); process.exit(1)
    }
  }
}
