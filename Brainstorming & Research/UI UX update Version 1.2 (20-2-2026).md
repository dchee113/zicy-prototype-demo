# Zicy Tag Management — UX Updates & UI Instructions for Antigravity

**Date**: February 2026
**Context**: Updates to the Prompt Manager prototype to support multi-tag functionality across all three tabs.

---

## Part 1: UX Updates

These are flow and behavior changes to implement alongside the tag UI.

---

### 1.1 AI Should Auto-Suggest 2+ Tags Per Prompt

**Current behavior:** Each prompt gets 1 auto-generated tag based on its product/topic (e.g., "Data Center", "Disaster Recovery").

**New behavior:** AI should suggest **at least 2 tags** per prompt — one for the product/topic dimension, plus additional tags for other dimensions present in the prompt text (audience, geography, use case, etc.).

| Prompt | Old (1 tag) | New (2+ tags) |
|--------|-------------|---------------|
| "Best life insurance for young adults?" | `life insurance` | `life insurance`, `young adults` |
| "Best data center in Malaysia?" | `Data Center` | `data center`, `Malaysia` |
| "Best CRM for small business?" | `CRM` | `CRM`, `small business` |
| "Best dental clinic for root canal in KL?" | `Root Canal Treatment` | `root canal`, `Kuala Lumpur` |

This makes multi-tagging the default experience from day one. Users see that prompts naturally have multiple dimensions, and they're more likely to continue adding their own tags.

**Note:** A new system prompt for AI tag generation is required. To be developed separately.

---

### 1.2 Tag Filtering on Tracked Prompts Tab

**Current behavior:** Tracked Prompts tab shows all active prompts with metrics. Tags are display-only pills under each prompt. No filtering.

**New behavior:** Add a **Tag Filter** to the Tracked Prompts tab so users can filter the table and summary stats by tag.

**Why this matters:** Users add/edit tags in Manage Prompts, but the value of tagging — filtered reporting — should be visible in the same Prompt Manager context, not only on the separate AI Visibility Report page. This closes the feedback loop: tag a prompt → immediately see filtered analytics.

**Behavior when a tag filter is active:**
- Table shows only prompts with the selected tag
- Summary Statistics cards (Brand Mention Coverage, SoV, Website Citation Coverage, Average Ranking) recalculate for the filtered subset only
- Totals row recalculates
- Clear visual indicator that a filter is active (e.g., "Showing 3 of 12 prompts tagged: young adults")

---

### 1.3 Tag Color States in Draft vs Active

**Draft prompts — two tag styles:**
- **Existing tags** (already in Tag Manager): grey/default pill style
- **New AI-suggested tags** (not yet in Tag Manager): orange pill with dashed border, label above reads "X new tags will be created"

**On activation:**
- All tags convert to grey (confirmed) style
- New tags get added to the Tag Manager automatically
- No separate confirmation step needed for tags — activation confirms everything

**Active and Paused prompts:**
- All tags display in grey/default style (all are confirmed by this point)

---

### 1.4 Manage Tags Tab — Helper Text

Add a subtitle/description below "Tag Library" to position this tab clearly:

> **Tag Library**
> Organize your tag library and bulk-assign tags across prompts.

This helps new users understand this is the admin/power-user view for tags, while day-to-day tagging happens inline on the Manage Prompts tab.

---

### 1.5 "+ Add" Tag Interaction (Manage Prompts Tab)

Define what happens when a user clicks "+ Add" next to a prompt's tags:

1. A **dropdown/popover** opens, anchored to the "+ Add" button
2. **Search field** at the top — user can type to filter
3. **List of existing tags** from the Tag Manager (only tags NOT already on this prompt)
4. **"+ Create new tag"** option at the bottom if no match is found
5. Selecting a tag **immediately adds it** to the prompt (no confirm step)
6. The × on any tag pill removes it (this is the undo)

---

### 1.6 "Assigned Prompts" Count — Clickable (Manage Tags Tab)

The number in the "Assigned Prompts" column should be **clickable**.

**On click:** Inline expansion below the row (same pattern as Tracked Prompts per-platform drill-down) showing:
- List of prompt names currently using that tag
- Optional: × button next to each prompt to remove the tag from that prompt

This lets users see and manage tag assignments without leaving the page.

---

### 1.7 "+ Assign to Prompts" Behavior (Manage Tags Tab)

When clicked, opens a **modal or popover** showing:
- List of all prompts that **don't already have this tag**
- Checkboxes for multi-select
- Search/filter within the list
- "Apply" button to confirm assignment
- Count updates immediately after confirmation

---

## Part 2: UI Instructions

Direct implementation instructions for each tab.

---

### 2.1 Tracked Prompts Tab

**Add Tag Filter bar:**
- Place below Summary Statistics cards, on the same row as the search box
- Left side: 🔍 Search prompts...
- Right side (or next to search): Tag filter — either a dropdown ("Filter by tag: [All ▾]") or a horizontal row of clickable tag pills
- When a tag is selected, the filter is visually active (blue highlight on the selected tag, or filled pill style)
- Add a clear/reset option to remove the filter

