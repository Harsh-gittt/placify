import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import hrData from '../assets/questions/HR.json'

const LS_PREFIX = 'hrTracker:'
const lsGet = (k, f) => { try { const v = localStorage.getItem(LS_PREFIX + k); return v ? JSON.parse(v) : f } catch { return f } }
const lsSet = (k, v) => { try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)) } catch {} }

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

function flattenQuestions(data) {
  const out = []
  data?.companies?.forEach(c => {
    c?.topics?.forEach(t => {
      t?.questions?.forEach(q => out.push(q))
    })
  })
  return out
}

function Hr() {
  const { darkMode } = useTheme()
  const allQs = useMemo(() => flattenQuestions(hrData), [])

  const [search, setSearch] = useState('')
  const [bookmarks, setBookmarks] = useState(() => lsGet('bookmarks', {}))
  const [openSet, setOpenSet] = useState(() => new Set(lsGet('open', [])))
  const [filterTab, setFilterTab] = useState('all')

  useEffect(() => { lsSet('bookmarks', bookmarks) }, [bookmarks])
  useEffect(() => { lsSet('open', Array.from(openSet)) }, [openSet])

  function qid(q) { return String(q.id || q.title) }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const base = s ? allQs.filter(q => `${q.title} ${q.answer}`.toLowerCase().includes(s)) : allQs
    if (filterTab === 'bookmarked') return base.filter(q => bookmarks[qid(q)])
    return base
  }, [allQs, search, filterTab, bookmarks])

  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} w-screen h-[calc(100dvh-4rem)] overflow-hidden relative`}>
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-amber-400/10 blur-2xl" />
        <div className="absolute top-10 right-12 text-orange-400/70 text-5xl">✦</div>
        <div className="absolute top-24 right-40 text-orange-500/50 text-4xl">✦</div>
        <div className="absolute bottom-16 left-10 text-orange-500/60 text-6xl">✦</div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 h-full min-h-0 flex flex-col">
        {/* Top banner */}
        <div className={`relative overflow-hidden rounded-2xl mb-4 border ${darkMode? 'border-gray-800 bg-gradient-to-r from-[#111] via-[#161313] to-[#111]':'border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50'}`}>
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold flex items-center gap-3">HR Questions <span className="px-2 py-0.5 rounded-full text-xs bg-orange-400/15 text-orange-300 border border-orange-400/30">Behavioral</span></h1>
              <p className="text-sm opacity-70 mt-1">Curated interview Q&A with expandable answers and bookmarks</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className={`px-3 py-1.5 rounded-xl text-sm border ${darkMode?'border-gray-700 bg-[#0f0f0f]':'border-gray-200 bg-white'}`}>Total: <strong>{allQs.length}</strong></div>
              <div className={`px-3 py-1.5 rounded-xl text-sm border ${darkMode?'border-gray-700 bg-[#0f0f0f]':'border-gray-200 bg-white'}`}>Bookmarked: <strong>{Object.values(bookmarks).filter(Boolean).length}</strong></div>
            </div>
          </div>
          {/* subtle sparkles */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute top-3 right-6 text-orange-400 animate-pulse">✦</div>
            <div className="absolute bottom-4 left-10 text-orange-500/80 animate-pulse" style={{animationDuration:'2.5s'}}>✦</div>
          </div>
        </div>

        <div className={`rounded-2xl border ${darkMode?'border-gray-800 bg-[#0a0a0a]':'border-gray-200 bg-white'} p-3 sm:p-4 h-full min-h-0 flex flex-col pb-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]`}>
          <div className="flex items-center gap-3 mb-3">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions…" className={`${darkMode?'bg-[#121212] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'} flex-1 px-3 py-2 rounded-xl border outline-none focus:border-orange-400`} />
            <div className="flex gap-2">
              {['all','bookmarked'].map(t => (
                <button key={t} onClick={()=>setFilterTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${filterTab===t? 'bg-orange-400 text-white border-orange-400' : (darkMode?'border-gray-800 hover:bg-[#121212]':'border-gray-200 hover:bg-gray-50')}`}>{t[0].toUpperCase()+t.slice(1)}</button>
              ))}
            </div>
          </div>

          <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-3 pr-1 pb-6">
            {filtered.map(q => {
              const id = qid(q)
              const open = openSet.has(id)
              const saved = !!bookmarks[id]
              return (
                <li key={id} className={`${darkMode ? 'bg-[#0f0f0f] border-gray-800' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden transition-colors hover:border-orange-400/60` }>
                  <div className="flex items-center justify-between gap-3 px-3 py-3">
                    <button className="text-left flex-1" aria-expanded={open} onClick={()=>{
                      const ns = new Set(openSet); if (open) ns.delete(id); else ns.add(id); setOpenSet(ns)
                    }}>
                      <span className="font-medium leading-snug">{q.title}</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={()=> setBookmarks(prev => ({...prev, [id]: !prev[id]})) } className={`px-2.5 py-1.5 rounded-xl border ${saved? 'bg-orange-400 text-white border-orange-400':'hover:bg-orange-400/10'}`} aria-label={saved? 'Remove bookmark':'Add bookmark'} title={saved? 'Remove bookmark':'Add bookmark'}>
                        <BookmarkIcon filled={saved} />
                      </button>
                      <button className={`px-2.5 py-1.5 rounded-xl border ${darkMode?'border-gray-800 hover:bg-[#141414]':'border-gray-200 hover:bg-gray-50'}`} onClick={()=>{
                        const ns = new Set(openSet); if (open) ns.delete(id); else ns.add(id); setOpenSet(ns)
                      }} aria-label={open? 'Collapse' : 'Expand'} title={open? 'Collapse' : 'Expand'}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open? 'rotate-180':''}`}>
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="px-3 pb-4 text-sm opacity-90 leading-relaxed">{q.answer}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Hr

