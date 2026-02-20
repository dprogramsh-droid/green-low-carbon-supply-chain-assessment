"""
绿色低碳供应链评估系统 —— 面向链主企业
闭环：供应商管理 → 评估方案 → 指标评分 → 结果反馈 → 供应商评级更新
"""

import json
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

KEYS = ["indicators", "packages", "rules", "scenarios", "suppliers", "plans", "records", "settings"]
FILES = {k: DATA_DIR / f"{k}.json" for k in KEYS}


def _load(key):
    p = FILES[key]
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return [] if key != "settings" else {}


def _save(key, data):
    FILES[key].write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _find(col, item_id):
    for item in col:
        if item["id"] == item_id:
            return item
    return None


def _nid():
    return str(uuid.uuid4())[:8]


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Seed
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def _seed():
    if _load("indicators"):
        return

    indicators = [
        {"id":"I01","category":"绿色采购","name":"绿色原材料采购比例","description":"采购的原材料中符合绿色环保标准的比例","unit":"%","dataType":"quantitative"},
        {"id":"I02","category":"绿色采购","name":"供应商环保资质覆盖率","description":"拥有环保认证(ISO14001等)的供应商占比","unit":"%","dataType":"quantitative"},
        {"id":"I03","category":"绿色采购","name":"本地化采购比例","description":"一定半径范围内本地供应商采购占比","unit":"%","dataType":"quantitative"},
        {"id":"I04","category":"绿色采购","name":"禁限用物质管控达标率","description":"采购物料中禁限用物质检测合格率","unit":"%","dataType":"quantitative"},
        {"id":"I05","category":"绿色生产","name":"清洁能源使用比例","description":"生产过程中使用清洁能源的比例","unit":"%","dataType":"quantitative"},
        {"id":"I06","category":"绿色生产","name":"废弃物回收利用率","description":"生产废弃物被回收利用的比率","unit":"%","dataType":"quantitative"},
        {"id":"I07","category":"绿色生产","name":"节能设备使用率","description":"达到节能标准的生产设备占比","unit":"%","dataType":"quantitative"},
        {"id":"I08","category":"绿色生产","name":"单位产值能耗下降率","description":"年度单位产值能耗较上年的下降比例","unit":"%","dataType":"quantitative"},
        {"id":"I09","category":"绿色生产","name":"污染物排放达标率","description":"各排放口污染物浓度均低于标准限值的比率","unit":"%","dataType":"quantitative"},
        {"id":"I10","category":"绿色物流","name":"绿色运输方式使用率","description":"使用新能源车辆/铁路等低碳运输方式的比例","unit":"%","dataType":"quantitative"},
        {"id":"I11","category":"绿色物流","name":"包装材料可回收比例","description":"物流包装中使用可回收/可降解材料的比例","unit":"%","dataType":"quantitative"},
        {"id":"I12","category":"绿色物流","name":"物流路线优化覆盖率","description":"已实施路线优化调度的物流线路占比","unit":"%","dataType":"quantitative"},
        {"id":"I13","category":"绿色物流","name":"空载率控制水平","description":"物流车辆空载率低于行业标准的达标率","unit":"%","dataType":"quantitative"},
        {"id":"I14","category":"绿色仓储","name":"绿色仓库认证达标率","description":"通过绿色建筑或绿色仓储认证的仓库占比","unit":"%","dataType":"quantitative"},
        {"id":"I15","category":"绿色仓储","name":"仓储能耗达标率","description":"单位仓储面积能耗低于行业标准的仓库占比","unit":"%","dataType":"quantitative"},
        {"id":"I16","category":"绿色仓储","name":"智能仓储覆盖率","description":"使用智能化管理系统的仓库占比","unit":"%","dataType":"quantitative"},
        {"id":"I17","category":"管理体系","name":"环境管理体系认证率","description":"通过ISO14001等环境管理体系认证的业务覆盖率","unit":"%","dataType":"quantitative"},
        {"id":"I18","category":"管理体系","name":"低碳目标设定与追踪","description":"是否设定明确的低碳减排目标并定期追踪","unit":"等级","dataType":"qualitative"},
        {"id":"I19","category":"管理体系","name":"绿色供应链信息披露","description":"定期发布绿色供应链相关信息的规范程度","unit":"等级","dataType":"qualitative"},
        {"id":"I20","category":"管理体系","name":"绿色培训覆盖率","description":"供应链相关人员参与绿色低碳培训的覆盖率","unit":"%","dataType":"quantitative"},
        {"id":"I21","category":"产品绿色设计","name":"产品可回收设计比例","description":"在设计阶段考虑可回收/可拆解的产品比例","unit":"%","dataType":"quantitative"},
        {"id":"I22","category":"产品绿色设计","name":"绿色材料替代率","description":"使用环保替代材料的产品比例","unit":"%","dataType":"quantitative"},
        {"id":"I23","category":"产品绿色设计","name":"产品轻量化达成率","description":"实现轻量化设计目标的产品比例","unit":"%","dataType":"quantitative"},
        {"id":"I24","category":"逆向供应链","name":"产品回收率","description":"售后产品回收再利用的比率","unit":"%","dataType":"quantitative"},
        {"id":"I25","category":"逆向供应链","name":"废旧物资处置合规率","description":"废旧物资处置符合环保法规的比率","unit":"%","dataType":"quantitative"},
        {"id":"I26","category":"供应商协同","name":"供应商绿色绩效考核覆盖率","description":"将绿色指标纳入供应商考核的覆盖率","unit":"%","dataType":"quantitative"},
        {"id":"I27","category":"供应商协同","name":"供应商绿色能力提升计划","description":"为供应商提供绿色能力提升支持的覆盖率","unit":"%","dataType":"quantitative"},
        {"id":"I28","category":"供应商协同","name":"供应商环境违规率","description":"近一年内发生环境违规的供应商占比(越低越好)","unit":"%","dataType":"quantitative"},
    ]
    _save("indicators", indicators)

    packages = [
        {"id":"PKG01","name":"基础合规包","description":"覆盖环保合规底线要求，适用于供应商基本准入","indicatorIds":["I02","I04","I09","I17","I25","I28"],"color":"#16a34a"},
        {"id":"PKG02","name":"绿色采购包","description":"聚焦采购环节的绿色化水平评估","indicatorIds":["I01","I02","I03","I04"],"color":"#0891b2"},
        {"id":"PKG03","name":"绿色生产包","description":"评估生产制造环节的节能减排与清洁生产","indicatorIds":["I05","I06","I07","I08","I09"],"color":"#7c3aed"},
        {"id":"PKG04","name":"绿色物流仓储包","description":"覆盖物流运输与仓储的绿色管理水平","indicatorIds":["I10","I11","I12","I13","I14","I15","I16"],"color":"#c2410c"},
        {"id":"PKG05","name":"管理体系与协同包","description":"评估绿色管理体系与供应商协同能力","indicatorIds":["I17","I18","I19","I20","I26","I27"],"color":"#b91c1c"},
        {"id":"PKG06","name":"产品全生命周期包","description":"聚焦产品设计到回收的全生命周期评估","indicatorIds":["I21","I22","I23","I24","I25"],"color":"#0d9488"},
        {"id":"PKG07","name":"全面评估包","description":"涵盖所有绿色低碳指标，年度综合评估","indicatorIds":[f"I{str(i).zfill(2)}" for i in range(1,29)],"color":"#4338ca"},
    ]
    _save("packages", packages)

    rules = [
        {"id":"R01","name":"标准四级评定","description":"优秀/良好/一般/待改进四个等级","weightMode":"equal",
         "grades":[{"name":"优秀","min":90,"max":100,"color":"#16a34a"},{"name":"良好","min":75,"max":89,"color":"#2563eb"},{"name":"一般","min":60,"max":74,"color":"#d97706"},{"name":"待改进","min":0,"max":59,"color":"#dc2626"}],
         "scoringScale":100,"passScore":60},
        {"id":"R02","name":"严格五级评定","description":"卓越/优秀/良好/合格/不合格五级","weightMode":"weighted",
         "grades":[{"name":"卓越","min":95,"max":100,"color":"#065f46"},{"name":"优秀","min":85,"max":94,"color":"#16a34a"},{"name":"良好","min":70,"max":84,"color":"#2563eb"},{"name":"合格","min":60,"max":69,"color":"#d97706"},{"name":"不合格","min":0,"max":59,"color":"#dc2626"}],
         "scoringScale":100,"passScore":60},
        {"id":"R03","name":"准入通过制","description":"仅判断是否达到准入门槛","weightMode":"equal",
         "grades":[{"name":"通过","min":70,"max":100,"color":"#16a34a"},{"name":"不通过","min":0,"max":69,"color":"#dc2626"}],
         "scoringScale":100,"passScore":70},
    ]
    _save("rules", rules)

    scenarios = [
        {"id":"S01","name":"供应商准入评估","description":"新供应商入围时的绿色低碳基本资质审查","industry":"通用","packageIds":["PKG01"],"ruleId":"R03","applicableScope":"新供应商"},
        {"id":"S02","name":"年度绿色绩效评估","description":"对已合作供应商进行年度绿色低碳绩效综合评估","industry":"通用","packageIds":["PKG02","PKG03","PKG05"],"ruleId":"R01","applicableScope":"现有供应商"},
        {"id":"S03","name":"制造业全链条评估","description":"面向制造业的供应链全环节绿色低碳评估","industry":"制造业","packageIds":["PKG07"],"ruleId":"R02","applicableScope":"全链条"},
        {"id":"S04","name":"物流仓储专项评估","description":"针对物流仓储环节的绿色低碳专项评估","industry":"物流运输","packageIds":["PKG04"],"ruleId":"R01","applicableScope":"物流服务商"},
        {"id":"S05","name":"产品绿色设计评估","description":"评估产品从设计到回收的全生命周期绿色水平","industry":"通用","packageIds":["PKG06"],"ruleId":"R01","applicableScope":"产品线"},
    ]
    _save("scenarios", scenarios)

    suppliers = [
        {"id":"SUP01","code":"SUP-2024-001","name":"华锐精密制造有限公司","industry":"制造业","tier":"一级","contact":"张明","phone":"138-0001-0001","email":"zhang@huarui.com","address":"上海市浦东新区","status":"active","greenRating":"","latestScore":0,"assessCount":0,"createdAt":"2024-06-15T10:00:00"},
        {"id":"SUP02","code":"SUP-2024-002","name":"绿源新材料科技公司","industry":"化工医药","tier":"一级","contact":"李芳","phone":"139-0002-0002","email":"li@lvyuan.com","address":"江苏省苏州市","status":"active","greenRating":"","latestScore":0,"assessCount":0,"createdAt":"2024-07-20T10:00:00"},
        {"id":"SUP03","code":"SUP-2024-003","name":"捷达物流集团","industry":"物流运输","tier":"二级","contact":"王强","phone":"137-0003-0003","email":"wang@jieda.com","address":"广东省深圳市","status":"active","greenRating":"","latestScore":0,"assessCount":0,"createdAt":"2024-08-10T10:00:00"},
        {"id":"SUP04","code":"SUP-2024-004","name":"瑞丰电子科技有限公司","industry":"电子信息","tier":"一级","contact":"刘洋","phone":"136-0004-0004","email":"liu@ruifeng.com","address":"浙江省杭州市","status":"active","greenRating":"","latestScore":0,"assessCount":0,"createdAt":"2024-09-05T10:00:00"},
        {"id":"SUP05","code":"SUP-2024-005","name":"天成包装材料公司","industry":"制造业","tier":"三级","contact":"赵磊","phone":"135-0005-0005","email":"zhao@tiancheng.com","address":"山东省青岛市","status":"active","greenRating":"","latestScore":0,"assessCount":0,"createdAt":"2024-10-12T10:00:00"},
    ]
    _save("suppliers", suppliers)

    _save("plans", [])
    _save("records", [])

    _save("settings", {
        "platformName": "绿色低碳供应链评估系统",
        "companyName": "链主企业集团",
        "adminName": "系统管理员",
        "version": "1.0.0",
    })


