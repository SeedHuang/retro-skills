// 证据可解析：路径白名单 + 存在性 + 行号 + 引用命中 + 引用长度
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkEvidence } from './evidence.mjs';

const dir = mkdtempSync(join(tmpdir(), 'ev-'));
writeFileSync(join(dir, 'a.md'), ['# 标题', '', '第二行有  多余空格  的句子', '第三行'].join('\n'), 'utf8');

// 长度专项：第 1 行短标题、第 2 行长句、第 3/4 行极短行
const LONG = '这一行是一段很长的说明文字，用来验证短片段即使命中也会因为占比过低而被拒绝。';
writeFileSync(join(dir, 'len.md'), ['# 角色：侦探（独立观察）', LONG, '## 三态', '###'].join('\n'), 'utf8');

const chk = (ev) => checkEvidence(ev, { root: dir });

test('正例：路径存在 + 行号正确 + 引用命中（含空白归一）', () => {
  const r = chk({ path: 'a.md', line: 3, quote: '第二行有 多余空格 的句子' });
  assert.equal(r.ok, true);
});

test('正例：真实仓库文件可解析（默认根 = 当前目录）', () => {
  const r = checkEvidence({ path: 'agents/detective-observer.md', line: 7, quote: '# 角色：侦探' });
  assert.equal(r.ok, true);
});

test('反例：文件不存在 → EvidenceNotFound', () => {
  const r = chk({ path: 'nope.md', line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidenceNotFound');
});

test('反例：行号超出 → EvidenceLineOutOfRange', () => {
  const r = chk({ path: 'a.md', line: 99, quote: 'x' });
  assert.equal(r.code, 'EvidenceLineOutOfRange');
});

test('反例：该行不含引用 → EvidenceQuoteMismatch', () => {
  const r = chk({ path: 'a.md', line: 4, quote: '第二行' });
  assert.equal(r.code, 'EvidenceQuoteMismatch');
});

test('反例：evidence 是字符串（旧写法）→ InvalidFieldType', () => {
  const r = chk('a.md:12');
  assert.equal(r.code, 'InvalidFieldType');
});

test('反例：line 是字符串 "3" → InvalidFieldType', () => {
  const r = chk({ path: 'a.md', line: '3', quote: 'x' });
  assert.equal(r.code, 'InvalidFieldType');
});

test('反例：quote 全是空白 → InvalidFieldType', () => {
  const r = chk({ path: 'a.md', line: 1, quote: '   ' });
  assert.equal(r.code, 'InvalidFieldType');
});

// —— 路径白名单 ——

test('反例：绝对路径 → EvidencePathAbsolute', () => {
  const r = chk({ path: join(dir, 'a.md'), line: 3, quote: '第二行有 多余空格 的句子' });
  assert.equal(r.code, 'EvidencePathAbsolute');
});

test('反例：盘符相对路径 "C:a.md" → EvidencePathAbsolute', () => {
  const r = chk({ path: 'C:a.md', line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidencePathAbsolute');
});

test('反例：UNC 路径 → EvidencePathAbsolute', () => {
  const r = chk({ path: '\\\\server\\share\\a.md', line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidencePathAbsolute');
});

test('反例：../ 逃出根目录 → EvidencePathOutside', () => {
  const r = chk({ path: '../a.md', line: 1, quote: 'x' });
  assert.equal(r.code, 'EvidencePathOutside');
});

test('正例：路径含 .. 但解析后仍在根内 → 正常解析（不过度拒绝）', () => {
  const r = chk({ path: 'sub/../a.md', line: 3, quote: '第二行有 多余空格 的句子' });
  assert.equal(r.ok, true);
});

test('反例：path 指向目录 → EvidenceUnreadable（不抛异常）', () => {
  const r = chk({ path: '.', line: 1, quote: '这一行是一段很长的说明文字' });
  assert.equal(r.code, 'EvidenceUnreadable');
});

// —— 引用长度 ——

test('反例：单字引用（该行确实含有）→ EvidenceQuoteTooShort', () => {
  const r = chk({ path: 'len.md', line: 2, quote: '的' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('反例：4 字片段但只占长行一小截 → EvidenceQuoteTooShort', () => {
  const r = chk({ path: 'len.md', line: 2, quote: '说明文字' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('反例：9 字片段（差 1 字到绝对下限、占比也低）→ EvidenceQuoteTooShort', () => {
  const r = chk({ path: 'len.md', line: 2, quote: '这一行是一段很长的' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('正例：恰好 10 字（绝对下限边界，占比低也放行）', () => {
  const r = chk({ path: 'len.md', line: 2, quote: '这一行是一段很长的说' });
  assert.equal(r.ok, true);
});

test('正例：短标题片段占该行一半以上 → 放行（不逼迫凑字）', () => {
  const r = chk({ path: 'len.md', line: 1, quote: '# 角色：侦探' });
  assert.equal(r.ok, true);
});

test('正例：极短行整行引用（5 字）→ 放行', () => {
  const r = chk({ path: 'len.md', line: 3, quote: '## 三态' });
  assert.equal(r.ok, true);
});

test('反例：极短行整行引用但不足 4 字（"###"）→ EvidenceQuoteTooShort', () => {
  const r = chk({ path: 'len.md', line: 4, quote: '###' });
  assert.equal(r.code, 'EvidenceQuoteTooShort');
});

test('反例：太短且不在行内 → 先报 EvidenceQuoteMismatch（不报太短）', () => {
  const r = chk({ path: 'len.md', line: 2, quote: 'zzz' });
  assert.equal(r.code, 'EvidenceQuoteMismatch');
});
