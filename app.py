"""
绿色低碳供应链评估系统 —— 面向链主企业
核心实体：评估指标、指标包、评估规则、情景模式、评估方案、评估记录
"""

import json
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

FILES = {
    "indicators": DATA_DIR / "indicators.json",
    "packages": DATA_DIR / "packages.json",
    "rules": DATA_DIR / "rules.json",
    "scenarios": DATA_DIR / "scenarios.json",
    "plans": DATA_DIR / "plans.json",
    "records": DATA_DIR / "records.json",
}


def _load(key):
    p = FILES[key]
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return []


def _save(key, data):
    FILES[key].write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _find(collection, item_id):
    for item in collection:
        if item["id"] == item_id:
            return item
    return None


def _new_id():
    return str(uuid.uuid4())[:8]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Seed 默认数据
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _seed():
    if _load("indicators"):
        return

    # ── 评估指标 ──────────────────────────────────────────────────────
    indicators = [
        # 绿色采购
        {"id": "I01", "category": "绿色采购", "name": "绿色原材料采购比例", "description": "采购的原材料中符合绿色环保标准的比例", "unit": "%", "dataType": "quantitative"},
        {"id": "I02", "category": "绿色采购", "name": "供应商环保资质覆盖率", "description": "拥有环保认证（ISO14001等）的供应商占比", "unit": "%", "dataType": "quantitative"},
        {"id": "I03", "category": "绿色采购", "name": "本地化采购比例", "description": "一定半径范围内本地供应商采购占比", "unit": "%", "dataType": "quantitative"},
        {"id": "I04", "category": "绿色采购", "name": "禁限用物质管控达标率", "description": "采购物料中禁限用物质检测合格率", "unit": "%", "dataType": "quantitative"},
        # 绿色生产
        {"id": "I05", "category": "绿色生产", "name": "清洁能源使用比例", "description": "生产过程中使用清洁能源的比例", "unit": "%", "dataType": "quantitative"},
        {"id": "I06", "category": "绿色生产", "name": "废弃物回收利用率", "description": "生产废弃物被回收利用的比率", "unit": "%", "dataType": "quantitative"},
        {"id": "I07", "category": "绿色生产", "name": "节能设备使用率", "description": "达到节能标准的生产设备占比", "unit": "%", "dataType": "quantitative"},
        {"id": "I08", "category": "绿色生产", "name": "单位产值能耗下降率", "description": "年度单位产值能耗较上年的下降比例", "unit": "%", "dataType": "quantitative"},
        {"id": "I09", "category": "绿色生产", "name": "污染物排放达标率", "description": "各排放口污染物浓度均低于标准限值的比率", "unit": "%", "dataType": "quantitative"},
        # 绿色物流
        {"id": "I10", "category": "绿色物流", "name": "绿色运输方式使用率", "description": "使用新能源车辆/铁路等低碳运输方式的比例", "unit": "%", "dataType": "quantitative"},
        {"id": "I11", "category": "绿色物流", "name": "包装材料可回收比例", "description": "物流包装中使用可回收/可降解材料的比例", "unit": "%", "dataType": "quantitative"},
        {"id": "I12", "category": "绿色物流", "name": "物流路线优化覆盖率", "description": "已实施路线优化调度的物流线路占比", "unit": "%", "dataType": "quantitative"},
        {"id": "I13", "category": "绿色物流", "name": "空载率控制水平", "description": "物流车辆空载率低于行业标准的达标率", "unit": "%", "dataType": "quantitative"},
        # 绿色仓储
        {"id": "I14", "category": "绿色仓储", "name": "绿色仓库认证达标率", "description": "通过绿色建筑或绿色仓储认证的仓库占比", "unit": "%", "dataType": "quantitative"},
        {"id": "I15", "category": "绿色仓储", "name": "仓储能耗达标率", "description": "单位仓储面积能耗低于行业标准的仓库占比", "unit": "%", "dataType": "quantitative"},
        {"id": "I16", "category": "绿色仓储", "name": "智能仓储覆盖率", "description": "使用智能化管理系统的仓库占比", "unit": "%", "dataType": "quantitative"},
        # 管理体系
        {"id": "I17", "category": "管理体系", "name": "环境管理体系认证率", "description": "通过ISO14001等环境管理体系认证的业务覆盖率", "unit": "%", "dataType": "quantitative"},
        {"id": "I18", "category": "管理体系", "name": "低碳目标设定与追踪", "description": "是否设定明确的低碳减排目标并定期追踪", "unit": "等级", "dataType": "qualitative"},
        {"id": "I19", "category": "管理体系", "name": "绿色供应链信息披露", "description": "定期发布绿色供应链相关信息的规范程度", "unit": "等级", "dataType": "qualitative"},
        {"id": "I20", "category": "管理体系", "name": "绿色培训覆盖率", "description": "供应链相关人员参与绿色低碳培训的覆盖率", "unit": "%", "dataType": "quantitative"},
        # 产品绿色设计
        {"id": "I21", "category": "产品绿色设计", "name": "产品可回收设计比例", "description": "在设计阶段考虑可回收/可拆解的产品比例", "unit": "%", "dataType": "quantitative"},
        {"id": "I22", "category": "产品绿色设计", "name": "绿色材料替代率", "description": "使用环保替代材料的产品比例", "unit": "%", "dataType": "quantitative"},
        {"id": "I23", "category": "产品绿色设计", "name": "产品轻量化达成率", "description": "实现轻量化设计目标的产品比例", "unit": "%", "dataType": "quantitative"},
        # 逆向供应链
        {"id": "I24", "category": "逆向供应链", "name": "产品回收率", "description": "售后产品回收再利用的比率", "unit": "%", "dataType": "quantitative"},
        {"id": "I25", "category": "逆向供应链", "name": "废旧物资处置合规率", "description": "废旧物资处置符合环保法规的比率", "unit": "%", "dataType": "quantitative"},
        # 供应商协同
        {"id": "I26", "category": "供应商协同", "name": "供应商绿色绩效考核覆盖率", "description": "将绿色指标纳入供应商考核的覆盖率", "unit": "%", "dataType": "quantitative"},
        {"id": "I27", "category": "供应商协同", "name": "供应商绿色能力提升计划", "description": "为供应商提供绿色能力提升支持的覆盖率", "unit": "%", "dataType": "quantitative"},
        {"id": "I28", "category": "供应商协同", "name": "供应商环境违规率", "description": "近一年内发生环境违规的供应商占比（越低越好）", "unit": "%", "dataType": "quantitative"},
    ]
    _save("indicators", indicators)

    # ── 指标包 ────────────────────────────────────────────────────────
    packages = [
        {
            "id": "PKG01",
            "name": "基础合规包",
            "description": "覆盖环保合规底线要求，适用于所有供应商基本准入评估",
            "indicatorIds": ["I02", "I04", "I09", "I17", "I25", "I28"],
            "color": "#16a34a",
        },
        {
            "id": "PKG02",
            "name": "绿色采购包",
            "description": "聚焦采购环节的绿色化水平评估",
            "indicatorIds": ["I01", "I02", "I03", "I04"],
            "color": "#0891b2",
        },
        {
            "id": "PKG03",
            "name": "绿色生产包",
            "description": "评估生产制造环节的节能减排与清洁生产能力",
            "indicatorIds": ["I05", "I06", "I07", "I08", "I09"],
            "color": "#7c3aed",
        },
        {
            "id": "PKG04",
            "name": "绿色物流仓储包",
            "description": "覆盖物流运输与仓储环节的绿色管理水平",
            "indicatorIds": ["I10", "I11", "I12", "I13", "I14", "I15", "I16"],
            "color": "#c2410c",
        },
        {
            "id": "PKG05",
            "name": "管理体系与协同包",
            "description": "评估绿色管理体系完善程度和供应商协同能力",
            "indicatorIds": ["I17", "I18", "I19", "I20", "I26", "I27"],
            "color": "#b91c1c",
        },
        {
            "id": "PKG06",
            "name": "产品全生命周期包",
            "description": "聚焦产品设计、使用到回收的全生命周期绿色评估",
            "indicatorIds": ["I21", "I22", "I23", "I24", "I25"],
            "color": "#0d9488",
        },
        {
            "id": "PKG07",
            "name": "全面评估包",
            "description": "涵盖所有绿色低碳指标，适用于链主企业年度综合评估",
            "indicatorIds": [f"I{str(i).zfill(2)}" for i in range(1, 29)],
            "color": "#4338ca",
        },
    ]
    _save("packages", packages)

    # ── 评估规则 ──────────────────────────────────────────────────────
    rules = [
        {
            "id": "R01",
            "name": "标准四级评定",
            "description": "按分数划分为优秀/良好/一般/待改进四个等级",
            "weightMode": "equal",
            "grades": [
                {"name": "优秀", "min": 90, "max": 100, "color": "#16a34a"},
                {"name": "良好", "min": 75, "max": 89, "color": "#2563eb"},
                {"name": "一般", "min": 60, "max": 74, "color": "#d97706"},
                {"name": "待改进", "min": 0, "max": 59, "color": "#dc2626"},
            ],
            "scoringScale": 100,
            "passScore": 60,
        },
        {
            "id": "R02",
            "name": "严格五级评定",
            "description": "更细粒度的五级评定，适用于对绿色要求较高的行业",
            "weightMode": "weighted",
            "grades": [
                {"name": "卓越", "min": 95, "max": 100, "color": "#065f46"},
                {"name": "优秀", "min": 85, "max": 94, "color": "#16a34a"},
                {"name": "良好", "min": 70, "max": 84, "color": "#2563eb"},
                {"name": "合格", "min": 60, "max": 69, "color": "#d97706"},
                {"name": "不合格", "min": 0, "max": 59, "color": "#dc2626"},
            ],
            "scoringScale": 100,
            "passScore": 60,
        },
        {
            "id": "R03",
            "name": "通过/不通过",
            "description": "仅判断是否达到准入门槛，适用于供应商资质审查",
            "weightMode": "equal",
            "grades": [
                {"name": "通过", "min": 70, "max": 100, "color": "#16a34a"},
                {"name": "不通过", "min": 0, "max": 69, "color": "#dc2626"},
            ],
            "scoringScale": 100,
            "passScore": 70,
        },
    ]
    _save("rules", rules)

    # ── 情景模式 ──────────────────────────────────────────────────────
    scenarios = [
        {
            "id": "S01",
            "name": "供应商准入评估",
            "description": "新供应商入围时的绿色低碳基本资质审查，聚焦合规底线",
            "icon": "shield",
            "industry": "通用",
            "packageIds": ["PKG01"],
            "ruleId": "R03",
            "applicableScope": "新供应商",
        },
        {
            "id": "S02",
            "name": "年度供应商绿色绩效评估",
            "description": "对已合作供应商进行年度绿色低碳绩效综合评估",
            "icon": "chart",
            "industry": "通用",
            "packageIds": ["PKG02", "PKG03", "PKG05"],
            "ruleId": "R01",
            "applicableScope": "现有供应商",
        },
        {
            "id": "S03",
            "name": "制造业全链条评估",
            "description": "面向制造业链主企业的供应链全环节绿色低碳评估",
            "icon": "factory",
            "industry": "制造业",
            "packageIds": ["PKG07"],
            "ruleId": "R02",
            "applicableScope": "全链条",
        },
        {
            "id": "S04",
            "name": "物流仓储专项评估",
            "description": "针对物流仓储环节的绿色低碳专项评估",
            "icon": "truck",
            "industry": "物流运输",
            "packageIds": ["PKG04"],
            "ruleId": "R01",
            "applicableScope": "物流服务商",
        },
        {
            "id": "S05",
            "name": "产品绿色设计评估",
            "description": "评估产品从设计到回收的全生命周期绿色水平",
            "icon": "leaf",
            "industry": "通用",
            "packageIds": ["PKG06"],
            "ruleId": "R01",
            "applicableScope": "产品线",
        },
    ]
    _save("scenarios", scenarios)

    _save("plans", [])
    _save("records", [])


