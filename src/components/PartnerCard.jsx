import React from "react"

function PartnerCard({ name, skills, lookingFor }) {
  return (
    <div className="bg-gray-900 border border-transparent hover:border-purple-700 rounded-xl p-6 w-72 shadow-lg flex flex-col justify-between transition">
      {/* Avatar placeholder */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
          {name.charAt(0)}
        </div>
        <h2 className="text-white text-lg font-bold">{name}</h2>
      </div>

      {/* Skills */}
      <p className="text-purple-400 font-semibold text-sm mb-2">Skills:</p>
      <p className="text-gray-300 text-sm mb-4">{skills}</p>

      {/* Looking for */}
      <p className="text-purple-400 font-semibold text-sm mb-2">Looking for:</p>
      <p className="text-gray-300 text-sm mb-6">{lookingFor}</p>

      {/* Connect Button */}
      <button className="bg-purple-700 text-white px-4 py-2 rounded-xl hover:bg-purple-800 cursor-pointer">
        Connect
      </button>
    </div>
  )
}

export default PartnerCard
