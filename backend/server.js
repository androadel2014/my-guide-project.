// server.js (FULL FILE - UPDATED: +LEGACY post_comments ALIASES FIX 404)

// =====================
// Imports
// =====================
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SECRET";

// ✅ خليه true مؤقتًا لو عايز تشوف تحذيرات ALTER / أعمدة ناقصة + SQL errors
const ALTER_LOG = false;
const SQL_LOG = true;

/* =====================
   CORS
===================== */
function isAllowedOrigin(origin) {
  if (!origin) return true;
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
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
  }

  // ✅ IMPORTANT: preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* =====================
   Body Parsers
===================== */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

/* =====================
   DB
===================== */
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");
  db.run("PRAGMA journal_mode = WAL");
  db.run("PRAGMA synchronous = NORMAL");
  db.run("PRAGMA busy_timeout = 5000");
});

function safeAlterTable(sql) {
  db.run(sql, (err) => {
    if (!err) return;
    const msg = String(err.message || "");
    const ignorable =
      msg.includes("duplicate column") ||
      msg.includes("already exists") ||
      msg.includes("no such table") ||
      msg.includes("cannot add a NOT NULL column") ||
      false;

    if (!ignorable && ALTER_LOG) {
      console.warn("SAFE_ALTER_WARNING:", msg, "SQL:", sql);
    }
  });
}

// ✅ DB wrappers (logs the real SQL errors that cause 500)
function dbAll(sql, params, cb) {
  db.all(sql, params, (err, rows) => {
    if (err && SQL_LOG) {
      console.error("SQL_ERROR:", err.message);
      console.error("SQL:", sql);
      console.error("PARAMS:", params);
    }
    cb(err, rows);
  });
}
function dbGet(sql, params, cb) {
  db.get(sql, params, (err, row) => {
    if (err && SQL_LOG) {
      console.error("SQL_ERROR:", err.message);
      console.error("SQL:", sql);
      console.error("PARAMS:", params);
    }
    cb(err, row);
  });
}
function dbRun(sql, params, cb) {
  db.run(sql, params, function (err) {
    if (err && SQL_LOG) {
      console.error("SQL_ERROR:", err.message);
      console.error("SQL:", sql);
      console.error("PARAMS:", params);
    }
    cb && cb.call(this, err);
  });
}

function safeTrim(v) {
  return String(v ?? "").trim();
}

function safeUrl(v) {
  const s = safeTrim(v);
  return s || "";
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// =====================
// Community: Places & Groups (CRUD)
// ✅ FIX: moderation + search + NO "where" before declaration
// =====================

// Helper: run sqlite safely (promise)
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}
function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
function get(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

async function ensureCommunityTables() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS community_places (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      state TEXT,
      city TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      notes TEXT,
      status TEXT,
      created_by INTEGER,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`
  );

  await run(
    db,
    `CREATE TABLE IF NOT EXISTS community_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      platform TEXT,
      link TEXT,
      state TEXT,
      city TEXT,
      topic TEXT,
      notes TEXT,
      status TEXT,
      created_by INTEGER,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`
  );

  // if tables existed earlier, add missing cols safely
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN category TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN state TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN city TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN address TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN phone TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN website TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN notes TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN created_at TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN updated_at TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN status TEXT`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN created_by INTEGER`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN reviewed_by INTEGER`);
  safeAlterTable(`ALTER TABLE community_places ADD COLUMN reviewed_at TEXT`);

  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN platform TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN link TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN state TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN city TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN topic TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN notes TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN created_at TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN updated_at TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN status TEXT`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN created_by INTEGER`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN reviewed_by INTEGER`);
  safeAlterTable(`ALTER TABLE community_groups ADD COLUMN reviewed_at TEXT`);
}

// ---------------------
// Places (CRUD)
// ---------------------
app.get("/api/community/places", authOptional, async (req, res) => {
  try {
    const { q = "", state = "", city = "", category = "" } = req.query;

    const where = [];
    const params = [];

    // moderation: public sees only approved
    const isAdmin = isAdminReq(req);
    if (!isAdmin) {
      where.push(`COALESCE(status,'approved') = 'approved'`);
    }

    if (String(q).trim()) {
      where.push("(name LIKE ? OR notes LIKE ? OR address LIKE ?)");
      params.push(`%${q.trim()}%`, `%${q.trim()}%`, `%${q.trim()}%`);
    }
    if (state) {
      where.push("state = ?");
      params.push(state);
    }
    if (String(city).trim()) {
      where.push("LOWER(city) = LOWER(?)");
      params.push(String(city).trim());
    }
    if (category) {
      where.push("category = ?");
      params.push(category);
    }

    const sql =
      `SELECT * FROM community_places ` +
      (where.length ? `WHERE ${where.join(" AND ")} ` : "") +
      `ORDER BY id DESC`;

    const rows = await all(db, sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load places" });
  }
});

app.get("/api/community/places/:id", authOptional, async (req, res) => {
  try {
    const row = await get(db, `SELECT * FROM community_places WHERE id = ?`, [
      req.params.id,
    ]);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/community/places", authRequired, async (req, res) => {
  try {
    const {
      name,
      category = "",
      state = "",
      city = "",
      address = "",
      phone = "",
      website = "",
      notes = "",
    } = req.body || {};

    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Name is required" });

    // default moderation: pending (until admin approves)
    const status = "pending";

    const r = await run(
      db,
      `INSERT INTO community_places (name, category, state, city, address, phone, website, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        category,
        state,
        String(city || "").trim(),
        String(address || "").trim(),
        String(phone || "").trim(),
        String(website || "").trim(),
        String(notes || "").trim(),
        status,
        req.user.id,
      ]
    );

    const created = await get(
      db,
      `SELECT * FROM community_places WHERE id = ?`,
      [r.lastID]
    );
    res.json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create place" });
  }
});

async function updatePlace(req, res) {
  try {
    const id = req.params.id;
    const existing = await get(
      db,
      `SELECT * FROM community_places WHERE id = ?`,
      [id]
    );
    if (!existing) return res.status(404).json({ error: "Not found" });

    const b = req.body || {};
    const next = {
      name: b.name ?? existing.name,
      category: b.category ?? existing.category,
      state: b.state ?? existing.state,
      city: b.city ?? existing.city,
      address: b.address ?? existing.address,
      phone: b.phone ?? existing.phone,
      website: b.website ?? existing.website,
      notes: b.notes ?? existing.notes,
    };

    if (!String(next.name || "").trim())
      return res.status(400).json({ error: "Name is required" });

    await run(
      db,
      `UPDATE community_places
       SET name=?, category=?, state=?, city=?, address=?, phone=?, website=?, notes=?, updated_at=datetime('now')
       WHERE id=?`,
      [
        String(next.name).trim(),
        next.category || "",
        next.state || "",
        String(next.city || "").trim(),
        String(next.address || "").trim(),
        String(next.phone || "").trim(),
        String(next.website || "").trim(),
        String(next.notes || "").trim(),
        id,
      ]
    );

    const updated = await get(
      db,
      `SELECT * FROM community_places WHERE id = ?`,
      [id]
    );
    res.json(updated);
  } catch (e) {
    console.error("updatePlace error:", e);
    res.status(500).json({ error: String(e?.message || "Failed to update") });
  }
}

// ✅ FIX: explicit /api/profile/me BEFORE /api/profile/:userId
app.get("/api/profile/me", authRequired, (req, res) => {
  req.params.userId = String(req.user.id);
  return getProfileCore(req, res);
});

// ✅ optional alias
app.get("/api/profiles/me", authRequired, (req, res) => {
  req.params.userId = String(req.user.id);
  return getProfileCore(req, res);
});

app.put("/api/community/places/:id", authRequired, updatePlace);
app.patch("/api/community/places/:id", authRequired, updatePlace);

