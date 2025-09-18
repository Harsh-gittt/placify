import React from "react"

function SearchBar({ searchTerm, setSearchTerm, subject, setSubject, onSearch, onClear }) {
  return (
    <div className="flex flex-wrap flex-1 items-center gap-4 bg-gray-900 backdrop-blur-md p-4 rounded-lg shadow-md w-full">
      {/* Search by name/skills */}
      <input
        type="text"
        placeholder="Search by Name, Skill..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1 px-4 py-2 rounded-lg w-64 bg-black/30 text-white placeholder-gray-300 outline-none"
      />

      {/* Filter dropdown */}
      <select
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="px-4 py-2 rounded-lg bg-black/30 text-white outline-none"
      >
        <option className="bg-black text-gray-300" value="">Filter by Subject</option>
        <option className="bg-black text-gray-300" value="DSA">DSA</option>
        <option className="bg-black text-gray-300" value="Web Dev">Web Dev</option>
        <option className="bg-black text-gray-300" value="ML">Machine Learning</option>
      </select>

      {/* Search & Clear buttons */}
      <button
        onClick={onSearch}
        className="bg-purple-700 text-white px-4 py-2 rounded-xl hover:bg-purple-800 cursor-pointer"
      >
        Search
      </button>

      <button
        onClick={onClear}
        className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  )
}

export default SearchBar
