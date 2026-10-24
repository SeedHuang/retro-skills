// S1 · A 组（载体侧）+ 文档面负例：TC-A01~A14（A07 在 rule 文件）、E01/E02/E03/E10/E11/E16/E17/E21/E23/E24/E25/E26/E27/E28/E29/E30/E33
// 负例统一用「换输入文本」实现（桶 1）：判据是纯函数，注入态只换文本，不复制整仓。
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, mkdtempSync, cpSync, appendFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { checkSkillDir } from '../../../skills/skill-inspector/scripts/check.mjs';
import {
  ROOT, readRepo, tableAt, diffStageCells, stageOrder, rowLoop, transitionReport, refsReport,
  missingSections, missingPowers, planGateReport, exitWordReport, section, inlineHeadings,
  bareReaderRefs,
} from './support/dev-workflow-checks.mjs';

const SKILL = 'skills/dev-workflow/SKILL.md';
const PRD = 'docs/prd/dev-workflow-mainline/20261024073606-dev-workflow-mainline.md';
const REF_DIR = 'skills/dev-workflow/references';
const skill = readRepo(SKILL);
const prd = readRepo(PRD);
const refNames = () => readdirSync(join(ROOT, REF_DIR)).filter((x) => x.endsWith('.md')).sort();

test('TC-A01 三件载体在磁盘上', () => {
  for (const p of [SKILL, 'rules/dev-workflow-mainline.md', 'agents/evidence-reader.md']) {
    assert.equal(existsSync(join(ROOT, p)), true, `缺载体：${p}`);
  }
});

test('TC-A02 references 恰七份（双向全集）+ gate-record.md 六列表头在位', () => {
  const r = refsReport(refNames());
  assert.equal(r.count, 7, `references 应恰 7 份，实为 ${r.count}`);
  assert.deepEqual(r.missing, []);
  assert.deepEqual(r.extra, []);
  assert.equal(r.exact, true);

  const gateRecord = readRepo(`${REF_DIR}/gate-record.md`);
  for (const col of ['段', '出口判据（逐条）', '核了什么（命令输出首行 或 path:line）', '申报人', '签字人', '结论']) {
    assert.ok(gateRecord.includes(col), `gate-record.md 缺列名：${col}`);
  }
});

test('TC-A03 SKILL.md frontmatter 有 name: dev-workflow 与 description（含「不用于」）', () => {
  assert.match(skill, /^---\r?\n[\s\S]*?\r?\n---/, 'frontmatter 缺失或未闭合');
  assert.match(skill, /^name:\s*dev-workflow\s*$/m);
  assert.match(skill, /^description:\s*\S/m);
  assert.match(skill, /不用于|Do not use for/, 'description 必须写「不用于什么」');
});

test('TC-A04 段表六行，出口判据/谁签/议会三列与 PRD §4 逐格一致，段顺序 ①②②→③③④⑤，且写明门不是段', () => {
  const d = diffStageCells(skill, prd);
  assert.equal(d.skillRows, 6, '段表必须 6 行');
  assert.equal(d.prdRows, 6, 'PRD §4 段表必须 6 行（比对基准）');
  assert.deepEqual(d.diffs, [], `三列漂移：${JSON.stringify(d.diffs)}`);

  const o = stageOrder(skill);
  assert.equal(o.ok, true, `段顺序不对：${o.segs.join(' | ')}`);
  assert.match(skill, /门.{0,10}不是段|不是段.{0,10}门/, '必须写明 ②→③ 是门不是段');
});

test('TC-A05 六份 stage-*.md 必备五小节齐（gate-record.md 不在其列）', () => {
  const dir = join(ROOT, REF_DIR);
  const stages = readdirSync(dir).filter((f) => f.startsWith('stage-') && f.endsWith('.md')).sort();
  assert.equal(stages.length, 6, `stage-* 应 6 份，实为 ${stages.length}`);
  for (const f of stages) {
    const miss = missingSections(readFileSync(join(dir, f), 'utf8'));
    assert.deepEqual(miss, [], `${f} 缺小节：${miss.join(',')}`);
  }
});