app.delete("/api/community/places/:id", authRequired, async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await get(
      db,
      `SELECT * FROM community_places WHERE id = ?`,
      [id]
    );
    if (!existing) return res.status(404).json({ error: "Not found" });

    await run(db, `DELETE FROM community_places WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete place" });
  }
});

// ---------------------
// Groups (CRUD)
// ---------------------
app.get("/api/community/groups", authOptional, async (req, res) => {
  try {
    const {
      q = "",
      state = "",
      city = "",
      platform = "",
      topic = "",
    } = req.query;

    const where = [];
    const params = [];

    // moderation: public sees only approved
    const isAdmin = isAdminReq(req);
    if (!isAdmin) {
      where.push(`COALESCE(status,'approved') = 'approved'`);
    }

    if (String(q).trim()) {
      where.push("(name LIKE ? OR notes LIKE ?)");
      params.push(`%${q.trim()}%`, `%${q.trim()}%`);
    }
    if (state) {
      where.push("state = ?");
      params.push(state);
    }
    if (String(city).trim()) {
      where.push("LOWER(city)=LOWER(?)");
      params.push(String(city).trim());
    }
    if (platform) {
      where.push("platform = ?");
      params.push(platform);
    }
    if (topic) {
      where.push("topic = ?");
      params.push(topic);
    }

    const sql =
      `SELECT * FROM community_groups ` +
      (where.length ? `WHERE ${where.join(" AND ")} ` : "") +
      `ORDER BY id DESC`;

    const rows = await all(db, sql, params);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load groups" });
  }
});

app.get("/api/community/groups/:id", authOptional, async (req, res) => {
  try {
    const row = await get(db, `SELECT * FROM community_groups WHERE id = ?`, [
      req.params.id,
    ]);
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed" });
  }
});

app.post("/api/community/groups", authRequired, async (req, res) => {
  try {
    const {
      name,
      platform = "",
      link = "",
      state = "",
      city = "",
      topic = "",
      notes = "",
    } = req.body || {};

    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Name is required" });
    if (!link || !String(link).trim())
      return res.status(400).json({ error: "Link is required" });

    // default moderation: pending
    const status = "pending";

    const r = await run(
      db,
      `INSERT INTO community_groups (name, platform, link, state, city, topic, notes, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        platform,
        String(link).trim(),
        state,
        String(city || "").trim(),
        topic,
        String(notes || "").trim(),
        status,
        req.user.id,
      ]
    );

    const created = await get(
      db,
      `SELECT * FROM community_groups WHERE id = ?`,
      [r.lastID]
    );
    res.json(created);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create group" });
  }
});

async function updateGroup(req, res) {
  try {
    const id = req.params.id;
    const existing = await get(
      db,
      `SELECT * FROM community_groups WHERE id = ?`,
      [id]
    );
    if (!existing) return res.status(404).json({ error: "Not found" });

    const b = req.body || {};
    const next = {
      name: b.name ?? existing.name,
      platform: b.platform ?? existing.platform,
      link: b.link ?? existing.link,
      state: b.state ?? existing.state,
      city: b.city ?? existing.city,
      topic: b.topic ?? existing.topic,
      notes: b.notes ?? existing.notes,
    };

    if (!String(next.name || "").trim())
      return res.status(400).json({ error: "Name is required" });
    if (!String(next.link || "").trim())
      return res.status(400).json({ error: "Link is required" });

    await run(
      db,
      `UPDATE community_groups
       SET name=?, platform=?, link=?, state=?, city=?, topic=?, notes=?, updated_at=datetime('now')
       WHERE id=?`,
      [
        String(next.name).trim(),
        next.platform || "",
        String(next.link).trim(),
        next.state || "",
        String(next.city || "").trim(),
        next.topic || "",
        String(next.notes || "").trim(),
        id,
      ]
    );

    const updated = await get(
      db,
      `SELECT * FROM community_groups WHERE id = ?`,
      [id]
    );
    res.json(updated);
  } catch (e) {
    console.error("updateGroup error:", e);
    res.status(500).json({ error: String(e?.message || "Failed to update") });
  }
}
app.put("/api/community/groups/:id", authRequired, updateGroup);
app.patch("/api/community/groups/:id", authRequired, updateGroup);

