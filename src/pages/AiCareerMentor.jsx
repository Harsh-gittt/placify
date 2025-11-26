import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { Link } from "react-router-dom";
import { fetchAIResponse } from "../lib/puterClient";

function AiCareerMentor() {
  const { darkMode } = useTheme();
  const [companyName, setCompanyName] = useState("");
  const [placementType, setPlacementType] = useState("On Campus");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);
  const [rawText, setRawText] = useState("");

  // -----------------------------
  // FIXED handleGetInsights()
  // -----------------------------
  async function handleGetInsights() {
    setError("");
    setInsights(null);
    setRawText("");

    if (!companyName.trim()) {
      setError("Please enter a company name.");
      return;
    }

    setLoading(true);

    const prompt = `Analyze the hiring process for ${companyName} for a ${placementType} role.
      Return a strict JSON object with the following structure:
      {
        "rounds": [
          { "name": "Round Name", "description": "Brief details about this round", "topics": ["Topic 1", "Topic 2"] }
        ],
        "importantTopics": [
          { "topic": "Main Topic Name", "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"] }
        ],
        "tips": ["Specific tip 1", "Specific tip 2", "Specific tip 3", "Specific tip 4", "Specific tip 5"],
        "notes": ["Important note 1", "Important note 2", "Important note 3", "Important note 4", "Important note 5"]
      }
      Ensure "tips" and "notes" have at least 5-7 items each.
      For "importantTopics", provide 3-4 main topics, each with 2-3 specific subtopics.
      Keep the response concise, accurate, and helpful for a student. 
      Do not include any markdown formatting (like json code blocks), just the raw JSON string.`;

    try {
      // 1. Fetch AI text
      const text = await fetchAIResponse(prompt);

      // 2. Remove ```json blocks
      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      setRawText(cleanedText);

      // 3. Parse JSON
      try {
        const parsedData = JSON.parse(cleanedText);

        // Validate structure
        if (!parsedData.rounds && !parsedData.tips && !parsedData.notes) {
          throw new Error("Invalid structure");
        }

        setInsights(parsedData);

      } catch (parseError) {
        console.warn("JSON Parse Error:", parseError);
        setError("Received unstructured response. Please try again.");
      }
    } catch (e) {
      console.error("AI Error:", e);
      setError("Failed to fetch insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-gray-50 text-gray-900"
      } min-h-[calc(100dvh-4rem)] w-full transition-colors duration-300`}
    >
      {/* Hero Section */}
      <section className="relative px-6 pt-12 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600">
              AI Career Mentor
            </span>
          </h1>
          <p
            className={`text-lg md:text-xl max-w-2xl mx-auto ${
              darkMode ? "text-gray-400" : "text-gray-600"
            } animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100`}
          >
            Unlock your dream job with personalized, AI-driven insights into
            hiring processes, interview rounds, and success strategies.
          </p>
        </div>
      </section>

      {/* Input Section */}
      <section className="px-6 mb-12">
        <div className="max-w-4xl mx-auto">
          <div
            className={`${
              darkMode ? "bg-[#121212] border-gray-800" : "bg-white border-gray-200"
            } rounded-2xl shadow-xl border p-6 md:p-8 transition-all duration-300 hover:shadow-2xl animate-in fade-in zoom-in duration-500 delay-200`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label
                  className={`text-sm font-semibold ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Target Company
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Infosys, TCS"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 ${
                    darkMode
                      ? "bg-[#1a1a1a] border-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label
                  className={`text-sm font-semibold ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Placement Type
                </label>
                <select
                  value={placementType}
                  onChange={(e) => setPlacementType(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200 ${
                    darkMode
                      ? "bg-[#1a1a1a] border-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      : "bg-gray-50 border-gray-300 text-gray-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  }`}
                >
                  <option>On Campus</option>
                  <option>Off Campus</option>
                  <option>Internship</option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleGetInsights}
                disabled={loading}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                  loading
                    ? "bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed opacity-70"
                    : "bg-gradient-to-r from-orange-500 to-pink-600 hover:shadow-orange-500/25"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Get Insights"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {error}

                {rawText && (
                  <details className="mt-2">
                    <summary className="cursor-pointer opacity-70 hover:opacity-100">
                      View raw response
                    </summary>
                    <pre className="mt-2 p-2 bg-black/10 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                      {rawText}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RESULTS SECTION */}
      {insights && (
        <section className="px-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Interview Rounds */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-orange-500 rounded-full" />
                <h2
                  className={`text-2xl md:text-3xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Interview Process
                </h2>
              </div>

              {insights.rounds && insights.rounds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {insights.rounds.map((round, idx) => (
                    <div
                      key={idx}
                      className={`group relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                        darkMode
                          ? "bg-[#121212] border-gray-800 hover:border-orange-500/30"
                          : "bg-white border-gray-200 hover:border-orange-200"
                      }`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-6xl font-black text-orange-500">
                          {idx + 1}
                        </span>
                      </div>

                      <h3
                        className={`text-xl font-bold mb-3 ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {round.name}
                      </h3>

                      <p
                        className={`text-sm mb-4 leading-relaxed ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {round.description}
                      </p>

                      {round.topics && round.topics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {round.topics.map((topic, tIdx) => (
                            <span
                              key={tIdx}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                darkMode
                                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  : "bg-orange-50 text-orange-700 border border-orange-100"
                              }`}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No specific interview rounds found.
                </p>
              )}
            </div>

            {/* Important Topics Section */}
            {insights.importantTopics && insights.importantTopics.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-pink-500 rounded-full" />
                  <h2
                    className={`text-2xl md:text-3xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Important Topics
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {insights.importantTopics.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
                        darkMode
                          ? "bg-[#121212] border-gray-800 hover:border-pink-500/30"
                          : "bg-white border-gray-200 hover:border-pink-200"
                      }`}
                    >
                      <h3
                        className={`text-lg font-bold mb-3 ${
                          darkMode ? "text-pink-400" : "text-pink-600"
                        }`}
                      >
                        {item.topic}
                      </h3>
                      {item.subtopics && item.subtopics.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {item.subtopics.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                darkMode
                                  ? "bg-pink-500/10 text-pink-300 border border-pink-500/20"
                                  : "bg-pink-50 text-pink-700 border border-pink-100"
                              }`}
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-green-500 rounded-full" />
                <h2
                  className={`text-2xl md:text-3xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Tips to Succeed
                </h2>
              </div>

              <div
                className={`p-8 rounded-2xl border ${
                  darkMode
                    ? "bg-gradient-to-br from-[#121212] to-[#0a0a0a] border-gray-800"
                    : "bg-gradient-to-br from-white to-gray-50 border-gray-200"
                }`}
              >
                {insights.tips && insights.tips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {insights.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-4">
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            darkMode
                              ? "bg-green-500/20 text-green-400"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <p
                          className={`text-base leading-relaxed ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    No specific tips found.
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            {insights.notes && insights.notes.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-purple-500 rounded-full" />
                  <h2
                    className={`text-2xl md:text-3xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Additional Notes
                  </h2>
                </div>

                <div
                  className={`rounded-2xl p-6 md:p-8 border ${
                    darkMode
                      ? "bg-purple-500/5 border-purple-500/20"
                      : "bg-purple-50 border-purple-100"
                  }`}
                >
                  <div className="space-y-4">
                    {insights.notes.map((note, idx) => (
                      <div key={idx} className="flex gap-4">
                        <span className="text-2xl">💡</span>
                        <p
                          className={`text-base leading-relaxed ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default AiCareerMentor;
