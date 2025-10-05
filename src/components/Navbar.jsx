import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/Placify3.png";
import { useTheme } from "../context/ThemeContext";

async function GetUserDetails() {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;

    const res = await fetch("http://localhost:3000/get-user-details", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      return data?.user?.first_name || null;
    }
  } catch {
    return null;
  }
}

function Navbar({ onLoginClick }) {
  const navigate = useNavigate();
  const [first_name, setFirstName] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const [showResources, setShowResources] = useState(false);
  const resourcesRef = useRef(null);

  useEffect(() => {
    (async () => {
      const name = await GetUserDetails();
      setFirstName(name);
    })();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target)) {
        setShowResources(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 w-full ${
        darkMode ? "bg-black" : "bg-white"
      } ${darkMode ? "text-white" : "text-black"} transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        {/* Left brand logo and name */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 select-none"
          onClick={() => setIsMenuOpen(false)}
        >
          <img src={logo} alt="Placify Logo" className="h-10 w-auto object-contain" />
          <span className={`${darkMode ? "text-gray-100" : "text-gray-900"} font-semibold text-base sm:text-lg`}>
            PLACIFY
          </span>
        </Link>

        {/* Right controls – flat (no inner pills), all inside the same navbar */}
        <div className="flex items-center gap-5">
          {/* Resources dropdown */}
          <div className="relative" ref={resourcesRef}>
            <button
              className="flex items-center gap-1 hover:opacity-90"
              onClick={() => setShowResources((s) => !s)}
            >
              <span>Resources</span>
              <span className="opacity-80">▾</span>
            </button>
            {showResources && (
              <div className="absolute right-0 mt-3 w-64">
                <div
                  className={`${
                    darkMode ? "bg-[#1a1a1a] text-white border-white/10" : "bg-white text-gray-800 border-gray-200"
                  } border rounded-xl shadow-2xl overflow-hidden`}
                >
                  <ul className="py-2">
                    <li>
                      <Link to="/dsa" className="block px-4 py-2 hover:bg-[#ea7a47]/10" onClick={() => setShowResources(false)}>
                        Striver's DSA Sheet
                      </Link>
                    </li>
                    <li>
                      <Link to="/resources" className="block px-4 py-2 hover:bg-[#ea7a47]/10" onClick={() => setShowResources(false)}>
                        System Design Sheet
                      </Link>
                    </li>
                    <li>
                      <Link to="/resources" className="block px-4 py-2 hover:bg-[#ea7a47]/10" onClick={() => setShowResources(false)}>
                        Core Subjects
                      </Link>
                    </li>
                    <li>
                      <Link to="/resources" className="block px-4 py-2 hover:bg-[#ea7a47]/10" onClick={() => setShowResources(false)}>
                        Interview Experiences
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center hover:opacity-90 transition-transform duration-300 hover:rotate-12"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>

          <button
            className="bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-4 py-2 rounded-2xl cursor-pointer"
            onClick={() => (onLoginClick ? onLoginClick() : navigate("/signin"))}
          >
            Login
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded-xl border border-transparent hover:border-gray-300 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <span className="sr-only">Toggle menu</span>
          <svg className={`h-6 w-6 ${darkMode ? "text-white" : "text-black"}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {isMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      <div className={`md:hidden px-4 sm:px-6 lg:px-8 pb-3 ${isMenuOpen ? "block" : "hidden"}`}>
        <div
          className={`flex flex-col gap-3 rounded-2xl border ${
            darkMode ? "border-gray-700 bg-[#0a0a0a]" : "border-gray-200 bg-white"
          } p-3`}
        >
          <button
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
            onClick={() => setIsMenuOpen(false)}
          >
            Resources
          </button>
          <button
            onClick={() => {
              toggleTheme();
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "Light mode ☀️" : "Dark mode 🌙"}
          </button>
          <button
            className="bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-5 py-2 rounded-2xl cursor-pointer"
            onClick={() => {
              setIsMenuOpen(false);
              onLoginClick ? onLoginClick() : navigate("/signin");
            }}
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
