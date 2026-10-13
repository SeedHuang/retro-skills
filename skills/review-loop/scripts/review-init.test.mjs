// review-init.test.mjs —— readProjectType / flattenCandidates / listInfo / candidateSet / update-review-project-type 单测
// 惯例：同目录 *.test.mjs，node:test + 临时目录 fixture（参照 skill-inspector/scripts/check.test.mjs）；
// 每个用例 t.after 清理临时目录，不留垃圾（2026-10-13 OCR 指出）
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  readProjectType, flattenCandidates, listInfo, candidateSet, ensureRegistry, registryPath, nameKey,
} from './review-init.mjs'
import { main, CliError } from './update-review-project-type.mjs'

// 临时目录 + t.after 自动清理
function tmpDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'review-init-test-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

const registryCount = (home) => {
  ensureRegistry(home) // 与真实使用一致：命令跑前注册表已初始化（种子）
  const { activeProjectTypes } = JSON.parse(readFileSync(registryPath(home), 'utf8'))
  return activeProjectTypes.length
}

// ---------- readProjectType ----------

test('readProjectType：指针不存在（ENOENT）→ null，视为未设置', (t) => {
  const cwd = tmpDir(t)
  assert.equal(readProjectType(cwd), null)
})

test('readProjectType：空 / 纯空白 → null', (t) => {
  const cwd = tmpDir(t)
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), '  \n', 'utf8')
  assert.equal(readProjectType(cwd), null)
})

test('readProjectType：有值 → trim 后返回', (t) => {
  const cwd = tmpDir(t)
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), 'Agent Skill 项目\n', 'utf8')
  assert.equal(readProjectType(cwd), 'Agent Skill 项目')
})

test('readProjectType：EISDIR（指针是目录）→ 抛错，不吞成 null（读不了 ≠ 未设置）', (t) => {
  const cwd = tmpDir(t)
  mkdirSync(join(cwd, '.reviewconfig', 'project-type'), { recursive: true })
  assert.throws(() => readProjectType(cwd), /项目类型指针读取失败/)
})

// ---------- flattenCandidates ----------

test('flattenCandidates：对象条目透传 path/ignore，字符串条目只有 name/source', (t) => {
  const out = flattenCandidates({
    activeProjectTypes: [{ name: 'node-cli', path: '**/*.{js,mjs}', ignore: '无前端' }],
    languagePresets: [{ name: 'python-backend', path: '**/*.py', ignore: '无前端' }],
    ecosystemPresets: ['React H5'],
  })
  const byName = Object.fromEntries(out.map((c) => [c.name, c]))
  assert.deepEqual(byName['node-cli'], { name: 'node-cli', path: '**/*.{js,mjs}', ignore: '无前端', source: '个人累积' })
  assert.deepEqual(byName['python-backend'], { name: 'python-backend', path: '**/*.py', ignore: '无前端', source: '语言级' })
  assert.deepEqual(byName['React H5'], { name: 'React H5', source: '生态级' })
  assert.equal('path' in byName['React H5'], false)
  assert.equal('ignore' in byName['React H5'], false)
})

test('flattenCandidates：无名项被丢弃', (t) => {
  const out = flattenCandidates({
    activeProjectTypes: [{ name: '', path: 'x' }, { name: 'ok', path: 'y' }],
    languagePresets: [],
    ecosystemPresets: [],
  })
  assert.deepEqual(out.map((c) => c.name), ['ok'])
})

// ---------- candidateSet / ensureRegistry ----------

test('candidateSet：注册表不存在 → 写种子；幂等（第二次不覆盖、不翻倍）', (t) => {
  const home = tmpDir(t)
  const first = candidateSet(home)
  const firstCount = first.activeProjectTypes.length
  assert.ok(firstCount > 0)
  assert.equal(ensureRegistry(home).created, false) // 已存在 → created=false
  const again = candidateSet(home)
  assert.equal(again.activeProjectTypes.length, firstCount) // 不是 2×firstCount
  assert.equal(registryCount(home), firstCount)
})

// ---------- listInfo（currentHit：悬空指针场景） ----------

test('listInfo：current 在候选集内 → currentHit 命中该类型', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), 'node-cli\n', 'utf8')
  const info = listInfo(home, cwd)
  assert.equal(info.current, 'node-cli')
  assert.equal(info.currentHit.name, 'node-cli')
  assert.ok(info.candidates.length > 0)
})

test('listInfo：current 悬空（注册表误删后自定义类型消失，指针仍在）→ currentHit 为 null', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  mkdirSync(join(cwd, '.reviewconfig'), { recursive: true })
  writeFileSync(join(cwd, '.reviewconfig', 'project-type'), 'H5 中台\n', 'utf8') // 不在任何候选层
  const info = listInfo(home, cwd)
  assert.equal(info.current, 'H5 中台')
  assert.equal(info.currentHit, null)
})

