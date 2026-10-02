# session 标识自足化 + KB 落点改「一 session 一目录」 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 session 身份**自足**（首句 hash，不依赖滞后的 memory），并把 KB 落点从「按天文件」改为「一 session 一目录」，使同日多 session 不再互相干扰。

**Architecture:** 标识层 `sid = sha256(normText(首句逐字原文)).slice(0,8)`；落点层 `projects/<项目>/<日期>-<sid>[-<摘要>]/{facts,userwords,moments,retro}.md`；moment id 改 `M-<sid>-<N>`；`momentResolve` 改为「扫项目下各 session 目录、按标题精确找」，从而**旧 id 不必重写**。

**Tech Stack:** Node ≥ 20（内置 `node:test`、`node:crypto`）、无新增依赖。仅动 `d:\Seed\retro-skills` 仓库 + KB `D:\Seed\lessons`（KB 无 git）。

**Spec:** `d:\Seed\retro-skills\docs\superpowers\specs\2026-10-02-session-dir-layout-design.md`（本文档论证都从该 spec 来；执行者两个文件都要读）

## 执行进度（2026-10-02，本表为准）

| Task | 状态 | 证据 |
|---|---|---|
| 1 spec 定稿 | ✅ | spec 13 节 + 16 条验证项 |
| 2 脚本改造 + 测试 | ✅ | `node --test` **81/81**；两个 spec↔实现偏差已纠正并回写 spec |
| 3 `lessons sid` CLI | ✅ | `sid "我发现一个问题，…"` → `51e11408`（与 spec §2.1 例同值）；`sid "<9/30 首句>"` → `f42185fc` |
| 4 迁移 3 个文件 | ✅ | 复制校验 3×OK → 复算 sid=`f42185fc` → 删原件；`deferred` 由「未结案情绪 **0** 条」变回 **5 条**；扁平 moments 文件数 **0**；`.migrating` 已释放；`index.md` 四处已改 |
| 5 模板 / 技能 / 文档 | ✅ | 3 模板 + 6 技能 + `architecture.md` / `README.md` / spec-2026-10-01；全库 grep 旧形态 → **源文件零命中**（仅 plan 与 2026-10-02 spec 因"描述改动本身"而含旧形态） |
| 6 跑本次 collect | ⬜ 待做 | 需先定 session；本 session 前半段已被压缩（见 Task 6 前提） |

> 下方各 Task 的 `- [ ]` 勾选框**未逐个勾**——执行在同一 session 内连续完成，以本表为准。

## Global Constraints

- 目录名 = `<YYYY-MM-DD>-<sid>-<摘要≤20字>`；**永不改名**，此后一律按 `<日期>-<sid>` **段匹配**找回（spec §3/§4.1）。
- **`sid` 在场却不匹配时不得复用同日目录**——只有 `sid` **缺失**且同日恰好一个目录才兜底（spec §4.1）。缺 sid 的正确修法是**从已有目录名读出 sid**。
- 日期一律取 **session 起始日期**，**禁用系统当天**（spec §3）。
- 目录名清洗：去 `< > : " / \ | ? *` 与控制字符、去结尾点、空白折 `-`、截 20 字、清洗后为空则省略该段（spec §3）。
- `sid` 已存在目录但**记录的首句不同** → 报错，不静默合并（spec §2.2-3）。
- moment id 形如 `M-<sid>-<N>`；旧形 `M-<日期>-<N>` **不改写**，由同一套「按标题找」兼容（spec §6.1）。
- moments 的 `session` 字段**保留**、值填 `sid`（自描述锚点）；userwords 块键 `S-<session_id>` **删除**（spec §6.2）。
- `moment drop` = 清 `^##\s+M-` 块，**保留文件头与非 moment 标题**（如 `## 备注`）（spec §4.3）。
- **不升 `schemaVersion`**（保持 1）；不动 `ledger.md` / `effectiveness.md` / `rules-history/` 位置（spec §1）。
- 旧产物**祖父不改**（除本仓库 3 个文件需迁移）；历史文档 `docs/handoffs/*`、`2026-09-27` 的 spec/plan **保留不改**（spec §1）。
- `.migrating` 锁全程 **try/finally 释放**；写入原子（临时文件 + 改名）、无 BOM（spec §7）。
- 代码注释与 commit message 用中文。

