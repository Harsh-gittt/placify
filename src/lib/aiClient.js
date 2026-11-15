import { getFallbackDSAQuestions } from "../data/dsaQuestionBank";
import { API_BASE_URL } from "./apiBaseUrl";

const MODEL = "gemini-3.5-flash-lite";

export async function fetchAIChatResponse(prompt) {
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("An AI prompt is required.");
  }

  const response = await fetch(`${API_BASE_URL}/api/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `AI request failed (${response.status}).`);
  }

  const text = data.text || data.message;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("The AI provider returned an empty response.");
  }

  return {
    text,
    raw: data,
    modelUsed: data.model || MODEL,
  };
}

export async function fetchAIResponse(prompt) {
  const response = await fetchAIChatResponse(prompt);
  return response.text;
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
          Array.isArray(parsed.items) &&
          parsed.items.length > 0 &&
          Date.now() - parsed.ts < 24 * 60 * 60 * 1000
        ) {
          return { items: parsed.items, cached: true, source: parsed.source };
        }
      }
    }
  } catch {
    // Ignore unavailable or malformed local cache data.
  }

  const fallbackQuestions = getFallbackDSAQuestions(company);
  if (!bypassCache && fallbackQuestions.length > 0) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          ts: Date.now(),
          items: fallbackQuestions,
          source: "offline",
        })
      );
    } catch {
      // The local question bank remains usable without browser storage.
    }
    return {
      items: fallbackQuestions,
      cached: false,
      source: "offline",
    };
  }

  const prompt = `You are an API that returns STRICT JSON ONLY. No explanations or commentary.
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
  let source = "gemini";
  let aiText = "";

  try {
    const aiResponse = await fetchAIChatResponse(prompt);
    aiText = aiResponse.text;
    try {
      items = JSON.parse(aiText);
    } catch {
      const firstBracket = aiText.indexOf("[");
      const lastBracket = aiText.lastIndexOf("]");
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        items = JSON.parse(aiText.slice(firstBracket, lastBracket + 1));
      }
    }
  } catch {
    source = "fallback";
  }

  if (!Array.isArray(items) || items.length === 0) {
    if (fallbackQuestions.length === 0) {
      throw new Error(
        "Interview questions are unavailable right now. Please try again later."
      );
    }
    items = fallbackQuestions;
    source = aiText ? "gemini-fallback" : "fallback";
  }

  const normalized = items
    .map((item) => ({
      question: item.question?.trim() || "",
      difficulty: ["easy", "medium", "hard"].includes(
        item.difficulty?.toLowerCase()
      )
        ? item.difficulty.toLowerCase()
        : "medium",
      topic: item.topic?.trim() || "General",
      links: item.links || {
        leetcode: "",
        geeksforgeeks: "",
        codingninjas: "",
      },
    }))
    .filter((item) => item.question);

  if (normalized.length === 0) {
    throw new Error(
      "Interview questions are unavailable right now. Please try again later."
    );
  }

  const shuffled = normalized
    .map((item, index) => ({ item, sortKey: Math.random() + index * 0.0001 }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ item }) => item);

  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), items: shuffled, source })
    );
  } catch {
    // The questions can still be used for this page session.
  }

  return { items: shuffled, cached: false, source };
}
