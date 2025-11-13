import { getFallbackDSAQuestions } from "../data/dsaQuestionBank";

const DEFAULT_MODEL_CHAIN = ["gpt-4o-mini", "gpt-mini", "hx-fast"];
let puterReadyPromise = null;

function extractTextFromResponse(res) {
  if (!res) return "";
  if (typeof res === "string") return res;
  if (typeof res.text === "string") return res.text;
  if (typeof res.message === "string") return res.message;
  if (typeof res.output_text === "string") return res.output_text;
  if (res?.message?.content) return res.message.content;
  if (
    Array.isArray(res?.message?.content) &&
    res.message.content.every((item) => typeof item?.text === "string")
  ) {
    return res.message.content.map((item) => item.text).join("\n");
  }
  if (Array.isArray(res?.choices) && res.choices.length) {
    const c = res.choices[0];
    if (typeof c?.output_text === "string") return c.output_text;
    if (typeof c?.content === "string") return c.content;
    if (
      Array.isArray(c?.content) &&
      c.content.every((item) => typeof item?.text === "string")
    ) {
      return c.content.map((item) => item.text).join("\n");
    }
    if (typeof c?.message?.content === "string") return c.message.content;
    if (
      Array.isArray(c?.message?.content) &&
      c.message.content.every((item) => typeof item?.text === "string")
    ) {
      return c.message.content.map((item) => item.text).join("\n");
    }
    if (typeof c?.text === "string") return c.text;
  }
  if (typeof res?.content === "string") return res.content;
  try {
    return JSON.stringify(res);
  } catch {
    return String(res);
  }
}

async function ensurePuterReady({ timeout = 15000 } = {}) {
  if (typeof window === "undefined") throw new Error("Must be run in browser");

  if (window.puter?.ai) {
    if (typeof window.puter.ready === "function") {
      try {
        await window.puter.ready();
      } catch {
        // ignore readiness failures, we'll still attempt to use the SDK
      }
    } else if (
      window.puter?.ready &&
      typeof window.puter.ready.then === "function"
    ) {
      try {
        await window.puter.ready;
      } catch {
        // ignore
      }
    }
    return window.puter;
  }

  if (!puterReadyPromise) {
    puterReadyPromise = new Promise((resolve, reject) => {
      const start = Date.now();
      const poll = () => {
        if (window.puter?.ai) {
          resolve(window.puter);
          return;
        }
        if (Date.now() - start > timeout) {
          reject(new Error("Puter SDK failed to load"));
          return;
        }
        setTimeout(poll, 50);
      };
      poll();
    }).catch((err) => {
      puterReadyPromise = null;
      throw err;
    });
  }

  return puterReadyPromise;
}

function shouldRetryWithLegacySignature(err) {
  if (!err) return true;
  if (err instanceof TypeError) return true;
  const message = String(err.message || err);
  return /argument|parameter|object|string/i.test(message);
}

function normalizeError(err) {
  if (!err) return new Error("Unknown Puter error");
  if (err instanceof Error) return err;

  const possibleMessage =
    err?.error?.message ||
    err?.message ||
    err?.error?.error ||
    err?.error ||
    err?.detail ||
    err?.reason ||
    err?.statusText ||
    (typeof err === "string" ? err : null);

  try {
    const serialized =
      typeof err === "string"
        ? err
        : JSON.stringify(err, (_key, value) =>
            typeof value === "bigint" ? value.toString() : value
          );
    return new Error(possibleMessage || serialized || "Unknown Puter error");
  } catch {
    return new Error(possibleMessage || "Unknown Puter error");
  }
}

async function callChatFn(chatFn, prompt, model) {
  if (typeof chatFn !== "function") return null;
  try {
    const res = await chatFn(prompt, model ? { model } : undefined);
    return res;
  } catch (err) {
    if (!shouldRetryWithLegacySignature(err)) throw err;
    const legacyPayload = {
      model,
      messages: [{ role: "user", content: prompt }],
    };
    return await chatFn(legacyPayload);
  }
}

async function invokeModernCompletions(ai, prompt, model) {
  const completions =
    ai?.chat?.completions?.create ||
    ai?.completions?.create ||
    ai?.responses?.create ||
    null;
  if (typeof completions !== "function") return null;
  const payload = {
    messages: [{ role: "user", content: prompt }],
  };
  if (model) payload.model = model;
  const context =
    ai?.chat?.completions || ai?.completions || ai?.responses || ai;
  return await completions.call(context, payload);
}

