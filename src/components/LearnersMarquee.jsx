import React from 'react'
import { useTheme } from '../context/ThemeContext'

function LearnersMarquee() {
  const { darkMode } = useTheme();
  
  const learners = [
    { name: 'Sankalp jain', company: 'Company', img: 'https://i.pravatar.cc/100?img=1' },
    { name: 'Anubhuti Pandey', company: 'Google', img: 'https://i.pravatar.cc/100?img=2' },
    { name: 'Sudipta Basak', company: 'Amazon', img: 'https://i.pravatar.cc/100?img=3' },
    { name: 'Aditya Mane', company: 'Rupeek', img: 'https://i.pravatar.cc/100?img=4' },
    { name: 'Kundan Kumar', company: 'T-Mobile', img: 'https://i.pravatar.cc/100?img=5' },
  ]

  return (
    <section className={`${darkMode ? 'bg-[#1f1f1f] text-white' : 'bg-gray-100 text-gray-800'} py-12 px-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl font-bold mb-6"><span className="text-[#f59e0b]">12,26,611+</span> Learners</h3>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
          {learners.map((l, i) => (
            <div key={i} className={`min-w-64 ${darkMode ? 'bg-[#262626]' : 'bg-white'} rounded-2xl p-6 flex flex-col items-center transition-colors duration-300`}>
              <img src={l.img} alt={l.name} className="w-20 h-20 rounded-full object-cover" />
              <p className={`mt-3 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{l.name}</p>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.company}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LearnersMarquee


