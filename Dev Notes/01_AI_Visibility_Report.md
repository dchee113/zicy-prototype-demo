# Note to Developer — AI Visibility Report

> This page is the main dashboard. The notes below describe **what's changed** from the original and what you need to build in the production version.

---

## What's Changed

### 1. Tag Filter on Individual Tracked Prompts Section

**Original:** The "Individual Tracked Prompts" table at the bottom of this page only had platform filter pills (All Platforms, ChatGPT, Gemini, etc.).

**New:** A **"Filter by tag"** dropdown has been added alongside the platform pills. This lets users filter the prompt table to show only prompts that have a specific tag.

**How it works:**
- Dropdown opens a panel showing checkboxes for all confirmed tags in the user's tag library
- User can select one or more tags — prompts are filtered using **OR logic** (show prompts matching *any* selected tag)
- A "Clear all" button resets the filter
- When a tag filter is active, a note appears above the table indicating which tags are filtering the results
- The table still supports platform filtering on top of tag filtering (both filters work together)

### 2. Tag Pills Visible on Prompt Rows

**Original:** Prompts in the table only showed the prompt text and performance metrics.

**New:** Each prompt row now shows its **tag pills** alongside the prompt text. Tags appear as small grey labels. If a prompt has more than 2 tags, it shows the first 2 and a "+N more" indicator.

### 3. Dashboard Metric Cards — No Change to Structure

The top-level metric cards (Brand Mentions Coverage, Share of Voice, Website Citations Coverage, Average Ranking) and the Competitive AI Performance table are **unchanged** in structure.

> **Future consideration:** When tag filtering is active on the embedded prompt table, should the top-level metric cards and competitive table also recalculate to reflect only the filtered subset? This is **not yet implemented** in the mockup — flagging for discussion.

---

## Not Shown in Mockup

- **Loading states** when tag filter is applied and data recalculates
- **Empty state** if no prompts match the selected tag filter (show a message like "No prompts match the selected tags")
- **Performance Trends chart** is not included in this mockup — when it's built, decide whether tag filtering should also affect trend data
