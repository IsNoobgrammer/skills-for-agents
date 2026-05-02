# Skills

13 production-ready skills for AI agents. Each owns one domain and composes cleanly with others.

::: tip Domain Separation
Skills from different domains compose without conflict. Skills from the same domain follow precedence rules defined in the [SIP Framework](/guide/sip-framework).
:::

## By Domain

### Voice

| Skill | Description | Triggers |
|-------|-------------|----------|
| [Blogger](./blogger) | Authentic personal-voice writing. Raw, unpolished, stream-of-consciousness prose. | `/blog`, "write a blog", "write like me" |

### Density

| Skill | Description | Triggers |
|-------|-------------|----------|
| [Caveman](./caveman) | Ultra-terse communication. Cuts token usage ~75%. | `/caveman`, "talk like caveman", "less tokens" |
| [Compress](./compress) | File compression. 4 intensity levels. Preserves all meaning. | `/compress`, "compress this", "reduce tokens" |

### Craft

| Skill | Description | Triggers |
|-------|-------------|----------|
| [Painter](./painter) | Max pro UI/UX design with WebGPU/shader support. Animation, color, typography, GPU effects. 22+ commands. | `/painter`, "make it look pro", "fix the ui", "gpu effects", "particle system" |
| [Harden](./harden) | Production-harden code for 1M+ users. Caching, rate limiting, graceful shutdown. | "harden my code", "prepare for launch", "make it scalable" |

### Process

| Skill | Description | Triggers |
|-------|-------------|----------|
| [Memory](./memory) | Persistent context engine. Daily journal rotation, manifest indexing, identity tracking. | Startup (mandatory), "I like X", "Here is my key" |
| [ML Engine](./ml-engine) | TPU-first ML research. Distributed training, MoE, Pallas kernels. 12+ commands. | `/ml`, TPU mentions, distributed training |
| [Postmortem](./postmortem) | Blameless incident documentation. 5 Whys, action items. | `/postmortem`, "incident review", "what broke and why" |
| [Refactor](./refactor) | Restructure messy codebases into clean, modular architecture. | "refactor my project", "clean up my code", "split this file" |
| [Skill Creator](./skill-creator) | Meta-skill for creating, auditing, and improving other skills. | `/create-skill`, "make a skill", "turn this into a skill" |

### Content

| Skill | Description | Triggers |
|-------|-------------|----------|
| [Documenter](./documenter) | Comprehensive documentation. Examples, guides, API references. | "document this", "write docs", "create documentation" |
| [Researcher](./researcher) | Deep web research. Diverse sources, cross-referencing, synthesis. | "research X", "find info about Y", "what's the latest on Z" |
| [Learn](./learn) | Structured study plans and topic guides. Exam prediction, panic mode. | "teach me X", "study plan for Y", "I'm cooked" |

## Quick Comparison

| Skill | Domain | Lines | Complexity | Use When |
|-------|--------|-------|------------|----------|
| Blogger | Voice | ~2000 | High | Personal-voice writing |
| Caveman | Density | ~200 | Low | Token efficiency |
| Compress | Density | ~600 | Medium | File compression |
| Documenter | Content | ~1400 | High | Technical docs |
| Harden | Craft | ~300 | Medium | Production readiness |
| Learn | Content | ~500 | Medium | Study guides & exams |
| Memory | Process | ~400 | Medium | Session continuity |
| ML Engine | Process | ~800 | High | ML research |
| Painter | Craft | ~1200 | High | UI/UX design |
| Postmortem | Process | ~300 | Low | Incident response |
| Refactor | Process | ~250 | Low | Code restructuring |
| Researcher | Content | ~600 | Medium | Web research |
| Skill Creator | Process | ~500 | Medium | Skill development |

## Composition Examples

### Terse Technical Writing

```
/blog technical + /caveman lite
```

Blogger writes technical post, caveman compresses it.

### Production-Ready Code

```
/refactor → /harden
```

Refactor establishes structure, harden adds production patterns.

### Comprehensive Docs

```
/documenter + /researcher
```

Researcher gathers context, documenter structures it into docs.

### Incident Response

```
/postmortem → /compress
```

Postmortem generates report, compress shrinks it for storage.

### ML Research

```
/ml-engine + /researcher
```

Researcher finds prior work, ml-engine implements experiments.

## Getting Started

1. **Pick a skill** — start with one that matches your immediate need
2. **Read its docs** — understand commands, options, boundaries
3. **Try it solo** — use it alone first to understand its behavior
4. **Compose gradually** — add other skills one at a time
5. **Check domains** — ensure skills don't conflict (different domains = safe)

## Next Steps

- [Getting Started](/guide/getting-started) — basics of using skills
- [SIP Framework](/guide/sip-framework) — how skills compose
- [Creating Skills](/guide/creating-skills) — build your own