app.delete("/api/community/groups/:id", authRequired, async (req, res) => {
  try {
    const id = req.params.id;
    const existing = await get(
      db,
      `SELECT * FROM community_groups WHERE id = ?`,
      [id]
    );
    if (!existing) return res.status(404).json({ error: "Not found" });

    await run(db, `DELETE FROM community_groups WHERE id = ?`, [id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete group" });
  }
});

// =====================
// Community Places Reviews (SQLite) — FIXED ORDER + WRAPPERS
// =====================

// 1) ensure reviews table exists AFTER community_places is created
async function ensurePlaceReviewsTable() {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS place_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_id INTEGER NOT NULL,
      user_id INTEGER,
      name TEXT NOT NULL,
      stars INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(place_id) REFERENCES community_places(id) ON DELETE CASCADE
    )`
  );

  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_place_reviews_place
     ON place_reviews(place_id)`
  );

  // ✅ 1) Clean duplicates BEFORE unique index
  // Keep the latest review (max id) for each (place_id, user_id) and delete the rest
  await run(
    db,
    `
    DELETE FROM place_reviews
    WHERE id NOT IN (
      SELECT MAX(id)
      FROM place_reviews
      WHERE user_id IS NOT NULL
      GROUP BY place_id, user_id
    )
    AND user_id IS NOT NULL
    `
  );

  // ✅ 2) Now it's safe to add UNIQUE constraint
  await run(
    db,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_place_reviews_unique
     ON place_reviews(place_id, user_id)`
  );
}

// ✅ IMPORTANT: call it after ensureCommunityTables finishes
(async () => {
  try {
    await ensureCommunityTables();
    await ensurePlaceReviewsTable();
    console.log("✅ Community tables ready");
  } catch (e) {
    console.error("❌ Community init failed:", e);
  }
})();

// 2) GET reviews for a community place
app.get("/api/community/places/:id/reviews", authOptional, (req, res) => {
  const placeId = toInt(req.params.id);
  if (!placeId) return res.status(400).json({ error: "Bad place id" });

  dbAll(
    `
    SELECT
      pr.id,
      pr.place_id,
      pr.user_id,
      COALESCE(u.username, pr.name) AS user_name,
      pr.stars,
      pr.text,
      pr.created_at
    FROM place_reviews pr
    LEFT JOIN users u ON u.id = pr.user_id
    WHERE pr.place_id = ?
    ORDER BY pr.id DESC
    `,
    [placeId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      return res.json(rows || []);
    }
  );
});

// 3) POST review for a community place
app.post("/api/community/places/:id/reviews", authRequired, (req, res) => {
  const placeId = toInt(req.params.id);
  if (!placeId) return res.status(400).json({ error: "Bad place id" });

  const text = safeTrim(req.body?.text);
  const stars = Number(req.body?.stars);

  if (!text) return res.status(400).json({ error: "text required" });
  if (!(stars >= 1 && stars <= 5))
    return res.status(400).json({ error: "stars must be 1..5" });

  // ✅ تأكد المكان موجود
  dbGet(
    `SELECT id FROM community_places WHERE id = ?`,
    [placeId],
    (e0, row) => {
      if (e0) return res.status(500).json({ error: "DB error" });
      if (!row) return res.status(404).json({ error: "Place not found" });

      // ✅ اسم اليوزر يتجاب من DB (مش من الbody)
      dbGet(
        `SELECT username FROM users WHERE id = ?`,
        [req.user.id],
        (eU, uRow) => {
          if (eU) return res.status(500).json({ error: "DB error" });

          const userName = safeTrim(uRow?.username) || `User ${req.user.id}`;

          // ✅ تقييم واحد لكل يوزر لكل مكان (Upsert)
          dbRun(
            `
            INSERT INTO place_reviews (place_id, user_id, name, stars, text, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(place_id, user_id) DO UPDATE SET
              name = excluded.name,
              stars = excluded.stars,
              text = excluded.text,
              created_at = datetime('now')
            `,
            [placeId, req.user.id, userName, Math.round(stars), text],
            function (err) {
              if (err) return res.status(500).json({ error: "DB error" });
              return res.status(201).json({ ok: true });
            }
          );
        }
      );
    }
  );
});

function normalizeCvResponse(row) {
  const parsed = safeJsonParse(row.cv_data);
  return {
    id: row.id,
    cv_name: row.cv_name,
    updated_at: row.updated_at,
    cv_data: parsed || row.cv_data,
  };
}

function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// 4) DELETE my review for a community place
app.delete("/api/community/places/:id/reviews/me", authRequired, (req, res) => {
  const placeId = toInt(req.params.id);
  if (!placeId) return res.status(400).json({ error: "Bad place id" });

  dbRun(
    `DELETE FROM place_reviews WHERE place_id = ? AND user_id = ?`,
    [placeId, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "DB error" });
      return res.json({ ok: true, deleted: this.changes || 0 });
    }
  );
});

/* =====================
   ✅ helpers for flexible ids
===================== */
function parseAnyPostId(raw) {
  const s = safeTrim(raw || "");
  if (!s) return { kind: "bad" };

  if (s.startsWith("p_")) {
    const id = toInt(s.slice(2));
    return id ? { kind: "feed", id } : { kind: "bad" };
  }
  if (s.startsWith("pp_")) {
    const id = toInt(s.slice(3));
    return id ? { kind: "profile", id } : { kind: "bad" };
  }

  // numeric (unknown: could be feed OR profile)
  const id = toInt(s);
  return id ? { kind: "numeric", id } : { kind: "bad" };
}

/* =====================
   Schema
===================== */
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

  /* =====================
     USERS
  ===================== */
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      phone TEXT,
      address TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  /* =====================
     CVS
  ===================== */
  db.run(`
    CREATE TABLE IF NOT EXISTS cvs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      cv_name TEXT,
      cv_data TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cvs_user ON cvs(user_id)`);

  /* =====================
     FEED POSTS
  ===================== */
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at)`);

  db.run(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id)`
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      parent_comment_id INTEGER,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ✅ SAFE: لو جدول قديم ناقص العمود
  safeAlterTable(
    `ALTER TABLE post_comments ADD COLUMN parent_comment_id INTEGER`
  );

  db.run(
    `CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_comments_user ON post_comments(user_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_comments_parent ON post_comments(parent_comment_id)`
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS post_comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(comment_id, user_id),
      FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON post_comment_likes(comment_id)`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON post_comment_likes(user_id)`
  );

  /* =====================
     SOCIAL PROFILE TABLES
  ===================== */
  db.run(`
    CREATE TABLE IF NOT EXISTS user_profile (
      user_id INTEGER PRIMARY KEY,
      username TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      cover_url TEXT,
      bio TEXT,
      location TEXT,
      phone TEXT,
      whatsapp TEXT,
      website TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ✅ SAFE ALTERS: لو user_profile قديم ناقص أعمدة
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN username TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN display_name TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN avatar_url TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN cover_url TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN bio TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN location TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN phone TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN whatsapp TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN website TEXT`);
  safeAlterTable(
    `ALTER TABLE user_profile ADD COLUMN is_verified INTEGER DEFAULT 0`
  );
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN created_at TEXT`);
  safeAlterTable(`ALTER TABLE user_profile ADD COLUMN updated_at TEXT`);

  db.run(`
    CREATE TABLE IF NOT EXISTS follows (
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profile_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      media_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ✅ أهم حتة: لو profile_posts قديم ناقص media_url أو created_at -> كان بيعمل 500
  safeAlterTable(`ALTER TABLE profile_posts ADD COLUMN media_url TEXT`);
  safeAlterTable(`ALTER TABLE profile_posts ADD COLUMN created_at TEXT`);

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price_type TEXT DEFAULT 'negotiable',
      price_value REAL,
      location TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      currency TEXT DEFAULT 'USD',
      images_json TEXT,
      location TEXT,
      is_available INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, author_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // indexes
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_profile_posts_user ON profile_posts(user_id)`
  );
  db.run(`CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id)`);
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)`
  );
});

/* =====================
   Auth Helpers
===================== */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

function authRequired(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.sendStatus(401);
  }
}

function authOptional(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return next();
  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {}
  next();
}

// =====================
// Admin helpers (Moderation)
// =====================
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isAdminReq(req) {
  const email = String(req.user?.email || "").toLowerCase();
  return ADMIN_EMAILS.includes(email);
}

function adminRequired(req, res, next) {
  if (!req.user) return res.sendStatus(401);
  if (!isAdminReq(req)) return res.sendStatus(403);
  next();
}

/* =====================
   Profile bootstrap
===================== */
function ensureProfileRow(userId, cb) {
  dbGet(
    `SELECT up.user_id FROM user_profile up WHERE up.user_id = ?`,
    [userId],
    (e1, row) => {
      if (e1) return cb(e1);
      if (row) return cb(null);

      dbGet(
        `SELECT id, username FROM users WHERE id = ?`,
        [userId],
        (e2, u) => {
          if (e2) return cb(e2);

          const baseUsername = safeTrim(u?.username) || `user${userId}`;
          const displayName = safeTrim(u?.username) || `User ${userId}`;

          const candidates = [
            baseUsername,
            `${baseUsername}${userId}`,
            `user${userId}`,
            `member${userId}`,
          ];

          (function tryInsert(i) {
            if (i >= candidates.length) {
              const last = `user${userId}_${Date.now()}`;
              return dbRun(
                `INSERT OR IGNORE INTO user_profile (user_id, username, display_name) VALUES (?,?,?)`,
                [userId, last, displayName],
                () => cb(null)
              );
            }

            dbRun(
              `INSERT OR IGNORE INTO user_profile (user_id, username, display_name) VALUES (?,?,?)`,
              [userId, candidates[i], displayName],
              function () {
                dbGet(
                  `SELECT user_id FROM user_profile WHERE user_id = ?`,
                  [userId],
                  (e3, okRow) => {
                    if (e3) return cb(e3);
                    if (okRow) return cb(null);
                    tryInsert(i + 1);
                  }
                );
              }
            );
          })(0);
        }
      );
    }
  );
}

/* ✅ delete feed-post (posts table) safely with cascades */
function deleteFeedPostOwnedBy(userId, postId, res) {
  const pid = toInt(postId);
  if (!pid) return res.status(400).json({ message: "Bad postId" });

  dbGet(`SELECT id, user_id FROM posts WHERE id = ?`, [pid], (err, row) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    if (!row) return res.status(404).json({ message: "Post not found" });
    if (row.user_id !== userId) return res.sendStatus(403);

    dbRun(`DELETE FROM posts WHERE id = ?`, [pid], function (err2) {
      if (err2) return res.status(500).json({ message: "Delete failed" });
      return res.json({ ok: true });
    });
  });
}

/* =====================
   HEALTH
===================== */
app.get("/api/health", (req, res) => res.json({ ok: true }));

/* =====================
   AUTH
===================== */
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const hash = bcrypt.hashSync(password, 10);

  dbRun(
    `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
    [safeTrim(username), safeTrim(email).toLowerCase(), hash],
    function (err) {
      if (err) return res.status(400).json({ message: "Email exists" });

      const user = {
        id: this.lastID,
        username: safeTrim(username),
        email: safeTrim(email).toLowerCase(),
        phone: "",
        address: "",
        bio: "",
      };

      ensureProfileRow(user.id, () => {});

      return res.json({
        token: signToken({
          id: user.id,
          username: user.username,
          email: user.email,
        }),
        user,
      });
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ message: "Missing fields" });

  dbGet(
    `SELECT * FROM users WHERE email = ?`,
    [safeTrim(email).toLowerCase()],
    (err, user) => {
      if (!user) return res.sendStatus(401);
      if (!bcrypt.compareSync(password, user.password_hash))
        return res.sendStatus(401);

      const me = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
      };

      ensureProfileRow(user.id, () => {});

      return res.json({
        token: signToken({
          id: user.id,
          username: user.username,
          email: user.email,
        }),
        user: me,
      });
    }
  );
});

