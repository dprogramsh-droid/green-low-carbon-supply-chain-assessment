const MOCK_DATA = {
    suppliers: [
        { id: 'GREEN-SUP-001', name: '博世汽车部件（苏州）有限公司', industry: '汽车发动机零部件', tier: 'Tier1', contact: '张伟', phone: '0512-88881234', status: '合作中', grade: '优秀供应商', score: 93, tier2List: ['GREEN-SUP-006','GREEN-SUP-007','GREEN-SUP-008'] },
        { id: 'GREEN-SUP-002', name: '大陆汽车电子（长春）有限公司', industry: '电子零部件', tier: 'Tier1', contact: '李明', phone: '0431-86663456', status: '合作中', grade: '合格供应商', score: 82, tier2List: ['GREEN-SUP-009'] },
        { id: 'GREEN-SUP-003', name: '采埃孚（上海）底盘系统有限公司', industry: '底盘零部件', tier: 'Tier1', contact: '王芳', phone: '021-54325678', status: '合作中', grade: '优秀供应商', score: 91, tier2List: ['GREEN-SUP-010'] },
        { id: 'GREEN-SUP-004', name: '宁德时代新能源科技股份有限公司', industry: '新能源汽车零部件', tier: 'Tier1', contact: '陈强', phone: '0593-23456789', status: '合作中', grade: '合格供应商', score: 78, tier2List: ['GREEN-SUP-011','GREEN-SUP-012'] },
        { id: 'GREEN-SUP-005', name: '延锋汽车内饰系统有限公司', industry: '车身及内饰零部件', tier: 'Tier1', contact: '刘洋', phone: '021-37891234', status: '暂停合作', grade: '待改进供应商', score: 65, tier2List: [] },
        { id: 'GREEN-SUP-006', name: '江苏恒力精密组件有限公司', industry: '汽车发动机零部件', tier: 'Tier2', contact: '赵刚', phone: '0512-65551111', status: '合作中', grade: '合格供应商', score: 76, parentTier1: 'GREEN-SUP-001' },
        { id: 'GREEN-SUP-007', name: '宁波华翔电子科技有限公司', industry: '电子零部件', tier: 'Tier2', contact: '孙丽', phone: '0574-87776543', status: '合作中', grade: '优秀供应商', score: 90, parentTier1: 'GREEN-SUP-001' },
        { id: 'GREEN-SUP-008', name: '常州万安汽车零部件有限公司', industry: '汽车发动机零部件', tier: 'Tier2', contact: '周涛', phone: '0519-86667890', status: '合作中', grade: '待改进供应商', score: 63, parentTier1: 'GREEN-SUP-001' },
        { id: 'GREEN-SUP-009', name: '深圳市比亚迪微电子有限公司', industry: '电子零部件', tier: 'Tier2', contact: '吴静', phone: '0755-89012345', status: '合作中', grade: '合格供应商', score: 81, parentTier1: 'GREEN-SUP-002' },
        { id: 'GREEN-SUP-010', name: '万向钱潮股份有限公司', industry: '底盘零部件', tier: 'Tier2', contact: '郑凯', phone: '0571-82345678', status: '合作中', grade: '合格供应商', score: 74, parentTier1: 'GREEN-SUP-003' },
        { id: 'GREEN-SUP-011', name: '天津力神电池股份有限公司', industry: '新能源汽车零部件', tier: 'Tier2', contact: '马晓', phone: '022-23456789', status: '合作中', grade: '待改进供应商', score: 67, parentTier1: 'GREEN-SUP-004' },
        { id: 'GREEN-SUP-012', name: '惠州亿纬锂能股份有限公司', industry: '新能源汽车零部件', tier: 'Tier2', contact: '黄磊', phone: '0752-34567890', status: '终止合作', grade: '淘汰供应商', score: 52, parentTier1: 'GREEN-SUP-004' },
    ],

    gradingStandards: [
        { dimension: '绿色合规能力', indicator: '核心合规认证获取情况', weight: 30, ruleTier1: 'ISO 14001、IATF 16949、REACH/ELV 等核心认证，缺一项扣20分', ruleTier2: '满足对应 Tier1 传递的认证要求，缺一项扣25分' },
        { dimension: '绿色合规能力', indicator: '近1年合规审查结果', weight: 20, ruleTier1: '无违规满分；轻微违规已整改60分；严重违规0分', ruleTier2: '同 Tier1 标准' },
        { dimension: '绿色运营能力', indicator: '核心绿色指标达标率', weight: 30, ruleTier1: '碳排放量、能耗效率等指标达标满分，单项不达标扣10分', ruleTier2: '上游碳足迹、配套合规率达标满分，单项不达标扣12分' },
        { dimension: '绿色运营能力', indicator: '绿色目标完成率', weight: 20, ruleTier1: '≥90%满分；70-90%得60分；<70%得0分', ruleTier2: '完成率需经 Tier1 确认后纳入评分' },
    ],

    complianceRecords: [
        { id: 'GREEN-AUD-001', supplier: 'GREEN-SUP-001', supplierName: '博世汽车部件（苏州）有限公司', type: '年度审查', period: '2025年度', auditor: '张主管', time: '2025-12-15', status: '合规', scope: ['生产过程环保合规','产品合规','认证资质有效性'], issues: '无' },
        { id: 'GREEN-AUD-002', supplier: 'GREEN-SUP-004', supplierName: '宁德时代新能源科技股份有限公司', type: '专项审查', period: '2025年Q4', auditor: '李主管', time: '2025-11-20', status: '待整改', scope: ['碳足迹核算合规','生产过程环保合规'], issues: '碳足迹核算方法不规范，需按 ISO 14067 标准重新核算' },
        { id: 'GREEN-AUD-003', supplier: 'GREEN-SUP-008', supplierName: '常州万安汽车零部件有限公司', type: '整改复查', period: '2025年Q4', auditor: '王主管', time: '2025-12-01', status: '不合规', scope: ['VOCs治理合规','产品合规'], issues: '涂装工序 VOCs 排放超标15%，ELV 指令合规检测未通过' },
        { id: 'GREEN-AUD-004', supplier: 'GREEN-SUP-011', supplierName: '天津力神电池股份有限公司', type: '年度审查', period: '2025年度', auditor: '张主管', time: '2025-12-10', status: '待整改', scope: ['供应链上游合规','认证资质有效性'], issues: 'REACH 高关注物质检测报告过期，需重新送检' },
        { id: 'GREEN-AUD-005', supplier: 'GREEN-SUP-003', supplierName: '采埃孚（上海）底盘系统有限公司', type: '年度审查', period: '2025年度', auditor: '李主管', time: '2025-12-18', status: '合规', scope: ['生产过程环保合规','产品合规','碳足迹核算合规'], issues: '无' },
    ],

    indicators: [
        { id: 'GREEN-IND-001', name: '单位零部件碳排放量', category: '碳排放类', scope: 'Tier1', weight: 20, unit: 'kg CO₂/件', excellent: '≤2', qualified: '2-5', improve: '>5' },
        { id: 'GREEN-IND-002', name: '生产能耗效率', category: '能源消耗类', scope: '通用', weight: 15, unit: 'kWh/件', excellent: '≤0.5', qualified: '0.5-1.0', improve: '>1.0' },
        { id: 'GREEN-IND-003', name: '金属废料回收率', category: '废料回收类', scope: '通用', weight: 15, unit: '%', excellent: '≥95', qualified: '85-95', improve: '<85' },
        { id: 'GREEN-IND-004', name: 'VOCs 排放量', category: 'VOCs治理类', scope: 'Tier1', weight: 10, unit: 'kg VOCs/吨产品', excellent: '≤0.5', qualified: '0.5-1.5', improve: '>1.5' },
        { id: 'GREEN-IND-005', name: '轻量化材料使用率', category: '轻量化材料类', scope: 'Tier1', weight: 10, unit: '%', excellent: '≥40', qualified: '20-40', improve: '<20' },
        { id: 'GREEN-IND-006', name: 'ELV 指令合规达标率', category: '合规认证类', scope: '通用', weight: 10, unit: '%', excellent: '100', qualified: '≥95', improve: '<95' },
        { id: 'GREEN-IND-007', name: 'REACH 物质合规率', category: '合规认证类', scope: '通用', weight: 10, unit: '%', excellent: '100', qualified: '≥98', improve: '<98' },
        { id: 'GREEN-IND-008', name: '上游原材料碳足迹', category: '碳排放类', scope: 'Tier2', weight: 25, unit: 'kg CO₂/单位材料', excellent: '≤1', qualified: '1-3', improve: '>3' },
        { id: 'GREEN-IND-009', name: '配套产品绿色合规率', category: 'Tier2协同类', scope: 'Tier2', weight: 20, unit: '%', excellent: '100', qualified: '≥95', improve: '<95' },
        { id: 'GREEN-IND-010', name: '供应链协同减排完成率', category: 'Tier2协同类', scope: 'Tier2', weight: 15, unit: '%', excellent: '≥95', qualified: '80-95', improve: '<80' },
    ],

    assessments: [
        { id: 'GREEN-EVA-001', supplier: 'GREEN-SUP-001', supplierName: '博世汽车部件（苏州）有限公司', assessor: '主机厂', period: '2025年度', responsible: '张主管', time: '2025-12-20', score: 93, grade: '优秀供应商', issues: '轻量化材料使用率需进一步提升', suggestion: '建议加大碳纤维复合材料研发投入', status: '已完成' },
        { id: 'GREEN-EVA-002', supplier: 'GREEN-SUP-004', supplierName: '宁德时代新能源科技股份有限公司', assessor: '主机厂', period: '2025年度', responsible: '李主管', time: '2025-12-22', score: 78, grade: '合格供应商', issues: '动力电池碳排放量偏高、VOCs 治理不达标', suggestion: '引入低碳正极材料，升级涂装废气处理设备', status: '已完成' },
        { id: 'GREEN-EVA-003', supplier: 'GREEN-SUP-008', supplierName: '常州万安汽车零部件有限公司', assessor: 'Tier1', relatedTier1: '博世汽车部件（苏州）有限公司', period: '2025年度', responsible: '张伟', time: '2025-12-18', score: 63, grade: '待改进供应商', issues: '上游原材料碳足迹超标、REACH合规率不足', suggestion: '更换低排放原材料供应商，建立REACH物质台账', status: '改进中', improveDueDate: '2026-03-31' },
        { id: 'GREEN-EVA-004', supplier: 'GREEN-SUP-007', supplierName: '宁波华翔电子科技有限公司', assessor: 'Tier1', relatedTier1: '博世汽车部件（苏州）有限公司', period: '2025年度', responsible: '张伟', time: '2025-12-16', score: 90, grade: '优秀供应商', issues: '无明显短板', suggestion: '继续保持，推荐纳入协同减排示范项目', status: '已完成' },
        { id: 'GREEN-EVA-005', supplier: 'GREEN-SUP-012', supplierName: '惠州亿纬锂能股份有限公司', assessor: 'Tier1', relatedTier1: '宁德时代新能源科技股份有限公司', period: '2025年度', responsible: '陈强', time: '2025-12-14', score: 52, grade: '淘汰供应商', issues: '多项绿色指标严重不达标、合规认证缺失', suggestion: '终止合作，列入供应商淘汰名单', status: '已完成' },
    ],

    dataUploads: [
        { id: 'GREEN-DATA-001', supplier: 'GREEN-SUP-001', supplierName: '博世汽车部件（苏州）有限公司', cycle: '月度', time: '2026-01-15', indicator: '单位零部件碳排放量', value: '1.8 kg CO₂/件', file: '2025Q4碳排放报告.pdf', verifyStatus: '验证通过', verifier: '张主管', opinion: '数据与第三方核查一致' },
        { id: 'GREEN-DATA-002', supplier: 'GREEN-SUP-004', supplierName: '宁德时代新能源科技股份有限公司', cycle: '季度', time: '2026-01-10', indicator: '生产能耗效率', value: '0.72 kWh/件', file: '2025Q4能耗报告.xlsx', verifyStatus: '待验证', verifier: '', opinion: '' },
        { id: 'GREEN-DATA-003', supplier: 'GREEN-SUP-008', supplierName: '常州万安汽车零部件有限公司', cycle: '月度', time: '2026-01-12', indicator: '上游原材料碳足迹', value: '3.5 kg CO₂/单位材料', file: '原材料碳足迹报告.pdf', verifyStatus: '验证不通过', verifier: '王主管', opinion: '碳排放量数据与第三方核查结果不一致', reuploadDeadline: '2026-02-01' },
        { id: 'GREEN-DATA-004', supplier: 'GREEN-SUP-007', supplierName: '宁波华翔电子科技有限公司', cycle: '月度', time: '2026-01-14', indicator: '金属废料回收率', value: '96%', file: '废料回收统计.xlsx', verifyStatus: '验证通过', verifier: '张主管', opinion: '数据准确' },
    ],

    monitoring: [
        { id: 'GREEN-MON-001', supplier: 'GREEN-SUP-001', supplierName: '博世汽车部件（苏州）有限公司', indicator: '单位零部件碳排放量', currentValue: 1.8, unit: 'kg CO₂/件', threshold: 5, alertStatus: '正常', trend: [2.1, 2.0, 1.9, 1.9, 1.8, 1.8] },
        { id: 'GREEN-MON-002', supplier: 'GREEN-SUP-004', supplierName: '宁德时代新能源科技股份有限公司', indicator: '生产能耗效率', currentValue: 0.72, unit: 'kWh/件', threshold: 1.0, alertStatus: '正常', trend: [0.85, 0.82, 0.78, 0.75, 0.73, 0.72] },
        { id: 'GREEN-MON-003', supplier: 'GREEN-SUP-008', supplierName: '常州万安汽车零部件有限公司', indicator: '上游原材料碳足迹', currentValue: 3.5, unit: 'kg CO₂/单位材料', threshold: 3, alertStatus: '异常', trend: [2.8, 2.9, 3.1, 3.2, 3.4, 3.5] },
        { id: 'GREEN-MON-004', supplier: 'GREEN-SUP-005', supplierName: '延锋汽车内饰系统有限公司', indicator: 'VOCs 排放量', currentValue: 1.3, unit: 'kg VOCs/吨产品', threshold: 1.5, alertStatus: '预警', trend: [0.9, 1.0, 1.1, 1.1, 1.2, 1.3] },
        { id: 'GREEN-MON-005', supplier: 'GREEN-SUP-003', supplierName: '采埃孚（上海）底盘系统有限公司', indicator: '金属废料回收率', currentValue: 97, unit: '%', threshold: 85, alertStatus: '正常', trend: [94, 95, 95, 96, 97, 97] },
        { id: 'GREEN-MON-006', supplier: 'GREEN-SUP-011', supplierName: '天津力神电池股份有限公司', indicator: '配套产品绿色合规率', currentValue: 91, unit: '%', threshold: 95, alertStatus: '预警', trend: [96, 95, 94, 93, 92, 91] },
    ],

    targets: [
        { id: 'GREEN-OBJ-001', supplier: 'GREEN-SUP-001', supplierName: '博世汽车部件（苏州）有限公司', tierAttr: 'Tier1 自主目标', type: '碳排放减少', indicator: '单位零部件碳排放量', targetValue: '减少15%', currentValue: '12%', progress: 80, period: '2025-2026年度', status: '进行中', maker: '张伟' },
        { id: 'GREEN-OBJ-002', supplier: 'GREEN-SUP-004', supplierName: '宁德时代新能源科技股份有限公司', tierAttr: 'Tier1 自主目标', type: '能源效率提升', indicator: '生产能耗效率', targetValue: '提升20%', currentValue: '14%', progress: 70, period: '2025-2026年度', status: '进行中', maker: '陈强' },
        { id: 'GREEN-OBJ-003', supplier: 'GREEN-SUP-008', supplierName: '常州万安汽车零部件有限公司', tierAttr: 'Tier1 下达 Tier2 目标', type: 'Tier2 协同减排', indicator: '上游原材料碳足迹', targetValue: '≤2 kg CO₂/单位材料', currentValue: '3.5 kg CO₂/单位材料', progress: 30, period: '2025-2026年度', status: '进行中', maker: '张伟', tier1Confirm: '已确认', reason: '' },
        { id: 'GREEN-OBJ-004', supplier: 'GREEN-SUP-007', supplierName: '宁波华翔电子科技有限公司', tierAttr: 'Tier2 自主目标', type: '废料回收优化', indicator: '金属废料回收率', targetValue: '≥98%', currentValue: '96%', progress: 85, period: '2025-2026年度', status: '进行中', maker: '孙丽', tier1Confirm: '已确认' },
        { id: 'GREEN-OBJ-005', supplier: 'GREEN-SUP-005', supplierName: '延锋汽车内饰系统有限公司', tierAttr: 'Tier1 自主目标', type: '合规认证获取', indicator: 'REACH 物质合规率', targetValue: '100%', currentValue: '92%', progress: 55, period: '2025-2026年度', status: '未达标', maker: '刘洋', reason: '轻量化材料替代方案推进缓慢' },
    ],

    trainings: [
        { id: 'GREEN-TRN-001', topic: '汽车零部件行业碳足迹核算方法', target: '所有供应商', form: '线上直播', time: '2026-01-20 14:00', lecturer: '王教授（外部顾问）', duration: '3小时', participants: 28, rating: '优秀' },
        { id: 'GREEN-TRN-002', topic: 'CBAM 与 REACH 合规解读', target: '待改进供应商', form: '线下研讨会', time: '2026-02-10 09:00', lecturer: '李经理（内部专家）', duration: '1天', participants: 8, rating: '良好' },
        { id: 'GREEN-TRN-003', topic: 'VOCs 治理技术与设备升级', target: '合格供应商', form: '视频课程', time: '2026-02-15 10:00', lecturer: '张工（外部顾问）', duration: '2小时', participants: 15, rating: '良好' },
        { id: 'GREEN-TRN-004', topic: 'ELV 指令合规要求与应对', target: '所有供应商', form: '文档学习', time: '2026-03-01', lecturer: '合规团队', duration: '自学', participants: 0, rating: '-' },
    ],

    communications: [
        { id: 'GREEN-COM-001', topic: '2026年度绿色目标分解说明', parties: '博世(Tier1) - 常州万安(Tier2)', form: '线上会议', time: '2026-01-08 10:00', participants: '张伟(博世)、周涛(万安)', summary: '就 Tier2 碳足迹减排目标、改进措施进行沟通，确定2026年目标值及分解依据', conclusion: '达成一致，Tier2 承诺2026年底前将碳足迹降至2 kg CO₂/单位材料以下', actionItems: [{person:'周涛', action:'制定碳足迹改善计划', deadline:'2026-02-15', status:'进行中'}] },
        { id: 'GREEN-COM-002', topic: '合规问题整改跟进', parties: '宁德时代(Tier1) - 力神电池(Tier2)', form: '电话沟通', time: '2026-01-15 15:30', participants: '陈强(宁德时代)、马晓(力神)', summary: 'REACH 高关注物质检测报告过期问题整改进展沟通', conclusion: '力神承诺2月底前完成重新送检并提交报告', actionItems: [{person:'马晓', action:'送检REACH物质', deadline:'2026-02-28', status:'进行中'}] },
        { id: 'GREEN-COM-003', topic: '培训需求对接', parties: '系统管理方 - 全体Tier1供应商', form: '邮件沟通', time: '2026-01-18', participants: '系统管理员、各Tier1联系人', summary: '征集2026年上半年绿色能力培训需求', conclusion: '收集到碳足迹核算、CBAM合规、VOCs治理等3项高频需求', actionItems: [{person:'系统管理员', action:'制定培训计划', deadline:'2026-02-01', status:'已完成'}] },
    ],

    questionnaires: [
        { id: 'GREEN-QST-001', topic: '供应商绿色合规能力现状调研', target: 'Tier1 供应商', releaseTime: '2026-01-05', deadline: '2026-01-20', releaser: '系统管理员', status: '已截止', sent: 5, received: 5, rate: '100%' },
        { id: 'GREEN-QST-002', topic: '绿色技术应用需求调研', target: 'Tier2 供应商', releaseTime: '2026-01-10', deadline: '2026-01-25', releaser: '张主管', status: '已截止', sent: 7, received: 5, rate: '71.4%' },
        { id: 'GREEN-QST-003', topic: '碳减排目标达成可行性调研', target: '全部供应商', releaseTime: '2026-02-01', deadline: '2026-02-20', releaser: '系统管理员', status: '回收中', sent: 12, received: 8, rate: '66.7%' },
    ],

    notifications: [
        { type: 'danger', title: '指标异常预警', desc: '常州万安 - 上游原材料碳足迹超阈值（3.5 > 3.0 kg CO₂/单位材料）', time: '10分钟前' },
        { type: 'warning', title: '指标预警', desc: '延锋内饰 - VOCs排放量接近阈值（1.3/1.5 kg VOCs/吨产品）', time: '2小时前' },
        { type: 'warning', title: '指标预警', desc: '力神电池 - 配套产品绿色合规率低于阈值（91% < 95%）', time: '3小时前' },
        { type: '', title: '数据上传提醒', desc: '2月度数据上传截止日期为2026-02-28，请各供应商及时提交', time: '1天前' },
        { type: '', title: '培训通知', desc: 'ELV 指令合规要求学习材料已上传，请所有供应商在3月1日前完成学习', time: '2天前' },
    ]
};
