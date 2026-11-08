// S1 测试支撑（纯函数 + 最小仓副本）：把「文本 / 数据 → 结论」的判据写成函数，
// 负例只需换输入文本，不必为每条负例复制整仓。
// 文件名不带 .test.mjs，故不进 node --test；也不在 skills/ 下，不进 check-all 的语法扫描。
import { readFileSync, readdirSync, cpSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
export const readRepo = (rel) => readFileSync(join(ROOT, rel), 'utf8');

// 阶段 1（2026-11-05）：rule 全量退出 `rules/`，留底在 `docs/bak/rules/`。测试取「原文段」=
// 状态头之后、`## 承接对照表` 之前的正文块（与 PRD stage-1 §5 V-9 的切片口径同源，逐字等于旧文件）。
export function readBakRule(name) {
  const text = readRepo(join('docs', 'bak', 'rules', name));
  const start = text.indexOf('\n') + 1;
  const end = text.indexOf('\n## 承接对照表');
  return text.slice(start, end + 1);
}

// Q8（2026-11-03，PRD §3 / spec §10.1 R6）：从 `pathGroups.workspace` 删掉的 3 项本仓专属路径 —— **唯一字面**。
// 顺序 = 改造前旧卡（`fixtures/capability-baseline.json`）里的数组序，不是 spec / plan 正文的列举序：
// `S6-TC-H02` / `J03` / `C01` / `C02` 拿 `diffFacts()` 的 minus 做 `deepEqual`（顺序敏感），顺序错会红。
// 判据侧只许引用本常量；**禁止**改成「基线减当前定义层」动态派生 —— 期望值与实测值同源会豁免任何未批准的删除。
export const Q8_REMOVED_PATHS = Object.freeze(['lessons/', 'skills-lock.json', 'tools/docgen-spike/.tmp-test/']);

const cellList = (line) => line.replace(/\*\*/g, '').split('|').slice(1, -1).map((x) => x.trim());

// 找「表头含 needle」的第一张表，返回表头、数据行与表头行号（行号 0 基）
export function tableAt(text, needle) {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const index = lines.findIndex((l) => l.startsWith('|') && l.includes(needle));
  if (index < 0) return { header: [], rows: [], index: -1, lines };
  const header = cellList(lines[index]);
  const rows = [];
  for (let k = index + 2; k < lines.length && lines[k].startsWith('|'); k += 1) rows.push(cellList(lines[k]));
  return { header, rows, index, lines };
}

// TC-A04 / E21：段表三列（出口判据 / 谁签 / 议会）逐格比对；名称与入口列不进比对
export function diffStageCells(skillText, prdText) {
  const s = tableAt(skillText, '出口判据');
  const p = tableAt(prdText, '出口判据');
  const cols = ['出口判据', '谁签', '议会'];
  const diffs = [];
  for (let i = 0; i < Math.max(s.rows.length, p.rows.length); i += 1) {
    for (const col of cols) {
      const av = (s.rows[i] ?? [])[s.header.indexOf(col)];
      const pv = (p.rows[i] ?? [])[p.header.indexOf(col)];
      if (av !== pv) diffs.push({ row: i + 1, col, skill: av, prd: pv });
    }
  }
  return { skillRows: s.rows.length, prdRows: p.rows.length, diffs };
}

// TC-A04：段标记顺序 ①②②→③③④⑤（防把计划门挤到别的段之后）
export function stageOrder(skillText) {
  const t = tableAt(skillText, '出口判据');
  const idx = t.header.indexOf('段');
  const segs = t.rows.map((r) => r[idx] ?? '');
  return { segs, ok: /^①.*\| ②(?!→).*\| ②→③.*\| ③.*\| ④.*\| ⑤/.test(segs.join(' | ')) };
}

// TC-A11 / E28：每个段行必须同时含 references 指针、「已核清单」、「不得进入下一段」
export function rowLoop(skillText) {
  const t = tableAt(skillText, '出口判据');
  const bad = [];
  t.rows.forEach((r, i) => {
    const row = r.join(' | ');
    const refs = /references\/stage-[^ ，、|)]+\.md/.test(row);
    const checklist = row.includes('已核清单');
    const noEntry = row.includes('不得进入下一段');
    if (!(refs && checklist && noEntry)) bad.push({ row: i + 1, refs, checklist, noEntry });
  });
  return { rows: t.rows.length, bad };
}

