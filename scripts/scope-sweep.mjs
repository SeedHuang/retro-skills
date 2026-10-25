// scope-sweep.mjs —— 改判回扫：同一口径在「上游签字件 + 同族文档」里的命中扫描
// 用法：
//   node scripts/scope-sweep.mjs                      打印当前命中（人读表）
//   node scripts/scope-sweep.mjs --freeze             冻结基线（tools/scope-sweep/baseline.json）
//   node scripts/scope-sweep.mjs --check              判红（规则 R8 的机械判据）
//   node scripts/scope-sweep.mjs --json               机读输出
// 判红四条（--check）：① 无基线；② 任一口径命中数 > 基线；③ 口径 ID 或命中文件未进当次 impact-sheet；
//                      ④ scope 内文件缺失（fail-closed）。
// 设计约束：scope 必须显式列文件（不许 glob）——通配会把「逐字节」放大成几百命中，噪声压垮信号。
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { join, resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_CONFIG = 'tools/scope-sweep/keywords.json';
export const DEFAULT_BASELINE = 'tools/scope-sweep/baseline.json';

// 历史类路径：命中可保留原句（按 docs-convention「历史记录不改」）
export const HISTORY_PREFIXES = [
  'docs/handoffs/',
  'docs/superpowers/plans/',
  'docs/superpowers/reviews/',
  'docs/superpowers/retro/',
  'docs/after/',
  'docs/mymind/',
];
const REF_MARKS = [/§/, /\bV-\d+\b/, /不变量\s*\d/];

export function classify(relPath, line) {
  const p = relPath.replace(/\\/g, '/');
  if (HISTORY_PREFIXES.some((h) => p.startsWith(h))) return '历史';
  if (REF_MARKS.some((re) => re.test(line))) return '引用';
  return '正文';
}

export function loadConfig(root, configPath = DEFAULT_CONFIG) {
  const abs = resolve(root, configPath);
  if (!existsSync(abs)) throw new Error(`配置不存在：${configPath}`);
  const cfg = JSON.parse(readFileSync(abs, 'utf8'));
  if (!Array.isArray(cfg.entries) || cfg.entries.length === 0) throw new Error('配置里 entries 为空');
  for (const e of cfg.entries) {
    if (!e.id || !Array.isArray(e.words) || !Array.isArray(e.scope)) throw new Error(`口径缺字段：${JSON.stringify(e).slice(0, 80)}`);
    if (e.scope.some((s) => /[*?]/.test(s))) throw new Error(`口径 ${e.id} 的 scope 不许用通配（必须显式列文件）`);
  }
  return cfg;
}

// 单次扫描：返回 { hits, counts, missingScope, entries }
export function runSweep({ root = ROOT, configPath = DEFAULT_CONFIG } = {}) {
  const cfg = loadConfig(root, configPath);
  const hits = [];
  const counts = {};
  const missingScope = [];
  for (const e of cfg.entries) {
    counts[e.id] = 0;
    for (const rel of e.scope) {
      const abs = resolve(root, rel);
      if (!existsSync(abs)) { missingScope.push({ id: e.id, file: rel }); continue; }
      const lines = readFileSync(abs, 'utf8').split(/\r?\n/);
      const relPosix = relative(root, abs).replace(/\\/g, '/');
      lines.forEach((line, i) => {
        const matched = e.words.filter((w) => line.includes(w));
        if (matched.length === 0) return;
        hits.push({ id: e.id, file: relPosix, line: i + 1, kind: classify(relPosix, line), words: matched, text: line.trim().slice(0, 80) });
        counts[e.id] += 1;
      });
    }
  }
  return { hits, counts, missingScope, entries: cfg.entries };
}

export function readBaseline(root, baselinePath = DEFAULT_BASELINE) {
  const abs = resolve(root, baselinePath);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, 'utf8'));
}

export function findImpactSheet(root) {
  const dir = resolve(root, '.session/reviews');
  if (!existsSync(dir)) return null;
  const found = readdirSync(dir)
    .filter((d) => statSync(join(dir, d)).isDirectory())
    .map((d) => join(dir, d, 'impact-sheet.md'))
    .filter((p) => existsSync(p));
  if (found.length === 0) return null;
  return found.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
}

