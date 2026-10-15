import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, copyFileSync, readdirSync, symlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { checkSkillDir, listSkillDirsFallback } from './check.mjs'
import { listSkillDirs } from '../../../scripts/skill-dir.mjs'

const CLI = fileURLToPath(new URL('./check.mjs', import.meta.url))

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'check-'))
  for (const [rel, content] of Object.entries(files)) {
    const p = join(dir, rel)
    mkdirSync(dirname(p), { recursive: true })
    writeFileSync(p, content)
  }
  return dir
}

const MANIFEST = { skills: ['alpha', 'beta'] }

test('① 跨技能路径引用：命中', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '判据见 `beta/references/criteria.md`',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '跨技能路径引用' && f.skill === 'alpha'))
})

test('① 自引用不算跨技能命中', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '见 `alpha/assets/x.md`',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(!findings.some(f => f.check === '跨技能路径引用'))
})

test('① 磁盘存在但 manifest 未登记的技能引用也命中（与扫描目标一致）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '见 `gamma/assets/x.md`',
    'gamma/SKILL.md': '# gamma',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '跨技能路径引用' && f.skill === 'alpha'))
})

test('① 磁盘不存在且不在 manifest 的名字不命中（避免 docs/ 等假阳性）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '见 `docs/references/x.md` 和 `not-a-skill/assets/y.md`',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.equal(findings.filter(f => f.check === '跨技能路径引用').length, 0)
})

test('① assets/ 里的跨技能路径引用也命中（扩面后只读 SKILL.md 会漏掉这处）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/assets/tpl.md': '结构见 `beta/references/criteria.md`',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  const hit = findings.find(f => f.check === '跨技能路径引用' && f.skill === 'alpha')
  assert.ok(hit)
  assert.equal(hit.file, 'assets/tpl.md')
  assert.equal(hit.line, 1)
})

test('① references/ 子目录里的自引用带前缀也命中（扩面 + 递归）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/references/deep/notes.md': '见 `alpha/assets/x.md`',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  const hit = findings.find(f => f.check === '自引用带前缀' && f.skill === 'alpha')
  assert.ok(hit)
  assert.equal(hit.file, 'references/deep/notes.md')
})

test('② 带 skills/ 前缀的 SKILL.md 引用：识别出中间那段技能名（不把它当未知目录放过）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/assets/tpl.md': '判断标准见 `skills/alpha/SKILL.md`',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '自引用带前缀' && f.skill === 'alpha'))
})

test('② skills/ 前缀指向别的技能也算跨技能引用', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/assets/tpl.md': '见 `skills/beta/SKILL.md`',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '跨技能路径引用' && f.skill === 'alpha'))
})

test('干净 assets/references：扩面后不引入误报', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '判据：调用 `beta` 技能\n见 `references/x.md`',
    'alpha/assets/tpl.md': '见 `assets/y.md` 与 `SKILL.md`',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.equal(findings.length, 0)
})

test('② 自引用带技能名前缀：命中', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '见 `alpha/assets/x.md`',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '自引用带前缀'))
})

test('③ 守卫路径字符串比较：命中且带文件名', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/scripts/run.mjs': "if (process.argv[1] === fileURLToPath(import.meta.url)) { cli() }",
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  const hit = findings.find(f => f.check === '守卫路径字符串比较')
  assert.ok(hit)
  assert.equal(hit.file, 'scripts/run.mjs')
})

test('③ 守卫反序操作数也命中', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/scripts/run.mjs': "if (fileURLToPath(import.meta.url) === process.argv[1]) { cli() }",
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '守卫路径字符串比较'))
})

test('③ 守卫 pathToFileURL(process.argv[1]).href 方向也命中', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/scripts/run.mjs': "if (import.meta.url === pathToFileURL(process.argv[1]).href) { cli() }",
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  const hit = findings.find(f => f.check === '守卫路径字符串比较')
  assert.ok(hit)
  assert.match(hit.text, /pathToFileURL/)
})

test('③ 守卫反序 pathToFileURL 方向也命中', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/scripts/run.mjs': "if (pathToFileURL(process.argv[1]).href === import.meta.url) { cli() }",
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  const hit = findings.find(f => f.check === '守卫路径字符串比较')
  assert.ok(hit)
  assert.match(hit.text, /pathToFileURL/)
})

test('守卫命中带行号（line 字段非 1）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/scripts/run.mjs': "import { x } from './x.mjs'\n\nif (process.argv[1] === fileURLToPath(import.meta.url)) { cli() }\n",
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  const hit = findings.find(f => f.check === '守卫路径字符串比较')
  assert.ok(hit)
  assert.equal(hit.line, 3)
})

