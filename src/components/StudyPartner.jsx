import React, { useState } from "react"
import SearchBar from "./SearchBar"
import PartnerCard from "./PartnerCard"
import BePartner from "./BePartner"
import Navbar from "./Navbar"
import { useTheme } from '../context/ThemeContext'

function StudyPartner() {
  const [searchTerm, setSearchTerm] = useState("")
  const [subject, setSubject] = useState("")
  const { darkMode, toggleTheme } = useTheme();

  // Example partner data
  const partners = [
    { name: "Ananya Sharma", skills: "DSA, Web Dev", lookingFor: "Coding Practice, Project Work" },
    { name: "Rajesh Patel", skills: "Machine Learning", lookingFor: "Project Work, Theory Discussions" },
    { name: "Chloe Kim", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Puneet superstar", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Vivek Chauhan", skills: "DSA, Web Dev", lookingFor: "Coding Practice, Project Work" },
    { name: "Ram Kumar", skills: "Machine Learning", lookingFor: "Project Work, Theory Discussions" },
    { name: "Kiran Bedi", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Sonia Gandhi", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Aman Pandit", skills: "DSA, Web Dev", lookingFor: "Coding Practice, Project Work" },
    { name: "Sundar Pichai", skills: "Machine Learning", lookingFor: "Project Work, Theory Discussions" },
  ]

  // Search filter logic
  const filteredPartners = partners.filter((p) => {
    return (
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.skills.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (subject === "" || p.skills.toLowerCase().includes(subject.toLowerCase()))
    )
  })

  return (
    <div className={`${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'} min-h-screen`}>
      <Navbar />

      {/* Become a Partner Section */}
      <BePartner />

      <div className="p-8 space-y-8">
      {/* Search bar */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        subject={subject}
        setSubject={setSubject}
        onSearch={() => {}}
        onClear={() => {
          setSearchTerm("")
          setSubject("")
        }}
      />

      {/* Partner cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center w-full">
        {filteredPartners.map((partner, index) => (
          <PartnerCard
            key={index}
            name={partner.name}
            skills={partner.skills}
            lookingFor={partner.lookingFor}
          />
        ))}
      </div>

    </div>
    </div>

    
  )
}

export default StudyPartner
