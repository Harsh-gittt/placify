import React from 'react'
import { useTheme } from '../context/ThemeContext'
import accenture from '../assets/images/company images/accenture.png'
import amazon from '../assets/images/company images/amazon.png'
import google from '../assets/images/company images/google.png'
import infosys from '../assets/images/company images/infosys.png'
import meta from '../assets/images/company images/meta.png'
import microsoft from '../assets/images/company images/microsoft.png'
import tcs from '../assets/images/company images/tcs.png'
import wipro from '../assets/images/company images/wipro.png'

function LearnersMarquee() {
  const { darkMode } = useTheme();
  const companies = [
    { name: 'Google', img: google },
    { name: 'Amazon', img: amazon },
    { name: 'Microsoft', img: microsoft },
    { name: 'Meta', img: meta },
    { name: 'Accenture', img: accenture },
    { name: 'Infosys', img: infosys },
    { name: 'TCS', img: tcs },
    { name: 'Wipro', img: wipro },
  ];

  return (
    <section className={`${darkMode ? 'bg-[#1f1f1f] text-white' : 'bg-gray-100 text-gray-800'} py-10 px-2 sm:px-8 md:px-16 rounded-3xl transition-colors duration-300 mx-4 sm:mx-10`}>
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl font-bold mb-6 text-center">Top Companies</h3>
        <div className="marquee-container pb-2 overflow-hidden">
          <div className="marquee-track gap-4">
            <div className="flex gap-4">
              {companies.map((c, i) => (
                <div key={`a-${i}`} className={`flex-shrink-0 flex flex-col items-center justify-center rounded-2xl p-2 sm:p-4 ${darkMode ? 'bg-[#262626]' : 'bg-white'} transition-colors duration-300 w-24 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28 lg:w-48 lg:h-32`}>
                  <img src={c.img} alt={c.name} className="object-contain w-12 h-10 sm:w-20 sm:h-14 md:w-28 md:h-20 lg:w-36 lg:h-24" />
                </div>
              ))}
            </div>
            <div className="flex gap-4" aria-hidden="true">
              {companies.map((c, i) => (
                <div key={`b-${i}`} className={`flex-shrink-0 flex flex-col items-center justify-center rounded-2xl p-2 sm:p-4 ${darkMode ? 'bg-[#262626]' : 'bg-white'} transition-colors duration-300 w-24 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28 lg:w-48 lg:h-32`}>
                  <img src={c.img} alt={c.name} className="object-contain w-12 h-10 sm:w-20 sm:h-14 md:w-28 md:h-20 lg:w-36 lg:h-24" />
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