test('③ 排除 *.test.mjs：测试文件里的违规 fixture 不算违规', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/scripts/run.test.mjs': "if (process.argv[1] === fileURLToPath(import.meta.url)) { cli() }",
    'alpha/scripts/run.mjs': 'console.log("ok")',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.equal(findings.filter(f => f.check === '守卫路径字符串比较').length, 0)
})

test('干净 skill：0 findings', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '判据：调用 `beta` 技能\n见 `references/x.md`',
    'alpha/scripts/run.mjs': "if (realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) cli()",
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.equal(findings.length, 0)
})

test('checkSkillDir 不带 options 不抛错（默认空 manifest）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '判据：调用 `beta` 技能',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir)
  assert.equal(findings.length, 0)
})

test('CLI：干净目录 exit 0', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '判据：调用 `beta` 技能\n见 `references/x.md`',
    'beta/SKILL.md': '# beta',
    'manifest.json': JSON.stringify({ skills: ['alpha', 'beta'] }),
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const r = spawnSync(process.execPath, [CLI, '--dir', dir, '--manifest', join(dir, 'manifest.json'), '--json'], { encoding: 'utf8' })
  assert.equal(r.status, 0)
  assert.equal(JSON.parse(r.stdout).findings.length, 0)
})

test('CLI：有 findings 时 exit 1（判据⑦ 脚本化判定）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/scripts/run.mjs': "if (process.argv[1] === fileURLToPath(import.meta.url)) { cli() }",
    'manifest.json': JSON.stringify({ skills: ['alpha'] }),
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const r = spawnSync(process.execPath, [CLI, '--dir', dir, '--manifest', join(dir, 'manifest.json'), '--json'], { encoding: 'utf8' })
  assert.equal(r.status, 1)
  const out = JSON.parse(r.stdout)
  assert.ok(out.findings.some(f => f.check === '守卫路径字符串比较' && f.skill === 'alpha'))
})

test('CLI：未知 flag 报错 exit 1', () => {
  const r = spawnSync(process.execPath, [CLI, '--nope'], { encoding: 'utf8' })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /未知参数/)
})

test('CLI：manifest.skills 非数组报错 exit 1', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
  })
  const badManifest = join(dir, 'bad-manifest.json')
  writeFileSync(badManifest, JSON.stringify({ skill: 'alpha' })) // 无 skills 数组
  t.after(() => rmSync(dir, { recursive: true }))
  const r = spawnSync(process.execPath, [CLI, '--dir', dir, '--manifest', badManifest], { encoding: 'utf8' })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /manifest\.skills 必须是数组/)
})

test('① skills/ 前缀 × references 分支：识别出中间那段技能名', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/assets/tpl.md': '见 `skills/beta/references/criteria.md`',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.ok(findings.some(f => f.check === '跨技能路径引用' && f.skill === 'alpha'))
})

test('① examples/（非 assets/references 目录）里的跨技能引用也命中（递归扩面证明用例）', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '# alpha',
    'alpha/examples/notes.md': '见 `beta/references/criteria.md`',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  const hit = findings.find(f => f.check === '跨技能路径引用' && f.skill === 'alpha')
  assert.ok(hit)
  assert.equal(hit.file, 'examples/notes.md')
})

