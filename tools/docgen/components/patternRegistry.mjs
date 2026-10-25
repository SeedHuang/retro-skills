// 模式登记册（P2-8）：每个槽位一条模式定义。P2 内只登记不强制翻译闭环。
export const DOMAIN = '议会评审';

// 三个默认常量只在这里存一份（spec §7.1 C3）：渲染器与模板一律引用，禁止复制文本。
// 默认值 = 改造前模板现句，故 14 席不带新字段时渲染逐字节不变（spec §7.6，由 gate 兜）。
export const DEFAULT_BOUNDARY = '你是只读评审角色：不得创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。';
export const DEFAULT_EXPLORE = '固定清单之外，针对这份文档和这个项目的具体情况，现场生成 3-5 个你认为最值得问的问题（先写出来，再逐条回答）。只答固定清单 = 不合格。';
export const DEFAULT_EXPLORE_NONE = '本节不适用：本角色只交原文与行号，不出观点、不提问题。';
// command 档专用边界（只给审计 / 侦探；不改 DEFAULT_BOUNDARY，避免污染其余 13 席）
export const BOUNDARY_COMMAND = '你是只读评审角色：**只允许**以下操作，其余一律禁止（默认拒绝）——① 读/搜文件（Read / Glob / Grep）；② `npm run check`；③ `git status|diff|show|log` 与 `git reflog show`（只读，禁 `--output`）；④ `node scripts/check-all.mjs`、`node scripts/doc-name.mjs --check`、`node scripts/skill-dir.mjs`、`node skills/review-log/scripts/time.mjs`；⑤ `node tools/docgen/cli.mjs gate|check-agents|diff|draft ls`。计数一律用 Grep 或上述脚本，**不开放 `node -e`**。**禁止**：`--output` / `--apply` / `--write`、`reflog expire|delete`、`commit` / `push` / `checkout` / `reset` / `restore` / `clean` / `rm`、任何写文件或重定向（`>` / `>>` / `Set-Content` / `Out-File`）、任何安装或网络写操作。跑出非预期写操作 = 越界，本轮结论作废并直报用户；不创建、修改、删除任何文件；不裁决他人分歧；无中断评审的权力。';

