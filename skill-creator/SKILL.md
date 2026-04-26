---
name: skill-creator
description: >
  Creates new skills, improves existing skills, and ensures SIP compliance across the skill
  ecosystem. Use this skill whenever the user wants to create a skill from scratch, turn a
  workflow into a skill, edit or refactor an existing skill, audit a skill for quality,
  add SIP composability to a skill, or discuss skill architecture and best practices.
  Triggers on: "/create-skill", "make a skill", "turn this into a skill", "new skill",
  "skill for X", "improve this skill", "audit this skill", "skill creator".
  Also trigger when the user describes a repeatable workflow and says "I wish this was automatic"
  or "can you remember this" — that's a skill waiting to be born.
domain: process
composable: true
yields_to: []
version: 1.0.0
---

# Skill Creator

You build skills. Not templates — living instruction sets that shape how an AI thinks, acts, and composes with other skills.

> **Before writing anything, read this entire file.** Then read the reference files in this directory for structural patterns (`anatomy.md`), iteration philosophy (`improvement-guide.md`), and evaluation frameworks (`evaluation.md`).

---

## The Philosophy

A skill is a **dense compression of expertise into instructions an AI can follow**. The best skills are:

1. **Opinionated** — they make decisions so the AI doesn't have to reinvent them every time
2. **Composable** — they work alongside other skills without breaking them (SIP compliance)
3. **Honest about scope** — they own a domain and stay out of domains they don't own
4. **Explanatory** — they explain *why*, not just *what* (LLMs respond to reasoning, not just commands)
5. **Lean** — every line earns its place. If removing a sentence doesn't change the output, remove it

A skill that works perfectly in isolation but destroys other skills' output when composed is a **broken skill**. SIP compliance is not optional.

---

## When to Use This Skill

- User wants to create a new skill from scratch
- User wants to capture a workflow they just demonstrated ("turn this into a skill")
- User wants to improve, refactor, or audit an existing skill
- User wants to add SIP composability to a skill that's missing it
- User asks about skill architecture, structure, or best practices
- User says something like "I keep doing this manually" — that's a skill signal

---

## The Creation Pipeline

### Phase 1: Capture Intent

Figure out where the user is. They might come in with:
- **A vague idea**: "I want a skill for X" → needs full interview
- **A workflow in the conversation**: "turn what we just did into a skill" → extract from history
- **An existing draft**: "here's my skill, make it better" → skip to Phase 3
- **A reference skill**: "I want something like painter but for Y" → use as template

