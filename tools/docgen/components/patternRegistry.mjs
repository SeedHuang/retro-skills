// 模式登记册（P2-8）：每个槽位一条模式定义。P2 内只登记不强制翻译闭环。
export const DOMAIN = '议会评审';

// 三个默认常量只在这里存一份（spec §7.1 C3）：渲染器与模板一律引用，禁止复制文本。
// 默认值 = 改造前模板现句，故 14 席不带新字段时渲染逐字节不变（spec §7.6，由 gate 兜）。
export const DEFAULT_BOUNDARY = '你是只读评审角色：不得创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。';
export const DEFAULT_EXPLORE = '固定清单之外，针对这份文档和这个项目的具体情况，现场生成 3-5 个你认为最值得问的问题（先写出来，再逐条回答）。只答固定清单 = 不合格。';
export const DEFAULT_EXPLORE_NONE = '本节不适用：本角色只交原文与行号，不出观点、不提问题。';
// command 档专用边界（只给审计 / 侦探；不改 DEFAULT_BOUNDARY，避免污染其余 13 席）
export const BOUNDARY_COMMAND = '你是只读评审角色：**只允许**以下操作，其余一律禁止（默认拒绝）——① 读/搜文件（Read / Glob / Grep）；② `npm run check`；③ `node -e` / `node --input-type=module -e` 只读计数；④ `git status|diff|show|log|reflog`（只读）；⑤ `node scripts/check-all.mjs`、`node scripts/doc-name.mjs --check`、`node scripts/skill-dir.mjs`、`node skills/review-log/scripts/time.mjs`；⑥ `node tools/docgen/cli.mjs gate|check-agents|diff|draft ls`。**禁止**：`--apply` / `--write`、`commit` / `push` / `checkout` / `reset` / `restore` / `clean` / `rm`、任何写文件或重定向（`>` / `>>` / `Set-Content` / `Out-File`）、任何安装或网络写操作。跑出非预期写操作 = 越界，本轮结论作废并直报用户；不创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。';

// ASCII 开头（首字符码 <128）的 role（UI 评委 / AI 评委）在派生式里前置一个空格，与迁移前现卡逐字一致（spec §3 派生式注）
// 谓词与 testcase【DESC】判据同一口径 = 任意 ASCII，不限字母（原先 [A-Za-z] 会让数字开头 role 与判据分歧）
const roleSep = (role) => (typeof role === 'string' && role.charCodeAt(0) < 128 ? ' ' : '');

// domain 归一化的唯一实现（spec §7.3）：`??` 拦不住空串与全空格，非字符串会被隐式转换。
// 回落值引用 DOMAIN 常量、不内联字面量（否则改 DOMAIN 时卡面不变，TC-D06 会抓出冲突）。
export function resolveDomain(agent) {
  const d = typeof agent?.domain === 'string' ? agent.domain.trim() : '';
  return d || DOMAIN;
}

export const patternRegistry = {
  description: {
    parliament: (role, when, domain = DOMAIN) => `在${domain}中担任${roleSep(role)}${role}。${when}时调用`,
    handwritten: (identity, when, notWhen) => `${identity}。${when}时调用。Do not use for ${notWhen}。`,
  },
  identityMaster: '资深{role}，对{dim1}与{dim2}有经验直觉',
  BOUNDARY_COMMAND,
  tools: {
    readOnly: ['Read', 'Glob', 'Grep'],
    sdet: ['Read', 'Glob', 'Grep', 'Write', 'Edit'],
    // 只读 + 命令权：给审计复算计数 / 核 gate / 核 git 变更 / 核快照（PRD §9 的 command 档）
    command: ['Read', 'Glob', 'Grep', 'RunCommand'],
  },
  outputKind: new Set(['issue-card', 'observation', 'audit', 'testcase', 'evidence']),
  sharedBlock: new Set(['SIX_METHODS', 'DETECTIVE_RULES', 'AUDIT_RULES']),
};
