import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useChat } from "../context/ChatContext";

const BACKEND_URL = "http://localhost:3000";

function ChatBox() {
  const { darkMode } = useTheme();
  const {
    activeChatConnection,
    isChatOpen,
    isChatMinimized,
    closeChat,
    minimizeChat,
    maximizeChat,
    socket, // ✅ Use socket from context
  } = useChat();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Draggable state
  const [position, setPosition] = useState({
    x: typeof window !== "undefined" ? window.innerWidth - 420 : 0,
    y: 100,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const chatBoxRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ✅ Fetch current user ID on mount
  useEffect(() => {
    async function fetchUserId() {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const storedUserId = localStorage.getItem("currentUserId");
      if (storedUserId) {
        setCurrentUserId(storedUserId);
        console.log("✅ ChatBox User ID from localStorage:", storedUserId);
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/get-user-details`, {
          headers: { Authorization: token },
        });

        if (res.ok) {
          const data = await res.json();
          const userId = String(data.user._id || data.user.id);
          setCurrentUserId(userId);
          localStorage.setItem("currentUserId", userId);
          console.log("✅ ChatBox User ID fetched:", userId);
        }
      } catch (err) {
        console.error("❌ ChatBox failed to fetch user ID:", err);
      }
    }

    fetchUserId();
  }, []);

  // ✅ Load chat history when connection changes
  useEffect(() => {
    if (!activeChatConnection || !isChatOpen) {
      setMessages([]);
      return;
    }

    loadChatHistory();

    // ✅ Listen for new messages via socket from CONTEXT
    const handleNewMessage = (data) => {
      console.log("📨 ChatBox received new_message:", data);

      if (data.connectionId === activeChatConnection._id) {
        console.log("✅ Message is for THIS chat, adding to messages");
        setMessages((prev) => {
          // Prevent duplicates
          const exists = prev.some((m) => m._id === data.message._id);
          if (exists) {
            console.log("⚠️ Message already exists, skipping");
            return prev;
          }
          console.log("➕ Adding new message to chat");
          return [...prev, data.message];
        });
      } else {
        console.log("⚠️ Message is for different chat:", data.connectionId);
      }
    };

    if (socket) {
      console.log("🔌 ChatBox registering new_message listener");
      socket.on("new_message", handleNewMessage);
    } else {
      console.warn("⚠️ Socket not available in ChatBox");
    }

    return () => {
      if (socket) {
        console.log("🔌 ChatBox cleaning up new_message listener");
        socket.off("new_message", handleNewMessage);
      }
    };
  }, [activeChatConnection, isChatOpen, socket]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadChatHistory() {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("❌ No auth token found");
        return;
      }

      console.log(`📡 Loading chat history for connection: ${activeChatConnection._id}`);

      const res = await fetch(
        `${BACKEND_URL}/api/chat/${activeChatConnection._id}`,
        {
          headers: { Authorization: token },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        console.log(`✅ Loaded ${data.length} messages`);
      } else {
        const errorText = await res.text();
        console.error("❌ Failed to load chat:", res.status, errorText);
      }
    } catch (err) {
      console.error("❌ Load chat error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    const textToSend = messageText.trim();
    setMessageText(""); // Clear immediately for better UX

    try {
      setSending(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        console.error("❌ No auth token found");
        setMessageText(textToSend); // Restore text
        return;
      }

      console.log(`📤 Sending message to connection: ${activeChatConnection._id}`);

      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          connectionId: activeChatConnection._id,
          text: textToSend,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        console.log("✅ Message sent successfully:", newMessage._id);
        
        // Add to local messages (socket will also deliver, but this is immediate)
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          if (exists) return prev;
          return [...prev, newMessage];
        });
      } else {
        const errorText = await res.text();
        console.error("❌ Failed to send message:", res.status, errorText);
        alert("Failed to send message. Please try again.");
        setMessageText(textToSend); // Restore text
      }
    } catch (err) {
      console.error("❌ Send message error:", err);
      alert("Failed to send message. Please check your connection.");
      setMessageText(textToSend); // Restore text
    } finally {
      setSending(false);
    }
  }

  // Dragging handlers
  function handleMouseDown(e) {
    if (e.target.closest(".no-drag")) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  }

  useEffect(() => {
    function handleMouseMove(e) {
      if (isDragging) {
        setPosition({
          x: Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 400)),
          y: Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100)),
        });
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isChatOpen || !activeChatConnection) return null;

  // ✅ Get the other user's info
  const otherUser =
    activeChatConnection.from?.owner?.toString() === currentUserId
      ? activeChatConnection.to
      : activeChatConnection.from;

  return (
    <div
      ref={chatBoxRef}
      className={`fixed z-[200] rounded-xl shadow-2xl border-2 transition-all ${
        darkMode
          ? "bg-[#18181b] border-orange-400 text-white"
          : "bg-white border-gray-300 text-gray-900"
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: isChatMinimized ? "300px" : "400px",
        height: isChatMinimized ? "60px" : "600px",
        maxWidth: "calc(100vw - 40px)",
        maxHeight: "calc(100vh - 40px)",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-3 border-b-2 ${
          darkMode ? "border-orange-400" : "border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold flex-shrink-0">
            {otherUser?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">
              {otherUser?.name || "User"}
            </p>
            {!isChatMinimized && (
              <p className="text-xs opacity-70 truncate">
                {otherUser?.lookingFor ||
                  otherUser?.skills?.join(", ") ||
                  "Study partner"}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 no-drag">
          <button
            onClick={isChatMinimized ? maximizeChat : minimizeChat}
            className="hover:opacity-70 text-lg"
            title={isChatMinimized ? "Maximize" : "Minimize"}
          >
            {isChatMinimized ? "▢" : "─"}
          </button>
          <button onClick={closeChat} className="hover:opacity-70 text-xl" title="Close">
            ✖
          </button>
        </div>
      </div>

      {/* Minimized state - show nothing else */}
      {isChatMinimized ? null : (
        <>
          {/* User Info */}
          <div
            className={`p-3 text-xs border-b ${
              darkMode
                ? "border-gray-700 bg-[#23232a]"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <p>
              <span className="font-semibold">Skills:</span>{" "}
              {otherUser?.skills?.join(", ") || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Looking for:</span>{" "}
              {otherUser?.lookingFor || "N/A"}
            </p>
          </div>

          {/* Messages */}
          <div
            className={`flex-1 overflow-y-auto p-4 space-y-3 no-drag ${
              darkMode ? "bg-[#0a0a0a]" : "bg-gray-50"
            }`}
            style={{ height: "calc(100% - 180px)" }}
          >
            {loading ? (
              <div className="text-center py-8 text-gray-400">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isOwn = String(msg.from) === String(currentUserId);
                return (
                  <div
                    key={msg._id || idx}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                        isOwn
                          ? "bg-orange-400 text-white"
                          : darkMode
                          ? "bg-[#23232a] text-white"
                          : "bg-gray-200 text-gray-900"
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className={`p-3 border-t-2 no-drag ${
              darkMode ? "border-orange-400" : "border-gray-300"
            }`}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className={`flex-1 px-3 py-2 rounded-lg border focus:outline-none focus:border-orange-400 ${
                  darkMode
                    ? "bg-[#23232a] border-gray-700 text-white placeholder-gray-500"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                }`}
                disabled={sending}
                autoFocus
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

export default ChatBox;

