const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
  first_name: String,
  last_name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

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

const PartnerSchema = new Schema({
  name: { type: String, required: true },
  initial: { type: String },
  skills: [{ type: String }],
  lookingFor: { type: String },
  email: { type: String },
  createdAt: { type: Date, default: Date.now },
});

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

const ChatMessageSchema = new Schema({
  connectionId: { type: ObjectId, ref: "ConnectionRequest", required: true },
  sender: { type: ObjectId, ref: "Partner", required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
});

const NotificationSchema = new Schema({
  recipient: { type: ObjectId, ref: "Partner", required: true },
  type: {
    type: String,
    enum: ["connection", "chat", "system"],
    required: true,
  },
  message: { type: String, required: true },
  data: { type: Object },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const userModel = model("User", UserSchema);
const bookmarkModel = model("Bookmark", BookmarkSchema);
const partnerModel = model("Partner", PartnerSchema);
const connectionRequestModel = model(
  "ConnectionRequest",
  ConnectionRequestSchema
);
const chatMessageModel = model("ChatMessage", ChatMessageSchema);
const notificationModel = model("Notification", NotificationSchema);

module.exports = {
  userModel,
  bookmarkModel,
  partnerModel,
  connectionRequestModel,
  chatMessageModel,
  notificationModel,
};
