import React from 'react'
import Navbar from './Navbar'
import { useTheme } from '../context/ThemeContext'

function Resources() {
  const { darkMode } = useTheme();
  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} w-screen min-h-screen`}>
      <Navbar />
      <div>resources</div>
    </div>
  )
}

export default Resources