import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function ResourceCard({ title, subtitle, to, bg, icon }) {
  const { darkMode } = useTheme();
  
  return (
    <Link to={to} className="block">
      <div className={`rounded-2xl overflow-hidden bg-${bg} shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-all duration-300`}> 
        <div className="h-48 sm:h-56 flex items-center justify-center">
          <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center text-3xl">
            {icon || '🧭'}
          </div>
        </div>
        <div className={`${darkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'} p-6 transition-colors duration-300`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>{subtitle}</p>
        </div>
      </div>
    </Link>
  )
}

function ResourcesGrid() {
  const { darkMode } = useTheme();
  
  const items = [
    { title: "Striver's DSA Sheet", subtitle: "Boost your DSA skills with our handy cheat sheets", to: "/dsa", bg: "[\#E57C54]", icon: '📄' },
    { title: "Technical Blogs", subtitle: "Explore Tech Innovation with Engaging Blogs", to: "/resources", bg: "[\#59A6E8]", icon: '✍️' },
    { title: "Striver's CP Sheet", subtitle: "Level Up Your Coding with Practice Resources", to: "/resources", bg: "[\#3B9D91]", icon: '🧠' },
    { title: "Be Partner", subtitle: "be partner to help others and enhance your own knowledge", to: "/Study-Partner", bg: "[\#D6666A]", icon: '👥' },
    { title: "CS Subjects", subtitle: "Ace interviews with Expert Insights", to: "/resources", bg: "[\#9B7AE1]", icon: '🎓' },
    { title: "Interview Experience", subtitle: "Learn from Others' Experiences to Ace Interviews", to: "/resources", bg: "[\#D6AE57]", icon: '👥' },
  ]

  return (
    <section className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} py-10 px-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-center mb-10">Resources to Learn</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((i, idx) => (
            <ResourceCard key={idx} {...i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ResourcesGrid


