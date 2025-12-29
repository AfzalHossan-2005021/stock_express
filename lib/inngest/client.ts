import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: 'stock_express',
  ai: { gemini: { apiKey: process.env.GEMINI_API_KEY! }},
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  baseUrl: process.env.INNGEST_BASE_URL || 'https://api.inngest.com',
});