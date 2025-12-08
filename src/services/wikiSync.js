import simpleGit from "simple-git";
import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function syncWiki(owner, repo, content) {
    const wikiUrl = `https://github.com/${owner}/${repo}.wiki.git`;

    // Create a unique temp directory for each run
    const tempDir = path.join("./tmp-wiki", uuidv4());

    try {
        const git = simpleGit();

        // Clone the wiki repo
        await git.clone(wikiUrl, tempDir);

        // File to write
        const filePath = path.join(tempDir, "AutoDocs.md");
        await fs.writeFile(filePath, content, "utf8");

        const wikiGit = simpleGit(tempDir);

        // Identity for commit
        await wikiGit.addConfig("user.name", "doc-sync-agent");
        await wikiGit.addConfig("user.email", "doc-sync-agent@example.com");

        await wikiGit.add(".");
        await wikiGit.commit("Auto-update documentation from sync agent");

        // Push to main or master
        try {
            await wikiGit.push("origin", "main");
        } catch {
            await wikiGit.push("origin", "master");
        }
    } finally {
        // Cleanup temp folder
        await fs.rm(tempDir, { recursive: true, force: true });
    }
}
