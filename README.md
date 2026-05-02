<div align="center">

# Skills for Agents

**Composable, domain-specific instruction sets for AI agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-live-brightgreen)](https://isnoobgrammer.github.io/skills-for-agents/)
[![SIP Framework](https://img.shields.io/badge/framework-SIP-purple)](docs/sip.md)

[Documentation](https://isnoobgrammer.github.io/skills-for-agents/) • [Getting Started](#quick-start) • [SIP Framework](docs/sip.md) • [Contributing](docs/contributing.md)

</div>

---

## Overview

Skills for Agents is a production-ready ecosystem of composable instruction sets that enable AI agents to handle multiple concerns simultaneously without conflict. Each skill owns one domain (voice, density, craft, process, or content) and works alongside any other skill through the **Skills Interoperability Protocol (SIP)**.

### Why Skills?

Traditional AI prompts are monolithic — one giant instruction set that tries to do everything. When you need multiple capabilities, they conflict. Skills solve this through:

- **Domain separation** — each skill owns one aspect (voice, density, craft, process, content)
- **Explicit composition** — skills declare what they yield to
- **Conflict resolution** — SIP Framework provides precedence rules

Result: skills that compose without breaking each other.

---

## Quick Start

### Installation

```bash
git clone https://github.com/IsNoobgrammer/skills-for-agents.git
```

Each skill is a self-contained folder with a `SKILL.md` file. Point your agent to load these files as system prompts.

### Basic Usage

**Invoke a skill:**
```
/caveman full
```

**Compose skills (layered):**
```
/blog technical + /caveman lite
→ Blogger writes technical post, caveman compresses it
```

**Compose skills (pipeline):**
```
/postmortem → /compress
→ Postmortem generates report, compress shrinks it
```

**Natural language:**
```
"Write a blog about the UI incident, make it terse"
→ Auto-detects: blogger (voice) + caveman (density) + postmortem (content)
```

---

## Available Skills

### Voice

| Skill | Description | Triggers |
|-------|-------------|----------|
| **[Blogger](blogger/)** | Authentic personal-voice writing. Raw, unpolished, stream-of-consciousness prose. | `/blog`, "write a blog", "write like me" |

### Density

| Skill | Description | Triggers |
|-------|-------------|----------|
| **[Caveman](caveman/)** | Ultra-terse communication. Cuts token usage ~75%. | `/caveman`, "talk like caveman", "less tokens" |
| **[Compress](compress/)** | File compression. 4 intensity levels. Preserves all meaning. | `/compress`, "compress this", "reduce tokens" |

### Craft

| Skill | Description | Triggers |
|-------|-------------|----------|
| **[Painter](painter/)** | Max pro UI/UX design. Animation, color, typography, accessibility. 20+ commands. | `/painter`, "make it look pro", "fix the ui" |
| **[Harden](harden/)** | Production-harden code for 1M+ users. Caching, rate limiting, graceful shutdown. | "harden my code", "prepare for launch", "make it scalable" |

### Process

| Skill | Description | Triggers |
|-------|-------------|----------|
| **[Memory](memory/)** | Persistent context engine. Daily journal rotation, manifest indexing, identity tracking. | Startup (mandatory), "I like X", "Here is my key" |
| **[ML Engine](ml-engine/)** | TPU-first ML research. Distributed training, MoE, Pallas kernels. 12+ commands. | `/ml`, TPU mentions, distributed training |
| **[Postmortem](postmortem/)** | Blameless incident documentation. 5 Whys, action items. | `/postmortem`, "incident review", "what broke and why" |
| **[Refactor](refactor/)** | Restructure messy codebases into clean, modular architecture. | "refactor my project", "clean up my code", "split this file" |
| **[Skill Creator](skill-creator/)** | Meta-skill for creating, auditing, and improving other skills. | `/create-skill`, "make a skill", "turn this into a skill" |

### Content

| Skill | Description | Triggers |
|-------|-------------|----------|
| **[Documenter](documenter/)** | Comprehensive documentation. Examples, guides, API references. | "document this", "write docs", "create documentation" |
| **[Learn](learn/)** | Structured study plans, topic guides, exam prediction, and active recall. | `/learn`, "teach me X", "how do I learn Y" |
| **[Researcher](researcher/)** | Deep web research. Diverse sources, cross-referencing, synthesis. | "research X", "find info about Y", "what's the latest on Z" |

---

## Key Features

### 🎯 Domain-Specific
Each skill owns one aspect — voice, density, craft, or process. No overlap, no conflict.

### 🔗 Composable
Skills work together seamlessly. Caveman + Blogger = terse posts in authentic voice.

### 📐 SIP Framework
Skills Interoperability Protocol ensures every skill knows how to compose with others.

### ⚡ Production-Ready
Battle-tested skills for ML research, documentation, UI/UX, incident response, and more.

### 🎨 13 Skills Included
Blogger, Caveman, Compress, Documenter, Harden, Learn, Memory, ML Engine, Painter, Postmortem, Refactor, Researcher, Skill Creator.

### 🚀 Framework-Agnostic
Drop into any agent framework. Works with any LLM that supports system prompts.

---

## Composition Examples

### Terse Technical Writing
```bash
/blog technical + /caveman lite
```
Blogger writes technical post, caveman compresses it.

### Production-Ready Code
```bash
/refactor → /harden
```
Refactor establishes structure, harden adds production patterns.

### Comprehensive Docs
```bash
/documenter + /researcher
```
Researcher gathers context, documenter structures it into docs.

### Incident Response
```bash
/postmortem → /compress
```
Postmortem generates report, compress shrinks it for storage.

### ML Research
```bash
/ml-engine + /researcher
```
Researcher finds prior work, ml-engine implements experiments.

---

## SIP Framework

The **Skills Interoperability Protocol** is the composability contract that makes multi-skill execution possible.

### Core Concepts

**Domains:**
- **Voice** — tone, personality, vocabulary
- **Density** — token count, verbosity
- **Craft** — visual design, code quality
- **Process** — workflow steps, templates
- **Content** — substance being produced

**Composition Modes:**
- **Layered** — simultaneous application (`/skill1 + /skill2`)
- **Pipeline** — sequential processing (`/skill1 → /skill2`)
- **Handoff** — skill delegates to another
- **Advisory** — skill references another's principles

**Precedence Rules:**
1. Safety/Accuracy (always wins)
2. User's explicit instruction
3. Domain owner (authoritative in its domain)
4. Most recently invoked
5. Specificity (narrow scope beats broad)

[Read full SIP specification →](docs/sip.md)

---

## Documentation

- **[Live Documentation](https://isnoobgrammer.github.io/skills-for-agents/)** — Complete guides, API references, examples
- **[Getting Started](https://isnoobgrammer.github.io/skills-for-agents/guide/getting-started)** — Installation and basic usage
- **[SIP Framework](docs/sip.md)** — Composability contract and domain rules
- **[Creating Skills](https://isnoobgrammer.github.io/skills-for-agents/guide/creating-skills)** — Build your own skills
- **[Contributing Guide](docs/contributing.md)** — How to contribute to the ecosystem
- **[Automation Bots](docs/bots.md)** — Automated PR review and validation

---

## Contributing

We welcome contributions! Whether you're:

- Creating new skills
- Improving existing skills
- Fixing bugs
- Enhancing documentation
- Building tooling

Please read our [Contributing Guide](docs/contributing.md) to get started.

### Creating a New Skill

Use the `skill-creator` skill to scaffold a new skill with SIP compliance built in:

```bash
/create-skill
```

Or manually:

1. Create a new folder with your skill name (kebab-case)
2. Add a `SKILL.md` file with frontmatter declaring your domain
3. Follow the [SIP Framework](docs/sip.md) composability rules
4. Submit a PR with your skill


---


## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built on the principles of:
- **Domain-Driven Design** — clear boundaries, explicit contracts
- **Unix Philosophy** — do one thing well, compose freely
- **Progressive Enhancement** — works standalone, better together

---

<div align="center">

**[Documentation](https://isnoobgrammer.github.io/skills-for-agents/)** • **[SIP Framework](docs/sip.md)** • **[Contributing](docs/contributing.md)**

Made with ❤️ by [Shaurya Sharthak](https://github.com/IsNoobgrammer)

</div>
