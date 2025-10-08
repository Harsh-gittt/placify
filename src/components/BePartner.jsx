import React from "react"

function BePartner() {
  return (
    <div className={`rounded-xl p-8 text-center mt-10 transition-colors duration-300 `}>
      <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        Want to be a Study Partner?
      </h2>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
        Help others and enhance your own knowledge
      </p>
      <button className="bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl hover:bg-purple-800 cursor-pointer">
        Become a Partner
      </button>
    </div>
  );
}

export default BePartner;
