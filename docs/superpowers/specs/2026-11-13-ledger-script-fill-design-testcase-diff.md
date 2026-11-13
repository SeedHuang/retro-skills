# spec × testcase 差异清单（账本脚本填充 / 定位）

> 依据：`carrier-conventions` 的「spec 与 testcase 并行独立产出 → 差异清单留痕」。
> 对象：spec `2026-11-13-ledger-script-fill-design.md`；testcase `2026-11-13-ledger-script-fill-design-testcase.md`（独立 senior-sdet 编写，未读 spec）。
> 结论：9 处歧义全部定版，其中 2 处需回改 PRD（已改，PRD v3.1），1 处需同步 testcase 键名（已改）。

| # | 议题 | PRD 原口径 | testcase 疑点 | 决议 | 落地 |
|---|---|---|---|---|---|
| D1 | 行键基准 | §7：行键 = `checklist.items[].no`；§6.1-6 却写「第 0/3/5 项」 | 0 起还是 1 起；8 项与资产 6 行如何对齐 | 行键 = `no`（1 起，8 项），资产行由 checklist 生成 | PRD v3.1 §6.1-6 改第 1/4/6 项；testcase TC-07 同步键名 |
| D2 | 表头列数 | §7：三源一致；未定以哪份为准 | 4 列（资产）vs 8 列（模型）按哪份判 | 以 kind 级 `columns`（8 列）为准；4 列资产为待修复缺陷 | spec §3、§12-D2；P0 blocker 保持 |
| D3 | 三态作用面 | §6.3 表按列；结论是独立小节 | 三态按列还是按节 | 表格内按格；独立小节在标题前缀 `[人工]` | spec §12-D3 |
| D4 | 待判「允许空」 | §6.3 写「允许空」，同段又要求「必须带标记」 | 字面冲突 | 「空」= 无判定值，物理写 `[待判]` | PRD v3.1 §6.3 澄清；spec §12-D4 |
| D5 | `skipped` 语义 | §6.4 说「坏行计入 skipped 并判红」；§6.1-7 说 0 命中时 skipped=0 | 判红依据是 skipped 还是退出码 | skipped = 解析失败行数；判红 = exit≠0 | spec §12-D5；testcase TC-13/TC-14 成对覆盖 |
| D6 | 上下文 N | §2 F7 写「N 行，默认 1」 | 前后各 N 还是共 N；跨节形态 | 前后各 N（不含本行）；context 内标 section | spec §5、§12-D6 |
| D7 | 时刻粒度 | §2 F4 / §5 要求「命令 + 首行 + 时刻」 | 每格写还是每轮写一次 | 每个机算格各写一次 | spec §12-D7；testcase TC-02 按每格判 |
| D8 | 幂等与重建 | §2 F8 要求字节不变 | 重跑是否重写表头 / 节 | 首次全量；已存在只补空，不重建、不改已填 | spec §4（D4）、§12-D8 |
| D9 | `scanned` 口径 | §2 F7 只写字段名 | 是否含表头 | 只计数据行；仅表头 = 0 | spec §12-D9；testcase TC-13 期望字段 |

## 对账后仍需跟进

1. testcase 的 TC-07 键名已按 PRD v3.1 机械同步（不改判定），其余 TC 不受影响。
2. P0 blocker（三源一致）解除前，TC-01 的「8 列」期望无法实跑；该用例在 M1 前保持「阻断」状态，不得以 4 列实现冒充通过。
3. testcase 取证时越界读到 spec 第 73 行片段（未据其写入用例）——已在其 §5 自述；不影响独立性结论，保留记录。
