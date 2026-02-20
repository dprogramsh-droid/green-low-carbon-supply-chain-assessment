import json
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

ASSESSMENTS_FILE = DATA_DIR / "assessments.json"
INDICATORS_FILE = DATA_DIR / "indicators.json"


def _load_json(path: Path) -> list:
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    return []


def _save_json(path: Path, data: list):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _seed_indicators():
    """Seed default green low-carbon indicator templates if none exist."""
    if _load_json(INDICATORS_FILE):
        return

    indicators = [
        {
            "id": str(uuid.uuid4()),
            "category": "绿色采购",
            "name": "绿色原材料采购比例",
            "description": "采购的原材料中符合绿色环保标准的比例",
            "unit": "%",
            "weight": 10,
            "scoring": {"excellent": "≥90%", "good": "70%-89%", "average": "50%-69%", "poor": "<50%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色采购",
            "name": "供应商环保资质覆盖率",
            "description": "拥有环保认证(ISO14001等)的供应商占比",
            "unit": "%",
            "weight": 8,
            "scoring": {"excellent": "≥95%", "good": "80%-94%", "average": "60%-79%", "poor": "<60%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色采购",
            "name": "本地化采购比例",
            "description": "在一定半径范围内的本地供应商采购占比，减少运输排放",
            "unit": "%",
            "weight": 6,
            "scoring": {"excellent": "≥60%", "good": "40%-59%", "average": "20%-39%", "poor": "<20%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色生产",
            "name": "清洁能源使用比例",
            "description": "生产过程中使用清洁能源(太阳能、风能等)的比例",
            "unit": "%",
            "weight": 10,
            "scoring": {"excellent": "≥80%", "good": "50%-79%", "average": "30%-49%", "poor": "<30%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色生产",
            "name": "废弃物回收利用率",
            "description": "生产过程中废弃物被回收利用的比率",
            "unit": "%",
            "weight": 8,
            "scoring": {"excellent": "≥90%", "good": "70%-89%", "average": "50%-69%", "poor": "<50%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色生产",
            "name": "节能设备使用率",
            "description": "生产设备中达到节能标准的设备占比",
            "unit": "%",
            "weight": 7,
            "scoring": {"excellent": "≥85%", "good": "65%-84%", "average": "45%-64%", "poor": "<45%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色物流",
            "name": "绿色运输方式使用比例",
            "description": "使用新能源车辆、铁路等低碳运输方式的比例",
            "unit": "%",
            "weight": 8,
            "scoring": {"excellent": "≥70%", "good": "50%-69%", "average": "30%-49%", "poor": "<30%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色物流",
            "name": "包装材料可回收比例",
            "description": "物流包装中使用可回收/可降解材料的比例",
            "unit": "%",
            "weight": 7,
            "scoring": {"excellent": "≥90%", "good": "70%-89%", "average": "50%-69%", "poor": "<50%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色物流",
            "name": "物流路线优化覆盖率",
            "description": "已实施路线优化调度的物流线路占总线路比例",
            "unit": "%",
            "weight": 5,
            "scoring": {"excellent": "≥80%", "good": "60%-79%", "average": "40%-59%", "poor": "<40%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色仓储",
            "name": "绿色仓库认证达标率",
            "description": "通过绿色建筑或绿色仓储认证的仓库比例",
            "unit": "%",
            "weight": 6,
            "scoring": {"excellent": "≥80%", "good": "60%-79%", "average": "40%-59%", "poor": "<40%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "绿色仓储",
            "name": "仓储能耗达标率",
            "description": "单位仓储面积能耗低于行业标准的仓库比例",
            "unit": "%",
            "weight": 6,
            "scoring": {"excellent": "≥85%", "good": "65%-84%", "average": "45%-64%", "poor": "<45%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "管理体系",
            "name": "环境管理体系覆盖率",
            "description": "供应链各环节通过ISO14001等环境管理体系认证的覆盖率",
            "unit": "%",
            "weight": 7,
            "scoring": {"excellent": "≥90%", "good": "70%-89%", "average": "50%-69%", "poor": "<50%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "管理体系",
            "name": "低碳目标设定与追踪",
            "description": "是否设定了明确的低碳减排目标并定期追踪",
            "unit": "定性",
            "weight": 6,
            "scoring": {
                "excellent": "目标明确且按期达成",
                "good": "目标明确，部分达成",
                "average": "有目标但缺少追踪",
                "poor": "无明确目标",
            },
        },
        {
            "id": str(uuid.uuid4()),
            "category": "管理体系",
            "name": "绿色培训与意识建设",
            "description": "供应链相关人员参与绿色低碳培训的覆盖率",
            "unit": "%",
            "weight": 4,
            "scoring": {"excellent": "≥90%", "good": "70%-89%", "average": "50%-69%", "poor": "<50%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "产品生命周期",
            "name": "产品可回收设计比例",
            "description": "产品在设计阶段考虑可回收/可拆解的比例",
            "unit": "%",
            "weight": 6,
            "scoring": {"excellent": "≥80%", "good": "60%-79%", "average": "40%-59%", "poor": "<40%"},
        },
        {
            "id": str(uuid.uuid4()),
            "category": "产品生命周期",
            "name": "逆向物流回收率",
            "description": "产品售后回收再利用的比率",
            "unit": "%",
            "weight": 6,
            "scoring": {"excellent": "≥70%", "good": "50%-69%", "average": "30%-49%", "poor": "<30%"},
        },
    ]

    _save_json(INDICATORS_FILE, indicators)


_seed_indicators()

WORKFLOW_STEPS = [
    {"step": 1, "name": "基本信息", "description": "填写被评估供应链/供应商的基本信息"},
    {"step": 2, "name": "指标选择", "description": "选择本次评估适用的绿色低碳指标"},
    {"step": 3, "name": "指标评分", "description": "根据实际情况对各指标进行评分"},
    {"step": 4, "name": "评估总结", "description": "查看评估结果与改进建议"},
]


# ── Pages ──────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


# ── API: Indicators ────────────────────────────────────────────────────

@app.route("/api/indicators")
def api_get_indicators():
    return jsonify(_load_json(INDICATORS_FILE))


@app.route("/api/indicators", methods=["POST"])
def api_add_indicator():
    data = request.json
    indicators = _load_json(INDICATORS_FILE)
    data["id"] = str(uuid.uuid4())
    indicators.append(data)
    _save_json(INDICATORS_FILE, indicators)
    return jsonify(data), 201


@app.route("/api/indicators/<indicator_id>", methods=["PUT"])
def api_update_indicator(indicator_id):
    data = request.json
    indicators = _load_json(INDICATORS_FILE)
    for i, ind in enumerate(indicators):
        if ind["id"] == indicator_id:
            data["id"] = indicator_id
            indicators[i] = data
            _save_json(INDICATORS_FILE, indicators)
            return jsonify(data)
    return jsonify({"error": "not found"}), 404


@app.route("/api/indicators/<indicator_id>", methods=["DELETE"])
def api_delete_indicator(indicator_id):
    indicators = _load_json(INDICATORS_FILE)
    indicators = [ind for ind in indicators if ind["id"] != indicator_id]
    _save_json(INDICATORS_FILE, indicators)
    return jsonify({"ok": True})


# ── API: Workflow ──────────────────────────────────────────────────────

@app.route("/api/workflow")
def api_workflow():
    return jsonify(WORKFLOW_STEPS)


# ── API: Assessments ──────────────────────────────────────────────────

@app.route("/api/assessments")
def api_get_assessments():
    return jsonify(_load_json(ASSESSMENTS_FILE))


@app.route("/api/assessments", methods=["POST"])
def api_create_assessment():
    data = request.json
    assessments = _load_json(ASSESSMENTS_FILE)
    assessment = {
        "id": str(uuid.uuid4()),
        "companyName": data.get("companyName", ""),
        "industry": data.get("industry", ""),
        "contact": data.get("contact", ""),
        "description": data.get("description", ""),
        "scores": data.get("scores", {}),
        "selectedIndicators": data.get("selectedIndicators", []),
        "totalScore": 0,
        "grade": "",
        "suggestions": [],
        "status": "已完成",
        "createdAt": datetime.now().isoformat(),
    }

    scores = assessment["scores"]
    indicators = _load_json(INDICATORS_FILE)
    ind_map = {ind["id"]: ind for ind in indicators}

    total_weight = 0
    weighted_sum = 0
    category_scores = {}

    for ind_id, score_val in scores.items():
        if ind_id not in ind_map:
            continue
        ind = ind_map[ind_id]
        w = ind.get("weight", 1)
        total_weight += w
        weighted_sum += score_val * w

        cat = ind["category"]
        if cat not in category_scores:
            category_scores[cat] = {"sum": 0, "weight": 0}
        category_scores[cat]["sum"] += score_val * w
        category_scores[cat]["weight"] += w

    if total_weight > 0:
        assessment["totalScore"] = round(weighted_sum / total_weight, 1)

    ts = assessment["totalScore"]
    if ts >= 90:
        assessment["grade"] = "优秀"
    elif ts >= 75:
        assessment["grade"] = "良好"
    elif ts >= 60:
        assessment["grade"] = "一般"
    else:
        assessment["grade"] = "待改进"

    suggestions = []
    for cat, cs in category_scores.items():
        cat_avg = cs["sum"] / cs["weight"] if cs["weight"] else 0
        if cat_avg < 60:
            suggestions.append(f"【{cat}】类指标得分偏低（{cat_avg:.1f}分），建议重点关注该环节的绿色低碳改善措施。")
        elif cat_avg < 75:
            suggestions.append(f"【{cat}】类指标得分一般（{cat_avg:.1f}分），仍有提升空间，建议制定改进计划。")

    if not suggestions and ts >= 90:
        suggestions.append("整体表现优秀，建议持续保持并分享最佳实践。")
    elif not suggestions:
        suggestions.append("整体表现良好，建议持续优化各环节的绿色低碳管理。")

    assessment["suggestions"] = suggestions

    assessments.append(assessment)
    _save_json(ASSESSMENTS_FILE, assessments)
    return jsonify(assessment), 201


@app.route("/api/assessments/<assessment_id>", methods=["DELETE"])
def api_delete_assessment(assessment_id):
    assessments = _load_json(ASSESSMENTS_FILE)
    assessments = [a for a in assessments if a["id"] != assessment_id]
    _save_json(ASSESSMENTS_FILE, assessments)
    return jsonify({"ok": True})


@app.route("/api/assessments/<assessment_id>")
def api_get_assessment(assessment_id):
    assessments = _load_json(ASSESSMENTS_FILE)
    for a in assessments:
        if a["id"] == assessment_id:
            return jsonify(a)
    return jsonify({"error": "not found"}), 404


# ── API: Statistics ───────────────────────────────────────────────────

@app.route("/api/statistics")
def api_statistics():
    assessments = _load_json(ASSESSMENTS_FILE)
    indicators = _load_json(INDICATORS_FILE)

    total = len(assessments)
    if total == 0:
        return jsonify({
            "total": 0,
            "avgScore": 0,
            "gradeDistribution": {},
            "categoryCount": len({ind["category"] for ind in indicators}),
            "indicatorCount": len(indicators),
        })

    avg = round(sum(a["totalScore"] for a in assessments) / total, 1)
    grades = {}
    for a in assessments:
        g = a.get("grade", "未知")
        grades[g] = grades.get(g, 0) + 1

    return jsonify({
        "total": total,
        "avgScore": avg,
        "gradeDistribution": grades,
        "categoryCount": len({ind["category"] for ind in indicators}),
        "indicatorCount": len(indicators),
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
