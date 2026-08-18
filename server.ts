import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function formatGeminiError(error: any): string {
  if (!error) return "Unknown error occurred";
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      if (parsed.error?.message) return formatGeminiError(parsed.error.message);
    } catch {
      return error;
    }
  }
  if (error.message) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.error?.message) return formatGeminiError(parsed.error.message);
    } catch {
      // not JSON string
    }
    return error.message;
  }
  return String(error);
}

function isRetryableError(error: any): boolean {
  const msg = typeof error === "string" ? error : error?.message || "";
  const status = error?.status || error?.code || 0;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 504 ||
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("UNAVAILABLE") ||
    msg.includes("high demand") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("rate limit")
  );
}

function getFallbackModel(_currentModel: string): string {
  return "gemini-3.1-flash-lite";
}

async function generateWithRetryAndFallback<T>(
  model: string,
  operation: (modelToUse: string) => Promise<T>
): Promise<{ result: T; usedModel: string }> {
  const modelToUse = "gemini-3.1-flash-lite";
  const attempts = 3;

  let lastError: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      if (i > 0) {
        // Wait before retry: 600ms on first retry, 1200ms on second
        const delay = i === 1 ? 600 : 1200;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      const result = await operation(modelToUse);
      return { result, usedModel: modelToUse };
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Attempt ${i + 1}] Model ${modelToUse} error:`, formatGeminiError(err));
      if (!isRetryableError(err) && i === 0) {
        throw err;
      }
    }
  }
  throw lastError;
}

const AVAILABLE_MODELS = [
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    maxContextTokens: 1048576,
    description: "Ultra-fast, low-latency Gemini 3.1 model with 1M context window",
    isDefault: true,
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: !!process.env.GEMINI_API_KEY,
    });
  });

  app.get("/api/models", (_req, res) => {
    res.json({ models: AVAILABLE_MODELS });
  });

  // Count tokens endpoint for accurate context window telemetry
  app.post("/api/count-tokens", async (req, res) => {
    try {
      const { contents, systemInstruction, model = "gemini-3.1-flash-lite" } = req.body;
      const ai = getGeminiClient();

      if (!contents || (Array.isArray(contents) && contents.length === 0)) {
        return res.json({ totalTokens: 0 });
      }

      // Convert simplified messages to Gemini contents format
      const formattedContents = Array.isArray(contents)
        ? contents.map((c: any) => {
            if (typeof c === "string") return { role: "user", parts: [{ text: c }] };
            return {
              role: c.role === "assistant" || c.role === "model" ? "model" : "user",
              parts: [{ text: c.content || c.text || "" }],
            };
          })
        : [{ role: "user", parts: [{ text: String(contents) }] }];

      const config: any = {};
      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      try {
        const result = await ai.models.countTokens({
          model,
          contents: formattedContents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        res.json({
          totalTokens: result.totalTokens || 0,
        });
      } catch (countErr) {
        // Retry with fallback lightweight model or estimate
        try {
          const fallbackModel = getFallbackModel(model);
          const resultFallback = await ai.models.countTokens({
            model: fallbackModel,
            contents: formattedContents,
            config: Object.keys(config).length > 0 ? config : undefined,
          });
          return res.json({
            totalTokens: resultFallback.totalTokens || 0,
          });
        } catch {
          const allText = formattedContents
            .map((c) => c.parts?.map((p: any) => p.text || "").join(" ") || "")
            .join(" ");
          const calculated = Math.max(1, Math.ceil(allText.length / 4));
          return res.json({
            totalTokens: calculated,
            estimated: true,
          });
        }
      }
    } catch (error: any) {
      console.error("Error in count-tokens:", formatGeminiError(error));
      const fallbackEstimatedTokens = Math.max(
        1,
        Math.ceil(JSON.stringify(req.body.contents || "").length / 4)
      );
      res.json({
        totalTokens: fallbackEstimatedTokens,
        estimated: true,
      });
    }
  });

  // Chat endpoint (Standard)
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages,
        systemInstruction,
        model = "gemini-3.1-flash-lite",
        temperature = 0.7,
      } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const ai = getGeminiClient();

      const formattedContents = messages.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));

      const config: any = {
        temperature: Number(temperature) || 0.7,
      };

      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      const { result: response, usedModel } = await generateWithRetryAndFallback(
        model,
        async (modelToUse) => {
          return await ai.models.generateContent({
            model: modelToUse,
            contents: formattedContents,
            config,
          });
        }
      );

      const responseText = response.text || "";
      const usageMetadata = response.usageMetadata || null;

      res.json({
        text: responseText,
        model: usedModel,
        usage: {
          promptTokenCount: usageMetadata?.promptTokenCount || null,
          candidatesTokenCount: usageMetadata?.candidatesTokenCount || null,
          totalTokenCount: usageMetadata?.totalTokenCount || null,
        },
      });
    } catch (error: any) {
      const cleanError = formatGeminiError(error);
      console.error("Error in /api/chat:", cleanError);
      res.status(500).json({
        error: cleanError,
      });
    }
  });

  // Chat Streaming Endpoint with SSE
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const {
        messages,
        systemInstruction,
        model = "gemini-3.1-flash-lite",
        temperature = 0.7,
      } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const ai = getGeminiClient();

      const formattedContents = messages.map((m: any) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.content || "" }],
      }));

      const config: any = {
        temperature: Number(temperature) || 0.7,
      };

      if (systemInstruction && typeof systemInstruction === "string" && systemInstruction.trim()) {
        config.systemInstruction = systemInstruction.trim();
      }

      // Use retry and fallback cascade
      const { result: responseStream, usedModel } = await generateWithRetryAndFallback(
        model,
        async (modelToUse) => {
          return await ai.models.generateContentStream({
            model: modelToUse,
            contents: formattedContents,
            config,
          });
        }
      );

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      let fullText = "";
      let finalUsage: any = null;

      for await (const chunk of responseStream) {
        const chunkText = chunk.text || "";
        fullText += chunkText;
        if (chunk.usageMetadata) {
          finalUsage = chunk.usageMetadata;
        }

        res.write(`data: ${JSON.stringify({ text: chunkText, done: false, model: usedModel })}\n\n`);
      }

      res.write(
        `data: ${JSON.stringify({
          text: "",
          done: true,
          fullText,
          model: usedModel,
          usage: {
            promptTokenCount: finalUsage?.promptTokenCount || null,
            candidatesTokenCount: finalUsage?.candidatesTokenCount || null,
            totalTokenCount: finalUsage?.totalTokenCount || null,
          },
        })}\n\n`
      );
      res.end();
    } catch (error: any) {
      const cleanError = formatGeminiError(error);
      console.error("Error in /api/chat/stream:", cleanError);
      if (!res.headersSent) {
        res.status(500).json({ error: cleanError });
      } else {
        res.write(`data: ${JSON.stringify({ error: cleanError, done: true })}\n\n`);
        res.end();
      }
    }
  });

  // Smart Context Summarization Endpoint
  app.post("/api/summarize-context", async (req, res) => {
    try {
      const { messages, instruction, model = "gemini-3.1-flash-lite" } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "No messages provided to summarize." });
      }

      const ai = getGeminiClient();

      const originalTranscript = messages
        .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const prompt = `You are an expert context compressor for LLM conversation windows.
Your task is to produce a dense, high-fidelity executive summary of the conversation transcript below.
Retain all vital facts, user requirements, code requirements, decisions made, key constraints, and unresolved topics.
Omit pleasantries, filler phrases, redundant iterations, and verbatim repetition.

${instruction ? `Special Instruction: ${instruction}\n` : ""}

Transcript to condense:
"""
${originalTranscript}
"""

Provide the compressed context summary clearly formatted in Markdown with structured bullet points.`;

      const { result: response } = await generateWithRetryAndFallback(
        model,
        async (modelToUse) => {
          return await ai.models.generateContent({
            model: modelToUse,
            contents: prompt,
            config: {
              systemInstruction:
                "You are a precise context compression assistant. Output concise, factual summaries that capture maximum information density.",
              temperature: 0.3,
            },
          });
        }
      );

      const summaryText = response.text || "";

      let originalTokens = Math.max(1, Math.ceil(originalTranscript.length / 4));
      let summaryTokens = Math.max(1, Math.ceil(summaryText.length / 4));

      try {
        const origCount = await ai.models.countTokens({
          model: "gemini-3.1-flash-lite",
          contents: originalTranscript,
        });
        if (origCount.totalTokens) originalTokens = origCount.totalTokens;

        const summaryCount = await ai.models.countTokens({
          model: "gemini-3.1-flash-lite",
          contents: summaryText,
        });
        if (summaryCount.totalTokens) summaryTokens = summaryCount.totalTokens;
      } catch {
        // safe fallback token count
      }

      const tokensSaved = Math.max(0, originalTokens - summaryTokens);

      res.json({
        summary: summaryText,
        originalTokens,
        summaryTokens,
        tokensSaved,
        percentageSaved: originalTokens > 0 ? Math.round((tokensSaved / originalTokens) * 100) : 0,
      });
    } catch (error: any) {
      const cleanError = formatGeminiError(error);
      console.error("Error in /api/summarize-context:", cleanError);
      res.status(500).json({ error: cleanError });
    }
  });

  // Extract memory facts / distilled key points
  app.post("/api/extract-memories", async (req, res) => {
    try {
      const { messages, model = "gemini-3.1-flash-lite" } = req.body;
      const ai = getGeminiClient();

      const transcript = messages
        .map((m: any) => `${m.role.toUpperCase()}: ${m.content}`)
        .join("\n\n");

      const prompt = `Extract all key permanent facts, user preferences, project specifications, and active constraints from the following dialogue as a concise list of bullet points for persistent memory injection:

"""
${transcript}
"""

Return only bullet points (e.g. • User prefers TypeScript, • Goal is to build X, • Constraint: Y).`;

      const { result: response } = await generateWithRetryAndFallback(
        model,
        async (modelToUse) => {
          return await ai.models.generateContent({
            model: modelToUse,
            contents: prompt,
            config: {
              temperature: 0.2,
            },
          });
        }
      );

      res.json({
        memories: response.text || "",
      });
    } catch (error: any) {
      const cleanError = formatGeminiError(error);
      console.error("Error in extract-memories:", cleanError);
      res.status(500).json({ error: cleanError });
    }
  });

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gemini Context Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
