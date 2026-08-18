# ContextSieve

ContextSieve offers interactive context window management on Gemini chats (ft. live telemetry and dynamically managed memory!).

## Key Features

* **Live Token Telemetry**: Track breakdown across system prompt, user inputs, assistant outputs.
* **Near-Capacity Monitoring**: Alerts when nearing context limits.
* **AI Context Summarizer**: Compress old turns into executive summaries.
* **Sliding Window Pruning**: Retain recent turns; preserve pinned facts.
* **Active Context Toggling**: Omit verbose messages from context without deleting transcript history.
* **Inline Editing**: Modify long code or text directly inside active window.

Just one round of context summarization (nothing else, even) and we get crazy improvements (see below)!

<p align="center">
  <img width="48%" alt="Screenshot 2026-08-18 at 1 54 55 PM" src="https://github.com/user-attachments/assets/44613cc4-6d26-4544-b517-d364aa3ca271" />
  <img width="48%" alt="Screenshot 2026-08-18 at 1 55 43 PM" src="https://github.com/user-attachments/assets/d8f64408-d4d2-4c15-a151-0942678347f2" />
</p>

## Quickstart

1. Clone repository:

   ```bash
   git clone [https://github.com/user/ContextSieve.git](https://github.com/user/ContextSieve.git)
   cd ContextSieve
