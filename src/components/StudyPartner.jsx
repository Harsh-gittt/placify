import React, { useState } from "react"
import SearchBar from "./SearchBar"
import PartnerCard from "./PartnerCard"
import BePartner from "./BePartner"
import Navbar from "./Navbar"

function StudyPartner() {
  const [searchTerm, setSearchTerm] = useState("")
  const [subject, setSubject] = useState("")

  // Example partner data
  const partners = [
    { name: "Ananya Sharma", skills: "DSA, Web Dev", lookingFor: "Coding Practice, Project Work" },
    { name: "Rajesh Patel", skills: "Machine Learning", lookingFor: "Project Work, Theory Discussions" },
    { name: "Chloe Kim", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Chloe Kim", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Ananya Sharma", skills: "DSA, Web Dev", lookingFor: "Coding Practice, Project Work" },
    { name: "Rajesh Patel", skills: "Machine Learning", lookingFor: "Project Work, Theory Discussions" },
    { name: "Chloe Kim", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Chloe Kim", skills: "Web Dev", lookingFor: "Frontend Coding Practice" },
    { name: "Ananya Sharma", skills: "DSA, Web Dev", lookingFor: "Coding Practice, Project Work" },
    { name: "Rajesh Patel", skills: "Machine Learning", lookingFor: "Project Work, Theory Discussions" },
  ]

  // Search filter logic
  const filteredPartners = partners.filter((p) => {
    return (
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.skills.join(", ").toLowerCase().includes(searchTerm.toLowerCase())) &&
      (subject === "" ||
        p.skills.join(", ").toLowerCase().includes(subject.toLowerCase()))
    );
  });

  // Handle Connect Now button (open Become a Partner modal)
  const handleConnectNow = () => setShowModal(true);

  // Handle selecting a connection from navbar
  const handleSelectConnection = (conn) => {
    setActiveConnection(conn);
    setShowChat(true);
    setUnreadCounts((prev) => ({ ...prev, [conn._id]: 0 }));
  };

  // Handle unread badge increment
  const handleUnread = (connectionId) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [connectionId]: (prev[connectionId] || 0) + 1,
    }));
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Navbar />

      {/* Become a Partner Section */}
      <BePartner onBecomePartner={() => setShowModal(true)} />
      {/* Modal */}
      {showModal && (
        <BecomePartnerModal
          onClose={() => setShowModal(false)}
          onSubmit={handleAddPartner}
        />
      )}
      {incomingRequests.length > 0 && (
        <div className="fixed top-20 right-8 z-50 space-y-4 w-96">
          {incomingRequests.map((req) => (
            <div
              key={req._id}
              className="bg-[#23232a] border-l-4 border-orange-400 rounded-xl shadow-lg p-4 flex flex-col gap-2 animate-fadeIn"
            >
              <div className="font-semibold text-white">
                {req.from?.name || "Someone"} has requested to connect for{" "}
                {req.from?.skills?.[0] || "a skill"}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-1 rounded-lg font-semibold"
                  onClick={() =>
                    handleRequestAction(
                      req._id,
                      req.from?._id,
                      req.to,
                      "accepted"
                    )
                  }
                >
                  Accept
                </button>
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded-lg font-semibold"
                  onClick={() =>
                    handleRequestAction(
                      req._id,
                      req.from?._id,
                      req.to,
                      "declined"
                    )
                  }
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="p-8 space-y-8">
      {/* Search bar */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        subject={subject}
        setSubject={setSubject}
        onSearch={() => {}}
        onClear={() => {
          setSearchTerm("")
          setSubject("")
        }}
      />

      {/* Partner cards */}
      <div className="grid grid-cols-4 gap-6 justify-items-center">
        {filteredPartners.map((partner, index) => (
          <PartnerCard
            key={index}
            name={partner.name}
            skills={partner.skills}
            lookingFor={partner.lookingFor}
          />
        ))}
      </div>

    </div>
    </div>
  );
}

export default StudyPartner;
