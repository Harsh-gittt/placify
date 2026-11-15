import React from 'react'
import { useTheme } from '../context/ThemeContext'

function Footer(){
  const { darkMode } = useTheme();
  
  return (
    <footer className={`${darkMode ? 'bg-black text-gray-400 border-white/10' : 'bg-white text-gray-600 border-gray-200'} py-8 sm:py-10 px-4 sm:px-6 border-t mt-8 sm:mt-10 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="text-sm">© {new Date().getFullYear()} Placify</p>
        <p className="text-sm">Built for learning and placements</p>
      </div>
    </footer>
  )
}

export default Footer