test('TC-A06 两个议会插点在位，计划门显式无议会', () => {
  assert.ok(skill.includes('议会 #1'));
  assert.ok(skill.includes('议会 #2'));
  assert.ok(skill.includes('计划门'));
  assert.match(skill, /计划门[^。\n]{0,25}无议会|无议会[^。\n]{0,25}计划门|不设议会/);
});

test('TC-A08 六份 stage-*.md 都有三权归属口径（申报 / 定性 / 核对）', () => {
  const dir = join(ROOT, REF_DIR);
  for (const f of readdirSync(dir).filter((x) => x.startsWith('stage-') && x.endsWith('.md'))) {
    assert.deepEqual(missingPowers(readFileSync(join(dir, f), 'utf8')), [], `${f} 缺三权口径`);
  }
});

test('TC-A09 计划门三条核对各含「判据 + 二选一证据」，且写明脚本上线前由审计手工核对', () => {
  const r = planGateReport(readRepo(`${REF_DIR}/stage-2b-plan-gate.md`));
  assert.deepEqual(r.checks, [true, true, true], '三条核对名必须齐');
  assert.ok(r.commands >= 3, `命令原文应 ≥ 3 条，实为 ${r.commands}`);
  assert.equal(r.manual, true, '必须写「审计手工核对表」');
  assert.equal(r.preScript, true, '必须写脚本上线前的分支（S1 阶段脚本不存在）');
  assert.equal(r.audit, true);
  assert.ok(r.criteria >= 3, `「判据」应 ≥ 3 处，实为 ${r.criteria}`);
  assert.ok(r.evidence >= 3, `「证据」应 ≥ 3 处，实为 ${r.evidence}`);
  assert.equal(r.signWithOutput, true, '必须写清签字要附什么输出');
});

// 运行时就位（P-7）：机器判不了「aas sync 真把链接建到本机 home」，只能本机验。
// 在 npm run check 内默认跳过；施工者显式设 DW_RUNTIME_CHECK=1（并先跑过 aas sync）时才断言。
const RUNTIME = process.env.DW_RUNTIME_CHECK === '1';
const RUNTIME_SKIP = RUNTIME ? false : '本机运行时验：设 DW_RUNTIME_CHECK=1 并先 aas sync（不进 npm run check）';

test('TC-A10 运行时就位：两条 Test-Path 为 True（aas sync 后本机验）', { skip: RUNTIME_SKIP }, () => {
  assert.equal(existsSync(join(homedir(), '.trae-cn', 'user_rules', 'dev-workflow-mainline.md')), true);
  assert.equal(existsSync(join(homedir(), '.trae-cn', 'skills', 'dev-workflow', 'SKILL.md')), true);
});

test('TC-A11 SKILL.md 每个段行同时含 references 指针 +「已核清单」+「不得进入下一段」', () => {
  const r = rowLoop(skill);
  assert.equal(r.rows, 6);
  assert.deepEqual(r.bad, [], `以下段行缺闭环：${JSON.stringify(r.bad)}`);
});

test('TC-A12 SKILL.md 有独立的「三权总则」节与「取证调度」节', () => {
  const powers = section(skill, '三权总则');
  const evidence = section(skill, '取证调度');
  assert.ok(powers.length > 0, '缺「三权总则」节');
  assert.ok(evidence.length > 0, '缺「取证调度」节');
  assert.ok(evidence.includes('evidence-reader'), '取证调度必须点名 evidence-reader');
  assert.match(evidence, /常驻[\s\S]{0,20}每轮/, '必须写明「常驻 ≠ 每轮必跑」');
  for (const k of ['申报', '定性', '核对']) assert.ok(powers.includes(k), `三权总则缺 ${k}`);
});

test('TC-A13 SKILL.md 不内联五段骨架（入口条件/出口判据/谁签/三权归属/常见漏项 命中 0）', () => {
  assert.deepEqual(inlineHeadings(skill), []);
});

