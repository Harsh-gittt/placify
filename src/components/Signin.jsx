import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";

export default function Signin({ isOpen, onClose, openSignup }) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
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
      const res = await fetch("http://localhost:3000/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("auth_token", data.auth_token);
        alert("Signin successful ✅");
        // ✅ FIX: Clear form and close modal
        setFormData({ email: "", password: "" });
        onClose?.();
        // Optionally redirect or update app state
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Signin failed ❌");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={`max-w-md w-full mx-4 ${
          darkMode ? "bg-black rounded-2xl" : "bg-white rounded-2xl"
        } transition-colors duration-300 p-4`}
      >
        <div className="max-w-md mx-auto">
          <div
            className={`
              relative
              w-full
              rounded-2xl
              ${darkMode ? "bg-black text-white" : "bg-white text-gray-900"}
              shadow-lg
              overflow-hidden
              transition-colors duration-300
              p-8
            `}
            role="region"
            aria-labelledby="signin-heading"
          >
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-4 right-4 ${
                darkMode
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-600 hover:text-gray-800"
              } rounded-md p-1
                         hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-300`}
              aria-label="Close signin"
            >
              <span className="text-xl">✖</span>
            </button>

            <div className="text-center mb-8">
              <h2
                id="signin-heading"
                className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                } transition-colors duration-300`}
              >
                Welcome Back
              </h2>
              <p
                className={`mt-2 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                } transition-colors duration-300`}
              >
                Sign in to your Placify account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-5">
                <label className="block">
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                    className={`w-full px-4 py-3 text-base rounded-lg focus:outline-none transition-colors duration-300
                    ${
                      darkMode
                        ? "bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                        : "bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-600 focus:border-blue-600"
                    }`}
                  />
                </label>

                <label className="block">
                  <input
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    className={`w-full px-4 py-3 text-base rounded-lg focus:outline-none transition-colors duration-300
                    ${
                      darkMode
                        ? "bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                        : "bg-gray-50 border border-gray-300 text-gray-900 focus:ring-blue-600 focus:border-blue-600"
                    }`}
                  />
                </label>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className={`h-4 w-4 rounded ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-100 border-gray-300"
                      }`}
                    />
                    <label
                      htmlFor="remember-me"
                      className={`ml-2 text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Remember me
                    </label>
                  </div>
                  <a
                    href="#"
                    className={`text-sm font-medium ${
                      darkMode
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
                    } transition-colors duration-300`}
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-medium text-white transition-all duration-300
                  ${
                    loading
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:shadow-lg transform hover:-translate-y-0.5"
                  } 
                  ${
                    darkMode
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      : "bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            <div
              className={`mt-6 text-center ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              <p className="text-sm">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    onClose?.();
                    openSignup?.();
                  }}
                  className={`font-medium transition-colors duration-300 ${
                    darkMode
                      ? "text-orange-400 hover:text-orange-300"
                      : "text-orange-500 hover:text-orange-600"
                  }`}
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
