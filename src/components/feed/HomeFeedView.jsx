import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

export const HomeFeedView = () => {
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  const authHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // create post
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [posting, setPosting] = useState(false);

  // filter
  const [filter, setFilter] = useState("");

  // comments
  const [openComments, setOpenComments] = useState({});
  const [comments, setComments] = useState({});
  const [commentDraft, setCommentDraft] = useState({});

  // =====================
  // Load Posts
  // =====================
  const loadPosts = async () => {
    try {
      setLoading(true);
      const q = filter ? `?category=${filter}` : "";
      const res = await fetch(`${API_BASE}/api/posts${q}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

  // =====================
  // Create Post
  // =====================
  const createPost = async () => {
    if (!isLoggedIn) return toast.error("Login first");
    if (!content.trim()) return toast.error("Write something");

    try {
      setPosting(true);
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          content: content.trim(),
          category,
        }),
      });

      if (!res.ok) throw new Error();
      setContent("");
      setCategory("general");
      toast.success("Posted");
      loadPosts();
    } catch {
      toast.error("Post failed");
    } finally {
      setPosting(false);
    }
  };

  // =====================
  // Like
  // =====================
  const likePost = async (id) => {
    if (!isLoggedIn) return toast.error("Login first");

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );

    try {
      await fetch(`${API_BASE}/api/posts/${id}/like`, {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {
      loadPosts();
    }
  };

  // =====================
  // Comments
  // =====================
  const toggleComments = async (postId) => {
    const open = !openComments[postId];
    setOpenComments((m) => ({ ...m, [postId]: open }));

    if (open && !comments[postId]) {
      const res = await fetch(`${API_BASE}/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments((m) => ({ ...m, [postId]: data || [] }));
    }
  };

  const addComment = async (postId) => {
    if (!isLoggedIn) return toast.error("Login first");
    const text = (commentDraft[postId] || "").trim();
    if (!text) return;

    await fetch(`${API_BASE}/api/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ comment: text }),
    });

    setCommentDraft((m) => ({ ...m, [postId]: "" }));
    toggleComments(postId);
    toggleComments(postId);
  };

  // =====================
  // UI
  // =====================
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AnswerForU Feed</h1>

      {/* Filter */}
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="border rounded-lg px-3 py-2 mb-4"
      >
        <option value="">All</option>
        <option value="immigration">Immigration</option>
        <option value="work">Work</option>
        <option value="housing">Housing</option>
        <option value="tax">Taxes</option>
        <option value="questions">Questions</option>
        <option value="general">General</option>
      </select>

      {/* Create */}
      <div className="border rounded-xl p-4 mb-6 bg-white">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="شارك معلومة مفيدة..."
          className="w-full border rounded-lg p-3 mb-3"
        />

        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="general">General</option>
            <option value="immigration">Immigration</option>
            <option value="work">Work</option>
            <option value="housing">Housing</option>
            <option value="tax">Taxes</option>
            <option value="questions">Questions</option>
          </select>

          <button
            onClick={createPost}
            disabled={posting}
            className="bg-black text-white px-5 py-2 rounded-lg"
          >
            Post
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? (
        <p>Loading...</p>
      ) : posts.length === 0 ? (
        <p>No posts yet</p>
      ) : (
        posts.map((p) => (
          <div key={p.id} className="border rounded-xl p-4 mb-4 bg-white">
            <div className="text-sm text-gray-500 mb-1">
              {p.user_name} • {p.category}
            </div>

            <div className="mb-3 whitespace-pre-wrap">{p.content}</div>

            <div className="flex gap-2 mb-2">
              <button
                onClick={() => likePost(p.id)}
                className={`px-3 py-1 rounded-lg border text-sm ${
                  p.likedByMe ? "bg-black text-white" : ""
                }`}
              >
                👍 {p.likeCount}
              </button>

              <button
                onClick={() => toggleComments(p.id)}
                className="px-3 py-1 rounded-lg border text-sm"
              >
                💬 Comments
              </button>
            </div>

            {/* Comments */}
            {openComments[p.id] && (
              <div className="mt-3">
                {(comments[p.id] || []).map((c) => (
                  <div
                    key={c.id}
                    className="text-sm border rounded-lg p-2 mb-2"
                  >
                    <b>{c.user_name}</b>: {c.comment}
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    value={commentDraft[p.id] || ""}
                    onChange={(e) =>
                      setCommentDraft((m) => ({
                        ...m,
                        [p.id]: e.target.value,
                      }))
                    }
                    placeholder="Write a comment..."
                    className="border rounded-lg px-3 py-2 flex-1"
                  />
                  <button
                    onClick={() => addComment(p.id)}
                    className="bg-black text-white px-4 rounded-lg"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};
