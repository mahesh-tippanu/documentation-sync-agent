import express from "express";
import crypto from "crypto";
import config from "../config/config.js";
import { handlePushEvent } from "../services/githubService.js";
import { info, error } from "../utils/logger.js";

const router = express.Router();

/**
 * Verify GitHub webhook signature
 */
function verifySignature(req) {
  const secret = config.github.secret;
  if (!secret) return true; // If no secret set → skip verification

  const signature = req.headers["x-hub-signature-256"];
  if (!signature) return false;

  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(body).digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch {
    return false;
  }
}

router.post("/", async (req, res) => {
  const event = req.headers["x-github-event"] || "unknown";
  info(`Received event: ${event}`);

  // Validate webhook signature
  if (!verifySignature(req)) {
    error("❌ Invalid GitHub webhook signature — rejecting request.");
    return res.status(401).send("Invalid signature");
  }

  try {
    // Github Ping Test
    if (event === "ping") {
      info("Ping received — webhook connected successfully.");
      return res.status(200).send("PONG");
    }

    // Push event
    if (event === "push") {
      await handlePushEvent(req.body);
      return res.status(200).send("Processed push");
    }

    // Handle other event types gracefully
    info(`Event '${event}' received but not handled.`);
    return res.status(200).send("Ignored");

  } catch (err) {
    error("Error in webhook handler:", err.message);
    return res.status(500).send("Error processing webhook");
  }
});

export default router;
