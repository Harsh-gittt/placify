import React from "react"
import { useTheme } from '../context/ThemeContext'

function PartnerCard({ name, skills, lookingFor }) {
  const { darkMode } = useTheme();
  return (
    <div className={`border rounded-xl p-6 w-72 shadow-lg flex flex-col justify-between transition-colors duration-300 ${darkMode ? 'bg-[#1f1f1f] border-orange-400 text-white' : 'bg-white border-orange-200 text-gray-900'}`}>
      {/* Avatar placeholder */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${darkMode ? 'bg-orange-400 text-white' : 'bg-orange-400 text-white'}`}>{name.charAt(0)}</div>
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</h2>
      </div>
      {/* Skills */}
      <p className={`font-semibold text-sm mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`}>Skills:</p>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm mb-4`}>{skills}</p>
      {/* Looking for */}
      <p className={`font-semibold text-sm mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`}>Looking for:</p>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm mb-6`}>{lookingFor}</p>
      {/* Connect Button */}
      <button className={`px-4 py-2 rounded-xl font-semibold transition-colors duration-200 ${darkMode ? 'bg-orange-400 text-white hover:bg-orange-500' : 'bg-orange-400 text-white hover:bg-orange-500'}`}>Connect</button>
    </div>
  )
}

export default PartnerCard
