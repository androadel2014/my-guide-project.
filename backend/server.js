// server.js (FULL FILE - FINAL WITH LEGACY ENDPOINTS + FEED FIXES + SAFE DELETE FALLBACKS + COMMENT LIKES)

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

  // ✅ NEW (SAFE): allow replies by adding parent_comment_id
  db.run(
    `ALTER TABLE post_comments ADD COLUMN parent_comment_id INTEGER`,
    () => {
      // ignore if already exists
    }
  );

  // ✅ NEW: comment likes table
  db.run(`
    CREATE TABLE IF NOT EXISTS post_comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      UNIQUE(comment_id, user_id),
      FOREIGN KEY (comment_id) REFERENCES post_comments(id) ON DELETE CASCADE
    )
  `);
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

      if (!bcrypt.compareSync(password, user.password_hash)) {
        return res.sendStatus(401);
      }

      const me = {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone || "",
        address: user.address || "",
        bio: user.bio || "",
      };

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
   CVS (New Endpoints)
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
   POSTS
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

/* ========= DELETE Post (main) ========= */
function deletePostById(req, res) {
  const postId = String(req.params.id || "").trim();

  db.get(`SELECT id, user_id FROM posts WHERE id = ?`, [postId], (err, row) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    if (!row) return res.status(404).json({ message: "Post not found" });
    if (row.user_id !== req.user.id) return res.sendStatus(403);

    db.run(`DELETE FROM post_likes WHERE post_id = ?`, [postId], () => {
      // delete comment likes first (safe)
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

// ✅ MAIN: DELETE /api/posts/:id
app.delete("/api/posts/:id", authRequired, deletePostById);

/* ========= LEGACY DELETE FALLBACKS (to stop your 404 spam) ========= */
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
   COMMENTS (WITH LIKES + REPLIES)
===================== */

// ✅ IMPORTANT: allow guest + logged user to see likedByMe
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

// ✅ Delete comment (and its replies + likes)
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

      // delete likes for children + parent
      db.run(
        `DELETE FROM post_comment_likes WHERE comment_id IN (
            SELECT id FROM post_comments WHERE parent_comment_id = ?
         )`,
        [commentId],
        () => {
          db.run(
            `DELETE FROM post_comment_likes WHERE comment_id = ?`,
            [commentId],
            () => {
              // delete children replies then parent
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

// ✅ legacy fallback delete comment endpoints (in case frontend tries others)
app.delete("/api/comments/:commentId", authRequired, (req, res) => {
  // if you ever use it later, require postId? (keep simple: return 400)
  return res
    .status(400)
    .json({ message: "Use /api/posts/:postId/comments/:commentId" });
});

// ✅ Like comment endpoint (MAIN)
function toggleLikeComment(req, res) {
  const commentId = String(req.params.commentId || "").trim();

  // ensure comment exists
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

// ✅ MAIN: POST /api/posts/:postId/comments/:commentId/like
app.post(
  "/api/posts/:postId/comments/:commentId/like",
  authRequired,
  toggleLikeComment
);

// ✅ fallback: POST /api/comments/:commentId/like
app.post("/api/comments/:commentId/like", authRequired, toggleLikeComment);

/* =====================
   DEBUG: Error handler (prevents silent 500)
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
