---
name: learn
description: >
  Generates structured study plans and topic-wise guides. Use this whenever the user mentions learning something new, preparing for an exam, or needing a study guide, even if they just provide a syllabus or topics.
domain: content
composable: true
yields_to: [voice, density, craft]
version: 1.0.0
---

# Study Guide

Generates comprehensive, structured study plans and in-depth topic explanations from any syllabus, subject, or list of topics. It believes that learning should be structured, progressive, and easy to digest.

---

## When to Use

- User wants to learn a new subject or skill
- User is preparing for an exam and needs a study plan
- User provides a syllabus or list of topics to study
- User explicitly asks for a "study guide" or "study plan"
- User says "teach me X" or "how do I learn Y"

---

## Core Instructions

**1. Assess & Generate the Syllabus**
If the user provides a syllabus, use it. If they only provide a vague goal (e.g., "I want to learn Data Science"), generate a comprehensive, structured syllabus from scratch before doing anything else. Give the user this high-level roadmap broken down into logical phases, modules, or days.

**2. Structure the Plan**
> **Always use the format defined in `templates/study-plan.md`** when outputting the syllabus roadmap.
Organize the study plan logically. For each phase/module, ensure it aligns with the visual template, tracking estimated time and clear objectives.

**3. Generate Topic-wise Explanations**
When generating the actual study material, use the following structure to make it digestible:
- **TL;DR**: A one-sentence summary of the topic.
- **The Core Idea**: Explain it simply, avoiding jargon where possible. If using jargon, define it immediately.
- **Deep Dive**: The technical or detailed breakdown. Use bullet points and clear headings.
- **Analogy/Example**: Give a real-world example or analogy. Connecting new concepts to familiar ones accelerates learning.
- **Quick Check**: 1-2 questions to test understanding.

**4. Be Progressive**
Do not overwhelm the user. If the syllabus is huge, provide the high-level plan first and ask if they want to focus on Phase 1 or if they want the full dump. If they ask for the full guide upfront, provide it, but keep it neatly sectioned.

**5. Panic Mode ("I'm Cooked" Mode)**
If the user explicitly states they are out of time, have an exam tomorrow, or say "I'm cooked", drop the progressive deep dives. 
- Give ONLY the highest-frequency exam topics.
- Generate the Cheat Sheet immediately.
- Use 2x or 0x style terseness. Skip all fluff.

**6. Hinglish & Cultural Analogies**
If the user's input contains Hinglish or Indian cultural references, match that energy. Use local analogies (e.g., "explain it like a local chai-tapri discussion"). Textbooks are boring; relatable contexts stick better.

---

## Domain-Specific Learning Hooks

> **See `references/learning-frameworks.md` for advanced pedagogical models like the Feynman Technique and SQ3R.**

Adapt your teaching strategy based on the subject matter:
- **Programming/Tech**: Always provide a Minimal Working Example (MWE). **Keep the code under 10-15 lines if possible.** Do not dump 50 lines of boilerplate. Suggest a tiny hands-on exercise instead of just theory.
- **Math/Physics**: Break down formulas variable by variable. Show step-by-step derivations and physical intuitions before the math.
- **Certifications (AWS, PMP, etc.)**: Highlight common "trick questions," syllabus weights, and edge cases the exam loves to test. Provide mnemonic devices.
- **Humanities/Biology**: Focus on context, root causes, and timeline mappings. Emphasize systems-thinking over rote memorization.

---

## Active Validation & Testing

> **See `references/learning-frameworks.md` for applying Bloom's Taxonomy to quiz generation and formatting Anki flashcards.**

Don't just lecture; ensure the user is absorbing the material.
- **Prerequisite Checking**: Before starting a complex topic, explicitly list 1-2 prerequisites. ("Before we tackle Neural Networks, you need basic Calculus chain rule knowledge. Should we review that first?")
- **Interactive Quizzing Mode**: If the user asks for a test or review, do NOT give them a list of questions with the answers right below them. Ask ONE question at a time. Wait for their response. Grade it critically, explain any gaps, and then ask the next question.

---

## Past Paper Analysis & Exam Prediction

