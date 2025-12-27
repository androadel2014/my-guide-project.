// ProfilePage.jsx (FULL FILE - copy/paste)
// ✅ Fixes in this version:
// - ✅ FIX 400 comments: لا نستخدم pp_18 في comments URLs (comments لازم رقم فقط)
// - ✅ لو البوست id بتاعه pp_.. يبقى comments disabled بدل ما يضرب 400
// - KEEP: كل شغلك (isMe fallback, safe tabs, edit/delete posts, comment tree, etc)

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  MapPin,
  Link as LinkIcon,
  Phone,
  BadgeCheck,
  Plus,
  Pencil,
  X,
  Star,
  Store,
  Briefcase,
  MessageCircle,
  Share2,
  Trash2,
  SendHorizontal,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  Users,
  UserPlus,
} from "lucide-react";

const getAPIBase = () =>
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const isAuthed = () => !!localStorage.getItem("token");

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = (parts[0][0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return a + b || "U";
};

const safeUrl = (u) => {
  const s = String(u || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return "https://" + s;
};

const extractNumericId = (id) => {
  if (id === null || id === undefined) return null;
  const s = String(id);
  const m = s.match(/\d+$/);
  return m ? Number(m[0]) : null;
};

// ✅ robust current user id getter (if you store it)
const getAuthUserId = () => {
  try {
    const direct = localStorage.getItem("userId");
    if (direct) return String(direct);

    const u = localStorage.getItem("user");
    if (!u) return null;
    const obj = JSON.parse(u);
    const id = obj?.id ?? obj?.user_id ?? obj?._id ?? obj?.uid ?? null;
    return id !== null && id !== undefined ? String(id) : null;
  } catch {
    return null;
  }
};

// ✅ normalize post id comparisons
const getPostId = (p) => p?.id ?? p?.post_id ?? p?._id ?? p?.postId ?? null;
const normId = (v) => {
  if (v === null || v === undefined) return "";
  const n = extractNumericId(v);
  return n !== null ? String(n) : String(v);
};

// ✅ UPDATED: always show a clear timestamp too
const formatTime = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const abs = d.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return `${abs}`;
    if (mins < 60) return `${mins}m • ${abs}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h • ${abs}`;
    const days = Math.floor(hrs / 24);
    return `${days}d • ${abs}`;
  } catch {
    return "";
  }
};

// ✅ category badge helper
function getCategory(cat) {
  const key = String(cat || "General").trim() || "General";

  const map = {
    General: {
      label: "General",
      badge: "bg-gray-50 border-gray-200 text-gray-700",
      dot: "bg-gray-500",
    },
    Taxes: {
      label: "Taxes",
      badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
      dot: "bg-emerald-500",
    },
    Housing: {
      label: "Housing",
      badge: "bg-indigo-50 border-indigo-200 text-indigo-700",
      dot: "bg-indigo-500",
    },
    Work: {
      label: "Work",
      badge: "bg-blue-50 border-blue-200 text-blue-700",
      dot: "bg-blue-500",
    },
    Immigration: {
      label: "Immigration",
      badge: "bg-amber-50 border-amber-200 text-amber-700",
      dot: "bg-amber-500",
    },
    Questions: {
      label: "Questions",
      badge: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700",
      dot: "bg-fuchsia-500",
    },
  };

  return map[key] || map.General;
}

// ✅ confirm toast
const toastConfirm = ({
  title = "Are you sure?",
  confirmText = "Delete",
} = {}) =>
  new Promise((resolve) => {
    toast.custom(
      (t) => (
        <div className="bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-3 w-[360px]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">
              !
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{title}</div>
              <div className="text-xs text-gray-500 mt-1">
                This action can’t be undone.
              </div>

              <div className="flex items-center gap-2 mt-3 justify-end">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
                  onClick={() => {
                    toast.dismiss(t.id);
                    resolve(true);
                  }}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: 999999 }
    );
  });

async function tryFetch(url, options = {}) {
  const res = await fetch(url, options);
  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function tryFetchFallback(urls, options = {}) {
  let lastErr = null;

  for (const u of urls) {
    try {
      return await tryFetch(u, options);
    } catch (e) {
      lastErr = e;
      const s = e?.status;
      if (s === 404 || s === 500 || s === 401 || s === 403) continue;
      throw e;
    }
  }

  throw lastErr || new Error("Request failed");
}

function Modal({ title, open, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        role="button"
        tabIndex={-1}
      />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="px-5 py-4 border-t">{footer}</div> : null}
      </div>
    </div>
  );
}

/* =========================
   Main Page
========================= */

