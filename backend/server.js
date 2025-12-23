// server.js (Full file - copy/paste)

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// 1) CORS
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 2) SQLite DB + tables
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ فشل إنشاء القاعدة:", err.message);
  } else {
    console.log("✅ متصل بقاعدة بيانات SQLite بنجاح!");

    db.run("PRAGMA foreign_keys = ON");

    // users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      bio TEXT
    )`);

    // cvs
    db.run(`CREATE TABLE IF NOT EXISTS cvs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cv_name TEXT,
      cv_data TEXT NOT NULL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    db.run(
      `ALTER TABLE cvs ADD COLUMN last_updated DATETIME DEFAULT CURRENT_TIMESTAMP`,
      (err) => {
        if (err && !String(err.message).includes("duplicate column")) {
          console.log("last_updated migration:", err.message);
        }
      }
    );

    // roadmaps
    db.run(`CREATE TABLE IF NOT EXISTS roadmaps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      step_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);
  }
});

// 3) Auth (Register & Login)
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  db.run(sql, [username, email, password], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res
          .status(400)
          .json({ message: "البريد الإلكتروني مسجل بالفعل" });
      }
      return res.status(400).json({ message: err.message });
    }
    res.json({ message: "تم التسجيل بنجاح!", userId: this.lastID });
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
  db.get(sql, [email, password], (err, row) => {
    if (err) return res.status(500).json({ message: "خطأ في السيرفر" });
    if (row) {
      res.json({ message: "نجاح", user: row });
    } else {
      res
        .status(401)
        .json({ message: "خطأ في البريد الإلكتروني أو كلمة المرور" });
    }
  });
});

app.put("/api/update-profile", (req, res) => {
  const { id, username, phone, address, bio } = req.body;
  const sql = `UPDATE users SET username = ?, phone = ?, address = ?, bio = ? WHERE id = ?`;
  db.run(sql, [username, phone, address, bio, id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "تم تحديث البيانات بنجاح" });
  });
});

// 4) CV routes (Multi-CV)

// Save new CV
app.post("/api/save-cv", (req, res) => {
  const { user_id, cv_data, cv_name } = req.body;
  console.log("📥 محاولة حفظ لليوزر:", user_id, "باسم:", cv_name);

  const sql = `INSERT INTO cvs (user_id, cv_data, cv_name) VALUES (?, ?, ?)`;

  const stringifiedData =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data);

  db.run(
    sql,
    [user_id, stringifiedData, cv_name || "New Resume"],
    function (err) {
      if (err) {
        console.error("❌ خطأ داتابيز:", err.message);
        return res.status(500).json({ message: err.message });
      }
      res.json({ message: "تم حفظ السيرة الذاتية بنجاح", cvId: this.lastID });
    }
  );
});

// Get all CVs for a user (✅ order by newest reliably using id)
app.get("/api/get-all-cvs/:userId", (req, res) => {
  const sql = `SELECT id, cv_name, last_updated
               FROM cvs
               WHERE user_id = ?
               ORDER BY id DESC`;
  db.all(sql, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// Get latest CV (✅ order by newest reliably using id)
app.get("/api/get-cv-latest/:userId", (req, res) => {
  const sql = `SELECT cv_data
               FROM cvs
               WHERE user_id = ?
               ORDER BY id DESC
               LIMIT 1`;
  db.get(sql, [req.params.userId], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });

    if (!row) return res.status(200).json({ message: "no_data_found" });

    try {
      res.json(JSON.parse(row.cv_data));
    } catch (e) {
      res.status(500).json({ message: "خطأ في معالجة بيانات السيرة الذاتية" });
    }
  });
});

// Get CV by cvId
app.get("/api/get-cv/:cvId", (req, res) => {
  const sql = `SELECT cv_data FROM cvs WHERE id = ?`;
  db.get(sql, [req.params.cvId], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (row) {
      try {
        res.json(JSON.parse(row.cv_data));
      } catch (e) {
        res.status(500).json({ message: "خطأ في قراءة البيانات" });
      }
    } else {
      res.status(404).json({ message: "السيرة الذاتية غير موجودة" });
    }
  });
});

// Delete CV
app.delete("/api/delete-cv/:cvId", (req, res) => {
  const sql = `DELETE FROM cvs WHERE id = ?`;
  db.run(sql, [req.params.cvId], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "تم الحذف بنجاح" });
  });
});

// 5) Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () =>
  console.log(`🚀 Server running on: http://localhost:${PORT}`)
);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down...");
  server.close(() => {
    db.close(() => process.exit(0));
  });
});
