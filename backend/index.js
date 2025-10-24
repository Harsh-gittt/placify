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
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
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
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
    ],
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
    console.log(
      `   Online user IDs: ${Array.from(userSockets.keys()).join(", ")}`
    );

    try {
      // ✅ Load and send unread notifications
      const unreadNotifications = await notificationModel
        .find({ userId: userIdStr, read: false })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit("unread_notifications", unreadNotifications);
      console.log(
        `📬 Sent ${unreadNotifications.length} unread notifications to ${userIdStr}`
      );
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
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
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
    res
      .status(500)
      .json({ message: "Error while creating user", error: err.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
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
    res
      .status(500)
      .json({ message: "Failed to fetch partners", error: err.message });
  }
});

app.post("/api/partners", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { name, skills, lookingFor, email } = req.body;

    if (!name || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res
        .status(400)
        .json({ message: "Name and at least one skill are required." });
    }

    if (!lookingFor) {
      return res
        .status(400)
        .json({ message: "Please specify what you're looking for." });
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

    console.log(
      `✅ Partner created: ${partner.name} (ID: ${partner._id}, Owner: ${userId})`
    );

    io.emit("partner_created", partner);
    console.log(`📡 Broadcasted partner_created event to all clients`);

    res.status(201).json(partner);
  } catch (err) {
    console.error("❌ Create partner error:", err);
    res
      .status(500)
      .json({ message: "Failed to create partner", error: err.message });
  }
});

app.get("/api/partners/me", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const partner = await partnerModel.findOne({ owner: userId });

    if (!partner) {
      return res
        .status(404)
        .json({ message: "You don't have a partner profile yet." });
    }

    res.json(partner);
  } catch (err) {
    console.error("❌ Get my partner error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch partner profile", error: err.message });
  }
});

// ============================================================================
// CONNECTION REQUEST SYSTEM
// ============================================================================

app.post("/api/connections", userauthmiddleware, async (req, res) => {
  try {
    const fromUserId = req.id;
    const { toPartnerId } = req.body;

    console.log(`\n🔗 ====== CONNECTION REQUEST ======`);
    console.log(`   From User ID: ${fromUserId}`);
    console.log(`   To Partner ID: ${toPartnerId}`);

    if (!toPartnerId) {
      return res.status(400).json({ message: "Partner ID required" });
    }

    // Get sender's partner profile
    const fromPartner = await partnerModel.findOne({ owner: fromUserId });
    if (!fromPartner) {
      return res
        .status(404)
        .json({ message: "You need to create a partner profile first" });
    }

    // Get recipient's partner profile
    const toPartner = await partnerModel.findById(toPartnerId);
    if (!toPartner) {
      return res.status(404).json({ message: "Recipient partner not found" });
    }

    // Can't connect to self
    if (fromPartner._id.toString() === toPartner._id.toString()) {
      return res.status(400).json({ error: "Cannot connect to self" });
    }

    console.log(`   From Partner: ${fromPartner.name} (${fromPartner._id})`);
    console.log(`   To Partner: ${toPartner.name} (${toPartner._id})`);

    // ✅ FIX: Delete any old declined requests FIRST
    const deletedDeclined = await connectionRequestModel.deleteMany({
      $or: [
        { from: fromPartner._id, to: toPartner._id, status: "declined" },
        { from: toPartner._id, to: fromPartner._id, status: "declined" },
      ],
    });

    if (deletedDeclined.deletedCount > 0) {
      console.log(
        `🗑️ Deleted ${deletedDeclined.deletedCount} old declined requests`
      );
    }

    // ✅ Now check for active requests (pending or accepted only)
    const existingRequest = await connectionRequestModel.findOne({
      $or: [
        {
          from: fromPartner._id,
          to: toPartner._id,
          status: { $in: ["pending", "accepted"] },
        },
        {
          from: toPartner._id,
          to: fromPartner._id,
          status: { $in: ["pending", "accepted"] },
        },
      ],
    });

    if (existingRequest) {
      console.log(
        `⚠️ Active request already exists with status: ${existingRequest.status}`
      );
      return res.status(409).json({
        message:
          existingRequest.status === "accepted"
            ? "You are already connected"
            : "Connection request already sent",
        error: "Request exists",
      });
    }

    // Create new connection request
    const newRequest = new connectionRequestModel({
      from: fromPartner._id,
      to: toPartner._id,
      status: "pending",
    });

    await newRequest.save();
    console.log(`✅ Connection request created: ${newRequest._id}`);

    // Create notification for recipient
    const notification = new notificationModel({
      userId: toPartner.owner,
      fromUserId: fromUserId,
      type: "connection_request",
      message: `${fromPartner.name} wants to connect with you`,
      payload: {
        connectionRequestId: newRequest._id,
        fromPartnerId: fromPartner._id,
        fromPartnerName: fromPartner.name,
        skills: fromPartner.skills,
        lookingFor: fromPartner.lookingFor,
      },
      read: false,
    });

    await notification.save();
    console.log(`✅ Notification saved: ${notification._id}`);

    // Send real-time notification via socket
    const recipientSocketId = userSockets.get(String(toPartner.owner));

    console.log(`\n🔍 SOCKET DELIVERY:`);
    console.log(`   Recipient User ID: ${toPartner.owner}`);
    console.log(`   Socket ID: ${recipientSocketId || "NOT FOUND"}`);

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("notification", notification);
      console.log(`✅ Notification emitted via socket`);
    } else {
      console.log(`⚠️ Recipient offline, notification saved to DB`);
    }

    console.log(`====== CONNECTION REQUEST COMPLETE ======\n`);

    res.status(201).json({
      message: "Connection request sent successfully",
      request: newRequest,
    });
  } catch (err) {
    console.error("❌ Connection request error:", err);
    res.status(500).json({
      message: "Failed to send connection request",
      error: err.message,
    });
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

    console.log(
      `✅ Found ${requests.length} pending requests for user ${userId}`
    );
    res.json(requests);
  } catch (err) {
    console.error("❌ Fetch requests error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch requests", error: err.message });
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
      .populate("from to", "name skills initial email owner lookingFor")
      .sort({ createdAt: -1 });

    console.log(
      `✅ Found ${connections.length} accepted connections for user ${userId}`
    );
    res.json(connections);
  } catch (err) {
    console.error("❌ Fetch connections error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch connections", error: err.message });
  }
});

