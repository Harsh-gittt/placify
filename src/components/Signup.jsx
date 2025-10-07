import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Signup({ isOpen, onClose, openSignin }) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // ✅ FIX: Proper response handling
      if (res.ok) {
        const data = await res.json();
        alert("Signup Successful ✅");
        // ✅ FIX: Clear form and close modal
        setFormData({ first_name: "", last_name: "", email: "", password: "" });
        onClose?.();
        openSignin?.(); // Open signin modal
      } else {
        const error = await res.json();
        alert(error.message || "Signup Failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // ✅ FIX: Added proper backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[10px]">
      <div className={`max-w-md w-full mx-4 ${darkMode ? 'bg-black rounded-2xl' : 'bg-white rounded-2xl'} transition-colors duration-300 p-4`}>
        <div className="max-w-md mx-auto">
          <div
            className={`
              relative
              w-full
              rounded-2xl
              ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}
              shadow-lg
              overflow-hidden
              transition-colors duration-300
              p-8
            `}
            role="region"
            aria-labelledby="signup-heading"
          >
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} rounded-md p-1
                         hover:bg-opacity-10 hover:bg-gray-600 transition-colors duration-300`}
              aria-label="Close signup"
            >
              <span className="text-xl">✖</span>
            </button>

            <div className="text-center mb-8">
              <h2
                id="signup-heading"
                className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}
              >
                Join Placify
              </h2>
              <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} transition-colors duration-300`}>
                Create your account to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                    className={`w-full px-4 py-3 text-base rounded-lg focus:outline-none transition-colors duration-300
                    ${darkMode 
                      ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-600 focus:border-blue-600'}`}
                  />
                </label>

                <label className="block">
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    required
                    className={`w-full px-4 py-3 text-base rounded-lg focus:outline-none transition-colors duration-300
                    ${darkMode 
                      ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-600 focus:border-blue-600'}`}
                  />
                </label>
              </div>

              <label className="block">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className={`w-full px-4 py-3 text-base rounded-lg focus:outline-none transition-colors duration-300
                  ${darkMode 
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-600 focus:border-blue-600'}`}
                />
              </label>

              <label className="block">
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password (min 6 characters)"
                  required
                  minLength="6"
                  className={`w-full px-4 py-3 text-base rounded-lg focus:outline-none transition-colors duration-300
                  ${darkMode 
                    ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-600 focus:border-blue-600'}`}
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium text-white transition-all duration-300
                ${loading 
                  ? 'opacity-70 cursor-not-allowed' 
                  : 'hover:shadow-lg transform hover:-translate-y-0.5'} 
                ${darkMode 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' 
                  : 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600'}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <div className={`mt-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <p className="text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => { onClose?.(); openSignin?.(); }}
                  className={`font-medium transition-colors duration-300 ${darkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-500 hover:text-orange-700'}`}
                >
                  Sign in
                </button>
              </p>
              <p className={`text-xs mt-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
