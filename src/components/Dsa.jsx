import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchDSAQuestions } from "../lib/puterClient";
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
  const toCleanArray = (set) =>
    Array.from(set)
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  lsSet(FLAGS_KEY(company), {
    completed: toCleanArray(completed),
    bookmarked: toCleanArray(bookmarked),
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

const DEFAULT_COMPANY = COMPANIES[0] || "";

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
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  );
}

function BookmarkIcon({ filled, ...props }) {
  return filled ? (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M6 2h12a2 2 0 0 1 2 2v18l-8-4-8 4V4a2 2 0 0 1 2-2Z" />
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M19 21 12 17 5 21V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function NoteIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function Dsa() {
  const { darkMode } = useTheme();
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const stored = lsGet("selectedCompany", DEFAULT_COMPANY);
    return COMPANIES.includes(stored) ? stored : DEFAULT_COMPANY;
  });

  const [companyFilter, setCompanyFilter] = useState("");
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // all | bookmarked | completed | incomplete
  const [mobileOpen, setMobileOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [cached, setCached] = useState(false);
  const [dataSource, setDataSource] = useState("");
  const requestIdRef = useRef(0);

  const getLegacyKey = (q) => (q?.title || "").trim();
  const getQuestionKey = (q) => {
    if (!q) return "";
    if (q.id && typeof q.id === "string") return q.id;
    const title = getLegacyKey(q);
    const topic = (q?.topic || "General").trim();
    const company = (q?.company || selectedCompany || "global").trim();
    return `${company}|${topic}|${title}`;
  };
  const hasFlag = (set, q) => {
    if (!(set instanceof Set)) return false;
    const key = getQuestionKey(q);
    const legacy = getLegacyKey(q);
    return (key && set.has(key)) || (legacy && set.has(legacy));
  };
  const toggleFlag = (prevSet, q) => {
    const next = new Set(prevSet instanceof Set ? prevSet : []);
    const key = getQuestionKey(q);
    const legacy = getLegacyKey(q);
    const hasKey = key && next.has(key);
    const hasLegacy = legacy && next.has(legacy);
    if (hasKey || hasLegacy) {
      if (key) next.delete(key);
      if (legacy) next.delete(legacy);
    } else if (key) {
      next.add(key);
      if (legacy) next.delete(legacy);
    }
    return next;
  };

  // persisted flags
  const [completedTitles, setCompletedTitles] = useState(new Set());
  const [bookmarkedTitles, setBookmarkedTitles] = useState(new Set());
  const [notes, setNotes] = useState({});
  const [openTopics, setOpenTopics] = useState(new Set());

  // load flags & notes when company changes
  useEffect(() => {
    const { completed, bookmarked } = loadFlags(selectedCompany || "global");
    setCompletedTitles(completed);
    setBookmarkedTitles(bookmarked);
    setNotes(lsGet(`notes:${selectedCompany}`, {}));
    const open = new Set(lsGet(`openTopics:${selectedCompany}`, []));
    setOpenTopics(open);

    // Also try to load cached DSA if exists (but do not auto-fetch)
    const cacheKey = `dsaCache:${selectedCompany}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.ts && parsed?.items && Array.isArray(parsed.items)) {
          if (parsed.items.length === 0) {
            localStorage.removeItem(cacheKey);
            return;
          }
          const age = Date.now() - parsed.ts;
          if (age < 24 * 3600 * 1000) {
            const mapped = parsed.items.map((it, idx) => {
              const title = it.question || it.title || `Question ${idx + 1}`;
              const topic = it.topic || "General";
              const difficulty = it.difficulty || "medium";
              const links = it.links || {
                leetcode: "",
                geeksforgeeks: "",
                codingninjas: "",
              };
              const id = `${selectedCompany}|${topic}|${title}`;
              return {
                id,
                title,
                difficulty,
                topic,
                company: selectedCompany,
                links,
                url:
                  links.leetcode ||
                  links.geeksforgeeks ||
                  links.codingninjas ||
                  "",
              };
            });
            setQuestions(mapped);
            setCached(true);
            setDataSource(parsed.source || "cache");
          } else {
            setCached(false);
            setDataSource("");
          }
        }
      }
    } catch {}
  }, [selectedCompany]);

  useEffect(() => {
    // persist flags when changed
    saveFlags(selectedCompany, completedTitles, bookmarkedTitles);
    lsSet(`notes:${selectedCompany}`, notes);
    lsSet(`openTopics:${selectedCompany}`, Array.from(openTopics));
  }, [completedTitles, bookmarkedTitles, notes, openTopics, selectedCompany]);

  const topics = useMemo(() => {
    return questions.reduce((acc, q) => {
      const key = q.topic || "General";
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    }, {});
  }, [questions]);

  function toggleComplete(q) {
    setCompletedTitles((prev) => {
      const next = toggleFlag(prev, q);
      saveFlags(selectedCompany, next, bookmarkedTitles);
      return next;
    });
  }
  function toggleBookmark(q) {
    setBookmarkedTitles((prev) => {
      const next = toggleFlag(prev, q);
      saveFlags(selectedCompany, completedTitles, next);
      return next;
    });
  }
  function setNote(q, value) {
    const id = getQuestionKey(q);
    setNotes((prev) => {
      const next = { ...prev };
      if (value && value.trim()) next[id] = value;
      else delete next[id];
      lsSet(`notes:${selectedCompany}`, next);
      return next;
    });
  }
  function isVisible(q) {
    const text = `${q.title} ${q.topic} ${q.company}`.toLowerCase();
    const bySearch = text.includes(search.toLowerCase());
    if (!bySearch) return false;
    if (filterTab === "bookmarked") return hasFlag(bookmarkedTitles, q);
    if (filterTab === "completed") return hasFlag(completedTitles, q);
    if (filterTab === "incomplete") return !hasFlag(completedTitles, q);
    return true;
  }
  function topicProgress(list) {
    const total = list.length;
    const done = list.reduce(
      (acc, q) => acc + (hasFlag(completedTitles, q) ? 1 : 0),
      0
    );
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  // fetch handler invoked by user
  const fetchHandler = async (opts = { bypassCache: false }) => {
    const company = selectedCompany;
    if (!company) return;
    setFetchError("");
    setLoading(true);

    setCached(false);
    requestIdRef.current += 1;
    const reqId = requestIdRef.current;

    try {
      // Remove streaming callback from fetchDSAQuestions call
      const res = await fetchDSAQuestions(company, {
        bypassCache: opts.bypassCache,
      });
      if (reqId !== requestIdRef.current) return; // obsolete
      const rawItems = Array.isArray(res.items) ? res.items : [];
      // normalize to UI shape
      const normalized = rawItems.map((it, idx) => {
        const question =
          (it.question || it.title || "").toString().trim() ||
          `Question ${idx + 1}`;
        const topic = (it.topic || "General").toString();
        const difficulty = (it.difficulty || "medium").toString();
        const links =
          it.links && typeof it.links === "object"
            ? it.links
            : { leetcode: it.link || "", geeksforgeeks: "", codingninjas: "" };
        const primary = (
          links.leetcode ||
          links.geeksforgeeks ||
          links.codingninjas ||
          ""
        ).trim();
        return {
          id: `${company}|${topic}|${question}`,
          title: question,
          difficulty: ["easy", "medium", "hard"].includes(
            difficulty.toLowerCase()
          )
            ? difficulty.toLowerCase()
            : "medium",
          topic,
          company,
          links,
          url: primary,
        };
      });

      // set open topics default if none
      if (openTopics.size === 0 && normalized.length) {
        setOpenTopics(new Set(normalized.map((q) => q.topic)));
      }

      setQuestions(normalized);
      setCached(Boolean(res.cached));
      setDataSource(res.source || (res.cached ? "cache" : "ai"));
    } catch (err) {
      console.error("AI fetch error:", err);
      setFetchError(err.message || "Failed to get questions");
      // try to use local cache if present
      try {
        const raw = localStorage.getItem(`dsaCache:${selectedCompany}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.items) {
            const fallback = parsed.items.map((it, idx) => {
              const title = it.question || it.title || `Question ${idx + 1}`;
              const topic = it.topic || "General";
              const difficulty = it.difficulty || "medium";
              const links = it.links || {
                leetcode: "",
                geeksforgeeks: "",
                codingninjas: "",
              };
              return {
                id: `${selectedCompany}|${topic}|${title}`,
                title,
                difficulty,
                topic,
                company: selectedCompany,
                links,
                url:
                  links.leetcode ||
                  links.geeksforgeeks ||
                  links.codingninjas ||
                  "",
              };
            });
            setQuestions(fallback);
            setCached(true);
            setDataSource(parsed.source || "cache");
            setFetchError(""); // show cached silently
          }
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const handleRefetch = () => fetchHandler({ bypassCache: true });

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-gray-800"
      } w-screen h-[calc(100dvh-4rem)] overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside
          className={`lg:col-span-3 lg:sticky lg:top-20 self-start ${
            darkMode
              ? "bg-[#0a0a0a] border-gray-800"
              : "bg-white border-gray-200"
          } border rounded-2xl p-4`}
          aria-label="Companies sidebar"
        >
          <div className="flex items-center gap-2 mb-3">
            <input
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              placeholder="Search companies"
              className={`${
                darkMode
                  ? "bg-[#121212] border-gray-800 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              } w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400`}
            />
            <button
              className="lg:hidden px-3 py-2 rounded-xl border"
              aria-label="Close drawer"
              onClick={() => setMobileOpen(false)}
            >
              ✖
            </button>
          </div>
          <ul className="space-y-1">
            {COMPANIES.filter((c) =>
              c.toLowerCase().includes(companyFilter.toLowerCase())
            ).map((c) => {
              const active = c === selectedCompany;
              return (
                <li key={c}>
                  <button
                    onClick={() => setSelectedCompany(c)}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                      active
                        ? "bg-orange-400 text-white"
                        : darkMode
                        ? "hover:bg-[#121212]"
                        : "hover:bg-gray-50"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
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
              {selectedCompany && (
                <p className="text-sm opacity-70 flex items-center gap-2">
                  <span>{selectedCompany}</span>
                  {cached && <span>• cached</span>}
                  {dataSource && <span>• {dataSource}</span>}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2">
                <label htmlFor="company-select" className="text-sm opacity-70">
                  Company
                </label>
                <select
                  id="company-select"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className={`${
                    darkMode
                      ? "bg-[#121212] border-gray-800 text-white"
                      : "bg-white border-gray-200 text-gray-900"
                  } px-3 py-2 rounded-xl border outline-none focus:border-orange-400 transition-colors`}
                >
                  {COMPANIES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fetchHandler({ bypassCache: false })}
                  className="ml-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md px-4 py-2 text-sm font-semibold"
                >
                  Fetch Latest Questions
                </button>
                {questions.length > 0 && (
                  <button
                    onClick={handleRefetch}
                    className="ml-2 bg-orange-400/80 hover:bg-orange-600 text-white rounded-md px-3 py-2 text-sm font-semibold"
                  >
                    Refetch Latest
                  </button>
                )}
              </div>
              <button
                className="lg:hidden px-3 py-2 rounded-xl border"
                onClick={() => setMobileOpen(true)}
                aria-label="Open companies"
              >
                Companies ▸
              </button>
            </div>
          </div>
          <div className="sm:hidden mb-3">
            <label
              htmlFor="company-select-mobile"
              className="text-sm opacity-70 block mb-1"
            >
              Company
            </label>
            <select
              id="company-select-mobile"
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className={`${
                darkMode
                  ? "bg-[#121212] border-gray-800 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              } w-full px-3 py-2 rounded-xl border outline-none focus:border-orange-400 transition-colors`}
            >
              {COMPANIES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div
            className={`rounded-2xl border ${
              darkMode
                ? "border-gray-800 bg-[#0a0a0a]"
                : "border-gray-200 bg-white"
            } p-3 sm:p-4 mb-3`}
          >
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions…"
                className={`${
                  darkMode
                    ? "bg-[#121212] border-gray-800 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } flex-1 px-3 py-2 rounded-xl border outline-none focus:border-orange-400`}
              />
              <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                {["all", "bookmarked", "completed", "incomplete"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterTab(t)}
                    className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${
                      filterTab === t
                        ? "bg-orange-400 text-white border-orange-400"
                        : darkMode
                        ? "border-gray-800 hover:bg-[#121212]"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {t === "all"
                      ? "All Questions"
                      : t === "bookmarked"
                      ? "Bookmarked"
                      : t === "completed"
                      ? "Completed"
                      : "Incomplete"}
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
              <div
                className={`rounded-2xl border ${
                  darkMode
                    ? "border-gray-800 bg-[#0a0a0a]"
                    : "border-gray-200 bg-white"
                } p-6 text-center space-y-3`}
              >
                <p className="text-base font-semibold text-red-400">
                  {fetchError}
                </p>
                <p className="text-sm opacity-70">
                  Unable to fetch questions right now. Please try again or use
                  cached data if available.
                </p>
                <button
                  onClick={() => fetchHandler({ bypassCache: true })}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-400 text-orange-400 hover:bg-orange-400 hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {!loading && !fetchError && (
              <>
                {Object.keys(topics).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm opacity-70">
                    No questions available. Pick a company and press "Fetch
                    Latest Questions" to get started.
                  </div>
                ) : (
                  <div className="space-y-3 transition-opacity duration-500 ease-out">
                    {Object.entries(topics).map(([topic, list]) => {
                      const { done, total, pct } = topicProgress(list);
                      const open = openTopics.has(topic);
                      const visibleList = list.filter(isVisible);
                      return (
                        <section
                          key={topic}
                          className={`rounded-2xl border ${
                            darkMode
                              ? "border-gray-800 bg-[#0a0a0a]"
                              : "border-gray-200 bg-white"
                          } transition duration-300 ease-out`}
                        >
                          <button
                            className="w-full px-4 py-3 flex items-center justify-between"
                            aria-expanded={open}
                            onClick={() => {
                              const next = new Set(openTopics);
                              if (open) next.delete(topic);
                              else next.add(topic);
                              setOpenTopics(next);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-semibold">{topic}</span>
                              <span className="text-sm opacity-70">
                                {done}/{total}
                              </span>
                            </div>
                            <span className="opacity-70">
                              {open ? "▾" : "▸"}
                            </span>
                          </button>
                          <div className="h-1 mx-4 mb-2 rounded-full bg-orange-400/20">
                            <div
                              className="h-full rounded-full bg-orange-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {open && (
                            <ul className="px-2 pb-3 divide-y divide-gray-200/10">
                              {visibleList.map((q) => {
                                const key = getQuestionKey(q);
                                const isDone = hasFlag(completedTitles, q);
                                const isSaved = hasFlag(bookmarkedTitles, q);
                                const note = notes[key] || "";
                                const practiceLinks = q.links || {};
                                const linkOptions = [
                                  {
                                    key: "leetcode",
                                    label: "LeetCode",
                                    href: practiceLinks.leetcode,
                                  },
                                  {
                                    key: "geeksforgeeks",
                                    label: "GeeksforGeeks",
                                    href: practiceLinks.geeksforgeeks,
                                  },
                                  {
                                    key: "codingninjas",
                                    label: "Coding Ninjas",
                                    href: practiceLinks.codingninjas,
                                  },
                                ].filter(
                                  ({ href }) =>
                                    typeof href === "string" && href.trim()
                                );

                                const hasLink = !!q.url;
                                return (
                                  <li
                                    key={q.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-2 py-3 transition-opacity duration-500"
                                  >
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isDone}
                                        onChange={() => toggleComplete(q)}
                                        aria-label="Mark completed"
                                        className="accent-orange-400 w-4 h-4"
                                      />
                                    </label>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span
                                          className={`font-medium ${
                                            isDone
                                              ? "line-through opacity-70"
                                              : ""
                                          }`}
                                        >
                                          {q.title}
                                        </span>
                                        <DifficultyChip level={q.difficulty} />
                                      </div>
                                      {linkOptions.length > 0 && (
                                        <div className="flex items-center flex-wrap gap-2 mt-1 text-sm">
                                          <span className="text-xs uppercase tracking-wide text-orange-400">
                                            Practice:
                                          </span>
                                          {linkOptions.map(
                                            ({ key, label, href }) => (
                                              <a
                                                key={key}
                                                href={href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-orange-400 hover:underline text-sm mx-2"
                                              >
                                                {label}
                                              </a>
                                            )
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <a
                                        href={hasLink ? q.url : "#"}
                                        target={hasLink ? "_blank" : undefined}
                                        rel={hasLink ? "noreferrer" : undefined}
                                        className={`px-2.5 py-1.5 rounded-xl border ${
                                          hasLink
                                            ? "hover:bg-orange-400/10"
                                            : "opacity-40 pointer-events-none"
                                        }`}
                                        aria-label="Open question"
                                        title={
                                          hasLink
                                            ? "Open question"
                                            : "Link not available"
                                        }
                                      >
                                        <ExternalLinkIcon />
                                      </a>
                                      <button
                                        onClick={() => toggleBookmark(q)}
                                        className={`px-2.5 py-1.5 rounded-xl border ${
                                          isSaved
                                            ? "bg-orange-400 text-white border-orange-400"
                                            : "hover:bg-orange-400/10"
                                        }`}
                                        aria-label={
                                          isSaved
                                            ? "Remove bookmark"
                                            : "Add bookmark"
                                        }
                                        title={
                                          isSaved
                                            ? "Remove bookmark"
                                            : "Add bookmark"
                                        }
                                      >
                                        <BookmarkIcon filled={isSaved} />
                                      </button>
                                      <details className="relative">
                                        <summary
                                          className="list-none px-2.5 py-1.5 rounded-xl border hover:bg-orange-400/10 cursor-pointer select-none"
                                          aria-label="Add note"
                                          title="Add note"
                                        >
                                          <NoteIcon />
                                        </summary>
                                        <div
                                          className={`absolute right-0 mt-2 w-64 p-3 rounded-xl border ${
                                            darkMode
                                              ? "bg-[#0a0a0a] border-gray-800"
                                              : "bg-white border-gray-200"
                                          } shadow-xl z-10`}
                                        >
                                          <textarea
                                            value={note}
                                            onChange={(e) =>
                                              setNote(q, e.target.value)
                                            }
                                            placeholder="Add a short note…"
                                            className={`${
                                              darkMode
                                                ? "bg-[#121212] border-gray-800 text-white"
                                                : "bg-white border-gray-200 text-gray-900"
                                            } w-full p-2 text-sm rounded-lg border outline-none focus:border-orange-400`}
                                            rows={3}
                                          />
                                        </div>
                                      </details>
                                    </div>
                                  </li>
                                );
                              })}
                              {visibleList.length === 0 && (
                                <li className="px-2 py-4 text-sm opacity-60">
                                  No questions match the current filters.
                                </li>
                              )}
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

      {/* mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className={`absolute top-0 left-0 h-full w-80 p-4 border ${
              darkMode ? "bg-black border-gray-800" : "bg-white border-gray-200"
            }`}
            onKeyDown={(e) => {}}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Companies</h2>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close drawer"
              >
                ✖
              </button>
            </div>
            <div className="mb-3">
              <input
                autoFocus
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                placeholder="Search companies"
                className={`${
                  darkMode
                    ? "bg-[#121212] border-gray-800 text-white"
                    : "bg-white border-gray-200 text-gray-900"
                } w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400`}
              />
            </div>
            <ul className="space-y-1 overflow-y-auto h-[calc(100%-6rem)] pr-2">
              {COMPANIES.filter((c) =>
                c.toLowerCase().includes(companyFilter.toLowerCase())
              ).map((c) => {
                const active = c === selectedCompany;
                return (
                  <li key={c}>
                    <button
                      onClick={() => {
                        setSelectedCompany(c);
                        setMobileOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                        active
                          ? "bg-orange-400 text-white"
                          : darkMode
                          ? "hover:bg-[#121212]"
                          : "hover:bg-gray-50"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {c}
                    </button>
                  </li>
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