/* =====================
   USERS
===================== */
app.get("/api/users/me", authRequired, (req, res) => {
  dbGet(
    `SELECT id, username, email, phone, address, bio FROM users WHERE id = ?`,
    [req.user.id],
    (err, me) => {
      if (!me) return res.sendStatus(404);
      res.json(me);
    }
  );
});

app.put("/api/users/me", authRequired, (req, res) => {
  const { username, phone, address, bio } = req.body || {};

  dbRun(
    `
    UPDATE users
    SET username = ?, phone = ?, address = ?, bio = ?
    WHERE id = ?
    `,
    [
      safeTrim(username),
      safeTrim(phone),
      safeTrim(address),
      safeTrim(bio),
      req.user.id,
    ],
    function (err) {
      if (err) return res.status(500).json({ message: "Update failed" });

      dbGet(
        `SELECT id, username, email, phone, address, bio FROM users WHERE id = ?`,
        [req.user.id],
        (e2, me) => {
          if (!me) return res.status(500).json({ message: "Update failed" });
          return res.json(me);
        }
      );
    }
  );
});

/* =====================
   CVS (New)
===================== */
app.get("/api/cv", authRequired, (req, res) => {
  dbAll(
    `SELECT id, user_id, cv_name, updated_at FROM cvs WHERE user_id = ? ORDER BY id DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load CVs" });
      res.json(rows || []);
    }
  );
});

app.get("/api/cv/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  dbGet(
    `SELECT id, user_id, cv_name, cv_data, updated_at FROM cvs WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    (err, row) => {
      if (!row) return res.status(404).json({ message: "CV not found" });
      return res.json(normalizeCvResponse(row));
    }
  );
});

app.post("/api/cv", authRequired, (req, res) => {
  const { cv_name, cv_data } = req.body || {};
  const name = safeTrim(cv_name || "RESUME");
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  dbRun(
    `INSERT INTO cvs (user_id, cv_name, cv_data, updated_at) VALUES (?, ?, ?, datetime('now'))`,
    [req.user.id, name, dataStr],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to create CV" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put("/api/cv/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  const { cv_name, cv_data } = req.body || {};
  const name = safeTrim(cv_name || "RESUME");
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  dbRun(
    `
    UPDATE cvs
    SET cv_name = ?, cv_data = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
    `,
    [name, dataStr, id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update CV" });
      if (this.changes === 0)
        return res.status(404).json({ message: "CV not found" });
      res.json({ ok: true });
    }
  );
});

app.delete("/api/cv/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  dbRun(
    `DELETE FROM cvs WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Delete failed" });
      if (this.changes === 0)
        return res.status(404).json({ message: "CV not found" });
      res.json({ ok: true });
    }
  );
});

/* =====================
   ✅ LEGACY CVS ENDPOINTS
===================== */
app.get("/api/get-cv/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  dbGet(
    `SELECT id, user_id, cv_name, cv_data, updated_at FROM cvs WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    (err, row) => {
      if (!row) return res.status(404).json({ message: "CV not found" });
      return res.json(normalizeCvResponse(row));
    }
  );
});

app.get("/api/get-all-cvs/:userId", authRequired, (req, res) => {
  dbAll(
    `SELECT id, user_id, cv_name, updated_at FROM cvs WHERE user_id = ? ORDER BY id DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load CVs" });
      res.json(rows || []);
    }
  );
});

app.get("/api/cv/latest/:userId", authRequired, (req, res) => {
  dbGet(
    `SELECT id, user_id, cv_name, cv_data, updated_at
     FROM cvs
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 1`,
    [req.user.id],
    (err, row) => {
      if (!row) return res.status(404).json({ message: "No CV yet" });
      return res.json(normalizeCvResponse(row));
    }
  );
});

app.put("/api/update-cv/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  const { cv_name, cv_data } = req.body || {};
  const name = safeTrim(cv_name || "RESUME");
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  dbRun(
    `
    UPDATE cvs
    SET cv_name = ?, cv_data = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
    `,
    [name, dataStr, id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to update CV" });
      if (this.changes === 0)
        return res.status(404).json({ message: "CV not found" });
      res.json({ ok: true });
    }
  );
});

app.post("/api/create-cv", authRequired, (req, res) => {
  const { cv_name, cv_data } = req.body || {};
  const name = safeTrim(cv_name || "RESUME");
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  dbRun(
    `INSERT INTO cvs (user_id, cv_name, cv_data, updated_at) VALUES (?, ?, ?, datetime('now'))`,
    [req.user.id, name, dataStr],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to create CV" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.delete("/api/delete-cv/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  dbRun(
    `DELETE FROM cvs WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Delete failed" });
      if (this.changes === 0)
        return res.status(404).json({ message: "CV not found" });
      res.json({ ok: true });
    }
  );
});

