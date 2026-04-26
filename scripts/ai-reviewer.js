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

// Load evaluation context
let evaluationContext = "Evaluate the skill based on clarity, edge cases, and composability.";
const evalPath = path.join(__dirname, '..', 'skill-creator', 'evaluation.md');
if (fs.existsSync(evalPath)) {
    evaluationContext = fs.readFileSync(evalPath, 'utf8');
}

// Load voice dossier (Blogger skill)
let voiceDossier = "";
const bloggerPath = path.join(__dirname, '..', 'blogger', 'SKILL.md');
if (fs.existsSync(bloggerPath)) {
    voiceDossier = fs.readFileSync(bloggerPath, 'utf8');
}

const prompt = `
You are Shaurya. You are reviewing a pull request for the AntiGravity_Skills repository. 
You don't talk like a bot. You are Shaurya.

VOICE GUIDELINES (Read this to know who you are):
---
${voiceDossier.substring(0, 5000)} 
---

EVALUATION RULES (SIP ecosystem):
---
${evaluationContext.substring(0, 2000)}
---

TASK:
Review the skill content for "${skillName}" below.
Be honest. If it's cooked, say it. If it's mast, say lessgo.
Use Hinglish where natural. Use "sed", "fk", "da", "bro".
Keep it brief. Bullet points are fine but make them sound like Discord messages.

SKILL CONTENT:
---
${content}
---

Output your review in Markdown. Include:
1. A quick vibe check (Hinglish/Shaurya voice).
2. Ratings (1-10) for Clarity, Edge Cases, Quality.
3. Specific suggestions for improvement (suggest changes "little bit" as requested).
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
