// server.js (FULL FILE - FINAL: SOCIAL PROFILE + ALIASES + FEED + COMMENTS + LIKES + SAFE ALTER)

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_SECRET";

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
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,DELETE,OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  if (req.method === "OPTIONS") return res.sendStatus(204);
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

function safeAlterTable(sql) {
  // ignore "duplicate column name" & similar
  db.run(sql, (err) => {});
}

db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON");

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

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      UNIQUE(post_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS post_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      user_id INTEGER,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ✅ SAFE: replies
  safeAlterTable(
    `ALTER TABLE post_comments ADD COLUMN parent_comment_id INTEGER`
  );

  db.run(`
    CREATE TABLE IF NOT EXISTS post_comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(comment_id, user_id),
      FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE
    )
  `);

  /* =====================
     ✅ SOCIAL PROFILE TABLES
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

  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      price_type TEXT DEFAULT 'negotiable', -- fixed | negotiable | starting_at
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
   Helpers
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

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normalizeCvResponse(row) {
  const parsed = safeJsonParse(row.cv_data);
  return {
    id: row.id,
    cv_name: row.cv_name,
    updated_at: row.updated_at,
    cv_data: parsed || row.cv_data,
  };
}

function safeTrim(v) {
  return String(v ?? "").trim();
}

function safeUrl(v) {
  const s = safeTrim(v);
  return s || "";
}

function ensureProfileRow(userId, cb) {
  db.get(
    `SELECT up.user_id FROM user_profile up WHERE up.user_id = ?`,
    [userId],
    (e1, row) => {
      if (e1) return cb(e1);
      if (row) return cb(null);

      db.get(
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
              return db.run(
                `INSERT OR IGNORE INTO user_profile (user_id, username, display_name) VALUES (?,?,?)`,
                [userId, last, displayName],
                () => cb(null)
              );
            }

            db.run(
              `INSERT OR IGNORE INTO user_profile (user_id, username, display_name) VALUES (?,?,?)`,
              [userId, candidates[i], displayName],
              function () {
                db.get(
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
  db.get(`SELECT id, user_id FROM posts WHERE id = ?`, [postId], (err, row) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    if (!row) return res.status(404).json({ message: "Post not found" });
    if (row.user_id !== userId) return res.sendStatus(403);

    db.run(`DELETE FROM post_likes WHERE post_id = ?`, [postId], () => {
      db.run(
        `DELETE FROM post_comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE post_id = ?)`,
        [postId],
        () => {
          db.run(
            `DELETE FROM post_comments WHERE post_id = ?`,
            [postId],
            () => {
              db.run(
                `DELETE FROM posts WHERE id = ?`,
                [postId],
                function (err2) {
                  if (err2)
                    return res.status(500).json({ message: "Delete failed" });
                  return res.json({ ok: true });
                }
              );
            }
          );
        }
      );
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

  db.run(
    `INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`,
    [username.trim(), email.trim().toLowerCase(), hash],
    function (err) {
      if (err) return res.status(400).json({ message: "Email exists" });

      const user = {
        id: this.lastID,
        username: username.trim(),
        email: email.trim().toLowerCase(),
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

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [String(email).trim().toLowerCase()],
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
  db.get(
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

  db.run(
    `
    UPDATE users
    SET username = ?, phone = ?, address = ?, bio = ?
    WHERE id = ?
    `,
    [
      String(username || "").trim(),
      String(phone || "").trim(),
      String(address || "").trim(),
      String(bio || "").trim(),
      req.user.id,
    ],
    function (err) {
      if (err) return res.status(500).json({ message: "Update failed" });

      db.get(
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
  db.all(
    `SELECT id, user_id, cv_name, updated_at FROM cvs WHERE user_id = ? ORDER BY id DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load CVs" });
      res.json(rows || []);
    }
  );
});

app.get("/api/cv/:id", authRequired, (req, res) => {
  const id = req.params.id;
  db.get(
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
  const name = String(cv_name || "RESUME").trim();
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  db.run(
    `INSERT INTO cvs (user_id, cv_name, cv_data, updated_at) VALUES (?, ?, ?, datetime('now'))`,
    [req.user.id, name, dataStr],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to create CV" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.put("/api/cv/:id", authRequired, (req, res) => {
  const id = req.params.id;
  const { cv_name, cv_data } = req.body || {};
  const name = String(cv_name || "RESUME").trim();
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  db.run(
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
  const id = req.params.id;
  db.run(
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
  const id = req.params.id;
  db.get(
    `SELECT id, user_id, cv_name, cv_data, updated_at FROM cvs WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    (err, row) => {
      if (!row) return res.status(404).json({ message: "CV not found" });
      return res.json(normalizeCvResponse(row));
    }
  );
});

app.get("/api/get-all-cvs/:userId", authRequired, (req, res) => {
  db.all(
    `SELECT id, user_id, cv_name, updated_at FROM cvs WHERE user_id = ? ORDER BY id DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load CVs" });
      res.json(rows || []);
    }
  );
});

app.get("/api/cv/latest/:userId", authRequired, (req, res) => {
  db.get(
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
  const id = req.params.id;
  const { cv_name, cv_data } = req.body || {};
  const name = String(cv_name || "RESUME").trim();
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  db.run(
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
  const name = String(cv_name || "RESUME").trim();
  const dataStr =
    typeof cv_data === "string" ? cv_data : JSON.stringify(cv_data || {});

  db.run(
    `INSERT INTO cvs (user_id, cv_name, cv_data, updated_at) VALUES (?, ?, ?, datetime('now'))`,
    [req.user.id, name, dataStr],
    function (err) {
      if (err) return res.status(500).json({ message: "Failed to create CV" });
      res.json({ ok: true, id: this.lastID });
    }
  );
});

app.delete("/api/delete-cv/:id", authRequired, (req, res) => {
  const id = req.params.id;
  db.run(
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

// core handler to reuse for aliases
function getProfileCore(req, res) {
  const targetId = Number(req.params.userId);
  if (!targetId) return res.status(400).json({ message: "Bad userId" });

  ensureProfileRow(targetId, (e0) => {
    if (e0) return res.status(500).json({ message: "Failed" });

    db.get(
      `SELECT * FROM user_profile WHERE user_id = ?`,
      [targetId],
      (e1, p) => {
        if (e1) return res.status(500).json({ message: "Failed" });
        if (!p) return res.status(404).json({ message: "Profile not found" });

        const meId = req.user?.id || 0;

        db.get(
          `SELECT COUNT(*) c FROM follows WHERE following_id = ?`,
          [targetId],
          (eF1, rFollowers) => {
            if (eF1) return res.status(500).json({ message: "Failed" });

            db.get(
              `SELECT COUNT(*) c FROM follows WHERE follower_id = ?`,
              [targetId],
              (eF2, rFollowing) => {
                if (eF2) return res.status(500).json({ message: "Failed" });

                // ✅ POSTS COUNT = profile_posts + feed posts (posts)
                db.get(
                  `
                  SELECT
                    (SELECT COUNT(*) FROM profile_posts WHERE user_id = ?) +
                    (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS c
                  `,
                  [targetId, targetId],
                  (eP, rPosts) => {
                    if (eP) return res.status(500).json({ message: "Failed" });

                    db.get(
                      `SELECT COUNT(*) c FROM services WHERE user_id = ? AND is_active = 1`,
                      [targetId],
                      (eS, rServices) => {
                        if (eS)
                          return res.status(500).json({ message: "Failed" });

                        db.get(
                          `SELECT COUNT(*) c FROM products WHERE user_id = ? AND is_available = 1`,
                          [targetId],
                          (ePr, rProducts) => {
                            if (ePr)
                              return res
                                .status(500)
                                .json({ message: "Failed" });

                            db.get(
                              `SELECT COALESCE(AVG(rating),0) avg FROM reviews WHERE user_id = ?`,
                              [targetId],
                              (eR1, rAvg) => {
                                if (eR1)
                                  return res
                                    .status(500)
                                    .json({ message: "Failed" });

                                db.get(
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

                                    db.get(
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

// MAIN + ALIAS
app.get("/api/profile/:userId", authOptional, getProfileCore);
app.get("/api/profiles/:userId", authOptional, getProfileCore); // ✅ alias

// Update my profile
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
      db.run(
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

          db.get(
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

    db.get(
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

// Follow / Unfollow (main + alias)
function followCore(req, res) {
  const me = req.user.id;
  const target = Number(req.params.userId);
  if (!target) return res.status(400).json({ message: "Bad userId" });
  if (me === target)
    return res.status(400).json({ message: "Cannot follow yourself" });

  db.run(
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
  const target = Number(req.params.userId);
  if (!target) return res.status(400).json({ message: "Bad userId" });

  db.run(
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
app.post("/api/profiles/:userId/follow", authRequired, followCore); // alias
app.delete("/api/profiles/:userId/follow", authRequired, unfollowCore); // alias

/* ===== Tabs: PROFILE POSTS (✅ NOW RETURNS BOTH profile_posts + feed posts) ===== */
function getProfilePostsCore(req, res) {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  db.all(
    `
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

    ORDER BY datetime(created_at) DESC
    LIMIT 200
    `,
    [userId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Failed to load posts" });
      res.json({ posts: rows || [] });
    }
  );
}

app.get("/api/profile/:userId/posts", authOptional, getProfilePostsCore);
app.get("/api/profiles/:userId/posts", authOptional, getProfilePostsCore); // alias
app.get("/api/profile_posts/:userId", authOptional, getProfilePostsCore); // ✅ alias اللي في الكونسل
app.get("/api/profile_posts/:userId/posts", authOptional, getProfilePostsCore);

app.post("/api/profile/me/posts", authRequired, (req, res) => {
  const content = safeTrim(req.body?.content);
  const media_url = safeUrl(req.body?.media_url);
  if (!content) return res.status(400).json({ message: "Empty post" });

  db.run(
    `INSERT INTO profile_posts (user_id, content, media_url) VALUES (?, ?, ?)`,
    [req.user.id, content, media_url || null],
    function (err) {
      if (err) return res.status(500).json({ message: "Create post failed" });
      res.json({ ok: true, id: `pp_${this.lastID}` });
    }
  );
});

/* ✅ delete supports both:
   - pp_<id>  => profile_posts
   - p_<id>   => posts (feed table) with cascades
*/
app.delete("/api/profile/me/posts/:postId", authRequired, (req, res) => {
  const raw = String(req.params.postId || "").trim();
  if (!raw) return res.status(400).json({ message: "Bad postId" });

  if (raw.startsWith("pp_")) {
    const postId = Number(raw.slice(3));
    if (!postId) return res.status(400).json({ message: "Bad postId" });

    db.run(
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
    const postId = Number(raw.slice(2));
    if (!postId) return res.status(400).json({ message: "Bad postId" });
    return deleteFeedPostOwnedBy(req.user.id, postId, res);
  }

  // fallback: assume profile_posts numeric
  const numeric = Number(raw);
  if (!numeric) return res.status(400).json({ message: "Bad postId" });

  db.run(
    `DELETE FROM profile_posts WHERE id = ? AND user_id = ?`,
    [numeric, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ message: "Delete post failed" });
      if (this.changes === 0)
        return res.status(404).json({ message: "Post not found" });
      res.json({ ok: true });
    }
  );
});