test('TC-A14 SKILL.md ① 段正文含过渡口径三要素 + S2 失效条件', () => {
  const r = transitionReport(skill);
  assert.deepEqual(r.hits, [true, true, true], `三要素缺：${r.missing.join(',')}`);
  assert.deepEqual(r.missing, []);
  assert.equal(r.hasS2, true, '必须写出失效条件（含 S2）');
});

test('TC-E01 出口判据格不得写成形容词，且每格非空', () => {
  const r = exitWordReport(skill);
  assert.equal(r.count, 6);
  assert.deepEqual(r.hits, [], `出口格出现含糊词：${r.hits.join(' ')}`);
  assert.deepEqual(r.short, [], '出口格不得为空/过短');
});

test('TC-E02 references 只有 6 份（缺 stage-2b-plan-gate）→ 全集比对必红', () => {
  const broken = refNames().filter((x) => x !== 'stage-2b-plan-gate.md');
  const r = refsReport(broken);
  assert.notEqual(r.count, 7);
  assert.deepEqual(r.missing, ['stage-2b-plan-gate.md']);
  assert.equal(r.exact, false);
});

test('TC-E03 references 多一份（stage-6-extra）→ 同样必红（恰有是双向约束）', () => {
  const r = refsReport([...refNames(), 'stage-6-extra.md'].sort());
  assert.notEqual(r.count, 7);
  assert.deepEqual(r.extra, ['stage-6-extra.md']);
  assert.equal(r.exact, false);
});

test('TC-E10 自引用带技能名前缀 → skill-inspector 必报「自引用带前缀」', () => {
  const dst = mkdtempSync(join(tmpdir(), 'dw-skill-'));
  try {
    cpSync(join(ROOT, 'skills', 'dev-workflow'), join(dst, 'dev-workflow'), { recursive: true });
    appendFileSync(join(dst, 'dev-workflow', 'SKILL.md'), '\n见 `dev-workflow/references/stage-1-prd.md`\n');
    const { findings } = checkSkillDir(dst, { manifest: { skills: ['dev-workflow'] } });
    assert.ok(findings.some((f) => f.skill === 'dev-workflow' && f.check === '自引用带前缀'), JSON.stringify(findings));
    const normal = checkSkillDir(join(ROOT, 'skills'), { manifest: { skills: [] } });
    assert.equal(normal.findings.length, 0, JSON.stringify(normal.findings.slice(0, 3)));
  } finally {
    rmSync(dst, { recursive: true, force: true });
  }
});

test('TC-E11 写对方技能内部文件路径 → 必报「跨技能路径引用」', () => {
  const dst = mkdtempSync(join(tmpdir(), 'dw-skill-'));
  try {
    cpSync(join(ROOT, 'skills', 'dev-workflow'), join(dst, 'dev-workflow'), { recursive: true });
    const p = join(dst, 'dev-workflow', 'SKILL.md');
    appendFileSync(p, '\n见 `parliament/references/submission-matrix.md`\n');
    const { findings } = checkSkillDir(dst, { manifest: { skills: ['dev-workflow', 'parliament'] } });
    assert.ok(findings.some((f) => f.check === '跨技能路径引用'), JSON.stringify(findings));
  } finally {
    rmSync(dst, { recursive: true, force: true });
  }
});

test('TC-E16 SKILL.md 为空或缺 frontmatter → markdown 检查必红', () => {
  // check-all 的 frontmatter 判据是内联正则（无法 import），此处用同口径正则 + 守卫存在性双判
  const FM = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;
  assert.equal(FM.test(''), false, '空文件不得被当成有 frontmatter');
  assert.equal(FM.test('# 只有标题\n'), false);
  const checkAll = readRepo('scripts/check-all.mjs');
  assert.ok(checkAll.includes('frontmatter 缺失或未闭合'), 'markdown 检查必须保有该报错');
  assert.ok(checkAll.includes('FM_RE'), 'frontmatter 判据必须仍在 check-all 内联定义');
});