test('nameKey：NFKC 归一全角 + trim 去首尾空白 + lowercase（单一来源口径，2026-10-13 OCR 指出无测试）', () => {
  assert.equal(nameKey('  React  '), 'react')       // 首尾空格
  assert.equal(nameKey('　CLI　'), 'cli')            // 全角空格
  assert.equal(nameKey('Ｒｅａｃｔ'), 'react')        // 全角字符
  assert.equal(nameKey('React'), nameKey('react'))  // 大小写一致
  assert.equal(nameKey({ name: 'Ｒｅａｃｔ' }), 'react') // 对象入参（命令收敛分支用 nameKey(item)）
})

// ---------- update-review-project-type.mjs 落地（2026-10-13 OCR 指出命令无测试） ----------

test('命令落地：空 ignore 对象条目（种子 react）正常落地，rule 不以「；」开头', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  const before = registryCount(home)
  main({ home, cwd, argv: ['react'] })
  // 注册表：react 已在种子，registryUpdated 应为 false，数量不变
  assert.equal(registryCount(home), before)
  // rule.json 派生：空 ignore → rule 直接以「派生自…」开头
  const rule = JSON.parse(readFileSync(join(cwd, '.opencodereview', 'rule.json'), 'utf8'))
  assert.equal(rule.rules[0].path, '**/*.{js,mjs,cjs,ts,tsx,jsx}')
  assert.ok(!rule.rules[0].rule.startsWith('；'), '空 ignore 不应以「；」开头')
  assert.ok(rule.rules[0].rule.includes('派生自 activeProjectTypes.config.json 的 react 条目'))
  assert.equal(rule.rules[0].merge_system_rule, true)
  // 指针写入
  assert.equal(readFileSync(join(cwd, '.reviewconfig', 'project-type'), 'utf8').trim(), 'react')
})

test('命令落地：对象条目不在注册表 → 加进去且保留其它顶层键', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  // 注册表塞一个自定义顶层键，验证回写不丢（2026-10-13 OCR 指出）
  const regPath = registryPath(home)
  ensureRegistry(home) // 先建种子
  const reg = JSON.parse(readFileSync(regPath, 'utf8'))
  reg.customMeta = { owner: 'test' }
  writeFileSync(regPath, JSON.stringify(reg, null, 2), 'utf8')
  const before = registryCount(home)
  // 语言级预设类型（不在 active 层）落地 → 应加入注册表
  main({ home, cwd, argv: ['python-backend'] })
  const after = JSON.parse(readFileSync(regPath, 'utf8'))
  assert.equal(registryCount(home), before + 1)
  assert.equal(after.customMeta.owner, 'test', '注册表其它顶层键被静默丢掉')
  assert.ok(after.activeProjectTypes.some((x) => x.name === 'python-backend'))
})

test('命令落地：字符串条目 → CliError code 1，注册表与指针不动', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  ensureRegistry(home) // 先建种子，便于比对注册表全文
  const regBefore = readFileSync(registryPath(home), 'utf8')
  assert.throws(() => main({ home, cwd, argv: ['React H5'] }), (e) => e instanceof CliError && e.code === 1)
  assert.equal(readFileSync(registryPath(home), 'utf8'), regBefore, '字符串条目不应改注册表')
  assert.equal(readProjectType(cwd), null, '字符串条目不应写指针')
})

test('命令落地：手写 rule.json → CliError code 2，注册表不变（先校验后落盘）', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  mkdirSync(join(cwd, '.opencodereview'), { recursive: true })
  writeFileSync(join(cwd, '.opencodereview', 'rule.json'),
    JSON.stringify({ rules: [{ path: '**/*.js', rule: '手写', merge_system_rule: true }] }), 'utf8')
  ensureRegistry(home) // 先建种子，便于比对注册表全文
  const regBefore = readFileSync(registryPath(home), 'utf8')
  assert.throws(() => main({ home, cwd, argv: ['python-backend'] }), (e) => e instanceof CliError && e.code === 2)
  assert.equal(readFileSync(registryPath(home), 'utf8'), regBefore, '手写 rule.json 拒绝时注册表全文不得变')
  assert.equal(readProjectType(cwd), null)
  // --force 后成功
  main({ home, cwd, argv: ['python-backend', '--force'] })
  const rule = JSON.parse(readFileSync(join(cwd, '.opencodereview', 'rule.json'), 'utf8'))
  assert.ok(rule.rules[0].rule.includes('派生自 activeProjectTypes.config.json 的 python-backend 条目'))
})

