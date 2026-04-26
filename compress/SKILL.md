---
name: compress
description: >
  Compresses .md files or directories of text-based files (.md, .txt, .rst, .yaml, .json, .csv, .log)
  to reduce token count while preserving all meaning and technical accuracy.
  Supports intensity levels: lite (~30% reduction), standard (~50%), aggressive (~65%), extreme (~80%).
  Invoke with /compress [path] [optional: lite|standard|aggressive|extreme].
  Triggers on: "/compress", "compress this", "shrink this file", "reduce tokens",
  "make this smaller", "compress docs", "compress directory".
---

# Compress — Text & Document Compression Skill

Compress text-based files to reduce token count while preserving **all** meaning, technical accuracy, and structural intent. This is NOT summarization — every fact, instruction, code block, and technical term survives. Only waste dies.

Default intensity: **standard**. Switch: `/compress [path] lite|standard|aggressive|extreme`.

---

## WHEN TO USE

- Compressing documentation, READMEs, skill files, research notes
- Shrinking prompt/context files to fit token budgets
- Preparing files for LLM context windows
- Reducing bloat in knowledge bases, logs, or archives
- Batch-compressing entire directories of text files

## WHAT IT OPERATES ON

| Extension | Type |
|-----------|------|
| `.md` | Markdown |
| `.txt` | Plain text |
| `.rst` | reStructuredText |
| `.yaml` / `.yml` | YAML config/docs |
| `.json` | JSON (comments, descriptions, verbose keys) |
| `.csv` | CSV (header/comment compression) |
| `.log` | Log files |
| `.toml` | TOML config |
| `.cfg` / `.ini` | Config files |

**Never touch:** `.py`, `.js`, `.ts`, `.go`, `.rs`, `.java`, `.c`, `.cpp`, `.h`, `.sh`, `.ps1`, `.bat`, `.sql`, or any source code file. Code blocks **inside** markdown are also preserved exactly — only the prose around them is compressed.

---

## COMPRESSION LAYERS

Compression operates in 6 layers, applied sequentially. Higher intensity levels activate more layers and apply each layer more aggressively.

### Layer 1: Filler & Fluff Removal (all levels)

**Kill on sight:**

| Category | Examples to remove |
|----------|--------------------|
| Articles | a, an, the (when meaning survives without them) |
| Filler words | just, really, basically, actually, simply, quite, very, pretty much, somewhat, rather, fairly, kind of, sort of, a bit, slightly |
| Pleasantries | Sure, Certainly, Of course, Happy to, I'd be glad to, Please note that, It's worth mentioning, It should be noted |
| Hedging | might, perhaps, maybe, possibly, it seems like, it appears that, arguably, to some extent, in a way |
| Throat-clearing | Before we begin, First of all, To start with, Let's dive in, In this document, As mentioned above, As we know, It goes without saying |
| False precision | very unique (→ unique), completely finished (→ finished), absolutely essential (→ essential), totally complete (→ complete) |
| Redundant pairs | each and every (→ each), first and foremost (→ first), any and all (→ all), if and when (→ when), unless and until (→ until) |
| Empty verbs | utilize (→ use), leverage (→ use), facilitate (→ help/enable), implement (→ build/do), endeavor (→ try), indicate (→ show) |
| Weak openers | There is/are X that... (→ X...), It is important to note that... (→ Note:), The fact that... (→ drop) |

**Examples:**
```
BEFORE: "It is important to note that the system basically utilizes a very unique approach"
AFTER:  "System uses unique approach"

BEFORE: "There are several factors that should be taken into consideration"
AFTER:  "Consider these factors"

BEFORE: "In order to successfully implement this feature, you will first need to..."
AFTER:  "To implement: first..."
```

### Layer 2: Structural Compression (standard+)

**Sentence fusion:** Merge short related sentences into compound sentences or fragments.

```
BEFORE: "The config file is located in the root directory. It contains all the settings.
         You need to edit it before running the build."
AFTER:  "Config file in root dir — contains all settings. Edit before building."
```

**List compaction:** Merge trivial list items. Keep lists for genuinely parallel items.

```
BEFORE:
- Step 1: Open the file
- Step 2: Edit the configuration
- Step 3: Save the file
- Step 4: Restart the service

AFTER:
- Open file → edit config → save → restart service
```

**Header flattening:** Remove headers that just restate the next paragraph's first sentence. Convert verbose headers to terse ones.

```
BEFORE: "## How to Configure the Database Connection Settings"
AFTER:  "## DB Config"
```

**Whitespace normalization:** Collapse excessive blank lines (max 1 between sections). Remove trailing whitespace. Normalize indentation.

### Layer 3: Synonym Compression (standard+)

Replace long words/phrases with shorter equivalents that preserve meaning:

