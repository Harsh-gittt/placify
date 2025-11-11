import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import aptitudeData from "../assets/questions/aptitude.json";

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

function AptitudeQuestions() {
  const { darkMode } = useTheme();
  const topics = aptitudeData.topics;
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // all/bookmarked
  const [openSet, setOpenSet] = useState(() => new Set()); // question id string
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("aptitudeBookmarks")) || {}; } catch { return {}; }
  });
  const [topicFilter, setTopicFilter] = useState("");

  useEffect(() => { localStorage.setItem("aptitudeBookmarks", JSON.stringify(bookmarks)); }, [bookmarks]);

  const filteredTopics = useMemo(() => topicFilter.trim() ? topics.filter(t => t.topic.toLowerCase().includes(topicFilter.toLowerCase())) : topics, [topics, topicFilter]);
  const selectedTopic = filteredTopics[selectedTopicIdx] || filteredTopics[0] || topics[0];

  function qid(q) { return `${selectedTopic.topic}|${q.q_no}`; }
  const questions = useMemo(() => (selectedTopic && selectedTopic.questions ? selectedTopic.questions : []), [selectedTopic]);
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let base = s ? questions.filter(q => `${q.question} ${q.answer}`.toLowerCase().includes(s)) : questions;
    if (filterTab === "bookmarked") {
      base = base.filter((q) => bookmarks[qid(q)]);
    }
    return base;
  }, [questions, search, filterTab, bookmarks, selectedTopic, qid]);

  function toggleBookmark(q) {
    const id = qid(q);
    setBookmarks(prev => ({ ...prev, [id]: !prev[id] }));
  }
  function toggleOpen(q) {
    const id = qid(q);
    setOpenSet(ns => {
      const next = new Set(ns);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  useEffect(() => { setOpenSet(new Set()); }, [selectedTopic]);

  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} w-screen min-h-screen h-auto`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Sidebar: Topics */}
        <aside className={`lg:col-span-3 lg:sticky lg:top-20 self-start ${darkMode ? 'bg-[#0a0a0a] border-gray-800' : 'bg-white border-gray-200'} border rounded-2xl p-3 sm:p-4 max-h-[calc(100vh-2rem)] overflow-y-auto`}>
          <div className="flex items-center gap-2 mb-4">
            <input 
              value={topicFilter} 
              onChange={e=>setTopicFilter(e.target.value)} 
              placeholder="Search topics" 
              className={`${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400 transition-colors`} 
            />
          </div>
          <ul className="space-y-1">
            {filteredTopics.map((topic, idx) => {
              const active = topic.topic === selectedTopic.topic;
              return (
                <li key={topic.topic}>
                  <button 
                    onClick={()=>{ setSelectedTopicIdx(idx); }} 
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors text-sm sm:text-base ${active ? 'bg-orange-400 text-white' : darkMode ? 'hover:bg-[#121212]' : 'hover:bg-gray-50'}`}
                  >
                    {topic.topic}
                  </button>
                </li>
              )
            })}
            {filteredTopics.length === 0 && (
              <li className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} px-2 py-4 italic text-sm`}>No topics found.</li>
            )}
          </ul>
        </aside>
        {/* Main content */}
        <main className="lg:col-span-9 h-full min-h-0 flex flex-col pb-6">
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Aptitude Practice</h1>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedTopic.topic}</p>
            </div>
          </div>
          <div className={`rounded-2xl border ${darkMode ? 'border-gray-800 bg-[#0a0a0a]' : 'border-gray-200 bg-white'} p-3 sm:p-4 mb-3`}>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <input 
                value={search} 
                onChange={e=>setSearch(e.target.value)} 
                placeholder="Search questions…" 
                className={`${darkMode ? 'bg-[#121212] border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-900'} flex-1 min-w-[200px] px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400 transition-colors`} 
              />
              <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                {['all','bookmarked'].map(t=> (
                  <button 
                    key={t} 
                    onClick={()=>setFilterTab(t)} 
                    className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${filterTab===t? 'bg-orange-400 text-white border-orange-400' : darkMode ? 'border-gray-800 hover:bg-[#121212]' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {t[0].toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Questions (accordions) */}
          <ul className="flex-1 min-h-0 gap-y-3 flex flex-col pb-8 overflow-y-auto no-scrollbar">
            {filtered.map((q) => {
              const id = qid(q);
              const open = openSet.has(id);
              const saved = !!bookmarks[id];
              return (
                <li 
                  key={id} 
                  className={`${darkMode ? 'bg-[#16161a] border-gray-800' : 'bg-white border-gray-200'} border rounded-xl transition-all duration-200 ${open ? 'ring-2 ring-orange-400 ring-opacity-60' : ''}`}
                > 
                  <div 
                    className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 cursor-pointer select-none" 
                    aria-expanded={open} 
                    onClick={() => toggleOpen(q)}
                  >
                    <span className={`font-medium text-sm sm:text-base lg:text-lg flex-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {q.q_no}. {q.question}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button 
                        onClick={e => { e.stopPropagation(); toggleBookmark(q); }} 
                        className={`px-2 sm:px-2.5 py-1.5 rounded-xl border transition-colors ${saved ? 'bg-orange-400 text-white border-orange-400' : darkMode ? 'hover:bg-orange-400/10 border-gray-800' : 'hover:bg-orange-400/10 border-gray-200'}`} 
                        aria-label={saved ? 'Remove bookmark' : 'Add bookmark'} 
                        title={saved ? 'Remove bookmark' : 'Add bookmark'}
                      >
                        <BookmarkIcon filled={saved} />
                      </button>
                      <button 
                        onClick={e => { e.stopPropagation(); toggleOpen(q); }} 
                        className={`px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm transition-colors ${open ? 'bg-orange-400 text-white border-orange-400' : darkMode ? 'hover:bg-orange-400/10 border-gray-800' : 'hover:bg-orange-400/10 border-gray-200'}`} 
                        aria-label={open ? 'Collapse' : 'Expand'} 
                        title={open ? 'Collapse' : 'Expand'}
                      >
                        {open ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className={`px-3 sm:px-4 pb-3 sm:pb-4 text-sm sm:text-base ${darkMode ? 'text-orange-200' : 'text-orange-600'}`}>
                      <strong className={darkMode ? 'text-orange-300' : 'text-orange-700'}>Answer:</strong> {q.answer}
                    </div>
                  )}
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} px-2 py-4 italic text-sm sm:text-base`}>
                No questions found for this filter.
              </li>
            )}
            <li className="h-6 list-none" />
          </ul>
        </main>
      </div>
    </div>
  );
}

export default AptitudeQuestions;