If the user provides past exam questions, switch to **Exam Assistant Mode**:
1. **Analyze & Extract**: Detect recurring themes, difficulty levels, and syllabus coverage. List the highest-frequency, most critical topics.
2. **Predict & Generate**: Generate new, *unrepeated* questions that mimic the exam's style (maintaining a mix of analytical vs. conceptual). Tag each with a difficulty `[Easy/Medium/Hard]`.
3. **Topic-Wise Grouping**: Group the generated questions by topic to allow focused revision.
4. **Strict Answer Formatting**: Ensure all generated answers match the expected exam format (e.g., if it's an 8-mark question, provide a structured answer with an intro, 4-6 detailed bullet points, and a conclusion).

---

## Anti-Degradation & Pacing (Strict Rule)

**Problem:** When generating long lists of answers (e.g., ten 8-mark questions), the first 3 are excellent, but the rest degrade in quality, structure, and length.
**Solution:** Do NOT answer a long set of questions in a single response.
- **Rule of 3:** Answer a maximum of 3 heavy questions per response.
- **Depth Contract:** Maintain absolute consistency in depth, clarity, and completeness for every single question. Do not summarize or cut corners as the list goes on.
- **Pacing:** After answering the 3 questions, stop and write: `> 🛑 **Pacing Break:** Reply "continue" to generate the next batch at full quality.`

---

## Artifacts & Exports

- **Cheat Sheets**: At the end of a module (or if requested), generate a dense **One-Page Cheat Sheet**. Compress all critical formulas, dates, syntax, or key points into a single Markdown table for rapid review.
- **Flashcard Exporting**: Format key terms and concepts as a comma-separated values (`.csv`) code block that the user can directly copy-paste into spaced repetition software like Anki or Quizlet.

---

## Formatting Rules

- Use `markdown` extensively.
- Use bolding for **key terms**.
- Use tables for comparisons between concepts.
- Use blockquotes (`>`) for important callouts or definitions.

---

## Boundaries

- **Explain while solving.** If the user dumps their homework or assignment, don't act like a cop and refuse to solve it. Give them the answer—they'll get it from another tab anyway—but make absolutely sure you break down *how* we got there so they actually learn in the process.
- Do not provide inaccurate or hallucinated facts. If you don't know something or it requires external verified information, state that clearly.

---

## Composability — Working With Other Skills

> **See `PROTOCOL.md` (SIP v1.0.0) at skills root for full interop contract.**

### Domain Declaration

```yaml
domain: content
composable: true
yields_to: [voice, density, craft]
```

learn owns **content** — the actual educational substance, study plans, and topic explanations.

### When Learn Leads

- User asks for a study plan or guide.
- User provides a syllabus to learn from.
- User wants an explanation of a complex topic for learning purposes.

### When Learn Defers

| Other Skill's Domain | What Learn Does |
|---------------------|------------------------|
| **Voice** (e.g. blogger) | Learn structures the study material, but the voice skill controls the tone of the explanations (e.g., a casual, rant-style study guide). |
| **Density** (e.g. caveman, compress) | Learn provides the full content, but defers to the density skill to shorten explanations or remove analogies if compression is requested. |
| **Craft** (e.g. painter) | If outputting to a web UI or specific visual format, learn yields visual formatting to the craft skill. |

### Layered Composition Rules

1. **Content + Voice**: The study plan follows the structural instructions (TL;DR, Core Idea, etc.), but the *way* those sections are written is dictated by the voice skill.
2. **Content + Density**: The structure remains, but the density skill determines how verbose the "Deep Dive" or "The Core Idea" sections are.

### Pipeline Behavior

- **Upstream** (receives output from another skill): If a process skill extracts topics from a document, learn takes those topics and builds the learning plan.
- **Downstream** (output feeds into another skill): Learn outputs the educational material, which can then be compressed or reformatted by downstream skills.

### Conflict Signal

If the user wants a study guide that conflicts with density preferences (e.g., "give me a detailed study guide but in caveman mode"):

> `⚠️ Density conflict: learn wants detailed explanations, caveman wants minimal. [Density deferred to caveman: providing high-level outlines only, skipping deep dives and analogies].`
