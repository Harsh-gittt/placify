const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const {
  userModel,
  bookmarkModel,
  partnerModel,
  connectionRequestModel,
  notificationModel,
  chatMessageModel,
} = require("./db.js");

const PORT = process.env.PORT || 3000;
const mongodb_url = process.env.mongodb_url;
const jwt_secret_key = process.env.secret_key;
const SALT_ROUNDS = 10;

app.use(express.json());

// ============================================================================
// CORS CONFIGURATION
// ============================================================================
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ============================================================================
// SOCKET.IO SETUP WITH USER TRACKING
// ============================================================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Track connected users: Map<userId, socketId>
const userSockets = new Map();

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // ✅ When user comes online, store their socket mapping
  socket.on("user_online", async (data) => {
    const { userId } = data;
    if (!userId) {
      console.log("⚠️ No userId provided in user_online event");
      return;
    }

    // ✅ Store as string for consistent lookup
    const userIdStr = String(userId);
    userSockets.set(userIdStr, socket.id);
    console.log(`👤 User ${userIdStr} online (socket: ${socket.id})`);
    console.log(`📊 Total online users: ${userSockets.size}`);
    console.log(`   Online user IDs: ${Array.from(userSockets.keys()).join(", ")}`);

    try {
      // ✅ Load and send unread notifications
      const unreadNotifications = await notificationModel
        .find({ userId: userIdStr, read: false })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit("unread_notifications", unreadNotifications);
      console.log(`📬 Sent ${unreadNotifications.length} unread notifications to ${userIdStr}`);
    } catch (err) {
      console.error("❌ Error loading notifications:", err);
    }
  });

  // ✅ Cleanup on disconnect
  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`👋 User ${userId} disconnected`);
        console.log(`📊 Remaining online users: ${userSockets.size}`);
        break;
      }
    }
  });
});

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================
let userauthmiddleware;
try {
  userauthmiddleware = require("./middlewares/user.js");
} catch (err) {
  console.warn("⚠️ User middleware not found, creating inline version");
  userauthmiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    try {
      const decoded = jwt.verify(token, jwt_secret_key);
      req.id = decoded.id;
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
}

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post("/signup", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new userModel({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    console.log(`✅ User created: ${email}`);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Error while creating user", error: err.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const jwt_token = jwt.sign({ id: user._id }, jwt_secret_key, {
      expiresIn: "7d",
    });

    console.log(`✅ User signed in: ${email}`);

    return res.status(200).json({
      auth_token: jwt_token,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("❌ Signin error:", err);
    return res.status(500).json({
      message: "Signin failed",
      error: String(err?.message || err),
    });
  }
});

app.get("/get-user-details", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const partner = await partnerModel.findOne({ owner: userId });

    res.status(200).json({
      user,
      partner: partner || null,
    });
  } catch (err) {
    console.error("❌ Get user error:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// ============================================================================
// PARTNER SYSTEM
// ============================================================================

app.get("/api/partners", async (req, res) => {
  try {
    const partners = await partnerModel
      .find()
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ Fetched ${partners.length} partners from DB`);
    res.json(partners);
  } catch (err) {
    console.error("❌ Fetch partners error:", err);
    res.status(500).json({ message: "Failed to fetch partners", error: err.message });
  }
});

app.post("/api/partners", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { name, skills, lookingFor, email } = req.body;

    if (!name || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: "Name and at least one skill are required." });
    }

    if (!lookingFor) {
      return res.status(400).json({ message: "Please specify what you're looking for." });
    }

    const existingPartner = await partnerModel.findOne({ owner: userId });
    if (existingPartner) {
      return res.status(409).json({
        message: "You already have a partner profile.",
        partner: existingPartner,
      });
    }

    const user = await userModel.findById(userId);
    const partnerName = name || `${user.first_name} ${user.last_name}`;
    const initial = partnerName.charAt(0).toUpperCase();

    const partner = new partnerModel({
      owner: userId,
      name: partnerName,
      initial,
      skills,
      lookingFor,
      email: email || user.email,
      avatarColor: "#ea7a47",
    });

    await partner.save();

    console.log(`✅ Partner created: ${partner.name} (ID: ${partner._id}, Owner: ${userId})`);

    io.emit("partner_created", partner);
    console.log(`📡 Broadcasted partner_created event to all clients`);

    res.status(201).json(partner);
  } catch (err) {
    console.error("❌ Create partner error:", err);
    res.status(500).json({ message: "Failed to create partner", error: err.message });
  }
});

app.get("/api/partners/me", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const partner = await partnerModel.findOne({ owner: userId });

    if (!partner) {
      return res.status(404).json({ message: "You don't have a partner profile yet." });
    }

    res.json(partner);
  } catch (err) {
    console.error("❌ Get my partner error:", err);
    res.status(500).json({ message: "Failed to fetch partner profile", error: err.message });
  }
});

// ============================================================================
// CONNECTION REQUEST SYSTEM
// ============================================================================

app.post("/api/connections", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { toPartnerId } = req.body;

    if (!toPartnerId) {
      return res.status(400).json({ message: "Recipient partner ID required." });
    }

    console.log(`\n🔗 Connection request initiated by user: ${userId}`);

    const fromPartner = await partnerModel.findOne({ owner: userId });
    if (!fromPartner) {
      return res.status(400).json({ message: "You need to create a partner profile first." });
    }

    console.log(`   From Partner: ${fromPartner.name} (ID: ${fromPartner._id})`);

    if (fromPartner._id.toString() === toPartnerId.toString()) {
      console.log(`⛔ Self-connection blocked: ${fromPartner._id}`);
      return res.status(400).json({ error: "Cannot connect to self" });
    }

    const toPartner = await partnerModel.findById(toPartnerId);
    if (!toPartner) {
      return res.status(404).json({ message: "Recipient partner not found." });
    }

    console.log(`   To Partner: ${toPartner.name} (ID: ${toPartner._id}, Owner: ${toPartner.owner})`);

    if (fromPartner.owner.toString() === toPartner.owner.toString()) {
      console.log(`⛔ Self-connection blocked: Same owner`);
      return res.status(400).json({ error: "Cannot connect to self" });
    }

    const existing = await connectionRequestModel.findOne({
      $or: [
        { from: fromPartner._id, to: toPartner._id },
        { from: toPartner._id, to: fromPartner._id },
      ],
    });

    if (existing) {
      console.log(`⚠️ Duplicate request blocked`);
      return res.status(409).json({ message: "Connection request already exists." });
    }

    const request = new connectionRequestModel({
      from: fromPartner._id,
      to: toPartner._id,
      status: "pending",
    });
    await request.save();

    console.log(`✅ Connection request saved: ${request._id}`);

    // ✅ Create notification for recipient
    const notification = new notificationModel({
      userId: toPartner.owner,
      fromUserId: fromPartner.owner,
      type: "connection_request",
      message: `${fromPartner.name} wants to connect with you!`,
      payload: {
        requestId: request._id,
        fromPartnerId: fromPartner._id,
        fromPartnerName: fromPartner.name,
        skills: fromPartner.skills,
        lookingFor: fromPartner.lookingFor,
      },
      read: false,
    });
    await notification.save();

    console.log(`✅ Notification saved: ${notification._id}`);

    // ✅ Emit to recipient if online
    const recipientUserIdStr = String(toPartner.owner);
    const recipientSocketId = userSockets.get(recipientUserIdStr);

    console.log(`\n📡 NOTIFICATION DELIVERY CHECK:`);
    console.log(`   Recipient User ID: ${recipientUserIdStr}`);
    console.log(`   Socket ID found: ${recipientSocketId || "NOT FOUND"}`);
    console.log(`   Online users: ${Array.from(userSockets.keys()).join(", ") || "NONE"}`);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("notification", notification);
      console.log(`✅ Notification emitted to socket: ${recipientSocketId}\n`);
    } else {
      console.log(`⚠️ Recipient not online - notification saved to DB only\n`);
    }

    res.status(201).json(request);
  } catch (err) {
    console.error("❌ Send connection error:", err);
    res.status(500).json({ message: "Failed to send request", error: err.message });
  }
});

app.get("/api/connections/requests", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const partner = await partnerModel.findOne({ owner: userId });
    if (!partner) {
      return res.json([]);
    }

    const requests = await connectionRequestModel
      .find({ to: partner._id, status: "pending" })
      .populate("from", "name skills initial email")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${requests.length} pending requests for user ${userId}`);
    res.json(requests);
  } catch (err) {
    console.error("❌ Fetch requests error:", err);
    res.status(500).json({ message: "Failed to fetch requests", error: err.message });
  }
});

// ✅ GET user's accepted connections
app.get("/api/connections/accepted", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const partner = await partnerModel.findOne({ owner: userId });

    if (!partner) {
      return res.json([]);
    }

    // ✅ Fetch accepted connections from database
    const connections = await connectionRequestModel
      .find({
        $or: [{ from: partner._id }, { to: partner._id }],
        status: "accepted",
      })
      .populate("from to", "name skills initial email owner")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${connections.length} accepted connections for user ${userId}`);
    res.json(connections);
  } catch (err) {
    console.error("❌ Fetch connections error:", err);
    res.status(500).json({ message: "Failed to fetch connections", error: err.message });
  }
});

// ============================================================================
// NOTIFICATIONS & ACTIONS (ACCEPT/DECLINE)
// ============================================================================

// ✅ GET user's notifications
app.get("/api/notifications", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;

    const notifications = await notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    console.log(`✅ Fetched ${notifications.length} notifications for user ${userId}`);
    res.json(notifications);
  } catch (err) {
    console.error("❌ Fetch notifications error:", err);
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
});

// ✅ POST accept connection request
app.post("/api/notifications/:id/accept", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { id } = req.params;

    console.log(`\n✅ ACCEPTING CONNECTION REQUEST:`);
    console.log(`   Notification ID: ${id}`);
    console.log(`   User accepting: ${userId}`);

    const notification = await notificationModel.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.type !== "connection_request") {
      return res.status(400).json({ message: "Invalid notification type" });
    }

    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const fromUserId = notification.fromUserId;
    const toUserId = notification.userId;

    // Prevent self-connection
    if (fromUserId.toString() === toUserId.toString()) {
      console.log(`⛔ Self-connection blocked`);
      return res.status(400).json({ error: "Cannot connect to self" });
    }

    const fromPartner = await partnerModel.findOne({ owner: fromUserId });
    const toPartner = await partnerModel.findOne({ owner: toUserId });

    if (!fromPartner || !toPartner) {
      return res.status(404).json({ message: "Partner profile not found" });
    }

    // ✅ Check if connection already exists
    let connectionRequest = await connectionRequestModel.findOne({
      $or: [
        { from: fromPartner._id, to: toPartner._id },
        { from: toPartner._id, to: fromPartner._id },
      ],
    });

    if (connectionRequest && connectionRequest.status === "accepted") {
      console.log(`⚠️ Connection already accepted`);
      notification.read = true;
      await notification.save();
      return res.status(409).json({ message: "Connection already exists", connection: connectionRequest });
    }

    // ✅ Update or create connection
    if (connectionRequest) {
      connectionRequest.status = "accepted";
      await connectionRequest.save();
    } else {
      connectionRequest = new connectionRequestModel({
        from: fromPartner._id,
        to: toPartner._id,
        status: "accepted",
      });
      await connectionRequest.save();
    }

    // Mark notification as read
    notification.read = true;
    await notification.save();

    console.log(`✅ Connection accepted: ${fromPartner.name} ↔ ${toPartner.name}`);

    // ✅ Create acceptance notification for sender
    const acceptNotification = new notificationModel({
      userId: fromUserId,
      fromUserId: toUserId,
      type: "connection_accepted",
      message: `${toPartner.name} accepted your connection request!`,
      payload: {
        partnerName: toPartner.name,
        partnerId: toPartner._id,
      },
      read: false,
    });
    await acceptNotification.save();

    // ✅ Emit to sender if online
    const senderSocketId = userSockets.get(String(fromUserId));
    if (senderSocketId) {
      // Populate connection for real-time update
      const populatedConnection = await connectionRequestModel
        .findById(connectionRequest._id)
        .populate("from to", "name skills initial email owner");

      io.to(senderSocketId).emit("connection_accepted", {
        notification: acceptNotification,
        connection: populatedConnection,
      });
      console.log(`📬 Sent acceptance notification to ${fromUserId}`);
    }

    // Return populated connection
    const populatedConnection = await connectionRequestModel
      .findById(connectionRequest._id)
      .populate("from to", "name skills initial email owner");

    res.json({
      message: "Connection accepted",
      connection: populatedConnection,
    });
  } catch (err) {
    console.error("❌ Accept connection error:", err);
    res.status(500).json({ message: "Failed to accept connection", error: err.message });
  }
});

// ✅ POST decline connection request
app.post("/api/notifications/:id/decline", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { id } = req.params;

    console.log(`\n❌ DECLINING CONNECTION REQUEST:`);
    console.log(`   Notification ID: ${id}`);
    console.log(`   User declining: ${userId}`);

    const notification = await notificationModel.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const fromUserId = notification.fromUserId;
    const toUserId = notification.userId;

    const fromPartner = await partnerModel.findOne({ owner: fromUserId });
    const toPartner = await partnerModel.findOne({ owner: toUserId });

    // Mark notification as read/handled
    notification.read = true;
    await notification.save();

    console.log(`✅ Connection declined`);

    // ✅ Create decline notification for sender
    const declineNotification = new notificationModel({
      userId: fromUserId,
      fromUserId: toUserId,
      type: "connection_declined",
      message: `${toPartner?.name || "User"} declined your connection request.`,
      payload: {},
      read: false,
    });
    await declineNotification.save();

    // ✅ Emit to sender if online
    const senderSocketId = userSockets.get(String(fromUserId));
    if (senderSocketId) {
      io.to(senderSocketId).emit("connection_declined", {
        notification: declineNotification,
      });
      console.log(`📬 Sent decline notification to ${fromUserId}`);
    }

    res.json({ message: "Connection declined" });
  } catch (err) {
    console.error("❌ Decline connection error:", err);
    res.status(500).json({ message: "Failed to decline connection", error: err.message });
  }
});

app.put("/api/notifications/:id/read", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { id } = req.params;

    const notification = await notificationModel.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }

    res.json(notification);
  } catch (err) {
    console.error("❌ Mark notification error:", err);
    res.status(500).json({ message: "Failed to mark as read", error: err.message });
  }
});

// ============================================================================
// CHAT SYSTEM (EXISTING)
// ============================================================================

app.post("/api/chat", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { connectionId, text } = req.body;

    if (!connectionId || !text) {
      return res.status(400).json({ message: "Connection ID and text required." });
    }

    const connection = await connectionRequestModel.findById(connectionId).populate("from to");

    if (!connection || connection.status !== "accepted") {
      return res.status(404).json({ message: "Connection not found or not accepted." });
    }

    const isFromSender = connection.from.owner.toString() === userId.toString();
    const recipientUserId = isFromSender ? connection.to.owner : connection.from.owner;

    const message = new chatMessageModel({
      connectionId,
      from: userId,
      to: recipientUserId,
      text,
    });
    await message.save();

    console.log(`✅ Message sent in connection ${connectionId}`);

    const recipientSocketId = userSockets.get(String(recipientUserId));
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("new_message", {
        connectionId,
        message,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("❌ Send message error:", err);
    res.status(500).json({ message: "Failed to send message", error: err.message });
  }
});

app.get("/api/chat/:connectionId", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { connectionId } = req.params;

    const connection = await connectionRequestModel.findById(connectionId).populate("from to");
    if (!connection) {
      return res.status(404).json({ message: "Connection not found." });
    }

    const isPartOfConnection =
      connection.from.owner.toString() === userId.toString() ||
      connection.to.owner.toString() === userId.toString();

    if (!isPartOfConnection) {
      return res.status(403).json({ message: "You are not part of this connection." });
    }

    const messages = await chatMessageModel.find({ connectionId }).sort({ createdAt: 1 }).lean();

    res.json(messages);
  } catch (err) {
    console.error("❌ Fetch chat error:", err);
    res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function main() {
  try {
    if (!mongodb_url) {
      throw new Error("mongodb_url not found in environment variables");
    }
    if (!jwt_secret_key) {
      throw new Error("secret_key not found in environment variables");
    }

    await mongoose.connect(mongodb_url);
    console.log("✅ Connected to MongoDB");

    server.listen(PORT, () => {
      console.log(`\n🚀 Server running at http://localhost:${PORT}`);
      console.log(`🔐 JWT authentication: ENABLED`);
      console.log(`🟢 Socket.io: ENABLED`);
      console.log(`📡 Waiting for connections...\n`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error.message);
    process.exit(1);
  }
}

main();

