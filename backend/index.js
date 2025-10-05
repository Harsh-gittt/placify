
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

const allowedOrigins = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({ 
  origin: allowedOrigins,
  methods: ["GET", "POST", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.post("/signup", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    const newUser = new userModel({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });
    
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
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
    return res.status(200).json({ auth_token: jwt_token });
  } catch (err) {
    return res.status(500).json({ 
      message: "Signin failed", 
      error: String(err?.message || err) 
    });
  }
});

const userauthmiddleware = require("./middlewares/user.js");

app.get("/get-user-details", userauthmiddleware, async (req, res) => {
  try {
    const id = req.id;
    const user = await userModel.findById(id).select('-password');
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
});

// ============================================================================
// INTERNSHIPS SEARCH API - WITH DEMO DATA AS FALLBACK
// ============================================================================

const CACHE_TTL_MS = 10 * 60 * 1000;
const inMemoryCache = new Map();

function buildCacheKey(path, query) {
  return (
    path +
    "?" +
    Object.keys(query)
      .sort()
      .map(
        (k) => `${k}=${Array.isArray(query[k]) ? query[k].join(",") : query[k]}`
      )
      .join("&")
  );
}

function normalizeResult(item) {
  return {
    id: item.id,
    internshipId: item.internshipId || item.id,
    title: item.title,
    company: item.company,
    logo: item.logo || null,
    location: item.location || null,
    remote: Boolean(item.remote),
    stipend: item.stipend || null,
    duration: item.duration || null,
    posted_at: item.posted_at || item.date || null,
    description_snippet: item.description_snippet || item.description || "",
    url: item.url,
    source: item.source,
  };
}

// ✅ GENERATE REALISTIC DEMO DATA
function generateDemoInternships(query) {
  const companies = [
    { name: "TCS", logo: null },
    { name: "Infosys", logo: null },
    { name: "Wipro", logo: null },
    { name: "HCL Technologies", logo: null },
    { name: "Tech Mahindra", logo: null },
    { name: "Accenture", logo: null },
    { name: "IBM India", logo: null },
    { name: "Microsoft India", logo: null },
    { name: "Amazon India", logo: null },
    { name: "Google India", logo: null },
    { name: "Flipkart", logo: null },
    { name: "Zomato", logo: null },
    { name: "Paytm", logo: null },
    { name: "Swiggy", logo: null },
    { name: "Byju's", logo: null }
  ];

  const roles = query.roles.length > 0 ? query.roles : [
    "Software Development", "Frontend", "Backend", "Full-stack", 
    "Data Analyst", "Machine Learning", "DevOps", "UI/UX"
  ];

  const locations = query.locations.length > 0 ? query.locations : [
    "Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai"
  ];

  const stipends = [
    "₹15,000/month", "₹20,000/month", "₹25,000/month", "₹18,000/month",
    "₹22,000/month", "₹30,000/month", "₹12,000/month", "₹35,000/month",
    "Unpaid", "₹10,000/month", "₹28,000/month", "₹16,000/month"
  ];

  const durations = ["3 months", "6 months", "4 months", "2 months", "3-6 months"];

  const results = [];
  const targetCount = 25;

  for (let i = 0; i < targetCount; i++) {
    const company = companies[i % companies.length];
    const role = roles[i % roles.length];
    const location = locations[i % locations.length];
    const isRemote = Math.random() > 0.7;
    
    // Apply filters
    if (query.remoteOnly && !isRemote) continue;
    
    const stipend = stipends[i % stipends.length];
    if (query.paidOnly && stipend === "Unpaid") continue;

    // Apply work type filter
    if (query.workTypes.length > 0) {
      const hasRemote = query.workTypes.includes('Remote');
      const hasOnsite = query.workTypes.includes('On-site');
      const hasHybrid = query.workTypes.includes('Hybrid');
      
      const isHybridRole = Math.random() > 0.8;
      
      if (hasRemote && !isRemote && !isHybridRole) continue;
      if (hasOnsite && isRemote && !isHybridRole) continue;
      if (hasHybrid && !isHybridRole) continue;
    }

    const postedDaysAgo = Math.floor(Math.random() * 7) + 1;
    const postedDate = new Date();
    postedDate.setDate(postedDate.getDate() - postedDaysAgo);

    results.push({
      id: `demo_${i}_${Date.now()}`,
      internshipId: `demo_${i}_${Date.now()}`,
      title: `${role} Intern`,
      company: company.name,
      logo: company.logo,
      location: isRemote ? "Remote" : location,
      remote: isRemote,
      stipend: stipend,
      duration: durations[i % durations.length],
      posted_at: postedDate.toISOString(),
      description_snippet: `We are looking for a motivated ${role} intern to join our team. You will work on real-world projects, learn from experienced professionals, and contribute to meaningful work. This is a great opportunity to gain hands-on experience in ${role.toLowerCase()}.`,
      url: `https://internships.${company.name.toLowerCase().replace(/\s+/g, '')}.com/apply/${i}`,
      source: "Demo Data",
    });
  }

  console.log(`✅ Generated ${results.length} demo internships`);
  return results;
}

// ✅ API DEBUG ENDPOINT
app.get("/api/debug/rapidapi", async (req, res) => {
  const rapidKey = process.env.RAPIDAPI_KEY;
  if (!rapidKey) {
    return res.json({ error: "RAPIDAPI_KEY not configured", configured: false });
  }

  const testEndpoints = [
    { path: '', name: 'Root' },
    { path: 'search', name: 'Search' },
    { path: 'internships', name: 'Internships' },
    { path: 'career-sites', name: 'Career Sites' },
    { path: 'job-boards', name: 'Job Boards' },
    { path: 'api/internships', name: 'API Internships' },
    { path: 'v1/internships', name: 'V1 Internships' }
  ];

  const results = [];

  for (const endpoint of testEndpoints) {
    try {
      const url = endpoint.path 
        ? `https://internships-api.p.rapidapi.com/${endpoint.path}?location_filter=India&offset=0`
        : `https://internships-api.p.rapidapi.com?location_filter=India&offset=0`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'internships-api.p.rapidapi.com',
          'x-rapidapi-key': rapidKey,
        },
      });

      results.push({
        endpoint: endpoint.name,
        path: `/${endpoint.path}`,
        status: response.status,
        working: response.ok,
        error: response.ok ? null : await response.text()
      });

      if (response.ok) {
        const data = await response.json();
        results[results.length - 1].sampleData = Array.isArray(data) ? data.length : Object.keys(data).join(', ');
      }

    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        path: `/${endpoint.path}`,
        status: 'ERROR',
        working: false,
        error: error.message
      });
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return res.json({
    configured: true,
    keyLength: rapidKey.length,
    keyPreview: rapidKey.substring(0, 8) + '...',
    testResults: results,
    workingEndpoints: results.filter(r => r.working)
  });
});

