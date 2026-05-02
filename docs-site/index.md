---
layout: home

hero:
  name: Skills for Agents
  text: Composable instruction sets for AI agents
  tagline: Domain-specific skills that work together without conflict. Built on the SIP Framework.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/IsNoobgrammer/skills-for-agents

features:
  - icon: 🎯
    title: Domain-Specific
    details: Each skill owns one aspect — voice, density, craft, or process. No overlap, no conflict.
  
  - icon: 🔗
    title: Composable
    details: Skills work together seamlessly. Caveman + Blogger = terse posts in authentic voice.
  
  - icon: 📐
    title: SIP Framework
    details: Skills Interoperability Protocol ensures every skill knows how to compose with others.
  
  - icon: ⚡
    title: Production-Ready
    details: Battle-tested skills for ML research, documentation, UI/UX, incident response, and more.
  
  - icon: 🎨
    title: 13 Skills Included
    details: Blogger, Caveman, Compress, Documenter, Harden, Learn, Memory, ML Engine, Painter, Postmortem, Refactor, Researcher, Skill Creator.
  
  - icon: 🚀
    title: Framework-Agnostic
    details: Drop into any agent framework. Works with any LLM that supports system prompts.
---

## Quick Example

```bash
# Layered composition — both skills active simultaneously
/blog technical + /caveman lite
→ Blogger writes technical post, caveman compresses output

# Pipeline composition — sequential
/postmortem → /compress
→ Postmortem generates report → compress shrinks it

# Natural language
"Write a blog about the UI incident, make it terse"
→ blogger (voice) + caveman (density) + postmortem (content)
```

## Why Skills?

Traditional AI prompts are monolithic — one giant instruction set that tries to do everything. When you need multiple capabilities, they conflict.

Skills solve this by:

1. **Domain separation** — each skill owns one aspect (voice, density, craft, process)
2. **Explicit composition** — skills declare what they yield to
3. **Conflict resolution** — SIP Framework provides precedence rules

Result: skills that compose without breaking each other.

## Available Skills

| Skill | Domain | What It Does |
|-------|--------|-------------|
| [Blogger](/skills/blogger) | Voice | Authentic personal-voice writing. Raw, unpolished, stream-of-consciousness. |
| [Caveman](/skills/caveman) | Density | Ultra-terse communication. Cuts token usage ~75%. |
| [Compress](/skills/compress) | Density | File compression. 4 intensity levels. Preserves all meaning. |
| [Documenter](/skills/documenter) | Content | Comprehensive documentation. Examples, guides, API references. |
| [Harden](/skills/harden) | Craft | Production-harden code for 1M+ users. Caching, rate limiting, graceful shutdown. |
| [Memory](/skills/memory) | Process | Persistent context engine. Daily journal rotation, manifest indexing. |
| [ML Engine](/skills/ml-engine) | Process | TPU-first ML research. Distributed training, MoE, Pallas kernels. |
| [Painter](/skills/painter) | Craft | Max pro UI/UX design. Animation, color, typography, accessibility. |
| [Postmortem](/skills/postmortem) | Process | Blameless incident documentation. 5 Whys, action items. |
| [Refactor](/skills/refactor) | Process | Restructure messy codebases into clean, modular architecture. |
| [Researcher](/skills/researcher) | Content | Deep web research. Diverse sources, cross-referencing, synthesis. |
| [Learn](/skills/learn) | Content | Structured study plans, topic guides, exam prediction, and active recall. |
| [Skill Creator](/skills/skill-creator) | Process | Meta-skill for creating, auditing, and improving other skills. |

## Get Started

1. **Read the [Getting Started Guide](/guide/getting-started)** — understand the basics
2. **Learn the [SIP Framework](/guide/sip-framework)** — how skills compose
3. **Explore [Skills](/skills/)** — see what's available
4. **[Create Your Own](/guide/creating-skills)** — build custom skills

## License

MIT — use freely, commercially or otherwise.
