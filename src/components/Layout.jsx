import React, { useState } from "react";
import Navbar from "./Navbar";
import ChatBox from "./Chatbox";
import NotificationToast from "./NotificationToast";
import Signin from "./Signin";
import Signup from "./Signup";
import { useTheme } from "../context/ThemeContext";
import { useChat } from "../context/ChatContext";

function Layout({ children }) {
  const { darkMode } = useTheme();
  const { globalToast, setGlobalToast } = useChat();
  
  const [showSignin, setShowSignin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  return (
    <>
      <Navbar onLoginClick={() => setShowSignin(true)} />
      
      {globalToast && (
        <NotificationToast
          notification={globalToast}
          onClose={() => setGlobalToast(null)}
          darkMode={darkMode}
        />
      )}

      <div className="pt-16">{children}</div>

      <ChatBox />

      {showSignin && (
        <Signin
          isOpen={showSignin}
          onClose={() => setShowSignin(false)}
          openSignup={() => {
            setShowSignin(false);
            setShowSignup(true);
          }}
        />
      )}
      
      {showSignup && (
        <Signup
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          openSignin={() => {
            setShowSignup(false);
            setShowSignin(true);
          }}
        />
      )}
    </>
  );
}

export default Layout;
