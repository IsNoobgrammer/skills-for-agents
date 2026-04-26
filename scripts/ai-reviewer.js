const fs = require('fs');
const path = require('path');

const target = process.argv[2];
const apiKey = process.env.GEMINI_API_KEY;

if (!target) {
    console.error("No target directory specified.");
    process.exit(1);
}

if (!apiKey) {
    console.error("No GEMINI_API_KEY provided. Skipping AI subjective review.");
    process.exit(0);
}

const skillName = path.basename(target);
const skillMdPath = path.join(target, 'SKILL.md');

if (!fs.existsSync(skillMdPath)) {
    console.error(`Missing SKILL.md in ${skillName}`);
    process.exit(0);
}

const content = fs.readFileSync(skillMdPath, 'utf8');

// Optionally, we could load evaluation.md to use as context
let evaluationContext = "Evaluate the skill based on clarity, edge cases, and composability.";
const evalPath = path.join(__dirname, '..', 'skill-creator', 'evaluation.md');
if (fs.existsSync(evalPath)) {
    evaluationContext = fs.readFileSync(evalPath, 'utf8');
}

const prompt = `
You are an expert AI Bot Reviewer for the AntiGravity_Skills repository.
Your task is to provide a brief, constructive, and highly subjective review of a new or updated skill.

Here are the evaluation rules (SIP ecosystem):
---
${evaluationContext.substring(0, 2000)} // Truncated to save tokens if it's very long
---

Here is the skill content for "${skillName}":
---
${content}
---

Please provide a "Skill Audit" output in Markdown format. Keep it extremely brief (max 3-4 bullet points).
Rate the skill from 1-10 on Instruction Clarity, Edge Case Handling, and Output Quality.
Point out any ambiguities or places where the instructions could be more concise.
Also, suggest 1-2 small, specific changes to improve the skill's structure, clarity, or tone.
Output only the markdown review.
`;

async function runReview() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            process.exit(0); // Exit 0 so we don't break CI just because of AI failure
        }

        const text = data.candidates[0].content.parts[0].text;
        
        console.log(`\n## AI Subjective Review for \`${skillName}\``);
        console.log(text);

    } catch (e) {
        console.error("Failed to run AI review:", e.message);
        process.exit(0);
    }
}

runReview();
