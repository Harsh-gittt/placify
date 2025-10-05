import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../context/ThemeContext";
import { FaLaptopCode, FaChartLine, FaUsers, FaBriefcase } from "react-icons/fa";

function Stat({ value, label, icon: Icon }) {
  const { darkMode } = useTheme();

  const containerClasses = [
    "rounded-3xl",
    "p-8",
    "flex",
    "flex-col",
    "items-center",
    "justify-center",
    "gap-4",
    "border",
    "transition-all",
    "duration-300",
    "hover:scale-105",
  ].join(" ");

  const lightClasses = "bg-gradient-to-b from-gray-100 to-white border-gray-200 shadow-lg text-gray-800";
  const darkClasses =
    "bg-gradient-to-b from-[#ece7e3]/10 to-[#000000]/30 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.55)] text-white";

  return (
    <div className={`${containerClasses} ${darkMode ? darkClasses : lightClasses}`}>
      {Icon ? (
        <Icon
          className={`text-5xl ${darkMode ? "text-blue-400" : "text-blue-600"}`}
          role="img"
          aria-hidden="true"
        />
      ) : (
        <div className="w-12 h-12" aria-hidden="true" />
      )}

      <div className="text-3xl font-bold">{value}</div>
      <div className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{label}</div>
    </div>
  );
}

Stat.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
};

function CommunityStats() {
  const { darkMode } = useTheme();

  const stats = [
    { value: "50K+", label: "DSA Questions Practiced", icon: FaLaptopCode },
    { value: "10K+", label: "Aptitude Tests Attempted", icon: FaChartLine },
    { value: "20K+", label: "Students Preparing with Us", icon: FaUsers },
    { value: "1K+", label: "Internships Shared", icon: FaBriefcase },
  ];

  return (
    <section
      aria-label="Community statistics"
      className={`${darkMode ? "bg-black text-white" : "bg-white text-gray-800"} py-16 px-6 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-12">Empowering Students for Career Success</h2>

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
