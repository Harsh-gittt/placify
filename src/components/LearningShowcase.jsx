import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

function Tab({ active, label, onClick, className = '' }) {
  const { darkMode } = useTheme();
  return (
    <button
      onClick={onClick}
      className={`${active ? 'bg-[#ea7a47] text-white' : `bg-transparent ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} border ${darkMode ? 'border-[#3a3a3a]' : 'border-gray-300'} px-5 py-2 rounded-xl transition-colors duration-300 ${className}`}
    >
      {label}
    </button>
  )
}

function Bullet({ title, description, to }) {
  const { darkMode } = useTheme();
  
  return (
    <div className="flex gap-4 items-start">
      <div className={`h-10 w-10 rounded-full ${darkMode ? 'bg-[#232323]' : 'bg-[#f5f5f5]'} flex items-center justify-center text-[#ea7a47] transition-colors duration-300`}>●</div>
      <div>
        <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300`}>{title}</h4>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-1 max-w-xl transition-colors duration-300`}>{description}</p>
        <Link to={to} className="text-[#ea7a47] text-sm mt-3 inline-flex items-center gap-2 transition-colors duration-300">Get Started <span>→</span></Link>
      </div>
    </div>
  )
}

function LearningShowcase(){
  const [active, setActive] = useState('dsa')
  const { darkMode } = useTheme();

  const content = {
    dsa: [
      { title: "DSA Sheet", description: "Your ultimate guide to mastering DSA with curated questions.", to: "/dsa" },
      { title: "Core DSA Topics", description: "Simplify complex concepts with a structured and focused approach.", to: "/dsa" },
      { title: "Problem–Solving Made Easy", description: "Solve a variety of problems to sharpen your skills and prepare for interviews", to: "/dsa" }
    ],
    system: [
      { title: "Aptitude Practice", description: "Practice quantitative, logical, and verbal questions with explanations.", to: "/aptitude-questions" },
      { title: "Topic-wise Drills", description: "Speed–distance, probability, permutations, data interpretation, and more.", to: "/aptitide-questions" },
      { title: "Timed Quizzes", description: "Simulate real tests with timers and accuracy tracking.", to: "/aptitude-questions" }
    ],
    subjects: [
      { title: "OS, DBMS, CN", description: "Concise notes and top interview questions for core CS subjects.", to: "/resources" },
      { title: "Theory to Practice", description: "Topic-wise study plans and quick revision sheets.", to: "/resources" },
      { title: "Mock Q&A", description: "Practice typical interviewer drills with crisp answers.", to: "/resources" }
    ],
    interviews: [
      { title: "Hr Round", description: "End‑to‑end prep: HR, behavioral, CS fundamentals, and projects.", to: "/hr" },
      { title: "Company Patterns", description: "Company‑wise question patterns and candidate insights.", to: "/hr" },
      { title: "Before The Round", description: "Last day checklist and how to structure strong answers.", to: "/hr" }
    ]
  }
  return (
    <section className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} py-14 px-6 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl font-extrabold text-center mb-8">Revolutionize the Way You Learn</h2>

        <div className={`${darkMode ? 'bg-[#1f1f1f] border-white/10' : 'bg-gray-100 border-gray-200'} rounded-3xl p-6 sm:p-10 border transition-colors duration-300`}>
          {/* Tabs */}
          <div className="flex gap-4 overflow-x-auto whitespace-nowrap no-scrollbar pl-2">
            <Tab active={active==='dsa'} label="DSA Sheet" onClick={() => setActive('dsa')} className="flex-shrink-0" />
            <Tab active={active==='system'} label="Aptitude Practice" onClick={() => setActive('system')} className="flex-shrink-0" />
            <Tab active={active==='subjects'} label="Core Subjects" onClick={() => setActive('subjects')} className="flex-shrink-0" />
            <Tab active={active==='interviews'} label="HR Round" onClick={() => setActive('interviews')} className="flex-shrink-0" />
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left bullets */}
            <div className="space-y-10">
              {content[active].map((b, idx) => (
                <Bullet key={idx} title={b.title} description={b.description} to={b.to} />
              ))}
            </div>

            {/* Right image placeholder */}
            <div className="w-full">
              <div className={`w-full aspect-video rounded-xl ${darkMode ? 'bg-[#0f0f0f] border-white/10' : 'bg-gray-200 border-gray-300'} border flex items-center justify-center ${darkMode ? 'text-gray-500' : 'text-gray-600'} transition-colors duration-300`}>
                {active==='dsa' ? 'DSA Screenshot' : active==='system' ? 'Aptitude Preview' : active==='subjects' ? 'Core Subjects Preview' : 'HR Round Preview'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default LearningShowcase


