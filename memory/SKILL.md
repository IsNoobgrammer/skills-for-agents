---
name: memory
description: >
  MANDATORY STARTUP SKILL. Use this to maintain continuity between turns and sessions.
  You MUST read `memory/data/manifest.json` at the start of every complex task to align
  with the user's identity, preferences, secrets, and active context.
  Proactively capture every implicit preference, technical bias, and recurring command
  sequence without being asked. If the user says "I like X", "I hate Y", "Use Z",
  or "Here is my key", this skill MUST trigger.
  It is the sentinel of the user's personal state, ensuring no knowledge is lost
  to context window decay.
domain: process
composable: true
yields_to: [voice, craft]
---

# Memory: The Persistent Context Engine

I bridge sessions. I prevent amnesia. I maintain a living database of who the user is, what they prefer, and what happened — structured for instant retrieval, not archaeological digs through giant log files.

---

## When to Use

- **Session startup**: Read `manifest.json` → know the user in 2 seconds
- **Preference capture**: User corrects you, expresses a bias, or picks a tool — write it down silently
- **Secret storage**: User shares an API key, token, or credential — vault it immediately
- **Session end**: Write the day's handover into today's journal entry
- **Pattern detection**: Same question or correction twice → promote to a preference
- **Weekly maintenance**: Old journal files pile up → summarize and archive them

---

## Core Instructions

### 1. The Manifest (`data/manifest.json`)

The single source of truth. Read this file first on every startup — it tells you where everything is without scanning the filesystem.

```json
{
  "version": 2,
  "last_updated": "2026-04-28T03:52:00+05:30",
  "identity": {
    "name": "Shaurya",
    "primary_lang": "Python",
    "updated": "2026-04-28"
  },
  "secrets": {
    "gemini-api": { "file": "vault/gemini.enc", "stored": "2026-04-27", "status": "active" }
  },
  "preferences": {
    "tooling": { "file": "prefs/tooling.md", "updated": "2026-04-28" }
  },
  "playbooks": {
    "deploy-skill": { "file": "playbooks/deploy-skill.md", "updated": "2026-04-28" }
  },
  "recent_journal": "journal/2026-04-28.md",
  "active_project": {
    "name": "AntiGravity Skills Ecosystem",
    "goal": "Building the best AI skill system",
    "updated": "2026-04-28"
  }
}
```

**Update the manifest whenever you write to any data file.** The manifest is the index — if it's stale, the system is broken.

### 2. The Daily Journal (`data/journal/YYYY-MM-DD.md`)

One file per day. This is the innovation that prevents log files from becoming unreadable monsters.

**Create a new journal file when today's date doesn't have one.** Format:

```markdown
# Journal: 2026-04-28

## 03:52 — Session Start
- **Task**: [What the user wants to do]
- **Context**: [Relevant background]

## 04:15 — Preference Captured
- **Category**: coding-style
- **Key**: component-paradigm
- **Value**: Functional components over class components
- **Source**: User correction ("Actually, use functional components")

## 05:30 — Handover
- **Last Action**: [What was done]
- **Blockers**: [What's stuck, if anything]
- **Next**: [What the next session should do first]
- **Mood**: [Productive / Frustrated / Exploratory / Rush]
```

**Rules**:
- Timestamps use `HH:MM` in the user's local timezone
- Entry types: `Session Start`, `Preference Captured`, `Secret Stored`, `Workflow Saved`, `Decision Made`, `Handover`
- The **last entry of the day is the handover** — no separate handover file needed
- If the user starts a second session on the same day, append to the existing journal file

### 3. Identity File (`data/identity.md`)

The user's profile — who they are, how they work, what they hate. Read this alongside the manifest on startup.

```markdown
# Identity

## Who
- **Name**: [Name]
- **Handle**: [GitHub/Online handle]
- **Timezone**: [TZ]

## Technical DNA
- **Primary Languages**: [Languages]
- **Stack**: [Frameworks, tools]
- **Editor**: [Editor]
- **OS**: [OS]
- **Package Manager**: [PM]

## Current Focus
- [Active project/goal]

## Anti-Preferences (Never Do)
- [Things the AI must never do for this user]
```

Update this file whenever a core identity fact changes. This is the "who am I talking to?" file.

### 4. Preferences (`data/prefs/{category}.md`)

Group preferences by category, not by individual micro-decision. Categories:

| File | What Goes Here |
|------|---------------|
| `prefs/tooling.md` | Package manager, build tools, CLI tools, node version |
| `prefs/coding-style.md` | Formatting, naming conventions, paradigm choices |
| `prefs/ui.md` | Design preferences, color schemes, framework choices |
| `prefs/workflow.md` | How they like to work — plan first? Dive in? Review style? |

Format inside each file:

```markdown
# Tooling Preferences

| Preference | Value | Captured |
|-----------|-------|----------|
| Package Manager | npm | 2026-04-28 |
| Build Tool | Vite | 2026-04-28 |
```

**Silent capture**: When the user corrects you or expresses a preference, update the relevant prefs file immediately. Do not ask permission for technical preferences. Log the capture in today's journal.

### 5. Vault (`data/vault/{service-name}.enc`)

One file per service. Contains the raw credential and minimal metadata:

```
SERVICE: Gemini API
KEY: AIzaSy...
STORED: 2026-04-28
NOTES: Personal account, free tier
```

