# Skill Anatomy — Structural Reference

> Reference for SKILL.md structure, frontmatter fields, content sections, and optional components in the SIP ecosystem.

---

## Folder Structure

```
skill-name/
├── SKILL.md              ← Required: the main instruction set
├── references/           ← Optional: deep-dive docs, loaded on demand
│   └── detailed-guide.md
├── scripts/              ← Optional: helper scripts for deterministic tasks
│   └── helper.py
├── templates/            ← Optional: reusable output templates
│   └── template.md
└── examples/             ← Optional: real-world usage examples
    └── example-output.md
```

Only `SKILL.md` is required. Everything else exists to keep SKILL.md lean.

---

## Frontmatter Reference

The frontmatter is YAML wrapped in `---` at the top of SKILL.md. These are the fields used in the SIP ecosystem:

### Required Fields

```yaml
---
name: skill-name
description: >
  What this skill does and when to trigger it. Be pushy —
  undertriggering is worse than overtriggering.
domain: voice | density | craft | process | content | analysis | testing
composable: true
yields_to: [process, craft]
---
```

#### `name`
- **Format**: lowercase-with-hyphens
- **Rule**: Must match the folder name exactly
- **Example**: `name: skill-creator`

#### `description`
- **What it is**: The primary triggering mechanism — determines when the skill activates
- **Format**: Multi-line string using `>` for readability
- **Rule**: Include specific trigger phrases, contexts, and edge cases. Make it pushy:
  - ❌ `"Helps with UI design"`
  - ✅ `"Use whenever the user mentions UI, design, layout, colors, animations, or says 'make it look good' — even if they don't explicitly ask for design help."`

#### `domain`
- **What it is**: The SIP domain this skill owns
- **Values**: `voice` | `density` | `craft` | `process` | `content` | `analysis` | `testing`
- **Rule**: Exactly one domain per skill. See `PROTOCOL.md` for domain definitions.

#### `composable`
- **What it is**: Whether this skill can run alongside other skills
- **Default**: `true` — almost always true
- **Rule**: Set to `false` only if the skill genuinely cannot share output space (extremely rare)

#### `yields_to`
- **What it is**: List of domain types this skill defers to when conflicts arise
- **Format**: Array of domain strings
- **Rule**: Requires real judgment. Think through scenarios:
  - Voice skills typically yield to `[process, craft]`
  - Density skills yield to `[process]`
  - Process skills yield to `[]` (structure is sacred)
  - Safety/Accuracy always wins — never list it, it's implicit per SIP

### Optional Fields

```yaml
---
license: MIT           # SPDX identifier if sourced from licensed material
scope: files           # sub-domain differentiator (e.g. compress uses scope: files)
---
```

---

## Content Structure

After frontmatter, organize content in this order:

### 1. Title (H1)
```markdown
# Skill Title
```
Clear, descriptive. Usually expands on the skill name.

### 2. Identity Statement
1-2 sentences. What does this skill believe? What's its stance?
```markdown
You build skills. Not templates — living instruction sets that shape how an AI thinks.
```

### 3. When to Use
```markdown
## When to Use This Skill

- User wants to [scenario 1]
- User asks about [scenario 2]
- User says something like "[trigger phrase]"
```
Be generous. Helps the AI know when to activate.

### 4. Core Instructions
```markdown
## How It Works

### Step 1: [Action]
Detailed instructions with WHY, not just WHAT...

### Step 2: [Action]
More instructions...
```
The heart of the skill. Clear, actionable, opinionated.

### 5. Examples
````markdown
## Examples

### Example 1: [Use Case]
```javascript
// Example code
```
````
Show the AI exactly what good output looks like. Examples ARE instructions.

### 6. Boundaries
```markdown
## Boundaries

- Does NOT handle [X]
- Stops at [Y]
- Defers to [skill] for [Z]
```
Hard edges. What the skill explicitly refuses to do.

### 7. Composability Section (Required)
```markdown
## Composability — Working With Other Skills
```
Full SIP compliance section. See the composability template in SKILL.md.

---

## Optional Components

### Scripts Directory
For deterministic or repetitive tasks the skill needs done the same way every time:

```
scripts/
├── setup.sh          ← Setup automation
├── validate.py       ← Validation tools
└── generate.js       ← Code generators
```

Reference from SKILL.md: `> Run scripts/validate.py to verify output format.`

### Examples Directory
Real-world examples showing the skill's output:

```
examples/
├── basic-usage.md
├── advanced-pattern.md
└── edge-case.md
```

### Templates Directory
Reusable output templates the skill fills in:

```
templates/
├── report.md
├── config.json
└── component.tsx
```

### References Directory
Deep-dive documentation loaded only when needed:

```
references/
├── advanced-patterns.md
├── edge-cases.md
└── troubleshooting.md
```

For large reference files (>300 lines), include a table of contents.

---

## Size Guidelines

| Skill Type | SKILL.md Lines | Content |
|-----------|---------------|---------|
| **Focused** (single pattern) | 50–150 | Core instructions + Composability |
| **Standard** (workflow/domain) | 150–350 | Full structure with examples |
| **Comprehensive** (knowledge base) | 350–500 | Full structure + reference files |

Past 500 lines → extract into reference files. SKILL.md becomes a router.

---

## Writing Patterns

### Imperative Voice
```markdown
❌ "You might want to consider possibly checking authentication."
✅ "Check authentication before proceeding."
```

### Specific Over Generic
```markdown
❌ "Set up the database properly."
✅ "1. Create a PostgreSQL database
    2. Run migrations: npm run migrate
    3. Seed initial data: npm run seed"
```

### Show, Don't Describe
```markdown
❌ "Write clear error messages"
✅ Before: "Error occurred"
   After:  "Payment failed: card ending 4242 was declined. Try a different card."
```

### Conditional Logic
```markdown
If the user is working with React:
- Use functional components
- Prefer hooks over class components

If the user is working with Vue:
- Use Composition API
- Follow Vue 3 patterns
```

### Progressive Disclosure
```markdown
## Basic Usage
[Simple instructions for common cases]

## Advanced Usage
[Complex patterns — or point to references/advanced.md]
```

---

## Existing Skills as References

Study these skills in the current ecosystem for different patterns:

| Skill | Domain | Lines | Pattern |
|-------|--------|-------|---------|
| **caveman** | density | ~70 | Focused — minimal, pure rules |
| **blogger** | voice | ~870 | Comprehensive — deep personality dossier |
| **compress** | density | ~400 | Standard — structured with intensity levels |
| **painter** | craft | ~460 | Comprehensive — full design engine with reference files |
| **postmortem** | process | ~300 | Standard — structured workflow with templates |
| **skill-creator** | process | ~450 | Comprehensive — meta-skill with reference files |

---

## Quality Checklist

### Frontmatter
- [ ] Valid YAML, `name` matches folder
- [ ] `description` is pushy and includes trigger phrases
- [ ] `domain`, `composable`, `yields_to` declared

### Content
- [ ] Instructions are imperative and actionable
- [ ] WHYs explained alongside WHATs
- [ ] Examples are realistic
- [ ] No throat-clearing or filler
- [ ] Under 500 lines (or uses reference files)

### SIP Compliance
- [ ] Composability section exists and is complete
- [ ] "When Leads" / "When Defers" are concrete, not generic
- [ ] Pipeline behavior documented
- [ ] Conflict signal template defined

### Effectiveness
- [ ] Solves a real problem
- [ ] An AI following these instructions would produce the right output
- [ ] Works alongside other skills without breaking their output
