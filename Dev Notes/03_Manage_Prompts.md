# Note to Developer — Manage Prompts Tab

> This is the "Manage Prompts" tab within Prompt Manager. This tab has the **most changes** from the original. The notes below describe what's new and what you need to build.

---

## What's Changed

### 1. Category Column Removed

**Original:** Each prompt row had a "Category" column with an AI-assigned label.

**New:** The Category column is **completely removed** from all tables (Draft, Active, Paused). Tags fully replace the old category concept. Table columns are now: **Prompt, Tags, Actions**.

### 2. Single Category → Multi-Tag System

**Original:** Each prompt had a single, AI-assigned "Category" label (display-only, not editable).

**New:** Each prompt now supports **multiple tags** (up to 5). Tags replace the old category concept entirely.

- Tags appear as pill-shaped labels on each prompt row
- **Existing/confirmed tags** appear in grey with solid border
- **New AI-suggested tags** (on draft prompts only) appear in **orange with dashed borders** to visually distinguish them
- Each tag has a ✕ remove button
- An "+ Add" button appears if under 5 tags

### 3. Inline Tag Editing (New)

**Original:** No way to edit categories.

**New:** Users can click "+ Add" on any prompt to open an **inline tag editor popup**.

**How the tag editor works:**
- Shows a list of currently assigned tags (with ✕ remove buttons)
- A search/create input field at the bottom
- Typing in the search field suggests matching tags from the confirmed tag library
- If no existing tag matches, user can create a new tag on the spot (it gets added to the tag library)
- Maximum 5 tags per prompt — when limit is reached, a warning appears and no more tags can be added
- Cancel and Save buttons to confirm changes
- The popup is positioned relative to the prompt card that triggered it

### 4. AI Tag Suggestions on Draft Prompts (New)

**Original:** AI auto-assigned a single category during prompt generation. No user interaction.

**New:** When a prompt is generated (either via "Generate More Prompt" or by the system during onboarding):
- AI suggests tags for each draft prompt
- AI **prioritizes existing tags** from the user's tag library — it should match against the confirmed library first
- When no existing tag fits, AI **suggests a new tag** — these appear in orange with dashed borders
- Users can review, add, or remove suggested tags before activating

**For custom prompts** (added via "Add Custom Prompt"):
- AI should also suggest tags after the custom prompt is created
- The prompt enters Draft state with AI-suggested tags, same as generated prompts

> **Note:** A new AI system prompt will need to be created for tag suggestion. It must receive: the prompt text, the business profile, and the full confirmed tag library. It must return suggested tags, each marked as `existing` or `new`.

### 5. Tag Confirmation on Activation (New)

**Original:** Activating a draft just changed its state.

**New:** When a draft prompt is activated:
- Any **new tags** (orange, dashed) on that prompt are **confirmed** — they get added to the Tag Library as permanent tags
- Their visual style changes from orange/dashed to grey/solid
- The activation modal shows how many new tags will be created (e.g., "Activating will create 1 new tag: GPU Hosting")
- Once confirmed, these tags become available for AI to suggest on future prompts

### 6. Search & Filter (Minor Change)

Same search and state filters as original. No tag filter on this tab — tag filtering is on the Tracked Prompts tab.

---

## Not Shown in Mockup

- **AI tag suggestion API call** — In the real version, generating a prompt or adding a custom prompt should trigger an API call to get tag suggestions. The mockup uses hard-coded mock tags instead.
- **Loading state** while AI generates tag suggestions
- **Bulk activate** — If user wants to activate multiple drafts at once, what happens with tag confirmation? (Currently mockup only supports one-at-a-time activation)
- **Edit prompt text** — The mockup doesn't include a prompt text editing flow, but the original system supported it. Make sure tag editing and prompt text editing don't conflict.
