import React from "react";
import { useTheme } from "../context/ThemeContext"; // ✅ Import theme

function PartnerCard({
  id,
  name,
  skills,
  lookingFor,
  email,
  onConnect,
  connectionStatus,
}) {
  const { darkMode } = useTheme(); // ✅ Use theme hook

  // Render skills as comma-separated if array
  const skillsText = Array.isArray(skills) ? skills.join(", ") : skills;

  return (
    <div
      className={`border rounded-2xl p-6 w-72 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between ${
        darkMode
          ? "bg-[#18181b] border-gray-800 text-white"
          : "bg-white border-gray-200 text-gray-900"
      }`}
    >
      {/* Profile Section */}
      <div className="flex items-center gap-4 mb-4">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3
            className={`font-bold text-lg ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {name}
          </h3>
          <p className="text-sm text-gray-500">Study Partner</p>
        </div>
      </div>

      {/* Skills Section */}
      <div className="mb-4">
        <p
          className={`text-sm font-semibold mb-2 ${
            darkMode ? "text-orange-400" : "text-orange-600"
          }`}
        >
          Skills:
        </p>
        <div className="flex flex-wrap gap-2">
          {skillsText.split(",").map((skill, index) => (
            <span
              key={index}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                darkMode
                  ? "bg-orange-900/30 text-orange-400"
                  : "bg-orange-100 text-orange-600"
              }`}
            >
              {skill.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Looking For Section */}
      <div className="mb-6">
        <p
          className={`text-sm font-semibold mb-2 ${
            darkMode ? "text-orange-400" : "text-orange-600"
          }`}
        >
          Looking For:
        </p>
        <p
          className={`text-sm ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {lookingFor}
        </p>
      </div>

      {/* Connect Button or Status */}
      <div className="mt-auto">
        {connectionStatus === "pending" ? (
          <button
            className="w-full bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg cursor-not-allowed opacity-70"
            disabled
          >
            Request Sent ⏳
          </button>
        ) : connectionStatus === "accepted" ? (
          <button
            className="w-full bg-green-500 text-white font-semibold px-4 py-2 rounded-lg cursor-default"
            disabled
          >
            Connected ✓
          </button>
        ) : (
          <button
            className="w-full bg-orange-400 hover:bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            onClick={() => onConnect && onConnect(id)}
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}

export default PartnerCard;
