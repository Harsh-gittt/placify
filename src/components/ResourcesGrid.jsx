import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import dsaImg from "../assets/images/resources/dsa questions.png";
import studyPartnerImg from "../assets/images/resources/study partner.png";
import aptitudeImg from "../assets/images/resources/aptitude questions.png";
import coreSubjectsImg from "../assets/images/resources/core subjects.png";
import hrImg from "../assets/images/resources/hr round questions.png";
import resumeImg from "../assets/images/resources/fix your resume.png";

function ResourceCard({ title, subtitle, to, bg, image }) {
  const { darkMode } = useTheme();

  const containerClass = `${
    darkMode
      ? "bg-[#121212] border border-white/10"
      : "bg-white border border-gray-200"
  } group rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition-all duration-300 cursor-pointer hover:shadow-[0_12px_50px_rgba(0,0,0,0.35)]`;

  return (
    <Link to={to} className="block">
      <div className={containerClass}>
        <div className={`h-48 sm:h-56 flex items-center justify-center overflow-hidden bg-${bg}`}>
          <img src={image} alt={title} className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-105" />
        </div>
        <div
          className={`${darkMode ? "bg-[#1b1b1b]" : "bg-[#f5f5f5]"} p-6 transition-colors duration-300`}
        >
          <h3
            className={`text-lg font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}
          >
            {title}
          </h3>
          <p
            className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} mt-2`}
          >
            {subtitle}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ResourcesGrid() {
  const { darkMode } = useTheme();

  const items = [
    { title: "DSA Questions", subtitle: "Practice structured DSA questions and level up", to: "/dsa", bg: "[#E57C54]", image: dsaImg },
    { title: "Study Partner", subtitle: "Team up and learn together effectively", to: "/study-partner", bg: "[#59A6E8]", image: studyPartnerImg },
    { title: "Aptitude Questions", subtitle: "Sharpen your quantitative and logical skills", to: "/resources", bg: "[#3B9D91]", image: aptitudeImg },
    { title: "Core Subjects", subtitle: "OS, DBMS, CN – concise notes and Q&A", to: "/resources", bg: "[#9B7AE1]", image: coreSubjectsImg },
    { title: "HR Round Questions", subtitle: "Prepare smart answers for behavioral rounds", to: "/hr", bg: "[#D6AE57]", image: hrImg },
    { title: "Fix Your Resume", subtitle: "Optimize your resume to get more interviews", to: "/resources", bg: "[#D6666A]", image: resumeImg },
  ]

  return (
    <section
      className={`${darkMode ? "bg-black text-white" : "bg-white text-gray-800"} py-10 px-6 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl sm:text-6xl font-extrabold text-center mb-10">
          Resources to Learn
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((i, idx) => (
            <ResourceCard key={idx} {...i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ResourcesGrid;
