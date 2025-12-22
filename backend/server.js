const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// 1. إعدادات الـ CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT"],
    credentials: true,
  })
);

app.use(express.json());

// 2. إعداد قاعدة البيانات والبيانات الموسعة
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ فشل إنشاء القاعدة:", err.message);
  } else {
    console.log("✅ متصل بقاعدة بيانات SQLite بنجاح!");

    // إنشاء جدول المستخدمين (محدث ليشمل بيانات البروفايل)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      bio TEXT
    )`);

    // إنشاء جدول السير الذاتية (لربط الـ CV بالمستخدم)
    db.run(`CREATE TABLE IF NOT EXISTS cvs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      cv_data TEXT NOT NULL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
  }
});

// 3. مسارات المستخدم (Auth & Profile)

// تسجيل مستخدم جديد
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "برجاء كمالة جميع البيانات" });
  }
  const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
  db.run(sql, [username, email, password], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE"))
        return res.status(400).json({ message: "الإيميل مسجل مسبقاً" });
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: "تم التسجيل بنجاح!", userId: this.lastID });
  });
});

// تسجيل الدخول
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
  db.get(sql, [email, password], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (row) {
      res.json({
        message: "تم تسجيل الدخول بنجاح!",
        user: {
          id: row.id,
          username: row.username,
          email: row.email,
          phone: row.phone,
          address: row.address,
          bio: row.bio,
        },
      });
    } else {
      res.status(401).json({ message: "بيانات الدخول غير صحيحة" });
    }
  });
});

// تحديث بيانات البروفايل
app.put("/api/update-profile", (req, res) => {
  const { id, username, phone, address, bio } = req.body;
  const sql = `UPDATE users SET username = ?, phone = ?, address = ?, bio = ? WHERE id = ?`;
  db.run(sql, [username, phone, address, bio, id], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "تم تحديث الملف الشخصي بنجاح" });
  });
});

// 4. مسارات السيرة الذاتية (CV Management)

// حفظ أو تحديث الـ CV
app.post("/api/save-cv", (req, res) => {
  const { user_id, cv_data } = req.body;
  const sql = `INSERT INTO cvs (user_id, cv_data) VALUES (?, ?) 
               ON CONFLICT(user_id) DO UPDATE SET cv_data = excluded.cv_data, last_updated = CURRENT_TIMESTAMP`;

  db.run(sql, [user_id, JSON.stringify(cv_data)], function (err) {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "تم حفظ السيرة الذاتية بنجاح" });
  });
});

// جلب الـ CV الخاص بمستخدم معين
app.get("/api/get-cv/:userId", (req, res) => {
  const sql = `SELECT cv_data FROM cvs WHERE user_id = ?`;
  db.get(sql, [req.params.userId], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });
    if (row) {
      res.json(JSON.parse(row.cv_data));
    } else {
      res.status(404).json({ message: "لا يوجد سيرة ذاتية محفوظة" });
    }
  });
});

// 5. تشغيل السيرفر
app.get("/", (req, res) => res.send("🚀 السيرفر جاهز لخدمة المنصة!"));
const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on: http://localhost:${PORT}`)
);
