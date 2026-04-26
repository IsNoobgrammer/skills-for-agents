---
name: postmortem
description: >
  Runs the full postmortem workflow: gathers incident context, writes a blameless postmortem
  report, saves it to a `postmortem/` folder (gitignored), and creates action items.
  Trigger on: "/postmortem", "write a postmortem", "incident review", "post-incident",
  "blameless review", "what broke and why", "SEV1/SEV2 report", or any mention of needing
  to document an outage, incident, or system failure. Always use this skill when the user
  wants to review or document any kind of production incident — even if they just say
  "help me write up what happened".
domain: process
composable: true
yields_to: []
---

# Postmortem Skill

No blame. No drama. Just: what broke, why, what we do next.

Real postmortems are hard to write coz engineers are tired after incidents and want to move on.
This skill forces the structure so your 3am brain doesn't skip the root cause and call it done.

---

## STEP 0: Before Anything

**Do this first. Always.**

```bash
# Create postmortem folder if not exists
mkdir -p postmortem

# Add to .gitignore (postmortems can have sensitive blast radius / customer impact data)
if ! grep -qxF 'postmortem/' .gitignore 2>/dev/null; then
  echo 'postmortem/' >> .gitignore
  echo "added postmortem/ to .gitignore"
fi
```

If no `.gitignore` exists, create one with `postmortem/` as first entry.

---

## STEP 1: Gather Context

Ask user for these. Be direct, not a form. One shot:

**Required:**
- Incident title (short, descriptive — not "Production Issue")
- Severity (SEV1 / SEV2 / SEV3 / SEV4)
- Date + time of incident (UTC preferred)
- Duration
- What broke (user-facing impact, one sentence)
- Root cause (even rough — will refine)
- Who was on-call / who responded

**Optional but valuable:**
- Timeline (can be rough, will format it)
- Metrics (error rate, affected users, revenue loss)
- Action items already identified
- Related past incidents

If user gives a wall of text / Slack dump / runbook notes — parse it. Extract the structure. Don't make them re-type.

---

## STEP 2: Generate the Report

File: `postmortem/YYYY-MM-DD-<slug>.md`

Slug = lowercase kebab-case of incident title.
Example: `postmortem/2024-01-15-payment-service-db-pool-exhaustion.md`

Use this template. Fill everything. Never leave `[TBD]` in P0/P1 sections.

```markdown
# Postmortem: {INCIDENT_TITLE}

**Date**: {DATE}  
**Authors**: {AUTHORS}  
**Status**: Draft  
**Severity**: {SEV_LEVEL}  
**Duration**: {DURATION}  

---

## TL;DR

{ONE PARAGRAPH. What broke. For how long. How many users. Root cause in one sentence. What fixed it.}

**Impact snapshot:**
- Users affected: {N}
- Duration: {DURATION}
- Revenue impact: {$ or "Not quantified"}
- Data loss: Yes / No
- Security implications: Yes / No

---

## Timeline

> All times UTC/IST (IST preferred if user based in India). Be precise. Approximate is fine, blank is not.

| Time | Event |
|------|-------|
{TIMELINE_ROWS}

---

## Root Cause

### What happened

{2-3 sentences. Mechanical. What actually failed.}

### Why it happened — 5 Whys

| # | Question | Answer | Evidence |
|---|----------|--------|----------|
| 1 | Why did {SYMPTOM} occur? | {ANSWER} | {METRIC / LOG / CODE} |
| 2 | Why did {ANSWER_1} happen? | {ANSWER} | {EVIDENCE} |
| 3 | Why did {ANSWER_2} happen? | {ANSWER} | {EVIDENCE} |
| 4 | Why did {ANSWER_3} happen? | {ANSWER} | {EVIDENCE} |
| 5 | Why did {ANSWER_4} happen? | {ANSWER} | {EVIDENCE} |

**Identified root causes:**
- Primary: {ROOT_CAUSE}
- Contributing: {CONTRIBUTING_FACTORS}

### System context

```
{ASCII diagram of affected system flow — even rough is fine}
```

---

## Detection

**Time to detect**: {N} minutes after incident start  
**Detected by**: Alert / Customer report / On-call observation

### What worked
- {THING}

### What didn't
- {THING}

### Detection gap
{Was there a gap between when the issue started and when we knew? What would close it?}

---

## Response

**Time to resolve**: {N} minutes from detection  
**Responders**: {NAMES / HANDLES}

### What worked
- {THING}

### What could be faster
- {THING}

---

## Lessons

### Went well
1. {THING}

### Went wrong
1. {THING}

### Got lucky
1. {THING — be honest here, luck is real and pretending otherwise is how you get surprised again}

---

## Action Items

> P0 = fix before next deploy. P1 = this sprint. P2 = this quarter.

| Priority | Action | Owner | Due | Ticket |
|----------|--------|-------|-----|--------|
{ACTION_ROWS}

---

## Appendix

### Metrics / Graphs
{Links to dashboards, snapshots — or describe what you'd want to see here}

### Related incidents
{Prior incidents with same failure mode, if known}

### References
{Runbooks consulted, docs, PRs reviewed}
```

---

## STEP 3: Review Pass

Before saving, check:

