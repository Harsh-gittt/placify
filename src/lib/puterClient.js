// fetchAIResponse: uses browser Puter.js directly, never via backend
export async function fetchAIResponse(prompt, { timeoutMs = 25000 } = {}) {
  if (!window.puter?.ai?.chat) {
    const msg =
      'Puter.js is not available in the browser. Please ensure <script src="https://js.puter.com/v2/"></script> is included in index.html and you\'re not using SSR/backend!';
    console.error(msg);
    throw new Error(msg);
  }
  try {
    console.log("Requesting AI via Puter.js (browser)");
    // Optionally: you can add a timeout wrapper with Promise.race here
    const result = await window.puter.ai.chat(prompt);
    if (!result) throw new Error("Puter.ai.chat gave an empty response");
    // Result might be an object or string depending on Puter.js version/config
    if (typeof result === "string") return result;
    // If returned as object, try to extract content
    return (
      result.message ||
      result.content ||
      result?.choices?.[0]?.message?.content ||
      JSON.stringify(result)
    );
  } catch (err) {
    console.error("fetchAIResponse (browser/Puter.js) error:", err);
    throw err;
  }
}
