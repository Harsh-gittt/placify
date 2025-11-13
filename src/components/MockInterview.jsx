import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAIResponse } from "../lib/puterClient";
import { useTheme } from "../context/ThemeContext";

const COMPANIES = ["Infosys", "TCS", "Accenture", "Wipro", "Capgemini"];
const ROUND_TYPES = ["Technical", "HR", "Online Assessment"];
const MAX_QUESTIONS = 6;

/* Utility to safely extract text from AI responses */
const extractAiText = (response) => {
  if (!response) return "";
  if (typeof response === "string") return response;
  if (typeof response.message === "string") return response.message;
  if (response?.message?.content) return response.message.content;
  if (Array.isArray(response?.messages) && response.messages.length) {
    const last = response.messages.at(-1);
    if (typeof last === "string") return last;
    if (typeof last?.content === "string") return last.content;
  }
  if (Array.isArray(response?.choices) && response.choices.length) {
    const choice = response.choices[0];
    if (typeof choice === "string") return choice;
    if (typeof choice?.message?.content === "string") return choice.message.content;
  }
  if (typeof response?.text === "string") return response.text;
  if (typeof response?.content === "string") return response.content;
  try {
    return JSON.stringify(response);
  } catch {
    return String(response);
  }
};

const buildBasePrompt = (company, roundType) => `You are acting as an interviewer for ${company}, conducting a ${roundType} interview. Ask exactly ${MAX_QUESTIONS} questions one-by-one. After each candidate reply provide concise feedback (1-3 sentences) and then ask the next question. After the final question produce a final summary exactly in this format (no extra sections):

Final Score: X/10
Feedback Summary: <2-3 sentences>
Improvement Tips:
1. <tip>
2. <tip>
3. <tip>

Do not include emojis or unrelated commentary. Keep tone professional and encouraging.`;

