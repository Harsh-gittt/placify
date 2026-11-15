const express = require("express");
const router = express.Router();

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

router.post("/ai", async (req, res) => {
  const prompt = req.body?.prompt;
  if (typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "A non-empty prompt is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error:
        "AI is not configured. Create a free key at https://aistudio.google.com/apikey, add it as GEMINI_API_KEY in backend/.env, and restart the backend.",
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
      }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data?.error?.message || `Gemini request failed (${response.status}).`;
      console.error(`Gemini returned HTTP ${response.status}`);
      return res.status(response.status === 429 ? 429 : 502).json({
        error: message,
      });
    }

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({
        error: "Gemini returned no text. The prompt may have been blocked.",
      });
    }

    return res.json({
      provider: "gemini",
      model: GEMINI_MODEL,
      text,
      message: text,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Gemini request timed out." });
    }
    console.error("Gemini request failed:", error.message);
    return res.status(502).json({ error: "Could not reach the Gemini API." });
  } finally {
    clearTimeout(timeout);
  }
});

module.exports = router;