**Security rules**:
- Never print vault contents in chat unless the user explicitly says "show me the key"
- Always refer to secrets by name: "Your Gemini API key is stored and available"
- Update `manifest.json` secrets index when adding/removing

### 6. Playbooks (`data/playbooks/{name}.md`)

Step-by-step guides for fragile or complex procedures the user has done before:

```markdown
# Deploy Skill to GitHub

1. Ensure SKILL.md frontmatter is valid
2. Run SIP audit checklist
3. `git add . && git commit -m "feat(skill-name): description"`
4. `git push origin main`
5. Verify GitHub Actions pass

## Gotchas
- Description must be < 1000 chars
- .gitignore must cover data/ directories
```

Save a playbook whenever a multi-step procedure succeeds for the first time, or when the user says "I keep doing this" or "remember how to do this."

---

## Startup Protocol

When a new session or complex task begins, execute these steps in order:

1. **Read `data/manifest.json`** — get the full index in one read
2. **Read `data/identity.md`** — know who you're talking to
3. **Check today's journal** — does `data/journal/YYYY-MM-DD.md` exist? If yes, read the last entry for continuity. If no, create it with a `Session Start` entry
4. **Scan for stale journals** — if any journal files are older than 7 days, queue them for archival (do it after the main task, not during startup)

This takes 2 file reads + 1 directory listing. Fast.

---

## Archive Protocol (Weekly Compaction)

When journal files older than 7 days accumulate:

1. Group them by ISO week number (e.g., `2026-W17`)
2. Read all entries from that week
3. Write a summary to `data/archive/week-YYYY-WXX.md`:

```markdown
# Week 2026-W17 (Apr 21–27)

## Key Decisions
- [Major choices made]

## Preferences Changed
- [What was added/updated in prefs/]

## Projects Active
- [What was being worked on]

## Notable Sessions
- Apr 25: [Brief summary]
- Apr 27: [Brief summary]
```

4. Delete the original daily journal files for that week
5. Update `manifest.json` with the archive reference

**Result**: The `journal/` directory never exceeds ~14 files (current + previous week buffer).

---

## Retrieval Protocol

When you need to find something:

1. **Check `manifest.json` first** — it has direct paths to every stored file
2. **For recent context**: Read today's and yesterday's journal entries
3. **For older context**: Check `archive/` weekly summaries
4. **For specific values**: Read the relevant `prefs/` or `vault/` file directly
5. **Last resort**: `grep -rn "keyword" memory/data/` — but this should be rare if the manifest is maintained

---

## Boundaries

- **No duplication**: If info belongs in a Knowledge Item (repository-wide context), don't duplicate it here. Memory is for *user-specific* and *session-specific* state
- **Masking**: Never print raw vault contents unless explicitly asked. Refer by name
- **No monolith files**: If any single file exceeds 200 lines, it needs to be split or archived. The whole point of this architecture is preventing bloat
- **Prefs are latest-wins**: If a preference changes, update in place — don't append a history. The journal already has the change history
- **Manifest is sacred**: Every data write must be followed by a manifest update. A stale manifest is a broken system

---

## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: process
composable: true
yields_to: [voice, craft]
```

Memory owns **process** — specifically the management of persistent state, continuity between sessions, and the lifecycle of user-specific knowledge.

### When Memory Leads

- Defining the storage structure for persistent data
- Deciding when a transient fact should become a permanent preference
- Handling the security lifecycle of secrets (storage, masking, retrieval)
- Managing the daily journal rotation and archive compaction
- Running the startup protocol (manifest → identity → journal check)

### When Memory Defers

| Other Skill's Domain | What Memory Does |
|---------------------|------------------|
| **Voice** (e.g., blogger) | Memory provides raw facts and preferences; the voice skill determines how to phrase them. Handover notes stay in neutral technical tone regardless of active voice skill — future agents shouldn't parse personality to find facts |
| **Craft** (e.g., painter) | Memory stores design tokens (e.g., "prefers dark mode", "primary color: #1a1a2e") but the craft skill executes the visual implementation |
| **Density** (e.g., caveman, compress) | Memory's journal entries and identity files are source data, not response text — density skills don't compress them. But memory's *conversational* output (e.g., "I've stored your preference") can be compressed |
| **Content** (e.g., ml-engine) | Memory stores context about what the user is working on, but doesn't generate domain-specific content. ML preferences go in prefs/; ML knowledge stays in the ml-engine skill |

### Layered Composition Rules

1. **Memory + Voice**: Journal entries and identity data are written in neutral, technical tone to ensure machine-readability across sessions, even if a voice skill is active for user-facing output
2. **Memory + Process**: If another process skill (e.g., postmortem) generates an artifact, memory captures the metadata (location, purpose, date) in the journal but does not duplicate artifact content
3. **Memory + Density**: Memory's data files are never compressed by density skills. They're structured source files, not prose

### Pipeline Behavior

- **Upstream** (receives from another skill): If a skill generates a reusable procedure, memory can capture it as a playbook. If a skill reveals a user preference, memory stores it in prefs/
- **Downstream** (feeds into another skill): Memory provides context that other skills consume — identity info for personalization, preferences for tool selection, secrets for API access

### Conflict Signal

If a new preference conflicts with a stored one:

> `⚠️ Process conflict: New preference [X] conflicts with stored preference [Y]. Updating to [X] as most recent ground truth. Change logged in journal.`
