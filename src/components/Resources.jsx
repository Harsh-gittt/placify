import React, { useEffect, useMemo, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import dbms from '../assets/questions/DBMS.json'
import cn from '../assets/questions/CN.json'
import os from '../assets/questions/OS.json'

const LS_PREFIX = 'coreTracker:'
const lsGet = (k, f) => { try { const v = localStorage.getItem(LS_PREFIX + k); return v ? JSON.parse(v) : f } catch { return f } }
const lsSet = (k, v) => { try { localStorage.setItem(LS_PREFIX + k, JSON.stringify(v)) } catch {} }

const SUBJECTS = {
  DBMS: dbms,
  'Computer Networks': cn,
  'Operating System': os,
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

function normalizeQuestions(subjectData) {
  // Expected: { questions: [{ id, question, answer }, ...] }
  if (subjectData?.questions && Array.isArray(subjectData.questions)) return subjectData.questions
  // Fallbacks: if content differs, try to coerce
  const arr = []
  Object.values(subjectData || {}).forEach(v => {
    if (Array.isArray(v)) v.forEach(q => { if (q?.question && q?.answer) arr.push(q) })
  })
  return arr
}

function Resources() {
  const { darkMode } = useTheme();
  const subjectNames = Object.keys(SUBJECTS)
  const [selected, setSelected] = useState(() => lsGet('selectedSubject', subjectNames[0]))
  useEffect(() => { lsSet('selectedSubject', selected) }, [selected])

  const [search, setSearch] = useState('')
  const [bookmarks, setBookmarks] = useState(() => lsGet(`bookmarks:${selected}`, {}))
  const [openSet, setOpenSet] = useState(() => new Set(lsGet(`open:${selected}`, [])))
  const [filterTab, setFilterTab] = useState('all') // all | bookmarked

  useEffect(() => { lsSet(`bookmarks:${selected}`, bookmarks) }, [selected, bookmarks])
  useEffect(() => { lsSet(`open:${selected}`, Array.from(openSet)) }, [selected, openSet])
  // When subject changes, load its persisted state
  useEffect(() => {
    setBookmarks(lsGet(`bookmarks:${selected}`, {}))
    setOpenSet(new Set(lsGet(`open:${selected}`, [])))
  }, [selected])

  const questions = useMemo(() => normalizeQuestions(SUBJECTS[selected]), [selected])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    const base = s ? questions.filter(q => `${q.question} ${q.answer}`.toLowerCase().includes(s)) : questions
    if (filterTab === 'bookmarked') {
      return base.filter((q, idx) => bookmarks[qid(q, idx)])
    }
    return base
  }, [questions, search, filterTab, bookmarks])

  function qid(q) { return `${selected}|${String(q.id ?? q.question)}` }
  function toggleBookmark(q) {
    const id = qid(q)
    setBookmarks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} w-screen h-[calc(100dvh-4rem)] overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className={`lg:col-span-3 lg:sticky lg:top-20 self-start ${darkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-4`}>
          <div className="mb-3">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Q&A…" className={`${darkMode?'bg-[#121212] border-gray-800 text-white':'bg-white border-gray-200 text-gray-900'} w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400`} />
          </div>
          <ul className="space-y-1">
            {subjectNames.map(name => {
              const active = name === selected
              return (
                <li key={name}>
                  <button onClick={()=>setSelected(name)} className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${active ? 'bg-orange-400 text-white' : (darkMode?'hover:bg-[#121212]':'hover:bg-gray-50')}`}>{name}</button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-9 h-full min-h-0 flex flex-col pb-6">
          <div className="mb-3">
            <h1 className="text-2xl font-bold">Core Subjects</h1>
            <p className="text-sm opacity-70">{selected}</p>
          </div>

          <div className={`rounded-2xl border ${darkMode?'border-gray-800 bg-[#0a0a0a]':'border-gray-200 bg-white'} p-3 sm:p-4 h-full min-h-0 flex flex-col`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-sm opacity-70">{filtered.length} questions</span>
              <div className="flex gap-2">
                {['all','bookmarked'].map(t => (
                  <button key={t} onClick={()=>setFilterTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${filterTab===t? 'bg-orange-400 text-white border-orange-400' : (darkMode?'border-gray-800 hover:bg-[#121212]':'border-gray-200 hover:bg-gray-50')}`}>{t[0].toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
            </div>

            <ul className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 pr-1 pb-6">
              {filtered.map((q) => {
                const id = qid(q)
                const open = openSet.has(id)
                const saved = !!bookmarks[id]
                return (
                  <li key={id} className={`${darkMode ? 'bg-[#0f0f0f] border-gray-800' : 'bg-white border-gray-200'} rounded-xl border overflow-hidden`}> 
                    <div className="flex items-center justify-between gap-3 px-3 py-3">
                      <button className="text-left flex-1" aria-expanded={open} onClick={()=>{
                        const ns = new Set(openSet); if (open) ns.delete(id); else ns.add(id); setOpenSet(ns)
                      }}>
                        <div className="flex items-start gap-2">
                          <span className="font-medium">{q.question}</span>
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <button onClick={()=>toggleBookmark(q)} className={`px-2.5 py-1.5 rounded-xl border ${saved? 'bg-orange-400 text-white border-orange-400':'hover:bg-orange-400/10'}`} aria-label={saved? 'Remove bookmark':'Add bookmark'} title={saved? 'Remove bookmark':'Add bookmark'}>
                          <BookmarkIcon filled={saved} />
                        </button>
                        <button className={`px-2.5 py-1.5 rounded-xl border ${darkMode?'border-gray-800 hover:bg-[#141414]':'border-gray-200 hover:bg-gray-50'}`} onClick={()=>{
                          const ns = new Set(openSet); if (open) ns.delete(id); else ns.add(id); setOpenSet(ns)
                        }} aria-label={open? 'Collapse' : 'Expand'} title={open? 'Collapse' : 'Expand'}>
                          {open ? '▾' : '▸'}
                        </button>
                      </div>
                    </div>
                    {open && (
                      <div className="px-3 pb-4 text-sm opacity-90">
                        {q.answer}
                      </div>
                    )}
                  </li>
                )
              })}
              <li className="h-6 list-none" />
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Resources