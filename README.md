<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/540d2fc6-8896-4fb1-92e2-66180402a742

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages (GitHub Actions)

This repo now includes a workflow at [.github/workflows/deploy-pages.yml](/Users/zoeyzoella/Downloads/contextsieve/.github/workflows/deploy-pages.yml) that builds and deploys on pushes to `main`/`master`.

### One-time GitHub setup

1. Go to your repository **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. (Recommended) Add repository variable `VITE_API_BASE_URL` in **Settings → Secrets and variables → Actions → Variables**.  
   Example: `https://your-backend.example.com`

The frontend now reads `VITE_API_BASE_URL` (from [src/App.tsx](/Users/zoeyzoella/Downloads/contextsieve/src/App.tsx)).  
If unset, it defaults to `/api` (local/server deployment behavior).

### Deploy

Push to `main` (or run the workflow manually from the Actions tab).  
Your site will publish to:

`https://<your-github-username>.github.io/<repo-name>/`
