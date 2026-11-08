// 禁写路径（spec §3.2）：6 组，19 个项对象；每项 `{id, text}`，`id` 供按席排除引用、`text` 供卡面/纯度判定。
// `代码` / `测试` 拆成两项（`code.src` / `code.test`），使「测试」可单独排除而不放开「代码」。
// `spec / plan` 以 pattern 项表达、不进数组（否则 `spec/plan` 无空格写法会假红）。
// 检测盲区是**独立导出**、不进 `pathGroups`（故不进 ③ 段禁写清单）。
// Q8（2026-11-03，PRD §3）：删本仓专属的 3 项（`lessons/` / `skills-lock.json` / `tools/docgen-spike/.tmp-test/`），
// 使「通用角色卡」不含项目专属内容；`DETECTION_BLIND_SPOTS` 里的 `lessons/` 属「检测限度」段，保留不动。
export const pathGroups = {
  code: [
    { id: 'code.src', text: '代码' },
    { id: 'code.test', text: '测试' },
  ],
  governance: [
    { id: 'rules', text: 'rules/' },
    { id: 'skills', text: 'skills/' },
    { id: 'agents', text: 'agents/' },
  ],
  'docs.input': [
    { id: 'docs.prd', text: 'docs/prd/' },
  ],
  build: [
    { id: 'tools', text: 'tools/' },
    { id: 'scripts', text: 'scripts/' },
    { id: 'config', text: '配置与依赖清单' },
  ],
  ledger: [
    { id: 'docs.after', text: 'docs/after/' },
    { id: 'docs.handoffs', text: 'docs/handoffs/' },
    { id: 'docs.reports', text: 'docs/reports/' },
    { id: 'docs.retro', text: 'docs/superpowers/retro/' },
  ],
  workspace: [
    { id: 'superpowers', text: '.superpowers/' },
    { id: 'local-md', text: '*.local.md' },
    { id: 'ledger-md', text: '**/ledger.md' },
    { id: 'trae', text: '.trae/' },
    { id: 'node-modules', text: 'node_modules/' },
    { id: 'other-reviews', text: '其他评审目录' },
  ],
};

// 卡面形态 = `spec / plan`；两种写法（有无空格）都要命中。
export const FORBIDDEN_SPEC_PLAN = { pattern: /spec\s*\/\s*plan/ };

// 检测盲区（≠ 禁写清单）：由检测限度段单独注入。
export const DETECTION_BLIND_SPOTS = ['.session/', '.superpowers/', 'lessons/'];
