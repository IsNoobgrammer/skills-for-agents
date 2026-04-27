# Memory: The Persistent Context Engine

Maintains continuity across AI sessions through a structured, self-maintaining database of user identity, preferences, secrets, and session history.

## Architecture

```
data/
├── manifest.json       ← Master index. Read this first. O(1) lookups.
├── identity.md         ← Who is the user? Technical DNA, anti-preferences.
├── vault/              ← Credentials. One file per service.
├── prefs/              ← Preferences grouped by category (tooling, style, ui, workflow).
├── playbooks/          ← Reusable step-by-step procedures.
├── journal/            ← Daily rotating logs. One file per day.
└── archive/            ← Weekly summaries of old journal entries.
```

## Design Principles

1. **Manifest-first**: Don't scan the filesystem. Read `manifest.json` — it maps every stored item to its file path.
2. **Daily rotation**: Logs are one file per day (`journal/2026-04-28.md`). No single file grows unbounded. Old entries get summarized into weekly archives.
3. **Categorized, not atomic**: Preferences live in category files (`prefs/tooling.md`), not per-decision files. Fewer files, better discoverability.
4. **Silent capture**: Technical preferences are captured automatically when the user expresses them. No "should I remember this?" prompts.
5. **Secure by default**: Vault contents are never printed in chat. Everything under `data/` is gitignored.

## Lifecycle

```
Session Start → Read manifest + identity → Check/create today's journal
     ↓
During Session → Capture prefs silently, vault secrets, log decisions
     ↓
Session End → Write handover as final journal entry → Update manifest
     ↓
Weekly → Summarize old journals into archive/ → Delete originals
```

## SIP Compliance

- **Domain**: `process` (state management and session continuity)
- **Yields to**: `voice`, `craft`
- **Key contract**: Memory's data files are structured source data — density skills don't compress them. Voice skills don't restyle them. They're machine-readable records, not prose.
