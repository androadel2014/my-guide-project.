// src/components/PlaceDetailsView.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toastConfirm, notify } from "../lib/notify";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Star,
  ExternalLink,
  MessageSquarePlus,
  Sparkles,
  Lock,
  Pencil,
  X,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

const cn = (...a) => a.filter(Boolean).join(" ");

function getToken() {
  return localStorage.getItem("token") || "";
}
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
function isLoggedIn() {
  return !!getToken();
}

/* ============================
   ✅ JWT fallback (strong)
============================ */
function base64UrlToUtf8(b64url) {
  try {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const str = atob(b64 + pad);
    const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
}
function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = base64UrlToUtf8(part);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}
function getMeFromTokenFallback() {
  const token = getToken();
  const p = decodeJwtPayload(token);
  if (!p) return null;

  const id = p.id || p.userId || p.user_id || p.sub || p.uid;
  const username =
    p.username ||
    p.name ||
    p.full_name ||
    p.displayName ||
    p.email ||
    (p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : null) ||
    "You";

  return { id: id ?? null, username };
}

// ✅ extra fallback: try localStorage user/me/profile
function getMeFromStorageFallback() {
  try {
    const keys = [
      "user",
      "me",
      "profile",
      "currentUser",
      "current_user",
      "authUser",
      "auth_user",
      "userData",
      "user_data",
      "account",
      "sessionUser",
      "session_user",
    ];

    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;

      let obj = null;
      try {
        obj = JSON.parse(raw);
      } catch {
        obj = { username: raw };
      }

      const id =
        obj?.id ||
        obj?.userId ||
        obj?.user_id ||
        obj?._id ||
        obj?.sub ||
        obj?.uid ||
        obj?.user?.id ||
        obj?.profile?.id;

      const username =
        obj?.username ||
        obj?.name ||
        obj?.full_name ||
        obj?.displayName ||
        obj?.email ||
        obj?.user?.username ||
        obj?.user?.name ||
        obj?.profile?.username ||
        obj?.profile?.name;

      if (id || username)
        return { id: id ?? null, username: username || "You" };
    }
  } catch {}
  return null;
}

function normName(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}

/** ===== Stars (read-only) ===== */
function StarsReadOnly({ value = 0, size = 16, showValue = true }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  const rounded = Math.round(v);
  const cls = size >= 20 ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="inline-flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const on = i + 1 <= rounded;
        return (
          <Star
            key={i}
            className={cn(
              cls,
              "transition",
              on ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        );
      })}
      {showValue ? (
        <span className="ml-1 text-sm font-semibold text-gray-900">
          {v.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}

/** ===== Stars Picker (interactive) ===== */
function StarsPicker({ value, onChange, size = 24 }) {
  const [hover, setHover] = useState(0);
  const v = Math.max(1, Math.min(5, Number(value || 5)));
  const active = hover || v;

  const cls = size >= 24 ? "h-6 w-6" : "h-5 w-5";
  const labels = {
    1: "Bad",
    2: "Okay",
    3: "Good",
    4: "Very good",
    5: "Excellent",
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="inline-flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1;
          const on = n <= active;
          return (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(n)}
              className="rounded-lg p-1 transition hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-200"
              aria-label={`Rate ${n} star`}
              title={`Rate ${n} star`}
            >
              <Star
                className={cn(
                  cls,
                  "transition-transform",
                  on ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                )}
              />
            </button>
          );
        })}
      </div>
      <div className="text-sm font-semibold text-gray-800">
        {labels[active] || ""}
      </div>
    </div>
  );
}

