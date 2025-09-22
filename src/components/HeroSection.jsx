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
    <section className="bg-black text-white py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
        {/* Text Content */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-6xl font-extrabold leading-tight">
            <span className="block underline decoration-purple-700">
              PLACIFY
            </span>
            <br />
            <span className="block text-purple-700 font-semibold text-3xl">
              YOUR PATH TO PLACEMENT & INTERNSHIPS
            </span>
          </h1>

          <p className="text-gray-300 max-w-xl">
            Unlock your career potential. Access placement resources and direct
            links to internships and jobs.
          </p>

          {/* Conditional Rendering. IF checking is true then checking user will render. ELSE IF first_name is not null welcome back code will render or ELSE 
          Our Auth Section will run (new user / existing user button wala.)
          */}
          <div className="mt-4">
            {checking ? (
              <div className="text-gray-400">Checking user...</div>
            ) : first_name ? (
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-lg sm:text-xl font-semibold">
                    Welcome back,{" "}
                    <span className="text-purple-600">{first_name}</span> 👋
                  </p>
                  <p className="text-sm text-gray-300">
                    Good to see you again.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleLogout}
                    className="border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-black"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <>
                <AuthSection />
              </>
            )}
          </div>
        </div>

        {/* Image */}
        <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center">
          <img
            src={HeroImage}
            alt="Placify Hero"
            className="w-full max-w-md object-contain"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
