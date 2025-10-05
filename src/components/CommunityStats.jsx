import React from 'react'
import { useTheme } from '../context/ThemeContext'
import { FaLaptopCode, FaChartLine, FaUsers, FaBriefcase } from "react-icons/fa";

function Stat({ value, label, icon: Icon }) {
  const { darkMode } = useTheme();

  return (
    <div
      className={`rounded-3xl p-8 flex flex-col items-center justify-center gap-4 
      ${darkMode 
        ? 'bg-gradient-to-b from-[#ece7e3]/10 to-[#000]/30 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.55)] text-white' 
        : 'bg-gradient-to-b from-gray-100 to-white border-gray-200 shadow-lg text-gray-800'
      } border transition-all duration-300 hover:scale-105`}
    >
      <Icon className={`text-5xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      <div className="text-3xl font-bold">{value}</div>
      <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </div>
    </div>
  );
}

function CommunityStats() {
  const { darkMode } = useTheme();
  const stats = [
    { value: '50K+', label: 'DSA Questions Practiced', icon: FaLaptopCode },
    { value: '10K+', label: 'Aptitude Tests Attempted', icon: FaChartLine },
    { value: '20K+', label: 'Students Preparing with Us', icon: FaUsers },
    { value: '1K+', label: 'Internships Shared', icon: FaBriefcase },
  ];

  return (
    <section className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} py-16 px-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12">
          Empowering Students for Career Success
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, idx) => (
            <Stat key={idx} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CommunityStats;
