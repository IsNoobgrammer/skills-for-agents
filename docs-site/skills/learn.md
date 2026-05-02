# Learn

Generates structured study plans and topic-wise guides. Use this whenever you need to learn something new, prepare for an exam, or need a structured roadmap for any subject.

## Domain

**Content** — the actual educational substance, study plans, and topic explanations.

## When to Use

- "teach me X", "how do I learn Y"
- "I have an exam tomorrow", "I'm cooked"
- Providing a syllabus or list of topics to study
- "create a study plan for X"

## Features

### 1. Structured Roadmap
Generates a comprehensive, phase-based syllabus if one isn't provided. Uses a standardized template for clear progress tracking.

### 2. Digestible Explanations
Every topic follows a consistent structure:
- **TL;DR**: One-sentence summary.
- **The Core Idea**: Simple explanation.
- **Deep Dive**: Technical breakdown.
- **Analogy/Example**: Real-world context.
- **Quick Check**: Verification questions.

### 3. Exam Assistant Mode
Analyzes past papers to detect recurring themes and predict potential questions. Generates answers in strict exam-compliant formats.

### 4. Panic Mode ("I'm Cooked")
Drops the deep dives for high-frequency topics and immediate cheat sheets when time is critical.

### 5. Interactive Validation
Doesn't just lecture—it quizzes you one question at a time to ensure absorption.

## Composability

```yaml
domain: content
composable: true
yields_to: [voice, density, craft]
```

## Related Skills

- [Documenter](./documenter) — turns study materials into permanent docs
- [Researcher](./researcher) — gathers latest info for study guides
- [Blogger](./blogger) — explains topics in a personal, relatable voice

## Resources

- [Full SKILL.md](https://github.com/IsNoobgrammer/skills-for-agents/blob/main/learn/SKILL.md)