| Long form | Short form |
|-----------|------------|
| configuration | config |
| directory | dir |
| application | app |
| repository | repo |
| information | info |
| documentation | docs |
| environment | env |
| parameters | params |
| requirements | reqs |
| authentication | auth |
| authorization | authz |
| implementation | impl |
| development | dev |
| production | prod |
| dependencies | deps |
| specification | spec |
| description | desc |
| performance | perf |
| database | DB |
| function | fn (in technical context) |
| approximately | ~, roughly |
| for example | e.g. |
| that is | i.e. |
| and so on | etc. |
| in other words | i.e. |
| as a result | → |
| because of this | → |
| which means that | → |
| in addition to | + |
| as well as | + |
| on the other hand | vs. |
| however | but |
| therefore | so |
| consequently | so |
| furthermore | also |
| nevertheless | but |
| subsequently | then |
| previously | before |
| additionally | also |
| alternatively | or |

### Layer 4: Pattern Compression (aggressive+)

**Arrow notation for causality/flow:**
```
BEFORE: "If the token expires, the middleware rejects the request, which causes a 401 error"
AFTER:  "Token expires → middleware rejects → 401"
```

**Abbreviation expansion:** Use standard abbreviations freely:
- DB, API, UI, UX, CLI, CI/CD, PR, MR, env, config, auth, repo, dir, fn, impl, req, res, pkg, dep, ver, msg, err, val, var, arg, param, attr, prop, ref, spec, doc, lib, util, src, dist, tmp, max, min, avg, est, approx

**Table conversion:** Convert verbose prose comparisons into tables.

```
BEFORE: "The lite mode reduces by about 30%. The standard mode reduces by about 50%.
         The aggressive mode reduces by about 65%. The extreme mode can reduce by up to 80%."
AFTER:
| Mode | Reduction |
|------|-----------|
| lite | ~30% |
| standard | ~50% |
| aggressive | ~65% |
| extreme | ~80% |
```

**Inline code for technical terms:** If a word is clearly a technical identifier, command, or path — wrap in backticks and compress surrounding prose.

### Layer 5: Semantic Deduplication (aggressive+)

- Remove sentences that restate what was just said in different words
- Collapse "X is Y. Y means Z." into "X = Z"
- Remove examples that illustrate an already-clear point (keep if the point is ambiguous)
- Merge overlapping sections that cover the same topic from slightly different angles
- Remove "see also" / "as mentioned" back-references when the referenced content is nearby

```
BEFORE: "The cache invalidation strategy is important. When the cache becomes stale,
         it needs to be refreshed. In other words, old cache entries must be replaced
         with fresh data. This process of updating the cache is called cache invalidation."
AFTER:  "Cache invalidation: replace stale entries with fresh data."
```

### Layer 6: Structural Reformatting (extreme only)

- Convert paragraphs to bullet points where each sentence is an independent fact
- Drop all section intros/outros — keep only content
- Remove markdown formatting that doesn't aid comprehension (decorative HRs, excessive bold/italic)
- Flatten nested lists to max 2 levels
- Convert multi-paragraph explanations into `term: definition` format
- Drop image alt-text beyond 3 words
- Collapse YAML/JSON comments to single-line

---

## INTENSITY LEVELS

| Level | Layers Active | Target Reduction | Use When |
|-------|--------------|-----------------|----------|
| **lite** | 1 | ~30% | Light cleanup. Keep readability. Safe for public docs. |
| **standard** | 1–3 | ~50% | General compression. Good balance of size vs. readability. |
| **aggressive** | 1–5 | ~65% | Context window pressure. Fragments OK. Technical audience assumed. |
| **extreme** | 1–6 | ~80% | Maximum compression. Telegraphic style. Only meaning survives. |

### Intensity Examples

**Original (100%):**
> In order to set up the development environment, you will first need to install Node.js version 18 or higher. After that, you should clone the repository from GitHub. Once the repository is cloned, navigate to the project directory and run the `npm install` command to install all the necessary dependencies. After the dependencies are installed, you can start the development server by running `npm run dev`. The server will be available at `http://localhost:3000` by default.

**lite (~30% reduction):**
> To set up the dev environment, install Node.js v18+. Clone the repository from GitHub. Navigate to the project directory and run `npm install` to install dependencies. Start the dev server with `npm run dev`. Server available at `http://localhost:3000` by default.

**standard (~50% reduction):**
> Setup: Install Node.js v18+. Clone repo, navigate to project dir, run `npm install`. Start dev server: `npm run dev`. Available at `http://localhost:3000`.

**aggressive (~65% reduction):**
> Setup: Node.js v18+ → clone repo → `npm install` → `npm run dev` → `localhost:3000`

**extreme (~80% reduction):**
> Node 18+ → clone → `npm i` → `npm run dev` → `:3000`

---

## EXECUTION PROTOCOL

### For a Single File

