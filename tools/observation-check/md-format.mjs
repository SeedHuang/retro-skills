// 观察表 md 的固定骨架：本工具无条件写入、不含数据的行。
// 唯一来源——渲染侧（checks.mjs）据此输出，校验侧（evidence.mjs）据此判「纯结构行，不可作证据」。
// 为什么必须同源：两处各写一份，格式改一处就漂移；而漂移的后果是「自己产出的常量又能当证据」。
export const MD_BANNER = '<!-- observation-md v1 -->';
export const MD_TITLE = '# 观察表';
export const MD_OPEN_SECTION = '## 补充项';
export const MD_NONE = '无。';
export const MD_ITEMS_HEADER = '| 编号 | 结论 | 依据/理由 |';
export const MD_OPEN_HEADER = '| 对象 | 依据 | 影响 | 建议 |';

// 判据口径（PRD §4.3-5，2026-10-27 扩为四类之一）：引用命中下列任一行 → 不可作证据
export const MD_SKELETON = [MD_BANNER, MD_TITLE, MD_OPEN_SECTION, MD_NONE, MD_ITEMS_HEADER, MD_OPEN_HEADER];