test('TC-E17 SKILL.md 带 UTF-8 BOM → markdown 检查必红', () => {
  const buf = Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), Buffer.from(skill, 'utf8')]);
  assert.equal(buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF, true, '构造态确实带 BOM');
  const checkAll = readRepo('scripts/check-all.mjs');
  assert.ok(checkAll.includes('文件带 UTF-8 BOM'), 'BOM 检查必须仍在 check-all 内');
  assert.ok(readFileSync(join(ROOT, SKILL)).subarray(0, 3).compare(Buffer.from([0xEF, 0xBB, 0xBF])) !== 0, '正常态不得带 BOM');
});

test('TC-E21 段表任一格改回旧措辞 → diff cells ≥ 1 且点名该格', () => {
  assert.deepEqual(diffStageCells(skill, prd).diffs, [], '正常态必须零漂移');
  const cases = [
    ['**无议会**', '**无**', '无'],
    ['§0 四栏齐 + 依据可核；', '§0 四栏齐 + 依据可核，', '，'],
    ['功能点全覆盖 / 依赖无环 / 功能块↔testcase 一一映射', '任务↔testcase 一一映射', '任务↔testcase 一一映射'],
    ['施工完成、`npm run check` 绿', '测试绿', '测试绿'],
  ];
  for (const [from, to, expect] of cases) {
    assert.ok(skill.includes(from), `构造前提不成立：找不到「${from}」`);
    const mutated = skill.replace(from, to);
    assert.notEqual(mutated, skill);
    const d = diffStageCells(mutated, prd);
    assert.ok(d.diffs.length >= 1, `构造未引起 diff：${from} → ${to}`);
    assert.ok(d.diffs.some((x) => (x.skill ?? '').includes(expect)), `DIFF 未点名被改的格：${JSON.stringify(d.diffs)}`);
  }
});