// TC-A14 / E33：① 段行 ∪「过渡口径」段 内的三要素；S2 按全文判
export function transitionReport(skillText) {
  const t = tableAt(skillText, '出口判据');
  const firstRow = t.rows.find((r) => (r[0] ?? '').startsWith('①')) ?? [];
  let para = '';
  const pi = t.lines.findIndex((l) => l.includes('过渡口径'));
  if (pi > -1) {
    for (let k = pi; k < t.lines.length && k < pi + 7; k += 1) {
      if (k > pi && (t.lines[k] === '' || t.lines[k].startsWith('|'))) break;
      para = `${para} ${t.lines[k]}`;
    }
  }
  const scope = `${firstRow.join(' | ')} ${para}`;
  const kws = ['用户签字', '代拟', '代拟者不签字'];
  return {
    hits: kws.map((w) => scope.includes(w)),
    missing: kws.filter((w) => !scope.includes(w)),
    hasRow: firstRow.length > 0,
    hasPara: para.length > 0,
    hasS2: /S2/.test(skillText),
  };
}

// TC-A02 / E02 / E03：references 文件名全集比对（恰 7 份，双向）
export const REF_FILES = [
  'stage-1-prd.md', 'stage-2-tech-design.md', 'stage-2b-plan-gate.md',
  'stage-3-implementation.md', 'stage-4-quality.md', 'stage-5-delivery.md', 'gate-record-template.md',
];
export function refsReport(names) {
  return {
    count: names.length,
    missing: REF_FILES.filter((x) => !names.includes(x)),
    extra: names.filter((x) => !REF_FILES.includes(x)),
    exact: names.length === REF_FILES.length && REF_FILES.every((x) => names.includes(x)),
  };
}

// TC-A05 / A08：段文档必备小节与三权口径
export function missingSections(text, heads = ['入口', '出口', '谁签', '三权', '漏项']) {
  return heads.filter((h) => !text.includes(h));
}
export function missingPowers(text) {
  return ['申报', '定性', '核对'].filter((k) => !text.includes(k));
}

// 计划门的三行「现行命令」（R9②：`live` 的唯一定义 = 文档逐字包含这三行）
export const LIVE_COMMANDS = [
  'node scripts/check-plan.mjs coverage --plan <plan 文件> --prd <PRD 文件> --stage <S#>',
  'node scripts/check-plan.mjs deps --plan <plan 文件>',
  'node scripts/check-plan.mjs map --plan <plan 文件>',
]

// TC-A09 / E24 / E26：计划门「判据 + 二选一证据」
// R9②：通过条件由 `manual + preScript + commands ≥ 3` 改为 `live`；后三字段**保留、均不再是条件**
// （删字段会让另一条断言 TypeError），`audit` / `criteria` / `evidence` / `signWithOutput` 四标志原判。
export function planGateReport(text) {
  return {
    checks: ['功能点全覆盖', '依赖无环', '一一映射'].map((w) => text.includes(w)),
    commands: (text.match(/\bnode\s+\S+/g) ?? []).length,
    manual: /手工核对/.test(text),
    preScript: /脚本上线前|脚本未落地|归 S4/.test(text),
    live: LIVE_COMMANDS.every((c) => text.includes(c)),
    audit: /审计/.test(text),
    criteria: (text.match(/判据/g) ?? []).length,
    evidence: (text.match(/证据/g) ?? []).length,
    signWithOutput: /签字[\s\S]{0,80}(输出|结论|核对)|(输出|结论|核对)[\s\S]{0,80}签字/.test(text),
  };
}

// TC-E01：出口判据格禁形容词 + 每格非空
export function exitWordReport(skillText) {
  const t = tableAt(skillText, '出口判据');
  const idx = t.header.indexOf('出口判据');
  const cells = t.rows.map((r) => r[idx] ?? '');
  const bad = ['质量达标', '符合要求', '尽量', '完善', '合理', '比较好'];
  return { count: cells.length, hits: cells.filter((x) => bad.some((w) => x.includes(w))), short: cells.filter((x) => x.length < 4) };
}

// 取「## 名称」到下一个 `## ` 之间的正文
export function section(text, name) {
  const i = text.indexOf(`## ${name}`);
  if (i < 0) return '';
  const j = text.indexOf('## ', i + 3);
  return text.slice(i, j < 0 ? undefined : j);
}

