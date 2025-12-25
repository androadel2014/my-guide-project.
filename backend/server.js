// server.js (FULL FILE - copy/paste)

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SECRET";

// =====================
// ✅ CORS (SUPER FIX) — no cors package
// =====================
function isAllowedOrigin(origin) {
  if (!origin) return true; // Postman/curl
  return (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
  );
}

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (isAllowedOrigin(origin)) {
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    res.setHeader("Access-Control-Max-Age", "86400");
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

// =====================
// Body Parsers
// =====================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// =====================
// DB
// =====================
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ DB Error:", err.message);
  else console.log("✅ SQLite Connected:", dbPath);
});

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cvs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cv_name TEXT,
      cv_data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
});

// =====================
// Helpers
// =====================
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function toDataStr(cv_data) {
  return typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data);
}

// =====================
// Health
// =====================
app.get("/api/health", (req, res) => res.json({ ok: true }));

// =====================
// AUTH
// =====================
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const password_hash = bcrypt.hashSync(String(password), 10);

  db.run(
    `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
    [String(username).trim(), String(email).trim(), password_hash],
    function (err) {
      if (err) {
        if (String(err.message).includes("UNIQUE")) {
          return res.status(400).json({ message: "Email already exists" });
        }
        return res.status(500).json({ message: err.message });
      }

      const user = {
        id: this.lastID,
        username: String(username).trim(),
        email: String(email).trim(),
      };

      return res.json({
        message: "Registered successfully",
        token: signToken(user),
        user,
      });
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  db.get(
    `SELECT * FROM users WHERE email = ? LIMIT 1`,
    [String(email).trim()],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!row) return res.status(401).json({ message: "Invalid credentials" });

      const ok = bcrypt.compareSync(String(password), row.password_hash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      const user = {
        id: row.id,
        username: row.username,
        email: row.email,
        phone: row.phone || "",
        address: row.address || "",
        bio: row.bio || "",
      };

      return res.json({
        message: "Login success",
        token: signToken(user),
        user,
      });
    }
  );
});

// =====================
// USER (ME)
// =====================
app.get("/api/users/me", authRequired, (req, res) => {
  db.get(
    `SELECT id, username, email, phone, address, bio FROM users WHERE id = ?`,
    [Number(req.user.id)],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: "User not found" });
      return res.json(row);
    }
  );
});

app.put("/api/users/me", authRequired, (req, res) => {
  const { username, phone, address, bio } = req.body || {};
  db.run(
    `UPDATE users SET username = ?, phone = ?, address = ?, bio = ? WHERE id = ?`,
    [
      String(username || "").trim(),
      String(phone || "").trim(),
      String(address || "").trim(),
      String(bio || "").trim(),
      Number(req.user.id),
    ],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      return res.json({ message: "Profile updated" });
    }
  );
});

// =====================
// ✅ CVs (FINAL + CLEAN)
// =====================

// ✅ Create CV
app.post("/api/cv", authRequired, (req, res) => {
  const { cv_name, cv_data } = req.body || {};
  if (!cv_data) return res.status(400).json({ message: "cv_data is required" });

  const dataStr = toDataStr(cv_data);
  const safeName = (cv_name || "New Resume").toString().trim();

  db.run(
    `INSERT INTO cvs (user_id, cv_name, cv_data, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [Number(req.user.id), safeName, dataStr],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      return res.json({ message: "CV saved", id: this.lastID });
    }
  );
});

// ✅ List user CVs (THIS is what Profile should call)
app.get("/api/cv", authRequired, (req, res) => {
  db.all(
    `SELECT id, cv_name, updated_at
     FROM cvs
     WHERE user_id = ?
     ORDER BY id DESC`,
    [Number(req.user.id)],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      return res.json(rows || []);
    }
  );
});

