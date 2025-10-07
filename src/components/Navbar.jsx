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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    async function fetchAndSetName() {
      const name = await GetUserDetails();
      setFirstName(name);
    }

    fetchAndSetName();

    function handleAuthUpdate() {
      fetchAndSetName();
    }

    window.addEventListener('auth:update', handleAuthUpdate);
    return () => window.removeEventListener('auth:update', handleAuthUpdate);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target)) {
        setShowResources(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') {
        setShowResources(false);
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    }
  }, []);

  function handleSignOut() {
    try {
      localStorage.removeItem('auth_token');
    } catch {}
    setFirstName(null);
    setShowUserMenu(false);
    window.dispatchEvent(new Event('auth:update'));
    navigate('/');
  }

  return (
    <nav className={`fixed top-3 inset-x-0 z-40 w-full bg-transparent ${darkMode ? 'text-white' : 'text-black'} transition-colors duration-300`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 ${darkMode ? 'bg-[#232323]' : 'bg-gray-200'} px-4 rounded-2xl transition-colors duration-300 flex items-center justify-between`}>
        {/* Left brand logo and name */}
        <Link to="/" className={`flex items-center gap-3 py-2 rounded-2xl transition-colors duration-300`}>
          <img 
            src={logo} 
            alt="Placify Logo" 
            className="h-11 rounded-lg object-cover"
          />
          <span className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} font-medium text-xl transition-colors duration-300`}>PLACIFY</span>
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

          {first_name ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((s) => !s)}
                className={`h-10 w-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-[#232323] text-white' : 'bg-gray-200 text-gray-800'} hover:opacity-90`}
                aria-haspopup="menu"
                aria-expanded={showUserMenu ? 'true' : 'false'}
                title={`Hi, ${first_name}`}
              >
                <span aria-hidden>🙋</span>
                <span className="sr-only">Open user menu</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-72">
                  <div className={`${darkMode ? 'bg-[#1a1a1a] text-white border-white/10' : 'bg-white text-gray-800 border-gray-200'} border rounded-xl shadow-2xl overflow-hidden`}> 
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
                      <div className={`${darkMode ? 'bg-[#232323]' : 'bg-gray-200'} h-12 w-12 rounded-full flex items-center justify-center text-xl`}>👤</div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">Hi, {first_name}</div>
                      </div>
                      <button className="ml-auto opacity-70 hover:opacity-100" onClick={() => setShowUserMenu(false)} aria-label="Close user menu">✖</button>
                    </div>
                    <ul className="py-2">
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-[#ea7a47]/10 flex gap-2 items-center"
                          onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                        >
                          <span>👤</span>
                          <span>Profile</span>
                        </button>
                      </li>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-[#ea7a47]/10 flex gap-2 items-center"
                          onClick={handleSignOut}
                        >
                          <span>↪</span>
                          <span>Sign Out</span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-5 py-2 rounded-2xl cursor-pointer"
              onClick={() => (onLoginClick ? onLoginClick() : navigate("/signin"))}
            >
              Login
            </button>
          )}
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
