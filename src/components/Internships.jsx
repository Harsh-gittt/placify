import React from 'react'
import Navbar from './Navbar'
import { useTheme } from '../context/ThemeContext'

function Internships() {
  const { darkMode } = useTheme();
  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} w-screen min-h-screen`}>
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
