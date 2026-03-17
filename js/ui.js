/* ============================================
   Zicy UI — Rendering & Interaction Logic
   Version 2 — Tag filtering, sorting, polish
   ============================================ */

// ---- Key Topics static competitor data (per-topic, does not respond to tag filter) ----
// Each entry: topic name → [[competitor, pct], [competitor, pct], [competitor, pct]]
const KT_COMPETITOR_DATA = {
    'Data Security':      [['Equinix', 58], ['NTT Ltd.', 52], ['TM One', 44]],
    'Reliability':        [['Equinix', 61], ['NTT Ltd.', 55], ['Vantage Data Centers', 43]],
    'Performance':        [['Equinix', 64], ['NTT Ltd.', 50], ['Vantage Data Centers', 39]],
    'Compliance':         [['NTT Ltd.', 68], ['Equinix', 55], ['TM One', 45]],
    'Scalability':        [['Equinix', 71], ['Vantage Data Centers', 57], ['NTT Ltd.', 45]],
    'Ease of Setup':      [['TM One', 49], ['Vantage Data Centers', 38], ['Bridge Data Centres', 31]],
    'Customer Support':   [['TM One', 65], ['Bridge Data Centres', 52], ['Vantage Data Centers', 44]],
    'Cloud Connectivity': [['Equinix', 73], ['NTT Ltd.', 61], ['Vantage Data Centers', 48]],
    'Backup Speed':       [['NTT Ltd.', 75], ['Equinix', 63], ['Vantage Data Centers', 37]],
    'Pricing & Value':    [['TM One', 71], ['Bridge Data Centres', 61], ['Vantage Data Centers', 48]],
    'Integrations':       [['Equinix', 44], ['NTT Ltd.', 39], ['TM One', 31]],
    'AI Performance':     [['Equinix', 68], ['NTT Ltd.', 55], ['Vantage Data Centers', 42]],
    'Onboarding':         [['TM One', 75], ['Bridge Data Centres', 58], ['Vantage Data Centers', 45]],
};

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
    if (view === 'competitive') UI.renderCompetitive();
    if (view === 'key-topics') UI.renderKeyTopics();
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

// ---- Competitive Landscape Static Data ----
const COMP_BRAND_COLORS = {
    'Aims': '#1E40AF',
    'Equinix': '#065F46',
    'TM One': '#5B21B6',
    'Vantage Data Centers': '#92400E',
    'Bridge Data Centres': '#075985',
    'NTT Ltd.': '#9D174D'
};

const COMP_PROFILES = {
    'Aims': {
        positiveDescriptors: [
            { label: 'Reliable infrastructure', pct: 72 },
            { label: 'Enterprise-grade uptime', pct: 65 },
            { label: 'Strong local presence', pct: 58 },
            { label: 'Responsive support', pct: 47 },
            { label: 'Compliance-ready', pct: 41 }
        ],
        neutralDescriptors: [
            { label: 'Mid-market pricing', pct: 55 },
            { label: 'Regional focus', pct: 48 },
            { label: 'Standard connectivity options', pct: 34 }
        ],
        negativeDescriptors: [
            { label: 'Limited global footprint', pct: 28 },
            { label: 'Fewer tier-1 certifications', pct: 19 }
        ]
    },
    'Equinix': {
        positiveDescriptors: [
            { label: 'Global network reach', pct: 84 },
            { label: 'Carrier-neutral ecosystem', pct: 79 },
            { label: 'Strong uptime record', pct: 73 },
            { label: 'Enterprise trust', pct: 67 },
            { label: 'Extensive peering options', pct: 61 }
        ],
        neutralDescriptors: [
            { label: 'Premium pricing tier', pct: 62 },
            { label: 'Complex procurement', pct: 41 },
            { label: 'Large enterprise focus', pct: 37 }
        ],
        negativeDescriptors: [
            { label: 'High cost for SMBs', pct: 45 },
            { label: 'Slow onboarding', pct: 22 }
        ]
    },
    'TM One': {
        positiveDescriptors: [
            { label: 'Strong government ties', pct: 68 },
            { label: 'Local regulatory expertise', pct: 62 },
            { label: 'Competitive pricing', pct: 54 },
            { label: 'Managed service depth', pct: 46 }
        ],
        neutralDescriptors: [
            { label: 'Telco-owned infra', pct: 58 },
            { label: 'Domestic focus', pct: 51 },
            { label: 'Bundled service model', pct: 39 }
        ],
        negativeDescriptors: [
            { label: 'Limited international reach', pct: 38 },
            { label: 'Slower innovation pace', pct: 29 },
            { label: 'Less carrier diversity', pct: 21 }
        ]
    },
    'Vantage Data Centers': {
        positiveDescriptors: [
            { label: 'Hyperscale capacity', pct: 77 },
            { label: 'Rapid build-out', pct: 70 },
            { label: 'Sustainability credentials', pct: 63 },
            { label: 'Strong CapEx flexibility', pct: 55 }
        ],
        neutralDescriptors: [
            { label: 'Hyperscale-first model', pct: 64 },
            { label: 'Long contract terms', pct: 47 },
            { label: 'Campus-style deployments', pct: 38 }
        ],
        negativeDescriptors: [
            { label: 'Less suited to enterprise retail', pct: 33 },
            { label: 'Limited colocation ecosystem', pct: 25 }
        ]
    },
    'Bridge Data Centres': {
        positiveDescriptors: [
            { label: 'ASEAN regional footprint', pct: 66 },
            { label: 'Modern facility design', pct: 59 },
            { label: 'Competitive power pricing', pct: 52 },
            { label: 'Growing connectivity options', pct: 44 }
        ],
        neutralDescriptors: [
            { label: 'Regional challenger brand', pct: 53 },
            { label: 'Newer market entrant', pct: 44 },
            { label: 'Mid-size footprint', pct: 36 }
        ],
        negativeDescriptors: [
            { label: 'Smaller partner ecosystem', pct: 31 },
            { label: 'Less established enterprise trust', pct: 24 }
        ]
    },
    'NTT Ltd.': {
        positiveDescriptors: [
            { label: 'Global scale and reach', pct: 81 },
            { label: 'End-to-end managed services', pct: 74 },
            { label: 'Strong enterprise relationships', pct: 68 },
            { label: 'Broad compliance portfolio', pct: 60 }
        ],
        neutralDescriptors: [
            { label: 'Enterprise-only positioning', pct: 59 },
            { label: 'Integrated stack approach', pct: 46 },
            { label: 'Premium service tier', pct: 39 }
        ],
        negativeDescriptors: [
            { label: 'Complex vendor landscape', pct: 36 },
            { label: 'High baseline cost', pct: 27 }
        ]
    }
};

const COMP_HEAT_DATA = {
    coverage: {
        rows: [
            { tag: 'AI Data Center',           aims: 62, equinix: 71, tmone: 38, vantage: 55, bridge: 41, ntt: 66, avg: 56 },
            { tag: 'Disaster Recovery',         aims: 58, equinix: 64, tmone: 47, vantage: 39, bridge: 35, ntt: 61, avg: 51 },
            { tag: 'Managed Services',          aims: 71, equinix: 58, tmone: 69, vantage: 32, bridge: 44, ntt: 74, avg: 58 },
            { tag: 'Colocation Services',       aims: 75, equinix: 82, tmone: 61, vantage: 57, bridge: 63, ntt: 70, avg: 68 },
            { tag: 'Cybersecurity',             aims: 44, equinix: 39, tmone: 52, vantage: 28, bridge: 31, ntt: 55, avg: 42 },
            { tag: 'Data Center',               aims: 80, equinix: 88, tmone: 72, vantage: 76, bridge: 67, ntt: 83, avg: 78 },
            { tag: 'Cloud Connectivity',        aims: 55, equinix: 79, tmone: 48, vantage: 43, bridge: 38, ntt: 62, avg: 54 },
            { tag: 'Managed Service Data Center', aims: 68, equinix: 54, tmone: 65, vantage: 31, bridge: 40, ntt: 71, avg: 55 },
            { tag: 'Malaysia',                  aims: 83, equinix: 42, tmone: 88, vantage: 36, bridge: 58, ntt: 47, avg: 59 },
            { tag: 'LLM Infrastructure',        aims: 38, equinix: 51, tmone: 24, vantage: 61, bridge: 29, ntt: 44, avg: 41 },
            { tag: 'Enterprise',                aims: 69, equinix: 77, tmone: 63, vantage: 58, bridge: 51, ntt: 79, avg: 66 },
            { tag: 'Compliance',                aims: 61, equinix: 66, tmone: 70, vantage: 45, bridge: 42, ntt: 68, avg: 59 }
        ],
        footer: { aims: 64, equinix: 64, tmone: 58, vantage: 47, bridge: 45, ntt: 65 }
    },
    sov: {
        rows: [
            { tag: 'AI Data Center',           aims: 18, equinix: 22, tmone: 11, vantage: 16, bridge: 12, ntt: 21, avg: 17 },
            { tag: 'Disaster Recovery',         aims: 21, equinix: 24, tmone: 17, vantage: 14, bridge: 13, ntt: 22, avg: 19 },
            { tag: 'Managed Services',          aims: 26, equinix: 21, tmone: 25, vantage: 12, bridge: 16, ntt: 27, avg: 21 },
            { tag: 'Colocation Services',       aims: 28, equinix: 31, tmone: 23, vantage: 21, bridge: 24, ntt: 26, avg: 26 },
            { tag: 'Cybersecurity',             aims: 16, equinix: 14, tmone: 19, vantage: 10, bridge: 11, ntt: 20, avg: 15 },
            { tag: 'Data Center',               aims: 30, equinix: 33, tmone: 27, vantage: 29, bridge: 25, ntt: 31, avg: 29 },
            { tag: 'Cloud Connectivity',        aims: 20, equinix: 29, tmone: 18, vantage: 16, bridge: 14, ntt: 23, avg: 20 },
            { tag: 'Managed Service Data Center', aims: 25, equinix: 20, tmone: 24, vantage: 11, bridge: 15, ntt: 26, avg: 20 },
            { tag: 'Malaysia',                  aims: 31, equinix: 16, tmone: 33, vantage: 13, bridge: 22, ntt: 17, avg: 22 },
            { tag: 'LLM Infrastructure',        aims: 14, equinix: 19, tmone: 9, vantage: 23, bridge: 11, ntt: 16, avg: 15 },
            { tag: 'Enterprise',                aims: 26, equinix: 29, tmone: 24, vantage: 22, bridge: 19, ntt: 30, avg: 25 },
            { tag: 'Compliance',                aims: 23, equinix: 25, tmone: 26, vantage: 17, bridge: 16, ntt: 26, avg: 22 }
        ],
        footer: { aims: 23, equinix: 24, tmone: 21, vantage: 17, bridge: 16, ntt: 24 }
    },
    sentiment: {
        rows: [
            { tag: 'AI Data Center',           aims: 71, equinix: 68, tmone: 59, vantage: 63, bridge: 57, ntt: 66, avg: 64 },
            { tag: 'Disaster Recovery',         aims: 74, equinix: 71, tmone: 63, vantage: 58, bridge: 55, ntt: 70, avg: 65 },
            { tag: 'Managed Services',          aims: 76, equinix: 65, tmone: 72, vantage: 54, bridge: 60, ntt: 75, avg: 67 },
            { tag: 'Colocation Services',       aims: 78, equinix: 81, tmone: 68, vantage: 70, bridge: 66, ntt: 74, avg: 73 },
            { tag: 'Cybersecurity',             aims: 63, equinix: 61, tmone: 67, vantage: 52, bridge: 55, ntt: 66, avg: 61 },
            { tag: 'Data Center',               aims: 80, equinix: 84, tmone: 73, vantage: 75, bridge: 69, ntt: 79, avg: 77 },
            { tag: 'Cloud Connectivity',        aims: 69, equinix: 77, tmone: 61, vantage: 64, bridge: 58, ntt: 71, avg: 67 },
            { tag: 'Managed Service Data Center', aims: 75, equinix: 63, tmone: 71, vantage: 51, bridge: 59, ntt: 76, avg: 66 },
            { tag: 'Malaysia',                  aims: 82, equinix: 57, tmone: 79, vantage: 52, bridge: 66, ntt: 60, avg: 66 },
            { tag: 'LLM Infrastructure',        aims: 61, equinix: 65, tmone: 50, vantage: 68, bridge: 54, ntt: 63, avg: 60 },
            { tag: 'Enterprise',                aims: 77, equinix: 79, tmone: 68, vantage: 69, bridge: 63, ntt: 80, avg: 73 },
            { tag: 'Compliance',                aims: 74, equinix: 72, tmone: 75, vantage: 63, bridge: 60, ntt: 73, avg: 70 }
        ],
        footer: { aims: 73, equinix: 70, tmone: 67, vantage: 62, bridge: 60, ntt: 71 }
    }
};

