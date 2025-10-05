const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

require("dotenv").config();

const { userModel, bookmarkModel } = require("./db.js");

const PORT = process.env.PORT || 3000;
const mongodb_url = process.env.mongodb_url;
const jwt_secret_key = process.env.secret_key;
const SALT_ROUNDS = 10;

app.use(express.json());

// ✅ FIX: Better CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.post("/signup", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    
    // ✅ FIX: Better validation
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
    res.status(201).json({ 
      message: "User created successfully",
      user: {
        id: newUser._id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
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

    const jwt_token = jwt.sign(
      { id: user._id }, 
      jwt_secret_key,
      { expiresIn: '7d' }
    );
    
    return res.status(200).json({ 
      auth_token: jwt_token,
      user: {
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Signin error:", err);
    return res.status(500).json({ 
      message: "Signin failed", 
      error: String(err?.message || err) 
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
    const user = await userModel.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
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

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📍 CORS enabled for frontend`);
      console.log(`🔐 JWT secret configured: ${jwt_secret_key ? 'YES' : 'NO'}`);
    });
  } catch (error) {
    console.error("❌ Server startup error:", error.message);
    process.exit(1);
  }
}

main();