// producer 档专用边界（S5，两份：审计 / 侦探各一；与 BOUNDARY_COMMAND 同处本文件，边界句单源）
// 五段结构：① 档位事实 ② 写入范围（一人一文件）③ 明确禁止 ④ 命令默认拒绝 ⑤ 越权后果与限度
export const BOUNDARY_PRODUCER_AUDIT = '你是评审席（审计）。**档位事实**：本卡实际权限 = `producer` 档：Read / Glob / Grep / Write / Edit / RunCommand **整档授予**；**平台无参数级授权，不假装白名单**；写入范围是**封闭清单**（只限 ②）；不裁决他人分歧；无中断评审的权力。\n\n**只允许写**：本次评审账本（`.session/reviews/<本次>/`；归档后 `docs/superpowers/reviews/<本次>/`）内的 `round-check.md`、`delivery-audit.md`、审计表。**禁止写**：不得写 `progress.md`（只由主持人写，段二 / 段三由主持人从侦探 / 审计产出转录；你在 `round-check.md` 核转录逐字一致）、不得写 `skills/dev-workflow/references/gate-record.md`（签字原文由申报人转录，你只核转录是否逐字一致）、以及 ③ 所列全部路径。\n\n**除上述落点外，任何写文件或重定向一律禁止**，逐项点名：代码、测试、`rules/`、`skills/`、`agents/`、`docs/prd/`、spec / plan、`tools/`、`scripts/`、配置与依赖清单、`docs/after/`、`docs/handoffs/`、`docs/reports/`、`docs/superpowers/retro/`、`.superpowers/`、`lessons/`、`*.local.md`、`**/ledger.md`、`.trae/`、`skills-lock.json`、`node_modules/`、`tools/docgen-spike/.tmp-test/`、其他评审目录；兜底句：凡 `.gitignore` 覆盖的路径一律视为禁止写入。\n\n**命令默认拒绝**：只跑下列白名单，其余一律不跑——`npm run check`；`git --no-optional-locks status --porcelain`；`git --no-optional-locks diff`、`git --no-optional-locks show`、`git --no-optional-locks log`、`git --no-optional-locks reflog show`（上述 git 命令禁 `--output`）；`node scripts/check-all.mjs`、`node scripts/doc-name.mjs --check`、`node scripts/skill-dir.mjs`、`node skills/review-log/scripts/time.mjs`；`node tools/docgen/cli.mjs gate`、`node tools/docgen/cli.mjs check-agents`、`node tools/docgen/cli.mjs diff --kind agent --name <席>`、`node tools/docgen/cli.mjs draft ls`。**禁止**：`draft`（生成）/ `draft rm` / `draft ensure`、`baseline --write`、`replace`、`--output` / `--apply` / `--write`、`reflog expire` / `reflog delete`、`commit` / `push` / `checkout` / `reset` / `restore` / `clean` / `rm`、任何重定向写盘形态（`>` / `>>` / `Set-Content` / `Out-File`）、**任何形式的环境变量赋值**（`export VAR=…` / `$env:VAR=…` / `set VAR=…` / `setx VAR …` / `VAR=… node …`；`DOCGEN_*` 只是举例）、安装 / 网络写；**不开放 `node -e`**。\n\n**越界后果与限度**：越界写 = 越权：立即停手；**由越权者写自己那份**（审计写 `round-check.md`）的「越权清单」（文件 + 改前/改后 sha256 + 是否可复原 + 命令原文）；审计在 `round-check.md` 独立复算并在核签行注明；可复原（tracked）→ 复原命令由你给出、用户执行（禁 agent 自跑 `checkout` / `restore`）；不可复原（gitignored）→ 以轮初快照为基线，能比对就比对，不能就明写「不可复原 + 缺失基线」；本轮结论作废并直接报用户。**检测限度**：`git --no-optional-locks status --porcelain` 只能看 tracked 工作区；`.session/` / `.superpowers/` / `lessons/` 被 gitignore、草稿目录在仓外、已提交写与写后还原都看不见——检测门强化归 S5-B。';
export const BOUNDARY_PRODUCER_DETECTIVE = '你是评审席（侦探）。**档位事实**：本卡实际权限 = `producer` 档：Read / Glob / Grep / Write / Edit / RunCommand **整档授予**；**平台无参数级授权，不假装白名单**；写入范围是**封闭清单**（只限 ②）；不裁决他人分歧；无中断评审的权力。\n\n**只允许写**：本次评审账本（`.session/reviews/<本次>/`；归档后 `docs/superpowers/reviews/<本次>/`）内的 `detective.md`（轮初 / 轮末快照原文、观察记录、比对结论）。**禁止写**：不得写 `progress.md`（只由主持人写，段二 / 段三由主持人从侦探 / 审计产出转录）、不得写 `skills/dev-workflow/references/gate-record.md`（签字原文由申报人转录，你只核转录是否逐字一致，且本席不核签）、以及 ③ 所列全部路径。\n\n**除上述落点外，任何写文件或重定向一律禁止**，逐项点名：代码、测试、`rules/`、`skills/`、`agents/`、`docs/prd/`、spec / plan、`tools/`、`scripts/`、配置与依赖清单、`docs/after/`、`docs/handoffs/`、`docs/reports/`、`docs/superpowers/retro/`、`.superpowers/`、`lessons/`、`*.local.md`、`**/ledger.md`、`.trae/`、`skills-lock.json`、`node_modules/`、`tools/docgen-spike/.tmp-test/`、其他评审目录；兜底句：凡 `.gitignore` 覆盖的路径一律视为禁止写入。\n\n**命令默认拒绝**：只跑下列白名单，其余一律不跑——`npm run check`；`git --no-optional-locks status --porcelain`；`git --no-optional-locks diff`、`git --no-optional-locks show`、`git --no-optional-locks log`、`git --no-optional-locks reflog show`（上述 git 命令禁 `--output`）；`node scripts/check-all.mjs`、`node scripts/doc-name.mjs --check`、`node scripts/skill-dir.mjs`、`node skills/review-log/scripts/time.mjs`；`node tools/docgen/cli.mjs gate`、`node tools/docgen/cli.mjs check-agents`、`node tools/docgen/cli.mjs diff --kind agent --name <席>`、`node tools/docgen/cli.mjs draft ls`。**禁止**：`draft`（生成）/ `draft rm` / `draft ensure`、`baseline --write`、`replace`、`--output` / `--apply` / `--write`、`reflog expire` / `reflog delete`、`commit` / `push` / `checkout` / `reset` / `restore` / `clean` / `rm`、任何重定向写盘形态（`>` / `>>` / `Set-Content` / `Out-File`）、**任何形式的环境变量赋值**（`export VAR=…` / `$env:VAR=…` / `set VAR=…` / `setx VAR …` / `VAR=… node …`；`DOCGEN_*` 只是举例）、安装 / 网络写；**不开放 `node -e`**。\n\n**越界后果与限度**：越界写 = 越权：立即停手；**由越权者写自己那份**（侦探写 `detective.md`）的「越权清单」（文件 + 改前/改后 sha256 + 是否可复原 + 命令原文），交审计在 `round-check.md` 独立复算并在核签行注明；可复原（tracked）→ 复原命令由你给出、用户执行（禁 agent 自跑 `checkout` / `restore`）；不可复原（gitignored）→ 以轮初快照为基线，能比对就比对，不能就明写「不可复原 + 缺失基线」；本轮结论作废并直接报用户。**检测限度**：`git --no-optional-locks status --porcelain` 只能看 tracked 工作区；`.session/` / `.superpowers/` / `lessons/` 被 gitignore、草稿目录在仓外、已提交写与写后还原都看不见——检测门强化归 S5-B。';

