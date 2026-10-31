// 卡面段与必渲染字段的唯一单源（spec §3 :62 / §5.1 :121-145）。
// 三处都从这里读：模板（`templates/agent-card.md.tpl`）、`renderCard` 的防御式断言、测试的期望集。
// **不得**在别处再写第二份段名 / 字段名 / 探针词表（V-4 只认本文件）。
export const CARD_SEGMENTS = Object.freeze(['职责', '一定会', '禁止', '冲突裁决', '本席清单', '输出格式', '边界'])

// 「一定会」每行必渲染的字段名（spec :127：触发 / 宾语 / 判据 id / 落点 / 前置）
export const MUST_FIELDS = Object.freeze(['trigger', 'objects', 'criterion', 'landing', 'requires'])

// 零散文探针：三类固定键名（spec :62）。`oldSegments` = 旧模板节名，`declaration` = 声明句式（含两条正则），
// `pointers` = S1 `POINTER_WORDS` 的镜像——判定必须是「词 + 后随章节号」的同形匹配，不是裸子串（spec :143）。
export const PROSE_PROBES = Object.freeze({
  oldSegments: Object.freeze(['共享特质', '通用纪律', '固定必问', '自由探索', '你是谁']),
  declaration: Object.freeze(['声明：', '心算', '代填', /必由.*本人/, '注：']),
  pointers: Object.freeze(['见', '详见', '参见', '参考', '按 §']),
})