test('TC-E23 三份 README 的技能与规则数量都不写死，且新条目在位', () => {
  const bad = /([一二三四五六七八九十百]{2,}个技能)|([一二三四五六七八九十百]{2,}条)|(技能[^。\r\n]{0,6}[（(][一二三四五六七八九十百]{2,}个)|([0-9]+\s*个技能)|([0-9]+\s*条规则)/;
  for (const p of ['README.md', 'docs/guide/skills/README.md', 'docs/guide/rules/README.md']) {
    const t = readRepo(p);
    const m = t.match(bad);
    assert.equal(m, null, `${p} 仍写死数量：${m ? m[0] : ''}`);
  }
  assert.ok(readRepo('README.md').includes('dev-workflow'));
  assert.ok(readRepo('docs/guide/skills/README.md').includes('dev-workflow'));
  assert.ok(readRepo('docs/guide/rules/README.md').includes('dev-workflow-mainline'));

  const manifest = JSON.parse(readRepo('skilldependencies/manifest.json'));
  const sections = [...readRepo('docs/guide/skills/README.md').matchAll(/^### \d+\. /gm)].length;
  assert.equal(manifest.skills.length, sections, 'manifest 技能数须与技能指南节数一致（两边都派生，不写死）');
});

test('TC-E24 计划门文档退化成「见 PRD §6」指针 → 判据必红', () => {
  const gateDoc = readRepo(`${REF_DIR}/stage-2b-plan-gate.md`);
  const i = gateDoc.indexOf('## 出口判据');
  const j = gateDoc.indexOf('## 谁签');
  assert.ok(i > -1 && j > i, '正常态应有出口判据节');
  const degraded = `${gateDoc.slice(0, i)}# 计划门\n\n## 出口判据\n\n计划门判据见 PRD §6。\n\n${gateDoc.slice(j)}`;
  const r = planGateReport(degraded);
  const ok = r.commands >= 3 && r.manual && r.criteria >= 3 && r.evidence >= 3;
  assert.equal(ok, false, `退化态不应同时满足四项：${JSON.stringify(r)}`);
});

test('TC-E25 裸名 reader 不存在、且 SKILL.md / 规则里没有裸名派单引用', () => {
  assert.equal(existsSync(join(ROOT, 'agents', 'reader.md')), false);
  assert.equal(readdirSync(join(ROOT, 'agents')).filter((x) => /^reader\.md$/.test(x)).length, 0);
  assert.deepEqual(bareReaderRefs(skill), [], 'SKILL.md 出现裸名 reader');
  assert.deepEqual(bareReaderRefs(readRepo('rules/dev-workflow-mainline.md')), [], '规则出现裸名 reader');
});

test('TC-E26 计划门只写命令、删掉「上线前手工核对」说明 → 手工核对计数为 0（强信号）', () => {
  const gateDoc = readRepo(`${REF_DIR}/stage-2b-plan-gate.md`);
  assert.ok((gateDoc.match(/手工核对/g) ?? []).length >= 1, '正常态必须有手工核对说明');
  const stripped = gateDoc
    .split(/\r?\n/)
    .filter((l) => !/手工核对|脚本上线前|脚本未落地|归 S4/.test(l))
    .join('\n');
  const r = planGateReport(stripped);
  assert.equal(r.manual, false, '构造态应已无「手工核对」');
});

test('TC-E27 只写源不 aas sync → 本机 Test-Path 为 False（探针式，不碰 dev-workflow 本体）', { skip: RUNTIME_SKIP }, () => {
  const probe = join(homedir(), '.trae-cn', 'user_rules', 'tmp-e27-unsynced.md');
  assert.equal(existsSync(probe), false, '探针文件不应存在（E27 收尾必须复位）');
});

test('TC-E28 某段行改成纯指针 → A11 判据点名该行缺两项', () => {
  const t = tableAt(skill, '出口判据');
  const firstStageRow = t.index + 2;
  const lines = skill.split(/\r?\n/);
  assert.ok(lines[firstStageRow].includes('已核清单'), '构造前提：第一段行应含已核清单');
  lines[firstStageRow] = '| ① | PRD | 判据见 references/stage-1-prd.md | §0 四栏齐 + 依据可核；功能点清单与流程图双向一一对应 | 产品经理 + 用户；审计核 §0 | **议会 #1** |';
  const r = rowLoop(lines.join('\n'));
  assert.ok(r.bad.length >= 1, '纯指针行必须被判红');
  const bad = r.bad[0];
  assert.equal(bad.row, 1);
  assert.equal(bad.refs, true, '指针里仍有 references → 只查指针会判绿（F17 形态）');
  assert.equal(bad.checklist, false);
  assert.equal(bad.noEntry, false);
});

test('TC-E29 删掉「三权总则」节或「取证调度」节 → 必红', () => {
  const cut = (name) => {
    const i = skill.indexOf(`## ${name}`);
    const j = skill.indexOf('## ', i + 3);
    return skill.slice(0, i) + skill.slice(j < 0 ? skill.length : j);
  };
  const a = cut('三权总则');
  assert.equal(section(a, '三权总则').length, 0);
  assert.ok(section(a, '取证调度').length > 0, '另一节应仍在（单一构造只红一处）');
  const b = cut('取证调度');
  assert.equal(section(b, '取证调度').length, 0);
  assert.ok(section(b, '三权总则').length > 0);
});

test('TC-E30 议会有 P0 未清而出口齐 → SKILL.md 同段写清「议会通过」与「不得进入下一段」', () => {
  assert.match(skill, /议会通过[\s\S]{0,160}不得进入下一段|不得进入下一段[\s\S]{0,160}议会通过/);
  assert.match(skill, /P0/);
});

test('TC-E33 ① 段删掉「代拟者不签字」→ 三命中变两命中，S2 仍在', () => {
  assert.match(transitionReport(skill).hits.join(','), /true,true,true/);
  const mutated = skill.split('代拟者不签字').join('');
  assert.notEqual(mutated, skill, '构造必须真的删掉该要素');
  const r = transitionReport(mutated);
  assert.deepEqual(r.hits, [true, true, false]);
  assert.deepEqual(r.missing, ['代拟者不签字']);
  assert.equal(r.hasS2, true, 'S2 不应被连带删除（证明红只来自三要素）');
});
