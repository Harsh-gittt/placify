import React, { useEffect, useMemo, useState } from "react";
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
  }, [questions, search, filterTab, bookmarks, selectedTopic]);

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
    <div className="w-screen min-h-screen h-auto bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-0 h-full min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar: Topics */}
        <aside className="lg:col-span-3 lg:sticky lg:top-20 self-start bg-[#0a0a0a] border border-gray-800 rounded-2xl p-4 max-h-screen overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <input value={topicFilter} onChange={e=>setTopicFilter(e.target.value)} placeholder="Search topics" className="bg-[#121212] border-gray-800 text-white w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-orange-400" />
          </div>
          <ul className="space-y-1">
            {filteredTopics.map((topic, idx) => {
              const active = topic.topic === selectedTopic.topic;
              return (
                <li key={topic.topic}>
                  <button onClick={()=>{ setSelectedTopicIdx(idx); }} className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${active ? 'bg-orange-400 text-white' : 'hover:bg-[#121212]'}`}>{topic.topic}</button>
                </li>
              )
            })}
            {filteredTopics.length === 0 && (
              <li className="text-gray-500 px-2 py-4 italic">No topics found.</li>
            )}
          </ul>
        </aside>
        {/* Main content */}
        <main className="lg:col-span-9 h-full min-h-0 flex flex-col pb-6" style={{maxHeight: 'calc(100vh - 2rem)', overflowY: 'auto'}}>
          <div className="flex items-start sm:items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-2xl font-bold">Aptitude Practice</h1>
              <p className="text-sm opacity-70">{selectedTopic.topic}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-[#0a0a0a] p-3 sm:p-4 mb-3">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search questions…" className="bg-[#121212] border-gray-800 text-white flex-1 px-3 py-2 rounded-xl border outline-none focus:border-orange-400" />
              <div className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                {['all','bookmarked'].map(t=> (
                  <button key={t} onClick={()=>setFilterTab(t)} className={`px-3 py-1.5 rounded-xl text-sm border transition-colors ${filterTab===t? 'bg-orange-400 text-white border-orange-400' : 'border-gray-800 hover:bg-[#121212]'}`}>{t[0].toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
            </div>
          </div>
          {/* Questions (accordions) */}
          <ul className="flex-1 min-h-0 gap-y-3 flex flex-col pb-8" style={{overflowY:'auto'}}>
            {filtered.map((q) => {
              const id = qid(q);
              const open = openSet.has(id);
              const saved = !!bookmarks[id];
              return (
                <li key={id} className={`bg-[#16161a] border border-gray-800 rounded-xl transition-all duration-200 ${open? 'ring-2 ring-orange-400 ring-opacity-60 scale-[1.01]':''}`}
                  style={{overflow: 'visible'}}
                > 
                  <div className="flex items-center justify-between gap-3 px-4 py-4 cursor-pointer select-none" style={{overflow:'visible'}} aria-expanded={open} onClick={() => toggleOpen(q)}>
                    <span className="font-medium text-base sm:text-lg flex-1">{q.q_no}. {q.question}</span>
                    <button onClick={e => { e.stopPropagation(); toggleBookmark(q); } } className={`ml-2 px-2.5 py-1.5 rounded-xl border ${saved? 'bg-orange-400 text-white border-orange-400':'hover:bg-orange-400/10 border-gray-800'}`} aria-label={saved? 'Remove bookmark':'Add bookmark'} title={saved? 'Remove bookmark':'Add bookmark'}>
                      <BookmarkIcon filled={saved} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleOpen(q); } } className={`ml-2 px-2.5 py-1.5 rounded-xl border border-gray-800 ${open ? 'bg-orange-400 text-white' : 'hover:bg-orange-400/10'}`} aria-label={open? 'Collapse' : 'Expand'} title={open? 'Collapse' : 'Expand'}>
                      {open ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {open && (
                    <div className="px-4 pb-4 text-sm sm:text-base opacity-90 text-orange-200 animate-fadein">
                      <strong>Answer:</strong> {q.answer}
                    </div>
                  )}
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="text-gray-500 px-2 py-4 italic">No questions found for this filter.</li>
            )}
            <li className="h-6 list-none" />
          </ul>
        </main>
      </div>
    </div>
  );
}

export default AptitudeQuestions;