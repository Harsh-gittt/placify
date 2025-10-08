import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/Placify3.png";
import { useTheme } from "../context/ThemeContext";

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
      return data?.user || null;
    }
  } catch {
    return null;
  }
}

// ============================================================================
// CONNECTION REQUESTS PANEL - WITH ACCEPT/DECLINE
// ============================================================================
function ConnectionRequestsPanel({
  requests,
  onAccept,
  onDecline,
  loading,
  darkMode,
}) {
  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="text-center text-gray-400 py-4">
          No pending requests
        </div>
      ) : (
        requests.map((req) => (
          <div
            key={req._id}
            className={`p-3 rounded-lg border ${
              darkMode
                ? "bg-[#23232a] border-gray-700"
                : "bg-gray-50 border-gray-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {req.payload?.fromPartnerName?.charAt(0) || "?"}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">
                  {req.payload?.fromPartnerName || "Someone"}
                </p>
                <p className="text-xs text-gray-400 mb-2">{req.message}</p>

                {/* Skills */}
                {req.payload?.skills && req.payload.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {req.payload.skills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded-full bg-orange-400/20 text-orange-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(req._id)}
                    disabled={loading}
                    className="flex-1 bg-orange-400 hover:bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onDecline(req._id)}
                    disabled={loading}
                    className={`flex-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      darkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    }`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================================
// CONNECTIONS PANEL - TABS FOR REQUESTS & CONNECTIONS
// ============================================================================
function ConnectionsPanel({
  connections,
  requests,
  onSelect,
  unreadCounts,
  onConnectNow,
  onAcceptRequest,
  onDeclineRequest,
  loading,
  darkMode,
}) {
  const [activeTab, setActiveTab] = useState(
    requests.length > 0 ? "requests" : "connections"
  );

  return (
    <div className="absolute right-0 mt-3 w-96 z-50">
      <div
        className={`${
          darkMode
            ? "bg-[#18181b] text-white border-orange-400"
            : "bg-white text-gray-900 border-gray-200"
        } border-2 rounded-xl shadow-2xl overflow-hidden`}
      >
        {/* Tabs */}
        <div className="flex border-b border-orange-400">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 px-4 py-3 font-semibold transition-colors relative ${
              activeTab === "requests"
                ? "bg-orange-400 text-white"
                : darkMode
                ? "hover:bg-[#23232a]"
                : "hover:bg-gray-50"
            }`}
          >
            Requests
            {requests.length > 0 && (
              <span className="ml-2 bg-white text-orange-400 rounded-full px-2 py-0.5 text-xs font-bold">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("connections")}
            className={`flex-1 px-4 py-3 font-semibold transition-colors ${
              activeTab === "connections"
                ? "bg-orange-400 text-white"
                : darkMode
                ? "hover:bg-[#23232a]"
                : "hover:bg-gray-50"
            }`}
          >
            Connections
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {activeTab === "requests" ? (
            <ConnectionRequestsPanel
              requests={requests}
              onAccept={onAcceptRequest}
              onDecline={onDeclineRequest}
              loading={loading}
              darkMode={darkMode}
            />
          ) : connections.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="mb-3">You have no connections yet</p>
              <button
                className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold"
                onClick={onConnectNow}
              >
                Find Study Partners
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {connections.map((conn) => {
                const partner = conn.from || conn.to;
                return (
                  <li
                    key={conn._id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      darkMode
                        ? "hover:bg-[#23232a]"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => onSelect(conn)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm">
                        {partner?.name?.charAt(0) || "?"}
                      </div>
                      <span className="font-medium">
                        {partner?.name || "Partner"}
                      </span>
                    </div>
                    {unreadCounts[conn._id] > 0 && (
                      <span className="bg-orange-400 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                        {unreadCounts[conn._id]}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NOTIFICATION TOAST
// ============================================================================
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
              {notification.type === "connection_request"
                ? "🔔"
                : notification.type === "connection_accepted"
                ? "✅"
                : "❌"}
            </span>
            <span
              className={`font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {notification.type === "connection_request"
                ? "New Connection Request"
                : notification.type === "connection_accepted"
                ? "Request Accepted!"
                : "Request Declined"}
            </span>
          </div>
          <p
            className={`text-sm ${
              darkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
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

// ============================================================================
// MAIN NAVBAR COMPONENT
// ============================================================================
function Navbar({ onLoginClick, onConnectNow }) {
  const navigate = useNavigate();
  const [first_name, setFirstName] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { darkMode, toggleTheme } = useTheme();
  const [showResources, setShowResources] = useState(false);
  const [showConnections, setShowConnections] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ✅ Connection & notification state
  const [connections, setConnections] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const resourcesRef = useRef(null);
  const userMenuRef = useRef(null);
  const connectionsRef = useRef(null);

  // ✅ Fetch user details
  useEffect(() => {
    async function fetchAndSetName() {
      const user = await GetUserDetails();
      if (user) {
        setFirstName(user.first_name);
        setCurrentUser(user);
        console.log("✅ User loaded:", user.first_name);
      }
    }

    fetchAndSetName();

    function handleAuthUpdate() {
      fetchAndSetName();
    }

    window.addEventListener("auth:update", handleAuthUpdate);
    return () => window.removeEventListener("auth:update", handleAuthUpdate);
  }, []);

  // ✅ Fetch connections and requests
  useEffect(() => {
    if (!currentUser) return;

    async function fetchData() {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;

        // Fetch accepted connections
        const connRes = await fetch(
          "http://localhost:3000/api/connections/accepted",
          {
            headers: { Authorization: token },
          }
        );
        if (connRes.ok) {
          const connData = await connRes.json();
          setConnections(connData);
          console.log(`✅ Loaded ${connData.length} connections`);
        }

        // Fetch notifications (for connection requests)
        const notifRes = await fetch("http://localhost:3000/api/notifications", {
          headers: { Authorization: token },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData);

          // Filter unread connection requests
          const requests = notifData.filter(
            (n) => n.type === "connection_request" && !n.read
          );
          setConnectionRequests(requests);
          console.log(`✅ Loaded ${requests.length} pending requests`);
        }
      } catch (err) {
        console.error("❌ Fetch data error:", err);
      }
    }

    fetchData();

    // Listen for socket events
    window.addEventListener("socket:connection_request", handleNewRequest);
    window.addEventListener("socket:connection_accepted", handleAccepted);
    window.addEventListener("socket:connection_declined", handleDeclined);

    return () => {
      window.removeEventListener("socket:connection_request", handleNewRequest);
      window.removeEventListener("socket:connection_accepted", handleAccepted);
      window.removeEventListener("socket:connection_declined", handleDeclined);
    };
  }, [currentUser]);

  // ✅ Handle new connection request
  function handleNewRequest(e) {
    const notification = e.detail;
    console.log("🔔 New connection request received:", notification);

    setConnectionRequests((prev) => [notification, ...prev]);
    setNotifications((prev) => [notification, ...prev]);
    setToast(notification);
  }

  // ✅ Handle connection accepted
  function handleAccepted(e) {
    const { notification, connection } = e.detail;
    console.log("✅ Connection accepted:", notification);

    if (connection) {
      setConnections((prev) => [connection, ...prev]);
    }
    setToast(notification);
  }

  // ✅ Handle connection declined
  function handleDeclined(e) {
    const { notification } = e.detail;
    console.log("❌ Connection declined:", notification);
    setToast(notification);
  }

  // ✅ Accept connection request
  async function handleAcceptRequest(notificationId) {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      console.log(`📡 Accepting request: ${notificationId}`);

      const res = await fetch(
        `http://localhost:3000/api/notifications/${notificationId}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log("✅ Request accepted:", data);

        // Remove from requests
        setConnectionRequests((prev) =>
          prev.filter((r) => r._id !== notificationId)
        );

        // Add to connections
        if (data.connection) {
          setConnections((prev) => [data.connection, ...prev]);
        }

        // Show success toast
        setToast({
          type: "connection_accepted",
          message: "Connection accepted successfully! 🎉",
        });

        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const error = await res.json();
        alert(error.message || "Failed to accept request");
      }
    } catch (err) {
      console.error("❌ Accept error:", err);
      alert("Failed to accept request");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Decline connection request
  async function handleDeclineRequest(notificationId) {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");

      console.log(`📡 Declining request: ${notificationId}`);

      const res = await fetch(
        `http://localhost:3000/api/notifications/${notificationId}/decline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
        }
      );

      if (res.ok) {
        console.log("✅ Request declined");

        // Remove from requests
        setConnectionRequests((prev) =>
          prev.filter((r) => r._id !== notificationId)
        );

        setToast({
          type: "connection_declined",
          message: "Request declined",
        });
      }
    } catch (err) {
      console.error("❌ Decline error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Click outside handlers
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") {
        setShowResources(false);
        setShowUserMenu(false);
        setShowConnections(false);
      }
    }

    function handleClickOutside(e) {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target)) {
        setShowResources(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (connectionsRef.current && !connectionsRef.current.contains(e.target)) {
        setShowConnections(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, {
      passive: true,
    });
    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  function handleSignOut() {
    try {
      localStorage.removeItem("auth_token");
    } catch {}
    setFirstName(null);
    setCurrentUser(null);
    setShowUserMenu(false);
    window.dispatchEvent(new Event("auth:update"));
    navigate("/");
  }

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 w-full ${
        darkMode ? "bg-black" : "bg-white"
      } ${darkMode ? "text-white" : "text-black"} transition-colors duration-300`}
    >
      {/* Toast notification */}
      {toast && (
        <NotificationToast
          notification={toast}
          onClose={() => setToast(null)}
          darkMode={darkMode}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 select-none"
          onClick={() => setIsMenuOpen(false)}
        >
          <img
            src={logo}
            alt="Placify Logo"
            className="h-10 w-auto object-contain"
          />
          <span
            className={`${
              darkMode ? "text-gray-100" : "text-gray-900"
            } font-semibold text-base sm:text-lg`}
          >
            PLACIFY
          </span>
        </Link>

        {/* Right controls */}
        <div className="flex items-center gap-5">
          {/* Connections dropdown with badge */}
          <div className="relative" ref={connectionsRef}>
            <button
              className="flex items-center gap-1 hover:opacity-90 transition-opacity relative"
              onClick={() => setShowConnections((s) => !s)}
            >
              <span>Connections</span>
              {connectionRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-400 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {connectionRequests.length}
                </span>
              )}
              <span className="opacity-80">▾</span>
            </button>
            {showConnections && (
              <ConnectionsPanel
                connections={connections}
                requests={connectionRequests}
                onSelect={(conn) => {
                  console.log("Selected connection:", conn);
                  setShowConnections(false);
                }}
                unreadCounts={unreadCounts}
                onConnectNow={() => {
                  if (onConnectNow) onConnectNow();
                  navigate("/study-partners");
                  setShowConnections(false);
                }}
                onAcceptRequest={handleAcceptRequest}
                onDeclineRequest={handleDeclineRequest}
                loading={loading}
                darkMode={darkMode}
              />
            )}
          </div>

          {/* Resources dropdown */}
          <div className="relative" ref={resourcesRef}>
            <button
              className="flex items-center gap-1 hover:opacity-90 transition-opacity"
              onClick={() => setShowResources((s) => !s)}
            >
              <span>Resources</span>
              <span className="opacity-80">▾</span>
            </button>
            {showResources && (
              <div className="absolute right-0 mt-3 w-64">
                <div
                  className={`${
                    darkMode
                      ? "bg-[#1a1a1a] text-white border-white/10"
                      : "bg-white text-gray-800 border-gray-200"
                  } border rounded-xl shadow-2xl overflow-hidden`}
                >
                  <ul className="py-2">
                    <li>
                      <Link
                        to="/dsa"
                        className="block px-4 py-2 hover:bg-[#ea7a47]/10 transition-colors"
                        onClick={() => setShowResources(false)}
                      >
                        Striver's DSA Sheet
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/resources"
                        className="block px-4 py-2 hover:bg-[#ea7a47]/10 transition-colors"
                        onClick={() => setShowResources(false)}
                      >
                        System Design Sheet
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/resources"
                        className="block px-4 py-2 hover:bg-[#ea7a47]/10 transition-colors"
                        onClick={() => setShowResources(false)}
                      >
                        Core Subjects
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/resources"
                        className="block px-4 py-2 hover:bg-[#ea7a47]/10 transition-colors"
                        onClick={() => setShowResources(false)}
                      >
                        Interview Experiences
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center hover:opacity-90 transition-transform duration-300 hover:rotate-12"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "🌙" : "☀️"}
          </button>

          {/* Login/User Menu */}
          {first_name ? (
            <div className="relative" ref={userMenuRef}>
              <button
                className="flex items-center gap-2 bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-4 py-2 rounded-2xl cursor-pointer transition-colors"
                onClick={() => setShowUserMenu((s) => !s)}
              >
                <span>{first_name}</span>
                <span className="opacity-80">▾</span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-48">
                  <div
                    className={`${
                      darkMode
                        ? "bg-[#1a1a1a] text-white border-white/10"
                        : "bg-white text-gray-800 border-gray-200"
                    } border rounded-xl shadow-2xl overflow-hidden`}
                  >
                    <ul className="py-2">
                      <li>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 hover:bg-[#ea7a47]/10 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/bookmarks"
                          className="block px-4 py-2 hover:bg-[#ea7a47]/10 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Bookmarks
                        </Link>
                      </li>
                      <li>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-[#ea7a47]/10 transition-colors text-red-500"
                          onClick={handleSignOut}
                        >
                          Sign Out
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              className="bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-4 py-2 rounded-2xl cursor-pointer transition-colors"
              onClick={() =>
                onLoginClick ? onLoginClick() : navigate("/signin")
              }
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded-xl border border-transparent hover:border-gray-300 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((v) => !v)}
        >
          <span className="sr-only">Toggle menu</span>
          <svg
            className={`h-6 w-6 ${darkMode ? "text-white" : "text-black"}`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMenuOpen ? (
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M4 6h16M4 12h16M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden px-4 sm:px-6 lg:px-8 pb-3 ${
          isMenuOpen ? "block" : "hidden"
        }`}
      >
        <div
          className={`flex flex-col gap-3 rounded-2xl border ${
            darkMode
              ? "border-gray-700 bg-[#0a0a0a]"
              : "border-gray-200 bg-white"
          } p-3`}
        >
          <Link
            to="/dsa"
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            DSA Resources
          </Link>
          <Link
            to="/resources"
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            All Resources
          </Link>
          <button
            onClick={() => {
              toggleTheme();
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? "Light mode ☀️" : "Dark mode 🌙"}
          </button>
          {first_name ? (
            <button
              onClick={() => {
                handleSignOut();
                setIsMenuOpen(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-2xl cursor-pointer transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              className="bg-[#ea7a47] hover:bg-[#e06d37] text-white font-medium px-5 py-2 rounded-2xl cursor-pointer transition-colors"
              onClick={() => {
                setIsMenuOpen(false);
                onLoginClick ? onLoginClick() : navigate("/signin");
              }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
