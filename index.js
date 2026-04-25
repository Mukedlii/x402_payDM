// PayDM – pay-to-DM gateway
// Coinbase x402 payment gateway

import express from "express";
import dotenv from "dotenv";
import { paymentMiddleware } from "x402-express";
import { createFacilitatorConfig } from "@coinbase/x402";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// CONFIG
// ============================================================

const WALLET_ADDRESS = process.env.WALLET_ADDRESS || "0xf5fF2Cb593bcd029fd4Aae049109a9Cc205D5baF";
const PRICE = "$0.20";
const NETWORK = "base";
const PORT = process.env.PORT || 3000;

// CDP API credentials – required so this service is auto-listed on
// agentic.market via the Coinbase Developer Platform facilitator.
const CDP_API_KEY_ID = process.env.COINBASE_CDP_API_KEY_ID || process.env.CDP_API_KEY_ID;
const CDP_API_KEY_SECRET = process.env.COINBASE_CDP_API_KEY_SECRET || process.env.CDP_API_KEY_SECRET;

if (!CDP_API_KEY_ID || !CDP_API_KEY_SECRET) {
  throw new Error(
    "Missing CDP credentials. Set COINBASE_CDP_API_KEY_ID and COINBASE_CDP_API_KEY_SECRET in Replit Secrets."
  );
}

const facilitator = createFacilitatorConfig(CDP_API_KEY_ID, CDP_API_KEY_SECRET);

// ============================================================
// IN-MEMORY message store (resets on restart)
// ============================================================
const messages = [];

// ============================================================
// EXPRESS APP
// ============================================================
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ------------------------------------------------------------
// x402 payment middleware – uses Coinbase CDP facilitator so the
// route is indexed in the Bazaar / agentic.market after the first
// successful settlement.
// ------------------------------------------------------------
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
          inputSchema: {
            type: "http",
            method: "GET",
          },
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

// Landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// /info – free metadata endpoint for AI agents (Agentic.Market discovery)
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

// DM page – only accessible after x402 payment
app.get("/dm", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dm.html"));
});

// Submit DM
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

// Inbox page
app.get("/inbox", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "inbox.html"));
});

// JSON API – used by inbox page
app.get("/api/messages", (req, res) => {
  res.json([...messages].reverse());
});

// Healthcheck
app.get("/healthz", (req, res) => {
  res.json({ ok: true, count: messages.length });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 PayDM running on port ${PORT}`);
  console.log(`   Wallet:      ${WALLET_ADDRESS}`);
  console.log(`   Price:       ${PRICE}`);
  console.log(`   Network:     ${NETWORK}`);
  console.log(`   Facilitator: Coinbase CDP\n`);
});
