# Note to Developer — Tracked Prompts Tab

> This is the "Tracked Prompts" tab within Prompt Manager. The notes below describe **what's changed** from the original and what you need to build in the production version.

---

## What's Changed

### 1. Tag Filter Dropdown (New)

**Original:** Only platform filter pills existed.

**New:** A **"Filter by tag"** dropdown has been added to the right side of the controls row, next to the search bar.

**How it works:**
- Click the dropdown trigger → opens a panel with tag checkboxes
- Lists all **confirmed** tags from the tag library
- Selecting tags filters the table using **OR logic** — show any prompt with at least one of the selected tags
- A "Clear all" button resets the tag filter
- When tags are selected, a filter note appears below showing the active filters and count
- Tag filter + platform filter + search all work independently together

### 2. Tag Pills on Prompt Rows (New)

**Original:** Prompts only displayed the prompt text and metric columns.

**New:** Each prompt row shows its assigned **tag pills** next to the prompt text.

- Tags display as small, compact grey pills
- **Collapsed row:** First 2 tags shown, remaining as "+N more" indicator
- **Expanded row:** ALL tags are shown (no truncation)
- Tags are read-only on this tab — editing tags happens on the Manage Prompts tab

### 3. Summary Statistics Recalculate with Filters

**Original:** Summary stats always showed totals for all active prompts.

**New:** When a tag filter is applied, the summary statistics at the top **recalculate** to show metrics for only the filtered subset. Numbers dynamically update as tags are selected/deselected.

### 4. Expandable Row — Per-Platform Breakdown (Unchanged)

Clicking a prompt row still expands to show per-platform breakdown. No changes from original.

---

## Not Shown in Mockup

- **Loading states** when filters are applied
- **Empty state** when tag filter returns no matching prompts
- **Mobile / responsive** behavior for the tag filter dropdown
