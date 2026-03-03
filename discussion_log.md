# Prompts Tag Management System — Discussion Log

**Session Date:** March 3, 2026
**Participants:** David, Antigravity

---

## Mockup Instruction: "Note to Developer" Button

### ✅ AGREED — Add to All 4 Pages

**Concept:** Each of the 4 pages/views in the mockup gets a **"Note to Developer"** button, positioned at the top center of the page. This is NOT part of the production UI — it's a **mockup-only tool** for developer handoff.

**Why this exists:** Instead of handing the dev a long, separate PRD document, the developer opens the mockup, sees the page visually, and clicks the "Note to Developer" button to get **page-specific instructions** right there in context. Each page has its own notes describing exactly what changed from the original and what needs to be built.

**Implementation:**
- Button appears at the top center of each page (prominent, clearly a dev tool — styled distinctly from the app UI)
- Clicking it opens a popup/modal displaying the contents of the corresponding `Dev Notes/*.md` file
- Not meant to represent any real UI element — purely a developer communication tool

**4 Dev Note files created:**
- `Dev Notes/01_AI_Visibility_Report.md`
- `Dev Notes/02_Tracked_Prompts.md`
- `Dev Notes/03_Manage_Prompts.md`
- `Dev Notes/04_Manage_Tags.md`

Each file follows the structure: **What's Changed** (original vs new, behavioral) → **Component-level instructions** → **Not Shown in Mockup** (loading states, edge cases, etc.). Notes are self-contained, no codebase references, behavioral language only.

---

## Round 1: Manage Prompts & Manage Tags Feedback

### ✅ AGREED — Remove Category Column (Manage Prompts Tab)
- Remove the "Category" column from all tables (Draft, Active, Paused)
- Tags fully replace the old single-category concept
- No other structural changes to these tables

### ✅ AGREED — Create New Tag UX Redesign (Manage Tags Tab)

**Problems identified:**
- Create input is too subtle (greyed placeholder, blends in)
- No confirmation feedback on creation (no toast, no visual indicator)
- New tag doesn't auto-select — user has to manually find and click it
- Natural next step (assigning prompts) isn't anticipated by the UX

**Agreed solution:**
1. **Move "Create" above Search** — creating a tag is a primary action, search is secondary
2. **Styled input group** — solid bordered input + visible blue "+ Create" button + hint text ("Max 4 words per tag")
3. **Post-creation flow:**
   - Success toast: "Tag 'X' created"
   - Input clears
   - New tag is auto-selected in the left panel
   - Right panel shows tag detail with 0 prompts + prominent "Assign to Prompts" button
4. Validation errors show as error toasts (empty, >4 words, duplicate)

**Implementation plan approved.** See `implementation_plan.md`.

---

## Round 2: AI Visibility Dashboard Enhancements

### ✅ AGREED — Global Tag Filter Bar

- Persistent tag filter sits at the **top of the entire AI Visibility Report page**
- When tags are selected, **everything recalculates:**
  - Metric cards (Brand Mentions, SoV, Citations, Avg Position)
  - Competitive table (competitors change per tag cluster)
  - Performance trends (when built)
  - Individual tracked prompts table
- OR logic for tag filtering (any matching tag)
- This replaces the idea of having tag filtering only on the tracked prompts table

### ✅ AGREED — Performance by Tag Table (New Dashboard Section)

- Always-visible breakdown table, no clicks needed
- Each row = one tag, showing aggregated metrics for all prompts with that tag
- Prompts can appear in multiple tag rows (dimensional view, not mutually exclusive)
- **Add footnote:** *"Prompts may appear in multiple tag groups"*
- Status indicators per row: ✅ Strong, ⚠️ Mixed, ❌ Weak (based on thresholds)
- Clicking a tag row activates the global filter to drill into that cluster
- Sits between the metric cards and the competitive table

### ✅ AGREED — Export by Active Filters

**Export button design:**
- Export area should have **its own visual distinction** — a slightly different styled box/section, not just a floating button
- When no filters active: clean, neutral export area
- When filters active: the export area visually responds, making it clear the export is filter-aware
- **Dynamic label:** Shows tag/prompt count when filters are active (e.g., "Export Report · 2 tags · 10 prompts")

**Confirmation modal on export click:**
- Shows what's being exported: "Currently filtering by: Life Insurance, Young Adults (10 prompts)"
- Option to include all prompts (override filter)
- Format selection: PDF / Excel

### ✅ AGREED — Tag Health Indicators
- ✅ Strong: >80% coverage, top-2 position
- ⚠️ Mixed: 2-3/5 coverage or inconsistent
- ❌ Weak: <50% coverage, #4+ position, <5% SoV
- Exact thresholds TBD, but the concept is approved
- Applied to each row in the Performance by Tag table

### ✅ AGREED — Gap Detection
- Proactively surface prompts/tags where the brand has zero mentions
- Show as a callout/alert on the dashboard
- Include which competitors dominate that space
- Format TBD

### ✅ AGREED — Competitors Change by Tag
- When viewing a specific tag cluster, the competitive table recalculates to show tag-specific competitors
- Need to **make this clear to users** — design approach TBD

---

## Pending Discussion

### 🔄 AI-Generated Summary / Narrative
- Auto-generate a 3-4 sentence insight summary at the top of the dashboard
- Updates when tag filters change
- Would replace the manual workflow currently done via the `All Prompts Metrics Analysis System Prompt`
- **New data available since original system prompt:**
  - Sentiment analysis (score-based, 0-100)
  - Key topic extraction
  - This data can be incorporated into the narrative
- **Next step:** Discuss how to leverage sentiment + key topics in the AI-generated summary and broader dashboard

### 🔄 Slide-Ready PDF Export (v2)
- Formatted, near-client-ready export with narrative, charts, breakdowns
- Deferred to v2 after core features are built

### ❌ REJECTED — Saved Filter Presets
- Too complex for the value it provides
- Global filter + Performance by Tag table covers the use case sufficiently

---

## Decisions Still Needed

| # | Topic | Status |
|---|-------|--------|
| 1 | How to visually communicate "competitors change by tag" to users | To discuss |
| 2 | AI-generated summary — scope and data inputs (sentiment, key topics) | To discuss |
| 3 | Gap detection — exact UI placement and format | To discuss |
| 4 | Tag health indicator thresholds — exact numbers | To discuss |
| 5 | Export format — PDF layout, what sections to include | To discuss |
| 6 | Which of the dashboard enhancements go into THIS mockup update vs. future | To discuss |

---

## Process Notes

### ⚠️ Browser Preview — Always Start a Local Server First

The browser tool **cannot access local `file://` URLs**. Every time we need to verify a prototype in the browser, we must:

1. Start an HTTP server first: `python -m http.server 8080` (from the prototype directory)
2. Then open `http://127.0.0.1:8080/index.html` in the browser tool

This has tripped us up twice now. See skill: `.agent/skills/browser-preview/SKILL.md`