// ✅ MAIN SEARCH ENDPOINT WITH DEMO DATA FALLBACK
app.get("/api/internships/search", async (req, res) => {
  try {
    console.log('\n🔍 === New Search Request ===');
    console.log('Query params:', req.query);
    
    const {
      q = "",
      roles = [],
      workTypes = [],
      locations = [],
      paidOnly = "false",
      remoteOnly = "false",
      sort = "recent",
      page = "1",
      pageSize = "20",
    } = req.query;

    const parsed = {
      q,
      roles: Array.isArray(roles) ? roles : roles ? [roles] : [],
      workTypes: Array.isArray(workTypes) ? workTypes : workTypes ? [workTypes] : [],
      locations: Array.isArray(locations) ? locations : locations ? [locations] : [],
      paidOnly: paidOnly === "true",
      remoteOnly: remoteOnly === "true",
      sort,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20)),
    };

    console.log('Parsed filters:', parsed);

    const cacheKey = buildCacheKey("/api/internships/search", parsed);
    const now = Date.now();
    const cached = inMemoryCache.get(cacheKey);
    
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      console.log('✅ Returning cached results');
      return res.json(cached.payload);
    }

    console.log('📡 Using demo data (API endpoint issues resolved with demo)...');
    
    // Generate demo data that matches the user's filters
    const internships = generateDemoInternships(parsed);

    let merged = internships.map(normalizeResult);

    // Apply role/query filter
    if (parsed.roles.length > 0 || parsed.q) {
      const terms = [...parsed.roles, parsed.q]
        .filter(Boolean)
        .map((s) => s.toLowerCase());
      
      merged = merged.filter((i) => {
        const title = (i.title || "").toLowerCase();
        const desc = (i.description_snippet || "").toLowerCase();
        return terms.some((t) => title.includes(t) || desc.includes(t));
      });
      console.log(`📊 After role/query filter: ${merged.length}`);
    }

    // Apply location filter
    if (parsed.locations.length > 0 && !parsed.remoteOnly) {
      const needles = parsed.locations.map((s) => s.toLowerCase());
      merged = merged.filter((i) => {
        const loc = (i.location || "").toLowerCase();
        return needles.some((n) => loc.includes(n)) || i.remote;
      });
      console.log(`📊 After location filter: ${merged.length}`);
    }

    // Sort
    if (parsed.sort === "recent") {
      merged.sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0));
    } else if (parsed.sort === "stipend-desc") {
      const toNum = (s) => {
        if (!s || s === "Unpaid") return 0;
        const m = String(s).replace(/[^0-9.]/g, " ").trim().split(/\s+/).map(Number).filter(Boolean);
        return m.length ? Math.max(...m) : 0;
      };
      merged.sort((a, b) => toNum(b.stipend) - toNum(a.stipend));
    }

    const total = merged.length;
    const start = (parsed.page - 1) * parsed.pageSize;
    const pageItems = merged.slice(start, start + parsed.pageSize);

    const payload = {
      total,
      page: parsed.page,
      pageSize: parsed.pageSize,
      items: pageItems,
      sources: ['Demo Data'],
      note: 'Using demo data while API endpoint is being configured'
    };

    inMemoryCache.set(cacheKey, { timestamp: now, payload });
    
    console.log(`✅ Returning ${pageItems.length} demo items`);
    
    return res.json(payload);
    
  } catch (e) {
    console.error("❌ Error:", e);
    return res.status(500).json({ error: "Failed to fetch internships", details: e.message });
  }
});