/** ===== Breakdown bars ===== */
function RatingBreakdown({ reviews = [] }) {
  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      const s = Math.max(1, Math.min(5, Number(r.stars) || 0));
      if (s) c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [reviews]);

  const total = reviews.length || 0;

  return (
    <div className="mt-3 space-y-2">
      {[5, 4, 3, 2, 1].map((n) => {
        const cnt = counts[n] || 0;
        const pct = total ? Math.round((cnt / total) * 100) : 0;
        return (
          <div key={n} className="flex items-center gap-2">
            <div className="w-10 text-xs font-semibold text-gray-700">{n}★</div>
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden border">
              <div
                className="h-full bg-yellow-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-10 text-right text-xs text-gray-600">{cnt}</div>
          </div>
        );
      })}
    </div>
  );
}

function pickId(obj) {
  return (
    obj?.id ??
    obj?.userId ??
    obj?.user_id ??
    obj?._id ??
    obj?.uid ??
    obj?.sub ??
    null
  );
}
function pickUsername(obj) {
  return (
    obj?.username ||
    obj?.name ||
    obj?.full_name ||
    obj?.displayName ||
    obj?.email ||
    null
  );
}

// ✅ يظبط اختلاف شكل /api/profile/me
function normalizeMe(any) {
  if (!any) return null;
  const p = any.profile || any.user || any.me || any;
  const id = pickId(p);
  const username = pickUsername(p);
  if (!id && !username) return null;
  return { id: id ?? null, username: username || "You" };
}

