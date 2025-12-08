export function parseDiff(files = []) {
    const changes = [];

    for (const file of files) {
        // Skip binary or non-patch files
        if (!file.patch) {
            continue;
        }

        // Extract only the changed code blocks (optional enhancement)
        const diffLines = file.patch.split("\n");

        // Collect only code change lines (+ added, - removed)
        const addedLines = diffLines.filter(line => line.startsWith("+") && !line.startsWith("+++"));
        const removedLines = diffLines.filter(line => line.startsWith("-") && !line.startsWith("---"));

        changes.push({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            changes: file.changes,
            addedLines,
            removedLines,
            patch: file.patch
        });
    }

    return changes;
}