_seed()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Pages
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/")
def index():
    return render_template("index.html")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API: 评估指标
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/indicators")
def api_indicators_list():
    return jsonify(_load("indicators"))


@app.route("/api/indicators", methods=["POST"])
def api_indicators_create():
    data = request.json
    items = _load("indicators")
    data["id"] = _new_id()
    items.append(data)
    _save("indicators", items)
    return jsonify(data), 201


@app.route("/api/indicators/<iid>", methods=["PUT"])
def api_indicators_update(iid):
    data = request.json
    items = _load("indicators")
    for i, item in enumerate(items):
        if item["id"] == iid:
            data["id"] = iid
            items[i] = data
            _save("indicators", items)
            return jsonify(data)
    return jsonify({"error": "not found"}), 404


@app.route("/api/indicators/<iid>", methods=["DELETE"])
def api_indicators_delete(iid):
    items = _load("indicators")
    items = [x for x in items if x["id"] != iid]
    _save("indicators", items)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API: 指标包
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/packages")
def api_packages_list():
    return jsonify(_load("packages"))


@app.route("/api/packages", methods=["POST"])
def api_packages_create():
    data = request.json
    items = _load("packages")
    data["id"] = _new_id()
    items.append(data)
    _save("packages", items)
    return jsonify(data), 201


