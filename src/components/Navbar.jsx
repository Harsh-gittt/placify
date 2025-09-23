import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/placify2.jpg";

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
  } catch (err) {
    console.error(err);
    return null;
  }
}

export default function Navbar() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState(null);

  useEffect(() => {
    (async () => {
      const name = await GetUserDetails();
      setFirstName(name);
    })();
  }, []);

  // ✅ Function to go home and refresh
  const handleLogoClick = () => {
    navigate("/");         // go to home route
    window.location.reload(); // force refresh
  };

  return (
    <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-[0_2px_4px_rgba(255,255,255,0.1)]">
      {/* Logo (click to refresh and go home) */}
      <button
        onClick={handleLogoClick}
        className="flex items-center focus:outline-none"
      >
        <img src={logo} alt="Placify Logo" className="h-12" />
      </button>

      {/* Navigation Links */}
      <div className="flex space-x-9">
        <Link to="/" className="hover:text-purple-700">Home</Link>
        <Link to="/dsa" className="hover:text-purple-700">DSA</Link>
        <Link to="/study-partner" className="hover:text-purple-700">Study Partner</Link>
        <Link to="/internships" className="hover:text-purple-700">Internships</Link>
        <Link to="/resources" className="hover:text-purple-700">Resources</Link>
      </div>

      {/* Sign In or Greeting */}
      {firstName ? (
        <p className="text-xl font-semibold">
          Hi <span className="text-purple-600">{firstName}</span>
        </p>
      ) : (
        <button
          className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm px-4 py-2 rounded-2xl"
          onClick={() => navigate("/signin")}
        >
          Sign In
        </button>
      )}
    </nav>
  );
}
