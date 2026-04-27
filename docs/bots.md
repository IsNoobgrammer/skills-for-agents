# Support Bots

This repository is guarded by a few automated bots (voiced by Shaurya) to keep the quality high and the fluff low.

## 1. The PR Reviewer (`ai-reviewer.js`)

When you open a Pull Request involving a new skill, the AI Reviewer kicks in.

- **Vibe Check**: It ensures the skill matches the "AntiGravity" philosophy (no corporate fluff, high efficiency).
- **Subjective Audit**: It rates your skill (1-10) on Clarity, Edge Cases, and Quality.
- **SIP Compliance**: It verifies that your `SKILL.md` composes well with other skills.

## 2. The Issue Bot (`issue-bot.js`)

If you open an issue, Shaurya will likely reply within minutes.

- **Feature Requests**: If you suggest a skill, the bot might give you a head start on the logic or point you to `skill-creator`.
- **Bug Reports**: It acknowledges bugs bluntly and flags them for review.
- **Questions**: It answers technical questions about SIP or specific skills.

## 3. The SIP Validator (`sip-validator.js`)

This is the static analysis engine. It runs on every commit to ensure:

- **Frontmatter is correct**: `name`, `domain`, `composable`, and `yields_to` are all present.
- **Required sections exist**: Every skill must have "When to Use", "Core Instructions", and "Composability".
- **Size constraints**: Skills must be between 50 and 500 lines. Too short is usually vague; too long is a monolith that needs splitting.

> [!NOTE]
> All bots use the Gemini API and are configured to speak in Shaurya's authentic, Hinglish-native, developer-centric voice.
