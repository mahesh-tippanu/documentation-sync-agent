import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import webhookRouter from "./routes/webhook.js";
import { info } from "./utils/logger.js";

dotenv.config();

const app = express();

/**
 * IMPORTANT:
 * GitHub webhook signature requires RAW body.
 * So we use bodyParser.json() with "verify" to store rawBody.
 */
app.use(bodyParser.json({
    verify: (req, res, buf) => {
        req.rawBody = buf.toString();  // Store unchanged raw body for HMAC check
    }
}));

// Parse JSON normally for routes
app.use(express.json());

app.use("/webhook", webhookRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    info(`Documentation Sync Agent running on port ${PORT}`);
});
