# ContextSieve

ContextSieve offers interactive context window management on Gemini chats with live telemetry and dynamic memory controls.

## Local setup

### Prerequisites

- Node.js 18+
- A Gemini API key

### Install and run

1. Clone the repo:

   ```bash
   git clone https://github.com/<your-user>/<your-repo>.git
   cd ContextSieve
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a local environment file with your API key:

   ```bash
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```

   You can also use `.env.local`; the server loads both.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open:

   ```text
   http://localhost:3000
   ```

The app runs locally with the Express backend in [server.ts](/Users/zoeyzoella/Downloads/contextsieve/server.ts). The frontend and API are served from the same local server.

## Scripts

- `npm run dev` — run locally
- `npm run build` — production build
- `npm run start` — start the built production server
- `npm run lint` — TypeScript check
