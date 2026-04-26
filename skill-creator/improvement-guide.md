# Skill Improvement — How to Iterate

> The philosophy and process for making skills better. Read this when improving an existing skill or when a freshly created skill isn't performing well.

---

## The Improvement Mindset

You've built a skill. It works... mostly. Some outputs are great, some are wrong, and the user has opinions. This guide is about closing that gap efficiently.

The core tension: **you're iterating on a few examples, but the skill will be used on thousands of different prompts.** Every change you make must generalize — if a fix only helps the specific test case that triggered it, it's overfitting.

---

## Four Principles

### 1. Generalize From Feedback

When the user says "the output missed X", don't add a rule that says "always include X." Ask: *why* did the skill miss X? Was the instruction ambiguous? Was there a gap in scope? Fix the underlying cause.

```markdown
❌ Overfitting: "ALWAYS include a summary section at the end"
✅ Generalizing: "End with a summary that captures key decisions and 
   open questions — the reader should be able to skip the middle and 
   still know what happened"
```

The second version works for any content. The first breaks when the output is a code file.

### 2. Keep It Lean

Remove things that aren't pulling their weight. If a paragraph in the skill exists but the AI's output doesn't change whether it's there or not — delete it.

Signs of bloat:
- Instructions the AI already follows by default (you're paying tokens for nothing)
- Redundant examples that show the same pattern
- Hedge language: "you might want to consider" → just say what to do
- Sections that exist because "every skill should have one" but add no value here

### 3. Explain the Why

This is the highest-leverage improvement you can make. When instructions explain *why* something matters, the AI generalizes better, handles edge cases better, and knows when to break the rule.

```markdown
❌ "NEVER use more than 3 colors"
✅ "Limit the palette to 3 colors because visual harmony degrades 
   with more hues — the eye can't find a resting point. Exception: 
   data visualizations that need to distinguish categories."
```

The second version gives the AI both the rule AND the judgment to apply it correctly in novel situations.

### 4. Spot Repeated Work

If you test the skill on 3 prompts and the AI independently writes the same helper function each time, that's a signal. The skill should bundle that function in `scripts/` instead of making every invocation reinvent it.

Similarly, if the AI always takes the same 5 preliminary steps before doing the actual work — those steps should be explicit in the skill, not emergent.

---

## The Iteration Loop

### Step 1: Identify What's Wrong

Read the output with fresh eyes. Common failure modes:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Output is correct but verbose | Skill doesn't constrain density | Add density guidance or yield explicitly to density skills |
| Output misses edge cases | Instructions are happy-path only | Add "Watch for..." section with common edge cases |
| Output structure is wrong | Template is missing or ambiguous | Add an explicit output template |
| AI ignores some instructions | Instructions are buried or contradictory | Move critical rules earlier; remove contradictions |
| Output breaks other skills | Composability section is weak | Strengthen "When Defers" table with concrete contracts |
| Output is generic/safe | No personality or opinion | Add opinionated stance ("we believe X because Y") |

### Step 2: Make Changes

Apply fixes to the SKILL.md. For each change:
- Explain the reasoning (even in a comment to yourself)
- Check if the change generalizes beyond the specific failure
- Verify it doesn't break composability with other skills

### Step 3: Test Against Scenarios

Walk through 2-3 realistic prompts mentally:
1. **Happy path**: Does the core use case still work?
2. **Edge case**: Does the skill handle weird inputs gracefully?
3. **Multi-skill**: Does the skill still compose correctly? Would it work if invoked with caveman mode? With a process skill upstream?

### Step 4: SIP Compliance Check

After any significant change, verify:
- [ ] Domain declaration still correct?
- [ ] `yields_to` still makes sense?
- [ ] "When Defers" table still accurate?
- [ ] Would another skill's output survive passing through this skill?
- [ ] Would this skill's output survive being post-processed by a density skill?

### Step 5: Repeat

Keep going until:
- The output consistently matches what the user wants
- You're not making meaningful progress (diminishing returns)
- The skill handles edge cases without special-casing them

---

## SIP Retrofit

For skills that predate SIP or lack composability:

1. Add `domain`, `composable`, `yields_to` to frontmatter
2. Add the full composability section at the end (use template from SKILL.md)
3. Scan all instructions for assumptions about running alone:
   - "Format the entire output as..." → what if a process skill already set the format?
   - "Start with a greeting..." → what if a density skill is active?
   - "Use this exact template..." → does it conflict with another skill's structure?
4. Test: would this skill work correctly if:
   - A density skill compressed its output?
   - A voice skill rewrote its prose?
   - A process skill restructured its sections?

---

## Improvement Categories

When documenting what changed and why, use these categories:

| Category | What Changed |
|----------|-------------|
| `instructions` | Prose clarity, specificity, or reasoning |
| `structure` | Section organization, progressive disclosure |
| `examples` | New examples, better examples, removed redundant ones |
| `boundaries` | Clearer scope limits, explicit "does not do" rules |
| `composability` | SIP compliance, domain contracts, yields_to adjustments |
| `scripts` | New helper scripts, improved existing ones |
| `references` | Deep-dive docs added or updated |

---

## When to Split vs. Expand

If your skill is getting unwieldy (>500 lines, multiple concerns, complex conditionals), consider:

**Split into two skills** when:
- The skill handles two genuinely different domains
- Users invoke it for two unrelated purposes
- The instructions for use case A contradict use case B

**Extract to reference files** when:
- The skill is one cohesive thing but has deep documentation
- Some content is only needed for advanced use
- Large examples or templates are inflating the line count

**Keep it as one** when:
- The complexity serves a single coherent purpose (like painter's design engine)
- Splitting would lose important cross-references between sections
- The skill needs to see all the context to make good decisions
