// check-command-layer.mjs —— 新门禁（spec §3.2 / R3）：卡面不得出现非 run 组的组名。
// 判据单源 = 定义层 `commandGroups[*].layer`；本脚本只扫 `agents/*.md` 的卡面文本。
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { commandGroups } from '../tools/docgen/builders/agents/policy/definitions/commands.mjs';

// 纯函数：卡面文本 → 违规清单（空 = 通过）。组名按反引号形态匹配，散文里的同名词不算授权。
export function scanCards(cardTexts, groups = commandGroups) {
  const run = new Set(Object.entries(groups).filter(([, g]) => g.layer === 'run').map(([k]) => k));
  const bad = [];
  for (const [file, text] of Object.entries(cardTexts)) {
    for (const g of Object.keys(groups)) {
      if (!run.has(g) && text.includes('`' + g + '`')) bad.push(`${file}: ${g}`);
    }
  }
  return bad;
}

function isMain() {
  try {
    const a = realpathSync(process.argv[1]);
    const b = realpathSync(fileURLToPath(import.meta.url));
    return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
  } catch { return false; }
}

if (isMain()) {
  const dir = 'agents';
  const texts = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.md'))
    .map((f) => [f, readFileSync(join(dir, f), 'utf8')]));
  const bad = scanCards(texts);
  for (const b of bad) console.error(b);
  console.log(bad.length ? `command-layer: bad ${bad.length}` : 'command-layer ok');
  process.exitCode = bad.length ? 1 : 0;
}
