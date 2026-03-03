# Zicy Tag Management — UI/UX Instructions Update 1.3

**Date**: February 2026
**For**: Antigravity Development Team
**Covers**: 3 updates across Prompt Manager tabs + shared table on AI Visibility Report dashboard

---

## Update 1: Tracked Prompts Tab & AI Visibility Report — Tag Filter & Compact Tag Display

**Note:** The Tracked Prompts tab and the AI Visibility Report dashboard share the same prompt table component. All changes below apply to both.

### Redesign per-row tag pills as compact metadata

Keep tags visible under each prompt in the table, but make them **significantly smaller** than the tags in the Manage Prompts tab. These are metadata labels, not interactive elements.

**Sizing:**
- Tag pills in Tracked Prompts / AI Visibility Report should be noticeably smaller than the Manage Prompts tag pills
- Smaller font size (~11px vs ~13px on Manage Prompts)
- Reduced padding (e.g., 2px 8px vs 4px 12px)
- No × buttons — display-only, not editable
- Muted grey styling — should feel like secondary info, not competing with prompt text or metrics

**Display cap:**
- Show a maximum of **2 tag pills** per prompt row
- If a prompt has 3+ tags, show 2 pills + a `+N` overflow badge (same compact size)
- Clicking or hovering the `+N` badge shows a tooltip listing all remaining tags
- Truncate individual tag names at ~20 characters with ellipsis if needed

**Visual hierarchy (prompt row, top to bottom):**
```
What is the best data center with disaster recovery services in Malaysia?
[Disaster Recovery] [Malaysia]                    ← compact, muted, small
```

The tags should feel like a footnote — present but clearly subordinate to the prompt text and the metric columns.

### Replace tag pill row with a dropdown filter

The current "Filter by tag:" row that lists all tags as horizontal pills should be replaced with a **multi-select dropdown**.

**Placement:** Same location — below the Summary Statistics cards, on the same row as the search box.

```
[🔍 Search prompts...]          [Filter by tag ▾]
```

**Dropdown behavior:**
- Label: "Filter by tag" with a dropdown chevron (▾)
- On click: opens a dropdown panel with checkboxes next to each tag name
- Users can **select multiple tags** at once
- Selected tags appear as small pills inside or below the dropdown (standard multi-select pattern)
- Include a "Clear all" option to reset the filter
- Include a search/filter field inside the dropdown if the tag list is long (10+)

**When filter is active:**
- The dropdown label updates to show selection (e.g., "2 tags selected" or shows the pill names)
- Table filters to show only prompts that have **any** of the selected tags (OR logic)
- Summary Statistics cards **recalculate** for the filtered subset only
- Totals row recalculates
- Add a visible indicator: e.g., "Showing 5 of 12 prompts" near the table or below the filter

---

## Update 2: Manage Prompts Tab — Allow New Tag Creation in "+ Add" Dropdown

### Current behavior
The "+ Add" dropdown on each prompt row shows existing tags only with a "Search or create tag..." field. Users can only select from existing tags in the Tag Manager.

### New behavior
Allow users to **create a new tag directly from the dropdown** without leaving the page.

**How it works:**
1. User clicks "+ Add" on a prompt
2. Dropdown opens with search field and existing tag list
3. User types a tag name that doesn't match any existing tag
4. A **"+ Create [typed name]"** option appears at the bottom of the dropdown list
5. Clicking it:
   - Creates the tag in the Tag Manager immediately
   - Assigns it to the current prompt
   - The new tag appears as a pill on that prompt

**Tag color rules still apply:**
- If the prompt is a **Draft**: new tag shows in **orange** (dashed border) — it's created in the Tag Manager but visually flagged as new until the prompt is activated
- If the prompt is **Active**: new tag shows in **grey** (confirmed) — it's created and confirmed in the Tag Manager immediately

**Sync:** The new tag appears in the Manage Tags tab and is available for selection across all prompts from that point forward.

---

## Update 3: Manage Tags Tab — Two-Panel Layout Redesign

### Remove the current full-width table layout entirely

