import React from "react";
import { useTheme } from "../context/ThemeContext"; // ✅ Add import

function BePartner({ onBecomePartner }) {
  const { darkMode } = useTheme(); // ✅ Add hook

  return (
    <div
      className={`rounded-2xl p-8 text-center mt-10 transition-colors duration-300 ${
        darkMode
          ? "bg-gradient-to-br from-[#18181b] to-[#23232a] border border-gray-800"
          : "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
      }`}
    >
      <h2
        className={`text-3xl font-bold mb-4 ${
          darkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Want to be a Study Partner?
      </h2>
      <p
        className={`text-lg mb-6 ${
          darkMode ? "text-gray-300" : "text-gray-600"
        }`}
      >
        Help others and enhance your own knowledge by connecting with fellow learners
      </p>
      <button
        onClick={onBecomePartner}
        className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
      >
        Become a Partner 🚀
      </button>
    </div>
  );
}

export default BePartner;

