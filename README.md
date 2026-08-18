# ContextSieve
> Control **EXACTLY** what your agent knows when the context window is about to overflow!

ContextSieve offers multiple tools for **transparent** context window management on Gemini chats, offering a **show/hide-based** UI/UX system per prompt/response that anyone can understand. Try it out using the quickstart instructions I've provided below.

## Key Features

* **Live Token Telemetry**: Track breakdown across system prompt, user inputs, assistant outputs.
* **Near-Capacity Monitoring**: Alerts when nearing context limits.
* **AI Context Summarizer**: Compress old turns into executive summaries.
* **Sliding Window Pruning**: Retain recent turns; preserve pinned facts.
* **Active Context Toggling**: Omit verbose messages from context without deleting transcript history.
* **Inline Editing**: Modify long code or text directly inside active window.

Just one round of summarization + trimming filler text, and **ContextSieve cleared 79.9% of the context window** (see below)!

<p align="center">
<img width="48%" alt="Screenshot 2026-08-18 at 3 15 51 PM" src="https://github.com/user-attachments/assets/6f90589d-7767-4218-ac77-7d11d220f6c5" />
<img width="48%" alt="Screenshot 2026-08-18 at 3 16 16 PM" src="https://github.com/user-attachments/assets/16103e00-921b-490f-b177-eb7198a1f048" />
</p>


## Quickstart

1. Clone repo:
   ```bash
   git clone [https://github.com/user/ContextSieve.git](https://github.com/user/ContextSieve.git)
   cd ContextSieve
   ```

2. Install deps:
   ```bash
   npm install
   ```

3. Create `.env` or `.env.local` and grab an API Key from [Google AI Studio](https://aistudio.google.com/api-keys):
   ```env
   GEMINI_API_KEY="your_api_key_here"
   ```

4. Run app:
   ```bash
   npm run dev
   ```

5. Open browser:
   ```
   http://localhost:3000
   ```
