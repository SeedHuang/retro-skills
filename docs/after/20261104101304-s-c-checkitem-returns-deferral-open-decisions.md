# S-C：D6 的「逐项返回」未处置（押后，带触发）

> 状态：**未决（押后，未定稿）**｜创建 2026-11-04 10:13｜来源：S-C 卡面形状 ② 段议会轮 1 的 `P-1`（产品席，P0）
> 何时搬走：PRD 下一次修订、或出现「逐项判定」的真实消费者（某工具/流程要读 `checkItems[]` 的返回声明）时——把结论并入 PRD 或改判 D16 ④，本文件删。

## 1 为什么押后

- PRD §9 给 S-C 的第 ③ 项大纲是「`checkItem` 返回声明（D5 / D6）」。D6 的原话是「`checkItems` 7 条里 4 条『核对…是否…』缺返回」。
- 但 **D16 ④ 明令不得新增 `checkItem.returns`**（「逐项字段既无码位、无消费者，又会让取值出现第三份副本」）。
- S-C 的实际处置 = **返回类型由「本席清单」表头一处声明**（`VERDICT_HINT`）+ 动作行的「写回」（`duty.action`）。这覆盖了「有明确返回」，但**没有重写那 4 条 criterion 的文案**。
- 重写 97 条 `checkItems[].criterion` 会动 15 席数据里的检查项语义，超出 S-C 的边界（PRD §8 的 S-C 行只写「卡面形状」），且没有任何机械判据能判「重写后的返回是否切题」。

## 2 现状与影响

| 项 | 现状 | 影响 |
|---|---|---|
| `checkItems[].criterion` 的「返回」 | 由表头 `VERDICT_HINT` 一处声明（`hit` / `miss` / `na` + reason 规则） | 逐条 criterion 仍写「核对 X 并写出原文引句」——**读起来像只有动作、没有返回** |
| 消费者 | `tools/observation-check/checks.mjs` 判 `items[].verdict` | 机器侧只认 `verdict` 三值，不读 criterion 文案；故「文案缺返回」不影响机器判定 |
| 人读面 | 15 席的「本席清单」表 | 读者需自行把 criterion 与表头取值连起来（表头已是唯一声明处） |

## 3 触发与谁兜

| 事项 | 触发 | 谁兜 |
|---|---|---|
| 重写那 4 条 criterion 文案（或按 D6 全量重写 97 条） | PRD 下一次修订；或出现「逐项判定」的真实消费者；或 ④ 段抽核连续两批指出「criterion 读不出返回」 | 该次 PRD 修订的产品经理 + 实现该消费者的开发 |
| 若决定给 `checkItem` 加返回字段 | 同上，且须先改 D16 ④（属回 PRD 重签 §0） | 用户（D16 是用户裁定） |

## 4 来源与复算

- 议会卡原文：`.session/reviews/2026-11-04-0840-sc-card-shape-spec-parliament/cards.md` 的 `P-1`（该目录不进 git）
- spec 侧裁定：`docs/superpowers/specs/2026-11-03-s-c-card-shape-design.md` §11.12（「D6 的『逐项返回文案重写』延后」）
- 取数：`(Select-String -Path tools\docgen\data\seats\*.json -Pattern '"criterion"').Count` → 97 条
