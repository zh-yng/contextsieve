# ContextSieve
> Control **EXACTLY** what your agent knows when the context window is about to overflow!

ContextSieve offers multiple tools for **transparent** context window management on Gemini chats, offering a **pin-based** UI/UX system per prompt/response that anyone can understand. Define a context limit, and you'll get timely alerts and options to optimize the context stack as it fills up. Try it out now!

## Key Features

* **Live Token Telemetry**: Track token breakdowns across the system prompt, user inputs and assistant outputs.
* **Near-Capacity Monitoring**: Sends alerts before a user-defined context limit.
* **AI Context Summarizer**: Compress old turns into executive summaries.
* **Sliding Window Pruning**: Retain recent chats and preserve pinned facts.
* **Active Context Toggling**: Omit verbose response blocks individually from the context.
* **Inline Editing**: Modify context blocks directly inside the active window.

Just one round of summarization + trimming filler text, and **ContextSieve saved 79.9% of the context window** (see below)!

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
