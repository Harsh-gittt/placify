// HeroSection.jsx
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { API_BASE_URL } from "../lib/apiBaseUrl";

const rotatingItems = [
  { label: "DSA Sheet", className: "text-teal-400" },
  { label: "Interview Insights", className: "text-purple-400" },
  { label: "CS Subjects", className: "text-amber-400" },
  { label: "CP Sheets", className: "text-sky-400" },
];

function AuthSection({ onSignup, onSignin }) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-start justify-center gap-3 sm:gap-4">
      <button
        className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-xl cursor-pointer"
        onClick={onSignup}
      >
        New User
      </button>
      <button
        className="w-full sm:w-auto border border-white text-white px-6 py-2 rounded-xl hover:bg-white hover:text-black cursor-pointer"
        onClick={onSignin}
      >
        Existing User
      </button>
    </div>
  );
}

// Returns first_name of the user if user exists. If user doesn't exist return NULL.
async function GetUserDetails() {
  try {
    const token = localStorage.getItem("auth_token");
    console.log("[GetUserDetails] token:", token);
    if (!token) {
      return null;
    }

    const res = await fetch(`${API_BASE_URL}/get-user-details`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`,
      },
    });
   if (res.ok) {
      const data = await res.json(); 
      return data?.user?.first_name || null ; 
    }
  } catch {
    return null;
  }
}

function HeroSection({ onOpenSignin, onOpenSignup }) {
  const { darkMode } = useTheme();
  const [first_name, setFirstName] = useState(null);
  const [checking, setChecking] = useState(true);
  const [rotIdx, setRotIdx] = useState(0);

  async function checkUser() {
    const first_name = await GetUserDetails();
    setFirstName(first_name);
    setChecking(false);
  }
  
  useEffect(() => {
    checkUser();
  },[])

  useEffect(() => {
    const id = setInterval(() => {
      setRotIdx((i) => (i + 1) % rotatingItems.length);
    }, 2000);
    return () => clearInterval(id);
  }, [])

  return (
    <section className={`${darkMode ? 'bg-black text-white' : 'bg-white text-black'} py-14 sm:py-20 px-4 sm:px-6 relative transition-colors duration-300`}>
      {/* Decorative Elements */}
      <div className="hidden sm:block absolute top-10 right-10 text-orange-400 text-6xl opacity-60">✦</div>
      <div className="hidden sm:block absolute bottom-20 left-10 text-orange-500 text-6xl">✦</div>
      <div className="hidden sm:block absolute bottom-10 right-10 text-orange-500 text-4xl">+</div>
      
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          <span className={`block ${darkMode ? 'text-white' : 'text-black'}`}>Advance Your Career with</span>
          <span className={`block mt-2 ${rotatingItems[rotIdx].className}`}>{rotatingItems[rotIdx].label}</span>
        </h1>

        {/* Sub-headline with Top 1% badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <span className={`${darkMode ? 'text-white' : 'text-black'} text-lg sm:text-2xl`}>Join the</span>
          <div className="bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-full">
            <span className="font-bold">Top 1%</span>
          </div>
          <span className={`${darkMode ? 'text-white' : 'text-black'} text-lg sm:text-2xl`}>Today</span>
        </div>

        {/* Descriptive Text */}
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-base sm:text-xl max-w-4xl mx-auto mb-8 sm:mb-12`}>
          Master DSA with curated resources and expert guidance – Learn the skills that set you apart and join the Top 1% of coding achievers!
        </p>

        {/* Conditional Rendering for logged in users */}
        {checking ? (
          <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-8`}>Checking user...</div>
        ) : first_name ? (
          <div className="mt-8">
            <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
              Welcome back, <span className="text-orange-500">{first_name}</span> 👋
            </p>
          </div>
        ) : (
          <AuthSection onSignin={onOpenSignin} onSignup={onOpenSignup} />
        )}
      </div>
    </section>
  );
}

export default HeroSection;
