#!/usr/bin/env node
// M0a 只读基线：跑 scs check rules --json，落 baseline.json + manifest.json。
// --check-only：只写 <out>/，不改任何被跟踪件；前置不满足即 exit 2 且不落文件。
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = resolve(HERE, '..')
const ANNOTATIONS = join(REPO, 'tools', 'quality', '.inspector-annotations.json')
const TERMS = join(REPO, 'tools', 'docgen', 'models', 'rules', 'vocab', 'observable-terms.json')
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex').toUpperCase()

export function toRecords(report, { exitCode, scsVersion, nodeVersion, annotationsSha256 }) {
  return (report.files ?? []).map((f) => ({
    ruleId: f.name.replace(/\.md$/, ''),
    score: f.total,
    max: f.max,
    rate: f.rate,
    level: f.level,
    reds: (f.findings ?? []).map((x) => `${x.group}/${x.check}`),
    exitCode,
    scsVersion,
    nodeVersion,
    annotationsSha256,
  }))
}

export function buildManifest({ gitSha, rules, builders, env }) {
  return { gitSha, rulesSha256: rules, buildersSha256: builders, env }
}

function parseArgs(argv) {
  const out = { checkOnly: false, out: null }
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--check-only') { out.checkOnly = true; continue }
    if (argv[i] === '--out') {
      const v = argv[i + 1]
      if (!v || v.startsWith('--')) { console.error('InvalidArgs: --out 缺值'); process.exit(2) }
      out.out = v; i += 1; continue
    }
    console.error(`InvalidArgs: 未知旗标 ${argv[i]}`); process.exit(2)
  }
  if (!out.out) { console.error('InvalidArgs: 必须给 --out'); process.exit(2) }
  return out
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const outDir = resolve(process.cwd(), args.out)
  const baselineFile = join(outDir, 'baseline.json')
  const manifestFile = join(outDir, 'manifest.json')

  // 前置 1：被跟踪树干净（untracked 白名单不影响）
  const dirty = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain', '--untracked-files=no'], { cwd: REPO, encoding: 'utf8' }).trim()
  if (dirty) { console.error(`DirtyWorkTree: ${dirty.split(/\r?\n/)[0]}`); process.exit(2) }
  // 前置 2：annotations 存在
  if (!existsSync(ANNOTATIONS)) { console.error(`InvalidInputPath: ${ANNOTATIONS}`); process.exit(2) }

  const r = spawnSync('scs', ['check', 'rules', '--root', '.', '--terms', TERMS, '--annotations', ANNOTATIONS, '--json'], { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, shell: true })
  if (r.status !== 0) { console.error(`scs check rules 退出码 ${r.status}`); process.exit(2) }
  const report = JSON.parse(r.stdout.replace(/^\uFEFF/, ''))

  const gitSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
  const scsVersion = execFileSync('scs', ['--version'], { cwd: REPO, encoding: 'utf8', shell: true }).trim()
  const listSha = (dir) => readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => ({ path: relative(REPO, join(dir, f)).replace(/\\/g, '/'), sha: sha256(readFileSync(join(dir, f))) }))
  const env = {}
  for (const k of ['DOCGEN_RULES_DIR', 'DOCGEN_AGENTS_DIR', 'DOCGEN_BASELINE_PATH', 'DOCGEN_TMP_ROOT', 'DOCGEN_BUILD_DATA_DIR', 'DOCGEN_BUILD_OUT_DIR', 'DOCGEN_BUILD_RULES_DIR']) env[k] = process.env[k] ?? ''

  const records = toRecords(report, { exitCode: r.status, scsVersion, nodeVersion: process.version, annotationsSha256: sha256(readFileSync(ANNOTATIONS)) })
  const manifest = buildManifest({ gitSha, rules: listSha(join(REPO, 'rules')), builders: listSha(join(REPO, 'tools', 'docgen', 'builders', 'rules')), env })

  mkdirSync(outDir, { recursive: true })
  writeFileSync(baselineFile, JSON.stringify(records, null, 2) + '\n')
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n')
  console.log(`baseline ${records.length} 条；rules ${manifest.rulesSha256.length} 份；builders ${manifest.buildersSha256.length} 份`)
  return 0
}

const isMain = (() => {
  try { return resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url)) } catch { return false }
})()
if (isMain) process.exit(main())
