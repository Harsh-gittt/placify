import React from "react";

const ATS = ({ score = 0, suggestions = [] }) => {
  // Determine background gradient based on score
  const gradientClass =
    score > 69 ? "from-green-100" : score > 49 ? "from-yellow-100" : "from-red-100";

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
      className={`bg-gradient-to-b ${gradientClass} to-white rounded-2xl shadow-md w-full p-6 max-sm:p-4`}
    >
      {/* Top section with icon and headline */}
      <div className="flex items-center gap-4 mb-6 max-sm:mb-4">
        <img
          src={iconSrc}
          alt="ATS Score Icon"
          className="w-12 h-12 max-sm:w-10 max-sm:h-10"
        />
        <div>
          <h2 className="text-2xl max-md:text-xl max-sm:text-lg font-bold">
            ATS Score - {score}/100
          </h2>
        </div>
      </div>

      {/* Description section */}
      <div className="mb-6 max-sm:mb-4">
        <h3 className="text-xl max-md:text-lg max-sm:text-base font-semibold mb-2">
          {subtitle}
        </h3>
        <p className="text-gray-600 mb-4 max-sm:text-sm">
          This score represents how well your resume is likely to perform in Applicant
          Tracking Systems used by employers.
        </p>

        {/* Suggestions list */}
        {suggestions && suggestions.length > 0 && (
          <div className="space-y-3 max-sm:space-y-2">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 max-sm:gap-2">
                <img
                  src={suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                  alt={suggestion.type === "good" ? "Check" : "Warning"}
                  className="w-5 h-5 max-sm:w-4 max-sm:h-4 mt-1 flex-shrink-0"
                />
                <p
                  className={`${
                    suggestion.type === "good" ? "text-green-700" : "text-amber-700"
                  } max-sm:text-sm`}
                >
                  {suggestion.tip}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Closing encouragement */}
      <p className="text-gray-700 italic max-sm:text-sm">
        Keep refining your resume to improve your chances of getting past ATS filters and
        into the hands of recruiters.
      </p>
    </div>
  );
};

export default ATS;

