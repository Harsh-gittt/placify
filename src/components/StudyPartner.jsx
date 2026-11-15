import { useState, useEffect } from "react";

import SearchBar from "./SearchBar";
import PartnerCard from "./PartnerCard";
import BePartner from "./BePartner";
import { useTheme } from "../context/ThemeContext";
import { useChat } from "../context/ChatContext"; // Add this import
import { API_BASE_URL } from "../lib/apiBaseUrl";

const SAMPLE_PARTNERS = [
  {
    _id: "sample-aarav",
    name: "Aarav Sharma",
    skills: ["DSA", "Java", "System Design"],
    lookingFor: "Weekly problem-solving sessions and mock interviews",
    isSample: true,
  },
  {
    _id: "sample-priya",
    name: "Priya Nair",
    skills: ["React", "TypeScript", "UI/UX"],
    lookingFor: "A partner for frontend projects and code reviews",
    isSample: true,
  },
  {
    _id: "sample-kabir",
    name: "Kabir Singh",
    skills: ["Python", "Machine Learning", "SQL"],
    lookingFor: "ML project collaboration and interview preparation",
    isSample: true,
  },
];

// ============================================================================
// BECOME PARTNER MODAL
// ============================================================================
function BecomePartnerModal({ onClose, onSubmit, loading }) {
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    skills: "",
    lookingFor: "",
    email: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black bg-opacity-75">
      <div
        className={`rounded-2xl p-5 sm:p-6 w-full max-w-md ${
          darkMode ? "bg-[#18181b] text-white" : "bg-white text-gray-900"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Become a Study Partner</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-opacity"
          >
            ✖
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Your Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-orange-400 ${
                darkMode
                  ? "bg-[#23232a] border-gray-700"
                  : "bg-gray-50 border-gray-300"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">
              Skills (comma-separated) *
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="DSA, Web Dev, Machine Learning"
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-orange-400 ${
                darkMode
                  ? "bg-[#23232a] border-gray-700"
                  : "bg-gray-50 border-gray-300"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Looking For *</label>
            <input
              type="text"
              name="lookingFor"
              value={formData.lookingFor}
              onChange={handleChange}
              placeholder="Coding Practice, Project Work"
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-orange-400 ${
                darkMode
                  ? "bg-[#23232a] border-gray-700"
                  : "bg-gray-50 border-gray-300"
              }`}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Email (optional)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:border-orange-400 ${
                darkMode
                  ? "bg-[#23232a] border-gray-700"
                  : "bg-gray-50 border-gray-300"
              }`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Submit"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN STUDY PARTNER COMPONENT
// ============================================================================
function StudyPartner() {
  const { darkMode } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const { connections } = useChat(); //
  const [subject, setSubject] = useState("");
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [myPartner, setMyPartner] = useState(null);

  // ✅ Fetch user and partners on mount
  useEffect(() => {
    fetchCurrentUser();
    fetchPartners();
  }, []);

  // ✅ Retry fetching partners if error occurs (only for network errors)
  useEffect(() => {
    if (error && !loading && error.includes("Cannot connect to server")) {
      // Auto-retry after 5 seconds if there's a network error
      const retryTimer = setTimeout(() => {
        console.log("🔄 Auto-retrying to fetch partners...");
        fetchPartners();
      }, 5000);
      
      return () => clearTimeout(retryTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, loading]);

  // ✅ Register user online and listen for socket events (dispatched to Navbar)

  async function fetchCurrentUser() {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/get-user-details`, {
        headers: { Authorization: token },
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setMyPartner(data.partner);
      }
    } catch (err) {
      console.error("❌ Get user error:", err);
    }
  }

  async function fetchPartners() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(`${API_BASE_URL}/api/partners`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        let errorMessage = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPartners(data);
        setError(null);
      } else {
        console.warn("⚠️ Partners data is not an array:", data);
        setPartners([]);
        setError("Invalid data format received");
      }
    } catch (err) {
      console.error("❌ Fetch partners error:", err);
      
      // More specific error messages
      let errorMessage = "Failed to load partners";
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        errorMessage = "Cannot connect to server. Please check if the backend is running.";
      } else if (err.message.includes("HTTP")) {
        errorMessage = `Server error: ${err.message}`;
      } else {
        errorMessage = err.message || "Failed to load partners";
      }
      
      setError(errorMessage);
      setPartners([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }

  const partnersToDisplay = error
    ? partners
    : [...partners, ...SAMPLE_PARTNERS];

  const filteredPartners = partnersToDisplay.filter((p) => {
    if (myPartner && p._id === myPartner._id) {
      return false;
    }

    const skillsStr = Array.isArray(p.skills) ? p.skills.join(", ") : p.skills;

    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skillsStr.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSubject =
      subject === "" || skillsStr.toLowerCase().includes(subject.toLowerCase());

    return matchesSearch && matchesSubject;
  });

  async function handleAddPartner(formData) {
    try {
      setSubmitting(true);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        alert("Please sign in first ⚠️");
        return;
      }

      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE_URL}/api/partners`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({
          name: formData.name,
          skills: skillsArray,
          lookingFor: formData.lookingFor,
          email: formData.email,
        }),
      });

      if (res.status === 409) {
        alert("You already have a partner profile! ℹ️");
        setShowModal(false);
        await fetchCurrentUser();
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create partner");
      }

      const savedPartner = await res.json();
      setMyPartner(savedPartner);
      alert("Successfully registered as a study partner! ✅");
      setShowModal(false);
    } catch (err) {
      console.error("❌ Create partner error:", err);
      alert(`Failed to create partner: ${err.message} ❌`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConnect(partnerId) {
    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        alert("Please sign in to connect with partners ⚠️");
        return;
      }

      if (!myPartner) {
        const shouldCreate = window.confirm(
          "You need to create a partner profile first. Create one now?"
        );
        if (shouldCreate) {
          setShowModal(true);
        }
        return;
      }

      if (myPartner && partnerId === myPartner._id) {
        alert("You cannot connect with yourself! ⚠️");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/connections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ toPartnerId: partnerId }),
      });

      const data = await res.json();

      if (res.status === 400 && data.error === "Cannot connect to self") {
        alert("Cannot connect to yourself! ⚠️");
        return;
      }

      if (res.status === 409) {
        alert("Connection request already sent! ℹ️");
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to send request");
      }

      alert("Connection request sent! 🎉");
    } catch (err) {
      console.error("❌ Connect error:", err);
      alert(`Failed to connect: ${err.message} ❌`);
    }
  }
  // ✅ Check if partner is already connected
  function isConnected(partnerId) {
    return connections.some((conn) => {
      const fromId = conn.from?._id || conn.from;
      const toId = conn.to?._id || conn.to;
      return fromId === partnerId || toId === partnerId;
    });
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-black text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="px-4 sm:px-8">
        {myPartner ? (
          <div
            className={`rounded-2xl p-5 sm:p-8 text-center mt-6 sm:mt-10 transition-colors duration-300 ${
              darkMode
                ? "bg-gradient-to-br from-[#18181b] to-[#23232a] border border-gray-800"
                : "bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
            }`}
          >
            <h2
              className={`text-xl sm:text-2xl font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              ✅ You are already a partner
            </h2>
            <p
              className={`text-base sm:text-lg ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Your profile is visible to others. Browse below to connect!
            </p>
          </div>
        ) : (
          <BePartner onBecomePartner={() => setShowModal(true)} />
        )}
      </div>

      {showModal && (
        <BecomePartnerModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddPartner}
          loading={submitting}
        />
      )}

      <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          subject={subject}
          setSubject={setSubject}
          onSearch={() => {}}
          onClear={() => {
            setSearchTerm("");
            setSubject("");
          }}
        />

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-400 border-t-transparent"></div>
            <p className="mt-4 text-gray-400">Loading study partners...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className={`text-lg mb-2 ${darkMode ? "text-red-400" : "text-red-500"}`}>
              {error}
            </p>
            <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              Please check your connection and try again.
            </p>
            <button
              onClick={fetchPartners}
              className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPartners.length > 0 ? (
              filteredPartners.map((partner) => (
                <PartnerCard
                  key={partner._id}
                  id={partner._id}
                  name={partner.name}
                  skills={
                    Array.isArray(partner.skills)
                      ? partner.skills.join(", ")
                      : partner.skills
                  }
                  lookingFor={partner.lookingFor}
                  email={partner.email}
                  onConnect={handleConnect}
                  isConnected={isConnected(partner._id)} // ✅ Pass connection status
                  isSample={partner.isSample}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg mb-4">
                  {partnersToDisplay.length === 0
                    ? "No study partners yet. Be the first!"
                    : "No partners match your search."}
                </p>
                {!myPartner && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-orange-400 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold"
                  >
                    Become a Partner 🚀
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyPartner;
