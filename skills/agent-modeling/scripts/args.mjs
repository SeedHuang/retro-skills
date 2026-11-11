// 两个脚本共用的 argv 解析：带值 flag 由调用方显式声明，其余 `--x` 记为布尔位
export function parseArgs(argv, valueFlags = []) {
  const flags = {}
  const positional = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) { positional.push(a); continue }
    const name = a.slice(2)
    if (valueFlags.includes(name)) flags[name] = argv[++i] ?? ''
    else flags[name] = true
  }
  return { positional, flags }
}
