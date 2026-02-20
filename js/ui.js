/* ============================================
   Zicy UI — Rendering & Interaction Logic
   Version 2 — Tag filtering, sorting, polish
   ============================================ */

// ---- Global State ----
let currentView = 'dashboard';
let currentTab = 'tracked';
let pendingDeleteTagId = null;
let pendingActivatePromptId = null;
let tagEditorPromptId = null;
let tagEditorPendingTags = [];
let assignTagId = null;
let viewTagId = null;
let tagSortField = 'name';
let tagSortDir = 'asc';
let trackedFilterTags = [];
let selectedTagId = null;
let manageSectionPages = { draft: 1, active: 1, paused: 1 };
const MANAGE_PAGE_SIZE = 20;

// ---- View Switching ----
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + view).classList.add('active');
    document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.toggle('active', el.dataset.view === view);
    });
    if (view === 'dashboard') UI.renderDashboard();
    if (view === 'prompt-manager') {
        switchTab(currentTab);
    }
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(el => {
        el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'tracked') UI.renderTrackedTab();
    if (tab === 'manage') UI.renderManageTab();
    if (tab === 'tags') UI.renderTagsTab();
}

// ---- Toast ----
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type + ' visible';
    setTimeout(() => t.classList.remove('visible'), 2500);
}

// ---- Helpers ----
function getTagName(tagId) {
    const tag = ZicyState.getTagById(tagId);
    return tag ? tag.name : 'Unknown';
}

function renderTagPills(promptTags, readonly = true) {
    return promptTags.map(pt => {
        const name = getTagName(pt.tagId);
        const cls = pt.status === 'new' ? 'new' : 'existing';
        return readonly
            ? `<span class="tag-pill ${cls}">${name}</span>`
            : `<span class="tag-pill ${cls}">${name}<span class="tag-delete-btn" onclick="UI.removeEditorTag('${pt.tagId}')">&times;</span></span>`;
    }).join('');
}

function renderCompactTagPills(promptTags, max = 2) {
    if (!promptTags || promptTags.length === 0) return '';
    const visible = promptTags.slice(0, max);
    const overflow = promptTags.length - max;
    let html = '<div class="tag-pills-compact">';
    visible.forEach(pt => {
        html += `<span class="tag-pill-compact">${getTagName(pt.tagId)}</span>`;
    });
    if (overflow > 0) {
        const allNames = promptTags.map(pt => getTagName(pt.tagId)).join(', ');
        html += `<span class="tag-pill-overflow" title="${allNames}">+${overflow}</span>`;
    }
    html += '</div>';
    return html;
}

function metricBadgeClass(val, thresholds) {
    if (typeof val === 'string') val = parseFloat(val);
    if (val >= thresholds[0]) return 'green';
    if (val >= thresholds[1]) return 'orange';
    return 'red';
}

function platformLabel(key) {
    const map = { chatgpt: 'ChatGPT', gemini: 'Gemini', perplexity: 'Perplexity', googleAI: 'Google AI Mode', aiOverview: 'AI Overview' };
    return map[key] || key;
}

function platformIconClass(key) {
    const map = { chatgpt: 'chatgpt', gemini: 'gemini', perplexity: 'perplexity', googleAI: 'google-ai', aiOverview: 'ai-overview' };
    return map[key] || '';
}

function platformInitial(key) {
    const map = { chatgpt: 'C', gemini: 'G', perplexity: 'P', googleAI: 'AI', aiOverview: 'AO' };
    return map[key] || '?';
}

