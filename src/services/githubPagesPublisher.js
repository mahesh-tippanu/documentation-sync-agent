import simpleGit from "simple-git";
import fs from "fs/promises";
import path from "path";
import { marked } from "marked";
import { v4 as uuidv4 } from "uuid";
import config from "../config/config.js";
import { info, error } from "../utils/logger.js";

/**
 * Publishes documentation to GitHub Pages on `gh-pages` branch.
 * Creates:
 *   docs/<sha>/index.html     → versioned doc
 *   docs/latest/index.html    → always latest doc
 *   docs/history.json         → track all published versions
 */
export async function publishToGitHubPages(meta, markdownContent) {
    const { sha, repo, owner } = meta;

    const branch = "gh-pages";
    const repoUrl = `https://github.com/${owner}/${repo}.git`;

    const tempDir = path.join("./tmp-pages", uuidv4());
    const docsDir = path.join(tempDir, "docs");
    const versionDir = path.join(docsDir, sha.substring(0, 7));
    const latestDir = path.join(docsDir, "latest");

    try {
        info(`Cloning ${repo} to publish GitHub Pages...`);
        await fs.mkdir(tempDir, { recursive: true });

        const git = simpleGit();

        // Clone only the gh-pages branch
        await git.clone(repoUrl, tempDir, ["--branch", branch, "--single-branch"])
            .catch(async (e) => {
                info(`[gh-pages] Branch not found — creating a new one.`);
                await git.clone(repoUrl, tempDir);
                const g = simpleGit(tempDir);
                await g.checkoutLocalBranch(branch);
            });

        // Markdown → HTML conversion
        const htmlContent = wrapHtmlTemplate(markdownContent);

        // Create directory structure
        await fs.mkdir(versionDir, { recursive: true });
        await fs.mkdir(latestDir, { recursive: true });

        // Write version-specific docs
        await fs.writeFile(path.join(versionDir, "index.html"), htmlContent);

        // Update "latest"
        await fs.writeFile(path.join(latestDir, "index.html"), htmlContent);

        // Update history.json
        const historyFile = path.join(docsDir, "history.json");
        let history = [];

        try {
            const historyRaw = await fs.readFile(historyFile, "utf8");
            history = JSON.parse(historyRaw);
        } catch {
            info("No history.json found — creating a new one.");
        }

        const record = {
            sha: sha.substring(0, 7),
            timestamp: new Date().toISOString(),
            file: `docs/${sha.substring(0, 7)}/index.html`
        };

        history.push(record);
        await fs.writeFile(historyFile, JSON.stringify(history, null, 2));

        const pagesGit = simpleGit(tempDir);
        await pagesGit.addConfig("user.name", "doc-sync-agent");
        await pagesGit.addConfig("user.email", "doc-sync-agent@example.com");

        await pagesGit.add(".");
        await pagesGit.commit(`Publish docs for commit ${sha.substring(0, 7)}`);
        await pagesGit.push("origin", branch);

        info(`GitHub Pages updated successfully for commit ${sha}`);

    } catch (err) {
        error(`[GitHub Pages Error] ${err.message}`);
        throw err;
    } finally {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
            info(`Cleaned GitHub Pages temp directory: ${tempDir}`);
        } catch (cleanupErr) {
            error("Failed cleaning GitHub Pages tmp directory:", cleanupErr.message);
        }
    }
}


/**
 * Wrap HTML content in a clean GitHub Pages–friendly template
 */
function wrapHtmlTemplate(bodyContent) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Documentation</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
    body {
        font-family: Arial, sans-serif; 
        margin: 40px;
        line-height: 1.6;
        max-width: 900px; 
    }
    pre {
        background: #f4f4f4; 
        padding: 12px; 
        border-radius: 6px; 
        overflow-x: auto;
    }
    code {
        color: #c7254e;
        background: #f9f2f4;
        padding: 3px 4px;
        border-radius: 4px;
    }
    h1, h2, h3, h4 {
        color: #333;
    }
</style>
</head>
<body>
${marked.parse(bodyContent)}
</body>
</html>
`;
}