/* =====================
   ✅ SOCIAL PROFILE APIs
===================== */
function getProfileCore(req, res) {
  const targetId = toInt(req.params.userId);
  if (!targetId) return res.status(400).json({ message: "Bad userId" });

  ensureProfileRow(targetId, (e0) => {
    if (e0) return res.status(500).json({ message: "Failed" });

    dbGet(
      `SELECT * FROM user_profile WHERE user_id = ?`,
      [targetId],
      (e1, p) => {
        if (e1) return res.status(500).json({ message: "Failed" });
        if (!p) return res.status(404).json({ message: "Profile not found" });

        const meId = req.user?.id || 0;

        dbGet(
          `SELECT COUNT(*) c FROM follows WHERE following_id = ?`,
          [targetId],
          (eF1, rFollowers) => {
            if (eF1) return res.status(500).json({ message: "Failed" });

            dbGet(
              `SELECT COUNT(*) c FROM follows WHERE follower_id = ?`,
              [targetId],
              (eF2, rFollowing) => {
                if (eF2) return res.status(500).json({ message: "Failed" });

                dbGet(
                  `
                  SELECT
                    (SELECT COUNT(*) FROM profile_posts WHERE user_id = ?) +
                    (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS c
                  `,
                  [targetId, targetId],
                  (eP, rPosts) => {
                    if (eP) return res.status(500).json({ message: "Failed" });

                    dbGet(
                      `SELECT COUNT(*) c FROM services WHERE user_id = ? AND is_active = 1`,
                      [targetId],
                      (eS, rServices) => {
                        if (eS)
                          return res.status(500).json({ message: "Failed" });

                        dbGet(
                          `SELECT COUNT(*) c FROM products WHERE user_id = ? AND is_available = 1`,
                          [targetId],
                          (ePr, rProducts) => {
                            if (ePr)
                              return res
                                .status(500)
                                .json({ message: "Failed" });

                            dbGet(
                              `SELECT COALESCE(AVG(rating),0) avg FROM reviews WHERE user_id = ?`,
                              [targetId],
                              (eR1, rAvg) => {
                                if (eR1)
                                  return res
                                    .status(500)
                                    .json({ message: "Failed" });

                                dbGet(
                                  `SELECT COUNT(*) c FROM reviews WHERE user_id = ?`,
                                  [targetId],
                                  (eR2, rCnt) => {
                                    if (eR2)
                                      return res
                                        .status(500)
                                        .json({ message: "Failed" });

                                    const base = {
                                      profile: p,
                                      stats: {
                                        followers: Number(rFollowers?.c || 0),
                                        following: Number(rFollowing?.c || 0),
                                        posts: Number(rPosts?.c || 0),
                                        services: Number(rServices?.c || 0),
                                        products: Number(rProducts?.c || 0),
                                        ratingAvg: Number(rAvg?.avg || 0),
                                        ratingCount: Number(rCnt?.c || 0),
                                      },
                                      isMe: meId === targetId,
                                      isFollowing: false,
                                    };

                                    if (!meId) return res.json(base);

                                    dbGet(
                                      `SELECT 1 x FROM follows WHERE follower_id = ? AND following_id = ?`,
                                      [meId, targetId],
                                      (eF3, fRow) => {
                                        if (eF3)
                                          return res
                                            .status(500)
                                            .json({ message: "Failed" });
                                        res.json({
                                          ...base,
                                          isFollowing: !!fRow,
                                        });
                                      }
                                    );
                                  }
                                );
                              }
                            );
                          }
                        );
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
}

// ✅ FIX: explicit GET /api/profile/me BEFORE /api/profile/:userId
app.get("/api/profile/me", authRequired, (req, res) => {
  req.params.userId = String(req.user.id);
  return getProfileCore(req, res);
});

// ✅ optional alias (لو عندك كود بيطلبها)
app.get("/api/profiles/me", authRequired, (req, res) => {
  req.params.userId = String(req.user.id);
  return getProfileCore(req, res);
});

app.get("/api/profile/:userId", authOptional, getProfileCore);
app.get("/api/profiles/:userId", authOptional, getProfileCore);

app.put("/api/profile/me", authRequired, (req, res) => {
  const userId = req.user.id;

  ensureProfileRow(userId, (e0) => {
    if (e0) return res.status(500).json({ message: "Failed" });

    const body = req.body || {};
    const username = safeTrim(body.username);
    const display_name = safeTrim(body.display_name);
    const avatar_url = safeUrl(body.avatar_url);
    const cover_url = safeUrl(body.cover_url);
    const bio = safeTrim(body.bio);
    const location = safeTrim(body.location);
    const phone = safeTrim(body.phone);
    const whatsapp = safeTrim(body.whatsapp);
    const website = safeUrl(body.website);

    function doUpdate() {
      dbRun(
        `
        UPDATE user_profile
        SET
          username = COALESCE(?, username),
          display_name = COALESCE(?, display_name),
          avatar_url = COALESCE(?, avatar_url),
          cover_url = COALESCE(?, cover_url),
          bio = COALESCE(?, bio),
          location = COALESCE(?, location),
          phone = COALESCE(?, phone),
          whatsapp = COALESCE(?, whatsapp),
          website = COALESCE(?, website),
          updated_at = datetime('now')
        WHERE user_id = ?
        `,
        [
          username || null,
          display_name || null,
          avatar_url || null,
          cover_url || null,
          bio || null,
          location || null,
          phone || null,
          whatsapp || null,
          website || null,
          userId,
        ],
        function (e2) {
          if (e2)
            return res.status(500).json({ message: "Profile update failed" });

          dbGet(
            `SELECT * FROM user_profile WHERE user_id = ?`,
            [userId],
            (e3, p) => {
              if (e3 || !p)
                return res
                  .status(500)
                  .json({ message: "Profile update failed" });
              return res.json({ ok: true, profile: p });
            }
          );
        }
      );
    }

    if (!username) return doUpdate();

    dbGet(
      `SELECT user_id FROM user_profile WHERE username = ? AND user_id != ?`,
      [username, userId],
      (e1, row) => {
        if (e1) return res.status(500).json({ message: "Failed" });
        if (row)
          return res.status(400).json({ message: "Username already taken" });
        doUpdate();
      }
    );
  });
});

function followCore(req, res) {
  const me = req.user.id;
  const target = toInt(req.params.userId);
  if (!target) return res.status(400).json({ message: "Bad userId" });
  if (me === target)
    return res.status(400).json({ message: "Cannot follow yourself" });

  dbRun(
    `INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)`,
    [me, target],
    (err) => {
      if (err) return res.status(500).json({ message: "Follow failed" });
      res.json({ ok: true });
    }
  );
}

function unfollowCore(req, res) {
  const me = req.user.id;
  const target = toInt(req.params.userId);
  if (!target) return res.status(400).json({ message: "Bad userId" });

  dbRun(
    `DELETE FROM follows WHERE follower_id = ? AND following_id = ?`,
    [me, target],
    (err) => {
      if (err) return res.status(500).json({ message: "Unfollow failed" });
      res.json({ ok: true });
    }
  );
}

app.post("/api/profile/:userId/follow", authRequired, followCore);
app.delete("/api/profile/:userId/follow", authRequired, unfollowCore);
app.post("/api/profiles/:userId/follow", authRequired, followCore);
app.delete("/api/profiles/:userId/follow", authRequired, unfollowCore);

/* ===== Tabs: PROFILE POSTS (✅ returns profile_posts + feed posts) ===== */
function getProfilePostsCore(req, res) {
  const userId = toInt(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  const sql = `
    SELECT *
    FROM (
      SELECT
        ('pp_' || pp.id) AS id,
        pp.user_id AS user_id,
        pp.content AS content,
        pp.media_url AS media_url,
        pp.created_at AS created_at,
        NULL AS category,
        'profile' AS source,
        u.username AS user_name
      FROM profile_posts pp
      LEFT JOIN users u ON u.id = pp.user_id
      WHERE pp.user_id = ?

      UNION ALL

      SELECT
        ('p_' || p.id) AS id,
        p.user_id AS user_id,
        p.content AS content,
        NULL AS media_url,
        p.created_at AS created_at,
        p.category AS category,
        'feed' AS source,
        u2.username AS user_name
      FROM posts p
      LEFT JOIN users u2 ON u2.id = p.user_id
      WHERE p.user_id = ?
    )
    ORDER BY datetime(created_at) DESC
    LIMIT 200
  `;

  dbAll(sql, [userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ message: "Failed to load posts" });
    res.json({ posts: rows || [] });
  });
}

app.get("/api/profile/:userId/posts", authOptional, getProfilePostsCore);
app.get("/api/profiles/:userId/posts", authOptional, getProfilePostsCore);

app.get("/api/profile_posts/:userId", authOptional, getProfilePostsCore);
app.get("/api/profile_posts/:userId/posts", authOptional, getProfilePostsCore);

// ✅ NEW: dash aliases (fix 404 from frontend)
app.get("/api/profile-posts/:userId", authOptional, getProfilePostsCore);
app.get("/api/profile-posts/:userId/posts", authOptional, getProfilePostsCore);

// ✅ NEW: users alias (fix 404: /api/users/2/posts)
app.get("/api/users/:userId/posts", authOptional, getProfilePostsCore);

app.post("/api/profile/me/posts", authRequired, (req, res) => {
  const content = safeTrim(req.body?.content);
  const media_url = safeUrl(req.body?.media_url);
  if (!content) return res.status(400).json({ message: "Empty post" });

  dbRun(
    `INSERT INTO profile_posts (user_id, content, media_url) VALUES (?, ?, ?)`,
    [req.user.id, content, media_url || null],
    function (err) {
      if (err) return res.status(500).json({ message: "Create post failed" });
      res.json({ ok: true, id: `pp_${this.lastID}` });
    }
  );
});

// ✅ NEW: GET single profile/me post (supports pp_ / p_ / numeric)
app.get("/api/profile/me/posts/:postId", authRequired, (req, res) => {
  const parsed = parseAnyPostId(req.params.postId);

  if (parsed.kind === "bad") {
    return res.status(400).json({ message: "Bad postId" });
  }

  // explicit profile
  if (parsed.kind === "profile") {
    return dbGet(
      `SELECT id, user_id, content, media_url, created_at
       FROM profile_posts
       WHERE id = ? AND user_id = ?`,
      [parsed.id, req.user.id],
      (err, row) => {
        if (err) return res.status(500).json({ message: "Failed" });
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json({ ...row, id: `pp_${row.id}`, source: "profile" });
      }
    );
  }

  // explicit feed
  if (parsed.kind === "feed") {
    return dbGet(
      `SELECT p.*, u.username AS user_name
       FROM posts p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.id = ? AND p.user_id = ?`,
      [parsed.id, req.user.id],
      (err, row) => {
        if (err) return res.status(500).json({ message: "Failed" });
        if (!row) return res.status(404).json({ message: "Not found" });
        res.json({ ...row, id: `p_${row.id}`, source: "feed" });
      }
    );
  }

  // numeric: try feed first then profile
  dbGet(
    `SELECT p.*, u.username AS user_name
     FROM posts p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.id = ? AND p.user_id = ?`,
    [parsed.id, req.user.id],
    (e1, feedRow) => {
      if (e1) return res.status(500).json({ message: "Failed" });
      if (feedRow) {
        return res.json({ ...feedRow, id: `p_${feedRow.id}`, source: "feed" });
      }

      dbGet(
        `SELECT id, user_id, content, media_url, created_at
         FROM profile_posts
         WHERE id = ? AND user_id = ?`,
        [parsed.id, req.user.id],
        (e2, profRow) => {
          if (e2) return res.status(500).json({ message: "Failed" });
          if (!profRow) return res.status(404).json({ message: "Not found" });
          res.json({ ...profRow, id: `pp_${profRow.id}`, source: "profile" });
        }
      );
    }
  );
});

/* ========= UPDATE Profile / Feed Post (PUT + PATCH) ========= */
function updateMyPostCore(req, res) {
  const parsed = parseAnyPostId(req.params.postId);
  const content = safeTrim(req.body?.content);

  if (parsed.kind === "bad")
    return res.status(400).json({ message: "Bad postId" });
  if (!content) return res.status(400).json({ message: "Empty content" });

  // explicit profile
  if (parsed.kind === "profile") {
    return dbRun(
      `UPDATE profile_posts SET content = ? WHERE id = ? AND user_id = ?`,
      [content, parsed.id, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: "Update failed" });
        if (this.changes === 0)
          return res.status(404).json({ message: "Post not found" });
        return res.json({ ok: true });
      }
    );
  }

  // explicit feed
  if (parsed.kind === "feed") {
    return dbRun(
      `UPDATE posts SET content = ? WHERE id = ? AND user_id = ?`,
      [content, parsed.id, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: "Update failed" });
        if (this.changes === 0)
          return res.status(404).json({ message: "Post not found" });
        return res.json({ ok: true });
      }
    );
  }

  // numeric: try feed first then profile
  dbGet(
    `SELECT id FROM posts WHERE id = ? AND user_id = ?`,
    [parsed.id, req.user.id],
    (e1, existsFeed) => {
      if (e1) return res.status(500).json({ message: "Update failed" });

      if (existsFeed) {
        return dbRun(
          `UPDATE posts SET content = ? WHERE id = ? AND user_id = ?`,
          [content, parsed.id, req.user.id],
          function (err) {
            if (err) return res.status(500).json({ message: "Update failed" });
            if (this.changes === 0)
              return res.status(404).json({ message: "Post not found" });
            return res.json({ ok: true });
          }
        );
      }

      return dbRun(
        `UPDATE profile_posts SET content = ? WHERE id = ? AND user_id = ?`,
        [content, parsed.id, req.user.id],
        function (err) {
          if (err) return res.status(500).json({ message: "Update failed" });
          if (this.changes === 0)
            return res.status(404).json({ message: "Post not found" });
          return res.json({ ok: true });
        }
      );
    }
  );
}

app.put("/api/profile/me/posts/:postId", authRequired, updateMyPostCore);
app.patch("/api/profile/me/posts/:postId", authRequired, updateMyPostCore);

app.delete("/api/profile/me/posts/:postId", authRequired, (req, res) => {
  const raw = safeTrim(req.params.postId || "");
  if (!raw) return res.status(400).json({ message: "Bad postId" });

  if (raw.startsWith("pp_")) {
    const postId = toInt(raw.slice(3));
    if (!postId) return res.status(400).json({ message: "Bad postId" });

    dbRun(
      `DELETE FROM profile_posts WHERE id = ? AND user_id = ?`,
      [postId, req.user.id],
      function (err) {
        if (err) return res.status(500).json({ message: "Delete post failed" });
        if (this.changes === 0)
          return res.status(404).json({ message: "Post not found" });
        res.json({ ok: true });
      }
    );
    return;
  }

  if (raw.startsWith("p_")) {
    const postId = raw.slice(2);
    return deleteFeedPostOwnedBy(req.user.id, postId, res);
  }

  const numeric = toInt(raw);
  if (!numeric) return res.status(400).json({ message: "Bad postId" });

  // numeric: try feed delete then profile delete
  dbGet(
    `SELECT id FROM posts WHERE id = ? AND user_id = ?`,
    [numeric, req.user.id],
    (e1, existsFeed) => {
      if (e1) return res.status(500).json({ message: "Delete post failed" });
      if (existsFeed) return deleteFeedPostOwnedBy(req.user.id, numeric, res);

      dbRun(
        `DELETE FROM profile_posts WHERE id = ? AND user_id = ?`,
        [numeric, req.user.id],
        function (err) {
          if (err)
            return res.status(500).json({ message: "Delete post failed" });
          if (this.changes === 0)
            return res.status(404).json({ message: "Post not found" });
          res.json({ ok: true });
        }
      );
    }
  );
});

/* ===== Tabs: SERVICES ===== */
function getServicesCore(req, res) {
  const userId = toInt(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  dbAll(
    `
    SELECT *
    FROM services
    WHERE user_id = ? AND is_active = 1
    ORDER BY id DESC
    LIMIT 200
    `,
    [userId],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Failed to load services" });
      res.json({ services: rows || [] });
    }
  );
}

app.get("/api/profile/:userId/services", authOptional, getServicesCore);
app.get("/api/profiles/:userId/services", authOptional, getServicesCore);

app.post("/api/profile/me/services", authRequired, (req, res) => {
  const title = safeTrim(req.body?.title);
  const description = safeTrim(req.body?.description);
  const category = safeTrim(req.body?.category);
  const price_type = safeTrim(req.body?.price_type) || "negotiable";
  const price_value =
    req.body?.price_value === null || req.body?.price_value === undefined
      ? null
      : Number(req.body?.price_value);
  const location = safeTrim(req.body?.location);

  if (!title) return res.status(400).json({ message: "Missing title" });

  dbRun(
    `
    INSERT INTO services (user_id, title, description, category, price_type, price_value, location, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
    [
      req.user.id,
      title,
      description || null,
      category || null,
      price_type,
      Number.isFinite(price_value) ? price_value : null,
      location || null,
    ],
    function (err) {
      if (err)
        return res.status(500).json({ message: "Create service failed" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.delete("/api/profile/me/services/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  dbRun(
    `UPDATE services SET is_active = 0 WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    function (err) {
      if (err)
        return res.status(500).json({ message: "Delete service failed" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Service not found" });
      res.json({ ok: true });
    }
  );
});

/* ===== Tabs: PRODUCTS ===== */
function getProductsCore(req, res) {
  const userId = toInt(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  dbAll(
    `
    SELECT *
    FROM products
    WHERE user_id = ? AND is_available = 1
    ORDER BY id DESC
    LIMIT 200
    `,
    [userId],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Failed to load products" });
      res.json({
        products: (rows || []).map((p) => ({
          ...p,
          images: safeJsonParse(p.images_json) || [],
        })),
      });
    }
  );
}

app.get("/api/profile/:userId/products", authOptional, getProductsCore);
app.get("/api/profiles/:userId/products", authOptional, getProductsCore);

app.post("/api/profile/me/products", authRequired, (req, res) => {
  const title = safeTrim(req.body?.title);
  const description = safeTrim(req.body?.description);
  const price =
    req.body?.price === null || req.body?.price === undefined
      ? null
      : Number(req.body?.price);
  const currency = safeTrim(req.body?.currency) || "USD";
  const images = Array.isArray(req.body?.images) ? req.body.images : [];
  const location = safeTrim(req.body?.location);

  if (!title) return res.status(400).json({ message: "Missing title" });

  dbRun(
    `
    INSERT INTO products (user_id, title, description, price, currency, images_json, location, is_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
    [
      req.user.id,
      title,
      description || null,
      Number.isFinite(price) ? price : null,
      currency,
      JSON.stringify(images || []),
      location || null,
    ],
    function (err) {
      if (err)
        return res.status(500).json({ message: "Create product failed" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.delete("/api/profile/me/products/:id", authRequired, (req, res) => {
  const id = toInt(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  dbRun(
    `UPDATE products SET is_available = 0 WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    function (err) {
      if (err)
        return res.status(500).json({ message: "Delete product failed" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Product not found" });
      res.json({ ok: true });
    }
  );
});

/* ===== Tabs: REVIEWS ===== */
function getReviewsCore(req, res) {
  const userId = toInt(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  dbAll(
    `
    SELECT r.*, u.username AS author_name
    FROM reviews r
    LEFT JOIN users u ON u.id = r.author_id
    WHERE r.user_id = ?
    ORDER BY r.id DESC
    LIMIT 200
    `,
    [userId],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Failed to load reviews" });
      res.json({ reviews: rows || [] });
    }
  );
}

app.get("/api/profile/:userId/reviews", authOptional, getReviewsCore);
app.get("/api/profiles/:userId/reviews", authOptional, getReviewsCore);

app.post("/api/profile/:userId/reviews", authRequired, (req, res) => {
  const userId = toInt(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });
  if (userId === req.user.id)
    return res.status(400).json({ message: "You cannot review yourself" });

  const rating = Number(req.body?.rating);
  const comment = safeTrim(req.body?.comment);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be 1..5" });
  }
  if (!comment) return res.status(400).json({ message: "Empty comment" });

  dbRun(
    `
    INSERT INTO reviews (user_id, author_id, rating, comment)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, author_id) DO UPDATE SET
      rating = excluded.rating,
      comment = excluded.comment,
      created_at = datetime('now')
    `,
    [userId, req.user.id, rating, comment],
    function (err) {
      if (err) return res.status(500).json({ message: "Review failed" });
      res.json({ ok: true });
    }
  );
});

/* =====================
   FEED POSTS
===================== */
app.get("/api/posts", authOptional, (req, res) => {
  const category = safeTrim(req.query.category);
  const userId = req.user?.id || 0;

  const where = category ? "WHERE p.category = ?" : "";
  const params = category ? [category] : [];

  dbAll(
    `
    SELECT
      p.*,
      u.username AS user_name,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likeCount,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS likedByMe,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) AS commentCount
    FROM posts p
    LEFT JOIN users u ON u.id = p.user_id
    ${where}
    ORDER BY p.id DESC
    `,
    [userId, ...params],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load posts" });
      res.json(
        (rows || []).map((r) => ({
          ...r,
          likedByMe: !!r.likedByMe,
          commentCount: Number(r.commentCount || 0),
          likeCount: Number(r.likeCount || 0),
        }))
      );
    }
  );
});

function updateFeedPostCore(req, res) {
  const parsed = parseAnyPostId(req.params.id);
  const content = safeTrim(req.body?.content);
  const category = safeTrim(req.body?.category);

  // allow /api/posts/p_17 too
  const id =
    parsed.kind === "feed"
      ? parsed.id
      : parsed.kind === "numeric"
      ? parsed.id
      : null;
  if (!id) return res.status(400).json({ message: "Bad id" });
  if (!content) return res.status(400).json({ message: "Empty content" });

  dbRun(
    `UPDATE posts SET content = ?, category = COALESCE(?, category) WHERE id = ? AND user_id = ?`,
    [content, category || null, id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Update failed" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Post not found" });
      res.json({ ok: true });
    }
  );
}

app.put("/api/posts/:id", authRequired, updateFeedPostCore);
app.patch("/api/posts/:id", authRequired, updateFeedPostCore);

// ✅ NEW: GET single feed post (supports /api/posts/17 and /api/posts/p_17)
function getSingleFeedPost(req, res) {
  const parsed = parseAnyPostId(req.params.id);
  const id =
    parsed.kind === "feed"
      ? parsed.id
      : parsed.kind === "numeric"
      ? parsed.id
      : null;

  if (!id) return res.status(400).json({ message: "Bad id" });

  const userId = req.user?.id || 0;

  dbGet(
    `
    SELECT
      p.*,
      u.username AS user_name,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likeCount,
      (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) AS likedByMe,
      (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) AS commentCount
    FROM posts p
    LEFT JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
    `,
    [userId, id],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Failed" });
      if (!row) return res.status(404).json({ message: "Post not found" });
      res.json({
        ...row,
        likedByMe: !!row.likedByMe,
        commentCount: Number(row.commentCount || 0),
        likeCount: Number(row.likeCount || 0),
      });
    }
  );
}
app.get("/api/posts/:id", authOptional, getSingleFeedPost);
app.get("/api/post/:id", authOptional, getSingleFeedPost);

app.post("/api/posts", authRequired, (req, res) => {
  const content = safeTrim(req.body?.content);
  const category = safeTrim(req.body?.category);

  if (!content) return res.status(400).json({ message: "Empty post" });

  dbRun(
    `INSERT INTO posts (user_id, content, category) VALUES (?, ?, ?)`,
    [req.user.id, content, category || null],
    (err) => {
      if (err) return res.status(500).json({ message: "Create post failed" });
      res.json({ ok: true });
    }
  );
});

/* ========= DELETE Post ========= */
function deletePostById(req, res) {
  const parsed = parseAnyPostId(req.params.id);
  const id =
    parsed.kind === "feed"
      ? parsed.id
      : parsed.kind === "numeric"
      ? parsed.id
      : null;

  if (!id) return res.status(400).json({ message: "Bad id" });
  return deleteFeedPostOwnedBy(req.user.id, id, res);
}

app.delete("/api/posts/:id", authRequired, deletePostById);
app.delete("/api/posts/delete/:id", authRequired, deletePostById);
app.delete("/api/delete-post/:id", authRequired, deletePostById);
app.delete("/api/post/:id", authRequired, deletePostById);
app.post("/api/posts/:id/delete", authRequired, deletePostById);
app.post("/api/posts/delete/:id", authRequired, deletePostById);

// ✅ NEW: aliases for "weird" frontend delete tries
app.delete("/api/me/profile/posts/:postId", authRequired, (req, res) =>
  app._router.handle(
    {
      ...req,
      url: `/api/profile/me/posts/${req.params.postId}`,
      method: "DELETE",
    },
    res
  )
);

/* ========= LIKE Post ========= */
app.post("/api/posts/:id/like", authRequired, (req, res) => {
  const parsed = parseAnyPostId(req.params.id);
  const postId =
    parsed.kind === "feed"
      ? parsed.id
      : parsed.kind === "numeric"
      ? parsed.id
      : null;

  if (!postId) return res.status(400).json({ message: "Bad postId" });

  dbGet(`SELECT id FROM posts WHERE id = ?`, [postId], (e0, pRow) => {
    if (e0) return res.status(500).json({ message: "Like failed" });
    if (!pRow) return res.status(404).json({ message: "Post not found" });

    dbGet(
      `SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?`,
      [postId, req.user.id],
      (err, row) => {
        if (err) return res.status(500).json({ message: "Like failed" });

        if (row) {
          dbRun(
            `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
            [postId, req.user.id],
            () => res.json({ liked: false })
          );
        } else {
          dbRun(
            `INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`,
            [postId, req.user.id],
            (e2) => {
              if (e2) return res.status(500).json({ message: "Like failed" });
              res.json({ liked: true });
            }
          );
        }
      }
    );
  });
});

/* =====================
   COMMENTS (LIKES + REPLIES)
===================== */

// ✅ (1) Core: GET comments for feed post
function getFeedPostCommentsCore(req, res, postIdOverride = null) {
  const postId =
    postIdOverride ||
    (() => {
      const parsed = parseAnyPostId(req.params.id);
      return parsed.kind === "feed"
        ? parsed.id
        : parsed.kind === "numeric"
        ? parsed.id
        : null;
    })();

  if (!postId) return res.status(400).json({ message: "Bad postId" });

  const userId = req.user?.id || 0;

  dbAll(
    `
    SELECT
      c.*,
      u.username AS user_name,
      (SELECT COUNT(*) FROM post_comment_likes WHERE comment_id = c.id) AS likeCount,
      (SELECT COUNT(*) FROM post_comment_likes WHERE comment_id = c.id AND user_id = ?) AS likedByMe
    FROM post_comments c
    LEFT JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
    ORDER BY c.id ASC
    `,
    [userId, postId],
    (err, rows) => {
      if (err)
        return res.status(500).json({ message: "Failed to load comments" });
      res.json(
        (rows || []).map((r) => ({
          ...r,
          likeCount: Number(r.likeCount || 0),
          likedByMe: !!r.likedByMe,
        }))
      );
    }
  );
}

// ✅ (2) Core: POST comment
function createFeedPostCommentCore(req, res, postIdOverride = null) {
  const postId =
    postIdOverride ||
    (() => {
      const parsed = parseAnyPostId(req.params.id);
      return parsed.kind === "feed"
        ? parsed.id
        : parsed.kind === "numeric"
        ? parsed.id
        : null;
    })();

  if (!postId) return res.status(400).json({ message: "Bad postId" });

  const comment = safeTrim(req.body?.comment);
  if (!comment) return res.status(400).json({ message: "Empty comment" });

  const parentIdRaw = req.body?.parent_comment_id ?? null;
  const parentId =
    parentIdRaw === null || parentIdRaw === "" ? null : toInt(parentIdRaw);

  dbGet(`SELECT id FROM posts WHERE id = ?`, [postId], (e0, pRow) => {
    if (e0) return res.status(500).json({ message: "Comment failed" });
    if (!pRow) return res.status(404).json({ message: "Post not found" });

    const insertNow = () => {
      dbRun(
        `INSERT INTO post_comments (post_id, user_id, comment, parent_comment_id)
         VALUES (?, ?, ?, ?)`,
        [postId, req.user.id, comment, parentId],
        (err) => {
          if (err) return res.status(500).json({ message: "Comment failed" });
          return res.json({ ok: true });
        }
      );
    };

    if (!parentId) return insertNow();

    dbGet(
      `SELECT id, post_id FROM post_comments WHERE id = ?`,
      [parentId],
      (e1, pr) => {
        if (e1) return res.status(500).json({ message: "Comment failed" });
        if (!pr)
          return res.status(404).json({ message: "Parent comment not found" });
        if (Number(pr.post_id) !== postId)
          return res.status(400).json({ message: "Parent comment mismatch" });
        insertNow();
      }
    );
  });
}

// ✅ ROUTES: canonical
app.get("/api/posts/:id/comments", authOptional, (req, res) =>
  getFeedPostCommentsCore(req, res)
);
app.post("/api/posts/:id/comments", authRequired, (req, res) =>
  createFeedPostCommentCore(req, res)
);

// ✅✅✅ (A) LEGACY ALIASES: fix 404 shown in your screenshot
// Frontend is calling: /api/post_comments/:postId
app.get("/api/post_comments/:postId", authOptional, (req, res) => {
  const postId = toInt(req.params.postId);
  if (!postId) return res.status(400).json({ message: "Bad postId" });
  return getFeedPostCommentsCore(req, res, postId);
});

app.post("/api/post_comments/:postId", authRequired, (req, res) => {
  const postId = toInt(req.params.postId);
  if (!postId) return res.status(400).json({ message: "Bad postId" });
  return createFeedPostCommentCore(req, res, postId);
});

// ✅ delete comment core (same as yours)
function deleteCommentCore(req, res) {
  const postId = toInt(req.params.postId);
  const commentId = toInt(req.params.commentId);
  if (!postId || !commentId)
    return res.status(400).json({ message: "Bad ids" });

  dbGet(
    `SELECT id, user_id, post_id FROM post_comments WHERE id = ? AND post_id = ?`,
    [commentId, postId],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Delete failed" });
      if (!row) return res.status(404).json({ message: "Comment not found" });
      if (row.user_id !== req.user.id) return res.sendStatus(403);

      dbRun(
        `DELETE FROM post_comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE parent_comment_id = ?)`,
        [commentId],
        () => {
          dbRun(
            `DELETE FROM post_comments WHERE parent_comment_id = ?`,
            [commentId],
            () => {
              dbRun(
                `DELETE FROM post_comment_likes WHERE comment_id = ?`,
                [commentId],
                () => {
                  dbRun(
                    `DELETE FROM post_comments WHERE id = ?`,
                    [commentId],
                    function (err2) {
                      if (err2)
                        return res
                          .status(500)
                          .json({ message: "Delete failed" });
                      return res.json({ ok: true });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}

app.delete(
  "/api/posts/:postId/comments/:commentId",
  authRequired,
  deleteCommentCore
);

// ✅ LEGACY delete alias (مش لازم في الصورة بس بيفيد)
app.delete(
  "/api/post_comments/:postId/:commentId",
  authRequired,
  deleteCommentCore
);

// ✅ like comment core
function toggleLikeComment(req, res) {
  const commentId = toInt(req.params.commentId);
  if (!commentId) return res.status(400).json({ message: "Bad commentId" });

  dbGet(
    `SELECT id FROM post_comments WHERE id = ?`,
    [commentId],
    (e1, cRow) => {
      if (e1) return res.status(500).json({ message: "Like failed" });
      if (!cRow) return res.status(404).json({ message: "Comment not found" });

      dbGet(
        `SELECT id FROM post_comment_likes WHERE comment_id = ? AND user_id = ?`,
        [commentId, req.user.id],
        (err, row) => {
          if (err) return res.status(500).json({ message: "Like failed" });

          if (row) {
            dbRun(
              `DELETE FROM post_comment_likes WHERE comment_id = ? AND user_id = ?`,
              [commentId, req.user.id],
              () => res.json({ liked: false })
            );
          } else {
            dbRun(
              `INSERT INTO post_comment_likes (comment_id, user_id) VALUES (?, ?)`,
              [commentId, req.user.id],
              (e2) => {
                if (e2) return res.status(500).json({ message: "Like failed" });
                res.json({ liked: true });
              }
            );
          }
        }
      );
    }
  );
}

app.post(
  "/api/posts/:postId/comments/:commentId/like",
  authRequired,
  toggleLikeComment
);
app.post("/api/comments/:commentId/like", authRequired, toggleLikeComment);

// ✅ LEGACY like alias (اختياري لكنه بيغطي أي كود قديم)
app.post(
  "/api/post_comments/:postId/:commentId/like",
  authRequired,
  toggleLikeComment
);

/* =====================
   START
===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("✅ DB PATH:", dbPath);
});
