---
name: sip
description: >
  Skills Interoperability Protocol (SIP). The shared contract that teaches all skills
  how to compose, layer, pipeline, and defer to each other. Defines domains, precedence,
  composition modes, and conflict resolution. Not a folder-based skill — lives at the
  skills root as the universal spec all other skills reference.
  This file is read by ALL skills automatically.
domain: protocol
composable: false
yields_to: []
---

# SIP — Skills Interoperability Protocol


Skills are not islands. They're composable units. This protocol defines how any skill works alongside any other skill — present or future — without needing to know about each other's internals.

---

## Core Principle

> A skill owns its **domain**. It does not own the **conversation**.

When multiple skills are active, each one handles its domain and stays out of the others'. No skill overrides another. No skill assumes it's the only one running.

---

## 1. Skill Domains

Every skill has a **domain** — the specific aspect of the output it controls. Domains do NOT overlap.

| Domain Type | What it Controls | Example Skills |
|-------------|-----------------|----------------|
| **Voice** | Tone, vocabulary, personality, emotional register | blogger |
| **Density** | Token count, verbosity, compression level | caveman, compress |
| **Craft** | Visual design, UI/UX, code quality of frontend output | painter |
| **Process** | Workflow steps, templates, structured output format | postmortem |
| **Content** | The actual substance being written about | (user's request) |

**Rule**: If two skills share a domain type, the **user's most recent invocation wins**. If ambiguous, ask.

---

## 2. Composition Modes

When the user invokes or triggers multiple skills, they compose in one of these modes:

### Mode A: Pipeline (Sequential)
One skill's output feeds into the next. Order matters.

```
User: "Write a postmortem, then compress it"
Flow: postmortem → generates report → compress → shrinks the report
```

**Signal words**: "then", "after that", "once done", "now compress it"

### Mode B: Layered (Simultaneous)
Multiple skills apply to the same output at once, each handling its domain.

```
User: "Write a blog post in caveman mode"  
Flow: blogger handles voice + content structure
      caveman handles density
      Both apply to the same output
```

**Signal words**: "in X mode", "using X", "with X", simultaneous invocation

### Mode C: Handoff (Delegated)
One skill recognizes it needs another skill's capability and explicitly calls for it.

```
Skill (postmortem): "This incident involved a UI regression. 
                     Invoking painter for the visual audit section."
```

**Signal**: Skill detects content outside its domain that another skill could handle better.

### Mode D: Advisory (Consult)
A skill references another skill's principles without fully activating it.

```
Skill (blogger): Writing a technical blog about UI decisions.
                 References painter's heuristics for accuracy,
                 but voice stays in blogger's domain.
```

**Signal**: Domain overlap in content (not output style).

---

## 3. Precedence Rules

When skills conflict, resolve with this hierarchy:

1. **Safety/Accuracy** — always wins. Implicit and absolute. No skill can override this, even with `yields_to: []`. If caveman compression would make a security warning ambiguous, expand it. If blogger's casual tone would make a postmortem blame someone, override it. This rule applies even when a skill declares it yields to nothing.

2. **User's explicit instruction** — second priority. "Write this in caveman mode" means caveman density overrides blogger's default verbosity.

3. **Domain owner** — each skill is authoritative in its domain. Voice conflicts → voice skill wins. Density conflicts → density skill wins.

4. **Most recently invoked** — if two skills share a domain and no explicit priority, the last one invoked takes precedence.

5. **Specificity** — a skill with narrow scope beats a skill with broad scope in the overlap area.

---

## 4. The Composition Contract

Every skill MUST follow these rules to be composable:

### 4.1 Input Agnosticism
A skill must be able to operate on output from ANY other skill. Don't assume your input is raw user text — it might be pre-processed by another skill.

### 4.2 Domain Respect
Never modify aspects outside your domain:
- **Voice skills**: don't restructure layout or process steps
- **Density skills**: don't change tone, personality, or factual content
- **Craft skills**: don't rewrite prose that isn't UI copy
- **Process skills**: don't impose voice or density preferences

### 4.3 Marker Preservation
If a skill produces structured output (tables, code blocks, frontmatter, templates), downstream skills must preserve that structure. Compress the content INSIDE structures, not the structures themselves.

### 4.4 Signal Emission
When a skill recognizes it's in a multi-skill context, it should:
- State which domain it's handling
- Note if it's deferring on any aspect
- Flag conflicts it can't resolve alone

### 4.5 Graceful Degradation
If a skill can't fully operate alongside another (e.g., caveman + blogger have conflicting density preferences), it should:
1. Identify the conflict
2. Apply the precedence rules above
3. Note what was deferred: `[density deferred to caveman]`

---

## 5. Multi-Skill Invocation Syntax

Users can invoke multiple skills in several ways:

```
# Explicit chaining
/blog technical | /caveman lite
→ Blogger writes technical post, caveman lite compresses output

# Layered invocation
/postmortem + /caveman
→ Postmortem runs full workflow, output compressed by caveman

# Natural language
"Write a blog post about the UI fix, in caveman mode, and make sure the code examples follow painter standards"
→ blogger (voice) + caveman (density) + painter (craft, advisory only)

# Sequential
"Run a postmortem on the outage, then blog about it"
→ postmortem (process) → blogger (voice + content)
```

The `|` operator means pipeline. The `+` operator means layered. Natural language is parsed by context.

---

## 6. Conflict Resolution Matrix

| Skill A | Skill B | Conflict | Resolution |
|---------|---------|----------|------------|
| blogger (voice) | caveman (density) | Blogger wants 600-1200 words; caveman wants minimal | Caveman density wins, blogger voice/personality preserved in fewer words |
| blogger (voice) | compress (density) | Same as above but for file output | Compress density wins on the file; blogger voice preserved |
| blogger (voice) | postmortem (process) | Blogger hates headers like "Introduction"; postmortem needs structured sections | Postmortem structure wins (it's process domain), blogger voice applies within sections |
| painter (craft) | blogger (voice) | Blog post about UI decisions | Painter is advisory — provides technical accuracy for UI claims. Blogger owns the voice |
| caveman (density) | compress (density) | Both want to reduce tokens | Most recently invoked wins. If simultaneous: caveman for live responses, compress for files |
| postmortem (process) | compress (density) | Postmortem generates report, compress shrinks it | Pipeline: postmortem first, compress second. Structure preserved, content compressed |
| painter (craft) | postmortem (process) | Postmortem about a UI incident | Painter provides craft expertise for the UI analysis section. Postmortem owns the overall structure |

---

## 7. Future Skill Integration

New skills automatically integrate by:

1. **Declaring their domain** in their SKILL.md frontmatter
2. **Following the composition contract** (Section 4)
3. **Referencing this protocol** so they know how to yield and compose

No existing skill needs to be updated when a new skill is added. The protocol handles it.

### Domain Declaration (add to frontmatter)

```yaml
---
name: my_new_skill
description: >                      # Must be < 1000 characters
  What this skill does. When to use it. Specific triggers.
domain: voice | density | craft | process | content | analysis | testing
composable: true
yields_to: [list of domain types this skill defers to]
---
```

---

## 8. Anti-Patterns

**Don't:**
- ❌ Hardcode references to specific other skills ("if blogger is active, do X")
- ❌ Override another skill's domain silently
- ❌ Assume you're the only skill running
- ❌ Drop structured output from upstream skills
- ❌ Refuse to operate because another skill's output "looks weird"
- ❌ Double-process (if input is already compressed, don't compress again)

**Do:**
- ✅ Check if your domain is already handled — defer if so
- ✅ Preserve structure you didn't create
- ✅ State what you're handling and what you're not
- ✅ Accept pre-processed input gracefully
- ✅ Flag conflicts explicitly rather than silently resolving

---

## 9. The Litmus Test

> Can two skills that have never seen each other's code work together on a single user request without breaking each other's output?

If yes, the protocol works. If no, one of them is violating the composition contract.

---

## 10. Known Issues & Suggested Improvements

Skills should update this section when they discover gaps in the protocol. This is the living changelog — not a bug tracker, but a place where skills document what they found and what they suggest.

| Skill | Issue Found | Suggested Fix | Status |
|-------|------------|---------------|--------|
| postmortem | `yields_to: []` implies process is never overridden, but Safety/Accuracy (Precedence Rule 1) must always be able to override | Clarified in Section 3 Rule 1 that it is implicit and absolute regardless of `yields_to` | ✅ Fixed |
| (all) | Large descriptions bloating system prompts and slowing down trigger detection | Enforced < 1000 character limit for `description` field in frontmatter | ✅ Fixed |

### How to add entries

When a skill discovers a gap, contradiction, or ambiguity in SIP:

1. Add a row to the table above
2. Set status to `🔍 Open` (discovered), `🔧 Proposed` (has a fix), or `✅ Fixed` (resolved)
3. If the fix requires a protocol change, update the frontmatter accordingly.

---

*This protocol is read by ALL skills. It is the shared contract. Respect it.*

*Skills that find gaps or contradictions: add them to Section 10 above.*