export function ProfilePage({ lang }) {
  const API_BASE = useMemo(() => getAPIBase(), []);
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [isMe, setIsMe] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const [tab, setTab] = useState("posts"); // posts | services | products | reviews

  // Tabs data
  const [posts, setPosts] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);

  const [tabLoading, setTabLoading] = useState(false);

  // Modals
  const [editOpen, setEditOpen] = useState(false);
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addReviewOpen, setAddReviewOpen] = useState(false);

  // Forms
  const [editForm, setEditForm] = useState({
    username: "",
    display_name: "",
    avatar_url: "",
    cover_url: "",
    bio: "",
    location: "",
    phone: "",
    whatsapp: "",
    website: "",
  });

  // ✅ Feed-like post form (content + media + category)
  const FEED_CATEGORIES = useMemo(
    () => ["General", "Taxes", "Housing", "Work", "Immigration", "Questions"],
    []
  );

  const [postForm, setPostForm] = useState({
    content: "",
    media_url: "",
    category: "General",
  });

  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    category: "",
    price_type: "negotiable",
    price_value: "",
    location: "",
  });

  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    location: "",
    imagesText: "",
  });

  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const canAct = isAuthed();

  // ✅ NEW: isMe/canEdit fallback by comparing route userId with authed id
  const authedId = getAuthUserId();
  const computedIsMe =
    !!authedId && !!userId && normId(authedId) === normId(String(userId));
  const canEdit = canAct && (isMe || computedIsMe);

  // ✅ helpers for counters on tabs
  const countPosts = Number(stats?.posts ?? posts.length ?? 0) || 0;
  const countServices = Number(stats?.services ?? services.length ?? 0) || 0;
  const countProducts = Number(stats?.products ?? products.length ?? 0) || 0;
  const countReviews = Number(stats?.ratingCount ?? reviews.length ?? 0) || 0;

  // Load profile
  useEffect(() => {
    let dead = false;

    async function load() {
      setLoading(true);
      try {
        const uid = String(userId || "").trim();
        if (!uid) throw new Error("Missing userId");

        const data = await tryFetchFallback(
          [
            `${API_BASE}/api/profile/${uid}`,
            `${API_BASE}/api/profiles/${uid}`,
            `${API_BASE}/api/user/${uid}/profile`,
            `${API_BASE}/api/users/${uid}/profile`,
            `${API_BASE}/api/users/${uid}`,
          ],
          { headers: { ...authHeaders() } }
        );

        if (dead) return;

        const p =
          data?.profile || data?.user_profile || data?.user || data || null;
        const st = data?.stats || data?.profile_stats || null;

        setProfile(p);
        setStats(st);

        // ✅ FIX: fallback isMe if backend doesn't send isMe
        const meId = getAuthUserId();
        const fallbackIsMe =
          !!meId && normId(meId) === normId(uid) ? true : false;

        setIsMe(!!data?.isMe || fallbackIsMe);

        // ✅ follow fallback (if backend doesn't send isFollowing keep current)
        setIsFollowing(
          typeof data?.isFollowing === "boolean" ? data.isFollowing : false
        );

        setEditForm({
          username: p?.username || "",
          display_name: p?.display_name || "",
          avatar_url: p?.avatar_url || "",
          cover_url: p?.cover_url || "",
          bio: p?.bio || "",
          location: p?.location || "",
          phone: p?.phone || "",
          whatsapp: p?.whatsapp || "",
          website: p?.website || "",
        });
      } catch (e) {
        toast.error(e.message || "Failed to load profile");
        setProfile(null);
        setStats(null);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    load();
    return () => {
      dead = true;
    };
  }, [API_BASE, userId]);

  // Load tab data
  useEffect(() => {
    if (!userId) return;
    let dead = false;

    async function loadTab() {
      setTabLoading(true);
      try {
        const uid = String(userId || "").trim();
        if (!uid) return;

        if (tab === "posts") {
          const r = await tryFetchFallback(
            [
              `${API_BASE}/api/profile/${uid}/posts`,
              `${API_BASE}/api/profile_posts/${uid}`,
              `${API_BASE}/api/profile-posts/${uid}`,
              `${API_BASE}/api/users/${uid}/posts`,
              `${API_BASE}/api/posts?userId=${encodeURIComponent(uid)}`,
              `${API_BASE}/api/post?userId=${encodeURIComponent(uid)}`,
              `${API_BASE}/api/posts/user/${encodeURIComponent(uid)}`,
              `${API_BASE}/api/user/${encodeURIComponent(uid)}/posts`,
            ],
            { headers: { ...authHeaders() } }
          );
          const items =
            r?.posts ||
            r?.items ||
            r?.data ||
            r?.results ||
            (Array.isArray(r) ? r : []);
          if (!dead) setPosts(Array.isArray(items) ? items : []);
        }

        if (tab === "services") {
          const r = await tryFetchFallback(
            [
              `${API_BASE}/api/profile/${uid}/services`,
              `${API_BASE}/api/services/user/${uid}`,
              `${API_BASE}/api/users/${uid}/services`,
            ],
            { headers: { ...authHeaders() } }
          );
          const items =
            r?.services || r?.items || r?.data || (Array.isArray(r) ? r : []);
          if (!dead) setServices(Array.isArray(items) ? items : []);
        }

        if (tab === "products") {
          const r = await tryFetchFallback(
            [
              `${API_BASE}/api/profile/${uid}/products`,
              `${API_BASE}/api/products/user/${uid}`,
              `${API_BASE}/api/users/${uid}/products`,
            ],
            { headers: { ...authHeaders() } }
          );
          const items =
            r?.products || r?.items || r?.data || (Array.isArray(r) ? r : []);
          if (!dead) setProducts(Array.isArray(items) ? items : []);
        }

        if (tab === "reviews") {
          const r = await tryFetchFallback(
            [
              `${API_BASE}/api/profile/${uid}/reviews`,
              `${API_BASE}/api/reviews/user/${uid}`,
              `${API_BASE}/api/users/${uid}/reviews`,
            ],
            { headers: { ...authHeaders() } }
          );
          const items =
            r?.reviews || r?.items || r?.data || (Array.isArray(r) ? r : []);
          if (!dead) setReviews(Array.isArray(items) ? items : []);
        }
      } catch (e) {
        toast.error(e.message || "Failed to load tab");
        if (!dead) {
          if (tab === "posts") setPosts([]);
          if (tab === "services") setServices([]);
          if (tab === "products") setProducts([]);
          if (tab === "reviews") setReviews([]);
        }
      } finally {
        if (!dead) setTabLoading(false);
      }
    }

    loadTab();
    return () => {
      dead = true;
    };
  }, [API_BASE, userId, tab]);

  const cover = profile?.cover_url || "";
  const avatar = profile?.avatar_url || "";
  const displayName = profile?.display_name || profile?.username || "User";
  const username = profile?.username ? `@${profile.username}` : "";
  const verified = !!profile?.is_verified;

  async function onFollowToggle() {
    if (!canAct) return toast.error("سجّل دخول الأول عشان تعمل Follow");
    try {
      if (isFollowing) {
        await tryFetchFallback(
          [
            `${API_BASE}/api/profile/${userId}/follow`,
            `${API_BASE}/api/follow/${userId}`,
          ],
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json", ...authHeaders() },
          }
        );
        setIsFollowing(false);
        setStats((s) =>
          s ? { ...s, followers: Math.max(0, (s.followers || 0) - 1) } : s
        );
      } else {
        await tryFetchFallback(
          [
            `${API_BASE}/api/profile/${userId}/follow`,
            `${API_BASE}/api/follow/${userId}`,
          ],
          {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
          }
        );
        setIsFollowing(true);
        setStats((s) => (s ? { ...s, followers: (s.followers || 0) + 1 } : s));
      }
    } catch (e) {
      toast.error(e.message || "Follow failed");
    }
  }

  async function onSaveProfile() {
    if (!canEdit) return;
    try {
      const payload = { ...editForm };
      const r = await tryFetchFallback(
        [
          `${API_BASE}/api/profile/me`,
          `${API_BASE}/api/me/profile`,
          `${API_BASE}/api/user/profile/me`,
        ],
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify(payload),
        }
      );
      toast.success("Saved");
      setProfile(r.profile || r.user_profile || r.user || r);
      setEditOpen(false);
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  }

  async function refreshCurrentTab() {
    try {
      const uid = String(userId || "").trim();
      if (!uid) return;

      if (tab === "posts") {
        const r = await tryFetchFallback(
          [
            `${API_BASE}/api/profile/${uid}/posts`,
            `${API_BASE}/api/profile_posts/${uid}`,
            `${API_BASE}/api/profile-posts/${uid}`,
            `${API_BASE}/api/users/${uid}/posts`,
            `${API_BASE}/api/posts?userId=${encodeURIComponent(uid)}`,
            `${API_BASE}/api/posts/user/${encodeURIComponent(uid)}`,
          ],
          { headers: { ...authHeaders() } }
        );
        const items =
          r?.posts ||
          r?.items ||
          r?.data ||
          r?.results ||
          (Array.isArray(r) ? r : []);
        setPosts(Array.isArray(items) ? items : []);
      }

      if (tab === "services") {
        const r = await tryFetchFallback(
          [
            `${API_BASE}/api/profile/${uid}/services`,
            `${API_BASE}/api/services/user/${uid}`,
            `${API_BASE}/api/users/${uid}/services`,
          ],
          { headers: { ...authHeaders() } }
        );
        const items =
          r?.services || r?.items || r?.data || (Array.isArray(r) ? r : []);
        setServices(Array.isArray(items) ? items : []);
      }

      if (tab === "products") {
        const r = await tryFetchFallback(
          [
            `${API_BASE}/api/profile/${uid}/products`,
            `${API_BASE}/api/products/user/${uid}`,
            `${API_BASE}/api/users/${uid}/products`,
          ],
          { headers: { ...authHeaders() } }
        );
        const items =
          r?.products || r?.items || r?.data || (Array.isArray(r) ? r : []);
        setProducts(Array.isArray(items) ? items : []);
      }

      if (tab === "reviews") {
        const r = await tryFetchFallback(
          [
            `${API_BASE}/api/profile/${uid}/reviews`,
            `${API_BASE}/api/reviews/user/${uid}`,
            `${API_BASE}/api/users/${uid}/reviews`,
          ],
          { headers: { ...authHeaders() } }
        );
        const items =
          r?.reviews || r?.items || r?.data || (Array.isArray(r) ? r : []);
        setReviews(Array.isArray(items) ? items : []);
      }
    } catch {}
  }

  // ✅ CREATE POST
  async function onCreatePost() {
    if (!canEdit) return;
    const content = String(postForm.content || "").trim();
    if (!content) return toast.error("اكتب البوست الأول");

    const category = String(postForm.category || "General").trim() || "General";
    const media_url = String(postForm.media_url || "").trim() || null;

    try {
      await tryFetchFallback(
        [
          `${API_BASE}/api/posts`,
          `${API_BASE}/api/feed/posts`,
          `${API_BASE}/api/post`,
          `${API_BASE}/api/profile/me/posts`,
          `${API_BASE}/api/me/profile/posts`,
          `${API_BASE}/api/profile_posts/me`,
        ],
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            content,
            media_url,
            category,
            topic: category,
          }),
        }
      );

      toast.success("Posted");
      setPostForm((s) => ({ ...s, content: "", media_url: "" }));
      setTab("posts");
      await refreshCurrentTab();
      setStats((s) => (s ? { ...s, posts: (s.posts || 0) + 1 } : s));
    } catch (e) {
      toast.error(e.message || "Create post failed");
    }
  }

  async function onDeletePost(postId) {
    if (!canEdit) return;

    const ok = await toastConfirm({
      title: "Delete this post?",
      confirmText: "Delete",
    });
    if (!ok) return;

    const target = normId(postId);
    const prev = posts;

    // ✅ optimistic remove with normalized id compare
    setPosts((xs) =>
      (Array.isArray(xs) ? xs : []).filter((p) => {
        const pid = normId(getPostId(p));
        return pid !== target;
      })
    );

    try {
      const idForUrl = extractNumericId(postId) ?? postId;

      await tryFetchFallback(
        [
          `${API_BASE}/api/posts/${idForUrl}`,
          `${API_BASE}/api/post/${idForUrl}`,
          `${API_BASE}/api/profile/me/posts/${idForUrl}`,
          `${API_BASE}/api/me/profile/posts/${idForUrl}`,
          `${API_BASE}/api/profile_posts/me/${idForUrl}`,
        ],
        { method: "DELETE", headers: { ...authHeaders() } }
      );

      toast.success("Deleted");
      setStats((s) =>
        s ? { ...s, posts: Math.max(0, (s.posts || 0) - 1) } : s
      );

      await refreshCurrentTab();
    } catch (e) {
      setPosts(prev);
      toast.error(e.message || "Delete failed");
    }
  }

  // ✅ UPDATE POST (Edit)
  async function onUpdatePost(postId, payload) {
    if (!canEdit) return;

    const content = String(payload?.content ?? "").trim();
    if (!content) return toast.error("اكتب محتوى البوست");

    const prev = posts;
    const target = normId(postId);

    // ✅ optimistic update
    setPosts((xs) =>
      (Array.isArray(xs) ? xs : []).map((p) => {
        const pid = normId(getPostId(p));
        if (pid !== target) return p;
        return { ...p, content };
      })
    );

    const idForUrl = extractNumericId(postId) ?? postId;

    const urls = [
      `${API_BASE}/api/posts/${idForUrl}`,
      `${API_BASE}/api/post/${idForUrl}`,
      `${API_BASE}/api/profile/me/posts/${idForUrl}`,
      `${API_BASE}/api/me/profile/posts/${idForUrl}`,
    ];

    const body = JSON.stringify({
      content,
      text: content,
      body: content,
      message: content,
    });

    try {
      try {
        await tryFetchFallback(urls, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body,
        });
      } catch {
        await tryFetchFallback(urls, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body,
        });
      }

      toast.success("Updated");
      await refreshCurrentTab();
    } catch (e) {
      setPosts(prev);
      toast.error(e.message || "Update failed");
    }
  }

  async function onCreateService() {
    if (!canEdit) return;
    const title = String(serviceForm.title || "").trim();
    if (!title) return toast.error("اكتب عنوان الخدمة");
    const priceValue =
      serviceForm.price_value === "" ? null : Number(serviceForm.price_value);

    try {
      await tryFetchFallback(
        [
          `${API_BASE}/api/profile/me/services`,
          `${API_BASE}/api/me/profile/services`,
          `${API_BASE}/api/services/me`,
        ],
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            ...serviceForm,
            title,
            price_value: Number.isFinite(priceValue) ? priceValue : null,
          }),
        }
      );
      toast.success("Service added");
      setAddServiceOpen(false);
      setServiceForm({
        title: "",
        description: "",
        category: "",
        price_type: "negotiable",
        price_value: "",
        location: "",
      });
      setTab("services");
      await refreshCurrentTab();
      setStats((s) => (s ? { ...s, services: (s.services || 0) + 1 } : s));
    } catch (e) {
      toast.error(e.message || "Create service failed");
    }
  }

  async function onDeleteService(id) {
    if (!canEdit) return;

    const ok = await toastConfirm({
      title: "Delete this service?",
      confirmText: "Delete",
    });
    if (!ok) return;

    const prev = services;
    setServices((xs) =>
      (Array.isArray(xs) ? xs : []).filter((s) => (s.id ?? s.service_id) !== id)
    );

    try {
      await tryFetchFallback(
        [
          `${API_BASE}/api/profile/me/services/${id}`,
          `${API_BASE}/api/me/profile/services/${id}`,
          `${API_BASE}/api/services/me/${id}`,
        ],
        { method: "DELETE", headers: { ...authHeaders() } }
      );
      toast.success("Deleted");
      setStats((st) =>
        st ? { ...st, services: Math.max(0, (st.services || 0) - 1) } : st
      );
      await refreshCurrentTab();
    } catch (e) {
      setServices(prev);
      toast.error(e.message || "Delete failed");
    }
  }

  async function onCreateProduct() {
    if (!canEdit) return;
    const title = String(productForm.title || "").trim();
    if (!title) return toast.error("اكتب عنوان المنتج");
    const price = productForm.price === "" ? null : Number(productForm.price);
    const images = String(productForm.imagesText || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    try {
      await tryFetchFallback(
        [
          `${API_BASE}/api/profile/me/products`,
          `${API_BASE}/api/me/profile/products`,
          `${API_BASE}/api/products/me`,
        ],
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            title,
            description: String(productForm.description || "").trim() || null,
            price: Number.isFinite(price) ? price : null,
            currency: String(productForm.currency || "USD").trim() || "USD",
            location: String(productForm.location || "").trim() || null,
            images,
          }),
        }
      );
      toast.success("Product added");
      setAddProductOpen(false);
      setProductForm({
        title: "",
        description: "",
        price: "",
        currency: "USD",
        location: "",
        imagesText: "",
      });
      setTab("products");
      await refreshCurrentTab();
      setStats((s) => (s ? { ...s, products: (s.products || 0) + 1 } : s));
    } catch (e) {
      toast.error(e.message || "Create product failed");
    }
  }

  async function onDeleteProduct(id) {
    if (!canEdit) return;

    const ok = await toastConfirm({
      title: "Delete this product?",
      confirmText: "Delete",
    });
    if (!ok) return;

    const prev = products;
    setProducts((xs) =>
      (Array.isArray(xs) ? xs : []).filter((p) => (p.id ?? p.product_id) !== id)
    );

    try {
      await tryFetchFallback(
        [
          `${API_BASE}/api/profile/me/products/${id}`,
          `${API_BASE}/api/me/profile/products/${id}`,
          `${API_BASE}/api/products/me/${id}`,
        ],
        { method: "DELETE", headers: { ...authHeaders() } }
      );
      toast.success("Deleted");
      setStats((st) =>
        st ? { ...st, products: Math.max(0, (st.products || 0) - 1) } : st
      );
      await refreshCurrentTab();
    } catch (e) {
      setProducts(prev);
      toast.error(e.message || "Delete failed");
    }
  }

  async function onCreateReview() {
    if (!canAct) return toast.error("سجّل دخول الأول عشان تكتب Review");
    if (isMe || computedIsMe) return toast.error("مش ينفع تعمل Review لنفسك");
    const rating = Number(reviewForm.rating);
    const comment = String(reviewForm.comment || "").trim();
    if (!comment) return toast.error("اكتب تعليقك");
    if (!Number.isFinite(rating) || rating < 1 || rating > 5)
      return toast.error("Rating لازم من 1 لـ 5");

    try {
      await tryFetchFallback(
        [
          `${API_BASE}/api/profile/${userId}/reviews`,
          `${API_BASE}/api/reviews/${userId}`,
          `${API_BASE}/api/users/${userId}/reviews`,
        ],
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ rating, comment }),
        }
      );
      toast.success("Review sent");
      setAddReviewOpen(false);
      setReviewForm({ rating: 5, comment: "" });
      setTab("reviews");
      await refreshCurrentTab();
    } catch (e) {
      toast.error(e.message || "Review failed");
    }
  }

  async function onShare() {
    const url = window.location.href;
    const text = `Profile on AnswerForU: ${displayName}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "AnswerForU", text, url });
        toast.success("Shared");
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      } catch {
        toast("Copy link: " + url);
      }
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-44 rounded-2xl bg-gray-200" />
          <div className="h-20 rounded-2xl bg-gray-200" />
          <div className="h-64 rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white border rounded-2xl p-6">
          <div className="font-semibold mb-2">Profile not found</div>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const ratingAvg = Number(stats?.ratingAvg ?? 0) || 0;
  const followers = Number(stats?.followers ?? 0) || 0;
  const following = Number(stats?.following ?? 0) || 0;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Cover */}
      <div className="relative rounded-2xl overflow-hidden border bg-white">
        <div className="h-40 md:h-56 bg-gradient-to-r from-gray-100 to-gray-200">
          {cover ? (
            <img
              src={cover}
              alt="cover"
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>

        {/* Header Card */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="-mt-12 md:-mt-16 flex items-end gap-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border bg-white shadow">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white text-2xl font-extrabold">
                    {getInitials(displayName)}
                  </div>
                )}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <div className="text-xl md:text-2xl font-bold">
                    {displayName}
                  </div>
                  {verified ? (
                    <BadgeCheck className="text-blue-600" size={20} />
                  ) : null}
                </div>
                <div className="text-sm text-gray-500">{username}</div>
              </div>
            </div>

            <div className="md:ml-auto flex flex-wrap gap-2">
              <button
                onClick={onShare}
                className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                <Share2 size={16} />
                Share
              </button>

              {!canEdit ? (
                <button
                  onClick={onFollowToggle}
                  className={classNames(
                    "px-4 py-2 rounded-xl flex items-center gap-2",
                    isFollowing
                      ? "bg-white border hover:bg-gray-50"
                      : "bg-black text-white hover:bg-gray-900"
                  )}
                >
                  <MessageCircle size={16} />
                  {isFollowing ? "Following" : "Follow"}
                </button>
              ) : (
                <button
                  onClick={() => setEditOpen(true)}
                  className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-900 flex items-center gap-2"
                >
                  <Pencil size={16} />
                  Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Bio + Meta */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="text-gray-800 whitespace-pre-wrap">
                {profile.bio || (
                  <span className="text-gray-400">No bio yet.</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                {profile.location ? (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} /> {profile.location}
                  </div>
                ) : null}

                {profile.website ? (
                  <a
                    href={safeUrl(profile.website)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 hover:underline"
                  >
                    <LinkIcon size={16} /> Website
                  </a>
                ) : null}

                {profile.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone size={16} /> {profile.phone}
                  </div>
                ) : null}
              </div>
            </div>

            <StatsPanel
              ratingAvg={ratingAvg}
              ratingCount={countReviews}
              followers={followers}
              following={following}
              posts={countPosts}
              services={countServices}
              products={countProducts}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 bg-white border rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-3 py-3 border-b bg-white">
          <TabPill
            active={tab === "posts"}
            onClick={() => setTab("posts")}
            icon={<MessageCircle size={16} />}
            label={`Posts (${countPosts})`}
          />
          <TabPill
            active={tab === "services"}
            onClick={() => setTab("services")}
            icon={<Briefcase size={16} />}
            label={`Services (${countServices})`}
          />
          <TabPill
            active={tab === "products"}
            onClick={() => setTab("products")}
            icon={<Store size={16} />}
            label={`Products (${countProducts})`}
          />
          <TabPill
            active={tab === "reviews"}
            onClick={() => setTab("reviews")}
            icon={<Star size={16} />}
            label={`Reviews (${countReviews})`}
          />

          <div className="ml-auto flex flex-wrap gap-2">
            {canEdit && tab === "services" ? (
              <button
                onClick={() => setAddServiceOpen(true)}
                className="px-3 py-2 rounded-xl bg-black text-white hover:bg-gray-900 flex items-center gap-2"
              >
                <Plus size={16} />
                Add service
              </button>
            ) : null}

            {canEdit && tab === "products" ? (
              <button
                onClick={() => setAddProductOpen(true)}
                className="px-3 py-2 rounded-xl bg-black text-white hover:bg-gray-900 flex items-center gap-2"
              >
                <Plus size={16} />
                Add product
              </button>
            ) : null}

            {!canEdit && tab === "reviews" ? (
              <button
                onClick={() =>
                  canAct
                    ? setAddReviewOpen(true)
                    : toast.error("سجّل دخول الأول")
                }
                className="px-3 py-2 rounded-xl bg-black text-white hover:bg-gray-900 flex items-center gap-2"
              >
                <Star size={16} />
                Write review
              </button>
            ) : null}
          </div>
        </div>

        <div className="p-4">
          {tabLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-16 bg-gray-100 rounded-2xl" />
              <div className="h-16 bg-gray-100 rounded-2xl" />
              <div className="h-16 bg-gray-100 rounded-2xl" />
            </div>
          ) : null}

          {!tabLoading && tab === "posts" ? (
            <PostsTab
              API_BASE={API_BASE}
              profile={profile}
              items={posts}
              isMe={canEdit}
              canAct={canAct}
              onDelete={onDeletePost}
              onUpdate={onUpdatePost}
              showComposer={canEdit}
              postForm={postForm}
              setPostForm={setPostForm}
              categories={FEED_CATEGORIES}
              onCreatePost={onCreatePost}
            />
          ) : null}

          {!tabLoading && tab === "services" ? (
            <ServicesTab
              items={services}
              isMe={canEdit}
              onDelete={onDeleteService}
            />
          ) : null}

          {!tabLoading && tab === "products" ? (
            <ProductsTab
              items={products}
              isMe={canEdit}
              onDelete={onDeleteProduct}
            />
          ) : null}

          {!tabLoading && tab === "reviews" ? (
            <ReviewsTab
              items={reviews}
              ratingAvg={ratingAvg}
              ratingCount={countReviews}
            />
          ) : null}
        </div>
      </div>

      {/* ===== Modals ===== */}
      <Modal
        title="Edit profile"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onSaveProfile}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-900"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Username"
            value={editForm.username}
            onChange={(v) => setEditForm((s) => ({ ...s, username: v }))}
            placeholder="example"
          />
          <Field
            label="Display name"
            value={editForm.display_name}
            onChange={(v) => setEditForm((s) => ({ ...s, display_name: v }))}
            placeholder="Your name"
          />
          <Field
            label="Avatar URL"
            value={editForm.avatar_url}
            onChange={(v) => setEditForm((s) => ({ ...s, avatar_url: v }))}
            placeholder="https://..."
          />
          <Field
            label="Cover URL"
            value={editForm.cover_url}
            onChange={(v) => setEditForm((s) => ({ ...s, cover_url: v }))}
            placeholder="https://..."
          />
          <Field
            label="Location"
            value={editForm.location}
            onChange={(v) => setEditForm((s) => ({ ...s, location: v }))}
            placeholder="Virginia, USA"
          />
          <Field
            label="Website"
            value={editForm.website}
            onChange={(v) => setEditForm((s) => ({ ...s, website: v }))}
            placeholder="google.com or https://..."
          />
          <Field
            label="Phone"
            value={editForm.phone}
            onChange={(v) => setEditForm((s) => ({ ...s, phone: v }))}
            placeholder="+1..."
          />
          <Field
            label="WhatsApp"
            value={editForm.whatsapp}
            onChange={(v) => setEditForm((s) => ({ ...s, whatsapp: v }))}
            placeholder="+20..."
          />
        </div>
        <div className="mt-3">
          <label className="text-sm font-medium">Bio</label>
          <textarea
            className="mt-1 w-full min-h-[110px] border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
            value={editForm.bio}
            onChange={(e) =>
              setEditForm((s) => ({ ...s, bio: e.target.value }))
            }
            placeholder="Tell people about you…"
          />
        </div>
      </Modal>

      <Modal
        title="Add service"
        open={addServiceOpen}
        onClose={() => setAddServiceOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAddServiceOpen(false)}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onCreateService}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-900"
            >
              Add
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Title"
            value={serviceForm.title}
            onChange={(v) => setServiceForm((s) => ({ ...s, title: v }))}
            placeholder="Electrician / Plumber…"
          />
          <Field
            label="Category"
            value={serviceForm.category}
            onChange={(v) => setServiceForm((s) => ({ ...s, category: v }))}
            placeholder="Home services…"
          />
          <div>
            <label className="text-sm font-medium">Price type</label>
            <select
              className="mt-1 w-full border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
              value={serviceForm.price_type}
              onChange={(e) =>
                setServiceForm((s) => ({ ...s, price_type: e.target.value }))
              }
            >
              <option value="negotiable">Negotiable</option>
              <option value="fixed">Fixed</option>
              <option value="starting_at">Starting at</option>
            </select>
          </div>
          <Field
            label="Price value (optional)"
            value={serviceForm.price_value}
            onChange={(v) => setServiceForm((s) => ({ ...s, price_value: v }))}
            placeholder="e.g. 100"
          />
          <Field
            label="Location (optional)"
            value={serviceForm.location}
            onChange={(v) => setServiceForm((s) => ({ ...s, location: v }))}
            placeholder="Fairfax, VA"
          />
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full min-h-[110px] border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
              value={serviceForm.description}
              onChange={(e) =>
                setServiceForm((s) => ({ ...s, description: e.target.value }))
              }
              placeholder="Describe your service…"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Add product"
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAddProductOpen(false)}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onCreateProduct}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-900"
            >
              Add
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="Title"
            value={productForm.title}
            onChange={(v) => setProductForm((s) => ({ ...s, title: v }))}
            placeholder="Item name…"
          />
          <Field
            label="Price (optional)"
            value={productForm.price}
            onChange={(v) => setProductForm((s) => ({ ...s, price: v }))}
            placeholder="e.g. 25"
          />
          <Field
            label="Currency"
            value={productForm.currency}
            onChange={(v) => setProductForm((s) => ({ ...s, currency: v }))}
            placeholder="USD"
          />
          <Field
            label="Location (optional)"
            value={productForm.location}
            onChange={(v) => setProductForm((s) => ({ ...s, location: v }))}
            placeholder="Alexandria, VA"
          />
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full min-h-[110px] border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
              value={productForm.description}
              onChange={(e) =>
                setProductForm((s) => ({ ...s, description: e.target.value }))
              }
              placeholder="Describe the product…"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">
              Images URLs (one per line)
            </label>
            <textarea
              className="mt-1 w-full min-h-[110px] border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
              value={productForm.imagesText}
              onChange={(e) =>
                setProductForm((s) => ({ ...s, imagesText: e.target.value }))
              }
              placeholder={`https://...\nhttps://...`}
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Write review"
        open={addReviewOpen}
        onClose={() => setAddReviewOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setAddReviewOpen(false)}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onCreateReview}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-900"
            >
              Send
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Rating</label>
            <select
              className="mt-1 w-full border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
              value={reviewForm.rating}
              onChange={(e) =>
                setReviewForm((s) => ({ ...s, rating: Number(e.target.value) }))
              }
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} ⭐
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Comment</label>
            <textarea
              className="mt-1 w-full min-h-[120px] border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
              value={reviewForm.comment}
              onChange={(e) =>
                setReviewForm((s) => ({ ...s, comment: e.target.value }))
              }
              placeholder="Your experience…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* =========================
   Small Components
