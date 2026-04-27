# Compress

File and directory text compression. Reduces token count while preserving **all** meaning, technical accuracy, and structural intent. Not summarization — every fact survives. Only waste dies.

---

## When to use this skill

- "Compress this README"
- "Shrink this file"
- "Reduce tokens in these docs"
- "Compress directory"
- Preparing files for LLM context windows
- Batch-compressing entire directories of text files

---

## Commands

| Command | Reduction | Use when |
|---------|-----------|----------|
| `/compress [path] lite` | ~30% | Light cleanup. Keep readability. Safe for public docs. |
| `/compress [path] standard` | ~50% | General compression. Good balance. |
| `/compress [path] aggressive` | ~65% | Context window pressure. Fragments OK. |
| `/compress [path] extreme` | ~80% | Maximum compression. Telegraphic style. |

---

## What it operates on

`.md`, `.txt`, `.rst`, `.yaml`, `.yml`, `.json`, `.csv`, `.log`, `.toml`, `.cfg`, `.ini`

**Never touches** source code files (`.py`, `.js`, `.ts`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.sh`, `.sql`, etc.). Code blocks inside markdown are preserved exactly.

---

## What it controls

Compress owns **file-level density** — reducing token count in text files and directories. It does NOT control live response verbosity (that's `caveman`'s domain).

---

## File structure

```
compress/
└── SKILL.md          ← 6 compression layers + safety rules + type-specific guides
```

## Install

Drop the `compress/` folder into your agent's skills directory. Auto-triggers on compression requests with file paths.