// DELETE connection
app.delete("/api/connections/:id", userauthmiddleware, async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = req.id;

    console.log(`\n🗑️ ====== REMOVING CONNECTION ======`);
    console.log(`   Connection ID: ${connectionId}`);
    console.log(`   User ID: ${userId}`);

    const connection = await connectionRequestModel.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found" });
    }

    // Verify user is part of this connection
    const fromPartner = await partnerModel.findById(connection.from);
    const toPartner = await partnerModel.findById(connection.to);

    if (
      fromPartner?.owner?.toString() !== userId.toString() &&
      toPartner?.owner?.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await connectionRequestModel.findByIdAndDelete(connectionId);
    console.log(`✅ Connection removed: ${connectionId}`);

    res.json({ message: "Connection removed successfully" });
  } catch (err) {
    console.error("❌ Remove connection error:", err);
    res
      .status(500)
      .json({ message: "Failed to remove connection", error: err.message });
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

    console.log(
      `✅ Fetched ${notifications.length} notifications for user ${userId}`
    );
    res.json(notifications);
  } catch (err) {
    console.error("❌ Fetch notifications error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: err.message });
  }
});

// ✅ POST accept connection request
app.post(
  "/api/notifications/:id/accept",
  userauthmiddleware,
  async (req, res) => {
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
        return res.status(409).json({
          message: "Connection already exists",
          connection: connectionRequest,
        });
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

      console.log(
        `✅ Connection accepted: ${fromPartner.name} ↔ ${toPartner.name}`
      );

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
          .populate("from to", "name skills initial email owner lookingFor");

        io.to(senderSocketId).emit("connection_accepted", {
          notification: acceptNotification,
          connection: populatedConnection,
        });
        console.log(`📬 Sent acceptance notification to ${fromUserId}`);
      }

      // Return populated connection
      const populatedConnection = await connectionRequestModel
        .findById(connectionRequest._id)
        .populate("from to", "name skills initial email owner lookingFor");

      res.json({
        message: "Connection accepted",
        connection: populatedConnection,
      });
    } catch (err) {
      console.error("❌ Accept connection error:", err);
      res
        .status(500)
        .json({ message: "Failed to accept connection", error: err.message });
    }
  }
);

// ✅ POST decline connection request
app.post(
  "/api/notifications/:id/decline",
  userauthmiddleware,
  async (req, res) => {
    try {
      const notificationId = req.params.id;
      const userId = req.id;

      console.log(`\n❌ ====== DECLINING REQUEST ======`);
      console.log(`   Notification ID: ${notificationId}`);
      console.log(`   User ID: ${userId}`);

      const notification = await notificationModel.findById(notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      if (notification.userId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // ✅ Mark connection request as declined
      const requestId = notification.payload?.connectionRequestId;
      if (requestId) {
        await connectionRequestModel.findByIdAndUpdate(requestId, {
          status: "declined",
        });
        console.log(`✅ Connection request ${requestId} marked as declined`);

        // ✅ DELETE the declined request immediately (so it can be resent)
        await connectionRequestModel.findByIdAndDelete(requestId);
        console.log(`🗑️ Deleted declined request ${requestId}`);
      }

      // Mark notification as read
      notification.read = true;
      await notification.save();

      // Send socket event to requester
      const requesterSocketId = userSockets.get(
        String(notification.fromUserId)
      );
      if (requesterSocketId) {
        io.to(requesterSocketId).emit("connection_declined", {
          notification: {
            type: "connection_declined",
            message: "Your connection request was declined",
          },
        });
        console.log(`✅ Decline notification sent to requester`);
      }

      console.log(`====== DECLINE COMPLETE ======\n`);

      res.json({
        message: "Request declined successfully",
        notification,
      });
    } catch (err) {
      console.error("❌ Decline error:", err);
      res
        .status(500)
        .json({ message: "Failed to decline request", error: err.message });
    }
  }
);

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
    res
      .status(500)
      .json({ message: "Failed to mark as read", error: err.message });
  }
});

