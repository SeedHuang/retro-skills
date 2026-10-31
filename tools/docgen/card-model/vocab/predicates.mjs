// 谓词登记表（spec §3 :63）：`criterion` 的合法取值集合。
// 值形状写死 `{ label, impl }`；`impl` 只取 `'script'` / `'manual'`——`manual` = 由 AI 判、无脚本实现，
// 不是「未实现」（S1 `MissingCriterionImpl` 的豁免面）。
// 新增条目 = 新增判据 id，必须同批出现在某条 `must` / `never` 的 `criterion` 上，否则是死数据。
export const PREDICATES = Object.freeze({
  'impartial-long-term': Object.freeze({ label: '立场客观且按项目长远判断', impl: 'manual' }),
  'evidence-recomputable': Object.freeze({ label: '结论附可复算证据（文件:行号 或 命令输出）', impl: 'manual' }),
  'plain-expression': Object.freeze({ label: '用非专业人员也能听懂的方式表达', impl: 'manual' }),
  'no-fake-problem': Object.freeze({ label: '无问题时显式声明「全过、无问题」', impl: 'manual' }),
  'issue-without-solution': Object.freeze({ label: '只提问题不给解法', impl: 'manual' }),
  'out-of-scope-self-disposal': Object.freeze({ label: '越出职责自行处置', impl: 'manual' }),
  'blank-evidence': Object.freeze({ label: '证据栏留空', impl: 'manual' }),
  'proxy-fill': Object.freeze({ label: '代他人填写其本人应填的表', impl: 'manual' }),
})
