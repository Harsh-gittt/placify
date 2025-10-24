import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { io } from "socket.io-client";

const ChatContext = createContext();

export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({ children }) {
  const [partners, setPartners] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activeConnection, setActiveConnection] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selfId, setSelfId] = useState(null);

  const [activeChatConnection, setActiveChatConnection] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadChatCounts, setUnreadChatCounts] = useState({});

  // ✅ NEW: Global toast state for notifications
  const [globalToast, setGlobalToast] = useState(null);

  const socketRef = useRef(null);

  // ✅ Initialize socket with immediate user_online on connect
  useEffect(() => {
    console.log("🔌 Initializing socket connection...");

    socketRef.current = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected:", socketRef.current.id);

      // Immediately emit user_online if userId is in localStorage
      const storedUserId = localStorage.getItem("currentUserId");
      if (storedUserId) {
        console.log("📡 Emitting user_online immediately on connect:", storedUserId);
        socketRef.current.emit("user_online", { userId: storedUserId });
      }
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // ✅ Fetch user details and register online
  useEffect(() => {
    async function fetchUserDetails() {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const res = await fetch("http://localhost:3000/get-user-details", {
          headers: { Authorization: token },
        });

        if (res.ok) {
          const data = await res.json();
          const userId = String(data.user._id || data.user.id);
          setSelfId(userId);
          localStorage.setItem("currentUserId", userId);
          console.log("✅ User ID set:", userId);

          // Emit user_online if socket is connected
          if (socketRef.current?.connected) {
            console.log("📡 Emitting user_online after fetch:", userId);
            socketRef.current.emit("user_online", { userId });
          }
        }
      } catch (err) {
        console.error("❌ Fetch user details error:", err);
      }
    }

    fetchUserDetails();
  }, []);

  // Fetch partners
  useEffect(() => {
    fetch("http://localhost:3000/api/partners")
      .then((res) => res.json())
      .then((data) => setPartners(data))
      .catch((err) => console.error("❌ Fetch partners error:", err));
  }, []);

  // Fetch connections
  useEffect(() => {
    if (!selfId) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    fetch(`http://localhost:3000/api/connections/accepted`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => {
        setConnections(data);
        console.log(`✅ Loaded ${data.length} connections`);
      })
      .catch((err) => console.error("❌ Fetch connections error:", err));
  }, [selfId]);

  // Fetch notifications
  useEffect(() => {
    if (!selfId) return;

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    fetch(`http://localhost:3000/api/notifications`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        console.log(`✅ Loaded ${data.length} notifications`);
      })
      .catch((err) => console.error("❌ Fetch notifications error:", err));
  }, [selfId]);

  // ✅ Listen for new messages to update unread counts AND show toast
  useEffect(() => {
    if (!socketRef.current) return;

    const handleNewMessage = (data) => {
      console.log("\n📨 ====== NEW MESSAGE RECEIVED ======");
      console.log("   Connection ID:", data.connectionId);
      console.log("   Message:", data.message.text);
      console.log("   Current open chat:", activeChatConnection?._id);
      console.log("   Is chat open:", isChatOpen);

      // Only increment if chat is not open OR message is from different connection
      if (!isChatOpen || data.connectionId !== activeChatConnection?._id) {
        console.log("📬 Incrementing unread count");
        setUnreadChatCounts((prev) => {
          const newCounts = {
            ...prev,
            [data.connectionId]: (prev[data.connectionId] || 0) + 1,
          };
          console.log("📊 New unread counts:", newCounts);
          return newCounts;
        });

        // ✅ Show global toast notification
        setGlobalToast({
          type: "chat_message",
          message: `New message: ${data.message.text.substring(0, 50)}${
            data.message.text.length > 50 ? "..." : ""
          }`,
          connectionId: data.connectionId,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log("✅ Message is for active open chat, not incrementing");
      }
      console.log("====== MESSAGE HANDLING COMPLETE ======\n");
    };

    socketRef.current.on("new_message", handleNewMessage);
    console.log("🔌 Registered new_message listener");

    return () => {
      socketRef.current.off("new_message", handleNewMessage);
      console.log("🔌 Cleaned up new_message listener");
    };
  }, [isChatOpen, activeChatConnection]);

  // ✅ Listen for connection_request notifications
useEffect(() => {
  if (!socketRef.current) return;

  const handleNotification = (notification) => {
    console.log("🔔 Notification received:", notification);

    setNotifications((prev) => [notification, ...prev]);
    setGlobalToast(notification);

    // ✅ Dispatch window event for Navbar
    if (notification.type === "connection_request") {
      window.dispatchEvent(
        new CustomEvent("socket:connection_request", { detail: notification })
      );
    }
  };

  socketRef.current.on("notification", handleNotification);
  return () => socketRef.current.off("notification", handleNotification);
}, []);

// ✅ Listen for connection removal and update connections state
useEffect(() => {
  function handleConnectionRemoved(e) {
    const { connectionId } = e.detail;
    console.log("🗑️ Connection removed event received:", connectionId);
    
    setConnections((prev) => prev.filter((c) => c._id !== connectionId));
  }

  window.addEventListener("connection_removed", handleConnectionRemoved);
  
  return () => {
    window.removeEventListener("connection_removed", handleConnectionRemoved);
  };
}, []);



  const createNotification = (notif) => {
    fetch("http://localhost:3000/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notif),
    })
      .then((res) => res.json())
      .then((saved) => setNotifications((prev) => [saved, ...prev]))
      .catch((err) => console.error("❌ Create notification error:", err));
  };

  const markNotificationRead = (id) => {
    fetch(`http://localhost:3000/api/notifications/${id}/read`, {
      method: "PUT",
    })
      .then((res) => res.json())
      .then((updated) =>
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? updated : n))
        )
      )
      .catch((err) => console.error("❌ Mark notification error:", err));
  };

  const openChat = (connection) => {
    console.log("📂 Opening chat with:", connection._id);
    setActiveChatConnection(connection);
    setIsChatOpen(true);
    setIsChatMinimized(false);

    // Clear unread count
    console.log("🧹 Clearing unread for:", connection._id);
    setUnreadChatCounts((prev) => {
      const newCounts = { ...prev };
      delete newCounts[connection._id];
      return newCounts;
    });
  };

  const closeChat = () => {
    console.log("📂 Closing chat");
    setActiveChatConnection(null);
    setIsChatOpen(false);
    setIsChatMinimized(false);
  };

  const minimizeChat = () => {
    setIsChatMinimized(true);
  };

  const maximizeChat = () => {
    setIsChatMinimized(false);
  };

  const value = {
    partners,
    setPartners,
    connections,
    setConnections,
    activeConnection,
    setActiveConnection,
    showChat,
    setShowChat,
    notifications,
    setNotifications,
    createNotification,
    markNotificationRead,
    selfId,
    socket: socketRef.current,
    activeChatConnection,
    isChatOpen,
    isChatMinimized,
    openChat,
    closeChat,
    minimizeChat,
    maximizeChat,
    unreadChatCounts,
    setUnreadChatCounts,
    // ✅ NEW: Global toast state
    globalToast,
    setGlobalToast,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
