import React from "react";
import { useTheme } from "../../context/ThemeContext";

const ATS = ({ score = 0, suggestions = [] }) => {
  const { darkMode } = useTheme();
  
  // Determine background gradient based on score
  const gradientClass = darkMode
    ? score > 69 
      ? "from-green-500/20 to-[#0a0a0a]" 
      : score > 49 
      ? "from-yellow-500/20 to-[#0a0a0a]" 
      : "from-red-500/20 to-[#0a0a0a]"
    : score > 69 
    ? "from-green-100 to-white" 
    : score > 49 
    ? "from-yellow-100 to-white" 
    : "from-red-100 to-white";

  // Determine icon based on score
  const iconSrc =
    score > 69
      ? "/icons/ats-good.svg"
      : score > 49
      ? "/icons/ats-warning.svg"
      : "/icons/ats-bad.svg";

  // Determine subtitle based on score
  const subtitle =
    score > 69 ? "Great Job!" : score > 49 ? "Good Start" : "Needs Improvement";

  return (
    <div
      className={`bg-gradient-to-b ${gradientClass} rounded-2xl shadow-lg w-full p-6 max-sm:p-4 border transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-xl ${
        darkMode ? 'border-gray-800' : 'border-gray-200'
      }`}
    >
      {/* Top section with icon and headline */}
      <div className="flex items-center gap-4 mb-6 max-sm:mb-4 animate-in fade-in slide-in-from-left-4 duration-500">
        <img
          src={iconSrc}
          alt="ATS Score Icon"
          className="w-12 h-12 max-sm:w-10 max-sm:h-10 animate-in zoom-in duration-500"
        />
        <div>
          <h2 className={`text-2xl max-md:text-xl max-sm:text-lg font-bold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            ATS Score - {score}/100
          </h2>
        </div>
      </div>

      {/* Description section */}
      <div className="mb-6 max-sm:mb-4">
        <h3 className={`text-xl max-md:text-lg max-sm:text-base font-semibold mb-2 ${
          darkMode ? 'text-gray-200' : 'text-gray-800'
        }`}>
          {subtitle}
        </h3>
        <p className={`mb-4 max-sm:text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          This score represents how well your resume is likely to perform in Applicant
          Tracking Systems used by employers.
        </p>

        {/* Suggestions list */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-3 max-sm:space-y-2">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 max-sm:gap-2 animate-in fade-in slide-in-from-left-4 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <img
                  src={suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                  alt={suggestion.type === "good" ? "Check" : "Warning"}
                  className="w-5 h-5 max-sm:w-4 max-sm:h-4 mt-1 flex-shrink-0"
                />
                <p
                  className={`max-sm:text-sm ${
                    suggestion.type === "good"
                      ? darkMode ? "text-green-400" : "text-green-700"
                      : darkMode ? "text-yellow-400" : "text-amber-700"
                  }`}
                >
                  {suggestion.tip}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closing encouragement */}
      <p className={`italic max-sm:text-sm ${
        darkMode ? 'text-gray-400' : 'text-gray-700'
      }`}>
        Keep refining your resume to improve your chances of getting past ATS filters and
        into the hands of recruiters.
      </p>
    </div>
  );
};

export default ATS;