---

## 文件结构

| 位置 | 文件 | 职责 |
|---|---|---|
| retro-skills | `skills/managing-lessons-store/scripts/lessons.mjs`（改） | `sid` 计算、目录名清洗、目录定位；`momentAdd/Resolve/Drop/Summary` 改走新落点；CLI |
| retro-skills | `skills/managing-lessons-store/scripts/lessons.test.mjs`（改） | 上者全部单测 |
| retro-skills | `skills/retro-collect/SKILL.md`（改） | 唯三产出落点；「第 0 步」扩成「定 session」；重扫节；常见错误 |
| retro-skills | `skills/retro-collect/assets/facts-template.md`（改） | 落点；头部加「首句 / memory id」；去 `<sesshort>` |
| retro-skills | `skills/retro-collect/assets/userwords-template.md`（改） | 落点；块键 `S-` 退场 |
| retro-skills | `skills/managing-lessons-store/assets/moments-template.md`（改） | 落点；条目区边界；id 行与 `session` 字段值 |
| retro-skills | `skills/managing-lessons-store/SKILL.md`（改） | 命令表（`--session` 语义、`--summary`、`sid`） |
| retro-skills | `skills/retro-analyze/{SKILL.md,assets/retro-template.md}`（改） | `retro.md` 落点 |
| retro-skills | `skills/using-retrospective/SKILL.md`（改） | KB 结构示意图 |
| retro-skills | `skills/retro-institutionalize/SKILL.md`（改） | 读 moments 的路径 |
| retro-skills | `skills/retro-verify/{SKILL.md,assets/effectiveness-template.md}`（改） | 「认可 P」取数口径的文件名 |
| retro-skills | `docs/architecture.md` / `README.md`（改） | KB 树、命令清单、产出行 |
| retro-skills | `docs/superpowers/specs/2026-10-01-...md`（改） | 被本 spec 覆盖的节（§4.1/§4.3/§4.6/§5/§11/§12/§15） |
| KB | `D:\Seed\lessons\projects\retro-skills\`（迁移） | 3 个扁平文件 → 1 个 session 目录 |
| KB | `D:\Seed\lessons\index.md`（改） | 项目结构行、facts 命名约定、情绪记录约定、历史留档 |

---

### Task 1: spec 定稿 ✅ 已完成 2026-10-02

**Files:**
- Create: `docs/superpowers/specs/2026-10-02-session-dir-layout-design.md`

- [x] **Step 1: 写 spec**（13 节）
- [x] **Step 2: 多透镜评审**（0 矛盾 / 5 盲点 / 5 优化）
- [x] **Step 3: 按评审改 spec**（7 条 + 手法 3 揪出 4 处内部不一致）
- [x] **Step 4: 复核「旧 id 不重写」逻辑** → 补 §6.1 六个实施落点 + §6.2 字段去留判据

**验收**：spec 含 16 条验证项（14 自动 + 2 文档）；全库 grep 无残留旧口径。

---

### Task 2: 脚本改造 + 测试 ✅ 已完成 2026-10-02

**Files:**
- Modify: `skills/managing-lessons-store/scripts/lessons.mjs`
- Test: `skills/managing-lessons-store/scripts/lessons.test.mjs`

**Interfaces（后续任务依赖的准确签名）：**

```js
sessionId(firstMessage) -> string            // sha256(normText(首句)).slice(0,8)，小写 hex
sanitizeDirSegment(s, max = 20) -> string    // 目录名「摘要」段清洗；空则返回 ''
findSessionDir(root, project, date, sid)
  -> { ok: true, dir: string|null, fallback?: true } | { ok: false, reason: string }
readRecordedFirstMessage(root, project, dir) -> string | null   // 读 facts 头的「首句」，已归一化
momentAdd(root, opts) -> { ok, id, file, dir } | { ok: false, reason }
  // opts 新增：summary（仅创建时用）、firstMessage（碰撞护栏）
