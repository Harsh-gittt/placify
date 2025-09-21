// Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
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
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      // optional: check res.ok / response status
      alert("Signup Successful ✅. Redirecting to Signin Page.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Signup Failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* Outer wrapper - black background */}
      <div className="min-h-screen bg-black text-gray-100 py-10">
        {/* Centering container with responsive horizontal padding */}
        <div className="mx-4 sm:mx-6 md:mx-8 lg:mx-[6rem] flex justify-center">
          {/* Card: full-width on small screens, capped width on larger */}
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
            aria-labelledby="signup-heading"
          >
            {/* Close button anchored to top-right, scales on small screens */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-600 hover:text-gray-800 rounded-md p-1
                         bg-white/0 hover:bg-white/30 transition"
              aria-label="Close signup"
            >
              <span className="text-lg sm:text-xl">✖</span>
            </button>

            {/* Heading */}
            <h2
              id="signup-heading"
              className="text-lg sm:text-2xl font-semibold mb-4 text-center text-purple-600"
            >
              Create your account
            </h2>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* name fields: single column on xs, two columns on sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="First name"
                    required
                    className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                  />
                </label>

                <label className="block">
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Last name"
                    required
                    className="w-full px-3 py-2 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
                  />
                </label>
              </div>

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
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>

            {/* small footer text */}
            <p className="text-xs sm:text-sm text-center text-gray-500 mt-3">
              By signing up you agree to our terms.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