- [ ] No person blamed. System blamed. Always system.
- [ ] Timeline has no gaps > 10 min without explanation
- [ ] 5 Whys went deep enough (if Why 3 is still a person's mistake, go deeper)
- [ ] Every action item has an owner. No orphan actions.
- [ ] "Got lucky" section is honest. If you didn't get lucky, say so.
- [ ] TL;DR is actually a TL;DR (< 100 words)

---

## STEP 4: Save and Confirm

```bash
# Save file
cat > postmortem/YYYY-MM-DD-slug.md << 'EOF'
{REPORT CONTENT}
EOF

echo "postmortem saved: postmortem/YYYY-MM-DD-slug.md"
echo "gitignored: yes"
```

Tell user:
1. File location
2. That it's gitignored (so sensitive impact data stays local)
3. Suggest next: share in incident channel, create tickets for P0s

---

## Blameless Culture — the 30 second version

Blame shuts down learning. When someone makes a mistake in a system, the question is never *who* — it's *what conditions let this happen*. Fix the conditions.

| Don't say | Say instead |
|-----------|-------------|
| "Alice pushed broken code" | "The deploy lacked a canary stage" |
| "Bob missed it in review" | "The review checklist didn't cover infra changes" |
| "On-call was slow" | "Alert threshold was too high to fire early" |

The goal: next engineer in same situation succeeds. Not: next engineer is scared.

---

## Triggers Reference

These phrases should load this skill:
- `/postmortem`
- `write a postmortem`
- `incident review` / `post-incident`
- `SEV1` / `SEV2` / `SEV3` — any severity label near "report" or "review"
- `what broke and why`
- `we had an outage`
- `production incident`
- `blameless review`
- `help me document the incident`

---

## Edge Cases

**"It was a minor incident"** — still write it. SEV3s reveal patterns SEV1s don't.

**"I don't know the root cause yet"** — write what you know. Mark root cause section as `[INVESTIGATION IN PROGRESS]`. Revisit.

**"It was a third-party issue"** — still write it. Root cause = vendor. Action items = better circuit breakers, fallbacks, SLA review.

**"We fixed it, no action items needed"** — wrong. There's always at least one. "Monitor X metric" counts.

**"I just want the template"** — skip to Step 2, dump the template, let them fill it. Still do Step 0 (mkdir + gitignore).

---

## Files Created by This Skill

```
postmortem/                    # gitignored, auto-created
└── YYYY-MM-DD-<slug>.md      # the report
.gitignore                     # updated with postmortem/ entry
```

That's it. No extra config. No setup. Just: incident happens → run skill → file exists → tickets exist → done.

---

## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP v1.0.0) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: process
composable: true
yields_to: []  # process owns structure — nobody overrides it
```

Postmortem owns **process** — the workflow, template, required sections, review checklist, file structure. The skeleton is sacred.

### When Postmortem Leads

- Any incident documentation request
- When structured blameless analysis is needed
- SEV reports, outage reviews, failure documentation

### When Postmortem Defers

| Other Skill's Domain | What Postmortem Does |
|---------------------|-------------------|
| **Voice** (e.g. personality/tone) | Postmortem provides the structure and required content. Voice skills fill it with personality. The timeline table still has precise times. The 5 Whys still go 5 deep. But the prose in "What happened" and "Lessons" sections can carry voice. |
| **Density** (e.g. compression) | After the report is generated, density skills can compress it. Postmortem generates the full report first — never skip sections for brevity. Compression is a post-processing step. |
| **Craft** (e.g. design/UI expertise) | If the incident involved UI/UX issues, invite craft skills to fill the technical analysis sections. Postmortem provides the section header and context; the craft skill provides the design-specific diagnosis. |

### Layered Composition Rules

1. **Process + Voice**: Structure first, voice second. Every required section exists. Every required field is filled. Voice applies WITHIN sections, never restructures them. The "Got lucky" section written in a casual voice is still a "Got lucky" section with honest content.

2. **Process + Density**: Pipeline pattern. Postmortem generates full report → density skill compresses it. The density skill must preserve: all section headers, table structures, required fields, timeline entries. Compress only the prose in description paragraphs.

3. **Process + Craft**: If the incident was UI-related, the "Root Cause" and "System context" sections benefit from craft skill analysis. Postmortem provides the section; craft fills the technical details (what broke visually, what heuristic was violated, what the fix should be).

4. **Process + Voice + Density (triple layer)**: Postmortem provides structure → voice fills sections with personality → density compresses the result. This is the full pipeline. Output: a postmortem report that sounds like the author, is compressed for storage, but has every required section.

### Pipeline Behavior

- **Upstream** (receives content from another skill): Rare. Postmortem usually starts from raw user input. But if another skill pre-processed incident data (e.g., a craft skill already diagnosed a UI regression), incorporate that analysis into the appropriate section.
- **Downstream** (postmortem output goes to another skill): Common. Report → compress (density), report → blog post (voice + content), report → UI audit (craft). Postmortem's structured output is designed to be machine-readable and skill-parseable.

### Handoff Patterns

Postmortem naturally leads to other skills:

```
postmortem → blogger
  "Write a blog post about what we learned from this incident"
  Postmortem provides the facts. Blogger provides the voice.
  
postmortem → compress
  "Compress the postmortem for the knowledge base"
  Full report → compressed version. Structure preserved.

postmortem → painter (advisory)
  "The incident was a CSS regression — what exactly broke?"
  Painter fills the technical analysis. Postmortem owns the structure.
```

### Conflict Signal

If another skill tries to modify postmortem's structure:

> `⚠️ Process conflict: postmortem structure is fixed. [Skill X] attempting to [merge sections / skip required fields / restructure template]. Preserving structure, applying [Skill X] within sections only.`