_seed()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Page
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/")
def index():
    return render_template("index.html")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Generic CRUD helper
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def _crud_routes(key, url):
    def _list():
        return jsonify(_load(key))

    def _create():
        data = request.json
        items = _load(key)
        data["id"] = _nid()
        items.append(data)
        _save(key, items)
        return jsonify(data), 201

    def _update(item_id):
        data = request.json
        items = _load(key)
        for i, item in enumerate(items):
            if item["id"] == item_id:
                data["id"] = item_id
                items[i] = data
                _save(key, items)
                return jsonify(data)
        return jsonify({"error": "not found"}), 404

    def _delete(item_id):
        items = _load(key)
        items = [x for x in items if x["id"] != item_id]
        _save(key, items)
        return jsonify({"ok": True})

    _list.__name__ = f"{key}_list"
    _create.__name__ = f"{key}_create"
    _update.__name__ = f"{key}_update"
    _delete.__name__ = f"{key}_delete"

    app.route(url)(_list)
    app.route(url, methods=["POST"])(_create)
    app.route(f"{url}/<item_id>", methods=["PUT"])(_update)
    app.route(f"{url}/<item_id>", methods=["DELETE"])(_delete)


_crud_routes("indicators", "/api/indicators")
_crud_routes("packages", "/api/packages")
_crud_routes("rules", "/api/rules")
_crud_routes("scenarios", "/api/scenarios")
_crud_routes("suppliers", "/api/suppliers")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Supplier: single get
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/suppliers/<sid>/detail")
def supplier_detail(sid):
    suppliers = _load("suppliers")
    s = _find(suppliers, sid)
    if not s:
        return jsonify({"error": "not found"}), 404
    records = [r for r in _load("records") if r.get("supplierId") == sid]
    return jsonify({"supplier": s, "records": records})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Plans
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/plans")
def plans_list():
    return jsonify(_load("plans"))


