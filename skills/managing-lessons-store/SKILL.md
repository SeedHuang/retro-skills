---
name: managing-lessons-store
description: Use when 需要初始化错题集库、迁移库到新位置、轮询推迟项是否到复活时机、记录或结案情绪点（moment）、查条目（show / find）、或看库的统计与维度薄弱面（stats）时。用于「错题集放哪 / 库搬家 / 换盘 / 有什么推迟项该做了 / 库里哪个维度最薄弱 / 记一条情绪 / 查某条目的状态」这类请求；用户说「查一下错题集」「库里现在有什么」「看看推迟项」也算。Do not use for 复盘本身（走 retro-collect / retro-analyze / retro-institutionalize）。
---

# 管理错题集库（managing-lessons-store）

## 职责边界

本技能做这些事：**初始化（bootstrap）、迁移、轮询推迟项、统计（维度分布快照）、情绪记录（moment）、条目查询（show / find）、体积治理**。它**不做**复盘、不写教训内容（那是 retro-* 三个技能的事）——**只收集与检索，不下结论**。

所有操作都通过脚本 `scripts/lessons.mjs` 完成——**技能里不硬编码 KB 路径**。

## 命令

在本技能目录下运行（相对路径按安装后的位置解析）：

| 命令 | 用途 |
|---|---|
| `node scripts/lessons.mjs resolve` | 解析并**校验** KB 根；成功打印路径，失败打印原因 + 下一步 |
| `node scripts/lessons.mjs deferred [--project <标识>]` | 推迟项清单 + 命中判定 + 总数；带 `--project` 追加「未结案情绪 N 条；画像 X 天未更新」；主账超阈值时打印「尽早复盘收口」提醒 |
| `node scripts/lessons.mjs stats` | 三区 × 维度分布快照（看薄弱面；实时扫描三区账本） |
| `node scripts/lessons.mjs sid "<本 session 首句逐字原文>"` | 算 `sid`（sha256 前 8 位）——目录名与 `--session` 都用它。**`--session` 只收 8 位小写 hex**（= `sessionId()` 的输出）：拒非 hex（防误传 memory 的 `session_id` 之类）、拒 `-`（防段匹配混淆）、拒正则元字符（防注入）、定长（防目录名越界） |
| `node scripts/lessons.mjs moment add --project <标识> --session <sid> --date <日期> --summary "<≤20字主题>" [--first-message "<首句原文>"] --polarity <负面\|正面\|认知> ...` | 追加一条情绪记录（必给 `--problem/--evidence`（原话）/**`--reason`（判据：对象→意图→脏字→结论）**；`--cause/--attitude` 可选且须标推断）。落 **`<日期>-<sid>-<摘要>/moments.md`（一 session 一份）**；`--summary` **新建目录时必填**（缺 / 清洗后为空 → 拒写；它是人翻 KB 时唯一能认出 session 的东西；怎么压见 `retro-collect/SKILL.md`「第 0 步 ③」），已有目录则忽略；`--first-message` 触发 `sid` 碰撞护栏（**不传 = 该护栏不生效**）。格式见 `assets/moments-template.md`，判定公式与 userwords 共用 |
| `node scripts/lessons.mjs moment resolve --project <标识> --id <M-...> --solution "..." [--cost "..."]` | 结案：扫项目下各 session 目录**按标题找**该条目（**新旧 id 都认**）；只改该条目的状态与解法/代价 |
| `node scripts/lessons.mjs moment drop --project <标识> --date <日期> --session <sid>` | 清空本 session 的 `moments.md` **条目区**（保留文件头与非 moment 标题）；供 collect 重扫覆盖用 |
| `node scripts/lessons.mjs show <ID>` | 查单条（状态 / 载体 / 维度） |
| `node scripts/lessons.mjs find <关键词>` | 按关键词列相关条目及状态 |
| `node scripts/lessons.mjs verify record <目标> --period <期> --a <机会数> [--b --n --p --date --expect --signal --note]` | 记一期有效性（台账不存在则建表头）；`<目标>` = 技能名 或 KB 条目 ID |
| `node scripts/lessons.mjs verify score <目标>` | 末期水平：复发率 / 新问题率 / 认可率 + 置信度（按机会数） |
| `node scripts/lessons.mjs verify trend <目标>` | 逐期 Δ → **5 档**（明显变好 … 明显劣化）+ 趋势 |
| `node scripts/lessons.mjs verify expect <目标>` | 实测 vs **事前预期区间** → 对账结论（达到 / 未达 / 回升） |
| `node scripts/lessons.mjs migrate --to <path>` | 迁移（四条硬校验 + 复制 + 校验 + 切指针） |

无 Node 时（`node -v` 失败）：**明确告知脚本不可用**，改为手工操作，且**不得假装成功**。

## Bootstrap：库未初始化时（`resolve` 报「未找到错题集指针」）

1. **必须询问用户指定位置**——**不得静默落 C 盘**（错题集会持续增长）。给出建议（非 C 盘）但不替用户决定。
2. 拿到位置后建骨架：
   - `<KB>/index.md`（含「候选与推迟」节——把 spec §11.2 的 C1–C6 与 §11.1 的 L3/L4 **逐条**写入，形成运行态权威）
   - `<KB>/projects/`、`<KB>/universal/`
   - **信号列必须写成机器可解析形式**（脚本按正则识别）：数值阈值型写成 `KB 条目 >= N` / `KB 项目 >= N`（**含「条目」或「项目」二字，用 ASCII `>=`，不要用全角 `≥`**）；事件型写成 `首次出现真冲突`。写成其他措辞（如 `KB ≥ 10 条`）会导致该条被判为「不可自动判定 → 交人工」，轮询退化。
3. 写指针 `<用户 home>/.agents/lessons.config.json`，内容 `{"store":"<KB 绝对路径>","schemaVersion":1}`。
   - 若 `~/.agents/` 不存在 → 先创建；创建失败 → 退到 `~/.trae-cn/lessons.config.json` 并**告知实际落点**
   - 若指针**已存在但损坏** → **禁止静默覆盖**：先备份为 `lessons.config.json.bak-<时间戳>`，再写新指针，并报告备份路径
4. 收尾跑一次 `resolve` 验证。

## 迁移（用户说「库搬家 / 换盘 / 我要迁移错题集」）

调用 `migrate --to <目标>`，它内含四条硬校验（目标 ≠ 源 / 不在源内 / 不是源祖先 / 目标空或不存在）。失败时按脚本给出的 `stage` 与原因向用户解释。
**锁**：迁移期间源根有 `.migrating` 标记；开始时提示用户「若有其他流程正在写库请先停」。
**迁移后**：脚本**不自动删旧库**——由用户决定。

## 轮询推迟项（会话开始，或用户问「有什么推迟项该做了」）

跑 `deferred`，逐条核对信号：

- **有命中** → 动手前先向用户提出：命中项编号 + 信号证据（**是否升格 → 指是否做一次更深的复盘/独立 spec，属收集侧**）
- **无命中** → 一句话报告，**必须含计数**（如「推迟项 6 条，均未命中信号」）——防轮询退化成形式主义
- **顺带报**（带 `--project <标识>`）：`未结案情绪 N 条；画像 X 天未更新`；主账超阈值时附「建议尽早复盘收口 <目标>」。**只报告收集侧，绝不追问落地**

## 常见错误

| 错误 | 纠正 |
|---|---|
| 用户没给位置就自己选了 | 停手，先问。默认落 C 盘是明确禁止的 |
| 把错题集建在项目仓库里 | 拒绝——含个人数据，会被提交。`resolve` 也会拦 |
| 指针损坏时直接覆盖 | 先备份再写，并报告备份路径 |
| 迁移后顺手删了旧库 | 不删。由用户决定 |
| 报告没带计数 | 必须带「推迟项 N 条」 |
| 信号写成 `KB ≥ 10 条`（全角 ≥ / 缺「条目」二字） | 脚本判为「不可自动判定 → 交人工」，轮询静默退化。改写为 `KB 条目 >= 10` |
| 巡检报告里夹带「要不要落地」 | 巡检只报收集侧（推迟项 / 情绪 / 画像）；**落地由用户在 lessons 发起** |
| `moment add` 忘给 `--session` | 情绪锚点必填——没有 session 就失去与过程配对的能力 |
| `moment add` 忘给 `--summary`（新建目录那一次） | **必给**——它是人翻 KB 时唯一能认出 session 的东西（缺 / 清洗后为空 → 拒写、不建目录）。怎么压见 `retro-collect/SKILL.md`「第 0 步 ③」 |
| **拿 memory 的 `session_id` 当 `--session`** | 必须用 `lessons sid "<首句>"` 算出的 **8 位小写 hex**——memory 的 `session_id` 是**另一套标识**（且严重滞后），会被脚本拒收 |