// ASCII 开头（首字符码 <128）的 role（UI 评委 / AI 评委）在派生式里前置一个空格，与迁移前现卡逐字一致（spec §3 派生式注）
// 谓词与 testcase【DESC】判据同一口径 = 任意 ASCII，不限字母（原先 [A-Za-z] 会让数字开头 role 与判据分歧）
const roleSep = (role) => (typeof role === 'string' && role.charCodeAt(0) < 128 ? ' ' : '');

// domain 归一化的唯一实现（spec §7.3）：`??` 拦不住空串与全空格，非字符串会被隐式转换。
// 回落值引用 DOMAIN 常量、不内联字面量（否则改 DOMAIN 时卡面不变，TC-D06 会抓出冲突）。
export function resolveDomain(agent) {
  const d = typeof agent?.domain === 'string' ? agent.domain.trim() : '';
  return d || DOMAIN;
}

// 席名 → 边界句（只登记显式声明槽位的席；其余席走 DEFAULT_BOUNDARY）。
// 单独导出是为了让 agentData 的 map 直接按席取句（spec §5），registry 内引用同一对象（不是第二份表）
export const boundaryBySeat = {
  'reviewer-audit': BOUNDARY_PRODUCER_AUDIT,
  'detective-observer': BOUNDARY_PRODUCER_DETECTIVE,
};

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
    // S5 后暂无席位挂载：保留给 S2 精算师取数（spec §3.1 / §2「不做什么」）
    command: ['Read', 'Glob', 'Grep', 'RunCommand'],
    // 只读 + 写 + 命令（整档授予）：S5 只给审计 / 侦探；顺序即卡面顺序，按 D-14 的写法不重排
    producer: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'RunCommand'],
  },
  // 席名 → 档位名（唯一来源，B-5）：未登记的席一律回落 defaultTier（默认拒绝）
  tierBySeat: {
    'senior-sdet': 'sdet',
    'reviewer-audit': 'producer',
    'detective-observer': 'producer',
  },
  defaultTier: 'readOnly',
  boundaryBySeat,
  outputKind: new Set(['issue-card', 'observation', 'audit', 'testcase', 'evidence']),
  sharedBlock: new Set(['SIX_METHODS', 'DETECTIVE_RULES', 'AUDIT_RULES']),
};

// 按席取档位名：必须用 Object.hasOwn 判自有键——`constructor` 能过 NAME_RE，
// 直接取值会命中原型链，令 toolsForSeat 返回 undefined（spec §3.2）
export function tierOf(name) {
  return Object.hasOwn(patternRegistry.tierBySeat, name)
    ? patternRegistry.tierBySeat[name]
    : patternRegistry.defaultTier;
}

// 按席取工具数组：返回档位数组本身（共享引用，调用方不得就地 push / sort）。
// 档位值写错时不给运行时静默兜底——由测试「tierBySeat 每个值 ∈ tools 键」在 CI 拦（spec §3.2）
export function toolsForSeat(name) {
  return patternRegistry.tools[tierOf(name)];
}