// BOOKMARKS
app.post("/api/internships/bookmarks", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const payload = req.body;
    if (!payload || !payload.internshipId) {
      return res.status(400).json({ error: "internshipId required" });
    }
    const doc = await bookmarkModel.findOneAndUpdate(
      { userId, internshipId: payload.internshipId },
      { $set: { ...payload, userId } },
      { upsert: true, new: true }
    );
    return res.json({ ok: true, bookmark: doc });
  } catch (e) {
    return res.status(500).json({ error: "Failed to save bookmark" });
  }
});

app.get("/api/internships/bookmarks", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const docs = await bookmarkModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ items: docs });
  } catch (e) {
    return res.status(500).json({ error: "Failed to list bookmarks" });
  }
});

app.delete("/api/internships/bookmarks/:internshipId", userauthmiddleware, async (req, res) => {
  try {
    const userId = req.id;
    const { internshipId } = req.params;
    await bookmarkModel.deleteOne({ userId, internshipId });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Failed to remove bookmark" });
  }
});

async function main() {
  await mongoose.connect(mongodb_url).then(() => {
    console.log("✅ Connected to MongoDB");
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📍 RAPIDAPI_KEY: ${process.env.RAPIDAPI_KEY ? 'Configured ✅' : 'Missing ❌'}`);
    console.log(`🔧 Debug API endpoints at: http://localhost:${PORT}/api/debug/rapidapi`);
    console.log(`💡 The app will show demo data while API issues are resolved`);
  });
}

main();
