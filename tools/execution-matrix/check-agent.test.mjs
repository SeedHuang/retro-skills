// check-agent.test.mjs —— A 组检查：A3-A7 结构断言（存在性+语义）+ A1/A2/B/C 十键三态机械接收
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAgent, checkAgentFile, checkAgentFromText, checkSemantic, judgeAnnotation, splitSections, SEMANTIC_KEYS } from './check-agent.mjs';

test('reviewer-audit 渲染卡：A 结构项 A3-A7 全过', () => {
  const { ok, findings } = checkAgent('reviewer-audit');
  assert.equal(ok, true, JSON.stringify(findings));
});

test('缺必答清单卡 → A3 判失败', () => {
  const card = '---\nname: x\n---\n\n# 角色：X\n\n## 你是谁\nX。\n';
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A3'));
});

test('A1/A2 走 annotations 接收（非脚本内机器判）', () => {
  const { a1a2From } = checkAgent('reviewer-audit');
  assert.equal(a1a2From, 'annotations'); // 必须读 .inspector-annotations.json，不得脚本自判
});

// —— Task 9 Ruling E 补扩：TC-011 缺边界节 → A6、TC-012 缺输出格式 → A7、
//    TC-015 有清单无闭环 → A4、TC-016 无证据约束 → A5（构造卡只用 checkAgentFromText）

test('缺边界节卡 → A6 判失败', () => {
  const card = '---\nname: x\n---\n\n# 角色：X\n\n## 你是谁\nX。\n\n## 固定必问清单\n| # | 必问 | 回答 |\n|---|---|---|\n| 1 | 你的判据 | 待答 |\n\n缺答 = 不合格。\n';
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A6'));
});

test('缺输出格式节卡 → A7 判失败', () => {
  const card = '---\nname: x\n---\n\n# 角色：X\n\n## 你是谁\nX。\n\n## 固定必问清单\n| # | 必问 | 回答 |\n|---|---|---|\n| 1 | 你的判据 | 待答 |\n\n缺答 = 不合格。\n\n## 边界\n不做什么。\n';
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A7'));
});

test('有清单无闭环卡 → A4 判失败', () => {
  const card = '---\nname: x\n---\n\n# 角色：X\n\n## 你是谁\nX。\n\n## 固定必问清单\n| # | 必问 | 回答 |\n|---|---|---|\n| 1 | 你的判据 | 待答 |\n';
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A4'));
});

test('无证据约束卡 → A5 判失败', () => {
  const card = '---\nname: x\n---\n\n# 角色：X\n\n## 你是谁\nX。\n\n## 固定必问清单\n| # | 必问 | 回答 |\n|---|---|---|\n| 1 | 你的判据 | 待答 |\n\n缺答 = 不合格。\n\n## 边界\n不做什么。\n\n## 输出格式\n表格。\n';
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A5'));
});

// —— F2：判定词改「存在性 + 语义」（模板形态适配）+ 真卡路径 ——

test('F2：senior-sdet 真卡（手写模板）A3 不红——判定词不按逐字节节名', () => {
  const { findings } = checkAgentFile('senior-sdet');
  assert.ok(!findings.some((f) => f.code === 'A3'), 'A3 应按「卡内有必答/必问列头表格」判，不按节名逐字匹配');
});

test('F2：senior-sdet 真卡 A3-A7 结构项全绿（存量红项清单只含未判语义项）', () => {
  const { findings } = checkAgentFile('senior-sdet');
  const struct = findings.filter((f) => ['A3', 'A4', 'A5', 'A6', 'A7'].includes(f.code));
  assert.equal(struct.length, 0, JSON.stringify(struct));
});

test('F2：senior-sdet 真卡存量红项清单可枚举（语义项为 pending，按三态判红）', () => {
  const { findings } = checkAgentFile('senior-sdet');
  const semantic = findings.filter((f) => SEMANTIC_KEYS.includes(f.code));
  assert.equal(semantic.length, 10);
  assert.ok(semantic.every((f) => f.state === 'pending'));
});

