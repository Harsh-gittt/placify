const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const ObjectId = Schema.Types.ObjectId;

// ============================================================================
// USER MODEL
// ============================================================================
const UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// ============================================================================
// BOOKMARK MODEL
// ============================================================================
const BookmarkSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", index: true, required: true },
    internshipId: { type: String, required: true },
    title: String,
    company: String,
    logo: String,
    location: String,
    remote: Boolean,
    stipend: String,
    duration: String,
    posted_at: Date,
    url: String,
    source: String,
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, internshipId: 1 }, { unique: true });

// ============================================================================
// PARTNER MODEL - Updated with owner field for self-connection prevention
// ============================================================================
const PartnerSchema = new Schema({
  owner: {
    type: ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true,
  }, // ✅ Track who owns this partner profile
  name: { type: String, required: true },
  initial: { type: String },
  skills: [{ type: String, required: true }],
  lookingFor: { type: String, required: true },
  email: { type: String },
  avatarColor: { type: String, default: "#ea7a47" },
  createdAt: { type: Date, default: Date.now },
});

// Index to ensure one partner profile per user
PartnerSchema.index({ owner: 1 }, { unique: true });

// ============================================================================
// CONNECTION REQUEST MODEL
// ============================================================================
const ConnectionRequestSchema = new Schema({
  from: { type: ObjectId, ref: "Partner", required: true },
  to: { type: ObjectId, ref: "Partner", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate requests
ConnectionRequestSchema.index({ from: 1, to: 1 }, { unique: true });

// ============================================================================
// NOTIFICATION MODEL - Stores all user notifications
// ============================================================================
const NotificationSchema = new Schema({
  userId: { type: ObjectId, ref: "User", required: true, index: true }, // ✅ Recipient user ID
  fromUserId: { type: ObjectId, ref: "User" }, // ✅ Sender user ID (optional)
  type: {
    type: String,
    enum: [
      "connection_request",
      "connection_accepted",
      "connection_declined",
      "chat_message",
      "system",
    ],
    required: true,
  },
  message: { type: String, required: true },
  payload: { type: Object }, // ✅ Additional data (requestId, connectionId, etc.)
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

// ============================================================================
// CHAT MESSAGE MODEL - Stores conversation messages
// ============================================================================
const ChatMessageSchema = new Schema({
  connectionId: {
    type: ObjectId,
    ref: "ConnectionRequest",
    required: true,
    index: true,
  },
  from: { type: ObjectId, ref: "User", required: true }, // ✅ Sender user ID
  to: { type: ObjectId, ref: "User", required: true }, // ✅ Recipient user ID
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

ChatMessageSchema.index({ connectionId: 1, createdAt: 1 });

// ============================================================================
// MOCK INTERVIEW MODEL - Stores AI mock interview sessions
// ============================================================================
const MockInterviewSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true },
    roundType: { type: String, required: true },
    transcript: [
      {
        role: { type: String, enum: ["ai", "user"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    score: { type: Number },
    summary: { type: String },
    improvements: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

MockInterviewSchema.index({ userId: 1, createdAt: -1 });

// ============================================================================
// EXPORT MODELS
// ============================================================================
const userModel = model("User", UserSchema);
const bookmarkModel = model("Bookmark", BookmarkSchema);
const partnerModel = model("Partner", PartnerSchema);
const connectionRequestModel = model(
  "ConnectionRequest",
  ConnectionRequestSchema
);
const notificationModel = model("Notification", NotificationSchema);
const chatMessageModel = model("ChatMessage", ChatMessageSchema);
const mockInterviewModel = model("MockInterview", MockInterviewSchema);

module.exports = {
  userModel,
  bookmarkModel,
  partnerModel,
  connectionRequestModel,
  notificationModel,
  chatMessageModel,
  mockInterviewModel,
};