momentResolve(root, opts) -> { ok, id } | { ok: false, reason }
momentDrop(root, opts) -> { ok, removed, fileMissing? } | { ok: false, reason }
momentsSummary(root, project) -> { total, open }
```

- [x] **Step 1: 实现新函数与改造**

关键实现（已落盘，摘录核心）：

```js
export function sessionId(firstMessage) {
  return createHash('sha256').update(normText(firstMessage), 'utf8').digest('hex').slice(0, 8)
}

export function sanitizeDirSegment(s, max = 20) {
  const cleaned = String(s ?? '')
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, '-').replace(/-+/g, '-')
    .replace(/^[.\-]+|[.\-]+$/g, '')
  return cleaned.slice(0, max).replace(/[.\-]+$/, '')
}

export function findSessionDir(root, project, date, sid) {
  const dayDirs = listSessionDirs(root, project).filter((n) => n === date || n.startsWith(`${date}-`))
  const hits = sid ? dayDirs.filter((n) => n === `${date}-${sid}` || n.startsWith(`${date}-${sid}-`)) : []
  if (hits.length > 1) return { ok: false, reason: `同日同 sid 命中多个目录（${hits.join('、')}）——歧义，请人工处理` }
  if (hits.length === 1) return { ok: true, dir: hits[0] }
  if (!sid && dayDirs.length === 1) return { ok: true, dir: dayDirs[0], fallback: true }
  return { ok: true, dir: null }
}
```

- [x] **Step 2: 改测试**（路径/ id/ 语义全部对齐新布局；新增 9 条覆盖 `sid`、清洗、定位、护栏、摘要目录名、兜底）
- [x] **Step 3: 跑测试**

Run: `node --test lessons.test.mjs`（cwd = `skills/managing-lessons-store/scripts`）
Expected: **81 pass / 0 fail**

- [x] **Step 4: CLI 实测**

Run: `node lessons.mjs moment drop --project retro-skills --date 2026-09-30 --session deadbeef`
Expected: `未找到 2026-09-30 下该 session 的目录 / moments.md——日期或 sid 可能写错，请复核；本次未改动任何文件`

**执行记录（两个 spec↔实现的偏差，已在实现中纠正并回写 spec）：**

1. **兜底范围**：初版实现成「只要未命中就复用同日唯一目录」→ `moment add` 用新 sid 写第二条会被折进旧目录、`moment drop` 会清错 session（测试直接暴露）。已收紧为「**仅当 sid 缺失**才兜底」，并回写 spec §4.1。
2. **格式护栏**：初版按 spec 写成 `[0-9a-f]{8}` → `momentAdd` 生成的 `M-s-1` 被 `momentResolve` 拒收，**add 与 resolve 对不上**。已放宽为 `[^\s-]+`，并回写 spec §6.1-A。

> ⚠️ **提交前必须连做 Task 3–5**：本任务改完扫描器后，扁平老文件对 `projects/*/moments.md` 不可见（实测 `deferred` 报「未结案情绪 0 条」，实际 5 条）。这就是 spec §12 硬约束说的中间态。

---

### Task 3: 补 `lessons sid` CLI（spec §7 的补充）

**为什么加**：spec §2.1 要求「PowerShell 与 Node 两侧同值」、§11-1 要求可验证，而 `sid` 目前只能靠 `node -e` 现算——按 §2.2 还必须在**每次** collect 时算。给一个确定性入口，技能文本里才好引用。

**Files:**
- Modify: `skills/managing-lessons-store/scripts/lessons.mjs`（CLI 分支 + 帮助串）
- Test: `skills/managing-lessons-store/scripts/lessons.test.mjs`

**Interfaces:**
- Consumes: `sessionId(firstMessage)`（Task 2）
- Produces: `node lessons.mjs sid "<首句原文>"` → stdout 打印 8 位 sid

- [ ] **Step 1: 加 CLI 分支**

在 `if (cmd === 'resolve')` 之前插入：

```js
if (cmd === 'sid') {
  const msg = process.argv.slice(3).join(' ')
  if (!msg) { process.stderr.write('用法：lessons sid "<本 session 用户第一条消息的逐字原文>"\n'); process.exit(1) }
  process.stdout.write(sessionId(msg) + '\n'); process.exit(0)
}
```

并把「未知命令」帮助串补上 `sid "<首句>"`。

- [ ] **Step 2: 跑实测**

Run: `node lessons.mjs sid "我发现一个问题，retro-skills不负责rule的同步和管理吗？"`
Expected: `51e11408`（与 spec §2.1 实测例一致 → 同时验证 Node 与 PowerShell 同值）

- [ ] **Step 3: 跑全量测试**

Run: `node --test lessons.test.mjs`
Expected: PASS（81 + 0 新增，本步只加 CLI 分支）

---

### Task 4: 迁移 3 个文件（spec §10 / §12-3）

**Files:**
- Move: `D:\Seed\lessons\projects\retro-skills\2026-09-30-s01-facts.md` → `<session 目录>\facts.md`
- Move: `...\2026-09-30-userwords.md` → `<session 目录>\userwords.md`
- Move: `...\2026-09-30-moments.md` → `<session 目录>\moments.md`
- Modify: `<session 目录>\facts.md`（头部补「首句 / memory id」）
- Modify: `D:\Seed\lessons\index.md`

**已算好的常量（取自 `2026-09-30-userwords.md` 第 1 条原话）：**

```
sid        = f42185fc
session 目录 = 2026-09-30-f42185fc-dry-refactor-newadd
memory id  = 6abcf3ed99647070cc770d27   （降级为备注，保留旧链）
```

- [ ] **Step 1: 上锁**

```powershell
Set-Content -LiteralPath 'D:\Seed\lessons\.migrating' -Value (Get-Date -Format o)
```

- [ ] **Step 2: 建目录 + 复制（先复制、不删原件）**

```powershell
$src='D:\Seed\lessons\projects\retro-skills'
$dst="$src\2026-09-30-f42185fc-dry-refactor-newadd"
New-Item -ItemType Directory -Path $dst -Force | Out-Null
Copy-Item "$src\2026-09-30-s01-facts.md"    "$dst\facts.md"
Copy-Item "$src\2026-09-30-userwords.md"    "$dst\userwords.md"
Copy-Item "$src\2026-09-30-moments.md"      "$dst\moments.md"
```

- [ ] **Step 3: 校验「原样搬过来」（趁 facts 还没改头）**

```powershell
foreach ($p in @(@('2026-09-30-s01-facts.md','facts.md'),@('2026-09-30-userwords.md','userwords.md'),@('2026-09-30-moments.md','moments.md'))) {
  $a=(Get-FileHash "$src\$($p[0])" -Algorithm SHA256).Hash
  $b=(Get-FileHash "$dst\$($p[1])" -Algorithm SHA256).Hash
  "{0}: {1}" -f $p[1], ($(if ($a -eq $b) {'OK'} else {'MISMATCH'}))
}
```

Expected：三行全 `OK`。

- [ ] **Step 4: 改 `facts.md` 头部**（把旧的 session 行换成新格式）

旧行（第 5 行）：

```markdown
- session：6abcf3ed99647070cc770d27｜message 范围：首条 summary（2026-09-30 19:37:04）.. 收集时刻（2026-10-02 19:33）
```

新行（首句必须是**逐字原文**，供复算）：

```markdown
- session：f42185fc｜首句：Use Skill: brainstorming 我要写一个新skill 他叫 dry-refactor-newadd他会执行两个动作，一个是使用dry-refactor 对未提交的文件进行 死代码，冗余代码，的检查，检查完之后，将死代码删除，冗余代码进行抽取，合并成一个新方法，然后删掉原来的冗余代码，使用新方法替代，做好之后，展现改了什么，改之前比改制后减少多少冗余代码，去掉了多少死代码，站原来的百分比是多少，这样的审计结果，这个skill也支持自进化｜memory id：6abcf3ed99647070cc770d27｜message 范围：首条 summary（2026-09-30 19:37:04）.. 收集时刻（2026-10-02 19:33）
```

- [ ] **Step 5: 复算 `sid`（任何人都能核）**

```powershell
# 从 facts.md 里取出「首句」→ 再算一遍，期望仍是 f42185fc
$line = (Get-Content "$dst\facts.md" -Encoding UTF8) | Where-Object { $_ -like '- session：*' }
$s = ($line -replace '^.*?｜首句：','') -replace '｜memory id：.*$',''
node skills\managing-lessons-store\scripts\lessons.mjs sid "$s"
```

Expected: `f42185fc`

- [ ] **Step 6: 删原件**

```powershell
Remove-Item "$src\2026-09-30-s01-facts.md","$src\2026-09-30-userwords.md","$src\2026-09-30-moments.md"
```

- [ ] **Step 7: 解锁 + 验收**

```powershell
Remove-Item 'D:\Seed\lessons\.migrating' -Force
node skills\managing-lessons-store\scripts\lessons.mjs deferred --project retro-skills
```

Expected：`未结案情绪 5 条`（迁移前是 0 条——扫描器终于看得见）+ 扁平形态零命中：

```powershell
Get-ChildItem 'D:\Seed\lessons\projects' -Recurse -File -Filter '????-??-??-moments.md' | Measure-Object | Select-Object -ExpandProperty Count
```

Expected: `0`

- [ ] **Step 8: 改 `index.md` 四处**

1. 项目结构行：`projects/retro-skills/` → 改为「一 session 一目录」表述（`<日期>-<sid>-<摘要>/` 下含 facts/userwords/moments/retro）
2. 事实包命名约定：删「`<日期>-<sesshort>-facts.md`」，改「session 目录内 `facts.md`」
3. 情绪记录约定：改「session 目录内 `moments.md`；id `M-<sid>-<N>`」
4. 「历史留档与路径变动」新增一条：`2026-09-30-s01-facts.md` / `2026-09-30-userwords.md` / `2026-09-30-moments.md` → `2026-09-30-f42185fc-dry-refactor-newadd/`；并声明「2026-10-02 前 session 标识为外部锚点或自定短码（如 `s01`），之后统一为首句 hash8」

---

### Task 5: 模板 / 技能 / 文档（spec §8 / §9）

**Files:**
- Modify: `skills/retro-collect/SKILL.md`、`assets/facts-template.md`、`assets/userwords-template.md`
- Modify: `skills/managing-lessons-store/assets/moments-template.md`、`SKILL.md`
- Modify: `skills/retro-analyze/SKILL.md`、`assets/retro-template.md`
- Modify: `skills/using-retrospective/SKILL.md`、`skills/retro-institutionalize/SKILL.md`
- Modify: `skills/retro-verify/SKILL.md`、`assets/effectiveness-template.md`
- Modify: `docs/architecture.md`、`README.md`
- Modify: `docs/superpowers/specs/2026-10-01-retro-self-improvement-design.md`

- [ ] **Step 1: `retro-collect/SKILL.md`**

- 「唯三产出」：三项落点改 `<日期>-<sid>[-<摘要>]/` 目录内（`facts.md` / `userwords.md` / `moments.md`）
- 「第 0 步」扩成**「第 0 步：定 session」**：① 定日期（沿用现阶梯）② 算 sid（`lessons sid "<首句>"`；拿不到逐字首句 → **不硬算**，退回「读已有目录名里的 sid」或问用户）③ 摘要 ≤20 字（可省）④ 落笔前输出一行 `session = <日期>-<sid>｜首句 = …`
- 「重扫 moment」节：删「按天分文件」表述；先把 `moment drop --project <标识> --date <日期> --session <sid>` 改成新语义
- 常见错误：删「同日多 session 用同一文件名」；新增「用系统当天当 session 日期」「sid 在场却复用同日唯一目录」「对话已压缩仍硬算 sid」
- **删除**「读 jsonl 校验 session_id`」那条（spec §2.3）

- [ ] **Step 2: 三个模板**

- `facts-template.md`：落点改 session 目录内 `facts.md`；头部行改 `- session：<sid>｜首句：<逐字原文>｜memory id：<可选>｜message 范围：…`；删 `<sesshort>`
- `userwords-template.md`：落点改 `userwords.md`；**块键 `S-<session_id>` 4 处全部删除**（文件即 session）
- `moments-template.md`：落点改 `moments.md`；id 行 `## M-<sid>-<N>`；`session：` 字段值填 `sid`；加「条目区边界」（`^##\s+M-` 块清、文件头与 `## 备注` 留）

- [ ] **Step 3: 其余技能**

- `managing-lessons-store/SKILL.md`：命令表加 `sid "<首句>"`；`moment add` 行补 `--summary` / `--first-message` 与新落点
- `retro-analyze`（SKILL + 模板）：`retro.md` 落点改 session 目录内
- `using-retrospective`：KB 结构示意图改新布局
- `retro-institutionalize`：`<日期>-moments.md` → `<session 目录>/moments.md`
- `retro-verify`（SKILL + 模板）：「认可 P」取数口径的文件名同上

- [ ] **Step 4: 文档**

- `docs/architecture.md`：L1 层 KB 树、命令清单、moment 机制行
- `README.md`：`retro-collect` / `retro-analyze` 产出行与示例文件名
- `docs/superpowers/specs/2026-10-01-...md`：§4.1 存储、§4.3 三钥匙、§4.6 格式、§5 表与文件结构、§11 载体、§12 验证第 3 条、§15 候选（「legacy 单文件接管」→ **保持候选**：布局被取代了，但"扁平文件静默不可见"这个风险没被取代）

- [ ] **Step 5: 全库 grep 旧形态 = 零命中**

```powershell
$hits = Get-ChildItem 'd:\Seed\retro-skills' -Recurse -File -Include *.md,*.mjs |
  Select-String -Pattern '<日期>-moments\.md|<日期>-userwords\.md|<sesshort>|S-<session_id>'
$hits
```

Expected：无输出。**例外**：`docs/handoffs/*` 与 `2026-09-27` 的 spec/plan 属历史记录，若命中则**保留不改**（spec §1）。

---

### Task 6: 跑本次 collect（spec §12-5）

**前提（必须在开工前向用户确认）**：本 session 的**前半段已被上下文压缩**（spec §2.2 的「拿不到逐字首句」场景）。因此本次 collect **不得**用「重扫覆盖」的全量姿态，只能：

- `facts`：正常产出，并在 §6「未取得的数据」写明「前半段仅有摘要态，逐字原文不可得」
- `userwords`：**只收仍逐字可见的后半段**
- `moments`：本 session 当日**无既有条目**（无 `2026-10-02-*` 目录）→ drop 天然 no-op，直接 add

- [ ] **Step 1: 定 session**（日期 + sid + 摘要）

```powershell
node skills\managing-lessons-store\scripts\lessons.mjs sid "<本 session 用户第一条消息逐字原文>"
```

- [ ] **Step 2: 产出三样**（`facts.md` / `userwords.md` / `moments.md` 落新目录）
- [ ] **Step 3: 自查**：事实包七节齐、无评价词；`§2 计数 / §4 情绪点` 两栏都填
- [ ] **Step 4: 交付**：输出「下一步：用 `retro-analyze` 基于本事实包做分析」

---

## 附：验证对照（spec §11 的 16 条 → 由哪个任务兑现）

| spec §11 项 | 兑现处 |
|---|---|
| 1 `sid` 计算/两端同值 | Task 2 测试 + Task 3 Step 2 |
| 2 归一化 fixture | Task 2 测试 |
| 3 目录名清洗 | Task 2 测试 |
| 4 目录名长度 | （**未覆盖**——见下方 Gap） |
| 5 段匹配 / 多命中报错 | Task 2 测试 |
| 6–7 add 目录复用 / N 递增 | Task 2 测试 |
| 8 resolve 新旧 id / 找不到 | Task 2 测试 |
| 9 drop 条目区 / `## 备注` / 老文件 | Task 2 测试 |
| 10 碰撞护栏 | Task 2 测试 |
| 11 summary 跨目录 | Task 2 测试 |
| 12 扁平形态零命中 | Task 4 Step 6 |
| 13 现有测试全绿 | Task 2 Step 3 |
| 14 CLI 三条路径 | Task 2 Step 4 + Task 6 |
| 15 模板/技能/文档 grep 零命中 | Task 5 Step 5 |
| 16 「第 0 步」含 sid 判据 | Task 5 Step 1 |

**Gap（本 plan 未覆盖，需你定）**：spec §11-4「目录名总长在 Windows 260 限制内」与 §11-2 的 Windows 建目录实测，目前只有单测层面的清洗断言，**没有真在 Windows 上建过长名目录**。建议在 Task 4 迁移时顺手验一次（新目录名 40 字符左右，路径总长 ≈ 100，风险极低）。