========================= */

function StatsPanel({
  ratingAvg,
  ratingCount,
  followers,
  following,
  posts,
  services,
  products,
}) {
  const rounded = Math.round(Number(ratingAvg || 0));
  const safeAvg = Number.isFinite(Number(ratingAvg)) ? Number(ratingAvg) : 0;

  return (
    <div className="rounded-2xl border bg-gradient-to-b from-gray-50 to-white p-4 shadow-sm">
      <div className="rounded-2xl border bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
              <Star size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Rating</div>
              <div className="text-lg font-extrabold leading-tight">
                {safeAvg.toFixed(1)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < rounded ? "text-yellow-500" : "text-gray-300"}
                />
              ))}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {ratingCount} review{ratingCount === 1 ? "" : "s"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Users size={16} />}
          label="Followers"
          value={followers}
        />
        <StatCard
          icon={<UserPlus size={16} />}
          label="Following"
          value={following}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <StatMini
          icon={<MessageCircle size={16} />}
          label="Posts"
          value={posts}
        />
        <StatMini
          icon={<Briefcase size={16} />}
          label="Services"
          value={services}
        />
        <StatMini
          icon={<Store size={16} />}
          label="Products"
          value={products}
        />
      </div>

      <div className="mt-3 flex items-center justify-center">
        <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 border text-gray-600">
          Profile stats
        </span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-3 hover:shadow-sm transition">
      <div className="flex items-center gap-2 text-gray-700">
        <div className="w-9 h-9 rounded-xl bg-gray-50 border flex items-center justify-center">
          {icon}
        </div>
        <div className="text-xs font-semibold">{label}</div>
      </div>
      <div className="mt-2 text-xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

