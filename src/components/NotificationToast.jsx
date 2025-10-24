import React, { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";

function NotificationToast({ notification, onClose, darkMode }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-20 right-8 z-[100] w-96 rounded-xl shadow-2xl p-4 animate-slideIn ${
        darkMode
          ? "bg-[#18181b] border-2 border-orange-400"
          : "bg-white border-2 border-orange-400 shadow-xl"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {notification.type === "chat_message" 
                ? "💬" 
                : notification.type === "connection_removed"
                ? "🗑️"
                : notification.type === "connection_accepted"
                ? "✅"
                : notification.type === "connection_declined"
                ? "❌"
                : "🔔"}
            </span>
            <span className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {notification.type === "chat_message" 
                ? "New Message" 
                : notification.type === "connection_removed"
                ? "Connection Removed"
                : notification.type === "connection_request"
                ? "Connection Request"
                : notification.type === "connection_accepted"
                ? "Connection Accepted"
                : notification.type === "connection_declined"
                ? "Request Declined"
                : "Notification"}
            </span>
          </div>
          <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 ml-4 text-xl"
        >
          ✖
        </button>
      </div>
    </div>
  );
}

export default NotificationToast;
