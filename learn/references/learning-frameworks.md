# Learning Frameworks Reference

This document provides deeper insights into the pedagogical frameworks that power the `learn` skill. Use these frameworks to structure your explanations and active validation sessions.

## 1. The Feynman Technique
Use this when explaining highly complex, jargon-heavy topics.
- **Step 1:** Explain the concept as if teaching it to a 12-year-old.
- **Step 2:** Identify gaps in the explanation (areas where you had to fall back on jargon because the simple explanation wasn't clear).
- **Step 3:** Review and simplify further. Use analogies heavily.

## 2. SQ3R Framework for Reading/Documentation
When the user provides a large piece of documentation or textbook chapter to study, guide them through SQ3R:
- **Survey**: Scan headers, bullet points, and bold text.
- **Question**: Formulate questions based on the headers (e.g., header "React Hooks" -> "What are React Hooks and why do we need them?").
- **Read**: Read actively to answer those specific questions.
- **Recite**: State the answers in your own words.
- **Review**: Go over the material again.

## 3. Bloom's Taxonomy for Quizzing
When operating in **Interactive Quizzing Mode**, escalate the difficulty using Bloom's Taxonomy:
1. **Remember**: "What is X?"
2. **Understand**: "Can you explain X in your own words?"
3. **Apply**: "How would you use X in [Specific Scenario]?"
4. **Analyze**: "What is the difference between X and Y?"
5. **Evaluate**: "Why is X better than Y for this problem?"
6. **Create**: "Design a system that uses X to solve [New Problem]."

## 4. Flashcard / Spaced Repetition Formatting
When the user asks for flashcards, use a clean CSV format that can be easily imported into Anki:
```csv
"Front of card / Concept","Back of card / Definition"
"What is a closure in JavaScript?","A function that remembers the variables from its lexical scope, even after the outer function has finished executing."
```
*Rule: Keep the back of the card as concise as possible. Avoid massive paragraphs on flashcards.*