async function invokeChat(ai, prompt, model) {
  if (!ai) throw new Error("Puter AI chat API is unavailable");

  // Prefer modern completions-style APIs if available
  try {
    const modern = await invokeModernCompletions(ai, prompt, model);
    if (modern !== undefined && modern !== null) return modern;
  } catch (err) {
    // continue to try classic chat signatures
    if (!shouldRetryWithLegacySignature(err)) throw normalizeError(err);
  }

  // Try function-call signatures on ai.chat
  if (typeof ai.chat === "function") {
    const res = await callChatFn(ai.chat.bind(ai), prompt, model);
    if (res !== undefined && res !== null) return res;
  }

  // Some SDK versions expose ai.chat.create
  if (typeof ai.chat?.create === "function") {
    const res = await ai.chat.create({
      model,
      messages: [{ role: "user", content: prompt }],
    });
    if (res !== undefined && res !== null) return res;
  }

  throw new Error("Puter AI chat API is unavailable");
}

export async function fetchAIChatResponse(
  prompt,
  { modelOverride = null, modelChain = null } = {}
) {
  const puter = await ensurePuterReady();
  const ai = puter.ai;
  const chain = Array.from(
    new Set([
      ...(modelOverride ? [modelOverride] : []),
      ...(Array.isArray(modelChain) ? modelChain : DEFAULT_MODEL_CHAIN),
    ])
  );

  let lastErr = null;
  for (const model of chain) {
    try {
      const res = await invokeChat(ai, prompt, model);
      const text = extractTextFromResponse(res);
      if (text && text.trim()) return { text, raw: res, modelUsed: model };
      lastErr = new Error("Empty AI response");
    } catch (err) {
      lastErr = normalizeError(err);
      continue;
    }
  }
  throw lastErr || new Error("No model produced a valid result");
}

// Added fetchAIResponse export here
export async function fetchAIResponse(prompt, opts = {}) {
  const res = await fetchAIChatResponse(prompt, opts);
  return res.text;
}

export async function fetchDSAQuestions(company, { bypassCache = false } = {}) {
  const key = `dsaCache:${company}`;
  try {
    if (!bypassCache) {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed?.ts &&
          parsed?.items &&
          Array.isArray(parsed.items) &&
          parsed.items.length > 0
        ) {
          const age = Date.now() - parsed.ts;
          if (age < 24 * 3600 * 1000) {
            return { items: parsed.items, cached: true };
          }
        }
      }
    }
  } catch {}

  const dsaPrompt = `You are an API that returns STRICT JSON ONLY. No explanations or commentary.
Generate 25-30 DSA interview questions recently asked at ${company} (2024-2025).
Return a JSON ARRAY ONLY where each entry follows:
[
  {
    "question": "string",
    "difficulty": "easy | medium | hard",
    "topic": "string",
    "links": {
      "leetcode": "string or empty",
      "geeksforgeeks": "string or empty",
      "codingninjas": "string or empty"
    }
  }
]`;

  let items = [];
  let source = "ai";
  let aiText = "";
  try {
    const aiRes = await fetchAIChatResponse(dsaPrompt);
    aiText = aiRes.text;
    try {
      items = JSON.parse(aiRes.text);
    } catch {
      const text = aiRes.text || "";
      const firstBracket = text.indexOf("[");
      const lastBracket = text.lastIndexOf("]");
      if (
        firstBracket !== -1 &&
        lastBracket !== -1 &&
        lastBracket > firstBracket
      ) {
        const slice = text.slice(firstBracket, lastBracket + 1);
        items = JSON.parse(slice);
      } else {
        items = [];
      }
    }
  } catch (err) {
    items = [];
    source = "fallback";
  }

  if (!Array.isArray(items) || !items.length) {
    const fallback = getFallbackDSAQuestions(company);
    if (fallback.length) {
      items = fallback;
      source = source === "ai" && aiText ? "ai-fallback" : "fallback";
    } else {
      throw new Error(
        "Interview questions are unavailable right now. Please try again later."
      );
    }
  }

  const normalized = items.map((i) => ({
    question: i.question?.trim() || "",
    difficulty: ["easy", "medium", "hard"].includes(i.difficulty?.toLowerCase())
      ? i.difficulty.toLowerCase()
      : "medium",
    topic: i.topic?.trim() || "General",
    links: i.links || { leetcode: "", geeksforgeeks: "", codingninjas: "" },
  }));
  if (!normalized.length) {
    throw new Error(
      "Interview questions are unavailable right now. Please try again later."
    );
  }

  const shuffled = normalized
    .map((item, idx) => ({ item, sortKey: Math.random() + idx * 0.0001 }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ item }) => item);
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), items: shuffled, source })
    );
  } catch {}

  return { items: shuffled, cached: false, source };
}
