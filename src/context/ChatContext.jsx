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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [selfId, setSelfId] = useState(null);
  const socketRef = useRef(null);

  // Connect to Socket.io server
  useEffect(() => {
    socketRef.current = io("http://localhost:3000", { withCredentials: true });
    return () => socketRef.current.disconnect();
  }, []);

  // Fetch partners and connections on mount
  useEffect(() => {
    fetch("http://localhost:3000/api/partners")
      .then((res) => res.json())
      .then((data) => {
        setPartners(data);
        if (data[0]?.id || data[0]?._id) setSelfId(data[0].id || data[0]._id);
      });
  }, []);
  useEffect(() => {
    if (!selfId) return;
    fetch(`http://localhost:3000/api/connections/accepted/${selfId}`)
      .then((res) => res.json())
      .then((data) => setConnections(data));
    socketRef.current.emit("join", selfId);
  }, [selfId]);

  // Fetch notifications for selfId
  useEffect(() => {
    if (!selfId) return;
    fetch(`http://localhost:3000/api/notifications/${selfId}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data));
  }, [selfId]);

  // Create a notification
  const createNotification = (notif) => {
    fetch("http://localhost:3000/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notif),
    })
      .then((res) => res.json())
      .then((saved) => setNotifications((prev) => [saved, ...prev]));
  };

  // Mark notification as read
  const markNotificationRead = (id) => {
    fetch(`http://localhost:3000/api/notifications/${id}/read`, {
      method: "PUT",
    })
      .then((res) => res.json())
      .then((updated) =>
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? updated : n))
        )
      );
  };

  // Notification and unread logic (to be expanded)
  // ...

  const value = {
    partners,
    setPartners,
    connections,
    setConnections,
    activeConnection,
    setActiveConnection,
    showChat,
    setShowChat,
    unreadCounts,
    setUnreadCounts,
    notifications,
    setNotifications,
    createNotification,
    markNotificationRead,
    selfId,
    socket: socketRef.current,
  };
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
