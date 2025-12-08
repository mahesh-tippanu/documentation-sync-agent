import axios from "axios";
import config from "../config/config.js";
import { info, error } from "../utils/logger.js";

/**
 * Send notification to Microsoft Teams channel via webhook
 */
export async function sendTeamsNotification(title, message) {
    const webhook = config.teamsWebhook;

    if (!webhook) {
        info("Microsoft Teams webhook not configured. Skipping notification.");
        return;
    }

    const payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "summary": title,
        "themeColor": "0076D7",
        "title": title,
        "text": message
    };

    try {
        await axios.post(webhook, payload);
        info("Teams notification sent.");
    } catch (err) {
        error("Failed to send Teams notification:", err.message);
    }
}
