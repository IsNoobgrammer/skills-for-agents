const fs = require('fs');
const path = require('path');

const VALID_DOMAINS = ['voice', 'density', 'craft', 'process', 'content', 'analysis', 'testing'];
// Use more flexible regex for required sections
const REQUIRED_SECTIONS = [
    { name: 'Title', regex: /^#\s.+/m },
    { name: 'When to Use', regex: /##\s.*(When to Use|Trigger|Triggering)/i },
    { name: 'How It Works', regex: /##\s.*(How It Works|Instructions|Mechanics|Core Instructions)/i },
    { name: 'Composability', regex: /##\s.*(Composability|Working With Other Skills|SIP)/i }
];

function validateSkill(skillPath) {
    const errors = [];
    const skillName = path.basename(skillPath);
    const skillMdPath = path.join(skillPath, 'SKILL.md');

    if (!fs.existsSync(skillMdPath)) {
        errors.push(`Missing SKILL.md in ${skillName}`);
        return { name: skillName, errors };
    }

    const content = fs.readFileSync(skillMdPath, 'utf8');
    const fmMatch = content.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n/);

    if (!fmMatch) {
        errors.push('Missing or malformed frontmatter (---)');
    } else {
        const fmSection = fmMatch[1];
        const fm = {};
        
        const fmLines = fmSection.split('\n');
        let currentKey = null;
        fmLines.forEach(line => {
            const match = line.match(/^(\w+):\s*(.*)/);
            if (match) {
                currentKey = match[1].trim();
                const val = match[2].trim();
                fm[currentKey] = val;
            } else if (currentKey && line.startsWith('  ')) {
                // Continuation of a multi-line string
                fm[currentKey] += ' ' + line.trim();
            }
        });

        // Validate required fields
        if (!fm.name) errors.push('Frontmatter: missing "name"');
        else if (fm.name !== skillName) errors.push(`Frontmatter: "name" (${fm.name}) does not match folder name (${skillName})`);

        if (!fm.description) errors.push('Frontmatter: missing "description"');
        else if (fm.description.length >= 1000) errors.push(`Frontmatter: "description" exceeds 1000 characters (${fm.description.length})`);

        if (!fm.domain) errors.push('Frontmatter: missing "domain"');
        else {
            const domains = fm.domain.split('|').map(d => d.trim().replace(/^['">]+|['">]+$/g, ''));
            const invalid = domains.filter(d => !VALID_DOMAINS.includes(d));
            if (invalid.length > 0) errors.push(`Frontmatter: invalid domain(s): ${invalid.join(', ')}`);
        }

        if (fm.composable === undefined) errors.push('Frontmatter: missing "composable"');
        if (!fm.yields_to) errors.push('Frontmatter: missing "yields_to"');
    }

    // Size validation
    const lineCount = content.split('\n').length;
    let sizeCategory = '';
    const warnings = [];
    if (lineCount < 50) {
        sizeCategory = 'Too Short';
        warnings.push(`Skill is very short (${lineCount} lines). Ensure instructions are adequately detailed.`);
    } else if (lineCount <= 150) {
        sizeCategory = 'Focused';
    } else if (lineCount <= 350) {
        sizeCategory = 'Standard';
    } else if (lineCount <= 500) {
        sizeCategory = 'Comprehensive';
    } else {
        sizeCategory = 'Too Long';
        errors.push(`Size constraint failed: Skill exceeds 500 lines (${lineCount} lines). Extract content into references/ directory.`);
    }

    // Header validation
    REQUIRED_SECTIONS.forEach(section => {
        if (!section.regex.test(content)) {
            errors.push(`Content: missing section "${section.name}"`);
        }
    });

    return { name: skillName, errors, warnings, sizeCategory, lineCount };
}

// Main execution
const target = process.argv[2] || '.';
const results = [];
let totalErrors = 0;

if (fs.existsSync(path.join(target, 'SKILL.md'))) {
    // Target is a single skill folder
    const res = validateSkill(target);
    results.push(res);
    totalErrors += res.errors.length;
} else {
    // Target is a directory containing skills
    const items = fs.readdirSync(target, { withFileTypes: true });
    items.forEach(item => {
        if (item.isDirectory() && !item.name.startsWith('.')) {
            const fullPath = path.join(target, item.name);
            if (fs.existsSync(path.join(fullPath, 'SKILL.md'))) {
                const res = validateSkill(fullPath);
                results.push(res);
                totalErrors += res.errors.length;
            }
        }
    });
}

// Output results
if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ results, totalErrors }, null, 2));
} else {
    console.log('# SIP Validation Report\n');
    results.forEach(res => {
        let status = res.errors.length === 0 ? '✅' : '❌';
        if (res.errors.length === 0 && res.warnings && res.warnings.length > 0) {
            status = '⚠️';
        }
        
        console.log(`${status} **${res.name}**: ${res.sizeCategory} (${res.lineCount} lines)`);
        
        if (res.errors.length > 0) {
            console.log(`   **Errors (${res.errors.length}):**`);
            res.errors.forEach(err => console.log(`   - ${err}`));
        }
        
        if (res.warnings && res.warnings.length > 0) {
            console.log(`   **Warnings (${res.warnings.length}):**`);
            res.warnings.forEach(warn => console.log(`   - ${warn}`));
        }
    });

    if (totalErrors > 0) {
        console.log(`\n❌ Total errors found: ${totalErrors}`);
    } else {
        console.log('\nAll skills passed SIP strict checks.');
    }
}

if (totalErrors > 0) {
    process.exit(1);
}
