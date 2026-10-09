import { mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs'
import { join, basename } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

export function draftsDir() { return join(homedir(), '.retro-skills', 'rule-drafts') }
export function ensure(box = draftsDir()) {
  if (!existsSync(box)) mkdirSync(box, { recursive: true })
  return box
}
// 解析 <规则名>--<YYYYMMDD-HHMMSS>.md；无 -- 则整体当规则名（不显示 created）
export function parseName(name) {
  const m = name.match(/^(.+)--(\d{8}-\d{6})\.md$/)
  return m ? { rule: m[1], ts: m[2], created: m[2].replace(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/, '$1-$2-$3 $4:$5:$6') } : { rule: name.replace(/\.md$/, ''), ts: '', created: '' }
}
export function ls(box = draftsDir(), ruleName) {
  if (!existsSync(box)) return []
  return readdirSync(box).filter(f => f.endsWith('.md') && (!ruleName || f.startsWith(ruleName + '--')))
    .map(f => ({ name: f, ...parseName(f) }))
    .sort((x, y) => (y.ts || '').localeCompare(x.ts || ''))   // 文件名时间戳倒序（无 ts 的排最后，spec §3.1）
}
export function rmFile(box, name) {
  if (!name || name !== basename(name)) throw new Error(`非法草稿名：${name}`)   // 防路径逃逸（../../ 删除 box 外文件）
  if (existsSync(join(box, name))) rmSync(join(box, name))
}
export function rmRule(box, ruleName, keep) {
  const files = ls(box, ruleName)
  if (keep && !files.some(f => f.name === keep)) throw new Error(`保留的草稿不存在：${keep}（未删除任何草稿）`)   // keep 错拼 → 拒绝全删
  for (const f of files) if (!keep || f.name !== keep) rmFile(box, f.name)
}

// CLI（仅直接运行时执行；被 import 时（如测试）不触发）
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [,, cmd, ...rest] = process.argv
  const box = draftsDir()
  switch (cmd) {
    case 'ensure': ensure(box); console.log(`草稿箱：${box}`); break
    case 'ls': {
      const ruleName = rest[0]
      for (const f of ls(box, ruleName)) console.log(`${f.name}（创建 ${f.created || '未知'}）`)
      break
    }
    case 'rm': {
      if (rest[0] === '--rule') {
        const rule = rest[1]
        if (!rule) { console.error('用法：drafts rm --rule <规则名> [--keep <草稿>]'); process.exit(2) }   // 缺规则名 → 拒绝（防全箱误删）
        const keep = rest[2] === '--keep' ? rest[3] : undefined
        if (rest[2] === '--keep' && !keep) { console.error('--keep 缺草稿名'); process.exit(2) }
        try { rmRule(box, rule, keep); console.log(`已删除 ${rule} 名下草稿${keep ? `（保留 ${keep}）` : ''}`) }
        catch (e) { console.error(e.message); process.exit(2) }
      } else {
        if (!rest[0]) { console.error('用法：drafts rm <草稿> | rm --rule <规则名> [--keep <草稿>]'); process.exit(2) }
        try { rmFile(box, rest[0]); console.log(`已删除 ${rest[0]}`) }
        catch (e) { console.error(e.message); process.exit(2) }
      }
      break
    }
    default: console.error('用法：drafts ensure | ls [规则名] | rm <草稿> | rm --rule <规则名> [--keep <草稿>]'); process.exit(2)
  }
}
