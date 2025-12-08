/**
 * Simple, production-ready logger used across the Doc Sync Agent.
 * Provides:
 *   - Timestamped logs
 *   - Color-coded output
 *   - Optional debug mode via process.env.DEBUG
 */

function timestamp() {
    return new Date().toISOString();
}

export function info(message) {
    console.log(
        `\x1b[36m[INFO] ${timestamp()} →\x1b[0m ${message}`
    );
}

export function warn(message) {
    console.warn(
        `\x1b[33m[WARN] ${timestamp()} →\x1b[0m ${message}`
    );
}

export function error(message) {
    console.error(
        `\x1b[31m[ERROR] ${timestamp()} →\x1b[0m ${message}`
    );
}

export function debug(message) {
    if (process.env.DEBUG === "true") {
        console.log(
            `\x1b[35m[DEBUG] ${timestamp()} →\x1b[0m ${message}`
        );
    }
}
