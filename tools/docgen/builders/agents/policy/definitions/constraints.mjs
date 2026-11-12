// 职责约束登记表（S3 spec §3 S3-D1）：**唯一**存放「约束：」整句文本的地方。
// 席数据只能写 id（`card.duty.constraints: ['duty.evidence']`），文本由 loader 查本表后派生，
// 故席级没有可写权限叙述的位置；文本同时受卡片散文探针与 `WRITE_DENIAL_PHRASES` 双锁。
// 粒度 = 整句（不做子句拆分）：迁移要求卡面零字节变化（spec I-4），拆分会改 `；` / `。` 归并。
export const constraints = {
  'duty.default': {
    text: '按本席职责与边界执行；越出边界的动作只记录，不自行处置',
  },
  'duty.observe': {
    text: '只记录不裁决；观察记录原文进最终报告，不得删改；每条记录必须引用真实卡号',
  },
  'duty.host': {
    text: '不出观点、不写问题卡；两张审计表只由责任席填写。程序动作越出边界的只记录，不自行处置',
  },
  'duty.evidence': {
    text: '取证通读：不出观点、不出问题卡、不参与评审、不判技术对错；只交可核对的原文与行号',
  },
  'duty.arch-defense': {
    text: '只核实与汇总，不改代码、不写评审结论；越出边界的动作只记录，不自行处置',
  },
  'duty.dev-defense': {
    text: '只核实不改代码；可跑命令复现，命令输出首行须原文摘录；越出边界的动作只记录，不自行处置',
  },
  'duty.test-design': {
    text: '只写本次 spec 同目录的 testcase 与测试设计文档；业务代码、spec、rule、skill、agent 只读；越出边界的动作只记录，不自行处置',
  },
};
