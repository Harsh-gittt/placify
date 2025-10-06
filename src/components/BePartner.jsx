import React from "react"
import { useTheme } from '../context/ThemeContext'

function BePartner() {
  const { darkMode } = useTheme();
  return (
    <div className={`rounded-xl p-8 text-center mt-10 transition-colors duration-300 `}>
      <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Want to be a Study Partner?
      </h2>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
        Help others and enhance your own knowledge
      </p>
      <button className="bg-orange-400 text-white font-semibold px-6 py-3 rounded-xl hover:bg-orange-500 cursor-pointer transition-colors duration-200">
        Become a Partner
      </button>
    </div>
  )
}

export default BePartner