1. **Read the file** — understand structure, purpose, audience
2. **Identify file type** — apply type-specific rules (see below)
3. **Apply layers** sequentially based on intensity level
4. **Preserve absolutely:**
   - All code blocks (fenced and inline) — content untouched
   - All URLs and paths
   - All numbers, versions, dates
   - All technical terms and proper nouns
   - All YAML/TOML frontmatter keys (compress values if verbose)
   - Table structure (compress cell content, not layout)
   - Heading hierarchy (compress text, keep levels)
   - All warnings, cautions, and safety-critical information
5. **Output the compressed file** — write to same path (overwrite) or new path if user specifies
6. **Report:** original size → compressed size → reduction %

### For a Directory

1. **Scan directory** — list all eligible text files (recursive)
2. **Skip:** binary files, source code, images, videos, node_modules, .git, vendor, dist, build
3. **Process each file** at the specified intensity
4. **Report summary table:**

```
| File | Original | Compressed | Reduction |
|------|----------|------------|-----------|
| README.md | 4,200 chars | 2,100 chars | 50% |
| docs/setup.md | 8,500 chars | 3,400 chars | 60% |
| TOTAL | 12,700 chars | 5,500 chars | 57% |
```

---

## TYPE-SPECIFIC RULES

### Markdown (.md)

- Compress prose, keep structure
- Keep all frontmatter keys, compress verbose values
- Keep heading hierarchy, compress heading text
- Merge single-sentence sections into preceding section
- Keep code blocks verbatim
- Compress link text if excessively long: `[Click here to read the full documentation about X](url)` → `[X docs](url)`
- Keep image references intact
- Collapse blockquotes that are just formatted prose (keep if actual quotation)

### YAML / TOML (.yaml, .yml, .toml)

- Compress comment lines (# full sentence → # keyword)
- Remove redundant comments that just restate the key name
- Keep all keys, values, and structure
- Collapse multi-line strings if single-line equivalent exists

```yaml
# BEFORE
# This is the configuration for the database connection timeout
# It specifies how many seconds to wait before timing out
database_timeout: 30  # timeout in seconds

# AFTER
database_timeout: 30  # DB conn timeout (sec)
```

### JSON (.json)

- Compress string values that are descriptions/docs
- Remove JSON comments (if JSONC)
- Keep all keys and structural values intact
- Compress verbose enum descriptions

### Log files (.log)

- Deduplicate repeated log lines → `[×N]` notation
- Compress timestamps to shortest unambiguous form
- Group related log entries
- Remove debug/trace level entries (keep warn/error/info)

### Plain text (.txt)

- Apply all prose compression rules
- Convert to markdown bullets if structure is detectable
- Normalize line lengths

---

## SAFETY RULES

1. **Never compress code blocks** — not one character changed
2. **Never alter URLs** — not one character changed  
3. **Never remove security warnings** — keep verbatim, even add emphasis
4. **Never change numbers/versions** — `v18.2.1` stays `v18.2.1`
5. **Never compress if meaning becomes ambiguous** — when in doubt, keep the longer form
6. **Never merge two genuinely different ideas** — deduplication is for restated ideas only
7. **Always preserve frontmatter** — YAML frontmatter in markdown is structural, not prose
8. **Always ask before overwriting** if no explicit instruction to overwrite
9. **Destructive action warning:** At aggressive/extreme levels, flag that readability degrades and suggest keeping original as `.orig` backup

---

## AUTO-CLARITY EXCEPTIONS

Drop compression entirely for:
- License files (legal text must be verbatim)
- Security advisories
- API contracts / OpenAPI specs (structure is meaning)
- Changelogs (historical record)
- Git commit messages
- User-facing error messages within docs

Resume compression after these sections.

---

## OUTPUT FORMAT

After compression, report:

```
📦 Compressed: [filename]
   Original:   [X] chars / ~[Y] tokens
   Compressed: [A] chars / ~[B] tokens
   Reduction:  [N]% | Level: [intensity]
   Preserved:  [count] code blocks, [count] URLs, [count] tables
```

For directories:
```
📦 Compressed: [dir] ([N] files processed, [M] skipped)
   Total Original:   [X] chars / ~[Y] tokens
   Total Compressed: [A] chars / ~[B] tokens
   Overall Reduction: [N]%
   Level: [intensity]
```

---

## BOUNDARIES

- `/compress [path]` — compress at standard level
- `/compress [path] lite` — light cleanup
- `/compress [path] aggressive` — heavy compression
- `/compress [path] extreme` — maximum compression
- `/compress [path] --dry-run` — show what would change without writing
- `/compress [path] --backup` — create `.orig` backup before overwriting
- `/compress [path] --output [new_path]` — write to different location
- `stop compress` / `undo compress` — revert if backup exists
- If user provides raw text instead of a path, compress inline and return result

---

*Inspired by the caveman communication philosophy — all technical substance stays, only waste dies. Extended to operate on files and directories systematically.*
