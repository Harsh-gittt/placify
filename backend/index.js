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
  chatMessageModel,
  notificationModel,
} = require("./db.js");

const PORT = process.env.PORT || 3000;
const mongodb_url = process.env.mongodb_url;
const jwt_secret_key = process.env.secret_key;
const SALT_ROUNDS = 10;

app.use(express.json());

// ✅ FIX: Better CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.post("/signup", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;

    // ✅ FIX: Better validation
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
    console.error("Signup error:", err);
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
    console.error("Signin error:", err);
    return res.status(500).json({
      message: "Signin failed",
      error: String(err?.message || err),
    });
  }
});

// ✅ FIX: Check if middleware file exists
let userauthmiddleware;
try {
  userauthmiddleware = require("./middlewares/user.js");
} catch (err) {
  console.warn("⚠️ User middleware not found, creating basic one");
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

app.get("/get-user-details", userauthmiddleware, async (req, res) => {
  try {
    const id = req.id;
    const user = await userModel.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
});

// --- Study Partner System API ---

// Create a new partner
app.post("/api/partners", async (req, res) => {
  try {
    const { name, initial, skills, lookingFor, email } = req.body;
    if (!name || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res
        .status(400)
        .json({ message: "Name and at least one skill are required." });
    }
    const partner = new partnerModel({
      name,
      initial,
      skills,
      lookingFor,
      email,
    });
    await partner.save();
    // Emit real-time event to all clients
    if (io) io.emit("partner-added", partner);
    res.status(201).json(partner);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create partner", error: err.message });
  }
});

// Get all partners
app.get("/api/partners", async (req, res) => {
  try {
    const partners = await partnerModel.find().sort({ createdAt: -1 });
    res.json(partners);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch partners", error: err.message });
  }
});

// Send a connection request
app.post("/api/connections", async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to)
      return res
        .status(400)
        .json({ message: "Both from and to partner IDs are required." });
    // Prevent duplicate requests
    const existing = await connectionRequestModel.findOne({
      from,
      to,
      status: "pending",
    });
    if (existing)
      return res.status(409).json({ message: "Request already sent." });
    const request = new connectionRequestModel({ from, to });
    await request.save();
    // Create a notification for the recipient
    const notification = new notificationModel({
      recipient: to,
      type: "connection_request",
      message: `${from} has sent you a connection request.`,
      data: {
        requestId: request._id,
        from: from,
      },
    });
    await notification.save();
    res.status(201).json(request);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to send request", error: err.message });
  }
});

// Get connection requests for a partner
app.get("/api/connections/:partnerId", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const requests = await connectionRequestModel
      .find({ to: partnerId, status: "pending" })
      .populate("from");
    res.json(requests);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch requests", error: err.message });
  }
});

// Accept or decline a connection request
app.put("/api/connections/:requestId", async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    if (!["accepted", "declined"].includes(status))
      return res.status(400).json({ message: "Invalid status." });
    const request = await connectionRequestModel.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );
    if (!request)
      return res.status(404).json({ message: "Request not found." });
    // Create a notification for the sender of the accepted request
    const sender = await userModel.findById(request.from);
    if (sender) {
      const notification = new notificationModel({
        recipient: request.from,
        type: "connection_accepted",
        message: `${sender.first_name} ${sender.last_name} has accepted your connection request.`,
        data: {
          requestId: request._id,
        },
      });
      await notification.save();
    }
    res.json(request);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update request", error: err.message });
  }
});

// Get all accepted connections for a partner
app.get("/api/connections/accepted/:partnerId", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const connections = await connectionRequestModel
      .find({
        $or: [{ from: partnerId }, { to: partnerId }],
        status: "accepted",
      })
      .populate("from to");
    res.json(connections);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch connections", error: err.message });
  }
});

// Send a chat message
app.post("/api/chat", async (req, res) => {
  try {
    const { connectionId, sender, message } = req.body;
    if (!connectionId || !sender || !message)
      return res.status(400).json({ message: "Missing fields." });
    const chat = new chatMessageModel({ connectionId, sender, message });
    await chat.save();
    // Create a notification for the recipient of the chat message
    const connection = await connectionRequestModel.findById(connectionId);
    if (connection) {
      const recipient = await userModel.findById(connection.to);
      if (recipient) {
        const notification = new notificationModel({
          recipient: recipient._id,
          type: "chat_message",
          message: `${sender} has sent you a message.`,
          data: {
            connectionId: connectionId,
          },
        });
        await notification.save();
      }
    }
    res.status(201).json(chat);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to send message", error: err.message });
  }
});

// Get chat history for a connection
app.get("/api/chat/:connectionId", async (req, res) => {
  try {
    const { connectionId } = req.params;
    const messages = await chatMessageModel
      .find({ connectionId })
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch chat", error: err.message });
  }
});

// --- Notification API ---
// Create a notification
app.post("/api/notifications", async (req, res) => {
  try {
    const { recipient, type, message, data } = req.body;
    if (!recipient || !type || !message)
      return res.status(400).json({ message: "Missing fields." });
    const notification = new notificationModel({
      recipient,
      type,
      message,
      data,
    });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create notification", error: err.message });
  }
});
// Get notifications for a user
app.get("/api/notifications/:partnerId", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const notifications = await notificationModel
      .find({ recipient: partnerId })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: err.message });
  }
});
// Mark notification as read
app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationModel.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    res.json(notification);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to mark as read", error: err.message });
  }
});

// Socket.io event handlers
io.on("connection", (socket) => {
  // Join room for a partner (by partnerId)
  socket.on("join", (partnerId) => {
    socket.join(partnerId);
  });

  // Notify recipient of new connection request
  socket.on("send-connection-request", ({ to, request }) => {
    io.to(to).emit("connection-request-received", request);
  });

  // Notify both users of accepted/declined request
  socket.on("update-connection-status", ({ to, from, status, requestId }) => {
    io.to(to).emit("connection-status-updated", { status, requestId });
    io.to(from).emit("connection-status-updated", { status, requestId });
  });

  // Real-time chat message
  socket.on("send-message", ({ connectionId, to, message }) => {
    io.to(to).emit("message-received", { connectionId, message });
  });
});

// ✅ FIX: Error handling for server startup
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
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📍 CORS enabled for frontend`);
      console.log(`🔐 JWT secret configured: ${jwt_secret_key ? "YES" : "NO"}`);
      console.log(`🟢 Socket.io enabled`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error.message);
    process.exit(1);
  }
}

main();
