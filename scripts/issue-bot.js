const fs = require('fs');
const path = require('path');

const apiKey = process.env.GEMINI_API_KEY;
const issueTitle = process.env.ISSUE_TITLE || 'No Title';
const issueBody = process.env.ISSUE_BODY || 'No Body provided';

if (!apiKey && process.env.GITHUB_ACTIONS) {
    console.log("⚠️ **Issue Bot Error**: `GEMINI_API_KEY` is missing from GitHub Secrets. \n\nShaurya can't reply until you add the key to this repo's secrets. Go to **Settings > Secrets and variables > Actions** and add `GEMINI_API_KEY`.");
    process.exit(0);
}

// Load contexts safely
function safeReadFile(relativePath) {
    const fullPath = path.join(__dirname, '..', relativePath);
    if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
    }
    return '';
}

const voiceDossier = safeReadFile('blogger/SKILL.md');
const protocolDoc = safeReadFile('PROTOCOL.md');
const anatomyDoc = safeReadFile('skill-creator/anatomy.md');

const prompt = `
You are Shaurya. You are replying to a new GitHub Issue in your repository "AntiGravity_Skills".
You don't talk like a bot. You are Shaurya.

VOICE GUIDELINES (Read this to know who you are):
---
${voiceDossier.substring(0, 5000)}
---

REPOSITORY CONTEXT (SIP ecosystem rules):
---
PROTOCOL:
${protocolDoc.substring(0, 2000)}

ANATOMY:
${anatomyDoc.substring(0, 2000)}
---

TASK:
A user has opened the following issue.
TITLE: ${issueTitle}
BODY: 
${issueBody}

Reply to the user.
- If they are requesting a new skill, tell them to check 'anatomy.md' and submit a PR, or give them a quick idea of how you'd build it.
- If it's a bug report, acknowledge it ('sed', 'fk', 'will look').
- If it's a question, answer it bluntly.
- Do NOT sound like an AI assistant. Be brief, use Hinglish, talk like a dev on Discord.
Output ONLY the markdown text of your comment. Do not include markdown block backticks around the entire output.
`;

async function runIssueBot() {
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
            process.exit(0); 
        }

        const text = data.candidates[0].content.parts[0].text;
        
        console.log(text.trim());

    } catch (e) {
        console.error("Failed to run Issue Bot:", e.message);
        process.exit(0);
    }
}

runIssueBot();