function StatMini({ icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-3 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-gray-600">{label}</div>
        <div className="text-gray-500">{icon}</div>
      </div>
      <div className="mt-1 text-base font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

function TabPill({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "px-3 py-2 rounded-xl border flex items-center gap-2 text-sm transition",
        active
          ? "bg-black text-white border-black"
          : "bg-white hover:bg-gray-50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        className="mt-1 w-full border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/* =========================
   Comments (Feed-like)
========================= */

const VISUAL_MAX_DEPTH = 6;
const INDENT_PX = 16;

function normalizeComment(c) {
  if (!c) return null;
  const id = c.id ?? c.comment_id ?? c._id;
  const parentId = c.parent_id ?? c.parentId ?? c.reply_to ?? c.replyTo ?? null;
  const postId = c.post_id ?? c.postId ?? c.threadKey ?? c.postID ?? null;

  const authorId = c.author_id ?? c.user_id ?? c.userId ?? c.uid ?? null;

  return {
    ...c,
    id,
    post_id: postId,
    parent_id: parentId,
    author_id: authorId,
    content:
      c.content ?? c.text ?? c.comment ?? c.body ?? c.message ?? c.value ?? "",
    author_name:
      c.author_name ??
      c.user_name ??
      c.username ??
      c.author ??
      c.name ??
      "User",
    author_avatar:
      c.author_avatar ?? c.avatar_url ?? c.avatar ?? c.user_avatar ?? "",
    created_at: c.created_at ?? c.createdAt ?? c.time ?? c.timestamp ?? null,
    likes_count: c.likes_count ?? c.likesCount ?? c.likes ?? c.likeCount ?? 0,
    is_liked: !!(c.is_liked ?? c.isLiked ?? c.liked),
    can_delete: !!(c.can_delete ?? c.canDelete),
  };
}

function buildCommentTree(flat = []) {
  const map = new Map();
  const roots = [];

  (Array.isArray(flat) ? flat : []).forEach((raw) => {
    const c = normalizeComment(raw);
    if (!c || !c.id) return;
    map.set(c.id, { ...c, replies: [] });
  });

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id).replies.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortByTime = (a, b) => {
    const ta = new Date(a.created_at || 0).getTime();
    const tb = new Date(b.created_at || 0).getTime();
    return ta - tb;
  };

  const sortDeep = (arr) => {
    arr.sort(sortByTime);
    arr.forEach((x) => sortDeep(x.replies || []));
  };

  sortDeep(roots);
  return roots;
}

/* =========================
   Tabs
========================= */

function PostsTab({
  API_BASE,
  profile,
  items,
  isMe,
  canAct,
  onDelete,
  onUpdate,
  showComposer,
  postForm,
  setPostForm,
  categories,
  onCreatePost,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div className="space-y-4">
      {showComposer ? (
        <ProfileComposer
          profile={profile}
          postForm={postForm}
          setPostForm={setPostForm}
          categories={categories}
          onCreatePost={onCreatePost}
        />
      ) : null}

      {safeItems.map((p, idx) => {
        const rawId = getPostId(p);
        const key = String(rawId ?? `row_${idx}`);
        return (
          <PostCard
            key={key}
            API_BASE={API_BASE}
            post={p}
            profile={profile}
            isMe={isMe}
            canAct={canAct}
            onDelete={() => onDelete(rawId)}
            onUpdate={(payload) => onUpdate(rawId, payload)}
          />
        );
      })}

      {!safeItems.length ? (
        <div className="text-sm text-gray-500">No posts yet.</div>
      ) : null}
    </div>
  );
}

function ProfileComposer({
  profile,
  postForm,
  setPostForm,
  categories,
  onCreatePost,
}) {
  const authorName =
    profile?.display_name || profile?.username || profile?.name || "You";
  const avatar = profile?.avatar_url || "";

  const category = String(postForm.category || "General").trim() || "General";

  return (
    <div className="border rounded-2xl bg-white overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold">
          {avatar ? (
            <img src={avatar} alt="a" className="w-full h-full object-cover" />
          ) : (
            getInitials(authorName)
          )}
        </div>

        <div className="flex-1">
          <textarea
            className="w-full min-h-[110px] border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
            value={postForm.content}
            onChange={(e) =>
              setPostForm((s) => ({ ...s, content: e.target.value }))
            }
            placeholder="احكي تجربتك، اسأل سؤال، أو شارك معلومة تساعد غيرك… ✍️"
          />

          <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
            <div className="flex-1">
              <div className="text-xs text-gray-500 hidden md:block">
                Category
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="border rounded-2xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-black/10"
                  value={postForm.category}
                  onChange={(e) =>
                    setPostForm((s) => ({ ...s, category: e.target.value }))
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <span
                  className={classNames(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs border",
                    getCategory(category).badge
                  )}
                >
                  <span
                    className={classNames(
                      "w-2 h-2 rounded-full",
                      getCategory(category).dot
                    )}
                  />
                  {getCategory(category).label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onCreatePost}
                className="px-5 py-3 rounded-2xl bg-black text-white hover:bg-gray-900 font-semibold"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   ✅ FIX: comments ids
========================= */

// ✅ pp_18 = profile_posts id (مش مربوط بـ /api/posts/:id/comments)
// ✅ p_18 = post id (ممكن يتحول لـ 18)
const normalizeFeedPostId = (raw) => {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  if (s.startsWith("p_")) {
    const n = Number(s.slice(2));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  if (s.startsWith("pp_")) return null;

  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
};

function PostCard({
  API_BASE,
  post,
  profile,
  isMe,
  canAct,
  onDelete,
  onUpdate,
}) {
  const rawPostId = getPostId(post);

  // ✅ الرقم الحقيقي اللي ينفع للـ comments endpoints
  const numericPostId = useMemo(() => {
    const s = String(rawPostId ?? "").trim();
    if (!s) return null;

    // ✅ IMPORTANT: pp_ لازم يتقفّل قبل أي extraction
    if (s.startsWith("pp_")) return null;

    const direct = normalizeFeedPostId(s);
    if (direct) return direct;

    const extracted = extractNumericId(s);
    return extracted || null;
  }, [rawPostId]);

  // ✅ ده الوحيد اللي نستخدمه في URLs
  const postIdForComments = numericPostId ? String(numericPostId) : null;

  // ✅ optimistic/local فقط
  const idForUrl = numericPostId ?? rawPostId;

  const created = formatTime(post.created_at || post.createdAt) || "";

  const authorName =
    post.author_name ||
    post.user_name ||
    post.username ||
    profile?.display_name ||
    profile?.username ||
    "User";

  const authorAvatar =
    post.author_avatar ||
    post.avatar_url ||
    profile?.avatar_url ||
    post.user_avatar ||
    "";

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [openComments, setOpenComments] = useState(true);

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [showRepliesMap, setShowRepliesMap] = useState({});

  // ✅ edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(String(post.content || ""));

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  const makeCommentGetUrls = (pid) => [
    `${API_BASE}/api/post_comments/${encodeURIComponent(pid)}`,
    `${API_BASE}/api/comments/${encodeURIComponent(pid)}`,
    `${API_BASE}/api/comments/post/${encodeURIComponent(pid)}`,
    `${API_BASE}/api/posts/${encodeURIComponent(pid)}/comments`,
    `${API_BASE}/api/post/${encodeURIComponent(pid)}/comments`,
  ];

  const makeCommentPostUrls = (pid) => [
    // ✅ الأهم: ده غالبًا اللي الـ Feed شغال عليه
    `${API_BASE}/api/comments`,
    `${API_BASE}/api/comments/post/${encodeURIComponent(pid)}`,

    // ✅ احتياط لو السيرفر شغال nested
    `${API_BASE}/api/posts/${encodeURIComponent(pid)}/comments`,
    `${API_BASE}/api/post/${encodeURIComponent(pid)}/comments`,
  ];

  const makeCommentDeleteUrls = (pid, commentId) => [
    `${API_BASE}/api/comments/${commentId}`,
    `${API_BASE}/api/comment/${commentId}`,
    `${API_BASE}/api/posts/${encodeURIComponent(pid)}/comments/${commentId}`,
    `${API_BASE}/api/post/${encodeURIComponent(pid)}/comments/${commentId}`,
  ];

  async function loadComments() {
    if (!postIdForComments) {
      setComments([]);
      return;
    }

    setCommentsLoading(true);
    try {
      const urls = makeCommentGetUrls(postIdForComments);
      const r = await tryFetchFallback(urls, { headers: { ...authHeaders() } });

      const items =
        r?.comments ||
        r?.items ||
        r?.data ||
        r?.results ||
        (Array.isArray(r) ? r : []);

      setComments(Array.isArray(items) ? items : []);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [String(postIdForComments ?? "")]);
  async function onSendComment() {
    if (!canAct) return toast.error("سجّل دخول الأول");
    if (!postIdForComments) return toast.error("التعليقات غير متاحة للبوست ده");

    const content = String(draft || "").trim();
    if (!content) return;

    const payload = replyTo
      ? { content, parent_id: replyTo, post_id: postIdForComments }
      : { content, post_id: postIdForComments };

    const optimistic = {
      id: "tmp_" + Math.random().toString(16).slice(2),
      post_id: postIdForComments,
      parent_id: replyTo || null,
      content,
      author_name: "You",
      author_avatar: "",
      created_at: new Date().toISOString(),
      likes_count: 0,
      is_liked: false,
      can_delete: true,
      author_id: getAuthUserId(),
    };

    setComments((xs) => [...xs, optimistic]);
    setDraft("");
    setReplyTo(null);

    try {
      const urls = makeCommentPostUrls(postIdForComments);

      await tryFetchFallback(urls, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });

      await loadComments();
    } catch (e) {
      setComments((xs) => xs.filter((c) => c.id !== optimistic.id));
      toast.error(e.message || "Failed to send comment");
    }
  }

  async function onDeleteComment(commentId) {
    const ok = await toastConfirm({
      title: "Delete this comment?",
      confirmText: "Delete",
    });
    if (!ok) return;

    const prev = comments;
    setComments((xs) => xs.filter((c) => (c.id ?? c.comment_id) !== commentId));

    try {
      if (!postIdForComments) throw new Error("Missing post id for comments");
      const urls = makeCommentDeleteUrls(postIdForComments, commentId);

      await tryFetchFallback(urls, {
        method: "DELETE",
        headers: { ...authHeaders() },
      });

      toast.success("Deleted");
      await loadComments();
    } catch (e) {
      setComments(prev);
      toast.error(e.message || "Delete failed");
    }
  }

  async function onToggleLikeComment(commentId, currentlyLiked) {
    if (!canAct) return toast.error("سجّل دخول الأول");

    setComments((xs) =>
      xs.map((c) => {
        const id = c.id ?? c.comment_id;
        if (id !== commentId) return c;
        const liked = !currentlyLiked;
        const likes =
          Number(c.likes_count ?? c.likesCount ?? c.likes ?? 0) || 0;
        return {
          ...c,
          is_liked: liked,
          likes_count: liked ? likes + 1 : Math.max(0, likes - 1),
        };
      })
    );

    try {
      await tryFetchFallback(
        [
          `${API_BASE}/api/comments/${commentId}/like`,
          `${API_BASE}/api/comment/${commentId}/like`,
          `${API_BASE}/api/like/comment/${commentId}`,
        ],
        {
          method: currentlyLiked ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
        }
      );
    } catch {
      await loadComments();
    }
  }

  function toggleReplies(commentId) {
    setShowRepliesMap((m) => ({ ...m, [commentId]: !m[commentId] }));
  }

  function openEdit() {
    setEditContent(String(post.content || ""));
    setEditOpen(true);
  }

  async function saveEdit() {
    const content = String(editContent || "").trim();
    if (!content) return toast.error("اكتب محتوى البوست");
    await onUpdate({ content });
    setEditOpen(false);
  }

  return (
    <div className="border rounded-2xl bg-white overflow-hidden">
      {/* Edit modal */}
      <Modal
        title="Edit post"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-900"
            >
              Save
            </button>
          </div>
        }
      >
        <label className="text-sm font-medium">Content</label>
        <textarea
          className="mt-2 w-full min-h-[160px] border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-black/10"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="Update your post…"
        />
      </Modal>

      <div className="px-4 py-3 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt="a"
              className="w-full h-full object-cover"
            />
          ) : (
            getInitials(authorName)
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold leading-tight">{authorName}</div>
              <div className="text-xs text-gray-500">{created}</div>
            </div>

            {isMe ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={openEdit}
                  className="p-2 rounded-xl hover:bg-gray-50 text-gray-700"
                  title="Edit post"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={onDelete}
                  className="p-2 rounded-xl hover:bg-gray-50 text-red-600"
                  title="Delete post"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-2 whitespace-pre-wrap text-gray-900">
            {post.content}
          </div>

          {post.media_url ? (
            <div className="mt-3">
              <img
                src={post.media_url}
                alt="media"
                className="w-full max-h-[520px] object-cover rounded-2xl border"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t bg-gray-50/60">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setOpenComments((v) => !v)}
            className="text-sm font-semibold text-gray-800 flex items-center gap-2"
          >
            Comments
            {openComments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {!postIdForComments ? (
            <span className="text-xs text-gray-500">
              Comments not available for this post id
            </span>
          ) : null}
        </div>

        {openComments ? (
          <div className="px-4 pb-4">
            {commentsLoading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-12 rounded-2xl bg-gray-200" />
                <div className="h-12 rounded-2xl bg-gray-200" />
              </div>
            ) : (
              <div className="space-y-3">
                {tree.map((node) => (
                  <CommentNode
                    key={node.id}
                    node={node}
                    depth={0}
                    showRepliesMap={showRepliesMap}
                    onToggleReplies={toggleReplies}
                    onReply={(id) => setReplyTo(id)}
                    onDelete={(id) => onDeleteComment(id)}
                    onLike={(id, liked) => onToggleLikeComment(id, liked)}
                    canAct={canAct}
                    isMe={isMe}
                  />
                ))}

                {!tree.length ? (
                  <div className="text-sm text-gray-500">No comments yet.</div>
                ) : null}
              </div>
            )}

            <div className="mt-4 flex items-start gap-2">
              <div className="w-10 h-10 rounded-full bg-white border flex items-center justify-center font-bold">
                {getInitials("You")}
              </div>

              <div className="flex-1">
                {replyTo ? (
                  <div className="mb-2 flex items-center justify-between text-xs bg-white border rounded-xl px-3 py-2">
                    <span className="text-gray-700">
                      Replying… (comment #{String(replyTo).slice(0, 6)})
                    </span>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a comment…"
                    className="w-full bg-white border rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
                  />
                  <button
                    onClick={onSendComment}
                    className="px-4 py-3 rounded-2xl bg-black text-white hover:bg-gray-900 flex items-center gap-2"
                  >
                    <SendHorizontal size={16} />
                    Send
                  </button>
                </div>

                {!canAct ? (
                  <div className="text-xs text-gray-500 mt-2">
                    لازم تسجّل دخول عشان تكتب تعليق.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CommentNode({
  node,
  depth,
  showRepliesMap,
  onToggleReplies,
  onReply,
  onDelete,
  onLike,
  canAct,
  isMe,
}) {
  const id = node.id;
  const d = Math.min(depth, VISUAL_MAX_DEPTH);
  const marginLeft = d * INDENT_PX;

  const hasReplies = Array.isArray(node.replies) && node.replies.length > 0;
  const showReplies = showRepliesMap[id] ?? true;

  const authorName = node.author_name || "User";
  const avatar = node.author_avatar || "";

  const meId = getAuthUserId();
  const nodeAuthorId =
    node.author_id ?? node.user_id ?? node.userId ?? node.uid ?? null;

  const canDelete =
    !!node.can_delete ||
    (canAct &&
      meId &&
      nodeAuthorId !== null &&
      String(nodeAuthorId) === String(meId)) ||
    authorName === "You";

  const likes = Number(node.likes_count ?? 0) || 0;
  const liked = !!node.is_liked;

  return (
    <div style={{ marginLeft }} className="relative">
      {depth > 0 ? (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gray-200 rounded-full" />
      ) : null}

      <div className={classNames("flex gap-2", depth > 0 ? "pl-3" : "")}>
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold shrink-0">
          {avatar ? (
            <img src={avatar} alt="a" className="w-full h-full object-cover" />
          ) : (
            getInitials(authorName)
          )}
        </div>

        <div className="flex-1">
          <div className="bg-white border rounded-2xl px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm">{authorName}</div>
              <div className="text-xs text-gray-500">
                {formatTime(node.created_at) || ""}
              </div>
            </div>

            <div className="mt-1 text-sm whitespace-pre-wrap text-gray-900">
              {node.content}
            </div>

            <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
              <button
                onClick={() =>
                  canAct ? onLike(id, liked) : toast.error("سجّل دخول الأول")
                }
                className={classNames(
                  "inline-flex items-center gap-1 hover:text-gray-900",
                  liked ? "text-gray-900 font-semibold" : ""
                )}
              >
                <ThumbsUp size={14} />
                Like {likes ? `(${likes})` : ""}
              </button>

              <button
                onClick={() =>
                  canAct ? onReply(id) : toast.error("سجّل دخول الأول")
                }
                className="hover:text-gray-900"
              >
                Reply
              </button>

              {canDelete ? (
                <button
                  onClick={() => onDelete(id)}
                  className="hover:text-red-600 text-red-500"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>

          {hasReplies ? (
            <div className="mt-2">
              <button
                onClick={() => onToggleReplies(id)}
                className="text-xs font-semibold text-gray-700 hover:text-gray-900 inline-flex items-center gap-2"
              >
                {showReplies
                  ? "Hide replies"
                  : `View replies (${node.replies.length})`}
                {showReplies ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </button>

              {showReplies ? (
                <div className="mt-2 space-y-2">
                  {node.replies.map((r) => (
                    <CommentNode
                      key={r.id}
                      node={r}
                      depth={depth + 1}
                      showRepliesMap={showRepliesMap}
                      onToggleReplies={onToggleReplies}
                      onReply={onReply}
                      onDelete={onDelete}
                      onLike={onLike}
                      canAct={canAct}
                      isMe={isMe}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ServicesTab({ items, isMe, onDelete }) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div className="space-y-3">
      {safeItems.map((s) => (
        <div
          key={s.id ?? s.service_id}
          className="border rounded-2xl p-4 bg-white"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold flex items-center gap-2">
                <Briefcase size={16} />
                {s.title}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {s.category || "—"} •{" "}
                {s.price_type === "fixed"
                  ? "Fixed"
                  : s.price_type === "starting_at"
                  ? "Starting at"
                  : "Negotiable"}
                {s.price_value !== null && s.price_value !== undefined
                  ? ` • $${s.price_value}`
                  : ""}
                {s.location ? ` • ${s.location}` : ""}
              </div>
            </div>

            {isMe ? (
              <button
                onClick={() => onDelete(s.id ?? s.service_id)}
                className="p-2 rounded-xl hover:bg-gray-50 text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>

          {s.description ? (
            <div className="mt-2 text-gray-800 whitespace-pre-wrap">
              {s.description}
            </div>
          ) : null}
        </div>
      ))}
      {!safeItems.length ? (
        <div className="text-sm text-gray-500">No services yet.</div>
      ) : null}
    </div>
  );
}

function ProductsTab({ items, isMe, onDelete }) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {safeItems.map((p) => (
        <div
          key={p.id ?? p.product_id}
          className="border rounded-2xl overflow-hidden bg-white"
        >
          {Array.isArray(p.images) && p.images[0] ? (
            <img
              src={p.images[0]}
              alt="product"
              className="w-full h-44 object-cover"
            />
          ) : (
            <div className="w-full h-44 bg-gray-100" />
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold flex items-center gap-2">
                  <Store size={16} />
                  {p.title}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {p.price !== null && p.price !== undefined
                    ? `${p.currency || "USD"} ${p.price}`
                    : "Price: —"}
                  {p.location ? ` • ${p.location}` : ""}
                </div>
              </div>

              {isMe ? (
                <button
                  onClick={() => onDelete(p.id ?? p.product_id)}
                  className="p-2 rounded-xl hover:bg-gray-50 text-red-600"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>

            {p.description ? (
              <div className="mt-2 text-gray-800 whitespace-pre-wrap">
                {p.description}
              </div>
            ) : null}

            {Array.isArray(p.images) && p.images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {p.images.slice(1).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="img"
                    className="w-16 h-16 rounded-xl object-cover border"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ))}
      {!safeItems.length ? (
        <div className="text-sm text-gray-500">No products yet.</div>
      ) : null}
    </div>
  );
}

function ReviewsTab({ items, ratingAvg, ratingCount }) {
  const safeItems = Array.isArray(items) ? items : [];
  const dist = useMemo(() => {
    const buckets = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    safeItems.forEach((r) => {
      const n = Math.max(1, Math.min(5, Number(r.rating) || 0));
      if (n) buckets[n] += 1;
    });
    return buckets;
  }, [safeItems]);

  const max = Math.max(1, ...Object.values(dist));

  return (
    <div className="space-y-4">
      <div className="border rounded-2xl bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
              <div className="text-2xl font-extrabold">
                {Number(ratingAvg || 0).toFixed(1)}
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Overall rating</div>
              <div className="text-sm text-gray-500">
                {ratingCount} review{ratingCount === 1 ? "" : "s"}
              </div>
              <div className="mt-1 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < Math.round(Number(ratingAvg || 0))
                        ? "text-yellow-500"
                        : "text-gray-300"
                    }
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="md:ml-auto flex-1 max-w-md">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2 mb-2">
                <div className="w-10 text-xs text-gray-700 font-semibold">
                  {n}★
                </div>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden border">
                  <div
                    className="h-full bg-gray-900"
                    style={{ width: `${Math.round((dist[n] / max) * 100)}%` }}
                  />
                </div>
                <div className="w-10 text-xs text-gray-500 text-right">
                  {dist[n]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {safeItems.map((r) => (
          <div
            key={r.id ?? r.review_id}
            className="border rounded-2xl p-4 bg-white"
          >
            <div className="flex items-center justify-between">
              <div className="font-semibold">{r.author_name || "User"}</div>
              <div className="flex items-center gap-1 text-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Number(r.rating) ? "text-yellow-500" : "text-gray-300"
                    }
                  />
                ))}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatTime(r.created_at || r.createdAt) || r.created_at || ""}
            </div>
            <div className="mt-2 whitespace-pre-wrap">{r.comment}</div>
          </div>
        ))}

        {!safeItems.length ? (
          <div className="text-sm text-gray-500">No reviews yet.</div>
        ) : null}
      </div>
    </div>
  );
}

/* ✅ default export */
export default ProfilePage;