test('F2：真卡路径读的是 agents/<name>.md 文件（非 renderByName 桩）', () => {
  const { ok, findings } = checkAgentFile('senior-sdet');
  assert.equal(ok, false);                       // 语义项未判 → 不通过
  assert.ok(findings.length > 0);
  const missing = checkAgentFile('__不存在的卡__');
  assert.ok(missing.findings.some((f) => f.code === 'CardNotFound'));
});

// —— G1：锁定 criteria.md §0.5「节内优先、整卡兜底」口径 ——
// ⚠ 这两条断言绿**不是漏检**，而是口径已明示：整卡兜底是防误伤的必要设计（严格限节内会把
//   senior-sdet 这类「字样写在相邻节」的合规卡判红 = 判据误伤）。用例名写明口径，避免后人误读成「A4/A5 可被绕过」。

test('G1：闭环字样只在无关节（自由探索节）→ A4 仍绿（节内优先 + 整卡兜底口径，非漏检）', () => {
  const card = [
    '---', 'name: x', '---', '',
    '# 角色：X', '',
    '## 你是谁', 'X。', '',
    '## 固定必问清单', '| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 你的判据 | 待答 |', '',
    '## 自由探索（必做）', '固定清单之外再找 3 个盲点。只答固定清单 = 不合格。', '',
    '## 通用纪律', '- 证据可复算：引用文件:行号。', '',
    '## 边界', '不做什么。', '',
    '## 输出格式', '表格。', '',
  ].join('\n');
  const { findings, notes } = checkAgentFromText(card);
  assert.ok(!findings.some((f) => f.code === 'A4'), 'A4 应按「节内未命中则退回整卡」判绿（criteria.md §0.5）');
  assert.ok(notes.some((n) => n.startsWith('A4:') && n.includes('节外')), `应记录整卡兜底命中位置，实际 notes=${JSON.stringify(notes)}`);
});

test('G1：证据字样只在无关节（输出格式节）→ A5 仍绿（节内优先 + 整卡兜底口径，非漏检）', () => {
  const card = [
    '---', 'name: x', '---', '',
    '# 角色：X', '',
    '## 你是谁', 'X。', '',
    '## 固定必问清单', '| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 你的判据 | 待答 |', '',
    '缺答 = 不合格。', '',
    '## 边界', '不做什么。', '',
    '## 输出格式', '表格；证据栏空 = 不通过，不是待补。', '',
  ].join('\n');
  const { findings, notes } = checkAgentFromText(card);
  assert.ok(!findings.some((f) => f.code === 'A5'), 'A5 应按「节内未命中则退回整卡」判绿（criteria.md §0.5）');
  assert.ok(notes.some((n) => n.startsWith('A5:') && n.includes('节外')), `应记录整卡兜底命中位置，实际 notes=${JSON.stringify(notes)}`);
});

// —— F3：B/C 八键进入机械接收 + 三态判红稳健化 ——

test('F3：B/C 八键同样从 annotations 机械接收（缺键按 pending 报红）', () => {
  const findings = checkSemantic({}, 'some-agent');
  assert.equal(findings.length, 10);
  assert.ok(findings.every((f) => f.state === 'pending'));
  const keys = findings.map((f) => f.code).sort();
  assert.deepEqual(keys, [...SEMANTIC_KEYS].sort());
});

test('F3：三态判定——pass 绿 / fail 红 / pending 红', () => {
  assert.equal(judgeAnnotation('pass').red, false);
  assert.equal(judgeAnnotation('fail: 缺证据').red, true);
  assert.equal(judgeAnnotation('pending').red, true);
});

test('F3：大小写不敏感——FAIL: x 也判红', () => {
  const v = judgeAnnotation('FAIL: x');
  assert.equal(v.red, true);
  assert.equal(v.code, null);                    // 属 fail 类，不是无效值
});

test('F3：非字符串判定值（布尔/数字/null）→ 报红并标 InvalidAnnotation', () => {
  for (const raw of [true, false, 1, 0, null]) {
    const v = judgeAnnotation(raw);
    assert.equal(v.red, true, `值 ${JSON.stringify(raw)} 应报红`);
    assert.equal(v.code, 'InvalidAnnotation');
  }
});

test('F3：未知判定值（既非 pass/fail/pending）→ 报红并标 InvalidAnnotation', () => {
  const v = judgeAnnotation('maybe');
  assert.equal(v.red, true);
  assert.equal(v.code, 'InvalidAnnotation');
});

