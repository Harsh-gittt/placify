// HeroSection.jsx
import React, { useEffect, useState, useCallback } from "react";
import HeroImage from "../assets/images/hero section image.png";
import { useNavigate } from "react-router-dom";

// ye code change kara tha ki agar user logged in nahi h to ye section render hoga nahi to welcome first_name render hoga niche main component m uska code h.
function AuthSection() {
  const navigate = useNavigate();
  return (
    <div className="space-x-4 flex flex-col sm:flex-row items-center sm:items-start">
      <button
        className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-2 rounded-xl cursor-pointer"
        onClick={() => navigate("/signup")}
      >
        New User
      </button>
      <button
        className="border border-white text-white px-6 py-2 rounded-xl hover:bg-white hover:text-black cursor-pointer mt-3 sm:mt-0"
        onClick={() => navigate("/signin")}
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

    const res = await fetch("http://localhost:3000/get-user-details", {
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
  } catch (err) {
    return null;
  }
}

function HeroSection() {

  const [first_name, setFirstName] = useState(null);
  const [checking, setChecking] = useState(true);

  async function checkUser() {
    const first_name = await GetUserDetails();
    setFirstName(first_name);
    setChecking(false);
  }
  
  useEffect(() => {
    checkUser();
  },[])

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setFirstName(null);
    window.location.reload();
  };

  return (
    <section className="bg-black text-white py-20 px-6 relative">
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 text-orange-400 text-6xl opacity-60">✦</div>
      <div className="absolute bottom-20 left-10 text-orange-500 text-6xl">✦</div>
      <div className="absolute bottom-10 right-10 text-orange-500 text-4xl">+</div>
      
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Headline */}
        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-6">
          <span className="block text-white">Advance Your Career with</span>
          <span className="block text-teal-400 mt-2">CP Sheets</span>
        </h1>

        {/* Sub-headline with Top 1% badge */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <span className="text-white text-2xl">Join the</span>
          <div className="bg-orange-500 text-white px-6 py-2 rounded-full">
            <span className="font-bold">Top 1%</span>
          </div>
          <span className="text-white text-2xl">Today</span>
        </div>

        {/* Descriptive Text */}
        <p className="text-gray-300 text-xl max-w-4xl mx-auto mb-12">
          Master DSA with curated resources and expert guidance – Learn the skills that set you apart and join the Top 1% of coding achievers!
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button className="bg-gray-800 border border-gray-600 text-white px-8 py-4 rounded-lg hover:bg-gray-700 flex items-center space-x-2">
            <span>Start for Free</span>
            <span>⌄</span>
          </button>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold">
            Explore Plus
          </button>
        </div>

        {/* Conditional Rendering for logged in users */}
        {checking ? (
          <div className="text-gray-400 mt-8">Checking user...</div>
        ) : first_name ? (
          <div className="mt-8">
            <p className="text-lg font-semibold text-white">
              Welcome back, <span className="text-orange-500">{first_name}</span> 👋
            </p>
            <button
              onClick={handleLogout}
              className="mt-4 border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-black"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default HeroSection;
