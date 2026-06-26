/**
 * installer.js — Core installation logic for skills-for-agents
 *
 * Handles tool detection, file copying, and multi-tool support.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const HOME = os.homedir();
// ─── Cross-platform path helpers ──────────────────────────────────────────────

function getHermesSkillsDir() {
  const platform = os.platform();
  if (platform === "win32") {
    const localAppData =
      process.env.LOCALAPPDATA || path.join(HOME, "AppData", "Local");
    return path.join(localAppData, "hermes", "skills");
  } else if (platform === "darwin") {
    return path.join(HOME, "Library", "Application Support", "hermes", "skills");
  } else {
    const xdgData =
      process.env.XDG_DATA_HOME || path.join(HOME, ".local", "share");
    return path.join(xdgData, "hermes", "skills");
  }
}


// ─── Tool definitions ───────────────────────────────────────────────────────

const TOOLS = {
  antigravity: {
    name: "Antigravity (Gemini)",
    global: path.join(HOME, ".gemini", "config", "skills"),
    project: null,
    format: "folder",
    detect() {
      return (
        fs.existsSync(path.join(HOME, ".gemini")) ||
        fs.existsSync(path.join(HOME, ".gemini", "config", "skills"))
      );
    },
  },
  hermes: {
    name: "Hermes Agent",
    global: path.join(getHermesSkillsDir(), "sfa"),
    project: null,
    format: "folder",
    detect() {
      return fs.existsSync(getHermesSkillsDir());
    },
  },
  claude: {
    name: "Claude Code",
    global: path.join(HOME, ".claude", "skills"),
    project: ".claude/skills",
    format: "folder",
    detect() {
      return (
        fs.existsSync(path.join(HOME, ".claude")) ||
        fs.existsSync(".claude")
      );
    },
  },
  codex: {
    name: "Codex (OpenAI)",
    global: null,
    project: "codex.md",
    format: "merged",
    header: "# Skills for Codex\n\n",
    detect() {
      return (
        fs.existsSync("codex.md") ||
        fs.existsSync("AGENTS.md") ||
        fs.existsSync("instructions.md")
      );
    },
  },
  cursor: {
    name: "Cursor",
    global: null,
    project: ".cursor/rules",
    format: "files",
    detect() {
      return (
        fs.existsSync(".cursor") ||
        fs.existsSync(".cursorrules")
      );
    },
  },
  windsurf: {
    name: "Windsurf",
    global: null,
    project: ".windsurf/rules",
    format: "files",
    detect() {
      return (
        fs.existsSync(".windsurf") ||
        fs.existsSync(".windsurfrules")
      );
    },
  },
  kiro: {
    name: "Kiro (Amazon)",
    global: path.join(HOME, ".kiro", "skills"),
    project: ".kiro/steering",
    format: "folder",
    detect() {
      return (
        fs.existsSync(path.join(HOME, ".kiro")) ||
        fs.existsSync(".kiro")
      );
    },
  },
  zed: {
    name: "Zed",
    global: null,
    project: ".rules",
    format: "merged",
    header: "# Skills for Zed\n\n",
    detect() {
      return (
        fs.existsSync(".rules") ||
        fs.existsSync(".zed")
      );
    },
  },
  cline: {
    name: "Cline",
    global: null,
    project: ".clinerules",
    format: "folder",
    detect() {
      return (
        fs.existsSync(".clinerules") ||
        fs.existsSync(".cline")
      );
    },
  },
  aider: {
    name: "Aider",
    global: null,
    project: "CONVENTIONS.md",
    format: "merged",
    header: "# Skills for Aider\n\n",
    detect() {
      return (
        fs.existsSync("CONVENTIONS.md") ||
        fs.existsSync(".aider.conf.yml")
      );
    },
  },
  copilot: {
    name: "GitHub Copilot",
    global: null,
    project: ".github/copilot-instructions.md",
    format: "merged",
    header: "# Skills for GitHub Copilot\n\n",
    detect() {
      return (
        fs.existsSync(".github/copilot-instructions.md") ||
        fs.existsSync(".github")
      );
    },
  },
  continue: {
    name: "Continue",
    global: path.join(HOME, ".continue", "rules"),
    project: ".continue/rules",
    format: "folder",
    detect() {
      return (
        fs.existsSync(path.join(HOME, ".continue")) ||
        fs.existsSync(".continue")
      );
    },
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDirSync(src, dest, { force = false, skipPatterns = [] } = {}) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip patterns
    if (skipPatterns.some((p) => entry.name === p || entry.name.match(p))) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath, { force, skipPatterns });
    } else {
      if (!force && fs.existsSync(destPath)) {
        const srcContent = fs.readFileSync(srcPath);
        const destContent = fs.readFileSync(destPath);
        if (srcContent.equals(destContent)) continue;
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getSkillDirs(skillsRoot) {
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

function readSkillName(skillDir) {
  const skillMd = path.join(skillDir, "SKILL.md");
  if (!fs.existsSync(skillMd)) return null;
  const content = fs.readFileSync(skillMd, "utf8");
  const match = content.match(/^name:\s*(.+)$/m);
  return match ? match[1].trim() : path.basename(skillDir);
}

// ─── Install modes ──────────────────────────────────────────────────────────

function installFolder(skillsRoot, skillNames, dest, { force }) {
  const skip = ["node_modules", "data", ".git"];
  for (const name of skillNames) {
    const src = path.join(skillsRoot, name);
    const dst = path.join(dest, name);
    if (!fs.existsSync(src)) {
      console.log(`  ⚠ Skill not found: ${name}`);
      continue;
    }
    copyDirSync(src, dst, { force, skipPatterns: skip });
    console.log(`  ✓ ${name}`);
  }
  // Copy PROTOCOL.md to skills root
  const protoSrc = path.join(skillsRoot, "PROTOCOL.md");
  if (fs.existsSync(protoSrc)) {
    fs.copyFileSync(protoSrc, path.join(dest, "PROTOCOL.md"));
  }
}

function installFiles(skillsRoot, skillNames, dest, { force }) {
  ensureDir(dest);
  for (const name of skillNames) {
    const skillMd = path.join(skillsRoot, name, "SKILL.md");
    if (!fs.existsSync(skillMd)) {
      console.log(`  ⚠ No SKILL.md in ${name}`);
      continue;
    }
    const destFile = path.join(dest, `${name}.md`);
    if (!force && fs.existsSync(destFile)) {
      const src = fs.readFileSync(skillMd);
      const dst = fs.readFileSync(destFile);
      if (src.equals(dst)) {
        console.log(`  ✓ ${name} (unchanged)`);
        continue;
      }
    }
    fs.copyFileSync(skillMd, destFile);
    console.log(`  ✓ ${name}.md`);
  }
}

function installMerged(skillsRoot, skillNames, destFile, { force, header }) {
  if (!force && fs.existsSync(destFile)) {
    console.log(`  ⚠ ${destFile} already exists (use --force to overwrite)`);
    return;
  }

  let merged = header || "# Skills for Agents\n\n";
  merged += "Auto-generated by `npx skills-for-agents install`.\n\n";

  // Prepend PROTOCOL.md
  const protoSrc = path.join(skillsRoot, "PROTOCOL.md");
  if (fs.existsSync(protoSrc)) {
    merged += fs.readFileSync(protoSrc, "utf8") + "\n\n---\n\n";
  }

  for (const name of skillNames) {
    const skillMd = path.join(skillsRoot, name, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;
    const content = fs.readFileSync(skillMd, "utf8");
    merged += `# Skill: ${name}\n\n${content}\n\n---\n\n`;
  }

  // Ensure parent directory exists
  const parentDir = path.dirname(destFile);
  if (parentDir && parentDir !== ".") {
    ensureDir(parentDir);
  }

  fs.writeFileSync(destFile, merged.trim() + "\n");
  console.log(`  ✓ ${destFile} (${skillNames.length} skills merged)`);
}

// ─── Main install function ──────────────────────────────────────────────────

async function install({
  skillsRoot,
  tools: toolNames,
  project,
  global: globalFlag,
  force,
  all,
  only,
}) {
  const skillNames = getSkillDirs(skillsRoot);
  const toInstall = only || skillNames;

  console.log(`\n  skills-for-agents v1.0.5\n`);
  console.log(`  Skills: ${toInstall.length} found\n`);

  // Determine which tools to install to
  let targets = [];

  if (all) {
    targets = Object.keys(TOOLS);
  } else {
    targets = toolNames.filter((t) => TOOLS[t]);
    if (targets.length === 0) {
      // Auto-detect
      targets = Object.keys(TOOLS).filter((t) => TOOLS[t].detect());
      if (targets.length === 0) {
        console.log(
          "  No AI coding tools detected. Use --tool <name> to specify."
        );
        console.log(
          `  Supported: ${Object.keys(TOOLS).join(", ")}\n`
        );
        return;
      }
      console.log(
        `  Detected tools: ${targets.map((t) => TOOLS[t].name).join(", ")}\n`
      );
    }
  }

  for (const toolKey of targets) {
    const tool = TOOLS[toolKey];
    if (!tool) {
      console.log(`  ⚠ Unknown tool: ${toolKey}`);
      continue;
    }

    console.log(`  Installing for ${tool.name}:`);

    if (tool.format === "folder") {
      // Install to global or project
      if (project && tool.project) {
        const dest = path.resolve(tool.project);
        installFolder(skillsRoot, toInstall, dest, { force });
      } else if (tool.global) {
        installFolder(skillsRoot, toInstall, tool.global, { force });
      } else {
        console.log(`  ⚠ No global path for ${tool.name}, skipping`);
      }
    } else if (tool.format === "files") {
      if (project && tool.project) {
        const dest = path.resolve(tool.project);
        installFiles(skillsRoot, toInstall, dest, { force });
      } else {
        console.log(
          `  ⚠ ${tool.name} requires --project (project-level install only)`
        );
      }
    } else if (tool.format === "merged") {
      if (project && tool.project) {
        const dest = path.resolve(tool.project);
        installMerged(skillsRoot, toInstall, dest, { force, header: tool.header });
      } else {
        console.log(
          `  ⚠ ${tool.name} requires --project (project-level install only)`
        );
      }
    }

    console.log();
  }

  console.log("  Done!\n");
}

// ─── List ───────────────────────────────────────────────────────────────────

function listSkills() {
  const skillsRoot = path.join(__dirname, "..", "skills");
  const skillNames = getSkillDirs(skillsRoot);

  console.log(`\n  Available skills (${skillNames.length}):\n`);

  for (const name of skillNames) {
    const dir = path.join(skillsRoot, name);
    const skillMd = path.join(dir, "SKILL.md");
    if (!fs.existsSync(skillMd)) continue;

    const content = fs.readFileSync(skillMd, "utf8");
    const domainMatch = content.match(/^domain:\s*(.+)$/m);
    const descMatch = content.match(/^description:\s*>?\s*$/m);

    let description = "";
    if (descMatch) {
      const descStart = content.indexOf(descMatch[0]) + descMatch[0].length;
      const descEnd = content.indexOf("\n---", descStart);
      description = content
        .slice(descStart, descEnd > 0 ? descEnd : undefined)
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(" ")
        .slice(0, 80);
    }

    const domain = domainMatch ? domainMatch[1].trim() : "?";
    console.log(
      `  ${name.padEnd(18)} [${domain.padEnd(8)}] ${description}`
    );
  }

  console.log(
    `\n  Install: npx skills-for-agents install\n`
  );
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = { install, listSkills, TOOLS };