@app.route("/api/packages/<pid>", methods=["PUT"])
def api_packages_update(pid):
    data = request.json
    items = _load("packages")
    for i, item in enumerate(items):
        if item["id"] == pid:
            data["id"] = pid
            items[i] = data
            _save("packages", items)
            return jsonify(data)
    return jsonify({"error": "not found"}), 404


@app.route("/api/packages/<pid>", methods=["DELETE"])
def api_packages_delete(pid):
    items = _load("packages")
    items = [x for x in items if x["id"] != pid]
    _save("packages", items)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API: 评估规则
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/rules")
def api_rules_list():
    return jsonify(_load("rules"))


@app.route("/api/rules", methods=["POST"])
def api_rules_create():
    data = request.json
    items = _load("rules")
    data["id"] = _new_id()
    items.append(data)
    _save("rules", items)
    return jsonify(data), 201


@app.route("/api/rules/<rid>", methods=["PUT"])
def api_rules_update(rid):
    data = request.json
    items = _load("rules")
    for i, item in enumerate(items):
        if item["id"] == rid:
            data["id"] = rid
            items[i] = data
            _save("rules", items)
            return jsonify(data)
    return jsonify({"error": "not found"}), 404


@app.route("/api/rules/<rid>", methods=["DELETE"])
def api_rules_delete(rid):
    items = _load("rules")
    items = [x for x in items if x["id"] != rid]
    _save("rules", items)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API: 情景模式
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/scenarios")
def api_scenarios_list():
    return jsonify(_load("scenarios"))