/* ===== Tabs: SERVICES ===== */
function getServicesCore(req, res) {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  db.all(
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
app.get("/api/profiles/:userId/services", authOptional, getServicesCore); // alias

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

  db.run(
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
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  db.run(
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
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  db.all(
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
app.get("/api/profiles/:userId/products", authOptional, getProductsCore); // alias

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

  db.run(
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
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Bad id" });

  db.run(
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
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });

  db.all(
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
app.get("/api/profiles/:userId/reviews", authOptional, getReviewsCore); // alias

app.post("/api/profile/:userId/reviews", authRequired, (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) return res.status(400).json({ message: "Bad userId" });
  if (userId === req.user.id)
    return res.status(400).json({ message: "You cannot review yourself" });

  const rating = Number(req.body?.rating);
  const comment = safeTrim(req.body?.comment);

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be 1..5" });
  }
  if (!comment) return res.status(400).json({ message: "Empty comment" });

  db.run(
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
  const category = req.query.category;
  const userId = req.user?.id || 0;

  const where = category ? "WHERE p.category = ?" : "";
  const params = category ? [category] : [];

  db.all(
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

app.post("/api/posts", authRequired, (req, res) => {
  const { content, category } = req.body || {};
  db.run(
    `INSERT INTO posts (user_id, content, category) VALUES (?, ?, ?)`,
    [req.user.id, String(content || ""), String(category || "")],
    (err) => {
      if (err) return res.status(500).json({ message: "Create post failed" });
      res.json({ ok: true });
    }
  );
});

/* ========= DELETE Post ========= */
function deletePostById(req, res) {
  const postId = String(req.params.id || "").trim();

  db.get(`SELECT id, user_id FROM posts WHERE id = ?`, [postId], (err, row) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    if (!row) return res.status(404).json({ message: "Post not found" });
    if (row.user_id !== req.user.id) return res.sendStatus(403);

    db.run(`DELETE FROM post_likes WHERE post_id = ?`, [postId], () => {
      db.run(
        `DELETE FROM post_comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE post_id = ?)`,
        [postId],
        () => {
          db.run(
            `DELETE FROM post_comments WHERE post_id = ?`,
            [postId],
            () => {
              db.run(
                `DELETE FROM posts WHERE id = ?`,
                [postId],
                function (err2) {
                  if (err2)
                    return res.status(500).json({ message: "Delete failed" });
                  return res.json({ ok: true });
                }
              );
            }
          );
        }
      );
    });
  });
}

app.delete("/api/posts/:id", authRequired, deletePostById);
// legacy fallbacks
app.delete("/api/posts/delete/:id", authRequired, deletePostById);
app.delete("/api/delete-post/:id", authRequired, deletePostById);
app.delete("/api/post/:id", authRequired, deletePostById);
app.post("/api/posts/:id/delete", authRequired, deletePostById);
app.post("/api/posts/delete/:id", authRequired, deletePostById);

app.post("/api/posts/:id/like", authRequired, (req, res) => {
  const postId = req.params.id;
  db.get(
    `SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?`,
    [postId, req.user.id],
    (err, row) => {
      if (row) {
        db.run(
          `DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
          [postId, req.user.id],
          () => res.json({ liked: false })
        );
      } else {
        db.run(
          `INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)`,
          [postId, req.user.id],
          () => res.json({ liked: true })
        );
      }
    }
  );
});

/* =====================
   COMMENTS (LIKES + REPLIES)
===================== */
app.get("/api/posts/:id/comments", authOptional, (req, res) => {
  const postId = req.params.id;
  const userId = req.user?.id || 0;

  db.all(
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
});

app.post("/api/posts/:id/comments", authRequired, (req, res) => {
  const parentId = req.body?.parent_comment_id ?? null;

  db.run(
    `INSERT INTO post_comments (post_id, user_id, comment, parent_comment_id)
     VALUES (?, ?, ?, ?)`,
    [req.params.id, req.user.id, String(req.body?.comment || ""), parentId],
    (err) => {
      if (err) return res.status(500).json({ message: "Comment failed" });
      return res.json({ ok: true });
    }
  );
});

function deleteCommentCore(req, res) {
  const postId = req.params.postId;
  const commentId = req.params.commentId;

  db.get(
    `SELECT id, user_id, post_id FROM post_comments WHERE id = ? AND post_id = ?`,
    [commentId, postId],
    (err, row) => {
      if (err) return res.status(500).json({ message: "Delete failed" });
      if (!row) return res.status(404).json({ message: "Comment not found" });
      if (row.user_id !== req.user.id) return res.sendStatus(403);

      db.run(
        `DELETE FROM post_comment_likes WHERE comment_id IN (SELECT id FROM post_comments WHERE parent_comment_id = ?)`,
        [commentId],
        () => {
          db.run(
            `DELETE FROM post_comment_likes WHERE comment_id = ?`,
            [commentId],
            () => {
              db.run(
                `DELETE FROM post_comments WHERE parent_comment_id = ?`,
                [commentId],
                () => {
                  db.run(
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

function toggleLikeComment(req, res) {
  const commentId = String(req.params.commentId || "").trim();

  db.get(
    `SELECT id FROM post_comments WHERE id = ?`,
    [commentId],
    (e1, cRow) => {
      if (e1) return res.status(500).json({ message: "Like failed" });
      if (!cRow) return res.status(404).json({ message: "Comment not found" });

      db.get(
        `SELECT id FROM post_comment_likes WHERE comment_id = ? AND user_id = ?`,
        [commentId, req.user.id],
        (err, row) => {
          if (row) {
            db.run(
              `DELETE FROM post_comment_likes WHERE comment_id = ? AND user_id = ?`,
              [commentId, req.user.id],
              () => res.json({ liked: false })
            );
          } else {
            db.run(
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

/* =====================
   DEBUG: Error handler
===================== */
app.use((err, req, res, next) => {
  console.error("SERVER_ERROR:", err);
  res.status(500).json({
    message: "Internal Server Error",
    detail: String(err?.message || err),
  });
});

/* =====================
   START
===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
