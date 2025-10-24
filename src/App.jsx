import React, { useEffect, useState } from "react";
import HeroSection from "./components/HeroSection";
import ResourcesGrid from "./components/ResourcesGrid";
import LearningShowcase from "./components/LearningShowcase";
import LearnersMarquee from "./components/LearnersMarquee";
import CommunityStats from "./components/CommunityStats";
import Footer from "./components/Footer";
import { useTheme } from "./context/ThemeContext";
import { useChat } from "./context/ChatContext";

const App = () => {
  const { darkMode } = useTheme();
  const { socket } = useChat();
  const [showSignin, setShowSignin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // ✅ REGISTER USER AS ONLINE GLOBALLY
  useEffect(() => {
    if (!socket) return;

    const registerUser = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:3000/get-user-details", {
          headers: { Authorization: token },
        });

        if (res.ok) {
          const data = await res.json();
          const userId = String(data.user.id || data.user._id);

          if (socket.connected) {
            console.log("📡 [App] Emitting user_online:", userId);
            socket.emit("user_online", { userId });
          }
        }
      } catch (err) {
        console.error("❌ [App] Registration error:", err);
      }
    };

    if (socket.connected) {
      registerUser();
    }

    socket.on("connect", () => {
      setTimeout(registerUser, 500);
    });

    return () => {
      socket.off("connect");
    };
  }, [socket]);

  return (
    <div
      className={`${
        darkMode ? "bg-black text-white" : "bg-white text-black"
      } w-full min-h-screen overflow-x-hidden transition-colors duration-300`}
    >
      <HeroSection />
      <LearnersMarquee />
      <ResourcesGrid />
      <LearningShowcase />
      <CommunityStats />
      <Footer />
    </div>
  );
};

export default App;
