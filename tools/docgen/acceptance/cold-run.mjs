#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const copy = mkdtempSync(join(tmpdir(), 'dg-cold-'));
let code = 1;
try {
  // -c core.quotePath=false：中文路径不做 C-style 转义（与 replace-scenarios.mjs 一致）
  const files = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files'], { cwd: REPO, encoding: 'utf8' }).trim().split('\n');
  const extra = [
    'tools/docgen/state.json',
    'tools/docgen/state.mjs',
    'tools/docgen/evidence.mjs',
    'tools/docgen/components/sharedBlocks.mjs',
    'tools/docgen/components/outputFormats.mjs',
    'tools/docgen/components/renderAgent.mjs',
    'tools/docgen/fixtures/reviewer-audit.evidence.json',
  ];
  const all = [...new Set([...files, ...extra])].filter((f) => f && !f.startsWith('.git/'));
  for (const f of all) {
    const src = join(REPO, f);
    if (!existsSync(src)) continue; // 未跟踪/尚未生成的文件（如 fixtures/*.evidence.json 未生成时）跳过
    const dst = join(copy, f);
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst);
  }
  const drafts = join(copy, '.drafts');
  mkdirSync(drafts, { recursive: true });
  const r = spawnSync(process.execPath, ['tools/docgen/cli.mjs', 'gate'], {
    cwd: copy, encoding: 'utf8',
    env: { ...process.env, DOCGEN_DRAFTS_DIR: drafts, DOCGEN_STATE_PATH: join(copy, 'tools/docgen/state.json'), DOCGEN_EVIDENCE_DIR: join(copy, 'tools/docgen/fixtures') },
  });
  process.stdout.write(r.stdout);
  process.stderr.write(r.stderr);
  code = r.status ?? 1;
} finally {
  rmSync(copy, { recursive: true, force: true });
}
process.exit(code);
