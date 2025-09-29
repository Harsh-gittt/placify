import React from 'react'
import { useTheme } from '../context/ThemeContext'

function Footer(){
  const { darkMode } = useTheme();
  
  return (
    <footer className={`${darkMode ? 'bg-black text-gray-400 border-white/10' : 'bg-white text-gray-600 border-gray-200'} py-10 px-6 border-t mt-10 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm">© {new Date().getFullYear()} Placify</p>
        <p className="text-sm">Built for learning and placements</p>
      </div>
    </footer>
  )
}

export default Footer


