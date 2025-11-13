import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchAIResponse } from "../lib/puterClient";
import { useTheme } from "../context/ThemeContext";

// LocalStorage helpers with prefix
const LS_PREFIX = "dsaTracker:";
const lsGet = (key, fallback) => {
  try {
    const v = localStorage.getItem(LS_PREFIX + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const lsSet = (key, value) => {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {}
};

const FLAGS_KEY = (company) => `flags:${company}`;
const loadFlags = (company) => {
  const stored = lsGet(FLAGS_KEY(company), null);
  if (stored && typeof stored === "object") {
    const toArray = (arr) => (Array.isArray(arr) ? arr : []);
    return {
      completed: new Set(toArray(stored.completed)),
      bookmarked: new Set(toArray(stored.bookmarked)),
    };
  }
  return { completed: new Set(), bookmarked: new Set() };
};
const saveFlags = (company, completed, bookmarked) => {
  lsSet(FLAGS_KEY(company), {
    completed: Array.from(completed),
    bookmarked: Array.from(bookmarked),
  });
};

const COMPANIES = [
  "Infosys",
  "TCS",
  "Accenture",
  "Wipro",
  "Capgemini",
  "Cognizant",
  "HCLTech",
  "Tech Mahindra",
  "IBM",
  "Microsoft",
];

const extractAiText = (response) => {
  if (!response) return "";
  if (typeof response === "string") return response;
  if (typeof response.message === "string") return response.message;
  if (response?.message?.content) return response.message.content;
  if (Array.isArray(response?.messages) && response.messages.length) {
    const last = response.messages[response.messages.length - 1];
    if (typeof last === "string") return last;
    if (typeof last?.content === "string") return last.content;
  }
  if (Array.isArray(response?.choices) && response.choices.length) {
    const choice = response.choices[0];
    if (typeof choice === "string") return choice;
    if (typeof choice?.message?.content === "string") {
      return choice.message.content;
    }
  }
  if (typeof response?.text === "string") return response.text;
  if (typeof response?.response?.text === "function") {
    try {
      const text = response.response.text();
      if (typeof text === "string") return text;
    } catch (err) {}
  }
  if (typeof response?.response?.text === "string") {
    return response.response.text;
  }
  if (typeof response?.content === "string") return response.content;
  // fallback to JSON representation
  try {
    return JSON.stringify(response);
  } catch {
    return String(response);
  }
};

const stripMarkdownFences = (text) => {
  let cleaned = text ? text.trim() : "";
  if (cleaned.startsWith("````")) {
    const endIndex = cleaned.lastIndexOf("````");
    if (endIndex > 4) {
      cleaned = cleaned.slice(cleaned.indexOf("\n") + 1, endIndex).trim();
    }
  } else if (cleaned.startsWith("```")) {
    const endIndex = cleaned.lastIndexOf("```");
    if (endIndex > 3) {
      cleaned = cleaned.slice(cleaned.indexOf("\n") + 1, endIndex).trim();
    }
  }
  return cleaned;
};

const parseQuestionPayload = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("No text to parse");
  }
  let cleaned = stripMarkdownFences(rawText.replace(/```json/gi, "````"));

  // try to find a JSON array or object in the text
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const slice = cleaned.slice(firstBracket, lastBracket + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      // continue to other attempts
    }
  }

  // try to parse as plain JSON object with "questions"
  try {
    const maybeObj = JSON.parse(cleaned);
    if (Array.isArray(maybeObj)) return maybeObj;
    if (Array.isArray(maybeObj?.questions)) return maybeObj.questions;
  } catch (err) {
    // ignore
  }

  // fallback: attempt to extract lines as questions (title|difficulty|link) separated by newline
  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];
  lines.forEach((line) => {
    // if line looks like "1. Title - (easy) - link"
    const idxTitle = line.replace(/^\d+\.\s*/, "");
    const parts = idxTitle.split(/\s*[-|—|–]\s*/); // split by hyphen/dash
    const title = parts[0] || idxTitle;
    let difficulty = "medium";
    let link = "";
    // try to find "(easy|medium|hard)" inside
    const diffMatch = title.match(/\b(easy|medium|hard)\b/i) || (parts[1] && parts[1].match(/\b(easy|medium|hard)\b/i));
    if (diffMatch) difficulty = diffMatch[1].toLowerCase();
    // attempt to find url
    const urlMatch = line.match(/https?:\/\/[^\s)]+/i);
    if (urlMatch) link = urlMatch[0];
    items.push({ title: title.replace(/\(easy|medium|hard\)/ig, "").trim(), difficulty, link });
  });
  if (items.length) return items;

  throw new Error("Unable to parse questions from AI response");
};

const normalizeAiQuestions = (items, company) =>
  items
    .filter((item) => item && (item.title || item.question))
    .slice(0, 40)
    .map((item, index) => {
      const questionText = (item.title || item.question || "").trim();
      const difficultyRaw =
        typeof item.difficulty === "string"
          ? item.difficulty.trim().toLowerCase()
          : "medium";
      const difficulty = ["easy", "medium", "hard"].includes(difficultyRaw)
        ? difficultyRaw
        : "medium";
      const topic =
        typeof item.topic === "string" && item.topic.trim().length > 0
          ? item.topic.trim()
          : "General";
      const links =
        item && typeof item.links === "object" && item.links !== null
          ? {
              leetcode:
                typeof item.links.leetcode === "string"
                  ? item.links.leetcode.trim()
                  : item.links.leetcode || "",
              geeksforgeeks:
                typeof item.links.geeksforgeeks === "string"
                  ? item.links.geeksforgeeks.trim()
                  : item.links.geeksforgeeks || "",
              codingninjas:
                typeof item.links.codingninjas === "string"
                  ? item.links.codingninjas.trim()
                  : item.links.codingninjas || "",
            }
          : {
              leetcode: typeof item.link === "string" ? item.link : "",
              geeksforgeeks: "",
              codingninjas: "",
            };
      const primaryLink = links.leetcode || links.geeksforgeeks || links.codingninjas || "";
      return {
        id: `${company}|${topic}|${questionText || index}`,
        title: questionText || `Question ${index + 1}`,
        difficulty,
        topic,
        company,
        links,
        url: primaryLink,
      };
    });

const isUnauthorizedError = (error) => {
  if (!error) return false;
  const status = error.status || error?.response?.status;
  if (status === 401) return true;
  const message = typeof error.message === "string" ? error.message : "";
  return message.includes("401") || message.toLowerCase().includes("unauthorized");
};

function usePersistentState(companyKey) {
  const [completedTitles, setCompletedTitles] = useState(new Set());
  const [bookmarkedTitles, setBookmarkedTitles] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [openTopics, setOpenTopicsState] = useState(new Set());

  useEffect(() => {
    const { completed, bookmarked } = loadFlags(companyKey);
    setCompletedTitles(completed);
    setBookmarkedTitles(bookmarked);
    setNotes(lsGet(`notes:${companyKey}`, {}));
    setOpenTopicsState(new Set(lsGet(`openTopics:${companyKey}`, [])));
  }, [companyKey]);

  useEffect(() => {
    saveFlags(companyKey, completedTitles, bookmarkedTitles);
  }, [companyKey, completedTitles, bookmarkedTitles]);

  useEffect(() => {
    lsSet(`notes:${companyKey}`, notes);
  }, [companyKey, notes]);
  useEffect(() => {
    lsSet(`openTopics:${companyKey}`, Array.from(openTopics));
  }, [companyKey, openTopics]);

  const setOpenTopics = (next) => setOpenTopicsState(new Set(next));
  const persistFlagsNow = () =>
    saveFlags(companyKey, completedTitles, bookmarkedTitles);

  return {
    completedTitles,
    setCompletedTitles,
    bookmarkedTitles,
    setBookmarkedTitles,
    notes,
    setNotes,
    openTopics,
    setOpenTopics,
    persistFlagsNow,
  };
}

function DifficultyChip({ level }) {
  const normalized = (level || "medium").toLowerCase();
  const base = "px-2 py-0.5 text-xs rounded-full border";
  const styles =
    normalized === "easy"
      ? "border-emerald-400 text-emerald-400 bg-emerald-400/10"
      : normalized === "hard"
      ? "border-rose-400 text-rose-400 bg-rose-400/10"
      : "border-amber-400 text-amber-400 bg-amber-400/10";
  return <span className={`${base} ${styles}`}>{normalized}</span>;
}

function ExternalLinkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

function BookmarkIcon({ filled, ...props }) {
  return filled ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M19 21 12 17 5 21V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function NoteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function Dsa() {
  const { darkMode } = useTheme();
  const companyNames = COMPANIES;
  const defaultCompany = companyNames[0] || "";

  const [selectedCompany, setSelectedCompany] = useState(() => {
    const stored = lsGet("selectedCompany", defaultCompany);
    return companyNames.includes(stored) ? stored : defaultCompany;
  });
  const [fetchNonce, setFetchNonce] = useState(0);
  useEffect(() => {
    if (selectedCompany) lsSet("selectedCompany", selectedCompany);
  }, [selectedCompany]);

  const [companyFilter, setCompanyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // all | bookmarked | completed | incomplete
  const [mobileOpen, setMobileOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const requestIdRef = useRef(0);

  // Persisted per-company state
  const state = usePersistentState(selectedCompany || "global");

  const handleCompanyChange = (company) => {
    if (!company || company === selectedCompany) return;
    state.persistFlagsNow?.();
    setSelectedCompany(company);
  };

  const fetchCompanyQuestions = async (company) => {
    if (!company) return;

    setLoading(true);
    setFetchError("");
    setQuestions([]);

    const prompt = `Generate 25 to 30 recent DSA interview questions typically asked at ${company} in 2024-2025. 
Return a single JSON array of objects, each object with fields:
{
  "title": "problem title",
  "difficulty": "easy|medium|hard",
  "topic": "arrays|strings|linkedlist|... (or General)",
  "links": { "leetcode": "...", "geeksforgeeks": "...", "codingninjas": "..." }
}
If you cannot return exact company-specific questions, return a representative set of commonly asked questions. Output only the JSON array or plain array text (no extra commentary).`;

    try {
      const result = await fetchAIResponse(prompt);
      const text = extractAiText(result) || "";

      // Try to parse strong JSON first
      let parsed = [];
      try {
        parsed = parseQuestionPayload(text);
      } catch (parseErr) {
        // fallback: try line splitting
        try {
          const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          parsed = lines.map((l) => {
            return { title: l.replace(/^\d+\.\s*/, ""), difficulty: "medium", link: "" };
          });
        } catch {
          parsed = [];
        }
      }

      if (!parsed || parsed.length === 0) throw new Error("No questions returned");

      const normalized = normalizeAiQuestions(parsed, company);

      setQuestions(normalized);
      if (state.openTopics.size === 0 && normalized.length) {
        const initialTopics = new Set(normalized.map((q) => q.topic));
        state.setOpenTopics(initialTopics);
      }

      console.log(`✅ Loaded ${normalized.length} questions for ${company}.`);
    } catch (err) {
      console.error("AI fetch error:", err);
      const message = err?.message || String(err);
      if (message.includes("403") || message.includes("401")) {
        setFetchError(
          "AI provider blocked or requires auth. Ask admin to configure API_KEY or enable Puter access."
        );
      } else {
        setFetchError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyQuestions(selectedCompany);
    }
    return () => {
      requestIdRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, fetchNonce]);

  const topics = useMemo(() => {
    return questions.reduce((acc, q) => {
      const key = q.topic || "General";
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    }, {});
  }, [questions]);

  const handleRetry = () => {
    setFetchNonce((n) => n + 1);
  };

  const handleRefresh = () => {
    if (selectedCompany) {
      fetchCompanyQuestions(selectedCompany);
    }
  };

  // ESC closes mobile drawer
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function getId(q) {
    return q.id || `${q.company}|${q.topic}|${q.title}`;
  }
  function getTitleKey(q) {
    return q.title || "";
  }

  function toggleComplete(q) {
    const titleKey = getTitleKey(q);
    state.setCompletedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(titleKey)) {
        next.delete(titleKey);
      } else {
        next.add(titleKey);
      }
      return next;
    });
  }
  function toggleBookmark(q) {
    const titleKey = getTitleKey(q);
    state.setBookmarkedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(titleKey)) {
        next.delete(titleKey);
      } else {
        next.add(titleKey);
      }
      return next;
    });
  }

  function setNote(q, value) {
    const id = getId(q);
    state.setNotes((prev) => {
      const next = { ...prev };
      if (value && value.trim()) {
        next[id] = value;
      } else {
        delete next[id];
      }
      return next;
    });
  }

  function isVisible(q) {
    const titleKey = getTitleKey(q);
    const text = `${q.title} ${q.topic} ${q.company}`.toLowerCase();
    const bySearch = text.includes(search.toLowerCase());
    if (!bySearch) return false;
    if (filterTab === "bookmarked") return state.bookmarkedTitles.has(titleKey);
    if (filterTab === "completed") return state.completedTitles.has(titleKey);
    if (filterTab === "incomplete") return !state.completedTitles.has(titleKey);
    return true;
  }

  function topicProgress(list) {
    const total = list.length;
    const done = list.reduce(
      (acc, q) => acc + (state.completedTitles.has(getTitleKey(q)) ? 1 : 0),
      0
    );
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  return (
    <div className={`${darkMode ? "bg-black text-white" : "bg-white text-gray-800"} w-screen h-[calc(100dvh-4rem)] overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar / Drawer */}
        <aside className={`lg:col-span-3 lg:sticky lg:top-20 self-start ${darkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"} border rounded-2xl p-4`} aria-label="Companies sidebar">
          <div className="flex items-center gap-2 mb-3">
            <input value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} placeholder="Search companies" className={`${darkMode ? "bg-[#121212] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"} w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400`} />
            <button className="lg:hidden px-3 py-2 rounded-xl border" aria-label="Close drawer" onClick={() => setMobileOpen(false)}>
              ✖
            </button>
          </div>
          <ul className="space-y-1">
            {companyNames.filter((c) => c.toLowerCase().includes(companyFilter.toLowerCase())).map((c) => {
              const active = c === selectedCompany;
              return (
                <li key={c}>
                  <button onClick={() => { handleCompanyChange(c); setMobileOpen(false); }} className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${active ? "bg-orange-400 text-white" : darkMode ? "hover:bg-[#121212]" : "hover:bg-gray-50"}`} aria-current={active ? "page" : undefined}>
                    {c}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main */}
        <main className="lg:col-span-9 h-full min-h-0 flex flex-col pb-6">
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold">DSA Tracker</h1>
              {selectedCompany && <p className="text-sm opacity-70">{selectedCompany}</p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <label htmlFor="company-select" className="text-sm opacity-70">Company</label>
                <select id="company-select" value={selectedCompany} onChange={(e) => handleCompanyChange(e.target.value)} className={`${darkMode ? "bg-[#121212] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"} px-3 py-2 rounded-xl border outline-none focus:border-orange-400 transition-colors`}>
                  {companyNames.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              {selectedCompany && !loading && (
                <button onClick={handleRefresh} className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Refresh questions">
                  Refresh Questions
                </button>
              )}
              <button className="lg:hidden px-3 py-2 rounded-xl border" onClick={() => setMobileOpen(true)} aria-label="Open company drawer">
                Companies ▸
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border ${darkMode ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-white"} p-3 sm:p-4 mb-3`}>
            <div className="flex items-center gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions…" className={`${darkMode ? "bg-[#121212] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"} flex-1 px-3 py-2 rounded-xl border outline-none focus:border-orange-400`} />
              <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                {["all", "bookmarked", "completed", "incomplete"].map((t) => (
                  <button key={t} onClick={() => setFilterTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${filterTab === t ? "bg-orange-400 text-white border-orange-400" : darkMode ? "border-gray-800 hover:bg-[#121212]" : "border-gray-200 hover:bg-gray-50"}`}>
                    {t === "all" ? "All Questions" : t === "bookmarked" ? "Bookmarked" : t === "completed" ? "Completed" : "Incomplete"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-4">
            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="text-lg font-semibold animate-pulse text-orange-500">{`Fetching latest interview questions for ${selectedCompany}…`}</div>
                  <div className="w-12 h-12 rounded-full border-4 border-orange-400 border-t-transparent animate-spin" />
                </div>
              </div>
            )}
            {!loading && fetchError && (
              <div className={`rounded-2xl border ${darkMode ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-white"} p-6 text-center space-y-3`}>
                <p className="text-base font-semibold text-red-400">{fetchError}</p>
                <p className="text-sm opacity-70">Unable to fetch questions right now. Please try again.</p>
                <button onClick={handleRetry} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white transition-colors">Retry</button>
              </div>
            )}
            {!loading && !fetchError && (
              <>
                {Object.keys(topics).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm opacity-70">No questions available. Pick a company to get started.</div>
                ) : (
                  <div className="space-y-3 transition-opacity duration-500 ease-out">
                    {Object.entries(topics).map(([topic, list]) => {
                      const { done, total, pct } = topicProgress(list);
                      const open = state.openTopics.has(topic);
                      const visibleList = list.filter(isVisible);
                      return (
                        <section key={topic} className={`rounded-2xl border ${darkMode ? "border-gray-800 bg-[#0a0a0a]" : "border-gray-200 bg-white"} transition duration-300 ease-out`}>
                          <button className="w-full px-4 py-3 flex items-center justify-between" aria-expanded={open} onClick={() => {
                            const next = new Set(state.openTopics);
                            if (open) next.delete(topic);
                            else next.add(topic);
                            state.setOpenTopics(next);
                          }}>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{topic}</span>
                              <span className="text-sm opacity-70">{done}/{total}</span>
                            </div>
                            <span className="opacity-70">{open ? "▾" : "▸"}</span>
                          </button>
                          <div className="h-1 mx-4 mb-2 rounded-full bg-orange-400/20">
                            <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          {open && (
                            <ul className="px-2 pb-3 divide-y divide-gray-200/10">
                              {visibleList.map((q) => {
                                const id = getId(q);
                                const titleKey = getTitleKey(q);
                                const isDone = state.completedTitles.has(titleKey);
                                const isSaved = state.bookmarkedTitles.has(titleKey);
                                const note = state.notes[id] || "";
                                const practiceLinks = q.links || {};
                                const linkOptions = [
                                  { key: "leetcode", label: "LeetCode", href: practiceLinks.leetcode },
                                  { key: "geeksforgeeks", label: "GeeksforGeeks", href: practiceLinks.geeksforgeeks },
                                  { key: "codingninjas", label: "Coding Ninjas", href: practiceLinks.codingninjas },
                                ].filter(({ href }) => typeof href === "string" && href.trim());
                                const hasLink = !!q.url;
                                return (
                                  <li key={id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-2 py-3 transition-opacity duration-500">
                                    <label className="flex items-center gap-2">
                                      <input type="checkbox" checked={isDone} onChange={() => toggleComplete(q)} aria-label="Mark completed" className="accent-orange-400 w-4 h-4" />
                                    </label>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`font-medium ${isDone ? "line-through opacity-70" : ""}`}>{q.title}</span>
                                        <DifficultyChip level={q.difficulty} />
                                      </div>
                                      {linkOptions.length > 0 && (
                                        <div className="flex items-center flex-wrap gap-2 mt-1 text-sm">
                                          <span className="text-xs uppercase tracking-wide text-orange-400">Practice:</span>
                                          {linkOptions.map(({ key, label, href }) => (
                                            <a key={key} href={href} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline text-sm mx-2">{label}</a>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <a href={hasLink ? q.url : "#"} target={hasLink ? "_blank" : undefined} rel={hasLink ? "noreferrer" : undefined} className={`px-2.5 py-1.5 rounded-xl border ${hasLink ? "hover:bg-orange-400/10" : "opacity-40 pointer-events-none"}`} aria-label="Open question" title={hasLink ? "Open question" : "Link not available"}>
                                        <ExternalLinkIcon />
                                      </a>
                                      <button onClick={() => toggleBookmark(q)} className={`px-2.5 py-1.5 rounded-xl border ${isSaved ? "bg-orange-400 text-white border-orange-400" : "hover:bg-orange-400/10"}`} aria-label={isSaved ? "Remove bookmark" : "Add bookmark"} title={isSaved ? "Remove bookmark" : "Add bookmark"}>
                                        <BookmarkIcon filled={isSaved} />
                                      </button>
                                      <details className="relative">
                                        <summary className="list-none px-2.5 py-1.5 rounded-xl border hover:bg-orange-400/10 cursor-pointer select-none" aria-label="Add note" title="Add note">
                                          <NoteIcon />
                                        </summary>
                                        <div className={`absolute right-0 mt-2 w-64 p-3 rounded-xl border ${darkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-200"} shadow-xl z-10`}>
                                          <textarea value={note} onChange={(e) => setNote(q, e.target.value)} placeholder="Add a short note…" className={`${darkMode ? "bg-[#121212] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"} w-full p-2 text-sm rounded-lg border outline-none focus:border-orange-400`} rows={3} />
                                        </div>
                                      </details>
                                    </div>
                                  </li>
                                );
                              })}
                              {visibleList.length === 0 && <li className="px-2 py-4 text-sm opacity-60">No questions match the current filters.</li>}
                            </ul>
                          )}
                        </section>
                      );
                    })}
                  </div>
                )}
                <div className="h-6 flex-none" />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-80 p-4 border-r ${darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"}`} onKeyDown={(e) => {
            if (e.key !== "Tab") return;
            const container = e.currentTarget;
            const focusables = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey) {
              if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
              }
            } else {
              if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Companies</h2>
              <button onClick={() => setMobileOpen(false)} aria-label="Close drawer">✖</button>
            </div>
            <div className="mb-3">
              <input autoFocus value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} placeholder="Search companies" className={`${darkMode ? "bg-[#121212] border-gray-800 text-white" : "bg-white border-gray-200 text-gray-900"} w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400`} />
            </div>
            <ul className="space-y-1 overflow-y-auto h-[calc(100%-6rem)] pr-2">
              {companyNames.filter((c) => c.toLowerCase().includes(companyFilter.toLowerCase())).map((c) => {
                const active = c === selectedCompany;
                return (
                  <li key={c}><button onClick={() => { handleCompanyChange(c); setMobileOpen(false); }} className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${active ? "bg-orange-400 text-white" : darkMode ? "hover:bg-[#121212]" : "hover:bg-gray-50"}`} aria-current={active ? "page" : undefined}>{c}</button></li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dsa;

