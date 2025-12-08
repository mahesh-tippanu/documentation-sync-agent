import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 4000,
  host: process.env.HOST || "0.0.0.0",

  github: {
    token: process.env.GITHUB_TOKEN,
    secret: process.env.GITHUB_SECRET,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO
  },

  openai: {
    key: process.env.OPENAI_API_KEY
  },

  flowise: {
    url: process.env.FLOWISE_URL
  },

  teamsWebhook: process.env.TEAMS_WEBHOOK_URL,

  tmpBase: process.env.TMP_BASE || "./tmp"
};
