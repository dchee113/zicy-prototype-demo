/* ============================================
   Zicy Tag Management — State Manager & Mock Data
   Version 2 — Multi-tag support
   ============================================ */

const ZicyState = (() => {
    const STORAGE_KEY = 'zicyProtoData_v2';

    // ---- Default Mock Data ----
    function getDefaultData() {
        const tags = [
            { id: 't-001', name: 'AI Data Center', promptCount: 0, status: 'confirmed' },
            { id: 't-002', name: 'Disaster Recovery', promptCount: 0, status: 'confirmed' },
            { id: 't-003', name: 'Managed Services', promptCount: 0, status: 'confirmed' },
            { id: 't-004', name: 'Colocation Services', promptCount: 0, status: 'confirmed' },
            { id: 't-005', name: 'Cybersecurity', promptCount: 0, status: 'confirmed' },
            { id: 't-006', name: 'Data Center', promptCount: 0, status: 'confirmed' },
            { id: 't-007', name: 'Cloud Connectivity', promptCount: 0, status: 'confirmed' },
            { id: 't-008', name: 'Managed Service Data Center', promptCount: 0, status: 'confirmed' },
            { id: 't-009', name: 'Malaysia', promptCount: 0, status: 'confirmed' },
            { id: 't-010', name: 'LLM Infrastructure', promptCount: 0, status: 'confirmed' },
            { id: 't-011', name: 'Enterprise', promptCount: 0, status: 'confirmed' },
            { id: 't-012', name: 'Compliance', promptCount: 0, status: 'confirmed' },
        ];

        const prompts = [
            // ---- DRAFT (with AI-suggested new tags) ----
            {
                id: 'p-001',
                text: 'What is the best AI data center for running an LLM?',
                state: 'draft',
                category: 'AI Data Center',
                tags: [
                    { tagId: 't-001', status: 'existing' },
                    { tagId: 't-010', status: 'existing' },
                    { tagId: 't-new-001', status: 'new' }
                ],
                responses: generateResponses(4, 5, 2.8, 50.7, 3, 5)
            },
            {
                id: 'p-014',
                text: 'What is the best enterprise cloud hosting for large-scale AI workloads?',
                state: 'draft',
                category: 'Cloud Hosting',
                tags: [
                    { tagId: 't-007', status: 'existing' },
                    { tagId: 't-new-002', status: 'new' }
                ],
                responses: null
            },
            // ---- ACTIVE ----
            {
                id: 'p-002',
                text: 'What is the best data center with disaster recovery services in Malaysia?',
                state: 'active',
                category: 'Disaster Recovery Services',
                tags: [
                    { tagId: 't-002', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(5, 5, 1.2, 35.3, 4, 5)
            },
            {
                id: 'p-003',
                text: 'What is the best data center with managed services in Malaysia?',
                state: 'active',
                category: 'Managed Services',
                tags: [
                    { tagId: 't-003', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(5, 5, 1.4, 41.4, 4, 5)
            },
            {
                id: 'p-004',
                text: 'What is the best data center with colocation services in Malaysia?',
                state: 'active',
                category: 'Colocation Services',
                tags: [
                    { tagId: 't-004', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 3.0, 28.1, 4, 5)
            },
            {
                id: 'p-005',
                text: 'what is the best data center with managed cybersecurity services in malaysia?',
                state: 'active',
                category: 'Cybersecurity Services',
                tags: [
                    { tagId: 't-005', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-003', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 2.3, 25.1, 2, 5)
            },
            {
                id: 'p-006',
                text: "What's the best data center with systems monitoring in Malaysia?",
                state: 'active',
                category: 'Data Center',
                tags: [
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 1.3, 36.8, 3, 5)
            },
            {
                id: 'p-007',
                text: "What's the best data center with backup solutions in Malaysia?",
                state: 'active',
                category: 'Data Center',
                tags: [
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-002', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(5, 5, 1.2, 28.2, 3, 5)
            },
            {
                id: 'p-008',
                text: "What's the best data center with disaster recovery services in Malaysia?",
                state: 'active',
                category: 'Disaster Recovery Services',
                tags: [
                    { tagId: 't-002', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 2.3, 29.4, 2, 5)
            },
            {
                id: 'p-009',
                text: "What's the best carrier-neutral data center in Malaysia?",
                state: 'active',
                category: 'Data Center',
                tags: [
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-007', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 1.0, 34.8, 3, 5)
            },
            {
                id: 'p-010',
                text: 'Which data center has the best cloud connectivity options in Malaysia?',
                state: 'active',
                category: 'Cloud Connectivity',
                tags: [
                    { tagId: 't-007', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 1.3, 22.3, 2, 5)
            },
            {
                id: 'p-011',
                text: 'what is the best managed service data center in malaysia?',
                state: 'active',
                category: 'Managed Service Data Center',
                tags: [
                    { tagId: 't-008', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 2.5, 34.4, 3, 5)
            },
            {
                id: 'p-012',
                text: "What's the best data center for colocation services in Malaysia?",
                state: 'active',
                category: 'Colocation Services',
                tags: [
                    { tagId: 't-004', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(4, 5, 1.0, 19.5, 1, 5)
            },
            {
                id: 'p-013',
                text: 'what is the best data center with ISO 27001 and Tier iii certification in Malaysia?',
                state: 'active',
                category: 'Data Center',
                tags: [
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-012', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: generateResponses(5, 5, 2.8, 50.7, 3, 5)
            },
        ];

        // AI-suggested new tags (not yet in Tag Manager)
        const newTagSuggestions = [
            { id: 't-new-001', name: 'GPU Hosting', promptCount: 0, status: 'suggested' },
            { id: 't-new-002', name: 'AI Workloads', promptCount: 0, status: 'suggested' },
        ];

        // Add new tag suggestions to the tags list so they can be resolved by name
        tags.push(...newTagSuggestions);

        // Recalculate tag prompt counts
        recalcTagCounts(tags, prompts);

        // Competitor data
        const competitors = [
            { name: 'Aims', you: true, brandMention: '52/60', avgRanking: 1.8, citations: '34/60', sov: '32.2%' },
            { name: 'Equinix', you: false, brandMention: '34/60', avgRanking: 2.8, citations: '31/60', sov: '18.2%' },
            { name: 'TM One', you: false, brandMention: '17/60', avgRanking: 2.4, citations: '9/60', sov: '4.8%' },
            { name: 'Vantage Data Centers', you: false, brandMention: '19/60', avgRanking: 3.6, citations: '17/60', sov: '4.0%' },
            { name: 'Bridge Data Centres', you: false, brandMention: '17/60', avgRanking: 3.2, citations: '9/60', sov: '3.3%' },
            { name: 'NTT Ltd.', you: false, brandMention: '10/60', avgRanking: 2.6, citations: '7/60', sov: '2.7%' },
        ];

        return { tags, prompts, competitors, generatedCount: 0 };
    }

    function generateResponses(brandMentionNum, brandMentionDen, avgPosition, sov, citationNum, citationDen) {
        const platforms = ['chatgpt', 'gemini', 'perplexity', 'googleAI', 'aiOverview'];
        const resp = {};

        platforms.forEach((p, i) => {
            const mentioned = i < brandMentionNum;
            const cited = i < citationNum;
            const yourMentions = mentioned ? Math.floor(Math.random() * 10) + 1 : 0;
            const totalBrand = mentioned ? yourMentions + Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 8) + 5;
            const pos = mentioned ? Math.floor(Math.random() * 5) + 1 : 0;

            resp[p] = {
                mentioned,
                cited,
                position: pos,
                yourBrandMentions: yourMentions,
                totalBrandMentions: totalBrand,
                sov: mentioned ? (yourMentions / totalBrand * 100).toFixed(1) + '%' : '0%',
            };
        });

        return {
            brandMentionCoverage: `${brandMentionNum}/${brandMentionDen}`,
            avgPosition: avgPosition,
            sov: sov + '%',
            citationCoverage: `${citationNum}/${citationDen}`,
            platforms: resp
        };
    }

    function recalcTagCounts(tags, prompts) {
        tags.forEach(t => t.promptCount = 0);
        prompts.forEach(p => {
            if (p.state !== 'active') return;
            p.tags.forEach(pt => {
                const tag = tags.find(t => t.id === pt.tagId);
                if (tag) tag.promptCount++;
            });
        });
    }

    // ---- State Persistence ----
    function load() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return JSON.parse(stored);
        } catch (e) { /* ignore */ }
        return null;
    }

    function save(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) { console.error('Failed to save state', e); }
    }

    // ---- Initialize ----
    let data = load() || getDefaultData();
    save(data);

    // ---- Helpers ----
    function genId(prefix) {
        return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
    }

    function validateTagName(name) {
        const trimmed = name.trim();
        if (!trimmed) return { valid: false, error: 'Tag name cannot be empty' };
        if (trimmed.split(/\s+/).length > 4) return { valid: false, error: 'Tag name cannot exceed 4 words' };
        const existing = data.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) return { valid: false, error: 'A tag with this name already exists' };
        return { valid: true, name: trimmed };
    }

    // ---- Public API ----
    return {
        // Reset to defaults
        reset() {
            data = getDefaultData();
            save(data);
        },

        // ---- Tags ----
        getTags() {
            recalcTagCounts(data.tags, data.prompts);
            save(data);
            return [...data.tags];
        },

        getConfirmedTags() {
            recalcTagCounts(data.tags, data.prompts);
            return data.tags.filter(t => t.status === 'confirmed');
        },

        getTagById(tagId) {
            return data.tags.find(t => t.id === tagId) || null;
        },

        createTag(name) {
            const validation = validateTagName(name);
            if (!validation.valid) return { success: false, error: validation.error };
            const tag = { id: genId('t'), name: validation.name, promptCount: 0, status: 'confirmed' };
            data.tags.push(tag);
            save(data);
            return { success: true, tag };
        },

        renameTag(tagId, newName) {
            const trimmed = newName.trim();
            if (!trimmed) return { success: false, error: 'Tag name cannot be empty' };
            if (trimmed.split(/\s+/).length > 4) return { success: false, error: 'Tag name cannot exceed 4 words' };
            const dup = data.tags.find(t => t.id !== tagId && t.name.toLowerCase() === trimmed.toLowerCase());
            if (dup) return { success: false, error: 'A tag with this name already exists' };
            const tag = data.tags.find(t => t.id === tagId);
            if (!tag) return { success: false, error: 'Tag not found' };
            tag.name = trimmed;
            save(data);
            return { success: true, tag };
        },

        deleteTag(tagId) {
            const tagIndex = data.tags.findIndex(t => t.id === tagId);
            if (tagIndex === -1) return { success: false, error: 'Tag not found' };
            const tag = data.tags[tagIndex];
            // Remove from all prompts
            data.prompts.forEach(p => {
                p.tags = p.tags.filter(pt => pt.tagId !== tagId);
            });
            data.tags.splice(tagIndex, 1);
            save(data);
            return { success: true, tag };
        },

        getPromptsForTag(tagId) {
            return data.prompts.filter(p => p.tags.some(pt => pt.tagId === tagId));
        },

        // ---- Prompts ----
        getPrompts(stateFilter) {
            if (stateFilter) return data.prompts.filter(p => p.state === stateFilter);
            return [...data.prompts];
        },

        getActivePrompts() {
            return data.prompts.filter(p => p.state === 'active');
        },

        getPromptById(promptId) {
            return data.prompts.find(p => p.id === promptId) || null;
        },

        // ---- Prompt-Tag Operations ----
        addTagToPrompt(promptId, tagId, isNew = false) {
            const prompt = data.prompts.find(p => p.id === promptId);
            if (!prompt) return { success: false, error: 'Prompt not found' };
            if (prompt.tags.length >= 5) return { success: false, error: 'Maximum 5 tags per prompt' };
            if (prompt.tags.some(pt => pt.tagId === tagId)) return { success: false, error: 'Tag already assigned' };
            prompt.tags.push({ tagId, status: isNew ? 'new' : 'existing' });
            recalcTagCounts(data.tags, data.prompts);
            save(data);
            return { success: true };
        },

        removeTagFromPrompt(promptId, tagId) {
            const prompt = data.prompts.find(p => p.id === promptId);
            if (!prompt) return { success: false, error: 'Prompt not found' };
            prompt.tags = prompt.tags.filter(pt => pt.tagId !== tagId);
            recalcTagCounts(data.tags, data.prompts);
            save(data);
            return { success: true };
        },

        bulkAddTag(promptIds, tagId) {
            const errors = [];
            const successes = [];
            promptIds.forEach(pid => {
                const result = this.addTagToPrompt(pid, tagId, false);
                if (result.success) successes.push(pid);
                else errors.push({ promptId: pid, error: result.error });
            });
            return { successes, errors };
        },

        // ---- Lifecycle ----
        activatePrompt(promptId) {
            const prompt = data.prompts.find(p => p.id === promptId);
            if (!prompt) return { success: false, error: 'Prompt not found' };
            if (prompt.state !== 'draft') return { success: false, error: 'Only draft prompts can be activated' };

            const newTags = prompt.tags.filter(pt => pt.status === 'new');

            // Confirm all new tags
            newTags.forEach(pt => {
                pt.status = 'existing';
                const tag = data.tags.find(t => t.id === pt.tagId);
                if (tag) tag.status = 'confirmed';
            });

            prompt.state = 'active';

            // Generate responses if missing
            if (!prompt.responses || !prompt.responses.brandMentionCoverage) {
                prompt.responses = generateResponses(
                    Math.floor(Math.random() * 2) + 4, 5,
                    +(Math.random() * 3 + 1).toFixed(1),
                    +(Math.random() * 30 + 20).toFixed(1),
                    Math.floor(Math.random() * 3) + 2, 5
                );
            }

            recalcTagCounts(data.tags, data.prompts);
            save(data);
            return { success: true, newTagsCreated: newTags.length };
        },

        pausePrompt(promptId) {
            const prompt = data.prompts.find(p => p.id === promptId);
            if (!prompt) return { success: false, error: 'Prompt not found' };
            prompt.state = 'paused';
            recalcTagCounts(data.tags, data.prompts);
            save(data);
            return { success: true };
        },

        deletePrompt(promptId) {
            const idx = data.prompts.findIndex(p => p.id === promptId);
            if (idx === -1) return { success: false, error: 'Prompt not found' };
            data.prompts.splice(idx, 1);
            recalcTagCounts(data.tags, data.prompts);
            save(data);
            return { success: true };
        },

        // ---- Generate / Create Prompts ----
        generatePrompt() {
            data.generatedCount = (data.generatedCount || 0) + 1;
            const samplePrompts = [
                'What is the best data center for AI training in Southeast Asia?',
                'Which managed service provider offers the best uptime guarantee?',
                'What is the most cost-effective colocation service in KL?',
                'Which data center has the best interconnection ecosystem?',
                'What is the best disaster recovery solution for SMEs?',
            ];
            const prompt = {
                id: genId('p'),
                text: samplePrompts[(data.generatedCount - 1) % samplePrompts.length],
                state: 'draft',
                category: '',
                tags: [
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: null
            };
            data.prompts.unshift(prompt);
            save(data);
            return prompt;
        },

        addCustomPrompt(text) {
            if (!text.trim()) return { success: false, error: 'Prompt text cannot be empty' };
            const prompt = {
                id: genId('p'),
                text: text.trim(),
                state: 'draft',
                category: '',
                tags: [],
                responses: null
            };
            data.prompts.unshift(prompt);
            save(data);
            return { success: true, prompt };
        },

        // ---- Filtering ----
        filterPromptsByTags(tagIds) {
            if (!tagIds || tagIds.length === 0) return this.getActivePrompts();
            // OR logic: prompt must have ANY of the selected tags
            return data.prompts.filter(p =>
                p.state === 'active' &&
                tagIds.some(tid => p.tags.some(pt => pt.tagId === tid))
            );
        },

        // ---- Aggregated Metrics ----
        getAggregatedMetrics(promptList) {
            if (!promptList) promptList = this.getActivePrompts();
            let totalMentionNum = 0, totalMentionDen = 0;
            let totalCitNum = 0, totalCitDen = 0;
            let totalSov = 0;
            let totalPos = 0;
            let count = 0;

            promptList.forEach(p => {
                if (!p.responses) return;
                const [mNum, mDen] = p.responses.brandMentionCoverage.split('/').map(Number);
                const [cNum, cDen] = p.responses.citationCoverage.split('/').map(Number);
                totalMentionNum += mNum;
                totalMentionDen += mDen;
                totalCitNum += cNum;
                totalCitDen += cDen;
                totalSov += parseFloat(p.responses.sov);
                totalPos += p.responses.avgPosition;
                count++;
            });

            return {
                totalPrompts: promptList.length,
                brandMention: totalMentionNum,
                brandMentionCoverage: totalMentionDen > 0 ? ((totalMentionNum / totalMentionDen) * 100).toFixed(2) : '0',
                brandMentionDisplay: `${totalMentionNum}/${totalMentionDen}`,
                avgSov: count > 0 ? (totalSov / count).toFixed(1) : '0',
                websiteCitation: totalCitNum,
                citationCoverage: totalCitDen > 0 ? ((totalCitNum / totalCitDen) * 100).toFixed(2) : '0',
                citationDisplay: `${totalCitNum}/${totalCitDen}`,
                avgPosition: count > 0 ? (totalPos / count).toFixed(1) : '0',
            };
        },

        // ---- Competitors ----
        getCompetitors() {
            return data.competitors || [];
        },

        // ---- Counts ----
        getCounts() {
            const drafts = data.prompts.filter(p => p.state === 'draft').length;
            const active = data.prompts.filter(p => p.state === 'active').length;
            const paused = data.prompts.filter(p => p.state === 'paused').length;
            return { drafts, active, paused, total: drafts + active + paused };
        },

        // ---- Tag Stats ----
        getTagStats() {
            const confirmed = data.tags.filter(t => t.status === 'confirmed');
            const inUse = confirmed.filter(t => t.promptCount > 0).length;
            const unused = confirmed.length - inUse;
            return { total: confirmed.length, inUse, unused };
        },
    };
})();