test('F3：非字符串判定值在 annotations 接收层同样报红（不许静默放行）', () => {
  const ann = { 'x:B1': true, 'x:C4': 'pass' };
  const findings = checkSemantic(ann, 'x');
  // B1 = 布尔 → InvalidAnnotation；C4 = pass → 绿；其余 8 键缺键 → pending（红）
  assert.equal(findings.length, 9);
  const invalid = findings.find((f) => f.code === 'InvalidAnnotation');
  assert.ok(invalid);
  assert.equal(invalid.key, 'x:B1');
  assert.ok(!findings.some((f) => f.key === 'x:C4'));
});

// —— A3 围栏隔离：代码围栏里的示例表不得被当成真实「必答清单」——

test('A3：无真实清单、只在 ``` 围栏内有示例表 → 仍判 A3 失败（围栏内表格不算）', () => {
  const card = [
    '---', 'name: x', '---', '',
    '# 角色：X', '',
    '## 你是谁', 'X。', '',
    '## 示例（不是清单）', '```markdown', '| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 示例问题 | 示例答案 |', '```', '',
    '## 通用纪律', '- 缺答 = 不合格；证据可复算。', '',
    '## 边界', '不做什么。', '',
    '## 输出格式', '表格。', '',
  ].join('\n');
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A3'), '围栏内的示例表被当真实清单 = A3 假通过');
});

test('A3：围栏外有真实清单表 + 围栏内有示例表 → A3 通过（只认真实表格）', () => {
  const card = [
    '---', 'name: x', '---', '',
    '# 角色：X', '',
    '## 固定必问清单', '| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 你的判据 | 待答 |', '',
    '```markdown', '| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 示例 | 示例 |', '```', '',
    '缺答 = 不合格。', '证据可复算。', '',
    '## 边界', '不做什么。', '',
    '## 输出格式', '表格。', '',
  ].join('\n');
  const { findings } = checkAgentFromText(card);
  assert.ok(!findings.some((f) => f.code === 'A3'));
});

// —— A6/A7 围栏隔离：围栏里的示例标题不得被当成真实节 ——

test('A6/A7：无真实边界/输出格式节、只在 ``` 围栏内有示例标题 → 仍判 A6/A7 失败', () => {
  const card = [
    '---', 'name: x', '---', '',
    '# 角色：X', '',
    '## 你是谁', 'X。', '',
    '## 固定必问清单', '| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 你的判据 | 待答 |', '',
    '缺答 = 不合格。证据可复算。', '',
    '## 模板样例（不是本卡结构）', '```markdown', '## 边界', '示例：只读。', '', '## 输出格式', '示例：表格。', '```', '',
  ].join('\n');
  const { findings } = checkAgentFromText(card);
  assert.ok(findings.some((f) => f.code === 'A6'), '围栏内的示例标题被当成真实「边界」节 = A6 假通过');
  assert.ok(findings.some((f) => f.code === 'A7'), '围栏内的示例标题被当成真实「输出格式」节 = A7 假通过');
});

test('A6/A7：围栏外有真实节 + 围栏内也有示例标题 → 判通过（只认真实节）', () => {
  const card = [
    '---', 'name: x', '---', '',
    '# 角色：X', '',
    '## 固定必问清单', '| # | 必问 | 回答 |', '|---|---|---|', '| 1 | 你的判据 | 待答 |', '',
    '缺答 = 不合格。证据可复算。', '',
    '## 边界', '不做什么。', '',
    '## 输出格式', '表格。', '',
    '```markdown', '## 边界', '示例。', '```', '',
  ].join('\n');
  const { findings } = checkAgentFromText(card);
  assert.ok(!findings.some((f) => f.code === 'A6'));
  assert.ok(!findings.some((f) => f.code === 'A7'));
});

test('splitSections 跳过围栏内的伪标题（围栏内 ## 不产生节）', () => {
  const card = ['## 真节', '正文。', '```', '## 伪节', '```', '## 末尾节', '正文。'].join('\n');
  const headings = splitSections(card).map((s) => s.heading).filter(Boolean);
  assert.deepEqual(headings, ['真节', '末尾节']);
});
