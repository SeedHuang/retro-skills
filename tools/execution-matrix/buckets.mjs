// buckets.mjs —— 归桶索引数据（spec §4 定稿 + §6 裁决④ ⑦ 暂留 skillAndRuleShared）
// 单项级列举：每项单独入桶（聚合名查不出「同一项两处」，机械守卫才能真正兜住）。
export const BUCKETS = [
  { name: 'allShared', items: [] }, // ⑦ 候选升格目标，升格前不定义
  { name: 'agentAndSkillShared', items: [] }, // 已裁决无交集
  { name: 'agentAndRuleShared', items: [] }, // 已裁决无交集
  { name: 'skillAndRuleShared', items: ['来源覆盖④', '冲突裁决⑤', '例外从严⑥', '验证闭环⑧', '触发机制⑦'] },
  { name: 'rule 独有', items: ['通用17', '执行力度①', '执行力度②', '执行力度③', 'X1', 'X2', 'X3'] },
  { name: 'skill 独有', items: ['跨技能路径引用', '自引用相对路径', '脚本守卫路径免疫', '目录语义'] },
  { name: 'agent 独有', items: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'] },
];
