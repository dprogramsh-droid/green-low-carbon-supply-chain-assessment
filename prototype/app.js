(function () {
    'use strict';

    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const pageContent = document.getElementById('pageContent');
    const breadcrumbTitle = document.getElementById('currentPageTitle');
    const modalOverlay = document.getElementById('modalOverlay');

    const PAGE_TITLES = {
        dashboard: '数据看板',
        'indicator-types': '指标类型总览',
        'indicator-tree': '三级指标体系',
        scenarios: '评估场景',
        plans: '评估方案',
        scoring: '评估打分',
        suppliers: '供应商列表',
        'supplier-detail': 'S001 评估详情',
    };

    function init() {
        bindNav();
        bindModal();
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
        renderPage('dashboard');
    }

    function bindNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                const page = item.dataset.page;
                breadcrumbTitle.textContent = PAGE_TITLES[page] || page;
                renderPage(page);
                sidebar.classList.remove('open');
            });
        });
    }

    function bindModal() {
        document.getElementById('modalClose').addEventListener('click', closeModal);
        document.getElementById('modalCancel').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    }

    function openModal(title, bodyHTML) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHTML;
        modalOverlay.classList.add('active');
    }

    function closeModal() { modalOverlay.classList.remove('active'); }

    function renderPage(page) {
        const r = { dashboard: renderDashboard, 'indicator-types': renderIndicatorTypes, 'indicator-tree': renderIndicatorTree, scenarios: renderScenarios, plans: renderPlans, scoring: renderScoring, suppliers: renderSuppliers, 'supplier-detail': renderSupplierDetail };
        if (r[page]) r[page]();
    }

    // ===== Helpers =====
    function getTypeColor(code) {
        const t = INDICATOR_TYPES.find(x => x.code === code);
        return t ? t.color : '#94A3B8';
    }

    function gradeTag(grade) {
        const m = { A: 'tag-green', B: 'tag-blue', C: 'tag-yellow', D: 'tag-red' };
        const labels = { A: '优秀', B: '良好', C: '一般', D: '需改进' };
        return `<span class="tag ${m[grade] || 'tag-gray'}">${grade} · ${labels[grade] || grade}</span>`;
    }

    function priorityTag(p) {
        return p === '高' ? '<span class="tag tag-red">高</span>' : '<span class="tag tag-yellow">中</span>';
    }

    function statusTag(s) {
        const m = { '合作中': 'tag-green', '暂停合作': 'tag-yellow', '终止合作': 'tag-red', '进行中': 'tag-blue', '已完成': 'tag-green', '计划中': 'tag-gray' };
        return `<span class="tag ${m[s] || 'tag-gray'}">${s}</span>`;
    }

    function scoreColor(score) {
        if (score >= 9) return 'var(--primary)';
        if (score >= 7) return 'var(--secondary)';
        if (score >= 5) return '#F59E0B';
        return '#EF4444';
    }

    function progressBar(pct) {
        let c = 'green';
        if (pct < 30) c = 'red'; else if (pct < 60) c = 'yellow'; else if (pct < 85) c = 'blue';
        return `<div class="progress-bar"><div class="progress-fill ${c}" style="width:${Math.min(pct, 100)}%"></div></div><div class="progress-text">${pct}%</div>`;
    }

    function svgRadar(values, labels, w, h, color) {
        const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 30;
        const n = values.length;
        const step = (Math.PI * 2) / n;
        const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

        let svg = `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:100%">`;
        gridLevels.forEach(lv => {
            const pts = [];
            for (let i = 0; i < n; i++) {
                const angle = step * i - Math.PI / 2;
                pts.push(`${cx + r * lv * Math.cos(angle)},${cy + r * lv * Math.sin(angle)}`);
            }
            svg += `<polygon points="${pts.join(' ')}" fill="none" stroke="#E2E8F0" stroke-width="0.5"/>`;
        });

        for (let i = 0; i < n; i++) {
            const angle = step * i - Math.PI / 2;
            const ex = cx + r * Math.cos(angle), ey = cy + r * Math.sin(angle);
            svg += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#E2E8F0" stroke-width="0.5"/>`;
            const lx = cx + (r + 18) * Math.cos(angle), ly = cy + (r + 18) * Math.sin(angle);
            svg += `<text x="${lx}" y="${ly}" font-size="7" fill="#64748B" text-anchor="middle" dominant-baseline="middle">${labels[i]}</text>`;
        }

        const dataPts = values.map((v, i) => {
            const angle = step * i - Math.PI / 2;
            const ratio = v / 10;
            return `${cx + r * ratio * Math.cos(angle)},${cy + r * ratio * Math.sin(angle)}`;
        });
        svg += `<polygon points="${dataPts.join(' ')}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="1.5"/>`;
        dataPts.forEach(p => {
            const [px, py] = p.split(',');
            svg += `<circle cx="${px}" cy="${py}" r="2.5" fill="white" stroke="${color}" stroke-width="1.5"/>`;
        });

        svg += '</svg>';
        return svg;
    }

    // ===== Dashboard =====
    function renderDashboard() {
        const summary = computeS001Summary();
        const typeScores = INDICATOR_TYPES.filter(t => summary.byType[t.code]).map(t => ({
            code: t.code, name: t.name, color: t.color, score: summary.byType[t.code]
        }));

        const highScores = S001_SCORES.filter(s => s.score >= 9.5).slice(0, 5);
        const lowScores = [...S001_SCORES].sort((a, b) => a.score - b.score).slice(0, 5);

        pageContent.innerHTML = `
            <div class="page-header">
                <div><h1>数据看板</h1><p>汽车零部件行业低碳供应链评估系统 · 8大维度 · 35项一级指标 · 160+二级指标</p></div>
                <div class="btn-group"><button class="btn btn-secondary btn-sm">导出报告</button><button class="btn btn-primary btn-sm">+ 发起评估</button></div>
            </div>

            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg></div>
                    <div class="stat-info"><h4>供应商总数</h4><div class="stat-value">${SUPPLIERS.length}</div><div class="stat-change up">覆盖5大区域</div></div></div>
                <div class="stat-card"><div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>指标体系</h4><div class="stat-value">${LEVEL2_INDICATORS.length}</div><div class="stat-change up">8 类 · 35 项一级 · ${LEVEL2_INDICATORS.length} 项二级</div></div></div>
                <div class="stat-card"><div class="stat-icon purple"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>评估场景</h4><div class="stat-value">${ASSESSMENT_SCENARIOS.length}</div><div class="stat-change up">${ASSESSMENT_SCENARIOS.filter(s => s.priority === '高').length} 个高优先级</div></div></div>
                <div class="stat-card"><div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>评估方案</h4><div class="stat-value">${ASSESSMENT_PLANS.length}</div><div class="stat-change up">${ASSESSMENT_PLANS.filter(p => p.status === '进行中').length} 个进行中</div></div></div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3>S001 各维度评分概览</h3></div>
                    <div style="height:280px">${svgRadar(
                        typeScores.map(t => t.score),
                        typeScores.map(t => t.code + ' ' + t.name.substring(0, 4)),
                        320, 280, '#10B981'
                    )}</div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>各维度得分详情</h3></div>
                    <div style="display:flex;flex-direction:column;gap:10px">
                        ${typeScores.map(t => `
                            <div>
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                                    <span style="font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px">
                                        <span style="width:10px;height:10px;border-radius:50%;background:${t.color};display:inline-block"></span>
                                        ${t.code}. ${t.name}
                                    </span>
                                    <span style="font-size:14px;font-weight:700;color:${scoreColor(t.score)}">${t.score}</span>
                                </div>
                                <div class="progress-bar"><div class="progress-fill" style="width:${t.score * 10}%;background:${t.color}"></div></div>
                            </div>
                        `).join('')}
                        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                            <span style="font-size:13px;font-weight:700">综合得分</span>
                            <span style="font-size:22px;font-weight:700;color:var(--primary)">${summary.overall}</span>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>优秀指标 (≥9.5分)</h3></div>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        ${highScores.map(s => `
                            <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--primary-light);border-radius:var(--radius-sm)">
                                <span style="font-size:11px;font-weight:600;color:var(--primary);min-width:50px">${s.l3code}</span>
                                <span style="flex:1;font-size:12px">${s.name}</span>
                                <span style="font-weight:700;color:var(--primary)">${s.score}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3>短板指标 (最低5项)</h3></div>
                    <div style="display:flex;flex-direction:column;gap:8px">
                        ${lowScores.map(s => `
                            <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${s.score < 5 ? 'var(--danger-light)' : 'var(--warning-light)'};border-radius:var(--radius-sm)">
                                <span style="font-size:11px;font-weight:600;color:${s.score < 5 ? 'var(--danger)' : '#92400E'};min-width:50px">${s.l3code}</span>
                                <span style="flex:1;font-size:12px">${s.name}</span>
                                <span style="font-weight:700;color:${s.score < 5 ? 'var(--danger)' : '#92400E'}">${s.score}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card full-width">
                    <div class="card-header"><h3>评估方案进度</h3></div>
                    <div class="table-wrapper"><table class="data-table">
                        <thead><tr><th>方案编号</th><th>方案名称</th><th>关联场景</th><th>状态</th><th>负责人</th><th>完成进度</th><th>截止日期</th></tr></thead>
                        <tbody>${ASSESSMENT_PLANS.map(p => `<tr>
                            <td style="font-family:monospace;font-size:12px">${p.id}</td>
                            <td style="font-weight:500">${p.name}</td>
                            <td><span class="tag tag-purple">${p.scenario}</span></td>
                            <td>${statusTag(p.status)}</td>
                            <td>${p.responsible}</td>
                            <td style="min-width:100px">${progressBar(Math.round(p.completedCount / p.targetCount * 100))}</td>
                            <td style="font-size:12px">${p.endDate}</td>
                        </tr>`).join('')}</tbody>
                    </table></div>
                </div>
            </div>
        `;
    }

    // ===== Indicator Types =====
    function renderIndicatorTypes() {
        pageContent.innerHTML = `
            <div class="page-header"><div><h1>指标类型总览</h1><p>低碳供应链评估体系包含 8 大维度，涵盖企业碳管理、产品低碳、供应链管理等全方位评估</p></div></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">
                ${INDICATOR_TYPES.map(t => {
                    const l1s = LEVEL1_INDICATORS.filter(i => i.type === t.code);
                    const l2count = LEVEL2_INDICATORS.filter(i => i.code.startsWith(t.code)).length;
                    const summary = computeS001Summary();
                    const typeScore = summary.byType[t.code];
                    return `
                    <div class="card" style="border-left:4px solid ${t.color}">
                        <div class="card-header">
                            <div>
                                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                                    <span style="width:28px;height:28px;border-radius:6px;background:${t.color}20;color:${t.color};font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center">${t.code}</span>
                                    <h3 style="font-size:15px">${t.name}</h3>
                                </div>
                                <p style="font-size:12px;color:var(--text-secondary)">${t.desc}</p>
                            </div>
                            ${typeScore ? `<span style="font-size:22px;font-weight:700;color:${scoreColor(typeScore)}">${typeScore}</span>` : ''}
                        </div>
                        <div style="display:flex;gap:12px;margin-bottom:12px">
                            <div style="font-size:12px;color:var(--text-muted)">一级指标 <strong style="color:var(--text-primary)">${l1s.length}</strong></div>
                            <div style="font-size:12px;color:var(--text-muted)">二级指标 <strong style="color:var(--text-primary)">${l2count}</strong></div>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:4px">
                            ${l1s.map(l => {
                                const score = summary.byL1[l.code];
                                return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
                                    <span style="font-size:11px;font-weight:600;color:${t.color};min-width:28px">${l.code}</span>
                                    <span style="flex:1;font-size:12px">${l.name}</span>
                                    ${score ? `<span style="font-size:12px;font-weight:600;color:${scoreColor(score)}">${score}</span>` : '<span style="font-size:11px;color:var(--text-muted)">-</span>'}
                                </div>`;
                            }).join('')}
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
    }

    // ===== Indicator Tree =====
    function renderIndicatorTree() {
        let activeType = 'A';

        function render() {
            const l1s = LEVEL1_INDICATORS.filter(i => i.type === activeType);
            const color = getTypeColor(activeType);
            const typeName = INDICATOR_TYPES.find(t => t.code === activeType)?.name || '';

            pageContent.innerHTML = `
                <div class="page-header"><div><h1>三级指标体系</h1><p>完整的评估指标层级结构：指标类型 → 一级指标 → 二级指标</p></div></div>
                <div class="tabs" id="typeTabs">
                    ${INDICATOR_TYPES.map(t => `<button class="tab ${t.code === activeType ? 'active' : ''}" data-type="${t.code}" style="${t.code === activeType ? `border-color:${t.color};color:${t.color}` : ''}">${t.code}. ${t.name.substring(0, 6)}</button>`).join('')}
                </div>
                <div class="card">
                    <div class="card-header"><h3 style="color:${color}">${activeType}. ${typeName}</h3><span style="font-size:12px;color:var(--text-muted)">${l1s.length} 个一级指标</span></div>
                    ${l1s.map(l1 => {
                        const l2s = LEVEL2_INDICATORS.filter(i => i.l1 === l1.code);
                        return `
                        <div style="margin-bottom:20px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
                            <div style="padding:12px 16px;background:${color}08;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px">
                                <span style="font-weight:700;color:${color};font-size:13px">${l1.code}</span>
                                <span style="font-weight:600;font-size:14px">${l1.name}</span>
                                <span style="margin-left:auto;font-size:11px;color:var(--text-muted)">${l2s.length} 个二级指标</span>
                            </div>
                            <table class="data-table" style="margin:0">
                                <thead><tr><th style="width:80px">编码</th><th>二级指标名称</th><th>指标说明</th></tr></thead>
                                <tbody>${l2s.map(l2 => `<tr>
                                    <td style="font-family:monospace;font-size:12px;font-weight:600;color:${color}">${l2.code}</td>
                                    <td style="font-weight:500">${l2.name}</td>
                                    <td style="font-size:12px;color:var(--text-secondary)">${l2.desc}</td>
                                </tr>`).join('')}</tbody>
                            </table>
                        </div>`;
                    }).join('')}
                </div>
            `;

            document.querySelectorAll('#typeTabs .tab').forEach(tab => {
                tab.addEventListener('click', () => { activeType = tab.dataset.type; render(); });
            });
        }

        render();
    }

    // ===== Scenarios =====
    function renderScenarios() {
        pageContent.innerHTML = `
            <div class="page-header"><div><h1>评估场景</h1><p>15 个标准化评估场景，覆盖供应商准入、绩效考核、CBAM 合规、协同减排等核心场景</p></div></div>
            <div class="filter-bar">
                <select id="priorityFilter"><option value="">全部优先级</option><option>高</option><option>中</option></select>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px" id="scenarioList">
                ${renderScenarioCards(ASSESSMENT_SCENARIOS)}
            </div>
        `;
        document.getElementById('priorityFilter').addEventListener('change', e => {
            const v = e.target.value;
            const filtered = v ? ASSESSMENT_SCENARIOS.filter(s => s.priority === v) : ASSESSMENT_SCENARIOS;
            document.getElementById('scenarioList').innerHTML = renderScenarioCards(filtered);
        });
    }

    function renderScenarioCards(list) {
        return list.map(s => `
            <div class="card" style="border-left:4px solid ${s.priority === '高' ? 'var(--danger)' : 'var(--warning)'}">
                <div class="card-header">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span style="font-family:monospace;font-size:12px;font-weight:700;color:var(--text-muted)">${s.id}</span>
                        <h3 style="font-size:15px">${s.name}</h3>
                    </div>
                    ${priorityTag(s.priority)}
                </div>
                <div class="detail-grid" style="margin-top:8px">
                    <div class="detail-item"><label>评估对象类别</label><span>${s.target}</span></div>
                    <div class="detail-item"><label>适用对象</label><span>${s.applicable}</span></div>
                </div>
                <div style="margin-top:12px;padding:10px 14px;background:var(--bg);border-radius:var(--radius)">
                    <label style="font-size:11px;font-weight:600;color:var(--text-muted)">应用价值</label>
                    <p style="font-size:13px;margin-top:4px;color:var(--text-secondary)">${s.value}</p>
                </div>
            </div>
        `).join('');
    }

    // ===== Plans =====
    function renderPlans() {
        pageContent.innerHTML = `
            <div class="page-header"><div><h1>评估方案</h1><p>创建与管理评估方案，配置评估指标、评分规则、评估对象与评估目的</p></div>
                <button class="btn btn-primary" id="btnCreatePlan">+ 创建评估方案</button></div>
            <div class="filter-bar">
                <select id="planStatusFilter"><option value="">全部状态</option><option>进行中</option><option>已完成</option><option>计划中</option></select>
            </div>
            <div style="display:flex;flex-direction:column;gap:16px" id="planList">
                ${renderPlanCards(ASSESSMENT_PLANS)}
            </div>
        `;
        document.getElementById('planStatusFilter').addEventListener('change', e => {
            const v = e.target.value;
            const filtered = v ? ASSESSMENT_PLANS.filter(p => p.status === v) : ASSESSMENT_PLANS;
            document.getElementById('planList').innerHTML = renderPlanCards(filtered);
            bindPlanDetailBtns();
        });
        document.getElementById('btnCreatePlan').addEventListener('click', openCreatePlanWizard);
        bindPlanDetailBtns();
    }

    function bindPlanDetailBtns() {
        document.querySelectorAll('.plan-detail-btn').forEach(btn => {
            btn.addEventListener('click', () => showPlanDetail(btn.dataset.planId));
        });
    }

    function renderPlanCards(list) {
        return list.map(p => {
            const pct = Math.round(p.completedCount / p.targetCount * 100);
            const scenario = ASSESSMENT_SCENARIOS.find(s => s.id === p.scenario);
            const rule = SCORING_RULES.find(r => r.id === p.scoringRule);
            const supplierNames = p.targetSuppliers.map(sid => SUPPLIERS.find(x => x.id === sid)?.name?.substring(0, 6) + '...').slice(0, 3);
            const moreCount = p.targetSuppliers.length - 3;

            return `
            <div class="card" style="cursor:pointer" >
                <div style="display:flex;gap:20px;flex-wrap:wrap">
                    <div style="flex:1;min-width:280px">
                        <div class="card-header" style="margin-bottom:8px">
                            <div style="display:flex;align-items:center;gap:8px">
                                <span style="font-family:monospace;font-size:11px;padding:2px 8px;background:var(--bg);border-radius:4px;color:var(--text-muted)">${p.id}</span>
                                ${statusTag(p.status)}
                            </div>
                            <a class="action-link plan-detail-btn" data-plan-id="${p.id}" style="font-size:13px">查看详情 →</a>
                        </div>
                        <h3 style="font-size:16px;margin-bottom:6px">${p.name}</h3>
                        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.purpose}</p>

                        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
                            <div class="inline-stat"><span>关联场景</span><span class="tag tag-purple" style="font-size:10px">${p.scenario}</span></div>
                            <div class="inline-stat"><span>负责人</span><strong>${p.responsible}</strong></div>
                            <div class="inline-stat"><span>周期</span><strong style="font-size:12px">${p.startDate} ~ ${p.endDate}</strong></div>
                        </div>

                        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                            <span style="font-size:12px;color:var(--text-muted)">评估进度</span>
                            <span style="font-size:12px;font-weight:600">${p.completedCount} / ${p.targetCount} 供应商</span>
                        </div>
                        ${progressBar(pct)}
                    </div>

                    <div style="width:220px;display:flex;flex-direction:column;gap:8px;flex-shrink:0">
                        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:2px">评估维度 & 权重</div>
                        ${p.categories.map(c => {
                            const w = p.categoryWeights[c] || 0;
                            const t = INDICATOR_TYPES.find(x => x.code === c);
                            return `<div style="display:flex;align-items:center;gap:6px">
                                <span style="width:18px;height:18px;border-radius:4px;background:${getTypeColor(c)}18;color:${getTypeColor(c)};font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">${c}</span>
                                <span style="flex:1;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t?.name || c}</span>
                                <span style="font-size:12px;font-weight:700;color:${getTypeColor(c)}">${w}%</span>
                            </div>`;
                        }).join('')}

                        <div style="margin-top:6px;font-size:11px;font-weight:600;color:var(--text-muted)">评分规则</div>
                        <div style="font-size:11px;color:var(--text-secondary)">${rule?.name || p.scoringRule}</div>

                        <div style="margin-top:4px;font-size:11px;font-weight:600;color:var(--text-muted)">评估对象 (${p.targetSuppliers.length})</div>
                        <div style="font-size:11px;color:var(--text-secondary)">${supplierNames.join('、')}${moreCount > 0 ? ` 等${p.targetSuppliers.length}家` : ''}</div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    // ===== Plan Detail Modal =====
    function showPlanDetail(planId) {
        const p = ASSESSMENT_PLANS.find(x => x.id === planId);
        if (!p) return;
        const scenario = ASSESSMENT_SCENARIOS.find(s => s.id === p.scenario);
        const rule = SCORING_RULES.find(r => r.id === p.scoringRule);
        const pct = Math.round(p.completedCount / p.targetCount * 100);

        const html = `
            <div class="plan-section">
                <div class="plan-section-title"><span class="section-icon" style="background:var(--info-light);color:var(--info)"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg></span>基本信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><label>方案编号</label><span style="font-family:monospace">${p.id}</span></div>
                    <div class="detail-item"><label>状态</label><span>${statusTag(p.status)}</span></div>
                    <div class="detail-item"><label>负责人</label><span>${p.responsible}</span></div>
                    <div class="detail-item"><label>起止日期</label><span>${p.startDate} ~ ${p.endDate}</span></div>
                    <div class="detail-item"><label>关联场景</label><span><span class="tag tag-purple">${p.scenario}</span> ${scenario?.name || ''}</span></div>
                </div>
            </div>

            <div class="plan-section">
                <div class="plan-section-title"><span class="section-icon" style="background:var(--primary-light);color:var(--primary)"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg></span>评估目的</div>
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;padding:10px 14px;background:var(--bg);border-radius:var(--radius)">${p.purpose}</p>
            </div>

            <div class="plan-section">
                <div class="plan-section-title"><span class="section-icon" style="background:var(--warning-light);color:#92400E"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812z" clip-rule="evenodd"/></svg></span>评分规则 & 分级阈值</div>
                <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px">
                    <div style="flex:1;padding:12px;background:var(--bg);border-radius:var(--radius);min-width:200px">
                        <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:4px">评分规则</div>
                        <div style="font-size:14px;font-weight:600">${rule?.name || '-'}</div>
                        <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${rule?.desc || ''}</div>
                        <div style="font-size:11px;color:var(--text-muted);margin-top:4px;font-family:monospace">${rule?.formula || ''}</div>
                    </div>
                    <div style="display:flex;gap:8px;align-items:stretch">
                        <div style="padding:12px 16px;background:var(--primary-light);border-radius:var(--radius);text-align:center;min-width:70px"><div style="font-size:10px;font-weight:600;color:var(--primary-dark)">优秀</div><div style="font-size:18px;font-weight:700;color:var(--primary)">≥${p.gradeThresholds.excellent}</div></div>
                        <div style="padding:12px 16px;background:var(--secondary-light);border-radius:var(--radius);text-align:center;min-width:70px"><div style="font-size:10px;font-weight:600;color:var(--secondary)">良好</div><div style="font-size:18px;font-weight:700;color:var(--secondary)">≥${p.gradeThresholds.good}</div></div>
                        <div style="padding:12px 16px;background:var(--warning-light);border-radius:var(--radius);text-align:center;min-width:70px"><div style="font-size:10px;font-weight:600;color:#92400E">一般</div><div style="font-size:18px;font-weight:700;color:#92400E">≥${p.gradeThresholds.fair}</div></div>
                        <div style="padding:12px 16px;background:var(--danger-light);border-radius:var(--radius);text-align:center;min-width:70px"><div style="font-size:10px;font-weight:600;color:var(--danger)">需改进</div><div style="font-size:18px;font-weight:700;color:var(--danger)">&lt;${p.gradeThresholds.fair}</div></div>
                    </div>
                </div>
            </div>

            <div class="plan-section">
                <div class="plan-section-title"><span class="section-icon" style="background:#E0E7FF;color:#4338CA"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z"/></svg></span>评估指标配置 (${p.selectedL1.length} 项一级指标)</div>
                ${p.categories.map(c => {
                    const t = INDICATOR_TYPES.find(x => x.code === c);
                    const w = p.categoryWeights[c] || 0;
                    const l1s = p.selectedL1.filter(code => code.startsWith(c)).map(code => LEVEL1_INDICATORS.find(x => x.code === code)).filter(Boolean);
                    return `<div style="margin-bottom:12px;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden">
                        <div style="padding:8px 14px;background:${getTypeColor(c)}08;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px">
                            <span style="width:22px;height:22px;border-radius:4px;background:${getTypeColor(c)}20;color:${getTypeColor(c)};font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center">${c}</span>
                            <span style="font-weight:600;font-size:13px">${t?.name || c}</span>
                            <span style="margin-left:auto;font-size:13px;font-weight:700;color:${getTypeColor(c)}">权重 ${w}%</span>
                        </div>
                        <div style="padding:8px 14px;display:flex;flex-wrap:wrap;gap:6px">
                            ${l1s.map(l => `<span class="chip chip-primary">${l.code} ${l.name}</span>`).join('')}
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div class="plan-section">
                <div class="plan-section-title"><span class="section-icon" style="background:var(--primary-light);color:var(--primary-dark)"><svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg></span>评估对象 (${p.targetSuppliers.length} 家供应商)</div>
                <div class="table-wrapper">
                    <table class="data-table"><thead><tr><th>编号</th><th>供应商名称</th><th>类型</th><th>评级</th><th>进度</th><th>操作</th></tr></thead>
                    <tbody>${p.targetSuppliers.map((sid, idx) => {
                        const sup = SUPPLIERS.find(x => x.id === sid);
                        if (!sup) return '';
                        const done = sid === 'S001' && p.status === '已完成';
                        const inProgress = !done && p.completedCount > 0 && idx < p.completedCount;
                        return `<tr>
                            <td style="font-family:monospace;font-size:12px">${sup.id}</td>
                            <td style="font-weight:500">${sup.name}</td>
                            <td><span class="tag tag-gray">${sup.level}</span></td>
                            <td>${gradeTag(sup.grade)}</td>
                            <td>${done ? '<span class="tag tag-green">已完成</span>' : inProgress ? '<span class="tag tag-blue">进行中</span>' : '<span class="tag tag-gray">待评估</span>'}</td>
                            <td>${sup.id === 'S001' ? `<a class="action-link" onclick="window._startScoring('${p.id}','${sup.id}');document.getElementById('modalOverlay').classList.remove('active')">打分</a>` : '<span style="font-size:11px;color:var(--text-muted)">暂无数据</span>'}</td>
                        </tr>`;
                    }).join('')}</tbody></table>
                </div>
                <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:12px;color:var(--text-muted)">评估完成进度</span>
                    <span style="font-size:13px;font-weight:700">${p.completedCount} / ${p.targetCount}</span>
                </div>
                ${progressBar(pct)}
            </div>
        `;

        openModal('评估方案详情 — ' + p.name, html);
        document.getElementById('modalConfirm').textContent = '关闭';
        document.getElementById('modalConfirm').onclick = closeModal;
        document.getElementById('modalCancel').style.display = 'none';
        document.getElementById('modalPrev').style.display = 'none';
        document.getElementById('modalNext').style.display = 'none';
    }

    // ===== Create Plan Wizard =====
    let wizardStep = 0;
    const wizardState = { name: '', scenario: '', purpose: '', responsible: '', startDate: '', endDate: '', scoringRule: 'RULE-LINEAR', gradeThresholds: { excellent: 90, good: 70, fair: 60 }, categories: [], categoryWeights: {}, selectedL1: [], targetSuppliers: [] };

    function openCreatePlanWizard() {
        wizardStep = 0;
        Object.assign(wizardState, { name: '', scenario: '', purpose: '', responsible: '', startDate: '', endDate: '', scoringRule: 'RULE-LINEAR', gradeThresholds: { excellent: 90, good: 70, fair: 60 }, categories: [], categoryWeights: {}, selectedL1: [], targetSuppliers: [] });
        renderWizardStep();
        modalOverlay.classList.add('active');
    }

    function renderWizardStep() {
        const steps = ['基本信息 & 目的', '评估指标', '评分规则', '评估对象', '确认提交'];
        const stepperHTML = `<div class="wizard-stepper">${steps.map((s, i) =>
            `${i > 0 ? `<div class="wizard-connector ${i <= wizardStep ? 'done' : ''}"></div>` : ''}` +
            `<div class="wizard-step ${i === wizardStep ? 'active' : i < wizardStep ? 'done' : ''}"><span class="step-num">${i < wizardStep ? '✓' : i + 1}</span><span>${s}</span></div>`
        ).join('')}</div>`;

        document.getElementById('modalTitle').textContent = '创建评估方案';
        const prevBtn = document.getElementById('modalPrev');
        const nextBtn = document.getElementById('modalNext');
        const confirmBtn = document.getElementById('modalConfirm');
        const cancelBtn = document.getElementById('modalCancel');

        cancelBtn.style.display = '';
        prevBtn.style.display = wizardStep > 0 ? '' : 'none';
        nextBtn.style.display = wizardStep < 4 ? '' : 'none';
        confirmBtn.style.display = wizardStep === 4 ? '' : 'none';
        confirmBtn.textContent = '创建方案';

        prevBtn.onclick = () => { collectStepData(); wizardStep--; renderWizardStep(); };
        nextBtn.onclick = () => { collectStepData(); wizardStep++; renderWizardStep(); };
        confirmBtn.onclick = () => { alert('评估方案已创建（原型演示）'); closeModal(); renderPlans(); };
        cancelBtn.onclick = closeModal;

        let body = stepperHTML;

        if (wizardStep === 0) {
            body += `
                <div class="form-group"><label class="required">方案名称</label><input type="text" id="wName" value="${wizardState.name}" placeholder="例：2026年度供应商绿色绩效综合评估"></div>
                <div class="form-row">
                    <div class="form-group"><label class="required">关联评估场景</label>
                        <select id="wScenario"><option value="">请选择场景...</option>${ASSESSMENT_SCENARIOS.map(s => `<option value="${s.id}" ${s.id === wizardState.scenario ? 'selected' : ''}>${s.id} · ${s.name}</option>`).join('')}</select>
                    </div>
                    <div class="form-group"><label class="required">负责人</label><input type="text" id="wResponsible" value="${wizardState.responsible}" placeholder="评估负责人姓名"></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label class="required">开始日期</label><input type="date" id="wStartDate" value="${wizardState.startDate}"></div>
                    <div class="form-group"><label class="required">截止日期</label><input type="date" id="wEndDate" value="${wizardState.endDate}"></div>
                </div>
                <div class="form-group"><label class="required">评估目的</label><textarea id="wPurpose" rows="4" placeholder="详细描述本次评估的目的、背景及预期成果...">${wizardState.purpose}</textarea></div>
            `;
        } else if (wizardStep === 1) {
            body += `
                <div style="margin-bottom:16px">
                    <label style="font-size:13px;font-weight:600;margin-bottom:8px;display:block">选择评估维度（指标类型）</label>
                    <div class="checkbox-grid" id="wCatGrid">
                        ${INDICATOR_TYPES.map(t => `<label class="checkbox-item ${wizardState.categories.includes(t.code) ? 'selected' : ''}">
                            <input type="checkbox" value="${t.code}" ${wizardState.categories.includes(t.code) ? 'checked' : ''}>
                            <span style="width:20px;height:20px;border-radius:4px;background:${t.color}18;color:${t.color};font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${t.code}</span>
                            <span style="font-size:12px">${t.name}</span>
                        </label>`).join('')}
                    </div>
                </div>
                <div style="margin-bottom:16px" id="wWeightsSection">
                    <label style="font-size:13px;font-weight:600;margin-bottom:8px;display:block">维度权重配置 <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(合计应为100%)</span></label>
                    <div id="wWeightRows">${renderWeightRows()}</div>
                </div>
                <div>
                    <label style="font-size:13px;font-weight:600;margin-bottom:8px;display:block">选择一级指标</label>
                    <div id="wL1Grid">${renderL1Selection()}</div>
                </div>
            `;
        } else if (wizardStep === 2) {
            body += `
                <div class="form-group">
                    <label class="required">评分规则</label>
                    <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">
                        ${SCORING_RULES.map(r => `<label class="checkbox-item ${wizardState.scoringRule === r.id ? 'selected' : ''}" style="flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px">
                            <div style="display:flex;align-items:center;gap:8px;width:100%">
                                <input type="radio" name="wRule" value="${r.id}" ${wizardState.scoringRule === r.id ? 'checked' : ''} style="accent-color:var(--primary);width:16px;height:16px">
                                <span style="font-weight:600">${r.name}</span>
                            </div>
                            <div style="font-size:11px;color:var(--text-secondary);margin-left:24px">${r.desc}</div>
                            <div style="font-size:10px;color:var(--text-muted);margin-left:24px;font-family:monospace">${r.formula}</div>
                        </label>`).join('')}
                    </div>
                </div>
                <div style="margin-top:16px">
                    <label style="font-size:13px;font-weight:600;margin-bottom:8px;display:block">分级阈值</label>
                    <div style="display:flex;gap:12px;flex-wrap:wrap">
                        <div class="form-group" style="flex:1;min-width:120px"><label>优秀 ≥</label><input type="number" id="wThExcellent" value="${wizardState.gradeThresholds.excellent}" min="0" max="100"></div>
                        <div class="form-group" style="flex:1;min-width:120px"><label>良好 ≥</label><input type="number" id="wThGood" value="${wizardState.gradeThresholds.good}" min="0" max="100"></div>
                        <div class="form-group" style="flex:1;min-width:120px"><label>一般 ≥</label><input type="number" id="wThFair" value="${wizardState.gradeThresholds.fair}" min="0" max="100"></div>
                    </div>
                </div>
            `;
        } else if (wizardStep === 3) {
            body += `
                <div class="form-group">
                    <label class="required">选择评估对象（供应商）</label>
                    <div style="display:flex;gap:8px;margin-bottom:10px">
                        <button class="btn btn-sm btn-outline" id="wSelAll">全选</button>
                        <button class="btn btn-sm btn-secondary" id="wSelNone">清空</button>
                    </div>
                    <div class="checkbox-grid" id="wSupplierGrid">
                        ${SUPPLIERS.filter(s => s.status === '合作中').map(s => `<label class="checkbox-item ${wizardState.targetSuppliers.includes(s.id) ? 'selected' : ''}">
                            <input type="checkbox" value="${s.id}" ${wizardState.targetSuppliers.includes(s.id) ? 'checked' : ''}>
                            <div style="display:flex;flex-direction:column;gap:1px">
                                <span style="font-size:12px;font-weight:500">${s.name.substring(0, 10)}</span>
                                <span style="font-size:10px;color:var(--text-muted)">${s.id} · ${s.level} · ${gradeTag(s.grade)}</span>
                            </div>
                        </label>`).join('')}
                    </div>
                    <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">已选 <strong id="wSupCount">${wizardState.targetSuppliers.length}</strong> 家供应商</div>
                </div>
            `;
        } else if (wizardStep === 4) {
            const rule = SCORING_RULES.find(r => r.id === wizardState.scoringRule);
            body += `
                <div style="padding:16px;background:var(--primary-light);border-radius:var(--radius);margin-bottom:16px;text-align:center">
                    <div style="font-size:13px;font-weight:600;color:var(--primary-dark)">请确认以下评估方案信息</div>
                </div>
                <div class="detail-grid" style="margin-bottom:16px">
                    <div class="detail-item"><label>方案名称</label><span style="font-weight:600">${wizardState.name || '（未填写）'}</span></div>
                    <div class="detail-item"><label>关联场景</label><span>${wizardState.scenario || '（未选择）'}</span></div>
                    <div class="detail-item"><label>负责人</label><span>${wizardState.responsible || '（未填写）'}</span></div>
                    <div class="detail-item"><label>周期</label><span>${wizardState.startDate || '?'} ~ ${wizardState.endDate || '?'}</span></div>
                </div>
                <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:600;color:var(--text-muted)">评估目的</label><p style="font-size:12px;margin-top:4px;color:var(--text-secondary)">${wizardState.purpose || '（未填写）'}</p></div>
                <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:600;color:var(--text-muted)">评估维度 (${wizardState.categories.length})</label>
                    <div class="chip-list" style="margin-top:4px">${wizardState.categories.map(c => `<span class="chip chip-primary">${c}. ${INDICATOR_TYPES.find(x => x.code === c)?.name || c} (${wizardState.categoryWeights[c] || 0}%)</span>`).join('')}</div></div>
                <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:600;color:var(--text-muted)">一级指标 (${wizardState.selectedL1.length})</label>
                    <div class="chip-list" style="margin-top:4px">${wizardState.selectedL1.map(code => `<span class="chip">${code}</span>`).join('')}</div></div>
                <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:600;color:var(--text-muted)">评分规则</label><span style="font-size:12px;margin-left:4px">${rule?.name || '-'}</span></div>
                <div style="margin-bottom:12px"><label style="font-size:11px;font-weight:600;color:var(--text-muted)">分级阈值</label><span style="font-size:12px;margin-left:4px">优秀≥${wizardState.gradeThresholds.excellent}　良好≥${wizardState.gradeThresholds.good}　一般≥${wizardState.gradeThresholds.fair}</span></div>
                <div><label style="font-size:11px;font-weight:600;color:var(--text-muted)">评估对象 (${wizardState.targetSuppliers.length} 家)</label>
                    <div class="chip-list" style="margin-top:4px">${wizardState.targetSuppliers.map(sid => { const s = SUPPLIERS.find(x => x.id === sid); return `<span class="chip">${s?.name?.substring(0, 8) || sid}</span>`; }).join('')}</div></div>
            `;
        }

        document.getElementById('modalBody').innerHTML = body;

        if (wizardStep === 1) {
            bindCatCheckboxes();
            bindL1Checkboxes();
        }
        if (wizardStep === 2) bindRuleRadios();
        if (wizardStep === 3) bindSupplierCheckboxes();
    }

    function renderWeightRows() {
        if (!wizardState.categories.length) return '<p style="font-size:12px;color:var(--text-muted)">请先选择评估维度</p>';
        return wizardState.categories.map(c => {
            const t = INDICATOR_TYPES.find(x => x.code === c);
            const w = wizardState.categoryWeights[c] || 0;
            return `<div class="weight-row">
                <div class="weight-label"><span style="color:${getTypeColor(c)};font-weight:700">${c}</span> ${t?.name?.substring(0, 8) || c}</div>
                <input type="range" min="0" max="100" value="${w}" data-cat="${c}" class="wWeightSlider">
                <div class="weight-value">${w}%</div>
            </div>`;
        }).join('');
    }

    function renderL1Selection() {
        if (!wizardState.categories.length) return '<p style="font-size:12px;color:var(--text-muted)">请先选择评估维度</p>';
        return wizardState.categories.map(c => {
            const t = INDICATOR_TYPES.find(x => x.code === c);
            const l1s = LEVEL1_INDICATORS.filter(i => i.type === c);
            return `<div style="margin-bottom:12px"><div style="font-size:12px;font-weight:600;color:${getTypeColor(c)};margin-bottom:6px">${c}. ${t?.name || ''}</div>
                <div class="checkbox-grid">${l1s.map(l => `<label class="checkbox-item ${wizardState.selectedL1.includes(l.code) ? 'selected' : ''}">
                    <input type="checkbox" value="${l.code}" class="wL1Check" ${wizardState.selectedL1.includes(l.code) ? 'checked' : ''}>
                    <span style="font-size:12px"><strong>${l.code}</strong> ${l.name.substring(0, 12)}</span>
                </label>`).join('')}</div></div>`;
        }).join('');
    }

    function bindCatCheckboxes() {
        document.querySelectorAll('#wCatGrid input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                cb.closest('.checkbox-item').classList.toggle('selected', cb.checked);
                collectCatSelections();
                document.getElementById('wWeightRows').innerHTML = renderWeightRows();
                document.getElementById('wL1Grid').innerHTML = renderL1Selection();
                bindWeightSliders();
                bindL1Checkboxes();
            });
        });
        bindWeightSliders();
    }

    function collectCatSelections() {
        wizardState.categories = [...document.querySelectorAll('#wCatGrid input:checked')].map(cb => cb.value);
        wizardState.categories.forEach(c => { if (!wizardState.categoryWeights[c]) wizardState.categoryWeights[c] = Math.round(100 / wizardState.categories.length); });
    }

    function bindWeightSliders() {
        document.querySelectorAll('.wWeightSlider').forEach(slider => {
            slider.addEventListener('input', () => {
                const c = slider.dataset.cat;
                wizardState.categoryWeights[c] = parseInt(slider.value);
                slider.nextElementSibling.textContent = slider.value + '%';
            });
        });
    }

    function bindL1Checkboxes() {
        document.querySelectorAll('.wL1Check').forEach(cb => {
            cb.addEventListener('change', () => {
                cb.closest('.checkbox-item').classList.toggle('selected', cb.checked);
            });
        });
    }

    function bindRuleRadios() {
        document.querySelectorAll('input[name="wRule"]').forEach(radio => {
            radio.addEventListener('change', () => {
                document.querySelectorAll('input[name="wRule"]').forEach(r => r.closest('.checkbox-item').classList.remove('selected'));
                radio.closest('.checkbox-item').classList.add('selected');
            });
        });
    }

    function bindSupplierCheckboxes() {
        const grid = document.getElementById('wSupplierGrid');
        const countEl = document.getElementById('wSupCount');
        grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => {
                cb.closest('.checkbox-item').classList.toggle('selected', cb.checked);
                countEl.textContent = grid.querySelectorAll('input:checked').length;
            });
        });
        document.getElementById('wSelAll').addEventListener('click', () => {
            grid.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; cb.closest('.checkbox-item').classList.add('selected'); });
            countEl.textContent = grid.querySelectorAll('input:checked').length;
        });
        document.getElementById('wSelNone').addEventListener('click', () => {
            grid.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; cb.closest('.checkbox-item').classList.remove('selected'); });
            countEl.textContent = 0;
        });
    }

    function collectStepData() {
        if (wizardStep === 0) {
            wizardState.name = document.getElementById('wName')?.value || '';
            wizardState.scenario = document.getElementById('wScenario')?.value || '';
            wizardState.responsible = document.getElementById('wResponsible')?.value || '';
            wizardState.startDate = document.getElementById('wStartDate')?.value || '';
            wizardState.endDate = document.getElementById('wEndDate')?.value || '';
            wizardState.purpose = document.getElementById('wPurpose')?.value || '';
        } else if (wizardStep === 1) {
            wizardState.categories = [...document.querySelectorAll('#wCatGrid input:checked')].map(cb => cb.value);
            document.querySelectorAll('.wWeightSlider').forEach(s => { wizardState.categoryWeights[s.dataset.cat] = parseInt(s.value); });
            wizardState.selectedL1 = [...document.querySelectorAll('.wL1Check:checked')].map(cb => cb.value);
        } else if (wizardStep === 2) {
            const checked = document.querySelector('input[name="wRule"]:checked');
            if (checked) wizardState.scoringRule = checked.value;
            wizardState.gradeThresholds.excellent = parseInt(document.getElementById('wThExcellent')?.value) || 90;
            wizardState.gradeThresholds.good = parseInt(document.getElementById('wThGood')?.value) || 70;
            wizardState.gradeThresholds.fair = parseInt(document.getElementById('wThFair')?.value) || 60;
        } else if (wizardStep === 3) {
            wizardState.targetSuppliers = [...document.querySelectorAll('#wSupplierGrid input:checked')].map(cb => cb.value);
        }
    }

    // ===== Scoring Page =====
    let scoringState = {
        planId: 'PLAN-004',
        supplierId: 'S001',
        activeDim: 'A',
        values: {},
        comments: {},
    };

    function initScoringValues() {
        scoringState.values = {};
        scoringState.comments = {};
        S001_SCORES.forEach(s => {
            scoringState.values[s.l3code] = s.actual;
            scoringState.comments[s.l3code] = '';
        });
    }

    function calcAutoScore(actual, benchmark, ruleId) {
        if (actual === '' || actual === undefined || actual === null) return null;
        const a = typeof actual === 'string' ? (actual === '是' ? 1 : 0) : parseFloat(actual);
        const b = typeof benchmark === 'string' ? (benchmark === '是' ? 1 : 0) : parseFloat(benchmark);
        if (isNaN(a) || isNaN(b) || b === 0) {
            if (typeof actual === 'string' && actual === '是') return 10;
            return null;
        }
        if (ruleId === 'RULE-INVERSE') return Math.max(0, +(10 - (a / b) * 10).toFixed(2));
        return Math.min(10, +((a / b) * 10).toFixed(2));
    }

    function getScoringPlan() {
        return ASSESSMENT_PLANS.find(p => p.id === scoringState.planId);
    }

    function getScoringDimScores() {
        const plan = getScoringPlan();
        if (!plan) return {};
        const result = {};
        plan.categories.forEach(cat => {
            const l1codes = plan.selectedL1.filter(c => c.startsWith(cat));
            const scores = [];
            l1codes.forEach(l1c => {
                const l2s = LEVEL2_INDICATORS.filter(i => i.l1 === l1c);
                l2s.forEach(l2 => {
                    const l3s = S001_SCORES.filter(s => s.l2 === l2.code);
                    l3s.forEach(l3 => {
                        const val = scoringState.values[l3.l3code];
                        const sc = calcAutoScore(val, l3.benchmark, plan.scoringRule);
                        if (sc !== null) scores.push(sc);
                    });
                });
            });
            result[cat] = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;
        });
        return result;
    }

    function getScoringTotal() {
        const plan = getScoringPlan();
        if (!plan) return 0;
        const dimScores = getScoringDimScores();
        let totalWeight = 0, weightedSum = 0;
        plan.categories.forEach(cat => {
            const w = plan.categoryWeights[cat] || 0;
            const s = dimScores[cat];
            if (s !== null && s !== undefined) {
                weightedSum += s * w;
                totalWeight += w;
            }
        });
        return totalWeight > 0 ? +(weightedSum / totalWeight).toFixed(2) : 0;
    }

    function getScoringGrade(score, plan) {
        if (!plan) return { label: '-', cls: '' };
        const t = plan.gradeThresholds;
        const s100 = score * 10;
        if (s100 >= t.excellent) return { label: '优秀', cls: 'tag-green' };
        if (s100 >= t.good) return { label: '良好', cls: 'tag-blue' };
        if (s100 >= t.fair) return { label: '一般', cls: 'tag-yellow' };
        return { label: '需改进', cls: 'tag-red' };
    }

    function getScoringProgress() {
        let filled = 0, total = 0;
        const plan = getScoringPlan();
        if (!plan) return { filled: 0, total: 0, pct: 0 };
        plan.categories.forEach(cat => {
            plan.selectedL1.filter(c => c.startsWith(cat)).forEach(l1c => {
                LEVEL2_INDICATORS.filter(i => i.l1 === l1c).forEach(l2 => {
                    S001_SCORES.filter(s => s.l2 === l2.code).forEach(l3 => {
                        total++;
                        const v = scoringState.values[l3.l3code];
                        if (v !== '' && v !== undefined && v !== null) filled++;
                    });
                });
            });
        });
        return { filled, total, pct: total > 0 ? Math.round(filled / total * 100) : 0 };
    }

    function renderScoring() {
        initScoringValues();
        scoringState.activeDim = getScoringPlan()?.categories[0] || 'A';
        renderScoringPage();
    }

    window._startScoring = function (planId, supplierId) {
        scoringState.planId = planId;
        scoringState.supplierId = supplierId || 'S001';
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('[data-page="scoring"]')?.classList.add('active');
        breadcrumbTitle.textContent = '评估打分';
        renderScoring();
    };

    function renderScoringPage() {
        const plan = getScoringPlan();
        const supplier = SUPPLIERS.find(s => s.id === scoringState.supplierId);
        if (!plan || !supplier) {
            pageContent.innerHTML = '<div class="empty-state"><h3>请先选择评估方案和供应商</h3></div>';
            return;
        }
        const rule = SCORING_RULES.find(r => r.id === plan.scoringRule);
        const progress = getScoringProgress();
        const total = getScoringTotal();
        const grade = getScoringGrade(total, plan);
        const dimScores = getScoringDimScores();

        const progressRingSvg = `<svg class="scoring-progress-ring" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="4"/>
            <circle cx="30" cy="30" r="26" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round"
                stroke-dasharray="${2 * Math.PI * 26}" stroke-dashoffset="${2 * Math.PI * 26 * (1 - progress.pct / 100)}"
                transform="rotate(-90 30 30)"/>
            <text x="30" y="33" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">${progress.pct}%</text>
        </svg>`;

        pageContent.innerHTML = `
            <div class="page-header" style="margin-bottom:0">
                <div><h1>评估打分</h1><p>逐项录入指标实际值，系统自动计算得分，实时汇总评估结果</p></div>
                <div class="btn-group">
                    <button class="btn btn-secondary btn-sm" id="btnSaveDraft">保存草稿</button>
                    <button class="btn btn-primary btn-sm" id="btnSubmitScore">提交评估</button>
                </div>
            </div>

            <div class="scoring-header">
                <div class="sh-plan">
                    <h2>${plan.name}</h2>
                    <p>${plan.id} · ${rule?.name || ''} · ${plan.startDate} ~ ${plan.endDate}</p>
                </div>
                <div class="sh-supplier">
                    <div class="sup-avatar">${supplier.name[0]}</div>
                    <div class="sup-info">
                        <span class="sup-name">${supplier.name}</span>
                        <span class="sup-meta">${supplier.id} · ${supplier.level} · ${supplier.industry}</span>
                    </div>
                </div>
                ${progressRingSvg}
            </div>

            <div class="scoring-layout">
                <div class="scoring-main">
                    <div class="dim-nav" id="dimNav">
                        ${plan.categories.map(cat => {
                            const t = INDICATOR_TYPES.find(x => x.code === cat);
                            const l1codes = plan.selectedL1.filter(c => c.startsWith(cat));
                            let cnt = 0;
                            l1codes.forEach(l1c => {
                                LEVEL2_INDICATORS.filter(i => i.l1 === l1c).forEach(l2 => {
                                    cnt += S001_SCORES.filter(s => s.l2 === l2.code).length;
                                });
                            });
                            return `<button class="dim-nav-item ${cat === scoringState.activeDim ? 'active' : ''}" data-dim="${cat}">
                                <span style="width:6px;height:6px;border-radius:50%;background:${getTypeColor(cat)}"></span>
                                ${cat}. ${t?.name?.substring(0, 6) || cat}
                                <span class="dim-count">${cnt}</span>
                            </button>`;
                        }).join('')}
                    </div>

                    <div id="scoringForms">${renderScoringForms()}</div>
                </div>

                <div class="scoring-sidebar">
                    <div class="card live-summary" id="liveSummary">
                        ${renderLiveSummary()}
                    </div>
                </div>
            </div>
        `;

        document.querySelectorAll('#dimNav .dim-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                scoringState.activeDim = btn.dataset.dim;
                document.querySelectorAll('#dimNav .dim-nav-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('scoringForms').innerHTML = renderScoringForms();
                bindScoringInputs();
            });
        });

        bindScoringInputs();

        document.getElementById('btnSubmitScore').addEventListener('click', () => {
            const t = getScoringTotal();
            const g = getScoringGrade(t, plan);
            openModal('提交评估确认', `
                <div style="text-align:center;padding:20px 0">
                    <div style="font-size:48px;font-weight:800;color:${scoreColor(t)};margin-bottom:4px">${t}</div>
                    <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">加权综合得分 (满分10)</div>
                    <span class="tag ${g.cls}" style="font-size:14px;padding:6px 20px">${g.label}</span>
                    <div style="margin-top:20px;text-align:left">
                        <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">各维度得分：</div>
                        ${plan.categories.map(cat => {
                            const s = dimScores[cat];
                            const t2 = INDICATOR_TYPES.find(x => x.code === cat);
                            return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                                <span style="width:8px;height:8px;border-radius:50%;background:${getTypeColor(cat)}"></span>
                                <span style="flex:1;font-size:12px">${cat}. ${t2?.name || ''}</span>
                                <span style="font-weight:700;font-size:13px;color:${s ? scoreColor(s) : 'var(--text-muted)'}">${s !== null ? s : '-'}</span>
                                <span style="font-size:10px;color:var(--text-muted);width:28px;text-align:right">${plan.categoryWeights[cat]}%</span>
                            </div>`;
                        }).join('')}
                    </div>
                    <p style="margin-top:16px;font-size:12px;color:var(--text-secondary)">确认提交后，评估结果将归档并更新供应商评级。</p>
                </div>
            `);
            document.getElementById('modalConfirm').textContent = '确认提交';
            document.getElementById('modalConfirm').onclick = () => { alert('评估已提交（原型演示）'); closeModal(); };
            document.getElementById('modalCancel').style.display = '';
            document.getElementById('modalPrev').style.display = 'none';
            document.getElementById('modalNext').style.display = 'none';
        });

        document.getElementById('btnSaveDraft').addEventListener('click', () => { alert('草稿已保存（原型演示）'); });
    }

    function renderScoringForms() {
        const plan = getScoringPlan();
        if (!plan) return '';
        const cat = scoringState.activeDim;
        const color = getTypeColor(cat);
        const l1codes = plan.selectedL1.filter(c => c.startsWith(cat));

        let html = '';
        l1codes.forEach(l1c => {
            const l1 = LEVEL1_INDICATORS.find(i => i.code === l1c);
            if (!l1) return;
            const l2s = LEVEL2_INDICATORS.filter(i => i.l1 === l1c);
            const relevantL2s = l2s.filter(l2 => S001_SCORES.some(s => s.l2 === l2.code));
            if (!relevantL2s.length) return;

            html += `<div class="card" style="margin-bottom:16px;border-left:4px solid ${color};padding:0;overflow:hidden">
                <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;background:${color}06">
                    <span style="font-weight:700;color:${color};font-size:14px">${l1.code}</span>
                    <span style="font-weight:600;font-size:14px">${l1.name}</span>
                </div>`;

            relevantL2s.forEach(l2 => {
                const l3items = S001_SCORES.filter(s => s.l2 === l2.code);
                if (!l3items.length) return;

                const l2Scores = l3items.map(l3 => {
                    const v = scoringState.values[l3.l3code];
                    return calcAutoScore(v, l3.benchmark, plan.scoringRule);
                }).filter(s => s !== null);
                const l2Avg = l2Scores.length ? +(l2Scores.reduce((a, b) => a + b, 0) / l2Scores.length).toFixed(1) : '-';

                html += `<div class="l2-group-header" data-l2="${l2.code}">
                    <span class="l2-code" style="color:${color}">${l2.code}</span>
                    <span class="l2-name">${l2.name}</span>
                    <span class="l2-avg" style="color:${l2Avg === '-' ? 'var(--text-muted)' : scoreColor(l2Avg)}">${l2Avg}</span>
                    <span class="l2-toggle">▼</span>
                </div>
                <div class="l2-group-body" data-l2-body="${l2.code}">
                    <div class="score-header-row">
                        <span>指标</span><span style="text-align:center">实际值</span><span style="text-align:center">基准值</span><span style="text-align:center">得分</span><span>备注</span>
                    </div>
                    ${l3items.map(l3 => {
                        const val = scoringState.values[l3.l3code];
                        const autoScore = calcAutoScore(val, l3.benchmark, plan.scoringRule);
                        const comment = scoringState.comments[l3.l3code] || '';
                        return `<div class="score-input-row">
                            <div class="indicator-info">
                                <span class="indicator-code">${l3.l3code}</span>
                                <span class="indicator-name" title="${l3.name}">${l3.name}</span>
                            </div>
                            <div><input type="${typeof l3.benchmark === 'string' ? 'text' : 'number'}" class="score-actual" data-code="${l3.l3code}" value="${val}" step="any"></div>
                            <div style="text-align:center;font-size:12px;color:var(--text-muted);padding:6px 0">${l3.benchmark}</div>
                            <div class="auto-score" style="color:${autoScore !== null ? scoreColor(autoScore) : 'var(--text-muted)'}">${autoScore !== null ? autoScore : '-'}</div>
                            <div class="comment-input"><input type="text" class="score-comment" data-code="${l3.l3code}" value="${comment}" placeholder="备注..."></div>
                        </div>`;
                    }).join('')}
                </div>`;
            });

            html += '</div>';
        });

        if (!html) {
            html = `<div class="card"><div class="empty-state"><h3>该维度暂无需要打分的三级指标</h3><p>请在评估方案中配置相应的一级指标</p></div></div>`;
        }

        return html;
    }

    function renderLiveSummary() {
        const plan = getScoringPlan();
        if (!plan) return '';
        const total = getScoringTotal();
        const grade = getScoringGrade(total, plan);
        const dimScores = getScoringDimScores();
        const progress = getScoringProgress();

        return `
            <div class="ls-total">
                <div class="ls-score">${total}</div>
                <div class="ls-label">加权综合得分 (满分10)</div>
            </div>
            <div class="ls-grade ${grade.cls}" style="background:${grade.cls === 'tag-green' ? 'var(--primary-light)' : grade.cls === 'tag-blue' ? 'var(--secondary-light)' : grade.cls === 'tag-yellow' ? 'var(--warning-light)' : 'var(--danger-light)'}">${grade.label}</div>

            <div style="margin-bottom:12px">
                <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:11px;color:var(--text-muted)">打分进度</span>
                    <span style="font-size:11px;font-weight:600">${progress.filled}/${progress.total}</span>
                </div>
                ${progressBar(progress.pct)}
            </div>

            <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:8px;padding-top:8px;border-top:1px solid var(--border)">维度得分</div>
            ${plan.categories.map(cat => {
                const t = INDICATOR_TYPES.find(x => x.code === cat);
                const s = dimScores[cat];
                const w = plan.categoryWeights[cat] || 0;
                return `<div class="ls-dim-row">
                    <span class="ls-dim-dot" style="background:${getTypeColor(cat)}"></span>
                    <span class="ls-dim-name">${cat}. ${t?.name?.substring(0, 6) || ''}</span>
                    <span class="ls-dim-score" style="color:${s !== null ? scoreColor(s) : 'var(--text-muted)'}">${s !== null ? s : '-'}</span>
                    <span class="ls-dim-pct">${w}%</span>
                </div>`;
            }).join('')}

            <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px">评分规则</div>
            <div style="font-size:11px;color:var(--text-secondary)">${SCORING_RULES.find(r => r.id === plan.scoringRule)?.name || ''}</div>
            <div style="font-size:10px;color:var(--text-muted);font-family:monospace;margin-top:2px">${SCORING_RULES.find(r => r.id === plan.scoringRule)?.formula || ''}</div>

            <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border)">
                <div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px">分级阈值</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
                    <div style="font-size:10px;color:var(--primary);background:var(--primary-light);padding:3px 6px;border-radius:4px;text-align:center">优秀 ≥${plan.gradeThresholds.excellent}</div>
                    <div style="font-size:10px;color:var(--secondary);background:var(--secondary-light);padding:3px 6px;border-radius:4px;text-align:center">良好 ≥${plan.gradeThresholds.good}</div>
                    <div style="font-size:10px;color:#92400E;background:var(--warning-light);padding:3px 6px;border-radius:4px;text-align:center">一般 ≥${plan.gradeThresholds.fair}</div>
                    <div style="font-size:10px;color:var(--danger);background:var(--danger-light);padding:3px 6px;border-radius:4px;text-align:center">需改进 &lt;${plan.gradeThresholds.fair}</div>
                </div>
            </div>
        `;
    }

    function bindScoringInputs() {
        const plan = getScoringPlan();
        document.querySelectorAll('.score-actual').forEach(input => {
            input.addEventListener('input', () => {
                const code = input.dataset.code;
                const val = input.type === 'number' ? (input.value === '' ? '' : parseFloat(input.value)) : input.value;
                scoringState.values[code] = val;

                const l3 = S001_SCORES.find(s => s.l3code === code);
                if (l3) {
                    const autoScore = calcAutoScore(val, l3.benchmark, plan?.scoringRule);
                    const scoreEl = input.closest('.score-input-row').querySelector('.auto-score');
                    scoreEl.textContent = autoScore !== null ? autoScore : '-';
                    scoreEl.style.color = autoScore !== null ? scoreColor(autoScore) : 'var(--text-muted)';
                }

                updateL2Headers();
                document.getElementById('liveSummary').innerHTML = renderLiveSummary();
            });
        });

        document.querySelectorAll('.score-comment').forEach(input => {
            input.addEventListener('input', () => {
                scoringState.comments[input.dataset.code] = input.value;
            });
        });

        document.querySelectorAll('.l2-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const l2code = header.dataset.l2;
                const body = document.querySelector(`[data-l2-body="${l2code}"]`);
                const toggle = header.querySelector('.l2-toggle');
                if (body.style.display === 'none') {
                    body.style.display = '';
                    toggle.classList.remove('collapsed');
                } else {
                    body.style.display = 'none';
                    toggle.classList.add('collapsed');
                }
            });
        });
    }

    function updateL2Headers() {
        const plan = getScoringPlan();
        document.querySelectorAll('.l2-group-header').forEach(header => {
            const l2code = header.dataset.l2;
            const l3items = S001_SCORES.filter(s => s.l2 === l2code);
            const scores = l3items.map(l3 => calcAutoScore(scoringState.values[l3.l3code], l3.benchmark, plan?.scoringRule)).filter(s => s !== null);
            const avg = scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';
            const avgEl = header.querySelector('.l2-avg');
            avgEl.textContent = avg;
            avgEl.style.color = avg === '-' ? 'var(--text-muted)' : scoreColor(avg);
        });
    }

    // ===== Suppliers =====
    function renderSuppliers() {
        pageContent.innerHTML = `
            <div class="page-header"><div><h1>供应商列表</h1><p>管理所有参与低碳评估的供应商信息与评级结果</p></div>
                <button class="btn btn-primary">+ 新增供应商</button></div>
            <div class="filter-bar">
                <select id="sfLevel"><option value="">全部类型</option><option>一级供应商</option><option>二级供应商</option><option>关键原材料供应商</option><option>物流服务商</option></select>
                <select id="sfGrade"><option value="">全部评级</option><option>A</option><option>B</option><option>C</option><option>D</option></select>
                <select id="sfStatus"><option value="">全部状态</option><option>合作中</option><option>暂停合作</option></select>
                <select id="sfRegion"><option value="">全部区域</option><option>华东</option><option>华南</option><option>华北</option><option>华中</option><option>西南</option><option>东北</option></select>
            </div>
            <div class="card" style="padding:0">
                <div class="table-wrapper"><table class="data-table" id="supplierTable">
                    <thead><tr><th>编号</th><th>供应商名称</th><th>行业</th><th>类型</th><th>区域</th><th>评级</th><th>状态</th><th>联系人</th><th>操作</th></tr></thead>
                    <tbody>${renderSupplierRows(SUPPLIERS)}</tbody>
                </table></div>
            </div>
        `;
        ['sfLevel','sfGrade','sfStatus','sfRegion'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => {
                const lv = document.getElementById('sfLevel').value;
                const gr = document.getElementById('sfGrade').value;
                const st = document.getElementById('sfStatus').value;
                const rg = document.getElementById('sfRegion').value;
                const filtered = SUPPLIERS.filter(s => {
                    if (lv && s.level !== lv) return false;
                    if (gr && s.grade !== gr) return false;
                    if (st && s.status !== st) return false;
                    if (rg && s.region !== rg) return false;
                    return true;
                });
                document.querySelector('#supplierTable tbody').innerHTML = renderSupplierRows(filtered);
            });
        });
    }

    function renderSupplierRows(list) {
        return list.map(s => `<tr>
            <td style="font-family:monospace;font-size:12px;font-weight:600">${s.id}</td>
            <td style="font-weight:500;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name}</td>
            <td style="font-size:12px">${s.industry}</td>
            <td><span class="tag tag-gray">${s.level}</span></td>
            <td>${s.region}</td>
            <td>${gradeTag(s.grade)}</td>
            <td>${statusTag(s.status)}</td>
            <td>${s.contact}</td>
            <td>${s.hasData ? '<a class="action-link" onclick="window._goSupplierDetail()">评估详情</a>' : '<span style="font-size:12px;color:var(--text-muted)">暂无数据</span>'}</td>
        </tr>`).join('') || '<tr><td colspan="9" style="text-align:center;padding:40px;color:var(--text-muted)">暂无匹配数据</td></tr>';
    }

    window._goSupplierDetail = function () {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.querySelector('[data-page="supplier-detail"]').classList.add('active');
        breadcrumbTitle.textContent = 'S001 评估详情';
        renderSupplierDetail();
    };

    // ===== Supplier Detail (S001) =====
    function renderSupplierDetail() {
        const s = SUPPLIERS.find(x => x.id === 'S001');
        const summary = computeS001Summary();
        const types = INDICATOR_TYPES.filter(t => summary.byType[t.code]);

        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>${s.name}</h1>
                    <p>${s.id} · ${s.level} · ${s.industry} · ${s.region}</p>
                </div>
                <div class="btn-group"><button class="btn btn-secondary btn-sm">导出评估报告</button><button class="btn btn-primary btn-sm">发起新评估</button></div>
            </div>

            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>综合得分</h4><div class="stat-value" style="color:var(--primary)">${summary.overall}</div></div></div>
                <div class="stat-card"><div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                    <div class="stat-info"><h4>评估维度</h4><div class="stat-value">${types.length}</div><div class="stat-change up">A / B / C 三大类</div></div></div>
                <div class="stat-card"><div class="stat-icon purple"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>三级指标</h4><div class="stat-value">${S001_SCORES.length}</div><div class="stat-change up">已完成评分</div></div></div>
                <div class="stat-card"><div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>短板指标</h4><div class="stat-value" style="color:var(--danger)">${S001_SCORES.filter(x => x.score < 5).length}</div><div class="stat-change down">低于5分需重点关注</div></div></div>
            </div>

            <div class="dashboard-grid">
                <div class="card full-width">
                    <div class="card-header"><h3>雷达图 · 维度评分对比</h3></div>
                    <div style="display:flex;gap:24px;flex-wrap:wrap;justify-content:center">
                        <div style="width:320px;height:280px">${svgRadar(
                            types.map(t => summary.byType[t.code]),
                            types.map(t => t.code),
                            320, 280, '#10B981'
                        )}</div>
                        <div style="flex:1;min-width:240px;display:flex;flex-direction:column;gap:8px;justify-content:center">
                            ${types.map(t => {
                                const score = summary.byType[t.code];
                                return `<div style="display:flex;align-items:center;gap:10px">
                                    <span style="width:10px;height:10px;border-radius:50%;background:${t.color};flex-shrink:0"></span>
                                    <span style="font-size:13px;font-weight:600;min-width:24px;color:${t.color}">${t.code}</span>
                                    <span style="flex:1;font-size:13px">${t.name}</span>
                                    <span style="font-size:15px;font-weight:700;color:${scoreColor(score)}">${score}</span>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="tabs" id="detailTabs">
                ${types.map((t, i) => `<button class="tab ${i === 0 ? 'active' : ''}" data-dtype="${t.code}" style="${i === 0 ? `border-color:${t.color};color:${t.color}` : ''}">${t.code}. ${t.name.substring(0, 6)}</button>`).join('')}
            </div>

            <div id="detailContent">${renderDetailSection(types[0]?.code || 'A', summary)}</div>
        `;

        document.querySelectorAll('#detailTabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#detailTabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const typeCode = tab.dataset.dtype;
                const color = getTypeColor(typeCode);
                tab.style.borderColor = color;
                tab.style.color = color;
                document.getElementById('detailContent').innerHTML = renderDetailSection(typeCode, summary);
            });
        });
    }

    function renderDetailSection(typeCode, summary) {
        const color = getTypeColor(typeCode);
        const l1s = LEVEL1_INDICATORS.filter(i => i.type === typeCode);
        const scores = S001_SCORES.filter(s => s.type === typeCode);

        return l1s.map(l1 => {
            const l1Score = summary.byL1[l1.code];
            const l1Scores = scores.filter(s => s.l1 === l1.code);
            if (!l1Scores.length) return '';

            const l2Groups = {};
            l1Scores.forEach(s => {
                if (!l2Groups[s.l2]) l2Groups[s.l2] = [];
                l2Groups[s.l2].push(s);
            });

            return `
            <div class="card" style="margin-bottom:16px;border-left:4px solid ${color}">
                <div class="card-header">
                    <div style="display:flex;align-items:center;gap:10px">
                        <span style="font-weight:700;color:${color}">${l1.code}</span>
                        <h3 style="font-size:15px">${l1.name}</h3>
                    </div>
                    ${l1Score ? `<span style="font-size:20px;font-weight:700;color:${scoreColor(l1Score)}">${l1Score}</span>` : ''}
                </div>
                ${Object.entries(l2Groups).map(([l2code, items]) => {
                    const l2Info = LEVEL2_INDICATORS.find(x => x.code === l2code);
                    const l2Score = summary.byL2[l2code];
                    return `
                    <div style="margin-bottom:12px">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:6px 10px;background:var(--bg);border-radius:var(--radius-sm)">
                            <span style="font-size:12px;font-weight:700;color:${color}">${l2code}</span>
                            <span style="font-size:13px;font-weight:500">${l2Info?.name || l2code}</span>
                            ${l2Score ? `<span style="margin-left:auto;font-size:13px;font-weight:700;color:${scoreColor(l2Score)}">${l2Score}</span>` : ''}
                        </div>
                        <div class="table-wrapper" style="margin-left:16px">
                            <table class="data-table">
                                <thead><tr><th style="width:80px">编码</th><th>三级指标</th><th style="width:80px">实际值</th><th style="width:80px">基准值</th><th style="width:80px">得分</th><th style="width:120px">得分条</th></tr></thead>
                                <tbody>${items.map(item => `<tr>
                                    <td style="font-family:monospace;font-size:11px;font-weight:600">${item.l3code}</td>
                                    <td style="font-size:13px">${item.name}</td>
                                    <td style="font-weight:600">${item.actual}</td>
                                    <td style="color:var(--text-muted)">${item.benchmark}</td>
                                    <td style="font-weight:700;font-size:14px;color:${scoreColor(item.score)}">${item.score}</td>
                                    <td><div class="progress-bar"><div class="progress-fill" style="width:${item.score * 10}%;background:${scoreColor(item.score)}"></div></div></td>
                                </tr>`).join('')}</tbody>
                            </table>
                        </div>
                    </div>`;
                }).join('')}
            </div>`;
        }).join('');
    }

    init();
})();
