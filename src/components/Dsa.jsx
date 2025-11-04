import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import dsaRaw from '../assets/questions/DSA.json'

// LocalStorage helpers with prefix
const LS_PREFIX = 'dsaTracker:'
const lsGet = (key, fallback) => {
  try {
    const v = localStorage.getItem(LS_PREFIX + key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const lsSet = (key, value) => {
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(value)) } catch {}
}

// Parse the unconventional DSA.json file into { [company]: { topics: { [topic]: Question[] } } }
function useParsedDsa() {
  // File is an object with one gigantic key mapped to null. Extract the key text.
  const text = useMemo(() => Object.keys(dsaRaw)[0] || '', [])

  return useMemo(() => {
    const lines = text.split(/\r?\n/)
    const companies = {}

    let currentCompany = null
    let currentTopic = null

    // Company sections in the source are UPPERCASE headings like: "1. INFOSYS (SP & DSE)"
    const companyHeaderRe = /^\s*\d+\.\s*([A-Z][A-Z\s&/().'+-]*[A-Z])\s*$/
    const topicHeaderRe = /^\s*([A-Z][A-Z\s&/]+)\s*$/
    const questionStartRe = /^\s*\d+\.\s*(.+)$/
    const linkLineRe = /-\s*Link:\s*(\S+)/i
    const diffRe = /(Easy|Medium|Hard)/i

    let pendingQuestion = null

    function commitQuestion() {
      if (currentCompany && currentTopic && pendingQuestion) {
        const bucket = companies[currentCompany] ||= { topics: {} }
        const list = bucket.topics[currentTopic] ||= []
        list.push(pendingQuestion)
      }
      pendingQuestion = null
    }

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim()
      if (!raw) continue

      const companyMatch = raw.match(companyHeaderRe)
      if (companyMatch) {
        commitQuestion()
        currentCompany = companyMatch[1].trim().replace(/\s+\|.+$/, '')
        currentTopic = null
        companies[currentCompany] ||= { topics: {} }
        continue
      }

      // Alternative company formats like "10. AMAZON" or headers containing 'Format:' on next lines
      if (/^\d+\./.test(raw) && /^[A-Z0-9 .()'&/+_-]+$/.test(raw)) {
        const name = raw.replace(/^\d+\./, '').trim()
        if (name && name.toUpperCase() === name) {
          commitQuestion()
          currentCompany = name
          currentTopic = null
          companies[currentCompany] ||= { topics: {} }
          continue
        }
      }

      // Topic headers are full caps like ARRAYS, STRINGS, etc
      const topicMatch = raw.match(topicHeaderRe)
      if (topicMatch && topicMatch[1].length <= 30) {
        commitQuestion()
        currentTopic = topicMatch[1].trim()
        companies[currentCompany] ||= { topics: {} }
        companies[currentCompany].topics[currentTopic] ||= []
        continue
      }

      // Question title line
      const qMatch = raw.match(questionStartRe)
      if (qMatch && currentCompany) {
        commitQuestion()
        const titleWithMeta = qMatch[1].trim()
        const diff = (titleWithMeta.match(diffRe)?.[1] || '').toLowerCase()
        const title = titleWithMeta.replace(/\((Easy|Medium|Hard).*?\)/ig, '').trim()
        pendingQuestion = { title, difficulty: diff || 'medium', url: '', topic: currentTopic, company: currentCompany }
        continue
      }

      // Link line following a question
      const linkMatch = raw.match(linkLineRe)
      if (linkMatch && pendingQuestion) {
        pendingQuestion.url = linkMatch[1]
        continue
      }
    }

    commitQuestion()

    // Fallback: if parser captured too few companies, at least enumerate headings
    if (Object.keys(companies).length <= 1) {
      for (const l of lines) {
        const m = l.trim().match(companyHeaderRe)
        if (m) {
          const name = m[1].trim()
          companies[name] ||= { topics: {} }
        }
      }
    }

    return companies
  }, [text])
}

function usePersistentState(companyKey) {
  const [completed, setCompleted] = useState(() => lsGet(`completed:${companyKey}`, {}))
  const [bookmarks, setBookmarks] = useState(() => lsGet(`bookmarks:${companyKey}`, {}))
  const [notes, setNotes] = useState(() => lsGet(`notes:${companyKey}`, {}))
  const [openTopics, setOpenTopics] = useState(() => new Set(lsGet(`openTopics:${companyKey}`, [])))

  useEffect(() => { lsSet(`completed:${companyKey}`, completed) }, [companyKey, completed])
  useEffect(() => { lsSet(`bookmarks:${companyKey}`, bookmarks) }, [companyKey, bookmarks])
  useEffect(() => { lsSet(`notes:${companyKey}`, notes) }, [companyKey, notes])
  useEffect(() => { lsSet(`openTopics:${companyKey}`, Array.from(openTopics)) }, [companyKey, openTopics])

  return { completed, setCompleted, bookmarks, setBookmarks, notes, setNotes, openTopics, setOpenTopics }
}

function DifficultyChip({ level }) {
  const normalized = (level || 'medium').toLowerCase()
  const base = 'px-2 py-0.5 text-xs rounded-full border'
  const styles = normalized === 'easy'
    ? 'border-emerald-400 text-emerald-400 bg-emerald-400/10'
    : normalized === 'hard'
    ? 'border-rose-400 text-rose-400 bg-rose-400/10'
    : 'border-amber-400 text-amber-400 bg-amber-400/10'
  return <span className={`${base} ${styles}`}>{normalized}</span>
}

function ExternalLinkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </svg>
  )
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
  )
}

function NoteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

function Dsa() {
  const { darkMode } = useTheme();
  const data = useParsedDsa()
  const companyNames = Object.keys(data)

  const [selectedCompany, setSelectedCompany] = useState(() => lsGet('selectedCompany', companyNames[0] || ''))
  useEffect(() => { if (selectedCompany) lsSet('selectedCompany', selectedCompany) }, [selectedCompany])

  const [companyFilter, setCompanyFilter] = useState('')
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('all') // all | bookmarked | incomplete | complete
  const [mobileOpen, setMobileOpen] = useState(false)

  // Persisted per-company state
  const state = usePersistentState(selectedCompany || 'global')

  // ESC closes mobile drawer
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const topics = data[selectedCompany]?.topics || {}

  function getId(q) { return `${q.company}|${q.topic}|${q.title}` }

  function toggleComplete(q) {
    const id = getId(q)
    const next = { ...state.completed, [id]: !state.completed[id] }
    state.setCompleted(next)
  }
  function toggleBookmark(q) {
    const id = getId(q)
    const next = { ...state.bookmarks, [id]: !state.bookmarks[id] }
    state.setBookmarks(next)
  }

  function setNote(q, value) {
    const id = getId(q)
    const next = { ...state.notes, [id]: value }
    state.setNotes(next)
  }

  function isVisible(q) {
    const id = getId(q)
    const text = `${q.title} ${q.topic} ${q.company}`.toLowerCase()
    const bySearch = text.includes(search.toLowerCase())
    if (!bySearch) return false
    if (filterTab === 'bookmarked') return !!state.bookmarks[id]
    if (filterTab === 'complete') return !!state.completed[id]
    if (filterTab === 'incomplete') return !state.completed[id]
    return true
  }

  function topicProgress(list) {
    const total = list.length
    const done = list.reduce((acc, q) => acc + (state.completed[getId(q)] ? 1 : 0), 0)
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} w-screen h-[calc(100dvh-4rem)] overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar / Drawer */}
        <aside className={`lg:col-span-3 lg:sticky lg:top-20 self-start ${darkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-4`} aria-label="Companies sidebar">
          <div className="flex items-center gap-2 mb-3">
            <input value={companyFilter} onChange={e=>setCompanyFilter(e.target.value)} placeholder="Search companies" className={`${darkMode?'bg-[#121212] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'} w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400`} />
            <button className="lg:hidden px-3 py-2 rounded-xl border" aria-label="Close drawer" onClick={()=>setMobileOpen(false)}>✖</button>
          </div>
          <ul className="space-y-1">
            {companyNames.filter(c=>c.toLowerCase().includes(companyFilter.toLowerCase())).map(c=>{
              const active = c===selectedCompany
              return (
                <li key={c}>
                  <button onClick={()=>{ setSelectedCompany(c); setMobileOpen(false) }} className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${active ? 'bg-orange-400 text-white' : (darkMode?'hover:bg-[#121212]':'hover:bg-gray-50')}`}
                    aria-current={active? 'page': undefined}>
                    {c}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Main */}
        <main className="lg:col-span-9 h-full min-h-0 flex flex-col">
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold">DSA Tracker</h1>
              {selectedCompany && <p className="text-sm opacity-70">{selectedCompany}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button className="lg:hidden px-3 py-2 rounded-xl border" onClick={()=>setMobileOpen(true)} aria-label="Open company drawer">Companies ▸</button>
            </div>
          </div>

          <div className={`rounded-2xl border ${darkMode?'border-gray-800 bg-[#0a0a0a]':'border-gray-200 bg-white'} p-3 sm:p-4 mb-3`}> 
            <div className="flex items-center gap-3">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions…" className={`${darkMode?'bg-[#121212] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'} flex-1 px-3 py-2 rounded-xl border outline-none focus:border-orange-400`} />
              <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                {['all','bookmarked','incomplete','complete'].map(t=> (
                  <button key={t} onClick={()=>setFilterTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${filterTab===t? 'bg-orange-400 text-white border-orange-400' : (darkMode?'border-gray-800 hover:bg-[#121212]':'border-gray-200 hover:bg-gray-50')}`}>{t[0].toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Topics accordions */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
            {Object.entries(topics).map(([topic, list])=>{
              const { done, total, pct } = topicProgress(list)
              const open = state.openTopics.has(topic)
              return (
                <section key={topic} className={`rounded-2xl border ${darkMode?'border-gray-800 bg-[#0a0a0a]':'border-gray-200 bg-white'}`}>
                  <button className="w-full px-4 py-3 flex items-center justify-between" aria-expanded={open} onClick={()=>{
                    const next = new Set(state.openTopics); if (open) next.delete(topic); else next.add(topic); state.setOpenTopics(next)
                  }}>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{topic}</span>
                      <span className="text-sm opacity-70">{done}/{total}</span>
                    </div>
                    <span className="opacity-70">{open? '▾':'▸'}</span>
                  </button>
                  <div className={`h-1 mx-4 mb-2 rounded-full bg-orange-400/20`}>
                    <div className="h-full rounded-full bg-orange-400 transition-all" style={{width:`${pct}%`}} />
                  </div>
                  {open && (
                    <ul className="px-2 pb-3 divide-y divide-gray-200/10">
                      {list.filter(isVisible).map((q)=>{
                        const id = getId(q)
                        const isDone = !!state.completed[id]
                        const isSaved = !!state.bookmarks[id]
                        const note = state.notes[id] || ''
                        return (
                          <li key={id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-2 py-3">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={isDone} onChange={()=>toggleComplete(q)} aria-label="Mark complete" className="accent-orange-400 w-4 h-4" />
                            </label>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium ${isDone? 'line-through opacity-70':''}`}>{q.title}</span>
                                <DifficultyChip level={q.difficulty} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <a href={q.url || '#'} target="_blank" rel="noreferrer" className="px-2.5 py-1.5 rounded-xl border hover:bg-orange-400/10" aria-label="Open question" title="Open question">
                                <ExternalLinkIcon />
                              </a>
                              <button onClick={()=>toggleBookmark(q)} className={`px-2.5 py-1.5 rounded-xl border ${isSaved? 'bg-orange-400 text-white border-orange-400':'hover:bg-orange-400/10'}`} aria-label={isSaved? 'Remove bookmark':'Add bookmark'} title={isSaved? 'Remove bookmark':'Add bookmark'}>
                                <BookmarkIcon filled={isSaved} />
                              </button>
                              <details className="relative">
                                <summary className="list-none px-2.5 py-1.5 rounded-xl border hover:bg-orange-400/10 cursor-pointer select-none" aria-label="Add note" title="Add note">
                                  <NoteIcon />
                                </summary>
                                <div className={`absolute right-0 mt-2 w-64 p-3 rounded-xl border ${darkMode?'bg-[#0a0a0a] border-gray-800':'bg-white border-gray-200'} shadow-xl z-10`}>
                                  <textarea value={note} onChange={e=>setNote(q, e.target.value)} placeholder="Add a short note…" className={`${darkMode?'bg-[#121212] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'} w-full p-2 text-sm rounded-lg border outline-none focus:border-orange-400`} rows={3} />
                                </div>
                              </details>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>
        </main>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setMobileOpen(false)} />
          <div className={`absolute top-0 left-0 h-full w-80 p-4 border-r ${darkMode?'bg-black border-gray-800':'bg-white border-gray-200'}`}
            onKeyDown={(e)=>{
              if (e.key !== 'Tab') return
              const container = e.currentTarget
              const focusables = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
              if (focusables.length === 0) return
              const first = focusables[0]
              const last = focusables[focusables.length -1]
              if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus() }
              } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus() }
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Companies</h2>
              <button onClick={()=>setMobileOpen(false)} aria-label="Close drawer">✖</button>
            </div>
            <div className="mb-3">
              <input autoFocus value={companyFilter} onChange={e=>setCompanyFilter(e.target.value)} placeholder="Search companies" className={`${darkMode?'bg-[#121212] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'} w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400`} />
            </div>
            <ul className="space-y-1 overflow-y-auto h-[calc(100%-6rem)] pr-2">
              {companyNames.filter(c=>c.toLowerCase().includes(companyFilter.toLowerCase())).map(c=>{
                const active = c===selectedCompany
                return (
                  <li key={c}>
                    <button onClick={()=>{ setSelectedCompany(c); setMobileOpen(false) }} className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${active ? 'bg-orange-400 text-white' : (darkMode?'hover:bg-[#121212]':'hover:bg-gray-50')}`}
                      aria-current={active? 'page': undefined}>
                      {c}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dsa