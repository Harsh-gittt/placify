import React, { useEffect, useState } from "react";
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
  const { darkMode, toggleTheme } = useTheme();

  useEffect(() => {
    (async () => {
      const name = await GetUserDetails();
      setFirstName(name);
    })();
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-40 w-full ${darkMode ? 'bg-black' : 'bg-white'} ${darkMode ? 'text-white' : 'text-black'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left brand logo and name */}
        <Link to="/" className={`flex items-center gap-3 ${darkMode ? 'bg-[#232323]' : 'bg-gray-200'} px-4 py-2 rounded-2xl transition-colors duration-300`}>
          <img 
            src={logo} 
            alt="Placify Logo" 
            className="h-11 rounded-lg object-cover"
          />
          <span className={`${darkMode ? 'text-gray-200' : 'text-gray-800'} font-medium text-xl transition-colors duration-300`}>PLACIFY</span>
        </Link>

        {/* Right controls – flat (no inner pills), all inside the same navbar */}
        <div className="flex items-center gap-5">
          {/* <span className="hidden sm:inline font-extrabold">TUF</span> */}

          <button className="flex items-center gap-1 hover:opacity-90">
            <span>Resources</span>
            <span className="opacity-80">▾</span>
          </button>

          <button 
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center hover:opacity-90 transition-transform duration-300 hover:rotate-12"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? '🌙' : '☀️'}
          </button>

          <button
            className="bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-5 py-2 rounded-2xl cursor-pointer"
            onClick={() => (onLoginClick ? onLoginClick() : navigate("/signin"))}
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
