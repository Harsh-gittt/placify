import React from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-[0_2px_4px_rgba(255,255,255,0.1)]">
      
      {/* Logo */}
      <div className="text-2xl font-bold">
        MyLogo
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-8">
        <Link to="/" className="hover:text-gray-300">Home</Link>
        <Link to="/dsa" className="hover:text-gray-300">DSA</Link>
        <Link to="/study-partner" className="hover:text-gray-300">Study Partner</Link>
        <Link to="/internships" className="hover:text-gray-300">Internships</Link>
        <Link to="/resources" className="hover:text-gray-300">Resources</Link>
      </div>

      {/* Signup Button */}
      <button className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm px-4 py-2 rounded-2xl cursor-pointer">
        Sign Up
      </button>

    </nav>
  )
}

export default Navbar