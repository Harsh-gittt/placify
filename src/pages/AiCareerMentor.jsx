import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";

function AiCareerMentor() {
  const { darkMode } = useTheme();
  const [companyName, setCompanyName] = useState("");
  const [placementType, setPlacementType] = useState("On Campus");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultText, setResultText] = useState("");

  const isPuterReady = () => typeof window !== "undefined" && typeof window.puter !== "undefined";

  async function handleGetInsights() {
    setError("");
    setResultText("");

    if (!companyName.trim()) {
      setError("Please enter a company name.");
      return;
    }

    if (!isPuterReady()) {
      setError("Puter.js is not loaded. Please refresh the page or ensure you're signed in to Puter.");
      return;
    }

    const prompt = `Give me the hiring process for ${companyName} via ${placementType} placement. Include:\n- number of rounds,\n- type of each round,\n- important questions,\n- additional notes,\n- and tips to clear each round.`;

    try {
      setLoading(true);
      const resp = await window.puter.ai.chat(prompt);
      const text = typeof resp === "string" ? resp : (resp?.text ?? JSON.stringify(resp));
      setResultText(String(text || ""));
    } catch (e) {
      setError(e?.message || "Failed to fetch insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Simple parser to extract suggested sections when present
  function parseSections(text) {
    const t = (text || "").replace(/\r/g, "").replace(/\\n/g, "\n");
    const lower = t.toLowerCase();
    const keys = [
      { key: "number of rounds", label: "Number of Rounds" },
      { key: "type of each round", label: "Round Types" },
      { key: "important questions", label: "Sample Questions" },
      { key: "tips", label: "Tips to Succeed" },
      { key: "additional notes", label: "Additional Notes" },
    ];

    const indices = keys
      .map(k => ({ label: k.label, key: k.key, idx: lower.indexOf(k.key) }))
      .filter(x => x.idx !== -1)
      .sort((a, b) => a.idx - b.idx);

    if (indices.length < 2) return null; // not enough structure; render raw

    const sections = {};
    for (let i = 0; i < indices.length; i++) {
      const start = indices[i].idx;
      const end = i + 1 < indices.length ? indices[i + 1].idx : t.length;
      const label = indices[i].label;
      // Slice original text to preserve case
      const slice = t.substring(start, end);
      // Remove the key header portion
      const headerLen = indices[i].key.length;
      sections[label] = slice.substring(headerLen).trim();
    }
    return sections;
  }

  const sections = parseSections(resultText);

  return (
    <div className={`${darkMode ? "bg-black text-white" : "bg-white text-gray-800"} min-h-[calc(100dvh-4rem)] w-full`}>
      {/* Hero */}
      <section className="px-6 pt-6">
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-2xl p-8 sm:p-10 border shadow-[0_10px_40px_rgba(0,0,0,0.25)] bg-gradient-to-br from-orange-500/10 to-purple-500/10 ${darkMode ? "border-gray-800" : "border-gray-200"}`}>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-500">AI Career Mentor</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base opacity-80">
              Get clear, sectioned insights on hiring processes with tips and practice links.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="px-6 mt-6">
        <div className="max-w-7xl mx-auto">
          <div className={`${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} rounded-2xl shadow-lg border p-6 sm:p-8`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Infosys"
                  className={`${darkMode ? "bg-[#121212] border-gray-800 text-white" : "bg-white border-gray-300 text-gray-900"} w-full px-4 py-3 rounded-xl border outline-none focus:border-orange-400`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Placement Type</label>
                <select
                  value={placementType}
                  onChange={(e) => setPlacementType(e.target.value)}
                  className={`${darkMode ? "bg-[#121212] border-gray-800 text-white" : "bg-white border-gray-300 text-gray-900"} w-full px-4 py-3 rounded-xl border outline-none focus:border-orange-400`}
                >
                  <option>On Campus</option>
                  <option>Off Campus</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleGetInsights}
                disabled={loading}
                className={`px-5 py-3 rounded-xl font-semibold ${
                  loading ? "bg-orange-300 cursor-not-allowed" : "bg-orange-400 hover:bg-orange-500"
                } text-white transition-colors`}
              >
                {loading ? "Fetching…" : "Get Career Insights"}
              </button>
              {!isPuterReady() && (
                <span className="text-sm opacity-80">Puter.js not detected — please refresh or sign into Puter.</span>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg p-3">
                {error}
              </div>
            )}
            {!error && loading && (
              <div className="mt-4 text-sm opacity-80">Analyzing hiring process…</div>
            )}
          </div>
        </div>
      </section>

      {/* Results & Preparation */}
      <section className="px-6 mt-6 mb-10">
        <div className="max-w-7xl mx-auto">
          {resultText && (
            <div className={`${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} rounded-2xl shadow-lg border p-6 sm:p-8`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-2xl font-bold">Career Insights</h2>
                <span className="text-sm opacity-70">Structured summary based on AI response</span>
              </div>

              {/* Horizontal Preparation & Practice */}
              <div className="mb-6 -mx-2 overflow-x-auto">
                <div className="px-2 flex items-stretch gap-3 min-w-max">
                  <Link className="block" to="/dsa">
                    <PrepLink label="DSA Practice" description="Ace problem-solving" color="from-orange-500 to-pink-500" />
                  </Link>
                  <Link className="block" to="/aptitude-questions">
                    <PrepLink label="Aptitude" description="Quantitative & logical" color="from-blue-500 to-cyan-500" />
                  </Link>
                  <Link className="block" to="/hr">
                    <PrepLink label="HR & Behavioral" description="Interview behaviors" color="from-purple-500 to-violet-500" />
                  </Link>
                  <Link className="block" to="/resources">
                    <PrepLink label="Core Subjects" description="OS • DBMS • CN" color="from-emerald-500 to-teal-500" />
                  </Link>
                  <Link className="block" to="/mock-interview">
                    <PrepLink label="Mock Interview" description="Simulate rounds" color="from-red-500 to-orange-500" />
                  </Link>
                </div>
              </div>

              {/* Insights content - wider layout */}
              {sections ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(sections).map(([label, content]) => (
                    <SectionBlock key={label} label={label} content={content} darkMode={darkMode} />
                  ))}
                </div>
              ) : (
                <div className={`${darkMode ? "bg-[#0f0f0f] border-gray-800" : "bg-gray-100 border-gray-200"} p-4 rounded-lg border`}>
                  <div className="text-lg whitespace-pre-wrap leading-7">
                    {resultText}
                  </div>
                </div>
              )}

              {/* External practice links (inline) */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold opacity-80">External practice</h4>
                <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <li><a className="text-orange-400 hover:underline" href="https://leetcode.com" target="_blank" rel="noreferrer">LeetCode</a> — coding rounds & contests</li>
                  <li><a className="text-orange-400 hover:underline" href="https://www.geeksforgeeks.org" target="_blank" rel="noreferrer">GeeksforGeeks</a> — interview experiences</li>
                  <li><a className="text-orange-400 hover:underline" href="https://www.interviewbit.com" target="_blank" rel="noreferrer">InterviewBit</a> — guided practice</li>
                  <li><a className="text-orange-400 hover:underline" href="https://prepinsta.com" target="_blank" rel="noreferrer">PrepInsta</a> — campus placement resources</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AiCareerMentor;

// Helper components
function SectionBlock({ label, content, darkMode }) {
  const raw = String(content || "").replace(/\\n/g, "\n");
  const lines = raw.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const bulletRx = /^([\-*•]|\d+\.|\d+\))\s+/;
  const bulletLines = lines.filter(l => bulletRx.test(l));
  const nonBulletLines = lines.filter(l => !bulletRx.test(l));
  const showList = bulletLines.length >= 2 || (raw.includes(" - ") && raw.split(" - ") .length > 3);
  const hyphenTokens = showList && bulletLines.length === 0
    ? raw.split(/\s+-\s+/).map(t => t.trim()).filter(Boolean)
    : [];
  const items = bulletLines.length > 0
    ? bulletLines.map(l => l.replace(bulletRx, ""))
    : hyphenTokens;
  const heading = nonBulletLines.length && nonBulletLines[0].endsWith(":") ? nonBulletLines[0].replace(/:$/, "") : null;
  return (
    <div className={`${darkMode ? "bg-[#0f0f0f] border-gray-800" : "bg-gray-100 border-gray-200"} p-5 rounded-lg border`}>
      <h3 className="text-xl font-semibold mb-2">{label}</h3>
      {heading && <div className="text-sm opacity-70 mb-2">{heading}</div>}
      {showList && items.length > 0 ? (
        <ul className="list-disc ml-6 space-y-2 text-lg leading-7">
          {items.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : (
        <div className="text-lg whitespace-pre-wrap leading-7">{raw}</div>
      )}
    </div>
  );
}

function PrepLink({ label, description, color }) {
  return (
    <div className={`rounded-xl p-3 border ${"bg-gradient-to-r " + color} text-white shadow hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-xs opacity-90">{description}</div>
        </div>
        <span>→</span>
      </div>
    </div>
  );
}