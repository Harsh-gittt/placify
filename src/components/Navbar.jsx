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
  } catch {
    return null;
  }
}

function Navbar() {
  const navigate = useNavigate();
  const [first_name, setFirstName] = useState(null);

  useEffect(() => {
    (async () => {
      const name = await GetUserDetails();
      setFirstName(name);
    })();
  }, []);

  return (
    <nav className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left brand pill */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-3 bg-[#232323] px-4 py-2 rounded-2xl"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0d0d0d] font-extrabold">TUF</span>
          <span className="text-gray-200 font-medium">takeUforward</span>
        </button>

        {/* Right controls – flat (no inner pills), all inside the same navbar */}
        <div className="flex items-center gap-5">
          <span className="hidden sm:inline font-extrabold">TUF</span>

          <button className="flex items-center gap-1 hover:opacity-90">
            <span>Resources</span>
            <span className="opacity-80">▾</span>
          </button>

          <button className="h-8 w-8 flex items-center justify-center hover:opacity-90">🌙</button>

          <button
            className="bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-5 py-2 rounded-2xl cursor-pointer"
            onClick={() => navigate("/signin")}
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