// ✅ Latest CV data
app.get("/api/cv/latest", authRequired, (req, res) => {
  db.get(
    `SELECT id, cv_name, cv_data, updated_at
     FROM cvs
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [Number(req.user.id)],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: "no_data_found" });

      const parsed = safeJsonParse(row.cv_data);
      if (!parsed) return res.status(500).json({ message: "Bad CV data" });

      return res.json({
        id: row.id,
        cv_name: row.cv_name,
        cv_data: parsed,
        updated_at: row.updated_at,
      });
    }
  );
});

// ✅ Get CV by id
app.get("/api/cv/:id", authRequired, (req, res) => {
  db.get(
    `SELECT id, cv_name, cv_data, updated_at
     FROM cvs
     WHERE id = ? AND user_id = ?`,
    [Number(req.params.id), Number(req.user.id)],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: "Not found" });

      const parsed = safeJsonParse(row.cv_data);
      if (!parsed) return res.status(500).json({ message: "Bad CV data" });

      return res.json({
        id: row.id,
        cv_name: row.cv_name,
        cv_data: parsed,
        updated_at: row.updated_at,
      });
    }
  );
});

// ✅ Update CV by id
app.put("/api/cv/:id", authRequired, (req, res) => {
  const { cv_name, cv_data } = req.body || {};
  if (!cv_data) return res.status(400).json({ message: "cv_data is required" });

  const dataStr = toDataStr(cv_data);
  const safeName = (cv_name || "Professional Resume").toString().trim();

  db.run(
    `UPDATE cvs
     SET cv_name = ?, cv_data = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [safeName, dataStr, Number(req.params.id), Number(req.user.id)],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0)
        return res.status(404).json({ message: "Not found" });

      return res.json({ message: "Updated" });
    }
  );
});

// ✅ Delete CV
app.delete("/api/cv/:id", authRequired, (req, res) => {
  db.run(
    `DELETE FROM cvs WHERE id = ? AND user_id = ?`,
    [Number(req.params.id), Number(req.user.id)],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0)
        return res.status(404).json({ message: "Not found" });
      return res.json({ message: "Deleted" });
    }
  );
});

// =====================
// ✅ Aliases (Support your OLD frontend calls)
// =====================

// OLD: GET /api/get-cv/:id  -> same as /api/cv/:id
app.get("/api/get-cv/:id", authRequired, (req, res) => {
  db.get(
    `SELECT id, cv_name, cv_data, updated_at
     FROM cvs
     WHERE id = ? AND user_id = ?`,
    [Number(req.params.id), Number(req.user.id)],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: "Not found" });

      const parsed = safeJsonParse(row.cv_data);
      if (!parsed) return res.status(500).json({ message: "Bad CV data" });

      return res.json({
        id: row.id,
        cv_name: row.cv_name,
        cv_data: parsed,
        updated_at: row.updated_at,
      });
    }
  );
});

// OLD: PUT /api/update-cv/:id -> same as PUT /api/cv/:id
app.put("/api/update-cv/:id", authRequired, (req, res) => {
  const { cv_name, cv_data } = req.body || {};
  if (!cv_data) return res.status(400).json({ message: "cv_data is required" });

  const dataStr = toDataStr(cv_data);
  const safeName = (cv_name || "Professional Resume").toString().trim();

  db.run(
    `UPDATE cvs
     SET cv_name = ?, cv_data = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [safeName, dataStr, Number(req.params.id), Number(req.user.id)],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      if (this.changes === 0)
        return res.status(404).json({ message: "Not found" });

      return res.json({ message: "Updated" });
    }
  );
});

// OLD: GET /api/get-all-cvs/:userId -> return list for the logged in user (ignore param safely)
app.get("/api/get-all-cvs/:userId", authRequired, (req, res) => {
  db.all(
    `SELECT id, cv_name, updated_at
     FROM cvs
     WHERE user_id = ?
     ORDER BY id DESC`,
    [Number(req.user.id)],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      return res.json(rows || []);
    }
  );
});

// OLD: POST /api/save-cv -> same as POST /api/cv
app.post("/api/save-cv", authRequired, (req, res) => {
  const { cv_name, cv_data } = req.body || {};
  if (!cv_data) return res.status(400).json({ message: "cv_data is required" });

  const dataStr = toDataStr(cv_data);
  const safeName = (cv_name || "New Resume").toString().trim();

  db.run(
    `INSERT INTO cvs (user_id, cv_name, cv_data, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
    [Number(req.user.id), safeName, dataStr],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });
      return res.json({ message: "CV saved", id: this.lastID });
    }
  );
});

// =====================
// Start
// =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