// ---- UI Namespace ----
const UI = {
    // =========== DASHBOARD ===========
    renderDashboard() {
        const activePrompts = ZicyState.getActivePrompts();
        const metrics = ZicyState.getAggregatedMetrics(activePrompts);
        document.getElementById('dash-prompt-count').textContent = activePrompts.length;

        // 3-column metric layout
        const mc = document.getElementById('dash-metrics');
        const sovPct = parseFloat(metrics.avgSov);
        const sovAngle = (sovPct / 100) * 180;
        const sovRad = (sovAngle * Math.PI) / 180;
        const sovX = 60 + 45 * Math.cos(Math.PI - sovRad);
        const sovY = 65 - 45 * Math.sin(Math.PI - sovRad);
        const sovLargeArc = sovAngle > 180 ? 1 : 0;

        mc.innerHTML = `
        <div class="dash-metric-stack">
            <div class="dash-metric-card">
                <svg class="metric-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <div class="dash-metric-label">Brand Mention Coverage</div>
                <div class="dash-metric-value">${metrics.brandMentionDisplay}</div>
                <div class="dash-metric-trend positive">↑ 5.2%</div>
            </div>
            <div class="dash-metric-card">
                <svg class="metric-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <div class="dash-metric-label">Website Citation Coverage</div>
                <div class="dash-metric-value">${metrics.citationDisplay}</div>
                <div class="dash-metric-trend warning">↓ 1.3%</div>
            </div>
        </div>
        <div class="sov-gauge-card">
            <svg class="metric-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div class="sov-gauge-label">Share of Voice</div>
            <svg class="sov-gauge-svg" viewBox="0 0 120 80">
                <path d="M 15 65 A 45 45 0 0 1 105 65" fill="none" stroke="#E2E8F0" stroke-width="8" stroke-linecap="round"/>
                <path d="M 15 65 A 45 45 0 ${sovLargeArc} 1 ${sovX.toFixed(1)} ${sovY.toFixed(1)}" fill="none" stroke="#16A34A" stroke-width="8" stroke-linecap="round"/>
            </svg>
            <div class="sov-gauge-value">${metrics.avgSov}%</div>
            <div class="dash-metric-trend positive">↑ 2.4%</div>
        </div>
        <div class="perf-trends-card">
            <svg class="metric-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <div class="perf-trends-header">
                <div class="perf-trends-title">Performance Trends</div>
                <div class="perf-trends-toggle">
                    <button class="active">Weekly</button>
                    <button>Monthly</button>
                </div>
            </div>
            <div class="perf-trend-chart-area">
                ${[65, 55, 72, 48, 60, 45, 70, 50, 62, 58, 75, 52].map(h => `<div class="perf-trend-bar" style="height:${h}%"></div>`).join('')}
            </div>
            <div class="perf-trends-stats">
                <div class="perf-trend-stat"><span class="perf-trend-stat-label">Share of Voice</span><span class="perf-trend-stat-value">${metrics.avgSov}%</span></div>
                <div class="perf-trend-stat"><span class="perf-trend-stat-label">Avg Position</span><span class="perf-trend-stat-value">${metrics.avgPosition}</span></div>
                <div class="perf-trend-stat"><span class="perf-trend-stat-label">Citations</span><span class="perf-trend-stat-value">${metrics.citationDisplay}</span></div>
            </div>
        </div>`;

        // Competitors — color-coded cells
        const competitors = ZicyState.getCompetitors();
        const cb = document.getElementById('competitive-body');
        cb.innerHTML = competitors.map(c => `
        <tr class="${c.you ? 'comp-you-row' : ''}">
            <td>${c.name} ${c.you ? '<span class="comp-you-badge">You</span>' : ''}</td>
            <td class="center comp-cell-bmc">${c.brandMention}</td>
            <td class="center comp-cell-ranking">${c.avgRanking}</td>
            <td class="center comp-cell-citation">${c.citations}</td>
            <td class="center comp-cell-sov">${c.sov}</td>
        </tr>`).join('');

        // Individual Prompts
        this.renderDashPrompts(ZicyState.getActivePrompts());
    },

    renderDashPrompts(prompts) {
        const body = document.getElementById('dash-prompts-body');
        let html = '';
        prompts.forEach(p => {
            if (!p.responses) return;
            const r = p.responses;
            html += `<tr>
        <td><button class="expand-btn" onclick="UI.toggleRow(this, '${p.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button></td>
        <td class="prompt-text">${p.text}${renderCompactTagPills(p.tags)}</td>
        <td class="center"><span class="metric-badge blue">${r.brandMentionCoverage}</span></td>
        <td class="center">${r.avgPosition}</td>
        <td class="center"><span class="metric-badge ${metricBadgeClass(parseFloat(r.sov), [30, 15])}">${r.sov}</span></td>
        <td class="center">—</td>
        <td class="center">—</td>
        <td class="center"><span class="metric-badge blue">${r.citationCoverage}</span></td>
      </tr>`;
            // Sub-rows (hidden by default)
            const platforms = ['chatgpt', 'gemini', 'perplexity', 'googleAI', 'aiOverview'];
            platforms.forEach(pk => {
                const pd = r.platforms[pk];
                html += `<tr class="sub-row hidden" data-parent="${p.id}">
          <td></td>
          <td><span class="platform-icon ${platformIconClass(pk)}">${platformInitial(pk)}</span> ${platformLabel(pk)}</td>
          <td></td>
          <td class="center">${pd.mentioned ? '<span class="citation-yes">Yes</span>' : '<span class="citation-no">No</span>'}</td>
          <td class="center">${pd.position || '—'}</td>
          <td class="center">${pd.sov}</td>
          <td class="center">${pd.yourBrandMentions}</td>
          <td class="center">${pd.totalBrandMentions}</td>
          <td class="center">${pd.cited ? '<span class="citation-yes">Yes</span>' : '<span class="citation-no">No</span>'}</td>
        </tr>`;
            });
        });

        // Totals
        const metrics = ZicyState.getAggregatedMetrics(prompts);
        html += `<tr class="totals-row">
      <td></td><td>Total (${prompts.length} prompts)</td><td></td>
      <td class="center">${metrics.brandMentionDisplay}</td>
      <td class="center">${metrics.avgPosition}</td>
      <td class="center">${metrics.avgSov}%</td>
      <td class="center">—</td><td class="center">—</td>
      <td class="center">${metrics.citationDisplay}</td>
    </tr>`;
        body.innerHTML = html;
    },

    toggleRow(btn, promptId) {
        btn.classList.toggle('expanded');
        document.querySelectorAll(`tr[data-parent="${promptId}"]`).forEach(r => r.classList.toggle('hidden'));
    },

    // =========== TRACKED PROMPTS TAB ===========
    renderTrackedTab() {
        const allActive = ZicyState.getActivePrompts();
        const search = (document.getElementById('tracked-search')?.value || '').toLowerCase();

        // Apply tag filter (OR logic)
        let filtered;
        if (trackedFilterTags.length > 0) {
            filtered = ZicyState.filterPromptsByTags(trackedFilterTags);
        } else {
            filtered = allActive;
        }

        // Apply text search
        if (search) {
            filtered = filtered.filter(p => p.text.toLowerCase().includes(search));
        }

        // Recalculate metrics for filtered subset
        const metrics = ZicyState.getAggregatedMetrics(filtered);

        // Render tag filter checkboxes inside dropdown
        this.renderTagFilterCheckboxes();

        // Update tag filter trigger label
        const label = document.getElementById('tag-filter-label');
        const trigger = document.querySelector('.tag-filter-trigger');
        if (trackedFilterTags.length > 0) {
            label.textContent = `${trackedFilterTags.length} tag${trackedFilterTags.length > 1 ? 's' : ''} selected`;
            trigger.classList.add('has-filters');
        } else {
            label.textContent = 'Filter by tag';
            trigger.classList.remove('has-filters');
        }

        // Filter note
        const filterNoteEl = document.getElementById('tracked-filter-note');
        if (filterNoteEl) {
            filterNoteEl.innerHTML = trackedFilterTags.length > 0
                ? `<div class="filter-active-note">Showing ${filtered.length} of ${allActive.length} prompts (filtered by ${trackedFilterTags.length} tag${trackedFilterTags.length > 1 ? 's' : ''})</div>`
                : '';
        }

        // Stats with info badges
        document.getElementById('tracked-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-info-badge" title="Total tracked prompts">i</div>
        <div class="stat-card-icon orange"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
        <div class="stat-card-label">Brand Mention Coverage</div>
        <div class="stat-card-value">${metrics.brandMentionDisplay}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-info-badge" title="Average share of voice">i</div>
        <div class="stat-card-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
        <div class="stat-card-label">Share of Voice</div>
        <div class="stat-card-value">${metrics.avgSov}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-info-badge" title="Website citation rate">i</div>
        <div class="stat-card-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></div>
        <div class="stat-card-label">Website Citation Coverage</div>
        <div class="stat-card-value">${metrics.citationDisplay}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-info-badge" title="Average ranking position">i</div>
        <div class="stat-card-icon teal"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg></div>
        <div class="stat-card-label">Average Ranking</div>
        <div class="stat-card-value">${metrics.avgPosition}</div>
      </div>
    `;

        // Prompts table
        const tbody = document.getElementById('tracked-body');
        let html = '';
        filtered.forEach(p => {
            if (!p.responses) return;
            const r = p.responses;
            html += `<tr>
        <td><button class="expand-btn" onclick="UI.toggleRow(this, '${p.id}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button></td>
        <td class="prompt-text">${p.text}${renderCompactTagPills(p.tags)}</td>
        <td class="center"><span class="metric-badge blue">${r.brandMentionCoverage}</span></td>
        <td class="center">${r.avgPosition}</td>
        <td class="center"><span class="metric-badge ${metricBadgeClass(parseFloat(r.sov), [30, 15])}">${r.sov}</span></td>
        <td class="center">—</td>
        <td class="center">—</td>
        <td class="center"><span class="metric-badge blue">${r.citationCoverage}</span></td>
      </tr>`;
            // Sub-rows
            const platforms = ['chatgpt', 'gemini', 'perplexity', 'googleAI', 'aiOverview'];
            platforms.forEach(pk => {
                const pd = r.platforms[pk];
                html += `<tr class="sub-row hidden" data-parent="${p.id}">
          <td></td>
          <td><span class="platform-icon ${platformIconClass(pk)}">${platformInitial(pk)}</span> ${platformLabel(pk)}</td>
          <td></td>
          <td class="center">${pd.mentioned ? '<span class="citation-yes">Yes</span>' : '<span class="citation-no">No</span>'}</td>
          <td class="center">${pd.position || '—'}</td>
          <td class="center">${pd.sov}</td>
          <td class="center">${pd.yourBrandMentions}</td>
          <td class="center">${pd.totalBrandMentions}</td>
          <td class="center">${pd.cited ? '<span class="citation-yes">Yes</span>' : '<span class="citation-no">No</span>'}</td>
        </tr>`;
            });
        });

        // Totals
        html += `<tr class="totals-row">
      <td></td><td>Total (${filtered.length} prompts)</td><td></td>
      <td class="center">${metrics.brandMentionDisplay}</td>
      <td class="center">${metrics.avgPosition}</td>
      <td class="center">${metrics.avgSov}%</td>
      <td class="center">—</td><td class="center">—</td>
      <td class="center">${metrics.citationDisplay}</td>
    </tr>`;

        if (filtered.length === 0) {
            html = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state-title">No prompts match your filter</div><div class="empty-state-desc">Try removing some tag filters or adjusting your search.</div></div></td></tr>`;
        }

        tbody.innerHTML = html;
    },

    // ---- Tag Filter Dropdown for Tracked Tab ----
    toggleTagFilterDropdown() {
        const panel = document.getElementById('tag-filter-panel');
        panel.classList.toggle('open');
    },

    renderTagFilterCheckboxes() {
        const container = document.getElementById('tag-filter-checkboxes');
        if (!container) return;
        const tags = ZicyState.getConfirmedTags().filter(t => t.promptCount > 0);
        container.innerHTML = tags.map(t => {
            const checked = trackedFilterTags.includes(t.id) ? 'checked' : '';
            return `<label class="tag-filter-checkbox-item">
                <input type="checkbox" ${checked} onchange="UI.toggleTrackedTagFilter('${t.id}')">
                <span>${t.name}</span>
                <span class="tag-filter-count">${t.promptCount}</span>
            </label>`;
        }).join('');
    },

    toggleTrackedTagFilter(tagId) {
        const idx = trackedFilterTags.indexOf(tagId);
        if (idx >= 0) {
            trackedFilterTags.splice(idx, 1);
        } else {
            trackedFilterTags.push(tagId);
        }
        this.renderTrackedTab();
    },

    clearTrackedTagFilters() {
        trackedFilterTags = [];
        document.getElementById('tag-filter-panel').classList.remove('open');
        this.renderTrackedTab();
    },

    // =========== MANAGE PROMPTS TAB ===========
    renderManageTab() {
        const counts = ZicyState.getCounts();
        const search = (document.getElementById('manage-search')?.value || '').toLowerCase();

        // Status filters
        document.getElementById('manage-filters').innerHTML = `
      <button class="status-pill active" onclick="UI.renderManageTab()">All <span class="count">${counts.total}</span></button>
      <button class="status-pill">Draft <span class="count">${counts.drafts}</span></button>
      <button class="status-pill">Active <span class="count">${counts.active}</span></button>
      <button class="status-pill">Paused <span class="count">${counts.paused}</span></button>
    `;

        // Draft Section
        this.renderManageSection('draft', 'Draft', ZicyState.getPrompts('draft'), search);
        // Active Section
        this.renderManageSection('active', 'Active', ZicyState.getPrompts('active'), search);
        // Paused Section
        this.renderManageSection('paused', 'Paused', ZicyState.getPrompts('paused'), search);
    },

    renderManageSection(state, label, prompts, search) {
        const filtered = search ? prompts.filter(p => p.text.toLowerCase().includes(search)) : prompts;
        const container = document.getElementById(`manage-${state}-section`);
        const iconCls = state === 'active' ? 'active' : state === 'paused' ? 'paused' : 'draft';
        const icons = { draft: '\u{1F4DD}', active: '\u2705', paused: '\u23F8\uFE0F' };


        if (state === 'paused') {
            container.innerHTML = `
        <div class="section-header" onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('.section-toggle').classList.toggle('collapsed')">
          <div class="section-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div>
          <div class="section-icon ${iconCls}">${icons[state]}</div>
          <div><div class="section-title">${label} (${filtered.length})</div><div class="section-subtitle">Visual only \u2014 paused prompts</div></div>
        </div>
        <div>
          ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-desc">No paused prompts</div></div>' :
                    filtered.map(() => `<div class="skeleton-row">
            <div class="skeleton-bar" style="width:60%;height:14px"></div>
            <div class="skeleton-bar" style="width:20%;height:12px"></div>
          </div>`).join('')}
        </div>`;
            return;
        }

        let rows = filtered.map((p, index) => {
            const tagPills = p.tags.map(pt => {
                const name = getTagName(pt.tagId);
                const cls = pt.status === 'new' ? 'new' : 'existing';
                const tooltip = pt.status === 'new' ? 'AI-suggested tag' : 'Confirmed tag';
                const deleteBtn = `<span class="tag-delete-btn" onclick="UI.removeTagFromPrompt('${p.id}', '${pt.tagId}')" title="Remove tag">\u00D7</span>`;
                return `<span class="tag-pill ${cls}" title="${tooltip}">${name}${deleteBtn}</span>`;
            }).join('');
            const addBtn = p.tags.length < 5 ? `<button class="btn-add-tag" onclick="UI.openTagEditor('${p.id}', this)">+ Add</button>` : '';
            const category = p.category || '—';


            let actions = '';
            if (state === 'draft') {
                actions = `
          <button class="action-btn activate" title="Activate" onclick="UI.startActivate('${p.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></button>
          <button class="action-btn delete" title="Delete" onclick="UI.deletePrompt('${p.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`;
            } else if (state === 'active') {
                actions = `
          <button class="action-btn pause" title="Pause" onclick="UI.pausePrompt('${p.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg></button>
          <button class="action-btn delete" title="Delete" onclick="UI.deletePrompt('${p.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>`;
            }

            return `<tr>
        <td class="prompt-text">${p.text}</td>
        <td><div class="tag-container" style="position:relative">${tagPills}${addBtn}</div></td>
        <td style="color:#64748B;font-size:12px">${category}</td>

        <td><div class="action-btns">${actions}</div></td>
      </tr>`;
        }).join('');

        container.innerHTML = `
      <div class="section-header" onclick="this.nextElementSibling.classList.toggle('hidden');this.querySelector('.section-toggle').classList.toggle('collapsed')">
        <div class="section-toggle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></div>
        <div class="section-icon ${iconCls}">${icons[state]}</div>
        <div><div class="section-title">${label} (${filtered.length})</div></div>
      </div>
      <div>
        ${filtered.length === 0 ? '<div class="empty-state"><div class="empty-state-desc">No ' + label.toLowerCase() + ' prompts</div></div>' :
                `<table class="data-table"><thead><tr>
          <th>Prompt</th><th>Tags</th><th>Category</th><th style="text-align:right">Actions</th>
        </tr></thead><tbody>${rows}</tbody></table>`}
      </div>`;
    },

    // =========== MANAGE TAGS TAB (Two-Panel Layout) ===========
    renderTagsTab() {
        const allTags = ZicyState.getTags().filter(t => t.status === 'confirmed');
        const search = (document.getElementById('tag-search')?.value || '').toLowerCase();
        const filtered = search ? allTags.filter(t => t.name.toLowerCase().includes(search)) : allTags;

        // Sort
        filtered.sort((a, b) => {
            let cmp = 0;
            if (tagSortField === 'name') {
                cmp = a.name.localeCompare(b.name);
            } else if (tagSortField === 'count') {
                cmp = a.promptCount - b.promptCount;
            }
            return tagSortDir === 'asc' ? cmp : -cmp;
        });

        // Summary line
        const stats = ZicyState.getTagStats();
        const summaryEl = document.getElementById('tags-summary');
        if (summaryEl) {
            summaryEl.innerHTML = `<span class="tags-summary-text">${stats.total} tag${stats.total !== 1 ? 's' : ''} \u00B7 ${stats.inUse} in use \u00B7 ${stats.unused} unused</span>`;
        }

        // Render left panel - tag list
        const listItems = document.getElementById('tags-list-items');
        if (listItems) {
            listItems.innerHTML = filtered.map(t => {
                const isUnused = t.promptCount === 0;
                const isSelected = selectedTagId === t.id;
                return `<div class="tags-list-item ${isUnused ? 'unused' : ''} ${isSelected ? 'selected' : ''}" onclick="UI.selectTag('${t.id}')">
                    <span class="tags-list-item-name">${t.name}</span>
                    <span class="tags-list-item-count">${t.promptCount}</span>
                </div>`;
            }).join('');

            if (filtered.length === 0) {
                listItems.innerHTML = '<div style="padding:20px;text-align:center;color:#94A3B8;font-size:13px">No tags found</div>';
            }
        }

        // Render right panel - tag detail
        this.renderTagDetail();
    },

    selectTag(tagId) {
        selectedTagId = tagId;
        this.renderTagsTab();
    },

    renderTagDetail() {
        const detailPanel = document.getElementById('tags-detail-panel');
        if (!detailPanel) return;

        if (!selectedTagId) {
            detailPanel.innerHTML = '<div class="tags-detail-empty">Select a tag to view details</div>';
            return;
        }

        const tag = ZicyState.getTags().find(t => t.id === selectedTagId);
        if (!tag) {
            detailPanel.innerHTML = '<div class="tags-detail-empty">Tag not found</div>';
            selectedTagId = null;
            return;
        }

        // Get assigned prompts
        const assignedPrompts = ZicyState.getActivePrompts().filter(p =>
            p.tags.some(pt => pt.tagId === tag.id)
        );

        let promptsHtml = '';
        if (assignedPrompts.length > 0) {
            promptsHtml = assignedPrompts.map(p =>
                `<div class="tags-detail-prompt-item">
                    <span>${p.text.length > 80 ? p.text.substring(0, 80) + '...' : p.text}</span>
                    <span class="tags-detail-remove-btn" title="Remove from tag" onclick="UI.removeTagFromPrompt('${p.id}', '${tag.id}')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </span>
                </div>`
            ).join('');
        } else {
            promptsHtml = '<div class="tags-detail-no-prompts">No prompts assigned to this tag</div>';
        }

        detailPanel.innerHTML = `
            <div class="tags-detail-header">
                <div class="tags-detail-name">${tag.name}</div>
                <div class="tags-detail-actions">
                    <button class="assign-tag-btn" onclick="UI.showAssignTagModal('${tag.id}')">+ Assign to Prompts</button>
                    <button class="action-btn edit" title="Rename" onclick="UI.startRenameTag('${tag.id}', this)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
                    <button class="action-btn delete" title="Delete" onclick="UI.startDeleteTag('${tag.id}')"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </div>
            <div class="tags-detail-stat">Assigned to <strong>${assignedPrompts.length}</strong> prompt${assignedPrompts.length !== 1 ? 's' : ''}</div>
            <div class="tags-detail-prompts-title">Assigned Prompts</div>
            ${promptsHtml}`;
    },

    createInlineTag() {
        const input = document.getElementById('tags-create-input');
        if (!input) return;
        const name = input.value.trim();
        if (!name) return;
        ZicyState.createTag(name);
        input.value = '';
        this.renderTagsTab();
    },

    sortTags(field) {
        if (tagSortField === field) {
            tagSortDir = tagSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            tagSortField = field;
            tagSortDir = 'asc';
        }
        this.renderTagsTab();
    },

    // ---- Tag CRUD ----
    showCreateTagModal() {
        document.getElementById('create-tag-input').value = '';
        document.getElementById('create-tag-error').classList.add('hidden');
        this.showModal('modal-create-tag');
    },

    createTag() {
        const input = document.getElementById('create-tag-input');
        const errorEl = document.getElementById('create-tag-error');
        const result = ZicyState.createTag(input.value);
        if (!result.success) {
            errorEl.textContent = result.error;
            errorEl.classList.remove('hidden');
            return;
        }
        this.hideModal('modal-create-tag');
        showToast(`Tag "${result.tag.name}" created`);
        this.renderTagsTab();
    },

    startRenameTag(tagId, btn) {
        const tag = ZicyState.getTagById(tagId);
        if (!tag) return;
        const td = btn.closest('tr').querySelector('td');
        const original = td.innerHTML;
        td.innerHTML = `<input type="text" class="inline-edit-input" value="${tag.name}" onkeydown="if(event.key==='Enter')UI.finishRename('${tagId}',this);if(event.key==='Escape'){this.closest('tr').querySelector('td').innerHTML='${original.replace(/'/g, "\\\\'")}';}}" autofocus>`;
        td.querySelector('input').select();
    },

    finishRename(tagId, input) {
        const result = ZicyState.renameTag(tagId, input.value);
        if (!result.success) { showToast(result.error, 'error'); return; }
        showToast(`Tag renamed to "${result.tag.name}"`);
        this.renderTagsTab();
    },

    startDeleteTag(tagId) {
        pendingDeleteTagId = tagId;
        const tag = ZicyState.getTagById(tagId);
        const prompts = ZicyState.getPromptsForTag(tagId);
        document.getElementById('delete-tag-desc').textContent =
            `Are you sure you want to delete "${tag.name}"? This will remove it from ${prompts.length} prompt(s).`;
        document.getElementById('delete-tag-prompts').innerHTML = prompts.length > 0
            ? '<strong>Affected prompts:</strong><br>' + prompts.map(p => '• ' + p.text).join('<br>')
            : '';
        this.showModal('modal-delete-tag');
    },

    confirmDeleteTag() {
        if (!pendingDeleteTagId) return;
        const result = ZicyState.deleteTag(pendingDeleteTagId);
        if (result.success) showToast(`Tag "${result.tag.name}" deleted`);
        pendingDeleteTagId = null;
        this.hideModal('modal-delete-tag');
        this.renderTagsTab();
    },

    // ---- Prompt Tag Assignments ----
    removeTagFromPrompt(promptId, tagId) {
        if (!confirm('Remove this tag?')) return;
        const result = ZicyState.removeTagFromPrompt(promptId, tagId);
        if (result.success) {
            showToast('Tag removed');
            if (currentView === 'dashboard') this.renderDashboard();
            else if (currentTab === 'tracked') this.renderTrackedTab();
            else if (currentTab === 'manage') this.renderManageTab();
        } else {
            showToast(result.error, 'error');
        }
    },

    // ---- Assign Tag Modal ----
    showAssignTagModal(tagId) {
        assignTagId = tagId;
        const tag = ZicyState.getTagById(tagId);
        document.getElementById('assign-tag-title').textContent = `Assign "${tag.name}"`;
        document.getElementById('assign-prompt-search').value = '';
        this.renderAssignPromptList();
        this.showModal('modal-assign-tag');
    },

    hideAssignTagModal() {
        assignTagId = null;
        this.hideModal('modal-assign-tag');
    },

    renderAssignPromptList() {
        if (!assignTagId) return;
        const search = (document.getElementById('assign-prompt-search').value || '').toLowerCase();
        const prompts = ZicyState.getPrompts().filter(p => !p.tags.some(pt => pt.tagId === assignTagId));
        const filtered = search ? prompts.filter(p => p.text.toLowerCase().includes(search)) : prompts;
        const list = document.getElementById('assign-prompt-list');

        if (filtered.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No eligible prompts found</div></div>`;
            return;
        }

        list.innerHTML = filtered.map(p => {
            const atLimit = p.tags.length >= 5;
            return `
            <label class="prompt-select-item" style="${atLimit ? 'opacity:0.5;cursor:not-allowed' : ''}">
                <input type="checkbox" class="prompt-checkbox" value="${p.id}" ${atLimit ? 'disabled' : ''}>
                <div class="prompt-item-text">
                    ${p.text}
                    ${atLimit ? '<span style="color:#DC2626;font-size:11px;margin-left:6px">(Max tags reached)</span>' : ''}
                </div>
            </label>
        `}).join('');
    },

    filterAssignPrompts() {
        this.renderAssignPromptList();
    },

    confirmAssignTag() {
        if (!assignTagId) return;
        const checkboxes = document.querySelectorAll('#assign-prompt-list .prompt-checkbox:checked');
        const promptIds = Array.from(checkboxes).map(cb => cb.value);
        if (promptIds.length === 0) { showToast('No prompts selected', 'error'); return; }

        const result = ZicyState.bulkAddTag(promptIds, assignTagId);
        showToast(`Tag assigned to ${result.successes.length} prompt(s)`);
        this.hideAssignTagModal();
        this.renderTagsTab();
    },

    // ---- View Tagged Prompts Modal ----
    showViewTaggedPromptsModal(tagId) {
        viewTagId = tagId;
        const tag = ZicyState.getTagById(tagId);
        document.getElementById('view-tagged-title').textContent = `Prompts tagged with "${tag.name}"`;
        this.renderViewTaggedList();
        this.showModal('modal-view-tagged-prompts');
    },

    hideViewTaggedPromptsModal() {
        viewTagId = null;
        this.hideModal('modal-view-tagged-prompts');
    },

    renderViewTaggedList() {
        if (!viewTagId) return;
        const prompts = ZicyState.getPromptsForTag(viewTagId);
        const list = document.getElementById('view-tagged-list');

        if (prompts.length === 0) {
            list.innerHTML = `<div class="empty-state"><div class="empty-state-desc">No prompts with this tag</div></div>`;
            return;
        }

        list.innerHTML = prompts.map(p => `
            <div class="prompt-select-item">
                <div class="prompt-item-text">${p.text}</div>
                <div class="remove-tag-from-list-btn" onclick="UI.removeTagFromViewList('${p.id}')" title="Remove tag">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
            </div>
        `).join('');
    },

    removeTagFromViewList(promptId) {
        if (!viewTagId) return;
        ZicyState.removeTagFromPrompt(promptId, viewTagId);
        showToast('Tag removed');
        this.renderViewTaggedList();
        this.renderTagsTab();
    },

    // ---- Tag Editor ----
    openTagEditor(promptId, btnEl) {
        tagEditorPromptId = promptId;
        const prompt = ZicyState.getPromptById(promptId);
        tagEditorPendingTags = prompt.tags.map(pt => ({ ...pt }));
        const editor = document.getElementById('tag-editor');
        const rect = btnEl.getBoundingClientRect();
        editor.style.top = (rect.bottom + window.scrollY + 4) + 'px';
        editor.style.left = (rect.left + window.scrollX) + 'px';
        editor.classList.add('visible');
        document.getElementById('tag-editor-search').value = '';
        this.renderTagEditorCurrent();
        this.filterTagSuggestions();
    },

    closeTagEditor() {
        document.getElementById('tag-editor').classList.remove('visible');
        tagEditorPromptId = null;
        tagEditorPendingTags = [];
    },

    renderTagEditorCurrent() {
        const container = document.getElementById('tag-editor-current');
        container.innerHTML = tagEditorPendingTags.map(pt => {
            const name = getTagName(pt.tagId);
            const cls = pt.status === 'new' ? 'new' : 'existing';
            return `<span class="tag-pill ${cls}">${name} <span class="tag-remove" onclick="UI.removeEditorTag('${pt.tagId}')">×</span></span>`;
        }).join('');
        const warning = document.getElementById('tag-limit-warning');
        warning.classList.toggle('hidden', tagEditorPendingTags.length < 5);
    },

    removeEditorTag(tagId) {
        tagEditorPendingTags = tagEditorPendingTags.filter(pt => pt.tagId !== tagId);
        this.renderTagEditorCurrent();
        this.filterTagSuggestions();
    },

    filterTagSuggestions() {
        const search = (document.getElementById('tag-editor-search')?.value || '').toLowerCase().trim();
        const tags = ZicyState.getConfirmedTags();
        const currentIds = tagEditorPendingTags.map(pt => pt.tagId);
        const available = tags.filter(t => !currentIds.includes(t.id) && (!search || t.name.toLowerCase().includes(search)));
        const suggestions = document.getElementById('tag-editor-suggestions');
        const atLimit = tagEditorPendingTags.length >= 5;

        suggestions.innerHTML = available.map(t =>
            `<div class="tag-suggestion-item ${atLimit ? 'at-limit' : ''}" onclick="${atLimit ? '' : `UI.addEditorTag('${t.id}')`}" style="${atLimit ? 'opacity:0.5;cursor:not-allowed' : ''}">
        ${t.name} <span class="count">${t.promptCount} prompts</span>
      </div>`
        ).join('');

        // Show create option if search doesn't match existing
        if (search && !tags.some(t => t.name.toLowerCase() === search) && !atLimit) {
            const wordCount = search.split(/\s+/).length;
            if (wordCount <= 4) {
                suggestions.innerHTML += `<div class="tag-editor-create" onclick="UI.createEditorTag('${search.replace(/'/g, "\\\\'")}')">+ Create "${search}"</div>`;
            }
        }
    },

    addEditorTag(tagId) {
        if (tagEditorPendingTags.length >= 5) return;
        tagEditorPendingTags.push({ tagId, status: 'existing' });
        this.renderTagEditorCurrent();
        this.filterTagSuggestions();
    },

    createEditorTag(name) {
        const result = ZicyState.createTag(name);
        if (!result.success) { showToast(result.error, 'error'); return; }
        if (tagEditorPendingTags.length >= 5) { showToast('Max 5 tags', 'error'); return; }
        tagEditorPendingTags.push({ tagId: result.tag.id, status: 'new' });
        document.getElementById('tag-editor-search').value = '';
        this.renderTagEditorCurrent();
        this.filterTagSuggestions();
        showToast(`Tag "${result.tag.name}" created`);
    },

    saveTagEditor() {
        if (!tagEditorPromptId) return;
        const prompt = ZicyState.getPromptById(tagEditorPromptId);
        // Remove all existing tags from this prompt
        const existingTagIds = prompt.tags.map(pt => pt.tagId);
        existingTagIds.forEach(tid => ZicyState.removeTagFromPrompt(tagEditorPromptId, tid));
        // Add pending tags
        tagEditorPendingTags.forEach(pt => {
            ZicyState.addTagToPrompt(tagEditorPromptId, pt.tagId, pt.status === 'new');
        });
        this.closeTagEditor();
        showToast('Tags updated');
        this.renderManageTab();
    },

    // ---- Prompt Actions ----
    startActivate(promptId) {
        pendingActivatePromptId = promptId;
        const prompt = ZicyState.getPromptById(promptId);
        const newTags = prompt.tags.filter(pt => pt.status === 'new');
        let desc = 'Activate this prompt?';
        if (newTags.length > 0) {
            desc += ` This will confirm ${newTags.length} new tag(s): ${newTags.map(pt => getTagName(pt.tagId)).join(', ')}`;
        }
        document.getElementById('activate-desc').textContent = desc;
        this.showModal('modal-activate');
    },

    confirmActivate() {
        if (!pendingActivatePromptId) return;
        const result = ZicyState.activatePrompt(pendingActivatePromptId);
        if (result.success) showToast('Prompt activated' + (result.newTagsCreated > 0 ? ` — ${result.newTagsCreated} tag(s) confirmed` : ''));
        pendingActivatePromptId = null;
        this.hideModal('modal-activate');
        this.renderManageTab();
    },

    pausePrompt(promptId) {
        ZicyState.pausePrompt(promptId);
        showToast('Prompt paused');
        this.renderManageTab();
    },

    deletePrompt(promptId) {
        ZicyState.deletePrompt(promptId);
        showToast('Prompt deleted');
        this.renderManageTab();
    },

    generatePrompt() {
        ZicyState.generatePrompt();
        showToast('Prompt generated');
        this.renderManageTab();
    },

    showCustomPromptModal() {
        document.getElementById('custom-prompt-input').value = '';
        document.getElementById('custom-prompt-error').classList.add('hidden');
        this.showModal('modal-custom-prompt');
    },

    addCustomPrompt() {
        const input = document.getElementById('custom-prompt-input');
        const errorEl = document.getElementById('custom-prompt-error');
        const result = ZicyState.addCustomPrompt(input.value);
        if (!result.success) { errorEl.textContent = result.error; errorEl.classList.remove('hidden'); return; }
        this.hideModal('modal-custom-prompt');
        showToast('Custom prompt added');
        this.renderManageTab();
    },

    // ---- Modals ----
    showModal(id) {
        document.getElementById(id).classList.add('visible');
    },

    hideModal(id) {
        document.getElementById(id).classList.remove('visible');
    },
};

// ---- Close popups on outside click ----
document.addEventListener('click', (e) => {
    const editor = document.getElementById('tag-editor');
    if (editor.classList.contains('visible') && !editor.contains(e.target) && !e.target.classList.contains('btn-add-tag')) {
        UI.closeTagEditor();
    }
    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay.visible').forEach(overlay => {
        if (e.target === overlay) overlay.classList.remove('visible');
    });
});

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
    UI.renderDashboard();
});