@app.route("/api/scenarios", methods=["POST"])
def api_scenarios_create():
    data = request.json
    items = _load("scenarios")
    data["id"] = _new_id()
    items.append(data)
    _save("scenarios", items)
    return jsonify(data), 201


@app.route("/api/scenarios/<sid>", methods=["PUT"])
def api_scenarios_update(sid):
    data = request.json
    items = _load("scenarios")
    for i, item in enumerate(items):
        if item["id"] == sid:
            data["id"] = sid
            items[i] = data
            _save("scenarios", items)
            return jsonify(data)
    return jsonify({"error": "not found"}), 404


@app.route("/api/scenarios/<sid>", methods=["DELETE"])
def api_scenarios_delete(sid):
    items = _load("scenarios")
    items = [x for x in items if x["id"] != sid]
    _save("scenarios", items)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API: 评估方案 (Plan = 基于情景创建的评估配置)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/plans")
def api_plans_list():
    return jsonify(_load("plans"))


@app.route("/api/plans/<plan_id>")
def api_plans_get(plan_id):
    plans = _load("plans")
    p = _find(plans, plan_id)
    if p:
        return jsonify(p)
    return jsonify({"error": "not found"}), 404


@app.route("/api/plans", methods=["POST"])
def api_plans_create():
    data = request.json
    items = _load("plans")

    scenarios = _load("scenarios")
    scenario = _find(scenarios, data.get("scenarioId", ""))

    packages = _load("packages")
    pkg_map = {p["id"]: p for p in packages}

    indicator_ids = []
    pkg_ids = data.get("packageIds") or (scenario["packageIds"] if scenario else [])
    for pid in pkg_ids:
        pkg = pkg_map.get(pid)
        if pkg:
            indicator_ids.extend(pkg["indicatorIds"])
    indicator_ids = list(dict.fromkeys(indicator_ids))

    rule_id = data.get("ruleId") or (scenario["ruleId"] if scenario else "R01")

    weights = data.get("weights", {})
    if not weights:
        for iid in indicator_ids:
            weights[iid] = 1

    plan = {
        "id": _new_id(),
        "name": data.get("name", ""),
        "scenarioId": data.get("scenarioId", ""),
        "scenarioName": scenario["name"] if scenario else "自定义",
        "targetCompany": data.get("targetCompany", ""),
        "industry": data.get("industry", ""),
        "contact": data.get("contact", ""),
        "description": data.get("description", ""),
        "packageIds": pkg_ids,
        "ruleId": rule_id,
        "indicatorIds": indicator_ids,
        "weights": weights,
        "status": "待评估",
        "createdAt": datetime.now().isoformat(),
    }
    items.append(plan)
    _save("plans", items)
    return jsonify(plan), 201


