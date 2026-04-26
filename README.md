# Skills for Agents

I was tired of agents talking like corporate HR.

Every single prompt: "I'd be happy to help you with that!" Yeah, we get it. But we're paying for those tokens. We're waiting for that latency. 

It's just inefficient. And tbh, it's annoying.

So I wrote these skills. Just small, dense instruction sets to inject some actual personality and efficiency into the system. 

If I want to stop wasting compute on filler words, I use `caveman`. Drops articles. Fragments only. Arrows instead of conjunctions. Cuts token usage by like 75%. Because `New object ref -> re-render` is all you actually need to know.

If I want it to write like me, I use `blogger`. No polish. No fake excitement. Just the raw 2am debugging energy. Because the journey matters, and the journey usually involves staring at a NaN for two hours before realizing what broke. sed.

If I need to fix the UI, I invoke `painter`. This one is dense. It's not just a "make it pretty" prompt. It's a full UI/UX and motion engine distilled from the best design systems. It's got a full catalog of commands—`/painter analyze` for heuristic audits, `/painter polish` for that final 1% of alignment, and the `/painter paint` godmode. The nuclear option. It analyzes, plans, and implements until the design is actually Good. Check [painter/help.md](file:///s:/AntiGravity_Skills/painter/help.md) for the full manual. It's complex because great design is complex.

There's a `compress` skill too. Same philosophy. 2x or 0x.

And a `postmortem` skill. Because no one writes postmortems when they're tired after an incident. This one forces the structure so your 3am brain doesn't skip the root cause.

Then there's `skill-creator`. The meta-skill. The skill that builds skills. It knows the full anatomy — frontmatter, domain declarations, composability sections, SIP compliance, anti-patterns, audit checklists. When you want to turn a workflow into a reusable skill, or improve an existing one, this is what you invoke. It eats the guide files in its folder and produces skills that compose correctly from day one.

## They Work Together

Skills aren't islands. They compose. See [`PROTOCOL.md`](PROTOCOL.md) for the full spec, but here's the gist:

Every skill owns a **domain** — the specific aspect of output it controls:

| Domain | What it Owns | Skills |
|--------|-------------|--------|
| **voice** | Tone, personality, vocabulary | blogger |
| **density** | Token count, compression | caveman (live), compress (files) |
| **craft** | UI/UX, design, code quality | painter |
| **process** | Workflows, templates, structure | postmortem, skill-creator |

When you invoke multiple skills, they don't fight — they compose:

```
# Pipeline: one feeds into the next
/postmortem → /compress
  → postmortem generates report → compress shrinks it

# Layered: both apply simultaneously
/blog technical + /caveman lite
  → blogger handles voice, caveman handles density

# Natural language works too
"Write a blog about the UI incident, make it terse"
  → blogger (voice) + caveman (density) + postmortem (content source)
```

**The key rule**: each skill handles its domain and respects the others. Voice doesn't restructure process. Density doesn't strip personality. Craft doesn't rewrite prose. Process doesn't impose tone.

New skills automatically integrate by declaring their domain in frontmatter and following the protocol. No existing skill needs updating.

---

The models are getting better, but the default prompt engineering is still trying to be polite instead of being useful.

Karm kare. Build the thing. Stop the fluff. 

Expect more skills. We're just getting started. I've got a bunch of ideas pinned for later.

less goo.
