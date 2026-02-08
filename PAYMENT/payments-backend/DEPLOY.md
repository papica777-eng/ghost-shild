# QAntum Payment Backend Deployment

## 1. Deploy to Render (Recommended)

This method is zero-config because we included `render.yaml`.

1. Push this folder to GitHub/GitLab.
2. Log in to dashboard.render.com
3. Click "New" > "Blueprint".
4. Connect your repo.
5. Render will automatically detect the Rust service + Redis and deploy them.

## 2. Deploy to Vercel (Serverless)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in this directory.
3. The `vercel.json` maps incoming requests to `src/main.rs` compiled as a serverless function.

**Note:** For heavy production loads, Render is preferred for Rust backends as it keeps the server running (lower latency than cold boots).