// 判红（规则 R8）；返回 { ok, reasons[], counts, baseline, hits, impactPath }
export function runCheck({ root = ROOT, configPath = DEFAULT_CONFIG, baselinePath = DEFAULT_BASELINE, impactPath = null } = {}) {
  const res = runSweep({ root, configPath });
  const baseline = readBaseline(root, baselinePath);
  const reasons = [];
  if (!baseline) reasons.push(`无基线：${baselinePath} 不存在（先跑 --freeze，并与本次改判同批提交）`);
  if (res.missingScope.length) {
    reasons.push(`scope 文件缺失 ${res.missingScope.length} 处：${res.missingScope.map((m) => `${m.id}→${m.file}`).join(' / ')}`);
  }
  if (baseline) {
    for (const [id, n] of Object.entries(res.counts)) {
      const b = baseline.counts?.[id];
      if (typeof b !== 'number') { reasons.push(`口径 ${id} 未登记基线`); continue; }
      if (n > b) reasons.push(`口径 ${id} 命中数 ${n} > 基线 ${b}（改判后新增了未处置的旧说法）`);
    }
  }
  const impact = impactPath ? resolve(root, impactPath) : findImpactSheet(root);
  if (!impact || !existsSync(impact)) {
    reasons.push('找不到当次 impact-sheet.md（改判影响清单），无法核「每处有处置」');
  } else {
    // 「当次」判定：清单必须**不早于**被扫文件（同秒抖动给 1s 容差）。否则旧评审的清单会冒充当次改判，
    // 只要它恰好含同一批口径 ID 与文件名就能蒙过 --check（R8 会变成恒真）。
    const scopeMtimes = res.entries.flatMap((e) => e.scope)
      .map((rel) => resolve(root, rel)).filter((p) => existsSync(p)).map((p) => statSync(p).mtimeMs);
    const newestScope = scopeMtimes.length ? Math.max(...scopeMtimes) : 0;
    if (statSync(impact).mtimeMs + 1000 < newestScope) {
      reasons.push(`impact-sheet 早于被扫文件（${relative(root, impact).replace(/\\/g, '/')}）：不是当次改判的清单`);
    }
    const text = readFileSync(impact, 'utf8');
    const ids = new Set(res.entries.map((e) => e.id));
    const files = new Set(res.hits.map((h) => basename(h.file)));
    const missIds = [...ids].filter((id) => !text.includes(id));
    const missFiles = [...files].filter((f) => !text.includes(f));
    if (missIds.length) reasons.push(`清单缺口径：${missIds.join(', ')}`);
    if (missFiles.length) reasons.push(`清单缺文件：${missFiles.join(', ')}`);
  }
  return { ok: reasons.length === 0, reasons, counts: res.counts, baseline, hits: res.hits, impactPath: impact };
}

export function formatTable(hits) {
  const rows = hits.map((h) => `${h.id}\t${h.file}:${h.line}\t${h.kind}\t${h.text}`);
  return ['口径\t位置\t分类\t命中行前 80 字', ...rows].join('\n');
}

export function main(argv = process.argv.slice(2), root = ROOT) {
  const argOf = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
  const configPath = argOf('--config', DEFAULT_CONFIG);
  const baselinePath = argOf('--baseline', DEFAULT_BASELINE);
  const impactPath = argOf('--impact', null);
  const asJson = argv.includes('--json');
  try {
    if (argv.includes('--freeze')) {
      const { counts, entries, missingScope } = runSweep({ root, configPath });
      const abs = resolve(root, baselinePath);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, `${JSON.stringify({ generatedAt: new Date().toISOString(), counts, entries: entries.map((e) => e.id) }, null, 2)}\n`);
      console.log(`baseline written: ${baselinePath}（${Object.keys(counts).length} 口径）`);
      if (missingScope.length) console.log(`warn: scope 缺失 ${missingScope.length} 处`);
      return 0;
    }
    if (argv.includes('--check')) {
      const r = runCheck({ root, configPath, baselinePath, impactPath });
      if (asJson) console.log(JSON.stringify(r, null, 2));
      else {
        if (argv.includes('--verbose')) console.log(formatTable(r.hits));
        console.log(`counts ${JSON.stringify(r.counts)}`);
        if (r.ok) console.log('sweep ok（命中未超基线、清单齐、scope 齐）');
        else r.reasons.forEach((why) => console.log(`FAIL: ${why}`));
      }
      return r.ok ? 0 : 1;
    }
    const { hits, counts, missingScope } = runSweep({ root, configPath });
    if (asJson) console.log(JSON.stringify({ counts, missingScope, hits }, null, 2));
    else { console.log(formatTable(hits)); console.log(`\ncounts ${JSON.stringify(counts)}`); }
    return 0;
  } catch (e) {
    console.error(`scope-sweep: ${e.message}`);
    return 2;
  }
}

// 仅直接运行时执行 CLI（realpath 归一化免疫 Junction，见 rule skill-authoring-convention 判据③）
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = main();
}