// TC-A07 / E31：例外节非空 + 存量豁免 + 时点，且不写「以后 / 下次」
export function ruleExceptionReport(ruleText) {
  const s = section(ruleText, '例外');
  return {
    exists: s.length > 0,
    hasStock: s.includes('存量'),
    hasPoint: /时点|具体日期|可核事件/.test(s),
    longEnough: s.trim().length > 20,
    vague: /以后|下次/.test(s),
  };
}

// TC-A07：验证节两条可粘贴命令
export function ruleVerifyReport(ruleText) {
  const i = ruleText.indexOf('## 验证');
  const s = i > -1 ? ruleText.slice(i) : '';
  return {
    // 「可粘贴命令」= **独占一行**、以 node 开头的单行反引号命令；排除禁用形态 `node -e`。
    // 旧实现只认 `node -e`（内联形式）；第一轮放宽成「任意反引号 node …」又太松——散文里提及一条
    // 命令就能凑数（第二轮审查 P1）。这里两头收紧：独占一行 + 排除 `-e`。
    commands: (s.match(/^`node (?!-e\b)[^`]*`$/gm) ?? []).length,
    signDiff: /签字人[\s\S]{0,40}申报人/.test(s),
    splitting: /拆 spec 中/.test(s),
  };
}

// TC-E04：规则不得复制 PRD 判据正文（禁句零命中）+ 出处引用 ≥ 6
export function ruleCopyReport(ruleText) {
  const banned = ['功能点清单与流程图双向一一对应', 'spec + testcase 一件齐', '功能点全覆盖 / 依赖无环', '交付审计（含数字签字项）'];
  return { bannedHits: banned.filter((s) => ruleText.includes(s)), prdRefs: (ruleText.match(/PRD §/g) ?? []).length };
}

export function ruleHeadings(ruleText) {
  return ['适用范围', '冲突裁决', '例外', '触发时机', '验证'].map((h) => new RegExp(`^##\\s*${h}`, 'm').test(ruleText));
}
export function ruleItems(ruleText) {
  return [1, 2, 3, 4, 5, 6, 7].map((i) => new RegExp(`R${i}(?![0-9])`).test(ruleText));
}

// TC-A13：SKILL.md 不得内联五段骨架小节
export function inlineHeadings(skillText) {
  return skillText.match(/^## (入口条件|出口判据|谁签|三权归属|常见漏项)/gm) ?? [];
}

// TC-E25：裸名 reader（排除 evidence-reader / reviewer-reader）
export function bareReaderRefs(text) {
  return [...text.matchAll(/(?<!evidence-)(?<!reviewer-)reader/g)].map((m) => m.index);
}

// 文本剥离的单源口径（E03/E04 与 counterProbes 共用，禁止第二套实现）：
// stripComments 只剥行注释（用于「必须看见标题串」的判据）；stripCommentsAndStrings 连单/双引号串一起剥
export const stripComments = (l) => l.replace(/\/\/.*$/, '');
export const stripCommentsAndStrings = (l) => stripComments(l)
  .replace(/'(?:[^'\\]|\\.)*'/g, '').replace(/"(?:[^"\\]|\\.)*"/g, '');
// 档位计数判据：用剥注释、保留字符串的文本（标题是字符串，剥串会让标题里的计数逃检）；「退出码 N 档」显式排除
export const isTierCountLine = (l) => /[四五六]档/.test(stripComments(l)) && !/退出码/.test(stripComments(l));

// TC-C05~C08 / C11 / E09：12 处硬编码计数的三条探针（纯文本，供正常态与构造态共用）
export function counterProbes(files) {
  const baseline = [];   // 剥注释与引号串后仍出现 35/36/37
  const seatAssert = []; // assert.* 行内出现 14/15
  for (const [file, text] of Object.entries(files)) {
    text.split(/\r?\n/).forEach((line, i) => {
      // 行级豁免：`// counter-probe: off` 标注的行自身不参与探针（标注行必须在**同一行**写理由，
      // 避免整文件按名排除——按名排除会随新文件增长成一串补丁，正是本探针要防的形态）
      if (line.includes('counter-probe: off')) return;
      if (/(?<![0-9])(35|36|37)(?![0-9])/.test(stripCommentsAndStrings(line))) baseline.push(`${file}:${i + 1}`);
      // 边界用「非词字符」而非「非数字」：`diff14` 这类标识符里的数字不是席位计数（假阳性）
      // 先剥引号串：负例夹具把「违规写法」当字符串写在用例里，不剥会把夹具本身判成违规
      if (/(?<![\w])assert\.(equal|strictEqual|deepEqual|match|ok)\([^\r\n]*(?<![\w])(14|15)(?![\w])/.test(stripCommentsAndStrings(line))) seatAssert.push(`${file}:${i + 1}`);
    });
  }
  return { baseline, seatAssert };
}

export function readCounterFiles() {
  const dir = join(ROOT, 'tools', 'docgen', 'test');
  const out = {};
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.test.mjs'))) {
    out[f] = readFileSync(join(dir, f), 'utf8');
  }
  return out;
}

// 最小仓副本：gate 的 REPO_ROOT 由 cli 位置决定，故复制 tools + rules + agents 即可跑 gate
export function withRepoCopy(fn) {
  const dst = mkdtempSync(join(tmpdir(), 'dw-copy-'));
  // `docs/agents/**` 也是 gate 的比对面（S4 spec §7③）：副本缺它会把正常态误报 DanglingBaselineEntry
  // `tools/quality/**` 是 S1 词表单源（`card-model/vocab/*` 在 import 时读它）：副本缺它会 ENOENT
  const copyAll = () => {
    for (const rel of ['tools/docgen', 'tools/execution-matrix', 'tools/quality', 'rules', 'agents', 'docs/agents']) {
      if (!existsSync(join(ROOT, rel))) continue;
      cpSync(join(ROOT, rel), join(dst, rel), { recursive: true });
    }
  };
  try {
    // S-A-Q-4（2026-11-03 用户裁定升必修）：`S2-TC-E09` 在真实仓跑 `generate --readme --apply`，
    // `writeAll` 先在 `docs/agents/` 同目录写 `X.md.tmp-<pid>` 再 rename；`node --test` 多文件并行时，
    // 本函数可能正 `cpSync` 该目录、枚举到已消失的目录项 → 偶发 `cpSync … ENOENT`（复跑即绿）。
    // 选「失败一次后清空 dst 整轮重复制一次、两次都失败才抛」：这个复制根被 S-A / S4 / S5 / S6
    // 多条用例复用，改成逐文件容错或改写清单会同时动到那些用例的比对面。
    try {
      copyAll();
    } catch (err) {
      // 只对「竞争类」ENOENT 重试；权限 / 磁盘满 / 语法类错误重试一次也会死，直接抛才能留住真因
      if (err && err.code !== 'ENOENT') throw err;
      // 重试成功也要留痕：否则共享复制根长期带病重试，没人看得出这条分支被触发过
      process.emitWarning(`withRepoCopy: cpSync 竞争失败（${err.code}: ${err.message}），清空副本后重试一次`);
      rmSync(dst, { recursive: true, force: true });
      try {
        copyAll();
      } catch (err2) {
        // 二次失败时把首错的现场挂到 cause，别让「第一次到底撞了什么」丢在静默 catch 里
        err2.cause = err;
        throw err2;
      }
    }
    return fn(dst);
  } finally {
    rmSync(dst, { recursive: true, force: true });
  }
}

export function runCli(dir, args, env = {}) {
  const r = spawnSync(process.execPath, ['tools/docgen/cli.mjs', ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, DOCGEN_DRAFTS_DIR: join(dir, '.drafts'), ...env },
  });
  return normalizeSpawn(r, dir, args);
}

// 在副本里跑一段 ESM 片段（用于 collectGate 明细、validateAgentData 注入等）
export function runEsm(dir, code) {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: dir, encoding: 'utf8', env: { ...process.env } });
  return normalizeSpawn(r, dir, ['--input-type=module']);
}

// 子进程启动失败时 status/stdout/stderr 全为 null，调用方只会看到 'nullnull' 这类无信息断言差。
// 统一在这里抛根因（带 cwd / args），并把 stdout/stderr 归一成空串，调用方无需逐个防御。
function normalizeSpawn(r, dir, args) {
  if (r.error) {
    const e = new Error(`子进程启动失败：${r.error.code ?? r.error.message}（cwd=${dir}, args=${JSON.stringify(args)}）`);
    e.cause = r.error;
    throw e;
  }
  return { ...r, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}