// ============================================================================
// CHAT SYSTEM - SINGLE SET OF ROUTES (NO DUPLICATES)
// ============================================================================

// ✅ GET chat history (max 100 messages, auto-pruned)
app.get("/api/chat/:connectionId", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { connectionId } = req.params;

    console.log(`📡 Fetching chat for connection: ${connectionId}`);

    // Verify user is part of this connection
    const connection = await connectionRequestModel
      .findById(connectionId)
      .populate("from to", "owner");

    if (!connection || connection.status !== "accepted") {
      return res.status(404).json({ message: "Connection not found" });
    }

    const isPartOfConnection =
      connection.from.owner.toString() === userId.toString() ||
      connection.to.owner.toString() === userId.toString();

    if (!isPartOfConnection) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Fetch latest 100 messages
    const messages = await chatMessageModel
      .find({ connectionId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Return in chronological order (oldest first)
    messages.reverse();

    console.log(
      `✅ Fetched ${messages.length} messages for connection ${connectionId}`
    );
    res.json(messages);
  } catch (err) {
    console.error("❌ Fetch chat error:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch messages", error: err.message });
  }
});

// ✅ POST send message (auto-prune to 100 messages per connection)
// ✅ POST send message (auto-prune to 100 messages per connection)
app.post("/api/chat", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { connectionId, text } = req.body;

    if (!connectionId || !text || !text.trim()) {
      return res
        .status(400)
        .json({ message: "Connection ID and message text required" });
    }

    console.log(`\n📤 ====== SENDING MESSAGE ======`);
    console.log(`   Connection: ${connectionId}`);
    console.log(`   From User: ${userId}`);

    // Verify connection
    const connection = await connectionRequestModel
      .findById(connectionId)
      .populate("from to", "owner name");

    if (!connection || connection.status !== "accepted") {
      return res
        .status(404)
        .json({ message: "Connection not found or not accepted" });
    }

    const isFromSender = connection.from.owner.toString() === userId.toString();
    const recipientUserId = isFromSender
      ? connection.to.owner
      : connection.from.owner;
    const senderName = isFromSender ? connection.from.name : connection.to.name;

    console.log(`   To User: ${recipientUserId}`);
    console.log(`   Sender Name: ${senderName}`);

    if (!isFromSender && connection.to.owner.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Create message
    const message = new chatMessageModel({
      connectionId,
      from: userId,
      to: recipientUserId,
      text: text.trim(),
      read: false,
    });
    await message.save();

    console.log(`✅ Message saved: ${message._id}`);

    // Auto-prune
    const messageCount = await chatMessageModel.countDocuments({
      connectionId,
    });
    if (messageCount > 100) {
      const deleteCount = messageCount - 100;
      const oldMessages = await chatMessageModel
        .find({ connectionId })
        .sort({ createdAt: 1 })
        .limit(deleteCount)
        .select("_id");

      const idsToDelete = oldMessages.map((m) => m._id);
      await chatMessageModel.deleteMany({ _id: { $in: idsToDelete } });
      console.log(`🗑️ Pruned ${deleteCount} old messages`);
    }

    // ✅ IMPROVED: Real-time delivery via Socket.io
    const recipientUserIdStr = String(recipientUserId);
    const recipientSocketId = userSockets.get(recipientUserIdStr);

    console.log(`\n🔍 ====== SOCKET DELIVERY ======`);
    console.log(`   Recipient User ID (string): ${recipientUserIdStr}`);
    console.log(`   Recipient Socket ID: ${recipientSocketId || "NOT FOUND"}`);
    console.log(`   Total Online Users: ${userSockets.size}`);
    console.log(`   Online User IDs:`, Array.from(userSockets.keys()));

    if (recipientSocketId) {
      const messageData = {
        connectionId,
        message: message.toObject(),
      };

      io.to(recipientSocketId).emit("new_message", messageData);
      console.log(`✅ EMITTED new_message to socket ${recipientSocketId}`);
      console.log(`   Data:`, JSON.stringify(messageData, null, 2));
    } else {
      console.log(
        `⚠️ Recipient ${recipientUserIdStr} NOT ONLINE - message saved to DB only`
      );
    }

    // Send notification (optional)
    const notification = new notificationModel({
      userId: recipientUserId,
      fromUserId: userId,
      type: "chat_message",
      message: `${senderName}: ${text.substring(0, 50)}${
        text.length > 50 ? "..." : ""
      }`,
      payload: {
        connectionId,
        messageId: message._id,
        senderName,
      },
      read: false,
    });
    await notification.save();

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("notification", notification);
    }

    console.log(`====== MESSAGE SEND COMPLETE ======\n`);

    res.status(201).json(message);
  } catch (err) {
    console.error("❌ Send message error:", err);
    res
      .status(500)
      .json({ message: "Failed to send message", error: err.message });
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
