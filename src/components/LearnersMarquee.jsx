import React from 'react'
import { useTheme } from '../context/ThemeContext'

function LearnersMarquee() {
  const { darkMode } = useTheme();
  
  const companies = [
    { name: 'Google', img: 'https://images.pexels.com/photos/218717/pexels-photo-218717.jpeg' },
    { name: 'Amazon', img: 'https://logo.clearbit.com/amazon.com' },
    { name: 'Microsoft', img: 'https://logo.clearbit.com/microsoft.com' },
    { name: 'Apple', img: 'https://logo.clearbit.com/apple.com' },
    { name: 'Meta', img: 'https://logo.clearbit.com/meta.com' },
  ]

  return (
    <section className={`${darkMode ? 'bg-[#1f1f1f] text-white' : 'bg-gray-100 text-gray-800'} py-14 px-6 rounded-3xl p-6 sm:p-10 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl font-bold mb-6">Top Companies</h3>
        <div className="marquee-container pb-2">
          <div className="marquee-track gap-6">
            <div className="flex gap-6">
              {companies.map((c, i) => (
                <div key={`a-${i}`} className={`min-w-64 ${darkMode ? 'bg-[#262626]' : 'bg-white'} rounded-2xl p-6 flex flex-col items-center transition-colors duration-300`}>
                  <img src={c.img} alt={c.name} className="w-20 h-20 object-contain" />
                  <p className={`mt-3 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.name}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-6" aria-hidden="true">
              {companies.map((c, i) => (
                <div key={`b-${i}`} className={`min-w-64 ${darkMode ? 'bg-[#262626]' : 'bg-white'} rounded-2xl p-6 flex flex-col items-center transition-colors duration-300`}>
                  <img src={c.img} alt={c.name} className="w-20 h-20 object-contain" />
                  <p className={`mt-3 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{c.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LearnersMarquee