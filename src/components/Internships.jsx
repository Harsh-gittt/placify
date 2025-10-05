import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./Navbar";
import { useTheme } from "../context/ThemeContext";

const ROLES = [
  "Full-stack",
  "Frontend",
  "Backend",
  "Data Analyst",
  "Machine Learning",
  "DevOps/Cloud",
  "QA",
  "UI/UX",
  "Mobile Dev",
];
const CITIES = [
  "New Delhi",
  "Delhi NCR",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
];
const WORK_TYPES = ["Remote", "On-site", "Hybrid"];

function Chip({ selected, label, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1 rounded-full border text-sm transition-colors ${
        selected
          ? "bg-[#ea7a47] text-white border-transparent"
          : "bg-transparent border-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
      }`}
      aria-pressed={selected}
    >
      {label}
    </button>
  );
}

async function saveBookmark(normalized) {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return { ok: false, reason: "no-auth" };
    const payload = { ...normalized, internshipId: normalized.id };
    const res = await fetch("http://localhost:3000/api/internships/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    return { ok: false };
  }
}

function ResultCard({ item, darkMode }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className={`group rounded-2xl border ${
        darkMode ? "border-gray-700 bg-[#0b0b0b]" : "border-gray-200 bg-white"
      } p-4 hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ea7a47]`}
      aria-label={`Open ${item.title} at ${item.company} on ${item.source}`}
    >
      <div className="flex items-start gap-4">
        {item.logo ? (
          <img
            src={item.logo}
            alt="Company logo"
            className="h-12 w-12 rounded object-contain bg-white"
          />
        ) : (
          <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
            🏢
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h3
              className={`font-semibold truncate ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {item.title}
            </h3>
            <span className="text-xs opacity-70 whitespace-nowrap">
              {item.source}
            </span>
          </div>
          <p className="text-sm opacity-90">{item.company}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs opacity-80">
            {item.remote ? (
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                Remote
              </span>
            ) : null}
            {item.location ? (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {item.location}
              </span>
            ) : null}
            {item.stipend ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                {item.stipend}
              </span>
            ) : null}
            {item.duration ? (
              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                {item.duration}
              </span>
            ) : null}
            {item.posted_at ? (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {new Date(item.posted_at).toLocaleDateString()}
              </span>
            ) : null}
          </div>
          {item.description_snippet ? (
            <p className="mt-2 text-sm line-clamp-2 opacity-80">
              {item.description_snippet}
            </p>
          ) : null}
          <div className="mt-3 flex items-center gap-3">
            <button className="inline-flex items-center gap-2 text-sm text-[#ea7a47] group-hover:underline">
              View on site →
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                saveBookmark(item);
              }}
              className={`text-sm px-3 py-1 rounded-full border ${
                darkMode
                  ? "border-gray-600 hover:bg-[#1a1a1a]"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
              aria-label="Save bookmark"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </a>
  );
}

function Internships() {
  const { darkMode } = useTheme();
  const [query, setQuery] = useState("");
  const [roleSel, setRoleSel] = useState([]);
  const [workSel, setWorkSel] = useState([]);
  const [locSel, setLocSel] = useState([]);
  const [customCity, setCustomCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [paidOnly, setPaidOnly] = useState(false);
  const [sort, setSort] = useState("recent");

  const appliedLocations = useMemo(() => {
    const all = [...locSel];
    if (customCity.trim()) all.push(customCity.trim());
    return all;
  }, [locSel, customCity]);

  async function search(p = 1) {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      roleSel.forEach((r) => params.append("roles", r));
      workSel.forEach((w) => params.append("workTypes", w));
      appliedLocations.forEach((l) => params.append("locations", l));
      params.set("page", String(p));
      params.set("pageSize", String(pageSize));
      if (remoteOnly) params.set("remoteOnly", "true");
      if (paidOnly) params.set("paidOnly", "true");
      if (sort) params.set("sort", sort);
      const res = await fetch(
        `http://localhost:3000/api/internships/search?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items || []);
      setPage(data.page || p);
    } catch (e) {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search(1);
  }, []);

  const containerBg = darkMode ? "bg-black text-white" : "bg-white text-black";

  return (
    <div className={`${containerBg} min-h-screen w-full`}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            <div className="flex-1">
              <label className="block text-sm mb-1 opacity-80">
                Search roles or keywords
              </label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. Frontend intern, React, Data Analyst"
                className={`w-full rounded-xl border px-4 py-2 ${
                  darkMode
                    ? "bg-[#0b0b0b] border-gray-700"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>
            <button
              onClick={() => search(1)}
              className="h-[42px] px-5 rounded-xl bg-[#ea7a47] text-white font-medium"
            >
              Find Internships
            </button>
          </div>

          <section
            aria-label="Filters"
            className={`rounded-2xl border ${
              darkMode
                ? "border-gray-800 bg-[#0b0b0b]"
                : "border-gray-200 bg-white"
            } p-4 sm:p-5`}
          >
            <div className="grid gap-4">
              <div>
                <div className="text-sm mb-2 opacity-80">Role / Domain</div>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <Chip
                      key={r}
                      label={r}
                      selected={roleSel.includes(r)}
                      onToggle={() =>
                        setRoleSel((s) =>
                          s.includes(r) ? s.filter((x) => x !== r) : [...s, r]
                        )
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm mb-2 opacity-80">Work Type</div>
                <div className="flex flex-wrap gap-2">
                  {WORK_TYPES.map((w) => (
                    <Chip
                      key={w}
                      label={w}
                      selected={workSel.includes(w)}
                      onToggle={() =>
                        setWorkSel((s) =>
                          s.includes(w) ? s.filter((x) => x !== w) : [...s, w]
                        )
                      }
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm mb-2 opacity-80">Location</div>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      selected={locSel.includes(c)}
                      onToggle={() =>
                        setLocSel((s) =>
                          s.includes(c) ? s.filter((x) => x !== c) : [...s, c]
                        )
                      }
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Type a custom city"
                    className={`flex-1 rounded-xl border px-4 py-2 ${
                      darkMode
                        ? "bg-[#0b0b0b] border-gray-700"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <button
                    onClick={() => {
                      if (customCity.trim())
                        setLocSel((s) =>
                          s.includes(customCity.trim())
                            ? s
                            : [...s, customCity.trim()]
                        );
                      setCustomCity("");
                    }}
                    className="px-3 py-2 rounded-xl border border-gray-400"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 items-end">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={remoteOnly}
                    onChange={(e) => setRemoteOnly(e.target.checked)}
                  />
                  <span className="text-sm">Remote only</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={paidOnly}
                    onChange={(e) => setPaidOnly(e.target.checked)}
                  />
                  <span className="text-sm">Paid only</span>
                </label>
                <div className="justify-self-start sm:justify-self-end">
                  <label className="block text-sm mb-1 opacity-80">Sort</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className={`rounded-xl border px-3 py-2 ${
                      darkMode
                        ? "bg-[#0b0b0b] border-gray-700"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="stipend-desc">Highest Stipend</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="min-h-[200px]" aria-live="polite">
            {loading ? (
              <div className="py-12 text-center opacity-80">
                Loading internships…
              </div>
            ) : error ? (
              <div className="py-12 text-center text-red-500">{error}</div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center opacity-80">
                No internships found. Try different filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((it) => (
                  <ResultCard key={it.id} item={it} darkMode={darkMode} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Internships;
