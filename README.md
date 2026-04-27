# Skills for Agents

A collection of composable, domain-specific instruction sets for AI agents. Each skill controls one aspect of output — voice, density, craft, or process — and works alongside any other skill without conflict.

## Available Skills

| Skill | Domain | What It Does |
|-------|--------|-------------|
| [`caveman`](caveman/) | **density** | Ultra-terse communication. Drops filler, articles, hedging. Cuts token usage ~75%. |
| [`blogger`](blogger/) | **voice** | Authentic personal-voice writing. Raw, unpolished, stream-of-consciousness prose. |
| [`painter`](painter/) | **craft** | Max-pro UI/UX design, animation, color, typography, accessibility. 20+ commands. |
| [`compress`](compress/) | **density** | File and directory text compression. 4 intensity levels. Preserves all meaning. |
| [`postmortem`](postmortem/) | **process** | Blameless incident documentation. Structured reports, 5 Whys, action items. |
| [`skill-creator`](skill-creator/) | **process** | Meta-skill for creating, auditing, and improving other skills. SIP compliance built in. |
| [`harden`](harden/) | **craft** | Production-harden code for 1M+ users. Caching, rate limiting, graceful shutdown. |
| [`refactor`](refactor/) | **process** | Restructure messy codebases into clean, modular architecture. |
| [`ml-engine`](ml-engine/) | **process** | TPU-first ML research engine. Distributed training, MoE, Pallas kernels, 12+ commands. |

## They Compose

Skills follow the **SIP Framework** ([docs/sip.md](docs/sip.md) / [PROTOCOL.md](PROTOCOL.md)). Each skill owns its domain and defers to others on everything else.

**Pipeline mode** — sequential:
```
/postmortem → /compress
  → postmortem generates report → compress shrinks it
```

**Layered mode** — simultaneous:
```
/blog technical + /caveman lite
  → blogger handles voice, caveman handles density
```

**Natural language** also works:
```
"Write a blog about the UI incident, make it terse"
  → blogger (voice) + caveman (density) + postmortem (content)
```

> **Key rule**: Voice doesn't restructure process. Density doesn't strip personality. Craft doesn't rewrite prose. Process doesn't impose tone.

New skills integrate automatically by declaring their domain in frontmatter. No existing skill needs updating.

## Documentation

- [**SIP Framework**](docs/sip.md) — Universal composability contract. Why SIP exists, how domains work, conflict resolution.
- [**Contributing Guide**](docs/contributing.md) — How to create new skills using `skill-creator`, naming conventions, validation.
- [**Automation Bots**](docs/bots.md) — Automated PR review, issue triage, and SIP validation.

---

Built for any agent framework. Drop the folder into your skills directory and invoke.

Skills that compose win over skills that override.
