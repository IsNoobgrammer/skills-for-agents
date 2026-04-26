# Skill Evaluation — Comparing and Analyzing Skills

> Framework for evaluating skill quality, comparing skill versions, and understanding why one version outperforms another. Read this when auditing a skill or deciding between two approaches.

---

## When to Evaluate

- After improving a skill — is the new version actually better?
- When two skills seem to overlap — which one handles the use case better?
- When a skill's output feels "off" but you can't pinpoint why
- During SIP compliance audits — does the skill compose correctly?

---

## Evaluation Dimensions

### 1. Instruction Clarity

Does the AI consistently follow the skill's instructions?

| Score | Meaning |
|-------|---------|
| 9-10 | AI follows all instructions faithfully, even subtle ones |
| 7-8 | AI follows most instructions, minor deviations on optional steps |
| 5-6 | AI misses or misinterprets some instructions regularly |
| 3-4 | AI invents its own approach, ignoring significant parts of the skill |
| 1-2 | AI mostly ignores the skill's instructions |

**Common issues:**
- Instructions buried deep in the file get skipped → move critical rules earlier
- Contradictory instructions → AI picks one, may choose wrong
- Vague instructions → AI fills in the blanks with its own judgment (unpredictable)

### 2. Output Quality

Rate the actual output, not just whether instructions were followed:

- **Correctness**: Is the output factually/technically accurate?
- **Completeness**: Does it cover all the user asked for?
- **Format**: Does the structure match expectations?
- **Tone**: Does the voice/personality come through (if applicable)?
- **Composability**: Does the output survive post-processing by other skills?

### 3. Edge Case Handling

Test with unusual inputs:
- Empty or minimal input
- Very long or complex input
- Input that's ambiguous or could trigger multiple skills
- Input in a different language or register than expected
- Input that contradicts the skill's assumptions

### 4. SIP Compliance

- Does the skill respect other skills' domains?
- Does it preserve structures it didn't create?
- Does it emit conflict signals when appropriate?
- Does its output survive being post-processed by density/voice/craft skills?
- Does it gracefully handle pre-processed input from upstream skills?

---

## Comparing Two Versions

When you have version A and version B of a skill, compare systematically:

### Step 1: Identify Differences

Read both versions. Note:
- What instructions changed?
- What was added/removed?
- Did the domain or yields_to change?
- Did the composability section change?

### Step 2: Test on Same Prompts

Run both versions against the same 2-3 realistic prompts. Compare outputs on:
- Which produces better output?
- Which follows instructions more consistently?
- Which handles edge cases better?
- Which composes better with other skills?

### Step 3: Analyze Why

For each difference in output, trace back to the instruction that caused it:

**Winner strengths** (what the better version did right):
- Clearer instructions that left less room for misinterpretation
- Better examples that guided the AI's judgment
- Explicit edge case handling that prevented common failures
- Stronger composability section that prevented domain conflicts

**Loser weaknesses** (what the worse version got wrong):
- Ambiguous phrasing that led to inconsistent behavior
- Missing examples that left the AI guessing
- Gaps in edge case coverage
- Weak or missing composability section

### Step 4: Generate Improvements

For each weakness found, produce a specific, actionable fix:

| Priority | Meaning |
|----------|---------|
| **High** | Would likely change the outcome for most prompts |
| **Medium** | Improves quality but wouldn't change pass/fail |
| **Low** | Nice to have, marginal improvement |

| Category | What to Fix |
|----------|-------------|
| `instructions` | Prose clarity, specificity, reasoning |
| `examples` | Better examples, remove misleading ones |
| `error_handling` | Fallback guidance, graceful degradation |
| `structure` | Section organization, progressive disclosure |
| `composability` | SIP compliance, domain contracts |
| `references` | Deep-dive docs to add or update |

---

## Pattern Analysis

When evaluating a skill across multiple test cases, look for these patterns:

### Non-Differentiating Rules
Rules that the AI follows regardless of whether the skill is active. These are wasting tokens — the AI already does this by default. Remove them.

### High-Variance Output
Some test cases produce wildly different results each time. This usually means:
- The instruction is ambiguous (AI interprets it differently each run)
- The instruction depends on context that varies
- The instruction contradicts another instruction

### Consistent Failures
The same type of error across multiple test cases. This is the highest-signal finding — it points to a systematic issue in the skill's instructions.

### Composability Breaks
Output that works in isolation but breaks when another skill processes it:
- Structure that density skills can't compress without losing meaning
- Prose that voice skills can't re-voice without losing technical accuracy
- Templates that process skills can't restructure without losing data

---

## Quick Audit Template

For a fast skill evaluation, check these in order:

```markdown
## Audit: [Skill Name]

### Frontmatter
- [ ] domain declared and correct
- [ ] composable: true (or justified false)
- [ ] yields_to thoughtfully chosen
- [ ] description pushy enough to trigger

### Instructions
- [ ] Imperative voice throughout
- [ ] WHYs explained, not just WHATs
- [ ] No ALWAYS/NEVER without reasoning
- [ ] No redundant rules (AI does this by default)

### Composability
- [ ] Full section present
- [ ] "When Defers" table is concrete
- [ ] Pipeline behavior documented
- [ ] Conflict signal defined
- [ ] Would survive composition with density skill
- [ ] Would survive composition with voice skill

### Output Test (pick 2 prompts)
- [ ] Prompt 1: [result summary]
- [ ] Prompt 2: [result summary]
- [ ] Edge case: [result summary]
```
