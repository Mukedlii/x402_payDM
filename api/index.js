// PayDM – pay-to-DM gateway (Vercel serverless version)
// Coinbase x402 payment gateway

import express from "express";
import { paymentMiddleware } from "x402-express";
import { createFacilitatorConfig } from "@coinbase/x402";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// ============================================================
// CONFIG
// ============================================================
const WALLET_ADDRESS =
  process.env.WALLET_ADDRESS || "0xf5fF2Cb593bcd029fd4Aae049109a9Cc205D5baF";
const PRICE = "$0.20";
const NETWORK = "base";

const CDP_API_KEY_ID =
  process.env.COINBASE_CDP_API_KEY_ID || process.env.CDP_API_KEY_ID;
const CDP_API_KEY_SECRET =
  process.env.COINBASE_CDP_API_KEY_SECRET || process.env.CDP_API_KEY_SECRET;

if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET) {
  throw new Error(
    "Missing CDP credentials. Set COINBASE_CDP_API_KEY_ID and COINBASE_CDP_API_KEY_SECRET in Vercel project env vars."
  );
}

const facilitator = createFacilitatorConfig(CDP_API_KEY_ID, CDP_API_KEY_SECRET);

// ============================================================
// IN-MEMORY message store
// NOTE: Vercel serverless = stateless. Messages do NOT persist
// across function invocations. For real persistence add a DB
// (Vercel KV, Upstash Redis, Neon Postgres, etc.).
// ============================================================
const messages = [];

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

app.use(
  paymentMiddleware(
    WALLET_ADDRESS,
    {
      "GET /dm": {
        price: PRICE,
        network: NETWORK,
        config: {
          description:
            "PayDM – pay $0.20 USDC to send a guaranteed-read direct message. " +
            "No spam, no accounts, instant on-chain settlement via x402 on Base.",
          mimeType: "text/html",
          discoverable: true,
          inputSchema: { type: "http", method: "GET" },
          outputSchema: {
            type: "object",
            description: "HTML form to submit the paid DM via POST /dm.",
          },
        },
      },
    },
    facilitator
  )
);

// ============================================================
// ROUTES
// ============================================================
app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.get("/info", (req, res) => {
  res.json({
    name: "PayDM Gateway",
    version: "1.0.0",
    protocol: "x402",
    payment: {
      price_usdc: "0.20",
      network: "base-mainnet",
      pay_to: WALLET_ADDRESS,
      facilitator: "coinbase-cdp",
    },
    endpoint: {
      method: "GET",
      path: "/dm",
      description:
        "Pay $0.20 USDC to send a guaranteed-read direct message. " +
        "No spam, no accounts, instant on-chain settlement via x402.",
    },
    categories: ["social", "messaging"],
    tags: ["dm", "messaging", "anti-spam", "x402", "human-reach", "pay-to-reach"],
  });
});

app.get("/dm", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "dm.html")));

app.post("/dm", (req, res) => {
  const { name, message } = req.body || {};
  if (!name || !message) {
    return res.status(400).json({ error: "Missing name or message" });
  }
  const entry = {
    name: String(name).slice(0, 100),
    message: String(message).slice(0, 2000),
    timestamp: new Date().toISOString(),
    paid: true,
  };
  messages.push(entry);
  console.log(`[PayDM] New paid DM from: ${entry.name}`);
  res.json({ status: "thanks", message: "Thank you for your message!" });
});

app.get("/inbox", (req, res) =>
  res.sendFile(path.join(PUBLIC_DIR, "inbox.html"))
);

app.get("/api/messages", (req, res) => res.json([...messages].reverse()));

app.get("/healthz", (req, res) => res.json({ ok: true, count: messages.length }));

// Vercel: export the Express app as the default handler.
// Do NOT call app.listen() — Vercel manages the HTTP server.
export default app;
