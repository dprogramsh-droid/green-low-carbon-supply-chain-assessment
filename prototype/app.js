(function () {
    'use strict';

    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');
    const pageContent = document.getElementById('pageContent');
    const breadcrumbTitle = document.getElementById('currentPageTitle');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');

    const PAGE_TITLES = {
        dashboard: '数据看板',
        suppliers: '供应商信息与分级',
        grading: '分级标准配置',
        compliance: '合规审查记录',
        indicators: '绿色指标体系',
        assessment: '评估记录',
        'data-upload': '数据上传与验证',
        monitoring: '实时监控与预警',
        targets: '绿色目标管理',
        training: '培训与反馈',
        communication: '沟通记录',
        questionnaire: '问卷与调研',
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
        modalClose.addEventListener('click', closeModal);
        modalCancel.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
    }

    function openModal(title, bodyHTML, onConfirm) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = bodyHTML;
        const confirmBtn = document.getElementById('modalConfirm');
        const newBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
        newBtn.id = 'modalConfirm';
        newBtn.addEventListener('click', () => { if (onConfirm) onConfirm(); closeModal(); });
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
    }

    function renderPage(page) {
        const renderers = {
            dashboard: renderDashboard,
            suppliers: renderSuppliers,
            grading: renderGrading,
            compliance: renderCompliance,
            indicators: renderIndicators,
            assessment: renderAssessment,
            'data-upload': renderDataUpload,
            monitoring: renderMonitoring,
            targets: renderTargets,
            training: renderTraining,
            communication: renderCommunication,
            questionnaire: renderQuestionnaire,
        };
        const fn = renderers[page];
        if (fn) fn();
    }

    // ===== Helpers =====
    function gradeTag(grade) {
        const map = { '优秀供应商': 'tag-green', '合格供应商': 'tag-blue', '待改进供应商': 'tag-yellow', '淘汰供应商': 'tag-red' };
        return `<span class="tag ${map[grade] || 'tag-gray'}">${grade}</span>`;
    }

    function statusTag(status) {
        const map = { '合规': 'tag-green', '待整改': 'tag-yellow', '不合规': 'tag-red', '合作中': 'tag-green', '暂停合作': 'tag-yellow', '终止合作': 'tag-red' };
        return `<span class="tag ${map[status] || 'tag-gray'}">${status}</span>`;
    }

    function tierBadge(tier) {
        return `<span class="tier-badge ${tier === 'Tier1' ? 'tier1' : 'tier2'}">${tier}</span>`;
    }

    function alertTag(status) {
        const map = { '正常': 'tag-green', '预警': 'tag-yellow', '异常': 'tag-red' };
        return `<span class="tag ${map[status] || 'tag-gray'}">${status}</span>`;
    }

    function verifyTag(status) {
        const map = { '验证通过': 'tag-green', '待验证': 'tag-yellow', '验证不通过': 'tag-red' };
        return `<span class="tag ${map[status] || 'tag-gray'}">${status}</span>`;
    }

    function progressBar(pct) {
        let colorClass = 'green';
        if (pct < 40) colorClass = 'red';
        else if (pct < 70) colorClass = 'yellow';
        else if (pct < 90) colorClass = 'blue';
        return `<div class="progress-bar"><div class="progress-fill ${colorClass}" style="width:${pct}%"></div></div><div class="progress-text">${pct}%</div>`;
    }

    function scoreCircle(score) {
        let cls = 'excellent';
        if (score < 60) cls = 'poor';
        else if (score < 70) cls = 'fair';
        else if (score < 90) cls = 'good';
        return `<span class="score-circle ${cls}">${score}</span>`;
    }

    function miniBarChart(values, maxVal) {
        const max = maxVal || Math.max(...values) * 1.2;
        return `<div style="display:flex;align-items:flex-end;gap:3px;height:40px;">${values.map(v => `<div style="flex:1;background:var(--primary);border-radius:2px;height:${(v / max) * 100}%;opacity:0.7;min-height:2px"></div>`).join('')}</div>`;
    }

    function svgLineChart(values, w, h, color) {
        if (!values.length) return '';
        const max = Math.max(...values) * 1.15;
        const min = Math.min(...values) * 0.85;
        const range = max - min || 1;
        const points = values.map((v, i) => {
            const x = (i / (values.length - 1)) * w;
            const y = h - ((v - min) / range) * h;
            return `${x},${y}`;
        });
        const areaPoints = `0,${h} ${points.join(' ')} ${w},${h}`;
        return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:100%">
            <defs><linearGradient id="lg_${color.replace('#','')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.3"/><stop offset="100%" stop-color="${color}" stop-opacity="0.02"/></linearGradient></defs>
            <polygon points="${areaPoints}" fill="url(#lg_${color.replace('#','')})" />
            <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            ${values.map((v, i) => {
                const x = (i / (values.length - 1)) * w;
                const y = h - ((v - min) / range) * h;
                return `<circle cx="${x}" cy="${y}" r="3" fill="white" stroke="${color}" stroke-width="2"/>`;
            }).join('')}
        </svg>`;
    }

    // ===== Dashboard =====
    function renderDashboard() {
        const d = MOCK_DATA;
        const tier1Count = d.suppliers.filter(s => s.tier === 'Tier1').length;
        const tier2Count = d.suppliers.filter(s => s.tier === 'Tier2').length;
        const excellentCount = d.suppliers.filter(s => s.grade === '优秀供应商').length;
        const alertCount = d.monitoring.filter(m => m.alertStatus !== '正常').length;
        const avgScore = Math.round(d.suppliers.reduce((a, s) => a + s.score, 0) / d.suppliers.length);

        const gradeDistribution = {
            '优秀供应商': d.suppliers.filter(s => s.grade === '优秀供应商').length,
            '合格供应商': d.suppliers.filter(s => s.grade === '合格供应商').length,
            '待改进供应商': d.suppliers.filter(s => s.grade === '待改进供应商').length,
            '淘汰供应商': d.suppliers.filter(s => s.grade === '淘汰供应商').length,
        };

        const pieColors = { '优秀供应商': '#10B981', '合格供应商': '#3B82F6', '待改进供应商': '#F59E0B', '淘汰供应商': '#EF4444' };
        const total = d.suppliers.length;
        let cumulativePercent = 0;
        const pieSlices = Object.entries(gradeDistribution).map(([label, count]) => {
            const pct = count / total;
            const startAngle = cumulativePercent * 2 * Math.PI;
            cumulativePercent += pct;
            const endAngle = cumulativePercent * 2 * Math.PI;
            const largeArc = pct > 0.5 ? 1 : 0;
            const x1 = 50 + 45 * Math.cos(startAngle - Math.PI / 2);
            const y1 = 50 + 45 * Math.sin(startAngle - Math.PI / 2);
            const x2 = 50 + 45 * Math.cos(endAngle - Math.PI / 2);
            const y2 = 50 + 45 * Math.sin(endAngle - Math.PI / 2);
            return count > 0 ? `<path d="M50,50 L${x1},${y1} A45,45 0 ${largeArc},1 ${x2},${y2} Z" fill="${pieColors[label]}"/>` : '';
        }).join('');

        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>数据看板</h1>
                    <p>汽车零部件行业绿色供应链管理概览 · Tier1-Tier2 全链路</p>
                </div>
                <div class="btn-group">
                    <button class="btn btn-secondary btn-sm">导出报告</button>
                    <button class="btn btn-primary btn-sm">+ 快速录入</button>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon green">
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>供应商总数</h4>
                        <div class="stat-value">${total}</div>
                        <div class="stat-change up">Tier1: ${tier1Count} / Tier2: ${tier2Count}</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue">
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>平均评估得分</h4>
                        <div class="stat-value">${avgScore}</div>
                        <div class="stat-change up">优秀: ${excellentCount} 家</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow">
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>当前预警</h4>
                        <div class="stat-value">${alertCount}</div>
                        <div class="stat-change down">需关注处理</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon purple">
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                    </div>
                    <div class="stat-info">
                        <h4>目标进行中</h4>
                        <div class="stat-value">${d.targets.filter(t => t.status === '进行中').length}</div>
                        <div class="stat-change up">整体进度良好</div>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>供应商分级分布</h3>
                    </div>
                    <div class="pie-chart-container">
                        <svg class="pie-chart" viewBox="0 0 100 100">${pieSlices}</svg>
                        <div class="pie-legend">
                            ${Object.entries(gradeDistribution).map(([k, v]) => `
                                <div class="pie-legend-item">
                                    <span class="pie-legend-dot" style="background:${pieColors[k]}"></span>
                                    <span>${k}</span>
                                    <span class="pie-legend-value">${v}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>供应商评分排行</h3>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        ${d.suppliers.sort((a, b) => b.score - a.score).slice(0, 6).map((s, i) => `
                            <div style="display:flex;align-items:center;gap:10px;">
                                <span style="width:20px;text-align:center;font-size:12px;font-weight:600;color:${i < 3 ? 'var(--primary)' : 'var(--text-muted)'}">${i + 1}</span>
                                <span style="flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</span>
                                ${tierBadge(s.tier)}
                                <span style="font-weight:700;font-size:14px;color:${s.score >= 90 ? 'var(--primary)' : s.score >= 70 ? 'var(--secondary)' : 'var(--warning)'}">${s.score}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card full-width">
                    <div class="card-header">
                        <h3>最新预警与通知</h3>
                        <button class="btn btn-sm btn-secondary">查看全部</button>
                    </div>
                    <div class="notification-list">
                        ${d.notifications.slice(0, 4).map(n => `
                            <div class="notification-item ${n.type}">
                                <div class="noti-content">
                                    <div class="noti-title">${n.title}</div>
                                    <div class="noti-desc">${n.desc}</div>
                                </div>
                                <div class="noti-time">${n.time}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>近期合规审查</h3>
                    </div>
                    <div class="table-wrapper">
                        <table class="data-table">
                            <thead><tr><th>供应商</th><th>类型</th><th>状态</th></tr></thead>
                            <tbody>
                                ${d.complianceRecords.slice(0, 4).map(r => `
                                    <tr>
                                        <td style="max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.supplierName}</td>
                                        <td><span class="tag tag-gray">${r.type}</span></td>
                                        <td>${statusTag(r.status)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>目标完成进度</h3>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:14px;">
                        ${d.targets.slice(0, 4).map(t => `
                            <div>
                                <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                                    <span style="font-size:12px;font-weight:500">${t.supplierName.substring(0, 8)}...</span>
                                    <span style="font-size:11px;color:var(--text-muted)">${t.type}</span>
                                </div>
                                ${progressBar(t.progress)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== Suppliers Page =====
    function renderSuppliers() {
        const d = MOCK_DATA.suppliers;
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>供应商信息与分级</h1>
                    <p>管理 Tier1-Tier2 供应商基础信息档案与分级结果</p>
                </div>
                <button class="btn btn-primary" onclick="window._openNewSupplierModal()">+ 新增供应商</button>
            </div>

            <div class="filter-bar">
                <select id="filterTier"><option value="">全部层级</option><option>Tier1</option><option>Tier2</option></select>
                <select id="filterGrade"><option value="">全部分级</option><option>优秀供应商</option><option>合格供应商</option><option>待改进供应商</option><option>淘汰供应商</option></select>
                <select id="filterStatus"><option value="">全部状态</option><option>合作中</option><option>暂停合作</option><option>终止合作</option></select>
                <select id="filterIndustry"><option value="">全部行业</option><option>汽车发动机零部件</option><option>电子零部件</option><option>底盘零部件</option><option>新能源汽车零部件</option><option>车身及内饰零部件</option></select>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table" id="supplierTable">
                        <thead>
                            <tr>
                                <th>供应商 ID</th>
                                <th>公司名称</th>
                                <th>所属行业</th>
                                <th>层级</th>
                                <th>评分</th>
                                <th>分级</th>
                                <th>合作状态</th>
                                <th>联系人</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${d.map(s => `
                                <tr>
                                    <td style="font-family:monospace;font-size:12px">${s.id}</td>
                                    <td style="font-weight:500;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name}</td>
                                    <td><span class="tag tag-gray">${s.industry}</span></td>
                                    <td>${tierBadge(s.tier)}</td>
                                    <td><span style="font-weight:700;color:${s.score >= 90 ? 'var(--primary)' : s.score >= 70 ? 'var(--secondary)' : s.score >= 60 ? 'var(--warning)' : 'var(--danger)'}">${s.score}</span></td>
                                    <td>${gradeTag(s.grade)}</td>
                                    <td>${statusTag(s.status)}</td>
                                    <td>${s.contact}</td>
                                    <td>
                                        <a class="action-link" onclick="window._viewSupplier('${s.id}')">详情</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        ['filterTier','filterGrade','filterStatus','filterIndustry'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', filterSuppliers);
        });
    }

    function filterSuppliers() {
        const tier = document.getElementById('filterTier').value;
        const grade = document.getElementById('filterGrade').value;
        const status = document.getElementById('filterStatus').value;
        const industry = document.getElementById('filterIndustry').value;

        const filtered = MOCK_DATA.suppliers.filter(s => {
            if (tier && s.tier !== tier) return false;
            if (grade && s.grade !== grade) return false;
            if (status && s.status !== status) return false;
            if (industry && s.industry !== industry) return false;
            return true;
        });

        const tbody = document.querySelector('#supplierTable tbody');
        tbody.innerHTML = filtered.map(s => `
            <tr>
                <td style="font-family:monospace;font-size:12px">${s.id}</td>
                <td style="font-weight:500;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.name}</td>
                <td><span class="tag tag-gray">${s.industry}</span></td>
                <td>${tierBadge(s.tier)}</td>
                <td><span style="font-weight:700;color:${s.score >= 90 ? 'var(--primary)' : s.score >= 70 ? 'var(--secondary)' : s.score >= 60 ? 'var(--warning)' : 'var(--danger)'}">${s.score}</span></td>
                <td>${gradeTag(s.grade)}</td>
                <td>${statusTag(s.status)}</td>
                <td>${s.contact}</td>
                <td><a class="action-link" onclick="window._viewSupplier('${s.id}')">详情</a></td>
            </tr>
        `).join('') || '<tr><td colspan="9" class="empty-state" style="padding:40px">暂无匹配数据</td></tr>';
    }

    window._openNewSupplierModal = function () {
        openModal('新增供应商', `
            <div class="form-row">
                <div class="form-group"><label class="required">供应商 ID</label><input type="text" placeholder="GREEN-SUP-XXX" value="GREEN-SUP-013"></div>
                <div class="form-group"><label class="required">公司名称</label><input type="text" placeholder="请输入完整全称"></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label class="required">所属行业</label>
                    <select><option>汽车发动机零部件</option><option>电子零部件</option><option>底盘零部件</option><option>新能源汽车零部件</option><option>车身及内饰零部件</option><option>其他</option></select>
                </div>
                <div class="form-group"><label class="required">供应商层级</label>
                    <select><option>Tier1 供应商</option><option>Tier2 供应商</option></select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>联系人</label><input type="text" placeholder="联系人姓名"></div>
                <div class="form-group"><label>联系方式</label><input type="text" placeholder="电话号码"></div>
            </div>
            <div class="form-group"><label>关联 Tier1 供应商（Tier2 必填）</label>
                <select><option value="">无</option>${MOCK_DATA.suppliers.filter(s => s.tier === 'Tier1').map(s => `<option>${s.name}</option>`).join('')}</select>
            </div>
        `, () => { alert('供应商已创建（原型演示）'); });
    };

    window._viewSupplier = function (id) {
        const s = MOCK_DATA.suppliers.find(x => x.id === id);
        if (!s) return;
        const parentName = s.parentTier1 ? MOCK_DATA.suppliers.find(x => x.id === s.parentTier1)?.name : '-';
        const tier2Names = (s.tier2List || []).map(t2id => MOCK_DATA.suppliers.find(x => x.id === t2id)?.name).filter(Boolean);

        openModal(`供应商详情 - ${s.name}`, `
            <div class="detail-grid" style="margin-bottom:20px">
                <div class="detail-item"><label>供应商 ID</label><span style="font-family:monospace">${s.id}</span></div>
                <div class="detail-item"><label>层级</label><span>${tierBadge(s.tier)}</span></div>
                <div class="detail-item"><label>所属行业</label><span>${s.industry}</span></div>
                <div class="detail-item"><label>合作状态</label><span>${statusTag(s.status)}</span></div>
                <div class="detail-item"><label>联系人</label><span>${s.contact}</span></div>
                <div class="detail-item"><label>联系方式</label><span>${s.phone}</span></div>
                <div class="detail-item"><label>评估得分</label><span style="font-weight:700;font-size:18px;color:${s.score >= 90 ? 'var(--primary)' : s.score >= 70 ? 'var(--secondary)' : 'var(--warning)'}">${s.score} 分</span></div>
                <div class="detail-item"><label>分级结果</label><span>${gradeTag(s.grade)}</span></div>
            </div>
            ${s.tier === 'Tier2' ? `<div class="detail-item" style="margin-bottom:12px"><label>关联 Tier1</label><span style="color:var(--secondary);font-weight:500">${parentName}</span></div>` : ''}
            ${tier2Names.length ? `<div class="detail-item"><label>下属 Tier2 供应商 (${tier2Names.length})</label><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${tier2Names.map(n => `<span class="tag tag-purple">${n}</span>`).join('')}</div></div>` : ''}
        `, null);

        document.getElementById('modalConfirm').textContent = '关闭';
        document.getElementById('modalCancel').style.display = 'none';
    };

    // ===== Grading Standards =====
    function renderGrading() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>分级标准配置</h1>
                    <p>配置供应商分级评估的维度、评分指标及权重规则</p>
                </div>
                <button class="btn btn-primary">+ 新增指标</button>
            </div>

            <div class="card" style="margin-bottom:20px">
                <div class="card-header"><h3>分级阈值配置</h3></div>
                <div class="detail-grid">
                    <div class="detail-item"><label>优秀供应商</label><span style="color:var(--primary);font-weight:600">≥ 90 分</span></div>
                    <div class="detail-item"><label>合格供应商</label><span style="color:var(--secondary);font-weight:600">70 - 89 分</span></div>
                    <div class="detail-item"><label>待改进供应商</label><span style="color:var(--warning);font-weight:600">60 - 69 分</span></div>
                    <div class="detail-item"><label>淘汰供应商</label><span style="color:var(--danger);font-weight:600">&lt; 60 分</span></div>
                </div>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>分级维度</th><th>评分指标</th><th>权重</th><th>Tier1 评分规则</th><th>Tier2 评分规则</th></tr>
                        </thead>
                        <tbody>
                            ${MOCK_DATA.gradingStandards.map(g => `
                                <tr>
                                    <td><span class="tag tag-green">${g.dimension}</span></td>
                                    <td style="font-weight:500">${g.indicator}</td>
                                    <td style="font-weight:700;color:var(--primary)">${g.weight}%</td>
                                    <td style="font-size:12px;max-width:240px">${g.ruleTier1}</td>
                                    <td style="font-size:12px;max-width:240px">${g.ruleTier2}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ===== Compliance =====
    function renderCompliance() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>合规审查记录</h1>
                    <p>记录并管理供应商绿色合规审查全流程信息</p>
                </div>
                <button class="btn btn-primary">+ 新增审查</button>
            </div>

            <div class="filter-bar">
                <select><option value="">全部类型</option><option>年度审查</option><option>专项审查</option><option>整改复查</option></select>
                <select><option value="">全部状态</option><option>合规</option><option>待整改</option><option>不合规</option></select>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>审查 ID</th><th>供应商</th><th>类型</th><th>周期</th><th>负责人</th><th>审查时间</th><th>合规状态</th><th>审查范围</th><th>问题记录</th></tr>
                        </thead>
                        <tbody>
                            ${MOCK_DATA.complianceRecords.map(r => `
                                <tr>
                                    <td style="font-family:monospace;font-size:12px">${r.id}</td>
                                    <td style="font-weight:500;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.supplierName}</td>
                                    <td><span class="tag tag-gray">${r.type}</span></td>
                                    <td>${r.period}</td>
                                    <td>${r.auditor}</td>
                                    <td>${r.time}</td>
                                    <td>${statusTag(r.status)}</td>
                                    <td style="max-width:160px;font-size:12px">${r.scope.join('、')}</td>
                                    <td style="max-width:200px;font-size:12px;color:${r.issues === '无' ? 'var(--text-muted)' : 'var(--danger)'}">${r.issues}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ===== Indicators =====
    function renderIndicators() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>绿色指标体系</h1>
                    <p>统一的绿色能力评估指标体系，支持 Tier1-Tier2 差异化配置</p>
                </div>
                <button class="btn btn-primary">+ 新增指标</button>
            </div>

            <div class="tabs">
                <button class="tab active" data-filter="all">全部指标</button>
                <button class="tab" data-filter="Tier1">Tier1 专属</button>
                <button class="tab" data-filter="Tier2">Tier2 专属</button>
                <button class="tab" data-filter="通用">通用指标</button>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table" id="indicatorTable">
                        <thead>
                            <tr><th>指标 ID</th><th>指标名称</th><th>分类</th><th>适用层级</th><th>权重</th><th>单位</th><th>优秀</th><th>合格</th><th>待改进</th></tr>
                        </thead>
                        <tbody id="indicatorBody">
                            ${renderIndicatorRows(MOCK_DATA.indicators)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.querySelectorAll('.tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                const filtered = filter === 'all' ? MOCK_DATA.indicators : MOCK_DATA.indicators.filter(i => i.scope === filter);
                document.getElementById('indicatorBody').innerHTML = renderIndicatorRows(filtered);
            });
        });
    }

    function renderIndicatorRows(indicators) {
        return indicators.map(i => `
            <tr>
                <td style="font-family:monospace;font-size:12px">${i.id}</td>
                <td style="font-weight:500">${i.name}</td>
                <td><span class="tag tag-purple">${i.category}</span></td>
                <td>${i.scope === 'Tier1' ? tierBadge('Tier1') : i.scope === 'Tier2' ? tierBadge('Tier2') : '<span class="tag tag-gray">通用</span>'}</td>
                <td style="font-weight:700;color:var(--primary)">${i.weight}%</td>
                <td style="font-size:12px">${i.unit}</td>
                <td style="color:var(--primary);font-size:12px">${i.excellent}</td>
                <td style="color:var(--secondary);font-size:12px">${i.qualified}</td>
                <td style="color:var(--warning);font-size:12px">${i.improve}</td>
            </tr>
        `).join('');
    }

    // ===== Assessment =====
    function renderAssessment() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>评估记录</h1>
                    <p>供应商定期绿色能力评估全流程记录与改进跟踪</p>
                </div>
                <button class="btn btn-primary">+ 新增评估</button>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>评估 ID</th><th>供应商</th><th>评估主体</th><th>周期</th><th>总分</th><th>分级</th><th>核心问题</th><th>改进建议</th><th>状态</th></tr>
                        </thead>
                        <tbody>
                            ${MOCK_DATA.assessments.map(a => `
                                <tr>
                                    <td style="font-family:monospace;font-size:12px">${a.id}</td>
                                    <td style="font-weight:500;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.supplierName}</td>
                                    <td><span class="tag tag-gray">${a.assessor}</span></td>
                                    <td>${a.period}</td>
                                    <td style="font-weight:700;font-size:16px;color:${a.score >= 90 ? 'var(--primary)' : a.score >= 70 ? 'var(--secondary)' : a.score >= 60 ? 'var(--warning)' : 'var(--danger)'}">${a.score}</td>
                                    <td>${gradeTag(a.grade)}</td>
                                    <td style="max-width:180px;font-size:12px">${a.issues}</td>
                                    <td style="max-width:180px;font-size:12px">${a.suggestion}</td>
                                    <td>${a.status === '已完成' ? '<span class="tag tag-green">已完成</span>' : '<span class="tag tag-yellow">改进中</span>'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ===== Data Upload =====
    function renderDataUpload() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>数据上传与验证</h1>
                    <p>管理供应商绿色数据上传流程与数据验证审核</p>
                </div>
                <button class="btn btn-primary">+ 新增上传记录</button>
            </div>

            <div class="stats-grid" style="margin-bottom:20px">
                <div class="stat-card">
                    <div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>验证通过</h4><div class="stat-value">${MOCK_DATA.dataUploads.filter(d => d.verifyStatus === '验证通过').length}</div></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>待验证</h4><div class="stat-value">${MOCK_DATA.dataUploads.filter(d => d.verifyStatus === '待验证').length}</div></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>验证不通过</h4><div class="stat-value">${MOCK_DATA.dataUploads.filter(d => d.verifyStatus === '验证不通过').length}</div></div>
                </div>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>上传 ID</th><th>供应商</th><th>上传周期</th><th>上传时间</th><th>关联指标</th><th>数据值</th><th>附件</th><th>验证状态</th><th>验证意见</th></tr>
                        </thead>
                        <tbody>
                            ${MOCK_DATA.dataUploads.map(d => `
                                <tr>
                                    <td style="font-family:monospace;font-size:12px">${d.id}</td>
                                    <td style="font-weight:500;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.supplierName}</td>
                                    <td><span class="tag tag-gray">${d.cycle}</span></td>
                                    <td>${d.time}</td>
                                    <td style="font-size:12px">${d.indicator}</td>
                                    <td style="font-weight:600">${d.value}</td>
                                    <td><a class="action-link">${d.file}</a></td>
                                    <td>${verifyTag(d.verifyStatus)}</td>
                                    <td style="max-width:180px;font-size:12px">${d.opinion || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ===== Monitoring =====
    function renderMonitoring() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>实时监控与预警</h1>
                    <p>追踪核心绿色指标变化趋势，自动触发预警机制</p>
                </div>
                <button class="btn btn-primary">+ 新增监控</button>
            </div>

            <div class="stats-grid" style="margin-bottom:20px">
                <div class="stat-card">
                    <div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>正常</h4><div class="stat-value" style="color:var(--primary)">${MOCK_DATA.monitoring.filter(m => m.alertStatus === '正常').length}</div></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>预警</h4><div class="stat-value" style="color:var(--warning)">${MOCK_DATA.monitoring.filter(m => m.alertStatus === '预警').length}</div></div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg></div>
                    <div class="stat-info"><h4>异常</h4><div class="stat-value" style="color:var(--danger)">${MOCK_DATA.monitoring.filter(m => m.alertStatus === '异常').length}</div></div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:16px">
                ${MOCK_DATA.monitoring.map(m => {
                    const color = m.alertStatus === '正常' ? '#10B981' : m.alertStatus === '预警' ? '#F59E0B' : '#EF4444';
                    return `
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3 style="font-size:14px">${m.indicator}</h3>
                                <p style="font-size:12px;color:var(--text-muted);margin-top:2px">${m.supplierName}</p>
                            </div>
                            ${alertTag(m.alertStatus)}
                        </div>
                        <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:12px">
                            <span style="font-size:28px;font-weight:700;color:${color}">${m.currentValue}</span>
                            <span style="font-size:12px;color:var(--text-muted)">${m.unit}</span>
                            <span style="font-size:11px;margin-left:auto;color:var(--text-muted)">阈值: ${m.threshold} ${m.unit}</span>
                        </div>
                        <div style="height:60px">${svgLineChart(m.trend, 360, 60, color)}</div>
                        <div style="display:flex;justify-content:space-between;margin-top:8px">
                            <span style="font-size:10px;color:var(--text-muted)">近6个周期趋势</span>
                            <a class="action-link">查看详情</a>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
    }

    // ===== Targets =====
    function renderTargets() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>绿色目标管理</h1>
                    <p>Tier1-Tier2 绿色目标制定、分解、跟踪与评估</p>
                </div>
                <button class="btn btn-primary">+ 新增目标</button>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>目标 ID</th><th>供应商</th><th>目标层级</th><th>类型</th><th>关联指标</th><th>目标值</th><th>当前值</th><th>进度</th><th>周期</th><th>状态</th></tr>
                        </thead>
                        <tbody>
                            ${MOCK_DATA.targets.map(t => `
                                <tr>
                                    <td style="font-family:monospace;font-size:12px">${t.id}</td>
                                    <td style="font-weight:500;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.supplierName}</td>
                                    <td><span class="tag ${t.tierAttr.includes('Tier2') ? 'tag-purple' : 'tag-blue'}" style="font-size:10px">${t.tierAttr}</span></td>
                                    <td style="font-size:12px">${t.type}</td>
                                    <td style="font-size:12px">${t.indicator}</td>
                                    <td style="font-weight:600;font-size:12px">${t.targetValue}</td>
                                    <td style="font-size:12px">${t.currentValue}</td>
                                    <td style="min-width:100px">${progressBar(t.progress)}</td>
                                    <td style="font-size:12px">${t.period}</td>
                                    <td>${t.status === '进行中' ? '<span class="tag tag-blue">进行中</span>' : t.status === '已完成' ? '<span class="tag tag-green">已完成</span>' : '<span class="tag tag-red">未达标</span>'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ===== Training =====
    function renderTraining() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>培训与反馈</h1>
                    <p>管理绿色能力培训全流程及供应商反馈处理</p>
                </div>
                <button class="btn btn-primary">+ 新增培训</button>
            </div>

            <div class="tabs">
                <button class="tab active">培训记录</button>
                <button class="tab">反馈管理</button>
            </div>

            <div class="card" style="padding:0">
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>培训 ID</th><th>培训主题</th><th>培训对象</th><th>形式</th><th>时间</th><th>讲师</th><th>时长</th><th>参与人数</th><th>效果评估</th></tr>
                        </thead>
                        <tbody>
                            ${MOCK_DATA.trainings.map(t => `
                                <tr>
                                    <td style="font-family:monospace;font-size:12px">${t.id}</td>
                                    <td style="font-weight:500">${t.topic}</td>
                                    <td><span class="tag tag-blue">${t.target}</span></td>
                                    <td><span class="tag tag-gray">${t.form}</span></td>
                                    <td style="font-size:12px">${t.time}</td>
                                    <td style="font-size:12px">${t.lecturer}</td>
                                    <td>${t.duration}</td>
                                    <td style="font-weight:600">${t.participants || '-'}</td>
                                    <td>${t.rating === '优秀' ? '<span class="tag tag-green">优秀</span>' : t.rating === '良好' ? '<span class="tag tag-blue">良好</span>' : t.rating === '一般' ? '<span class="tag tag-yellow">一般</span>' : '<span class="tag tag-gray">${t.rating}</span>'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // ===== Communication =====
    function renderCommunication() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>沟通记录</h1>
                    <p>Tier1-Tier2 绿色管理沟通全流程记录与行动跟踪</p>
                </div>
                <button class="btn btn-primary">+ 新增沟通记录</button>
            </div>

            <div style="display:flex;flex-direction:column;gap:16px">
                ${MOCK_DATA.communications.map(c => `
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>${c.topic}</h3>
                                <p style="font-size:12px;color:var(--text-muted);margin-top:2px">${c.id} · ${c.time} · ${c.form}</p>
                            </div>
                            <a class="action-link">编辑</a>
                        </div>
                        <div class="detail-grid" style="margin-bottom:16px">
                            <div class="detail-item"><label>沟通双方</label><span>${c.parties}</span></div>
                            <div class="detail-item"><label>参与人</label><span>${c.participants}</span></div>
                        </div>
                        <div style="margin-bottom:12px">
                            <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">沟通要点</label>
                            <p style="font-size:13px;margin-top:4px">${c.summary}</p>
                        </div>
                        <div style="margin-bottom:16px;padding:12px;background:var(--primary-light);border-radius:var(--radius)">
                            <label style="font-size:11px;font-weight:600;color:var(--primary-dark)">沟通结论</label>
                            <p style="font-size:13px;margin-top:4px;color:var(--primary-dark)">${c.conclusion}</p>
                        </div>
                        ${c.actionItems.length ? `
                            <div>
                                <label style="font-size:11px;font-weight:600;color:var(--text-muted);text-transform:uppercase">行动事项</label>
                                <div class="table-wrapper" style="margin-top:8px">
                                    <table class="data-table">
                                        <thead><tr><th>责任人</th><th>行动内容</th><th>期限</th><th>状态</th></tr></thead>
                                        <tbody>
                                            ${c.actionItems.map(a => `
                                                <tr>
                                                    <td>${a.person}</td>
                                                    <td>${a.action}</td>
                                                    <td>${a.deadline}</td>
                                                    <td>${a.status === '已完成' ? '<span class="tag tag-green">已完成</span>' : '<span class="tag tag-blue">进行中</span>'}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ===== Questionnaire =====
    function renderQuestionnaire() {
        pageContent.innerHTML = `
            <div class="page-header">
                <div>
                    <h1>问卷与调研</h1>
                    <p>标准化绿色能力调研问卷管理与反馈处理</p>
                </div>
                <button class="btn btn-primary">+ 创建问卷</button>
            </div>

            <div class="tabs">
                <button class="tab active">问卷管理</button>
                <button class="tab">反馈处理</button>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px">
                ${MOCK_DATA.questionnaires.map(q => {
                    const statusColor = q.status === '已截止' ? 'tag-gray' : q.status === '回收中' ? 'tag-blue' : 'tag-green';
                    const rateNum = parseFloat(q.rate);
                    return `
                    <div class="card">
                        <div class="card-header">
                            <span class="tag ${statusColor}">${q.status}</span>
                            <span style="font-family:monospace;font-size:11px;color:var(--text-muted)">${q.id}</span>
                        </div>
                        <h3 style="font-size:15px;margin-bottom:8px">${q.topic}</h3>
                        <div class="detail-grid" style="margin-bottom:12px">
                            <div class="detail-item"><label>调研对象</label><span>${q.target}</span></div>
                            <div class="detail-item"><label>发放人</label><span>${q.releaser}</span></div>
                            <div class="detail-item"><label>发放时间</label><span>${q.releaseTime}</span></div>
                            <div class="detail-item"><label>截止时间</label><span>${q.deadline}</span></div>
                        </div>
                        <div style="margin-bottom:8px">
                            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                                <span style="font-size:12px;color:var(--text-secondary)">回收进度</span>
                                <span style="font-size:12px;font-weight:600">${q.received}/${q.sent} (${q.rate})</span>
                            </div>
                            ${progressBar(Math.round(rateNum))}
                        </div>
                        <div style="display:flex;gap:8px;margin-top:12px">
                            <button class="btn btn-sm btn-outline" style="flex:1">查看详情</button>
                            <button class="btn btn-sm btn-secondary" style="flex:1">分析结果</button>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
    }

    init();
})();