@app.route("/api/plans/<pid>")
def plans_get(pid):
    p = _find(_load("plans"), pid)
    return jsonify(p) if p else (jsonify({"error": "not found"}), 404)


@app.route("/api/plans", methods=["POST"])
def plans_create():
    data = request.json
    items = _load("plans")

    scenario = _find(_load("scenarios"), data.get("scenarioId", ""))
    pkg_map = {p["id"]: p for p in _load("packages")}

    pkg_ids = data.get("packageIds") or (scenario["packageIds"] if scenario else [])
    indicator_ids = list(dict.fromkeys(
        iid for pid in pkg_ids for iid in pkg_map.get(pid, {}).get("indicatorIds", [])
    ))
    rule_id = data.get("ruleId") or (scenario["ruleId"] if scenario else "R01")

    weights = data.get("weights", {})
    if not weights:
        weights = {iid: 1 for iid in indicator_ids}

    supplier = _find(_load("suppliers"), data.get("supplierId", ""))

    plan = {
        "id": _nid(),
        "name": data.get("name", ""),
        "scenarioId": data.get("scenarioId", ""),
        "scenarioName": scenario["name"] if scenario else "自定义",
        "supplierId": data.get("supplierId", ""),
        "supplierName": supplier["name"] if supplier else data.get("supplierName", ""),
        "industry": data.get("industry", supplier["industry"] if supplier else ""),
        "contact": data.get("contact", ""),
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


@app.route("/api/plans/<pid>", methods=["DELETE"])
def plans_delete(pid):
    items = [x for x in _load("plans") if x["id"] != pid]
    _save("plans", items)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Records (scoring + auto-update supplier)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/records")
def records_list():
    return jsonify(_load("records"))


@app.route("/api/records/<rid>")
def records_get(rid):
    r = _find(_load("records"), rid)
    return jsonify(r) if r else (jsonify({"error": "not found"}), 404)


@app.route("/api/records", methods=["POST"])
def records_create():
    data = request.json
    records = _load("records")
    plans = _load("plans")
    plan = _find(plans, data.get("planId", ""))
    scores = data.get("scores", {})

    ind_map = {i["id"]: i for i in _load("indicators")}
    rules = _load("rules")
    rule_id = plan["ruleId"] if plan else data.get("ruleId", "R01")
    rule = _find(rules, rule_id) or rules[0]
    weights = (plan or {}).get("weights", {})
    wm = rule.get("weightMode", "equal")

    tw = ws = 0
    cat_scores = {}
    for iid, sv in scores.items():
        if iid not in ind_map:
            continue
        w = weights.get(iid, 1) if wm == "weighted" else 1
        tw += w
        ws += sv * w
        cat = ind_map[iid]["category"]
        cat_scores.setdefault(cat, {"sum": 0, "weight": 0, "count": 0})
        cat_scores[cat]["sum"] += sv * w
        cat_scores[cat]["weight"] += w
        cat_scores[cat]["count"] += 1

    total_score = round(ws / tw, 1) if tw else 0
    grade = grade_color = ""
    for g in rule.get("grades", []):
        if g["min"] <= total_score <= g["max"]:
            grade, grade_color = g["name"], g["color"]
            break
    passed = total_score >= rule.get("passScore", 60)

    suggestions = []
    ps = rule.get("passScore", 60)
    for cat, cs in cat_scores.items():
        avg = cs["sum"] / cs["weight"] if cs["weight"] else 0
        if avg < ps:
            suggestions.append({"category": cat, "score": round(avg, 1), "level": "critical",
                                "text": f"【{cat}】得分 {avg:.1f}，低于及格线 {ps}，建议重点整改。"})
        elif avg < ps + 15:
            suggestions.append({"category": cat, "score": round(avg, 1), "level": "warning",
                                "text": f"【{cat}】得分 {avg:.1f}，有提升空间，建议制定改进计划。"})
    if not suggestions and passed:
        suggestions.append({"category": "总体", "score": total_score, "level": "success",
                            "text": "整体表现良好，建议持续保持并推广最佳实践。"})

    cat_detail = {cat: {"score": round(cs["sum"] / cs["weight"], 1) if cs["weight"] else 0, "count": cs["count"]}
                  for cat, cs in cat_scores.items()}

    supplier_id = plan["supplierId"] if plan else data.get("supplierId", "")

    record = {
        "id": _nid(),
        "planId": data.get("planId", ""),
        "planName": plan["name"] if plan else "",
        "supplierId": supplier_id,
        "supplierName": plan["supplierName"] if plan else "",
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

    if supplier_id:
        suppliers = _load("suppliers")
        sup = _find(suppliers, supplier_id)
        if sup:
            sup["latestScore"] = total_score
            sup["greenRating"] = grade
            sup["assessCount"] = sup.get("assessCount", 0) + 1
            _save("suppliers", suppliers)

    return jsonify(record), 201


@app.route("/api/records/<rid>", methods=["DELETE"])
def records_delete(rid):
    records = [x for x in _load("records") if x["id"] != rid]
    _save("records", records)
    return jsonify({"ok": True})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Settings
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/settings")
def settings_get():
    return jsonify(_load("settings"))


@app.route("/api/settings", methods=["PUT"])
def settings_update():
    _save("settings", request.json)
    return jsonify(request.json)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Statistics
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@app.route("/api/statistics")
def api_statistics():
    records = _load("records")
    suppliers = _load("suppliers")
    plans = _load("plans")

    tr = len(records)
    avg = round(sum(r["totalScore"] for r in records) / tr, 1) if tr else 0
    pc = sum(1 for r in records if r.get("passed"))
    pr = round(pc / tr * 100) if tr else 0
    gd = {}
    for r in records:
        g = r.get("grade", "未知")
        gd[g] = gd.get(g, 0) + 1

    active_sup = sum(1 for s in suppliers if s.get("status") == "active")
    rated_sup = sum(1 for s in suppliers if s.get("greenRating"))
    tier_dist = {}
    for s in suppliers:
        t = s.get("tier", "未知")
        tier_dist[t] = tier_dist.get(t, 0) + 1

    return jsonify({
        "totalRecords": tr, "avgScore": avg, "passRate": pr, "gradeDistribution": gd,
        "indicatorCount": len(_load("indicators")), "packageCount": len(_load("packages")),
        "scenarioCount": len(_load("scenarios")), "ruleCount": len(_load("rules")),
        "supplierCount": len(suppliers), "activeSuppliers": active_sup, "ratedSuppliers": rated_sup,
        "tierDistribution": tier_dist,
        "planCount": len(plans), "pendingPlans": sum(1 for p in plans if p.get("status") == "待评估"),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