**Questions to resolve** (extract from context first, ask only what's missing):

1. **What does this skill do?** One sentence. If you can't say it in one sentence, the skill is too broad — split it.

2. **What domain does it own?** Map to SIP domains:
   | If the skill controls... | Domain is... |
   |--------------------------|-------------|
   | How things sound/read (tone, personality, vocabulary) | `voice` |
   | How much output there is (compression, token count) | `density` |
   | How things look (UI, design, code quality) | `craft` |
   | What steps to follow (workflows, templates, reports) | `process` |
   | What substance is produced (research, analysis, data) | `content` |
   | How to examine/evaluate something | `analysis` |
   | How to verify correctness | `testing` |

3. **When should it trigger?** What phrases, contexts, or patterns should activate this skill? Be generous — undertriggering is worse than overtriggering. Include edge cases and natural language variants.

4. **What does it yield to?** When this skill conflicts with another domain, who wins? Think through real scenarios:
   - Does structure outrank your skill's preferences? → yield to `process`
   - Does visual design outrank your skill? → yield to `craft`
   - Is tone more important than your skill's defaults? → yield to `voice`
   - Safety/Accuracy always wins — never list it, it's implicit per SIP

5. **What's the output format?** Code? Prose? Files? Templates? Mixed?

6. **What are the boundaries?** What should this skill explicitly NOT do?

### Phase 2: Write the Skill

#### File Structure

```
skill-name/
├── SKILL.md              ← Required. The main instruction set.
├── references/           ← Optional. Deep-dive docs loaded on demand.
│   └── detailed-guide.md
├── scripts/              ← Optional. Helper scripts for deterministic tasks.
│   └── helper.py
├── templates/            ← Optional. Reusable output templates.
│   └── template.md
└── examples/             ← Optional. Real-world usage examples.
    └── example-output.md
```

Only `SKILL.md` is required. Everything else exists to keep SKILL.md lean — if a section would push SKILL.md past ~400 lines, extract it into a reference file and add a pointer.

#### SKILL.md Anatomy

Every SKILL.md has two parts:

**Part 1: Frontmatter (YAML)**

```yaml
---
name: skill-name                    # lowercase-with-hyphens, matches folder name
description: >                      # THE triggering mechanism. Be specific AND pushy.
  What this skill does. When to use it. Include specific trigger phrases
  and contexts. Err on the side of triggering too often rather than too rarely.
domain: voice | density | craft | process | content | analysis | testing
composable: true                    # almost always true
yields_to: [process, craft]         # domains this skill defers to
version: 1.0.0                      # semver
---
```

**Frontmatter rules:**
- `name` must match the folder name exactly
- `description` is the most important field — it determines whether the skill activates. Make it pushy. Instead of "Helps with X" write "Use this whenever the user mentions X, wants Y, or is working with Z — even if they don't explicitly ask for it."
- `domain` must be exactly one of the SIP domain types
- `composable` defaults to `true`. Set to `false` only if the skill genuinely cannot share output space (extremely rare)
- `yields_to` requires real judgment — see SIP Section 3 for precedence rules

**Part 2: Content (Markdown)**

Structure your content in this order:

```markdown
# Skill Title

[1-2 sentence identity statement. Who is this skill? What does it believe?]

---

## When to Use

[Bullet list of activation scenarios. Be generous.]

---

## Core Instructions

[The heart of the skill. Clear, actionable, opinionated.
 Use imperative voice. Explain WHY, not just WHAT.
 Include examples where the example IS the instruction.]

---

## [Domain-Specific Sections]

[Whatever the skill needs — patterns, rules, references,
 anti-patterns, checklists. Organized by what the user
 needs to find, not by what seems logical to write.]

---

## Boundaries

[What this skill does NOT do. Hard edges. "Stop caveman" equivalents.]

---

## Composability — Working With Other Skills

[Required. Full SIP compliance section. See template below.]
```

#### Writing Rules

**Explain the why.** LLMs are smart. They respond better to reasoning than to commands. Instead of `ALWAYS use expo-out easing`, write `Use expo-out easing because linear and ease feel mechanical — the human eye expects objects to decelerate as they settle, matching physical reality.` The model now understands when to break the rule, too.

**Use the imperative.** "Check authentication" not "You should check authentication" not "It's important to ensure authentication is checked."

**Be specific over generic.** `cubic-bezier(0.16, 1, 0.3, 1)` beats `use a smooth easing curve`. Specific numbers, specific filenames, specific patterns.

**Show, don't describe.** If you're explaining a pattern, show the before/after:

```markdown
❌ Bad: "Write clear error messages"
✅ Good:
  Before: "Error occurred"
  After:  "Payment failed: card ending 4242 was declined. Try a different card."
```

**Keep it lean.** Every sentence should earn its place. If removing a paragraph doesn't change the AI's output, remove it. Dense > verbose.

**No throat-clearing.** Don't start with "In this skill, we will..." or "The purpose of this skill is..." Just start with the instructions.

**Progressive disclosure.** Put the most common instructions in SKILL.md. Put deep-dive details in `references/`. Add clear pointers: `> See references/advanced-patterns.md for edge cases.`

#### Size Guidelines

| Skill Type | SKILL.md Lines | Sections |
|-----------|---------------|----------|
| **Focused** (single pattern) | 50–150 | Core + Composability |
| **Standard** (workflow/domain) | 150–350 | Full structure |
| **Comprehensive** (knowledge base) | 350–500 | Full + reference files |

If you're past 500 lines, you need reference files. The SKILL.md becomes a router that points to deeper docs.

### Phase 3: SIP Compliance

Every skill must end with a composability section. This is non-negotiable — it's what makes the ecosystem work.

Read `PROTOCOL.md` (SIP v1.0.0) at the skills root before writing this. The section you write is the *implementation* of SIP for this specific skill.

Use this template:

````markdown
## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP v1.0.0) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: [the domain]
composable: true
yields_to: [domains this skill defers to]
```

[Skill name] owns **[domain]** — [one sentence on what exactly it controls].

### When [Skill Name] Leads

- [Primary scenario 1]
- [Primary scenario 2]

### When [Skill Name] Defers

| Other Skill's Domain | What [Skill Name] Does |
|---------------------|------------------------|
| **[Domain]** | [Concrete: what it preserves, what it hands off] |
| **[Domain]** | [Same — be specific, not generic] |

### Layered Composition Rules

1. **[This domain] + [Other domain]**: [Who handles what, where the boundary is]

### Pipeline Behavior

- **Upstream** (receives output from another skill): [How it handles pre-processed input]
- **Downstream** (output feeds into another skill): [What downstream skills should expect]

### Conflict Signal

If [specific tension this skill might encounter]:

> `⚠️ [Domain] conflict: [what's conflicting]. [What was chosen, what was preserved, what was deferred].`
````

**The `yields_to` decision is the hardest part.** Think through it carefully:
- A voice skill yields to `[process, craft]` because structure and design outrank tone
- A density skill yields to `[process]` because you can't compress away required structure
- A process skill yields to `[]` because the skeleton is sacred — nobody restructures it
- A craft skill yields to `[voice, process]` because it doesn't control tone or workflow order
- Safety/Accuracy always wins regardless — it's implicit per SIP Rule 1, never listed

**The "When Defers" table is the contract's core.** Be concrete: `"Compress surrounding prose but preserve exact CSS values"` beats `"Defer to craft skills."` The AI reading this during composition needs to know exactly what to preserve and what to hand off.

### Phase 4: Review & Iterate

After writing the skill:

1. **Self-review pass**: Read it with fresh eyes. Ask:
   - Would a model following these instructions produce the right output?
   - Is every section earning its place?
   - Are the WHYs explained, not just the WHATs?
   - Is the composability section specific enough?

2. **Test mentally**: Pick 2-3 realistic user prompts. Walk through how the skill would handle them. Identify gaps.

3. **Check against anti-patterns** (see below)

4. **Present to user**: Show the draft, explain key decisions, ask for feedback

5. **Iterate**: Apply feedback, re-test, repeat until solid

For skills with objectively verifiable outputs, you can set up test cases:

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "Realistic user prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

> **See `improvement-guide.md` in this directory for the full iteration philosophy** — generalize from feedback, keep it lean, explain the why, spot repeated work.

> **See `evaluation.md` in this directory for evaluation frameworks** when comparing skill versions or auditing quality.

---

## Skill Anti-Patterns

### ❌ The Vague Skill
```markdown
## Instructions
Make the code better.
```
**Fix**: Be specific. What does "better" mean? Faster? More readable? More maintainable? Pick one and give concrete steps.

### ❌ The Dictator Skill
```markdown
## Instructions
ALWAYS do X. NEVER do Y. MUST follow Z. REQUIRED to use W.
```
**Fix**: Explain the reasoning. `Use X because Y` is more powerful than `ALWAYS use X`. The model understands when to break the rule if it understands why the rule exists.

### ❌ The Novel Skill
A 2000-line SKILL.md that tries to teach everything in one file.

**Fix**: Extract to reference files. SKILL.md is the router, not the encyclopedia. `> See references/deep-dive.md for advanced patterns.`

### ❌ The Island Skill
A skill with no composability section, or one that says `composable: false` without justification.

**Fix**: Every skill composes. Even if it's the primary skill, it needs to know how to behave when a density or voice skill is also active. Add the section.

### ❌ The Copycat Skill
A skill that duplicates another skill's domain. Two voice skills, two density skills in the same ecosystem.

**Fix**: Either merge them (with scope differentiation, like caveman for live responses vs. compress for files) or make one yield to the other.

### ❌ The Overfit Skill
A skill that works perfectly for 3 test cases but breaks on anything else because the instructions are too specific to those examples.

**Fix**: Generalize from examples. Explain the principle, not just the pattern. If you find yourself writing instructions that only make sense for one specific input, you're overfitting.

---

## Improving Existing Skills

When the user brings an existing skill to improve:

1. **Read it fully** — understand what it does, what domain it owns, how it composes
2. **Check SIP compliance** — does it have proper frontmatter? Composability section? Domain declaration?
3. **Check for anti-patterns** — vague instructions? Missing WHYs? Novel-length? Island behavior?
4. **Identify gaps** — what scenarios does it not handle? What edge cases are missing?
5. **Draft improvements** — make changes, explain the reasoning for each
6. **Test the changes** — walk through scenarios, verify composability still works

### SIP Retrofit

For skills that predate SIP or lack composability:

1. Add `domain`, `composable`, `yields_to` to frontmatter
2. Add the full composability section at the end
3. Update any instructions that implicitly assume the skill is running alone
4. Test: would this skill work correctly if a density skill compressed its output? If a voice skill rewrote its prose? If a process skill restructured its sections?

---

## Skill Audit Checklist

### Frontmatter
- [ ] `name` matches folder name
- [ ] `description` is pushy enough to trigger reliably
- [ ] `description` includes specific trigger phrases and contexts
- [ ] `domain` is declared and correct
- [ ] `composable: true` (unless justified otherwise)
- [ ] `yields_to` is thoughtfully chosen, not just copied from another skill

### Content Quality
- [ ] Instructions use imperative voice
- [ ] WHYs are explained alongside WHATs
- [ ] Examples are realistic and helpful
- [ ] No throat-clearing or filler sections
- [ ] Progressive disclosure used (deep content in reference files)
- [ ] Under 500 lines (or uses reference files)

### SIP Compliance
- [ ] Composability section exists and is complete
- [ ] Domain declaration matches frontmatter
- [ ] "When Leads" scenarios are specific
- [ ] "When Defers" table has concrete (not generic) contracts
- [ ] Layered composition rules cover likely pairings
- [ ] Pipeline behavior documented for upstream and downstream
- [ ] Conflict signal template defined

### Anti-Patterns
- [ ] No ALWAYS/NEVER/MUST without reasoning
- [ ] No vague instructions ("make it good")
- [ ] No novel-length SKILL.md without reference files
- [ ] No island behavior (missing composability)
- [ ] No domain duplication with existing skills
- [ ] No overfitting to specific examples

---

## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP v1.0.0) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: process
composable: true
yields_to: []
```

Skill-creator owns **process** — the workflow for creating, improving, and auditing skills. The creation pipeline, the review checklist, the SIP compliance template, the anti-pattern detection. This is the meta-skill: the skill that builds skills.

### When Skill-Creator Leads

- Any request to create a new skill
- Any request to improve or audit an existing skill
- Any discussion about skill architecture or SIP compliance
- When the user describes a workflow and wants to capture it as a skill

### When Skill-Creator Defers

| Other Skill's Domain | What Skill-Creator Does |
|---------------------|------------------------|
| **Voice** (e.g. blogger) | Skill-creator structures the skill creation process. If the user wants the skill itself to be written in a specific voice, the voice skill handles the tone of the SKILL.md prose — skill-creator handles the structure, frontmatter, and SIP compliance. |
| **Density** (e.g. caveman, compress) | Skill-creator generates full skill drafts. If a density skill is active, the explanations around the skill (not the skill content itself) get compressed. The skill being created maintains its own natural density — you don't compress a skill just because caveman mode is on. |
| **Craft** (e.g. painter) | If the skill being created is a craft skill, skill-creator provides the structural template; the craft skill's domain knowledge fills the design-specific content. Skill-creator doesn't generate design rules — it creates the container for them. |

### Layered Composition Rules

1. **Process + Voice**: Skill-creator owns the creation workflow. Voice skill can influence the prose style of explanations and the SKILL.md content, but the structural requirements (frontmatter fields, composability section, section order) are non-negotiable.

2. **Process + Density**: Skill-creator's output (the created skill file) is not compressible by density skills — it's a source file, not a response. Conversational explanations around the skill can be compressed.

3. **Process + Content**: If the user provides domain expertise (content) for the skill being created, skill-creator shapes it into proper skill format. Content provides the substance; process provides the skeleton.

### Pipeline Behavior

- **Upstream** (receives content from another skill): If another skill provides analysis, research, or content that should become a skill, skill-creator accepts it and restructures it into SKILL.md format with proper frontmatter and composability.
- **Downstream** (skill-creator output feeds into another skill): The created skill is a standalone file. It may be compressed by a density skill for storage, or the user might want to blog about the skill creation process (voice skill handles that).

### Conflict Signal

If the user wants to create a skill that conflicts with an existing skill's domain:

> `⚠️ Process conflict: proposed skill's domain ([domain]) overlaps with existing skill [name]. Options: (1) merge into existing skill with scope differentiation, (2) make one yield to the other, (3) split the domain more precisely. Which approach?`
