# SIP — Skills Interoperability Protocol

The **Skill Interoperability Protocol (SIP)** is the universal contract that allows different AI skills to work together without breaking each other's output.

## Why SIP?

Standard prompt engineering treats instructions as isolated islands. If you tell an AI to "be terse" and "write a blog post," the two instructions often fight. One wants detail, the other wants brevity.

SIP solves this by defining **Domains**. A skill doesn't own the whole conversation; it only owns its domain.

## SIP Skills vs. Non-SIP Skills

| Feature | SIP Skills | Non-SIP / Generic Skills |
|---------|------------|--------------------------|
| **Composition** | Works alongside any other skill (Layered or Pipeline) | Usually conflicts or overrides previous instructions |
| **Domain Ownership** | Explicitly declares what it controls (e.g., `voice`, `density`) | Implicitly tries to control everything |
| **Standardization** | Follows strict frontmatter and section requirements | Random structure, hard for bots to validate |
| **Precedence** | Knows when to lead and when to defer | Silent failures or "prompt leakage" |
| **Validation** | Automatically audited by the `sip-validator` bot | Hard to test for consistency |

## Core Principles

1. **Safety/Accuracy First**: No skill can override safety warnings or factual accuracy.
2. **Domain Authority**: If a `voice` skill is active, it owns the tone. A `density` skill won't change the tone; it will just change the word count.
3. **Marker Preservation**: Skills must preserve the structure (tables, code blocks) created by upstream skills.

> See the full technical specification in [`PROTOCOL.md`](../PROTOCOL.md).
