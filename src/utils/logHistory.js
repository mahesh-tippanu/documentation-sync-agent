import fs from "fs";
import path from "path";

const LOG_DIR = path.resolve("logs");
const LOG_FILE = path.join(LOG_DIR, "history.log");

// Maximum log size before rotation (2 MB)
const MAX_LOG_SIZE = 2 * 1024 * 1024;

/**
 * Ensure the logs directory exists
 */
function ensureLogDirectory() {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
}

/**
 * Rotate log file if it grows too large
 */
function rotateLogFile() {
    if (!fs.existsSync(LOG_FILE)) return;

    const stats = fs.statSync(LOG_FILE);
    if (stats.size >= MAX_LOG_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotated = path.join(LOG_DIR, `history-${timestamp}.log`);

        fs.renameSync(LOG_FILE, rotated);
    }
}

/**
 * Writes a history entry with timestamp
 */
export function logHistory(message) {
    try {
        ensureLogDirectory();
        rotateLogFile();

        const timestamp = new Date().toISOString();
        const line = `[${timestamp}] ${message}\n`;

        fs.appendFileSync(LOG_FILE, line, "utf8");
    } catch (err) {
        console.error("[ERROR] Failed to write history log:", err.message);
    }
}
