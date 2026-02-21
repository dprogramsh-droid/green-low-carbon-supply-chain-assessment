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
        const r = { dashboard: renderDashboard, 'indicator-types': renderIndicatorTypes, 'indicator-tree': renderIndicatorTree, scenarios: renderScenarios, plans: renderPlans, suppliers: renderSuppliers, 'supplier-detail': renderSupplierDetail };
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
            <div class="page-header"><div><h1>评估方案</h1><p>管理具体的评估方案执行计划与进度跟踪</p></div>
                <button class="btn btn-primary">+ 创建评估方案</button></div>
            <div class="filter-bar">
                <select id="planStatusFilter"><option value="">全部状态</option><option>进行中</option><option>已完成</option><option>计划中</option></select>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px" id="planList">
                ${renderPlanCards(ASSESSMENT_PLANS)}
            </div>
        `;
        document.getElementById('planStatusFilter').addEventListener('change', e => {
            const v = e.target.value;
            const filtered = v ? ASSESSMENT_PLANS.filter(p => p.status === v) : ASSESSMENT_PLANS;
            document.getElementById('planList').innerHTML = renderPlanCards(filtered);
        });
    }

    function renderPlanCards(list) {
        return list.map(p => {
            const pct = Math.round(p.completedCount / p.targetCount * 100);
            const scenario = ASSESSMENT_SCENARIOS.find(s => s.id === p.scenario);
            return `
            <div class="card">
                <div class="card-header">
                    <span style="font-family:monospace;font-size:11px;color:var(--text-muted)">${p.id}</span>
                    ${statusTag(p.status)}
                </div>
                <h3 style="font-size:15px;margin-bottom:10px">${p.name}</h3>
                <div class="detail-grid" style="margin-bottom:12px">
                    <div class="detail-item"><label>关联场景</label><span><span class="tag tag-purple">${p.scenario}</span></span></div>
                    <div class="detail-item"><label>负责人</label><span>${p.responsible}</span></div>
                    <div class="detail-item"><label>起止日期</label><span style="font-size:12px">${p.startDate} ~ ${p.endDate}</span></div>
                    <div class="detail-item"><label>评估维度</label><span style="display:flex;gap:4px;flex-wrap:wrap">${p.categories.map(c => `<span style="padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;background:${getTypeColor(c)}15;color:${getTypeColor(c)}">${c}</span>`).join('')}</span></div>
                </div>
                <div>
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                        <span style="font-size:12px">评估进度</span>
                        <span style="font-size:12px;font-weight:600">${p.completedCount}/${p.targetCount} 供应商</span>
                    </div>
                    ${progressBar(pct)}
                </div>
                ${scenario ? `<div style="margin-top:10px;font-size:11px;color:var(--text-muted)">场景: ${scenario.name}</div>` : ''}
            </div>`;
        }).join('');
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
