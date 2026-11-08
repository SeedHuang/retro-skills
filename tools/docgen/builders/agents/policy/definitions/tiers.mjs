// 档位表（spec §3.2，自 S5 下沉到定义层）：四档一个不少，值是**工具名**（不是 capability ID）。
// `patternRegistry.tools` 必须是本对象的同一引用（re-export，不深拷贝、不改名）。
import { capabilities } from './capabilities.mjs';

export const TIERS = {
  readOnly: ['Read', 'Glob', 'Grep'],
  sdet: ['Read', 'Glob', 'Grep', 'Write', 'Edit'],
  command: ['Read', 'Glob', 'Grep', 'RunCommand'],
  producer: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'],
};

// 集合相等用的规范键：去重 + 排序后连接（顺序不参与相等）
const setKey = (names) => [...new Set(names)].sort().join(',');

// 「caps 按 capabilities.mjs 展开后的工具**集合** == TIERS[档]」的唯一样（spec:53「工具集」，故按集合比、不按序）；
// 无匹配返回 undefined。
export function tierOfCapabilities(caps) {
  const tools = caps.flatMap((c) => capabilities[c]);
  const key = setKey(tools);
  return Object.keys(TIERS).find((t) => setKey(TIERS[t]) === key);
}
