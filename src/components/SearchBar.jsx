import React from "react"
import { useTheme } from '../context/ThemeContext'

function SearchBar({ searchTerm, setSearchTerm, subject, setSubject, onSearch, onClear }) {
  const { darkMode } = useTheme();
  return (
    <div className={`flex flex-wrap flex-1 items-center gap-4 p-4 rounded-lg shadow-md w-full transition-colors duration-300 ${darkMode ? 'bg-[#181818] backdrop-blur-md' : 'bg-[#f5f5f5]'}`}>
      {/* Search by name/skills */}
      <input
        type="text"
        placeholder="Search by Name, Skill..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={`flex-1 px-4 py-2 rounded-lg w-64 outline-none transition-colors duration-200 ${darkMode ? 'bg-black/30 text-white placeholder-gray-300' : 'bg-white text-gray-900 placeholder-gray-500 border border-gray-300'}`}
      />
      {/* Filter dropdown */}
      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className={`px-4 py-2 rounded-lg outline-none transition-colors duration-200 ${darkMode ? 'bg-black/30 text-white' : 'bg-white text-gray-900 border border-gray-300'}`}
      >
        <option className={darkMode ? 'bg-black text-gray-300' : 'bg-white text-gray-500'} value="">Filter by Subject</option>
        <option className={darkMode ? 'bg-black text-gray-300' : 'bg-white text-gray-900'} value="DSA">DSA</option>
        <option className={darkMode ? 'bg-black text-gray-300' : 'bg-white text-gray-900'} value="Web Dev">Web Dev</option>
        <option className={darkMode ? 'bg-black text-gray-300' : 'bg-white text-gray-900'} value="ML">Machine Learning</option>
      </select>
      {/* Search & Clear buttons */}
      <button
        onClick={onSearch}
        className={`px-4 py-2 rounded-xl font-semibold transition-colors duration-200 ${darkMode ? 'bg-orange-400 text-white hover:bg-orange-500' : 'bg-orange-400 text-white hover:bg-orange-500'}`}
      >
        Search
      </button>
      <button
        onClick={onClear}
        className={`px-4 py-2 rounded-xl font-semibold transition-colors duration-200 ${darkMode ? 'bg-orange-400 text-white hover:bg-orange-500' : 'bg-orange-400 text-white hover:bg-orange-500'}`}
      >
        Clear Filters
      </button>
    </div>
  )
}

export default SearchBar
