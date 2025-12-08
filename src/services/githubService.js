import { Octokit } from "@octokit/rest";
import config from "../config/config.js";
import { parseDiff } from "../utils/diffParser.js";
import { analyzeChanges } from "./changeDetector.js";
import { generateDocumentation } from "./docGenerator.js";
import { syncWiki } from "./wikiSync.js";
import { publishToGitHubPages } from "./githubPagesPublisher.js";
import { info, error } from "../utils/logger.js";
import { logHistory } from "../utils/logHistory.js";

const octokit = new Octokit({ auth: config.github.token });

/**
 * Main handler for GitHub Push Events
 */
export async function handlePushEvent(payload) {
    const owner = config.github.owner;
    const repo = config.github.repo;

    const commits = payload.commits || [];
    info(`Processing push event: ${commits.length} commit(s)`);

    for (const commit of commits) {
        const sha = commit.id;

        try {
            info(`=== Processing Commit ${sha} ===`);

            // -------------------------------
            // 1. Fetch Commit Diff from GitHub
            // -------------------------------
            const commitResp = await octokit.request(
                "GET /repos/{owner}/{repo}/commits/{sha}",
                { owner, repo, sha }
            );

            const files = commitResp.data.files || [];
            const parsedFiles = parseDiff(files);

            // -------------------------------
            // 2. Semantic Change Detection (US-3)
            // -------------------------------
            const semanticChanges = analyzeChanges(parsedFiles);

            // -------------------------------
            // 3. Generate Documentation (US-4)
            // -------------------------------
            const generatedDoc = await generateDocumentation(
                {
                    diff: parsedFiles,
                    semantic: semanticChanges
                },
                {
                    sha,
                    repo: `${owner}/${repo}`
                }
            );

            const filename = `AutoDocs-${sha.substring(0, 7)}.md`;
            const commitMessage = `Auto update docs for ${sha.substring(0, 7)}`;

            // -------------------------------
            // 4. Sync to GitHub Wiki (US-5)
            // -------------------------------
            await syncWiki(owner, repo, filename, generatedDoc, commitMessage);
            info(`Wiki updated: ${filename}`);

            // -------------------------------
            // 5. Publish to GitHub Pages (US-2 & US-5)
            // -------------------------------
            await publishToGitHubPages(
                { sha, repo, owner },
                generatedDoc
            );
            info(`GitHub Pages updated for commit ${sha}`);

            // -------------------------------
            // 6. Log History
            // -------------------------------
            logHistory(`Commit ${sha} processed → ${filename}`);

            info(`=== Finished Commit ${sha} ===`);

        } catch (err) {
            error(`Error processing commit ${sha}: ${err.message}`);

            logHistory(
                `ERROR processing commit ${sha}: ${err.message}`
            );
        }
    }
}
