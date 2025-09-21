import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
      return data?.user?.first_name || null;
    }
  } catch (err) {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();

  const [first_name, setFirstName] = useState(null);

  async function checkUser() {
    const first_name = await GetUserDetails();
    setFirstName(first_name);
  }

  useEffect(() => {
    checkUser();
  }, []);

  return (
    <nav className="bg-black text-white px-6 py-4 flex items-center justify-between shadow-[0_2px_4px_rgba(255,255,255,0.1)]">
      {/* Logo */}
      <div className="text-2xl font-bold">MyLogo</div>

      {/* Navigation Links */}
      <div className="flex space-x-8">
        <Link to="/" className="hover:text-purple-700">
          Home
        </Link>
        <Link to="/dsa" className="hover:text-purple-700">
          DSA
        </Link>
        <Link to="/study-partner" className="hover:text-purple-700">
          Study Partner
        </Link>
        <Link to="/internships" className="hover:text-purple-700">
          Internships
        </Link>
        <Link to="/resources" className="hover:text-purple-700">
          Resources
        </Link>
      </div>

      {/* Signup Button */}
      {first_name ? (
        <p className="text-xl sm:text-xl font-semibold">
          Hi <span className="text-purple-600">{first_name}</span>
        </p>
      ) : (
        <button
          className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm px-4 py-2 rounded-2xl cursor-pointer"
          onClick={() => navigate("signin")}
        >
          Sign In
        </button>
      )}
    </nav>
  );
}

export default Navbar;
