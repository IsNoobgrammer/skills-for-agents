# Contributing Guide

Want to add a new skill or improve an existing one? Less goo.

## The `skill-creator` Tool

The easiest way to build a skill is to use the `skill-creator` meta-skill. It is designed to guide you through the entire lifecycle of a skill:

1. **Invoke**: Call `/create-skill` or say "I want to turn this workflow into a skill."
2. **Interview**: The tool will ask you about the domain, triggers, and boundaries.
3. **Draft**: It will generate a SIP-compliant `SKILL.md` for you.
4. **Audit**: It will check the draft against the SIP v1 checklist.

## Naming & Intuition

We like things simple and intuitive.

- **Folder Names**: lowercase-with-hyphens (e.g., `code-reviewer`, `sql-expert`).
- **Triggering**: Make your skill description "pushy." It should trigger even if the user isn't explicit, but only when it's genuinely helpful.
- **Explain the Why**: Don't just give commands. Explain *why* the AI should behave this way. LLMs respond better to reasoning.

## How to Submit

1. Create a new directory for your skill.
2. Add a `SKILL.md` (use the template provided by `skill-creator`).
3. Run the validator locally: `node scripts/sip-validator.js <your-skill-folder>`.
4. Open a Pull Request.

> [!TIP]
> Use the `/painter` skill if you need help designing the documentation structure or visual elements for your skill.
