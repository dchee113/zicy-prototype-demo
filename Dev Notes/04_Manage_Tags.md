# Note to Developer — Manage Tags Tab

> This is the "Manage Tags" tab within Prompt Manager. This tab is **entirely new** — it does not exist in the original system. Everything described below needs to be built from scratch.

---

## Overview

This is a dedicated tag management interface using a **two-panel layout**:
- **Left panel:** Tag list (create, search, browse)
- **Right panel:** Tag detail (view details, edit, manage assigned prompts)

---

## Left Panel — Tag List

### Create New Tag (Top of Panel)

The "Create" section sits at the **top of the left panel, above the search bar**. Creating a tag is a primary action on this tab.

- Styled input with a visible blue **"+ Create"** button next to it
- Hint text below: "Max 4 words per tag"
- User types a tag name and clicks "+ Create" or presses Enter
- **On success:** toast notification ("Tag 'X' created"), input clears, new tag is **auto-selected** in the list, right panel immediately shows its detail with "Assigned to 0 prompts" and a prominent "Assign to Prompts" button
- **Validation rules:**
  - Tag name cannot be empty
  - Maximum 4 words
  - No duplicate names (case-insensitive)
- On validation error, show a toast notification with the error message

### Tag Search

Below the create input. Filters the tag list in real-time by tag name. Case-insensitive.

### Tag Summary Bar
- Shows total counts: e.g., "12 tags · 10 in use · 2 unused"
- "In use" = has at least one active prompt assigned
- "Unused" = exists in the library but is not on any active prompt

### Tag List Items
- Each tag row shows:
  - Tag name
  - Prompt count badge (number of active prompts using this tag)
  - A "sort" indicator — list can be sorted by name (A→Z / Z→A) or by prompt count
- Clicking a tag row selects it and loads the detail panel on the right
- The selected tag is visually highlighted

---

## Right Panel — Tag Detail

When no tag is selected, the panel shows a placeholder message: "Select a tag to view details".

When a tag is selected:

### Tag Header
- Tag name displayed prominently
- **Rename:** An edit/pencil button next to the name. Clicking it turns the name into an inline editable text field. Same validation rules as creation (max 4 words, no duplicates).

### Action Buttons
- **Assign to Prompts** — Opens a modal to bulk-assign this tag to multiple prompts
- **Delete Tag** — Opens a confirmation modal

### Assigned Prompts List
- Shows all prompts currently using this tag (both active and draft)
- Each prompt row shows:
  - Prompt text
  - A remove/unlink button (✕) to remove this tag from that prompt
- If 0 prompts assigned: empty state with "No prompts assigned to this tag"
- Removing a tag from a prompt here updates the prompt's tag list everywhere

---

## Modals

### Assign Tag Modal
- Title: "Assign [Tag Name] to Prompts"
- Shows a searchable list of all prompts (with checkboxes)
- Prompts already tagged are excluded from the list
- User can check/uncheck prompts and click "Assign Tag" to save
- Tag limit still applies (max 5 per prompt) — if a prompt already has 5 tags, it should be indicated and the checkbox disabled

### Delete Tag Modal
- Confirmation dialog: "Are you sure you want to delete [Tag Name]?"
- Shows how many prompts will be affected (e.g., "This tag is assigned to 4 prompts. It will be removed from all of them.")
- Deleting a tag removes it from the library **and** unlinks it from all prompts

---

## Syncing with Other Tabs

- Tags created here are immediately available in the tag editor on the Manage Prompts tab
- Tags deleted here are removed from all prompts across the system
- Prompt counts update in real time when tags are assigned/unassigned from other parts of the app

---

## Not Shown in Mockup

- **Tag merge** — The planning notes mention the ability to merge two tags (combine them into one). This is **not yet in the mockup** but may be a future addition
- **Tag reordering / custom sorting** beyond name and count
- **Bulk delete** of multiple tags at once
- **Empty state** for the tag list when a user has no tags yet
