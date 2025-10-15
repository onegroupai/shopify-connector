# Shopify Agent Connector (MVP)

Minimal Node/TypeScript service that exposes endpoints for AI agents to post content to Shopify using the Admin GraphQL API.

## Endpoints
- `POST /content/file` — Upload bytes (via URL or base64) to Shopify Files using stagedUploadsCreate + fileCreate.

## Setup
1. Copy `.env.example` to `.env` and fill in:
   ```
   PORT=8080
   CONNECTOR_API_KEY=your-connector-key
   SHOPIFY_STORE_DOMAIN=yourstore.myshopify.com
   SHOPIFY_ADMIN_TOKEN=shpat_your_admin_token
   ```

2. Install & run:
   ```bash
   pnpm install
   pnpm dev
   ```

3. Test (PowerShell on Windows):
   ```powershell
   node -e "require('fs').writeFileSync('dot.png', Buffer.from([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,1,0,0,0,1,8,6,0,0,0,31,21,196,137,0,0,0,10,73,68,65,84,120,156,99,96,0,0,0,2,0,1,226,33,189,167,0,0,0,0,73,69,78,68,174,66,96,130]));"
   $BASE64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes('dot.png'))
   curl.exe -s -X POST http://localhost:8080/content/file ^
     -H "Content-Type: application/json" ^
     -H "x-connector-key: your-connector-key" ^
     --data "{"filename":"dot.png","mimeType":"image/png","base64":"$BASE64"}"
   ```

## Notes
- Ensure `SHOPIFY_STORE_DOMAIN` is your **myshopify.com** domain, not your custom storefront domain.
- After confirming the flow works, rotate your Admin token if it was exposed.