**Multi-tag display under prompts:**
- Show up to **2 tag pills** under each prompt text
- If the prompt has more than 2 tags, show a `+N` overflow badge after the second pill
- Clicking `+N` opens a tooltip/popover showing all tags for that prompt
- Tags are display-only in this tab (no × close button, no "+ Add")

**Empty columns (if applicable):**
- If "Your Brand Mentions" and "Total Brand Mentions" columns are consistently empty or rarely populated, consider moving them into the expanded row view only. This frees horizontal space.
- If they are expected to populate, keep as-is.

---

### 2.2 Manage Prompts Tab

**Tags column — multi-tag handling:**
- Tags can **wrap within the cell** — rows are allowed to grow taller in this tab
- If a prompt has 4+ tags, show first 3 tags + `+N` badge. Clicking `+N` expands to show all.
- `+ Add` button remains **always visible** at the end of the tag list, never pushed off-screen by overflow

**Tag pill styling by state:**

| Prompt State | Tag Type | Pill Style |
|-------------|----------|------------|
| Draft | Existing tag (in Tag Manager) | Grey background, white text, × close |
| Draft | New AI-suggested tag (not in Tag Manager) | Orange/amber border (dashed), orange text, × close |
| Active | All tags | Grey background, white text, × close |
| Paused | All tags | Grey background, white text, × close |

**Draft section — new tag indicator:**
- When a draft prompt has new (orange) tags, show a label above or near the tags area: "X new tags will be created" in orange text
- This label disappears once the prompt is activated

**Action icon tooltips:**
- ✓ icon → tooltip: "Activate prompt"
- ⏸ icon → tooltip: "Pause tracking"
- 🗑 icon → tooltip: "Delete prompt"

---

### 2.3 Manage Tags Tab

**Table columns (updated):**

| TAG NAME | ASSIGNED PROMPTS | ACTIONS |
|----------|:----------------:|---------|
| [tag pill] | **4** (clickable) | + Assign to Prompts · ✏️ · 🗑️ |

**Assigned Prompts count:**
- Style as a **clickable link** (blue text or underline on hover)
- On click: inline expansion below the row showing assigned prompt names
- If count is **0**: display in faded/muted style as a visual cue that this tag is unused

**Sort arrows:**
- Add sort indicators to TAG NAME (alphabetical) and ASSIGNED PROMPTS (numeric) column headers
- Default sort: alphabetical by tag name

**Summary line above table:**
- Add a subtle text line between the search bar and the table:
- Format: "8 tags · 7 in use · 1 unused"
- Muted grey text, small font size

**No Bulk Tagging section:**
- Confirmed removed. The "+ Assign to Prompts" per-row action replaces it entirely.

---

### 2.4 Cross-Tab Consistency

**Tag pill styling:**
- Same border-radius, font size, and padding across all three tabs
- Grey confirmed style is identical everywhere
- Orange new-tag style only appears in the Draft section of Manage Prompts

**× close behavior:**
- Available on Manage Prompts tab (removes tag from that prompt)
- Available in the expanded view of Manage Tags (removes tag from a specific prompt)
- NOT available on Tracked Prompts tab (tags are display-only there)

**"+ Add" dropdown:**
- Same component whether triggered from Manage Prompts ("+ Add" per prompt) or when creating a tag manually
- Always searches existing Tag Manager library first, offers "Create new" as fallback

---

### 2.5 Dashboard (AI Visibility Report) — Tag Filter Placement

When tag filtering is added to the dashboard:
- Add a **Tag Filter dropdown or pill row** below the page header ("AI Visibility Report"), alongside or near the existing platform filter
- When a tag is selected, ALL dashboard metrics recalculate: Brand Mentions Coverage, Share of Voice, Website Citations Coverage, Average Ranking, Performance Trends chart, and Competitive AI Performance table
- The subtitle should update to reflect the filter: "Report based on 5 prompts and 5 platforms · Tag: young adults"

---

## To-Do List (For Us — Not Antigravity)

Items we need to prepare before or alongside this development:

- [ ] **Tag deletion confirmation modal** — define behavior when deleting a tag that's assigned to prompts (recommended: confirmation dialog showing affected prompt count)
- [ ] **System prompt for AI tag generation** — new prompt that receives prompt text + business profile + existing tag library, outputs 2+ suggested tags marked as existing or new
- [ ] **Decide: tag limit per prompt** — unlimited or capped? (e.g., max 5-10)
- [ ] **Decide: tag naming rules** — character limit, case sensitivity, allowed characters
- [ ] **Decide: migration path** — how do existing single categories convert to tags on launch?
- [ ] **Decide: cross-profile tags** — are tags per business profile or shared across the account?
- [ ] **Modal for "+ Assign to Prompts"** — design the prompt selection modal
- [ ] **Modal for tag deletion** — design the confirmation dialog
- [ ] **Dashboard tag filter behavior** — AND vs OR logic when multiple tags selected