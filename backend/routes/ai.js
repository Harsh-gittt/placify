// backend/routes/ai.js
const express = require("express");
const router = express.Router();

// Helper: call Puter (no-key) first, then fallback to OpenRouter if configured
async function callPuter(prompt) {
  const res = await fetch("https://api.puter.com/v1/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-3.5", messages: [{ role: "user", content: prompt }] }),
  });
  return res;
}

async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not configured");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  return res;
}

router.post("/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    // Try Puter first (no API key). Wrap in try/catch.
    try {
      const puterResp = await callPuter(prompt);
      if (puterResp.ok) {
        const data = await puterResp.json();
        const message = data?.message || data?.choices?.[0]?.message?.content || JSON.stringify(data);
        return res.json({ provider: "puter", message });
      }

      // If Puter returns 401/403 or other non-ok, log and fallthrough to fallback
      const status = puterResp.status;
      const bodyText = await puterResp.text().catch(()=>"");
      console.warn(`⚠️ Puter returned non-ok: ${status}`, bodyText.substring(0, 100));
      if (status === 401 || status === 403) {
        console.log("Puter API requires authentication. Checking for OpenRouter fallback...");
      } else if (status !== 401 && status !== 403) {
        // For other statuses, still attempt fallback if configured
        console.warn("Puter non-ok status; attempting fallback if available");
      }
    } catch (puterErr) {
      console.warn("Puter call failed:", puterErr.message || puterErr);
    }

    // Fallback: OpenRouter (if API key exists)
    if (process.env.OPENROUTER_API_KEY) {
      console.log("Puter failed, attempting OpenRouter fallback...");
      try {
        const openResp = await callOpenRouter(prompt);
        if (openResp.ok) {
          const data = await openResp.json();
          const message = data?.choices?.[0]?.message?.content || JSON.stringify(data);
          console.log("✅ OpenRouter fallback successful");
          return res.json({ provider: "openrouter", message });
        }
        const txt = await openResp.text().catch(()=>"");
        console.warn("OpenRouter non-ok:", openResp.status, txt);
        return res.status(502).json({ error: "OpenRouter returned non-ok", details: txt });
      } catch (openErr) {
        console.error("OpenRouter call failed:", openErr);
        return res.status(502).json({ error: "OpenRouter request failed", details: openErr.message });
      }
    }

    // If we get here, no fallback available
    console.error("❌ Puter API blocked (403) and no OpenRouter fallback configured");
    return res.status(403).json({
      error: "Puter API access denied (403). To fix this:\n1. Get a free OpenRouter API key at https://openrouter.ai/keys\n2. Add OPENROUTER_API_KEY=your_key to backend/.env\n3. Restart the backend server",
    });
  } catch (err) {
    console.error("AI proxy error:", err);
    return res.status(500).json({ error: "Server error while fetching AI response", details: err.message });
  }
});

module.exports = router;
