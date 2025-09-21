// Signin.jsx
import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";


export default function Signin() {
 
  const Navigate = useNavigate();
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

      console.log("hey");

      // Optionally check response status
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("auth_token", data.auth_token);
        alert("Signin successful ✅. Redirecting to home.");
        Navigate("/");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Signin failed");
      }
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-black text-gray-100 py-10">
        <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-[6rem] flex justify-center">
          <div
            className="
              relative
              w-full
              max-w-full
              sm:max-w-md
              md:max-w-lg
              lg:max-w-xl
              bg-white
              text-gray-900
              rounded-2xl
              shadow-[0_10px_30px_rgba(0,0,0,0.6)]
              p-5
              sm:p-6
              md:p-8
              overflow-hidden
            "
            role="region"
            aria-labelledby="signin-heading"
          >
            <button
              type="button"
              onClick={() => Navigate("/")}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-800 rounded-md p-1
                         bg-white/0 hover:bg-white/30 transition"
              aria-label="Close signin"
            >
              <span className="text-lg sm:text-xl">✖</span>
            </button>

            <h2
              id="signin-heading"
              className="text-lg sm:text-2xl font-semibold mb-4 text-center text-purple-600"
            >
              Sign In
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <label className="block">
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
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
                  className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 sm:py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="text-xs sm:text-sm text-center text-gray-500 mt-3">
              Don't have an account?{" "}
              <span
                className="text-purple-600 cursor-pointer underline"
                onClick={() => Navigate("/signup")}
              >
                Create one
              </span>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
