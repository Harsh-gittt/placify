import React from "react";

function PartnerCard({
  id,
  name,
  skills,
  lookingFor,
  email,
  onConnect,
  connectionStatus,
}) {
  // Render skills as comma-separated if array
  const skillsText = Array.isArray(skills) ? skills.join(", ") : skills;
  return (
    <div className={`border rounded-xl p-6 w-72 shadow-lg flex flex-col justify-between transition-colors duration-300 ${darkMode ? 'bg-[#1f1f1f] border-orange-400 text-white' : 'bg-white border-orange-200 text-gray-900'}`}>
      {/* Avatar placeholder */}
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${darkMode ? 'bg-orange-400 text-white' : 'bg-orange-400 text-white'}`}>{name.charAt(0)}</div>
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{name}</h2>
      </div>
      {/* Skills */}
      <p className="text-purple-400 font-semibold text-sm mb-2">Skills:</p>
      <p className="text-gray-300 text-sm mb-4">{skillsText}</p>
      {/* Looking for */}
      <p className="text-purple-400 font-semibold text-sm mb-2">Looking for:</p>
      <p className="text-gray-300 text-sm mb-6">{lookingFor}</p>
      {/* Connect Button or Status */}
      {connectionStatus === "pending" ? (
        <button
          className="bg-orange-400 text-white px-4 py-2 rounded-xl cursor-not-allowed opacity-70"
          disabled
        >
          Request Sent
        </button>
      ) : connectionStatus === "accepted" ? (
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-xl cursor-default"
          disabled
        >
          Connected
        </button>
      ) : (
        <button
          className="bg-purple-700 text-white px-4 py-2 rounded-xl hover:bg-purple-800 cursor-pointer"
          onClick={() => onConnect && onConnect(id)}
        >
          Connect
        </button>
      )}
    </div>
  );
}

export default PartnerCard;
