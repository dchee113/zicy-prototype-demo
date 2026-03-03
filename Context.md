# Zicy Prompt Tracking System — Current State Context Document

**Prepared for**: Antigravity Development Team
**Date**: February 2026
**Purpose**: Provide full context on the current Prompt Tracking system before implementing the Tag Management update

---

## 1. What Zicy Does

Zicy is an AI traffic visibility platform. It tracks how often a brand gets mentioned when users ask AI chatbots (ChatGPT, Gemini, Perplexity, etc.) purchasing or recommendation questions.

The core value proposition: when someone asks ChatGPT "What's the best data center in Malaysia?", Zicy tells you whether your brand was mentioned, what position you appeared in, whether your website was cited, and how you compare to competitors — across multiple AI platforms, for multiple prompts, over time.

---

## 2. System Overview — How It Works

The system has four phases:

### Phase 1: Business Profile Setup
- User inputs their website URL
- AI analyzes the website and auto-populates: industry, products/services, target audience, geographic markets
- User reviews and confirms

### Phase 2: Prompt Generation & Curation
- AI generates 10-20 transactional, bottom-funnel prompts based on the business profile
- Prompts are buying-intent questions like "What is the best [product] for [audience] in [location]?"
- Different business models get different prompt strategies (retailers get "where to buy" prompts, manufacturers get "what's the best" comparison prompts, service providers get solution-focused prompts, etc.)
- Users review, select, edit, or add custom prompts
- Users can generate additional prompts incrementally (3-5 at a time), with the system avoiding duplicates against existing and previously deleted prompts