const conversationToTranscript = (messages) =>
  messages.map((m) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n");

const parseFinalSummary = (text) => {
  const scoreMatch = text.match(/Final Score:\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*10/i);
  const score = scoreMatch ? Math.min(10, Math.max(0, parseFloat(scoreMatch[1]))) : null;
  const summaryMatch = text.match(/Feedback Summary:\s*([\s\S]*?)(?:Improvement Tips:|$)/i);
  const tipsMatch = text.match(/Improvement Tips:\s*([\s\S]*)/i);
  const rawTips = tipsMatch ? tipsMatch[1] : "";
  const tips = rawTips
    .split(/\r?\n/)
    .map((t) => t.replace(/^[\d\.\-\)\s]+/, "").trim())
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

const isUnauthorizedError = (error) => {
  if (!error) return false;
  const status = error.status || error?.response?.status;
  if (status === 401) return true;
  const message = typeof error.message === "string" ? error.message : "";
  return message.includes("401") || message.toLowerCase().includes("unauthorized");
};

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
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const questionCountRef = useRef(0);
  const chatEndRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const basePrompt = useMemo(() => buildBasePrompt(company, roundType), [company, roundType]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [conversation.length, aiLoading]);

  // Safe wrapper for Puter/AI fetch
  const runChat = useCallback(async (prompt) => {
    try {
      const res = await fetchAIResponse(prompt);
      const text = extractAiText(res);
      return { text, raw: res };
    } catch (err) {
      console.error("AI chat error:", err);
      throw err;
    }
  }, []);

  const startMockInterview = async (companyVal, roundVal) => {
    setError("");
    setStatusMessage("");
    setConversation([]);
    setFinalSummary(null);
    setInterviewActive(true);
    questionCountRef.current = 0;
    setAiLoading(true);

    try {
      const firstPrompt = `${basePrompt}\n\nStart by asking Question 1. Wait for the candidate reply before proceeding.`;
      const response = await runChat(firstPrompt);
      const firstText = (response?.text || "").toString().trim();

      if (!firstText) throw new Error("Empty response from AI");

      questionCountRef.current = 1;
      setConversation([
        { role: "ai", content: firstText, timestamp: Date.now() }
      ]);
    } catch (err) {
      console.error("Mock Interview error:", err);
      const msg = err?.message || String(err);
      if (msg.includes("403") || msg.includes("401")) {
        setError("AI provider blocked or requires auth. Ask admin to configure Puter access.");
      } else {
        setError(msg);
      }
      setInterviewActive(false);
    } finally {
      setAiLoading(false);
    }
  };

  const handleStartInterview = () => startMockInterview(company, roundType);

  const handleUserSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!interviewActive || aiLoading || !userInput.trim() || finalSummary) return;
    setError("");
    const userMessage = { role: "user", content: userInput.trim(), timestamp: Date.now() };
    const updatedHistory = [...conversation, userMessage];
    setConversation(updatedHistory);
    setUserInput("");
    setAiLoading(true);

    const remaining = Math.max(0, MAX_QUESTIONS - questionCountRef.current);
    const transcript = conversationToTranscript(updatedHistory);
    const direction = remaining > 0
      ? `Provide concise feedback on the user's answer, then ask Question ${questionCountRef.current + 1}.`
      : "Provide the final evaluation now exactly as instructed earlier. Do not ask any new questions.";

    try {
      const prompt = `${basePrompt}\n\nQuestions asked so far: ${questionCountRef.current}.\n\nConversation so far:\n${transcript}\n\n${direction}`;
      const response = await runChat(prompt);
      const text = (response?.text || "").toString().trim();
      if (!text) throw new Error("AI returned empty response");

      const aiMessage = { role: "ai", content: text, timestamp: Date.now() };

      const containsQuestion = /Question\s*\d+/i.test(text);
      const isFinal = /Final Score:/i.test(text) || (remaining === 0 && !containsQuestion);

      setConversation((prev) => [...prev, aiMessage]);

      if (isFinal) {
        setFinalSummary(parseFinalSummary(text));
        setInterviewActive(false);
      } else {
        // increment counter if AI asked next question
        questionCountRef.current = Math.min(MAX_QUESTIONS, questionCountRef.current + 1);
      }
    } catch (err) {
      console.error("Interview turn error", err);
      const msg = err?.message || "Unable to continue the interview. Please try again.";
      setError(msg.includes("403") || msg.includes("401") ? "AI provider blocked or requires auth." : msg);
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

  /* Optional save session — calls backend if you have it */
  useEffect(() => {
    // eslint-disable-next-line no-unused-vars
    const p = async () => {};
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  const { emoji, label } = scoreVariant(finalSummary?.score ?? null);
  const scorePercent = finalSummary?.score != null ? Math.min(100, (finalSummary.score / 10) * 100) : null;

  return (
    <div className={`${darkMode ? "bg-black text-white" : "bg-white text-gray-900"} min-h-[calc(100dvh-4rem)] w-full py-8 sm:py-10`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <header className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-2">
            <span role="img" aria-hidden="true">🎤</span>
            Mock Interview Simulator
          </h1>
          <p className="text-sm sm:text-base opacity-80 max-w-3xl leading-relaxed">
            Practice realistic interviews tailored to your target company and round. The AI interviewer asks one question at a time, provides immediate feedback, and finishes with a score, summary, and personalised improvement tips.
          </p>
        </header>

        <section className={`${darkMode ? "bg-[#111111] border border-white/10" : "bg-white border border-gray-200"} rounded-2xl p-5 sm:p-6 shadow-lg transition-colors`}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium opacity-80">Company</label>
              <select value={company} onChange={(e) => setCompany(e.target.value)} className={`${darkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-300"} rounded-xl border px-3 py-2 focus:outline-none focus:border-orange-400 transition-colors`}>
                {COMPANIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium opacity-80">Round Type</label>
              <select value={roundType} onChange={(e) => setRoundType(e.target.value)} className={`${darkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-300"} rounded-xl border px-3 py-2 focus:outline-none focus:border-orange-400 transition-colors`}>
                {ROUND_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={handleStartInterview} disabled={aiLoading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {aiLoading ? "Starting..." : "Start Interview"}
              </button>
            </div>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-400/40 text-red-400 bg-red-500/10 px-4 py-3 text-sm text-center mt-2">{error}</div>}
        {(statusMessage || authRequired) && <div className={`rounded-xl border px-4 py-3 text-sm ${statusMessage ? "border-emerald-400/40 text-emerald-300 bg-emerald-500/10" : "border-amber-400/40 text-amber-200 bg-amber-500/10"}`}>{statusMessage || "Sign in to save and revisit your mock interviews."}</div>}

        <section className={`${darkMode ? "bg-[#111111] border border-white/10" : "bg-white border border-gray-200"} rounded-2xl p-5 sm:p-6 shadow-xl transition-colors flex flex-col gap-4`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg sm:text-xl font-semibold">Interview Feed</h2>
            {interviewActive || finalSummary ? <button type="button" onClick={handleTryAgain} className="text-sm px-3 py-1.5 rounded-lg border border-orange-400 text-orange-400 hover:bg-orange-400/10 transition">Try Again</button> : null}
          </div>

          <div className={`${darkMode ? "bg-[#0d0d0d]" : "bg-gray-50"} rounded-xl p-4 sm:p-5 max-h-[70vh] overflow-y-auto flex flex-col gap-4 transition-colors`}>
            {conversation.length === 0 && !aiLoading && <div className="text-sm opacity-70 text-center py-8">Start the interview to begin a realistic conversation with the AI interviewer.</div>}

            {aiLoading && conversation.length === 0 && <div className="text-sm flex items-center justify-center gap-3 py-6 animate-pulse text-orange-500"><span role="img" aria-hidden="true">🤖</span> Initializing interview with {company} ({roundType})…</div>}

            {conversation.map((msg, index) => (
              <div key={`${msg.timestamp}-${index}`} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                <div className={`${msg.role === "ai" ? (darkMode ? "bg-orange-500/10 border border-orange-500/30" : "bg-orange-100 border border-orange-300/50") : "bg-orange-500 text-white"} max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl shadow transition`}>
                  <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {aiLoading && conversation.length > 0 && <div className="flex justify-start"><div className={`${darkMode ? "bg-orange-500/10 border border-orange-500/30" : "bg-orange-100 border border-orange-300/50"} px-4 py-2 rounded-2xl text-sm animate-pulse`}>Thinking…</div></div>}

            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleUserSubmit} className="flex gap-3">
            <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder={interviewActive ? "Type your response" : "Start the interview to respond"} disabled={!interviewActive || aiLoading || !!finalSummary} className={`${darkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-gray-300"} flex-1 rounded-xl border px-4 py-3 text-sm sm:text-base focus:outline-none focus:border-orange-400 transition disabled:opacity-60`} />
            <button type="submit" disabled={!interviewActive || aiLoading || !!finalSummary} className="inline-flex items-center justify-center rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold px-4 sm:px-6 py-3 transition disabled:opacity-60 disabled:cursor-not-allowed">Send</button>
          </form>
        </section>

        {finalSummary && (
          <section className={`${darkMode ? "bg-[#111111] border border-white/10" : "bg-white border border-gray-200"} rounded-2xl p-5 sm:p-6 shadow-xl transition-colors space-y-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2"><span role="img" aria-hidden="true">{emoji}</span> Final Evaluation</h3>
                <p className="text-sm opacity-70 mt-1">{label} — based on your performance in the {company} {roundType} interview.</p>
              </div>
              {finalSummary.score != null && (
                <div className="flex flex-col items-end gap-2 min-w-[120px]">
                  <div className="text-3xl font-bold">{finalSummary.score.toFixed(1)}/10</div>
                  <div className="w-28 h-2 rounded-full bg-orange-500/20 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transition-all duration-500" style={{ width: `${scorePercent ?? 0}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className={`${darkMode ? "bg-[#1a1a1a] border border-white/10" : "bg-orange-50 border border-orange-200"} rounded-xl px-4 py-4 text-sm leading-relaxed whitespace-pre-line`}>
              {finalSummary.summary}
            </div>

            {finalSummary.tips.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold uppercase tracking-wide opacity-70">Improvement Tips</h4>
                <ul className="space-y-2 text-sm">
                  {finalSummary.tips.map((tip, index) => <li key={index} className={`${darkMode ? "bg-[#1a1a1a] border-white/5" : "bg-white border-orange-200/60"} border rounded-xl px-4 py-3 flex gap-3`}><span className="font-semibold text-orange-500">{index + 1}.</span><span className="opacity-80">{tip}</span></li>)}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <button type="button" onClick={handleTryAgain} className="text-sm px-4 py-2 rounded-lg border border-orange-400 text-orange-400 hover:bg-orange-400/10 transition">Try Again</button>
              <button type="button" disabled={saving} className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed">
                {saving ? "Saving…" : "💾 Save Session"}
              </button>
            </div>
          </section>
        )}

        <section className={`${darkMode ? "bg-[#111111] border border-white/10" : "bg-white border border-gray-200"} rounded-2xl p-5 sm:p-6 shadow-xl transition-colors space-y-4`}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Past Interviews</h3>
            <button type="button" onClick={() => {}} className="text-xs px-3 py-1.5 rounded-lg border border-orange-400 text-orange-400 hover:bg-orange-400/10 transition">Refresh</button>
          </div>

          <div className="text-sm opacity-70">Saved sessions will appear here (requires backend). You can still practice without saving.</div>
        </section>
      </div>
    </div>
  );
}
