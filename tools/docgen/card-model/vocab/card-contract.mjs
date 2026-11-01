// 卡面契约文本的**唯一写死处**（spec §3 落点 #1 / §6 D2）：模板只放占位符、渲染器只 import 常量，
// 卡面里出现的契约字面一律经这里注入（`S2-TC-E01` / `E07`：模板与渲染器 0 字面）。
// 键源全部派生：`TYPE_LABELS` ← `enums.mjs` 的 `CHECK_KINDS`；`TRISTATE` ← `enums.mjs` 的 `VERDICTS` + `reason`。
// 导出面恰 4 个（`S2-TC-A01`：多一 / 少一 / 改名即红）。
// **刻意不用 `Object.freeze`**：`S2-TC-B08` 要在同进程内改 `TRISTATE[0]` 看渲染是否跟随、
// `S2-TC-E03` 要临时把一个未登记名加进 `ALLOWED_PRODUCT_NAMES` 看守卫是否只认这一处——
// 冻结会把这些「改一处即观察收敛」的探针变成 TypeError（假红），与用例语义相反。
import { CHECK_KINDS, VERDICTS } from '../enums.mjs'

// 类型列三值（顺序与 `CHECK_KINDS` 同序：script / ai / manual）
const TYPE_TEXT = ['脚本核对', 'AI 判定', '人工判定']

export const TYPE_LABELS = Object.fromEntries(Object.keys(CHECK_KINDS).map((kind, i) => [kind, TYPE_TEXT[i]]))

// 三态行：1 行中文解释 + 三态三值（派生自 `VERDICTS`）+ `reason`（`VERDICTS` 只有 3 值，故 reason 自带）
export const TRISTATE = [
  '判定取值只能用 hit / miss / na；判 miss 或 na 都必须写 reason，缺 reason = 废卡。',
  ...Object.keys(VERDICTS),
  'reason',
]

// 产物允许名（许）：三态值 + AI 写进 JSON 的三个键。**不得含类型英文键**（那三个键只在 `TYPE_LABELS` 里）
export const ALLOWED_PRODUCT_NAMES = [
  ...Object.values(VERDICTS),
  'reason',
  'evidence',
  'verdict',
]

// 输出格式三判句（每条含「废卡」且含「缺」或「空」＝可二值判，不是形容词）
export const FORMAT_CHECKS = [
  '问题卡缺任一必填字段 = 废卡，不得只给结论。',
  '证据栏为空 = 废卡，须写文件:行号或命令输出首行。',
  '建议解法栏缺内容或空 = 废卡，须给可执行一条。',
]