export default function PlaceDetailsView({ lang }) {
  const { placeId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState(null);

  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

  const [meLoading, setMeLoading] = useState(false);
  const [me, setMe] = useState(null);

  const [myReview, setMyReview] = useState(null);
  const [rStars, setRStars] = useState(5);
  const [rText, setRText] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const effectiveMe = useMemo(() => {
    return (
      normalizeMe(me) ||
      normalizeMe(getMeFromStorageFallback()) ||
      normalizeMe(getMeFromTokenFallback()) ||
      null
    );
  }, [me]);

  const avgRating = useMemo(() => {
    if (!reviews?.length) return 0;
    const sum = reviews.reduce((a, r) => a + (Number(r.stars) || 0), 0);
    return sum / reviews.length;
  }, [reviews]);

  const openMapUrl = useMemo(() => {
    if (!place) return "";
    const q = encodeURIComponent(
      [place.name, place.address, place.city, place.state, place.zip]
        .filter(Boolean)
        .join(", ")
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }, [place]);

  const displayUserName = (u) =>
    u?.username ||
    u?.name ||
    u?.full_name ||
    u?.displayName ||
    u?.email ||
    "You";

  const requireLogin = () => {
    notify.error("لازم تسجّل دخول الأول");
    navigate("/auth");
  };

  const fetchPlace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/community/places/${placeId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load place");
      setPlace(data);
    } catch (e) {
      notify.error(e?.message || "Failed to load place");
      setPlace(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/community/places/${placeId}/reviews`,
        {
          headers: { ...authHeaders() },
        }
      );
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.error || "Failed to load reviews");
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      notify.error(e?.message || "Failed to load reviews");
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchMe = async () => {
    if (!isLoggedIn()) {
      setMe(null);
      return;
    }

    const boot =
      normalizeMe(getMeFromStorageFallback()) ||
      normalizeMe(getMeFromTokenFallback());
    if (!me && boot) setMe(boot);

    try {
      setMeLoading(true);
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        headers: { ...authHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (boot) setMe(boot);
        return;
      }
      setMe(normalizeMe(data) || boot);
    } catch {
      setMe(boot || null);
    } finally {
      setMeLoading(false);
    }
  };

  useEffect(() => {
    fetchPlace();
    fetchReviews();
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  // ✅ Detect myReview by id OR name
  useEffect(() => {
    if (!effectiveMe) {
      setMyReview(null);
      setShowReviewForm(false);
      return;
    }

    const myId = effectiveMe?.id ? String(effectiveMe.id) : null;
    const myName = normName(effectiveMe?.username);

    const mineById =
      myId &&
      (reviews.find((r) => String(r.user_id) === myId) ||
        reviews.find((r) => String(r.userId) === myId) ||
        reviews.find((r) => String(r.user?.id) === myId) ||
        reviews.find((r) => String(r.user?.user_id) === myId));

    const mineByName =
      !mineById &&
      myName &&
      reviews.find((r) => {
        const rn = normName(
          r.username ||
            r.name ||
            r.user_name ||
            r.user?.username ||
            r.user?.name
        );
        return rn && rn === myName;
      });

    const mine = mineById || mineByName || null;

    setMyReview(mine);

    if (mine) {
      setRStars(Number(mine.stars) || 5);
      setRText(mine.text || "");
      setShowReviewForm(false);
    } else {
      setRStars(5);
      setRText("");
      setShowReviewForm(true);
    }
  }, [reviews, effectiveMe]);

  const submitOrUpdateReview = async () => {
    if (!isLoggedIn()) return requireLogin();

    const text = rText.trim();
    const stars = Number(rStars);

    if (!text) return notify.error("اكتب رأيك");
    if (!(stars >= 1 && stars <= 5)) return notify.error("Stars must be 1..5");

    try {
      const res = await fetch(
        `${API_BASE}/api/community/places/${placeId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ stars, text }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return requireLogin();
      if (!res.ok) throw new Error(data?.error || "Failed to save review");

      notify.success(myReview ? "Review updated" : "Review added");
      await fetchReviews();
      setShowReviewForm(false);
    } catch (e) {
      notify.error(e?.message || "Failed to save review");
    }
  };

  const startEditMyReview = () => {
    if (!myReview) return;
    setRStars(Number(myReview.stars) || 5);
    setRText(myReview.text || "");
    setShowReviewForm(true);
  };

  const cancelEdit = () => {
    if (myReview) {
      setRStars(Number(myReview.stars) || 5);
      setRText(myReview.text || "");
      setShowReviewForm(false);
    } else {
      setRStars(5);
      setRText("");
      setShowReviewForm(true);
    }
  };

  const deleteMyReview = async () => {
    // ✅ تأكيد إن الكليك وصل للدالة

    if (!isLoggedIn()) return requireLogin();

    const ok = await toastConfirm({
      title: "تأكيد الحذف",
      message: "متأكد عايز تمسح الريفيو بتاعك؟",
      confirmText: "مسح",
      cancelText: "إلغاء",
    });

    console.log("[deleteMyReview] confirm result:", ok);

    if (!ok) return;

    const loadingId = notify.loading("Deleting…");

    try {
      const res = await fetch(
        `${API_BASE}/api/community/places/${placeId}/reviews/me`,
        {
          method: "DELETE",
          headers: { ...authHeaders() },
        }
      );

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) return requireLogin();
      if (!res.ok) throw new Error(data?.error || "Failed to delete review");

      notify.dismiss(loadingId);
      notify.success("Review deleted");

      // ✅ افتح الفورم تاني عشان تقدر تضيف
      setMyReview(null);
      setShowReviewForm(true);
      setRStars(5);
      setRText("");

      await fetchReviews();
    } catch (e) {
      notify.dismiss(loadingId);
      notify.error(e?.message || "Failed to delete review");
    }
  };

  const isReviewMine = (r) => {
    if (!effectiveMe) return false;

    const myId = effectiveMe?.id ? String(effectiveMe.id) : null;
    const myName = normName(effectiveMe?.username);

    const rid =
      r?.user_id || r?.userId || r?.user?.id || r?.user?.user_id || null;
    if (myId && rid && String(rid) === myId) return true;

    const rn = normName(
      r?.username ||
        r?.name ||
        r?.user_name ||
        r?.user?.username ||
        r?.user?.name
    );
    if (myName && rn && rn === myName) return true;

    return false;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          Loading…
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Link
              to="/community"
              className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
          Place not found.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Community
        </Link>

        <a
          href={openMapUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
        >
          <ExternalLink className="h-4 w-4" /> Open Map
        </a>
      </div>

      {/* Place card */}
      <div className="rounded-2xl border bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          {/* Left info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              {place.category || "Place"}
              <span className="text-gray-300">•</span>
              {place.city || "—"}, {place.state || "—"}
            </div>

            <h1 className="text-xl md:text-2xl font-semibold text-gray-900 break-words">
              {place.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                {[place.address, place.city, place.state, place.zip]
                  .filter(Boolean)
                  .join(", ")}
              </span>

              {place.phone ? (
                <a
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border px-3 py-2 hover:bg-gray-100"
                  href={`tel:${String(place.phone).replace(/\s+/g, "")}`}
                >
                  <Phone className="h-4 w-4 text-gray-500" />
                  {place.phone}
                </a>
              ) : null}
            </div>

            {place.description ? (
              <p className="mt-4 text-sm leading-6 text-gray-700">
                {place.description}
              </p>
            ) : null}
            {!place.description && place.notes ? (
              <p className="mt-4 text-sm leading-6 text-gray-700">
                {place.notes}
              </p>
            ) : null}
          </div>

          {/* Right rating card */}
          <div className="w-full md:w-[340px] shrink-0">
            <div className="rounded-2xl border bg-gradient-to-b from-gray-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Rating
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="inline-flex items-center justify-center rounded-2xl bg-black text-white px-3 py-2">
                      <div className="text-2xl font-extrabold leading-none">
                        {avgRating ? avgRating.toFixed(1) : "0.0"}
                      </div>
                    </div>
                    <div className="mt-1">
                      <StarsReadOnly
                        value={avgRating}
                        size={20}
                        showValue={false}
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        {reviews.length} review{reviews.length === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 rounded-xl border bg-white px-3 py-2 text-xs text-gray-700">
                  <Sparkles className="h-4 w-4" />
                  Verified
                </div>
              </div>

              <RatingBreakdown reviews={reviews} />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={openMapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-3 py-2 text-sm text-white hover:opacity-90"
                >
                  <MapPin className="h-4 w-4" /> Directions
                </a>

                {place.phone ? (
                  <a
                    href={`tel:${String(place.phone).replace(/\s+/g, "")}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                ) : (
                  <button
                    disabled
                    className="inline-flex items-center justify-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm opacity-50"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews + Add/Update */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* List */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Reviews</h2>
              <button
                onClick={fetchReviews}
                className="text-sm text-gray-700 hover:underline"
              >
                Refresh
              </button>
            </div>

            {reviewsLoading ? (
              <div className="mt-4 text-sm text-gray-600">Loading reviews…</div>
            ) : reviews.length === 0 ? (
              <div className="mt-4 text-sm text-gray-600">No reviews yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((r) => {
                  const isMine = isReviewMine(r);

                  const safeKey =
                    r.id ||
                    `${r.user_id || r.userId || r.user?.id || "u"}-${
                      r.created_at || "t"
                    }-${r.stars || "s"}`;

                  return (
                    <div
                      key={safeKey}
                      className={cn(
                        "rounded-2xl border p-4 transition",
                        isMine
                          ? "border-black/20 bg-gray-50"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-gray-900 text-sm break-words">
                              {r.username ||
                                r.name ||
                                r.user_name ||
                                r.user?.username ||
                                r.user?.name ||
                                "User"}
                            </div>

                            {isMine ? (
                              <span className="inline-flex items-center rounded-full bg-black text-white px-2 py-0.5 text-[11px] font-semibold">
                                Your review
                              </span>
                            ) : null}

                            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 border px-2 py-0.5">
                              <StarsReadOnly
                                value={Number(r.stars || 0)}
                                size={14}
                                showValue={false}
                              />
                              <span className="text-xs font-semibold text-gray-700">
                                {Number(r.stars || 0)}/5
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {r.created_at
                              ? new Date(r.created_at).toLocaleString()
                              : ""}
                          </div>

                          {isMine && isLoggedIn() ? (
                            <button
                              onClick={startEditMyReview}
                              className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                              title="Edit your review"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-gray-700">
                        {r.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ✅ If has review and clicked Edit => show form under list */}
          {isLoggedIn() && myReview && showReviewForm ? (
            <div className="mt-6 rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-gray-700" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Edit your review
                  </h2>
                </div>

                <button
                  onClick={cancelEdit}
                  className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                  title="Cancel"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700">
                    You are reviewing as
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {meLoading ? "Loading…" : displayUserName(effectiveMe)}
                  </div>
                </div>

                <div className="rounded-2xl border bg-gray-50 p-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Your rating
                  </div>
                  <StarsPicker value={rStars} onChange={setRStars} size={24} />
                  <div className="mt-2 text-xs text-gray-600">
                    Selected: <span className="font-semibold">{rStars}</span>/5
                  </div>
                </div>

                <textarea
                  value={rText}
                  onChange={(e) => setRText(e.target.value)}
                  placeholder="Write your review…"
                  rows={5}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={submitOrUpdateReview}
                    className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    Update review
                  </button>
                  <button
                    onClick={deleteMyReview}
                    className="w-full rounded-xl border bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Tip: قول رأيك بوضوح: جودة الخدمة، الأسعار، المكان، التعامل.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column: Add review OR Your review */}
        <div className="md:col-span-2">
          {!myReview ? (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-gray-700" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Add a review
                  </h2>
                </div>

                {!isLoggedIn() ? (
                  <div className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Lock className="h-4 w-4" /> Login required
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <Pencil className="h-4 w-4" /> One review per user
                  </div>
                )}
              </div>

              {!isLoggedIn() ? (
                <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                  <div className="text-sm text-gray-700">
                    لازم تعمل تسجيل دخول عشان تقدر تسيب تقييم.
                  </div>
                  <button
                    onClick={() => navigate("/auth")}
                    className="mt-3 w-full rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="text-sm font-semibold text-gray-900">
                    Write a review
                  </div>

                  <div className="rounded-2xl border bg-gray-50 p-3">
                    <div className="text-xs font-semibold text-gray-700">
                      You are reviewing as
                    </div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {meLoading ? "Loading…" : displayUserName(effectiveMe)}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-gray-50 p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Your rating
                    </div>
                    <StarsPicker
                      value={rStars}
                      onChange={setRStars}
                      size={24}
                    />
                    <div className="mt-2 text-xs text-gray-600">
                      Selected: <span className="font-semibold">{rStars}</span>
                      /5
                    </div>
                  </div>

                  <textarea
                    value={rText}
                    onChange={(e) => setRText(e.target.value)}
                    placeholder="Write your review…"
                    rows={5}
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                  />

                  <button
                    onClick={submitOrUpdateReview}
                    className="w-full rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
                  >
                    Submit review
                  </button>

                  <p className="text-xs text-gray-500">
                    Tip: قول رأيك بوضوح: جودة الخدمة، الأسعار، المكان، التعامل.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Your review
                </h3>
                <button
                  onClick={startEditMyReview}
                  className="inline-flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              </div>

              <div className="mt-3 rounded-2xl border bg-gray-50 p-3">
                <div className="text-xs text-gray-600">Rating</div>
                <div className="mt-1">
                  <StarsReadOnly
                    value={Number(myReview?.stars || 0)}
                    size={18}
                  />
                </div>
                <div className="mt-3 text-xs text-gray-600">Comment</div>
                <div className="mt-1 text-sm text-gray-800 break-words">
                  {myReview?.text || "—"}
                </div>
              </div>

              <button
                onClick={deleteMyReview}
                className="mt-4 w-full rounded-xl border bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete review
              </button>

              <p className="mt-3 text-xs text-gray-500">
                Tip: لو غيرت رأيك، دوس Edit وعدّل الريفيو.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