test('命令落地：未知 flag → CliError code 1，不落盘', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  ensureRegistry(home) // 先建种子，便于比对注册表全文
  const regBefore = readFileSync(registryPath(home), 'utf8')
  assert.throws(() => main({ home, cwd, argv: ['react', '--dry-run'] }), (e) => e instanceof CliError && e.code === 1)
  assert.equal(readFileSync(registryPath(home), 'utf8'), regBefore)
  assert.equal(readProjectType(cwd), null)
})

test('命令落地：现有 rule.json 解析失败 → CliError code 1，注册表与指针不动', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  ensureRegistry(home) // 先建种子，便于比对注册表全文
  mkdirSync(join(cwd, '.opencodereview'), { recursive: true })
  writeFileSync(join(cwd, '.opencodereview', 'rule.json'), '{broken json', 'utf8')
  const regBefore = readFileSync(registryPath(home), 'utf8')
  assert.throws(() => main({ home, cwd, argv: ['python-backend'] }), (e) => e instanceof CliError && e.code === 1)
  assert.equal(readFileSync(registryPath(home), 'utf8'), regBefore, '解析失败时注册表全文不得变')
  assert.equal(readProjectType(cwd), null)
})

test('命令落地：类型不在候选集 → CliError code 1（带近似候选提示）', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  // node-cli 在候选集里，node-c 是它的前缀 → 应提示近似候选
  assert.throws(() => main({ home, cwd, argv: ['node-c'] }),
    (e) => e instanceof CliError && e.code === 1 && /近似候选/.test(e.message))
  assert.equal(readProjectType(cwd), null)
})

test('命令落地：active 已有同条目（同 path/ignore）→ 幂等不更新；收敛分支为 TOCTOU 防御（同步无法模拟，逻辑简单）', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  // node-cli 是种子条目 → 落地应「已有的跳过」（registryUpdated=false）
  const result = main({ home, cwd, argv: ['node-cli'] })
  assert.equal(result.registryUpdated, false, '已有同条目不应更新')
  assert.equal(result.type, 'node-cli')
  // 收敛分支（同名不同 path/ignore → 更新）只在 TOCTOU 场景触发——main 同步执行无法在读写之间注入外部改动，
  // 该分支按设计防御保留（listInfo 快照 vs 最终读取之间的注册表外部变更，2026-10-13 OCR 指出），无直接单测
})

test('命令落地：单横线 1~2 字符/裸 -- 当未知 flag、≥3 字符当类型名', (t) => {
  const home = tmpDir(t)
  const cwd = tmpDir(t)
  // 先建种子，便于比对注册表全文（-legacy-cli 会走到 listInfo→ensureRegistry，不预置就测不到「未改」）
  ensureRegistry(home)
  const regBefore = readFileSync(registryPath(home), 'utf8')
  // `-x`（单横线 1 字符）→ 未知 flag
  assert.throws(() => main({ home, cwd, argv: ['-x'] }), (e) => e instanceof CliError && e.code === 1 && /未知参数/.test(e.message))
  // `-ab`（单横线 2 字符）→ 未知 flag——isFlagLike 边界是「横线后 1~2 字符」，只测 -x/-legacy-cli 的话把 [^-]? 去掉回归也不会红
  assert.throws(() => main({ home, cwd, argv: ['-ab'] }), (e) => e instanceof CliError && e.code === 1 && /未知参数/.test(e.message))
  // 裸 `--` → 未知 flag（不是「类型不存在」）
  assert.throws(() => main({ home, cwd, argv: ['--'] }), (e) => e instanceof CliError && e.code === 1 && /未知参数/.test(e.message))
  // `-abc`（单横线恰好 3 字符）→ 仍当类型名 → 不在候选集（钉住 isFlagLike 上界，2026-10-13 OCR 指出）
  assert.throws(() => main({ home, cwd, argv: ['-abc'] }), (e) => e instanceof CliError && e.code === 1 && /不在候选集/.test(e.message))
  // `-legacy-cli`（单横线多字符）→ 当类型名处理 → 不在候选集（不是未知参数）
  assert.throws(() => main({ home, cwd, argv: ['-legacy-cli'] }), (e) => e instanceof CliError && e.code === 1 && /不在候选集/.test(e.message))
  // 守卫目的 = 防拼错 flag 静默落盘：报错路径都不许写指针/rule.json/全局注册表（2026-10-13 OCR 指出补注册表比对）
  assert.equal(readProjectType(cwd), null, 'flag/类型名报错都不该写指针')
  assert.equal(existsSync(join(cwd, '.opencodereview', 'rule.json')), false, 'flag/类型名报错都不该写 rule.json')
  assert.equal(readFileSync(registryPath(home), 'utf8'), regBefore, 'flag/类型名报错都不该写全局注册表')
})