@app.route("/api/plans/<plan_id>", methods=["PUT"])
def api_plans_update(plan_id):
    data = request.json
    items = _load("plans")
    for i, item in enumerate(items):
        if item["id"] == plan_id:
            data["id"] = plan_id
            items[i] = data
            _save("plans", items)
            return jsonify(data)
    return jsonify({"error": "not found"}), 404


@app.route("/api/plans/<plan_id>", methods=["DELETE"])
def api_plans_delete(plan_id):
    items = _load("plans")
    items = [x for x in items if x["id"] != plan_id]
    _save("plans", items)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API: 评估记录 (Record = 某个方案的一次实际评分)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/records")
def api_records_list():
    return jsonify(_load("records"))


@app.route("/api/records/<rid>")
def api_records_get(rid):
    records = _load("records")
    r = _find(records, rid)
    if r:
        return jsonify(r)
    return jsonify({"error": "not found"}), 404


@app.route("/api/records", methods=["POST"])
def api_records_create():
    data = request.json
    records = _load("records")

    plan_id = data.get("planId", "")
    plans = _load("plans")
    plan = _find(plans, plan_id)

    scores = data.get("scores", {})
    indicators = _load("indicators")
    ind_map = {ind["id"]: ind for ind in indicators}

    rules = _load("rules")
    rule_id = plan["ruleId"] if plan else data.get("ruleId", "R01")
    rule = _find(rules, rule_id) or rules[0]

    weights = (plan or {}).get("weights", {})
    weight_mode = rule.get("weightMode", "equal")

    total_weight = 0
    weighted_sum = 0
    category_scores = {}

    for ind_id, score_val in scores.items():
        if ind_id not in ind_map:
            continue
        w = weights.get(ind_id, 1) if weight_mode == "weighted" else 1
        total_weight += w
        weighted_sum += score_val * w

        cat = ind_map[ind_id]["category"]
        if cat not in category_scores:
            category_scores[cat] = {"sum": 0, "weight": 0, "count": 0}
        category_scores[cat]["sum"] += score_val * w
        category_scores[cat]["weight"] += w
        category_scores[cat]["count"] += 1

    total_score = round(weighted_sum / total_weight, 1) if total_weight else 0

    grade = ""
    grade_color = ""
    for g in rule.get("grades", []):
        if g["min"] <= total_score <= g["max"]:
            grade = g["name"]
            grade_color = g["color"]
            break

    passed = total_score >= rule.get("passScore", 60)

    suggestions = []
    pass_score = rule.get("passScore", 60)
    for cat, cs in category_scores.items():
        cat_avg = cs["sum"] / cs["weight"] if cs["weight"] else 0
        if cat_avg < pass_score:
            suggestions.append({
                "category": cat,
                "score": round(cat_avg, 1),
                "level": "critical",
                "text": f"【{cat}】得分 {cat_avg:.1f}，低于及格线 {pass_score}，建议重点整改。"
            })
        elif cat_avg < pass_score + 15:
            suggestions.append({
                "category": cat,
                "score": round(cat_avg, 1),
                "level": "warning",
                "text": f"【{cat}】得分 {cat_avg:.1f}，有较大提升空间，建议制定改进计划。"
            })

    if not suggestions and passed:
        suggestions.append({
            "category": "总体",
            "score": total_score,
            "level": "success",
            "text": "整体表现良好，建议持续保持并推广最佳实践。"
        })

    cat_detail = {}
    for cat, cs in category_scores.items():
        cat_detail[cat] = {
            "score": round(cs["sum"] / cs["weight"], 1) if cs["weight"] else 0,
            "count": cs["count"],
        }

    record = {
        "id": _new_id(),
        "planId": plan_id,
        "planName": plan["name"] if plan else "",
        "targetCompany": plan["targetCompany"] if plan else data.get("targetCompany", ""),
        "scenarioName": plan["scenarioName"] if plan else "",
        "ruleName": rule["name"],
        "scores": scores,
        "totalScore": total_score,
        "grade": grade,
        "gradeColor": grade_color,
        "passed": passed,
        "suggestions": suggestions,
        "categoryDetail": cat_detail,
        "createdAt": datetime.now().isoformat(),
    }

    records.append(record)
    _save("records", records)

    if plan:
        plan["status"] = "已完成"
        _save("plans", plans)

    return jsonify(record), 201


@app.route("/api/records/<rid>", methods=["DELETE"])
def api_records_delete(rid):
    records = _load("records")
    records = [x for x in records if x["id"] != rid]
    _save("records", records)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API: 统计
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.route("/api/statistics")
def api_statistics():
    records = _load("records")
    indicators = _load("indicators")
    packages = _load("packages")
    scenarios = _load("scenarios")
    plans = _load("plans")

    total_records = len(records)
    avg_score = round(sum(r["totalScore"] for r in records) / total_records, 1) if total_records else 0
    pass_count = sum(1 for r in records if r.get("passed"))
    pass_rate = round(pass_count / total_records * 100) if total_records else 0

    grade_dist = {}
    for r in records:
        g = r.get("grade", "未知")
        grade_dist[g] = grade_dist.get(g, 0) + 1

    return jsonify({
        "totalRecords": total_records,
        "avgScore": avg_score,
        "passRate": pass_rate,
        "gradeDistribution": grade_dist,
        "indicatorCount": len(indicators),
        "packageCount": len(packages),
        "scenarioCount": len(scenarios),
        "planCount": len(plans),
        "pendingPlans": sum(1 for p in plans if p.get("status") == "待评估"),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
