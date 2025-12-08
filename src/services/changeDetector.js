/**
 * Advanced Change Detection Engine
 * ---------------------------------
 * Detects:
 *  - Added / removed / modified functions
 *  - Class changes
 *  - API endpoint changes
 *  - Deprecated code indicators
 *  - Per-file summaries
 */

export function analyzeChanges(parsedFiles = []) {
    const result = {
        files: [],
        summary: {
            functionsAdded: [],
            functionsRemoved: [],
            functionsModified: [],
            classesChanged: [],
            apisChanged: [],
            deprecated: [],
            modulesAffected: []
        }
    };

    for (const file of parsedFiles) {
        const analysis = analyzeFile(file);
        result.files.push(analysis);

        // Aggregate into summary
        if (analysis.hasChanges) {
            result.summary.modulesAffected.push(file.filename);
        }

        result.summary.functionsAdded.push(...analysis.functionsAdded);
        result.summary.functionsRemoved.push(...analysis.functionsRemoved);
        result.summary.functionsModified.push(...analysis.functionsModified);

        result.summary.classesChanged.push(...analysis.classesChanged);
        result.summary.apisChanged.push(...analysis.apisChanged);
        result.summary.deprecated.push(...analysis.deprecated);
    }

    return result;
}

/**
 * Analyze an individual file's changes
 */
function analyzeFile(file) {
    const added = file.addedLines || [];
    const removed = file.removedLines || [];

    // Regex patterns
    const fnPattern = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*\(|(\w+)\s*=\s*\(.*?\)\s*=>)/;
    const classPattern = /class\s+(\w+)/;
    const apiPattern = /(router|app)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]+)/;
    const deprecatedPattern = /(deprecated|remove in next release|legacy|to be removed)/i;

    const functionsAdded = extractMatches(added, fnPattern);
    const functionsRemoved = extractMatches(removed, fnPattern);

    // Modified = appears in both added + removed
    const functionsModified = functionsAdded.filter(fn => functionsRemoved.includes(fn));

    const classesChanged = [
        ...extractMatches(added, classPattern),
        ...extractMatches(removed, classPattern)
    ];

    const apisChanged = [
        ...extractApiEndpoints(added, apiPattern),
        ...extractApiEndpoints(removed, apiPattern)
    ];

    const deprecated = [
        ...detectDeprecated(added, deprecatedPattern),
        ...detectDeprecated(removed, deprecatedPattern)
    ];

    return {
        filename: file.filename,
        hasChanges: added.length > 0 || removed.length > 0,

        functionsAdded,
        functionsRemoved,
        functionsModified,

        classesChanged,
        apisChanged,
        deprecated,

        patch: file.patch
    };
}

/**
 * Extract general pattern matches (functions, classes)
 */
function extractMatches(lines, regex) {
    return lines
        .map(line => {
            const match = line.match(regex);
            return match ? (match[1] || match[2] || match[3]) : null;
        })
        .filter(Boolean);
}

/**
 * Extract API endpoints like:
 * router.get("/api/user")
 */
function extractApiEndpoints(lines, regex) {
    return lines
        .map(line => {
            const match = line.match(regex);
            return match ? `${match[1]}.${match[2]} ${match[3]}` : null;
        })
        .filter(Boolean);
}

/**
 * Detect deprecated markers
 */
function detectDeprecated(lines, regex) {
    return lines
        .filter(line => regex.test(line))
        .map(line => line.trim());
}