The current single-table layout has too little data to justify full-width rows. Replace with a **two-panel master-detail layout**.

### Layout Structure

```
┌──────────────────────────┬─────────────────────────────────────────┐
│                          │                                         │
│  TAG LIBRARY (left)      │  TAG DETAIL (right)                     │
│  ~35-40% width           │  ~60-65% width                          │
│                          │                                         │
│  [+ Create Tag]          │  Selected tag details,                  │
│  [🔍 Search tags...]     │  assigned prompts,                      │
│  12 tags · 9 in use      │  and actions                            │
│                          │                                         │
│  [Tag A]         4       │                                         │
│  [Tag B]         2       │                                         │
│  [Tag C]  ●      0       │                                         │
│  [Tag D]         1       │                                         │
│  ...                     │                                         │
│                          │                                         │
└──────────────────────────┴─────────────────────────────────────────┘
```

A subtle vertical divider or slight background color difference separates the two panels.

### Left Panel — Tag List

**Header area:**
- "Tag Library" heading with subtitle: "Organize your tag library and bulk-assign tags across prompts."
- "+ Create Tag" button (top right of the panel)
- Search bar: "Search tags..."
- Summary line: "12 tags · 9 in use · 3 unused" (muted grey text)

**Tag list:**
- Each row is compact (~40-44px height):

```
[Tag Pill]                           4 prompts
```

- Tag pill on the left, prompt count on the right (muted grey, right-aligned)
- **Selected state:** light blue background or left border accent on the active row
- **Unused tags (0 prompts):** tag pill in faded/muted style, count shows "0 prompts" in amber or lighter grey text
- Clicking anywhere on a row selects that tag and loads its details in the right panel
- Default sort: alphabetical by tag name

### Right Panel — Tag Detail View

**Empty state (no tag selected):**
- Centered text: "Select a tag to view details"
- Light/muted styling

**When a tag is selected:**

**Header area:**
- Tag name as a heading (~18-20px semi-bold)
- Edit (✏️) and Delete (🗑️) icons next to the name
- Prompt count line: "Assigned to 4 prompts"

**Assigned prompts list:**
- List of prompt texts currently using this tag
- Each prompt has a × button on the right to remove the tag from that prompt
- Clean rows with subtle dividers

**Assign action:**
- Below the prompt list: **"+ Assign to More Prompts"** button
- Clicking opens a **dropdown or inline panel within the right panel** (not a modal):
  - Search field at top
  - List of prompts that don't already have this tag (checkboxes for multi-select)
  - "Apply" button to confirm
- After applying: prompt list updates, count in left panel updates

**Empty state (tag with 0 prompts):**
- Tag name, edit/delete actions
- "No prompts assigned to this tag"
- Prominent "+ Assign to Prompts" button

### Tag Deletion (from right panel)

- **Tag with 0 prompts:** Simple confirmation: "Delete this tag?"
- **Tag with assigned prompts:** Confirmation showing impact: "This tag is assigned to X prompts. Removing it will untag those prompts. Continue?" — Cancel / Delete buttons

### Create Tag Flow

1. User clicks "+ Create Tag" in the left panel
2. Inline input field appears at the top of the tag list (or a small popover)
3. User types the tag name, hits Enter or clicks confirm
4. New tag appears in the list with 0 prompts
5. Automatically selected in the right panel so user can immediately assign prompts

---

## Summary of Changes

| Tab / Page | What Changed |
|-----|-------------|
| **Tracked Prompts** | Keep per-row tags but redesign as compact metadata pills (smaller, muted, display-only, capped at 2 + overflow). Replace horizontal tag filter pills with a multi-select dropdown. Summary stats recalculate when filtered. |
| **AI Visibility Report** | Same compact tag pills and multi-select dropdown filter on the shared prompt table at the bottom of the dashboard. |
| **Manage Prompts** | Add "+ Create [name]" option in the tag dropdown so users can create new tags inline without leaving the page. |
| **Manage Tags** | Full redesign from single table to two-panel master-detail layout. No modals. Browse tags on left, manage tag details on right. |