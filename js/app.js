/* ============================================
   Zicy Tag Management — State Manager & Mock Data
   Version 2 — Multi-tag support
   ============================================ */

const ZicyState = (() => {
    const STORAGE_KEY = 'zicyProtoData_v3';

    // ---- Competitor config (static flavour fields only) ----
    const COMPETITOR_CONFIG = [
        { name: 'Aims',                you: true,  sentiment: 74, sentimentClass: 'text-amber', descriptors: 'reliable, enterprise-grade' },
        { name: 'Equinix',             you: false, sentiment: 81, sentimentClass: 'text-green', descriptors: 'global scale, premium' },
        { name: 'TM One',              you: false, sentiment: 68, sentimentClass: 'text-amber', descriptors: 'local, affordable' },
        { name: 'Vantage Data Centers',you: false, sentiment: 72, sentimentClass: 'text-amber', descriptors: 'modern, flexible' },
        { name: 'Bridge Data Centres', you: false, sentiment: 61, sentimentClass: 'text-amber', descriptors: 'regional, growing' },
        { name: 'NTT Ltd.',            you: false, sentiment: 76, sentimentClass: 'text-green', descriptors: 'enterprise, secure' },
    ];

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

        // Helper: build per-prompt competitor data map from compact array
        // Order: Equinix, TM One, Vantage Data Centers, Bridge Data Centres, NTT Ltd.
        // Each entry: [mentions, cited, avgPosition, sovPct]
        function mkComp(data) {
            const names = ['Equinix', 'TM One', 'Vantage Data Centers', 'Bridge Data Centres', 'NTT Ltd.'];
            const result = {};
            names.forEach((name, i) => {
                const [men, cit, pos, sov] = data[i];
                result[name] = { mentions: men, total: 5, cited: cit, citedTotal: 5, avgPosition: pos, sovPct: sov };
            });
            return result;
        }

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
                responses: Object.assign(generateResponses(4, 5, 2.8, 50.7, 3, 5), {
                    sentimentScore: 72,
                    sentimentDescriptors: { pos: ['enterprise-grade', 'scalable'], neg: ['pricey'] },
                    topics: [
                        { name: 'AI Performance', yourBrand: true },
                        { name: 'Performance', yourBrand: true },
                        { name: 'Scalability', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[4,3,2.0,19.0],[0,0,0,0.0],[2,1,3.2,7.0],[0,0,0,0.0],[2,1,2.5,4.5]])
                })
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
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-006', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(5, 5, 1.2, 35.3, 4, 5), {
                    sentimentScore: 78,
                    sentimentDescriptors: { pos: ['reliable', 'secure'], neg: ['pricey'] },
                    topics: [
                        { name: 'Data Security', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Backup Speed', yourBrand: true },
                        { name: 'Compliance', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.3,15.0],[2,0,2.5,7.5],[1,0,3.8,4.0],[1,0,3.2,3.5],[0,0,0,0.0]])
                })
            },
            {
                id: 'p-003',
                text: 'What is the best data center with managed services in Malaysia?',
                state: 'active',
                category: 'Managed Services',
                tags: [
                    { tagId: 't-003', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-006', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(5, 5, 1.4, 41.4, 4, 5), {
                    sentimentScore: 75,
                    sentimentDescriptors: { pos: ['reliable', 'easy setup'], neg: ['complex onboarding'] },
                    topics: [
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Customer Support', yourBrand: true },
                        { name: 'Ease of Setup', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[2,1,2.5,14.0],[3,1,2.2,9.0],[1,1,3.5,4.5],[1,0,3.8,3.0],[1,0,2.8,2.5]])
                })
            },
            {
                id: 'p-004',
                text: 'What is the best data center with colocation services in Malaysia?',
                state: 'active',
                category: 'Colocation Services',
                tags: [
                    { tagId: 't-004', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-006', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 3.0, 28.1, 4, 5), {
                    sentimentScore: 70,
                    sentimentDescriptors: { pos: ['scalable', 'cost-effective'], neg: ['pricey'] },
                    topics: [
                        { name: 'Scalability', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Integrations', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.8,16.0],[1,0,2.6,5.0],[2,1,3.2,7.5],[2,1,3.0,6.0],[0,0,0,0.0]])
                })
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
                responses: Object.assign(generateResponses(4, 5, 2.3, 25.1, 2, 5), {
                    sentimentScore: 72,
                    sentimentDescriptors: { pos: ['secure', 'enterprise-grade'], neg: ['steep learning curve'] },
                    topics: [
                        { name: 'Data Security', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Compliance', yourBrand: false },
                        { name: 'Customer Support', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.0,18.0],[1,0,2.4,5.5],[1,0,3.5,3.5],[0,0,0,0.0],[1,1,2.5,3.0]])
                })
            },
            {
                id: 'p-006',
                text: "What's the best data center with systems monitoring in Malaysia?",
                state: 'active',
                category: 'Data Center',
                tags: [
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-003', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 1.3, 36.8, 3, 5), {
                    sentimentScore: 74,
                    sentimentDescriptors: { pos: ['reliable', 'fast deployment'], neg: ['pricey'] },
                    topics: [
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Performance', yourBrand: true },
                        { name: 'Customer Support', yourBrand: false },
                        { name: 'Integrations', yourBrand: true },
                    ],
                    competitors: mkComp([[3,2,2.5,15.0],[2,0,2.2,8.0],[1,0,3.8,3.5],[1,0,3.5,3.0],[1,0,2.7,2.5]])
                })
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
                responses: Object.assign(generateResponses(5, 5, 1.2, 28.2, 3, 5), {
                    sentimentScore: 76,
                    sentimentDescriptors: { pos: ['reliable', 'secure'], neg: ['pricey'] },
                    topics: [
                        { name: 'Backup Speed', yourBrand: true },
                        { name: 'Data Security', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.2,14.0],[2,1,2.5,7.0],[1,0,3.6,4.0],[1,0,3.3,3.0],[0,0,0,0.0]])
                })
            },
            {
                id: 'p-008',
                text: "What's the best data center with disaster recovery services in Malaysia?",
                state: 'active',
                category: 'Disaster Recovery Services',
                tags: [
                    { tagId: 't-002', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-006', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 2.3, 29.4, 2, 5), {
                    sentimentScore: 77,
                    sentimentDescriptors: { pos: ['reliable', 'secure'], neg: ['complex onboarding'] },
                    topics: [
                        { name: 'Backup Speed', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Data Security', yourBrand: false },
                        { name: 'Performance', yourBrand: true },
                    ],
                    competitors: mkComp([[2,1,2.4,12.5],[2,1,2.3,8.5],[1,0,3.7,4.0],[1,0,3.4,3.2],[0,0,0,0.0]])
                })
            },
            {
                id: 'p-009',
                text: "What's the best carrier-neutral data center in Malaysia?",
                state: 'active',
                category: 'Data Center',
                tags: [
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-007', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 1.0, 34.8, 3, 5), {
                    sentimentScore: 73,
                    sentimentDescriptors: { pos: ['scalable', 'fast deployment'], neg: ['pricey'] },
                    topics: [
                        { name: 'Cloud Connectivity', yourBrand: true },
                        { name: 'Integrations', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Performance', yourBrand: false },
                    ],
                    competitors: mkComp([[4,3,2.0,20.0],[1,0,2.8,4.5],[2,1,3.5,6.0],[1,0,3.2,3.0],[1,1,2.5,3.5]])
                })
            },
            {
                id: 'p-010',
                text: 'Which data center has the best cloud connectivity options in Malaysia?',
                state: 'active',
                category: 'Cloud Connectivity',
                tags: [
                    { tagId: 't-007', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-006', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 1.3, 22.3, 2, 5), {
                    sentimentScore: 71,
                    sentimentDescriptors: { pos: ['fast deployment', 'scalable'], neg: ['pricey'] },
                    topics: [
                        { name: 'Cloud Connectivity', yourBrand: true },
                        { name: 'Integrations', yourBrand: true },
                        { name: 'Performance', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[4,3,1.8,22.0],[1,0,2.6,4.0],[1,0,3.8,3.5],[0,0,0,0.0],[1,1,2.4,3.0]])
                })
            },
            {
                id: 'p-011',
                text: 'what is the best managed service data center in malaysia?',
                state: 'active',
                category: 'Managed Service Data Center',
                tags: [
                    { tagId: 't-008', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-003', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 2.5, 34.4, 3, 5), {
                    sentimentScore: 74,
                    sentimentDescriptors: { pos: ['reliable', 'easy setup'], neg: ['complex onboarding'] },
                    topics: [
                        { name: 'Customer Support', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Ease of Setup', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[2,1,2.7,13.0],[3,2,2.1,10.5],[1,0,3.6,4.0],[1,0,3.5,3.0],[1,0,2.8,2.5]])
                })
            },
            {
                id: 'p-012',
                text: "What's the best data center for colocation services in Malaysia?",
                state: 'active',
                category: 'Colocation Services',
                tags: [
                    { tagId: 't-004', status: 'existing' },
                    { tagId: 't-009', status: 'existing' },
                    { tagId: 't-006', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 1.0, 19.5, 1, 5), {
                    sentimentScore: 68,
                    sentimentDescriptors: { pos: ['cost-effective', 'scalable'], neg: ['pricey'] },
                    topics: [
                        { name: 'Scalability', yourBrand: false },
                        { name: 'Pricing & Value', yourBrand: false },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Integrations', yourBrand: true },
                    ],
                    competitors: mkComp([[3,2,2.5,17.0],[2,0,2.4,7.5],[3,2,3.0,8.5],[2,1,3.2,6.0],[0,0,0,0.0]])
                })
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
                responses: Object.assign(generateResponses(5, 5, 2.8, 50.7, 3, 5), {
                    sentimentScore: 79,
                    sentimentDescriptors: { pos: ['secure', 'enterprise-grade'], neg: ['complex onboarding'] },
                    topics: [
                        { name: 'Compliance', yourBrand: true },
                        { name: 'Data Security', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Onboarding', yourBrand: false },
                    ],
                    competitors: mkComp([[4,3,1.9,21.0],[1,0,2.5,4.5],[2,2,3.3,5.5],[1,0,3.0,3.0],[2,1,2.4,4.5]])
                })
            },
            // ---- 8 NEW ACTIVE PROMPTS ----
            {
                id: 'p-015',
                text: "What's the best enterprise data center for compliance needs in Malaysia?",
                state: 'active',
                category: 'Data Center',
                tags: [
                    { tagId: 't-012', status: 'existing' },
                    { tagId: 't-011', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(5, 5, 1.6, 38.5, 4, 5), {
                    sentimentScore: 77,
                    sentimentDescriptors: { pos: ['secure', 'enterprise-grade'], neg: ['complex onboarding'] },
                    topics: [
                        { name: 'Compliance', yourBrand: true },
                        { name: 'Data Security', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Onboarding', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.1,17.5],[1,0,2.5,4.5],[2,1,3.4,5.0],[1,0,3.0,2.5],[2,1,2.3,5.0]])
                })
            },
            {
                id: 'p-016',
                text: 'Top AI data centers for LLM training in Southeast Asia',
                state: 'active',
                category: 'AI Data Center',
                tags: [
                    { tagId: 't-001', status: 'existing' },
                    { tagId: 't-010', status: 'existing' },
                    { tagId: 't-011', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 2.2, 33.0, 3, 5), {
                    sentimentScore: 73,
                    sentimentDescriptors: { pos: ['enterprise-grade', 'scalable'], neg: ['pricey'] },
                    topics: [
                        { name: 'AI Performance', yourBrand: true },
                        { name: 'Performance', yourBrand: true },
                        { name: 'Scalability', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[4,3,2.0,19.0],[0,0,0,0.0],[2,1,3.2,7.0],[0,0,0,0.0],[2,1,2.5,4.5]])
                })
            },
            {
                id: 'p-017',
                text: 'Best cloud connectivity providers for enterprise businesses in Malaysia',
                state: 'active',
                category: 'Cloud Connectivity',
                tags: [
                    { tagId: 't-007', status: 'existing' },
                    { tagId: 't-011', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 1.8, 27.5, 2, 5), {
                    sentimentScore: 72,
                    sentimentDescriptors: { pos: ['fast deployment', 'scalable'], neg: ['pricey'] },
                    topics: [
                        { name: 'Cloud Connectivity', yourBrand: true },
                        { name: 'Integrations', yourBrand: true },
                        { name: 'Performance', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[4,3,1.9,21.0],[1,0,2.7,4.0],[1,0,3.8,3.0],[0,0,0,0.0],[1,1,2.5,3.5]])
                })
            },
            {
                id: 'p-018',
                text: 'Most reliable data center for cybersecurity compliance in Malaysia',
                state: 'active',
                category: 'Cybersecurity Services',
                tags: [
                    { tagId: 't-005', status: 'existing' },
                    { tagId: 't-012', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(5, 5, 1.4, 42.0, 4, 5), {
                    sentimentScore: 80,
                    sentimentDescriptors: { pos: ['secure', 'reliable'], neg: ['steep learning curve'] },
                    topics: [
                        { name: 'Data Security', yourBrand: true },
                        { name: 'Compliance', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Customer Support', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.0,18.5],[1,0,2.4,4.5],[1,0,3.5,3.5],[0,0,0,0.0],[2,2,2.3,5.0]])
                })
            },
            {
                id: 'p-019',
                text: 'Best managed IT services for enterprise businesses in Malaysia',
                state: 'active',
                category: 'Managed Services',
                tags: [
                    { tagId: 't-003', status: 'existing' },
                    { tagId: 't-011', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 2.0, 30.5, 3, 5), {
                    sentimentScore: 74,
                    sentimentDescriptors: { pos: ['reliable', 'easy setup'], neg: ['complex onboarding'] },
                    topics: [
                        { name: 'Customer Support', yourBrand: true },
                        { name: 'Ease of Setup', yourBrand: true },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Onboarding', yourBrand: false },
                    ],
                    competitors: mkComp([[2,1,2.6,13.0],[3,2,2.1,10.0],[1,0,3.5,4.0],[1,0,3.4,3.0],[1,0,2.7,2.5]])
                })
            },
            {
                id: 'p-020',
                text: 'Which data center offers the best disaster recovery SLA in Malaysia?',
                state: 'active',
                category: 'Disaster Recovery Services',
                tags: [
                    { tagId: 't-002', status: 'existing' },
                    { tagId: 't-006', status: 'existing' },
                    { tagId: 't-012', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 1.8, 31.0, 3, 5), {
                    sentimentScore: 76,
                    sentimentDescriptors: { pos: ['reliable', 'secure'], neg: ['pricey'] },
                    topics: [
                        { name: 'Backup Speed', yourBrand: true },
                        { name: 'Data Security', yourBrand: true },
                        { name: 'Compliance', yourBrand: true },
                        { name: 'Reliability', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.2,15.5],[2,1,2.4,8.0],[1,0,3.7,3.5],[1,0,3.3,3.0],[1,0,2.6,2.5]])
                })
            },
            {
                id: 'p-021',
                text: 'Best LLM infrastructure providers for AI workloads in Southeast Asia',
                state: 'active',
                category: 'LLM Infrastructure',
                tags: [
                    { tagId: 't-010', status: 'existing' },
                    { tagId: 't-001', status: 'existing' },
                    { tagId: 't-011', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 2.4, 29.0, 2, 5), {
                    sentimentScore: 71,
                    sentimentDescriptors: { pos: ['scalable', 'enterprise-grade'], neg: ['pricey', 'steep learning curve'] },
                    topics: [
                        { name: 'AI Performance', yourBrand: true },
                        { name: 'Performance', yourBrand: true },
                        { name: 'Scalability', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                    ],
                    competitors: mkComp([[4,3,2.0,20.0],[0,0,0,0.0],[2,1,3.3,6.5],[0,0,0,0.0],[2,1,2.6,4.0]])
                })
            },
            {
                id: 'p-022',
                text: 'Top colocation services for enterprise businesses in Malaysia',
                state: 'active',
                category: 'Colocation Services',
                tags: [
                    { tagId: 't-004', status: 'existing' },
                    { tagId: 't-011', status: 'existing' },
                    { tagId: 't-009', status: 'existing' }
                ],
                responses: Object.assign(generateResponses(4, 5, 2.6, 24.0, 3, 5), {
                    sentimentScore: 69,
                    sentimentDescriptors: { pos: ['cost-effective', 'scalable'], neg: ['pricey'] },
                    topics: [
                        { name: 'Scalability', yourBrand: true },
                        { name: 'Pricing & Value', yourBrand: false },
                        { name: 'Reliability', yourBrand: true },
                        { name: 'Integrations', yourBrand: false },
                    ],
                    competitors: mkComp([[3,2,2.6,15.5],[1,0,2.5,5.0],[3,2,2.9,9.0],[2,1,3.1,5.5],[0,0,0,0.0]])
                })
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

        return { tags, prompts, generatedCount: 0 };
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

        // ---- Competitors (derived from filtered prompt set) ----
        getCompetitorMetrics(promptList) {
            if (!promptList) promptList = this.getActivePrompts();
            const filtered = promptList.filter(p => p.responses);

            // Compute Aims (you) from the prompts' own response metrics
            let aimsMenNum = 0, aimsMenDen = 0, aimsCitNum = 0, aimsCitDen = 0;
            let aimsSovSum = 0, aimsPosSum = 0, aimsCount = 0;
            filtered.forEach(p => {
                const [mn, md] = p.responses.brandMentionCoverage.split('/').map(Number);
                const [cn, cd] = p.responses.citationCoverage.split('/').map(Number);
                aimsMenNum += mn; aimsMenDen += md;
                aimsCitNum += cn; aimsCitDen += cd;
                aimsSovSum += parseFloat(p.responses.sov);
                aimsPosSum += p.responses.avgPosition;
                aimsCount++;
            });
            const aimsCfg = COMPETITOR_CONFIG.find(c => c.you);
            const result = [{
                name: aimsCfg.name, you: true,
                brandMention: `${aimsMenNum}/${aimsMenDen}`,
                avgRanking: aimsCount > 0 ? +(aimsPosSum / aimsCount).toFixed(1) : 0,
                citations: `${aimsCitNum}/${aimsCitDen}`,
                sov: `${aimsCount > 0 ? (aimsSovSum / aimsCount).toFixed(1) : '0'}%`,
                sentiment: aimsCfg.sentiment, sentimentClass: aimsCfg.sentimentClass, descriptors: aimsCfg.descriptors
            }];

            // Compute each other competitor from per-prompt competitor data
            COMPETITOR_CONFIG.filter(c => !c.you).forEach(cfg => {
                let menNum = 0, menDen = 0, citNum = 0, citDen = 0;
                let sovSum = 0, posSum = 0, posCount = 0, rowCount = 0;
                filtered.forEach(p => {
                    const cd = p.responses.competitors && p.responses.competitors[cfg.name];
                    if (!cd) return;
                    menNum += cd.mentions; menDen += cd.total;
                    citNum += cd.cited; citDen += cd.citedTotal;
                    sovSum += cd.sovPct;
                    rowCount++;
                    if (cd.mentions > 0) { posSum += cd.avgPosition; posCount++; }
                });
                result.push({
                    name: cfg.name, you: false,
                    brandMention: `${menNum}/${menDen}`,
                    avgRanking: posCount > 0 ? +(posSum / posCount).toFixed(1) : 0,
                    citations: `${citNum}/${citDen}`,
                    sov: `${rowCount > 0 ? (sovSum / rowCount).toFixed(1) : '0'}%`,
                    sentiment: cfg.sentiment, sentimentClass: cfg.sentimentClass, descriptors: cfg.descriptors
                });
            });

            return result;
        },

        // ---- Brand Sentiment (derived from filtered prompt set) ----
        getBrandSentiment(promptList) {
            if (!promptList) promptList = this.getActivePrompts();
            const filtered = promptList.filter(p => p.responses && p.responses.sentimentScore !== undefined);
            if (!filtered.length) {
                return { score: 0, tier: 'Neutral', responses: 0, pos: 33, neu: 34, neg: 33, positiveDescriptors: [], negativeDescriptors: [] };
            }

            const avgScore = Math.round(filtered.reduce((sum, p) => sum + p.responses.sentimentScore, 0) / filtered.length);

            // Aggregate descriptor mention counts
            const posMap = {}, negMap = {};
            filtered.forEach(p => {
                (p.responses.sentimentDescriptors.pos || []).forEach(d => { posMap[d] = (posMap[d] || 0) + 1; });
                (p.responses.sentimentDescriptors.neg || []).forEach(d => { negMap[d] = (negMap[d] || 0) + 1; });
            });
            const totalPos = Object.values(posMap).reduce((a, b) => a + b, 0);
            const totalNeg = Object.values(negMap).reduce((a, b) => a + b, 0);

            const positiveDescriptors = Object.entries(posMap)
                .sort((a, b) => b[1] - a[1]).slice(0, 5)
                .map(([word, count]) => ({ word, count, share: `${Math.round(count / totalPos * 100)}%` }));
            const negativeDescriptors = Object.entries(negMap)
                .sort((a, b) => b[1] - a[1]).slice(0, 3)
                .map(([word, count]) => ({ word, count, share: `${Math.round(count / totalNeg * 100)}%` }));

            // Sentiment distribution derived from score
            const pos = avgScore - 13;
            const neg = Math.round((100 - avgScore) * 0.35);
            const neu = 100 - pos - neg;
            const tier = avgScore >= 70 ? 'Positive' : avgScore >= 55 ? 'Neutral' : 'Negative';

            return { score: avgScore, tier, responses: filtered.length * 5, pos, neu, neg, positiveDescriptors, negativeDescriptors };
        },

        // ---- Key Topics (derived from filtered prompt set) ----
        getKeyTopics(promptList) {
            if (!promptList) promptList = this.getActivePrompts();
            const filtered = promptList.filter(p => p.responses && p.responses.topics);

            const topicMap = {};
            filtered.forEach(p => {
                p.responses.topics.forEach(t => {
                    if (!topicMap[t.name]) topicMap[t.name] = { hits: 0, yourBrandHits: 0 };
                    topicMap[t.name].hits++;
                    if (t.yourBrand) topicMap[t.name].yourBrandHits++;
                });
            });

            const topics = Object.entries(topicMap)
                .map(([name, d]) => ({
                    name,
                    hits: d.hits,
                    num: d.yourBrandHits,
                    den: d.hits,
                    pct: Math.round(d.yourBrandHits / d.hits * 100)
                }))
                .sort((a, b) => b.hits - a.hits);

            return {
                leaders: topics.filter(t => t.pct >= 60),
                battles: topics.filter(t => t.pct >= 30 && t.pct < 60),
                blinds:  topics.filter(t => t.pct < 30),
            };
        },

        getPlatformRadar() {
            return { chatgpt: 87, gemini: 71, perplexity: 79, googleAI: 64, aiOverview: 52 };
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
