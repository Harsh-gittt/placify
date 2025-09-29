import React from 'react'

function Footer(){
  return (
    <footer className="bg-black text-gray-400 py-10 px-6 border-t border-white/10 mt-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm">© {new Date().getFullYear()} Placify</p>
        <p className="text-sm">Built for learning and placements</p>
      </div>
    </footer>
  )
}

export default Footer


