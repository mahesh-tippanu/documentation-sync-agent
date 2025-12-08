import OpenAI from "openai";
import config from "../config/config.js";
import axios from "axios";
import { info, error } from "../utils/logger.js";
import { formatDocumentation } from "./formatter.js";

const openai = config.openai.key
  ? new OpenAI({ apiKey: config.openai.key })
  : null;

/**
 * Generates documentation using OpenAI or Flowise.
 * @param {Object} context - Parsed diff context
 * @param {Object} meta - Extra data like commit SHA, repo, user
 */
export async function generateDocumentation(context, meta = {}) {
  const prompt = `
You are an expert code documentation generator.
Generate documentation for the following code changes:

${JSON.stringify(context, null, 2)}

Return:
1. Markdown formatted documentation
2. Changelog summary
3. Function/class descriptions
4. Clear explanations of added/removed logic
`;

  // ---------------------------
  // 1. OPENAI MODE
  // ---------------------------
  if (openai) {
    try {
      info("Generating documentation via OpenAI...");

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000
      });

      const content = response.choices?.[0]?.message?.content || "";
      return formatDocumentation(content, meta);

    } catch (err) {
      error("OpenAI error:", err.message);
      throw err;
    }
  }

  // ---------------------------
  // 2. FLOWISE MODE (fallback)
  // ---------------------------
  if (config.flowise.url) {
    try {
      info("Generating documentation via Flowise...");

      const res = await axios.post(config.flowise.url, { input: prompt });
      const content = res.data?.output || res.data?.result || res.data?.text || "";

      return formatDocumentation(content, meta);

    } catch (err) {
      error("Flowise generation error:", err.message);
      throw err;
    }
  }

  // ---------------------------
  // 3. NO LLM CONFIGURED
  // ---------------------------
  throw new Error("No OpenAI API key or Flowise URL configured.");
}
