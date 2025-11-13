import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchAIChatResponse } from "../lib/puterClient";
import { useTheme } from "../context/ThemeContext";

const COMPANIES = ["Infosys", "TCS", "Accenture", "Wipro", "Capgemini"];
const ROUND_TYPES = ["Technical", "HR", "Online Assessment"];
const MAX_QUESTIONS = 6;

const buildBasePrompt = (
  company,
  roundType
) => `You are acting as an interviewer for ${company}, conducting a ${roundType} interview. Ask exactly ${MAX_QUESTIONS} questions one-by-one. After each candidate reply provide concise feedback (1-3 sentences) and then ask the next question. After the final question produce a final summary exactly in this format (no extra sections):

Final Score: X/10
Feedback Summary: <2-3 sentences>
Improvement Tips:
1. <tip>
2. <tip>
3. <tip>

Do not include emojis or unrelated commentary. Keep tone professional and encouraging.`;

const conversationToTranscript = (messages) =>
  messages
    .map(
      (m) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`
    )
    .join("\n");

const parseFinalSummary = (text) => {
  const scoreMatch = text.match(
    /Final Score:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*10/i
  );
  const score = scoreMatch
    ? Math.min(10, Math.max(0, parseFloat(scoreMatch[1])))
    : null;
  const summaryMatch = text.match(
    /Feedback Summary:\s*([\s\S]*?)(?:Improvement Tips:|$)/i
  );
  const tipsMatch = text.match(/Improvement Tips:\s*([\s\S]*)/i);
  const rawTips = tipsMatch ? tipsMatch[1] : "";
  const tips = rawTips
    .split(/\r?\n/)
    .map((t) => t.replace(/^[\d.\-\)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return {
    score,
    summary: summaryMatch ? summaryMatch[1].trim() : text.trim(),
    tips,
    raw: text.trim(),
  };
};

const scoreVariant = (score) => {
  if (score == null) return { emoji: "🎤", label: "Interview complete" };
  if (score >= 9) return { emoji: "💯", label: "Outstanding" };
  if (score >= 7.5) return { emoji: "🔥", label: "Great job" };
  if (score >= 6) return { emoji: "💪", label: "Solid attempt" };
  return { emoji: "📈", label: "Keep practicing" };
};

function formatDateTime(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString();
  } catch {
    return dateStr;
  }
}

async function loadLocalSessions() {
  try {
    const raw = localStorage.getItem("mockInterview:sessions");
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function loadCloudSessions() {
  try {
    const puter = window?.puter;
    if (!puter?.kv) return [];
    if (typeof puter.ready === "function") await puter.ready();
    else if (puter.ready && typeof puter.ready.then === "function")
      await puter.ready;

    let user = null;
    if (puter.auth?.getUser) {
      try {
        user = await puter.auth.getUser();
      } catch {
        user = null;
      }
    }
    if (!user) return [];

    const keys = (await puter.kv.keys?.()) || [];
    const sessionKeys = keys.filter((k) =>
      k.startsWith(`mockInterview:${user.id}:`)
    );
    const all = await Promise.all(
      sessionKeys.map(async (k) => {
        try {
          const val = await puter.kv.get(k);
          if (!val) return null;
          const data = JSON.parse(val);
          return { ...data, id: k };
        } catch {
          return null;
        }
      })
    );
    return all.filter(Boolean);
  } catch {
    return [];
  }
}

export default function MockInterview() {
  const { darkMode } = useTheme();
  const [company, setCompany] = useState(COMPANIES[0]);
  const [roundType, setRoundType] = useState(ROUND_TYPES[0]);
  const [conversation, setConversation] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [interviewActive, setInterviewActive] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [finalSummary, setFinalSummary] = useState(null);
  const questionCountRef = useRef(0);
  const chatEndRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    let cloud = [];
    let local = [];
    try {
      [cloud, local] = await Promise.all([
        loadCloudSessions(),
        loadLocalSessions(),
      ]);
    } catch {}
    // show cloud sessions first (if any), then local; unique by session id
    const byId = {};
    [...(cloud || []), ...(local || [])].forEach((s) => {
      if (s.id && !byId[s.id]) byId[s.id] = s;
    });
    setSessions(
      Object.values(byId).sort((a, b) =>
        (b.savedAt || 0) > (a.savedAt || 0) ? 1 : -1
      )
    );
    setLoadingSessions(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const basePrompt = useMemo(
    () => buildBasePrompt(company, roundType),
    [company, roundType]
  );

  useEffect(() => {
    if (chatEndRef.current)
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length, aiLoading]);

  const runChatOnce = useCallback(async (prompt) => {
    // We no longer use streaming
    return await fetchAIChatResponse(prompt);
  }, []);

  const startMockInterview = async () => {
    setError("");
    setStatusMessage("");
    setConversation([]);
    setFinalSummary(null);
    setInterviewActive(true);
    questionCountRef.current = 0;
    setAiLoading(true);

    try {
      const startPrompt = `${basePrompt}\n\nStart by asking Question 1. Wait for the candidate reply before proceeding.`;
      const resp = await runChatOnce(startPrompt);
      const finalText = (resp?.text ?? "").toString().trim();
      if (!finalText) throw new Error("Empty response from AI");
      setConversation([
        { role: "ai", content: finalText, timestamp: Date.now() },
      ]);
      questionCountRef.current = 1;
      setAiLoading(false);
    } catch (err) {
      console.error("Mock Interview start error:", err);
      setError(err.message || "Failed to start interview");
      setInterviewActive(false);
      setAiLoading(false);
    }
  };

  const handleStartInterview = () => startMockInterview();

  const handleUserSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!interviewActive || aiLoading || !userInput.trim() || finalSummary)
      return;
    setError("");
    const userMessage = {
      role: "user",
      content: userInput.trim(),
      timestamp: Date.now(),
    };
    const updatedHistory = [
      ...conversation.filter((c) => !c._streaming),
      userMessage,
    ];
    setConversation(updatedHistory);
    setUserInput("");
    setAiLoading(true);

    const remaining = Math.max(0, MAX_QUESTIONS - questionCountRef.current);
    const transcript = conversationToTranscript(updatedHistory);
    const direction =
      remaining > 0
        ? `Provide concise feedback on the user's answer, then ask Question ${
            questionCountRef.current + 1
          }.`
        : "Provide the final evaluation now exactly as instructed earlier. Do not ask any new questions.";

    try {
      const prompt = `${basePrompt}\n\nQuestions asked so far: ${questionCountRef.current}.\n\nConversation so far:\n${transcript}\n\n${direction}`;
      const resp = await runChatOnce(prompt);
      const finalText = (resp?.text ?? "").toString().trim();
      if (!finalText) throw new Error("AI returned empty response");
      setConversation((prev) => [
        ...prev.filter((m) => !(m._streaming === true && m.role === "ai")),
        { role: "ai", content: finalText, timestamp: Date.now() },
      ]);
      const containsQuestion = /Question\s*\d+/i.test(finalText);
      const isFinal =
        /Final Score:/i.test(finalText) ||
        (remaining === 0 && !containsQuestion);

      if (isFinal) {
        const parsed = parseFinalSummary(finalText);
        setFinalSummary(parsed);
        setInterviewActive(false);
      } else {
        questionCountRef.current = Math.min(
          MAX_QUESTIONS,
          questionCountRef.current + 1
        );
      }
    } catch (err) {
      console.error("Interview turn error", err);
      setError(
        err.message || "Unable to continue the interview. Please try again."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleTryAgain = () => {
    setConversation([]);
    setFinalSummary(null);
    setInterviewActive(false);
    setError("");
    setStatusMessage("");
    questionCountRef.current = 0;
    setUserInput("");
    setAiLoading(false);
  };

  const ensurePuterReady = async () => {
    const puter = window?.puter;
    if (!puter) throw new Error("Puter SDK not loaded");
    if (typeof puter.ready === "function") {
      await puter.ready();
    } else if (puter.ready && typeof puter.ready.then === "function") {
      await puter.ready;
    }
    return puter;
  };

  const saveSessionLocally = (payload) => {
    try {
      const storageKey = "mockInterview:sessions";
      const existingRaw = localStorage.getItem(storageKey);
      let existing = [];
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (Array.isArray(parsed)) existing = parsed;
        } catch {
          existing = [];
        }
      }
      const entry = {
        id:
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `session-${Date.now()}`,
        savedAt: new Date().toISOString(),
        ...payload,
      };
      const next = [entry, ...existing].slice(0, 25);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStatusMessage("Session saved locally on this device.");
      setError("");
      return true;
    } catch (storageErr) {
      console.error("Local session save failed", storageErr);
      return false;
    }
  };

  const saveSessionToPuter = async (payload) => {
    try {
      const puter = await ensurePuterReady();
      if (!puter?.kv) return false;

      let user = null;
      if (puter.auth?.getUser) {
        try {
          user = await puter.auth.getUser();
        } catch {
          user = null;
        }
      }

      if (!user && puter.auth?.signIn) {
        try {
          user = await puter.auth.signIn();
        } catch {
          user = null;
        }
      }

      if (!user) {
        setAuthRequired(true);
        setError("Sign in to Puter to save session in the cloud.");
        return false;
      }

      const key = `mockInterview:${user.id}:${Date.now()}`;
      await puter.kv.set(
        key,
        JSON.stringify({
          userId: user.id,
          savedAt: new Date().toISOString(),
          ...payload,
        })
      );
      setStatusMessage("Session saved to your Puter cloud.");
      setError("");
      return true;
    } catch (err) {
      console.error("Puter cloud save failed", err);
      return false;
    }
  };

  const handleSaveSession = async () => {
    if (!finalSummary) return;
    setSaving(true);
    try {
      const payload = {
        company,
        roundType,
        transcript: conversation.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || Date.now(),
        })),
        score: finalSummary.score,
        summary: finalSummary.summary,
        improvements: finalSummary.tips,
      };
      // Try saving to Puter Cloud only, or localStorage as fallback if Puter unavailable.
      const cloudSaved = await saveSessionToPuter(payload);
      if (cloudSaved) return;
      if (saveSessionLocally(payload)) return;
      throw new Error("Unable to save session.");
    } catch (err) {
      console.error("Save session error", err);
      setError(err.message || "Unable to save session");
    } finally {
      setSaving(false);
    }
  };

  const { emoji, label } = scoreVariant(finalSummary?.score ?? null);
  const scorePercent =
    finalSummary?.score != null
      ? Math.min(100, (finalSummary.score / 10) * 100)
      : null;

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-gray-900"
      } min-h-[calc(100dvh-4rem)] w-full py-8 sm:py-10`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
            <span role="img" aria-hidden="true">
              🎤
            </span>{" "}
            Mock Interview Simulator
          </h1>
          <p className="text-sm sm:text-base opacity-80 max-w-3xl leading-relaxed">
            Practice realistic interviews tailored to your target company and
            round. The AI interviewer asks one question at a time, provides
            immediate feedback, and finishes with a score, summary, and
            personalised improvement tips.
          </p>
        </header>

        {/* Controls */}
        <section
          className={`${
            darkMode
              ? "bg-[#111111] border border-white/10"
              : "bg-white border border-gray-200"
          } rounded-2xl p-5 sm:p-6 shadow-lg transition-colors`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium opacity-80">Company</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={`${
                  darkMode
                    ? "bg-[#1a1a1a] border-white/10"
                    : "bg-white border-gray-300"
                } rounded-xl border px-3 py-2 focus:outline-none focus:border-orange-400 transition-colors`}
              >
                {COMPANIES.map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium opacity-80">
                Round Type
              </label>
              <select
                value={roundType}
                onChange={(e) => setRoundType(e.target.value)}
                className={`${
                  darkMode
                    ? "bg-[#1a1a1a] border-white/10"
                    : "bg-white border-gray-300"
                } rounded-xl border px-3 py-2 focus:outline-none focus:border-orange-400 transition-colors`}
              >
                {ROUND_TYPES.map((it) => (
                  <option key={it} value={it}>
                    {it}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={aiLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {aiLoading ? "Starting..." : "Start Interview"}
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-400/40 text-red-400 bg-red-500/10 px-4 py-3 text-sm text-center mt-2">
            {error}
          </div>
        )}

        {(statusMessage || authRequired) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              statusMessage
                ? "border-emerald-400/40 text-emerald-300 bg-emerald-500/10"
                : "border-amber-400/40 text-amber-200 bg-amber-500/10"
            }`}
          >
            {statusMessage ||
              "Sign in to save and revisit your mock interviews."}
          </div>
        )}

        {/* Interview feed */}
        <section
          className={`${
            darkMode
              ? "bg-[#111111] border border-white/10"
              : "bg-white border border-gray-200"
          } rounded-2xl p-5 sm:p-6 shadow-xl transition-colors flex flex-col gap-4`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold">Interview Feed</h2>
            {(interviewActive || finalSummary) && (
              <button
                type="button"
                onClick={handleTryAgain}
                className="text-sm px-3 py-1.5 rounded-lg border border-orange-400 text-orange-400 hover:bg-orange-400/10 transition"
              >
                Try Again
              </button>
            )}
          </div>

          <div
            className={`${
              darkMode ? "bg-[#0d0d0d]" : "bg-gray-50"
            } rounded-xl p-4 sm:p-5 max-h-[70vh] overflow-y-auto flex flex-col gap-4 transition-colors`}
          >
            {conversation.length === 0 && !aiLoading && (
              <div className="text-sm opacity-70 text-center py-8">
                Start the interview to begin a realistic conversation with the
                AI interviewer.
              </div>
            )}

            {aiLoading && conversation.length === 0 && (
              <div className="text-sm flex items-center justify-center gap-3 py-6 animate-pulse text-orange-500">
                <span role="img" aria-hidden="true">
                  🤖
                </span>{" "}
                Initializing interview with {company} ({roundType})…
              </div>
            )}

            {conversation.map((msg, index) => (
              <div
                key={`${msg.timestamp}-${index}`}
                className={`flex ${
                  msg.role === "ai" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`${
                    msg.role === "ai"
                      ? darkMode
                        ? "bg-orange-500/10 border border-orange-500/30"
                        : "bg-orange-100 border border-orange-300/50"
                      : "bg-orange-500 text-white"
                  } max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl shadow transition`}
                >
                  <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {aiLoading && conversation.length > 0 && (
              <div className="flex justify-start">
                <div
                  className={`${
                    darkMode
                      ? "bg-orange-500/10 border border-orange-500/30"
                      : "bg-orange-100 border border-orange-300/50"
                  } px-4 py-2 rounded-2xl text-sm animate-pulse`}
                >
                  Thinking…
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleUserSubmit} className="flex gap-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={
                interviewActive
                  ? "Type your response"
                  : "Start the interview to respond"
              }
              disabled={!interviewActive || aiLoading || !!finalSummary}
              className={`${
                darkMode
                  ? "bg-[#1a1a1a] border-white/10"
                  : "bg-white border-gray-300"
              } flex-1 rounded-xl border px-4 py-3 text-sm sm:text-base focus:outline-none focus:border-orange-400 transition disabled:opacity-60`}
            />
            <button
              type="submit"
              disabled={!interviewActive || aiLoading || !!finalSummary}
              className="inline-flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 sm:px-6 py-3 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </section>

        {finalSummary && (
          <section
            className={`${
              darkMode
                ? "bg-[#111111] border border-white/10"
                : "bg-white border border-gray-200"
            } rounded-2xl p-5 sm:p-6 shadow-xl transition-colors space-y-5`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <span role="img" aria-hidden="true">
                    {emoji}
                  </span>{" "}
                  Final Evaluation
                </h3>
                <p className="text-sm opacity-70 mt-1">
                  {label} — based on your performance in the {company}{" "}
                  {roundType} interview.
                </p>
              </div>
              {finalSummary.score != null && (
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <div className="text-3xl font-bold">
                    {finalSummary.score.toFixed(1)}/10
                  </div>
                  <div className="w-28 h-2 rounded-full bg-orange-500/20 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500"
                      style={{ width: `${scorePercent ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div
              className={`${
                darkMode
                  ? "bg-[#1a1a1a] border border-white/10"
                  : "bg-orange-50 border border-orange-200"
              } rounded-xl px-4 py-4 text-sm leading-relaxed whitespace-pre-line`}
            >
              {finalSummary.summary}
            </div>

            {finalSummary.tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wide opacity-70">
                  Improvement Tips
                </h4>
                <ul className="space-y-2 text-sm">
                  {finalSummary.tips.map((tip, index) => (
                    <li
                      key={index}
                      className={`${
                        darkMode
                          ? "bg-[#1a1a1a] border-white/5"
                          : "bg-white border-orange-200/60"
                      } border rounded-xl px-4 py-3 flex gap-3`}
                    >
                      <span className="font-semibold text-orange-500">
                        {index + 1}.
                      </span>
                      <span className="opacity-80">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handleTryAgain}
                className="text-sm px-4 py-2 rounded-lg border border-orange-400 text-orange-400 hover:bg-orange-400/10 transition"
              >
                Try Again
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSession}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "💾 Save Session"}
              </button>
            </div>
          </section>
        )}

        <section
          className={`${
            darkMode
              ? "bg-[#111111] border border-white/10"
              : "bg-white border border-gray-200"
          } rounded-2xl p-5 sm:p-6 shadow-xl transition-colors space-y-4`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Past Interviews</h3>
            <button
              type="button"
              disabled={loadingSessions}
              onClick={loadSessions}
              className="text-xs px-3 py-1.5 rounded-lg border border-orange-400 text-orange-400 hover:bg-orange-400/10 transition disabled:opacity-60"
            >
              {loadingSessions ? "Loading..." : "Refresh"}
            </button>
          </div>
          {sessions.length === 0 && (
            <div className="text-sm opacity-70">
              No sessions saved yet. Complete and save an interview to see it
              here.
            </div>
          )}
          {sessions.length > 0 && (
            <ul className="divide-y divide-gray-200/10">
              {sessions.map((s) => (
                <li key={s.id} className="py-4 flex flex-col gap-1">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-medium">{s.company}</span>
                    <span className="text-xs px-2 py-1 bg-orange-50 rounded border border-orange-100 text-orange-700">
                      {s.roundType}
                    </span>
                    <span className="text-xs opacity-60">
                      {formatDateTime(s.savedAt)}
                    </span>
                    {typeof s.score === "number" && (
                      <span className="font-bold text-orange-500">
                        Score: {Number(s.score).toFixed(1)}/10
                      </span>
                    )}
                  </div>
                  {s.summary && (
                    <div className="text-xs opacity-80">
                      <span className="font-semibold uppercase tracking-wider mr-2">
                        Summary:
                      </span>{" "}
                      {s.summary}
                    </div>
                  )}
                  {Array.isArray(s.improvements) &&
                    s.improvements.length > 0 && (
                      <div className="text-xs flex flex-col gap-1 mt-1">
                        <span className="font-semibold uppercase tracking-wider mb-1">
                          Tips:
                        </span>
                        <ul className="list-decimal list-inside">
                          {s.improvements.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