// ---- UI Namespace ----
const UI = {
    // =========== DASHBOARD ===========
    renderDashboard() {
        // Get tag-filtered active prompts (respects trackedFilterTags)
        let activePrompts;
        if (trackedFilterTags.length > 0) {
            activePrompts = ZicyState.filterPromptsByTags(trackedFilterTags);
        } else {
            activePrompts = ZicyState.getActivePrompts();
        }
        const allActive = ZicyState.getActivePrompts();
        const metrics   = ZicyState.getAggregatedMetrics(activePrompts);
        const allMetrics = ZicyState.getAggregatedMetrics(allActive);

        // Update prompt counts in headers
        ['dash-prompt-count','dash-prompt-count-2','dash-prompt-count-3'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = activePrompts.length;
        });

        // ── 1. METRICS BAND SCOPE HEADER ──────────────────────────
        const scopeEl = document.getElementById('dash-metrics-scope');
        if (scopeEl) {
            if (trackedFilterTags.length > 0) {
                const tagNames = trackedFilterTags.map(id => `<span class="metrics-scope-tag">${getTagName(id)}</span>`);
                const sep = `<span class="metrics-scope-sep">+</span>`;
                scopeEl.innerHTML = `
                    <div class="metrics-scope">
                        ${tagNames.join(sep)}
                        <span class="metrics-scope-count">${activePrompts.length} prompts</span>
                    </div>
                    <span class="metrics-all-link">Viewing ${trackedFilterTags.length} tag${trackedFilterTags.length > 1 ? 's' : ''} — <a onclick="UI.clearDashTagFilter()">Switch to All Tags</a></span>`;
            } else {
                scopeEl.innerHTML = `
                    <div class="metrics-scope">
                        <span class="metrics-scope-tag">All Tags</span>
                        <span class="metrics-scope-count">${activePrompts.length} prompts</span>
                    </div>`;
            }
        }

        // ── 2. METRICS GRID — 4 cards ──────────────────────────────
        const bmcPct   = parseFloat(metrics.brandMentionCoverage);
        const citPct   = parseFloat(metrics.citationCoverage);
        const sovPct   = parseFloat(metrics.avgSov);
        const avgRank  = parseFloat(metrics.avgPosition);

        const bmcColor  = bmcPct  >= 60 ? 'green' : bmcPct  >= 40 ? 'amber' : '';
        const sovColor  = sovPct  >= 20 ? 'green' : sovPct  >= 10 ? 'amber' : '';
        const rankColor = avgRank <= 2   ? 'green' : avgRank <= 3.5 ? 'amber' : 'red';

        const gridEl = document.getElementById('dash-metrics-grid');
        if (gridEl) {
            gridEl.innerHTML = `
            <div class="metric-card">
                <div class="metric-label">Brand Mention Coverage <i class="info-icon">i</i></div>
                <div class="metric-value ${bmcColor}">${bmcPct.toFixed(1)}%</div>
                <div class="metric-sub">${metrics.brandMentionDisplay} responses</div>
                <div class="metric-delta">↑ +4.2% vs prior period</div>
                ${trackedFilterTags.length > 0 ? `<div class="metric-vs">All tags: ${allMetrics.brandMentionCoverage}%</div>` : ''}
            </div>
            <div class="metric-card">
                <div class="metric-label">Website Citation Coverage <i class="info-icon">i</i></div>
                <div class="metric-value">${citPct.toFixed(1)}%</div>
                <div class="metric-sub">${metrics.citationDisplay} responses</div>
                <div class="metric-delta">↑ +2.8% vs prior period</div>
                ${trackedFilterTags.length > 0 ? `<div class="metric-vs">All tags: ${allMetrics.citationCoverage}%</div>` : ''}
            </div>
            <div class="metric-card">
                <div class="metric-label">Share of Voice <i class="info-icon">i</i></div>
                <div class="metric-value ${sovColor}">${sovPct.toFixed(1)}%</div>
                <div class="metric-sub">Of all brand mentions in scope</div>
                <div class="metric-delta">↑ +1.4% vs prior period</div>
                ${trackedFilterTags.length > 0 ? `<div class="metric-vs">All tags: ${allMetrics.avgSov}%</div>` : ''}
            </div>
            <div class="metric-card">
                <div class="metric-label">Average Ranking <i class="info-icon">i</i></div>
                <div class="metric-value ${rankColor}">#${avgRank.toFixed(1)}</div>
                <div class="metric-sub">Avg position when mentioned</div>
                <div class="metric-delta neutral">↑ Improved vs prior period</div>
                ${trackedFilterTags.length > 0 ? `<div class="metric-vs">All tags: #${allMetrics.avgPosition}</div>` : ''}
            </div>`;
        }

        // ── 3. PLATFORM RADAR BADGES ───────────────────────────────
        const radar = ZicyState.getPlatformRadar();
        const radarBadgesEl = document.getElementById('dash-radar-badges');
        if (radarBadgesEl) {
            radarBadgesEl.innerHTML = [
                ['Google AI', radar.googleAI],
                ['AI Overviews', radar.aiOverview],
                ['ChatGPT',   radar.chatgpt],
                ['Perplexity',radar.perplexity],
                ['Gemini',    radar.gemini],
            ].map(([label, val]) => `<span class="radar-badge">${label} <strong>${val}%</strong></span>`).join('');
        }

        // ── 4. TREND CHART ─────────────────────────────────────────
        const weeks   = ['W6','W7','W8','W9','W10','W11','W12','W13'];
        const sovData = [7.8, 8.0, 8.2, 7.9, 8.1, 8.4, 8.5, 8.6];
        const bmData  = [820, 750, 900, 680, 810, 890, 850, 880];
        const mkPts = (data) => {
            const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
            return data.map((v, i) => ({
                x: parseFloat((i / (data.length - 1) * 640 + 30).toFixed(1)),
                y: parseFloat((150 - (v - min) / range * 120).toFixed(1))
            }));
        };
        const sovPts = mkPts(sovData);
        const bmPts  = mkPts(bmData);
        const ptsStr = pts => pts.map(p => `${p.x},${p.y}`).join(' ');
        const trendChartEl = document.getElementById('dash-trend-chart');
        if (trendChartEl) {
            trendChartEl.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 700 170" preserveAspectRatio="none">
                <line x1="0" y1="20"  x2="700" y2="20"  stroke="#E2E8F0" stroke-width="1"/>
                <line x1="0" y1="65"  x2="700" y2="65"  stroke="#E2E8F0" stroke-width="1"/>
                <line x1="0" y1="110" x2="700" y2="110" stroke="#E2E8F0" stroke-width="1"/>
                <line x1="0" y1="155" x2="700" y2="155" stroke="#E2E8F0" stroke-width="1"/>
                <text x="6" y="19"  font-size="10" fill="#94A3B8">100</text>
                <text x="6" y="64"  font-size="10" fill="#94A3B8">75</text>
                <text x="6" y="109" font-size="10" fill="#94A3B8">50</text>
                <text x="6" y="154" font-size="10" fill="#94A3B8">25</text>
                <polyline points="${ptsStr(sovPts)}" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linejoin="round"/>
                <polyline points="${ptsStr(bmPts)}"  fill="none" stroke="#F87171" stroke-width="2"   stroke-linejoin="round" stroke-dasharray="6 3"/>
                ${weeks.map((w, i) => {
                    const x = (i / (weeks.length - 1) * 640 + 30).toFixed(1);
                    return `<text x="${x}" y="168" font-size="10" fill="#94A3B8" text-anchor="middle">${w}</text>`;
                }).join('')}
            </svg>`;
        }
        const trendFooterEl = document.getElementById('dash-trend-footer');
        if (trendFooterEl) {
            trendFooterEl.innerHTML = `
            <div class="trend-legend-item"><span class="trend-legend-dot" style="background:#10B981"></span> Share of Voice</div>
            <div class="trend-legend-item"><span class="trend-legend-dot" style="background:#F87171"></span> Brand Mentions</div>
            <div style="margin-left:auto;font-size:11px;color:#94A3B8">AIMS · Dec 25 – Jan 23</div>`;
        }

        // ── 5. COMPETITIVE TABLE ───────────────────────────────────
        const competitors = ZicyState.getCompetitorMetrics(activePrompts);
        const rankColorClass = (r) => r <= 2.5 ? 'text-green' : r <= 3.5 ? 'text-amber' : 'text-red';
        const cb = document.getElementById('competitive-body');
        if (cb) {
            cb.innerHTML = competitors.map(c => `
            <tr class="${c.you ? 'you-row' : ''}">
                <td>${c.name}${c.you ? ' <span class="badge-you">YOU</span>' : ''}</td>
                <td class="center col-cov">${c.brandMention}</td>
                <td class="center col-cov ${rankColorClass(c.avgRanking)}">#${c.avgRanking.toFixed(1)}</td>
                <td class="center col-cov">${c.citations}</td>
                <td class="center col-cov">${c.sov}</td>
                <td class="center col-per ${c.sentimentClass}">${c.sentiment}</td>
                <td class="col-per text-muted" style="font-size:12px">${c.descriptors}</td>
            </tr>`).join('');
        }

        // ── 6. BRAND SENTIMENT ─────────────────────────────────────
        const sent = ZicyState.getBrandSentiment(activePrompts);
        const sentEl = document.getElementById('dash-sentiment-inner');
        if (sentEl) {
            const posRows = sent.positiveDescriptors.map(d => `
                <div class="perception-row">
                    <span class="perception-keyword">${d.word}</span>
                    <span class="perception-count">${d.count}</span>
                    <span class="perception-share pos">${d.share}</span>
                </div>`).join('');
            const negRows = sent.negativeDescriptors.map(d => `
                <div class="perception-row">
                    <span class="perception-keyword">${d.word}</span>
                    <span class="perception-count">${d.count}</span>
                    <span class="perception-share neg">${d.share}</span>
                </div>`).join('');
            sentEl.innerHTML = `
            <div class="sentiment-col">
                <div class="sentiment-score-big">${sent.score}</div>
                <div class="sentiment-tier-badge">${sent.tier}</div>
                <div class="sentiment-context">Your brand · ${sent.responses} responses</div>
                <div class="dist-label" style="margin-top:16px">Sentiment breakdown</div>
                <div class="dist-bar">
                    <div class="dist-seg" style="width:${sent.pos}%;background:#22C55E"></div>
                    <div class="dist-seg" style="width:${sent.neu}%;background:#E2E8F0"></div>
                    <div class="dist-seg" style="width:${sent.neg}%;background:#F87171"></div>
                </div>
                <div class="dist-legend">
                    <div class="dist-legend-item"><span class="dist-swatch" style="background:#22C55E"></span>Positive ${sent.pos}%</div>
                    <div class="dist-legend-item"><span class="dist-swatch" style="background:#E2E8F0"></span>Neutral ${sent.neu}%</div>
                    <div class="dist-legend-item"><span class="dist-swatch" style="background:#F87171"></span>Negative ${sent.neg}%</div>
                </div>
            </div>
            <div class="sentiment-col">
                <div class="perception-col-label pos">Positive descriptors</div>
                <div class="perception-table-hdr">
                    <span class="perception-hdr-keyword">Descriptor</span>
                    <span class="perception-hdr-meta">Mentions</span>
                    <span class="perception-hdr-meta">Share</span>
                </div>
                ${posRows}
            </div>
            <div class="sentiment-col">
                <div class="perception-col-label neg">Negative descriptors</div>
                <div class="perception-table-hdr">
                    <span class="perception-hdr-keyword">Descriptor</span>
                    <span class="perception-hdr-meta">Mentions</span>
                    <span class="perception-hdr-meta">Share</span>
                </div>
                ${negRows}
            </div>`;
        }

        // ── 7. KEY TOPICS ──────────────────────────────────────────
        const kt = ZicyState.getKeyTopics(activePrompts);
        const ktEl = document.getElementById('dash-kt-grid');
        const totalTopics = kt.leaders.length + kt.battles.length + kt.blinds.length;
        const ktSubEl = document.getElementById('dash-kt-subtitle');
        if (ktSubEl) ktSubEl.textContent = `${totalTopics} topics detected across all prompts`;

        const renderKtBucket = (bucket, type) => {
            const colorMap = { leaders: 'fill-green pct-green', battles: 'fill-amber pct-amber', blinds: 'fill-gray pct-gray' };
            const [fillCls, pctCls] = colorMap[type].split(' ');
            const headerCls = { leaders: 'leaders', battles: 'battles', blinds: 'blinds' }[type];
            const headerLabel = { leaders: 'Brand Leaders', battles: 'Battlegrounds', blinds: 'Blind Spots' }[type];
            const leftRows = bucket.map(t => `
                <div class="topic-row-l">
                    <span class="topic-name">${t.name}</span>
                    <span class="topic-hits">${t.hits}</span>
                </div>`).join('');
            const rightRows = bucket.map(t => `
                <div class="topic-row-r">
                    <div class="topic-bar-wrap"><div class="topic-bar-fill ${fillCls}" style="width:${t.pct}%"></div></div>
                    <span class="topic-fraction">${t.num}/${t.den}</span>
                    <span class="topic-eq">=</span>
                    <span class="topic-pct ${pctCls}">${t.pct}%</span>
                </div>`).join('');
            return `
            <div>
                <div class="kt-col-header ${headerCls}">
                    <span class="kt-col-label">${headerLabel}</span>
                    <span class="kt-col-count">${bucket.length} Topics</span>
                </div>
                <div class="kt-col-body">
                    <div class="kt-col-left">
                        <div class="kt-mentions-hdr"><span class="kt-sublabel">Mentions</span></div>
                        ${leftRows}
                    </div>
                    <div class="kt-col-right">
                        <div class="kt-sublabel">Your Brand</div>
                        ${rightRows}
                    </div>
                </div>
            </div>`;
        };

        if (ktEl) {
            ktEl.innerHTML = renderKtBucket(kt.leaders, 'leaders') + renderKtBucket(kt.battles, 'battles') + renderKtBucket(kt.blinds, 'blinds');
        }
        const ktMoreEl = document.getElementById('dash-kt-more');
        if (ktMoreEl) {
            ktMoreEl.innerHTML = `Showing all ${totalTopics} topics · <a style="color:#2563EB;cursor:pointer" onclick="switchView('key-topics')">View Key Topics Analysis →</a>`;
        }

        // ── 8. INDIVIDUAL TRACKED PROMPTS ──────────────────────────
        // Platform tabs
        const tabsEl = document.getElementById('dash-platform-tabs');
        if (tabsEl) {
            const platforms = [
                { key: 'all',        label: 'All Platforms' },
                { key: 'chatgpt',    label: 'ChatGPT' },
                { key: 'gemini',     label: 'Gemini' },
                { key: 'perplexity', label: 'Perplexity' },
                { key: 'googleAI',   label: 'Google AI Mode' },
                { key: 'aiOverview', label: 'AI Overview' },
            ];
            tabsEl.innerHTML = platforms.map((p, i) => {
                const count = p.key === 'all' ? activePrompts.filter(pr => pr.responses).length
                    : activePrompts.filter(pr => pr.responses && pr.responses.platforms[p.key]?.mentioned).length;
                const label = p.key === 'all' ? `${p.label} · ${count}` : `${p.label} · ${count}`;
                return `<button class="platform-tab${i === 0 ? ' active' : ''}" onclick="UI.setDashPlatformTab(this)">${label}</button>`;
            }).join('');
        }

        // Table toolbar
        const toolbarEl = document.getElementById('dash-table-toolbar-label');
        if (toolbarEl) {
            const scopeLabel = trackedFilterTags.length > 0
                ? trackedFilterTags.map(id => getTagName(id)).join(', ')
                : 'All prompts';
            toolbarEl.textContent = `Showing ${Math.min(activePrompts.filter(p => p.responses).length, 10)} of ${activePrompts.filter(p => p.responses).length} prompts · ${scopeLabel}`;
        }

        this.renderDashPrompts(activePrompts);
        this.renderDashTagDropdown();
    },

    // ── Tag filter dropdown ────────────────────────────────────────
    toggleDashTagDropdown(event) {
        event.stopPropagation();
        document.getElementById('dash-tag-dropdown')?.classList.toggle('open');
    },

    filterDashTagList(query) {
        const q = query.toLowerCase();
        document.querySelectorAll('#dash-tag-list .action-dropdown-item').forEach(el => {
            el.style.display = el.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    applyDashTagFilter(tagId, checked) {
        if (checked) {
            if (!trackedFilterTags.includes(tagId) && trackedFilterTags.length < 3) {
                trackedFilterTags.push(tagId);
            }
        } else {
            trackedFilterTags = trackedFilterTags.filter(id => id !== tagId);
        }
        this.renderDashboard();
        if (currentView === 'competitive') this.renderCompetitive();
        if (currentView === 'key-topics') this.renderKeyTopics();
        if (currentView === 'prompt-manager') this.renderTrackedTab();
    },

    renderDashTagDropdown() {
        const tags = ZicyState.getTags().filter(t => t.status === 'confirmed');
        const listEl = document.getElementById('dash-tag-list');
        const limitNote = document.getElementById('dash-tag-limit-note');
        const btnLabel = document.getElementById('dash-tag-filter-label');
        const btn = document.getElementById('dash-tag-filter-btn');
        if (!listEl) return;

        const atLimit = trackedFilterTags.length >= 3;
        if (limitNote) limitNote.style.display = atLimit ? 'block' : 'none';

        if (btnLabel) {
            if (trackedFilterTags.length === 0) {
                btnLabel.textContent = 'All Tags';
            } else if (trackedFilterTags.length === 1) {
                const tag = ZicyState.getTagById(trackedFilterTags[0]);
                btnLabel.textContent = tag ? tag.name : '1 tag';
            } else {
                const first = ZicyState.getTagById(trackedFilterTags[0]);
                btnLabel.textContent = `${first ? first.name : ''} +${trackedFilterTags.length - 1}`;
            }
        }
        if (btn) btn.classList.toggle('has-selection', trackedFilterTags.length > 0);

        listEl.innerHTML = tags.map(tag => {
            const selected = trackedFilterTags.includes(tag.id);
            const disabled = atLimit && !selected;
            return `<label class="action-dropdown-item ${selected ? 'selected' : ''} ${disabled ? 'at-limit' : ''}">
                <input type="checkbox" ${selected ? 'checked' : ''} ${disabled ? 'disabled' : ''}
                    onchange="UI.applyDashTagFilter('${tag.id}', this.checked)" onclick="event.stopPropagation()">
                ${tag.name}
            </label>`;
        }).join('');
    },

    showExportToast() {
        showToast('Export started — CSV will download shortly.', 'success');
    },

    setDashPlatformTab(btn) {
        document.querySelectorAll('#dash-platform-tabs .platform-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    clearDashTagFilter() {
        trackedFilterTags = [];
        UI.renderDashboard();
        if (currentView === 'competitive') UI.renderCompetitive();
        if (currentView === 'key-topics') UI.renderKeyTopics();
        if (currentView === 'prompt-manager') UI.renderTrackedTab();
    },

    // =========== KEY TOPICS ANALYSIS ===========
    renderKeyTopics() {
        const activePrompts = trackedFilterTags.length > 0
            ? ZicyState.filterPromptsByTags(trackedFilterTags)
            : ZicyState.getActivePrompts();
        const kt = ZicyState.getKeyTopics(activePrompts);

        // ── Header subtitle ──────────────────────────────────────────
        const scopeText = trackedFilterTags.length > 0
            ? trackedFilterTags.map(id => getTagName(id)).join(', ')
            : 'All Tags';
        const responseCount = activePrompts.filter(p => p.responses).length * 5;
        const subtitleEl = document.getElementById('kt-header-subtitle');
        if (subtitleEl) {
            subtitleEl.innerHTML = `Brand: AIMS &nbsp;|&nbsp; Scope: ${scopeText} &nbsp;|&nbsp; Based on ${responseCount} AI responses`;
        }

        // ── Section A: Treemap ────────────────────────────────────────
        const allTopics = [...kt.leaders, ...kt.battles, ...kt.blinds].sort((a, b) => b.hits - a.hits);
        const treemapEl = document.getElementById('kt-treemap');
        if (treemapEl) {
            if (allTopics.length === 0) {
                treemapEl.innerHTML = '<div style="padding:24px;text-align:center;color:#94A3B8;font-size:13px">No topic data available for this scope.</div>';
            } else {
                const row1 = allTopics.slice(0, 3);
                const row2 = allTopics.slice(3, 6);
                const row3 = allTopics.slice(6);
                const renderRow = (topics) => {
                    if (!topics.length) return '';
                    const rowFlex = topics.reduce((s, t) => s + t.hits, 0);
                    const cells = topics.map(t => {
                        const cls = t.pct >= 60 ? 'tm-owned' : t.pct >= 30 ? 'tm-mixed' : 'tm-gap';
                        return `<div class="tm-cell ${cls}" style="flex:${t.hits}">
                            <div class="tm-cell-name">${t.name}</div>
                            <div class="tm-cell-count">${t.hits} responses</div>
                        </div>`;
                    }).join('');
                    return `<div class="tm-row" style="flex:${rowFlex}">${cells}</div>`;
                };
                treemapEl.innerHTML = renderRow(row1) + renderRow(row2) + renderRow(row3);
            }
        }

        // ── Helpers ───────────────────────────────────────────────────
        const renderCompetitors = (topicName, den) => {
            const comps = KT_COMPETITOR_DATA[topicName];
            if (!comps) return '<span style="color:#94A3B8;font-size:12px">—</span>';
            return `<div class="t-comps-inline">${comps.map((c, i) => {
                const num = Math.round(c[1] * den / 100);
                return (i > 0 ? '<span class="t-ci-sep">·</span>' : '') +
                    `<div class="t-ci"><span class="t-ci-name">${c[0]}</span>&nbsp;<span class="t-ci-frac">${num}/${den}</span>&nbsp;<span class="t-ci-pct">${c[1]}%</span></div>`;
            }).join('')}</div>`;
        };

        const renderYourBrand = (t, fillCls, pctCls) =>
            `<div class="t-rate-inner"><div class="t-rate-bar"><div class="t-rate-fill ${fillCls}" style="width:${t.pct}%"></div></div><span class="t-rate-frac">${t.num}/${t.den}</span><span class="t-rate-pct ${pctCls}">${t.pct}%</span></div>`;

        const renderTable = (topics, fillCls, pctCls, compHeader) => {
            if (topics.length === 0) return '';
            return `<table class="topics-table">
                <colgroup><col style="width:170px"><col style="width:90px"><col style="width:210px"><col></colgroup>
                <thead><tr>
                    <th>Topic</th>
                    <th class="r">Mentions</th>
                    <th>Your Brand</th>
                    <th>${compHeader}</th>
                </tr></thead>
                <tbody>${topics.map(t => `<tr>
                    <td class="t-name">${t.name}</td>
                    <td class="t-mentions">${t.den}</td>
                    <td class="t-rate">${renderYourBrand(t, fillCls, pctCls)}</td>
                    <td>${renderCompetitors(t.name, t.den)}</td>
                </tr>`).join('')}</tbody>
            </table>`;
        };

        const emptyState = (msg) =>
            `<div style="padding:20px 14px;font-size:13px;color:#94A3B8">${msg}</div>`;

        // ── Section B: Brand Leaders ──────────────────────────────────
        const leaders = [...kt.leaders].sort((a, b) => b.pct - a.pct);
        const leadersEl = document.getElementById('kt-leaders-body');
        const leadersBadge = document.getElementById('kt-leaders-badge');
        if (leadersBadge) leadersBadge.textContent = `${leaders.length} topic${leaders.length !== 1 ? 's' : ''}`;
        if (leadersEl) {
            leadersEl.innerHTML = leaders.length > 0
                ? renderTable(leaders, 'fill-green', 'pct-green', 'Closest Competitors')
                : emptyState('No brand-leading topics found in this scope. Your brand may be present but not leading in any tracked topics.');
        }

        // ── Section C: Battlegrounds ──────────────────────────────────
        const battles = [...kt.battles].sort((a, b) => b.pct - a.pct);
        const battlesEl = document.getElementById('kt-battles-body');
        const battlesBadge = document.getElementById('kt-battles-badge');
        if (battlesBadge) battlesBadge.textContent = `${battles.length} topic${battles.length !== 1 ? 's' : ''}`;
        if (battlesEl) {
            battlesEl.innerHTML = battles.length > 0
                ? renderTable(battles, 'fill-amber', 'pct-amber', 'Topic Leaders')
                : emptyState('No battleground topics found in this scope.');
        }

        // ── Section D: Blind Spots (already sorted by hits desc from getKeyTopics) ──
        const blinds = [...kt.blinds]; // keep hits-desc order
        const blindsEl = document.getElementById('kt-blinds-body');
        const blindsBadge = document.getElementById('kt-blinds-badge');
        if (blindsBadge) blindsBadge.textContent = `${blinds.length} topic${blinds.length !== 1 ? 's' : ''}`;
        if (blindsEl) {
            blindsEl.innerHTML = blinds.length > 0
                ? renderTable(blinds, 'fill-gray', 'pct-gray', 'Topic Leaders')
                : emptyState('No blind spots detected — your brand is present in all tracked topics for this scope.');
        }

        this.renderKtTagDropdown();
    },

    // ---- Key Topics Tag Dropdown ----
    renderKtTagDropdown() {
        const list = document.getElementById('kt-tag-list');
        const label = document.getElementById('kt-tag-filter-label');
        const btn = document.getElementById('kt-tag-filter-btn');
        if (!list) return;

        const allTags = ZicyState.getConfirmedTags();
        const searchInput = document.querySelector('#kt-tag-dropdown .action-dropdown-search input');
        const search = (searchInput && (searchInput._searchVal || searchInput.value)) || '';
        const filtered = allTags.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

        list.innerHTML = filtered.map(t => {
            const checked = trackedFilterTags.includes(t.id);
            const disabled = !checked && trackedFilterTags.length >= 3;
            return `<label class="action-dropdown-item ${checked ? 'selected' : ''} ${disabled ? 'at-limit' : ''}" style="${disabled ? 'opacity:0.5;pointer-events:none' : ''}">
                <input type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}
                    onchange="UI.applyDashTagFilter('${t.id}', this.checked)" onclick="event.stopPropagation()">
                ${t.name}
            </label>`;
        }).join('');

        const active = trackedFilterTags.length;
        if (label) label.textContent = active > 0 ? `${active} tag${active > 1 ? 's' : ''} active` : 'All Tags';
        if (btn) btn.classList.toggle('has-selection', active > 0);
        const limitNote = document.getElementById('kt-tag-limit-note');
        if (limitNote) limitNote.style.display = trackedFilterTags.length >= 3 ? 'block' : 'none';
    },

    toggleKtTagDropdown(e) {
        if (e) e.stopPropagation();
        const dd = document.getElementById('kt-tag-dropdown');
        if (dd) dd.classList.toggle('open');
    },

    filterKtTagList(searchVal) {
        const input = document.querySelector('#kt-tag-dropdown .action-dropdown-search input');
        if (input && searchVal !== undefined) input._searchVal = searchVal;
        this.renderKtTagDropdown();
    },

    renderDashPrompts(prompts) {
        const body = document.getElementById('dash-prompts-body');
        if (!body) return;
        let html = '';
        prompts.forEach(p => {
            if (!p.responses) return;
            const r = p.responses;
            const sentScore = r.sentimentScore || 70;
            const sentLabel = sentScore >= 70 ? `<span class="text-green">${sentScore}</span>`
                : sentScore >= 55 ? `<span class="text-amber">${sentScore}</span>`
                : `<span class="text-muted">${sentScore}</span>`;
            // BMC badge
            const [mn, md] = r.brandMentionCoverage.split('/').map(Number);
            const bmcBadgeCls = mn >= md * 0.6 ? 'badge-green' : mn >= md * 0.4 ? 'badge-amber' : 'badge-red';
            const [cn, cd] = r.citationCoverage.split('/').map(Number);
            const citBadgeCls = cn >= cd * 0.6 ? 'badge-green' : cn >= cd * 0.4 ? 'badge-amber' : 'badge-red';
            const rankColor = r.avgPosition <= 2 ? 'text-green' : r.avgPosition <= 3.5 ? 'text-amber' : 'text-red';
            html += `<tr>
                <td class="prompt-text">${p.text}${renderCompactTagPills(p.tags, 3)}</td>
                <td class="center"><span class="${bmcBadgeCls}">${r.brandMentionCoverage}</span></td>
                <td class="center ${rankColor}">#${r.avgPosition}</td>
                <td class="center">${r.sov}</td>
                <td class="center"><span class="${citBadgeCls}">${r.citationCoverage}</span></td>
                <td class="center">${sentLabel}</td>
            </tr>`;
        });

        // Totals row
        const metrics = ZicyState.getAggregatedMetrics(prompts);
        const withSent = prompts.filter(p => p.responses && p.responses.sentimentScore);
        const avgSent = withSent.length > 0 ? Math.round(withSent.reduce((sum, p) => sum + p.responses.sentimentScore, 0) / withSent.length) : 70;
        html += `<tr class="totals-row">
            <td>Totals &amp; Averages (${prompts.length} prompts)</td>
            <td class="center"><strong>${metrics.brandMentionDisplay}</strong></td>
            <td class="center text-green"><strong>#${metrics.avgPosition}</strong></td>
            <td class="center"><strong>${metrics.avgSov}%</strong></td>
            <td class="center"><strong>${metrics.citationDisplay}</strong></td>
            <td class="center"><strong>${avgSent}</strong></td>
        </tr>`;

        body.innerHTML = html;

        // Show label
        const showEl = document.getElementById('dash-table-show-label');
        if (showEl) {
            showEl.textContent = `Showing ${prompts.filter(p => p.responses).length} prompts`;
        }
    },

    toggleRow(btn, promptId) {
        const isExpanding = !btn.classList.contains('expanded');
        btn.classList.toggle('expanded');
        document.querySelectorAll(`tr[data-parent="${promptId}"]`).forEach(r => r.classList.toggle('hidden'));
        // Show all tags when expanded, compact when collapsed
        const parentRow = btn.closest('tr');
        const promptCell = parentRow.querySelector('.prompt-text');
        const prompt = ZicyState.getPromptById(promptId);
        if (prompt && promptCell) {
            const tagsHtml = isExpanding ? renderTagPills(prompt.tags) : renderCompactTagPills(prompt.tags);
            // Replace just the tag pills part
            const existingPills = promptCell.querySelector('.tag-pills-compact, .tag-pills-full');
            if (existingPills) existingPills.remove();
            if (isExpanding) {
                promptCell.insertAdjacentHTML('beforeend', `<div class="tag-pills-full">${tagsHtml}</div>`);
            } else {
                promptCell.insertAdjacentHTML('beforeend', renderCompactTagPills(prompt.tags));
            }
        }
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
          <th>Prompt</th><th>Tags</th><th style="text-align:right">Actions</th>
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
        if (!name) { showToast('Tag name cannot be empty', 'error'); return; }
        const result = ZicyState.createTag(name);
        if (!result.success) {
            showToast(result.error, 'error');
            return;
        }
        input.value = '';
        showToast(`Tag "${result.tag.name}" created`);
        selectedTagId = result.tag.id;
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

    // ---- Trend Period Toggle ----
    setTrendPeriod(btn) {
        btn.closest('.perf-trends-toggle').querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    },

    // =========== COMPETITIVE LANDSCAPE ===========

    renderCompetitive() {
        const activePrompts = trackedFilterTags.length > 0
            ? ZicyState.filterPromptsByTags(trackedFilterTags)
            : ZicyState.getActivePrompts();
        const competitors = ZicyState.getCompetitorMetrics(activePrompts);
        const brand = ZicyState.getBrandSentiment(activePrompts);

        const countEl = document.getElementById('comp-prompt-count');
        if (countEl) countEl.textContent = activePrompts.length;

        this._renderCompTableA(competitors, activePrompts);
        this._renderCompMatrixB(competitors, brand);
        this._renderCompProfilesC(competitors, brand);
        this._renderCompHeatmapD('coverage');
        this.renderCompTagDropdown();
    },

    _renderCompTableA(competitors, activePrompts) {
        const tbody = document.getElementById('comp-table-body');
        const subtitle = document.getElementById('comp-a-subtitle');
        if (!tbody) return;

        const citClass = (val) => {
            const n = parseFloat(val);
            if (isNaN(n)) return '';
            if (n >= 40) return 'text-teal';
            if (n >= 20) return 'text-amber';
            return 'text-red';
        };

        const bmcClass = (val) => {
            const n = parseFloat(val);
            if (isNaN(n)) return '';
            if (n >= 70) return 'text-green';
            if (n >= 40) return 'text-amber';
            return 'text-red';
        };
        const rankClass = (val) => {
            if (!val || val <= 0) return '';
            if (val <= 2.5) return 'text-green';
            if (val <= 3.5) return 'text-amber';
            return 'text-red';
        };

        tbody.innerHTML = competitors.map(c => {
            const sentLabel = c.sentimentClass === 'text-green' ? 'Positive' : c.sentimentClass === 'text-amber' ? 'Neutral' : 'Negative';
            const descriptors = c.descriptors || '—';
            return `
            <tr class="${c.you ? 'you-row' : ''}">
                <td style="white-space:nowrap">
                    <span class="fw-600">${c.name}</span>
                    ${c.you ? ' <span class="badge-you">YOU</span>' : ''}
                </td>
                <td class="cov-col text-right">
                    <span class="cell-primary ${bmcClass(c.brandMention)}">${c.brandMention}</span>
                </td>
                <td class="cov-col text-right">
                    <span class="cell-primary ${rankClass(c.avgRanking)}">${c.avgRanking > 0 ? c.avgRanking.toFixed(1) : '—'}</span>
                </td>
                <td class="cov-col text-right">
                    <span class="cell-primary ${citClass(c.citations)}">${c.citations}</span>
                </td>
                <td class="cov-col text-right">
                    <span class="cell-primary">${c.sov}</span>
                </td>
                <td class="perception-col text-right">
                    <span class="cell-primary ${c.sentimentClass}">${c.sentiment}</span>
                    <span class="cell-secondary">${sentLabel}</span>
                </td>
                <td class="perception-col" style="color:#64748B;font-size:12px;max-width:160px">${descriptors}</td>
            </tr>`;
        }).join('');

        if (subtitle) {
            const tagLabel = trackedFilterTags.length > 0
                ? trackedFilterTags.map(id => { const t = ZicyState.getTagById(id); return t ? t.name : id; }).join(', ')
                : 'All tags';
            subtitle.textContent = `Based on ${activePrompts.length} active prompt${activePrompts.length !== 1 ? 's' : ''} · ${tagLabel}`;
        }
    },

    _renderCompMatrixB(competitors, brand) {
        const wrap = document.getElementById('comp-matrix-svg-wrap');
        const panelBody = document.getElementById('comp-brands-panel-body');
        const strip = document.getElementById('comp-insight-strip');
        if (!wrap) return;

        // Scale: cx = 160 + (cov-30)*4  |  cy = 295 - (sent-40)*6.875
        // Boundary: coverage 50% → cx=240  |  sentiment 60 → cy=158
        const toCX = (cov) => 160 + (cov - 30) * 4;
        const toCY = (sent) => 295 - (sent - 40) * 6.875;

        // Per-brand label placement: above by default, nudge below for crowded spots
        // Use a simple approach: place above if cy > 80, otherwise below
        const dotGroups = competitors.map(c => {
            const covRaw = parseFloat(c.brandMention);
            const cov = isNaN(covRaw) ? 45 : covRaw;
            const sent = c.sentiment || 50;
            const cx = toCX(cov);
            const cy = toCY(sent);
            const color = COMP_BRAND_COLORS[c.name] || '#6B7280';
            const r = c.you ? 8 : 6;
            const labelY = cy > 80 ? cy - 14 : cy + 22;
            const labelColor = c.you ? color : '#475569';
            const labelWeight = c.you ? '700' : '500';
            const escapedName = c.name.replace(/'/g, "\\'");

            let youText = '';
            if (c.you) {
                youText = `<text x="${cx}" y="${cy + 3}" font-size="6" font-weight="700" fill="#FFFFFF" text-anchor="middle">YOU</text>`;
            }

            return `
                <g class="dot-group" onclick="UI.compGoToBrand('${escapedName}')">
                    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
                    ${youText}
                    <text x="${cx}" y="${labelY}" font-size="10" fill="${labelColor}" text-anchor="middle" font-weight="${labelWeight}" font-family="Inter,sans-serif">${c.name}</text>
                </g>`;
        }).join('');

        wrap.innerHTML = `<svg viewBox="0 0 480 325" width="100%" style="overflow:visible; display:block;">

            <!-- Boundary lines -->
            <line x1="40" y1="158" x2="440" y2="158" stroke="#CBD5E1" stroke-width="1"/>
            <text x="444" y="162" font-size="8.5" fill="#94A3B8" font-style="italic" font-family="Inter,sans-serif">Median</text>
            <line x1="240" y1="20" x2="240" y2="295" stroke="#CBD5E1" stroke-width="1"/>

            <!-- Axes -->
            <line x1="40" y1="295" x2="440" y2="295" stroke="#CBD5E1" stroke-width="1.5"/>
            <line x1="40" y1="20"  x2="40"  y2="295" stroke="#CBD5E1" stroke-width="1.5"/>

            <!-- Quadrant corner labels -->
            <text x="50"  y="33"  font-size="8" font-weight="700" fill="#1D4ED8" letter-spacing="0.07em" opacity="0.5" font-family="Inter,sans-serif">HIDDEN GEMS</text>
            <text x="430" y="33"  font-size="8" font-weight="700" fill="#15803D" letter-spacing="0.07em" text-anchor="end" opacity="0.5" font-family="Inter,sans-serif">CHAMPIONS</text>
            <text x="50"  y="288" font-size="8" font-weight="700" fill="#B91C1C" letter-spacing="0.07em" opacity="0.5" font-family="Inter,sans-serif">NEEDS WORK</text>
            <text x="430" y="288" font-size="8" font-weight="700" fill="#92400E" letter-spacing="0.07em" text-anchor="end" opacity="0.5" font-family="Inter,sans-serif">AT RISK</text>

            <!-- Y-axis ticks + labels -->
            <line x1="37" y1="226" x2="40" y2="226" stroke="#CBD5E1" stroke-width="1"/>
            <text x="34" y="229" font-size="9" fill="#94A3B8" text-anchor="end" font-family="Inter,sans-serif">50</text>
            <line x1="37" y1="158" x2="40" y2="158" stroke="#CBD5E1" stroke-width="1"/>
            <text x="34" y="162" font-size="9" fill="#64748B" text-anchor="end" font-weight="600" font-family="Inter,sans-serif">60</text>
            <line x1="37" y1="89"  x2="40" y2="89"  stroke="#CBD5E1" stroke-width="1"/>
            <text x="34" y="93"   font-size="9" fill="#94A3B8" text-anchor="end" font-family="Inter,sans-serif">70</text>
            <line x1="37" y1="20"  x2="40" y2="20"  stroke="#CBD5E1" stroke-width="1"/>
            <text x="34" y="24"   font-size="9" fill="#94A3B8" text-anchor="end" font-family="Inter,sans-serif">80</text>

            <!-- X-axis ticks + labels -->
            <line x1="160" y1="295" x2="160" y2="298" stroke="#CBD5E1" stroke-width="1"/>
            <text x="160" y="308" font-size="9" fill="#94A3B8" text-anchor="middle" font-family="Inter,sans-serif">30%</text>
            <line x1="240" y1="295" x2="240" y2="298" stroke="#CBD5E1" stroke-width="1"/>
            <text x="240" y="308" font-size="9" fill="#64748B" text-anchor="middle" font-weight="600" font-family="Inter,sans-serif">50%</text>
            <line x1="320" y1="295" x2="320" y2="298" stroke="#CBD5E1" stroke-width="1"/>
            <text x="320" y="308" font-size="9" fill="#94A3B8" text-anchor="middle" font-family="Inter,sans-serif">70%</text>
            <line x1="400" y1="295" x2="400" y2="298" stroke="#CBD5E1" stroke-width="1"/>
            <text x="400" y="308" font-size="9" fill="#94A3B8" text-anchor="middle" font-family="Inter,sans-serif">90%</text>

            <!-- Axis titles -->
            <text x="240" y="320" font-size="10" fill="#64748B" text-anchor="middle" font-family="Inter,sans-serif">Brand Mention Coverage →</text>
            <text x="12" y="160" font-size="10" fill="#64748B" text-anchor="middle" transform="rotate(-90 12 160)" font-family="Inter,sans-serif">Avg Sentiment →</text>

            ${dotGroups}
        </svg>`;

        // Brands panel — legend table rows
        if (panelBody) {
            panelBody.innerHTML = competitors.map(c => {
                const color = COMP_BRAND_COLORS[c.name] || '#6B7280';
                const covRaw = parseFloat(c.brandMention);
                const cov = isNaN(covRaw) ? '—' : covRaw.toFixed(0) + '%';
                const youClass = c.you ? 'you-legend' : '';
                const nameCell = c.you
                    ? `<span class="legend-dot-cell"><span class="matrix-legend-dot" style="background:${color}"></span>${c.name} <span class="badge-you" style="margin-left:4px">YOU</span></span>`
                    : `<span class="legend-dot-cell"><span class="matrix-legend-dot" style="background:${color}"></span>${c.name}</span>`;
                return `<tr class="${youClass}" onclick="UI.compGoToBrand('${c.name.replace(/'/g, "\\'")}')" style="cursor:pointer">
                    <td>${nameCell}</td>
                    <td>${c.sentiment}</td>
                    <td>${cov}</td>
                </tr>`;
            }).join('');
        }

        // Insight strip — AIMS quadrant
        if (strip) {
            const aimsComp = competitors.find(c => c.you);
            if (aimsComp) {
                const cov = parseFloat(aimsComp.brandMention) || 45;
                const sent = aimsComp.sentiment || 50;
                let quad, quadClass;
                if (cov >= 50 && sent >= 60) { quad = 'Champions'; quadClass = 'champions'; }
                else if (cov >= 50 && sent < 60) { quad = 'At Risk'; quadClass = 'at-risk'; }
                else if (cov < 50 && sent >= 60) { quad = 'Hidden Gems'; quadClass = 'hidden-gems'; }
                else { quad = 'Needs Work'; quadClass = 'needs-work'; }
                strip.innerHTML = `<span class="ins-label">AIMS is currently positioned in:</span>
                    <span class="ins-quad ${quadClass}">${quad}</span>
                    <span style="color:#4ADE80;margin:0 4px;">·</span>
                    ${cov.toFixed(0)}% coverage &nbsp;·&nbsp; sentiment ${sent} &nbsp;·&nbsp; ranked above median among ${competitors.length} competitors`;
            }
        }
    },

    _renderCompProfilesC(competitors, brand) {
        const list = document.getElementById('comp-brand-list');
        const detail = document.getElementById('comp-brand-detail');
        if (!list) return;

        list.innerHTML = competitors.map(c => `
            <div class="sent-brand-item ${c.you ? 'you' : ''}" onclick="UI.compShowBrand('${c.name.replace(/'/g, "\\'")}', this)">
                <span class="fw-500">${c.name}</span>
                ${c.you ? ' <span class="badge-you">YOU</span>' : ''}
                <span class="text-muted" style="float:right;font-size:12px">${c.sentiment}</span>
            </div>
        `).join('');

        // Auto-select AIMS
        const aimsComp = competitors.find(c => c.you) || competitors[0];
        const aimsEl = list.querySelector('.sent-brand-item.you') || list.querySelector('.sent-brand-item');
        if (aimsEl && aimsComp) {
            aimsEl.classList.add('active');
            this._renderCompBrandDetail(aimsComp.name, aimsComp, brand, detail);
        }
    },

    _renderCompBrandDetail(name, compData, brand, detailEl) {
        if (!detailEl) return;
        const profile = COMP_PROFILES[name];
        if (!profile) { detailEl.innerHTML = '<p class="text-muted">No profile data.</p>'; return; }

        const isYou = compData && compData.you;
        const score = isYou ? brand.score : (compData ? compData.sentiment : 50);

        const barHTML = (arr, cls) => arr.map(d => `
            <div class="desc-bar-wrap">
                <span class="desc-label">${d.label}</span>
                <div class="desc-bar ${cls}" style="width:${d.pct}%"></div>
                <span class="desc-pct">${d.pct}%</span>
            </div>`).join('');

        detailEl.innerHTML = `
            <div class="sent-detail-name ${isYou ? 'you' : ''}">${name}${isYou ? ' <span class="badge-you">YOU</span>' : ''}</div>
            <div class="sent-detail-score">${score} <span class="text-muted" style="font-size:13px">/ 100</span></div>
            <div class="profile-section-label pos">Positive associations</div>
            ${barHTML(profile.positiveDescriptors, '')}
            <div class="profile-section-label neu" style="margin-top:12px">Neutral / contextual</div>
            ${barHTML(profile.neutralDescriptors, 'neu')}
            <div class="profile-section-label neg" style="margin-top:12px">Negative associations</div>
            ${barHTML(profile.negativeDescriptors, 'neg')}
        `;
    },

    compGoToBrand(name) {
        // Switch to section C and select brand
        document.getElementById('comp-section-c').scrollIntoView({ behavior: 'smooth', block: 'start' });
        const items = document.querySelectorAll('#comp-brand-list .sent-brand-item');
        items.forEach(el => {
            if (el.textContent.trim().startsWith(name)) {
                el.click();
            }
        });
    },

    compShowBrand(name, el) {
        // Deactivate all
        document.querySelectorAll('#comp-brand-list .sent-brand-item').forEach(i => i.classList.remove('active'));
        if (el) el.classList.add('active');

        const activePrompts = trackedFilterTags.length > 0
            ? ZicyState.filterPromptsByTags(trackedFilterTags)
            : ZicyState.getActivePrompts();
        const competitors = ZicyState.getCompetitorMetrics(activePrompts);
        const brand = ZicyState.getBrandSentiment(activePrompts);
        const compData = competitors.find(c => c.name === name);
        const detail = document.getElementById('comp-brand-detail');
        this._renderCompBrandDetail(name, compData, brand, detail);
    },

    _renderCompHeatmapD(metric) {
        const data = COMP_HEAT_DATA[metric];
        if (!data) return;
        const tbody = document.getElementById('comp-heatmap-body');
        const tfoot = document.getElementById('comp-heatmap-foot');
        if (!tbody) return;

        const isPercent = (metric === 'coverage' || metric === 'sov');
        const isSent = metric === 'sentiment';

        const heatClass = (val) => {
            if (isSent) {
                if (val >= 70) return 'heat-high';
                if (val >= 55) return 'heat-med';
                return 'heat-low';
            }
            if (isPercent) {
                if (val >= 65) return 'heat-high';
                if (val >= 40) return 'heat-med';
                return 'heat-low';
            }
            return '';
        };

        const fmt = (val) => {
            if (isSent) return val;
            return val + '%';
        };

        tbody.innerHTML = data.rows.map(row => `
            <tr>
                <td class="fw-500" style="font-size:12px">${row.tag}</td>
                <td class="${heatClass(row.aims)} you-col text-center">${fmt(row.aims)}</td>
                <td class="${heatClass(row.equinix)} text-center">${fmt(row.equinix)}</td>
                <td class="${heatClass(row.tmone)} text-center">${fmt(row.tmone)}</td>
                <td class="${heatClass(row.vantage)} text-center">${fmt(row.vantage)}</td>
                <td class="${heatClass(row.bridge)} text-center">${fmt(row.bridge)}</td>
                <td class="${heatClass(row.ntt)} text-center">${fmt(row.ntt)}</td>
                <td class="heat-avg-row text-center fw-600">${fmt(row.avg)}</td>
            </tr>
        `).join('');

        if (tfoot) {
            const f = data.footer;
            const cells = `
                <td class="fw-600">Avg across tags</td>
                <td class="you-col text-center fw-600">${fmt(f.aims)}</td>
                <td class="text-center fw-600">${fmt(f.equinix)}</td>
                <td class="text-center fw-600">${fmt(f.tmone)}</td>
                <td class="text-center fw-600">${fmt(f.vantage)}</td>
                <td class="text-center fw-600">${fmt(f.bridge)}</td>
                <td class="text-center fw-600">${fmt(f.ntt)}</td>
                <td class="text-center fw-600">—</td>
            `;
            tfoot.innerHTML = cells;
        }
    },

    setCompHeatMetric(metric, btn) {
        if (btn && btn.parentElement) {
            btn.parentElement.querySelectorAll('.btn-secondary').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        this._renderCompHeatmapD(metric);
    },

    // ---- Competitive Tag Dropdown ----
    renderCompTagDropdown() {
        const list = document.getElementById('comp-tag-list');
        const label = document.getElementById('comp-tag-filter-label');
        if (!list) return;

        const allTags = ZicyState.getConfirmedTags();
        const searchInput = document.querySelector('#comp-tag-dropdown .action-dropdown-search input');
        const search = (searchInput && (searchInput.value || searchInput._searchVal)) || '';
        const filtered = allTags.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

        list.innerHTML = filtered.map(t => {
            const checked = trackedFilterTags.includes(t.id);
            const disabled = !checked && trackedFilterTags.length >= 3;
            return `<label class="action-dropdown-item ${disabled ? 'at-limit' : ''}" style="${disabled ? 'opacity:0.5;pointer-events:none' : ''}">
                <input type="checkbox" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}
                    onchange="applyDashTagFilter('${t.id}', this.checked)">
                ${t.name}
            </label>`;
        }).join('');

        const active = trackedFilterTags.length;
        if (label) label.textContent = active > 0 ? `${active} tag${active > 1 ? 's' : ''} active` : 'Filter by tag';
        const limitNote = document.getElementById('comp-tag-limit-note');
        if (limitNote) limitNote.style.display = trackedFilterTags.length >= 3 ? 'block' : 'none';
    },

    toggleCompTagDropdown(e) {
        if (e) e.stopPropagation();
        const dd = document.getElementById('comp-tag-dropdown');
        if (dd) dd.classList.toggle('open');
    },

    filterCompTagList(searchVal) {
        // Store search value on the input element, then re-render
        const input = document.querySelector('#comp-tag-dropdown .action-dropdown-search input');
        if (input && searchVal !== undefined) input._searchVal = searchVal;
        this.renderCompTagDropdown();
    },

    submitAddCompetitor() {
        const nameEl = document.getElementById('add-comp-name');
        if (!nameEl || !nameEl.value.trim()) { showToast('Competitor name is required', 'error'); return; }
        this.hideModal('modal-add-competitor');
        showToast(`"${nameEl.value.trim()}" added (demo only — not persisted)`);
        nameEl.value = '';
    },

    // ---- Dev Notes Popup ----
    showCurrentDevNote() {
        // Determine active view and tab to show the right note
        const activeView = document.querySelector('.view-section.active');
        if (!activeView) return;
        if (activeView.id === 'view-dashboard') {
            this.showDevNote('dashboard');
        } else if (activeView.id === 'view-key-topics') {
            this.showDevNote('key-topics');
        } else if (activeView.id === 'view-competitive') {
            this.showDevNote('competitive');
        } else {
            const activeTab = document.querySelector('.tab-content.active');
            const tab = activeTab ? activeTab.id.replace('tab-', '') : 'tracked';
            this.showDevNote(tab);
        }
    },

    showDevNote(tab) {
        const notes = {
            dashboard: {
                title: '📋 Note to Developer — AI Visibility Report (Dashboard)',
                content: `
<h3>Page Structure</h3>
<p>The dashboard has 6 sections, rendered top-to-bottom:</p>
<ol>
<li><strong>Metrics Band</strong> — 4 horizontal metric cards (BMC, Citation Coverage, SoV, Avg Ranking). Dynamically recalculates when a tag filter is active. "vs all tags" reference values shown when filtered.</li>
<li><strong>Platform Coverage + Performance Trends</strong> — Left: SVG radar showing Brand Mention Coverage per platform. Right: weekly/monthly trend chart (SoV + Brand Mentions). Toggle and metric select are cosmetic in the prototype.</li>
<li><strong>Competitive AI Performance</strong> — 7-column table with column group headers (Brand Coverage | Brand Perception). Avg Ranking uses green/amber/red colored text. Avg Sentiment uses the same color classes. "View Full Competitive Analysis →" links to the Competitive Landscape view.</li>
<li><strong>Brand Sentiment</strong> — 3-column layout: score + tier badge + breakdown bar | positive descriptors table | negative descriptors table.</li>
<li><strong>Key Topics</strong> — 3-bucket grid (Brand Leaders green / Battlegrounds amber / Blind Spots gray). Each bucket shows topic name, mention count, bar, fraction, and percentage. "View Key Topics Analysis →" links to the Key Topics view.</li>
<li><strong>Individual Tracked Prompts</strong> — Flat 6-column table (Prompt, BMC, Position, SoV, Website Citation Coverage, Avg Sentiment). Platform tabs at top filter by platform (cosmetic in prototype). Footer shows prompt count and "View full per-platform breakdown in Prompt Manager →" link.</li>
</ol>

<h3>Tag Filter Behavior</h3>
<ul>
<li>Global tag filter (<code>trackedFilterTags</code>) is applied to all prompt-based metrics</li>
<li>When a tag filter is active, the Metrics Band scope header shows active tag names and prompt count</li>
<li>"Switch to All Tags" link in scope header clears the filter</li>
<li>Metrics Band cards show "All tags: X%" reference when filtered</li>
<li>Brand Sentiment and Key Topics are static (not yet tag-filtered — future implementation)</li>
</ul>

<h3>Interactions</h3>
<ul>
<li>Platform tabs in Individual Tracked Prompts — visually switch active tab (no data filtering in prototype)</li>
<li>"View Full Competitive Analysis →" — switches to competitive view</li>
<li>"View Key Topics Analysis →" — switches to key-topics view</li>
<li>"View full per-platform breakdown in Prompt Manager →" — switches to Prompt Manager, Tracked tab</li>
</ul>

<hr>
<h3>Not Shown in Prototype</h3>
<ul>
<li>Real trend chart data from backend — current chart uses static mock polylines</li>
<li>Platform tab filtering on Tracked Prompts table</li>
<li>Tag filter applied to Brand Sentiment and Key Topics sections</li>
<li>Date range selector (Dec 25 – Jan 23 is static)</li>
</ul>
`
            },
            tracked: {
                title: '📋 Note to Developer — Tracked Prompts Tab',
                content: `
<h3>What's Changed</h3>

<h4>1. Tag Filter Dropdown (New)</h4>
<p><strong>Original:</strong> Only platform filter pills existed.</p>
<p><strong>New:</strong> A <strong>"Filter by tag"</strong> dropdown has been added to the right side of the controls row, next to the search bar.</p>
<ul>
<li>Click the dropdown trigger → opens a panel with tag checkboxes</li>
<li>Lists all <strong>confirmed</strong> tags from the tag library</li>
<li>Selecting tags filters the table using <strong>OR logic</strong> — show any prompt with at least one of the selected tags</li>
<li>A "Clear all" button resets the tag filter</li>
<li>When tags are selected, a filter note appears below showing the active filters and count</li>
<li>Tag filter + platform filter + search all work independently together</li>
</ul>

<h4>2. Tag Pills on Prompt Rows (New)</h4>
<p><strong>Original:</strong> Prompts only displayed the prompt text and metric columns.</p>
<p><strong>New:</strong> Each prompt row shows its assigned tag pills next to the prompt text.</p>
<ul>
<li>Tags display as small, compact grey pills</li>
<li><strong>Collapsed row:</strong> First 2 tags shown, remaining as "+N more" indicator</li>
<li><strong>Expanded row:</strong> ALL tags are shown (no truncation)</li>
<li>Tags are read-only on this tab — editing happens on Manage Prompts tab</li>
</ul>

<h4>3. Summary Statistics Recalculate with Filters</h4>
<p><strong>Original:</strong> Summary stats always showed totals for all active prompts.</p>
<p><strong>New:</strong> When a tag filter is applied, the summary statistics at the top recalculate to show metrics for only the filtered subset. Numbers dynamically update as tags are selected/deselected.</p>

<h4>4. Expandable Row — Per-Platform Breakdown (Unchanged)</h4>
<p>Clicking a prompt row still expands to show per-platform breakdown. No changes from original.</p>

<hr>
<h3>Not Shown in Mockup</h3>
<ul>
<li><strong>Loading states</strong> when filters are applied</li>
<li><strong>Empty state</strong> when tag filter returns no matching prompts</li>
<li><strong>Mobile / responsive</strong> behavior for the tag filter dropdown</li>
</ul>
`
            },
            manage: {
                title: '📋 Note to Developer — Manage Prompts Tab',
                content: `
<h3>What's Changed</h3>

<h4>1. Category Column Removed</h4>
<p><strong>Original:</strong> Each prompt row had a "Category" column with an AI-assigned label.</p>
<p><strong>New:</strong> The Category column is <strong>completely removed</strong> from all tables (Draft, Active, Paused). Tags fully replace the old category concept. Table columns are now: <strong>Prompt, Tags, Actions</strong>.</p>

<h4>2. Single Category → Multi-Tag System</h4>
<p><strong>Original:</strong> Each prompt had a single, AI-assigned category.</p>
<p><strong>New:</strong> Each prompt supports <strong>multiple tags</strong> (up to 5). Tags appear as pill-shaped labels:</p>
<ul>
<li><strong>Existing/confirmed tags</strong> — grey with solid border</li>
<li><strong>AI-suggested tags</strong> (draft prompts only) — orange with dashed border</li>
<li>Each tag has a ✕ remove button</li>
<li>An "+ Add" button appears if under 5 tags</li>
</ul>

<h4>3. Inline Tag Editing (New)</h4>
<p><strong>Original:</strong> No way to edit categories.</p>
<p><strong>New:</strong> Click "+ Add" on any prompt to open an inline tag editor popup:</p>
<ul>
<li>Shows currently assigned tags (with ✕ remove buttons)</li>
<li>Search/create input to find existing tags or create new ones</li>
<li>Max 5 tags per prompt — warning shown at limit</li>
<li>Cancel and Save buttons to confirm changes</li>
</ul>

<h4>4. AI Tag Suggestions on Draft Prompts (New)</h4>
<p>When a prompt is generated or custom-added:</p>
<ul>
<li>AI suggests tags — prioritizing existing tags from the library first</li>
<li>When no existing tag fits, AI suggests a <strong>new tag</strong> (shown in orange/dashed)</li>
<li>Users review and edit tags before activating</li>
</ul>
<p><em>Note: A new AI system prompt is needed for tag suggestion. It must receive: prompt text, business profile, and confirmed tag library.</em></p>

<h4>5. Tag Confirmation on Activation (New)</h4>
<p>When activating a draft prompt:</p>
<ul>
<li>Any new tags (orange/dashed) are confirmed — added to the Tag Library permanently</li>
<li>Their style changes from orange/dashed to grey/solid</li>
<li>Activation modal shows how many new tags will be created</li>
</ul>

<h4>6. Search & Filter (Minor Change)</h4>
<p>Same search and state filters as original. No tag filter on this tab — tag filtering is on the Tracked Prompts tab.</p>

<hr>
<h3>Not Shown in Mockup</h3>
<ul>
<li><strong>AI tag suggestion API call</strong> — real version should trigger API call on prompt generation. Mockup uses hard-coded mock tags.</li>
<li><strong>Loading state</strong> while AI generates tag suggestions</li>
<li><strong>Bulk activate</strong> — behavior for tag confirmation when multiple drafts are activated at once is TBD</li>
<li><strong>Edit prompt text</strong> — the mockup doesn't include prompt text editing. Ensure tag and text editing don't conflict.</li>
</ul>
`
            },
            'key-topics': {
                title: '📋 Note to Developer — Key Topics Analysis Page',
                content: `
<h3>Page Structure (top to bottom)</h3>
<ol>
<li><strong>Page header</strong> — Title, scope subtitle (Brand / Scope / Response count), cosmetic date + export buttons. Subtitle updates dynamically when tag filter changes.</li>
<li><strong>Section A — Full Topic Landscape (treemap)</strong> — CSS flex treemap. Rows flex by frequency sum; cells flex by individual frequency. Three colour tiers: green (owned ≥60%), amber (mixed 30–59%), gray (absent &lt;30%). Hover deepens brightness. No click action in v1.</li>
<li><strong>Section B — Brand Leaders</strong> — Topics where AIMS % leads all competitors. Green left border. Default sort: Your Brand % descending.</li>
<li><strong>Section C — Battlegrounds</strong> — Topics where AIMS is present but at least one competitor leads. Amber left border. Default sort: Your Brand % descending.</li>
<li><strong>Section D — Blind Spots</strong> — Topics where AIMS has &lt;30% association. Gray left border. Default sort: Mentions descending (highest missed opportunity first).</li>
</ol>

<h3>Table Structure (Sections B, C, D — identical)</h3>
<ul>
<li>4 columns with <code>table-layout: fixed</code>: Topic (170px) | Mentions (90px, right-aligned, right-border divider) | Your Brand (210px, blue tint) | Competitors (auto, purple tint)</li>
<li>Your Brand cell: 64×8px mini bar + fraction + % with tier colour</li>
<li>Competitors cell: 3 competitors inline — <code>Name fraction% · Name fraction% · Name fraction%</code></li>
<li>Competitor data is <strong>static</strong> (hardcoded in <code>KT_COMPETITOR_DATA</code>) — does not respond to tag filter</li>
</ul>

<h3>Filter-aware behavior</h3>
<ul>
<li>All topic buckets (Leaders/Battlegrounds/Blind Spots) recompute when tag filter changes — topics can move between buckets</li>
<li>Treemap cell sizes, fractions, and section badges all update with scope</li>
<li>Competitor data (4th column) is static regardless of filter</li>
<li>Tag filter state shared globally via <code>trackedFilterTags</code> — same filter as dashboard</li>
</ul>

<h3>Data model</h3>
<ul>
<li><code>ZicyState.getKeyTopics(activePrompts)</code> returns <code>{ leaders, battles, blinds }</code> — each an array of <code>{ name, hits, num, den, pct }</code></li>
<li>Tier thresholds: Leaders ≥60%, Battlegrounds 30–59%, Blind Spots &lt;30%</li>
<li>Treemap: flatten all three arrays, sort by hits desc, group into rows (top 3 / next 3 / rest)</li>
</ul>

<h3>Entry points</h3>
<ul>
<li>Sidebar nav "Key Topics Analysis" under Intelligence Reports</li>
<li>"View Key Topics Analysis →" link on dashboard Key Topics card</li>
<li>Tag filter state is preserved when navigating from dashboard</li>
</ul>

<hr>
<h3>Not Shown in Prototype</h3>
<ul>
<li>Real DB-backed topic aggregation — prototype derives from per-prompt mock data</li>
<li>Loading/skeleton states on filter change</li>
<li>Cell click interactions (read-only in v1)</li>
<li>Date range selector (cosmetic)</li>
</ul>
`
            },
            competitive: {
                title: '📋 Note to Developer — Competitive Landscape Analysis Page',
                content: `
<h3>Page Structure (top to bottom)</h3>
<ol>
<li><strong>Page header</strong> — Title, active prompt count, tag filter dropdown (max 3 tags, shared global state with dashboard).</li>
<li><strong>Section A — Competitor Benchmark Table</strong> — All 6 brands × 5 metrics. Column groups: Brand Coverage (BMC%, Avg Ranking, Citation Coverage, SoV) and Brand Perception (Avg Sentiment). "YOU" row highlighted. Data derives from <code>ZicyState.getCompetitorMetrics(activePrompts)</code> — filter-aware. "+ Add Competitor" button opens modal (demo only, not persisted).</li>
<li><strong>Section B — Brand Positioning Matrix</strong> — SVG scatter plot. X axis: Brand Mention Coverage (%), Y axis: Avg Sentiment. Quadrant lines at X=50%, Y=60. Dot click scrolls to Section C and activates that brand profile. Insight strip shows AIMS's current quadrant. Brands legend panel on right links to Section C.</li>
<li><strong>Section C — Sentiment Profiles</strong> — Left list of all 6 brands, right panel shows selected brand's descriptor bars (positive/neutral/negative). AIMS score reads live from <code>ZicyState.getBrandSentiment()</code>; all other scores and descriptor profiles are static (<code>COMP_PROFILES</code> constant in ui.js). AIMS auto-selected on load.</li>
<li><strong>Section D — Tag-Level Heatmap</strong> — Rows = 12 confirmed tags, columns = 6 competitors + row avg. Metric toggle: Coverage % / Share of Voice % / Avg Sentiment. Data is static (<code>COMP_HEAT_DATA</code> in ui.js) — not filter-aware (always shows full dataset).</li>
</ol>

<h3>Filter behavior</h3>
<ul>
<li>Sections A and B recompute when tag filter changes — same <code>trackedFilterTags</code> global as dashboard</li>
<li>Section C AIMS score updates with filter (other brands are static)</li>
<li>Section D heatmap is always full dataset — not filter-aware</li>
<li>Tag filter dropdown on this page uses existing <code>applyDashTagFilter()</code> function — same state mutation as dashboard</li>
</ul>

<h3>SVG Matrix Scale</h3>
<ul>
<li>cx = <code>160 + (cov% - 30) * 4</code> (x range 30–90% → cx 160–400)</li>
<li>cy = <code>295 - (sentiment - 40) * 6.875</code> (sentiment range 40–80 → cy 295–20)</li>
<li>Boundary lines: x=240 (50% coverage), y=158 (sentiment 60)</li>
</ul>

<h3>Static data in ui.js</h3>
<ul>
<li><code>COMP_BRAND_COLORS</code> — one color per brand for matrix dots and legend</li>
<li><code>COMP_PROFILES</code> — positive/neutral/negative descriptor arrays per brand</li>
<li><code>COMP_HEAT_DATA</code> — coverage/sov/sentiment tables for all 12 tags × 6 brands</li>
</ul>

<h3>Add Competitor modal</h3>
<ul>
<li>Demo only — shows toast on submit, does not persist or re-render table</li>
<li>Real version needs: competitor added to COMPETITOR_CONFIG, prompt data seeded, re-render triggered</li>
</ul>

<hr>
<h3>Not Shown in Prototype</h3>
<ul>
<li>Real competitor prompt data — prototype uses mock data from <code>app.js</code></li>
<li>Add Competitor persistence — modal is demo only</li>
<li>Loading/skeleton states on filter change</li>
<li>Export buttons (cosmetic)</li>
</ul>
`
            },
            tags: {
                title: '📋 Note to Developer — Manage Tags Tab',
                content: `
<p><em>This tab is <strong>entirely new</strong> — it does not exist in the original system. Everything needs to be built from scratch.</em></p>

<h3>Overview</h3>
<p>Two-panel layout: <strong>Left panel</strong> (tag list with create/search) and <strong>Right panel</strong> (tag details + assigned prompts).</p>

<h3>Left Panel — Tag List</h3>

<h4>Create New Tag (Top of Panel)</h4>
<p>The "Create" section sits at the <strong>top of the left panel, above the search bar</strong>. Creating a tag is a primary action on this tab.</p>
<ul>
<li>Styled input with a visible blue <strong>"+ Create"</strong> button next to it</li>
<li>Hint text below: "Max 4 words per tag"</li>
<li>User types a name and clicks "+ Create" or presses Enter</li>
<li><strong>On success:</strong> toast notification ("Tag 'X' created"), input clears, new tag is <strong>auto-selected</strong> in the list, right panel immediately shows its detail</li>
<li><strong>Validation rules:</strong> not empty, max 4 words, no duplicate names (case-insensitive). Errors shown as toast notifications.</li>
</ul>

<h4>Tag Search</h4>
<p>Below the create input. Filters the tag list in real-time by name. Case-insensitive.</p>

<h4>Tag Summary Bar</h4>
<p>Shows counts: e.g., "12 tags · 10 in use · 2 unused"</p>

<h4>Tag List Items</h4>
<ul>
<li>Each row: tag name + prompt count badge</li>
<li>Sortable by name or count</li>
<li>Clicking a row selects it → loads detail on the right</li>
<li>Selected tag is highlighted</li>
</ul>

<h3>Right Panel — Tag Detail</h3>
<p>When no tag selected: "Select a tag to view details"</p>
<p>When a tag is selected:</p>
<ul>
<li><strong>Tag name</strong> displayed prominently with rename (pencil icon) button</li>
<li><strong>"+ Assign to Prompts"</strong> button — opens bulk-assign modal</li>
<li><strong>Delete</strong> button — opens confirmation modal</li>
<li><strong>Assigned Prompts list</strong> — each showing prompt text + ✕ remove button</li>
<li>If 0 prompts assigned: empty state with "No prompts assigned to this tag"</li>
</ul>

<h3>Modals</h3>
<h4>Assign Tag Modal</h4>
<ul>
<li>Searchable list of prompts with checkboxes</li>
<li>Already-tagged prompts excluded from the list</li>
<li>At-limit prompts (5 tags) shown as disabled</li>
</ul>

<h4>Delete Tag Modal</h4>
<ul>
<li>Shows affected prompt count</li>
<li>Deleting removes from library <strong>and</strong> unlinks from all prompts</li>
</ul>

<h3>Syncing</h3>
<ul>
<li>Tags created here are immediately available in the tag editor on Manage Prompts</li>
<li>Tags deleted here are removed from all prompts system-wide</li>
<li>Prompt counts update in real time across tabs</li>
</ul>

<hr>
<h3>Not Shown in Mockup</h3>
<ul>
<li><strong>Tag merge</strong> — combining two tags into one (mentioned in planning, not yet built)</li>
<li><strong>Bulk delete</strong> of multiple tags at once</li>
<li><strong>Empty state</strong> for tag list when user has no tags yet</li>
</ul>
`
            }
        };

        const note = notes[tab];
        if (!note) return;
        document.getElementById('dev-notes-title').textContent = note.title;
        document.getElementById('dev-notes-content').innerHTML = note.content;
        this.showModal('modal-dev-notes');
    },
};

// ---- Close popups on outside click ----
document.addEventListener('click', (e) => {
    const editor = document.getElementById('tag-editor');
    if (editor.classList.contains('visible') && !editor.contains(e.target) && !e.target.classList.contains('btn-add-tag')) {
        UI.closeTagEditor();
    }
    // Close tag filter dropdown on outside click
    const tagWrap = document.getElementById('dash-tag-filter-wrap');
    const tagDd = document.getElementById('dash-tag-dropdown');
    if (tagDd && tagDd.classList.contains('open') && tagWrap && !tagWrap.contains(e.target)) {
        tagDd.classList.remove('open');
    }
    // Close competitive tag filter dropdown on outside click
    const compTagWrap = document.getElementById('comp-tag-filter-wrap');
    const compTagDd = document.getElementById('comp-tag-dropdown');
    if (compTagDd && compTagDd.classList.contains('open') && compTagWrap && !compTagWrap.contains(e.target)) {
        compTagDd.classList.remove('open');
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
