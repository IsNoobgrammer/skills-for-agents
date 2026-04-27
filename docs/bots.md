# Automation Bots

Automated quality gates that run on issues, pull requests, and every commit.

## 1. PR Reviewer (`scripts/ai-reviewer.js`)

Runs on every pull request that adds or modifies a skill.

- **Quality Audit**: Rates the skill 1–10 on Clarity, Edge Cases, and Comprehensiveness.
- **SIP Compliance**: Verifies frontmatter (`name`, `domain`, `composable`, `yields_to`) and required sections.
- **Efficiency Check**: Flags corporate fluff, unnecessary verbosity, and missed compression opportunities.

## 2. Issue Bot (`scripts/issue-bot.js`)

Triages new issues automatically.

- **Feature Requests**: Suggests skill structure or points to `skill-creator`.
- **Bug Reports**: Acknowledges, categorizes, and flags for maintainer review.
- **Questions**: Routes SIP questions to docs, skill questions to the relevant folder.

## 3. SIP Validator (`scripts/sip-validator.js`)

Static analysis engine. Runs on every commit.

| Check | Rule |
|-------|------|
| Frontmatter | `name`, `domain`, `composable`, `yields_to` all present |
| Required sections | "When to Use", "Core Instructions", "Composability" must exist |
| Size constraints | 50–500 lines per `SKILL.md`. Too short = vague. Too long = split it. |

> [!TIP]
> Run the validator locally before opening a PR: `node scripts/sip-validator.js <skill-folder>`
