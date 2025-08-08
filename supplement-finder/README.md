# Supplement Ingredient Finder (Prototype)

Minimal prototype: Express backend + static React frontend.

## Quickstart (locally)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open http://localhost:3000

## Endpoints
- `GET /api/ingredients` - returns seeded ingredients
- `POST /api/recommend` - body `{ "goals": "better focus and less anxiety" }`
- `POST /api/save-plan` - body `{ "userEmail": "...", "recommendations": [...] }`

## What this contains
- `server.js` - simple Express server with local JSON storage (lowdb)
- `public/index.html` - static React UI (prototype)
- `db/seed.json` - ingredient seed (20 items)
- `db/db.json` - lowdb storage (auto-initialized)

## Next steps to production (suggested)
- Replace lowdb with Postgres and deploy to Railway/AWS RDS.
- Integrate SendGrid to email PDF summaries and use Puppeteer to generate PDFs.
- Add admin authentication and product mapping to Shopify/Stripe.
- Add unit tests for matching logic.
