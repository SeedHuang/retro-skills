// 唯一入口：读 json → 结构校验 → 证据可解析 → 读 md → 渲染一致
// 设计：结构错时不跑渲染比对（避免级联噪声）；结构通过才比 md
import { existsSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { validateObservation, checkRendered, renderObservation } from './checks.mjs';

export function validateArtifact(jsonPath, { mdPath = null, registeredIds = [], root = process.cwd() } = {}) {
  const errors = [];

  if (!existsSync(jsonPath)) {
    return { ok: false, errors: [{ code: 'JsonNotFound', message: `json 不存在：${jsonPath}` }] };
  }

  let doc;
  try {
    doc = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    return { ok: false, errors: [{ code: 'InvalidJson', message: `JSON 解析失败：${e.message}` }] };
  }

  // 结构 + 证据可解析（第二参传 {} 表示"读盘校验"生效）
  const structural = validateObservation(doc, { registeredIds, resolveEvidence: { root } }).errors;
  errors.push(...structural);

  if (mdPath) {
    if (!existsSync(mdPath)) {
      errors.push({ code: 'MdMissing', message: `md 不存在：${mdPath}` });
    } else if (structural.length === 0) {
      const r = checkRendered(doc, readFileSync(mdPath, 'utf8'));
      if (!r.ok) errors.push({ code: r.code, message: r.detail });
    }
  }

  return { ok: errors.length === 0, errors };
}

// 便于 CI 使用：返回退出码（0 = 全过）
export function validateArtifactExitCode(jsonPath, opts) {
  return validateArtifact(jsonPath, opts).ok ? 0 : 1;
}

// 原子写：先写临时文件再 rename，避免读方看到半截
function atomicWrite(path, content) {
  const tmp = `${path}.tmp-${process.pid}`;
  writeFileSync(tmp, content, 'utf8');
  renameSync(tmp, path);
}

// 写盘唯一入口：先校验，不通过就一个字都不写
export function writeObservation(doc, { jsonPath, mdPath, registeredIds = [], root = process.cwd() }) {
  const errors = validateObservation(doc, { registeredIds, resolveEvidence: { root } }).errors;
  if (errors.length > 0) return { ok: false, wrote: false, errors };

  atomicWrite(jsonPath, `${JSON.stringify(doc, null, 2)}\n`);
  atomicWrite(mdPath, renderObservation(doc));
  return { ok: true, wrote: true, errors: [] };
}
