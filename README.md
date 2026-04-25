# PayDM — Koyeb Deploy Guide

A pay-to-DM gateway running on Coinbase x402 (Base mainnet, $0.20 USDC).

## Files

```
paydm-koyeb-deploy/
├── index.js          # Express server + x402 middleware
├── package.json      # Dependencies
├── .gitignore
├── public/
│   ├── index.html    # Landing page
│   ├── dm.html       # Paid DM form
│   ├── inbox.html    # Inbox viewer
│   ├── style.css
│   └── opengraph.jpg
└── README.md
```

## Deploy to Koyeb (Free, no sleep)

### Step 1 — Push to GitHub

1. Create a new GitHub repo (e.g. `paydm`).
2. Upload the contents of this folder to the repo.
   - Easiest: drag & drop all files into GitHub web UI ("Add file → Upload files").

### Step 2 — Deploy on Koyeb

1. Go to <https://app.koyeb.com> and sign up (free).
2. Click **Create Web Service**.
3. Choose **GitHub** as the source, authorize Koyeb, and pick your `paydm` repo.
4. Builder: **Buildpack** (auto-detects Node.js — nothing to configure).
5. Run command: `node index.js`  (auto-detected from `package.json` start script).
6. Instance: **Free** (Eco — Nano).
7. Region: **Frankfurt** (closest to Hungary) or **Washington**.
8. **Environment variables** — add these:

   | Name | Value |
   |---|---|
   | `WALLET_ADDRESS` | `0xf5fF2Cb593bcd029fd4Aae049109a9Cc205D5baF` |
   | `COINBASE_CDP_API_KEY_ID` | *(from your Coinbase CDP portal)* |
   | `COINBASE_CDP_API_KEY_SECRET` | *(from your Coinbase CDP portal — mark as Secret)* |
   | `PORT` | `8000` |

9. Health check path: `/healthz`
10. Click **Deploy**.

After ~2 minutes you'll get a public URL like `https://paydm-yourname.koyeb.app`.

### Step 3 — Verify

Open the URL in a browser. You should see the PayDM landing page.

Test the 402 response:
```bash
curl -i https://paydm-yourname.koyeb.app/dm
# → HTTP/1.1 402 Payment Required + JSON body with payment instructions
```

### Step 4 — Trigger Agentic.Market listing

Send one real $0.20 USDC payment to `https://paydm-yourname.koyeb.app/dm` from any
x402-compatible client. The first successful settlement via the CDP facilitator
auto-indexes the service on <https://agentic.market>.

## Notes

- **Free tier on Koyeb does NOT sleep.** Always-on, free forever (1 web service).
- In-memory storage: messages are lost on restart. Add a database (Koyeb has free
  Postgres add-on) if you need persistence.
- The CDP facilitator is what makes the agentic.market listing work. The public
  `x402.org/facilitator` does NOT trigger indexing.