### Phase 3: Multi-Platform Monitoring
- Active prompts are executed across up to 5 AI platforms: **ChatGPT, Gemini, Perplexity, Google AI Mode, AI Overview**
- Not all platforms return results for every query (e.g., AI Overview doesn't trigger for every query)
- Full AI responses are captured and stored
- AI analysis extracts: all brand mentions (in order), brand positioning/ranking, website citations and links, share of voice

### Phase 4: Analytics & Reporting
- Aggregate dashboard with key performance metrics
- Individual prompt performance analysis
- Competitive intelligence
- Trend tracking over time (weekly/monthly)

---

## 3. Prompt Manager — Current UI Structure

The Prompt Manager has two tabs: **Tracked Prompts** and **Manage Prompts**.

### 3.1 Manage Prompts Tab

This is where users manage their prompt inventory. Prompts exist in one of three states:

| State | Description | Available Actions |
|-------|-------------|-------------------|
| **Draft** | Suggested prompts pending review | Activate (play), Edit, Delete |
| **Active** | Currently tracking across platforms | Pause, Delete |
| **Paused** | Temporarily stopped tracking | Reactivate (play), Delete |

**Key behaviors:**
- Paused prompts are excluded from dashboard data and reporting
- Each prompt has a **Category** label (currently auto-assigned during generation)
- Users can search and filter prompts by state (All, Drafts, Active, Paused)

**Prompt creation options:**
- **"+ Generate More Prompt"** — AI generates additional prompts based on the business profile
- **"+ Add custom Prompt"** — User manually creates a prompt

### 3.2 Tracked Prompts Tab

This is the analytics view showing performance data for all active prompts.

**Summary Statistics (top-level cards):**
- Total Prompts tracked
- Total Brand Mentions (across all prompts and platforms)
- Average Share of Voice (%)
- Website Citations (total count)

**Platform filter:** Users can view data for All Platforms, or filter by individual platform (ChatGPT, Gemini, Perplexity, Google AI Mode, AI Overview).

**Prompt performance table — columns:**

| Column | Description |
|--------|-------------|
| Prompt | The tracked question |
| Brand Mention Coverage | X out of Y platforms mentioned the brand (e.g., 5/5) |
| Position | Average ranking position across platforms (lower is better) |
| Share of Voice | Brand mentions as % of total brand mentions |
| Your Brand Mentions | Count of times your brand appeared |
| Total Brand Mentions | Count of all brand mentions in responses |
| Website Citation Coverage | X out of Y platforms cited your website (e.g., 3/5) |

**Row expansion:** Clicking a prompt row expands it to show per-platform breakdown with the same metrics for each individual platform.

**Totals & Averages row:** Bottom of table shows aggregate totals (e.g., 52/60 brand mentions, avg position 1.8, 32.2% SoV, 34/60 citations).

---

## 4. Single Prompt Analysis Page

Clicking any prompt in the Tracked Prompts tab opens a detailed analysis page for that specific prompt.

**Header section:**
- The exact prompt text
- Which platforms were analyzed (e.g., "Analysis across ChatGPT, Gemini, Perplexity, Google AI Mode")
- Brand Mention Coverage (X/Y platforms)
- Website Citation Coverage (X/Y platforms)
- Coverage by Platform — visual indicators showing which platforms mentioned the brand and which cited the website
- Average Position (#X.X across all platforms)
- Share of Voice (% across all platforms)

**Per-platform sections (expandable):**
Each platform gets its own collapsible section showing:
- **Summary bar:** Brand Mentioned (Yes/No), Position (#X), Mentions Frequency (count), Share of Voice (%), Website Cited (Yes/No)
- **Full AI Response:** The complete text response from that platform, with Expand/Collapse and "Copy Full Response" button
- **Brand Mentions panel:** Ranked list of all brands mentioned, each with a frequency count badge
- **Website Citations panel:** Ranked list of all websites cited, with full URLs

---

## 5. AI Visibility Report (Dashboard)

The main dashboard aggregates data across all active prompts and platforms.

**Top-level metrics:**

| Metric | Description |
|--------|-------------|
| Brand Mentions Coverage | % of total platform responses that mentioned the brand (e.g., 52/60 = 86.67%) |
| Share of Voice | Brand mentions as % of total brand mentions across all responses (displayed as donut chart) |
| Website Citations Coverage | % of total platform responses that cited the brand's website (e.g., 34/60 = 56.67%) |
| Average Ranking | Average position across all responses where brand was mentioned |

**Performance Trends:**
- Line chart showing Share of Voice and Your Brand Mentions over time
- Toggle between Weekly and Monthly views
- Shows delta values (e.g., 27.1% → 31.5%)
- Date range displayed (e.g., Dec 21 - Jan 19)

**Competitive AI Performance table:**
- Compares the target brand against competitors
- Competitor brands are auto-detected from the LLM responses (not manually configured)
- Columns: Brand Name, Brand Mention Coverage (X/total), Avg. Ranking, Citations (X/total), Share of Voice
- Target brand highlighted with "You" badge
- Shows top competitors ranked by share of voice

**Individual Tracked Prompts section:**
- Same prompt performance table as the Tracked Prompts tab, embedded at the bottom of the report
- Platform filter tabs (All Platforms, ChatGPT, Gemini, Perplexity, Google AI Mode, AI Overview)
- Expandable rows with per-platform breakdown

---

## 6. Current "Category" System (Relevant to Tag Management)

Currently, each prompt has a **Category** label. Examples from the live system:
- "Disaster Recovery Services"
- "Managed Services"
- "Colocation Services"
- "Cybersecurity Services"
- "Data Center"
- "Cloud Connectivity"
- "Data Backup Solution"

**Current behavior:**
- Categories are auto-assigned during prompt generation (based on the AI's categorization of the prompt topic)
- Categories appear as labels next to each prompt in the Manage Prompts view
- Categories are currently display-only — they are not used for filtering in the dashboard or reporting
- Users cannot edit categories

**What's changing (Tag Management update):**
- Categories will become user-editable tags
- Dashboard and reporting will support filtering by tags, allowing users to view metrics for specific clusters of prompts sharing the same tag
- This is the primary focus of the upcoming development work

---

## 7. Key Data Relationships

```
Business Profile
  └── Prompts (10-50+ per profile)
        ├── State: Draft | Active | Paused
        ├── Category (current) → Tag (upcoming)
        └── Platform Responses (up to 5 per prompt)
              ├── ChatGPT
              ├── Gemini
              ├── Perplexity
              ├── Google AI Mode
              └── AI Overview (when available)
                    ├── Full response text
                    ├── Brand mentions (ordered list with frequency)
                    ├── Website citations (URLs)
                    ├── Position (rank)
                    └── Share of Voice (%)

Dashboard aggregates:
  - Across all active prompts
  - Across all available platforms per prompt
  - Competitors auto-extracted from responses
  - Trends tracked over time (weekly/monthly)
```

---

## 8. Platform Notes

- **5 platforms tracked:** ChatGPT, Gemini, Perplexity, Google AI Mode, AI Overview
- Not all platforms return results for every prompt — AI Overview in particular doesn't trigger for every query
- Metrics like "Brand Mention Coverage" use the actual number of platforms that returned results as the denominator (e.g., 4/5 if AI Overview didn't trigger)
- The denominator in the Tracked Prompts table (e.g., 52/60 for 12 prompts × 5 platforms) represents total possible platform responses

---

*This document covers the current state of the Prompt Tracking system as of February 2026. The upcoming Tag Management feature will build on this foundation, specifically extending the Category system into user-editable tags with dashboard filtering capabilities.*