test('干净技能：递归扩面后 examples/ 里的正常文件不误报', (t) => {
  const dir = fixture({
    'alpha/SKILL.md': '判据：调用 `beta` 技能\n见 `references/x.md`',
    'alpha/examples/ok.md': '见 `assets/y.md` 与 `SKILL.md`\n判据以 `beta` 技能为准',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => rmSync(dir, { recursive: true }))
  const { findings } = checkSkillDir(dir, { manifest: MANIFEST })
  assert.equal(findings.length, 0)
})

// ⚠️ 这条用例是「兜底实现 ≡ 单源」的唯一机械保证（R4-R6 三轮分批返工的根因就是两份副本漂移）。
// 判据只能在本仓跑：副本安装态单源根本不在，两份实现无法同时存在 → 无从比对。
// 覆盖：正常 / 空目录 / SKILL.md 是目录 / 非目录条目 + 点开头目录名 / SKILL.md 是符号链接 / 父目录不存在（错误契约）。
// 只比**集合**不比顺序：顺序来自 readdirSync 的文件系统返回顺序，本仓不作为契约（要改顺序语义时两处一起改）。
test('兜底实现 ≡ 单源：6 组 fixture 下返回值与抛错文本全等', (t) => {
  const normal = fixture({ 'alpha/SKILL.md': '# a', 'beta/SKILL.md': '# b' })
  const empty = fixture({})
  const skillMdIsDir = mkdtempSync(join(tmpdir(), 'check-'))
  mkdirSync(join(skillMdIsDir, 'alpha', 'SKILL.md'), { recursive: true })
  const strays = fixture({ 'alpha/SKILL.md': '# a' })
  writeFileSync(join(strays, 'stray.txt'), 'x')
  mkdirSync(join(strays, '.hidden'))
  // SKILL.md 是符号链接 → 挡住「兜底把 lstatSync 漂移成 statSync」这类改动。
  // 单源判据②的用意就是不跟随链接（防 /dev/zero、FIFO、超大外部文件被 readFileSync 读爆），
  // 没有这组 fixture，把 lstatSync 换成 statSync 这条用例照样全绿。
  const linked = fixture({ 'alpha/SKILL.md': '# a', 'beta/SKILL.md': '# b' })
  let linkedOk = true
  try {
    rmSync(join(linked, 'alpha', 'SKILL.md'))
    symlinkSync(join(linked, 'beta', 'SKILL.md'), join(linked, 'alpha', 'SKILL.md'))
  } catch {
    linkedOk = false      // 平台不允许建符号链接 → 跳过该组，并在用例名后标注
  }
  const missing = join(normal, 'no-such-dir')
  const cases = [normal, empty, skillMdIsDir, strays, missing, linked].filter(Boolean)
  t.after(() => { for (const c of cases) rmSync(c, { recursive: true, force: true }) })

  const run = (fn, c) => {
    try { return { ok: JSON.stringify(fn(c).slice().sort()) } }
    catch (e) { return { err: e.message } }
  }
  for (const c of cases) {
    assert.deepEqual(run(listSkillDirs, c), run(listSkillDirsFallback, c), `两份实现在 ${c} 上不等价`)
  }
  // 基线锚定**内容**而不只是「没抛错」：两份实现同时退化成返回空数组也要能看出来
  assert.deepEqual(JSON.parse(run(listSkillDirs, normal).ok), ['alpha', 'beta'], '单源基线不对')
  assert.deepEqual(JSON.parse(run(listSkillDirsFallback, normal).ok), ['alpha', 'beta'], '兜底基线不对')
  if (linkedOk) {
    // 单源不跟随链接 → alpha 的 SKILL.md 是链接时它不算技能，只剩 beta
    assert.deepEqual(JSON.parse(run(listSkillDirs, linked).ok), ['beta'], '符号链接组：单源没挡住链接')
    assert.deepEqual(JSON.parse(run(listSkillDirsFallback, linked).ok), ['beta'], '符号链接组：兜底没挡住链接')
  }
})

test('副本安装态：只拷 check.mjs、不拷仓库根 scripts/ 时 CLI 仍能独立跑（走兜底）', (t) => {
  const copyRoot = mkdtempSync(join(tmpdir(), 'check-copy-'))
  const copiedCli = join(copyRoot, 'skills', 'skill-inspector', 'scripts', 'check.mjs')
  mkdirSync(dirname(copiedCli), { recursive: true })
  copyFileSync(CLI, copiedCli)          // 只拷脚本 → ../../../scripts/skill-dir.mjs 不存在 → 走兜底
  // 真实断言：副本树里**只有那一个脚本文件** → `../../../scripts/skill-dir.mjs` 必然不可达。
  // ⚠️ 别写成 existsSync(copyRoot/scripts/skill-dir.mjs) === false —— copyRoot 是 mkdtemp 空目录，
  // 没有任何代码往 copyRoot/scripts/ 写过东西，那条断言恒真、什么也证明不了（同「假闸门」）。
  // 只比文件不比目录：目录是脚手架，不是内容。
  const copiedFiles = readdirSync(copyRoot, { recursive: true, withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name)
  assert.deepEqual(copiedFiles, ['check.mjs'], '副本树里不止那一个脚本 → 单源可能变可达了')
  const dir = fixture({
    'alpha/SKILL.md': '判据见 `beta/references/criteria.md`',
    'beta/SKILL.md': '# beta',
  })
  t.after(() => {
    rmSync(copyRoot, { recursive: true, force: true })
    rmSync(dir, { recursive: true, force: true })
  })
  const r = spawnSync(process.execPath, [copiedCli, '--dir', dir, '--json'], { encoding: 'utf8' })
  // 先看 stderr：进程崩溃时 status 同样是 1，但 stdout 是空的，
  // 直接 JSON.parse('') 会抛一句看不懂的 SyntaxError，下面那句诊断永远轮不到。
  assert.equal(r.stderr, '', `副本 CLI 有 stderr 输出（很可能没跑到兜底）：${r.stderr}`)
  assert.equal(r.status, 1, `副本 CLI 未按预期因 findings 退出：stderr=${r.stderr}`)
  const hit = JSON.parse(r.stdout).findings.find(f => f.check === '跨技能路径引用' && f.skill === 'alpha')
  assert.ok(hit, '副本态没能跑出 findings：兜底实现可能没被执行')
})
